'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  zlib = require('node:zlib'),
  crypto = require('node:crypto');
const out = path.resolve(__dirname, '../../docs/evidence/greenwood-gva-20261028');
const cp = require('node:child_process');
const summaries = [];
const reviewedHead = cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
for (const size of [2700, 3200, 3400]) {
  const r = JSON.parse(
    zlib.gunzipSync(fs.readFileSync(path.join(out, `comparison-${size}.json.gz`))),
  );
  const w = r.worlds[0],
    times = r.worlds.flatMap((w) => w.routes.map((r) => r.routeCpuMs)).sort((a, b) => a - b);
  summaries.push({
    size,
    provenance: r.provenance,
    seedStateCount: new Set(r.worlds.map((w) => w.sampleSha256)).size,
    props: w.props,
    rural: w.rural,
    grid: w.grid,
    ordinaryEnemies: w.enemies.filter((e) => e.type === 'mob').length,
    routeQueries: r.worlds.reduce((s, w) => s + w.routes.length, 0),
    heroGeometryFailures: r.worlds.flatMap((w) =>
      w.routes.filter((r) => !r.reachable).map((r) => ({ seed: w.seed, id: r.id })),
    ),
    roadSetbackFailures: w.architecture.filter((a) => !a.roadClear),
    companionStressFailures: w.routes.filter((r) => !r.companion20Clear).map((r) => r.id),
    routeCpuWallMs: {
      p50: times[Math.floor(times.length * 0.5)],
      p95: times[Math.floor(times.length * 0.95)],
      max: times.at(-1),
    },
    saveResults: r.saves.map(({ routes, ...s }) => s),
    captures: require(path.join(out, `captures-${size}.json`)),
    journeys: require(path.join(out, `journeys-${size}.json`)),
    selected: false,
    disposition: 'Rejected initial layout; essential scene/frontage/migration gates remain open',
  });
}
const inventory = fs
  .readdirSync(out)
  .filter((f) => f !== 'summary.json' && !/^comparison-\d+\.json$/.test(f))
  .sort()
  .map((file) => {
    const b = fs.readFileSync(path.join(out, file));
    return { file, bytes: b.length, sha256: crypto.createHash('sha256').update(b).digest('hex') };
  });
fs.writeFileSync(
  path.join(out, 'summary.json'),
  JSON.stringify(
    {
      mainSha: '5addd94a0401738e385d834db965694128b76e4b',
      referencePr544Sha: '916ecde8169a292dd0617e897eff3409a27da2f0',
      reviewedHead,
      measuredRuntimeUnchanged: summaries.every((r) =>
        Object.entries(r.provenance.comparedRuntimeSha256).every(
          ([f, hash]) =>
            crypto
              .createHash('sha256')
              .update(fs.readFileSync(path.resolve(__dirname, '../../src/prototype/' + f + '.js')))
              .digest('hex') === hash,
        ),
      ),
      stageAComplete: false,
      selectedSize: null,
      genuineHistoricalPlayerSavesAvailable: false,
      baselineChecks: {
        architecture:
          'Initial main@5addd94a FAIL stale README; independently fixed by merged docs work, original test PASS at main@3377ce6c; #565 closed unmerged',
        townStreet: 'FAIL Vale settlement-major-0 setback 195 < 207',
        pt312: 'FAIL Highlands usable crossing',
        localSites: 'FAIL five baseline scenarios, unchanged on name-only candidate',
        prototypeUi: 'FAIL VM missing PrototypeCriticalPartyNative',
        measurement: 'PASS tests/greenwood-layout-measurement.test.cjs',
        build: 'PASS scripts/build.cjs --check, dev.209',
      },
      reviewBoundary:
        'Production native software Canvas, procedural fallback only, 150%, DPR1; portrait/landscape/desktop/day/night; not browser HUD, registered bitmap/material, Pixi, GPU/device or owner acceptance',
      scenarios: summaries,
      inventory,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Indexed',
  inventory.length,
  'evidence files; all three proposals remain explicitly unaccepted',
);
