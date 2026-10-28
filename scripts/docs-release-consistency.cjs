'use strict';
// Minimal pre-publication docs/source consistency gate. No network, browser or broad tests.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tick = String.fromCharCode(96);

function inspect(b, ctx = {}) {
  const errors = [];
  const version = b.pkg?.version;
  if (!/^\d+\.\d+\.\d+\+snapshot\.dev\.\d+$/.test(version || '')) {
    return ['invalid package.json snapshot version'];
  }
  if (b.lock?.version !== version || b.lock?.packages?.['']?.version !== version) {
    errors.push('package-lock.json version mismatch');
  }
  if (!String(b.buildInfo).includes('version:"' + version + '"')) {
    errors.push('build-info.js version mismatch');
  }
  if (!String(b.sw).includes('azeroth-app-v' + version + '"')) {
    errors.push('sw.js cache version mismatch');
  }
  const markers = [...String(b.state).matchAll(/^<!-- CURRENT_BUILD_VERSION: ([^\s]+) -->$/gm)];
  if (markers.length !== 1 || markers[0][1] !== version) {
    errors.push('Development state CURRENT_BUILD_VERSION missing or stale');
  }
  if (!String(b.state).includes('**Current code/build version:** ' + tick + version + tick)) {
    errors.push('Development state visible current source version missing or stale');
  }
  const row = String(b.state).match(/^\| Build\/cache version \|\s*\*\*\x60([^\x60]+)\x60\*\*/m);
  if (row && row[1] !== version) errors.push('Development state build/cache table is stale');
  for (const line of String(b.state).split(/\r?\n/).slice(0, 34)) {
    if (/Current public game:|Latest verified playable update/i.test(line)) {
      const claim = line.match(/\b\d+\.\d+\.\d+\+snapshot\.dev\.\d+\b/);
      if (claim && claim[0] !== version) errors.push('Development state incorrectly claims an older current release');
    }
  }
  if (/(?:Last verified game build|Current public game|Current game build)[^\n]*snapshot\.dev\.\d+/i.test(b.readme)) {
    errors.push('README duplicates current version instead of linking to Development state');
  }
  if (/published[^\n]*\bdev\.\d+\b/i.test(String(b.agents).split(/\r?\n/).slice(0, 4).join(' '))) {
    errors.push('AGENTS opening duplicates dated published version');
  }
  const liveIndex = String(b.index).split(/\r?\n/).filter(line =>
    /^\*\*(?:28 October routing refresh|Current release and documentation routing|Readable current status)/i.test(line));
  if (liveIndex.some(line => /\bdev\.\d+\b/.test(line))) {
    errors.push('Documentation index current routing repeats a build number');
  }
  // If a game-facing runtime file changes, update an owning feature/player
  // document in the same PR. This is a presence gate; reviewers verify accuracy.
  if (Array.isArray(ctx.changedPaths) && ctx.changedPaths.length) {
    const runtime = ctx.changedPaths.filter(p =>
      /^src\/prototype\/.*\.(?:js|json)$|^styles\/.*\.css$|^assets\/(?:audio|sprites)\/|^tools\/(?:audio|sprites)\/.*\.(?:js|css|html|json)$|^(?:index|phone)\.html$/.test(p));
    const documented = ctx.changedPaths.some(p =>
      /^docs\/.*\.md$|^(?:README|AGENTS|CONTROLES|GUIA_EN_ESPANOL)\.md$/.test(p));
    if (runtime.length && !documented) {
      errors.push('Runtime changes have no accompanying feature/player documentation update in this PR');
    }
  }
  if (ctx.previousVersion && ctx.previousVersion !== version &&
      !(ctx.changedPaths || []).includes('docs/DEVELOPMENT_STATE.md')) {
    errors.push('Version bump omits Development state change in same PR/commit');
  }
  return errors;
}

function run() {
  const read = p => fs.readFileSync(path.join(root, p), 'utf8');
  const bundle = {
    pkg: JSON.parse(read('package.json')),
    lock: JSON.parse(read('package-lock.json')),
    buildInfo: read('src/prototype/build-info.js'),
    sw: read('sw.js'),
    state: read('docs/DEVELOPMENT_STATE.md'),
    readme: read('README.md'),
    agents: read('AGENTS.md'),
    index: read('docs/DOCUMENTATION_INDEX.md'),
  };
  const ctx = {};
  const base = process.env.CI_BASE_SHA;
  if (base && !/^0{40}$/.test(base)) {
    ctx.changedPaths = cp.execFileSync('git', ['diff', '--name-only', base, 'HEAD'], {
      cwd: root, encoding: 'utf8',
    }).trim().split('\n').filter(Boolean);
    ctx.previousVersion = JSON.parse(cp.execFileSync('git', ['show', base + ':package.json'], {
      cwd: root, encoding: 'utf8',
    })).version;
  }
  const errors = inspect(bundle, ctx);
  if (errors.length) {
    for (const e of errors) console.error('::error::Release documentation: ' + e);
    throw Error(errors.length + ' documentation/source inconsistencies; publication blocked');
  }
  console.log('PASS release documentation contract for ' + bundle.pkg.version +
    ' (published/device-verified are separate evidence statuses)');
}
if (require.main === module) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { inspect, run };
