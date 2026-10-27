# Mainline integration checkpoint for fourth-class preparation — PR #511

**27 October 2026 · Mainline reconciled into draft PR #511 at `3c6da60` · No merge to `main`, no release approval**

## Resolution status — current code is integrated

The current `main` commit `286e8c0d` was integrated **into the draft PR #511 branch** with merge commit `3c6da60` (parents: pre-merge PR head and current `main`). All newer mainline files were retained. The five common edited files — `app.js`, `engine.js`, `hero-combat.js`, `progression.js`, and `save.js` — were merged with source-aware preservation of both sets of changes, not overwritten wholesale. The bilingual class-growth presentation was combined with the PR's class labels; the mainline native Paladin/Mage/Ranger level-one passives, old-save migration and pursuit protections were retained alongside the class-aware Expedition cap, Succession handling and fail-closed unimplemented Rogue skill entry.

**Reconciliation is complete against that exact upstream commit**, not proof of a clean test run: syntax checks passed for the five merged modules before the merge; focused GitHub CI, browser/device and save migration acceptance still determine readiness. If `main` moves in the meantime, compare the exact current branch head with `main` before any later release action.

### Later same-day mainline follow-up

After the source merge at `3c6da60`, **main** received PR #519, the adaptive mobile HUD and PWA snapshot `0.9.1+snapshot.dev.198` at commit `3acf0f72`. It was also incorporated into this **same draft PR #511 branch**, via second merge commit **`7680c4ef`**. The only overlapping code file was `src/prototype/app.js`; its class-selection/level-one passive presentation and the adaptive phone/joystick/notices implementation were combined. Other mainline files—including `src/prototype/input.js`, mobile CSS, service worker, build version, and their tests—were carried forward unchanged. The combined app parses as JavaScript. This second merge does **not** release or enable Rogue, and latest-head validation remains the release gate.

## Confirmed upstream divergence

The PR head has diverged from `main`. On this comparison, `main` is **four commits ahead of the PR branch**; PR #511 carries its own preparatory commits. This is not a cosmetic documentation conflict. Both sides modify:

- `src/prototype/engine.js` — active class construction, movement and class passives versus PR's explicit starter roster, class-dependent attack approach and Succession reserve overflow.
- `src/prototype/progression.js` — class-derived HP/Power/speed/cooldown passives and companion inheritance versus PR's shared Expedition cap, text and dormant +1 Rogue bonus.
- `src/prototype/hero-combat.js` — the shared cooldown owner versus PR's unsupported-class fail-closed cast dispatch.
- `src/prototype/save.js` — passives' version-4 historical save migration versus PR's dynamic Succession checks, per-class active cap and future-Charm metadata guard.

Other newer mainline files include `src/prototype/rules.js`, `combat.js`, `boss-combat.js`, `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json`, `tests/class-passives.test.cjs`, current melee pursuit suites, cooldown and Skill 1 tests. **Do not overwrite `main` changes with old PR versions, resolve by picking only an entire file from one side, or regenerate evidence against the obsolete PR rules source and assume it will stay valid after integration.**

## New baseline on `main` to preserve

`docs/HERO_CLASS_FOUNDATIONS_LEVEL1_AUDIT_20261026.md` and the associated mainline sources report merged/implemented level-one class passives:

- Paladin: +5 maximum HP per hero level including level 1, plus +0.01 per-level Armor effectiveness atop shared 0.35.
- Mage: +2 Power per hero level including level 1; avoid mistakenly gifting that passive Power to Shared Strength companion inheritance.
- Ranger: +3 movement speed and +1 percentage point cooldown reduction per hero level including level 1, with additive training and bounded total CDR.

These are **live three-class gameplay mechanics now**, not speculative Rogue buffs. Both original base stat tables and effective level-one statistics must be distinguished when benchmarking the Rogue. Rogue's independent proposed Endure and charm-oriented role do not automatically inherit those passive bonuses. Maintain the mainline class-passive migration marker, existing historical v4 saves, incoming Armor calculations, engine speed accessor and cooldown source when resolving overlaps.

A focused branch CI failure previously showed `hero-skill1-area2.test.cjs` expecting literal three seconds even where the live cooldown calculation yields 2.97. The draft now tests against `g.skillCooldown(1, charged)` instead of hardcoding raw cooldowns, but this assertion is **not proof** that the other stale-source errors or current-head CI pass.

## Safe reconciliation sequence, **within this same PR**

1. Integrate current `main` into the **existing PR #511 branch**, conflict-resolving shared source lines. No separate PR, force-push, or deployment; preserve the existing feature's authored decisions and the new mainline class passives.
2. Re-run the target source-evidence checks (`melee-reach-balancing`, `sprite-scope`) against the resolved exact `rules.js` and evidence; do not disguise a hash mismatch by weakening a test.
3. Verify old Paladin/Mage/Ranger formation slots, skill ranges/damage, automatic basics, Ranger innate speed/CDR, Paladin armor/HP, Mage effective Power/companion inheritance, saved class-passive migrations and pre-Rogue four-choice Succession fixtures.
4. Verify PR's infrastructure additions survive exactly: **no Rogue registry entry**, 0-starter policy dormant, denied incomplete Rogue combat, +1 active slot 3/4/4/5/6/7, Basic Barracks local 3, Full Barracks effective cap, seven-slot formation, 8-per-page Company UI, authenticated future Charm-gate (reject unverified `charmOrigin` on imports), dynamic Succession pending validation and deterministic active overflow.
5. Once CI and focused suites pass on the **same exact head**, run browser/touch/keyboard, bilingual UI, Canvas/Pixi and offline PWA checks before owner release review. This branch is not presently signed off.

## Remaining product blockers (separate from mainline integration)

- A first Rogue Bar­racks must be buildable without granting forbidden ordinary Soldier/Ranger starters. Today builder labor is selected among active Soldier/Archer companions; proposed charmed workers need a narrow, owner-authorized exception or an in-world builder alternative.
- Exact legal ordinary-monster type allowlist/identity, per-type rank quota and source-safe conversion/rewards; no blanket twelve-monster cap and no Barracks ownership limit.
- Authentication, recovery, Succession and v4 save migration for captured monsters (including the historical three-class Game Over state after a fourth is added).
- All eight Rogue tap/charged music effects, the normal/charged basic attack and finisher, fourth independent critical-intensity control, innate Endure, static original art, audio and localized HUD/skill journal.
- Seven-member **mixed** composition/formation and performance regression, not merely seven Soldiers or seven Archers.

**Current status:** Source reconciliation was implemented in PR #511 at `3c6da60`. This document retains the pre-merge risk analysis for review history. PR #511 remains draft, unmerged to `main`, not playable, and requires latest-head test verification before release.
