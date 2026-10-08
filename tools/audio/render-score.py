"""Render the original Azeroth score book. No third-party recordings or samples.

Development dependencies: Python 3, numpy, scipy and ffmpeg (libmp3lame).
The checked-in MP3s and registry are the reproducible runtime output.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import tempfile
import wave
import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[2]
RATE = 32000
BOOK = json.loads((ROOT / "tools/audio/score-book.json").read_text())
SCALES = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10],
          "dorian": [0, 2, 3, 5, 7, 9, 10], "mixolydian": [0, 2, 4, 5, 7, 9, 10]}

def degree(n, mode):
    octave, index = divmod(int(n), 7)
    return SCALES[mode][index] + 12 * octave

def instrument(midi, duration, kind, rng):
    length = max(64, round((duration + .24) * RATE))
    t = np.arange(length) / RATE
    hz = 440 * 2 ** ((midi - 69) / 12)
    end = np.clip((duration + .2 - t) / .22, 0, 1)
    result = np.zeros(length)
    if kind in ["piano", "harp", "guitar", "dulcimer"]:
        partials = {"piano": [(1, 1), (2, .34), (3, .18), (4, .12), (5, .07), (6, .05)],
                    "harp": [(1, 1), (2, .24), (3, .1), (4, .035)],
                    "guitar": [(1, 1), (2, .4), (3, .17), (4, .075), (5, .02)],
                    "dulcimer": [(1, 1), (2, .4), (3, .17), (5, .13), (7, .07)]}[kind]
        for harmonic, amp in partials:
            stretch = 1 + (.0003 if kind in ["piano", "dulcimer"] else .00008) * harmonic ** 2
            decay = 1.6 / harmonic ** .65 if kind != "guitar" else .85 / harmonic ** .5
            result += amp * np.sin(2 * np.pi * hz * harmonic * stretch * t) * np.exp(-t / decay)
        result *= np.clip(t / .006, 0, 1) * end
        result += rng.normal(0, .01, length) * np.exp(-t / .012)
    elif kind == "bell":
        for ratio, amp, decay in [(1, 1, 1.5), (2.01, .2, .9), (2.76, .1, .45), (4.12, .055, .25)]:
            result += amp * np.sin(2 * np.pi * hz * ratio * t) * np.exp(-t / decay)
        result *= np.clip(t / .012, 0, 1) * end
    else:
        vibrato = .0018 * np.sin(2 * np.pi * 5.15 * t) * np.clip(t / .25, 0, 1)
        phase = 2 * np.pi * hz * np.cumsum(1 + vibrato) / RATE
        partials = {"flute": [1, .05, .12, .025], "cello": [1, .45, .18, .12, .06, .04],
                    "horn": [1, .32, .15, .06, .025], "strings": [1, .35, .19, .1, .065, .035]}[kind]
        for i, amp in enumerate(partials):
            result += amp * np.sin((i + 1) * phase)
            if kind in ["strings", "cello"]:
                result += .18 * amp * np.sin((i + 1) * phase * 1.0017 + .3)
        attack = .075 if kind in ["flute", "horn"] else .16
        result *= np.clip(t / attack, 0, 1) ** .7 * end
        result *= .85 + .15 * np.sin(np.pi * np.minimum(t / max(duration, .1), 1))
        if kind == "flute":
            breath = sosfilt(butter(2, [900, 4500], btype="bandpass", fs=RATE, output="sos"), rng.normal(0, 1, length))
            result += breath * .035 * np.clip(t / .08, 0, 1) * end
    return result / max(1.0, sum([1, .3, .15]))

def drum(kind, rng):
    duration = .5 if kind == "tom" else .16
    t = np.arange(round(RATE * duration)) / RATE
    noise = rng.normal(0, 1, len(t))
    if kind == "tom":
        phase = 2 * np.pi * np.cumsum(65 + 80 * np.exp(-t / .03)) / RATE
        out = np.sin(phase) * np.exp(-t / .13) + noise * .06 * np.exp(-t / .02)
    elif kind == "frame":
        out = np.sin(2 * np.pi * 170 * t) * .45 * np.exp(-t / .055)
        out += sosfilt(butter(2, [450, 3500], btype="bandpass", fs=RATE, output="sos"), noise) * .4 * np.exp(-t / .035)
    else:
        out = sosfilt(butter(2, 5000, btype="highpass", fs=RATE, output="sos"), noise) * .12 * np.exp(-t / .03)
    return out * np.clip(t / .002, 0, 1)

def render(cue, seed):
    rng = np.random.default_rng(seed)
    beat = 60 / cue["bpm"]
    duration = beat * 4 * cue["bars"]
    mix = np.zeros(round(duration * RATE))
    root, mode, role = cue["root"], cue["mode"], cue["role"]
    action = role in ["action", "true"]
    peaceful = role in ["peace", "refuge", "title"]
    def add(at, samples, level):
        start = round(at * RATE) % len(mix)
        samples = samples * level
        first = min(len(samples), len(mix) - start)
        mix[start:start + first] += samples[:first]
        rest = samples[first:]
        if len(rest): mix[:len(rest)] += rest
    def note(at, midi, length, kind, level):
        add(at, instrument(midi, length, kind, rng), level)
    # Eight bars: related motif, developed reply, contrasting harmony and returning cadence.
    progression = [0, 0, 5, 3, 4, 3, 4, 0] if mode in ["major", "mixolydian"] else [0, 5, 3, 4, 0, 3, 5, 4]
    if cue["flavor"] % 3 == 1: progression = [0, 3, 5, 4, 0, 5, 3, 4]
    if not action:
        for bar, chord in enumerate(progression):
            at = bar * 4 * beat
            for k, voice in enumerate([0, 2, 4]):
                note(at + k * .018, root - 12 + degree(chord + voice, mode), beat * 3.7, "strings", .07 if peaceful else .065)
            note(at, root - 24 + degree(chord, mode), beat * 2.2, "cello", .12 if role == "boss" else .065)
            for step in range(8):
                offset = [0, 4, 2, 4, 0, 2, 4, 2][step]
                note(at + step * beat / 2 + rng.uniform(-.006, .006), root + degree(chord + offset, mode), beat * .65,
                     cue["pluck"], .045 if peaceful else .052)
        # The original motif is a phrase, not a note on every scheduler tick.
        motif = cue["melody"]
        for i in range(32):
            n = motif[i % len(motif)]
            if n is None: continue
            at = i * beat
            next_rest = motif[(i + 1) % len(motif)] is None
            variation = 7 if i >= 16 and i % 8 == 2 and n <= 4 else 0
            midi = root + 12 + n + variation
            if mode == "major" and (midi - root) % 12 in [3, 8, 10]: midi += 1
            length = beat * (1.55 if next_rest else .84)
            note(at, midi, length, cue["lead"], .19 if role == "boss" else .14)
            if i >= 16 and i % 4 == 2:
                note(at + beat * .55, root + degree(progression[i // 4] + 2, mode) + 12, beat * .6, "harp", .055)
        if role == "boss":
            for i in range(32):
                add(i * beat, drum("tom" if i % 4 in [0, 2] else "frame", rng), .075)
    else:
        for i in range(64):
            bar = i // 8
            chord = progression[bar]
            if i % 2 == 0:
                note(i * beat / 2, root - 12 + degree(chord + [0, 4, 0, 2][(i // 2) % 4], mode), beat * .38,
                     "cello" if role == "true" else cue["pluck"], .1)
            add(i * beat / 2, drum("shaker", rng), .17 if i % 2 else .24)
            if i % 8 in [0, 3, 6]: add(i * beat / 2, drum("tom", rng), .2)
            if i % 8 in [2, 6]: add(i * beat / 2, drum("frame", rng), .18)
            if role == "true" and i % 8 in [0, 4]:
                note(i * beat / 2, root + degree(chord, mode), beat * .9, "horn", .13)
    # Circular early reflections retain the full tail across the loop boundary.
    dry = mix.copy()
    for seconds, amount in [(.041, .075), (.073, .055), (.119, .04), (.193, .022), (.307, .012)]:
        mix += np.roll(dry, round(seconds * RATE)) * amount
    mix = sosfilt(butter(2, 45, btype="highpass", fs=RATE, output="sos"), np.tile(mix, 2))[len(mix):]
    # Periodic filtering warm-up avoids a startup transient on the loop seam.
    mix = sosfilt(butter(2, 11000, btype="lowpass", fs=RATE, output="sos"), np.tile(mix, 2))[len(mix):]
    rms = float(np.sqrt(np.mean(mix ** 2)))
    target = .10 if action else .13
    mix *= min(target / max(rms, 1e-9), .76 / max(np.max(np.abs(mix)), 1e-9))
    return mix, duration

def main():
    folder = ROOT / "assets/audio/music"
    folder.mkdir(parents=True, exist_ok=True)
    assets, metrics = {}, {}
    with tempfile.TemporaryDirectory(prefix="azeroth-score-") as temp:
        for index, (id, cue) in enumerate(BOOK["cues"].items()):
            signal, duration = render(cue, 48011 + index * 97)
            guard = round(.15 * RATE)
            extended = np.concatenate([signal[-guard:], signal, signal[:guard]])
            pcm = np.clip(np.round(extended * 32767), -32768, 32767).astype("<i2")
            source = Path(temp) / (id + ".wav")
            with wave.open(str(source), "wb") as wav:
                wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(RATE); wav.writeframes(pcm.tobytes())
            output = Path(temp) / (id + ".mp3")
            subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
                            "-codec:a", "libmp3lame", "-b:a", "96k", "-write_xing", "1", "-map_metadata", "-1", str(output)], check=True)
            # Decode the deliverable rather than trusting an intermediate master.
            raw = subprocess.check_output(["ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-i", str(output),
                                           "-f", "f32le", "-ac", "1", "-ar", str(RATE), "pipe:1"])
            decoded = np.frombuffer(raw, dtype="<f4")
            measured = len(decoded) / RATE
            peak = float(np.max(np.abs(decoded))); rms = float(np.sqrt(np.mean(decoded ** 2)))
            if not np.isfinite(decoded).all() or peak >= .98 or rms <= .005: raise ValueError("Invalid rendered score " + id)
            (folder / (id + ".mp3")).write_bytes(output.read_bytes())
            assets[id] = {"kind": "music", "src": "./assets/audio/music/" + id + ".mp3", "duration": measured,
                          "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
                          "loop": {"start": guard / RATE, "end": (guard + len(signal)) / RATE},
                          "credits": {"author": BOOK["author"], "license": BOOK["license"]},
                          "title": cue["title"], "bpm": cue["bpm"]}
            metrics[id] = {"peak": round(peak, 5), "rms": round(rms, 5), "seconds": measured,
                           "bytes": output.stat().st_size, "edge": round(float(abs(decoded[guard] - decoded[guard + len(signal) - 1])), 5)}
            print("Rendered", id, round(measured, 3), "sec", flush=True)
    (ROOT / "assets/audio/manifest.json").write_text(json.dumps({"schemaVersion": 1, "assets": assets}, indent=2) + "\n")
    (ROOT / "tools/audio/render-metrics.json").write_text(json.dumps(metrics, indent=2) + "\n")
    print("TOTAL", len(assets), "scores", round(sum(m["bytes"] for m in metrics.values()) / 1024 ** 2, 2), "MiB")

if __name__ == "__main__": main()
