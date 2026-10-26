'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const fs = require('node:fs');
const path = require('node:path');

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
  assert.ok(available.some((stage) => stage.id === 'march-night'));
  assert.ok(available.some((stage) => stage.id === 'frontier-night'));
  assert.ok(available.some((stage) => stage.id === 'boss-darklord'));
  assert.ok(available.some((stage) => stage.id === 'boss-darklord-true'));
  assert.equal(arena.arenaSelectStage('unknown'), false);
  assert.equal(arena.arenaSelectStage('vale-ordinary'), true);
  let enemies = arena.zone().enemies;
  assert.equal(enemies.length, 4);
  assert.equal(enemies.every((e) => e.arenaFixture && !e.summon), true);
  assert.equal(enemies.every((e) => e.hp === e.baseHp && e.damage === e.baseDamage), true);
  assert.equal(enemies.every((e) => e.level === 1), true);
  assert.equal(arena.zone().props.length, 0);
  assert.equal(arena.zone().buildings.length, 0);
  arena.tick(0.03);
  assert.equal(arena.arenaSelectStage('vale-guardians'), true);
  enemies = arena.zone().enemies;
  assert.ok(enemies.some((e) => e.guard));
  assert.ok(enemies.some((e) => e.captain));
  assert.equal(enemies.every((e) => e.arenaFixture && !e.summon), true);
  assert.equal(arena.zone().enemies.find((e) => e.captain).damage,
    (7 + 0 * 8) * 1.25, 'captain uses the native room-guard damage');
  assert.equal(arena.arenaSelectStage('frontier-ordinary'), true);
  assert.ok(arena.zone().enemies.some((e) => e.species === 'archer' && e.ranged),
    'native ranged enemies keep their auto-attack role');
  assert.equal(arena.arenaSelectStage('march-night'), true);
  assert.equal(arena.zone().enemies.length, 2);
  assert.ok(arena.zone().enemies.every((e) => e.nightOnly && e.species === 'wraith'));
  arena.tick(0.03);
  assert.equal(arena.zone().enemies.length, 2, 'arena night enemies are not despawned by dawn');
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
  assert.equal(arena.s.statistics.kills, 0, 'arena fixtures do not count campaign kills');
  assert.ok(!arena.s.true.darklord);
  assert.ok(!arenaBoss.summon, 'authentic boss identity is not replaced with a summon');

  const barracks = arena.arenaBuildBarracks();
  assert.ok(barracks && barracks.progress >= 4);
  assert.equal(barracks.interactionOnly, true);
  assert.equal(arena.zone().props.length, 0);
  arena.hero.hp = 1;
  assert.equal(arena.arenaRest(), true);
  assert.equal(arena.hero.hp, arena.hero.maxHp);

  const snapshot = arena.snapshot();
  assert.equal(snapshot.mode, 'arena');
  assert.equal(snapshot.zones.arena.enemies.length, 0,
    'temporary encounter populations are not serialized into bloated saves');
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
  // Update compatibility: a retired/renamed encounter is not a destroyed save.
  // Keep the character, instructor skills and earned one-at-a-time levels.
  const retired = JSON.parse(JSON.stringify(snapshot));
  retired.arenaStage = 'boss-retired-in-next-game-update';
  const recovered = Campaign.restore(retired, () => 0.5);
  assert.equal(recovered.s.arenaStage, 'hub');
  assert.equal(recovered.zone().enemies.length, 0);
  assert.equal(recovered.hero.level, 3);
  assert.deepEqual(recovered.hero.skills, Array(8).fill(1));
  assert.equal(recovered.zone().npcs.some((n) => n.kind === 'arena-level-trainer'), true);
  // A later boss definition is discovered from shared game data automatically,
  // never a pinned/frozen second enemy catalog.
  const addition = {
    ...Campaign.data.bosses.find((b) => b.id === 'thorn'),
    id: 'future-release-test-only', name: 'Future Game Update Boss',
  };
  Campaign.data.bosses.push(addition);
  try {
    assert.ok(recovered.arenaStages().some((stage) => stage.id === 'boss-future-release-test-only'));
    assert.ok(recovered.arenaStages().some((stage) => stage.id === 'boss-future-release-test-only-true'));
  } finally {
    Campaign.data.bosses.pop();
  }
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
const swTemplate = fs.readFileSync(path.resolve(__dirname, '..', 'templates/service-worker.js'), 'utf8');
const buildSource = fs.readFileSync(path.resolve(__dirname, '..', 'scripts/build.cjs'), 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '..', 'src/prototype/app.js'), 'utf8');
assert.ok(swTemplate.includes('{{CACHE_VERSION}}') &&
  buildSource.includes('-release-') &&
  appSource.includes('appRegistration.update()') &&
  appSource.includes("location.reload()"),
  'arena reuses the same release-updating PWA; it must not be a separate frozen app');
for (const [file, needles] of [
  ['src/prototype/renderer.js', [
    "game.s.mode === 'arena' ? '#000000'",
    "if (game.s.mode !== 'arena') add(z.buildings, 'building')",
  ]],
  ['src/prototype/pixi-experimental.js', [
    "if (game.s.mode !== 'arena') add(zone.props, 'prop')",
    "if (game.s.mode !== 'arena') add(zone.buildings, 'building')",
    "scene.setSolidBackground(0x000000",
  ]],
  ['src/prototype/app.js', [
    "Math.min(renderResolution.ratio, 0.5)",
    "action('Replay current encounter'",
  ]],
]) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  for (const needle of needles) assert.ok(code.includes(needle),
    'arena low-spec presentation gate missing: ' + file + ' ' + needle);
}
console.log('PASS Combat Arena: native combat identities/ranges, free training, saves, black renderers, stage replay and recovery');
