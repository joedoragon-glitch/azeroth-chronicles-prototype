# Greenwood Vale — regional design comparison

**29 October 2026 · Engineering design checkpoint · No replacement implemented or accepted**

Authority: [restart commission on draft #644](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/644), [50 owner decisions](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md), [epic #545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545). This record contains distinct design evidence, not another release ledger. The five original documents remain historical references. Coordinates below are proposed whole-region plans, not claims about the playable map.

## Fresh reality audit

The implementation base is **main@fcc1f42**, containing the Greenwood-only dev.235 rollback after the rejected dev.233 release. **The rollback undoes the rejected work; it does not set the replacement's dimensions.** The owner reconfirmed that 3200 was reasonable in size, is not a ceiling, and must itself be reassessed for the new design. The commission was prepared on earlier main@bda30dab. Its statement that dev.233 remains the current source is therefore historical. Publication of the rollback must be verified separately; a local checkout does not prove publication. Other-region rollback drafts #649/#651 are separate work and are not incorporated here.

The five unmodified owner iPhone screenshots were recovered and inspected. They show broad angular traffic loops, scattered services, an isolated pond/wheel, fragmented Goblin fencing and an unconvincing Treasury bridge defense. They are rejection evidence, not replacement designs. Their private ZIP is not copied into the public repository.

The current source still has **32 ordinary outdoor actors, six regional quests and 640 finite outdoor crowns**. The original river is a narrow near-straight divider around x=1200; crossing centers are y=750/1750. Two independent circular water obstacles occupy the west/east. The runtime's actual Hamlet service is near (240,1420), not the declared (900,700) anchor. Source tables alone therefore cannot establish the realized scene.

`world.js` constructs roads from navigation-grid paths, then performs multiple settlement, clearance, environment and onboarding passes. `greenwood.js`'s rejected scene searched for individual prop positions after this generation. `visuals.js` gives roads shared breadth. These are source-confirmed causes that can produce disconnected composition. Navigation and collision remain authoritative, but **the replacement visible road hierarchy must be authored first**. Art and defenses must belong to deliberate district parcels.

The Marches benchmark uses an irregular shared water boundary, relocated complete districts and meaningful coastal edges. Highlands uses a shared winding river, complete relocation groups, seven deliberately varied trees, coherent ore/mint industry and doorstep routes. Frontier separates perimeter, gate, yard, service and supply functions. Greenwood needs comparable scope with its own green summer identity.

## Two complete alternatives

![Two proposed regional plans](evidence/greenwood-redesign-20261029/masterplans.svg)

Both plans retain the same identities and encounter/reward totals. Neither derives its river or street positions by stretching the old map. The drawings are **geographic design diagrams**, not game screenshots or collision acceptance.

| Relationship | A — cultivated west / wooded east, 3200 | B — river-elbow crossroads, 3400 |
| --- | --- | --- |
| Basin | A broad S-bend river flows north to south through the eastern half; a western tributary feeds the mill before joining it | River swings from the northwest across the center into the southeast; town occupies an inside elbow |
| Newcomer | Millhaven on a northwest terrace, short visible civic street and southern farm exit | Central riverside Millhaven, with crossing traffic prominent immediately |
| Production | Quieter western Hamlet; orchards and small fields surround its southern freight lane; mill on the northern production edge | Orchard village northeast, on the opposite bank; northwest mill ships through town |
| Crossings | Northern freight bridge serves town/Treasury/wagon; narrower southern bridge completes farm–woods–estate circuit | Central cart bridge and far southeast footbridge create a longer diagonal circuit |
| Hostile households | Southwest Goblin roadside fort off the farm lane; separate occupied old cellar; east-bank Skeleton watch; Thornfang in southern woods | Goblin toll compound northwest near incoming river; Skeleton watch far east; Thornfang southwest; old cellar northeast beyond cultivated village |
| Reclamation | Southeast Crypt/estate → east-bank cache → northern Treasury receiving yard → bridge/wagon | Southeast Crypt → central-east cache → southwest Treasury; crosses the civilian street to reach transport |
| Edges | Northwest managed woodland/smallholds; northeast wagon receiving edge; southeast estate works; southwest domestic Goblin/woodland approach | Northwest hydraulic/hostile approaches; northeast fruit production; southeast estate/footbridge; southwest Treasury/den |
| Migration | Stable district translation plus source-version adapters for original, expanded and rolled-back saves | More frequent bank changes and civilian/hostile swaps require more saved-object relocation |
| Risk | Longer west-bank production circuit; avoid exposing Hamlet to the southern den and cellar groups | Early transport hostility and diagonal supply traffic cut through the newcomer center; larger quiet intervals with unchanged 32 actors |

**Engineering selection: A's regional relationships for construction and measurement; dimensions remain provisional.** Its separated production and reclamation corridors give the six existing quests distinct journeys, retain a quiet welcoming opening, and use every corner without routing industrial/hostile traffic through the town center. This is a design rationale, **not a fabricated route-performance result**. Compare the selected topology at **3200 and 3400**, and extend further if complete parcels, sightlines, hydraulic works and companion-safe routes require it. Comparing A at 3200 against B at 3400 alone would confound map design with size. Reassess usable land, actual camera composition, encounter gaps, migration fit and route cost before fixing dimensions; neither the rollback nor the rejected release sets a numerical limit. Reopen the topology selection if those checks fail.

## Selected plan: parcels, routes and land use

| District / stable identities | Target center | Required parcel and connection |
| --- | --- | --- |
| Millhaven: rest/supplier/recruiter/board | 650,600 | Central east–west working street; public fronts reserved before houses; south farm exit and east freight exit; gardens/storage behind frontages |
| Orchard Hamlet: minor | 550,1750 | Small village frontage on western farm lane; crops/pastures rather than another town ring |
| Orchard expansion: orchard | 780,2100 | Bearing/young/new plantings, drying/store yard and decorative working cellar; freight north to mill/town |
| Western mill: mill-pond | 1000,1350 | Upstream tributary → retained impoundment/weir → short wetted headrace meeting wheel → tailrace joining river; dry loading apron on farm road |
| Northern crossing: bridge-north | 1670,1000 | Full-width maintained freight crossing, stone abutments, bridgehead receiving lane |
| Southern crossing: bridge-south | 1740,2280 | Narrow timber rural crossing, visible continuous two-bank approaches |
| Goblin roadside camp: goblin-camp / goblin-road-fort | 350,2640 | Legible broken-rectangle palisade, one open gate, guarded forecourt, domestic court and stores; separate from civilian street |
| Occupied old cellar: den-ruins / side-vale-cellars | 1080,2510 | Existing dangerous household/entrance, distinct from the current fruit store; woodland branch off agricultural loop |
| Thornfang/Mira: field-thorn and native patrol | 920,2880 | Southern woodland home/training/feeding space, physical patrol across both banks; keep newcomer path safety and hero-first admission |
| Scornfang Treasury: supply-entrance / supply-vale | 2070,1050 | Off-road entrance and defended receiving yard overlooking freight approach; fair gate opening and covered domestic/storage spaces |
| Woodland cache: cache | 2420,1690 | Quiet east-bank staging clearing on the reclamation lane |
| Skeleton watch: skeleton-watch | 2670,2220 | Older funerary stone enclosure with working domestic court; forest/estate path, not a civilian service |
| Forest Crypt / unfinished estate: entrance | 2740,2790 | Southeast arrival court, old funerary mass behind new scaffold/material yards; associated guards/captive/interior IDs retained |
| Merchant wagon: outbound | 2910,420 | Northeast terminal, yard/turning space and road south to bridge; remains an independent destination |
| Eastern farm water | 2720,1320 | Separate rural pond with managed pasture banks, not another mill |

**Route hierarchy:** one principal cart spine town → northern bridge → northeast wagon, with a Treasury receiving spur; a narrower western farm lane town → mill → Hamlet/orchard; east-bank reclamation lane bridge → cache → estate; faint woodland circuits connect old cellar, den, southern crossing and watch. Purposeful loops may connect districts; no automatic join-every-component pass may paint extra roads. Private fronts are short door paths, not additional regional arterials.

**Sixteen-cell land-use check (NW to SE):** northern band = managed hardwood/smallhold, town/freight terrace, river crossing approaches, wagon terminus; second band = farm/mill approach, hydraulic site, river/receiving bank, pasture/pond; third band = Hamlet/orchard edge, orchard/woodland transition, southern crossing/cache approach, watch woodland; southern band = Goblin household approach, old-cellar/den woods, downstream riparian quiet contrast, Crypt/estate works. Every outer band carries a purpose; quiet forest is deliberately walkable landscape, not a ring of props.

## Implementation and refusal contract

Use one shared river/pond outline for paint and collision, explicit route widths, and one authored scene for each district's roads, roofs, gates, props and guard homes. New Piedmont nature must visibly change crown/branch silhouettes, understory and ground: meadow/pasture, cultivated soil, shaded leaf litter, damp banks and localized red-clay wear. Existing raster originals remain preserved; procedural selection must be explicit where the accepted old tree would conceal the new design.

Saves require distinct adapters for original 2700, live dev.233 source-version 1, and rollback-version 1/source-version 0. Transform before terrain pruning. Preserve owned buildings and all earned/paid/discovered/defeated states; invalidate only transient paths. If no legal building plot fits, **retain the object and report an unresolved migration**, never delete it or silently overwrite another building. Second and third reload must be stable.

Reject the candidate internally for any missing essential scene, road/roof/door conflict, dry flume, gate with no coherent perimeter, inaccessible destination, unsafe bank mismatch, lost state, arbitrary empty edge, or unchanged generic natural identity. Unit checks alone cannot close visual acceptance. Four seeds, current/historical v4 saves, real 150% day/night phone/desktop scenes, actual Canvas/Pixi paths, bounded first-session/free-roam observations and reproducible focused build evidence remain required.

**Baseline receipts:** [four-seed native census](evidence/greenwood-redesign-20261029/baseline/census.json), [27 source-pinned Canvas captures](evidence/greenwood-redesign-20261029/baseline/captures-2700.json), [scene contact sheet](evidence/greenwood-redesign-20261029/baseline/native-contact-2700.webp) and [actual object/road overview](evidence/greenwood-redesign-20261029/baseline/overview-2700.webp). These are procedural fallback software-Canvas views at 150%, with live actors retained and simulation frozen for capture; not browser HUD, retained bitmap, Pixi, physical-device or owner acceptance. All four source worlds have 198 props, 32 ordinary enemies and 640 outdoor crowns; all 15 sampled destination routes reach their native targets. The existing `greenwood-flagship.test.cjs` rollback suite passed on unchanged source@fcc1f42: original worlds, expanded-save inverse conversion, identity/progress and repeat reload. Its pass certifies the baseline rollback contract only.

**Current checkpoint:** source/owner evidence reviewed; two geographic alternatives compared and A's topology selected for construction, with size still subject to measurement. The listed coordinates are a 3200 drafting grid, not frozen runtime positions. No redesigned runtime, migration, replacement art, focused implementation acceptance, merge, publication or device verification is claimed.
