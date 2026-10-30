'use strict';
// Reproducible source baseline, not visual or full-campaign acceptance.
const fs = require('node:fs'),
  path = require('node:path'),
  cp = require('node:child_process');
const crypto = require('node:crypto'),
  zlib = require('node:zlib');
const C = require('../../src/prototype/engine');
const { rng } = require('./fixtures.cjs');
const out = path.resolve(__dirname, '../../docs/evidence/greenwood-redesign-20261029/baseline');
fs.mkdirSync(out, { recursive: true });
const seeds = [0x47564101, 0x47564102, 0x47564103, 0x47564104];
const rows = [],
  snapshots = [];
for (const seed of seeds) {
  const g = new C('normal', 'paladin', rng(seed)),
    z = g.zone(),
    size = g.zoneSize();
  snapshots.push([`original-${seed}`, g.snapshot()]);
  const band = 300,
    edge = (p) => p.x < band || p.y < band || p.x > size - band || p.y > size - band;
  let sampled = 0,
    walkable = 0;
  for (let x = 25; x < size; x += 50)
    for (let y = 25; y < size; y += 50) {
      sampled++;
      if (!g.blocked(x, y, 'vale', 15)) walkable++;
    }
  const routes = [];
  for (const n of z.npcs.filter((n) => !/^thorn-trail|thorn-local|mini-field/.test(n.id))) {
    const target = n.servicePoint || n,
      t = performance.now(),
      route = g.route(g.hero, target);
    let length = 0,
      p = g.hero;
    for (const q of route) {
      length += Math.hypot(q.x - p.x, q.y - p.y);
      p = q;
    }
    routes.push({
      id: n.id,
      target: { x: target.x, y: target.y },
      reached: route.length > 0 && Math.hypot(p.x - target.x, p.y - target.y) < 40,
      units: Math.round(length),
      cpuMs: Math.round((performance.now() - t) * 100) / 100,
    });
  }
  rows.push({
    seed,
    size,
    props: z.props.length,
    edgeProps: z.props.filter(edge).length,
    ordinary: z.enemies.filter((e) => e.type === 'mob' && !e.summon).length,
    tribute: z.nodes.reduce((a, n) => a + n.amount, 0),
    questCount: C.data.quests.filter((q) => q[0] === 'vale').length,
    walkableSample: { sampled, walkable, grid: 50, radius: 15, exactPolygonArea: false },
    routes,
    npcs: z.npcs.map((n) => ({ id: n.id, x: n.x, y: n.y, servicePoint: n.servicePoint })),
    enemies: z.enemies.map((e) => ({
      id: e.id,
      type: e.type,
      species: e.species,
      x: e.x,
      y: e.y,
      home: e.home,
      stronghold: e.stronghold,
      habitat: e.habitat,
    })),
    propTypes: z.props.reduce(
      (a, p) => (
        (a[p.structure || p.icon || 'other'] = (a[p.structure || p.icon || 'other'] || 0) + 1), a
      ),
      {},
    ),
  });
}
const report = {
  source: cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  files: Object.fromEntries(
    [
      'engine',
      'greenwood',
      'world',
      'navigation',
      'save',
      'rules',
      'data',
      'visuals',
      'renderer',
    ].map((f) => [
      f,
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.resolve(__dirname, '../../src/prototype/' + f + '.js')))
        .digest('hex'),
    ]),
  ),
  scope:
    'Current rollback source. Synthetic seeded original saves. Native CPU observations, not browser/device/GPU acceptance.',
  rows,
};
fs.writeFileSync(path.join(out, 'census.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(
  path.join(out, 'synthetic-original-v4.json.gz'),
  zlib.gzipSync(JSON.stringify(snapshots)),
);
console.log(
  JSON.stringify(
    rows.map((r) => ({
      seed: r.seed,
      size: r.size,
      props: r.props,
      ordinary: r.ordinary,
      tribute: r.tribute,
      unreached: r.routes.filter((r) => !r.reached).map((r) => r.id),
    })),
  ),
);
