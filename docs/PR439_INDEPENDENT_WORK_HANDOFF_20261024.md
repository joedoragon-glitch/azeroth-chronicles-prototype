# PR #439 — Current independent continuation record

**24 October 2026 · draft/unmerged/unpublished · candidate dev.178**
**Repository:** `joedoragon-glitch/azeroth-chronicles-prototype`
**Branch:** `design/hero-skill1-self-taught-combat-20261024`

This record supersedes the earlier Area 2 CI-blocked / Area 3 unimplemented
handoff. The original conversation is not needed. Read the current branch and
[final focused review](HERO_SKILL1_AREA4_FINAL_REVIEW_20261024.md) first.

## Current state

- **Area 1:** three Skill 1 forms and independent basic/normal/charged clocks
  implemented; expanded native checks pass. Slow's debt reaches all positive
  hero timers. An oblique hawk-contact rounding defect was fixed and tested.
- **Area 2:** original class effects, offline audio and bilingual game guidance
  implemented. Both inherited CI blockers were reproduced/repaired. Native Canvas
  and focused audio/reference tests pass. Actual browser/device acceptance is
  still unconfirmed; do not claim visual/audio play certification.
- **Area 3:** owner-approved FIFO multi-entry queue implemented, with 16 pending
  requests, explicit rejection, stable identities, same-slot ordering and
  independent dispatch for other slots. Exact Charged→Normal and lifecycle/input
  tests pass. Hawk optional retreat families/exemptions audited and tested.
  See [implementation](HERO_SKILL1_AREA3_IMPLEMENTATION_20261024.md).
- **Area 4:** focused integrated review and deterministic action-economy evidence
  completed. The 38-file CI checkpoint passed at `6e18a094…`; additional original
  cooldown/form/opener/companion suites were repaired and passed locally afterward.
  **Check the live PR for the latest final-head CI status.** See the final review
  for all evidence boundaries and remaining browser/play acceptance.
- Published dev.177 main `ae0c0084c90a397738376f851d1d22c902c67279` is integrated,
  preserving bounded save recovery and audited runtime workload reductions.
- No merge, main push, deployment, publication, mark-ready or full-game/browser
  matrix is authorized. Keep this single draft. Do not separately merge #436 or
  begin unrelated #440.

## Authoritative contracts

1. [FIFO queue owner decision](HERO_SKILL1_AREA3_QUEUE_STACKING_DECISION_20261024.md).
   Same-slot Charged and Normal requests coexist and never implicitly replace or
   overtake one another. Other slots remain independent. Pending input is transient.
2. [Asymmetric cooldowns](ASYMMETRIC_TAP_CHARGED_COOLDOWNS_20261024.md).
   Charged starts both clocks; Normal starts only normal recovery. Charged needs
   both ready. Automatic basics are separate. Shield Stance and Silence retain
   native exceptions.
3. [Approved numerical design](HERO_SKILL1_FINAL_BALANCE_SPEC_20261024.md).
   Automatic basics 0.85s; normal Tap 3s; charged Cross 8s / wide Beam 7s / Hawk 8s,
   all with the existing training/Slow rules and one Skill 1 rank. No retuning was
   performed. Damage/geometry and all eight-slot details remain in that contract.
4. [Class/lore contract](HERO_SKILL1_SELF_TAUGHT_COMBAT_DESIGN_20261024.md),
   [A/V and bilingual scope](HERO_SKILL1_AV_AND_IN_GAME_GUIDANCE_SCOPE_20261024.md),
   [companion dependencies](HERO_SKILL1_COMPANION_DEPENDENCIES_20261024.md).
   Keep self-taught Rank 1, temporary names and literal Spanish names; no new lore,
   training gate, pet roster, ninth skill or copied third-party assets.

## Known limits and exact next action

Read the latest PR check before rerunning anything. The focused source-to-test
map is `.github/scripts/focused-ci.cjs`. No whole-game suite is needed by default.
The final review names browser and human play acceptance limits and inherited
art-tool/format failures. Playwright Chromium download failed in this environment;
DOM/native Canvas checks are not a replacement for actual browser play.

The deterministic 12-second observations preserve basic-only damage but increase
combined basic + activated output as intended. Review that during play; do not
silently change approved numbers or weaken bosses/companions to hide the change.

Continue on this branch with a bounded browser/play check when available, or
address specific owner feedback. Do not repeat the old Tap-precedence proposal or
reimplement the completed queue. Any release still requires separate owner
approval; a green PR does not authorize publication.
