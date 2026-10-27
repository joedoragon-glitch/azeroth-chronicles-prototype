'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { makeReport, renderSummary, publishReport } = require('../.github/scripts/focused-ci-report.cjs');
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
console.log('PASS focused CI reports retain exact provenance, unclassified failures and manual-browser status');
