'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

function cryptEncounter(mode = 'normal') {
  const game = new Campaign(mode, 'mage', () => 0.9);
  game.enter('crypt');
  const boss = game.zone().enemies.find((enemy) => enemy.type === 'boss');
  assert(boss, 'Crypt Guardian is present');
  game.zone().enemies = [boss];
  game.zone().props = [];
  game.s.party = [];
  game.line = () => true;
  Object.assign(game.hero, {
    x: boss.x + 30,
    y: boss.y,
    hp: 1000,
    maxHp: 1000,
    slow: 0,
    immune: 5,
    order: null,
  });
  return { game, boss, hero: game.hero };
}

for (const mode of ['normal', 'nightmare']) {
  const { game, boss, hero } = cryptEncounter(mode);
  const area = {
    kind: 'circle',
    count: 1,
    x: hero.x,
    y: hero.y,
    radius: 145,
    coefficient: 1,
    slow: true,
    persistent: true,
  };
  const before = hero.hp;
  game.resolveArea(boss, area);
  assert.equal(hero.hp, before, 'immunity blocks boss area damage in ' + mode);
  assert.equal(hero.slow, 0, 'immunity blocks boss area Slow in ' + mode);
  assert.equal(game.s.hazards.length, 1, 'persistent patch still exists');

  const patch = game.s.hazards[0];
  patch.tick = 0;
  game.updateProjectiles(0.1);
  assert.equal(hero.slow, 0, 'immunity blocks persistent hazard Slow');
  assert.equal(hero.hp, before, 'immunity blocks persistent hazard damage');

  hero.immune = 0;
  hero.slow = 6;
  patch.tick = 0;
  game.updateProjectiles(0.1);
  assert(hero.hp < before, 'a vulnerable actor takes normal hazard damage');
  assert.equal(hero.slow, 6, 'a three-second hazard cannot shorten a six-second Slow');

  hero.slow = 0;
  patch.tick = 0;
  game.updateProjectiles(0.1);
  assert.equal(hero.slow, 3, 'a vulnerable actor receives the authored hazard Slow');

  assert(game.applySlow(hero, 7));
  assert(game.applySlow(hero, 2));
  assert.equal(hero.slow, 7, 'Slow duration uses longest-remaining stacking');
  assert.equal(game.applySlow(hero, -2), false, 'negative durations are rejected');
  assert.equal(game.applySlow(hero, NaN), false, 'non-finite durations are rejected');

  const fallen = game.unit('soldier', hero.x, hero.y);
  fallen.hp = 1;
  fallen.slow = 0;
  game.s.party = [fallen];
  game.resolveArea(boss, { ...area, persistent: false });
  assert.equal(fallen.hp, 0, 'lethal area damage still resolves');
  assert.equal(fallen.slow, 0, 'a fallen companion does not retain a new Slow');
}

{
  const { game, hero } = cryptEncounter();
  const seal = {
    kind: 'seal',
    x: hero.x,
    y: hero.y,
    radius: 80,
    index: 99,
    cycle: 1,
    phase: 1.5,
    warningTime: 1,
    activeTime: 1,
    damageFraction: 0.05,
    slowSeconds: 2.75,
  };
  game.traps = () => [seal];
  game.updateTraps(0.1);
  assert.equal(hero.slow, 0, 'immune hero resists an active trap seal');

  seal.cycle = 2;
  hero.immune = 0;
  hero.slow = 4;
  game.updateTraps(0.1);
  assert.equal(hero.slow, 4, 'trap seal cannot shorten an existing Slow');

  seal.cycle = 3;
  hero.slow = 0;
  game.updateTraps(0.1);
  assert.equal(hero.slow, seal.slowSeconds, 'unprotected trap seal applies its duration');
}

{
  const game = new Campaign('normal', 'paladin', () => 0.9);
  game.hero.skills[3] = 1;
  game.hero.immune = 3.5;
  assert(game.cast(4), 'Paladin guard can be activated');
  assert.equal(game.hero.immune, 3.5, 'a shorter guard cannot cancel a longer immunity');
}

{
  const { game, boss } = cryptEncounter();
  boss.rogueDustCoverUntil = game.s.time + 1.65;
  assert.equal(game.tacticalDirectTargetable(boss), false, 'dust blocks direct targeting');
  assert.equal(game.damage(boss, 25), false, 'direct attacks respect dust cover');
  const hp = boss.hp;
  assert(game.damage(boss, 25, 'hero', { area: true }), 'area attacks still hit through dust');
  assert(boss.hp < hp, 'dust cover is not invulnerability');
}

console.log('PASS v0.9 condition contracts: immunity, slows, traps, stacking, death and dust targeting');
