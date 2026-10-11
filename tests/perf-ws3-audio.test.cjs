'use strict';
const assert = require('node:assert/strict');
const { createAudio, campaign } = require('./helpers/perf-ws3-audio.cjs');
const manifest = require('../assets/audio/manifest.json');
const activities = [
  {},
  { menu: true },
  { paused: true },
  { backgrounded: true },
  { started: false },
];
let observations = 0;
for (const size of [0, 1, 18, 64, 1024])
  for (const peace of [false, true])
    for (const gameOver of [false, true])
      for (const location of ['outdoors', 'treasury', 'side-dungeon', 'dungeon'])
        for (const activity of activities) {
          const g = campaign(size, {
            peace,
            s: { challenge: { gameOver } },
            supplyRoom: () => location === 'treasury',
            sideDungeon: () => location === 'side-dungeon',
            isDungeon: () => location === 'dungeon',
          });
          const z = g.zone();
          if (size > 20) delete z.enemies[19];
          if (size % 2 === 0) z.npcs[0].x = 100;
          const snapshot = () =>
            JSON.stringify({
              hero: g.hero,
              state: g.s,
              zone: g.zone(),
              peace: g.peace,
              zoneId: g.zoneId,
            });
          const before = snapshot();
          assert.deepEqual(
            createAudio().describe(g, activity),
            createAudio(true).describe(g, activity),
          );
          assert.equal(snapshot(), before, 'Audio observation must not write campaign state');
          observations++;
        }
// First live, hostile, engaged boss wins, including across sparse array slots.
const ordering = campaign(64),
  enemies = ordering.zone().enemies;
enemies[1] = { hp: 10, aggro: true, neutral: true, type: 'boss', family: 'ignored-neutral' };
enemies[2] = { hp: 0, aggro: true, type: 'boss', family: 'ignored-dead' };
enemies[3] = { hp: 10, aggro: false, type: 'boss', family: 'ignored-unengaged' };
enemies[4] = { hp: 10, aggro: true, type: 'boss', family: 'first', form: 'true', name: 'First' };
assert.deepEqual(createAudio().describe(ordering), createAudio(true).describe(ordering));
assert.equal(createAudio().describe(ordering).boss.family, 'first');
const scene = createAudio().describe(campaign(64));
const conditions = [
  {},
  { region: 'vale' },
  { bossFamily: 'thorn', bossForm: 'normal' },
  { bossFamily: 'crypt' },
  { zone: 'elsewhere' },
  { peace: true },
];
for (const rules of [
  undefined,
  [],
  ...conditions.map((when, i) => [{ id: 'rule-' + i, when }]),
  conditions.map((when, i) => ({ id: 'rule-' + i, when })),
]) {
  const current = createAudio(),
    original = createAudio(true);
  current.recordedCueRules = original.recordedCueRules = rules;
  assert.deepEqual(current.matchingRecordedRule(scene), original.matchingRecordedRule(scene));
  assert.deepEqual(
    current.matchingRecordedRule(scene, rules),
    original.matchingRecordedRule(scene, rules),
  );
}
async function eventTrace(baseline) {
  const a = createAudio(baseline),
    trace = [];
  a.context = scene;
  const bindings = {
    'interface.empty': [],
    'effect.test': [
      {
        asset: 'specific',
        when: { bossFamily: 'crypt', material: 'steel' },
        gain: 0.7,
        priority: 3,
        minGap: 0.035,
      },
      { asset: 'specific', when: { bossFamily: 'thorn', material: 'steel' }, gain: 0.6, pan: -0.2 },
      { asset: 'fallback' },
    ],
    'interface.test': [{ asset: 'ui', bus: 'interface', when: { bossForm: 'true' } }],
    'ambience.test': [{ asset: 'cold' }],
  };
  a.soundCatalog = () => ({ director: { events: bindings } });
  const store = {
    pending: new Set(),
    touch(id) {
      trace.push(['touch', id]);
      return id === 'cold' ? null : { id };
    },
    async load(id) {
      trace.push(['load', id]);
      return { id };
    },
  };
  a.recordingAssets = store;
  a.assetsForRecordings = async () => store;
  a.createRecording = (id, item, assets, options) => {
    trace.push(['recording', id, options]);
    return { id };
  };
  for (const [key, details] of [
    ['missing', {}],
    ['interface.empty', {}],
    ['effect.test', { material: 'steel' }],
    ['effect.test', { material: 'steel' }],
    ['effect.test', { material: 'steel', bossFamily: 'crypt' }],
    ['effect.test', { material: 'water', type: 'enemyVfx' }],
    ['interface.test', { bossForm: 'true' }],
    ['ambience.test', {}],
  ])
    trace.push(['result', key, a.playSoundEvent(key, details)]);
  await new Promise((resolve) => setImmediate(resolve));
  a.ctx.currentTime += 1;
  // Replacement must take effect immediately; there is no stale lookup cache.
  bindings['effect.test'] = [{ asset: 'replacement', when: { region: 'vale' }, gain: 0.23 }];
  trace.push(['replacement', a.playSoundEvent('effect.test')]);
  for (const state of ['muted', 'paused', 'suspended']) {
    a.settings.muted = state === 'muted';
    a.paused = state === 'paused';
    a.ctx.state = state === 'suspended' ? 'suspended' : 'running';
    trace.push([state, a.playSoundEvent('effect.test')]);
  }
  return { trace, lastSfx: a.lastSfx, loads: [...a.soundLoads], failures: [...a.soundFailures] };
}
function productionTrace(baseline) {
  const a = createAudio(baseline),
    trace = [];
  a.production = true;
  a.recordedCueRules = [];
  a.recordingManifest = structuredClone(manifest);
  a.setRecordedScore = async (spec) => {
    trace.push(['score', spec]);
    a.recordedScore = { id: spec.id, voices: [{}, {}] };
    return true;
  };
  a.setStemGain = (...args) => trace.push(['stem', ...args]);
  a.updateEnvironment = (s) => trace.push(['environment', a.environmentCue(s)]);
  a.sceneDetails = (s) => trace.push(['details', s]);
  for (const region of ['vale', 'march', 'highlands', 'frontier', 'crown'])
    for (const peace of [false, true])
      for (const night of [false, true])
        for (const situation of ['exploration', 'menu', 'title', 'game-over']) {
          const observed = { ...scene, region, zone: region, peace, night, situation, boss: null };
          a.context = observed;
          a.ctx.currentTime += 0.2;
          trace.push(['cue', a.productionCue(observed)]);
          a.updateProduction(observed);
        }
  a.setRecordedCueRules([
    {
      id: 'custom',
      when: { bossFamily: 'thorn' },
      score: { stems: [{ id: 'boss-thorn', gain: 0.31 }] },
    },
  ]);
  trace.push(['custom', a.productionCue(scene)]);
  return trace;
}
(async () => {
  assert.deepEqual(await eventTrace(false), await eventTrace(true));
  assert.deepEqual(productionTrace(false), productionTrace(true));
  console.log(
    'PASS WS3: ' +
      observations +
      ' baseline-equivalent audio observations, sparse/neutral/dead/ordered boss selection, rule precedence, recorded event dispatch/throttles/warming/catalog replacement/mute/pause, production cue and gain traces; no campaign writes',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
