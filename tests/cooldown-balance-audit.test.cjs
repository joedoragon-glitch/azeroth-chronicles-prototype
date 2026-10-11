'use strict';
const assert = require('node:assert/strict');
const { throughput, fight, fixture, meter } = require('../scripts/cooldown-balance-audit.cjs');
const tier = { level: 30, skill: 8, gear: 4, slots: 8 };
const g = fixture('mage', tier, 0, 'nightmare', 113, 'solo');
const e = g.bossEnemy(g.boss('thorn'), 'normal', { x: 1000, y: 1000 });
g.zone().enemies = [e];
g.zone();
// Reproduce a production disengagement's unscaled HP before re-engagement.
e.maxHp = e.hp = e.baseHp;
const observed = meter(g, e),
  before = e.hp;
assert(g.damage(e, 10));
assert.equal(observed.damage, 10, 'normalization cannot hide actual damage');
assert(e.hp > before, 'this hit has a positive net HP delta despite dealing damage');
assert.equal(observed.normalizationHpDelta, e.hp - before + 10);
assert.equal(observed.siphon, 0);
for (const cls of ['paladin', 'mage', 'ranger']) {
  for (const rank of [0, 5]) {
    const basic = throughput(cls, tier, rank, 1, false);
    const charged = throughput(cls, tier, rank, 1, true);
    assert(basic.dps > charged.dps, cls + ': sustained single-target combo retains its purpose');
    const area = throughput(cls, tier, rank, 2, true, 6);
    assert(area.casts <= Math.ceil(120 / (area.cooldown + 0.65)), 'charge hold consumes time');
    const heal = throughput(cls, tier, rank, 3, true);
    const self = throughput(cls, tier, rank, 3, false);
    assert(heal.hps < self.hps, 'party healing trades away rapid hero self-healing');
    assert(Math.abs(heal.partyHps - heal.hps * 6) < 0.001, 'each living companion gets one heal');
    assert(heal.casts <= Math.ceil(120 / (heal.cooldown + 0.65)));
  }
}
const config = {
  cls: 'mage',
  level: 6,
  family: 'thorn',
  form: 'true',
  rank: 5,
  mode: 'normal',
  party: 'mixed',
  seed: 113,
};
const first = fight(config);
assert.deepEqual(fight(config), first, 'a recorded seed replays the full production encounter');
assert(first.resets > 0, 'exercise the historical encounter reset');
assert(first.resetHpDelta > 0);
assert.equal(first.siphon, 0, 'Thornfang is not a life-stealer');
assert.equal(first.recovery, 0);
assert.equal(
  first.unaccountedHpGain,
  first.died ? null : 0,
  'defeat resets are censored rather than mislabeled as healing',
);
const normal = fight({ ...config, form: 'normal' });
assert(normal.won);
assert.equal(normal.unaccountedHpGain, 0, 'surviving encounter accounting balances exactly');
assert(first.summons > 0, 'production summons are exercised and counted');
assert.notDeepEqual(fight({ ...config, seed: 271 }), first, 'different seeds explore different AI');
for (const [level, region] of [
  [6, 'vale'],
  [16, 'highlands'],
  [30, 'crown'],
]) {
  const pack = fight({ ...config, level, family: 'pack-' + region, form: 'normal' });
  assert(pack.damage > 0, 'authored ordinary enemies remain available in ' + region);
  assert.equal(pack.unaccountedHpGain, 0);
}
console.log(
  'PASS repeatable combat audit, charge opportunity costs, six-unit heal accounting, summons and reset attribution',
);
