'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const { shell } = require('./helpers/production-shell.cjs');
const originalOfficial = JSON.stringify(new Campaign().snapshot());
const storage = new Map([
  ['azeroth-v4-normal', originalOfficial],
  ['alternate-layout:azeroth-display-language-v1', 'en'],
]);
const browser = { location: { protocol: 'http:', hostname: 'localhost', href: 'http://localhost/index.html', search: '' }, URL: Object.assign(class TestURL extends URL {}, { createObjectURL: () => '', revokeObjectURL() {} }) };
(async () => {
const a = shell('en', 'paladin', { ...browser, storage, seedSave: false, stayOnTitle: true });
assert.equal(a.scope.Prototype.started, false);
a.elements.get('title-new').click();
const action = (name) => {
  const target = a.elements.get('modal-actions').children.find((x) => x.textContent.includes(name));
  assert(target, 'Missing menu action: ' + name);
  target.click();
};
action('Choose Hero');
action('Paladin');
const key = 'alternate-layout:azeroth-v4-normal';
assert(storage.has(key), 'New layout run must write its own v4 save');
assert.equal(storage.get('azeroth-v4-normal'), originalOfficial, 'Official save remains untouched');
assert.equal(Campaign.restore(JSON.parse(storage.get(key))).hero.class, 'paladin');
for (let attempt = 0; attempt < 70 && !a.scope.Prototype.started; attempt++) {
  await Promise.resolve();
  a.frame(attempt * 16);
}
assert.equal(a.scope.Prototype.started, true, 'A new layout game must reach actual play before its next save');
a.scope.Prototype.game.hero.gold = 432;
assert.equal(a.scope.Prototype.save(), true, 'New layout run must be able to save progress');
const saved = Campaign.restore(JSON.parse(storage.get(key)));
assert.equal(saved.hero.gold, 432);
const b = shell('en', 'paladin', { ...browser, storage, seedSave: false, stayOnTitle: true });
assert.equal(b.scope.Prototype.game.hero.gold, 432, 'Fresh launch must load the layout save');
assert.equal(b.elements.get('title-continue').disabled, false, 'Fresh layout save can be continued');
assert.equal(storage.get('azeroth-v4-normal'), originalOfficial);
console.log('PASS isolated alternate layout new run, save, restore, continue, and official save unchanged');
})().catch((error) => { console.error(error); process.exitCode = 1; });
