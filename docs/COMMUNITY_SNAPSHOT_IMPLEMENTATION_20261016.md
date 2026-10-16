# Community Snapshot implementation — 16 October 2026

Status: ACTIVE SOURCE IMPLEMENTATION, UNBUILT AND UNTESTED. This is not a playable release or a ready-for-validation claim.

Branch: `feature/community-snapshot-post308-20261016`.
Baseline: PR #308 merged as `6bc27be31792b1c38147d61e98ceed6acf3e2560` (final source `8aeb0fb3df63b21817e6e6be4c4e8f2f4376b7b1`). Preparation `13035bc0d804ac49f576ac4a2b6edd7d07c44e5f` differs from its base only by the three copied preparation documents/catalog. This implementation starts from merged main; it does not merge older runtime code from preparation.

## Owner restrictions

No tests, builds, browser use, simulations, benchmarks, CI dispatch, PR creation or deployment during implementation. Do not run a syntax checker or test through a different command name. Repository instructions to build/check after runtime edits are deferred by explicit owner instruction. New source graph is registered but generated entries, build-info, cache and version remain baseline until authorized regeneration. Do not open this incomplete branch as a PR. Pushes to this feature branch are outside the existing workflow's push trigger (main only); no workflow edits or gate exceptions.

## Source checkpoint 1

- Explicit `pet` plus exact `petFamily`; shared companion stats, level/Vitality/Expedition inheritance, armor and recovery. Eleven rule definitions and bespoke procedural miniatures, no new sprites.
- Permanent entitlement derives from existing `s.true`, historical saves included. First TRUE kill notices, separate free atomic Barracks recruitment, one individual per family, common 200-unit reservation cap and existing active deployment caps. No additional capacity.
- Pets stay in the roster when resting/fallen and cannot be deleted for free fresh health. Existing treatment/recovery restores them; no separate persistent pet store. Collection displays locked/recruitable/active/resting/fallen.
- One pet skill adapter uses existing cooldowns, target doctrine, navigation and shared interrupted charged release. Bounded targets and brief Slow/self-ward/self-heal; no summons/hazards/enemy boss AI.
- v4 accepts known, entitled unique pets only. Troop queue accepts explicit Soldier/Archer, absent historical queueType retains Soldier compatibility. Pet recruitment bypasses the queue.
- Renderer pet labels and distinct procedural art path; sprite fallback explicitly keeps pets procedural. Common bounded VFX queue and ordinary sound events.

All above describes written source, not executed outcomes. In particular transient cleanup, charge resolution, save round trips, art appearance and balance have not been tested.

## Remaining implementation

1. Complete comprehensive procedural case inventory and justified art upgrades; source review cannot establish actual-size desktop/phone visual acceptance.
2. Finish source-grounded late-region Soldier/Archer changes and concise teaching; preserve emergency immunity and Ranger support.
3. Current-version safe presentation/resource improvement and separate assessment-only combat/AI report.
4. Add focused, unexecuted feature regression cases and comprehensive overnight checklist. Review all audit findings and integration paths.
5. Source/build inventory, deferred version/regeneration instructions and final recoverable GitHub checkpoint. Do not claim ready until the source scope is complete; generated artifacts remain a validation-phase prerequisite.

## Incoming issues register

No additional owner bugs submitted in this implementation session yet. Audit F01–F06 have source changes drafted; F07–F12 remain open for implementation/evidence reconciliation. No runtime correctness finding is closed by inspection.
