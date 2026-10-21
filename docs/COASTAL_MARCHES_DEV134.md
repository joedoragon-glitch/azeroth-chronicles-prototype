# Coastal Marches and Lantern Shore — dev.134

Owner scope, 21 October 2026: rework Flooded Marches as a coherent coastal swamp; use the southern edge and other underused edges, relocate major sites and their associated assets, avoid a straight coastline and copied regional layout. Lantern Shore is the ferry district. At night its Wraiths collectively block onward passage until cleared; waiting for daylight is the alternative. Preserve their existing combat strength and Archive-related lore. Implement/audit/publish with focused checks; broad GitHub testing remains deferred.

## Authored arrangement

- A shared irregular coastal-water polygon creates southern bays, a western tidal creek by Reedport, and a deep eastern estuary. The same rounded outline owns collision and paint. Mud margins, varied mangrove stands, reeds and wetland hummocks replace a fringe of evenly spaced trees. Fisher Camp gains a freshwater lagoon.
- Sunken Archive entrance moves from (2600,2350) to the western bank at (500,2350), including its book-drying/restoration scene. Flooding remains unexplained; this work invents no cause or solution.
- Mirejaw's Treasury moves to the northeastern stores at (2580,520); Drowned Watchhouse moves to the eastern estuary approach at (2600,1720). Their entrance dressing and return paths follow them. Mirejaw's own field territory stays inland and apart from the night Wraiths.
- Roads serve distinct settlement, lagoon, Archive, causeway, Treasury, marsh-watch and ferry routes. Raised coastal timber, lamps, sheltered study supplies, seats and fishing gear give Lantern Shore an inhabited purpose.
- Lantern Shore's existing stable landmark, hidden tribute and ruined watch move together to (1880,2600); ferry departure is (1770,2860). Four native nighttime Wraiths keep their stats/skills. The travel action and fare-shortfall work passage both enforce the same night refusal; daylight ends the challenge without kill rewards. Other directions/regions remain unchanged.

## Compatibility and evidence

Existing saves migrate coordinates, native night Wraith homes and pending night reinforcements without reviving enemies or replacing tribute amounts, quests, rescues, victories or player buildings. Domain owners remain rules/world/navigation/engine; shell menus explain the refusal in English and Spanish. No save-schema change or new sprite registration.

Candidate in progress. Focused route, migration, dawn/travel and native day/night visual review are being completed before package-only publication. Captures: `tools/visual-review/lantern-shore-dev134/`. Procedural handoff: `tools/sprites/design-handoffs/lantern-shore-coastal-marches.json`.
