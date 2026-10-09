'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

function menusFor(c) {
  let shown;
  const menus = Menus.create({
    getGame: () => c,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({
      label,
      action,
      detail,
      disabled,
    }),
    openMenu: (title, description, actions) => {
      shown = { title, description, actions };
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  return { menus, shown: () => shown };
}

const c = new C('normal', 'paladin', () => 0.9);
c.enter('archive');
const room = c.zone(),
  keeper = room.npcs.find((n) => n.id === 'keeper-captive'),
  ledger = room.npcs.find((n) => n.id === 'archive-ledger');
assert(keeper && keeper.kind === 'keeper' && ledger);
const olderArchive = c.snapshot();
olderArchive.zones.archive.npcs = olderArchive.zones.archive.npcs.filter(
  (n) => !['keeper-captive', 'archive-ledger'].includes(n.id),
);
const upgradedArchive = C.restore(olderArchive).s.zones.archive;
assert(upgradedArchive.npcs.some((n) => n.id === 'keeper-captive'));
assert(upgradedArchive.npcs.some((n) => n.id === 'archive-ledger'));
assert.equal(upgradedArchive.npcs.filter((n) => n.id === 'keeper-captive').length, 1);

assert(c.route(c.hero, keeper).length, 'Keeper cage reachable in the study');
assert(c.route(c.hero, ledger).length, 'Ledger reachable in dry stacks');
assert(!c.visibleNPCs().includes(keeper), 'No duplicate Keeper while his normal form fights');
const ui = menusFor(c);
ui.menus.keeper();
assert(!ui.shown(), 'Cannot bargain with active hostile Keeper');
assert(c.keeperReadLedger());
assert(c.s.keeperEvidence);
assert.equal(c.notices.filter((n) => n.text.includes('Keeper’s seal')).length, 1);
c.keeperReadLedger();
assert.equal(
  c.notices.filter((n) => n.text.includes('Keeper’s seal')).length,
  1,
  'The optional discovered reveal appears once',
);
const boss = room.enemies.find((e) => e.family === 'archive' && e.form === 'normal');
assert(boss, 'Normal boss is present');
boss.hp = 0;
c.kill(boss);
assert(c.s.normal.archive);
assert(c.keeperAvailable(), 'Normal defeat produces a captive Keeper');
assert.equal(c.visibleNPCs().filter((n) => n.id === 'keeper-captive').length, 1);
ui.menus.keeper();
assert.equal(ui.shown().title, 'The Drowned Keeper');
assert(ui.shown().description.includes('Free Neri'), 'Neri is required for the pact');
assert(!c.promiseKeeper(), 'Pact cannot begin while alchemist remains captive');
assert(c.s.keys.archive && c.rescue('archive'), 'Free the existing specialist normally');
ui.menus.keeper();
const pact = ui.shown().actions.find((a) => a.label.includes('Promise to protect'));
assert(pact);
pact.action();
assert(c.s.keeperPact, 'Cooperation recorded');
assert.equal(ui.shown().title, 'The Keeper’s shelves');
ui.shown()
  .actions.find((a) => a.label === 'Experience and discipline')
  .action();
const topic = ui.shown().actions.find((a) => a.label === 'Why old enemies teach little');
assert(topic);
topic.action();
assert(ui.shown().description.includes('100 / 75 / 40 / 10 / 0%'));
assert(ui.shown().description.includes(String(C.rules.balance.growth.xpPerLevel)));
ui.menus.keeper();
ui.shown()
  .actions.find((a) => a.label === 'The orders among the shelves')
  .action();
assert(
  ui.shown().actions.some((a) => a.label.includes('A prisoner for the Archive')),
  'Read ledger unlocks the Keeper’s account without forcing it on everyone',
);
const copy = C.restore(c.snapshot());
assert(copy.s.keeperPact && copy.s.keeperEvidence, 'Archive facts survive saves');
copy.enter('vale');
const barracks = {
  id: 'archive-counsel-base',
  kind: 'barracks',
  name: 'Barracks',
  x: 450,
  y: 450,
  progress: 4,
  full: true,
  upgradeProgress: 4,
  upgradePaid: true,
  queue: 0,
};
copy.zone().buildings.push(barracks);
const remote = menusFor(copy);
remote.menus.barracksMenu(barracks);
const specialists = remote.shown().actions.find((a) => a.label === 'Rescued specialists');
assert(specialists);
specialists.action();
assert(
  remote.shown().actions.some((a) => a.label.includes('Drowned Keeper')),
  'Keeper counsel available through existing barracks',
);
remote
  .shown()
  .actions.find((a) => a.label.includes('Drowned Keeper'))
  .action();
assert.equal(remote.shown().title, 'The Keeper’s shelves');

copy.enter('archive');
copy.s.pending.archive = { kind: 'dungeon', count: 1 };
copy.activatePending();
assert(!copy.keeperAvailable(), 'TRUE awakening makes the captive unavailable');
assert(
  !copy.visibleNPCs().some((n) => n.id === 'keeper-captive'),
  'Hostile TRUE and captive cannot coexist',
);
const activeTrue = copy
  .zone()
  .enemies.filter((e) => e.family === 'archive' && e.form === 'true' && e.hp > 0);
assert.equal(activeTrue.length, 1, 'Exactly one TRUE Keeper');
copy.enter('vale');
remote.menus.barracksMenu(barracks);
remote
  .shown()
  .actions.find((a) => a.label === 'Rescued specialists')
  .action();
assert(
  !remote.shown().actions.some((a) => a.label.includes('Drowned Keeper')),
  'No remote conversation with escaped Keeper',
);
copy.enter('archive');
const trueBoss = copy
  .zone()
  .enemies.find((e) => e.family === 'archive' && e.form === 'true' && e.hp > 0);
assert(trueBoss);
trueBoss.hp = 0;
copy.kill(trueBoss);
assert(copy.keeperAvailable(), 'After TRUE defeat, captive counsel can resume');
assert.equal(copy.visibleNPCs().filter((n) => n.id === 'keeper-captive').length, 1);
const saved = copy.snapshot();
saved.keeperPact = 'yes';
assert.throws(() => C.restore(saved), /Invalid Archive knowledge/);
console.log(
  'PASS Drowned Keeper capture, Neri bargain, optional codex, TRUE escape and save safety',
);
