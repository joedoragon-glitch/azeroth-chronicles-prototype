'use strict';
// Phase 6 native critical receipts for both forms of Rogue Skills 2-8.
// Rogue admission stays test-only. No new RNG stream, delayed reroll, or Charm.
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
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.hero.skills = Array(8).fill(1);
  g.zone().props = [];
  g.zone().buildings = [];
  const foe = g.makeEnemy(
    { species: 'goblin', name: 'Practice foe', level: 1,
      hp: 1000000, damage: 0, gold: 0, xp: 0 },
    { x: 590, y: 500 },
  );
  foe.aggro = true;
  foe.cd = 2;
  foe.specialCd = 2;
  g.zone().enemies = [foe];
  return { g, foe };
}

const expectedField = {
  2: ['slow', 'seconds'],
  3: ['debt', 'silence'],
  4: ['healFraction', 'healFraction'],
  5: ['slow', 'ward'],
  6: ['debt', 'seconds'],
  7: ['push', 'weaken'],
  8: ['damage', 'silence'],
};
try {
  for (const level of [1, 2, 3]) {
    for (let slot = 2; slot <= 8; slot++) {
      for (const charged of [false, true]) {
        const { g, foe } = arena();
        let rolls = 0;
        const native = Native.createSession(Critical, Levels, {
          enabled: true, stream: { next() { rolls++; return 0; } },
        });
        native.setCriticalLevel('rogue', level);
        const keys = [], enhancements = [];
        g._criticalPartyNative = {
          enabled: true,
          release(game, key, source) {
            keys.push(key);
            return native.release(game, key, source);
          },
          enhance(receipt, original, lever, bounds) {
            enhancements.push({ receipt, original, lever, bounds });
            return native.enhance(receipt, original, lever, bounds);
          },
        };
        const form = charged ? 'charged' : 'tap';
        const key = 'hero/rogue/' + slot + '-' + form;
        const authored = Levels.ACTIONS[key];
        assert.equal(authored.group, 'rogue');
        const expectedLever = authored.lever;
        const baseline = R.roguePerformances[slot][form];
        const property = expectedField[slot][charged ? 1 : 0];
        const originalCharm = g.s.rogueCharmRng;
        assert.equal(g.cast(slot, foe.id, charged), true, key + ' must be legal');
        assert.deepEqual(keys, [key], key + ' has one native release');
        assert.equal(rolls, 1, key + ' draws once from the Party stream');
        assert.equal(enhancements.length, 1, key + ' applies exactly one lever');
        const enhanced = enhancements[0];
        assert.equal(enhanced.receipt.intensity, level);
        assert.equal(enhanced.receipt.group, 'rogue');
        assert.equal(enhanced.lever, expectedLever);
        assert.equal(enhanced.original, baseline[property]);
        assert.equal(g.s.rogueCharmRng, originalCharm, 'song cannot roll Charm');
        assert.doesNotThrow(() => Campaign.validate(g.snapshot()),
          'critical transient changes must not invalidate save state');
        const saved = JSON.stringify(g.snapshot());
        assert(!saved.includes('criticalMending'), 'finite critical HoT config is ephemeral');
        const again = g.cast(slot, foe.id, charged);
        assert.equal(again, false, 'cooldown prevents immediate repeated release');
        assert.equal(rolls, 1, 'invalid second cast spends no Party critical RNG');
      }
    }
  }
  const isolated = Native.createSession(Critical, Levels, {
    enabled: true, stream: { next() { return 0.9; } },
  });
  assert.equal(isolated.criticalLevels().rogue, 2);
  assert.equal(isolated.criticalLevels().hero, 1);
  isolated.setCriticalLevel('rogue', 3, 'nightmare');
  isolated.setCriticalLevel('rogue', 1, 'developer');
  assert.equal(isolated.criticalLevels().modes.nightmare.rogue, 3);
  assert.equal(isolated.criticalLevels().modes.developer.rogue, 1);
  assert.equal(isolated.criticalLevels().hero, 1);
  console.log('PASS Rogue Skills 2-8 tap/charged x Levels 1/2/3: single critical receipt, one legal lever, no Charm coupling or save leakage');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
