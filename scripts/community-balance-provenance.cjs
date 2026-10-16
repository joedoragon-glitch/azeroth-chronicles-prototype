'use strict';
// Reuse observations only when every executable balance input is identical.
// The only permitted differences are the drawing-only Archive alias, exact cast-label clamp and build label.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  zlib = require('node:zlib'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const observedCommit = 'b676981cbf047144d82e9efc247f56c1a14c5808';
const observedTree = 'f808fe4c73822ef77c5eba20b9f95687c070245c';
const observedRun =
  'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38879597582';
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const key = (c) =>
  JSON.stringify(Object.fromEntries(Object.entries(c).sort(([a], [b]) => a.localeCompare(b))));
function verifyInputs(meta) {
  assert.equal(
    meta.candidateCommit,
    observedCommit,
    'observations must belong to the frozen original run',
  );
  assert.equal(meta.candidateTree, observedTree);
  assert.equal(
    meta.harnessSha256,
    hash(fs.readFileSync(path.join(root, 'scripts/community-companion-balance.cjs'))),
    'authored cases/trial cannot change',
  );
  assert.equal(
    meta.observerSha256,
    hash(fs.readFileSync(path.join(root, 'scripts/community-companion-observe.cjs'))),
    'observation/collection code cannot change',
  );
  assert.equal(
    meta.seedSha256,
    hash(
      fs.readFileSync(
        path.join(
          root,
          'docs/evidence/pr313-validation-continuation-20261016/baseline308-expanded-cache.json.gz',
        ),
      ),
    ),
    'baseline evidence cannot change',
  );
  require(path.join(root, 'src/prototype/engine.js'));
  const loaded = Object.keys(require.cache)
    .filter((p) => p.startsWith(path.join(root, 'src/prototype') + path.sep))
    .map((p) => path.relative(root, p))
    .sort();
  assert(
    !loaded.includes('src/prototype/combat-visuals.js') &&
      !loaded.includes('src/prototype/renderer.js') &&
      !loaded.includes('src/prototype/build-info.js'),
    'drawing/build exceptions must not enter the executable engine dependency graph',
  );
  for (const p of loaded)
    assert.equal(
      hash(fs.readFileSync(path.join(root, p))),
      meta.sources.candidate[p],
      p + ' exact executable balance input',
    );
  const allowed = new Set([
      'src/prototype/renderer.js',
      'src/prototype/combat-visuals.js',
      'src/prototype/build-info.js',
    ]),
    changed = [];
  const current = fs
    .readdirSync(path.join(root, 'src/prototype'))
    .filter((n) => n.endsWith('.js'))
    .map((n) => 'src/prototype/' + n)
    .sort();
  assert.deepEqual(
    current,
    Object.keys(meta.sources.candidate).sort(),
    'no unreviewed runtime owner added or removed',
  );
  for (const p of current)
    if (hash(fs.readFileSync(path.join(root, p))) !== meta.sources.candidate[p]) {
      assert(allowed.has(p), 'unobserved runtime change requires a fresh study: ' + p);
      changed.push(p);
    }
  // Reverse only the reviewed alias flag and generated version literal. Any
  // other byte change, even in these two owners, needs separate observation.
  const renderer = fs.readFileSync(path.join(root, 'src/prototype/renderer.js'), 'utf8');
  const originalAlias = renderer.replace(
    /\? \{\s+\.\.\.e,\s+renderKind: 'prop',\s+structure: 'scroll-stack',\s+decorative: true,\s+sceneRole: 'dry-stacks',\s+\}/,
    "? { ...e, renderKind: 'prop', structure: 'scroll-stack', sceneRole: 'dry-stacks' }",
  );
  assert.equal(
    hash(originalAlias),
    meta.sources.candidate['src/prototype/renderer.js'],
    'renderer differs only by the exact reviewed Archive alias flag',
  );
  const castRepair = require('../tests/fixtures/pr313-cast-viewport-repair.json');
  const cues = fs.readFileSync(path.join(root, castRepair.file), 'utf8');
  assert.equal(cues.split(castRepair.after).length, 2, 'exact reviewed viewport drawing block');
  assert.equal(
    hash(cues.replace(castRepair.after, castRepair.before)),
    meta.sources.candidate[castRepair.file],
    'all other cast drawing bytes unchanged',
  );
  const build = fs.readFileSync(path.join(root, 'src/prototype/build-info.js'), 'utf8');
  assert.equal(
    hash(build.replace('0.9.1+snapshot.dev.73', '0.9.1+snapshot.dev.71')),
    meta.sources.candidate['src/prototype/build-info.js'],
    'only the generated build label changed',
  );
  return {
    loadedEngineOwners: loaded,
    exactEngineHashes: Object.fromEntries(loaded.map((p) => [p, meta.sources.candidate[p]])),
    changedPresentationOwners: changed,
  };
}
function verify(input, out) {
  const walk = (d) =>
    fs
      .readdirSync(d, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(input),
    metas = files.filter((p) => path.basename(p) === 'metadata.json'),
    summaryFile = files.find((p) => path.basename(p) === 'summary.json');
  assert.equal(metas.length, 8, 'all eight original partitions required');
  assert(summaryFile, 'original completed summary required');
  const { cases } = require('./community-companion-balance.cjs'),
    configs = cases(),
    expected = new Map(configs.map((c, i) => [key(c), i])),
    seen = new Set(),
    shards = new Set();
  let proof,
    identity,
    matched = 0;
  for (const p of metas) {
    const m = JSON.parse(fs.readFileSync(p)),
      next = verifyInputs(m);
    const frozen = JSON.stringify({
      sources: m.sources,
      harness: m.harnessSha256,
      observer: m.observerSha256,
      seed: m.seedSha256,
    });
    if (identity) assert.equal(frozen, identity, 'mixed original evidence');
    identity = frozen;
    proof = next;
    assert.equal(m.shards, 8);
    assert(!shards.has(m.shard));
    shards.add(m.shard);
    const data = zlib.gunzipSync(fs.readFileSync(path.join(path.dirname(p), 'rows.jsonl.gz')));
    assert.equal(hash(data), m.dataSha256, 'original observation data receipt');
    const rows = data.toString().trim().split('\n').filter(Boolean).map(JSON.parse);
    assert.equal(rows.length, configs.filter((_, i) => i % 8 === m.shard).length);
    assert.equal(m.completed, rows.length);
    for (const r of rows) {
      const k = key(r.configuration);
      assert(
        expected.has(k) && expected.get(k) % 8 === m.shard && !seen.has(k),
        'unique correctly assigned authored case',
      );
      seen.add(k);
      assert(!r.candidate.observationFailed, 'candidate exceptions require repair');
      const needsBaseline =
        r.configuration.party === 'solo' || r.configuration.party.startsWith('troops');
      assert.equal(!!r.baseline, needsBaseline);
      if (needsBaseline) matched++;
    }
  }
  assert.equal(seen.size, 6912);
  assert.equal(matched, 3072);
  const summary = JSON.parse(fs.readFileSync(summaryFile));
  assert.equal(summary.candidateCommit, observedCommit);
  assert.equal(summary.candidateTree, observedTree);
  assert.equal(summary.candidateConfigurations, 6912);
  assert.equal(summary.matchedBaselines, 3072);
  assert(!summary.exceptions.some((e) => e.label === 'candidate'));
  const verifiedCommit = cp
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
    .trim();
  const result = {
    status: 'unchanged executable balance inputs; original observations retained without replay',
    observedCommit,
    observedTree,
    observedRun,
    verifiedForCommit: verifiedCommit,
    candidateConfigurations: seen.size,
    matchedBaselines: matched,
    originalSummarySha256: hash(fs.readFileSync(summaryFile)),
    ...proof,
    limits:
      'This verifies source/input equivalence and original study completeness. Final visual/browser checks and qualitative balance judgment remain separate release requirements.',
  };
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'provenance.json'), JSON.stringify(result, null, 2) + '\n');
  fs.copyFileSync(summaryFile, path.join(out, 'observed-summary.json'));
  console.log(JSON.stringify(result, null, 2));
}
if (require.main === module) {
  try {
    verify(path.resolve(process.argv[2]), path.resolve(process.argv[3]));
  } catch (e) {
    console.error(e.stack);
    process.exitCode = 1;
  }
}
module.exports = { verifyInputs, verify };
