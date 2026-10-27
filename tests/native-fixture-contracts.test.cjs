'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const rules = require('../src/prototype/rules.js');
const { setLegalExpeditionMaxRanks, assertNativeClearLane, nativeBasicProjectileHit } =
  require('./helpers/native-fixture-contracts.cjs');
const g = new Campaign('normal', 'ranger', () => 0.91);
setLegalExpeditionMaxRanks(g, ['sharedTraining', 'sharedStrength']);
assert.equal(g.s.expeditionSkills.sharedTraining, rules.expeditionSupportSkills.sharedTraining.maxRank);
assert.equal(g.s.expeditionSkills.sharedStrength, rules.expeditionSupportSkills.sharedStrength.maxRank);
assert.throws(() => setLegalExpeditionMaxRanks(g, ['not-an-existing-skill']),
  /Fixture prerequisite: unknown Expedition support rank/);
const target = { x: 1800, y: 1800 };
const shooter = { x: 2250, y: 1800 };
g.enter('vale');
assertNativeClearLane(g, shooter, target);
assert.throws(() => assertNativeClearLane(g, { x: NaN, y: 1 }, target),
  /Fixture prerequisite: finite source coordinates/);
assert.throws(() => nativeBasicProjectileHit(g, { id: 'absent', hp: 10 }),
  /Fixture prerequisite: target must belong to active native enemy roster/);
const e = g.makeEnemy({ species: 'goblin', name: 'native projectile fixture', level: 1,
  hp: 4000, damage: 1, gold: 0, xp: 0 }, target);
g.zone().enemies = [e];
assert.throws(() => nativeBasicProjectileHit(g, e, { expectedHeroLevel: 4 }),
  /Fixture prerequisite: Ranger level differs from the characterized encounter/);
// Test the real basic-arrow path without assuming that engagement scaling is damage.
g.s.mercyTime = 0;
g.s.valeFieldAwakened = true;
g.s.thornHeroInitiated = true;
Object.assign(g.hero, { ...shooter, level: 4, hp: 100000, maxHp: 100000,
  basicCd: 0, order: null });
g.hero.skills[0] = 1;
const result = nativeBasicProjectileHit(g, e, { expectedHeroLevel: 4 });
assert(result.cast && result.hit && result.hpAfter < result.hpAtLaunch,
  'real Ranger basic arrow must reduce post-engagement HP');
console.log('PASS native fixture prerequisites reject invalid ranks, unreachable targets and fake arrow observations');
