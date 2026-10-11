'use strict';
const assert = require('node:assert/strict');
const Materials = require('../src/prototype/materials.js');
const Renderer = require('../src/prototype/renderer.js');
const { audio } = require('./helpers/audio-context.cjs');

const key = 'terrain:ground:vale';
const entry = {
  src: './assets/materials/fixture.png',
  hash: '1'.repeat(64),
  revision: '1'.repeat(64),
  width: 256,
  height: 256,
  worldSpan: 320,
  opacity: 0.25,
};
const manifest = { version: 1, materials: { [key]: entry } };

(async () => {
  const draws = [];
  class FakeImage {
    set src(url) {
      this.url = url;
      draws.push(this);
    }
  }
  let manifestFetches = 0;
  const layer = new Materials({
    Image: FakeImage,
    fetch: async () => {
      manifestFetches++;
      return { ok: true, json: async () => manifest };
    },
  });
  assert.equal(layer.setOptimizationMode(true), true);
  assert.equal(layer.setOptimizationMode(true), false);
  await layer.load();
  assert.equal(manifestFetches, 0, 'optimized cold boot does not fetch the material manifest');
  assert.equal(layer.install(manifest), true);
  assert.equal(layer.surfaceRevision(key), 'optimization-procedural-v1');
  assert.equal(await layer.ensure(key), null, 'optimized mode does not decode material images');
  assert.equal(layer.paint(null, key, null, null), false);
  assert.equal(draws.length, 0);
  assert.equal(layer.setOptimizationMode(false), true);
  assert.notEqual(layer.surfaceRevision(key), 'optimization-procedural-v1');
  const first = layer.ensure(key);
  assert.equal(draws.length, 1, 'normal mode restores lazy decoding');
  layer.setOptimizationMode(true);
  draws[0].width = draws[0].height = 256;
  draws[0].onload();
  assert.equal(await first, null, 'stale decoding completion cannot populate optimized mode');
  assert.equal(layer.cache.size, 0);
  assert.equal(layer.decoding, 0);
  layer.setOptimizationMode(false);
  const restored = layer.ensure(key);
  assert.equal(draws.length, 2, 'textures can be requested again on exit');
  draws[1].width = draws[1].height = 256;
  draws[1].onload();
  assert(await restored, 'normal decode works after repeated transitions');
  assert(layer.cache.size > 0);

  const decorative = { decorative: true, r: 0, structure: 'wildflowers' };
  assert.equal(Renderer.optimizationClutter(decorative), true);
  for (const important of [
    { ...decorative, decorative: false },
    { ...decorative, r: 12 },
    { ...decorative, roadBlocker: true },
    { ...decorative, sceneRole: 'quest' },
    { ...decorative, structure: 'gatehouse' },
    { ...decorative, structure: 'torch' },
  ])
    assert.equal(Renderer.optimizationClutter(important), false, 'essential prop cannot be culled');

  const sound = audio();
  sound.reserveVoice = () => true;
  assert.equal(sound.setOptimizationMode(true), true);
  assert.equal(sound.setOptimizationMode(true), false);
  sound.tone(60, 1, 0.1, 0.02, 'sine', 'ambience');
  assert.equal(sound.voices.size, 0, 'optimized source does not make ambience oscillators');
  sound.noiseBurst(1, 0.1, 0.02, 'bandpass', 650, 0.7, 'ambience');
  assert.equal(sound.voices.size, 0, 'optimized mode never synthesizes fallback ambient bursts');
  assert.equal(sound.playSoundEvent('ambience.birds'), false, 'no environmental recording request');
  sound.cue = { id: 'vale' };
  sound.sceneDetails({ region: 'vale', interior: 'outdoors', situation: 'exploration', engaged: 0 });
  assert.equal(sound.nextSceneDetail, undefined, 'optimized mode never schedules environmental detail');
  sound.cue = null;
  sound.tone(60, 1, 0.1, 0.02, 'sine', 'effects');
  assert.equal(sound.voices.size, 1, 'combat/effects bus remains available');
  sound.environmentScene = { started: true, interior: 'outdoors' };
  sound.updateEnvironment(sound.environmentScene);
  assert.equal(sound.environmentVoice, null, 'no environment voice starts while optimized');
  assert.equal(sound.setOptimizationMode(false), true);
  assert.equal(sound.optimizationMode, false);
  sound.dispose();
  console.log('PASS Optimization Mode materials, stale requests, reversible decoding, guarded scenery and audio sources');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
