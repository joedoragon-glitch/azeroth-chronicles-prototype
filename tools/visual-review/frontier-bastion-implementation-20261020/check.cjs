'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  zlib = require('node:zlib');
const C = require('../../../src/prototype/engine'),
  R = require('../../../src/prototype/rules');
const clone = (x) => JSON.parse(JSON.stringify(x));
const old = JSON.parse(zlib.gunzipSync(fs.readFileSync(__dirname + '/dev103-save.json.gz')));
const nature = (p) =>
  R.frontierEdgeLayout.nature.includes(p.structure) ||
  (!p.structure && ['🌲', '🌳', '🪨'].includes(p.icon));
const g = new C('developer', 'mage', () => 0.9);
g.enter('frontier');
const f = g.zone(),
  of = old.zones.frontier;
assert.equal(f.props.length, of.props.length);
assert.deepEqual(clone(f.props.filter(nature)), of.props.filter(nature));
const moved = f.props.filter((p) => {
  const q = of.props.find((q) => q.id === p.id);
  return q && (p.x !== q.x || p.y !== q.y);
});
assert.equal(moved.length, 65);
assert.equal(f.roads.length - of.roads.length, 13);
for (const road of f.roads.slice(of.roads.length))
  for (let i = 1; i < road.length; i++)
    assert(g.clearSegment(road[i - 1], road[i], 25), 'New road remains open');
assert.deepEqual(clone(f.npcs), of.npcs);
assert.deepEqual(clone(f.nodes), of.nodes);
assert.deepEqual(clone(f.enemies), of.enemies);
const stable = JSON.stringify({ props: f.props, roads: f.roads });
for (let i = 0; i < 3; i++) g.zone();
assert.equal(JSON.stringify({ props: f.props, roads: f.roads }), stable);
g.enter('abyss');
const a = g.zone();
assert.equal(g.zoneSize(), 1650);
assert.equal(a.props.length, 38);
assert.equal(a.enemies.length, 27);
const exit = a.npcs.find((n) => n.kind === 'exit'),
  boss = a.enemies.find((e) => e.type === 'boss');
for (const e of a.enemies) {
  assert(!g.blocked(e.x, e.y));
  assert(g.route(e, exit).length);
  assert(g.route(e, boss).length);
}
for (const p of a.props) assert(!g.blocked(p.x, p.y, 'abyss', 0, true), p.id);
for (const [x, y] of R.dungeonTraps.abyss)
  assert(!g.blocked(x, y, 'abyss', 0, true), 'Trap on floor');
// Migrate the actual pre-change save. Deliberately retain wounds, a dead guard,
// depleted resource, earned currency, dropped loot and an inactive companion.
const legacy = clone(old);
legacy.gold = 1234;
legacy.zones.abyss.enemies[0].hp = 0;
legacy.zones.abyss.enemies[1].hp = 17;
legacy.zones.frontier.nodes[0].amount = 0;
legacy.loot.push({ id: 'layout-check', zone: 'abyss', x: 800, y: 700, gold: 12 });
const before = clone(legacy),
  restored = C.restore(legacy, () => 0.9),
  ra = restored.s.zones.abyss,
  rf = restored.s.zones.frontier;
assert.equal(ra.enemies[0].hp, 0);
assert.equal(ra.enemies[1].hp, 17);
assert.equal(restored.s.gold, 1234);
assert.equal(rf.nodes[0].amount, 0);
assert.equal(ra.props.length, 38);
assert.equal(ra.enemies.length, 27);
assert.deepEqual(rf.props, clone(f.props));
assert.deepEqual(rf.roads, f.roads);
assert.deepEqual(rf.props.filter(nature), of.props.filter(nature));
for (let i = 0; i < ra.enemies.length; i++) {
  const e = ra.enemies[i],
    b = before.zones.abyss.enemies[i];
  assert.equal(e.hp, b.hp);
  assert.equal(e.maxHp, b.maxHp);
  assert.equal(e.damage, b.damage);
  assert(Math.abs(e.x - b.x * 1.1) < 1e-6);
  assert(Math.abs(e.y - b.y * 1.1) < 1e-6);
  assert(!restored.blocked(e.x, e.y, 'abyss'));
}
assert.deepEqual([restored.hero.x, restored.hero.y], [before.hero.x * 1.1, before.hero.y * 1.1]);
assert.deepEqual(
  [restored.s.loot.at(-1).x, restored.s.loot.at(-1).y],
  [880.0000000000001, 770.0000000000001],
);
const coordinates = (c) =>
  JSON.stringify({
    hero: [c.hero.x, c.hero.y],
    enemies: c.s.zones.abyss.enemies.map((e) => [e.x, e.y, e.home]),
    props: c.s.zones.abyss.props,
    roads: c.s.zones.frontier.roads,
  });
const once = coordinates(restored),
  twice = C.restore(clone(restored.s), () => 0.9);
assert.equal(coordinates(twice), once);
// Off-zone cached dungeon migrates, without moving the hero in another map.
const off = clone(old);
off.zone = 'frontier';
Object.assign(off.hero, { x: 450, y: 500 });
const offResult = C.restore(off, () => 0.9);
assert.deepEqual([offResult.hero.x, offResult.hero.y], [450, 500]);
assert.equal(offResult.s.zones.abyss.dungeonSpaceVersion, 1);
// A player building occupying a preferred plot survives; props choose a clear alternative.
const occupied = clone(old),
  plot = R.frontierEdgeLayout.moves[0].after;
const h = new C('developer', 'mage', () => 0.9);
h.s = occupied;
const building = { id: 'layout-occupied', x: plot[0], y: plot[1], kind: 'barracks' };
h.s.zones.frontier.buildings.push(building);
h.frontierEdgeRedistribution(h.s.zones.frontier);
assert.deepEqual(building, { id: 'layout-occupied', x: plot[0], y: plot[1], kind: 'barracks' });
assert(
  h.s.zones.frontier.props.every(
    (p) => !moved.some((m) => m.id === p.id) || Math.hypot(p.x - building.x, p.y - building.y) > 90,
  ),
);
// Physical traffic through both widened aerie openings, using live collision and
// navigation. This exercises movement, not a claim about all tactical AI states.
const traffic = [];
for (const [left, right] of R.dungeonArchitecture.abyss.partitions.find(
  (w) => w.id === 'aerie-gate',
).gaps) {
  const y = (left + right) / 2,
    wall = R.dungeonArchitecture.abyss.partitions.find((w) => w.id === 'aerie-gate');
  const units = a.enemies.slice(0, 2),
    targets = units.map((e, i) => ({ x: wall.x2 + 70, y: y + (i ? 28 : -28) }));
  units.forEach((e, i) => Object.assign(e, { x: wall.x1 - 60, y: targets[i].y }));
  for (let frame = 0; frame < 240; frame++) {
    g.s.time += 1 / 30;
    units.forEach((e, i) => g.move(e, targets[i], 120, 1 / 30, 1));
  }
  units.forEach((e, i) =>
    assert(
      Math.hypot(e.x - targets[i].x, e.y - targets[i].y) < 3,
      'Two guards cross gate together',
    ),
  );
  traffic.push({ gap: [left, right], guards: 2, reached: true });
}
const evidence = {
  frontier: {
    props: f.props.length,
    moved: moved.length,
    natureUnchanged: f.props.filter(nature).length,
    newRoadSpurs: 13,
    bottomQuarterStructures: f.props.filter((p) => !nature(p) && p.y >= 2550).length,
  },
  abyss: {
    size: 1650,
    props: a.props.length,
    enemies: a.enemies.length,
    staticRoutes: 27,
    traffic,
  },
  save: {
    woundsDeathsCurrencyLootPreserved: true,
    idempotent: true,
    offZone: true,
    occupiedPlot: true,
  },
  scope:
    'Focused layout, real pre-dev104 save migration and doorway movement only; no whole-game/browser suite.',
};
fs.writeFileSync(__dirname + '/checks.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(evidence);
