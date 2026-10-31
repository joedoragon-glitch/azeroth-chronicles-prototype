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

**Status at this checkpoint:** Baseline 42 images inspected and Phase 3 material candidate in isolated draft PR #739. Final real before/after comparison, original relevant focused regression, sprite-source scope reconciliation, offline build, Pixi browser update and owner/device acceptance must be reported separately; none should be retroactively declared passed here.
