'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const length = (a, path) => {
  let total = 0;
  for (const p of path) {
    total += Math.hypot(p.x - a.x, p.y - a.y);
    a = p;
  }
  return total;
};
const g = new C('developer', 'mage', () => 0.9);
g.enter('frontier');
const z = g.zone();
g.s.expeditionRank = 2;
g.s.mercyTime = 0;
z.enemies = [];
const a = { x: 450, y: 500 },
  target = { x: 2600, y: 1650 };
const old = g.route(a, target),
  path = g.companionRoute(a, target);
assert(path.length);
let from = a;
for (const p of path) {
  assert(g.clearSegment(from, p));
  from = p;
}
console.log({ oldLength: length(a, old), newLength: length(a, path) });
// Controlled open terrain: a direct shortest path crosses an enemy's awareness.
const originalBlocked = g.blocked;
g.blocked = (x, y, zone, r = 15) => x < 40 + r || y < 40 + r || x > 3345 - r || y > 3345 - r;
const enemy = g.makeEnemy(
  { species: 'orc', name: 'route sentry', level: 5, hp: 1000, damage: 20, gold: 0, xp: 0 },
  { x: 1400, y: 1300 },
);
z.enemies = [enemy];
g.s.time++;
const start = { x: 900, y: 1300 },
  end = { x: 1900, y: 1300 },
  safe = g.companionRoute(start, end, true);
assert(safe.length);
const threats = g.gatheringThreats();
from = start;
for (const p of safe) {
  assert(g.companionTravelClear(from, p, threats, start));
  from = p;
}
assert(length(start, safe) > 1000);
// Explicit cautious combat routes still avoid hostile destinations.
assert.equal(g.companionRoute(start, enemy, true).length, 0);
const u = g.unit('soldier', start.x, start.y);
g.s.party = [u];
u.order = { type: 'gather', id: 'job' };
g.follow(u, enemy, 230, 0.1);
assert(u.x > start.x, 'gather order departs despite nearby hostile awareness');
assert.equal(u.order.type, 'gather');
// Gatherers walk the physical route through awareness; actual enemy bodies remain solid.
Object.assign(enemy, { y: 1400 });
g.s.time++;
let crossedAwareness = false;
for (let i = 0; i < 500 && Math.hypot(u.x - end.x, u.y - end.y) > 46; i++) {
  g.s.time += 0.05;
  g.follow(u, end, 230, 0.05);
  if (Math.hypot(u.x - enemy.x, u.y - enemy.y) < threats[0].r) crossedAwareness = true;
}
assert(Math.hypot(u.x - end.x, u.y - end.y) <= 46);
assert(crossedAwareness);
// Encounter combat, retained jobs, payout and save lifecycle are covered by
// gathering-escort.test.cjs under the owner-selected escort behavior.
console.log(
  'PASS physical terrain routes, optional cautious routes and explicit gathering departure',
);
