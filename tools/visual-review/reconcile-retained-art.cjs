'use strict';
// Refresh comparison receipts after an approved procedural-only pass. This never
// processes image pixels, changes geometry, or accepts a newly generated image.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..'),
  P = require(root + '/scripts/sprite-pipeline.cjs'),
  T = require(root + '/scripts/asset-registry-transaction.cjs');
(async () => {
  const files = [root + '/tools/sprites/approved.json', root + '/assets/sprites/manifest.json'];
  T.assertClean(root, 'sprites');
  const state = T.snapshot(files),
    [approved, manifest] = state.data;
  const receipts = [];
  for (const [key, prior] of Object.entries(approved.assets)) {
    const contract = P.contractFor(key);
    assert.deepEqual(prior.runtime, contract.runtime, 'Geometry must remain unchanged: ' + key);
    if (prior.canonHash === contract.canonHash && prior.catalogHash === contract.catalog.sourceHash)
      continue;
    const image = fs.readFileSync(root + '/assets/sprites/' + prior.output.file),
      source = fs.readFileSync(root + '/tools/sprites/sources/' + prior.source.file);
    assert.equal(P.hash(image), prior.output.hash);
    assert.equal(P.hash(source), prior.source.hash);
    const updated = structuredClone(prior),
      oldRevision = prior.revision || prior.output.hash;
    updated.canonHash = contract.canonHash;
    updated.canonSnapshotHash = contract.canonSnapshotHash;
    assert.equal(
      prior.catalogHash,
      contract.catalog.sourceHash,
      'This pass does not rewrite catalog identity',
    );
    updated.review = {
      ...prior.review,
      canonRetention: {
        date: '2026-10-19',
        authority:
          'Owner approved all reviewed keep/protect plans; earlier image appearance approval is carried forward unchanged.',
        reference: 'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/321',
        decisionRecord: 'docs/APPROVED_ART_PASS_20261019.md',
        comparisonIndex: 'tools/visual-review/approved-art-pass/assessment.json',
        priorRevision: oldRevision,
        priorCanonHash: prior.canonHash,
        currentCanonHash: contract.canonHash,
        outputHash: prior.output.hash,
        sourceHash: prior.source.hash,
        geometryAndPresentationUnchanged: true,
        newGeneratedAppearanceAccepted: false,
      },
    };
    updated.revision = P.revisionFor(updated);
    approved.history ||= {};
    approved.history[key] ||= {};
    approved.history[key][oldRevision] = prior;
    approved.assets[key] = updated;
    manifest.sprites[key] = P.entryFor(updated);
    const expected = { ...manifest.sprites[key] };
    delete expected.revision;
    const oldEntry = { ...state.data[1].sprites[key] };
    delete oldEntry.revision;
    // Compare against the actual incoming bytes, not the mutated snapshot object.
    const incoming = JSON.parse(state.bytes[1]).sprites[key];
    const incomingStable = { ...incoming };
    delete incomingStable.revision;
    assert.deepEqual(expected, incomingStable, 'Only the comparison revision may change');
    receipts.push({
      key,
      priorRevision: oldRevision,
      revision: updated.revision,
      priorCanonHash: prior.canonHash,
      canonHash: contract.canonHash,
      outputHash: prior.output.hash,
    });
  }
  // This is a source-only comparison-receipt edit, not sprite publication.
  // Prepare both checked-in metadata files together; the owning Git commit is
  // the atomic review/checkpoint. No image resource or candidate is published.
  if (receipts.length) {
    for (let i = 0; i < files.length; i++)
      assert.equal(
        P.hash(fs.readFileSync(files[i])),
        state.hashes[i],
        'Registry changed during comparison',
      );
    try {
      fs.writeFileSync(files[0], JSON.stringify(approved, null, 2) + '\n');
      fs.writeFileSync(files[1], JSON.stringify(manifest, null, 2) + '\n');
      await P.checkProduction();
    } catch (error) {
      files.forEach((f, i) => fs.writeFileSync(f, state.bytes[i]));
      throw error;
    }
  }

  fs.mkdirSync(root + '/tools/visual-review/approved-art-pass', { recursive: true });
  fs.writeFileSync(
    root + '/tools/visual-review/approved-art-pass/retained-art.json',
    JSON.stringify(
      {
        scope:
          'Metadata-only comparison refresh; every registered image, source, clip and placement retained.',
        receipts,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Retained art comparison receipts:', receipts.length);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
