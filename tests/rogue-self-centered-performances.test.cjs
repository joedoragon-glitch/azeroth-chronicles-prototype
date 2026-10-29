'use strict';
// Self-centered Rogue performance contract: damage/bonuses stay unchanged;
// only the legal spatial footprint, cast origin and bounded VFX move.
const assert = require('node:assert/strict');
const Campaign = require('../src/prototype/engine.js');
const Visual = require('../src/prototype/hero-presentation.js');
const R = Campaign.rules;
assert.deepEqual(Object.keys(Campaign.classes), ['paladin', 'mage', 'ranger']);
Campaign.classes.rogue = { ...R.rogueHeroFoundation.stats, icon: 'bell' };
Campaign.talentProfiles.rogue = { ...R.rogueHeroFoundation.talents };
try {
  const expected = {
    1: [[225, 290]],
    2: [[225, 280]],
    3: [[225, 280]],
    4: [[225, 280]],
    5: [[220, 275]],
    6: [[225, 290]],
    7: [[225, 290]],
    8: [[240, 310]],
  };
  function arena() {
    const g = new Campaign('normal', 'rogue', () => 0.9);
    g.s.party = [];
    g.s.mercyTime = 0;
    g.s.valeFieldAwakened = true;
    Object.assign(g.hero, { x: 500, y: 500, order: null });
    g.zone().props = [];
    g.zone().buildings = [];
    const make = (name, x, y) => {
      const e = g.makeEnemy(
        { species: 'goblin', name, level: 1,
          hp: 100000, damage: 0, gold: 0, xp: 0 },
        { x, y },
      );
      e.aggro = true;
      e.returning = false;
      return e;
    };
    const primary = make('primary', 600, 500);
    const opposite = make('opposite', 400, 500);
    const near = g.unit('soldier', 420, 500);
    const far = g.unit('soldier', 830, 500);
    g.s.party = [near, far];
    g.zone().enemies = [primary, opposite];
    return { g, primary, opposite, near, far, make };
  }
  for (const [slotText, [[tapRadius, chargedRadius]]] of Object.entries(expected)) {
    const slot = +slotText;
    for (const charged of [false, true]) {
      const { g, primary, near, far } = arena();
      g.hero.skills[slot - 1] = 1;
      const radius = charged ? chargedRadius : tapRadius;
      const cfg = slot === 1
        ? g.rogueSkill1Config(charged)
        : R.roguePerformances[slot][charged ? 'charged' : 'tap'];
      assert.equal(cfg.radius, radius, 'authored radius ' + slot + '/' + charged);
      assert.equal(cfg.range, radius, 'acquisition circle equals performance radius');
      assert.equal(g.heroSkillRange(slot, charged), radius);
      assert(g.cast(slot, primary.id, charged), 'cast ' + slot + '/' + charged);
      const evt = g.effects.filter(e =>
        e.type === (slot === 1 ? 'rogueBellSkill1' : 'rogueBellPerformance')).at(-1);
      assert.equal(evt.x, g.hero.x, 'event centered on singer');
      assert.equal(evt.y, g.hero.y, 'event centered on dancer');
      assert.equal(evt.radius, radius, 'visual footprint matches gameplay');
      assert.equal(evt.target, primary.id, 'primary remains selected');
      assert.equal(slot === 1 ? evt.hits : evt.enemies, 2,
        'opposite-side foe inside performer circle is included');
      assert.equal(evt.allyCount ?? evt.allies, 1,
        'near active companion receives same performer-centered footprint');
      if (slot === 5) {
        assert(g.rogueStationProtection(g.hero), 'station protects singer at its origin');
        assert(g.rogueStationProtection(near), 'station covers nearby partner');
        assert.equal(g.rogueStationProtection(far), null,
          'remote companion is outside the station');
      }
      const projected = [];
      Visual.queue([evt], (f, type, seconds) =>
        projected.push({ ...f, type, max: seconds, life: seconds }));
      assert.equal(projected.length, 1, 'one area visual per performance');
      assert.equal(projected[0].stage, 'area');
      assert.equal(projected[0].radius, radius);
      assert.equal(projected[0].x, g.hero.x);
    }
  }
  // No target at the edge+1 means no remote cast, no free boon or cooldown.
  for (const slot of [1, 2, 5, 8]) {
    const { g, primary } = arena();
    g.hero.skills[slot - 1] = 1;
    const radius = g.heroSkillRange(slot, true);
    primary.x = g.hero.x + radius + 1;
    g.zone().enemies = [primary];
    const before = g.snapshot();
    assert.equal(g.cast(slot, primary.id, true), false,
      'no remote song past radius: slot ' + slot);
    assert.deepEqual(g.snapshot(), before, 'failed cast consumes no resources');
  }
  // A basic pulse reaches all directions rather than only a facing cone,
  // and the third hit is wider without changing primary/splash multipliers.
  const { g, primary, opposite, make } = arena();
  const outsideNormal = make('outer at 230', 500, 730);
  g.zone().enemies = [primary, opposite, outsideNormal];
  g.s.party = [];
  assert.equal(R.rogueHeroFoundation.basic.primaryMultiplier, 0.8);
  assert.equal(R.rogueHeroFoundation.basic.splashMultiplier, 0.25);
  assert.equal(R.rogueHeroFoundation.basic.secondaryCap, 2);
  assert.equal(R.rogueHeroFoundation.basic.finisherSecondaryCap, 4);
  for (let step = 1; step <= 3; step++) {
    g.hero.basicCd = 0;
    g.s.time += 0.85;
    assert(g.cast(1, primary.id, false, null, true));
    const evt = g.effects.filter(e => e.type === 'rogueBellBasic').at(-1);
    assert.equal(evt.x, g.hero.x);
    assert.equal(evt.y, g.hero.y);
    assert.equal(evt.combo, step);
    assert.equal(evt.radius, step === 3 ? 250 : 220);
    assert.equal(evt.splashHits, step === 3 ? 2 : 1,
      'splash uses circular radius with no extra targets');
    const projected = [];
    Visual.queue([evt], (f, type) => projected.push({ ...f, type }));
    assert.deepEqual(projected.map(e => e.stage), ['cast', 'area'],
      'one bounded cast cue and one self-centered shockwave');
    assert.equal(projected[1].x, g.hero.x);
    assert.equal(projected[1].radius, evt.radius);
  }
  assert(opposite.hp < opposite.maxHp, 'opposite-side enemy struck');
  assert(outsideNormal.hp < outsideNormal.maxHp,
    'third-hit wider circle reaches enemy at 230 units');
  assert.doesNotThrow(() => Campaign.validate(g.snapshot()));
  console.log('PASS Rogue 16 self-centered performances, station origin, full-circle auto and bounded VFX');
} finally {
  delete Campaign.classes.rogue;
  delete Campaign.talentProfiles.rogue;
}
