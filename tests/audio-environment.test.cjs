'use strict';
const assert = require('node:assert/strict');
const { audio } = require('./helpers/audio-context.cjs');
const fixtures = require('../tools/audio/fixtures.js');
const { validateCatalog } = require('../src/prototype/audio-contract.js');
const production = require('../assets/audio/manifest.json');
const flush = () => new Promise((resolve) => setImmediate(resolve));
(async () => {
  const f = await fixtures.create(),
    m = structuredClone(production);
  m.assets = { ...m.assets, ...f.manifest.assets };
  m.assets['diagnostic-a'].kind = 'ambience';
  m.assets['diagnostic-b'].kind = 'ambience';
  m.director.environment = {
    combatGain: 0.45,
    bossGain: 0.25,
    detailGap: [12, 24],
    rules: [
      { id: 'indoor', when: { interior: 'dungeon' }, asset: 'diagnostic-b', gain: 0.24, fade: 2 },
      { id: 'outdoor', when: { interior: 'outdoors' }, asset: 'diagnostic-a', gain: 0.36, fade: 2 },
    ],
  };
  validateCatalog(m);
  for (const mutate of [
    (m) => (m.director.environment.rules[0].asset = 'title'),
    (m) => (m.director.environment.rules[0].when.weather = 'rain'),
    (m) => (m.director.environment.combatGain = 2),
    (m) => (m.director.environment.rules[0].fade = -1),
    (m) => (m.director.environment.detailGap = [2, 1]),
    (m) => (m.assets['diagnostic-a'].loop.end = 9),
  ]) {
    const bad = structuredClone(m);
    mutate(bad);
    assert.throws(() => validateCatalog(bad));
  }
  const a = audio(),
    opts = { baseUrl: 'https://example.test/game/', fetch: f.fetch },
    scene = {
      region: 'vale',
      zone: 'vale',
      interior: 'outdoors',
      started: true,
      situation: 'world',
      engaged: 0,
    };
  a.configureRecordings(m, opts);
  a.enableProduction();
  let fallback = 0;
  a.ambient = () => fallback++;
  a.context = scene;
  a.updateEnvironment(scene);
  assert(await a.environmentPending);
  const bed = a.environmentVoice;
  assert.equal(bed.id, 'diagnostic-a');
  assert.equal(bed.bus, 'ambience');
  assert.equal(bed.targetGain, 0.36);
  assert(bed.osc.loop);
  a.updateEnvironment({ ...scene, engaged: 3 });
  assert.equal(a.environmentVoice, bed);
  assert.equal(bed.targetGain, 0.36 * 0.45);
  a.updateEnvironment({ ...scene, boss: { family: 'thorn' } });
  assert.equal(bed.targetGain, 0.36 * 0.25);
  a.ctx.currentTime += 4;
  a.updateEnvironment(scene);
  assert.equal(bed.targetGain, 0.36);
  a.setSceneMix('menu');
  a.updateEnvironment({ ...scene, situation: 'menu' });
  assert.equal(a.environmentVoice, bed);
  assert(a.mixLevel('ambience') < a.settings.ambience);
  a.setSettings({ muted: true });
  assert.equal(a.mixLevel('ambience'), 0);
  a.setSettings({ muted: false });
  a.setPaused(true);
  a.setPaused(false);
  await flush();
  a.updateEnvironment(scene);
  assert.equal(a.environmentVoice, bed);
  assert.equal(a.environmentVoice.at, bed.at);
  a.updateEnvironment({ ...scene, zone: 'archive', interior: 'dungeon' });
  assert(await a.environmentPending);
  assert.equal(a.environmentVoice.id, 'diagnostic-b');
  assert.equal(a.environmentOutgoing, bed);
  assert(bed.osc.stopped > a.ctx.currentTime);
  a.updateEnvironment(scene);
  assert(await a.environmentPending);
  assert(!a.voices.has(bed));
  const before = a.environmentVoice;
  const bad = structuredClone(m);
  bad.director.environment.rules[0].asset = 'missing';
  assert.throws(() => a.configureRecordings(bad, opts));
  assert.equal(a.environmentVoice, before);
  a.configureRecordings(m, opts);
  assert.equal(a.environmentVoice, null);
  assert(!a.voices.has(before));
  a.updateEnvironment(scene);
  assert(await a.environmentPending);
  assert.notEqual(a.environmentVoice, before);
  a.updateEnvironment({ ...scene, started: false });
  assert.equal(a.environmentVoice, null);
  assert(a.environmentOutgoing);
  a.dispose();
  assert.equal(a.voices.size, 0);
  const delayed = audio();
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  delayed.configureRecordings(m, {
    ...opts,
    fetch: async (...args) => {
      await gate;
      return f.fetch(...args);
    },
  });
  delayed.enableProduction();
  delayed.ambient = () => {};
  delayed.updateEnvironment(scene);
  const stale = delayed.environmentPending;
  delayed.updateEnvironment({ ...scene, interior: 'dungeon' });
  const latest = delayed.environmentPending;
  release();
  assert.equal(await stale, false);
  assert(await latest);
  assert.equal(delayed.environmentVoice.id, 'diagnostic-b');
  delayed.dispose();
  const failed = audio();
  failed.configureRecordings(m, {
    ...opts,
    fetch: async () => {
      throw Error('offline missing');
    },
  });
  failed.enableProduction();
  failed.ambient = () => fallback++;
  failed.updateEnvironment(scene);
  assert.equal(await failed.environmentPending, false);
  assert(failed.environmentFallback);
  const attempt = failed.environmentPending;
  failed.updateEnvironment(scene);
  assert.equal(failed.environmentPending, attempt);
  failed.dispose();
  console.log(
    'PASS independent ambience, combat/boss attenuation, menu/mute, pause transport, bounded crossfades, stale loads, safe replacement and failure recovery',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
