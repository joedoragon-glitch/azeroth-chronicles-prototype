'use strict';
// The older deterministic combat suites isolate skill Evasion, while the
// dedicated skill-evasion suites exercise genuine Dodge probability.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const isolate = require('./helpers/legacy-skill-evasion.cjs');
assert.equal(typeof Campaign.prototype.skillEvades, 'function');
const original = Campaign.prototype.skillEvades;
isolate();
assert.notEqual(Campaign.prototype.skillEvades, original);
const game = new Campaign('normal', 'mage', () => 0.9);
const enemy = game.zone().enemies.find(e => e.hp > 0 && !e.neutral);
assert(enemy, 'expected real fixture target');
assert.equal(game.skillEvades(enemy, 'area', { source: 'hero' }), false,
  'legacy fixture protects hit geometry without rolling optional new Dodge');
assert.equal(game.effects.some(e => e.type === 'skillEvaded'), false,
  'legacy isolation never invents evasion feedback');
console.log('PASS legacy deterministic combat fixture isolates only skill evasion');
