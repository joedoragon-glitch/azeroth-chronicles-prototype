'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const bossDef = Campaign.data.bosses.find((boss) => boss.id === 'darklord');

for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of Object.keys(Campaign.classes)) {
    const game = new Campaign(mode, heroClass, () => 0.9);
    assert(game.enter('crown'));
    const lord = game.bossEnemy(bossDef, 'normal', { x: 1100, y: 1100 });
    game.zone().enemies = [lord];
    Object.assign(game.hero, { x: 1200, y: 1100 });
    lord.hp = lord.maxHp * 0.3;
    assert(game.startBossRecovery(lord), mode + '/' + heroClass + ': stance starts');
    assert.equal(lord.telegraph.name, 'Second Wind');
    assert.equal(lord.telegraph.secondWind, true);
    assert.equal(lord.secondWindUsed, true);
    assert.equal(game.startBossRecovery(lord), false, 'cannot begin a second stance');
    const hp = lord.hp;
    game.resolveAttack(lord);
    assert.equal(lord.hp, hp + lord.maxHp * 0.05, 'front-facing stance heals once');
    lord.telegraph = null;
    assert.equal(game.startBossRecovery(lord), false, 'once-only persists through warning expiry');
    assert.equal(Campaign.restore(game.snapshot()).s.version, 4, 'v4 save contract unchanged');
  }
}

{
  const game = new Campaign('normal', 'ranger', () => 0.9);
  assert(game.enter('crown'));
  const lord = game.bossEnemy(bossDef, 'normal', { x: 1100, y: 1100 });
  game.zone().enemies = [lord];
  Object.assign(game.hero, { x: 1200, y: 1100 });
  lord.hp = lord.maxHp * 0.3;
  assert(game.startBossRecovery(lord));
  const before = lord.hp;
  Object.assign(game.hero, { x: 1000, y: 1100 });
  game.line = () => true;
  game.tacticalRogueLeashAllows = () => true;
  assert(game.damage(lord, 100, 'hero'), 'actual rear damage must land');
  assert(lord.hp < before, 'stance never makes the ruler invulnerable');
  assert.equal(lord.secondWindCancelled, true);
  const injured = lord.hp;
  game.resolveAttack(lord);
  assert.equal(lord.hp, injured, 'rear hit cancels only the heal');
  lord.returning = 0.05;
  game.disengage(lord, 0.1);
  assert.equal(lord.secondWindUsed, undefined, 'full disengage resets one-use status');
  assert.equal(lord.secondWindCancelled, undefined);
  assert.equal(lord.healCd, 0, 'long cooldown cannot leak into next encounter');
  lord.hp = lord.maxHp * 0.3;
  assert(game.startBossRecovery(lord), 'new encounter re-arms Second Wind');
}
console.log('PASS Dark Lord Second Wind across Normal/Nightmare, all classes, rear interrupts, resets and saves');
