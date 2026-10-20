'use strict';
const assert = require('node:assert/strict'),
  C = require('../../../src/prototype/engine');
const evidence = [];
for (const [zone, family] of [
  ['vale', 'thorn'],
  ['march', 'mire'],
  ['highlands', 'ridge'],
  ['frontier', 'warlord'],
  ['crown', 'cindermaw'],
])
  for (const form of ['normal', 'true']) {
    const g = new C('developer', 'mage', () => 0.9);
    g.enter(zone);
    const z = g.zone(),
      original = z.enemies.find((e) => e.type === 'boss' && e.family === family),
      e = g.bossEnemy(g.boss(family), form, original.home);
    const escorts = family === 'cindermaw' ? z.enemies.filter((u) => u.veraEscort).slice(0, 2) : [];
    if (escorts[0]) escorts[0].hp = 0;
    z.enemies = [e, ...escorts];
    g.s.party = [];
    Object.assign(g.hero, { x: e.x + 200, y: e.y, hp: 10000, maxHp: 10000 });
    g.s.mercyTime = 0;
    g.engage(e, true);
    e.hp *= 0.5;
    e.cd = 100;
    e.summonCd = 100;
    const start = { x: e.x, y: e.y };
    for (let j = 0; j < 12; j++)
      z.props.push({
        id: 'confinement-' + j,
        x: e.x + 55 * Math.cos((j * Math.PI) / 6),
        y: e.y + 55 * Math.sin((j * Math.PI) / 6),
        r: 18,
      });
    assert.equal(g.fieldBossOpenDirections(e), 0);
    let triggered = false,
      completed = false;
    for (let i = 0; i < 60; i++) {
      g.s.time += 0.1;
      g.updateEnemies(0.1);
      if (e.returning) {
        triggered = true;
        assert(g.attackResetProtected(e));
      }
      if (triggered && !e.returning) {
        completed = true;
        break;
      }
    }
    assert(triggered && completed, family + ' resets quickly');
    assert(g.fieldBossOpenDirections(e) >= 6, family + ' reset to open ground');
    assert(Math.hypot(e.x - start.x, e.y - start.y) > 100);
    assert.equal(e.hp, e.baseHp);
    assert(!e.aggro);
    assert(!e.telegraph && !e.motion);
    assert.equal(z.enemies.filter((u) => u.type === 'boss').length, 1);
    if (escorts.length) {
      assert.equal(escorts[0].hp, 0);
      assert.equal(z.enemies.filter((u) => u.veraEscort).length, escorts.length);
      const captive = g.veraCaptive();
      assert(Math.hypot(captive.x - e.x, captive.y - e.y) < 200);
    }
    evidence.push({ family, form, reset: true, openDirections: g.fieldBossOpenDirections(e) });
  }
// Stationary melee and authored warnings in an open arena are legitimate.
const g = new C('developer', 'mage', () => 0.9);
g.enter('frontier');
const e = g.zone().enemies.find((e) => e.family === 'warlord' && e.type === 'boss');
Object.assign(e, { aggro: true, telegraph: { timer: 10 }, sequence: [] });
Object.assign(g.hero, { x: e.x + 200, y: e.y });
for (let i = 0; i < 20; i++) assert.equal(g.fieldBossMobilityReset(e, g.hero, 0.5), null);
e.telegraph = null;
g.hero.x = e.x + 60;
for (let i = 0; i < 20; i++) assert.equal(g.fieldBossMobilityReset(e, g.hero, 0.5), null);
// Runtime-only observations never survive clone/restore, travel or cancellation.
const point = g.fieldBossRecoveryPoint(e);
g.disengage(e, 0, point);
assert(g.fieldBossReturning(e));
g.cancelEncounter(e);
assert(!g.fieldBossReturning(e));
g.disengage(e, 0, point);
const restored = C.restore(g.snapshot(), () => 0.9);
assert(!restored.fieldBossReturning(restored.zone().enemies.find((u) => u.id === e.id)));
g.enter('vale');
assert(!g.fieldBossReturning(e));
console.log({ cases: evidence, openArenaAndWarnings: true, cancelSaveTravel: true });
