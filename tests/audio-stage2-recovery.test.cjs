'use strict';
// Stage 2: true decode/fetch failures, deterministic audio-clock retry policy.
const assert = require('node:assert/strict');
const { audio } = require('./helpers/audio-context.cjs');
const fixtures = require('../tools/audio/fixtures.js');
const production = require('../assets/audio/manifest.json');
const { validateCatalog } = require('../src/prototype/audio-contract.js');

(async () => {
  const fixture = await fixtures.create(), manifest = structuredClone(production);
  for (const id of ['diagnostic-a', 'diagnostic-b']) {
    manifest.assets[id] = { ...fixture.manifest.assets[id], bpm: 120 };
  }
  manifest.assets['diagnostic-env'] = {
    ...fixture.manifest.assets['diagnostic-b'], kind: 'ambience',
  };
  manifest.director.places.vale = {
    base: 'diagnostic-a', peace: 'diagnostic-b', action: 'diagnostic-b', gain: 0.55,
  };
  manifest.director.environment = {
    combatGain: 0.45, bossGain: 0.25, detailGap: [12, 24],
    rules: [
      { id: 'outdoors', when: { interior: 'outdoors' }, asset: 'diagnostic-env', gain: 0.25, fade: 2 },
    ],
  };
  validateCatalog(manifest);
  const opts = { baseUrl: 'https://example.test/game/', fetch: fixture.fetch };
  const scene = {
    zone: 'vale', region: 'vale', interior: 'outdoors', situation: 'exploration',
    started: true, night: false, peace: false, engaged: 0,
  };
  const silenceDetails = (a) => {
    a.sceneDetails = () => {};
    a.cue = { id: 'vale', region: 'vale', peace: false };
  };
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  // Music: first failed download yields fallback, same-scene retry recovers.
  let musicFetches = 0;
  const music = audio();
  music.configureRecordings(manifest, {
    ...opts,
    fetch: async (url, init) => {
      if (String(url).endsWith('/diagnostic-a.wav') && ++musicFetches === 1)
        throw Error('transient score connection failure');
      return fixture.fetch(url, init);
    },
  });
  music.enableProduction();
  silenceDetails(music);
  music.updateEnvironment = () => {};
  music.updateProduction(scene);
  assert.equal(await music.productionPending, false);
  assert.equal(music.recordedScore, null);
  assert.match(music.recordingError, /transient score/);
  assert.equal(music.productionRetry.attempts, 1);
  music.ctx.currentTime += 0.99;
  music.updateProduction(scene);
  assert.equal(music.productionRetry.attempts, 1, 'no hot loop before retry time');
  music.ctx.currentTime += 0.02;
  music.updateProduction(scene);
  assert(await music.productionPending, 'same scene should recover after transient failure');
  assert.equal(music.recordedScore.id, 'diagnostic-a');
  assert.equal(music.recordedScore.voices.length, 2);
  assert.equal(music.recordedScore.voices[0].at, music.recordedScore.voices[1].at);
  assert.equal(music.productionRetry.attempts, 2);
  assert.equal(music.recordingError, null);
  music.updateProduction(scene);
  assert.equal(music.productionRetry.attempts, 2, 'no restart of recovered score');
  music.dispose();

  // Persistent failures are finite, and a new selection gets its own retry budget.
  let failures = 0;
  const persistent = audio();
  persistent.configureRecordings(manifest, {
    ...opts,
    fetch: async () => {
      failures++;
      throw Error('persistent score outage');
    },
  });
  persistent.enableProduction();
  silenceDetails(persistent);
  persistent.updateEnvironment = () => {};
  for (const [i, advance] of [0, 0.99, 0.02, 3.99, 0.02, 100].entries()) {
    persistent.ctx.currentTime += advance;
    persistent.updateProduction(scene);
    if (persistent.productionRetry.pending) assert.equal(await persistent.productionPending, false);
  }
  assert.equal(persistent.productionRetry.attempts, 3, 'bounded retry budget');
  assert.equal(failures, 3, 'no infinite fetch traffic');
  persistent.updateProduction({ ...scene, peace: true });
  assert.equal(persistent.productionRetry.attempts, 1, 'changed score resets retry budget');
  assert.equal(await persistent.productionPending, false);
  persistent.dispose();

  // Environment: first failure preserves fallback, retry starts the authored bed.
  let environmentFetches = 0;
  const ambience = audio();
  ambience.configureRecordings(manifest, {
    ...opts,
    fetch: async (url, init) => {
      if (String(url).endsWith('/diagnostic-b.wav') && ++environmentFetches === 1)
        throw Error('transient environmental outage');
      return fixture.fetch(url, init);
    },
  });
  ambience.enableProduction();
  silenceDetails(ambience);
  ambience.updateEnvironment(scene);
  assert.equal(await ambience.environmentPending, false);
  assert.equal(ambience.environmentFallback, true);
  assert.equal(ambience.environmentVoice, null);
  const failedPromise = ambience.environmentPending;
  ambience.ctx.currentTime += 0.99;
  ambience.updateEnvironment(scene);
  assert.equal(ambience.environmentPending, failedPromise, 'no busy-loop in same scene');
  ambience.ctx.currentTime += 0.02;
  ambience.updateEnvironment(scene);
  assert(await ambience.environmentPending);
  assert.equal(ambience.environmentVoice.id, 'diagnostic-env');
  assert.equal(ambience.environmentFallback, false);
  assert.equal(ambience.environmentError, null);
  assert.equal(ambience.environmentRetry.attempts, 2);
  const bed = ambience.environmentVoice;
  ambience.updateEnvironment(scene);
  assert.equal(ambience.environmentVoice, bed);
  ambience.dispose();

  // Finite ambience failures: keep procedural fallback, allow selection change.
  let envFailures = 0;
  const bad = audio();
  bad.configureRecordings(manifest, { ...opts, fetch: async () => {
    envFailures++;
    throw Error('no ambience');
  } });
  bad.enableProduction();
  silenceDetails(bad);
  for (const delta of [0, 1.01, 4.01, 100]) {
    bad.ctx.currentTime += delta;
    bad.updateEnvironment(scene);
    if (bad.environmentRetry.pending) assert.equal(await bad.environmentPending, false);
  }
  assert.equal(bad.environmentRetry.attempts, 3);
  assert.equal(envFailures, 3);
  assert.equal(bad.environmentFallback, true);
  bad.updateEnvironment({ ...scene, started: false });
  assert.equal(bad.environmentRetry, null, 'scene exit clears retry state');
  bad.dispose();

  // An old asynchronous fetch must not resurrect an environment after a scene change.
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  let blocked = false;
  const delayed = audio();
  delayed.configureRecordings(manifest, {
    ...opts, fetch: async (url, init) => {
      if (!blocked) {
        blocked = true;
        await gate;
      }
      return fixture.fetch(url, init);
    },
  });
  delayed.enableProduction();
  silenceDetails(delayed);
  delayed.updateEnvironment(scene);
  const stale = delayed.environmentPending;
  while (!blocked) await flush();
  delayed.updateEnvironment({ ...scene, started: false });
  release();
  assert.equal(await stale, false);
  assert.equal(delayed.environmentVoice, null);
  delayed.dispose();

  console.log('PASS Stage 2 bounded score/ambience retry, transient recovery, no busy-loop, exhausted budget, scene change and stale-load safety');
})().catch((error) => { console.error(error); process.exitCode = 1; });
