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
assert.equal(Object.values(manifest.assets).filter((a) => a.kind === 'ambience').length, 34);
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
const idleVale = a.productionCue({ ...scene, region: 'vale', zone: 'vale',
  settlement: null, engaged: 0 });
assert.deepEqual(idleVale.stems.map(s => s.id), ['place-vale', 'action-vale']);
assert.equal(idleVale.stems[1].gain, 0,
  'Greenwood encounter layer must start silent in exploration');
const millhaven = a.productionCue({ ...scene, region: 'vale', zone: 'vale',
  settlement: 'millhaven', engaged: 0 });
assert.deepEqual(millhaven.stems.map(s => s.id), ['settlement-vale', 'action-vale']);
assert.equal(millhaven.stems[1].gain, 0,
  'Millhaven encounter music must be loaded silently until nearby combat');
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
// Regression: a loaded hero may stand beside a refuge while the game is
// showing its inactive title. That snapshot must NOT retain a settlement
// hold and replace the first true outdoor track with settlement music.
a.updateProduction({ ...scene, settlement: 'vale-refuge' });
assert.equal(a.productionKey && JSON.parse(a.productionKey)[0], 'settlement-vale');
a.updateProduction({ ...scene, settlement: 'vale-refuge', started: false, situation: 'title' });
assert.equal(a.settlementZone, null);
assert.equal(a.settlementUntil, 0);
a.updateProduction({ ...scene, situation: 'exploration', settlement: null });
assert.equal(JSON.parse(a.productionKey)[0], 'place-vale',
  'title snapshot must never leak refuge-scoring into new exploration');
a.updateProduction({ ...scene, started: true, situation: 'menu' });
assert.equal(a.mixScene, 'world', 'in-game menu preserves music level');
a.updateProduction({ ...scene, started: true, situation: 'pause' });
assert.equal(a.mixScene, 'world', 'manual pause preserves music level');
a.updateProduction({ ...scene, started: false, situation: 'menu' });
assert.equal(a.mixScene, 'title', 'main title settings still use title mix');
a.combatUntil = 0;
a.ctx.currentTime = 25;
a.updateProduction({ ...scene, settlement: 'millhaven', engaged: 2, nearbyEngaged: 0 });
assert.equal(gains.at(-1)[1], 0,
  'distant aggro must not turn on encounter music in Millhaven');
a.updateProduction({ ...scene, settlement: 'millhaven', engaged: 2, nearbyEngaged: 2 });
assert(gains.at(-1)[1] > 0, 'nearby combat should still raise the encounter stem');
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
// #709 authorial preservation: original sparse night-insect events remain
// in Vale, Highlands, Frontier and Crown until a *new approved recording*
// supersedes them. Marches keep their distinct water/night detail. A generic
// existing cue is a review item, not authorization to erase audible content.
const detailsAudio = audio();
detailsAudio.enableProduction();
detailsAudio.cue = { id: 'vale' };
let detailEvents = [], detailTones = [];
detailsAudio.playSoundEvent = (name) => { detailEvents.push(name); return true; };
detailsAudio.tone = (...args) => { detailTones.push(args); };
detailsAudio.noiseBurst = () => { throw Error('Unexpected fallback detail'); };
const expectedDetails = {
  vale: 'ambience.insects',
  march: 'ambience.water',
  highlands: 'ambience.insects',
  frontier: 'ambience.insects',
  crown: 'ambience.insects',
};
for (const [region, expected] of Object.entries(expectedDetails)) {
  detailsAudio.ctx.currentTime += 41;
  detailsAudio.nextSceneDetail = 0;
  detailEvents = [];
  detailTones = [];
  detailsAudio.sceneDetails({
    zone: region, region, interior: 'outdoors', night: true, peace: false,
    engaged: 0, boss: null, settlement: null, started: true, situation: 'exploration',
  });
  assert.deepEqual(detailEvents, [expected],
    region + ' nighttime behavior must survive sound-quality work');
  assert.equal(detailTones.length, region === 'march' ? 1 : 0,
    region + ' night must retain only its intended detail');
}
// No registered insect recording currently exists. Exercise the real
// three-tone procedural fallback, not only the successful-event stub above.
detailsAudio.playSoundEvent = (name) => { detailEvents.push(name); return false; };
for (const region of ['vale', 'highlands', 'frontier', 'crown']) {
  detailsAudio.ctx.currentTime += 41;
  detailsAudio.nextSceneDetail = 0;
  detailEvents = [];
  detailTones = [];
  detailsAudio.sceneDetails({
    zone: region, region, interior: 'outdoors', night: true, peace: false,
    engaged: 0, boss: null, settlement: null, started: true, situation: 'exploration',
  });
  assert.deepEqual(detailEvents, ['ambience.insects'],
    region + ' original night insect binding must remain available');
  assert.equal(detailTones.length, 3,
    region + ' original three sparse chirps must remain as an audible fallback');
}
detailsAudio.dispose();
console.log(
  'PASS 19 place identities, night/refuges/peace, 11 boss/TRUE pairs, synchronized loops, transport-preserving intensity and movement-only footsteps',
);
