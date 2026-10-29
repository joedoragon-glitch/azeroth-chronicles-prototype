'use strict';
// Individual companion mastery: earned achievements, guarded encounter
// receipts, three bounded tiers, and old-version-4 save migration.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = Campaign.rules;

const game = new Campaign('normal', 'paladin', () => 0.9);
game.s.mercyTime = 0;
game.s.valeFieldAwakened = true;
const [soldier, archer] = game.s.party;
assert(soldier && archer);
assert.equal(soldier.masteryPoints, 0);
assert.equal(archer.masteryPoints, 0);
assert.deepEqual(R.balance.companions.mastery.thresholds, [4, 10, 18]);
assert.equal(game.companionMasteryTier(soldier), 0);

game.awardCompanionMastery(4);
assert.equal(soldier.masteryPoints, 4);
assert.equal(archer.masteryPoints, 4);
assert.equal(game.companionMasteryTier(soldier), 1);
game.awardCompanionMastery(6);
assert.equal(game.companionMasteryTier(soldier), 2);
game.awardCompanionMastery(8);
assert.equal(game.companionMasteryTier(soldier), 3);
assert.equal(soldier.masteryPoints, 18);
game.awardCompanionMastery(1000);
assert.equal(soldier.masteryPoints, 18, 'Tier III does not accumulate unbounded points');

soldier.masteryPoints = archer.masteryPoints = 0;
archer.active = false;
assert.equal(game.awardCompanionMastery(1), 1);
assert.equal(soldier.masteryPoints, 1);
assert.equal(archer.masteryPoints, 0, 'resting companion cannot get credit');
archer.active = true;
archer.hp = 0;
assert.equal(game.awardCompanionMastery(1), 1);
assert.equal(archer.masteryPoints, 0, 'fallen companion cannot get credit');
archer.hp = archer.maxHp;

const key = 'crypt:skeleton:500:300';
assert.equal(game.awardCompanionMastery(1, key), 2);
assert.equal(game.awardCompanionMastery(1, key), 0,
  'resurrected/reinforced same guardian never pays twice');
assert.deepEqual(soldier.masteryGuardianKeys, [key]);
assert.equal(game.awardCompanionMastery(1, 'crypt:skeleton:550:300'), 2,
  'a distinct guardian encounter may pay once');
assert.equal(game.awardCompanionMastery(1), 2,
  'repeatable captain defeats are allowed to pay each time');

const first = game.hero.level;
const beforeLevelMastery = soldier.masteryPoints;
game.xp(game.xpRequired());
assert.equal(game.hero.level, first + 1);
assert.equal(soldier.masteryPoints, beforeLevelMastery + 1,
  'hero level advance pays each active living companion exactly once');

const quest = { id: 'quest-1', kind: 'barracks' };
const progress = { done: true, paid: false, active: true };
const beforeQuestMastery = soldier.masteryPoints;
assert.equal(game.payQuest(quest, progress), true);
assert.equal(game.payQuest(quest, progress), false);
assert.equal(soldier.masteryPoints, beforeQuestMastery + 1,
  'quest pays once, without a duplicate reward on replay');

// Old version-4 snapshots do not have mastery fields.
const saved = game.snapshot();
const old = structuredClone(saved);
for (const u of old.party) {
  delete u.masteryPoints;
  delete u.masteryGuardianKeys;
}
const migrated = Campaign.validate(old);
assert.equal(migrated.party[0].masteryPoints, 0);
assert.deepEqual(migrated.party[0].masteryGuardianKeys, []);
assert.equal(Campaign.validate(saved).party[0].masteryPoints,
  soldier.masteryPoints, 'progress survives a v4 save');

const invalid = structuredClone(saved);
invalid.party[0].masteryPoints = 19;
assert.throws(() => Campaign.validate(invalid), /mastery/i,
  'past-tier inflation must be rejected');
const duplicate = structuredClone(saved);
duplicate.party[0].masteryGuardianKeys = [key, key];
assert.throws(() => Campaign.validate(duplicate), /guardian mastery/i,
  'duplicate guardian receipts must be rejected');

console.log('PASS individual mastery: four companion-family model, 0–III thresholds, active-only rewards, quest/level, guardian receipts, v4 save validation');
