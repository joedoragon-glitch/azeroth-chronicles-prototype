'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  cp = require('node:child_process');
const { audio } = require('./helpers/audio-context.cjs'),
  fixtures = require('../tools/audio/fixtures.js');
const { validateCatalog, runtimeCatalog } = require('../src/prototype/audio-contract.js');
const { register, registerBatch, bind, main } = require('../scripts/audio-library.cjs');
const production = require('../assets/audio/manifest.json');
const copy = (v) => structuredClone(v),
  flush = () => new Promise((resolve) => setImmediate(resolve));
(async () => {
  validateCatalog(production);
  assert(!runtimeCatalog(production).director.eventGuides);
  assert(
    Object.values(production.assets).every(
      (a) => a.generationGuide && a.managedBy === 'score-book',
    ),
  );
  assert(
    Object.keys(production.director.events).every((key) => production.director.eventGuides[key]),
  );
  for (const edit of [
    (m) => {
      m.director.places.vale.base = 'missing';
    },
    (m) => {
      m.assets['action-vale'].loop.end -= 0.01;
    },
    (m) => {
      m.assets['action-vale'].bpm++;
    },
    (m) => {
      m.assets['place-vale'].loop.start = Infinity;
    },
    (m) => {
      m.director.events['step.grass'] = [{ asset: 'place-vale' }];
    },
    (m) => {
      m.director.events['step.grass'] = [{ asset: 'missing' }];
    },
    (m) => {
      m.director.rules = [
        { id: 'x', when: { typo: true }, score: { stems: [{ id: 'title', gain: 0.5 }] } },
      ];
    },
  ]) {
    const invalid = copy(production);
    edit(invalid);
    assert.throws(() => validateCatalog(invalid));
  }
  console.log(
    'PASS catalog references, shared loop/tempo contracts and complete creative provenance/guides',
  );
  const f = await fixtures.create(),
    manifest = copy(f.manifest);
  for (const entry of Object.values(manifest.assets)) if (entry.kind === 'music') entry.bpm = 120;
  manifest.director = {
    fallbackPlace: 'vale',
    places: { vale: { base: 'diagnostic-a', action: 'diagnostic-b', peace: 'diagnostic-a' } },
    bosses: { thorn: { base: 'diagnostic-a', true: 'diagnostic-b' } },
    specials: {
      title: { asset: 'diagnostic-a', gain: 0.7 },
      defeat: { asset: 'diagnostic-b', gain: 0.5 },
      finale: { asset: 'diagnostic-a', gain: 0.7 },
    },
    rules: [],
    events: {
      'effect.heroSteelImpact': [
        { asset: 'diagnostic-click', when: { actor: 'hero', class: 'paladin' }, gain: 0.2 },
      ],
      'effect.warning': [{ asset: 'diagnostic-click', gain: 0.15 }],
      'effect.peace': [{ asset: 'diagnostic-click' }],
      'interface.confirm': [{ asset: 'diagnostic-click' }],
      'step.grass': [{ asset: 'diagnostic-click' }],
      'ambience.birds': [{ asset: 'diagnostic-click' }],
    },
  };
  const a = audio(),
    options = { baseUrl: 'https://example.test/game/', fetch: f.fetch },
    scene = {
      region: 'vale',
      zone: 'vale',
      interior: 'outdoors',
      started: true,
      engaged: 0,
      situation: 'world',
    };
  a.configureRecordings(manifest, options);
  a.enableProduction();
  a.sceneDetails = () => {};
  const original = a.setRecordedScore.bind(a),
    requests = [];
  a.setRecordedScore = (spec) => {
    const pending = original(spec);
    requests.push(pending);
    return pending;
  };
  a.updateProduction(scene);
  assert(await requests.at(-1));
  await flush();
  const group = a.recordedScore;
  a.setPaused(true);
  a.setPaused(false);
  await flush();
  a.updateProduction(scene);
  assert.equal(requests.length, 1);
  assert.equal(a.recordedScore, group);
  const invalid = copy(manifest);
  invalid.director.places.vale.base = 'missing';
  assert.throws(() => a.configureRecordings(invalid, options));
  assert.equal(a.recordedScore, group);
  a.configureRecordings(manifest, options);
  a.updateProduction(scene);
  assert.equal(requests.length, 2);
  assert(await requests.at(-1));
  await flush();
  a.setRecordedCueRules([
    {
      id: 'custom',
      when: { region: 'vale' },
      score: { stems: [{ id: 'diagnostic-a', gain: 0.25 }], bpm: 120 },
    },
  ]);
  const before = requests.length;
  a.updateRecordedCue(scene);
  a.updateProduction(scene);
  assert.equal(requests.length, before + 1);
  assert(await requests.at(-1));
  await flush();
  assert.equal(a.recordedScore.id, 'custom');
  assert.equal(a.recordedScore.voices[0].targetGain, 0.25);
  a.updateProduction({ ...scene, engaged: 3 });
  assert.equal(a.recordedScore.voices[0].targetGain, 0.25);
  a.setRecordedCueRules([]);
  a.updateProduction(scene);
  assert(await requests.at(-1));
  await flush();
  assert.equal(a.recordedScore.id, 'diagnostic-a');
  console.log(
    'PASS catalog replacement restarts same-scene music, invalid replacement is atomic, pause keeps transport and override selection has one owner',
  );
  a.context = scene;
  let fallback = 0,
    ducks = 0;
  a.steelImpact = () => fallback++;
  a.duck = () => ducks++;
  const count = a.voices.size;
  a.effect({ type: 'melee', actor: 'hero', class: 'paladin' });
  assert.equal(fallback, 1);
  assert.equal(a.voices.size, count);
  while (a.soundLoads.size) await flush();
  assert.equal(a.voices.size, count); // Loading never replays a stale event.
  a.ctx.currentTime += 0.1;
  a.effect({ type: 'melee', actor: 'hero', class: 'paladin' });
  assert.equal(fallback, 1);
  let voice = [...a.voices].find((v) => v.id === 'diagnostic-click');
  assert.equal(voice.bus, 'effects');
  assert.equal(voice.targetGain, 0.2);
  a.effect('warning');
  assert.equal(ducks, 1);
  assert([...a.voices].some((v) => v.id === 'diagnostic-click' && v.priority === 3));
  a.effect('warning');
  assert.equal(ducks, 1);
  a.effect('peace');
  assert.equal(a.finaleUntil, a.ctx.currentTime + 12);
  a.interfaceSound('confirm');
  assert([...a.voices].some((v) => v.id === 'diagnostic-click' && v.bus === 'interface'));
  a.stepDistance = 0;
  a.footstep({}, 42);
  a.ctx.currentTime += 0.1;
  assert(a.playSoundEvent('ambience.birds'));
  assert([...a.voices].some((v) => v.id === 'diagnostic-click' && v.bus === 'ambience'));
  a.setPaused(true);
  assert.equal(a.playSoundEvent('step.grass'), false);
  a.dispose();
  assert.equal(a.voices.size, 0);
  const failing = audio(),
    bad = copy(manifest);
  bad.assets['diagnostic-click'].sha256 = '0'.repeat(64);
  let fetches = 0;
  failing.configureRecordings(bad, {
    ...options,
    fetch: async (...args) => {
      fetches++;
      return f.fetch(...args);
    },
  });
  assert.equal(failing.playSoundEvent('step.grass'), false);
  while (failing.soundLoads.size) await flush();
  assert.equal(failing.playSoundEvent('step.grass'), false);
  assert.equal(fetches, 1);
  failing.dispose();
  console.log(
    'PASS timely recorded effect/UI/step/ambience replacement, cold fallback, no delayed replay, retained warning/finale behavior and bounded failure retries',
  );
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-catalog-'));
  try {
    fs.mkdirSync(path.join(root, 'assets/audio'), { recursive: true });
    for (const [src, bytes] of f.files)
      fs.writeFileSync(path.join(root, src.slice(2)), Buffer.from(bytes));
    const file = path.join(root, 'assets/audio/manifest.json');
    manifest.assets['diagnostic-a'].managedBy = 'score-book';
    fs.writeFileSync(file, JSON.stringify(manifest));
    const registered = register(root, 'diagnostic-a', 'assets/audio/diagnostic-a.wav', {}, () => 2);
    assert(!registered.assets['diagnostic-a'].managedBy);
    assert.equal(registered.assets['diagnostic-a'].sha256, manifest.assets['diagnostic-a'].sha256);
    assert.throws(() =>
      register(root, 'diagnostic-a', 'assets/audio/diagnostic-a.wav', { bpm: 110 }, () => 2),
    );
    const batch = registerBatch(
      root,
      [
        { id: 'diagnostic-a', file: 'assets/audio/diagnostic-a.wav', bpm: 110 },
        { id: 'diagnostic-b', file: 'assets/audio/diagnostic-b.wav', bpm: 110 },
      ],
      () => 2,
    );
    assert.equal(batch.assets['diagnostic-a'].bpm, 110);
    assert.equal(batch.assets['diagnostic-b'].bpm, 110);
    const custom = register(
      root,
      'new-click',
      'assets/audio/diagnostic-click.wav',
      { kind: 'effect', author: 'Joel', license: 'CC0-1.0' },
      () => 0.18,
    );
    assert(custom.assets['new-click']);
    const prior = fs.readFileSync(file, 'utf8');
    assert.throws(() => register(root, 'bad', '../outside.wav', {}, () => 2));
    assert.throws(() => bind(root, 'step.grass', 'missing'));
    assert.equal(fs.readFileSync(file, 'utf8'), prior);
    main(
      ['bind', 'step.grass', 'diagnostic-click', '--gain', '.2', '--when', '{"region":"vale"}'],
      root,
    );
    assert.equal(JSON.parse(fs.readFileSync(file)).director.events['step.grass'][0].gain, 0.2);
    assert.equal(JSON.parse(fs.readFileSync(file)).director.events['step.grass'].length, 2);
    console.log(
      'PASS registration computes hashes, protects manual overrides, validates before writing and retains broader event bindings',
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  cp.execFileSync(
    'python3',
    [
      '-c',
      `
import sys
sys.path.insert(0, 'tools/audio')
from score_registry import can_render, merge_registry
m={'schemaVersion':1,'director':{'events':{'step.grass':[]}},'creativeSource':'keep','assets':{'owned':{'managedBy':'score-book','generationGuide':'edited guide'},'removed':{'managedBy':'score-book'},'custom':{'src':'custom.mp3'}}}
assert not can_render(m,'custom')
r=merge_registry(m,{'owned':{'src':'new.mp3'}},['owned'])
assert r['assets']['custom']==m['assets']['custom']
assert r['assets']['owned']['generationGuide']=='edited guide'
assert 'removed' not in r['assets'] and 'removed' in m['assets']
assert r['director']==m['director'] and r['creativeSource']=='keep'
assert 'removed' in merge_registry(m,{},[],partial=True)['assets']
try: merge_registry(m,{'custom':{}},['custom'])
except ValueError: pass
else: raise AssertionError('custom overwrite')
`,
    ],
    { cwd: path.resolve(__dirname, '..') },
  );
  console.log(
    'PASS full/partial score renders retain custom sounds, edited guides and routing; remove only obsolete managed entries',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
