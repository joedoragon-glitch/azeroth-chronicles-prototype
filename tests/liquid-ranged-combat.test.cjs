'use strict';
// Issue #829 — real liquid is impassable to walking but transparent to
// in-range basic ranged fire. Physical world geometry and projectiles stay native.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

function scene(zone, from, to) {
  const game = new Campaign('normal', 'ranger', () => 0.9);
  game.enter(zone);
  const z = game.zone();
  z.props = [];
  z.enemies = [];
  z.npcs = [];
  z.buildings = [];
  game.s.party = [];
  game.s.projectiles = [];
  game.s.hazards = [];
  game.s.mercyTime = 0;
  game.s.time = 30;
  Object.assign(game.hero, {
    ...from, hp: 10000, maxHp: 10000, immune: 0,
    basicCd: 0, order: null,
  });
  game.hero.skills[0] = 1;
  const foe = game.makeEnemy(
    { species: 'goblin', name: 'Opposite-bank sentry',
      level: 1, hp: 10000, damage: 5, xp: 0, gold: 0 },
    to,
  );
  Object.assign(foe, {
    ranged: true, shotRange: 320, shotSpeed: 260,
    cd: 0, specialCd: 100, rogueCd: 100,
  });
  z.enemies = [foe];
  assert.equal(game.blocked(from.x, from.y, zone, 15), false, 'hero is on dry bank');
  assert.equal(game.blocked(to.x, to.y, zone, 15), false, 'enemy is on dry bank');
  return { game, foe, z };
}
function fly(game, seconds = 3) {
  for (let t = 0; t < seconds; t += 0.05) {
    game.s.time += 0.05;
    game.updateProjectiles(0.05);
  }
}
const from = { x: 480, y: 1320 }, across = { x: 780, y: 1320 };
{
  const { game, foe, z } = scene('vale', from, across);
  assert(game.blocked(630, 1320, 'vale', 0), 'authored pond water is impassable');
  assert.equal(game.line(game.hero, foe), false, 'original movement-based LOS stays unchanged');
  assert.equal(game.clearSegment(game.hero, foe, 0), false, 'movement segment stays blocked');
  assert(game.rangedLine(game.hero, foe), 'ranged LOS crosses water');
  assert(game.rangedSegment(game.hero, foe), 'projectile segment crosses water');
  assert(game.enemyRangedLine(foe, game.hero), 'ranged enemy detects across water');

  // Real enemy awareness must not require changing the native aggro method.
  game.updateEnemies(0.05);
  assert(foe.aggro, 'actual ranged Goblin acquires an opposite-bank hero');

  // Normal hero Skill 1 is physically launched, travels and lands across water.
  const enemyHp = foe.hp;
  assert(game.cast(1, foe.id, false), 'Ranger normal Skill 1 can release across pond');
  assert(game.s.projectiles.some((p) => p.source === 'hero'), 'native projectile is created');
  fly(game);
  assert(foe.hp < enemyHp, 'hero projectile lands on the opposite bank');

  // Actual hostile projectile must hit, rather than disappear at the waterline.
  const heroHp = game.hero.hp;
  game.s.projectiles = [{
    id: 'cross-pond-hostile', source: 'enemy', sourceId: foe.id,
    fortChecked: true, x: foe.x, y: foe.y,
    dx: -1, dy: 0, speed: 260, damage: 5, life: 2, style: 'arrow',
  }];
  fly(game, 2);
  assert(game.hero.hp < heroHp, 'enemy projectile lands across the pond');

  // No projectile or movement tunneling through genuinely solid scenery.
  z.props.push({ id: 'pond-shot-wall', x: 630, y: 1320, r: 22 });
  assert.equal(game.rangedLine(game.hero, foe), false, 'solid prop stops LOS over water');
  assert.equal(game.rangedSegment(game.hero, foe), false, 'solid prop stops projectiles');
  assert.equal(game.enemyRangedLine(foe, game.hero), false, 'enemy respects solid cover');
  assert(game.blocked(630, 1320, 'vale', 15), 'movement collision remains real');
}
{
  // Dark Crown's open lava channel is transparent to shots, not walkable.
  const { game, foe } = scene('crown', { x: 1235, y: 1720 }, { x: 1460, y: 1720 });
  assert(game.blocked(1355, 1720, 'crown', 0), 'lava is movement-blocking');
  assert.equal(game.line(game.hero, foe), false, 'legacy melee/route LOS remains blocked');
  assert(game.rangedLine(game.hero, foe), 'ranged LOS crosses lava');
  assert(game.rangedSegment(game.hero, foe), 'projectile crosses lava');
  assert(game.enemyRangedLine(foe, game.hero), 'ranged enemy shot is eligible across lava');
}
console.log('PASS liquid transparency for native hostile/friendly fire, cover and unchanged movement');
