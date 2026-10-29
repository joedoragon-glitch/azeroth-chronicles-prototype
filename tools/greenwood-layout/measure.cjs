'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const crypto = require('node:crypto'),
  zlib = require('node:zlib');
const { rng, candidate, clone } = require('./fixtures.cjs');
const root = path.resolve(__dirname, '../..');
const revised = process.argv.includes('--revised');
const out = path.join(
  root,
  'docs/evidence/' + (revised ? 'greenwood-revised-20261028' : 'greenwood-gva-20261028'),
);
fs.mkdirSync(out, { recursive: true });
const seeds = [0x47564101, 0x47564102, 0x47564103, 0x47564104];
if (!process.argv.includes('--size')) {
  fs.mkdirSync(out, { recursive: true });
  // Preserve the archived immutable input bytes; rebuilding a fixture must be explicit.
  for (const size of [2700, 3200, 3400])
    cp.execFileSync(process.execPath, [__filename, '--size', String(size)], { stdio: 'inherit' });
  process.exit(0);
}
const size = Number(process.argv[process.argv.indexOf('--size') + 1]);
const C = require('./fixtures.cjs').loadRuntime(size, revised);
const inputs = JSON.parse(
  zlib.gunzipSync(
    fs.readFileSync(
      path.join(root, 'docs/evidence/greenwood-gva-20261028/synthetic-v4-inputs.json.gz'),
    ),
  ),
);
const plan = revised
    ? (() => {
        const G = require('../../src/prototype/greenwood');
        const cfg = C.rules.greenwoodLayout;
        G.install(C, { D: C.data, R: C.rules });
        return {
          ...cfg,
          ...G.projection(size),
          proposal:
            'revised reserved parcels; versioned old-v4 migration enabled in isolated process',
        };
      })()
    : candidate(C, size),
  R = C.rules;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  round = (n) => Math.round(n * 100) / 100;
const summarize = (v) => ({
  min: round(Math.min(...v)),
  median: round([...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]),
  max: round(Math.max(...v)),
});
const provenance = {
  sourceSha: cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  baseMainSha: cp.execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: root, encoding: 'utf8' }).trim(),
  comparedRuntimeSha256: Object.fromEntries(
    [
      'engine',
      'greenwood',
      'data',
      'rules',
      'world',
      'navigation',
      'save',
      'visuals',
      'renderer',
    ].map((f) => [
      f,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, 'src/prototype/' + f + '.js')))
        .digest('hex'),
    ]),
  ),
  toolSha256: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
  fixtureSha256: crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(__dirname, 'fixtures.cjs')))
    .digest('hex'),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  size,
  proposal: plan.proposal,
  rng: 'Mulberry32 unsigned 32-bit; seeds stored as integers',
  timingBoundary:
    'Node CPU wall time on this host; NOT browser/device FPS, GPU memory or player pacing',
};
function endpoints(g) {
  const z = g.zone(),
    n = (id) => z.npcs.find((p) => p.id === id),
    p = (id) => n(id)?.servicePoint || n(id);
  const list = [
    ['start-supplies', 'start/refuge', g.hero, p('supplier')],
    ['start-captain', 'start/refuge', g.hero, p('recruiter')],
    ['start-board', 'start/refuge', g.hero, p('board')],
    ['start-refuge', 'start/refuge', g.hero, p('rest')],
    ['hamlet', 'orchard service', g.hero, p('minor')],
    ['orchard', 'orchard service', p('minor'), p('orchard')],
    ['mill-shore', 'mill operation', p('minor'), p('mill-pond')],
    ['freight-cache', 'Scornfang freight', p('entrance'), p('cache')],
    ['freight-treasury', 'Scornfang freight', p('cache'), p('supply-entrance')],
    ['old-cellars', 'existing occupied home', g.hero, p('den-ruins')],
    ['thorn-den', 'threat regions', g.hero, g.fieldCenter(0)],
    ['goblin-camp', 'threat regions', g.hero, p('goblin-camp')],
    [
      'skeleton-watch',
      'threat regions',
      p('entrance'),
      {
        x: R.creatureStrongholds.find((h) => h.id === 'skeleton-watch').center[0],
        y: R.creatureStrongholds.find((h) => h.id === 'skeleton-watch').center[1],
      },
    ],
    ['wagon', 'northern river trade', p('bridge-north'), p('outbound')],
  ];
  for (const [j, b] of z.bridgeApproaches.entries()) {
    list.push(['crossing-' + j, 'southern/northern discovery', b.west, b.east]);
    for (const [side, bank] of [
      ['west', b.west],
      ['east', b.east],
    ])
      list.push(['bank-' + j + '-' + side, 'southern/northern discovery', g.hero, bank]);
  }
  return list;
}
function route(g, id, scenario, a, b) {
  if (!a || !b) return { id, scenario, reachable: false, reason: 'missing endpoint' };
  const t = performance.now(),
    ps = g.route(a, b),
    ms = performance.now() - t;
  const points = [a, ...ps];
  let length = 0,
    clear = true,
    companion = true;
  for (let j = 1; j < points.length; j++) {
    length += dist(points[j - 1], points[j]);
    clear &&= g.clearSegment(points[j - 1], points[j], 15);
    companion &&= g.clearSegment(points[j - 1], points[j], R.actorContactRadii.large);
  }
  const error = ps.length ? dist(ps.at(-1), b) : null;
  // route() may legally snap its requested target. Do not mistake an arbitrary
  // snapped path for usable service/site access.
  const reachable = !!ps.length && clear && error <= 35;
  const es = g.zone().enemies.filter((e) => e.hp > 0 && !e.neutral && !e.nightOnly);
  const samples = [];
  for (let j = 1; j < points.length; j++) {
    const a = points[j - 1],
      b = points[j],
      d = dist(a, b),
      steps = Math.max(1, Math.ceil(d / 25));
    for (let k = 0; k < steps; k++) {
      const p = { x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps };
      samples.push({
        distance: Math.min(...es.map((e) => dist(p, e.home || e))),
        scenery: g.zone().props.filter((q) => dist(p, q) < 200).length,
        units: d / steps,
      });
    }
  }
  let quiet = 0,
    maxQuiet = 0;
  for (const p of samples) {
    quiet = p.distance > 220 ? quiet + p.units : 0;
    maxQuiet = Math.max(maxQuiet, quiet);
  }
  return {
    id,
    scenario,
    start: { id: a.id || null, x: round(a.x), y: round(a.y) },
    end: { id: b.id || null, x: round(b.x), y: round(b.y) },
    reachable,
    segmentsClear: clear,
    companion20Clear: companion,
    targetError: error === null ? null : round(error),
    length: round(length),
    noCombatSeconds: round(length / g.hero.speed),
    routeCpuMs: round(ms),
    maxCalmUnitsBeyond220FromLivingHome: round(maxQuiet),
    nearbyScenery: samples.length ? summarize(samples.map((p) => p.scenery)) : null,
    points: points.map((p) => ({ x: round(p.x), y: round(p.y) })),
    visibility150: 'pending native review',
    interactionOutcome: 'geometry only; no simulated quest/reward claim',
  };
}
function census(g, seed) {
  const z = g.zone(),
    routes = [];
  // Freeze living bodies for geometry query, retain actors for cadence and census.
  for (const [id, scenario, a, b] of endpoints(g)) {
    routes.push(route(g, id, scenario, a, b), route(g, id + '-reverse', scenario, b, a));
  }
  const grid = [];
  let free = 0,
    terrain = 0;
  for (let y = 75; y < size - 40; y += 50)
    for (let x = 75; x < size - 40; x += 50) {
      const t = !g.blocked(x, y, 'vale', 15, true),
        f = !g.blocked(x, y, 'vale', 15);
      free += f;
      terrain += t;
      grid.push({ x, y, f });
    }
  const districts = (p) =>
    p.x < R.barriers[0].bounds[0]
      ? p.y < plan.y(1150)
        ? 'settled-west'
        : 'wooded-west'
      : p.y < plan.y(1500)
        ? 'eastern-farms'
        : 'estate-woods';
  const byDistrict = {};
  for (const p of z.props) (byDistrict[districts(p)] ??= []).push(p.id);
  const rural = R.greenwoodRuralScenes.map(([x, y, structure, district], j) => {
    const id = 'greenwood-country-' + j,
      p = z.props.find((p) => p.id === id);
    return {
      id,
      structure,
      district,
      intended: { x, y },
      placed: !!p,
      actual: p ? { x: p.x, y: p.y } : null,
      relocated: p ? dist(p, { x, y }) > 1 : false,
    };
  });
  const architecture = z.props
    .filter((p) => p.roadBlocker)
    .map((p) => ({
      id: p.id,
      structure: p.structure,
      x: p.x,
      y: p.y,
      collisionRadius: p.r,
      roadDistance: round(g.distanceToRoad(z, p)),
      requiredSetback: g.roadSetback(p),
      roadClear: g.distanceToRoad(z, p) + 0.01 >= g.roadSetback(p),
    }));
  return {
    seed,
    props: z.props.length,
    propBudget400: z.props.length <= 400,
    byDistrict,
    rural: {
      authored: rural.length,
      placed: rural.filter((p) => p.placed).length,
      skipped: rural.filter((p) => !p.placed).length,
      items: rural,
    },
    architecture,
    scenes: {
      version: z.greenwoodSceneVersion || 0,
      attemptVersion: z.greenwoodAttemptVersion || 0,
      items: clone(z.greenwoodSceneAudit || []),
      missingEssentialIds: (z.greenwoodSceneAudit || [])
        .filter((p) => p.essential && !p.placed)
        .map((p) => p.id),
    },
    grid: {
      pitch: 50,
      sampled: grid.length,
      terrainWalkable: terrain,
      sceneryWalkable: free,
      sceneryWalkableAreaEstimate: free * 2500,
      boundary: 'cell-center sampling; not exact polygon area or guaranteed connectivity',
    },
    roads: z.roads,
    footpaths: z.footpaths,
    bridgeApproaches: z.bridgeApproaches,
    terrain: clone(R.terrain[0]),
    anchors: {
      sourceDeclared: {
        town: C.data.towns[0],
        hamlet: C.data.minors[0],
        crypt: C.data.entrances[0],
        wagon: C.data.ports[0],
      },
      actual: z.npcs.map((n) => ({
        id: n.id,
        kind: n.kind,
        name: n.name,
        x: n.x,
        y: n.y,
        servicePoint: n.servicePoint,
      })),
    },
    enemies: z.enemies.map((e) => ({
      id: e.id,
      type: e.type,
      species: e.species,
      family: e.family,
      pack: e.pack,
      mini: e.mini,
      site: e.site,
      home: e.home,
      x: e.x,
      y: e.y,
      hp: e.hp,
    })),
    tribute: z.nodes.map((n) => ({ id: n.id, site: n.site, amount: n.amount, hidden: n.hidden })),
    routes,
    essentialFeatures: {
      allAuthoredEssentialsPlaced: revised
        ? z.greenwoodSceneVersion === (R.greenwoodLayout.sceneVersion || R.greenwoodLayout.version) &&
          !!z.greenwoodSceneAudit?.length &&
          z.greenwoodSceneAudit.every((p) => !p.essential || p.placed)
        : false,
      mill: z.props.some((p) => p.id === 'greenwood-working-mill'),
      expandingOrchard: ['established', 'young', 'new'].every((id) =>
        z.props.some((p) => p.id === 'greenwood-orchard-' + id),
      ),
      workingCellar: z.props.some((p) => p.id === 'greenwood-working-cellar'),
      correctTreasuryName: z.npcs.some(
        (p) => p.id === 'supply-entrance' && p.name === "Scornfang's Treasury",
      ),
      reason: revised
        ? 'installed scene IDs; geometry and native appearance separately verified'
        : 'baseline scene census',
    },
    snapshot: g.snapshot(),
  };
}
function stableProgress(s) {
  return {
    gold: s.hero.gold,
    quests: s.quests,
    paid: s.paid,
    normal: s.normal,
    true: s.true,
    rescued: s.rescued,
    keys: s.keys,
    gathered: s.gathered,
    discovered: s.discovered,
    tribute: s.zones.vale.nodes.map((n) => [n.id, n.amount, n.hidden]),
    enemies: s.zones.vale.enemies.map((e) => [e.id, e.hp <= 0, e.deathPaid]),
    buildings: s.zones.vale.buildings.map((b) => [b.id, b.kind, b.progress, b.upgradePaid]),
    party: s.party.map((u) => [u.id, u.type, u.hp, u.active, u.carry]),
  };
}
const worlds = [];
for (const seed of seeds) {
  let calls = 0;
  const stream = rng(seed),
    random = () => {
      calls++;
      return stream();
    };
  const t = performance.now(),
    g = new C('normal', 'paladin', random),
    generationMs = performance.now() - t;
  const initialSha256 = crypto
    .createHash('sha256')
    .update(JSON.stringify(g.snapshot()))
    .digest('hex');
  // Authored fresh geometry makes no random calls. Exercise normal idle ticks to
  // obtain distinct deterministic fresh-world actor states, without inventing
  // scene randomization or describing identical layouts as varied maps.
  for (let j = 0; j < 120; j++) g.tick(0.1);
  const sampleSha256 = crypto.createHash('sha256').update(JSON.stringify(g.s)).digest('hex');
  const row = census(g, seed);
  row.generationCpuMs = round(generationMs);
  Object.assign(row, {
    initialSha256,
    sampleSha256,
    randomCalls: calls,
    sampleBoundary:
      '12 seconds normal idle ticks at original safe spawn; same authored geometry, distinct seeded actor state',
  });
  worlds.push(row);
  console.log(
    size,
    seed,
    'props',
    row.props,
    'rural',
    row.rural.placed,
    'rng calls',
    calls,
    'route failures',
    row.routes
      .filter((r) => !r.reachable)
      .map((r) => r.id)
      .join(','),
  );
}
const saveResults = [];
const saves = inputs.saves;
const historicalManifest = require('../../docs/evidence/beta-v09/historical.json');
for (const row of historicalManifest.rows.filter((r) => r.fixture && r.name === 'normal-paladin')) {
  const bytes = zlib.gunzipSync(
    fs.readFileSync(path.join(root, 'tests/fixtures/beta-history', row.fixture)),
  );
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== row.originalSha256)
    throw Error('Historical fixture hash mismatch');
  saves.push(['archived-engine-v08118-normal-paladin', JSON.parse(bytes)]);
}
for (const [name, raw] of saves) {
  const untouched = JSON.stringify(raw),
    t = performance.now();
  try {
    const g = C.restore(raw, rng(seeds[1]));
    const originalRestoredZone = g.zoneId;
    if (g.zoneId !== 'vale') g.enter('vale');
    g.zone();
    const once = g.snapshot(),
      p = stableProgress(once),
      twice = C.restore(once, rng(seeds[1]));
    twice.zone();
    const after = twice.snapshot(),
      same = isDeepStrictEqual(once, after);
    const expected = name.startsWith('current-') ? stableProgress(raw) : null;
    const diffs = expected
      ? Object.keys(expected).filter((k) => !isDeepStrictEqual(expected[k], p[k]))
      : [];
    saveResults.push({
      name,
      provenance: name.startsWith('archived-')
        ? 'immutable archived exact-old-engine synthetic QA fixture; NOT a player-authored historical save'
        : 'synthetic current-main v4 representative fixture',
      originalUnchanged: untouched === JSON.stringify(raw),
      restoreCpuMs: round(performance.now() - t),
      progressDiffs: diffs,
      progressStableSecondRestore: isDeepStrictEqual(p, stableProgress(after)),
      originalRestoredZone,
      historicalRegionalEntry:
        originalRestoredZone !== 'vale'
          ? 'native enter(vale) after original-area restore; not an original Vale hero position'
          : null,
      fullSnapshotIdempotent: same,
      actualHero: { x: g.hero.x, y: g.hero.y },
      heroClear: !g.blocked(g.hero.x, g.hero.y),
      props: once.zones.vale.props.length,
      missingPropIds: raw.zones.vale.props
        .map((p) => p.id)
        .filter((id) => !once.zones.vale.props.some((p) => p.id === id)),
      routes: census(g, name).routes.map(({ points, ...r }) => r),
      migrationBoundary: revised
        ? 'versioned Greenwood pre-prune migration; other inherited legacy migrations remain active'
        : size === 2700
          ? 'current-source baseline geometry restore'
          : 'unadapted expansion diagnostic; NOT migration acceptance',
    });
  } catch (e) {
    saveResults.push({ name, error: e.stack });
  }
}
const report = {
  provenance,
  worlds,
  saves: saveResults,
  genuinePlayerHistoricalSavesAvailable: false,
  measurementComplete: true,
  stageAComplete: false,
  selectedSize: null,
  selectionBoundary:
    'A measured candidate is not an accepted region. Review placed/skipped essentials, saves, routes, scenes and pacing together; the engineering selection is recorded in the existing handoff.',
};
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(
  path.join(out, 'comparison-' + size + '.json.gz'),
  zlib.gzipSync(JSON.stringify(report)),
);
