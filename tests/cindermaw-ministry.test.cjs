'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
const FX = require('../src/prototype/combat-visuals');
const VFX = require('../src/prototype/enemy-vfx');
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function scene(mode = 'normal', form = 'normal', cls = 'mage', succession = false, roost = false) {
  const c = new C(mode, cls, () => 0.9, { succession });
  c.s.party = [];
  c.s.mercyTime = 0;
  if (roost) c.enter('crown');
  const e = c.bossEnemy(
    c.boss('cindermaw'),
    form,
    // The shared mechanical arena must admit all four delegation approaches;
    // the former east approach now correctly intersects Greenwood's river.
    roost ? { x: 2200, y: 1750 } : c.safe(600, 900),
  );
  c.zone().enemies = [e];
  c.hero.hp = c.hero.maxHp = 1e6;
  c.hero.immune = 0;
  Object.assign(c.hero, c.safe(e.x + 70, e.y));
  c.engage(e, true, false);
  e.cd = e.summonCd = 1e6;
  c._tacticalRogueNext = new Map([[e.id, 1e6]]);
  return { c, e };
}
// Cordon's expanded footprint needs two real openings. Keep native terrain;
// the default roost anchor can reject this slot until Cindermaw relocates.
function positionForCordon(c, e) {
  assert.equal(c.zoneId, 'crown');
  const point = { x: 2260, y: 1750 };
  assert(!c.blocked(point.x, point.y, c.zoneId, 15), 'Cordon fixture body fits native terrain');
  assert(c.clearSegment(e, point, 15), 'the nearby Cordon origin is physically reachable');
  Object.assign(e, point);
  Object.assign(c.hero, c.safe(e.x + 70, e.y));
  assert(c.cinderGapPlan(e, c.hero), 'forced Cordon fixture has both native openings');
}
function cast(c, e, slot, resolve = true) {
  const built = c.buildBossAttack(e, slot, c.bossAttackTarget(e, c.hero, slot));
  assert(built.first, 'actual attack plan exists for slot ' + slot);
  if (slot === 0) {
    assert(Number.isFinite(built.first.gapAngle), 'forced ring has a valid first gap');
    assert(Number.isFinite(built.first.nextGap), 'forced ring has a valid second gap');
  }
  e.telegraph = built.first;
  e.sequence = built.sequence;
  if (resolve) {
    c.resolveAttack(e);
    e.telegraph = null;
  }
  return built.first;
}
function allies(c, e, count = 4) {
  c.summonBossAdds(e, c.trueSummonPlan(e), count);
  const units = c.bossOwnedSummons(e);
  for (const [i, u] of units.entries()) {
    Object.assign(
      u,
      c.safe(e.x + Math.cos((i * Math.PI) / 2) * 100, e.y + Math.sin((i * Math.PI) / 2) * 100),
    );
    u.cd = 1e6;
  }
  return units;
}
for (const mode of ['normal', 'nightmare'])
  for (const form of ['normal', 'true']) {
    // Cordon is a live contracting ring, with one real gap and exactly one change.
    {
      const { c, e } = scene(mode, form, 'mage', false, true);
      assert.equal(c.cinderGapPlan(e, c.hero), null, 'current roost origin cannot fit two gaps');
      assert.equal(c.bossAttackWeights(e, c.hero)[0], 0, 'real selector rejects invalid Cordon');
      positionForCordon(c, e);
      assert(c.bossAttackWeights(e, c.hero)[0] > 0, 'native valid placement restores eligibility');
      const a = cast(c, e, 0);
      assert.equal(FX.warningShapes(a, []).length, 1);
      const start = e.cinderCordon.radius,
        initialGap = a.gapAngle;
      const escaped = {
        x: a.x + Math.cos(initialGap) * (a.initialRadius + 39),
        y: a.y + Math.sin(initialGap) * (a.initialRadius + 39),
      };
      assert(c.clearSegment(e, escaped, 15), 'actual roost first wide gap has an exit');
      Object.assign(c.hero, {
        x: a.x + Math.cos(initialGap) * a.initialRadius,
        y: a.y + Math.sin(initialGap) * a.initialRadius,
      });
      const hp = c.hero.hp;
      c.s.time += 0.1;
      c.advanceCinderCordon(e, 0.1);
      assert.equal(c.hero.hp, hp, 'opening does not burn');
      assert(e.cinderCordon.radius < start);
      c.s.time += 0.8;
      c.advanceCinderCordon(e, 0.8);
      assert(e.cinderCordon.warning, 'future opening warning precedes the only switch');
      const nextExit = {
        x: a.x + Math.cos(a.nextGap) * (a.initialRadius + 39),
        y: a.y + Math.sin(a.nextGap) * (a.initialRadius + 39),
      };
      assert(c.clearSegment(e, nextExit, 15), 'actual roost second wide gap has an exit');
      c.s.time += 0.8;
      c.advanceCinderCordon(e, 0.8);
      assert.equal(e.cinderCordon.gapAngle, a.nextGap);
      Object.assign(c.hero, { x: a.x, y: a.y + 10 });
      c.s.time += 2;
      c.advanceCinderCordon(e, 2);
      assert(c.hero.hp < hp, 'actual final inner blast');
      assert(!e.cinderCordon);
    }
    // A physical marked lunge strips supported temporary defense, retaining gear/talents.
    {
      const { c, e } = scene(mode, form);
      c.hero.immune = 20;
      c.hero.tonic = true;
      c.hero.tonicBonus = 100;
      c.hero.maxHp += 100;
      c.hero.hp += 100;
      const talents = JSON.stringify(c.hero.talents),
        equipment = JSON.stringify(c.hero.equipment);
      const a = cast(c, e, 1),
        before = { x: e.x, y: e.y },
        hp = c.hero.hp;
      c.advanceMotion(e, 0.05);
      assert(distance(before, e) > 0 && distance(before, e) <= a.speed * 0.05 + 0.01);
      assert.equal(c.hero.immune, 0);
      assert.equal(c.hero.tonic, false);
      assert(c.hero.hp < hp);
      assert.equal(JSON.stringify(c.hero.talents), talents);
      assert.equal(JSON.stringify(c.hero.equipment), equipment);
    }
    // Protection actually mitigates and retaliates at most four times, expiring after3s.
    {
      const { c, e } = scene(mode, form),
        [u] = allies(c, e, 1);
      u.hp = u.maxHp = 10000;
      cast(c, e, 2);
      const hp = u.hp,
        heroHp = c.hero.hp;
      c.damage(u, 100, 'hero', { alreadyMitigated: true });
      assert.equal(hp - u.hp, 65);
      assert(c.hero.hp < heroHp);
      c.damage(u, 100, 'hero', { alreadyMitigated: true });
      assert.equal(e.cinderProtectionCast.reactions, 1, 'per-attacker cooldown');
      for (let n = 0; n < 5; n++) {
        c.s.time += 0.76;
        c.damage(u, 100, 'hero', { alreadyMitigated: true });
      }
      assert(!c.cinderProtection(u), 'actual expiry stops protection and retaliation');
      assert.equal(e.cinderProtectionCast.reactions, 4, 'bounded total retaliation');
      assert.doesNotThrow(() => c.damage(null, 1));
    }
    // Seven distinct frozen floor marks, one actual warning/strike at a time.
    {
      const { c, e } = scene(mode, form, 'mage', false, true);
      const a = cast(c, e, 3, false),
        plans = [a, ...e.sequence];
      assert.equal(plans.length, 7);
      assert.deepEqual(
        plans.map((p) => p.stage),
        [1, 2, 3, 4, 5, 6, 7],
      );
      assert(plans.every((p) => !c.blocked(p.x, p.y, c.zoneId, 15)));
      for (let i = 0; i < plans.length; i++)
        for (let j = i + 1; j < plans.length; j++) assert(distance(plans[i], plans[j]) >= 81);
      const hp = c.hero.hp;
      Object.assign(c.hero, { x: a.x, y: a.y });
      c.resolveAttack(e);
      assert(c.hero.hp < hp);
      assert.equal(c.advanceQueuedAttack(e).stage, 2);
    }
    // Healthiest actual party member, exact post-mitigation transfer to weakest living Ash.
    {
      const { c, e } = scene(mode, form),
        units = allies(c, e, 2),
        [weak, strong] = units;
      weak.hp = weak.maxHp / 3;
      strong.hp = strong.maxHp / 2;
      const a = cast(c, e, 4, false),
        hp = c.hero.hp,
        weakHp = weak.hp,
        strongHp = strong.hp;
      assert.equal(a.targetId, 'hero');
      c.resolveAttack(e);
      e.telegraph = null;
      assert(Math.abs(weak.hp - weakHp - Math.min(hp - c.hero.hp, weak.maxHp - weakHp)) < 1e-9);
      assert.equal(strong.hp, strongHp);
      c.hero.immune = 10;
      const protectedHp = weak.hp;
      cast(c, e, 4);
      assert.equal(weak.hp, protectedHp, 'zero actual damage gives zero heal');
      weak.hp = 0;
      c.hero.immune = 0;
      cast(c, e, 4);
      assert.equal(weak.hp, 0, 'dead ally is never revived');
    }
    // Delegation moves existing units from separate directions; no extra population.
    {
      const { c, e } = scene(mode, form),
        troops = allies(c, e, 4);
      const ids = c.zone().enemies.map((u) => u.id),
        homes = troops.map((u) => JSON.stringify(u.home));
      const a = cast(c, e, 5);
      assert.equal(a.delegates.length, 4);
      assert.equal(FX.warningShapes(a, []).length, 0, 'assembly is not false damage geometry');
      assert.equal(e.cinderDelegation.center.x, a.delegateCenter.x);
      let warnings = new Set(),
        moved = false,
        finishing = false;
      for (let n = 0; n < 350 && e.cinderDelegation; n++) {
        const before = troops.map((u) => ({ x: u.x, y: u.y }));
        c.s.time += 0.05;
        c.updateEnemies(0.05);
        troops.forEach((u, i) => {
          if (u.telegraph?.cinderDelegate) {
            warnings.add(u.id);
            assert.equal(VFX.describe(u, u.telegraph).id, 'boss/cindermaw/5');
            assert.equal(u.telegraph.charge, true);
          }
          const travel = distance(u, before[i]);
          moved ||= travel > 0.1;
          assert(travel <= C.rules.attacks.cindermaw[5].rushSpeed * 0.05 + 0.01);
        });
        finishing ||=
          e.telegraph?.cinderMechanic === 'finisher' || e.motion?.cinderMotion === 'finisher';
      }
      assert(moved);
      assert.equal(warnings.size, 4);
      assert(finishing);
      assert(!e.cinderDelegation);
      assert.deepEqual(
        c.zone().enemies.map((u) => u.id),
        ids,
      );
      assert.deepEqual(
        troops.map((u) => JSON.stringify(u.home)),
        homes,
      );
      assert(troops.every((u) => !u.cinderDelegate));
      cast(c, e, 5);
      const member = c.zone().enemies.find((u) => u.id === e.cinderDelegation.members[0]);
      member.slow = 1;
      c.s.time += 0.05;
      c.updateEnemies(0.05);
      assert(!e.cinderDelegation, 'real Slow disrupts remaining commands and finish');
      assert(troops.every((u) => !u.cinderDelegate));
      // A real Mage interrupt clears a delegate's warning before its next
      // update; the abandoned order must cancel rather than read a null timer.
      cast(c, e, 5);
      const first = troops.find((u) => u.id === e.cinderDelegation.members[0]);
      first.slow = 0;
      Object.assign(first, first.cinderDelegate.point);
      c.updateCinderDelegate(first, 0.05);
      assert(first.telegraph?.cinderDelegate);
      Object.assign(c.hero, c.safe(first.x + 25, first.y));
      c.hero.skills[2] = 1;
      c.hero.cd[2] = 0;
      assert(c.cast(3), 'Mage releases the actual interrupt');
      c.updateProjectiles(0.1); // The interrupt now requires bolt contact.
      assert.equal(first.telegraph, null);
      assert.doesNotThrow(() => c.updateCinderDelegate(first, 0.05));
      assert(!e.cinderDelegation, 'lost warning cancels the delegated sequence');
      assert(troops.every((u) => !u.cinderDelegate));
    }
    // Mutual Aid remains separate staff with existing Normal/TRUE caps.
    {
      const { c, e } = scene(mode, form);
      cast(c, e, 6);
      assert.equal(c.bossOwnedSummons(e).length, form === 'true' ? 8 : 6);
      assert(c.bossOwnedSummons(e).every((u) => u.name.includes('Ministry responder')));
    }
    console.log(
      'PASS ' +
        mode +
        '/' +
        form +
        ' seven actual ministerial moves, geometry, transfer, mitigation, directed physical sequence and staffing',
    );
  }

// Live snapshot must clear copies only; historical raw saves and every cancel boundary drop orders.
for (const boundary of ['snapshot', 'raw-restore', 'disengage', 'death', 'travel']) {
  const { c, e } = scene(),
    troops = allies(c, e, 4);
  // Use persistent native identities here: travel removes owned magical staff.
  for (const u of troops) {
    u.summon = false;
    delete u.owner;
  }
  cast(c, e, 2);
  cast(c, e, 0);
  cast(c, e, 5);
  const originalState = e.cinderDelegation;
  if (boundary === 'snapshot') {
    const s = c.snapshot();
    assert.equal(e.cinderDelegation, originalState);
    assert(!JSON.stringify(s).includes('cinderDeleg'));
    assert(!JSON.stringify(s).includes('cinderGuard'));
  } else if (boundary === 'raw-restore') {
    const restored = C.restore(JSON.parse(JSON.stringify(c.s)), () => 0.9);
    assert(
      restored
        .zone()
        .enemies.every(
          (u) => !u.cinderDelegate && !u.cinderGuard && !u.cinderCordon && !u.cinderDelegation,
        ),
    );
  } else {
    if (boundary === 'disengage') c.disengage(e, 0.05);
    if (boundary === 'death') c.damage(e, 1e9, 'hero');
    if (boundary === 'travel') c.enter('march');
    assert(!e.cinderDelegation && !e.cinderCordon);
    assert(
      troops.every((u) => !u.cinderDelegate && !u.cinderGuard),
      boundary,
    );
  }
}
console.log(
  'PASS transient ministry cleanup: live snapshot, historical restore, disengagement, death and travel',
);

{
  const { c, e } = scene();
  Object.assign(c.hero, c.safe(e.x + 200, e.y), { immune: 30 });
  cast(c, e, 1);
  c.zone().props.push({ x: e.x + 35, y: e.y, r: 18, solid: true, type: 'rock' });
  const original = { x: e.x, y: e.y },
    hp = c.hero.hp;
  c.advanceMotion(e, 0.2);
  assert.equal(distance(original, e), 0, 'blocked straight rush never slides into a false lane');
  assert.equal(c.hero.immune, 30, 'blocked contact cannot dispel');
  assert.equal(c.hero.hp, hp);
  assert(!e.motion);
}

let fatalities = 0;
for (const mode of ['normal', 'nightmare'])
  for (const form of ['normal', 'true'])
    for (const cls of ['paladin', 'mage', 'ranger'])
      for (const succession of [false, true])
        for (const kind of ['cordon', 'distraint', 'equalisation', 'delegation', 'retaliation']) {
          const { c, e } = scene(mode, form, cls, succession, kind === 'cordon');
          if (kind === 'cordon') positionForCordon(c, e);
          const troops = allies(c, e, 4);
          c.hero.hp = 1;
          c.hero.immune = 0;
          e.damage = 1e6;
          if (kind === 'cordon') {
            const a = cast(c, e, 0),
              angle = a.nextGap + Math.PI;
            Object.assign(c.hero, { x: e.x + Math.cos(angle) * 10, y: e.y + Math.sin(angle) * 10 });
            c.advanceCinderCordon(e, 3.3);
          }
          if (kind === 'distraint') {
            cast(c, e, 1);
            c.advanceMotion(e, 0.1);
          }
          if (kind === 'equalisation') {
            const weak = troops[0];
            weak.hp = weak.maxHp / 3;
            const hp = weak.hp;
            cast(c, e, 4);
            assert.equal(weak.hp, hp, 'fatal recovery cannot apply old transfer heal');
          }
          if (kind === 'delegation') {
            cast(c, e, 5);
            for (let n = 0; n < 200 && !c.s.statistics.deaths; n++) {
              c.s.time += 0.05;
              c.updateEnemies(0.05);
            }
          }
          if (kind === 'retaliation') {
            cast(c, e, 2);
            c.damage(troops[0], 100, 'hero', { alreadyMitigated: true });
          }
          assert.equal(c.s.statistics.deaths, 1, kind + ': one real death');
          assert(
            !e.cinderDelegation &&
              !e.cinderCordon &&
              !e.cinderProtectionCast &&
              !e.motion &&
              !e.telegraph,
            kind + ': no stale boss attack after death',
          );
          assert(
            troops.every((u) => !u.cinderDelegate && !u.cinderGuard),
            kind + ': no old ally commands after recovery',
          );
          assert.equal(c.s.challenge.pending, succession);
          fatalities++;
        }
console.log('PASS ' + fatalities + ' real ministerial fatal class/mode/form/Succession boundaries');

// Use the real selector and warning/queue bridge, without forcing a slot sequence.
const seen = new Set();
for (const form of ['normal', 'true']) {
  const { c, e } = scene('normal', form, 'mage', false, true);
  let seed = 17861;
  c.random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  c.summonBossAdds(e, c.trueSummonPlan(e), c.bossSummonCap(e));
  for (const [j, u] of c.bossOwnedSummons(e).entries()) {
    Object.assign(
      u,
      c.safe(e.x + Math.cos((j * Math.PI) / 3) * 100, e.y + Math.sin((j * Math.PI) / 3) * 100),
    );
    u.hp = u.maxHp * 0.2;
    u.cd = 1e6;
    c._tacticalRogueNext.set(u.id, 1e6);
  }
  e.cd = 0;
  e.summonCd = 0;
  e.basicDue = false;
  const first = c.bossOwnedSummons(e)[0];
  Object.assign(first, c.safe(c.hero.x + 30, c.hero.y));
  assert(c.damage(first, 1e6, 'hero'), 'live pilot creates an actual vacant staff place');
  for (let n = 0; n < 3600; n++) {
    if (n === 800) c.damage(c.bossOwnedSummons(e)[0], 1e6, 'hero');
    c.s.time += 0.05;
    c.updateEnemies(0.05);
    if (
      e.telegraph?.family === 'cindermaw' &&
      !e.telegraph.rogueMove &&
      Number.isInteger(e.telegraph.index)
    )
      seen.add(e.telegraph.index);
    c.hero.hp = c.hero.maxHp;
    for (const u of c.bossOwnedSummons(e)) {
      u.hp = u.maxHp * 0.2;
      if (!u.cinderDelegate) u.cd = 1e6;
    }
  }
}
assert.deepEqual(
  [...seen].sort(),
  [0, 1, 2, 3, 4, 5, 6],
  'actual contextual scheduler observes every regular move',
);
console.log(
  'PASS unforced live Cindermaw selector observed all seven regular slots in actual roost',
);
