'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine.js');
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function fixture(cls = 'paladin', mode = 'normal', seed = 0.5) {
  const c = new C(mode, cls, () => seed),
    e = c.zone().enemies.find((e) => e.family === 'thorn'),
    n = c.thornCaptive();
  c.zone().enemies = [e];
  c.s.party = [];
  c.s.mercyTime = 10000;
  return { c, e, n };
}
function frame(c, e, n) {
  const before = { x: e.x, y: e.y },
    nb = { x: n.x, y: n.y };
  c.s.time += 0.1;
  c.updateEnemies(0.1);
  assert(dist(before, e) <= 8.2 + 1e-7, 'patrol/return must not teleport');
  assert(dist(nb, n) <= 24 + 1e-7, 'Mira must not teleport');
  assert(c.clearSegment(before, e), 'real traversable boss movement');
  assert(c.clearSegment(nb, n), 'real traversable Mira movement');
  assert(!c.blocked(n.x, n.y), 'Mira must remain interactable outside walls');
  assert(dist(e, { x: 300, y: 350 }) > 320, 'circuit avoids Millhaven');
}
let cases = 0;
for (const cls of ['paladin', 'mage', 'ranger'])
  for (const mode of ['normal', 'nightmare'])
    for (const seed of [0.1, 0.5, 0.9]) {
      let { c, e, n } = fixture(cls, mode, seed),
        legs = new Set();
      for (let i = 0; i < 1600; i++) {
        frame(c, e, n);
        if (e.thornLeg !== undefined) legs.add(e.thornLeg);
      }
      assert.equal(legs.size, 8, 'complete repeatable circuit');
      assert(c.zone().npcs.filter((n) => n.thornFootprint).length <= 18);
      assert.equal(n.id, 'cage-thorn');
      assert.equal(n.presentation, 'mobile-captive');
      assert(!c.combatTargets().includes(n));
      assert(!c.s.party.includes(n));
      assert(c.zone().npcs.some((n) => n.thornReport));
      // Reach the remote Crypt leg naturally before opening real shared damage.
      for (let i = 0; i < 1800 && dist(e, { x: 2250, y: 1900 }) > 80; i++) frame(c, e, n);
      assert(dist(e, e.home) > 1000);
      Object.assign(c.hero, c.safe(e.x + 60, e.y));
      c.s.mercyTime = 0;
      const hp = e.hp;
      assert(c.damage(e, 10));
      assert(e.hp < hp, 'ranged/melee opener works far from den');
      const anchor = { ...e.thornFightAnchor };
      assert.deepEqual(anchor, { x: e.x, y: e.y });
      assert(c.tacticalRogueLeashAllows(e, c.hero, 700));
      assert(!c.tacticalRogueLeashAllows(e, { x: e.home.x, y: e.home.y, hp: 1 }, 700));
      e.telegraph = { timer: 99 };
      c.s.projectiles = [{ sourceId: e.id }];
      c.s.hazards = [{ sourceId: e.id }];
      Object.assign(c.hero, { x: 300, y: 350 });
      frame(c, e, n);
      assert(e.thornReturn);
      assert(!e.telegraph);
      assert.equal(c.s.projectiles.length, 0);
      assert.equal(c.s.hazards.length, 0);
      const raw = JSON.stringify(c.s),
        snap = c.snapshot();
      assert.equal(JSON.stringify(c.s), raw, 'snapshot cannot change live actors');
      assert.equal(snap.zones.vale.enemies[0].x, e.x);
      assert.equal(snap.zones.vale.npcs.find((n) => n.id === 'cage-thorn').x, n.x);
      c = C.restore(snap, () => seed);
      e = c.zone().enemies.find((e) => e.family === 'thorn');
      n = c.thornCaptive();
      assert(e.thornReturn);
      assert(!e.thornFightAnchor);
      for (let i = 0; i < 2200 && (e.thornReturn || e.returning); i++) frame(c, e, n);
      assert(!e.thornReturn && !e.returning, 'physical joint den return completes');
      assert(dist(e, e.home) < 1e-7);
      assert(dist(e, n) <= 100);
      assert.equal(e.hp, e.baseHp);
      assert.equal(e.thornLeg, 1);
      const prev = { x: e.x, y: e.y },
        np = { x: n.x, y: n.y };
      c.enter('march');
      c.enter('vale');
      assert.equal(e.x, prev.x);
      assert.equal(n.x, np.x, 'travel never strands Mira through a home teleport');
      // Defeat away from home; same Mira waits, key and services follow original paths.
      for (let i = 0; i < 450; i++) frame(c, e, n);
      Object.assign(c.hero, c.safe(e.x + 45, e.y));
      c.damage(e, 1e6);
      assert(e.hp <= 0);
      assert(c.s.keys.thorn);
      assert.equal(e.respawn, 120);
      const waiting = { x: n.x, y: n.y };
      c.updateEnemies(1);
      assert.equal(n.x, waiting.x);
      Object.assign(c.hero, waiting);
      assert(c.interact(n));
      assert(c.s.rescued.thorn);
      assert.equal(c.zone().npcs.filter((n) => n.id === 'service-thorn').length, 1);
      c.updateEnemies(120);
      assert.equal(c.thornCaptive().x, waiting.x, 'liberated Mira stops following');
      cases++;
    }
// Genuine historical and peace/pending contracts; raw restoration is idempotent.
{
  const { c, e, n } = fixture();
  delete n.presentation;
  c.s.mercyTime = 0;
  c.s.pending.thorn = { kind: 'field', count: 1, zone: 'vale', base: structuredClone(e), delay: 0 };
  e.hp = 0;
  e.respawn = 0;
  c.s.keys.thorn = true;
  const r = C.restore(c.s);
  assert.equal(r.zone().npcs.filter((n) => n.id === 'cage-thorn').length, 1);
  r.updateElites(0.1);
  r.updateElites(10);
  const live = r.zone().enemies.filter((e) => e.family === 'thorn' && e.hp > 0);
  assert.equal(live.length, 1);
  assert.equal(live[0].form, 'true');
  assert.deepEqual(live[0].home, r.fieldCenter(0));
  assert(dist(live[0], r.hero) > 380, 'TRUE still spawns remotely');
  assert.deepEqual(C.restore(r.snapshot()).snapshot(), r.snapshot());
  r.s.phase = 'peace';
  r.s.rescued.thorn = true;
  r.refreshNPCs();
  const before = { x: r.thornCaptive().x, y: r.thornCaptive().y };
  r.updateThornCaptive(10);
  assert.deepEqual({ x: r.thornCaptive().x, y: r.thornCaptive().y }, before);
}
console.log(
  'PASS Thornfang/Mira ' +
    cases +
    ' seeded class/mode circuits, collision, remote real damage, physical joint return, save/travel, rescue,120s respawn, pending singleton TRUE and peace',
);
