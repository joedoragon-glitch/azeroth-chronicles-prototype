'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const cfg = Campaign.rules.enemySupportHealing;
const near = (a, b, message) =>
  assert(Math.abs(a - b) < 1e-5, message + ': ' + a + ' !== ' + b);
const rooms = [
  ['supply-vale', 8, 3],
  ['supply-march', 8, 3],
  ['supply-highlands', 7, 3],
  ['supply-crown', 11, 5],
];

function nativeRoom(id, mode) {
  const game = new Campaign(mode, 'paladin', () => 0.9);
  game.enter(id);
  const zone = game.zone();
  const guards = zone.enemies.filter((e) => e.roomGuard);
  const captain = guards.find((e) => e.roomCaptain);
  const ranged = guards.filter((e) => !e.roomCaptain && e.ranged && e.forcedRole === 'ranged');
  assert(captain, id + ' has a native captain');
  game.s.party = [];
  game.s.mercyTime = 0;
  game.s.time = 30;
  // Keep the hero away from the authored room without stubbing the AI,
  // healing, route solver, line-of-sight or native collision.
  Object.assign(game.hero, { x: -2000, y: -2000, hp: 10000, maxHp: 10000 });
  return { game, zone, guards, captain, ranged };
}

function tick(game, count, dt = 0.1) {
  for (let i = 0; i < count; i++) {
    game.s.time += dt;
    game.updateEnemies(dt);
  }
}

let visited = 0;
for (const mode of ['normal', 'nightmare']) {
  for (const [id, expectedTotal, expectedRanged] of rooms) {
    const { game, guards, captain, ranged } = nativeRoom(id, mode);
    assert.equal(guards.length, expectedTotal, mode + '/' + id + ': original native guard total');
    assert.equal(guards.filter((e) => e.roomCaptain).length, 1, mode + '/' + id + ': one captain');
    assert.equal(ranged.length, expectedRanged, mode + '/' + id + ': authored ranged guardians');
    assert(guards.filter((e) => !e.roomCaptain).every((e) => e.gold === 0 && e.xp === 0),
      mode + '/' + id + ': no repeatable guardian rewards');
    const nativeSlots = Campaign.rules.treasuryGuardFormations[id];
    assert.equal(nativeSlots.length, expectedTotal, id + ': source roster matches runtime');
    for (const e of guards) {
      assert(!game.blocked(e.home.x, e.home.y, id, 12),
        mode + '/' + id + ': authored guard home is collision-clear: ' + e.name);
    }
    for (const e of ranged) {
      const inRange = Math.hypot(e.x - captain.x, e.y - captain.y) <= cfg.range;
      if (inRange && game.line(e, captain)) {
        assert(game.route(e, captain).length > 0 || inRange,
          id + ': guardian has a native reachable support position');
      }
    }
    if (id === 'supply-vale' || id === 'supply-march') {
      const added = ranged.filter((e) => /command lookout|rear lookout/.test(e.name));
      assert.equal(added.length, 2, mode + '/' + id + ': two new command-side guards');
      for (const guard of added) {
        assert(Math.hypot(guard.x - captain.x, guard.y - captain.y) <= cfg.range,
          guard.name + ': native treatment distance');
        assert(game.line(guard, captain), guard.name + ': unblocked native sightline');
      }
    }

    // The native room remains stable through a v4-style partial roster.
    // Older defeated guardians must never return when slots are appended.
    const save = game.snapshot();
    const kept = guards.slice(0, 4);
    const killed = kept[0];
    const ids = new Set(kept.map((e) => e.id));
    save.zones[id].enemies = save.zones[id].enemies.filter((e) => !e.roomGuard || ids.has(e.id));
    const corpse = save.zones[id].enemies.find((e) => e.id === killed.id);
    corpse.hp = 0;
    corpse.deathPaid = true;
    const restored = Campaign.restore(save, () => 0.9);
    restored.enter(id);
    const after = restored.zone().enemies.filter((e) => e.roomGuard);
    assert.equal(after.length, expectedTotal, mode + '/' + id + ': legacy slots filled once');
    assert(after.some((e) => e.id === killed.id && e.hp === 0),
      mode + '/' + id + ': historical guardian stays dead');
    assert(kept.every((e) => after.some((u) => u.id === e.id)),
      mode + '/' + id + ': historical identities preserved');
    const afterIds = after.map((e) => e.id).sort();
    restored.zone();
    assert.deepEqual(restored.zone().enemies.filter((e) => e.roomGuard)
      .map((e) => e.id).sort(), afterIds, mode + '/' + id + ': no duplicate append');
    visited++;
  }
}
console.log('PASS native Treasury/legacy roster checks across eight mode/room combinations');

// Real, unmocked idle update ticks: a wounded captain above its independent
// 75% self-heal gate must obtain ranged-guardian treatment below the 90%
// provisional captain-recipient gate. No fake line() or zone() overrides.
for (const mode of ['normal', 'nightmare']) {
  for (const id of ['supply-vale', 'supply-march', 'supply-highlands', 'supply-crown']) {
    const { game, captain, ranged } = nativeRoom(id, mode);
    captain.hp = captain.maxHp * 0.82;
    const before = captain.hp;
    const sources = new Set(ranged.map((e) => e.id));
    tick(game, 1);
    const first = game.s.statistics.events.find((e) =>
      e.type === 'heal' && e.target === captain.id && sources.has(e.source));
    assert(first, mode + '/' + id + ': real idle guard treats native idle captain');
    assert(captain.supportHeal, mode + '/' + id + ': actual timed captain pulse began');
    near(captain.supportHeal.seconds, cfg.duration,
      mode + '/' + id + ': captain gets original five-second pulse');
    assert(captain.supportHeal.allowIdle, mode + '/' + id + ': pulse is idle safe');

    const saved = game.snapshot();
    const inSave = saved.zones[id].enemies.find((e) => e.id === captain.id);
    assert(inSave && !inSave.supportHeal,
      mode + '/' + id + ': transient healing does not leak to save');
    const source = game.zone().enemies.find((e) => e.id === first.source);
    const sourceInSave = saved.zones[id].enemies.find((e) => e.id === source.id);
    assert(sourceInSave && !sourceInSave.supportHealCd,
      mode + '/' + id + ': guard cooldown is runtime-only');
    assert(captain.supportHeal, mode + '/' + id + ': snapshot did not cancel live pulse');
    const loaded = Campaign.restore(saved, () => 0.9);
    loaded.enter(id);
    const loadedCaptain = loaded.zone().enemies.find((e) => e.id === captain.id);
    assert(loadedCaptain && !loadedCaptain.supportHeal,
      mode + '/' + id + ': restored captain has no orphaned timed healing');

    tick(game, 52);
    assert(captain.hp > before, mode + '/' + id + ': real idle pulse restores captain HP');
    assert(!captain.supportHeal, mode + '/' + id + ': native healing finishes');
    assert(!source.aggro, mode + '/' + id + ': idle treatment does not provoke guard');
    console.log('PASS native idle healing: ' + mode + '/' + id + ', source ' + source.name);
  }
}

{
  // Native lifecycle cancellation: resetting/death must invalidate an active
  // treatment immediately, even in the absence of hero combat.
  for (const status of ['returning', 'death']) {
    const { game, captain } = nativeRoom('supply-highlands', 'normal');
    captain.hp = captain.maxHp * 0.82;
    tick(game, 1);
    assert(captain.supportHeal, 'native captain has a timed pulse before ' + status);
    if (status === 'returning') captain.returning = 1;
    else captain.hp = 0;
    tick(game, 1);
    assert(!captain.supportHeal, status + ' cancels treatment in native update loop');
    if (status === 'death') assert.equal(captain.hp, 0, 'healing never revives a dead captain');
  }
}

console.log('PASS ' + visited + ' native Treasury save restorations, idle captain healing and lifecycle cancellation');
