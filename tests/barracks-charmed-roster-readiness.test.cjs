'use strict';

// Draft PR #511: UI-only stress fixture. It does NOT create a playable Rogue,
// legitimate captured save, or a Charm source; the provenance is deliberately
// injected on in-memory friendly units to exercise presentation alone.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus');

function fixture(withCharmed = true, full = false) {
  const g = new Campaign('normal', 'mage', () => 0.9);
  g.s.expeditionRank = 6;
  g.zone().enemies = [];
  g.s.party = [];
  g.hero.gold = 1000;
  const b = {
    id: 'roster-readiness', kind: 'barracks', name: 'Barracks',
    x: g.hero.x + 80, y: g.hero.y, progress: 4,
    queue: 0, queueType: null, full,
    upgradeProgress: full ? 4 : 0, upgradePaid: full,
  };
  g.zone().buildings.push(b);
  if (withCharmed) {
    for (const [typeId, typeName, amount, role] of [
      ['goblin-slinger', 'Goblin Slinger', 11, 'archer'],
      ['goblin-melee', 'Goblin', 10, 'soldier'],
      ['wolf', 'Wolf', 5, 'soldier'],
    ]) {
      for (let i = 0; i < amount; i++) {
        const u = g.unit(role, g.hero.x + 40, g.hero.y + 40);
        u.active = false;
        u.charmOrigin = { typeId, typeName };
        g.s.party.push(u);
      }
    }
  }
  let opened;
  const menu = Menus.create({
    getGame: () => g, Campaign, D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) => {
      opened = { title, description, actions, back };
    },
    closeMenu() {}, recallSquad() {}, showMap() {}, finaleMenu() {},
  });
  const row = (re) => {
    const found = opened.actions.find((a) => re.test(a.label));
    assert(found, 'Missing ' + re + ' in ' + opened.title);
    return found;
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
  return { g, b, menu, row, click, company, opened: () => opened };
}

// Old three-class runs without provenance never expose a new empty collection.
{
  const f = fixture(false);
  f.company();
  assert(!f.opened().actions.some((a) => a.label === 'Charmed monsters'));
  assert(f.opened().actions.some((a) => a.label === 'Manage active group'));
  assert(f.opened().actions.some((a) => a.label === 'Boss pet collection'));
}

// Synthetic large roster: bounded lists, species-first grouping and stable pages.
{
  const f = fixture();
  f.company();
  f.click(/^Charmed monsters$/);
  assert.equal(f.opened().title, 'Charmed monsters');
  assert.equal(f.opened().actions.length, 3, '26 specimens present as 3 authored types');
  assert.match(f.row(/^Goblin Slinger/).label, /11 owned/);
  assert.match(f.row(/^Goblin ·/).label, /10 owned/);
  f.click(/^Goblin Slinger/);
  assert.equal(f.opened().actions.filter((a) => /^Add /.test(a.label)).length, 8);
  f.click(/^Next page$/);
  assert.equal(f.opened().actions.filter((a) => /^Add /.test(a.label)).length, 3);
  assert(f.opened().actions.some((a) => a.label === 'Previous page'));
  const selected = f.opened().actions.find((a) => /^Add /.test(a.label));
  assert(selected);
  selected.action(); // Rebuild the SAME type/page after the member changes state.
  assert.equal(f.opened().title, 'Charmed monsters');
  assert(f.opened().actions.some((a) => a.label === 'Previous page'));
  assert.equal(f.g.activeParty().length, 1);
  assert(f.opened().actions.some((a) => /^Rest /.test(a.label)));
  f.company();
  f.click(/^Manage active group$/);
  assert(f.opened().actions.length <= 11, 'group list stays bounded with paging');
  f.click(/^Next page$/);
  assert(f.opened().actions.some((a) => a.label === 'Previous page'));
  f.company();
  f.click(/^Name companions$/);
  assert(f.opened().actions.length <= 11, 'name list stays bounded with paging');
  assert(f.opened().actions.some((a) => a.label === 'Next page'));
}

// Basic is a local 3-deployment limit; owning/resting members is not local storage.
{
  const f = fixture(true, false);
  for (const u of f.g.s.party.slice(0, 3)) u.active = true;
  f.company();
  f.click(/^Charmed monsters$/);
  f.click(/^Goblin Slinger/);
  assert.match(f.opened().description, /Local group cap 3/);
  assert.match(f.row(/^Add /).detail, /full \(3\/3\)/);
  assert.equal(f.row(/^Add /).disabled, true);
  assert.equal(f.g.s.party.length, 26, 'Basic Barracks does not delete reserves');
}

// The same authored member can join from a Full Barracks at the future Rogue cap.
// This probes capacity only; no Rogue player class is registered in game rules.
{
  const f = fixture(true, true);
  f.g.hero.class = 'rogue';
  assert.equal(f.g.expeditionPartyCap(), 7);
  for (const u of f.g.s.party.slice(0, 6)) u.active = true;
  f.company();
  assert(!f.opened().actions.some((a) => /Recruit companions|Recruitment —/.test(a.label)),
    'Rogue cannot open conventional hiring at Full Barracks');
  f.menu.partyMenu();
  assert(!f.opened().actions.some((a) => /Recruit (?:Soldier|Ranger)|Recruitment —/.test(a.label)),
    'Captain offers care, not hiring, to Rogue');
  assert(f.opened().actions.some((a) => /Recover fallen companion/.test(a.label)),
    'Captain care remains available');
  f.company();
  f.click(/^Charmed monsters$/);
  f.click(/^Goblin Slinger/);
  assert.match(f.opened().description, /Local group cap 7/);
  f.click(/^Add /);
  assert.equal(f.g.activeParty().length, 7);
  assert.match(f.row(/^Add /).detail, /full \(7\/7\)/);
}

console.log('PASS draft Barracks UI readiness: charmed type navigation, paging, local caps and old-class isolation');
