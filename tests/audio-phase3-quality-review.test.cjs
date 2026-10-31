'use strict';
// Adversarial Phase 3 source-comparison check: keeps our corrective evidence
// attached to the score actually rendered, not just a prose intention.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const book = read('tools/audio/score-book.json').cues;
const score = read('tools/audio/phase3-themes.json').themes;
const pilots = read('tools/audio/phase2-pilots-v2.json').families;
const audit = read('tools/audio/phase3-quality-review.json');
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};
const degree = (n, mode) =>
  Math.floor(n / 7) * 12 + scales[mode][((n % 7) + 7) % 7];
const intervals = (notes) => notes.slice(1).map((n, i) => n[1] - notes[i][1]);
assert.equal(audit.schemaVersion, 1);
assert.equal(audit.cues.length, 8);
const explicitlyRetainedHooks = new Set([
  'place-march', 'place-highlands', 'place-frontier',
  'place-crypt', 'place-mine', 'place-abyss',
]);
assert.deepEqual(audit.cues.map((c) => c.id), score.map((t) => t.id));
assert.equal(audit.gate.sourceComposition, 'REVISE',
  'Source GO cannot be inherited from a file-count or codec test');
assert.equal(audit.gate.heardSound, 'UNVERIFIED',
  'Do not claim human audition from decoded audio stats');
assert.equal(audit.gate.phase4, 'BLOCKED',
  'Phase 4 must not scale an unresolved timbral/motif weakness');
let discrepancies = 0;
for (const theme of score) {
  const evidence = audit.cues.find((c) => c.id === theme.id);
  const original = book[theme.id].melody.slice(0, 8)
    .flatMap((note, i) => note === null ? [] : [[i, note]]);
  const performed = [];
  if (theme.pilotFamily) {
    const family = pilots.find((p) => p.family === theme.pilotFamily);
    assert(family, theme.id + ': missing pilot');
    for (let bar = 0; bar < 2; bar++) {
      const notes = theme.pilotLeadOverrides?.[String(bar)] ||
        family.performance.leadOverrides?.[String(bar)] ||
        family.cells[family.phrases[bar]].map(([at, pitch, len]) =>
          [at, pitch + family.performance.leadShifts[bar], len]);
      for (const [at, pitch, , accidental=0] of notes) {
        performed.push([+(bar * 4 + at).toFixed(3), degree(pitch, family.mode)+accidental]);
      }
    }
  } else {
    for (let bar = 0; bar < 2; bar++) {
      for (const [at, pitch, , accidental = 0] of theme.cells[theme.phrases[bar]]) {
        performed.push([+(bar * 4 + at).toFixed(3),
          degree(pitch + theme.harmony[bar], theme.mode) + accidental]);
      }
    }
  }
  if (explicitlyRetainedHooks.has(theme.id) || theme.pilotLeadOverrides) {
    assert.deepEqual(performed, original,
      theme.id + ': deliberate original opening pitch/onset identity regressed; ' +
        'document any artistic replacement as a reviewed source decision');
  }
  const oldSteps = intervals(original);
  const newSteps = intervals(performed);
  const len = Math.min(4, newSteps.length);
  const match = oldSteps.slice(0, len).filter((n, i) => n === newSteps[i]).length;
  assert.deepEqual(evidence.originalFirstTwoBars, original, theme.id + ': old score audit stale');
  assert.deepEqual(evidence.currentlyPerformedFirstTwoBars, performed,
    theme.id + ': performed note evidence stale; re-review actual melodic source');
  assert.deepEqual(evidence.originalOpeningIntervals, oldSteps);
  assert.deepEqual(evidence.candidateOpeningIntervals, newSteps);
  assert.equal(evidence.firstFourExactIntervalPositions, match);
  assert.match(evidence.review, /.{60,}/,
    theme.id + ': specific critical interpretation required');
  assert.match(evidence.sound, /^UNVERIFIED/);
  if (match < 4) discrepancies++;
}
// Even if all eight hooks match, preserve the quality HOLD until independent
// musical, timbral and rendered-audio review; an interval count is not a gate.
assert.equal(audit.gate.phase4, 'BLOCKED');
console.log('PASS adversarial Phase 3 review record tracks actual original/performed notes');
console.log('HOLD: ' + discrepancies +
  '/8 candidate openings currently diverge in >=1 of first four interval positions; ' +
  'this count is NOT an artistic verdict, and no actual listening is claimed.');
