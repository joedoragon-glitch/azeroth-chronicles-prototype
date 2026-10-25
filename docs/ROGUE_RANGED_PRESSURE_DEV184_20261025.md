# Azeroth Chronicles — Rogue ranged-pressure investigation, dev.184

**Date:** 25 October 2026  
**Branch base:** published `main` `8215ab0f301a88cf3b4a55659001cae6ef05db0b` / `0.9.1+snapshot.dev.184`  
**Status:** Independent investigation — no change to combat rules, tuning, assets, save contracts or PWA version.

## Why this is separate

PR #459 has **already shipped** the director-approved captain/guardian healing and the two-second retreat-first Rogue follow-up (#454 + #455). Do not cherry-pick those commits, revert them, or reopen their implementation. Prior merged #429/#451 Slow protection and #453 territorial retreat/emergency support are the authoritative baseline.

The historic suggestion to raise ordinary Rogue initiation to 520 units is **not accepted**. It would not address an upstream target-selection gate and would change many matchups without proving a defect. This audit must demonstrate whether an attacked enemy with actual ranged pressure is still unfairly passive after the shipped retreat-first behavior.

## Verified source boundaries at dev.184

- `combat.js:tacticalHighestThreatTarget`: unfortified ordinary, guardian, Ringleader **and captain** target selection normally ends at 360 units. Boss target selection ends at 500. Fortified ranged enemies may use their own shot range; do not generalize these numbers to them.
- `engine.js:tacticalRogueMove`: legal distance is 340/440/500 multiplied by `balance.enemySpecialReachMultiplier = 1.2`, yielding ordinary/guardian/Ringleader **408**, captain **528**, boss **600**. Move initiation still needs the upstream selected target and line of sight.
- `combat.js:tacticalRogueEligibility`: a healthy equally leveled ordinary enemy facing one actual attacker ordinarily fails the two-source pressure threshold. Wounding below the threshold, hero level advantage, or a second active attacker can change eligibility. Boss/captain summon and cunning exceptions remain separate. Do not bypass these protections blindly.
- `fortifications.js:enemyAcquisitionRange`: ordinary passive aggro uses `260 × 1.1 = 286` unless ranged fortification rules enlarge it. An actual successful incoming attack instead triggers existing `combat.damage` engagement; passive acquisition range and Rogue response are different contracts.
- `engine.js:tacticalAutoRogue`: requires an engaged actor, no committed attack, the already-shipped cooldown/warning safeguards, and Rogue eligibility. The thinking/regroup/escape decision has its own timing and territory restrictions.

## Focused Phase 2, first commit: diagnostic matrix

The new `tests/rogue-ranged-pressure-audit.test.cjs` uses native actor types, real threat-recording, actual eligibility and threat-selection functions, and actual tactical-move creation. It records **Ranger, Mage and Archer** sources at **350, 400, 450, 480** and additional 520/560 boundary probes for ordinary, guardian, Ringleader, captain and boss roles. It asserts established rules and reports structured matrix rows. A separate two-attacker comparison tests the independent eligibility threshold.

**Evidence limitation:** the initial matrix intentionally supplies unobstructed sightlines and seeds a recent damage record using the game's genuine threat ledger. It does **not** launch a class-specific projectile, simulate a full frame-by-frame pursuit/escape, prove a legal input at every displayed distance, or certify actual contact/damage or human fairness. It is a deterministic gate-mapping checkpoint, not a balance change or a claim of completed gameplay testing.

## Next independently gated investigations

1. **Source/CI gate:** run only the new diagnostic and repository-selected focused architecture checks on the exact PR head. Record matrix and verify no surprise regression.
2. **Native encounter gate:** add a second narrow test that uses actual unobstructed world locations and actual Ranger Skill 1, Mage Skill 1, and Archer companion projectile/attack flows. At 350/400/450/480 log hit, aggro, eligibility, chosen target, warned maneuver, retreat/reinforcement, and hit/miss or interrupted retreat over bounded frames. Distinguish game-wide territorial leash effects from a true Rogue range gap. Compare with dev.184 baseline; do not silently take #452's unmerged Mage beams as live behavior.
3. **Optional remedy gate:** only if native tests reproduce unfair pressure under approved rules, prefer a minimal eligibility/selection reconciliation or a narrow response to confirmed distant damage. Proposed range changes require separate director decision. Preserve two-second cadence, telegraph dodgeability, Slow cap, Ranger hawk counterplay, safe towns, finite paths, and save state.
4. **Release gate:** exact-head focused tests/build, explicit director review before merge/deploy. No automatic full-game/browser/performance matrix.

## Wider live PR assessment

As of this checkpoint, 12 PRs remain open: #454/#455 are **superseded historical feature drafts** included through released #459 (keep traceability, never merge again). Preserve #458 TRUE-form boss patrols separately; its `engine.js` changes could alter how ranged combat is entered. #452 Mage beam travel is also a **draft**, so its prospective charged ranges are not live acceptance evidence. #440 Critical Executions remains staged, not a valid reason to modify Rogue balance. Other drafts (#456, #449, #447, #445, #436, #435, #401) retain their own scope and gates. A follow-up priority review should respect each owner's acceptance/hold status rather than batch-merging all open PRs.

**No merge, deployment, AI retuning, or closure of other PRs in this investigation.**


## Phase 2A: native delivered-hit and AI-tick probe

A second focused test, `tests/rogue-ranged-pressure-hitpath.test.cjs`, chooses line-of-sight and collision-clear paths in the game's retained Vale geometry (no replacement of `line`, `route` or `blocked`). For **ordinary Goblins and Ringleaders**, Ranger, Mage, and Archer sources at 350/400/450/480 units, in Normal and Nightmare, and in healthy/wounded conditions (96 cases), it passes a real delivered-hit through `combat.damage`, observes native aggro/threat records, and advances 16 actual enemy ticks. It logs selection, eligibility, encounter movement, tactical phases, warning events, and returning status.

**Critical limitation:** this uses a controlled native **delivered hit**, not the actual Ranger/Mage skill input or the Archer arrow flight; it does not assert that each class can fire its ability at all four tested distances. Nor is it a human playtest. The later projectile/input-specific probe remains necessary before any balance change.

The first matrix has passed exact-head [focused CI #40198253231](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40198253231): 90 controlled tactical gate cells, 27 nominally legal Rogue moves blocked by upstream selection, and preservation of the 2-second cadence. This is **code-level evidence**, not a gameplay dissatisfaction verdict. Phase 2A requires its own new exact-head focused CI check.


### Withdrawal geometry reconciliation

The first native delivered-hit run passed 96 cases and produced 64 tactical responses, but showed some wounded 450/480-unit actors entering an `escape` phase without physical movement within 1.6 seconds. The initial fixture certified only the *incoming attack line*, not space for the enemy to retreat. The next exact-head iteration additionally requires a collision-clear 200-unit lane **behind** the enemy and reports the observed motion; do not assert an engine defect from the earlier inconclusive fixture.
