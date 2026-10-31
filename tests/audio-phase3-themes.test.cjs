'use strict';
// Phase 3's isolated eight-theme source/codec gate (not a listening review).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const score = read('tools/audio/phase3-themes.json');
const manifest = read('assets/audio/manifest.json');
const original = read('tools/audio/score-book.json');
const pilots = read('tools/audio/phase2-pilots-v2.json');
const frozen = read('tools/audio/phase2-crown-freeze.json').frozen;
const ids = ['place-vale', 'place-march', 'place-highlands', 'place-frontier',
  'place-crypt', 'place-archive', 'place-mine', 'place-abyss'];
assert.equal(score.schemaVersion, 3);
assert.deepEqual(score.themes.map((t) => t.id), ids);
assert.equal(Object.keys(frozen).length, 18);
assert.equal(Object.values(manifest.assets).filter((a) => a.kind === 'music').length, 83);
assert.equal(Object.keys(original.cues).length, 83);
const harmonies = new Set();
const phraseForms = new Set();
let newCount = 0;
for (const t of score.themes) {
  assert(manifest.assets[t.id] && !frozen[t.id], 'No deferred Crown cue may enter Phase 3');
  assert.equal(original.cues[t.id].bpm, t.bpm || pilots.families.find(
    (p) => p.family === t.pilotFamily)?.bpm);
  if (t.pilotFamily) {
    const source = pilots.families.find((p) => p.family === t.pilotFamily);
    assert(source, t.id + ' must reuse an existing corrected pilot');
    assert.equal(source.cues[0].id, t.id);
  } else {
    newCount += 1;
    assert.equal(t.harmony.length, t.bars);
    assert.equal(t.energy.length, t.bars);
    assert.equal(t.figures.length, t.bars);
    assert.equal(t.phrases.length, t.bars);
    assert(t.scenes.length === 4 && t.oldMotif && t.motifDecision);
    harmonies.add(t.harmony.join(','));
    phraseForms.add(t.phrases.join(','));
    for (const texture of Object.values(t.textures)) {
      for (const evt of texture)
        assert.equal(evt.length, 6, 'Authored texture notes require timing/pitch/length/instrument/level/register');
    }
  }
}
assert.equal(newCount, 6, 'Do not quietly replace the approved v2 pilot material');
assert.equal(harmonies.size, 6, 'Six new scenes must not copy a single harmony sequence');
assert.equal(phraseForms.size, 6, 'Six new scenes must not copy the same phrase form');
const expressions = score.themes.filter(t=>!t.pilotFamily).map(t=>t.expression);
assert.equal(expressions.length, 6);
assert(expressions.every(e => e && e.leadGate >= .72 && e.leadGate <= 1 &&
  e.leadAttackMs >= 5 && e.leadAttackMs <= 140 &&
  e.textureJitterMs >= 0 && e.textureJitterMs <= 12));
assert.equal(new Set(expressions.map(e => JSON.stringify(e))).size, 6,
  'Each new score needs scene-specific expression, not cloned attack/gate timing');
const explicitScoring = score.themes.filter(t=>!t.pilotFamily);
assert(explicitScoring.every(t => Object.values(t.textures).flat().every(e =>
  !['dulcimer','bell'].includes(e[3]))),
  'Six current regional themes must explicitly select real recorded plucks/chimes');
for (const t of explicitScoring.filter(t=>t.lead==='horn')) {
  assert.equal(t.leadRegisterByBar.length,t.bars);
  assert.deepEqual(t.leadRegisterByBar.slice(0,2),[0,0],
    'Original heritage opening retains its actual register');
  assert(t.leadRegisterByBar.some(v=>v===-12) && t.registerRationale.length>90,
    'Later horn orchestration needs an authored register choice');
}
const spaces = score.themes.filter(t=>!t.pilotFamily).map(t=>t.production);
assert.equal(spaces.length, 6);
assert.equal(new Set(spaces.map(p=>JSON.stringify(p.earlyReflections))).size, 6,
  'No generic acoustic-space preset shared among six authored regions');
assert(spaces.every(p=>p.space.length>=35 && p.stageWidth>.7 && p.lowpassHz<18000));
// Source-level phrase review: an accidental octave-plus switch is not
// an approved form of dramatic contrast. Explicitly review such leaps instead.
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10],
};
const degree = (n, mode) => Math.floor(n / 7) * 12 + scales[mode][((n % 7) + 7) % 7];
for (const t of score.themes.filter((s) => !s.pilotFamily)) {
  const notes = [];
  for (let bar = 0; bar < t.bars; bar++) {
    for (const [beat, pitch, , accidental = 0] of t.cells[t.phrases[bar]]) {
      notes.push({ when: bar * 4 + beat,
        midi: t.root + (t.lead==='horn'||t.lead==='cello'?0:12) +
          (t.leadRegisterByBar?.[bar] || 0) +
          degree(t.harmony[bar] + pitch, t.mode) + accidental });
    }
  }
  notes.sort((a, b) => a.when - b.when);
  const maxLeap = Math.max(...notes.slice(1).map((n, i) => Math.abs(n.midi - notes[i].midi)));
  assert(maxLeap <= 12, t.id + ': unexpectedly large melodic register change; review the score');
}

const run = (exe, args, timeout) => {
  const result = cp.spawnSync(exe, args, {
    cwd: root, encoding: 'utf8', timeout, maxBuffer: 20 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  assert.equal(result.status, 0, exe + ' ' + args.join(' ') +
    ' failed: ' + (result.error || result.signal || result.status));
};
run('python3', ['tools/audio/phase3-compose.py', '--check'], 120000);
if (process.env.GITHUB_ACTIONS === 'true' &&
    process.env.GITHUB_HEAD_REF === 'audio/phase3-primary-themes-20261031') {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sibdlp-phase3-'));
  const python = path.join(temp, 'venv', 'bin', 'python');
  run('python3', ['-m', 'venv', path.join(temp, 'venv')], 60000);
  run(python, ['-m', 'pip', 'install', '--disable-pip-version-check', '--quiet',
    'numpy==2.2.6', 'scipy==1.16.1', 'imageio-ffmpeg==0.6.0'], 180000);
  run(python, ['tools/audio/phase3-compose.py', '--render', path.join(temp, 'preview')], 600000);
  const report = JSON.parse(fs.readFileSync(path.join(temp, 'preview', 'phase3-metrics.json'), 'utf8'));
  assert.deepEqual(report.tracks.map((m) => m.cue), ids);
  assert.equal(report.crownFrozen, 18);
  assert.equal(report.musicRegistered, 83);
  assert(report.headroomAfterEightOnlyBytes > 0, '32 MiB budget exceeded even before variants');
  for (const m of report.tracks) {
    assert(m.decodedPeak > 0 && m.decodedPeak < .98, m.cue + ': clipped');
    assert(m.decodedRms > .005 && m.decodedRms < .5, m.cue + ': silent or unbalanced');
    assert(m.loopEdgeDelta < .2, m.cue + ': bad boundary');
    assert(m.encodedBytes > 0 && m.encodedBytes < 8 * 1024 * 1024, m.cue + ': per-file cap');
    assert(m.decodedSamples >= m.expectedSamples - 32, m.cue + ': decoder padding');
  }
  console.log('PASS isolated eight-MP3 decode, loop, budget and Crown freeze checks; NOT auditory approval');
}
console.log('PASS Phase 3 score-schema/codec checks only; musical source REVISE, genuine sonic hearing UNVERIFIED, Phase 4 BLOCKED');
