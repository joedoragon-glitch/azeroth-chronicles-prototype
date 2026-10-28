# Greenwood Vale — geography, settlement and livelihood reconstruction audit

**28 October 2026 · Source/design audit · pinned baseline `main@2bab5c73a9492a91c39d2b261b958fab0f3548ee`**

**Status:** Documentation-only reconstruction audit. No gameplay, save, world geometry, asset, test, version or deployment changes. The requested *larger usable region* is an explicit design requirement to evaluate, not a silently approved final boundary. Keep [dev.209 interaction PR #538](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/538) separate, draft and unmerged.

The game's official player name is **So I Became the Dark Lord's Problem**. This repository retains its historic internal slug.

## Determination

Greenwood Vale is a *working rural woodland province* being reshaped by the Dark Lord's unfinished winter estate. Its current playable systems are richer than the map's visible explanation. The reconstruction needs **more working space and a coherent spatial economy** linking homes, fruit growing, a working mill, working fruit storage, trades, woodland operations, transport and the estate. It also must preserve dangerous Goblin/Skeleton territories, the Thornfang patrol, Scornfang's reclamation operations and the Lifebinder's story without turning every place into a ruin.

The owner reports that the current **2,700-unit side length is too small, compressing asset scale and limiting the rebuild**. Treat this as a serious layout constraint. **Do not simply shrink props or squeeze more decorations into existing streets.** Assess 3,200 and 3,400-unit scenarios, directionally expanding land and redistributing existing spatial content before selecting a final geometry. The map-size decision follows measured area, routes, occupancy and encounter pacing, not a blanket numerical rule.

The reconstruction standards are [Coastal Flooded Marches dev.134](COASTAL_MARCHES_DEV134.md), [merged PR #370](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/370), and [Appalachian Ironroot Highlands dev.138](HIGHLANDS_APPALACHIAN_DEV138.md), [merged PR #374](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/374): coherent geography and collision, meaningful settlement economies, purposeful regional edges, complete relocated compounds, defensible transport/roads, preserved enemy/quest/save identities, scoped procedural artwork and native visual checks.

## Audit method and evidence boundary

Reviewed current `src/prototype/data.js`, `rules.js`, `world.js`, `navigation.js`, `visuals.js`, `engine.js`, `renderer.js`, PR #538's draft notes, historical world/road/local-site audits, the two completed regional redesign audits, approved art handoffs and relevant migration/route tests. See [world-life fidelity](WORLD_LIFE_FIDELITY_V0862.md), [outdoor-road contract](OUTDOOR_ROAD_INFRASTRUCTURE_AUDIT.md), [world proportion/density guardrails](WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md), [current source state](DEVELOPMENT_STATE.md), [local quests](LOCAL_SITE_AUDIT.md), [approved pond](../tools/sprites/design-handoffs/approved-art-landmark-mill-pond.json) and [approved orchard](../tools/sprites/design-handoffs/approved-art-landmark-orchard.json). Owner's 28 October lore clarifications are saved in [PR #538's handoff comment](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/538#issuecomment-6468395642).

The owner's Mill pond screenshot is the supplied visual evidence. **No fresh live map-wide native screenshots, instrumented coordinates, current actual-player path timings, browser matrix, or hardware performance test have been completed for this audit.** Coordinates below are source-declared *anchors*, not measured final positions: safe-placement and saved migrations may move visible objects.

## Existing geographic and civic inventory

Current Greenwood Vale declared dimensions: **2,700 × 2,700 world units** (7,290,000 square world units); levels 1–4; **32 configured ordinary outdoor enemies**; **640-crown finite regional outdoor tribute pool**. World bounds, collision and the 50-unit navigation grid read regional size. Increasing the size changes actual traversal/search space and some spawn distribution, even if no combat values change.

| ID / place | Authored anchor | Current role / preservation constraint |
| --- | --- | --- |
| Millhaven | (300,350) | Primary town/refuge, Supplies, Captain/recruiter, quest board, services and new-player onboarding |
| Orchard Hamlet | (900,700) | Secondary settlement/refuge; houses, plots and workshops exist |
| Mill bridge `bridge-north` | (1200,750) | Northern river crossing; mandatory visit in **Keeping Trade Open** |
| Southern footbridge `bridge-south` | (1200,1750) | Southern river crossing; eligible discovery in **Who Owns the Woods?** |
| Named `orchard` | (1050,740) | Currently *Abandoned orchard*; named site, exploration and tribute association |
| Mill pond `mill-pond` | (780,1320) | Named *shore marker* and tribute association, not itself authoritative water collision |
| Western pond water | (630,1320), r=125 | Actual impassable water; landmark may be placed by the shore |
| Eastern water feature | (2050,1180), r=150 | A second, distinct actual water circle; preserve or explicitly redesign it |
| Woodland supply cache `cache` | (1550,1150) | Site, Scornfang-related owner clarification, outdoor tribute |
| Goblin roadside camp `goblin-camp` | (520,1050) | Named site/stronghold and active Goblin domestic territory |
| Thornfang field den | (760,1750) | Boss, Mira patrol/rescue context and field mini; not Scornfang |
| Old Orchard Cellars `den-ruins` | (540,2220) | Occupied Goblin side dungeon, `side-vale-cellars`, including Codex content |
| Skeleton watch | (1820,2260) | Unmarked Skeleton monster stronghold with care/watch/household details |
| Forest Crypt | (2150,2100) | Main dungeon entrance; incomplete winter estate, Lifebinder and Borin |
| Merchant wagon outward stand | (2450,650) | Separate existing onward-transport destination; retain travel/arrival identities |

North–south river barrier is roughly x=1160–1240 with bridge openings around y=660–840 and 1660–1840; actual visual banks bend using shared channel logic, so *do not* redraw a straight watercourse detached from collision. Main roads branch from towns toward field, transport, dungeons, named sites and inhabited areas. The road network is currently **version 17**.

**Existing life, not zero life:** Vale timber cottage/workshop/fence families; generic major/minor building rings; market, garden, well, cart, lumber, laundry, tax post, animal pen, fruit drying, hamlet orchard grove, estate construction materials and carpentry; three Goblin/Crypt/field habitat scenes; two named strongholds; and **18 declared `greenwoodRuralScenes` candidates** of sheep, poultry, furrows, hay and tools. `greenwoodCountryLife` can decline placements when roads, player buildings, NPCs, enemies or prop budget make them unsafe. Do **not** claim all 18 materialize in every saved game. Older `regionalHandoffScenes.vale` comments explicitly preserve the named orchard as wild; this design instruction now conflicts with the owner's newer direction.

Existing Vale tribute plan: `orchard-stores` 170 crowns (visible), `woodland-cache` 180 (visible), `pond-strongbox` 150 (initially hidden) and `bridge-toll` 140 (initially hidden) = **640 crowns**. Gathering is tied to actual labor/progression, not arbitrary prop pickup. Existing player income/quest awards are separate.

## Finding register and proposed disposition

| Finding | Priority | Evidence | Design disposition |
| --- | --- | --- | --- |
| **GV-01 Mill pond / missing mill** | P0 | `rules.terrain[0]` has real western pond water; `world.alignLandmarks` moves `mill-pond` onto its safe shore; `visuals.craftedLandmark('mill-pond')` paints *another `pool()`*. Owner screenshot shows the confusing juxtaposition. `data.regions[0].exploration` calls it a working mill, but the relevant landmark body lacks a recognizable dedicated mill structure. | Single legible pond with an authentic working mill/wheel, bank, practical milling area and road connection. Change visual drawing of landmark, **never silently delete ID `mill-pond` or alter actual water collision**. Reconcile both pond features by evidence, not by deleting the separate eastern water circle. |
| **GV-02 New orchard expansion** | P0 | Landmark named *Abandoned orchard* even though established smallholds and fruit grove exist. Owner specifies an expanding orchard to meet regional population/estate needs. | Retain `orchard` ID; revise label, inspection, art/fruit rows, staked saplings, tool/harvest frontage and appropriate paths. Keep existing collection/tribute and quest progress. Do not indiscriminately remove Goblin habitats or change displaced worker history. |
| **GV-03 Scornfang supply chain** | P0 | Woodland cache called generic `collector cache`; Scornfang is the Goblin superintendent of reclamation. Owner defines supplies being moved from old Crypt to the Treasury. | Working salvage/haulage staging with inventory, transport and links to the Crypt and the existing Treasury. No new money or loot from visuals. |
| **GV-04 Treasury ownership wording** | P0 | `rules.supplyRooms` calls `supply-vale` **Thornfang's Treasury**, boss key `thorn`; `rules.roomCaptains['supply-vale']` names its Goblin captain **Scornfang**. Owner calls the operation Scornfang's Treasury. | **Do not silently rename the gameplay Treasury or switch its boss/quest IDs.** Likely coherent distinction: Thornfang-associated established Treasury, administered by Scornfang for reclamation. Document exact in-world wording for owner review; mechanics and quest reference remain stable unless explicitly changed later. |
| **GV-05 Current working fruit cellars** | P1 | `Old Orchard Cellars` are an actual occupied Goblin family residence with paid preserves and a side dungeon, not unused missing content. Owner expects separate *currently used* fruit cellar for villagers. | Add working cellar/storage facade as **decorative non-interactable production scene** near current orchard livelihood, not a new dungeon, loot site or occupied-old-cellar replacement. |
| **GV-06 Southern footbridge** | P1 | Two physical crossings and existing discovery; owner requests no invented bridge lore. | Preserve automatic discovery; optional *direction-independent* north/south route hints drawn from final map, only if useful. No new bridge XP or unnecessary dialog. |
| **GV-07 Settlements and livelihoods separated** | P1 | Generic buildings, rural candidates, fruit grove, mills/estate/logistics not positioned as one readable economy; prop placement skips candidates. | Build complete working districts with roads, cart loading and production chain; shift/replace rather than indiscriminately add props. Keep quiet wilderness. |
| **GV-08 North-west crowding and edge use** | P0 pending measurements | Millhaven (300,350), Hamlet (900,700), orchard (1050,740), two close existing communities and river at x~1200; owner reports asset compression on actual phone. | Measure 150% camera service/frontage and structure footprints, usable land and crowding, then increase map bounds and **redistribute sites/compounds together** if supported. Do not treat map-size change alone as completed redesign. |
| **GV-09 Territory identities** | P1 | Goblin road stronghold, second Goblin orchard camp, Skeleton watch, Thornfang patrol/den, Crypt and field populations already exist. | Preserve enemy/species/guard IDs, patrol loops, Mira-following behavior, camp homes and property, Skeleton allegiances; visually distinguish organized estate administration from native territories. |
| **GV-10 Consistent localization/canon** | P1 | Source English names, quest objectives, app bilingual copy, earlier procedural-art handoffs and older docs will diverge if only the landmark label changes. | Update EN/ES player-facing inspection/map/quest-adjacent wording as appropriate; retain old history in historic docs, reconcile active design contracts and don't imply fully translated campaign. |
| **GV-11 Save, path and performance** | P0 acceptance gate | Region size affects path grid and spawn coordinates; road version and migration are already live; world prop budget `<=400` appears in existing focused integration tests. | Versioned source-aware migration with idempotent restoration, no duplicate props/revived actors or tribute resets; instrument route lengths, frame and memory effects. |

## Space-size options — declared arithmetic, not measured route or render results

| Candidate region | Surface area | Increase vs 2,700 | 50-unit route-grid cells | Relative ordinary-enemy area density if 32 remain fixed |
| --- | ---: | ---: | ---: | ---: |
| Keep 2,700 × 2,700 | 7.29 million | baseline | 54 × 54 = 2,916 | 100% |
| 3,000 × 3,000 | 9.00 million | +23.5% | 60 × 60 = 3,600 | 81% |
| **3,200 × 3,200** | **10.24 million** | **+40.5%** | 64 × 64 = 4,096 | **71%** |
| **3,400 × 3,400** | **11.56 million** | **+58.6%** | 68 × 68 = 4,624 | **63%** |

**Recommended evaluation sequence:** Test **3,200** as a serious first expansion scenario and **3,400** as a stronger option, especially because completed Highlands already has 3,400 side length. These are *candidates*, not final approved coordinates. A 2,700→3,200 extension adds 500 units in positive x and y and avoids requiring negative-coordinate shifts of the original Millhaven start; the resulting east/south extensions must be deliberately populated or rebalanced, not left blank. A 3,400 candidate adds 700 units along each axis and may give more room for full building footprints. Alternatively, evaluate a non-square/directional extension only if the rendering, navigation and zone-size contracts can support it without an unsafe redesign. **Current implementation assumes one region `size`**, so a rectangle is *not* a free configuration change.

The unchanged number **32** measures *configured ordinary enemies*, not actual fresh-frame encounter density or all boss/guard populations. Area-density figures are warnings, not evidence that a 3,400 map must have more monsters. Preserve enemy counts and combat values initially; **relocate existing pack homes and meaningful travel destinations**, not invent enemies to fill square miles. Measure typical route encounter gaps, journey times, aggro/retreat spacing and actual road usage at 150% camera to ensure the larger map doesn't become empty or artificially prolonged.

World placement already uses map size, density/caps and `route()`; the pathfinding grid goes from 2,916 to 4,096 or 4,624 candidate nodes. That can increase path searches and scenery work; **no FPS or memory effect is yet measured.** Keep the tested existing 400-prop budget as a *baseline performance constraint* during scenario comparisons, not a promise that every new farm can be added for free. Use selective composition and screen-visible hierarchy; any proposed budget change needs a profile and separate evidence.

## Proposed regional structure — layout principles, not locked coordinates

1. **Millhaven civic/rural center:** keep onboarding, trade, public services and clear refuge/frontage; let homes, carpenter, food supplies, smallholds and maintained roads serve daily residents. Move crowded props and/or selected whole compounds as necessary; preserve spawn and class onboarding.
2. **Orchard Hamlet production district:** village homes plus orchards, a new expansion orchard and a *current* working fruit-cellar facade with a small loading/processing frontage. Orchard rows must have room for normal hero and companion navigation.
3. **Mill-pond work district:** one real water body, readable working mill and wheel, shore-bank access, a cart/haul link to Millhaven and a legible bridge connection. Reconcile pond name, wheel relationship, terrain paint and collision before deciding exact placement.
4. **Reclamation route:** old Crypt → staging/woodland cache → Scornfang-supervised Treasury logistics; documentary/transport clues distinguish it from civilian food production and from Thornfang's scout patrol. Do not merge Scornfang and Thornfang or create a second functional Treasury.
5. **Estate approach:** visible unfinished conversion materials, genuine construction, guarded/safe service access and Lifebinder/Borin identity; not just a ruin-themed dungeon label.
6. **Wild woodland territories:** give Goblin and Skeleton territories enough separation, domestic specificity and scenic wilderness; retain Thornfang's den, temporary patrol with Mira and existing site/monster-fort identities.
7. **Crossings and trade:** retain both banks of both river crossings, road spurs, merchant wagon stand, wayfinding and intentional separation between civil and hostile routes. Southern bridge only needs geographic guidance, not a new plot.
8. **Landform and edge hierarchy:** deliberate meadows, woodland rises, orchard/farm slopes, actual water and riparian margins. Use extra land for meaningful inhabited/cultivated and wild destinations, not a uniform ring of trees, clone houses or empty margins.

**No speculative exact relocation coordinates are approved in this audit.** First run the layout feasibility comparison and inspect the actual rendered full-map. The accepted final plan should list *each* moved site, companion/captive/guard group, resource, travel stand, building and save migration.

## Protected progression and lore

- Keep **all six existing Vale regional quests** and stable IDs: `A Teacher Taken`, `Roads Under Threat`, `Stolen Stores`, `An Unfinished Retreat`, `Keeping Trade Open`, `Who Owns the Woods?`.
- `Keeping Trade Open` requires **Mill bridge and wagon stand**. `Who Owns the Woods?` requires **any three eligible Vale sites** (Goblin camp, orchard, old cellars, southern crossing, mill pond, woodland cache). The listed 175 XP is paid for claiming the **completed quest**, not automatically for stepping onto the footbridge.
- Preserve Thornfang, Mira following, Scornfang's separate identity, the Lifebinder and Borin, side-cellar Goblin families, native Skeleton allegiances, existing normal/TRUE and Treasury progression, quest caches and critical Codex `side-vale-cellars`.
- Keep `mill-pond`, `orchard`, `den-ruins`, `cache`, `bridge-north`, `bridge-south`, `goblin-camp`, `supply-vale` and other saved identifiers stable. Names/descriptions may evolve without creating extra duplicate gameplay markers.
- No new paid resources or encounters from decorative cellar or mill. Finite total remains 640 crowns, plus existing quest/dungeon rewards; no silent changes to combat/rewards/respawn/encounter numbers.
- Preserve merchant wagon transport, return/arrival, Barracks placements/upgrades, path orders, hidden/revealed tribute, collected-cache identity, quests/paid/deaths/rescues/party, save export and PWA keys. New map bound/road/scenery/encounter migrations must be idempotent.

## Reconstruction gates (future implementation, not run yet)

**Phase A — measured land-use baseline (required before final-size choice).** Generate actual fresh-region state for at least four deterministic seeds and an old v4 save; inventory successfully placed buildings, service NPCs, trees, rural props, enemies, forts, tribute and roads by coordinate/footprint. Record land coverage, walkable area by district, edge use, 150%-camera screenshots and travel distances/time, route encounter gaps and blocked/interactable targets. Compare real screenshot of pond/second water circle and all parcel/frontage collisions. Mark any hard cap and placement suppression.

**Phase B — 3,200 and 3,400 candidate layout proof.** On isolated local prototype/branch, build two reversible layout fixtures. For each: road/water/collision equivalence, river crossing continuity, safe transport and camp, destination route lengths, whole-compound relocation (boss/captive/guard/territory), patrol occupancy, enemy spacing, visible prop footprints, old-save migration and route-grid cost. Choose a target only from evidence, with a clear reason for any quiet land.

**Phase C — authored region implementation.** Version landform/water/settlement/road/landmark and scenic layout together; design mill and orchard, current fruit-cellar scenery and Scornfang logistics; update English/Spanish descriptions and existing artwork contracts; preserve protected sprite/master and procedural selection; no new raster art without distinct approval.

**Phase D — automated focused acceptance.** Use/enhance `tests/roads.test.cjs`, `town-street-audit.test.cjs`, `pt312-world-integration.test.cjs`, `world-aesthetic.test.cjs`, `local-sites.test.cjs`, `migration.test.cjs`, transport-departure tests, Trevor/Mira patrol tests, treasure/worker and regional saves tests. Validate seed determinism, max usable props, plotted/actual footprints, navigation, no clipped crossing/canal water, exact enemy identities, completed/partial quests, ranks, unexplored/hidden tribute, collected resources, hero/home recovery and double restore idempotence. Test performance and visual-equivalence scope for the unchanged four other regions.

**Phase E — native/real-device review and publication gate.** Capture native Canvas full-zone compositions, actual 150%-camera gameplay of town/working mill/new orchard/cellars/supply transfer/bridges/monster habitats, dusk/night, standard phone portrait/landscape and desktop. Review independent Pixi experimental presentation only to preserve no regressions; never claim parity/device FPS from Canvas snapshots. Run focused CI/build. **Owner approval is required before any merge and live publication; actual iPhone acceptance is a later distinct status.** Keep interaction PR #538 independent from this larger land/world effort.

## Immediate decisions and risks

- **Supported owner direction:** expand *usable* Greenwood, not compress props; active new orchard, Scornfang reclamation cache, occupied Old Orchard Cellars plus distinct contemporary working cellar, direction-neutral Southern bridge, actual mill for Mill pond.
- **Provisional technical design only:** start measurement with 3,200 and 3,400 candidates and likely positive-x/positive-y expansion to preserve existing origin where possible.
- **Unresolved narrative wording:** source calls the existing Treasury `Thornfang's Treasury` and its occupant captain `Scornfang`; clarify administrative vs name attribution before public text changes. Do not change progression contract as a guess.
- **Risks:** more navigation search space, 150% screen crowding if redistribution is poor, old save actor positions, river bank/road mismatches, accidentally orphaned quest sites, asset/provenance drift, increased world-paint/prop costs and blank enemy territory. These are gates to measure, not claims of current regressions.
- **No gameplay testing claimed:** this document is a source-grounded *audit and future acceptance plan*, not tested implementation or approval to deploy.

## Workstream separation

**PR #538:** interaction focus/inspection clarity, draft dev.209, unmerged, independently useful. **This documentation audit:** regional scope/canon/size comparison and design plan only. **Future implementation PR:** only after measurement and chosen bounds; keep isolated, preserve concurrent `main`, draft and unmerged until explicit owner merge authorization. Neither this audit nor an open draft is deployed software.
