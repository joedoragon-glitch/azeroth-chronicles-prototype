# World proportion, edge-space and encounter-density guardrails

Status: **authorized layout and sprite-production policy; geometry changes pending measured audit**. Added 9 October 2026 from Joel's instructions. This is not a claim that world bounds or individual placements have already been changed or tested.

## Scope and intent

Before the general 150% sprite adaptation proceeds, audit and proportionally enlarge, when justified, houses and workshops; dwellings, caves, dungeons, treasuries and other entrances to playable interior spaces; every tree including the Abandoned Orchard; zone-transition transports; and Dark Lord occupation and oppressive structures (forts, watchposts, gates, towers, barracks, prisons, shrines and strongholds).

A **25–50% increase in world-space display dimensions** is the initial *review range*, **not** a universal multiplier or instruction to scale gameplay units or the camera again. Select per-object targets from actual in-game proportion to the hero, plausibility, affordance, contextual appearance and silhouette. Bigger structures must receive meaningful, readable detail; never just enlarge the old 100% processed export. Keep the accepted procedural identity while rebuilding from untouched original generated artwork per [SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md). Trees should retain species, canopy and rooted grounding; doors and transport boarding points should remain visually and mechanically legible.

## Layout order of operations

1. Inventory instances **in all outdoor zones**, including authored and generated props, roads, towns, hamlets, Abandoned Orchard, monster habitats, transit routes, forts and outer boundaries. Measure hero-to-object scale and actual projected/ground footprints; distinguish tall-overhanging sprite pixels from physical blockers and walkable entrances.
2. Record each zone's present occupancy and **edge utilization**: scenery density, road access, obstacles, traversable margins, patrol or quest paths, and deliberately empty wilderness. Empty border space is not automatically a defect; respect environmental story and keep wild territories wild.
3. Increase important objects' visual footprint and detail target. First relieve overlap by reducing redundant dressing, adjusting local spacing and moving suitable buildings/scenery toward genuinely underused outer portions of the *existing* zone. Preserve logical grouping (town streets, orchard rows, stronghold compounds, transport arrival and departure points) and retain sensible safe routes around them.
4. **Only when existing space cannot provide a coherent arrangement** may the affected outdoor zone boundary be expanded. Prefer a **small, directional edge extension** near the bottleneck; do not uniformly scale the whole region or every coordinate. Do not automatically expand interiors or neighboring zones. Use the minimum useful expansion and measure its area, traversable area and route changes.
5. Re-audit collision footprints, road blockers, pathfinding, camera/world clipping, occlusion, draw ordering, door/entrance interactions, zone transitions, encounter trigger and aggro reach, boss/quest sites, NPC services and landmarks. A visual enlargement alone must not silently enlarge collision or move a transition.
6. Generate fresh detailed sprites at their **final world footprint** and 150% camera raster target. Rebuild from untouched accepted masters rather than upscaling low-resolution in-game assets; validate in actual day/night/combat contexts on supported desktop and phone displays.
7. Preserve prior layouts, original art, intermediate lineage, registry history, saved-game compatibility and reversibility. Use versioned migrations for any regenerated zone layout so loaded saves receive consistent placements without resets.

## Enemy density is a blocking constraint, not an afterthought

The existing five outdoor regions have the following **code baselines** from `src/prototype/data.js` (these are configured counts, not a field-measured encounter-density audit):

| Region | Side length (world units) | Configured ordinary enemy count |
| --- | ---: | ---: |
| Greenwood Vale | 2700 | 32 |
| Flooded Marches | 3000 | 40 |
| Ironroot Highlands | 3400 | 48 |
| Ashen Frontier | 3400 | 56 |
| Dark Crown | 3800 | 64 |

`Campaign.zoneSize()` reads region size; `navigation.js` uses it for traversable boundaries and pathfinding. `world.js` places portions of ordinary enemy packs with formulae involving `size - 900` and `size - 800`, while other groups/occupation anchors and quests are separately authored. Simply increasing `size` is **not** a harmless art operation: it changes spawning distribution, travel and pathfinding, and can create dead space in the existing encounter network.

**Do not add enemies, increase spawn rates, strengthen mobs, alter rewards, scale attack ranges or require new monster content to compensate for decorative changes.** First keep the current boundaries and reposition/reduce scenery. If a local expansion is essential, preserve existing authored combat/quest anchors and pack relationships. Assess encounter **density along actual playable routes and relevant monster territories**, not only total enemies divided by total square area. A small quiet edge buffer may be acceptable, but new featureless or excessively long monster-free traversals are not.

For any proposed expansion, capture before/after evidence:
- Area of original and enlarged map; traversable land by district; occupied space at edges.
- Spawn/home locations, ordinary-pack counts, unique groups and boss/guard sites unchanged or explicitly reconciled.
- Representative route lengths and travel times from settlement to main quest, orchard, transports, dungeons, entrances and hostile territories, plus pack contacts on those routes.
- Nearest-enemy distances and encounter-gap distributions along common paths, patrol separation, aggro/retreat opportunities and combat visibility at 150%.
- Screenshots at minimum supported portrait, landscape and desktop viewports showing structure/hero proportion, legibility and an uncluttered travel corridor.
- Saved-game reload/migration, all zone exits/arrivals, roads around new footprints, collision and performance checks.

**Reject or revise** an expansion if meaningful encounter pacing or traversal degrades versus baseline. Prefer smaller boundary changes, local relocation, preserving established encounter positions and removing low-value props over extra monster production.

## Change control and completion

The proportion-and-density audit **precedes** final adaptation of affected structures, trees, transports and hostile architecture; integrate its chosen target sizes into the sprite contracts and approval/evidence journal. Treat this as prior authorization for carefully justified expansions, **not an instruction to expand every map**. Engineer independently and take the change through implementation and tests without requiring Joel to judge technical details. Document which assets and zones actually changed versus which were inspected and left alone. Do not report an expansion, finished audit or preservation of density as complete until measured evidence and regression checks support it.

### Related material

- [SPRITE_PRODUCTION_CURRENT_CONTEXT.md](SPRITE_PRODUCTION_CURRENT_CONTEXT.md)
- [CAMERA_SPRITE_TARGETS.md](CAMERA_SPRITE_TARGETS.md)
- [SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md)
- `src/prototype/{data,world,engine,navigation}.js`
- `src/prototype/rules.js`
