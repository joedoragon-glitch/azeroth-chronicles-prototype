'use strict';
// Small native-test preconditions; never changes production rules or shortcuts
// the underlying game actions being tested.
const assert = require('node:assert/strict');
const rules = require('../../src/prototype/rules.js');

function setLegalExpeditionMaxRanks(game, names) {
  assert(game?.s?.expeditionSkills, 'Fixture prerequisite: campaign Expedition support state is required');
  for (const name of names) {
    const max = rules.expeditionSupportSkills?.[name]?.maxRank;
    assert(Number.isSafeInteger(max) && max >= 0,
      'Fixture prerequisite: unknown Expedition support rank: ' + name);
    game.s.expeditionSkills[name] = max;
  }
  return game;
}
function assertNativeClearLane(game, source, destination, zone = 'vale', radius = 15) {
  assert(game && typeof game.blocked === 'function' && typeof game.line === 'function',
    'Fixture prerequisite: native campaign geometry required');
  for (const [label, point] of [['source', source], ['destination', destination]]) {
    assert(Number.isFinite(point?.x) && Number.isFinite(point?.y),
      'Fixture prerequisite: finite ' + label + ' coordinates required');
    assert(!game.blocked(point.x, point.y, zone, radius),
      'Fixture prerequisite: ' + label + ' must not overlap terrain');
  }
  assert(game.line(source, destination) && game.clearSegment(source, destination, radius),
    'Fixture prerequisite: unobstructed native line of sight is required');
}
function nativeBasicProjectileHit(game, enemy, { expectedHeroLevel, dt = 0.05, ticks = 25 } = {}) {
  assert(game?.hero && typeof game.cast === 'function' && typeof game.updateProjectiles === 'function',
    'Fixture prerequisite: native campaign with projectile simulation required');
  assert(game.zone().enemies.includes(enemy),
    'Fixture prerequisite: target must belong to active native enemy roster');
  if (expectedHeroLevel !== undefined)
    assert.equal(game.hero.level, expectedHeroLevel,
      'Fixture prerequisite: Ranger level differs from the characterized encounter');
  assert(Number.isFinite(enemy.hp) && enemy.hp > 0,
    'Fixture prerequisite: target must start alive');
  assert(Number.isFinite(dt) && dt > 0 && Number.isInteger(ticks) && ticks > 0,
    'Fixture prerequisite: positive projectile simulation duration required');
  const cast = game.cast(1, enemy.id, false, null, true);
  // Engagement may raise max HP at release; only post-release damage counts.
  const hpAtLaunch = enemy.hp;
  let hit = false;
  for (let i = 0; i < ticks && cast && !hit; i++) {
    game.s.time += dt;
    game.updateProjectiles(dt);
    hit = enemy.hp < hpAtLaunch;
  }
  return { cast: !!cast, hit, hpAtLaunch, hpAfter: enemy.hp };
}
module.exports = { setLegalExpeditionMaxRanks, assertNativeClearLane, nativeBasicProjectileHit };
