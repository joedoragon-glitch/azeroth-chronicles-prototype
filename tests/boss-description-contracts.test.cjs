'use strict';

const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');

const thorn = Campaign.data.bosses.find((boss) => boss.id === 'thorn');
const mine = Campaign.data.bosses.find((boss) => boss.id === 'mine');
const pounce = Campaign.rules.attacks.thorn[1];
const rush = Campaign.rules.attacks.mine[3];
const cadence = Campaign.rules.bossCadence.specialRecoveryMultiplier;

assert.equal(pounce.kind, 'circle');
assert.equal(pounce.landing, true);
assert.equal(pounce.opening, undefined, 'Pounce has no miss-only vulnerability');
assert.equal(pounce.recovery * cadence, 0.375, 'approved current Pounce recovery');
assert.match(thorn.attacks[1], /1\.3 seconds/);
assert.match(thorn.attacks[1], /0\.375 seconds/);
assert.match(thorn.attacks[1], /hit or miss/);
assert.doesNotMatch(thorn.attacks[1], /misses leave|1\.5 second opening/i);

assert.equal(rush.kind, 'line');
assert.equal(rush.charge, true);
assert.equal(rush.opening, 3, 'approved Wall Rush core exposure');
assert.match(mine.attacks[3], /1\.7 seconds/);
assert.match(mine.attacks[3], /exposed for 3 seconds/);
assert.doesNotMatch(mine.attacks[3], /pillar/i);

console.log(
  'PASS author-approved Thornfang and Stone Colossus descriptions match existing combat rules',
);
