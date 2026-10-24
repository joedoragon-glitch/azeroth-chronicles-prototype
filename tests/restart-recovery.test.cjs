'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Persistence = require('../src/prototype/persistence');
const { shell } = require('./helpers/production-shell.cjs');

function storage() {
  const items = new Map();
  return {
    items,
    getItem: k => items.get(k) ?? null,
    setItem: (k, v) => items.set(k, String(v)),
    removeItem: k => items.delete(k),
  };
}
function savedCampaign(store, opts = {}) {
  const g = new Campaign('normal', 'paladin', () => 0.73);
  const companion = g.unit('soldier', 1040, 1310, 'vale');
  companion.active = true;
  g.s.party = [companion];
  Object.assign(g.hero, { x: 1000, y: 1300 });
  g.s.statistics.kills = 13;
  g.hero.gold = 987;
  g.hero.hp = Math.max(1, g.hero.hp - 7);
  companion.hp = Math.max(1, companion.hp - 3);
  if (opts.barracks) {
    g.zone().buildings.push({
      id: 'recovery-camp-test', name: 'Test Barracks', kind: 'barracks',
      theme: 'vale', x: 730, y: 700, progress: 4,
      queue: 0, queueType: null, full: false,
      upgradeProgress: 0, upgradePaid: false,
    });
    assert.equal(g.setBarracksRespawn('recovery-camp-test'), true,
      'Fixture must select a valid completed local barracks');
  }
  const p = Persistence.create({ storage: store, Campaign });
  assert.equal(p.save(g, { activeMode: 'normal', audio: {} }), true);
  return g;
}
function position(g) { return [g.hero.x, g.hero.y]; }
function bootstrap(store) {
  // Shared save state is deliberately passed into a fresh production app.
  const shared = {
    get: k => store.getItem(k), set: (k, v) => store.setItem(k, v),
    has: k => store.getItem(k) != null,
  };
  const app = shell('en', 'paladin', { storage: shared });
  return app;
}
{
  const store = storage(), original = savedCampaign(store);
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  assert(guard.arm(original));
  assert.equal(guard.read().active, true);
  const app = bootstrap(store);
  const restored = app.scope.Prototype.game;
  assert.notDeepEqual(position(restored), position(original),
    'Unclean shutdown must not restart inside crowded combat coordinates');
  assert.equal(restored.zoneId, 'vale', 'Restart arrives in the saved campaign region');
  assert(restored.zone().npcs.some(n => n.kind === 'rest'),
    'A regional refuge exists even when a fresh run has not selected one');
  assert.equal(restored.hero.hp, original.hero.hp,
    'Rescue must not grant health or apply damage');
  assert.equal(restored.s.party[0].hp, original.s.party[0].hp,
    'Companion keeps exact saved HP');
  assert.equal(restored.hero.gold, 987);
  assert.equal(restored.s.statistics.kills, 13);
  assert.equal(restored.s.statistics.deaths, 0, 'No death or penalty is applied');
  assert.equal(restored.s.challenge.pending, false);
  assert.equal(restored.s.challenge.gameOver, false);
  assert(!restored.s.projectiles.length && !restored.s.hazards.length,
    'Encounter projectile/hazard state cleared via existing zone-arrival reset');
  assert.deepEqual(position(Campaign.restore(JSON.parse(store.getItem('azeroth-v4-normal')))),
    position(restored), 'Safe landing is persisted for the next restart');
  assert.equal(guard.read().active, true,
    'After recovery the current active session is armed again');
}
{
  const store = storage(), live = savedCampaign(store);
  const checkpoint = Campaign.restore(JSON.parse(store.getItem(Persistence.saveKey('normal'))));
  // A real crash can happen between autosaves. The marker must refer to
  // this saved state, never to a future unsaved frame or new actor ID.
  live.s.time = checkpoint.s.time + 0.4;
  live.s.nextId = checkpoint.s.nextId + 1;
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  assert.equal(guard.arm(live), true);
  assert.equal(guard.read().gameTime, checkpoint.s.time,
    'Marker clock must be anchored to the last durable save');
  assert.equal(guard.read().nextId, checkpoint.s.nextId,
    'Marker ID must be anchored to the last durable save');
  const restored = bootstrap(store).scope.Prototype.game;
  assert.notDeepEqual(position(restored), position(checkpoint),
    'Crash after unsaved play still recovers to refuge');
  assert.equal(restored.s.time, checkpoint.s.time,
    'Crash recovery resumes saved progress, not unsaved frames');
  assert.equal(restored.s.nextId, checkpoint.s.nextId,
    'Crash recovery does not fabricate lost actor IDs');
  assert.equal(restored.hero.hp, checkpoint.hero.hp);
  assert.equal(restored.hero.gold, checkpoint.hero.gold);
  assert.equal(restored.s.statistics.deaths, checkpoint.s.statistics.deaths);
}
{
  const store = storage(), game = savedCampaign(store);
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  assert.equal(guard.arm(game), true);
  const marker = guard.read();
  game.s.time += 6.25;
  game.s.nextId += 3;
  const persistence = Persistence.create({ storage: store, Campaign });
  assert.equal(persistence.save(game, { activeMode: 'normal', audio: {} }), true);
  assert.deepEqual([guard.read().gameTime, guard.read().nextId],
    [marker.gameTime, marker.nextId],
    'Autosave can advance ahead of a previously armed marker');
  const restored = bootstrap(store).scope.Prototype.game;
  assert.notDeepEqual(position(restored), position(game),
    'Newer valid autosave remains eligible for refuge recovery');
  assert.equal(restored.s.time, game.s.time);
  assert.equal(restored.s.nextId, game.s.nextId);
}
{
  const store = storage();
  const saved = savedCampaign(store);
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  assert.equal(guard.arm(new Campaign('normal', 'mage', () => 0.73)), false,
    'Wrong-class live campaign must never claim another saved checkpoint');
  assert.equal(guard.arm(new Campaign('normal', 'paladin', () => 0.73)), false,
    'A newly started lower-ID run cannot claim the preceding run\'s save');
  assert.equal(guard.read(), null);
  const noSave = storage();
  assert.equal(Persistence.createRestartGuard({ storage: noSave, Campaign }).arm(saved), false,
    'Unsaved games must not arm false crash-recovery markers');
}
{
  const store = storage(), original = savedCampaign(store, { barracks: true });
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  guard.arm(original);
  const persisted = Campaign.restore(JSON.parse(store.getItem('azeroth-v4-normal')));
  assert.equal(persisted.selectedBarracksRespawn()?.barracks.id, 'recovery-camp-test',
    'Barracks selection must survive save and validation');
  const app = bootstrap(store), g = app.scope.Prototype.game;
  const expectedBarracksLanding = original.safe(815, 750);
  assert.deepEqual(position(g), [expectedBarracksLanding.x, expectedBarracksLanding.y],
    'Selected completed barracks takes priority, using real terrain-safe arrival');
  assert.equal(g.s.barracksRespawn.id, 'recovery-camp-test');
  assert.equal(g.hero.gold, original.hero.gold);
  assert.equal(g.s.statistics.deaths, 0);
}
{
  const store = storage(), original = savedCampaign(store);
  const app1 = bootstrap(store);
  // Reposition and save through an ordinary pagehide; this is a clean exit.
  const g1 = app1.scope.Prototype.game;
  Object.assign(g1.hero, { x: 1020, y: 1290 });
  for (const listener of app1.events.pagehide || []) listener();
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  assert.equal(guard.read(), null, 'Clean close must remove crash suspicion');
  const app2 = bootstrap(store);
  assert.deepEqual(position(app2.scope.Prototype.game), [1020, 1290],
    'Normal clean reopen resumes at the exact previous player position');
  assert.equal(app2.scope.Prototype.game.hero.gold, original.hero.gold);
}
{
  const store = storage();
  const original = savedCampaign(store);
  const app = bootstrap(store);
  app.frame(0);
  app.frame(800); // Critical callback stall, combat paused.
  assert.equal(app.scope.Prototype.frameSkip.emergency, true);
  for (const listener of app.events.pagehide || []) listener();
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  assert.equal(guard.read()?.active, true,
    'Closing a still-frozen game must NOT clear the rescue marker');
  const reopened = bootstrap(store);
  assert.notDeepEqual(position(reopened.scope.Prototype.game), position(original),
    'A player closing frozen gameplay reopens at the refuge');
  assert.equal(reopened.scope.Prototype.game.hero.gold, original.hero.gold);
  assert.equal(reopened.scope.Prototype.game.s.statistics.deaths, 0);
}
{
  const store = storage(), g = savedCampaign(store);
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  guard.arm(g);
  const original = JSON.stringify(g.snapshot());
  const incompatible = new Campaign('normal', 'mage', () => 0.73);
  assert.equal(guard.recover(incompatible), null, 'Old marker cannot reset a different class');
  assert.equal(JSON.stringify(g.snapshot()), original);
  guard.clean();
  assert.equal(guard.recover(g), null, 'Clean exit never triggers relocation');
  assert.equal(guard.read(), null);
}
{
  const denied = {
    getItem() { throw Error('blocked'); },
    setItem() { throw Error('blocked'); },
    removeItem() { throw Error('blocked'); },
  };
  const guard = Persistence.createRestartGuard({ storage: denied, Campaign });
  assert.equal(guard.arm(new Campaign()), false);
  assert.equal(guard.recover(new Campaign()), null);
  assert.equal(guard.clean(), false);
}
console.log('PASS relaunch safety: unclean save rescue, refuge/barracks, exact HP/progress, clean-exit persistence and storage failures');
