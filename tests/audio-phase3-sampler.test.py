#!/usr/bin/env python3
"""Fast preflight for actual recorded-source routing before eight full renders."""
import importlib.util
from pathlib import Path
import sys

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "phase3_sampler", ROOT / "tools/audio/phase3-sampler.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Old:
    RATE = 32000
    @staticmethod
    def degree(n, mode):
        scales = {"major": [0,2,4,5,7,9,11], "minor": [0,2,3,5,7,8,10],
                  "dorian": [0,2,3,5,7,9,10],
                  "mixolydian": [0,2,4,5,7,9,10]}
        return 12 * (n // 7) + scales[mode][n % 7]
    @staticmethod
    def drum(*args):
        return np.zeros(100, dtype=float)

import shutil
ffmpeg = shutil.which("ffmpeg")
if not ffmpeg:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
bank = module.RecordedSampler(Old(), ffmpeg)
# A single violin/cello section must not teleport across the stereo stage
# merely because an ascending melody changes MIDI pitch parity.
assert bank.pan("strings", 61) == bank.pan("strings", 62)
assert -0.5 < bank.pan("strings", 61) < 0
assert bank.pan("horn", 65) == bank.pan("horn", 66)
cases = [
    ("flute", 72), ("horn", 67), ("cello", 69), ("cello", 31),
    ("harp", 55), ("piano", 74), ("guitar", 59),
    ("strings", 62), ("strings", 43), ("dulcimer", 53),
    ("bell", 69), ("glockenspiel", 69), ("marimba", 53),
    ("cello", 75), ("horn", 53),
]
rng = np.random.default_rng(20261031)
for kind, midi in cases:
    voice = bank.instrument(midi, .54, kind, rng)
    assert len(voice) > 10000, (kind, midi, "too short")
    assert np.isfinite(voice).all(), (kind, midi, "non-finite")
    assert np.max(np.abs(voice)) > .0001, (kind, midi, "silent recording")
    assert np.max(np.abs(voice)) < 2, (kind, midi, "source clipping")
for kind, midi in [("horn", 100), ("unknown-patch", 65)]:
    try:
        bank.instrument(midi, .3, kind, rng)
    except ValueError:
        pass
    else:
        raise AssertionError("Invalid instrument/register silently accepted: " + kind)
report = bank.snapshot()
assert report["recordedCalls"] == len(cases), report
assert report["uniqueSourceSamples"] >= 7, report
assert report["sourceFamilyCount"] == 2
assert "dulcimer → marimba" in report["provisionalTimbreSubstitutions"]
assert "bell → glockenspiel" in report["provisionalTimbreSubstitutions"]
print("PASS Phase 3 recorded-sample routing, binary hashes, decode, note envelopes, "
      "register limits, and disclosed proxy timbres. Not a listening gate.")
print(report)
