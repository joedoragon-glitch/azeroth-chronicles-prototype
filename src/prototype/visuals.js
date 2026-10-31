/* Small, deterministic canvas drawings. Appearance only: no campaign state changes. */
(function (root) {
  'use strict';
  const R = typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js');
  const Highlands =
    typeof PrototypeHighlands !== 'undefined' ? PrototypeHighlands : require('./highlands.js');
  const GreenwoodLandscape =
    typeof PrototypeGreenwoodLandscape !== 'undefined'
      ? PrototypeGreenwoodLandscape
      : require('./greenwood-landscape.js');
  const GreenwoodInteriors =
    typeof PrototypeGreenwoodInteriors !== 'undefined'
      ? PrototypeGreenwoodInteriors
      : require('./greenwood-interiors.js');
  // Ogre-quality craft across the existing catalog: organic contours and worn
  // material joins, with deliberate mineral, weapon and fortification edges retained.
  const organicContours = new Set([
    'grass',
    'wet-grass',
    'bush',
    'marsh-bush',
    'wildflowers',
    'fruit-tree',
    'sapling',
    'reeds',
    'cattails',
    'mangrove',
    'pine-sapling',
    'alpine-scrub',
    'heather',
    'dry-scrub',
    'dead-shrub',
    'pioneer-grasses',
    'pioneer-brush',
    'regrowth-birch',
    'regrowth-willow',
    'battlefield-poppies',
    'pup-nest',
    'reed-nest',
    'mud-nest',
    'animal-pen',
    'pasture-sheep',
    'poultry-yard',
    'hay-rick',
    'garden',
    'furrow-plot',
    'mire-pool',
    'wallow',
    'roost',
    'hatchery',
    'egg-cradle',
  ]);
  const wornContours = new Set([
    'stump',
    'fallen-log',
    'driftwood',
    'dead-tree',
    'charred-stump',
    'burned-log',
    'woodpile',
    'stacked-lumber',
    'crate',
    'barrel',
    'cart',
    'broken-cart',
    'ore-cart',
    'well',
    'coffin',
    'grave-marker',
    'root-table',
    'drift-seat',
    'stone-seat',
    'sleep-roll',
    'bunk',
    'rider-bunk',
    'ridge-bed',
    'thorn-bed',
    'crag-rest',
    'estate-rug',
    'estate-lounge',
    'ridge-supper',
    'ridge-game-corner',
    'ridge-study',
    'laundry',
    'ration',
    'stolen-goods',
    'supply-stack',
    'feed-crate',
    'feed-trough',
    'feeding-trough',
    'fish-rack',
    'fishing-net',
    'drying-rack',
    'lean-to',
    'market',
    'field-kitchen',
    'command-tent',
    'scribe-desk',
    'scroll-stack',
    'caretaker-table',
    'direwolf-kennel',
    'rider-tack-rack',
    'caravan-loading-bay',
    'ore-sorting-bay',
    'heated-drying-shed',
    'heated-washhouse',
    'handler-station',
    'flight-harness-station',
  ]);
  const buildingContours = new Set([
    'vale-cottage',
    'vale-workshop',
    'march-stilt-house',
    'march-boathouse',
    'highland-stone-house',
    'highland-smithy',
    'frontier-patched-house',
    'frontier-workshop',
    'crown-ash-house',
    'crown-forgehouse',
  ]);
  function contourRadius(e) {
    if (organicContours.has(e.structure)) return 3.5;
    if (wornContours.has(e.structure)) return 2.8;
    if (buildingContours.has(e.structure)) return 2.2;
    if (!e.structure && e.renderKind === 'prop' && /🌲|🌳/.test(e.icon || '')) return 2.5;
    if (['rest', 'minor', 'supplier', 'recruiter', 'quests'].includes(e.kind)) return 2.2;
    return 0;
  }
  function allyBodyKind(e) {
    return e?.type === 'archer' ? 'goblin-archer' : e?.class || e?.type || 'worker';
  }
  function barracksVisualState(e) {
    return Number.isFinite(e?.progress) && e.progress < 4
      ? 'construction'
      : e?.full
        ? 'full'
        : 'basic';
  }
  // World-space artwork proportion is presentation-only, shared by procedural
  // fallbacks and registered sprites. Never change gameplay/interaction reach here.
  function featureScale(e) {
    if (!e || e.interactionOnly) return 1;
    const type = e.renderKind;
    const structure = String(e.structure || '').toLowerCase();
    if (type === 'building') return 1.35;
    if (type === 'npc' && e.kind === 'rest') return 1.4;
    if (['transport', 'dungeon', 'mini'].includes(e.kind)) return 1.35;
    if (
      type === 'npc' &&
      e.kind === 'landmark' &&
      /orchard|den|lair|cave|gate|fort|tower|shrine|watch|ruin|treasury|vault|crypt|mine/.test(
        String(e.id || '') + ' ' + String(e.name || ''),
      )
    )
      return /orchard/.test(String(e.id || '') + ' ' + String(e.name || '')) ? 1.3 : 1.35;
    if (type !== 'prop') return 1;
    if (String(e.id || '').startsWith('forest-') && /🌲|🌳/.test(e.icon || '')) return 1.3;
    if (structure === 'mangrove' || /(?:^|[-_])(tree|sapling|pine)(?:$|[-_])/.test(structure))
      return 1.3;
    if (
      /cottage|house|workshop|boathouse|smithy|forgehouse|watchhouse|lean-to|longhouse|dwelling|hut|cabin/.test(
        structure,
      )
    )
      return 1.4;
    if (
      /watchpost|watchtower|fortress|stronghold|command-post|barracks|checkpoint|stockade|shrine|altar|monument|gatehouse|ash-den|wolf-den|roost|lair|treasury|vault|cellar/.test(
        structure,
      ) ||
      /(?:^|[-_])(fort|gate|watch|redoubt|aerie|den|keep|prison)(?:$|[-_])/.test(structure) ||
      /citadel-|dragon-logistics|command-tent|occupation-administration|military-command|goblin-road-camp|goblin-orchard-camp|archer-drill-camp/.test(
        structure,
      )
    )
      return 1.35;
    return 1;
  }
  // A larger original-master export is required before an existing registered
  // sprite can use the world-size increase. Low-resolution runtime PNGs must
  // never be stretched to impersonate a high-density replacement.
  function assetSafeScale(e, entry) {
    const target = featureScale(e);
    if (target <= 1 || !entry) return target;
    const density = target >= 1.35 ? 4.25 : 4;
    const width = Number(entry.width);
    const height = Number(entry.height);
    const logicalWidth = Number(entry.displayWidth) || width;
    const logicalHeight = Number(entry.displayHeight) || height;
    if (!Number.isFinite(width) || !Number.isFinite(height)) return 1;
    if (!Number.isFinite(logicalWidth) || !Number.isFinite(logicalHeight)) return 1;
    if (width < Math.ceil(logicalWidth * density)) return 1;
    if (height < Math.ceil(logicalHeight * density)) return 1;
    return target;
  }
  // Each animal takes short steps then pauses near its authored home. This is
  // read-only presentation: no targetable actors, hit points or combat randomness.
  function ambientAnimalPose(e, index, seconds = 0) {
    const cfg = R.ambientLife?.[e.structure || e.id];
    if (!cfg) return { x: 0, y: 0, facing: 1, walking: false };
    let seed = 2166136261;
    for (const ch of String(e.id || e.structure) + ':' + index)
      seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
    const time = Math.max(0, seconds) + (seed % 2000) / 100,
      period = cfg.walk + cfg.rest,
      step = Math.floor(time / period),
      progress = Math.min(1, (time % period) / cfg.walk),
      point = (n) => ({
        x: Math.cos(seed * 0.001 + n * 2.39996) * cfg.radius,
        y: Math.sin(seed * 0.0017 + n * 2.39996) * cfg.radius,
      }),
      from = point(step),
      to = point(step + 1),
      x = from.x + (to.x - from.x) * progress,
      y = from.y + (to.y - from.y) * progress;
    return {
      x: (x - y) * 0.76,
      y: (x + y) * 0.27,
      facing: to.x - from.x - (to.y - from.y) < 0 ? -1 : 1,
      walking: progress < 1,
    };
  }
  // A burned woodland is a population of trees, not one stamped silhouette.
  // These small, stable shape differences are presentation-only. Keep the roots
  // at their authored positions and match attached new shoots to the same tree.
  function frontierDeadTreeProfile(e) {
    let h = 2166136261 >>> 0;
    for (const ch of String(e.id || `${e.x}:${e.y}:dead-tree`))
      h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    return {
      width: 0.84 + (h & 7) * 0.044,
      height: 0.83 + ((h >>> 3) & 7) * 0.049,
      lean: (((h >>> 6) & 7) - 3.5) * 0.044,
    };
  }
  // Fresh epicormic shoots on surviving burned trunks, including retained raster bodies.
  // Fixed positions derive from identity; no animation or simulation fields.
  function frontierTreeShoots(ctx, e, p, region = 0, raster = false) {
    if (
      region !== 3 ||
      e.renderKind !== 'prop' ||
      !(e.structure === 'dead-tree' || (!e.structure && /🌲|🌳/.test(e.icon || '')))
    )
      return;
    const scale = Number.isFinite(e.visualScale) && e.visualScale > 0 ? e.visualScale : 1;
    const seed = String(e.id || 'tree')
      .split('')
      .reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    if (!raster && e.structure === 'dead-tree') {
      const profile = frontierDeadTreeProfile(e);
      ctx.scale(profile.width, profile.height);
      ctx.rotate(profile.lean);
    }
    ctx.lineCap = 'round';
    const shoot = (x, y, side, size) => {
      ctx.strokeStyle = '#6f8050';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + side * 3, y - 4, x + side * 2, y - 9);
      ctx.stroke();
      for (let n = 0; n < 3; n++) {
        const px = x + side * (n % 2 ? 4 : 0),
          py = y - 3 - n * 2.7;
        ctx.fillStyle = n === 2 ? '#b2c481' : n === 1 ? '#91ad64' : '#718c50';
        ctx.beginPath();
        ctx.ellipse(px, py, 3.4 * size, 1.65 * size, side * (n % 2 ? -0.5 : 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    if (raster) {
      shoot(-10, -13, -1, 0.95);
      shoot(8, -10, 1, 0.85);
      if (seed % 3 !== 0) shoot(-2, 7, -1, 0.75);
    } else {
      shoot(-13, -25, -1, 1);
      shoot(14, -29, 1, 0.9);
      if (seed % 3 !== 0) shoot(3, 7, 1, 0.8);
    }
    ctx.restore();
  }
  function draw(ctx, e, p, region = 0, rescued = false) {
    if (region === 0 && e.renderKind === 'prop' && e.greenwoodInteriorAsset) {
      GreenwoodInteriors.draw(ctx, e, p);
      return;
    }
    if (region === 0 && e.renderKind === 'prop' && e.greenwoodWall) {
      GreenwoodLandscape.drawWall(ctx, e, p);
      return;
    }
    if (region === 0 && e.renderKind === 'prop' && e.greenwoodNature) {
      GreenwoodLandscape.drawNature(ctx, e, p);
      return;
    }
    if (region === 0 && e.renderKind === 'prop' && e.greenwoodFacility) {
      GreenwoodLandscape.drawFacility(ctx, e, p);
      return;
    }
    // A Charmed ally always keeps its canonical species silhouette, abroad too.
    if (e?.renderKind === 'ally' && e.charmOrigin)
      e = { ...e, species: e.charmOrigin.species, ranged: e.charmOrigin.role === 'archer' };
    if (e.renderKind === 'prop' && e.miningFacility) {
      Highlands.drawMining(ctx, e, p);
      return;
    }
    if (region === 2 && e.renderKind === 'prop' && e.highlandsNature) {
      Highlands.drawNature(ctx, e, p);
      return;
    }
    if (e.type === 'pet' && !Object.hasOwn(R.petCompanions, e.petFamily)) return;
    if (e.kind === 'landmark' && e.id?.startsWith('bridge-')) return; // The full deck is drawn in world space.
    ctx.save();
    ctx.translate(p.x, p.y);
    const scale =
      featureScale(e) > 1 && Number.isFinite(e.visualScale) && e.visualScale > 0
        ? e.visualScale
        : 1;
    if (scale !== 1) ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const ink = '#25312d',
      bone = '#e7ddbf',
      steel = '#9eafb6',
      gold = '#d3b46c',
      skin = '#dfb18b';
    const materialRoundness = contourRadius(e);
    const tracePoly = (v, radius = 0) => {
      ctx.beginPath();
      if (!radius) v.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      else {
        for (let j = 0; j < v.length; j++) {
          const p = v[j],
            before = v[(j + v.length - 1) % v.length],
            after = v[(j + 1) % v.length],
            d1 = Math.hypot(before[0] - p[0], before[1] - p[1]),
            d2 = Math.hypot(after[0] - p[0], after[1] - p[1]),
            r = Math.min(radius, d1 * 0.3, d2 * 0.3),
            entry = [
              p[0] + ((before[0] - p[0]) / Math.max(1, d1)) * r,
              p[1] + ((before[1] - p[1]) / Math.max(1, d1)) * r,
            ],
            exit = [
              p[0] + ((after[0] - p[0]) / Math.max(1, d2)) * r,
              p[1] + ((after[1] - p[1]) / Math.max(1, d2)) * r,
            ];
          j ? ctx.lineTo(...entry) : ctx.moveTo(...entry);
          ctx.quadraticCurveTo(...p, ...exit);
        }
      }
      ctx.closePath();
    };
    const poly = (v, c) => {
      ctx.fillStyle = c;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      tracePoly(v, materialRoundness);
      ctx.fill();
      ctx.stroke();
    };
    const fillPoly = (v, c, a = 1) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      tracePoly(v, materialRoundness);
      ctx.fill();
      ctx.restore();
    };
    const softPoly = (vertices, color, radius = 3) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      tracePoly(vertices, radius);
      ctx.fill();
      ctx.stroke();
    };
    const softRect = (x, y, w, h, color, radius = 3) =>
      softPoly(
        [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        color,
        radius,
      );
    const rect = (x, y, w, h, c) =>
      poly(
        [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        c,
      );
    const oval = (x, y, rx, ry, c) => {
      ctx.fillStyle = c;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    const fillOval = (x, y, rx, ry, c, a = 1) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const line = (v, c, w = 2) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      v.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    };
    const eye = (x, y, c = '#f5df9a') => rect(x, y, 2, 2, c);
    const hash = (value) => {
      let h = 2166136261 >>> 0;
      for (const ch of String(value || '')) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    };
    const variant = hash(e.id || e.name || e.species || e.family || e.kind || 'azeroth'),
      flip = variant & 1 ? -1 : 1;
    const shade = (rx = 22, ry = 7, a = 0.24) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#07110d';
      ctx.beginPath();
      ctx.ellipse(0, 10, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const glint = (x, y, c = '#f3d690', r = 2) => {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    function wildProp() {
      if (e.icon === '🪨' || region === 4) {
        rockPiece(0, 9, 25, 34, region === 4);
        line(
          [
            [-12, -14],
            [-3, -5],
            [7, -9],
          ],
          region === 4 ? '#ad91b0' : '#bbc2a4',
          1,
        );
        if (region === 0) foliage(-14, 8, 8, 5, '#7e9160');
        return;
      }
      const jitter = ((variant >>> 3) % 7) - 3;
      ctx.save();
      ctx.translate(jitter * 0.4, 0);
      if (region === 3) craftedDecoration('dead-tree');
      else tree(region === 2 ? 'pine' : region === 1 ? 'willow' : 'sapling');
      ctx.restore();
    }

    function enemyFinish() {
      switch (e.species) {
        case 'goblin':
          rect(-9, -14, 18, 5, '#6d5138');
          fillPoly(
            [
              [-9, -14],
              [0, -14],
              [0, -9],
              [-9, -9],
            ],
            '#2e3427',
            0.2,
          );
          for (const x of [-6, 0, 6]) glint(x, -11, x === 0 ? '#d4b46b' : '#98825b', 1);
          line(
            [
              [-7, -25],
              [-3, -24],
            ],
            '#e2d99d',
            1,
          );
          line(
            [
              [3, -24],
              [7, -25],
            ],
            '#e2d99d',
            1,
          );
          rect(-5, -3, 5, 5, '#785b40');
          if (e.ranged)
            line(
              [
                [-13, -7],
                [-18, 8],
              ],
              '#5f4634',
              3,
            );
          break;
        case 'skeleton':
          for (const y of [-12, -7, -2])
            line(
              [
                [-7, y],
                [7, y],
              ],
              '#c9bea5',
              1,
            );
          line(
            [
              [-6, -16],
              [5, -16],
            ],
            '#fff2cf',
            1,
          );
          fillOval(-2, -29, 7, 7, '#fff4d2', 0.08);
          if (e.guard)
            poly(
              [
                [-12, -18],
                [-17, -8],
                [-11, 1],
                [-5, -9],
              ],
              '#665f59',
            );
          glint(-3, -28, '#e7c56f', 1.4);
          glint(3, -28, '#e7c56f', 1.4);
          break;
        case 'wolf':
          line(
            [
              [-16, -14],
              [-8, -9],
              [0, -15],
              [8, -9],
            ],
            '#667873',
            2,
          );
          line(
            [
              [-28, -14],
              [-18, -18],
              [-7, -15],
            ],
            '#c4c6ad',
            1.4,
          );
          line(
            [
              [8, -12],
              [20, -16],
              [29, -12],
            ],
            '#bfc4ab',
            1.2,
          );
          for (const x of [-15, -5, 7, 17])
            line(
              [
                [x, 2],
                [x + flip * 2, 11],
              ],
              '#d6cfb0',
              1,
            );
          break;
        case 'mireling':
          for (let x = -14; x < 17; x += 8)
            poly(
              [
                [x, -9],
                [x + 3, -15],
                [x + 7, -9],
              ],
              e.ranged ? '#68725a' : '#52684f',
            );
          for (const x of [-14, -4, 6, 16])
            fillOval(x, 0, 3, 2, e.ranged ? '#d2b786' : '#b2c28e', 0.18);
          for (const x of [17, 25, 33]) glint(x, -5, e.ranged ? '#efbc75' : '#d8cf8c', 1);
          if (e.ranged) {
            line(
              [
                [-18, -8],
                [10, 7],
              ],
              '#8d7352',
              3,
            );
            rect(-3, -3, 9, 8, '#745d45');
            line(
              [
                [20, -8],
                [34, -5],
              ],
              '#c2a97c',
              2,
            );
          }
          break;
        case 'reedbeast':
          line(
            [
              [-14, -4],
              [-6, 3],
              [3, -4],
              [11, 3],
            ],
            '#65794f',
            2,
          );
          for (const x of [-18, 18])
            line(
              [
                [x, 8],
                [x + flip * 5, 15],
              ],
              '#4e674a',
              3,
            );
          if (e.hybrid) glint(13, -2, '#b9d6b4', 1.8);
          break;
        case 'ogre':
          // Species detail and loadout are kept together in ogreBody.
          break;
        case 'orc':
          // Anatomy, clothing and equipment are one layered species drawing.
          break;
        case 'archer':
          // The body owns its single leather back quiver.
          break;
        case 'crownguard':
          poly(
            [
              [-13, -35],
              [0, -47],
              [13, -35],
              [8, -31],
              [-8, -31],
            ],
            '#7b6877',
          );
          fillPoly(
            [
              [-13, -35],
              [0, -47],
              [0, -32],
              [-8, -31],
            ],
            '#302d3b',
            0.24,
          );
          line(
            [
              [-8, -17],
              [8, -17],
            ],
            '#c4ae7a',
            2,
          );
          line(
            [
              [-10, -13],
              [10, -5],
            ],
            '#d6c39a',
            1,
          );
          for (const x of [-7, 7]) glint(x, -29, '#d9a87c', 1);
          break;
        case 'ashbeast':
          for (const [x, y] of [
            [-9, -2],
            [2, 4],
            [12, -5],
          ])
            line(
              [
                [x - 3, y],
                [x + 3, y - 4],
              ],
              e.ranged ? '#f0b070' : '#e0a06a',
              1.5,
            );
          for (const x of [-22, 22]) glint(x, -13, e.ranged ? '#ffd08a' : '#efb071', 1.5);
          if (e.ranged) {
            poly(
              [
                [-11, -9],
                [-3, -17],
                [4, -12],
                [11, -18],
                [17, -8],
                [8, -4],
                [-7, -4],
              ],
              '#695466',
            );
            for (const x of [-9, 0, 9]) glint(x, -8, '#df8b5f', 1.5);
          }
          break;
        case 'wraith':
        case 'stalker':
          ctx.save();
          ctx.globalAlpha = 0.35;
          for (const x of [-12, 0, 12])
            oval(x, 7, 8, 4, e.species === 'stalker' ? '#8d6670' : '#8db7b1');
          ctx.restore();
          glint(0, -24, e.species === 'stalker' ? '#e2a0a4' : '#c6eee2', 2);
          break;
      }
      if (e.guard) {
        line(
          [
            [-13, 8],
            [0, 12],
            [13, 8],
          ],
          '#a49573',
          1.5,
        );
        rect(-3, -21, 6, 3, '#b6a373');
      }
    }
    function militaryRingleaderFinish() {
      switch (e.species) {
        case 'crownguard':
          // Crown officers keep the same uniform and body size; rank is shown through a crested helm, command sash and gold-edged pauldrons.
          poly(
            [
              [-11, -38],
              [-7, -49],
              [0, -55],
              [8, -48],
              [12, -38],
              [7, -41],
              [-7, -41],
            ],
            '#806177',
          );
          poly(
            [
              [-2, -55],
              [0, -64],
              [3, -55],
            ],
            '#d1ae72',
          );
          for (const side of [-1, 1])
            poly(
              [
                [side * 10, -18],
                [side * 22, -20],
                [side * 18, -9],
                [side * 9, -8],
              ],
              '#8e858b',
            );
          line(
            [
              [-10, -15],
              [10, 1],
            ],
            '#c39a67',
            4,
          );
          for (const y of [-10, -4, 2])
            line(
              [
                [10, y],
                [19, y - 2],
              ],
              '#d9bf83',
              1.5,
            );
          line(
            [
              [22, -29],
              [22, 10],
            ],
            '#a58a65',
            3,
          );
          poly(
            [
              [24, -27],
              [38, -23],
              [24, -15],
            ],
            '#76586e',
          );
          break;
        case 'orc':
          // The shared Orc body owns the officer's armor and open-faced crest.
          break;
        case 'archer':
          if (region === 3) break; // Rank is sewn into the field uniform.
          // Raider-archer leaders stay recognizably archers but gain a command hood crest, sash and marked quiver.
          poly(
            [
              [-10, -35],
              [-5, -47],
              [0, -52],
              [6, -46],
              [11, -35],
              [5, -39],
              [-5, -39],
            ],
            '#6f554e',
          );
          poly(
            [
              [0, -52],
              [3, -59],
              [6, -51],
            ],
            '#c8a16c',
          );
          line(
            [
              [-10, -15],
              [8, -2],
            ],
            '#c39b67',
            3,
          );
          rect(-19, -5, 8, 10, '#7b5c45');
          for (const y of [-26, -20, -14])
            line(
              [
                [-22, y],
                [-13, y - 5],
              ],
              '#e4c98c',
              1.5,
            );
          poly(
            [
              [-24, -30],
              [-18, -35],
              [-12, -29],
            ],
            '#a36959',
          );
          break;
      }
      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = '#d4b36f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 11, 25, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    function captainFinish() {
      if (!(e.captain || e.roomCaptain)) return;
      switch (e.captainVisualIdol || e.captainMentor) {
        case 'thorn':
          // Goblin disciple: wolf trophies and claw marks, but still unmistakably goblin.
          poly(
            [
              [-14, -18],
              [-19, -28],
              [-11, -26],
              [-6, -18],
            ],
            '#8f8063',
          );
          for (const [x, y] of [
            [-8, -8],
            [0, -10],
            [8, -8],
          ])
            poly(
              [
                [x - 2, y],
                [x, y - 5],
                [x + 2, y],
              ],
              bone,
            );
          line(
            [
              [-10, -3],
              [9, 2],
            ],
            '#5f7b50',
            2,
          );
          line(
            [
              [-8, 1],
              [11, 6],
            ],
            '#5f7b50',
            2,
          );
          glint(14, -16, '#d9c173', 1.5);
          break;
        case 'mire':
          // Mireling disciple: heavier jaw-band and Mirejaw-like dorsal trophies, no foreign anatomy.
          for (const x of [-16, -5, 6])
            poly(
              [
                [x, -8],
                [x + 5, -18],
                [x + 10, -8],
              ],
              '#7c765b',
            );
          line(
            [
              [16, -7],
              [35, -5],
            ],
            '#b9aa78',
            2,
          );
          for (const x of [19, 27, 35]) glint(x, -3, '#d9c984', 1.2);
          break;
        case 'ridge':
          // Horned humanoid disciple; ordinary Treasury Wolf guards keep their bodies.
          rect(-16, -24, 32, 7, '#938b78');
          for (const x of [-11, 0, 11]) rect(x - 3, -24, 6, 6, '#6f7470');
          glint(0, -22, '#d9c984', 1.2);
          break;
        case 'darklord':
          // Dreadmaw preserves his original Dark Lord fanboy identity even though Cindermaw is now his combat mentor: obsidian harness and Crown sigil on the Ash-beast carapace.
          poly(
            [
              [-16, -9],
              [-7, -18],
              [0, -12],
              [7, -18],
              [16, -9],
              [10, -3],
              [-10, -3],
            ],
            '#51495c',
          );
          poly(
            [
              [0, -16],
              [5, -10],
              [0, -4],
              [-5, -10],
            ],
            '#9f79aa',
          );
          line(
            [
              [-11, 2],
              [0, 7],
              [11, 2],
            ],
            '#b39272',
            2,
          );
          for (const x of [-18, 18]) glint(x, -12, '#d29ab5', 1.5);
          break;
        case 'warlord':
          // Cinder's imitation kit and inspection ledger are integrated in orcBody.
          break;
      }
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#e0b96f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 11, 25, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    function bossPolish(family, completeArmor = false) {
      switch (family) {
        case 'thorn':
          for (const side of [-1, 1]) {
            line(
              [
                [side * 10, -23],
                [side * 19, -40],
                [side * 27, -45],
              ],
              '#79664c',
              3,
            );
            line(
              [
                [side * 19, -39],
                [side * 30, -35],
              ],
              '#79664c',
              2,
            );
          }
          for (const x of [-18, -8, 4, 15])
            poly(
              [
                [x, -8],
                [x + 4, -14],
                [x + 8, -7],
              ],
              '#58704b',
            );
          break;
        case 'mire':
          for (let x = -18; x < 20; x += 9)
            poly(
              [
                [x, -11],
                [x + 4, -22],
                [x + 9, -10],
              ],
              '#53694f',
            );
          for (const x of [21, 29, 37])
            poly(
              [
                [x, 0],
                [x + 3, 4],
                [x + 6, 0],
              ],
              bone,
            );
          line(
            [
              [-22, 4],
              [18, 5],
            ],
            '#4d604b',
            2,
          );
          break;
        case 'crypt':
          poly(
            [
              [-17, -42],
              [-10, -49],
              [-4, -44],
              [0, -52],
              [5, -44],
              [12, -50],
              [18, -42],
            ],
            '#8c826e',
          );
          for (const y of [-13, -6])
            line(
              [
                [-13, y],
                [13, y],
              ],
              '#c9bea8',
              2,
            );
          line(
            [
              [18, -2],
              [31, 11],
            ],
            '#7f7665',
            2,
          );
          break;
        case 'archive':
          ctx.save();
          ctx.globalAlpha = 0.45;
          for (const r of [27, 34]) {
            ctx.strokeStyle = '#8fc8c5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 7, r, r * 0.32, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
          for (const x of [-11, 0, 11]) oval(x, -11, 2, 3, '#9eb8a8');
          break;
        case 'ridge':
          poly(
            [
              [-22, -19],
              [-31, -24],
              [-28, -10],
              [-18, -8],
            ],
            '#9b9487',
          );
          poly(
            [
              [18, -19],
              [30, -24],
              [28, -9],
              [18, -8],
            ],
            '#83796e',
          );
          line(
            [
              [-10, -35],
              [0, -43],
              [10, -35],
            ],
            '#d2c8a5',
            2,
          );
          for (const x of [24, 31]) glint(x, -31, '#e1d6b0', 1);
          break;
        case 'mine':
          for (const [x, y] of [
            [-12, -27],
            [0, -18],
            [12, -28],
            [-7, -5],
            [9, 0],
          ]) {
            line(
              [
                [x - 4, y + 4],
                [x, y - 4],
                [x + 4, y + 4],
              ],
              '#e7c97e',
              1.7,
            );
            glint(x, y, '#f2d58b', 1);
          }
          poly(
            [
              [-29, -20],
              [-36, -29],
              [-25, -31],
            ],
            '#a5afa3',
          );
          poly(
            [
              [29, -18],
              [36, -27],
              [25, -30],
            ],
            '#a5afa3',
          );
          break;
        case 'warlord':
          // Complete Warlord kit is drawn with the shared Orc anatomy.
          break;
        case 'abyss':
          for (const side of [-1, 1]) {
            line(
              [
                [side * 8, -42],
                [side * 16, -60],
              ],
              '#d6c2a3',
              2.5,
            );
            poly(
              [
                [side * 7, -17],
                [side * 14, -25],
                [side * 20, -15],
              ],
              '#8f617c',
            );
          }
          for (const y of [-18, -9, 0])
            line(
              [
                [-7, y],
                [7, y],
              ],
              '#d6a98d',
              2,
            );
          break;
        case 'citadel':
          if (completeArmor) break;
          for (const y of [-21, -12, -3])
            line(
              [
                [-15, y],
                [15, y],
              ],
              '#b2c0bc',
              2,
            );
          for (const x of [-18, 18])
            poly(
              [
                [x, -11],
                [x + (x < 0 ? -8 : 8), -18],
                [x + (x < 0 ? -7 : 7), -5],
              ],
              '#8fa3a4',
            );
          glint(0, -15, '#ffc97a', 3);
          break;
        case 'darklord':
          ctx.save();
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = '#bb8cc0';
          for (const r of [25, 33]) {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 6, r, r * 0.28, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
          for (const [x, y] of [
            [-10, -17],
            [0, -9],
            [10, -17],
          ])
            poly(
              [
                [x - 3, y],
                [x, y - 5],
                [x + 3, y],
                [x, y + 5],
              ],
              '#b78ab8',
            );
          line(
            [
              [19, -22],
              [27, -2],
            ],
            '#dbc5dd',
            2,
          );
          break;
      }
      if (e.form === 'true') {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#f1d28a';
        ctx.lineWidth = 2;
        for (const r of [31, 39]) {
          ctx.beginPath();
          ctx.ellipse(0, 11, r, r * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        for (const x of [-24, 24]) glint(x, -34, '#f6df9f', 2);
      }
    }
    function sword(x, y) {
      poly(
        [
          [x, y],
          [x + 3, y - 25],
          [x + 6, y],
          [x + 3, y + 3],
        ],
        steel,
      );
      line(
        [
          [x - 3, y + 3],
          [x + 9, y + 3],
        ],
        gold,
        3,
      );
      line(
        [
          [x + 3, y + 3],
          [x + 3, y + 11],
        ],
        '#75573c',
        3,
      );
    }
    function shield(x, y, c) {
      poly(
        [
          [x - 8, y - 8],
          [x + 8, y - 8],
          [x + 7, y + 7],
          [x, y + 14],
          [x - 7, y + 7],
        ],
        c,
      );
      line(
        [
          [x, y - 6],
          [x, y + 9],
        ],
        gold,
      );
    }
    function bow(x, y) {
      line(
        [
          [x, y - 19],
          [x + 8, y - 11],
          [x + 10, y],
          [x + 7, y + 12],
          [x, y + 19],
        ],
        '#ba9562',
        3,
      );
      line(
        [
          [x, y - 19],
          [x, y + 19],
        ],
        '#e9d7ac',
        1,
      );
      line(
        [
          [x - 6, y],
          [x + 17, y],
        ],
        '#c5bb95',
        1.5,
      );
    }
    // Art construction helpers: articulated bodies and tailored equipment.
    // All coordinates are presentation-local; no actor/state/collision is changed.
    function shaped(color, trace, width = 1.2) {
      ctx.fillStyle = color;
      ctx.strokeStyle = ink;
      ctx.lineWidth = width;
      ctx.beginPath();
      trace();
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    function expressionLips(x, y, warm, wry, tone) {
      // A tapered upper lip with a cupid's bow and a rounded lower lip.
      // Both follow the existing expression curve; the old mouth is not painted.
      const point = (t) => {
        const inv = 1 - t,
          ax = x - 2.5,
          ay = y + 5,
          bx = x + 0.5,
          by = y + (warm ? 8 : wry ? 5.8 : 5),
          cx = x + 3,
          cy = y + (wry ? 3.6 : 5);
        const dx = 2 * inv * (bx - ax) + 2 * t * (cx - bx),
          dy = 2 * inv * (by - ay) + 2 * t * (cy - by),
          len = Math.hypot(dx, dy);
        return {
          x: inv * inv * ax + 2 * inv * t * bx + t * t * cx,
          y: inv * inv * ay + 2 * inv * t * by + t * t * cy,
          nx: -dy / len,
          ny: dx / len,
        };
      };
      const trace = (side) => {
        ctx.beginPath();
        for (let j = 0; j <= 24; j++) {
          const t = j / 24,
            p = point(t),
            taper = Math.pow(Math.sin(Math.PI * t), 0.8),
            width =
              side < 0
                ? taper * (0.9 - 0.45 * Math.exp(-Math.pow((t - 0.5) / 0.12, 2)))
                : taper * 0.9;
          const xx = p.x + p.nx * width * side,
            yy = p.y + p.ny * width * side;
          j ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
        }
        for (let j = 24; j >= 0; j--) {
          const p = point(j / 24);
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fill();
      };
      ctx.fillStyle = tone;
      trace(-1);
      trace(1);
      ctx.strokeStyle = '#7c3c4d';
      ctx.lineWidth = 0.34;
      ctx.beginPath();
      for (let j = 0; j <= 24; j++) {
        const p = point(j / 24);
        j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    }

    function face(x, y, color = skin, bulk = 1, aged = false, mood = 'steady', lipColor = null) {
      oval(x, y, 8 * bulk, 9, color);
      fillOval(x - 2 * bulk, y - 3, 4 * bulk, 4, '#fff1d5', 0.17);
      const warm = ['warm', 'bright', 'amused', 'gentle'].includes(mood),
        sly = mood === 'sly',
        wry = mood === 'wry' || sly;
      for (const side of [-1, 1]) {
        line(
          [
            [x + side * 2.5 * bulk, y - (warm ? 3.4 : wry ? (side < 0 ? 4 : 2.5) : 2)],
            [x + side * 5 * bulk, y - (mood === 'stern' ? 4 : wry ? (side < 0 ? 5 : 3) : 3)],
          ],
          '#51483c',
          warm ? 0.8 : 1.2,
        );
        oval(
          x + side * 3.2 * bulk + (sly ? 0.6 : 0),
          y - 0.5,
          warm ? 1.1 : 0.85,
          sly ? 0.65 : mood === 'bright' ? 1.7 : 1.1,
          '#293a35',
        );
        if (warm) fillOval(x + side * 3.2 * bulk - 0.2, y - 1, 0.35, 0.45, '#f9f1d7');
        if (sly)
          line(
            [
              [x + side * 3.2 * bulk - 1.4, y - 1.3],
              [x + side * 3.2 * bulk + 1.5, y - 0.9],
            ],
            '#51483c',
            0.8,
          );
        if (aged)
          line(
            [
              [x + side * 5 * bulk, y + 2],
              [x + side * 6 * bulk, y + 3],
            ],
            '#987864',
            0.65,
          );
      }
      line(
        [
          [x, y],
          [x - 1, y + 3],
          [x + 1.5, y + 3],
        ],
        '#a67960',
        0.8,
      );
      if (lipColor) expressionLips(x, y, warm, wry, lipColor);
      else {
        ctx.strokeStyle = '#825a50';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - 2.5, y + 5);
        ctx.quadraticCurveTo(x + 0.5, y + (warm ? 8 : wry ? 5.8 : 5), x + 3, y + (wry ? 3.6 : 5));
        ctx.stroke();
      }
      if (warm)
        for (const side of [-1, 1]) fillOval(x + side * 5, y + 3, 1.8, 1.1, '#d88f86', 0.23);
    }
    function coiffure(style, color = '#76553e') {
      // Distinct silhouettes belong to the identity, never to random animation state.
      if (style === 'bun') oval(10, -39, 6, 6, color);
      if (style === 'pony')
        shaped(color, () => {
          ctx.moveTo(8, -37);
          ctx.bezierCurveTo(23, -43, 23, -19, 14, -15);
          ctx.quadraticCurveTo(19, -29, 8, -31);
        });
      if (style === 'curls')
        for (const [x, y] of [
          [-9, -34],
          [-11, -28],
          [-9, -22],
          [9, -34],
          [11, -28],
          [9, -22],
        ])
          oval(x, y, 4, 4, color);
      if (style === 'bob')
        shaped(color, () => {
          ctx.moveTo(-9, -35);
          ctx.lineTo(-12, -22);
          ctx.lineTo(-6, -20);
          ctx.lineTo(-6, -32);
          ctx.lineTo(6, -32);
          ctx.lineTo(7, -20);
          ctx.lineTo(12, -23);
          ctx.lineTo(9, -36);
        });
      shaped(color, () => {
        ctx.moveTo(-8, -32);
        ctx.quadraticCurveTo(-12, -41, 0, -41);
        ctx.quadraticCurveTo(11, -41, 9, -31);
        ctx.lineTo(6, -35);
        ctx.lineTo(1, -33);
        ctx.lineTo(-2, -36);
        ctx.quadraticCurveTo(-6, -34, -8, -32);
      });
      line(
        [
          [-6, -36],
          [-2, -38],
          [4, -38],
        ],
        '#e7d6ad',
        0.65,
      );
      if (style === 'braid')
        for (let y = -29; y <= -13; y += 4) {
          oval(10, y, 3, 3, color);
          line(
            [
              [8, y - 1],
              [12, y + 1],
            ],
            '#b69c6a',
            0.65,
          );
        }
      if (style === 'braid' || style === 'pony')
        line(
          [
            [8, -32],
            [12, -32],
          ],
          '#b89462',
          1.5,
        );
    }
    function beard(style, color = '#c2a05c') {
      if (style === 'goatee') {
        shaped(color, () => {
          ctx.moveTo(-3, -23);
          ctx.lineTo(3, -23);
          ctx.lineTo(3, -19);
          ctx.lineTo(0, -16);
          ctx.lineTo(-3, -19);
        });
        line(
          [
            [-4, -25],
            [-1, -26],
            [0, -25],
            [1, -26],
            [4, -25],
          ],
          color,
          1.4,
        );
        line(
          [
            [0, -21],
            [0, -18],
          ],
          '#ead396',
          0.6,
        );
      } else {
        shaped(color, () => {
          ctx.moveTo(-7, -26);
          ctx.quadraticCurveTo(0, -21, 7, -26);
          ctx.lineTo(7, -20);
          ctx.lineTo(0, -14);
          ctx.lineTo(-7, -20);
        });
        line(
          [
            [-5, -25],
            [-2, -26],
            [0, -25],
            [2, -26],
            [5, -25],
          ],
          color,
          2,
        );
        line(
          [
            [0, -21],
            [0, -17],
          ],
          '#d9c49d',
          0.7,
        );
      }
    }
    function plateHelmet(paladin = false, crowned = false) {
      // Rigid crown, brow, visor and cheek plates have separate metal planes.
      shaped(paladin ? '#9cb1bb' : '#687b82', () => {
        ctx.moveTo(-10, -30);
        ctx.lineTo(-11, -38);
        ctx.quadraticCurveTo(-8, -46, 0, -46);
        ctx.quadraticCurveTo(9, -45, 11, -38);
        ctx.lineTo(10, -29);
        ctx.lineTo(6, -33);
        ctx.lineTo(-6, -33);
      });
      poly(
        [
          [-10, -35],
          [0, -38],
          [10, -35],
          [8, -25],
          [0, -21],
          [-8, -25],
        ],
        paladin ? '#b9cbd0' : '#8b9ca2',
      );
      poly(
        [
          [0, -38],
          [10, -35],
          [8, -25],
          [0, -21],
        ],
        '#7d929d',
      );
      line(
        [
          [-8, -33],
          [-2, -32],
          [2, -32],
          [8, -33],
        ],
        '#24353b',
        2,
      );
      line(
        [
          [0, -43],
          [0, -24],
        ],
        '#e6e8d7',
        1.1,
      );
      for (const side of [-1, 1]) {
        line(
          [
            [side * 5, -28],
            [side * 6, -26],
          ],
          '#354b55',
          0.8,
        );
        fillOval(side * 9, -35, 1, 1, '#e6ce8d');
      }
      if (paladin) {
        line(
          [
            [-5, -40],
            [0, -42],
            [5, -40],
          ],
          '#dbc486',
          1.5,
        );
        softPoly(
          [
            [-8, -23],
            [0, -20],
            [8, -23],
            [6, -19],
            [-6, -19],
          ],
          '#9eafb5',
          1,
        );
      } else if (!crowned) {
        oval(0, -45, 3.5, 1.5, '#bfab72');
        poly(
          [
            [-2, -46],
            [0, -55],
            [3, -46],
          ],
          '#c5c7b1',
        );
      }
    }
    // Owner-selected Moon setting for the Mage; Amber ring for Mira.
    // Staff axis and all existing arms/hands/grip calls stay unchanged.
    function acceptedStaff(woodland = false) {
      ctx.save();
      ctx.translate(-7, 0);
      const shaft = woodland ? '#806348' : '#596983';
      shaped(shaft, () => {
        ctx.moveTo(23.4, 14);
        ctx.lineTo(23, -34);
        ctx.lineTo(27, -34);
        ctx.lineTo(26.6, 14);
      });
      softRect(22, -36, 6, 4, woodland ? '#c9b57d' : '#c6b482', 0.6);
      softRect(23, 11, 4, 4, '#b6bdbe', 0.7);
      softRect(22.3, -8, 5.4, 14, woodland ? '#574b3a' : '#51465f', 1);
      for (const y of [-5, -1, 3])
        line(
          [
            [22.6, y],
            [27.4, y - 1],
          ],
          '#c9b57d',
          0.8,
        );
      if (woodland) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.ellipse(25, -45, 8, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#c9b57d';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        line(
          [
            [25, -54],
            [25, -50],
          ],
          '#c9b57d',
          1.5,
        );
        oval(25, -45, 3.7, 5.4, '#d0a163');
      } else {
        shaped('#c4d1d7', () => {
          ctx.moveTo(29, -55);
          ctx.bezierCurveTo(11, -55, 12, -33, 27, -33);
          ctx.lineTo(28, -37);
          ctx.bezierCurveTo(18, -38, 19, -48, 29, -51);
        });
        oval(28, -44, 4, 5.3, '#b18bd0');
        line(
          [
            [25, -37],
            [26, -39],
            [30, -39],
            [31, -37],
          ],
          '#c6b482',
          1.4,
        );
      }
      ctx.restore();
    }

    function marshalVeyra() {
      const option = 'B';
      const p = {
        plate: '#dbd9c9',
        light: '#f3edda',
        shade: '#929e9c',
        cloth: '#685974',
        trim: '#ccac69',
        iris: '#5f829d',
      };
      // Heavy fitted plate and practical coat tails, with the same spear/shield poses.
      humanoid(p.shade, steel, 1.45, false);
      // Static skirt: a single continuous cloth body, with short hanging tassets.
      for (const side of [-1, 1]) {
        oval(side * 10, 14.5, 5.5, 2.3, p.shade);
        line(
          [
            [side * 7, 14.5],
            [side * 12, 14.5],
          ],
          p.light,
          0.8,
        );
      }
      shaped(p.cloth, () => {
        ctx.moveTo(-11, -3);
        ctx.lineTo(11, -3);
        ctx.bezierCurveTo(12, 2, 17, 8, 19, 12);
        ctx.quadraticCurveTo(0, 19, -19, 12);
        ctx.bezierCurveTo(-17, 8, -12, 2, -11, -3);
      });
      for (const side of [-1, 1]) {
        line(
          [
            [side * 6, 4],
            [side * 8, 12],
          ],
          '#51465f',
          0.8,
        );
      }
      ctx.strokeStyle = p.trim;
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(-17, 12);
      ctx.quadraticCurveTo(0, 17, 17, 12);
      ctx.stroke();
      for (const side of [-1, 1]) {
        shaped(p.plate, () => {
          ctx.moveTo(side * 13, -1);
          ctx.quadraticCurveTo(side * 9, -2, side * 6, 0);
          ctx.lineTo(side * 5, 7);
          ctx.quadraticCurveTo(side * 9, 11, side * 15, 9);
          ctx.lineTo(side * 16, 5);
        });
        line(
          [
            [side * 13, 1],
            [side * 13, 6],
            [side * 9, 8],
          ],
          p.trim,
          0.9,
        );
        line(
          [
            [side * 7, 1],
            [side * 7, 5],
          ],
          p.light,
          0.9,
        );
      }
      shaped(p.plate, () => {
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.lineTo(5, 5);
        ctx.quadraticCurveTo(0, 10, -5, 5);
      });
      line(
        [
          [-3, 4],
          [0, 7],
          [3, 4],
        ],
        p.trim,
        0.9,
      );
      shaped(p.plate, () => {
        ctx.moveTo(-17, -23);
        ctx.quadraticCurveTo(-9, -29, 0, -24);
        ctx.quadraticCurveTo(9, -29, 17, -23);
        ctx.lineTo(15, -10);
        ctx.quadraticCurveTo(8, -3, 0, -4);
        ctx.quadraticCurveTo(-8, -3, -15, -10);
      });
      shaped(p.light, () => {
        ctx.moveTo(-11, -22);
        ctx.quadraticCurveTo(0, -26, 11, -22);
        ctx.lineTo(8, -17);
        ctx.quadraticCurveTo(0, -20, -8, -17);
      });
      line(
        [
          [0, -20],
          [0, -6],
        ],
        p.light,
        1.1,
      );
      line(
        [
          [-13, -10],
          [-7, -6],
          [0, -5],
          [7, -6],
          [13, -10],
        ],
        p.trim,
        1.3,
      );
      softRect(-10, -3, 20, 3.8, '#574a43', 0.8);
      softRect(-2, -3, 4, 4, p.trim, 0.5);
      for (const side of [-1, 1]) {
        shaped(p.plate, () => {
          ctx.moveTo(side * 13, -24);
          ctx.quadraticCurveTo(side * 23, -28, side * 29, -20);
          ctx.quadraticCurveTo(side * 31, -16, side * 25, -12);
          ctx.lineTo(side * 16, -16);
        });
        line(
          [
            [side * 15, -23],
            [side * 22, -23],
            [side * 27, -19],
          ],
          p.trim,
          1.3,
        );
        line(
          [
            [side * 17, -18],
            [side * 23, -16],
          ],
          p.light,
          0.9,
        );
        fillOval(side * 22, -21, 0.8, 0.8, p.light);
      }
      // The helmet masks the generic base head; no second face or mouth underneath.
      shaped(p.shade, () => {
        ctx.moveTo(-13, -47);
        ctx.quadraticCurveTo(-10, -55, 0, -55);
        ctx.quadraticCurveTo(10, -55, 13, -47);
        ctx.lineTo(12, -25);
        ctx.quadraticCurveTo(0, -18, -12, -25);
      });
      oval(0, -36, 8.5, 10.5, '#d5ad94');
      shaped('#dfcfb3', () => {
        ctx.moveTo(-8, -44);
        ctx.quadraticCurveTo(-4, -50, 5, -47);
        ctx.quadraticCurveTo(10, -46, 9, -39);
        ctx.lineTo(6, -41);
        ctx.quadraticCurveTo(2, -46, -3, -42);
        ctx.lineTo(-8, -41);
      });
      shaped('#c8b79b', () => {
        ctx.moveTo(7, -44);
        ctx.quadraticCurveTo(12, -42, 10, -33);
        ctx.lineTo(8, -31);
        ctx.lineTo(8, -38);
        ctx.lineTo(4, -41);
      });
      // Almond eyes: visible whites and irises, fine lids, and arched brows.
      for (const side of [-1, 1]) {
        const ex = side * 3.45,
          ey = -37;
        ctx.fillStyle = '#f3e7d8';
        ctx.beginPath();
        ctx.moveTo(ex - 2.05, ey);
        ctx.quadraticCurveTo(ex, ey - 2.15, ex + 2.05, ey);
        ctx.quadraticCurveTo(ex, ey + 1.7, ex - 2.05, ey);
        ctx.fill();
        fillOval(ex, ey, 0.95, 1.3, p.iris);
        fillOval(ex, ey + 0.1, 0.43, 1.0, '#2c343b');
        fillOval(ex - 0.25, ey - 0.5, 0.27, 0.35, '#fff6e4');
        ctx.strokeStyle = '#50433e';
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(ex - 2.1, ey);
        ctx.quadraticCurveTo(ex, ey - 2.15, ex + 2.1, ey);
        ctx.stroke();
        line(
          [
            [ex - side * 2, -40],
            [ex - side * 0.2, -40.8],
            [ex + side * 1.8, -40.3],
          ],
          '#8a765d',
          0.75,
        );
      }
      line(
        [
          [0, -36],
          [-0.5, -33.3],
          [0.8, -33.3],
        ],
        '#ae7f68',
        0.6,
      );
      expressionLips(-0.25, -35, false, false, '#a94058');
      for (const side of [-1, 1]) {
        shaped(p.plate, () => {
          ctx.moveTo(side * 10, -45);
          ctx.lineTo(side * 13, -43);
          ctx.lineTo(side * 12, -27);
          ctx.lineTo(side * 8, -24);
          ctx.lineTo(side * 9, -29);
          ctx.lineTo(side * 10, -33);
        });
        line(
          [
            [side * 11, -42],
            [side * 11, -29],
            [side * 9, -27],
          ],
          p.trim,
          0.9,
        );
      }
      shaped(p.plate, () => {
        ctx.moveTo(-13, -48);
        ctx.quadraticCurveTo(0, -58, 13, -48);
        ctx.lineTo(11, -46);
        ctx.quadraticCurveTo(0, -52, -11, -46);
      });
      line(
        [
          [-11, -48],
          [0, -53],
          [11, -48],
        ],
        p.trim,
        1.2,
      );
      if (option === 'B') {
        shaped(p.trim, () => {
          ctx.moveTo(-3, -52);
          ctx.quadraticCurveTo(0, -58, 3, -52);
          ctx.lineTo(2, -50);
          ctx.lineTo(-2, -50);
        });
        oval(0, -52, 1, 1.7, '#856b96');
      }
      shield(-24, -1, p.shade);
      marshalSpear(23);
      shaped(p.trim, () => {
        ctx.moveTo(0, -21);
        ctx.quadraticCurveTo(5, -17, 4, -14);
        ctx.lineTo(0, -10);
        ctx.lineTo(-4, -14);
        ctx.quadraticCurveTo(-5, -17, 0, -21);
      });
      fillOval(0, -16, 1.5, 2, option === 'B' ? '#83749c' : '#719ca5');
      // Upper-arm plate, elbow cop, vambrace, cuff and articulated gauntlet.
      shaped(p.shade, () => {
        ctx.moveTo(16, -21);
        ctx.lineTo(23, -19);
        ctx.quadraticCurveTo(26, -14, 24, -8);
        ctx.lineTo(18, -8);
        ctx.quadraticCurveTo(17, -13, 16, -21);
      });
      shaped(p.plate, () => {
        ctx.moveTo(18, -19);
        ctx.lineTo(23, -17);
        ctx.lineTo(23, -10);
        ctx.lineTo(19, -10);
        ctx.quadraticCurveTo(18, -14, 18, -19);
      });
      line(
        [
          [20, -18],
          [21, -12],
        ],
        p.light,
        1,
      );
      oval(22, -8.5, 4.8, 3.5, p.plate);
      line(
        [
          [19, -9],
          [23, -10],
          [25, -8],
        ],
        p.trim,
        0.85,
      );
      shaped(p.plate, () => {
        ctx.moveTo(18.5, -7);
        ctx.lineTo(25, -7);
        ctx.lineTo(26, -1);
        ctx.quadraticCurveTo(23, 2, 19.5, -0.5);
        ctx.lineTo(18.5, -7);
      });
      line(
        [
          [20, -6],
          [21, -1],
        ],
        p.light,
        1.1,
      );
      line(
        [
          [19.5, -2],
          [25, -2],
        ],
        p.trim,
        0.9,
      );
      shaped(p.light, () => {
        ctx.moveTo(21, -2);
        ctx.quadraticCurveTo(23, -4, 25, -1.8);
        ctx.lineTo(25.7, 1.7);
        ctx.quadraticCurveTo(23, 3.6, 20.8, 1.5);
        ctx.lineTo(21, -2);
      });
      line(
        [
          [21.5, 0],
          [24.5, 0],
        ],
        p.shade,
        0.65,
      );
      line(
        [
          [21.5, 1.4],
          [24.4, 1.4],
        ],
        p.shade,
        0.6,
      );
    }

    function mageHead(crowned = false) {
      face(0, -29, skin, 0.94, false, 'bright', '#bd587d');
      // Owner-selected option C: silver twin front braids and approved violet bows.
      // The shared head keeps these visible below normal/crowned headgear.

      shaped('#c2d2df', () => {
        ctx.moveTo(-10, -36);
        ctx.lineTo(-12, -24);
        ctx.lineTo(-8, -20);
        ctx.lineTo(-6, -34);
        ctx.lineTo(7, -34);
        ctx.lineTo(8, -20);
        ctx.lineTo(12, -24);
        ctx.lineTo(10, -36);
        ctx.closePath();
      });
      for (const side of [-1, 1]) {
        for (let y = -24; y <= -10; y += 3.7) {
          oval(side * 10, y, 2.5, 2.7, '#b9cbd8');
          line(
            [
              [side * 10 - 1.8, y - 1.4],
              [side * 10 + 1.8, y + 1.2],
            ],
            '#f0f5f5',
            1,
          );
        }
        for (const direction of [-1, 1]) {
          shaped(direction < 0 ? '#8870ac' : '#ac8bca', () => {
            ctx.moveTo(side * 10, -6.3);
            ctx.bezierCurveTo(
              side * 10 + direction * 7,
              -13,
              side * 10 + direction * 7,
              -3,
              side * 10,
              -6.3,
            );
          });
          line(
            [
              [side * 10 + direction, -6.4],
              [side * 10 + direction * 4, -7.5],
            ],
            '#ddc2eb',
            0.55,
          );
          shaped('#a38ac3', () => {
            ctx.moveTo(side * 10 + direction * 0.8, -5.8);
            ctx.lineTo(side * 10 + direction * 3, -1.1);
            ctx.lineTo(side * 10 + direction * 1.4, -1.7);
            ctx.lineTo(side * 10 + direction * 0.6, -0.5);
            ctx.lineTo(side * 10 - direction * 0.3, -5.6);
          });
        }
        oval(side * 10, -6.3, 1.45, 1.6, '#79588f');
        oval(side * 10 - 0.3, -6.8, 0.55, 0.6, '#d9b9e8');
        shaped('#dce7ed', () => {
          ctx.moveTo(side * 10 - 2, -5);
          ctx.lineTo(side * 10 - 2.7, -0.5);
          ctx.lineTo(side * 10 + 2.7, -2);
          ctx.lineTo(side * 10 + 2, -5);
          ctx.closePath();
        });
      }

      shaped('#d7e2e9', () => {
        ctx.moveTo(-9, -36);
        ctx.quadraticCurveTo(-1, -40, 9, -36);
        ctx.lineTo(8, -29);
        ctx.lineTo(4, -32);
        ctx.quadraticCurveTo(0, -28, -4, -28);
        ctx.lineTo(-1, -33);
        ctx.quadraticCurveTo(-6, -30, -9, -29);
        ctx.closePath();
      });
      line(
        [
          [-7, -34],
          [-1, -36],
          [5, -35],
          [1, -32],
        ],
        '#f3f6f4',
        1.1,
      );

      shaped('#526d9b', () => {
        ctx.moveTo(-11, -36);
        ctx.quadraticCurveTo(-5, -47, -2, -56);
        ctx.quadraticCurveTo(4, -58, 9, -52);
        ctx.lineTo(5, -51);
        ctx.lineTo(12, -36);
      });
      shaped('#7893b4', () => {
        ctx.moveTo(-17, -35);
        ctx.quadraticCurveTo(-8, -40, 0, -38);
        ctx.quadraticCurveTo(9, -40, 17, -35);
        ctx.quadraticCurveTo(0, -30, -17, -35);
      });
      line(
        [
          [-10, -37],
          [0, -39],
          [11, -37],
        ],
        '#c9c193',
        1.2,
      );
      if (crowned) {
        // The crown encircles the cone above the brim; the scarf masks the mouth.
        craftAt(0, -43, 0.65, () => royalCrown(0));
        softPoly(
          [
            [-9, -27],
            [0, -25],
            [9, -28],
            [9, -20],
            [1, -17],
            [-9, -21],
          ],
          '#79608c',
          1.2,
        );
        line(
          [
            [-7, -24],
            [0, -22],
            [7, -24],
          ],
          '#b196bd',
          1,
        );
        shaped('#66527b', () => {
          ctx.moveTo(7, -22);
          ctx.quadraticCurveTo(20, -21, 20, -11);
          ctx.lineTo(11, -15);
          ctx.lineTo(8, -18);
        });
      }
    }
    function smithHammer(x = 22) {
      line(
        [
          [x, -27],
          [x - 6, 14],
        ],
        '#947450',
        3.8,
      );
      // Socket, heavy rectangular poll and a short tapered peen.
      poly(
        [
          [x - 10, -34],
          [x + 4, -34],
          [x + 7, -30],
          [x + 7, -23],
          [x - 10, -23],
        ],
        '#9ba9ac',
      );
      poly(
        [
          [x + 7, -32],
          [x + 14, -29],
          [x + 7, -25],
        ],
        '#71868c',
      );
      poly(
        [
          [x - 10, -34],
          [x + 4, -34],
          [x + 2, -30],
          [x - 10, -30],
        ],
        '#d3d9ca',
      );
      softRect(x - 2, -31, 4, 6, '#64767c', 0.6);
    }
    function runicStaff(x = 18) {
      line(
        [
          [x, -37],
          [x, 15],
        ],
        '#79604e',
        3,
      );
      line(
        [
          [x + 1, -32],
          [x + 1, 12],
        ],
        '#b79b6c',
        0.7,
      );
      // A narrow carved crook surrounds a floating crystal rather than a flat sign.
      shaped('#a58b67', () => {
        ctx.moveTo(x - 2, -31);
        ctx.bezierCurveTo(x - 13, -41, x - 5, -50, x + 3, -48);
        ctx.quadraticCurveTo(x + 13, -46, x + 8, -38);
        ctx.lineTo(x + 5, -40);
        ctx.quadraticCurveTo(x + 8, -45, x + 2, -45);
        ctx.quadraticCurveTo(x - 6, -44, x - 2, -36);
      });
      poly(
        [
          [x + 1, -43],
          [x + 4, -39],
          [x + 1, -34],
          [x - 2, -39],
        ],
        '#baa5d4',
      );
      line(
        [
          [x - 3, -31],
          [x + 3, -31],
        ],
        '#d9c28e',
        2,
      );
    }
    function staffAnchor(x = 21) {
      line(
        [
          [x, -31],
          [x, 11],
        ],
        '#819f9c',
        3,
      );
      oval(x, -33, 4, 4, '#9ebbb1');
      fillOval(x, -33, 1.6, 1.6, '#395b60');
      line(
        [
          [x - 7, -24],
          [x + 7, -24],
        ],
        '#c2d1b8',
        2.5,
      );
      line(
        [
          [x - 10, 0],
          [x - 8, 8],
          [x, 13],
          [x + 8, 8],
          [x + 10, 0],
        ],
        '#a3bfb5',
        3.5,
      );
      poly(
        [
          [x - 12, 0],
          [x - 5, 3],
          [x - 10, 6],
        ],
        '#ccd5be',
      );
      poly(
        [
          [x + 12, 0],
          [x + 5, 3],
          [x + 10, 6],
        ],
        '#ccd5be',
      );
    }
    function grip(x, y, color = skin, angle = 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      oval(0, 0, 3.1, 3.7, color);
      line(
        [
          [-1.7, -0.5],
          [1.4, 0.1],
        ],
        '#7b6550',
        0.7,
      );
      line(
        [
          [-1.8, 1.1],
          [1.2, 1.6],
        ],
        '#7b6550',
        0.65,
      );
      ctx.restore();
    }
    function spectralRoyalCrown() {
      // The original three-point royal silhouette becomes one fitted glasslike crown.
      // Broad valleys, a taller center and curved band keep the hierarchy readable.
      ctx.save();
      const alpha = ctx.globalAlpha;
      ctx.beginPath();
      ctx.moveTo(-19, -44);
      ctx.lineTo(-21, -59);
      ctx.quadraticCurveTo(-21, -62, -18, -60);
      ctx.lineTo(-11, -52);
      ctx.lineTo(-7, -54);
      ctx.lineTo(0, -67);
      ctx.lineTo(7, -54);
      ctx.lineTo(11, -52);
      ctx.lineTo(18, -60);
      ctx.quadraticCurveTo(21, -62, 21, -59);
      ctx.lineTo(19, -44);
      ctx.quadraticCurveTo(0, -39, -19, -44);
      ctx.closePath();
      const crystal = ctx.createLinearGradient(0, -67, 0, -40);
      crystal.addColorStop(0, '#edc870');
      crystal.addColorStop(0.5, '#d3b889');
      crystal.addColorStop(1, '#a38abb');
      ctx.globalAlpha = alpha * 0.62;
      ctx.fillStyle = crystal;
      ctx.fill();
      ctx.globalAlpha = alpha * 0.18;
      ctx.strokeStyle = '#ffe2a1';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.88;
      ctx.strokeStyle = '#8f785e';
      ctx.lineWidth = 0.95;
      ctx.stroke();
      // Translucent facet planes carry volume without adding more spikes.
      ctx.globalAlpha = alpha * 0.24;
      fillPoly(
        [
          [-18, -59],
          [-14, -47],
          [-9, -45],
          [-11, -52],
        ],
        '#fff0bc',
        alpha * 0.24,
      );
      fillPoly(
        [
          [0, -65],
          [0, -46],
          [7, -46],
          [7, -54],
        ],
        '#f9dfaa',
        alpha * 0.24,
      );
      fillPoly(
        [
          [18, -59],
          [13, -46],
          [18, -45],
        ],
        '#e9d7f2',
        alpha * 0.24,
      );
      ctx.globalAlpha = alpha * 0.78;
      line(
        [
          [-18, -46],
          [-9, -44],
          [0, -43],
          [9, -44],
          [18, -46],
        ],
        '#e8c582',
        1.35,
      );
      line(
        [
          [-17, -48],
          [-10, -46],
        ],
        '#fff0bf',
        0.7,
      );
      line(
        [
          [10, -46],
          [17, -48],
        ],
        '#fff0bf',
        0.7,
      );
      poly(
        [
          [0, -55],
          [3.5, -50],
          [0, -45],
          [-3.5, -50],
        ],
        '#ad89c1',
      );
      line(
        [
          [0, -53],
          [-1.3, -50],
          [0, -48],
        ],
        '#f1d7ec',
        0.8,
      );
      for (const x of [-12, 12]) fillOval(x, -47, 0.8, 0.8, '#f4dda4', alpha * 0.55);
      ctx.restore();
    }
    function royalCrown(y = -39) {
      shaped(gold, () => {
        ctx.moveTo(-10, y);
        ctx.lineTo(-13, y - 10);
        ctx.lineTo(-5, y - 6);
        ctx.lineTo(0, y - 14);
        ctx.lineTo(5, y - 6);
        ctx.lineTo(13, y - 10);
        ctx.lineTo(10, y);
        ctx.quadraticCurveTo(0, y + 3, -10, y);
      });
      line(
        [
          [-10, y],
          [0, y + 1],
          [10, y],
        ],
        '#8f713d',
        2,
      );
      poly(
        [
          [0, y - 9],
          [3, y - 5],
          [0, y - 1],
          [-3, y - 5],
        ],
        '#bc93c3',
      );
      fillOval(-0.7, y - 5.5, 0.9, 1.2, '#f9e2ed');
    }
    function backQuiver(x = -18, y = -25, scale = 1) {
      craftAt(x, y, scale, () => {
        ctx.rotate(0.12);
        shaped('#71503a', () => {
          ctx.moveTo(-4.5, 0);
          ctx.lineTo(-4, 23);
          ctx.quadraticCurveTo(0, 28, 4, 23);
          ctx.lineTo(4.5, 0);
        });
        oval(0, 0, 4.5, 2, '#382f29');
        for (const [x, top] of [
          [-2.5, -12],
          [0, -16],
          [2.5, -10],
        ]) {
          line(
            [
              [x, 1],
              [x, top],
            ],
            '#c6ad7d',
            1,
          );
          // Paired feather vanes and a blunt nock, never exposed arrowheads.
          for (const side of [-1, 1])
            shaped(
              '#d2d7bc',
              () => {
                ctx.moveTo(x, top + 1);
                ctx.lineTo(x + side * 2.2, top - 1);
                ctx.lineTo(x + side * 2, top + 3);
                ctx.lineTo(x, top + 5);
              },
              0.45,
            );
        }
        line(
          [
            [-4.5, 1],
            [0, 2.5],
            [4.5, 1],
          ],
          '#bc9565',
          1.6,
        );
        line(
          [
            [-2, 5],
            [-2, 22],
          ],
          '#a57b53',
          0.7,
        );
        line(
          [
            [-4, 20],
            [4, 20],
          ],
          '#453a2e',
          1.4,
        );
        for (const y of [7, 12, 17]) fillOval(2.5, y, 0.45, 0.6, '#c0a17b');
      });
    }
    function tricornHat(y = -39, scale = 1) {
      craftAt(0, y, scale, () => {
        // A fitted felt cap and three folded brim corners, without royal metalwork.
        oval(0, -3, 10, 7, '#443b50');
        shaped('#51455d', () => {
          ctx.moveTo(-16, 1);
          ctx.quadraticCurveTo(-19, -3, -18, -10);
          ctx.quadraticCurveTo(-11, -7, -7, -5);
          ctx.quadraticCurveTo(-2, -11, 0, -14);
          ctx.quadraticCurveTo(3, -11, 7, -5);
          ctx.quadraticCurveTo(13, -7, 18, -10);
          ctx.quadraticCurveTo(19, -2, 15, 1);
          ctx.quadraticCurveTo(0, 6, -16, 1);
        });
        line(
          [
            [-16, -7],
            [-11, 0],
            [0, 3],
            [11, 0],
            [16, -7],
          ],
          '#9e929f',
          1,
        );
        line(
          [
            [0, -12],
            [-4, -4],
            [4, -4],
            [0, -12],
          ],
          '#74677e',
          0.8,
        );
        oval(-9, -1, 1.8, 2, '#a1a48f');
      });
    }
    function marshalSpear(x = 29, scale = 1) {
      craftAt(x, 0, scale, () => {
        line(
          [
            [0, -42],
            [0, 22],
          ],
          '#947a50',
          3,
        );
        line(
          [
            [1, -39],
            [1, 19],
          ],
          '#c1aa79',
          0.7,
        );
        poly(
          [
            [-2, -40],
            [-5, -44],
            [-3, -50],
            [0, -61],
            [3, -50],
            [5, -44],
            [2, -40],
          ],
          '#a7babe',
        );
        poly(
          [
            [0, -61],
            [0, -41],
            [4, -44],
            [2, -50],
          ],
          '#d6dfd1',
        );
        line(
          [
            [0, -57],
            [0, -42],
          ],
          '#617c83',
          0.9,
        );
        softRect(-2, -41, 4, 5, '#7f969c', 0.5);
        for (const y of [-37, -35, -33])
          line(
            [
              [-2, y],
              [2, y],
            ],
            '#c5ad76',
            0.8,
          );
      });
    }
    // Soft hand sling: the twin cords curve up to ONE loaded leather cup.
    // Small waist shot pouch stays subsidiary to the character silhouette.
    function goblinSlingerEquipment(hide) {
      line(
        [
          [-10, -13],
          [-17, -8],
        ],
        '#a58c66',
        1.25,
      );
      softPoly(
        [
          [-20, -7],
          [-14, -8],
          [-13, 0],
          [-15, 2],
          [-20, 1],
        ],
        '#65503c',
        1.3,
      );
      softPoly(
        [
          [-20, -7],
          [-14, -8],
          [-14, -5],
          [-20, -4],
        ],
        '#99815b',
        0.7,
      );
      // One muted spare stone partly hidden beneath the leather flap.
      oval(-18, -5.7, 1.2, 0.9, '#888c82');
      // Curved leather cords: no three-stick/Y-frame or bow silhouette.
      ctx.strokeStyle = '#c0a175';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(15, -4);
      ctx.quadraticCurveTo(17, -15, 22, -21);
      ctx.moveTo(15, -4);
      ctx.quadraticCurveTo(30, -10, 31, -20);
      ctx.stroke();
      softPoly(
        [
          [21, -21],
          [24, -23],
          [28, -23],
          [32, -21],
          [30, -17],
          [24, -18],
        ],
        '#74543c',
        1.1,
      );
      oval(26.6, -20.7, 2.6, 2, '#8e9487');
      grip(15, -4, hide);
    }
    function goblinBody(crown = false, ranged = !!e.ranged, friendly = false) {
      const hide = '#9caa78',
        cloth = crown ? '#55485f' : friendly ? '#66875c' : '#867356';
      // The friendly Archer alone carries arrows. Hostile Slingers keep stones.
      if (ranged && friendly) backQuiver(-16, -24, 0.85);
      humanoid(cloth, hide, 0.85, false);
      grip(-13, -1, hide);
      for (const side of [-1, 1]) {
        shaped(hide, () => {
          ctx.moveTo(side * 5, -33);
          ctx.quadraticCurveTo(side * 12, -35, side * 20, -39);
          ctx.quadraticCurveTo(side * 18, -28, side * 8, -27);
        });
        line(
          [
            [side * 10, -31],
            [side * 16, -35],
          ],
          '#717c58',
          1.3,
        );
      }
      // Slingers use a half-lidded side glance, uneven brows and one-corner
      // smirk instead of the round-eyed, blushing smile of cheerful NPCs.
      face(
        0,
        -29,
        hide,
        0.85,
        false,
        ranged && !friendly ? 'sly' : friendly ? 'wry' : crown ? 'stern' : 'amused',
      );
      shaped('#b8bd87', () => {
        ctx.moveTo(-1, -29);
        ctx.lineTo(-1.5, -27);
        ctx.quadraticCurveTo(0, -26, 2, -27);
        ctx.lineTo(1, -29);
      });
      if (friendly) {
        shaped('#496b48', () => {
          ctx.moveTo(-10, -35);
          ctx.quadraticCurveTo(-7, -44, 3, -43);
          ctx.lineTo(15, -39);
          ctx.lineTo(7, -36);
          ctx.lineTo(-10, -35);
        });
        line(
          [
            [-12, -35],
            [0, -37],
            [11, -35],
          ],
          '#b7ae78',
          2,
        );
        line(
          [
            [6, -39],
            [10, -48],
          ],
          '#d8c6a0',
          1.3,
        );
        line(
          [
            [10, -48],
            [13, -45],
          ],
          '#c2a47f',
          2,
        );
      }
      softRect(-8, -16, 16, 13, crown ? '#87929a' : '#67533e', 2.5);
      line(
        [
          [-7, -15],
          [6, -3],
        ],
        crown ? '#c1af7d' : '#ac9365',
        2.3,
      );
      if (ranged && friendly) {
        bow(16, -6);
        grip(15, -4, hide);
      } else if (ranged) {
        goblinSlingerEquipment(hide);
      } else {
        sword(15, -8);
        grip(17, 0, hide);
      }
      if (crown) {
        shaped('#79858d', () => {
          ctx.moveTo(-8, -34);
          ctx.quadraticCurveTo(-9, -45, 0, -46);
          ctx.quadraticCurveTo(10, -44, 9, -34);
          ctx.quadraticCurveTo(0, -37, -8, -34);
        });
        line(
          [
            [-8, -34],
            [0, -36],
            [9, -34],
          ],
          '#c7c4ae',
          1.1,
        );
      }
    }
    function crownSoldier() {
      const ancestry = e.crownAncestry || e.species;
      if (ancestry === 'orc') {
        orcBody();
        return;
      }
      if (ancestry === 'ogre') {
        ogreBody(!!e.ranged);
        for (const side of [-1, 1])
          softPoly(
            [
              [side * 14, -25],
              [side * 24, -28],
              [side * 29, -20],
              [side * 24, -14],
              [side * 15, -17],
            ],
            '#8e9ba1',
            3,
          );
        softPoly(
          [
            [-13, -21],
            [0, -24],
            [14, -20],
            [12, -4],
            [0, 0],
            [-13, -5],
          ],
          '#82909a',
          3,
        );
        line(
          [
            [-10, -18],
            [0, -20],
            [10, -17],
          ],
          '#c1c6b8',
          1.2,
        );
        shaped('#77858c', () => {
          ctx.moveTo(-14, -36);
          ctx.quadraticCurveTo(-17, -48, 0, -49);
          ctx.quadraticCurveTo(17, -47, 14, -36);
          ctx.quadraticCurveTo(0, -40, -14, -36);
        });
        line(
          [
            [-13, -36],
            [0, -39],
            [13, -36],
          ],
          '#c4c7b5',
          1.4,
        );
      } else if (ancestry === 'goblin') goblinBody(true);
      else {
        if (e.ranged) backQuiver();
        humanoid('#55485f', skin, 1.05, false);
        grip(-15, -1);
        softPoly(
          [
            [-10, -20],
            [0, -23],
            [10, -20],
            [9, -3],
            [0, 0],
            [-9, -3],
          ],
          '#8d9ca5',
          3,
        );
        for (const side of [-1, 1])
          softPoly(
            [
              [side * 8, -19],
              [side * 15, -22],
              [side * 20, -16],
              [side * 16, -10],
              [side * 10, -12],
            ],
            '#a7b0b1',
            2.5,
          );
        if (ancestry === 'archer') {
          shaped('#627b67', () => {
            ctx.moveTo(-10, -29);
            ctx.lineTo(-11, -38);
            ctx.quadraticCurveTo(0, -44, 11, -38);
            ctx.lineTo(10, -29);
            ctx.lineTo(7, -34);
            ctx.quadraticCurveTo(0, -38, -7, -34);
          });
        }
        if (ancestry === 'archer') {
          face(0, -29, '#cbaa8c', 1, false, 'wry');
          coiffure('short', '#9e784c');
        } else plateHelmet(false, true);
        if (e.ranged) {
          bow(18, -7);
          grip(17, -5);
        } else {
          sword(18, -8);
          grip(20, 1, '#9da9b0');
        }
      }
      const width = ancestry === 'ogre' ? 1.4 : ancestry === 'goblin' ? 0.8 : 1;
      ctx.save();
      ctx.scale(width, 1);
      poly(
        [
          [0, -19],
          [4, -14],
          [0, -9],
          [-4, -14],
        ],
        '#74434e',
      );
      oval(0, -14, 1.2, 1.2, gold);
      line(
        [
          [-8, -3],
          [8, -3],
        ],
        '#c5b582',
        1.3,
      );
      if (!e.ranged) shield(ancestry === 'ogre' ? -23 : -18, 0, '#744952');
      ctx.restore();
    }
    function appointedResident() {
      // Repaint the same immutable visual recipe; this does not construct a Campaign unit.
      const [group, key] = (e.masterId || '').split(':');
      if (group === 'specialist')
        specialist({
          ...e,
          family: key,
          kind: ['crypt', 'mine', 'cindermaw'].includes(key)
            ? 'smith'
            : key === 'archive'
              ? 'alchemist'
              : 'teacher',
        });
      else {
        const captain = {
          'supply-vale': { species: 'goblin', captainVisualIdol: 'thorn' },
          'supply-march': { species: 'mireling', captainVisualIdol: 'mire' },
          'supply-highlands': { family: 'ridge', type: 'boss', captainProfile: 'supply-highlands' },
          'supply-crown': {
            species: 'ashbeast',
            captainVisualIdol: 'darklord',
            captainProfile: 'supply-crown',
          },
          'frontier-overseer': {
            species: 'orc',
            captainVisualIdol: 'warlord',
            captainProfile: 'frontier-overseer',
          },
        };
        const visual =
          group === 'field'
            ? { type: 'boss', family: key }
            : group === 'captain'
              ? captain[key]
              : null;
        if (visual)
          draw(
            ctx,
            {
              ...e,
              kind: undefined,
              renderKind: 'enemy',
              type: 'mob',
              form: 'normal',
              captain: group === 'captain',
              ...visual,
              visualScale: 1,
            },
            { x: 0, y: 0 },
            region,
            true,
          );
        else humanoid('#787467', '#b9b09d');
      }
      // One small official clasp leaves animal, skeletal and humanoid identities intact.
      oval(0, 0, 3, 2.7, '#bfa169');
      poly(
        [
          [0, -2],
          [1.4, 0],
          [0, 2],
          [-1.4, 0],
        ],
        '#b595b7',
      );
    }
    function skeletonBody(ceremonial = false) {
      if (ceremonial)
        shaped('#574e62', () => {
          ctx.moveTo(-11, -20);
          ctx.quadraticCurveTo(-19, -13, -20, 10);
          ctx.quadraticCurveTo(-11, 13, -5, 8);
          ctx.lineTo(5, 8);
          ctx.quadraticCurveTo(15, 14, 20, 10);
          ctx.quadraticCurveTo(19, -13, 10, -20);
        });
      for (const side of [-1, 1]) {
        const x = side * 6;
        line(
          [
            [x, 0],
            [side * 8, 8],
            [side * 8, 14],
          ],
          '#9e9d88',
          4.3,
        );
        line(
          [
            [x, 0],
            [side * 7, 8],
            [side * 7, 14],
          ],
          bone,
          2.7,
        );
        oval(side * 8, 8, 2.7, 2.5, bone);
        shaped(bone, () => {
          ctx.moveTo(side * 5, 13);
          ctx.lineTo(side * 9, 13);
          ctx.lineTo(side * 13, 16);
          ctx.quadraticCurveTo(side * 9, 19, side * 4, 17);
        });
        for (let i = 0; i < 3; i++)
          line(
            [
              [side * (8 + i * 1.4), 15],
              [side * (9 + i * 1.4), 17],
            ],
            '#8b8d7d',
            0.65,
          );
        line(
          [
            [side * 7, -17],
            [side * 13, -9],
            [side * 15, -1],
          ],
          '#a6a58e',
          4,
        );
        line(
          [
            [side * 7, -17],
            [side * 12, -9],
            [side * 14, -1],
          ],
          bone,
          2.6,
        );
        oval(side * 12, -9, 2.2, 2.2, bone);
        grip(side * 15, -1, bone);
      }
      oval(0, 0, 7, 4, bone);
      oval(0, -0.7, 3, 1.4, '#6b766a');
      line(
        [
          [0, -21],
          [0, -1],
        ],
        '#a8a68d',
        4,
      );
      for (const y of [-17, -12, -7]) {
        shaped(
          bone,
          () => {
            ctx.moveTo(0, y - 2);
            ctx.bezierCurveTo(-12, y - 5, -12, y + 4, 0, y + 4);
            ctx.bezierCurveTo(12, y + 4, 12, y - 5, 0, y - 2);
          },
          0.8,
        );
        line(
          [
            [-6, y],
            [0, y + 2],
            [6, y],
          ],
          '#7f8979',
          1,
        );
      }
      line(
        [
          [-8, -18],
          [0, -21],
          [8, -18],
        ],
        bone,
        2.2,
      );
      skull(0, -30, 9);
      line(
        [
          [-4, -23],
          [4, -23],
        ],
        '#918f79',
        0.8,
      );
      if (ceremonial) {
        tricornHat(-39);
        softPoly(
          [
            [-11, -20],
            [-17, -17],
            [-16, -7],
            [-9, -9],
          ],
          '#81738a',
          2,
        );
        line(
          [
            [-15, -17],
            [-12, -9],
          ],
          '#d2bc85',
          1.3,
        );
        line(
          [
            [20, -32],
            [20, 16],
          ],
          '#947956',
          3,
        );
        shaped(bone, () => {
          ctx.moveTo(19, -31);
          ctx.quadraticCurveTo(30, -39, 36, -33);
          ctx.quadraticCurveTo(26, -31, 25, -23);
          ctx.lineTo(20, -24);
        });
        grip(18, -2, bone);
        shield(-18, 0, '#766b66');
      } else {
        if (e.ranged) bow(17, -7);
        else sword(15, -9);
        grip(15, 0, bone);
      }
    }
    function scorpionBody(minister = false, young = false) {
      const shell = minister ? '#986755' : e.ranged ? '#936d67' : '#ad8065',
        highlight = minister ? '#bf9375' : '#c7a181';
      const k = minister ? 1.18 : 1;
      ctx.save();
      ctx.scale(k, k);
      // Rear tail arches above the carapace. The shell occludes its root.
      const tail = [
        [0, 5],
        [-14, -5],
        [-23, -20],
        [-23, -33],
        [-17, -43],
        [-5, -46],
        [6, -40],
      ];
      for (let i = 0; i < tail.length - 1; i++) {
        line([tail[i], tail[i + 1]], '#674e46', 8 - i * 0.5);
        oval(tail[i + 1][0], tail[i + 1][1], 4.5 - i * 0.25, 4.8 - i * 0.3, shell);
        fillOval(tail[i + 1][0] - 1, tail[i + 1][1] - 1, 2, 2, highlight, 0.45);
      }
      shaped('#e1cc9e', () => {
        ctx.moveTo(3, -43);
        ctx.quadraticCurveTo(15, -44, 13, -30);
        ctx.quadraticCurveTo(9, -37, 5, -36);
      });
      // Far legs precede the shell; paired tapered segments meet at real sockets.
      for (const side of [-1, 1])
        for (let i = 0; i < 4; i++) {
          const y = -7 + i * 5,
            reach = 29 + i * 2;
          shaped(shell, () => {
            ctx.moveTo(side * 12, y - 2);
            ctx.quadraticCurveTo(side * 24, y - 2, side * reach, y + 4);
            ctx.lineTo(side * (reach + 5), y + 12);
            ctx.lineTo(side * (reach + 2), y + 12);
            ctx.lineTo(side * (reach - 2), y + 6);
            ctx.lineTo(side * 14, y + 2);
          });
          oval(side * (reach - 2), y + 4, 2.6, 2.2, highlight);
        }
      shaped(shell, () => {
        ctx.moveTo(-12, 7);
        ctx.bezierCurveTo(-24, 6, -26, -6, -13, -13);
        ctx.quadraticCurveTo(0, -19, 14, -12);
        ctx.bezierCurveTo(27, -6, 23, 7, 12, 10);
        ctx.quadraticCurveTo(0, 15, -12, 7);
      });
      for (let y = -6; y < 11; y += 5) {
        line(
          [
            [-16, y],
            [0, y + 3],
            [16, y],
          ],
          '#704d43',
          1.1,
        );
        line(
          [
            [-9, y - 1],
            [0, y],
            [9, y - 1],
          ],
          highlight,
          1,
        );
      }
      for (const side of [-1, 1]) {
        line(
          [
            [side * 14, -9],
            [side * 22, -18],
            [side * 27, -24],
          ],
          '#6c5148',
          8,
        );
        line(
          [
            [side * 14, -9],
            [side * 22, -18],
            [side * 27, -24],
          ],
          shell,
          5.8,
        );
        oval(side * 22, -18, 4, 3.5, highlight);
        shaped(highlight, () => {
          ctx.moveTo(side * 24, -26);
          ctx.bezierCurveTo(side * 26, -35, side * 37, -36, side * 39, -31);
          ctx.lineTo(side * 32, -29);
          ctx.lineTo(side * 38, -25);
          ctx.bezierCurveTo(side * 37, -18, side * 28, -18, side * 24, -26);
        });
        line(
          [
            [side * 29, -29],
            [side * 32, -26],
          ],
          '#755348',
          1,
        );
      }
      oval(0, -11, 12, 7, shell);
      for (const x of [-5, 5]) {
        oval(x, -13, young ? 2.7 : 1.9, young ? 3.3 : 2.3, '#302c2c');
        fillOval(x - 0.5, -14, 0.7, 1, '#e7c482');
      }
      line(
        [
          [-5, -6],
          [0, -4],
          [5, -6],
        ],
        '#65483e',
        1,
      );
      if (minister || e.captainProfile === 'supply-crown') {
        line(
          [
            [-14, -4],
            [0, 4],
            [14, -4],
          ],
          '#51465a',
          4,
        );
        poly(
          [
            [0, -7],
            [5, -2],
            [0, 3],
            [-5, -2],
          ],
          '#b78db6',
        );
        for (const x of [-11, 11]) oval(x, -3, 1.2, 1.2, gold);
      } else if (e.ranged) {
        softRect(-10, -1, 7, 6, '#754c4c', 2);
        softRect(4, -1, 7, 6, '#754c4c', 2);
      }
      ctx.restore();
    }
    function treasuryMoneyBag() {
      // The tied neck stays at the existing hand; the pouch hangs below it.
      shaped('#927453', () => {
        ctx.moveTo(-3, 0);
        ctx.bezierCurveTo(-4, 3, -9, 4, -8, 8);
        ctx.quadraticCurveTo(-7, 12, 0, 12);
        ctx.quadraticCurveTo(8, 12, 8, 7);
        ctx.quadraticCurveTo(7, 3, 3, 0);
        ctx.lineTo(4, -4);
        ctx.quadraticCurveTo(0, -2, -4, -4);
        ctx.closePath();
      });
      shaped(
        '#b39770',
        () => {
          ctx.moveTo(-2, 2);
          ctx.quadraticCurveTo(-6, 5, -5, 9);
          ctx.quadraticCurveTo(-3, 11, 0, 10);
          ctx.quadraticCurveTo(-2, 6, -2, 2);
        },
        0.5,
      );
      line(
        [
          [-3, 1],
          [3, 1],
        ],
        '#5b4938',
        1.4,
      );
      line(
        [
          [3, 1],
          [5, 3],
          [4, 5],
        ],
        '#d0bb94',
        0.8,
      );
      // A silver Crown stamp, not a gold coin or a currency letter.
      poly(
        [
          [-4, 4],
          [-2, 5],
          [0, 2.5],
          [2, 5],
          [4, 4],
          [3, 8],
          [-3, 8],
        ],
        '#cbd4d6',
      );
      line(
        [
          [-3, 8],
          [3, 8],
        ],
        '#f0f3ed',
        1,
      );
    }

    function treasuryHammer() {
      line(
        [
          [26, -27],
          [20, 17],
        ],
        '#6c533b',
        5,
      );
      line(
        [
          [24, -26],
          [19, 15],
        ],
        '#b79664',
        2,
      );
      poly(
        [
          [16, -37],
          [38, -37],
          [42, -31],
          [37, -21],
          [15, -23],
        ],
        '#7d8b89',
      );
      poly(
        [
          [16, -37],
          [38, -37],
          [42, -31],
          [20, -31],
        ],
        '#b8c2b5',
      );
      line(
        [
          [20, -29],
          [37, -28],
        ],
        '#535f5e',
        1.1,
      );
      for (const x of [22, 29, 35]) oval(x, -26, 1.2, 1.2, '#c9cbb1');
    }

    function governorAxe(x = 28, metal = '#a5afb0') {
      line(
        [
          [x, -29],
          [x - 6, 15],
        ],
        '#8f704f',
        3.5,
      );
      poly(
        [
          [x - 1, -29],
          [x + 12, -35],
          [x + 14, -19],
          [x - 3, -20],
        ],
        metal,
      );
      line(
        [
          [x + 12, -33],
          [x + 14, -21],
        ],
        '#d6d8c6',
        1.6,
      );
    }

    function mountainBody() {
      humanoid('#846c52', '#acaa7d', 1.55, false);
      craftAt(-23, -1, 1, treasuryMoneyBag);
      grip(-23, -1, '#a5a678');
      // Muscular neck, cheek planes and curved horn roots belong to this mountain people.
      oval(0, -22, 10, 7, '#92966d');
      face(0, -30, '#b3b284', 1.5, true);
      shaped('#bec093', () => {
        ctx.moveTo(-9, -27);
        ctx.quadraticCurveTo(0, -21, 10, -27);
        ctx.quadraticCurveTo(8, -18, 0, -19);
        ctx.quadraticCurveTo(-9, -19, -9, -27);
      });
      line(
        [
          [-6, -24],
          [5, -24],
        ],
        '#686b50',
        1.2,
      );
      for (const side of [-1, 1]) {
        shaped(bone, () => {
          ctx.moveTo(side * 9, -36);
          ctx.quadraticCurveTo(side * 18, -38, side * 18, -47);
          ctx.quadraticCurveTo(side * 24, -35, side * 12, -32);
        });
        oval(side * 16, -35, 3, 3, '#898c6a');
        softPoly(
          [
            [side * 10, -18],
            [side * 20, -21],
            [side * 23, -12],
            [side * 13, -10],
          ],
          '#8d9186',
          3,
        );
      }
      softRect(-12, -15, 24, 14, '#6b715f', 3);
      line(
        [
          [-11, -12],
          [10, -12],
        ],
        '#b1b29b',
        1.2,
      );
      softRect(-15, 0, 30, 4, '#584735', 1);
      softRect(-7, -6, 14, 9, '#846949', 2);
      line(
        [
          [-5, -4],
          [5, -4],
        ],
        gold,
        1,
      );
      oval(0, -1, 2, 1, gold);
      treasuryHammer();
      grip(23, -4, '#a5a678');
    }
    function spectralScholar() {
      shaped('#3c5f63', () => {
        ctx.moveTo(-11, -22);
        ctx.quadraticCurveTo(-19, -7, -20, 12);
        ctx.quadraticCurveTo(-12, 17, -3, 12);
        ctx.quadraticCurveTo(8, 18, 19, 11);
        ctx.quadraticCurveTo(16, -9, 10, -23);
      });
      for (const x of [-10, 0, 10])
        line(
          [
            [x * 0.6, -17],
            [x, 9],
          ],
          '#8cafa4',
          1.3,
        );
      face(0, -29, '#a7bfb0', 1, true);
      shaped('#466b70', () => {
        ctx.moveTo(-11, -24);
        ctx.bezierCurveTo(-16, -35, -7, -46, 1, -47);
        ctx.quadraticCurveTo(12, -43, 13, -25);
        ctx.lineTo(8, -29);
        ctx.quadraticCurveTo(7, -39, 0, -38);
        ctx.quadraticCurveTo(-8, -39, -8, -27);
      });
      line(
        [
          [-10, -26],
          [-6, -39],
          [0, -43],
          [8, -36],
          [11, -26],
        ],
        '#89a9a1',
        1.2,
      );
      line(
        [
          [23, -29],
          [23, 19],
        ],
        '#768f89',
        3,
      );
      oval(23, -29, 4, 4, gold);
      line(
        [
          [15, 11],
          [17, 18],
          [23, 23],
          [30, 18],
          [32, 11],
        ],
        '#a0b7aa',
        3.5,
      );
      line(
        [
          [-9, -18],
          [-16, -9],
          [-14, -2],
        ],
        '#668e88',
        6,
      );
      line(
        [
          [10, -18],
          [17, -9],
          [21, -5],
        ],
        '#668e88',
        6,
      );
      grip(21, -5, '#a1bbad');
      grip(-14, -2, '#a1bbad');
      softRect(-20, -4, 13, 10, '#5f6659', 1.5);
      line(
        [
          [-19, -2],
          [-9, -2],
        ],
        '#c3c6a9',
        1,
      );
      for (const x of [-11, 6])
        line(
          [
            [x, 8],
            [x + 2, 11],
          ],
          '#a9b8a4',
          1,
        );
    }
    function humanoid(color, head = skin, bulk = 1, withHands = true) {
      for (const side of [-1, 1]) {
        shaped('#444b42', () => {
          ctx.moveTo(side * 2 * bulk, 0);
          ctx.lineTo(side * 9 * bulk, 0);
          ctx.quadraticCurveTo(side * 10 * bulk, 7, side * 9 * bulk, 13);
          ctx.lineTo(side * 3 * bulk, 13);
        });
        oval(side * 7 * bulk, 13, 5 * bulk, 3, '#3b3930');
        line(
          [
            [side * 5 * bulk, 6],
            [side * 5.5 * bulk, 10],
          ],
          '#878c74',
          0.9,
        );
      }
      shaped(color, () => {
        ctx.moveTo(-10 * bulk, 4);
        ctx.bezierCurveTo(-12 * bulk, -3, -13 * bulk, -13, -9 * bulk, -18);
        ctx.quadraticCurveTo(0, -23, 9 * bulk, -18);
        ctx.bezierCurveTo(13 * bulk, -13, 12 * bulk, -3, 10 * bulk, 4);
        ctx.quadraticCurveTo(0, 8, -10 * bulk, 4);
      });
      fillOval(-5 * bulk, -7, 5 * bulk, 11, '#1d3027', 0.14);
      line(
        [
          [-7 * bulk, -15],
          [-4 * bulk, -6],
          [-6 * bulk, 2],
        ],
        '#e3d5b1',
        0.7,
      );
      oval(0, -20, 4 * bulk, 5, head);
      face(0, -29, head, bulk);
      for (const side of [-1, 1]) {
        shaped(color, () => {
          ctx.moveTo(side * 8 * bulk, -18);
          ctx.quadraticCurveTo(side * 14 * bulk, -19, side * 15 * bulk, -10);
          ctx.lineTo(side * 17 * bulk, -3);
          ctx.quadraticCurveTo(side * 17 * bulk, 1, side * 12 * bulk, -1);
          ctx.lineTo(side * 10 * bulk, -9);
          ctx.lineTo(side * 7 * bulk, -14);
        });
        line(
          [
            [side * 12 * bulk, -10],
            [side * 14 * bulk, -7],
          ],
          '#d5c6a4',
          0.8,
        );
        if (withHands) grip(side * 15 * bulk, -1, head);
      }
      softRect(-10 * bulk, -1, 20 * bulk, 3, '#665238', 1);
      softRect(-2, -1, 4, 3, '#baa16b', 0.5);
    }

    function orcBody(rank) {
      const governor = rank === 'governor',
        inspector = rank === 'inspector',
        officer = governor || inspector || e.form === 'ringleader',
        crown = !!e.crownTroop,
        hide = governor ? '#89936a' : inspector ? '#9ca477' : '#929b70',
        shadow = '#687651',
        light = '#b5bd8c',
        cloth = crown ? '#54485f' : officer ? '#79504a' : e.ranged ? '#77604e' : '#746656',
        metal = crown ? '#9da9b0' : governor ? '#a5afb0' : '#888e88';
      if (crown && e.ranged) backQuiver(-24, -27, 1.2);
      const shape = (color, trace) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        trace();
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      // The governor's long mantle and his admirer’s shorter, carefully copied one.
      if (officer)
        shape(governor ? '#603b3d' : '#81514a', () => {
          ctx.moveTo(-15, -23);
          ctx.quadraticCurveTo(-25, -12, governor ? -25 : -21, 12);
          ctx.quadraticCurveTo(-10, 16, 0, 10);
          ctx.quadraticCurveTo(11, 16, governor ? 25 : 21, 12);
          ctx.quadraticCurveTo(25, -12, 14, -23);
        });
      // Bent knees, greaves and splayed, weight-bearing boots.
      for (const side of [-1, 1]) {
        line(
          [
            [side * 7, 0],
            [side * 9, 7],
            [side * 10, 13],
          ],
          '#4a4c40',
          8,
        );
        oval(side * 11, 13, 7, 3.7, '#4e4235');
        softRect(side * 9 - 3, 4, 6, 6, officer ? metal : '#655747', 2);
        line(
          [
            [side * 9 - 2, 6],
            [side * 9 + 2, 6],
          ],
          '#b49b76',
          1,
        );
      }
      shape(cloth, () => {
        ctx.moveTo(-14, -22);
        ctx.bezierCurveTo(-19, -15, -16, -3, -13, 4);
        ctx.quadraticCurveTo(0, 9, 13, 4);
        ctx.bezierCurveTo(17, -6, 18, -16, 13, -22);
        ctx.quadraticCurveTo(0, -28, -14, -22);
      });
      fillOval(5, -11, 9, 13, '#c6ae87', 0.13);
      // Deltoids connect to elbows and exposed knuckles; no floating stick arms.
      for (const side of [-1, 1]) {
        shape(side < 0 ? shadow : hide, () => {
          ctx.moveTo(side * 12, -23);
          ctx.bezierCurveTo(side * 21, -25, side * 24, -18, side * 22, -12);
          ctx.quadraticCurveTo(side * 27, -5, side * 23, 1);
          ctx.quadraticCurveTo(side * 18, 4, side * 16, -2);
          ctx.quadraticCurveTo(side * 17, -8, side * 15, -12);
          ctx.quadraticCurveTo(side * 10, -18, side * 12, -23);
        });
        softRect(side < 0 ? -24 : 17, -9, 7, 6, '#58483b', 2);
        line(
          [
            [side * 19, -7],
            [side * 23, -6],
          ],
          '#b1a082',
          1.3,
        );
        line(
          [
            [side * 19, 0],
            [side * 23, 0],
          ],
          shadow,
          1,
        );
        // Curved iron shoulder cups, with hard rivets and hammered rims.
        shape(side < 0 ? metal : '#727e77', () => {
          ctx.moveTo(side * 10, -22);
          ctx.quadraticCurveTo(side * 19, -30, side * 25, -21);
          ctx.lineTo(side * 23, -15);
          ctx.quadraticCurveTo(side * 16, -15, side * 11, -18);
        });
        line(
          [
            [side * 13, -21],
            [side * 19, -24],
            [side * 23, -21],
          ],
          '#b9bca5',
          1.4,
        );
        fillOval(side * 21, -18, 1.2, 1.2, '#dbc397');
        if (officer) {
          // Conspicuous paired horn fittings tie captain and boss together.
          shape(bone, () => {
            ctx.moveTo(side * 20, -26);
            ctx.quadraticCurveTo(side * 28, -26, side * 29, -34);
            ctx.quadraticCurveTo(side * 31, -22, side * 23, -21);
          });
        }
      }
      if (governor || e.guard || crown) softRect(-10, -20, 20, 19, '#687471', 4);
      else softRect(-9, -17, 18, 16, '#5e5141', 3);
      line(
        [
          [-10, -19],
          [9, -4],
        ],
        officer ? '#b07660' : '#a58b62',
        officer ? 4 : 3,
      );
      softRect(-13, 0, 26, 4, '#493e33', 1.5);
      softRect(-2, 0, 5, 4, '#bd9f66', 1);
      for (const x of officer ? [-6, 0, 6] : [0]) fillOval(x, -12, 1.5, 1.5, '#dac28e');
      if (crown) {
        softRect(-7, -19, 14, 14, metal, 2);
        poly(
          [
            [0, -19],
            [5, -14],
            [0, -8],
            [-5, -14],
          ],
          '#74434e',
        );
        fillOval(0, -14, 1.6, 1.6, '#e8cf94');
        for (const side of [-1, 1]) softRect(side * 11 - 3, 3, 6, 7, '#74434e', 1.5);
      }
      // Thick neck and ears sit behind a single continuous head and jaw contour.
      oval(0, -23, 7, 6, shadow);
      for (const side of [-1, 1]) {
        shape(hide, () => {
          ctx.moveTo(side * 9, -35);
          ctx.quadraticCurveTo(side * 15, -39, side * 19, -36);
          ctx.quadraticCurveTo(side * 17, -29, side * 10, -29);
        });
        line(
          [
            [side * 12, -32],
            [side * 16, -35],
          ],
          '#697555',
          1.5,
        );
      }
      shape(hide, () => {
        ctx.moveTo(-11, -36);
        ctx.bezierCurveTo(-10, -46, 8, -46, 12, -36);
        ctx.bezierCurveTo(15, -30, 14, -22, 8, -19);
        ctx.quadraticCurveTo(0, -16, -8, -20);
        ctx.bezierCurveTo(-14, -22, -15, -31, -11, -36);
      });
      fillOval(-4, -34, 5, 7, light, 0.33);
      // Low hairline, receding at the temples; face stays open even in TRUE form.
      shape('#383c31', () => {
        ctx.moveTo(-11, -36);
        ctx.quadraticCurveTo(-12, -47, 1, -46);
        ctx.quadraticCurveTo(12, -45, 12, -36);
        ctx.lineTo(7, -39);
        ctx.quadraticCurveTo(0, -42, -7, -39);
      });
      if (officer || crown) {
        line(
          [
            [-9, -40],
            [0, -42],
            [9, -40],
          ],
          governor ? '#c3ab77' : '#a6aaa0',
          2.5,
        );
        if (governor) softRect(-3, -47, 6, 6, '#c2a472', 1.5);
      }
      if (inspector) {
        line(
          [
            [1, -43],
            [3, -50],
            [6, -43],
          ],
          '#363c32',
          5,
        );
      } else if (e.ranged && !governor) {
        line(
          [
            [-8, -39],
            [-4, -42],
            [2, -40],
          ],
          '#665039',
          3,
        );
      }
      // High-contrast sockets, amber eyes and a heavy, angled brow.
      for (const side of [-1, 1]) {
        oval(side * 5.5, -33, 3.3, 2.2, '#30372b');
        fillOval(side * 5.5, -32.8, 1.8, 1.2, '#e2c27b');
        fillOval(side * 5.5 + 0.6, -32.7, 0.7, 1.1, '#1f2820');
        line(
          [
            [side * 9, -36],
            [side * 3, inspector ? (side < 0 ? -34 : -38) : e.ranged ? -36 : -34.5],
          ],
          shadow,
          2.7,
        );
      }
      oval(0, -28, 4, 3.2, '#9aa173');
      for (const x of [-2, 2]) fillOval(x, -27, 0.8, 0.6, '#4f5c3e');
      oval(0, -23, 9.5, 4.3, '#a6ac7c');
      line(
        [
          [-7, -23],
          [0, inspector ? -21 : e.ranged ? -22 : -23.7],
          [7, inspector ? -25 : e.ranged ? -24 : -23],
        ],
        '#46503a',
        1.5,
      );
      for (const side of [-1, 1])
        shape(bone, () => {
          ctx.moveTo(side * 5, -21);
          ctx.quadraticCurveTo(side * 9, -23, side * 8, -29);
          ctx.quadraticCurveTo(side * 5, -27, side * 4, -22);
        });
      if (governor)
        line(
          [
            [9, -37],
            [7, -30],
          ],
          '#d0b28b',
          1.3,
        );
      else if (inspector) {
        // Smaller copied cheek stripe, cocked brow and the officious ledger.
        line(
          [
            [10, -31],
            [10, -27],
          ],
          '#965c4a',
          2,
        );
        softRect(-29, -5, 13, 17, '#71513a', 1.8);
        softRect(-27, -3, 9, 13, '#c3af83', 1);
        for (const y of [0, 4, 8])
          line(
            [
              [-25, y],
              [-20, y],
            ],
            '#6c5b42',
            1,
          );
        oval(-22, -6, 2, 1.4, '#b0aaa0');
      }
      // Real equipment retains deliberate cutting edges and the existing role.
      if (crown && e.ranged && !officer) {
        bow(27, -7);
        grip(26, -5, hide);
      } else if (inspector) {
        line(
          [
            [29, -28],
            [23, 15],
          ],
          '#71523d',
          4,
        );
        for (const y of [0, 4, 8])
          line(
            [
              [23, y],
              [27, y + 1],
            ],
            '#b39766',
            1.2,
          );
        oval(29, -31, 8, 9, '#65777a');
        for (const [x, y, dx, dy] of [
          [22, -35, -5, -4],
          [35, -35, 6, -5],
          [29, -39, 0, -7],
          [36, -28, 6, 2],
          [22, -27, -5, 3],
        ])
          poly(
            [
              [x - 2, y + 1],
              [x + dx, y + dy],
              [x + 2, y - 1],
            ],
            '#bbc2ad',
          );
        line(
          [
            [27, -37],
            [25, -30],
            [28, -25],
          ],
          '#c3c6ae',
          1.3,
        );
      } else if (governor || e.ranged) {
        const x = inspector ? 27 : 28;
        governorAxe(x, metal);
        if (e.ranged && !officer) {
          softRect(-21, -4, 8, 12, '#6e493b', 2);
          line(
            [
              [-19, -12],
              [-14, -3],
            ],
            '#a68258',
            3,
          );
          poly(
            [
              [-20, -14],
              [-12, -17],
              [-12, -9],
            ],
            metal,
          );
        }
      } else {
        sword(21, -5);
        if (crown) shield(-22, -1, '#74434e');
      }
      if (officer) {
        grip(23, -2, hide);
        line(
          [
            [24, -29],
            [28, -28],
          ],
          '#e1ddc4',
          1.1,
        );
        line(
          [
            [-8, -13],
            [5, -3],
          ],
          '#d2b18a',
          0.7,
        );
      } else {
        line(
          [
            [-9, -10],
            [-8, -4],
          ],
          '#bca47c',
          0.65,
        );
        line(
          [
            [7, -11],
            [8, -4],
          ],
          '#bca47c',
          0.65,
        );
      }
    }
    function frontierRaider() {
      // One complete irregular marksman, not a hooded archer under a second
      // Crown soldier. All Frontier variants share one bow and one back quiver.
      const officer = e.form === 'ringleader',
        coat = e.guard ? '#746b5c' : '#8c7860',
        clothShadow = '#5b5144',
        leather = '#6e503a',
        face = '#c3a086';
      const shape = (color, trace) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        trace();
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      // Short, loose half-cloak; the bow arm remains free.
      shape('#605447', () => {
        ctx.moveTo(-8, -24);
        ctx.bezierCurveTo(-18, -24, -18, -4, -22, 7);
        ctx.quadraticCurveTo(-15, 11, -7, 4);
        ctx.lineTo(-3, -19);
      });
      backQuiver(-18, -21);

      // Trouser knees and worn soft boots give a mobile, planted stance.
      line(
        [
          [-6, 1],
          [-8, 8],
          [-11, 14],
        ],
        '#555449',
        6,
      );
      line(
        [
          [5, 1],
          [7, 8],
          [10, 13],
        ],
        '#626053',
        6,
      );
      oval(-11, 14, 5, 2.5, '#4a3e32');
      oval(11, 14, 5, 2.5, '#4a3e32');
      shape(coat, () => {
        ctx.moveTo(-8, -22);
        ctx.quadraticCurveTo(1, -25, 9, -20);
        ctx.quadraticCurveTo(11, -10, 10, 5);
        ctx.quadraticCurveTo(1, 9, -11, 5);
        ctx.quadraticCurveTo(-10, -6, -12, -16);
        ctx.quadraticCurveTo(-13, -20, -8, -22);
      });
      line(
        [
          [-4, -18],
          [-3, -4],
          [-5, 4],
        ],
        '#a08b70',
        1.2,
      );
      line(
        [
          [5, -14],
          [7, -5],
        ],
        clothShadow,
        1.2,
      );
      // Sleeves fold at the elbows, with bare hands at the string and grip.
      line(
        [
          [-9, -18],
          [-13, -10],
          [-4, -12],
        ],
        ink,
        6.5,
      );
      line(
        [
          [-9, -18],
          [-13, -10],
          [-4, -12],
        ],
        coat,
        4.5,
      );
      line(
        [
          [8, -18],
          [13, -13],
          [19, -12],
        ],
        ink,
        6.5,
      );
      line(
        [
          [8, -18],
          [13, -13],
          [19, -12],
        ],
        coat,
        4.5,
      );
      softRect(11, -15, 5, 4, leather, 1.5); // A leather bracer, not a pauldron.
      line(
        [
          [-10, -20],
          [7, -2],
        ],
        leather,
        2.2,
      ); // Single quiver strap.
      line(
        [
          [-10, 0],
          [9, 0],
        ],
        '#b29a70',
        2,
      );
      softRect(6, 1, 6, 6, '#6c533e', 2); // One small field pouch.
      line(
        [
          [7, 3],
          [11, 3],
        ],
        '#aa8b60',
        1,
      );
      // A soft hood follows the skull, without an iron helmet above it.
      shape('#756653', () => {
        ctx.moveTo(-11, -25);
        ctx.bezierCurveTo(-13, -34, -10, -43, -3, -45);
        ctx.quadraticCurveTo(8, -46, 12, -35);
        ctx.lineTo(12, -25);
        ctx.lineTo(6, -29);
        ctx.lineTo(-6, -29);
      });
      line(
        [
          [-9, -33],
          [-5, -40],
          [3, -42],
          [9, -35],
        ],
        '#a38f73',
        1.5,
      );
      // Angular adult jaw, brow and stubble, framed by cloth rather than plates.
      softPoly(
        [
          [-7, -34],
          [-3, -37],
          [5, -36],
          [8, -31],
          [6, -23],
          [1, -20],
          [-5, -23],
          [-8, -28],
        ],
        face,
        3,
      );
      line(
        [
          [-6, -34],
          [-3, -35],
          [5, -34],
          [7, -30],
        ],
        '#514434',
        1.5,
      );
      line(
        [
          [-5, -31],
          [-2, -30],
        ],
        '#534b3e',
        1.3,
      );
      line(
        [
          [2, -30],
          [5, -31],
        ],
        '#534b3e',
        1.3,
      );
      fillOval(-3, -29, 0.8, 1, '#292e27');
      fillOval(4, -29, 0.8, 1, '#292e27');
      line(
        [
          [1, -29],
          [0, -26],
          [2, -26],
        ],
        '#9a7b64',
        0.9,
      );
      line(
        [
          [-2, -23],
          [3, -23],
        ],
        '#776550',
        1.2,
      );
      line(
        [
          [-4, -22],
          [1, -20.5],
          [5, -23],
        ],
        '#8a7961',
        1.4,
      );
      // Dust scarf rests below the chin. Faction/rank is a cloth detail only.
      softPoly(
        [
          [-9, -23],
          [-4, -20],
          [5, -21],
          [9, -24],
          [8, -18],
          [0, -17],
          [-8, -19],
        ],
        '#a08a6d',
        2,
      );
      if (e.crownTroop)
        line(
          [
            [-11, -17],
            [-14, -12],
          ],
          '#89554e',
          2.5,
        );
      if (officer) {
        for (const y of [-18, -15])
          line(
            [
              [-9, y],
              [-5, y + 1],
            ],
            '#c5aa7b',
            1.4,
          );
      }
      // One working recurve bow, its single string and one nocked arrow.
      ctx.strokeStyle = '#bd9c68';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(20, -35);
      ctx.bezierCurveTo(19, -30, 29, -24, 29, -12);
      ctx.bezierCurveTo(29, 0, 20, 6, 20, 11);
      ctx.stroke();
      line(
        [
          [20, -35],
          [3, -12],
          [20, 11],
        ],
        '#d9c7a3',
        1,
      );
      line(
        [
          [2, -12],
          [33, -12],
        ],
        '#cbb286',
        1.1,
      );
      poly(
        [
          [33, -13.5],
          [36, -12],
          [33, -10.5],
        ],
        '#a4aaa1',
      );
      oval(20, -12, 3, 2.6, face);
      oval(2, -12, 2.7, 2.1, face);
      line(
        [
          [19, -10],
          [22, -10],
        ],
        '#8b6b50',
        0.8,
      );
      line(
        [
          [-8, -10],
          [-7, -4],
          [-2, -2],
        ],
        '#bda77e',
        0.65,
      );
      line(
        [
          [8, -13],
          [10, -8],
        ],
        '#c1a982',
        0.7,
      );
      line(
        [
          [-14, -5],
          [-12, -4],
        ],
        '#bca080',
        0.7,
      );
    }
    // One organic species body for melee, thrower and guard variants.
    function ogreBody(ranged) {
      const hide = '#b2a684',
        shadow = '#8b8063',
        light = '#c8bb96';
      const cloth = e.crownTroop ? '#55485f' : ranged ? '#777469' : '#8d7a5f';
      const shape = (color, trace) => {
        ctx.fillStyle = color;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        trace();
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      if (e.crownTroop && ranged) backQuiver(-30, -27, 1.35);
      // Weight-bearing legs and broad boots under a rounded, heavy torso.
      for (const side of [-1, 1]) {
        line(
          [
            [side * 8, -1],
            [side * 10, 12],
          ],
          '#575548',
          9,
        );
        oval(side * 10 + 1, 12, 8, 4, '#4d493e');
      }
      shape(cloth, () => {
        ctx.moveTo(-17, -24);
        ctx.bezierCurveTo(-12, -30, 11, -30, 18, -23);
        ctx.bezierCurveTo(24, -13, 23, 0, 17, 5);
        ctx.bezierCurveTo(5, 9, -11, 8, -19, 3);
        ctx.bezierCurveTo(-23, -5, -24, -17, -17, -24);
      });
      fillOval(7, -10, 12, 15, '#e1cfa2', 0.13);
      // Connected deltoids, elbows and curled hands, rather than stick arms.
      for (const side of [-1, 1]) {
        shape(side < 0 ? shadow : hide, () => {
          ctx.moveTo(side * 15, -26);
          ctx.bezierCurveTo(side * 24, -29, side * 29, -19, side * 27, -12);
          ctx.bezierCurveTo(side * 32, -7, side * 31, 1, side * 25, 3);
          ctx.bezierCurveTo(side * 19, 4, side * 18, -2, side * 20, -8);
          ctx.bezierCurveTo(side * 17, -15, side * 12, -18, side * 15, -26);
        });
        line(
          [
            [side * 23, -3],
            [side * 28, -2],
          ],
          '#776d53',
          1,
        );
        line(
          [
            [side * 23, 0],
            [side * 27, 1],
          ],
          '#776d53',
          1,
        );
        fillOval(side * 22, -19, 3, 6, light, 0.23);
      }
      // Curved belt follows the belly; its buckle stays readable at game scale.
      shape('#62513f', () => {
        ctx.moveTo(-21, -2);
        ctx.quadraticCurveTo(0, 4, 21, -2);
        ctx.lineTo(20, 3);
        ctx.quadraticCurveTo(0, 9, -20, 3);
      });
      rect(-3, 0, 6, 5, '#b69c67');
      rect(-1.5, 1, 3, 2.5, '#665743');
      // Ears, squat neck, broad bald skull and fleshy lower jaw.
      oval(-13, -32, 5, 6, shadow);
      oval(13, -32, 5, 6, hide);
      oval(0, -26, 10, 9, shadow);
      shape(hide, () => {
        ctx.moveTo(-13, -33);
        ctx.bezierCurveTo(-15, -48, 12, -49, 14, -35);
        ctx.bezierCurveTo(18, -26, 11, -18, 0, -19);
        ctx.bezierCurveTo(-10, -18, -16, -24, -13, -33);
      });
      fillOval(-4, -39, 7, 4, light, 0.4);
      oval(-6, -32, 4, 2.3, '#706b53');
      oval(6, -32, 4, 2.3, '#706b53');
      oval(-6, -32, 1.2, 1.3, '#e4cf8f');
      oval(6, -32, 1.2, 1.3, '#e4cf8f');
      line(
        [
          [-10, -35],
          [-3, -34],
        ],
        shadow,
        3,
      );
      line(
        [
          [3, -34],
          [10, -35],
        ],
        shadow,
        3,
      );
      oval(0, -28, 5, 4, '#bcac83');
      for (const x of [-2.5, 2.5]) fillOval(x, -27, 1.2, 1, '#615c48');
      line(
        [
          [-8, -23],
          [0, -24],
          [8, -23],
        ],
        '#665d48',
        1.6,
      );
      for (const side of [-1, 1])
        shape(bone, () => {
          ctx.moveTo(side * 7, -22);
          ctx.quadraticCurveTo(side * 13, -24, side * 10, -30);
          ctx.quadraticCurveTo(side * 8, -27, side * 5, -24);
        });
      // Preserve the existing weapon identities, without extra armor or lore.
      if (e.crownTroop && ranged) {
        bow(30, -7);
        grip(29, -5, hide);
      } else if (ranged) {
        shape('#68675e', () => {
          ctx.moveTo(-16, -25);
          ctx.quadraticCurveTo(-29, -28, -28, -14);
          ctx.quadraticCurveTo(-20, -12, -12, -19);
        });
        line(
          [
            [-16, -21],
            [14, 1],
          ],
          '#aa8b61',
          3,
        );
        shape('#705946', () => {
          ctx.moveTo(-28, -4);
          ctx.quadraticCurveTo(-19, -8, -13, -1);
          ctx.lineTo(-14, 12);
          ctx.quadraticCurveTo(-22, 17, -29, 9);
        });
        for (const [x, y, r] of [
          [-24, -3, 4],
          [-18, -1, 3],
          [-25, 3, 3],
        ])
          oval(x, y, r, r * 0.8, '#92918a');
        line(
          [
            [27, -4],
            [33, -25],
            [29, -32],
          ],
          '#b69a70',
          2,
        );
        oval(29, -32, 5, 4, '#85867f');
      } else {
        line(
          [
            [26, 2],
            [30, -28],
          ],
          '#96744e',
          6,
        );
        shape('#816647', () => {
          ctx.moveTo(24, -23);
          ctx.bezierCurveTo(17, -32, 22, -43, 31, -41);
          ctx.bezierCurveTo(40, -39, 39, -29, 33, -22);
        });
        line(
          [
            [26, -36],
            [27, -29],
          ],
          '#ad9161',
          1.5,
        );
        for (const y of [-23, -19])
          line(
            [
              [26, y],
              [33, y + 1],
            ],
            '#c2b28c',
            2,
          );
        oval(26, -2, 5, 4, hide);
      }
      for (const side of [-1, 1]) {
        line(
          [
            [side * 22, -3],
            [side * 28, -2],
          ],
          '#675f49',
          0.8,
        );
        line(
          [
            [side * 20, -19],
            [side * 23, -22],
          ],
          light,
          0.9,
        );
      }
      line(
        [
          [-15, -13],
          [-14, -5],
          [-10, -3],
        ],
        '#b4a17a',
        0.8,
      );
    }
    function skull(x = 0, y = -28, r = 8) {
      oval(x, y, r, r, bone);
      rect(x - r * 0.6, y + 4, r * 1.2, 6, bone);
      oval(x - 3, y, 2, 2, ink);
      oval(x + 3, y, 2, 2, ink);
      line(
        [
          [x - 3, y + 7],
          [x + 3, y + 7],
        ],
        ink,
        1,
      );
    }
    function littleMarshal() {
      // Miniature of Veyra's approved ivory parade kit; keep the pet's large head
      // and short, armored arms rather than shrinking the adult silhouette.
      const plate = '#dbd9c9',
        light = '#f3edda',
        trim = '#ccac69',
        shadow = '#929e9c',
        cloth = '#685974';
      for (const side of [-1, 1]) oval(side * 9, 11, 6, 3, shadow);
      shaped(cloth, () => {
        ctx.moveTo(-10, -12);
        ctx.lineTo(10, -12);
        ctx.quadraticCurveTo(12, 0, 16, 8);
        ctx.quadraticCurveTo(0, 16, -16, 8);
        ctx.quadraticCurveTo(-12, 0, -10, -12);
      });
      line(
        [
          [-13, 9],
          [0, 12],
          [13, 9],
        ],
        trim,
        0.9,
      );
      for (const side of [-1, 1]) {
        softPoly(
          [
            [side * 4, -1],
            [side * 12, -2],
            [side * 14, 5],
            [side * 8, 8],
            [side * 4, 6],
          ],
          plate,
          1,
        );
        line(
          [
            [side * 11, 0],
            [side * 12, 4],
            [side * 8, 6],
          ],
          trim,
          0.8,
        );
        line(
          [
            [side * 12, -13],
            [side * 15, -7],
            [side * 16, -1],
          ],
          shadow,
          6,
        );
        softPoly(
          [
            [side * 11, -16],
            [side * 18, -14],
            [side * 20, -10],
            [side * 15, -8],
            [side * 11, -10],
          ],
          plate,
          1,
        );
        line(
          [
            [side * 13, -14],
            [side * 17, -13],
          ],
          trim,
          0.9,
        );
        oval(side * 15, -6, 3.4, 2.7, plate);
        softRect(side * 16 - 3, -5, 6, 7, plate, 1);
        line(
          [
            [side * 16 - 2, -1],
            [side * 16 + 2, -1],
          ],
          trim,
          0.8,
        );
      }
      softPoly(
        [
          [-10, -16],
          [0, -19],
          [10, -16],
          [9, -5],
          [0, -2],
          [-9, -5],
        ],
        plate,
        2,
      );
      line(
        [
          [-8, -14],
          [0, -16],
          [8, -14],
        ],
        light,
        1.5,
      );
      line(
        [
          [-8, -5],
          [0, -3],
          [8, -5],
        ],
        trim,
        1,
      );
      softRect(-9, -2, 18, 3, '#574a43', 0.5);
      softRect(-2, -2, 4, 3, trim, 0.4);
      poly(
        [
          [0, -15],
          [3, -11],
          [0, -7],
          [-3, -11],
        ],
        trim,
      );
      fillOval(0, -11, 1.1, 1.5, '#83749c');
      // A single face: blonde crop, blue almond eyes and shaped rose lips.
      oval(0, -28, 16, 15, shadow);
      oval(0, -27, 12.5, 13, '#d5ad94');
      shaped('#dfcfb3', () => {
        ctx.moveTo(-12, -33);
        ctx.quadraticCurveTo(-13, -44, 3, -41);
        ctx.quadraticCurveTo(14, -41, 12, -29);
        ctx.lineTo(8, -32);
        ctx.quadraticCurveTo(5, -40, -3, -34);
        ctx.lineTo(-11, -30);
      });
      for (const side of [-1, 1]) {
        const x = side * 5,
          y = -28;
        shaped('#f3e7d8', () => {
          ctx.moveTo(x - 3, y);
          ctx.quadraticCurveTo(x, y - 3.2, x + 3, y);
          ctx.quadraticCurveTo(x, y + 2.8, x - 3, y);
        });
        fillOval(x, y, 1.55, 2.15, '#5f829d');
        fillOval(x, y + 0.1, 0.7, 1.7, '#2c343b');
        fillOval(x - 0.5, y - 0.7, 0.5, 0.6, '#fff6e4');
        line(
          [
            [x - 2.6, -32],
            [x, -33],
            [x + 2.5, -32],
          ],
          '#8a765d',
          0.8,
        );
        shaped(plate, () => {
          ctx.moveTo(side * 12, -36);
          ctx.lineTo(side * 15, -34);
          ctx.lineTo(side * 14, -19);
          ctx.lineTo(side * 10, -16);
          ctx.lineTo(side * 11, -24);
        });
        line(
          [
            [side * 13, -33],
            [side * 12.5, -22],
            [side * 11, -19],
          ],
          trim,
          0.8,
        );
      }
      line(
        [
          [0, -26],
          [-0.5, -23.5],
          [0.8, -23.5],
        ],
        '#ae7f68',
        0.6,
      );
      expressionLips(-0.25, -25, false, false, '#a94058');
      shaped(plate, () => {
        ctx.moveTo(-15, -37);
        ctx.quadraticCurveTo(0, -51, 15, -37);
        ctx.lineTo(12, -35);
        ctx.quadraticCurveTo(0, -45, -12, -35);
      });
      line(
        [
          [-12, -38],
          [0, -44],
          [12, -38],
        ],
        trim,
        1,
      );
      softPoly(
        [
          [-3, -43],
          [0, -48],
          [3, -43],
          [2, -40],
          [-2, -40],
        ],
        trim,
        0.6,
      );
      oval(0, -43, 1, 1.6, '#856b96');
      shield(-16, -1, shadow);
      marshalSpear(20, 0.75);
      // The gauntlet reaches the existing spear grip without lengthening the arm.
      softRect(16, -1, 5.5, 4, light, 1);
      line(
        [
          [17, 1],
          [20.5, 1],
        ],
        shadow,
        0.6,
      );
    }

    function craftedPet(family) {
      if (!Object.hasOwn(R.petCompanions, family)) return false;
      shade(18, 5, 0.24);
      if (family === 'citadel') {
        littleMarshal();
        return true;
      }
      const eyes = (x, y, gap = 6) => {
        for (const side of [-1, 1]) {
          oval(x + side * gap, y, 3, 4, '#2d4140');
          fillOval(x + side * gap - 0.8, y - 1.2, 1.2, 1.5, '#fff0cf');
        }
      };
      const smile = (x, y) => {
        ctx.strokeStyle = '#42514a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.quadraticCurveTo(x, y + 3, x + 3, y);
        ctx.stroke();
      };
      if (family === 'cindermaw') {
        craftAt(0, 0, 0.8, () => scorpionBody(false, true));
        return true;
      }
      if (family === 'thorn') {
        shaped('#9d896a', () => {
          ctx.moveTo(-12, 1);
          ctx.quadraticCurveTo(-29, -3, -27, -14);
          ctx.quadraticCurveTo(-17, -6, -12, -5);
        });
        oval(-1, -2, 18, 12, '#a38d6c');
        for (const x of [-11, 11]) {
          oval(x, 3, 6, 8, '#b9a27b');
          oval(x + 1, 9, 7, 3.5, '#c4b08a');
          for (const dx of [-2, 1])
            line(
              [
                [x + dx, 8],
                [x + dx + 1, 11],
              ],
              '#81775b',
              0.6,
            );
        }
        oval(8, -18, 17, 16, '#b9a27e');
        for (const side of [-1, 1])
          shaped('#9b805f', () => {
            const x = side < 0 ? -3 : 22;
            ctx.moveTo(x - 5, -27);
            ctx.quadraticCurveTo(x - 6, -44, x + 3, -37);
            ctx.lineTo(x + 7, -26);
          });
        oval(15, -10, 12, 7, '#d9c59a');
        eyes(10, -21);
        oval(22, -12, 3, 2.5, '#3b433a');
        smile(15, -7);
        for (const [x, y] of [
          [-14, -10],
          [-6, -13],
          [2, -10],
        ])
          shaped('#718956', () => {
            ctx.moveTo(x - 4, y + 3);
            ctx.quadraticCurveTo(x - 6, y - 7, x, y - 9);
            ctx.quadraticCurveTo(x + 7, y - 1, x + 3, y + 3);
          });
        line(
          [
            [-2, -31],
            [8, -34],
            [19, -31],
          ],
          '#6e533b',
          2,
        );
        for (const x of [0, 17]) {
          const flip = x === 0 ? -1 : 1;
          line(
            [
              [x, -32],
              [x + flip * 2, -39],
              [x + flip * 5, -43],
            ],
            '#ddcba0',
            2,
          );
          line(
            [
              [x + flip * 2, -38],
              [x + flip * 7, -38],
            ],
            '#ddcba0',
            1.3,
          );
          oval(x, -32, 2.2, 1.5, '#967447');
        }
        return true;
      }
      if (family === 'mire') {
        shaped('#74946e', () => {
          ctx.moveTo(-11, 0);
          ctx.quadraticCurveTo(-25, -7, -33, -3);
          ctx.quadraticCurveTo(-27, 7, -9, 9);
        });
        oval(0, -1, 19, 12, '#85a27a');
        for (const x of [-12, 12]) {
          oval(x, 4, 7, 7, '#93ae80');
          oval(x + 2, 10, 8, 3, '#a8bb89');
          for (const dx of [-3, 0, 3])
            line(
              [
                [x + dx, 9],
                [x + dx + 3, 12],
              ],
              '#627c58',
              0.8,
            );
        }
        oval(9, -16, 19, 14, '#94ae82');
        oval(17, -7, 19, 8, '#becb99');
        eyes(11, -20, 7);
        line(
          [
            [4, -5],
            [29, -5],
          ],
          '#566f50',
          1.2,
        );
        smile(19, -3);
        for (const x of [13, 25]) oval(x, -11, 1, 1, '#526a4c');
        for (const x of [-15, -6, 2])
          softPoly(
            [
              [x, -10],
              [x + 3, -17],
              [x + 8, -10],
            ],
            '#60794f',
            1.4,
          );
        return true;
      }
      if (family === 'abyss') {
        for (const side of [-1, 1]) {
          shaped('#8b6895', () => {
            ctx.moveTo(side * 7, -12);
            ctx.quadraticCurveTo(side * 16, -36, side * 25, -32);
            ctx.quadraticCurveTo(side * 34, -29, side * 36, -16);
            ctx.quadraticCurveTo(side * 24, -21, side * 20, -7);
          });
          line(
            [
              [side * 7, -13],
              [side * 20, -31],
              [side * 34, -17],
            ],
            '#c19dab',
            1.4,
          );
          line(
            [
              [side * 20, -31],
              [side * 20, -9],
            ],
            '#c19dab',
            1,
          );
          oval(side * 20, -30, 2, 2, '#b894a7');
        }
        shaped('#85618d', () => {
          ctx.moveTo(-9, 6);
          ctx.quadraticCurveTo(-23, 20, -29, 8);
          ctx.quadraticCurveTo(-24, 24, -5, 15);
        });
        oval(0, -2, 17, 17, '#8a6897');
        oval(1, 2, 10, 12, '#b0a0b4');
        for (const side of [-1, 1]) {
          oval(side * 12, 8, 7, 5, '#9c7ca3');
          line(
            [
              [side * 12, -9],
              [side * 16, 1],
            ],
            '#9c7ca3',
            5,
          );
          for (const dx of [-2, 2])
            line(
              [
                [side * 12 + dx, 9],
                [side * 12 + dx + 1, 13],
              ],
              bone,
              1,
            );
        }
        oval(4, -24, 18, 16, '#9b79a4');
        oval(12, -15, 16, 8, '#b999af');
        eyes(6, -28, 7);
        oval(22, -17, 1, 1, '#66556b');
        smile(14, -12);
        for (const side of [-1, 1])
          shaped(bone, () => {
            ctx.moveTo(side * 10, -35);
            ctx.quadraticCurveTo(side * 15, -48, side * 17, -43);
            ctx.lineTo(side * 14, -33);
          });
        return true;
      }
      if (family === 'mine') {
        for (const side of [-1, 1]) {
          softRect(side * 9 - 6, 0, 12, 10, '#879b8b', 2);
          softRect(side * 10 - 8, 7, 16, 7, '#728b7e', 2);
          softPoly(
            [
              [side * 12, -19],
              [side * 22, -15],
              [side * 23, 0],
              [side * 15, 2],
            ],
            '#8fa799',
            2,
          );
          line(
            [
              [side * 16, -9],
              [side * 21, -10],
            ],
            '#c0cbb0',
            1,
          );
        }
        softPoly(
          [
            [-15, -3],
            [-18, -20],
            [-7, -26],
            [11, -24],
            [17, -11],
            [13, 2],
          ],
          '#a7baa5',
          2,
        );
        softPoly(
          [
            [-14, -25],
            [-13, -42],
            [9, -44],
            [17, -34],
            [12, -23],
          ],
          '#b6c5ab',
          2,
        );
        poly(
          [
            [-13, -40],
            [-7, -42],
            [-7, -27],
            [-13, -27],
          ],
          '#d0d6ba',
        );
        eyes(1, -32);
        for (const x of [-5, 7]) fillOval(x, -32, 1.5, 2, '#e5c578');
        poly(
          [
            [-6, -13],
            [0, -21],
            [7, -13],
            [0, -4],
          ],
          '#e6c67f',
        );
        line(
          [
            [-4, -13],
            [0, -17],
            [3, -12],
          ],
          '#fff0b9',
          1,
        );
        return true;
      }
      const colors = {
        crypt: ['#756781', bone],
        archive: ['#5d8588', '#aec3b5'],
        ridge: ['#a2835d', '#b5b488'],
        warlord: ['#936c5b', '#a2ae7c'],
        darklord: ['#65516f', '#bdb4b8'],
      }[family];
      if (!colors) return false;
      const [cloth, skinColor] = colors;
      shaped(cloth, () => {
        ctx.moveTo(-10, -17);
        ctx.quadraticCurveTo(-17, -8, -17, 9);
        ctx.quadraticCurveTo(0, 15, 17, 9);
        ctx.quadraticCurveTo(15, -9, 10, -17);
      });
      for (const side of [-1, 1]) {
        line(
          [
            [side * 7, 1],
            [side * 10, 9],
          ],
          family === 'crypt' ? bone : cloth,
          6,
        );
        oval(side * 10, 10, 7, 4, '#6d6d60');
        line(
          [
            [side * 10, -13],
            [side * 14, -5],
            [side * 16, -1],
          ],
          cloth,
          6,
        );
        grip(side * 16, -1, skinColor);
      }
      oval(0, -26, 16, 15, skinColor);
      eyes(0, -29);
      smile(0, -18);
      line(
        [
          [-9, 2],
          [9, 2],
        ],
        '#c6ad78',
        2,
      );
      if (family === 'crypt') {
        tricornHat(-38, 1.05);
        oval(0, -23, 1.6, 2, '#75776c');
        for (const x of [-5, 0, 5])
          line(
            [
              [x, -19],
              [x, -16],
            ],
            '#929580',
            0.7,
          );
        for (const y of [-10, -5])
          line(
            [
              [-7, y],
              [0, y + 1],
              [7, y],
            ],
            bone,
            1.5,
          );
        line(
          [
            [20, -31],
            [20, 11],
          ],
          '#ae9770',
          2.5,
        );
        oval(20, -32, 5, 4, '#b6adc2');
        grip(18, -2, bone);
        line(
          [
            [-14, -9],
            [-11, -4],
          ],
          bone,
          2,
        );
      } else if (family === 'archive') {
        shaped('#52777f', () => {
          ctx.moveTo(-16, -28);
          ctx.quadraticCurveTo(-17, -45, -3, -48);
          ctx.quadraticCurveTo(15, -49, 18, -28);
          ctx.lineTo(12, -30);
          ctx.quadraticCurveTo(2, -44, -10, -31);
        });
        line(
          [
            [-13, -31],
            [-5, -43],
            [6, -41],
            [14, -31],
          ],
          '#9ab6aa',
          1.2,
        );
        softRect(-19, -8, 15, 11, '#9da98d', 1.5);
        line(
          [
            [-12, -7],
            [-12, 2],
          ],
          '#ddd4b0',
          1,
        );
        staffAnchor(21);
        grip(18, -2, skinColor);
      } else if (family === 'ridge') {
        for (const side of [-1, 1])
          shaped(bone, () => {
            ctx.moveTo(side * 10, -35);
            ctx.quadraticCurveTo(side * 20, -39, side * 18, -45);
            ctx.quadraticCurveTo(side * 24, -34, side * 13, -31);
          });
        line(
          [
            [-10, -32],
            [-4, -31],
          ],
          '#7b805d',
          1.4,
        );
        line(
          [
            [4, -31],
            [10, -32],
          ],
          '#7b805d',
          1.4,
        );
        oval(0, -23, 4, 3, '#c3c192');
        softRect(-9, -13, 18, 11, '#7c775d', 2);
        craftAt(1.75, 2, 0.75, treasuryHammer);
        grip(19, -1, skinColor);
        craftAt(-16, -1, 0.85, treasuryMoneyBag);
        grip(-16, -1, skinColor);
      } else if (family === 'warlord') {
        for (const side of [-1, 1]) {
          softPoly(
            [
              [side * 11, -33],
              [side * 24, -36],
              [side * 14, -26],
            ],
            '#a2ae7c',
            2,
          );
          shaped(bone, () => {
            ctx.moveTo(side * 6, -19);
            ctx.quadraticCurveTo(side * 11, -22, side * 9, -27);
            ctx.lineTo(side * 5, -22);
          });
        }
        line(
          [
            [-10, -32],
            [-3, -30],
          ],
          '#647850',
          2,
        );
        line(
          [
            [3, -30],
            [10, -32],
          ],
          '#647850',
          2,
        );
        oval(0, -23, 5, 3, '#bdbe8a');
        softRect(-9, -13, 18, 12, '#765340', 2);
        line(
          [
            [-10, -15],
            [9, -2],
          ],
          '#c6a170',
          2,
        );
        craftAt(1.75, 0.5, 0.75, () => governorAxe());
        grip(19, -1, skinColor);

        shaped('#778b85', () => {
          ctx.moveTo(-11, -34);
          ctx.quadraticCurveTo(-12, -45, 0, -46);
          ctx.quadraticCurveTo(12, -45, 11, -34);
          ctx.quadraticCurveTo(0, -38, -11, -34);
        });
        softRect(-2, -45, 4, 4, gold, 1);
      } else {
        softPoly(
          [
            [-12, -16],
            [-18, 9],
            [-8, 11],
            [0, -5],
            [9, 11],
            [18, 9],
            [12, -16],
          ],
          '#574260',
          3,
        );
        royalCrown(-38);
        line(
          [
            [-7, -31],
            [-2, -30],
          ],
          '#59605c',
          1.2,
        );
        line(
          [
            [3, -30],
            [8, -31],
          ],
          '#59605c',
          1.2,
        );
        sword(18, -7);
        grip(20, 2, skinColor);
        shield(-18, 0, '#8b6e89');
        for (const x of [-6, 6]) {
          softRect(x - 3.5, -33, 7, 4.5, '#bdb4b8', 0.4);
          line(
            [
              [x - 2.5, -29],
              [x + 2.5, -29],
            ],
            '#515655',
            1,
          );
        }
      }
      return true;
    }

    function bossPet(family) {
      craftedPet(family);
    }

    function wolf(c = '#8c9998', large = false) {
      const forestCoat = region === 2 && !large;
      // Tapered trunk, shoulder, haunch and bent hocks replace the box and four sticks.
      ctx.fillStyle = c;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-22, 2);
      ctx.bezierCurveTo(-29, -5, -24, -19, -13, -19);
      ctx.bezierCurveTo(-2, -22, 6, -17, 15, -14);
      ctx.quadraticCurveTo(23, -8, 20, 3);
      ctx.quadraticCurveTo(6, 10, -8, 6);
      ctx.quadraticCurveTo(-17, 8, -22, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-21, -10);
      ctx.quadraticCurveTo(-28, -10, -35, -20);
      ctx.quadraticCurveTo(-39, -8, -27, 1);
      ctx.lineTo(-20, 3);
      ctx.fill();
      ctx.stroke();
      for (const [x, y] of [
        [-16, 1],
        [-6, 3],
        [10, 2],
        [18, 0],
      ]) {
        line(
          [
            [x, y],
            [x - 3, y + 6],
            [x - 2, 12],
            [x + 2, 13],
          ],
          c,
          4.5,
        );
        oval(x, 13, 4.1, 1.9, c);
      }
      oval(9, -8, 9, 12, c);
      oval(-15, -3, 8, 9, c);
      if (forestCoat) {
        // Buff underside, dark dorsal guard hairs and rusty ears/legs recall American red wolves.
        shaped('#514739', () => {
          ctx.moveTo(-21, -14);
          ctx.quadraticCurveTo(-12, -23, 1, -17);
          ctx.quadraticCurveTo(7, -18, 14, -13);
          ctx.lineTo(5, -10);
          ctx.quadraticCurveTo(-9, -15, -21, -14);
        });
        oval(-1, 4, 14, 3.5, '#cbb38a');
        oval(12, -5, 5, 9, '#cbb38a');
        for (const x of [-16, -6, 10, 18])
          line(
            [
              [x - 1, 6],
              [x - 2, 11],
            ],
            '#a86c49',
            2,
          );
      }
      if (forestCoat) {
        ctx.fillStyle = c;
        ctx.strokeStyle = ink;
      }
      ctx.beginPath();
      ctx.moveTo(10, -16);
      ctx.quadraticCurveTo(8, -26, 14, -28);
      ctx.lineTo(12, -31);
      ctx.lineTo(20, -25);
      ctx.lineTo(24, -31);
      ctx.lineTo(28, -18);
      ctx.quadraticCurveTo(30, -15, 35, -12);
      ctx.quadraticCurveTo(36, -8, 31, -6);
      ctx.lineTo(18, -7);
      ctx.quadraticCurveTo(14, -8, 10, -16);
      ctx.fill();
      ctx.stroke();
      poly(
        [
          [14, -28],
          [17, -24],
          [14, -23],
        ],
        forestCoat ? '#b67a5b' : '#bdafa0',
      );
      poly(
        [
          [24, -27],
          [26, -20],
          [22, -21],
        ],
        forestCoat ? '#b67a5b' : '#bdafa0',
      );
      line(
        [
          [20, -11],
          [29, -10],
        ],
        '#5c605b',
        1.2,
      );
      oval(33, -12, 2.4, 1.6, '#343c38');
      eye(24, -18);
      line(
        [
          [-12, -12],
          [-3, -15],
          [5, -10],
        ],
        forestCoat ? '#d7bd94' : '#a9b5a6',
        1.3,
      );
      poly(
        [
          [28, -9],
          [31, -8],
          [29, -4],
        ],
        bone,
      );
      // Fur breaks follow the shoulder and haunch, with toes grounded under each hock.
      for (const [x, y] of [
        [-20, -10],
        [-11, -15],
        [2, -13],
        [12, -9],
      ])
        line(
          [
            [x, y],
            [x + 3, y + 2],
            [x + 6, y],
          ],
          forestCoat ? '#d4b98d' : '#c1c5af',
          0.8,
        );
      for (const x of [-16, -6, 10, 18])
        for (const dx of [-1, 1])
          line(
            [
              [x + dx, 12],
              [x + dx + 1, 14],
            ],
            '#53675c',
            0.6,
          );
      if (large) {
        line(
          [
            [-19, -11],
            [-6, -18],
            [11, -12],
          ],
          '#6f5c3f',
          3,
        );
        for (const [x, y, ang] of [
          [-20, -13, -0.7],
          [-12, -18, -0.3],
          [-3, -17, 0.4],
          [4, -12, 0.9],
          [10, -13, 0.5],
        ])
          craftAt(x, y, 1, () => {
            ctx.rotate(ang);
            shaped('#64804f', () => {
              ctx.moveTo(-3, 0);
              ctx.quadraticCurveTo(-7, -9, 0, -12);
              ctx.quadraticCurveTo(6, -4, 3, 2);
            });
            line(
              [
                [0, -9],
                [0, 0],
              ],
              '#a5b27a',
              0.7,
            );
          });
        line(
          [
            [10, -28],
            [18, -31],
            [26, -27],
          ],
          '#59432f',
          3,
        );
        for (const [x, y, flip] of [
          [13, -29, -1],
          [23, -28, 1],
        ]) {
          line(
            [
              [x, y],
              [x + flip * 3, y - 10],
              [x + flip * 8, y - 19],
            ],
            '#b4a16f',
            3,
          );
          line(
            [
              [x + flip * 3, y - 10],
              [x + flip * 11, y - 11],
              [x + flip * 14, y - 16],
            ],
            '#a18c62',
            2,
          );
          line(
            [
              [x + flip * 5, y - 14],
              [x + flip * 4, y - 20],
            ],
            '#b4a16f',
            1.5,
          );
          oval(x, y, 3, 2, '#876c44');
          line(
            [
              [x - 2, y - 2],
              [x + 2, y],
              [x - 2, y + 2],
            ],
            '#d6b783',
            1,
          );
        }
        // A fang pendant hangs from the woodland harness rather than growing from fur.
        line(
          [
            [-14, -12],
            [-11, -3],
          ],
          '#5b4732',
          1.3,
        );
        shaped(
          bone,
          () => {
            ctx.moveTo(-13, -4);
            ctx.lineTo(-9, -4);
            ctx.quadraticCurveTo(-8, 2, -14, 4);
            ctx.quadraticCurveTo(-11, 0, -13, -4);
          },
          0.7,
        );
      }
    }

    function crownDirewolfRider(ranged = false) {
      ctx.save();
      ctx.scale(1.14, 1.14);
      // Animal and rider both face right. A single visible bent leg follows the
      // near flank; the far leg is occluded by the saddle and animal's body.
      ctx.save();
      ctx.translate(0, 13);
      ctx.scale(1.22, 1.22);
      ctx.translate(0, -13);
      wolf(region === 2 ? '#79614b' : '#65717c');
      for (const x of [-17, -5, 9])
        poly(
          [
            [x, -16],
            [x + 7, -21],
            [x + 13, -16],
            [x + 8, -8],
          ],
          '#8c9699',
        );
      poly(
        [
          [14, -25],
          [25, -23],
          [29, -15],
          [35, -12],
          [32, -8],
          [17, -11],
        ],
        '#9eafb3',
      );
      line(
        [
          [14, -22],
          [21, -21],
          [25, -16],
        ],
        '#d8d5b9',
        1.1,
      );
      line(
        [
          [29, -12],
          [18, -15],
          [12, -10],
        ],
        '#b89b6a',
        2,
      );
      poly(
        [
          [-15, -22],
          [-12, -28],
          [3, -28],
          [9, -21],
          [3, -17],
          [-10, -18],
        ],
        '#614a3b',
      );
      line(
        [
          [-12, -22],
          [0, -25],
          [7, -21],
        ],
        '#bd9c67',
        2.5,
      );
      line(
        [
          [-4, -20],
          [-1, -4],
        ],
        '#5d4b38',
        3,
      );
      line(
        [
          [-3, -20],
          [0, -5],
        ],
        '#c4a776',
        0.7,
      );
      ctx.restore();
      // Small far boot and stirrup peek beyond the chest, not a second spread leg.
      softPoly(
        [
          [7, -18],
          [11, -17],
          [13, -8],
          [18, -7],
          [18, -4],
          [10, -4],
        ],
        '#485766',
        1,
      );
      line(
        [
          [9, -4],
          [18, -4],
        ],
        '#c2a676',
        1.4,
      );
      if (ranged) backQuiver(-11, -44, 0.65);
      // Profile coat and plate: narrower back, forward chest, one side insignia.
      shaped('#41566a', () => {
        ctx.moveTo(-9, -28);
        ctx.lineTo(-10, -43);
        ctx.quadraticCurveTo(-6, -49, 2, -47);
        ctx.lineTo(10, -40);
        ctx.lineTo(8, -27);
        ctx.lineTo(-3, -25);
      });
      poly(
        [
          [-6, -45],
          [3, -45],
          [9, -39],
          [7, -31],
          [-6, -32],
        ],
        '#9eafb8',
      );
      poly(
        [
          [3, -45],
          [9, -39],
          [7, -31],
          [2, -33],
        ],
        '#687e8e',
      );
      line(
        [
          [-5, -42],
          [-4, -34],
        ],
        '#d9ddcd',
        1.1,
      );
      poly(
        [
          [-2, -40],
          [1, -43],
          [4, -40],
          [1, -37],
        ],
        '#dbc17e',
      );
      // Hip, forward knee, dropped shin and forward boot describe a riding seat.
      shaped('#586679', () => {
        ctx.moveTo(-8, -28);
        ctx.lineTo(0, -29);
        ctx.lineTo(11, -19);
        ctx.lineTo(8, -7);
        ctx.lineTo(13, -5);
        ctx.lineTo(13, -2);
        ctx.lineTo(2, -2);
        ctx.lineTo(1, -8);
        ctx.lineTo(3, -17);
        ctx.lineTo(-7, -22);
      });
      poly(
        [
          [5, -20],
          [11, -19],
          [9, -10],
          [3, -11],
        ],
        '#91a6ae',
      );
      line(
        [
          [5, -18],
          [7, -12],
        ],
        '#d0d6c6',
        1,
      );
      line(
        [
          [1, -24],
          [1, -5],
          [14, -5],
        ],
        '#b39a69',
        1.2,
      );
      line(
        [
          [1, -2],
          [14, -2],
        ],
        '#d0b57d',
        1.6,
      );
      // Visored profile helmet, with a nose-facing edge rather than two eyes.
      shaped('#8ea2ad', () => {
        ctx.moveTo(-7, -50);
        ctx.lineTo(-7, -58);
        ctx.quadraticCurveTo(0, -66, 8, -59);
        ctx.lineTo(11, -52);
        ctx.lineTo(9, -47);
        ctx.lineTo(1, -46);
        ctx.lineTo(-4, -49);
      });
      poly(
        [
          [1, -55],
          [10, -55],
          [12, -51],
          [8, -48],
          [1, -48],
        ],
        '#b6c4c5',
      );
      line(
        [
          [3, -54],
          [9, -53],
        ],
        '#233b45',
        1.7,
      );
      line(
        [
          [-5, -57],
          [0, -60],
          [5, -59],
        ],
        '#e2d1a2',
        1.2,
      );
      poly(
        [
          [-1, -62],
          [1, -70],
          [4, -62],
        ],
        '#d9c086',
      );
      // Forward arms and reins are tied to the same seated shoulder and muzzle.
      line(
        [
          [1, -41],
          [8, -34],
          [15, -30],
        ],
        '#526c7b',
        5,
      );
      line(
        [
          [4, -41],
          [10, -39],
          [20, -40],
        ],
        '#8398a2',
        4,
      );
      line(
        [
          [15, -30],
          [27, -25],
          [41, -16],
        ],
        '#584334',
        1.2,
      );
      line(
        [
          [15, -29],
          [28, -20],
          [41, -14],
        ],
        '#b69a6c',
        0.8,
      );
      if (ranged) {
        craftAt(24, -31, 0.75, () => bow(0, 0));
        line(
          [
            [12, -39],
            [32, -40],
          ],
          '#c6ae7f',
          1.3,
        );
        poly(
          [
            [32, -40],
            [28, -42],
            [28, -38],
          ],
          '#b8c5bb',
        );
      } else {
        line(
          [
            [11, -23],
            [22, -41],
            [49, -64],
          ],
          '#bea16f',
          3,
        );
        poly(
          [
            [46, -63],
            [56, -72],
            [52, -60],
            [48, -57],
          ],
          '#acbdc2',
        );
        line(
          [
            [51, -67],
            [49, -60],
          ],
          '#e6e9d6',
          1,
        );
        poly(
          [
            [-12, -39],
            [-5, -42],
            [-2, -30],
            [-9, -27],
          ],
          '#5f788d',
        );
      }
      grip(15, -30, '#aebbc0');
      grip(20, -40, '#aebbc0');
      ctx.restore();
    }
    function crocodile(c = '#71886a', boss = false) {
      shaped(c, () => {
        ctx.moveTo(-17, -4);
        ctx.bezierCurveTo(-29, -3, -40, -1, -51, 5);
        ctx.quadraticCurveTo(-29, 12, -15, 7);
      });
      for (const side of [-1, 1])
        for (const x of [-14, 8]) {
          shaped(c, () => {
            ctx.moveTo(x - 5, -2);
            ctx.quadraticCurveTo(x - 11, side * 10, x - 8, side * 13);
            ctx.lineTo(x + 1, side * 14);
            ctx.lineTo(x + 3, side * 10);
            ctx.lineTo(x - 4, side * 8);
            ctx.lineTo(x + 3, 1);
          });
          if (side > 0)
            for (const dx of [-3, 0, 3])
              line(
                [
                  [x + dx, 11],
                  [x + dx + 2, 14],
                ],
                bone,
                1,
              );
        }
      shaped(c, () => {
        ctx.moveTo(-23, -3);
        ctx.bezierCurveTo(-28, -17, 8, -20, 19, -7);
        ctx.quadraticCurveTo(26, 4, 16, 10);
        ctx.quadraticCurveTo(-6, 18, -23, 7);
      });
      fillOval(-2, 5, 20, 6, '#c0c68f', 0.2);
      shaped(boss ? '#a5ab7e' : '#97a979', () => {
        ctx.moveTo(14, 2);
        ctx.quadraticCurveTo(30, 0, 45, 3);
        ctx.quadraticCurveTo(48, 9, 37, 12);
        ctx.lineTo(18, 10);
        ctx.quadraticCurveTo(12, 8, 14, 2);
      });
      shaped(c, () => {
        ctx.moveTo(12, boss ? -12 : -8);
        ctx.quadraticCurveTo(16, boss ? -26 : -19, 28, boss ? -16 : -13);
        ctx.quadraticCurveTo(35, -12, 44, -8);
        ctx.quadraticCurveTo(51, -4, 45, 2);
        ctx.quadraticCurveTo(27, 5, 14, 1);
      });
      oval(23, boss ? -16 : -12, 6, boss ? 3.5 : 4, c);
      oval(25, boss ? -17 : -13, 2, 2.3, '#d8c67c');
      oval(25.5, boss ? -17 : -13, boss ? 0.7 : 1, 1.5, '#304b39');
      if (boss) {
        shaped(
          '#344b3b',
          () => {
            ctx.moveTo(18, 2);
            ctx.lineTo(46, 1);
            ctx.lineTo(42, 10);
            ctx.quadraticCurveTo(28, 13, 18, 7);
          },
          0.8,
        );
        line(
          [
            [18, -21],
            [24, -20],
            [29, -17],
          ],
          '#42563c',
          2.6,
        );
        line(
          [
            [14, -6],
            [27, -9],
            [38, -7],
          ],
          '#a8ad7a',
          1.4,
        );
      }
      line(
        [
          [17, 2],
          [32, 3],
          [45, 1],
        ],
        '#405840',
        1.2,
      );
      for (const x of boss ? [21, 27, 34, 41] : [23, 31, 39])
        softPoly(
          [
            [x, 3],
            [x + 2, boss ? 10 : 7],
            [x + 4, 3],
          ],
          bone,
          0.4,
        );
      if (boss) {
        for (const x of [25, 37])
          poly(
            [
              [x, 12],
              [x + 2, 8],
              [x + 4, 12],
            ],
            bone,
          );
        line(
          [
            [15, 11],
            [29, 16],
            [42, 13],
          ],
          '#4a603f',
          1.4,
        );
      }
      const plates = boss
        ? [
            [-22, 7],
            [-13, 11],
            [-3, 14],
            [7, 11],
            [16, 8],
          ]
        : [
            [-19, 7],
            [-8, 7],
            [3, 7],
            [12, 7],
          ];
      for (const [x, h] of plates) {
        shaped(boss ? '#7b8560' : '#596c4d', () => {
          ctx.moveTo(x, -10);
          ctx.lineTo(x + 3, -10 - h);
          if (boss) {
            ctx.lineTo(x + 6, -17);
            ctx.lineTo(x + 9, -8);
          } else ctx.quadraticCurveTo(x + 8, -13, x + 9, -8);
        });
        line(
          [
            [x + 2, -10],
            [x + 4, -12 - h * 0.5],
          ],
          '#aeb38a',
          0.8,
        );
      }
      for (const [x, y] of [
        [-14, -2],
        [-4, 1],
        [6, -3],
      ])
        softPoly(
          [
            [x - 3, y],
            [x, y - 3],
            [x + 4, y],
            [x, y + 2],
          ],
          '#9bab7b',
          1,
        );
      oval(42, -6, 1.2, 1, '#3b5340');
      line(
        [
          [-42, 5],
          [-27, 3],
          [-19, -1],
        ],
        '#a0ac7b',
        1.1,
      );
    }

    function dragon(c = '#765080') {
      // Shoulder, elbow and finger rays support curved, tensioned membranes.
      for (const side of [-1, 1]) {
        shaped(c, () => {
          ctx.moveTo(side * 10, -15);
          ctx.quadraticCurveTo(side * 15, -34, side * 29, -47);
          ctx.quadraticCurveTo(side * 47, -43, side * 55, -24);
          ctx.quadraticCurveTo(side * 43, -27, side * 39, -9);
          ctx.quadraticCurveTo(side * 29, -20, side * 24, -13);
          ctx.quadraticCurveTo(side * 18, -8, side * 10, -15);
        });
        line(
          [
            [side * 10, -14],
            [side * 18, -31],
            [side * 29, -46],
          ],
          '#b28a9d',
          3,
        );
        oval(side * 18, -31, 3, 3, '#a57c91');
        oval(side * 29, -45, 3, 3, '#b995a1');
        for (const [x, y] of [
          [53, -25],
          [39, -10],
          [24, -13],
        ])
          line(
            [
              [side * 29, -44],
              [side * x, y],
            ],
            '#c19aaa',
            1.3,
          );
        shaped(bone, () => {
          ctx.moveTo(side * 28, -47);
          ctx.quadraticCurveTo(side * 33, -54, side * 34, -49);
          ctx.lineTo(side * 31, -44);
        });
      }
      shaped(c, () => {
        ctx.moveTo(-8, 9);
        ctx.quadraticCurveTo(-22, 26, -38, 13);
        ctx.quadraticCurveTo(-28, 32, -1, 20);
        ctx.lineTo(7, 12);
      });
      for (const side of [-1, 1]) {
        oval(side * 12, 8, 9, 13, c);
        line(
          [
            [side * 10, 9],
            [side * 17, 18],
          ],
          c,
          8,
        );
        oval(side * 18, 20, 9, 4, c);
        for (const dx of [-3, 1, 5])
          softPoly(
            [
              [side * 18 + dx, 18],
              [side * 18 + dx + 1, 24],
              [side * 18 + dx + 3, 20],
            ],
            bone,
            0.5,
          );
      }
      oval(0, -8, 16, 24, c);
      oval(1, -2, 10, 18, '#af94a3');
      for (const y of [-15, -8, 0, 8])
        line(
          [
            [-6, y],
            [0, y + 2],
            [7, y],
          ],
          '#806f86',
          1,
        );
      shaped(c, () => {
        ctx.moveTo(-7, -21);
        ctx.quadraticCurveTo(-8, -37, 1, -47);
        ctx.quadraticCurveTo(12, -52, 23, -40);
        ctx.lineTo(29, -35);
        ctx.quadraticCurveTo(32, -26, 19, -25);
        ctx.lineTo(5, -25);
      });
      shaped('#a17d9a', () => {
        ctx.moveTo(12, -34);
        ctx.quadraticCurveTo(28, -39, 30, -31);
        ctx.quadraticCurveTo(26, -26, 14, -28);
      });
      for (const [x, y] of [
        [4, -45],
        [17, -44],
      ])
        shaped(bone, () => {
          ctx.moveTo(x - 3, y);
          ctx.quadraticCurveTo(x - 6, y - 14, x - 1, y - 11);
          ctx.lineTo(x + 4, y + 1);
        });
      oval(15, -39, 3, 2.6, '#dbb27c');
      oval(16, -39, 1.2, 2, '#354239');
      line(
        [
          [11, -42],
          [18, -43],
        ],
        '#4c3f60',
        2,
      );
      oval(27, -33, 1.1, 1, '#493d57');
      line(
        [
          [15, -28],
          [26, -29],
        ],
        '#4a4058',
        1,
      );
      for (const x of [18, 24])
        softPoly(
          [
            [x, -28],
            [x + 1, -25],
            [x + 3, -28],
          ],
          bone,
          0.4,
        );
      for (const side of [-1, 1]) {
        line(
          [
            [side * 10, -19],
            [side * 17, -7],
            [side * 14, 1],
          ],
          c,
          7,
        );
        oval(side * 15, 0, 5, 4, c);
        for (const dx of [-2, 2])
          line(
            [
              [side * 15 + dx, 0],
              [side * 15 + dx + 1, 4],
            ],
            bone,
            1,
          );
      }
    }

    function human(role) {
      const mage = role === 'mage',
        ranger = role === 'ranger' || role === 'archer',
        worker = role === 'worker',
        paladin = role === 'paladin';
      const cloth = mage ? '#637ca5' : ranger ? '#6e9468' : worker ? '#af9063' : '#708c9c';
      if (ranger)
        shaped('#49664d', () => {
          ctx.moveTo(-9, -22);
          ctx.quadraticCurveTo(-21, -10, -19, 11);
          ctx.quadraticCurveTo(-7, 14, 2, 7);
          ctx.lineTo(10, -20);
        });
      if (ranger) backQuiver();
      humanoid(cloth, skin, 1, false);
      grip(-15, -1);
      if (mage) {
        shaped('#596f97', () => {
          ctx.moveTo(-8, -18);
          ctx.quadraticCurveTo(-10, -2, -15, 9);
          ctx.quadraticCurveTo(0, 15, 15, 9);
          ctx.quadraticCurveTo(10, -3, 8, -18);
        });
        for (const x of [-7, 7])
          line(
            [
              [x, -13],
              [x * 1.4, 8],
            ],
            '#95acbf',
            1,
          );
        mageHead();
        acceptedStaff();
        grip(17, -2);
        poly(
          [
            [0, -16],
            [3, -12],
            [0, -8],
            [-3, -12],
          ],
          '#c3bd83',
        );
      } else if (ranger) {
        shaped('#55764f', () => {
          ctx.moveTo(-10, -27);
          ctx.quadraticCurveTo(-14, -43, 0, -45);
          ctx.quadraticCurveTo(13, -43, 11, -27);
          ctx.lineTo(7, -31);
          ctx.quadraticCurveTo(0, -39, -7, -32);
        });
        face(0, -29, skin, 1, false, 'stern');
        coiffure('short', '#c2a05c');
        if (role === 'ranger') beard('goatee');
        line(
          [
            [-8, -18],
            [9, -4],
          ],
          '#b59c6f',
          3,
        );
        bow(17, -7);
        grip(16, -5);
        grip(-15, -1);
        if (role === 'ranger') {
          softPoly(
            [
              [-12, -20],
              [-17, -12],
              [-5, -10],
              [0, -16],
              [9, -11],
              [12, -17],
            ],
            '#6f8c61',
            2,
          );
          oval(-6, -13, 2, 2, gold);
        }
      } else if (worker) {
        shaped('#bea56e', () => {
          ctx.moveTo(-10, -34);
          ctx.quadraticCurveTo(-8, -43, 2, -42);
          ctx.quadraticCurveTo(9, -42, 11, -34);
          ctx.quadraticCurveTo(0, -31, -10, -34);
        });
        softPoly(
          [
            [-6, -15],
            [6, -15],
            [6, -5],
            [10, 5],
            [-10, 5],
            [-6, -5],
          ],
          '#79604a',
          2,
        );
        softRect(-4, -4, 8, 6, '#9b7d57', 1);
        line(
          [
            [17, -26],
            [11, 14],
          ],
          '#ad8c60',
          3,
        );
        softPoly(
          [
            [9, -30],
            [24, -28],
            [25, -24],
            [11, -25],
          ],
          steel,
          1,
        );
        grip(14, -3);
      } else {
        const plate = paladin ? '#aebfc0' : '#98aeb2';
        softPoly(
          [
            [-9, -19],
            [0, -22],
            [9, -19],
            [8, -3],
            [0, 0],
            [-8, -3],
          ],
          plate,
          2.5,
        );
        line(
          [
            [0, -18],
            [0, -3],
          ],
          '#d2d9cd',
          1.2,
        );
        for (const side of [-1, 1]) {
          softPoly(
            [
              [side * 8, -18],
              [side * 14, -21],
              [side * 19, -16],
              [side * 16, -10],
              [side * 10, -11],
            ],
            plate,
            2.8,
          );
          line(
            [
              [side * 11, -17],
              [side * 16, -16],
            ],
            '#d8dfcf',
            1,
          );
        }
        plateHelmet(paladin);
        shield(-19, -1, paladin ? '#497694' : '#6a8178');
        sword(18, -7);
        grip(20, 2, plate);
        line(
          [
            [-18, 0],
            [-15, 2],
          ],
          '#c8c8ae',
          1,
        );
      }
      if (paladin) {
        line(
          [
            [0, -16],
            [0, -5],
          ],
          '#dfc67f',
          2,
        );
        line(
          [
            [-4, -12],
            [4, -12],
          ],
          '#dfc67f',
          2,
        );
      }
      if (mage)
        shaped(
          '#dfcb8e',
          () => {
            ctx.moveTo(-2, -49);
            ctx.quadraticCurveTo(-7, -42, 0, -42);
            ctx.quadraticCurveTo(4, -42, 4, -45);
            ctx.quadraticCurveTo(-2, -42, -2, -49);
          },
          0.4,
        );
      if (role === 'ranger') {
        craftAt(-10, -8, 0.45, () => bottle(0, 0, '#81afa2'));
        line(
          [
            [-11, -17],
            [-10, -12],
          ],
          '#c8ad76',
          1,
        );
      }
    }

    function goblinArcher() {
      goblinBody(false, true, true);
      softPoly(
        [
          [-10, -18],
          [-15, -9],
          [-7, -7],
          [0, -13],
          [8, -7],
          [12, -12],
          [9, -18],
        ],
        '#69875b',
        2,
      );
      line(
        [
          [-8, -14],
          [0, -10],
          [8, -14],
        ],
        '#a1b181',
        1,
      );
      grip(15, -4, '#9caa78');
    }

    // Rogue first-play procedural art: one static presentation shared by the
    // Canvas renderer and Pixi's procedural fallback, never game/save state.
    function rogueBellStaff(crowned = false) {
      const brass = crowned ? '#e0be77' : '#d6b16b';
      // ONE suspended spherical jingle bell on a hooked staff. Its head stays
      // separate from the shaft and from the Mage's crystal-staff silhouette.
      line(
        [
          [17, 13],
          [17, -44],
        ],
        '#49362e',
        4.6,
      );
      line(
        [
          [18, 11],
          [18, -43],
        ],
        '#a57a4d',
        1.1,
      );
      shaped(
        brass,
        () => {
          ctx.moveTo(15, -44);
          ctx.bezierCurveTo(14, -52, 24, -54, 29, -49);
          ctx.lineTo(28, -46);
          ctx.bezierCurveTo(24, -51, 19, -49, 19, -43);
        },
        0.85,
      );
      oval(28, -47, 2.4, 2.1, '#a67a46');
      line(
        [
          [28, -46],
          [28, -43],
        ],
        '#e8cd8a',
        1.7,
      );
      oval(28, -35, 8, 8, brass);
      fillOval(25, -38, 2.8, 3.1, '#f6df9f', 0.65);
      line(
        [
          [22.5, -33.5],
          [33.5, -33.5],
        ],
        '#795035',
        1.8,
      );
      oval(28, -29.5, 1.7, 1.5, '#624734');
      line(
        [
          [25.5, -32],
          [28, -30],
          [30.5, -32],
        ],
        '#b37d3d',
        0.85,
      );
      softRect(14.7, -6, 4.6, 10, crowned ? '#6e405b' : '#614163', 1);
      for (const y of [-3, 1])
        line(
          [
            [15, y],
            [19, y - 1],
          ],
          brass,
          0.9,
        );
    }

    function rogueHero(crowned = false) {
      const complexion = '#986548',
        darkHair = '#1b1723',
        goldTrim = crowned ? '#e0be77' : '#d6b16b';
      // World-space foot anchor matches the existing heroes. Clothing, hair,
      // weapon and crown never respond to time, facing or combat state.
      shaped(crowned ? '#2b2039' : '#382b4e', () => {
        ctx.moveTo(-8, -20);
        ctx.bezierCurveTo(-20, -15, -19, -1, -20, 10);
        ctx.quadraticCurveTo(-9, 14, -1, 9);
        ctx.quadraticCurveTo(13, 17, 18, 9);
        ctx.quadraticCurveTo(12, -6, 9, -20);
      });
      if (crowned)
        shaped('#7d3345', () => {
          ctx.moveTo(-14, -16);
          ctx.quadraticCurveTo(-21, -3, -16, 9);
          ctx.lineTo(-7, 8);
          ctx.quadraticCurveTo(-13, -7, -9, -19);
        });
      // Long wavy, uncovered black hair: a silhouette rather than a helmet.
      shaped(darkHair, () => {
        ctx.moveTo(-8, -37);
        ctx.bezierCurveTo(-17, -38, -17, -27, -14, -21);
        ctx.quadraticCurveTo(-20, -11, -13, 1);
        ctx.quadraticCurveTo(-9, 4, -8, -3);
        ctx.quadraticCurveTo(-13, -20, -6, -29);
        ctx.lineTo(8, -37);
        ctx.bezierCurveTo(17, -34, 14, -21, 16, -16);
        ctx.quadraticCurveTo(20, -7, 13, 2);
        ctx.quadraticCurveTo(10, 4, 9, -2);
        ctx.quadraticCurveTo(12, -22, 7, -30);
      });
      humanoid(crowned ? '#45324e' : '#614163', complexion, 0.94, false);
      // One-shoulder sari-inspired plum drape over practical layered trousers.
      softPoly(
        [
          [-11, -15],
          [-15, -7],
          [-13, 9],
          [-4, 11],
          [0, -6],
        ],
        crowned ? '#332741' : '#382b4e',
        2,
      );
      softPoly(
        [
          [3, -18],
          [11, -17],
          [12, -2],
          [15, 10],
          [3, 11],
          [-2, -4],
        ],
        crowned ? '#412b4a' : '#614163',
        2,
      );
      line(
        [
          [-11, 8],
          [-5, 9],
          [0, 4],
        ],
        goldTrim,
        1.1,
      );
      line(
        [
          [6, 9],
          [12, 9],
        ],
        '#ba6e42',
        1.2,
      );
      shaped(
        '#ba6e42',
        () => {
          ctx.moveTo(-11, -20);
          ctx.quadraticCurveTo(-5, -22, -2, -18);
          ctx.lineTo(8, 3);
          ctx.quadraticCurveTo(3, 6, -1, 3);
          ctx.lineTo(-8, -13);
        },
        0.9,
      );
      line(
        [
          [-8, -16],
          [0, -2],
          [7, 2],
        ],
        goldTrim,
        1.2,
      );
      // Dark burgundy sash and modest brass jewelry, not armor or a corset.
      softPoly(
        [
          [-10, -4],
          [7, -4],
          [10, 0],
          [-9, 1],
        ],
        crowned ? '#7d3345' : '#773b51',
        1,
      );
      oval(1, -1, 2.1, 1.7, goldTrim);
      for (const x of [-13, 13]) {
        line(
          [
            [x - 2, -4],
            [x + 2, -3],
          ],
          goldTrim,
          1.4,
        );
        line(
          [
            [x - 2, -1],
            [x + 2, 0],
          ],
          '#b78b54',
          0.9,
        );
      }
      // Repaint the face in the existing native expression vocabulary: sly.
      face(0, -29, complexion, 0.94, false, 'sly', '#753d47');
      // Frame the face with free, wavy side locks; never obscure her eyes.
      shaped(
        darkHair,
        () => {
          ctx.moveTo(-9, -35);
          ctx.quadraticCurveTo(-14, -32, -12, -24);
          ctx.lineTo(-8, -20);
          ctx.quadraticCurveTo(-10, -29, -6, -34);
        },
        0.6,
      );
      shaped(
        darkHair,
        () => {
          ctx.moveTo(9, -36);
          ctx.quadraticCurveTo(15, -31, 11, -22);
          ctx.lineTo(8, -20);
          ctx.quadraticCurveTo(10, -29, 6, -34);
        },
        0.6,
      );
      shaped(
        darkHair,
        () => {
          ctx.moveTo(-9, -36);
          ctx.quadraticCurveTo(-6, -44, 2, -42);
          ctx.quadraticCurveTo(10, -43, 10, -36);
          ctx.lineTo(7, -33);
          ctx.quadraticCurveTo(1, -37, -3, -34);
          ctx.lineTo(-8, -32);
        },
        0.7,
      );
      line(
        [
          [-6, -40],
          [1, -41],
          [7, -39],
        ],
        goldTrim,
        1.4,
      );
      oval(-8.5, -24, 1.2, 2, goldTrim);
      oval(8.5, -24, 1.2, 2, goldTrim);
      if (crowned) {
        // A narrow asymmetrical five-point obsidian/gold circlet, not a helmet.
        softPoly(
          [
            [-10, -39],
            [-12, -49],
            [-6, -45],
            [-3, -52],
            [1, -46],
            [5, -55],
            [7, -45],
            [12, -49],
            [10, -39],
          ],
          '#302735',
          0.75,
        );
        line(
          [
            [-10, -40],
            [0, -39],
            [10, -40],
          ],
          goldTrim,
          1.7,
        );
        poly(
          [
            [-2.3, -44],
            [0, -48],
            [2.3, -44],
            [0, -41],
          ],
          '#ad79c6',
        );
        fillOval(0, -44.5, 0.8, 1.2, '#f4d9eb');
      }
      // Present the unique instrument over one hand; no second weapon.
      rogueBellStaff(crowned);
      grip(16.8, -1, complexion);
    }

    function hero(role) {
      if (role === 'rogue') return rogueHero(false);
      const cape = role === 'paladin' ? '#785848' : role === 'mage' ? '#394f78' : '#355643';
      shaped(cape, () => {
        ctx.moveTo(-10, -21);
        ctx.quadraticCurveTo(-18, -8, -19, 10);
        ctx.quadraticCurveTo(-8, 15, 0, 11);
        ctx.quadraticCurveTo(9, 16, 18, 10);
        ctx.quadraticCurveTo(16, -9, 10, -21);
      });
      line(
        [
          [-14, -7],
          [-15, 9],
          [-6, 11],
        ],
        '#a09b76',
        0.9,
      );
      human(role);
      oval(0, -16, 2, 2, gold);
    }

    function crownedHero(role, openFace = false) {
      if (role === 'rogue') return rogueHero(true);
      const purple = '#4c405e',
        trim = '#d9b978',
        metal = role === 'paladin' ? '#9696a6' : '#697a82';
      shaped(purple, () => {
        ctx.moveTo(-11, -22);
        ctx.bezierCurveTo(-19, -14, -21, 1, -20, 11);
        ctx.quadraticCurveTo(-8, 15, 0, 11);
        ctx.quadraticCurveTo(10, 15, 20, 10);
        ctx.quadraticCurveTo(19, -10, 11, -22);
      });
      line(
        [
          [-15, -11],
          [-16, 8],
          [-7, 11],
        ],
        trim,
        1.2,
      );
      line(
        [
          [15, -11],
          [16, 8],
          [8, 11],
        ],
        trim,
        1.2,
      );
      if (role === 'ranger') backQuiver();
      humanoid(
        role === 'mage' ? '#637ca5' : role === 'ranger' ? '#536b58' : '#68717f',
        skin,
        1,
        false,
      );
      grip(-15, -1);
      if (role === 'mage') {
        shaped('#596f97', () => {
          ctx.moveTo(-8, -17);
          ctx.lineTo(-14, 9);
          ctx.quadraticCurveTo(0, 15, 14, 9);
          ctx.lineTo(8, -17);
        });
        for (const x of [-7, 7])
          line(
            [
              [x, -15],
              [x * 1.6, 9],
            ],
            trim,
            1.4,
          );
        line(
          [
            [0, -16],
            [0, 7],
          ],
          '#3d405a',
          1.5,
        );
        acceptedStaff();
        grip(17, -1);
        mageHead(true);
      } else if (role === 'ranger') {
        face(0, -29, skin, 1, false, 'stern');
        coiffure('short', '#c2a05c');
        beard('goatee');
        line(
          [
            [-8, -17],
            [7, -4],
          ],
          '#b19a69',
          3,
        );
        bow(18, -7);
        grip(17, -5);
        grip(-15, -1);
        softPoly(
          [
            [-12, -20],
            [-18, -12],
            [-8, -10],
            [0, -17],
            [8, -10],
            [15, -13],
            [11, -20],
          ],
          purple,
          3,
        );
        line(
          [
            [-10, -17],
            [0, -13],
            [10, -17],
          ],
          trim,
          1.4,
        );
      } else {
        softPoly(
          [
            [-10, -19],
            [0, -23],
            [10, -19],
            [9, -3],
            [0, 0],
            [-9, -3],
          ],
          metal,
          3,
        );
        for (const side of [-1, 1]) {
          softPoly(
            [
              [side * 9, -19],
              [side * 15, -23],
              [side * 21, -17],
              [side * 18, -10],
              [side * 11, -11],
            ],
            metal,
            3,
          );
          line(
            [
              [side * 12, -18],
              [side * 18, -17],
            ],
            trim,
            1.3,
          );
        }
        line(
          [
            [0, -20],
            [0, -3],
          ],
          '#c7c6be',
          1.2,
        );
        sword(18, -16);
        shield(-20, -1, '#65516e');
        grip(20, -5, '#9696a6');
        if (openFace) {
          // The Dark Lord retains his accepted open face; hero visor changes are separate.
          shaped('#687583', () => {
            ctx.moveTo(-9, -29);
            ctx.lineTo(-10, -39);
            ctx.quadraticCurveTo(0, -47, 10, -39);
            ctx.lineTo(9, -29);
            ctx.lineTo(6, -35);
            ctx.lineTo(-6, -35);
          });
        } else plateHelmet(true, true);
      }
      if (role !== 'mage') royalCrown(-40);
      poly(
        [
          [0, -17],
          [3, -13],
          [0, -9],
          [-3, -13],
        ],
        '#b595b7',
      );
      oval(0, -13, 1, 1, trim);
    }

    function protectedSmithBody(color, head = skin, bulk = 1) {
      softRect(-9 * bulk, 2, 7 * bulk, 13, '#39423e', 2.5);
      softRect(2 * bulk, 2, 7 * bulk, 13, '#39423e', 2.5);
      fillPoly(
        [
          [-9 * bulk, 7],
          [-2 * bulk, 7],
          [-2 * bulk, 15],
          [-10 * bulk, 15],
        ],
        '#17201d',
        0.24,
      );
      fillPoly(
        [
          [2 * bulk, 7],
          [9 * bulk, 7],
          [10 * bulk, 15],
          [3 * bulk, 15],
        ],
        '#dbe3d0',
        0.08,
      );
      // Sloped shoulders, connected chest/waist and a draped hem replace a rigid trapezoid.
      ctx.fillStyle = color;
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-11 * bulk, 5);
      ctx.bezierCurveTo(-12 * bulk, -3, -12 * bulk, -12, -9 * bulk, -17);
      ctx.quadraticCurveTo(0, -22, 9 * bulk, -17);
      ctx.bezierCurveTo(12 * bulk, -12, 12 * bulk, -3, 11 * bulk, 5);
      ctx.quadraticCurveTo(0, 8, -11 * bulk, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      fillPoly(
        [
          [-12 * bulk, 5],
          [-10 * bulk, -18],
          [0, -18],
          [0, 5],
        ],
        '#14211c',
        0.18,
      );
      fillPoly(
        [
          [0, -17],
          [8 * bulk, -17],
          [10 * bulk, 1],
          [0, 1],
        ],
        '#fff2c7',
        0.09,
      );
      oval(0, -28, 8 * bulk, 9, head);
      fillOval(-2.5 * bulk, -31, 3 * bulk, 4, '#fff3dc', 0.22);
      fillOval(3 * bulk, -25, 3 * bulk, 3, '#7c4f43', 0.08);
      line(
        [
          [-9 * bulk, -13],
          [-16 * bulk, -1],
        ],
        color,
        5,
      );
      line(
        [
          [9 * bulk, -13],
          [15 * bulk, -1],
        ],
        color,
        5,
      );
      line(
        [
          [-8 * bulk, -12],
          [-14 * bulk, -2],
        ],
        '#f6e7c7',
        1,
      );
      rect(-9 * bulk, -1, 18 * bulk, 3, '#705c42');
      line(
        [
          [-7 * bulk, 1],
          [7 * bulk, 1],
        ],
        '#b59563',
        1,
      );
    }
    // Orc lineage: broad brow, low ears, heavy muzzle, paired lower tusks,
    // thick neck and articulated limbs. Rank changes kit, never species.
    function specialist(e) {
      const style = {
        thorn: { cloth: '#62856c', cape: '#435b4c', hair: '#765d43', trim: '#d0be78' },
        crypt: { cloth: '#806f60', cape: '#514b45', hair: '#504739', trim: '#bcb2a0' },
        mire: { cloth: '#538486', cape: '#355c62', hair: '#413c36', trim: '#a8ccbb' },
        archive: { cloth: '#6a8393', cape: '#455766', hair: '#746755', trim: '#c9d1b3' },
        ridge: { cloth: '#857d68', cape: '#586358', hair: '#5b5348', trim: '#c5b38a' },
        mine: { cloth: '#787a70', cape: '#4f5550', hair: '#54483e', trim: '#c5ab7a' },
        warlord: { cloth: '#936a63', cape: '#5c4147', hair: '#292d30', trim: '#d6b283' },
        abyss: { cloth: '#69637f', cape: '#47405e', hair: '#5c5862', trim: '#c6a5ba' },
        citadel: { cloth: '#77828d', cape: '#4b5765', hair: '#c7c2ae', trim: '#e2ce91' },
        cindermaw: { cloth: '#957866', cape: '#4c4547', hair: '#ddd0ad', trim: '#e5c381' },
        darklord: { cloth: '#957866', cape: '#4c4547', hair: '#ddd0ad', trim: '#e5c381' },
      }[e.family];
      if (!style) {
        human(e.kind === 'teacher' ? 'mage' : 'worker');
        return;
      }
      const teacher = e.kind === 'teacher',
        chemist = e.kind === 'alchemist';
      poly(
        [
          [-12, -18],
          [-18, 12],
          [0, 8],
          [16, 12],
          [12, -19],
        ],
        style.cape,
      );
      if (e.family === 'darklord') protectedSmithBody(style.cloth, skin, 1);
      else humanoid(style.cloth, skin, 1, false);
      // Joel's named women wear regional kirtles/gowns, with their own work layers.
      // Both captive and rescued scenes share this specialist painter.
      const women = {
        thorn: { inset: '#ddd3b4', hem: 17 }, // Mira: green village kirtle.
        mire: { inset: '#b8d1c5', hem: 19 }, // Sela: hooded teal travelling gown.
        archive: { inset: '#e0d7bd', hem: 18 }, // Neri: blue gown and linen apron.
        mine: { inset: '#b7b4a1', hem: 17 }, // Dara: wool work dress beneath leather.
        warlord: { inset: '#c9a58e', hem: 18 }, // Lyss: red overdress with armored shoulders.
        cindermaw: { inset: '#cdb78d', hem: 19 }, // Vera: warm work gown beneath her smith's apron.
      }[e.family];
      if (women) {
        const hem = women.hem;
        ctx.fillStyle = style.cloth;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-9, -16);
        ctx.quadraticCurveTo(-8, -6, -10, -1);
        ctx.bezierCurveTo(-12, 4, -hem + 2, 8, -hem, 13);
        ctx.quadraticCurveTo(0, 18, hem, 13);
        ctx.bezierCurveTo(hem - 2, 8, 12, 4, 10, -1);
        ctx.quadraticCurveTo(8, -6, 9, -16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        softPoly(
          [
            [-4, -3],
            [-10, 13],
            [0, 15],
            [10, 13],
            [4, -3],
          ],
          women.inset,
          1.8,
        );
        line(
          [
            [-8, -6],
            [8, -6],
          ],
          '#69543e',
          2.4,
        );
        oval(0, -6, 2, 2, style.trim);
        for (const side of [-1, 1]) {
          line(
            [
              [side * 10, -15],
              [side * 15, -4],
            ],
            style.cloth,
            6,
          );
          line(
            [
              [side * 12, -12],
              [side * 15, -6],
            ],
            women.inset,
            1.4,
          );
          line(
            [
              [side * 10, 4],
              [side * 13, 11],
            ],
            style.cape,
            1.2,
          );
        }
        line(
          [
            [-hem + 2, 12],
            [0, 15],
            [hem - 2, 12],
          ],
          style.trim,
          1.1,
        );
        if (e.family === 'archive') {
          softPoly(
            [
              [-6, -14],
              [6, -14],
              [5, -4],
              [10, 10],
              [-10, 10],
              [-5, -4],
            ],
            '#e0d7bd',
            1.4,
          );
          line(
            [
              [-7, -3],
              [7, -3],
            ],
            '#8a8066',
            1.1,
          );
        }
      }
      // Each service has its own headgear and a large, readable hand-held tool.
      switch (e.family) {
        case 'thorn':
          poly(
            [
              [-10, -34],
              [-9, -42],
              [0, -46],
              [10, -41],
              [10, -34],
            ],
            style.hair,
          );
          line(
            [
              [-10, -35],
              [10, -35],
            ],
            style.trim,
            2,
          );
          acceptedStaff(true);
          rect(-17, -10, 11, 17, '#b6a17a');
          break;
        case 'crypt':
          rect(-13, -18, 26, 28, '#5e5146');
          rect(-9, -10, 18, 13, '#826b51');
          line(
            [
              [-12, -17],
              [12, -17],
            ],
            style.trim,
            3,
          );
          line(
            [
              [21, -28],
              [15, 15],
            ],
            '#a38b63',
            4,
          );
          rect(14, -32, 17, 8, steel);
          poly(
            [
              [-10, -40],
              [10, -40],
              [11, -34],
              [-11, -34],
            ],
            style.hair,
          );
          break;
        case 'mire':
          poly(
            [
              [-12, -35],
              [0, -51],
              [12, -35],
            ],
            style.cape,
          );
          line(
            [
              [-10, -33],
              [10, -33],
            ],
            style.trim,
            2,
          );
          line(
            [
              [17, -34],
              [17, 15],
            ],
            '#9c8e70',
            3,
          );
          oval(17, -37, 7, 7, '#79bdc4');
          line(
            [
              [13, -39],
              [21, -39],
            ],
            '#d0e4ca',
          );
          break;
        case 'archive':
          rect(-11, -44, 22, 5, style.hair);
          rect(-15, -39, 30, 4, '#647f83');
          rect(-18, -8, 11, 17, '#9c8060');
          oval(20, -4, 7, 10, '#74afb4');
          rect(15, -15, 10, 4, style.trim);
          line(
            [
              [22, -17],
              [22, -11],
            ],
            steel,
            2,
          );
          break;
        case 'ridge':
          poly(
            [
              [-13, -33],
              [-10, -45],
              [9, -45],
              [14, -33],
            ],
            '#68695f',
          );
          line(
            [
              [-12, -33],
              [13, -33],
            ],
            style.trim,
            3,
          );
          poly(
            [
              [-14, -17],
              [0, -23],
              [14, -17],
            ],
            '#a6aa91',
          );
          marshalSpear(19, 0.9);
          break;
        case 'mine':
          rect(-14, -20, 28, 30, '#5f5a4d');
          rect(-9, -12, 18, 14, '#806d53');
          rect(-12, -42, 24, 8, '#a1a59a');
          line(
            [
              [-11, -41],
              [11, -41],
            ],
            style.trim,
            2,
          );
          smithHammer(22);
          break;
        case 'warlord':
          poly(
            [
              [-12, -41],
              [0, -47],
              [12, -41],
              [10, -31],
              [-10, -31],
            ],
            '#56575a',
          );
          poly(
            [
              [-17, -17],
              [-10, -21],
              [-5, -12],
              [-15, -9],
            ],
            steel,
          );
          poly(
            [
              [6, -15],
              [12, -22],
              [19, -14],
              [14, -9],
            ],
            steel,
          );
          runicStaff(19);
          break;
        case 'abyss':
          poly(
            [
              [-12, -39],
              [0, -49],
              [12, -39],
              [7, -33],
              [-7, -33],
            ],
            style.hair,
          );
          rect(-14, -10, 12, 18, '#765c64');
          runicStaff(18);
          break;
        case 'citadel':
          poly(
            [
              [-12, -42],
              [0, -54],
              [12, -42],
              [9, -32],
              [-9, -32],
            ],
            '#9da8ad',
          );
          line(
            [
              [-12, -37],
              [12, -37],
            ],
            style.trim,
            2,
          );
          line(
            [
              [18, -44],
              [18, 16],
            ],
            '#b7a986',
            4,
          );
          oval(18, -45, 7, 8, '#d4b66c');
          poly(
            [
              [-6, -15],
              [0, -20],
              [6, -15],
              [0, -9],
            ],
            style.trim,
          );
          break;
        case 'cindermaw':
        case 'darklord':
          rect(-16, -18, 32, 28, '#665344');
          rect(-10, -8, 20, 16, '#8c694d');
          line(
            [
              [-13, -17],
              [13, -17],
            ],
            style.trim,
            3,
          );
          poly(
            [
              [-13, -41],
              [-7, -48],
              [10, -46],
              [14, -39],
            ],
            '#e0d2b4',
          );
          smithHammer(22);
          rect(-7, -13, 14, 4, style.trim);
          break;
      }
      if (teacher) {
        line(
          [
            [-5, -16],
            [-5, -3],
          ],
          style.trim,
          1.5,
        );
        line(
          [
            [5, -16],
            [5, -3],
          ],
          style.trim,
          1.5,
        );
      } else if (chemist) {
        oval(-9, -15, 3, 3, '#9bd2cf');
        oval(0, -15, 3, 3, '#c9a6a8');
      } else {
        for (const x of [-5, 0, 5]) oval(x, -13, 1.5, 1.5, style.trim);
      }
      // Personal clothing construction complements the existing profession tools and headgear.
      switch (e.family) {
        case 'thorn':
          poly(
            [
              [-12, -17],
              [-19, -6],
              [-15, 5],
              [-8, 3],
            ],
            '#88a17a',
          );
          line(
            [
              [-15, -9],
              [-8, -6],
            ],
            style.trim,
            2,
          );
          line(
            [
              [-14, 2],
              [-8, 2],
            ],
            '#d7c6a0',
            2,
          );
          break;
        case 'crypt':
          poly(
            [
              [-12, -18],
              [-15, 9],
              [-5, 12],
              [4, 9],
              [6, -17],
            ],
            '#74604d',
          );
          rect(-12, -2, 8, 5, '#a08968');
          line(
            [
              [-9, -15],
              [-6, -3],
            ],
            '#c2ae87',
            1.5,
          );
          break;
        case 'mire':
          poly(
            [
              [-13, -18],
              [-18, -11],
              [-14, 0],
              [-8, -12],
            ],
            '#83a8a0',
          );
          line(
            [
              [-12, -11],
              [4, 2],
            ],
            style.trim,
            2,
          );
          poly(
            [
              [-6, 1],
              [-4, 12],
              [8, 12],
              [5, 1],
            ],
            '#678f89',
          );
          break;
        case 'archive':
          poly(
            [
              [-10, -14],
              [-12, 8],
              [10, 8],
              [8, -14],
            ],
            '#a6b4a5',
          );
          line(
            [
              [-9, -9],
              [9, -9],
            ],
            '#647a7b',
            2,
          );
          for (const [x, c] of [
            [-6, '#8dc6bd'],
            [1, '#b9939b'],
            [7, '#c6bd8e'],
          ]) {
            rect(x - 2, -2, 4, 6, c);
            line(
              [
                [x, -5],
                [x, -2],
              ],
              steel,
              1.5,
            );
          }
          break;
        case 'ridge':
          poly(
            [
              [-14, -17],
              [-20, -8],
              [-8, -7],
              [0, -13],
              [10, -8],
              [16, -14],
            ],
            '#a2a790',
          );
          for (const x of [-12, -5, 3, 10])
            line(
              [
                [x, -13],
                [x + 2, -8],
              ],
              '#c7c7ad',
              1.5,
            );
          break;
        case 'mine':
          poly(
            [
              [-14, -20],
              [-18, -12],
              [-12, -5],
              [-6, -12],
            ],
            '#8d9285',
          );
          rect(-9, -2, 18, 8, '#968367');
          line(
            [
              [-5, -2],
              [-5, 6],
            ],
            '#c5af88',
            1.5,
          );
          line(
            [
              [3, -2],
              [3, 6],
            ],
            '#c5af88',
            1.5,
          );
          break;
        case 'warlord':
          poly(
            [
              [-10, -5],
              [-15, 12],
              [-3, 9],
              [0, -4],
            ],
            '#b28575',
          );
          poly(
            [
              [3, -4],
              [7, 11],
              [15, 13],
              [10, -5],
            ],
            '#765351',
          );
          line(
            [
              [-8, -15],
              [7, -4],
            ],
            style.trim,
            3,
          );
          break;
        case 'abyss':
          poly(
            [
              [-11, -13],
              [-15, 10],
              [2, 12],
              [6, -11],
            ],
            '#726477',
          );
          line(
            [
              [-9, -9],
              [0, 6],
            ],
            style.trim,
            2,
          );
          poly(
            [
              [-8, -3],
              [-3, -8],
              [2, -3],
              [-3, 2],
            ],
            '#c5a4ba',
          );
          line(
            [
              [7, -8],
              [12, 8],
            ],
            '#a192a8',
            2,
          );
          break;
        case 'citadel':
          poly(
            [
              [-9, -14],
              [-12, 12],
              [0, 8],
              [11, 12],
              [8, -14],
            ],
            '#9aa5a9',
          );
          line(
            [
              [-7, -12],
              [-5, 6],
            ],
            style.trim,
            2,
          );
          line(
            [
              [6, -12],
              [7, 6],
            ],
            style.trim,
            2,
          );
          break;
        case 'cindermaw':
        case 'darklord':
          poly(
            [
              [-16, -18],
              [-21, -8],
              [-14, -1],
              [-9, -11],
            ],
            '#ada491',
          );
          poly(
            [
              [10, -17],
              [16, -12],
              [13, 10],
              [5, 12],
              [4, -14],
            ],
            '#765843',
          );
          line(
            [
              [-8, 4],
              [4, 4],
            ],
            '#d2b784',
            2,
          );
          break;
      }
      const mood = {
        thorn: 'warm',
        crypt: 'amused',
        mire: 'gentle',
        archive: 'bright',
        ridge: 'wry',
        mine: 'warm',
        warlord: 'wry',
        abyss: 'gentle',
        citadel: 'warm',
        cindermaw: 'amused',
        darklord: 'amused',
      }[e.family];
      face(
        0,
        -29,
        skin,
        1,
        ['ridge', 'citadel', 'crypt'].includes(e.family),
        mood,
        women ? '#b75c70' : null,
      );
      const hair = {
        thorn: 'curls',
        crypt: 'short',
        mire: 'braid',
        archive: 'bun',
        ridge: 'short',
        mine: 'bob',
        warlord: 'pony',
        abyss: 'short',
        citadel: 'short',
        cindermaw: 'bun',
        darklord: 'curls',
      }[e.family];
      coiffure(hair, style.hair);
      if (['crypt', 'ridge', 'citadel'].includes(e.family))
        beard(e.family === 'ridge' ? 'goatee' : 'full', style.hair);
      if (e.family === 'abyss')
        line(
          [
            [-4, -25],
            [-1, -26],
            [1, -26],
            [5, -25],
          ],
          style.hair,
          1.7,
        );
      if (e.family === 'mine') {
        line(
          [
            [-10, -37],
            [0, -39],
            [9, -37],
          ],
          '#a6b4ae',
          2,
        );
        oval(0, -39, 2, 2, '#e0c68a');
      }
      if (e.family === 'darklord') {
        oval(-5, -30, 3, 3, '#b5aa7c');
        fillOval(-5, -30, 1.6, 1.6, skin);
        line(
          [
            [-8, -30],
            [-10, -34],
          ],
          '#b5aa7c',
          0.8,
        );
        line(
          [
            [-6, -25],
            [-3, -23],
            [0, -25],
            [3, -23],
            [6, -25],
          ],
          '#c6b58e',
          2.5,
        );
      }

      // One consistent face; wrists connect the two actual hands to their tools.
      fillOval(-3, -31, 2, 2, '#eed0ad', 0.16);
      grip(-15, -1, skin);
      const hand = teacher ? { x: 19, y: -8 } : chemist ? { x: 14, y: -6 } : { x: 17, y: -5 };
      line(
        [
          [14, -5],
          [hand.x, hand.y],
        ],
        style.cloth,
        4,
      );
      grip(hand.x, hand.y, skin);
      for (const side of [-1, 1])
        line(
          [
            [side * 12, -7],
            [side * 14, -5],
          ],
          style.trim,
          0.9,
        );
      if (chemist) craftAt(16, -12, 0.55, () => bottle(0, 0, '#9fc6bb'));
      else if (!teacher) {
        line(
          [
            [-8, 0],
            [6, 0],
          ],
          '#bca57e',
          0.8,
        );
        softRect(-5, 1, 10, 6, style.cape, 1.5);
      }
    }

    function bossFinish(family) {
      switch (family) {
        case 'thorn':
          line(
            [
              [-19, -10],
              [-9, -14],
              [-2, -12],
            ],
            '#c0a378',
            2,
          );
          line(
            [
              [14, -22],
              [21, -19],
              [28, -15],
            ],
            '#d2b98b',
            1.5,
          );
          line(
            [
              [18, -9],
              [29, -8],
            ],
            '#594538',
            1.5,
          );
          eye(24, -18, '#f2d680');
          poly(
            [
              [-7, -17],
              [-4, -23],
              [0, -17],
            ],
            '#d2bc80',
          );
          break;
        case 'mire':
          for (const x of [-15, -5, 5])
            poly(
              [
                [x, -7],
                [x + 4, -10],
                [x + 7, -6],
                [x + 3, -3],
              ],
              '#9ba47b',
            );
          line(
            [
              [19, -8],
              [37, -7],
            ],
            '#b0bd89',
            1.5,
          );
          eye(25, -9, '#efcf72');
          line(
            [
              [-24, 5],
              [-36, 5],
            ],
            '#9daa76',
            2,
          );
          break;
        case 'abyss':
          line(
            [
              [-25, -37],
              [-41, -26],
              [-31, -15],
            ],
            '#aa7698',
            1.5,
          );
          line(
            [
              [30, -35],
              [43, -23],
              [32, -14],
            ],
            '#aa7698',
            1.5,
          );
          for (const y of [-19, -10, -1])
            poly(
              [
                [-4, y],
                [0, y - 3],
                [5, y],
                [0, y + 4],
              ],
              '#c29990',
            );
          eye(15, -37, '#efc690');
          line(
            [
              [1, -42],
              [9, -44],
              [16, -40],
            ],
            '#b38aab',
            1.5,
          );
          break;
        case 'crypt':
          for (const y of [-15, -10, -5])
            line(
              [
                [-7, y],
                [0, y + 2],
                [7, y],
              ],
              '#baaa91',
              1.5,
            );
          line(
            [
              [-7, -34],
              [0, -37],
              [7, -34],
            ],
            '#f4e8ca',
            1.5,
          );
          poly(
            [
              [-18, -5],
              [-15, -2],
              [-18, 2],
              [-21, -2],
            ],
            '#d6be85',
          );
          line(
            [
              [21, -31],
              [29, -32],
            ],
            '#f4e8cf',
            1.5,
          );
          break;
        case 'archive':
          line(
            [
              [-8, -25],
              [0, -42],
              [7, -25],
            ],
            '#91b1ac',
            1.5,
          );
          for (const x of [-7, 0, 7])
            line(
              [
                [x, -12],
                [x + 2, -8],
                [x, -4],
              ],
              '#b4d2c5',
              1,
            );
          line(
            [
              [-9, 3],
              [9, 3],
            ],
            '#a0b7a7',
            2,
          );
          oval(23, -29, 2, 2, '#e9d8a1');
          break;
        case 'ridge':
          rect(-6, -29, 3, 2, '#403e32');
          rect(4, -29, 3, 2, '#403e32');
          poly(
            [
              [-5, -23],
              [-4, -18],
              [-1, -23],
            ],
            bone,
          );
          poly(
            [
              [5, -23],
              [4, -18],
              [1, -23],
            ],
            bone,
          );
          poly(
            [
              [-20, -17],
              [-14, -24],
              [-7, -17],
              [-10, -10],
            ],
            '#b5aca0',
          );
          poly(
            [
              [10, -20],
              [18, -24],
              [22, -15],
              [13, -12],
            ],
            '#746758',
          );
          line(
            [
              [-9, -12],
              [10, -12],
            ],
            '#beb39b',
            2,
          );
          for (const x of [21, 29, 36]) oval(x, -29, 1.5, 1.5, '#d1c7a7');
          line(
            [
              [20, -34],
              [38, -34],
            ],
            '#bcc4b5',
            1.5,
          );
          break;
        case 'mine':
          poly(
            [
              [-18, -28],
              [-12, -33],
              [-3, -30],
              [-8, -21],
            ],
            '#bbc7b0',
          );
          poly(
            [
              [8, -30],
              [15, -32],
              [21, -21],
              [12, -24],
            ],
            '#6a7e77',
          );
          line(
            [
              [-7, -18],
              [0, -24],
              [7, -18],
            ],
            '#ffe0a0',
            1.5,
          );
          line(
            [
              [25, -16],
              [29, -8],
              [26, 0],
            ],
            '#a8bba3',
            2,
          );
          line(
            [
              [-8, -48],
              [7, -48],
            ],
            '#d2dbc3',
            2,
          );
          break;
        case 'warlord':
          // Complete Warlord kit is drawn with the shared Orc anatomy.
          break;
        case 'cindermaw':
          for (const [x, y] of [
            [-18, -12],
            [-7, -18],
            [6, -16],
            [18, -10],
          ])
            glint(x, y, '#efb071', 1.8);
          for (const side of [-1, 1])
            poly(
              [
                [side * 18, -15],
                [side * 27, -28],
                [side * 34, -18],
                [side * 24, -8],
              ],
              '#6d5360',
            );
          line(
            [
              [-14, 6],
              [0, 11],
              [14, 6],
            ],
            '#d19469',
            2,
          );
          break;
        case 'citadel':
          line(
            [
              [-8, -47],
              [-8, -42],
            ],
            '#d2ded7',
            2,
          );
          line(
            [
              [9, -47],
              [9, -42],
            ],
            '#d2ded7',
            2,
          );
          poly(
            [
              [-18, -19],
              [-11, -24],
              [-6, -17],
              [-13, -13],
            ],
            '#b3c5c2',
          );
          poly(
            [
              [9, -22],
              [18, -18],
              [14, -11],
              [7, -15],
            ],
            '#9eb4b5',
          );
          line(
            [
              [-24, -5],
              [-24, 7],
            ],
            '#d4b97b',
            2,
          );
          oval(0, -16, 2.5, 3, '#ffe0a2');
          line(
            [
              [24, -35],
              [34, -37],
            ],
            '#e1e6d2',
            2,
          );
          break;
        case 'darklord':
          poly(
            [
              [-12, -20],
              [-20, -25],
              [-21, -17],
              [-13, -11],
            ],
            '#8990a3',
          );
          poly(
            [
              [11, -20],
              [19, -25],
              [21, -16],
              [12, -11],
            ],
            '#788297',
          );
          line(
            [
              [-6, -39],
              [0, -44],
              [6, -39],
            ],
            '#b9bdc2',
            1.5,
          );
          poly(
            [
              [0, -19],
              [5, -12],
              [0, -6],
              [-5, -12],
            ],
            '#b48fbc',
          );
          poly(
            [
              [0, -16],
              [2, -12],
              [0, -9],
              [-2, -12],
            ],
            '#e3b9df',
          );
          line(
            [
              [-14, 8],
              [-9, -6],
            ],
            '#6c5b83',
            2,
          );
          line(
            [
              [10, 7],
              [13, -4],
            ],
            '#6c5b83',
            2,
          );
          eye(-5, -32, '#f0bcad');
          eye(3, -32, '#f0bcad');
          line(
            [
              [24, -38],
              [24, -20],
            ],
            '#d4d8e0',
            1.5,
          );
          break;
      }
    }
    function craftedRoof(w = 35, y = -20, top = -48, r = region) {
      const colors = ['#a76f50', '#718d78', '#7b8580', '#887365', '#626d80'];
      ctx.save();
      ctx.fillStyle = colors[r];
      ctx.strokeStyle = ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      if (r === 1 || r === 3) {
        ctx.quadraticCurveTo(-w * 0.6, top + 1, 0, top);
        ctx.quadraticCurveTo(w * 0.6, top + 1, w, y);
        ctx.quadraticCurveTo(w * 0.5, y + 5, 0, y + 2);
        ctx.quadraticCurveTo(-w * 0.5, y + 5, -w, y);
      } else {
        ctx.lineTo(0, top);
        ctx.lineTo(w, y);
        ctx.lineTo(w, y + 4);
        ctx.lineTo(-w, y + 4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.clip();
      for (let z = top + 7, i = 0; z <= y; z += r === 1 ? 4 : 7, i++) {
        line(
          [
            [-w, z],
            [w, z],
          ],
          r === 1 ? '#a7b08a' : r === 4 ? '#9195a2' : '#b5a285',
          0.8,
        );
        if (r !== 1)
          for (let x = -w + (i % 2 ? 6 : 0); x < w; x += 13)
            line(
              [
                [x, z - 6],
                [x + 1, z],
              ],
              r === 2 ? '#54675e' : '#655e51',
              0.65,
            );
      }
      if (r === 3) {
        // Replaced roof tiles show ongoing repair without boarding the roof.
        for (const [x, z] of [
          [-16, top + 14],
          [-3, top + 14],
          [-10, top + 21],
        ]) {
          softRect(x, z, 11, 5, '#a38c73', 0.7);
          line(
            [
              [x, z + 5],
              [x + 11, z + 5],
            ],
            '#62584e',
            0.65,
          );
        }
      }
      ctx.restore();
      line(
        [
          [-w, y + 3],
          [w, y + 3],
        ],
        r === 4 ? '#9c9b9e' : '#62583f',
        2,
      );
    }
    function recessedDoor(x, y, w = 17, h = 27, open = false, r = region) {
      softRect(x - w / 2 - 3, y - 3, w + 6, h + 4, r === 4 ? '#696576' : '#756b52', 1.7);
      softRect(x - w / 2, y, w, h, '#283d33', 1);
      if (!open) {
        boards(x - w / 2 + 2, y + 2, w - 4, h - 4, r === 4 ? '#596575' : '#8c7653');
        for (const z of [7, h - 8]) {
          line(
            [
              [x - w / 2 + 2, y + z],
              [x + w / 2 - 2, y + z],
            ],
            '#54685d',
            1.8,
          );
        }
        oval(x + w / 2 - 4, y + h / 2, 1.1, 1.1, '#d2bc7e');
      }
      poly(
        [
          [x - w / 2 - 5, y + h],
          [x + w / 2 + 4, y + h],
          [x + w / 2 + 7, y + h + 4],
          [x - w / 2 - 6, y + h + 4],
        ],
        '#a6a28a',
      );
    }
    function craftedHouse(kind = 'house') {
      const r = kind.startsWith('vale')
        ? 0
        : kind.startsWith('march')
          ? 1
          : kind.startsWith('highland')
            ? 2
            : kind.startsWith('frontier')
              ? 3
              : kind.startsWith('crown')
                ? 4
                : region;
      const workshop = /workshop|smithy|forgehouse/.test(kind),
        boat = kind === 'march-boathouse';
      const woods = ['#876849', '#7b7659', '#78725d', '#78604e', '#5d5e6b'];
      if (r === 1) {
        for (const x of [-25, -8, 9, 25]) {
          timber([x, 10], [x, 27], 5, woods[r]);
          fillOval(x, 24, 3, 4, '#426b5c', 0.25);
        }
        timber([-25, 12], [-8, 25], 3, woods[r]);
        timber([25, 12], [9, 25], 3, woods[r]);
      }
      if (r >= 2) {
        blockwork(-29, -21, 58, 36, r === 2 ? '#92988b' : r === 3 ? '#8c7d68' : '#737383', 8);
      } else {
        boards(-29, -21, 58, 36, r === 0 ? '#c2b18c' : '#a5aa8d', r === 1);
        for (const x of [-27, 0, 27]) timber([x, -21], [x, 14], 4, woods[r]);
      }
      poly(
        [
          [29, -20],
          [38, -13],
          [38, 9],
          [29, 15],
        ],
        r === 4 ? '#4d5262' : '#6d705c',
      );
      if (workshop || boat) {
        softRect(-22, -15, 44, 29, '#34463b', 1);
        timber([-24, -16], [24, -16], 5, woods[r]);
        if (boat) {
          shaped('#9e8860', () => {
            ctx.moveTo(-19, 4);
            ctx.quadraticCurveTo(0, 19, 21, 2);
            ctx.lineTo(17, -1);
            ctx.quadraticCurveTo(0, 7, -16, 0);
          });
          line(
            [
              [-17, 1],
              [0, 5],
              [18, 0],
            ],
            '#d0b681',
            1.2,
          );
          timber([0, -6], [0, 6], 2.3);
        } else {
          craftAt(-9, 7, 0.5, () => table(40));
          craftAt(16, 8, 0.55, () => rack(true));
          if (/smithy|forgehouse/.test(kind)) craftAt(-15, 6, 0.45, () => hearth(true, r === 4));
        }
      } else {
        recessedDoor(-7, -11, 18, 26, false, r);
        softRect(12, -14, 11, 13, '#5f7f75', 1);
        line(
          [
            [17.5, -13],
            [17.5, -2],
          ],
          '#c2c1a0',
          1,
        );
        line(
          [
            [13, -8],
            [22, -8],
          ],
          '#c2c1a0',
          1,
        );
      }
      if (r === 3) {
        // Occupied postwar homes: clear doorways and windows, repaired masonry.
        softRect(-25, 4, 12, 6, '#ad9b82', 1);
        line(
          [
            [-24, 7],
            [-14, 7],
          ],
          '#88745e',
          0.7,
        );
        line(
          [
            [-19, 4],
            [-19, 7],
          ],
          '#88745e',
          0.7,
        );
        if (!workshop) {
          softRect(11, -1, 14, 2, '#b7a081', 0.6);
          craftAt(18, 4, 0.22, () => rimBowl(0, 0, 8, '#8c674c', '#c39a70'));
        }
      }
      if (r === 4) {
        for (const x of [-26, 26]) {
          softRect(x - 3, -22, 6, 36, '#9095a1', 1);
          line(
            [
              [x, -19],
              [x, 10],
            ],
            '#bab7b0',
            0.8,
          );
        }
        poly(
          [
            [0, -23],
            [4, -18],
            [0, -13],
            [-4, -18],
          ],
          '#b49ab6',
        );
      }
      craftedRoof(36, -21, -51, r);
      if (r === 4)
        poly(
          [
            [0, -40],
            [5, -34],
            [0, -28],
            [-5, -34],
          ],
          '#b49ab6',
        );
      if (!boat) {
        blockwork(20, -43, 9, 23, r === 4 ? '#707782' : '#949987', 6);
        fillOval(24, -44, 5, 2, '#354c41', 0.4);
      }
      if (r === 1) {
        timber([-26, 15], [28, 15], 4, woods[r]);
        for (const y of [20, 24]) timber([-13, y], [3, y], 2, woods[r]);
      }
      if (workshop) {
        timber([32, -13], [46, -13], 2.5, woods[r]);
        boards(38, -13, 11, 11, '#a58c64');
        line(
          [
            [40, -9],
            [46, -7],
          ],
          '#535f50',
          2,
        );
      }
    }
    function craftedFence(palisade = false) {
      for (const [x, h] of [
        [-26, 28],
        [-12, 31],
        [2, 27],
        [16, 32],
        [29, 29],
      ]) {
        if (palisade)
          poly(
            [
              [x - 3, 14],
              [x - 3, 14 - h],
              [x, 8 - h],
              [x + 4, 13 - h],
              [x + 4, 14],
            ],
            '#887255',
          );
        else timber([x, 14], [x, 14 - h], 4, '#8d7754');
        line(
          [
            [x + 1, 12 - h],
            [x + 1, 11],
          ],
          '#b69e71',
          0.7,
        );
      }
      for (const y of [-10, 4]) {
        timber([-30, y], [32, y], 4, '#a48a60');
        for (const x of [-26, 2, 29]) {
          if (palisade)
            line(
              [
                [x - 3, y - 4],
                [x + 3, y + 4],
              ],
              '#c3b28a',
              1.5,
            );
          else softRect(x - 2, y - 1, 4, 3, '#65573f', 0.4);
        }
      }
    }
    function craftedSettlement(kind) {
      if (kind === 'vale-fence') {
        craftedFence();
        return true;
      }
      if (kind === 'frontier-palisade') {
        craftedFence(true);
        return true;
      }
      if (kind === 'march-boardwalk') {
        boards(-33, 1, 66, 13, '#8a8667', true);
        for (const x of [-27, 0, 27]) {
          timber([x, 13], [x, 21], 5, '#6c7054');
          timber([x, 7], [x, -7], 3, '#a59c74');
        }
        line(
          [
            [-29, -3],
            [29, -3],
          ],
          '#a6ad8b',
          2,
        );
        return true;
      }
      if (kind === 'highland-wall' || kind === 'crown-wall') {
        blockwork(-32, -10, 64, 26, kind === 'crown-wall' ? '#696674' : '#94988a', 8);
        poly(
          [
            [-35, -12],
            [30, -12],
            [36, -7],
            [-34, -7],
          ],
          kind === 'crown-wall' ? '#92919c' : '#babba2',
        );
        if (kind === 'crown-wall')
          for (const x of [-27, 27])
            poly(
              [
                [x - 4, -12],
                [x, -23],
                [x + 4, -12],
              ],
              '#8b8098',
            );
        return true;
      }
      if (
        [
          'vale-cottage',
          'vale-workshop',
          'march-stilt-house',
          'march-boathouse',
          'highland-stone-house',
          'highland-smithy',
          'frontier-patched-house',
          'frontier-workshop',
          'crown-ash-house',
          'crown-forgehouse',
        ].includes(kind)
      ) {
        craftedHouse(kind);
        return true;
      }
      return false;
    }
    function regionalServiceFooting(w = 34) {
      if (region === 1) {
        boards(-w, 9, w * 2, 7, '#8e8a6b', true);
        for (const x of [-w + 7, w - 7]) {
          timber([x, 13], [x, 25], 4, '#707357');
          timber([x, 14], [x - Math.sign(x) * 12, 24], 2.5, '#7f8969');
        }
      } else if (region === 2 || region === 4)
        blockwork(-w, 8, w * 2, 8, region === 4 ? '#656774' : '#8b9183', 8);
      else {
        timber([-w, 12], [w, 12], 4, region === 3 ? '#78614e' : '#8d754d');
        if (region === 3)
          line(
            [
              [-w + 3, 14],
              [w - 4, 14],
            ],
            '#b3a078',
            1.2,
          );
      }
    }
    function craftedService(kind) {
      if (!['quests', 'supplier', 'recruiter', 'rest', 'barracks'].includes(kind)) return false;
      if (kind === 'barracks') {
        const ground = ['#68764c', '#667b70', '#777a68', '#78634c', '#5e5968'][region];
        if (!Number.isFinite(e.progress) || e.progress >= 4) {
          fillOval(0, 10, 45, 12, ground, 0.28);
        }
        const stage = barracksVisualState(e),
          full = stage === 'full';
        if (stage === 'construction') {
          regionalServiceFooting(28);
          if (e.progress < 1) {
            craftAt(-2, 4, 0.65, () => craftedDecoration('stacked-lumber'));
            sack(19, 8, 0.65);
            for (const x of [-25, 25]) timber([x, 13], [x, -5], 3);
          } else {
            for (const x of [-23, 0, 23]) timber([x, 13], [x, -33], 5);
            timber([-25, -33], [25, -33], 5);
            for (const side of [-1, 1]) timber([side * 23, 6], [0, -31], 3);
            if (e.progress >= 2) {
              shaped(['#ad9872', '#859b80', '#95998b', '#9e8d73', '#776b86'][region], () => {
                ctx.moveTo(0, -35);
                ctx.quadraticCurveTo(-15, -16, -27, 9);
                ctx.quadraticCurveTo(-18, 12, -7, 8);
                ctx.lineTo(0, -35);
              });
              line(
                [
                  [0, -33],
                  [-23, 7],
                ],
                '#c8b990',
                1.2,
              );
            }
            if (e.progress >= 3) {
              shaped(['#bfaa80', '#9cb092', '#adb0a0', '#b29f83', '#9586a2'][region], () => {
                ctx.moveTo(0, -35);
                ctx.quadraticCurveTo(13, -18, 27, 9);
                ctx.lineTo(9, 10);
                ctx.quadraticCurveTo(5, -13, 0, -35);
              });
              line(
                [
                  [1, -32],
                  [23, 8],
                ],
                '#d9c9a1',
                1.2,
              );
            }
            for (const x of [-23, 23])
              line(
                [
                  [x - 3, -30],
                  [x + 3, -27],
                ],
                '#c6b88b',
                1.5,
              );
          }
        } else {
          regionalServiceFooting(full ? 62 : 51);
          // Preserve Basic/Full layouts and their existing footprint; the same
          // tent, bedding and supplies are tailored to each regional material.
          craftAt(full ? -32 : -20, 1, 0.8, () => tent(region === 4));
          if (full) craftAt(32, 0, 0.65, () => tent(region === 4));
          craftAt(-23, 10, 0.44, () => craftedDecoration('sleep-roll'));
          craftAt(22, 11, 0.4, () => craftedDecoration('cookfire'));
          crateBody(full ? 52 : 40, 6, 0.48);
          fillOval(full ? 57 : 40, -3.4, 4, 1, '#493f2f', 0.22);
          sack(full ? 57 : 40, -6.8, 0.45);
          craftAt(-43, -11, 0.55, () => flag(region === 4));
          if (full) {
            craftAt(0, 12, 0.56, () => ledgerDesk(true));
            craftAt(-48, 10, 0.4, () => bed());
            craftAt(12, 16, 0.6, () => stool(0, 0));
            craftAt(-59, -1, 0.45, () => lantern());
          }
          if (region === 1)
            for (const x of [-36, 35])
              line(
                [
                  [x, 16],
                  [x + 4, 21],
                ],
                '#536e5d',
                1,
              );
          if (region === 3) {
            softRect(-28, -19, 8, 6, '#baa884', 1);
            line(
              [
                [-27, -18],
                [-22, -15],
              ],
              '#716552',
              0.8,
            );
          }
          if (region === 4) {
            // Sew the regional badge onto tent cloth after removing the desk canopy.
            craftAt(full ? 32 : -20, -15, 0.65, () => {
              poly(
                [
                  [0, -5],
                  [4, 0],
                  [0, 5],
                  [-4, 0],
                ],
                '#b69fb5',
              );
              line(
                [
                  [-3, 0],
                  [0, 4],
                  [3, 0],
                ],
                '#d3bed0',
                0.7,
              );
            });
          }
        }
        return true;
      }
      if (kind === 'rest') {
        craftedHouse(
          [
            'vale-cottage',
            'march-stilt-house',
            'highland-stone-house',
            'frontier-patched-house',
            'crown-ash-house',
          ][region],
        );
        craftAt(-27, -1, 0.5, () => lantern());
        return true;
      }
      regionalServiceFooting();
      for (const x of [-28, 28]) {
        if (region === 2 || region === 4)
          blockwork(x - 3, -31, 6, 43, region === 4 ? '#727484' : '#919989', 9);
        else timber([x, 12], [x, -31], 4, '#806d4c');
      }
      if (kind === 'quests') {
        if (region === 2 || region === 4)
          blockwork(-23, -30, 46, 32, region === 4 ? '#666476' : '#929a88', 8);
        else boards(-23, -30, 46, 32, '#8c7755');
        paper(-19, -26, 18);
        paper(3, -23, 16);
        for (const x of [-16, 7]) oval(x, -25, 1, 1, '#605e48');
        oval(11, -10, 2.5, 2.5, '#a66f62');
        timber([-26, 5], [27, 5], 5);
      } else {
        if (region === 2 || region === 4)
          blockwork(-27, -10, 54, 22, region === 4 ? '#727080' : '#929b88', 8);
        else boards(-27, -10, 54, 22, '#a38a60', true);
        timber([-28, -11], [28, -11], 4);
        if (kind === 'supplier') {
          poly(
            [
              [-27, -16],
              [27, -16],
              [29, -10],
              [-29, -10],
            ],
            '#b49b70',
          );
          restingObject(-15, -12, 7, () => rimBowl(0, -10, 8, '#a3946f', '#bbad79'));
          restingObject(5, -12, 6, () => sack(0, -5, 0.65));
          restingObject(20, -12, 3, () => bottle(0, -3.6, '#96afa0', 0.6));
          boards(-22, -26, 44, 4, '#8f7a55');
          for (const x of [-14, 0, 14]) bottle(x, -28.4, '#94a98c', 0.4);
        } else {
          craftAt(-17, -12, 0.43, () => rack());
          shield(9, -19, region === 4 ? '#78647a' : '#8b8d69');
          line(
            [
              [18, -27],
              [18, -6],
            ],
            '#bdab7d',
            2,
          );
          paper(10, -9, 14);
        }
      }
      craftedRoof(34, -31, -48, region);
      if (region === 4)
        poly(
          [
            [0, -43],
            [4, -38],
            [0, -33],
            [-4, -38],
          ],
          '#b69bbb',
        );
      return true;
    }
    function carvedGateway(family) {
      const side = R.sideDungeons?.find((d) => d.id === family),
        theme = side?.theme;
      const crypt = family === 'crypt',
        archive = family === 'archive',
        mine = family === 'mine',
        military = family === 'abyss' || family === 'citadel';
      if (!side && !crypt && !archive && !mine && !military) return false;
      if (family === 'abyss') {
        for (const side of [-1, 1]) {
          shaped('#5b4a50', () => {
            ctx.moveTo(side * 28, 14);
            ctx.lineTo(side * 42, 14);
            ctx.lineTo(side * 40, -47);
            ctx.lineTo(side * 34, -73);
            ctx.lineTo(side * 28, -43);
          });
          for (const y of [-35, -21, -7, 7])
            line(
              [
                [side * 30, y],
                [side * 40, y],
              ],
              '#947b7b',
              0.8,
            );
          line(
            [
              [side * 33, -48],
              [side * 33, -22],
            ],
            '#bc917a',
            1.1,
          );
        }
        softRect(-25, -32, 50, 46, '#263c33', 1);
        poly(
          [
            [-29, -35],
            [-20, -49],
            [-9, -44],
            [0, -53],
            [10, -44],
            [21, -49],
            [29, -35],
            [23, -29],
            [-23, -29],
          ],
          '#93716c',
        );
        line(
          [
            [-24, -35],
            [-16, -42],
            [0, -38],
            [16, -42],
            [24, -35],
          ],
          '#c5a088',
          1.2,
        );
        for (const x of [-17, -8, 0, 8, 17]) {
          line(
            [
              [x, -28],
              [x, 13],
            ],
            '#9aaba1',
            2,
          );
          softPoly(
            [
              [x - 3, -26],
              [x, -31],
              [x + 3, -26],
              [x, -23],
            ],
            '#738a80',
            0.6,
          );
        }
        for (const y of [14, 18])
          poly(
            [
              [-29, y],
              [29, y],
              [32, y + 3],
              [-32, y + 3],
            ],
            '#9b9984',
          );
        oval(0, -44, 3, 4, '#bfa172');
        return true;
      }
      const dark = military || theme === 'foundry',
        stone = dark ? '#6a6878' : archive ? '#85968a' : '#939b86';
      if (mine || theme === 'cellar') {
        shaped('#7f8976', () => {
          ctx.moveTo(-36, 14);
          ctx.lineTo(-33, -12);
          ctx.quadraticCurveTo(-28, -36, -5, -38);
          ctx.quadraticCurveTo(20, -43, 34, -17);
          ctx.lineTo(38, 14);
        });
        shaped('#293e33', () => {
          ctx.moveTo(-23, 14);
          ctx.lineTo(-24, -10);
          ctx.quadraticCurveTo(-21, -29, 0, -28);
          ctx.quadraticCurveTo(22, -31, 25, -10);
          ctx.lineTo(25, 14);
        });
        if (mine) {
          for (const x of [-24, 24]) timber([x, 15], [x, -24], 7);
          timber([-29, -25], [29, -25], 8);
          for (const side of [-1, 1]) timber([side * 24, -12], [side * 13, -24], 4);
          craftAt(0, 13, 0.65, () => {
            ctx.transform(0.85, 0.25, -0.85, 0.25, 0, 0);
            craftedDecoration('rail');
          });
        } else {
          recessedDoor(0, -18, 31, 31, false);
          for (const x of [-29, 29]) rockPiece(x, 10, 10, 20);
        }
      } else if (theme === 'flooded') {
        craftAt(0, -2, 1, () => craftedHouse('march-stilt-house'));
        line(
          [
            [-23, -28],
            [-8, -35],
            [3, -28],
          ],
          '#515f4e',
          2,
        );
        fillOval(0, 19, 32, 5, '#5d8879', 0.25);
        recessedDoor(-7, -13, 18, 26, true, 1);
        poly(
          [
            [5, -40],
            [14, -45],
            [19, -29],
            [10, -32],
          ],
          '#465f50',
        );
        timber([7, -40], [18, -29], 2, '#a7a17c');
        line(
          [
            [-22, -2],
            [-17, 5],
          ],
          '#546e5b',
          1.8,
        );
      } else {
        const w = military ? 43 : 34,
          top = military ? -46 : -35;
        blockwork(-w, top, 2 * w, 50 - (military ? 0 : 10), stone, 8);
        if (archive) {
          for (const x of [-29, 29]) {
            blockwork(x - 5, -40, 10, 53, '#9aab9b', 10);
            softRect(x - 7, -43, 14, 5, '#b9c2a9', 1);
          }
          blockwork(-37, -43, 74, 8, '#a4b4a1', 8);
        }
        recessedDoor(0, -24, military ? 40 : 34, 38, true, dark ? 4 : 0);
        if (crypt) {
          shaped(stone, () => {
            ctx.moveTo(-25, -23);
            ctx.quadraticCurveTo(-27, -52, 0, -52);
            ctx.quadraticCurveTo(28, -51, 26, -23);
            ctx.lineTo(18, -23);
            ctx.quadraticCurveTo(18, -40, 0, -41);
            ctx.quadraticCurveTo(-18, -40, -18, -23);
          });
          for (const x of [-19, -10, 0, 10, 19])
            line(
              [
                [x, -44 + Math.abs(x) * 0.25],
                [x * 0.8, -34 + Math.abs(x) * 0.25],
              ],
              '#687e6c',
              0.9,
            );
          skull(0, -39, 5);
          foliage(-27, 11, 8, 6, '#738866');
        }
        if (family === 'citadel')
          poly(
            [
              [-38, -45],
              [0, -65],
              [38, -45],
            ],
            '#79788a',
          );
        if (military) {
          for (const side of [-1, 1]) {
            blockwork(side * w - 7, -52, 14, 66, stone, 9);
            poly(
              [
                [side * w - 10, -52],
                [side * w, -70],
                [side * w + 10, -52],
              ],
              '#8d819a',
            );
          }
          for (const x of [-14, -7, 0, 7, 14])
            line(
              [
                [x, -22],
                [x, 12],
              ],
              '#899990',
              2,
            );
          poly(
            [
              [0, -45],
              [6, -37],
              [0, -29],
              [-6, -37],
            ],
            '#ad94b6',
          );
        }
        if (theme === 'keep') {
          for (const x of [-27, -6, 18]) blockwork(x, -43, 10, 10, '#9a9e88', 7);
          timber([-28, -10], [-15, 12], 4);
          craftAt(21, -30, 0.45, () => flag());
          rockPiece(-25, 13, 10, 10);
          line(
            [
              [14, -31],
              [19, -20],
              [13, -9],
            ],
            '#526c5e',
            1.5,
          );
        }
        if (theme === 'shrine') {
          poly(
            [
              [-38, -35],
              [-10, -50],
              [3, -43],
              [12, -49],
              [36, -35],
            ],
            '#9c9382',
          );
          line(
            [
              [-15, -31],
              [-7, -25],
              [-12, -19],
            ],
            '#6b6557',
            1.3,
          );
          poly(
            [
              [0, -36],
              [5, -30],
              [0, -24],
              [-5, -30],
            ],
            '#bc9d79',
          );
        }
        if (theme === 'shrine') craftAt(27, -9, 0.55, () => flag());
        if (theme === 'foundry') {
          blockwork(22, -58, 10, 32, '#737c77', 7);
          fillOval(26, -58, 6, 2, '#2b4136', 0.4);
          timber([-32, -31], [32, -31], 6, '#777263');
          craftedRoof(36, -33, -43, 3);
        }
        if (archive) fillOval(0, 11, 34, 4, '#638c79', 0.22);
      }
      if (!mine)
        for (const y of [14, 18])
          poly(
            [
              [-25, y],
              [25, y],
              [28, y + 3],
              [-28, y + 3],
            ],
            '#a2a38a',
          );
      return true;
    }
    function craftedResidence(boss) {
      if (boss === 'crown') return false; // The unconfirmed fallback remains protected.
      if (boss === 'cindermaw') {
        craftedDecoration('cindermaw-ash-den');
        rockPiece(-30, 7, 12, 22, true);
        rockPiece(29, 9, 12, 18, true);
        return true;
      }
      const key =
        boss === 'thorn'
          ? 'vale-cottage'
          : boss === 'mire'
            ? 'march-stilt-house'
            : boss === 'ridge'
              ? 'highland-stone-house'
              : null;
      if (!key) return false;
      craftedHouse(key);
      // A broad recessed Treasury threshold fits the creature's body.
      recessedDoor(0, -15, 34, 30, true, boss === 'ridge' ? 2 : boss === 'mire' ? 1 : 0);
      if (boss === 'thorn') {
        for (const x of [-18, -7, 6, 18]) foliage(x, -27, 6, 7, '#6d8656');
      }
      if (boss === 'ridge') {
        for (const side of [-1, 1])
          shaped(bone, () => {
            ctx.moveTo(side * 17, -30);
            ctx.quadraticCurveTo(side * 26, -33, side * 24, -44);
            ctx.quadraticCurveTo(side * 33, -29, side * 20, -26);
          });
      }
      if (boss === 'thorn')
        for (const x of [-4, 4])
          shaped(
            bone,
            () => {
              ctx.moveTo(x - 2, -37);
              ctx.quadraticCurveTo(x + 3, -38, x, -29);
              ctx.quadraticCurveTo(x - 1, -33, x - 2, -37);
            },
            0.6,
          );
      if (boss === 'mire')
        for (const x of [-12, 0, 12])
          softPoly(
            [
              [x - 4, -32],
              [x, -41],
              [x + 5, -32],
            ],
            '#8d9e79',
            1.2,
          );
      return true;
    }
    function craftedLandmark() {
      switch (e.id) {
        case 'orchard':
          for (const [x, sc] of [
            [-22, 0.65],
            [1, 0.8],
            [24, 0.62],
          ])
            craftAt(x, 4, sc, () => tree('fruit'));
          timber([-34, 14], [34, 14], 2);
          break;
        case 'den-ruins':
          blockwork(-27, -19, 16, 34, '#8d9482');
          blockwork(12, -29, 16, 44, '#7e8a7d');
          timber([-23, -18], [-7, -27], 4);
          timber([10, -26], [25, -17], 4);
          rockPiece(-1, 11, 12, 7);
          break;
        case 'mill-pond':
          // The water is painted and collided by terrain, once. This is the
          // dry loading/inspection bank beside the actual mill building.
          timber([-21, 9], [24, 9], 4);
          for (const x of [-17, 0, 19]) timber([x, 9], [x - 3, 20], 3);
          craftAt(-20, 0, 0.4, () => grassTuft(0, 4, true));
          break;
        case 'night-site':
          pool();
          craftAt(18, -2, 0.6, () => lantern());
          break;
        case 'cache':
          chest(true, 0.9);
          timber([22, 10], [31, -15], 3);
          softPoly(
            [
              [25, -15],
              [33, -13],
              [34, -8],
              [29, -6],
            ],
            '#8d9d91',
            1,
          );
          break;
        case 'wagon':
        case 'convoy':
          cartBody(e.id === 'convoy');
          shaped('#c5b58e', () => {
            ctx.moveTo(-28, -15);
            ctx.bezierCurveTo(-31, -39, 26, -44, 29, -15);
            ctx.lineTo(23, -11);
            ctx.quadraticCurveTo(0, -8, -26, -12);
          });
          for (const x of [-18, 0, 18])
            line(
              [
                [x, -31],
                [x + 3, -14],
              ],
              '#968765',
              1.4,
            );
          if (e.id === 'convoy') {
            sack(23, -15, 0.6);
            paper(25, -13, 8);
            timber([28, -5], [48, 4], 4);
          }
          break;
        case 'watch':
          craftedDecoration('watchpost');
          break;
        case 'dock':
          pool();
          boards(-28, 0, 56, 10, '#8b8a69', true);
          for (const x of [-26, 25]) craftAt(x, 0, 0.6, () => craftedDecoration('dock-post'));
          line(
            [
              [-24, -2],
              [25, -2],
            ],
            '#b9b696',
            1.3,
          );
          break;
        case 'lookout':
          rockPiece(0, 10, 33, 21);
          craftAt(1, -4, 0.8, () => flag());
          break;
        case 'ore':
          craftAt(-12, 7, 0.7, () => craftedDecoration('silver-ore-face'));
          craftAt(17, 10, 0.6, () => craftedDecoration('copper-ore-face'));
          break;
        case 'tower':
          blockwork(-23, -42, 46, 57, '#8e9789', 9);
          for (const x of [-26, -7, 14]) blockwork(x, -49, 12, 12, '#a2aa96', 6);
          recessedDoor(0, -26, 13, 19, true);
          blockwork(-27, 12, 54, 7, '#a6ad97', 7);
          break;
        case 'shrine':
          blockwork(-26, -24, 52, 39, '#969e89', 8);
          recessedDoor(0, -20, 22, 32, true);
          craftedRoof(32, -25, -44, 2);
          poly(
            [
              [0, -18],
              [6, -10],
              [0, -3],
              [-6, -10],
            ],
            '#b9aa7e',
          );
          softRect(-8, -20, 16, 26, '#75836c', 1);
          line(
            [
              [-4, -18],
              [5, -12],
              [-3, -4],
            ],
            '#3e594e',
            3,
          );
          line(
            [
              [-4, -18],
              [5, -12],
              [-3, -4],
            ],
            '#c8ae88',
            1.1,
          );
          break;
        case 'overlook':
          rockPiece(-14, 8, 22, 18);
          rockPiece(18, 10, 20, 15);
          for (const x of [-25, 25]) timber([x, 10], [x, -9], 4);
          timber([-28, -6], [28, -6], 4);
          break;
        case 'checkpoint':
          craftedDecoration('crown-fortress-checkpoint');
          break;
        case 'foundry':
          craftAt(-12, 2, 0.8, () => hearth(true));
          blockwork(22, -45, 12, 56, '#7c877c', 8);
          fillOval(27, -44, 7, 3, '#354b3d', 0.4);
          craftAt(25, 7, 0.45, () => table(30));
          break;
        case 'shelf':
          rockPiece(0, 11, 33, 19, true);
          craftAt(0, 0, 0.85, () => craftedDecoration('crystal-cluster'));
          break;
        case 'siege':
          craftAt(-8, 0, 0.8, () => tent(true));
          crateBody(24, 9, 0.6);
          craftAt(-29, -12, 0.6, () => flag(true));
          break;
        case 'fortress-gate':
          carvedGateway('citadel');
          break;
        case 'goblin-camp':
          craftAt(-20, 6, 0.65, () => tent());
          craftAt(22, 4, 0.6, () => tent());
          craftAt(1, 10, 0.4, () => craftedDecoration('cookfire'));
          sack(-30, 10, 0.4);
          break;
        case 'mire-nests':
          pool();
          nest(-10, 3, 0.6, true);
          nest(10, 5, 0.55, true);
          for (const [index, [x, y]] of [
            [-8, 3],
            [9, 4],
          ].entries())
            ambientAt(x, y, 0.19, index, () => crocodile('#849774'));
          craftAt(23, 2, 0.4, () => grassTuft(0, 4, true));
          break;
        case 'wolf-den':
          craftedDecoration('cindermaw-ash-den');
          craftAt(-21, -10, 0.5, () => tree());
          break;
        case 'ogre-hearth':
          craftAt(0, 0, 1.1, () => hearth());
          stool(-34, 11, true);
          stool(34, 11, true);
          rimBowl(27, 6, 9, '#949d87', '#aa9d75');
          break;
        case 'orc-bivouac':
          craftAt(-9, 1, 0.85, () => tent());
          crateBody(27, 8, 0.65);
          craftAt(-25, -12, 0.6, () => flag());
          craftAt(29, -7, 0.45, () => ledgerDesk());
          break;
        case 'ash-roost':
          craftedDecoration('ashbeast-roost-scene');
          break;
        case 'crown-barracks':
          craftAt(0, 0, 0.9, () => craftedHouse('crown-ash-house'));
          craftAt(27, 6, 0.4, () => rack());
          break;
        default:
          return false;
      }
      return true;
    }

    function gate(family) {
      if (carvedGateway(family)) return;
      if (e.kind === 'exit') {
        blockwork(-31, -32, 62, 47, '#8b9588', 8);
        recessedDoor(0, -27, 37, 42, true);
        poly(
          [
            [-35, -34],
            [0, -48],
            [35, -34],
          ],
          '#a0aa96',
        );
        return;
      }
      // Destination bodies share an anchor, not a facade. Exits retain a quiet generic doorway.
      const side = R.sideDungeons?.find((s) => s.id === family),
        theme = side?.theme;
      if (theme === 'cellar') {
        poly(
          [
            [-31, 13],
            [-27, -17],
            [-16, -30],
            [20, -30],
            [31, -15],
            [31, 13],
          ],
          '#858b76',
        );
        poly(
          [
            [-16, 13],
            [-16, -13],
            [-9, -22],
            [11, -22],
            [18, -13],
            [18, 13],
          ],
          '#233129',
        );
        for (const y of [-4, 3, 10])
          poly(
            [
              [-15, y],
              [17, y],
              [20, y + 4],
              [-18, y + 4],
            ],
            '#a29a7c',
          );
        poly(
          [
            [-31, -17],
            [-16, -30],
            [20, -30],
            [28, -20],
            [10, -23],
            [-17, -21],
          ],
          '#697c55',
        );
        for (const x of [-23, 24])
          line(
            [
              [x, -11],
              [x, 9],
            ],
            '#74604a',
            3,
          );
        line(
          [
            [-23, -13],
            [-16, -19],
          ],
          '#b39b70',
          2,
        );
        rect(22, -5, 8, 12, '#93724e');
        line(
          [
            [23, -2],
            [29, -2],
          ],
          '#c0a078',
          1.5,
        );
        return;
      }
      if (theme === 'flooded') {
        for (const x of [-26, -9, 10, 26])
          line(
            [
              [x, -3],
              [x, 16],
            ],
            '#736950',
            4,
          );
        rect(-29, -25, 58, 30, '#859282');
        poly(
          [
            [-34, -25],
            [-25, -45],
            [-3, -47],
            [13, -35],
            [29, -41],
            [34, -25],
          ],
          '#587b71',
        );
        for (const x of [-22, -12, 0, 13, 24])
          line(
            [
              [x, -22],
              [x, 3],
            ],
            '#697c6d',
            1.5,
          );
        rect(-9, -20, 18, 25, '#233d37');
        rect(14, -19, 9, 10, '#344b43');
        line(
          [
            [14, -15],
            [22, -15],
          ],
          '#a9b8a1',
          2,
        );
        line(
          [
            [-28, 7],
            [28, 7],
          ],
          '#a18b64',
          4,
        );
        line(
          [
            [-12, 11],
            [12, 11],
          ],
          '#a18b64',
          4,
        );
        line(
          [
            [-29, -28],
            [-18, -40],
          ],
          '#a8ad86',
          2,
        );
        for (const x of [-30, 29])
          line(
            [
              [x, 12],
              [x + 4, -3],
            ],
            '#7d946c',
            2,
          );
        return;
      }
      if (theme === 'keep') {
        rect(-26, -33, 52, 46, '#868b7e');
        for (const x of [-28, -14, 0, 14]) rect(x, -43, 11, 12, '#a1a394');
        rect(-9, -15, 18, 28, '#2e3831');
        rect(-16, -29, 5, 9, '#424c42');
        rect(10, -29, 5, 9, '#424c42');
        for (const y of [-23, -3, 9])
          line(
            [
              [-24, y],
              [24, y],
            ],
            '#626e64',
            1.5,
          );
        line(
          [
            [2, -42],
            [2, -59],
          ],
          '#9b815b',
          3,
        );
        poly(
          [
            [4, -58],
            [23, -54],
            [18, -44],
            [4, -47],
          ],
          '#b09a73',
        );
        poly(
          [
            [-29, 13],
            [-32, 1],
            [-23, -5],
            [-17, 13],
          ],
          '#737c70',
        );
        line(
          [
            [18, -37],
            [13, -22],
            [18, -14],
          ],
          '#586459',
          2,
        );
        return;
      }
      if (theme === 'shrine') {
        for (const x of [-27, 20]) {
          rect(x, -27, 8, 40, '#8c7e73');
          rect(x - 3, -30, 14, 5, '#b19b84');
        }
        poly(
          [
            [-33, -30],
            [-5, -52],
            [4, -45],
            [12, -48],
            [33, -30],
            [17, -30],
            [0, -42],
            [-18, -30],
          ],
          '#978571',
        );
        rect(-18, -20, 36, 33, '#66544d');
        rect(-10, -16, 20, 29, '#312a28');
        line(
          [
            [-8, -16],
            [8, 3],
          ],
          '#805c50',
          3,
        );
        line(
          [
            [25, -27],
            [25, -50],
          ],
          '#8e7054',
          3,
        );
        poly(
          [
            [27, -48],
            [39, -43],
            [27, -32],
          ],
          '#975f54',
        );
        line(
          [
            [-31, 12],
            [-19, 12],
          ],
          '#b3a08b',
          4,
        );
        poly(
          [
            [-30, -10],
            [-26, -19],
            [-23, -9],
          ],
          '#786a60',
        );
        return;
      }
      if (theme === 'foundry') {
        rect(-30, -23, 60, 36, '#666976');
        poly(
          [
            [-34, -24],
            [-23, -38],
            [25, -38],
            [34, -24],
          ],
          '#515c69',
        );
        rect(18, -56, 11, 33, '#666574');
        line(
          [
            [19, -49],
            [27, -49],
          ],
          '#a49aa6',
          2,
        );
        rect(-12, -19, 24, 32, '#272a31');
        for (const x of [-23, 23]) rect(x - 2, -20, 4, 33, '#9a8c7d');
        line(
          [
            [-24, -21],
            [24, -21],
          ],
          '#b0a080',
          3,
        );
        rect(-26, -15, 10, 12, '#393d45');
        line(
          [
            [-24, -11],
            [-17, -11],
          ],
          '#c08a64',
          2,
        );
        poly(
          [
            [-9, -32],
            [-1, -35],
            [8, -30],
            [1, -27],
          ],
          '#a8acb0',
        );
        line(
          [
            [-25, 6],
            [-17, 6],
          ],
          steel,
          3,
        );
        line(
          [
            [-21, 3],
            [-21, 12],
          ],
          '#8a735b',
          3,
        );
        return;
      }
      if (family === 'crypt') {
        rect(-28, -25, 56, 38, '#858b7d');
        poly(
          [
            [-31, -25],
            [-23, -41],
            [-10, -49],
            [10, -49],
            [23, -41],
            [31, -25],
          ],
          '#a1a591',
        );
        poly(
          [
            [-15, 13],
            [-15, -16],
            [-9, -29],
            [0, -34],
            [9, -29],
            [15, -16],
            [15, 13],
          ],
          '#202c27',
        );
        for (const x of [-25, 20]) {
          rect(x, -22, 5, 35, '#b2b29b');
          line(
            [
              [x, -13],
              [x + 5, -13],
            ],
            '#707a69',
            1.5,
          );
        }
        skull(0, -42, 5);
        for (const y of [7, 12])
          line(
            [
              [-19, y],
              [19, y],
            ],
            '#aaa68d',
            3,
          );
        for (const [x, y] of [
          [-22, -27],
          [23, -31],
          [-27, 8],
        ])
          oval(x, y, 4, 2, '#627c51');
        return;
      }
      if (family === 'archive') {
        rect(-31, -24, 62, 34, '#769591');
        for (const x of [-28, 20]) rect(x, -39, 8, 49, '#9db5a7');
        poly(
          [
            [-35, -39],
            [-14, -47],
            [15, -47],
            [35, -39],
            [30, -32],
            [-30, -32],
          ],
          '#638783',
        );
        rect(-14, -24, 28, 34, '#213a38');
        line(
          [
            [-12, -21],
            [12, -21],
          ],
          '#b8cfc0',
          2,
        );
        for (const x of [-23, 23]) {
          rect(x - 3, -25, 6, 18, '#4b7270');
          line(
            [
              [x - 3, -18],
              [x + 3, -18],
            ],
            '#a2b8a6',
            1.5,
          );
        }
        line(
          [
            [-29, 3],
            [29, 3],
          ],
          '#446b68',
          3,
        );
        for (const y of [8, 13])
          line(
            [
              [-23, y],
              [23, y],
            ],
            '#8fada0',
            4,
          );
        poly(
          [
            [-5, -36],
            [0, -41],
            [5, -36],
          ],
          '#c6d6b5',
        );
        return;
      }
      if (family === 'mine') {
        poly(
          [
            [-34, 13],
            [-32, -16],
            [-22, -34],
            [-3, -48],
            [19, -38],
            [33, -14],
            [34, 13],
          ],
          '#777d71',
        );
        poly(
          [
            [-19, 13],
            [-19, -13],
            [-11, -26],
            [11, -26],
            [20, -12],
            [20, 13],
          ],
          '#222c27',
        );
        for (const x of [-22, 22])
          line(
            [
              [x, 12],
              [x, -25],
            ],
            '#94744f',
            5,
          );
        line(
          [
            [-25, -26],
            [25, -26],
          ],
          '#b29665',
          6,
        );
        for (const x of [-14, 14])
          line(
            [
              [x, -23],
              [x + (x < 0 ? 7 : -7), -14],
            ],
            '#765c40',
            3,
          );
        for (const x of [-9, 9])
          line(
            [
              [x, -4],
              [x * 1.6, 14],
            ],
            steel,
            2,
          );
        for (const y of [1, 7, 13])
          line(
            [
              [-15, y],
              [15, y],
            ],
            '#977754',
            2,
          );
        poly(
          [
            [-29, -11],
            [-24, -17],
            [-19, -9],
          ],
          '#baaa84',
        );
        return;
      }
      if (family === 'abyss') {
        for (const side of [-1, 1]) {
          poly(
            [
              [side * 18, 13],
              [side * 22, -26],
              [side * 28, -51],
              [side * 36, -22],
              [side * 34, 13],
            ],
            '#65535c',
          );
          line(
            [
              [side * 27, -35],
              [side * 30, -9],
            ],
            '#ac7e6a',
            2,
          );
        }
        poly(
          [
            [-23, -24],
            [-13, -38],
            [0, -31],
            [13, -38],
            [23, -24],
            [18, -17],
            [-18, -17],
          ],
          '#886465',
        );
        poly(
          [
            [-17, 13],
            [-15, -14],
            [0, -25],
            [15, -14],
            [17, 13],
          ],
          '#241f27',
        );
        for (const x of [-10, 10])
          line(
            [
              [x, -16],
              [x, 8],
            ],
            '#8e8387',
            2,
          );
        line(
          [
            [-15, -4],
            [15, -4],
          ],
          '#8e8387',
          2,
        );
        oval(0, -32, 4, 5, '#cf956e');
        line(
          [
            [-28, 10],
            [28, 10],
          ],
          '#a47c65',
          3,
        );
        return;
      }
      if (family === 'citadel') {
        rect(-32, -29, 64, 42, '#666b7a');
        for (const x of [-34, 24]) {
          rect(x, -45, 10, 58, '#7d8290');
          poly(
            [
              [x - 2, -45],
              [x + 5, -59],
              [x + 12, -45],
            ],
            '#555c6b',
          );
        }
        poly(
          [
            [-25, -30],
            [0, -52],
            [25, -30],
          ],
          '#535c6c',
        );
        poly(
          [
            [-14, 13],
            [-14, -17],
            [0, -32],
            [14, -17],
            [14, 13],
          ],
          '#232530',
        );
        for (const x of [-9, 0, 9])
          line(
            [
              [x, -18],
              [x, 7],
            ],
            '#8b8d98',
            2,
          );
        line(
          [
            [-13, -12],
            [13, -12],
          ],
          '#b1a28a',
          2,
        );
        poly(
          [
            [-5, -40],
            [0, -48],
            [5, -40],
            [0, -34],
          ],
          '#b19ac0',
        );
        for (const y of [-23, -8, 7]) {
          line(
            [
              [-30, y],
              [-18, y],
            ],
            '#4b5262',
            1.5,
          );
          line(
            [
              [18, y],
              [30, y],
            ],
            '#4b5262',
            1.5,
          );
        }
        return;
      }
      rect(-30, -32, 60, 44, '#9b9988');
      rect(-17, -21, 34, 34, '#172727');
      poly(
        [
          [-34, -31],
          [0, -56],
          [34, -31],
        ],
        '#9b9988',
      );
      for (const x of [-27, 20]) {
        rect(x, -30, 7, 40, '#b1b1a0');
        line(
          [
            [x, -19],
            [x + 7, -19],
          ],
          ink,
          1,
        );
        line(
          [
            [x, -7],
            [x + 7, -7],
          ],
          ink,
          1,
        );
      }
      for (const side of [-1, 1])
        poly(
          [
            [side * 30, -33],
            [side * 33, -48],
            [side * 22, -34],
          ],
          gold,
        );
      oval(0, -40, 4, 6, '#e8b766');
    }
    function treasuryEntrance(boss) {
      if (craftedResidence(boss)) return;
      const wall = ['#baa888', '#aab1a1', '#a1aaa4', '#a18e7b', '#929ba5'][region],
        roof = ['#9b6350', '#618789', '#727a73', '#76585a', '#596478'][region],
        wood = ['#765b40', '#6c6652', '#69665d', '#5e4d46', '#51515e'][region],
        trim = ['#d8bd83', '#abd0c0', '#c8c4a3', '#c69a75', '#b6a5c2'][region];
      if (boss === 'thorn') {
        rect(-31, -22, 62, 37, wall);
        poly(
          [
            [-37, -22],
            [0, -51],
            [37, -22],
          ],
          roof,
        );
        rect(-15, -15, 30, 30, '#25362b');
        for (const x of [-25, 25])
          line(
            [
              [x, 9],
              [x, -30],
            ],
            wood,
            4,
          );
        for (const x of [-18, -7, 5, 16])
          poly(
            [
              [x, -29],
              [x + 4, -38],
              [x + 8, -29],
            ],
            '#61784f',
          );
        poly(
          [
            [-8, -34],
            [-4, -44],
            [0, -36],
            [5, -45],
            [9, -34],
          ],
          bone,
        );
        line(
          [
            [-28, 8],
            [28, 8],
          ],
          trim,
          2,
        );
      } else if (boss === 'mire') {
        for (const x of [-27, 27])
          line(
            [
              [x, 14],
              [x, -25],
            ],
            wood,
            5,
          );
        rect(-31, -19, 62, 31, wall);
        poly(
          [
            [-37, -18],
            [-26, -40],
            [27, -40],
            [37, -18],
          ],
          roof,
        );
        rect(-15, -12, 30, 24, '#29413c');
        for (const x of [-31, -20, -9, 3, 15, 27])
          line(
            [
              [x, -38],
              [x + 3, -49],
            ],
            '#7a8d67',
            2,
          );
        for (const x of [-11, 0, 11])
          poly(
            [
              [x, -23],
              [x + 4, -31],
              [x + 8, -23],
            ],
            '#6c7b59',
          );
        line(
          [
            [-28, 9],
            [28, 9],
          ],
          trim,
          2,
        );
      } else if (boss === 'ridge') {
        rect(-34, -25, 68, 40, wall);
        for (const x of [-32, 22]) rect(x, -31, 10, 46, '#7b7f76');
        poly(
          [
            [-38, -26],
            [0, -54],
            [38, -26],
          ],
          roof,
        );
        rect(-16, -15, 32, 30, '#262f2c');
        line(
          [
            [-28, -22],
            [28, -22],
          ],
          trim,
          3,
        );
        poly(
          [
            [-13, -35],
            [-19, -46],
            [-6, -40],
          ],
          bone,
        );
        poly(
          [
            [13, -35],
            [19, -46],
            [6, -40],
          ],
          bone,
        );
        for (const x of [-25, 25]) oval(x, 6, 5, 4, '#77796f');
      } else if (boss === 'cindermaw') {
        shade(35, 9, 0.22);
        for (const [x, y, r, c] of [
          [-25, -5, 14, '#4a4652'],
          [-10, -20, 17, '#5a5160'],
          [9, -24, 18, '#514a59'],
          [27, -5, 14, '#45434d'],
        ])
          oval(x, y, r, r * 0.72, c);
        poly(
          [
            [-28, 11],
            [-23, -12],
            [-12, -31],
            [0, -39],
            [13, -31],
            [25, -12],
            [30, 11],
          ],
          '#4e4a54',
        );
        poly(
          [
            [-16, 10],
            [-12, -7],
            [0, -20],
            [13, -7],
            [17, 10],
          ],
          '#211f26',
        );
        for (const side of [-1, 1])
          poly(
            [
              [side * 19, -8],
              [side * 27, -24],
              [side * 31, -7],
            ],
            '#77615b',
          );
        for (const x of [-16, 0, 16]) glint(x, 5, '#d78357', 1.8);
        line(
          [
            [-27, 10],
            [27, 10],
          ],
          trim,
          2,
        );
      } else {
        rect(-35, -27, 70, 42, wall);
        for (const x of [-33, 24]) rect(x, -38, 9, 53, '#686875');
        poly(
          [
            [-40, -28],
            [0, -58],
            [40, -28],
          ],
          roof,
        );
        rect(-16, -17, 32, 32, '#21232c');
        poly(
          [
            [0, -48],
            [7, -37],
            [0, -26],
            [-7, -37],
          ],
          '#a18caf',
        );
        for (const x of [-24, 24])
          poly(
            [
              [x - 5, -28],
              [x, -43],
              [x + 5, -28],
            ],
            '#72637f',
          );
        line(
          [
            [-30, 8],
            [30, 8],
          ],
          trim,
          2,
        );
        glint(0, -39, '#dfc6e8', 2);
      }
    }
    function building(kind) {
      if (!craftedService(kind)) craftedHouse(kind);
    }

    function settlementBuilding(kind) {
      craftedSettlement(kind);
    }

    function ambientAt(x, y, scale, index, paint) {
      const motion = ambientAnimalPose(e, index, e.ambientTime || 0);
      ctx.save();
      ctx.translate(x + motion.x, y + motion.y);
      ctx.scale(scale * motion.facing, scale);
      paint();
      ctx.restore();
    }
    function craftAt(x, y, scale, paint) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      paint();
      ctx.restore();
    }
    function timber(a, b, width = 5, color = '#816247') {
      line([a, b], '#403d32', width + 1.3);
      line([a, b], color, width);
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        len = Math.hypot(dx, dy) || 1,
        nx = -dy / len,
        ny = dx / len;
      line(
        [
          [a[0] + nx, a[1] + ny],
          [b[0] + nx, b[1] + ny],
        ],
        '#bb9c70',
        0.7,
      );
      for (const t of [0.12, 0.88]) fillOval(a[0] + dx * t, a[1] + dy * t, 1, 1, '#3d4036');
    }
    function boards(x, y, w, h, color = '#8b6b49', horizontal = false) {
      poly(
        [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        color,
      );
      const span = horizontal ? h : w;
      for (let q = 6, i = 0; q < span; q += i++ % 2 ? 8 : 7) {
        const a = horizontal ? [x, y + q] : [x + q, y],
          b = horizontal ? [x + w, y + q + 0.5] : [x + q + 0.7, y + h];
        line([a, b], '#584934', 0.8);
        if (i % 2 === 0)
          line(
            horizontal
              ? [
                  [x + 4, y + q - 2],
                  [x + w - 5, y + q - 1],
                ]
              : [
                  [x + q - 2, y + 3],
                  [x + q - 1, y + h - 4],
                ],
            '#b99c70',
            0.6,
          );
      }
    }
    function blockwork(x, y, w, h, color = '#85877b', course = 7) {
      rect(x, y, w, h, color);
      for (let q = course, i = 0; q < h; q += course, i++) {
        line(
          [
            [x, y + q],
            [x + w, y + q],
          ],
          '#505b54',
          0.75,
        );
        for (let z = i % 2 ? 7 : 14; z < w; z += 15)
          line(
            [
              [x + z, y + q - course + 1],
              [x + z, y + q - 0.5],
            ],
            '#59645a',
            0.7,
          );
      }
      line(
        [
          [x + 1, y + 1],
          [x + w - 1, y + 1],
        ],
        '#b5b6a0',
        1.2,
      );
      poly(
        [
          [x + w, y],
          [x + w + 4, y - 2],
          [x + w + 4, y + h - 3],
          [x + w, y + h],
        ],
        '#5a655d',
      );
    }
    function rockPiece(x, y, w = 20, h = 15, dark = false) {
      const base = dark ? '#55515f' : '#858b7d',
        light = dark ? '#82788d' : '#a9ad98';
      poly(
        [
          [x - w, y + 4],
          [x - w * 0.75, y - h * 0.55],
          [x - w * 0.15, y - h],
          [x + w * 0.65, y - h * 0.7],
          [x + w, y + 1],
          [x + w * 0.55, y + 7],
          [x - w * 0.6, y + 8],
        ],
        base,
      );
      poly(
        [
          [x - w * 0.75, y - h * 0.55],
          [x - w * 0.15, y - h],
          [x + w * 0.65, y - h * 0.7],
          [x + w * 0.1, y - 1],
          [x - w * 0.6, y + 2],
        ],
        light,
      );
      line(
        [
          [x - w * 0.15, y - h + 2],
          [x + w * 0.1, y - 1],
          [x + w * 0.55, y + 5],
        ],
        dark ? '#3d3d48' : '#59675f',
        0.9,
      );
    }
    function flame(x = 0, y = 0, size = 1, violet = false) {
      craftAt(x, y, size, () => {
        shaped(
          violet ? '#b47cba' : '#d98948',
          () => {
            ctx.moveTo(-8, 0);
            ctx.bezierCurveTo(-14, -8, -3, -15, -7, -23);
            ctx.quadraticCurveTo(0, -18, 1, -12);
            ctx.quadraticCurveTo(10, -22, 6, -29);
            ctx.bezierCurveTo(18, -14, 14, -2, 7, 1);
            ctx.quadraticCurveTo(0, 4, -8, 0);
          },
          0.7,
        );
        shaped(
          violet ? '#ead2d1' : '#f6cd7c',
          () => {
            ctx.moveTo(-4, 0);
            ctx.quadraticCurveTo(-5, -8, 1, -14);
            ctx.quadraticCurveTo(0, -7, 5, -5);
            ctx.quadraticCurveTo(10, 2, -4, 0);
          },
          0.4,
        );
      });
    }
    function coals(x = 0, y = 4, size = 1) {
      craftAt(x, y, size, () => {
        oval(0, 0, 20, 6, '#4c4540');
        for (const [a, b, r] of [
          [-13, 0, 4],
          [-5, 2, 5],
          [3, -1, 4],
          [12, 1, 5],
        ]) {
          softRect(a - r, b - 2, r * 1.8, 4, '#795244', 1);
          line(
            [
              [a - r + 1, b],
              [a + r - 1, b],
            ],
            '#db8e55',
            0.8,
          );
        }
      });
    }
    function hearth(industrial = false, dark = false) {
      if (industrial) blockwork(20, -50, 10, 27, dark ? '#6b6d76' : '#828778', 7);

      blockwork(-27, -31, 54, 42, dark ? '#64606b' : '#8d8877', 8);
      shaped('#332e2d', () => {
        ctx.moveTo(-18, 9);
        ctx.lineTo(-18, -13);
        ctx.quadraticCurveTo(0, -33, 18, -13);
        ctx.lineTo(18, 9);
      });
      for (const side of [-1, 1])
        poly(
          [
            [side * 18, -11],
            [side * 22, -14],
            [side * 16, -25],
            [side * 11, -21],
          ],
          dark ? '#89808e' : '#b3a58a',
        );
      fillOval(0, -24, 13, 5, '#252729', 0.25);
      coals(0, 6, 0.8);
      flame(0, 5, 0.72, dark);
      poly(
        [
          [-30, 10],
          [26, 10],
          [32, 16],
          [-33, 16],
        ],
        '#777368',
      );
      if (industrial) {
        softRect(-17, -5, 34, 5, '#645f57', 1);
        oval(0, -5, 10, 4, '#443f3c');
        oval(0, -6, 7, 2, '#e4bb87');
      }
    }
    function stool(x, y, stone = false) {
      craftAt(x, y, 1, () => {
        for (const side of [-1, 1])
          timber([side * 6, -1], [side * 8, 12], 4, stone ? '#7e8276' : '#765a41');
        oval(0, -2, 12, 5, stone ? '#a4a797' : '#a8895e');
        line(
          [
            [-8, -3],
            [7, -4],
          ],
          stone ? '#c4c4ad' : '#d2b27e',
          0.8,
        );
      });
    }
    function table(w = 44) {
      for (const side of [-1, 1]) timber([side * (w / 2 - 6), -4], [side * (w / 2 - 5), 15], 4);
      timber([-w / 2 + 5, 8], [w / 2 - 5, 8], 3);
      poly(
        [
          [-w / 2, -16],
          [w / 2, -16],
          [w / 2 + 5, -4],
          [-w / 2 - 4, -4],
        ],
        '#aa885c',
      );
      boards(-w / 2 - 3, -4, w + 7, 5, '#73553c', true);
      line(
        [
          [-w / 2 + 3, -10],
          [w / 2 - 2, -10],
        ],
        '#d4b57d',
        0.8,
      );
    }
    function paper(x = -12, y = -13, w = 22) {
      shaped(
        '#e0d5b2',
        () => {
          ctx.moveTo(x, y);
          ctx.lineTo(x + w, y - 1);
          ctx.quadraticCurveTo(x + w - 3, y + 5, x + w + 2, y + 8);
          ctx.lineTo(x - 2, y + 9);
          ctx.quadraticCurveTo(x + 2, y + 4, x, y);
        },
        0.7,
      );
      for (let z = 3; z < 7; z += 2)
        line(
          [
            [x + 4, y + z],
            [x + w - 4, y + z],
          ],
          '#989b83',
          0.6,
        );
    }
    function bottle(x, y, c = '#89a6a2', scale = 1) {
      craftAt(x, y, scale, () => {
        shaped(c, () => {
          ctx.moveTo(-3, -12);
          ctx.lineTo(3, -12);
          ctx.lineTo(3, -7);
          ctx.quadraticCurveTo(8, -4, 6, 4);
          ctx.quadraticCurveTo(0, 8, -6, 4);
          ctx.quadraticCurveTo(-8, -4, -3, -7);
        });
        line(
          [
            [-3, -13],
            [3, -13],
          ],
          '#a78e61',
          2,
        );
        line(
          [
            [-3, -3],
            [-4, 2],
          ],
          '#e3edcd',
          1,
        );
        line(
          [
            [-4, 1],
            [4, 1],
          ],
          '#596f6b',
          0.7,
        );
      });
    }
    function sack(x, y, size = 1, c = '#b3a078') {
      craftAt(x, y, size, () => {
        shaped(c, () => {
          ctx.moveTo(-4, -15);
          ctx.quadraticCurveTo(-2, -9, -9, -4);
          ctx.bezierCurveTo(-17, 10, 17, 13, 10, -3);
          ctx.quadraticCurveTo(3, -9, 5, -15);
          ctx.quadraticCurveTo(0, -11, -4, -15);
        });
        line(
          [
            [-5, -10],
            [5, -10],
          ],
          '#6e654b',
          2,
        );
        line(
          [
            [-6, -2],
            [-8, 4],
          ],
          '#d6c19a',
          1,
        );
      });
    }
    function chest(sealed = false, size = 1) {
      craftAt(0, 0, size, () => {
        boards(-22, -10, 44, 24, '#8b6744');
        poly(
          [
            [22, -10],
            [28, -15],
            [28, 9],
            [22, 14],
          ],
          '#604c36',
        );
        shaped('#a48154', () => {
          ctx.moveTo(-22, -10);
          ctx.quadraticCurveTo(-23, -27, 0, -28);
          ctx.quadraticCurveTo(23, -27, 22, -10);
          ctx.quadraticCurveTo(0, -7, -22, -10);
        });
        for (const x of [-13, 12]) {
          line(
            [
              [x, -24],
              [x, -11],
              [x, 13],
            ],
            '#5b625c',
            4,
          );
          line(
            [
              [x - 1, -23],
              [x - 1, 11],
            ],
            '#b4b69a',
            0.7,
          );
          for (const y of [-19, -7, 9]) oval(x, y, 1, 1, '#d0c0a0');
        }
        softRect(-4, -7, 8, 10, '#c3a166', 1);
        oval(0, -3, 1.2, 1.5, '#3e4539');
        line(
          [
            [0, -2],
            [0, 1],
          ],
          '#3e4539',
          1,
        );
        for (const x of [-18, 17]) softRect(x - 2, 12, 5, 4, '#594b39', 1);
        if (sealed) {
          line(
            [
              [-19, -17],
              [20, 8],
            ],
            '#cdbb8e',
            1.5,
          );
          oval(8, 0, 4, 3.7, '#9f5351');
          paper(13, -6, 8);
        }
      });
    }
    function crateBody(x = 0, y = 0, size = 1) {
      craftAt(x, y, size, () => {
        boards(-20, -17, 40, 30);
        poly(
          [
            [20, -17],
            [26, -22],
            [26, 7],
            [20, 13],
          ],
          '#65523c',
        );
        poly(
          [
            [-20, -17],
            [-14, -22],
            [26, -22],
            [20, -17],
          ],
          '#bd9b6a',
        );
        for (const a of [-15, 15]) timber([a, -17], [a, 12], 3, '#b39a6d');
        timber([-17, 9], [17, -14], 3, '#aa8d60');
        for (const a of [-15, 15]) for (const b of [-13, 9]) oval(a, b, 1, 1, '#443e32');
      });
    }
    function rimBowl(x, y, w = 15, c = '#7b8176', contents = '#9aa493') {
      oval(x, y + 4, w, 6, c);
      oval(x, y, w, 5, c);
      oval(x, y - 1, w - 3, 3, contents);
      line(
        [
          [x - w + 3, y + 2],
          [x + w - 4, y + 3],
        ],
        '#bcc0a4',
        0.8,
      );
    }
    function nest(x = 0, y = 4, size = 1, wet = false) {
      craftAt(x, y, size, () => {
        oval(0, 0, 25, 9, wet ? '#726d50' : '#8b7852');
        oval(0, -1, 18, 5, wet ? '#535c43' : '#635e44');
        for (let i = 0; i < 12; i++) {
          const a = i * 0.58;
          line(
            [
              [Math.cos(a) * 19, Math.sin(a) * 5],
              [Math.cos(a + 0.6) * 24, Math.sin(a + 0.6) * 8],
            ],
            i % 2 ? '#b9a371' : '#7b8860',
            1.3,
          );
        }
        for (const x of [-15, -5, 7])
          line(
            [
              [x, 0],
              [x + 7, 2],
            ],
            '#c3b18a',
            0.8,
          );
      });
    }
    function flag(crown = false, x = -17, y = 14) {
      timber([x, y], [x, y - 60], 3, '#7e674a');
      shaped(
        crown ? '#62506f' : ['#8b7454', '#6e9588', '#7f8b7d', '#947863', '#62506f'][region],
        () => {
          ctx.moveTo(x + 1, y - 58);
          ctx.bezierCurveTo(x + 15, y - 64, x + 20, y - 52, x + 33, y - 56);
          ctx.lineTo(x + 31, y - 30);
          ctx.bezierCurveTo(x + 17, y - 26, x + 14, y - 39, x + 1, y - 33);
        },
      );
      line(
        [
          [x + 4, y - 55],
          [x + 4, y - 36],
        ],
        '#c4ad7d',
        1.1,
      );
      line(
        [
          [x + 1, y - 53],
          [x - 2, y - 53],
        ],
        '#c6b790',
        1.6,
      );
      if (crown)
        poly(
          [
            [x + 17, y - 51],
            [x + 23, y - 44],
            [x + 17, y - 37],
            [x + 11, y - 44],
          ],
          '#b5a0bc',
        );
      if (!crown)
        line(
          [
            [x + 17, y - 50],
            [x + 17, y - 39],
          ],
          '#d0b47b',
          1.8,
        );
    }
    function wheel(x, y, r = 11, broken = false) {
      oval(x + 2, y, r, r, '#534b3c');
      oval(x, y, r, r, '#7b6548');
      oval(x, y, r - 2, r - 2, '#453f35');
      for (let i = 0; i < 8; i++) {
        if (broken && i === 3) continue;
        const a = (i * Math.PI) / 4;
        line(
          [
            [x, y],
            [x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3)],
          ],
          '#b09668',
          1.8,
        );
      }
      oval(x, y, 3, 3, '#b6a477');
      oval(x, y, 1, 1, '#4e4f42');
    }
    function cartBody(loaded = false, broken = false) {
      timber([-27, 3], [25, 3], 5, '#55564a');
      wheel(-20, 12, 10, broken);
      wheel(22, 12, 10);
      boards(-30, -14, 58, 22, '#947149', true);
      poly(
        [
          [-30, -14],
          [-22, -20],
          [33, -20],
          [28, -14],
        ],
        '#ba9767',
      );
      timber([-31, -14], [28, -14], 3);
      timber([27, -8], [47, 2], 4);
      if (loaded) {
        restingObject(-12, -14, 9, () => crateBody(0, -7.15, 0.55));
        restingObject(16, -14, 7, () => sack(0, -6, 0.8));
        line(
          [
            [-28, -13],
            [21, -27],
            [29, -11],
          ],
          '#d1bb88',
          1.8,
        );
      }
      if (broken) {
        timber([-4, 7], [10, 19], 3);
        timber([-28, -7], [-3, 14], 3);
      }
    }
    function bed(royal = false) {
      for (const x of [-25, 25]) timber([x, -15], [x, 15], 4);
      boards(-26, 4, 52, 6, '#796044', true);
      softRect(-23, -13, 46, 18, royal ? '#706178' : '#6f8581', 5);
      softRect(-21, -12, 14, 12, '#d2c3a1', 4);
      shaped(royal ? '#88718b' : '#839995', () => {
        ctx.moveTo(-4, -12);
        ctx.lineTo(21, -12);
        ctx.quadraticCurveTo(27, -4, 24, 10);
        ctx.lineTo(15, 8);
        ctx.lineTo(13, 3);
        ctx.lineTo(-6, 3);
      });
      line(
        [
          [0, -10],
          [0, 1],
          [16, 4],
          [18, 8],
        ],
        '#c6c8ad',
        1,
      );
      oval(-17, -7, 4, 2, '#b3ad94');
      oval(30, 13, 5, 3, '#5c4a37');
      oval(38, 12, 5, 3, '#5c4a37');
    }
    function tent(crown = false, lean = false) {
      const c = crown ? '#786675' : ['#aa9871', '#7d9d8b', '#8a948a', '#a68c6b', '#786675'][region];
      timber([-24, 10], [-12, -32], 3);
      timber([25, 10], [5, -32], 3);
      shaped(c, () => {
        ctx.moveTo(-35, 11);
        ctx.quadraticCurveTo(-25, -12, -13, -36);
        ctx.quadraticCurveTo(-4, -39, 6, -34);
        ctx.quadraticCurveTo(21, -12, 35, 10);
        ctx.quadraticCurveTo(15, 15, 0, 9);
        ctx.quadraticCurveTo(-18, 13, -35, 11);
      });
      shaped('#474d3d', () => {
        ctx.moveTo(-10, 9);
        ctx.quadraticCurveTo(-7, -8, -3, -27);
        ctx.quadraticCurveTo(3, -9, 14, 10);
      });
      line(
        [
          [-29, 8],
          [-13, -34],
          [6, -33],
          [29, 8],
        ],
        '#d2c09b',
        1.2,
      );
      line(
        [
          [-30, 3],
          [-43, 15],
        ],
        '#baa780',
        1.2,
      );
      line(
        [
          [30, 3],
          [43, 15],
        ],
        '#baa780',
        1.2,
      );
      if (lean) craftAt(2, 6, 0.45, () => bed());
      else {
        line(
          [
            [4, -28],
            [17, 7],
          ],
          '#6b6650',
          2,
        );
        line(
          [
            [-10, -27],
            [-19, 5],
          ],
          '#d3c2a0',
          3,
        );
      }
    }
    function ledgerDesk(map = false, game = false) {
      table(48);
      if (map) {
        paper(-18, -14, 32);
        line(
          [
            [-13, -9],
            [-2, -12],
            [10, -7],
          ],
          '#8b7255',
          1,
        );
        for (const x of [-8, 7]) {
          line(
            [
              [x, -9],
              [x, -18],
            ],
            '#554f44',
            1,
          );
          softPoly(
            [
              [x, -18],
              [x + 5, -16],
              [x, -14],
            ],
            '#866a77',
            0.4,
          );
        }
      } else if (game) {
        poly(
          [
            [-16, -14],
            [12, -14],
            [17, -7],
            [-20, -7],
          ],
          '#d0bf94',
        );
        for (const x of [-10, -2, 6])
          for (const y of [-12, -9]) softRect(x, y, 3, 2, (x + y) % 3 ? '#695847' : '#bcaa7c', 0.3);
        oval(-5, -13, 2, 2, '#484b43');
        oval(9, -10, 2, 2, '#976e56');
      } else {
        softRect(-15, -15, 25, 8, '#61524d', 1);
        paper(-12, -17, 20);
        oval(17, -11, 3, 2.5, '#454c45');
        line(
          [
            [17, -12],
            [22, -23],
          ],
          '#d6caa8',
          1.3,
        );
      }
    }
    function rack(tools = false, farm = false) {
      for (const x of [-23, 23]) timber([x, 14], [x, -35], 5);
      timber([-25, -27], [25, -27], 5);
      timber([-24, 4], [24, 4], 3);
      for (const x of [-14, 0, 14]) {
        timber([x, 8], [x, -26], 2.7, '#ad895a');
        oval(x, -24, 1, 1, '#d7c49a');
        if (tools) {
          if (x === -14) softRect(x - 6, -33, 12, 7, '#89958f', 1.5);
          else if (x === 0)
            shaped('#8b9a93', () => {
              ctx.moveTo(-5, -28);
              ctx.lineTo(5, -28);
              ctx.lineTo(6, -19);
              ctx.quadraticCurveTo(0, -14, -6, -19);
            });
          else
            for (const dx of [-4, 0, 4])
              line(
                [
                  [x + dx, -34],
                  [x + dx, -25],
                  [x, -22],
                ],
                '#99a399',
                1.5,
              );
        } else if (x === -14) {
          line(
            [
              [x, 10],
              [x, -38],
            ],
            '#aa895b',
            2.8,
          );
          poly(
            [
              [x, -44],
              [x + 4, -35],
              [x, -32],
              [x - 4, -35],
            ],
            steel,
          );
        } else if (x === 14) {
          line(
            [
              [x, 10],
              [x, -29],
            ],
            '#aa895b',
            3,
          );
          softPoly(
            [
              [x - 2, -34],
              [x + 10, -34],
              [x + 11, -23],
              [x - 2, -25],
            ],
            steel,
            1,
          );
        } else {
          sword(x, -7);
        }
      }
    }
    function chainLinks(x = -16, y = 7, count = 6) {
      for (let i = 0; i < count; i++) {
        oval(x + i * 6, y + (i % 2), i % 2 ? 2 : 4, i % 2 ? 4 : 2, '#737e78');
        if (i % 2 === 0) oval(x + i * 6, y, 2, 1, '#d1d0b6');
      }
    }
    function lantern(x = 0, y = -20) {
      timber([x, y + 33], [x, y + 2], 3);
      softRect(x - 7, y - 5, 14, 18, '#5d655b', 2);
      softRect(x - 4, y - 2, 8, 11, '#dbbf75', 1);
      line(
        [
          [x, y - 2],
          [x, y + 9],
        ],
        '#777b65',
        1,
      );
      poly(
        [
          [x - 9, y - 5],
          [x, y - 11],
          [x + 9, y - 5],
        ],
        '#7e8375',
      );
      line(
        [
          [x - 3, y - 11],
          [x - 3, y - 16],
          [x + 4, y - 16],
        ],
        '#666d61',
        1.8,
      );
      fillOval(x - 1, y + 2, 2, 3, '#ffe2a0', 0.7);
    }
    function pool(wet = true) {
      shaped(wet ? '#6c8378' : '#85765a', () => {
        ctx.moveTo(-34, 4);
        ctx.bezierCurveTo(-38, -5, -17, -9, -7, -7);
        ctx.bezierCurveTo(4, -14, 36, -6, 34, 3);
        ctx.quadraticCurveTo(23, 14, 7, 10);
        ctx.quadraticCurveTo(-16, 15, -34, 4);
      });
      fillOval(0, 1, 26, 6, wet ? '#7eaaa0' : '#9c8d70', 0.6);
      for (const [x, y] of [
        [-12, 0],
        [8, 4],
        [18, -2],
      ])
        line(
          [
            [x - 5, y],
            [x + 2, y - 1],
            [x + 7, y],
          ],
          wet ? '#bfd2b8' : '#b3a287',
          0.8,
        );
    }
    function foliage(x, y, w = 15, h = 12, c = '#648251') {
      shaped(c, () => {
        ctx.moveTo(x - w, y + 2);
        ctx.bezierCurveTo(
          x - w - 3,
          y - h * 0.3,
          x - w * 0.5,
          y - h * 0.5,
          x - w * 0.7,
          y - h * 0.8,
        );
        ctx.quadraticCurveTo(x - w * 0.2, y - h * 1.3, x + 1, y - h);
        ctx.quadraticCurveTo(x + w * 0.6, y - h * 1.2, x + w * 0.5, y - h * 0.5);
        ctx.quadraticCurveTo(x + w * 1.3, y - h * 0.4, x + w, y + 2);
        ctx.quadraticCurveTo(x, y + h * 0.4, x - w, y + 2);
      });
      line(
        [
          [x - w * 0.5, y - 3],
          [x - 2, y - h * 0.45],
          [x + w * 0.4, y - h * 0.3],
        ],
        '#93aa6e',
        0.8,
      );
    }
    function grassTuft(x = 0, y = 6, wet = false, seed = false) {
      for (const [dx, h] of [
        [-12, 16],
        [-5, 24],
        [2, 19],
        [9, 27],
        [15, 15],
      ]) {
        ctx.strokeStyle = wet ? '#719877' : '#82965e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + dx * 0.4, y);
        ctx.quadraticCurveTo(x + dx, y - h * 0.8, x + dx + (dx < 0 ? -4 : 3), y - h);
        ctx.stroke();
        if (seed) oval(x + dx + 3, y - h, 1.5, 3, '#b7ac7b');
      }
    }
    // Growing wood has tapered grain and forks, never the rivets of built timber.
    function grownStem(a, b, width = 4, color = '#806747') {
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len,
        ny = dx / len;
      shaped(
        color,
        () => {
          ctx.moveTo(a[0] + (nx * width) / 2, a[1] + (ny * width) / 2);
          ctx.quadraticCurveTo(
            a[0] + dx * 0.55 + nx * width * 0.55,
            a[1] + dy * 0.55 + ny * width * 0.55,
            b[0],
            b[1],
          );
          ctx.quadraticCurveTo(
            a[0] + dx * 0.55 - nx * width * 0.2,
            a[1] + dy * 0.55 - ny * width * 0.2,
            a[0] - (nx * width) / 2,
            a[1] - (ny * width) / 2,
          );
        },
        0.6,
      );
      line(
        [
          [a[0], a[1]],
          [a[0] + dx * 0.55, a[1] + dy * 0.55],
          [b[0], b[1]],
        ],
        '#a18b62',
        0.55,
      );
    }
    function naturalTrunk(dead = false, birch = false) {
      const bark = birch ? '#c7c7ab' : dead ? '#736149' : '#7a6044';
      // One continuous silhouette joins both forks to the trunk, with flared roots.
      shaped(bark, () => {
        ctx.moveTo(-9, 14);
        ctx.quadraticCurveTo(-3, 6, -4, -9);
        ctx.quadraticCurveTo(-13, -18, -19, -28);
        ctx.lineTo(-21, -37);
        ctx.lineTo(-18, -34);
        ctx.lineTo(-17, -38);
        ctx.quadraticCurveTo(-16, -27, -12, -23);
        ctx.quadraticCurveTo(-6, -18, -3, -15);
        ctx.lineTo(-3, -31);
        ctx.lineTo(-5, -43);
        ctx.lineTo(-2, -41);
        ctx.lineTo(0, -46);
        ctx.lineTo(2, -41);
        ctx.lineTo(3, -25);
        ctx.quadraticCurveTo(9, -29, 14, -34);
        ctx.lineTo(24, -37);
        ctx.lineTo(22, -34);
        ctx.lineTo(26, -34);
        ctx.quadraticCurveTo(15, -31, 11, -25);
        ctx.quadraticCurveTo(5, -19, 4, -12);
        ctx.quadraticCurveTo(4, 5, 10, 14);
        ctx.lineTo(3, 11);
        ctx.lineTo(0, 15);
        ctx.lineTo(-3, 12);
      });
      line(
        [
          [-2, 10],
          [-1, -9],
          [-2, -25],
          [-2, -36],
        ],
        birch ? '#8d907e' : '#4f4b36',
        0.9,
      );
      line(
        [
          [-13, -27],
          [-9, -22],
          [-3, -17],
          [-1, -10],
        ],
        '#a9956c',
        0.8,
      );
      line(
        [
          [2, -15],
          [7, -24],
          [16, -32],
        ],
        birch ? '#a7ad94' : '#b0986a',
        0.75,
      );
      if (dead) {
        shaped(
          '#a18a65',
          () => {
            ctx.moveTo(-3, 2);
            ctx.lineTo(-2, -11);
            ctx.lineTo(1, -16);
            ctx.lineTo(0, -2);
            ctx.lineTo(2, 5);
          },
          0.4,
        );
        for (const [x, y] of [
          [-18, -35],
          [0, -43],
          [23, -35],
        ])
          line(
            [
              [x - 1, y + 2],
              [x, y],
              [x + 1, y + 2],
            ],
            '#c2aa7a',
            0.7,
          );
        line(
          [
            [-5, 12],
            [-3, 3],
            [-4, -3],
          ],
          '#353e34',
          1.3,
        );
      }
    }
    function naturalLog(
      x = 0,
      y = 5,
      length = 54,
      width = 11,
      burnt = false,
      drift = false,
      fork = true,
    ) {
      craftAt(x, y, 1, () => {
        const lo = -length / 2,
          hi = length / 2,
          r = width / 2;
        const bark = drift ? '#aca083' : burnt ? '#514a40' : '#786044';
        shaped(bark, () => {
          ctx.moveTo(lo + 2, r);
          ctx.lineTo(lo - 2, r * 0.25);
          ctx.lineTo(lo + 1, -r * 0.35);
          ctx.lineTo(lo, -r);
          ctx.quadraticCurveTo(-14, -r - 2, -8, -r * 0.8);
          if (fork) {
            ctx.quadraticCurveTo(-11, -12, -13, -16);
            ctx.lineTo(-10, -14);
            ctx.lineTo(-10, -18);
            ctx.quadraticCurveTo(-7, -13, -4, -r);
          }
          ctx.quadraticCurveTo(10, -r - 1, hi, -r * 0.8);
          ctx.lineTo(hi + 1, r * 0.8);
          ctx.quadraticCurveTo(7, r + 2, lo + 2, r);
        });
        if (drift) {
          line(
            [
              [lo + 1, 0],
              [-15, -2],
              [-3, 0],
              [12, -2],
              [hi, -3],
            ],
            '#d5c7a7',
            1.1,
          );
          for (const dy of [-2, 2])
            line(
              [
                [hi - 9, dy],
                [hi - 2, dy - 1],
                [hi + 2, dy - 2],
              ],
              '#796f58',
              0.8,
            );
        } else {
          // Solid irregular cut end: a pale heartwood face, not a dark pipe opening.
          shaped(
            burnt ? '#8e7858' : '#c5a26c',
            () => {
              ctx.moveTo(hi - 1, -r * 0.85);
              ctx.quadraticCurveTo(hi + 5, -r, hi + 4, 1);
              ctx.quadraticCurveTo(hi + 4, r + 2, hi - 1, r * 0.8);
              ctx.quadraticCurveTo(hi - 4, 0, hi - 1, -r * 0.85);
            },
            0.8,
          );
          ctx.strokeStyle = burnt ? '#5f533c' : '#9d7f50';
          ctx.lineWidth = 0.65;
          ctx.beginPath();
          ctx.moveTo(hi, -r * 0.5);
          ctx.bezierCurveTo(hi + 3, -r * 0.5, hi + 3, r * 0.6, hi, r * 0.45);
          ctx.stroke();
          line(
            [
              [hi + 1, r * 0.1],
              [hi + 3, r * 0.7],
            ],
            '#786343',
            0.7,
          );
        }
        line(
          [
            [lo + 5, -r * 0.6],
            [-17, -r * 0.4],
            [-7, -r * 0.6],
            [5, -r * 0.25],
            [hi - 4, -r * 0.5],
          ],
          drift ? '#e0d1ad' : burnt ? '#958262' : '#b0986a',
          0.9,
        );
        line(
          [
            [lo + 7, r * 0.5],
            [-13, r * 0.2],
            [2, r * 0.5],
            [hi - 5, r * 0.3],
          ],
          drift ? '#7e775d' : '#514c37',
          0.8,
        );
        if (fork)
          line(
            [
              [-9, -13],
              [-6, -8],
              [-3, -3],
              [5, -1],
            ],
            drift ? '#cdbd9b' : '#9f875c',
            0.7,
          );
      });
    }
    function splitFirewood(x, y, length = 36, tilt = 0) {
      craftAt(x, y, 1, () => {
        ctx.rotate(tilt);
        shaped('#675039', () => {
          ctx.moveTo(-length / 2, 2);
          ctx.lineTo(-length / 2 - 2, -2);
          ctx.lineTo(-length / 2 + 2, -6);
          ctx.quadraticCurveTo(0, -8, length / 2, -5);
          ctx.lineTo(length / 2 + 2, 3);
          ctx.quadraticCurveTo(0, 6, -length / 2, 2);
        });
        shaped(
          '#ac8758',
          () => {
            ctx.moveTo(-length / 2 + 1, -5);
            ctx.lineTo(-length / 2 + 5, -8);
            ctx.lineTo(length / 2 + 1, -6);
            ctx.lineTo(length / 2, -3);
            ctx.quadraticCurveTo(0, -5, -length / 2 + 1, -5);
          },
          0.5,
        );
        poly(
          [
            [length / 2, -6],
            [length / 2 + 5, -3],
            [length / 2 + 4, 3],
            [length / 2 - 2, 2],
            [length / 2 - 3, -2],
          ],
          '#d1b17c',
        );
        line(
          [
            [length / 2 + 1, -3],
            [length / 2, 0],
            [length / 2 + 2, 2],
          ],
          '#a08354',
          0.7,
        );
        for (const dy of [-1, 2])
          line(
            [
              [-length / 2 + 4, dy],
              [-5, dy - 1],
              [7, dy + 1],
              [length / 2 - 3, dy],
            ],
            '#413d2c',
            0.6,
          );
      });
    }
    function restingObject(x, surfaceY, width, paint) {
      fillOval(x, surfaceY, width, 1.25, '#473f32', 0.23);
      craftAt(x, surfaceY, 1, paint);
    }
    function tree(kind = 'sapling') {
      const willow = kind === 'willow',
        birch = kind === 'birch',
        pine = kind === 'pine',
        mangrove = kind === 'mangrove',
        fruit = kind === 'fruit';
      if (mangrove) {
        // Uneven prop roots descend from different trunk/branch heights into the mud.
        for (const [sx, sy, cx, cy, ex, ey, w] of [
          [-2, -21, -25, -9, -31, 12, 3.6],
          [3, -26, 22, -13, 29, 13, 3],
          [-1, -10, -14, 3, -18, 18, 3.8],
          [4, -17, 14, 0, 18, 20, 3.2],
          [-3, -7, -6, 6, -9, 17, 3],
          [2, -2, 6, 9, 8, 20, 2.4],
        ]) {
          shaped(
            '#736449',
            () => {
              ctx.moveTo(sx - w / 2, sy);
              ctx.quadraticCurveTo(cx - w, cy, ex - 1, ey);
              ctx.lineTo(ex + 1, ey);
              ctx.quadraticCurveTo(cx + w * 0.6, cy, sx + w / 2, sy);
            },
            0.6,
          );
        }
      }
      if (pine) {
        shaped('#7a6044', () => {
          ctx.moveTo(-7, 14);
          ctx.quadraticCurveTo(-3, 5, -3, -16);
          ctx.lineTo(0, -49);
          ctx.lineTo(3, -17);
          ctx.quadraticCurveTo(3, 5, 8, 14);
          ctx.lineTo(2, 11);
          ctx.lineTo(0, 14);
          ctx.lineTo(-3, 12);
        });
        line(
          [
            [-1, 10],
            [0, -7],
            [0, -29],
          ],
          '#ac9366',
          0.8,
        );
      } else naturalTrunk(false, birch);
      if (pine) {
        for (let i = 0; i < 4; i++) {
          const y = -36 + i * 9,
            w = 8 + i * 5;
          shaped(i % 2 ? '#55705a' : '#668164', () => {
            ctx.moveTo(0, y - 15);
            ctx.quadraticCurveTo(-w * 0.5, y - 3, -w, y + 1);
            ctx.lineTo(-w * 0.4, y);
            ctx.lineTo(-w * 0.2, y + 3);
            ctx.quadraticCurveTo(w * 0.6, y + 4, w, y);
            ctx.quadraticCurveTo(w * 0.4, y - 3, 0, y - 15);
          });
        }
      } else {
        foliage(-14, -22, 14, 15, willow ? '#6f8f6a' : '#648657');
        foliage(7, -31, 19, 15, willow ? '#799775' : '#74975e');
        foliage(18, -18, 12, 13, '#527d58');
        if (willow)
          for (const dx of [-24, -14, -3, 11, 24]) {
            ctx.strokeStyle = '#8ba67b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(dx, -27);
            ctx.quadraticCurveTo(dx + 6, -11, dx + 3, 4);
            ctx.stroke();
          }
        if (fruit)
          for (const [x, y] of [
            [-18, -25],
            [-5, -36],
            [13, -29],
            [20, -20],
          ]) {
            line(
              [
                [x, y - 4],
                [x, y],
              ],
              '#6a6545',
              0.7,
            );
            oval(x, y, 2.5, 3, '#c8885a');
          }
      }
      if (birch)
        for (const y of [-20, -10, 2])
          line(
            [
              [-2, y],
              [2, y - 1],
            ],
            '#696b60',
            1.3,
          );
    }
    function craftedDecoration(kind) {
      switch (kind) {
        case 'vale-working-mill': {
          // A two-storey timber mill reuses the Vale workshop's approved
          // materials and joinery. Its bank-side wheel does not paint water.
          blockwork(-66, -4, 126, 28, '#969982', 11);
          craftAt(3, -22, 1.8, () => settlementBuilding('vale-workshop'));
          boards(-35, -88, 62, 30, '#bfaa7e');
          for (const x of [-34, -4, 26]) timber([x, -88], [x, -59], 4, '#73563b');
          poly(
            [
              [-48, -87],
              [-9, -119],
              [43, -88],
            ],
            '#a17b51',
            '#654d37',
            2,
          );
          timber([-9, -119], [43, -88], 3, '#cab384');
          rect(-16, -83, 17, 20, '#473d30');
          timber([-77, 1], [-42, 1], 7, '#72563d');
          const wheelX = -72,
            wheelY = -1,
            radius = 29;
          oval(wheelX, wheelY, radius, radius, '#69513c');
          oval(wheelX, wheelY, radius - 5, radius - 5, '#303c34');
          for (let j = 0; j < 12; j++) {
            const a = (j * Math.PI) / 6;
            timber(
              [wheelX, wheelY],
              [wheelX + Math.cos(a) * 25, wheelY + Math.sin(a) * 25],
              2.7,
              '#c1a477',
            );
            craftAt(wheelX + Math.cos(a) * 28, wheelY + Math.sin(a) * 28, 1, () => {
              ctx.rotate(a);
              rect(-3, -6, 6, 12, '#9a7c55');
            });
          }
          oval(wheelX, wheelY, 5, 5, '#b6aa8b');
          boards(29, 11, 34, 9, '#a78a61');
          for (const x of [35, 47]) {
            oval(x, 2, 6, 10, '#c0b18b');
            timber([x - 4, -2], [x + 4, -2], 1.5);
          }
          break;
        }
        case 'mill-sluice':
          blockwork(-26, 4, 52, 12, '#898d77', 9);
          for (const x of [-22, 19]) timber([x, -18], [x, 15], 5);
          boards(-20, -12, 39, 20, '#ab9066');
          timber([-27, -18], [27, -18], 4);
          timber([0, -27], [0, 0], 3, '#686c5c');
          break;
        case 'fruit-cellar':
          softPoly(
            [
              [-49, 16],
              [-44, -8],
              [-23, -32],
              [13, -38],
              [45, -15],
              [52, 17],
            ],
            '#637d50',
            2,
          );
          blockwork(-24, -19, 48, 39, '#989a7d', 9);
          oval(0, -17, 24, 16, '#9a9d83');
          rect(-15, -16, 30, 34, '#403d2d');
          boards(-12, -15, 24, 31, '#8f714a');
          timber([0, -15], [0, 16], 2, '#594730');
          craftAt(31, 13, 0.55, () => chest(false));
          break;
        case 'estate-scaffold':
          for (const x of [-32, 28]) timber([x, -67], [x, 21], 5);
          for (const y of [-55, -22, 10]) {
            timber([-36, y], [33, y], 4);
            timber([-30, y], [27, y - 28], 3);
          }
          boards(-39, -31, 78, 8, '#aa9268');
          blockwork(-25, 9, 50, 18, '#93957f', 10);
          break;
        case 'frontier-grain-silo': {
          // A working provincial granary: curved masonry, weathered tin roof,
          // iron hoops, a loading hatch, access ladder and filled grain sacks.
          oval(0, 20, 80, 27, '#242a2755');
          oval(0, 10, 77, 27, '#777c6a');
          oval(0, 5, 74, 26, '#b0ad91');
          const body = ctx.createLinearGradient(-58, 0, 58, 0);
          body.addColorStop(0, '#8b8a70');
          body.addColorStop(0.35, '#d0c4a0');
          body.addColorStop(0.7, '#b9ae8a');
          body.addColorStop(1, '#777b68');
          shaped(body, () => {
            ctx.moveTo(-58, 4);
            ctx.lineTo(-58, -98);
            ctx.bezierCurveTo(-35, -116, 35, -116, 58, -98);
            ctx.lineTo(58, 4);
            ctx.bezierCurveTo(34, 24, -34, 24, -58, 4);
            ctx.closePath();
          });
          for (const y of [-76, -43, -9]) {
            ctx.strokeStyle = '#667368';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-57, y);
            ctx.bezierCurveTo(-32, y + 15, 32, y + 15, 57, y);
            ctx.stroke();
            for (const x of [-43, 43]) oval(x, y + 5, 1.3, 1.3, '#c2c1a4');
          }
          for (const x of [-36, -13, 14, 37])
            line(
              [
                [x, -88],
                [x, 4],
              ],
              '#8d937755',
              1,
            );
          shaped('#576b6a', () => {
            ctx.moveTo(-66, -98);
            ctx.quadraticCurveTo(-44, -117, 0, -133);
            ctx.quadraticCurveTo(43, -117, 66, -98);
            ctx.quadraticCurveTo(0, -74, -66, -98);
          });
          for (const x of [-48, -24, 0, 24, 48])
            line(
              [
                [0, -132],
                [x, -94 - Math.abs(x) * 0.08],
              ],
              '#89968a',
              1.3,
            );
          oval(0, -132, 7, 3, '#aeb19a');
          line(
            [
              [-65, -98],
              [-42, -88],
              [0, -84],
              [42, -88],
              [65, -98],
            ],
            '#b6bba4',
            2,
          );
          softRect(-15, -24, 30, 42, '#72715b', 3);
          softRect(-11, -20, 22, 35, '#343f36', 2);
          boards(-9, -17, 18, 30, '#8d7957', true);
          line(
            [
              [-9, -3],
              [10, -3],
            ],
            '#bca878',
            2,
          );
          oval(6, -4, 1.6, 1.6, '#363c32');
          for (const x of [43, 54])
            line(
              [
                [x, -91],
                [x, 8],
              ],
              '#53645d',
              2.7,
            );
          for (let y = -85; y < 5; y += 10)
            line(
              [
                [43, y],
                [54, y],
              ],
              '#a3aa91',
              1.5,
            );
          for (const [x, y] of [
            [-44, 12],
            [-60, 10],
            [49, 19],
          ]) {
            shaped('#b4a071', () => {
              ctx.moveTo(x - 9, y + 1);
              ctx.quadraticCurveTo(x - 12, y - 10, x - 5, y - 15);
              ctx.lineTo(x + 4, y - 15);
              ctx.quadraticCurveTo(x + 12, y - 7, x + 9, y + 3);
              ctx.quadraticCurveTo(x, y + 8, x - 9, y + 1);
            });
            line(
              [
                [x - 4, y - 14],
                [x + 4, y - 14],
              ],
              '#756e50',
              1.5,
            );
            line(
              [
                [x, y - 9],
                [x - 2, y - 2],
                [x + 2, y + 2],
              ],
              '#d6c28c',
              0.8,
            );
          }
          ctx.fillStyle = '#5b614d';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('GRAIN', 0, -48);
          break;
        }
        case 'frontier-civic-fountain':
          // A broad carved basin on two low steps, with a bronze lily and clear falling water.
          oval(0, 17, 55, 19, '#292c2b55');
          oval(0, 12, 52, 18, '#626e69');
          oval(0, 8, 52, 18, '#b0b4a2');
          oval(0, 7, 47, 15, '#d0cfb7');
          oval(0, 3, 46, 15, '#7f9189');
          oval(0, -2, 46, 15, '#d3d2bd');
          oval(0, -3, 40, 11, '#487d83');
          oval(0, -5, 35, 8, '#6ca4a5');
          for (const x of [-33, -16, 0, 16, 33])
            line(
              [
                [x, 7],
                [x * 1.07, 13],
              ],
              '#868d7e',
              0.8,
            );
          for (const side of [-1, 1]) {
            shaped('#9eac9d', () => {
              ctx.moveTo(side * 10, -3);
              ctx.quadraticCurveTo(side * 13, -20, side * 6, -42);
              ctx.lineTo(side * 3, -42);
              ctx.lineTo(side * 3, -3);
            });
          }
          oval(0, -7, 15, 5, '#bbc1ab');
          rimBowl(0, -43, 22, '#b8c2ae', '#669c98');
          oval(0, -46, 17, 4, '#91c1b4');
          for (const side of [-1, 1]) {
            shaped('#a99461', () => {
              ctx.moveTo(0, -48);
              ctx.bezierCurveTo(side * 19, -51, side * 13, -63, side * 3, -61);
              ctx.quadraticCurveTo(side * 6, -54, 0, -48);
            });
            ctx.strokeStyle = '#d8eee1';
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(side * 7, -57);
            ctx.bezierCurveTo(side * 27, -64, side * 36, -32, side * 29, -7);
            ctx.stroke();
            line(
              [
                [side * 18, -42],
                [side * 20, -19],
                [side * 18, -6],
              ],
              '#b1d8cb',
              1.4,
            );
            oval(side * 29, -5, 5, 1.7, '#d5ede1');
          }
          ctx.strokeStyle = '#ddf1e4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -58);
          ctx.bezierCurveTo(-5, -82, 7, -83, 2, -58);
          ctx.stroke();
          for (const y of [-4, 0]) {
            ctx.strokeStyle = '#b9dcd0';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.ellipse(0, y, 27, 5, 0, 0.1, Math.PI - 0.1);
            ctx.stroke();
          }
          break;
        case 'direwolf-kennel':
          nest(0, 3, 1.25);
          softPoly(
            [
              [-28, 3],
              [-24, 12],
              [-12, 15],
              [9, 13],
              [25, 7],
            ],
            '#82938a',
            4,
          );
          for (const x of [-10, 8]) {
            oval(x, 8, 3, 2, '#687c71');
            for (const dx of [-2, 0, 2]) fillOval(x + dx, 5, 1, 1, '#687c71');
          }
          break;
        case 'rider-tack-rack':
        case 'flight-harness-station':
          for (const x of [-24, 24]) timber([x, 14], [x, -34], 4);
          timber([-26, -29], [26, -29], 5);
          shaped('#7e5c43', () => {
            ctx.moveTo(-19, -29);
            ctx.quadraticCurveTo(-11, -44, -6, -34);
            ctx.quadraticCurveTo(2, -27, 12, -36);
            ctx.quadraticCurveTo(19, -40, 22, -28);
            ctx.lineTo(12, -15);
            ctx.quadraticCurveTo(-2, -11, -14, -17);
          });
          line(
            [
              [-13, -27],
              [-8, -20],
              [10, -20],
              [16, -27],
            ],
            '#c4a274',
            1.2,
          );
          for (const x of [-16, 16]) {
            line(
              [
                [x, -21],
                [x, 5],
              ],
              '#b39061',
              2,
            );
            oval(x, 7, 5, 4, '#8c9990');
            oval(x, 6, 2.5, 2, '#d3c8a3');
          }
          if (kind === 'flight-harness-station') {
            chainLinks(-10, 11, 4);
            softRect(-6, -29, 12, 5, '#9f8a65', 1);
          } else {
            line(
              [
                [2, -19],
                [7, 8],
                [2, 11],
              ],
              '#493e33',
              2,
            );
            oval(1, -30, 1, 1, gold);
          }
          break;
        case 'rider-bunk':
        case 'bunk':
          bed();
          break;
        case 'torch':
          timber([0, 15], [0, -6], 4, '#72654d');
          for (const y of [-4, 0, 4])
            line(
              [
                [-2, y],
                [2, y + 1],
              ],
              '#c1aa78',
              1.2,
            );
          softRect(-4, -9, 8, 7, '#4d4640', 1);
          flame(0, -7, 0.65);
          break;
        case 'estate-rug':
          softPoly(
            [
              [-42, -4],
              [8, -20],
              [45, -5],
              [-4, 12],
            ],
            '#563446',
            3,
          );
          softPoly(
            [
              [-35, -4],
              [8, -16],
              [37, -5],
              [-4, 8],
            ],
            '#8b5460',
            2,
          );
          line(
            [
              [-32, -3],
              [7, -14],
              [33, -5],
              [-4, 6],
              [-32, -3],
            ],
            '#cdb07d',
            1.5,
          );
          for (let x = -26; x < 28; x += 7)
            line(
              [
                [x, -4],
                [x + 9, -1],
              ],
              '#aa7974',
              0.6,
            );
          for (const x of [-34, -25, -16, -7]) {
            const y = -4 + ((x + 42) * 16) / 38;
            line(
              [
                [x, y],
                [x - 2, y + 2],
              ],
              '#c4aa7b',
              0.8,
            );
          }
          break;
        case 'estate-hearth':
          hearth();
          blockwork(-32, -39, 64, 7, '#a08b80', 7);
          break;
        case 'estate-lounge':
          for (const x of [-23, 23]) timber([x, 5], [x, 15], 4, '#68513c');
          softRect(-28, -26, 56, 24, '#5e3f50', 7);
          softRect(-22, -20, 44, 15, '#8c6270', 5);
          softRect(-28, -10, 56, 20, '#765160', 5);
          for (const x of [-15, 9]) softRect(x - 9, -9, 22, 14, '#a47a81', 4);
          for (const x of [-26, 26]) softRect(x - 5, -15, 10, 24, '#674657', 4);
          line(
            [
              [-20, -19],
              [20, -19],
            ],
            '#c9ac7e',
            1,
          );
          line(
            [
              [0, -7],
              [0, 4],
            ],
            '#65474e',
            0.8,
          );
          break;
        case 'coffin':
          poly(
            [
              [-17, -16],
              [-10, -26],
              [10, -26],
              [18, -15],
              [15, 15],
              [-15, 15],
            ],
            '#747b70',
          );
          poly(
            [
              [18, -15],
              [24, -19],
              [20, 11],
              [15, 15],
            ],
            '#525f55',
          );
          poly(
            [
              [-14, -16],
              [-8, -23],
              [8, -23],
              [14, -14],
              [12, 11],
              [-12, 11],
            ],
            '#a0a58e',
          );
          line(
            [
              [-7, -12],
              [7, -12],
            ],
            '#626d60',
            1.7,
          );
          line(
            [
              [0, -20],
              [0, 4],
            ],
            '#626d60',
            1.7,
          );
          for (const y of [-8, 7]) softRect(12, y, 5, 3, '#776d59', 0.6);
          break;
        case 'bones':
        case 'bone-pile':
          fillOval(0, 8, 22, 5, '#526151', 0.15);
          skull(-8, -3, kind === 'bones' ? 6 : 8);
          for (const [x, y, ang] of [
            [8, 4, 0.6],
            [12, 2, -0.5],
            [-7, 9, 0.1],
          ])
            craftAt(x, y, 1, () => {
              ctx.rotate(ang);
              shaped(bone, () => {
                ctx.moveTo(-8, -1);
                ctx.quadraticCurveTo(-12, -5, -12, 0);
                ctx.quadraticCurveTo(-13, 5, -8, 2);
                ctx.lineTo(8, 2);
                ctx.quadraticCurveTo(13, 5, 12, 0);
                ctx.quadraticCurveTo(12, -5, 8, -1);
              });
            });
          if (kind === 'bone-pile')
            for (const y of [0, 4, 8])
              line(
                [
                  [12, y],
                  [20, y + 2],
                  [25, y],
                ],
                '#b8baa1',
                1.5,
              );
          break;
        case 'banner':
          flag();
          break;
        case 'crown-banner':
        case 'royal-flight-standard':
          flag(true);
          if (kind === 'royal-flight-standard')
            softPoly(
              [
                [-7, -32],
                [3, -37],
                [10, -31],
                [3, -33],
              ],
              '#d0b887',
              0.5,
            );
          break;
        case 'shelf':
          boards(-26, -34, 52, 46, '#68543e');
          for (const y of [-19, 2, 13]) {
            boards(-28, y, 56, 4, '#a0855b', true);
            for (let i = 0, x = -21; x < 23; x += 6, i++) {
              const h = 10 + (i % 3) * 3;
              craftAt(x, y - 1, 1, () => {
                ctx.rotate(((i % 3) - 1) * 0.07);
                softRect(-2, -h, 5, h, ['#8b7562', '#697c77', '#a3936f'][i % 3], 0.8);
                line(
                  [
                    [-1, -h + 3],
                    [2, -h + 3],
                  ],
                  '#d0bd8e',
                  0.7,
                );
              });
            }
          }
          break;
        case 'water':
          pool();
          break;
        case 'rune':
          rockPiece(0, 5, 23, 24);
          line(
            [
              [-1, -16],
              [9, -5],
              [0, 5],
              [-10, -5],
              [-1, -16],
            ],
            '#4d6967',
            3,
          );
          line(
            [
              [-1, -16],
              [9, -5],
              [0, 5],
              [-10, -5],
            ],
            '#a8cfbb',
            1.1,
          );
          break;
        case 'crate':
          crateBody();
          break;
        case 'rail':
          for (const y of [-10, 0, 10]) timber([-28, y], [29, y], 5, '#756650');
          for (const x of [-14, 14]) {
            line(
              [
                [x, -20],
                [x, 18],
              ],
              '#735e4b',
              4,
            );
            line(
              [
                [x - 1, -20],
                [x - 1, 18],
              ],
              '#bbc0ab',
              1.2,
            );
            for (const y of [-10, 0, 10]) {
              softRect(x - 4, y - 2, 8, 4, '#6f7468', 0.5);
              oval(x + 2, y, 1, 1, '#c8c5a2');
            }
          }
          break;
        case 'crystal':
        case 'crystal-cluster':
          for (const [x, y, h, w] of [
            [-15, 6, 25, 7],
            [0, 9, 43, 9],
            [16, 6, 31, 7],
          ]) {
            poly(
              [
                [x - w, y],
                [x - w, y - h + 7],
                [x, y - h],
                [x + w, y - h + 8],
                [x + w, y],
              ],
              kind === 'crystal' ? '#83a6ae' : '#82758c',
            );
            poly(
              [
                [x, y - h],
                [x + w, y - h + 8],
                [x + w, y],
                [x, y - 3],
              ],
              kind === 'crystal' ? '#527c87' : '#594c72',
            );
            line(
              [
                [x - 3, y - h + 9],
                [x - 3, y - 5],
              ],
              kind === 'crystal' ? '#c6dada' : '#c6b7d4',
              1.1,
            );
            fillOval(x - 2, y - h + 12, 1, 2, '#e8d3e2', 0.8);
          }
          break;
        case 'chain':
          craftAt(0, -34, 1, () => {
            ctx.rotate(Math.PI / 2);
            chainLinks(0, 0, 8);
          });
          rockPiece(0, 14, 13, 6);
          oval(0, -34, 5, 3, '#87988a');
          break;
        case 'ember':
          coals();
          flame(2, 1, 0.35);
          break;
        case 'armor':
          timber([0, 14], [0, -37], 4);
          timber([-13, 14], [13, 14], 4);
          softPoly(
            [
              [-11, -27],
              [0, -31],
              [11, -27],
              [9, -6],
              [0, -2],
              [-9, -6],
            ],
            '#939f9c',
            3,
          );
          for (const side of [-1, 1])
            softPoly(
              [
                [side * 9, -26],
                [side * 17, -28],
                [side * 21, -21],
                [side * 16, -15],
                [side * 10, -17],
              ],
              '#acb5ab',
              2,
            );
          softRect(-8, -44, 16, 15, '#8b9b9a', 4);
          line(
            [
              [-6, -37],
              [6, -37],
            ],
            '#3d514f',
            2,
          );
          line(
            [
              [0, -25],
              [0, -8],
            ],
            '#d0ceb1',
            1,
          );
          break;
        case 'thorn-bed':
          nest(0, 4, 1.2);
          for (const x of [-17, -5, 8, 18])
            craftAt(x, 2, 0.5, () => foliage(0, 0, 10, 7, '#6d8557'));
          break;
        case 'fang-trophy':
        case 'trophy-rack':
          for (const x of [-23, 23]) timber([x, 14], [x, -31], 4);
          timber([-26, -27], [26, -27], 4);
          for (const [x, h] of [
            [-20, 11],
            [-12, 15],
            [-4, 13],
            [5, 17],
            [13, 14],
            [21, 10],
          ]) {
            line(
              [
                [x, -25],
                [x, -18],
              ],
              '#c1ac76',
              1,
            );
            shaped(bone, () => {
              ctx.moveTo(x - 3, -18);
              ctx.quadraticCurveTo(x + 5, -18, x + 1, -18 + h);
              ctx.quadraticCurveTo(x, -12, x - 3, -18);
            });
          }
          break;
        case 'root-table':
          for (const side of [-1, 1]) {
            grownStem([side * 3, -4], [side * 10, 8], 8, '#6b583d');
            grownStem([side * 10, 8], [side * 21, 13], 4, '#746043');
          }
          oval(0, -7, 27, 9, '#97784e');
          oval(0, -10, 27, 8, '#b49868');
          oval(0, -10, 18, 4, '#ac8b5c');
          line(
            [
              [-17, -12],
              [3, -10],
              [15, -9],
            ],
            '#746247',
            0.9,
          );
          restingObject(-7, -10, 5, () => rimBowl(0, -10, 6, '#a8a68b', '#dbca9a'));
          bottle(12, -12, '#7c9587', 0.65);
          break;
        case 'warm-brazier':
        case 'dark-brazier':
          for (const x of [-13, 13]) timber([x, 3], [x + Math.sign(x) * 3, 16], 4, '#65665e');
          rimBowl(0, 0, 23, kind === 'dark-brazier' ? '#575060' : '#7d8172', '#4f423a');
          coals(0, -2, 0.8);
          flame(0, -4, 0.8, kind === 'dark-brazier');
          line(
            [
              [-19, 2],
              [0, 6],
              [19, 2],
            ],
            '#b3aa8d',
            1.4,
          );
          break;
        case 'treasure-hoard':
          for (let i = 0; i < 14; i++) {
            const x = (i % 5) * 10 - 20,
              y = Math.floor(i / 5) * 5 - 3;
            oval(x, y, 7, 2.6, '#a1874d');
            oval(x, y - 2, 7, 2.3, '#d7bc72');
            line(
              [
                [x - 3, y - 3],
                [x + 2, y - 3],
              ],
              '#f2d590',
              0.8,
            );
          }
          sack(22, 4, 0.65, '#7d6751');
          oval(22, -2, 4, 2, '#d6b76f');
          break;
        case 'boss-chest':
          chest();
          break;
        case 'mire-pool':
          pool();
          craftAt(-24, 0, 0.6, () => grassTuft(0, 4, true));
          craftAt(25, 2, 0.5, () => grassTuft(0, 4, true));
          break;
        case 'fish-rack':
        case 'drying-rack':
        case 'carcass-rack':
          for (const x of [-25, 25]) timber([x, 14], [x, -31], 4);
          timber([-28, -29], [28, -29], 4);
          for (const [x, y] of [
            [-16, -22],
            [0, -20],
            [16, -24],
          ]) {
            line(
              [
                [x, -29],
                [x, y],
              ],
              '#bda779',
              1,
            );
            if (kind === 'drying-rack') {
              shaped('#bdad86', () => {
                ctx.moveTo(x - 5, y);
                ctx.quadraticCurveTo(x, y + 3, x + 6, y);
                ctx.lineTo(x + 8, y + 19);
                ctx.quadraticCurveTo(x, y + 23, x - 7, y + 18);
              });
              line(
                [
                  [x - 2, y + 4],
                  [x - 3, y + 17],
                ],
                '#837d64',
                0.8,
              );
            } else {
              shaped(kind === 'carcass-rack' ? '#a47762' : '#93a28f', () => {
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + 9, y + 8, x + 4, y + 18);
                ctx.lineTo(x + 8, y + 24);
                ctx.lineTo(x - 2, y + 22);
                ctx.lineTo(x, y + 18);
                ctx.quadraticCurveTo(x - 8, y + 8, x, y);
              });
              line(
                [
                  [x - 3, y + 7],
                  [x + 3, y + 9],
                ],
                '#4b695f',
                0.8,
              );
              if (kind === 'fish-rack') oval(x, y + 5, 1, 1, '#384f48');
            }
          }
          break;
        case 'reed-nest':
        case 'mud-nest':
          nest(0, 4, 1.1, true);
          for (const x of [-23, 20]) craftAt(x, 3, 0.45, () => grassTuft(0, 4, true));
          break;
        case 'shell-hoard':
          for (const [x, y, r] of [
            [-15, 4, 9],
            [3, 7, 10],
            [15, 0, 7],
            [-2, -5, 7],
          ]) {
            shaped('#c5b992', () => {
              ctx.moveTo(x - r, y);
              ctx.quadraticCurveTo(x - r, y - r, x, y - r);
              ctx.quadraticCurveTo(x + r, y - r, x + r, y);
              ctx.lineTo(x + 2, y + 4);
              ctx.lineTo(x - 2, y + 4);
            });
            for (const dx of [-0.6, 0, 0.6])
              line(
                [
                  [x, y + 3],
                  [x + r * dx, y - r + 2],
                ],
                '#8d987d',
                0.8,
              );
          }
          break;
        case 'drift-seat':
          for (const side of [-1, 1]) {
            grownStem([side * 16, 0], [side * 21, 14], 6, '#92836b');
            grownStem([side * 17, 6], [side * 9, 14], 3, '#988a70');
          }
          shaped('#b4a183', () => {
            ctx.moveTo(-29, -3);
            ctx.quadraticCurveTo(-10, -9, 28, -5);
            ctx.lineTo(25, 2);
            ctx.quadraticCurveTo(-9, 5, -28, 3);
          });
          line(
            [
              [-21, -1],
              [-7, -3],
              [20, -2],
            ],
            '#786e57',
            1,
          );
          break;
        case 'silver-ore-face':
        case 'copper-ore-face':
          rockPiece(0, 7, 28, 40);
          for (const [x, y] of [
            [-15, -10],
            [1, -21],
            [11, -3],
          ]) {
            line(
              [
                [x - 5, y - 5],
                [x, y],
                [x - 3, y + 6],
                [x + 6, y + 10],
              ],
              kind === 'silver-ore-face' ? '#d2d4c0' : '#679782',
              3,
            );
            line(
              [
                [x - 5, y - 5],
                [x, y],
                [x - 3, y + 6],
                [x + 6, y + 10],
              ],
              kind === 'silver-ore-face' ? '#ecebd8' : '#c48a63',
              1.4,
            );
          }
          break;
        case 'copper-sort-samples':
        case 'silver-sort-samples':
        case 'silver-die-tray':
          boards(-27, -8, 54, 21, '#867050');
          for (const x of [-10, 9]) timber([x, -7], [x, 11], 2);
          for (const [x, y] of [
            [-20, 1],
            [-13, 6],
            [-3, 2],
            [6, 7],
            [17, 1],
            [23, 6],
          ]) {
            if (kind === 'copper-sort-samples')
              poly(
                [
                  [x - 4, y],
                  [x - 2, y - 4],
                  [x + 4, y - 2],
                  [x + 3, y + 4],
                ],
                '#ba8963',
              );
            else if (kind === 'silver-sort-samples' && x < 8)
              poly(
                [
                  [x - 4, y],
                  [x - 2, y - 4],
                  [x + 5, y - 4],
                  [x + 4, y + 2],
                ],
                '#b8c3b8',
              );
            else {
              oval(x, y, 4, 2.5, '#889890');
              oval(x, y - 1.4, 4, 2, '#d3d6bf');
            }
          }
          if (kind === 'silver-die-tray') {
            softRect(-8, -21, 12, 16, '#7a8d86', 2);
            oval(-2, -21, 6, 3, '#b5c1af');
            craftAt(-2, -21, 0.18, () => {
              face(0, 0, '#a7b4a6');
              royalCrown(-8);
            });
          }
          break;
        case 'silver-refining-hearth':
          hearth(true);
          bottle(24, 3, '#9caeaa', 0.6);
          break;
        case 'crown-coin-vault':
          boards(-31, -46, 62, 59, '#66553d');
          poly(
            [
              [31, -46],
              [39, -51],
              [39, 7],
              [31, 13],
            ],
            '#3f463e',
          );
          for (const y of [-31, -12, 7]) {
            rect(-28, y - 12, 55, 14, '#303d37');
            for (const x of [-18, 0, 18]) {
              for (let j = 0; j < 3; j++) {
                oval(x, y - j * 3, 6, 2.4, '#99aaa4');
                line(
                  [
                    [x - 4, y - j * 3],
                    [x + 3, y - j * 3],
                  ],
                  '#d0d5c1',
                  0.7,
                );
              }
            }
            timber([-31, y + 4], [31, y + 4], 3);
          }
          for (const x of [-24, 24])
            line(
              [
                [x, -44],
                [x, 11],
              ],
              '#7f8f87',
              3,
            );
          line(
            [
              [-27, -39],
              [27, 4],
            ],
            '#cab98c',
            1.5,
          );
          oval(8, -13, 4, 4, '#9b5550');
          paper(19, -32, 13);
          break;
        case 'treasury-audit-counter':
          table(68);
          paper(-14, -17, 23);
          line(
            [
              [-21, -16],
              [-7, -20],
            ],
            '#524e3d',
            1,
          );
          for (const x of [-25, 22]) {
            oval(x, -9, 7, 2.5, '#80958f');
            oval(x, -12, 7, 2.5, '#c6d0c1');
          }
          timber([12, -14], [12, -43], 2.5);
          line(
            [
              [-2, -36],
              [26, -40],
            ],
            '#a7b5aa',
            2,
          );
          for (const [x, y] of [
            [0, -35],
            [24, -39],
          ]) {
            line(
              [
                [x, y],
                [x - 6, y + 13],
                [x + 6, y + 13],
                [x, y],
              ],
              '#7e8c7e',
              1,
            );
            oval(x, y + 14, 7, 2, '#9aa99b');
          }
          softRect(-34, -8, 10, 12, '#b2a384', 1);
          oval(-29, -3, 2, 2, '#a45c51');
          break;
        case 'sealed-crown-consignment':
          chest(true, 0.9);
          break;
        case 'highland-pay-station':
          craftAt(0, -10, 0.7, () => {
            human('worker');
            grip(-10, 1);
            grip(10, 1);
          });
          table(55);
          paper(-6, -14, 20);
          for (const x of [-20, -12, 17]) {
            oval(x, -8, 4, 2, '#73878a');
            oval(x, -11, 4, 2, '#cbd6cf');
          }
          break;
        case 'ore-sorting-bay':
          table(58);
          sack(-22, 2, 0.7);
          sack(23, 4, 0.8);
          timber([0, -12], [0, -40], 3);
          line(
            [
              [-20, -34],
              [20, -39],
            ],
            '#a4ada0',
            3,
          );
          oval(0, -37, 2, 2, '#d6cca6');
          for (const [x, y] of [
            [-19, -16],
            [19, -21],
          ]) {
            line(
              [
                [x, -35],
                [x - 7, y],
                [x + 7, y],
                [x, -35],
              ],
              '#9f9d81',
              0.8,
            );
            rimBowl(x, y, 8, '#8c9990', '#727669');
            rockPiece(x, y - 2, 4, 4);
            if (region === 2)
              line(
                [
                  [x - 3, y - 5],
                  [x + 2, y - 1],
                ],
                x < 0 ? '#d0d8c9' : '#a77c5a',
                1.8,
              );
          }
          break;
        case 'mint-workbench':
          table(52);
          for (const x of [-17, 17]) timber([x, -12], [x, -42], 5);
          timber([-21, -42], [21, -42], 5);
          line(
            [
              [0, -48],
              [0, -18],
            ],
            '#8b9690',
            5,
          );
          for (let y = -44; y < -17; y += 4)
            line(
              [
                [-3, y],
                [3, y - 2],
              ],
              '#d0c9a9',
              1,
            );
          softRect(-9, -22, 18, 7, '#666f68', 1);
          oval(0, -13, 8, 3, '#b7c0ae');
          timber([-11, -47], [12, -47], 3);
          break;
        case 'caravan-loading-bay':
          cartBody(true);
          crateBody(-39, 14.85, 0.55);
          break;
        case 'mine-supports':
          for (const x of [-24, 24]) {
            timber([x, 14], [x, -40], 7);
            rockPiece(x, 13, 7, 6);
            timber([x, -20], [x * 0.55, -37], 4);
            softRect(x - 4, -35, 8, 4, '#606e68', 0.5);
          }
          timber([-29, -40], [29, -40], 8);
          break;
        case 'mine-old-markings':
          rockPiece(0, 8, 24, 30);
          line(
            [
              [-10, -9],
              [0, -21],
              [10, -9],
              [0, 2],
              [-10, -9],
            ],
            '#515e57',
            2.6,
          );
          line(
            [
              [-10, -10],
              [0, -22],
              [10, -10],
            ],
            '#abb69a',
            0.8,
          );
          line(
            [
              [-12, 6],
              [12, 5],
            ],
            '#5c7165',
            1.3,
          );
          break;
        case 'mine-collapse':
          for (const [x, y, w, h] of [
            [-21, 8, 15, 16],
            [4, 11, 19, 24],
            [24, 11, 12, 11],
            [-6, 1, 10, 27],
          ])
            rockPiece(x, y, w, h);
          timber([-28, -17], [5, 11], 5);
          timber([6, -12], [23, 7], 4);
          line(
            [
              [-27, -17],
              [-29, -23],
              [-24, -21],
            ],
            '#c4a67b',
            1.2,
          );
          break;
        case 'ridge-supper':
          table(54);
          for (const x of [-13, 6])
            restingObject(x, -8, 6, () => rimBowl(0, -10, 7, '#bebba0', '#946f50'));
          bottle(20, -15, '#7f9688', 0.8);
          softRect(-5.5, -12, 5, 3, '#c5a76c', 1.2);
          break;
        case 'ridge-game-corner':
        case 'game-table':
          ledgerDesk(false, true);
          if (kind === 'ridge-game-corner') {
            stool(-32, 6);
            stool(32, 5);
          }
          break;
        case 'ridge-study':
        case 'scribe-desk':
          ledgerDesk();
          if (kind === 'ridge-study') {
            boards(-20, 2, 18, 10, '#816647');
            oval(-11, 6, 1.4, 1.4, gold);
            restingObject(-17.5, -8, 4, () => {
              rimBowl(0, -10, 4, '#9a987d', '#665b41');
              softRect(-1.5, -26, 3, 15, '#d0bc8d', 1);
              flame(0, -27, 0.16);
            });
          }
          break;
        case 'ridge-bed':
          timber([-27, -19], [27, -19], 7);
          for (const x of [-27, 27]) timber([x, -24], [x, 15], 5);
          bed(false);
          line(
            [
              [-23, -17],
              [23, -17],
            ],
            '#c1ab7e',
            1.2,
          );
          break;
        case 'crag-rest':
          softRect(-29, -9, 58, 22, '#84736b', 7);
          softRect(-22, -7, 43, 15, '#a09479', 6);
          line(
            [
              [-21, -5],
              [-19, 4],
              [17, 6],
            ],
            '#c3b690',
            1.1,
          );
          rimBowl(29, 9, 9, '#8e9b92', '#8aa399');
          break;
        case 'ridge-hearth':
          hearth();
          break;
        case 'weapon-rack':
          rack();
          break;
        case 'tool-rack':
        case 'farm-tool-rack':
          rack(true, kind === 'farm-tool-rack');
          if (kind === 'farm-tool-rack')
            line(
              [
                [-20, -32],
                [-20, -26],
              ],
              '#b5bbae',
              1.5,
            );
          break;
        case 'stone-seat':
          blockwork(-23, -27, 46, 28, '#969e8c', 9);
          softRect(-24, -1, 48, 9, '#b3baa1', 2);
          for (const x of [-22, 14]) softRect(x, 3, 9, 14, '#899680', 1.8);
          for (const x of [-24, 17]) softRect(x, -11, 8, 21, '#a5ae96', 2);
          line(
            [
              [-15, -19],
              [15, -19],
            ],
            '#c6cbb0',
            1,
          );
          line(
            [
              [-10, -11],
              [8, -13],
            ],
            '#7b8e77',
            0.8,
          );
          break;
        case 'dark-throne':
          blockwork(-24, -38, 48, 49, '#595467', 10);
          softRect(-17, -34, 34, 24, '#745a78', 4);
          softRect(-17, -8, 34, 13, '#8c6d89', 4);
          for (const x of [-23, 23]) {
            softRect(x - 5, -17, 10, 27, '#8f8794', 2);
            line(
              [
                [x - 2, -15],
                [x - 2, 6],
              ],
              '#c4ad79',
              1,
            );
          }
          poly(
            [
              [-25, -38],
              [-29, -51],
              [-9, -46],
              [0, -59],
              [9, -46],
              [29, -51],
              [25, -38],
            ],
            gold,
          );
          poly(
            [
              [0, -32],
              [6, -24],
              [0, -17],
              [-6, -24],
            ],
            '#b28db9',
          );
          break;
        case 'war-table':
        case 'flight-planning-table':
          ledgerDesk(true);
          if (kind === 'flight-planning-table') {
            for (const x of [-11, 9])
              softPoly(
                [
                  [x, -21],
                  [x + 6, -15],
                  [x - 5, -16],
                ],
                '#aa91b3',
                0.7,
              );
          }
          break;
        case 'crown-levy-yard':
          craftAt(-15, 0, 0.8, () => cartBody(true));
          craftAt(31, -8, 0.6, () => ledgerDesk());
          craftAt(32, -4, 0.55, () => flag(true));
          break;
        case 'crown-command-post':
          blockwork(-32, 0, 64, 13, '#656471', 7);
          craftAt(-7, -6, 0.85, () => ledgerDesk(true));
          craftAt(31, -4, 0.7, () => flag(true));
          crateBody(-30, 0, 0.45);
          break;
        case 'ashbeast-roost-scene':
        case 'roost':
          rockPiece(-24, 5, 15, 28, true);
          rockPiece(24, 8, 18, 22, true);
          nest(0, 8, 1.1);
          for (const x of [-12, 6, 15])
            line(
              [
                [x - 1, 4],
                [x + 4, 7],
              ],
              '#4d4450',
              1.6,
            );
          break;
        case 'cindermaw-hoard-scene':
          rockPiece(-29, 8, 14, 28, true);
          rockPiece(29, 8, 12, 22, true);
          craftAt(-5, 0, 0.8, () => craftedDecoration('treasure-hoard'));
          crateBody(20, -5, 0.6);
          break;
        case 'cindermaw-ash-den':
          shaped('#756471', () => {
            ctx.moveTo(-37, 13);
            ctx.bezierCurveTo(-41, -14, -17, -34, 0, -29);
            ctx.bezierCurveTo(24, -35, 40, -10, 38, 13);
          });
          shaped('#312f35', () => {
            ctx.moveTo(-26, 12);
            ctx.bezierCurveTo(-29, -9, -14, -20, 1, -18);
            ctx.bezierCurveTo(19, -21, 28, -6, 27, 12);
          });
          rockPiece(-26, 6, 12, 16, true);
          rockPiece(29, 8, 10, 14, true);
          nest(0, 10, 0.9);
          break;
        case 'dreadmaw-vault-post':
          blockwork(-36, -20, 11, 34, '#5a5667');
          blockwork(25, -20, 11, 34, '#5a5667');
          craftAt(0, 3, 0.6, () => craftedDecoration('dark-brazier'));
          craftAt(28, -9, 0.6, () => flag(true));
          table(28);
          break;
        case 'crown-logistics-bay':
          craftAt(-13, 3, 0.8, () => tent(true));
          crateBody(-17, 0, 0.65);
          crateBody(20, 4, 0.7);
          line(
            [
              [-29, -1],
              [26, -8],
            ],
            '#c5b186',
            1.6,
          );
          break;
        case 'crown-fortress-checkpoint':
          for (const x of [-28, 28]) {
            blockwork(x - 4, -25, 8, 40, '#6c6b75');
            softRect(x - 5, -7, 10, 5, '#a5ac9e', 1);
          }
          timber([-28, -10], [28, -10], 6);
          line(
            [
              [-25, -13],
              [22, -7],
            ],
            '#c3af7c',
            2,
          );
          craftAt(25, -5, 0.65, () => flag(true));
          break;
        case 'citadel-muster':
          boards(-33, 5, 66, 9, '#6f6570', true);
          timber([-29, -18], [29, -18], 4);
          for (const x of [-22, 0, 22]) {
            timber([x, 7], [x, -20], 3);
            shield(x, -10, '#756275');
            line(
              [
                [x - 3, 11],
                [x + 4, 11],
              ],
              '#b8b29c',
              1.3,
            );
          }
          craftAt(-24, -14, 0.6, () => flag(true));
          break;
        case 'citadel-command':
          ledgerDesk(true);
          for (const x of [-33, 33]) {
            stool(x, 4);
            blockwork(x - 8, -17, 16, 16, '#6d6976', 8);
          }
          restingObject(33, 2, 9, () => crateBody(0, -5.85, 0.45));
          break;
        case 'citadel-ritual-array':
          for (const [x, y] of [
            [-24, 6],
            [0, -9],
            [24, 6],
          ]) {
            blockwork(x - 9, y - 3, 18, 9, '#686675', 5);
            oval(x, y - 4, 10, 4, '#96919c');
            poly(
              [
                [x, y - 12],
                [x + 4, y - 7],
                [x, y - 2],
                [x - 4, y - 7],
              ],
              '#6f597d',
            );
            line(
              [
                [x, y - 10],
                [x + 2, y - 7],
                [x, y - 4],
              ],
              '#b3a0ba',
              0.9,
            );
          }
          line(
            [
              [-19, 2],
              [0, -11],
              [19, 2],
            ],
            '#ab94b0',
            0.7,
          );
          break;
        case 'citadel-barracks-bay':
          craftAt(-20, -4, 0.6, () => bed());
          craftAt(20, 6, 0.6, () => bed());
          craftAt(27, -11, 0.45, () => craftedDecoration('armor'));
          break;
        case 'citadel-forge-bay':
          craftAt(-20, 1, 0.7, () => hearth(true, true));
          craftAt(24, 5, 0.6, () => table(44));
          softPoly(
            [
              [10, -14],
              [30, -14],
              [26, -8],
              [13, -7],
            ],
            '#919b94',
            1,
          );
          timber([20, -9], [20, 2], 4);
          bottle(29, -6, '#8ca298', 0.5);
          break;
        case 'citadel-vanity-quarters':
          table(70);
          softRect(-30, -43, 35, 29, '#a49388', 5);
          softRect(-26, -39, 27, 21, '#9eafb0', 3);
          line(
            [
              [-22, -36],
              [-11, -22],
            ],
            '#d8e2c9',
            2,
          );
          for (const [x, c, sc] of [
            [-27, '#c6b78e', 0.65],
            [-11, '#af818d', 0.75],
            [5, '#83a79f', 0.6],
          ])
            bottle(x, -11, c, sc);
          softRect(14, -11, 18, 5, '#dfd0b2', 2);
          line(
            [
              [17, -9],
              [29, -9],
            ],
            '#a1ab8a',
            0.7,
          );
          oval(22, -20, 8, 3, '#b79b6c');
          for (const x of [17, 20, 23, 26])
            line(
              [
                [x, -18],
                [x, -13],
              ],
              '#7f795d',
              0.8,
            );
          softPoly(
            [
              [30, -12],
              [37, -11],
              [39, 17],
              [31, 16],
            ],
            '#85677f',
            2,
          );
          line(
            [
              [33, -8],
              [35, 13],
            ],
            '#ba91a5',
            0.8,
          );
          break;
        case 'citadel-boss-approach':
          for (const side of [-1, 1]) {
            craftAt(side * 32, -5, 0.68, () => flag(true));
            craftAt(side * 23, 7, 0.55, () => craftedDecoration('dark-brazier'));
            shield(side * 36, 3, '#776174');
          }
          blockwork(-15, 8, 30, 7, '#686473', 7);
          break;
        case 'animal-pen':
          for (const x of [-29, 29]) timber([x, 14], [x, -13], 3);
          timber([-29, -8], [29, -8], 3);
          timber([-29, 4], [29, 4], 3);
          for (const [index, x] of [-9, 7].entries())
            ambientAt(x, 5, 0.48, index, () => {
              for (const dx of [-7, 7]) {
                line(
                  [
                    [dx, 0],
                    [dx, 9],
                  ],
                  '#5c6753',
                  3,
                );
                softRect(dx - 2, 8, 4, 3, '#3b493e', 1);
              }
              oval(0, -3, 14, 9, '#c1bea0');
              oval(11, -6, 7, 6, '#a79b7a');
              oval(14, -4, 4, 3, '#c9b694');
              oval(13, -9, 1, 1, '#38443b');
              softPoly(
                [
                  [7, -10],
                  [6, -15],
                  [11, -11],
                ],
                '#8b8f6e',
                1,
              );
            });
          break;
        case 'tax-post':
        case 'inspection-marker':
          timber([0, 15], [0, -35], 5);
          boards(-21, -35, 42, 27, '#796248');
          paper(-16, -32, 31);
          for (const [x, y] of [
            [-14, -30],
            [13, -30],
          ])
            oval(x, y, 1, 1, '#63533e');
          oval(9, -16, 3, 3, kind === 'inspection-marker' ? '#a45d58' : '#9c7762');
          break;
        case 'lean-to':
          for (const x of [-27, 27]) timber([x, 15], [x, -20], 4);
          timber([-27, -20], [27, -20], 4);
          shaped('#b09c74', () => {
            ctx.moveTo(-35, -19);
            ctx.quadraticCurveTo(-25, -27, -17, -39);
            ctx.lineTo(24, -36);
            ctx.quadraticCurveTo(28, -25, 35, -18);
            ctx.quadraticCurveTo(6, -12, -35, -19);
          });
          line(
            [
              [-26, -20],
              [-15, -35],
              [23, -33],
              [29, -19],
            ],
            '#d1bd92',
            1,
          );
          craftAt(0, 8, 0.7, () => craftedDecoration('sleep-roll'));
          break;
        case 'cookfire':
          craftAt(0, 7, 0.65, () => naturalLog(0, 0, 43, 8, true, false, false));
          craftAt(0, 11, 0.6, () => {
            ctx.rotate(-0.2);
            naturalLog(0, 0, 43, 8, true, false, false);
          });
          coals(0, 8, 0.8);
          flame(0, 4, 0.8);
          break;
        case 'sleep-roll':
          softRect(-27, -5, 54, 16, '#89957b', 6);
          oval(-22, 2, 7, 8, '#b2b397');
          oval(-22, 2, 3.5, 4, '#818e74');
          line(
            [
              [-20, -3],
              [20, -3],
            ],
            '#c2c4a1',
            1,
          );
          softRect(11, -5, 5, 17, '#6b624a', 1);
          line(
            [
              [-12, 4],
              [5, 5],
            ],
            '#657760',
            1.2,
          );
          break;
        // N1a civilian and institutional props retain their own readable
        // silhouettes; these don't change world collision or combat.
        case 'purchased-preserves':
          boards(-30, 0, 60, 12, '#8f7354', true);
          for (const [x, color] of [
            [-21, '#ae9568'],
            [-3, '#8eaa7b'],
            [15, '#b88767'],
          ]) {
            softRect(x, -22, 14, 20, color, 4);
            softRect(x - 1, -24, 16, 5, '#d7d1ad', 2);
            line(
              [
                [x + 2, -14],
                [x + 12, -14],
              ],
              '#f2e8cf',
              1.2,
            );
          }
          paper(26, 3, 16); // The grocer's paid receipt, not a stolen cache.
          break;
        case 'active-signal-beacon':
          blockwork(-30, 0, 60, 18, '#89918b', 6);
          timber([-24, -1], [-24, -70], 5);
          timber([24, -1], [24, -70], 5);
          boards(-30, -56, 60, 9, '#b9a68b', true);
          for (const x of [-13, 0, 13]) flame(x, -60, 0.85);
          // Signal faces remain bright even in daylight.
          line(
            [
              [-28, -46],
              [28, -46],
            ],
            '#e6c98a',
            2,
          );
          break;
        case 'crown-maintained-tools':
          rack(true);
          softRect(-24, -12, 48, 6, '#a7b4b2', 2);
          for (const x of [-17, 2, 18])
            line(
              [
                [x, -29],
                [x + 3, -9],
              ],
              '#dde1d2',
              2,
            );
          softRect(20, 4, 13, 8, '#cbb89d', 2);
          break;
        case 'scornfang-memoranda':
          boards(-31, 0, 62, 10, '#8c7056', true);
          for (const [x, y] of [
            [-22, -17],
            [-2, -25],
            [14, -13],
          ]) {
            softRect(x, y, 26, 19, '#ddd1b1', 2);
            line(
              [
                [x + 3, y + 6],
                [x + 19, y + 6],
              ],
              '#747b6b',
              1.1,
            );
            line(
              [
                [x + 3, y + 11],
                [x + 15, y + 11],
              ],
              '#747b6b',
              0.8,
            );
          }
          oval(12, 3, 6, 4, '#9d635a');
          break;
        case 'protected-ritual-furnishings':
          blockwork(-28, -2, 56, 21, '#919688', 6);
          softRect(-30, -17, 60, 10, '#aaad98', 4);
          softPoly(
            [
              [-20, -19],
              [-7, -35],
              [8, -25],
              [21, -19],
            ],
            '#b9a58c',
            1,
          );
          for (const x of [-24, 24]) {
            restingObject(x, -18, 4, () => rimBowl(0, -10, 5, '#c7bba3', '#7e7364'));
          }
          break;
        case 'stolen-goods':
          crateBody(-12, 2, 0.8);
          sack(16, 4, 0.9, '#b6a487');
          restingObject(-10, -13.6, 7, () => rimBowl(0, -10, 8, '#a8a88e', '#686d59'));
          softRect(14, -7, 8, 6, '#5c6b65', 1);
          break;
        case 'training-dummy':
          timber([0, 14], [0, -35], 5);
          timber([-21, -20], [21, -20], 5);
          softRect(-11, -27, 22, 23, '#b5a074', 5);
          oval(0, -37, 9, 9, '#baaa7a');
          for (const y of [-23, -16, -8])
            line(
              [
                [-10, y],
                [10, y],
              ],
              '#796c4e',
              1.7,
            );
          line(
            [
              [-4, -40],
              [3, -38],
            ],
            '#746344',
            1,
          );
          for (const x of [-7, 3])
            line(
              [
                [x, -20],
                [x + 5, -15],
              ],
              '#89774f',
              1.2,
            );
          break;
        case 'grave-marker':
          softPoly(
            [
              [-17, 14],
              [-17, -25],
              [-11, -35],
              [9, -35],
              [17, -26],
              [17, 14],
            ],
            '#939e89',
            1.3,
          );
          poly(
            [
              [17, -26],
              [21, -28],
              [21, 11],
              [17, 14],
            ],
            '#6c7e6c',
          );
          softRect(-12, -25, 24, 33, '#a5af96', 1);
          line(
            [
              [-6, -13],
              [6, -13],
            ],
            '#64785e',
            1.4,
          );
          line(
            [
              [0, -21],
              [0, -5],
            ],
            '#64785e',
            1.4,
          );
          line(
            [
              [-14, -25],
              [-11, -28],
            ],
            '#c9cbb0',
            1,
          );
          foliage(-7, 13, 11, 5, '#71895c');
          break;
        case 'pup-nest':
          nest(0, 6, 1.1);
          for (const [index, [x, y]] of [
            [-8, 3],
            [8, 4],
          ].entries())
            ambientAt(x, y, 0.6, index, () => {
              oval(0, 0, 11, 7, '#a38c69');
              oval(7, -3, 7, 6, '#b7a07a');
              oval(10, 0, 4, 3, '#d1bc94');
              softPoly(
                [
                  [4, -5],
                  [2, -11],
                  [9, -7],
                ],
                '#7c8067',
                2,
              );
              line(
                [
                  [7, -4],
                  [10, -3],
                ],
                '#405043',
                1,
              );
              oval(3, 6, 4, 2.5, '#bba67f');
            });
          break;
        case 'fishing-net':
          for (const x of [-28, 28]) timber([x, 13], [x, -28], 3);
          for (let j = 0; j < 5; j++) {
            ctx.strokeStyle = '#b1ab7e';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-27, -23 + j * 7);
            ctx.quadraticCurveTo(0, -12 + j * 7, 27, -23 + j * 7);
            ctx.stroke();
          }
          for (let x = -24; x < 26; x += 8) {
            line(
              [
                [x, -22],
                [x - 3, -5],
                [x + 1, 13],
              ],
              '#9c9f75',
              0.8,
            );
            oval(x + 1, 13, 1.8, 2.3, '#817f63');
          }
          line(
            [
              [-28, -25],
              [0, -20],
              [28, -25],
            ],
            '#bdae80',
            1.7,
          );
          break;
        case 'wallow':
          pool(false);
          for (const [x, y] of [
            [-15, 6],
            [4, 1],
            [17, 6],
          ]) {
            oval(x, y, 3, 2, '#786b52');
            line(
              [
                [x - 2, y - 2],
                [x - 1, y + 1],
              ],
              '#b09d79',
              0.8,
            );
          }
          break;
        case 'ore-cart':
          cartBody();
          for (const [x, y] of [
            [-18, -17],
            [0, -16],
            [18, -16],
          ]) {
            rockPiece(x, y, 10, 11);
            if (region === 2) {
              line(
                [
                  [x - 5, y - 6],
                  [x, y - 2],
                  [x + 4, y + 2],
                ],
                x < 0 ? '#bdc8bc' : '#6e9c83',
                1.8,
              );
              line(
                [
                  [x, y - 5],
                  [x + 4, y - 3],
                ],
                x < 0 ? '#dde1d0' : '#c08a63',
                1.1,
              );
            }
          }
          timber([-31, -13], [28, -13], 4, '#6f7d75');
          break;
        case 'ore-crane':
          timber([-24, 14], [-24, -41], 7);
          timber([-29, -41], [23, -41], 6);
          timber([-24, -14], [2, -40], 5);
          oval(18, -40, 5, 5, '#8d9a8d');
          oval(18, -40, 2, 2, '#46584e');
          line(
            [
              [18, -39],
              [18, -13],
            ],
            '#c6b58c',
            1.7,
          );
          rimBowl(18, -5, 11, '#7c8d80', '#737d6a');
          line(
            [
              [7, -5],
              [18, -16],
              [29, -5],
            ],
            '#adb39a',
            1.4,
          );
          softRect(-30, -13, 12, 13, '#72604a', 2);
          for (const y of [-10, -6, -2])
            line(
              [
                [-29, y],
                [-20, y + 1],
              ],
              '#c1a375',
              1.2,
            );
          break;
        case 'stone-marker':
          rockPiece(0, 9, 17, 9);
          rockPiece(-3, 0, 13, 10);
          rockPiece(1, -10, 9, 10);
          line(
            [
              [-6, -9],
              [4, -9],
            ],
            '#b7b8a0',
            0.8,
          );
          break;
        case 'field-kitchen':
          timber([-24, 14], [-15, -35], 4);
          timber([24, 14], [15, -35], 4);
          timber([-18, -35], [18, -35], 4);
          line(
            [
              [0, -35],
              [0, -19],
            ],
            '#7a8479',
            2,
          );
          rimBowl(0, -7, 18, '#606d65', '#a2986e');
          line(
            [
              [-17, -10],
              [-21, -15],
              [-21, -6],
            ],
            '#919e8f',
            1.5,
          );
          line(
            [
              [17, -10],
              [21, -15],
              [21, -6],
            ],
            '#919e8f',
            1.5,
          );
          flame(0, 10, 0.5);
          craftAt(29, 6, 0.5, () => table(30));
          break;
        case 'supply-stack':
          crateBody(-16, 5, 0.85);
          crateBody(15, 7, 0.7);
          fillOval(-8, -11.6, 12, 1.6, '#514732', 0.28);
          crateBody(-8, -20, 0.65);
          sack(29, 9, 0.65);
          line(
            [
              [-26, 6],
              [-8, -31],
              [27, 5],
            ],
            '#c4ae7d',
            1.4,
          );
          break;
        case 'command-tent':
          tent(true);
          craftAt(20, -29, 0.45, () => flag(true));
          break;
        case 'forge':
          hearth(true);
          craftAt(27, 7, 0.55, () => rack(true));
          break;
        case 'hatchery':
        case 'egg-cradle':
          nest(0, 6, 1.2);
          for (const [x, y, r] of [
            [-12, 0, 8],
            [3, -4, 10],
            [17, 3, 7],
          ]) {
            oval(x, y, r, r * 1.3, '#d4c9a2');
            fillOval(x - 2, y - 3, r * 0.35, r * 0.6, '#f0dec1', 0.5);
            for (const dx of [-2, 2]) fillOval(x + dx, y + dx, 1, 1.5, '#9d9d7e', 0.5);
          }
          if (kind === 'egg-cradle') for (const x of [-23, 23]) timber([x, 6], [x * 0.8, -8], 3);
          break;
        case 'scroll-stack':
          for (const [x, y, w] of [
            [-17, 6, 25],
            [-11, 0, 28],
            [2, -7, 22],
          ]) {
            softRect(x, y - 3, w, 7, '#d4c8a4', 3);
            oval(x, y, 3, 3.5, '#b7b18e');
            oval(x, y, 1.3, 1.8, '#777f68');
            line(
              [
                [x + w * 0.65, y - 3],
                [x + w * 0.65, y + 3],
              ],
              '#8b7655',
              1,
            );
          }
          paper(4, 7, 22);
          break;
        case 'ossuary':
          blockwork(-28, -8, 56, 23, '#82867a', 8);
          softRect(-23, -8, 46, 16, '#4c5b51', 1);
          for (const x of [-15, 0, 15]) {
            skull(x, -5, 5);
            for (const y of [5, 8])
              line(
                [
                  [x - 5, y],
                  [x + 6, y],
                ],
                bone,
                1.5,
              );
          }
          break;
        case 'ritual-table':
          blockwork(-22, -1, 10, 16, '#777e72');
          blockwork(12, -1, 10, 16, '#777e72');
          poly(
            [
              [-31, -11],
              [25, -11],
              [32, -4],
              [-31, -2],
            ],
            '#a1a58f',
          );
          boards(-31, -2, 63, 5, '#787f72', true);
          line(
            [
              [-18, -7],
              [0, -10],
              [18, -6],
              [0, -4],
              [-18, -7],
            ],
            '#52665d',
            1.2,
          );
          for (const x of [-24, 25]) {
            restingObject(x, -6, 3, () => {
              rimBowl(0, -10, 4, '#aaa48a', '#7c6b51');
              flame(0, -13, 0.2);
            });
          }
          poly(
            [
              [0, -10],
              [5, -7],
              [0, -4],
              [-5, -7],
            ],
            '#9d88ac',
          );
          break;
        case 'grave-lamp':
        case 'roadside-lantern':
          lantern(0, kind === 'roadside-lantern' ? -45 : -25);
          if (kind === 'roadside-lantern') timber([0, -12], [0, 15], 4, '#746c51');
          if (kind === 'grave-lamp') rockPiece(0, 12, 11, 9);
          break;
        case 'caretaker-table':
          table(45);
          softRect(-17, -16, 24, 7, '#646250', 1);
          paper(-14, -17, 20);
          restingObject(15, -8, 5, () => softRect(-5, -4, 10, 4, '#c3c3a4', 1.5));
          line(
            [
              [12, -10],
              [18, -9],
            ],
            '#829179',
            0.8,
          );
          break;
        case 'grass':
          grassTuft(0, 8, false);
          break;
        case 'wet-grass':
          fillOval(0, 8, 17, 3, '#517264', 0.18);
          grassTuft(0, 8, true);
          break;
        case 'bush':
          foliage(-9, 2, 15, 19, '#5d8053');
          foliage(10, 5, 16, 15, '#719258');
          grownStem([-2, 8], [-5, -5], 2);
          break;
        case 'marsh-bush':
          foliage(-9, 2, 15, 15, '#688669');
          foliage(11, 5, 15, 17, '#577d66');
          for (const x of [-16, -4, 13])
            line(
              [
                [x, -4],
                [x + 4, 10],
              ],
              '#799b7b',
              1.2,
            );
          break;
        case 'battlefield-poppies': {
          ctx.save();
          const patchScale = e.poppyScale || 1;
          ctx.scale(patchScale, patchScale);
          // Stable, irregular patches: loose stems, crescents and narrow verges.
          // Coordinates choose variety without animation or per-frame randomness.
          let seed =
            (Math.imul(Math.round(e.x || 7), 73856093) ^
              Math.imul(Math.round(e.y || 11), 19349663)) >>>
            0;
          const random = () => {
              seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
              return seed / 4294967296;
            },
            form = e.poppyForm ?? seed % 4,
            count = [3, 5, 7, 9][form],
            stems = [];
          for (let j = 0; j < count; j++) {
            const t = j / Math.max(1, count - 1),
              x =
                form === 1
                  ? -31 + t * 64 + (random() - 0.5) * 10
                  : form === 2
                    ? Math.cos(t * Math.PI * 1.2 + 0.1) * 27 + (random() - 0.5) * 7
                    : form === 3
                      ? (j % 2 ? 16 : -20) + (random() - 0.5) * 22
                      : (random() - 0.5) * 46,
              base =
                (random() - 0.5) * 10 +
                7 +
                (form === 2 ? Math.sin(t * Math.PI * 1.2 + 0.1) * 5 : 0),
              height = 9 + random() * 17,
              lean = (random() - 0.5) * 7;
            stems.push({ x, base, height, lean, size: 1.7 + random() * 1.25, tone: random() });
          }
          for (const stem of stems.sort((a, b) => a.base - b.base)) {
            const { x, base, height, lean, size, tone } = stem,
              y = base - height;
            oval(x, base + 1, 6 + size * 1.5, 2.2, '#64794b44');
            ctx.strokeStyle = '#607c4b';
            ctx.lineWidth = 1.15;
            ctx.beginPath();
            ctx.moveTo(x, base);
            ctx.quadraticCurveTo(x + lean * 0.3, base - height * 0.55, x + lean, y);
            ctx.stroke();
            line(
              [
                [x, base - 4],
                [x - 3, base - 7],
                [x - 1, base - 6],
              ],
              '#71854f',
              0.8,
            );
            const red = tone < 0.3 ? '#b93038' : tone < 0.7 ? '#cf3d40' : '#df5148';
            oval(x + lean - size * 0.7, y, size, size * 0.75, red);
            oval(x + lean + size * 0.7, y - 0.4, size, size * 0.9, red);
            oval(x + lean, y - size * 0.8, size * 0.9, size * 0.8, '#e45a4b');
            oval(x + lean, y + 0.2, 0.9, 0.85, '#34382d');
          }
          ctx.restore();
          break;
        }
        case 'pioneer-grasses':
          grassTuft(-11, 9, false, true);
          craftAt(12, 3, 0.7, () => grassTuft(0, 9, false));
          break;
        case 'pioneer-brush':
          grownStem([-12, 11], [-16, -7], 2);
          grownStem([10, 12], [17, -11], 2);
          foliage(-16, -5, 8, 7, '#829c6d');
          foliage(14, -8, 9, 8, '#718f65');
          rockPiece(0, 10, 8, 4, true);
          break;
        case 'regrowth-birch':
          tree('birch');
          break;
        case 'regrowth-willow':
          tree('willow');
          break;
        case 'mossy-basalt':
          rockPiece(0, 8, 27, 28, true);
          foliage(-16, 4, 9, 6, '#739269');
          foliage(6, -15, 8, 5, '#6e8d62');
          line(
            [
              [-12, 0],
              [3, -8],
              [10, -5],
            ],
            '#8d9f6e',
            1.2,
          );
          break;
        case 'wildflowers':
          for (const [x, y, c] of [
            [-18, -4, '#c9a8a8'],
            [-5, -13, '#e0cd95'],
            [9, -7, '#b0b9ce'],
            [21, 0, '#dfcfb2'],
          ]) {
            line(
              [
                [x - 3, 12],
                [x, y],
              ],
              '#758c62',
              1,
            );
            for (const [dx, dy] of [
              [-2, 0],
              [2, 0],
              [0, -2],
              [0, 2],
            ])
              fillOval(x + dx, y + dy, 1.8, 1.6, c);
            fillOval(x, y, 1, 1, '#ab9e66');
          }
          break;
        case 'fruit-tree':
          tree('fruit');
          break;
        case 'sapling':
          tree();
          break;
        case 'mangrove':
          tree('mangrove');
          break;
        case 'pine-sapling':
          tree('pine');
          break;
        case 'stump':
        case 'charred-stump':
          shaped(kind === 'stump' ? '#846348' : '#514b43', () => {
            ctx.moveTo(-17, 12);
            ctx.lineTo(-12, -15);
            ctx.lineTo(-5, -19);
            ctx.lineTo(2, -15);
            ctx.lineTo(12, -17);
            ctx.lineTo(16, 12);
            ctx.lineTo(7, 9);
            ctx.lineTo(0, 14);
            ctx.lineTo(-8, 10);
          });
          oval(0, -15, 12, 5, kind === 'stump' ? '#b89c6e' : '#71634f');
          oval(0, -15, 7, 3, kind === 'stump' ? '#ab8d60' : '#48483d');
          for (const x of [-9, -3, 7])
            line(
              [
                [x, -10],
                [x - 2, 9],
              ],
              kind === 'stump' ? '#594d37' : '#2f3830',
              1.2,
            );
          line(
            [
              [2, -18],
              [0, -15],
              [4, -12],
            ],
            '#645841',
            0.8,
          );
          break;
        case 'fallen-log':
        case 'burned-log':
          naturalLog(-3, 5, 54, 11, kind === 'burned-log');
          break;
        case 'woodpile':
          // Varied split billets touch and overlap, with solid pale end grain.
          fillOval(0, 12, 31, 4, '#4a4935', 0.22);
          splitFirewood(-13, 10, 36, -0.06);
          splitFirewood(14, 8, 29, 0.1);
          splitFirewood(-8, 2, 40, -0.04);
          splitFirewood(10, -1, 28, 0.06);
          splitFirewood(-2, -8, 33, -0.08);
          break;
        case 'reeds':
        case 'cattails':
          grassTuft(0, 11, true);
          for (const [x, y] of [
            [-14, -15],
            [0, -24],
            [13, -18],
          ]) {
            line(
              [
                [x - 2, 11],
                [x, y],
              ],
              '#7b9670',
              1.5,
            );
            if (kind === 'cattails') softRect(x - 2, y - 9, 4, 11, '#806c4c', 1.7);
          }
          break;
        case 'driftwood':
          naturalLog(0, 4, 55, 9, false, true);
          grownStem([10, 1], [21, -12], 3, '#b7a98b');
          break;
        case 'dock-post':
          timber([0, 15], [0, -26], 10, '#78684d');
          oval(0, -26, 5, 3, '#b5a076');
          for (const y of [-16, -12, -8])
            line(
              [
                [-5, y],
                [0, y + 2],
                [5, y],
              ],
              '#c7b48a',
              2,
            );
          fillOval(0, 9, 6, 4, '#476b5c', 0.3);
          break;
        case 'alpine-scrub':
          grownStem([-9, 9], [-16, -6], 2);
          grownStem([3, 10], [19, -7], 2);
          foliage(-14, 2, 11, 9, '#7d8e66');
          foliage(10, 4, 14, 10, '#697f5b');
          break;
        case 'heather':
          for (const [x, y] of [
            [-16, 0],
            [-3, -7],
            [12, -2],
          ]) {
            grownStem([x + 2, 12], [x, y - 7], 1.7);
            for (let z = 0; z < 4; z++) oval(x + (z % 2 ? 2 : -1), y - z * 3, 2, 1.5, '#a78eaa');
          }
          break;
        case 'rock-cluster':
        case 'black-rock':
          for (const [x, y, w, h] of [
            [-18, 8, 15, 14],
            [5, 9, 19, 26],
            [23, 11, 12, 12],
          ])
            rockPiece(x, y, w, h, kind === 'black-rock');
          break;
        case 'dead-tree':
        case 'dead-shrub':
        case 'dry-scrub':
          craftAt(0, 0, kind === 'dead-tree' ? 1 : kind === 'dead-shrub' ? 0.65 : 0.55, () => {
            if (kind === 'dead-tree' && region === 3) {
              const profile = frontierDeadTreeProfile(e);
              ctx.scale(profile.width, profile.height);
              ctx.rotate(profile.lean);
            }
            naturalTrunk(true);
          });
          break;
        case 'ash-patch':
        case 'scorched-floor':
          softPoly(
            [
              [-34, 3],
              [-21, -7],
              [-10, -5],
              [4, -11],
              [32, -4],
              [26, 9],
              [4, 12],
              [-14, 8],
            ],
            kind === 'ash-patch' ? '#969286' : '#655b58',
            4,
          );
          for (const [x, y] of [
            [-19, 0],
            [0, 5],
            [15, -1],
          ])
            line(
              [
                [x - 5, y],
                [x + 4, y - 2],
                [x + 8, y],
              ],
              kind === 'ash-patch' ? '#c0b6a0' : '#9f8170',
              1.1,
            );
          if (kind === 'ash-patch') rockPiece(-10, 3, 5, 4, true);
          break;
        case 'ember-pit':
          for (const [x, y] of [
            [-22, 4],
            [-13, 11],
            [5, 13],
            [22, 7],
          ])
            rockPiece(x, y, 7, 6);
          coals(0, 6);
          flame(2, 3, 0.6);
          break;
        case 'geothermal-heat-intake':
          blockwork(-33, 5, 66, 13, '#74786d', 8);
          softRect(-29, 2, 59, 5, '#4e5c56', 1);
          // Well casing and bolted cap rise out of the plinth.
          softRect(-23, -28, 11, 32, '#687f7e', 2);
          oval(-17.5, -28, 7, 3, '#a3b1a2');
          for (const y of [-24, -5]) softRect(-25, y, 15, 4, '#abb59e', 0.6);
          // Hot flow enters the exchanger; the return bends back into a second riser.
          line(
            [
              [-17, -19],
              [-6, -19],
              [-6, -10],
              [7, -10],
            ],
            '#3e5452',
            7,
          );
          line(
            [
              [-17, -19],
              [-6, -19],
              [-6, -10],
              [7, -10],
            ],
            '#b18b60',
            4.3,
          );
          line(
            [
              [20, -5],
              [30, -5],
              [30, 10],
            ],
            '#3e5452',
            6,
          );
          line(
            [
              [20, -5],
              [30, -5],
              [30, 10],
            ],
            '#8baba3',
            3.8,
          );
          for (const x of [-11, 1]) softRect(x - 1.5, -22, 3, 7, '#c4b18b', 0.5);
          // Handwheel sits on a real valve stem, above the inlet pipe.
          line(
            [
              [-7, -20],
              [-7, -30],
            ],
            '#83938c',
            2,
          );
          oval(-7, -31, 6, 2.7, '#8f5948');
          line(
            [
              [-12, -31],
              [-2, -31],
            ],
            '#c29a75',
            1,
          );
          line(
            [
              [-7, -33],
              [-7, -29],
            ],
            '#c29a75',
            1,
          );
          // Ribbed heat exchanger stands on two feet and has inlet/outlet connections.
          for (const x of [7, 21]) softRect(x, -1, 4, 7, '#3c504c', 0.5);
          softRect(4, -25, 22, 24, '#56716c', 2);
          for (const x of [8, 12, 16, 20])
            line(
              [
                [x, -22],
                [x, -5],
              ],
              '#9bab95',
              1.8,
            );
          softRect(3, -25, 24, 4, '#acb8a1', 0.6);
          softRect(3, -6, 24, 4, '#a4ad98', 0.6);
          // Pressure gauge and a narrow safety vent preserve the earlier machine silhouette.
          line(
            [
              [-18, -30],
              [-18, -37],
            ],
            '#aeb9a3',
            2,
          );
          oval(-18, -41, 5, 5, '#c2c5aa');
          oval(-18, -41, 3.6, 3.6, '#e0d8b6');
          line(
            [
              [-18, -41],
              [-16, -44],
            ],
            '#6a4f3c',
            0.9,
          );
          line(
            [
              [23, -25],
              [23, -35],
              [28, -35],
            ],
            '#9bac9d',
            2.5,
          );
          break;
        case 'thermal-flue':
          blockwork(-28, 1, 56, 12, '#74786f', 7);
          for (const [x, h] of [
            [-17, 28],
            [0, 42],
            [17, 33],
          ]) {
            softRect(x - 5, -h, 10, h + 3, '#78857c', 2);
            oval(x, -h, 6, 3, '#a2ad9a');
            oval(x, -h, 3, 1.5, '#3f4b45');
            line(
              [
                [x - 4, -h + 8],
                [x + 4, -h + 8],
              ],
              '#b7b59a',
              1.5,
            );
          }
          break;
        case 'crown-glass-kiln':
          hearth(true, true);
          timber([18, 11], [31, 11], 4);
          for (const x of [20, 29]) timber([x, 11], [x, 18], 3);
          craftAt(24, 7.3, 0.65, () => bottle(0, 0, '#9ebeb3'));
          break;
        case 'crown-ceramic-kiln':
          shaped('#9e8370', () => {
            ctx.moveTo(-27, 12);
            ctx.bezierCurveTo(-33, -11, -16, -34, 0, -33);
            ctx.bezierCurveTo(20, -35, 33, -9, 27, 12);
          });
          softRect(-15, -11, 30, 23, '#645449', 5);
          softRect(-10, -8, 20, 15, '#d69458', 3);
          line(
            [
              [-24, -3],
              [-16, -20],
              [0, -27],
              [16, -20],
              [24, -3],
            ],
            '#be9e7f',
            1.4,
          );
          for (const x of [24, 33]) rimBowl(x, 9, 6, '#b7a28a', '#796751');
          break;
        case 'heat-distribution-post':
          blockwork(-25, 3, 50, 11, '#72786f');
          line(
            [
              [-28, -13],
              [28, -13],
            ],
            '#657970',
            9,
          );
          line(
            [
              [-28, -15],
              [28, -15],
            ],
            '#a9b09a',
            1.3,
          );
          for (const x of [-18, 0, 18]) {
            softRect(x - 4, -20, 8, 15, '#8d9b8c', 2);
            oval(x, -25, 6, 3, '#a99e7e');
            line(
              [
                [x, -22],
                [x, -16],
              ],
              '#6d745e',
              2,
            );
            line(
              [
                [x - 3, -25],
                [x + 3, -25],
              ],
              '#5b6458',
              1,
            );
          }
          for (const x of [-18, 0, 18])
            line(
              [
                [x, -5],
                [x, 4],
              ],
              '#7b9180',
              4,
            );
          break;
        case 'heated-drying-shed':
          for (const x of [-27, 27]) timber([x, 14], [x, -36], 4);
          boards(-30, -39, 60, 6, '#71624c', true);
          line(
            [
              [-25, -27],
              [25, -27],
            ],
            '#beb08a',
            1.6,
          );
          for (const x of [-15, 1, 16])
            softPoly(
              [
                [x - 5, -24],
                [x + 5, -24],
                [x + 7, 1],
                [x + 1, 4],
                [x - 6, 0],
              ],
              '#b5b39a',
              2,
            );
          line(
            [
              [-23, 9],
              [24, 9],
            ],
            '#7d9a8d',
            5,
          );
          for (const x of [-20, 20]) softRect(x - 3, 5, 6, 9, '#b2b6a1', 1);
          break;
        case 'heated-washhouse':
          blockwork(-28, 2, 56, 12, '#858d80');
          rimBowl(0, 1, 25, '#b2b6a0', '#79a99d');
          line(
            [
              [21, -21],
              [21, -7],
              [14, -7],
            ],
            '#8b9c8f',
            4,
          );
          line(
            [
              [14, -7],
              [14, -1],
            ],
            '#bad6c3',
            1.4,
          );
          softRect(-28, -13, 15, 8, '#d4d0b3', 2);
          line(
            [
              [-26, -9],
              [-15, -9],
            ],
            '#96a58c',
            1,
          );
          timber([-29, -5], [-12, -5], 3, '#9ca58c');
          timber([-24, -5], [-24, 7], 2.5, '#929e86');
          break;
        case 'fumarole':
          rockPiece(0, 10, 24, 12, true);
          oval(0, 4, 11, 4, '#40454a');
          ctx.save();
          ctx.globalAlpha = 0.4;
          for (const [x, y] of [
            [-9, -3],
            [4, -15],
            [0, -29],
          ]) {
            ctx.strokeStyle = '#c3d2c7';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.bezierCurveTo(x - 12, y - 4, x + 13, y - 10, x + 1, y - 18);
            ctx.stroke();
          }
          ctx.restore();
          break;
        case 'obsidian':
          rockPiece(0, 9, 18, 48, true);
          shaped(
            '#a09aa7',
            () => {
              ctx.moveTo(-4, -30);
              ctx.quadraticCurveTo(-12, -16, -5, -4);
              ctx.quadraticCurveTo(-8, -20, -4, -30);
            },
            0.5,
          );
          line(
            [
              [0, -37],
              [7, -23],
              [4, -11],
            ],
            '#b2a5b2',
            0.9,
          );
          break;
        case 'market':
          for (const x of [-28, 28]) timber([x, 15], [x, -34], 4);
          shaped('#b3a17a', () => {
            ctx.moveTo(-35, -28);
            ctx.lineTo(-24, -40);
            ctx.lineTo(25, -40);
            ctx.lineTo(35, -28);
            ctx.quadraticCurveTo(24, -20, 13, -26);
            ctx.quadraticCurveTo(0, -19, -12, -26);
            ctx.quadraticCurveTo(-26, -19, -35, -28);
          });
          table(55);
          for (const [x, c] of [
            [-16, '#9da771'],
            [0, '#ba9865'],
            [16, '#ac7862'],
          ]) {
            restingObject(x, -8, 6, () => rimBowl(0, -10, 7, '#9e8963', c));
            for (const dx of [-3, 3]) oval(x + dx, -20, 2.5, 2.5, c);
          }
          break;
        case 'laundry':
          for (const x of [-30, 30]) timber([x, 14], [x, -31], 3);
          ctx.strokeStyle = '#b6ab83';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-30, -28);
          ctx.quadraticCurveTo(0, -16, 30, -28);
          ctx.stroke();
          for (const [x, h, c] of [
            [-14, 27, '#b6c2ab'],
            [10, 21, '#b2839f'],
          ]) {
            shaped(c, () => {
              ctx.moveTo(x - 7, -23);
              ctx.lineTo(x + 8, -23);
              ctx.quadraticCurveTo(x + 5, -12, x + 9, -23 + h);
              ctx.quadraticCurveTo(x, -20 + h, x - 8, -23 + h);
              ctx.quadraticCurveTo(x - 5, -12, x - 7, -23);
            });
            line(
              [
                [x, -19],
                [x - 2, -26 + h],
              ],
              x > 0 ? '#805d7b' : '#6e8277',
              1,
            );
            for (const dx of [-5, 5]) softRect(x + dx - 1, -25, 2, 6, '#9c8156', 0.4);
          }
          break;
        case 'well':
          blockwork(-24, -4, 48, 20, '#929989', 7);
          oval(0, -4, 25, 9, '#b6b8a1');
          oval(0, -5, 17, 5, '#3e5c54');
          for (const x of [-25, 25]) timber([x, 8], [x, -35], 5);
          line(
            [
              [-24, -20],
              [24, -20],
            ],
            '#8b6c47',
            6,
          );
          line(
            [
              [0, -20],
              [0, -3],
            ],
            '#c5ad79',
            1.5,
          );
          softPoly(
            [
              [-30, -35],
              [0, -51],
              [31, -35],
              [26, -30],
              [-27, -30],
            ],
            '#8d7351',
            1.5,
          );
          rimBowl(20, 8, 7, '#88764f', '#5c705c');
          line(
            [
              [14, 7],
              [20, -1],
              [26, 7],
            ],
            '#a99c74',
            1.2,
          );
          break;
        case 'barrel':
          shaped('#95754c', () => {
            ctx.moveTo(-13, -23);
            ctx.quadraticCurveTo(-22, -5, -15, 13);
            ctx.quadraticCurveTo(0, 20, 15, 13);
            ctx.quadraticCurveTo(22, -5, 13, -23);
          });
          oval(0, -23, 13, 5, '#bc9e6b');
          for (const x of [-8, 0, 8]) {
            ctx.strokeStyle = '#604e34';
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(x, -19);
            ctx.quadraticCurveTo(x * 1.3, -2, x, 13);
            ctx.stroke();
          }
          for (const y of [-14, 7]) {
            line(
              [
                [-16, y],
                [0, y + 3],
                [16, y],
              ],
              '#626e65',
              4,
            );
            line(
              [
                [-15, y - 1],
                [0, y + 1],
                [15, y - 1],
              ],
              '#b3b7a0',
              0.9,
            );
          }
          oval(10, -3, 2.5, 2.5, '#67593d');
          line(
            [
              [-10, -24],
              [10, -24],
            ],
            '#715c3d',
            0.8,
          );
          break;
        case 'cart':
          cartBody();
          break;
        case 'ration':
          sack(-17, 6, 0.9);
          softRect(-1, -9, 25, 20, '#c9b996', 5);
          line(
            [
              [2, -7],
              [19, 9],
            ],
            '#88704d',
            1.3,
          );
          softRect(9, -10, 4, 22, '#8d7955', 1);
          oval(16, -7, 6, 3, '#b9945c');
          break;
        case 'hay-rick':
          shaped('#b5a06b', () => {
            ctx.moveTo(-29, 12);
            ctx.bezierCurveTo(-30, -4, -15, -30, 0, -30);
            ctx.bezierCurveTo(17, -28, 28, -6, 29, 12);
            ctx.quadraticCurveTo(0, 19, -29, 12);
          });
          for (let x = -24; x < 26; x += 5)
            line(
              [
                [x * 0.3, -22 + Math.abs(x) * 0.25],
                [x, 11],
                [x + 2, 13],
              ],
              '#d4bd83',
              1,
            );
          line(
            [
              [-25, 4],
              [0, 8],
              [25, 4],
            ],
            '#7e7952',
            1.6,
          );
          break;
        case 'furrow-plot':
        case 'garden':
          softPoly(
            [
              [-32, 1],
              [-7, -13],
              [33, -3],
              [8, 14],
            ],
            '#8c7a56',
            3,
          );
          for (const y of [-3, 3, 9])
            line(
              [
                [-23 + y, -3 + y],
                [18 + y, -8 + y],
              ],
              '#665f42',
              2.5,
            );
          for (const [x, y] of [
            [-20, 0],
            [-8, -5],
            [2, 6],
            [13, 1],
            [23, -4],
          ]) {
            foliage(x, y, 5, 6, kind === 'garden' ? '#73925f' : '#87985e');
          }
          break;
        case 'pasture-sheep':
          for (const [index, [x, y, sc]] of [
            [-13, 2, 1],
            [18, -2, 0.78],
          ].entries())
            ambientAt(x, y, sc, index, () => {
              for (const dx of [-9, 8]) {
                line(
                  [
                    [dx, 0],
                    [dx, 10],
                  ],
                  '#857f68',
                  3,
                );
                softRect(dx - 2, 8, 4, 4, '#4c5648', 1);
              }
              oval(0, -5, 16, 11, '#b9bda4');
              for (const [a, b] of [
                [-11, -9],
                [0, -14],
                [11, -9],
                [-7, -1],
                [7, -1],
              ])
                oval(a, b, 7, 6, '#d2ceb0');
              oval(16, -5, 7, 7, '#7b7e65');
              softPoly(
                [
                  [11, -9],
                  [8, -13],
                  [15, -11],
                ],
                '#777a60',
                1.5,
              );
              oval(18, -7, 1.2, 1.2, '#283d33');
            });
          break;
        case 'poultry-yard':
          for (const [index, [x, y, sc]] of [
            [-19, 4, 1],
            [11, 8, 0.86],
            [19, -10, 0.78],
          ].entries())
            ambientAt(x, y, sc, index, () => {
              for (const dx of [-3, 4])
                line(
                  [
                    [dx, 2],
                    [dx, 10],
                    [dx + 3, 11],
                  ],
                  '#b29b64',
                  1.5,
                );
              oval(0, -4, 11, 8, '#c4b78e');
              oval(-3, -3, 7, 5, '#a29871');
              oval(9, -10, 6, 6, '#d2c298');
              poly(
                [
                  [14, -11],
                  [20, -8],
                  [14, -7],
                ],
                '#c6a05e',
              );
              oval(10, -12, 1.1, 1.1, '#354b3c');
              for (const dx of [-1, 2, 5]) oval(8 + dx, -16, 2.2, 2.8, '#ab6658');
              shaped('#a39166', () => {
                ctx.moveTo(-9, -5);
                ctx.quadraticCurveTo(-20, -14, -14, -16);
                ctx.lineTo(-4, -9);
              });
            });
          break;
        case 'feed-trough':
        case 'feeding-trough':
          for (const x of [-22, 22]) timber([x, 6], [x, 15], 4);
          boards(-29, -6, 58, 16, '#94754f', true);
          poly(
            [
              [-29, -6],
              [-20, -12],
              [32, -12],
              [29, -6],
            ],
            '#ba9b6b',
          );
          softRect(-23, -7, 48, 7, '#514f37', 2);
          for (const [x, y] of [
            [-16, -6],
            [-3, -5],
            [11, -7],
            [20, -5],
          ]) {
            if (kind === 'feed-trough')
              line(
                [
                  [x - 3, y],
                  [x + 4, y + 1],
                ],
                '#c1b177',
                1.5,
              );
            else
              softPoly(
                [
                  [x - 5, y],
                  [x - 2, y - 5],
                  [x + 4, y - 4],
                  [x + 5, y + 1],
                ],
                '#a58768',
                1.5,
              );
          }
          break;
        case 'watchpost':
          // A compact four-foot tower: continuous ladder, load-bearing braces,
          // guarded platform and a small roof, all within the old footprint.
          fillOval(0, 15, 36, 11, '#171b1b', 0.25);
          for (const [x, y] of [
            [-24, 9],
            [18, 15],
            [-13, -3],
            [29, 2],
          ]) {
            softPoly(
              [
                [x - 5, y - 2],
                [x + 4, y - 4],
                [x + 7, y + 1],
                [x - 3, y + 4],
              ],
              '#77786d',
              1,
            );
            timber([x, y - 1], [x, -40 + (y - 9)], 5);
          }
          timber([-23, 7], [18, -29], 3);
          timber([-23, -28], [18, 12], 3);
          timber([19, 11], [29, -43], 3);
          softPoly(
            [
              [-31, -34],
              [11, -43],
              [36, -33],
              [-7, -22],
            ],
            '#5c4c37',
            1.5,
          );
          for (let j = 0; j < 6; j++)
            timber([-27 + j * 7, -33 - j * 1.3], [-5 + j * 7, -25 - j * 1.3], 2);
          for (const [x, y] of [
            [-28, -35],
            [10, -44],
            [32, -35],
            [-6, -24],
          ])
            timber([x, y], [x, y - 12], 3);
          timber([-28, -47], [10, -56], 3);
          timber([10, -56], [32, -47], 3);
          timber([-28, -47], [-6, -36], 3);
          timber([-6, -36], [32, -47], 3);
          // Ladder rails run from the ground to the platform's access corner.
          timber([3, 16], [-2, -24], 2.6);
          timber([14, 13], [9, -27], 2.6);
          for (let j = 0; j < 8; j++)
            timber([3 - j * 0.65, 13 - j * 4.5], [14 - j * 0.65, 10 - j * 4.5], 1.8);
          for (const [x, y] of [
            [-28, -47],
            [10, -56],
            [32, -47],
            [-6, -36],
          ])
            timber([x, y], [x, y - 15], 2.8);
          softPoly(
            [
              [-34, -61],
              [5, -76],
              [38, -60],
              [0, -48],
            ],
            '#695b49',
            1.3,
          );
          softPoly(
            [
              [-34, -61],
              [0, -48],
              [0, -44],
              [-34, -57],
            ],
            '#8d7957',
            1,
          );
          softPoly(
            [
              [0, -48],
              [38, -60],
              [38, -56],
              [0, -44],
            ],
            '#4e4538',
            1,
          );
          timber([5, -76], [0, -48], 1.3);
          break;
        case 'crown-orrery':
          fillOval(0, 14, 74, 24, '#171522', 0.24);
          softPoly(
            [
              [-66, 0],
              [0, -22],
              [66, 0],
              [0, 24],
            ],
            '#92869b',
            2,
          );
          softPoly(
            [
              [-66, 0],
              [0, 24],
              [0, 32],
              [-66, 8],
            ],
            '#51495f',
            1.2,
          );
          softPoly(
            [
              [0, 24],
              [66, 0],
              [66, 8],
              [0, 32],
            ],
            '#393646',
            1.2,
          );
          softPoly(
            [
              [-49, -7],
              [0, -23],
              [49, -7],
              [0, 10],
            ],
            '#b4a6b2',
            1.5,
          );
          softPoly(
            [
              [-24, -10],
              [-24, -53],
              [0, -63],
              [25, -53],
              [25, -10],
              [0, -1],
            ],
            '#65576e',
            2,
          );
          softPoly(
            [
              [0, -63],
              [25, -53],
              [25, -10],
              [0, -1],
            ],
            '#453e53',
            1.2,
          );
          for (const x of [-17, 17])
            line(
              [
                [x, -14],
                [x, -49],
              ],
              '#c1a168',
              2,
            );
          rect(-9, -36, 18, 17, '#393543');
          poly(
            [
              [-6, -30],
              [-4, -35],
              [0, -32],
              [4, -35],
              [6, -30],
              [5, -26],
              [-5, -26],
            ],
            '#d3b574',
          );
          fillOval(0, -61, 34, 10, '#c1a168', 1);
          // Bronze astronomical rings, with a single clear silhouette.
          for (const [rx, ry, angle] of [
            [47, 24, -0.55],
            [25, 48, 0.35],
            [47, 42, 0.2],
          ]) {
            ctx.save();
            ctx.translate(0, -102);
            ctx.rotate(angle);
            ctx.strokeStyle = '#58452e';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#c9ac71';
            ctx.lineWidth = 2.6;
            ctx.stroke();
            ctx.restore();
          }
          fillOval(0, -102, 14, 14, '#6a597f', 1);
          fillOval(-4, -107, 7, 6, '#b4a3c6', 0.8);
          line(
            [
              [-22, -57],
              [23, -146],
            ],
            '#d7b777',
            3,
          );
          fillOval(24, -148, 4, 4, '#f2d99d', 1);
          for (const [x, y] of [
            [-43, -115],
            [39, -83],
            [-11, -146],
          ])
            fillOval(x, y, 3, 3, '#e4ca8c', 1);
          break;
        case 'barricade':
        case 'replacement-stakes':
          for (const [x, h] of [
            [-26, 28],
            [-13, 34],
            [1, 29],
            [14, 37],
            [27, 31],
          ]) {
            poly(
              [
                [x - 3, 13],
                [x - 3, 13 - h],
                [x, 7 - h],
                [x + 4, 12 - h],
                [x + 4, 13],
              ],
              kind === 'replacement-stakes' ? '#b29466' : '#806d50',
            );
            line(
              [
                [x, 11 - h],
                [x + 1, 10],
              ],
              '#c5ab79',
              0.9,
            );
            fillOval(x + 1, 13, 6, 2, '#6d7358', 0.25);
          }
          if (kind === 'barricade') {
            timber([-31, -2], [31, 4], 5);
            for (const x of [-24, 0, 24])
              line(
                [
                  [x - 3, -5],
                  [x + 3, 5],
                ],
                '#c7b184',
                2,
              );
            timber([-24, 3], [-35, 16], 4);
          }
          break;
        case 'road-ruts':
          for (const y of [-3, 7]) {
            line(
              [
                [-33, y],
                [-18, y + 1],
                [-4, y - 2],
                [12, y],
                [31, y - 1],
              ],
              '#847455',
              2.5,
            );
            line(
              [
                [-32, y + 2],
                [-15, y + 3],
                [4, y],
                [29, y + 1],
              ],
              '#b1a27b',
              0.9,
            );
          }
          break;
        case 'road-patch':
          softPoly(
            [
              [-31, 3],
              [-18, -8],
              [-3, -5],
              [13, -10],
              [30, 1],
              [16, 10],
              [-8, 12],
            ],
            '#9b8e6c',
            4,
          );
          for (const [x, y] of [
            [-20, 1],
            [-10, 5],
            [3, -3],
            [15, 2],
            [5, 8],
          ]) {
            fillOval(x, y, 1.9, 1, '#b9ab87');
          }
          line(
            [
              [-23, 3],
              [-5, 1],
              [18, 3],
            ],
            '#b5a781',
            1,
          );
          break;
        case 'stacked-lumber':
          for (const [x, y, w] of [
            [-7, 8, 51],
            [2, 2, 55],
            [-5, -4, 48],
          ]) {
            boards(x - w / 2, y - 5, w, 7, '#a8895b', true);
            poly(
              [
                [x + w / 2, y - 5],
                [x + w / 2 + 4, y - 8],
                [x + w / 2 + 4, y - 1],
                [x + w / 2, y + 2],
              ],
              '#d1b685',
            );
            line(
              [
                [x + w / 2 + 1, y - 5],
                [x + w / 2 + 3, y - 4],
              ],
              '#8f7850',
              0.7,
            );
          }
          for (const x of [-14, 14])
            line(
              [
                [x, -9],
                [x, 12],
              ],
              '#685f46',
              2.5,
            );
          break;
        case 'repair-brace':
          timber([-21, 15], [-21, -31], 7);
          timber([22, 15], [22, -31], 7);
          timber([-24, -31], [25, -31], 7);
          timber([-20, 12], [20, -28], 6);
          for (const x of [-20, 20]) softRect(x - 4, -23, 8, 4, '#8c9685', 1);
          break;
        case 'broken-cart':
          timber([-28, 2], [10, 13], 5, '#665b43');
          craftAt(-24, 15, 1, () => {
            ctx.rotate(-0.3);
            ctx.scale(1, 0.65);
            wheel(0, 0, 12, true);
          });
          wheel(22, 10, 10);
          softPoly(
            [
              [-30, -15],
              [-7, -16],
              [-3, -7],
              [4, -12],
              [28, -14],
              [27, 7],
              [2, 7],
              [-4, 3],
              [-8, 9],
              [-27, 6],
            ],
            '#8f704d',
            0.7,
          );
          line(
            [
              [-26, -10],
              [-9, -10],
            ],
            '#c7a673',
            1,
          );
          line(
            [
              [5, -8],
              [24, -9],
            ],
            '#c7a673',
            1,
          );
          line(
            [
              [-7, -12],
              [-1, -3],
              [-8, 7],
            ],
            '#4d4b37',
            2,
          );
          timber([-20, -8], [11, 14], 4, '#bc9d6b');
          timber([13, 7], [35, 17], 3, '#8b7150');
          timber([27, -8], [44, 2], 4);
          break;
        case 'wagon-wheel':
          wheel(0, 0, 23);
          line(
            [
              [-17, -13],
              [-14, -16],
            ],
            '#c7b082',
            1.3,
          );
          break;
        case 'charred-foundation':
          for (const [a, b] of [
            [
              [-31, -3],
              [7, -14],
            ],
            [
              [7, -14],
              [31, 0],
            ],
            [
              [31, 0],
              [-5, 14],
            ],
            [
              [-5, 14],
              [-31, -3],
            ],
          ]) {
            timber(a, b, 6, '#575046');
            rockPiece(a[0], a[1], 5, 5, true);
          }
          softPoly(
            [
              [-21, 0],
              [3, -7],
              [22, 1],
              [-3, 10],
            ],
            '#827c6c',
            3,
          );
          break;
        case 'patched-fence':
          for (const x of [-25, 0, 25]) timber([x, 14], [x, -23], 4, '#76644b');
          timber([-28, -13], [29, -13], 4, '#786a52');
          timber([-28, 2], [29, 2], 4, '#786a52');
          timber([-15, -17], [14, 8], 5, '#ba9c6b');
          for (const [x, y] of [
            [-12, -14],
            [10, 5],
          ])
            oval(x, y, 1, 1, '#505a49');
          break;
        case 'checkpoint-standard':
          flag(false);
          softRect(-22, 11, 10, 5, '#727b6a', 1);
          break;
        case 'chain-anchor':
          rockPiece(-17, 5, 15, 26, true);
          oval(-14, -2, 7, 5, '#96a095');
          oval(-14, -2, 3, 2, '#4a5b51');
          chainLinks(-9, 4, 7);
          break;
        case 'royal-launch-platform':
          boards(-36, -1, 72, 13, '#817358');
          poly(
            [
              [-36, -1],
              [-15, -14],
              [40, -14],
              [36, -1],
            ],
            '#b1a179',
          );
          for (const x of [-25, 24]) {
            timber([x, 10], [x, 24], 7);
            timber([x, 20], [x * 0.4, 9], 4);
            oval(x, -2, 5, 3, '#a4b0a1');
            oval(x, -2, 2, 1, '#54665c');
          }
          line(
            [
              [-31, 0],
              [31, 0],
            ],
            '#d0b987',
            1.3,
          );
          for (const x of [-25, -13, -1, 11, 23])
            line(
              [
                [x + 13, -12],
                [x, -2],
              ],
              '#72694f',
              0.8,
            );
          break;
        case 'handler-station':
          ledgerDesk();
          for (const x of [-25, 25]) {
            timber([x, 11], [x, -30], 3);
            line(
              [
                [x, -26],
                [x + 3, -26],
                [x + 3, -20],
              ],
              '#9ca695',
              1.5,
            );
          }
          sack(24, 10, 0.65, '#947c5b');
          break;
        case 'feed-crate':
          crateBody(0, 2, 1.1);
          softRect(-19, -16, 37, 12, '#5c6047', 2);
          sack(-9, -10, 0.7);
          sack(11, -8, 0.65);
          for (const x of [-17, 0, 17])
            line(
              [
                [x, -10],
                [x + 6, -7],
              ],
              '#c2ad75',
              1,
            );
          break;
        case 'containment-post':
          blockwork(-12, 6, 24, 10, '#6f796e');
          softRect(-7, -35, 14, 44, '#697b76', 2);
          for (const y of [-28, -11, 4]) {
            softRect(-11, y, 22, 6, '#a5afa0', 1);
            for (const x of [-7, 7]) oval(x, y + 3, 1.2, 1.2, '#5d6f65');
          }
          oval(4, -17, 5, 4, '#b0b8a6');
          chainLinks(7, -15, 4);
          break;
        case 'claw-scrape':
          for (const [y, left, right] of [
            [-5, -28, 25],
            [3, -25, 29],
            [11, -23, 23],
          ]) {
            shaped(
              '#695953',
              () => {
                ctx.moveTo(left, y + 2);
                ctx.quadraticCurveTo(0, y - 1, right, y - 5);
                ctx.lineTo(right - 5, y - 2);
                ctx.quadraticCurveTo(0, y + 2, left, y + 2);
              },
              0.4,
            );
            line(
              [
                [left + 7, y + 3],
                [3, y],
                [right - 4, y - 2],
              ],
              '#b19479',
              0.7,
            );
          }
          break;
        case 'dragon-perch':
          rockPiece(0, 8, 38, 36, true);
          rockPiece(-24, 10, 18, 13, true);
          rockPiece(25, 10, 17, 17, true);
          for (const x of [-13, 1, 12])
            line(
              [
                [x - 3, -4],
                [x + 3, 1],
              ],
              '#443e4a',
              1.7,
            );
          line(
            [
              [-25, -7],
              [-7, -17],
              [15, -12],
            ],
            '#9c8f9e',
            1.4,
          );
          break;
        default:
          return false;
      }
      return true;
    }

    function decoration(kind) {
      craftedDecoration(kind);
    }

    function landmark() {
      if (craftedLandmark()) return;
      switch (e.id) {
        case 'orchard':
          for (const x of [-18, 0, 18]) {
            rect(x - 2, -9, 4, 21, '#76573d');
            oval(x, -18, 10, 8, '#58794f');
            glint(x + 3, -18, '#cf8a67', 1.6);
          }
          line(
            [
              [-30, 12],
              [30, 12],
            ],
            '#8f7656',
            2,
          );
          break;
        case 'den-ruins':
          rect(-24, -12, 15, 26, '#878b80');
          rect(8, -22, 17, 36, '#777d76');
          line(
            [
              [-25, -13],
              [-12, -26],
              [0, -16],
              [14, -29],
              [27, -18],
            ],
            '#a3a895',
            3,
          );
          break;
        case 'mill-pond':
        case 'night-site':
          oval(0, 7, 31, 12, '#538c94');
          for (const x of [-23, -15, 17, 24])
            line(
              [
                [x, 10],
                [x, -9],
              ],
              '#718b66',
              2,
            );
          if (e.id === 'night-site') {
            line(
              [
                [0, -4],
                [0, -30],
              ],
              '#9b835d',
              3,
            );
            glint(0, -33, '#e7c46f', 3);
          }
          break;
        case 'cache':
          rect(-17, -12, 34, 25, '#8f704d');
          line(
            [
              [-17, -12],
              [17, 13],
            ],
            '#c1a170',
            3,
          );
          line(
            [
              [17, -12],
              [-17, 13],
            ],
            '#c1a170',
            3,
          );
          line(
            [
              [-29, 10],
              [-8, 2],
            ],
            '#75583f',
            6,
          );
          break;
        case 'wagon':
        case 'convoy':
          rect(-28, -10, 56, 19, '#987752');
          for (const x of [-18, 18]) oval(x, 11, 8, 8, '#4f534d');
          poly(
            [
              [-25, -12],
              [-17, -31],
              [18, -31],
              [26, -12],
            ],
            '#b9a274',
          );
          line(
            [
              [26, -5],
              [41, -14],
            ],
            '#80654a',
            3,
          );
          break;
        case 'watch':
          for (const x of [-20, 20])
            line(
              [
                [x, 13],
                [x, -34],
              ],
              '#796246',
              4,
            );
          rect(-27, -37, 54, 9, '#a3845d');
          line(
            [
              [-24, -19],
              [24, -19],
            ],
            '#a3845d',
            3,
          );
          line(
            [
              [0, -36],
              [0, -55],
            ],
            '#c0a979',
            2,
          );
          break;
        case 'dock':
          oval(-20, 9, 18, 7, '#527f87');
          for (const y of [-6, 1, 8])
            line(
              [
                [-6, y],
                [30, y],
              ],
              '#a0835c',
              4,
            );
          for (const x of [-5, 30])
            line(
              [
                [x, -10],
                [x, 13],
              ],
              '#765f48',
              3,
            );
          break;
        case 'lookout':
          for (const [x, y, r] of [
            [-9, 6, 9],
            [2, -1, 11],
            [12, 6, 8],
          ])
            oval(x, y, r, r * 0.55, '#7f8278');
          line(
            [
              [0, -10],
              [0, -45],
            ],
            '#8e7b5d',
            3,
          );
          poly(
            [
              [2, -44],
              [24, -40],
              [2, -28],
            ],
            '#8c765c',
          );
          break;
        case 'ore':
          for (const [x, y] of [
            [-12, 4],
            [0, -5],
            [12, 5],
          ])
            poly(
              [
                [x - 7, y + 7],
                [x - 5, y - 11],
                [x, y - 19],
                [x + 7, y - 8],
                [x + 8, y + 7],
              ],
              '#8b8c82',
            );
          for (const x of [-11, 2, 12]) glint(x, -4, '#c2a878', 1.4);
          break;
        case 'tower':
          rect(-18, -34, 36, 49, '#858b83');
          rect(-23, -42, 13, 11, '#a0a493');
          rect(9, -42, 14, 11, '#a0a493');
          poly(
            [
              [-8, -33],
              [5, -47],
              [17, -31],
              [7, -20],
            ],
            '#536157',
          );
          break;
        case 'shrine':
          rect(-23, -16, 46, 30, '#746e69');
          for (const x of [-17, 11]) rect(x, -34, 7, 22, '#8c877e');
          poly(
            [
              [-26, -18],
              [0, -42],
              [27, -18],
            ],
            '#8d8172',
          );
          line(
            [
              [-6, -17],
              [7, -5],
              [-5, 7],
            ],
            '#a26d57',
            2,
          );
          break;
        case 'overlook':
          for (const x of [-24, 0, 24])
            line(
              [
                [x, 13],
                [x, -16],
              ],
              '#85715b',
              3,
            );
          line(
            [
              [-26, -12],
              [26, -12],
            ],
            '#b29b73',
            3,
          );
          for (const [x, y, r] of [
            [-10, 7, 7],
            [5, 4, 8],
          ])
            oval(x, y, r, r * 0.5, '#6d6a63');
          break;
        case 'checkpoint':
          for (const x of [-26, -9, 9, 26]) {
            rect(x - 3, -14, 6, 29, '#665048');
            poly(
              [
                [x - 3, -14],
                [x, -25],
                [x + 3, -14],
              ],
              '#896a53',
            );
          }
          line(
            [
              [-30, -5],
              [30, 5],
            ],
            '#a48462',
            5,
          );
          line(
            [
              [21, -23],
              [21, -47],
            ],
            '#9a825f',
            3,
          );
          poly(
            [
              [23, -45],
              [42, -41],
              [23, -31],
            ],
            '#8b5f58',
          );
          break;
        case 'foundry':
          rect(-26, -15, 52, 30, '#67645f');
          rect(-19, -30, 15, 18, '#80776c');
          rect(7, -37, 14, 25, '#746f69');
          oval(0, 6, 19, 7, '#4f4742');
          for (const x of [-8, 0, 8]) glint(x, 1, '#db8751', 2);
          break;
        case 'shelf':
          for (const [x, h, c] of [
            [-14, 23, '#776a91'],
            [0, 34, '#9a87b3'],
            [15, 19, '#6b6384'],
          ])
            poly(
              [
                [x - 6, 12],
                [x - 5, 12 - h],
                [x, 7 - h],
                [x + 6, 12 - h],
                [x + 6, 12],
              ],
              c,
            );
          glint(0, -25, '#d9c8e8', 2);
          break;
        case 'siege':
          poly(
            [
              [-27, 13],
              [0, -34],
              [28, 13],
            ],
            '#8a6e60',
          );
          line(
            [
              [0, -31],
              [0, 12],
            ],
            '#5e5048',
            3,
          );
          rect(19, -13, 22, 26, '#665047');
          line(
            [
              [30, -13],
              [30, -40],
            ],
            '#9b805b',
            3,
          );
          poly(
            [
              [31, -39],
              [48, -34],
              [31, -25],
            ],
            '#795463',
          );
          break;
        case 'fortress-gate':
          rect(-34, -35, 68, 50, '#565966');
          rect(-18, -23, 36, 38, '#252830');
          for (const x of [-31, 24]) rect(x, -45, 8, 60, '#707381');
          poly(
            [
              [-38, -37],
              [0, -62],
              [38, -37],
            ],
            '#656674',
          );
          break;
        case 'goblin-camp':
          poly(
            [
              [-28, 12],
              [-6, -29],
              [12, 12],
            ],
            '#8e7455',
          );
          poly(
            [
              [-5, 12],
              [17, -24],
              [32, 12],
            ],
            '#756349',
          );
          oval(-16, 9, 9, 4, '#4e463d');
          glint(-16, 5, '#e5a75e', 1.6);
          rect(17, -2, 15, 13, '#8b6b49');
          break;
        case 'mire-nests':
          oval(0, 8, 31, 13, '#586a58');
          for (let x = -26; x <= 26; x += 8)
            line(
              [
                [x, 10],
                [x + 4, -4],
              ],
              '#82785e',
              2,
            );
          for (const [index, [x, y, r, color]] of [
            [-8, 3, 7, '#7c876d'],
            [9, 4, 6, '#6f7c66'],
          ].entries()) {
            const motion = ambientAnimalPose(e, index, e.ambientTime);
            oval(x + motion.x, y + motion.y, r, r * 0.7, color);
          }
          break;
        case 'wolf-den':
          poly(
            [
              [-31, 11],
              [-22, -16],
              [-5, -32],
              [16, -25],
              [31, 10],
            ],
            '#747970',
          );
          poly(
            [
              [-17, 10],
              [-12, -9],
              [0, -19],
              [14, -7],
              [19, 10],
            ],
            '#2e3732',
          );
          for (const [x, y] of [
            [-23, 5],
            [22, 6],
          ])
            oval(x, y, 7, 4, '#8c8978');
          break;
        case 'ogre-hearth':
          oval(0, 8, 25, 9, '#5a5147');
          for (const x of [-11, 0, 11])
            poly(
              [
                [x - 5, 7],
                [x, -10],
                [x + 5, 7],
              ],
              '#bd7b4f',
            );
          rect(-30, -8, 14, 23, '#777a72');
          rect(18, -10, 15, 25, '#777a72');
          break;
        case 'orc-bivouac':
          poly(
            [
              [-30, 12],
              [0, -39],
              [31, 12],
            ],
            '#77584f',
          );
          line(
            [
              [0, -36],
              [0, 13],
            ],
            '#614f46',
            3,
          );
          rect(16, -8, 20, 20, '#665047');
          line(
            [
              [26, -12],
              [26, -41],
            ],
            '#9a825f',
            3,
          );
          poly(
            [
              [28, -39],
              [43, -35],
              [28, -28],
            ],
            '#8b5f58',
          );
          break;
        case 'ash-roost':
          oval(0, 8, 31, 13, '#4f4a51');
          for (const x of [-23, -11, 0, 12, 24])
            line(
              [
                [x, 10],
                [x + 4, -7],
              ],
              '#6a5a50',
              2,
            );
          poly(
            [
              [-7, 4],
              [0, -15],
              [8, 4],
            ],
            '#7a6d83',
          );
          glint(0, -8, '#c58d67', 1.6);
          break;
        case 'crown-barracks':
          rect(-33, -19, 66, 34, '#5b5d68');
          for (const x of [-30, -14, 14, 30]) rect(x - 3, -29, 6, 44, '#4d4e59');
          poly(
            [
              [-38, -28],
              [-22, -47],
              [24, -47],
              [38, -28],
            ],
            '#505969',
          );
          rect(-13, -8, 26, 23, '#2d3038');
          poly(
            [
              [-5, -37],
              [0, -45],
              [5, -37],
              [0, -29],
            ],
            '#9b87ad',
          );
          break;
        default:
          if (/pond|shore|dock/i.test(e.name)) {
            oval(0, 5, 28, 10, '#528b94');
            for (const x of [-16, 0, 16])
              line(
                [
                  [x, -6],
                  [x, 12],
                ],
                '#b5a47a',
                3,
              );
          } else if (e.icon === '🏕️')
            poly(
              [
                [-24, 12],
                [0, -30],
                [25, 12],
              ],
              '#b8aa7a',
            );
          else {
            blockwork(-12, -25, 24, 38, '#999d8c', 9);
            poly(
              [
                [-15, -26],
                [0, -42],
                [16, -26],
              ],
              '#b0b6a2',
            );
            line(
              [
                [-4, -22],
                [5, -10],
                [-3, 3],
              ],
              '#65736a',
            );
          }
      }
    }
    function captiveScene() {
      const smith = ['crypt', 'mine', 'cindermaw'].includes(e.family),
        role = e.workKind || (smith ? 'smith' : e.family === 'archive' ? 'alchemist' : 'teacher');
      if (e.workstation === 'equipment-repair') {
        craftAt(0, 7, 1, () => table(65));
        softPoly(
          [
            [-26, -7],
            [-16, -13],
            [-7, -7],
            [-9, 2],
            [-23, 2],
          ],
          '#a5b0aa',
          2,
        );
        if (!rescued) {
          specialist({ ...e, kind: 'smith' });
          grip(17, -5);
          softRect(28, -3, 7, 9, gold, 1);
          chainLinks(30, 7, 3);
        }
        return;
      }
      if (e.presentation === 'mobile-forge') {
        if (!rescued) {
          craftAt(36, 7, 0.75, () => {
            cartBody();
            blockwork(-17, -25, 34, 22, '#7c8174', 6);
            softRect(-12, -23, 24, 13, '#383d33', 2);
            coals(0, -15, 0.6);
            flame(0, -15, 0.4);
            line(
              [
                [-18, -25],
                [18, -25],
              ],
              '#b5b4a2',
              3,
            );
            craftAt(15, -12, 0.45, () => rack(true));
          });
          specialist({ ...e, kind: 'smith' });
          grip(17, -5);
        }
        return;
      }
      if (e.presentation === 'mobile-captive') {
        if (!rescued) {
          specialist({ ...e, kind: role });
          softRect(10, -17, 10, 13, '#c8ba97', 2);
          paper(11, -15, 7);
          grip(14, -6);
          line(
            [
              [10, -3],
              [18, -1],
            ],
            '#7f6c4e',
            1.2,
          );
        }
        return;
      }
      if (e.presentation === 'workstation') {
        craftAt(29, 1, 0.7, () => {
          if (role === 'alchemist') {
            table(42);
            for (const x of [-12, 2, 15]) bottle(x, -13, '#93b4a1', 0.65);
          } else rack(true);
        });
        if (!rescued) {
          specialist({ ...e, kind: role });
          softRect(-29, -3, 7, 9, '#ac9c76', 1);
          chainLinks(-27, 6, 3);
        }
        return;
      }
      // Frame behind the person; door uprights leave a deliberate open face window.
      boards(-25, -44, 50, 60, '#615f4d');
      softRect(-21, -40, 42, 53, '#293d34', 1);
      for (const x of [-25, 25]) {
        timber([x, 15], [x, -45], 4, '#897c5b');
        line(
          [
            [x + 1, -38],
            [x + 1, 11],
          ],
          '#a49a76',
          0.8,
        );
      }
      if (!rescued) specialist({ ...e, kind: role });
      if (!rescued) {
        for (const x of [-20, -11, 11, 20])
          line(
            [
              [x, -40],
              [x, 14],
            ],
            '#a2ada0',
            2.1,
          );
        line(
          [
            [-23, -41],
            [23, -41],
          ],
          '#bfc3ac',
          3,
        );
        line(
          [
            [-22, -15],
            [22, -15],
          ],
          '#8f9d8e',
          2,
        );
        line(
          [
            [-23, 14],
            [23, 14],
          ],
          '#bfc3ac',
          3,
        );
        for (const y of [-31, 4]) softRect(-25, y, 7, 4, '#a9ae98', 0.7);
        softRect(8, -6, 8, 9, '#c6a86a', 1);
        oval(12, -2, 1, 1.4, '#6c654a');
      } else {
        poly(
          [
            [24, -41],
            [37, -33],
            [37, 19],
            [24, 14],
          ],
          '#687d6d',
        );
        for (const x of [28, 33])
          line(
            [
              [x, -34],
              [x, 14],
            ],
            '#acb7a1',
            1.6,
          );
        line(
          [
            [25, -12],
            [36, -7],
          ],
          '#c0c3a7',
          1.4,
        );
      }
    }
    function basketBody() {
      shaped('#a78d60', () => {
        ctx.moveTo(-19, -3);
        ctx.lineTo(19, -3);
        ctx.lineTo(14, 14);
        ctx.quadraticCurveTo(0, 19, -14, 14);
      });
      for (const y of [1, 5, 9, 13])
        line(
          [
            [-17 + y * 0.2, y],
            [17 - y * 0.2, y],
          ],
          '#6a6346',
          0.9,
        );
      for (const x of [-12, -5, 3, 11])
        line(
          [
            [x, -2],
            [x * 0.75, 14],
          ],
          '#d0b785',
          0.8,
        );
      oval(0, -3, 19, 4, '#b9a16f');
      oval(0, -4, 15, 2, '#5f674d');
      ctx.strokeStyle = '#c7ae7d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, -3);
      ctx.bezierCurveTo(-13, -27, 13, -27, 14, -3);
      ctx.stroke();
    }
    function craftedNode() {
      if (e.tribute && e.concealedTribute) {
        // Discovery exposes the reserve inside ordinary Crown stores; no burial mound.
        if (e.storageStyle === 'signal-store') {
          boards(-30, -20, 60, 36, '#727c70');
          rect(-25, -16, 50, 26, '#343e36');
          craftAt(0, 6, 0.7, () => chest(true));
          line(
            [
              [-26, -15],
              [-17, -7],
            ],
            '#a9ae97',
            3,
          );
        } else if (e.storageStyle === 'ore-store') {
          crateBody(-16, 9, 0.85);
          craftAt(8, 3, 0.7, () => chest(true));
          poly(
            [
              [-29, -28],
              [-8, -33],
              [27, -23],
              [23, -13],
              [-6, -17],
            ],
            '#707b62',
          );
          line(
            [
              [-27, -27],
              [-7, -19],
              [23, -15],
            ],
            '#b3ac85',
            1.5,
          );
        } else if (e.storageStyle === 'haul-store') {
          crateBody(0, 5, 1.1);
          rect(-17, -6, 34, 17, '#3a4135');
          craftAt(0, 6, 0.62, () => chest(true));
          timber([-26, -19], [25, -25], 4);
        } else {
          craftAt(-12, 2, 0.7, () => chest(true));
          crateBody(21, 8, 0.62);
          paper(18, -15, 19);
          line(
            [
              [-24, 15],
              [27, 15],
            ],
            '#6c5a3c',
            3,
          );
        }
      } else if (e.tribute || e.icon === '🪙') {
        chest(true, 0.9);
      } else if (e.icon === '🪵') craftedDecoration('woodpile');
      else if (e.icon === '🧺') basketBody();
      else if (e.icon === '💎') craftAt(0, 4, 0.8, () => craftedDecoration('crystal-cluster'));
      else {
        rockPiece(0, 9, 23, 29);
        for (const [x, y] of [
          [-11, -5],
          [4, -12],
          [13, 1],
        ]) {
          line(
            [
              [x - 3, y - 3],
              [x, y],
              [x - 2, y + 5],
            ],
            '#bec0a0',
            2,
          );
          line(
            [
              [x, y],
              [x + 3, y + 2],
            ],
            '#d3b078',
            1,
          );
        }
      }
      workDetails(e.sceneRole);
    }
    function craftedWork(role) {
      if (!role) return;
      if (role === 'submerged') {
        fillOval(0, 7, 34, 7, '#6eaba1', 0.3);
        for (const [x, y] of [
          [-18, 3],
          [13, 9],
        ])
          line(
            [
              [x - 8, y],
              [x, y + 1],
              [x + 7, y],
            ],
            '#c0d6bc',
            1,
          );
        return;
      }
      // Supports touch the resource; tools no longer float as disconnected glyphs.
      timber([-24, -9], [24, -9], 3, '#9b8b63');
      for (const x of [-20, 20]) timber([x, -9], [x, 3], 2.2, '#827957');
      switch (role) {
        case 'pages':
          for (const [x, y] of [
            [-16, -30],
            [-3, -33],
            [11, -28],
          ]) {
            paper(x, y, 11);
            line(
              [
                [x + 2, y - 1],
                [x + 2, y + 1],
              ],
              '#8a7750',
              1.6,
            );
          }
          break;
        case 'alchemy':
          for (const [x, c] of [
            [-16, '#98b9a5'],
            [0, '#b8a37f'],
            [16, '#8eacbc'],
          ])
            bottle(x, -16, c, 0.85);
          break;
        case 'pump':
          softRect(-10, -30, 20, 23, '#8eaaa1', 4);
          oval(0, -29, 10, 4, '#bdc4a7');
          line(
            [
              [0, -30],
              [0, -43],
              [17, -43],
            ],
            '#b9a47a',
            4,
          );
          oval(0, -36, 4, 4, '#72887b');
          line(
            [
              [10, -15],
              [24, -13],
              [29, 7],
            ],
            '#5b7d76',
            5,
          );
          for (const [x, y] of [
            [11, -15],
            [24, -13],
          ])
            oval(x, y, 3, 3, '#b9c6ad');
          line(
            [
              [29, 7],
              [28, 13],
            ],
            '#a9d1bd',
            2,
          );
          break;
        case 'construction':
          for (const [x, y] of [
            [-12, -15],
            [1, -11],
            [12, -16],
          ])
            timber([x - 9, y + 14], [x + 7, y - 8], 4, '#c0a577');
          line(
            [
              [13, -11],
              [22, -20],
            ],
            '#766a49',
            3,
          );
          softRect(17, -25, 14, 6, '#9aa99b', 1);
          break;
        case 'preservation':
          softRect(-23, -13, 46, 6, '#9b8a62', 1);
          for (const x of [-14, 1, 16]) {
            restingObject(x, -13, 3, () => bottle(0, -3.8, '#afbf9b', 0.65));
            line(
              [
                [x - 3, -25],
                [x + 3, -25],
              ],
              '#8c7852',
              2,
            );
          }
          softRect(-14, -10, 25, 5, '#e0d1ad', 2);
          line(
            [
              [-10, -9],
              [7, -8],
            ],
            '#a9ac8c',
            0.8,
          );
          break;
        case 'fish-study':
          softRect(-24, -17, 46, 10, '#9d8e66', 2);
          shaped('#a5b9a6', () => {
            ctx.moveTo(-20, -13);
            ctx.quadraticCurveTo(-7, -23, 4, -13);
            ctx.lineTo(12, -18);
            ctx.lineTo(11, -8);
            ctx.lineTo(3, -11);
            ctx.quadraticCurveTo(-8, -5, -20, -13);
          });
          oval(-16, -14, 1, 1, '#3a594a');
          line(
            [
              [-11, -17],
              [-8, -10],
            ],
            '#647e6c',
            1,
          );
          for (const x of [14, 17, 20])
            line(
              [
                [x, -15],
                [x, -11],
              ],
              '#d3c9a4',
              0.7,
            );
          break;
        case 'coin-accounting':
          for (const [x, y] of [
            [-15, -15],
            [-5, -12],
            [6, -16],
          ]) {
            oval(x, y, 4, 2.4, '#a28d53');
            oval(x, y - 2, 4, 2, '#d6c07e');
            line(
              [
                [x - 2, y - 3],
                [x + 1, y - 3],
              ],
              '#edda9e',
              0.7,
            );
          }
          softRect(9, -23, 16, 7, '#6d6850', 1);
          paper(10, -24, 13);
          break;
      }
    }
    function craftedDefense() {
      const stone = e.structure === 'stonewall',
        style = e.strongholdDefenseStyle;
      if (stone) {
        blockwork(-28, -28, 56, 42, '#929b8a', 9);
        poly(
          [
            [-31, -31],
            [26, -31],
            [31, -25],
            [-30, -25],
          ],
          '#b4bba6',
        );
        for (const x of [-26, -7, 13]) blockwork(x, -36, 12, 9, '#a5ad98', 8);
      } else {
        for (const [x, h] of [
          [-24, 46],
          [-12, 51],
          [0, 47],
          [12, 50],
          [24, 45],
        ]) {
          poly(
            [
              [x - 4, 14],
              [x - 4, 14 - h],
              [x, 6 - h],
              [x + 4, 14 - h],
              [x + 4, 14],
            ],
            '#967c55',
          );
          line(
            [
              [x + 1, 12 - h],
              [x + 1, 12],
            ],
            '#c4ac79',
            0.8,
          );
        }
        for (const y of [-16, 4]) {
          timber([-28, y], [28, y], 5, '#74664a');
          for (const x of [-24, 0, 24])
            line(
              [
                [x - 3, y - 4],
                [x + 3, y + 4],
              ],
              '#c1ad7c',
              1.6,
            );
        }
      }
      if (style === 'fort') {
        if (stone) blockwork(-29, -39, 58, 10, '#acb6a4', 8);
        else {
          boards(-28, -39, 56, 11, '#ae956b', true);
          for (const side of [-1, 1]) timber([side * 22, -30], [side * 10, -39], 3);
        }
        for (const x of [-25, -10, 5, 20])
          softRect(x, -45, 10, 9, stone ? '#8e9d8c' : '#9a7d53', 1);
        if (e.fortCorner) {
          blockwork(-21, -59, 42, 30, stone ? '#82917e' : '#8f7958', 8);
          craftedRoof(24, -59, -75, stone ? 2 : 0);
          for (const x of [-12, 12]) recessedDoor(x, -54, 7, 13, true);
        }
      } else if (style === 'ruin') {
        if (stone) {
          for (const [x, y] of [
            [-19, -32],
            [3, -35],
            [19, -27],
          ])
            rockPiece(x, y, 9, 10);
          line(
            [
              [-14, -27],
              [-10, -16],
              [-16, -7],
              [-6, 1],
            ],
            '#4c5a4b',
            2,
          );
          rockPiece(-20, 12, 11, 7);
          rockPiece(20, 13, 8, 7);
        } else {
          for (const x of [-18, 6, 22]) {
            softPoly(
              [
                [x - 4, -32],
                [x, -22],
                [x + 3, -33],
                [x + 5, -25],
                [x + 4, -10],
              ],
              '#5d5842',
              0.4,
            );
            timber([x - 6, -6], [x + 5, 5], 3, '#c0a277');
          }
          timber([-27, 4], [20, 10], 4, '#685a41');
        }
      } else if (style === 'habitat') {
        for (let y = -24; y < 5; y += 5) {
          ctx.strokeStyle = y % 2 ? '#9c9970' : '#b2a57b';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-25, y);
          ctx.quadraticCurveTo(-6, y - 3, 6, y + 1);
          ctx.quadraticCurveTo(17, y + 4, 26, y);
          ctx.stroke();
        }
        for (const x of [-21, -6, 9, 23]) {
          timber([x, 10], [x, -36], 2, '#95896a');
          line(
            [
              [x - 3, -18],
              [x + 3, -12],
            ],
            '#d0bf8f',
            1.4,
          );
        }
        foliage(17, 12, 11, 6, '#72855d');
      }
    }
    function draftAnimal(camel = false) {
      const hide = camel ? '#b29b75' : '#a58966',
        light = camel ? '#c6b18a' : '#bda17a';
      for (const [x, y] of [
        [-18, 0],
        [-6, 1],
        [12, 0],
        [25, -1],
      ]) {
        shaped(hide, () => {
          ctx.moveTo(x - 4, y);
          ctx.lineTo(x + 4, y);
          ctx.quadraticCurveTo(x + 4, 10, x + 1, 13);
          ctx.lineTo(x + 3, 24);
          ctx.lineTo(x - 3, 24);
          ctx.lineTo(x - 4, 13);
        });
        oval(x, 25, 5, 2.8, '#484538');
        line(
          [
            [x - 2, 12],
            [x + 2, 12],
          ],
          '#d0ba92',
          1,
        );
      }
      shaped(hide, () => {
        ctx.moveTo(-26, -7);
        ctx.bezierCurveTo(-35, -27, -5, -31, 19, -23);
        ctx.quadraticCurveTo(34, -18, 28, 1);
        ctx.quadraticCurveTo(7, 11, -25, 3);
      });
      oval(-18, -6, 11, 14, hide);
      oval(21, -7, 10, 15, hide);
      if (camel)
        for (const x of [-13, 11]) {
          shaped(light, () => {
            ctx.moveTo(x - 10, -22);
            ctx.quadraticCurveTo(x - 9, -46, x + 2, -40);
            ctx.quadraticCurveTo(x + 10, -38, x + 11, -22);
          });
        }
      shaped(light, () => {
        ctx.moveTo(19, -17);
        ctx.quadraticCurveTo(29, -29, 32, camel ? -49 : -38);
        ctx.quadraticCurveTo(34, -56, 43, -46);
        ctx.lineTo(42, -22);
        ctx.quadraticCurveTo(36, -6, 27, -4);
      });
      oval(43, camel ? -49 : -38, 11, 7, light);
      oval(51, camel ? -46 : -35, 7, 4.5, '#9f8767');
      oval(47, camel ? -51 : -40, 1.3, 1.3, '#2d3c32');
      shaped(hide, () => {
        const y = camel ? -52 : -41;
        ctx.moveTo(38, y);
        ctx.quadraticCurveTo(31, y - 16, 38, y - 13);
        ctx.lineTo(43, y);
      });
      if (!camel) {
        line(
          [
            [31, -39],
            [28, -29],
            [26, -19],
          ],
          '#66513b',
          5,
        );
        shaped('#62523e', () => {
          ctx.moveTo(-27, -18);
          ctx.quadraticCurveTo(-38, -16, -32, 4);
          ctx.quadraticCurveTo(-28, 1, -28, -9);
        });
      }
      softPoly(
        [
          [-20, -25],
          [-12, -31],
          [18, -29],
          [26, -22],
          [14, -13],
          [-16, -15],
        ],
        '#7c6046',
        3,
      );
      line(
        [
          [-15, -24],
          [-10, 0],
          [15, 1],
          [22, -22],
        ],
        '#d0b784',
        2,
      );
      line(
        [
          [38, camel ? -46 : -36],
          [46, camel ? -41 : -30],
          [51, camel ? -44 : -33],
        ],
        '#d5bc88',
        1.6,
      );
    }
    function craftedTransport() {
      if (e.icon === '🐉' || /Dragon/.test(e.name || '')) {
        dragon('#8b9980');
        shaped('#795a42', () => {
          ctx.moveTo(-17, -23);
          ctx.quadraticCurveTo(-9, -39, 1, -29);
          ctx.quadraticCurveTo(10, -23, 17, -31);
          ctx.lineTo(22, -23);
          ctx.lineTo(12, -14);
          ctx.quadraticCurveTo(-6, -10, -17, -23);
        });
        line(
          [
            [-12, -22],
            [0, -17],
            [15, -22],
          ],
          '#d2b885',
          1.2,
        );
        for (const x of [-18, 18]) {
          softRect(x - 5, -14, 10, 15, '#8d6e4a', 2);
          line(
            [
              [x, -13],
              [x, -1],
            ],
            '#c6b18a',
            1.3,
          );
        }
        line(
          [
            [-12, -14],
            [0, -5],
            [15, -14],
          ],
          '#c4ac7e',
          2,
        );
        return;
      }
      if (e.icon === '⛵') {
        // Owner correction: same design at 150% of the dev.136 ferry footprint.
        ctx.scale(1.5, 1.5);
        // Selected twin-hull/reed-canopy ferry; retained when the raster is loading.
        const hull = (dy, color) => {
          shaped(color, () => {
            ctx.moveTo(-53, dy - 4);
            ctx.quadraticCurveTo(-2, dy + 2, 59, dy - 10);
            ctx.quadraticCurveTo(50, dy + 12, 14, dy + 13);
            ctx.quadraticCurveTo(-35, dy + 14, -53, dy - 4);
          });
          line(
            [
              [-47, dy],
              [0, dy + 7],
              [46, dy + 1],
            ],
            '#b09b71',
            1,
          );
        };
        hull(-12, '#73654b');
        poly(
          [
            [-46, -13],
            [40, -16],
            [48, 0],
            [-43, 5],
          ],
          '#9d875d',
        );
        for (let x = -35; x < 40; x += 14)
          line(
            [
              [x, -12],
              [x + 5, 3],
            ],
            '#6f6049',
            0.7,
          );
        for (const x of [-15, 15]) {
          softRect(x - 9, -15, 21, 7, '#667b70', 1);
          softRect(x - 9, -20, 21, 6, '#8e7a55', 1);
        }
        craftAt(-40, -10, 0.52, () => human('worker'));
        timber([-46, -8], [-69, 5], 3, '#806b48');
        for (const x of [-29, 31]) timber([x, -6], [x - 2, -30], 2.5, '#796846');
        shaped('#b5a46e', () => {
          ctx.moveTo(-34, -27);
          ctx.quadraticCurveTo(-29, -42, -19, -40);
          ctx.lineTo(31, -33);
          ctx.quadraticCurveTo(41, -28, 39, -20);
          ctx.lineTo(-23, -25);
          ctx.closePath();
        });
        for (let x = -25; x < 34; x += 7)
          line(
            [
              [x, -34 + (x + 25) * 0.1],
              [x + 4, -25 + (x + 25) * 0.07],
            ],
            '#d1bd81',
            0.7,
          );
        for (const x of [-29, -4, 31])
          line(
            [
              [x - 3, -27],
              [x, -37 + (x + 29) * 0.1],
              [x + 6, -24],
            ],
            '#716549',
            2,
          );
        hull(3, '#8a7451');
        line(
          [
            [-47, 0],
            [4, 5],
            [55, -5],
          ],
          '#607d73',
          3,
        );
        for (const [x, y] of [
          [-36, 8],
          [0, 13],
          [37, 8],
        ]) {
          oval(x, y, 3.2, 5, '#c0ab78');
          line(
            [
              [x - 2, y - 2],
              [x + 2, y - 1],
            ],
            '#786a4d',
            0.8,
          );
        }
        for (const [x, y] of [
          [44, -9],
          [52, -20],
        ]) {
          timber([x, y + 5], [x, y - 12], 2, '#6e6245');
          softRect(x - 3, y - 13, 6, 8, '#ddaf56', 1);
          rect(x - 2, y - 11, 3, 4, '#f7d57c');
        }
        return;
      }
      if (e.icon === '🐫') {
        craftAt(0, -2, 1, () => draftAnimal(true));
        for (const x of [-22, 20]) {
          softRect(x - 6, -25, 13, 22, '#8e6b47', 2);
          line(
            [
              [x, -23],
              [x, -4],
            ],
            '#d7ba83',
            2,
          );
        }
        line(
          [
            [-13, -29],
            [34, -44],
          ],
          '#bba576',
          1.6,
        );
        return;
      }
      craftAt(-28, 1, 0.95, () => cartBody(true));
      shaped('#c7b48a', () => {
        ctx.moveTo(-58, -16);
        ctx.bezierCurveTo(-65, -54, 5, -56, 8, -18);
        ctx.lineTo(0, -13);
        ctx.quadraticCurveTo(-29, -8, -56, -12);
      });
      for (const x of [-48, -28, -9])
        line(
          [
            [x, -42],
            [x + 4, -17],
          ],
          '#9b8a64',
          1.4,
        );
      craftAt(56, 0, 0.8, () => draftAnimal());
      timber([0, -2], [45, 2], 3);
      line(
        [
          [-4, -26],
          [32, -28],
          [85, -30],
        ],
        '#d4bd91',
        1.5,
      );
      craftAt(-58, 3, 0.4, () => lantern(0, -20));
    }

    function craftedDispatch() {
      if (e.kind === 'bundle') {
        sack(-7, 5, 1.2, '#b5a17d');
        softRect(4, -12, 25, 25, '#aa8c65', 4);
        line(
          [
            [6, -10],
            [26, 11],
          ],
          '#d4c093',
          1.5,
        );
        line(
          [
            [25, -10],
            [7, 11],
          ],
          '#d4c093',
          1.5,
        );
        return true;
      }
      if (e.kind === 'throne') {
        craftedDecoration('dark-throne');
        return true;
      }
      if (e.kind === 'appointment') {
        blockwork(-18, -19, 36, 34, '#696577', 9);
        poly(
          [
            [-21, -22],
            [17, -22],
            [23, -16],
            [-21, -16],
          ],
          '#bca373',
        );
        softRect(-10, -15, 20, 17, '#a3a899', 1);
        line(
          [
            [-7, -10],
            [7, -10],
          ],
          '#5b6a61',
          1,
        );
        poly(
          [
            [0, -27],
            [5, -22],
            [0, -17],
            [-5, -22],
          ],
          '#ad8fb5',
        );
        return true;
      }
      if (e.kind === 'fountain') {
        rimBowl(0, 5, 28, '#9fae9f', '#78a79b');
        blockwork(-6, -24, 12, 26, '#9fafa0', 8);
        rimBowl(0, -25, 15, '#becbb4', '#80ac9b');
        ctx.strokeStyle = '#b8dfc6';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.bezierCurveTo(-8, -45, 7, -45, 4, -26);
        ctx.stroke();
        for (const x of [-11, 11])
          line(
            [
              [x, -24],
              [x * 0.9, 3],
            ],
            '#a2cdbb',
            1.3,
          );
        for (const y of [3, 6])
          line(
            [
              [-18, y],
              [0, y + 1],
              [19, y],
            ],
            '#c0d7b9',
            0.9,
          );
        return true;
      }
      return false;
    }

    function workDetails(role) {
      craftedWork(role);
    }
    const type = e.renderKind;
    if (craftedDispatch()) {
      // Explicit furniture and interaction artwork owns this body.
    } else if (type === 'prop') {
      if (['vale-working-mill', 'fruit-cellar'].includes(e.structure)) decoration(e.structure);
      else if (e.treasuryBoss) decoration(e.structure);
      else if (e.decorative) decoration(e.structure);
      else if (/^(vale-|march-|highland-|frontier-|crown-)/.test(e.structure || '')) {
        settlementBuilding(e.structure);
      } else if (e.structure === 'fence') {
        craftedFence();
      } else if (e.structure === 'house' || e.structure === 'workshop') {
        building(e.structure);
      } else if (['stonewall', 'stockade', 'palisade'].includes(e.structure)) {
        craftedDefense();
      } else if (e.structure === 'pillar') {
        if (e.householdPartition) {
          // Worn masonry and a low return wall describe an alcove, not another temple colonnade.
          softPoly(
            [
              [-23, 11],
              [-22, -18],
              [-8, -28],
              [14, -23],
              [22, -6],
              [22, 14],
            ],
            '#8a8f7f',
            5,
          );
          softPoly(
            [
              [-20, -18],
              [-8, -28],
              [14, -23],
              [7, -12],
            ],
            '#a7ae97',
            4,
          );
          line(
            [
              [-12, -12],
              [-10, 6],
              [9, 10],
            ],
            '#626c60',
            1.5,
          );
          oval(0, 14, 26, 5, '#777d69');
        } else {
          rect(-13, -44, 26, 58, '#9ca49a');
          poly(
            [
              [13, -44],
              [18, -47],
              [18, 10],
              [13, 14],
            ],
            '#748779',
          );
          line(
            [
              [-10, -43],
              [-10, 10],
            ],
            '#c2cab3',
            1.3,
          );
          rect(-18, -48, 36, 8, '#bac0ad');
          rect(-18, 10, 36, 8, '#8a9488');
          for (const x of [-7, 0, 7])
            line(
              [
                [x, -39],
                [x, 6],
              ],
              '#747f75',
              1,
            );
        }
      } else if (e.icon === '🪨') {
        wildProp();
      } else wildProp();
    } else if (type === 'node') {
      craftedNode();
    } else if (e.kind === 'cage') {
      captiveScene();
    } else if (type === 'building' || ['rest', 'supplier', 'recruiter', 'quests'].includes(e.kind))
      building(type === 'building' ? 'barracks' : e.kind);
    else if (e.kind === 'cage' && e.workstation === 'equipment-repair') {
      rect(-34, 4, 68, 13, '#71695b');
      poly(
        [
          [-26, 4],
          [-22, -8],
          [-7, -8],
          [-3, 4],
        ],
        steel,
      );
      line(
        [
          [13, 2],
          [27, -11],
        ],
        '#71695b',
        4,
      );
      rect(22, -16, 12, 7, steel);
      if (!rescued) specialist({ ...e, kind: 'smith' });
      // A sealed restraint sits beside the tools; the rescue gate remains authoritative.
      if (!rescued) {
        rect(28, -4, 7, 8, gold);
        line(
          [
            [30, 5],
            [37, 12],
          ],
          steel,
          2,
        );
      }
    } else if (e.kind === 'critical-codex') {
      // An authored collectible book, not a humanoid NPC. Keep its existing
      // interactable identity so historical v4 room instances still work.
      ctx.save();
      ctx.rotate(-0.14);
      softPoly(
        [
          [-25, -11],
          [1, -14],
          [26, -9],
          [26, 10],
          [1, 8],
          [-25, 11],
        ],
        '#4b322b',
        1.2,
      );
      softPoly(
        [
          [-22, -11],
          [-1, -13],
          [-1, 6],
          [-22, 8],
        ],
        '#e6d6ae',
        1,
      );
      softPoly(
        [
          [1, -13],
          [23, -10],
          [23, 8],
          [1, 6],
        ],
        '#d5c296',
        1,
      );
      line(
        [
          [0, -13],
          [0, 8],
        ],
        '#7b624b',
        2,
      );
      for (const y of [-7, -3, 1]) {
        line(
          [
            [-18, y],
            [-5, y - 1],
          ],
          '#917a5b',
          0.9,
        );
        line(
          [
            [5, y - 1],
            [19, y],
          ],
          '#917a5b',
          0.9,
        );
      }
      ctx.restore();
    } else if (e.kind === 'patrol-report') {
      // A practical trail scout: moss cloak, copper clasp and worn field gear.
      poly(
        [
          [-14, -26],
          [-23, 11],
          [-8, 15],
          [1, 9],
          [17, 13],
          [15, -25],
        ],
        '#4f6453',
      );
      humanoid('#78866a', skin, 0.95, false);
      oval(0, -31, 11, 13, '#43594c');
      oval(0, -29, 7, 8, '#d3ad88');
      poly(
        [
          [-13, -36],
          [-8, -43],
          [5, -42],
          [13, -34],
          [6, -35],
          [0, -38],
          [-6, -35],
        ],
        '#60745b',
      );
      line(
        [
          [-5, -29],
          [-3, -29],
        ],
        '#25312d',
        1.3,
      );
      line(
        [
          [3, -29],
          [5, -29],
        ],
        '#25312d',
        1.3,
      );
      line(
        [
          [-3, -24],
          [3, -24],
        ],
        '#8d6653',
        1,
      );
      poly(
        [
          [-10, -21],
          [9, -22],
          [6, -15],
          [-6, -17],
        ],
        '#b98c5e',
      );
      oval(6, -20, 2.4, 2.4, '#cfaa69');
      line(
        [
          [-10, -17],
          [11, 0],
        ],
        '#7d5d40',
        3.5,
      );
      rect(-19, -4, 10, 12, '#8c6b47');
      rect(-19, -4, 10, 4, '#b59a6b');
      line(
        [
          [19, -28],
          [21, 14],
        ],
        '#92734f',
        3,
      );
      line(
        [
          [18, -29],
          [22, -28],
        ],
        '#bba27b',
        2,
      );
      rect(11, -7, 5, 13, '#c6b58e');

      face(0, -29, '#d3ad88', 0.85);
      // One hand on the satchel side; the other alone grasps the staff.
      grip(-14, -1);
      grip(20, -4);
      line(
        [
          [-17, -2],
          [-12, -1],
        ],
        '#c4ad7b',
        1,
      );
    } else if (e.presentation === 'scout-tracks') {
      ctx.save();
      // Impressions lie in the isometric ground plane, not upright little feet.
      ctx.transform(0.76, 0.27, -0.76, 0.27, 0, 0);
      ctx.rotate(e.angle || 0);
      ctx.scale(0.75, 0.75);
      ctx.globalAlpha *= 0.48;
      for (const [x, y] of [
        [-12, -6],
        [0, 6],
        [12, -6],
      ]) {
        fillOval(x, y, 5, 3, '#786b54');
        for (const dy of [-4, 0, 4]) fillOval(x + 5, y + dy, 1.7, 1.5, '#74674f');
      }
      ctx.restore();
    } else if (e.kind === 'cage' && e.presentation === 'mobile-forge') {
      if (!rescued) {
        ctx.save();
        ctx.translate(34, 6);
        rect(-20, -15, 40, 20, '#66544a');
        rect(-17, -19, 34, 6, '#a7967b');
        oval(-13, 8, 7, 7, '#302c2b');
        oval(13, 8, 7, 7, '#302c2b');
        rect(-12, -11, 24, 10, '#44352f');
        oval(0, -7, 9, 4, '#de7e3a');
        rect(-6, -31, 16, 7, '#5e6870');
        rect(-2, -24, 6, 5, '#444d54');
        ctx.restore();
        specialist({ ...e, kind: 'smith' });
      }
    } else if (e.kind === 'cage' && e.presentation === 'mobile-captive') {
      if (!rescued) {
        specialist({ ...e, kind: 'teacher' });
        rect(10, -17, 9, 13, '#c9b78e');
        line(
          [
            [12, -14],
            [17, -14],
          ],
          '#726044',
          1,
        );
        line(
          [
            [12, -10],
            [17, -10],
          ],
          '#726044',
          1,
        );
      }
    } else if (e.kind === 'cage' && e.presentation === 'workstation') {
      // A secured worker can remain mechanically a captive without being drawn behind cage bars.
      ctx.save();
      ctx.translate(28, 0);
      decoration(e.workKind === 'alchemist' ? 'scribe-desk' : 'tool-rack');
      if (e.workKind === 'alchemist') workDetails('alchemy');
      ctx.restore();
      if (!rescued) specialist({ ...e, kind: e.workKind });
      if (!rescued) {
        rect(-28, -3, 7, 9, '#a39570');
        line(
          [
            [-24, -7],
            [-24, -3],
          ],
          '#c9bd93',
          3,
        );
      }
    } else if (e.kind === 'cage') {
      rect(-20, -35, 40, 49, '#746c58');
      rect(-17, -31, 34, 41, '#23302b');
      if (!rescued)
        specialist({
          ...e,
          kind: ['archive'].includes(e.family)
            ? 'alchemist'
            : ['thorn', 'mire', 'ridge', 'warlord', 'citadel'].includes(e.family)
              ? 'teacher'
              : 'smith',
        });
      for (const x of [-16, -8, 0, 8, 16])
        line(
          [
            [x, -32],
            [x, 12],
          ],
          '#b3afa0',
          3,
        );
      line(
        [
          [-20, -17],
          [20, -17],
        ],
        '#b3afa0',
      );
      if (rescued) {
        poly(
          [
            [18, -32],
            [32, -26],
            [32, 16],
            [18, 12],
          ],
          '#84887a',
        );
      } else rect(-3, -8, 7, 8, gold);
    } else if (e.kind === 'dungeon' && e.treasury) treasuryEntrance(e.treasuryBoss);
    else if (e.kind === 'dungeon' || e.kind === 'exit') gate(e.family);
    else if (e.kind === 'transport') {
      craftedTransport();
    } else if (e.kind === 'bundle') {
      rect(-15, -15, 30, 28, '#a78455');
      line(
        [
          [-15, -15],
          [15, 13],
        ],
        '#d0b079',
        3,
      );
      line(
        [
          [15, -15],
          [-15, 13],
        ],
        '#d0b079',
        3,
      );
    } else if (e.kind === 'appointment') {
      // Inhabited-dungeon command dais, visually separate from the boss altar.
      oval(0, 11, 23, 8, '#7d7280');
      rect(-16, -22, 32, 32, '#59516b');
      rect(-19, -26, 38, 7, '#bca26f');
      poly(
        [
          [-9, -28],
          [-12, -37],
          [0, -46],
          [12, -37],
          [9, -28],
        ],
        '#d8bd7d',
      );
      poly(
        [
          [0, -37],
          [5, -31],
          [0, -25],
          [-5, -31],
        ],
        '#b58cc2',
      );
    } else if (e.kind === 'dungeon-master') {
      appointedResident();
    } else if (e.kind === 'throne') {
      // Real interactable court furniture, distinctly different from an Ash
      // Citadel decoration; no collision, hitbox or new quest infrastructure.
      rect(-27, -32, 54, 44, '#343147');
      rect(-23, -48, 46, 20, '#51455f');
      poly(
        [
          [-26, -48],
          [-31, -62],
          [-12, -54],
          [0, -67],
          [12, -54],
          [31, -62],
          [26, -48],
        ],
        gold,
      );
      rect(-17, -27, 34, 31, '#68556c');
      poly(
        [
          [-9, -25],
          [0, -36],
          [9, -25],
          [0, -17],
        ],
        '#b48fbc',
      );
      for (const x of [-30, 22]) rect(x, -22, 8, 32, '#817286');
      rect(-25, 6, 50, 9, '#987850');
    } else if (e.kind === 'fountain') {
      oval(0, 5, 25, 10, '#9aa7a5');
      oval(0, 2, 20, 6, '#65999f');
      rect(-5, -24, 10, 26, '#adb6a9');
      oval(0, -23, 13, 5, '#bad1bd');
      line(
        [
          [0, -38],
          [0, -24],
        ],
        '#9ad7d4',
        3,
      );
    } else if (e.kind === 'mini') {
      rect(-24, -22, 48, 36, '#7e897f');
      rect(-12, -16, 24, 30, '#24372d');
      for (const x of [-24, 12]) rect(x, -37, 12, 50, '#9aa38e');
      rect(-29, -43, 22, 8, '#b4b99e');
      rect(7, -43, 22, 8, '#b4b99e');
    } else if (e.kind === 'landmark') {
      landmark();
    } else if (type === 'npc') {
      if (e.family && ['teacher', 'smith', 'alchemist'].includes(e.kind)) specialist(e);
      else {
        const smith = ['smith', 'alchemist'].includes(e.kind);
        humanoid(smith ? '#8b7770' : '#8b9c7b');
        face(
          0,
          -29,
          skin,
          1,
          false,
          e.kind === 'smith' ? 'amused' : e.kind === 'alchemist' ? 'bright' : 'warm',
        );
        coiffure(
          e.kind === 'alchemist' ? 'curls' : 'short',
          e.kind === 'smith' ? '#80543b' : '#554939',
        );
        if (e.kind === 'smith') beard('full', '#80543b');
        if (smith && e.kind === 'smith') {
          rect(-8, -15, 16, 19, '#675448');
          smithHammer(20);
          poly(
            [
              [19, 9],
              [38, 9],
              [32, 16],
              [22, 16],
            ],
            steel,
          );
        } else if (e.kind === 'alchemist') {
          rect(12, -16, 8, 4, '#bed3cb');
          oval(16, -6, 7, 9, '#789ba1');
          rect(-8, -37, 16, 5, '#c9d6ab');
        } else {
          line(
            [
              [17, -31],
              [17, 13],
            ],
            '#baa373',
            3,
          );
          oval(17, -33, 4, 4, '#c9d6ab');
          rect(-14, -10, 8, 14, '#cab483');
        }
        grip(15, -2);
        if (e.kind === 'alchemist') craftAt(16, -8, 0.65, () => bottle(0, 0, '#91b3aa'));
      }
    } else if (type === 'hero') {
      if (e.crowned) crownedHero(e.class || 'paladin');
      else hero(e.class || 'paladin');
    } else if (type === 'ally' && !e.charmOrigin) {
      const role = allyBodyKind(e);
      if (e.type === 'pet') bossPet(e.petFamily);
      else if (role === 'goblin-archer') goblinArcher();
      else human(role);
    } else if (e.type === 'boss' || e.captainProfile === 'supply-highlands') {
      shade(
        e.form === 'true' ? 42 : 34,
        e.form === 'true' ? 13 : 10,
        e.form === 'true' ? 0.42 : 0.32,
      );
      const bossScale =
        e.captainProfile === 'supply-highlands'
          ? 1
          : (e.family === 'darklord' ||
            e.family === 'cindermaw' ||
            e.family === 'mine' ||
            e.family === 'abyss'
              ? 1.36
              : 1.3) * (e.form === 'true' ? 1.14 : 1);
      ctx.scale(bossScale, bossScale);
      switch (e.captainProfile === 'supply-highlands' ? 'ridge' : e.family) {
        case 'thorn':
          wolf('#a08864', true);
          break;
        case 'mire':
          crocodile('#788966', true);
          break;
        case 'abyss':
          dragon();
          break;
        case 'crypt':
          skeletonBody(true);
          break;
        case 'archive':
          spectralScholar();
          break;
        case 'ridge':
          mountainBody();
          break;
        case 'mine':
          softRect(-18, 0, 14, 20, '#77847f');
          softRect(5, 0, 14, 20, '#77847f');
          softPoly(
            [
              [-22, 5],
              [-25, -24],
              [-12, -35],
              [15, -34],
              [24, -19],
              [20, 6],
            ],
            '#929b8c',
          );
          softRect(-11, -50, 23, 21, '#a3ae9e');
          softRect(-8, -41, 5, 3, '#e0c785');
          softRect(5, -41, 5, 3, '#e0c785');
          softPoly(
            [
              [-7, -19],
              [0, -27],
              [9, -19],
              [0, -7],
            ],
            '#edc282',
          );
          softPoly(
            [
              [-25, -22],
              [-39, -15],
              [-36, 9],
              [-24, 7],
            ],
            '#7b8a82',
          );
          softPoly(
            [
              [24, -22],
              [38, -14],
              [37, 9],
              [25, 7],
            ],
            '#7b8a82',
          );
          line(
            [
              [-15, -29],
              [-5, -21],
              [-13, -5],
            ],
            '#596d67',
          );
          for (const side of [-1, 1]) {
            oval(side * 12, 3, 4, 4, '#4d695e');
            poly(
              [
                [side * 8, 5],
                [side * 18, 5],
                [side * 18, 16],
                [side * 12, 18],
              ],
              '#aab8a2',
            );
            line(
              [
                [side * 26, -13],
                [side * 33, -10],
                [side * 32, 4],
              ],
              '#b6c5b0',
              1.5,
            );
            for (const y of [1, 5])
              line(
                [
                  [side * 27, y],
                  [side * 34, y],
                ],
                '#4c6e60',
                1,
              );
          }
          poly(
            [
              [-21, -24],
              [-11, -32],
              [-8, -26],
              [-16, -17],
            ],
            '#bac6ac',
          );
          line(
            [
              [-10, -47],
              [8, -47],
            ],
            '#d0d4b7',
            1.4,
          );
          break;
        case 'warlord':
          orcBody('governor');
          break;
        case 'cindermaw':
          scorpionBody(true);
          break;
        case 'citadel':
          marshalVeyra();
          break;
        case 'darklord':
          crownedHero('paladin', true);
          shaped('#596274', () => {
            ctx.moveTo(-10, -31);
            ctx.lineTo(-10, -43);
            ctx.quadraticCurveTo(0, -55, 11, -43);
            ctx.lineTo(10, -31);
            ctx.lineTo(5, -35);
            ctx.lineTo(-5, -35);
          });
          line(
            [
              [-5, -33],
              [-2, -33],
            ],
            '#d8a896',
            1.5,
          );
          line(
            [
              [3, -33],
              [6, -33],
            ],
            '#d8a896',
            1.5,
          );
          royalCrown(-44);
          break;
        default:
          humanoid('#897773');
      }
      if (e.family === 'citadel') bossPolish(e.family, true);
      if (
        ![
          'thorn',
          'mire',
          'crypt',
          'archive',
          'ridge',
          'abyss',
          'cindermaw',
          'darklord',
          'citadel',
        ].includes(e.family) &&
        e.captainProfile !== 'supply-highlands'
      ) {
        bossFinish(e.family);
        bossPolish(e.family);
      }
    } else {
      if (e.captain || e.roomCaptain) {
        const s = e.visualScale || 1.18;
        ctx.scale(s, s);
      }
      if (e.crownTroop && !e.mountedCrownRider) crownSoldier();
      else
        switch (e.species) {
          case 'skeleton':
            skeletonBody();
            break;
          case 'wolf':
            if (e.mountedCrownRider) crownDirewolfRider(!!e.ranged);
            else
              wolf(
                !e.charmOrigin && region === 2
                  ? ['#7b5b43', '#b69a6d', '#a46543'][variant % 3]
                  : undefined,
              );
            break;
          case 'mireling':
            if (e.ranged) {
              crocodile('#687a61');
              line(
                [
                  [-20, -8],
                  [13, 7],
                ],
                '#8d7352',
                3,
              );
              rect(-4, -4, 10, 9, '#745d45');
              poly(
                [
                  [18, -10],
                  [28, -13],
                  [34, -7],
                  [27, -3],
                ],
                '#9a8660',
              );
            } else crocodile();
            break;
          case 'reedbeast':
            // Folded hind legs, webbed toes and a broad damp muzzle read as an amphibian.
            for (const side of [-1, 1]) {
              oval(side * 18, 6, 11, 7, '#738857');
              line(
                [
                  [side * 19, 3],
                  [side * 26, 10],
                  [side * 14, 13],
                ],
                '#9bab77',
                3,
              );
              for (const x of [13, 18, 23])
                line(
                  [
                    [side * 17, 11],
                    [side * x, 14],
                  ],
                  '#a7b888',
                  1.7,
                );
            }
            for (const side of [-1, 1]) {
              oval(side * 13, 4, 6, 8, '#8e9e69');
              line(
                [
                  [side * 12, 7],
                  [side * 17, 12],
                ],
                '#adba84',
                2.5,
              );
            }
            oval(0, -2, 19, 16, '#8d9c65');
            oval(0, 2, 12, 9, '#b1ba83');
            oval(0, -12, 19, 9, '#98a96e');
            for (const x of [-11, 11]) {
              oval(x, -17, 8, 7, '#a5b17a');
              oval(x, -18, 3, 3.5, '#34443c');
              fillOval(x - 1, -19, 1, 1.3, '#f5eaca');
            }
            line(
              [
                [-12, -7],
                [0, -4],
                [12, -7],
              ],
              '#526744',
              1.2,
            );
            for (const [x, y] of [
              [-9, -2],
              [9, 1],
              [-4, 5],
            ])
              oval(x, y, 1.7, 1.2, '#697e50');
            break;
          case 'ashbeast':
            scorpionBody();
            break;
          case 'goblin':
            goblinBody();
            break;
          case 'ogre':
            ogreBody(!!e.ranged);
            break;
          case 'archer':
            if (e.charmOrigin || region === 3) frontierRaider();
            else human('archer');
            break;
          case 'orc':
            orcBody(e.captainProfile === 'frontier-overseer' ? 'inspector' : 'soldier');
            break;
          case 'crownguard':
            crownSoldier();
            break;
          case 'wraith':
          case 'stalker':
          case 'summon': {
            const cloth = e.species === 'stalker' ? '#816a79' : '#6f9694';
            shaped(cloth, () => {
              ctx.moveTo(-10, -29);
              ctx.quadraticCurveTo(-4, -45, 3, -43);
              ctx.quadraticCurveTo(14, -35, 13, -21);
              ctx.lineTo(20, 9);
              ctx.quadraticCurveTo(13, 16, 7, 8);
              ctx.quadraticCurveTo(0, 17, -7, 9);
              ctx.quadraticCurveTo(-17, 18, -20, 10);
              ctx.lineTo(-12, -20);
            });
            oval(0, -27, 7, 9, '#2d4949');
            for (const x of [-3, 3])
              fillOval(x, -28, 1.1, 1.5, e.species === 'stalker' ? '#ddb0bc' : '#b8d9c3');
            line(
              [
                [-9, -26],
                [-5, -36],
                [1, -40],
                [8, -33],
                [11, -25],
              ],
              '#aec1ae',
              1.1,
            );
            for (const x of [-10, 8]) {
              ctx.strokeStyle = '#4c7372';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(x, -15);
              ctx.quadraticCurveTo(x - 4, 0, x + 2, 8);
              ctx.stroke();
            }
            line(
              [
                [10, -13],
                [18, -8],
                [21, -3],
              ],
              cloth,
              5,
            );
            oval(20, -3, 2.8, 3, '#b4c9b3');
            if (e.species === 'wraith') craftAt(24, 4, 0.5, () => lantern(0, -17));
            break;
          }
          default:
            humanoid('#919b81');
        }
      if (!e.crownTroop) enemyFinish();
      captainFinish();
    }
    if (e.hybrid && e.species === 'reedbeast') {
      oval(0, 0, 6, 3, '#628975');
      line(
        [
          [2, 1],
          [15, 5],
        ],
        '#c1a18e',
        2,
      );
    }
    if (e.rangedAim) {
      oval(0, -56, 5, 5, '#ead6a0');
    }
    if (e.form === 'true') {
      // Every TRUE boss shares a floating translucent status crown. The Dark
      // Lord also keeps his physical royal crown as part of his normal outfit.
      if (e.type !== 'boss') {
        ctx.save();
        ctx.globalAlpha = 0.32;
        ctx.strokeStyle = '#e5c876';
        ctx.lineWidth = 1.5;
        for (const r of [23, 30]) {
          ctx.beginPath();
          ctx.ellipse(0, 11, r, r * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      if (e.type === 'boss') {
        const [x, base] = {
          thorn: [18, -54],
          crypt: [0, -58],
          mire: [0, -32],
          archive: [0, -52],
          ridge: [0, -52],
          mine: [0, -56],
          warlord: [0, -52],
          abyss: [6, -62],
          citadel: [0, -62],
          cindermaw: [0, -59],
          darklord: [0, -62],
        }[e.family] || [0, -56];
        // Identical indicator design and scale, positioned above each anatomy.
        craftAt(x, base + 44 * 0.85, 0.85, () => spectralRoyalCrown());
      } else
        for (const x of [-11, 0, 11])
          fillOval(x, -47, e.type === 'boss' ? 1.4 : 0.9, 1.2, '#e8d9f1', 0.48);
    } else if (e.form === 'ringleader') {
      const military = ['orc', 'archer', 'crownguard'].includes(e.species);
      if (e.mountedCrownRider) {
        // Rank trim follows the elevated profile helmet, never the animal's chest.
        craftAt(0, 0, 1.14, () => {
          shaped('#9a6556', () => {
            ctx.moveTo(-5, -62);
            ctx.quadraticCurveTo(-7, -74, 2, -75);
            ctx.lineTo(6, -69);
            ctx.quadraticCurveTo(-1, -72, -1, -62);
          });
          line(
            [
              [-5, -57],
              [0, -60],
              [5, -59],
            ],
            '#e4c682',
            1.8,
          );
        });
      } else if (military) militaryRingleaderFinish();
      else {
        rect(-4, -47, 8, 8, gold);
        poly(
          [
            [-12, -40],
            [-15, -49],
            [-5, -45],
            [0, -53],
            [5, -45],
            [15, -49],
            [12, -40],
          ],
          gold,
        );
        for (const x of [-16, 16])
          line(
            [
              [x, -12],
              [x * 1.2, -24],
            ],
            '#d5b36e',
            2,
          );
        glint(0, -51, '#fff0b7', 1.5);
      }
      if (e.frenzy) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#ef8c63';
        ctx.lineWidth = 2.5;
        for (const r of [25, 32]) {
          ctx.beginPath();
          ctx.ellipse(0, 10, r, r * 0.27, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        for (const x of [-19, 19]) glint(x, -21, '#ff9f6b', 2);
      }
    }
    ctx.restore();
    frontierTreeShoots(ctx, e, p, region);
  }
  function unscaledHeight(e) {
    if (e.greenwoodNature === 'tree') return 140;
    if (e.greenwoodFacility === 'mill') return 160;
    if (e.miningFacility) return 90;
    if (e.highlandsNature === 'tree') return 110;
    if (e.structure === 'crown-orrery') return 165;
    if (e.structure === 'watchpost') return 95;
    if (e.structure === 'frontier-grain-silo') return 165;
    if (e.structure === 'frontier-civic-fountain') return 110;
    if (e.type === 'pet') return 58;
    if (e.mountedCrownRider) return 99;
    if (e.type === 'boss') return e.form === 'true' ? 140 : 102;
    if (e.captain || e.roomCaptain) return 68;
    if (e.renderKind === 'building' && e.kind === 'barracks') return 88;
    if (
      e.renderKind === 'prop' &&
      [
        'crown-levy-yard',
        'crown-command-post',
        'ashbeast-roost-scene',
        'cindermaw-hoard-scene',
        'cindermaw-ash-den',
        'dreadmaw-vault-post',
        'crown-logistics-bay',
        'crown-fortress-checkpoint',
        'citadel-muster',
        'citadel-command',
        'citadel-ritual-array',
        'citadel-barracks-bay',
        'citadel-forge-bay',
        'citadel-boss-approach',
      ].includes(e.structure)
    )
      return 76;
    if ((e.renderKind === 'hero' && e.class === 'mage') || e.renderKind === 'prop') return 64;
    if (e.kind === 'transport') return e.icon === '🐉' ? 82 : e.icon === '⛵' ? 76 : 70;
    if (['dungeon', 'exit'].includes(e.kind)) return 64;
    return 54;
  }
  function height(e) {
    const scale =
      featureScale(e) > 1 && Number.isFinite(e.visualScale) && e.visualScale > 0
        ? e.visualScale
        : 1;
    return unscaledHeight(e) * scale;
  }

  // Lore-driven recovery zones derive from the named Frontier scenery anchors.
  // Rendered ground is presentation only; no geometry or save changes.
  const frontierGroundProfiles = [
    ['old-siege-margin', 460, 340, 0.86, '105,128,78'],
    ['hamlet-approach', 455, 345, 0.85, '100,122,76'],
    ['burned-hamlet', 370, 330, 0.73, '118,124,80'],
    ['lower-recovered-slope', 500, 435, 0.85, '100,122,76'],
    ['western-woodland', 510, 515, 0.92, '91,123,78'],
    ['old-char', 565, 370, 0.61, '115,125,83'],
    ['repaired-supply-road', 405, 315, 0.47, '116,122,84'],
    ['bastion-outskirts', 365, 300, 0.35, '122,124,89'],
    ['ravine-safe-bank', 355, 300, 0.5, '111,124,89'],
    ['east-flank', 355, 575, 0.52, '108,122,85'],
    ['fortified-road', 370, 310, 0.36, '112,119,82'],
  ];
  const frontierGroundZones = frontierGroundProfiles
    .map(([name, rx, ry, strength, rgb]) => {
      const sites = R.frontierRecoveryScenes.filter((row) => row[3] === name);
      if (!sites.length) return null;
      const x = sites.reduce((sum, row) => sum + row[0], 0) / sites.length,
        y = sites.reduce((sum, row) => sum + row[1], 0) / sites.length;
      return { name, x, y, rx, ry, strength, rgb };
    })
    .filter(Boolean);
  function frontierGroundRecoveryAt(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    // Slowly warped ellipse edges avoid stamped circles and tile boundaries.
    const a = x + 35 * Math.sin(y / 205 + x / 510),
      b = y + 28 * Math.cos(x / 225 - y / 480);
    let cover = 0;
    for (const z of frontierGroundZones) {
      const dx = (a - z.x) / z.rx,
        dy = (b - z.y) / z.ry,
        d2 = dx * dx + dy * dy;
      if (d2 >= 1) continue;
      const t = 1 - d2;
      cover = Math.max(cover, z.strength * t * t * (3 - 2 * t));
    }
    // Recovery is a connected landscape, not individual circular patches.
    // Settled western country gradually yields to the active eastern front.
    const westernSoil = Math.max(0, Math.min(1, (1900 - a) / 1700));
    cover = Math.max(cover, westernSoil * (0.28 + 0.025 * Math.sin(y / 360 + x / 690)));
    // Neither the interior of the ravine nor its raw eroded banks recover.
    const [left, right] = R.channelBanks(3, y),
      distance = Math.max(left - x, x - right),
      bankFade = Math.max(0, Math.min(1, (distance - 25) / 140));
    return cover * bankFade;
  }
  const floorPalettes = [
    ['#294b36', '#31583e', '#203e30', '#95ad80'],
    ['#3e5544', '#4b614b', '#30483c', '#a2b48e'],
    ['#4a593b', '#74734b', '#3b4d36', '#c6b079'],
    ['#50413b', '#5d4b42', '#423732', '#b9987b'],
    ['#343644', '#414351', '#2c2f3c', '#a09b9e'],
  ];
  const dungeonFloors = {
    crypt: ['#453843', '#57414a', '#342b39', '#c9a16e'],
    archive: ['#30464a', '#3b5558', '#283d42', '#8fb6b4'],
    mine: ['#44433b', '#524f43', '#39382f', '#ada88c'],
    abyss: ['#44373b', '#544349', '#382f34', '#c09a89'],
    citadel: ['#3b414b', '#494f59', '#303640', '#abb3b5'],
  };
  const treasuryFloors = {
    'supply-vale': ['#514735', '#5e523c', '#433b2e', '#bca978'],
    'supply-march': ['#3f5149', '#4b6258', '#33443f', '#9fb69c'],
    'supply-highlands': ['#55534b', '#636056', '#46443e', '#b9ae91'],
    'supply-crown': ['#44404b', '#514b59', '#37343e', '#aa96b0'],
  };
  function groundDetail(ctx, p, seed, region, room, dungeonId, colors, worldX = 0, worldY = 0) {
    if (seed % 3 === 0) return;
    const dx = (seed % 35) - 17,
      dy = ((seed >>> 5) % 15) + 12,
      k = (seed >>> 9) % 8,
      x = p.x + dx,
      y = p.y + dy;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const line = (x1, y1, x2, y2, c, w = 1) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    const dot = (cx, cy, r, c) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };
    if (room || dungeonId) {
      if (dungeonId === 'supply-crown') {
        if (k < 3) {
          line(x - 10, y + 2, x - 2, y - 4, '#1f1d2455', 1.2);
          line(x - 2, y - 4, x + 6, y + 1, '#1f1d2455', 1.2);
          line(x + 6, y + 1, x + 11, y - 3, '#1f1d2455', 1.2);
        } else if (k === 3) {
          for (const [ox, oy] of [
            [-5, 1],
            [1, -2],
            [6, 2],
          ])
            dot(x + ox, y + oy, 1.7, '#8d758f88');
        } else if (k === 4) {
          line(x - 8, y + 2, x + 7, y - 1, '#5f4c46', 2);
          dot(x + 2, y - 3, 1.2, '#b87552');
        } else if (k === 5) {
          dot(x - 3, y, 2, '#4a454f');
          dot(x + 3, y + 1, 1.5, '#6f5f70');
        }
      } else {
        if (k < 3) {
          line(x - 9, y, x - 2, y - 3, '#171d1b55', 1);
          line(x - 2, y - 3, x + 5, y + 1, '#171d1b55', 1);
          line(x + 5, y + 1, x + 10, y - 2, '#171d1b55', 1);
        } else if (k === 3) {
          for (const [ox, oy] of [
            [-5, 1],
            [1, -2],
            [6, 2],
          ])
            dot(x + ox, y + oy, 1.7, '#b0a88b88');
        } else if (k === 4) {
          line(x - 7, y + 2, x + 6, y - 2, '#76654a', 2);
          line(x - 3, y - 2, x - 5, y - 6, '#a18c63', 1);
        } else if (k === 5) {
          dot(x - 3, y, 2, '#776b5f');
          dot(x + 2, y + 1, 1.5, '#a58e72');
        }
      }
      ctx.restore();
      return;
    }
    if (region === 0) {
      if (k < 3) {
        for (const ox of [-5, 0, 5])
          line(
            x + ox,
            y + 3,
            x + ox + (ox === 0 ? 1 : -Math.sign(ox) * 2),
            y - 5 - (seed % 3),
            '#91aa78',
            1.2,
          );
      } else if (k === 3) {
        line(x - 7, y + 2, x + 7, y - 3, '#8a6d49', 2);
        line(x - 2, y - 1, x - 5, y - 5, '#6f553d', 1);
      } else if (k === 4) {
        // Tiny dandelions replace the old beige, miniature-tree ground mark.
        // Stable tile variation keeps them organic and free to cache.
        const lean = seed % 2 ? 1.5 : -1,
          height = 9 + (seed % 3),
          headX = x - 3 + lean,
          headY = y + 5 - height;
        ctx.strokeStyle = '#90ad68';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - 3, y + 5);
        ctx.quadraticCurveTo(x - 3 + lean * 0.35, y, headX, headY);
        ctx.stroke();
        for (const side of [-1, 1]) {
          ctx.fillStyle = side < 0 ? '#6f9452' : '#85a65c';
          ctx.beginPath();
          ctx.moveTo(x - 3, y + 5);
          ctx.lineTo(x - 3 + side * 6, y + 1);
          ctx.lineTo(x - 3 + side * 4, y + 4);
          ctx.lineTo(x - 3 + side * 7, y + 3);
          ctx.quadraticCurveTo(x + side * 3, y + 7, x - 3, y + 5);
          ctx.fill();
        }
        // Open filaments and little parachute tips, rather than a solid disc.
        const radius = 3.5 + (seed % 2) * 0.5;
        dot(headX, headY, radius * 0.8, '#f1eed914');
        for (let j = 0; j < 16; j++) {
          const angle = (j / 16) * Math.PI * 2 + (seed % 7) * 0.14,
            reach = radius * (0.78 + ((j * 7 + seed) % 5) * 0.055),
            dx = Math.cos(angle),
            dy = Math.sin(angle),
            px = headX + dx * reach,
            py = headY + dy * reach;
          line(headX, headY, px, py, '#dedfc16e', 0.4);
          // Separated little Y-shaped parachutes, no connected circular rim.
          for (const side of [-1, 1])
            line(
              px - dx * 0.55,
              py - dy * 0.55,
              px - dy * side * 0.42,
              py + dx * side * 0.42,
              '#f1eed9dd',
              0.5,
            );
        }
        dot(headX, headY + 0.3, 0.8, '#b9af7f');
      } else if (k === 5) {
        for (const [ox, c] of [
          [-4, '#d9bd7b'],
          [2, '#d7a5ad'],
          [6, '#e6dfb1'],
        ])
          dot(x + ox, y + (ox % 3), 1.5, c);
      } else {
        for (const [ox, oy] of [
          [-5, 1],
          [0, -1],
          [5, 2],
        ])
          dot(x + ox, y + oy, 1.5, '#7c8972');
      }
    } else if (region === 1) {
      if (k < 3) {
        for (const ox of [-6, -2, 3, 7])
          line(x + ox, y + 4, x + ox + (ox % 2), y - 7 - (seed % 4), '#76906f', 1.3);
      } else if (k === 3) {
        dot(x, y, 4, '#6f8f83');
        dot(x + 1, y - 1, 2.5, '#9bb7a5');
      } else if (k === 4) {
        line(x - 8, y + 2, x + 6, y - 3, '#7b6748', 2);
        dot(x + 7, y - 3, 1.5, '#b8b18b');
      } else {
        for (const [ox, oy] of [
          [-5, 1],
          [1, -1],
          [6, 2],
        ])
          dot(x + ox, y + oy, 1.4, '#708c83');
      }
    } else if (region === 2) {
      if (k < 2) {
        for (const ox of [-5, 0, 5]) line(x + ox, y + 3, x + ox + 2, y - 3, '#9eaa68', 1);
      } else if (k < 6) {
        for (let j = 0; j < 5; j++) {
          const lx = x + Math.sin(seed + j * 2.4) * 10,
            ly = y + (j % 3) * 2;
          ctx.fillStyle = ['#b18a46', '#a35b3b', '#c7ad62', '#78904d'][j % 4];
          ctx.beginPath();
          ctx.ellipse(lx, ly, 2.8, 1.2, j * 0.7, 0, Math.PI * 2);
          ctx.fill();
          line(lx - 2, ly + 1, lx + 2, ly - 1, '#63533b', 0.45);
        }
      } else {
        dot(x - 4, y, 1.5, '#a4a58a');
        dot(x + 3, y + 1, 1.8, '#75826b');
      }
    } else if (region === 3) {
      const recovery = frontierGroundRecoveryAt(worldX, worldY);
      // Uniform color washes erase the dusty grain that once came from T004.
      // Put weathered, sub-pixel ash/soil sediment back in world-seeded detail:
      // warm mineral flecks in war scars, cooler earth around regrowth.
      const settled = recovery > 0.23;
      for (let j = 0; j < 3; j++) {
        const shift = j * 7,
          nx = x + ((seed >>> shift) % 25) - 12,
          ny = y + ((seed >>> (shift + 3)) % 13) - 3;
        dot(
          nx,
          ny,
          0.8 + ((seed >>> (shift + 2)) % 3) * 0.32,
          settled
            ? ['#817b60', '#6d7056', '#9a8a6b'][j]
            : ['#8d7662', '#685d55', '#a08b72'][j],
        );
      }
      if (seed % 11 === 4)
        line(x - 10, y + 6, x - 2, y + 3, settled ? '#76765c99' : '#8b6d5899', 0.7);
      if (recovery > 0.16 && seed % 23 < recovery * 14) {
        // New pioneer stems appear among, not instead of, charcoal and grit.
        for (const offset of [-5, 0, 5]) {
          const height = 4 + ((seed + offset + 20) % 5);
          line(x + offset, y + 3, x + offset + (offset < 0 ? -2 : 2), y + 3 - height,
            offset ? '#87946e' : '#9aab7c', 0.9);
        }
        dot(x + 1, y + 1, 1.7, '#6c7958');
      } else if (k < 3) {
        line(x - 7, y + 3, x - 1, y - 6, '#72594b', 1.5);
        line(x - 1, y - 6, x + 5, y + 2, '#72594b', 1.5);
      } else if (k === 3) {
        for (const [ox, oy] of [
          [-5, 1],
          [0, -1],
          [5, 2],
        ])
          dot(x + ox, y + oy, 1.6, '#4d4c45');
      } else if (k === 4) {
        line(x - 8, y + 2, x + 8, y - 2, '#4f4138', 3);
        line(x - 2, y, x + 1, y - 5, '#9b6b4e', 1);
      } else if (k === 5) {
        dot(x, y, 2.2, '#b66f49');
        dot(x + 1, y - 1, 1, '#efad6e');
      } else {
        line(x - 5, y + 2, x + 6, y - 1, '#b8aa8a', 1.3);
        dot(x - 6, y + 2, 2, '#d2c7a9');
      }
    } else {
      if (k < 3) {
        for (const [ox, oy] of [
          [-6, 1],
          [0, -2],
          [6, 2],
        ]) {
          dot(x + ox, y + oy, 2, '#55515d');
          line(x + ox - 1, y + oy, x + ox + 2, y + oy - 3, '#8a7e96', 1);
        }
      } else if (k === 3) {
        ctx.fillStyle = '#8071a0';
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 3);
        ctx.lineTo(x, y - 7);
        ctx.lineTo(x + 4, y + 3);
        ctx.closePath();
        ctx.fill();
        dot(x, y - 3, 1, '#d4bfe7');
      } else if (k === 4) {
        line(x - 7, y + 2, x + 7, y - 2, '#6f5a4e', 2);
        dot(x - 8, y + 2, 2, '#c4b79f');
      } else {
        for (const [ox, oy] of [
          [-5, 1],
          [1, -1],
          [6, 2],
        ])
          dot(x + ox, y + oy, 1.4, '#77717d');
      }
    }
    ctx.restore();
  }
  function floor(
    ctx,
    p,
    x,
    y,
    region = 0,
    room = false,
    dungeonId = '',
    blocked = false,
    materials = null,
  ) {
    const colors = room
      ? treasuryFloors[dungeonId] || ['#403d35', '#4d493e', '#343229', '#b6a98a']
      : dungeonFloors[dungeonId] || floorPalettes[region];
    const tileX = Math.floor(x / 80),
      tileY = Math.floor(y / 80),
      seed = (Math.imul(tileX + 19, 73856093) ^ Math.imul(tileY + 37, 19349663)) >>> 0;
    const outdoor = !room && !dungeonId;
    let color = blocked
      ? '#737c70'
      : seed % 7 === 0
        ? colors[1]
        : seed % 11 === 0
          ? colors[2]
          : colors[0];
    if (outdoor) color = colors[0];
    if (outdoor && region === 0 && R.greenwoodLayout?.version === 2) color = '#4b6741';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 60.8, p.y + 21.6);
    ctx.lineTo(p.x, p.y + 43.2);
    ctx.lineTo(p.x - 60.8, p.y + 21.6);
    ctx.closePath();
    ctx.fill();
    if (outdoor) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    if (
      !blocked &&
      materials &&
      !(outdoor && ([2, 3].includes(region) || (region === 0 && R.greenwoodLayout?.version === 2))) &&
      dungeonId !== 'supply-highlands'
    ) {
      const regionName = ['vale', 'march', 'highlands', 'frontier', 'crown'][region];
      const key =
        'terrain:' +
        (outdoor ? 'ground:' + regionName : 'floor:' + (room ? 'supply-' + regionName : dungeonId));
      const projection = (q) => ({
        x: p.x + (q.x - x - (q.y - y)) * 0.76,
        y: p.y + (q.x - x + (q.y - y)) * 0.27,
      });
      materials.paint(ctx, key, projection, [
        { x, y },
        { x: x + 80, y },
        { x: x + 80, y: y + 80 },
        { x, y: y + 80 },
      ]);
    }
    if ((!materials || (outdoor && region === 3)) && !blocked) {
      ctx.save();
      ctx.globalAlpha = outdoor ? 0.055 : 0.035;
      ctx.fillStyle = colors[1];
      ctx.beginPath();
      ctx.moveTo(p.x - 29, p.y + 20);
      ctx.bezierCurveTo(p.x - 20, p.y + 10, p.x + 4, p.y + 14, p.x + 26, p.y + 19);
      ctx.quadraticCurveTo(p.x + 12, p.y + 28, p.x - 14, p.y + 27);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Slab joints belong to built interiors; natural ground has continuous material variation.
    if (!outdoor) {
      ctx.save();
      ctx.globalAlpha = blocked ? 0.055 : 0.035;
      ctx.fillStyle = colors[3] || '#d8d2aa';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 1);
      ctx.lineTo(p.x + 58, p.y + 21.6);
      ctx.lineTo(p.x, p.y + 25);
      ctx.lineTo(p.x - 58, p.y + 21.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#f0ead01a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x - 60.8, p.y + 21.6);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(p.x + 60.8, p.y + 21.6);
      ctx.stroke();
      ctx.strokeStyle = '#08161145';
      ctx.beginPath();
      ctx.moveTo(p.x - 60.8, p.y + 21.6);
      ctx.lineTo(p.x, p.y + 43.2);
      ctx.lineTo(p.x + 60.8, p.y + 21.6);
      ctx.stroke();
      if (blocked && seed % 4 === 0) {
        ctx.strokeStyle = '#303a3566';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x - 14, p.y + 18);
        ctx.lineTo(p.x - 4, p.y + 14);
        ctx.lineTo(p.x + 5, p.y + 19);
        ctx.lineTo(p.x + 14, p.y + 15);
        ctx.stroke();
      }
    }
    if (!blocked) groundDetail(ctx, p, seed, region, room, dungeonId, colors, x + 40, y + 40);
  }
  // Culling uses logical viewport units, not backing-store pixels.
  function outsideScreen(points, viewport, margin = 0) {
    return (
      points.every((p) => p.x < -margin) ||
      points.every((p) => p.x > viewport.width + margin) ||
      points.every((p) => p.y < -margin) ||
      points.every((p) => p.y > viewport.height + margin)
    );
  }
  // World-space surfaces avoid losing narrow barriers between coarse tile samples.
  // Original water/lava motion as a small, read-only list of screen-space
  // strokes. Pixi's immutable 512px terrain tiles must omit ONLY these strokes,
  // then draw the same authored ripples over the cached background.
  // No new animation family, biome, palette or saved/gameplay state.
  function terrainMotionLines(region, screen, viewport, time) {
    if (!Number.isInteger(region) || region < 0 || region >= R.barriers.length ||
        typeof screen !== 'function' || !Number.isFinite(time)) return [];
    const bounds = viewport || {width:10000,height:10000}, lines = [];
    const visible = (q) => {
      const p = screen(q);
      return p.x > -150 && p.x < bounds.width + 150 &&
        p.y > -150 && p.y < bounds.height + 150;
    };
    const line = (from,to,color,width) => {
      const a = screen(from), b = screen(to);
      if (![a.x,a.y,b.x,b.y].every(Number.isFinite)) return;
      if (Math.max(a.x,b.x) < -30 || Math.min(a.x,b.x) > bounds.width+30 ||
          Math.max(a.y,b.y) < -30 || Math.min(a.y,b.y) > bounds.height+30) return;
      lines.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,color,width});
    };
    const strip = (kind,x1,x2,y1,y2,banks=null) => {
      if (!['water','lava'].includes(kind) || y2 <= y1) return;
      const water = kind === 'water';
      for (let y=y1+24; y<y2-8; y+=water?62:48) {
        // Original bridge decks cover the channel in these authored gaps.
        // The new live GPU layer sits above the retained ground raster, so
        // avoid exposing highlights through a solid crossing.
        if (banks && R.barriers[region].gaps.some(([lo,hi])=>y>=lo-18&&y<=hi+18))
          continue;
        const [lo,hi] = banks ? banks(y) : [x1,x2];
        const localWidth=hi-lo, center={x:(lo+hi)/2,y};
        if (!visible(center)) continue;
        const phase=Math.sin(time*(water?0.9:1.3)+y*0.035),
          seed=Math.abs(Math.floor(y*13+region*47));
        if (water) {
          const x=lo+localWidth*(0.28+(seed%4)*0.1),
            span=Math.min(55,localWidth*0.38);
          line({x,y:y+phase*3},{x:x+span,y:y+5+phase*3},'#9abeb788',1.2);
        } else {
          const mid=lo+localWidth*(0.4+(seed%3)*0.08);
          line({x:mid-10,y},{x:mid+8,y:y+11+phase*3},'#ffd076',2);
          line({x:mid+8,y:y+11+phase*3},{x:mid-4,y:y+27},'#ed963f',1.5);
        }
      }
    };
    const barrier=R.barriers[region];
    strip(barrier.kind,...barrier.bounds,y=>R.channelBanks(region,y));
    const harbor=R.harbors?.[['vale','march','highlands','frontier','crown'][region]];
    if (harbor?.water && !harbor.water.points) {
      const w=harbor.water;
      strip('water',w.x1,w.x2,w.y1,w.y2);
    }
    for (const p of R.terrain[region] || []) {
      const kind=p.kind||'cliff';
      if (kind==='rain-pools') {
        for (const pool of p.pools)
          for (const offset of [-0.35,0.15,0.48]) {
            const y=pool.y+pool.ry*offset,
              x=pool.x-13+Math.sin(time*0.7+offset)*3;
            line({x,y},{x:x+23,y:y+3},'#a4c2b688',1);
          }
        continue;
      }
      if (p.r) {
        if (kind==='water')
          for (let j=0;j<4;j++) {
            const y=p.y+(j-1.5)*p.r*0.3,
              x=p.x-p.r*0.25+Math.sin(time*0.8+j)*5;
            line({x,y},{x:x+p.r*0.45,y:y+5},'#b4d4c388',1);
          }
      } else if (kind==='water'||kind==='lava') {
        let at=p.y1;
        for (const [lo,hi] of p.gaps||[]) {
          strip(kind,p.x1,p.x2,at,lo);at=hi;
        }
        strip(kind,p.x1,p.x2,at,p.y2);
      }
    }
    return lines;
  }

  function terrain(
    ctx,
    screen,
    region = 0,
    size = 3000,
    materialLayer = null,
    viewport = null,
    inheritedDecks = [],
    staticTerrainTimeSeconds = null,
    omitTerrainMotion = false,
  ) {
    const bounds = viewport || {
      width: ctx.canvas?.width || 10000,
      height: ctx.canvas?.height || 10000,
    };
    // A full-region atlas spans several event-loop frames. Reuse one water
    // animation phase across its tiles so a river cannot develop seams just
    // because one tile was painted a moment later. Normal live Canvas uses
    // the original animated clock, unchanged.
    const time = Number.isFinite(staticTerrainTimeSeconds)
      ? staticTerrainTimeSeconds
      : (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
    const poly = (points, color, material = null) => {
      const ps = points.map(screen);
      if (outsideScreen(ps, bounds, 100)) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ps.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      if (material) materialLayer?.paint(ctx, material, screen, points);
    };
    const rect = (x1, x2, y1, y2, color, material = null) =>
      poly(
        [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
        ],
        color,
        material,
      );
    const line = (a, b, color, width = 1) => {
      a = screen(a);
      b = screen(b);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    const visible = (q) => {
      const p = screen(q);
      return p.x > -150 && p.x < bounds.width + 150 && p.y > -150 && p.y < bounds.height + 150;
    };
    const strip = (kind, x1, x2, y1, y2, banks = null) => {
      if (y2 <= y1) return;
      // Skip channels fully outside the viewport before expanding their paths.
      if (
        viewport &&
        outsideScreen(
          [
            { x: x1 - 10, y: y1 },
            { x: x2 + 10, y: y1 },
            { x: x1 - 10, y: y2 },
            { x: x2 + 10, y: y2 },
          ].map(screen),
          bounds,
          180,
        )
      )
        return;
      const water = kind === 'water',
        lava = kind === 'lava',
        cliff = kind === 'cliff',
        width = x2 - x1,
        bank = water ? (region === 1 ? '#677561' : '#64725a') : lava ? '#54413e' : '#726c5d';
      const ribbon = (inset, color, material = null) => {
        if (!banks) return rect(x1 + inset, x2 - inset, y1, y2, color, material);
        const left = [],
          right = [];
        for (let y = y1; y <= y2; y = Math.min(y2, y + 12)) {
          const [lo, hi] = banks(y);
          left.push({ x: lo + inset, y });
          right.push({ x: hi - inset, y });
          if (y === y2) break;
        }
        poly([...left, ...right.reverse()], color, material);
      };
      // Collision and the continuous curved bank use the same authored function.
      ribbon(-8, bank);
      ribbon(0, water ? '#285d70' : lava ? '#672f28' : cliff ? '#494b43' : '#222729');
      ribbon(
        7,
        water ? '#397783' : lava ? '#b44e2c' : cliff ? '#616357' : '#30363a',
        water ? null : lava ? 'terrain:lava:crust' : 'terrain:rock:cliff-ravine',
      );
      for (let y = y1; y < y2; y += 58) {
        const end = Math.min(y2, y + 58),
          seed = Math.imul(Math.floor(y / 58) + region * 17, 73856093) >>> 0,
          tooth = 8 + (seed % 12);
        for (const side of [-1, 1]) {
          const local = banks ? banks(y) : [x1, x2],
            edge = side < 0 ? local[0] : local[1],
            inside = edge - side * Math.min(tooth, width * 0.25),
            mid = y + (end - y) * (0.3 + (seed % 4) * 0.1);
          poly(
            [
              { x: edge, y },
              { x: inside, y: mid },
              { x: edge - side * 6, y: end },
              { x: edge, y: end },
            ],
            water
              ? side < 0
                ? '#536a57'
                : '#6a7c64'
              : lava
                ? seed % 2
                  ? '#423b3b'
                  : '#574039'
                : side < 0
                  ? '#696b61'
                  : '#4b514c',
          );
          if (!water && !lava)
            line({ x: edge - side * 3, y: y + 10 }, { x: inside, y: mid }, '#a3a18b77', 1);
          if (water)
            line({ x: edge - side * 2, y: y + 8 }, { x: inside, y: mid }, '#afc0a044', 1.3);
          else if (lava)
            line({ x: edge - side * 4, y: y + 12 }, { x: inside, y: mid }, '#b5917855', 1);
        }
      }
      for (let y = y1 + 24; y < y2 - 8; y += water ? 62 : 48) {
        const [localX1, localX2] = banks ? banks(y) : [x1, x2],
          localWidth = localX2 - localX1,
          q = { x: (localX1 + localX2) / 2, y };
        if (!visible(q)) continue;
        const phase = Math.sin(time * (water ? 0.9 : 1.3) + y * 0.035),
          seed = Math.abs(Math.floor(y * 13 + region * 47));
        if (water) {
          const x = localX1 + localWidth * (0.28 + (seed % 4) * 0.1),
            span = Math.min(55, localWidth * 0.38);
          if (!omitTerrainMotion)
            line({ x, y: y + phase * 3 }, { x: x + span, y: y + 5 + phase * 3 }, '#9abeb788', 1.2);
          line(
            { x: x + span * 0.15, y: y + 12 },
            { x: x + span * 0.65, y: y + 14 },
            '#c0d6c044',
            0.8,
          );
        } else if (lava) {
          const mid = localX1 + localWidth * (0.4 + (seed % 3) * 0.08);
          if (!omitTerrainMotion) {
            line({ x: mid - 10, y }, { x: mid + 8, y: y + 11 + phase * 3 }, '#ffd076', 2);
            line({ x: mid + 8, y: y + 11 + phase * 3 }, { x: mid - 4, y: y + 27 }, '#ed963f', 1.5);
          }
          poly(
            [
              { x: x1 + width * 0.24, y: y + 28 },
              { x: x1 + width * 0.38, y: y + 32 },
              { x: x1 + width * 0.45, y: y + 39 },
              { x: x1 + width * 0.22, y: y + 36 },
            ],
            '#4b3633',
          );
        } else {
          const x = x1 + width * 0.3;
          line({ x, y }, { x: x + width * 0.45, y: y + 12 }, cliff ? '#9a9b8777' : '#586067', 1.5);
          line(
            { x: x + width * 0.15, y: y + 7 },
            { x: x + width * 0.3, y: y + 26 },
            '#191f2388',
            2,
          );
        }
      }
      for (const side of [0, 1]) {
        for (let y = y1; y < y2; y += 24) {
          const end = Math.min(y2, y + 24),
            lo = banks ? banks(y)[side] : [x1, x2][side],
            hi = banks ? banks(end)[side] : [x1, x2][side];
          line(
            { x: lo, y },
            { x: hi, y: end },
            water ? '#aec6a888' : lava ? '#d6956866' : '#ada88c99',
            1.5,
          );
        }
      }
    };
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Broad feathered material patches are stable in world space, independent of tile and camera edges.
    ctx.save();
    ctx.beginPath();
    [
      { x: 0, y: 0 },
      { x: size, y: 0 },
      { x: size, y: size },
      { x: 0, y: size },
    ]
      .map(screen)
      .forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();
    const materials = [
      ['#75905a', '#182e24', '#92714b'],
      ['#6f785b', '#162f37', '#86734f'],
      ['#8c8b71', '#2a4438', '#b4a489'],
      ['#a08060', '#272628', '#775344'],
      ['#776183', '#181e28', '#555369'],
    ][region];
    for (let x = 160; x < size; x += 360)
      for (let y = 160; y < size; y += 360) {
        const seed =
            (Math.imul(x + 17, 73856093) ^ Math.imul(y + 37 + region * 11, 19349663)) >>> 0,
          q = screen({ x: x + (seed % 121) - 60, y: y + ((seed >>> 8) % 121) - 60 }),
          radius = 190 + (seed % 95),
          rx = radius * 0.76 * Math.SQRT2,
          ry = radius * 0.27 * Math.SQRT2;
        if (q.x + rx < 0 || q.x - rx > bounds.width || q.y + ry < 0 || q.y - ry > bounds.height)
          continue;
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.scale(1, 0.27 / 0.76);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx),
          color = materials[seed % 3];
        g.addColorStop(0, color + '50');
        g.addColorStop(0.45, color + '22');
        g.addColorStop(1, color + '00');
        ctx.fillStyle = g;
        ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
        ctx.restore();
      }

    if (region === 3) {
      // The country is recovering in selected cool-earth districts, not
      // uniformly greening. Roads, ravine, pools and buildings paint later.
      // A single restrained, west-to-east soil wash connects the old siege
      // verge and inhabited woodland. The local site washes supply variation,
      // rather than looking like unrelated green stamps on an ash background.
      const start = screen({ x: 0, y: 0 });
      ctx.save();
      ctx.transform(0.76, 0.27, -0.76, 0.27, start.x, start.y);
      const settledSoil = ctx.createLinearGradient(0, 0, 2000, 0);
      settledSoil.addColorStop(0, 'rgba(99,125,78,0.31)');
      settledSoil.addColorStop(0.45, 'rgba(101,123,81,0.21)');
      settledSoil.addColorStop(0.8, 'rgba(103,118,83,0.06)');
      settledSoil.addColorStop(1, 'rgba(103,118,83,0)');
      ctx.fillStyle = settledSoil;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
      for (const z of frontierGroundZones) {
        const p = screen({ x: z.x, y: z.y }),
          radius = (z.rx + z.ry) * 0.76;
        if (p.x < -radius - 100 || p.x > bounds.width + radius + 100 ||
            p.y < -radius - 100 || p.y > bounds.height + radius + 100) continue;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.transform(0.76, 0.27, -0.76, 0.27, 0, 0);
        ctx.scale(z.rx, z.ry);
        const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        wash.addColorStop(0, `rgba(${z.rgb},${(z.strength * 0.33).toFixed(3)})`);
        wash.addColorStop(0.46, `rgba(${z.rgb},${(z.strength * 0.22).toFixed(3)})`);
        wash.addColorStop(0.85, `rgba(${z.rgb},${(z.strength * 0.06).toFixed(3)})`);
        wash.addColorStop(1, `rgba(${z.rgb},0)`);
        ctx.fillStyle = wash;
        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      // Sparse rooted grass in world coordinates: no checkerboard tiling.
      // All static and viewport-culled, including Canvas and Pixi backgrounds.
      for (let x = 65; x < size; x += 135)
        for (let y = 80; y < size; y += 135) {
          const seed =
              (Math.imul(Math.floor(x / 135) + 17, 73856093) ^
                Math.imul(Math.floor(y / 135) + 29, 19349663)) >>> 0,
            wx = x + (seed % 35) - 17,
            wy = y + ((seed >>> 8) % 39) - 19;
          // Viewport check before the heavier lore-surface lookup. These tufts
          // are static cached terrain, not part of per-frame actor drawing.
          const p = screen({ x: wx, y: wy });
          if (p.x < -20 || p.y < -20 || p.x > bounds.width + 20 || p.y > bounds.height + 20)
            continue;
          const recovery = frontierGroundRecoveryAt(wx, wy);
          if (recovery < 0.24 || (seed % 101) / 101 > recovery * 0.8) continue;
          ctx.save();
          ctx.strokeStyle = seed % 3 ? '#879875' : '#a1a77a';
          ctx.lineWidth = 0.95;
          for (const offset of [-5, 0, 5]) {
            const height = 5 + ((seed + offset + 30) % 6);
            ctx.beginPath();
            ctx.moveTo(p.x + offset, p.y + 2);
            ctx.quadraticCurveTo(
              p.x + offset + 1,
              p.y - height * 0.55,
              p.x + offset + (offset < 0 ? -2 : 3),
              p.y - height,
            );
            ctx.stroke();
          }
          ctx.restore();
        }
    }
    ctx.restore();
    if (region === 0 && R.greenwoodLayout?.version === 2)
      GreenwoodLandscape.drawGround(ctx, screen, R.greenwoodLayout, bounds);
    const b = R.barriers[region];
    strip(b.kind, ...b.bounds, (y) => R.channelBanks(region, y));
    if (region === 1) {
      const left = [],
        right = [];
      for (let x = 0; x <= 1230; x += 15) {
        const { y, width } = R.drainageBanks(x);
        left.push({ x, y: y - width });
        right.push({ x, y: y + width });
      }
      poly([...left, ...right.reverse()], '#61785b88');
      poly(
        [
          ...left.map((p) => ({ x: p.x, y: p.y + 12 })),
          ...right
            .slice()
            .reverse()
            .map((p) => ({ x: p.x, y: p.y - 12 })),
        ],
        '#47736a99',
      );
    }
    if (region === 2) {
      // Snowmelt sits inside the ravine floor: an uneven wet bed and shallow
      // pools, not a constant-width stroke running down the map.
      const bed = [],
        water = [],
        samples = [];
      for (let y = b.bounds[2]; y <= b.bounds[3]; y = Math.min(b.bounds[3], y + 16)) {
        const [lo, hi] = R.channelBanks(region, y),
          width = hi - lo,
          center = (lo + hi) / 2 + Math.sin(y / 99) * width * 0.18 + Math.sin(y / 31) * 4,
          half = width * (0.055 + 0.09 * (0.5 + 0.5 * Math.sin(y / 83 + 0.7))),
          left = Math.max(lo + 18, center - half),
          right = Math.min(hi - 18, center + half);
        bed.push([
          { x: left - 4, y },
          { x: right + 4, y },
        ]);
        water.push([
          { x: left, y },
          { x: right, y },
        ]);
        samples.push({ y, left, right, half });
        if (y === b.bounds[3]) break;
      }
      const ribbon = (pairs) => [...pairs.map((p) => p[0]), ...pairs.map((p) => p[1]).reverse()];
      poly(ribbon(bed), '#354a4b');
      poly(ribbon(water), '#3d6269');
      for (let n = 6; n < samples.length - 3; n += 11) {
        const p = samples[n],
          mid = (p.left + p.right) / 2,
          q = screen({ x: mid, y: p.y });
        if (!visible({ x: mid, y: p.y })) continue;
        const sheen = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, 42);
        sheen.addColorStop(0, '#91b0a955');
        sheen.addColorStop(1, '#91b0a900');
        poly(ribbon(water.slice(n - 3, n + 4)), sheen);
        // Small exposed wet stones interrupt the edges and narrow the riffles.
        const x = n % 2 ? p.left + 2 : p.right - 2;
        poly(
          [
            { x: x - 3, y: p.y - 4 },
            { x: x + 4, y: p.y - 2 },
            { x: x + 5, y: p.y + 7 },
            { x: x - 2, y: p.y + 9 },
          ],
          '#515c58',
        );
        line({ x: x - 2, y: p.y - 3 }, { x: x + 3, y: p.y - 1 }, '#9b9c8877', 0.8);
      }
      // Short cross-current glints mark separate pools. They never join into
      // another bright centerline and remain beneath the existing bridge decks.
      for (let n = 4; n < samples.length; n += 9) {
        const p = samples[n],
          mid = (p.left + p.right) / 2;
        if (!visible({ x: mid, y: p.y })) continue;
        line({ x: p.left + 2, y: p.y }, { x: mid + p.half * 0.35, y: p.y + 2 }, '#9bb9b477', 0.9);
        if (p.half > 10)
          line({ x: mid - 2, y: p.y + 9 }, { x: p.right - 2, y: p.y + 11 }, '#71989866', 0.8);
      }
    }
    const harbor = R.harbors?.[['vale', 'march', 'highlands', 'frontier', 'crown'][region]];
    if (harbor) {
      const w = harbor.water,
        d = harbor.dock;
      if (w.points) {
        const bank = w.points.slice(0, w.bankCount);
        // The painted tide boundary is the same polygon used by collision.
        for (let j = 1; j < bank.length; j++) {
          const a = bank[j - 1],
            b = bank[j],
            len = Math.hypot(b.x - a.x, b.y - a.y),
            nx = ((region === 2 ? 1 : -1) * (b.y - a.y)) / len,
            ny = ((region === 2 ? -1 : 1) * (b.x - a.x)) / len;
          poly(
            [a, b, { x: b.x + nx * 62, y: b.y + ny * 62 }, { x: a.x + nx * 62, y: a.y + ny * 62 }],
            '#716e4f',
          );
          poly(
            [a, b, { x: b.x + nx * 24, y: b.y + ny * 24 }, { x: a.x + nx * 24, y: a.y + ny * 24 }],
            '#8a8060',
          );
        }
        poly(w.points, '#426e70');
        const deep = w.points.map((p, j) =>
          j < w.bankCount
            ? {
                x: Math.max(0, Math.min(size, p.x + (region === 2 ? -35 : 30))),
                y: Math.min(size, p.y + 28),
              }
            : p,
        );
        ctx.save();
        ctx.beginPath();
        w.points.map(screen).forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.clip();
        poly(deep, '#355d66');
        ctx.restore();
        for (let j = 1; j < bank.length; j++) {
          const a = bank[j - 1],
            b = bank[j],
            len = Math.hypot(b.x - a.x, b.y - a.y),
            nx = ((region === 2 ? 1 : -1) * (b.y - a.y)) / len,
            ny = ((region === 2 ? -1 : 1) * (b.x - a.x)) / len;
          for (let d = 30; d < len; d += 100) {
            const x = a.x + ((b.x - a.x) * d) / len,
              y = a.y + ((b.y - a.y) * d) / len;
            if (!visible({ x, y })) continue;
            line(
              { x: x - nx * 9, y: y - ny * 9 },
              {
                x: x + ((b.x - a.x) / len) * 32 - nx * 9,
                y: y + ((b.y - a.y) / len) * 32 - ny * 9,
              },
              '#b6ccac66',
              1,
            );
          }
        }
        // Raised timber follows the last leg through the coastal marsh.
        const walks = (harbor.boardwalk || [])
          .slice(1)
          .map((p, j) => [harbor.boardwalk[j].x, harbor.boardwalk[j].y, p.x, p.y]);
        for (const [ax, ay, bx, by] of walks) {
          const dx = bx - ax,
            dy = by - ay,
            len = Math.hypot(dx, dy),
            nx = -dy / len,
            ny = dx / len;
          poly(
            [
              { x: ax + nx * 31, y: ay + ny * 31 },
              { x: bx + nx * 31, y: by + ny * 31 },
              { x: bx - nx * 31, y: by - ny * 31 },
              { x: ax - nx * 31, y: ay - ny * 31 },
            ],
            '#786748',
          );
          for (let t = 12; t < len; t += 23) {
            const x = ax + (dx * t) / len,
              y = ay + (dy * t) / len;
            line(
              { x: x + nx * 29, y: y + ny * 29 },
              { x: x - nx * 29, y: y - ny * 29 },
              '#b6a17a',
              1.6,
            );
          }
        }
      } else strip('water', w.x1, w.x2, w.y1, w.y2);
      rect(d.x1, d.x2, d.y1, d.y2, '#594735');
      rect(d.x1 + 4, d.x2 - 4, d.y1 + 4, d.y2 - 4, region === 1 ? '#a1855c' : '#968265');
      for (let x = d.x1 + 10; x < d.x2 - 6; x += 22) {
        line({ x, y: d.y1 + 4 }, { x, y: d.y2 - 4 }, '#6f563d', 1);
        for (const y of [d.y1 + 9, d.y2 - 9]) {
          const p = screen({ x, y });
          ctx.fillStyle = '#504435';
          ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
        }
      }
      for (const y of [d.y1, d.y2]) {
        line({ x: d.x1, y }, { x: d.x2, y }, y === d.y1 ? '#d0b17a' : '#5a4534', 2);
        line({ x: d.x1, y: y + 6 }, { x: d.x2, y: y + 6 }, '#493a2c', 2);
      }
      for (const q of [
        { x: d.x1 + 10, y: d.y1 + 10 },
        { x: d.x1 + 10, y: d.y2 - 10 },
        { x: d.x2 - 10, y: d.y1 + 10 },
        { x: d.x2 - 10, y: d.y2 - 10 },
      ]) {
        const p = screen(q);
        ctx.strokeStyle = '#5d4735';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 7);
        ctx.lineTo(p.x, p.y - 12);
        ctx.stroke();
        ctx.fillStyle = '#b29269';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (region === 4) {
      rect(430, 810, 430, 720, '#9b8ba044');
      rect(450, 790, 450, 700, '#71647d');
      for (let x = 450; x <= 790; x += 40) line({ x, y: 450 }, { x, y: 700 }, '#b7a4b644', 1);
      for (let y = 450; y <= 700; y += 40) line({ x: 450, y }, { x: 790, y }, '#b7a4b644', 1);
      for (const y of [450, 700]) line({ x: 450, y }, { x: 790, y }, '#b5a081', 2);
    }
    for (const p of R.terrain[region]) {
      const kind = p.kind || 'cliff';
      if (kind === 'orrery') {
        rect(p.x - 150, p.x + 150, p.y - 140, p.y + 160, '#81768b88');
        rect(p.x - 130, p.x + 130, p.y - 120, p.y + 140, '#5e566c');
        for (let d = -120; d <= 120; d += 40) {
          line({ x: p.x + d, y: p.y - 120 }, { x: p.x + d, y: p.y + 140 }, '#b2a5b333', 1);
          line({ x: p.x - 130, y: p.y + d }, { x: p.x + 130, y: p.y + d }, '#b2a5b333', 1);
        }
        continue;
      }
      if (kind === 'fountain') continue; // Depth-sorted civic masonry is painted as a prop.
      if (kind === 'grain-silo') {
        // Compacted loading apron is walkable; the smaller silo body blocks.
        poly(
          [
            { x: p.x - 130, y: p.y - 70 },
            { x: p.x + 100, y: p.y - 95 },
            { x: p.x + 130, y: p.y + 50 },
            { x: p.x + 40, y: p.y + 140 },
            { x: p.x - 110, y: p.y + 100 },
          ],
          '#91836a55',
        );
        continue;
      }
      if (kind === 'rain-pools') {
        for (const pool of p.pools) {
          const rim = pool.points.map((q) => ({
            x: pool.x + (q.x - pool.x) * 1.075,
            y: pool.y + (q.y - pool.y) * 1.035,
          }));
          poly(rim, p.wetland ? '#797752' : '#767663');
          poly(pool.points, '#426d71');
          poly(
            pool.points.map((q) => ({
              x: pool.x + (q.x - pool.x) * 0.81,
              y: pool.y + (q.y - pool.y) * 0.87,
            })),
            '#355c65',
          );
          for (const j of p.wetland ? [] : [2, 9, 18, 25]) {
            const q = pool.points[j],
              side = q.x < pool.x ? -1 : 1,
              x = q.x + side * 6,
              y = q.y;
            poly(
              [
                { x: x - 8, y: y - 4 },
                { x: x + 3, y: y - 9 },
                { x: x + 10, y: y + 1 },
                { x: x - 1, y: y + 7 },
              ],
              '#898b76',
            );
            line({ x: x - 5, y: y - 3 }, { x: x + 2, y: y - 5 }, '#b1b09a', 1);
          }
          for (const j of [
            Math.floor(pool.points.length * 0.16),
            Math.floor(pool.points.length * 0.66),
          ]) {
            const q = pool.points[j],
              foot = screen({ x: q.x + (j === 5 ? 10 : -12), y: q.y });
            for (let n = 0; n < 4; n++) {
              ctx.strokeStyle = n % 2 ? '#7e9470' : '#657f5b';
              ctx.lineWidth = 1.1;
              ctx.beginPath();
              ctx.moveTo(foot.x + n * 3, foot.y + 2);
              ctx.quadraticCurveTo(
                foot.x + n * 4 - 2,
                foot.y - 9,
                foot.x + n * 4 - 4,
                foot.y - 14 - (n % 3) * 4,
              );
              ctx.stroke();
            }
          }
          if (!omitTerrainMotion) for (const offset of [-0.35, 0.15, 0.48]) {
            const y = pool.y + pool.ry * offset,
              x = pool.x - 13 + Math.sin(time * 0.7 + offset) * 3;
            line({ x, y }, { x: x + 23, y: y + 3 }, '#a4c2b688', 1);
          }
        }
        continue;
      }

      if (p.r) {
        if (viewport) {
          const q = screen(p),
            rx = p.r * 0.76 * Math.SQRT2 + 24,
            ry = p.r * 0.27 * Math.SQRT2 + 24;
          if (
            q.x + rx < -160 ||
            q.x - rx > bounds.width + 160 ||
            q.y + ry < -160 ||
            q.y - ry > bounds.height + 160
          )
            continue;
        }
        const circle = (r) =>
            Array.from({ length: 48 }, (_, n) => {
              const a = (n * Math.PI) / 24;
              return { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
            }),
          water = kind === 'water';
        poly(circle(p.r + 6), water ? '#70816a' : kind === 'obsidian' ? '#625568' : '#827b68');
        poly(circle(p.r), water ? '#315f6c' : kind === 'obsidian' ? '#302f39' : '#514b46');
        poly(
          circle(p.r - 12),
          water ? '#397783' : kind === 'obsidian' ? '#403b4d' : '#645d52',
          water
            ? null
            : kind === 'obsidian'
              ? 'terrain:rock:obsidian'
              : 'terrain:rock:cliff-ravine',
        );
        for (let n = 0; n < 12; n++) {
          const a = (n * Math.PI) / 6,
            r = p.r - 7,
            q = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r };
          if (!visible(q)) continue;
          poly(
            [
              q,
              {
                x: p.x + Math.cos(a + 0.13) * (r - 10 - (n % 3) * 5),
                y: p.y + Math.sin(a + 0.13) * (r - 10 - (n % 3) * 5),
              },
              { x: p.x + Math.cos(a + 0.25) * r, y: p.y + Math.sin(a + 0.25) * r },
            ],
            water ? '#65796a88' : kind === 'obsidian' ? '#82709266' : '#aba18a77',
          );
        }
        if (water && !omitTerrainMotion)
          for (let j = 0; j < 4; j++) {
            const y = p.y + (j - 1.5) * p.r * 0.3,
              x = p.x - p.r * 0.25 + Math.sin(time * 0.8 + j) * 5;
            line({ x, y }, { x: x + p.r * 0.45, y: y + 5 }, '#b4d4c388', 1);
          }
        else
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 3)
            line(
              { x: p.x + Math.cos(a) * p.r * 0.2, y: p.y + Math.sin(a) * p.r * 0.2 },
              { x: p.x + Math.cos(a + 0.2) * p.r * 0.7, y: p.y + Math.sin(a + 0.2) * p.r * 0.7 },
              kind === 'obsidian' ? '#b49dcc88' : '#aea08988',
              1.3,
            );
      } else {
        const segment = (lo, hi) => {
          if (p.industrial) {
            // Contained heat raceways: a masonry end wall on every closed
            // segment, protected dry work aprons and regular exchanger ties.
            rect(p.x1 - 95, p.x2 + 95, lo - 45, hi + 45, '#74697955');
            rect(p.x1 - 17, p.x2 + 17, lo - 18, hi + 18, '#302d36');
            rect(p.x1 - 11, p.x2 + 11, lo - 12, hi + 12, '#8d7b7d');
          }
          strip(kind, p.x1, p.x2, lo, hi);
          if (p.industrial) {
            for (const x of [p.x1 - 8, p.x2 + 8]) {
              line({ x, y: lo - 8 }, { x, y: hi + 8 }, '#b7a199', 3);
              for (let y = lo + 20; y < hi; y += 65)
                line({ x: x - 6, y }, { x: x + 6, y }, '#413943', 3);
            }
            for (const y of [lo - 8, hi + 8])
              line({ x: p.x1 - 9, y }, { x: p.x2 + 9, y }, '#c1a18b', 4);
          }
        };
        let at = p.y1;
        for (const [lo, hi] of p.gaps || []) {
          segment(at, lo);
          at = hi;
        }
        segment(at, p.y2);
      }
    }
    for (const d of inheritedDecks) {
      rect(d.x1, d.x2, d.y1, d.y2, '#413d47');
      rect(d.x1 + 6, d.x2 - 6, d.y1 + 6, d.y2 - 6, '#928797');
      for (let y = d.y1 + 12; y < d.y2; y += 35)
        line({ x: d.x1 + 7, y }, { x: d.x2 - 7, y }, '#5c5265', 1);
      for (const y of [d.y1 + 4, d.y2 - 4]) line({ x: d.x1, y }, { x: d.x2, y }, '#c3ac94', 3);
    }
    ctx.restore();
  }
  function bridges(ctx, screen, region = 0, materials = null, viewport = null) {
    let {
        bounds: [x1, x2],
        gaps,
      } = R.barriers[region],
      stone = region >= 2;
    const polygon = (points, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach((q, j) => {
        const p = screen(q);
        j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      if (!stone && color === '#b49468')
        materials?.paint(ctx, 'terrain:bridge:wood-grain', screen, points, Math.PI / 2);
    };
    const line = (a, b, color, width = 1) => {
      a = screen(a);
      b = screen(b);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };
    ctx.save();
    for (const [lo, hi] of gaps) {
      if (region === 0 && R.greenwoodLayout?.version === 2) {
        [x1, x2] = R.channelBanks(0, (lo + hi) / 2);
        stone = lo < R.greenwoodLayout.anchors.south.y - 100;
      }
      if (region === 2) {
        [x1, x2] = R.channelBanks(2, (lo + hi) / 2);
        stone = lo < 1100;
      }
      if (
        viewport &&
        outsideScreen(
          [
            { x: x1 - 30, y: lo - 24 },
            { x: x2 + 30, y: lo - 24 },
            { x: x1 - 30, y: hi + 24 },
            { x: x2 + 30, y: hi + 24 },
          ].map(screen),
          viewport,
          160,
        )
      )
        continue;
      polygon(
        [
          { x: x1 - 24, y: lo - 8 },
          { x: x2 + 24, y: lo - 8 },
          { x: x2 + 24, y: hi + 8 },
          { x: x1 - 24, y: hi + 8 },
        ],
        stone ? '#3b3833' : '#4b3929',
      );
      for (const y of [lo, hi]) {
        const a = screen({ x: x1 - 18, y }),
          b = screen({ x: x2 + 18, y });
        ctx.fillStyle = stone ? '#56554b' : '#665039';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + 6);
        ctx.lineTo(a.x, a.y + 6);
        ctx.closePath();
        ctx.fill();
      }
      polygon(
        [
          { x: x1 - 18, y: lo },
          { x: x2 + 18, y: lo },
          { x: x2 + 18, y: hi },
          { x: x1 - 18, y: hi },
        ],
        stone ? '#a6a08c' : '#b49468',
      );
      for (let x = x1 - 12; x < x2 + 18; x += stone ? 40 : 18)
        line({ x, y: lo }, { x, y: hi }, stone ? '#716e61' : '#705338');
      for (let x = x1 + 6; x < x2; x += stone ? 40 : 36) {
        for (const y of [lo + 5, hi - 5]) {
          const p = screen({ x, y });
          ctx.fillStyle = stone ? '#c3c0a155' : '#5b5140';
          ctx.fillRect(p.x - 1, p.y - 1, 2, 1.5);
        }
        if (!stone) line({ x: x - 4, y: lo + 8 }, { x: x + 7, y: hi - 8 }, '#d2b88655', 0.7);
      }

      for (const y of [lo, hi]) {
        line({ x: x1 - 18, y }, { x: x2 + 18, y }, stone ? '#d0cbb5' : '#e0c394', 3);
        for (const x of [x1 - 12, x2 + 12]) {
          const p = screen({ x, y });
          ctx.strokeStyle = stone ? '#bdb7a4' : '#c5a577';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y - 12);
          ctx.stroke();
          ctx.fillStyle = stone ? '#e5dcc0' : '#edcf91';
          ctx.beginPath();
          ctx.arc(p.x, p.y - 13, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      line(
        { x: x1 - 13, y: (lo + hi) / 2 },
        { x: x2 + 13, y: (lo + hi) / 2 },
        stone ? '#d4cdb166' : '#f2d6a166',
        1,
      );
      for (const x of [x1 - 14, x2 + 14])
        for (const y of [lo + 12, hi - 12]) {
          const p = screen({ x, y });
          ctx.fillStyle = stone ? '#666558' : '#6a5139';
          ctx.fillRect(p.x - 2, p.y - 1, 3, 2);
        }
    }
    ctx.restore();
  }
  function dungeonLayout(id, size = 1470) {
    if (R.dungeonArchitecture?.[id]) return R.dungeonArchitecture[id];
    if (R.treasuryArchitecture?.[id]) return R.treasuryArchitecture[id];
    const wall = R.dungeonWalls[id];
    if (!wall) return null;
    return {
      walkable: [{ bounds: [40, size - 40, 40, size - 40] }],
      partitions: [{ x1: wall[0], x2: wall[1], y1: 120, y2: 1260, axis: 'y', gaps: wall[2] }],
    };
  }
  function dungeonFloorPath(ctx, screen, id, size) {
    const layout = dungeonLayout(id, size);
    ctx.beginPath();
    for (const {
      bounds: [x1, x2, y1, y2],
    } of layout?.walkable || []) {
      const ps = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 },
        { x: x1, y: y2 },
      ].map(screen);
      ps.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
    }
  }
  const dungeonEdgeCache = new Map();
  function dungeonEdges(id, size) {
    const key = id + ':' + size;
    if (dungeonEdgeCache.has(key)) return dungeonEdgeCache.get(key);
    const bounds = (dungeonLayout(id, size)?.walkable || []).map((a) => a.bounds),
      xs = [...new Set(bounds.flatMap((b) => b.slice(0, 2)))].sort((a, b) => a - b),
      ys = [...new Set(bounds.flatMap((b) => b.slice(2)))].sort((a, b) => a - b),
      inside = (j, k) =>
        j >= 0 &&
        k >= 0 &&
        j < xs.length - 1 &&
        k < ys.length - 1 &&
        bounds.some(
          ([x1, x2, y1, y2]) =>
            (xs[j] + xs[j + 1]) / 2 > x1 &&
            (xs[j] + xs[j + 1]) / 2 < x2 &&
            (ys[k] + ys[k + 1]) / 2 > y1 &&
            (ys[k] + ys[k + 1]) / 2 < y2,
        ),
      edges = [];
    for (let j = 0; j < xs.length - 1; j++)
      for (let k = 0; k < ys.length - 1; k++) {
        if (!inside(j, k)) continue;
        const x1 = xs[j],
          x2 = xs[j + 1],
          y1 = ys[k],
          y2 = ys[k + 1];
        if (!inside(j, k - 1))
          edges.push([
            { x: x1, y: y1 },
            { x: x2, y: y1 },
          ]);
        if (!inside(j + 1, k))
          edges.push([
            { x: x2, y: y1 },
            { x: x2, y: y2 },
          ]);
        if (!inside(j, k + 1))
          edges.push([
            { x: x2, y: y2 },
            { x: x1, y: y2 },
          ]);
        if (!inside(j - 1, k))
          edges.push([
            { x: x1, y: y2 },
            { x: x1, y: y1 },
          ]);
      }
    dungeonEdgeCache.set(key, edges);
    return edges;
  }
  function dungeonArchitecture(ctx, screen, dungeonId = '', size) {
    const layout = dungeonLayout(dungeonId, size);
    if (!layout) return;
    const greenwoodInterior = R.greenwoodLayout?.version === 2 && ['crypt', 'supply-vale'].includes(dungeonId);
    const palette =
      dungeonId === 'supply-highlands'
        ? { top: '#979a86', side: '#626658', edge: '#c7c4a4' }
        : dungeonId === 'supply-vale' && greenwoodInterior
          ? { top: '#9b987c', side: '#696e58', edge: '#c5bb92' }
        : dungeonId === 'abyss'
          ? { top: '#6f5b5d', side: '#463b3d', edge: '#a77a6b' }
          : dungeonId === 'crypt'
            ? { top: '#69565d', side: '#41343f', edge: '#bf9870' }
            : dungeonId === 'archive'
              ? { top: '#697978', side: '#3e5458', edge: '#9eb2ac' }
              : dungeonId === 'mine'
                ? { top: '#797567', side: '#4b4a42', edge: '#a7a187' }
                : { top: '#667078', side: '#3f484e', edge: '#9ba7aa' };
    const poly = (pts, fill, stroke, width = 1) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      pts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    };
    const block = (x1, x2, y1, y2) => {
      const rise =
          dungeonId === 'supply-highlands' ? (Math.max(x2 - x1, y2 - y1) <= 45 ? 44 : 30) : greenwoodInterior ? 24 : 0,
        top = [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
        ].map((q) => {
          const p = screen(q);
          return { x: p.x, y: p.y - rise };
        }),
        drop = rise || 7;
      poly(
        [top[1], top[2], { x: top[2].x, y: top[2].y + drop }, { x: top[1].x, y: top[1].y + drop }],
        palette.side,
      );
      poly(
        [top[3], top[2], { x: top[2].x, y: top[2].y + drop }, { x: top[3].x, y: top[3].y + drop }],
        palette.side,
      );
      poly(top, palette.top, palette.edge, 1.7);
      for (const j of [1, 3]) {
        const a = top[j],
          b = top[2];
        ctx.strokeStyle = palette.edge + '55';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y + 3);
        ctx.lineTo(b.x, b.y + 3);
        ctx.stroke();
      }

      if (dungeonId === 'supply-highlands' || greenwoodInterior) {
        // Masonry courses and staggered joints make the counting screens real built cover.
        for (const [a, b] of [
          [top[1], top[2]],
          [top[3], top[2]],
        ]) {
          for (const f of [1 / 3, 2 / 3]) {
            ctx.strokeStyle = '#3f493f99';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y + drop * f);
            ctx.lineTo(b.x, b.y + drop * f);
            ctx.stroke();
          }
          const length = Math.hypot(b.x - a.x, b.y - a.y),
            count = Math.max(1, Math.ceil(length / 42));
          for (let row = 0; row < 3; row++)
            for (let j = 1; j <= count; j++) {
              const t = (j - (row % 2) * 0.5) / count;
              if (t <= 0 || t >= 1) continue;
              const x = a.x + (b.x - a.x) * t,
                y = a.y + (b.y - a.y) * t;
              ctx.beginPath();
              ctx.moveTo(x, y + (drop * row) / 3);
              ctx.lineTo(x, y + (drop * (row + 1)) / 3);
              ctx.stroke();
            }
        }
        for (const p of top) {
          ctx.fillStyle = '#c5c9b1';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + 1, 1.7, 1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const seam = (a, b) => {
        a = screen(a);
        b = screen(b);
        a.y -= rise;
        b.y -= rise;
        ctx.strokeStyle = palette.side + '99';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      };
      if (x2 - x1 > y2 - y1)
        for (let x = x1 + 35; x < x2; x += 50) seam({ x, y: y1 + 4 }, { x, y: y2 - 4 });
      else for (let y = y1 + 35; y < y2; y += 50) seam({ x: x1 + 4, y }, { x: x2 - 4, y });
    };
    ctx.save();
    ctx.save();
    dungeonFloorPath(ctx, screen, dungeonId, size);
    ctx.clip();
    for (const s of layout.surfaces || []) {
      const [x1, x2, y1, y2] = s.bounds;
      const color =
        s.kind === 'flooded'
          ? '#416d7888'
          : s.kind === 'earth'
            ? '#6e614e66'
            : dungeonId === 'supply-highlands'
              ? {
                  'hearth-rug': '#915d3b99',
                  'counting-slate': '#42534c66',
                  'private-rug': '#74574599',
                  'rider-mats': '#a0967066',
                }[s.kind] || '#887b6555'
              : '#887b6555';
      poly(
        [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
        ].map(screen),
        color,
      );
      if (dungeonId === 'supply-highlands' && s.kind !== 'counting-slate') {
        const inset = 12;
        poly(
          [
            { x: x1 + inset, y: y1 + inset },
            { x: x2 - inset, y: y1 + inset },
            { x: x2 - inset, y: y2 - inset },
            { x: x1 + inset, y: y2 - inset },
          ].map(screen),
          '#00000000',
          '#c9b78e99',
          1.1,
        );
        for (let x = x1 + 35; x < x2 - 20; x += 45) {
          const p = screen({ x, y: y1 + 23 });
          poly(
            [
              { x: p.x, y: p.y - 2 },
              { x: p.x + 3, y: p.y },
              { x: p.x, y: p.y + 2 },
              { x: p.x - 3, y: p.y },
            ],
            '#cab88a99',
          );
        }
      }
      for (let y = y1 + 35; y < y2; y += 100)
        for (let x = x1 + 35; x < x2; x += 110) {
          const a = screen({ x, y }),
            b = screen({ x: x + 35, y: y + (s.kind === 'flooded' ? -8 : 9) });
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = s.kind === 'flooded' ? '#a2c3bf88' : '#b7a18077';
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
    }
    ctx.restore();

    for (const [a, b] of dungeonEdges(dungeonId, size)) {
      const p = screen(a),
        q = screen(b);
      ctx.strokeStyle = palette.side;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 3);
      ctx.lineTo(q.x, q.y + 3);
      ctx.stroke();
      ctx.strokeStyle = palette.edge;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    for (const w of layout.partitions || []) {
      const gaps = [...(w.gaps || [])].sort((a, b) => a[0] - b[0]);
      if (w.axis === 'x') {
        let at = w.x1;
        for (const [lo, hi] of gaps) {
          if (lo > at) block(at, Math.min(lo, w.x2), w.y1, w.y2);
          at = Math.max(at, hi);
        }
        if (at < w.x2) block(at, w.x2, w.y1, w.y2);
      } else {
        let at = w.y1;
        for (const [lo, hi] of gaps) {
          if (lo > at) block(w.x1, w.x2, at, Math.min(lo, w.y2));
          at = Math.max(at, hi);
        }
        if (at < w.y2) block(w.x1, w.x2, at, w.y2);
      }
    }
    ctx.restore();
  }
  // One bounded presentation-only display list: retain world geometry, never pixels,
  // actor state or projected coordinates. Mutable saved roads and bridge definitions
  // are compared numerically before reuse, rather than relying on their identities.
  let roadCache = null;
  function roadCacheMatches(paths, region, barrier) {
    const item = roadCache;
    if (!item || item.region !== region || item.paths.length !== paths.length) return false;
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i],
        saved = item.paths[i];
      if (path.length !== saved.length) return false;
      for (let j = 0; j < path.length; j++)
        if (path[j].x !== saved[j][0] || path[j].y !== saved[j][1]) return false;
    }
    if (barrier.bounds.length !== item.bounds.length || barrier.gaps.length !== item.gaps.length)
      return false;
    for (let i = 0; i < barrier.bounds.length; i++)
      if (barrier.bounds[i] !== item.bounds[i]) return false;
    for (let i = 0; i < barrier.gaps.length; i++) {
      if (barrier.gaps[i].length !== item.gaps[i].length) return false;
      for (let j = 0; j < barrier.gaps[i].length; j++)
        if (barrier.gaps[i][j] !== item.gaps[i][j]) return false;
    }
    return true;
  }
  function roadGeometry(paths, region) {
    const commands = [];
    const barrier = R.barriers[region],
      palettes = [
        { shoulder: '#564834', base: '#8e7758', inner: '#9c8664', seam: '#6f604c' },
        { shoulder: '#4b5043', base: '#756e57', inner: '#8e8367', seam: '#5a6354' },
        { shoulder: '#4e4d46', base: '#87857a', inner: '#a29f8e', seam: '#6e6d66' },
        { shoulder: '#51443e', base: '#7c6c61', inner: '#8c7c6d', seam: '#625750' },
        { shoulder: '#3f3d45', base: '#66636e', inner: '#827d89', seam: '#55525d' },
      ],
      road = palettes[region] || palettes[0];
    const onBridge = (p) =>
        p.x >= barrier.bounds[0] - 12 &&
        p.x <= barrier.bounds[1] + 12 &&
        barrier.gaps.some(([lo, hi]) => p.y >= lo && p.y <= hi),
      stone = region >= 2;
    const poly = (points, color) =>
      commands.push({ points, color, material: color === road.inner });
    const disk = (q, r, color) =>
      poly(
        Array.from({ length: 16 }, (_, j) => {
          const a = (j * Math.PI) / 8;
          return { x: q.x + Math.cos(a) * r, y: q.y + Math.sin(a) * r };
        }),
        color,
      );
    const segment = (a, b, w, color) => {
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (!d) return;
      const dx = (-(b.y - a.y) / d) * w,
        dy = ((b.x - a.x) / d) * w;
      poly(
        [
          { x: a.x + dx, y: a.y + dy },
          { x: b.x + dx, y: b.y + dy },
          { x: b.x - dx, y: b.y - dy },
          { x: a.x - dx, y: a.y - dy },
        ],
        color,
      );
    };
    const stroke = (a, b, color, width = 1) => commands.push({ a, b, color, width });
    const edges = [],
      seen = new Set(),
      nodes = new Map();
    for (const route of paths) {
      let path = route;
      if (region === 1) {
        const start = R.harbors.march.boardwalk[0],
          entry = path.findIndex((p) => p.x === start.x && p.y === start.y);
        if (entry > 0) {
          // Routes continue across timber for navigation; earth stops at its edge.
          // Set back the round 35-unit road cap so it cannot cover the first planks.
          const before = path[entry - 1],
            length = Math.hypot(start.x - before.x, start.y - before.y),
            setback = Math.min(35, length);
          path = [
            ...path.slice(0, entry),
            {
              x: start.x - ((start.x - before.x) * setback) / length,
              y: start.y - ((start.y - before.y) * setback) / length,
            },
          ];
        }
      }
      if (region === 2) path = path.filter((p) => !(p.x < 470 && p.y >= 1810 && p.y <= 2020));
      for (const q of path) nodes.set(q.x + ':' + q.y, q);
      for (let j = 1; j < path.length; j++) {
        const a = path[j - 1],
          b = path[j],
          key = [a.x + ':' + a.y, b.x + ':' + b.y].sort().join('/');
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([a, b]);
        }
      }
    }
    for (const [w, color] of [
      [35, road.shoulder],
      [29, road.base],
      [23, road.inner],
    ]) {
      for (const [a, b] of edges) segment(a, b, w, color);
      for (const q of nodes.values()) disk(q, w, color);
    }
    // Clay wear is localized to maintained western cart routes. Forest
    // footpaths and the rest of the valley retain their existing earth palette.
    if (region === 0 && R.greenwoodLayout?.version)
      for (const [a, b] of edges) {
        const mx = (a.x + b.x) / 2,
          my = (a.y + b.y) / 2;
        if (
          mx > 350 &&
          mx < barrier.bounds[0] - 170 &&
          my < 1750 &&
          Math.hypot(a.x - b.x, a.y - b.y) > 160
        )
          segment(a, b, 12, '#9b624645');
      }
    const details = new Set();
    for (const [a, b] of edges) {
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (!length) continue;
      const ux = (b.x - a.x) / length,
        uy = (b.y - a.y) / length,
        nx = -uy,
        ny = ux,
        spacing = region === 4 ? 56 : region === 2 ? 64 : 48,
        anchor = a.x * ux + a.y * uy,
        first = Math.ceil(anchor / spacing) * spacing - anchor;
      if (region === 0 || region === 1 || region === 3)
        for (const side of [-1, 1])
          stroke(
            { x: a.x + nx * side * 12, y: a.y + ny * side * 12 },
            { x: b.x + nx * side * 12, y: b.y + ny * side * 12 },
            road.seam + (region === 3 ? '99' : '44'),
            region === 3 ? 1.8 : 1,
          );
      for (let t = first; t < length; t += spacing) {
        const p = { x: a.x + ux * t, y: a.y + uy * t },
          key = Math.round(p.x) + ':' + Math.round(p.y);
        if (details.has(key)) continue;
        details.add(key);
        const bridge = onBridge(p);
        if (bridge) {
          stroke(
            { x: p.x + nx * 26, y: p.y + ny * 26 },
            { x: p.x - nx * 26, y: p.y - ny * 26 },
            stone ? '#716e61' : '#705338',
            1,
          );
          continue;
        }
        if (region === 4) {
          stroke(
            { x: p.x + nx * 26, y: p.y + ny * 26 },
            { x: p.x - nx * 26, y: p.y - ny * 26 },
            road.seam,
            1,
          );
          const q = {
            x: a.x + ux * Math.min(length, t + spacing),
            y: a.y + uy * Math.min(length, t + spacing),
          };
          stroke(p, q, road.seam, 0.8);
        } else if (region === 2) {
          for (const side of [-1, 1])
            stroke(
              { x: p.x + nx * side * 23, y: p.y + ny * side * 23 },
              { x: p.x + nx * side * 5 + ux * 7, y: p.y + ny * side * 5 + uy * 7 },
              road.seam,
              0.9,
            );
        } else {
          const off = (Math.round(p.x + p.y) % 17) - 8,
            q = { x: p.x + nx * off, y: p.y + ny * off };
          stroke(
            q,
            { x: q.x + ux * (region === 1 ? 8 : 4), y: q.y + uy * (region === 1 ? 8 : 4) },
            region === 1 ? '#b7af8b66' : region === 3 ? '#403b3666' : '#c7b18a77',
            region === 1 ? 1.4 : 1.2,
          );
        }
      }
    }
    return commands;
  }
  function footpaths(ctx, paths, screen) {
    ctx.save();
    ctx.lineJoin = 'round';
    for (const path of paths || [])
      for (let j = 1; j < path.length; j++) {
        const a = path[j - 1],
          b = path[j],
          d = Math.hypot(b.x - a.x, b.y - a.y);
        if (!d) continue;
        const nx = (-(b.y - a.y) / d) * 9,
          ny = ((b.x - a.x) / d) * 9,
          points = [
            { x: a.x + nx, y: a.y + ny },
            { x: b.x + nx, y: b.y + ny },
            { x: b.x - nx, y: b.y - ny },
            { x: a.x - nx, y: a.y - ny },
          ].map(screen);
        ctx.fillStyle = '#8f805568';
        ctx.beginPath();
        points.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
      }
    ctx.restore();
  }
  function roads(ctx, paths, screen, region = 0, materials = null, viewport = null) {
    if (region === 0 && R.greenwoodLayout?.version === 2)
      return GreenwoodLandscape.drawRoads(ctx, paths, screen);
    const barrier = R.barriers[region];
    let commands;
    if (roadCacheMatches(paths, region, barrier)) commands = roadCache.commands;
    else {
      commands = roadGeometry(paths, region);
      const inputs =
        paths.reduce((n, path) => n + 1 + path.length * 2, 1) +
        barrier.bounds.length +
        barrier.gaps.reduce((n, gap) => n + 1 + gap.length, 1);
      const coordinates = commands.reduce(
        (n, command) => n + (command.points ? command.points.length * 2 : 4),
        0,
      );
      roadCache =
        commands.length <= 4096 && inputs <= 8192 && coordinates <= 32768
          ? {
              region,
              paths: paths.map((path) => path.map((p) => [p.x, p.y])),
              bounds: [...barrier.bounds],
              gaps: barrier.gaps.map((gap) => [...gap]),
              commands,
            }
          : null;
    }
    const materialKey =
      'terrain:road:' + ['vale', 'march', 'highlands', 'frontier', 'crown'][region];
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const command of commands) {
      if (command.points) {
        const projected = command.points.map(screen);
        if (viewport && outsideScreen(projected, viewport, 160)) continue;
        ctx.fillStyle = command.color;
        ctx.beginPath();
        projected.forEach((p, j) => {
          j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        if (command.material) materials?.paint(ctx, materialKey, screen, command.points);
        if (command.material && !materials && projected.length === 4) {
          ctx.save();
          ctx.clip();
          ctx.strokeStyle = region === 4 ? '#bab7a122' : '#d4bd922b';
          ctx.lineWidth = 1.3;
          for (const t of [0.28, 0.7]) {
            const a = {
                x: projected[0].x * (1 - t) + projected[3].x * t,
                y: projected[0].y * (1 - t) + projected[3].y * t,
              },
              b = {
                x: projected[1].x * (1 - t) + projected[2].x * t,
                y: projected[1].y * (1 - t) + projected[2].y * t,
              };
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.quadraticCurveTo((a.x + b.x) / 2 + 1.5, (a.y + b.y) / 2 - 1, b.x, b.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      } else {
        const a = screen(command.a),
          b = screen(command.b);
        if (viewport && outsideScreen([a, b], viewport, 160)) continue;
        ctx.strokeStyle = command.color;
        ctx.lineWidth = command.width;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // One presentation contract for Canvas and the optional Pixi world.
  // Screen-space positions deliberately follow the original Canvas artist's
  // deterministic motion; there is no random emitter or save-game state.
  function atmosphereMotes({
    width,
    height,
    region = 0,
    darkness = 0,
    dungeon = false,
    room = false,
    optimized = false,
    time = 0,
  } = {}) {
    if (optimized) return [];
    const dayMotes = ['#eadf9e', '#b8d8ca', '#dedcc7', '#b98569', '#aa8ec0'],
      nightMotes = ['#dcefa8', '#b7e2d5', '#dbe4df', '#e6a170', '#c7a4df'],
      count = dungeon || room ? 8 : region === 3 || region === 4 ? 18 : 14,
      fade = Math.max(0, Math.min(1, darkness)),
      day = dayMotes[region] || dayMotes[0],
      night = nightMotes[region] || nightMotes[0],
      rgb = [1, 3, 5].map((i) =>
        Math.round(
          parseInt(day.slice(i, i + 2), 16) * (1 - fade) +
            parseInt(night.slice(i, i + 2), 16) * fade,
        ),
      ),
      alpha = 0.18 + 0.06 * fade;
    return Array.from({ length: count }, (_, j) => {
      const seed = (j + 1) * 91 + region * 137;
      return {
        x: ((seed * 37 + time * (region >= 3 ? 10 : 5)) % (width + 80)) - 40,
        y:
          ((seed * 53 + Math.sin(time * 0.7 + j) * 22 + time * (region === 3 ? 5 : 1.5)) %
            (height + 70)) -
          35,
        r: region >= 3 ? (j % 3 === 0 ? 1.8 : 1) : region === 1 ? (j % 4 === 0 ? 2.5 : 1.2) : 1.15,
        rgb,
        alpha,
      };
    });
  }

  function atmosphere(ctx, canvas, region = 0, opts = {}) {
    const night = !!opts.night,
      peace = !!opts.peace,
      dungeon = !!opts.dungeon,
      room = !!opts.room,
      hero = opts.hero || null,
      lights = opts.lights || [],
      daylight = !dungeon && !room ? opts.daylight : null,
      darkness = daylight ? Math.max(0, Math.min(1, daylight.darkness)) : night ? 1 : 0,
      peaceBlend = peace ? (daylight?.phase === 'victory-sunrise' ? daylight.progress : 1) : 0,
      time = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
    ctx.save();
    // Regional color grade: gentle enough to preserve combat readability, strong enough to make each zone feel authored.
    const dayTints = [
      'rgba(213,229,163,.045)',
      'rgba(150,206,205,.05)',
      'rgba(221,219,184,.045)',
      'rgba(215,157,120,.05)',
      'rgba(166,146,196,.05)',
    ];
    const nightTints = [
      'rgba(11,25,42,.48)', // Greenwood: moonlit blue-greens, not a blackout
      'rgba(12,32,44,.48)', // Marches: wet blue reflections
      'rgba(19,29,42,.50)', // Ironroot: cool altitude, warm occupied windows
      'rgba(32,20,35,.52)', // Frontier: ash dusk with working checkpoints
      'rgba(27,19,43,.54)', // Crown: rich night violet, still navigable
    ];
    const glow = (p, r = 120, a = 0.22, c = '255,218,151') => {
      if (!p) return;
      const q = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      q.addColorStop(0, `rgba(${c},${a})`);
      q.addColorStop(0.35, `rgba(${c},${a * 0.48})`);
      q.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = q;
      ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
    };
    if (darkness > 0) {
      ctx.globalAlpha = darkness;
      const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
      g.addColorStop(0, nightTints[region] || nightTints[0]);
      g.addColorStop(
        1,
        `rgba(${9 + 13 * peaceBlend},${17 + 14 * peaceBlend},${30 + 19 * peaceBlend},${0.58 - 0.28 * peaceBlend})`,
      );
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Warm pools around the hero and inhabited field structures make night readable without flattening the whole scene.
      ctx.globalCompositeOperation = 'screen';
      glow(hero, 145, 0.18 + 0.04 * peaceBlend, region === 4 ? '215,191,231' : '235,221,184');
      // Night sources are the current map's actual windows, services and fires.
      // Keep the soft lit ground distinct from the lamp itself. Only a small
      // radius for each source, with a larger effect at working kitchens/forges.
      const renderedLights = lights.slice(0, 36);
      for (const p of renderedLights) {
        const carried = p.kind === 'carried-lantern',
          window = p.kind === 'window',
          fire = p.kind === 'fire' || p.kind === 'work-fire',
          radius = carried ? 64 : window ? 70 : p.kind === 'work-fire' ? 105 : fire ? 90 : 85,
          y = carried ? p.y : p.y - (p.fixture === 'post' ? 46 : window ? 32 : fire ? 13 : 28),
          source = { x: p.x, y },
          tint = region === 1 ? '245,208,150' : region === 4 ? '247,194,147' : '255,207,132';
        glow(source, radius, window ? 0.27 : fire ? 0.3 : 0.25, tint);
        if (carried) glow(source, 10, 0.5, '255,221,150');
      }
      ctx.globalCompositeOperation = 'source-over';
      // Luminous windows and sheltered lantern glass are localized light
      // sources, not new scenery obstacles. Fires already have drawn flames.
      for (const p of renderedLights) {
        if (p.kind === 'window') {
          ctx.fillStyle = '#483d31';
          ctx.fillRect(p.x - 15, p.y - 43, 10, 13);
          ctx.fillRect(p.x + 6, p.y - 43, 10, 13);
          ctx.fillStyle = '#f2cb81';
          ctx.fillRect(p.x - 13, p.y - 41, 7, 9);
          ctx.fillRect(p.x + 8, p.y - 41, 7, 9);
          ctx.strokeStyle = '#8d6543';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (const x of [p.x - 9, p.x + 12]) {
            ctx.moveTo(x, p.y - 42);
            ctx.lineTo(x, p.y - 32);
          }
          ctx.stroke();
        } else if (p.kind === 'lantern' && p.fixture === 'post') {
          // Illuminate the glass already painted on the actual post. Do not
          // manufacture a second floating service lantern beside it.
          ctx.fillStyle = '#f4c57e';
          ctx.fillRect(p.x - 5, p.y - 50, 10, 9);
        } else if (p.kind === 'lantern') {
          // A modest iron hook and glazed hanging lamp by the service stand.
          const x = p.x + 19,
            y = p.y - 22;
          ctx.strokeStyle = '#817c69';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(x - 7, y + 17);
          ctx.lineTo(x - 7, y - 14);
          ctx.lineTo(x + 1, y - 14);
          ctx.lineTo(x + 1, y - 9);
          ctx.stroke();
          ctx.fillStyle = '#574b40';
          ctx.fillRect(x - 6, y - 9, 14, 4);
          ctx.fillStyle = '#f4c57e';
          ctx.fillRect(x - 5, y - 5, 12, 12);
          ctx.strokeStyle = '#635a4b';
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 5, y - 5, 12, 12);
          ctx.fillStyle = '#7a6450';
          ctx.fillRect(x - 6, y + 7, 14, 3);
        }
      }
    }
    if (darkness < 1) {
      ctx.globalAlpha = 1 - darkness;
      ctx.fillStyle = dayTints[region] || dayTints[0];
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const sun = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      sun.addColorStop(0, 'rgba(255,244,203,.07)');
      sun.addColorStop(0.45, 'rgba(255,255,255,0)');
      sun.addColorStop(1, region >= 3 ? 'rgba(97,56,55,.035)' : 'rgba(22,55,42,.025)');
      if (!opts.optimized) {
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    ctx.globalAlpha = 1;
    if (darkness < 1) {
      // A lit hand lantern keeps a small bloom in daylight; broad illumination
      // becomes visible after dark. Existing civic day/night lights stay off.
      ctx.globalCompositeOperation = 'screen';
      for (const p of lights.filter((p) => p.kind === 'carried-lantern').slice(0, 8))
        glow(p, 22, 0.12 * (1 - darkness), '255,221,150');
      ctx.globalCompositeOperation = 'source-over';
    }
    // A low directional sunset and diffuse rose/gold dawn read across the
    // existing isometric landscape. Endpoint-zero warmth avoids boundary flashes.
    if (daylight?.warmth > 0) {
      const sunset = daylight.phase === 'sunset',
        victory = daylight.phase === 'victory-sunrise';
      const wash = ctx.createLinearGradient(
        0,
        canvas.height * (sunset ? 0.15 : 0.8),
        canvas.width,
        canvas.height * (sunset ? 0.9 : 0.1),
      );
      const strength = daylight.warmth * (victory ? 1.25 : 1);
      wash.addColorStop(
        0,
        sunset ? `rgba(244,139,70,${0.23 * strength})` : `rgba(248,185,177,${0.18 * strength})`,
      );
      wash.addColorStop(0.52, `rgba(255,216,143,${0.07 * strength})`);
      wash.addColorStop(
        1,
        sunset ? `rgba(103,64,126,${0.09 * strength})` : `rgba(255,233,171,${0.19 * strength})`,
      );
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Keep the night safety grade and useful light pools, but omit purely
    // decorative pollen/mist/sparks and vignette in Optimization Mode.
    if (opts.optimized) {
      ctx.restore();
      return;
    }
    // Atmospheric motes are shared with Pixi, so both art paths retain
    // identical day/night palettes, movement, sizes, and region counts.
    const motes = atmosphereMotes({
      width: canvas.width,
      height: canvas.height,
      region,
      darkness,
      dungeon,
      room,
      optimized: !!opts.optimized,
      time,
    });
    if (motes.length) {
      ctx.globalAlpha = motes[0].alpha;
      ctx.fillStyle = `rgb(${motes[0].rgb.join(',')})`;
      for (const { x, y, r } of motes) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // Soft vignette gives the miniature scene depth and focuses attention toward play space.
    const v = ctx.createRadialGradient(
      canvas.width * 0.5,
      canvas.height * 0.48,
      Math.min(canvas.width, canvas.height) * 0.18,
      canvas.width * 0.5,
      canvas.height * 0.5,
      Math.max(canvas.width, canvas.height) * 0.72,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(
      1,
      `rgba(${5 * (1 - darkness)},${15 * (1 - darkness)},${10 * (1 - darkness)},${0.12 + 0.03 * darkness})`,
    );
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  function enemyBodyKind(e) {
    if (!e?.species) return 'unknown';
    const rangedClass =
      e.ranged && ['mireling', 'ogre', 'orc', 'ashbeast', 'crownguard'].includes(e.species);
    return e.species + (rangedClass ? ':ranged' : '');
  }
  root.PrototypeVisuals = {
    draw,
    frontierTreeShoots,
    frontierGroundRecoveryAt,
    height,
    floor,
    dungeonFloorPath,
    dungeonLayout,
    dungeonEdges,
    dungeonArchitecture,
    roads,
    footpaths,
    terrain,
    terrainMotionLines,
    bridges,
    atmosphere,
    atmosphereMotes,
    allyBodyKind,
    enemyBodyKind,
    barracksVisualState,
    featureScale,
    assetSafeScale,
    contourRadius,
    ambientAnimalPose,
  };
  if (typeof module !== 'undefined') module.exports = root.PrototypeVisuals;
})(typeof window !== 'undefined' ? window : globalThis);
