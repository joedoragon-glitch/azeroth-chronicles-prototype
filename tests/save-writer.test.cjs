'use strict';
const assert = require('node:assert/strict');
const P = require('../src/prototype/persistence');
const C = require('../src/prototype/engine');
const { shell } = require('./helpers/production-shell.cjs');
const settle = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
function lockManager() {
  let held = false;
  return {
    async request(name, options, callback) {
      assert.equal(name, 'azeroth-campaign-writer-v1');
      assert.equal(options.ifAvailable, true);
      await Promise.resolve();
      if (held) return callback(null);
      held = true;
      try {
        return await callback({ name });
      } finally {
        held = false;
      }
    },
  };
}
(async () => {
  // Same adapter API also fences an old non-locking client or stale raw bytes.
  const data = new Map(),
    io = { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v) };
  const a = P.create({ storage: io, Campaign: C }),
    b = P.create({ storage: io, Campaign: C });
  a.save(new C(), {});
  const current = a.load('normal'),
    stale = b.load('normal');
  current.hero.gold += 100;
  current.s.time += 5;
  assert(a.save(current, {}));
  const durable = data.get(P.saveKey('normal'));
  assert.equal(b.save(stale, {}), false);
  assert.equal(b.conflicted('normal'), true);
  assert.throws(() => b.writeCandidate(stale), /changed/);
  assert.equal(data.get(P.saveKey('normal')), durable);
  assert(b.save(b.load('normal'), {}), 'A deliberate fresh load clears the stale revision');

  const locks = lockManager(),
    first = P.createWriterGuard({ locks });
  assert.equal(first.canWrite(), false, 'Pending acquisition cannot write');
  assert.equal(await first.ready, 'owner');
  const other = P.createWriterGuard({ locks });
  assert.equal(await other.ready, 'blocked');
  other.release();
  assert(first.canWrite(), 'Closing the non-owner cannot release the owner');
  first.release();
  await settle();
  const successor = P.createWriterGuard({ locks });
  assert.equal(await successor.ready, 'owner');
  successor.release();
  assert.equal(
    P.createWriterGuard({ required: true }).canWrite(),
    false,
    'Unsupported live browsers fail closed',
  );

  const storage = new Map([[P.saveKey('normal'), JSON.stringify(new C().snapshot())]]);
  const liveLocks = lockManager();
  const app = shell('en', 'paladin', { storage, navigator: { locks: liveLocks } });
  await settle();
  app.scope.Prototype.game.hero.gold = 432;
  assert(app.scope.Prototype.save());
  const saved = storage.get(P.saveKey('normal'));
  const marker = storage.get(P.recoveryMarkerKey);
  const second = shell('en', 'paladin', { storage, navigator: { locks: liveLocks } });
  await settle();
  assert.equal(second.elements.get('modal-title').textContent, 'Saved game is protected');
  second.scope.Prototype.game.hero.gold = 1;
  assert.equal(second.scope.Prototype.save(), false);
  second.frame(5000);
  for (const listener of second.events.pagehide || []) listener();
  assert.equal(
    storage.get(P.saveKey('normal')),
    saved,
    'Second-window ticks and shutdown preserve newer progress',
  );
  assert.equal(
    storage.get(P.recoveryMarkerKey),
    marker,
    'Non-owner shutdown cannot clean the owner recovery marker',
  );
  for (const listener of app.events.pagehide || []) listener();
  await settle();
  const reopened = shell('en', 'paladin', { storage, navigator: { locks: liveLocks } });
  await settle();
  assert.equal(reopened.scope.Prototype.game.hero.gold, 432);
  assert(reopened.scope.Prototype.save(), 'After owner close, a fresh window can save');
  // A stale page restored from the back/forward cache reloads instead of writing.
  let reloads = 0;
  app.scope.location.reload = () => reloads++;
  for (const listener of app.events.pageshow || []) listener({ persisted: true });
  assert.equal(reloads, 1);
  assert.equal(app.scope.Prototype.save(), false);
  for (const listener of reopened.events.pagehide || []) listener();
  console.log(
    'PASS cross-window ownership, stale-revision rejection, protected startup/shutdown, fresh takeover and bfcache reload',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
