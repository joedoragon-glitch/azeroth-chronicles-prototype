'use strict';
const fs = require('fs'),
  path = require('path'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  { createCanvas } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../..'),
  out = path.join(__dirname, 'approved-art-pass'),
  V = require(root + '/src/prototype/visuals.js'),
  old = (() => {
    const m = { exports: {} };
    require('vm').runInNewContext(
      require('child_process').execFileSync(
        'git',
        ['show', '0a1030b0771670752ae3b6a454daf423787881b7:src/prototype/visuals.js'],
        { cwd: root, encoding: 'utf8' },
      ),
      { PrototypeRules: require(root + '/src/prototype/rules.js'), module: m },
    );
    return m.exports;
  })(),
  data = JSON.parse(fs.readFileSync(out + '/asset-assessment.json'));
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const counters = {
  entries: data.cases.length,
  fixtures: 0,
  changedTargets: 0,
  protectedPrimaries: 0,
  ownerRequestedRetentionOverrides: 0,
  readOnly: true,
  balancedCanvas: true,
  featureScalePreserved: true,
  normalLabelHeightsPreserved: true,
  trueBossLabelHeadroom: 0,
};
let failures = [];
for (const r of data.cases) {
  assert.equal(r.afterImages.length, r.images.length, 'Missing state ' + r.id);
  for (const im of r.images) {
    if (!im.entity) continue;
    const e = structuredClone(im.entity),
      before = JSON.stringify(e),
      canvas = createCanvas(500, 400),
      x = canvas.getContext('2d');
    let depth = 0;
    const save = x.save.bind(x),
      restore = x.restore.bind(x);
    x.save = () => {
      depth++;
      save();
    };
    x.restore = () => {
      depth--;
      restore();
    };
    V.draw(x, e, { x: 250, y: 250 }, im.region || 0, /Rescued|service/.test(im.label));
    assert.equal(JSON.stringify(e), before, 'Mutated ' + r.id);
    assert.equal(depth, 0, 'Canvas stack ' + r.id);
    if (e.type === 'boss' && e.form === 'true') {
      const expected = (old.height(e) / 102) * 140;
      assert(Math.abs(V.height(e) - expected) < 1e-8, 'TRUE crown headroom ' + r.id);
      counters.trueBossLabelHeadroom++;
    } else assert.equal(V.height(e), old.height(e), 'Normal label/cull geometry changed ' + r.id);
    assert.equal(V.featureScale(e), old.featureScale(e), 'World scale changed ' + r.id);
    counters.fixtures++;
    canvas.width = 1;
    global.gc?.();
  }
  const changed = r.images.some(
    (im, i) =>
      hash(fs.readFileSync(out + '/' + im.path)) !==
      hash(fs.readFileSync(out + '/' + r.afterImages[i].path)),
  );
  if (['rebuild', 'refine'].includes(r.assessment.verdict)) {
    assert(changed, 'Approved target was missed: ' + r.id);
    counters.changedTargets++;
  }
  if (r.assessment.verdict === 'retain' && r.retentionOverride) {
    assert.equal(r.id, 'specialist:darklord', 'Unrecorded retention override');
    assert.equal(r.retentionOverride.requestedBy, 'Joel');
    assert.equal(r.retentionOverride.date, '2026-10-19');
    assert(changed, 'Requested smith overhaul missing');
    counters.ownerRequestedRetentionOverrides++;
  } else if (r.assessment.verdict === 'retain') {
    assert.equal(
      hash(fs.readFileSync(out + '/' + r.images[0].path)),
      hash(fs.readFileSync(out + '/' + r.afterImages[0].path)),
      'Protected appearance changed ' + r.id,
    );
    counters.protectedPrimaries++;
  }
}
assert.equal(counters.changedTargets, 465);
assert.equal(counters.protectedPrimaries, 46);
assert.equal(counters.ownerRequestedRetentionOverrides, 1);
const { execFileSync } = require('child_process');
for (const file of ['assets/sprites/manifest.json', 'assets/materials/manifest.json']) {
  const incoming = JSON.parse(execFileSync('git', ['show', '1e154954:' + file], { cwd: root })),
    current = JSON.parse(fs.readFileSync(root + '/' + file));
  const group = file.includes('sprites') ? 'sprites' : 'materials';
  for (const key of Object.keys(incoming[group])) {
    const a = { ...incoming[group][key] },
      b = { ...current[group][key] };
    delete a.revision;
    delete b.revision;
    assert.deepEqual(b, a, 'Protected content/geometry/presentation changed: ' + key);
    assert.equal(hash(fs.readFileSync(path.join(root, a.src))), a.hash);
  }
}
const native = JSON.parse(fs.readFileSync(out + '/native-scenes/capture-receipt.json'));
assert.equal(native.captures.length, 36);
assert.equal(native.afterSourceSHA256, hash(fs.readFileSync(root + '/src/prototype/visuals.js')));
counters.nativeCaptures = 36;
counters.sourceSHA256 = native.afterSourceSHA256;
fs.writeFileSync(out + '/implementation-checks.json', JSON.stringify(counters, null, 2) + '\n');
console.log('PASS approved art scope', JSON.stringify(counters));
