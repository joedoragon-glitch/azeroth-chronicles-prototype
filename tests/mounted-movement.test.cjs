'use strict';
const assert = require('node:assert/strict');
const C = require('../src/prototype/engine');
function scene(mounted, kind, night, slow) {
  const g = new C('normal', 'paladin', () => 0.9);
  g.enter('highlands');
  const native = g.zone().enemies.find((e) => e.mountedCrownRider && !e.guard && !e.summon);
  assert(native, 'Highlands has real mounted patrols');
  const e = JSON.parse(JSON.stringify(native)),
    z = g.zone();
  z.props = [];
  z.npcs = [];
  z.buildings = [];
  z.enemies = [e];
  g.s.party = [];
  let anchor;
  for (const y of [300, 1200, 1600, 2100, 2800])
    for (const x of [400, 900, 1600, 2400]) {
      if (anchor) break;
      if (
        Array.from({ length: 17 }, (_, i) => x - 100 + i * 35).every(
          (px) => !g.blocked(px, y, 'highlands', 24),
        )
      )
        anchor = { x, y };
    }
  assert(anchor, 'actual Highlands terrain supplies a clear walking lane');
  Object.assign(e, anchor, {
    home: { ...anchor },
    mountedCrownRider: mounted,
    aggro: true,
    ranged: kind === 'retreat',
    hybrid: false,
    shotRange: 280,
    cd: 100,
    specialCd: 100,
    summonCd: 100,
    pursuitBurst: 0,
    pursuitBurstReadyAt: 1000,
    slow: slow ? 2 : 0,
    noProgress: 0,
  });
  Object.assign(g.hero, {
    x: e.x + (kind === 'retreat' ? 50 : 350),
    y: e.y,
    level: e.level,
    hp: 10000,
    maxHp: 10000,
  });
  g.s.clock = night ? 500 : 100;
  g.s.time = 30;
  g.s.mercyTime = 0;
  return { g, e };
}
for (const kind of ['pursuit', 'retreat', 'wander', 'escape'])
  for (const night of [false, true])
    for (const slow of [false, true]) {
      const moved = [];
      for (const mounted of [false, true]) {
        const { g, e } = scene(mounted, kind, night, slow),
          before = { x: e.x, y: e.y };
        if (kind === 'wander') {
          e.aggro = false;
          e.idleWanderWait = 0;
          e.idleWanderTarget = { x: e.x + 180, y: e.y };
          g.updateIdleWander(e, 0.1);
        } else if (kind === 'escape') {
          g._tacticalRegroups = new Map([
            [e.id, { phase: 'escape', fleeRemaining: 10, seekDelay: 10, stalled: 0 }],
          ]);
          assert(g.tacticalAdvanceRogueRegroup(e, g.hero, 0.1));
        } else g.updateEnemies(0.1);
        const distance = Math.hypot(e.x - before.x, e.y - before.y);
        assert(distance > 0, kind + ' physically moves');
        moved.push(distance);
      }
      assert(
        Math.abs(moved[1] / moved[0] - 1.3) < 1e-8,
        kind + ' mounted/foot ratio stays 1.3 by day/night and under Slow',
      );
    }
// Use a live patrol, preserve the mounted identity through an ordinary save.
const { g, e } = scene(true, 'pursuit', false, false);
const restored = C.restore(g.snapshot());
assert(restored.zone().enemies.some((u) => u.id === e.id && u.mountedCrownRider));
assert.equal(
  restored.mountedMovementFactor(restored.zone().enemies.find((u) => u.id === e.id)),
  1.3,
);
console.log(
  'PASS actual Highlands mounted patrol: 16 walking pairs across pursuit/withdrawal/wander/Rogue escape, day/night/Slow and existing save identity',
);
