'use strict';
// Innate hero class passives: one shared combat path, skill/talent and save invariants.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const R = require('../src/prototype/rules.js');
const { setLegalExpeditionMaxRanks } = require('./helpers/native-fixture-contracts.cjs');
const near = (value, expected, detail) =>
  assert(Math.abs(value - expected) < 1e-8, detail + ': ' + value + ' vs ' + expected);
const fresh = (cls) => new Campaign('normal', cls, () => 0.9);
const paladin = fresh('paladin');
const ranger = fresh('ranger');
const mage = fresh('mage');

// Passives apply from the very first level, without touching raw class data.
assert.equal(R.balance.classes.paladin.hp, 120);
assert.equal(R.balance.classes.mage.power, 22);
assert.equal(R.balance.classes.ranger.speed, 320);
assert.equal(paladin.hero.maxHp, 125);
assert.equal(paladin.hero.hp, 125);
assert.equal(paladin.heroNaturalMaxHp(), 125);
near(paladin.armorEffectivenessFor(paladin.hero), 0.36, 'paladin L1 armor coefficient');
near(paladin.armorEffectivenessFor(ranger.hero), 0.35, 'nonowner armor coefficient');
assert.equal(mage.power(), 24);
assert.equal(mage.heroOtherDamageBonus(), 0);
assert.equal(ranger.heroMoveSpeed(), 323);
near(ranger.heroCooldownReduction(), 0.01, 'ranger L1 CDR');
near(ranger.basicSkillCooldown(), R.chargedSkills.first.basicSeconds * 0.99, 'L1 basic CDR');
assert.equal(paladin.heroCooldownReduction(), 0);
assert.equal(mage.heroCooldownReduction(), 0);

// No passive gets misidentified as a companion-inheritable training/gear bonus.
for (const game of [paladin, ranger, mage]) {
  setLegalExpeditionMaxRanks(game, ['sharedTraining', 'sharedStrength']);
}
assert.equal(paladin.heroOtherHpBonus(), 0);
assert.equal(paladin.companionInheritedHpBonus(), 0);
assert.equal(ranger.companionInheritedSpeedBonus(), 0);
assert.equal(mage.companionInheritedDamageBonus(), 0);

// Real level-up path, with original +25 HP plus Paladin +5 intact.
paladin.xp(paladin.xpRequired());
assert.equal(paladin.hero.level, 2);
assert.equal(paladin.hero.maxHp, 155);
assert.equal(paladin.hero.hp, 155);
near(paladin.armorEffectivenessFor(paladin.hero), 0.37, 'paladin L2 coefficient');
assert.equal(paladin.heroNaturalMaxHp(), 155);

// Full talent rank caps remain in force and are independent of the passives.
for (const game of [paladin, ranger, mage])
  for (let level = game.hero.level + 1; level <= 15; level++)
    game.xp(game.xpRequired());
assert.equal(paladin.hero.maxHp, 545);
near(paladin.armorEffectivenessFor(paladin.hero), 0.50, 'paladin L15 coefficient');
assert.equal(ranger.heroMoveSpeed(), 365);
assert.equal(mage.power(), 52);
assert.equal(mage.heroOtherDamageBonus(), 0);
ranger.hero.talents[1] = 5;
ranger.hero.talents[3] = 3;
near(ranger.heroCooldownReduction(), 0.35, 'Ranger additive talent + passive CDR');
near(ranger.basicSkillCooldown(), R.chargedSkills.first.basicSeconds * 0.65, 'Ranger basic');
near(ranger.skillCooldown(3), R.balance.skills.cooldowns[3] * 0.65, 'Ranger normal skill');
near(ranger.skillCooldown(3, true), R.cooldownBalance.chargedSeconds[3] * 0.65, 'Ranger charged');
assert.equal(ranger.heroMoveSpeed(), 488);
mage.hero.talents[0] = 5;
mage.hero.weapon = 4;
assert.equal(mage.power(), 167);
assert.equal(mage.heroOtherDamageBonus(), 70); // gear still inherited, innate mage power is not
ranger.hero.level = 100;
near(ranger.heroCooldownReduction(), 0.6, 'combined reduction cap');
assert(ranger.basicSkillCooldown() > 0);
ranger.hero.level = 15;

// Single Armor formula, including a tier-4 reforge and the 3-damage minimum.
paladin.hero.armorTier = 4;
paladin.hero.reforges['armor:4'] = true;
assert.equal(paladin.armor(), 39);
paladin.hero.hp = 100;
assert(paladin.hitParty(paladin.hero, 30));
near(paladin.hero.hp, 89.5, 'L15 Paladin damage after 39 armor at 0.50');
paladin.hero.hp = 100;
assert(paladin.hitParty(paladin.hero, 1));
near(paladin.hero.hp, 97, 'existing ordinary-hit floor');
assert.equal(ranger.armorEffectivenessFor(ranger.hero), 0.35);
assert.equal(mage.armorEffectivenessFor(mage.hero), 0.35);

// New saves restore identically; old saves receive missing Paladin HP only once.
const saved = paladin.snapshot();
const restored = Campaign.restore(saved, () => 0.9);
assert.equal(restored.hero.maxHp, 545);
assert.equal(restored.s.heroPassiveVersion, 1);
const old = JSON.parse(JSON.stringify(saved));
delete old.heroPassiveVersion;
old.hero.maxHp -= 5 * old.hero.level;
old.hero.hp -= 5 * old.hero.level;
const upgraded = Campaign.restore(old, () => 0.9);
assert.equal(upgraded.hero.maxHp, saved.hero.maxHp);
assert.equal(upgraded.hero.hp, saved.hero.hp);
assert.equal(Campaign.restore(upgraded.snapshot(), () => 0.9).hero.maxHp, saved.hero.maxHp);
const deadOld = JSON.parse(JSON.stringify(old));
deadOld.hero.hp = 0;
assert.equal(Campaign.restore(deadOld, () => 0.9).hero.hp, 0);
assert.equal(Campaign.restore(deadOld, () => 0.9).hero.maxHp, saved.hero.maxHp);

// No active/charged skill constants, skill ranks, talent limits or equipment values touched.
assert.deepEqual(R.balance.disciplines.maxRanks, [5, 5, 5, 3]);
assert.deepEqual(R.balance.equipment.bonuses.weapon, [0, 15, 35, 55, 70]);
assert.deepEqual(R.balance.equipment.bonuses.armor, [0, 5, 12, 20, 28]);
console.log('PASS innate hero passives, armor mitigation, cooldowns, talents, inheritance and saves');
