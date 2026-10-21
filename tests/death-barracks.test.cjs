'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Menus = require('../src/prototype/menus.js');

let nextId = 70000;
function barracks(c, zone, { full = false, progress = 4 } = {}) {
  c.enter(zone);
  const b = {
    id: 'barracks-' + nextId++,
    kind: 'barracks',
    name: 'Barracks',
    theme: zone,
    x: 800,
    y: 750,
    progress,
    queue: 0,
    queueType: null,
    full,
    upgradeProgress: full ? 4 : 0,
    upgradePaid: full,
  };
  c.zone().buildings.push(b);
  return b;
}
function carrying(c, gold = 100) {
  c.hero.gold = gold;
  return c.applyDeathPenalty();
}

for (const mode of ['normal', 'nightmare']) {
  const c = new Campaign(mode);
  assert.equal(c.deathPenaltyFraction(), 0.2);
  assert.equal(carrying(c, 103), 21, mode + ' 20% rounding');
  const inProgress = barracks(c, 'vale', { progress: 3 });
  assert.equal(carrying(c), 20, 'unfinished barracks do not protect');
  assert.equal(c.setBarracksRespawn(inProgress.id), false);
  inProgress.progress = 4;
  assert.equal(c.deathPenaltyFraction(), 0.15);
  assert.equal(carrying(c, 101), 16, 'Basic gives 15% rounded up');
  c.enter('march');
  assert.equal(carrying(c), 20, 'other region not protected');
  for (const dungeon of Campaign.data.bosses.filter(
    (b) => b.kind === 'dungeon' && b.region === 'vale',
  )) {
    c.enter(dungeon.id);
    assert.equal(carrying(c), 15, 'regional dungeon gets Basic protection');
  }
  for (const interior of [
    ...Campaign.rules.supplyRooms,
    ...(Campaign.rules.sideDungeons || []),
  ].filter((d) => d.region === 'vale')) {
    c.enter(interior.id);
    assert.equal(carrying(c), 15, 'regional interior gets Basic protection');
  }
  inProgress.full = true;
  c.enter('vale');
  assert.equal(carrying(c, 101), 6, 'Full reduces loss to 5% rounded up');
  const second = barracks(c, 'vale');
  assert.equal(c.deathPenaltyFraction(), 0.05, 'the best of multiple completed barracks wins');
  inProgress.full = false;
  assert.equal(c.deathPenaltyFraction(), 0.15, 'one Basic is sufficient; no stacking');
  assert.equal(c.setBarracksRespawn(second.id), true);
  assert.deepEqual(c.s.barracksRespawn, { zone: 'vale', id: second.id });
  const restored = Campaign.restore(c.snapshot());
  assert.deepEqual(
    restored.s.barracksRespawn,
    c.s.barracksRespawn,
    'selection survives v4 save and load',
  );
  restored.enter('crypt');
  assert.equal(
    restored.selectedBarracksRespawn().zone,
    'vale',
    'regional dungeon retains the camp',
  );
  restored.die();
  assert.equal(restored.zoneId, 'vale', 'local dungeon recovers at the selected camp');
  assert(
    Math.hypot(restored.hero.x - second.x, restored.hero.y - second.y) < 115,
    'local camp arrival stays in interaction range',
  );
  assert.equal(restored.clearBarracksRespawn(), true);
  assert.equal(restored.setBarracksRespawn(second.id), true);
  restored.enter('march');
  assert.equal(restored.s.barracksRespawn, null, 'crossing region clears the prior camp choice');
  assert.equal(
    restored.s.refugeSite.zone,
    'march',
    'new regional refuge activates immediately, without a town tick',
  );
  restored.hero.gold = 100;
  restored.hero.hp = 0;
  restored.die();
  assert.equal(restored.hero.gold, 80, 'crown penalty uses death region, not chosen spawn region');
  assert.equal(restored.zoneId, 'march', 'recovery never returns to the prior region');
  assert.equal(restored.clearBarracksRespawn(), false);
  assert.equal(restored.s.barracksRespawn, null);
  restored.enter('march');
  restored.die();
  assert.equal(restored.zoneId, restored.s.refuge, 'reverted selection uses existing refuge');
  assert.equal(restored.clearBarracksRespawn(), false);
  assert.equal(restored.setBarracksRespawn('missing-id'), false);
  const local = barracks(restored, 'march');
  assert(restored.setBarracksRespawn(local.id));
  for (const interior of ['archive', 'supply-march']) {
    restored.enter(interior);
    restored.die();
    assert.equal(restored.zoneId, 'march', interior + ' recovers in its own region');
    assert.equal(
      restored.s.barracksRespawn.id,
      local.id,
      'local camp survives interior entry and recovery',
    );
  }
  const foreign = c.snapshot();
  foreign.zone = 'archive';
  foreign.zones.archive ||= (() => {
    const tmp = new Campaign(mode);
    tmp.enter('archive');
    return tmp.zone();
  })();
  const oldRun = Campaign.restore(foreign);
  assert.equal(
    oldRun.selectedBarracksRespawn(),
    null,
    'existing cross-region save cannot activate a foreign camp',
  );
  oldRun.die();
  assert.equal(oldRun.zoneId, 'march', 'old save with foreign camp/refuge recovers locally');
  assert.equal(oldRun.s.barracksRespawn, null);
  restored.clearBarracksRespawn();
  restored.setRefuge('march', 'minor');
  restored.enter('archive');
  restored.die();
  assert.equal(
    restored.s.refugeSite.id,
    'minor',
    'local minor refuge is retained through dungeon recovery',
  );
  const legacy = c.snapshot();
  delete legacy.barracksRespawn;
  assert.equal(
    Campaign.restore(legacy).s.barracksRespawn,
    undefined,
    'old v4 saves remain supported',
  );
  const stale = c.snapshot();
  stale.zones.vale.buildings = stale.zones.vale.buildings.filter((b) => b.id !== second.id);
  assert.equal(
    Campaign.restore(stale).s.barracksRespawn,
    null,
    'removed camp falls back to refuge',
  );
  for (const bad of [{ zone: 'unknown', id: second.id }, { zone: 'vale', id: 123 }, 'vale']) {
    const data = c.snapshot();
    data.barracksRespawn = bad;
    assert.throws(() => Campaign.restore(data), 'malformed selection rejected');
  }
}

const view = new Campaign('normal');
const camp = barracks(view, 'vale');
let menu;
const ui = Menus.create({
  getGame: () => view,
  Campaign,
  D: Campaign.data,
  action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
  openMenu: (title, description, actions) => {
    menu = { title, description, actions };
  },
  closeMenu() {},
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
});
ui.barracksMenu(camp);
let choice = menu.actions.find((a) => a.label.includes('death recovery point'));
assert(choice && !choice.disabled, 'completed Basic menu offers respawn selection');
choice.action();
assert.equal(view.s.barracksRespawn.id, camp.id);
choice = menu.actions.find((a) => a.label.includes('Return death recovery to refuge'));
assert(choice && !choice.disabled, 'menu shows an explicit way back to refuge');
choice.action();
assert.equal(view.s.barracksRespawn, null);
camp.full = true;
ui.barracksMenu(camp);
assert(
  menu.actions.some((a) => a.label.includes('death recovery point')),
  'Full Barracks also offer choice',
);

for (const mode of ['normal', 'nightmare']) {
  const c = new Campaign(mode, 'paladin', () => 0.9, { succession: true });
  const b = barracks(c, 'vale', { full: true });
  assert.equal(c.setBarracksRespawn(b.id), false, 'Succession cannot select a respawn point');
  let successionMenu;
  const successionUi = Menus.create({
    getGame: () => c,
    Campaign,
    D: Campaign.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions) => {
      successionMenu = { title, description, actions };
    },
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  successionUi.barracksMenu(b);
  assert(!successionMenu.actions.some((a) => a.label.includes('death recovery point')));
  assert(successionMenu.description.includes('Succession deaths never cost crowns'));
  b.full = false;
  successionUi.barracksMenu(b);
  assert(successionMenu.description.includes('Succession deaths never cost crowns'));
  b.full = true;
  assert.equal(
    c.deathPenaltyFraction(),
    0,
    'Succession ignores completed Full Barracks for crowns',
  );
  assert.equal(carrying(c, 101), 0);
  c.hero.gold = 101;
  c.die();
  assert.equal(c.hero.gold, 101, 'first class death preserves all crowns');
  assert(c.successor('mage'));
  c.die();
  assert.equal(c.hero.gold, 101, 'second class death preserves all crowns');
  c.die();
  assert.equal(c.hero.gold, 101, 'terminal third class death also preserves all crowns');
  assert(c.s.challenge.gameOver);
  const forged = c.snapshot();
  forged.barracksRespawn = { zone: 'vale', id: b.id };
  assert.throws(
    () => Campaign.restore(forged),
    'Succession cannot load a Barracks respawn selection',
  );
  ui.barracksMenu(camp);
}
console.log(
  'PASS regional barracks death penalties, dungeon coverage, opt-in recovery point, saves, menus and Succession immunity',
);
