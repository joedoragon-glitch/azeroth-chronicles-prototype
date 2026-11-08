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
    assert.equal(cue.id, region.id === 'vale' && prefix === 'settlement-'
      ? 'place-vale' : prefix + region.id);
    assert(manifest.assets[cue.id]);
  }
// One recorded-score travel policy governs every outdoor region, not only Vale.
// Verify cue identities independently of fade times, including non-Greenwood
// settlements, night changes, nearby combat and protected nontravel scenes.
assert.deepEqual(data.regions.map((r) => r.id).sort(),
  ['crown', 'frontier', 'highlands', 'march', 'vale'],
  'exercise all five currently playable outdoor regions');
for (const region of data.regions) {
  const place = manifest.director.places[region.id];
  const outdoor = { ...scene, region: region.id, zone: region.id,
    interior: 'outdoors', night: false, peace: false, settlement: null,
    nearbyEngaged: 0, engaged: 0 };
  const day = a.productionCue(outdoor);
  assert.equal(day.id, place.base, region.id + ': exploration cue remains unchanged');
  assert.equal(day.fade, 3.2, region.id + ': exploration fades over travel duration');
  const settlement = a.productionCue({ ...outdoor, settlement: 'refuge' });
  assert.equal(settlement.id, region.id === 'vale' ? place.base : place.settlement,
    region.id + ': existing settlement placement remains authoritative');
  assert.equal(settlement.fade, 3.2, region.id + ': settlement crossing is gradual');
  const night = a.productionCue({ ...outdoor, night: true });
  assert.equal(night.id, place.night, region.id + ': night theme retains precedence');
  assert.equal(night.fade, 3.2, region.id + ': dusk/dawn crossing is gradual');
  const fighting = a.productionCue({ ...outdoor, nearbyEngaged: 2 });
  assert.equal(fighting.id, place.base, region.id + ': combat keeps the base score');
  assert.equal(fighting.fade, 2, region.id + ': nearby combat reacts promptly');
  const liberated = a.productionCue({ ...outdoor, peace: true });
  assert.equal(liberated.id, place.peace, region.id + ': liberation theme unchanged');
  assert.equal(liberated.fade, place.fade,
    region.id + ': peace keeps its authored nontravel transition');
  const indoor = a.productionCue({ ...outdoor, interior: 'dungeon' });
  assert.equal(indoor.fade, place.fade,
    region.id + ': indoor music is not assigned outdoor travel timing');
}
const crown = { ...scene, zone: 'crown', region: 'crown', interior: 'outdoors' };
a.combatUntil = a.ctx.currentTime + 2.5;
assert.equal(a.productionCue(crown).fade, 2,
  'combat release tail retains responsive handoff after nearby enemy disengages');
a.combatUntil = 0;
assert.equal(a.productionCue(crown).fade, 3.2,
  'normal outdoor handoff resumes after the release tail');
assert.equal(a.productionCue({
  ...crown, zone: 'citadel', interior: 'dungeon',
}).fade, manifest.director.places.citadel.fade,
  'Crown dungeon music retains its authored fade');
assert.equal(a.productionCue({
  ...crown, zone: 'supply-crown', interior: 'treasury',
}).fade, manifest.director.places['supply-crown'].fade,
  'treasury transitions remain outside regional outdoor policy');

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
assert.equal(Object.values(manifest.assets).filter((a) => a.kind === 'music').length, 84);
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
assert.equal(idleVale.fade, 3.2,
  'ordinary Greenwood field music must allow a gentle outdoor handoff');
const millhaven = a.productionCue({ ...scene, region: 'vale', zone: 'vale',
  settlement: 'millhaven', millhavenTown: true, engaged: 0 });
assert.equal(millhaven.id, 'millhaven-chamber',
  'peaceful Millhaven must play the owner-approved Candidate B recording');
assert.deepEqual(millhaven.stems, [{ id: 'millhaven-chamber', gain: 0.7 }]);
assert.equal(millhaven.fade, 3.2,
  'town return must be gradual without changing the approved recording');
assert.equal(a.productionCue({ ...scene, millhavenTown: true, night: true }).id,
  'millhaven-chamber', 'night retains Candidate B while ambience remains separate');
assert.equal(a.productionCue({ ...scene, millhavenTown: true, nearbyEngaged: 2 }).id, 'place-vale',
  'nearby combat takes recorded action precedence even inside Millhaven');
assert.equal(a.productionCue({ ...scene, millhavenTown: true, nearbyEngaged: 2 }).fade, 2,
  'Greenwood combat entry keeps a shorter, but non-abrupt, transition');
assert.equal(a.productionCue({ ...scene, millhavenTown: true, peace: true }).id, 'peace-vale',
  'global liberation retains authored recorded precedence');
assert.equal(a.productionCue({ ...scene, millhavenTown: true, started: false }).id, 'title',
  'saved Millhaven state never replaces title-screen music');
assert.equal(a.productionCue({ ...scene, millhavenTown: false }).id, 'place-vale',
  'Orchard Roads belongs to Greenwood roads and fields beyond the town');
const cryptApproach = a.productionCue({ ...scene, region: 'vale', zone: 'vale',
  settlement: null, estateApproach: true, nearbyEngaged: 0 });
assert.equal(cryptApproach.id, 'settlement-vale',
  'former settlement recording now marks the Dark Lord estate approach');
assert.equal(cryptApproach.stems[0].gain, 0.62);
assert.equal(cryptApproach.fade, 3.2,
  'the road-to-Crypt approach must crossfade without an immediate music cut');
assert.equal(a.productionCue({ ...scene, estateApproach: true, night: true }).fade, 3.2,
  'nighttime Greenwood crossings use the same outdoor handoff');
assert.equal(a.productionCue({ ...scene, estateApproach: true,
  nearbyEngaged: 2 }).id, 'place-vale',
'nearby combat replaces the Crypt approach cue with the normal regional action mix');
assert.equal(a.productionCue({ ...scene, estateApproach: true,
  nearbyEngaged: 2 }).fade, 2,
  'Crypt combat retains timely score response and warning priority');
assert.equal(a.productionCue({ ...scene, estateApproach: true,
  peace: true }).id, 'peace-vale',
'global peace takes precedence over the unfinished-estate approach');
assert.equal(a.productionCue({ ...scene, estateApproach: true,
  started: false }).id, 'title', 'title soundtrack remains exclusive');
assert.equal(a.productionCue({ ...scene, region: 'vale', zone: 'vale',
  settlement: 'millhaven', night: true, millhavenTown: true }).id,
  'millhaven-chamber', 'Millhaven uses Candidate B, not the former town recording');

// Geometry-driven observation: the actual Forest Crypt entrance is the anchor.
// The approach starts 950 units out and persists until 1150 units on exit.
const Campaign = require('../src/prototype/engine.js');
const liveVale = new Campaign();
const activeTownProps = liveVale.zone().props.filter((p) =>
  /^settlement-major-\d+$/.test(String(p.id || '')));
assert(activeTownProps.length >= 7,
  'expanded live Millhaven must supply its current residential footprint');
const easternHouse = activeTownProps.find((p) => p.id === 'settlement-major-6');
const southernHouse = activeTownProps.find((p) => p.id === 'settlement-major-4');
assert(easternHouse && southernHouse,
  'music district must be driven by expanded east and south civic houses');
const townAudio = audio();
townAudio.enableProduction();
townAudio.updateEnvironment = () => {};
townAudio.sceneDetails = () => {};
townAudio.setRecordedScore = async () => true;
const newGamePosition = { x: liveVale.hero.x, y: liveVale.hero.y };
function observeTown(x, y, started = true) {
  liveVale.hero.x = x;
  liveVale.hero.y = y;
  const observed = townAudio.describe(liveVale, { started });
  townAudio.updateProduction(observed);
  return { inside: observed.millhavenTown,
    cue: townAudio.productionCue(observed)?.id || 'synth:vale' };
}
assert.equal(observeTown(newGamePosition.x, newGamePosition.y).cue, 'millhaven-chamber',
  'new game at live Millhaven spawn plays the owner-approved chamber recording');
assert.equal(observeTown(easternHouse.x, easternHouse.y).cue, 'millhaven-chamber',
  'the extended eastern workshop is still inside the real town');
assert.equal(observeTown(southernHouse.x, southernHouse.y).cue, 'millhaven-chamber',
  'the extended southern residential streets are still Millhaven');
assert.equal(observeTown(easternHouse.x + 390, easternHouse.y).cue, 'place-vale',
  'farther from the final eastern homes is an Orchard Roads field');
assert.equal(observeTown(easternHouse.x + 110, easternHouse.y).cue, 'millhaven-chamber',
  'entering from the eastern fields recognizes the expanded civic edge');
assert.equal(observeTown(easternHouse.x + 215, easternHouse.y).cue, 'millhaven-chamber',
  '80-unit exit hysteresis retains the approved town recording');
assert.equal(observeTown(easternHouse.x + 390, easternHouse.y).cue, 'place-vale',
  'beyond the exit margin, Orchard Roads resumes');
assert.equal(observeTown(easternHouse.x + 215, easternHouse.y).cue, 'place-vale',
  're-entry cannot flicker inside the outer exit band');
assert.equal(observeTown(easternHouse.x + 110, easternHouse.y).cue, 'millhaven-chamber');
assert.equal(observeTown(easternHouse.x, easternHouse.y, false).cue, 'title',
  'a title snapshot never plays the old town soundtrack');
assert.equal(observeTown(easternHouse.x + 215, easternHouse.y).cue, 'place-vale',
  'title navigation resets the town hysteresis state');
assert.equal(observeTown(550, 1850).cue, 'place-vale',
  'Orchard Hamlet remains outside the Millhaven civic music footprint');
Object.assign(liveVale.hero, newGamePosition);
const forestCrypt = liveVale.zone().npcs.find((n) =>
  n.kind === 'dungeon' && n.family === 'crypt' && !n.sideDungeon);
assert(forestCrypt, 'real Greenwood must retain its Forest Crypt entrance');
const approachObserver = audio();
approachObserver.enableProduction();
approachObserver.updateEnvironment = () => {};
approachObserver.sceneDetails = () => {};
approachObserver.setRecordedScore = async () => true;
function observeEstate(distance, started = true) {
  liveVale.hero.x = forestCrypt.x - distance;
  liveVale.hero.y = forestCrypt.y;
  const actualScene = approachObserver.describe(liveVale, { started });
  approachObserver.updateProduction(actualScene);
  return { scene: actualScene, cue: approachObserver.productionCue(actualScene).id };
}
assert.equal(observeEstate(1350).cue, 'place-vale',
  'no cue switch on normal roads outside the estate influence');
assert.equal(observeEstate(940).cue, 'settlement-vale',
  'entering the 950-unit estate perimeter selects the new approach theme');
assert.equal(observeEstate(1080).cue, 'settlement-vale',
  'retreating partway does not rapidly restart regional and estate tracks');
assert.equal(observeEstate(1160).cue, 'place-vale',
  'leaving the 1150-unit outer perimeter restores the original theme');
assert.equal(observeEstate(1050).cue, 'place-vale',
  're-entry must reach the inner threshold instead of flickering');
assert.equal(observeEstate(930).cue, 'settlement-vale');
assert.equal(observeEstate(930, false).cue, 'title',
  'inactive title must not retain estate scoring');
assert.equal(observeEstate(1080).cue, 'place-vale',
  'title resets approach hysteresis for a resumed game');
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
assert(gains.at(-2)[1] < 0.74, 'Greenwood base music must duck as action enters');
assert.equal(gains.at(-2)[2], gains.at(-1)[2],
  'entering combat must crossmix both stems at the same rate');
a.ctx.currentTime = 5;
a.updateProduction(scene);
assert.equal(gains.at(-1)[1], 0);
assert.equal(gains.at(-2)[1], 0.74, 'exploration restores authored base gain');
// Regression: a loaded hero may stand beside a refuge while the game is
// showing its inactive title. That snapshot must NOT retain a settlement
// hold and replace the first true outdoor track with settlement music.
a.updateProduction({ ...scene, settlement: 'vale-refuge' });
assert.equal(a.productionKey && JSON.parse(a.productionKey)[0], 'place-vale');
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
assert.equal(gains.at(-2)[1], 0.74,
  'restored Millhaven music retains its normal level without nearby combat');
a.updateProduction({ ...scene, settlement: 'millhaven', engaged: 2, nearbyEngaged: 2 });
assert(gains.at(-1)[1] > 0, 'nearby combat should still raise the encounter stem');
assert(gains.at(-2)[1] < 0.74, 'encounter must reduce the original regional music');
a.updateProduction({ ...scene, settlement: 'millhaven', engaged: 8, nearbyEngaged: 8 });
assert(gains.at(-2)[1] < gains.at(-1)[1],
  'at high combat intensity, encounter music must dominate the base theme');
a.ctx.currentTime = 30;
a.updateProduction({ ...scene, settlement: 'millhaven', engaged: 0, nearbyEngaged: 0 });
assert.equal(gains.at(-2)[1], 0.74,
  'original Millhaven theme returns to full authored level after combat');
assert.equal(gains.at(-1)[1], 0,
  'encounter melody fades away after combat');
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
