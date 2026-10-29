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
// The Basic Barracks can hold three distinct unpaid recoveries, not three
// attempts at the same individual. The fourth cannot replace or charge others.
{
  const { g, b, dead } = fixture();
  const fallen = [dead];
  for (let i = 0; i < 4; i++) {
    const u = g.unit('soldier', g.hero.x + 10 + i, g.hero.y + 10 + i);
    u.hp = 0;
    // Reserve members are owned but must not exceed the Expedition field cap.
    u.active = false;
    u.customName = 'Recovery ' + i;
    g.s.party.push(u);
    fallen.push(u);
  }
  for (const u of fallen.slice(0, 3))
    assert(g.requestCompanionCare('recovery', b.id, u.id));
  assert.equal(g.companionRecoveryRequests().length, 3);
  assert.deepEqual(
    g.companionRecoveryRequests().map((r) => r.companionIds[0]),
    fallen.slice(0, 3).map((u) => u.id),
    'enrollment order, not roster order, is retained',
  );
  assert(!g.requestCompanionCare('recovery', b.id, fallen[3].id));
  assert.equal(g.companionRecoveryRequests().length, 3);
  assert.equal(g.hero.gold, 0);

  // A cancellation frees one slot; pending members retain their order.
  assert(g.requestCompanionCare('recovery', b.id, fallen[1].id));
  assert.equal(g.companionRecoveryRequests().length, 2);
  assert(g.requestCompanionCare('recovery', b.id, fallen[3].id));
  assert.deepEqual(
    g.companionRecoveryRequests().map((r) => r.companionIds[0]),
    [fallen[0].id, fallen[2].id, fallen[3].id],
  );
  g.hero.gold = 40;
  g.resolveCompanionCareRequests();
  assert.equal(g.hero.gold, 0);
  assert.equal(fallen[0].hp, fallen[0].maxHp);
  assert.equal(fallen[2].hp, 0);
  assert.equal(g.companionRecoveryRequests().length, 2);
  b.full = true; // Upgrading never discards existing requests.
  assert(g.requestCompanionCare('recovery', b.id, fallen[1].id));
  assert(g.requestCompanionCare('recovery', b.id, fallen[4].id));
  assert.equal(g.companionRecoveryRequests().length, 4);
  const remainingIds = g.companionRecoveryRequests().map((r) => r.companionIds[0]);
  let restored = C.restore(g.snapshot(), () => 0.5);
  assert.deepEqual(
    restored.companionRecoveryRequests().map((r) => r.companionIds[0]),
    remainingIds,
    'version-4 save round-trip retains queue order',
  );
  restored.hero.gold = 160;
  restored.resolveCompanionCareRequests();
  assert.equal(restored.hero.gold, 0);
  assert.equal(restored.companionRecoveryRequests().length, 0);
  for (const id of remainingIds)
    assert.equal(
      restored.s.party.find((u) => u.id === id).hp,
      restored.s.party.find((u) => u.id === id).maxHp,
    );
  assert.equal(new Set(restored.s.party.map((u) => u.id)).size, restored.s.party.length);
  paths++;
}
// Multiple source queues remain independent, and blocked entries do not swallow
// the crowns or identities of eligible entries at another completed Barracks.
{
  const { g, b, dead } = fixture();
  const other = { ...b, id: 'second-care-base', full: true };
  g.zone().buildings.push(other);
  const extra = g.unit('soldier', g.hero.x + 60, g.hero.y);
  extra.hp = 0;
  g.s.party.push(extra);
  assert(g.requestCompanionCare('recovery', b.id, dead.id));
  assert(g.requestCompanionCare('recovery', other.id, extra.id));
  g.hero.gold = 40;
  b.progress = 3;
  g.resolveCompanionCareRequests();
  assert.equal(dead.hp, 0);
  assert.equal(extra.hp, extra.maxHp);
  assert.equal(g.hero.gold, 0);
  assert.equal(g.companionRecoveryRequests().length, 1);
  assert.equal(g.companionRecoveryRequests()[0].companionIds[0], dead.id);
  b.progress = 4;
  dead.hp = 10;
  g.resolveCompanionCareRequests();
  assert.equal(g.companionRecoveryRequests().length, 0, 'stale target clears for free');
  paths++;
}
// Old single-entry saves remain compatible; malformed multi-recovery state
// cannot duplicate targets, bypass bounds or inject an unrelated care kind.
{
  const { g, b, dead } = fixture();
  assert(g.requestCompanionCare('recovery', b.id, dead.id));
  const original = g.snapshot();
  assert.equal(original.companionCareRequests.recoveryQueue, undefined);
  let restored = C.restore(original, () => 0.5);
  const next = restored.unit('soldier', restored.hero.x, restored.hero.y);
  next.hp = 0;
  restored.s.party.push(next);
  assert(restored.requestCompanionCare('recovery', b.id, next.id));
  assert.equal(restored.companionRecoveryRequests().length, 2);
  const saved = restored.snapshot();
  for (const queue of [
    {},
    [{ ...saved.companionCareRequests.recovery, companionIds: [dead.id] }],
    [{ ...saved.companionCareRequests.recovery, companionIds: [''] }],
    [{ ...saved.companionCareRequests.recovery, companionIds: [next.id, dead.id] }],
    Array.from({ length: 200 }, () => saved.companionCareRequests.recovery),
  ])
    assert.throws(
      () => C.restore({
        ...saved,
        companionCareRequests: { ...saved.companionCareRequests, recoveryQueue: queue },
      }),
      /companion recovery queue/,
    );
  paths++;
}
// Real Barracks menu uses individual names, preserves Back/navigation and
// disables the fourth Basic queue entry until an upgrade or cancellation.
{
  const { g, b, dead } = fixture();
  const companions = [dead];
  for (let i = 0; i < 3; i++) {
    const u = g.unit('soldier', g.hero.x + i, g.hero.y + i);
    u.hp = 0;
    u.active = false; // The recovery menu also lists fallen reserve companions.
    g.s.party.push(u);
    companions.push(u);
  }
  let opened;
  const ui = Menus.create({
    getGame: () => g, Campaign: C, D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu() {}, recallSquad() {}, showMap() {}, finaleMenu() {},
  });
  const openRecovery = () => {
    ui.barracksMenu(b);
    opened.actions.find((a) => a.label === 'Recovery').action();
  };
  openRecovery();
  assert(opened.description.includes('0/3'));
  const recover = (id) => {
    const a = opened.actions.find((a) => a.label.startsWith('Recover fallen companion') &&
      a.label.includes(g.companionDisplayName(g.s.party.find((u) => u.id === id))));
    assert(a && !a.disabled);
    a.action();
  };
  for (const u of companions.slice(0, 3)) recover(u.id);
  assert(opened.description.includes('3/3'));
  const fourth = opened.actions.find((a) => a.label.startsWith('Recover fallen companion'));
  assert(fourth && fourth.disabled);
  assert.match(fourth.detail, /Queue full/);
  const cancel = opened.actions.find((a) => a.label.startsWith('Cancel queued recovery'));
  assert(cancel);
  cancel.action();
  recover(companions[3].id);
  b.full = true;
  openRecovery();
  assert(opened.description.includes('no limit'));
  paths++;
}
console.log(
  'PASS ' +
    paths +
    ' recovery/treatment mode/source save-travel-auto-payment paths, combat/source/target/hero revalidation, cancellation, reserves, no revive-by-heal, priority, legacy validation and shared NPC menus',
);
