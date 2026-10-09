'use strict';
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine');

const classes = ['paladin', 'mage', 'ranger'];
function arena(heroClass) {
  const c = new Campaign('normal', heroClass, () => 0.9);
  c.s.party = [];
  c.zone().props = [];
  Object.assign(c.hero, { x: 500, y: 500 });
  const target = c.makeEnemy(
    { species: 'goblin', name: 'Mana audit target', level: 1, hp: 100000, damage: 0, gold: 0, xp: 0 },
    { x: 580, y: 500 },
  );
  c.zone().enemies = [target];
  c.hero.skills = Array(8).fill(1);
  c.hero.cd = Array(8).fill(0);
  c.hero.hp = c.hero.maxHp - 40;
  return { c, target };
}

// Costs, cooldowns, and refusal to cast are one shared contract for all classes.
for (const cls of classes) {
  const initial = new Campaign('normal', cls, () => 0.9);
  assert.equal(initial.hero.maxMp, Campaign.classes[cls].mp, cls + ' starting MP');
  for (const [slot, charged] of [
    ...Array.from({ length: 8 }, (_, i) => [i + 1, false]),
    [1, true], [2, true], [3, true],
  ]) {
    const label = cls + ' Skill ' + slot + (charged ? ' charged' : ' normal');
    const { c, target } = arena(cls);
    const cost = c.skillManaCost(slot, 1, charged);
    assert(Number.isInteger(cost) && cost >= 0, label + ' valid cost');
    if (charged) assert.equal(cost, Math.ceil(c.hero.maxMp * Campaign.rules.chargedSkills.manaFractions[slot]));
    c.hero.mp = cost;
    assert(c.cast(slot, target.id, charged), label + ' should cast with exact MP');
    assert.equal(c.hero.mp, 0, label + ' deducted once');
    assert.equal(c.hero.cd[slot - 1], Campaign.rules.balance.skills.cooldowns[slot], label + ' cooldown');
    assert(!c.cast(slot, target.id, charged), label + ' cannot immediately cast twice');
    assert.equal(c.hero.mp, 0, label + ' second attempt did not charge again');
    if (cost > 0) {
      const denied = arena(cls);
      denied.c.hero.mp = cost - 0.01;
      assert(!denied.c.cast(slot, denied.target.id, charged), label + ' refuses insufficient MP');
      assert.equal(denied.c.hero.mp, cost - 0.01, label + ' refusal preserves MP');
      assert.equal(denied.c.hero.cd[slot - 1], 0, label + ' refusal preserves cooldown');
      assert.equal(denied.c.s.projectiles.length, 0, label + ' refusal launches no projectile');
    }
  }
  const basic = arena(cls);
  basic.c.hero.mp = 0;
  assert(basic.c.cast(1, basic.target.id), cls + ' can use ordinary basic attack with zero MP');
}
console.log('PASS all three classes: skill costs, no double charge, cooldowns and no-MP rejection');

for (const cls of classes) {
  const c = new Campaign('normal', cls, () => 0.9);
  c.zone().enemies = [];
  c.hero.talents[1] = 5;
  const talentMana = Campaign.rules.balance.disciplines.profiles[cls].mana;
  assert.equal(c.manaRegenRate(), 2.5 + 5 * talentMana * 0.25, cls + ' out-of-combat talent regen');
  const hostile = c.makeEnemy(
    { species: 'goblin', name: 'Mana pressure', level: 1, hp: 10000, damage: 0, gold: 0, xp: 0 },
    { x: c.hero.x + 80, y: c.hero.y },
  );
  hostile.aggro = true;
  c.zone().enemies = [hostile];
  assert.equal(c.manaRegenRate(), 1 + 5 * talentMana * 0.125, cls + ' combat talent regen');
  c.hero.mp = c.hero.maxMp - 0.1;
  c.zone().enemies = [];
  c.updateEnemies = () => {};
  c.tick(1);
  assert.equal(c.hero.mp, c.hero.maxMp, cls + ' passive regen caps at max MP');
}
console.log('PASS all three classes: talented regeneration and MP cap');

{
  const c = new Campaign('normal', 'mage', () => 0.9);
  const ranger = c.s.party.find((u) => u.type === 'archer');
  assert(ranger, 'starting active Ranger exists');
  c.hero.mp = 0;
  assert(c.rangerSupport('mana'), 'Ranger recovery starts');
  assert(!c.rangerSupport('mana'), 'same recovery cannot stack before completion');
  assert.equal(c.hero.mp, 0, 'recovery is not instantaneous');
  c.updateRangerSupport(5);
  assert.equal(c.hero.mp, 40, 'Rank 1 restores 40 MP over five seconds');
  assert(!c.hasSupportEffect(c.hero, 'mana'), 'finished effect is removed');
  ranger.manaCd = 0;
  c.hero.mp = c.hero.maxMp - 1;
  assert(c.rangerSupport('mana'), 'recovery starts when nearly full');
  c.updateRangerSupport(5);
  assert.equal(c.hero.mp, c.hero.maxMp, 'Ranger restoration never overfills MP');

  const old = c.snapshot();
  old.hero.mp = 10;
  old.hero.supportEffects = [{ type: 'mana', remaining: 40, seconds: 0 }];
  const restored = Campaign.restore(old);
  restored.updateRangerSupport(1);
  assert.equal(restored.hero.mp, 10, 'expired saved effect cannot corrupt hero mana');
  assert(Number.isFinite(restored.hero.mp));
  assert.equal(restored.hero.supportEffects.length, 0, 'expired saved effect is discarded');
}
console.log('PASS Ranger restoration, nonstacking, cap and expired-save recovery');

{
  const c = new Campaign('normal', 'mage', () => 0.9);
  c.enter('citadel');
  const fountain = c.zone().npcs.find((n) => n.kind === 'fountain');
  assert(fountain, 'authored restoration fountain exists');
  c.zone().enemies = [];
  c.s.pending = {};
  Object.assign(c.hero, { x: fountain.x, y: fountain.y, mp: 1 });
  const gain = Math.min(c.hero.maxMp, 1 + c.hero.maxMp * 0.6);
  assert(c.interact(fountain), 'cleared fountain is usable');
  assert.equal(c.hero.mp, gain, 'fountain restores 60% max MP');
  assert(!c.interact(fountain), 'fountain cannot be reused');
  const saved = Campaign.restore(c.snapshot());
  assert(saved.s.fountains.citadel, 'one-time fountain consumption persists');
}
console.log('PASS fountain MP restoration and one-time persistence');

{
  const c = new Campaign('normal', 'mage', () => 0.9);
  c.hero.mp = 4;
  assert.equal(c.drainMana(c.hero, 0.12), 4, 'magical drain only consumes remaining MP');
  assert.equal(c.hero.mp, 0, 'mana drain floors at zero');
  assert.equal(c.drainMana(c.hero, 0.12), 0, 'empty MP cannot be drained again');
  assert.equal(c.hero.mp, 0);
}
console.log('PASS magical drain floors at zero');
