'use strict';
const assert = require('node:assert/strict'),
  Assets = require('../src/prototype/audio-assets.js'),
  fixtures = require('../tools/audio/fixtures.js'),
  { audio, context } = require('./helpers/audio-context.cjs');
(async () => {
  const f = await fixtures.create(),
    baseUrl = 'https://example.test/game/';
  const defaults = new Assets(context(), f.manifest, { baseUrl, fetch: f.fetch });
  assert.equal(defaults.budget, 128 * 1024 * 1024, 'default RAM cache must support larger crossfade layers');
  assert.equal(defaults.retentionBudget, 96 * 1024 * 1024,
    'released recordings must return toward the previous 96-MiB retention target');
  assert.equal(new Assets(context(), f.manifest, { baseUrl, fetch: f.fetch,
    budget: 192 * 1024 * 1024 }).budget, 192 * 1024 * 1024);
  assert.throws(() => new Assets(context(), f.manifest, { baseUrl, fetch: f.fetch,
    budget: 192 * 1024 * 1024 + 1 }), /decoded memory budget/);
  // A 90-MiB currently pinned score/bed plus another 12-MiB
  // resampled environment transition needs >96 MiB but fits in 128 MiB.
  // These are accounting-only objects: no large PCM allocation in CI.
  const headroom = new Assets(context(), f.manifest, { baseUrl, fetch: f.fetch });
  const MiB = 1024 * 1024;
  headroom.cache.set('active-score-and-bed', { bytes: 90 * MiB, refs: 1 });
  headroom.bytes = 90 * MiB;
  assert.doesNotThrow(() => headroom.room(12 * MiB),
    '128-MiB default must accommodate one extra 72-second mono environment crossfade');
  assert.throws(() => headroom.room(40 * MiB), /Active recordings fill decoded memory budget/,
    'The higher default must still reject exceeding 128 MiB of pinned buffers');
  // A pinned outgoing score plus the incoming source may temporarily exceed
  // 96 MiB; the old source must only become reclaimable after its release.
  const outgoing = { bytes: 90 * MiB, refs: 1 };
  const incoming = { bytes: 12 * MiB, refs: 1 };
  headroom.cache.set('outgoing-score', outgoing);
  headroom.cache.set('incoming-bed', incoming);
  headroom.bytes = outgoing.bytes + incoming.bytes;
  assert.equal(headroom.cache.size, 2);
  headroom.trimReleased();
  assert.equal(headroom.bytes, 102 * MiB, 'Never evict the pinned outgoing crossfade');
  headroom.release(outgoing);
  assert.equal(headroom.cache.has('outgoing-score'), false,
    'Fade completion must reclaim the old buffer below the retention target');
  assert.equal(headroom.cache.has('incoming-bed'), true,
    'The new live bed must remain pinned and uninterrupted');
  assert.equal(headroom.bytes, 12 * MiB);
  assert.equal(headroom.status().retentionBudget, 96 * MiB);
  assert.throws(() => new Assets(context(), f.manifest, { baseUrl, fetch: f.fetch,
    retentionBudget: 129 * MiB }), /retained memory budget/);
  headroom.dispose();
  defaults.dispose();
  let calls = 0;
  const fetch = async (...args) => {
    calls++;
    return f.fetch(...args);
  };
  const store = new Assets(context(), f.manifest, { baseUrl, fetch, budget: 550000 });
  const [first, duplicate] = await Promise.all([
    store.load('diagnostic-a'),
    store.load('diagnostic-a'),
  ]);
  assert.equal(first, duplicate);
  assert.equal(calls, 1);
  assert.equal(store.bytes, 176400);
  store.retain('diagnostic-a', first);
  await store.load('diagnostic-b');
  assert.equal(store.cache.size, 2);
  store.manifest.assets['diagnostic-c'] = structuredClone(f.manifest.assets['diagnostic-b']);
  await store.load('diagnostic-c');
  assert(!store.cache.has('diagnostic-b'));
  await store.load('diagnostic-click');
  assert(store.bytes <= store.budget);
  assert(store.cache.has('diagnostic-a'));
  store.release(first);
  console.log('PASS lazy/deduplicated decode, measured bytes, pinned LRU cache and budget');

  const bad = structuredClone(f.manifest);
  bad.assets['diagnostic-a'].sha256 = '0'.repeat(64);
  const corrupt = new Assets(context(), bad, { baseUrl, fetch });
  await assert.rejects(corrupt.load('diagnostic-a'), /hash mismatch/);
  bad.assets['diagnostic-a'].variants = [
    {
      src: f.manifest.assets['diagnostic-a'].src,
      sha256: f.manifest.assets['diagnostic-a'].sha256,
    },
  ];
  const variants = new Assets(context(), bad, { baseUrl, fetch });
  assert(await variants.load('diagnostic-a'));
  const codecs = structuredClone(f.manifest);
  codecs.assets['diagnostic-a'].variants = [
    {
      src: f.manifest.assets['diagnostic-a'].src,
      sha256: f.manifest.assets['diagnostic-a'].sha256,
    },
  ];
  const codecContext = context(),
    decode = codecContext.decodeAudioData;
  let attempts = 0;
  codecContext.decodeAudioData = async (bytes) => {
    if (++attempts === 1) throw Error('Unsupported first codec');
    return decode(bytes);
  };
  assert(await new Assets(codecContext, codecs, { baseUrl, fetch }).load('diagnostic-a'));
  assert.equal(attempts, 2);
  const badDuration = structuredClone(f.manifest);
  badDuration.assets['diagnostic-a'].duration = 3;
  await assert.rejects(
    new Assets(context(), badDuration, { baseUrl, fetch }).load('diagnostic-a'),
    /duration/,
  );
  for (const src of [
    '../outside.wav',
    'https://foreign.test/a.wav',
    './assets/audio/../outside.wav',
  ]) {
    const m = structuredClone(f.manifest);
    m.assets['diagnostic-a'].src = src;
    await assert.rejects(new Assets(context(), m, { baseUrl, fetch }).load('diagnostic-a'), /path/);
  }
  const tiny = new Assets(context(), f.manifest, { baseUrl, fetch, budget: 10000 });
  await assert.rejects(tiny.load('diagnostic-a'), /memory budget/);
  const oversized = new Assets(context(), f.manifest, {
    baseUrl,
    fetch: async () => new Response('small', { headers: { 'content-length': '17000000' } }),
  });
  await assert.rejects(oversized.load('diagnostic-a'), /Encoded/);
  const expandedHeader = new Assets(context(), f.manifest, {
    baseUrl,
    fetch: async () => new Response('small', { headers: { 'content-length': '12582912' } }),
  });
  await assert.rejects(expandedHeader.load('diagnostic-a'), /hash mismatch/,
    '12 MiB recorded file must pass the raised 16 MiB size guard before SHA validation');
  expandedHeader.dispose();
  console.log('PASS hashes, codec retry, local paths, actual duration and expanded encoded/decoded budgets');

  const a = audio();
  a.cue = { id: 'vale' };
  a.configureRecordings(f.manifest, { baseUrl, fetch });
  assert(
    await a.setRecordedScore({
      id: 'stems',
      bpm: 120,
      stems: [
        { id: 'diagnostic-a', gain: 0.5 },
        { id: 'diagnostic-b', gain: 0.3 },
      ],
    }),
  );
  assert.equal(a.recordedScore.voices.length, 2);
  assert.equal(a.recordedScore.voices[0].at, a.recordedScore.voices[1].at);
  assert.equal(a.recordedScore.voices[0].osc.loopEnd, 2);
  assert.equal(a.recordingAssets.status().pinned, 2);
  const old = a.recordedScore;
  a.ctx.currentTime = 1.3;
  assert(
    await a.setRecordedScore({
      id: 'next',
      bpm: 120,
      quantizeBars: 1,
      stems: [{ id: 'diagnostic-b' }],
    }),
  );
  assert.equal(a.recordedScore.at, old.at + 2);
  assert(old.voices.every((v) => Number.isFinite(v.osc.stopped)));
  for (let i = 0; i < 20; i++)
    assert(
      await a.setRecordedScore({
        id: 'switch-' + i,
        stems: [{ id: 'diagnostic-a' }, { id: 'diagnostic-b' }],
      }),
    );
  assert(a.voices.size <= 4, 'one outgoing score only');
  a.setStemGain(1, 0.9);
  assert.equal(a.recordedScore.voices[1].targetGain, 0.9);
  const ui = await a.playRecording('diagnostic-click', { bus: 'interface' });
  assert(ui);
  ui.osc.onended();
  assert(!a.voices.has(ui));
  a.setSceneMix('menu');
  assert.equal(a.mixLevel('effects'), 0);
  assert(a.mixLevel('interface') > 0);
  a.setSettings({ interface: 0.2, muted: true });
  assert.equal(a.buses.interface.gain.value, 0);
  a.duck();
  a.setSettings({ music: 0.17, muted: false });
  assert(a.buses.music.gain.value <= 0.17);
  a.setMixProfile('phone');
  a.setSceneMix('world');
  const mono = await a.playRecording('diagnostic-click', { pan: 1 });
  assert.equal(mono.pan.pan.value, 0);
  console.log(
    'PASS synchronized stems, bar transitions, bounded repeated switching, intensity and independent menu/UI mix',
  );

  const wrongLoop = structuredClone(f.manifest);
  wrongLoop.assets['diagnostic-b'].loop.end = 1.5;
  a.configureRecordings(wrongLoop, { baseUrl, fetch });
  assert.equal(
    await a.setRecordedScore({ stems: [{ id: 'diagnostic-a' }, { id: 'diagnostic-b' }] }),
    false,
  );
  assert.equal(a.recordedScore, null);
  assert.equal(a.recordingAssets.status().pinned, 0);
  let notes = 0;
  a.tone = () => notes++;
  a.next = 1.31;
  a.schedule();
  assert(notes > 0);
  console.log(
    'PASS malformed or mismatched recordings return to current procedural score without leaked pins',
  );

  const delayed = audio();
  let finish;
  delayed.configureRecordings(f.manifest, {
    baseUrl,
    fetch: async (url) => {
      await new Promise((resolve) => {
        finish = resolve;
      });
      return f.fetch(url);
    },
  });
  const waiting = delayed.playRecording('diagnostic-click');
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  delayed.setPaused(true);
  delayed.setPaused(false);
  finish();
  assert.equal(await waiting, null);
  assert.equal(delayed.voices.size, 0);
  const disposed = audio();
  let decodeFinish;
  disposed.ctx.decodeAudioData = async (bytes) => {
    await new Promise((resolve) => {
      decodeFinish = resolve;
    });
    return context().decodeAudioData(bytes);
  };
  disposed.configureRecordings(f.manifest, { baseUrl, fetch });
  const pending = disposed.setRecordedScore({ stems: [{ id: 'diagnostic-a' }] });
  while (!decodeFinish) await new Promise((resolve) => setImmediate(resolve));
  disposed.dispose();
  decodeFinish();
  assert.equal(await pending, false);
  assert.equal(disposed.voices.size, 0);
  console.log('PASS pause/resume and dispose during pending decode cannot start stale sounds');

  const priority = audio();
  for (let i = 0; i < 60; i++) priority.tone(60, 1, 0.1, 0.03, 'sine', 'effects');
  assert.equal(priority.voices.size, 60);
  priority.effect('warning');
  assert.equal(priority.voices.size, 62);
  for (let i = 0; i < 20; i++) {
    priority.ctx.currentTime += 0.4;
    priority.effect('warning');
  }
  assert.equal(priority.voices.size, 64);
  assert([...priority.voices].some((v) => v.priority === 3));
  priority.dispose();
  a.dispose();
  delayed.dispose();
  store.dispose();
  variants.dispose();
  console.log(
    'PASS warning priority has reserved capacity and bounded stealing; disposal releases every source',
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
