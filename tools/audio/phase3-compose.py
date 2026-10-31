#!/usr/bin/env python3
"""Phase 3: eight authored PRIMARY scene themes, isolated from production.

Six new themes use score-owned phrases and per-bar instrumental figures.
Greenwood and the Archive reuse the corrected Phase 2 v2 base scores.
Phase 4 will author action/peace/night/settlement variants on these clocks.
This program does not modify the manifest, scorebook, game, or any MP3.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
THEMES = ROOT / "tools/audio/phase3-themes.json"
PILOTS = ROOT / "tools/audio/phase2-pilots-v2.json"
PHASE2 = ROOT / "tools/audio/phase2-composer.py"
ENSEMBLE = ROOT / "tools/audio/phase2-ensemble.py"
IDS = (
    "place-vale", "place-march", "place-highlands", "place-frontier",
    "place-crypt", "place-archive", "place-mine", "place-abyss",
)
PILOT_IDS = {"place-vale": "greenwood-outdoors",
             "place-archive": "archive-rescue"}
INSTRUMENTS = {"piano", "flute", "harp", "guitar", "dulcimer",
               "bell", "horn", "cello", "strings"}


def source_contract():
    # This check path uses ONLY the standard library and real Crown files.
    import importlib.util
    spec = importlib.util.spec_from_file_location("phase2_score_guard", PHASE2)
    original = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(original)
    _, catalog, freeze = original.check_contract()
    book = json.loads(THEMES.read_text(encoding="utf-8"))
    pilots = json.loads(PILOTS.read_text(encoding="utf-8"))
    families = {f["family"]: f for f in pilots["families"]}
    themes = book["themes"]
    assert book["schemaVersion"] == 3 and len(themes) == 8
    assert tuple(t["id"] for t in themes) == IDS
    assert len({t["id"] for t in themes}) == 8
    descriptions = []
    structural_signatures = set()
    for t in themes:
        cue = t["id"]
        assert cue in catalog["assets"] and cue not in freeze
        assert catalog["assets"][cue]["kind"] == "music"
        if "pilotFamily" in t:
            assert PILOT_IDS[cue] == t["pilotFamily"]
            source = families[t["pilotFamily"]]
            assert source["cues"][0] == {"id": cue, "part": "base"}
            descriptions.append((cue, source["bars"], source["bpm"], "v2-continuity"))
            continue
        assert len(t["identity"]) >= 100 and len(t["motifDecision"]) >= 90
        assert len(t["oldMotif"]) >= 10 and len(t["scenes"]) == 4
        assert 12 <= t["bars"] <= 20
        assert 65 <= t["bpm"] <= 120
        assert t["lead"] in INSTRUMENTS and t["mode"] in (
            "major", "minor", "dorian", "mixolydian")
        bars = t["bars"]
        for k in ("harmony", "phrases", "figures", "energy"):
            assert len(t[k]) == bars, (cue, k)
        assert len(set(t["figures"])) >= 4 and len(t["cells"]) >= 6
        assert max(t["energy"]) - min(t["energy"]) >= .5
        assert all(.25 <= e <= 1.3 for e in t["energy"])
        assert all(-2 <= h <= 7 and isinstance(h, int) for h in t["harmony"])
        for phrase in t["phrases"]:
            assert phrase in t["cells"], (cue, phrase)
        for figure in t["figures"]:
            assert figure in t["textures"], (cue, figure)
        distinct_rhythms = set()
        for name, cell in t["cells"].items():
            assert name
            for event in cell:
                assert len(event) == 3
                at, pitch, duration = event
                assert 0 <= at < 4 and -4 <= pitch <= 8 and 0 < duration <= 4
                distinct_rhythms.add((at, duration))
        assert len(distinct_rhythms) >= 9, cue + ": monotony risk"
        for figure, notes in t["textures"].items():
            assert 1 <= len(notes) <= 8, (cue, figure)
            for at, degree, duration, instrument, gain, reg in notes:
                assert 0 <= at < 4 and -4 <= degree <= 8
                assert .12 <= duration <= 3.6 and instrument in INSTRUMENTS
                assert 0 < gain < .11 and -24 <= reg <= 12
        for idx, notes in t.get("counterpoint", {}).items():
            assert 0 <= int(idx) < bars
            for at, degree, duration, instrument, gain in notes:
                assert 0 <= at < 4 and 0 < duration <= 2
                assert instrument in INSTRUMENTS and 0 < gain <= 1
        signature = (t["bars"], t["bpm"], t["mode"],
                     tuple(t["harmony"]), tuple(t["phrases"]),
                     tuple(t["figures"]))
        assert signature not in structural_signatures
        structural_signatures.add(signature)
        descriptions.append((cue, bars, t["bpm"], "new-authored"))
    assert len(structural_signatures) == 6
    return original, catalog, freeze, themes, families, descriptions


def render_new(t, renderer):
    """Render the exact written phrases/figures; no generative preset melody."""
    import numpy as np
    from scipy.signal import butter, sosfilt

    beat = 60.0 / t["bpm"]
    rate = renderer.RATE
    n = round(t["bars"] * 4 * beat * rate)
    mix = np.zeros(n, dtype=np.float64)
    seed = hashlib.sha256((t["id"] + ":phase3-master").encode()).digest()
    rng = np.random.default_rng(int.from_bytes(seed[:8], "little"))

    def add(bar, at, sound, strength):
        start = round((bar * 4 + at) * beat * rate) % n
        if len(sound) >= n:
            raise ValueError(t["id"] + ": one note is longer than the whole loop")
        sound = sound * strength * t["energy"][bar]
        first = min(len(sound), n - start)
        mix[start:start + first] += sound[:first]
        if len(sound) > first:
            mix[:len(sound) - first] += sound[first:]

    def play(bar, at, degree, duration, inst, gain, register=0):
        midi = t["root"] + renderer.degree(t["harmony"][bar] + degree, t["mode"]) + register
        wave = renderer.instrument(midi, duration * beat, inst, rng)
        # A soft bow/woodwind entrance prevents a flat note-every-beat attack
        # without changing the exact shared clock.
        if inst in ("cello", "strings", "horn", "flute"):
            fade = min(len(wave), round(.043 * rate))
            if fade: wave[:fade] *= np.linspace(.05, 1., fade)
        add(bar, at, wave, gain)

    for bar in range(t["bars"]):
        for at, pitch, length, instrument, gain, register in t["textures"][t["figures"][bar]]:
            play(bar, at, pitch, length, instrument, gain, register)
        phrase = t["cells"][t["phrases"][bar]]
        for idx, (at, degree, duration) in enumerate(phrase):
            # Phrase accents differ from the accompaniment's energy map.
            emphasis = 1.05 if idx == 0 else .88 if idx == len(phrase)-1 else .96
            play(bar, at, degree, duration, t["lead"], .114 * emphasis, 12)
        for at, degree, duration, instrument, gain in t.get("counterpoint", {}).get(str(bar), []):
            play(bar, at, degree, duration, instrument, .058 * gain, 0)

    # Circular early reflections + periodic filter settling make the seam a
    # compositional loop, rather than an arbitrary cut through a reverb tail.
    dry = mix.copy()
    for delay, gain in ((.049, .055), (.115, .03), (.247, .013)):
        mix += np.roll(dry, round(delay * rate)) * gain
    mix = sosfilt(butter(2, 45, btype="highpass", fs=rate, output="sos"),
                  np.tile(mix, 2))[n:]
    mix = sosfilt(butter(2, 10800, btype="lowpass", fs=rate, output="sos"),
                  np.tile(mix, 2))[n:]
    rms = float(np.sqrt(np.mean(mix ** 2)))
    peak = float(np.max(np.abs(mix)))
    if rms <= 1e-8 or not np.isfinite(mix).all():
        raise RuntimeError(t["id"] + ": silent or nonfinite output")
    mix *= min(.088 / rms, .69 / max(peak, 1e-8))
    return mix, rate


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--check", action="store_true", help="Source quality/Crown integrity only")
    p.add_argument("--render", type=Path, metavar="OUTSIDE_REPO_DIR",
                   help="Render and decode eight unregistered preview files")
    args = p.parse_args()
    if not args.check and args.render is None:
        p.error("Specify --check or --render")
    original, catalog, freeze, themes, pilots, descriptions = source_contract()
    print("PASS Phase 3 SOURCE CONTRACT ONLY: eight primary IDs, two v2 reuse, "
          "six authored-score structures; 83 music IDs and 18 physical Crown hashes")
    print("QUALITY HOLD: source musical craft REVISE; actual heard sound UNVERIFIED; "
          "Phase 4 blocked. See phase3-quality-review.json and #673.")
    if args.render is None:
        return
    out = args.render.expanduser().resolve()
    if out == ROOT or out.is_relative_to(ROOT):
        p.error("Output MUST remain outside repository; production audio is forbidden")
    encoder = original.find_ffmpeg()
    if encoder is None: p.error("ffmpeg/imageio-ffmpeg required")
    out.mkdir(parents=True, exist_ok=True)
    renderer = original.load_renderer()
    from importlib.util import spec_from_file_location, module_from_spec
    spec = spec_from_file_location("phase3_v2_ensemble", ENSEMBLE)
    ensemble = module_from_spec(spec)
    spec.loader.exec_module(ensemble)
    reports = []
    for theme in themes:
        if "pilotFamily" in theme:
            wave, rate = ensemble.render_stem(pilots[theme["pilotFamily"]], "base", renderer)
        else:
            wave, rate = render_new(theme, renderer)
        result = original.encode_stem(out, theme["id"], wave, rate, encoder)
        if result["loopEdgeDelta"] >= .2:
            raise RuntimeError(theme["id"] + ": unstable loop seam")
        reports.append(result)
        print("Rendered primary theme", theme["id"], result["seconds"], "seconds", flush=True)
    catalog_bytes = sum((ROOT / a["src"]).stat().st_size for a in catalog["assets"].values()
                        if a.get("src", "").startswith("./assets/audio/"))
    old_bytes = sum((ROOT / catalog["assets"][m["cue"]]["src"]).stat().st_size for m in reports)
    new_bytes = sum(m["encodedBytes"] for m in reports)
    projection = catalog_bytes - old_bytes + new_bytes
    report = {
        "schemaVersion": 3,
        "scope": "Phase 3 eight unregistered primary base themes only",
        "musicRegistered": 83, "crownFrozen": len(freeze),
        "authored": descriptions,
        "tracks": reports, "existingCatalogBytes": catalog_bytes,
        "replacementProjectionBytes": projection,
        "encodedCatalogLimitBytes": original.LIMIT_BYTES,
        "headroomAfterEightOnlyBytes": original.LIMIT_BYTES - projection,
        "limitations": "Not Phase 4 variants or Phase 7 integrated music QA. No real listening, "
                       "warning masking, audible timbre acceptance, in-game mixing or device verification."
    }
    (out / "phase3-metrics.json").write_text(json.dumps(report, indent=2) + "\n")
    original.check_contract()  # recheck every frozen Crown disk SHA after rendering
    if projection > original.LIMIT_BYTES:
        raise RuntimeError("Even eight-only encoded catalog projection breaches 32 MiB")
    print("PASS Phase 3 ENCODING ONLY: eight MP3s decoded and seams measured; "
          "Crown hashes intact. Musical-source/sonic acceptance is NOT implied.")
    print("PHASE3_INTERNAL_METRICS=" + json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
