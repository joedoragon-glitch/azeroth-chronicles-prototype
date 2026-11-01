'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const config = Campaign.rules.skillEvasion;

assert.deepEqual(config.enemy, { single: 0.2, area: 0.3 });
assert.deepEqual(config.enemyVsRanger, { single: 0.15, area: 0.25 });
assert.deepEqual(config.companion, { single: 0.2, area: 0.3 });
assert.equal(config.enemyNightBonus, 0.05);

function fixture(heroClass = 'mage') {
  const game = new Campaign('normal', heroClass, () => 0.9);
  game.s.mercyTime = 0;
  const targets = game.zone().enemies.filter(e => e.hp > 0 && !e.neutral).slice(0, 3);
  assert.equal(targets.length, 3);
  game.zone().enemies = targets;
  game.zone().props = [];
  game.s.party = [];
  game.night = () => false;
  game.line = () => true;
  game.tacticalRogueLeashAllows = () => true;
  game.attackResetProtected = () => false;
  game.tacticalDirectTargetable = () => true;
  game.awaitsHeroAttack = () => false;
  Object.assign(game.hero, { x: targets[0].x + 30, y: targets[0].y, hp: 1000, maxHp: 1000 });
  targets.forEach((e, i) => {
    e.hp = e.maxHp = 1000;
    e.x = game.hero.x + 55 + i * 25;
    e.y = game.hero.y;
    e.aggro = true;
  });
  return { game, targets };
}

{
  const { game, targets: [e] } = fixture();
  let rolls = 0;
  game.skillEvasionRandom = () => { rolls++; return 0; };
  assert(game.damage(e, 20, 'hero'), 'unclassified ordinary basic contact remains guaranteed');
  assert(game.damage(e, 20, 'hero', { automaticBasic: true }), 'automatic basic remains guaranteed');
  assert(game.damage(e, 20, 'hero', { area: true, automaticBasic: true }),
    'third-hit basic cleave is not treated as a manual AoE skill');
  assert.equal(rolls, 0, 'basics and basic splash never ask for skill dodge rolls');
  assert.equal(game.damage(e, 20, 'hero', { skillAttack: true }), false);
  assert.equal(game.damage(e, 20, 'hero', { area: true }), false);
  assert.equal(rolls, 2, 'manual single and area contacts each ask for a roll');
  const hp = e.hp;
  assert(game.damage(e, 20, 'hero', {
    skillAttack: true, criticalExecution: { critical: true },
  }), 'critical skill bypasses dodge');
  assert.equal(e.hp, hp - 20);
  assert.equal(rolls, 2, 'critical skill bypass consumes no evasion roll');
}

{
  const { game, targets } = fixture('mage');
  const sequence = [0.1, 0.5, 0.2];
  game.skillEvasionRandom = () => sequence.shift();
  const before = targets.map(e => e.hp);
  const landed = targets.map(e => game.damage(e, 25, 'hero',
    { area: true, evasionActionId: 'mage-explosion' }));
  assert.deepEqual(landed, [false, true, false],
    'AoE makes independent decisions for three different enemies');
  assert.deepEqual(targets.map((e, i) => before[i] - e.hp), [0, 25, 0]);
  assert.equal(sequence.length, 0);
  game.skillEvasionRandom = () => { throw Error('same target/cast must never reroll'); };
  assert.equal(game.damage(targets[0], 25, 'hero',
    { area: true, evasionActionId: 'mage-explosion' }), false);
  assert.equal(game.damage(targets[1], 25, 'hero',
    { area: true, evasionActionId: 'mage-explosion' }), true);
}

{
  const { game, targets: [e] } = fixture('ranger');
  game.skillEvasionRandom = () => 0.16;
  assert(game.damage(e, 10, 'hero', { skillAttack: true }), '16% exceeds Ranger 15% single chance');
  assert.equal(game.damage(e, 10, 'hero', { area: true }), false,
    '16% is below Ranger 25% area chance');
  game.night = () => true;
  assert.equal(game.damage(e, 10, 'hero', { skillAttack: true }), false,
    'Ranger single target night chance becomes 20%');
  game.skillEvasionRandom = () => 0.28;
  assert.equal(game.damage(e, 10, 'hero', { area: true }), false,
    'Ranger area night chance becomes 30%');
}

{
  const { game, targets: [e] } = fixture('mage');
  game.skillEvasionRandom = () => 0.23;
  assert(game.damage(e, 10, 'hero', { skillAttack: true }), 'day single 20%');
  game.night = () => true;
  assert.equal(game.damage(e, 10, 'hero', { skillAttack: true }), false, 'night single 25%');
  game.skillEvasionRandom = () => 0.33;
  assert.equal(game.damage(e, 10, 'hero', { area: true }), false,
    'night area chance becomes 35%');
}

{
  const { game, targets: [e] } = fixture('rogue');
  game.skillEvasionRandom = () => { throw Error('music should never roll'); };
  assert(game.damage(e, 20, 'hero', { area: true }),
    'Rogue Bard performance ignores enemy skill evasion');
}

{
  const { game, targets: [e] } = fixture('mage');
  const ally = game.unit('soldier', game.hero.x + 15, game.hero.y);
  const pet = game.unit('pet', game.hero.x + 20, game.hero.y, 'crypt');
  game.s.party = [ally, pet];
  ally.hp = ally.maxHp;
  pet.hp = pet.maxHp;
  game.skillEvasionRandom = () => 0.1;
  assert.equal(game.hitParty(ally, 30, 0, e.id, false,
    { skillAttack: true, area: false }), false,
    'Soldier avoids a single-target monster skill');
  assert.equal(game.hitParty(pet, 30, 0, e.id, false,
    { skillAttack: true, area: true }), false,
    'Pet avoids a monster AoE independently');
  const before = game.hero.hp;
  assert(game.hitParty(game.hero, 30, 0, e.id, false,
    { skillAttack: true, area: true }), 'hero does not gain evasion');
  assert(game.hero.hp < before);
  const prior = ally.hp;
  assert(game.hitParty(ally, 30, 0, e.id), 'ordinary monster basic melee cannot be evaded');
  assert(ally.hp < prior);
  const after = ally.hp;
  assert(game.hitParty(ally, 30, 0, e.id, false,
    { skillAttack: true, area: true, criticalExecution: { critical: true } }),
    'monster critical skill bypasses companion dodge');
  assert(ally.hp < after);
}
console.log('Skill evasion: classification, rates, night bonus, crit bypass and independent AoE rolls passed.');
