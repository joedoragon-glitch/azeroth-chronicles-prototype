'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { majorOccluder, occlusionPairs } = require('../src/prototype/renderer.js');

const obj = (renderKind, x, y, other = {}) => ({
  renderKind,
  x,
  y,
  sx: x,
  sy: y,
  ...other,
});
const project = (e) => ({ x: e.sx, y: e.sy });
const height = () => 85;
const hero = obj('hero', 100, 100, { id: 'hero', sx: 160, sy: 150 });
const house = obj('prop', 120, 120, { structure: 'house', sx: 164, sy: 172 });
const tree = obj('prop', 125, 125, { structure: 'dead-tree', decorative: true, sx: 180, sy: 178 });
const enemy = obj('enemy', 110, 110, { hp: 30, sx: 162, sy: 163 });
const civilian = obj('npc', 110, 110, { kind: 'teacher', sx: 161, sy: 163 });

assert(majorOccluder(house), 'houses are foreground obstacles');
assert(majorOccluder(tree), 'full-sized trees can hide characters');
assert(majorOccluder(obj('prop', 0, 0, { id: 'forest-0-0', r: 24, icon: '🌲' })), 'Greenwood forests count as cover');
assert(majorOccluder(obj('prop', 0, 0, { id: 'forest-2-7', r: 24, icon: '🌳' })), 'regional full-sized trees count as cover');
assert(!majorOccluder(obj('prop', 0, 0, { r: 10, icon: '🌲' })), 'small tree-like clutter remains excluded');
assert(majorOccluder(obj('prop', 0, 0, { structure: 'vale-cottage', decorative: true })));
for (const structure of ['highland-wall', 'crown-wall', 'highland-smithy', 'watchpost', 'command-tent']) {
  assert(majorOccluder(obj('prop', 0, 0, { structure, decorative: true })), structure);
}
for (const structure of ['rock-cluster', 'mangrove']) {
  assert(!majorOccluder(obj('prop', 0, 0, { structure, decorative: true })), 'small clutter: ' + structure);
}
assert(majorOccluder(obj('building', 0, 0, { kind: 'barracks' })));
assert(majorOccluder(obj('npc', 0, 0, { kind: 'supplier' })), 'service building counts as cover');
for (const structure of ['sapling', 'pine-sapling', 'grass', 'stump', 'fallen-log', 'barrel', 'market']) {
  assert(!majorOccluder(obj('prop', 0, 0, { structure, decorative: true })), structure);
}
assert(!majorOccluder(obj('npc', 0, 0, { kind: 'quests' })), 'quest board is not cover');
assert(!majorOccluder({ ...house, interactionOnly: true }));

assert.equal(occlusionPairs([hero, house], project, height).length, 1, 'hero concealed by house');
assert.equal(occlusionPairs([house, hero], project, height).length, 0, 'no contour when hero draws in front');
assert.equal(occlusionPairs([hero, tree], project, height).length, 1, 'trees are supported');
assert.equal(occlusionPairs([hero, civilian], project, height).length, 0, 'NPC is not outlined');
assert.equal(
  occlusionPairs([hero, { ...house, sx: 400 }], project, height).length,
  0,
  'horizontal separation suppresses effect',
);
assert.equal(
  occlusionPairs([hero, { ...house, sy: 400 }], project, height).length,
  0,
  'distant foreground objects do not make outlines',
);
assert.equal(occlusionPairs([civilian, house], project, height).length, 0, 'NPCs never outlined');
assert.equal(occlusionPairs([enemy, house], project, height).length, 1, 'enemies get their own contour');
assert.equal(
  occlusionPairs([{ ...enemy, neutral: true }, house], project, height).length,
  0,
  'neutral creatures are not marked hostile',
);
assert.equal(
  occlusionPairs([hero, enemy, house], project, height)[0].actor.id,
  'hero',
  'hero takes priority in visually busy scenes',
);

// Regression guard: masks use actual transparent artwork. The character's
// interior is subtracted and the remaining rim intersects the foreground alpha.
const renderer = fs.readFileSync(path.join(__dirname, '../src/prototype/renderer.js'), 'utf8');
const sprites = fs.readFileSync(path.join(__dirname, '../src/prototype/sprites.js'), 'utf8');
assert(renderer.includes("edge.globalCompositeOperation = 'destination-out'"));
assert(renderer.includes("edge.globalCompositeOperation = 'destination-in'"));
assert(renderer.includes("ctx.globalAlpha = 0.46"), 'a soft translucent rim, not a neon marker');
assert(renderer.includes('drawOcclusionOutlines(entities);'));
assert(sprites.includes('if (!options?.silhouette) overlay(ctx, e, p, entry, scale);'));

console.log('PASS Soft occlusion contours are depth-gated, alpha-clipped and limited to major cover.');

// Pixel-level integration audit: exercise the real renderer with painted alpha
// masks, then compare its result to the exact same scene with the helper off.
const { createCanvas } = require('@napi-rs/canvas');
const Renderer = require('../src/prototype/renderer.js');
function rasterScene({ actorKind = 'hero', structure = 'house', foreground = true } = {}) {
  const surface = createCanvas(400, 330);
  const actor = obj(actorKind, 200, 200, {
    id: 'test-actor',
    name: 'Test actor',
    class: 'paladin',
    hp: 100,
    maxHp: 100,
  });
  const obstacle = obj('prop', foreground ? 220 : 180, foreground ? 220 : 180, {
    id: 'test-cover',
    structure,
    decorative: true,
  });
  const game = {
    hero: actorKind === 'hero' ? actor : obj('hero', 350, 350, { id: 'camera-hero', hp: 100, maxHp: 100 }),
    zoneId: 'vale',
    s: { rescued: {}, projectiles: [], loot: [], party: [] },
    regionIndex: () => 0,
    zone: () => ({ props: [obstacle], buildings: [], enemies: actorKind === 'enemy' ? [actor] : [], roads: [] }),
    supplyRoom: () => null,
    isDungeon: () => false,
    zoneSize: () => 450,
    visibleNPCs: () => actorKind === 'npc' ? [actor] : [],
    visibleResourceNodes: () => [],
    activeLivingParty: () => actorKind === 'ally' ? [actor] : [],
    night: () => false,
    manaCombatActive: () => false,
    peace: false,
  };
  const visuals = {
    height: (e) => e.renderKind === 'prop' ? 85 : 65,
    draw(ctx, e, p) {
      ctx.save();
      if (e.renderKind === 'prop') {
        ctx.fillStyle = '#405d45';
        ctx.fillRect(p.x - 40, p.y - 75, 80, 90);
      } else {
        ctx.fillStyle = '#496593';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 36, 17, 24, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    floor() {}, terrain() {}, roads() {}, bridges() {}, atmosphere() {},
  };
  const painter = Renderer.create({
    canvas: surface,
    ctx: surface.getContext('2d'),
    getGame: () => game,
    platform: { cameraZoom: 1, cameraAnchor: () => ({ x: 190, y: 210 }) },
    chargePresentation: () => null,
    isPaused: () => false,
    Campaign: { dungeonIds: [] },
    PrototypeVisuals: visuals,
    PrototypeCombatVisuals: { ground() {} },
    PrototypeSprites: null,
    PrototypeMaterials: null,
    now: () => 1000,
  });
  return { surface, painter };
}
function pixelsWithAndWithoutHelper(sceneOptions) {
  const previousDocument = global.document;
  try {
    const base = rasterScene(sceneOptions);
    // Disable only the outline helper, preserving the exact painter's order.
    delete global.document;
    base.painter.draw();
    const untouched = base.surface.getContext('2d').getImageData(0, 0, 400, 330).data;
    const assisted = rasterScene(sceneOptions);
    global.document = { createElement: () => createCanvas(384, 384) };
    assisted.painter.draw();
    const out = assisted.surface.getContext('2d').getImageData(0, 0, 400, 330).data;
    let changed = 0;
    for (let i = 0; i < out.length; i += 4) {
      if (
        Math.abs(out[i] - untouched[i]) +
        Math.abs(out[i + 1] - untouched[i + 1]) +
        Math.abs(out[i + 2] - untouched[i + 2]) > 8
      ) changed++;
    }
    return changed;
  } finally {
    if (previousDocument === undefined) delete global.document;
    else global.document = previousDocument;
  }
}
const behindHouse = pixelsWithAndWithoutHelper({ actorKind: 'hero' });
assert(behindHouse > 25, 'actual painted hero contour must be visible behind a house');
assert(behindHouse < 650, 'outline may touch edges but must not fill the character');
assert(
  pixelsWithAndWithoutHelper({ actorKind: 'enemy' }) > 25,
  'actual painted hostile contour must be visible',
);
assert.equal(
  pixelsWithAndWithoutHelper({ actorKind: 'npc' }),
  0,
  'a civilian behind cover must not acquire a halo',
);
assert.equal(
  pixelsWithAndWithoutHelper({ actorKind: 'hero', structure: 'sapling' }),
  0,
  'a small prop must not trigger the overlay',
);
assert.equal(
  pixelsWithAndWithoutHelper({ actorKind: 'hero', foreground: false }),
  0,
  'cover behind the hero in painter order must never trigger the helper',
);
console.log('PASS Painted masks reveal only bounded contour pixels behind genuine foreground cover.');
