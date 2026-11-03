'use strict';
// The older deterministic combat suites isolate skill Block, while the
// dedicated Skill Block suites exercise genuine Block probability.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const isolate = require('./helpers/legacy-skill-evasion.cjs');
assert.equal(typeof Campaign.prototype.skillBlocks, 'function');
const original = Campaign.prototype.skillBlocks;
isolate();
assert.notEqual(Campaign.prototype.skillBlocks, original);
const game = new Campaign('normal', 'mage', () => 0.9);
const enemy = game.zone().enemies.find(e => e.hp > 0 && !e.neutral);
assert(enemy, 'expected real fixture target');
assert.equal(game.skillBlocks(enemy, 'area', { source: 'hero' }), false,
  'legacy fixture protects hit geometry without rolling optional new Block');
assert.equal(game.effects.some(e => e.type === 'skillBlocked'), false,
  'legacy isolation never invents block feedback');
console.log('PASS legacy deterministic combat fixture isolates only skill block');
