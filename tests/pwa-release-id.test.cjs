'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const {stampWorker, stampSite, validCommit} = require('../scripts/pwa-release-id.cjs');
const root = path.resolve(__dirname, '..');
const version = require('../package.json').version;
const original = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const one = '1'.repeat(40), two = '2'.repeat(40);
assert(validCommit(one));
assert(!validCommit('short'));
const first = stampWorker(original, one, version);
const second = stampWorker(original, two, version);
assert.notEqual(first, second, 'different deployments must register different service workers');
assert.match(first, /const CACHE_VERSION = "azeroth-app-v[^"\n]+-release-111111111111";/);
assert.match(second, /const CACHE_VERSION = "azeroth-app-v[^"\n]+-release-222222222222";/);
assert(first.includes('const APP_FILES = '), 'keep the complete offline app inventory');
assert(first.includes("self.addEventListener('install'"), 'keep the worker install lifecycle');
assert(first.includes("SKIP_WAITING"), 'updates must still wait for player confirmation');
assert(!original.includes('-release-111111111111'),
  'checked-in generated worker remains reproducible');
assert.throws(()=>stampWorker(original, 'not-a-sha', version), /commit SHA/);
assert.throws(()=>stampWorker('const CACHE_VERSION = "foreign";', one, version),
  /Unexpected generated service worker cache version/);

const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-pwa-revision-'));
try {
  fs.writeFileSync(path.join(folder, 'sw.js'), original);
  fs.writeFileSync(path.join(folder, 'build.txt'), one+'\n');
  assert.equal(stampSite(folder, one, version), first);
  assert.equal(fs.readFileSync(path.join(folder, 'sw.js'),'utf8'), first);
  assert.throws(()=>stampSite(folder, two, version), /differs from packaged build/);
  assert.equal(fs.readFileSync(path.join(folder, 'sw.js'),'utf8'), first,
    'failed verification never modifies the deployed worker');
} finally {fs.rmSync(folder,{recursive:true,force:true});}
assert.equal(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), original,
  'release stamping never mutates the repository worker');

// Exercise the real packaging branch without GITHUB_SHA rather than merely
// testing stampSite() with a supplied fixture revision. GitHub PR checkouts
// contain a real HEAD; a bad local/non-Git checkout must fail closed.
const actualHead=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
assert(validCommit(actualHead));
const site=path.join(root,'_site');
try {
  const run=cp.spawnSync(process.execPath,['scripts/build.cjs','--check','--site'],{
    cwd:root,encoding:'utf8',timeout:180000,
    env:{...process.env,GITHUB_SHA:''}
  });
  assert.equal(run.status,0,run.stderr||run.stdout);
  assert.equal(fs.readFileSync(path.join(site,'build.txt'),'utf8').trim(),actualHead);
  const published=fs.readFileSync(path.join(site,'sw.js'),'utf8');
  assert(published.includes('-release-'+actualHead.slice(0,12)),
    'a local site package must use its Git HEAD even without GitHub Actions');
  assert.notEqual(published,original,
    'local publishable service worker must differ from unmodified generated source');
  assert.equal(fs.readFileSync(path.join(root,'sw.js'),'utf8'),original,
    'packaging must never stamp the tracked source worker');
} finally {
  fs.rmSync(site,{recursive:true,force:true});
}
console.log('PASS per-commit PWA revisions, real local Git-HEAD site packaging and offline safety');
