'use strict';
/* Narrow source/catalog contract. Playback and offline behavior use the
 * separately authorized tests/audio-audition-browser.test.cjs acceptance. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const page = read('tools/audio/index.html');
const code = read('tools/audio/audition.js');
const manifest = JSON.parse(read('assets/audio/manifest.json'));
const names = Object.entries(manifest.assets);
const counts = names.reduce((result, [, entry]) => {
  result[entry.kind] = (result[entry.kind] || 0) + 1;
  return result;
}, {});
assert.deepEqual(counts, { music: 83, ambience: 34, effect: 30 });
assert.equal(Object.keys(manifest.director.places).length, 19);
assert.equal(Object.keys(manifest.director.bosses).length, 11);

for (const id of [
  'place', 'scene-mode', 'boss', 'form', 'scene-play', 'kind', 'search',
  'recording', 'record-play', 'stem-play', 'intensity', 'guide-event',
  'guide-text', 'copy-guide', 'profile', 'mix-scene', 'volumes', 'mute',
  'source', 'grid', 'warning', 'ui-play', 'pause', 'stop', 'report',
  'shared-listening', 'shared-play', 'shared-title', 'shared-description',
  'copy-recording-link', 'copy-original-link',
  'waveform', 'measurement', 'status', 'message', 'now-playing',
]) {
  assert.equal((page.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, id);
}
for (const id of ['title', 'defeat', 'finale'])
  assert(manifest.director.specials[id]?.asset, 'Missing special cue: ' + id);
for (const route of Object.values(manifest.director.places)) {
  assert(manifest.assets[route.base], 'Missing place theme');
  if (route.action) assert(manifest.assets[route.action], 'Missing action layer');
  if (route.peace) assert(manifest.assets[route.peace], 'Missing liberation theme');
}
for (const boss of Object.values(manifest.director.bosses)) {
  assert(manifest.assets[boss.base], 'Missing boss theme');
  assert(manifest.assets[boss.true], 'Missing TRUE layer');
}
for (const phrase of [
  "selectSource('production')", 'audio.productionCue(scene)',
  'audio.updateEnvironment(scene)', 'audio.setRecordedScore({',
  'audio.playRecording(id,', 'navigator.clipboard.writeText',
  "registry?.director?.places?.", 'document.hidden || userPaused',
  "requestedLink.get('track')", "requestedLink.get('legacy')",
  'function listeningUrl(key, id)', 'function prepareSharedLink()',
  'function playSharedLink()',
]) assert(code.includes(phrase), 'Missing audition integration: ' + phrase);
assert(!page.includes('The production registry is empty'));
assert(!page.includes('Audio audition</h1>'));
assert(page.includes('Game sound library'));
assert(page.includes('Generated in real time by the game'));
assert(page.includes('New authored soundtrack'));
assert(page.includes('Advanced listening tools'));
assert(page.includes('No save data is accessed.'));
assert(!/\blocalStorage\b|\bsessionStorage\b/.test(code), 'Listening room must never access saves');
console.log('PASS audition source contract: 147 real assets, 19 places, 11 bosses, 3 specials, complete UI controls and save isolation');
