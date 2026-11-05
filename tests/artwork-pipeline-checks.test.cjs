'use strict';
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

// Diagnose approved-asset source drift without waiving the production gate.
// The mill PR modifies procedural visuals while retaining the prior cottage
// raster; record both hashes before the strict checker reports stale approval.
const pipeline = require('../scripts/sprite-pipeline.cjs');
const approvals = require('../tools/sprites/approved.json');
const cottage = pipeline.contractFor('prop:vale-cottage:vale');
const retained = approvals.assets[cottage.key];
if (retained?.canonHash !== cottage.canonHash)
  console.log('ARTWORK_CANON_DRIFT ' + JSON.stringify({
    key: cottage.key,
    approvedCanon: retained.canonHash,
    currentCanon: cottage.canonHash,
    approvedRasterHash: retained.output?.hash,
    recordedApproval: retained.review?.reference,
    selectedRepresentation: cottage.currentDesign?.selectedRepresentation,
    catalogUnchanged: retained.catalogHash === cottage.catalog.sourceHash,
  }));

// These are the real strict command-line validators, not mock approvals or
// compatibility bypasses. Keep every audit gate exercised by future art edits.
for (const [name, file, args] of [
  ['sprite pipeline', 'scripts/sprite-pipeline.cjs', ['check']],
  ['sprite scope', 'scripts/sprite-scope-audit.cjs', ['--check']],
  ['material pipeline', 'scripts/material-pipeline.cjs', ['check']],
]) {
  const output = cp.execFileSync(process.execPath, [file, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120000,
  });
  assert(output.trim(), name + ' returned no result');
  console.log('PASS ' + name + ' strict CLI check');
}
