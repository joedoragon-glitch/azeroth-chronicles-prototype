> **Reference boundary — 19 October 2026:** Design/ownership rules below remain reference material where consistent with current source and later director decisions. Version numbers, asset counts, historical verification and next-stage instructions describe their own checkpoints. Development is paused; use [current state](DEVELOPMENT_STATE.md) and [the documentation index](DOCUMENTATION_INDEX.md) before any new work.

# World life, geography and fidelity pass — v0.8.62

## Intent

This pass treats authored geography as world canon rather than flavor text. A named ferry, quarry, shrine, camp, fortress approach, monster territory or dungeon function should be visible and spatially credible in play. A coordinate alone is not a place and a label alone is not environmental storytelling.

The tone is deliberately not grimdark. The Dark Lord has already won and imposed an order, so oppression coexists with ordinary adaptation. People still trade, repair, cook, garden, wash clothes and try to prosper. Monsters likewise sleep, eat, nest, scavenge, train and maintain territory between hostile acts. Occupation pressure is visible, but it is not the only activity represented.

## Space and geography

The old overworld bounds were too compressed for the amount of authored content. Region sizes are now:

- Greenwood Vale: 2700
- Flooded Marches: 3000
- Ironroot Highlands: 3400
- Ashen Frontier: 3400
- Dark Crown: 3800

Major dungeons, transports, minor settlements and field compounds use the extra land instead of leaving an empty border. Existing saves migrate these destinations and rebuild roads without resetting campaign progress.

Each region now has a distinct large-scale visual geography. Vale uses meadow/orchard slopes and wooded rises; Marches uses wet basins, mudflats, reed islands and shore shelves; Highlands uses stepped terraces, quarry shelves and pine basins; Frontier uses burn scars, ravine shelves, ash lowlands and a militarized road belt; Crown uses ash plateaus, obsidian shelves, crystal fields and a fortress apron.

These landforms imply height and shape in the isometric renderer. The simulation remains 2D: there is no hidden Z-axis or vertical combat physics. A smaller set of actual collision features—ponds, cliff spurs, ravine shelves, lava channels and obsidian outcrops—makes the geography affect travel as well as presentation.

## Architecture

Settlement props no longer use one universal house/workshop/fence family.

- Vale: timber cottages, workshops and rural fencing.
- Marches: stilt houses, boathouses and boardwalk construction.
- Highlands: stone homes, smithies and low stone walls.
- Frontier: repaired/patched houses, rough workshops and palisades.
- Crown: ash-stone/obsidian homes, forgehouses and dark walls.

Named town services keep their gameplay identity but receive regional structural framing as well.

## Lived-in hostile territory

Ordinary patrols remain the same authored population and rewards, but expanded occupation anchors spread them over more land. Decorative living-space clusters establish where inhabitants actually spend their time.

Examples include goblin roadside camps, mire nesting banks and wallows, wolf hunting grounds, ogre communal hearth camps, orc bivouacs and drill camps, ash-beast roosts, Crown barracks and fortress work camps.

Field-boss compounds also gain domestic or operational details—beds/nests, cooking or feeding spaces, supplies, trophies, training equipment, command tables and similar cues appropriate to the boss family. These are presentation/worldbuilding additions, not extra combat rewards.

## Treasuries and dungeons

Treasure rooms are treated as homes, stores or working spaces belonging to their owner rather than generic rooms containing quest crates. The four Treasuries now have different internal partition plans and expanded boss-specific furnishing sets.

Main-dungeon decorative sets grow from twenty generic/theme props to larger functional layouts. The intent is:

- Forest Crypt: burial complex, caretaker/ritual spaces and ossuary activity.
- Sunken Archive: drowned library/repository with salvage and aquatic occupation.
- Colossus Mine: excavation, rails, ore handling, tools, forge and giant-scale working space.
- Abyss Bastion: dragon roost, hatchery, feeding remains, heat and hoard functions.
- Citadel of Ashes: barracks, armory, command, forge, supplies and ritual/military functions.

Combat geometry, boss mechanics, rewards and progression are preserved unless a separate rule explicitly says otherwise.

## Quest pass

No new quest count was added merely because maps grew. Existing exploration objectives were preferred as the vehicle for experiencing the richer world.

Four survey quests were reworked to lead through inhabited territories: the Vale goblin camp, Highland wolf and ogre territories, a Frontier orc bivouac, and Dark Crown ash-beast/Crown military spaces. Treasury quest names and prose now agree with the actual Treasury objectives.

## Audit rules

The pass is considered incomplete if any of these fail:

1. Declared -> a location or route exists in data/lore.
2. Located -> its coordinates make geographic sense.
3. Represented -> it visibly looks like what its name claims.
4. Contextualized -> roads, inhabitants and nearby scenery explain why it is there.
5. Inhabited -> important civilian, monster and military locations show ordinary use outside combat.
6. Breathing room -> settlements, patrols, field compounds and wilderness are not stacked into one central band.
7. Regional identity -> architecture and landform silhouettes differ for reasons deeper than palette swaps.
8. Reachability -> roads, transports, quest sites, cages, dungeons and bosses remain traversable after migrations.
9. Save safety -> existing progression, deaths, resources, collections and quest payments survive layout upgrades.
10. Reward integrity -> visual/world additions do not create unintended gold, XP, resources or quest rewards.

Automated regressions cover world-size use, regional structure families, lived-in props, landforms, route clearance, destination migration, Treasury cache reachability and richer dungeon functional dressing. Human playtesting remains important for visual density, travel pacing and whether the implied terrain height reads naturally on desktop and phone.

## Environmental finishing Phase 3 — native interior camera and aesthetic pass (31 October 2026, draft #739)

**Owner's updated mandate:** A genuinely considered aesthetic/environmental pass on **all five side dungeons**, not just three, even though future story/gameplay purposes are deliberately unselected. Also inspect all **five main dungeons and four Treasuries**. This is not authority to recreate combat, boss gates, NPC hostility, rewards, rituals, flood causes, economic products, floor plans, side quests or lore. Judge as a designer (function and clarity), photographer (focal structure, lighting, scale, material, composition) and resident/traveler (work, food, storage, shelter, believable use).

**Evidence first:** `tests/environment-phase3-interiors.test.cjs` renders 42 real configured Campaign/Canvas scenes at 150% camera zoom (arrival, a working area and deep interior for **each** of 14 rooms). Original [native 42-view artifact and focused passing run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41234478316) supply the photographic comparison. These images are actual source-native scenes with NPCs/encounters, not storyboard drawings, default-Pixi output, broad physical walking or device certification.

### Original-current scene assessment (preserve established intent)

| Room | Actual established visual/work identity | Phase 3 disposition |
| --- | --- | --- |
| Forest Crypt | Old funerary architecture alongside an unfinished, maintained winter estate; supply, craft/forge, guests and caretaking areas | Preserve approved Greenwood reconstruction/Scornfang canon and original party/guardian routes |
| Sunken Archive | Dry intake and shelving, Neri's restoration, visibly flooded lower records and Keeper's wet studies | Preserve incomplete restoration and unknown flood cause; no invented solution |
| Colossus Mine | Silver/copper sorted ore, hauling, repair forge, old cut and Garun's mineral/geometric collection | Preserve professional mixed Wolf-rider/Ogre working population and industrial flow |
| Abyss Bastion | Flight training, harness preparation, hatchery, feeding and royal dragon launch facilities | Preserve actual air-superiority operation and active danger; no new dragon/boss logic |
| Dark Citadel | Muster/command, administrative ritual scene, barracks, forge and Veyra's private inner court | Preserve existing civic/authoritarian hierarchy, danger cues and ruler rooms |
| Old Orchard Cellars | Purchased preserves, storage, Goblin bedding, young nests, games and an occupied cellar rather than a generic den | **Side material finish candidate:** warm worn cellar stone/timber dust, associated low alcove masonry; no new Goblin alliance |
| Drowned Watchhouse | Old coastal watch masonry now Reed Beast nests, fishing nets, shells, partial flooding | **Side material finish candidate:** tide-stained slate/grout and moisture-worn low masonry; **not** a flood explanation |
| Old Signal Keep | Working warning beacon, maintained Crown tools and domestic Ogre hearth/game time | **Side material finish candidate:** worked highland stone, joinery and weathered stone alcove; mint still at Stonecross |
| Ruined Shrine | A protected surviving ritual furnishing used alongside an Orc barracks, mess and defensive work | **Side material finish candidate:** scarred/repaired shrine stone; no new religion or shrine mechanic |
| Ruined Foundry | Still-working forge, repair/war storage, meal and bunk spaces among damaged Crown masonry | **Side material finish candidate:** soot-darkened industrial stone and worn iron-grit joints; no product/system invented |
| Scornfang's Treasury | Distinct Goblin fortified store and existing captain caches | Keep the **approved owner spelling Scornfang**, guard/reward/save IDs and layout |
| Mirejaw's Treasury | Reed Beast wetland household/hoard and caches | Preserve water-adapted furnishing and authentic wetland identity |
| Ridge Tyrant's Treasury | Stone hearth, residence, armour/coin context and Wolf captain fortifications | Preserve actual living quarters, guard/currency continuity and exact cache behavior |
| Cindermaw's Treasury | A purpose-built volcanic den with roost, hoard and inner vault—not the other captains' rectangular supply room | Preserve the already distinct cave-like footprint and its captain/stronghold systems |

**Source-grounded diagnosis:** All five side interiors have appropriate existing prop lists and inhabitants, but their *floor and low interior partition material treatments* share essentially one generic source rendering family and broad checkerboard surfaces. Rather than rebuilding walls or adding crowding decorative filler, Phase 3 proposes an **existing-geometry-only surface revision**: five context-specific muted floor palettes, sparse material wear at tile scale and theme-specific patina for the existing `householdPartition` masonry. Localize the change to the five `side-*` identifiers and their already-present `pillar` props. No new props or custom/unlicensed raster masters, sound, effects, actor placement, collisions, doors, statuses or save fields. The renderer's PixiJS terrain atlas prepares background using the existing Canvas renderer; a source-native comparison and PWA focused check must verify current-default relevance without asserting target-device acceptance.

**Visual gate:** Keep only material variants that demonstrably show changed real scene pixels, improve geographic/functional recognition from the player zoom and preserve original hazard/actor warning readability. Refuse gratuitous contrast, generic neon magical motifs, every-room gloom, and indiscriminate decoration. Main dungeons/Treasuries are not automatically restyled merely to make the PR broad. No new roads or traversal-graph optimization.

**Current draft status:** Baseline 42 native images captured and reviewed; five side-room surface/patina changes are **implemented but not yet visually accepted or fully focused-tested**. The renderer-source SHA-256 reconciliation is now recorded in `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json`. A revised-branch Chromium PWA check passed at `0f9ef7d` but the focused run at that earlier head failed at missing/stale Development-state markers before reaching the art tests. The version/documentation mismatch was subsequently corrected on the draft. Exact-final-head focused and screenshot comparisons must still be independently checked; owner/device acceptance and publication remain unclaimed.

### Independent new-chat handoff — 31 October 2026

This section is the **current work ownership note**, not another authorization or an instruction to merge. The full source and evidence are in GitHub; no preceding conversation is needed.

- **Active work:** [draft PR #739](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/739), branch `feat/environment-phase3-interior-aesthetic-20261031`. Keep draft, separate from [Phase 2 draft #736](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/736) (46 occupied-place images and Ash Refuge kitchen/laundry, **CI/PWA passed at `dba3e9f8`; unmerged and unpublished**). The historical audit/handoff [#710](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/710) is **not** an implementation base to merge.
- **Authoritative source:** `AGENTS.md`, current main `docs/DEVELOPMENT_STATE.md`, this `docs/WORLD_LIFE_FIDELITY_V0862.md`, `docs/SIDE_DUNGEON_DESIGN_DISCUSSION_20261021.md` (newer owner aesthetic authorization takes priority over older no-redesign discussion), `src/prototype/rules.js::sideDungeons/dungeonDecor/treasuryArchitecture`, `src/prototype/world.js::interiorCoherence`, `src/prototype/greenwood-interiors.js`, `src/prototype/visuals.js` and the PR diff. Verify new main HEAD before any integration.
- **Done, baseline:** Real `Campaign` + Canvas 2D screenshot suite `tests/environment-phase3-interiors.test.cjs` generated **42 views** (entry / work / deep × 14 interiors) at game 150% zoom and passed on *pre-material* head [#41234478316](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41234478316), artifact `environment-phase3-14-interiors` (artifact ID `13054208739`). These are photographs of actual constructed scenes, not concept art; all **five main**, **five side**, **four Treasuries** were covered. Main-dungeon and Treasury scene composition looked purposefully authored in that baseline; do not restyle them merely to produce 14 code diffs.
- **Done, candidate only:** `src/prototype/visuals.js` now defines five muted `dungeonFloors` palettes for `side-vale-cellars`, `side-march-watchhouse`, `side-highlands-signal`, `side-frontier-shrine`, `side-crown-foundry`; bounded old-masonry wear in `groundDetail` and theme-based existing `householdPartition` pillar patina. No wall, enemy, entrance, hazard, loot, save, art registry, audio or road-layout edits. `tests/environment-phase3-side-surfaces.test.cjs` asserts pixel-distinct floors/pillars and original five-room save/roster identity, but its pass is **not yet established on the revised head**. Check actual pixel deltas and artistic quality at 150% (coherent surfaces; not noisy checkerboard, fake distress or buried warnings). Retain changes only if the player-facing picture genuinely improves. Do **not** equate different hash with good composition.
- **Validation facts, carefully separated:** On earlier source head `0f9ef7d`, Chromium PWA update [#41234910049](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41234910049) **PASS**; focused CI [#41234910156](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41234910156) **FAIL** at Development-state version/docs consistency *before* new material tests. Subsequent branch commits updated `docs/DEVELOPMENT_STATE.md` for dev.247 and the sprite SHA-256 source ledger. **Check the new exact-head runs and logs**, and fix substantive regressions rather than downgrading original tests.
- **Current main/rebase hazard:** Main advanced to `e5f988a3967ed3fe1633da9959153ad79d82a72e` from merged combat/Charmed PR #733 (dev.246) **after #739 branched from `282002d` (dev.245)**. Thus PR #739 dev.247 is **not yet based on all current main systems**, despite its candidate version string. Main exact-head workflow [#41235075462](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41235075462) **subsequently PASSED focused validation and GitHub Pages publication**, confirming main dev.246 is hosted. Integrate/rebase the independent Phase 3 draft carefully before any future merge consideration; never overwrite #733 or the final Rising Trouble icon from merged #735. No merge or deploy is authorized just because tests pass.
- **Next required work:** (1) Inspect exact #739 head and latest focused job logs; check 42-room post-material image artifact against original #41234478316 images, **in particular the five side rooms**; reject excessive recoloring or artificial surface noise. (2) Run/inspect only relevant existing tests (`tests/mini-dungeons.test.cjs`, `tests/regional-handoffs.test.cjs`, `tests/greenwood-interiors.test.cjs`, `tests/treasury-fortifications.test.cjs`) plus `environment-phase3-interiors` and `environment-phase3-side-surfaces`, and the selected offline build/source-scope checks. Preserve trap telegraphs, entry/return, side direct-entry, monster families, Treasury three-cache gating, captain rewards, Quest Codices, independent rescue and old v4 saves. (3) Evaluate default Pixi scene and source-painter parity at working camera scale where feasible, without claiming device approval from simulated tests. (4) If the art genuinely benefits from targeted correction, implement/inspect/test it within existing owner standards; otherwise revert specific candidates and document why. (5) Reconcile *all touched docs*, current main, build/cache fingerprints, and update PR #739 with the final exact-head status and a clear next-phase handoff. Keep unmerged/deployed pending explicit authorization.
- **Owner's artistic standard:** designer + photographer + inhabitant/walker. Composition and readable purposeful use outrank decoration counts; respect lived-in shelter, work, food, watch/military/industry and authentic regional materials. The owner does not want obsession with road connections; road redesign is excluded. Five side dungeons must **at least** look coherent and aesthetically functional in their *current roles*, even while future narrative purpose is unselected. Never add made-up shrine religion, Archive flood explanation, foundry recipe, faction or SIBDL universe link.

**No claims made:** final owner artistic acceptance, native default-Pixi 14-room review, physical iPhone/Chromebook verification, full-game suite, merge or Pages deployment. The next session owns professional engineering execution, narrow remediation, tests and documentation, not merely planning.


### Subsequent cross-chat source reconciliation — current main after PR #742 (31 October 2026)

**Use this section with—not instead of—the full independent handoff above.** This is a dated source check; the next implementer must read GitHub again rather than assume it is still the tip.

- **Phase 2 exit is already documented**: draft [#736](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/736) reached its bounded GO/CI-green checkpoint on source `dba3e9f8`, while remaining **unmerged, unpublished and not owner-device verified**. Starting Phase 3 does not authorize merging or silently including #736.
- **Phase 3 has already begun**: active draft [#739](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/739) at `4375b8ef2c8fc37e3d724a0cd01cb9a74f1768a9`, with a 42-view original baseline and five proposed side-room material treatments **implemented only in the draft**. The post-treatment 42-view *aesthetic review*, relevant focused suite and exact-current-head offline consistency still need verified results. As checked here, no workflow runs/check runs were attached to this exact head; the older PWA green and earlier focused red are not equivalent to final-head acceptance.
- **New main milestone:** [PR #742](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/742) was subsequently **merged** at [main@`c1b5aa5bd`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/c1b5aa5bd90c295e8f72996430ec7b165f740c23), following already merged #733 and the final owner-approved Rising Trouble icon. #742 adds reset **presentation**, not altered reset mechanics. Its own PR-head 26-suite focused/offline and Chromium PWA checks passed, but the separate exact-merged-main [workflow #41238705746](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41238705746) was **in progress when checked**; do not assert hosted publication until it succeeds. Recheck on resume.
- **Important integration/version collision:** Phase 3 #739 still branches from old dev.245 base `282002dce`, lacks the now-merged #733 and #742 changes, and advertises **dev.247**, which is also the newest merged-main version from #742. Phase 3 may not be integrated by overwriting main's versioned `package.json`, `package-lock.json`, `src/prototype/build-info.js`, `sw.js`, sprite-scope evidence or release ledger. Source-reconcile with the latest main, select a genuinely subsequent candidate build where needed, preserve approved PWA icon and combat behavior, then run appropriate *exact-new-head* checks. Never treat a successful earlier run as validation of rebased code.
- **Next-session action:** Own the already-open #739 rather than starting another Phase 3 PR; check latest head, current main and CI, inspect all 14 current rooms at player scale (including **all five mandatory side interiors**), compare real post-material images to [the original artifact](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41234478316), fix or revert artistically weak material changes, validate original doorway/trap/guard/cache/save behavior and source/worker/doc consistency, update existing records with exact passing/failing SHA and a concrete Phase 3 GO/HOLD decision. Keep scope aesthetic, not new lore/quests/road network/sound, and **do not merge or deploy without owner authorization**.


### 31 October 2026 — dev.248 current-main source checkpoint (awaiting exact-head QA)

This same Phase 3 draft PR #739 now includes merged [main@`c1b5aa5bd`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/c1b5aa5bd90c295e8f72996430ec7b165f740c23) as a parent, after [exact-main focused/Pages PASS #41238705746](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41238705746). Reconciled versioned source is dev.248, preserving approved Rising Trouble icon, #733 Charmed combat, #742 reset visuals, v4 saves, source-audio and roads. The five existing side-room material candidates, the other nine protected interiors and the 42-view native Canvas artifact system remain intact. Final post-material screenshot comparison, original focused tests and artistic judgment are **not yet complete** at this checkpoint. Draft only; no merge, deployment, device or owner-artistic acceptance.
