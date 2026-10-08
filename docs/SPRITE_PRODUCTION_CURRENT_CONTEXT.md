# Sprite production restart · 8 October 2026

Joel authorized generation and clarified that the former 221 GENERATE entries must neither force stale designs nor exclude new map additions. After seeing the three pilot drafts, he accepted the design direction, identified an awkward Goblin face (the wide pale triangle reads as a smile), and requested scope reconciliation before additional generation or implementation.

## Current checkpoint

Current baseline main: `e2529b0f6db9737ecb62af48c0c2a87693e8647a`, v0.8.90. The concurrent audio release is preserved; visual/map sources match the original v0.8.89 audit baseline. See `SPRITE_SCOPE_RECONCILIATION.md` for the reconciled 296 decisions: 280 GENERATE, zero aliases and 16 numbered procedural decisions; broader procedural families remain in the coverage document. There are 70 prepared exact body contracts, including the expanded natural scenery. A separate catalog tracks 28 terrain texture candidates, starting with five regional ground pilots; opaque texture processing/world mapping is a follow-up to this scope pass. New map additions remain eligible for later reviewed entries. No production manifest image or approved registration is active.

## Current pilot record

Three drafts are retained under `tools/sprites/pilots/2026-10-08`: Paladin, melee Goblin and Vale cottage. Built-in image generation used the actual transparent procedural references, one asset per call. Original sources, processed 192×192 candidates, canonical references, comparison image and original immutable metadata are retained. Their old hashes/statuses are historical records, not current approved registrations.

Paladin and cottage directions are acceptable; final apparent size and grounding need tuning against gameplay. Goblin direction is acceptable apart from the face. Correct the nose/mouth separation and verify at native gameplay size before activation. No extra broad creative approval round is required to reconcile the catalog. A technical hash record must not imply acceptance of the unchanged Goblin face.

Cottage raw input and a background-cleanup retry retained alpha=1 stray pixels at image edges. The original is unchanged. A documented 32px transparent border on each side supplies the retained processor input, with no trimming, color conversion or alpha deletion. Original/derived hashes are in `normalization.json`. New inspection diagnostics expose faint alpha and actual material bounds while strict full-alpha margins remain enforced.

## Per-asset work and resumption

Before generation, inspect the exact current renderer branch, entity/state and map decisions. Capture isolated generation reference plus actual gameplay context. Reconcile the catalog cue and runtime key. Current source outranks an old prompt. Revise or skip obsolete entries, and append a documented decision for new authored bodies. Preserve stable IDs and completed immutable sources; unrelated inventory growth does not require regenerating them. Review/reprocess an asset if its own canon, prompt or contract changes.

Generate one static asset alone. Preserve current proportions, equipment placement and palette, adding material definition only. Generation references omit game-owned shadows, ground patches/chevrons and captain rings. Gameplay comparisons retain them. New identity-heavy static objects can become candidates; effects, seeded variation, geometry and contextual/rescue compositions keep their documented procedural decisions.

Next after reconciliation: targeted Goblin face correction, refresh pilot metadata/anchors, then staged generation with resumable per-key records. Integration needs current exact keys, procedural overlays/fallbacks, loading measurements, browser/device/offline regression and verified deployment. Military Ringleader officer cues need a follow-up integration fix before those forms can use base images. Keep Issue 111 open through pilot registration and release evidence. Do not activate art solely because it passed image decoding.
