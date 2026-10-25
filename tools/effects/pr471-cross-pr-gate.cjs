'use strict';
/*
 * PR #471: isolated exact-SHA cross-draft acceptance.
 * Fetches public refs, uses git merge-tree (never merges GitHub branches),
 * and runs ONLY the selected native Node tests in throwaway CI worktrees.
 * No dev server, browser/device matrix, full suite, deployment or push.
 *
 * This is an integration smoke, not a release gate approval: CLEAN Git text
 * and PASS native tests do not certify real gameplay visual/hardware parity.
 */
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const output = path.resolve(process.argv[2] ||
  path.join(os.tmpdir(), 'pr471-cross-pr-native.json'));
const checks = [
  {pr: 464, scope: 'Physical Ranger/Archer/pet release/contact and 40-slot effects', tests: [
    'tests/hero-postcast-visuals.test.cjs',
    'tests/pet-postcast-visuals.test.cjs',
    'tests/effect-queue-hero-recovery-reservation.test.cjs',
    'tests/effect-warning-concurrent-bosses.test.cjs',
  ]},
  {pr: 469, scope: 'Pixi/Crown loot, pause composition and cached live warnings', tests: [
    'tests/art321-pixi-loot.test.cjs',
    'tests/pixi-fidelity.test.cjs',
    'tests/effect-warning-protected-side-frame-reuse.test.cjs',
  ]},
  {pr: 470, scope: 'Gesture-gated/bounded soundtrack plus developer diagnostics', tests: [
    'tests/audio-stage2-recovery.test.cjs',
    'tests/effect-diagnostics.test.cjs',
    'tests/effect-warning-anonymous-cast.test.cjs',
  ]},
  {pr: 440, scope: 'Dormant Critical Executions/party receipts versus visual admission', tests: [
    'tests/critical-executions.test.cjs',
    'tests/critical-party-native.test.cjs',
    'tests/effect-queue-hero-recovery-reservation.test.cjs',
  ]},
  {pr: 472, scope: 'Authentic impact foley and underlying graphics remains intact', tests: [
    'tests/audio-stage3-action-audit.test.cjs',
    'tests/effect-warning-ledger-cast.test.cjs',
  ]},
  {pr: 458, scope: 'Moving TRUE bosses with render-local warning geometry', tests: [
    'tests/true-field-boss-hunt.test.cjs',
    'tests/effect-warning-reuse-family-matrix.test.cjs',
  ]},
];
const env = {...process.env,
  GIT_AUTHOR_NAME: 'Unpublished CI',
  GIT_AUTHOR_EMAIL: 'ci@invalid.example',
  GIT_COMMITTER_NAME: 'Unpublished CI',
  GIT_COMMITTER_EMAIL: 'ci@invalid.example'};
function git(args, allow = false, opts = {}) {
  const p = cp.spawnSync('git', args, {cwd: root, encoding: 'utf8',
    maxBuffer: 6 * 1024 * 1024, ...opts});
  if (p.error) throw p.error;
  if (p.status !== 0 && !allow) throw Error(
    'git ' + args.join(' ') + ' failed: ' + (p.stderr || p.stdout).slice(0, 1300));
  return p;
}
function fetchRef(id, remoteRef) {
  const target = 'refs/pr471-audit/' + id;
  git(['fetch', '--quiet', '--no-tags', '--depth=320', 'origin',
    '+' + remoteRef + ':' + target]);
  return git(['rev-parse', target]).stdout.trim();
}
function combination(a, b) {
  const mb = git(['merge-base', a, b], true);
  if (mb.status !== 0) return {status: 'INDETERMINATE',
    reason: 'no provable merge base with available bounded history'};
  const merged = git(['merge-tree', '--write-tree', '--messages', a, b], true);
  if (merged.status === 0) return {status: 'CLEAN',
    ancestor: mb.stdout.trim(),
    tree: merged.stdout.split('\n')[0].trim()};
  if (merged.status === 1) return {status: 'CONFLICT',
    ancestor: mb.stdout.trim(),
    conflicts: (merged.stdout + '\n' + merged.stderr).slice(0, 6500)};
  return {status: 'INDETERMINATE', ancestor: mb.stdout.trim(),
    reason: 'merge-tree failed (' + merged.status + '): ' +
      (merged.stderr || merged.stdout).slice(0, 1800)};
}
function transientCommit(tree, a, b) {
  const p = git(['commit-tree', tree, '-p', a, '-p', b], false, {
    env, input: 'Read-only ephemeral cross-draft CI tree\n'});
  return p.stdout.trim();
}
function selectedNativeTests(tree, a, b, paths) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr471-draft-'));
  let attached = false;
  try {
    const tempCommit = transientCommit(tree, a, b);
    git(['worktree', 'add', '--quiet', '--detach', dir, tempCommit]);
    attached = true;
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
    const tests = [];
    for (const file of paths) {
      if (!fs.existsSync(path.join(dir, file))) {
        tests.push({file, status: 'MISSING'}); continue;
      }
      const p = cp.spawnSync(process.execPath, [file], {
        cwd: dir, env: {...process.env, CI: 'true'},
        encoding: 'utf8', timeout: 45000, maxBuffer: 1024 * 1024});
      const status = p.error ? 'ERROR' : p.status === 0 ? 'PASS' : 'FAIL';
      tests.push({file, status, exitCode: p.status,
        detail: status === 'PASS' ? undefined :
          String(p.stderr || p.stdout || p.error).slice(-1250)});
    }
    return {passed: tests.every(x => x.status === 'PASS'), tests};
  } finally {
    if (attached) git(['worktree', 'remove', '--force', dir], true);
    fs.rmSync(dir, {recursive: true, force: true});
  }
}
function main() {
  // GitHub Actions checks out the PR-event source; leave the checkout alone.
  const ours = git(['rev-parse', 'HEAD']).stdout.trim();
  // checkout@v4 starts with a depth-1 shallow source SHA; fetching the
  // independent main ref alone does not unshallow PR471 history.
  // Fetch THIS exact checked-out SHA (never silently substitute a newer tip).
  const confirmed = fetchRef('checked-out-471', ours);
  if (confirmed !== ours) throw Error('Fetched checkout commit does not match PR event SHA');
  const mainSha = fetchRef('main', 'refs/heads/main');
  const base = combination(mainSha, ours);
  const report = {
    schema: 'pr471-read-only-combined-native-v1',
    checkoutHead: ours, mainSha,
    method: 'git merge-tree + unpushed temporary worktree + selected native tests',
    restrictions: ['no PR merge', 'no ref push', 'no game deployment',
      'no full game/browser/device suite', 'no settings or save changes'],
    baseline: base, comparisons: [], cumulative: null,
  };
  // Main has evolved: pin its exact state before probing open drafts.
  if (base.status !== 'CLEAN') {
    report.cumulative = {status: 'BLOCKED', reason: 'PR #471 vs latest main is not clean'};
  } else {
    const baseCommit = transientCommit(base.tree, mainSha, ours);
    let cumulative = baseCommit;
    let allStagesClean = true;
    const staged = [];
    for (const item of checks) {
      const row = {pr: item.pr, scope: item.scope, requestedTests: item.tests};
      try {
        row.theirs = fetchRef(String(item.pr), 'refs/pull/' + item.pr + '/head');
        // Pairwise testing is ALWAYS against the same latest-main + #471 base.
        row.merge = combination(baseCommit, row.theirs);
        if (row.merge.status === 'CLEAN') {
          row.native = selectedNativeTests(row.merge.tree,
            baseCommit, row.theirs, item.tests);
        }
        // Also track the actual sequential all-stream tree. A single blocker
        // must stop cumulative staging; later pairwise results remain useful.
        if (allStagesClean) {
          const stage = combination(cumulative, row.theirs);
          staged.push({pr: item.pr, status: stage.status,
            conflicts: stage.conflicts, reason: stage.reason});
          console.log('PR471_CUMULATIVE_STAGE ' + JSON.stringify({
            pr: item.pr, status: stage.status,
            conflicts: stage.conflicts?.slice(0, 1800), reason: stage.reason,
          }));
          if (stage.status === 'CLEAN')
            cumulative = transientCommit(stage.tree, cumulative, row.theirs);
          else allStagesClean = false;
        }
      } catch (e) {
        row.merge = {status: 'INDETERMINATE',
          reason: String(e.message).slice(0, 1000)};
        allStagesClean = false;
      }
      report.comparisons.push(row);
      console.log('PR471_CROSS_DRAFT ' + JSON.stringify({
        pr: row.pr, head: row.theirs, status: row.merge.status,
        nativePassed: row.native?.passed,
        nativeTests: row.native?.tests.map(x => ({file: x.file, status: x.status})),
        conflicts: row.merge.conflicts?.slice(0, 1200),
        reason: row.merge.reason,
      }));
    }
    report.cumulative = {status: allStagesClean ? 'CLEAN' : 'BLOCKED',
      staged, tip: allStagesClean ? cumulative : null};
    if (allStagesClean) {
      // A real staged many-PR tree; still only a narrow smoke.
      const files = ['tests/effect-queue-hero-recovery-reservation.test.cjs',
        'tests/hero-postcast-visuals.test.cjs',
        'tests/art321-pixi-loot.test.cjs',
        'tests/audio-stage2-recovery.test.cjs',
        'tests/effect-warning-frame-reuse.test.cjs'];
      const fullTree = git(['rev-parse', cumulative + '^{tree}']).stdout.trim();
      report.cumulative.native = selectedNativeTests(fullTree,
        cumulative, mainSha, files);
    }
  }
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  const failures = report.comparisons.filter(x =>
    x.merge.status === 'INDETERMINATE' || (x.native && !x.native.passed));
  if (report.cumulative.native && !report.cumulative.native.passed)
    failures.push({pr: 'multi', native: report.cumulative.native});
  console.log('PR471_SUMMARY ' + JSON.stringify({
    ours, mainSha, baseline: base.status,
    cleanPairs: report.comparisons.filter(x => x.merge.status === 'CLEAN').length,
    conflicts: report.comparisons.filter(x => x.merge.status === 'CONFLICT')
      .map(x => x.pr),
    nativeFailures: failures.map(x => x.pr),
    cumulative: report.cumulative.status,
    firstCumulativeBlocker: report.cumulative.staged?.find(x => x.status !== 'CLEAN')?.pr,
  }));
  // Conflicts are honest integration blockers; a test or tooling failure is red.
  // An unresolved conflict cannot be labelled a successful combined candidate.
  if (base.status !== 'CLEAN' || failures.length) process.exitCode = 1;
}
main();
