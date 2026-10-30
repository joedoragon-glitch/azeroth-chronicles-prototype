'use strict';
// Focused construction study. No full-game suite, deployment or acceptance claim.
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process'),
  zlib = require('node:zlib'),
  crypto = require('node:crypto');
const out = path.resolve(__dirname, '../../docs/evidence/greenwood-redesign-20261029');
if (!process.argv.includes('--size')) {
  for (const size of [3200, 3400])
    cp.execFileSync(process.execPath, [__filename, '--size', String(size)], { stdio: 'inherit' });
  process.exit(0);
}
const size = Number(process.argv[process.argv.indexOf('--size') + 1]);
const D = require('../../src/prototype/data'),
  R = require('../../src/prototype/rules');
const others = () =>
  JSON.stringify({
    regions: D.regions.slice(1),
    towns: D.towns.slice(1),
    minors: D.minors.slice(1),
    ports: D.ports.slice(1),
    entrances: D.entrances.slice(1),
    fields: D.fields.slice(1),
    terrain: R.terrain.slice(1),
    sites: R.sites.slice(1),
    forests: R.forests.slice(1),
    landforms: R.landforms.slice(1),
    barriers: R.barriers.slice(1),
    life: R.worldLifePlans.slice(1),
    occupation: R.occupationAnchors.slice(1),
  });
const before = others(),
  { loadRedesign, rng } = require('./fixtures.cjs'),
  C = loadRedesign(size);
const result = {
  size,
  otherRegionalTablesUnchanged: before === others(),
  sourceFiles: Object.fromEntries(
    [
      'greenwood-landscape',
      'greenwood',
      'world',
      'navigation',
      'save',
      'rules',
      'engine',
      'visuals',
      'sprites',
    ].map((n) => [
      n,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '../../src/prototype/' + n + '.js')))
        .digest('hex'),
    ]),
  ),
  fresh: [],
  migration: [],
  status:
    'Focused replacement layout measurements; default dev.237 uses 3200; not authorial or device acceptance',
};
const spatial = (s) => ({
  hero: [s.hero.x, s.hero.y],
  party: s.party.map((p) => [p.id, p.x, p.y, p.order?.x, p.order?.y]),
  props: s.zones.vale.props.map((p) => [p.id, p.x, p.y]),
  npcs: s.zones.vale.npcs.map((p) => [p.id, p.x, p.y, p.servicePoint?.x, p.servicePoint?.y]),
  buildings: s.zones.vale.buildings.map((p) => [p.id, p.x, p.y]),
  nodes: s.zones.vale.nodes.map((p) => [p.id, p.x, p.y, p.amount]),
  enemies: s.zones.vale.enemies.map((p) => [p.id, p.x, p.y, p.home?.x, p.home?.y]),
});
for (const seed of [1196835073, 1196835074, 1196835075, 1196835076]) {
  const g = new C('normal', 'paladin', rng(seed)),
    z = g.zone(),
    blockedSegments = [];
  for (const [i, r] of [...z.roads, ...z.footpaths].entries())
    for (let j = 1; j < r.length; j++)
      if (!g.clearSegment(r[j - 1], r[j], 15)) blockedSegments.push([i, j]);
  const routes = [];
  for (const n of z.npcs.filter((n) => !/^thorn-trail|thorn-local/.test(n.id))) {
    const p = n.servicePoint || n,
      t = performance.now(),
      forward = g.route(g.hero, p),
      reverse = g.route(p, g.hero);
    const reached = (r, target) =>
      r.length > 0 && Math.hypot(r.at(-1).x - target.x, r.at(-1).y - target.y) < 35;
    routes.push({
      id: n.id,
      clear: !g.blocked(p.x, p.y),
      forward: reached(forward, p),
      reverse: reached(reverse, g.hero),
      cpuMs: Math.round(performance.now() - t),
    });
  }
  const once = g.snapshot(),
    twice = C.restore(once, rng(seed)).snapshot(),
    third = C.restore(twice, rng(seed)).snapshot();
  result.fresh.push({
    seed,
    props: z.props.length,
    nature: z.greenwoodNatureCensus,
    ordinary: z.enemies.filter((e) => e.type === 'mob' && !e.summon).length,
    tribute: z.nodes.reduce((a, n) => a + n.amount, 0),
    blockedSegments,
    routes,
    secondSpatialStable: JSON.stringify(spatial(once)) === JSON.stringify(spatial(twice)),
    thirdSpatialStable: JSON.stringify(spatial(twice)) === JSON.stringify(spatial(third)),
    lostOnReload: once.zones.vale.props
      .filter((p) => !twice.zones.vale.props.some((q) => q.id === p.id))
      .map((p) => p.id),
  });
}
const original = JSON.parse(
  zlib.gunzipSync(fs.readFileSync(path.join(out, 'baseline/synthetic-original-v4.json.gz'))),
);
for (const [name, raw] of original) {
  const input = JSON.stringify(raw),
    g = C.restore(raw, rng(1196835073)),
    once = g.snapshot(),
    twice = C.restore(once, rng(1196835073)).snapshot();
  result.migration.push({
    name,
    inputUnchanged: JSON.stringify(raw) === input,
    ordinary: once.zones.vale.enemies.filter((e) => e.type === 'mob' && !e.summon).length,
    tribute: once.zones.vale.nodes.reduce((a, n) => a + n.amount, 0),
    questsUnchanged: JSON.stringify(once.quests) === JSON.stringify(raw.quests),
    paidUnchanged: JSON.stringify(once.paid) === JSON.stringify(raw.paid),
    secondSpatialStable: JSON.stringify(spatial(once)) === JSON.stringify(spatial(twice)),
    unresolved: once.zones.vale.greenwoodMigrationUnresolved,
  });
}
fs.writeFileSync(path.join(out, 'study-' + size + '.json'), JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    size,
    otherRegionalTablesUnchanged: result.otherRegionalTablesUnchanged,
    fresh: result.fresh.map((r) => ({
      seed: r.seed,
      props: r.props,
      blocked: r.blockedSegments,
      unreached: r.routes.filter((p) => !p.forward || !p.reverse || !p.clear).map((p) => p.id),
      second: r.secondSpatialStable,
      third: r.thirdSpatialStable,
      lost: r.lostOnReload,
    })),
    migration: result.migration,
  }),
);
