#!/usr/bin/env python3
"""Phase 2 internal composition pilots. Never writes the live audio catalog.

Uses the original deterministic instrument/drum synthesis in render-score.py.
Four new arrangements, with paired additive or alternate stems, are staged
outside the repository for internal quality control only.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import wave
import sys

ROOT = Path(__file__).resolve().parents[2]
PILOTS = ROOT / "tools/audio/phase2-pilots.json"
FREEZE = ROOT / "tools/audio/phase2-crown-freeze.json"
MANIFEST = ROOT / "assets/audio/manifest.json"
LIMIT_BYTES = 32 * 1024 * 1024


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def check_contract():
    book = load_json(PILOTS)
    catalog = load_json(MANIFEST)
    freeze = load_json(FREEZE)["frozen"]
    music = {key for key, value in catalog["assets"].items() if value["kind"] == "music"}
    assert len(music) == 83, "Expected the original 83 stable music IDs"
    assert len(freeze) == 18 and set(freeze) <= music, "Frozen Crown set incomplete"
    allowed = music - set(freeze)
    assert len(allowed) == 65, "Expected exactly 65 in-scope IDs"
    # Compare both recorded hashes and source files, never only manifest labels.
    for cue_id, fields in freeze.items():
        live = catalog["assets"][cue_id]
        assert all(live.get(field) == value for field, value in fields.items()), (
            "Frozen Crown metadata drift: " + cue_id
        )
        disk = (ROOT / live["src"]).resolve()
        assert disk.is_file() and disk.is_relative_to(ROOT / "assets/audio"), cue_id
        assert hashlib.sha256(disk.read_bytes()).hexdigest() == fields["sha256"], (
            "Frozen Crown audio content drift: " + cue_id
        )
    families = book["families"]
    assert len(families) == 4, "Four contrasting pilot contexts required"
    assert {family["context"] for family in families} == {
        "outdoor", "main-dungeon", "inhabited-interior", "boss-true"
    }, "Pilot contexts must include all four narrative categories"
    assert len({family["style"] for family in families}) == 4
    pairs = []
    for family in families:
        bars = family["bars"]
        assert 8 <= bars <= 24 and len(family["harmony"]) == bars
        assert len(family["phrases"]) == bars
        assert len(family["cues"]) == 2
        for key in ["phrases", "peacePhrases"]:
            if key in family:
                assert len(family[key]) == bars
                assert all(name in family["cells"] for name in family[key])
        assert all(isinstance(chord, int) and -7 <= chord <= 14
                   for chord in family["harmony"])
        if "peaceHarmony" in family:
            assert len(family["peaceHarmony"]) == bars
        for name, cell in family["cells"].items():
            assert isinstance(cell, list) and name
            for item in cell:
                assert len(item) == 3, (family["family"], name)
                at, pitch, length = item
                assert 0 <= at < 4 and 0 < length <= 4.5 and -12 <= pitch <= 15
        ids = [cue["id"] for cue in family["cues"]]
        assert all(cue_id in allowed for cue_id in ids), "Pilot touches frozen or unknown ID"
        parts = [cue["part"] for cue in family["cues"]]
        assert parts in (["base", "action"], ["base", "peace"], ["base", "true"])
        for cue_id in ids:
            assert catalog["assets"][cue_id]["kind"] == "music"
        pairs.extend(ids)
    assert len(set(pairs)) == 8
    return book, catalog, freeze


def load_renderer():
    # Loading by filename does not put the renderer's sibling module on sys.path.
    # Restore the original import search path after the module is initialized.
    local_dir = str(ROOT / "tools/audio")
    sys.path.insert(0, local_dir)
    try:
        spec = importlib.util.spec_from_file_location(
            "original_score_renderer", ROOT / "tools/audio/render-score.py"
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        sys.path.remove(local_dir)


def render_family_stem(family, part, renderer):
    import numpy as np
    from scipy.signal import butter, sosfilt

    rate = renderer.RATE
    beat = 60 / family["bpm"]
    bars = family["bars"]
    n = round(bars * 4 * beat * rate)
    signal = np.zeros(n, dtype=np.float64)
    seed_bytes = hashlib.sha256((family["family"] + ":" + part).encode()).digest()
    rng = np.random.default_rng(int.from_bytes(seed_bytes[:8], "little"))
    root = family["root"]
    mode = family.get("peaceMode", family["mode"]) if part == "peace" else family["mode"]
    harmony = family.get("peaceHarmony", family["harmony"]) if part == "peace" else family["harmony"]
    lead = family.get("peaceLead", family["lead"]) if part == "peace" else family["lead"]
    style = family["style"]
    dynamics = .64 if part == "peace" else 1.0

    def place(time, sound, gain):
        start = round(time * rate) % n
        sound = sound * gain * dynamics
        if len(sound) >= n:
            raise ValueError("Event longer than a full musical loop")
        first = min(len(sound), n - start)
        signal[start:start + first] += sound[:first]
        if first < len(sound):
            signal[:len(sound) - first] += sound[first:]

    def note(bar, offset, scale_step, length, instrument, gain, register=0):
        midi = root + register + renderer.degree(scale_step, mode)
        place((4 * bar + offset) * beat,
              renderer.instrument(midi, length * beat, instrument, rng), gain)

    def hit(bar, offset, kind, gain):
        place((4 * bar + offset) * beat, renderer.drum(kind, rng), gain)

    for bar, chord in enumerate(harmony):
        if part in ("base", "peace"):
            if style == "pastoral":
                if bar % 2 == 0:
                    for voice in (0, 2):
                        note(bar, 0, chord + voice, 3.5, "strings", .054, -12)
                for at, step in ((0, 0), (1.5, 4), (2.5, 2)):
                    note(bar, at, chord + step, .7, "harp", .049)
                note(bar, 0, chord, 1.7, "cello", .074, -24)
                if bar % 3 == 2:
                    note(bar, 3, chord + 4, .9, "flute", .04, 0)
            elif style == "archive":
                for at, step in ((0, 0), (.75, 2), (2.5, 4), (3.25, 2)):
                    note(bar, at, chord + step, .36, "piano", .052, -12)
                note(bar, 0, chord, 3.6, "cello", .064, -24)
                if bar % 4 in (0, 3):
                    note(bar, .15, chord + 2, 2.4, "strings", .038, -12)
                if bar % 4 == 3:
                    note(bar, 3.1, chord + 7, .65, "bell", .05, 0)
            elif style == "domestic":
                for at, step in ((.5, 2), (1.5, 4), (2.5, 2), (3.5, 4)):
                    note(bar, at, chord + step, .46, "guitar", .055)
                note(bar, 0, chord, 1.2, "cello", .075, -24)
                note(bar, 2, chord + 4, .85, "dulcimer", .049, -12)
                if bar % 3 == 0:
                    note(bar, 0, chord + 2, 2.6, "strings", .036, -12)
            elif style == "craft":
                for at, step in ((0, 0), (1.5, 4), (2.5, 2)):
                    note(bar, at, chord + step, .8, "cello", .068, -12)
                if bar % 2 == 0:
                    for step in (0, 2):
                        note(bar, 0, chord + step, 3.5, "strings", .046, -12)
                if bar in (3, 7, 11, 15):
                    note(bar, 2.75, chord + 4, 1.4, "horn", .07)
            phrases = family.get("peacePhrases", family["phrases"]) if part == "peace" else family["phrases"]
            for at, step, duration in family["cells"][phrases[bar]]:
                note(bar, at, step, duration, lead,
                     (.13 if style in ("pastoral", "domestic") else .145), 12)
            # Counterpoint only at selected phrase-turns, never all-bar arpeggios.
            if style == "archive" and bar % 4 in (1, 2):
                note(bar, 1.7, chord + 2, 1.1, "flute", .054, 12)
            if style == "pastoral" and bar % 4 == 2:
                note(bar, 2.0, chord + 4, 1.2, "cello", .052, 0)
            if style == "domestic" and bar % 3 == 1:
                note(bar, 3.1, chord + 5, .75, "bell", .035, 0)
        elif part in ("action", "true"):
            # These are additive stems: no copy of the underlying melody.
            if style == "pastoral":
                for at in (.5, 1.5, 2.5, 3.5):
                    hit(bar, at, "shaker", .10)
                note(bar, 0, chord, .6, "harp", .075, -12)
                note(bar, 2.5, chord + 4, .65, "harp", .06, -12)
                if bar % 4 == 3:
                    hit(bar, 0, "frame", .12)
            elif style == "archive":
                for at, step in ((0, 0), (.75, 2), (2.0, 3), (3.25, 4)):
                    note(bar, at, chord + step, .28, "piano", .087, -12)
                for at in (0, 1.5, 3.25):
                    hit(bar, at, "frame", .12)
                if bar % 4 == 3:
                    hit(bar, 3, "tom", .13)
            elif style == "craft":
                for at, step in ((0, 0), (1.5, 2), (2.75, 4)):
                    note(bar, at, chord + step, .53, "cello", .095, -12)
                for at in (0, 2.5):
                    hit(bar, at, "frame", .12)
                if bar % 4 in (2, 3):
                    hit(bar, 3.0, "tom", .16)
                if bar in (6, 14):
                    # The former-party contour is subordinate to boss identity,
                    # and makes no claim about Dark Crown's future composition.
                    for at, step, duration in family["cells"]["companion"]:
                        note(bar, at, step, duration, "horn", .045, 0)
            else:
                raise ValueError("No additive profile for " + style)
        else:
            raise ValueError(part)

    dry = signal.copy()
    for delay, gain in ((.041, .065), (.109, .035), (.223, .016)):
        signal += np.roll(dry, round(delay * rate)) * gain
    signal = sosfilt(butter(2, 45, btype="highpass", fs=rate, output="sos"),
                    np.tile(signal, 2))[n:]
    signal = sosfilt(butter(2, 11000, btype="lowpass", fs=rate, output="sos"),
                    np.tile(signal, 2))[n:]
    rms = float(np.sqrt(np.mean(signal ** 2)))
    target = .068 if part in ("action", "true") else (.094 if part == "base" else .085)
    signal *= min(target / max(rms, 1e-9), .72 / max(float(np.max(np.abs(signal))), 1e-9))
    return signal, rate


def find_ffmpeg():
    executable = shutil.which("ffmpeg")
    if executable:
        return executable
    # CI runners need not have the system encoder. The fallback is an
    # explicit Python dependency with a self-contained ffmpeg binary.
    try:
        import imageio_ffmpeg
    except ImportError:
        return None
    executable = imageio_ffmpeg.get_ffmpeg_exe()
    return executable if Path(executable).is_file() else None


def encode_stem(out_dir, cue_id, signal, rate, ffmpeg, bitrate="96k"):
    if bitrate not in ("96k", "160k", "192k"):
        raise ValueError("Unexpected isolated audio bitrate")
    import numpy as np
    guard = round(.15 * rate)
    loop_samples = len(signal)
    extended = np.concatenate((signal[-guard:], signal, signal[:guard]))
    pcm = np.clip(np.rint(extended * 32767), -32768, 32767).astype("<i2")
    with tempfile.TemporaryDirectory(prefix="phase2-score-") as temporary:
        wav_path = Path(temporary) / "pilot.wav"
        with wave.open(str(wav_path), "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(rate)
            wav.writeframes(pcm.tobytes())
        target = out_dir / (cue_id + ".mp3")
        subprocess.run([ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error",
                        "-y", "-i", str(wav_path), "-codec:a", "libmp3lame",
                        "-b:a", bitrate, "-write_xing", "1", "-map_metadata", "-1",
                        str(target)], check=True)
    raw = subprocess.check_output([ffmpeg, "-nostdin", "-hide_banner", "-loglevel",
                                   "error", "-i", str(target), "-f", "f32le",
                                   "-ac", "1", "-ar", str(rate), "pipe:1"])
    decoded = np.frombuffer(raw, dtype="<f4")
    peak = float(np.max(np.abs(decoded)))
    rms = float(np.sqrt(np.mean(decoded ** 2)))
    if not np.isfinite(decoded).all() or peak >= .98 or rms <= .005:
        raise RuntimeError("Invalid decoded pilot: " + cue_id)
    if len(decoded) < guard + loop_samples:
        raise RuntimeError("Incomplete decoded MP3 loop: " + cue_id)
    return {"cue": cue_id, "seconds": round(loop_samples / rate, 6),
            "decodedSamples": int(len(decoded)),
            "expectedSamples": int(len(extended)),
            "loop": {"start": guard / rate, "end": (guard + loop_samples) / rate},
            "encodedBytes": target.stat().st_size,
            "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            "decodedPeak": round(peak, 5), "decodedRms": round(rms, 5),
            "loopEdgeDelta": round(float(abs(decoded[guard] -
                    decoded[guard + loop_samples - 1])), 5)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="Verify all 83 IDs, Crown files/hashes, and 4 pilot scores")
    parser.add_argument("--render", type=Path, metavar="OUTSIDE_REPO_DIR",
                        help="Render isolated MP3 previews for internal QA, not the live game")
    args = parser.parse_args()
    if not args.check and args.render is None:
        parser.error("Supply --check or --render")
    book, catalog, frozen = check_contract()
    print("PASS: 83 live IDs, 65 allowed, 18 Crown hashes verified, 4 pilot families")
    if args.render is None:
        return
    out = args.render.expanduser().resolve()
    if out == ROOT or out.is_relative_to(ROOT):
        parser.error("Pilot output must be OUTSIDE the repository, never live assets")
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        parser.error("ffmpeg or the imageio-ffmpeg fallback is required for pilot MP3 validation")
    out.mkdir(parents=True, exist_ok=True)
    renderer = load_renderer()
    metrics = []
    previews = {}
    overlays = []
    for family in book["families"]:
        for cue in family["cues"]:
            samples, rate = render_family_stem(family, cue["part"], renderer)
            previews[cue["id"]] = samples
            metrics.append(encode_stem(out, cue["id"], samples, rate, ffmpeg))
            print("Rendered internal pilot", cue["id"], metrics[-1]["seconds"], "seconds")
        base, second = [previews[cue["id"]] for cue in family["cues"]]
        if base.shape != second.shape:
            raise RuntimeError("Unsynchronized family: " + family["family"])
        import numpy as np
        overlay_gain = .55 if family["context"] == "boss-true" else (
            .5 if family["cues"][1]["part"] == "action" else 0)
        if overlay_gain:
            combined = .85 * base + overlay_gain * second
            combined_peak = float(np.max(np.abs(combined)))
            if combined_peak >= .98:
                raise RuntimeError("Potential pilot overlay clipping: " + family["family"])
            overlays.append({"family": family["family"],
                             "baseGain": .85, "secondGain": overlay_gain,
                             "peak": round(combined_peak, 5),
                             "rms": round(float(np.sqrt(np.mean(combined ** 2))), 5)})
        else:
            # The interior variant is a replacement peace mix, not an overlay.
            overlays.append({"family": family["family"], "mode": "alternate"})
    # Production routing never reads this standalone report.
    total_current = sum((ROOT / a["src"]).stat().st_size for a in catalog["assets"].values()
                        if a.get("src", "").startswith("./assets/audio/"))
    original_pilot = sum((ROOT / catalog["assets"][m["cue"]]["src"]).stat().st_size
                         for m in metrics)
    new_pilot = sum(m["encodedBytes"] for m in metrics)
    report = {"schemaVersion": 1, "scope": "unpublished internal Phase 2 pilot",
              "crownFrozen": len(frozen), "musicRegistered": 83,
              "pilotFamilies": 4, "pilotStems": metrics,
              "pilotPairOverlays": overlays,
              "encodedBudgetBytes": LIMIT_BYTES,
              "originalCatalogBytes": total_current,
              "pilotReplacementProjectionBytes": total_current - original_pilot + new_pilot,
              "headroomAfterPilotProjectionBytes":
                  LIMIT_BYTES - (total_current - original_pilot + new_pilot),
              "note": "Budget projection for eight pilots only, not approval to regenerate all 65."}
    (out / "pilot-metrics.json").write_text(json.dumps(report, indent=2) + "\n")
    check_contract()
    print("PASS: previews decoded, paired stem lengths and overlay peaks checked; "
          "all frozen Crown hashes remain original")
    if report["headroomAfterPilotProjectionBytes"] < 0:
        print("WARNING: 32 MiB catalog budget would be exceeded by replacing the eight pilots.")


if __name__ == "__main__":
    main()
