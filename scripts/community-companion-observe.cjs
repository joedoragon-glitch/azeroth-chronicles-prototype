'use strict';
// Observe the existing authored policy unchanged; never retune either engine.
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  zlib = require('node:zlib'),
  cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const baselineSha = '6bc27be31792b1c38147d61e98ceed6acf3e2560';
const harnessSha = '43318a73434bfc961efb5ca353ea13b687ff0315d99243a4f9c5f24a66130b95';
const { cases, trial } = require('./community-companion-balance.cjs');
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHashes = (dir) =>
  Object.fromEntries(
    fs
      .readdirSync(path.join(dir, 'src/prototype'))
      .filter((n) => n.endsWith('.js'))
      .sort()
      .map((n) => [
        'src/prototype/' + n,
        hash(fs.readFileSync(path.join(dir, 'src/prototype', n))),
      ]),
  );
const key = (c) =>
  JSON.stringify(Object.fromEntries(Object.entries(c).sort(([a], [b]) => a.localeCompare(b))));
const json = (v) =>
  JSON.stringify(v, (k, x) => {
    if (typeof x === 'number' && !Number.isFinite(x)) throw Error('Nonfinite observation: ' + k);
    return x;
  });
const matched = (c) => c.party === 'solo' || c.party.startsWith('troops');
function observe(baseline, shard, count, out) {
  if (
    !Number.isInteger(shard) ||
    !Number.isInteger(count) ||
    count !== 8 ||
    shard < 0 ||
    shard >= count
  )
    throw Error('Expected one of eight explicit partitions');
  if (
    hash(fs.readFileSync(path.join(root, 'scripts/community-companion-balance.cjs'))) !== harnessSha
  )
    throw Error('Authored cases/trial policy changed');
  if (
    fs.readFileSync(path.join(baseline, 'community-baseline-commit.txt'), 'utf8').trim() !==
    baselineSha
  )
    throw Error('Wrong baseline receipt');
  const seedPath = path.join(
    root,
    'docs/evidence/pr313-validation-continuation-20261016/baseline308-expanded-cache.json.gz',
  );
  const seed = JSON.parse(zlib.gunzipSync(fs.readFileSync(seedPath)));
  const baselineSources = sourceHashes(baseline),
    candidateSources = sourceHashes(root);
  for (const [p, h] of Object.entries(seed.sources))
    if (baselineSources[p] !== h) throw Error('Seeded baseline source mismatch: ' + p);
  const cache = new Map();
  for (const row of seed.rows) {
    const k = key(row.configuration);
    if (cache.has(k)) throw Error('Duplicate seeded baseline');
    cache.set(k, row);
  }
  const before = require(path.join(baseline, 'src/prototype/engine.js')),
    candidate = require(path.join(root, 'src/prototype/engine.js'));
  const all = cases(),
    configs = all.filter((_, i) => i % count === shard);
  const git = (arg) =>
    cp.execFileSync('git', ['rev-parse', arg], { cwd: root, encoding: 'utf8' }).trim();
  const meta = {
    baselineSha,
    candidateCommit: git('HEAD'),
    candidateTree: git('HEAD^{tree}'),
    harnessSha256: harnessSha,
    observerSha256: hash(fs.readFileSync(__filename)),
    seedSha256: hash(fs.readFileSync(seedPath)),
    seededBaselines: cache.size,
    shard,
    shards: count,
    expected: configs.length,
    totalExpected: all.length,
    sources: { baseline: baselineSources, candidate: candidateSources },
    limits:
      'Unchanged authored 90-second policy; observations retain losses/timeouts/exceptions. Completion is not human/device acceptance or automatic balance approval.',
  };
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'metadata.json'), JSON.stringify(meta, null, 2) + '\n');
  const dataPath = path.join(out, 'rows.jsonl');
  if (fs.existsSync(dataPath)) throw Error('Refusing to overwrite an existing partition');
  fs.writeFileSync(dataPath, '');
  const rows = [];
  const run = (C, c) => {
    try {
      const result = trial(C, c);
      json(result);
      return result;
    } catch (e) {
      return {
        observationFailed: true,
        error: { name: e.name, message: e.message, stack: e.stack },
      };
    }
  };
  try {
    for (const c of configs) {
      const cached = cache.get(key(c));
      const row = {
        configuration: c,
        baseline: matched(c) ? (cached?.baseline ?? run(before, c)) : null,
        baselineProvenance: matched(c)
          ? cached?.source || 'computed against exact #308 in this hosted partition'
          : null,
        candidate: run(candidate, c),
        comparison: matched(c)
          ? 'matched identical configuration'
          : 'candidate-only; compare equal-slot troop rows, never nonexistent baseline pets',
      };
      rows.push(row);
      fs.appendFileSync(dataPath, json(row) + '\n');
      if (rows.length % 25 === 0) console.log('Recorded', rows.length, '/', configs.length);
    }
  } finally {
    fs.writeFileSync(path.join(out, 'rows.jsonl.gz'), zlib.gzipSync(fs.readFileSync(dataPath)));
    meta.completed = rows.length;
    meta.dataSha256 = hash(fs.readFileSync(dataPath));
    meta.candidateExceptions = rows.filter((r) => r.candidate.observationFailed).length;
    meta.baselineExceptions = rows.filter((r) => r.baseline?.observationFailed).length;
    fs.writeFileSync(path.join(out, 'metadata.json'), JSON.stringify(meta, null, 2) + '\n');
  }
  console.log(
    'Completed observations:',
    rows.length,
    '; candidate exceptions:',
    meta.candidateExceptions,
    '; baseline exceptions retained:',
    meta.baselineExceptions,
  );
  if (meta.candidateExceptions || rows.length !== configs.length) process.exitCode = 1;
}
function summarize(input, out) {
  const expectedCommit = cp
    .execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' })
    .trim();
  const expectedTree = cp
    .execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' })
    .trim();
  const expectedSources = json(sourceHashes(root));
  const walk = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  const metaFiles = walk(input).filter((p) => path.basename(p) === 'metadata.json');
  if (metaFiles.length !== 8) throw Error('Expected eight retained partition reports');
  const all = cases(),
    expected = new Set(all.map(key)),
    observed = new Map(),
    shards = new Set(),
    exceptions = [];
  let identity;
  for (const p of metaFiles) {
    const m = JSON.parse(fs.readFileSync(p));
    if (
      m.candidateCommit !== expectedCommit ||
      m.candidateTree !== expectedTree ||
      json(m.sources.candidate) !== expectedSources ||
      m.observerSha256 !== hash(fs.readFileSync(__filename))
    )
      throw Error('Partition does not belong to this exact checked-out candidate');
    const frozen = json({
      candidateCommit: m.candidateCommit,
      candidateTree: m.candidateTree,
      baselineSha: m.baselineSha,
      harnessSha256: m.harnessSha256,
      observerSha256: m.observerSha256,
      sources: m.sources,
      seedSha256: m.seedSha256,
    });
    if (identity && identity !== frozen) throw Error('Mixed candidate/baseline/observer sources');
    identity = frozen;
    if (
      m.baselineSha !== baselineSha ||
      m.harnessSha256 !== harnessSha ||
      m.shards !== 8 ||
      shards.has(m.shard)
    )
      throw Error('Wrong/duplicate partition provenance');
    shards.add(m.shard);
    const data = zlib.gunzipSync(fs.readFileSync(path.join(path.dirname(p), 'rows.jsonl.gz')));
    if (hash(data) !== m.dataSha256) throw Error('Observation bytes differ from partition receipt');
    const rows = data.toString('utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
    const configs = all.filter((_, i) => i % 8 === m.shard);
    if (rows.length !== configs.length || m.completed !== configs.length)
      throw Error('Incomplete partition ' + m.shard);
    const allowed = new Set(configs.map(key));
    for (const r of rows) {
      const k = key(r.configuration);
      if (!expected.has(k) || !allowed.has(k) || observed.has(k))
        throw Error('Unexpected/duplicate/misassigned configuration');
      if (matched(r.configuration) !== !!r.baseline)
        throw Error('Missing or fabricated matched baseline');
      for (const label of ['candidate', 'baseline'])
        if (r[label]?.observationFailed)
          exceptions.push({ configuration: r.configuration, label, ...r[label].error });
      if (
        !r.candidate.observationFailed &&
        (typeof r.candidate.won !== 'boolean' ||
          typeof r.candidate.heroDied !== 'boolean' ||
          !Number.isFinite(r.candidate.seconds))
      )
        throw Error('Malformed candidate outcome');
      observed.set(k, r);
    }
  }
  if (observed.size !== expected.size) throw Error('Missing final candidate configurations');
  const rows = [...observed.values()],
    mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
  const metrics = (a) => {
    const good = a.filter((x) => !x.observationFailed);
    return {
      n: a.length,
      valid: good.length,
      wins: good.filter((x) => x.won).length,
      heroDeaths: good.filter((x) => x.heroDied).length,
      timeouts: good.filter((x) => !x.won && !x.heroDied).length,
      meanSeconds: mean(good.map((x) => x.seconds)),
      meanHeroDamageFraction: mean(
        good.map((x) => {
          const d = x.heroDamage + x.units.reduce((s, u) => s + u.damage, 0);
          return d ? x.heroDamage / d : 0;
        }),
      ),
      meanPartySurvivalFraction: mean(
        good
          .filter((x) => x.units.length)
          .map((x) => x.units.filter((u) => u.survived).length / x.units.length),
      ),
    };
  };
  const parties = [...new Set(all.map((c) => c.party))];
  const groups = parties.map((party) => {
    const a = rows.filter((r) => r.configuration.party === party);
    return {
      party,
      candidate: metrics(a.map((r) => r.candidate)),
      baseline: a[0].baseline ? metrics(a.map((r) => r.baseline)) : null,
    };
  });
  const changed = rows
    .filter(
      (r) =>
        r.baseline &&
        !r.baseline.observationFailed &&
        !r.candidate.observationFailed &&
        (r.baseline.won !== r.candidate.won || r.baseline.heroDied !== r.candidate.heroDied),
    )
    .map((r) => ({
      configuration: r.configuration,
      baseline: { won: r.baseline.won, heroDied: r.baseline.heroDied, seconds: r.baseline.seconds },
      candidate: {
        won: r.candidate.won,
        heroDied: r.candidate.heroDied,
        seconds: r.candidate.seconds,
      },
    }));
  const strata = new Map(),
    petFamilies = new Map();
  for (const row of rows) {
    const { party, cls, mode, region, investment } = row.configuration;
    const label = [party, cls, mode, region, investment].join('/');
    if (!strata.has(label)) strata.set(label, []);
    strata.get(label).push(row);
    for (const unit of row.candidate.units || [])
      if (unit.family) {
        const total = petFamilies.get(unit.family) || {
          family: unit.family,
          appearances: 0,
          survived: 0,
          damage: 0,
          received: 0,
          healing: 0,
          first: 0,
          second: 0,
          interrupted: 0,
          wardSeconds: 0,
          immuneSeconds: 0,
        };
        total.appearances++;
        total.survived += Number(unit.survived);
        for (const field of [
          'damage',
          'received',
          'healing',
          'first',
          'second',
          'interrupted',
          'wardSeconds',
          'immuneSeconds',
        ])
          total[field] += unit[field];
        petFamilies.set(unit.family, total);
      }
  }
  const report = {
    ...JSON.parse(identity),
    status: exceptions.some((e) => e.label === 'candidate')
      ? 'candidate exceptions require repair'
      : 'complete observations; qualitative balance review still required',
    candidateConfigurations: rows.length,
    matchedBaselines: rows.filter((r) => r.baseline).length,
    exceptions,
    groups,
    outcomeChanges: changed,
    stratified: [...strata].map(([configuration, a]) => ({
      configuration,
      candidate: metrics(a.map((r) => r.candidate)),
      baseline: a[0].baseline ? metrics(a.map((r) => r.baseline)) : null,
    })),
    petFamilies: [...petFamilies.values()],
    limits:
      'All losses, timeouts and exceptions retained. Baseline exceptions are failed observations excluded from successful comparisons. Six-unit Highlands/Frontier rows are cap-stress; pet suffixes are family rotation offsets, not skill ranks. No human/device certificate or mandatory pet dominance.',
  };
  if (report.candidateConfigurations !== 6912 || report.matchedBaselines !== 3072)
    throw Error('Authored study totals changed');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(report, null, 2) + '\n');
  const md = [
    '# Community balance observations',
    '',
    `Candidate: ${report.candidateCommit}`,
    '',
    `${rows.length} candidate configurations; ${report.matchedBaselines} matched baseline observations; ${exceptions.length} retained exceptions.`,
    '',
    '| Party | Candidate wins / cases | Hero deaths | Timeouts | Baseline wins / valid |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...groups.map(
      (g) =>
        `| ${g.party} | ${g.candidate.wins} / ${g.candidate.n} | ${g.candidate.heroDeaths} | ${g.candidate.timeouts} | ${g.baseline ? g.baseline.wins + ' / ' + g.baseline.valid : 'candidate only'} |`,
    ),
    '',
    report.limits,
    '',
    'Completion of this study is evidence for the PR audit, not automatic balance approval.',
  ].join('\n');
  fs.writeFileSync(path.join(out, 'summary.md'), md + '\n');
  console.log(md);
  if (report.status.startsWith('candidate exceptions')) process.exitCode = 1;
}
if (require.main === module) {
  try {
    const [, , action, ...a] = process.argv;
    if (action === 'observe')
      observe(path.resolve(a[0]), Number(a[1]), Number(a[2]), path.resolve(a[3]));
    else if (action === 'summarize') summarize(path.resolve(a[0]), path.resolve(a[1]));
    else throw Error('Use observe <baseline> <shard> 8 <output> or summarize <artifacts> <output>');
  } catch (e) {
    console.error(e.stack);
    process.exitCode = 1;
  }
}
module.exports = { observe, summarize };
