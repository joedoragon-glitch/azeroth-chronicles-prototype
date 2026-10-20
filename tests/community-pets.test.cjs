'use strict';
// Authored during the no-testing phase. First execution requires owner authorization.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Audio = require('../src/prototype/audio.js');
const Menus = require('../src/prototype/menus.js');
const R = Campaign.rules;
function arena(family = 'thorn') {
  const g = new Campaign('normal', 'paladin', () => 0.9);
  g.s.mercyTime = 0;
  g.zone().props = [];
  g.zone().npcs = [];
  g.zone().enemies = [];
  g.zone().buildings = [
    {
      id: 'pet-base',
      kind: 'barracks',
      x: 500,
      y: 500,
      progress: 4,
      queue: 0,
      queueType: null,
      full: true,
    },
  ];
  Object.assign(g.hero, { x: 500, y: 500, gold: 1000 });
  g.s.expeditionRank = 6;
  g.s.party = [];
  g.s.normal[family] = true;
  g.s.true[family] = true;
  if (family === 'darklord') g.s.phase = 'awakening';
  g.s.companionCombatTraining = 2;
  return g;
}
function target(g, x = 580, y = 500) {
  const e = g.makeEnemy(
    { species: 'goblin', name: 'Pet target', level: 1, hp: 10000, damage: 0, xp: 0, gold: 0 },
    { x, y },
  );
  g.zone().enemies.push(e);
  g.engage(e);
  return e;
}
function advance(g, dt) {
  g.advancePartyChargeClock(dt);
  g.updateParty(dt);
  g.resolveCompanionCharges();
}
assert.equal(Campaign.data.bosses.length, 11);
for (const family of ['not-a-boss', 'constructor', '__proto__']) {
  const g = arena();
  assert.equal(g.petDefinition(family), null);
  assert.throws(() => g.unit('pet', 500, 500, family));
}
for (const boss of Campaign.data.bosses) {
  const family = boss.id,
    g = arena(family),
    crowns = g.hero.gold;
  assert(g.recruitPet(family, 'pet-base'), family + ' recruits from historical TRUE entitlement');
  const u = g.s.party[0],
    id = u.id;
  assert.equal(u.type, 'pet');
  assert.equal(u.petFamily, family);
  assert.equal(g.hero.gold, crowns);
  assert(!g.recruitPet(family, 'pet-base'), 'only one individual');
  assert(!g.availableLabor().includes(u));
  assert(!g.availableRangers('health').includes(u));
  const saved = g.snapshot();
  delete saved.victories;
  const restored = Campaign.restore(saved);
  assert(restored.petUnlocked(family), 's.true survives missing detailed victory records');
  assert.equal(restored.s.party[0].petFamily, family);
  assert.equal(restored.s.party[0].name, R.petCompanions[family].name);
  const bad = g.snapshot();
  bad.party.push({ ...bad.party[0], id: 'different-pet-id', active: false });
  assert.throws(() => Campaign.validate(bad), /duplicate boss pet/);
  const badFamily = g.snapshot();
  badFamily.party[0].petFamily = 'not-a-boss';
  assert.throws(() => Campaign.validate(badFamily));
  const badValue = g.snapshot();
  badValue.party[0].skill1Cd = NaN;
  assert.throws(() => Campaign.validate(badValue));
  u.hp = 0;
  assert(g.recover());
  assert.equal(u.id, id);
  assert.equal(u.petFamily, family);
  assert.equal(u.hp, u.maxHp);
  assert(g.restCompanion(id));
  u.hp = 1;
  assert(!g.dismissCompanion(id), 'resting pet cannot be discarded for a fresh heal');
  assert(!g.recruitPet(family, 'pet-base'));
  assert.equal(u.hp, 1);
  assert(g.activateCompanion(id, 'pet-base'));
  u.hp = u.maxHp;
  const e = target(g, 550);
  const before = e.hp;
  assert(g.companionUseFirstSkill(u, e), family + ' first skill');
  g.updateProjectiles(0.2); // Ranged single-target pet skills resolve on physical contact.
  assert(e.hp < before);
  assert.equal(u.skill1Cd, R.balance.companions.petFirstCooldown);
  assert(!g.s.hazards.length);
  assert.equal(g.zone().enemies.length, 1, 'no summoned pets or enemies');
  u.skillGlobalCd = 0;
  const chargeHp = e.hp;
  assert(g.companionUseSecondSkill(u, e), family + ' charged second');
  advance(g, 0.3);
  assert.equal(e.hp, chargeHp, 'no early release');
  advance(g, 0.35);
  assert(e.hp < chargeHp, 'release after shared 0.65s hold');
  assert.equal(u.skill2Cd, R.balance.companions.petSecondCooldown);
  assert(!g.partyChargeState(u));
  u.skill2Cd = 0;
  u.skillGlobalCd = 0;
  u.wardUntil = 0;
  assert(g.companionUseSecondSkill(u, e));
  assert(g.hitParty(u, Math.max(6, u.maxHp * 0.07) + 1, 0, null, true));
  const afterInterrupt = e.hp;
  advance(g, 0.65);
  assert.equal(e.hp, afterInterrupt);
  assert.equal(u.skill2Cd, 0);
  // Fallen and benched units cannot leak a pending release.
  g.advancePartyChargeClock(1);
  u.skillGlobalCd = 0;
  assert(g.companionUseSecondSkill(u, e));
  u.hp = 0;
  advance(g, 0.65);
  assert.equal(e.hp, afterInterrupt);
  assert(!g.partyChargeState(u));
}
for (const { id: family } of Campaign.data.bosses) {
  const g = arena(family);
  g.s.party = [];
  delete g.s.true[family];
  assert(!g.recruitPet(family, 'pet-base'), 'Normal wins do not unlock a pet');
  assert(!g.train('pet-base', 'pet'), 'troop queue cannot silently create a Soldier');
  const e = g.bossEnemy(g.boss(family), 'true', { x: 580, y: 500 });
  g.zone().enemies = [e];
  e.hp = 0;
  g.kill(e);
  assert(g.petUnlocked(family));
  assert.equal(g.notices.filter((n) => JSON.stringify(n).includes('BOSS PET UNLOCKED')).length, 1);
  const again = g.bossEnemy(g.boss(family), 'true', { x: 580, y: 500 });
  g.zone().enemies.push(again);
  again.hp = 0;
  g.kill(again);
  assert.equal(g.notices.filter((n) => JSON.stringify(n).includes('BOSS PET UNLOCKED')).length, 1);
  const dev = new Campaign('developer', 'paladin', () => 0.9);
  dev.enter(g.boss(family).region);
  const summoned = dev.developerSummon('boss:' + family + ':true');
  assert(summoned, family + ' authentic developer spawn');
  summoned.hp = 0;
  dev.kill(summoned);
  assert(!dev.petUnlocked(family));
  assert(!dev.notices.some((n) => JSON.stringify(n).includes('BOSS PET UNLOCKED')));
}
{
  const g = arena(),
    unlocked = Campaign.data.bosses.slice(0, 6);
  for (const b of unlocked) {
    g.s.normal[b.id] = true;
    g.s.true[b.id] = true;
    assert(g.recruitPet(b.id, 'pet-base'));
  }
  const slots = g.s.party.map((u) => g.partyFormationOffset(u));
  assert.equal(
    new Set(slots.map(JSON.stringify)).size,
    6,
    'distinct mixed-pet formation positions',
  );
  g.s.normal.warlord = g.s.true.warlord = true;
  assert(g.recruitPet('warlord', 'pet-base'));
  assert.equal(g.activeParty().length, 6);
  assert.equal(g.s.party.at(-1).active, false);
  const hp = g.s.party[0].maxHp;
  g.hero.level++;
  g.syncCompanionLevelStats();
  assert(g.s.party[0].maxHp > hp);
  assert.equal(g.s.party[0].hp, g.s.party[0].maxHp);
}
{
  let g = arena(),
    opened;
  const menu = Menus.create({
    getGame: () => g,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      opened = { title, description, actions, back };
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  menu.barracksMenu(g.zone().buildings[0]);
  opened.actions.find((a) => a.label === 'Company').action();
  opened.actions.find((a) => a.label === 'Boss pet collection').action();
  assert.equal(opened.actions.length, 11);
  assert(opened.actions[0].label.includes('Recruitable'));
  opened.actions[0].action();
  const old = g,
    recruit = opened.actions.find((a) => a.label === 'Recruit · FREE');
  g = arena();
  recruit.action();
  assert.equal(old.s.party.length, 0, 'menu callback uses current campaign');
  assert.equal(g.s.party.length, 1);
}
const audio = new Audio();
{
  const g = arena(),
    b = g.zone().buildings[0];
  g.s.party = Array.from({ length: 199 }, () => ({
    ...g.unit('soldier', 500, 500),
    active: false,
  }));
  b.queue = 1;
  b.queueType = 'archer';
  assert(!g.recruitPet('thorn', b.id), 'troop reservation prevents a 201st roster admission');
  b.queue = 0;
  b.queueType = null;
  assert(g.recruitPet('thorn', b.id));
  assert.equal(g.rosterCount(), 200);
  g.s.normal.crypt = g.s.true.crypt = true;
  assert(!g.recruitPet('crypt', b.id), 'pet admission respects the shared roster ceiling');
  assert.equal(Campaign.restore(g.snapshot()).s.party.length, 200);
}
assert(audio.supportsType('petSkill'));
assert.equal(audio.soundKind({ type: 'petSkill' }), null);
console.log(
  'PASS Community pets: all eleven lifecycle/skills, historical entitlement, slots, recovery, charge, menu and audio contracts',
);
