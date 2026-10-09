'use strict';
// Diagnostic, no gameplay tuning: reproduces the real Campaign casting/tick paths
// with a stationary invulnerable target and optional starting Ranger support.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');
const costs = Campaign.rules.balance.skills.costs;
const classes = ['paladin', 'mage', 'ranger'];
const round = (v) => Math.round(v * 100) / 100;
const fmt = (v) => (v === null ? null : round(v));

function arena(cls, ranger, pattern, level = 1, talent = 0) {
  const c = new Campaign('normal', cls, () => 0.9);
  c.s.mercyTime = 0;
  c.hero.level = level;
  c.hero.maxMp = Campaign.classes[cls].mp + Campaign.rules.manaBalance.perLevel * (level - 1);
  c.hero.mp = c.hero.maxMp;
  c.hero.talents[1] = talent;
  c.hero.skills[1] = 1;
  c.hero.skills[4] = 1;
  c.zone().props = [];
  c.s.party = ranger ? c.s.party.filter((u) => u.type === 'archer') : [];
  c.updateParty = () => {}; // isolate resource changes from companion damage/AI
  c.updateEnemies = () => {}; // prevent target moving or retaliating
  const target = c.zone().enemies.find((e) => e.type === 'mob' && !e.neutral);
  assert(target, 'there must be a normal mob');
  Object.assign(c.hero, { x: 500, y: 500 });
  Object.assign(target, {
    x: 580, y: 500,
    home: { x: 580, y: 500 },
    hp: 1e9, maxHp: 1e9, baseHp: 1e9,
    damage: 0, baseDamage: 0, aggro: true, returning: 0,
  });
  c.zone().enemies = [target];
  const stats = {
    class: cls, level, talent, ranger, pattern,
    startMax: c.hero.maxMp,
    regenCombat: round(c.manaRegenRate()),
    baseSkill2Cost: c.skillManaCost(2, 1),
    basicCost: c.skillManaCost(1, 1),
    slot5Cost: c.skillManaCost(5, 1),
    success: 0, deniedMP: 0, otherDenied: 0,
    totalMPSpent: 0, recoveries: 0, zeroMPSeconds: 0,
    under35Seconds: 0, fullSeconds: 0, minMP: c.hero.mp,
    checkpoints: [],
  };
  const support = c.rangerSupport.bind(c);
  c.rangerSupport = (...args) => {
    const done = support(...args);
    if (done && args[0] === 'mana') stats.recoveries++;
    return done;
  };
  const slots = pattern === 'basic' ? [1] : pattern === 'skill2' ? [2]
    : pattern === 'mixed' ? [5, 2] : pattern === 'charged1' ? [1] : [];
  for (let i = 0; i < 600; i++) {
    // Real cooldowns, costs, target checks, Ranger support and regen. No direct MP mutation.
    for (const slot of slots) {
      if (c.hero.cd[slot - 1] > 1e-7) continue;
      const charged = pattern === 'charged1';
      const cost = c.skillManaCost(slot, 1, charged);
      const before = c.hero.mp;
      const done = c.cast(slot, target.id, charged);
      if (done) {
        stats.success++;
        stats.totalMPSpent += Math.max(0, before - c.hero.mp);
      } else if (before + 1e-8 < cost) stats.deniedMP++;
      else stats.otherDenied++;
    }
    c.tick(0.1);
    assert(Number.isFinite(c.hero.mp) && c.hero.mp >= 0 && c.hero.mp <= c.hero.maxMp + 1e-7,
      cls + ' MP always finite and bounded');
    stats.minMP = Math.min(stats.minMP, c.hero.mp);
    if (c.hero.mp <= .01) stats.zeroMPSeconds += .1;
    if (c.hero.mp <= c.hero.maxMp * .35) stats.under35Seconds += .1;
    if (c.hero.mp >= c.hero.maxMp - .00001) stats.fullSeconds += .1;
    if ([9,49,99,199,299,449,599].includes(i))
      stats.checkpoints.push({ t: round((i + 1) / 10), mp: round(c.hero.mp),
        fraction: round(c.hero.mp / c.hero.maxMp) });
  }
  for (const key of ['zeroMPSeconds', 'under35Seconds', 'fullSeconds', 'minMP', 'totalMPSpent'])
    stats[key] = round(stats[key]);
  console.log('MP_AUDIT ' + JSON.stringify(stats));
}

for (const cls of classes) {
  // Exactly as a new player starts: the only unlocked skill is free.
  const initial = new Campaign('normal', cls, () => .9);
  assert.deepEqual(initial.hero.skills, [1, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(initial.skillManaCost(1), 0);
  const initialMP = initial.hero.mp;
  assert.equal(initial.cast(2), false);
  assert.equal(initial.hero.mp, initialMP);
  for (const ranger of [false, true])
    for (const pattern of ['basic', 'skill2', 'mixed', 'charged1'])
      arena(cls, ranger, pattern);
}

for (const cls of classes) {
  const c = new Campaign('normal', cls, () => .9);
  c.zone().enemies = [];
  c.updateEnemies = () => {};
  c.updateParty = () => {};
  c.hero.mp = c.hero.maxMp - 1;
  const ranger = c.activeLivingParty().find((u) => u.type === 'archer');
  assert(ranger);
  c.tick(.1);
  console.log('MP_IDLE ' + JSON.stringify({
    class: cls, startShortfall: 1, afterTickMP: round(c.hero.mp),
    max: c.hero.maxMp, rangerRecoveryActivated: ranger.manaCd > 0,
    recovering: c.hero.supportEffects.some(e => e.type === 'mana'),
  }));
}
console.log('PASS MP diagnostic: all class states remained finite and cost semantics held.');
