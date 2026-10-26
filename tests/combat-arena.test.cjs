'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function verify(classId) {
  const arena = new Campaign('arena', classId, () => 0.5);
  assert.equal(arena.s.mode, 'arena');
  assert.equal(arena.zoneId, 'arena');
  assert.equal(arena.s.arenaStage, 'hub');
  assert.deepEqual(arena.hero.skills, Array(8).fill(1));
  assert.equal(arena.zone().props.length, 0);
  assert.equal(arena.zone().enemies.length, 0);
  assert.ok(arena.zone().npcs.some((n) => n.kind === 'arena-guide'));
  assert.ok(arena.zone().npcs.some((n) => n.kind === 'teacher'));
  assert.equal(arena.night(), false);
  assert.equal(arena.blocked(1200, 900, 'arena'), false);
  assert.equal(arena.blocked(3, 900, 'arena'), true);
  const gold = arena.hero.gold;
  assert.equal(arena.spend(500), true);
  assert.equal(arena.hero.gold, gold, 'all arena purchases are free');

  const available = arena.arenaStages();
  assert.ok(available.some((stage) => stage.id === 'vale-ordinary'));
  assert.ok(available.some((stage) => stage.id === 'vale-guardians'));
  assert.ok(available.some((stage) => stage.id === 'boss-darklord'));
  assert.ok(available.some((stage) => stage.id === 'boss-darklord-true'));
  assert.equal(arena.arenaSelectStage('unknown'), false);
  assert.equal(arena.arenaSelectStage('vale-ordinary'), true);
  let enemies = arena.zone().enemies;
  assert.equal(enemies.length, 4);
  assert.equal(enemies.every((e) => e.summon && e.developerSummon), true);
  assert.equal(arena.zone().props.length, 0);
  assert.equal(arena.zone().buildings.length, 0);
  arena.tick(0.03);
  assert.equal(arena.arenaSelectStage('vale-guardians'), true);
  enemies = arena.zone().enemies;
  assert.ok(enemies.some((e) => e.guard));
  assert.ok(enemies.some((e) => e.captain));
  assert.equal(enemies.every((e) => e.developerSummon), true);
  assert.equal(arena.arenaSelectStage('boss-thorn'), true);
  assert.ok(arena.zone().enemies.some((e) => e.family === 'thorn' && e.type === 'boss'));
  assert.equal(arena.arenaSelectStage('boss-darklord'), true);
  assert.equal(arena.zone().enemies.filter((e) => e.type === 'boss').length, 1);
  assert.equal(arena.zone().enemies.find((e) => e.type === 'boss').family, 'darklord');
  assert.equal(arena.zone().enemies.length, 1, 'final stage stays minimally populated');

  assert.equal(arena.arenaSelectStage('boss-darklord-true'), true);
  assert.equal(arena.zone().enemies[0].form, 'true');
  const arenaBoss = arena.zone().enemies[0];
  const victories = JSON.stringify(arena.s.victories);
  arenaBoss.hp = 0;
  arena.kill(arenaBoss);
  assert.equal(JSON.stringify(arena.s.victories), victories, 'arena bosses never clear campaign victories');

  const barracks = arena.arenaBuildBarracks();
  assert.ok(barracks && barracks.progress >= 4);
  assert.equal(barracks.interactionOnly, true);
  assert.equal(arena.zone().props.length, 0);
  arena.hero.hp = 1;
  assert.equal(arena.arenaRest(), true);
  assert.equal(arena.hero.hp, arena.hero.maxHp);

  const snapshot = arena.snapshot();
  assert.equal(snapshot.mode, 'arena');
  const loaded = Campaign.restore(snapshot, () => 0.5);
  assert.equal(loaded.s.arenaStage, 'boss-darklord-true');
  assert.equal(loaded.zone().enemies.filter((e) => e.type === 'boss').length, 1);
  assert.equal(loaded.zone().props.length, 0);
  assert.equal(loaded.arenaSelectStage('hub'), true);
  assert.equal(loaded.zone().enemies.length, 0);
  loaded.hero.hp = 0;
  loaded.die();
  assert.equal(loaded.s.arenaStage, 'hub');
  assert.equal(loaded.hero.hp, loaded.hero.maxHp);
}
for (const classId of ['paladin', 'mage', 'ranger']) verify(classId);

const campaign = new Campaign('normal', 'paladin', () => 0.5);
assert.equal(campaign.zoneId, 'vale');
assert.equal(campaign.s.arenaStage, undefined);
assert.notEqual(campaign.zoneSize(), 2000);
console.log('PASS Combat Arena: isolation, native stages, free services, saves and recovery');
