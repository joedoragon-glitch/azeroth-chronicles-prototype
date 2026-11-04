'use strict';
// Stage 1A Developer-only admission boundary. Never modify the public roster
// during engine module initialization; register preview only by explicit call.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const deepCopy = value => JSON.parse(JSON.stringify(value));

assert.equal(Campaign.classes.strategist, undefined,
  'normal Node/app source must not auto-register the Ogre');
assert.equal(Campaign.heroCombatSupports('strategist'), true,
  'six native starters must exist before legal admission');
assert.equal(Campaign.enableStrategistDeveloperTest(), true);
assert.equal(Campaign.enableStrategistDeveloperTest(), false,
  'repeated preview opt-in does not overwrite the existing registry');
try {
  const all = Object.keys(Campaign.classes);
  assert.deepEqual(all.filter(id => id !== 'strategist'), ['paladin', 'mage', 'ranger'],
    'existing three built-in classes are unchanged; Rogue admits separately in app');
  const d = new Campaign('developer', 'strategist', () => 0.91);
  assert.deepEqual(d.s.party.map(u => u.type), ['soldier', 'archer']);
  assert.equal(d.s.strategistAcidBottles, 0);
  assert.equal(d.hero.skills[0] > 0 && d.hero.skills[1] > 0 && d.hero.skills[2] > 0, true);
  assert.equal(d.skillCooldown(1, false), 6);
  assert.equal(d.skillCooldown(2, false), 8);
  assert.equal(d.skillCooldown(3, false), 7);
  assert(d.skillCooldown(2, true) > d.skillCooldown(2, false));
  assert.equal(d.attemptStrategistReversalCommand(), false,
    'no invented warning qualifies without an actual live telegraph');
  const snapshot = deepCopy(d.snapshot());
  assert.equal(snapshot.version, 4);
  assert.doesNotThrow(() => Campaign.validate(snapshot));
  const restored = Campaign.restore(snapshot, () => 0.91);
  assert.equal(restored.hero.class, 'strategist');
  assert.equal(restored.s.mode, 'developer');
  for (const mode of ['normal', 'nightmare', 'arena']) {
    assert.throws(() => new Campaign(mode, 'strategist', () => 0.91),
      /Unknown mode or class/, 'public constructor denies Ogre ' + mode);
    const forged = deepCopy(snapshot);
    forged.mode = mode;
    assert.throws(() => Campaign.validate(forged),
      /Invalid save/, 'public imported Ogre save denied ' + mode);
  }
  const normal = new Campaign('normal', 'paladin', () => 0.91);
  assert.doesNotThrow(() => Campaign.validate(normal.snapshot()),
    'ordinary historical v4 validation is not collateral damage');
  normal.s.challenge.succession = true;
  normal.s.challenge.pending = true;
  normal.s.challenge.fallen = ['paladin'];
  assert.equal(normal.successor('strategist'), false);
  assert.equal(normal.hero.class, 'paladin');
  // The preview must not be counted when checking public succession saves.
  normal.hero.hp = 0; // Native pending Succession requires the fallen hero dead.
  const normalSave = deepCopy(normal.snapshot());
  assert.doesNotThrow(() => Campaign.validate(normalSave));
} finally {
  delete Campaign.classes.strategist;
  delete Campaign.talentProfiles.strategist;
}
console.log('Strategist: guarded Developer admission and v4/public boundaries passed');
