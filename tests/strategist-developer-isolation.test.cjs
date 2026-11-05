'use strict';
// Stage 1A prereq: a future registered class must remain isolated to the
// existing Developer Mode. No fifth class is activated in production here.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const clone = (obj) => JSON.parse(JSON.stringify(obj));
assert.equal(Campaign.classes.strategist, undefined,
  'E0 remains dormant in the actual source registry');
const publicBefore = Object.keys(Campaign.classes);
assert.deepEqual(publicBefore, ['paladin', 'mage', 'ranger'],
  'Rogue remains separately admitted in its original initialization');
const original = new Campaign('normal', 'mage', () => 0.9);
assert.doesNotThrow(() => Campaign.validate(original.snapshot()));
// Diagnostic-only registration to exercise engine/save *boundaries* before
// genuine combat owners and all six starter skills authorize class admission.
Campaign.classes.strategist = { ...Campaign.classes.paladin };
Campaign.talentProfiles.strategist = { ...Campaign.talentProfiles.paladin };
try {
  for (const mode of ['normal', 'nightmare', 'arena']) {
    assert.throws(() => new Campaign(mode, 'strategist', () => 0.9),
      /Unknown mode or class/, 'forbid public or Arena new campaign: ' + mode);
  }
  assert.throws(
    () => new Campaign('developer', 'strategist', () => 0.9, { succession: true }),
    /Unknown mode or class/, 'even a forged Developer Succession may not admit Ogre');
  const dev = new Campaign('developer', 'strategist', () => 0.9);
  assert.deepEqual(dev.s.party.map((u) => u.type), ['soldier', 'archer']);
  assert.equal(dev.s.strategistAcidBottles, 0);
  const valid = clone(dev.snapshot());
  assert.equal(valid.mode, 'developer');
  assert.equal(valid.hero.class, 'strategist');
  assert.doesNotThrow(() => Campaign.validate(valid),
    'native Developer-only v4 save remains admissible once class is registered');
  const restored = Campaign.restore(valid, () => 0.9);
  assert.equal(restored.hero.class, 'strategist');
  assert.equal(restored.s.mode, 'developer');
  for (const mode of ['normal', 'nightmare', 'arena']) {
    const forged = clone(valid);
    forged.mode = mode;
    assert.throws(() => Campaign.validate(forged), /Invalid save/,
      'forbid forged nondeveloper Strategist v4 import: ' + mode);
  }
  const succession = clone(valid);
  succession.challenge.succession = true;
  assert.throws(() => Campaign.validate(succession), /Invalid save/,
    'Developer Succession save must not retain preview class');
  const publicRun = new Campaign('normal', 'paladin', () => 0.9);
  publicRun.s.challenge.pending = true;
  publicRun.s.challenge.succession = true;
  assert.equal(publicRun.successor('strategist'), false,
    'the public succession method must not bypass UI filtering');
  assert.equal(publicRun.hero.class, 'paladin');
  const publicSave = clone(original.snapshot());
  assert.doesNotThrow(() => Campaign.validate(publicSave),
    'existing public v4 campaign unaffected by diagnostic registry');
  assert.equal(Campaign.classes.rogue, undefined,
    'never change Rogue playtest setup from this Stage 1A prerequisite');
} finally {
  delete Campaign.classes.strategist;
  delete Campaign.talentProfiles.strategist;
}
assert.deepEqual(Object.keys(Campaign.classes), publicBefore);
const app = fs.readFileSync(path.join(__dirname, '../src/prototype/app.js'), 'utf8');
assert(app.includes("id !== 'strategist' || (mode === 'developer' && developerEnabled)"),
  'the class chooser must filter by exact Developer Mode entry');
assert(app.includes("id !== 'strategist' && !game.s.challenge.fallen.includes(id)"),
  'succession menu excludes Strategist');
assert(app.includes("Object.keys(Campaign.classes).filter((id) => id !== 'strategist')"),
  'public Succession class count must remain four');
console.log('PASS dormant Ogre Developer-only admission, public refusal, v4 save/restore, succession and class-select guards');
