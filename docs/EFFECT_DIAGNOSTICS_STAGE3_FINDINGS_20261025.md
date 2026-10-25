# Azeroth Chronicles — Stage 3 effect visibility / frame-drop investigation

**25 October 2026 · Candidate:** [draft PR #471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471), originally pinned to main `e3c78266b28f3325d2afdcb76ae849fcff306deb`. This is an investigation record, **not** permission to merge, publish, change gameplay, or extend work to Stage 4.

**Evidence:** [focused GitHub Actions run 40219018261](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40219018261) — **PASS**, 16 selected test files; reproducible offline build/syntax verification passed; publish job **skipped**. Earlier exploratory failures were corrected as fixture interpretations, not production code fixes. The final passing tests are:
- `tests/effect-diagnostics-stage3.test.cjs`
- `tests/effect-diagnostics-stage3-party.test.cjs`
- Existing `tests/effect-diagnostics.test.cjs` and 13 other focused impact suites

## What was actually exercised

All tests run in Node with the repository's native Canvas 2D engine. They call genuine gameplay producers (`Campaign.cast`, `startAttack/resolveAttack`, `companionUseFirstSkill/SecondSkill`, charged-ability resolution, and `updateProjectiles`); they inspect the resulting actual events and production visuals, not only hand-written receipt fixtures.

- **Hero:** 48 successful real normal/charged casts (3 classes × 8 slots × 2 forms). Every cast created a real `heroSkillCast` receipt and queued cast identity. **33/48 cast-stage painters** produced nontransparent pixels in an isolated transparent Canvas test. **15/48 cast-stage painters intentionally produced no pixels**, with separate area/chain/displace/heal or live projectile ownership (listed below). The larger skill presentation **was not** rated missing based on the silent cast stage alone.
- **Boss:** real first authored attack from **each of the 11 boss families**: all emitted `boss/<family>/0` release receipts; **28** actual queued enemy VFX stages across those attacks, and **11/11** representative enemy art scenes had positive-alpha procedural pixels. One event was explicitly audio-only. Other 43 boss attack slots and all TRUE variants were not natural-pixel verified by this new suite.
- **Pets:** real Skill 1 and properly charged Skill 2 on **all eleven pet families = 22 successful actions**. Each emitted its real `petSkill` event, was accepted by the queue, and painted nontransparent pixels in the pet painter (**22/22**); 32,694 aggregate positive-alpha pixels across these small isolated captures, **not** an estimate of player-screen coverage.
- **Soldier/Archer:** four real distinct skills: Soldier Power Strike and Holy Cleave, Archer Triple Shot and Piercing Volley. Triple Shot launched three actual delayed projectiles; both charged skills produced real area cues. Arrow state moved under **20, 30 and 60 simulation steps/s**. This confirms actual motion in deterministic gameplay logic, not mobile presentation smoothness.
- **Full renderer:** one natural Paladin Skill 1 cast changed **310 RGB pixels** in a complete production Canvas scene relative to a matching idle frame, with Stage 2's diagnostic marking the cast painter. The campaign snapshot was unchanged by recording/drawing. Do not extrapolate the RGB count to every skill/device.
- **Synthetic draw starvation:** at 20/30/60 simulation steps/s, a real Paladin Skill 1 normal **0.22s cast cue** expired with **zero painter calls** when drawing was intentionally withheld for about 0.25 seconds (5, 8, 15 callbacks respectively). The existing renderer ages queue life before attempting the next draw. **This proves a failure mechanism under forced starvation**, not that any device ordinarily misses five, eight, or fifteen consecutive callbacks; existing adaptive-skip rules are much more constrained.
- **Synthetic crowd event pressure:** 100 `game.event('hit')` receipts and one `heal` were passed through the real 40-entry queue. **61** transients were dropped (101 prospective candidates minus 40 retained); the high-priority heal survived. This is an intentional workload fixture, **not** proof that a natural encounter generated 100 simultaneous hits.
- **Status stack:** a real status Canvas painter with Weaken, Fracture, Taunt, Slow and Silence produces **the identical image as only the first three** (the fourth/fifth are intentionally truncated). A field containing **25** eligible status-bearing enemies produces the same image as the first **24**. This is **visually proven suppression by the current display budget**, not loss of the underlying status or combat effect.

## Silent 'cast' stages (not automatically missing skills)

The source `hero-presentation.js` only paints some normal `stage: 'cast'` forms; other skills rely on their actual **effect stage or live projectile**. The isolated cast-painter test listed these **15**:

| Class | Normal skill(s) | Alternate real receipt or state observed |
|---|---|---|
| Paladin | 5 Holy Area, 7 Holy Assault, 8 Sanctuary Oath | Area/impact; Sanctuary Oath also emitted heal |
| Mage | 1 Arcane Beam, 2 Frost Bolt, 6 Magic Shot | Active physical projectiles |
| Mage | 5 Force Pulse | Area + displace |
| Mage | 7 Arcane Chain | Chain stage |
| Mage | 8 Astral Detonation | Area/impact |
| Ranger | 1 Rapid Arrows, 2 Pinning Shot, 6 Repelling Shot, 7 Piercing Arrow | Active physical arrow projectiles |
| Ranger | 5 Arrow Volley | Area/impact |
| Ranger | 8 Hunter's Salvo | Area and two physical projectiles |

**Interpretation caution:** these are **15 legitimate non-painted CAST-STAGE attempts**; a simple count of `identities[].painted` from Stage 2 does not prove pixels. During Stage 3, a `painted=1` recorder counter can coincide with zero alpha from a deliberately empty `cast` branch. The developer report correctly states that it captures *painter calls*, not real pixel certification. Stage 4 must avoid trying to forcibly draw 15 duplicate cast flashes without first checking actual visible area/projectile ownership.

## Prioritized, grounded Stage 4 candidates

1. **First eligible paint vs expiration.** The actual transient lifetime is advanced before the draw gate. A short cue can expire without a painter call under sufficient render starvation. Stage 4 should target an **essential cue only**, preserve FPS/adaptive budgets, and never force redraws or extend unrelated contact clutter. Confirm any proposed fix with a real schedule and alpha-pixel comparator.
2. **Status priority and overflow.** Three glyphs per foe and 24 status-bearing foes are confirmed. In highly stacked scenarios Silence and Slow can be hidden by earlier glyphs; an important boss can be omitted after the first 24 eligible enemies. Consider priority/target relevance and minimal overflow affordance, respecting the same draw budget.
3. **Queue priority versus natural crowd evidence.** The 40-entry drop mechanism was exercised, while high-priority heal survived. Do not raise the queue limit without a **natural producer** stress trace. Investigate whether repeated low-value hits can hide an essential cue, rather than treating all dropped cosmetic impacts as bugs.
4. **Instrument interpretation.** Stage 2 is strictly opt-in developer telemetry and has no pixel readback; Stage 3 performed pixel readback **in tests only**. If Stage 4 adds more diagnostic clarity, use bounded developer-only sampling; do not put `getImageData`, screenshots, or per-frame extra work into normal gameplay.

## What Stage 3 cannot certify

- **Actual owner hardware FPS/pacing, thermal behavior, GPU completion, touch latency or in-the-wild drop frequency.** No physical phone/Chromebook report was exported because PR #471 remains an isolated unmerged draft and is not running in the published game. No user homework was requested.
- **Natural reachability and visual visibility of all 264 enemy IDs.** The preexisting canonical inventory and browser tests cover recipes and synthetic stages, but the new natural gameplay-to-Canvas checks exercised the first attack of eleven bosses. Other rotations, seven captain groups, TRUE variants and every Rogue signature need targeted future acceptance before their live visual reliability is certified.
- **WebGL/Pixi overlay equivalence, reduced motion, night lighting, 100/150/175% zoom, dynamic camera stress and device-specific crowd battles.** Existing tests cover some of those separately, but the new Stage 3 candidate did not gather new natural-play, paired pixel evidence for every combination. An old or other-branch test pass must not be reported as this Stage 3 proof.
- **Reproducible hardware performance regression delta.** The opt-in Stage 2 export correlates effect counters with frame-time history; the automated CI run provides correctness evidence, **not** Chromebook/phone cost measurements. The recorder remains off by default and its own CPU overhead is not benchmarked by hardware.

## Resolution and handoff

**Stage 3 source-backed automated investigation is complete on draft PR #471.** Real producers, native pixels, intentionally silent stage boundaries, deterministic frame-rate variations, buffer-overflow behavior, and status caps are documented. There was **no gameplay fix** in Stage 3; only two targeted new tests and this evidence document were added. No player-facing background task, per-frame sampling, image capture or network feature was added.

**Stage 4 remains unstarted** and should be separately owner-authorized. Proposed changes must be small, mechanics-preserving, performance-budgeted and may need paired, opt-in actual-device diagnostics. Keep this draft unmerged/unpublished and avoid PR #440 / #449 changes. Maintain the multi-file PWA architecture.
