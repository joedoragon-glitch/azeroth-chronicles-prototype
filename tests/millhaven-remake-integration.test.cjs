'use strict';
// Owner-approved exact-audio identity, town-only routing and fallback without browser/saves.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { audio } = require('./helpers/audio-context.cjs');
const manifest = require('../assets/audio/manifest.json');
const entry = manifest.assets['millhaven-chamber'];
assert(entry && entry.kind === 'music');
assert.equal(entry.src, './assets/audio/music/millhaven-chamber.mp3');
assert.equal(entry.sha256, '11a6aeb67001e5d1deb2b4aa0c04af39f6a922d5ce104c0edf88990d73e3373d');
assert.equal(entry.bpm, 92);
assert(Math.abs(entry.loop.end - entry.loop.start - 128 * 60 / 92) < 1e-9);
assert(entry.loop.end < entry.duration && entry.duration < 90);
const bytes = fs.readFileSync(path.resolve(__dirname, '../assets/audio/music/millhaven-chamber.mp3'));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256,
  'Game recording must match the owner-approved, heard Candidate B MP3 byte-for-byte');
assert.equal(bytes.toString('ascii', 0, 3), 'ID3');
const a = audio(); a.enableProduction();
const scene = { zone: 'vale', region: 'vale', interior: 'outdoors', started: true,
  millhavenTown: true, night: false, peace: false, engaged: 0, nearbyEngaged: 0 };
const town = a.productionCue(scene);
assert.equal(town.id, 'millhaven-chamber');
assert.deepEqual(town.stems, [{ id: 'millhaven-chamber', gain: 0.7 }]);
assert.equal(a.productionCue({ ...scene, night: true }).id, 'millhaven-chamber');
assert.equal(a.productionCue({ ...scene, millhavenTown: false }).id, 'place-vale');
assert.equal(a.productionCue({ ...scene, estateApproach: true }).id, 'settlement-vale');
assert.equal(a.productionCue({ ...scene, nearbyEngaged: 1 }).id, 'place-vale');
assert.equal(a.productionCue({ ...scene, peace: true }).id, 'peace-vale');
assert.equal(a.productionCue({ ...scene, started: false }).id, 'title');
assert.equal(a.productionCue({ ...scene, interior: 'dungeon' }).id, 'place-vale');
assert.equal(a.productionCue({ ...scene, zone: 'march', region: 'march' }).id, 'place-march');
assert.equal(a.productionCue({ ...scene, gameOver: true }).id, 'defeat');
assert.equal(require('../src/prototype/audio-catalog.js').themes.find(t => t.id === 'vale').bpm,
  92, 'Preserve original synthesized source melody');
// An exhausted town-recording retry must restore the old synth exactly once.
const fallback = audio(); fallback.enableProduction();
fallback.cue = { id: 'vale', night: false, peace: false };
fallback.recordedScore = { id: 'place-vale', voices: [] };
fallback.productionKey = JSON.stringify(['millhaven-chamber', ['millhaven-chamber'], 92, null]);
fallback.productionRetry = { attempts: 3, pending: false, fallback: false };
fallback.stops = 0; fallback.transitions = 0;
fallback.stopRecordedScore = seconds => {
  assert.equal(seconds, 1.2); fallback.recordedScore = null; fallback.stops++;
};
fallback.transitionScore = cue => { assert.equal(cue.id, 'vale'); fallback.transitions++; };
fallback.updateEnvironment = () => {};
fallback.sceneDetails = () => {};
fallback.updateProduction(scene);
fallback.updateProduction(scene);
assert.equal(fallback.stops, 1);
assert.equal(fallback.transitions, 1);
assert.equal(fallback.productionRetry.fallback, true);
console.log('PASS Millhaven exact approved Candidate B asset, town-only routing and synth failure recovery');
