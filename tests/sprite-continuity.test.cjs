'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pipeline = require('../scripts/sprite-pipeline.cjs');
const root = path.resolve(__dirname, '..');
(async () => {
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'tools/sprites/approved.json')));
  const decisions = JSON.parse(
    fs.readFileSync(path.join(root, 'tools/sprites/current-design-decisions.json')),
  );
  const before = [
    'assets/sprites/manifest.json',
    'tools/sprites/approved.json',
    'src/prototype/visuals.js',
    'src/prototype/sprites.js',
  ].map((file) => [file, pipeline.hash(fs.readFileSync(path.join(root, file)))]);
  const counts = { raster: 0, procedural: 0 };
  for (const key of Object.keys(registry.assets)) {
    const contract = pipeline.contractFor(key);
    const current = pipeline.currentDesignFor(key, contract);
    counts[current.selectedRepresentation]++;
    assert(current.registered);
    for (const item of current.handoffs)
      assert.equal(item.hash, pipeline.hash(fs.readFileSync(path.join(root, item.file))));
  }
  assert.deepEqual(counts, { raster: 23, procedural: 11 });
  for (const value of Object.values(decisions.assets)) {
    for (const file of [...value.decisionDocuments, ...value.handoffs])
      assert(fs.existsSync(path.join(root, file)), file);
  }
  const mage = pipeline.asset('hero:mage').matches[0];
  assert(mage.activeRevision && mage.source && mage.presentation === null);
  assert.equal(mage.currentDesign.selectedRepresentation, 'procedural');
  assert.match(mage.currentDesign.decision.traits, /twin front braids/);
  assert.match(mage.currentDesign.decision.traits, /Moon setting/);
  assert.equal(
    pipeline.asset('hero:ranger').matches[0].currentDesign.selectedRepresentation,
    'raster',
  );
  assert.equal(
    pipeline.currentDesignFor('boss:citadel').decision.traits.includes('continuous violet skirt'),
    true,
  );
  assert.match(pipeline.currentDesignFor('pet:ridge').decision.traits, /silver Crown emblem/);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'azeroth-continuity-'));
  try {
    const checkpoint = await pipeline.generationRequest('hero:mage', path.join(temp, 'mage'));
    const request = checkpoint.request;
    assert.equal(request.contexts.length, 12);
    assert.equal(request.currentDesign.selectedRepresentation, 'procedural');
    assert.match(request.prompt, /Latest recorded design decisions/);
    assert.match(request.prompt, /Moon setting staff/);
    assert(
      request.prompt.indexOf('Latest recorded design decisions') >
        request.prompt.indexOf(pipeline.contractFor('hero:mage').catalog.prompt),
    );
    assert.equal(request.promptHash, pipeline.hash(Buffer.from(request.prompt)));
    assert.equal(
      request.currentDesign.hash,
      pipeline.hash(fs.readFileSync(path.join(root, request.currentDesign.file))),
    );
    assert.equal(
      request.reference.hash,
      pipeline.hash(pipeline.reference(pipeline.contractFor('hero:mage'), true)),
    );
    assert.match(request.authorization, /does not authorize generation/);
    assert.match(request.replacement.instruction, /superseded at runtime/);
    const measured = await pipeline.inspect(
      pipeline.reference(pipeline.contractFor('hero:mage'), true),
    );
    assert.equal(
      request.target.visibleBodyCSS.width,
      (measured.materialBounds.x2 - measured.materialBounds.x1 + 1) * 1.5,
    );
    assert.equal(
      request.target.visibleBodyCSS.height,
      (measured.materialBounds.y2 - measured.materialBounds.y1 + 1) * 1.5,
    );
    await assert.rejects(
      pipeline.generationRequest('hero:mage', checkpoint.directory),
      /immutable/,
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  for (const [file, hash] of before)
    assert.equal(pipeline.hash(fs.readFileSync(path.join(root, file))), hash, file);
  console.log(
    'PASS current runtime disposition for all 34 registrations, decision links/hashes, retained sources, latest Mage request/reference/body footprint, immutable capture and unchanged production art/registries',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
