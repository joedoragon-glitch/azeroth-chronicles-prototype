'use strict';
// Temporal ownership: stationary pulses and Mending ticks inherit one frozen
// manual release. Rogue remains explicitly unregistered outside this fixture.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: 'bell' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
function arena() {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.hero.skills = Array(8).fill(1);
  g.zone().props = [];
  g.zone().buildings = [];
  const ally = g.unit('soldier', 590, 500);
  ally.hp = Math.max(1, ally.maxHp * 0.4);
  g.s.party = [ally];
  const foe = g.makeEnemy(
    { species: 'goblin', name: 'Practice target', level: 1,
      hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 590, y: 500 });
  foe.aggro = true;
  g.zone().enemies = [foe];
  let rolls = 0;
  const native = Native.createSession(Critical, Levels, {
    enabled: true, stream: { next() { rolls++; return 0; } },
  });
  native.setCriticalLevel('rogue', 3);
  g._criticalPartyNative = native;
  return { g, ally, foe, native, rolls: () => rolls };
}
try {
  {
    const { g, foe, native, rolls } = arena();
    const observed = [], original = g.applySlow;
    g.applySlow = function(target, seconds, ...rest) {
      observed.push({ target, seconds });
      return original.call(this, target, seconds, ...rest);
    };
    assert.equal(g.cast(5, foe.id, false), true);
    assert.equal(rolls(), 1, 'one critical receipt for placed station');
    native.setCriticalLevel('rogue', 1);
    g.tickRogueStations();
    assert(observed.some(({ target, seconds }) =>
      target === foe && Math.abs(seconds - (R.roguePerformances[5].tap.slow + 1)) < 1e-9),
      'station pulse inherits original Level-3 Slow, not the new slider value');
    g.s.time += 0.7;
    g.tickRogueStations();
    assert.equal(rolls(), 1, 'repeated pulses never roll critical again');
    assert.doesNotThrow(() => Campaign.validate(g.snapshot()));
  }
  {
    const { g, ally, foe, rolls } = arena();
    assert.equal(g.cast(5, foe.id, true), true);
    const ward = g.rogueStationProtection(ally)?.ward;
    assert(Math.abs(ward - 0.12) < 1e-9,
      'charged Level-3 station ward capped at 12% while ally is inside');
    assert.equal(rolls(), 1);
    g.s.time += 0.7;
    g.tickRogueStations();
    assert.equal(rolls(), 1, 'station aura and damage pulse are not new casts');
  }
  {
    const { g, ally, foe, native, rolls } = arena();
    assert.equal(g.cast(4, foe.id, true), true);
    const boon = g.rogueSongBoon(ally, 'mending');
    const self = g.rogueSongBoon(g.hero, 'mending');
    assert(self, 'critical Mending keeps the heroine in the same eligible set');
    assert(boon, 'lawful ally receives Mending');
    const expected = ally.maxHp * R.roguePerformances[4].charged.healFraction * 1.45;
    assert(Math.abs(self.remainingHeal -
      g.hero.maxHp * R.roguePerformances[4].charged.healFraction * 1.45) < 1e-7);
    assert(Math.abs(boon.remainingHeal - expected) < 1e-7,
      'Level-3 critical Mending increases total HoT budget once');
    native.setCriticalLevel('rogue', 1);
    g.s.time += 0.5;
    g.advanceRogueMending(0.5);
    g.tickRogueEnemyDot(foe, 0.5);
    assert.equal(rolls(), 1, 'HoT/DoT ticks spend budgets, never reroll');
    assert(!JSON.stringify(g.snapshot()).includes('criticalMending'));
  }
  {
    const { g, foe, rolls } = arena();
    foe.type = 'boss';
    assert.equal(g.cast(8, foe.id, true), true,
      'lawfully targetable boss still takes baseline legal blast');
    assert.equal(g.rogueEnemySilenced(foe), false,
      'critical receipt must not override scripted boss hush exclusion');
    assert.equal(rolls(), 1, 'protected boss still consumes one legal cast receipt');
  }
  console.log('PASS Rogue station/mending temporal critical ownership, frozen levels, capped ward and boss hush gate');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
