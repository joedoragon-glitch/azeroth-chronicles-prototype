'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
function fixture(mode = 'normal') {
  const g = new C(mode, 'mage', () => 0.5);
  g.zone().enemies = [];
  g.hero.gold = 0;
  const b = {
    id: 'care-base',
    kind: 'barracks',
    name: 'Barracks',
    x: 600,
    y: 550,
    progress: 4,
    queue: 0,
    queueType: null,
    full: false,
    upgradeProgress: 0,
    upgradePaid: false,
  };
  g.zone().buildings.push(b);
  g.s.party[0].customName = 'Iris';
  g.s.party[0].hp = 0;
  g.s.party[1].hp = 20;
  g.s.party[1].healCd = 999;
  return { g, b, dead: g.s.party[0], wounded: g.s.party[1] };
}
function threat(g) {
  const e = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 100, damage: 1, gold: 0, xp: 0 },
    { x: g.hero.x + 80, y: g.hero.y },
  );
  e.aggro = true;
  g.zone().enemies = [e];
  return e;
}
let paths = 0;
for (const mode of ['normal', 'nightmare'])
  for (const kind of ['recovery', 'treatment'])
    for (const source of ['town', 'barracks']) {
      let { g, b, dead, wounded } = fixture(mode);
      const target = kind === 'recovery' ? dead : wounded,
        id = target.id,
        cost = g.companionCarePrice(kind),
        sourceId = source === 'town' ? null : b.id;
      assert(g.requestCompanionCare(kind, sourceId));
      assert.equal(g.hero.gold, 0);
      assert.deepEqual(g.s.companionCareRequests[kind].companionIds, [id]);
      g.hero.gold = cost - 1;
      g.resolveCompanionCareRequests();
      assert(g.s.companionCareRequests[kind]);
      assert.equal(target.hp, kind === 'recovery' ? 0 : 20);
      g = C.restore(g.snapshot(), () => 0.5);
      g.enter('march');
      g.zone().enemies = [];
      const selected = g.s.party.find((u) => u.id === id),
        active = selected.active !== false;
      g.s.loot.push({ id: 'care-payment', zone: g.zoneId, x: g.hero.x, y: g.hero.y, gold: 1 });
      g.tick(0.01);
      assert.equal(g.hero.gold, 0);
      assert.equal(selected.hp, selected.maxHp);
      assert.equal(selected.active !== false, active);
      assert.equal(g.s.companionCareRequests[kind], null);
      assert.equal(g.rosterCount(), 2);
      if (kind === 'recovery') {
        assert.equal(selected.customName, 'Iris');
        assert(g.effects.some((e) => e.type === 'companionRecovery'));
      } else
        assert.equal(
          g.s.party.find((u) => u.id === dead.id).hp,
          0,
          'treatment never revives a fallen companion',
        );
      g.tick(0.01);
      assert.equal(g.hero.gold, 0);
      assert.equal(g.rosterCount(), 2);
      paths++;
    }
for (const kind of ['recovery', 'treatment']) {
  const { g, b, dead, wounded } = fixture();
  assert(g.requestCompanionCare(kind, b.id));
  const target = kind === 'recovery' ? dead : wounded,
    cost = g.companionCarePrice(kind);
  g.hero.gold = cost;
  const enemy = threat(g);
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, cost);
  assert(target.hp < target.maxHp);
  assert(g.s.companionCareRequests[kind]);
  // Repeating the action must still cancel while temporarily blocked and already funded.
  assert(g.requestCompanionCare(kind, b.id));
  assert.equal(g.s.companionCareRequests[kind], null);
  assert.equal(g.hero.gold, cost);
  g.hero.gold = 0;
  assert(
    !g.requestCompanionCare(kind, b.id),
    'money must be the only missing condition when queuing',
  );
  enemy.aggro = false;
  assert(g.requestCompanionCare(kind, b.id));
  g.hero.gold = cost;
  b.progress = 3;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, cost);
  assert(target.hp < target.maxHp);
  b.progress = 4;
  target.expeditionId = 'away';
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, cost);
  delete target.expeditionId;
  g.s.challenge.pending = true;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, cost);
  g.s.challenge.pending = false;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 0);
  assert.equal(target.hp, target.maxHp, 'automatically proceeds once other requirements are clear');
}
// Lost need never switches recovery to a different dead member or spends on healthy/dead treatment targets.
{
  const { g, dead, wounded } = fixture();
  assert(g.requestCompanionCare('recovery'));
  dead.hp = dead.maxHp;
  wounded.hp = 0;
  g.hero.gold = 40;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 40);
  assert.equal(wounded.hp, 0);
  assert.equal(g.s.companionCareRequests.recovery, null);
  dead.hp = 10;
  assert(g.requestCompanionCare('treatment')); // Funds already available: immediate ordinary treatment.
  assert.equal(g.hero.gold, 10);
  assert.equal(dead.hp, dead.maxHp);
  g.hero.gold = 0;
  dead.hp = 10;
  assert(g.requestCompanionCare('treatment'));
  dead.hp = 0;
  g.hero.gold = 30;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 30);
  assert.equal(dead.hp, 0);
  assert.equal(g.s.companionCareRequests.treatment, null);
}
// Existing reserve status, healing subsets and predictable spending order are retained.
{
  const { g, dead, wounded } = fixture();
  dead.active = false;
  assert(g.requestCompanionCare('recovery'));
  assert(g.requestCompanionCare('treatment'));
  g.hero.gold = 40;
  g.resolveCompanionCareRequests();
  assert.equal(dead.hp, dead.maxHp);
  assert.equal(dead.active, false);
  assert.equal(wounded.hp, 20);
  assert(g.s.companionCareRequests.treatment);
  g.hero.gold = 30;
  g.resolveCompanionCareRequests();
  assert.equal(wounded.hp, wounded.maxHp);
}
// Wound treatment heals a wounded hero even if every companion is already healthy.
{
  const { g, wounded, dead } = fixture();
  wounded.hp = wounded.maxHp;
  g.hero.hp = g.hero.maxHp - 19;
  g.hero.gold = 30;
  assert(g.requestCompanionCare('treatment'));
  assert.equal(g.hero.hp, g.hero.maxHp);
  assert.equal(g.hero.gold, 0);
  assert.equal(dead.hp, 0);
  assert(!g.requestCompanionCare('treatment'), 'fully healthy party cannot pay again');
}
// Hero-only care persists across save/restore with no companion IDs and charges once.
{
  let { g, wounded } = fixture();
  wounded.hp = wounded.maxHp;
  g.hero.hp = g.hero.maxHp - 10;
  assert(g.requestCompanionCare('treatment'));
  assert.deepEqual(g.s.companionCareRequests.treatment.companionIds, []);
  assert.equal(g.s.companionCareRequests.treatment.heroWounded, true);
  g = C.restore(g.snapshot(), () => 0.5);
  g.hero.gold = 30;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.hp, g.hero.maxHp);
  assert.equal(g.hero.gold, 0);
  assert.equal(g.s.companionCareRequests.treatment, null);
}
// A queued request heals both originally wounded recipients but never revives the fallen.
{
  let { g, wounded, dead } = fixture();
  const woundedId = wounded.id;
  const deadId = dead.id;
  g.hero.hp = g.hero.maxHp - 12;
  assert(g.requestCompanionCare('treatment'));
  assert.equal(g.s.companionCareRequests.treatment.heroWounded, true);
  assert.deepEqual(g.s.companionCareRequests.treatment.companionIds, [woundedId]);
  g = C.restore(g.snapshot(), () => 0.5);
  g.hero.gold = 30;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.hp, g.hero.maxHp);
  assert.equal(g.s.party.find((u) => u.id === woundedId).hp, g.s.party.find((u) => u.id === woundedId).maxHp);
  assert.equal(g.s.party.find((u) => u.id === deadId).hp, 0);
  assert.equal(g.hero.gold, 0);
}
// Unneeded hero-only queues cancel without payment.
{
  const { g, wounded } = fixture();
  wounded.hp = wounded.maxHp;
  g.hero.hp = g.hero.maxHp - 10;
  assert(g.requestCompanionCare('treatment'));
  g.hero.hp = g.hero.maxHp;
  g.hero.gold = 30;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 30);
  assert.equal(g.s.companionCareRequests.treatment, null);
}
// Legacy companion-only queues must not enroll the hero if she is wounded later.
{
  let { g } = fixture();
  assert(g.requestCompanionCare('treatment'));
  const old = g.snapshot();
  delete old.companionCareRequests.treatment.heroWounded;
  old.hero.hp = old.hero.maxHp - 10;
  g = C.restore(old);
  g.hero.gold = 30;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.hp, g.hero.maxHp - 10);
  assert.equal(g.s.party[1].hp, g.s.party[1].maxHp);
}
// Recovery/treatment requests keep independent targets and reject malformed saved data.
{
  const { g } = fixture();
  const raw = g.snapshot();
  delete raw.companionCareRequests;
  assert.deepEqual(C.restore(raw).s.companionCareRequests, { recovery: null, treatment: null });
  for (const bad of [
    [],
    { other: null },
    { recovery: { companionIds: [], barracksId: null, zone: 'vale' } },
    { recovery: { companionIds: ['a', 'b'], barracksId: null, zone: 'vale' } },
    { treatment: { companionIds: ['a'], barracksId: null, zone: 'missing' } },
    { treatment: { companionIds: [], heroWounded: false, barracksId: null, zone: 'vale' } },
    { treatment: { companionIds: [], heroWounded: 'yes', barracksId: null, zone: 'vale' } },
    { recovery: { companionIds: ['a'], heroWounded: true, barracksId: null, zone: 'vale' } },
  ])
    assert.throws(
      () => C.restore({ ...g.snapshot(), companionCareRequests: bad }),
      /companion care/,
    );
}
// Both town and completed Barracks expose the same affordable/queue/cancel paths.
{
  const { g, b } = fixture();
  let opened;
  const ui = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  g.s.quests['quest-barracks'].captainBriefed = true;
  const click = (label) => {
    const a = opened.actions.find((a) => a.label.startsWith(label));
    assert(a, label);
    assert(!a.disabled, a.detail);
    a.action();
  };
  ui.partyMenu();
  click('Recover fallen companion');
  assert(g.s.companionCareRequests.recovery);
  click('Treat wounds');
  assert(g.s.companionCareRequests.treatment);
  assert(opened.description.includes('payment order'));
  ui.barracksMenu(b);
  assert.equal(opened.actions.length, 5);
  click('Recovery');
  assert(opened.description.includes('Local death loss: 15%'));
  assert(opened.description.includes('hero and living companions'));
  click('Cancel queued recovery');
  assert.equal(g.s.companionCareRequests.recovery, null);
  click('Cancel queued treatment');
  assert.equal(g.s.companionCareRequests.treatment, null);
  g.s.challenge.succession = true;
  ui.barracksMenu(b);
  click('Recovery');
  assert(opened.description.includes('class loss replaces crown loss'));
  assert(!opened.actions.some((a) => /death recovery/.test(a.label)));
}
// Basic Barracks hold three individually chosen recoveries, permit selective
// cancellation, and preserve order, identity and price across save/reload.
{
  let { g, b, dead, wounded } = fixture();
  wounded.hp = 0;
  const extra = Array.from({ length: 3 }, (_, i) => {
    const u = g.unit('soldier', g.hero.x + 30 + i * 10, g.hero.y);
    u.hp = 0;
    u.active = false; // Larger rosters must use legal reserve slots in v4 saves.
    g.s.party.push(u);
    return u;
  });
  const ids = [dead, wounded, ...extra].map((u) => u.id);
  assert(g.requestCompanionCare('recovery', b.id, ids[0]));
  assert(g.requestCompanionCare('recovery', b.id, ids[1]));
  assert(g.requestCompanionCare('recovery', b.id, ids[2]));
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, ids.slice(0, 3));
  assert(!g.requestCompanionCare('recovery', b.id, ids[3]), 'Basic queue capped at 3');
  assert(g.requestCompanionCare('recovery', b.id, ids[1]), 'toggle cancels one selected ID');
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, [ids[0], ids[2]]);
  assert(g.requestCompanionCare('recovery', b.id, ids[3]));
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, [ids[0], ids[2], ids[3]]);
  g = C.restore(g.snapshot(), () => 0.5);
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, [ids[0], ids[2], ids[3]]);
  const recovered = [];
  const originalRecover = g.recover.bind(g);
  g.recover = (id) => {
    recovered.push(id);
    return originalRecover(id);
  };
  g.hero.gold = 80;
  g.resolveCompanionCareRequests();
  assert.deepEqual(recovered, [ids[0], ids[2]], 'FIFO payment order');
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, [ids[3]]);
  assert.equal(g.hero.gold, 0);
  assert.equal(g.s.party.find((u) => u.id === ids[1]).hp, 0, 'cancelled member stays fallen');
  g.hero.gold = 40;
  g.resolveCompanionCareRequests();
  assert.equal(g.s.companionCareRequests.recovery, null);
  assert.equal(g.s.party.find((u) => u.id === ids[3]).hp, g.s.party.find((u) => u.id === ids[3]).maxHp);
  assert.equal(g.rosterCount(), 5);
}

// A Full Barracks has no recovery queue cap other than actually owned fallen
// companions. Upgrading a Basic Barracks never discards its first three entries.
{
  const { g, b, dead, wounded } = fixture();
  wounded.hp = 0;
  const ids = [dead.id, wounded.id];
  for (let i = 0; i < 6; i++) {
    const u = g.unit('soldier', g.hero.x + i * 5 + 15, g.hero.y);
    u.hp = 0;
    u.active = false; // Larger rosters must use legal reserve slots in v4 saves.
    g.s.party.push(u);
    ids.push(u.id);
  }
  for (const id of ids.slice(0, 3)) assert(g.requestCompanionCare('recovery', b.id, id));
  b.full = true;
  for (const id of ids.slice(3)) assert(g.requestCompanionCare('recovery', b.id, id));
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, ids);
  const loaded = C.restore(g.snapshot(), () => 0.5);
  assert.deepEqual(loaded.s.companionCareRequests.recovery.companionIds, ids);
  loaded.hero.gold = ids.length * 40;
  loaded.resolveCompanionCareRequests();
  assert.equal(loaded.s.companionCareRequests.recovery, null);
  assert(loaded.s.party.every((u) => u.hp > 0));
  assert.equal(loaded.hero.gold, 0);
}

// Captain retains a one-member queue. Mixing source ownership is refused, but
// a pending companion can still be individually cancelled at a Barracks.
{
  const { g, b, dead, wounded } = fixture();
  wounded.hp = 0;
  assert(g.requestCompanionCare('recovery', null, dead.id));
  assert(!g.requestCompanionCare('recovery', null, wounded.id));
  assert(!g.requestCompanionCare('recovery', b.id, wounded.id));
  assert(g.requestCompanionCare('recovery', b.id, dead.id));
  assert.equal(g.s.companionCareRequests.recovery, null);
  assert(g.requestCompanionCare('recovery', b.id, wounded.id));
  assert(g.s.companionCareRequests.recovery);
}

// Source and safety are checked for each paid recovery, not merely when the
// multiple request was initially accepted.
{
  const { g, b, dead, wounded } = fixture();
  wounded.hp = 0;
  assert(g.requestCompanionCare('recovery', b.id, dead.id));
  assert(g.requestCompanionCare('recovery', b.id, wounded.id));
  g.hero.gold = 80;
  const enemy = threat(g);
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 80);
  enemy.aggro = false;
  b.progress = 3;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 80);
  b.progress = 4;
  dead.expeditionId = 'away';
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 80);
  delete dead.expeditionId;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 0);
  assert.equal(dead.hp, dead.maxHp);
  assert.equal(wounded.hp, wounded.maxHp);
}

// Old one-member v4 requests remain valid. Forged queues cannot exceed the
// source Barracks capacity or Captain's established one-member limit.
{
  const { g, b, dead, wounded } = fixture();
  wounded.hp = 0;
  assert(g.requestCompanionCare('recovery', b.id, dead.id));
  const original = g.snapshot();
  assert.deepEqual(C.restore(original).s.companionCareRequests.recovery.companionIds, [dead.id]);
  const tooLong = { ...original, companionCareRequests: {
    ...original.companionCareRequests,
    recovery: { ...original.companionCareRequests.recovery, companionIds: [
      dead.id, wounded.id, 'third', 'fourth',
    ] },
  } };
  assert.throws(() => C.restore(tooLong), /recovery queue capacity/);
  tooLong.companionCareRequests.recovery.barracksId = null;
  assert.throws(() => C.restore(tooLong), /recovery queue capacity/);
  b.full = true;
  assert(C.restore({ ...g.snapshot(), companionCareRequests: {
    ...g.snapshot().companionCareRequests,
    recovery: { ...g.snapshot().companionCareRequests.recovery, companionIds: [
      dead.id, wounded.id, 'third', 'fourth',
    ] },
  } }));
}

// The Captain can cancel individual members of an existing multi-member
// Barracks queue without clearing the whole request.
{
  const { g, b, dead, wounded } = fixture();
  wounded.hp = 0;
  assert(g.requestCompanionCare('recovery', b.id, dead.id));
  assert(g.requestCompanionCare('recovery', b.id, wounded.id));
  g.s.quests['quest-barracks'].captainBriefed = true;
  let opened;
  const ui = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  ui.partyMenu();
  const entries = opened.actions.filter((a) => a.label.startsWith('Cancel queued recovery: '));
  assert.equal(entries.length, 2);
  entries[0].action();
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, [wounded.id]);
}

// A long Full Barracks recovery roster uses the existing eight-item page
// navigation, without preventing selection of members on later pages.
{
  const { g, b } = fixture();
  b.full = true;
  for (let i = 0; i < 10; i++) {
    const u = g.unit('soldier', g.hero.x + i * 6, g.hero.y);
    u.hp = 0;
    u.active = false; // Larger rosters must use legal reserve slots in v4 saves.
    g.s.party.push(u);
  }
  let opened;
  const ui = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  ui.barracksMenu(b);
  opened.actions.find((x) => x.label === 'Recovery').action();
  const firstPage = opened.actions.filter((x) => x.label.startsWith('Recover '));
  assert.equal(firstPage.length, 8);
  opened.actions.find((x) => x.label === 'Next page').action();
  const nextPage = opened.actions.filter((x) => x.label.startsWith('Recover '));
  assert.equal(nextPage.length, 3, 'eleven fallen companions yield eight then three choices');
  nextPage[2].action();
  assert.equal(g.s.companionCareRequests.recovery.companionIds.length, 1);
}

// The actual Barracks menu exposes each fallen member and can toggle them
// independently without cancelling other entries.
{
  const { g, b, wounded } = fixture();
  wounded.hp = 0;
  let opened;
  const ui = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu() {},
    recallSquad() {},
    showMap() {},
    finaleMenu() {},
  });
  ui.barracksMenu(b);
  opened.actions.find((x) => x.label === 'Recovery').action();
  assert(opened.description.includes('Basic Barracks queues 3'));
  const first = opened.actions.find((x) => x.label.startsWith('Recover Iris'));
  assert(first && !first.disabled);
  first.action();
  assert.deepEqual(g.s.companionCareRequests.recovery.companionIds, [g.s.party[0].id]);
  const second = opened.actions.find((x) => x.label.startsWith('Recover '));
  assert(second && !second.disabled);
  second.action();
  assert.equal(g.s.companionCareRequests.recovery.companionIds.length, 2);
  const cancel = opened.actions.find((x) => x.label.startsWith('Cancel queued recovery: Iris'));
  assert(cancel);
  cancel.action();
  assert.equal(g.s.companionCareRequests.recovery.companionIds.length, 1);
}

console.log(
  'PASS ' +
    paths +
    ' recovery/treatment mode/source save-travel-auto-payment paths, combat/source/target/hero revalidation, cancellation, reserves, no revive-by-heal, priority, legacy validation and shared NPC menus',
);
