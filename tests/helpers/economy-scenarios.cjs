'use strict';
const assert = require('node:assert/strict');
// Exercise existing public actions so the same replay can run against an untouched checkout.
module.exports = function replay(C, mode = 'normal', cls = 'paladin', succession = false) {
  const c = new C(mode, cls, () => 0.9, { succession }),
    records = [];
  const record = (name) =>
    records.push(
      JSON.parse(
        JSON.stringify({
          name,
          state: c.snapshot(),
          messages: c.messages,
          effects: c.effects,
          notices: c.notices,
        }),
      ),
    );
  const paid = (cost, action) => {
    const before = c.hero.gold;
    assert.equal(action(), true);
    assert.equal(c.hero.gold, before - cost);
  };
  const unpaid = (action) => {
    const before = c.hero.gold;
    assert.equal(action(), false);
    assert.equal(c.hero.gold, before);
  };
  c.hero.gold = 100000;
  for (const b of C.data.bosses) c.s.rescued[b.id] = true;
  for (const skill of C.data.skills) {
    const [slot, , , learn, family, unit] = skill;
    if (slot !== 1) paid(learn, () => c.learn(slot, family));
    const trainer = 'citadel',
      cap = c.teacherCatalog(trainer).maxRank;
    while (c.hero.skills[slot - 1] < cap) {
      const rank = c.hero.skills[slot - 1];
      paid(unit * rank, () => c.upgrade(slot, trainer));
    }
    unpaid(() => c.upgrade(slot, trainer));
  }
  for (const [id, def] of Object.entries(C.rules.expeditionSupportSkills)) {
    const family = Object.entries(def.trainers).sort((a, b) => b[1] - a[1])[0][0];
    while (c.expeditionSupportRank(id) < def.maxRank)
      paid(def.costs[c.expeditionSupportRank(id) + 1], () => c.trainExpeditionSupport(id, family));
    unpaid(() => c.trainExpeditionSupport(id, family));
  }
  for (const family of ['crypt', 'mine', 'abyss', 'cindermaw'])
    for (const slot of ['weapon', 'armor']) {
      const tier = C.rules.balance.equipment.tiers[family],
        price = C.rules.balance.equipment.prices[slot][tier];
      paid(price, () => c.gear(family, slot));
      paid(Math.ceil(price / 2), () => c.gear(family, slot, true));
      unpaid(() => c.gear(family, slot, true));
    }
  paid(200, () => c.trainCompanionVitality());
  paid(50, () => c.trainRangerSupport('health'));
  paid(40, () => c.trainRangerSupport('mana'));
  unpaid(() => c.trainRangerSupport('health'));
  c.hero.talentPoints = 4;
  assert(c.talent(0));
  paid(250, () => c.resetTalents());
  unpaid(() => c.resetTalents());
  paid(70, () => c.buyPotion('tonic', true));
  unpaid(() => c.buyPotion('tonic', true));
  record('training-equipment-support-tonic');
  c.enter('vale');
  c.zone().enemies = [];
  c.s.expeditionRank = 4;
  c.s.party.forEach((u) => {
    u.order = null;
    u.active = true;
  });
  paid(0, () => c.build());
  const b = c.zone().buildings.at(-1);
  b.progress = 4;
  c.s.party.forEach((u) => (u.order = null));
  paid(100, () => c.upgradeBarracks(b.id));
  c.s.party.forEach((u) => (u.order = null));
  paid(0, () => c.upgradeBarracks(b.id));
  c.s.party.forEach((u) => (u.order = null));
  paid(20, () => c.build());
  c.s.party.forEach((u) => (u.order = null));
  paid(70, () => c.recruit('soldier'));
  unpaid(() => c.recruit('archer'));
  c.s.party[0].hp = 0;
  paid(40, () => c.recover());
  c.s.party[0].hp = 1;
  paid(30, () => c.treatCompanions());
  record('barracks-first-free-upgrade-recruit-recovery-treatment');
  for (const p of Object.values(c.s.quests)) {
    p.done = true;
    p.paid = true;
    p.active = false;
  }
  paid(60, () => c.train(b.id, 'soldier'));
  unpaid(() => c.train(b.id, 'archer'));
  b.queue = 0;
  paid(85, () => c.train(b.id, 'archer'));
  record('barracks-hire-prices-and-queue');
  const laborer = c.s.party[0];
  laborer.carry = 35.4;
  laborer.order = { type: 'deposit', id: 'finished-resource' };
  Object.assign(laborer, c.depositSite(laborer));
  const depositGold = c.hero.gold;
  c.updateParty(0.01);
  assert.equal(c.hero.gold, depositGold + 35);
  assert(Math.abs(laborer.carry - 0.4) < 1e-9);
  record('labor-deposit-retains-fraction');
  const fare = C.data.regions[0].fare;
  paid(fare, () => c.travel(1));
  paid(0, () => c.travel(-1));
  c.s.recovery.vale = true;
  paid(0, () => c.travel(1));
  paid(0, () => c.travel(-1));
  const before = c.snapshot(),
    enter = c.enter;
  c.enter = function () {
    this.hero.gold = 1;
    this.s.zone = 'marsh';
    throw Error('fixture');
  };
  unpaid(() => c.travel(1));
  c.enter = enter;
  assert.deepEqual(c.snapshot(), before);
  record('travel-paid-return-waiver-rollback');
  c.hero.gold = 0;
  unpaid(() => c.travel(1));
  unpaid(() => c.trainCompanionVitality());
  unpaid(() => c.spend(NaN));
  unpaid(() => c.spend(-1));
  record('insufficient-funds');
  const bossResults = [];
  for (const phase of ['adventure', 'awakening']) {
    c.s.phase = phase;
    for (const b of C.data.bosses)
      for (const form of ['normal', 'true']) {
        const e = c.bossEnemy(b, form, { x: 500, y: 500 });
        bossResults.push({ phase, id: b.id, form, gold: e.gold, xp: e.xp, level: e.level });
      }
  }
  records.push({ name: 'every-boss-form', bossResults });
  c.s.phase = 'adventure';
  c.s.quests = {};
  c.initializeQuests();
  for (const p of Object.values(c.s.quests)) {
    p.done = true;
    p.paid = true;
    p.active = false;
  }
  const q = c.questDefs().find((q) => q.gold > 0),
    p = c.s.quests[q.id];
  p.paid = false;
  c.hero.level = 1;
  c.hero.xp = 0;
  const gold = c.hero.gold;
  assert(c.payQuest(q, p));
  assert.equal(c.hero.gold, gold + q.gold);
  unpaid(() => c.payQuest(q, p));
  record('quest-pays-once');
  c.hero.level = 1;
  c.hero.xp = 0;
  c.hero.gold = 100;
  Object.assign(c.hero, { x: 500, y: 500 });
  c.zone().enemies = [];
  c.s.loot = [];
  c.s.mercyTime = 0;
  const e = c.makeEnemy(
    { species: 'goblin', name: 'Reward fixture', level: 1, hp: 10, damage: 1, gold: 11, xp: 20 },
    { x: 500, y: 500 },
  );
  c.zone().enemies = [e];
  e.hp = 0;
  c.kill(e);
  assert.equal(c.hero.gold, 100);
  assert.equal(c.hero.xp, 10);
  assert.equal(c.s.loot.length, 1);
  c.kill(e);
  assert.equal(c.s.loot.length, 1);
  c.tick(0.01, { x: 0, y: 0 });
  assert.equal(c.hero.gold, 111);
  assert.equal(c.s.loot.length, 0);
  record('kill-exp-immediate-crowns-pickup-once');
  const summoned = c.makeEnemy(
    { species: 'goblin', name: 'Summon fixture', level: 1, hp: 10, damage: 1, gold: 500, xp: 500 },
    { x: 500, y: 500 },
  );
  summoned.summon = true;
  const kills = c.s.statistics.kills;
  const xp = c.hero.xp;
  summoned.hp = 0;
  c.kill(summoned);
  assert.equal(c.hero.xp, xp);
  assert.equal(c.s.statistics.kills, kills);
  assert.equal(c.s.loot.length, 0);
  for (const [i, id] of C.dungeonIds.entries()) {
    c.enter(id);
    c.zone().enemies = [];
    c.s.pending = {};
    c.s.normal[id] = true;
    delete c.s.paid['clear:' + id];
    const before = c.hero.gold;
    c.checkClear();
    assert.equal(c.hero.gold, before + [100, 220, 400, 650, 900][i]);
    c.checkClear();
    assert.equal(c.hero.gold, before + [100, 220, 400, 650, 900][i]);
  }
  record('dungeon-clear-pays-once');
  c.hero.gold = 103;
  c.hero.hp = 0;
  c.die();
  assert.equal(c.hero.gold, 82);
  if (succession) {
    assert(c.successor(cls === 'paladin' ? 'mage' : 'paladin'));
    assert.equal(c.hero.gold, 82);
    assert.equal(c.hero.level, 1);
  }
  record('death-and-succession');
  return records;
};
