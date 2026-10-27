'use strict';
// Rogue critical intensity is a profile-only preference, never a campaign
// migration or a new combat RNG stream. Bad/old values use Level 2.
const assert = require('node:assert/strict');
const Persistence = require('../src/prototype/persistence.js');
const Campaign = require('../src/prototype/engine.js');
const Levels = require('../src/prototype/critical-levels.js');
function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, value); },
  };
}
const defaults = {
  activeMode: 'normal', nightmareUnlocked: false,
  audio: { music: 0.5 },
  rogueCriticalLevels: { normal: 2, nightmare: 2, developer: 2 },
};
const old = Persistence.create({
  storage: storage({ 'azeroth-v4-profile': JSON.stringify({
    activeMode: 'nightmare', nightmareUnlocked: true, audio: defaults.audio,
  }) }),
  Campaign,
});
assert.deepEqual(old.loadProfile(defaults).rogueCriticalLevels,
  { normal: 2, nightmare: 2, developer: 2 });
const backing = storage();
const store = Persistence.create({ storage: backing, Campaign });
const selected = {
  ...defaults,
  rogueCriticalLevels: { normal: 3, nightmare: 1, developer: 2 },
};
assert.equal(store.saveProfile(selected), true);
assert.deepEqual(store.loadProfile(defaults).rogueCriticalLevels,
  selected.rogueCriticalLevels);
backing.setItem('azeroth-v4-profile', JSON.stringify({
  ...selected,
  rogueCriticalLevels: { normal: 0, nightmare: 4, developer: '3',
    hero: 3, world: 3, companion: 3 },
}));
assert.deepEqual(store.loadProfile(defaults).rogueCriticalLevels,
  { normal: 2, nightmare: 2, developer: 2 },
  'invalid levels and unrelated groups cannot escape profile validation');
const tuning = Levels.createTuning();
assert.equal(tuning.getLevel('rogue', 'normal'), 2);
for (const [mode, level] of Object.entries(selected.rogueCriticalLevels))
  tuning.setLevel('rogue', level, mode);
assert.equal(tuning.getLevel('rogue', 'normal'), 3);
assert.equal(tuning.getLevel('rogue', 'nightmare'), 1);
assert.equal(tuning.getLevel('rogue', 'developer'), 2);
for (const mode of Levels.MODES) {
  assert.equal(tuning.getLevel('hero', mode), 1);
  assert.equal(tuning.getLevel('companion', mode), 1);
  assert.equal(tuning.getLevel('world', mode), 1);
}
const plain = new Campaign('normal', 'paladin', () => 0.9);
const before = JSON.stringify(plain.snapshot());
tuning.setLevel('rogue', 1, 'normal');
assert.equal(JSON.stringify(plain.snapshot()), before,
  'profile-side slider cannot mutate an unrelated campaign');
assert.doesNotThrow(() => Campaign.validate(plain.snapshot()));
console.log('PASS Rogue critical Level-2 profile migration, per-mode persistence, invalid values, class independence and save isolation');
