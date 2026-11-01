'use strict';
// Source-level evasion probabilities and receipt priority. No rendering or wall-clock RNG.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const game = new Campaign('normal', 'mage', () => 0.99);
const enemies = game.zone().enemies.filter((e) => e.hp > 0 && !e.neutral);
assert(enemies.length, 'ordinary world creates living enemies');
const enemy = enemies[0];
game.night = () => false;
let rolls = [];
game.rollSkillEvasion = () => {
  assert(rolls.length, 'unexpected extra evasion roll');
  return rolls.shift();
};
function avoids(target, shape, source, samples, criticalExecution = null) {
  rolls = samples.slice();
  const answer = game.skillEvades(target, shape, { source, criticalExecution });
  assert.equal(rolls.length, 0, 'exactly one roll per eligible skill target');
  return answer;
}
assert(avoids(enemy, 'single', 'hero', [0.19]), 'Mage single 20%');
assert(!avoids(enemy, 'single', 'hero', [0.20]), 'exact single threshold');
assert(avoids(enemy, 'area', 'hero', [0.29]), 'Mage area 30%');
assert(!avoids(enemy, 'area', 'hero', [0.30]), 'exact area threshold');
game.hero.class = 'ranger';
assert(avoids(enemy, 'single', 'hero', [0.14]), 'Ranger single 15%');
assert(!avoids(enemy, 'single', 'hero', [0.15]), 'Ranger single has lower dodge');
assert(avoids(enemy, 'area', 'hero', [0.24]), 'Ranger area 25%');
assert(!avoids(enemy, 'area', 'hero', [0.25]), 'Ranger area threshold');
game.night = () => true;
assert(avoids(enemy, 'single', 'hero', [0.19]), 'Ranger single at night +5 points');
assert(!avoids(enemy, 'single', 'hero', [0.20]), 'night threshold exact');
game.hero.class = 'mage';
assert(avoids(enemy, 'single', 'hero', [0.24]), 'Mage night single 25%');
assert(avoids(enemy, 'area', 'hero', [0.34]), 'Mage night area 35%');
game.hero.class = 'rogue';
rolls = [];
assert(!game.skillEvades(enemy, 'area', { source: 'hero' }), 'Rogue performances ignore evasion');
game.hero.class = 'mage';
rolls = [];
assert(!game.skillEvades(enemy, 'area', {
  source: 'hero', criticalExecution: { critical: true },
}), 'critical attack cannot be dodged or consume a dodge roll');
assert(!game.skillEvades(enemy, 'basic', { source: 'hero' }), 'basic attacks cannot roll');

game.night = () => false;
rolls = [0.1, 0.9, 0.2];
const recipients = [enemy,
  { ...enemy, id: 'area-dodge-2' },
  { ...enemy, id: 'area-dodge-3' }];
game.zone().enemies.push(...recipients.slice(1));
assert.deepEqual(recipients.map((e) => game.skillEvades(e, 'area', { source: 'hero' })),
  [true, false, true], 'AoE rolls independently for each eligible enemy');
assert.equal(rolls.length, 0);
assert.equal(game.effects.filter((e) => e.type === 'skillEvaded').length >= 2, true);
const soldier = game.unit('soldier', game.hero.x, game.hero.y);
soldier.active = true;
game.s.party = [soldier];
assert(avoids(soldier, 'single', enemy.id, [0.19]), 'Soldier has 20% versus hostile skill');
assert(!avoids(soldier, 'single', enemy.id, [0.20]), 'companion single threshold');
assert(avoids(soldier, 'area', enemy.id, [0.29]), 'Soldier has 30% area evasion');
game.night = () => true;
assert(!avoids(soldier, 'area', enemy.id, [0.30]), 'night does not enhance companions');
rolls = [];
assert(!game.skillEvades(game.hero, 'area', { source: enemy.id }),
  'current hero classes do not receive passive Dodge');

// The fourth RNG stream must never sample Campaign.random or shift critical streams.
let worldCalls = 0;
game.random = () => { worldCalls++; return 0.01; };
game.s.skillEvasionRngState = 0x12345678;
const a = game.rollSkillEvasion(), state = game.s.skillEvasionRngState;
assert(Number.isFinite(a) && a >= 0 && a < 1);
game.s.skillEvasionRngState = 0x12345678;
assert.equal(game.rollSkillEvasion(), a, 'restored state yields deterministic roll');
assert.equal(game.s.skillEvasionRngState, state, 'state persists reproducibly');
assert.equal(worldCalls, 0, 'no world RNG used');
console.log('PASS skill evasion base/ranger/night/rogue/critical/companion/AoE/RNG rules');
