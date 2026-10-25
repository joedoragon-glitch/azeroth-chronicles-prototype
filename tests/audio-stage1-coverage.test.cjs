'use strict';
// Deterministic Stage 1 audio-routing audit. No saves, network or sound hardware.
const assert = require('node:assert/strict');
const manifest = require('../assets/audio/manifest.json');
const { audio } = require('./helpers/audio-context.cjs');
const { attach } = require('../tools/audio/coverage-probe.js');

async function run() {
  const a = audio();
  a.enableProduction();
  const trace = attach(a, { limit: 1000 });
  const director = manifest.director;
  const music = new Set(), environments = new Set(), effects = new Set();
  const contexts = [];
  const names = new Set(['vale', 'march', 'highlands', 'frontier', 'crown']);
  const scenario = (zone, props = {}) => ({
    zone, region: names.has(zone) ? zone : zone.startsWith('supply-')
      ? zone.slice('supply-'.length) : zone.startsWith('side-')
        ? zone.split('-')[1] : 'vale',
    interior: names.has(zone) ? 'outdoors' : zone.startsWith('supply-')
      ? 'treasury' : zone.startsWith('side-') ? 'side-dungeon' : 'dungeon',
    started: true, night: false, peace: false, engaged: 0, situation: 'exploration', ...props,
  });
  const sample = (label, scene) => {
    a.context = scene;
    const state = trace.snapshot(scene);
    assert(state.expectedScore, label);
    for (const stem of state.expectedScore.stems) {
      assert.equal(manifest.assets[stem.id]?.kind, 'music', label + ' music ' + stem.id);
      music.add(stem.id);
    }
    if (state.expectedEnvironment) {
      assert.equal(manifest.assets[state.expectedEnvironment]?.kind, 'ambience', label);
      environments.add(state.expectedEnvironment);
    }
    contexts.push({ label, expected: state.expectedScore.id,
      stems: state.expectedScore.stems, ambience: state.expectedEnvironment,
      actual: state.activeScore?.id || null, mode: 'selection_only' });
  };
  for (const zone of Object.keys(director.places)) {
    sample(zone + ':normal', scenario(zone));
    sample(zone + ':peace', scenario(zone, { peace: true }));
    if (names.has(zone)) {
      sample(zone + ':night', scenario(zone, { night: true }));
      sample(zone + ':settlement', scenario(zone, { settlement: 'example-refuge' }));
    }
  }
  for (const boss of Object.keys(director.bosses))
    for (const form of ['normal', 'true'])
      sample('boss:' + boss + ':' + form, scenario('vale', {
        boss: { family: boss, form }, engaged: 1, situation: 'boss',
      }));
  sample('title', scenario('vale', { started: false, situation: 'title' }));
  sample('defeat', scenario('vale', { gameOver: true, situation: 'game-over' }));
  a.finaleUntil = a.ctx.currentTime + 10;
  sample('finale', scenario('vale', { peace: true, situation: 'peace' }));
  a.finaleUntil = 0;

  // Warm dispatch against a fake decoded cache: real matching, not actual PCM.
  const cache = new Map(Object.entries(manifest.assets)
    .filter(([, asset]) => asset.kind === 'effect')
    .map(([id, entry]) => [id, { entry }]));
  a.recordingAssets = { cache, pending: new Map(), touch(id) { return this.cache.get(id); },
    status() { return { pending: 0, decodedBytes: 0 }; } };
  a.createRecording = (id, item, assets, options) => ({ id, bus: options.bus, recorded: true });
  // Reattach after replacing createRecording, so the probe observes each source.
  trace.detach();
  const observed = attach(a, { limit: 1000 });
  a.context = scenario('vale');
  for (const [key, bindings] of Object.entries(director.events)) {
    for (const binding of bindings) {
      a.ctx.currentTime += 0.2;
      const result = a.playSoundEvent(key, { ...(binding.when || {}) });
      assert(result, 'warm routed event ' + key + ' / ' + binding.asset);
      effects.add(binding.asset);
    }
  }
  a.ctx.currentTime += 0.2;
  assert.equal(a.playSoundEvent('effect.footstep'), false);
  a.ctx.currentTime += 0.2;
  a.effect('level');
  const procedural = observed.report();
  assert(procedural.counts.procedural_attempt > 0);
  assert(procedural.recent.some((e) => e.type === 'effect_receipt' && e.event === 'level' && e.outcome === 'procedural_attempted'));
  a.ctx.currentTime += 0.2;
  a.playSoundEvent('effect.powerStrike');
  a.playSoundEvent('effect.powerStrike');
  a.setSettings({ muted: true });
  assert.equal(a.playSoundEvent('effect.powerStrike'), false);
  a.setSettings({ muted: false });
  a.setOptimizationMode(true);
  assert.equal(a.playSoundEvent('ambience.water'), false);
  a.setOptimizationMode(false);
  cache.delete('sfx-power-strike');
  a.assetsForRecordings = async () => ({ load: async () => null });
  a.ctx.currentTime += 0.2;
  assert.equal(a.playSoundEvent('effect.powerStrike'), false);
  const records = observed.report().recent;
  assert(records.some((e) => e.type === 'event_route' && e.outcome === 'throttled'));
  assert(records.some((e) => e.type === 'event_route' && e.outcome === 'muted'));
  assert(records.some((e) => e.type === 'event_route' && e.outcome === 'optimization'));
  assert(records.some((e) => e.type === 'event_route' && e.outcome === 'cold_or_unavailable'));
  assert(records.some((e) => e.type === 'event_route' && e.outcome === 'no_recording_binding'));

  // Score started/failed observations are explicitly mocked instrumentation tests.
  a.setRecordedScore = async (spec) => {
    if (spec.id === 'diagnostic-failure') { a.recordingError = 'simulated failure'; return false; }
    a.recordedScore = { id: spec.id, voices: spec.stems.map((s) => ({ id: s.id, targetGain: s.gain })) };
    return true;
  };
  observed.detach();
  const finalProbe = attach(a, { limit: 100 });
  const spec = a.productionCue(scenario('vale'));
  assert(await a.setRecordedScore(spec));
  assert.equal(finalProbe.snapshot(scenario('vale')).activeScore.id, 'place-vale');
  assert.equal(await a.setRecordedScore({ id: 'diagnostic-failure', stems: spec.stems }), false);
  assert(finalProbe.report().recent.some((e) => e.type === 'score_resolved' && e.outcome === 'failed'));
  finalProbe.detach();

  const byKind = Object.entries(manifest.assets).reduce((counts, [id, asset]) => {
    counts[asset.kind] = (counts[asset.kind] || 0) + 1;
    return counts;
  }, {});
  assert.equal(music.size, byKind.music, 'all authored music IDs reachable in synthetic selection');
  assert.equal(environments.size, byKind.ambience, 'all authored ambience beds selected in synthetic scenes');
  assert.equal(effects.size, byKind.effect, 'all authored WAV IDs bound to a matching synthetic event');
  const result = {
    schemaVersion: 1, baseline: 'Stage 1 selection and mock routing (not actual audible execution)',
    counts: { ...byKind, selectedMusic: music.size, selectedAmbience: environments.size,
      dispatchableWarmWav: effects.size, categories: Object.keys(director.events).length,
      withWav: Object.values(director.events).filter((arr) => arr.length > 0).length,
      scenarios: contexts.length },
    labels: { 'no_recording_binding': 'May use procedural sound; not inherently silent',
      'selection_only': 'Music routed, playback not verified',
      'recording_started': 'Decoded-store mock confirms routing; no PCM test',
      'procedural_attempted': 'Recipe requested, not hardware audible proof' },
    examples: contexts.slice(0, 4),
  };
  if (process.argv.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else console.log('PASS Stage 1 dev-only probe: ' + JSON.stringify(result.counts));
  return result;
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
