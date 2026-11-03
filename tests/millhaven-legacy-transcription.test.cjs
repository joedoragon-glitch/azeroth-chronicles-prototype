'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  transcribe,
  midiBytes,
  writeStudy,
} = require('../tools/audio/millhaven-legacy-transcription.cjs');

const score = transcribe();
assert.equal(score.bpm, 92);
assert.equal(score.rootMidi, 60);
assert.equal(score.bars, 32);
assert.equal(score.steps, 256);
assert.equal(score.loopBeats, 128);
assert(Math.abs(score.loopSeconds - 83.47826086956522) < 1e-7);
assert.equal(score.notes.filter((item) => item.part === 'pulse').length, 128);
assert.equal(score.notes.filter((item) => item.part === 'harmony').length, 192);
assert.equal(score.notes.filter((item) => item.part === 'bass').length, 64);

const melody = score.notes.filter((item) => item.part === 'melody');
assert.deepEqual(melody.slice(0, 7).map((item) => item.midi),
  [60, 63, 67, 72, 67, 63, 60]);
assert.deepEqual(melody.slice(0, 7).map((item) => item.beat),
  [0, 0.5, 1, 1.5, 2, 2.5, 3]);
assert.deepEqual(score.notes.filter((item) => item.part === 'harmony' && item.beat === 0)
  .map((item) => item.midi), [48, 51, 55]);
assert.equal(score.notes.find((item) => item.part === 'bass').midi, 36);
assert.equal(score.notes.find((item) => item.part === 'pulse').midi, 31);
assert(score.notes.every((item) => Number.isInteger(item.midi) &&
  item.beat >= 0 && item.beat < 128));

const midi = midiBytes(score);
assert.equal(midi.toString('ascii', 0, 4), 'MThd');
assert.equal(midi.readUInt32BE(4), 6);
assert.equal(midi.readUInt16BE(8), 1);
assert.equal(midi.readUInt16BE(10), 5);
assert.equal(midi.readUInt16BE(12), 480);
assert.equal((midi.toString('ascii').match(/MTrk/g) || []).length, 5);

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'millhaven-score-'));
try {
  const generated = writeStudy(temp);
  assert.deepEqual(JSON.parse(fs.readFileSync(generated.jsonFile, 'utf8')), score);
  assert.deepEqual(fs.readFileSync(generated.midiFile), midi);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('PASS source-derived original Millhaven MIDI/JSON transcription.');
