'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

for (const mode of ['normal', 'nightmare']) {
  for (const heroClass of Object.keys(C.classes)) {
    const c = new C(mode, heroClass, () => 0.9);
    assert(c.enter('crown'));
    const enemy = c.makeEnemy({
      species: 'stalker', name: 'Ash stalker', level: 16,
      hp: 240, damage: 40, gold: 0, xp: 0,
    }, { x: 1200, y: 1100 });
    c.zone().enemies = [enemy];
    Object.assign(c.hero, { x: 1300, y: 1100, maxHp: 100000, hp: 100000 });
    const events = c.s.statistics.events.length;
    assert(c.startNightSkill(enemy, c.hero));
    assert.equal(enemy.telegraph.nightSkill, 'pounce');
    assert.equal(enemy.telegraph.anonymousCast, true);
    assert.equal(enemy.telegraph.timer, 0.7, 'preparation remains 0.7s');
    assert.equal(enemy.telegraph.total, 0.7);
    assert.equal(enemy.telegraph.radius, 78);
    assert.equal(enemy.telegraph.pounceSpeed, 560);
    assert.equal(enemy.telegraph.coefficient, 1.6);
    assert.equal(enemy.telegraph.slowDuration, 3);
    assert.equal(c.s.statistics.events.length, events, 'Stalker warning name is never leaked');
    const hp = c.hero.hp;
    c.resolveAttack(enemy);
    assert.equal(c.hero.hp, hp, 'windup/release does not create an immediate damage hit');
    assert(enemy.motion && enemy.motion.landing && enemy.motion.speed === 560,
      'original collision-aware physical landing remains');
    assert.equal(enemy.motion.target.x, 1300);
    assert.equal(enemy.motion.target.y, 1100);
    assert.equal(enemy.specialCd, 4.2, 'existing cooldown unchanged');
    const restored = C.restore(c.snapshot());
    assert.equal(restored.s.version, 4);
  }
}
// Lantern Wraith still warns normally, with its original radius and Soul Drain.
const w = new C('normal', 'paladin', () => 0.9);
w.enter('march');
const ghost = w.makeEnemy({
  species: 'wraith', name: 'Lantern wraith', level: 4,
  hp: 100, damage: 10, gold: 0, xp: 0,
}, { x: 1200, y: 1100 });
w.zone().enemies = [ghost];
assert(w.startNightSkill(ghost, w.hero));
assert(!ghost.telegraph.anonymousCast);
assert.equal(ghost.telegraph.name, 'Soul Drain');
assert(w.s.statistics.events.some((e) => e.type === 'warning' && e.family === 'wraith'));
console.log('PASS anonymous Shadow Pounce 0.7s warning, untouched leap and Wraith identity');
