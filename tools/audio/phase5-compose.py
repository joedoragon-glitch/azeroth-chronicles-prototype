#!/usr/bin/env python3
"""Phase 5: 8 boss + 8 TRUE *isolated* recorded-source candidates.

TRUE is a separate, character-specific additive stem on the exact base clock.
No published assets, manifest, Crown recording or game runtime is modified.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCORE = ROOT / "tools/audio/phase5-scores.json"
PHASE3 = ROOT / "tools/audio/phase3-compose.py"
SAMPLER = ROOT / "tools/audio/phase3-sampler.py"
CONTROLS = ROOT / "tools/audio/score-quality-controls.py"
BUDGET = 256 * 1024 * 1024
MAX_FILE = 16 * 1024 * 1024
EIGHT = ("thorn", "crypt", "mire", "archive", "ridge", "mine", "warlord", "abyss")


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def note_events(family, part):
    bars = family["leadBars"] if part == "base" else family["trueBars"]
    return [
        [4 * bar + float(at), family["root"] + (
            family.get("leadRegisterByBar", [family["register"]] * family["bars"])[bar]
            if part == "base" else family.get("trueRegister", 12)
        ) + int(pitch), float(length)]
        for bar, notes in enumerate(bars) for at, pitch, length in notes
    ]



def verify_opening_harmony(family, original):
    """Original sounded legacy hook includes its changing chord frame, not only notes."""
    expected = ([0, 3, 5, 4] if original["flavor"] % 3 == 1
                else [0, 5, 3, 4])
    assert family["harmony"][:4] == expected, (
        family["id"] + ": legacy opening harmony drift")
    assert family["openingHarmonyHeritage"] == expected, (
        family["id"] + ": unsupported historical chord declaration")
    return expected


def verify_true_register(family):
    """Prevent note-by-note octave folding from corrupting TRUE phrase intervals."""
    notes = note_events(family, "true")
    pitches = [e[1] for e in notes]
    if family["response"] == "glockenspiel":
        assert 75 <= min(pitches) and max(pitches) <= 96, (
            family["id"] + ": TRUE chime requires stable written audible octave")
        bank = json.loads((ROOT / "tools/audio/phase3-sample-bank.json")
                          .read_text(encoding="utf-8"))
        recorded = [s["midi"] for s in
                    bank["instruments"]["glockenspiel"]["samples"]]
        assert recorded and all(min(abs(m - s) for s in recorded) <= 4
                                for m in pitches), (
            family["id"] + ": TRUE chime source pitch shift exceeds 4 semitones")
    if family["response"] == "cello":
        assert max(pitches) <= 71 and min(pitches) >= 36, (
            family["id"] + ": TRUE cello would silently octave-fold")
    return {"cue": family["trueId"], "range": [min(pitches), max(pitches)],
            "response": family["response"]}



TRUE_ANCHOR_MINIMA = {"thorn": 7, "crypt": 6, "mire": 5, "archive": 4,
                      "ridge": 11, "mine": 6, "warlord": 10, "abyss": 11}
MODE_SCALE = {"minor": (0, 2, 3, 5, 7, 8, 10),
              "dorian": (0, 2, 3, 5, 7, 9, 10)}


def verify_true_chord_anchors(family):
    """Review hand-authored strong beats against actual accompaniment triads.

    Intentionally suspended/offbeat notes are allowed elsewhere. The source
    selects explicit arrival bars; this does not blindly snap every note.
    """
    scale = MODE_SCALE[family["mode"]]
    bars = family["trueChordAnchors"]
    assert len(bars) >= TRUE_ANCHOR_MINIMA[family["key"]], (
        family["id"] + ": insufficient reviewed TRUE harmonic anchors")
    assert bars == sorted(set(bars))
    assert {int(k) for k in family["trueHarmonicAdaptations"]} == set(bars)
    for number in bars:
        chord = family["harmony"][number - 1]
        pcs = {(scale[(chord + voice) % 7] +
                12 * ((chord + voice) // 7)) % 12 for voice in (0, 2, 4)}
        accented = [note for note in family["trueBars"][number - 1]
                    if note[0] <= .4]
        assert accented and all((note[1] % 12) in pcs
                                for note in accented), (
            family["id"] + ": TRUE accented chord anchor drift bar " +
            str(number))
    return len(bars)



def source_contract():
    p3 = module("phase5_phase3", PHASE3)
    original, catalog, frozen, _, pilots, _ = p3.source_contract()
    data = json.loads(SCORE.read_text(encoding="utf-8"))
    ctl = module("phase5_controls", CONTROLS)
    assert data["schemaVersion"] == 1
    assert data["scope"] == dict(musicIds=83, crownFrozen=18,
        phase3Bases=8, phase4Arrangements=38, phase5BossAndTrue=16, phase6Story=3)
    expected = [
        x for family in EIGHT for x in ("boss-" + family, "boss-" + family + "-true")
    ]
    assert [x["id"] for x in data["cues"]] == expected
    assert len(data["families"]) == 8
    assert set(expected).isdisjoint(frozen)
    assert all(key in catalog["assets"] for key in expected)
    book = json.loads((ROOT / "tools/audio/score-book.json").read_text())
    contexts, inheritance, copies = [], [], []
    for key, family in zip(EIGHT, data["families"]):
        cue = "boss-" + key
        reference = book["cues"][cue]
        assert family["id"] == cue and family["trueId"] == cue + "-true"
        assert (family["root"], family["mode"], family["bpm"]) == (
            reference["root"], reference["mode"], reference["bpm"])
        assert family["originalHook"] == reference["melody"]
        verify_opening_harmony(family, reference)
        assert all(len(str(family["harmonicReview"][k])) >= 70
                   for k in ("tension", "cadence", "registerAndTrue"))
        assert family["harmony"][-1] == 0
        assert family["leadBars"][-1][-1][1] == 0, (
            cue + ": no returning tonic in completed boss base")
        verify_true_register(family)
        verify_true_chord_anchors(family)
        assert len(family["identity"]) >= 65 and len(family["truePsychology"]) >= 80
        assert len(family["harmony"]) == family["bars"] == len(family["energy"])
        assert len(family["leadBars"]) == len(family["trueBars"]) == family["bars"]
        assert len(family["pulsePatterns"]) == 2
        assert len(family["room"]) == 3
        assert 12 <= family["bars"] <= 20
        assert all(0.25 <= e <= 1.2 for e in family["energy"])
        assert max(family["energy"]) - min(family["energy"]) >= .4
        offsets = family.get("leadRegisterByBar",
                             [family["register"]] * family["bars"])
        assert len(offsets) == family["bars"] and offsets[:4] == [
            family["register"]] * 4
        assert set(offsets) <= {0, 12}
        assert family.get("trueRegister", 12) in (0, 12, 24, 36)
        assert family.get("companionRegister", 12) in (0, 12)
        assert family.get("pulseRegister", 0) in (-12, 0)
        assert family.get("bassRegister", -12) in (-12, -7, -5)
        for part in ("leadBars", "trueBars"):
            for bar, notes in enumerate(family[part]):
                assert len(notes) > 0, (cue, part, bar)
                for at, pitch, length in notes:
                    assert 0 <= at < 4 and -4 <= pitch <= 11 and .2 <= length <= 2.5
        for pulse in family["pulsePatterns"]:
            assert 1 <= len(pulse) <= 4
            assert all(0 <= e[0] < 4 and 0 < e[2] < 1.5 for e in pulse)
        assert family["companionBars"] == (
            [6, 13] if key == "crypt" else
            [10] if key == "archive" else
            [8, 16] if key == "mine" else
            [11] if key == "abyss" else [])
        original_notes = [
            [float(i), family["root"] + 12 + n,
             1.55 if reference["melody"][(i + 1) % 16] is None else .84]
            for i, n in enumerate(reference["melody"]) if n is not None
        ]
        current_opening = [
            [b, m, duration] for b, m, duration in note_events(family, "base") if b < 16
        ]
        status = ctl.verify_heritage(original_notes, current_opening, cue=cue,
            disposition=family["motifDisposition"],
            reason=family["motifRationale"])
        if key == "crypt":
            assert family["title"] == "Keeper of the Winter Works"
            assert family["motifDisposition"] == "transformed"
            assert len(original_notes) == len(current_opening)
            assert all(a[0] == b[0] and a[1] - b[1] == 12 and a[2] == b[2]
                       for a, b in zip(original_notes, current_opening))
            # The Phase 2 pilot is a study, not a grandfathered 16-bar master.
            pilot = next(p for p in pilots.values()
                         if p["family"] == "lifebinder-winter-works")
            assert pilot["bars"] == 16
            assert family["leadBars"][4] != [
                list(x) for x in pilot["cells"][pilot["phrases"][4]]
            ]
        else:
            assert status["exact"] and family["motifDisposition"] == "retained"
        inheritance.append(status)
        base_events = note_events(family, "base")
        true_events = note_events(family, "true")
        # A TRUE layer is NOT the entire base theme again under new instrumentation.
        copies.append(ctl.guard_unexplained_full_layer_copy(
            base_events, true_events, cue=cue + "-true"))
        assert len({tuple(x[:2]) for x in base_events}) >= 12
        contexts.append({"id": cue, "performedRhythm": [
            [round(n[0], 3), round(n[2], 3)] for n in base_events],
            "form": family["identity"], "energy": family["energy"],
            "harmony": family["harmony"]})
    assert ctl.guard_not_cloned_contexts(contexts) == 8
    assert all(not c["completeCopy"] for c in copies)
    assert data["formerCompanions"]["motif"] == [
        [.25, 0, .58], [1.32, 2, .46], [2.48, -1, .74]]
    assert set(frozen) == {key for key, item in catalog["assets"].items()
                          if item.get("kind") == "music" and
                          key in frozen}
    return original, catalog, frozen, data, inheritance, copies, ctl


def render_part(family, part, shared, sampler, played_notes=None):
    import numpy as np
    from scipy.signal import butter, sosfilt

    base = part == "base"
    bpm, bars, rate = family["bpm"], family["bars"], sampler.RATE
    beat = 60.0 / bpm
    frames = round(4 * bars * beat * rate)
    wave = np.zeros((frames, 2), dtype=np.float64)
    rng = np.random.default_rng(int.from_bytes(hashlib.sha256(
        (family["id"] + ":" + part + ":phase5").encode()).digest()[:8], "little"))
    room = family["room"]
    root, mode = family["root"], family["mode"]

    def place(bar, at, pcm, amount, pan, jitter=False):
        shift = float(rng.uniform(-.004, .004)) if jitter else 0
        start = round((4 * bar + at + shift) * beat * rate) % frames
        if len(pcm) >= frames:
            raise ValueError(family["id"] + ": note longer than loop")
        vol = pcm * amount * family["energy"][bar]
        pan = float(np.clip(pan, -.62, .62))
        stereo = np.stack((
            vol * np.sqrt((1-pan)/2), vol * np.sqrt((1+pan)/2)), axis=1)
        n = min(len(stereo), frames - start)
        wave[start:start+n] += stereo[:n]
        if n < len(stereo):
            wave[:len(stereo)-n] += stereo[n:]

    def tone(bar, at, midi, length, inst, amount, soft=False, jitter=False,
             performed_role=None):
        midi = int(midi)
        written_midi = midi
        # A score-level octave choice, not a silent renderer substitution.
        if inst == "cello" and midi > 71:
            midi -= 12
        elif inst == "guitar" and midi > 64:
            midi -= 12
        elif inst == "flute" and midi < 60:
            midi += 12
        if inst == "glockenspiel" and midi < 75:
            raise ValueError(family["id"] + ": unscored chime octave folding")
        if performed_role is not None:
            if midi != written_midi:
                raise ValueError(family["id"] +
                                 ": performed lead/TRUE silently changed octaves")
            if played_notes is not None:
                # Observed at the instrument boundary AFTER final octave
                # decisions, not inferred from the JSON score.
                played_notes.append([4 * bar + float(at), int(midi),
                                     float(length)])
        pcm = sampler.instrument(midi, length * beat, inst, rng)
        if soft:
            k = min(round(.048 * rate), len(pcm))
            if k:
                pcm[:k] *= np.linspace(.1, 1.0, k)
        place(bar, at, pcm, amount, sampler.pan(inst, midi) *
              (.76 if family["key"] == "warlord" else .95), jitter)

    for bar in range(bars):
        chord = family["harmony"][bar]
        if base:
            if bar % 4 != 3:
                low = root + family.get("bassRegister", -12) + sampler.degree(chord, mode)
                tone(bar, 0, low, 2.1, "cello", .047, soft=True)
            pattern = family["pulsePatterns"][(bar // 2 + bar % 3) % 2]
            if bar % 4 == 3:
                pattern = pattern[:1]
            for at, degree, duration in pattern:
                midi = (root + family.get("pulseRegister", 0) +
                        sampler.degree(chord + degree, mode))
                tone(bar, at, midi, duration, family["pulse"], .033,
                     jitter=True)
            if bar % 4 in (0, 2):
                midi = root + sampler.degree(chord + 2, mode)
                tone(bar, .08, midi, 2.8, "strings", .015, soft=True)
            for at, semitone, duration in family["leadBars"][bar]:
                register = family.get("leadRegisterByBar",
                    [family["register"]] * bars)[bar]
                tone(bar, at, root + register + semitone,
                     duration, family["lead"], .105, soft=family["lead"]
                     in ("horn", "cello"), performed_role="base")
        else:
            # Each family supplies an independent written secondary gesture,
            # not the old parent lead played twice.
            for at, semitone, duration in family["trueBars"][bar]:
                tone(bar, at, root + family.get("trueRegister", 12) + semitone,
                     duration, family["response"], .051, soft=True,
                     performed_role="true")
            if bar % 4 == 2:
                tone(bar, .4, root + family.get("bassRegister", -12) +
                     sampler.degree(chord, mode),
                     1.0, "cello", .017, soft=True)
            if family["companionBars"] and bar in family["companionBars"]:
                for at, semitone, duration in shared["motif"]:
                    tone(bar, at, root + family.get("companionRegister", 12) + semitone,
                         duration, "horn", .012, soft=True)
            # Deliberately sparse character-dependent accents, not a
            # universal loud TRUE drum beat.
            if family["key"] in ("thorn", "mire", "warlord") and bar % 4 == 1:
                pos = 2.7 if family["key"] == "mire" else .35
                place(bar, pos, sampler.drum("frame", rng), .018, -.18, True)
            elif family["key"] in ("ridge", "mine") and bar % 4 == 2:
                place(bar, .2, sampler.drum("tom", rng), .015, -.1, True)
            elif family["key"] == "abyss" and bar in (4, 9, 13):
                tone(bar, 3.05, root + 7, .48, "harp", .017, soft=True)
            elif family["key"] == "crypt" and bar in (4, 11):
                # Moral hesitation: a genuinely empty first half of the bar.
                pass

    dry = wave.copy()
    for delay, gain in room:
        wave += np.roll(dry, round(delay * rate), axis=0) * gain
    wave[:, 0] += np.roll(dry[:, 1], round(.119 * rate)) * .014
    wave[:, 1] += np.roll(dry[:, 0], round(.139 * rate)) * .017
    for cutoff, kind in ((45, "highpass"), (family["lowpassHz"], "lowpass")):
        sos = butter(2, cutoff, btype=kind, fs=rate, output="sos")
        wave = sosfilt(sos, np.concatenate((wave, wave), axis=0), axis=0)[frames:]
    # Decoded MP3 seam quality must pass, not merely a zero-valued raw end.
    taper_frames = max(8, round(.045 * rate))
    ramp = np.sin(np.linspace(0, np.pi / 2, taper_frames)) ** 2
    wave[:taper_frames] *= ramp[:, None]
    wave[-taper_frames:] *= ramp[::-1, None]
    rms = float(np.sqrt(np.mean(wave * wave)))
    peak = float(np.max(np.abs(wave)))
    if rms <= 1e-9 or not np.isfinite(wave).all():
        raise RuntimeError(family["id"] + ": silent/nonfinite output")
    target, cap = (.075, .54) if base else (.026, .23)
    wave *= min(target / rms, cap / peak)
    return wave, rate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--render", type=Path, metavar="OUTSIDE_REPO_DIR")
    args = parser.parse_args()
    if not args.check and args.render is None:
        parser.error("Provide --check or --render")
    original, catalog, frozen, data, inheritance, copies, ctl = source_contract()
    print("PASS Phase 5 source: eight character-distinct base/TRUE pairs; " +
          "83 registered original IDs, 18 frozen Crown files.")
    print("Motif opening comparisons:", inheritance)
    print("Additive anti-copy comparisons:", copies)
    if args.render is None:
        return
    out = args.render.expanduser().resolve()
    if out == ROOT or out.is_relative_to(ROOT):
        parser.error("All preview recordings MUST remain outside the repository")
    encoder = original.find_ffmpeg()
    if not encoder:
        parser.error("FFmpeg/imageio-ffmpeg missing")
    out.mkdir(parents=True, exist_ok=True)
    recorded = module("phase5_sampler", SAMPLER)
    sampler = recorded.RecordedSampler(original.load_renderer(), encoder)
    reports, overlay = [], []
    for family in data["families"]:
        rendered = {}
        for part in ("base", "true"):
            cue = family["id"] if part == "base" else family["trueId"]
            sampler.cue = cue
            before = sampler.calls
            played_notes = []
            wave, rate = render_part(family, part, data["formerCompanions"],
                                     sampler, played_notes)
            # Independent source-versus-instrument-boundary comparison,
            # over the FULL form for each BASE and TRUE (not only opening).
            performed = ctl.verify_heritage(
                note_events(family, part), played_notes, cue=cue)
            assert performed["exact"]
            result = original.encode_stem(out, cue, wave, rate, encoder,
                                          bitrate="192k")
            result["part"] = part
            result["parent"] = family["id"]
            result["recordedInstrumentNotes"] = sampler.calls - before
            result["soundedLeadEvents"] = len(played_notes)
            result["soundedLeadSha256"] = hashlib.sha256(
                json.dumps(played_notes, separators=(",", ":")).encode()
            ).hexdigest()
            assert result["encodedBytes"] < MAX_FILE
            assert result["channels"] == 2 and result["decodedPeak"] < .98
            assert result["stereoSideRms"] > .0008
            assert result["foldedMonoPeak"] < .98
            assert result["loopEdgeDelta"] < .005, (cue, result["loopEdgeDelta"])
            assert result["recordedInstrumentNotes"] >= 10, cue
            reports.append(result)
            rendered[part] = wave
            print("Phase 5 encoded+decoded", cue, result["seconds"], flush=True)
        import numpy as np
        base, true = rendered["base"], rendered["true"]
        assert base.shape == true.shape, family["id"] + ": misaligned TRUE clock"
        mixed = base + true
        peak = float(np.max(np.abs(mixed)))
        rms = float(np.sqrt(np.mean(mixed * mixed)))
        assert 0 < peak < .98 and rms > .01
        overlay.append({"baseCue": family["id"], "actionCue": family["trueId"],
                        "frames": len(base), "combinedPeak": peak,
                        "combinedRms": rms})
    assets = catalog["assets"]
    prior = sum((ROOT / a["src"]).stat().st_size for a in assets.values()
                if a.get("src", "").startswith("./assets/audio/"))
    replaced = sum((ROOT / assets[m["cue"]]["src"]).stat().st_size for m in reports)
    projection = prior - replaced + sum(m["encodedBytes"] for m in reports)
    assert 0 < projection < BUDGET
    # Check the physical 18 protected Crown assets again after 16 renders.
    original.check_contract()
    metrics = {
        "schemaVersion": 1, "scope": "Phase 5 isolated 16 candidate recordings",
        "sampleRateHz": sampler.RATE, "bitrate": "192k-stereo-MP3",
        "musicRegistered": 83, "crownFrozen": len(frozen),
        "tracks": reports, "actionOverlayChecks": overlay,
        "recordedSourceProvenance": sampler.snapshot(),
        "performedOpeningHeritage": inheritance,
        "trueAntiCopyEvidence": copies,
        "currentCatalogBytes": prior,
        "candidateCatalogProjectionBytes": projection,
        "budgetCeilingBytes": BUDGET,
        "heardListeningStatus": "UNVERIFIED; no actual listening performed",
        "ownerAcceptance": "PHASE 9 ONLY",
        "integration": "UNREGISTERED / UNMERGED / UNPUBLISHED",
        "phase7Note": "Game masking, warnings, crossfades, cache and mobile not tested",
    }
    ctl.verify_decoded_report(metrics, expected_cues=set(x["id"] for x in data["cues"]),
                              layer_count=8)
    (out / "phase5-metrics.json").write_text(
        json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print("PASS 16 isolated MP3 encode/decodes and eight synchronized pair overlays")
    print("NOT evidence of sound-by-ear quality, game integration or acceptance.")


if __name__ == "__main__":
    main()
