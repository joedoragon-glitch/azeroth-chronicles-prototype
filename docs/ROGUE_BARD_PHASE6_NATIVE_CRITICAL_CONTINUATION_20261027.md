> **Historical phase record (28 October 2026):** [PR #511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511) merged and Rogue is playable. Draft status and instructions to resume or release its old phases below describe 27 October, not current work or authorization. Use [Development state](DEVELOPMENT_STATE.md), current source, and the [Rogue soft launch](ROGUE_SOFT_RELEASE_20261028.md) for current status and acceptance.

> **Developer-only correction (owner-confirmed, 27 October 2026):** The Rogue critical-intensity category is strictly an authored development parameter, **not a player setting**. There must be no in-game sliders, profile preference, or save migration for it. The earlier settings work in this PR has been reversed; see implementation record below.

# Rogue Bard — Phase 6 implementation and validation checkpoint (27 October 2026)

> Draft PR [#511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511), branch `design/rogue-bard-feasibility-20261026`. **UNMERGED, UNDEPLOYED, Rogue class not publicly registered.** This is a continuing technical candidate; do not confuse staging or focused CI with owner acceptance.

## Baseline and concurrent-change protection

Before modifying, read [Phase 5–6 restart checkpoint](ROGUE_BARD_PHASE5_PHASE6_RESTART_CHECKPOINT_20261027.md), Phase 5 repertoire, critical-tier matrix, Phase 4 companion checkpoint and eight-phase handoff. PR head was `529e22afda6c461d84eb86ee933be3e614eb7b21`; main was `5c6197e871f8f4393d26d9b7a261b9324ef85d12`, with **0 commits behind**. The focused GitHub workflow at that exact baseline was successful: [40523984339](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40523984339). The commits below are additive draft-branch changes only.

## Implemented candidate

- `hero-combat.js`: Skills **2–8, tap and charged**, now release **one** existing native Party critical receipt at legal cast commitment. Existing registry identity remains `hero/rogue/<slot>-<tap|charged>`. The receipt selects exactly **one** authored lever; no rolls occur at enemy contact, station pulses, healing ticks, effects updates, or individual ally application. The other half of each mirrored performance retains its baseline. Invalid/blocked/unfinished casts do not enter this release.
- The authored lever mapping is unchanged: 2 Slow duration / Quickstep duration; 3 real interrupt debt / eligible hush duration; 4 finite allied Mending HoT total budget in both forms; 5 station Slow duration / inside-only ward strength; 6 non-ready hostile debt / Borrowed Time duration; 7 push distance / finite Weaken duration; 8 real blast damage / eligible hush duration. Baseline target/LOS caps, cooldowns, scripted restrictions and no-boss-hush gates remain as they were before this slice.
- `party.js`: a critical Skill 4 can enlarge the one finite per-recipient original Mending budget beyond the ordinary 5% cap, **only** to a 7.5%-of-max-HP safety ceiling (authored Level 3 yields 7.25%). The existing nonstacking single-family budget/expiry rules and other heals remain unchanged.
- **Owner correction (later 27 October): critical intensity is developer-authored tuning only**, NOT a player setting. The mistakenly added bilingual Rogue sliders, profile persistence/migration, and `app.js` profile reapplication were explicitly reverted. `critical-levels.js` supplies the independent `rogue` group (default Level **2** across Normal/Nightmare/Developer), while the `createTuning` / native `setCriticalLevel` API continues to support *developer/test-only* validated Levels 1–3 and mode overrides. No game-menu UI, player-facing sliders, profile/save fields, or player override has been introduced. Frozen action receipts retain their authored level; Hero/Companion/World and Party/World RNG remain independent.
- Test-only Rogue class registration and the existing 12%-from-automatic-primary-only Charm ownership remain unmodified. Canonical Canvas, experimental PixiJS, art, PWA and the multi-file architecture are untouched.

## New regression coverage

- `tests/rogue-bard-critical-performances.test.cjs`: 14 distinct native releases × Level 1/2/3, one lever application per legal cast, no second roll for cooldown-rejected casts, no Charm coupling, valid campaign snapshot and transient budget isolation.
- `tests/rogue-bard-critical-authoring.test.cjs`: developer-only default/mode authoring, separate Hero/Companion/World levels, rejected invalid levels, absent player controls/profile fields and save-state isolation. The earlier player-preference test was deleted as incompatible with the owner's clarification.
- Retain and rerun `tests/rogue-bard-critical-skill1.test.cjs`, `tests/critical-levels.test.cjs`, `tests/rogue-bard-phase4-companions.test.cjs`, `tests/rogue-bard-phase5-repertoire.test.cjs`, `tests/sprite-scope.test.cjs`, plus impacted regressions and reproducible build. **CI results are SHA-specific**; this file does not assert the new head is green until GitHub confirms it.

## Historical acceptance and holds at this checkpoint

> 1. Inspect the new head's focused-test results, logs and reproducible build; repair genuine failures, then update evidence. Run native station-timing and boss legality tests against actual warned/phase-protected behaviors; pay particular attention to delayed station pulses, DoT/HoT budget, collision-safe push and the difference between a missed lawful negative lever and a new forbidden effect.
> 2. Verify no Rogue critical-intensity control appears in any player settings route (including mobile, title screen and Developer-mode gameplay). Test developer-authored levels across all modes, release immutability, campaign reload, older saves and Succession. Browser/device acceptance is still outstanding, but **player-facing critical slider acceptance is no longer a requirement**.
> 3. **Owner review still required** for Skill 5's provisional placed music station, cheeky working performance names and boss control. Do not silently impose generic boss immunities or alter deliberate strong control rotations. Current charged non-boss hush is an implementation boundary requiring explicit review, not a new universal balancing policy.
> 4. Further matched combat/performance measurements, visual/audio parity, Succession, historical save compatibility, Phase 7 art/audio/tutorial and end-to-end Phase 8 are not accepted from this code slice alone.
> 5. Remain **draft and unmerged**; do not deploy, enable public fourth-class selection or trigger external publication without explicit approval.

**Authority:** The [restart checkpoint](ROGUE_BARD_PHASE5_PHASE6_RESTART_CHECKPOINT_20261027.md) remains the record of the earlier three-release state; this document records the later proposed Phase 6 implementation, its evidence boundary and unresolved verification.
