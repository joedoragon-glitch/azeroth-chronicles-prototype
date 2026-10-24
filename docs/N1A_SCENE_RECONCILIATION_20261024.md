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

## N1a implementation audit and validation — 24 October 2026

**Code complete in draft [PR #430](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/430), subject to physical scene/hardware review, not a published game release.** All five separate correspondence obligations are represented by real scene props, Neri's book-facing presentation, an inspectable D04 viewpoint, and exact author-approved reading delivery.

- [Focused workflow #40084942437](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40084942437) **PASSED 19 selected relevant test files and `node scripts/build.cjs --check`**. Publishing was skipped; no full game/Playwright or physical-device matrix was invoked.
- Independent author copy tests preserved all **53 EN/ES entries and three conditional supplements**, 13 Chronicle cards and 17 silent quest slots. N1's evidence, pact and throne gating remain intact.
- `tests/n1a-scene-reconciliation.test.cjs` verified four configured inspectable locations, D04's first-entry confidentiality and inspect-only full reading, v4 snapshot restoration, stable geometry/decor IDs on legacy scenes, meaningful graphical prop coverage, and Neri's voluntary book-oriented pose.
- `tests/sprites.test.cjs`, `tests/occlusion.test.cjs`, `tests/terrain-effects.test.cjs` and `tests/world-proportions.test.cjs` passed with the new scenery. No collision or combat implementation changes were made.
- Focused workflow was run while the **draft** temporarily targeted `main` because repository Actions run automatically only for PRs into `main`. Immediately afterward PR #430 was retargeted to `narrative/n1-editorial-master-integration-20261024`, verified **mergeable_state: clean**. Therefore N1a does not land ahead of N1; the code tested is the N1a branch head.
- Later documentation-only edits do not alter validated runtime or test source. A real premerge CI run against the eventual full integration base remains appropriate if release is separately authorized.

**Limits / next stage:** The signal station works as a **visible illuminated beacon**, not a new signal-alert mechanic. The Shrine papers can be inspected but are not Keeper ledger evidence. The historical Goblin wage record is supported by purchased goods and receipts, not a new wages simulation. Neri actually turns to local books at restorative pauses; quality on phones is not visually certified. D04 exposes the approved private-quarters text only when the dressing-station vicinity is inspected, never from first entrance. A2–A5 Archive menu modernization is separate. Neither PR #428 nor #430 is merged or deployed.
