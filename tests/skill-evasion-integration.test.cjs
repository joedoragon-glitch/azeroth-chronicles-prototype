'use strict';
// A genuine skill contact can be evaded, but basics and criticals still resolve.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const game = new Campaign('normal', 'mage', () => 0.99);
game.enter('crypt');
const boss = game.zone().enemies.find((e) => e.type === 'boss');
assert(boss, 'Crypt boss exists for real damage integration');
game.zone().enemies = [boss];
game.zone().props = [];
game.line = () => true;
game.hero.x = boss.x + 30;
game.hero.y = boss.y;
game.hero.immune = 15;
game.hero.maxHp = game.hero.hp = 1000;
let samples = 0;
game.rollSkillEvasion = () => { samples++; return 0; };
const original = boss.hp;
assert.equal(game.damage(boss, 8, 'hero', { skillShape: 'single' }), false,
  'legal single-target skill can be avoided');
assert.equal(boss.hp, original, 'avoided skill does not deal damage');
assert.equal(samples, 1, 'one legal skill contact samples once');
assert.equal(game.effects.filter((e) => e.type === 'skillEvaded' && e.target === boss.id).length, 1,
  'only a genuine dodge emits a Miss receipt');
assert(game.damage(boss, 8, 'hero', { automaticBasic: true, skillShape: 'single' }),
  'a basic attack never inherits a skill dodge');
assert.equal(samples, 1, 'automatic basic does not sample');
const afterBasic = boss.hp;
assert(game.damage(boss, 8, 'hero', {
  skillShape: 'single', criticalExecution: { critical: true },
}), 'critical skill bypasses Dodge');
assert(boss.hp < afterBasic, 'critical skill dealt real damage');
assert.equal(samples, 1, 'critical hit does not sample evasion');

const soldier = game.unit('soldier', game.hero.x, game.hero.y);
const archer = game.unit('archer', game.hero.x + 5, game.hero.y + 5);
for (const u of [soldier, archer]) {
  u.active = true;
  u.hp = u.maxHp = 350;
  u.immune = 0;
  u.slow = 0;
}
game.s.party = [soldier, archer];
const start = soldier.hp;
assert.equal(game.hitParty(soldier, 40, 0, boss.id, false, { shape: 'single' }), false,
  'a Soldier can avoid a genuine hostile skill');
assert.equal(soldier.hp, start, 'no damage to dodging Soldier');
assert.equal(samples, 2, 'one roll for the Soldier');
assert(game.hitParty(soldier, 40, 0, boss.id, false, {
  shape: 'single', criticalExecution: { critical: true },
}), 'hostile critical bypasses companion dodge');
assert(soldier.hp < start, 'hostile critical still harms Soldier');
assert.equal(samples, 2, 'no extra Dodge roll on a critical');
soldier.hp = soldier.maxHp;
samples = 0;
const values = [0, 0.99];
game.rollSkillEvasion = () => { samples++; return values.shift(); };
const area = {
  kind: 'circle', count: 1,
  x: soldier.x, y: soldier.y,
  radius: 145, coefficient: 1,
  slow: true, persistent: false,
};
const sHp = soldier.hp, aHp = archer.hp;
game.resolveArea(boss, area);
assert.equal(samples, 2, 'same boss AoE samples once per eligible companion');
assert.equal(soldier.hp, sHp, 'first target independently dodged the blast');
assert(archer.hp < aHp, 'second target independently took its blast hit');
console.log('PASS skill evasion integrated damage, critical, basic and boss AoE contacts');
