'use strict';
// Four bounded negative controls for the shared save/world hooks. No regional
// redesign, certification matrix or baseline regeneration.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const previous = 'eb435b538d73de0eb233e487375368bcf9c28db8';
if (process.argv.includes('--runtime')) {
  const dir = process.argv[process.argv.indexOf('--runtime') + 1];
  const D = require(path.join(dir, 'src/prototype/data'));
  const R = require(path.join(dir, 'src/prototype/rules'));
  require(path.join(dir, 'src/prototype/greenwood-landscape')).configure(D, R, 3200);
  const C = require(path.join(dir, 'src/prototype/engine'));
  const { rng } = require('./fixtures.cjs');
  const rows = [];
  for (const region of ['march', 'highlands', 'frontier', 'crown']) {
    const g = new C('normal', 'paladin', rng(0x47564102));
    g.enter(region);
    const raw = g.snapshot();
    const stable = (z) => ({
      roads: z.roads,
      footpaths: z.footpaths,
      props: z.props,
      npcs: z.npcs,
      enemies: z.enemies,
      nodes: z.nodes,
      buildings: z.buildings,
    });
    rows.push({
      region,
      fresh: stable(raw.zones[region]),
      restored: stable(C.restore(raw, rng(0x47564102)).snapshot().zones[region]),
    });
  }
  fs.writeFileSync(1, JSON.stringify(rows));
  process.exit(0);
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'greenwood-control-'));
try {
  const archive = cp.execFileSync('git', ['archive', previous, 'src/prototype'], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  cp.execFileSync('tar', ['-xf', '-', '-C', dir], { input: archive });
  const run = (source) =>
    JSON.parse(
      cp.execFileSync(process.execPath, [__filename, '--runtime', source], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
      }),
    );
  const before = run(dir),
    after = run(root),
    hash = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
  const regions = before.map((b, i) => ({
    region: b.region,
    freshEqual: hash(b.fresh) === hash(after[i].fresh),
    restoredEqual: hash(b.restored) === hash(after[i].restored),
    beforeFreshSha256: hash(b.fresh),
    afterFreshSha256: hash(after[i].fresh),
    beforeRestoredSha256: hash(b.restored),
    afterRestoredSha256: hash(after[i].restored),
  }));
  const report = {
    comparisonCommit: previous,
    scope:
      'One seeded fresh and one restore state per unchanged other region at the 3200 study configuration; exact roads, props, services, actors, resources and construction, not broad gameplay certification',
    sourceFiles: Object.fromEntries(
      ['greenwood-landscape', 'world', 'save'].map((n) => [
        n,
        crypto
          .createHash('sha256')
          .update(fs.readFileSync(path.join(root, 'src/prototype/' + n + '.js')))
          .digest('hex'),
      ]),
    ),
    regions,
  };
  fs.writeFileSync(
    path.join(root, 'docs/evidence/greenwood-redesign-20261029/scope-controls.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    JSON.stringify(
      regions.map(({ region, freshEqual, restoredEqual }) => ({
        region,
        freshEqual,
        restoredEqual,
      })),
    ),
  );
  process.exitCode = regions.every((r) => r.freshEqual && r.restoredEqual) ? 0 : 1;
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
