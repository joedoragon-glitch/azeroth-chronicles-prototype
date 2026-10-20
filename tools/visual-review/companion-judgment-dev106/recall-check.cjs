'use strict';
const assert = require('node:assert/strict'),
  C = require('../../../src/prototype/engine'),
  R = require('../../../src/prototype/rules');
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
for (const cls of ['mage', 'ranger', 'paladin']) {
  const g = new C('developer', cls, () => 0.9),
    z = g.zone();
  z.props = [];
  g.s.mercyTime = 0;
  g.s.expeditionRank = 3;
  g.s.true.crypt = true;
  g.s.normal.crypt = true;
  Object.assign(g.hero, { x: 600, y: 1500 });
  g.s.party = [
    g.unit('soldier', 200, 1500),
    g.unit('archer', 220, 1540),
    g.unit('pet', 240, 1460, 'crypt'),
  ];
  const units = g.s.party;
  units[0].order = { type: 'build', id: 'unfinished' };
  g.beginPartyCharge(units[1], 1);
  const e = g.makeEnemy(
    { species: 'orc', name: 'attacker', level: 5, hp: 99999, damage: 100, gold: 0, xp: 0 },
    { x: 700, y: 1500 },
  );
  e.aggro = true;
  z.enemies = [e];
  g.zone();
  const retreatOrder = { type: 'move', x: 500, y: 1500 };
  g.hero.order = retreatOrder;
  assert(g.recallParty());
  assert.equal(g.hero.order, retreatOrder, 'Recall preserves the player retreat destination');
  assert(units.every((u) => !u.order && !g.partyChargeState(u)));
  assert(g.recallInProgress());
  const path = units[0].path;
  g.recallParty();
  assert.equal(units[0].path, path, 'repeated Recall does not restart path');
  const saved = g.snapshot(),
    restored = C.restore(saved, () => 0.9);
  assert(
    saved.recallActive && restored.recallInProgress(),
    'one-press order persists across reload',
  );
  g.hero.cd[0] = 0;
  g.hero.mp = g.hero.maxMp;
  assert(g.cast(1, e.id));
  assert(g.s.recallActive, 'manual hero offense cannot cancel an unfinished return');
  g.toggleSquadDoctrine();
  assert(g.s.recallActive, 'doctrine switch cannot abandon return');
  for (let i = 0; i < 300 && g.recallInProgress(); i++) {
    g.s.time += 0.05;
    g.updateParty(0.05);
    if (i % 12 === 0 && g.recallInProgress()) {
      g.hero.cd[0] = 0;
      g.hero.mp = g.hero.maxMp;
      g.cast(1, e.id);
      assert(g.s.recallActive);
    }
  }
  assert(!g.recallInProgress(), cls + ' companions reach the player from one press');
  assert(units.every((u) => d(u, g.hero) <= R.companionRecall.arrivalRadius));
  assert(g.s.recallActive, 'arrival retains ordinary defensive hold');
  g.hero.cd[0] = 0;
  g.hero.mp = g.hero.maxMp;
  assert(g.cast(1, e.id));
  assert(!g.s.recallActive, 'a new attack after arrival restores normal behavior');
}
// The retreat bonus is exactly 50%, combines with wards by strongest defense,
// ends on arrival and never buffs the hero or non-party escorts.
{
  const g = new C('normal', 'mage', () => 0.9);
  g.zone().props = [];
  g.zone().enemies = [];
  Object.assign(g.hero, { x: 600, y: 1500 });
  const u = g.unit('soldier', 200, 1500);
  g.s.party = [u];
  u.maxHp = u.hp = 10000;
  g.recallParty();
  const base = 100 - g.companionArmor(u.type) * 0.35;
  g.hitParty(u, 100);
  assert(Math.abs(10000 - u.hp - base * 0.5) < 1e-6);
  u.hp = 10000;
  u.wardReduction = 0.25;
  u.wardUntil = g.s.time + 20;
  g.hitParty(u, 100);
  assert(Math.abs(10000 - u.hp - base * 0.5) < 1e-6, 'does not multiply retreat and ward');
  u.hp = 10000;
  u.wardReduction = 0.7;
  g.hitParty(u, 100);
  assert(Math.abs(10000 - u.hp - base * 0.3) < 1e-6, 'stronger ward wins');
  delete u.wardUntil;
  u.hp = 10000;
  Object.assign(u, { x: 650, y: 1500 });
  g.hitParty(u, 100);
  assert(Math.abs(10000 - u.hp - base) < 1e-6, 'protection ends on arrival');
  assert(!g.companionRetreating(g.hero));
  assert(!g.companionRetreating({ hp: 100, x: 200, y: 1500 }));
  const old = g.snapshot();
  delete old.recallActive;
  assert.equal(C.restore(old, () => 0.9).s.recallActive, false);
  const malformed = g.snapshot();
  malformed.recallActive = 'yes';
  assert.throws(() => C.restore(malformed), /Invalid Recall/);
}
console.log(
  'PASS one-press Recall: all three heroes, Soldier/Archer/pet, job/cast cancellation, idempotent presses, hero offense and doctrine during return, complete arrival, defensive hold/release, reload persistence, 50% non-stacking retreat defense and legacy validation',
);
