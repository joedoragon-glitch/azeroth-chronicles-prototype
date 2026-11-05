# Greenwood Vale — Working Watermill District: game-design project and engineering handoff

**Game:** So I Became the Dark Lord's Problem (SIBDLP)  
**Date:** 5 November 2026  
**Discipline:** environment design, architecture, landscape composition, visual affordances  
**Status:** **Design proposal prepared and source-reconciled; not a rendered design acceptance.** This document authorizes no game implementation, asset production, test run, merge, deployment, or device-certification claim.  
**Base source read:** main@2cbdd804982624d7c303f319e953d1ff901458b2. Read current main again when engineering starts.  
**Owning defect:** [#641 — millpond/dam/wheel hydraulic coherence](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/641).  
**Evidence:** owner's 5 November nighttime game screenshot of the western Greenwood watermill; current mill art and Greenwood water/road layout source; approved Greenwood 50-decision register; neighboring open game-design PRs.

## 0. Creative brief: the scene we intend to build

**The Working Mill at Greenwood** should read immediately as a well-built, inhabited **water-powered mill** in a cultivated green valley. A creek enters a naturally shaped but engineered millpond; a short dam and control gate feed a plausible wheel; water leaves through a lower channel and joins the existing valley river. A modest farm lane and one small service bridge make it possible to arrive at a dry loading yard. After sunset, a mounted practical lantern makes the entrance welcoming; the nearby forest stays cool, dark and quiet.

The hero must be able to stand here and understand the site without a text explanation. The working-water story should be readable in three seconds at the **normal 150% camera**; architectural integrity and movement-safe grounds must survive closer inspection.

**Repair the whole composition, not its individual stickers.** A better roof over a still-incoherent building, painted blue strips hiding a dry dam, or a decorative bridge over impassable water is a failed result.

This is a **watermill**, not a sail-powered windmill. Separate wind-powered alchemy plans, Stage 3 Field Labs, and resource-economy work remain independent; this design does not create Acid Bottle production or milling commodities.

## 1. Evidence and authority, with no invented status

### Current source facts

- The authored 3,200-unit Greenwood layout locates the western pond near **(900,1260)** (irregular ellipse about 140 × 120), mill near **(1200,1400)**, north main crossing near **(1670,1000)**, and south main crossing near **(1740,2280)**. These are **current reference anchors**, not exact future construction coordinates.
- Current minor tributary points begin around **(900,880)** and end near the pond. The short headrace is authored **(1005,1340) → (1040,1390) → (1110,1415)**; the tailrace continues via **(1180,1510), (1320,1570)** toward the main river near **(1500,1550)**. The main river itself already reaches the north and south regional bounds.
- The water source is presently composed of a pond ellipse and independent channel ribbons. Their proximity does not by itself guarantee seamless shoreline painting, sensible flow appearance, or an unbroken source-to-edge explanation.
- The mill visual in src/prototype/visuals.js builds on a **1.8× enlarged Vale workshop**, then overlays additional boards, a triangular roof and a radial wheel. Source composition plausibly explains the screenshot's conflicting roof/wall/material directions. It is not evidence of corrupt image bytes.
- The existing authored mill work cluster has cart, supply-stack and barrel placements; current scene references include the decorative mill, sluice and preserved 'mill-pond' site. A road and an associated footpath approach already exist. **The exact new local bridge crossing needs a measured scene plan** rather than a guessed screenshot-to-coordinate conversion.
- Existing issue #641 was written against **older pre-reconstruction source** that lacked the current authored headrace/tailrace. Its physical-coherence concern remains useful, but its historical assertion that no channels exist is **superseded**. Do not reintroduce the old diagnosis as though it describes this main commit.

### Binding art/canon contract

Follow [Greenwood owner-approved 50 decisions](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md), especially W01–W06, M01–M06, E04, S02–S04 and P03–P06: green mature-summer farmland and hardwood groves; honey timber and muted stone; locally worn red-earth lanes; one western engineered millpond, one distinct eastern farm pond; an understated but visibly functional mill; **two existing main-river crossings**; scenery that respects player movement. The second eastern pond remains untouched.

The historic [Greenwood regional masterplan](GREENWOOD_REDESIGN_MASTERPLAN_20261029.md) is useful for geographic relationships, but the current source outranks superseded source/configuration notes.

### Explicit neighboring design boundaries

| Neighbor | Owns | This mill design interfaces with |
| --- | --- | --- |
| [Draft #807](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/807) | Greenwood road widths, junction treatment, north stone freight bridge, south timber footbridge | Inherit its farm-lane width/curvature grammar. Our extra **local mill-race service bridge** is not a third named main crossing. |
| [Draft #808](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/808) | Regional botany, farm plots, orchard, animals | The immediate pond/stream banks use the shared Greenwood vegetation language; no competing global botany changes. |
| [Draft #809](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/809) | Greenwood moonlit grade and sunset/night atmosphere | Design local amber accents within the approved **cool slate/blue-gray night**, not an independent green glow/filter. |
| [Design #812](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/812) / [held engineering #803](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/803) | Mounted fixtures, real glass/flame, facade attachment, practical lighting and depth | Specify **mill-specific fixture placement and night use**, without introducing generic pasted rectangles or preempting #803's held decisions. |
| [Issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679) / [merged #680](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/680) | Other Greenwood environment/patrol corrections | Preserve the resulting scene and all monster/patrol positions; avoid re-generating unrelated scenery. |

Do not touch another issue/PR merely to claim it is part of this design.

## 2. Signed-off design intent — twelve decisions for a single coherent scene

The decisions below are **the design team's resolved proposal** for later owner/art acceptance. They are not asserted as already present in the live game.

### WD-01 — One architectural volume

A **two-level rectangular timber-framed watermill**, visibly more important than a cottage but not castle-sized. Its roof is one **moderately pitched, dark umber/red-brown shingled gable**, with one continuous ridge, matching eave projections, explicit roof thickness and a darker under-eave plane. The top of each wall meets the **same** roof; no separate triangular awning that changes roof direction midway through the building. Use SIBDLP's established three-quarter/isometric projection, not a side-view architectural painting.

**Reject:** a stretched generic workshop with an unrelated second roof and a hidden/contradictory wall junction.

### WD-02 — One material grammar on every facade

- **Foundation and water-facing buttress:** short, irregular gray-beige dressed fieldstone course; dark damp stone only at actual water contact.
- **Structural frame:** exposed honey/dark oak-like timber posts at the same story and corner locations, continuous sill/beam/brace logic wrapping around the visible building corner.
- **Ground floor infill:** fitted weathered timber planks, lighter than the structural posts, especially beside the loading zone.
- **Upper bays:** restrained warm cream-tan plaster *inside* the same dark timber frame. The material change is level/bay-based, never “front wall is planks, side wall is unexplained smooth polygon.”
- **Roof:** consistent small-scale shingles, muted weathering, no stone/clay-plaster pretending to be roof material.

At 150%, wood, plaster and stone should be distinguished by **shape and value**, not only hue, especially under the night tint. Do not add unreadable micro-brick or decorative struts just to appear detailed.

### WD-03 — Doors, windows, story proportions and orientation

Keep the **wheel on the visually left/water-facing facade** in the familiar screenshot composition. On the visually right/lower/dry frontage place one substantial plank **loading/service doorway** with threshold and two visible jambs, facing a level work yard linked to a farm road. The loading door is a readable **visual affordance**, not a newly programmed interaction. The existing millpond landmark/service marker remains reachable.

One upper shuttered working window on the primary visible facade plus one smaller opening/vent on the secondary wall are sufficient. Recess them and align their sills and perspective to their actual wall planes. No arbitrary black slits, impossible window floating above the sill, or door that opens into water. Roof-to-wall balance should give an obvious second working level without making the mill taller than surrounding tree canopies by accident.

**Scale gate:** compare mill, wheel, nearby hero/companion, cart and existing Vale cottage at normal camera before locking exact drawing sizes. Preserve the physical footprint envelope or plan a correctly cleared larger one; visual art cannot silently expand into the traversable road.

### WD-04 — Real wheel assembly, not a decorative circle

A sturdy wooden paddle wheel on a short visible axle entering the building wall; two rims/structural hub, thick spokes, simple paddle boxes, bearing beam and restrained dark iron straps/pins. The near wheel occupies roughly **60–70% of the apparent water-facing wall height** as a starting artistic proportion, subject to real camera testing. It must overlap the flume/discharge correctly but remain separable from the building silhouette.

Choose a **compact breastshot-like feed**: water reaches the upper-middle paddles from a short controlled trough, visibly turns over/past the wheel, then drops into the lower race. No towering aqueduct or physics simulation. The resting wheel may be static; avoid mandating a continuous expensive animation system.

### WD-05 — One engineered pond and deliberate water level

The existing western pond becomes a visibly purposeful impoundment. Its upstream inlet is natural and asymmetrical, with a subtle silt fan and reed/sediment shelves at **slow** water; one compact stone-faced/earthen dam or weir defines the downstream bank, with an unmistakably **wet sluice mouth**. Reserve the shallowest banks for vegetation and damp soil; do not draw a pale blue puddle beside the pond pretending to be a second pond.

A minor **overflow spill** beside the controllable headgate is acceptable as scenery if there is room and the outlet remains geometrically continuous. The stable world remains a 2D simulation: water level differences are shown with bank lips, masonry courses, cascade highlights and shadowed channel edges, not a new elevated-traversal mechanic.

### WD-06 — Upstream tributary must have an origin

**Preferred geography:** continue the small source channel through a winding wooded drainage toward a **northern/northwestern outer map edge** and open it through that edge. This expresses a valley tributary rather than a ribbon with a blunt in-map endpoint. The creek is narrower/more irregular than the main river and should approach the pond along a plausible low-ground corridor.

**Spatial protection is binding:** the source route must not sever Millhaven, the freight road, existing buildings, player-owned structures, quest routes or monster homes. On the current 3,200 map, an upstream-to-north-edge creek can intersect the main cross-valley freight road. That crossing must be accounted for (prefer a **subtle stone culvert** under the existing road if physically appropriate; otherwise a small verified secondary crossing). **Do not claim the edge connection is free of crossings before measuring.**

If no edge route passes these clearance requirements, the *only* fallback is a clearly **authored upland spring/wooded-headwater source** with visible terrain emergence and a natural surrounding drainage basin. A silent cutoff at the same old point is not an acceptable fallback. The chosen solution must be pinned in an engineering layout receipt, not assumed from this brief.

### WD-07 — A wet pond → gate → wheel → river sequence

Keep the causal order obvious: **upstream tributary → pond → weir/control gate → short headrace → wheel → lower tailrace → main valley river**.

Channel banks and water should form **one union of connected footprints**, not independently capped blue ribbons visibly lying over a pond ellipse. The pond/creek junction broadens gradually, the narrow flume meets the wheel, the wheel discharge spreads and gains ripples, and the lower race joins the main river in a shallow downstream-facing confluence, with no tan border drawn across the mouth.

The scene must distinguish slow pond water, narrow flowing feed, localized splash below the wheel and lower-race/current direction. No need to add water flow simulation, current forces, fish or extraction economy.

### WD-08 — One small, physically real mill service bridge

At the **verified** crossing where the local tailrace intersects (or, if necessary, the safely rerouted short spur from) the existing **farm/service lane**, add a **short timber deck** with low worn stone abutments. The cart lane must enter and leave on dry banks, with a visibly continuous usable deck; water passes below, and neither the wheel nor sluice is under the bridge.

**Visual width:** derive from #807's farm-lane **46–60-unit design band** (baseline 52). For this local bridge, target an approximately **52–64-unit usable deck** *only as an art-direction starting point*, wider only for proven path/party clearance. It is intentionally smaller and less formal than the northern stone freight bridge. Its exact span, center and physical crossing mask are an engineering geometry decision.

No new landmark label, map discovery, quest, toll or third major river crossing. Preserve bridge-north and bridge-south in place. Where an extended upstream creek crosses **another** existing road, resolve it deliberately (culvert or small crossing), not with road paint drawn on top of deep water. Every required local crossing must agree in water collision, navigation and visible deck.

### WD-09 — A dry mill frontage and useful objects

The dry service facade connects to the farm lane by a short worn apron. Arrange an existing cart, one modest stacked supply/crate cluster and at most a few barrels/sacks beside the actual loading door—**not on the bridge, under the wheel, on the water or on a combat route**. A stack's contents must remain generic unless already established by source; do not invent grain/flour economics or a new harvest reward.

Keep one navigable standing area where the hero and companions can approach the preserved millpond site without slipping behind props. Favor **repositioning or removing incoherent existing props**, not indiscriminately increasing prop density. No decorative stall, NPC merchant, new service or new building functionality is authorized.

### WD-10 — Maintenance gradient at the water edge

- **At headgate/wheel:** practical stone/compacted bank, exposed damp masonry, limited small rocks, little vegetation in machinery clearance.
- **At still pond margins:** irregular silt shelves, a few reeds/grass clumps, natural asymmetry and unobstructed views to the engineered dam.
- **Along lower race:** damp darker soil, occasional roots and sparse stones with increasingly wild riparian planting toward the main river.
- **At work yard/road:** firm worn brown earth, modest red-clay exposure only in traffic-worn cuts, relatively clear verge.
- **Beyond:** Greenwood-approved green summer hardwoods and layered grove margins, keeping combat telegraphs, the wheel and bridges visible.

Inherit vegetation identities from #808. Avoid a reed ring around all water or a random decorative boulder forest.

### WD-11 — Two practical night lights, with credible usage

A distinct **wall/beam-mounted entrance lantern** belongs beside the actual loading door, below the eaves, using real bracket, cage and glass. It may stay **on** as the principal after-dark wayfinding/safety light. A smaller protected inspection fitting near the sluice is physically plausible, but should normally be **unlit or dim** unless the scene genuinely needs a working hazard cue. Do not imply a fully operating staffed night shift or light every workshop window.

The door pool and weak local reflection should be warmer than the surrounding moonlit **slate/blue-gray** Greenwood palette from #809, but never a flat yellow rectangle pasted on the roof or in the river. Most windows can remain dark; any dim interior hint needs believable placement and must not contradict the closed-workplace hierarchy from #812. Fixtures exist and look like real metal/glass hardware by day; there is no ghost lamp that spawns only at night.

Use existing bounded lighting systems rather than demand dynamic shadow maps or high-cost glow filters. Respect character silhouettes, target rings, combat warnings, water/bridge navigation and both Canvas/Pixi presentation.

### WD-12 — Strong environmental composition at game camera scale

Compose three principal masses in normal play framing:
1. **Upper/left:** the asymmetrical millpond and its legible controlled bank.
2. **Center:** a unified, signature-size mill plus waterwheel, with the dry front/road visible.
3. **Lower/right:** a narrower riverward tailrace, local timber service bridge and riverbank transition.

Secondary small props should support the story; the player eye should follow **water source → stored water → used water → discharged water**, then find the loading entrance and onward route. One visually dominant mill, not four unconnected focal points.

The river continues into/out of the wider regional world; do not frame it as an ornamental moat around the mill. Keep negative space around heroes/companions and existing region identity. Prefer physical clarity over extra particle effects.

## 3. Proposed topological scene plan — not a measured coordinate patch

**Orientation:** world north is map-up; the visual left/right facade descriptions refer to the screenshot/isometric projection, **not necessarily the same world-axis direction**.

~~~
N / NW woodland edge
   | narrow winding creek (preferred edge source; road culvert if required)
   v
  natural inlet -> [ WESTERN MILLPOND ]
                           | dam/weir with wet headgate
                           v
                   controlled short headrace
                           v
               [WHEEL] -- [MILL HOUSE]
                   |         | dry loading door
                   v         v
              lower tailrace | [SERVICE APRON] --- existing farm lane
                   |         |     (cart + compact supplies)
                   +-- [SMALL LOCAL TIMBER BRIDGE] -- dry approach
                   |
                   v
            [MAIN RIVER CONFLUENCE] -> existing regional river
~~~

**No fake exact siting:** this is a relationship diagram. Architecture and hydraulic features are not yet proven geometrically clear of today's farm lane, 16 route lines, actual saved world objects, protected enemy homes, or player buildings. The implementation must create the *shortest valid connection* while preserving existing crossings, plot access and selected local bridge.

### Design alternatives considered

| Option | Disposition | Reason |
| --- | --- | --- |
| Roof-only sprite fix | **Reject** | Leaves impossible walls, wheel/door/roof relationships and disconnected water |
| Add painted blue water under dry sluice | **Reject** | Conceals physics/navigation defect and perpetuates seams |
| Add a full third main-river bridge | **Reject** | Conflicts with canonical north/south crossing identity and route design |
| Preferred north/northwest edge tributary | **Select, conditional on spatial clearance** | Gives water an upstream geographic origin; requires auditing any road crossing |
| Clear spring/wooded headwater inside map | **Fallback only if measured edge route unsafe** | Credible origin without destroying town road geometry; must visually exist |
| Simple static wheel and bounded water ripples | **Select** | Gives visual causality without introducing expensive fluid simulation |
| New water-flow/economy mechanic or grain service | **Reject** | Not requested, not established in Vale source, conflicts with Stage 3 scope |
| Heavily lit mill workshop all night | **Reject** | Contradicts quiet after-hours regional composition and fixture design |

## 4. Scene storyboard: the review set game design must be able to approve

Every view uses the **same authored world geometry**; change camera/clock, not the underlying build.

| Card | Frame | Designer must be able to see |
| --- | --- | --- |
| **A. Arrival** | 150% phone landscape, daylight, hero near farm lane | Mill dominates without hiding road; one dry door and legible loading apron; local service bridge appears as a deliberate connection |
| **B. Architecture** | 150% plus close-up, front/side in one view | Single roof ridge, aligned story beams on both facades, actual door jambs, recessed wall-plane windows, consistent stone-timber-plaster hierarchy |
| **C. Wheel and gate** | daylight close-up from pond/mill side | Wet controlled mouth, short flume physically touching paddles, anchored wheel/axle, lower discharge, retained masonry |
| **D. Hydrology overview** | map/whole-region composed view | Tributary origin/edge or authored spring, uninterrupted pond/race/confluence, all crossings identified, no inland water cutoff |
| **E. Road and bridge** | 150%, player + party approach from both ends | Continuous dry lane, proper timber deck and banks, water under bridge, no wall/tree/prop bottleneck or nonwalkable deck |
| **F. Night** | same scene, deep night, Canvas and Pixi | Cool moonlit ground, two authentic fixture locations, mainly one functional entrance glow, local water reflection, readable actors/road/wheel |
| **G. Dusk and dawn** | matching composed views | Physically present fixtures, no popping yellow rectangles, coherent gradual transitions, no roof/window anomalies |
| **H. Wider district** | walking from Orchard/Millhaven and back | Farm road, orchard industry, mill yard, northern crossing and natural river feel like connected country, not separate map decals |

Also inspect Optimization Mode and one existing v4 saved game with player-owned/paid buildings where materially relevant. Screenshots alone are not proof of physical collision, NPC access or save safety.

## 5. Non-negotiable designer acceptance tests

The **design package** is ready for engineering scoping when its anatomy, materials, topology and comparisons are specified. The **implemented scene** is *not* creatively accepted until an independent scene review demonstrates each criterion.

- **DA-01 Architectural coherence:** roof ridge/eaves/corners/levels share one projection; there is no arbitrary extra gable slab.
- **DA-02 Material readability:** timber, upper infill, stone base and roof remain recognizable across both visible facades in day and night.
- **DA-03 Correct openings:** windows are recessed/aligned; dry door visibly leads to a navigable apron, without promising a new gameplay service.
- **DA-04 Functional wheel:** axle/support/paddles and wet upper feed + lower discharge are seen in one close view.
- **DA-05 Pond/dam:** one real pond, water physically abuts/wets the weir, clear upstream/downstream story.
- **DA-06 Tributary origin:** the water enters from a legitimate map edge or demonstrably authored headwater; no hard inland stroke end.
- **DA-07 River junction:** water merges into the real main river without blue/tan stacking seams or a drawn water border across the mouth.
- **DA-08 Crossing:** farm road/short mill service route is continuous over a **physical** small local bridge, while the two original main river bridges remain correct.
- **DA-09 Geographic logic:** any other tributary/road intersection is intentionally bridged/culverted or safely avoided, not silently flooded.
- **DA-10 Safe work yard:** wheel/dam access and site marker remain visible; props, building, roads, hero and companions have plausible clear passage.
- **DA-11 Visual hierarchy:** mill is a memorable centerpiece with restrained props and meaningful maintained-to-wild bank transitions.
- **DA-12 Night use:** wall-mounted lantern and its light source agree; no roof stickers or permanent fully lit workplace; scene stays readable and mysterious.
- **DA-13 Gameplay fidelity:** no new commerce, resources, quests, monster placements, boss rules, map objective or fake interactable.
- **DA-14 Cross-renderer:** the composed geometry, water/bridges and critical light positions make visual sense in Canvas and Pixi; design remains readable in phone landscape at 150%.
- **DA-15 Evidence:** same-location before/after day/night images and an actual source-referenced region overview, not only isolated art or programmatic geometry screenshots.

**Reject an implementation** if any of DA-01 through DA-10 or DA-13 fails even if it is visually attractive. DA-11, DA-12, DA-14 and DA-15 are also required to call the scene creatively finished; passing automated tests alone never establishes artistic acceptance.

## 6. Engineering handoff: staged and bounded, not authorized by this document

| Package | Owner's actual problem solved | Necessary proof and handback |
| --- | --- | --- |
| **E0: Survey** | Current positions are references, not a real planned crossing | Exact-head current region/150% camera frames and map with bank polygons, road intersections, existing bridge and owned-structure zones; choose upstream edge versus spring **based on protected routes** |
| **E1: Geographic master** | Blue ribbons/pond overlap, dry weir, cutoff creek, fake crossing | Single source-owned 2D water boundary/union for rendering and collision; connected headrace/tailrace/main-river mouth, one true local service crossing and any required upstream culvert; same legal traversal both sides |
| **E2: Architectural master** | Generic workshop + roof/wood/material contradictions | Rebuilt watermill from one coherent facade/roof construction contract; proper wheel placement and support; consistent collision/visual footprint; compare hero scale and main frontage |
| **E3: Landscape and light** | Scattered work props, missing lantern, flat night composition | Organize existing mill props; bank materials, modest plants and two authored fixture bodies/states; coordinate #808/#809/#812 and held #803, don't globally alter nighttime systems |
| **E4: Focused correctness** | Attractive painting can still break a route/save | Matched Canvas/Pixi and phone-landscape previews, local route/bridge collision and actor/companion passage, protected stored sites, repeated v4 save/reload, forest/road/home clearance, focused renderer/CPU checks |
| **E5: Owner presentation** | Prevent another “audit the audit” cycle | Compact day/night before/after contact sheet, mapped flow/crossings, clear test/failure status, retained identities, exact commit and pending device verification; owner accepts/rejects actual playable scene after independent quality review |

A future engineer should keep E1 and E2 on a coordinated feature branch so terrain and mill composition can be judged together. Use **original world geometry and source-defined data**; do not create a screenshot-specific painted patch. Runtime tests and any pull requests for implementation must be authorized separately; comprehensive suites, merging, deployment and physical device acceptance are separate gates.

### Preservation / regression contract

- Keep 'mill-pond', 'bridge-north', 'bridge-south', existing pond/treasure/tribute and quest identities stable. Do not change the separate eastern farm pond or add additional river objectives.
- Preserve v4 save handling, historical scene migration, player-authored structures, paid Barracks, current work orders and their actual destinations. New water must not silently delete, teleport or trap retained objects.
- No change to four hero classes, combat, monster counts, homes, encounter density, Thornfang/Mira patrol, Scornfang's Treasury, reward/tribute budgets, training or Field Lab mechanics.
- Maintain a single water/bridge collision authority for painting, route planning, hit testing and NPC/party movement. A decorative bridge that remains impassable is not a fix.
- Avoid more permanent animated/water/particle work per frame than necessary. Prefer compact static shapes, reused art/material families and bounded existing lighting. Measure any meaningful graphics-cost increase rather than assuming CPU performance.
- Preserve alternative renderer recovery and Canvas fallback, as well as existing Optimization Mode meaning.
- No bulk terrain or global art family changes in another region; coordinate changes to shared renderer functions with their active owning branches.

## 7. Responsibility, dependencies and status ledger

**Current deliverable:** a single source-reconciled environment/game-design specification and owner-reviewable creative direction. No new experimental drawings, sprite masters, scene captures, code changes or measurements have been produced by this design document. The original screenshot establishes perceptual defects, not numerical bridge widths or world coordinates. The 52–64 bridge width and 60–70% wheel proportion are design-starting ranges, not tested or locked runtime metrics.

**Engineering responsibility once separately commissioned:** select the final safe channel/bridge coordinates; produce real scene artwork; implement shared water/road collision; keep legacy state safe; run focused test/build and render evidence; self-correct obvious visual errors; submit a playable candidate before claiming design acceptance.

**Not yet done:** implemented geometry or art, automated tests, real rendered creative acceptance, merge, deployment and device verification. All remain unclaimed. Draft design review may proceed without requiring the owner to answer a broad set of creative questions.

### Direct references

- [Source: Greenwood regional geometry](../src/prototype/greenwood-landscape.js)
- [Source: visual mill and sluice composition](../src/prototype/visuals.js)
- [Approved art direction, including W01–W06](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md)
- [Greenwood masterplan](GREENWOOD_REDESIGN_MASTERPLAN_20261029.md)
- [Original hydraulic bug report #641](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/641)
- [Road design #807](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/807), [botany design #808](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/808), [night design #809](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/809), [lantern design #812](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/812)

**Design handoff disposition:** **GO for future engineering scoping after owner design review; NOT GO for implementation, merging or publication merely because this document exists.**
