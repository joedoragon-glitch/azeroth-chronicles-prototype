#!/usr/bin/env python3
"""Permanent mutation tests for cross-phase soundtrack quality safeguards.

Negative cases reproduce real Phase 3/4 failure classes so a green codec test
can never quietly reinstate them. No listening is claimed.
"""
import copy
import importlib.util
from pathlib import Path

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "shared_score_quality", root / "tools/audio/score-quality-controls.py")
quality = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quality)


def must_reject(action, expected):
    try:
        action()
    except quality.QualityGateError as exc:
        assert expected.lower() in str(exc).lower(), (expected, str(exc))
    else:
        raise AssertionError("Quality gate incorrectly passed broken fixture: " + expected)


old = [[0, 60, .6], [1, 62, .5], [2.5, 64, .8]]
assert quality.verify_heritage(old, copy.deepcopy(old),
                              cue="pilot-heritage")["exact"]
# Production regression #1: incorrect harmony offset and later octave cannot
# be declared "retained" merely because the original motif is in JSON.
wrong_harmony = [[0, 60, .6], [1, 64, .5], [2.5, 66, .8]]
must_reject(lambda: quality.verify_heritage(
    old, wrong_harmony, cue="pilot-heritage"), "claimed-retained")
wrong_octave = copy.deepcopy(old)
wrong_octave[2][1] += 12
must_reject(lambda: quality.verify_heritage(
    old, wrong_octave, cue="pilot-heritage"), "claimed-retained")
must_reject(lambda: quality.verify_heritage(
    old, wrong_octave, cue="pilot", disposition="transformed"),
    "concrete rationale")
assert not quality.verify_heritage(
    old, wrong_octave, cue="pilot", disposition="transformed",
    reason="Intentional high register at the final note to expose the antagonist's reaching, failed ascent.")["exact"]

# Production regression #2: parent playing underneath its duplicate action
# theme is NOT counterpoint. Intentional partial unison remains allowed.
must_reject(lambda: quality.guard_unexplained_full_layer_copy(
    old, copy.deepcopy(old), cue="boss-test-true"), "complete simultaneous")
new_counterline = [[.5, 67, .6], [1.5, 65, .4], [3, 62, .5]]
assert not quality.guard_unexplained_full_layer_copy(
    old, new_counterline, cue="boss-test-true")["completeCopy"]
must_reject(lambda: quality.guard_unexplained_full_layer_copy(
    old, copy.deepcopy(old), cue="boss-test-true",
    intentional_unison_reason="drums"), "complete simultaneous")

# Production regression #3: eight copies of the same rhythmic/harmonic
# skeleton with renamed instruments and a unique prose scene don't count as
# eight character compositions.
prototype = {"id": "boss-test", "performedRhythm": [[0, 0, .5], [2, 3, .7]],
             "form": "HHAQ", "energy": [.7, .8, 1], "harmony": [0, 3, 4, 0]}
other = copy.deepcopy(prototype)
other["id"] = "boss-another"
must_reject(lambda: quality.guard_not_cloned_contexts(
    [prototype, other]), "clones complete arrangement")
other["performedRhythm"] = [[.4, 0, .7], [1.5, 2, .6]]
assert quality.guard_not_cloned_contexts([prototype, other]) == 2


def track(name):
    return {"cue": name, "seconds": 1., "channels": 2,
            "encodedBytes": 25000, "decodedPeak": .55,
            "decodedRms": .055, "loopEdgeDelta": .00002,
            "stereoSideRms": .012, "foldedMonoPeak": .45,
            "decodedSamples": 65000, "expectedSamples": 57300,
            "loop": {"start": .15, "end": 1.15}}


report = {"tracks": [track("boss-one"), track("boss-one-true")],
          "sampleRateHz": 44100, "crownFrozen": 18, "musicRegistered": 83,
          "actionOverlayChecks": [
              {"actionCue": "boss-one-true", "frames": 44100,
               "combinedPeak": .75, "combinedRms": .08}],
          "budgetCeilingBytes": 256*1024*1024,
          "phase4OnlyReplacementProjectionBytes": 48*1024*1024,
          "heardListeningStatus": "UNVERIFIED; no listening",
          "ownerAcceptance": "PHASE 9 ONLY",
          "integration": "UNMERGED / UNPUBLISHED"}
assert quality.verify_decoded_report(
    report, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1)["tracks"] == 2
broken = copy.deepcopy(report)
broken["tracks"][0]["loopEdgeDelta"] = .04751
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "decoded loop seam")
broken = copy.deepcopy(report)
broken["tracks"][0]["stereoSideRms"] = 0
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "stereo/mono")
broken = copy.deepcopy(report)
broken["tracks"][0]["decodedSamples"] = 1000
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "incomplete audio")
broken = copy.deepcopy(report)
broken["tracks"][1]["cue"] = "boss-one"
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "duplicate")
broken = copy.deepcopy(report)
broken["actionOverlayChecks"] = []
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "missing additive")
broken = copy.deepcopy(report)
broken["crownFrozen"] = 17
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "18-frozen")
broken = copy.deepcopy(report)
broken["heardListeningStatus"] = "PASSED by CI"
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "cannot claim")
broken = copy.deepcopy(report)
broken["phase4OnlyReplacementProjectionBytes"] = 300*1024*1024
must_reject(lambda: quality.verify_decoded_report(
    broken, expected_cues={"boss-one", "boss-one-true"},
    layer_count=1), "exceeds")
print("PASS shared cross-phase quality mutation controls: performed-note "
      "mismatch, false retained motif, copied layer, cloned rhythmic/harmonic "
      "skeleton, loop click, stereo, decode, ID, overlay, Crown, release and budget")
print("NOT verified: genuine human hearing, emotional quality, live transitions")
