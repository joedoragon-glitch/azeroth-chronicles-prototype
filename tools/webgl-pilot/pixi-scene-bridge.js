/* Live PixiJS scene bridge loaded by the playable PWA.
   Composes the game's real terrain, actors, sprites and lamp positions,
   alongside the retained Canvas cue overlay and independent Canvas fallback.
   The webgl-pilot directory name is preserved for historical compatibility. */
(function (root) {
  'use strict';
  const assert = (x, msg) => {
    if (!x) throw Error(msg);
    return x;
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const hex = (rgb) => (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
  // Original PrototypeVisuals.atmosphere palettes, unmodified.
  const NIGHT = [
    [11, 25, 42, 0.48],
    [12, 32, 44, 0.48],
    [19, 29, 42, 0.5],
    [32, 20, 35, 0.52],
    [27, 19, 43, 0.54],
  ];
  const DAY = [
    [213, 229, 163, 0.045],
    [150, 206, 205, 0.05],
    [221, 219, 184, 0.045],
    [215, 157, 120, 0.05],
    [166, 146, 196, 0.05],
  ];
  // PixiJS FillGradient requires decimal CSS rgba(), including for minuscule alphas.
  // Centralize formatting so no light/grade/vignette can emit exponent notation.
  const rgba = (rgb, a) =>
    'rgba(' +
    rgb
      .slice(0, 3)
      .map((c) => Math.round(clamp(c, 0, 255)))
      .join(',') +
    ',' +
    clamp(a, 0, 1).toFixed(6).replace(/0+$/, '').replace(/\.$/, '') +
    ')';
  // Round subpixel light intensities to stable, reusable visual states.
  const lampOpacity = (a) => Math.round(clamp(a, 0, 1) * 1024) / 1024;
  const MAX_CACHED_LAMP_GRADIENTS = 96;
  function atmosphereLayers({
    region = 0,
    darkness = 0,
    peaceBlend = 0,
    optimized = false,
    warmth = 0,
    phase = 'day',
  } = {}) {
    const i = Math.max(0, Math.min(4, Math.trunc(region) || 0));
    const night = clamp(darkness, 0, 1),
      day = 1 - night,
      peace = clamp(peaceBlend, 0, 1);
    const layers = [];
    if (night > 0) {
      layers.push({
        type: 'night',
        style: 'linear',
        colorStops: [
          { offset: 0, color: rgba(NIGHT[i], NIGHT[i][3] * night) },
          {
            offset: 1,
            color: rgba(
              [9 + 13 * peace, 17 + 14 * peace, 30 + 19 * peace],
              (0.58 - 0.28 * peace) * night,
            ),
          },
        ],
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
      });
    }
    if (day > 0) {
      layers.push({
        type: 'day-tint',
        style: 'solid',
        rgb: DAY[i].slice(0, 3),
        opacity: DAY[i][3] * day,
      });
      if (!optimized)
        layers.push({
          type: 'day-sun',
          style: 'linear',
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
          colorStops: [
            { offset: 0, color: rgba([255, 244, 203], 0.07 * day) },
            { offset: 0.45, color: rgba([255, 255, 255], 0) },
            {
              offset: 1,
              color: rgba(i >= 3 ? [97, 56, 55] : [22, 55, 42], (i >= 3 ? 0.035 : 0.025) * day),
            },
          ],
        });
    }
    if (warmth > 0) {
      const sunset = phase === 'sunset',
        strength = clamp(warmth, 0, 1) * (phase === 'victory-sunrise' ? 1.25 : 1);
      layers.push({
        type: 'warmth',
        style: 'linear',
        start: { x: 0, y: sunset ? 0.15 : 0.8 },
        end: { x: 1, y: sunset ? 0.9 : 0.1 },
        colorStops: [
          {
            offset: 0,
            color: rgba(
              sunset ? [244, 139, 70] : [248, 185, 177],
              (sunset ? 0.23 : 0.18) * strength,
            ),
          },
          { offset: 0.52, color: rgba([255, 216, 143], 0.07 * strength) },
          {
            offset: 1,
            color: rgba(
              sunset ? [103, 64, 126] : [255, 233, 171],
              (sunset ? 0.09 : 0.19) * strength,
            ),
          },
        ],
      });
    }
    return layers;
  }
  // The Canvas artist's final vignette, represented directly as a GPU gradient.
  function vignetteDescription({ darkness = 0, optimized = false } = {}, width, height) {
    if (optimized) return null;
    assert(
      Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0,
      'Positive viewport needed for original vignette',
    );
    const night = clamp(darkness, 0, 1),
      day = 1 - night;
    return {
      type: 'radial',
      textureSpace: 'global',
      center: { x: width * 0.5, y: height * 0.48 },
      innerRadius: Math.min(width, height) * 0.18,
      outerCenter: { x: width * 0.5, y: height * 0.5 },
      outerRadius: Math.max(width, height) * 0.72,
      colorStops: [
        { offset: 0, color: 'rgba(0,0,0,0)' },
        { offset: 1, color: rgba([5 * day, 15 * day, 10 * day], 0.12 + 0.03 * night) },
      ],
    };
  }
  function create({ PIXI, app, width, height } = {}) {
    assert(
      PIXI?.Container && PIXI?.Sprite && PIXI?.Graphics && PIXI?.FillGradient,
      'PixiJS v8 scene primitives required',
    );
    assert(
      app?.stage && app?.renderer && width > 0 && height > 0,
      'GPU application and viewport required',
    );
    const rootStage = new PIXI.Container();
    // Original liquid highlights sit above the baked terrain yet below
    // scenery/actors and the existing atmospheric grade.
    const liquidGraphic = new PIXI.Graphics();
    const fieldGraphic = new PIXI.Graphics();
    const actorsStage = new PIXI.Container();
    const effectsStage = new PIXI.Container();
    app.stage.addChild(rootStage);
    rootStage.addChild(liquidGraphic);
    // Attached lazily to preserve existing empty-scene ordering.
    let fieldSignature = null,
      fieldCount = 0;
    rootStage.addChild(actorsStage);
    rootStage.addChild(effectsStage);
    const actors = new Map(),
      glowObjects = new Map(),
      gradients = new Map(),
      frameTextures = new Map();
    let background = null,
      grade = null,
      gradeGradients = [],
      atmosphereSignature = null,
      vignette = null,
      vignetteGradient = null,
      vignetteSignature = null,
      spritesUpdated = 0,
      groundMarks = 0,
      accessoryActors = 0,
      actorUnderlays = 0,
      actorOverlays = 0,
      resources = new Map();
    let fixtureGraphic = null,
      fixtureSignature = null,
      fixtureCount = 0;
    let backdropTexture = null,
      discarded = 0,
      moteGraphic = null,
      moteCount = 0,
      liquidCount = 0;
    const keyOf = (entity) => String(entity.key);
    function setBackground(texture, x, y, width, height) {
      if (!background) {
        background = new PIXI.Sprite(texture);
        rootStage.addChildAt(background, 0);
      } else background.texture = texture;
      background.tint = 0xffffff;
      background.position.set(x, y);
      // The backing raster can be 1.5x high DPI while the world remains CSS-sized.
      if (Number.isFinite(width) && width > 0) background.width = width;
      if (Number.isFinite(height) && height > 0) background.height = height;
      backdropTexture = texture;
    }
    function setSolidBackground(color, width, height) {
      // Reuse Pixi's 1px white texture instead of scenery-sized GPU buffers.
      setBackground(PIXI.Texture.WHITE, 0, 0, width, height);
      background.tint = color;
    }
    function moveBackground(x, y) {
      assert(background, 'Static original artwork must be loaded before camera moves');
      background.position.set(x, y);
    }
    function registerTexture(id, texture) {
      assert(
        typeof id === 'string' && id && texture?.source,
        'Registered approved art needs a PixiJS texture',
      );
      resources.set(id, texture);
    }
    function hasTexture(id) {
      return resources.has(id);
    }
    // Procedural textures are local to a scene/zoom. Remove their registrations
    // before destroying their source images so long sessions do not leak GPU
    // resource entries across regions and quality changes.
    function unregisterTexture(id) {
      if (!resources.has(id)) return false;
      resources.delete(id);
      for (const [frameId, frame] of frameTextures)
        if (frameId.startsWith(id + ':')) {
          frame.destroy?.(false);
          frameTextures.delete(frameId);
        }
      return true;
    }
    function actorTexture(entity) {
      const texture = assert(
        resources.get(entity.textureId),
        'Missing Azeroth artwork: ' + entity.textureId,
      );
      if (!entity.sourceRect) return texture;
      const [x, y, w, h] = entity.sourceRect;
      assert(
        [x, y, w, h].every(Number.isFinite) &&
          x >= 0 &&
          y >= 0 &&
          w > 0 &&
          h > 0 &&
          x + w <= texture.source.width &&
          y + h <= texture.source.height,
        'Animated sprite frame exceeds original atlas',
      );
      const cacheId = entity.textureId + ':' + [x, y, w, h].join(',');
      if (!frameTextures.has(cacheId))
        frameTextures.set(
          cacheId,
          new PIXI.Texture({ source: texture.source, frame: new PIXI.Rectangle(x, y, w, h) }),
        );
      return frameTextures.get(cacheId);
    }
    // Match the Canvas entityShadow/groundMarker presentation contract.
    // These GPU graphics live in the same depth-sorted stage immediately below
    // each sprite; a 2D overlay would incorrectly draw them over actors.
    function syncWorldIndicators(list) {
      const signature = JSON.stringify(list);
      if (signature === fieldSignature) return;
      fieldGraphic.clear();
      fieldCount = list.length;
      for (const c of list) {
        assert(
          [c.x, c.y, c.rx, c.ry, c.lineWidth].every(Number.isFinite) &&
            c.rx > 0 &&
            c.ry > 0 &&
            c.lineWidth > 0,
          'Finite Choking Ash geometry required',
        );
        fieldGraphic
          .ellipse(c.x, c.y, c.rx, c.ry)
          .fill({ color: 0x786d64, alpha: 0xa0 / 255 })
          .stroke({ color: 0xd4bba0, alpha: 0x88 / 255, width: c.lineWidth });
      }
      if (list.length) rootStage.addChildAt(fieldGraphic, rootStage.children.indexOf(actorsStage));
      else rootStage.removeChild(fieldGraphic);
      fieldSignature = signature;
    }
    function groundGraphic(graphic, ground) {
      const { rx, ry, marker } = ground;
      const zoom = ground.scale || 1;
      graphic.clear();
      if (marker) {
        const important = !!marker.important;
        const hex = marker.color;
        const color = Number.parseInt(hex.slice(1, 7), 16);
        const alpha = Number.parseInt(hex.slice(7, 9), 16) / 255;
        graphic
          .ellipse(0, 9 * zoom, (important ? 28 : 21) * zoom, (important ? 11 : 8) * zoom)
          .stroke({ color, alpha, width: (important ? 2 : 1) * zoom });
        if (important)
          graphic
            .ellipse(0, 9 * zoom, 34 * zoom, 14 * zoom)
            .stroke({ color: 0xf3e2bb, alpha: 0x44 / 255, width: (important ? 2 : 1) * zoom });
      }
      if (ground.ledgerMarked)
        graphic
          .ellipse(0, 3 * zoom, 23 * zoom, 10 * zoom)
          .stroke({ color: 0xebc479, width: 2 * zoom });
      graphic
        .ellipse(4 * zoom, 13 * zoom, rx * 1.18 * zoom, ry * 1.35 * zoom)
        .fill({ color: 0x05100c, alpha: 0x38 / 255 });
      graphic
        .ellipse(1 * zoom, 11 * zoom, rx * zoom, ry * zoom)
        .fill({ color: 0x020906, alpha: 0x66 / 255 });
    }
    // #708: raster-tree regrowth is retained native geometry, not a new texture.
    // Match the unchanged Canvas frontierTreeShoots positions, leaf palette and
    // identity-based optional third shoot; build paths only when identity changes.
    function paintFrontierShoots(graphic, identity) {
      graphic.clear();
      const seed = String(identity || 'tree')
        .split('')
        .reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
      function shoot(x, y, side, size) {
        graphic
          .moveTo(x, y)
          .quadraticCurveTo(x + side * 3, y - 4, x + side * 2, y - 9)
          .stroke({ color: 0x6f8050, width: 1.1, cap: 'round' });
        for (let n = 0; n < 3; n++) {
          const px = x + side * (n % 2 ? 4 : 0),
            py = y - 3 - n * 2.7;
          const rx = 3.4 * size,
            ry = 1.65 * size,
            rotation = side * (n % 2 ? -0.5 : 0.6);
          const cos = Math.cos(rotation),
            sin = Math.sin(rotation);
          for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const u = rx * Math.cos(angle),
              w = ry * Math.sin(angle);
            const lx = px + u * cos - w * sin,
              ly = py + u * sin + w * cos;
            if (i === 0) graphic.moveTo(lx, ly);
            else graphic.lineTo(lx, ly);
          }
          graphic.closePath().fill({ color: n === 2 ? 0xb2c481 : n === 1 ? 0x91ad64 : 0x718c50 });
        }
      }
      shoot(-10, -13, -1, 0.95);
      shoot(8, -10, 1, 0.85);
      if (seed % 3 !== 0) shoot(-2, 7, -1, 0.75);
    }
    // Execute the canonical small Canvas accessory recipe as retained GPU paths.
    // No bitmap, Canvas surface, texture upload, or per-frame path reconstruction.
    function paintOriginalPaths(graphic, painter, gradients = new Map()) {
      graphic.clear();
      const stack = [];
      let path = [];
      const ctx = {
        globalAlpha: 1,
        lineWidth: 1,
        fillStyle: '#000000',
        strokeStyle: '#000000',
        sx: 1,
        sy: 1,
        tx: 0,
        ty: 0,
        save() {
          stack.push([
            this.globalAlpha,
            this.lineWidth,
            this.fillStyle,
            this.strokeStyle,
            this.sx,
            this.sy,
            this.tx,
            this.ty,
          ]);
        },
        restore() {
          [
            this.globalAlpha,
            this.lineWidth,
            this.fillStyle,
            this.strokeStyle,
            this.sx,
            this.sy,
            this.tx,
            this.ty,
          ] = stack.pop();
        },
        translate(x, y) {
          this.tx += x * this.sx;
          this.ty += y * this.sy;
        },
        scale(x, y) {
          this.sx *= x;
          this.sy *= y;
        },
        beginPath() {
          path = [];
        },
        moveTo(x, y) {
          path.push(['moveTo', point(x, y)]);
        },
        lineTo(x, y) {
          path.push(['lineTo', point(x, y)]);
        },
        bezierCurveTo(a, b, c, d, x, y) {
          path.push(['bezierCurveTo', [...point(a, b), ...point(c, d), ...point(x, y)]]);
        },
        closePath() {
          path.push(['closePath', []]);
        },
        arc(x, y, r, start, end) {
          this.ellipse(x, y, r, r, 0, start, end);
        },
        ellipse(x, y, rx, ry, rotation, start, end) {
          if (rotation === 0 && start === 0 && Math.abs(end - Math.PI * 2) < 0.001) {
            path.push([
              'ellipse',
              [...point(x, y), Math.abs(rx * this.sx), Math.abs(ry * this.sy)],
            ]);
          } else {
            const steps = Math.max(8, Math.ceil(Math.abs(end - start) * 16));
            for (let j = 0; j <= steps; j++) {
              const angle = start + ((end - start) * j) / steps,
                u = rx * Math.cos(angle),
                v = ry * Math.sin(angle);
              const p = point(
                x + u * Math.cos(rotation) - v * Math.sin(rotation),
                y + u * Math.sin(rotation) + v * Math.cos(rotation),
              );
              path.push([j ? 'lineTo' : 'moveTo', p]);
            }
          }
        },
        fillRect(x, y, w, h) {
          rectangle(x, y, w, h, this.fillStyle, false);
        },
        strokeRect(x, y, w, h) {
          rectangle(x, y, w, h, this.strokeStyle, true);
        },
        createLinearGradient(x0, y0, x1, y1) {
          return gradient({
            type: 'linear',
            textureSpace: 'global',
            start: xy(point(x0, y0)),
            end: xy(point(x1, y1)),
          });
        },
        createRadialGradient(x0, y0, r0, x1, y1, r1) {
          assert(
            x0 === 0 && y0 === 0 && x1 === 0 && y1 === 0,
            'Canonical local aura gradient required',
          );
          return gradient({
            type: 'radial',
            center: { x: 0.5, y: 0.5 },
            outerCenter: { x: 0.5, y: 0.5 },
            innerRadius: r0 / (r1 * 2),
            outerRadius: 0.5,
          });
        },
        fill() {
          paint(this.fillStyle, false);
        },
        stroke() {
          paint(this.strokeStyle, true);
        },
      };
      const point = (x, y) => [x * ctx.sx + ctx.tx, y * ctx.sy + ctx.ty];
      const xy = ([x, y]) => ({ x, y });
      function gradient(recipe) {
        return {
          recipe,
          colorStops: [],
          addColorStop(offset, color) {
            this.colorStops.push({ offset, color });
          },
        };
      }
      function rectangle(x, y, w, h, style, stroke) {
        const previous = path;
        path = [];
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        paint(style, stroke);
        path = previous;
      }
      function paint(css, stroke) {
        for (const [op, args] of path) graphic[op](...args);
        let style;
        if (css?.recipe) {
          const recipe = { ...css.recipe, colorStops: css.colorStops };
          const key = JSON.stringify(recipe);
          if (!gradients.has(key)) gradients.set(key, new PIXI.FillGradient(recipe));
          style = { fill: gradients.get(key), alpha: ctx.globalAlpha };
        } else {
          assert(/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(css), 'Canonical accessory color required');
          style = {
            color: parseInt(css.slice(1, 7), 16),
            alpha: ctx.globalAlpha * (css.length === 9 ? parseInt(css.slice(7), 16) / 255 : 1),
          };
        }
        if (stroke)
          graphic.stroke({
            ...style,
            width: ctx.lineWidth * Math.sqrt(Math.abs(ctx.sx * ctx.sy)),
            cap: 'round',
            join: 'round',
          });
        else graphic.fill(style);
      }
      painter(ctx);
    }
    function paintSpriteAccessories(graphic, art) {
      assert(root.PrototypeSprites?.drawOverlay, 'Canonical sprite accessory artist required');
      paintOriginalPaths(graphic, (ctx) =>
        root.PrototypeSprites.drawOverlay(
          ctx,
          art,
          { x: 0, y: 0 },
          { overlayScale: art.overlayScale },
          art.scale,
        ),
      );
    }
    function syncDetails(state, item, layer) {
      const details = item.details,
        key = layer === 'underlay' ? 'underlay' : 'overlay';
      if (details?.[layer]) {
        state.detailGradients ||= new Map();
        if (!state[key]) state[key] = new PIXI.Graphics();
        if (state[key + 'Signature'] !== details.signature) {
          paintOriginalPaths(
            state[key],
            (ctx) => details.paint(ctx, details.visual, layer),
            state.detailGradients,
          );
          state[key + 'Signature'] = details.signature;
        }
        state[key].position.set(details.x, details.y);
        state[key].scale.set(details.zoom, details.zoom);
        actorsStage.addChild(state[key]);
      } else if (state[key]) {
        actorsStage.removeChild(state[key]);
        state[key].destroy();
        state[key] = null;
        state[key + 'Signature'] = null;
      }
    }
    function releaseDetails(state) {
      for (const key of ['underlay', 'overlay'])
        if (state[key]) {
          actorsStage.removeChild(state[key]);
          state[key].destroy();
        }
      for (const gradient of state.detailGradients?.values() || []) gradient.destroy?.();
    }
    // Each actor moves/animates as a GPU sprite. Canvas never paints a frame.
    // A one-time procedural body bake is allowed as an explicitly counted source.
    function syncActors(list) {
      assert(Array.isArray(list), 'Complete ordered actor scene list required');
      const next = new Set();
      for (const item of list) {
        const id = keyOf(item);
        assert(id !== 'undefined' && !next.has(id), 'Actor keys must be unique');
        assert(
          item.textureId && resources.has(item.textureId),
          'Missing original game actor texture: ' + String(item.textureId),
        );
        assert(
          [item.x, item.y, item.width, item.height].every(Number.isFinite) &&
            item.width > 0 &&
            item.height > 0,
          'Invalid actor geometry',
        );
        if (item.ground) {
          const g = item.ground;
          assert(
            [g.x, g.y, g.rx, g.ry, g.scale || 1].every(Number.isFinite) &&
              g.rx > 0 &&
              g.ry > 0 &&
              (g.scale === undefined || g.scale > 0),
            'Canvas-matched GPU contact shadow geometry required',
          );
          if (g.marker)
            assert(/^#[0-9a-f]{8}$/i.test(g.marker.color), 'Canvas marker RGBA color required');
        }
        if (item.frontierShoots) {
          const o = item.frontierShoots;
          assert(
            typeof o.id === 'string' &&
              [o.x, o.y, o.zoom, o.visualScale].every(Number.isFinite) &&
              o.zoom > 0 &&
              o.visualScale > 0,
            'Frontier raster shoots need a finite anchor',
          );
        }
        if (item.sourceRect) {
          const rect = item.sourceRect,
            texture = resources.get(item.textureId);
          assert(
            rect.length === 4 &&
              rect.every(Number.isFinite) &&
              rect[0] >= 0 &&
              rect[1] >= 0 &&
              rect[2] > 0 &&
              rect[3] > 0 &&
              rect[0] + rect[2] <= texture.source.width &&
              rect[1] + rect[3] <= texture.source.height,
            'Original animated atlas frame outside loaded texture',
          );
        }
        next.add(id);
      }
      for (const [id, old] of actors) {
        if (!next.has(id)) {
          actorsStage.removeChild(old.sprite);
          if (old.ground) {
            actorsStage.removeChild(old.ground);
            old.ground.destroy();
          }
          if (old.shoots) {
            actorsStage.removeChild(old.shoots);
            old.shoots.destroy();
          }
          if (old.accessories) {
            actorsStage.removeChild(old.accessories);
            old.accessories.destroy();
          }
          releaseDetails(old);
          old.sprite.destroy();
          actors.delete(id);
          discarded++;
        }
      }
      // Sort in identical isometric depth order (x+y) before drawing.
      const ordered = [...list].sort((a, b) => a.depth - b.depth);
      for (const item of ordered) {
        const id = keyOf(item);
        let state = actors.get(id);
        if (!state) {
          state = { sprite: new PIXI.Sprite(actorTexture(item)), frameKey: '' };
          actors.set(id, state);
        }
        const frameKey = item.textureId + ':' + (item.sourceRect || []).join(',');
        if (state.frameKey !== frameKey) {
          state.sprite.texture = actorTexture(item);
          state.frameKey = frameKey;
        }
        // Width/height set before mirroring so the sign is retained.
        state.sprite.width = item.width;
        state.sprite.height = item.height;
        state.sprite.scale.x = (item.flipX ? -1 : 1) * Math.abs(state.sprite.scale.x);
        state.sprite.position.set(item.x + (item.flipX ? item.width : 0), item.y);
        state.sprite.alpha = clamp(item.opacity ?? 1, 0, 1);
        if (item.ground) {
          if (!state.ground) state.ground = new PIXI.Graphics();
          const signature = JSON.stringify({
            rx: item.ground.rx,
            ry: item.ground.ry,
            scale: item.ground.scale,
            marker: item.ground.marker,
            ledgerMarked: item.ground.ledgerMarked,
          });
          if (state.groundSignature !== signature) {
            groundGraphic(state.ground, item.ground);
            state.groundSignature = signature;
          }
          state.ground.position.set(item.ground.x, item.ground.y);
          actorsStage.addChild(state.ground);
        } else if (state.ground) {
          actorsStage.removeChild(state.ground);
          state.ground.destroy();
          state.ground = null;
          state.groundSignature = null;
        }
        syncDetails(state, item, 'underlay');
        actorsStage.addChild(state.sprite);
        // Draw after its own raster but before the next depth-sorted actor.
        if (item.frontierShoots) {
          const o = item.frontierShoots;
          if (!state.shoots) state.shoots = new PIXI.Graphics();
          if (state.shootsIdentity !== o.id) {
            paintFrontierShoots(state.shoots, o.id);
            state.shootsIdentity = o.id;
          }
          const scale = o.zoom * o.visualScale;
          state.shoots.position.set(o.x, o.y);
          state.shoots.scale.set((o.flipX ? -1 : 1) * scale, scale);
          actorsStage.addChild(state.shoots);
        } else if (state.shoots) {
          actorsStage.removeChild(state.shoots);
          state.shoots.destroy();
          state.shoots = null;
          state.shootsIdentity = null;
        }
        if (item.spriteAccessories) {
          const o = item.spriteAccessories;
          if (!state.accessories) state.accessories = new PIXI.Graphics();
          const signature = JSON.stringify([
            o.form,
            o.type,
            o.rangedAim,
            o.frenzy,
            o.scale,
            o.overlayScale,
          ]);
          if (state.accessorySignature !== signature) {
            paintSpriteAccessories(state.accessories, o);
            state.accessorySignature = signature;
          }
          state.accessories.position.set(o.x, o.y);
          state.accessories.scale.set((o.flipX ? -1 : 1) * o.zoom, o.zoom);
          actorsStage.addChild(state.accessories);
        } else if (state.accessories) {
          actorsStage.removeChild(state.accessories);
          state.accessories.destroy();
          state.accessories = null;
          state.accessorySignature = null;
        }
        syncDetails(state, item, 'overlay');
        spritesUpdated++;
      }
      groundMarks = list.filter((item) => item.ground?.ledgerMarked).length;
      accessoryActors = list.filter((item) => item.spriteAccessories).length;
      actorUnderlays = list.filter((item) => item.details?.underlay).length;
      actorOverlays = list.filter((item) => item.details?.overlay).length;
      return { actors: actors.size, removed: discarded };
    }
    function syncLightFixtures(lights, zoom = 1, darkness = 0) {
      const list =
        darkness > 0 ? lights.filter((p) => p.kind === 'window' || p.kind === 'lantern') : [];
      const anchor = list[0] || { x: 0, y: 0 };
      const relative = list.map((p) => ({ ...p, x: p.x - anchor.x, y: p.y - anchor.y }));
      const signature = JSON.stringify([relative, zoom]);
      if (!list.length) {
        if (fixtureGraphic) {
          effectsStage.removeChild(fixtureGraphic);
          fixtureGraphic.destroy();
          fixtureGraphic = null;
        }
        fixtureSignature = null;
        fixtureCount = 0;
        return;
      }
      if (!fixtureGraphic) fixtureGraphic = new PIXI.Graphics();
      if (fixtureSignature !== signature) {
        paintOriginalPaths(fixtureGraphic, (ctx) =>
          root.PrototypeVisuals.drawLightFixtures(ctx, relative),
        );
        fixtureSignature = signature;
      }
      fixtureCount = list.length;
      fixtureGraphic.alpha = darkness;
      fixtureGraphic.position.set(anchor.x * zoom, anchor.y * zoom);
      fixtureGraphic.scale.set(zoom, zoom);
      effectsStage.addChild(fixtureGraphic);
      if (moteGraphic) effectsStage.addChild(moteGraphic);
      if (vignette) effectsStage.addChild(vignette);
    }
    function glowGradient(lamp, opacity, key) {
      if (!gradients.has(key)) {
        gradients.set(
          key,
          new PIXI.FillGradient({
            type: 'radial',
            center: { x: 0.5, y: 0.5 },
            innerRadius: 0,
            outerCenter: { x: 0.5, y: 0.5 },
            outerRadius: 0.5,
            colorStops: [
              { offset: 0, color: rgba(lamp.rgb, opacity) },
              { offset: 0.35, color: rgba(lamp.rgb, opacity * 0.48) },
              { offset: 1, color: rgba(lamp.rgb, 0) },
            ],
          }),
        );
      }
      return gradients.get(key);
    }
    function syncLamps(list) {
      assert(Array.isArray(list), 'Azeroth light source array required');
      for (const lamp of list)
        assert(
          lamp &&
            [lamp.x, lamp.y, lamp.radius, lamp.alpha].every(Number.isFinite) &&
            lamp.radius > 0 &&
            lamp.alpha >= 0 &&
            lamp.alpha <= 1 &&
            Array.isArray(lamp.rgb) &&
            lamp.rgb.length === 3 &&
            lamp.rgb.every((c) => Number.isFinite(c) && c >= 0 && c <= 255),
          'Invalid native light',
        );
      const ids = new Set();
      for (let i = 0; i < list.length; i++) {
        const lamp = list[i],
          opacity = lampOpacity(lamp.alpha);
        // Daylight-adjacent near-zero glows must not generate GPU gradients.
        if (opacity === 0) continue;
        const id = String(i),
          key = lamp.rgb.join(',') + ':' + opacity,
          signature = key + ':' + lamp.radius;
        ids.add(id);
        let state = glowObjects.get(id);
        if (!state) {
          state = { graphic: new PIXI.Graphics(), signature: null, gradientKey: null };
          state.graphic.blendMode = 'screen';
          glowObjects.set(id, state);
          effectsStage.addChild(state.graphic);
        }
        if (state.signature !== signature) {
          state.graphic.clear();
          state.graphic.circle(0, 0, lamp.radius).fill(glowGradient(lamp, opacity, key));
          state.signature = signature;
          state.gradientKey = key;
        }
        state.graphic.position.set(lamp.x, lamp.y);
      }
      for (const [id, state] of glowObjects)
        if (!ids.has(id)) {
          effectsStage.removeChild(state.graphic);
          state.graphic.destroy();
          glowObjects.delete(id);
        }
      // Only release superseded gradients: active Graphics retain their fill.
      if (gradients.size > MAX_CACHED_LAMP_GRADIENTS) {
        const inUse = new Set([...glowObjects.values()].map((state) => state.gradientKey));
        for (const [key, fill] of gradients) {
          if (gradients.size <= MAX_CACHED_LAMP_GRADIENTS) break;
          if (inUse.has(key)) continue;
          fill.destroy?.();
          gradients.delete(key);
        }
      }
      // Original order: atmosphere grade, lights, motes, vignette.
      if (vignette) effectsStage.addChild(vignette);
    }
    function syncLiquidMotion(lines, zoom = 1) {
      assert(
        Array.isArray(lines) && lines.length <= 320 && Number.isFinite(zoom) && zoom > 0,
        'Bounded authored liquid-highlight geometry required',
      );
      liquidGraphic.clear();
      for (const line of lines) {
        assert(
          line &&
            [line.x1, line.y1, line.x2, line.y2, line.width].every(Number.isFinite) &&
            line.width > 0 &&
            /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(line.color),
          'Invalid native water/lava highlight',
        );
        // The original lava streaks are six-digit opaque colors; water is
        // eight-digit translucent. Preserve both exactly.
        const color = Number.parseInt(line.color.slice(1, 7), 16),
          alpha = line.color.length === 9 ? Number.parseInt(line.color.slice(7, 9), 16) / 255 : 1;
        liquidGraphic
          .moveTo(line.x1, line.y1)
          .lineTo(line.x2, line.y2)
          .stroke({ color, alpha, width: line.width * zoom, cap: 'round' });
      }
      liquidCount = lines.length;
    }
    function setAtmosphere(spec) {
      const description = atmosphereLayers(spec);
      const signature = JSON.stringify(description);
      if (signature === atmosphereSignature) return;
      atmosphereSignature = signature;
      if (grade) {
        effectsStage.removeChild(grade);
        grade.destroy({ children: true });
      }
      for (const fill of gradeGradients) fill.destroy?.();
      gradeGradients = [];
      grade = new PIXI.Container();
      for (const layer of description) {
        const shape = new PIXI.Graphics().rect(0, 0, width, height);
        if (layer.style === 'solid') shape.fill({ color: hex(layer.rgb), alpha: layer.opacity });
        else {
          const fill = new PIXI.FillGradient({
            type: 'linear',
            textureSpace: 'local',
            start: layer.start,
            end: layer.end,
            colorStops: layer.colorStops,
          });
          gradeGradients.push(fill);
          shape.fill(fill);
        }
        grade.addChild(shape);
      }
      effectsStage.addChildAt(grade, 0);
    }
    // Screen-space pollen, fog motes and sparks share their presentation
    // recipe with the original Canvas atmosphere. One reusable GPU geometry
    // handles at most 18 deterministic circles, not an animated emitter.
    function clearAtmosphere() {
      // Arena has no environmental presentation: destroy/release retained
      // gradients, grade geometry and vignette, while keeping combat effects.
      if (grade) {
        effectsStage.removeChild(grade);
        grade.destroy({ children: true });
        grade = null;
      }
      for (const fill of gradeGradients) fill.destroy?.();
      gradeGradients = [];
      atmosphereSignature = null;
      if (vignette) {
        effectsStage.removeChild(vignette);
        vignette.destroy();
        vignette = null;
      }
      if (vignetteGradient) {
        vignetteGradient.destroy?.();
        vignetteGradient = null;
      }
      vignetteSignature = null;
    }
    function syncMotes(list, zoom = 1) {
      assert(
        Array.isArray(list) && list.length <= 18 && Number.isFinite(zoom) && zoom > 0,
        'Bounded Canvas atmosphere motes and camera zoom required',
      );
      for (const mote of list)
        assert(
          mote &&
            [mote.x, mote.y, mote.r, mote.alpha].every(Number.isFinite) &&
            mote.r > 0 &&
            mote.alpha >= 0 &&
            mote.alpha <= 1 &&
            Array.isArray(mote.rgb) &&
            mote.rgb.length === 3 &&
            mote.rgb.every((c) => Number.isFinite(c) && c >= 0 && c <= 255),
          'Invalid original atmosphere mote',
        );
      if (!list.length) {
        moteCount = 0;
        if (moteGraphic) moteGraphic.visible = false;
        return;
      }
      if (!moteGraphic) {
        moteGraphic = new PIXI.Graphics();
        effectsStage.addChild(moteGraphic);
      }
      moteGraphic.visible = true;
      moteGraphic.clear();
      for (const mote of list) moteGraphic.circle(mote.x * zoom, mote.y * zoom, mote.r * zoom);
      moteGraphic.fill({ color: hex(list[0].rgb), alpha: list[0].alpha });
      moteCount = list.length;
      // The approved Canvas order is atmosphere grade → lamps → motes → vignette.
      effectsStage.addChild(moteGraphic);
      if (vignette) effectsStage.addChild(vignette);
    }
    function setVignette(spec = {}) {
      const desc = vignetteDescription(spec, width, height),
        signature = JSON.stringify(desc);
      if (signature === vignetteSignature) return;
      vignetteSignature = signature;
      if (vignette) {
        effectsStage.removeChild(vignette);
        vignette.destroy();
        vignette = null;
      }
      if (vignetteGradient) {
        vignetteGradient.destroy?.();
        vignetteGradient = null;
      }
      if (!desc) return;
      vignetteGradient = new PIXI.FillGradient(desc);
      vignette = new PIXI.Graphics().rect(0, 0, width, height).fill(vignetteGradient);
      effectsStage.addChild(vignette);
    }
    // Outside measured frames: compare GPU lights independently from actors.
    async function captureLightingOnly() {
      const prior = actorsStage.visible;
      actorsStage.visible = false;
      try {
        const raw = await app.renderer.extract.pixels({
          target: app.stage,
          frame: new PIXI.Rectangle(0, 0, width, height),
        });
        return raw?.pixels || raw;
      } finally {
        actorsStage.visible = prior;
        app.render();
      }
    }
    // Outside timed frames: capture only the retained real terrain/roads texture.
    async function captureBackgroundOnly() {
      const a = actorsStage.visible,
        e = effectsStage.visible,
        l = liquidGraphic.visible;
      actorsStage.visible = false;
      effectsStage.visible = false;
      liquidGraphic.visible = false;
      try {
        const raw = await app.renderer.extract.pixels({
          target: app.stage,
          frame: new PIXI.Rectangle(0, 0, width, height),
        });
        return raw?.pixels || raw;
      } finally {
        actorsStage.visible = a;
        effectsStage.visible = e;
        liquidGraphic.visible = l;
        app.render();
      }
    }
    function draw() {
      app.render();
    }
    function metrics() {
      return {
        groundMarks,
        accessoryActors,
        actorUnderlays,
        actorOverlays,
        lightFixtures: fixtureCount,
        worldIndicators: fieldCount,
        actors: actors.size,
        lights: glowObjects.size,
        vignetteActive: !!vignette,
        atmosphereMotes: moteCount,
        liquidStrokes: liquidCount,
        textureSources: resources.size,
        lampGradients: gradients.size,
        spriteUpdates: spritesUpdated,
        discarded,
      };
    }
    function destroy() {
      for (const state of actors.values()) {
        state.ground?.destroy();
        state.shoots?.destroy();
        state.accessories?.destroy();
        releaseDetails(state);
        state.sprite.destroy();
      }
      for (const state of glowObjects.values()) state.graphic.destroy();
      if (fixtureGraphic) fixtureGraphic.destroy();
      if (grade) grade.destroy();
      if (vignette) vignette.destroy();
      if (moteGraphic) {
        moteGraphic.destroy();
        moteGraphic = null;
      }
      if (vignetteGradient) vignetteGradient.destroy?.();
      fieldGraphic.destroy();
      liquidGraphic.destroy();
      if (background) background.destroy();
      for (const texture of frameTextures.values()) texture.destroy?.(false);
      for (const gradient of gradients.values()) gradient.destroy?.();
      for (const gradient of gradeGradients) gradient.destroy?.();
      actors.clear();
      glowObjects.clear();
      gradients.clear();
      resources.clear();
      frameTextures.clear();
      app.stage.removeChild(rootStage);
      rootStage.destroy({ children: false });
    }
    return Object.freeze({
      setBackground,
      setSolidBackground,
      moveBackground,
      registerTexture,
      hasTexture,
      unregisterTexture,
      syncLightFixtures,
      syncWorldIndicators,
      syncActors,
      syncLamps,
      setAtmosphere,
      clearAtmosphere,
      syncMotes,
      syncLiquidMotion,
      setVignette,
      captureBackgroundOnly,
      captureLightingOnly,
      draw,
      metrics,
      destroy,
    });
  }
  const api = Object.freeze({ create, atmosphereLayers, vignetteDescription });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AzerothPixiSceneBridge = api;
})(typeof window !== 'undefined' ? window : globalThis);
