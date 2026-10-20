# Frontier and Abyss Bastion layout audit — 20 October 2026

**Status: audit and geometric proposals only. No runtime code, version or live game changed.** Prepared on `preview/mouths-staves-frontier-20261020`, based on published dev.102. Character previews are separate, unselected work; their rejected first revisions must not be implemented.

Joel reported structures forming a crowded line through Frontier and underused space toward all four edges. He requested redistribution and appropriate road extensions while retaining trees/natural scenery. He also reported awkward movement and apparently stuck enemies in the Abyss Dragon’s dungeon, requesting modest expansion.

## Findings

Frontier has 391 props in the sampled fresh authored layout: 187 structures/walls/equipment and 204 natural props (including planted garden scenery). Its bottom quarter, y=2550–3400, contains only four structural props. Several layers—settlement details, recovery yards, occupation work sites and route service points—reuse the same central corridor. This confirms a placement/distribution problem; it is not caused by a lack of content. The north/east already contain forts and the dragon roost, so spreading every asset uniformly would create a different clutter problem.

Abyss Bastion has 38 props, all decorative with zero solid prop collision. Its physical constraints are the authored floor/walls and seven openings measuring 80–110 world units. A 15-unit actor leaves only 50–80 units of usable center travel across those doors, before other bodies occupy them. There are 26 guards and one boss in the sampled normal layout. All 27 have static routes to the entrance and dragon room; no spawn is inside solid geometry. Live traffic stalls were not reproduced, so props are not being blamed as physical blockers and an AI-stall fix is not claimed.

## Frontier proposal

Move 65 existing props, including three existing outlying houses, into north, west, east and south plots. No content is added or deleted. The ten work/logistics groups below account for 62 props; the three additional houses form southwestern recovery homesteads. The named town services, Burned Hamlet rest, bosses, rescues, entrances, resource deposits and both main ravine crossings stay at their original coordinates. Four forts and the existing monster homes retain their roles/positions.

| Work group | Props | Existing authored anchor | Proposed anchor |
| --- | ---: | --- | --- |
| North repair yard | 8 | (1080, 700) | (990, 280) |
| West market / work frontage | 8 | (650, 620) | (340, 970) |
| West recovery yard | 8 | (1240, 1080) | (480, 1740) |
| East inspection yard | 7 | (1720, 1360) | (3050, 1560) |
| South garrison support | 7 | (2300, 1650) | (2360, 3000) |
| South Bastion support | 8 | (3000, 2420) | (3070, 3020) |
| Southwest supplies | 4 | (900, 600) | (450, 2640) |
| East inspection spur | 4 | (1900, 1250) | (3070, 1360) |
| South logistics spur | 4 | (2250, 1650) | (2370, 2790) |
| South Bastion spur | 4 | (3000, 2400) | (3030, 2810) |

The individual preferred/adjusted positions and stable IDs are in `proposal.json`. A local plot search avoids natural props, existing solid geometry, active enemies, NPCs, deposits and player-building footprints, and leaves road shoulders clear. All 204 natural props retain the same coordinates and serialized metadata. Gardens stay put too. River banks, fountain, ravines and rock outcrops are unchanged.

Thirteen connected road spurs serve the new plots. Routes use the real engine path planner in an isolated zone copy, with wider clearance around fixed trees and buildings. Every new road segment remains passable at radius 25 after all relocated structures are placed. No trees are cleared to draw roads. The bottom quarter rises from 4 to 30 structural props; the original empty southern expanse gains useful purposes while the interior is quieter.

These are spatial schematics of exact generated/proposed positions, not in-game beauty screenshots:
- `frontier-current.png`
- `frontier-proposed.png` (gold denotes moved objects)

## Abyss Bastion proposal

Increase the shell from 1500 to 1650 units per side (+10% width/height). Scale the existing floor plan rather than inventing new rooms. Usable floor area increases by about 22.4%, including widened openings. Keep every room’s role and all 38 props, shifting bulky harness, hatchery, feeding and aerie objects toward perimeter alcoves. Keep a clear approach around the dragon and Eren rather than packing props around their feet.

Widen the containment and hatchery/service openings to 160 units, and the aerie openings to 180. Gate frames retain solid separation between openings. The dragon’s defenses, attacks, reach, population, rewards and rescue requirements are outside this proposal.

The proposed 27 positions also remain on valid floor and have static routes to the exit and dragon room through the real engine route method using the candidate architecture in an isolated instance. Candidate props have valid floor anchors. `bastion-comparison.png` shows both plans at the same coordinate scale.

## Existing saves and implementation ownership

Frontier’s current `frontierLayoutVersion=4` and road version 17 would keep existing placements if only constants changed. A real implementation needs a Frontier-only, idempotent placement/road migration, keyed by stable entity IDs. It must preserve the natural scenery and player buildings, avoid occupied plots, retain depleted nodes, cleared sites and existing enemies, and not rerun global settlement generation. New-game placement and existing saves must converge to the same authored layout without duplicating props. The proposal deliberately does not move quest services or enemy homes.

Abyss currently gets a hardcoded 1500 size through `Campaign.zoneSize`, and architecture/decoration/flight-project versions gate old saves. Implementation must make its size rules-owned and shared by collision/rendering, update only its geometry/placement versions, and move existing records by ID. Scale or explicitly re-anchor exits, Eren, guards/homes, boss/home, traps, reinforcements, current party and pending saved positions together; retain HP, deaths, cleared state, unlocks and loot. A loaded active encounter needs safe re-anchoring without reviving defenders. Candidate trap/encounter migration has not been implemented or tested in this audit.

Owners: `rules.js` (authored layouts/architecture), `world.js` (placement/roads/migration), `engine.js::zoneSize/decorateDungeon` (shared size and existing decoration lifecycle), `navigation.js::blocked/route` and renderer/visuals (consume the shared geometry).

## Scope of verification

Focused structural census, original/proposed static routes, road segments, unchanged nature and native canvas schematic inspection only. No game build, full suites, browser matrix, CI or deployment. Static route success does not certify live crowd behavior; a narrow gate/party traffic check belongs with implementation. Source and exact candidates are retained in this directory.
