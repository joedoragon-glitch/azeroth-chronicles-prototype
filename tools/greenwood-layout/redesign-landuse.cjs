'use strict';
// Measured land use and geometric journeys, not human enjoyment or device FPS.
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process'),
  crypto = require('node:crypto');
const { loadRedesign, loadRuntime, rng } = require('./fixtures.cjs');
const out = path.resolve(__dirname, '../../docs/evidence/greenwood-redesign-20261029');
if (!process.argv.includes('--size')) {
  for (const size of [2700, 3200, 3400])
    cp.execFileSync(process.execPath, [__filename, '--size', String(size)], { stdio: 'inherit' });
  process.exit(0);
}
const size = Number(process.argv[process.argv.indexOf('--size') + 1]),
  C = size === 2700 ? loadRuntime() : loadRedesign(size);
const started = performance.now(),
  g = new C('normal', 'paladin', rng(0x47564101)),
  z = g.zone(),
  generationMs = performance.now() - started;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  round = (n) => Math.round(n * 100) / 100;
const destinations = z.npcs.filter((n) => !/^thorn-trail|thorn-local|mini-field/.test(n.id));
const homes = z.enemies
  .filter((e) => e.hp > 0 && !e.neutral && !e.summon)
  .map((e) => ({ id: e.id, species: e.species, ...e.home }));
const cells = [];
for (let row = 0; row < 4; row++)
  for (let col = 0; col < 4; col++) {
    const bounds = {
      x1: (col * size) / 4,
      y1: (row * size) / 4,
      x2: ((col + 1) * size) / 4,
      y2: ((row + 1) * size) / 4,
    };
    const inside = (p) =>
      p.x >= bounds.x1 && p.x < bounds.x2 && p.y >= bounds.y1 && p.y < bounds.y2;
    let samples = 0,
      terrainClear = 0,
      walkable = 0;
    for (let x = 25; x < size; x += 50)
      for (let y = 25; y < size; y += 50)
        if (inside({ x, y })) {
          samples++;
          if (!g.blocked(x, y, 'vale', 15, true)) terrainClear++;
          if (!g.blocked(x, y, 'vale', 15)) walkable++;
        }
    cells.push({
      row,
      col,
      bounds,
      samples,
      terrainClear,
      walkable,
      props: z.props.filter(inside).length,
      nature: z.props.filter((p) => p.greenwoodNature && inside(p)).length,
      destinations: destinations.filter((n) => inside(n.servicePoint || n)).map((n) => n.id),
      enemyHomes: homes.filter(inside).map((e) => e.id),
      roadLength: 0,
    });
  }
const band = size / 8,
  edges = {};
for (const [name, inside] of Object.entries({
  north: (p) => p.y < band,
  south: (p) => p.y > size - band,
  west: (p) => p.x < band,
  east: (p) => p.x > size - band,
  NW: (p) => p.x < band && p.y < band,
  NE: (p) => p.x > size - band && p.y < band,
  SW: (p) => p.x < band && p.y > size - band,
  SE: (p) => p.x > size - band && p.y > size - band,
})) {
  let samples = 0,
    walkable = 0;
  for (let x = 25; x < size; x += 50)
    for (let y = 25; y < size; y += 50)
      if (inside({ x, y })) {
        samples++;
        if (!g.blocked(x, y, 'vale', 15)) walkable++;
      }
  edges[name] = {
    samples,
    walkable,
    props: z.props.filter(inside).length,
    structures: z.props.filter((p) => p.roadBlocker && inside(p)).map((p) => p.id),
    destinations: destinations.filter((n) => inside(n.servicePoint || n)).map((n) => n.id),
    enemyHomes: homes.filter(inside).map((e) => e.id),
    roadLength: 0,
  };
}
for (const road of [...z.roads, ...z.footpaths])
  for (let j = 1; j < road.length; j++) {
    const a = road[j - 1],
      b = road[j],
      length = distance(a, b),
      count = Math.ceil(length / 20);
    for (let k = 0; k < count; k++) {
      const p = {
        x: a.x + ((b.x - a.x) * (k + 0.5)) / count,
        y: a.y + ((b.y - a.y) * (k + 0.5)) / count,
      };
      const cell = cells.find(
        (c) => p.x >= c.bounds.x1 && p.x < c.bounds.x2 && p.y >= c.bounds.y1 && p.y < c.bounds.y2,
      );
      if (cell) cell.roadLength += length / count;
      for (const [name, inside] of Object.entries({
        north: (p) => p.y < band,
        south: (p) => p.y > size - band,
        west: (p) => p.x < band,
        east: (p) => p.x > size - band,
        NW: (p) => p.x < band && p.y < band,
        NE: (p) => p.x > size - band && p.y < band,
        SW: (p) => p.x < band && p.y > size - band,
        SE: (p) => p.x > size - band && p.y > size - band,
      }))
        if (inside(p)) edges[name].roadLength += length / count;
    }
  }
const point = (id) =>
  id === 'start'
    ? g.hero
    : destinations.find((n) => n.id === id)?.servicePoint || destinations.find((n) => n.id === id);
const journeys = {
  orientation: ['start', 'supplier', 'recruiter', 'board', 'minor', 'orchard', 'mill-pond', 'rest'],
  'farm-woods': [
    'rest',
    'mill-pond',
    'minor',
    'orchard',
    'goblin-camp',
    'den-ruins',
    'bridge-south',
    'rest',
  ],
  estate: [
    'rest',
    'bridge-north',
    'outbound',
    'cache',
    'entrance',
    'supply-entrance',
    'bridge-south',
    'rest',
  ],
};
const routeReports = [];
for (const [name, ids] of Object.entries(journeys)) {
  let total = 0,
    quiet = 0,
    longestQuiet = 0;
  const encounters = new Set(),
    legs = [];
  for (let j = 1; j < ids.length; j++) {
    const a = point(ids[j - 1]),
      b = point(ids[j]),
      t = performance.now(),
      route = g.route(a, b);
    let last = a,
      length = 0;
    for (const p of route) {
      const d = distance(last, p),
        n = Math.ceil(d / 20);
      length += d;
      for (let k = 0; k < n; k++) {
        const q = {
            x: last.x + ((p.x - last.x) * (k + 0.5)) / n,
            y: last.y + ((p.y - last.y) * (k + 0.5)) / n,
          },
          near = homes.filter((e) => distance(e, q) < 220);
        near.forEach((e) => encounters.add(e.id));
        quiet = near.length ? 0 : quiet + d / n;
        longestQuiet = Math.max(longestQuiet, quiet);
      }
      last = p;
    }
    const reached = route.length > 0 && distance(last, b) < 35;
    legs.push({
      from: ids[j - 1],
      to: ids[j],
      reached,
      length: round(length),
      cpuMs: round(performance.now() - t),
    });
    total += length;
  }
  routeReports.push({
    name,
    length: round(total),
    noCombatSecondsEstimate: round(total / g.hero.speed),
    nearbyHomes220: encounters.size,
    longestCalmRunUnits: round(longestQuiet),
    legs,
  });
}
cells.forEach((c) => (c.roadLength = round(c.roadLength)));
Object.values(edges).forEach((c) => (c.roadLength = round(c.roadLength)));
const report = {
  size,
  generationMs: round(generationMs),
  sourceFiles: Object.fromEntries(
    ['greenwood-landscape', 'engine', 'rules', 'world', 'navigation', 'save'].map((n) => [
      n,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '../../src/prototype/' + n + '.js')))
        .digest('hex'),
    ]),
  ),
  method:
    '50-unit cell-center walkability, hero radius 15; 16 equal cells; outer one-eighth bands/corners overlap; roads sampled every <=20 units; geometric native routes and initial living homes within 220, NOT actual encounter/combat/first-hour time. No invented density target.',
  props: z.props.length,
  nature: z.greenwoodNatureCensus,
  ordinary: z.enemies.filter((e) => e.type === 'mob' && !e.summon).length,
  tribute: z.nodes.reduce((a, n) => a + n.amount, 0),
  cells,
  edges,
  journeys: routeReports,
  destinations: destinations.map((n) => ({ id: n.id, ...(n.servicePoint || n) })),
  homes,
};
fs.writeFileSync(
  path.join(out, 'landuse-' + size + '.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    size,
    props: report.props,
    nature: report.nature,
    emptyDistricts: cells
      .filter((c) => !c.destinations.length && !c.enemyHomes.length && c.roadLength < 1)
      .map((c) => [c.row, c.col]),
    journeys: routeReports.map(
      ({ name, length, noCombatSecondsEstimate, longestCalmRunUnits }) => ({
        name,
        length,
        noCombatSecondsEstimate,
        longestCalmRunUnits,
      }),
    ),
    edges,
  }),
);
