# SIBDLP v0.9.2 — Greenwood Skeleton combat candidate and lore-title integration

**Status:** DRAFT / unmerged / unpublished. Owner-authorized design implementation for [issue #870](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/870). This document describes **candidate source behavior**, not a tested, accepted or released feature. Follow [PR #871's authoritative naming and latest 27-answer handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/v092-enemy-skill-lore-audit-20261113/docs/MONSTER_SKILL_LORE_WORKSTREAM_HANDOFF_V092_20261115.md) for all 29 exact final English labels, including **Fixation**. Historical ballot drafts are not active.

## Existing mechanics retained

- All basic melee and ranged attacks, conditional Rogue maneuvers/signatures, monster support healing, Guardian scaling, boss/captain kits, difficulty modes, night/Frenzy, and existing companion specialist skills stay in place. Source profile IDs, species names and numerical v4 save compatibility remain the owners of mechanics. The 25 new titles are **display-time aliases**, not changes to effect kinds.
- Source-specific professional terms are not applied globally from species alone. Current allowances: every Lifebinder Skeleton's techniques and habitat-based Wraith/Mireling/Reed-Beast terms; confirmed Scornfang Treasury room guards; Garun Mine guards; verified Frontier occupation posts/overseer; verified Ridge Treasury escorts; explicitly identified Cindermaw Ministry units; Crown-trained troop posts. Where records cannot substantiate the relationship, the original species-native label remains. Do not silently assert employer affiliations based on an address or appearance.
- English skill titles stay English in both EN and ES modes for **v0.9.2**. Existing localized UI/status and story text remain bilingual; professional Spanish-name translation is deliberately later collaboration.

## Proposed Greenwood-only proactive mechanics

Only ordinary/Guardian/Ringleader hostile Skeleton mobs in Greenwood Vale and Forest Crypt qualify. This is **not** a universal 12-species rollout. Boss/captain/summoned or generated development actors and already committed attacks cannot enter these new cast pathways. Native suppression, line of sight, range, cooldowns, leash/post guard and combat reset continue to govern admission.

| Name | Candidate mechanic | Counterplay / status boundary |
| --- | --- | --- |
| **Mortise Cut** | Narrow joined **L-shaped** sword contact; Guardian modestly braced while preparing | Escape the observed cut, use cover/positioning; **no Slow or shove** |
| **Datum Line** | Three reduced-damage **real arrows** fired at intervals along the same fixed surveyed bearing | Step off the datum lane; physical projectile terrain collision; **no Slow or shove** |
| **Double Shear** | Ringleader normal two short diagonally separated melee beats with a small pivot; charged second beat turns substantially farther into a lateral escape lane | A bar precedes each committed beat; direction locks per beat and remains evadeable; **no Slow or shove** |
| **Resection** | Ringleader normal two convergent physical arrows; charged instead seals a fixed offset escape lane with a timed second projectile | Dodge or take cover between shots; **no Slow or shove** |

The owner requires *meaningfully distinct* attacks and charged variants, not extra generic Slows/pushes or "tap attack but larger." Current coefficients in `R.tacticalFoundation.skeletonCraftSkills` are **engineering candidate values**, not owner-accepted balance. Guardians should remain dangerous and post-aware, but their survival must be measured before an ungrounded global stat increase. No artificial courtesy delay when multiple monsters have independently earned cooldowns.

The candidate reuses existing `e.specialCd`, `e.telegraph`, `e.sequence`, `Campaign.resolveAttack`, physical `updateProjectiles`, and the existing Canvas/Pixi cast-bar painter. Voluntary per-actor cast alternation lives in nonserialized WeakMaps; v4 snapshots already clear in-flight warning/sequence/projectile state. The new behavior must not consume boss-rotation indexes or create progress/purchase/saved-slot identities.

## Charmed parity

The owner clarified that a Charmed monster should not forget an applicable learned repertoire. Skeleton Charmed allies may access a native craft form **alternating in existing Skill 1**, and their earned elite craft form **alternating within existing Skill 2**, without changing specialist rescue, Charm eligibility, training, mastery or third heritage. Names match the actual hostile skill when a technique is genuinely shared. The present candidate's party implementation is subject to full native tests and balance before accepting parity. No additional purchased training or universal Charmable-Ringleader spawn has been authorized.

## Canon, copy and release boundaries

Lifebinder Skeletons are aware worksite personnel and defenders. **New authorial decision:** Thornfang arranged for captive instructor Mira to teach them some additional drills as well. This supplements their existing construction-work technique origins; previous canonical narration did not already establish that training. Do not rewrite Mira's established role, rescue, Skill 2, or the Lifebinder's authority to force-fit this note. Keep characterization economical, avoid tutorial/exposition overhead.

**Required evidence before claiming readiness:** original Rogue and boss/captain/companion tests; `tests/skeleton-craft-v092.test.cjs`; geometry, AI cadence, cast interruption and actual projectile contact; all four classes, Normal/Nightmare, Guardians and both Ringleader roles, real player-accessible Greenwood and Crypt, Charm eligibility/mastery, old v4 restore/save/export, original warning/vfx and Pixi/Canvas safety; focused formatting and production build; then owner-visible quality/acceptance. Automated/native tests are not earned playthroughs or real-device proof.

**Integration hazards:** independent save #864, tutorial/EN–ES #868, combat autosave #873, audio and renderer branches can modify engine/party/combat/worker infrastructure. Reconcile latest `main`, update built service-worker asset fingerprints using the actual resulting source and only then consider review. No merge, Pages/PWA publication, version bump, tester contact or public release follows from this draft.
