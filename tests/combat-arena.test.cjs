'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function verify(classId) {
  const arena = new Campaign('arena', classId, () => 0.5);
  assert.equal(arena.s.mode, 'arena');
  assert.equal(arena.zoneId, 'arena');
  assert.equal(arena.s.arenaStage, 'hub');
  assert.deepEqual(arena.hero.skills, [1, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(arena.zone().props.length, 0);
  assert.equal(arena.zone().enemies.length, 0);
  assert.ok(arena.zone().npcs.some((n) => n.kind === 'arena-guide'));
  assert.ok(arena.zone().npcs.some((n) => n.kind === 'teacher'));
  assert.ok(arena.zone().npcs.some((n) => n.kind === 'arena-level-trainer'));
  const trainer = arena.zone().npcs.find((n) => n.kind === 'arena-level-trainer');
  assert.ok(Math.hypot(trainer.x - arena.hero.x, trainer.y - arena.hero.y) < 115,
    'trainer is reachable at spawn without loading scenery');
  // Skills stay locked until the correct specialist teaches them. All
  // learning uses the original progression functions, without arena fees.
  const goldBeforeTeaching = arena.hero.gold;
  assert.equal(arena.learn(2, 'mire'), false, 'wrong teacher must not unlock a skill');
  assert.equal(arena.hero.skills[1], 0);
  for (const def of Campaign.data.skills.slice(1)) {
    const family = def[4];
    assert.ok(arena.zone().npcs.some((n) => n.kind === 'teacher' && n.family === family),
      'the correct skill instructor must be present for skill ' + def[0]);
    assert.equal(arena.learn(def[0], family), true, 'learning skill ' + def[0]);
  }
  assert.deepEqual(arena.hero.skills, Array(8).fill(1));
  assert.equal(arena.hero.gold, goldBeforeTeaching, 'all instructor skills are free');
  assert.equal(arena.s.companionCombatTraining, 2, 'native second-skill unlock is retained');
  assert.equal(arena.night(), false);
  assert.equal(arena.blocked(1200, 900, 'arena'), false);
  assert.equal(arena.blocked(3, 900, 'arena'), true);
  const gold = arena.hero.gold;
  const baseHp = arena.hero.maxHp;
  assert.equal(arena.arenaLevelUp(), true);
  assert.equal(arena.hero.level, 2, 'one NPC interaction grants exactly one level');
  assert.ok(arena.hero.maxHp > baseHp);
  assert.equal(arena.hero.talentPoints, 1);
  // Existing partial XP should complete exactly the current level, not cause a jump.
  arena.xp(15);
  assert.equal(arena.arenaLevelUp(), true);
  assert.equal(arena.hero.level, 3);
  assert.equal(arena.hero.xp, 0);
  assert.equal(arena.hero.talentPoints, 2);
  assert.equal(arena.spend(500), true);
  assert.equal(arena.hero.gold, gold, 'all arena purchases and one-level boosts are free');

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
  assert.equal(snapshot.mercyTime, 10, 'arena destinations respect the v4 save limit');
  assert.doesNotThrow(() => Campaign.validate(snapshot), 'arena saves must validate');
  const loaded = Campaign.restore(snapshot, () => 0.5);
  assert.equal(loaded.s.arenaStage, 'boss-darklord-true');
  assert.equal(loaded.hero.level, 3, 'individual trainer level gains survive save/reload');
  assert.deepEqual(loaded.hero.skills, Array(8).fill(1), 'instructor-learned skills persist');
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
assert.deepEqual(campaign.hero.skills, [1, 0, 0, 0, 0, 0, 0, 0]);
assert.equal(campaign.arenaLevelUp(), false, 'NPC level-up restricted to arena');
console.log('PASS Combat Arena: isolation, native stages, free services, saves and recovery');
