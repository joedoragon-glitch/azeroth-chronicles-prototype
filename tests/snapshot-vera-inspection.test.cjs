'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine.js');
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function make(cls = 'paladin', mode = 'normal', seed = 1) {
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const c = new C(mode, cls, random);
  c.enter('crown');
  c.s.party = [];
  c.s.mercyTime = 10;
  const e = c.zone().enemies.find((u) => u.family === 'cindermaw'),
    n = c.veraCaptive();
  const guards = c.zone().enemies.filter((u) => n.escortGuardIds.includes(u.id));
  c.zone().enemies = [e, ...guards];
  return { c, e, n, guards, random };
}
function step(c, e, n, dt = 0.2) {
  const actors = [e, n, ...c.zone().enemies.filter((u) => u.veraEscort)],
    before = actors.map((u) => ({ x: u.x, y: u.y, aggro: u.aggro }));
  c.s.time += dt;
  c.updateEnemies(dt);
  actors.forEach((u, i) => {
    assert(
      d(u, before[i]) <= (u === e ? 90 : u === n ? 230 : 175) * dt + 1e-6 ||
        (u.veraEscort && (before[i].aggro || u.aggro)),
      'bounded physical movement ' +
        u.id +
        ' ' +
        JSON.stringify({
          before: before[i],
          after: { x: u.x, y: u.y },
          home: u.home,
          returning: u.returning,
          aggro: u.aggro,
          held: c.veraHeld(),
        }),
    );
    const corner = { x: u.x, y: before[i].y };
    assert(
      c.clearSegment(before[i], u) ||
        (c.clearSegment(before[i], corner) && c.clearSegment(corner, u)),
      'collision-safe direct or existing x/y slide movement ' + u.id,
    );
    assert(!c.blocked(u.x, u.y), 'outside solids ' + u.id);
  });
}
const all = new Set();
let paths = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare']) {
    let { c, e, n, guards, random } = make(cls, mode, paths + 11);
    const population = c.zone().enemies.length;
    assert.equal(guards.length, 2);
    assert.equal(n.presentation, 'mobile-forge');
    assert(!c.combatTargets().includes(n));
    const stops = c.cinderInspectionStops();
    for (const a of stops)
      for (const b of stops) {
        assert(c.route(a, b).length, `${a.name} -> ${b.name}`);
        paths++;
      }
    const visited = new Set();
    for (let i = 0; i < 1200; i++) {
      step(c, e, n);
      visited.add(e.cinderStop ?? 0);
      all.add(e.cinderStop ?? 0);
    }
    assert(visited.size >= 3, 'natural variable schedule reaches at least three facilities');
    assert.equal(c.zone().enemies.length, population, 'no escort spawns');
    assert(d(e, n) <= 185, 'mobile forge keeps up');
    assert.equal(
      new Set(
        c
          .zone()
          .npcs.filter((u) => u.family === 'cindermaw')
          .map((u) => u.id),
      ).size,
      1,
    );
    // Real opener far from original roost, and joint physical return after reload.
    for (let i = 0; i < 1400 && d(e, e.home) < 900; i++) step(c, e, n);
    assert(d(e, e.home) > 900);
    Object.assign(c.hero, c.safe(e.x + 50, e.y));
    c.s.mercyTime = 0;
    const hp = e.hp;
    assert(c.damage(e, 10));
    assert(e.hp < hp);
    assert.deepEqual(e.cinderFightAnchor, { x: e.x, y: e.y });
    assert(c.tacticalRogueLeashAllows(e, c.hero, 700));
    const before = JSON.stringify(c.s),
      snap = c.snapshot();
    assert.equal(JSON.stringify(c.s), before);
    assert.equal(snap.zones.crown.enemies.find((u) => u.id === e.id).x, e.x);
    c = C.restore(snap, random);
    e = c.zone().enemies.find((u) => u.family === 'cindermaw');
    n = c.veraCaptive();
    assert(e.cinderReturn);
    assert(!e.cinderFightAnchor);
    assert.equal(n.id, 'cage-cindermaw');
    // Retreat to a real civilian service point while the convoy returns.
    Object.assign(c.hero, c.safe(300, 350));
    for (let i = 0; i < 2500 && (e.cinderReturn || e.returning); i++) step(c, e, n);
    assert(
      !e.cinderReturn && !e.returning,
      'joint home return completed ' +
        JSON.stringify({
          boss: { x: e.x, y: e.y, home: e.home, path: e.path, returning: e.returning },
          npc: { x: n.x, y: n.y, path: n.path },
          guards: c
            .zone()
            .enemies.filter((u) => u.veraEscort)
            .map((u) => ({
              id: u.id,
              x: u.x,
              y: u.y,
              path: u.path,
              returning: u.returning,
              aggro: u.aggro,
            })),
          hero: { x: c.hero.x, y: c.hero.y },
          together: c.cinderEntourageTogether(e),
        }),
    );
    assert(d(e, e.home) < 1e-6);
    assert(d(e, n) <= 180);
    assert.equal(e.hp, e.baseHp);
    // Original independent key, rewards/services, one same-ID captive.
    Object.assign(c.hero, c.safe(e.x + 40, e.y));
    assert(c.damage(e, 1e6));
    assert(c.s.keys.cindermaw);
    const wait = { x: n.x, y: n.y };
    // Guard combat remains real; keep this rescue-position pilot alive.
    c.hero.hp = c.hero.maxHp = 1e6;
    c.hero.immune = 1e6;
    for (let i = 0; i < 10; i++) step(c, e, n);
    assert.deepEqual({ x: n.x, y: n.y }, wait);
    assert(c.rescue('cindermaw'));
    assert(!c.rescue('cindermaw'));
    assert(c.zone().npcs.some((u) => u.id === 'service-cindermaw' && u.kind === 'smith'));
    const restored = C.restore(c.snapshot(), random);
    assert(restored.s.rescued.cindermaw);
    assert(restored.zone().npcs.some((u) => u.id === 'service-cindermaw'));
  }
assert.equal(all.size, 5, 'all approved facilities occur across natural seeded schedules');
console.log(
  'PASS six class/mode natural variable inspections, ' +
    paths +
    ' real facility routes, physical guards/forge, remote combat/save/return/rescue',
);
// Real bounded defensive equipment, depletion by accepted shared damage,
// targeted repair only: neither healing nor replacement troops.
for (const mode of ['normal', 'nightmare'])
  for (const form of ['normal', 'true']) {
    const { c, n, guards } = make('mage', mode, 21);
    let e = c.zone().enemies[0];
    if (form === 'true') {
      const p = { x: e.x, y: e.y };
      e = c.bossEnemy(c.boss('cindermaw'), 'true', p);
      c.zone().enemies[0] = e;
    }
    Object.assign(c.hero, c.safe(e.x + 60, e.y));
    c.s.mercyTime = 0;
    c.engage(e, true, false);
    const g = guards[0];
    Object.assign(g, c.safe(n.x + 50, n.y));
    c.engage(g, true, false);
    c.updateVeraFieldwork(0.01);
    assert(g.veraEquipment);
    const equipment = g.veraEquipment,
      max = equipment.max,
      // Defensive equipment absorbs 15% of the already-mitigated hit.
      // An escort guard standing inside an authored fort also receives the
      // existing fortification factor (0.6); fixed 25.5/4.5 assumptions
      // silently ignored that real placement-dependent combat rule.
      fortFactor = c.enemyFort(g) ? C.rules.balance.fortifications.incomingMultiplier : 1,
      mitigatedHit = 30 * fortFactor,
      shieldLoss = mitigatedHit * C.rules.cinderInspection.repairs.absorption;
    const hp = g.hp;
    assert(c.damage(g, 30));
    console.log('VERA_FORTIFICATION_EQUIPMENT '+JSON.stringify({
      mode,form,fortified:!!c.enemyFort(g),species:g.species,type:g.type,
      hpLost:hp-g.hp,equipmentLost:max-equipment.remaining,
      expectedHpLost:mitigatedHit-shieldLoss,expectedEquipmentLoss:shieldLoss,
    }));
    assert(Math.abs(hp - g.hp - (mitigatedHit - shieldLoss)) < 1e-7,
      'real fortified/ordinary HP damage is mitigated before Vera equipment');
    assert(Math.abs(equipment.remaining - (max - shieldLoss)) < 1e-7,
      'Vera absorbs the correct share of the real post-fortification hit');
    const wounded = g.hp,
      depleted = equipment.remaining;
    c.s.time += 4;
    c.updateVeraFieldwork(4);
    assert(equipment.remaining > depleted, 'Vera must actually restore spent equipment');
    assert(equipment.remaining <= max);
    assert.equal(g.hp, wounded);
    equipment.remaining = 0;
    const raw = JSON.stringify(c.s);
    const snap = c.snapshot();
    assert.equal(JSON.stringify(c.s), raw);
    assert(!JSON.stringify(snap).includes('veraEquipment'));
    const old = C.restore(JSON.parse(raw));
    assert(!old.zone().enemies.some((u) => u.veraEquipment));
    c.s.keys.cindermaw = true;
    assert(c.rescue('cindermaw'));
    assert(!g.veraEquipment);
    const before = g.hp;
    assert(c.damage(g, 20));
    assert(Math.abs(before - g.hp - 20 * fortFactor) < 1e-7,
      'liberation ends Vera equipment absorption but preserves native fortification defense');
  }
console.log(
  'PASS four Normal/TRUE equipment depletion, bounded actual defense restoration, no HP healing, raw/save cleanup and liberation',
);
// Historical migration, interrupted travel, fatal recovery and no-target bounds.
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger']) {
    const { c, e, n, guards } = make(cls, mode, 55);
    const old = c.snapshot();
    delete old.zones.crown.cinderInspectionVersion;
    for (const u of old.zones.crown.enemies) {
      delete u.veraEscort;
      delete u.veraFightAnchor;
    }
    const prior = old.zones.crown.npcs.find((u) => u.id === n.id);
    delete prior.presentation;
    delete prior.escortGuardIds;
    const migrated = C.restore(old);
    assert.equal(migrated.veraCaptive().id, n.id);
    assert.equal(migrated.veraCaptive().presentation, 'mobile-forge');
    assert.equal(migrated.zone().enemies.length, old.zones.crown.enemies.length);
    assert.equal(migrated.zone().npcs.filter((u) => u.id === n.id).length, 1);
    c.s.mercyTime = 0;
    Object.assign(c.hero, c.safe(e.x + 50, e.y));
    c.engage(e, true, false);
    const g = guards[0];
    Object.assign(g, c.safe(n.x + 40, n.y));
    c.engage(g, true, false);
    c.updateVeraFieldwork(0.01);
    assert(g.veraEquipment);
    const remaining = g.veraEquipment.remaining;
    const heroPos = { x: c.hero.x, y: c.hero.y };
    Object.assign(c.hero, { x: 50, y: 50 });
    assert(!c.damage(g, 20));
    assert.equal(g.veraEquipment.remaining, remaining);
    Object.assign(c.hero, heroPos);
    const actors = [e, n, ...guards].map((u) => ({ id: u.id, x: u.x, y: u.y }));
    c.enter('frontier');
    const z = c.s.zones.crown;
    assert(!z.enemies.some((u) => u.veraEquipment));
    assert.equal(z.npcs.find((u) => u.id === n.id).veraRepairDue, undefined);
    for (const p of actors) {
      const u = [...z.enemies, ...z.npcs].find((u) => u.id === p.id);
      assert.equal(u.x, p.x);
      assert.equal(u.y, p.y);
    }
    c.enter('crown');
    assert(e.cinderReturn);
    c.disengage(e, 0);
    assert(!e.aggro);
    c.clearVeraRepairs();
    const before = n.veraRepairUntil;
    c.updateVeraFieldwork(100);
    assert.equal(n.veraRepairUntil, before, 'no combat means no repairs');
  }
for (const mode of ['normal', 'nightmare'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const succession of [false, true]) {
      const { c, e, n, guards } = make(cls, mode, 88);
      c.s.challenge.succession = succession;
      c.s.mercyTime = 0;
      Object.assign(c.hero, c.safe(e.x + 50, e.y));
      c.engage(e, true, false);
      const g = guards[0];
      Object.assign(g, c.safe(n.x + 30, n.y));
      c.engage(g, true, false);
      c.updateVeraFieldwork(0.01);
      assert(g.veraEquipment);
      c.hero.hp = 1;
      c.hero.immune = 0;
      c.hitParty(c.hero, 1e6, 0, e.id);
      assert.equal(c.s.statistics.deaths, 1);
      assert(!c.s.zones.crown.enemies.some((u) => u.veraEquipment));
      assert.equal(n.veraRepairUntil, undefined);
    }
{
  const { c, e, n, guards } = make();
  const count = c.zone().enemies.length;
  guards[0].hp = 0;
  c.kill(guards[0]);
  for (let i = 0; i < 100; i++) step(c, e, n);
  assert.equal(c.zone().enemies.length, count, 'lost guard not replaced');
  assert.equal(n.escortGuardIds.length, 2);
  c.s.phase = 'peace';
  c.makeHabitat(c.zone());
  const at = { x: n.x, y: n.y };
  c.updateVeraFieldwork(10);
  assert.deepEqual({ x: n.x, y: n.y }, at);
}
console.log(
  'PASS six historical/travel/no-combat outcomes,12 actual fatal/Succession boundaries, guard loss and peace',
);
