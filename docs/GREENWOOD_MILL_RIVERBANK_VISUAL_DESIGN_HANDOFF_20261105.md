# So I Became the Dark Lord's Problem — Greenwood Mill, River and Riverbank Visual Design Contract

**Date:** 5 November 2026  
**Discipline:** GAME DESIGN / ENVIRONMENTAL ART DIRECTION ONLY  
**Region:** Greenwood Vale, the first/opening region. This document is the first-region reference standard for future distinct regional design, not an order to recolor or copy Greenwood elsewhere.  
**Status:** The owner authorized **engineering on the same PR #813** on 5 November 2026. The art direction below remains the design contract; the **separate engineering implementation is now a draft candidate, not merged, published or device-verified**. See Section 13 for exact implementation and validation status.  
**Evidence:** The owner's 5 November landscape-phone river screenshots (one closer river/stockade-side view; one wider bridge/woodland view), the owner's preceding direct observations of the mill building and channel/waterway arrangement, the current main-source visual and layout routines, the approved fifty-choice Greenwood art register, and contemporary independent Greenwood design drafts. Screenshots are user-provided observations, not pixel-registered captures; do not upload them to the public GitHub repository without separate permission.

## 0. Decision and authority

**Selected design:** A coherent, lived-in, mature-summer, Piedmont-inspired fantasy river valley, with **gently eroded natural riverbanks, selectively maintained human approaches, distinctive lush riparian edges, and a recognizable working water-powered mill**. The river is a geographical and compositional spine, not a blue road-shaped ribbon with sawtooth borders. The mill is a materially coherent two-storey rural industrial building, not an assembly of unrelated roof, wall, window and wheel symbols. Night composition has real fixtures and localized warmth.

This is a **chosen design direction**, not a request for engineering to choose among generic alternatives. Reject a symmetrical stone-lined canal, exaggerated swamp reeds, uniform evergreen/flower stamps, wholesale water recoloring, roof lantern rectangles, or a prettier but physically disconnected mill illustration. A limited, maintained mill-side channel may be straighter than the natural river because people engineered it.

**Authority hierarchy:** the owner's current observations and explicit first-region-first mandate; repository AGENTS.md and current development state; owner-approved Greenwood Vale 50-decision register, especially E01–E06, M01–M06, W01–W06, S01–S04; the owner-directed substantial landscape-rebuild commission in docs/GREENWOOD_FLAGSHIP_REDESIGN_WORK_BRIEF_20261029.md; then prior historical layouts and implementation notes as evidence rather than inviolable artistic templates. Preserve the game, not the rejected old geography. The earlier dev.233 rebuild's implementation or test success is not artistic acceptance.

**Ownership limits:** This document concentrates on river, shore, western working mill, pond, engineered outlet, riverside vegetation, bank-to-road/bridge transitions, and lighting/composition in **Greenwood only**. Related broader work is governed by:
- **PR #807** — Greenwood road hierarchy, junctions, north stone freight bridge and south timber footbridge. Its proposed usable deck widths, approach taper and collision-equivalence requirements remain the bridge design source; do not invent a competing deck width here.
- **PR #808** — Greenwood whole-region groundcover, botanical variety, orchards, farmland and livestock. Its water-margin botanical language remains the groundcover source; this document specifies the **shoreline-specific distribution and scene design**.
- **PR #809** — Greenwood day/night/twilight palette and ambient light hierarchy. No independent nighttime grading scheme here.
- **PR #803** — physical lantern/sconce geometry and existing settlement lighting corrections. Mill fixtures must be coordinated with that implementation, not duplicated or layered on top of its objects.
- **GV-B #547, GV-C #548 and flagship #545** — geography/water/crossing, livelihood/working mill and first-region acceptance respectively.
- **PR #770 and #782** — separate Strategist authentic material sourcing and Field Labs/alchemical economy. **Do not imply that Greenwood's present watermill makes Acid Bottles or is the windmill-owned production system in that separate unmerged work.** Preserve its actual existing gameplay identity.

## 1. Evidence-based diagnosis

### 1.1 Player-visible defects in the supplied 5 November screenshots

**R1 — Sawtooth water margins.** Both banks show repeated sharp triangular insets and extrusions along a long blue band. The angles read as cut paper, not an eroded waterline. Some triangular interior patches are visibly darker/lighter than both river and land.

**R2 — Thin, uniform edge outlining.** A repeated bright bank line runs alongside the river but does not create a convincing transition through wet soil, exposed bank, water contact and shallow water. The eye perceives a hard mechanical perimeter.

**R3 — River/land material discontinuity.** Land and water appear to meet abruptly, with little sediment, root structure or groundcover anchoring the edge. Some shore accents look painted over the water rather than grown from land.

**R4 — Poor landscape rhythm.** Long open banks are visually vacant, while nearby trees can form repetitive clusters away from the actual waterline. The river lacks a coherent sequence of open, grazed, maintained, shaded and wilder stretches.

**R5 — Crossing/shore meeting.** The visible bridge deck(s) and approaches need actual bank abutments and material continuity; a bridge must not appear laid across a ribbon or terminate in mismatched painted strips. Road and bridge proportional redesign remains under PR #807.

**R6 — Night masking.** These are dark phone views. The angularity is still clearly present, but the screenshots alone cannot prove the exact daytime palette, original texture source, current renderer mode, or the complete length of the affected river. Test matching scene/camera conditions before attributing every pixel to one function.

### 1.2 Owner-reported western mill and hydraulic issues

**M1 — Conflicting architecture.** Mill walls, window direction, roof planes and visible facade seem assembled from primitive geometries without one consistent three-quarter architectural projection.

**M2 — Confused material hierarchy.** Timber, masonry and other wall fills are not intentionally differentiated, so one facade can seem made from unrelated materials.

**M3 — Weak building craftsmanship.** Roof, windows, support timbers and wall junctions do not read as one load-bearing industrial structure with a plausible functional layout.

**M4 — Insufficient evening identity.** The mill has no convincing integrated exterior lantern visible to the owner; the landmark fails to become a welcoming, useful night landmark. This does **not** authorize indiscriminate light sources or permanently lit roof windows.

**M5 — Fake hydraulic merger.** Existing pond/sluice/wheel and the apparent tailrace-to-river transition look like overlapping or detached shapes, not one controlled, continuous water route.

These are supplied owner design observations; the present two river screenshots do not themselves contain a complete mill close-up. A subsequent engineering candidate must compare matched native mill views rather than pretend that every architectural plane has already been pixel-verified here.

### 1.3 What current source actually explains

The inspected current main source shows:
- **src/prototype/greenwood-landscape.js** defines the Greenwood river using seven centerline/half-width anchors. Its **riverBanks(y)** interpolates with a smoothstep factor and yields the water boundaries. A smooth centerline does not by itself create attractive erosion, materials or planted banks.
- **src/prototype/rules.js** uses that shared Greenwood bank function for river barriers. **Paint and collision are coupled** and must remain so after any geographical redesign.
- **src/prototype/visuals.js**, river strip painter: a bank ribbon at inset -8, a darker water band at inset 0, another at inset 7, then a loop at **every 58 world units** adding a seeded triangular polygon to **both sides** (the pointed “tooth” has a size generated from 8 plus a seed remainder). A separate line routine samples banks every **24 units**. This makes the user's repeated sawtooth symptom source-plausible; **remove/redesign the triangular motif**, do not hide it with plant stamps.
- **src/prototype/visuals.js**, craftedDecoration for **vale-working-mill**: a stone/blockwork plinth plus an enlarged **vale-workshop** graphic, additional boards, timbers, a triangular roof, a window rectangle and a separately drawn wheel. Reusing a smaller building inside larger mill geometry risks facade/roof overlap and competing projection. Source confirms composition method, while exact screenshot-plane failures require capture.
- **src/prototype/visuals.js**, **mill-sluice**: a small blockwork/wood gate drawn as its own decoration.
- **src/prototype/greenwood.js** independently positions the working mill relative to the existing western circular pond and the sluice near its rim; the code says the wheel does not paint a second water body. **Proximity is not proof of a complete headrace–wheel–tailrace–river system.**
- No evidence from these source checks establishes a physically animated power-production mechanic, mandatory milling commodity, elevation physics, or the actual direction of river flow. Design must not invent one as gameplay.

**Design verdict:** This is a **compositional and source-art design failure**, not a request for more decorative plant density. Fix the line/shape language and whole-site meaning first.

## 2. The first-region visual promise

A player walking from Millhaven toward the mill or across the river should see:
1. A gently winding river recognizable through its **water shape**, even without plants.
2. Distinct banks: one may be shaded by hardwoods, the opposite may open toward fields or an accessible maintained path.
3. A water-to-land transition with visible materials and growth, rather than a perfect stroke around a blue polygon.
4. A credible **work site**: road/access → dry loading space → mill entrance → stone/timber building → controlled pond water → wheel → return water.
5. A single clear focal point per scene. At the mill, the building and wheel; at the crossing, the bridge and safe approach; in the woods, the river bend and trees.
6. In nighttime views, cool moonlit water and terrain, with a **small amount of genuine warm functional light** where humans work. No green-filter cast, glowing reeds, or floating fixture rectangles.

**Readability contract:** View at the game's typical **150% camera scale**, on a short landscape phone screen first; also desktop and 100–175% presentation checks. The scene must work when partly covered by movement/attack buttons and HUD. Nearby terrain detail must not obstruct actors, shadow/ground rings, telegraphs, incoming projectiles, targeting or navigation.

## 3. Chosen natural-river edge design

### 3.1 Bank contour: the shape must be beautiful before planting

**Replace the repeating triangular teeth.** Compose long, calm convex and concave shoreline turns, with locally shallower indentations and occasional deliberately exposed, more abrupt eroded sections. A bend should be legible at a glance and should look like water has shaped the ground, not like a zigzag tool.

- **Broad forms dominate:** long gentle changes in centerline/width and bank setbacks. A few small erosion changes only where materials and plant behavior support them.
- **No periodic signature:** no identical-looking V-shaped notch every fixed screen/world distance, no equidistant crenellation, no repeating left/right mirrored scallops.
- **Asymmetrical opposing banks:** do not use the same deformation with inverted sign on both edges. A broad undercut/treed bank can face a shallower grass/sediment bank.
- **Selective hard edges:** at abutments, dam and engineered sluice, straight structural lines are acceptable. The adjacent natural earth rejoins them gradually.
- **No fake extra channel:** a decorative dark polygon extending beyond the true river outline cannot imply more impassable water or a new water body.
- **Do not cosmetically smooth only the renderer:** if a material shore line visibly changes the legal water edge, its true collision and route geometry must change with it. Engineering owns determining whether a small inner-water material variation can safely be presentation-only.

**Rejected alternatives:** a mathematically perfect smooth constant-width ribbon; continuous rock embankments everywhere; tooth-shaped river flats hidden by reeds; a river that changes shape only on one renderer; curve smoothing that narrows legal crossings or leaves saved heroes in water.

### 3.2 Five-part shore material transition (cross-section)

Read **from dry land into the river**, but do not force all five visibly everywhere:

| Band | Artistic treatment | Design restraint |
| --- | --- | --- |
| **A. Dry verge** | Greenwood grass, low meadow details or leaf litter; transition into farms or hardwood woods according to land use | Keep main routes/interaction frontage clear |
| **B. Damp bank shoulder** | Low-chroma olive earth, occasional moss, subtle dark grass, compacted foot/wheel wear where used | A broken, variable band — not a uniformly bright stroke |
| **C. Exposed earth/roots** | Patchy muted brown/red-brown clay, loamy soil or rounded gray stone with roots where near trees | Clay is a small Piedmont accent; avoid continuous orange borders |
| **D. Water contact** | Thin discontinuous wet-soil shading, some irregular grass/sedge tufts, occasional small lapping highlights | No permanent high-contrast outline running the entire river |
| **E. In-water margin** | Darker nearshore water, subtle shallower visual values in selected areas, restrained surface texture | No new depth/ford/swimming mechanic or translucent water that makes collision ambiguous |

Material transitions must be aligned to the **same actual bank**, but may vary in width, disappear under maintained construction, and deepen in sheltered bends. Distinguish moisture through **value/material**, not just overlaying a bright line or changing every bank to mud.

### 3.3 Surface and flow grammar

- Water should visually follow the **river centerline and local tangent**. The current repetitive screen-diagonal strokes are not sufficient to communicate variable flow through bends.
- Use fewer, longer, more subdued streaks in calm water; clustered short disturbances around bridge piers/abutments and wherever a **verified** outlet enters; subdued eddies at inside bends if readable.
- The mid-channel may carry slightly more visible flow; very close to shore keep it calmer except where natural turbulence is motivated. Do not imply a violent torrent in peaceful Greenwood.
- Highlights should be sparse and varied; no equally spaced white dashes, entire-surface animation noise, mirror-like reflection carpet or 3D foam simulator.
- Daylight: subdued blue-green water reflecting the mature-summer environment. Night: lower-chroma blue-gray/charcoal consistent with **PR #809**; a narrow warm glimmer is allowed **only near a real light**.
- Prefer existing low-cost procedural/cached materials and existing water-motion budget. No per-frame random shore generation.

## 4. Riverside vegetation: regional identity without copy-paste

### 4.1 Greenwood-only plant hierarchy

**Upper/outer bank:** broad-canopy oak–hickory-like trees in nonuniform small stands; tree bases, occasional exposed roots, woodland thickets and ferns in sheltered shade. Use approved tree silhouettes and source-compatible variants rather than imposing a real-world botanical catalog.

**Middle bank:** mixed-height bushes, young saplings, irregular grass tufts, small fern clusters, occasional modest wildflower patches farther above the wet line.

**Wet margin:** sparing short sedge/rush/reed clusters in sheltered pockets, not continuous walls. Some bands have **no reed**. Stems need a readable root at shoreline rather than floating in the river.

**Intentional absence:** exposed curved soil or pebbled bank, a maintenance clearing, a worn access edge, a shaded gap under a tree. Negative space is part of the design, not evidence of insufficient prop count.

**Never copy Marches ecology:** no dominant mangrove/pneumatophore silhouettes, coastal salt-marsh mats, giant uniform cattail fringes or swamp treatment throughout Greenwood. Do not lift Ironroot rocky pine shoreline or Dark Crown industrial color language.

### 4.2 Placement is ecological and compositional, not random scatter

1. Build several coherent **vegetation clusters** from one wet-to-dry transect, with differences in size, slope of crowns, spacing and density. Avoid global evenly spaced dots.
2. Alternate intervals of maintenance, natural opening, wooded shade and dense but localized groundcover. Use nearby land use (farm, crossing, mill, wild forest) to decide the pattern.
3. Plant both banks **independently**; a high-crown cluster can be on one side while the other side remains open for water visibility or a working path.
4. No scenery on top of any road, bridge throat, mill water intake/exit, usable loading apron, service radius, NPC entrance, companion combat path or legal bank approach.
5. When trees visually overhang the river, keep their trunk/collision well grounded on dry land; never create a full canopy wall hiding enemies or player movement.
6. Use deterministic clustering (authored/seeds) and reuse plant compositions where helpful, but make their **placement, scale and context nonrepetitive**. Prefer a limited number of meaningful mixed patches over hundreds of new standalone draw calls.
7. Coordinate the plant-density and groundcover work with **PR #808**, avoiding a second parallel botanical system.

### 4.3 River segment identity cards

| Segment | Bank character | Intended focal point and density |
| --- | --- | --- |
| **West millpond and service area** | Managed, cut vegetation, stone/earth embankment with selective moss, short grasses and a few bushes away from working space | **Low** around wheel/sluice/door; **medium** at outer pond and mill yard |
| **Northern stone freight crossing** | Worn, maintained approaches, stable earth/stone abutments, restrained growth just beyond the deck | **Low** at ends; **medium** along adjoining bank |
| **Ordinary cultivated valley reach** | Grassy banks, shallow curved soil, a few scattered bushes, intermittent tree shade | **Medium**, with one bank frequently more open |
| **Southern timber footbridge** | Quieter woodland/farm transition, narrow footpath, low ferns and shrubs behind a clear approach | **Low** on deck/landing, **medium–high** beyond |
| **Wooded/wilder river reach** | Shaded hardwood roots, fern-rich bank, broken sediment and irregular shrub groups | **Medium–high** in pockets, not an impenetrable border |
| **Separate eastern farm pond** | Distinct maintained rural watering edge, small sheltered reed pockets and a visible dry livestock approach | **Low–medium**; it is not another millpond or a miniature Marches |

Density levels are relative composition classes, **not fixed prop counts**. Shoreline quality should be achieved through a better land/water contour and meaningful clusters even if the total number of objects remains similar.

## 5. Western working mill: finished architectural design sheet

### 5.1 Identity and massing

This Greenwood structure is an **existing water-powered working mill with a visible wheel**, not a new tall sail-driven windmill; separate Strategist future windmill production should not be attached to it through naming alone.

**Chosen form:** one compact, recognizably substantial **two-storey timber-dominant mill house on a continuous masonry/stone lower foundation**, with an orderly pitched roof and an integrated wheel bay beside the actual headrace. It must be larger/more consequential than a normal cottage but still belong to the same Greenwood settlement architectural family. No fantasy palace, generic barn/silo, modern colonial farmhouse or industrial factory.

- **Projection:** choose one consistent three-quarter isometric facing aligned with its actual land-side approach and wheel-side water edge. Both visible walls, front door, side wall, roof slopes, windows and wheel housing must agree on the same two ground axes and verticals.
- **Mass hierarchy:** stone plinth supports a single timber upper volume; the roof sits **on** that volume and has one continuous ridge/eaves logic; small loading/bay extension is subordinate.
- **Material hierarchy:** foundation and river-contact bearings = local muted stone; load-bearing corner posts, horizontal rails and beams = darker warm wood; wall panels/cladding = honey/brown timber in a consistent treatment; roof = a **single coherent material** and perspective; iron = small dark structural straps; glass = limited intentional windows. Not wood on one side and unexplained smooth concrete on another.
- **Facade hierarchy:** one principal **dry-side door** facing the cart/loading approach; windows placed on physically possible surfaces rather than stamped onto every triangular shape; upper wall openings narrower/subordinate to lower work entry.
- **Structural clarity:** visible posts continue to plausible bearing points; wall-to-roof junctions close; windows sit within walls and share a projection. No floating upper box, roof fragments, duplicated workshop roof embedded under the mill roof, unsupported side panel or mismatched depth.
- **Wheel relation:** the wheel is mechanically mounted to the mill's water side on a plausible horizontal axle support, partially adjacent to the wheel pit/headrace, and visually connected to the building. It must not read as a circular badge pasted against a generic house or as a wheel spinning in dry grass.
- **Functional set dressing:** dry accessible loading apron, modest stacked timber/sacks/crates/tools compatible with present props, not a new vendor/commodity/menu or interactive production mechanic. Use sparse high-quality details, not clutter.

**Current-source caution:** the existing mill graphic includes an enlarged workshop drawing plus overlaid roofs/boards/window and a separately built wheel. Engineering should **replace its architectural composition as one coherent object**, not simply increase linework or paste over apparent errors.

### 5.2 Readable side-by-side design checks

**At 150% phone scale:** the roof ridge, two wall planes, stone-to-timber boundary, entrance and wheel must be distinguishable **without zooming in to inspect polygons**. One roof silhouette, not two competing roof silhouettes. One coherent main door, not isolated dark rectangles. Architectural details may simplify at that scale, but should not collapse into a preschool-block diagram.

**At closer zoom:** reveals valid carpentry; consistent joists, eaves, shutters/lintels and stone joins. Decorative windows must be tied to actual wall directions. Stronger design is better than many tiny strokes.

**At night:** the same materials remain legible under cool ambient light. A modest warm exterior fixture makes the working access recognizable, while windows remain plausible and mostly dark unless explicitly occupied/illuminated.

### 5.3 Mill lighting and practical fixtures

- Include **one physically mounted warm lantern/sconce at the dry-side entrance/loading frontage** as the default composition. A second understated wheel-service fixture is optional only if the site needs it for readability and can be plausibly mounted; do not automatically make every facade bright.
- Attach fixtures to a real corner post, wall beam or covered entrance bracket. **Never** suspend a bright rectangular window/lantern on a roof, empty air, or pasted onto glass.
- Show a readable iron frame and glass/housing with a brighter small source and softer pool on the entrance threshold; no large glowing circle that washes water, trees and road indiscriminately.
- Let a **small localized reflection** appear on adjacent water if the actual view and lighting support it. Do not create physically inaccurate reflections extending across the whole river.
- Maintain **PR #803** fixture geometry ownership and **PR #809** nighttime palette/ambient hierarchy. The mill-specific fixture should be one coordinated addition under those contracts, not a duplicated independent renderer light.

## 6. Pond → sluice → wheel → tailrace → river: physically intelligible composition

A credible visual hydraulic chain is the design requirement, whether or not the game simulates milling output:

**Existing western pond (one real water body) → controlled intake/dam/sluice → short directed headrace or flume → wheel contact/pit → lower return channel (tailrace) → natural merger with river.**

This sentence defines **spatial continuity**, not an assertion about the as-yet-unverified exact topographic heights, water source direction, or map coordinates. Engineering must validate the actual water course and decide whether the current mill needs moving to achieve it.

### 6.1 Spatial design decisions

- **One mill pond.** Keep the existing canonical water identity and avoid painting a second unrelated decorative pool at the marker. The western pond is a purposeful impoundment; the eastern rural pond stays separate.
- **Dam/controlled bank.** A short understated raised earthen/stone retaining segment reads as human work. It interrupts a natural bank only where the intake/gate needs to exist; it is not a fortress wall around the entire shore.
- **Sluice gate.** Timber/masonry uprights and gate align with pond outlet, not a detached construction ornament on dry ground. A viewer should trace the water's route through it without reading labels.
- **Headwater feed.** The visible channel meets the wheel at a plausible contact point and is integral to the structure. Its artificial edges can be somewhat straighter than the river; tie both sides into the actual bank without gaps.
- **Return/tailrace.** A modest, continuous lower channel clearly leaves the wheel side and joins a **genuine** river bank at an oblique, flared mouth. Blend contour, dark nearshore water and bank sediment so there is no rectangle drawn across the river or a channel edge ending abruptly under a bank stripe.
- **Confluence:** the meeting of tailrace and river should be visibly one flowing surface. Avoid a blunt T-shaped blue overlay, a dry wedge where both are supposed to connect, an overlap seam, an unexplained spill beyond world/collision water, or reeds blocking the outlet.
- **Clear dry work site.** Keep entrance/loading apron and service inspection dry, reachable and visually distinct from waterways; roads must lead to actual usable access. No wheel/sluice/props across the character path.
- **Scale:** waterwheel, house, bridge, hero and channel widths should feel related; the wheel cannot be tiny decoration or so huge that it swallows a two-storey house. Test in actual screen space, not only local coordinate diagrams.

### 6.2 If the current geometry cannot support the chain

Do **not** fake continuity through paint or invent elevation physics. Because the regional rebuild explicitly permits changes to geography, move/reorient the mill and bounded mill-water shapes **as one site design**, with a saved-state-safe, collision-consistent approach; alternatively choose a shorter physically credible routing within existing constraints. Keep the same named pond, mill identity, wheel concept, existing player functions and protected state.

**Reject:** channel ending behind a bank polygon; sluice and wheel disconnected; two water polygons on top of each other with visible seams; water flowing “uphill” according to a chosen artistically implied slope; an unreachable mill door; a wheel painted on a wall unrelated to water.

## 7. River and crossings are one composition

The two crossing **functions** remain: northern maintained stone freight crossing, southern narrower timber pedestrian/pack footbridge. Do not copy a bridge geometry patch into this design branch. Coordinate with **PR #807**:
- North bridge has a deliberate compact stone abutment and subtly flared road transition; its deck is proportional to the main cart road, with uninterrupted traversal. The surrounding banks should be trimmed near the approach and naturally vegetated beyond it.
- South bridge has a quieter woodland threshold and continuous footpath-to-deck transition; plant small groundcover behind rather than across the landing. The bridge must not be a broad “floating table” in the river.
- **At each abutment:** water runs under the bridge; land shoulders connect cleanly into foundation material; surface/shoulder paint does not create dark seams, triangular grass cuts, or phantom ramps. Posts/parapets project where supported by perspective.
- Bridges do not erase the natural bank shape, produce artificial fords, place plants in deck collision or alter the existing map/discovery functionality.
- Any revised river line must update the barrier, bridge opening and approaches as a consistent topology; no geometry from an older PR can be applied blindly after a river redesign.

## 8. Scene composition and environmental storytelling

### Scene plate G-M01 — The mill from the land approach

**Primary silhouette:** complete two-storey timber-on-stone mill; roof and entrance clearly face the player.  
**Secondary:** contained wheel and recognizable water feed on its side; loading apron and cart-side access.  
**Tertiary:** one measured lantern, tools, stacked supplies, understated shrubs outside access line.  
**Veto:** visually ruined/unfinished house, window on roof angle, wheel on dry land, clutter hiding entry, decorative pool.

### Scene plate G-M02 — The pond and controlled outlet

**Primary silhouette:** single actual pond, visible retained bank, short dam/gate.  
**Secondary:** headrace passes to wheel; water darkens smoothly at constrained outlet.  
**Tertiary:** selective damp vegetation away from flow.  
**Veto:** disconnected round pond/wheel, floating gate, arbitrary rectangles, duplicated water.

### Scene plate G-M03 — Tailrace joins the natural river

**Primary silhouette:** organic riverbend with oblique merging channel.  
**Secondary:** one continuous water surface, gradually blended earth/stone bank, limited local turbulence.  
**Tertiary:** grasses rooted above contact line; perhaps a sheltered cluster away from outlet.  
**Veto:** cut-paper seam, channel ending on grass, overlapping blue layers, permanent triangular shoreline stamps.

### Scene plate G-R01 — Main freight bridge

**Primary silhouette:** proportional stone deck and proper two-bank landings.  
**Secondary:** natural bank curves and low open margin at approach.  
**Tertiary:** a few bushes/trees positioned off traffic, river visible between banks.  
**Veto:** extremely oversized platform, abrupt road paint, plants blocking deck, river border visible through abutment.

### Scene plate G-R02 — Ordinary rural river reach

**Primary silhouette:** long river curve, opposite banks visibly different.  
**Secondary:** one bank's woodland shadow versus the other's meadow/sediment opening.  
**Tertiary:** irregular grasses and low shrubs without repeated stamps.  
**Veto:** featureless grass strip, rhythmic identical triangles, every bank covered by reeds.

### Scene plate G-R03 — Southern footbridge and wooded banks

**Primary silhouette:** light timber span and legible approach.  
**Secondary:** layered hardwood tree line, ferns and roots set back from walking route.  
**Tertiary:** small unlit natural river highlights at night, subtle soil contrast.  
**Veto:** wooden platform broader than intended route, crowded actors under trees, obscured destination marker.

### Scene plate G-R04 — Separate eastern farm pond

**Primary silhouette:** calm accessible farm-water edge, independent from mill.  
**Secondary:** believable dry animal/human approach and sheltered low vegetation.  
**Tertiary:** adjacent pastoral visual grammar from #808.  
**Veto:** identical millpond duplication, swamp-coastal look, animals concealed by foliage or trapped by collision.

**Across every plate:** the hero and companions must be able to walk, fight, navigate and see the scene; the artistry cannot override actual usability.

## 9. Style, materials and color continuity

**Scale/style:** use SIBDLP's established procedural-art canon and approved original masters as starting identity, while authorizing a **real redesign of defective architecture and terrain**. Strong silhouettes, stylized illustrative forms and readable materials; not generic glossy 3D, photorealism, all-new AI scenery, or microscopic texture that only works in a cropped screenshot. Do not interpret “preserve canon” as “preserve obvious bad polygons.”

**Greenwood palette:** mature-summer fresh greens and dark leafy shadows; honey and weathered brown timbers; muted local stone; occasional exposed red-brown clay; subdued blue-green water. No total orange soil recolor or Flooded Marches greenish swamp water everywhere. For night use the independently approved low-chroma slate direction from #809, keeping natural night terrain and warm fixtures separate.

**Art-budget discipline:** focus on meaningful replacement of repeated triangles and incoherent elements; favor static/cached, seeded scenery and reusable material pieces. Avoid per-frame random vegetation, large new GPU textures, new simulated physical water systems, full-screen dynamic blur or hundreds of high-cost live plants. Any new source assets must pass the established provenance, offline/portable and renderer-fallback rules.

## 10. Engineering handoff sequence — scoped and safe

This is the **design department's selected solution**. The stages below are implementation requirements for a separate future authorized engineering effort; **none has been executed by this design PR**.

**E0. Pin real current source and capture the factual baseline.** Record branch SHA, game version, chosen actual renderer, fresh v4 scene and representative old 2,700/3,200-source saves. Native daylight/dusk/night screenshots at 150% camera from every named plate. Capture full mill close-up and real coordinate/collision overlay, determine current flow direction and inspect true bank/water line. Recheck upstream PRs #807–#809 and #803.

**E1. Author one whole-site mill/water layout.** Draw/build a correctly oriented building–wheel–pond–sluice–headrace–tailrace–river site plan before creating individual props. If geographically impossible, propose an actual relocation within the region rebuild rather than disguise with paint. Show dry door, loading and road reach.

**E2. Repair the natural river and edges.** Remove the 58-unit sawtooth motif; rebuild contour, transition/material bands and surface-flow grammar. Share exactly one collision/visual bank source where required. Reconcile bridge abutments with #807. Run minimum native geometry/path checks before vegetation.

**E3. Replace mill building presentation as one complete visual.** Fix facade, roof, windows, stone/timber identity and integrated wheel. Add fixtures in coordination with #803. Avoid reusing the uncorrected workshop body beneath new incompatible mill overlays.

**E4. Compose region-specific shoreline growth and nighttime balance.** Integrate #808 botanical families and #809 palette/light treatment. Use bounded authored clusters/seeded ground composition, not a new animation or material-gathering mechanic. Review daylight and night in identical camera/clock positions.

**E5. Focused design/technical acceptance.** Produce before/after contact sheets and plan overlays for G-M01–03/G-R01–04, both renderers, normal camera/short landscape phone, and a useful desktop overview. Walk actual hero+companions through mill front, both bank approaches and both bridge crossings. Verify combat visibility, navigation, collision-water coincidence, original saves/structures, performance and exact scoped tests. Record what passed versus needs physical iPhone verification. Do not launch a comprehensive suite, merge, or deploy without separate authorization.

**Dependencies:** Coordinate ordering with #807 before freezing bank/bridge geometry, #808 before botanical placement, #803 before lantern fixtures and #809 before nighttime values. Resolve if newer main or other branches already implement related changes: source can advance after this documentation snapshot. Work on a separate implementation PR, not this design PR.

## 11. Design acceptance matrix — GO only when all relevant scenes pass

| Gate | Required observable result | Reject if |
| --- | --- | --- |
| **A01 River contour** | Curves are broad, intentional, asymmetrical; no periodic pointed teeth | River still resembles notched blue tape |
| **A02 Land/water meeting** | Visible variable damp-earth/root/sediment/wet-line transition | Continuous thin pale line or abrupt blue cutout |
| **A03 Flow** | Local streak direction reads with watercourse; no obvious paint seam | Uniform diagonal dashes and conflicting confluence currents |
| **A04 Bank variety** | Maintained, open, cultivated, wooded stretches read differently | Copy-pasted reeds/trees or empty uniform borders |
| **A05 Greenwood identity** | Summer temperate hardwood riparian ecology distinct from Marches | Mangrove/salt-marsh treatment or alien biome palette |
| **A06 Mill architecture** | Coherent 3D/isometric massing with correct roof, wall, window and foundation joins | Two incompatible roofs, unsupported windows or mixed facades |
| **A07 Mill craftsmanship** | Timber, stone, roof and iron visually intentional at 150% phone scale | Still reads as unrelated stacked geometric primitives |
| **A08 Hydraulic chain** | Pond, gate, wheel, visible directed water and river merger form one traceable composition | Duplicate pool, false feed, water painted over ground |
| **A09 Mill frontage** | Dry entrance/loading and road approach are legible, accessible and free of clutter | Work site blocked or mill visually isolated |
| **A10 Crossings** | Bank, bridge foundations and roads actually meet with proportional north/south distinction | Deck floats, paint overlaps or bridge access mismatches |
| **A11 Lighting** | One/two genuine modest mounted fixtures, sensible night water/material contrast | Fake roof lamp, green night filter, unsupported glow |
| **A12 Game clarity** | Actor/party, enemies, telegraphs, objects and routes remain clear on phone | Canopies/shrubs obscure combat, interactions or controls |
| **A13 Source integrity** | True legal water/collision agreement and existing quest/transport/save identifiers persist | Water visual crosses illegal/false collision boundary or save migration breaks |
| **A14 Renderer/performance** | Canvas and Pixi tell the same scene story under focused budget and offline assets | One renderer loses plants/water/light or introduces severe stalls |
| **A15 Regional showcase** | A stranger can distinguish the mill work site, freight bridge, pastoral reach and wooded footbridge without explanation | The world remains generic despite more decorations |

**QA examples:** Daylight screenshots cannot be approved solely because night hides angular defects. Tests passing cannot substitute for the owner's aesthetic acceptance. A beautiful static mockup cannot substitute for the actual game viewport, reachable route, real water collision, and frame-time evidence. Owner's final play judgment is an explicit later acceptance step, not evidence already obtained here.

## 12. Scope boundaries and completion statement

**Done in design:** Identified owner-observed river/architecture/hydrology/vegetation/night composition issues; traced source-supported causes including the fixed-interval triangular river teeth and nested mill graphic; selected coherent visual/architectural/material/ecology/hydraulic treatment; defined seven scene plates and fifteen review gates; reconciled ownership with contemporary draft designs; established a safe bounded engineering sequence.

**Not done:** No chosen relocation coordinates, final curve control points, water-flow engineering proof, mill art asset, 3D mesh, painting, source change, native screenshots, focused tests, real iPhone capture, GitHub merge or deployment is claimed. Those are deliberately **engineering and perceptual acceptance**, not missing design decisions. The design is a buildable contract, not a falsely certified finished scene.

**Region-first principle:** Finish Greenwood as the **quality reference** before extending environmental corrections. Transfer the *process* — honest river boundary, ecological distribution, architecture material continuity, actual hydraulic/road access, camera-scale art review and collision/parity tests — to other regions. Do **not** transfer Greenwood vegetation, Piedmont river colors or working-mill dressing to Flooded Marches, Ironroot, Ashen Frontier or Dark Crown.

## References

- docs/GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md — approved 50 decisions.
- docs/GREENWOOD_FLAGSHIP_REDESIGN_WORK_BRIEF_20261029.md — owner-directed freedom to replace old aesthetic geography; protected v4 game state.
- docs/GREENWOOD_VALE_PIEDMONT_REGIONAL_IDENTITY_DESIGN_BRIEF_20261028.md — environmental reference, subordinated to approved choices.
- docs/GREENWOOD_FLAGSHIP_WORK_HANDOFF_20261028.md — historical/dev.233 source and later implementation receipts.
- PR #807 — docs/GREENWOOD_ROADS_BRIDGES_GAME_DESIGN_20261105.md.
- PR #808 — docs/GREENWOOD_BOTANY_FARMS_LIVESTOCK_GAME_DESIGN_20261105.md.
- PR #809 — docs/GREENWOOD_DAY_NIGHT_VISUAL_DESIGN_HANDOFF_20261105.md.
- PR #803 — mounted lantern and fixture correction.
- Current main src/prototype/greenwood-landscape.js, greenwood.js, rules.js, visuals.js, renderer.js; inspect exact current main again when engineering begins.

## 13. Engineering on the SAME PR #813 — 5 November 2026 (active candidate, not accepted)

**Owner workflow direction:** Reuse the existing PR instead of creating a new pull request per correction. Engineer substantial changes and run focused verification independently. The owner can assess the final artistic result only **in the game after an authorized merge/publication**; do not pretend a mockup, documentation or headless test is the owner's visual acceptance. Deliver a high-quality candidate without routine owner homework.

**Code committed on PR #813:** 
- `src/prototype/visuals.js`: Greenwood-only graded bank ribbons and irregular planted edge groups in place of the fixed 58-unit sawtooth along the natural river. Other regions retain their existing bank painter. River glints now follow Greenwood's local channel centerline. Greenwood's composed wetland water surfaces are painted **in coherent layers** — all rims, then all connected waters — so a later headrace/pond polygon does not cover a previous water surface with an unwanted bank stripe. Existing geography/collision geometry stays authoritative.
- `src/prototype/greenwood-landscape.js`: repaint the actual live `greenwoodFacility: 'mill'` from one coherent timber-on-stone two-storey three-quarter structure, with a single pitched roof, wall-specific windows, loading entrance, physically associated wheel and a mounted lantern. The actual live `greenwoodFacility: 'weir'` receives a revised masonry/timber gate. No changes to camp/actor IDs, production mechanics, quest rewards or save formats.
- `src/prototype/renderer.js`, `src/prototype/visuals.js`, `tools/webgl-pilot/pixi-scene-bridge.js`: actual nighttime mill lamp source is anchored to the same physical facade position and is shared through Canvas and Pixi's existing lighting route. Coordinate any later merge with independently active mounted-fixture PR #803.
- `tests/greenwood-mill-river-visual.test.cjs`: a focused deterministic native render, legal bank/water relation, renderer stroke-contract and gameplay-state immutability smoke.
- `sw.js`: generated offline asset fingerprints refreshed for the affected changed sources (without a version bump or release claim).

**Safety contract:** The bank shape in collision, river barriers, crossing gaps, authored pond/headrace/tailrace polygons and site identifiers are not changed in this visual pass. River water and channel functions remain tied to the existing live Greenwood world. Any later topological remapping requires measured routes and save migration, and must not be inferred from this visual update alone. The waterwheel does not introduce new craft/Acid Bottle gameplay.

**Validation state:** Source files were checked with a JavaScript parser in the engineering session. Exact-head GitHub focused CI, reproducible build and narrow native visuals tests are being reconciled. An early **older-head** PR browser workflow failed only because `sw.js` source fingerprints were stale; the correction was committed on the same draft branch. That old failure is **not** retroactively a pass. Do not call the new head tested until its actual runs succeed. No direct iPhone/browser image review or performance benchmark has been performed as of this entry.

**Remaining before merge-ready:**
1. Finish the exact-head focused native and CI/build run, investigate all relevant failures and refresh affected build outputs if needed.
2. Inspect actual-game camera-sized before/after Greenwood river and mill screenshot evidence, daylight and night, including Canvas/Pixi placement and the upstream lantern/road/botanical branch interaction. Fix obvious architectural or water continuity failures rather than sending owner an unready prototype.
3. Check current upstream changes and all preserved movement, crossing, v4 save/restore, renderer fallback and CPU budget boundaries.
4. Prepare one concise owner-review handoff and request separate merge/deployment authorization; only after publishing can the owner evaluate the genuine phone experience. Do not assert the owner has accepted it in advance.

**Scope:** Same draft PR #813, no additional PR or issue needed for this work, no full-suite authorization, no merge and no Pages release.

## 14. Mainline reconciliation: native fixture system

The newly merged settlement-night-lighting work superseded the interim `mill-sconce` path described in Section 13. The integration adopts the **single shared `PrototypeVisuals.lightingFixtures()` catalog** with one physically attached mill glass location `(-8,-48)` and `kind:'lantern', fixture:'glass'` Canvas/Pixi contract. Previously drafted custom `renderer.js` and Pixi light-path changes are intentionally discarded to preserve all newer upstream fixes. The Greenwood-only shoreline, connected-water and mill architectural art remain the scope of this candidate.

This is an integration of main source at `82d9e7cdb267ad0cceed805f5690643d2095f213`; it is not a live gameplay release. Exact-head focused tests and actual camera-scale visual review are required before merge readiness. Owner aesthetic acceptance comes only after a separately authorized public release.
