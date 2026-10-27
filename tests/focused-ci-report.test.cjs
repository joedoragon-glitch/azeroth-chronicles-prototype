'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { makeReport, renderSummary, publishReport, extractFailureDetail } =
  require('../.github/scripts/focused-ci-report.cjs');
const { run } = require('../.github/scripts/focused-ci.cjs');
const base = {
  testedSha: 'a'.repeat(40),
  baseSha: 'b'.repeat(40),
  paths: ['src/prototype/rules.js'],
  selected: ['tests/cooldown-only.test.cjs'],
  uncovered: [],
  missing: [],
  manualBrowser: [],
  startedAt: '2026-10-27T00:00:00.000Z',
  finishedAt: '2026-10-27T00:00:01.000Z',
  nodeVersion: 'v22',
  platform: 'linux',
};
assert.match(extractFailureDetail('AssertionError [ERR_ASSERTION]: expected 3, observed 2.97\n    at foo:10:2'),
  /expected 3, observed 2.97/);
assert.match(extractFailureDetail('page.waitForFunction: Timeout 15000ms exceeded.'),
  /Timeout 15000ms/);
assert.equal(extractFailureDetail(''), null);
const passing = makeReport({ ...base, checks: [
  { file: 'tests/cooldown-only.test.cjs', kind: 'test', ok: true, status: 0, durationMs: 12 },
] });
assert.equal(passing.result, 'success');
assert.equal(passing.failedChecks.length, 0);
const failing = makeReport({ ...base, checks: [
  { file: 'tests/cooldown-only.test.cjs', kind: 'test', ok: false, status: 1,
    error: 'expected cooldown was 3, observed 2.97', durationMs: 9 },
] });
assert.equal(failing.result, 'failure');
assert.deepEqual(failing.failedChecks.map((check) => check.classification), ['unexplained']);
assert.match(renderSummary(failing), /expected cooldown was 3/);
assert.match(renderSummary(failing), /Comparison base/);
assert.match(renderSummary(failing), /Failed checks/);
const uncovered = makeReport({ ...base, uncovered: ['src/prototype/future.js'], checks: [] });
assert.equal(uncovered.result, 'failure', 'architecture fallback is not gameplay coverage');
const absent = makeReport({ ...base, missing: ['tests/save-writer.test.cjs'], checks: [] });
assert.equal(absent.result, 'failure', 'missing mapped tests cannot be waived');
const browser = makeReport({ ...base, paths: ['tests/audio-browser.test.cjs'],
  selected: [], manualBrowser: ['tests/audio-browser.test.cjs'], checks: [] });
assert.equal(browser.result, 'success', 'unauthorized browser matrix is deferred, not silently executed');
assert.match(renderSummary(browser), /separately authorized acceptance/);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-report-'));
try {
  const reportPath = path.join(tmp, 'focused.json');
  const summaryPath = path.join(tmp, 'summary.md');
  publishReport(failing, { RUNNER_TEMP: tmp, GITHUB_STEP_SUMMARY: summaryPath });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(tmp, 'azeroth-focused-ci-report.json'))).failedChecks,
    failing.failedChecks);
  assert.match(fs.readFileSync(summaryPath, 'utf8'), /Failed checks/);
  assert.equal(fs.existsSync(reportPath), false, 'no unrelated files created');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
// Exercise the real runner's fail-closed coverage gate without spawning broad
// tests or writing a synthetic failure to the GitHub Actions job summary.
const savedSummary = process.env.GITHUB_STEP_SUMMARY;
const savedTemp = process.env.RUNNER_TEMP;
const captured = [];
const originalLog = console.log, originalWarn = console.warn, originalError = console.error;
try {
  delete process.env.GITHUB_STEP_SUMMARY;
  delete process.env.RUNNER_TEMP;
  console.log = (...args) => captured.push(args.join(' '));
  console.warn = (...args) => captured.push(args.join(' '));
  console.error = (...args) => captured.push(args.join(' '));
  assert.throws(() => run(['src/prototype/unmapped-future.js'], () => true),
    /uncovered source paths/, 'the runner must not accept an architecture fallback as behavior coverage');
} finally {
  console.log = originalLog;
  console.warn = originalWarn;
  console.error = originalError;
  if (savedSummary === undefined) delete process.env.GITHUB_STEP_SUMMARY;
  else process.env.GITHUB_STEP_SUMMARY = savedSummary;
  if (savedTemp === undefined) delete process.env.RUNNER_TEMP;
  else process.env.RUNNER_TEMP = savedTemp;
}
assert(captured.some((line) => line.includes('Uncovered changed source requires focused test ownership')));
console.log('PASS focused CI reports retain failure text, exact refs, fail-closed unmapped source and gated browser acceptance');
