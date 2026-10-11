'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const { docsOnly } = require('../.github/scripts/check-scope.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-ci-scope-'));
const git = (...args) =>
  cp
    .execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    .trim();
const write = (file, content) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
};
const commit = () => {
  git('add', '-A');
  git('commit', '-qm', 'fixture');
  return git('rev-parse', 'HEAD');
};
try {
  git('init', '-q');
  git('config', 'user.name', 'CI fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  write('README.md', 'base');
  write('src/game.js', 'unchanged game');
  const base = commit();
  const event = { pull_request: { base: { sha: base } } };
  assert.equal(docsOnly('pull_request', event, root), false, 'empty diff runs full checks');
  write('README.md', 'updated prose');
  write('docs/DEVELOPMENT_STATE.md', 'status');
  commit();
  assert.equal(docsOnly('pull_request', event, root), true, 'reviewed prose uses fast path');
  assert.equal(docsOnly('push', event, root), false, 'main release gates remain full');
  assert.equal(docsOnly('workflow_dispatch', event, root), false, 'manual runs remain full');
  assert.equal(docsOnly('pull_request', {}, root), false, 'missing base fails closed');
  assert.equal(
    docsOnly('pull_request', { pull_request: { base: { sha: '0'.repeat(40) } } }, root),
    false,
  );
  assert.equal(
    docsOnly('pull_request', { pull_request: { base: { sha: 'f'.repeat(40) } } }, root),
    false,
    'unavailable base fails closed',
  );
  assert.equal(
    docsOnly('pull_request', event, path.join(root, 'missing')),
    false,
    'failed diff fails closed',
  );
  for (const file of [
    'src/game.js',
    'assets/sprites/manifest.json',
    'package-lock.json',
    '.github/workflows/pages.yml',
    'tests/game.test.cjs',
    'docs/DECISIONS.md',
    'docs/GRAPHICS_CANON_SPRITE_PROMPTS.md',
    'docs/evidence/result.json',
    'docs/new-note.md',
  ]) {
    git('reset', '--hard', base);
    write(file, 'changed input');
    commit();
    assert.equal(docsOnly('pull_request', event, root), false, file + ' must run full checks');
  }
  git('reset', '--hard', base);
  git('mv', 'src/game.js', 'AGENTS.md');
  commit();
  assert.equal(
    docsOnly('pull_request', event, root),
    false,
    'runtime deletion hidden by rename must run full checks',
  );
  git('reset', '--hard', base);
  write('README.md', 'prose plus runtime');
  write('src/game.js', 'changed runtime');
  commit();
  assert.equal(docsOnly('pull_request', event, root), false, 'mixed changes run full checks');
  console.log(
    'PASS CI scope: prose-only PRs; full main/manual, runtime, assets, tooling, catalogs, evidence, unknowns, renames and failed comparisons',
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
