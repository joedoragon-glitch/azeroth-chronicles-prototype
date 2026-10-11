'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');

const c = new C('normal', 'paladin', () => 0.9);
c.hero.gold = 10000;
c.s.rescued.thorn = true;
assert(c.trainExpedition('thorn'), 'Expedition training works');
assert.equal(c.notices.length, 0, 'Expedition menu is the confirmation, not amber');
assert(c.learn(2, 'thorn'), 'Skill learning works');
assert.equal(c.notices.length, 0, 'Skill learning is not another amber notice');
c.s.rescued.crypt = true;
assert(c.gear('crypt', 'weapon'), 'Equipment purchases work');
assert.equal(c.notices.length, 0, 'Smith menu and temporary status confirm gear');
c.s.rescued.archive = true;
assert(c.trainCompanionVitality(), 'Companion training works');
assert.equal(c.notices.length, 0, 'Neri menu confirms companion training');
assert(c.buyPotion('tonic', true), 'Legacy tonic action stays compatible');
assert.equal(c.notices.length, 0, 'Tonic activation does not need amber');
c.xp(120 * c.hero.level);
assert(c.notices.some((n) => n.text.includes('LEVEL')), 'Level-up remains prominent');

const field = new C('normal', 'paladin', () => 0.9);
const thorn = field.zone().enemies.find((e) => e.family === 'thorn' && e.form === 'normal');
assert(thorn);
thorn.hp = 0;
field.kill(thorn);
assert.equal(
  field.notices.filter((n) => n.text === 'BOSS VANQUISHED · Thornfang').length,
  1,
  'First normal boss defeat is announced exactly once',
);
const next = field.bossEnemy(field.boss('thorn'), 'normal', thorn.home);
next.hp = 0;
field.kill(next);
assert.equal(
  field.notices.filter((n) => n.text === 'BOSS VANQUISHED · Thornfang').length,
  1,
  'Respawned normal boss does not spam the amber banner',
);

const dungeon = new C('normal', 'paladin', () => 0.9);
dungeon.enter('crypt');
const z = dungeon.zone(),
  guardian = z.enemies.find((e) => e.family === 'crypt' && e.type === 'boss');
assert(guardian);
z.enemies.filter((e) => e.guard).forEach((e) => (e.hp = 0));
guardian.hp = 0;
dungeon.kill(guardian);
assert(dungeon.s.paid['clear:crypt'], 'Dungeon first clear remains rewarded');
assert.equal(
  dungeon.notices.filter((n) => n.text === 'BOSS VANQUISHED · Crypt Guardian').length,
  1,
);
assert.equal(
  dungeon.notices.filter((n) => n.text === 'Forest Crypt · halls secured').length,
  1,
);
dungeon.checkClear();
assert.equal(
  dungeon.notices.filter((n) => n.text === 'Forest Crypt · halls secured').length,
  1,
  'Dungeon first-clear notification cannot repeat',
);
console.log('PASS milestone-only amber notices, first boss victories and first dungeon clears');
