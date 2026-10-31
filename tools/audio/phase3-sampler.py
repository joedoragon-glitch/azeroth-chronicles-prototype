#!/usr/bin/env python3
"""Isolated Phase 3 CC0 recording player. Not a game runtime, approved mix or listening test.

Sources are pinned byte-for-byte in phase3-sample-bank.json and phase3-samples/.
The composed notes remain authored by the original score/pilot systems; this
engine changes ONLY how those notes are performed (and documents substitutions).
"""
import hashlib
import json
from collections import Counter
from pathlib import Path
import subprocess

import numpy as np
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[2]
BANK = ROOT / "tools/audio/phase3-sample-bank.json"
SAMPLES = (ROOT / "tools/audio/phase3-samples").resolve()


class RecordedSampler:
    def __init__(self, original, ffmpeg):
        self.original = original
        self.RATE = original.RATE
        self.ffmpeg = ffmpeg
        self.bank = json.loads(BANK.read_text(encoding="utf-8"))
        assert self.bank["schemaVersion"] == 1
        assert self.bank["sources"] and all(s["license"] == "CC0-1.0"
                                            for s in self.bank["sources"])
        self.instruments = self.bank["instruments"]
        self.decoded = {}
        self.pitched = {}
        self.calls = 0
        self.used = set()
        self.shift_histogram = Counter()
        self.aliases = Counter()

    def degree(self, n, mode):
        return self.original.degree(n, mode)

    def drum(self, kind, rng):
        # Existing drum synthesis is explicit and isolated; tonal instruments
        # must NEVER silently fall back to one generic oscillator patch.
        return self.original.drum(kind, rng)

    def _route(self, midi, kind):
        original = kind
        if kind == "strings":
            kind = "violins" if midi >= 55 else "celli" if midi >= 36 else "basses"
        elif kind == "dulcimer":
            # Temporary marimba surrogate, explicitly disclosed in metrics.
            kind = "marimba"
        elif kind == "bell":
            # Recorded glockenspiel lives in a higher register than old bell
            # placeholders. This timbral/octave reinterpretation needs listening.
            kind = "glockenspiel"
            while midi < 79:
                midi += 12
        elif kind == "cello":
            if midi < 36:
                kind = "basses"
            elif midi > 75:
                raise ValueError("Cannot play cello above bank range+4: MIDI " + str(midi))
            else:
                kind = "celli"
        if kind not in self.instruments:
            raise ValueError("Missing recorded instrument: " + original)
        low, high = self.instruments[kind]["range"]
        if midi < low - 4 or midi > high + 4:
            raise ValueError("%s: MIDI %s outside recorded source bounds %s–%s"
                             % (original, midi, low, high))
        if original != kind:
            self.aliases[original + " → " + kind] += 1
        return kind, midi

    def _load(self, sample):
        file = sample["file"]
        if file not in self.decoded:
            source = (SAMPLES / file).resolve()
            if not source.is_relative_to(SAMPLES) or not source.is_file():
                raise ValueError("Missing or unsafe sample: " + file)
            content = source.read_bytes()
            git_sha = hashlib.sha1(
                ("blob %s\0" % len(content)).encode() + content
            ).hexdigest()
            if git_sha != sample["sourceGitBlob"] or len(content) != sample["sourceBytes"]:
                raise ValueError("CC0 upstream provenance hash mismatch: " + file)
            raw = subprocess.check_output([
                self.ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error",
                "-i", str(source), "-f", "f32le", "-ac", "1", "-ar",
                str(self.RATE), "pipe:1"
            ])
            data = np.frombuffer(raw, dtype="<f4").copy()
            if len(data) < self.RATE // 4 or not np.isfinite(data).all():
                raise ValueError("Missing, too-short or invalid decoded recording: " + file)
            self.decoded[file] = data
        return self.decoded[file]

    def _choose(self, kind, midi, rng):
        samples = self.instruments[kind]["samples"]
        if kind == "piano":
            soft = rng.random() < 0.3
            subset = [s for s in samples if (s["vel"] < 0.8) == soft]
            if subset and min(abs(midi-s["midi"]) for s in subset) <= 3:
                samples = subset
            else:
                samples = [s for s in samples if s["vel"] >= 0.8]
        selected = min(samples, key=lambda s: (abs(midi-s["midi"]), -s.get("vel", 1)))
        distance = midi - selected["midi"]
        if abs(distance) > 7:
            raise ValueError("Excessive recorded-sample pitch shift: " +
                             kind + " MIDI " + str(midi) + " from " +
                             str(selected["midi"]))
        return selected, distance

    def instrument(self, midi, duration, kind, rng):
        kind, target = self._route(int(midi), kind)
        definition = self.instruments[kind]
        sample, shift = self._choose(kind, target, rng)
        raw = self._load(sample)
        key = (sample["file"], shift)
        if key not in self.pitched:
            ratio = 2 ** (shift / 12)
            # Band-limited polyphase pitch shift prevents the avoidable treble
            # aliasing of nearest-sample or naïve linear interpolation.
            down = round(1024 * ratio)
            pitched = raw if down == 1024 else resample_poly(raw, 1024, down)
            self.pitched[key] = pitched.astype(np.float32, copy=False)
        pitched = self.pitched[key]
        release = definition["release"]
        frames = max(64, round((duration + release) * self.RATE))
        positions = np.arange(frames, dtype=np.float64)
        if definition["sustain"]:
            ratio = 2 ** (shift / 12)
            a = round(sample["loopStart"] * self.RATE / ratio)
            b = round(sample["loopEnd"] * self.RATE / ratio)
            if not (0 < a < b < len(pitched)):
                raise ValueError("Decoded source has invalid loop points: " + sample["file"])
            span = b - a
            mapped = np.where(positions >= b, a + ((positions - a) % span), positions)
            # The tiny-orchestra loops are crossfaded at source; add a short
            # seam transition after repitching to protect stretched sustains.
            sound = np.interp(mapped, np.arange(len(pitched)), pitched)
            fade = min(round(.045 * self.RATE), span // 6)
            if fade > 8:
                mask = mapped > b - fade
                alpha = (mapped[mask] - (b - fade)) / fade
                head = np.interp(a + mapped[mask] - (b - fade),
                                 np.arange(len(pitched)), pitched)
                sound[mask] = sound[mask] * (1-alpha) + head * alpha
        else:
            sound = np.zeros(frames, dtype=np.float64)
            count = min(frames, len(pitched))
            sound[:count] = pitched[:count]
        attack = min(round(.004 * self.RATE), frames)
        if attack:
            sound[:attack] *= np.linspace(0.0, 1.0, attack)
        noteoff = min(frames, round(duration * self.RATE))
        tail = len(sound) - noteoff
        if tail:
            sound[noteoff:] *= np.linspace(1.0, 0.0, tail)
        self.calls += 1
        self.used.add(sample["file"])
        self.shift_histogram[abs(shift)] += 1
        return (sound * definition.get("gain", 1) *
                sample.get("vel", 1)).astype(np.float64)

    def snapshot(self):
        return {"recordedCalls": self.calls, "sampleFilesDecoded": len(self.decoded),
                "uniqueSourceSamples": len(self.used), "maxSemitonePitchShift":
                max(self.shift_histogram, default=0),
                "shiftHistogram": dict(sorted(self.shift_histogram.items())),
                "provisionalTimbreSubstitutions": dict(sorted(self.aliases.items())),
                "sourceFamilyCount": len(self.bank["sources"]),
                "instrumentFamilies": sorted(self.instruments)}
