'use strict';
// Compare every registered native reference with published dev.109 before
// refreshing two pre-existing stale comparison receipts. Raster pixels stay exact.
const fs = require('fs'),
  path = require('path'),
  vm = require('vm'),
  assert = require('node:assert/strict'),
  { createCanvas } = require('@napi-rs/canvas'),
  cp = require('child_process');
const root = path.resolve(__dirname, '../../..'),
  P = require(root + '/scripts/sprite-pipeline.cjs'),
  T = require(root + '/scripts/asset-registry-transaction.cjs');
const old = cp.execFileSync('git', ['show', '977b9c9:src/prototype/visuals.js'], {
    cwd: root,
    encoding: 'utf8',
  }),
  current = fs.readFileSync(root + '/src/prototype/visuals.js', 'utf8');
function visual(source) {
  const box = {
    PrototypeRules: require(root + '/src/prototype/rules'),
    performance: { now: () => 16000 },
  };
  vm.runInNewContext(source.replace('fillOval(0, 10, 45, 12, ground, 0.28);', ''), box);
  return box.PrototypeVisuals;
}
const priorV = visual(old),
  newV = visual(current);
function draw(v, c) {
  const canvas = createCanvas(c.canvas.width, c.canvas.height),
    native = canvas.getContext('2d'),
    ctx = new Proxy(native, {
      get(t, p) {
        if (p === 'fill')
          return (...args) => {
            if (t.fillStyle !== '#07110d') t.fill(...args);
          };
        if (p === 'stroke')
          return (...args) => {
            if (!['#d2aa87', '#c9d6ad', '#a49573', '#d4b36f', '#e0b96f'].includes(t.strokeStyle))
              t.stroke(...args);
          };
        const value = t[p];
        return typeof value === 'function' ? value.bind(t) : value;
      },
      set(t, p, v) {
        t[p] = v;
        return true;
      },
    });
  v.draw(
    ctx,
    c.entity,
    { x: canvas.width * c.canvas.anchorX, y: canvas.height * c.canvas.anchorY },
    c.region,
    false,
  );
  return P.hash(canvas.toBuffer('image/png'));
}
(async () => {
  T.assertClean(root, 'sprites');
  const files = [root + '/tools/sprites/approved.json', root + '/assets/sprites/manifest.json'],
    state = T.snapshot(files),
    [approved, manifest] = state.data,
    receipts = [];
  let compared = 0;
  for (const [key, prior] of Object.entries(approved.assets)) {
    const c = P.contractFor(key),
      oldHash = draw(priorV, c),
      newHash = draw(newV, c);
    assert.equal(newHash, oldHash, 'native reference unchanged since dev109: ' + key);
    assert.deepEqual(prior.runtime, c.runtime, 'geometry unchanged');
    compared++;
    if (prior.canonHash === c.canonHash && prior.catalogHash === c.catalog.sourceHash) continue;
    assert.equal(prior.catalogHash, c.catalog.sourceHash);
    assert.equal(
      P.hash(fs.readFileSync(root + '/assets/sprites/' + prior.output.file)),
      prior.output.hash,
    );
    assert.equal(
      P.hash(fs.readFileSync(root + '/tools/sprites/sources/' + prior.source.file)),
      prior.source.hash,
    );
    const updated = structuredClone(prior),
      revision = prior.revision || prior.output.hash;
    updated.canonHash = c.canonHash;
    updated.canonSnapshotHash = c.canonSnapshotHash;
    updated.review = {
      ...prior.review,
      canonRetention: {
        date: '2026-10-20',
        authority:
          'Retain existing published dev.109 image appearance under owner-authorized Crown update; no new raster acceptance.',
        reference: 'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/344',
        decisionRecord: 'docs/CROWN_COMPANIONS_20261020.md',
        comparisonIndex: 'tools/visual-review/crown-companions-dev110/retained-art.json',
        priorRevision: revision,
        priorCanonHash: prior.canonHash,
        currentCanonHash: c.canonHash,
        publishedDev109ReferenceHash: oldHash,
        currentReferenceHash: newHash,
        outputHash: prior.output.hash,
        sourceHash: prior.source.hash,
        geometryAndPresentationUnchanged: true,
        newGeneratedAppearanceAccepted: false,
      },
    };
    updated.revision = P.revisionFor(updated);
    approved.history ||= {};
    approved.history[key] ||= {};
    approved.history[key][revision] = prior;
    approved.assets[key] = updated;
    manifest.sprites[key] = P.entryFor(updated);
    const oldEntry = { ...JSON.parse(state.bytes[1]).sprites[key] },
      newEntry = { ...manifest.sprites[key] };
    delete oldEntry.revision;
    delete newEntry.revision;
    assert.deepEqual(newEntry, oldEntry);
    receipts.push({
      key,
      priorRevision: revision,
      revision: updated.revision,
      oldHash,
      newHash,
      outputHash: prior.output.hash,
    });
  }
  try {
    for (let i = 0; i < files.length; i++) {
      assert.equal(P.hash(fs.readFileSync(files[i])), state.hashes[i]);
      fs.writeFileSync(files[i], JSON.stringify(state.data[i], null, 2) + '\n');
    }
    await P.checkProduction();
  } catch (e) {
    files.forEach((f, i) => fs.writeFileSync(f, state.bytes[i]));
    throw e;
  }
  fs.writeFileSync(
    path.join(__dirname, 'retained-art.json'),
    JSON.stringify(
      {
        compared,
        scope:
          'Registered references pixel-identical to dev109; every raster/source/placement unchanged. Two previously stale canonical receipts refreshed.',
        receipts,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'PASS retained art',
    compared,
    'references;',
    receipts.length,
    'pre-existing stale receipts repaired',
  );
})();
