'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const Bridge = require('./pixi-scene-bridge.js');
function pixiFixture() {
  const calls = { render: 0, sprites: 0, images: 0, glows: 0, gradients: 0 };
  class Container {
    constructor() {
      this.children = [];
      this.position = {
        x: 0,
        y: 0,
        set: (x, y) => {
          this.position.x = x;
          this.position.y = y;
        },
      };
    }
    addChild(o) {
      this.removeChild(o);
      this.children.push(o);
      o.parent = this;
      return o;
    }
    addChildAt(o, i) {
      this.removeChild(o);
      this.children.splice(i, 0, o);
      o.parent = this;
      return o;
    }
    removeChild(o) {
      const i = this.children.indexOf(o);
      if (i >= 0) this.children.splice(i, 1);
    }
    destroy() {}
  }
  class Sprite {
    constructor(texture) {
      calls.sprites++;
      this.texture = texture;
      this.scale = { x: 1, y: 1 };
      this.position = {
        x: 0,
        y: 0,
        set: (x, y) => {
          this.position.x = x;
          this.position.y = y;
        },
      };
      this.width = 0;
      this.height = 0;
      this.alpha = 1;
    }
    destroy() {}
  }
  class Graphics {
    constructor() {
      this.position = {
        x: 0,
        y: 0,
        set: (x, y) => {
          this.position.x = x;
          this.position.y = y;
        },
      };
      this.blendMode = 'normal';
      this.circles = [];
      this.rects = [];
      this.ellipses = [];
      this.strokes = [];
      this.fills = [];
      this.scale = {
        x: 1,
        y: 1,
        set: (x, y) => {
          this.scale.x = x;
          this.scale.y = y;
        },
      };
      this.curves = [];
      this.lines = [];
      this.closed = 0;
    }
    clear() {
      this.circles = [];
      this.rects = [];
      this.ellipses = [];
      this.strokes = [];
      this.fills = [];
      this.curves = [];
      this.lines = [];
      this.closed = 0;
      return this;
    }
    circle(...args) {
      this.circles.push(args);
      return this;
    }
    rect(...args) {
      this.rects.push(args);
      return this;
    }
    ellipse(...args) {
      this.ellipses.push(args);
      return this;
    }
    moveTo(x, y) {
      this.lastPoint = [x, y];
      return this;
    }
    lineTo(x, y) {
      this.lastEnd = [x, y];
      this.lines.push([x, y]);
      return this;
    }
    bezierCurveTo(...args) {
      this.curves.push(args);
      return this;
    }
    quadraticCurveTo(...args) {
      this.curves.push(args);
      return this;
    }
    closePath() {
      this.closed++;
      return this;
    }
    stroke(g) {
      this.strokes.push(g);
      return this;
    }
    fill(g) {
      this.fillStyle = g;
      this.fills.push(g);
      calls.glows++;
      return this;
    }
    destroy() {}
  }
  class FillGradient {
    constructor(options) {
      this.options = options;
      calls.gradients++;
    }
    destroy() {}
  }
  class Texture {
    constructor({ source, frame }) {
      this.source = source;
      this.frame = frame;
      calls.images++;
    }
    destroy() {}
  }
  class Rectangle {
    constructor(x, y, w, h) {
      this.x = x;
      this.y = y;
      this.width = w;
      this.height = h;
    }
  }
  const PIXI = { Container, Sprite, Graphics, FillGradient, Texture, Rectangle };
  const stage = new Container();
  const app = {
    stage,
    renderer: {},
    render() {
      calls.render++;
    },
  };
  return { PIXI, app, calls };
}
function picture(id = 'art', width = 576, height = 576) {
  return { id, source: { width, height } };
}
function actor(key = 'hero', x = 60, depth = 5) {
  return {
    key,
    x,
    y: 120,
    width: 88,
    height: 102,
    depth,
    textureId: 'hero.png',
    sourceRect: [2, 2, 96, 96],
    opacity: 1,
    flipX: false,
  };
}
test('real sprite atlas frames move as Pixi scene nodes without Canvas painting', () => {
  const { PIXI, app, calls } = pixiFixture();
  const bridge = Bridge.create({ PIXI, app, width: 640, height: 360 });
  bridge.registerTexture('hero.png', picture());
  bridge.setBackground(picture('floor', 960, 680), -160, -160);
  bridge.syncActors([actor()]);
  const first = app.stage.children[0].children[2].children[0];
  assert.equal(first.position.x, 60);
  assert.equal(first.position.y, 120);
  assert.equal(first.texture.frame.width, 96);
  assert.equal(calls.images, 1);
  bridge.syncActors([actor('hero', 105)]);
  const moved = app.stage.children[0].children[2].children[0];
  assert.equal(moved, first, 'same GPU actor must be reused');
  assert.equal(moved.position.x, 105, 'new camera/hero movement updates GPU sprite');
  bridge.draw();
  assert.equal(calls.render, 1);
  assert.equal(calls.images, 1, 'same frame atlas subtexture is cached');
  bridge.destroy();
});
test('Frontier raster recovery shoots are depth-sorted GPU geometry without extra textures', () => {
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 640, height: 360 });
  scene.registerTexture('hero.png', picture());
  const id = 'frontier-burned-12';
  const tree = {
    ...actor('burned-tree', 90, 5),
    frontierShoots: {
      id,
      x: 94,
      y: 123,
      zoom: 1.5,
      visualScale: 1.25,
      flipX: false,
    },
  };
  scene.syncActors([actor('foreground', 220, 10), tree, actor('background', 20, 0)]);
  const stage = app.stage.children[0].children[1];
  assert.equal(stage.children.length, 4, 'tree has raster + shoots, other actors only raster');
  const [background, trunk, shoots, foreground] = stage.children;
  assert.equal(background.position.x, 20);
  assert.equal(trunk.position.x, 90);
  assert.equal(foreground.position.x, 220);
  assert(shoots instanceof PIXI.Graphics, 'native vector geometry');
  assert.equal(shoots.position.x, 94);
  assert.equal(shoots.position.y, 123);
  assert.equal(shoots.scale.x, 1.875);
  const seed = String(id)
    .split('')
    .reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  assert.equal(shoots.strokes.length, 2 + (seed % 3 !== 0 ? 1 : 0));
  assert.equal(shoots.curves.length, shoots.strokes.length, 'curved stems retained');
  assert.equal(shoots.closed, shoots.strokes.length * 3, 'colored leaves retained');
  assert.equal(shoots.fills.length, shoots.strokes.length * 3);
  assert.equal(shoots.strokes[0].color, 0x6f8050);
  assert.deepEqual(
    shoots.curves[0],
    [-13, -17, -12, -22],
    'original first stem control/end points',
  );
  assert.equal(calls.images, 1, 'one preexisting shared sprite atlas frame');
  const leaves = shoots.fills.length;
  scene.syncActors([
    { ...tree, frontierShoots: { ...tree.frontierShoots, x: 120, y: 142, zoom: 2, flipX: true } },
  ]);
  assert.equal(stage.children[1], shoots, 'zoom/reentry reuses GPU geometry');
  assert.equal(shoots.scale.x, -2.5);
  assert.equal(shoots.scale.y, 2.5);
  assert.equal(shoots.position.x, 120);
  assert.equal(shoots.fills.length, leaves, 'identity unchanged: no redraw');
  assert.equal(calls.images, 1, 'no GPU textures created by zoom');
  scene.syncActors([{ ...tree, frontierShoots: null }]);
  assert.equal(stage.children.length, 1, 'no shoots outside eligible renderer path');
  scene.syncActors([tree]);
  assert.equal(stage.children.length, 2, 'reentry draws foliage again');
  scene.syncActors([]);
  assert.equal(stage.children.length, 0, 'offscreen overlays cleaned up');
  scene.destroy();
});
test('issue #708 live liquid strokes stay between cached background and depth-sorted actors', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 600, height: 350 });
  const root = app.stage.children[0];
  assert.equal(root.children.length, 3, 'liquid, actors and atmospheric grade use separate stages');
  const [liquid, actors, effects] = root.children;
  assert.equal(liquid instanceof PIXI.Graphics, true);
  assert.equal(actors instanceof PIXI.Container, true);
  assert.equal(effects instanceof PIXI.Container, true);
  scene.syncLiquidMotion([
    { x1: 10, y1: 20, x2: 40, y2: 25, color: '#9abeb788', width: 1.2 },
    { x1: 70, y1: 35, x2: 75, y2: 48, color: '#ffd076', width: 2 },
  ]);
  assert.equal(scene.metrics().liquidStrokes, 2);
  assert.equal(liquid.strokes.length, 2, 'two native geometry strokes, not new painted texture');
  assert.equal(liquid.strokes[0].alpha, 0x88 / 255);
  assert.equal(liquid.strokes[1].alpha, 1, 'opaque lava has no artificial alpha');
  scene.syncLiquidMotion([]);
  assert.equal(scene.metrics().liquidStrokes, 0);
  assert.equal(liquid.strokes.length, 0);
  scene.destroy();
});
test('frame swaps use bounded reusable Pixi atlas frames', () => {
  const { PIXI, app, calls } = pixiFixture();
  const stage = Bridge.create({ PIXI, app, width: 600, height: 350 });
  stage.registerTexture('hero.png', picture());
  const e = actor();
  stage.syncActors([e]);
  stage.syncActors([{ ...e, sourceRect: [100, 2, 96, 96] }]);
  stage.syncActors([e]);
  assert.equal(calls.images, 2);
  stage.destroy();
});
test('zero or missing textures reject before a partial actor update', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 600, height: 350 });
  scene.registerTexture('hero.png', picture());
  scene.syncActors([actor()]);
  assert.throws(
    () =>
      scene.syncActors([actor(), { ...actor('missing', 150), textureId: 'missing-artwork.png' }]),
    /Missing original game actor texture/,
  );
  assert.equal(scene.metrics().actors, 1);
  assert.throws(() => scene.syncActors([{ ...actor(), width: 0 }]), /geometry/);
  scene.destroy();
});
test('native radial lamps use screen blend and independent per-light transforms', () => {
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 600, height: 350 });
  const light = { x: 180, y: 100, radius: 90, rgb: [255, 207, 132], alpha: 0.3 };
  scene.syncLamps([light]);
  const visual = app.stage.children[0].children[2].children[0];
  assert.equal(visual.blendMode, 'screen');
  assert.equal(visual.position.x, 180);
  assert.equal(visual.circles[0][2], 90);
  const prev = calls.glows;
  scene.syncLamps([{ ...light, x: 250 }]);
  assert.equal(visual.position.x, 250);
  assert.equal(calls.glows, prev, 'light gradient is reused when source merely moves');
  scene.syncLamps([]);
  assert.equal(scene.metrics().lights, 0);
  scene.destroy();
});
test('scene orders real actors by original isometric depth and retains default GPU path', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 600, height: 350 });
  scene.registerTexture('hero.png', picture());
  scene.syncActors([actor('far', 170, 99), actor('near', 20, 1)]);
  const actorContainer = app.stage.children[0].children[1];
  assert.equal(actorContainer.children[0].position.x, 20);
  assert.equal(actorContainer.children[1].position.x, 170);
  scene.destroy();
});

test('Pixi atmosphere mirrors original vertical night tints and bottom alpha', () => {
  const layers = Bridge.atmosphereLayers({ region: 0, darkness: 1, peaceBlend: 0 });
  assert.equal(layers.length, 1);
  assert.equal(layers[0].style, 'linear');
  assert.equal(layers[0].colorStops[0].color, 'rgba(11,25,42,0.48)');
  assert.equal(layers[0].colorStops[1].color, 'rgba(9,17,30,0.58)');
  assert.equal(layers[0].start.y, 0);
  assert.equal(layers[0].end.y, 1);
  const peaceful = Bridge.atmosphereLayers({ region: 4, darkness: 1, peaceBlend: 1 });
  assert.equal(peaceful[0].colorStops[0].color, 'rgba(27,19,43,0.54)');
  assert.equal(peaceful[0].colorStops[1].color, 'rgba(22,31,49,0.3)');
});
test('daytime region tint and diagonal sun gradient preserve original palette', () => {
  const layer = Bridge.atmosphereLayers({ region: 1, darkness: 0, optimized: false });
  assert.equal(layer.length, 2);
  assert.equal(layer[0].style, 'solid');
  assert.equal(layer[0].opacity, 0.05);
  assert.equal(layer[1].colorStops[0].color, 'rgba(255,244,203,0.07)');
  assert.equal(Bridge.atmosphereLayers({ region: 1, darkness: 0, optimized: true }).length, 1);
});
test('Pixi atmosphere avoids rebuilding unchanged grades while lights can move', () => {
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 640, height: 360 });
  scene.setAtmosphere({ region: 0, darkness: 1 });
  const first = calls.glows;
  scene.setAtmosphere({ region: 0, darkness: 1 });
  assert.equal(calls.glows, first);
  scene.setAtmosphere({ region: 1, darkness: 1 });
  assert.ok(calls.glows > first);
  scene.destroy();
});

test('original Canvas radial vignette uses its two real centers and physical radii', () => {
  const night = Bridge.vignetteDescription({ darkness: 1, optimized: false }, 1600, 900);
  assert.equal(night.type, 'radial');
  assert.equal(night.textureSpace, 'global');
  assert.deepEqual(night.center, { x: 800, y: 432 });
  assert.deepEqual(night.outerCenter, { x: 800, y: 450 });
  assert.equal(night.innerRadius, 162);
  assert.equal(night.outerRadius, 1152);
  assert.equal(night.colorStops[0].color, 'rgba(0,0,0,0)');
  assert.equal(night.colorStops[1].color, 'rgba(0,0,0,0.15)');
  const day = Bridge.vignetteDescription({ darkness: 0 }, 1600, 900);
  assert.equal(day.colorStops[1].color, 'rgba(5,15,10,0.12)');
  assert.equal(Bridge.vignetteDescription({ darkness: 1, optimized: true }, 1600, 900), null);
});
test('native vignette remains last after lamp updates and caches unchanged fill', () => {
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 1600, height: 900 });
  scene.syncLamps([{ x: 150, y: 200, radius: 90, rgb: [255, 207, 132], alpha: 0.3 }]);
  scene.setAtmosphere({ region: 0, darkness: 1 });
  scene.setVignette({ darkness: 1, optimized: false });
  const effects = app.stage.children[0].children[2];
  const v = effects.children.at(-1);
  assert.equal(v.fillStyle.options.type, 'radial');
  assert.equal(v.fillStyle.options.outerRadius, 1152);
  const old = calls.glows;
  scene.setVignette({ darkness: 1, optimized: false });
  assert.equal(calls.glows, old, 'unchanged vignette reuses GPU gradient');
  scene.syncLamps([{ x: 200, y: 210, radius: 90, rgb: [255, 207, 132], alpha: 0.3 }]);
  assert.equal(effects.children.at(-1), v, 'final GPU vignette follows night lamp passes');
  assert.equal(scene.metrics().vignetteActive, true);
  scene.setVignette({ darkness: 1, optimized: true });
  assert.equal(scene.metrics().vignetteActive, false);
  scene.destroy();
});

function assertPixiRgba(color) {
  const match = /^rgba\((\d{1,3}),(\d{1,3}),(\d{1,3}),(0(?:\.\d+)?|1(?:\.0+)?)\)$/.exec(color);
  assert.ok(match, 'PixiJS-compatible decimal rgba required: ' + color);
  for (const channel of match.slice(1, 4))
    assert.ok(Number(channel) <= 255, 'RGB channel exceeds 255: ' + color);
}
test('near-nightfall vignette never emits scientific notation in RGB', () => {
  const darkness = 1 - 2.999800030600852e-8;
  const color = Bridge.vignetteDescription({ darkness }, 912, 420).colorStops[1].color;
  assert.equal(color, 'rgba(0,0,0,0.15)');
  assertPixiRgba(color);
});
test('day-night and night-day transition gradients remain Pixi-compatible across regions', () => {
  const darknesses = [0, 1e-10, 0.02, 0.25, 0.5, 0.75, 1 - 2.999800030600852e-8, 1];
  for (const darkness of [...darknesses, ...darknesses.slice().reverse()])
    for (let region = 0; region < 5; region++)
      for (const peaceBlend of [0, 0.23, 0.5, 1]) {
        const spec = { region, darkness, peaceBlend, warmth: 0.4, phase: 'sunset' };
        for (const layer of Bridge.atmosphereLayers(spec))
          for (const stop of layer.colorStops || []) assertPixiRgba(stop.color);
        for (const stop of Bridge.vignetteDescription(spec, 912, 420).colorStops)
          assertPixiRgba(stop.color);
      }
});
test('scene accepts repeated day-night gradient rebuilds without triggering Pixi color parse error', () => {
  const { PIXI, app } = pixiFixture();
  const Gradient = PIXI.FillGradient;
  PIXI.FillGradient = class extends Gradient {
    constructor(options) {
      super(options);
      for (const stop of options.colorStops || []) assertPixiRgba(stop.color);
    }
  };
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  for (const darkness of [0, 0.3, 0.7, 1 - 2.999800030600852e-8, 1, 0.7, 0.3, 0]) {
    scene.setAtmosphere({ region: 0, darkness, warmth: 0.5, phase: 'sunset' });
    scene.setVignette({ darkness, optimized: false });
    scene.draw();
  }
  assert.equal(scene.metrics().vignetteActive, true);
  scene.destroy();
});

test('tiny twilight hero light is never passed as exponent-form rgba to Pixi', () => {
  const { PIXI, app } = pixiFixture();
  const Original = PIXI.FillGradient;
  PIXI.FillGradient = class extends Original {
    constructor(options) {
      super(options);
      for (const stop of options.colorStops || []) assertPixiRgba(stop.color);
    }
  };
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  const light = (alpha) => ({ x: 160, y: 210, radius: 145, rgb: [235, 221, 184], alpha });
  for (const tiny of [2.1597119819343913e-8, 7.778520935683986e-7, 0]) {
    scene.syncLamps([light(tiny)]);
    assert.equal(
      scene.metrics().lights,
      0,
      'subvisible twilight glow must not allocate an invalid gradient',
    );
  }
  for (const alpha of [0.00098, 0.0043, 0.18]) {
    scene.syncLamps([light(alpha)]);
    assert.equal(scene.metrics().lights, 1);
  }
  scene.syncLamps([light(0)]);
  assert.equal(scene.metrics().lights, 0, 'daylight removes the glow');
  scene.destroy();
});
test('thousands of sunset and sunrise frames keep Pixi lamp gradients bounded', () => {
  const { PIXI, app } = pixiFixture();
  const Fill = PIXI.FillGradient;
  let released = 0;
  PIXI.FillGradient = class extends Fill {
    constructor(options) {
      super(options);
      for (const stop of options.colorStops || []) assertPixiRgba(stop.color);
    }
    destroy() {
      released++;
    }
  };
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  for (let i = 0; i < 3000; i++) {
    const darkness = Math.abs(1500 - i) / 1500;
    scene.setAtmosphere({
      region: 0,
      darkness,
      optimized: false,
      warmth: darkness * 0.12,
      phase: i < 1500 ? 'sunrise' : 'sunset',
    });
    scene.syncLamps([
      { x: 150 + (i % 5), y: 180, radius: 145, rgb: [235, 221, 184], alpha: 0.18 * darkness },
      { x: 255, y: 240, radius: 85, rgb: [255, 207, 132], alpha: 0.25 * darkness },
    ]);
    scene.draw();
    assert.ok(
      scene.metrics().lampGradients <= 96,
      'transition must not accumulate unbounded GPU gradient resources',
    );
  }
  assert.ok(released > 0, 'unused twilight gradients are actually destroyed');
  scene.syncLamps([]);
  assert.equal(scene.metrics().lights, 0);
  scene.destroy();
});

test('high-DPI Pixi backdrop retains the same logical geometry as Canvas', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  const backing = picture('high-density-ground', 2028, 1290);
  scene.setBackground(backing, -220, -220, 1352, 860);
  // The background is inserted at root index zero, before the live liquid,
  // actors and atmosphere layers; test the actual backing Sprite.
  const node = app.stage.children[0].children[0];
  assert.equal(node.position.x, -220);
  assert.equal(node.position.y, -220);
  assert.equal(node.width, 1352, 'logical terrain width must not inherit 1.5x bitmap width');
  assert.equal(node.height, 860, 'logical terrain height must not inherit 1.5x bitmap height');
  scene.destroy();
});

test('discarded procedural artwork unregisters after old scene actors are released', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  scene.registerTexture('procedural:vale', picture());
  scene.syncActors([
    {
      key: 'cottage',
      textureId: 'procedural:vale',
      x: 40,
      y: 50,
      width: 100,
      height: 120,
      depth: 1,
      opacity: 1,
    },
  ]);
  assert.equal(scene.metrics().actors, 1);
  scene.syncActors([]);
  assert.equal(scene.metrics().actors, 0);
  assert.equal(scene.unregisterTexture('procedural:vale'), true);
  assert.equal(scene.hasTexture('procedural:vale'), false);
  assert.equal(scene.metrics().textureSources, 0, 'old GPU resources must not persist');
  assert.equal(scene.unregisterTexture('procedural:vale'), false, 'double release is safe');
  scene.destroy();
});

test('Pixi atmosphere restores the same bounded daylight motes as Canvas, before vignette', () => {
  const Visuals = require('../../src/prototype/visuals.js');
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  const daylight = Visuals.atmosphereMotes({
    width: 608,
    height: 280,
    region: 0,
    darkness: 0,
    time: 10,
  });
  assert.equal(daylight.length, 14);
  scene.setAtmosphere({ region: 0, darkness: 0 });
  scene.syncMotes(daylight, 1.5);
  scene.setVignette({ darkness: 0, optimized: false });
  const effects = app.stage.children[0].children[2];
  const moteGraphic = effects.children.at(-2);
  assert.equal(moteGraphic.circles.length, 14, 'one reused GPU batch represents all Canvas motes');
  assert.deepEqual(
    moteGraphic.circles[0],
    [daylight[0].x * 1.5, daylight[0].y * 1.5, daylight[0].r * 1.5],
    'CSS geometry matches Canvas zoom and the shared screen-space motion',
  );
  assert.equal(moteGraphic.fillStyle.color, 0xeadf9e, 'Vale daylight palette preserved');
  assert.equal(moteGraphic.fillStyle.alpha, 0.18, 'Canvas daylight opacity preserved');
  assert.equal(scene.metrics().atmosphereMotes, 14);
  assert.equal(
    effects.children.at(-1).fillStyle.options.type,
    'radial',
    'vignette must stay in front of motes',
  );
  scene.syncMotes(
    Visuals.atmosphereMotes({
      width: 608,
      height: 280,
      region: 0,
      darkness: 1,
      time: 12,
    }),
    1.5,
  );
  assert.equal(effects.children.at(-2), moteGraphic, 'motes reuse one GPU node during motion');
  assert.equal(moteGraphic.fillStyle.color, 0xdcefa8, 'night palette preserved');
  assert.equal(moteGraphic.fillStyle.alpha, 0.24, 'Canvas night alpha preserved');
  scene.syncMotes([], 1.5);
  assert.equal(moteGraphic.visible, false, 'active Optimization Mode suppresses GPU motes');
  assert.equal(scene.metrics().atmosphereMotes, 0);
  scene.destroy();
});

test('Canvas atmosphere mote contract preserves regional counts, deterministic motion and optimization', () => {
  const Visuals = require('../../src/prototype/visuals.js');
  const options = { width: 608, height: 280, region: 0, darkness: 0, time: 10 };
  const first = Visuals.atmosphereMotes(options);
  const same = Visuals.atmosphereMotes(options);
  assert.deepEqual(first, same, 'no randomized particle emitter or game state mutation');
  const moved = Visuals.atmosphereMotes({ ...options, time: 12 });
  assert.notEqual(moved[0].x, first[0].x, 'Canvas drift animates without player movement');
  assert.equal(Visuals.atmosphereMotes({ ...options, region: 3 }).length, 18);
  assert.equal(Visuals.atmosphereMotes({ ...options, region: 4 }).length, 18);
  assert.equal(Visuals.atmosphereMotes({ ...options, dungeon: true }).length, 8);
  assert.equal(Visuals.atmosphereMotes({ ...options, room: true }).length, 8);
  assert.deepEqual(Visuals.atmosphereMotes({ ...options, optimized: true }), []);
  const march = Visuals.atmosphereMotes({ ...options, region: 1 });
  assert.equal(march[0].r, 2.5, 'approved marsh mist scale remains unchanged');
  assert.deepEqual(march[0].rgb, [184, 216, 202]);
  assert.deepEqual(
    Visuals.atmosphereMotes({ ...options, region: 0, darkness: 1 })[0].rgb,
    [220, 239, 168],
    'approved night Vale tint remains unchanged',
  );
});

test('Canvas-matched hero shadows and ground markers sit below sprite and track movement', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  scene.registerTexture('hero.png', picture());
  const hero = {
    ...actor(),
    ground: { x: 112, y: 174, rx: 18, ry: 5.5, marker: { color: '#f5d992bb', important: true } },
  };
  scene.syncActors([hero]);
  const nodes = app.stage.children[0].children[1].children;
  assert.equal(nodes.length, 2, 'one reusable ground graphic and one sprite');
  const [ground, sprite] = nodes;
  assert.equal(sprite.texture.source.width, 576);
  assert.equal(ground.position.x, 112);
  assert.deepEqual(
    ground.ellipses[0],
    [0, 9, 28, 11],
    'first ground shape is the Canvas hero selection ring',
  );
  assert.deepEqual(
    ground.ellipses.at(-1),
    [1, 11, 18, 5.5],
    'dark contact ellipse uses original Canvas radii',
  );
  assert.equal(ground.strokes[0].color, 0xf5d992);
  assert.equal(ground.strokes[0].alpha, 0xbb / 255);
  assert.equal(ground.fills.at(-1).alpha, 0x66 / 255);
  scene.syncActors([{ ...hero, x: 88, ground: { ...hero.ground, x: 160, y: 199, scale: 1.5 } }]);
  assert.deepEqual(
    ground.ellipses.at(-1),
    [1.5, 16.5, 27, 8.25],
    'GPU shadow scales with 150% camera zoom and retains Canvas feet offset',
  );
  const moved = app.stage.children[0].children[1].children;
  assert.equal(moved[0], ground, 'reuse ground artwork without allocating per frame');
  assert.equal(moved[1], sprite, 'same approved actor sprite remains');
  assert.equal(ground.position.x, 160);
  assert.equal(ground.position.y, 199);
  scene.syncActors([]);
  assert.equal(app.stage.children[0].children[1].children.length, 0);
  scene.destroy();
});
test('shadows use Canvas prop sizes and share depth ordering with their actor', () => {
  const { PIXI, app } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 912, height: 420 });
  scene.registerTexture('hero.png', picture());
  const prop = {
    ...actor('house', 170, 5),
    ground: { x: 170, y: 180, rx: 31, ry: 8, marker: null },
  };
  const sheep = {
    ...actor('sheep', 35, 2),
    ground: { x: 35, y: 155, rx: 18, ry: 5.5, marker: null },
  };
  scene.syncActors([prop, sheep]);
  const nodes = app.stage.children[0].children[1].children;
  assert.equal(nodes.length, 4);
  assert.deepEqual(nodes[0].ellipses.at(-1), [1, 11, 18, 5.5]);
  assert.deepEqual(nodes[2].ellipses.at(-1), [1, 11, 31, 8]);
  assert.equal(nodes[1].position.x, 35);
  assert.equal(nodes[3].position.x, 170);
  assert.equal(nodes[0].strokes.length, 0, 'props without rings get only contact shadows');
  scene.destroy();
});
test('#748 fields and victim marks are reusable geometry below actors and clear at expiry', () => {
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 640, height: 360 });
  scene.registerTexture('hero.png', picture());
  scene.setBackground(picture('floor'), 0, 0);
  const cloud = { x: 70, y: 90, rx: 136.8, ry: 65.664, lineWidth: 2.5 };
  scene.syncWorldIndicators([cloud]);
  const root = app.stage.children[0],
    field = root.children[2],
    actors = root.children[3];
  assert.deepEqual(field.ellipses, [[70, 90, 136.8, 65.664]]);
  assert.equal(field.fills[0].alpha, 160 / 255);
  const victim = {
    ...actor(),
    ground: { x: 100, y: 120, rx: 18, ry: 6, scale: 1.5, ledgerMarked: true },
  };
  scene.syncActors([victim]);
  const ground = actors.children[0],
    sprite = actors.children[1];
  assert(ground.ellipses.some((e) => e[1] === 4.5 && e[2] === 34.5 && e[3] === 15));
  const images = calls.images,
    paintCalls = calls.glows;
  scene.syncWorldIndicators([cloud]);
  scene.syncActors([victim]);
  assert.equal(calls.images, images);
  assert.equal(calls.glows, paintCalls);
  assert.equal(actors.children[1], sprite);
  victim.ground.ledgerMarked = false;
  scene.syncActors([victim]);
  scene.syncWorldIndicators([]);
  assert(!root.children.includes(field));
  assert.equal(scene.metrics().groundMarks, 0);
  assert(!ground.ellipses.some((e) => e[1] === 4.5 && e[2] === 34.5));
  scene.destroy();
});
test('#748 registered accessory recipes preserve anchors, state changes and depth without textures', () => {
  global.PrototypeSprites = require('../../src/prototype/sprites.js');
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 640, height: 360 });
  scene.registerTexture('hero.png', picture());
  scene.setBackground(picture('floor'), 0, 0);
  const command = {
    ...actor(),
    spriteAccessories: {
      x: 104,
      y: 122,
      zoom: 1.5,
      flipX: true,
      form: 'ringleader',
      rangedAim: true,
      frenzy: true,
      scale: 1,
      overlayScale: 1,
    },
  };
  scene.syncActors([command]);
  const stage = app.stage.children[0].children[2],
    accessory = stage.children[1];
  assert.deepEqual(accessory.ellipses[0], [0, -56, 5, 5]);
  assert(accessory.ellipses.some((e) => e[1] === 10 && e[2] === 32));
  assert.equal(accessory.position.x, 104);
  assert.equal(accessory.scale.x, -1.5);
  assert.equal(scene.metrics().accessoryActors, 1);
  const paths = calls.glows,
    images = calls.images;
  command.x += 20;
  command.spriteAccessories.x += 20;
  scene.syncActors([command]);
  assert.equal(stage.children[1], accessory);
  assert.equal(calls.glows, paths);
  assert.equal(calls.images, images, 'GPU uploads are independent of tiny live accessories');
  command.spriteAccessories.frenzy = false;
  command.spriteAccessories.rangedAim = false;
  scene.syncActors([command]);
  assert.deepEqual(
    accessory.ellipses,
    [[0, -51, 1.5, 1.5]],
    'ordinary Ringleader keeps its crown glint after aim and frenzy end',
  );
  command.spriteAccessories = null;
  scene.syncActors([command]);
  assert.equal(stage.children.length, 1);
  assert.equal(scene.metrics().accessoryActors, 0);
  scene.syncActors([]);
  assert.equal(scene.metrics().actors, 0);
  scene.destroy();
});

test('#748 canonical TRUE aura changes paths with bounded retained gradients', () => {
  const Renderer = require('../../src/prototype/renderer.js');
  const { PIXI, app, calls } = pixiFixture();
  const scene = Bridge.create({ PIXI, app, width: 640, height: 360 });
  scene.registerTexture('hero.png', picture());
  const command = actor();
  let time = 0;
  command.details = {
    underlay: true,
    overlay: false,
    x: 100,
    y: 120,
    zoom: 1.5,
    visual: {},
    signature: '0',
    paint(ctx) {
      Renderer.drawTrueAura(ctx, {}, { x: 0, y: 0 }, 102, time, false);
    },
  };
  for (let j = 0; j < 120; j++) {
    time = j / 10;
    command.details.signature = String(j);
    scene.syncActors([command]);
  }
  assert.equal(calls.gradients, 2, 'corona and thread gradients are reused across animated frames');
  assert.equal(calls.images, 1, 'aura animation never replaces body textures');
  assert.equal(scene.metrics().actorUnderlays, 1);
  scene.syncActors([]);
  assert.equal(scene.metrics().actorUnderlays, 0);
  scene.destroy();
});


test('#756 deterministic canonical detail rebuild profile (source-clock only)', () => {
  const Renderer = require('../../src/prototype/renderer.js');
  const { PIXI, app, calls } = pixiFixture();
  let clock = 0;
  let clears = 0;
  const originalClear = PIXI.Graphics.prototype.clear;
  PIXI.Graphics.prototype.clear = function () {
    clears++;
    return originalClear.call(this);
  };
  const game = {
    hero: { x: 100, y: 100 },
    s: { rescued: {} },
    regionIndex: () => 0,
    supplyRoom: () => false,
    bundleCollected: () => false,
  };
  const renderer = Renderer.create({
    canvas: { width: 640, height: 360 },
    ctx: {},
    getGame: () => game,
    platform: { cameraZoom: 1.5, cameraAnchor: () => ({ x: 320, y: 180 }) },
    chargePresentation: () => null,
    isPaused: () => false,
    Campaign: { rules: { ambientLife: {}, harbors: {} } },
    PrototypeVisuals: { height: () => 100 },
    PrototypeSprites: { height: () => 100 },
    PrototypeCombatVisuals: {},
    PrototypeEnemyVfxArt: null,
    PrototypeGroundCache: null,
    now: () => clock,
  });
  const scene = Bridge.create({ PIXI, app, width: 640, height: 360 });
  scene.registerTexture('hero.png', picture());
  const variants = [
    ['true-boss', { renderKind: 'enemy', form: 'true', type: 'boss', family: 'citadel' }],
    ['true-nonboss', { renderKind: 'enemy', form: 'true', type: 'mob', family: 'goblin' }],
    ['ringleader', { renderKind: 'enemy', form: 'ringleader', type: 'mob', family: 'goblin' }],
    ['frenzy', { renderKind: 'enemy', form: 'normal', frenzy: true, type: 'mob', family: 'goblin' }],
    ['true-boss-ledger', { renderKind: 'enemy', form: 'true', type: 'boss', family: 'ridge', ledgerOpen: true }],
    ['keeper-cage', { renderKind: 'npc', kind: 'keeper' }],
    ['pursuit-streak', { renderKind: 'enemy', form: 'normal', type: 'mob', pursuitBurst: 1 }],
  ];
  const report = [];
  for (const [label, fields] of variants) {
    scene.syncActors([]);
    const visual = { id: label, x: 120, y: 140, hp: 100, ...fields };
    const command = actor(label);
    const first = clears;
    const gradBefore = calls.gradients;
    const textureBefore = calls.images;
    const begin = performance.now();
    for (let i = 0; i < 60; i++) {
      clock = i * (1000 / 60);
      const details = renderer.actorDetailsFor(visual);
      command.details = details
        ? { ...details, x: 200, y: 160, zoom: 1.5, paint: renderer.paintActorDetails }
        : null;
      scene.syncActors([command]);
    }
    report.push({
      variant: label,
      frames: 60,
      vectorClears: clears - first,
      newGradients: calls.gradients - gradBefore,
      newAtlasFrames: calls.images - textureBefore,
      simulatedCpuMs: Number((performance.now() - begin).toFixed(3)),
    });
  }
  assert.equal(report.length, variants.length);
  assert.equal(report[0].newGradients, 2, 'canonical boss uses two stable gradient recipes');
  assert.equal(report[0].newAtlasFrames, 1, 'original body frame reuses a texture');
  console.log('PIXI_DETAIL_756_PROFILE ' + JSON.stringify(report));
  scene.syncActors([]);
  assert.equal(scene.metrics().actorUnderlays, 0);
  assert.equal(scene.metrics().actorOverlays, 0);
  scene.destroy();
});
