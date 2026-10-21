'use strict';
const assert = require('node:assert/strict'),
  Campaign = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');

function fixture() {
  const g = new Campaign('normal', 'mage');
  g.s.expeditionRank = 3;
  g.zone().enemies = [];
  g.hero.gold = 1000;
  const b = {
    id: 'barracks-feedback',
    kind: 'barracks',
    name: 'Barracks',
    x: g.hero.x + 80,
    y: g.hero.y,
    progress: 4,
    queue: 0,
    queueType: null,
    full: false,
    upgradeProgress: 0,
    upgradePaid: false,
  };
  g.zone().buildings.push(b);
  g.s.party = ['soldier', 'archer', 'soldier'].map((t) => g.unit(t, g.hero.x + 40, g.hero.y));
  const family = Campaign.data.bosses[0].id;
  g.s.normal[family] = g.s.true[family] = true;
  let opened;
  const menu = Menus.create({
    getGame: () => g,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  const row = (re) => {
    const a = opened.actions.find((a) => re.test(a.label));
    assert(a, 'Missing ' + re + ' in ' + opened.title);
    return a;
  };
  const click = (re) => {
    const a = row(re);
    assert(!a.disabled, a.detail);
    a.action();
  };
  const company = () => {
    menu.barracksMenu(b);
    click(/^Company$/);
  };
  const pet = () => {
    company();
    click(/^Boss pet collection$/);
    click(new RegExp(g.petDefinition(family).name));
  };
  return { g, b, family, menu, row, click, company, pet, opened: () => opened };
}

function denied(g, action, expected) {
  const before = g.snapshot();
  assert.equal(action(), false);
  assert.match(g.messages.at(-1), expected);
  assert.deepEqual(g.snapshot(), before, 'denial must not change party, crowns, orders or queue');
}

for (const type of ['pet', 'soldier', 'archer']) {
  const { g, b, family, click, company, pet, opened } = fixture();
  company();
  click(/^Manage active group$/);
  const rested = g.s.party[0];
  click(/^Rest /);
  assert.equal(g.activeParty().length, 2);
  assert.equal(rested.active, false);
  if (type === 'pet') {
    pet();
    click(/^Recruit · FREE$/);
  } else {
    opened().back();
    click(/^Recruit companions$/);
    click(new RegExp('^Recruit ' + (type === 'soldier' ? 'Soldier' : 'Ranger') + ' ·'));
    g.updateParty(4.01);
  }
  assert.equal(g.activeParty().length, 3);
  assert.equal(g.s.party.at(-1).type, type);
  assert.equal(g.s.party.at(-1).active, true);
  assert.equal(b.full, false);
  const restored = Campaign.restore(g.snapshot());
  assert.equal(restored.activeParty().length, 3);
  assert.equal(restored.s.party[0].active, false);
}

{
  const { g, b, family, menu, row, click, company, pet } = fixture();
  menu.partyMenu();
  assert.match(row(/^Town recruitment limit/).detail, /including reserves.*Basic or Full Barracks/);
  assert(g.restCompanion(g.s.party[0].id));
  denied(g, () => g.recruit('soldier'), /town.*including reserves/i);
  // The town hiring cap must not disable hiring at a Basic Barracks.
  company();
  click(/^Recruit companions$/);
  assert.equal(row(/^Recruit Soldier/).disabled, false);
  const enemy = g.makeEnemy(
    { species: 'goblin', name: 'Nearby threat', level: 1, hp: 100, damage: 0, xp: 0, gold: 0 },
    { x: g.hero.x + 50, y: g.hero.y },
  );
  enemy.aggro = true;
  g.zone().enemies = [enemy];
  company();
  click(/^Manage active group$/);
  assert.match(row(/^Rest /).detail, /nearby enemies are engaged/);
  assert.equal(row(/^Rest /).disabled, true);
  assert.match(row(/^Add /).detail, /nearby enemies are engaged/);
  denied(g, () => g.restCompanion(g.s.party[1].id), /nearby enemies are engaged/);
  denied(g, () => g.activateCompanion(g.s.party[0].id, b.id), /nearby enemies are engaged/);
  pet();
  assert.match(row(/^Recruit · FREE$/).detail, /nearby enemies are engaged/);
  denied(g, () => g.recruitPet(family, b.id), /nearby enemies are engaged/);
  enemy.aggro = false;
  pet();
  assert.equal(row(/^Recruit · FREE$/).disabled, false);
  // Revalidate a formerly available menu action when the state changes.
  const stale = row(/^Recruit · FREE$/);
  enemy.aggro = true;
  denied(
    g,
    () => {
      stale.action();
      return g.s.party.some((u) => u.type === 'pet');
    },
    /nearby enemies are engaged/,
  );
}

{
  const { g, b, family, row, click, company, pet } = fixture();
  assert(g.recruitPet(family, b.id)); // Full group hires into reserve, not a failure.
  const u = g.s.party.at(-1);
  assert.equal(u.active, false);
  company();
  click(/^Manage active group$/);
  assert.match(row(/^Add /).detail, /full \(3\/3\).*Rest 1 active member/);
  assert.equal(row(/^Add /).disabled, true);
  denied(g, () => g.activateCompanion(u.id, b.id), /full \(3\/3\)/);
  u.hp = 0;
  pet();
  assert.match(row(/^Recover through/).detail, /fallen.*Recover/);
  denied(g, () => g.activateCompanion(u.id, b.id), /fallen/);
  g.s.expeditionRank = 6;
  u.hp = u.maxHp;
  g.s.party.unshift(g.unit('soldier', g.hero.x, g.hero.y));
  assert.match(g.companionActivationReason(u.id, b.id), /full \(4\/3\).*Rest 2 active members/);
}

{
  const { g, b, family, row, click, company, pet } = fixture();
  function recruitment() {
    company();
    click(/^Recruit companions$/);
    return row(/^Recruit Soldier/);
  }
  g.hero.gold = 0;
  assert.match(recruitment().detail, /Not enough crowns/);
  denied(g, () => g.train(b.id), /Not enough crowns/);
  g.hero.gold = 1000;
  b.queue = 2;
  b.queueType = 'soldier';
  assert.match(recruitment().detail, /already training/);
  denied(g, () => g.train(b.id), /already training/);
  b.queue = 0;
  b.queueType = null;
  g.s.party = Array.from({ length: 200 }, () => g.unit('soldier', g.hero.x, g.hero.y));
  assert.match(recruitment().detail, /Company limit reached/);
  denied(g, () => g.train(b.id), /Company limit reached/);
  pet();
  assert.match(row(/^Recruit · FREE$/).detail, /Company limit reached/);
  denied(g, () => g.recruitPet(family, b.id), /Company limit reached/);
  g.s.party = [];
  g.s.true[family] = false;
  pet();
  assert.match(row(/^Defeat TRUE/).detail, /Defeat TRUE/);
  denied(g, () => g.recruitPet(family, b.id), /Defeat TRUE/);
  g.s.expeditionRank = 1;
  denied(g, () => g.train(b.id), /Expedition 2/);
  g.s.expeditionRank = 3;
  b.progress = 3;
  denied(g, () => g.train(b.id), /Finish building/);
  denied(g, () => g.recruitPet(family, b.id), /completed local Barracks/);
  denied(g, () => g.train(), /no longer available/);
}
console.log(
  'PASS roster denial reasons, visible menu explanations, stale-action revalidation and Basic Barracks rest/recruit/save flow',
);
