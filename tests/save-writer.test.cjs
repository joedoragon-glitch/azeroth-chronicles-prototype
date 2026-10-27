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

  const enterFromTitle = (shellInstance) => {
    assert(!shellInstance.elements.get('title-continue').disabled, 'writer owns the selected run');
    shellInstance.elements.get('title-continue').click();
    shellInstance.frame(0);
    assert.equal(shellInstance.scope.Prototype.started, true);
  };
  const storage = new Map([[P.saveKey('normal'), JSON.stringify(new C().snapshot())]]);
  const liveLocks = lockManager();
  const app = shell('en', 'paladin', { storage, navigator: { locks: liveLocks } });
  await settle();
  enterFromTitle(app);
  app.scope.Prototype.game.hero.gold = 432;
  assert(app.scope.Prototype.save());
  const saved = storage.get(P.saveKey('normal'));
  const checkpoint = storage.get(P.checkpointKey('normal'));
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
  assert.equal(
    storage.get(P.checkpointKey('normal')),
    checkpoint,
    'A non-owner cannot rotate the owner recovery checkpoints',
  );
  for (const listener of app.events.pagehide || []) listener();
  await settle();
  const reopened = shell('en', 'paladin', { storage, navigator: { locks: liveLocks } });
  await settle();
  assert.equal(reopened.scope.Prototype.game.hero.gold, 432);
  enterFromTitle(reopened);
  assert(reopened.scope.Prototype.save(), 'After owner close, a fresh window can save');
  // A stale page restored from the back/forward cache reloads instead of writing.
  let reloads = 0;
  app.scope.location.reload = () => reloads++;
  for (const listener of app.events.pageshow || []) listener({ persisted: true });
  assert.equal(reloads, 1);
  assert.equal(app.scope.Prototype.save(), false);
  for (const listener of reopened.events.pagehide || []) listener();

  // The prior owner can save a different active mode while acquisition waits.
  const refreshedStorage = new Map([[P.saveKey('normal'), JSON.stringify(new C().snapshot())]]);
  const pending = shell('en', 'paladin', {
    storage: refreshedStorage,
    navigator: { locks: lockManager() },
  });
  const nightmare = new C('nightmare');
  nightmare.hero.gold = 789;
  refreshedStorage.set(P.saveKey('nightmare'), JSON.stringify(nightmare.snapshot()));
  refreshedStorage.set(
    P.profileKey,
    JSON.stringify({ activeMode: 'nightmare', nightmareUnlocked: true }),
  );
  await settle();
  assert.equal(pending.scope.Prototype.game.s.mode, 'nightmare');
  assert.equal(pending.scope.Prototype.game.hero.gold, 789);
  for (const listener of pending.events.pagehide || []) listener();

  const developer = new C('developer');
  developer.hero.gold = 888;
  const devApp = shell('en', 'paladin', {
    storage: new Map([[P.saveKey('developer'), JSON.stringify(developer.snapshot())]]),
    location: { protocol: 'https:', search: '?developer=1' },
    navigator: { locks: lockManager() },
  });
  await settle();
  assert.equal(devApp.scope.Prototype.game.s.mode, 'developer');
  assert.equal(devApp.scope.Prototype.game.hero.gold, 888);
  for (const listener of devApp.events.pagehide || []) listener();

  const completed = new C();
  // A completed run has passed the deferred level-2 field arrival. Use the
  // native XP/admission owner before crediting the isolated ending fixture.
  completed.grant(0, completed.xpRequired(1));
  completed.syncThornArrival(completed.zone());
  assert(!completed.zone().thornArrival);
  for (const boss of C.data.bosses) completed.victory(boss.id, 'normal');
  for (const id of ['darklord', ...C.dungeonIds]) completed.victory(id, 'true');
  completed.checkEnding();
  completed.enter('crown');
  const throne = completed.zone().npcs.find((npc) => npc.kind === 'throne');
  Object.assign(completed.hero, { x: throne.x, y: throne.y });
  assert(completed.interact(throne));
  const refuge = completed.zone().npcs.find((npc) => npc.kind === 'rest');
  Object.assign(completed.hero, { x: refuge.x, y: refuge.y });
  assert(completed.rest());
  assert(completed.peace && completed.s.finalRestCompleted);
  assert(C.restore(completed.snapshot()), 'The completion fixture is a valid real save');
  const completedApp = shell('en', 'paladin', {
    storage: new Map([
      [P.saveKey('normal'), JSON.stringify(completed.snapshot())],
      [P.profileKey, JSON.stringify({ activeMode: 'normal', nightmareUnlocked: false })],
    ]),
    navigator: { locks: lockManager() },
  });
  await settle();
  assert.equal(
    JSON.parse(completedApp.storage.get(P.profileKey)).nightmareUnlocked,
    true,
    'Earned Nightmare access is reconciled after the owning fresh load',
  );
  for (const listener of completedApp.events.pagehide || []) listener();

  const repairedStorage = new Map([[P.saveKey('normal'), '{broken']]);
  const repaired = shell('en', 'paladin', {
    storage: repairedStorage,
    navigator: { locks: lockManager() },
  });
  repairedStorage.set(P.saveKey('normal'), JSON.stringify(new C().snapshot()));
  await settle();
  assert.equal(
    repaired.elements.get('modal').hidden,
    true,
    'A fresh successful load dismisses the obsolete unreadable-save prompt',
  );
  enterFromTitle(repaired);
  assert(repaired.scope.Prototype.save());
  for (const listener of repaired.events.pagehide || []) listener();

  const workerEvents = {};
  let workerReloads = 0;
  const workerApp = shell('en', 'paladin', {
    location: { protocol: 'https:', reload: () => workerReloads++ },
    navigator: {
      locks: lockManager(),
      serviceWorker: {
        controller: {},
        addEventListener: (name, listener) => {
          workerEvents[name] = listener;
        },
        getRegistration: async () => ({ addEventListener() {}, update: async () => {} }),
      },
    },
  });
  await settle();
  enterFromTitle(workerApp);
  const workerSaved = workerApp.storage.get(P.saveKey('normal'));
  workerApp.scope.Prototype.game.hero.cd[0] = Infinity;
  workerEvents.controllerchange();
  assert.equal(workerReloads, 0, 'Failed save prevents an update from discarding the live run');
  assert.equal(workerApp.storage.get(P.saveKey('normal')), workerSaved);
  workerApp.scope.Prototype.game.hero.cd[0] = 0;
  workerApp.scope.Prototype.game.hero.gold = 567;
  workerEvents.controllerchange();
  assert.equal(workerReloads, 1);
  assert.equal(JSON.parse(workerApp.storage.get(P.saveKey('normal'))).hero.gold, 567);
  for (const listener of workerApp.events.pagehide || []) listener();
  console.log(
    'PASS cross-window ownership, stale-revision rejection, protected startup/shutdown, fresh takeover and bfcache reload',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
