#!/usr/bin/env python3
"""Install the 65 approved recorded-source soundtrack candidates on a draft branch.

Consumes exact, independently rendered/decoded Phase 3–6 MP3s and per-phase
metrics. Does not change campaign rules or any of the 18 frozen Crown recordings.
Only invoke after all four studios succeed. This is INTEGRATION, not audition.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "assets/audio/manifest.json"
FREEZE = ROOT / "tools/audio/phase2-crown-freeze.json"
MAX_FILE = 16 * 1024 * 1024
MAX_PACKAGE = 256 * 1024 * 1024
PHASES = ("phase3", "phase4", "phase5", "phase6")
COUNT = {"phase3": 8, "phase4": 38, "phase5": 16, "phase6": 3}
SOURCES = {
    "phase3": "tools/audio/phase3-themes.json",
    "phase4": "tools/audio/phase4-arrangements.json",
    "phase5": "tools/audio/phase5-scores.json",
    "phase6": "tools/audio/phase6-scores.json",
}
PROVENANCE = (
    "Original SIBDLP composition performed using verified CC0 recorded "
    "instrument samples; refer to source scores and pinned sample bank"
)

def document(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def frozen_check(catalog):
    frozen = document("tools/audio/phase2-crown-freeze.json")["frozen"]
    assert len(frozen) == 18
    for cue, expected in frozen.items():
        actual = catalog["assets"][cue]
        for field, value in expected.items():
            assert actual[field] == value, f"Protected {cue}: {field} changed"
        path = (ROOT / actual["src"]).resolve()
        assert path.is_file() and path.is_relative_to(ROOT / "assets/audio")
        assert sha(path) == expected["sha256"], f"Protected Crown bytes changed: {cue}"
    return frozen

def expected_roster():
    p3 = document(SOURCES["phase3"])["themes"]
    p2 = document("tools/audio/phase2-pilots-v2.json")["families"]
    pilot_bpms = {x["family"]: x["bpm"] for x in p2}
    mapping = {}
    for item in p3:
        mapping[item["id"]] = ("phase3", item.get("bpm") or pilot_bpms[item["pilotFamily"]],
                               item.get("title"), "primary theme")
    for item in document(SOURCES["phase4"])["arrangements"]:
        parent = item["parent"]
        bpm = item.get("bpm") or mapping[parent][1]
        mapping[item["id"]] = ("phase4", bpm, item.get("title"), item["kind"])
    for item in document(SOURCES["phase5"])["families"]:
        mapping[item["id"]] = ("phase5", item["bpm"], item["title"], "boss")
        mapping[item["trueId"]] = ("phase5", item["bpm"], item["title"] + " — TRUE", "TRUE additive")
    for item in document(SOURCES["phase6"])["cues"]:
        mapping[item["id"]] = ("phase6", item["bpm"], item["title"], "narrative")
    assert len(mapping) == 65, f"Expected 65 source IDs, got {len(mapping)}"
    assert [sum(p == phase for p, *_ in mapping.values()) for phase in PHASES] == [8, 38, 16, 3]
    return mapping

def install(out):
    assert out.is_dir()
    original_bytes = MANIFEST.read_bytes()
    catalog = json.loads(original_bytes)
    assets = catalog["assets"]
    frozen = frozen_check(catalog)
    originals = {k: dict(v) for k, v in assets.items()}
    source = expected_roster()
    music = {k for k, v in assets.items() if v["kind"] == "music"}
    assert len(music) == 83
    assert music - set(frozen) == set(source), "Missing/extra music IDs in four studios"
    reports = {}
    for phase in PHASES:
        data = json.loads((out / phase / f"{phase}-metrics.json").read_text())
        tracks = data["tracks"]
        assert len(tracks) == COUNT[phase] and len({t["cue"] for t in tracks}) == COUNT[phase]
        for track in tracks:
            cue = track["cue"]
            assert cue in source and source[cue][0] == phase, f"{phase}: unexpected {cue}"
            assert cue not in reports, f"Duplicate recording {cue}"
            path = out / phase / (cue + ".mp3")
            assert path.is_file(), f"Missing actual rendered MP3: {cue}"
            assert path.stat().st_size == track["encodedBytes"] <= MAX_FILE
            assert sha(path) == track["sha256"], f"Actual MP3 digest mismatch: {cue}"
            assert track["channels"] == 2
            assert track["decodedPeak"] < .98 and track["foldedMonoPeak"] < .98
            assert track["loopEdgeDelta"] < .005
            assert track["decodedSamples"] >= track["expectedSamples"] - 32
            assert track["recordedInstrumentNotes"] >= 10
            assert track["loop"]["start"] == .15
            assert 0 < track["loop"]["end"] - track["loop"]["start"] < 600
            reports[cue] = track
    assert set(reports) == set(source), "Only complete 65-track render is admissible"

    for cue, (phase, bpm, title, kind) in source.items():
        track = reports[cue]
        old = assets[cue]
        path = (ROOT / old["src"]).resolve()
        assert path.is_relative_to(ROOT / "assets/audio/music")
        shutil.copyfile(out / phase / (cue + ".mp3"), path)
        old["sha256"] = track["sha256"]
        # Decode sample count includes the intentional 150-ms front/back loop guards.
        # Do not substitute the loop length for the full MP3 file duration.
        old["duration"] = round(track["decodedSamples"] / 44100, 9)
        old["loop"] = track["loop"]
        assert old["loop"]["end"] <= old["duration"]
        old["bpm"] = bpm
        if title:
            old["title"] = title
        old["credits"] = {"author": PROVENANCE, "license": "CC0-1.0"}
        old["creationMethod"] = "authored-recorded-source-score"
        old["sourceScore"] = SOURCES[phase]
        old["generationGuide"] = (
            f"Source-authoritative {phase} {kind}, {bpm} BPM, authored in "
            f"{SOURCES[phase]}; verified CC0 recorded instrument samples. "
            "Do not use the original procedural score-book melody for this recorded master."
        )
        assert old["managedBy"] == "score-book"
    frozen_check(catalog)
    for id, prev in originals.items():
        if id not in source:
            assert assets[id] == prev, f"Out-of-scope manifest entry modified: {id}"
    unique = {entry["src"]: (ROOT / entry["src"]).stat().st_size for entry in assets.values()}
    total = sum(unique.values())
    assert 0 < total <= MAX_PACKAGE, f"Integrated package exceeds 256MiB: {total}"
    assert max(unique.values()) <= MAX_FILE
    MANIFEST.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    # The generated runtime library must be regenerated by scripts/build.cjs
    evidence = {
        "schemaVersion": 1,
        "scope": "Phase 7 exact draft integrated 83-ID recording catalog; NOT heard or published",
        "candidateCount": 65,
        "phaseCounts": COUNT,
        "protectedCrownCount": len(frozen),
        "musicIds": 83,
        "totalAssetIds": len(assets),
        "uniqueEncodedBytes": total,
        "maxSingleEncodedBytes": max(unique.values()),
        "encodedBudgetBytes": MAX_PACKAGE,
        "perFileLimitBytes": MAX_FILE,
        "sources": SOURCES,
        "recordings": [
            {"id": cue, "phase": source[cue][0], "bpm": source[cue][1],
             "sha256": reports[cue]["sha256"],
             "encodedBytes": reports[cue]["encodedBytes"],
             "loop": reports[cue]["loop"],
             "duration": assets[cue]["duration"],
             "decodedPeak": reports[cue]["decodedPeak"],
             "decodedRms": reports[cue]["decodedRms"],
             "loopEdgeDelta": reports[cue]["loopEdgeDelta"]}
            for cue in sorted(source)
        ],
        "acceptance": {
            "source": "previous independent isolated authoring complete",
            "encodedRecordedCatalog": "verified in this draft installation only",
            "integratedRuntimePlayback": "PENDING focused tests",
            "audibleQuality": "UNVERIFIED; Phase 8 independent listening room",
            "ownerFirstAuditionAndAcceptance": "PHASE 9 ONLY",
            "merged": False, "deployed": False, "deviceVerified": False
        }
    }
    receipt = ROOT / "tools/audio/phase7-integration-evidence.json"
    receipt.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"PASS exact 65 replaced MP3s; 18 protected Crown SHAs; "
          f"83 IDs; {len(assets)} assets; {total} unique encoded bytes")
    print("Integration manifest/MP3 installation is DRAFT ONLY: no audition, merge or device check")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--render-root", type=Path, required=True)
    args = parser.parse_args()
    install(args.render_root.resolve())

if __name__ == "__main__":
    main()
