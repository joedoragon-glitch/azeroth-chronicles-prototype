'use strict';
// Stage 5 inventory-only preflight. A green result is NOT release certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { core, scripts } = require('../scripts/site-assets.cjs');
const { publishedFiles, limits } = require('../scripts/audio-assets.cjs');
const manifest = require('../assets/audio/manifest.json');
const app = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'tools/audio/index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const template = fs.readFileSync(path.join(root, 'templates/game.html'), 'utf8');
const registered = publishedFiles(root);
const inventory = new Set(core);

// The existing canonical site inventory, not a new release path, owns packaging.
assert.equal(core.length, inventory.size, 'duplicate core PWA path');
assert(inventory.has('tools/audio/index.html'));
assert(inventory.has('tools/audio/audition.js'));
assert(inventory.has('tools/audio/fixtures.js'));
assert(inventory.has('assets/audio/manifest.json'));
for (const file of registered) assert(inventory.has(file), 'unpackaged audio file ' + file);
for (const file of scripts) assert(inventory.has(file), 'unpackaged runtime script ' + file);
const kinds = { music: 0, ambience: 0, effect: 0 };
for (const asset of Object.values(manifest.assets)) {
  assert(Object.hasOwn(kinds, asset.kind));
  kinds[asset.kind]++;
}
assert.deepEqual(kinds, { music: 83, ambience: 14, effect: 30 });
assert.equal(manifest.schemaVersion, 1);
assert.equal(registered.length, new Set(registered).size, 'duplicate audio package path');
assert.equal(app.scope, './');
assert.equal(app.start_url, './phone.html');
assert.equal(app.id, './');
assert.equal(app.display, 'standalone');
assert.match(sw, /const CACHE_VERSION = /);
assert.match(sw, /const APP_FILES = /);
assert.match(sw, /SKIP_WAITING/);
const templateOrder = [...template.matchAll(/<script src="\.\/([^"]+)"/g)].map(m => m[1]);
assert.deepEqual(templateOrder, scripts, 'canonical multi-file entry script order');

// The optional audio diagnostic must bootstrap the existing campaign dependencies.
// An independent Stage 5 branch starts from main, where these tags are not present
// until unmerged Stage 4. Report this explicitly as a release BLOCKER without
// falsely importing Stage 4's changes or weakening the live PWA tests.
const diagnosticDeps = [
  'src/sprint.js', 'src/prototype/highlands.js',
  'src/prototype/data.js', 'src/prototype/field-onboarding.js',
  'src/prototype/engine.js', 'src/prototype/audio.js',
];
const found = diagnosticDeps.map(dep => ({
  dep,
  index: html.indexOf('<script src="../../' + dep + '"></script>'),
}));
const missing = found.filter(x => x.index < 0).map(x => x.dep);
const inOrder = found.every((x,i) => i === 0 || x.index < 0 ||
  found[i-1].index < 0 || found[i-1].index < x.index);
const diagnosticReady = missing.length === 0 && inOrder;
console.log('PASS Stage 5 inventory-only preflight: ' +
  registered.length + ' registered package paths; ' +
  Object.entries(kinds).map(([k,v]) => k + '=' + v).join(', ') +
  '; ' + inventory.size + ' PWA core paths; canonical entry and update policy');
console.log('RELEASE GATE = BLOCKED (intentional): independent Stages 1–4 unmerged, ' +
  'combined PWA/browser/physical-device acceptance not executed');
console.log('AUDITION BOOTSTRAP ON THIS MAIN BASELINE = ' +
  (diagnosticReady ? 'ready' : 'requires Stage 4 reconciliation') +
  (missing.length ? '; missing script tags: ' + missing.join(', ') : '') +
  (!inOrder ? '; script order incomplete' : ''));
console.log('PWA audio budget (unchanged) = ' + limits.total +
  ' bytes total, ' + limits.perFile + ' bytes per file');
