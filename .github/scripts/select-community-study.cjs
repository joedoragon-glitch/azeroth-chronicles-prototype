'use strict';
// Select a real hosted observation run with the exact current executable inputs.
// Test/docs-only follow-ups can retain that run; changed runtime must wait for a fresh one.
const fs = require('node:fs');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const repo = process.env.GITHUB_REPOSITORY;
const branch = process.env.COMMUNITY_BRANCH;
assert.equal(repo, 'joedoragon-glitch/azeroth-chronicles-prototype');
assert.equal(branch, 'integration/community-snapshot-311-20261016');
const git = (...args) =>
  cp.execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const paths = [
  'src/prototype',
  'scripts/community-companion-balance.cjs',
  'scripts/community-companion-observe.cjs',
  'docs/evidence/pr313-validation-continuation-20261016/baseline308-complete-cache.json.gz',
];
async function main() {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(
      'https://api.github.com/repos/' +
        repo +
        '/actions/workflows/community-balance.yml/runs?event=push&per_page=20&branch=' +
        encodeURIComponent(branch),
      {
        headers: {
          authorization: 'Bearer ' + process.env.GITHUB_TOKEN,
          accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
    if (!response.ok) throw Error('Cannot inspect observation runs: HTTP ' + response.status);
    const data = await response.json();
    for (const run of data.workflow_runs) {
      assert.match(run.head_sha, /^[a-f0-9]{40}$/);
      assert(Number.isSafeInteger(run.id));
      try {
        git('cat-file', '-e', run.head_sha + '^{commit}');
      } catch {
        git('fetch', '--depth=1', 'origin', run.head_sha);
      }
      if (git('diff', '--name-only', run.head_sha, 'HEAD', '--', ...paths)) continue;
      fs.appendFileSync(
        process.env.GITHUB_OUTPUT,
        'run_id=' + run.id + '\ncommit=' + run.head_sha + '\n',
      );
      console.log('Selected exact-input hosted study', run.id, run.head_sha, 'status', run.status);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw Error(
    'No fresh observation run matches this runtime; old gameplay observations cannot certify it.',
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
