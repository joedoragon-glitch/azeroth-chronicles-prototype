'use strict';
// Focused native simulation of scripted travel in Greenwood only. No browser,
// human newcomer, full-campaign or physical-device certification is implied.
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const { rng, candidate } = require('./fixtures.cjs');
const out = path.resolve(__dirname, '../../docs/evidence/greenwood-gva-20261028');
if (!process.argv.includes('--size')) {
  for (const size of [2700, 3200, 3400])
    cp.execFileSync(process.execPath, [__filename, '--size', String(size)], { stdio: 'inherit' });
  process.exit(0);
}
const size = Number(process.argv[process.argv.indexOf('--size') + 1]),
  C = require('./fixtures.cjs').loadRuntime();
candidate(C, size);
const scripts = {
  'opening-orientation-route': [
    'supplier',
    'recruiter',
    'board',
    'rest',
    'minor',
    'orchard',
    'mill-pond',
    'bridge-north',
    'outbound',
  ],
  'farm-and-western-woods': [
    'minor',
    'orchard',
    'mill-pond',
    'goblin-camp',
    'den-ruins',
    'bridge-south',
    'rest',
  ],
  'eastern-woods-and-estate': [
    'bridge-north',
    'cache',
    'entrance',
    'skeleton-watch',
    'bridge-south',
    'minor',
    'rest',
  ],
};
const results = [];
for (const [name, ids] of Object.entries(scripts)) {
  const g = new C('normal', 'paladin', rng(0x47564101)),
    z = g.zone(),
    t = performance.now(),
    steps = [];
  let totalDistance = 0,
    elapsed = 0,
    maxQuiet = 0,
    quiet = 0;
  const visitedEnemies = new Set();
  for (const id of ids) {
    const n =
      z.npcs.find((n) => n.id === id) ||
      (id === 'skeleton-watch'
        ? {
            id,
            x: C.rules.creatureStrongholds.find((h) => h.id === id).center[0],
            y: C.rules.creatureStrongholds.find((h) => h.id === id).center[1],
          }
        : null);
    if (!n) {
      steps.push({ id, error: 'missing target' });
      break;
    }
    const p = n.servicePoint || n,
      start = { x: g.hero.x, y: g.hero.y },
      startTime = elapsed,
      startingDeaths = g.s.statistics.deaths;
    g.hero.order = { type: 'move', x: p.x, y: p.y, navigation: true };
    let stalled = 0,
      legDistance = 0;
    while (elapsed < 600 && Math.hypot(g.hero.x - p.x, g.hero.y - p.y) > 30) {
      const before = { x: g.hero.x, y: g.hero.y };
      g.tick(0.1);
      elapsed += 0.1;
      const d = Math.hypot(g.hero.x - before.x, g.hero.y - before.y);
      totalDistance += d;
      legDistance += d;
      stalled = d < 0.05 ? stalled + 0.1 : 0;
      const near = z.enemies.filter(
        (e) => e.hp > 0 && !e.neutral && Math.hypot(e.x - g.hero.x, e.y - g.hero.y) < 220,
      );
      near.forEach((e) => visitedEnemies.add(e.id));
      quiet = near.length ? 0 : quiet + 0.1;
      maxQuiet = Math.max(maxQuiet, quiet);
      if (stalled > 12 || g.s.statistics.deaths > startingDeaths || g.zoneId !== 'vale') break;
    }
    const reached = Math.hypot(g.hero.x - p.x, g.hero.y - p.y) <= 30;
    let interaction = 'not invoked (approach-only)';
    if (reached && n.kind === 'landmark' && n.thornTrail === undefined) interaction = g.interact(n);
    steps.push({
      id,
      start,
      end: { x: g.hero.x, y: g.hero.y },
      target: { x: p.x, y: p.y },
      reached,
      elapsedSeconds: Math.round((elapsed - startTime) * 10) / 10,
      distance: Math.round(legDistance),
      stalledSeconds: Math.round(stalled * 10) / 10,
      interaction,
      heroHp: g.hero.hp,
      deadCompanions: g.s.party.filter((u) => u.hp <= 0).map((u) => u.id),
      death: g.s.statistics.deaths > startingDeaths,
    });
    if (!reached) break;
  }
  const complete = steps.length === ids.length && steps.every((s) => s.reached);
  results.push({
    name,
    size,
    seed: 0x47564101,
    elapsedSeconds: Math.round(elapsed * 10) / 10,
    completed: complete,
    distance: Math.round(totalDistance),
    nearbyDistinctEnemies220: visitedEnemies.size,
    maxCalmSeconds: Math.round(maxQuiet * 10) / 10,
    steps,
    simulationCpuMs: Math.round(performance.now() - t),
    boundary:
      'normal tick(.1), native navigation orders, live enemies and original two companions; approach-only services/interiors; automatic combat unchanged; maximum 600 simulated seconds; NOT 30–60 minute human pacing acceptance',
  });
  console.log(
    size,
    name,
    complete ? 'completed' : 'BLOCKED',
    Math.round(elapsed) + 's',
    Math.round(totalDistance) + ' units',
  );
}
fs.writeFileSync(
  path.join(out, 'journeys-' + size + '.json'),
  JSON.stringify(
    {
      size,
      sourceSha: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      results,
    },
    null,
    2,
  ) + '\n',
);
