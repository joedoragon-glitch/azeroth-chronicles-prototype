'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const g = new C('normal', 'mage', () => 0.9);
g.enter('march');
const z = g.zone();
// Simulate an existing save with its historical overlapping frontage.
const old = {
  'aesthetic-town-0': [185, 1085],
  'aesthetic-town-5': [125, 1120],
  'aesthetic-town-7': [315, 915],
  'aesthetic-town-99': [50, 1115],
};
for (const p of z.props) if (old[p.id]) [p.x, p.y] = old[p.id];
Object.assign(
  z.npcs.find((n) => n.id === 'recruiter'),
  { x: 225, y: 1190 },
);
delete z.reedportRefugeSpacingVersion;
const before = {
  props: z.props.map((p) => p.id),
  npcs: z.npcs.map((n) => n.id),
  hero: { x: g.hero.x, y: g.hero.y, hp: g.hero.hp },
};
const saved = g.snapshot(),
  restored = C.restore(saved, () => 0.9),
  after = restored.zone();
assert.equal(after.reedportRefugeSpacingVersion, 1);
assert.deepEqual(
  after.props.map((p) => p.id),
  before.props,
);
assert.deepEqual(
  after.npcs.map((n) => n.id),
  before.npcs,
);
assert.deepEqual({ x: restored.hero.x, y: restored.hero.y, hp: restored.hero.hp }, before.hero);
const refuge = after.npcs.find((n) => n.id === 'rest'),
  recruiter = after.npcs.find((n) => n.id === 'recruiter');
assert(!restored.blocked(recruiter.x, recruiter.y));
assert(restored.companionRoute({ x: C.data.towns[1][0], y: C.data.towns[1][1] }, recruiter).length);
assert(Math.hypot(recruiter.x - refuge.x, recruiter.y - refuge.y) > 300);
for (const id of ['aesthetic-town-0', 'aesthetic-town-5']) {
  const p = after.props.find((p) => p.id === id);
  assert(Math.hypot(p.x - refuge.x, p.y - refuge.y) > 400);
}
const stable = JSON.stringify(after.props);
restored.zone();
assert.equal(JSON.stringify(after.props), stable);
console.log(
  'PASS Reedport old-save migration, retained IDs/progress, clear refuge, reachable recruiter and idempotence',
);
