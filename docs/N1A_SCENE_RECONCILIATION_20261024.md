# N1a — Separate world and scene reconciliation

**Source:** Author-final `AZEROTH_CHRONICLES_BILINGUAL_NARRATIVE_V4_2_EDITORIAL_MASTER.docx`, 24 October 2026. All accepted paragraphs are read from `PrototypeNarration.approved`; N1a does not edit, paraphrase or abbreviate the manuscript.

**Dependency:** Draft N1 PR #428. This N1a branch is stacked on its exact head and must ultimately target `narrative/n1-editorial-master-integration-20261024`, not independently land on main. Issue #427 tracks the stage. No merge, release, A2 bookshelf redesign, full CI or altered core mechanics is implied.

## Five documentary holds and runtime evidence

| Obligation | Reconciliation | Guard / compatibility |
| --- | --- | --- |
| D04 — Veyra's quarters and cosmetics | Reuse the established `citadel-vanity-quarters` dressing table, mirror, cosmetics and uniform. A real scene-detail NPC is located within the private quarters. | Full exact D04 EN/ES can be inspected only at this furnishing, never at first entrance. The existing entrance stays the exact two-sentence excerpt. A `citadel:veyra-private-quarters-inspected` discovery fact permits full earned-story reconstruction in existing v4 saves. |
| P04 — Neri turns toward her books | While the voluntary Archive repair route pauses, Neri faces the nearest bookshelf or stacked books. Canvas and sprite facing uses that pose, with normal motion retained between work sites. | Only when rescued, the Keeper pact is active and Keeper remains available. No new labor assignment, tonic cost, inventory mechanic or altered movements. |
| I01 — paid Goblin workers, purchased preserves | Replace the conflicting stolen-goods prop in the Old Orchard Cellars with purpose-built purchased-preserves jars and a paid receipt. Preserve bedrolls, game table, Goblin families and nests. | Original scene prop ID is preserved, old saved decor is updated idempotently, no new loot or economy event. |
| I03 — operating Old Signal Keep / Crown gear | Add an illustrated and illuminated active signal beacon and a Crown-maintained tool rack alongside the existing inhabited Ogre hearth, game table and stone seats. | Visual-only / inspectable; no invented signal transmission, transport permission, staffing or functional warning alerts. |
| I04 — preserved Shrine furniture and Scornfang records | Preserve existing ritual table, add cared-for ritual furnishing, replace ambiguous stolen-goods prop with visible Scornfang memoranda and a nearby inspection marker. | Readable through approved I04 text without treating the documents as Keeper evidence or granting rewards. |

## Save and presentation contract

- All existing `side-decor-N` IDs, collision radii, pathing, NPC identities, boss combat, traps and quest pacing remain unchanged.
- `narrativeSceneReconciliation` is deliberately independent of `interiorCoherenceVersion: 3`; rerunning that older coherence method would shift pillars or guards in historical saves. An optional scene version on existing zone objects is additive and a v4 save schema migration is not required.
- Four specific `scene-detail` inspections are source-verified by their current zone and canonical configured ID. Only the private-quarters interaction changes earned story access.
- The fully authored passage in each inspection uses the game's normal bilingual modal. English prose is never replaced by generated/invented prose; the saved Spanish translation comes from N1.
- The functioning signal visually glows but does not become a gameplay signal system; a future world mechanic must be separately approved.
- P04's facing pose is not proof of hands-on animation quality on phones. Actual mobile hardware/screen-reader verification remains separately scoped.

## Validation

- New `tests/n1a-scene-reconciliation.test.cjs` probes all four inspection routes, exact D04 fact gating and restored reading, old side-dungeon prop migration without shifting coordinates, distinctive scenery assets, and Neri's voluntary book pose.
- Run only relevant affected tests plus `node scripts/build.cjs --check`. The comprehensive Pages/Playwright/device matrix is not authorized.
- Automatic focused validation runs only on PRs targeting `main`; to obtain CI evidence for the stacked draft, temporarily point the draft to `main` for a focused run, then restore its proper N1 branch base before handoff. No deploy, release or merge.
