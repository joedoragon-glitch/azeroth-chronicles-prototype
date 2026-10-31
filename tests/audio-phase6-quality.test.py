#!/usr/bin/env python3
"""Independent Phase 6 negative checks: break the score and demand failure.

These do not claim human listening or acoustic quality. Actual MP3 validation
runs in the separate focused Phase 6 GitHub Actions studio job.
"""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPOSER = ROOT / "tools/audio/phase6-compose.py"
spec = importlib.util.spec_from_file_location("sibdlp_phase6_tests", COMPOSER)
studio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(studio)


class Phase6SourceQuality(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(studio.SCORE.read_text(encoding="utf-8"))
        cls.original, cls.catalog, cls.frozen, _, cls.controls = studio.source_contract()

    def corrupt(self, mutate):
        candidate = copy.deepcopy(self.data)
        mutate(candidate)
        with tempfile.TemporaryDirectory() as tmp:
            temp_score = Path(tmp) / "score.json"
            temp_score.write_text(json.dumps(candidate), encoding="utf-8")
            previous = studio.SCORE
            studio.SCORE = temp_score
            try:
                with self.assertRaises((AssertionError, ValueError)):
                    studio.source_contract()
            finally:
                studio.SCORE = previous

    def test_no_unknown_cues_or_crown_unfreeze(self):
        self.assertEqual([c["id"] for c in self.data["cues"]],
                         ["title","defeat","finale"])
        self.assertEqual(len(self.frozen),18)
        self.assertTrue(set(c["id"] for c in self.data["cues"]).isdisjoint(
            set(self.frozen)))

    def test_original_title_motif_mutation_rejected(self):
        self.corrupt(lambda s: next(e for e in s["cues"][0]["events"]
            if e[6] == "lead").__setitem__(2, 75))

    def test_finale_transformed_third_corruption_rejected(self):
        self.corrupt(lambda s: next(e for e in s["cues"][2]["events"]
            if e[6] == "lead" and e[0] == 0 and e[1] == 2.7).__setitem__(2,77))

    def test_title_finale_are_not_same_theme_copied(self):
        self.assertNotEqual(studio.lead_notes(self.data["cues"][0])[:4],
                            studio.lead_notes(self.data["cues"][2])[:4])
        self.assertEqual([x[1] for x in studio.lead_notes(self.data["cues"][2])[:5]],
                         [69,74,78,81,76])

    def test_changed_late_finale_resolution_rejected(self):
        self.corrupt(lambda s: next(e for e in s["cues"][2]["events"]
            if e[6] == "lead" and e[0] == 15 and e[1] == 2.4).__setitem__(2,75))

    def test_accompaniment_harmony_drift_rejected(self):
        # Historical Phase 5 failure: melody unchanged, chord changed silently.
        self.corrupt(lambda s: s["cues"][0]["chords"][0].__setitem__(0,61))

    def test_hidden_octave_or_sample_overstretch_rejected(self):
        self.corrupt(lambda s: next(e for e in s["cues"][2]["events"]
            if e[6] == "lead" and e[0] == 9).__setitem__(2,90))

    def test_false_consonant_arrival_claim_rejected(self):
        self.corrupt(lambda s: s["cues"][1]["harmonicReview"].__setitem__(
            "earlyNonchord",[]))

    def test_full_note_stream_not_falsely_certified(self):
        first = studio.lead_notes(self.data["cues"][0])
        wrong = copy.deepcopy(first)
        wrong[-1][1] += 12
        with self.assertRaises(self.controls.QualityGateError):
            self.controls.verify_heritage(first, wrong, cue="title")

    def test_not_a_heard_review(self):
        self.assertIn("no game registration",self.data["status"].lower())
        self.assertIn("unresolved",self.data["commonMotif"]["description"].lower())


if __name__ == "__main__":
    unittest.main(verbosity=2)
