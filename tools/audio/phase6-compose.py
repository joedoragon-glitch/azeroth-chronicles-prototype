#!/usr/bin/env python3
"""Phase 6 isolated three-cue narrative studio; never writes playable-game assets.

Only scored recorded-source performances count. Structural/codec passes cannot
certify beauty, fatigue or actual hearing; first owner audition is Phase 9.
"""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCORE = ROOT / "tools/audio/phase6-scores.json"
P3 = ROOT / "tools/audio/phase3-compose.py"
SAMPLER = ROOT / "tools/audio/phase3-sampler.py"
CONTROLS = ROOT / "tools/audio/score-quality-controls.py"
BUDGET = 256 * 1024 * 1024
MAX_FILE = 16 * 1024 * 1024


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, filename)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def lead_notes(cue):
    return [[float(4 * e[0] + e[1]), int(e[2]), float(e[3])]
            for e in cue["events"] if e[6] == "lead"]


def source_contract():
    p3 = module("phase6_p3", P3)
    original, catalog, frozen, _, _, _ = p3.source_contract()
    ctl = module("phase6_controls", CONTROLS)
    data = json.loads(SCORE.read_text(encoding="utf-8"))
    assert data["schemaVersion"] == 1
    assert data["scope"] == dict(ids=["title", "defeat", "finale"],
        musicIds=83, crownFrozen=18, phase3=8, phase4=38, phase5=16)
    cues = data["cues"]
    assert [x["id"] for x in cues] == ["title", "defeat", "finale"]
    assert all(c["id"] in catalog["assets"] and c["id"] not in frozen
               for c in cues)
    bank = json.loads((ROOT / "tools/audio/phase3-sample-bank.json").read_text())
    assert len(frozen) == 18 and all(x["license"] == "CC0-1.0"
                                     for x in bank["sources"])
    for cue in cues:
        assert 8 <= cue["bars"] <= 16 and len(cue["energy"]) == cue["bars"]
        assert .3 <= min(cue["energy"]) and max(cue["energy"]) <= 1.05
        assert 64 <= cue["bpm"] <= 100 and 7500 <= cue["lowpassHz"] <= 12000
        assert len(cue["arc"]) == 4 and all(len(x) >= 25 for x in cue["arc"])
        assert 1 <= len(cue["room"]) <= 3
        assert len(cue["chords"]) == cue["bars"]
        assert all(len(chord) == 4 for chord in cue["chords"])
        assert all(len(cue["harmonicReview"][key]) >= 55
                   for key in ("anchorRule","tension","cadence"))
        early_nonchord = sorted({e[0] for e in cue["events"]
            if e[6] == "lead" and e[1] <= .4 and
            e[2] % 12 not in [p % 12 for p in cue["chords"][e[0]]]})
        assert early_nonchord == cue["harmonicReview"]["earlyNonchord"]
        assert len(early_nonchord) <= 1, (
            cue["id"] + ": unreviewed early strong-note/chord collisions")
        assert len(cue["events"]) >= (25 if cue["id"] == "defeat" else 75)
        role_notes = [e for e in cue["events"] if e[6] == "lead"]
        assert len(role_notes) >= cue["bars"] + 2
        previous = (-1, -1)
        for bar, at, midi, length, instrument, gain, role in cue["events"]:
            assert isinstance(bar, int) and 0 <= bar < cue["bars"]
            assert isinstance(midi, int) and 36 <= midi <= 86
            assert 0 <= at < 4 and .2 <= length <= 3.1
            assert 0 < gain <= .12 and role in ("lead", "harmonic", "texture", "counter")
            assert (bar, at) >= previous and (bar, at) != previous or (
                (bar, at) == previous and role != "lead")
            previous = bar, at
            # Reproduce actual sample routing *before* declaring the score playable.
            # Crucially, no per-note octave folding or uncaught bank over-stretch.
            routed = ("violins" if instrument == "strings" and midi >= 55
                      else "celli" if instrument == "cello" and midi >= 36
                      else instrument)
            assert routed in bank["instruments"], (cue["id"], instrument)
            inst = bank["instruments"][routed]
            assert inst["range"][0] - 4 <= midi <= inst["range"][1] + 4, (
                cue["id"], instrument, midi, "outside recorded source range")
            recorded = [x["midi"] for x in inst["samples"]]
            assert min(abs(midi - sample) for sample in recorded) <= 4, (
                cue["id"], instrument, midi, "overstretched sample")
            if role != "lead":
                assert midi % 12 in [p % 12 for p in cue["chords"][bar]], (
                    cue["id"], bar, "accompaniment drift from authored harmony", midi)
            if role == "lead":
                assert instrument == cue["lead"], cue["id"] + ": unreviewed voice swap"
        phrase = lead_notes(cue)
        assert len({(x[0], x[1]) for x in phrase}) == len(phrase)
        assert len({x[1] for x in phrase}) >= 5
    title, defeat, finale = cues
    motif = data["commonMotif"]
    assert len(motif["description"]) >= 120
    title_open = lead_notes(title)[:4]
    final_open = lead_notes(finale)[:5]
    assert title_open == [[float(a), int(p), float(d)] for a,p,d in motif["titleOpening"]]
    assert final_open == [[float(a), int(p), float(d)] for a,p,d in motif["finaleTransformation"]]
    assert title_open != final_open[:4], "Q12 requires real melodic transformation"
    assert [n[1] for n in title_open] == [74, 77, 81, 76]
    assert [n[1] for n in final_open] == [69, 74, 78, 81, 76]
    assert final_open[2][1] == title_open[1][1] + 1, "third must brighten"
    assert [x[1] for x in lead_notes(defeat)[:2]] == [50, 53], (
        "Defeat's +3 fragment quietly recalls the title's opening interval")
    assert [x[1] for x in lead_notes(finale)[-2:]] == [74, 76], (
        "Q11 last E over D preserves unfinished post-ending question")
    assert len({tuple(x[1] for x in lead_notes(c)) for c in cues}) == 3
    contexts = [{
        "id": c["id"],
        "performedRhythm": [[round(e[0],3),round(e[2],3)] for e in lead_notes(c)],
        "form": " / ".join(c["arc"]),
        "energy": c["energy"],
        "harmony": [e[:3] for e in c["events"] if e[6] == "harmonic"]
    } for c in cues]
    assert ctl.guard_not_cloned_contexts(contexts) == 3
    return original, catalog, frozen, data, ctl


def render_cue(cue, sampler, performed):
    import numpy as np
    from scipy.signal import butter, sosfilt
    bpm, bars, rate = cue["bpm"], cue["bars"], sampler.RATE
    beat = 60 / bpm
    frames = round(bars * 4 * beat * rate)
    mix = np.zeros((frames, 2), dtype=np.float64)
    seed = hashlib.sha256((cue["id"] + ":phase6-performed").encode()).digest()
    rng = np.random.default_rng(int.from_bytes(seed[:8], "little"))
    for bar, at, midi, length, instrument, gain, role in cue["events"]:
        # The final absolute MIDI must reach the recorded sampler unaltered.
        if role == "lead":
            performed.append([float(4 * bar + at), int(midi), float(length)])
        sound = sampler.instrument(midi, length * beat, instrument, rng)
        if role in ("lead", "counter") and instrument in ("flute","cello","strings"):
            k = min(len(sound), round((.055 if role == "lead" else .075) * rate))
            if k:
                sound[:k] *= np.linspace(.09, 1.0, k)
        strength = gain * cue["energy"][bar]
        pan = float(np.clip(sampler.pan(instrument, midi) * .95, -.62, .62))
        stereo = np.stack((sound * strength * np.sqrt((1-pan)/2),
                           sound * strength * np.sqrt((1+pan)/2)),axis=1)
        start = round((4 * bar + at) * beat * rate) % frames
        assert len(stereo) < frames, cue["id"] + ": overlong sound"
        cut = min(len(stereo), frames - start)
        mix[start:start+cut] += stereo[:cut]
        if cut < len(stereo):
            mix[:len(stereo)-cut] += stereo[cut:]
    dry = mix.copy()
    for seconds, gain in cue["room"]:
        mix += np.roll(dry, round(seconds * rate), axis=0) * gain
    mix[:,0] += np.roll(dry[:,1],round(.113*rate)) * .013
    mix[:,1] += np.roll(dry[:,0],round(.147*rate)) * .016
    for freq, kind in ((45, "highpass"),(cue["lowpassHz"], "lowpass")):
        sos = butter(2, freq, btype=kind, fs=rate, output="sos")
        mix = sosfilt(sos, np.concatenate((mix,mix),axis=0),axis=0)[frames:]
    # Exact musical-bar loop with bounded decay; inspect decoded, not only PCM seam.
    k = max(8,round(.045 * rate))
    fade = np.sin(np.linspace(0,np.pi/2,k))**2
    mix[:k] *= fade[:,None]
    mix[-k:] *= fade[::-1,None]
    rms = float(np.sqrt(np.mean(mix * mix)))
    peak = float(np.max(np.abs(mix)))
    assert np.isfinite(mix).all() and rms > 1e-8
    target = .040 if cue["id"] == "defeat" else .070
    mix *= min(target/rms, .53/max(peak,1e-9))
    return mix, rate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--render", type=Path, metavar="OUTSIDE_REPO_DIR")
    args = parser.parse_args()
    if not args.check and args.render is None:
        parser.error("Provide --check or --render")
    original, catalog, frozen, data, ctl = source_contract()
    print("PASS source: title, defeat, finale; Q11/Q12 thematic gates; 18 Crown frozen")
    if args.render is None:
        return
    import numpy as np
    out = args.render.expanduser().resolve()
    if out == ROOT or out.is_relative_to(ROOT):
        parser.error("Preview MP3s must be OUTSIDE the repository")
    encoder = original.find_ffmpeg()
    if not encoder:
        parser.error("ffmpeg/imageio-ffmpeg missing")
    out.mkdir(parents=True, exist_ok=True)
    recorded = module("phase6_sampler", SAMPLER)
    sampler = recorded.RecordedSampler(original.load_renderer(), encoder)
    tracks = []
    for cue in data["cues"]:
        sampler.cue = cue["id"]
        before = sampler.calls
        performed = []
        observed = []
        original_instrument = sampler.instrument
        def observed_sampler(midi, duration, instrument, rng):
            observed.append([int(midi), instrument, round(duration, 7)])
            return original_instrument(midi, duration, instrument, rng)
        sampler.instrument = observed_sampler
        try:
            wav, rate = render_cue(cue, sampler, performed)
        finally:
            sampler.instrument = original_instrument
        expected_calls = [[e[2], e[4], round(e[3] * 60 / cue["bpm"], 7)]
                          for e in cue["events"]]
        assert observed == expected_calls, cue["id"] + ": actual recorded sampler calls drift"
        played = ctl.verify_heritage(lead_notes(cue), performed, cue=cue["id"])
        assert played["exact"], cue["id"] + ": sampler-boundary MIDI mismatch"
        report = original.encode_stem(out,cue["id"],wav,rate,encoder,bitrate="192k")
        report["recordedInstrumentNotes"] = sampler.calls - before
        report["performedLeadSha256"] = hashlib.sha256(json.dumps(
            performed,separators=(",",":")).encode()).hexdigest()
        report["performedAllNotesSha256"] = hashlib.sha256(json.dumps(
            observed,separators=(",",":")).encode()).hexdigest()
        assert report["recordedInstrumentNotes"] >= len(performed)
        assert report["encodedBytes"] < MAX_FILE
        assert report["channels"] == 2 and report["decodedPeak"] < .98
        assert report["stereoSideRms"] > .0008
        assert report["foldedMonoPeak"] < .98
        assert report["loopEdgeDelta"] < .005
        tracks.append(report)
        print("ENCODED",cue["id"],"sha256",report.get("sha256"),
              "bytes",report["encodedBytes"],"seam",report["loopEdgeDelta"],flush=True)
    assets = catalog["assets"]
    original_bytes = sum((ROOT / a["src"]).stat().st_size for a in assets.values()
                         if a.get("src","").startswith("./assets/audio/"))
    replaced = sum((ROOT / assets[r["cue"]]["src"]).stat().st_size for r in tracks)
    projected = original_bytes - replaced + sum(r["encodedBytes"] for r in tracks)
    assert projected < BUDGET
    original.check_contract()  # physical 18-Crown SHA freeze after real rendering
    provenance = sampler.snapshot()
    assert provenance["maxSemitonePitchShift"] <= 4, (
        "New exposed Phase 6 samples must not repeat Phase 5 over-stretch")
    metrics = {
        "schemaVersion":1, "scope":"Phase 6 isolated title, defeat, finale",
        "sampleRateHz":sampler.RATE,"bitrate":"192k-stereo-MP3",
        "musicRegistered":83,"crownFrozen":len(frozen),
        "tracks":tracks,"actionOverlayChecks":[],
        "recordedSourceProvenance":provenance,
        "currentCatalogBytes":original_bytes,
        "candidateCatalogProjectionBytes":projected,
        "budgetCeilingBytes":BUDGET,
        "thematicDisposition":"Q12 transformed; Q11 fragile relief remains an unresolved ending",
        "heardListeningStatus":"UNVERIFIED; no actual listening performed",
        "ownerAcceptance":"PHASE 9 ONLY",
        "integration":"UNREGISTERED / UNMERGED / UNPUBLISHED",
        "phase7Note":"Integrate all 65 cues, check masking, crossfades, cache/offline",
    }
    ctl.verify_decoded_report(metrics, expected_cues={"title","defeat","finale"},
                              layer_count=0)
    (out / "phase6-metrics.json").write_text(
        json.dumps(metrics,indent=2)+"\n", encoding="utf-8")
    print("PASS three real isolated 44.1kHz stereo MP3 decode reports; no audition")
    print("NOT evidence of acoustic beauty, game playback or owner acceptance.")


if __name__ == "__main__":
    main()
