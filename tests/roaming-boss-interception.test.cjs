'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
let checks = 0;
for (const family of ['thorn', 'cindermaw'])
  for (const cls of ['paladin', 'mage', 'ranger'])
    for (const mode of ['normal', 'nightmare', 'developer'])
      for (const form of ['normal', 'true']) {
        const g = new C(mode, cls, () => 0.73);
        g.enter(family === 'thorn' ? 'vale' : 'crown');
        const z = g.zone(),
          e = z.enemies.find((e) => e.family === family && e.type === 'boss');
        e.form = form;
        g.s.party = [];
        g.s.mercyTime = 0;
        // Intercept at a legal remote stop, not at the permanent home.
        const point = g.safe(family === 'thorn' ? 2250 : 1900, family === 'thorn' ? 1900 : 1450);
        Object.assign(e, point);
        const captive = family === 'thorn' ? g.thornCaptive() : g.veraCaptive();
        if (captive) Object.assign(captive, g.safe(point.x + 20, point.y + 20));
        e.thornLeg = 4;
        e.thornPause = 0;
        e.cinderStop = 1;
        e.cinderDestination = { ...g.cinderInspectionStops()[2], i: 2 };
        e.cinderInspectionPause = 0;
        Object.assign(g.hero, g.safe(e.x + 65, e.y));
        z.enemies = [e];
        const hp = e.hp / e.maxHp,
          home = { ...e.home },
          destination = structuredClone(e.cinderDestination);
        const receipt = g.chargedEncounterSnapshot();
        assert.equal(
          g.damage(e, 1, 'hero', { encountersAtStart: receipt }),
          false,
          'early charge is still deflected',
        );
        assert(e.aggro, 'deflection provokes a combat response');
        assert.equal(
          e.hp / e.maxHp,
          hp,
          'deflection preserves health fraction through ordinary encounter scaling',
        );
        assert.deepEqual(e.path, [], 'patrol path stops immediately');
        assert(g.patrolResume(e));
        assert.deepEqual(e.home, home, 'interception does not rewrite permanent home');
        // Ordinary leash reset resumes the same itinerary at the interception point.
        g.disengage(e, 0.1);
        assert(
          !e.returning && !e.thornReturn && !e.cinderReturn,
          'reset completes at current patrol anchor',
        );
        assert(Math.hypot(e.x - point.x, e.y - point.y) < 1e-7, 'reset never teleports to the den');
        assert.equal(e.thornLeg, 4);
        if (family === 'cindermaw') assert.deepEqual(e.cinderDestination, destination);
        assert(!g.patrolResume(e), 'completed reset retires transient receipt');
        // A real player attack can interrupt a patrol that is physically returning.
        e.returning = 1;
        if (family === 'thorn') e.thornReturn = true;
        else e.cinderReturn = true;
        assert(!g.attackResetProtected(e));
        assert(g.damage(e, 1));
        assert(e.aggro && !e.returning && !e.thornReturn && !e.cinderReturn);
        // Active exports preserve the established safe, physical historical return.
        const restored = C.restore(g.snapshot());
        const r = restored.zone().enemies.find((x) => x.id === e.id);
        assert(!restored.patrolResume(r), 'runtime route receipt is not saved');
        assert(r.thornReturn || r.cinderReturn, 'reload uses established physical return policy');
        checks++;
      }
{
  const g = new C(),
    e = g.bossEnemy(g.boss('mire'), 'normal', g.safe(1000, 1000));
  g.zone().enemies = [e];
  e.returning = 1;
  assert(g.attackResetProtected(e));
  assert(!g.damage(e, 1), 'stationary reset protection remains');
}
// Regional TRUE bosses use the appearance point, not the normal field boss den.
// Existing captive-bearing roamers retain their own scripted circuits.
{
  const g = new C('normal', 'paladin', () => 0.73);
  g.enter('march');
  g.s.mercyTime = 0;
  g.s.time = 35;
  g.s.party = [];
  const appear = g.safe(1640, 620, 'march'),
    e = g.bossEnemy(g.boss('mire'), 'true', appear),
    z = g.zone();
  z.enemies = [e];
  assert(g.trueFieldBossCircuit(e));
  assert(!g.trueFieldBossCircuit(g.bossEnemy(g.boss('mire'), 'normal', appear)));
  const stops = g.trueFieldBossCircuitStops(e);
  assert.deepEqual(stops.map((p) => p.key), ['side', 'treasury', 'dungeon', 'home']);
  assert.deepEqual({ x: stops[3].x, y: stops[3].y }, appear);
  assert.notDeepEqual(appear, g.fieldCenter(g.regionIndex()),
    'TRUE appearance is distinct from the normal field boss den');
  assert(stops.slice(0, 3).every((p) => z.npcs.some(
    (n) => n.x === p.x && n.y === p.y && n.kind === 'dungeon')),
    'patrol uses existing outdoor entrances');

  // The established acquisition/combat path takes priority over the visit.
  Object.assign(g.hero, { x: appear.x + 500, y: appear.y, hp: g.hero.maxHp });
  g.enemyRangedLine = () => true;
  g.updateEnemies(0.05);
  assert(e.aggro, 'TRUE hunter proactively engages a visible hero at 500 range');
  const anchor = { ...e.trueCircuitCombatAnchor };
  assert.deepEqual(anchor, appear);
  const leg = e.trueCircuitLeg || 0;
  g.disengage(e, 1.1);
  assert(!e.returning, 'hunter disengages without a long trek to its spawn');
  assert.deepEqual({ x: e.x, y: e.y }, anchor,
    'interrupted hunt returns to fight location, not normal boss den');
  assert.equal(e.trueCircuitLeg || 0, leg, 'hunter resumes the interrupted route');
  assert.equal(e.trueCircuitCombatAnchor, undefined, 'fight anchor is retired');
}
for (const family of ['thorn', 'cindermaw']) {
  const g = new C();
  g.enter(family === 'thorn' ? 'vale' : 'crown');
  const e = g.bossEnemy(g.boss(family), 'true', g.safe(1400, 1200));
  assert(!g.trueFieldBossCircuit(e), family + ' keeps its existing captive patrol');
}
console.log(
  'PASS ' +
    checks +
    ' roaming interception cases: deflected-charge response, route pause/resume, re-interception, home preservation and historical reload',
);
