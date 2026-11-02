'use strict';
// Scoped Issue #684 regression: a dormant historical hero attack order is
// NEVER a real attack or evidence of pressure for the current enemy AI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Campaign = require('../src/prototype/engine.js');
const archived = require('../tools/legacy/hero-attack-order.cjs');
assert.deepEqual(archived.approach, { paladin: 105, mage: 350, ranger: 350, rogue: 220 });
const c = new Campaign('normal', 'paladin', () => 0.9);
const z = c.zone();
const e = c.makeEnemy(
  { species: 'goblin', name: 'Pressure audit', level: 1, hp: 900, damage: 1, gold: 0, xp: 0 },
  { x: c.hero.x + 60, y: c.hero.y },
);
z.enemies = [e];
c.s.party = [];
c.s.mercyTime = 0;
c.s.valeFieldAwakened = true;
c.s.thornHeroInitiated = true;
c.line = () => true;
e.aggro = true;
assert.equal(c.tacticalActiveTargetCount(e), 0);
c.s.heroTarget = e.id;
assert.equal(c.tacticalActiveTargetCount(e), 0, 'selected hero target is not itself a hit');
c.hero.order = { type: 'attack', id: e.id };
assert.equal(c.tacticalActiveTargetCount(e), 0, 'obsolete hero attack order is never tactical pressure');
c.tacticalRecordHit(e, 'hero', 15);
assert.equal(c.tacticalActiveTargetCount(e), 1, 'actual recent hero attack does count');
c.s.time += 2.3;
assert.equal(c.tacticalActiveTargetCount(e), 0, 'old real hit expires on time');
c.hero.order = { type: 'attack', id: e.id };
const position = { x: c.hero.x, y: c.hero.y };
const cd = c.hero.cd[0];
c.tick(0.05, { x: 0, y: 0 });
assert.equal(c.hero.order, null, 'old order discarded by the real engine tick');
assert.deepEqual({ x: c.hero.x, y: c.hero.y }, position,
  'old order never moves hero');
assert.equal(c.hero.cd[0], cd, 'old order never triggers Skill 1');
for (const source of ['engine.js', 'combat.js', 'hero-combat.js'])
  assert(!/(?:\brequire\s*\(|\bimport\s*\(|\bfrom\s*['\"])[^\n]*hero-attack-order\.cjs/.test(
    fs.readFileSync(path.resolve(__dirname, '../src/prototype', source), 'utf8')),
  'archived historical executor has no runtime import');
console.log('PASS real hero attack pressure, legacy-order inertness and archived-only Skill 1 implementation');
