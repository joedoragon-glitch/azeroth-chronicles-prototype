'use strict';
const fs = require('node:fs');
const cp = require('node:child_process');

// Explicitly reviewed, non-published prose only. Unknown files always get full CI.
// Sprite catalogs, decisions and evidence are build/test inputs, not in this list.
const prose = new Set([
  'README.md',
  'AGENTS.md',
  'CONTROLES.md',
  'docs/ARCHITECTURE.md',
  'docs/DEVELOPMENT_STATE.md',
  'docs/PROJECT_HISTORY.md',
  'docs/DEVELOPMENT_HISTORY_THROUGH_V08133.md',
  'docs/HOUSEKEEPING_PROGRESS.md',
]);

function docsOnly(eventName, event, cwd = process.cwd()) {
  // Main and manual runs retain every release gate and existing concurrency.
  if (eventName !== 'pull_request') return false;
  const base = event?.pull_request?.base?.sha;
  if (!/^[0-9a-f]{40}$/.test(base || '') || /^0+$/.test(base)) return false;
  const git = (args) =>
    cp.execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    try {
      git(['cat-file', '-e', base + '^{commit}']);
    } catch {
      git(['fetch', '--no-tags', '--depth=1', 'origin', base]);
    }
    // Compare the actual tested checkout, including any merge result, to its base.
    // No rename detection: deleting a runtime path can never hide behind a prose rename.
    const paths = git(['diff', '--name-only', '--no-renames', '-z', base, 'HEAD', '--'])
      .split('\0')
      .filter(Boolean);
    return paths.length > 0 && paths.every((file) => prose.has(file));
  } catch {
    return false;
  }
}

if (require.main === module) {
  let onlyDocs = false;
  try {
    onlyDocs = docsOnly(
      process.env.GITHUB_EVENT_NAME,
      JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')),
    );
  } catch {
    // Missing/malformed event data must never bypass checks.
  }
  const result = 'docs_only=' + onlyDocs + '\n';
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, result);
  process.stdout.write(result);
}
module.exports = { docsOnly };
