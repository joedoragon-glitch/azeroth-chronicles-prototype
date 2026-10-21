'use strict';
const assert = require('node:assert/strict'),
  C = require('../src/prototype/engine');
const c = new C('normal', 'paladin', () => 0.5),
  cfg = C.rules.thornPatrol,
  e = c.zone().enemies.find((e) => e.family === 'thorn'),
  witness = c.zone().npcs.find((n) => n.thornReport);
for (let leg = 0; leg < cfg.route.length; leg++) {
  Object.assign(e, {
    x: cfg.route[leg][0],
    y: cfg.route[leg][1],
    thornLeg: (leg + cfg.direction + cfg.route.length) % cfg.route.length,
  });
  const before = JSON.stringify(c.snapshot()),
    report = c.thornReport();
  assert(report.includes('near ' + cfg.names[leg]));
  assert(
    report.includes(
      'heading toward ' + cfg.names[(leg + cfg.direction + cfg.route.length) % cfg.route.length],
    ),
  );
  const short = c.thornReport(true);
  assert(short.includes('Last sighting: ' + cfg.names[leg]));
  assert(
    short.includes(
      'heading for ' + cfg.names[(leg + cfg.direction + cfg.route.length) % cfg.route.length],
    ),
  );
  assert(short.length < 180, 'witness gives a concise actionable clue');
  assert.equal(JSON.stringify(c.snapshot()), before, 'reports do not move patrol or change save');
}
e.thornLeg = 999;
assert(!c.thornReport().includes('undefined'), 'invalid historical leg has a safe fallback');
c.zone().npcs.push({ id: 'report-print', thornFootprint: true, expires: c.s.time + 4 });
assert(c.thornReport().includes('Fresh pawprints'));
c.s.time += 5;
assert(!c.thornReport().includes('Fresh pawprints'));
e.aggro = true;
assert(c.thornReport().includes('There is fighting near ' + cfg.names.at(-1)));
e.aggro = false;
e.thornReturn = true;
assert(c.thornReport().includes('returning to the temporary den'));
e.thornReturn = false;
c.s.keys.thorn = true;
const mira = c.thornCaptive();
Object.assign(mira, { x: cfg.route[3][0], y: cfg.route[3][1] });
assert(c.thornReport().includes('Mira waits near ' + cfg.names[3]));
c.s.rescued.thorn = true;
assert.equal(c.thornReport(), 'Mira is free. Find her teaching in Millhaven.');
Object.assign(c.hero, { x: witness.x + 120, y: witness.y });
assert.equal(c.interact(witness), false);
Object.assign(c.hero, { x: witness.x, y: witness.y });
assert(c.interact(witness));
assert(c.messages.at(-1).includes('Mira is free'));
assert.equal(
  c.notices.at(-1).kind,
  'narration',
  'witness clue uses combat-deferred nonurgent channel',
);
assert(c.notices.at(-1).detail.includes('Mira is free'));
console.log(
  'PASS live witness clues for all route legs, combat, return, fresh tracks, rescue, historical fallback and interaction range',
);

// Old saved coordinates must move the same resident into the open road shoulder.
for (const seed of [0.1, 0.5, 0.9]) {
  const g = new C('normal', 'paladin', () => seed);
  const resident = g.zone().npcs.find((n) => n.thornReport);
  assert.deepEqual({ x: resident.x, y: resident.y }, { x: 780, y: 740 });
  assert(!g.blocked(resident.x, resident.y));
  assert(g.route(g.hero, resident).length, 'witness reachable from the starting town');
  Object.assign(resident, { x: 900, y: 850, savedWitnessNote: 'retained' });
  const restored = C.restore(g.snapshot(), () => seed);
  const matches = restored.zone().npcs.filter((n) => n.id === resident.id);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].savedWitnessNote, 'retained');
  assert.deepEqual({ x: matches[0].x, y: matches[0].y }, { x: 780, y: 740 });
  restored.migrateThornPatrol(restored.zone());
  assert.deepEqual({ x: matches[0].x, y: matches[0].y }, { x: 780, y: 740 });
}
console.log(
  'PASS witness fresh/save placement, starting-town access and idempotent same-resident migration',
);
