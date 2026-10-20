'use strict';
// Metadata-only comparison refresh for the seven protected material images.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..'),
  M = require(root + '/scripts/material-pipeline.cjs'),
  T = require(root + '/scripts/asset-registry-transaction.cjs'),
  hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
  T.assertClean(root, 'materials');
  const files = [
      root + '/tools/sprites/materials/approved.json',
      root + '/assets/materials/manifest.json',
    ],
    state = T.snapshot(files),
    [registry, manifest] = state.data,
    receipts = [];
  for (const [key, prior] of Object.entries(registry.assets)) {
    const dependency = M.dependency(M.specFor(key));
    if (dependency === prior.dependencyHash) continue;
    const updated = structuredClone(prior);
    assert.equal(
      hash(fs.readFileSync(root + '/assets/materials/' + prior.output.hash + '.png')),
      prior.output.hash,
    );
    updated.dependencyHash = dependency;
    updated.review = {
      ...prior.review,
      canonRetention: {
        date: '2026-10-19',
        authority:
          'Owner approved the keep/protect plan for every registered material; exact texture bytes retained.',
        reference: 'https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/321',
        decisionRecord: 'docs/APPROVED_ART_PASS_20261019.md',
        priorRevision: prior.revision,
        priorDependency: prior.dependencyHash,
        currentDependency: dependency,
        outputHash: prior.output.hash,
        newGeneratedAppearanceAccepted: false,
      },
    };
    updated.revision = hash(
      Buffer.from(
        JSON.stringify({
          output: updated.output.hash,
          runtime: updated.runtime,
          dependency: updated.dependencyHash,
        }),
      ),
    );
    registry.history[key] ||= [];
    if (!registry.history[key].some((r) => r.revision === prior.revision))
      registry.history[key].push(prior);
    registry.assets[key] = updated;
    manifest.materials[key] = M.entry(updated);
    const old = { ...JSON.parse(state.bytes[1]).materials[key] },
      current = { ...manifest.materials[key] };
    delete old.revision;
    delete current.revision;
    assert.deepEqual(current, old);
    receipts.push({
      key,
      priorRevision: prior.revision,
      revision: updated.revision,
      outputHash: prior.output.hash,
    });
  }
  if (receipts.length) {
    files.forEach((f, i) => assert.equal(hash(fs.readFileSync(f)), state.hashes[i]));
    try {
      files.forEach((f, i) =>
        fs.writeFileSync(f, JSON.stringify([registry, manifest][i], null, 2) + '\n'),
      );
      await M.check();
    } catch (e) {
      files.forEach((f, i) => fs.writeFileSync(f, state.bytes[i]));
      throw e;
    }
  }
  fs.writeFileSync(
    root + '/tools/visual-review/approved-art-pass/retained-materials.json',
    JSON.stringify(
      {
        scope:
          'Comparison metadata only; textures, originals, opacity, spans and rollback history retained.',
        receipts,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Retained material comparison receipts:', receipts.length);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
