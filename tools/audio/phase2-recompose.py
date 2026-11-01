#!/usr/bin/env python3
"""Revised Phase 2 score workshop. Eight NEW previews, isolated from live audio."""
import argparse
import ast
import importlib.util
import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BOOK = ROOT / "tools/audio/phase2-pilots-v2.json"
ENSEMBLE = ROOT / "tools/audio/phase2-ensemble.py"
SOURCE = ROOT / "tools/audio/phase2-composer.py"


def module_from_path(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def quality_contract():
    original = module_from_path(SOURCE, "phase2_original_baseline")
    _, catalog, frozen = original.check_contract()
    book = json.loads(BOOK.read_text(encoding="utf-8"))
    assert book["schemaVersion"] == 2
    ast.parse(ENSEMBLE.read_text(encoding="utf-8"), filename=str(ENSEMBLE))
    assert len(book["families"]) == 4
    ids = []
    reports = []
    for f in book["families"]:
        p = f["performance"]
        bars = f["bars"]
        assert 8 <= bars <= 24 and len(f["harmony"]) == bars
        assert len(f["phrases"]) == bars
        assert len(f["cues"]) == 2
        assert len(p["identity"]) >= 55
        for name in ("energy", "figures", "secondFigures", "leadShifts"):
            assert len(p[name]) == bars, (f["family"], name)
        assert len(p["sections"]) >= 3
        assert p["sections"][0][0] == 0 and p["sections"][-1][1] == bars
        assert all(p["sections"][i][1] == p["sections"][i+1][0]
                   for i in range(len(p["sections"]) - 1))
        assert len(set(p["figures"])) >= 4
        assert len(set(p["secondFigures"])) >= 4
        assert max(p["energy"]) - min(p["energy"]) >= .35
        assert all(.15 <= v <= 1.2 for v in p["energy"])
        if "peacePhrases" in f:
            assert len(p["peaceEnergy"]) == bars and len(p["peaceShifts"]) == bars
        assert len(f["cells"]) >= 5
        for part in ("leadOverrides", "counterpoint", "peaceOverrides",
                     "peaceCounterpoint", "trueCounterpoint"):
            for index, notes in p.get(part, {}).items():
                assert 0 <= int(index) < bars
                for event in notes:
                    assert len(event) == (5 if "Counterpoint" in part or
                                          part == "counterpoint" else 3)
                    assert 0 <= event[0] < 4 and event[2] > 0
        for cue in f["cues"]:
            id = cue["id"]
            assert id in catalog["assets"] and id not in frozen
            assert catalog["assets"][id]["kind"] == "music"
            ids.append(id)
        reports.append({"family": f["family"], "sections": len(p["sections"]),
                        "baseFigures": len(set(p["figures"])),
                        "otherFigures": len(set(p["secondFigures"])),
                        "dynamicRange": round(max(p["energy"])-min(p["energy"]),3),
                        "authoredLeadOverrides": len(p.get("leadOverrides",{})),
                        "motifIdentity": p["identity"]})
    assert len(ids) == len(set(ids)) == 8
    return original, catalog, frozen, book, reports


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--render", type=Path, metavar="OUTSIDE_REPO_DIR")
    args = parser.parse_args()
    if not args.check and args.render is None: parser.error("Specify --check or --render")
    original, catalog, frozen, book, design = quality_contract()
    print("PASS: 83 original music IDs, 65 allowed, 18 Crown audio hashes, four authored performance plans")
    if args.render is None: return
    out = args.render.expanduser().resolve()
    if out == ROOT or out.is_relative_to(ROOT):
        parser.error("Never stage preview MP3s inside the repository")
    encoder = original.find_ffmpeg()
    if not encoder: parser.error("ffmpeg/imageio-ffmpeg required")
    out.mkdir(parents=True, exist_ok=True)
    original_renderer = original.load_renderer()
    ensemble = module_from_path(ENSEMBLE, "phase2_revised_ensemble")
    metrics = []
    overlays = []
    import numpy as np
    for family in book["families"]:
        stems = []
        for cue in family["cues"]:
            samples, rate = ensemble.render_stem(family,cue["part"],original_renderer)
            stems.append(samples)
            item = original.encode_stem(out,cue["id"],samples,rate,encoder)
            metrics.append(item)
            print("Rendered revised pilot",cue["id"],item["seconds"],"sec",flush=True)
        if stems[0].shape != stems[1].shape:
            raise RuntimeError("Paired stems lack the same musical clock")
        second = family["cues"][1]["part"]
        gain = .55 if second == "true" else (.5 if second == "action" else 0)
        if gain:
            combined = .85*stems[0] + gain*stems[1]
            peak = float(np.max(np.abs(combined)))
            if peak >= .98: raise RuntimeError("Additive pilot clipping: "+family["family"])
            overlays.append({"family":family["family"],"baseGain":.85,
                             "secondGain":gain,"peak":round(peak,5),
                             "rms":round(float(np.sqrt(np.mean(combined**2))),5)})
        else:
            overlays.append({"family":family["family"],"mode":"alternate"})
    catalog_bytes = sum((ROOT / item["src"]).stat().st_size
                        for item in catalog["assets"].values()
                        if item.get("src","").startswith("./assets/audio/"))
    original_bytes = sum((ROOT / catalog["assets"][m["cue"]]["src"]).stat().st_size
                         for m in metrics)
    new_bytes = sum(m["encodedBytes"] for m in metrics)
    projected = catalog_bytes-original_bytes+new_bytes
    report = {"schemaVersion":2,"scope":"unpublished revised Phase 2 source studies",
              "musicRegistered":83,"crownFrozen":18,"pilotFamilies":4,
              "pilotStems":metrics,"pilotPairOverlays":overlays,
              "authoredStructure":design,
              "encodedBudgetBytes":original.LIMIT_BYTES,
              "originalCatalogBytes":catalog_bytes,
              "pilotReplacementProjectionBytes":projected,
              "headroomAfterPilotProjectionBytes":original.LIMIT_BYTES-projected,
              "limitations":"No owner/independent musical listening, in-game mix or device QA. Four-family source arrangements only."}
    (out / "pilot-metrics.json").write_text(json.dumps(report,indent=2)+"\n")
    original.check_contract()
    if report["headroomAfterPilotProjectionBytes"] < 0:
        raise RuntimeError("Eight-pilot replacement projection exceeds total encoded budget")
    print("PASS: revised eight MP3s decoded/synchronized; original Crown disk hashes unchanged")


if __name__ == "__main__":
    main()
