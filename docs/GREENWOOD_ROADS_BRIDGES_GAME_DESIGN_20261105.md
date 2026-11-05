## Independent game-design QA — second pass, 5 November 2026

**Status: candidate corrected, visual acceptance NOT YET established.** This is a game-design re-audit of engineering geometry, **not** an in-game or physical-device capture. The owner-provided before-images remain the visual problem reference.

| Visual finding | Independent designer's disposition |
| --- | --- |
| Unnatural carriage-road elbows | Source geometry: original main-road maximum heading jump ~46.7°, proposed curve samples ~8.2°; long farm-road maxima ~60° to ~11°. Curves are bounded to limit intrusion into adjacent plots. Final normal-camera roof/prop clearance still needs inspection. |
| Overlapping intersections | Treasury access used to retrace a cart segment; cut the duplicated section to one junction and draw wide roadbeds with non-overlapping material fill layers. Check real T/Y views before acceptance. |
| North bridge mismatch | Stone freight crossing: matching 100-unit physical gap/deck against an 88-unit cart road, with small external edgework. Both bank transitions still require normal-play scene captures. |
| South bridge mismatch | Initial engineering proposal had grown to 80 units due to wrongly assuming 50-unit route cells start at zero. Actual route centers are `25+50n`. Design rejected that enlargement and restored the 56-unit navigable timber bridge; the 52-unit farm cart lane now stops on solid west bank at (1560,2280), where the 24-unit pedestrian approach continues across and exits straight on the east bank. Native traversal still requires exact-head verification. |
| CPU cost and visual density | Replaced per-frame route JSON serialization with numeric coordinate cache comparison. Bounded subdivision only near main-road junctions reduced schematic pedestrian segments from ~637 to ~300, maintaining continuous rounded runs. This is not a measured FPS claim. |
| Save and integration safety | A separate `greenwoodRoadBridgeVersion` prevents destructive Greenwood scenery rebuild. Exact-head v4 reload, companion traversal, collision checks and real screenshots are required. Main independently gained PR #811 Pixi fortress/health-plate fixes; resolve integration without reverting them before merge. |

**Release design gate: HOLD.** Source-level proportional/curvature improvements are implemented, but approving the appearance requires actual 150%-camera Canvas/Pixi scenes of Millhaven and both banks of both bridges, with actor/companion traversal and roofs/props checked. This branch remains a draft; no merge, deployment, broad suite, device acceptance or final artistic approval is claimed.

---

> **Engineering phase authorized by the owner, 5 November 2026.** This design is the artistic acceptance contract for [separate implementation draft #815](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/815). Its original design-only completion/handoff notes below are historical; engineering can adjust provisional numerical width targets only when actual movement, visual and saved-game evidence requires it. Do not interpret a draft as verified, merged, published or approved artwork.

# Greenwood Vale — roads, junctions and bridges: complete game-design specification

**Project:** *So I Became the Dark Lord's Problem* (SIBDLP). **Date:** 5 November 2026. **Status:** Design package complete for review and later engineering handoff; no implementation authorized by this document. **Scope:** the existing Greenwood Vale (first region) only. **Source baseline:** `main@dacd18ee99d20fff6ae39c52067f1bba1fc5875e`. **Player evidence:** nine owner-supplied in-game views and close-ups of sharp road bends, intersecting road paint, and both crossings. Do not upload those personal screenshots to the public repository merely to duplicate the evidence.

**Decision authority:** The owner approved pursuing a game-design solution first on 5 November 2026. The approved [Greenwood 50-decision register](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md), especially M03–M06, W01–W06 and S01–S03, defines the region's visual identity. This specification selects a coherent **proposal** under those decisions; numerical design targets are **visual/experience targets** awaiting engineering validation, not assertions that a historical vehicle had these dimensions or permission to change live collision. [GV-B #547](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/547) owns geographic/bridge integrity; [Millhaven #640](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/640) already tracks the related town street/frontage problem. Avoid opening duplicate defect tickets.

## 1. The experience we are designing

Greenwood's main roads should read as a practical, maintained cart-and-carriage network serving Millhaven, the northern freight bridge, Scornfang's Treasury and the outbound merchant wagon. Orchard Hamlet, its fields and the mill use modest farm lanes. The Goblin and Skeleton territories, the southern woods and the estate are reached by narrow, naturally worn footpaths. Roads belong to the established land use, not to an abstract sequence of map points.

**Design test:** A player should be able to imagine a loaded horse-drawn cart entering Millhaven, turning into its market or freight approach and reaching the **northern** bridge without an implausible hairpin. The **southern** bridge should instead look like a believable pedestrian/pack-traveler connection, not a second enormous highway platform. It is acceptable for **town streets** to make more deliberate/angular turns around blocks, provided their intersections remain physically usable. Wilderness curves should be smoother and more organic. This is a stylized medieval-fantasy visual requirement, not a modern road-engineering simulation.

Preserve the existing original fantasy, isometric presentation, managed green summer Piedmont valley, localized red-clay exposure, occupied settlement identities and procedural-art canon. No asphalt, traffic markings, new vehicles, road-building gameplay, additional transportation services, new quests or lore.

## 2. Source-confirmed diagnosis (not implementation instructions)

1. `src/prototype/greenwood-landscape.js::greenwoodRedesignFinish` authors **16 route polylines**: 1 cart, 3 farm, 12 path. The same source assigns the first four to `z.roads` and the other twelve to `z.footpaths`; it also authors two `z.bridgeApproaches`. Route source data is not an automatically smooth curve.
2. `GreenwoodLandscape.drawRoads` paints strips with polygon caps and overlapping circular node patches. Width depends on **array index** (first path half-width 31, other roads half-width 17), not an enduring semantic route class. On the current road surface, the approximate painted full core widths are **62 cart** and **34 farm** world units; the separate footpath painter uses **18**. The outer cart/farm shoulder is wider than the core. These are rendered-world widths, not measured carriage dimensions.
3. `src/prototype/visuals.js::bridges` derives complete bridge deck breadth from the **river barrier gap** plus edge offsets. Greenwood's southern collision/paint opening is explicitly set to 130 world units in `greenwood.js` and the original northern crossing breadth is retained (approximately 180 units). Thus the deck can look multiples wider than its approaching road. The northern version is stone, the southern timber in the current source. The bridge approach's separate `width` metadata does **not** govern the deck polygon's visible breadth.
4. `src/prototype/visuals.js::roads` delegates Greenwood v2 to `GreenwoodLandscape.drawRoads`. `footpaths` is a separate painter. `renderer.js` paints roads, then footpaths, then bridge decks. A visual seam or cap can appear when independently painted road/path strips meet and at their bridge edge. Existing road geometry, collision and graphical presentation must not be confused.
5. Example of a **topology/rendering overlap**: the Treasury spur starts `[2070,1000] -> [1870,1000] -> [1870,1250]`, retracing the existing main cart stretch `[1670,1000] -> [2070,1000]` before turning off. `[1870,1000]` is in the *middle* of the original main edge, not a shared authored vertex. This must become a deliberate connected junction, not two strips stacked on top of one another.
6. Examples of **angular route geometry** needing artistic review: the main Millhaven–freight curve around `[1000,650]` and `[1330,1000]`; the farm loop via `[550,1750]`, `[780,2100]`, `[1300,2280]`; and the perimeter woodland routes with several nearly orthogonal bends. Not every sharp corner is a bug: short service doorpaths can remain direct and perpendicular.
7. Existing road-clearance rules depend on **distance to authored road segments** (`world.js::roadSetback` and `clearStreetCorridors`). Merely painting a wider/smoothed route outside that physical corridor can make roofs, palisades and scenery appear in the carriageway. Existing v4 save handling and source-aware Greenwood migration must remain intact.

**What is observed vs inferred:** The visual complaints and both crossing examples are evident in the supplied screenshots; the renderer and route definitions above are confirmed by source. We have not measured exact screen-space bridge widths in the player's installed build, tested actual carriage physics (no such traffic simulation exists), or proven every apparent intersection corresponds to a particular saved map coordinate. Design widths below are intentional art-direction choices, not retrospective measured fixes.

## 3. Locked visual hierarchy and proportional target

All widths below are **full apparent usable surface widths in world units**, not CSS pixels. They are an **engineering starting band**, calibrated from the current 62/34/18 road widths and ~180/130 bridge deck widths. Rendered perspective must be assessed on the actual 150% mobile camera. Do not freeze a number that fails physical collision/actor/party clearance.

| Element | Design target | Character / reason |
| --- | --- | --- |
| Maintained main cart road | **80–96**; baseline **88** | One unmistakable freight spine. Wider than today's ~62 without reading as a boulevard. Limited flared corners and a compacted travel bed, not a uniformly wide ribbon through all terrain. |
| Farm/service carriage lane | **46–60**; baseline **52** | Fits the visual logic of rural carts and farm deliveries while remaining subordinate to the main road. Existing core ~34 is too slight for the intended use. |
| Woodland/pedestrian path | **20–28**; baseline **24** | Walking/pack-travel scale; soft edge, discontinuous compacted wear where appropriate; not a thin bright stripe or full farm road. |
| North stone freight bridge **usable deck** | **92–108**; baseline **100** | Slightly wider than the main cart bed at its entry, not ~3 times its width. Bridge masonry and end posts extend slightly beyond the *usable* deck; distinguish this from deck traffic breadth. |
| South timber footbridge **usable deck** | **44–56**; baseline **48** | Roughly half the north deck, narrower than the farm lane at its approach but generously enough drawn for an adventurer with companions. Avoid the existing broad rectangular-table appearance. |
| North bridge approaches | Match main road, **88** base with subtle flared abutment apron | A gentle widening or stone/earth threshold close to the bridge, with no pinched neck or color seam. |
| South bridge approaches | Farm lane tapers to **walking approach ~28–34** before a **48** deck | The rural farm lane ends at a small believable approach/turning pocket on the west bank, and the final crossing segment communicates walking travel. Eastern woodland trail joins the deck naturally. No implied carriage through-traffic on the footbridge. |

The bridge is not to be narrowed by paint alone while retaining a much wider invisible walkable water gap; equivalently, the road cannot be widened visually under roof or prop collision. **Visible usable footprint and physical legal traversal must agree.** Stone edges, timber railings and architectural ornament can project outside the legal walkway where the visual collision convention supports it.

## 4. Bends: road-turn design grammar

- **Main cart routes:** Consecutive headings should connect with long easing bends; no isolated V-shaped/hairpin turns in open countryside. Prefer a gently tangent circular or cubic arc bounded within a verified land corridor. As an *art-direction heuristic*, allow no abrupt single-step change of travel heading exceeding about **35–45 degrees** without inserting a visual curve or properly widened turning area. Avoid pretending this heuristic is a literal historical radius standard.
- **Farm lanes:** More irregular than the trunk road, following parcels, orchards and mill frontage, but still avoid sawtooth and sudden zigzags. A clear turning elbow is legitimate beside a work yard where a cart could plausibly maneuver; give it room.
- **Pedestrian/woodland routes:** They may wind around trees, water and occupied homes more tightly, yet should form a continuous *walked desire line*. Remove coordinate-grid-looking corners; do not force cart-sized arcs where only feet can travel.
- **Settlements:** Right-angle street junctions may be visible and historically plausible where lanes meet between building blocks. Soften *inner corners* of their usable surfaces, make turning/apron spaces, and integrate the intersection into a central square or working street. Do not round a street into someone's porch merely to achieve mathematical curvature.
- **No invented cut-throughs:** A smoother surface may **not** visually cross rivers except at bridge decks; cut through walls, palisade gates, farm buildings, roofs, ponds, the mill's headrace/sluice, a Treasury compound, enemy residences, or interactive service points.
- **Material continuity:** Keep the existing earthy base and subdued clay wear. Put wheel wear gently along cart travel, not on woodland footpaths or on the stone/timber bridge surface. The exact visual texture should not resemble modern lane paint.

## 5. Junctions: one authored connection, one visible roadbed

A junction is a *shared piece of ground*, not one fully capped road laid over another. Design it as a normalized network node with the incident paths meeting their centerlines, merged shoulders and a continuous compacted material. The final silhouette depends on purpose:

1. **Main-to-main or main-to-farm:** A clean T or Y with small flared joining edges; preserve the main road's visual continuity and subordinate the side lane's width and wear. Never have an end-cap circle or dark/bright rectangle crossing visibly over an established lane.
2. **Farm-to-farm:** A softer worn junction widened only as needed for work traffic; irregular earth fringes rather than crisp engineered pavement.
3. **Road-to-footpath:** A deliberate taper or faded footpath beginning at the *edge* of the wider surface, not a thin tube drawn across the whole carriage bed.
4. **Dead ends and yards:** End at a recognizable doorstep, loading apron, gate or turnaround, with a rounded/irregular material termination; never leave a hovering strip that is not visibly connected.
5. **Crossovers:** A visually crossing pair must share a genuine route node and legal traversable ground, or be explicitly separated by a physical obstacle/grade feature already supported. There must be no fake on-grade crossing that the movement solver treats as disconnected.

For the Treasury spur specifically, terminate the duplicated backtracking paint and create one true junction on the freight spine near the existing `[1870,1000]` takeoff without moving its Treasury identity. This is a **network-design requirement**, not authorization to delete a useful saved route or reroute the Treasury through private yards.

All collision/navigability source geometry must agree with the presented junction. Merely hiding layering defects with an overlay patch that conceals inaccessible terrain is not acceptance.

## 6. Two bridge compositions

### North: stone freight bridge, near (1670,1000)

**Function:** Millhaven–northern bridge–outbound wagon trunk, with a receiving/Treasury connection. **Silhouette:** A compact but sturdy stone deck with an obvious linear centerline; strong squared abutments, a modest approach apron and only restrained edge posts/parapets. Visually credible carts could cross it. Its full deck breadth should be close to the maintained main cart road, not a wide floating plaza spanning the river. It remains the wider, more engineered crossing.

**Western approach:** the `[1330,1000] -> [1670,1000]` corridor is almost straight. The preceding main-road turn from `[1000,650]` must ease into that line well before the abutment. **Eastern approach:** the `[1670,1000] -> [2070,1000]` straight route continues cleanly toward the outgoing freight roads and Treasury spur. Do not build a visible S-bend directly onto the deck. Bridge edge, earth approach and exposed riverbank must join without a painted seam, a grass wedge or floating timber/stone slab. Keep the original river geometry and two-bank connection.

### South: timber footbridge, near (1740,2280)

**Function:** quieter farm-to-woods/estate foot crossing, not the merchant wagon thoroughfare. **Silhouette:** narrow practical timber span, planks/edge treatment and small posts, visually much lighter than the north stone structure. It can look hand-maintained without being fragile or inaccessible to a party.

**Western approach:** farm lane via `[780,2100] -> [1300,2280] -> [1740,2280]`; express a modest rural stopping/turning shoulder **before** the final narrower path and bridge transition, not a full cart route apparently continuing across a footbridge. **Eastern approach:** woodland line `[1740,2280] -> [2150,2350] -> ...` emerges directly from the center of the timber deck and eases toward its next branch. Continue the actual legal crossing through both banks; do not turn the bridge into a decorative prop or silently disable its discovery.

**Common bridge rules:** The walkable deck begins/ends at solid ground and is aligned to the connecting traveled centerline. No undersized pinched transition, exaggerated rectangular platform, water showing through the route center, planks misaligned to the span, railing blocking player sprites, or approach road continuing visibly over the deck. Keep exact bridge IDs and all story/discovery bindings.

## 7. Complete 16-route Greenwood treatment matrix

These are the **current authored route identities inferred from their ordered points**; numbering refers to order in `greenwoodRedesignFinish`, not a persisted game ID. Preserve destinations and intentional loops.

| # | Current authored corridor | Required design treatment |
| --- | --- | --- |
| R01 | `cart`: Millhaven west/east town street -> north stone bridge -> Treasury/wagon junction -> northeast wagon | Primary cart width throughout. Easing bends at [1000,650], [1330,1000], [2320,900], [2480,650]; bridge straight-through; meaningful terminal wagon frontage. |
| R02 | `farm`: Millhaven -> mill/hamlet/orchard -> southern west crossing | Farm width with natural field curves. Soften [550,1750] and [780,2100]; create west-bank footbridge transition without pretending carts use the timber crossing. |
| R03 | `farm`: middle western farm lane -> working mill frontage | A genuine T branch near [650,1550] and compacted service apron near mill; do not cross headrace, sluice or wet bank. |
| R04 | `farm`: north-east trunk -> Treasury/cache/estate/Crypt approach | Freight character at the established Treasury turnoff, then rural working lane toward quieter sites. Tame bends near [2500,1350], [2420,1690], [2240,1980]; stop at real safe frontages. |
| R05 | `path`: Orchard Hamlet -> western den/cellar woods -> south-west crossing | Footpath stays organic and legible; retain its discovered woodland/territory circuit; no sharp mechanical chain of diagonals. |
| R06 | `path`: southern forest branch -> Goblin camp | A purposeful gate approach, not a paved shortcut through the occupied compound or stockade. |
| R07 | `path`: south bridge east bank -> Skeleton watch | Centered bridge exit; gentle woodland curve at [2150,2350], keep actual watch access. |
| R08 | `path`: Treasury spur via [2070,1000], [1870,1000], [1870,1250], [2120,1250] | **Explicit overlap repair:** share existing cart segment and create the junction at the real takeoff. No doubled painted road. Foot-access portion ends at Treasury approach, not building interior. |
| R09 | `path`: northwest perimeter loop returning to main freight line | Keep scenic walking-loop identity while softening obvious square bends. Preserve boundary-safe path and avoid creating a second carriage artery. |
| R10 | `path`: wagon -> northeast/east perimeter -> farm/Treasury connection | Keep quiet return trail; reduce rectilinear right-angle zigzags around [3030,620], [3020,1020], [3030,1480]; keep valid boundaries. |
| R11 | `path`: [460,480] to [460,600] | Intentional Millhaven door/service spur, terminate at one clean main street junction. |
| R12 | `path`: [400,710] to [400,600] | Supplier/frontage access to main street; must not leave exposed overlapping capsule across the road. |
| R13 | `path`: [810,730] to [810,623] | Recruiter/frontage spur joins the town road edge only, keeping nearby residence frontage. |
| R14 | `path`: [780,470] to [780,619] | Quest-board/frontage spur with readable path-to-street arrival and no duplicate town-center lines. |
| R15 | `path`: [405,1660] to [595,1660] | Hamlet frontage access: inspect actual link to the farm route and its service purpose; join or finish at a coherent yard, never as a floating stub. |
| R16 | `path`: [1040,1530] to [1040,1660] | Mill approach meets farm spur at shared middle-segment junction; keep working mill, watercourse and loading frontage clear. |

**Route matrix bounds:** Branch IDs, actor homes, bridge sites, quest discovery, enemy patrols, Treasury, Crypt, Goblin/Skeleton habitation, mill and wagon remain authoritative. None of these road treatments authorizes new scenery, enemy relocation or encounter-rate changes.

## 8. Composition and camera acceptance

Review the **real presented scene**, not only a clean plan view. At the normal iPhone landscape 150% camera, all of the following should read correctly in daylight and at night:

- Main Millhaven working street: the market/quest/service fronts form one credible street composition with clear exits; farm spur and four door paths are subordinated. No overly abrupt rural approach or odd capsule intersections.
- Three road-junction close-ups corresponding to the owner's original overlap examples: T, Y and crossing/branch where applicable; no painted-on-top strips, bright overlap patches or inconsistent shoulder materials.
- Northern stone bridge: whole western lead-in, deck and whole eastern lead-out in **one connected scene**, plus a view while the hero/companions are on it.
- Southern timber footbridge: a similar two-bank continuity view, with the transition between cart farm lane and walking trail evident.
- Orchard/hamlet/mill: farm roads broad enough for their purpose but not city streets; mill loading path does not collide with working hydraulics.
- Forest circuit and east return: organic traversable lines and meaningful endings, not unnatural tile-like zigzags.
- At standard play scale, foliage, shadows, buildings, attack telegraphs, actors, labels and touch UI remain readable; no photo-only perfection achieved by zooming in much closer than gameplay allows.
- Observe Canvas 2D and optional PixiJS/WebGL2 rendering with the same road/bridge geometry and colors, across cold entry/region cache regeneration as applicable. A pleasing still image from one renderer is not proof of parity.

### Design rejection triggers (not optional polish)
Any abrupt impossible carriage elbow on a principal route; double-painted junction; bridge-to-road breadth jump without intentional taper; stone/timber deck looking like a disconnected oversized table; visual walkable route through impassable water; visually narrowed bridge retaining a broad hidden traverse corridor; roof/prop covering new road; footbridge depicted as a cart crossing; lost service/quest/companion route; or serious scenery/rendering cost increase invalidates the candidate.

## 9. Engineering handoff (NOT authorized yet)

**Recommended independent work package:** one Greenwood-only isolated draft PR, no broad region redesign. The implementation phase should, in order:

1. Pin this specification and fresh `main`; map all 16 authored centerlines, shared intersections, saved/restore route variants and bridge bank/gap constraints. Reconcile the current Millhaven #640 work and any subsequent Greenwood/scenery changes before editing.
2. Represent the semantic cart/farm/path hierarchy explicitly rather than inferring it from array position. Normalize genuine junction topology: split an edge at a mid-segment attachment, deduplicate shared stretches, and preserve purposeful connectivity.
3. Shape tangent/curved roadbed geometry using a **bounded deterministic, precomputed/cached** path representation. Do **not** calculate expensive bezier unions, intersections or painter meshes every frame. Distinguish the visual roadbed and shoulders from the authoritative collision/navigation corridor; no fake roads.
4. Reconcile both bridge decks against actual `barriers.gaps`, two-bank approach positions and party-safe movement. A narrowed visual deck **requires** a matching physically traversable width, or a redesigned barrier definition accepted by route tests. Never clip merely the art while the hero can visibly stand on water.
5. Recheck authored map plots, old player Barracks, roofs and palisades **against the full new swept road footprint** (not only old centerline distance) with source-aware v4 migration. Preserve plot IDs/paid progress/resources; if a saved plot conflicts, apply existing placement safety rather than dropping it. Preserve NPC, enemy, patrol and quest state. Non-Greenwood regions unchanged.
6. Protect renderer parity and CPU/GPU cost: precomputed static road geometry, bounded tessellation, nearby visibility/culling and background-cache invalidation consistent with both rendering paths. Avoid altering combat simulation or loading extra textures to conceal geometry errors.
7. Run **focused native geometry/path, two-way crossings, actor/companion clearance, save idempotence, visual rendering and offline build checks** proportionate to the changed source. Compare actual camera captures and frame-time deltas against the current unchanged baseline. Do not initiate comprehensive suites, merge, deploy or claim device verification without separate owner authorization.

**Evidence required for engineering acceptance:** changed route/bridge diagram with coordinates and widths; before/after natural-scale snapshots of Millhaven, junctions and BOTH complete crossings; actual collision/traversal tests in both directions with companions and representative saved Barracks; unchanged quest/tribute/encounter identity; strict renderer comparison; performance observations that distinguish cold/warm and Canvas/Pixi; exact changed SHA and focused test receipt; explicit list of any open owner-only visual acceptance. In the owner's words, the game must look naturally navigable, not merely pass code tests.

## 10. Design completion gate and next decision

**Design scope finished:** hierarchy, intended widths, curvature language, intersection rules, bridge types/approaches, full 16-route treatments, camera review scenarios, rejection criteria, preservation constraints and a bounded engineering handoff are specified. The old layout remains playable and untouched; these are **not completed runtime fixes**.

**Not done:** no new road surface, bridge deck, geometry, asset, test, runtime, PWA or save migration has been implemented; no live image validation or phone certification of a proposed implementation; no merge or deployment. Engineering starts only with a subsequent owner direction.

The central design rule is **one physically believable traveled corridor, seen as one continuous roadbed** — with freight road, farm lane, footpath and bridge width reflecting their actual roles in Greenwood Vale.
