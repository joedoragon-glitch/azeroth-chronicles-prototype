const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
module.exports = function sourceBaseline(ref) {
  try {
    return cp.execFileSync('git', ['show', ref + ':src/prototype/visuals.js'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (error) {
    const index = require('./source-baselines/index.json');
    const entry =
      /^[a-f0-9]{7,40}$/.test(ref) &&
      index.entries.find((e) => e.localCommits.some((commit) => commit.startsWith(ref)));
    if (!entry) throw error;
    const source = fs.readFileSync(path.join(root, entry.path));
    const hash = require('node:crypto').createHash('sha256').update(source).digest('hex');
    if (hash !== entry.sha256) throw new Error('Archived baseline hash mismatch');
    return source.toString('utf8');
  }
};
