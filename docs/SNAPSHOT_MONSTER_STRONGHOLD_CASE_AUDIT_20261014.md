# Monster strongholds: pre-certification spatial and architectural review (14–15 October 2026)

**Active draft work:** PR #300, `implementation/director-snapshot-20261013`. This is a focused structural/authoring pass, **not** the later combined Node/browser/AV/old-save/independent playable certification. No merge, release or deployment.

## Director's requested result

Thirteen existing ordinary-monster territories remain on their original map, without new monster populations, bosses, captive systems, drops, quest IDs or altered boss/patrol paths. Their defensive treatments differ intentionally. **A real military fortress must have navigable interior and a coherent enclosure with exactly one opening**, not scattered props claiming to be an impassable wall. Where roads, cliffs, natural habits or major encounters prevent that, preserve an occupied **ruin** or **natural defended habitat** instead of pretending that separate posts form a sealed fortress.

The previous implementation generated ten ring posts independently, skipped any blocked or road-adjacent point, and sometimes displaced pieces hundreds of units from the center. All it proved was at least three remaining posts and five domestic props; this produced random fragments and crowded settlements. We now retain the original stronghold centers and garrison identities, mark each area's intended architectural history, draw visually differentiated wall treatments, and spread domestic props **after** the street-corridor migration so later layout repairs cannot compress the furnishings again.

## Site-by-site disposition

| Region | Stronghold | Decision and rationale |
| --- | --- | --- |
| Greenwood | Goblin Road Fort | Occupied old stockade ruin. Road only 93 units from center; do not fake a fully sealed palisade or interfere with Greenwood patrol approach |
| Greenwood | Skeleton Watch | Weathered stone ruin occupied by self-aware Skeletons. Preserve grave lamps, memorial furniture and native Skeleton homes |
| Marches | Mire Nest Hold | Reed/mud/bone natural enclosure, not a newly built castle. Preserve swamp routes and Mirejaw-area combat |
| Marches | Reed-beast Wallow | Woven defended habitat with enough room for nesting and drying racks, not formal masonry |
| Marches | Lantern Wraith Hold | Overgrown, broken former watch. Preserve night-only four Wraiths, no daytime manufactured garrison |
| Ironroot | Wolf Packhold | Old broken stone shelter and natural Wolf lair, not a military castle. Keep fixed wolf-den site and saved Wolf garrisons |
| Ironroot | Ogre Hearth Fort | Reused hill ruins with a working Ogre hearth, stone seats and tools. Avoid moving Ogre society or cutting quarry roads |
| Frontier | Orc Road Fort | Damaged occupation stockade. Road/node constraints cut multiple sides of the old perimeter; keep usable passages |
| Frontier | Raider Drill Redoubt | **Complete military fort**: twenty-two touching collision-bearing wall posts, **one north gate**, and **four visually distinct corner towers**. Keep exactly four native raiders, their homes, and the separate outbound dragon landing |
| Frontier | Stalker Cinder Hold | Broken ash ruin rather than newly repaired military walls; night-only Stalkers retain spawn/despawn behavior |
| Dark Crown | Ash-beast Roost | Half-collapsed stone shelter around the existing Ash-beast nest. Preserve native responders and Cindermaw's separate routes |
| Dark Crown | Crown Field Barracks | Occupied remnants of older fortifications. Roads/solids make a convincing sealed ring unsafe; prioritize working bunks, forge and war table |
| Dark Crown | Crown Toll Redoubt | Roadside ruin and defensive checkpoint. East approach is actively used by traffic; do not seal it off with a full wall |

**Implemented source:** `rules.js` now declares a stable `defenseStyle` on each hold; `world.js` migrates only eligible stronghold scenery, retains original species/native garrison ids and homes, and uses a two-phase furnishing-clearance strategy after global street changes. `visuals.js` adds coherent fort parapets and corner turrets, broken/collapsed masonry or palisade remains for ruins, and reed-woven surfaces for marsh habitats **within the existing wall footprint**. Nothing here changes attack AI, monster count/rewards, named boss patrols or original source sprites.

## Focused findings on current saved source

All **13 holds** were instantiated through actual `Campaign.enter(region)` across five regions and probed against real `navigation.route`, road geometry and native populations. Each retained **at least five distinct everyday props**, at least **three defensive wall/corner props**, passable routes to the territory, and **minimum pairwise 94–123 world units** between retained nonblocking furnishings after the final clearance stage. The Raider drill redoubt has **22 wall posts and four corner towers**, road exclusion passed and a path from regional entry to center remained. All other wall posts remain outside authored road setbacks. No new creature spawn was added.

**Evidence limits:** these were current-source in-memory Campaign probes, not real Chromium/WebKit captures, wall-raster beauty acceptance, historical save-corpus tests or proof that every projectile/monster path at every frame is correct. A new `tests/snapshot-stronghold-courtyards.test.cjs` guards 13 sites, navigation, crowding, native residents and the Raider gate/towers; this file was authored/syntax-checked and has not yet been executed by Node CI. `tests/monster-forts.test.cjs` migration expectations were updated for the new world versions without rewriting the original migration test intent. The final overnight integrated gate must specifically exercise Raider north-gate entry/exit, corner-wall collision, night site spawn/despawn, old dead-garrison persistence, roadway driveability, old-save migration, and day/night 150% desktop/phone rendering.

**Next visual opportunity (not silently implemented):** the other three named military camps are constrained by existing roads, authored nodes or solids. A further full fortress conversion would require an individually justified map-layout expansion or relocation and comparison of roads, garrison patrols and rewards. No such risky regional remodeling was authorized by this narrow architectural review.
