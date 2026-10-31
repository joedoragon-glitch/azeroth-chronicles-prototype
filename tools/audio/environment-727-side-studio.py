"""#727 Stage 4: three source-authored, never-published side-interior environmental STUDIES.

Run --probe-sources FIRST for original SHA-1/SHA-256/bytes/codec truth.
After pinning sources in studies JSON, rerun normally to write three real 72s
mono MP3 research masters and measure *decoded* signal integrity. This script
does not register assets, change routing, score, game sources, PWA or builds.

Sonic art is not certified by data: real field wind is not authentic castle
roomtone; paper may be ripping, anvil may read too industrial, woodchair can
sound contemporary, equipment may be overly close. All require later audition.
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import os
import sys
import tempfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
STUDY = ROOT / "tools/audio/environment-727-side-interiors.json"
OUT = ROOT / "tools/audio/.environment-727-side-preview"
PROBE = "--probe-sources" in sys.argv
RATE = 32000
SECONDS = 72
LENGTH = SECONDS * RATE


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# Preserve existing tested physical-source fetch, actual MP3 encode and
# true-peak implementation, instead of inventing a divergent codec pipeline.
lib = load_module(ROOT / "tools/audio/environment-727-outdoor-expansion.py", "side-interior_audio_tools")
old = load_module(ROOT / "tools/audio/render-environment.py", "side-interior_original_source_book")


def delay_room(data, delays_ms, gains):
    """Very restrained early reflections: visual room design -> acoustic spacing.

    Circular taps avoid a sudden tail cut, NOT actual positional/occlusion audio.
    Each location has a documented unique pattern, with non-musical delays.
    """
    if len(delays_ms) != len(gains) or len(set(delays_ms)) != len(delays_ms):
        raise ValueError("Room tap definition is invalid")
    if any(g < 0 or g > 0.20 for g in gains) or sum(gains) > 0.40:
        raise ValueError("Room reflection is too pronounced")
    out = data.copy()
    for ms, gain in zip(delays_ms, gains):
        count = round(float(ms) * RATE / 1000)
        if count <= 0 or count >= len(data) // 4:
            raise ValueError("Reflection delay unsupported")
        out += np.roll(data, count) * gain
    return out / (1 + sum(gains))


def file_sha(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(1024 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def soft_loop_envelope_match(data, policy):
    """Bounded, slowly tapered seam-energy correction for measured room only."""
    if not policy:
        return data
    seconds=float(policy["windowSeconds"])
    target=float(policy["targetFirstLast1sDb"])
    limit=float(policy["maxCompensationDb"])
    if not (2 <= seconds <= 4 and 2.5 <= target <= 4 and 0 < limit <= 1.8):
        raise ValueError("Invalid acoustic room edge policy")
    first=lib.rms(data[:RATE])
    last=lib.rms(data[-RATE:])
    difference=20*math.log10(max(first,1e-10)/max(last,1e-10))
    if abs(difference) <= target:
        return data
    correction=min(abs(difference)-target,limit)
    start_db=-math.copysign(correction/2,difference)
    end_db=math.copysign(correction/2,difference)
    n=round(seconds*RATE)
    ease=(1-np.cos(np.linspace(0,np.pi,n)))/2
    out=data.copy()
    out[:n] *= 10**(start_db/20)*(1-ease) + ease
    out[-n:] *= 1-ease + 10**(end_db/20)*ease
    print("ENCLOSURE_SEAM_REPAIR",json.dumps({"sourceFirstLast1sDb":difference,
        "correctionDb":correction,"seconds":seconds,"qualityGateDbUnchanged":4.25}),flush=True)
    return out


def event_clip(raw, e):
    start = round(float(e["start"]) * RATE)
    count = round(float(e["duration"]) * RATE)
    if start < 0 or count < RATE * .12 or start + count > len(raw):
        raise ValueError("Invalid contextual physical event excerpt: " + e["source"])
    out = raw[start:start + count].copy()
    out = lib.filter_periodic(out, e["highpassHz"], e["lowpassHz"])
    if not np.isfinite(out).all() or lib.rms(out) < 1e-9:
        raise ValueError("Recorded physical event is silent/invalid")
    n = min(round(.025 * RATE), count // 4)
    ramp = np.linspace(0, 1, n)
    out[:n] *= ramp
    out[-n:] *= ramp[::-1]
    return out / max(np.max(np.abs(out)), 1e-10) * float(e["peak"])


def source_probe(book, originals, temp):
    reports = []
    for s in book["sources"]:
        path = lib.fetch(s, temp)
        data = json.loads(lib.command(["ffprobe", "-v", "error", "-show_entries",
            "format=duration:stream=codec_name,sample_rate,channels", "-of", "json", str(path)]).stdout)
        reported = {"id": s["id"], "creator": s["creator"], "licenseClaim": s["license"],
                    "evidence": s["evidence"], "url": s["url"], "sha1": hashlib.sha1(path.read_bytes()).hexdigest(),
                    "sha256": file_sha(path), "bytes": path.stat().st_size, "ffprobe": data,
                    "pending": "Independent original source only; metadata is NOT an artistic or codec preview acceptance"}
        reports.append(reported)
        print("SIDE_INTERIOR_SOURCE_PROBE", json.dumps(reported), flush=True)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "source-probe.json").write_text(json.dumps({
        "kind": "SIBDLP #727 Stage 4 original-source fingerprinting",
        "sources": reports, "gameRegistration": False, "authoredPreviews": False,
        "humanListening": False, "deployed": False}, indent=2) + "\n")
    print("PASS SOURCE PROBE ONLY: pin all original digests and byte sizes; NO encoded previews", flush=True)


def check_source_records(book):
    expected = {"side-vale-cellars": "env-cellar",
                "side-march-watchhouse": "env-archive",
                "side-crown-foundry": "env-mine"}
    assert len(book["studies"]) == 3 and len(book["sources"]) == 6
    assert {c["sceneId"]: c["referenceBed"] for c in book["studies"]} == expected
    for s in book["sources"]:
        assert isinstance(s.get("sha1"), str) and len(s["sha1"]) == 40, s["id"] + ": SHA1 unpinned"
        assert isinstance(s.get("sha256"), str) and len(s["sha256"]) == 64, s["id"] + ": SHA256 unpinned"
        assert isinstance(s.get("bytes"), int) and 500 <= s["bytes"] <= s["maxBytes"]


def main():
    book = json.loads(STUDY.read_text())
    source_book = json.loads((ROOT / "tools/audio/environment-book.json").read_text())
    catalog = json.loads((ROOT / "assets/audio/manifest.json").read_text())
    if len(book["studies"]) != 3 or len(book["sources"]) != 6:
        raise ValueError("Stage 4 requires three side interiors and eight screened physical originals")
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="sibdlp-side-interior-originals-") as workspace:
        temp = Path(workspace)
        if PROBE:
            return source_probe(book, None, temp)
        check_source_records(book)
        sources = {}
        proven = []
        for s in book["sources"]:
            source_path = lib.fetch(s, temp)
            decoded = lib.decode(source_path)
            sources[s["id"]] = decoded
            proven.append({"id": s["id"], "creator": s["creator"],
                           "url": s["url"], "license": s["license"],
                           "sha1": s["sha1"], "sha256": s["sha256"], "bytes": s["bytes"],
                           "ffprobe": json.loads(lib.command(["ffprobe", "-v", "error",
                            "-show_entries", "format=duration:stream=codec_name,sample_rate,channels",
                            "-of", "json", str(source_path)]).stdout)})
        outputs = []
        decoded_outputs = {}
        blocks = []
        known_cues = {c["id"]: c for c in source_book["cues"]}
        ledger = book.get("encodedPreviewEvidence", {}).get("outputs", [])
        for cue in book["studies"]:
            name = cue["id"]
            parent = catalog["assets"].get(cue["referenceBed"])
            if not parent or parent.get("managedBy") != "environment-book":
                raise ValueError("Published original bed not source-book owned: " + name)
            actual_reference = ROOT / parent["src"].removeprefix("./")
            parent_sha = file_sha(actual_reference)
            if parent_sha != parent["sha256"]:
                raise ValueError("Published original parent changed: " + name)
            ref = lib.decode(actual_reference)
            ref = ref[round(parent["loop"]["start"] * RATE):round(parent["loop"]["start"] * RATE) + 24 * RATE]
            if len(ref) != 24 * RATE:
                raise ValueError("Invalid 24s original bed: " + name)
            procedural = old.render(known_cues[cue["referenceBed"]], SECONDS)
            physical = lib.source_segment(sources[cue["mainSource"]], cue["fieldExcerptStart"])
            physical = lib.filter_periodic(physical, cue["highpassHz"], cue["lowpassHz"])
            procedural = lib.filter_periodic(procedural,
                 max(85, .80 * cue["highpassHz"]), min(2000, 1.05 * cue["lowpassHz"]))
            physical = delay_room(physical, cue["reflectionMs"], cue["reflectionGains"])
            procedural = delay_room(procedural, cue["reflectionMs"], cue["reflectionGains"])
            physical = physical / max(lib.rms(physical), 1e-10) * cue["fieldGain"] * .034
            procedural = procedural / max(lib.rms(procedural), 1e-10) * cue["windGain"] * .034
            raw = physical + procedural
            real_energy = float(np.dot(physical, physical))
            total_energy = real_energy + float(np.dot(procedural, procedural))
            if cue.get("secondarySource"):
                secondary = lib.source_segment(sources[cue["secondarySource"]], cue["secondaryExcerptStart"])
                secondary = lib.filter_periodic(secondary, cue["secondaryHighpassHz"], cue["secondaryLowpassHz"])
                secondary = delay_room(secondary, cue["reflectionMs"], cue["reflectionGains"])
                secondary = secondary / max(lib.rms(secondary), 1e-10) * cue["secondaryGain"] * .034
                raw += secondary
                e = float(np.dot(secondary, secondary))
                real_energy += e
                total_energy += e
            foley_report = []
            for ev in cue["events"]:
                snippet = event_clip(sources[ev["source"]], ev)
                at = round(ev["at"] * RATE)
                if at <= RATE * 2 or at + len(snippet) >= LENGTH - RATE * 2:
                    raise ValueError("Event too close to loop boundary")
                bedrms = lib.rms(raw[at:at + len(snippet)])
                evdb = 20 * math.log10(max(lib.rms(snippet), 1e-10) / max(bedrms, 1e-10))
                foley_report.append({"source": ev["source"], "at": ev["at"],
                                     "bedRelativeDbPreMastering": round(evdb, 2),
                                     "peakPreMastering": float(np.max(np.abs(snippet)))})
                raw[at:at + len(snippet)] += snippet
            target = lib.rms(ref) * .89
            level = target / max(lib.rms(raw), 1e-10)
            if not .10 < level < 4:
                raise ValueError("Candidate requires unreasonable gain adjustment: " + name)
            raw *= level
            pre_peak = float(np.max(np.abs(raw)))
            raw = lib.transparent_peak_knee(raw)
            raw = soft_loop_envelope_match(raw, cue.get("envelopeEdgeMatch"))
            raw = lib.codec_edge_declick(raw, cue.get("codecEdgeDeclick"))
            audio_path = OUT / (name + ".mp3")
            decoded = lib.encode(raw, audio_path)
            thirds = [decoded[i * 24 * RATE:(i+1) * 24 * RATE] for i in range(3)]
            correlations = [lib.correlation(thirds[a], thirds[b]) for a,b in ((0,1),(0,2),(1,2))]
            edge = float(abs(decoded[0] - decoded[-1]))
            one_second = decoded.reshape(SECONDS, RATE)
            rms_per_second = np.sqrt(np.mean(one_second ** 2, axis=1))
            seam_db = float(20 * np.log10(max(float(rms_per_second[0]),1e-10)
                                        / max(float(rms_per_second[-1]),1e-10)))
            spec = lib.spectral(decoded)
            peak = float(np.max(np.abs(decoded)))
            truepeak = lib.actual_true_peak(audio_path)
            lufs = lib.actual_lufs(audio_path)
            original_lufs = lib.actual_lufs(actual_reference)
            crest = float(np.max(20 * np.log10(
                np.max(np.abs(one_second), axis=1) / np.maximum(rms_per_second, 1e-12))))
            source_fraction = real_energy / max(total_energy, 1e-10)
            failures = []
            if edge >= .005 or abs(seam_db) > 4.25:
                failures.append("decoded loop discontinuity/envelope")
            if max(abs(x) for x in correlations) >= .90:
                failures.append("24s block repetition")
            if peak >= .95 or truepeak >= -1.5 or not np.isfinite(decoded).all():
                failures.append("clipping/truepeak/invalid decoded output")
            if spec["below250"] > .78 or spec["mid250to2000"] < .20:
                failures.append("excessively bass-heavy bed for portable speaker")
            if source_fraction < .37:
                failures.append("insufficient source recording against synthetic air")
            if lufs - original_lufs > 2.0 or original_lufs - lufs > 6.0:
                failures.append("excessive audio loudness drift vs original bed")
            if crest > 22.0:
                failures.append("uncontrolled one-second transient crest")
            if failures:
                blocks.append({"id":name,"reasons":failures,"edgeSampleDelta":edge,
                               "firstLast1SecDb":seam_db, "midFraction":spec["mid250to2000"]})
            report = {"id":name, "zone":cue["zone"], "sceneId":cue["sceneId"],
                      "fileSha256":file_sha(audio_path), "bytes":audio_path.stat().st_size,
                      "codec":"mono MP3 32000Hz 128kbps", "activeSeconds":72,
                      "parent":cue["referenceBed"], "parentSha256":parent_sha,
                      "mainRealSource":cue["mainSource"], "secondaryRealSource":cue.get("secondarySource"),
                      "sourceRealEnergyPreCrossTerms":source_fraction,
                      "referenceLufs":original_lufs,"candidateLufs":lufs,
                      "truePeakDbTP":truepeak, "decodedPeak":peak,"preLimiterPeak":pre_peak,
                      "loopSampleJump":edge,"loopOneSecondEnvelopeDb":seam_db,
                      "oneSecMaxCrestDb":crest,"three24sBlockCorrelations":correlations,
                      "spectrumEnergy":spec,"sparseFoley":foley_report,
                      "envelopeEdgeMatch":cue.get("envelopeEdgeMatch"),
                      "roomReflectionsMs":cue["reflectionMs"],"roomType":cue["room"],
                      "humanHeard":False,"registeredInGame":False,"creativeApproval":"HOLD",
                      "technicalSignal":"BLOCK" if failures else "PASS"}
            print("SIDE_INTERIOR_PREVIEW", json.dumps(report), flush=True)
            if ledger:
                exact = [x for x in ledger if x["id"] == name]
                if len(exact) != 1 or exact[0]["sha256"] != report["fileSha256"] or exact[0]["bytes"] != report["bytes"]:
                    raise ValueError("Frozen physical preview differs on rerender: " + name)
            decoded_outputs[name] = decoded
            outputs.append(report)
        contrasts = []
        for i in range(len(outputs)):
            for j in range(i+1,len(outputs)):
                left, right = outputs[i], outputs[j]
                score = lib.correlation(decoded_outputs[left["id"]], decoded_outputs[right["id"]])
                diff = abs(left["spectrumEnergy"]["below250"] - right["spectrumEnergy"]["below250"])
                contrasts.append({"a":left["id"],"b":right["id"],
                                  "sampleCorrelation":score,"differenceSub250Fraction":diff})
                if abs(score) >= .85:
                    blocks.append({"pair":[left["id"],right["id"]], "reason":"two 72s beds sound nearly identical in actual decoded waveform"})
        (OUT / "side-interior-studio-qa.json").write_text(json.dumps({
            "project":"SIBDLP #727 Stage 4 three side interiors",
            "sourceProvenance":proven,"originalGameAudioUnchanged":True,
            "candidateReports":outputs,"crossSceneContrasts":contrasts,
            "technicalBlocks":blocks,"humanListening":False,
            "actualGameCandidatePlayback":False,"merged":False,"deployed":False,
            "cacheIfAllThreeResidentBytes":3*LENGTH*4,
            "verdict":"TECHNICAL BLOCK" if blocks else "SOUND-SIGNAL PASS / ARTISTIC AND PLAYABLE QA HOLD"
            },indent=2)+"\n")
        if blocks:
            raise ValueError("Side-interior source-signal studio BLOCK: "+json.dumps(blocks))
        print("PASS: THREE distinct real-source 72-second guarded MP3 side-interior studies, actual decoded QA; artistic/playback/cache HOLD", flush=True)


if __name__ == "__main__":
    main()
