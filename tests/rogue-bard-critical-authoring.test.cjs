'use strict';
// Rogue critical intensity is authored and tuned by developers only.
// It must not appear as a player-facing setting or migrate into save profiles.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const Persistence = require('../src/prototype/persistence.js');
const Levels = require('../src/prototype/critical-levels.js');
const Critical = require('../src/prototype/critical-executions.js');
const Native = require('../src/prototype/critical-party-native.js');
const World = require('../src/prototype/critical-world-native.js');

assert.deepEqual(Levels.DEFAULT_LEVELS,
  { hero: 1, rogue: 2, companion: 1, world: 1 });
const tuning = Levels.createTuning();
for (const mode of Levels.MODES) {
  assert.equal(tuning.getLevel('rogue', mode), 2,
    'default Level 2 is developer-authored, independent of game mode');
  for (const group of ['hero', 'companion', 'world'])
    assert.equal(tuning.getLevel(group, mode), 1);
}
const admin = Levels.createTuning({
  rogue: 3, modes: { nightmare: { rogue: 1 }, developer: { rogue: 2 } },
});
assert.equal(admin.getLevel('rogue', 'normal'), 3);
assert.equal(admin.getLevel('rogue', 'nightmare'), 1);
assert.equal(admin.getLevel('rogue', 'developer'), 2);
for (const mode of Levels.MODES)
  assert.equal(admin.getLevel('hero', mode), 1);
admin.setLevel('rogue', 1, 'normal');
assert.equal(admin.getLevel('rogue', 'normal'), 1);
assert.equal(admin.getLevel('rogue', 'nightmare'), 1);
assert.equal(admin.getLevel('rogue', 'developer'), 2);
assert.throws(() => admin.setLevel('rogue', 0), /Level 1/);
assert.throws(() => admin.setLevel('rogue', 4), /Level 1/);
assert.throws(() => admin.setLevel('rogue', 2.5), /Level 1/);

// No player control, user preference or automatic profile override.
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/prototype/app.js'), 'utf8');
const persistenceSource = fs.readFileSync(path.join(root, 'src/prototype/persistence.js'), 'utf8');
assert(!/rogueCriticalMenu|rogueCriticalLevels|Critical intensity · Rogue Bard/.test(app),
  'the main game shell must not contain the mistakenly added player controls');
assert(!/rogueCriticalLevels/.test(persistenceSource),
  'critical tuning must not become a stored game profile field');

const values = new Map();
const storage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
};
const profile = Persistence.create({ storage, Campaign });
const defaults = { activeMode: 'normal', nightmareUnlocked: false, audio: {} };
values.set('azeroth-v4-profile', JSON.stringify({
  ...defaults, rogueCriticalLevels: { normal: 3, nightmare: 1, developer: 3 },
}));
const loaded = profile.loadProfile(defaults);
assert.equal(Object.hasOwn(loaded, 'rogueCriticalLevels'), false,
  'a brief mistaken internal profile field must be ignored');
const game = new Campaign('normal', 'paladin', () => 0.9);
Native.attachCampaign(game, Critical, Levels, World, { enabled: true });
const baseline = JSON.stringify(game.snapshot());
assert.equal(game._criticalPartyNative.criticalLevels().rogue, 2,
  'live session defaults to authored Level 2 rather than profile storage');
assert.equal(JSON.stringify(game.snapshot()).includes('rogueCriticalLevels'), false);
assert.equal(game._criticalPartyNative.setCriticalLevel('rogue', 3), 3,
  'developers can still tune via explicit native API');
for (const group of ['hero', 'companion', 'world'])
  assert.equal(game._criticalPartyNative.criticalLevels()[group], 1);
assert.equal(JSON.stringify(game.snapshot()), baseline,
  'intensity authoring must not modify a campaign snapshot');
assert.doesNotThrow(() => Campaign.validate(game.snapshot()));
console.log('PASS developer-only Rogue critical levels, independent mode tuning, no player sliders or saved profile');
