'use strict';

// Development-only, source-derived transcription of the ORIGINAL live Vale score.
// Does not create a recording, modify the audio catalog, or change game routing.
// Usage:
//   node tools/audio/millhaven-legacy-transcription.cjs --verify
//   node tools/audio/millhaven-legacy-transcription.cjs --out /tmp/millhaven-notes
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../../src/prototype/audio-catalog.js');

const STEPS = 256;
const TICKS_PER_BEAT = 480;
const PARTS = [
  { id: 'melody', channel: 0, velocity: 90, oscillator: 'triangle' },
  { id: 'harmony', channel: 1, velocity: 52, oscillator: 'sine' },
  { id: 'bass', channel: 2, velocity: 65, oscillator: 'triangle' },
  { id: 'pulse', channel: 3, velocity: 28, oscillator: 'sine' },
];

function transcribe() {
  const theme = catalog.themes.find((item) => item.id === 'vale');
  assert(theme, 'Original Vale synth score is missing');
  assert.equal(theme.bpm, 92, 'Reaudit changed Vale tempo before remaking it');
  assert.equal(theme.root, 60, 'Reaudit changed Vale root before remaking it');
  assert.equal(theme.form.length, STEPS, 'Reaudit changed original phrase structure');
  assert.equal(catalog.pitch(2, false), 3, 'Legacy minor-degree mapping changed');
  assert.equal(catalog.colors.vale, 'triangle', 'Legacy melody timbre changed');

  const events = [];
  const add = (part, step, midi, durationBeats, runtimeGain) => {
    assert(Number.isInteger(midi) && midi >= 0 && midi < 128);
    events.push({
      part,
      beat: step / 2,
      midi,
      durationBeats,
      runtimeGain,
    });
  };

  for (let step = 0; step < STEPS; step++) {
    const degree = theme.form[step];
    const phrase = Math.floor(step / 64) % 4;
    // Mirror audio-score.js exactly; the unreachable phrase 5/6 branches are
    // kept here intentionally to make source comparison straightforward.
    const variation =
      (phrase === 2 || phrase === 6) && step % 8 === 6
        ? 2
        : phrase === 5 && step % 8 === 2
          ? -1
          : 0;
    if (degree !== null) {
      add('melody', step, theme.root + catalog.pitch(degree + variation, false),
        0.7, 0.035);
    }

    if (step % 4 === 0) {
      const chord = (phrase === 2 ? [5, 3, 1, 4] : [0, 5, 3, 4])[
        Math.floor(step / 16) % 4
      ];
      for (const offset of [0, 2, 4]) {
        add('harmony', step, theme.root - 12 + catalog.pitch(chord + offset, false),
          1.8, 0.012);
      }
      add('bass', step, theme.root - 24 + catalog.pitch(chord, false), 1.2, 0.022);
    }

    if (step % 2 === 0) {
      // The source schedules MIDI 31 as a quiet sine oscillator; it is NOT
      // a General MIDI drum-channel note or permission to add a drum kit.
      add('pulse', step, 31, (0.09 * theme.bpm) / 60, 0.009);
    }
  }

  return {
    sourceOfTruth: ['src/prototype/audio-catalog.js', 'src/prototype/audio-score.js',
      'src/prototype/audio-runtime.js'],
    identity: 'original runtime-generated Vale/Millhaven composition, NOT score-book place-vale',
    bpm: theme.bpm,
    rootMidi: theme.root,
    mode: 'C natural minor (legacy non-peace scale)',
    meter: '4/4',
    steps: STEPS,
    bars: 32,
    loopBeats: STEPS / 2,
    loopSeconds: (STEPS / 2) * 60 / theme.bpm,
    notes: events,
    notesOnInterpretation:
      'Exact source pitch/onset and nominal gate. MIDI velocities are only ' +
      'illustrative: Web Audio oscillator waveforms, 30ms attack, exponential ' +
      'decay, night-time melody attenuation, audio buses and ambience are ' +
      'not representable in standard MIDI.',
  };
}

function variableLength(value) {
  assert(Number.isInteger(value) && value >= 0);
  const bytes = [value & 127];
  let n = Math.floor(value / 128);
  while (n > 0) {
    bytes.unshift((n & 127) | 128);
    n = Math.floor(n / 128);
  }
  return Buffer.from(bytes);
}

function midiChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 'ascii');
  header.writeUInt32BE(data.length, 4);
  return Buffer.concat([header, data]);
}

function metaText(type, value) {
  const bytes = Buffer.from(value, 'utf8');
  return Buffer.concat([Buffer.from([0xff, type]), variableLength(bytes.length), bytes]);
}

function midiBytes(transcription) {
  const tempo = Math.round(60000000 / transcription.bpm);
  const tempoBytes = Buffer.from([0xff, 0x51, 0x03,
    (tempo >>> 16) & 255, (tempo >>> 8) & 255, tempo & 255]);
  function track(events) {
    let previous = 0;
    const bytes = [];
    for (const item of events.sort((a, b) => a.tick - b.tick || a.order - b.order)) {
      assert(item.tick >= previous, 'MIDI ticks must be monotonic');
      bytes.push(variableLength(item.tick - previous), item.bytes);
      previous = item.tick;
    }
    bytes.push(variableLength(Math.max(0, transcription.loopBeats *
      TICKS_PER_BEAT - previous)), Buffer.from([0xff, 0x2f, 0x00]));
    return midiChunk('MTrk', Buffer.concat(bytes));
  }
  const tempoTrack = track([
    { tick: 0, order: 0, bytes: metaText(0x03, 'Original Millhaven - timing') },
    { tick: 0, order: 1, bytes: tempoBytes },
    { tick: 0, order: 2, bytes: Buffer.from([0xff, 0x58, 0x04, 4, 2, 24, 8]) },
  ]);
  const voiceTracks = PARTS.map((part) => {
    const events = [{ tick: 0, order: 0, bytes: metaText(0x03, part.id +
      ' - original ' + part.oscillator + ' oscillator') }];
    for (const note of transcription.notes) {
      if (note.part !== part.id) continue;
      const start = Math.round(note.beat * TICKS_PER_BEAT);
      const end = Math.round((note.beat + note.durationBeats) * TICKS_PER_BEAT);
      events.push({ tick: start, order: 2,
        bytes: Buffer.from([0x90 | part.channel, note.midi, part.velocity]) });
      events.push({ tick: end, order: 1,
        bytes: Buffer.from([0x80 | part.channel, note.midi, 0]) });
    }
    return track(events);
  });
  const header = Buffer.alloc(6);
  header.writeUInt16BE(1, 0); // Standard MIDI File format 1: tempo + isolated parts
  header.writeUInt16BE(1 + voiceTracks.length, 2);
  header.writeUInt16BE(TICKS_PER_BEAT, 4);
  return Buffer.concat([midiChunk('MThd', header), tempoTrack, ...voiceTracks]);
}

function writeStudy(destination) {
  const score = transcribe();
  fs.mkdirSync(destination, { recursive: true });
  const jsonFile = path.join(destination, 'millhaven-original-transcription.json');
  const midiFile = path.join(destination, 'millhaven-original-transcription.mid');
  fs.writeFileSync(jsonFile, JSON.stringify(score, null, 2) + '\n');
  fs.writeFileSync(midiFile, midiBytes(score));
  return { jsonFile, midiFile, score };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const index = args.indexOf('--out');
  if (args.includes('--help')) {
    console.log('Use --verify (read-only) or --out DIRECTORY (write outside live catalog).');
  } else if (index >= 0 && args[index + 1]) {
    const result = writeStudy(path.resolve(args[index + 1]));
    console.log('Transcribed ' + result.score.bars + ' bars: ' + result.midiFile);
  } else if (args.length === 0 || (args.length === 1 && args[0] === '--verify')) {
    const score = transcribe();
    assert.equal(score.bars, 32);
    console.log('Verified legacy Millhaven transcription: ' + score.notes.length +
      ' note events, ' + score.loopSeconds.toFixed(3) + '-second loop.');
  } else {
    console.error('Unknown arguments: ' + args.join(' '));
    process.exitCode = 2;
  }
}

module.exports = { transcribe, midiBytes, writeStudy };
