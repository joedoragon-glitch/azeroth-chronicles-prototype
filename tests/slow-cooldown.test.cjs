'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const R = Campaign.rules;
assert.equal(R.cooldownBalance.slowRecoveryMultiplier, 0.65);
const close = (value, expected, label) =>
  assert(Math.abs(value - expected) < 1e-8, label + ': expected ' + expected + ', got ' + value);

{
  const g = new Campaign('normal', 'paladin', () => 0.9);
  const hero = g.hero;
  hero.slow = 2;
  close(g.cooldownRecoveryElapsed(hero, 1), 0.65, 'full second under Slow');
  hero.slow = 0.25;
  close(g.cooldownRecoveryElapsed(hero, 1), 0.9125, 'partial second at expiry');
  hero.slow = 0;
  close(g.cooldownRecoveryElapsed(hero, 1), 1, 'normal recovery after expiry');
  hero.slow = 3;
  close(
    g.cooldownRecoveryElapsed(hero, 0.1) * 10,
    g.cooldownRecoveryElapsed(hero, 1),
    'fractional cooldown recovery is frame-rate stable',
  );
  hero.slow = 0;
  hero.immune = 3;
  assert.equal(g.applySlow(hero, 4), false, 'immunity prevents Slow and cooldown penalty');
  close(g.cooldownRecoveryElapsed(hero, 1), 1, 'immunity keeps normal cooldown recovery');
}
for (const cls of ['paladin', 'mage', 'ranger']) {
  const g = new Campaign('normal', cls, () => 0.9);
  g.zone().enemies = [];
  g.s.party = [];
  g.hero.cd = Array(8).fill(3);
  g.hero.slow = 0.05;
  g.updateParty = () => {};
  g.updateEnemies = () => {};
  g.tick(0.1);
  close(g.hero.cd[0], 3 - 0.0825, cls + ' active cooldown only pays for Slow overlap');
  close(g.hero.cd[7], 3 - 0.0825, cls + ' all skills share cooldown Slow');
  close(g.hero.slow, 0, cls + ' Slow duration still expires normally');
  g.tick(0.1);
  close(g.hero.cd[0], 3 - 0.1825, cls + ' ordinary recovery resumes immediately');
}
{
  const g = new Campaign('normal', 'ranger', () => 0.9);
  g.zone().enemies = [];
  const ally = g.unit('soldier', g.hero.x, g.hero.y);
  Object.assign(ally, {
    active: true,
    slow: 3,
    cd: 4,
    skill1Cd: 5,
    skill2Cd: 6,
    skillGlobalCd: 2,
    healCd: 10,
    manaCd: 10,
    survivalCd: 10,
  });
  g.s.party = [ally];
  g.updateEnemies = () => {};
  g.updateProjectiles = () => {};
  g.tick(0.1);
  for (const [key, start] of [['cd', 4], ['skill1Cd', 5], ['skill2Cd', 6], ['skillGlobalCd', 2],
    ['healCd', 10], ['manaCd', 10], ['survivalCd', 10]]) {
    close(ally[key], start - 0.065, 'slowed companion ' + key);
  }
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  const e = g.makeEnemy({ species: 'goblin', name: 'Slow test foe', level: 1, hp: 1000, damage: 0, gold: 0, xp: 0 }, { x: 2100, y: 2100 });
  g.zone().enemies = [e];
  Object.assign(e, { slow: 3, cd: 5, specialCd: 6, summonCd: 7, healCd: 8 });
  g._tacticalRogueNext = new Map([[e.id, g.s.time + 10]]);
  const before = g._tacticalRogueNext.get(e.id);
  g.s.time += 0.1;
  g.updateEnemies(0.1);
  for (const [key, start] of [['cd', 5], ['specialCd', 6], ['summonCd', 7], ['healCd', 8]]) {
    close(e[key], start - 0.065, 'slowed monster ' + key);
  }
  close(g._tacticalRogueNext.get(e.id), before + 0.035, 'pending monster rogue cadence slows');
}
{
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.hero.slow = 2.5;
  g.hero.cd[1] = 4;
  const restored = Campaign.restore(g.snapshot(), () => 0.9);
  close(restored.hero.slow, 2.5, 'legacy slow duration survives save/load');
  close(restored.hero.cd[1], 4, 'no new save field is required for cooldown Slow');
}
console.log('PASS Slow reduces remaining skill recovery on heroes, companions, enemy and rogue cooldowns; immunity, expiry and save contract');
