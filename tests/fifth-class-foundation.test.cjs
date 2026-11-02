'use strict';

// Fifth-class FOUNDATION ONLY. These tests never make the Strategist playable.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const copy = (o) => JSON.parse(JSON.stringify(o));
const classes = Campaign.classes;
const origin = Object.keys(classes);
assert.deepEqual(origin, ['paladin', 'mage', 'ranger']);
assert.equal(Campaign.classFoundationFor('strategist'), null);
assert.equal(classes.strategist, undefined);

// Live class foundations no longer carry obsolete auto-approach geometry.
for (const [id, party, role] of [
  ['paladin', ['soldier', 'archer'], 'melee'],
  ['mage', ['soldier', 'archer'], 'ranged'],
  ['ranger', ['soldier', 'archer'], 'ranged'],
  ['rogue', [], 'ranged'],
]) {
  const foundation = Campaign.classFoundationFor(id);
  assert.deepEqual(foundation.startingCompanions, party);
  assert.equal(Object.hasOwn(foundation, 'basicAttackApproachRange'), false);
  assert.equal(foundation.formationRole, role);
  assert(Object.isFrozen(foundation));
  assert(Object.isFrozen(foundation.startingCompanions));
}
const prior = new Campaign('normal', 'mage', () => 0.9);
const priorSave = prior.snapshot();
assert.deepEqual(prior.s.party.map((u) => u.type), ['soldier', 'archer']);
assert.doesNotThrow(() => Campaign.validate(copy(priorSave)));

// No fifth-class script, menu button, save admission or Succession participant.
const foundation = {
  startingCompanions: ['soldier', 'archer'],
  formationRole: 'ranged',
};
for (const [id, value] of [
  ['__proto__', foundation],
  ['constructor', foundation],
  ['fifth', { ...foundation, startingCompanions: ['dragon'] }],
  ['fifth', { ...foundation, formationRole: 'wizard' }],
  ['fifth', { ...foundation, startingCompanions: null }],
]) assert.throws(() => Campaign.defineClassFoundation(id, value));
const dormant = Campaign.defineClassFoundation('fifth-fixture', foundation);
assert.deepEqual(dormant.startingCompanions, ['soldier', 'archer']);
assert(Object.isFrozen(dormant));
assert(Object.isFrozen(dormant.startingCompanions));
foundation.startingCompanions.push('archer');
assert.deepEqual(dormant.startingCompanions, ['soldier', 'archer'], 'no caller mutation leaks');
assert.throws(() => Campaign.defineClassFoundation('fifth-fixture', foundation), /duplicate/);
assert.equal(Campaign.classes['fifth-fixture'], undefined);
assert.equal(Campaign.rules.movementBasicClasses['fifth-fixture'], undefined,
  'dormant classes may not inherit moving autoattacks');
assert.deepEqual(Object.keys(classes), origin, 'foundation is not playable admission');
assert.throws(() => new Campaign('normal', 'fifth-fixture'), /Unknown mode or class/);
assert.throws(() => new Campaign('normal', 'constructor'), /Unknown mode or class/);
const tampered = copy(priorSave);
tampered.hero.class = 'fifth-fixture';
assert.throws(() => Campaign.validate(tampered), /Invalid save/);
const inherited = copy(priorSave);
inherited.hero.class = 'constructor';
assert.throws(() => Campaign.validate(inherited), /Invalid save/);
assert.deepEqual(prior.snapshot(), priorSave, 'dormant registration changed no campaign');

const candidate = {
  icon: '◇',
  stats: { hp: 120, mp: 0, power: 18, armor: 5, speed: 290 },
  talents: { power: 7, mana: 2, hp: 30, speed: 40 },
};
const missing = Campaign.classAdmissionIssues('fifth-fixture', candidate);
assert(missing.includes('missing authored combat owner'));
assert(missing.includes('missing charged Skill 1 cooldown'));
const failedState = JSON.stringify({
  names: Object.keys(classes),
  talents: Object.keys(Campaign.talentProfiles),
  movement: Campaign.rules.movementBasicClasses['fifth-fixture'],
});
assert.throws(() => Campaign.registerPlayableClass('fifth-fixture', candidate), /admission blocked/);
assert.equal(JSON.stringify({
  names: Object.keys(classes),
  talents: Object.keys(Campaign.talentProfiles),
  movement: Campaign.rules.movementBasicClasses['fifth-fixture'],
}), failedState, 'rejected admission must be atomic');
assert(Campaign.classAdmissionIssues('fifth-fixture', {
  ...candidate, stats: { ...candidate.stats, speed: Infinity },
}).includes('missing class stats'));
assert(Campaign.classAdmissionIssues('fifth-fixture', {
  ...candidate, talents: { ...candidate.talents, hp: NaN },
}).includes('missing discipline growth'));

// No silent Mage/Ranger combat or undefined charged timer for a dormant id.
const probe = new Campaign('normal', 'mage', () => 0.9);
probe.hero.class = 'fifth-fixture'; // Diagnostic only; this invalid save is NOT accepted.
assert.equal(typeof probe.heroBasicAttackApproachRange, 'undefined');
assert.equal(probe.skillCooldown(1, true), Infinity);
const beforeCast = probe.snapshot();
assert.equal(probe.cast(1), false);
assert.deepEqual(probe.snapshot(), beforeCast, 'unsupported cast cannot change world');
const soldier = probe.s.party.find((u) => u.type === 'soldier');
const withFifth = probe.partyFormationOffset(soldier);
probe.hero.class = 'mage';
assert.deepEqual(probe.partyFormationOffset(soldier), withFifth, 'role-driven formation matches ranged Mage');

// Rogue remains the real fourth class with its existing ability gate.
assert.throws(() => new Campaign('normal', 'rogue'), /Unknown mode or class/);
assert.deepEqual(Campaign.classAdmissionIssues('rogue', {
  icon: 'jingle-bell',
  stats: Campaign.rules.rogueHeroFoundation.stats,
  talents: Campaign.rules.rogueHeroFoundation.talents,
}), []);
assert.equal(Campaign.enableRoguePlaytest(), true);
assert.equal(Campaign.enableRoguePlaytest(), false);
assert.deepEqual(Object.keys(classes), [...origin, 'rogue']);
assert.equal(Campaign.rules.movementBasicClasses.rogue, true,
  'existing Rogue movement basic behavior preserved explicitly');
const rogue = new Campaign('normal', 'rogue', () => 0.9);
assert.deepEqual(rogue.s.party, []);
assert.equal(typeof rogue.heroBasicAttackApproachRange, 'undefined');
assert.equal(rogue.skillCooldown(1, true), 8);
assert.doesNotThrow(() => Campaign.validate(rogue.snapshot()));
assert.equal(Campaign.restore(rogue.snapshot(), () => 0.9).hero.class, 'rogue');
assert.equal(classes['fifth-fixture'], undefined, 'no fifth hero was activated');
console.log('PASS fifth-class dormant foundation, class admission, Rogue and v4 regression');
