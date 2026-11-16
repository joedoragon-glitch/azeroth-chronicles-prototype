'use strict';
const assert = require('node:assert/strict');
const { shell } = require('./helpers/production-shell.cjs');
const Campaign = require('../src/prototype/engine');
const Persistence = require('../src/prototype/persistence');

const namespace = 'developer-alternate-layout:';
const standardBytes = JSON.stringify(new Campaign('normal', 'mage').snapshot());
const storage = new Map([
  [Persistence.saveKey('normal'), standardBytes],
  ['azeroth-display-language-v1', 'es'],
  [namespace + 'azeroth-display-language-v1', 'en'],
]);
const pick = (app, prefix) => {
  const control = app.elements.get('modal-actions').children.find((entry) =>
    entry.textContent.startsWith(prefix));
  assert(control, 'Missing expected menu choice: ' + prefix);
  control.click();
};

// A genuinely fresh layout session starts independently of public-game data.
const fresh = shell('en', 'paladin', { storage, seedSave: false, stayOnTitle: true });
assert.equal(fresh.elements.get('title-continue').disabled, true);
fresh.elements.get('title-new').click();
pick(fresh, 'Choose Hero');
pick(fresh, '🛡');
const slot = namespace + Persistence.saveKey('normal');
assert(storage.has(slot), 'new layout adventure must write its own v4 save');
const first = Campaign.restore(JSON.parse(storage.get(slot)));
assert.equal(first.hero.class, 'paladin');
assert.equal(fresh.scope.Prototype.game.s.mode, 'normal');
assert.equal(fresh.scope.Prototype.started, true);
fresh.scope.Prototype.game.hero.gold += 73;
assert.equal(fresh.scope.Prototype.save(), true);
const expectedGold = fresh.scope.Prototype.game.hero.gold;

// A separate launch resumes the saved layout adventure.
const resumed = shell('en', 'paladin', { storage, seedSave: false, stayOnTitle: true });
assert.equal(resumed.elements.get('title-continue').disabled, false);
assert.equal(resumed.scope.Prototype.game.hero.gold, expectedGold);
resumed.elements.get('title-continue').click();
resumed.frame(0);
assert.equal(resumed.scope.Prototype.started, true);
assert.equal(resumed.scope.Prototype.save(), true);

assert.equal(storage.get(Persistence.saveKey('normal')), standardBytes,
  'normal public-game save must not be modified');
assert.equal(storage.get('azeroth-display-language-v1'), 'en',
  'the test harness owns the unprefixed language fixture; the app must not alter it');
assert.equal(Campaign.restore(JSON.parse(storage.get(slot))).hero.gold, expectedGold);
console.log('PASS alternate layout new run/save/relaunch/continue, independent v4 storage');
