'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

function menusFor(c, getGame = () => c) {
  let shown;
  const menus = Menus.create({
    getGame,
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
// Availability remains exclusive even for a restored/inconsistent cached normal actor.
const duplicate = C.restore(copy.snapshot());
const liveNormal = duplicate.bossEnemy(duplicate.boss('archive'), 'normal', { x: 1100, y: 1100 });
duplicate.zone().enemies.push(liveNormal);
assert(!duplicate.keeperAvailable(), 'Any living Keeper blocks captive and remote counsel');
liveNormal.hp = 0;
assert(duplicate.keeperAvailable());
duplicate.s.pending.archive = { kind: 'dungeon', count: 1, active: false };
assert(duplicate.keeperAvailable(), 'Inactive later TRUE roll permits the existing bargain');
// Exercise the real early-TRUE roll rather than only manually scheduling Awakening.
const early = new C('normal', 'paladin', () => 0.1);
early.enter('archive');
const earlyNormal = early.zone().enemies.find((e) => e.type === 'boss' && e.family === 'archive');
earlyNormal.hp = 0;
early.kill(earlyNormal);
assert(
  early.s.earlyRoll.archive && early.s.pending.archive,
  'Normal victory records the early TRUE roll',
);
assert(early.keeperAvailable(), 'An unactivated early return does not prevent the bargain');
early.enter('march');
early.enter('archive');
assert(early.s.pending.archive?.active, 'Reentry activates the rolled early TRUE return');
assert(
  !early.visibleNPCs().some((n) => n.kind === 'keeper'),
  'Early TRUE escape hides the captive',
);
const earlyTrue = early
  .zone()
  .enemies.find((e) => e.type === 'boss' && e.form === 'true' && e.hp > 0);
assert(earlyTrue);
earlyTrue.hp = 0;
early.kill(earlyTrue);
assert(early.keeperAvailable(), 'Early TRUE defeat permits recapture');
console.log(
  'PASS Drowned Keeper capture, Neri bargain, optional codex, TRUE escape and save safety',
);

// Exercise the actual gates without granting knowledge through defeat or rescue.
for (const mode of ['normal', 'nightmare']) {
  for (const roll of [0.1, 0.9]) {
    const run = new C(mode, 'mage', () => roll);
    run.enter('archive');
    const normal = run.zone().enemies.find((e) => e.type === 'boss' && e.family === 'archive');
    assert(!run.rescue('archive'));
    assert(!run.promiseKeeper());
    normal.hp = 0;
    run.kill(normal);
    assert(!run.s.keeperEvidence && !run.s.keeperPact);
    assert(run.rescue('archive'));
    assert(!run.s.keeperEvidence && !run.s.keeperPact);
    const rewards = { gold: run.hero.gold, xp: run.hero.xp, paid: { ...run.s.paid } };
    assert(run.promiseKeeper());
    assert(!run.promiseKeeper(), 'The bargain cannot repeat');
    assert(!run.s.keeperEvidence, 'Cooperation is independent of the unread ledger');
    assert.deepEqual({ gold: run.hero.gold, xp: run.hero.xp, paid: run.s.paid }, rewards);
    const reload = C.restore(run.snapshot(), () => roll);
    assert(reload.keeperAvailable(), 'Reload preserves the pre-escape bargain');
    assert(reload.s.keeperPact);
    reload.victory('darklord', 'normal');
    reload.victory('darklord', 'true');
    reload.awaken();
    reload.activatePending();
    const escaped = C.restore(reload.snapshot(), () => roll);
    assert(!escaped.keeperAvailable() && escaped.s.keeperPact);
    assert(!escaped.visibleNPCs().some((n) => n.kind === 'keeper'));
    const hostile = escaped
      .zone()
      .enemies.find((e) => e.family === 'archive' && e.form === 'true' && e.hp > 0);
    assert(hostile);
    hostile.hp = 0;
    escaped.kill(hostile);
    const recaptured = C.restore(escaped.snapshot(), () => roll);
    assert(recaptured.keeperAvailable() && recaptured.s.keeperPact);
    assert(!recaptured.s.keeperEvidence);
    for (const full of [false, true]) {
      recaptured.enter('vale');
      const base = { ...barracks, full };
      recaptured.zone().buildings = recaptured.zone().buildings.filter((b) => b.id !== base.id);
      recaptured.zone().buildings.push(base);
      const service = menusFor(recaptured);
      service.menus.barracksMenu(base);
      service
        .shown()
        .actions.find((a) => a.label === 'Rescued specialists')
        .action();
      assert(service.shown().actions.some((a) => a.label.includes('Drowned Keeper')));
    }
  }
}

// Delayed buttons must not make promises for an old run or speak to an escaped Keeper.
const oldRun = C.restore(c.snapshot());
delete oldRun.s.keeperPact;
let currentRun = oldRun;
const delayed = menusFor(oldRun, () => currentRun);
delayed.menus.keeper();
const oldPromise = delayed.shown().actions.find((a) => a.label.includes('Promise'));
currentRun = C.restore(oldRun.snapshot());
oldPromise.action();
assert(!oldRun.s.keeperPact && !currentRun.s.keeperPact);
currentRun.promiseKeeper();
delayed.menus.keeper();
const oldShelf = delayed.shown().actions.find((a) => a.label === 'Your skills');
currentRun.s.pending.archive = { kind: 'dungeon', count: 1, active: true };
oldShelf.action();
assert.equal(delayed.shown().title, 'The Keeper’s shelves', 'A stale shelf must not open');
delete currentRun.s.pending.archive;
delayed.menus.keeper();
delayed
  .shown()
  .actions.find((a) => a.label === 'Your skills')
  .action();
const oldTopic = delayed.shown().actions[0];
currentRun.s.pending.archive = { kind: 'dungeon', count: 1, active: true };
oldTopic.action();
assert.equal(delayed.shown().title, 'Your skills', 'A stale answer must not open');
console.log(
  'PASS Normal/Nightmare unlock matrix, read-independent cooperation, real Awakening, reload/recapture, both Barracks and stale dialogue guards',
);
