'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const P = require('../src/prototype/persistence');
const { shell } = require('./helpers/production-shell.cjs');
function memory() {
  const values = new Map();
  return {
    values,
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
  };
}
for (const original of ['{broken', JSON.stringify({ ...new C().snapshot(), version: 999 })]) {
  const storage = new Map([[P.saveKey('normal'), original]]);
  const app = shell('en', 'paladin', { storage });
  assert.equal(app.elements.get('modal-title').textContent, 'Saved run could not be opened');
  app.scope.Prototype.save();
  for (const fn of app.events.blur || []) fn();
  app.scope.document.hidden = true;
  for (const fn of app.documentEvents.visibilitychange || []) fn();
  for (const fn of app.events.pagehide || []) fn();
  assert.equal(
    storage.get(P.saveKey('normal')),
    original,
    'all startup lifecycle paths preserve original bytes',
  );
  const io = { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) };
  const adapter = P.create({ storage: io, Campaign: C });
  assert.equal(adapter.load('normal'), null);
  assert.equal(
    adapter.save(new C(), {}),
    false,
    'adapter refuses implicit failed-slot replacement',
  );
  assert(adapter.writeCandidate(new C()));
  assert.equal(storage.get(P.saveKey('normal') + '-unreadable-backup'), original);
  assert(C.restore(JSON.parse(storage.get(P.saveKey('normal')))));
}
// A missing selected mode must not overwrite a valid other-mode slot from title.
{
  const original = JSON.stringify(new C().snapshot());
  const storage = new Map([
    [P.saveKey('normal'), original],
    [P.profileKey, JSON.stringify({ activeMode: 'nightmare' })],
  ]);
  const app = shell('en', 'paladin', { storage });
  for (const fn of app.events.blur || []) fn();
  assert.equal(storage.get(P.saveKey('normal')), original);
}
// Failed validation and quota failures keep the last valid checkpoint.
{
  const storage = memory(),
    p = P.create({ storage, Campaign: C });
  const g = new C();
  assert(p.save(g, {}));
  const original = storage.getItem(P.saveKey('normal'));
  g.hero.cd[0] = Infinity;
  assert.equal(p.save(g, {}), false);
  assert.equal(storage.getItem(P.saveKey('normal')), original);
  const quota = P.create({
    storage: {
      getItem: storage.getItem,
      setItem() {
        throw Error('quota');
      },
    },
    Campaign: C,
  });
  assert.throws(() => quota.writeCandidate(new C()));
  assert.equal(storage.getItem(P.saveKey('normal')), original);
}
console.log(
  'PASS protected failed-load originals, startup lifecycle, explicit replacement backup and rejected writes',
);
