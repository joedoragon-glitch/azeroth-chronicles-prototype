'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');
const C = require('../src/prototype/engine.js');
function arena(family, cls = 'paladin', mode = 'normal', form = 'normal') {
  const c = new C(mode, cls, () => 0.87);
  const b = c.boss(family);
  c.enter(b.kind === 'dungeon' ? family : b.region);
  const p = c.safe(900, 900);
  const e = c.bossEnemy(b, form, p);
  c.zone().enemies = [e];
  Object.assign(c.hero, c.safe(e.x + 60, e.y));
  c.s.party.forEach((u) => Object.assign(u, c.safe(e.x + 100, e.y + 40)));
  c.s.mercyTime = 0;
  c.hero.hp = c.hero.maxHp = 10000;
  c.engage(e);
  return { c, e };
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare'])
    for (const form of ['normal', 'true']) {
      const { c, e } = arena('crypt', cls, mode, form);
      const built = c.buildBossAttack(e, 3, c.hero);
      const before = c.attackPatches(built.first);
      assert.equal(before.length, 2);
      assert.equal(c.attackPatches(built.sequence[0]).length, 2);
      built.first.name = 'Localized replacement';
      assert.deepEqual(
        c.attackPatches(built.first),
        before.map((p) => ({ ...p, name: built.first.name })),
      );
      // Dev.96's accepted reach change applies to Groundwork too. Keep an
      // independent reviewed number here instead of copying the resolver.
      assert(before.every((p) => Math.abs(p.radius - 86.4) < 1e-8));
      // Committed arenaPatches deliberately survive display/metadata changes.
      // Probe family dispatch with a fresh, unsnapshotted ordinary radius.
      const unrelated = {
        ...built.first,
        family: 'cindermaw',
        arenaPatches: undefined,
        radius: 123,
      };
      assert(
        c
          .attackPatches(unrelated)
          .every((p) => p.radius === 75 * C.rules.bossCadence.areaRangeMultiplier),
        'another family cannot inherit Groundwork geometry',
      );
      for (const action of ['disengage', 'travel', 'death', 'snapshot', 'restore']) {
        const { c, e } = arena('archive', cls, mode, form);
        const u = c.s.party.find((u) => u.type === 'archer');
        u.keeperHeld = e.id;
        e.hookedVictim = u.id;
        c.hero.deathRollHeld = true;
        e.deathRoll = { victim: 'hero', totalDamage: 100, life: 1, elapsed: 0, hits: 0 };
        e.ashCloud = { x: e.x, y: e.y, expires: c.s.time + 20 };
        e.ledgerOpen = true;
        c.hero.ashLastAt = c.s.time;
        c.hero.mireBogLastAt = c.s.time;
        e.telegraph = { kind: 'circle', timer: 2 };
        e.sequence = [{ kind: 'circle', timer: 2 }];
        c.s.projectiles = [{ sourceId: e.id, damage: 100 }];
        c.s.hazards = [{ sourceId: e.id, damage: 100 }];
        c.summonBossAdds(e, c.trueSummonPlan(e), c.bossSummonCap(e));
        const source = JSON.stringify(c.s);
        let result = c;
        if (action === 'disengage') c.disengage(e, 0.1);
        if (action === 'travel') c.enter('vale');
        if (action === 'death') {
          e.hp = 0;
          c.kill(e);
        }
        if (action === 'snapshot') {
          result = { s: c.snapshot() };
          assert.equal(JSON.stringify(c.s), source, 'snapshot cleanup cannot mutate live combat');
        }
        if (action === 'restore') {
          result = C.restore(c.s, () => 0.87);
          assert.equal(JSON.stringify(c.s), source, 'restore cannot mutate historical input');
        }
        const state = result.s;
        const enemy = state.zones.archive.enemies.find((u) => u.id === e.id);
        assert(!state.party.find((p) => p.id === u.id).keeperHeld, action + ': capture released');
        assert(!state.hero.deathRollHeld, action + ': roll released');
        assert(
          !enemy.telegraph && !enemy.motion && !enemy.sequence.length,
          action + ': no queued attack',
        );
        assert(
          !enemy.ashCloud && !enemy.ledgerOpen && !enemy.deathRoll,
          action + ': transient passives removed',
        );
        assert(
          !state.projectiles.length && !state.hazards.length,
          action + ': owned attacks cancelled',
        );
        assert(
          !state.zones.archive.enemies.some((u) => u.summon && u.owner === e.id),
          action + ': owned summons removed',
        );
        cases++;
      }
      const fatal = arena('mire', cls, mode, form);
      fatal.c.hero.hp = 1;
      fatal.e.deathRoll = { victim: 'hero', totalDamage: 300, life: 1.5, elapsed: 0, hits: 0 };
      fatal.c.hero.deathRollHeld = true;
      fatal.c.updateEnemies(0.5);
      assert.equal(fatal.c.s.statistics.deaths, 1, 'fatal roll causes one death');
      assert(!fatal.c.hero.deathRollHeld && !fatal.e.deathRoll);
      assert.equal(fatal.c.hero.slow, 0, 'old roll cannot slow revived hero');
      cases++;
    }
for (const zone of [
  'supply-vale',
  'supply-march',
  'supply-highlands',
  'supply-crown',
  'frontier',
]) {
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter(zone);
  const e = c.zone().enemies.find((e) => e.captain || e.roomCaptain);
  Object.assign(e, {
    captainPhase: true,
    captainPhaseMove: 1.35,
    captainAttackRate: 0.75,
    captainReflect: 8,
    captainPursuit: 2.5,
    captainGuard: 9,
    captainOvertimeCd: 12,
  });
  const raw = JSON.parse(JSON.stringify(c.s));
  const restored = C.restore(raw, () => 0.9);
  const clean = restored.zone().enemies.find((u) => u.id === e.id);
  assert(
    !clean.captainPhase && !clean.captainReflect && !clean.captainPursuit && !clean.captainGuard,
  );
  assert.equal(clean.captainPhaseMove, 1);
  assert.equal(clean.captainAttackRate, 1);
  clean.hp = clean.maxHp * C.rules.roomCaptains[clean.captainProfile].phase.threshold;
  assert(restored.triggerCaptainPhase(clean), 'restored captain gets one fresh phase');
  assert(!restored.triggerCaptainPhase(clean), 'phase never repeats within encounter');
  if (zone === 'supply-highlands') {
    assert.equal(clean.captainPhaseMove, 1.35);
    assert.equal(clean.captainAttackRate, 0.75);
    restored.startCaptainAttack(clean, restored.hero);
    assert.equal(clean.specialCd, C.rules.roomCaptains['supply-highlands'].specialCooldown * 0.75);
    assert(
      !restored.effects.some((f) => f.type === 'enemyVfx' && f.stage === 'windup' && !f.audioOnly),
      'anonymous cast does not expose VFX identity',
    );
  }
}
{
  const c = new C('normal', 'paladin', () => 0.9);
  c.enter('supply-vale');
  const e = c.zone().enemies.find((e) => e.captain);
  const a = {
    ...C.rules.roomCaptains['supply-vale'].attacks[0],
    index: 0,
    captainSkill: true,
    name: 'New approved name',
    target: { x: e.x, y: e.y },
    hit: [],
    life: 1,
  };
  e.motion = a;
  c.advanceMotion(e, 0.1);
  assert.equal(e.captainPursuit, 2.5, 'Hookfang slot survives display renaming');
  e.captainPursuit = 0;
  e.motion = { ...a, index: 1, life: 1 };
  c.advanceMotion(e, 0.1);
  assert.equal(e.captainPursuit, 0, 'another slot cannot inherit pursuit');
}
for (const file of fs
  .readdirSync(path.join(__dirname, 'fixtures/beta-history'))
  .filter((f) => f.endsWith('.gz'))) {
  const raw = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'fixtures/beta-history', file))),
  );
  const immutable = JSON.stringify(raw);
  const c = C.restore(raw, () => 0.9);
  const flags = ['normal', 'true', 'rescued', 'keys', 'paid', 'fieldBossKills', 'victories'];
  for (const field of flags) {
    if (raw[field])
      for (const [key, value] of Object.entries(raw[field]))
        assert.deepEqual(c.s[field][key], value, file + ': retain ' + field + '/' + key);
  }
  assert.equal(JSON.stringify(raw), immutable);
  const again = C.restore(c.snapshot(), () => 0.9);
  for (const field of flags)
    assert.deepEqual(again.s[field], c.s[field], file + ': idempotent ' + field);
}
console.log(
  'PASS snapshot lifecycle: ' +
    cases +
    ' class/mode/form boundaries, captain phases, stable slots and six historical saves',
);
