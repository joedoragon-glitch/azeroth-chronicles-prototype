'use strict';
// Critical potency levels are independent of crit probability and actor RNG.
const assert = require('node:assert/strict');
const Crit = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');

const tuning = Levels.createTuning();
assert.deepEqual(tuning.criticalLevels, undefined);
assert.deepEqual(tuning.snapshot(), {
  hero: 1, rogue: 2, companion: 1, world: 1,
  modes: { nightmare: {}, developer: {} },
});
assert(Object.isFrozen(Levels.DEFAULT_LEVELS));
assert(Object.isFrozen(Levels.ACTIONS));
assert.equal(Crit.chanceFor('party'), 0.1);
assert.equal(Crit.chanceFor('world'), 0.1);
for (const group of Levels.GROUPS) {
  for (const mode of Levels.MODES)
    assert.equal(tuning.getLevel(group, mode), group === 'rogue' ? 2 : 1);
  assert.equal(tuning.setLevel(group, 3), 3);
  assert.equal(tuning.getLevel(group), 3);
  assert.equal(tuning.setLevel(group, 1), 1);
}
tuning.setLevel('hero', 2);
tuning.setLevel('companion', 3);
assert.equal(tuning.getLevel('hero'), 2);
assert.equal(tuning.getLevel('companion'), 3);
assert.equal(tuning.getLevel('world'), 1);
tuning.setLevel('world', 3, 'nightmare');
assert.equal(tuning.getLevel('world', 'nightmare'), 3);
assert.equal(tuning.getLevel('world', 'normal'), 1);
assert.equal(tuning.getLevel('hero', 'nightmare'), 2);
const saved = tuning.snapshot();
assert(Object.isFrozen(saved) && Object.isFrozen(saved.modes.nightmare));
assert.equal(saved.modes.nightmare.world, 3);
tuning.setLevel('world', 2, 'nightmare');
assert.equal(saved.modes.nightmare.world, 3, 'snapshot cannot mutate retroactively');
tuning.clearModeLevel('world', 'nightmare');
assert.equal(tuning.getLevel('world', 'nightmare'), 1);
assert.throws(() => tuning.setLevel('world', 0), /Level 1/);
assert.throws(() => tuning.setLevel('world', 4), /Level 1/);
assert.throws(() => tuning.setLevel('world', 1.5), /Level 1/);
assert.throws(() => tuning.setLevel('everyone', 2), /group/);
assert.throws(() => tuning.setLevel('hero', 2, 'dusk'), /mode/);
assert.throws(() => tuning.clearModeLevel('world', 'normal'), /Cannot clear/);
assert.throws(() => Levels.createTuning({ hero: '2' }), /Level 1/);
assert.throws(() => Levels.createTuning({ monsters: 3 }), /Unknown/);
assert.throws(() => Levels.createTuning({ modes: { nightmare: { enemy: 3 } } }), /group/);
assert.throws(() => Levels.createTuning({ modes: { normal: { world: 3 } } }), /Normal/);

const ids = Object.keys(Levels.ACTIONS);
assert.equal(ids.length, 68 + 33 + 9 + 2 + 82, '112 party actions + 82 native World keys');
assert.equal(ids.filter(k=>k.startsWith('hero/')).length, 68);
assert.equal(ids.filter(k=>k.startsWith('pet/')).length, 33);
assert.equal(ids.filter(k=>k.startsWith('troop/')).length, 9);
assert.equal(ids.filter(k=>k.startsWith('charm/')).length, 2);
for (const key of ['charm/rogue/basic', 'charm/rogue/signature']) {
  assert.equal(Levels.ACTIONS[key].group, 'companion', key);
  assert.equal(Levels.ACTIONS[key].lever, 'damage', key);
}
assert.equal(ids.filter(k=>k.startsWith('world/')).length, 82);
assert.equal(Levels.ACTIONS['world/basic/melee'].lever, 'damage');
assert.equal(Levels.ACTIONS['world/basic/ranged'].lever, 'damage');
assert.equal(Levels.ACTIONS['world/support/heal'].lever, 'healTempo');
assert.equal(Levels.ACTIONS['world/night/wraith-drain'].lever, 'damage');
assert.equal(Levels.ACTIONS['world/night/stalker-pounce'].lever, 'damage');
assert.equal(Levels.ACTIONS['world/rogue/basic'].lever, 'damage');
assert.equal(Levels.ACTIONS['world/rogue/signature'].lever, 'damage');
for(const key of ['world/captain/supply-vale/2','world/captain/supply-march/1',
  'world/captain/supply-highlands/2','world/captain/frontier-overseer/0',
  'world/captain/supply-vale/3','world/captain/supply-vale/1',
  'world/captain/supply-vale/0','world/captain/supply-march/0',
  'world/captain/supply-highlands/0','world/captain/frontier-overseer/2',
  'world/captain/supply-vale/4','world/captain/supply-march/2',
  'world/captain/supply-highlands/1','world/captain/frontier-overseer/1',
  'world/captain/supply-crown/2','world/captain/supply-crown/0',
  'world/captain/supply-crown/6','world/captain/supply-crown/1',
  'world/captain/supply-crown/4'])
  assert.equal(Levels.ACTIONS[key].lever,'damage',key);
assert.equal(Levels.ACTIONS['world/captain/supply-crown/3'].lever,'summonVitality',
  'Nucleus Herd strengthens only successful new brood HP, not damage');
assert.equal(Levels.ACTIONS['world/captain/supply-crown/5'].lever,'hasteDuration',
  'Creep Feeding extends only the existing brood haste window');
assert.equal(Levels.ACTIONS['world/boss/thorn/0'].lever,'damage');
assert.equal(Levels.ACTIONS['world/boss/thorn/2'].lever,'slowDuration',
  'Thornfang Slow line only extends the existing status, not its damage');
assert.equal(Levels.ACTIONS['world/boss/ridge/0'].lever,'damage',
  'Ridge Tyrant authored immediate cone remains separate from cargo/charge/summon');
const authoredBossLevers = {"thorn":["damage","damage","slowDuration","summonVitality"],"crypt":["pushDistance","damage","summonVitality","damage","slowDuration","wardDuration"],"mire":["damage","damage","damage","summonVitality"],"archive":["damage","damage","slowDuration","summonVitality","cooldownDebt"],"ridge":["damage","damage","damage","summonVitality"],"mine":["damage","damage","slowDuration","damage","summonVitality"],"warlord":["damage","damage","summonVitality","damage"],"abyss":["damage","damage","damage","summonVitality"],"citadel":["damage","hasteDuration","damage","damage","summonVitality"],"darklord":["damage","damage","summonVitality","damage","damage","markDuration"]};
for (const [family, levers] of Object.entries(authoredBossLevers))
  for (let index = 0; index < levers.length; index++)
    assert.equal(Levels.ACTIONS['world/boss/' + family + '/' + index].lever, levers[index]);
for (const [index, lever] of ['damage','damage','wardDuration','damage','damage','damage','summonVitality'].entries())
  assert.equal(Levels.ACTIONS['world/boss/cindermaw/' + index].lever, lever);
for (const cls of ['paladin', 'mage', 'ranger', 'rogue']) {
  assert(Levels.ACTIONS['hero/' + cls + '/auto']);
  for (let slot=1;slot<=8;slot++)
    for (const form of ['tap','charged'])
      assert(Levels.ACTIONS['hero/' + cls + '/' + slot + '-' + form]);
}
for (const family of ['thorn','crypt','mire','archive','ridge','mine','warlord','abyss','citadel','cindermaw','darklord'])
  for (const slot of ['basic','1','2'])
    assert(Levels.ACTIONS['pet/' + family + '/' + slot]);
assert.equal(tuning.effectFor('hero/wizard/9-tap', 'hero'), null, 'no universal fallback');
assert.equal(tuning.effectFor('boss/thorn/0', 'world'), null, 'world authoring is Stage 3');
assert.throws(() => tuning.effectFor('hero/paladin/1-tap','companion'), /mismatch/);

assert.equal(tuning.effectFor('hero/paladin/1-charged','hero').level, 2);
assert.equal(Levels.ACTIONS['hero/rogue/auto'].group, 'rogue');
assert.equal(Levels.ACTIONS['hero/rogue/4-charged'].lever, 'healAmount');
assert.equal(Levels.ACTIONS['hero/rogue/5-charged'].lever, 'wardStrength');
assert.equal(Levels.ACTIONS['hero/rogue/8-charged'].lever, 'silenceDuration');
assert.equal(Levels.createTuning().getLevel('rogue','normal'), 2);
assert.equal(Levels.createTuning().getLevel('rogue','nightmare'), 2);
assert.equal(Levels.createTuning().getLevel('rogue','developer'), 2);
assert.equal(Levels.createTuning().getLevel('hero'), 1);
assert.equal(Levels.createTuning().getLevel('companion'), 1);
assert.equal(Levels.createTuning().getLevel('world'), 1);
assert.equal(tuning.setLevel('rogue', 3, 'nightmare'), 3);
assert.equal(tuning.getLevel('hero','nightmare'), 2);
assert.equal(tuning.getLevel('rogue','nightmare'), 3);
assert.throws(()=>tuning.setLevel('rogue',4), /Level 1/);
assert.equal(tuning.effectFor('pet/crypt/1','companion').lever,'healAmount');
assert.equal(tuning.effectFor('hero/ranger/1-charged','hero').lever,'damage');
assert.equal(tuning.effectFor('hero/paladin/3-tap','hero').lever,'wardDuration');
assert.equal(tuning.effectFor('troop/archer/heal','companion').lever,'healAmount');
assert.equal(tuning.effectFor('troop/archer/first','companion').lever,'damage');
assert.equal(tuning.effectFor('troop/soldier/guard','companion').lever,'guardDuration');
for (const [lever, rule] of Object.entries(Levels.LEVERS)) {
  assert.equal(rule.values.length, 3, lever);
  assert(rule.values[0] < rule.values[1] && rule.values[1] < rule.values[2], lever);
  assert(['multiply','divide','addSeconds','addFraction'].includes(rule.operation), lever);
}
const src = Crit.seededStream(33);
const resolver = Crit.createResolver({enabled: true, stream:src});
const raw = resolver.release({action:{},key:'hero/paladin/1-charged',domain:'party',released:true});
const effect = tuning.effectFor(raw.key, 'hero');
const critical = Object.freeze({ ...raw, critical:true, effect });
assert.equal(Levels.enhanceExisting(critical, 100, 'damage'), 120);
assert.equal(Levels.enhanceExisting(critical, 100, 'damage', {max:110}), 110, 'native caps retained');
assert.equal(Levels.enhanceExisting({ ...critical, critical:false }, 100, 'damage'), 100);
assert.equal(Levels.enhanceExisting(null, 100, 'damage'), 100);
assert.throws(() => Levels.enhanceExisting(critical,100,'healAmount'), /wrong action/);
assert.throws(() => Levels.enhanceExisting(critical,-1,'damage'), /existing/);
assert.throws(() => Levels.enhanceExisting(critical,100,'damage',{min:11,max:10}), /bounds/);
const slow = {critical:true,effect:tuning.effectFor('pet/thorn/2','companion')};
assert.equal(Levels.enhanceExisting(slow, 2, 'slowDuration'), 3.0);
const stance = {critical:true,effect:tuning.effectFor('hero/paladin/3-tap','hero')};
assert.equal(Levels.enhanceExisting(stance,8,'wardDuration',{max:9}),8.75);
tuning.setLevel('hero', 1);
assert.equal(effect.level, 2, 'released effect snapshots current level');
assert.equal(tuning.effectFor('hero/paladin/1-charged','hero').level, 1);
assert.equal(Crit.chanceFor('party'), .1, 'effect intensity never alters probability');

console.log('Four independent three-level critical groups; Rogue starts at Level 2.');
