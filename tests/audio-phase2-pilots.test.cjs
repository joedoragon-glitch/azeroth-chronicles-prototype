'use strict';
// Phase 2 composition source guard. No auditions or live asset replacements.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const manifest = read('assets/audio/manifest.json');
const scorebook = read('tools/audio/score-book.json');
const pilot = read('tools/audio/phase2-pilots.json');
const freeze = read('tools/audio/phase2-crown-freeze.json').frozen;
const crownIds = [
  'place-crown', 'action-crown', 'peace-crown', 'night-crown', 'settlement-crown',
  'place-citadel', 'action-citadel', 'peace-citadel',
  'interior-supply-crown', 'peace-interior-supply-crown',
  'interior-side-crown-foundry', 'peace-interior-side-crown-foundry',
  'boss-citadel', 'boss-citadel-true', 'boss-cindermaw', 'boss-cindermaw-true',
  'boss-darklord', 'boss-darklord-true'
];
assert.deepEqual(Object.keys(freeze).sort(), crownIds.sort());
const music = Object.entries(manifest.assets).filter(([, asset]) => asset.kind === 'music');
assert.equal(music.length, 83);
assert.equal(Object.keys(scorebook.cues).length, 83);
const allowed = new Set(music.map(([id]) => id).filter((id) => !freeze[id]));
assert.equal(allowed.size, 65);
for (const id of crownIds) {
  const actual = manifest.assets[id];
  const fixed = freeze[id];
  for (const field of ['sha256', 'src', 'duration', 'bpm', 'managedBy'])
    assert.deepEqual(actual[field], fixed[field], id + ': ' + field);
  assert.deepEqual(actual.loop, fixed.loop, id + ': loop');
  const filepath = path.resolve(root, actual.src);
  assert(filepath.startsWith(path.join(root, 'assets/audio') + path.sep));
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(filepath)).digest('hex'),
    fixed.sha256, id + ' changed on disk');
}
assert.equal(pilot.schemaVersion, 1);
assert.equal(pilot.families.length, 4);
assert.deepEqual(new Set(pilot.families.map((f) => f.context)),
  new Set(['outdoor', 'main-dungeon', 'inhabited-interior', 'boss-true']));
assert.equal(new Set(pilot.families.map((f) => f.style)).size, 4);
const seen = new Set();
const structuralSignatures = new Set();
for (const family of pilot.families) {
  assert(family.bars >= 8 && family.bars <= 24, family.family);
  assert.equal(family.harmony.length, family.bars, family.family);
  assert.equal(family.phrases.length, family.bars, family.family);
  assert.equal(family.cues.length, 2, family.family);
  assert(family.bpm > 55 && family.bpm < 170);
  assert(family.intent.length >= 50);
  for (const label of [...family.phrases, ...(family.peacePhrases || [])])
    assert(Object.hasOwn(family.cells, label), family.family + ': ' + label);
  if (family.peacePhrases) assert.equal(family.peacePhrases.length, family.bars);
  if (family.peaceHarmony) assert.equal(family.peaceHarmony.length, family.bars);
  for (const cell of Object.values(family.cells))
    for (const [beat, pitch, duration] of cell) {
      assert(beat >= 0 && beat < 4);
      assert(Number.isInteger(pitch) && pitch >= -12 && pitch <= 15);
      assert(duration > 0 && duration <= 4.5);
    }
  const parts = family.cues.map((cue) => cue.part);
  assert([['base','action'],['base','peace'],['base','true']].some(
    (expected) => JSON.stringify(expected) === JSON.stringify(parts)), family.family);
  for (const cue of family.cues) {
    assert(allowed.has(cue.id), 'Frozen/unknown pilot cue: ' + cue.id);
    assert(!seen.has(cue.id), 'Duplicate pilot: ' + cue.id);
    seen.add(cue.id);
    assert.equal(scorebook.cues[cue.id].bpm, family.bpm);
  }
  const motif = Object.values(family.cells).flat();
  const differentRhythms = new Set(motif.map(([beat, , duration]) => beat + ':' + duration));
  assert(differentRhythms.size >= 8, family.family + ' repeats one rhythmic shape');
  structuralSignatures.add([family.bars, family.style, family.harmony.join(','),
    family.phrases.join(',')].join('|'));
}
assert.equal(seen.size, 8);
assert.equal(structuralSignatures.size, 4);
// The Python --check path is intentionally stdlib-only: actual Crown disk hashes,
// recipe schema and Python syntax are exercised by the focused Node test.
const pythonResult = cp.spawnSync('python3', ['tools/audio/phase2-composer.py', '--check'],
  { cwd: root, encoding: 'utf8', timeout: 120000 });
if (pythonResult.error) throw pythonResult.error;
assert.equal(pythonResult.status, 0,
  'Python pilot contract check failed: ' + pythonResult.stdout + pythonResult.stderr);
assert.match(pythonResult.stdout, /83 live IDs, 65 allowed, 18 Crown hashes verified/);
console.log('PASS Python isolated composer preflight and frozen Crown disk hashes');

// Only the isolated Phase 2 draft branch renders previews in ordinary focused
// CI. Other branches/main keep this a fast contract and source-integrity test.
if (
  process.env.GITHUB_ACTIONS === 'true' &&
  process.env.GITHUB_HEAD_REF === 'audio/phase2-composition-pilots-20261030'
) {
  const os = require('node:os');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sibdlp-phase2-'));
  const venv = path.join(temp, 'venv');
  const py = path.join(venv, 'bin', 'python');
  const outputDir = path.join(temp, 'internal-preview');
  const runChecked = (command, args, timeout) => {
    const child = cp.spawnSync(command, args, {
      cwd: root, encoding: 'utf8', timeout, maxBuffer: 10 * 1024 * 1024,
    });
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    assert.equal(child.status, 0,
      'Phase 2 subprocess failed: ' + command + ' ' + args.join(' ') +
      ' [' + (child.error || child.signal || child.status) + ']');
  };
  runChecked('python3', ['-m', 'venv', venv], 60000);
  runChecked(py, ['-m', 'pip', 'install', '--disable-pip-version-check', '--quiet',
    'numpy==2.2.6', 'scipy==1.16.1'], 180000);
  runChecked(py, ['tools/audio/phase2-composer.py', '--render', outputDir], 540000);
  const report = JSON.parse(fs.readFileSync(path.join(outputDir, 'pilot-metrics.json'), 'utf8'));
  assert.equal(report.musicRegistered, 83);
  assert.equal(report.crownFrozen, 18);
  assert.equal(report.pilotFamilies, 4);
  assert.equal(report.pilotStems.length, 8);
  assert(report.headroomAfterPilotProjectionBytes > 0, '32 MiB catalog budget breached');
  for (const item of report.pilotStems) {
    assert(item.decodedPeak > 0 && item.decodedPeak < .98, item.cue + ' decoded peak');
    assert(item.decodedRms > .005 && item.decodedRms < .5, item.cue + ' decoded RMS');
    assert(item.encodedBytes > 0 && item.encodedBytes < 8 * 1024 * 1024, item.cue + ' size');
    assert(fs.existsSync(path.join(outputDir, item.cue + '.mp3')), item.cue + ' missing MP3');
    assert(item.loop.end > item.loop.start);
  }
  console.log('PHASE2_INTERNAL_RENDER_METRICS=' + JSON.stringify(report));
  console.log('PASS eight isolated MP3 previews rendered/decoded and frozen Crown content rechecked; do not treat this as an audition or deployment');
}

console.log('PASS Phase 2: 4 contrasting structured pilots / 8 stems, 65-ID allowlist, 83 current music IDs, 18 actual frozen Crown recordings + hashes');
