#!/usr/bin/env python3
"""Shared source/technical quality safeguards for soundtrack Phases 4–7.

These deliberately do NOT infer aesthetic approval from quantitative checks.
A composer must supply independently derived *performed* MIDI, timing and
register evidence, not simply echo the same score through the same function.
The same protections are intended for Phase 5 boss/TRUE pairs, Phase 6 narrative
cues, and Phase 7 integrated cue validation.

Usage: python tools/audio/score-quality-controls.py path/to/metrics.json --expected-count 38 --layer-count 8
Preview metadata is verified without listening or publishing recordings.
"""
import argparse
import json
import math
from pathlib import Path


class QualityGateError(AssertionError):
    """A source or decoded-output invariant has failed."""


def require(condition, message):
    if not condition:
        raise QualityGateError(message)


def _event(event):
    """An actually sounded (beat, absolute MIDI pitch, duration) triple."""
    require(len(event) >= 3, "Performed notes need beat, absolute MIDI and length")
    beat, midi, duration = event[:3]
    require(all(isinstance(x, (int, float)) and math.isfinite(x)
                for x in (beat, midi, duration)), "Invalid performed note")
    require(duration > 0, "Nonpositive sounded note length")
    return (float(beat), int(midi), float(duration))


def verify_heritage(reference, candidate, *, cue, disposition="retained", reason=""):
    """Compare actual notes *after* key/chord shifts/overrides and registers.

    'Retained' is strict. An intentionally transformed or replaced motif is
    allowed only with a concrete documented reason, not a misleading pass.
    Return the number of events that really matched in pitch and beat.
    """
    require(disposition in ("retained", "transformed", "replaced"),
            cue + ": unknown motif disposition")
    if disposition != "retained":
        require(len(reason.strip()) >= 30,
                cue + ": intentional theme changes need concrete rationale")
    r = [_event(x) for x in reference]
    c = [_event(x) for x in candidate]
    require(bool(r) and bool(c), cue + ": empty source or performed phrase")
    matched = sum(abs(x[0] - y[0]) < 1e-4 and x[1] == y[1]
                  and abs(x[2] - y[2]) < 1e-4 for x, y in zip(r, c))
    fully_matched = len(r) == len(c) and matched == len(r)
    if disposition == "retained":
        require(fully_matched,
                cue + ": claimed-retained motif changed onsets, played pitch, "
                "duration, octave or event count")
    return {"cue": cue, "disposition": disposition,
            "matchedEvents": matched, "originalEvents": len(r),
            "candidateEvents": len(c), "exact": fully_matched}


def guard_unexplained_full_layer_copy(original_lead, additive_lead, *,
                                      cue, intentional_unison_reason=""):
    """Reject whole-lead copying into simultaneous action or TRUE layers.

    Partial unison, shared rhythmic signatures and deliberate accents ARE
    musically legitimate. A fully copied phrase is forbidden unless explicitly
    defended with a specific musical reason and mix/attack plan.
    """
    original = [_event(x) for x in original_lead]
    added = [_event(x) for x in additive_lead]
    require(len(original) >= 2 and bool(added),
            cue + ": insufficient additive voice evidence")
    original_signature = [(round(x[0], 3), x[1]) for x in original]
    added_signature = {(round(x[0], 3), x[1]) for x in added}
    copied = sum(x in added_signature for x in original_signature)
    is_full_copy = copied == len(original)
    if is_full_copy:
        require(len(intentional_unison_reason.strip()) >= 60,
                cue + ": complete simultaneous parent-lead duplication; "
                "requires an explicit approved arrangement/masking rationale")
    return {"cue": cue, "originalLeadEvents": len(original),
            "simultaneousUnisons": copied, "completeCopy": is_full_copy}


def guard_not_cloned_contexts(contexts):
    """Detect identical scored rhythms/forms/energy among unrelated families.

    Each input is {id, performedRhythm, form, energy, harmony}. Deliberate
    repeated leitmotifs may share a hook; this rejects an *entire* score
    fingerprint copied under a different location/character label.
    """
    seen = {}
    require(len(contexts) >= 2, "Need contrasting scene scores for clone review")
    for entry in contexts:
        name = entry["id"]
        signature = (tuple(tuple(x) for x in entry["performedRhythm"]),
                     str(entry["form"]),
                     tuple(entry["energy"]),
                     tuple(entry["harmony"]))
        require(bool(signature[0]) and bool(signature[1]),
                name + ": empty performed rhythm/form")
        require(signature not in seen,
                name + " clones complete arrangement structure from " +
                seen.get(signature, name) +
                " (changing instruments, names or story text is not enough)")
        seen[signature] = name
    return len(seen)


def verify_decoded_report(report, *, expected_cues, layer_count=None):
    """Portable decoded-preview safeguards, independent of phase label.

    Passes only isolated *engineering* metrics. Codec-edge checks inspect
    decoded samples; never substitute source PCM samples. Phase 7 needs
    separate real-browser measured cache/crossfade/warning checks.
    """
    tracks = report.get("tracks", [])
    require(len(tracks) == len(expected_cues),
            "Missing/extra decoded preview tracks")
    names = [r["cue"] for r in tracks]
    require(len(set(names)) == len(names) and set(names) == set(expected_cues),
            "Missing, duplicate or unexpected stable cue ID")
    require(report.get("crownFrozen") == 18 and
            report.get("musicRegistered") == 83,
            "Missing original 83-ID / 18-frozen music baseline")
    rate = report.get("sampleRateHz")
    require(isinstance(rate, int) and rate >= 32000,
            "Missing audio sample-rate measurement")
    total = 0
    for cue in tracks:
        key = cue["cue"]
        for field in ("decodedPeak", "decodedRms", "loopEdgeDelta",
                      "stereoSideRms", "foldedMonoPeak"):
            require(field in cue and isinstance(cue[field], (float, int)) and
                    math.isfinite(cue[field]), key + ": missing " + field)
        require(cue.get("channels") == 2, key + ": invalid stereo channels")
        require(0 < cue["decodedPeak"] < .98 and
                .004 < cue["decodedRms"] < .5,
                key + ": invalid level or clipping")
        require(cue["loopEdgeDelta"] < .005, key + ": decoded loop seam risk")
        require(cue["stereoSideRms"] > .0008 and
                cue["foldedMonoPeak"] < .98, key + ": stereo/mono translation")
        require(cue.get("decodedSamples", 0) >= cue.get("expectedSamples", 0),
                key + ": incomplete audio decode")
        require(cue.get("encodedBytes", 0) < 16 * 1024 * 1024,
                key + ": per-file encoded budget")
        bounds = cue.get("loop", {})
        require(0 <= bounds.get("start", -1) < bounds.get("end", -1),
                key + ": missing real decoded loop boundary")
        require(abs(cue["seconds"] - (bounds["end"] - bounds["start"])) < .0001,
                key + ": loop metadata disagrees with decoded clock")
        total += cue["encodedBytes"]
    if layer_count is not None:
        checks = report.get("actionOverlayChecks", report.get("layerChecks", []))
        require(len(checks) == layer_count, "Missing additive overlay checks")
        for item in checks:
            require(item.get("frames", 0) > 1000 and
                    0 < item.get("combinedPeak", -1) < .98 and
                    item.get("combinedRms", 0) > .01,
                    item.get("actionCue", item.get("layerCue", "?")) +
                    ": invalid synchronized overlay evidence")
    budget = report.get("budgetCeilingBytes")
    projection = report.get("phase4OnlyReplacementProjectionBytes",
                            report.get("candidateCatalogProjectionBytes"))
    require(isinstance(budget, int) and 0 < budget <= 1024**3,
            "Missing current encoded catalog budget")
    require(isinstance(projection, int) and 0 < projection < budget,
            "Isolated candidate projection exceeds current encoded cap")
    require(str(report.get("heardListeningStatus", "")).startswith("UNVERIFIED"),
            "Metrics cannot claim a perceptual hearing that did not occur")
    require(report.get("ownerAcceptance") == "PHASE 9 ONLY",
            "Owner's first listening and acceptance must remain Phase 9")
    require("UNPUBLISHED" in report.get("integration", ""),
            "This isolated candidate cannot assert game publication")
    return {"tracks": len(tracks), "encodedBytes": total,
            "layers": layer_count, "sourceQuality": "NOT CERTIFIED BY METRICS",
            "heard": "UNVERIFIED"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("metrics", type=Path)
    parser.add_argument("--expected-count", type=int, required=True)
    parser.add_argument("--layer-count", type=int, default=None)
    args = parser.parse_args()
    data = json.loads(args.metrics.read_text(encoding="utf-8"))
    actual = [t["cue"] for t in data["tracks"]]
    require(len(actual) == args.expected_count,
            "Expected count does not match decoded previews")
    print("PASS shared soundtrack source/technical quality controls:",
          verify_decoded_report(data, expected_cues=set(actual),
                                layer_count=args.layer_count))
    print("NEVER an acoustic audition, creative approval, integration, merge or deployment")


if __name__ == "__main__":
    main()
