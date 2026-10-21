# Ironroot Highlands — autumn hardwood and coinage province

Status: dev.138 published via PR #374 as `9e0c8218a34a42a9039d6f0d9fe6ece92c8ddf2e`. Package-only run 39655923053 succeeded; exact public build and 21 resources match. Normal workflow restored and temporary publisher removed. Receipt: [verified publication](evidence/HIGHLANDS_DEV138_PUBLICATION_20261021.json).

Joel approved a complete regional rework on 21 October 2026: Appalachian/Blue Ridge/Smokies-inspired deciduous forests, extensive relocation of bosses, dungeons and associated assets, purposeful use of the edges, the same or greater aesthetic care as the recent Marches/Frontier work, and preservation of the region's fantasy society and Crown coinage role. New procedural assets are authorized. Exact unseen artwork is not separately declared accepted. This supersedes the Scottish Highlands direction and the earlier annotation-only coast restriction.

## Economic identity

The Crown discovered the wealth behind Quarry Outpost's old name: silver-bearing and copper-bearing host rock. There is no separate building-stone industry. Its shafts, adits, sorting and washing equipment, supported workings and haulage serve coinage production. Separate ore loads reach Stonecross for refining and portrait-stamped Crown production, wages, guarded storage and shipment. The name remains a historical place-name. Natural rock, stone architecture and Garun's stone body/art interests remain part of the world.

The live region description, Keeper account, site descriptions and English/Spanish worker quest are reconciled. Added adits and a washing/sorting station show two kinds of mineral-bearing ore. Existing carts and sorting equipment gain distinct silver/copper mineral cues, and payroll coins use the silver Crown palette. Ridge Tyrant remains Master of Coin; Crag's Treasury household, Garun's council/security/architecture identity, Dara's repair work, native Wolf territories and Ogre domestic life retain their current canon.

## Geography and actual destinations

| Place             | Final intended anchor | Role                                                                                                   |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| Ferry arrival     | 425,1900              | Existing selected vessel and boarding retained; continuous western shore and receiving district        |
| Stonecross        | 750,2180              | Coastal mint town with separate residential, service, refining, striking and shipment frontages        |
| Northern workings | 650,390               | Silver and copper adits; ore convoy and Crown pressure                                                 |
| Quarry Outpost    | 2520,510              | Ore extraction/processing, equipment, lodging and guarded haulage                                      |
| Caravan           | 3100,500              | Existing northeast onward transport                                                                    |
| Treasury          | 1920,330              | Separate northern household entrance; procedural interior reworked, original rewards/progress retained |
| Ridge watch       | 2850,1170             | Moved boss, captive, native guards, defenses and domestic assets                                       |
| Old Signal Keep   | 3000,2030             | Eastern inhabited ruin and existing side interior                                                      |
| Colossus Mine     | 2850,2850             | Southeastern main entrance; existing interior and Garun/Dara progression                               |
| Wolf Packhold     | 480,1010              | Northwest wild territory                                                                               |
| Ogre Hearth Fort  | 940,3010              | Southern household with its existing population and lived-in assets                                    |

A winding rocky stream replaces the straight central divider. One northern stone bridge and two timber crossings support connected loops. The coastline, river banks and collision read the same geometry. Bridge decks use the local bank width. Earth paint finishes at the ferry timber. A scoped renderer correction supplies logical viewport bounds for Highlands terrain, including full-map review, and clips edge tiles to the actual map boundary.

Twelve authored road paths are repaired against the completed physical scene. Door paths connect work buildings, households and entrances to them. Player construction retains first claim on its plot. Native defenses retain their role; home positions are spaced without creating troops. The original outdoor roster/IDs and combat profiles are preserved. In particular, later proximity-based military selection is suppressed after relocation so moving native Wolves does not turn another animal into a stronger Crown mounted guard.

## Nature and procedural art

The current fresh fixture has 369 props, including 123 hardwood/evergreen trees and low ferns, laurel and weathered logs. Seven tree species share deliberate regional construction while varying canopy width/height, branching, bark and foliage: oak, maple, hickory, birch, beech, tulip tree and a small spruce minority. Species and seasonal stage use stable identity/terrain, giving green, transitional gold, copper, yellow and orange/red rather than random per-frame color. Old nature identities are reused before extending stands. No raster originals, retained registrations or rollback records are deleted.

New nature and ore-facility drawings have explicit procedural selection. The old gray-green ground material remains retained but does not paint over the new Highlands floor. Fallen leaves and continuous ground variation connect the trees to their setting. Solid trunks and open approaches remain readable, and native actor outlines work behind foliage. Existing accepted character bodies and the exact dev.137 ferry raster are preserved.

Joel also approved region-specific wild wolf coats in brown, buff and rusty red, with dark dorsal hairs and warmer ears/legs. The larger armored direwolf mounts retain their Crown Soldier/Ranger riders, steel armor and saddles. Elk mounts were declined. Wolf species, identities, geometry, combat and behavior remain unchanged. These coats use explicit procedural selection; the old gray raster remains retained. Three wild variants and both mounts have isolated/native evidence; 20 other-region renders are pixel-identical to dev.137. Reference: [USFWS red wolf coat description](https://www.fws.gov/species/red-wolf-canis-rufus), [NPS Smokies mammals and historical wolf absence](https://www.nps.gov/grsm/learn/nature/mammals.htm). Ironroot’s wolves are a fantasy population inspired by that historical ecology.

Reference research: [NPS Blue Ridge forests](https://www.nps.gov/blri/learn/nature/forests.htm), [Smokies vegetation communities](https://www.nps.gov/grsm/learn/nature/vegetation-types.htm), [Smokies autumn foliage](https://www.nps.gov/grsm/planyourvisit/fallcolor.htm). These inform moisture/elevation/species and autumn contrasts; Ironroot remains its own fantasy geography with a coast.

## Saves, tribute and verification

The unfinished `fix/highlands-tribute-dev137` implementation is integrated, then revised to Joel’s current instruction: **all four Highlands stores require a Barracks search at existing named places**. No new hollow/hideaway markers or nearly buried chests. Each Barracks action names a place to investigate; workers must physically arrive with sight of the store. Merely visiting a landmark, dispatching troops or recalling them does not locate it. Their ordinary storage dressing becomes a concealed reserve after investigation:

| Existing named place  | Store anchor | Concealment                                                        |
| --------------------- | ------------ | ------------------------------------------------------------------ |
| Stonecross ore vein   | 810,520      | Mint payroll under the ore store’s false floor/tarpaulin           |
| Northern stone bridge | 1465,1050    | Collector’s reserve behind inventory and accounts                  |
| Timber haul crossing  | 1735,2420    | Haulage wages inside a repair-supply crate                         |
| Old Signal Keep       | 3125,2145    | Former Crown signal reserve behind disused exterior store fittings |

Crag Tyrant organized the concealment as part of his Treasury duties; Ridge Tyrant remains occupied as Master of Coin. Town Supplies → Gather resources explains this in English/Spanish, says the townspeople do not know the stores, and directs the player to organize searches from a completed local Barracks. It still accepts recovered cargo, without dispatching/revealing/paying a search from that menu. The search action verifies the selected completed Barracks at execution time.

The keep’s Ogre household/interior retains its established role. Its old exterior Crown store adds purpose to the named site without replacing the household. Stable source IDs (including historical `ogre-cache`) and the finite 640-crown fresh total remain compatible. Remaining fractions, discovery and recovered currency persist; partially worked or actively assigned old sources stay discovered. The remote WIP remains available as history. The owner’s larger-than-900-crowns-in-a-minute observation was not independently reproduced as the outdoor pool alone; quest/enemy income remains separate. No earned currency is clawed back.

`tools/visual-review/highlands-dev138/check.cjs` checks four seeds, all road segments and public destinations, source access, live-death/progression/identity and fractional tribute preservation from a real dev.137 fixture, same-version spatial idempotence, physical scouting, Recall and reload. The old-engine control records distinguish existing restore normalization from a new stat change. All 311 fixture prop IDs and 49 enemy IDs are retained, with 4321 wallet crowns and 626.75 remaining tribute unchanged. Town Supplies also passes a focused 20-crown unload from active, resting and fallen companions, exactly once, while its search explanation changes no orders or discovery. The six existing Ironroot scenarios pass (Treasury version assertion is updated to 6), including public-NPC frontage spacing. Fresh sources are all hidden and attached to their actual named landmarks; visiting those markers does not reveal them.

`review.cjs` uses the production renderer and actual retained sprite loader: twenty-six native captures: overview/location/day/night/phone size plus all four stores before and after discovery, real foreground actor masks and read-only render checks. This is bounded Canvas review, not a full browser/device matrix or an actual-iPhone FPS claim. Build/generated syntax and changed-file formatting are the release checks. Known unrelated baseline Marches material/scope audit mismatches remain documented; no broad CI is requested.

The requested geographical/aesthetic, quest, ferry and Map & Navigation audit is recorded in [the audit](HIGHLANDS_DEV138_GEOGRAPHY_AESTHETIC_AUDIT.md). It includes concrete saved-encounter and map-color repairs.

Per-design references and current sprite decisions are updated in the same change. The normal workflow is restored and the one-time package-only publisher is removed after successful deployment.

Spawn audit: four original dev.137 seed controls retain 49/49 native outdoor IDs (48 ordinary enemies and Ridge Tyrant), with clear relocated homes and unchanged night/leave/return/reload counts. Both scheduled ringleaders and TRUE Ridge spawn on valid ground. Pending bases now reuse their original monster’s migrated home, preserving counts and timers. Evidence: `tools/visual-review/highlands-dev138/spawn-checks.json`.

The owner then requested the complete procedural Treasury interior overhaul. [Crag’s defended household](HIGHLANDS_TREASURY_DEV138.md) records the authored layout, original seven-defender roster, defensive cover/crossfire, native 150% review and saved recovery/quest progress. This is a possible quality pilot for future Treasuries; the other interiors are outside this update.
