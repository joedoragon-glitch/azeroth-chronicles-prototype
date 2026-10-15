'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;

function arena(type = 'soldier') {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.s.mercyTime = 0;
  game.zone().props = [];
  game.zone().buildings = [];
  game.zone().npcs = [];
  Object.assign(game.hero, { x: 500, y: 500, order: null });
  game.hero.skills[1] = 1;
  game.s.companionCombatTraining = 2;
  const u = game.unit(type, 520, 500);
  game.s.party = [u];
  const e = game.makeEnemy(
    { species: 'goblin', name: 'Hold target', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x: type === 'soldier' ? 585 : 680, y: 500 },
  );
  game.zone().enemies = [e];
  return { game, u, e };
}

assert.equal(R.chargedSkills.holdSeconds, 0.65, 'the existing hold duration stays fixed');
assert.deepEqual(R.chargedSkills.interrupt, {
  hpFraction: 0.07, minimumHp: 6, recoverySeconds: 0.5,
});

for (const heroClass of ['paladin', 'mage', 'ranger']) {
  const g = new Campaign('normal', heroClass, () => 0.9);
  g.s.mercyTime = 0;
  const h = g.hero;
  h.hp = h.maxHp = 100;
  assert(g.beginPartyCharge(h, 2));
  assert(g.hitParty(h, 0, 0, null, true), 'a zero-HP-loss hit is harmless to a cast');
  assert.equal(g.partyChargeState(h).lostHp, 0);
  assert(!g.partyChargeState(h).interrupted);
  h.immune = 1;
  assert(!g.hitParty(h, 100, 0, null, true), 'immunity blocks damage completely');
  h.immune = 0;
  for (const hit of [3, 3]) {
    assert(g.hitParty(h, hit, 0, null, true));
    assert(!g.partyChargeState(h).interrupted, 'one or two weak hits cannot break a hold');
  }
  assert(g.hitParty(h, 1, 0, null, true), 'cumulative real HP loss crosses the threshold');
  assert.equal(g.partyChargeState(h).lostHp, 7);
  assert(g.partyChargeState(h).interrupted);
  assert.equal(g.effects.filter((e) => e.type === 'chargeInterrupted').length, 1);
  assert.equal(g.hero.cd[1], 0, 'interrupted preparation never pays the full cooldown');
  assert(g.hitParty(h, 5, 0, null, true));
  assert.equal(g.effects.filter((e) => e.type === 'chargeInterrupted').length, 1, 'no duplicate interruption');
  g.clearPartyCharge(h);
  assert.equal(g.partyChargeState(h), null, 'hold state is transient and cleared');
}
console.log('PASS all hero classes: zero loss, immunity, cumulative threshold, single cancellation');

for (const type of ['soldier', 'archer']) {
  const { game, u, e } = arena(type);
  const before = e.hp;
  assert(game.companionUseSecondSkill(u, e), type + ' begins the hold');
  assert.equal(e.hp, before, type + ' cannot deal early damage');
  assert.equal(u.skill2Cd, 0, 'cooldown is not paid before release');
  assert(game._companionCharges.has(u.id));
  game.updateParty(0.3);
  assert.equal(e.hp, before, type + ' is still charging before 0.65s');
  assert.equal(u.skill2Cd, 0);
  game.updateParty(0.35);
  assert(e.hp < before, type + ' releases only at 0.65s');
  assert.equal(u.skill2Cd, R.companionSkills.second.cooldown);
  assert(!game._companionCharges.has(u.id));
  assert(!game.partyChargeState(u));
  assert(game.effects.some((event) => event.type === 'companionChargeStart'));
  assert(game.effects.some((event) => event.type === 'companionSkill' && event.source === u.id));
}
console.log('PASS soldier and archer: preparation countdown, delayed release, visual events');

for (const type of ['soldier', 'archer']) {
  const { game, u, e } = arena(type);
  u.hp = u.maxHp = 120;
  const enemyHp = e.hp;
  assert(game.companionUseSecondSkill(u, e));
  game.updateParty(0.25);
  assert(game.hitParty(u, 4, 0, null, true));
  assert(!game.partyChargeState(u).interrupted, 'one weak hit does not stop charging');
  assert(game.hitParty(u, 5, 0, null, true));
  assert(game.partyChargeState(u).interrupted, 'two hits crossing 7% threshold break the cast');
  game.updateParty(0.4);
  assert.equal(e.hp, enemyHp, 'interrupted companion never releases its charged damage');
  assert.equal(u.skill2Cd, 0, 'interruption never spends full charged cooldown');
  assert(!game._companionCharges.has(u.id));
  assert(!game.partyChargeState(u));
  assert(u.skillGlobalCd > 0, 'brief recovery prevents immediate same-frame retries');
  assert(game.effects.some((event) => event.type === 'chargeInterrupted' && event.target === u.id));
}
console.log('PASS both companions: cumulative damage interruption and recovery without skill cooldown');

{
  const { game, u, e } = arena();
  assert(game.companionUseSecondSkill(u, e));
  assert(game.beginPartyCharge(game.hero, 3));
  assert(game.hitParty(game.hero, 100, 0, null, true));
  assert(game.partyChargeState(game.hero).interrupted, 'hero hold can be broken');
  assert(!game.partyChargeState(u).interrupted, 'hero damage must not break companion hold');
  game.clearPartyCharge(game.hero);
  game.updateParty(0.65);
  assert(u.skill2Cd > 0, 'companion holds independently of the hero');
}
{
  const { game, u, e } = arena();
  u.hp = u.maxHp = 100;
  assert(game.companionUseSecondSkill(u, e));
  u.immune = 1;
  assert(!game.hitParty(u, 1000, 0, null, true), 'immune hits cannot interrupt');
  u.immune = 0;
  game.updateParty(0.65);
  assert(u.skill2Cd > 0, 'immune companion successfully completes its hold');
}
{
  const { game, u, e } = arena();
  assert(game.companionUseSecondSkill(u, e));
  game.zone().enemies = [];
  game.updateParty(0.65);
  assert.equal(u.skill2Cd, 0, 'a missing target fizzles without imaginary damage');
  assert(!game._companionCharges.has(u.id));
}
{
  const { game, u, e } = arena();
  assert(game.companionUseSecondSkill(u, e));
  const saved = game.snapshot();
  assert(!('charge' in saved.party[0]), 'pending casts do not enter historical save data');
  const restored = Campaign.restore(saved);
  assert(!restored._companionCharges, 'restored campaign has no phantom pending cast');
}
console.log('PASS independent actors, immunity, target loss, and save compatibility');
