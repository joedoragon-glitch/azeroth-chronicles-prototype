'use strict';
// Stage 4 source/mixer acceptance. Deliberately does not claim speaker audibility.
const assert = require('node:assert/strict');
const { audio } = require('./helpers/audio-context.cjs');
const { profiles } = require('../src/prototype/audio-mixer.js');
const manifest = require('../assets/audio/manifest.json');
const director = manifest.director;
const a = audio();
a.enableProduction();
const scene = (extra = {}) => ({
  region: 'vale', zone: 'vale', interior: 'outdoors', night: false,
  peace: false, settlement: null, engaged: 0, boss: null,
  started: true, gameOver: false, situation: 'exploration', ...extra,
});
const isMusic = (id) => assert.equal(manifest.assets[id]?.kind, 'music', id);
let placeCases = 0, bossCases = 0, mixCases = 0, environmentCases = 0;

assert.equal(Object.keys(director.places).length, 19);
assert.equal(Object.keys(director.bosses).length, 11);
for (const [zone, place] of Object.entries(director.places)) {
  const outdoor = ['vale', 'march', 'highlands', 'frontier', 'crown'].includes(zone);
  for (const peace of [false, true]) {
    const s = scene({
      region: outdoor ? zone : 'vale', zone,
      interior: outdoor ? 'outdoors' : zone.startsWith('supply-') ? 'treasury' : 'dungeon', peace,
    });
    const cue = a.productionCue(s);
    assert.equal(cue.id, peace ? (place.peace || place.base) : place.base, zone);
    for (const stem of cue.stems) {
      isMusic(stem.id);
      assert(stem.gain >= 0 && stem.gain <= 1);
    }
    const environment = a.environmentCue(s);
    assert(environment, 'Missing environment policy for ' + zone);
    assert.equal(manifest.assets[environment.asset]?.kind, 'ambience', zone);
    placeCases++;
  }
}
for (const region of ['vale', 'march', 'highlands', 'frontier', 'crown']) {
  for (const [extra, key] of [
    [{ night: true }, 'night'], [{ settlement: 'town' }, 'settlement'],
    [{ night: true, settlement: 'town' }, 'settlement'],
  ]) {
    const cue = a.productionCue(scene({ region, zone: region, ...extra }));
    const expected = region === 'vale' && key === 'settlement'
      ? director.places.vale.base : director.places[region][key];
    assert.equal(cue.id, expected, region + '/' + key);
    isMusic(cue.id);
    placeCases++;
  }
}
const estateCue = a.productionCue(scene({ region: 'vale', zone: 'vale',
  estateApproach: true }));
assert.equal(estateCue.id, director.places.vale.settlement,
  'the former settlement track now marks only the peaceful Forest Crypt approach');
assert.equal(estateCue.stems[0].gain, director.places.vale.settlementGain);
for (const [family, spec] of Object.entries(director.bosses)) {
  for (const form of ['normal', 'true']) {
    const cue = a.productionCue(scene({ boss: { family, form }, engaged: 1 }));
    assert.equal(cue.id, spec.base, family);
    assert.equal(cue.stems.length, 2, family);
    assert.equal(cue.stems[0].id, spec.base);
    assert.equal(cue.stems[1].id, spec.true);
    assert.equal(cue.stems[0].gain, spec.gain);
    assert.equal(cue.stems[1].gain, form === 'true' ? spec.trueGain : spec.idleGain);
    for (const stem of cue.stems) isMusic(stem.id);
    const x = manifest.assets[spec.base].loop;
    const y = manifest.assets[spec.true].loop;
    assert.equal(x.end - x.start, y.end - y.start, family + ' paired loop length');
    bossCases++;
  }
}
for (const [extra, expected] of [
  [{ started: false }, 'title'],
  [{ situation: 'title' }, 'title'],
  [{ gameOver: true }, 'defeat'],
  [{ situation: 'game-over' }, 'defeat'],
]) {
  const cue = a.productionCue(scene(extra));
  assert.equal(cue.id, director.specials[expected].asset);
  isMusic(cue.id);
}
a.finaleUntil = a.ctx.currentTime + 10;
assert.equal(a.productionCue(scene({ peace: true })).id, director.specials.finale.asset);
a.finaleUntil = 0;

// Scene and device modifiers multiply user preferences; do not rewrite source mix.
const preferences = {
  master: 0.65, music: 0.4, ambience: 0.25, effects: 0.7, interface: 0.6,
};
a.setSettings({ ...preferences, muted: false });
const factors = {
  world: { music: 1, ambience: 1, effects: 1, interface: 1 },
  menu: { music: 0.22, ambience: 0.15, effects: 0, interface: 1 },
  title: { music: 1, ambience: 0.4, effects: 0, interface: 1 },
};
for (const profile of ['reference', 'quiet', 'phone']) {
  a.setMixProfile(profile);
  for (const [name, sceneFactors] of Object.entries(factors)) {
    a.setSceneMix(name);
    for (const key of ['master', 'music', 'ambience', 'effects', 'interface']) {
      const factor = sceneFactors[key] ?? 1;
      const expected = preferences[key] * profiles[profile][key] * factor;
      assert(Math.abs(a.mixLevel(key) - expected) < 1e-10, profile + '/' + name + '/' + key);
      mixCases++;
    }
  }
}
a.setMixProfile('reference');
a.setSceneMix('menu');
assert.equal(a.mixLevel('effects'), 0, 'game effects do not leak into menus');
assert(a.mixLevel('interface') > 0, 'interface remains usable in menus');
a.setSceneMix('world');
assert(a.mixLevel('effects') > 0, 'game effects recover on menu exit');

const panVoice = { pan: { pan: { value: -0.6 } }, authoredPan: -0.6 };
a.voices.add(panVoice);
a.setMixProfile('phone');
assert.equal(panVoice.pan.pan.value, 0, 'phone downmix centers panned voices');
a.setMixProfile('reference');
assert.equal(panVoice.pan.pan.value, -0.6, 'desktop restores authored pan');
a.voices.delete(panVoice);

const levels = Object.fromEntries(['master', 'music', 'ambience', 'effects', 'interface']
  .map((key) => [key, a.mixLevel(key)]));
a.setSettings({ muted: true });
for (const key of Object.keys(levels)) assert.equal(a.mixLevel(key), 0, 'mute/' + key);
a.setSettings({ muted: false });
for (const [key, level] of Object.entries(levels))
  assert.equal(a.mixLevel(key), level, 'unmute/' + key);

// Ducking reduces music and ambience transiently, not priority interface/effects.
a.ctx.currentTime = 10;
a.duck(0.55);
for (const key of ['music', 'ambience']) {
  const last = a.buses[key].gain.calls.slice(-2);
  assert.equal(last[0][0], 'target', key);
  assert(Math.abs(last[0][1] - a.mixLevel(key) * 0.4) < 1e-10, key);
  assert.equal(last[1][0], 'target', key);
  assert.equal(last[1][1], a.mixLevel(key), key);
}
for (const key of ['effects', 'interface'])
  assert.equal(a.buses[key].gain.calls.at(-1)[1], a.mixLevel(key), key);

// Boss and combat reduce environmental beds via a dedicated coefficient,
// without globally increasing foreground sound gain.
a.ctx.currentTime = 20;
const envScene = scene({ zone: 'vale' });
const envRule = a.environmentCue(envScene);
const baseEnv = a.environmentGain(envRule, envScene);
assert.equal(baseEnv, envRule.gain);
a.environmentGain(envRule, scene({ engaged: 3 }));
assert.equal(a.environmentGain(envRule, envScene),
  envRule.gain * director.environment.combatGain);
a.ctx.currentTime += 3;
assert.equal(a.environmentGain(envRule, envScene), baseEnv);
assert.equal(a.environmentGain(envRule, scene({ boss: { family: 'thorn', form: 'true' } })),
  envRule.gain * director.environment.bossGain);
environmentCases += 4;

// Optimization affects ambient *sources*; music and foreground mix remain available.
// Auto is resolved by the app to this boolean at runtime (not a third audio mixer profile).
const preOptimizationMusic = a.mixLevel('music');
const preOptimizationEffects = a.mixLevel('effects');
assert.equal(a.setOptimizationMode(true), true);
assert.equal(a.playSoundEvent('ambience.birds'), false);
assert.equal(a.mixLevel('music'), preOptimizationMusic);
assert.equal(a.mixLevel('effects'), preOptimizationEffects);
assert.equal(a.setOptimizationMode(false), true);
assert.equal(a.optimizationMode, false);
assert.equal(a.mixLevel('music'), preOptimizationMusic);
assert.equal(a.mixLevel('effects'), preOptimizationEffects);
a.dispose();

console.log('PASS Stage 4 mix source matrix: ' +
  placeCases + ' place/day/night/settlement/peace, ' + bossCases +
  ' boss/TRUE, ' + mixCases + ' profile/scene/bus and ' +
  environmentCases + ' environment attenuation checks; mute, menu, phone pan, duck and optimization');
