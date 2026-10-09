'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');

const cfg = C.rules.tacticalFoundation.burstCompression;
assert.equal(cfg.enabled, true);
assert.equal(cfg.model, 'soft-knee');
assert.equal(cfg.hardCap, false);
assert.equal(cfg.windowSeconds, 2);

const makeTarget = (tier, id = tier) => ({
  id, hp: 100000, maxHp: 1000, baseHp: 1000,
  type: tier === 'boss' || tier === 'trueBoss' ? 'boss' : 'mob',
  form: tier === 'trueBoss' ? 'true' : tier === 'ringleader' ? 'ringleader' : 'normal',
  captain: tier === 'captain', guard: tier === 'guardian',
});
const tiers = ['ordinary', 'guardian', 'ringleader', 'captain', 'boss', 'trueBoss'];
const previousTiers = {
  ordinary: { knee: 1.35, tail: 1.75 },
  guardian: { knee: 0.95, tail: 1.25 },
  ringleader: { knee: 0.7, tail: 0.95 },
  captain: { knee: 0.5, tail: 0.75 },
  boss: { knee: 0.36, tail: 0.55 },
  trueBoss: { knee: 0.29, tail: 0.48 },
};
const previousCurve = (raw, tier, hp = 1000) => {
  const { knee, tail } = previousTiers[tier], threshold = knee * hp, range = tail * hp;
  return raw <= threshold ? raw : threshold + range * Math.log1p((raw - threshold) / range);
};
// Doubling compression means halving the knee and logarithmic tail in every tier.
// That doubles curve sensitivity, not necessarily the *percentage* shaved off any given hit.
for (const tier of tiers) {
  assert.equal(cfg.tiers[tier].knee * 2, previousTiers[tier].knee, tier + ' threshold is halved');
  assert.equal(cfg.tiers[tier].tail * 2, previousTiers[tier].tail, tier + ' tail is halved');
  const c = new C(), raw = 1300;
  assert(c.tacticalCompressDamage(makeTarget(tier, 'doubled-' + tier), raw) < previousCurve(raw, tier),
    tier + ' has stronger real damage compression');
}
const ordinary = new C();
assert(ordinary.tacticalCompressDamage(makeTarget('ordinary', 'ordinary-fatal'), 1000) < 1000,
  'ordinary monster compression now begins before a full-health lethal burst');
const outputs = [];
for (const tier of tiers) {
  const c = new C();
  const e = makeTarget(tier);
  assert.equal(c.tacticalProtectionTier(e), tier);
  const applied = c.tacticalCompressDamage(e, 1300);
  assert(applied > 0 && applied <= 1300, tier + ': never immunity, healing, or extra damage');
  outputs.push(applied);
  // Every additional attack still has positive value; large attacks are not hard capped.
  const extra = c.tacticalCompressDamage(e, 200000);
  assert(extra > 0 && extra < 200000, tier + ': a huge attack still adds damage');
}
for (let i = 1; i < outputs.length; i++)
  assert(outputs[i] < outputs[i - 1], tiers[i] + ' is more burst resilient');

const c = new C();
const e = makeTarget('boss', 'window');
const first = c.tacticalCompressDamage(e, 120);
const second = c.tacticalCompressDamage(e, 120);
assert.equal(first, 120, 'normal hits below the stronger knee retain full value');
assert(second > 0 && second < 120, 'repeated hits in the window soften');
c.s.time += 2.01;
assert.equal(c.tacticalCompressDamage(e, 120), 120, 'expired hits leave the window');
c.tacticalClearBurst(e);
assert.equal(c.tacticalCompressDamage(e, 120), 120, 'disengagement clears the target window');

const x = new C();
const normal = makeTarget('boss', 'normal');
const exposed = makeTarget('boss', 'exposed');
exposed.open = 1;
assert(
  x.tacticalCompressDamage(exposed, 900) > x.tacticalCompressDamage(normal, 900),
  'an authored exposed boss opening remains rewarding',
);

// Verify the production shared damage resolver, not just the mathematical helper.
const d = new C();
d.s.party = [];
d.zone().props = [];
Object.assign(d.hero, { x: 900, y: 900 });
const boss = d.makeEnemy(
  { species: 'goblin', name: 'Burst probe', level: 1, hp: 10000,
    damage: 1, gold: 0, xp: 0 },
  { x: 940, y: 900 },
);
boss.type = 'boss';
boss.form = 'normal';
boss.family = 'thorn';
d.zone().enemies = [boss];
d.line = () => true;
assert(d.damage(boss, 3000, 'hero'));
assert(d.damage(boss, 3000, 'hero'));
assert(boss.hp > 4000 && boss.hp < 7000, 'shared production path compresses repeated boss burst');
assert(d._tacticalBurstWindow.has(boss.id));
d.disengage(boss, 0.1);
assert(!d._tacticalBurstWindow.has(boss.id), 'disengagement removes burst memory');
d.tacticalCompressDamage(boss, 1200);
assert(d._tacticalBurstWindow.has(boss.id));
d.enter('march');
assert.equal(d._tacticalBurstWindow.size, 0, 'region change clears previous encounters');
assert.equal(C.restore(d.snapshot())._tacticalBurstWindow, undefined,
  'rolling damage is never serialized');

console.log('PASS graduated tier curves, no hard cap, burst reset, boss opening and production damage');
