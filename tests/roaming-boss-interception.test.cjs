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
console.log(
  'PASS ' +
    checks +
    ' roaming interception cases: deflected-charge response, route pause/resume, re-interception, home preservation and historical reload',
);
