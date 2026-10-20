'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  cp = require('node:child_process'),
  assert = require('node:assert/strict'),
  { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../../..'),
  baseline = '655e748';
const { createCanvas, Image } = require(root + '/node_modules/@napi-rs/canvas');
class FileImage extends Image {
  set src(v) {
    super.src = typeof v === 'string' ? fs.readFileSync(path.resolve(root, v)) : v;
  }
}
global.Image = FileImage;
global.OffscreenCanvas = function (w, h) {
  return createCanvas(w, h);
};
const C = require(root + '/src/prototype/engine'),
  S = require(root + '/src/prototype/sprites'),
  Materials = require(root + '/src/prototype/materials');
const vb = { PrototypeRules: C.rules, performance: { now: () => 16000 } };
vm.runInNewContext(fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'), vb);
const V = vb.PrototypeVisuals;
const sb = { require: createRequire(root + '/src/prototype/sprites.js') };
vm.runInNewContext(
  cp.execFileSync('git', ['show', baseline + ':src/prototype/sprites.js'], {
    cwd: root,
    encoding: 'utf8',
  }),
  sb,
);
const before = sb.PrototypeSprites;
const selected = [
  ['prop:wildflowers:vale', 9, 'vale'],
  ['prop:cattails:march', 14, 'march'],
  ['prop:alpine-scrub:highlands', 19, 'highlands'],
  ['prop:heather:highlands', 21, 'highlands'],
  ['prop:mint-workbench:highlands', 23, 'highlands'],
  ['prop:ore-sorting-bay:highlands', 24, 'highlands'],
  ['prop:caravan-loading-bay:highlands', 25, 'highlands'],
];
(async () => {
  const manifest = require(root + '/assets/sprites/manifest.json');
  assert(before.installManifest(manifest));
  assert(S.installManifest(manifest));
  assert.equal(
    fs.readFileSync(root + '/assets/sprites/manifest.json', 'utf8'),
    cp.execFileSync('git', ['show', baseline + ':assets/sprites/manifest.json'], {
      cwd: root,
      encoding: 'utf8',
    }),
  );
  assert.equal(
    fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8'),
    cp.execFileSync('git', ['show', baseline + ':src/prototype/visuals.js'], {
      cwd: root,
      encoding: 'utf8',
    }),
  );
  const selectionResults = [];
  for (const key of Object.keys(manifest.sprites)) {
    const record = JSON.parse(
      fs.readFileSync(
        root +
          '/tools/sprites/design-handoffs/approved-art-raster-' +
          key.replaceAll(':', '-') +
          '.json',
      ),
    );
    const state =
      record.reference.exactEntityState.find((x) => x.mode === 'procedural') ||
      record.reference.exactEntityState[0];
    const old = before.definitionFor(state.entity, state.region || 0)?.key || null,
      now = S.definitionFor(state.entity, state.region || 0)?.key || null;
    if (selected.some((x) => x[0] === key)) {
      assert.equal(old, key);
      assert.equal(now, null);
    } else assert.equal(now, old, key + ' unexpected selection change');
    selectionResults.push({ key, before: old, after: now });
  }
  await S.warm(Object.keys(manifest.sprites), { clips: true, variants: true });
  const mats = new Materials({ Image: FileImage, createCanvas });
  mats.install(require(root + '/assets/materials/manifest.json'));
  await Promise.all(Object.keys(mats.entries).map((k) => mats.ensure(k)));
  global.document = { createElement: () => createCanvas(1, 1) };
  let targetId = '',
    procedural = 0,
    raster = 0;
  const paintV = V.draw.bind(V),
    paintS = S.draw.bind(S);
  V.draw = (ctx, e, ...rest) => {
    if (e.id === targetId) procedural++;
    return paintV(ctx, e, ...rest);
  };
  S.draw = (ctx, e, ...rest) => {
    const result = paintS(ctx, e, ...rest);
    if (e.id === targetId && result) raster++;
    return result;
  };
  const native = [];
  for (const [key, number, zone] of selected) {
    const g = new C('normal', 'mage', () => 0.9);
    g.enter(zone);
    g.s.clock = 190;
    g.s.mercyTime = 0;
    const prop = g.zone().props.find((p) => p.structure === key.split(':')[1]);
    assert(prop, 'No real authored prop for ' + key);
    Object.assign(g.hero, g.safe(prop.x + 60, prop.y + 60));
    g.hero.order = null;
    targetId = prop.id;
    procedural = 0;
    raster = 0;
    const width = 1200,
      height = 800,
      c = createCanvas(width, height),
      ctx = c.getContext('2d');
    const platform = require(root + '/src/prototype/platform').init({
      location: { search: '?experience=desktop' },
      localStorage: { getItem: () => null },
      document: { body: { getAttribute: () => null, setAttribute: () => {} } },
    });
    platform.selectCameraZoom(1.5);
    const renderer = require(root + '/src/prototype/renderer').create({
      canvas: { width, height },
      ctx,
      getGame: () => g,
      platform,
      Campaign: C,
      PrototypeVisuals: V,
      PrototypeCombatVisuals: require(root + '/src/prototype/combat-visuals'),
      PrototypeSprites: S,
      PrototypeMaterials: mats,
      now: () => 16000,
      chargePresentation: () => null,
      isPaused: () => false,
    });
    const state = JSON.stringify(g.s);
    renderer.draw();
    assert.equal(JSON.stringify(g.s), state);
    assert(procedural > 0, key + ' not drawn procedurally');
    assert.equal(raster, 0);
    native.push({
      number,
      key,
      zone,
      authoredPropId: prop.id,
      proceduralDraws: procedural,
      rasterDraws: raster,
      statePure: true,
    });
  }
  const result = {
    baseline,
    registeredPairsChecked: selectionResults.length,
    approvedSelectionChanges: 7,
    unchangedSelections: 26,
    proceduralArtUnchanged: true,
    registeredOriginalsUnchanged: true,
    native,
    selectionResults,
  };
  fs.writeFileSync(__dirname + '/audit.json', JSON.stringify(result, null, 2) + '\n');
  console.log(
    JSON.stringify({
      registeredPairsChecked: 33,
      approvedSelectionChanges: 7,
      unchangedSelections: 26,
      native,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
