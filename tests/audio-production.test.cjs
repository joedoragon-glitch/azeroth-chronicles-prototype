'use strict';
const assert = require('node:assert/strict');
const { audio } = require('./helpers/audio-context.cjs');
const production = require('../src/prototype/audio-production.js');
const manifest = require('../assets/audio/manifest.json');
const rules = require('../src/prototype/rules.js');
const data = require('../src/prototype/data.js');
const a = audio();
a.enableProduction();
const scene = { region: 'vale', zone: 'vale', interior: 'outdoors', started: true, engaged: 0 };
const ids = new Set();
for (const zone of [
  ...data.regions.map((r) => r.id),
  ...Object.keys(production.places).filter((id) => !data.regions.some((r) => r.id === id)),
]) {
  for (const peace of [false, true]) {
    const cue = a.productionCue({
      ...scene,
      zone,
      region: production.places[zone] ? zone : 'vale',
      interior: 'dungeon',
      peace,
    });
    ids.add(cue.id);
    for (const stem of cue.stems) assert(manifest.assets[stem.id], stem.id);
    if (cue.stems.length > 1) {
      const loops = cue.stems.map((s) => manifest.assets[s.id].loop);
      assert.equal(loops[0].end - loops[0].start, loops[1].end - loops[1].start);
    }
  }
}
assert.equal(Object.keys(production.places).length, 19);
for (const region of data.regions)
  for (const [extra, prefix] of [
    [{ night: true }, 'night-'],
    [{ settlement: 'refuge' }, 'settlement-'],
  ]) {
    const cue = a.productionCue({ ...scene, ...extra, region: region.id, zone: region.id });
    assert.equal(cue.id, prefix + region.id);
    assert(manifest.assets[cue.id]);
  }
for (const boss of data.bosses) {
  for (const form of ['normal', 'true']) {
    const cue = a.productionCue({ ...scene, boss: { family: boss.id, form } });
    assert.equal(cue.id, 'boss-' + boss.id);
    assert.equal(cue.stems[1].gain, form === 'true' ? 0.55 : 0.12);
    const loops = cue.stems.map((s) => manifest.assets[s.id].loop);
    assert.equal(loops[0].end - loops[0].start, loops[1].end - loops[1].start);
  }
}
assert.equal(data.bosses.length, 11);
assert.equal(Object.values(manifest.assets).filter((a) => a.kind === 'music').length, 83);
assert.equal(Object.values(manifest.assets).filter((a) => a.kind === 'ambience').length, 14);
for (const zone of Object.keys(production.places)) {
  const interior = zone.startsWith('supply-')
    ? 'treasury'
    : data.regions.some((r) => r.id === zone)
      ? 'outdoors'
      : 'dungeon';
  for (const night of [false, true])
    for (const peace of [false, true]) {
      const rule = a.environmentCue({
        ...scene,
        zone,
        interior,
        night,
        peace,
        region: interior === 'outdoors' ? zone : 'vale',
      });
      assert(rule && manifest.assets[rule.asset]?.kind === 'ambience', zone);
    }
}
a.updateEnvironment = () => {};
assert.equal(a.productionCue({ ...scene, started: false }).id, 'title');
assert.equal(a.productionCue({ ...scene, gameOver: true }).id, 'defeat');
a.finaleUntil = 3;
assert.equal(a.productionCue({ ...scene, peace: true }).id, 'finale');
let starts = 0,
  gains = [];
a.setRecordedScore = async (spec) => {
  starts++;
  a.recordedScore = { id: spec.id, voices: [{}, {}] };
  return true;
};
a.setStemGain = (...args) => gains.push(args);
a.sceneDetails = () => {};
a.updateProduction(scene);
a.updateProduction({ ...scene, engaged: 2 });
assert.equal(starts, 1);
assert(gains.some((g) => g[0] === 1 && g[1] > 0));
a.ctx.currentTime = 5;
a.updateProduction(scene);
assert.equal(gains.at(-1)[1], 0);
let steps = 0;
a.noiseBurst = () => {
  steps++;
};
a.tone = () => {};
a.context = scene;
a.footstep({}, 0);
a.footstep({}, 41);
assert.equal(steps, 0);
a.footstep({}, 1);
assert.equal(steps, 1);
a.paused = true;
a.footstep({}, 80);
assert.equal(steps, 1);
a.setSceneMix('menu');
a.enableProduction(false);
assert.equal(a.mixScene, 'menu');
console.log(
  'PASS 19 place identities, night/refuges/peace, 11 boss/TRUE pairs, synchronized loops, transport-preserving intensity and movement-only footsteps',
);
