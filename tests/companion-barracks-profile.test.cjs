'use strict';
// Stage A: navigate actual injected Barracks menu, inspect per-ID ability
// references, and prove Orin does not flatten a large capture roster.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const Menus = require('../src/prototype/menus');
const g = new Campaign('normal','paladin',()=>0.9);
let opened;
const back = () => {};
const catalog = Menus.create({
  getGame: () => g,
  Campaign,
  D: Campaign.data,
  action: (label, callback, detail = '', disabled = false) =>
    ({ label, action: callback, detail, disabled }),
  openMenu: (title, description, actions, goBack) => {
    opened = { title, description, actions, back: goBack };
  },
  closeMenu: back,
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
});
const choose = (fragment) => {
  const entry = opened.actions.find((a) => a.label.includes(fragment) && !a.disabled);
  assert(entry, fragment + ' should be selectable on ' + opened.title);
  entry.action();
};
const b = { id: 'test-barracks', kind: 'barracks', x: 500, y: 500,
  progress: 4, full: true };
g.zone().buildings.push(b);
g.s.party = [
  g.unit('soldier', 550, 520),
  g.unit('archer', 560, 520),
  g.unit('pet', 580, 520, 'thorn'),
];
g.s.party[0].masteryPoints = 10;
catalog.barracksMenu(b, back);
choose('Company');
choose('Manage active group');
assert(opened.actions.filter((a) => a.label.startsWith('Inspect · ')).length >= 3);
choose('Soldier');
assert.match(opened.title, /Companion/);
assert.match(opened.description, /Mastery 2/);
assert.match(opened.description, /Individual ID/);
assert(opened.actions.some((a) => a.label === 'Abilities & mastery'));
choose('Abilities & mastery');
assert.match(opened.title, /Abilities/);
assert(opened.actions.some((a) => a.label.includes('Power Strike')));
assert(opened.actions.some((a) => a.label.includes('Holy Cleave')));
assert.match(opened.description, /18 total points/);
assert(opened.actions.every((a) => a.disabled), 'read-only skill entries are not purchases');
catalog.barracksMenu(b, back);
choose('Company');
choose('Manage active group');
choose('Thornpup');
choose('Abilities & mastery');
assert(opened.actions.some((a) => a.label.includes('Dynamic Entry')));
assert(opened.actions.some((a) => a.label.includes('Tripwire')));
// Captures retain both a save-backed individual provenance record and ID.
g.s.charmCaptures = {};
const captured = [];
for (let i = 0; i < 19; i++) {
  const u = g.unit('soldier', 600 + i, 520);
  const origin = {
    typeId: 'enemy:goblin:melee', species: 'goblin', role: 'soldier',
    typeName: 'Goblin',
    sourceEnemyId: 'enemy-' + (2000 + i), sourceZone: g.zoneId,
  };
  u.charmOrigin = { ...origin };
  u.name = origin.typeName;
  g.s.party.push(u);
  g.s.charmCaptures[u.id] = { ...origin };
  assert(g.isCharmedCompanion(u), 'authentic individual capture');
  captured.push(u);
}
catalog.barracksMenu(b, back);
choose('Company');
choose('Charmed monsters');
assert.match(opened.title, /Charmed monsters/);
choose('Goblin');
choose('Inspect');
choose('Abilities & mastery');
assert(opened.actions.some((a) => a.label.includes('Dust Entrainment')));
assert(opened.actions.some((a) => a.label.includes('Ringleader signature')));
assert(opened.actions.some((a) => a.label.includes('Native')));
g.s.rescued.ridge = true;
g.hero.gold = 500;
catalog.teacher({ family: 'ridge', name: 'Orin' }, back);
choose('Charmed Ringleader Training');
assert.equal(opened.title, 'Orin · Ringleader Training');
assert.equal(opened.actions.filter((a) => a.label.includes(' · Mastery ')).length, 8);
choose('Next page');
assert(opened.actions.some((a) => a.label === 'Previous page'));
assert(opened.actions.some((a) => a.label === 'Next page'));
choose('Next page');
assert.equal(opened.actions.filter((a) => a.label.includes(' · Mastery ')).length, 3);
const target = captured.at(-1);
// Choose by visible final page slot; the preview must still refer to that ID.
const targetIndex = g.s.party.indexOf(target) + 1;
const picked = opened.actions.find((a) => a.label.includes(' #' + targetIndex + ' · Mastery '));
assert(picked && !picked.disabled);
picked.action();
assert.match(opened.description, /Orin will train this individual monster/);
assert.equal(g.hero.gold, 500, 'preview does not charge');
assert.equal(target.charmRingleaderTrained, false);
console.log('PASS Issue #620 real Barracks profile navigation and 19-capture Orin pagination');
