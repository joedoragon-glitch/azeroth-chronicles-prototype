'use strict';
// Combined release gate: real Treasury guard healing while a real captain
// prepares/releases a legal Rogue maneuver in the unmocked enemy update loop.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const heal = Campaign.rules.enemySupportHealing;
const rooms = [
  ['supply-vale', 8, 3],
  ['supply-march', 8, 3],
  ['supply-highlands', 7, 3],
  ['supply-crown', 11, 5],
];
const close = (a, b) => Math.abs(a - b) <= 1e-5;

let cases = 0;
for (const mode of ['normal', 'nightmare']) {
  for (const [id, totalGuards, rangedCount] of rooms) {
    const g = new Campaign(mode, 'paladin', () => 0.9);
    g.enter(id);
    g.s.party = [];
    g.s.time = 30;
    g.s.mercyTime = 0;
    const z = g.zone();
    const guards = z.enemies.filter((e) => e.roomGuard);
    const captain = guards.find((e) => e.roomCaptain && e.captainProfile === id);
    assert(captain, mode + '/' + id + ': native room captain exists');
    assert.equal(guards.length, totalGuards, mode + '/' + id + ': native guard identities');
    const ranged = guards.filter((e) => e.ranged && !e.roomCaptain);
    assert.equal(ranged.length, rangedCount, mode + '/' + id + ': correct ranged posts');
    assert(guards.filter((e) => !e.roomCaptain).every((e) => e.gold === 0 && e.xp === 0),
      mode + '/' + id + ': guard reinforcements grant no extra rewards');

    const spot = g.safe(captain.x - 92, captain.y - 25);
    Object.assign(g.hero, spot, { hp: 200000, maxHp: 200000 });
    captain.hp = captain.maxHp * 0.82;
    const before = captain.hp;
    const guard = ranged.find((u) =>
      Math.hypot(u.x - captain.x, u.y - captain.y) <= heal.range &&
      g.line(u, captain));
    assert(guard, mode + '/' + id + ': native ranged healer has clear sight');
    assert(g.enemySupportHeal(guard), mode + '/' + id + ': native guard begins captain treatment');
    assert(captain.supportHeal, mode + '/' + id + ': treatment belongs to native captain');
    const budget = (captain.maxHp - captain.hp) * heal.captain.missingFraction;
    assert(close(captain.supportHeal.remaining, budget),
      mode + '/' + id + ': original 50%-of-missing captain healing budget');
    assert.equal(captain.supportHeal.seconds, heal.captain.duration,
      mode + '/' + id + ': healing still takes five seconds');
    assert.equal(captain.supportHeal.source, guard.id,
      mode + '/' + id + ': healing records real guardian source');

    g.engage(captain, true, false);
    assert(g.tacticalRogueMove(captain, g.hero),
      mode + '/' + id + ': real captain can begin an in-range Rogue warning');
    assert(captain.telegraph?.rogueMove,
      mode + '/' + id + ': Rogue maneuver is a real, timed warning');
    assert.equal(g._tacticalRogueNext.get(captain.id), g.s.time + 2,
      mode + '/' + id + ': two-second Rogue decision gate');
    const firstRemaining = captain.supportHeal.seconds;

    g.s.time += 0.1;
    g.updateEnemies(0.1);
    assert(captain.hp > before,
      mode + '/' + id + ': real enemy update advances healing during Rogue warning');
    assert(captain.supportHeal && captain.supportHeal.seconds < firstRemaining,
      mode + '/' + id + ': preparation does not freeze guardian treatment');
    assert(!captain.returning && captain.hp <= captain.maxHp,
      mode + '/' + id + ': legal defensive maneuver never resets captain or over-heals');

    const save = g.snapshot();
    const saved = save.zones[id].enemies.find((e) => e.id === captain.id);
    assert(saved && !saved.supportHeal,
      mode + '/' + id + ': timed healing never leaks into a save made during Rogue preparation');
    const loaded = Campaign.restore(save, () => 0.9);
    loaded.enter(id);
    const loadedGuards = loaded.zone().enemies.filter((e) => e.roomGuard);
    assert.equal(loadedGuards.length, totalGuards,
      mode + '/' + id + ': save round-trip retains original Treasury roster');
    assert.equal(new Set(loadedGuards.map((e) => e.id)).size, totalGuards,
      mode + '/' + id + ': save round-trip does not duplicate guard identities');
    const restoredCaptain = loadedGuards.find((e) => e.id === captain.id);
    assert(restoredCaptain && restoredCaptain.hp > before && restoredCaptain.hp <= restoredCaptain.maxHp,
      mode + '/' + id + ': real captain HP survives reload without a free reset');
    assert(!restoredCaptain.supportHeal,
      mode + '/' + id + ': no orphaned healing after reload');

    // Continue the same real combat, without removing the Rogue warning,
    // stubbing pathfinding, or advancing only the isolated healing method.
    for (let i = 0; i < 52; i++) {
      g.s.time += 0.1;
      g.updateEnemies(0.1);
    }
    assert(captain.hp >= before + budget - 1e-4 && captain.hp <= captain.maxHp,
      mode + '/' + id + ': full guardian healing budget completes during native combat');
    assert(!captain.supportHeal,
      mode + '/' + id + ': completed timed treatment retires');
    assert(!captain.returning && captain.hp > 0,
      mode + '/' + id + ': captain stays in the established live encounter');
    cases++;
    console.log('PASS native Treasury healing + Rogue warning/release + v4 save: ' + mode + '/' + id);
  }
}
assert.equal(cases, 8);
console.log('PASS combined captain healing/Rogue interactions in all eight native Treasury configurations');
