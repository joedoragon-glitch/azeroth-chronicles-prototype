'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine.js'),
  Menus = require('../src/prototype/menus.js'),
  replay = require('./helpers/economy-scenarios.cjs');
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const succession of [false, true]) replay(C, mode, cls, succession);
console.log(
  'PASS economy actions preserve prices, gates, first-free construction, queued hires, fractions, reward timing, rollback and Succession for every class/mode',
);
const c = new C(),
  R = C.rules;
assert.deepEqual(R.balance.economy, {
  startingCrowns: 30,
  deathPenaltyFraction: 0.2,
  preparationTonicCost: 70,
  reforgePriceDivisor: 2,
});
assert.deepEqual(R.balance.rewards, {
  trueBossMultiplier: 2,
  awakenedBossCrowns: [500, 600, 700, 800, 1000],
  awakenedBossXp: [1000, 1250, 1500, 1750, 2000],
  dungeonClearCrowns: [100, 220, 400, 650, 900],
  fieldCaptainCrownsMultiplier: 2.5,
  fieldCaptainXpMultiplier: 2,
  ringleaderMultiplier: 1.5,
  roomGuardCrownsFraction: 0.35,
});
for (const [i, r] of C.data.regions.entries()) {
  const mean = (r.gold_range[0] + r.gold_range[1]) / 2;
  assert.deepEqual(c.regionalEnemyRewards(i), { gold: Math.floor(mean), xp: r.enemy_xp });
  assert.deepEqual(c.regionalEnemyRewards(i, 'guard'), { gold: Math.floor(mean), xp: r.guard_xp });
  assert.deepEqual(c.regionalEnemyRewards(i, 'roomGuard'), {
    gold: Math.max(1, Math.floor(mean * 0.35)),
    xp: r.guard_xp,
  });
  assert.deepEqual(c.regionalEnemyRewards(i, 'night'), { gold: r.gold_range[0], xp: r.enemy_xp });
  assert.deepEqual(c.regionalEnemyRewards(i, 'fieldCaptain'), {
    gold: Math.round(mean * 2.5),
    xp: Math.round(r.enemy_xp * 2),
  });
}
for (const b of C.data.bosses) {
  assert.deepEqual(c.bossRewards(b, 'normal'), { gold: b.gold, xp: b.xp });
  assert.deepEqual(c.bossRewards(b, 'true'), { gold: b.gold * 2, xp: b.xp * 2 });
}
for (const carry of [0, 0.4, 1, 1.999999999, 35.4])
  assert.equal(c.resourceDepositReward(carry), Math.floor(carry + 1e-7));
for (const gold of [0, -1, 1, 5, 103, 1000]) {
  c.hero.gold = gold;
  const loss = gold > 0 ? Math.ceil(gold * 0.2) : 0;
  assert.equal(c.applyDeathPenalty(), loss);
  assert.equal(c.hero.gold, Math.max(0, gold - loss));
}
console.log(
  'PASS extracted reward and penalty parameters retain every historical number and rounding rule',
);
let opened;
const menus = Menus.create({
  getGame: () => c,
  Campaign: C,
  D: C.data,
  action: (label, action, detail = '', disabled = false) => ({ label, action, detail, disabled }),
  openMenu: (title, description, actions) => (opened = { title, description, actions }),
  closeMenu() {},
  recallSquad() {},
  showMap() {},
  finaleMenu() {},
});
c.hero.gold = 10000;
c.s.rescued.thorn = true;
c.s.rescued.crypt = true;
const skill = C.data.skills.find((s) => s[0] === 2),
  oldLearn = skill[3],
  oldRank = skill[5],
  oldWeapon = R.balance.equipment.prices.weapon[1];
try {
  skill[3] = 47;
  skill[5] = 39;
  R.balance.equipment.prices.weapon[1] = 101;
  menus.teacher({ family: 'thorn', name: 'Teacher' });
  let a = opened.actions.find((a) => a.label.includes('Second attack'));
  assert(a.label.includes('47 crowns'));
  let gold = c.hero.gold;
  a.action();
  assert.equal(c.hero.gold, gold - 47);
  a = opened.actions.find((a) => a.label.includes('Second attack'));
  assert(a.label.includes('39 crowns'));
  gold = c.hero.gold;
  a.action();
  assert.equal(c.hero.gold, gold - 39);
  menus.smith({ family: 'crypt', name: 'Smith' });
  a = opened.actions.find((a) => a.label.startsWith('Weapon tier 1'));
  assert(a.label.includes('101 crowns'));
  gold = c.hero.gold;
  a.action();
  assert.equal(c.hero.gold, gold - 101);
  a = opened.actions.find((a) => a.label.startsWith('Reforge weapon'));
  assert(a.label.includes('51 crowns'));
  gold = c.hero.gold;
  a.action();
  assert.equal(c.hero.gold, gold - 51);
} finally {
  skill[3] = oldLearn;
  skill[5] = oldRank;
  R.balance.equipment.prices.weapon[1] = oldWeapon;
}
console.log(
  'PASS changing authored prices updates menu quotes and actual learning, training, equipment and rounded reforge charges together',
);
// Multiple level-ups retain growth, mana, healing, training points and roster synchronization.
for (const cls of ['paladin', 'mage', 'ranger']) {
  const g = new C('normal', cls);
  const hp = g.hero.maxHp,
    mp = g.hero.maxMp;
  g.xp(120 + 240 + 360 + 17);
  assert.equal(g.hero.level, 4);
  assert.equal(g.hero.xp, 17);
  assert.equal(g.xpRequired(), 480);
  assert.equal(g.hero.maxHp, hp + 75);
  assert.equal(g.hero.maxMp, mp + R.manaBalance.perLevel * 3);
  assert.equal(g.hero.hp, g.hero.maxHp);
  assert.equal(g.hero.mp, R.resourceMode.manaEnabled ? g.hero.maxMp : C.classes[cls].mp);
  assert.equal(g.hero.talentPoints, 3);
}
console.log(
  'PASS EXP remains owned by progression and supports consecutive levels for all three professions',
);
