'use strict';
// Byte-level provenance / coverage check for the Phase 3 recorded-instrument bank.
// Passing this proves only source integrity, NOT timbre, musical quality or release.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const fromRoot = (p) => path.join(root, p);
const bank = JSON.parse(fs.readFileSync(fromRoot('tools/audio/phase3-sample-bank.json'), 'utf8'));
const scores = JSON.parse(fs.readFileSync(fromRoot('tools/audio/phase3-themes.json'), 'utf8'));
const scoreRenderer = fs.readFileSync(fromRoot('tools/audio/phase3-compose.py'), 'utf8');
assert.equal(bank.schemaVersion, 1);
assert.equal(bank.license, 'CC0-1.0');
assert.equal(bank.sourceCommit.length, 40);
assert.match(bank.sourceRepository, /^https:\/\/github\.com\//);
assert.equal(bank.sources.length, 2);
assert(bank.sources.every(s => s.license === 'CC0-1.0'));
assert.equal(bank.instruments.piano.samples.filter(s => s.vel < 1).length, 2);
assert.match(bank.status, /UNVERIFIED/);
assert.match(bank.qualityCaveat, /not a professional master quality guarantee/i);
assert.deepEqual(Object.keys(bank.instruments).sort(),
  ['basses', 'celli', 'flute', 'glockenspiel', 'guitar', 'harp', 'horn', 'marimba', 'piano', 'violins']);
assert.equal(scores.phase4, 'BLOCKED');
assert.equal(scores.sourceQuality, 'REVISE');
assert.equal(scores.sonicQuality, 'UNVERIFIED');
assert.match(scoreRenderer, /phase3-sampler\.py/,
  'Isolated Phase 3 composer must explicitly load the recorded bank player');
const samplerSource = fs.readFileSync(fromRoot('tools/audio/phase3-sampler.py'),'utf8');
assert.match(samplerSource, /class RecordedSampler:/);
assert.match(samplerSource, /sourceGitBlob/);
assert.doesNotMatch(samplerSource, /self\.original\.instrument\(/,
  'Tonal instruments must never silently fall back to oscillator sounds');
let count = 0, bytes = 0;
const sampleFiles = new Set();
for (const [instrument, def] of Object.entries(bank.instruments)) {
  assert(def.samples.length >= 2);
  assert(def.range.length === 2 && def.range[0] <= def.range[1]);
  assert(def.gain > 0 && def.release >= 0);
  const pitches = new Set();
  for (const s of def.samples) {
    assert(s.file.startsWith(instrument + '/'));
    assert.match(s.file, /^[a-zA-Z]+\/[a-zA-Z0-9_-]+\.(mp3|ogg)$/);
    assert(!sampleFiles.has(s.file), 'Duplicate source sample: ' + s.file);
    assert(Number.isInteger(s.midi) && s.midi >= def.range[0] && s.midi <= def.range[1],
      instrument + ': invalid recorded pitch ' + s.midi);
    assert(Number.isInteger(s.sourceBytes) && s.sourceBytes > 2000);
    const data = fs.readFileSync(fromRoot('tools/audio/phase3-samples/' + s.file));
    assert.equal(data.length, s.sourceBytes, s.file + ': upstream size drift');
    const calculated = crypto.createHash('sha1')
      .update(Buffer.from('blob ' + data.length + '\0'))
      .update(data).digest('hex');
    assert.equal(calculated, s.sourceGitBlob, s.file + ': upstream binary changed');
    assert((s.file.endsWith('.ogg') && data.subarray(0,4).toString('ascii') === 'OggS') ||
      (s.file.endsWith('.mp3') && (data.subarray(0,3).toString('ascii') === 'ID3' || data[0] === 0xff)),
      s.file + ': not plausibly MP3/Ogg');
    if (def.sustain) {
      assert(s.loopStart > 0 && s.loopEnd > s.loopStart);
      assert(s.duration > s.loopEnd);
    }
    pitches.add(s.midi);
    sampleFiles.add(s.file);
    bytes += data.length;
    count++;
  }
  assert(pitches.size >= 2, instrument + ': insufficient recorded pitch coverage');
}
assert.equal(count, 55);
const recorded = new Set(sampleFiles);
function filesIn(dir, prefix='') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? filesIn(path.join(dir, e.name), prefix + e.name + '/') :
    [prefix + e.name]);
}
for (const f of filesIn(fromRoot('tools/audio/phase3-samples'))) {
  if (/\.(mp3|ogg)$/.test(f)) assert(recorded.has(f), 'Unproven/unindexed sample: ' + f);
}
// Check the ACTUAL authored pitch and route before judging missing sources.
// The lead renderer uses register 0 for horn/cello, not +12; strings split
// into violins/celli/basses; bell and dulcimer are explicit substitutions.
// Previously this test reported false out-of-range patches by ignoring all
// three production rules. This is a source coverage audit, not listening QA.
const scales = { major: [0,2,4,5,7,9,11], minor: [0,2,3,5,7,8,10],
  dorian: [0,2,3,5,7,9,10], mixolydian: [0,2,4,5,7,9,10] };
const degree = (n, mode) => 12 * Math.floor(n / 7) +
  scales[mode][((n % 7) + 7) % 7];
const routedNotes = [];
const aliases = new Map();
function inspect(t, instrument, midi, role, bar) {
  const originalInstrument = instrument;
  if (instrument === 'strings')
    instrument = midi >= 55 ? 'violins' : midi >= 36 ? 'celli' : 'basses';
  else if (instrument === 'dulcimer')
    instrument = 'marimba';
  else if (instrument === 'bell') {
    instrument = 'glockenspiel';
    while (midi < 79) midi += 12;
  } else if (instrument === 'cello')
    instrument = midi < 36 ? 'basses' : 'celli';
  if (originalInstrument !== instrument)
    aliases.set(originalInstrument + ' → ' + instrument,
      (aliases.get(originalInstrument + ' → ' + instrument) || 0) + 1);
  const def = bank.instruments[instrument];
  assert(def, t.id + ' needs a missing recorded family ' + instrument);
  assert(midi >= def.range[0] - 4 && midi <= def.range[1] + 4,
    t.id + ': ' + originalInstrument + ' MIDI ' + midi +
    ' outside actual sampler bounds');
  const nearest = Math.min(...def.samples.map(s => Math.abs(midi - s.midi)));
  assert(nearest <= 7, t.id + ': source pitch shift exceeds seven semitones');
  routedNotes.push({cue:t.id, bar:bar+1, role, instrument,
    requestedMidi:midi, smallestSemitoneShift:nearest});
}
for (const t of scores.themes.filter(t => !t.pilotFamily)) {
  for (let bar=0; bar<t.bars; bar++) {
    for (const [,d,,alt=0] of t.cells[t.phrases[bar]]) {
      const register = ['horn','cello'].includes(t.lead) ? 0 : 12;
      inspect(t, t.lead,
        t.root+register+degree(t.harmony[bar]+d,t.mode)+alt,
        'lead',bar);
    }
    for (const [,d,,inst,,register] of t.textures[t.figures[bar]])
      inspect(t, inst,
        t.root+degree(t.harmony[bar]+d,t.mode)+register,
        'texture',bar);
    for (const [,d,,inst] of (t.counterpoint?.[String(bar)] || []))
      inspect(t, inst,
        t.root+degree(t.harmony[bar]+d,t.mode),
        'counterpoint',bar);
  }
}
const largeShifts = routedNotes.filter(x=>x.smallestSemitoneShift>=5);
assert(largeShifts.length > 0,
  'Do not silently convert an outlier-heavy bank into a certified palette');
assert(aliases.get('dulcimer → marimba') > 0);
assert(aliases.get('bell → glockenspiel') > 0);
console.log('PASS source/provenance ONLY: '+count+' pinned CC0 source recordings / '+
  bytes+' encoded bytes, all upstream Git blob hashes match');
console.log('HOLD: '+routedNotes.length+' six-theme tonal notes checked against the '+
  'real performed register and sampler routing; '+largeShifts.length+
  ' have >=5-semitone shifts from the closest source. Recorded-surrogate counts: '+
  JSON.stringify(Object.fromEntries(aliases))+
  '. No actual hearing or creative GO; Phase 4 BLOCKED.');
