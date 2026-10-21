'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
function fixture() {
  const g = new C('developer', 'mage', () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  g.zone = () => z;
  g.blocked = (x, y, zone, r = 15) => x < 40 + r || y < 40 + r || x > 2800 - r || y > 2800 - r;
  g.s.expeditionRank = 2;
  g.s.mercyTime = 0;
  const u = g.unit('soldier', 600, 1000);
  g.s.party = [u];
  Object.assign(g.hero, { x: 550, y: 1000 });
  z.nodes = [{ id: 'job', x: 600, y: 1000, amount: 12, kind: 'resource', resourceGroup: 'coins' }];
  u.order = { type: 'deposit', id: 'job', group: 'coins' };
  u.carry = 35;
  return { g, z, u };
}
const { g, z, u } = fixture();
const enemy = g.makeEnemy(
  { species: 'orc', level: 3, hp: 10000, damage: 20, gold: 0, xp: 0 },
  { x: 1050, y: 1000 },
);
z.enemies = [
  enemy,
  g.makeEnemy(
    { species: 'orc', level: 3, hp: 1000, damage: 10, gold: 0, xp: 0 },
    { x: 300, y: 130 },
  ),
];
z.npcs = [
  { id: 'unsafe', kind: 'rest', x: 1100, y: 1000 },
  { id: 'safe', kind: 'rest', x: 1700, y: 1000 },
];
assert.equal(g.depositSite(u).id, 'safe', 'enemy-held nearer refuge is rejected');
z.enemies = [];
g.s.time++;
const beforeGold = g.hero.gold;
let returned = false,
  reverse,
  deliveredAt;
for (let i = 0; i < 1500; i++) {
  const prior = { x: u.x, y: u.y };
  Object.assign(g.hero, { x: u.x - 70, y: u.y + 20 });
  g.s.time += 0.05;
  g.updateParty(0.05);
  assert(g.clearSegment(prior, u, g.actorRadius(u)), 'actual delivery respects body/terrain');
  if (u.order?.journey?.returning && !reverse) {
    reverse = JSON.parse(JSON.stringify(u.order.journey.points));
    deliveredAt = { x: u.x, y: u.y };
    assert.deepEqual(reverse.at(-1), { x: 600, y: 1000 });
    const saved = g.snapshot(),
      restored = C.restore(saved, () => 0.9);
    assert.deepEqual(
      restored.s.party[0].order.journey,
      u.order.journey,
      'reverse route survives phone save/reload',
    );
    saved.party[0].order.journey.points = [{ x: Infinity, y: 1000 }];
    const repaired = C.restore(saved, () => 0.9);
    assert(!repaired.s.party[0].order.journey, 'malformed trail discarded, job retained');
  }
  if (reverse && !u.order?.journey) {
    returned = true;
    break;
  }
}
assert(reverse?.length > 5, 'record actual detour as breadcrumbs');
assert(returned, 'return to the source before any further gathering');
assert(Math.hypot(u.x - 600, u.y - 1000) < 12);
assert(g.hero.gold > beforeGold);
assert.equal(u.order.id, 'job', 'return resumes the same selected source');
assert(deliveredAt.x > 900);
console.log('PASS selected-source delivery, saved/malformed reverse trails and physical return');
