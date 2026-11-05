'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Visuals = require('../src/prototype/visuals.js');
const Campaign = require('../src/prototype/engine.js');
const Core = require('../tools/webgl-pilot/native-webgl2-core.js');

// Use the shared, real fixture catalog: no nighttime-only roof windows.
function probe(night, optimized = true, sources = []) {
  const calls = { radial: 0, gradient: 0, fills: 0, innerFlames: 0, drawnRects: [] };
  const ctx = {
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {},
    stroke() {}, strokeRect() {}, fill() {}, arc() {}, ellipse() {},
    translate() {}, scale() {},
    bezierCurveTo() { calls.innerFlames++; },
    fillRect(x, y, w, h) {
      calls.fills++;
      calls.drawnRects.push([x, y, w, h]);
    },
    createLinearGradient() {
      calls.gradient++;
      return { addColorStop() {} };
    },
    createRadialGradient() {
      calls.radial++;
      return { addColorStop() {} };
    },
  };
  const data = JSON.stringify(sources);
  Visuals.atmosphere(ctx, { width: 400, height: 270 }, 0, {
    night, optimized, hero: { x: 200, y: 140 }, lights: sources,
  });
  assert.equal(JSON.stringify(sources), data, 'lighting cannot modify game sources');
  return calls;
}
const cottage = Visuals.lightingFixtures(
  { id: 'home-1', structure: 'vale-cottage' }, { x: 120, y: 150 },
);
const workshop = Visuals.lightingFixtures(
  { id: 'workshop', structure: 'vale-workshop' }, { x: 220, y: 150 },
);
const refuge = Visuals.lightingFixtures(
  { id: 'refuge', kind: 'rest' }, { x: 190, y: 180 },
);
const roadPost = Visuals.lightingFixtures(
  { id: 'post', structure: 'roadside-lantern' }, { x: 270, y: 150 },
);
assert.equal(cottage.length, 1, 'a cottage has one lamp by its doorway');
assert.equal(workshop.length, 1, 'closed workshops have one exterior security lamp');
assert.equal(refuge.length, 1, 'refuge light comes from its actual wall lantern');
assert.equal(roadPost.length, 1, 'roadside post retains its own glass');
assert(cottage[0].y > 120, 'cottage glass is below the roof, on the facade');
assert(workshop.every((lamp) => lamp.y > 120), 'workshop fixtures are below the roof');
assert.equal(roadPost[0].x, 270, 'post stays centered in the existing lantern frame');
assert.equal(roadPost[0].y, 108, 'post glow matches the recessed glass center');
assert.equal(Visuals.lightingFixtures(
  { id: 'post', structure: 'roadside-lantern' }, { x: 270, y: 150 }, 2,
)[0].y, 66, 'Pixi zoom keeps the luminous center attached to the scaled post');
assert.equal(Visuals.lightingFixtures(
  { id: 'unknown', structure: 'unlit-household' }, { x: 0, y: 0 },
).length, 0, 'unrelated household structures gain no invented lights');
assert.equal(cottage[0].lit, true, 'the selected cottage provides a modest practical accent');
assert.equal(Visuals.lightingFixtures(
  { id: 'home', structure: 'vale-cottage' }, { x: 120, y: 150 },
)[0].lit, false, 'other cottage lamps can stay dark while residents sleep');
assert(cottage[0].alpha < workshop[0].alpha && workshop[0].alpha < refuge[0].alpha,
  'cottage, closed workshop and refuge have a readable night-light hierarchy');
assert.equal(Visuals.lightingFixtures(
  { id: 'regional-cottage', structure: 'march-stilt-house' }, { x: 120, y: 150 }, 1, 1,
).length, 0, 'no Greenwood-style sconce is forced onto other-region dwellings');
const otherRefuge = Visuals.lightingFixtures(
  { id: 'march-rest', kind: 'rest' }, { x: 120, y: 150 }, 1, 1,
);
assert.equal(otherRefuge.length, 1, 'existing other-region refuge lighting is preserved');
assert.equal(otherRefuge[0].role, 'refuge');
const wagon = Visuals.lightingFixtures(
  { id: 'supply-wagon', kind: 'transport', icon: '🐎' }, { x: 200, y: 100 },
);
assert.equal(wagon.length, 1, 'actual wagon-mounted lantern remains a night source');
for (const icon of ['⛵', '🐫', '🐉'])
  assert.equal(Visuals.lightingFixtures(
    { id: 'transport-' + icon, kind: 'transport', icon }, { x: 200, y: 100 },
  ).length, 0, 'no invisible lantern is added to a transport without one');
for (const kind of ['teacher', 'smith', 'alchemist', 'fountain'])
  assert.equal(Visuals.lightingFixtures({ id: kind, kind }, { x: 100, y: 100 }).length, 0,
    'unmounted service ' + kind + ' does not receive a phantom lantern');
for (const kind of ['supplier', 'recruiter', 'quests'])
  assert.equal(Visuals.lightingFixtures({ id: kind, kind }, { x: 100, y: 100 }).length, 1,
    'public service ' + kind + ' retains an attached entrance light');
const sources = [...cottage, ...workshop, ...refuge, ...roadPost,
  { id: 'working-hearth', x: 290, y: 190, kind: 'fire' }];
const day = probe(false, true, sources);
assert.equal(day.radial, 0, 'daylight adds no civic glow');
assert.equal(day.innerFlames, 0, 'all glass remains unlit during daylight');
const night = probe(true, true, sources);
assert.equal(night.radial, sources.length + 1, 'nightlights and hero each emit a glow');
assert.equal(night.innerFlames, 2 * (sources.length - 1), 'only glass has small inner flames');
assert.equal(night.fills - day.fills, sources.length + 1, 'light pools have bounded fill count');
assert(
  !night.drawnRects.some(([, , w, h]) => w === 10 && h === 9 || w === 12 && h === 12),
  'no square lamp panes are stamped onto roofs or streetlamps',
);
const postNight = probe(true, true, roadPost);
assert.equal(postNight.radial, 2, 'the actual street fixture and hero emit glows');
assert.equal(postNight.innerFlames, 2, 'streetlamp illuminates inside its real glass');
const wilderness = probe(true, true, []);
assert.equal(wilderness.radial, 1, 'dark terrain is unchanged');
assert.equal(wilderness.innerFlames, 0, 'no invented wilderness lamp');
assert.doesNotThrow(() => probe(true, false, sources),
  'full atmospheric mode also supports mounted fixtures');
const Renderer = require('../src/prototype/renderer.js');
assert.equal(Renderer.nightLightKind('vale-cottage'), null, 'no all-night rooftop cottage window');
assert.equal(Renderer.nightLightKind('vale-workshop'), null, 'closed workshop windows stay dark');
assert.equal(Renderer.nightLightKind('roadside-lantern'), 'lantern');
for (const structure of ['cookfire', 'warm-brazier', 'ember-pit', 'forge', 'field-kitchen'])
  assert(['fire', 'work-fire'].includes(Renderer.nightLightKind(structure)),
    'authored working ' + structure + ' still illuminates');
const gpuLights = Core.lampGlowCommands(roadPost, 0, { darkness: 1, hero: null });
assert.equal(gpuLights.length, 1, 'GPU renders one real post glow, not another lamp');
assert.equal(gpuLights[0].y, roadPost[0].y, 'Pixi glow aligns with glass center');
assert.deepEqual(
  Visuals.lightingFixtures({ structure: 'vale-workshop', id: 'w' }, { x: 150, y: 120 }),
  Visuals.lightingFixtures({ structure: 'vale-workshop', id: 'w' }, { x: 150, y: 120 }),
  'fixture placement is deterministic and save-pure',
);
const game = new Campaign();
const before = JSON.stringify(game.snapshot());
game.s.clock = 480;
assert(game.night(), 'world clock activates nighttime lighting');
game.s.clock = 120;
assert(!game.night(), 'day turns lamps off');
game.s.clock = JSON.parse(before).clock;
assert.equal(JSON.stringify(game.snapshot()), before, 'render sources never alter campaign saves');
console.log('PASS hierarchy and mounted cottage/workshop/refuge/street/service/wagon lighting, daylight, GPU parity and save purity');

// Carried sources follow the real renderer's facing and bobbed foot anchor.
const { createCanvas } = require('@napi-rs/canvas');
for (const night of [false, true])
  for (const side of [-1, 1])
    for (const captain of [false, true]) {
      const c = new Campaign('normal', 'paladin', () => 0.99);
      c.s.party = [];
      c.s.clock = night ? 480 : 120;
      const e = c.makeEnemy(
        { species: 'wraith', name: 'Lantern wraith', level: 2, hp: 100, damage: 1 },
        { x: 1400, y: 1700 },
      );
      if (captain) {
        e.captain = true;
        e.visualScale = 1.3;
      }
      e.aggro = true;
      c.zone().enemies = [e];
      Object.assign(c.hero, { x: e.x + side * 70, y: e.y });
      const canvas = createCanvas(400, 300);
      let lights;
      const renderer = Renderer.create({
        canvas,
        ctx: canvas.getContext('2d'),
        getGame: () => c,
        platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 200, y: 150 }) },
        Campaign,
        PrototypeCombatVisuals: require('../src/prototype/combat-visuals'),
        PrototypeVisuals: {
          ...Visuals,
          atmosphere(ctx, canvas, region, opts) {
            lights = opts.lights;
            Visuals.atmosphere(ctx, canvas, region, opts);
          },
        },
        now: () => 16000,
        chargePresentation: () => null,
        isPaused: () => false,
      });
      renderer.setOptimizationMode(true);
      const draw = () => {
        c.zone(); // Finish authored enemy normalization before the read-only render.
        const before = JSON.stringify(c.snapshot());
        renderer.draw();
        assert.equal(JSON.stringify(c.snapshot()), before);
        return lights.filter((p) => p.kind === 'carried-lantern');
      };
      const [lamp] = draw();
      assert(lamp, 'living Lantern Wraith emits in day and night, including Optimization Mode');
      const anchor = renderer.screen(e),
        scale = captain ? 1.3 : 1;
      assert(
        Math.abs(lamp.x - anchor.x - side * 22.5 * scale) < 0.4,
        'light follows the lantern hand on either facing',
      );
      assert(
        Math.abs(lamp.y - anchor.y - 1.5 * scale) < 1.3,
        'light follows the bobbed carried glass',
      );
      e.x += 20;
      const [moved] = draw();
      assert(Math.abs(moved.x - lamp.x - 15.2) < 0.01, 'light moves with world position');
      e.hp = 0;
      assert.equal(draw().length, 0, 'dead wraith has no orphan light');
      e.hp = 100;
      e.species = 'stalker';
      assert.equal(draw().length, 0, 'unrelated creatures do not gain lamps');
    }
const carried = { id: 'carried', x: 170, y: 120, kind: 'carried-lantern' };
assert.equal(
  probe(false, true, [carried]).radial,
  1,
  'daylight retains only a restrained carried bloom',
);
const glowing = probe(true, true, [carried]);
assert.equal(glowing.radial, 3, 'night has hero visibility plus carried pool and bright glass');
assert.equal(glowing.innerFlames, 0, 'carried Wraith art has no second fixture painted');
console.log(
  'PASS carried Wraith glass/ground illumination: day/night, moving/facing/scaled hand, Optimization Mode, death exclusion and save-pure rendering',
);

// Real native Canvas artwork smoke: coordinate assertions alone would pass
// even if the procedural painters silently failed to draw their hardware.
for (const [entity, label] of [
  [{ id: 'home-1', renderKind: 'prop', structure: 'vale-cottage', visualScale: 1.4 }, 'cottage'],
  [{ id: 'workshop', renderKind: 'prop', structure: 'vale-workshop', visualScale: 1.4 }, 'workshop'],
  [{ id: 'refuge', renderKind: 'npc', kind: 'rest', visualScale: 1.4 }, 'refuge'],
  [{ id: 'street', renderKind: 'prop', structure: 'roadside-lantern' }, 'street'],
  [{ id: 'supplier', renderKind: 'npc', kind: 'supplier' }, 'service stall'],
  [{ id: 'wagon', renderKind: 'npc', kind: 'transport', icon: '🐎', visualScale: 1.35 }, 'wagon'],
]) {
  const image = createCanvas(360, 280);
  const paint = image.getContext('2d');
  const anchor = { x: 180, y: 190 };
  assert.doesNotThrow(() => Visuals.draw(paint, entity, anchor, 0),
    label + ' physical artwork paints without errors');
  const [lamp] = Visuals.lightingFixtures(entity, anchor, 1, 0);
  assert(lamp, label + ' has an identified physical glass center');
  const before = [...paint.getImageData(Math.round(lamp.x), Math.round(lamp.y), 1, 1).data];
  assert(before[3] > 0, label + ' has day-visible glass or frame pixels at its lamp anchor');
  Visuals.drawLightFixtures(paint, [lamp]);
  const after = [...paint.getImageData(Math.round(lamp.x), Math.round(lamp.y), 1, 1).data];
  assert.notDeepEqual(after, before, label + ' turns on its actual painted glass at night');
}
const sleepingImage = createCanvas(260, 180);
const sleepingGlass = Visuals.lightingFixtures(
  { id: 'home', structure: 'vale-cottage' }, { x: 160, y: 130 },
)[0];
Visuals.drawLightFixtures(sleepingImage.getContext('2d'), [sleepingGlass]);
const sleepingPixels = sleepingImage.getContext('2d').getImageData(0, 0, 260, 180).data;
assert(sleepingPixels.every((value) => value === 0),
  'a sleeping cottage remains unlit even if its dormant fixture is examined');
console.log('PASS real procedural lantern glass at native Canvas anchors and off-duty dark glass');

