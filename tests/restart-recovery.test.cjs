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
      x: 730, y: 700, progress: 4, full: false,
    });
    g.s.barracksRespawn = { zone: 'vale', id: 'recovery-camp-test' };
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
  assert.equal(restored.blocked(restored.hero.x, restored.hero.y), false,
    'The restored hero lands on collision-safe terrain even when a town anchor is obstructed');
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
  const store = storage(), original = savedCampaign(store, { barracks: true });
  const guard = Persistence.createRestartGuard({ storage: store, Campaign });
  guard.arm(original);
  const app = bootstrap(store), g = app.scope.Prototype.game;
  const chosenLanding = original.safe(815, 750);
  assert.deepEqual(position(g), [chosenLanding.x, chosenLanding.y],
    'Completed barracks uses exactly the native collision-safe arrival point');
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
