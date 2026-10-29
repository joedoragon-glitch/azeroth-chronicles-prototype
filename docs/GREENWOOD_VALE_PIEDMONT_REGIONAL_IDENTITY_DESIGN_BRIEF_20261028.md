> **29 October implementation reconciliation:** #570 implements the selected 3200-unit layout, source migration 1 and scene revision 2. The authorial decisions remain unchanged. This document preserves its original design/audit context; [current handoff](GREENWOOD_FLAGSHIP_WORK_HANDOFF_20261028.md) and [Development state](DEVELOPMENT_STATE.md) own current engineering, owner authorization, release and pending playtest status. Earlier directions to start measurement or await implementation are historical.

# GREENWOOD VALE — REGIONAL IDENTITY & IMPLEMENTATION DESIGN BRIEF

**Project:** *So I Became the Dark Lord's Problem*  
**Date:** 28 October 2026  
**Purpose:** Transferable design direction for Greenwood Vale's flagship reconstruction, coordinated through draft [PR #544](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/544) and [epic #545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545).  
**Decision status:** **Recommended creative direction, not a merged or implemented change.** The Piedmont inspiration in this brief is a proposal for owner acceptance. All existing player-visible lore, gameplay, assets and saved identities retain authority unless separately approved for change.

## 1. Executive design judgment

**Recommended identity:** *Greenwood Vale is an inhabited, productive woodland-and-river province inspired primarily by the eastern American Piedmont—particularly the rolling rural landscapes of Virginia and the Carolinas—interpreted through the game's independent medieval-fantasy society.*

The design objective is **not** to turn Greenwood into historical Virginia or North Carolina; nor to repaint it as a generic European forest or replace its assets with American colonial buildings. It is to make the natural landscape, cultivation, infrastructure, everyday labor, and location of political power feel like they belong to one specific place.

**One-sentence visual promise:** *Pastoral green foothills, red-earth roads, shaded hardwood valleys and working farms give way to older woodland territories and an unfinished ruler's winter estate.*

**One-sentence playable promise:** *Within the first ten minutes a new player understands the town, river, roads and nearby livelihoods; within an hour of optional wandering they can discover that Greenwood is simultaneously a home, a contested woodland and an administrative estate.*

This is **substantive opening-region completion**, not just cosmetic polish. It should improve the first-hour experience without requiring a new combat system, new quests, extra paid rewards, new monster species, or wholesale sprite replacement.

## 2. What is grounded in PR #544 versus proposed here

### Source-established / current project direction

PR #544 is a **draft documentation/handoff PR**, not the regional gameplay implementation. It now frames Greenwood as the game's flagship opening region, with project epic [#545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545) and phases [#546](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/546)–[#551](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/551). Read its two documents before implementing:

- [Geography, settlement and livelihood source audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audit/greenwood-region-reconstruction-20261028/docs/GREENWOOD_VALE_GEOGRAPHY_SETTLEMENT_LIVELIHOOD_AUDIT_20261028.md)
- [Flagship completion Work handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audit/greenwood-region-reconstruction-20261028/docs/GREENWOOD_FLAGSHIP_WORK_HANDOFF_20261028.md)

Current source-declared Greenwood parameters in that audit: **2,700 × 2,700** world units, level **1–4**, **32 configured ordinary outdoor enemies**, **640 crowns finite outdoor tribute**, an approximately north–south river with **two crossings**, town and hamlet, two distinct water bodies, several inhabited creature territories, a main dungeon and a separate Goblin side interior. Current authored anchors are not the same thing as measured final positions after safe placement or old-save migration.

Approved goals already in the PR include: more usable land for appropriately scaled structures; a **single legible working mill pond** instead of redundant nearby pond artwork; an **active new orchard expansion** replacing the named abandoned-orchard concept without changing ID; **Scornfang's reclamation cache**, not confusion with Thornfang; preservation of occupied Goblin **Old Orchard Cellars** alongside a separate decorative working fruit cellar; preservation of the **southern footbridge** and its discovery behavior; and coherent livelihoods and the first 10–60 minutes of play.

Existing mechanical and narrative systems remain authoritative: all six regional quests, Thornfang/Mira, Lifebinder/Borin, Scornfang, Skeleton allegiances, Goblin household sites, Treasury progression, two bridges, merchant wagon, regional saved IDs and rewards, PWA saves and version-4 save migration. [PR #538](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/538) is a separate interaction project.

### New recommendation in this brief

The **American Piedmont geographical/art-direction layer**, the vegetation-and-soil hierarchy, the visual district grammar, the specific rural landscape cues, and the spatial storytelling/first-hour acceptance examples below are **proposals**. They are not yet established in-game canon simply because they appear here. Exact new location coordinates, tree quantities, architectural variants and new lore are **not approved** by this brief.

## 3. The environmental model: a Piedmont-like temperate river valley

The Piedmont is the broad physiographic belt between the Appalachians/Blue Ridge and the Atlantic Coastal Plain. Unlike mountains, it features long rolling ridges, low rounded hills, stream-cut valleys and modest isolated rocky rises. This is a strong basis for Greenwood precisely because it remains recognizably different from the already Appalachian-inspired **Ironroot Highlands** and Florida-inspired **Flooded Marches**.

### Six landscape rules

1. **Topography:** suggest gentle uplands, shoulders and shallow creek valleys; do not introduce dramatic alpine cliffs or a new gameplay elevation system. At Greenwood's 2D/isometric scale, topography can be implied by winding paths, staggered forest edges, rock exposures, bank shading and ridge-like meadow transitions.
2. **Forest:** default to **oak–hickory and mixed hardwood woodland**. Put mature broad-canopy trees on middle slopes, moist beech/tulip-poplar/red-oak-like assemblages in protected hollows, limited shortleaf/Virginia-pine-like groves on dry exposed rises. Existing tree sprites/procedural canon remain the starting material; species names guide silhouette, clustering and palette, not an automatic mandate for replacements.
3. **Stream margins:** use denser, greener growth along the river and low drainages. River birch, sycamore-like trunks, red maples, fern-rich understory, exposed roots and bank sediment can establish a **riparian** visual grammar (riparian means land beside rivers and streams). Keep solid bank/water collision exactly matched to what is drawn.
4. **Soil and roads:** warm red-brown/clay-orange soil can show in worn cart paths, field boundaries and exposed cuts; undisturbed forest soil remains darker and leaf-littered. Avoid saturating the entire map orange. Red clay is a regional visual accent, not a total ground recolor.
5. **Clearings:** fields, orchard blocks, yards and pastures are irregular islands of human/inhabitant land use in woodland, rather than one continuous park lawn. Visual boundaries arise naturally from fence lines, hedgerows, drainage and work routes.
6. **Water:** real Piedmont examples commonly have **artificial mill ponds and farm ponds** rather than abundant natural lakes. The western mill pond should read as a purposeful impoundment feeding a mill. The separate eastern water feature remains a distinct existing water body until evaluated; an estate reservoir, farm pond or wooded pond are possible contextual identities **only if location and lore fit**, not an automatic rename.

**Climate and season:** Greenwood should feel temperate and welcoming in its normal presentation: predominantly green, warmer and more cultivated than Ironroot. A plausible Piedmont analogue has hot humid summers, cool to moderately cold winters and occasional snow. This supports a *winter residence* as a sheltered seasonal retreat, but **does not prove** that Greenwood has the same seasons as North Carolina or that the volcanic Dark Crown is colder. The original reason for the Dark Lord's winter estate remains canon to be described, not retroactively explained by assumptions.

**Distinctiveness test:** In an unlabelled screenshot, Greenwood should be distinguishable by *green rolling farmland meeting mixed hardwood forests, warm clay paths, small-scale waterways and production buildings*; Ironroot by mountain relief, autumn forests and mineral industry; the Marches by coastal wetland hydrology. Do not import Ironroot's dominant orange fall palette or the Marches' swamp habitat into Greenwood.

## 4. Proposed functional spatial hierarchy, without locking coordinates

The landscape should organize itself through recognizable **land use** rather than merely arranging markers around quest objectives. Keep the river, two crossings and all existing destinations, but evaluate actual layout after measurement.

### A. Millhaven: accessible civic and agricultural threshold

**Present canon:** main town/refuge, recruitment and supplies, quests, onboarding, services; authored anchor approximately (300,350).

**Proposed reading:** a practical crossroads village in a wooded, productive basin. Favor clear pedestrian frontage, working lanes, gardens, modest homes, stacks of firewood, simple timber-and-stone work areas and a legible road leaving town. Avoid a huge castle square or overpacked decorative market. The player's starting sightline should reveal a safe path and one nearby indication that this is a functioning community.

**First-hour experience:** town services are easy to locate without hiding doors behind scenery; the player can recognize the route toward Orchard Hamlet and the first credible working landscape. Preserve existing quests and class starts. No additional tutorials are implied.

### B. Orchard Hamlet and the new orchard: recognizable production district

**Present canon:** secondary refuge, houses and workshops; named `orchard` presently associated with the outdated *Abandoned orchard* identity; authored hamlet/orchard anchors approximately (900,700)/(1050,740).

**Proposed reading:** an older village with an **expanding cultivated orchard**, not a ruin. Differentiate established fruit-bearing trees from new saplings supported by stakes, uneven rows following the land, narrow pedestrian tracks, harvest crates, drying frontage and a **separate contemporary fruit-cellar facade**. Neighboring homes and workspaces show why residents preserve the crop and how it travels onward. Use existing approved orchard imagery/procedural families wherever possible, adding only necessary visual states and arrangements.

**Avoid:** implying an entire monoculture plantation, inventing a new paid resource, turning the decorative cellar into another dungeon, or replacing the Goblin-occupied Old Orchard Cellars.

### C. Mill pond and working mill: a logically connected water-power site

**Present canon:** `mill-pond` is a shore marker near actual impassable western pond water (western water roughly (630,1320), radius 125; named marker near (780,1320)); current landmark art paints a confusing additional small pool. A distinct eastern water body exists near (2050,1180), radius 150.

**Proposed reading:** **one physical mill pond**, a controlled bank or dam/sluice, a visible mill house, wheel or flume, and a practical loading apron or cart road. For believable waterpower, water must reach the wheel from the *higher* pond/headrace and exit to a lower tailrace or stream. The graphic can simplify the hydraulic system, but it should not imply that a wheel randomly touches a static, unconnected circle of water. If the engine lacks natural channels near the pond, use the smallest grounded visual connection that fits collision and seed layouts.

The mill's precise crop/output is **not established** in PR #544. Grain milling is an appropriate *candidate*, not an instruction to add grain commodities or crafting systems. A mill should look operational without promising interactions that the game does not support.

### D. Trade infrastructure: the two bridges and wagon

**Present canon:** river approximately x=1160–1240, northern mill bridge near (1200,750), southern footbridge near (1200,1750), east/northeast merchant wagon stand near (2450,650). `Keeping Trade Open` depends on the mill bridge and wagon stand; the southern crossing contributes to an existing optional regional survey.

**Proposed reading:** the main bridge is the obvious maintained freight crossing, with approaches broad enough for the game’s characters/companions and readable at 150% camera. The southern footbridge is a quieter walking link through woods; it does not need its own invented origin myth, paid XP or new NPC. Roadside visual cues should be based on true physical destinations, not a player's assumed direction of arrival. Wagon traffic should read as connected to Millhaven, Orchard Hamlet and the onward journey.

### E. Woodland neighborhoods: inhabited, contested country

**Present canon:** Goblin roadside settlement, separate orchard-associated Goblin habitat, occupied Old Orchard Cellars Goblin household, a Skeleton watch, Thornfang's independent patrol/den and Mira rescue context. The characters have established homes and relationships, not merely interchangeable enemy spawns.

**Proposed reading:** woodland changes from actively maintained roads to enclosed, older, inhabited territory. Distinguish Goblin domestic life from their military/treasury tasks; distinguish Skeleton households and affinities from the Lifebinder's estate administration. Small signs of occupancy—paths, firewood, cooking/working areas, repaired shelters and worn approaches—give each community specificity. Keep their own territories and combat clearances; do not make all monster dwellings into burned ruins or turn everyone into employees of the Dark Lord.

### F. Scornfang's reclamation route and winter estate

**Present canon:** Woodland cache near (1550,1150) relates to Scornfang's material movement from the old Crypt to the Treasury. Forest Crypt near (2150,2100) leads into the Dark Lord's unfinished winter residence, associated with the Lifebinder and Borin. The existing gameplay Treasury is named **Thornfang's Treasury**, while its Goblin captain/superintendent is **Scornfang**. Thornfang the patrol chief is distinct from Scornfang.

**Proposed reading:** a visible logistical chain—material recovered or repurposed near the old Crypt; categorized/staged at Scornfang's cache; cart, timber and stone movement toward the established Treasury/estate operation. Roads, guarded staging and material differences should communicate the chain even without adding dialogue. The estate approach should show *construction and adaptive reuse*, not simply a neglected haunted ruin. Place this more formal, resource-consuming complex into a modest wooded rise or sheltered compound **only after the layout study**; do not assume a new literal elevation mechanic.

**Lore open question:** Should players see the Treasury called “Thornfang's Treasury,” with Scornfang administering it, or a revised public attribution? Keep the current gameplay IDs, title and ownership logic unchanged until the owner decides. Do not create a second Treasury to resolve wording.

## 5. A material and architectural identity without replacing the asset catalog

The counterfactual is **medieval fantasy developed on North American ground**, not a reconstruction of 18th–20th-century American colonial life. A red-painted barn, white picket fence, plantation mansion or frontier saloon is **not** automatically appropriate merely because it is American.

Use a shared, preindustrial material language shaped by climate and local supply:

- **Civilian homes:** existing Vale timber cottages and workshops, with weathered wood, split-log/rail fencing where useful, wood shingles, short stone foundations, lean-to work shelters and rain canopies. Preserve current game silhouettes and sprite provenance; refine layout, color and surrounding work scenes first.
- **Orchard/farm structures:** smaller storage, hand tools, rough fences, drying racks and modest fruit cellars; no new functional work system without authorization.
- **Mill:** visually larger, with sturdy foundation, readable wheel/flume and a supply route. It should look like one of the valley's principal pieces of infrastructure.
- **Roads and bridges:** exposed clay/gravel where traffic is heavy, leaf-litter paths in forest, appropriately maintained decks at trade routes, lightly used timber footbridge in the south.
- **Estate/Crypt approaches:** more regular stonework, reused older structures, construction timber, organized supply stacks and administrative control. The difference from civilian places comes from *organization, cost and access*, not a mandatory Gothic castle redesign.

**Primary art rule:** reuse accepted procedural designs and existing illustrated sprites; vary grouping, terrain, footprints and local props first. Introduce new procedural elements only when a specific missing function (e.g., actual mill wheel) cannot be conveyed using current art. New raster/AI assets are **not** assumed necessary or approved. This remains consistent with the game’s procedural-art canon and its protected master assets.

### Selective optional American botanical details

American pawpaw is native to eastern US wooded slopes and stream bottoms; native persimmons and black walnut are also plausible in a broadly eastern American analogue. These could appear *sparingly* along sheltered edges if the existing art direction supports them. Do not replace the orchard's established fruit species, assign agricultural history or invent harvesting mechanics merely to make the scene more American. These are authenticity accents, not production dependencies.

## 6. Color, weather and visual hierarchy

**Indicative palette hierarchy, not exact hex requirements:** medium-to-deep spring/summer greens for countryside; cooler shadow-green for ravines; subdued gray-green and olive around riparian soil; red-brown only for exposed clay roads, ruts and cuts; honey-colored timber and muted stone for settled sites; cooler/desaturated or more formal stone and work material at the estate. Strong spectacle remains reserved for identifiable encounters and supernatural effects.

**Readability rules:**
- A tree canopy can overhang a path visually but must not conceal key NPCs, hostile telegraphs, entrances or the player's feet at normal camera scaling.
- Farm rows, pond banks and bridge approaches must be immediately distinguishable from walkable terrain.
- Each district needs a *dominant large-form composition*, not five equally loud decorative details.
- Day/night atmosphere should modify mood rather than changing the identity of landmarks; maintain Canvas 2D and opt-in PixiJS presentation checks.
- Prefer patchiness and meaningful gaps to covering every vacant grid cell in grass, flowers or props.

## 7. Spatial storytelling: what should the player infer without new quests?

**Millhaven → countryside:** people actually live and work here. There is food, timber, water access, trade and simple local order.

**Orchard expansion:** the population and estate demand more produce; residents invest in new planting and storage. This can be suggested through sapling rows and crates without writing an economics tutorial.

**Mill pond → trade bridge:** waterpower and roads make local agriculture and regional trade viable.

**Woods and southern crossing:** not every route is an official road, and the woodland belongs to more than one community.

**Scornfang cache → Crypt/estate:** a program of reclamation and official resource control is underway, with an uneasy relation to the valley’s ordinary livelihoods.

**Skeleton watch/Old Orchard Cellars:** strange inhabitants also have domestic identities; the world is not divided neatly into friendly villages and empty monster arenas.

The estate's political character should be legible but not overexplained. Keep the Dark Lord's existing mixture of useful infrastructure, coercion, individual loyalties and incomplete construction. Don't silently add atrocities, ecological disasters or sentimental reconciliations for atmosphere.

## 8. First-session acceptance as player journeys

These are **inspection scripts**, not promises of exact in-game timings. Test with actual classes, seeds and camera settings.

**First 10 minutes — deliberate clarity:** fresh hero arrives in Millhaven; safe service/quest/recruitment points are visible and interactable; a sensible road leads into living farmland; the player can recognize at least one economic feature and a second destination without opening several nested information screens; travel isn't interrupted by an accidental graphic obstruction. The existing interaction PR #538 remains a separate code path.

**First 30–60 minutes — optional curiosity:** a player who ignores main quest routing can follow contrasting loops to Orchard Hamlet, the working mill/bridge, a quiet woodland path, the southern crossing, and hints of an occupied monster territory or estate operation. Every walk has at least a *change in land use, recognizable landmark, route choice, discoverable activity or existing encounter*; no mandatory new side quests or bonus XP.

**Return journey — coherence:** when the player retraces a route, buildings and production spaces still explain where they are; the map is not a random scattering of objects and roads do not dead-end in decorative props. Existing stable map discovery, transport and save positions remain intact.

### Scene-level criteria

A reviewer should be able to answer **yes** to these observations from native 150%-camera screenshots and play:

1. Can they visually identify a true *working mill*, not two adjacent unexplained pools?
2. Does the orchard read as *actively expanding*, with production and storage consistent with village life?
3. Is Millhaven a usable, inviting *first town*, not overcrowded scenery or inaccessible frontages?
4. Do the river, bridge decks and real collision agree in both renderers?
5. Do the Goblin and Skeleton sites look *inhabited* rather than all being generic ruins?
6. Does Scornfang's salvage route visually explain why the cache exists without renaming Thornfang or inventing a Treasury?
7. Can a player reach and leave every key service, dungeon, bridge and transport, including with companions?
8. At 150% camera, do structures have appropriate proportions and enough actual walking/fighting space?
9. Are peaceful open intervals preserved between combat and dense scenery without long, empty travel deserts?
10. Can a newcomer infer a logical region-wide structure without reading the internal design document?

## 9. Map expansion: choose measured function, not attractive arithmetic

The owner regards the present **2,700-square-side map as too cramped**. Accordingly, 3,200 and 3,400 candidate maps must be seriously compared. The chosen expansion must give more **usable land**, not simply more edge pixels. Do not shrink assets to avoid the question.

| Side length | World area | Change from current | 50-unit grid | 32-enemy raw area density vs current |
| --- | ---: | ---: | ---: | ---: |
| 2,700 | 7.29 million | baseline | 2,916 nodes | 100% |
| 3,200 | 10.24 million | +40.5% | 4,096 nodes | ~71% |
| 3,400 | 11.56 million | +58.6% | 4,624 nodes | ~63% |

These figures come from the PR audit's simple declared arithmetic. **They are not observed performance, measured real encounter density, or an instruction to spawn more enemies.** The completed 3,400-side Ironroot is a useful comparative scale, not proof that Greenwood must share its size. Current outdoor code assumes a square `size`; an arbitrary rectangular extension would require more than a scenery edit.

**Recommended decision procedure:** measure actual placed scenes for at least four seeds plus a representative old v4 save; compare 2,700 actual footage with two reversible 3,200 and 3,400 fixtures; inspect usable land and collision buffer around towns, mill, orchard, crossings, camp, estate and dungeons; measure typical travel lengths, pathfinding costs, route encounter gaps and no-enemy intervals; examine phone portrait/landscape and desktop at 150% camera. Choose the **smallest candidate that satisfies proper asset scale, coherent district spacing, route variety and first-hour pacing**. If 3,400 creates dead space or costly route searches, revise distribution or select 3,200 rather than filling it with extra enemies.

**Placement priority:** move complete site/compound groups together when necessary—boss, captive, guards, home/patrol area, entrance, return target, props and quest/tribute relationships. Retain original IDs and version the migration. Measure the old user-built Barracks and work orders. Preserve the existing 400-prop integration-test budget as a baseline constraint until profiling justifies any change. Final coordinates are **not** specified in this document.

## 10. Practical content and rendering guidance

1. Use **existing seeded scene/prop placement** where possible, but define a minimal reliable authored core for each flagship landmark. Optional rural decorations may skip safely; the *working mill, orchard expansion and essential road frontages cannot depend on the luck of available prop slots*.
2. Use **semantic zone masks** or existing equivalent classification where feasible: civic, orchard, mill/pond, open pasture, riparian, ordinary woods, monster territory and estate/logistics. This is an artistic layout specification, not a request for a new global biome engine.
3. Keep *visual geometry and navigation/collision geometry aligned*: a painted bank must match the actual water edge; a walking path must lead to reachable doors; bridges must clear the same river space for paint and pathfinding.
4. Prefer **composition substitution** over total prop growth: remove an isolated generic cart that says nothing, and use its budget for a correctly positioned cart at the mill or Scornfang staging area.
5. Isometric scenery should not imply a new vertical navigation dimension unless the engine actually supports it. Hills can be expressed through controlled terrain patterns and arrangement rather than untested slopes or height-based movement.
6. Maintain actual sprite canon, provenance and fallback. Canvas remains the default renderer; WebGL/PixiJS remains an experimental, optional renderer. Region work must not become a disguised renderer replacement.
7. Keep existing **English/Spanish** player-facing copy consistent whenever names, inspections or map hints change. Preserve stable IDs, discovery flags and reward state even when visible text evolves.

## 11. Required implementation gates aligned to epic #545

**GV-A — [#546 baseline and size proof](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/546):** add the Piedmont landscape target as a candidate design reference; measure all existing scene placement and player-view clearances; compare reversible 3,200 and 3,400 fixtures. **Output:** evidence-based chosen dimensions and a before/after spatial plan, without yet declaring final device success.

**GV-B — [#547 geography and routes](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/547):** implement selected bounds, meaningful river/water/road hierarchy, correct crossings and whole-compound relocation. **Output:** accessible, collision-equivalent geography and versioned spatial saves.

**GV-C — [#548 settlement livelihood](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/548):** make Millhaven's rural settlement structure, Orchard Hamlet/new orchard, working mill, working cellar facade, estate construction and transport labor visually credible. **Output:** organized production districts in native game screenshots, not a broader sprite catalog.

**GV-D — [#549 lore/site consistency](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/549):** reconcile name/inspection copy, Scornfang Treasury wording without changing IDs, existing occupied old cellars, optional bridge wayfinding, all quests, awards and EN/ES. **Output:** no accidental retcons or new mechanics.

**GV-E — [#550 first-session showpiece](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/550):** test first ten minutes and optional 30–60 minute wandering; adjust only proved rough spots in entry, wayfinding, local atmosphere and experiential sequence. **Output:** opening-region quality evidence from actual play and full compositions.

**GV-F — [#551 compatibility and acceptance](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/551):** focused route/collision/quest/scene migration tests, old v4 saves, double-reload idempotence, Canvas scenes, opt-in Pixi regression checks, deterministic populations, money, phone legibility, measured performance where available. **Output:** exact-commit evidence and approval pack. A code change can be *implemented* and *tested* without being merged, published or device-verified.

**Stop conditions / exclusions:** no change to the 0.9.2 functional-completion release definition; no extra enemies, paid quests or altered Crown totals without a distinct owner decision; no new art-master replacement or automatic rebrand; no changes to unrelated regions to satisfy Greenwood aesthetics; no merger/deployment or comprehensive full-game suite without the established approval process.

## 12. Risk register and explicit non-goals

| Risk | Mitigation / refusal condition |
| --- | --- |
| “American” becomes literal colonial-town visual pastiche | Use *ecology, materials, labor and settlement logic* first; retain medieval fantasy silhouette canon. |
| Blue Ridge/Highlands aesthetics bleed into Greenwood | Keep Greenwood low rolling terrain, mostly green woodland and farms, not steep autumn mountains. |
| Generic scenery crowds roads and services | Measure walkable gaps at 150%; substitute props and relocate whole compounds. |
| Map enlargement creates empty, low-combat acreage | Evaluate actual routes/encounter gaps, not enemies per square unit alone. |
| Trees obscure combat or important objects | Keep readable canopies, separate visual footprint and collision, verify both renderers. |
| Mill water paint diverges from physical collision | Use a shared water geometry source; correct duplicate `pool()` appearance; no silent water deletion. |
| New layout breaks old saves or rescues | Versioned idempotent migration, seeded and old-save fixtures, keep identities and pending orders. |
| Stage decoration implies unavailable gameplay | Avoid promises of interactable mill/cellar, new harvest or economic processing without engine support. |
| Narratively collapsing Scornfang and Thornfang | Protect distinct identities, current Treasury rules and documented attribution question. |
| Distinctive flavor becomes new workload spiral | Treat new flora, ambient creatures and local food as optional accents, not new release blockers. |

## 13. Small but important cultural boundary

“Medieval America” is a speculative fantasy design premise, **not** a claim that the Americas had no organized settlements or agriculture during the European medieval period. Historical Indigenous societies included complex farming communities and cities (for example, Cahokia), with diverse political and architectural traditions. This brief does not prescribe copying any living Indigenous culture, collapsing several peoples into one aesthetic, or imagining the landscape as culturally uninhabited before European-style development. The immediate Greenwood project is about geography, livelihoods, existing fantasy societies and authorial identity; broader world cultural design is a **separate discussion**.

## 14. Final recommendation for the PR #544 team

**Accept the American Piedmont as Greenwood Vale's proposed primary real-world environmental reference, subject to the owner's explicit creative approval.** Treat it as an overlay that guides terrain composition, land use, flora, mill hydrology, spatial separation and architecture's materials—not as a license to overwrite established fantasy lore or assets.

Prioritize, in order: **(1) real measured map/layout freedom; (2) understandable river/pond/bridge geography; (3) clear first town and orchard/mill livelihoods; (4) inhabited monster territories and reclamation/estate logistics; (5) first-hour scene quality; (6) exact compatibility/performance acceptance.** Existing approved quests, companions, bosses and rewards must remain intact.

**Working art-direction label:** *American Piedmont woodland fantasy — a living, contested river valley under an unfinished winter estate.*

---

## Research / visual reference index

These sources support **real-world plausibility**, not claims about game implementation:

- U.S. Geological Survey, *Appalachian Piedmont and Blue Ridge provinces*: [regional topography and relationship to mountains](https://www.usgs.gov/centers/florence-bascom-geoscience-center/science/piedmont-and-blue-ridge-project).
- North Carolina Wildlife Resources Commission, [Piedmont habitats](https://www.ncwildlife.gov/wildlife-habitat/habitats-types-north-carolina/piedmont-habitats): forest mosaics, floodplains, human-made farm and mill ponds, and varied managed clearings.
- North Carolina State Extension, [species/site relationships in the Piedmont](https://content.ces.ncsu.edu/managing-the-right-species-on-the-right-site-part-1): upland oak, pine and wetter bottomland hardwoods.
- U.S. Geological Survey, [Piedmont soils and landforms](https://pubs.usgs.gov/publication/70015958): clay-rich soils, incision and small valleys.
- WFDD / cooperative extension, [red-clay soils and iron oxides](https://www.wfdd.org/environment/2025-09-22/carolina-curious-how-does-ncs-red-clay-soil-get-its-signature-hue).
- National Park Service, [mill race and water wheel](https://www.nps.gov/places/mill-race.htm): directed water flow powering milling operations.
- California State Parks, [Bale Grist Mill](https://parks.ca.gov/?page_id=482): millpond, flume, wheel and loading/work layout as an illustrative hydraulic reference, not an architectural template.
- North Carolina Historic Sites, [Horne Creek Farm](https://historicsites.nc.gov/all-sites/horne-creek-farm): agricultural life and apple orchard documentation. **Historical era circa 1900: use for functional layout and rural work only, not automatic medieval building designs.**
- U.S. Forest Service, [pawpaw species ecology](https://research.fs.usda.gov/feis/species-reviews/asitri).
- North Carolina State Climate Office, [winter patterns](https://products.climate.ncsu.edu/weather/winter-storms/): winter climate plausibility; game season lore remains separate.
- OpenStax, [settled agricultural communities of the Americas](https://openstax.org/books/world-history-volume-1/pages/8-3-the-age-of-empires-in-the-americas): historical nuance in the American-medieval counterfactual.

**Research boundary:** these links establish habitat and historic infrastructure patterns. They do not tell us which exact in-game trees, water shapes, temperatures, mill machinery, estate architecture or food crops are currently present. Those decisions require reading live source/canon and comparing in-engine scenes.