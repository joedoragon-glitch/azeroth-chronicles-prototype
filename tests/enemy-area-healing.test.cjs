'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const g = new C('normal', 'mage', () => 0.9);
g.enter('supply-vale');
const z = g.zone();
z.enemies = [];
const add = (species, x, hp = 400, extra = {}) => {
  const e = g.makeEnemy(
    { species, name: species, level: 1, hp: 1000, damage: 10, gold: 0, xp: 0 },
    { x, y: 300 },
  );
  Object.assign(e, { hp, aggro: true, ...extra });
  z.enemies.push(e);
  return e;
};
const healer = add('goblin', 300, 1000, { ranged: true });
const first = add('wolf', 330);
const second = add('ogre', 400, 500);
const outside = add('goblin', 651);
const covered = add('goblin', 340);
const healthy = add('goblin', 340, 1000);
const dead = add('goblin', 340, 0);
const returning = add('goblin', 340, 400, { returning: 1 });
g.line = (_, target) => target !== covered;
assert(g.enemySupportHeal(healer));
assert(first.supportHeal && second.supportHeal, 'One cast heals multiple injured hostile species');
assert(!healer.supportHeal, 'Ordinary healer retains its existing no-self-heal restriction');
for (const e of [outside, covered, healthy, dead, returning])
  assert(!e.supportHeal, e.name + ' retains range/cover/health/alive/returning eligibility');
assert.equal(healer.supportHealCd, 7, 'Ordinary area cast spends seven seconds');
assert.equal(first.supportHeal.seconds, 3);
assert.equal(
  first.supportHeal.remaining,
  600,
  'Each target receives all HP missing at cast time',
);
assert.equal(second.supportHeal.remaining, 500);
assert.equal(
  g.effects.filter((e) => e.type === 'heal').length,
  2,
  'Each real recipient has its existing recovery cue',
);
assert(!g.enemySupportHeal(healer));
healer.supportHealCd = 0;
assert(!g.enemySupportHeal(healer), 'Existing active healing is not stacked or restarted');
assert.equal(healer.supportHealCd, 0, 'No eligible recipients means no spent cooldown');
for (const e of [first, second]) {
  const hp = e.hp;
  g.advanceEnemySupportHeal(e, 1);
  assert(Math.abs(e.hp - hp - (e.maxHp - hp) / 3) < 1e-8, 'Both receive proportional full-heal pulses');
  g.advanceEnemySupportHeal(e, 2);
  assert.equal(e.hp, e.maxHp);
  assert(!e.supportHeal);
}
// A leader's area includes its eligible self without creating new self-healing roles.
// Earlier full treatments ended, so these ordinary recipients must be wounded again.
first.hp = 400;
second.hp = 500;
Object.assign(healer, { form: 'ringleader', ringleaderHealthVersion: 3, hp: 400 });
assert(g.enemySupportHeal(healer));
assert(healer.supportHeal && first.supportHeal && second.supportHeal);
assert.equal(healer.supportHealCd, 7);
assert.equal(healer.supportHeal.remaining, 600, 'Ringleader receives full missing-health treatment');
const saved = g.snapshot();
assert(saved.zones[saved.zone].enemies.every((e) => !e.supportHeal && !e.supportHealCd));
assert(C.restore(saved), 'Area healing keeps the existing v4 transient-state policy');
console.log(
  'PASS enemy area healing: multiple recipients, same amount/duration/cooldown, cover/range/threshold, no stacking, self roles and save compatibility',
);
