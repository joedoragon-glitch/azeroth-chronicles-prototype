'use strict';
const assert = require('node:assert/strict');
const { completeFieldOpening } = require('./helpers/field-opening.cjs');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;

// Standalone owner probes explicitly advance the shared charge clock and
// invoke the post-damage completion phase; updateParty alone never releases.
function advanceCast(game, dt) {
  game.advancePartyChargeClock(dt);
  game.updateParty(dt);
  game.resolveCompanionCharges();
}

function arena(type = 'soldier') {
  const game = new Campaign('normal', 'paladin', () => 0.9);
  completeFieldOpening(game);
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
  game.engage(e);
  return { game, u, e };
}

assert.equal(R.chargedSkills.holdSeconds, 0.65, 'the existing hold duration stays fixed');
assert.deepEqual(R.chargedSkills.interrupt, {
  hpFraction: 0.07,
  minimumHp: 6,
  recoverySeconds: 0.5,
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
  assert.equal(
    g.effects.filter((e) => e.type === 'chargeInterrupted').length,
    1,
    'no duplicate interruption',
  );
  g.clearPartyCharge(h);
  assert.equal(g.partyChargeState(h), null, 'hold state is transient and cleared');
}
console.log(
  'PASS all hero classes: zero loss, immunity, cumulative threshold, single cancellation',
);

for (const type of ['soldier', 'archer']) {
  const { game, u, e } = arena(type);
  const before = e.hp;
  assert(game.companionUseSecondSkill(u, e), type + ' begins the hold');
  assert.equal(e.hp, before, type + ' cannot deal early damage');
  assert.equal(u.skill2Cd, 0, 'cooldown is not paid before release');
  assert(game._companionCharges.has(u.id));
  advanceCast(game, 0.3);
  assert.equal(e.hp, before, type + ' is still charging before 0.65s');
  assert.equal(u.skill2Cd, 0);
  advanceCast(game, 0.35);
  if (type === 'archer') {
    assert.equal(e.hp, before, 'Archer finishes its 0.65s aim without phantom impact');
    const arrows = game.s.projectiles.filter(p => p.source === u.id);
    assert(arrows.length > 0, 'charged Archer releases actual arrows at 0.65s');
    for (let i = 0; i < 20 && arrows.some(p => game.s.projectiles.includes(p)); i++)
      game.updateProjectiles(0.05);
    assert(e.hp < before, 'Archer charged arrow damages only after physical arrival');
  } else assert(e.hp < before, 'Soldier sword cleave hits when the hold releases');
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
  advanceCast(game, 0.25);
  assert(game.hitParty(u, 4, 0, null, true));
  assert(!game.partyChargeState(u).interrupted, 'one weak hit does not stop charging');
  assert(game.hitParty(u, 5, 0, null, true));
  assert(game.partyChargeState(u).interrupted, 'two hits crossing 7% threshold break the cast');
  advanceCast(game, 0.4);
  assert.equal(e.hp, enemyHp, 'interrupted companion never releases its charged damage');
  assert.equal(u.skill2Cd, 0, 'interruption never spends full charged cooldown');
  assert(!game._companionCharges.has(u.id));
  assert(!game.partyChargeState(u));
  assert(u.skillGlobalCd > 0, 'brief recovery prevents immediate same-frame retries');
  assert(game.effects.some((event) => event.type === 'chargeInterrupted' && event.target === u.id));
}
console.log(
  'PASS both companions: cumulative damage interruption and recovery without skill cooldown',
);

{
  const { game, u, e } = arena();
  assert(game.companionUseSecondSkill(u, e));
  assert(game.beginPartyCharge(game.hero, 3));
  assert(game.hitParty(game.hero, 100, 0, null, true));
  assert(game.partyChargeState(game.hero).interrupted, 'hero hold can be broken');
  assert(!game.partyChargeState(u).interrupted, 'hero damage must not break companion hold');
  game.clearPartyCharge(game.hero);
  advanceCast(game, 0.65);
  assert(u.skill2Cd > 0, 'companion holds independently of the hero');
}
{
  const { game, u, e } = arena();
  u.hp = u.maxHp = 100;
  assert(game.companionUseSecondSkill(u, e));
  u.immune = 1;
  assert(!game.hitParty(u, 1000, 0, null, true), 'immune hits cannot interrupt');
  u.immune = 0;
  advanceCast(game, 0.65);
  assert(u.skill2Cd > 0, 'immune companion successfully completes its hold');
}
{
  const { game, u, e } = arena();
  assert(game.companionUseSecondSkill(u, e));
  game.zone().enemies = [];
  advanceCast(game, 0.65);
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
{
  const { game, u, e } = arena();
  assert(game.companionUseSecondSkill(u, e));
  u.hp = 1; // Preparation began while healthy; fatal contact still cancels it.
  assert(game.hitParty(u, 1, 0, null, true), 'lethal contact removes actual remaining HP');
  assert(game.partyChargeState(u).interrupted, 'lethal hit always cancels even below threshold');
  advanceCast(game, 0.65);
  assert.equal(e.hp, e.maxHp, 'defeated companion cannot release a charged attack');
}
{
  const { game } = arena();
  assert(game.beginPartyCharge(game.hero, 1));
  game.advancePartyChargeClock(0.65);
  game.hitParty(game.hero, game.hero.maxHp * 0.2, 0, null, true);
  assert.equal(
    game.partyChargeState(game.hero).interrupted,
    false,
    'completed 0.65s preparation cannot be canceled by subsequent damage',
  );
}
console.log('PASS independent actors, immunity, target loss, and save compatibility');

// One injected active clock keeps hero and companions identical at low FPS.
for (const type of ['soldier', 'archer']) {
  const { game, u, e } = arena(type);
  let now = 0;
  game.setPartyChargeClock(() => now);
  assert(game.beginPartyCharge(game.hero, 2));
  assert(game.companionUseSecondSkill(u, e));
  now = 0.649;
  game.resolveCompanionCharges();
  assert.equal(u.skill2Cd, 0);
  now = 0.65;
  game.hitParty(game.hero, 30, 0, null, true);
  game.hitParty(u, 20, 0, null, true);
  assert(
    !game.partyChargeState(game.hero).interrupted,
    'ready hero cannot be retroactively interrupted',
  );
  assert(!game.partyChargeState(u).interrupted, 'same exact completion rule for companions');
  game.resolveCompanionCharges();
  assert(
    u.skill2Cd > 0,
    'one coarse frame still needs the full fixed 0.65s, not capped dt accumulation',
  );
}
for (const phase of ['enemy', 'projectile', 'trap']) {
  const { game, u, e } = arena('archer');
  let now = 0;
  game.setPartyChargeClock(() => now);
  assert(game.companionUseSecondSkill(u, e));
  const before = e.hp;
  game.updateEnemies = () => {};
  game.updateProjectiles = () => {};
  game.updateTraps = () => {};
  const method = { enemy: 'updateEnemies', projectile: 'updateProjectiles', trap: 'updateTraps' }[
    phase
  ];
  game[method] = () => {
    now = 0.649;
    game.hitParty(u, u.maxHp * 0.08, 0, null, true);
    now = 0.65;
  };
  game.tick(0.1);
  assert.equal(e.hp, before, phase + ' before the deadline wins even on the completion tick');
  assert.equal(u.skill2Cd, 0);
}
{
  const { game, u, e } = arena();
  let now = 0;
  game.setPartyChargeClock(() => now);
  assert(game.beginPartyCharge(game.hero, 2));
  game.hitParty(game.hero, game.hero.maxHp * 0.08, 0, null, true);
  game.clearPartyCharge(game.hero);
  assert(!game.beginPartyCharge(game.hero, 2), 'hero has the same short charge recovery');
  now = 0.5;
  assert(game.beginPartyCharge(game.hero, 2));
  game.clearPartyCharge(game.hero);
  assert(game.companionUseSecondSkill(u, e));
  const saved = game.snapshot();
  assert(game._companionCharges.size, 'autosave does not cancel a live preparation');
  assert(!Campaign.restore(saved)._pendingPartyCharges);
  game.enter('march');
  assert(
    !game._companionCharges.size && !game._pendingPartyCharges.size,
    'travel cancels both maps',
  );
}
{
  const { game, u, e } = arena('archer');
  assert(game.companionUseSecondSkill(u, e));
  e.aggro = false;
  Object.assign(game.hero, { x: 300, y: 350 });
  assert(game.restCompanion(u.id));
  assert(!game.partyChargeState(u), 'benching cancels immediately before any reactivation');
}
{
  const { game, u, e } = arena('soldier');
  u.hp = u.maxHp * 0.4;
  game.s.squadEngagement = { zone: game.zoneId, target: e.id };
  e.aggro = true;
  assert(game.companionUseSecondSkill(u, e));
  game.updateParty(0.01);
  assert(u.immune > 0, 'Soldier retains its survival defense during preparation');
  assert(!game.hitParty(u, 9999, 0, null, true));
  assert(!game.partyChargeState(u).interrupted);
}
console.log(
  'PASS shared charge deadline, damage-phase ordering, short recovery and lifecycle regressions',
);

{
  const Audio = require('../src/prototype/audio');
  const FX = require('../src/prototype/combat-visuals');
  const { game } = arena();
  const event = {
    type: 'chargeInterrupted',
    actor: 'hero',
    target: 'hero',
    slot: 2,
    x: 500,
    y: 500,
  };
  const queued = FX.queue([event], game);
  assert(
    queued.some((f) => f.type === 'chargeInterrupted' && f.max === 0.45),
    'dedicated restrained interruption VFX',
  );
  const audio = new Audio(),
    calls = [];
  audio.ctx = { currentTime: 1, state: 'running' };
  audio.settings.muted = false;
  audio.paused = false;
  audio.sweep = (...args) => calls.push(['sweep', ...args]);
  audio.noiseBurst = (...args) => calls.push(['noise', ...args]);
  audio.effect(event);
  assert.equal(calls.length, 2, 'dedicated short interruption sound');
  audio.effect(event);
  assert.equal(calls.length, 2, 'same-frame crowds cannot stack the interruption sound');
}

for (const succession of [false, true]) {
  const g = new Campaign('normal', 'paladin', () => 0.9, { succession });
  const h = g.hero;
  h.hp = 1;
  h.immune = 0;
  assert(g.beginPartyCharge(h, 2));
  g.hitParty(h, 1, 0, null, true);
  assert(!g._pendingPartyCharges.size, 'death/respawn/Succession clears preparation');
  assert(!g._companionCharges?.size);
}
{
  const { game, u, e } = arena('archer');
  let now = 0;
  game.setPartyChargeClock(() => now);
  assert(game.companionUseSecondSkill(u, e));
  now = 0.65;
  game.hitParty(u, u.hp, 0, null, true);
  game.resolveCompanionCharges();
  assert.equal(u.skill2Cd, 0, 'dead ready actor cannot fire before respawn');
  assert(
    !game.effects.some((e) => e.type === 'chargeInterrupted'),
    'death after readiness is not a retroactive interruption',
  );
}
