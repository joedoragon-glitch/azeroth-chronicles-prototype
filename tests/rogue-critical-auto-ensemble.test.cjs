'use strict';
// A critical automatic song pulse is a short, non-stacking shared performance.
// It is separate from manual Skill 1, has no extra critical/Charm roll and does
// not alter same-strike hostile damage or existing primary-only Charm eligibility.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Critical = require('../src/prototype/critical-executions.js');
const Levels = require('../src/prototype/critical-levels.js');
const Native = require('../src/prototype/critical-party-native.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: 'bell' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };

function arena(critical = true) {
  const g = new Campaign('normal', 'rogue', () => 0.9);
  g.s.party = [];
  g.s.mercyTime = 0;
  g.s.valeFieldAwakened = true;
  Object.assign(g.hero, { x: 500, y: 500, order: null });
  g.zone().props = [];
  g.zone().buildings = [];
  g.hero.skills[0] = 1;
  const primary = g.makeEnemy({
    species: 'goblin', name: 'Practice foe', level: 1,
    hp: 1000000, damage: 0, gold: 0, xp: 0,
  }, { x: 590, y: 500 });
  primary.aggro = true;
  g.zone().enemies = [primary];
  const near = g.unit('soldier', 420, 500);
  const edge = g.unit('soldier', 735, 500);
  const far = g.unit('soldier', 770, 500);
  const blocked = g.unit('soldier', 500, 600);
  const dead = g.unit('soldier', 520, 520);
  const reserve = g.unit('soldier', 525, 520);
  dead.hp = 0;
  reserve.active = false;
  g.s.party = [near, edge, far, blocked, dead];
  const line = g.line.bind(g);
  g.line = (a, b) => b === blocked ? false : line(a, b);
  let samples = 0, charms = 0;
  g._criticalPartyNative = Native.createSession(Critical, Levels, {
    enabled: true, stream: { next() { samples++; return critical ? 0 : 0.99; } },
  });
  // Count original primary-only attempts without making capture probability
  // decide which legal attacks remain available in this critical-buff test.
  g.rogueCharmAttempt = () => { charms++; return false; };
  return { g, primary, near, edge, far, blocked, dead, reserve,
    samples: () => samples, charms: () => charms };
}
function basic(g, primary) {
  g.hero.basicCd = 0;
  return g.cast(1, primary.id, false, null, true);
}
const { seconds, basicDamage } = R.rogueHeroFoundation.basic.criticalCadence;
assert.equal(seconds, 1.25);
assert.equal(basicDamage, 0.02);
assert.equal(Levels.ACTIONS['hero/rogue/auto'].lever, 'damage');
try {
  {
    const a = arena();
    const { g, near, edge, far, blocked, dead, reserve, primary } = a;
    assert(basic(g, primary), 'legal critical basic hits');
    assert.equal(a.samples(), 1, 'exactly one native critical roll');
    assert.equal(a.charms(), 1, 'only original primary has one Charm attempt');
    for (const u of [g.hero, near]) {
      const buff = g.rogueSongBoon(u, 'cadence');
      assert(buff, 'self and near ally receive the same critical cadence');
      assert.equal(buff.basicDamage, basicDamage);
      assert.equal(buff.until, g.s.time + seconds);
    }
    for (const u of [edge, far, blocked, dead, reserve])
      assert.equal(g.rogueSongBoon(u, 'cadence'), null,
        'out-of-range, blocked, fallen and reserve units do not receive cadence');
    assert.equal(g.companionBasicAttackDamage(near),
      g.companionAttackDamage(near) * (1 + basicDamage));
    assert.equal(g.companionBasicAttackDamage(far),
      g.companionAttackDamage(far), 'remote companion cannot benefit');
    assert(!JSON.stringify(g.snapshot()).includes('cadence'),
      'temporary critical boon is not saved');
    g.s.time += seconds + 0.01;
    assert.equal(g.rogueSongBoon(g.hero, 'cadence'), null, 'self buff expires');
    assert.equal(g.rogueSongBoon(near, 'cadence'), null, 'ally buff expires');
    assert.equal(g.companionBasicAttackDamage(near), g.companionAttackDamage(near),
      'no residual damage boost after expiration');
  }
  {
    const a = arena(false), { g, primary, near } = a;
    assert(basic(g, primary));
    assert.equal(a.samples(), 1, 'noncritical legal action still rolls exactly once');
    assert.equal(g.rogueSongBoon(g.hero, 'cadence'), null);
    assert.equal(g.rogueSongBoon(near, 'cadence'), null);
  }
  {
    const a = arena(), { g, primary, near } = a;
    g.damage = () => false;
    assert(basic(g, primary), 'action may release without a landed hit');
    assert.equal(a.samples(), 1);
    assert.equal(a.charms(), 0, 'misses cannot attempt Charm');
    assert.equal(g.rogueSongBoon(g.hero, 'cadence'), null);
    assert.equal(g.rogueSongBoon(near, 'cadence'), null);
  }
  {
    const a = arena(), { g, primary, edge, far } = a;
    for (let step = 1; step <= 3; step++) {
      g.s.time += 0.85;
      assert(basic(g, primary));
      assert.equal(a.samples(), step, 'one critical receipt for each combo action');
      const evt = g.effects.filter(e => e.type === 'rogueBellBasic').at(-1);
      assert.equal(evt.combo, step);
      assert.equal(g.rogueSongBoon(edge, 'cadence') !== null, step === 3,
        '235-unit friend gains cadence only on the wider third-hit finisher');
      assert.equal(g.rogueSongBoon(far, 'cadence'), null);
    }
    assert.equal(a.charms(), 3, 'finisher still has just one primary Charm attempt');
  }
  {
    const a = arena(), { g, primary, near } = a;
    assert(g.cast(1, primary.id), 'manual Skill 1 active');
    assert.equal(g.rogueSongBoon(g.hero, 'refrain')?.basicDamage, 0.05);
    assert.equal(g.companionBasicAttackDamage(near),
      g.companionAttackDamage(near) * 1.05);
    g.s.time += 3.9;
    assert(basic(g, primary), 'critical auto while stronger refrain active');
    assert.equal(g.rogueSongBoon(g.hero, 'refrain')?.basicDamage, 0.05);
    assert.equal(g.companionBasicAttackDamage(near),
      g.companionAttackDamage(near) * 1.05,
      'critical cadence does not stack additively onto manual refrain');
    g.s.time += 0.11;
    assert.equal(g.rogueSongBoon(g.hero, 'refrain'), null,
      'critical basic does not extend stronger manual refrain');
    assert.equal(g.rogueSongBoon(g.hero, 'cadence')?.basicDamage, basicDamage);
    assert.equal(g.companionBasicAttackDamage(near),
      g.companionAttackDamage(near) * (1 + basicDamage));
    const before = a.samples();
    g.hero.basicCd = 100;
    assert.equal(g.cast(1, primary.id, false, null, true), false);
    assert.equal(a.samples(), before, 'invalid basic never spends critical roll');
  }
  console.log('PASS Rogue landed auto crit cadence: self+ally radius/LOS, combo finisher, expiry, no extra RNG/Charm, Skill 1 isolation');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
