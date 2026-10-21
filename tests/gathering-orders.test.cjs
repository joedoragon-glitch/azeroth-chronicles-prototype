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
// Real resource loop: nearby combat alone cannot hijack the job; an actual hit
// permits a local counter only, and harvesting continues without chase/skills.
z.nodes = [{ id: 'job', x: 900, y: 1300, amount: 40, kind: 'resource', resourceGroup: 'coins' }];
Object.assign(u, { x: 900, y: 1300, carry: 0, immune: 0, survivalCd: 100, cd: 0 });
Object.assign(g.hero, { x: 850, y: 1300 });
Object.assign(enemy, { x: 940, y: 1300, aggro: true });
g.zone();
const hp = enemy.hp;
g.updateParty(0.1);
assert.equal(enemy.hp, hp);
assert(z.nodes[0].amount < 40);
assert.equal(u.order.type, 'gather');
g.hitParty(u, 20, 0, enemy.id);
u.cd = 0;
const prior = enemy.hp;
g.updateParty(0.1);
assert(enemy.hp < prior);
assert.equal(u.order.type, 'gather');
assert.deepEqual([u.x, u.y], [900, 1300]);
// No pursuing that attacker after it withdraws out of reach.
enemy.x = 1200;
g.s.time++;
const still = enemy.hp;
g.updateParty(0.1);
assert.equal(enemy.hp, still);
assert.equal(u.order.type, 'gather');
// Ranged labor also counters only a verified attacker, retaining the job.
g.clearGatheringIntent(u);
u.type = 'archer';
u.cd = 0;
enemy.x = u.x + 150;
g.s.time++;
const shots = g.s.projectiles.length;
g.updateParty(0.1);
assert.equal(g.s.projectiles.length, shots);
g.hitParty(u, 20, 0, enemy.id);
u.cd = 0;
g.updateParty(0.1);
assert.equal(g.s.projectiles.length, shots + 1);
assert.equal(g.s.projectiles.at(-1).target, enemy.id);
assert.equal(u.order.type, 'gather');
u.type = 'soldier';
// A deposit route is selected by actual reachable walking distance. The nearest
// straight-line rest point is blocked by a partition; the other is reachable.
z.enemies = [];
g.s.time++;
g.blocked = (x, y, zone, r = 15) =>
  x < 40 + r ||
  y < 40 + r ||
  x > 3345 - r ||
  y > 3345 - r ||
  (x > 1000 - r && x < 1100 + r && y < 2600 + r);
z.npcs = [
  { id: 'rest', kind: 'rest', x: 1200, y: 1300 },
  { id: 'minor', kind: 'rest', x: 500, y: 1300 },
];
z.buildings = [];
u.order = { type: 'deposit', id: 'job', group: 'coins' };
u.carry = 35;
assert.equal(g.depositSite(u).id, 'minor');
// Recall clears the job/defensive receipt, returns to hero, then ordinary AI.
g.recallParty();
assert.equal(u.order, null);
assert(g.s.recallActive);
Object.assign(u, { x: g.hero.x + 50, y: g.hero.y });
g.updateParty(0.1);
assert(!g.s.recallActive);
// Complete an escorted resource trip while a living hostile covers both endpoints.
g.blocked = (x, y, zone, r = 15) => x < 40 + r || y < 40 + r || x > 3345 - r || y > 3345 - r;
z.enemies = [enemy];
Object.assign(enemy, { x: 550, y: 600, aggro: false });
g.s.time++;
z.npcs = [{ id: 'rest', kind: 'rest', x: 450, y: 500 }];
z.buildings = [];
z.nodes = [{ id: 'job', x: 650, y: 500, amount: 12, kind: 'resource', resourceGroup: 'coins' }];
Object.assign(u, { x: 450, y: 500, carry: 0 });
Object.assign(g.hero, { x: 450, y: 550 });
g.clearGatheringIntent(u);
u.order = null;
assert(g.gather('job'));
const escortedGold = g.hero.gold;
let departed = false;
for (let i = 0; i < 500 && u.order; i++) {
  g.s.time += 0.05;
  g.updateParty(0.05);
  if (u.x > 500) departed = true;
}
assert(departed);
assert.equal(u.order, null);
assert.equal(z.nodes[0].amount, 0);
assert(g.hero.gold > escortedGold);
assert(enemy.hp > 0);
// Restore the real map and complete a round trip with actual navigation.
z.enemies = [];
g.blocked = originalBlocked;
g.s.time++;
z.npcs = [{ id: 'rest', kind: 'rest', x: 450, y: 500 }];
z.nodes = [{ id: 'job', x: 650, y: 500, amount: 12, kind: 'resource', resourceGroup: 'coins' }];
Object.assign(u, { x: 450, y: 500, carry: 0 });
g.clearGatheringIntent(u);
u.order = null;
assert(g.gather('job'));
const gold = g.hero.gold;
for (let i = 0; i < 500 && u.order; i++) {
  g.s.time += 0.05;
  g.updateParty(0.05);
}
assert.equal(u.order, null);
assert.equal(z.nodes[0].amount, 0);
assert(g.hero.gold > gold);
// Jobs and carried resources survive a normal snapshot/update; attack receipts
// and routes remain runtime-only. Invalid or pet job orders are discarded.
u.order = { type: 'gather', id: 'job', group: 'forged' };
u.carry = 7;
const saved = g.snapshot();
assert.equal(saved.party[0].order.type, 'gather');
assert.equal(saved.party[0].order.group, 'coins');
const restored = C.restore(saved, () => 0.9);
assert.equal(restored.s.party[0].order.type, 'gather');
assert.equal(restored.s.party[0].carry, 7);
console.log(
  'PASS: physical routes, explicit cautious routing, gathering through hostile awareness, resource priority, verified self-defense, terrain-aware delivery selection, Recall, complete round-trip and save/update intent',
);
