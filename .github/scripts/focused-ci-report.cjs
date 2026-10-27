'use strict';
// Structured evidence for the existing focused runner; never classifies the
// cause of a failing assertion or changes its pass/fail disposition.
const fs = require('node:fs');
const path = require('node:path');

// Strict coverage applies to live game source, executable tooling and test
// setup helpers. Unmapped data/reference/art in tools/ still produces a
// visible warning, but should not block development without a behavior claim.
function requiresBehaviorCoverage(file) {
  if (file.startsWith('src/')) return true;
  if (!/\.(?:js|cjs|mjs)$/.test(file)) return false;
  return ['scripts/', 'tools/', 'tests/helpers/'].some((prefix) => file.startsWith(prefix));
}

function makeReport({
  testedSha,
  baseSha,
  paths,
  selected,
  uncovered,
  missing,
  manualBrowser,
  checks,
  startedAt,
  finishedAt,
  nodeVersion,
  platform,
}) {
  const failed = checks.filter((check) => !check.ok);
  const coverageFailures = uncovered.filter(requiresBehaviorCoverage);
  return {
    schema: 1,
    testedSha: testedSha || null,
    baseSha: baseSha || null,
    startedAt,
    finishedAt,
    nodeVersion,
    platform,
    changedPaths: paths,
    selectedTests: selected,
    uncoveredPaths: uncovered,
    coverageFailures,
    missingMappedTests: missing,
    manualBrowserAcceptance: manualBrowser,
    checks,
    failedChecks: failed.map(({ file, kind, status, signal, error }) => ({
      file,
      kind,
      status: status ?? null,
      signal: signal || null,
      error: error || null,
      classification: 'unexplained',
    })),
    result: failed.length || missing.length || coverageFailures.length ? 'failure' : 'success',
  };
}

function renderSummary(report) {
  const lines = [
    '## Azeroth Chronicles focused validation',
    '',
    '- **Tested checkout:** `' + (report.testedSha || 'unknown') + '`',
    '- **Comparison base:** `' + (report.baseSha || 'unknown') + '`',
    '- **Node/platform:** ' + report.nodeVersion + ' / ' + report.platform,
    '- **Changed paths:** ' + report.changedPaths.length,
    '- **Selected focused suites:** ' + report.selectedTests.length,
    '- **Result:** **' + report.result + '**',
  ];
  if (report.failedChecks.length) {
    lines.push('', '### Failed checks (cause not inferred)', '');
    for (const check of report.failedChecks) {
      lines.push(
        '- `' +
          check.file +
          '` (' +
          check.kind +
          ', exit ' +
          (check.status ?? 'unknown') +
          (check.signal ? ', signal ' + check.signal : '') +
          (check.error ? ', ' + check.error.replace(/[\r\n|]/g, ' ').slice(0, 180) : '') +
          ')',
      );
    }
  }
  if (report.missingMappedTests.length) {
    lines.push(
      '',
      '**Missing mapped tests:** ' + report.missingMappedTests.map((p) => '`' + p + '`').join(', '),
    );
  }
  if (report.uncoveredPaths.length) {
    lines.push(
      '',
      '**Uncovered changes:** ' +
        report.uncoveredPaths.map((p) => '`' + p + '`').join(', ') +
        ' (architecture fallback is not behavioral coverage)',
    );
  }
  if (report.manualBrowserAcceptance.length) {
    lines.push(
      '',
      '**Browser suites needing separately authorized acceptance:** ' +
        report.manualBrowserAcceptance.map((p) => '`' + p + '`').join(', '),
    );
  }
  lines.push(
    '',
    'Failure classifications require inspection of the exact base/candidate; green focused checks do not certify a manual browser matrix.',
    '',
  );
  return lines.join('\n');
}

function extractFailureDetail(stderr = '', stdout = '') {
  // Only executed for a failing child process; do not misinterpret diagnostic
  // text that a passing test deliberately prints for its negative cases.
  const lines = (stderr + '\n' + stdout).split(/\r?\n/).map((line) => line.trim());
  const first = lines.find((line) =>
    /(?:AssertionError|TypeError|ReferenceError|SyntaxError|TimeoutError|\bError:|not ok \d+|timed out|timeout \d+ms)/i.test(
      line,
    ),
  );
  const fallback = lines.filter(Boolean).slice(-1)[0] || null;
  return (first || fallback)?.slice(0, 300) || null;
}

function publishReport(report, env = process.env) {
  // Reporting is evidence, not a second gate: inability to write a summary
  // must not turn a real passing/failing test into a different result.
  for (const [target, content] of [
    [
      env.RUNNER_TEMP && path.join(env.RUNNER_TEMP, 'azeroth-focused-ci-report.json'),
      JSON.stringify(report, null, 2) + '\n',
    ],
    [env.GITHUB_STEP_SUMMARY, renderSummary(report) + '\n'],
  ]) {
    if (!target) continue;
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.appendFileSync(target, content);
    } catch (error) {
      console.warn('::warning::Cannot write focused CI evidence: ' + error.message);
    }
  }
}

module.exports = {
  makeReport,
  renderSummary,
  publishReport,
  extractFailureDetail,
  requiresBehaviorCoverage,
};
