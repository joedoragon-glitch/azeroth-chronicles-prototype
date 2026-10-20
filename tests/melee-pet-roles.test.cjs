'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
function scene(family) {
  const g = new C('normal', 'paladin', () => 0.9),
    z = g.zone();
  for (const key of ['props', 'npcs', 'nodes', 'buildings', 'enemies']) z[key] = [];
  Object.assign(g.hero, { x: 600, y: 1500 });
  g.hero.level = 20;
  g.hero.hp = g.hero.maxHp = g.heroNaturalMaxHp();
  g.s.mercyTime = 0;
  g.s.expeditionRank = 6;
  g.s.companionCombatTraining = 2;
  const u = g.unit('pet', 650, 1500, family);
  g.s.party = [u];
  const e = g.makeEnemy(
    { species: 'goblin', level: 20, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: 710, y: 1500 },
  );
  z.enemies = [e];
  g.engage(e);
  return { g, u, e };
}
for (const [family, slot, reduction] of [
  ['mine', 1, 0.25],
  ['cindermaw', 2, 0.35],
]) {
  for (const mode of ['ordinary', 'stronger-ward', 'recall', 'interrupt']) {
    if (mode === 'interrupt' && slot === 1) continue;
    const { g, u, e } = scene(family);
    if (mode === 'stronger-ward') {
      u.wardReduction = 0.6;
      u.wardUntil = g.s.time + 10;
    }
    if (slot === 1) assert(g.companionUseFirstSkill(u, e));
    else {
      assert(g.companionUseSecondSkill(u, e));
      assert.equal(
        u.wardReduction || 0,
        mode === 'stronger-ward' ? 0.6 : 0,
        'preparation cannot grant an early ward',
      );
      if (mode === 'interrupt') g.hitParty(u, u.maxHp * 0.1, 0, null, true);
      g.advancePartyChargeClock(0.65);
      g.resolveCompanionCharges();
    }
    if (mode === 'interrupt') {
      assert.equal(u.wardReduction || 0, 0);
      assert.equal(u.skill2Cd, 0);
      continue;
    }
    assert.equal(u.wardReduction, mode === 'stronger-ward' ? 0.6 : reduction);
    assert.equal(u.wardUntil, g.s.time + (mode === 'stronger-ward' ? 10 : 4));
    if (mode === 'recall') {
      u.x = 900;
      assert(g.recallParty());
    }
    const hp = u.hp;
    g.hitParty(u, 100);
    const factor = mode === 'stronger-ward' ? 0.4 : mode === 'recall' ? 0.5 : 1 - reduction;
    assert(
      Math.abs(hp - u.hp - (100 - g.companionArmor('pet') * 0.35) * factor) < 1e-7,
      'real mitigation uses strongest layer',
    );
    if (mode === 'ordinary') {
      g.s.time += 4.01;
      u.hp = u.maxHp;
      const hp = u.hp;
      g.hitParty(u, 100);
      assert(
        Math.abs(hp - u.hp - (100 - g.companionArmor('pet') * 0.35)) < 1e-7,
        'ward expires at four seconds',
      );
    }
  }
}
for (const family of Object.keys(C.rules.petCompanions).filter(
  (f) => C.rules.petCompanions[f].role === 'melee',
)) {
  const { g, u, e } = scene(family),
    def = g.petSkillDefinition(u, 2);
  for (let i = 1; i < 7; i++) {
    const add = g.makeEnemy(
      { species: 'goblin', level: 20, hp: 10000, damage: 0, xp: 0, gold: 0 },
      { x: e.x + i * 5, y: e.y + i },
    );
    g.zone().enemies.push(add);
    g.engage(add);
  }
  const outside = g.makeEnemy(
    { species: 'goblin', level: 20, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: u.x - 200, y: u.y - 250 },
  );
  g.zone().enemies.push(outside);
  g.engage(outside);
  const before = g.zone().enemies.map((e) => e.hp);
  assert(g.companionUseSecondSkill(u, e));
  g.advancePartyChargeClock(0.65);
  g.resolveCompanionCharges();
  const hits = g.zone().enemies.filter((e, i) => e.hp < before[i]);
  assert.equal(hits.length, def.cap || 1, family + ' real area cap');
  assert.equal(outside.hp, outside.maxHp, 'expanded area does not hit an outside enemy');
  if (def.slow) assert(hits.every((e) => e.slow === def.slow));
  assert.equal(u.skill2Cd, 12, 'original cooldown retained');
}
// Sovereign remains an ordinary pet: its existing first hit gains a bounded
// conditional finisher, rather than permanently better base stats or a kill.
for (const fraction of [1, 0.350001, 0.35, 0.2]) {
  const { g, u, e } = scene('darklord');
  e.hp = e.maxHp * fraction;
  const before = e.hp;
  assert(g.companionUseFirstSkill(u, e));
  const expected = g.companionAttackDamage(u) * 2.6 * (fraction <= 0.35 ? 1.25 : 1);
  assert(Math.abs(before - e.hp - expected) < 1e-7, 'only wounded targets receive the 25% bonus');
  assert(e.hp > 0, 'finisher is bounded damage, never an execution');
  assert.equal(u.skill1Cd, 8);
  assert(g.petSkillSummary('darklord', 1).includes('35% HP'));
}
console.log(
  'PASS defensive pet real wards/expiry/strongest-layer/interrupt and all seven melee area caps/Slow/outside targets',
);
