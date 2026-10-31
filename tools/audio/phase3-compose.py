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
import copy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
THEMES = ROOT / "tools/audio/phase3-themes.json"
PILOTS = ROOT / "tools/audio/phase2-pilots-v2.json"
PHASE2 = ROOT / "tools/audio/phase2-composer.py"
ENSEMBLE = ROOT / "tools/audio/phase2-ensemble.py"
SAMPLER = ROOT / "tools/audio/phase3-sampler.py"
# Match the published dev.242 encoded budget without modifying older Phase 2 studies.
PACKAGE_LIMIT_BYTES = 256 * 1024 * 1024
PER_FILE_LIMIT_BYTES = 16 * 1024 * 1024
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
    acoustic_signatures = set()
    for t in themes:
        cue = t["id"]
        assert cue in catalog["assets"] and cue not in freeze
        assert catalog["assets"][cue]["kind"] == "music"
        if "pilotFamily" in t:
            assert PILOT_IDS[cue] == t["pilotFamily"]
            source = families[t["pilotFamily"]]
            assert source["cues"][0] == {"id": cue, "part": "base"}
            assert set(t.get("pilotLeadOverrides", {})) == {"0", "1"}, cue
            for bar in ("0", "1"):
                for item in t["pilotLeadOverrides"][bar]:
                    assert len(item) in (3, 4) and 0 <= item[0] < 4
                    assert isinstance(item[1], int) and -8 <= item[1] <= 10
                    assert 0 < item[2] <= 4
                    assert len(item) == 3 or (isinstance(item[3], int) and -2 <= item[3] <= 2)
            descriptions.append((cue, source["bars"], source["bpm"], "Phase3 heritage opening / v2 body"))
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
                assert len(event) in (3, 4), (cue, name, event)
                at, pitch, duration = event[:3]
                alteration = event[3] if len(event) == 4 else 0
                assert isinstance(alteration, int) and -2 <= alteration <= 2
                assert 0 <= at < 4 and -7 <= pitch <= 8 and 0 < duration <= 4
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
        expression = t.get("expression")
        assert expression, cue + ": authored expressive performance missing"
        assert .72 <= expression["leadGate"] <= 1.0, cue
        assert 5 <= expression["leadAttackMs"] <= 140, cue
        assert 0 <= expression["textureJitterMs"] <= 12, cue
        profile = t.get("production")
        assert profile and len(profile["space"]) >= 35, cue
        assert len(profile["earlyReflections"]) == 3, cue
        assert all(.02 <= delay <= .6 and 0 < gain < .12
                   for delay, gain in profile["earlyReflections"]), cue
        assert 30 <= profile["highpassHz"] <= 80
        assert 6500 <= profile["lowpassHz"] < 18000
        assert .07 <= profile["targetRms"] <= .11
        assert .7 <= profile["stageWidth"] <= 1.2
        assert 0 < profile["crossfeed"] <= .04
        acoustic_signature = tuple(tuple(a) for a in profile["earlyReflections"])
        assert acoustic_signature not in acoustic_signatures, cue
        acoustic_signatures.add(acoustic_signature)
        signature = (t["bars"], t["bpm"], t["mode"],
                     tuple(t["harmony"]), tuple(t["phrases"]),
                     tuple(t["figures"]))
        assert signature not in structural_signatures
        structural_signatures.add(signature)
        descriptions.append((cue, bars, t["bpm"], "new-authored"))
    assert len(structural_signatures) == 6 and len(acoustic_signatures) == 6
    return original, catalog, freeze, themes, families, descriptions


def render_new(t, renderer):
    """Render the exact written phrases/figures; no generative preset melody."""
    import numpy as np
    from scipy.signal import butter, sosfilt

    beat = 60.0 / t["bpm"]
    rate = renderer.RATE
    n = round(t["bars"] * 4 * beat * rate)
    stereo = bool(getattr(renderer, "STEREO", False))
    mix = np.zeros((n,2) if stereo else n, dtype=np.float64)
    seed = hashlib.sha256((t["id"] + ":phase3-master").encode()).digest()
    rng = np.random.default_rng(int.from_bytes(seed[:8], "little"))
    production = t["production"]
    expression = t["expression"]

    def add(bar, at, sound, strength, pan=0, jitter_ms=0):
        # Only accompaniment receives hand-played microtiming. Lead onset and
        # bar clock remain exact, including every protected heritage opening.
        delta = round(rng.uniform(-jitter_ms, jitter_ms) * rate / 1000) if jitter_ms else 0
        start = (round((bar * 4 + at) * beat * rate) + delta) % n
        if len(sound) >= n:
            raise ValueError(t["id"] + ": one note is longer than the whole loop")
        sound = sound * strength * t["energy"][bar]
        if stereo:
            pan = float(np.clip(pan, -.7, .7))
            sound = np.stack((sound * np.sqrt((1-pan)/2),
                              sound * np.sqrt((1+pan)/2)),axis=1)
        first = min(len(sound), n - start)
        mix[start:start + first] += sound[:first]
        if len(sound) > first:
            mix[:len(sound) - first] += sound[first:]

    def play(bar, at, degree, duration, inst, gain, register=0,
             chromatic=0, role="texture"):
        midi = (t["root"] + renderer.degree(t["harmony"][bar] + degree, t["mode"])
                + register + chromatic)
        # First two bars retain their original note durations, not just their
        # pitches/onsets. Later phrases have deliberately varied breath/gates.
        gate = expression["leadGate"] if role == "lead" and bar >= 2 else 1.0
        wave = renderer.instrument(midi, duration * gate * beat, inst, rng)
        if inst in ("cello", "strings", "horn", "flute") or role == "lead":
            attack_ms = expression["leadAttackMs"] if role == "lead" else 43
            fade = min(len(wave), round(attack_ms * rate / 1000))
            if fade: wave[:fade] *= np.linspace(.05, 1., fade)
        add(bar, at, wave, gain,
            renderer.pan(inst, midi) * production["stageWidth"] if stereo else 0,
            expression["textureJitterMs"] if role == "texture" else 0)

    for bar in range(t["bars"]):
        for at, pitch, length, instrument, gain, register in t["textures"][t["figures"][bar]]:
            play(bar, at, pitch, length, instrument, gain, register)
        phrase = t["cells"][t["phrases"][bar]]
        for idx, event in enumerate(phrase):
            at, degree, duration = event[:3]
            accidental = event[3] if len(event) == 4 else 0
            # A small intentional chromatic alteration preserves particular old
            # hooks (e.g. March F# to F, Frontier C# to C) under the mode.
            emphasis = 1.05 if idx == 0 else .88 if idx == len(phrase)-1 else .96
            # Horn/cello register is actually playable (and sampleable),
            # not an oscillator pretending that brass/cello reaches D6.
            lead_register = 0 if t["lead"] in ("horn", "cello") else 12
            play(bar, at, degree, duration, t["lead"], .114 * emphasis,
                 lead_register, chromatic=accidental, role="lead")
        for at, degree, duration, instrument, gain in t.get("counterpoint", {}).get(str(bar), []):
            play(bar, at, degree, duration, instrument, .058 * gain, 0,
                 role="counterpoint")

    # Circular early reflections + periodic filter settling make the seam a
    # compositional loop, rather than an arbitrary cut through a reverb tail.
    dry = mix.copy()
    for delay, gain in production["earlyReflections"]:
        mix += np.roll(dry, round(delay * rate), axis=0) * gain
    if stereo:
        mix[:,0] += np.roll(dry[:,1],round(.121*rate)) * production["crossfeed"]
        mix[:,1] += np.roll(dry[:,0],round(.157*rate)) * production["crossfeed"]
    mix = sosfilt(butter(2, production["highpassHz"], btype="highpass",
                            fs=rate, output="sos"),
                  np.concatenate((mix,mix),axis=0),axis=0)[n:]
    mix = sosfilt(butter(2, production["lowpassHz"], btype="lowpass",
                            fs=rate, output="sos"),
                  np.concatenate((mix,mix),axis=0),axis=0)[n:]
    rms = float(np.sqrt(np.mean(mix ** 2)))
    peak = float(np.max(np.abs(mix)))
    if rms <= 1e-8 or not np.isfinite(mix).all():
        raise RuntimeError(t["id"] + ": silent or nonfinite output")
    mix *= min(production["targetRms"] / rms, .69 / max(peak, 1e-8))
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
    original_renderer = original.load_renderer()
    from importlib.util import spec_from_file_location, module_from_spec
    sampler_spec = spec_from_file_location("phase3_recorded_instruments", SAMPLER)
    sampler_module = module_from_spec(sampler_spec)
    sampler_spec.loader.exec_module(sampler_module)
    renderer = sampler_module.RecordedSampler(original_renderer, encoder)
    spec = spec_from_file_location("phase3_v2_ensemble", ENSEMBLE)
    ensemble = module_from_spec(spec)
    spec.loader.exec_module(ensemble)
    reports = []
    for theme in themes:
        renderer.cue = theme["id"]
        before_calls = renderer.calls
        if "pilotFamily" in theme:
            family = copy.deepcopy(pilots[theme["pilotFamily"]])
            family["performance"]["leadOverrides"].update(theme["pilotLeadOverrides"])
            wave, rate = ensemble.render_stem(family, "base", renderer)
        else:
            wave, rate = render_new(theme, renderer)
        result = original.encode_stem(out, theme["id"], wave, rate, encoder,
                                      bitrate="192k")
        if result["encodedBytes"] > PER_FILE_LIMIT_BYTES:
            raise RuntimeError(theme["id"] + ": exceeds 16 MiB per-file budget")
        if result["loopEdgeDelta"] >= .2:
            raise RuntimeError(theme["id"] + ": unstable loop seam")
        result["recordedInstrumentNotes"] = renderer.calls - before_calls
        if result["recordedInstrumentNotes"] < 12:
            raise RuntimeError(theme["id"] + ": expected real recorded instrumentation")
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
        "tracks": reports, "sampleRateHz": renderer.RATE,
        "encodedBitrate": "192k-stereo-MP3",
        "outputChannels": 2,
        "instrumentEngine": "verified-CC0-samples-with-explicit-drums",
        "samplerEvidence": renderer.snapshot(),
        "existingCatalogBytes": catalog_bytes,
        "replacementProjectionBytes": projection,
        "encodedCatalogLimitBytes": PACKAGE_LIMIT_BYTES,
        "headroomAfterEightOnlyBytes": PACKAGE_LIMIT_BYTES - projection,
        "limitations": "Real CC0 sources are technically pinned, not perceptually reviewed; marimba-for-dulcimer and glockenspiel-for-bell remain provisional. Not Phase 4 variants or integrated music QA. No actual hearing, "
                       "warning masking, audible timbre acceptance, in-game mixing or device verification."
    }
    (out / "phase3-metrics.json").write_text(json.dumps(report, indent=2) + "\n")
    original.check_contract()  # recheck every frozen Crown disk SHA after rendering
    if projection > PACKAGE_LIMIT_BYTES:
        raise RuntimeError("Eight-only projection breaches the published 256 MiB budget")
    print("PASS Phase 3 ENCODING ONLY: eight MP3s decoded and seams measured; "
          "Crown hashes intact. Musical-source/sonic acceptance is NOT implied.")
    print("PHASE3_INTERNAL_METRICS=" + json.dumps(report), flush=True)


if __name__ == "__main__":
    main()
