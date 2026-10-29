'use strict';
// Rogue instructor rank ladder, real costs, cap enforcement and both skill forms.
// Keep fourth-class admission test-local on baselines where it is still gated.
const assert = require('node:assert/strict'),
  Campaign = require('../src/prototype/engine'),
  Reference = require('../src/prototype/skill-reference');
const hadRogue = Object.hasOwn(Campaign.classes, 'rogue');
if (!hadRogue) {
  Campaign.classes.rogue = { ...Campaign.rules.rogueHeroFoundation.stats, icon: 'bell' };
  Campaign.talentProfiles.rogue = { ...Campaign.rules.rogueHeroFoundation.talents };
}
try {
  const g = new Campaign('normal', 'rogue', () => 0.5);
  const curriculum = [
    ['thorn', 2, [2], [1, 2]],
    ['mire', 3, [3, 4], [1, 2, 3, 4]],
    ['ridge', 4, [5, 6], [1, 2, 3, 4, 5, 6]],
    ['warlord', 6, [7], [1, 2, 3, 4, 5, 6, 7]],
    ['citadel', 8, [8], [1, 2, 3, 4, 5, 6, 7, 8]],
  ];
  const expectUnchanged = (fn, label) => {
    const before = g.hero.gold;
    const ranks = [...g.hero.skills];
    assert.equal(fn(), false, label);
    assert.equal(g.hero.gold, before, label + ': crowns untouched');
    assert.deepEqual(g.hero.skills, ranks, label + ': ranks untouched');
  };
  assert.equal(g.hero.skills[0], 1, 'automatic/normal/charged Skill 1 shares a learned rank');
  expectUnchanged(() => g.learn(2, 'thorn'), 'unrescued teacher must not teach');
  g.s.rescued.thorn = true;
  expectUnchanged(() => g.learn(2, 'mire'), 'wrong teacher must not teach');
  expectUnchanged(() => g.upgrade(2, 'thorn'), 'cannot upgrade unlearned song');
  expectUnchanged(() => g.learn(2, 'thorn'), 'learning requires sufficient crowns');

  g.hero.gold = 200000;
  let learned = 0;
  let upgrades = 0;
  for (const [teacher, cap, learn, train] of curriculum) {
    g.s.rescued[teacher] = true;
    const catalog = g.teacherCatalog(teacher);
    assert.deepEqual(catalog.learn, learn);
    assert.deepEqual(catalog.train, train);
    assert.equal(catalog.maxRank, cap);
    for (const slot of learn) {
      const previousGold = g.hero.gold;
      const cost = g.skillTrainingCost(slot, 0);
      assert.equal(g.hero.skills[slot - 1], 0, 'new song begins unlearned');
      assert(g.learn(slot, teacher), teacher + ' teaches Skill ' + slot);
      assert.equal(g.hero.skills[slot - 1], 1);
      assert.equal(g.hero.gold, previousGold - cost, 'learning pays exact cost');
      expectUnchanged(() => g.learn(slot, teacher), 'cannot buy learned song twice');
      learned++;
    }
    for (const slot of train) {
      while (g.hero.skills[slot - 1] < cap) {
        const rank = g.hero.skills[slot - 1];
        const previousGold = g.hero.gold;
        const cost = g.skillTrainingCost(slot, rank);
        assert(g.upgrade(slot, teacher), teacher + ' upgrades Skill ' + slot + ' to ' + (rank + 1));
        assert.equal(g.hero.skills[slot - 1], rank + 1);
        assert.equal(g.hero.gold, previousGold - cost,
          'every skill-rank purchase deducts its exact rank-dependent price');
        upgrades++;
      }
      expectUnchanged(() => g.upgrade(slot, teacher),
        teacher + ' cannot exceed its Rank ' + cap + ' cap');
    }
    const wrongTeacher = curriculum.find(([name, limit]) => name !== teacher && limit < cap);
    if (wrongTeacher) {
      expectUnchanged(() => g.upgrade(train[0], wrongTeacher[0]),
        'lower-tier teacher cannot train beyond own cap');
    }
  }
  assert.equal(learned, 7, 'all seven nonstarting skills learned');
  assert(upgrades > 40, 'rank progression exercises every level of the five-tier curriculum');
  assert.deepEqual(g.hero.skills, Array(8).fill(8), 'all eight Rogue skills reach Rank 8');
  for (let slot = 1; slot <= 8; slot++) {
    const info = Reference.describe(g, slot);
    assert.equal(info.rank, 8);
    assert(info.tap && info.charge, 'Skill ' + slot + ': normal and charged use same saved rank');
    assert(info.tap.metrics.length && info.charge.metrics.length,
      'Skill ' + slot + ': both forms have readable current values');
    assert.equal(Reference.describe(g, slot, 9), null, 'Rank 9 is not a valid skill rank');
    expectUnchanged(() => g.upgrade(slot, 'citadel'),
      'Rank 8 prevents additional training for Skill ' + slot);
  }
  console.log('PASS Rogue five-tier teacher progression, seven learns, ' + upgrades +
    ' paid rank-ups, exact crown costs, cap and denied-training safety, both forms through Rank 8');
} finally {
  if (!hadRogue) {
    delete Campaign.classes.rogue;
    delete Campaign.talentProfiles.rogue;
  }
}
