'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

const fresh = () => new Campaign('normal', 'paladin', () => 0.9);
const test = (name, run) => {
  run();
  console.log('PASS ' + name);
};

test('Temporary tonic HP remains personal even with maxed Shared Strength', () => {
  const c = fresh();
  c.hero.gold = 2000;
  c.s.rescued.archive = true;
  c.s.expeditionSkills.sharedStrength = 4;
  c.hero.maxHp += 40; // A persistent, inheritable HP bonus.
  c.hero.hp += 40;
  const reserve = c.unit('archer', 0, 0);
  reserve.active = false;
  const fallen = c.unit('soldier', 0, 0);
  fallen.active = false;
  fallen.hp = 0;
  c.s.party.push(reserve, fallen);
  c.syncCompanionLevelStats();
  assert.equal(c.heroOtherHpBonus(), 40);
  assert.equal(c.companionInheritedHpBonus(), 40);
  const before = c.s.party.map((u) => ({ hp: u.hp, maxHp: u.maxHp }));
  assert(c.purchasePreparationTonic());
  assert(c.usePreparationTonic());
  assert.equal(c.hero.tonicBonus, 16);
  assert.equal(c.hero.maxHp, 176);
  assert.equal(c.heroOtherHpBonus(), 40);
  assert.equal(c.companionInheritedHpBonus(), 40);
  assert.deepEqual(c.s.party.map((u) => ({ hp: u.hp, maxHp: u.maxHp })), before);
  assert.equal(fallen.hp, 0);

  const withTonic = c.snapshot();
  const withoutTonic = JSON.parse(JSON.stringify(withTonic));
  withoutTonic.hero.maxHp -= withoutTonic.hero.tonicBonus;
  withoutTonic.hero.hp = Math.min(withoutTonic.hero.hp, withoutTonic.hero.maxHp);
  withoutTonic.hero.tonic = false;
  withoutTonic.hero.tonicBonus = 0;
  // Restore can legitimately award pending quest XP, so compare identical restored campaigns.
  const reference = Campaign.restore(withoutTonic);
  const restored = Campaign.restore(withTonic);
  const restoredParty = (campaign) =>
    campaign.s.party.map((u) => ({ hp: u.hp, maxHp: u.maxHp }));
  assert(restored.hero.tonic);
  assert.equal(restored.companionInheritedHpBonus(), 40);
  assert.deepEqual(restoredParty(restored), restoredParty(reference));
  restored.clearTonic();
  assert.equal(restored.hero.maxHp, reference.hero.maxHp);
  assert.equal(restored.companionInheritedHpBonus(), 40);
  assert.deepEqual(restoredParty(restored), restoredParty(reference));

  c.clearTonic();
  assert(c.buyPotion('tonic', true), 'legacy tonic entry uses the same personal-effect path');
  assert.equal(c.companionInheritedHpBonus(), 40);
  assert.deepEqual(c.s.party.map((u) => ({ hp: u.hp, maxHp: u.maxHp })), before);
  c.die();
  assert(!c.hero.tonic);
  assert.equal(c.companionInheritedHpBonus(), 40);
  for (const u of c.s.party)
    assert.equal(u.maxHp, c.companionMaxHp(u.type), 'no ghost tonic HP after defeat');
});

test('Tonic never grants inherited HP at any Shared Strength rank', () => {
  for (const rank of [0, 1, 2, 3, 4]) {
    const c = fresh();
    c.s.expeditionSkills.sharedStrength = rank;
    c.hero.tonicStock = 1;
    const baseline = c.s.party.map((u) => u.maxHp);
    assert(c.usePreparationTonic());
    c.tick(0.1);
    assert.equal(c.heroOtherHpBonus(), 0, 'temporary HP excluded at rank ' + rank);
    assert.deepEqual(c.s.party.map((u) => u.maxHp), baseline);
  }
});

test('Tonic stock ceiling rejects purchase before crowns are spent', () => {
  const c = fresh();
  c.s.rescued.archive = true;
  c.hero.gold = 1000;
  c.hero.tonicStock = 10000;
  assert(!c.purchasePreparationTonic());
  assert.equal(c.hero.gold, 1000);
  assert.equal(c.preparationTonicStock(), 10000);
  assert.equal(Campaign.restore(c.snapshot()).preparationTonicStock(), 10000);
});

test('All equipment and reforge tiers replace rather than stack and update inheritance', () => {
  const c = fresh();
  c.hero.gold = 50000;
  c.s.expeditionSkills.sharedStrength = 4;
  const baselinePower = c.power();
  const baselineArmor = c.armor();
  const weapon = [0, 15, 35, 55, 70];
  const armor = [0, 5, 12, 20, 28];
  const smiths = ['crypt', 'mine', 'abyss', 'cindermaw'];
  const soldier = c.s.party.find((u) => u.type === 'soldier');
  for (let i = 0; i < smiths.length; i++) {
    const tier = i + 1, family = smiths[i];
    c.s.rescued[family] = true;
    assert(c.gear(family, 'weapon'));
    assert(c.gear(family, 'armor'));
    assert.equal(c.hero.weapon, tier);
    assert.equal(c.hero.armorTier, tier);
    assert.equal(c.power(), baselinePower + weapon[tier]);
    assert.equal(c.armor(), baselineArmor + armor[tier]);
    assert.equal(c.companionInheritedDamageBonus(), weapon[tier]);
    assert.equal(c.companionArmor('soldier'), 8 + armor[tier]);
    assert(!c.gear(family, 'weapon'), 'cannot purchase duplicate tier');
    assert(c.gear(family, 'weapon', true));
    assert(c.gear(family, 'armor', true));
    assert(!c.gear(family, 'weapon', true), 'cannot repeat weapon reforge');
    assert(!c.gear(family, 'armor', true), 'cannot repeat armor reforge');
    assert.equal(c.power(), baselinePower + weapon[tier] + 5);
    assert.equal(c.armor(), baselineArmor + armor[tier] + 3);
    assert.equal(c.companionInheritedDamageBonus(), weapon[tier] + 5);
    assert.equal(c.companionArmor('soldier'), 8 + armor[tier] + 3);
    assert.equal(c.companionAttackDamage(soldier), soldier.damage + c.hero.level * 2 + weapon[tier] + 5);
    if (i > 0) assert(!c.gear(smiths[i - 1], 'armor', true), 'old-tier reforge unavailable');
  }
  const r = Campaign.restore(c.snapshot());
  assert.equal(r.power(), baselinePower + 75);
  assert.equal(r.companionArmor('soldier'), 39);
  assert(r.hero.reforges['weapon:1'] && r.hero.reforges['weapon:4']);
});

test('Manual legacy and tier equipment selections persist across save, reload and succession', () => {
  const c = fresh();
  c.hero.gold = 10000;
  c.s.rescued.crypt = true;
  c.s.rescued.cindermaw = true;
  c.s.legacyInventory = ['Espada de Cruzado', 'Arma de las Cumbres'];
  assert(c.gear('crypt', 'weapon'));
  assert.equal(c.hero.legacyEquipped, true);
  assert(c.equipLegacy('Espada de Cruzado'));
  let r = Campaign.restore(c.snapshot());
  assert.equal(r.hero.weaponSelection, 'Espada de Cruzado');
  assert.equal(r.hero.legacyWeaponName, 'Espada de Cruzado');
  assert.equal(r.hero.legacyEquipped, true);
  assert(r.equipTierWeapon());
  r = Campaign.restore(r.snapshot());
  assert.equal(r.hero.weaponSelection, 'tier');
  assert.equal(r.hero.legacyEquipped, false, 'explicit weaker tier does not revert on load');
  assert(r.gear('cindermaw', 'weapon'));
  assert.equal(r.hero.weaponSelection, null, 'new tier acquisition resumes best-weapon selection');
  assert.equal(r.hero.legacyEquipped, false, 'tier 4 ties legacy +70 and wins');
  assert(r.equipLegacy('Espada de Cruzado'));
  r.s.challenge = { succession: true, fallen: ['paladin'], pending: true, gameOver: false };
  assert(r.successor('mage'));
  assert.equal(r.hero.weaponSelection, 'Espada de Cruzado');
  assert.equal(r.hero.legacyEquipped, true);
  const bad = r.snapshot();
  bad.hero.weaponSelection = 'not a real weapon';
  assert.throws(() => Campaign.restore(bad), /Invalid weapon selection/);
});

test('Inventory exposes active equipment, reforges and hero-only tonic stock', () => {
  const c = fresh();
  let opened;
  const ui = Menus.create({
    getGame: () => c,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions) => { opened = { title, description, actions }; },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  c.hero.tonicStock = 2;
  c.hero.weapon = 1;
  c.hero.armorTier = 1;
  c.hero.reforges['armor:1'] = true;
  ui.inventory();
  assert(opened.description.includes('Equipped weapon: tier 1'));
  assert(opened.description.includes('Armor reforge: active'));
  assert(opened.description.includes('Preparation Tonics: 2 stored · inactive'));
  assert(c.usePreparationTonic());
  ui.inventory();
  assert(opened.description.includes('ACTIVE on hero only'));
  c.s.legacyInventory = ['Arma de las Cumbres'];
  c.hero.reforges['weapon:1'] = true;
  assert(c.equipLegacy('Arma de las Cumbres'));
  ui.inventory();
  assert(opened.description.includes('Equipped weapon: Arma de las Cumbres'));
  assert(opened.description.includes('Weapon reforge: owned (inactive while legacy weapon equipped)'));
});

console.log('PASS pre-v0.9 item and equipment integrity regression cases');
