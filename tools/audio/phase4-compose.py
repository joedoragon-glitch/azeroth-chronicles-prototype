#!/usr/bin/env python3
"""Phase 4: recorded-source scene arrangements. DRAFT and OUTSIDE production.

The approved in-scope math is 8 Phase 3 bases + 38 Phase 4 arrangements
+ 16 later boss parts + 3 story cues = 65. The earlier '42' was erroneous.
No manifest writes, game registration, Crown changes or Phase 9 listening.
"""
import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCORE = ROOT / "tools/audio/phase4-arrangements.json"
PHASE3 = ROOT / "tools/audio/phase3-compose.py"
SAMPLER = ROOT / "tools/audio/phase3-sampler.py"
ENSEMBLE = ROOT / "tools/audio/phase2-ensemble.py"
BUDGET = 256 * 1024 * 1024
MAX_FILE = 16 * 1024 * 1024
OUTDOORS = ("vale", "march", "highlands", "frontier")
DUNGEONS = ("crypt", "archive", "mine", "abyss")
INTERIORS = ("supply-vale", "supply-march", "supply-highlands",
             "side-vale-cellars", "side-march-watchhouse",
             "side-highlands-signal", "side-frontier-shrine")
REGISTERS = {"flute": 12, "horn": 0, "cello": 0, "strings": 12,
             "harp": 0, "piano": 12, "marimba": -12,
             "glockenspiel": 24, "guitar": -12}
ALLOWED_KINDS = {"action", "peace", "night", "settlement",
                 "interior", "interior-peace"}


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def score_contract():
    phase3 = load_module("sibdlp_phase3", PHASE3)
    original, catalog, freeze, bases, pilots, _ = phase3.source_contract()
    data = json.loads(SCORE.read_text(encoding="utf-8"))
    assert data["schemaVersion"] == 1
    assert data["peaceActivation"].startswith("global ending PLUS throne")
    assert data["scope"] == dict(musicIds=83, inScope=65, crownProtected=18,
                                  phase3Bases=8, phase4Arrangements=38,
                                  phase5Bosses=16, phase6Narrative=3)
    arrangements = data["arrangements"]
    assert len(arrangements) == 38
    names = [c["id"] for c in arrangements]
    assert len(set(names)) == 38
    by_id = {t["id"]: t for t in bases}
    music = {k for k, v in catalog["assets"].items() if v["kind"] == "music"}
    allowed = music - set(freeze)
    assert len(allowed) == 65
    assert set(names).isdisjoint(by_id) and set(names).isdisjoint(freeze)
    expected = {
        *("action-" + v for v in OUTDOORS + DUNGEONS),
        *("peace-" + v for v in OUTDOORS + DUNGEONS),
        *("night-" + v for v in OUTDOORS),
        *("settlement-" + v for v in OUTDOORS),
        *("interior-" + v for v in INTERIORS),
        *("peace-interior-" + v for v in INTERIORS),
    }
    assert set(names) == expected, "No missing IDs, Crown scope or invented fourth pair"
    assert set(names) <= allowed
    assert len(set(by_id) | set(names)) == 46
    assert len(allowed - set(by_id) - set(names)) == 19, "Exactly 16 bosses and 3 narrative cues remain"
    assert set(data["interiors"]) == set(INTERIORS)
    for name, room in data["interiors"].items():
        assert 11 <= len(room["harmony"]) <= 16 and len(room["scene"]) >= 24
        assert room["mode"] in ("major", "minor", "dorian", "mixolydian")
        for motif in ("motif", "reply", "question"):
            assert isinstance(room[motif], str) and len(room[motif]) >= 12
    signatures = set()
    for cue in arrangements:
        assert cue["kind"] in ALLOWED_KINDS and cue["id"] in expected
        assert len(cue["sceneIntent"]) >= 48, cue["id"]
        assert cue["lead"] in REGISTERS and cue["response"] in REGISTERS
        assert cue["pulse"] in REGISTERS
        assert len(cue["form"]) == cue["bars"]
        assert set(cue["form"]) <= set("HAQR") and "H" in cue["form"]
        assert "A" in cue["form"] and "R" in cue["form"]
        assert len(cue["arc"]) == 4 and all(.3 <= a <= 1.25 for a in cue["arc"])
        assert cue["parent"] in by_id or cue["parent"] in data["interiors"]
        if cue["parent"] in by_id:
            base = by_id[cue["parent"]]
            if "pilotFamily" in base:
                pilot = pilots[base["pilotFamily"]]
                bars, bpm = pilot["bars"], pilot["bpm"]
            else:
                bars, bpm = base["bars"], base["bpm"]
            assert cue["bars"] == bars and cue["bpm"] == bpm, cue["id"]
            assert cue["kind"] not in ("interior", "interior-peace")
        else:
            room = data["interiors"][cue["parent"]]
            assert cue["bars"] == len(room["harmony"])
            assert cue["bpm"] == room["bpm"]
            assert cue["kind"] in ("interior", "interior-peace")
        for cell in ("answer", "question"):
            assert len(cue[cell]) >= 2
            for evt in cue[cell]:
                assert len(evt) == 3
                at, degree, duration = evt
                assert 0 <= at < 4 and -3 <= degree <= 7 and .2 <= duration <= 2
        signature = (cue["id"], cue["lead"], cue["pulse"], cue["form"],
                     str(cue["answer"]))
        assert signature not in signatures
        signatures.add(signature)
    for name in INTERIORS:
        room = data["interiors"][name]
        pair = [c for c in arrangements if c["parent"] == name]
        assert {c["kind"] for c in pair} == {"interior", "interior-peace"}
        assert len(set((c["bars"], c["bpm"]) for c in pair)) == 1
    # The pilot action and cellar IDs MUST be newly authored here.
    for name in ("action-vale", "action-archive", "interior-side-vale-cellars",
                 "peace-interior-side-vale-cellars"):
        assert name in names
    return phase3, original, catalog, freeze, by_id, pilots, data


def heritage_notes(theme, bar, pilots):
    """Actual Phase 3 performed note content, including repaired pilot bars."""
    if theme is None:
        raise ValueError("Interior heritage comes from the room's original motif")
    if "pilotFamily" in theme:
        source = pilots[theme["pilotFamily"]]
        plan = source["performance"]
        overrides = dict(plan["leadOverrides"])
        overrides.update(theme["pilotLeadOverrides"])
        phrase = source["cells"][source["phrases"][bar]]
        notes = overrides.get(str(bar))
        if notes is None:
            notes = [[at, pitch + plan["leadShifts"][bar], length]
                     for at, pitch, length in phrase]
        return notes, True
    return theme["cells"][theme["phrases"][bar]], False


def parse_room_cell(source):
    return [[float(at), int(degree), float(duration)]
            for at, degree, duration in
            (piece.split(":") for piece in source.split())]


def render_arrangement(cue, by_id, pilots, rooms, sampler):
    import numpy as np
    from scipy.signal import butter, sosfilt

    theme = by_id.get(cue["parent"])
    room = rooms.get(cue["parent"])
    if theme and "pilotFamily" in theme:
        p = pilots[theme["pilotFamily"]]
        root, mode, harmony = p["root"], p["mode"], p["harmony"]
    elif theme:
        root, mode, harmony = theme["root"], theme["mode"], theme["harmony"]
    else:
        root, mode, harmony = room["root"], room["mode"], room["harmony"]
    bpm, bars = cue["bpm"], cue["bars"]
    rate = sampler.RATE
    beat = 60 / bpm
    n = round(bars * 4 * beat * rate)
    wave = np.zeros((n, 2), dtype=np.float64)
    rng = np.random.default_rng(int.from_bytes(
        hashlib.sha256((cue["id"] + ":phase4-recorded").encode()).digest()[:8], "little"))
    role = cue["kind"]
    additive = role == "action"
    # True stems are deliberately lighter than full arrangements; the music
    # director plays these *over* the base, not instead of it.
    target = {"action": .027, "peace": .071, "night": .063,
              "settlement": .078, "interior": .074,
              "interior-peace": .068}[role]
    level = {"action": .70, "peace": .78, "night": .65,
             "settlement": .94, "interior": .78,
             "interior-peace": .68}[role]

    def add(bar, at, pcm, amount, pan, jitter=False):
        delta = float(rng.uniform(-.006, .006)) if jitter else 0
        start = round((bar * 4 + at + delta) * beat * rate) % n
        if len(pcm) >= n:
            raise ValueError(cue["id"] + ": note longer than whole loop")
        pcm = pcm * amount * level * cue["arc"][(4 * bar) // bars]
        pan = float(np.clip(pan, -.6, .6))
        stereo = np.stack((pcm * np.sqrt((1 - pan) / 2),
                           pcm * np.sqrt((1 + pan) / 2)), axis=1)
        end = min(len(stereo), n - start)
        wave[start:start+end] += stereo[:end]
        if len(stereo) > end:
            wave[:len(stereo)-end] += stereo[end:]

    def tone(bar, at, degree, duration, inst, amount,
             absolute=False, chromatic=0, soft=False):
        pitch = degree if absolute else harmony[bar] + degree
        midi = root + sampler.degree(pitch, mode) + REGISTERS[inst] + chromatic
        pcm = sampler.instrument(midi, duration * beat, inst, rng)
        if soft:
            fade = min(round(.050 * rate), len(pcm))
            if fade:
                pcm[:fade] *= np.linspace(.12, 1, fade)
        add(bar, at, pcm, amount, sampler.pan(inst, midi), jitter=inst in
            ("harp", "guitar", "marimba", "piano"))

    for bar in range(bars):
        phrase = cue["form"][bar]
        dynamic = cue["arc"][(4 * bar) // bars]
        # Per-context accompaniment patterns reflect the real performance
        # clock; exact loop frame count is NEVER stretched or copied from
        # historical 8-bar pilot MP3 metadata.
        if role == "action":
            beats = ((0,0,.4),(1,2,.4),(2.25,4,.46),(3.22,2,.4))
        elif role == "settlement":
            beats = ((.18,0,.62),(1.45,2,.52),(2.8,4,.58))
        elif role in ("night", "interior-peace"):
            beats = ((0,0,1.25),(2.8,4,.65))
        elif role == "peace":
            beats = ((0,0,.95),(2.5,2,.8))
        else:
            beats = ((0,0,.8),(1.7,4,.65),(3.1,2,.52))
        # R bars are intentionally sparse, not fully silent: the low harmonic
        # bed survives while the hook rests.
        if phrase == "R":
            beats = beats[:1]
        for at, degree, duration in beats:
            tone(bar, at, degree, duration, cue["pulse"],
                 .023 if additive else .027 if phrase == "R" else .039,
                 soft=role in ("night", "peace", "interior-peace"))
        # Supporting bass stays deliberately quiet on action overlays.
        if bar % 2 == 0 or phrase == "R":
            tone(bar, 0, 0, 1.8 if role == "action" else 2.5,
                 "cello", .018 if additive else .031, soft=True)
        if phrase == "H":
            if theme:
                notes, absolute = heritage_notes(theme, bar, pilots)
            else:
                notes, absolute = parse_room_cell(room["motif"]), False
            for idx, event in enumerate(notes):
                at, degree, duration = event[:3]
                accidental = event[3] if len(event) > 3 else 0
                tone(bar, at, degree, duration, cue["lead"],
                     (.041 if additive else .073) * (1.06 if idx == 0 else .90),
                     absolute=absolute, chromatic=accidental,
                     soft=role in ("night", "peace", "interior-peace"))
        elif phrase == "A":
            notes = cue["answer"] if theme else parse_room_cell(room["reply"])
            for at, degree, duration in notes:
                tone(bar, at, degree, duration, cue["response"],
                     .039 if additive else .061, soft=True)
        elif phrase == "Q":
            notes = cue["question"] if theme else parse_room_cell(room["question"])
            for at, degree, duration in notes:
                tone(bar, at, degree, duration, cue["lead"],
                     .033 if additive else .058, soft=True)
        if additive and dynamic > .9 and bar % 4 in (1, 2):
            # Distinct per-cue melodic/harmonic figures drive the escalation;
            # percussion is a small articulator rather than the shared boss
            # ostinato inherited from old scores.
            add(bar, 0, sampler.drum("frame", rng), .055,
                -.07, jitter=True)
            add(bar, 2.8, sampler.drum("shaker", rng), .040,
                .12, jitter=True)

    dry = wave.copy()
    # A quiet bounded individual recording space; game-runtime mixing remains
    # Phase 7's separate unresolved integration gate.
    profile = {
        "action": ((.067,.035),(.181,.012)),
        "peace": ((.091,.045),(.247,.016)),
        "night": ((.119,.040),(.288,.019)),
        "settlement": ((.054,.045),(.168,.018)),
        "interior": ((.046,.031),(.143,.021)),
        "interior-peace": ((.086,.042),(.196,.020)),
    }[role]
    for delay, gain in profile:
        wave += np.roll(dry, round(delay * rate), axis=0) * gain
    wave[:,0] += np.roll(dry[:,1], round(.119 * rate)) * .012
    wave[:,1] += np.roll(dry[:,0], round(.139 * rate)) * .012
    for cutoff, kind in ((44, "highpass"), (13000, "lowpass")):
        sos = butter(2, cutoff, btype=kind, fs=rate, output="sos")
        wave = sosfilt(sos, np.concatenate((wave, wave), axis=0), axis=0)[n:]
    rms = float(np.sqrt(np.mean(wave ** 2)))
    peak = float(np.max(np.abs(wave)))
    if rms <= 1e-9 or not np.isfinite(wave).all():
        raise RuntimeError(cue["id"] + ": silent/invalid arranged score")
    wave *= min(target / rms, .64 / peak)
    return wave, rate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--render", type=Path, metavar="OUTSIDE_REPO_DIR")
    args = parser.parse_args()
    if not args.check and args.render is None:
        parser.error("Specify --check or --render")
    phase3, original, catalog, freeze, by_id, pilots, data = score_contract()
    print("PASS Phase 4 source plan: exactly 38 approved arrangements, 83 IDs,"
          " 18 physically hashed Crown recordings, 65 non-Crown, 8 parent clocks")
    print("Creative source candidate only. Real listening UNVERIFIED; no Phase 9"
          " owner audition, published game or full integrated mix.")
    if args.render is None:
        return
    out = args.render.expanduser().resolve()
    if out == ROOT or out.is_relative_to(ROOT):
        parser.error("All WAV/MP3 previews MUST stay outside the repository")
    encoder = original.find_ffmpeg()
    if not encoder:
        parser.error("FFmpeg or imageio-ffmpeg required")
    out.mkdir(parents=True, exist_ok=True)
    sampler_lib = load_module("sibdlp_recorded_sampler", SAMPLER)
    sampler = sampler_lib.RecordedSampler(original.load_renderer(), encoder)
    reports, stems = [], {}
    for cue in data["arrangements"]:
        sampler.cue = cue["id"]
        before = sampler.calls
        wave, rate = render_arrangement(cue, by_id, pilots, data["interiors"], sampler)
        result = original.encode_stem(out, cue["id"], wave, rate, encoder, bitrate="192k")
        result["kind"] = cue["kind"]
        result["parent"] = cue["parent"]
        result["recordedInstrumentNotes"] = sampler.calls - before
        assert result["encodedBytes"] < MAX_FILE
        assert result["channels"] == 2 and result["decodedPeak"] < .98
        assert result["loopEdgeDelta"] < .2
        assert result["recordedInstrumentNotes"] >= 10
        reports.append(result)
        if cue["kind"] == "action":
            stems[cue["id"]] = (cue, wave)
        print("Phase 4 isolated", cue["id"], result["seconds"], "sec", flush=True)
    # Compare all eight additive stems to the actual Phase 3 recorded-source
    # baseline in RAM, with *one* shared musical clock, not the old pilots.
    ensemble = load_module("sibdlp_v2_ensemble", ENSEMBLE)
    additive = []
    for cue_id, (cue, action) in stems.items():
        parent = by_id[cue["parent"]]
        sampler.cue = parent["id"]
        if "pilotFamily" in parent:
            family = copy.deepcopy(pilots[parent["pilotFamily"]])
            family["performance"]["leadOverrides"].update(parent["pilotLeadOverrides"])
            for b, fig in parent.get("pilotFigureOverrides", {}).items():
                family["performance"]["figures"][int(b)] = fig
            base, rate = ensemble.render_stem(family, "base", sampler)
        else:
            base, rate = phase3.render_new(parent, sampler)
        assert base.shape == action.shape, cue_id + ": stem clock not aligned"
        import numpy as np
        mixed = base + action
        peak = float(np.max(np.abs(mixed)))
        rms = float(np.sqrt(np.mean(mixed * mixed)))
        assert peak < .98, cue_id + ": excessive raw additive peak"
        assert rms > .01, cue_id + ": additive mix silent"
        additive.append({"actionCue": cue_id, "baseCue": parent["id"],
                         "frames": len(base), "combinedPeak": peak,
                         "combinedRms": rms})
    assets = catalog["assets"]
    prior_size = sum((ROOT / a["src"]).stat().st_size for a in assets.values()
                     if a.get("src", "").startswith("./assets/audio/"))
    replaced = sum((ROOT / assets[m["cue"]]["src"]).stat().st_size for m in reports)
    replacement_projection = prior_size - replaced + sum(m["encodedBytes"] for m in reports)
    assert replacement_projection < BUDGET
    # Source and physical immutable byte hashes are checked AGAIN after render.
    original.check_contract()
    result = {
        "schemaVersion": 1, "scope": "38 isolated Phase 4 candidates, not integrated",
        "sampleRateHz": sampler.RATE, "bitrate": "192k-stereo-MP3",
        "musicRegistered": 83, "crownFrozen": len(freeze),
        "tracks": reports, "actionOverlayChecks": additive,
        "recordedSourceProvenance": sampler.snapshot(),
        "currentCatalogBytes": prior_size,
        "phase4OnlyReplacementProjectionBytes": replacement_projection,
        "final65CatalogBudgetStatus": "NOT YET TESTED; Phase 5/6 outstanding",
        "budgetCeilingBytes": BUDGET,
        "heardListeningStatus": "UNVERIFIED; no genuine audition",
        "ownerAcceptance": "PHASE 9 ONLY",
        "integration": "UNREGISTERED / UNMERGED / UNPUBLISHED",
    }
    (out / "phase4-metrics.json").write_text(json.dumps(result, indent=2) + "\n",
                                              encoding="utf-8")
    print("PASS isolated 38 encoded/decode candidates + eight raw action/base"
          " overlays, Crown integrity and phase-four-only budget.")
    print("NOT a listening, in-game masking, crossfade or artistic acceptance gate.")


if __name__ == "__main__":
    main()
