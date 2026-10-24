'use strict';
const assert = require('node:assert/strict');
// Post-opening isolated fixtures must earn admission through the native kill
// boundary. Merely raising hero level or setting aggro does not finish it.
function completeFieldOpening(game) {
  if (game.zoneId !== 'vale' || game.s.valeFieldAwakened) return;
  const zone = game.zone();
  const enemy = game.makeEnemy(
    { species: 'goblin', name: 'Fixture opening', level: 1, hp: 1, damage: 0, gold: 0, xp: 0 },
    { x: game.hero.x + 50, y: game.hero.y },
  );
  zone.enemies.push(enemy);
  game.damage(enemy, enemy.maxHp + 10, 'hero');
  assert(enemy.hp <= 0, 'The native hero hit kills the opening fixture');
  assert.equal(game.s.valeFieldAwakened, true, 'Native first-kill admission must complete');
  zone.enemies = zone.enemies.filter((e) => e !== enemy);
}
module.exports = { completeFieldOpening };
