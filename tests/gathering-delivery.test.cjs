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
const beforeGold = g.hero.gold;
let returned = false,
  reverse,
  deliveredAt;
for (let i = 0; i < 1500; i++) {
  const prior = { x: u.x, y: u.y };
  Object.assign(g.hero, { x: u.x - 70, y: u.y + 20 });
  g.s.time += 0.05;
  g.updateParty(0.05);
  assert(
    g.companionTravelClear(prior, u, g.gatheringThreats()),
    'delivery/return never crosses hostile awareness',
  );
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
assert(u.order.cautious, 'automatic continuation retains safe routing');
assert(deliveredAt.x > 1500);
// New danger on a remembered return segment never triggers a new bossward route.
u.order = {
  type: 'gather',
  id: 'job',
  group: 'coins',
  journey: { returning: true, points: [{ x: u.x + 100, y: u.y }] },
};
const block = g.makeEnemy(
  { species: 'orc', level: 3, hp: 1000, damage: 10, gold: 0, xp: 0 },
  { x: u.x + 100, y: u.y },
);
z.enemies = [block];
g.s.time++;
const oldX = u.x;
g.updateParty(0.05);
assert(u.x <= oldX, 'blocked reverse trail does not advance into the new enemy');
// If every drop-off is threatened, retain cargo and regroup; never pay into an enemy camp.
const f = fixture();
f.z.npcs = [{ id: 'rest', kind: 'rest', x: 650, y: 1000 }];
f.z.enemies = [
  f.g.makeEnemy(
    { species: 'orc', level: 3, hp: 1000, damage: 20, gold: 0, xp: 0 },
    { x: 650, y: 1000 },
  ),
  f.g.makeEnemy(
    { species: 'orc', level: 3, hp: 1000, damage: 20, gold: 0, xp: 0 },
    { x: 300, y: 130 },
  ),
];
const cash = f.g.hero.gold;
assert.equal(f.g.depositSite(f.u), null);
f.g.s.time++;
f.g.updateParty(0.05);
assert.equal(f.u.carry, 35);
assert.equal(f.g.hero.gold, cash);
// Critical wounds use established retreat judgement while retaining the delivery assignment.
f.u.hp = f.u.maxHp * 0.1;
Object.assign(f.g.hero, { x: 450, y: 1000 });
f.g.s.time++;
const x = f.u.x;
f.g.updateParty(0.1);
assert(f.u.x < x);
assert.equal(f.u.order.type, 'deposit');
f.g.recallParty();
assert.equal(f.u.order, null);
assert.equal(f.u.carry, 35);
console.log(
  'PASS safe drop-offs, hostile detour, reverse return, saved trail, blocked return, retained cargo, survival and Recall',
);
