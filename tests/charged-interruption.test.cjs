'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;

function arena(type = 'soldier') {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.s.mercyTime = 0;
  g.zone().props = [];
  g.hero.skills = Array(8).fill(1);
  Object.assign(g.hero, { x: 500, y: 500, hp: 1000, maxHp: 1000, immune: 0 });
  const ally = g.unit(type, 520, 500);
  Object.assign(ally, { hp: 1000, maxHp: 1000, immune: 0 });
  g.s.party = [ally];
  g.s.companionCombatTraining = 2;
  const foe = g.makeEnemy(
    { species: 'goblin', name: 'Interruption target', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: 590, y: 500 },
  );
  g.zone().enemies = [foe];
  return { g, ally, foe };
}

assert.equal(R.chargedSkills.holdSeconds, 0.65, 'fixed cast time is unchanged');
assert.deepEqual(R.chargedSkills.interrupt, {
  hpFraction: 0.07, minimumHp: 6, recoverySeconds: 0.5,
});

{
  const { g, ally } = arena();
  assert(g.beginPartyCharge(g.hero, 1));
  assert(g.hitParty(g.hero, 69, 0, null, true), 'mitigated HP hit resolves');
  assert.equal(g.hero.hp, 931);
  assert.equal(g.partyChargeState(g.hero).lostHp, 69, 'count actual lost HP');
  assert.equal(g.partyChargeState(g.hero).interrupted, false, 'small single hit is survived');
  // Taking damage on another party member cannot interrupt this actor.
  assert(g.hitParty(ally, 100, 0, null, true));
  assert.equal(g.partyChargeState(g.hero).lostHp, 69);
  assert(g.hitParty(g.hero, 1, 0, null, true));
  assert.equal(g.partyChargeState(g.hero).interrupted, true, 'cumulative 7% loss interrupts');
  assert.equal(g.effects.filter(e => e.type === 'chargeInterrupted').length, 1);
  assert(g.hitParty(g.hero, 1, 0, null, true));
  assert.equal(g.effects.filter(e => e.type === 'chargeInterrupted').length, 1, 'event fires only once');
  g.clearPartyCharge(g.hero);
  assert.equal(g.partyChargeState(g.hero), null);
}

{
  const { g } = arena();
  assert(g.beginPartyCharge(g.hero, 1));
  g.hero.immune = 1;
  assert.equal(g.hitParty(g.hero, 900, 0, null, true), false, 'immune attack does not damage');
  g.hero.immune = 0;
  assert(g.hitParty(g.hero, 0, 0, null, true), 'zero-damage contact remains a hit');
  assert.equal(g.hero.hp, 1000);
  assert.equal(g.partyChargeState(g.hero).lostHp, 0, 'zero HP loss never interrupts');
  assert(g.hitParty(g.hero, 30, 0, null, true));
  assert.equal(g.partyChargeState(g.hero).interrupted, false);
  assert(g.hitParty(g.hero, 40, 0, null, true));
  assert.equal(g.partyChargeState(g.hero).interrupted, true, 'multiple small hits add together');
}

{
  const { g } = arena();
  assert(g.beginPartyCharge(g.hero, 3, performance.now() - 1));
  g.hitParty(g.hero, 150, 0, null, true);
  assert.equal(g.partyChargeState(g.hero).interrupted, false, 'completed hold cannot be cancelled retroactively');
  assert(g.beginPartyCharge(g.hero, 3, performance.now() + 10000));
  g.hitParty(g.hero, 70, 0, null, true);
  assert.equal(g.partyChargeState(g.hero).interrupted, true, 'the same loss can interrupt an active hold');
}

for (const type of ['soldier', 'archer']) {
  const { g, ally, foe } = arena(type);
  assert(g.companionUseSecondSkill(ally, foe), type + ' starts its charged skill');
  assert.equal(ally.skill2Cd, 0, 'no full skill cooldown before release');
  assert.equal(foe.hp, foe.maxHp, 'no instant damage');
  assert.equal(g._companionCharges.get(ally.id).remaining, 0.65);
  g.updateParty(0.3);
  assert.equal(foe.hp, foe.maxHp, 'no damage partway through preparation');
  assert(g.hitParty(ally, 69, 0, null, true));
  assert.equal(g.partyChargeState(ally).interrupted, false, 'small hit does not cancel companion');
  g.updateParty(0.35);
  assert(foe.hp < foe.maxHp, type + ' deals damage after full 0.65s');
  assert.equal(ally.skill2Cd, R.companionSkills.second.cooldown, 'full cooldown starts at release');
  assert.equal(g._companionCharges.has(ally.id), false);
  assert.equal(g.partyChargeState(ally), null);
}

{
  const { g, ally, foe } = arena();
  assert(g.companionUseSecondSkill(ally, foe));
  assert(g.hitParty(ally, 30, 0, null, true));
  assert.equal(g.partyChargeState(ally).interrupted, false);
  assert(g.hitParty(ally, 40, 0, null, true));
  assert.equal(g.partyChargeState(ally).interrupted, true);
  assert.equal(g.effects.filter(e => e.type === 'chargeInterrupted').length, 1);
  g.updateParty(0.65);
  assert.equal(foe.hp, foe.maxHp, 'interrupted companion deals no charged damage');
  assert.equal(ally.skill2Cd, 0, 'interrupted release does not spend charged cooldown');
  assert(ally.skillGlobalCd > 0 && ally.skillGlobalCd <= R.chargedSkills.interrupt.recoverySeconds, 'brief recovery after interruption');
  assert.equal(g.partyChargeState(ally), null);
  assert.equal(g._companionCharges.has(ally.id), false);
  assert(!g.effects.some(e => e.type === 'companionSkill' && e.source === ally.id));
}

{
  const { g, ally, foe } = arena('archer');
  ally.immune = 1;
  assert(g.companionUseSecondSkill(ally, foe));
  assert.equal(g.hitParty(ally, 200, 0, null, true), false);
  assert.equal(g.partyChargeState(ally).lostHp, 0);
  g.updateParty(0.65);
  assert(foe.hp < foe.maxHp, 'immune archer can complete its hold');
}

{
  const { g, ally } = arena();
  assert(g.companionUseSecondSkill(ally, g.zone().enemies[0]));
  const snap = g.snapshot();
  const restored = Campaign.restore(snap, () => 0.9);
  assert(!restored._companionCharges?.size, 'transient casting is not serialized');
  assert(!restored._pendingPartyCharges?.size, 'damage meter is not serialized');
}

console.log('PASS fixed-time hero and companion charged skill interruption from actual HP loss');
