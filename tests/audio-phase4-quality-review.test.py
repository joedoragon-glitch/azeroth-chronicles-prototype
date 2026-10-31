#!/usr/bin/env python3
"""Adversarial Phase 4 musical-source review, NOT an audio audition.

Tests actual inherited pitch/onset expressions, eight additive counterlines,
15 contextual rhythmic/acoustic palettes and seven canonical inhabited rooms.
This would have caught the previous incorrect pilot harmonic inheritance and
generic action H duplication before any encoded 'GO' claim.
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
script = ROOT / "tools/audio/phase4-compose.py"
spec = importlib.util.spec_from_file_location("phase4_source_under_test", script)
phase4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(phase4)
phase3, original, catalog, frozen, bases, pilots, data = phase4.score_contract()

PILOT_HERITAGE = ("place-vale", "place-archive")
original_renderer = original.load_renderer()
recovered_pilot_notes = 0
action_counterline_bars = 0
heritage_bars = 0
for name in PILOT_HERITAGE:
    theme = bases[name]
    pilot = pilots[theme["pilotFamily"]]
    perf = pilot["performance"]
    overrides = dict(perf["leadOverrides"])
    overrides.update(theme["pilotLeadOverrides"])
    for bar, harmony in enumerate(pilot["harmony"]):
        actual, is_absolute = phase4.heritage_notes(theme, bar, pilots)
        assert is_absolute, (name, bar)
        original_events = overrides.get(str(bar))
        if original_events is None:
            original_events = [
                [at, degree + perf["leadShifts"][bar], duration]
                for at, degree, duration in
                pilot["cells"][pilot["phrases"][bar]]
            ]
        expected = [[e[0], e[1] + harmony, e[2],
                     e[3] if len(e) > 3 else 0] for e in original_events]
        assert actual == expected, (
            name, bar, "The actually played source uses chord + lead degree, "
            "not bare relative degrees. Original motif pitches changed."
        )
        recovered_pilot_notes += len(expected)
        # Check the entire played contour, not just the first two 'heritage'
        # bars: same sounding pitch and same onset as the original producer.
        mode = pilot["mode"]
        root = pilot["root"]
        for (at, deg, _, chromatic), ev in zip(actual, original_events):
            expected_pitch = (root + 12 +
                              original_renderer.degree(
                                  harmony + ev[1], mode) +
                              (ev[3] if len(ev) == 4 else 0))
            played_pitch = root + 12 + original_renderer.degree(
                deg, mode) + chromatic
            assert played_pitch == expected_pitch and at == ev[0]

for cue in data["arrangements"]:
    theme = bases.get(cue["parent"])
    room = data["interiors"].get(cue["parent"])
    for bar in range(cue["bars"]):
        kind, notes, absolute = phase4.phrase_material(
            cue, theme, room, bar, pilots)
        assert kind in ("rest", "heritage", "interior-heritage",
                        "counterline", "answer", "question")
        if cue["kind"] == "action" and cue["form"][bar] == "H":
            assert kind == "counterline" and notes == cue["answer"]
            # The earlier score redundantly retriggered every base melody
            # attack and was wrongly called a proper additive arrangement.
            original_notes, _ = phase4.heritage_notes(theme, bar, pilots)
            assert notes != original_notes, (cue["id"], bar)
            action_counterline_bars += 1
        elif cue["form"][bar] == "H":
            assert kind in ("heritage", "interior-heritage")
            assert notes and not (theme and kind != "heritage")
            heritage_bars += 1
        elif cue["form"][bar] == "R":
            assert not notes and kind == "rest"

assert action_counterline_bars > 30 and heritage_bars > 70
# The first Cellars kitchen phrase is preserved by actual note/onset, not by
# a paragraph saying the old prototype was requalified.
old_cellar = pilots["orchard-cellars"]["cells"]["kitchen"]
current_cellar = phase4.parse_room_cell(
    data["interiors"]["side-vale-cellars"]["motif"])
assert current_cellar == [[float(at), degree, float(length)]
                          for at, degree, length in old_cellar]
assert "Phase 2" in data["interiors"]["side-vale-cellars"]["heritage"]

canon = {
    "supply-vale": ("Scornfang", "household", "ledgers"),
    "supply-march": ("Mirejaw", "three-cache", "guarded"),
    "supply-highlands": ("supper", "games", "residence"),
    "side-vale-cellars": ("families", "children", "preserves"),
    "side-march-watchhouse": ("inhabited", "nests", "fish racks"),
    "side-highlands-signal": ("active", "Ogre", "supper"),
    "side-frontier-shrine": ("Orc", "barracks", "ritual"),
}
for key, tokens in canon.items():
    scene = data["interiors"][key]["scene"]
    assert all(word.lower() in scene.lower() for word in tokens), (key, scene)
    assert "vacant" not in scene.lower() and "abandoned" not in scene.lower()
    pair = [a for a in data["arrangements"] if a["parent"] == key]
    assert len(pair) == 2 and all(
        all(token.lower() in a["sceneIntent"].lower() for token in tokens)
        for a in pair
    ), key

unique_grooves = {json.dumps(g, sort_keys=True)
                  for g in data["groovePalettes"].values()}
unique_acoustics = {json.dumps(g, sort_keys=True)
                    for g in data["acousticPalettes"].values()}
arcs = {tuple(a["arc"]) for a in data["arrangements"]}
assert len(unique_grooves) == 15 and len(unique_acoustics) == 15
assert len(arcs) >= 20, "Macro arcs must not be cloned by generic role"
assert len({tuple(tuple(x) for x in a["answer"])
            for a in data["arrangements"] if a["kind"] == "action"}) == 8
assert len(data["actionAccents"]) == 8
print("PASS Phase 4 adversarial SOURCE audit:",
      recovered_pilot_notes, "notes of inherited full-score pilot heritage,",
      action_counterline_bars, "true action H counterline bars,",
      heritage_bars, "non-action heritage bars; 15 distinct groove/acoustic",
      "profiles, 8 scene-specific combat accents, 7 current inhabited interiors.")
print("NOT certified: played sound, perceived drama, transition/masking,",
      "two-loop fatigue, device output or owner Phase 9 acceptance.")
