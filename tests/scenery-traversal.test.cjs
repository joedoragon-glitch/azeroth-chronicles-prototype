'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
function field(structure, decorative = true, r = 0) {
  const c = new C('developer', 'paladin', () => 0.73),
    z = c.zone();
  Object.assign(z, {
    roads: [],
    footpaths: [],
    npcs: [],
    nodes: [],
    buildings: [],
    enemies: [],
    props: [{ id: 'review-tree', x: 500, y: 1500, structure, decorative, r }],
  });
  c.s.party = [];
  Object.assign(c.hero, { x: 400, y: 1500 });
  return c;
}
for (const type of [
  'fruit-tree',
  'dead-tree',
  'regrowth-birch',
  'regrowth-willow',
  'sapling',
  'pine-sapling',
]) {
  const c = field(type),
    z = c.zone(),
    p = z.props[0];
  assert(c.blocked(p.x, p.y), type + ' trunk blocks walking');
  assert(!c.blocked(p.x + 40, p.y), type + ' canopy edge stays walkable');
  assert(
    c.line({ x: 400, y: 1500 }, { x: 600, y: 1500 }),
    'existing projectile sight is unchanged',
  );
  assert(
    c.clearSegment({ x: 400, y: 1500 }, { x: 600, y: 1500 }, 0),
    'projectile flight remains unchanged',
  );
  for (const kind of ['hero', 'soldier', 'archer', 'pet', 'enemy', 'boss']) {
    const actor =
      kind === 'hero'
        ? c.hero
        : kind === 'enemy' || kind === 'boss'
          ? c.makeEnemy(
              { species: 'goblin', name: kind, level: 1, hp: 100, damage: 0, gold: 0, xp: 0 },
              { x: 400, y: 1500 },
            )
          : c.unit(kind, 400, 1500, 'crypt');
    if (kind === 'boss') Object.assign(actor, { type: 'boss', family: 'crypt' });
    Object.assign(actor, { x: 400, y: 1500 });
    if (actor !== c.hero) Object.assign(c.hero, { x: 300, y: 1300 });
    for (let j = 0; j < 6; j++) {
      c.s.time += 0.1;
      c.move(actor, { x: 600, y: 1500 }, 100, 0.1, 0, true);
    }
    assert(
      actor.x <= 500 - C.rules.sceneryTraversal.radii[type] - 15 + 0.01,
      kind + ' cannot phase through ' + type,
    );
    for (let j = 0; j < 200 && Math.hypot(actor.x - 600, actor.y - 1500) > 3; j++) {
      c.s.time += 0.1;
      c.follow(actor, { x: 600, y: 1500 }, 120, 0.1, 1);
    }
    assert(Math.hypot(actor.x - 600, actor.y - 1500) < 3, kind + ' can route around ' + type);
  }
}
for (const type of ['grass', 'bush', 'wildflowers', 'reeds', 'cattails']) {
  const c = field(type);
  assert(c.clearSegment({ x: 400, y: 1500 }, { x: 600, y: 1500 }), 'low vegetation stays passable');
}
{
  const c = field('march-boardwalk', false, 32);
  assert(c.clearSegment(c.hero, { x: 600, y: 1500 }), 'boardwalk becomes walkable');
  assert(
    !c.clearSegment(c.hero, { x: 600, y: 1500 }, 0),
    'existing railing/cover contract stays unchanged',
  );
  for (let i = 0; i < 25; i++) {
    c.s.time += 0.1;
    c.move(c.hero, { x: 600, y: 1500 }, 100, 0.1);
  }
  assert(c.hero.x === 600, 'hero crosses boardwalk');
}
for (const protection of ['service', 'resource', 'camp', 'home', 'road']) {
  const c = field('fruit-tree'),
    z = c.zone();
  if (protection === 'service') z.npcs.push({ x: 500, y: 1500 });
  if (protection === 'resource') z.nodes.push({ x: 500, y: 1500 });
  if (protection === 'camp') z.buildings.push({ x: 500, y: 1500 });
  if (protection === 'home') z.enemies.push({ home: { x: 500, y: 1500 } });
  if (protection === 'road')
    z.roads.push([
      { x: 400, y: 1500 },
      { x: 600, y: 1500 },
    ]);
  assert(!c.blocked(500, 1500), protection + ' conflicts remain deferred');
}
{
  const c = field('vale-cottage', false, 32);
  assert(c.blocked(500, 1500), 'solid houses retain collision');
  c.enter('crypt');
  const z = c.zone();
  z.props = [
    { id: 'interior-decoration', structure: 'fruit-tree', decorative: true, r: 0, x: 350, y: 450 },
  ];
  assert(!c.blocked(350, 450), 'interior decoration unchanged');
  z.props[0].decorative = false;
  z.props[0].r = 30;
  assert(c.blocked(350, 450), 'interior solid remains solid');
}
console.log(
  'PASS outdoor trunk/boardwalk traversal, hero/troops/pets/enemies/bosses, LOS, vegetation, protected access and interior isolation',
);
{
  const c = field('fruit-tree');
  c.s.party = [c.unit('soldier', 500, 1500)];
  Object.assign(c.hero, { x: 500, y: 1500, gold: 4321, hp: 90 });
  const restored = C.restore(c.snapshot(), () => 0.73);
  assert.equal(restored.hero.gold, 4321, 'migration preserves crowns');
  assert.equal(restored.hero.hp, 90, 'migration preserves hero wounds');
  assert(
    !restored.blocked(restored.hero.x, restored.hero.y),
    'historical hero under new trunk is repaired to clear ground',
  );
  for (const u of restored.s.party)
    assert(!restored.blocked(u.x, u.y), 'historical companion under trunk is repaired');
}
console.log('PASS saved-position repair preserves currency and hero wounds');
{
  const renderer = require('../src/prototype/renderer');
  for (const type of ['sapling', 'pine-sapling', 'regrowth-birch', 'regrowth-willow']) {
    const p = { structure: type, decorative: true, r: 0, renderKind: 'prop' };
    assert(!renderer.optimizationClutter(p), 'solid tree uses normal culling bounds');
    assert(renderer.majorOccluder(p), 'actor behind tree can receive an outline');
  }
}
console.log('PASS solid tree visibility and canopy occlusion in Optimization Mode');
