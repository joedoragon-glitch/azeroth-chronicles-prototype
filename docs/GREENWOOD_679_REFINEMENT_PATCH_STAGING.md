# Greenwood Vale — PR #680 active engineering candidate

> **DRAFT. Implemented for private preview, not creatively accepted.** This page replaces the original *planning-only* status recorded at commit `864b70635a195bf8e43389ca878ab78f89e8a583`. The full original staging content is preserved in Git history, and the authoritative creative decisions remain [issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679) and the complete PR #680 engineering handoff.

The project owner authorized the provisional **environmental and Thornfang/Mira patrol refinements** on 2026-11-03, **not** any changes to monster spawns, density, enemy placement, encounter rates, or combat balance. This supersedes the earlier staging instruction to await authorization before coding. No final creative approval or merge/deploy approval has been given.

## Implementation approach

- Preserve 3,200-unit geography, main roads, two existing river crossings, six quests, all source-defined enemies, conserved world resources, player-owned structures, save IDs and the current artistic canon.
- Use only existing `visuals.js` procedural drawings. The seven additions are nonblocking, scene-specific, and carry stable `greenwood-refinement-*` IDs.
- **Do not increment Greenwood's destructive scene version.** Apply a one-time additive overlay to the already-restored scene, with physical/owned-property clearance checks and a persisted receipt. Older completed scenes do not regenerate trees or reposition actors to get these cosmetics.
- Keep `thornPatrol.route` and eight saved `thornLeg` indices unchanged. Preserve original southern-first movement, Mira's physical escort, paid-compulsory status, respite, rescue, fights, TRUE/respawn and homecoming.
- Rename the road observer rather than duplicating or relocating an NPC. Remove the impression of a live, all-region GPS report; physical pawprints must be nearby and unexpired to support a fresh local clue.
- Rename northern crossing labels, update saved static clue labels, and reconcile the new EN/ES guidance.
- **No `bone-pile`, `tax-post`, generic grass/tree tokens, new loot, story retcon, boss/combat change or spawn redistribution.** A bush is withheld because the reconstructed understory is already present.

## Status and acceptance

**Implemented:** source patches and focused test definitions exist on this draft branch; see [candidate acceptance and scene-card document](GREENWOOD_680_CANDIDATE_ACCEPTANCE.md).

**Tested:** source-level patches and assertions are not execution evidence. Check the linked nonproduction preview workflow for exact-commit test and packaging outcomes; separately verify actual browser/device behavior before approval.

**Merged / Deployed / Device-verified:** **No / No / No.** Main and production must remain untouched.

## Preserved recovery material

- [Original PR #680 staging document at its preimplementation commit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/864b70635a195bf8e43389ca878ab78f89e8a583/docs/GREENWOOD_679_REFINEMENT_PATCH_STAGING.md)
- [Issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679), including full provisional design audit and earlier measurements.
- [PR #680](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/680), including engineering handoff and ongoing implementation/audit receipts.

**Owner's acceptance gate:** review the actual playable candidate, request any adjustments, and then explicitly authorize final integration if desired. The PR remains a draft.
