'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine'),
  Menus = require('../src/prototype/menus');
function fixture(mode = 'normal') {
  const g = new C(mode, 'paladin', () => 0.5);
  g.zone().enemies = [];
  g.s.expeditionRank = 2;
  g.hero.gold = 0;
  const b = {
    id: 'request-barracks',
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
  return { g, b };
}
let cases = 0;
for (const mode of ['normal', 'nightmare'])
  for (const type of ['soldier', 'archer'])
    for (const source of ['town', 'barracks']) {
      let { g, b } = fixture(mode);
      const id = source === 'town' ? null : b.id;
      const price = source === 'town' ? g.recruitPrice(type) : g.barracksRecruitPrice(type);
      assert(g.requestCompanionRecruitment(type, id));
      assert.equal(g.hero.gold, 0);
      assert.equal(g.rosterCount(), 2);
      assert.equal(g.queuedCompanions(), 1);
      assert.equal(g.queuedCompanions(false), 0);
      g.hero.gold = price - 1;
      const messages = g.messages.length;
      g.tick(0.01);
      assert.equal(g.messages.length, messages, 'insufficient funds must not spam every frame');
      assert.equal(g.rosterCount(), 2);
      // Save, travel and restore before actual loot collection funds the request.
      g = C.restore(g.snapshot(), () => 0.5);
      g.enter('march');
      g.zone().enemies = [];
      g.s.loot.push({ id: 'fund-request', gold: 1, zone: g.zoneId, x: g.hero.x, y: g.hero.y });
      g.tick(0.01);
      assert.equal(g.rosterCount(), 3);
      assert.equal(g.hero.gold, 0, 'charge the selected source price exactly once');
      assert.equal(g.s.recruitmentRequest, null);
      assert.equal(g.s.party.at(-1).type, type);
      assert(g.s.party.at(-1).active);
      assert(
        Math.hypot(g.s.party.at(-1).x - g.hero.x, g.s.party.at(-1).y - g.hero.y) < 200,
        'joins in the current region',
      );
      g.tick(0.01);
      assert.equal(g.rosterCount(), 3, 'no duplicate on later ticks');
      assert.equal(g.s.zones.vale.buildings.find((x) => x.id === b.id).queue, 0);
      assert(
        g.notices.some((n) => n.text.includes('recruited') && n.detail.includes('active group')),
      );
      cases++;
    }
// Cancellation wins even if funds arrive before the next tick; selection replaces one request.
{
  const { g, b } = fixture();
  assert(g.requestCompanionRecruitment('soldier'));
  assert(g.requestCompanionRecruitment('archer'));
  assert.equal(g.s.recruitmentRequest.type, 'archer');
  assert.equal(g.queuedCompanions(), 1);
  g.hero.gold = 100;
  assert(g.requestCompanionRecruitment('archer'));
  assert.equal(g.s.recruitmentRequest, null);
  assert.equal(g.hero.gold, 100);
  g.tick(0.01);
  assert.equal(g.rosterCount(), 2);
  g.hero.gold = 0;
  assert(g.requestCompanionRecruitment('soldier'));
  b.progress = 2;
  const request = structuredClone(g.s.recruitmentRequest);
  assert(!g.requestCompanionRecruitment('archer', b.id));
  assert.deepEqual(
    g.s.recruitmentRequest,
    request,
    'a denied replacement retains the original request',
  );
}
// Whatever fills the group after acceptance, a promised recruit still arrives in reserve.
for (const source of ['town', 'barracks']) {
  const { g, b } = fixture();
  const id = source === 'town' ? null : b.id;
  assert(g.requestCompanionRecruitment('archer', id));
  g.s.party.push(g.unit('soldier', g.hero.x, g.hero.y));
  g.hero.gold = g.recruitmentRequestPrice();
  g.tick(0.01);
  assert.equal(g.rosterCount(), 4);
  assert.equal(g.activeParty().length, 3);
  assert.equal(g.s.party.at(-1).active, false);
  assert(g.notices.some((n) => n.detail.includes('Resting in reserve')));
}
// Hard company reservations, progression/build gates and immediate funded recruitment remain.
{
  const { g, b } = fixture();
  g.s.expeditionRank = 1;
  assert(!g.requestCompanionRecruitment('soldier'));
  assert.equal(g.s.recruitmentRequest, null);
  g.s.expeditionRank = 2;
  b.progress = 1;
  assert(!g.requestCompanionRecruitment('soldier', b.id));
  b.progress = 4;
  b.queue = 2;
  assert(!g.requestCompanionRecruitment('soldier', b.id));
  b.queue = 0;
  g.hero.gold = 300;
  assert(g.requestCompanionRecruitment('soldier', b.id));
  assert.equal(b.queue, 4, 'funded barracks recruitment retains existing training');
  assert.equal(g.s.recruitmentRequest, null);
  assert.equal(g.hero.gold, 240);
  b.queue = 0;
  b.queueType = null;
  g.hero.gold = 0;
  g.s.party = Array.from({ length: 199 }, () => {
    const u = g.unit('soldier', g.hero.x, g.hero.y);
    u.active = false;
    return u;
  });
  assert(g.requestCompanionRecruitment('soldier', b.id));
  assert(g.companionRecruitmentReason('archer', b.id).includes('Company limit'));
  assert.equal(C.restore(g.snapshot()).queuedCompanions(), 1);
  g.hero.gold = 60;
  assert(g.resolveRecruitmentRequest());
  assert.equal(g.rosterCount(), 200);
  assert(!g.requestCompanionRecruitment('archer', b.id));
}
// Malformed saved requests are rejected; legacy saves without the field remain loadable.
{
  const { g } = fixture();
  const raw = g.snapshot();
  delete raw.recruitmentRequest;
  assert.equal(C.restore(raw).s.recruitmentRequest, null);
  for (const invalid of [
    { type: 'pet', zone: 'vale', barracksId: null },
    { type: 'soldier', zone: 'missing', barracksId: null },
    [],
    { type: 'archer', zone: 'vale', barracksId: 5 },
  ]) {
    assert.throws(
      () => C.restore({ ...g.snapshot(), recruitmentRequest: invalid }),
      /pending recruitment/,
    );
  }
}
// First captain visit is instructional; Recall and field-base stages use the original quest.
{
  let g = new C('normal', 'mage', () => 0.5),
    opened,
    practiceComplete,
    closed = false;
  const menu = Menus.create({
    getGame: () => g,
    Campaign: C,
    D: C.data,
    action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
    openMenu: (title, description, actions, back) =>
      (opened = { title, description, actions, back }),
    closeMenu: () => {
      closed = true;
    },
    practiceRecall: (complete) => {
      closed = true;
      practiceComplete = complete;
    },
    showMap() {},
    finaleMenu() {},
  });
  const q = g.questDefs()[0];
  assert.equal(q.id, 'quest-barracks');
  assert.equal(q.name, 'Your First Company');
  assert.equal(g.questDestination(q.id).kind, 'recruiter');
  menu.partyMenu();
  assert.equal(opened.title, 'Meet your company');
  assert(opened.description.includes('Recall brings them back'));
  assert(!opened.actions.some((a) => a.label === 'Open recruitment'));
  assert(g.s.quests[q.id].captainBriefed);
  opened.actions.find((a) => a.label === 'Practice Recall squad').action();
  assert(closed);
  assert(!g.s.quests[q.id].recallPracticed);
  g.recallParty();
  practiceComplete();
  assert(opened.description.includes('Orders cancelled.'));
  assert(g.s.quests[q.id].recallPracticed);
  assert(g.questProgress(q).includes('FREE'));
  g = C.restore(g.snapshot());
  menu.partyMenu();
  assert.equal(opened.title, 'Millhaven Captain');
  assert(!opened.actions.some((a) => a.label.startsWith('Recruit Soldier')));
  assert(opened.actions.find((a) => a.label === 'Recruitment — Expedition 2 required').disabled);
  g.s.expeditionRank = 2;
  g.hero.gold = 0;
  menu.partyMenu();
  const recruit = opened.actions.find((a) => a.label.startsWith('Recruit Soldier'));
  assert(!recruit.disabled);
  recruit.action();
  assert(opened.actions.find((a) => a.label.startsWith('Cancel queued Soldier')));
  assert(opened.description.includes('Queued recruitment'));
  g.s.party.push(g.unit('soldier', g.hero.x + 40, g.hero.y));
  menu.partyMenu();
  assert(opened.actions.find((a) => a.label.startsWith('Cancel queued Soldier')));
  assert(!opened.actions.some((a) => a.label.startsWith('Recruit Ranger')));
  const limit = opened.actions.find((a) => a.label === 'Recruit at a Barracks');
  assert(limit.disabled);
  assert.equal(limit.detail, 'Town limit: 3 companions, reserves included.');
}
console.log(
  'PASS ' +
    cases +
    ' mode/type/source auto-arrivals plus cancellation, replacement, full-party reserves, reservations, save/travel, legacy validation and captain tutorial/menu',
);

// Funding is only a trigger to revalidate; combat, training, source and unlocks still gate delivery.
for (const source of ['town', 'barracks']) {
  const { g, b } = fixture(),
    id = source === 'town' ? null : b.id;
  assert(g.requestCompanionRecruitment('soldier', id));
  g.hero.gold = g.recruitmentRequestPrice();
  const e = g.makeEnemy(
    { species: 'goblin', level: 1, hp: 100, damage: 1, gold: 0, xp: 0 },
    { x: g.hero.x + 80, y: g.hero.y },
  );
  g.zone().enemies = [e];
  e.aggro = true;
  const before = g.hero.gold;
  assert(!g.resolveRecruitmentRequest());
  assert.equal(g.hero.gold, before);
  assert.equal(g.rosterCount(), 2);
  e.aggro = false;
  g.s.expeditionRank = 1;
  assert(!g.resolveRecruitmentRequest());
  g.s.expeditionRank = 2;
  if (id) {
    b.queue = 1;
    b.queueType = 'archer';
    assert(!g.resolveRecruitmentRequest(), 'busy Barracks remains a blocker after funding');
    b.queue = 0;
    b.queueType = null;
    b.progress = 3;
    assert(!g.resolveRecruitmentRequest());
    b.progress = 4;
  } else {
    const captain = g.zone().npcs.find((n) => n.kind === 'recruiter');
    g.zone().npcs = g.zone().npcs.filter((n) => n !== captain);
    assert(!g.resolveRecruitmentRequest());
    g.zone().npcs.push(captain);
  }
  assert(g.resolveRecruitmentRequest(), 'idle nearby enemies do not block services');
}
console.log(
  'PASS recruitment rechecks engaged combat, Expedition, source Captain/Barracks and paid-training availability before spending',
);
