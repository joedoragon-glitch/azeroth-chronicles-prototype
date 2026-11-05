# Greenwood Vale - environmental design and engineering handoff

**Current owner release direction:** Appearance will be reviewed by Joel in the deployed game. Automated visual approval is not a release gate. Rendering slowdown remains documented for a separate owner-led chat and is outside this environment workflow. Merge/publication is authorized after bounded functional/build verification.

**Live-main reconciliation:** Watermill #814 merged as `b6193a9b` during release preparation. This candidate now incorporates that actual main tree, including the corrected live doorway, shallow creek/culvert, millrace bridge, 19 route ordering, 100/80 strategic crossings and its canonical-art registration reconciliation. Combined environment release version is dev.263; earlier dev.262 images/checkpoints below remain correctly labeled historical evidence. No performance tuning or further automated visual acceptance work is included.

**So I Became the Dark Lord's Problem (SIBDLP) | 5 November 2026**

**5 November 2026 — Roof-only artistic refinement candidate (Priority 1):** The owner's direct in-game audit identifies poorly joined roof/gable geometry at Scornfang's occupied agricultural Treasury and Thornfang's reused granary home. The isolated draft `art/greenwood-treasury-homestead-roofs-20261105` replaces independently drifting roof-corner polygons with paired planar slopes sharing an exact front/rear ridge and a single consistent building-depth projection. Both front fascias now meet their existing gables; shingle courses follow the same projection. Existing openings, security fittings, crop/storage identity, lighting anchors, yards, stage-2 rest shelter, interactions, collision, routes, save IDs and gameplay are unchanged. The scope is **Priority 1 only**; subsequent correction of Thornfang's secondary shelter and both yards is not claimed. This is an unmerged/unpublished visual candidate pending focused native/CI review and the owner's eventual appearance judgment, not a statement that appearance has already been accepted. See [draft PR #832](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/832) for the exact test and commit evidence.

**Controlling continuation for PR #828.** Design coverage E01-E17 and the active engineering checkpoint are maintained here. Candidate implementation is authorized; owner appearance acceptance, merge, deployment and device verification are distinct statuses.

**5 November 2026 — Single-PR artistic workstream, Priorities 1–4:** Following the owner's direct instruction to keep the work together, [draft PR #832](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/832) now owns the complete two-structure refinement. Priority 1 gives both main roofs a single consistent ridge, eaves and fascia. Priority 2 replaces the oversized enclosed-looking wolf rest bay with a lower open-sided four-post shelter and visible dry bedding. Priority 3 groups existing scout equipment/training elements by the homestead courtyard and brings Scornfang's existing ledger/barrel into a single secondary work edge through an idempotent, collision/ownership-guarded visual migration; no new currency, storage, NPC, entrance or quests. Priority 4 replaces broad generic prop shadows with small native post contacts, restrains Treasury yard shadows and tidies the loading apron. These remain **candidate code**, not visually accepted or device-verified. Keep same stable entity IDs and game mechanics. Actual source/CI review must establish a valid release candidate; no merge or deployment is implied.

## Active engineering checkpoint - 5 November 2026 / dev.262

Owner has authorized staged engineering in existing #828. Current main `e25ad8e8` is already an ancestor. Implementation is complete as a procedural candidate; final browser/Pixi scene review and current-head CI/performance disposition remain open. No merge, deployment, device verification or owner aesthetic acceptance is claimed.

[Engineering coverage, native images, occupied-site inventory, checks and mill compatibility](evidence/greenwood-owner-environment-20261105/README.md) is the current status record. The earlier design tables and historical checkpoints below retain their provenance, not their old implementation status.

Implemented: compact appropriated Thornfang granary and reorganized rest yard, one existing Crown standard, appropriated Scornfang agricultural storehouse, two credible Goblin shelters within an expanded connected stockade, native functional defensive traps, occupied-site lighting across 19 outdoor/interior zones, restrained public anchors, cached organic ground detail, coherent road material and continuous merchant departure, and one actual-wall protection predicate with the existing 160-unit margin.

Source implementation checkpoint `85ffe148` was locally combined with watermill source `3562d4d6`. Original mill, road and environment tests passed, followed by the original Thornfang/Mira patrol test's full 18 seeded class/mode cases. #814's latest `755578d8` differs only in four documentation files; its runtime is unchanged. Preserve its shallow northern creek, culvert, genuine millrace bridge, appended service routes and 80-unit southern crossing when integrating. #828 itself retains current main's 100/56 crossing geometry; the patrol failure on unchanged main is resolved by #814's tested 80-unit fix in the combined candidate. Do not introduce a competing river/bridge implementation here.

Last remote checkpoint `b502360f` passed PWA, retained contour and road/bridge captures. Its focused test failed the stale lodge-radius assertion, corrected and passed locally. Its paired performance run `42062168808` reports a replicated one-actor p95 draw regression (2.5 ms baseline vs 4.7/5.1 ms candidate), while the 8/24/48 actor comparisons passed. This is a relevant open performance hold, not a baseline-dispersion dismissal. The refined cached candidate must be measured before readiness. Independent visual, documentation and compatibility work continues while CI runs.

## Start here

Continue on existing **#828**, branch `fix/greenwood-owner-visual-review-20261105`. Do not create another environmental PR. It already contains the original chat's first corrections and this handoff. Use #825 only as a source of selectively reviewed candidates; do not merge that whole branch into this one. Keep the isolated fort correction in #826 as the preferred engineering source, subject to comparison with #827 and final wall-distance tests. One final implementation of each shared system must survive.

The intended player experience: Greenwood is a quiet, inhabited working valley. Buildings fit their occupants; defenses fit real walls and approaches; roads connect places using related earth materials; nighttime activity has physical light sources; the ground has restrained organic detail. Preserve mature-summer Piedmont identity, the working mill, original characters, quests, recovery economy, four current classes and historical v4 saves.

**Evidence used:** all ten pages and embedded screenshots of Joel's attached *Goblin Camp Improvements* export; [originating conversation](https://chatgpt.com/g/g-p-6ac48220a7988191b16000c23466d378-sibdlp/c/6aec7ea6-f070-83ea-9f69-19f6a7712262); live PR metadata, relevant source and existing workflow logs. Screenshot pages are visual defect references, never candidate screenshots. Exported assistant claims are not independently accepted design or test evidence.

**Additional recovered direction:** Joel's 5 November 13:27:20 UTC message requested sensible public lamps in populated areas while retaining rural darkness. This is recovered conversation context; it is absent from the PDF's direct user text. **Current owner clarification in this takeover:** Thornfang's main house is excessively large relative to other game houses; reconcile its proportions while developing the courtyard and associated spaces made available, and repair the unfinished/poorly implemented design. This is now an explicit required correction (E16), superseding the earlier evidence gap.

## 1. Complete feedback coverage

Status abbreviations below refer to inspected code candidates, not a released fix. All acceptance remains open unless explicitly stated.

| ID | Owner feedback and source | Design decision | Existing candidate / remaining acceptance |
| --- | --- | --- | --- |
| E01 | Palisade shadows unrelated to structure; pp.1-3,7 | Remove generic wall-center ovals; use restrained footing tied to actual posts/segments | #828 and #825 candidates; inspect Goblin, Treasury and Watch walls |
| E02 | Disproportionate flower/small-plant shadows; p.3 | Ground small stems locally; no plant-sized black puddles | #828/#825 candidates; compare wildflowers, shrubs and tree roots |
| E03 | Flat cultivated soil casts shadows; p.5 | Soil stays flush; only raised plants, stones and actual edging ground themselves | #828/#825 candidates; household plots and larger fields |
| E04 | Day/night shadow consistency; p.5 | Separate small contact grounding from directional cast shading; attenuate cast shading with existing light cycle | #828/#825 candidates; night and both transitions unaccepted |
| E05 | Two undersized Goblin shelters; expand fort if needed; pp.1-2 | Two credible domestic shelters around an open working courtyard; resize the enclosure as one layout | #825 incomplete/defective candidate; layout and migration required |
| E06 | Outdoor traps nearly absent; place where defensively useful; p.2 | Small, avoidable trap pockets at defended flanks and approaches; native trap lifecycle | No completed additional-trap implementation established |
| E07 | All enemy-occupied locations, including interiors, need sensible light; p.2 | Audit all five regions; use habitation/work/security roles and biome-appropriate fixtures | Full site inventory and corrections outstanding; not Greenwood-only |
| E08 | Sawtooth curves; pp.5-6 | Continuous road edges and clean joins/end caps | #828 candidate over merged #824; native screenshots still need review |
| E09 | Thin road abruptly differs from red-earth main road; p.8 | Same muted clay/earth family; distinguish use through width, wear and vegetation | #828/#825 candidates; do not recolor all wilderness or other regions |
| E10 | Artificial, flat procedural ground; p.6 | Layer broad organic variation, sparse material detail and use-related transitions | #825 grain candidate needs source/runtime repair and art review |
| E11 | Treasury looks like a recycled cottage; p.7 | Appropriated agricultural storehouse/granary adapted for secure storage, receiving and accounting | #825 candidate, not accepted; preserve Treasury gameplay |
| E12 | Wagon road ends before map boundary; p.8 | Visible departure corridor continues beyond wagon toward eastern boundary | #828 render-only candidate; preserve route identity and transport interaction |
| E13 | Trade is hard to perceive; keep region quiet/rural; p.8 | Compose existing production, collection and shipment scenes; no new trade simulation | Broader scene audit outstanding |
| E14 | Skeleton defenders lose protection near walls; p.9 | Actual enclosed wall footprint plus existing 160-unit exterior distance, once | #826/#827 isolated candidates; #828/#825 duplicate implementations to reconcile |
| E15 | More public lamps in sensible populated places; recovered message | A few role-based public light anchors, separated by genuinely dark countryside | #825 placement candidates; attempted placements are not proof of coverage |
| E17 | Current owner addition: reuse the Dark Crown standard to reinforce authority | One existing Crown standard at the appropriated farmstead entrance; section 4a | Design addition only; native placement/visibility pending |
| E16 | Thornfang house humongously large against other houses; use freed space for richer courtyard/associated areas; unfinished execution; explicit owner clarification in takeover | Reduce and redraw main lodge to regional domestic scale; redistribute functions around a finished useful yard | Required follow-up to merged #820 / issue #806; not completed by the previous roof patch |

**Related scope:** bridge-deck generic-shadow removal is a closely related source finding, also visible on p.7; include it with E01-E04. E16 is a mandatory scale, yard and finish correction, rather than permission to discard Thornfang's wolf identity or #820's dry homestead site and Mira/patrol continuity.

## 2. GitHub reconciliation and actual evidence

Repository: `joedoragon-glitch/azeroth-chronicles-prototype`. Inspected main: `e25ad8e800f385a8c5591a8373edb04c2f85a1b8` (#824 merged). The main development ledger still describes #824 as a candidate; live merged metadata overrides that stale status. Publication of that merge was not independently verified in this design pass.

| Record | Inspected head / state | Disposition |
| --- | --- | --- |
| #828 original-chat corrective PR | `a4b5a8f46f2794bd0a715c7c05ca06a6940df5b4`; open draft | Main continuation and single environmental handoff. This design commit follows that code head |
| #825 broader environment PR | `9271bfbbda3b97e0c1e698199fe8ea9e8593296b`; open draft | Donor only: inspect Treasury art, terrain and public lighting individually. Shelter migration is defective. No blanket merge |
| #826 isolated actual-wall fix | `5911577b8860bb31a9a56324fa556eb3292000e4`; open draft | Preferred narrow source for fort correction, since its reported native/PWA checks are verified green |
| #827 second actual-wall fix | `5f2eecdf996be721ed1c1f500b0acbad326670f2`; open draft | Alternative source; its focused and PWA runs also green. Compare rather than stacking either implementation |
| #819 old +40 proposal | `0e5f0e01e094f8f342959c8857d77f79966b1fad`; open draft | Preserve history; do not import its obsolete 40-only rule or add another margin |
| #824 roads/bridges; #820 homestead; #821 fixtures | Merged, verified by live PR metadata | Baseline to preserve. Earlier provisional visual reviews do not cancel newer owner feedback |
| #814 watermill continuation | Independent active draft | Coordinate shared landscape/visuals files; preserve its appended-route strategy and merged mill system |
| #545 / #806 | Existing regional epic / homestead issue | Existing navigation records, not newly created tickets for this exported chat |

Targeted searches found no dedicated issue for this full environmental feedback set. #825/#828 themselves already track it; do not manufacture a new issue per defect. Preserve all branches and PR history until integrated coverage is proved; no closure is performed in this design stage.

### Inspected checks, not inferred success

- **#828:** [focused run 42040222688](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42040222688) failed `tests/sprite-scope.test.cjs`: source-only evidence drift for `renderer.js`. Scope enumeration still matched. Engineering must review the art/code diff before refreshing current evidence, retaining historical receipts.
- **#828:** [paired draw-cost run 42040222768](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42040222768) returned HOLD because the **eight-actor baseline p95 dispersion was too large to certify**. One-actor baseline tail also warned. This is not proof of a candidate regression or phone FPS.
- **#828:** PWA [42040222713](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42040222713), retained contour [42040223193](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42040223193), and targeted road/bridge capture [42040222818](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42040222818) succeeded. Their generated scene artifacts were not downloaded/visually accepted in this design pass.
- **#825:** [focused run 42042517160](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42042517160) failed five checks: environment-quality, sprites and terrain-effects report `ReferenceError: R is not defined`; runtime-workload fails an assertion; town-street-audit reports **vale road crosses collision geometry**. Performance, PWA and targeted road/bridge runs also failed at that inspected head. Their individual causes beyond these inspected focused logs remain unclassified.
- **#825 source defect:** `greenwoodEnvironmentFinish()` has two consecutive guards on `greenwoodGoblinShelterVersion !== 1`. The first scales walls 1.14 and sets version 1; consequently the second block, which replaces/flags the two shelters and proposes another wall scale, cannot execute. Treat the shelter-completion claim as contradicted by source, not as a delivered design.
- **#826:** focused [42039549377](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42039549377) and PWA [42039549885](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42039549885) succeeded.
- **#827:** focused [42039647991](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42039647991) and PWA [42039648248](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42039648248) succeeded.

These are workflow results associated with the inspected source heads. Some workflows execute GitHub's synthetic merge candidate; #828's timing log identifies `194d76fe3dbd2c6fe2eb9879359abce4f015c4f2`. Preserve tested SHA/base/harness relationships. Later source integration requires new applicable evidence, not relabeling these runs.

## 3. Shadows: physical grounding with restrained cost

Use one shared eligibility/strength policy across Canvas fallback and Pixi primary renderer. E01-E04 apply to the affected shared object categories wherever they occur in the game, not only the supplied Greenwood views. Check representative instances in other regions/interiors when they use the same policy; this does not authorize restyling their regional architecture or palette. The owner's repeated fence example beside Thornfang's private homestead is an explicit acceptance scene alongside Goblin Fort, Treasury and Skeleton Watch.

| Surface/object | Intended treatment | Reject |
| --- | --- | --- |
| Bare soil, cultivated bed, road, flush bridge marker | No detached cast/contact oval | Soil or deck appears to float |
| Flower stems, groundcover | At most a very faint local root contact | Dark disk wider than the entire clump |
| Bush, tree, upright prop | Contact follows occupied base; existing art can supply broader canopy/body shading | Double-painted raster/procedural grounding |
| Palisade/stone segment | Narrow irregular foot contact along actual base/posts | Repeated center ellipses or upward black fins |
| Shelter/roof | Grounding under posts, eaves and footprint consistent with existing art | Generic bubble displaced through a wall or doorway |

Contact grounding is local darkening where things meet; cast shadow implies a light direction and an obstructing object. Keep this distinction at night. Directional daylight shading fades with the existing cycle; small contact grounding may remain for depth. Moonlight uses the existing approved cool nighttime palette. Nearby lanterns add local light without requiring moving per-object shadow simulation. Do not reverse all shading to fake a new sun path or turn on ambient black ovals at dusk.

Engineering first removes false shadows, then adds only geometry-supported footing that materially improves the scene. Check post bases and plant roots in daylight, full night, dawn and dusk; compare at the same camera/time. Do not introduce a new lighting engine.

## 4. Goblin Road Fort: two shelters and a usable compound

**Visual brief:** an improvised but maintained timber stockade inhabited by working goblins. Two weathered canvas/timber shelters, each big enough for the adjacent goblin to use; low bedding, a shared cookfire, limited storage and a clear central work/social space. No human cottage substitutions or tiny tent icons beneath giant roofs.

At the existing 150% camera, compare against an ordinary goblin's body excluding weapon, ears and nameplate. Initial art targets: shelter opening at least 1.2 body heights and 1.3 body widths; each shelter roughly 2.5-3.5 body widths across, with enough visible depth for bedding. These are designer starting ratios, not new collision dimensions or a claim current art meets them. Also compare both shelters against the camp's canopy, work/game table, stored goods and palisade height at the same camera: correct their relative material thickness, roof height and footprint so the entire compound reads at one physical scale. A shelter that fits a goblin but still looks miniature beside its neighboring assets fails E05. Roofs remain below nearby mature-tree canopies. Use distinct wear/bed arrangements to avoid identical stamped shelters.

**Composition:** keep the east entrance and approach recognizable. Put the shelters along the rear/north side with openings toward the courtyard. Place cookfire off the circulation line, provisions beside the sheltered wall, game/work table at a courtyard edge. Keep the tribute interaction clearly visible and reachable. The center must remain readable during a fight, not fill with barrels.

**Layout sequence:** measure actual rendered shelter footprints, place the two roofs with breathing room, reserve the gate-to-yard-to-tribute route, then fit the joined irregular palisade around this layout. Start expansion to north/west and modestly south where clear; protect nearby roads, map edge and ecology. Existing anchor is approximately (350,2820) on the 3200 layout, so uniform scaling is not a design solution. Keep shared wall endpoints, stable wall IDs and the east gate gap. Engineering may adjust individual corners to fit, recording final coordinates.

Reserve a clear route at least the current approach's usable width and sufficient inflated clearance for the actual hero/party collision radii. Roof overhangs cannot hide the gate, hazards or tribute prompt. Decide solid post/body collision from visible structure; do not make all larger shelters walk-through merely to pass route tests.

Update wall collision, enemy homes/return positions, any site props and cached fort boundaries together. For saved campaigns, apply one additive versioned migration once; preserve defeated enemies, depleted tribute, hero/party state and player-built parcels. Handle partial prior candidate migrations explicitly, including a version-1 wall update without shelters. Repeated restore must not expand the walls again.

**Acceptance:** both shelters read as usable next to their residents; connected walls and gate remain coherent; hero plus party can enter, reach tribute, circulate and exit; enemy returns do not lodge inside new art/collision. Test fresh and restored worlds, not just counts of two props.

## 4a. Thornfang homestead: proportional lodge, richer courtyard (E16)

**Owner requirement:** the house itself is ridiculously oversized compared with other houses in the game. Being a large dog does not justify its current monumental scale. Reconcile the main house, make effective use of the freed space in the courtyard and associated areas, and finish the design properly. This explicit clarification supersedes the initial handoff's optional/inherited classification.

**Design:** a comfortable, substantial wolf-scout home within the same domestic scale as Greenwood cottages. Retain an open wolf-usable mouth, dry bedding, timber/stone regional materials, practical porch light and an identifiable personal work yard. Reduce the dominant main-roof mass; distribute supporting functions into lower, visually subordinate elements. The whole parcel stays spacious; the main house stops consuming it.

**Scale study:** capture a Millhaven cottage, an Orchard cottage and Thornfang's body/lodge at the same 150% camera and projection. Compare roof span, ridge height, wall mass and usable opening, excluding shadows/nameplates. Start the redrawn lodge around 1.15-1.35 times the median cottage's visible roof span, with ridge height close to cottage scale. These are proposed design targets, not owner-approved numerical limits. Fit Thornfang's actual body, turning/resting allowance and clear opening; if that needs extra room, add modest horizontal depth rather than a towering roof or simply reverting to the oversized mass. Record final measured ratios and a native comparison. Do not blindly shrink the current entire drawable: that also shrinks the entrance, bedding, beams and lantern into unusable miniatures.

**Use the space gained:**

| Area | Purpose and treatment |
| --- | --- |
| Main lodge frontage | Clear entry and low dry threshold; direct path from the approach to open bedding space |
| Open central courtyard | Actual breathing and turning space, with room for the large body and visitors/party; preserve an uninterrupted circulation route |
| Lower rest bay | Reuse/refine the existing secondary sheltered rest area; lower ridge than main lodge, visible bedding, no second giant house |
| Scout/work edge | Group existing gear rack, training posts and modest covered equipment storage beside the yard, not across it |
| Domestic service edge | Water vessel, food preparation and a small wood/store grouping where appropriate; visible practical use rather than dense filler |
| Boundary and landscape | Selective low rails, ground wear and retained vegetation frame the private yard without sealing it off or recreating the retired pond |

Prefer rearranging existing homestead props to adding new structures. A small lean-to is justified only where a real uncovered function remains; the courtyard is not a mandate to fill every recovered square with decoration.

**Finish standard:** roof slopes meet a coherent ridge and closed gable/fascia; beams visibly support roofs; posts end on the ground; doorway/porch/bedding share a consistent perspective; no green seam, floating annex, disconnected rail or isolated prop. Tie the smaller building, rest bay, entrance and work/service areas together with restrained worn ground and coherent frontage. Mount the existing lantern on actual hardware and put its night pool at that fixture. Review all joins at gameplay scale, not merely a zoomed construction diagram. The previous sealed-gable patch in #820 does not by itself satisfy this broader correction.

**Engineering boundaries:** current native art is in `greenwood-landscape.js`'s `thorn-lodge` / `thorn-rest-bay` painter and existing homestead scene handler. Preserve site/prop IDs, dry parcel, saved player-built structures, already-established road access, Thornfang/Mira physical patrol and quests. Match revised solid structures to collision where applicable; avoid invisible old oversized blockers. Reconcile both fresh and old v4 homestead scenes once without resetting the region. Keep the same usable wolf opening and fixture size when reauthoring the main silhouette.

**Acceptance:** in a matched native cottage comparison, the lodge reads as a generously fitted creature home rather than an outsized landmark building; the recovered yard space visibly improves circulation and distinct domestic/work uses. Day/night Canvas/Pixi show finished joins and consistent grounding. Hero/party can approach, circulate and leave; Thornfang/Mira and save restoration remain intact. Keep issue #806 as the specific homestead source and PR #828 as this integrated correction's implementation owner.

### Latest owner direction - appropriated agricultural building and Crown authority

Thornfang came from elsewhere; his local residence should read as **an existing farm structure he has taken possession of and adapted**, rather than a grand house built expressly for him. This direction supersedes the purpose-built scout-lodge interpretation above and in the historical original commission. It does not identify a previous owner, invent a new eviction story or change his established origin, temporary southern den, patrol or Mira's situation.

**Selected design:** a modest former granary/store barn, with weathered Greenwood timber, a low fieldstone footing, practical pitched roof and broad original loading opening now used as a wolf-accessible entrance. Retain evidence of its prior agricultural purpose: shuttered ventilation, an upper storage hatch or modest loft line, repaired loading threshold and limited old storage fittings. Use an existing broad ground-level opening, not a perched silo/granary on inaccessible high stilts. It must remain comparable in scale to other regional farm/domestic structures; changing the building's label to 'barn' cannot excuse the current oversized mass.

**Adaptations reveal the new occupant:** a dry bedding alcove behind the loading opening, simple weatherproofing/low porch cover, water/food service at a yard edge, existing scout equipment grouped in a sheltered work corner, and the subordinate rest bay. Keep a recognizable original building under a small number of practical additions. No giant rebuilt manor, ornate lodge facade or miniature pet kennel. Agricultural features remain visible beside the later occupation.

**Courtyard:** repurpose the former loading/threshing apron as the central circulation space; retain worn earth and modest storage traces, then compose the rest, gear and service areas around it. Reuse the space gained by reducing the building; keep the approach and broad entry visibly open. Preserve neighboring farm ownership and livestock identities; no claim they all belong to Thornfang.

**E17 - Dark Crown standard:** place **one** recognizable existing `crown-banner` on a planted pole beside the approach/yard entrance, visible on first arrival, clear of the usable lane and roof silhouette. Reuse the established muted purple cloth, pale central emblem and timber pole from `visuals.js::flag(true)`; preserve its actual emblem rather than inventing heraldry. This is the general Crown standard, not the specialized `royal-flight-standard`. It signals authority exercised from an occupied farmstead, not a new garrison, royal residence, permanent original home or new combat buff. Maintain recognizable scale and natural cloth outline. No perimeter of banners or new flag animation is required.

**Acceptance addition:** without labels, the scene reads as an old working agricultural structure adapted for a large wolf, with a coherent reused farmyard. Compare against local cottages and agricultural assets at the same camera; preserve usable entrance/bedding dimensions while reducing the main mass. The one Crown standard is recognizable in both renderers, grounded at its pole, does not obscure the entrance or block movement, and remains identifiable by day and under restrained night illumination. Existing finished-roof, courtyard, road, save and patrol requirements remain binding.

## 5. Defensive traps: tactical pockets, safe circulation

Inventory persistent native traps first. The PDF's 'one trap' is an observation, not an established global census. For each defended outdoor site record ID, faction/role, existing actual trap IDs/types, approach, readable warning, safe bypass and current lifecycle owner.

**Goblin pilot:** target two useful pockets: one on a flank of the gate approach, one beside a tempting lateral shortcut toward guarded stores. Keep the main gate lane and tribute interaction approach avoidable and legible. Place single traps rather than a continuous minefield; reuse existing region-appropriate trap kinds and existing damage/trigger behavior. Exact coordinates come after the enlarged layout and inflated-hazard route check.

Audit Watch and other hostile strongholds/field compounds across all five regions for the same defensive logic. Do not impose an equal trap quota on every species, wilderness animal home or public road. Preserve existing designed interiors and high-density set pieces.

Traps must use real telegraph, trigger, damage and reset/disarm semantics supported by the native system. Do not invent a universal disarm interaction. Do not reuse field-mini ownership for a creature fort if that would attach unrelated clear/reward state. If needed, extend the existing trap owner with stable site IDs rather than a parallel hazard engine. Verify trigger once, warning before impact, death/reset, pause, zone reentry, defeat/clear and save/reload against the owning site's current rules; do not resurrect consumed traps on every load. Added hazards must have a bypass for hero and companions in Normal and Nightmare.

## 6. Practical lighting: global audit, local identity

Enemy allegiance is not a lighting rule. Use occupation, task, material and time.

| Site role | Fixture and composition | Darkness to retain |
| --- | --- | --- |
| Goblin residential fort | One shared hearth plus one modest gate/work lantern where necessary | Behind shelters and outside defended approaches |
| Skeleton Watch / undead post | Existing grave lamps or appropriate sentry brazier at watch/entry points | Unused ruin corners; no mandatory human kitchen |
| Treasury / freight | Mounted receiving/security lamp; task light at actual indoor records/storage work | Closed secondary fronts and unused yard edges |
| Inhabited rooms, cellar, crypt work areas | Existing torch/brazier/lantern types at occupied work, living and circulation nodes | Unused chambers and mystery outside needed routes |
| Beast/creature habitat | Existing canon-supported light only where inhabitants use/maintain it | Do not equip every wild animal den with human lamps |
| Village public space | Recognizable existing iron/glass posts at meaningful pedestrian anchors | Gaps between settlements, fields and woodland |

Start with a complete **source-generated list** of enemy-populated overworld sites, Treasury rooms, side dungeons and main dungeon occupied areas across all five regions. Engineering fills a compact audit table in this same record: `region / zone+site ID / occupied role / existing physical source / nighttime output / needed correction or justified adequate / evidence`. Unknown remains unaudited. This is a required completion record, not a claim this design pass has inspected every room. Batch inspection by region; do not make a new ticket per lamp.

At each occupied site, light entry/security and principal inhabited/work areas as appropriate. Fixture hardware is visible by day, flame originates inside the glass/brazier, and the pool centers on that source. Small sources do not flood the whole compound. Keep props/actors legible and telegraphs stronger than decorative pools; check depth/occlusion and avoid apparent light through sealed walls with existing rendering capabilities. Reuse #821's shared fixture/light contract and regional variants. Existing fires may continue through temporary depopulation under current site rules; killing the last guard must not inexplicably black out all permanent lamps. No new staffing or fuel simulation.

**Greenwood public anchors:** Millhaven refuge/square, market frontage, inhabited southern village junction, Orchard Hamlet's central approach, and northern freight-bridge approach if not already adequately lit. Count existing coverage first; co-located anchors can share one lamp. Aim for 4-6 meaningful covered anchors total, not 4-6 mandatory additional props. Add an outer freight/departure light only if its existing wagon/work lamp fails the role. Preserve actual dark intervals. Resolve placement rejection with a nearby safe alternative or documented equivalent coverage; 'attempted seven placements' cannot satisfy the design.

## 7. Treasury architecture: an appropriated farm storehouse (E11)

**Latest owner direction:** Scornfang has taken possession of an existing agricultural structure to establish his Treasury and workplace. As with Thornfang's local home, show appropriation and adaptation, rather than a new purpose-built institution. This supersedes the earlier purpose-built counting-house direction in this record and its asset handoff.

**Selected building:** an existing farm storehouse/granary with a practical broad loading frontage, weathered timber frame, low fieldstone base, patched Greenwood shingle roof, shuttered storage vents and a modest upper hay/grain hatch. The broad opening and loading apron come from the agricultural building's original use. Keep a recognizable older structure under its later modifications; no recycled domestic cottage or oversized monumental bank.

**Scornfang's adaptations:** reinforce the existing main door with restrained iron straps and a lock; secure appropriate storage openings; fit a small protected counting/records station beside the receiving frontage; use the existing bay or a modest subordinate storage annex for sorted goods. Weights, ledgers, organized salvage and guarded stores explain the new function. A short receiving canopy is acceptable where structurally supported, but it must not disguise the agricultural origin behind a wholly new facade.

**Yard:** reuse the former loading/farm work apron for unloading, sorting and accounting. Group a cart and limited goods beside the receiving lane, keep guard positions purposeful, and retain a clear approach to the existing entrance. Preserve a few agricultural traces at appropriate edges without confusing current Treasury cargo with new collectible resources. Compose the whole building and working yard together.

The two appropriated sites remain distinct: Thornfang's changes emphasize bedding, rest and scout/domestic use; Scornfang's emphasize secure storage, records, receiving and reclamation work. Shared regional materials and agricultural origins do not mean cloning one building. The owner's Crown-standard addition explicitly concerns Thornfang's homestead; do not silently mandate a second banner here.

**Canon and engineering boundaries:** keep Scornfang's established ownership and superintendent/reclamation role. Do not invent a former owner, eviction, legal deed, historical acquisition event or extra quest. Preserve `supply-vale`, the existing interior, two cache identities, captain/recovery gates, enemies, rewards and saved entry state. The old internal `boss === 'thorn'` renderer key does not authorize transferring ownership to Thornfang. Broader loading access must remain aligned with the actual entrance, collision and existing routes.

**Acceptance:** with labels hidden, the exterior reads first as a former agricultural storage building now converted into a guarded Treasury/workplace. Its loading opening, storage silhouette and old material details remain legible; reinforcement, records/weights and organized cargo communicate Scornfang's current use. It is visibly distinct from both a normal cottage and Thornfang's adapted residence, proportionate to Greenwood's farm buildings, finished in roof/beam/grounding detail and navigable around the receiving yard. Day/night Canvas/Pixi fixtures agree; original entry/recovery gameplay and historical saves remain intact.

## 8. Roads, ground and quiet rural trade

### Roads and departure

Preserve #824's established route identities/order, bridge geometry and usable cart/farm/path hierarchy. The continuous paint correction is for sawtooth outlines, joins, end caps and abrupt color seams. Maintained narrow connectors use the same muted reddish earth family as the main road; less traffic means less compaction, narrower wear and encroaching grass. Unmaintained forest paths can remain softer without an abrupt yellow seam at a maintained junction.

At bridges, earthen approaches meet abutments; do not paint road over the deck. Keep two canonical main-river crossings and the separate mill service crossing work. No decorative width increase can imply traversable room that collision denies.

The wagon remains the region-transition interaction. Extend the **visible** road from it all the way to the eastern rendered world boundary with matching bearing/width and restrained wheel wear. At the departure view it must read as continuing out of the region, with no grass strip, rounded dead-end cap or unpainted gap between the wagon and map edge; clipping at the world edge is appropriate. A render-only extension is sufficient because the user requests connectivity/readability, not a walkable map exit. If any actual route extension is necessary, engineering must justify and migrate it separately; do not silently append/reorder saved routes or advertise walking into another region.

### Procedural ground

Choose three layers using existing native/cached rendering:

1. Broad, low-contrast vegetation/soil variation across several ground cells, anchored in world coordinates rather than an obvious tile checkerboard.
2. Sparse broken grass strokes, leaf litter and tiny stones related to place: leafier under trees, shorter/worn near traffic, cultivated texture within beds.
3. Feathered transitions between grass, clay shoulders, yards and worked earth. Red clay stays local to disturbed ground.

Keep the strongest contrast for actors, hazards, paths and useful objects. No metallic highlight strips, dark blotches masquerading as shadows, repeated symbols or animated grass per tile. Compare a meadow, woodland edge and farm/road junction; adding random dots uniformly is insufficient.

Source already offers `visuals.js::floor/groundDetail`, Canvas ground caching and Pixi terrain preparation. Main outdoor floor forces a uniform base; some `groundDetail` work is gated by material availability. Engineering must confirm the chosen layer actually executes in both renderers, then prepare deterministic bounded detail through their existing cache paths. Do not restore costly projected-image terrain, add a new texture framework or change terrain collision. Review retained geometry/texture count, cold preparation and warm draw cost; don't trade a quiet flat ground for phone stalls.

### Trade composition

Audit the existing chain: fields/orchard -> working mill and village market -> freight/depot/Treasury -> outbound merchant. This describes visual relationships, not newly simulated cargo routes.

Use one clear working vignette at each relevant place: sacks by the mill's dry loading side; produce in the market's usable frontage; sorted salvage/records and a cart at the freight/Treasury work area; a small ready load beside the merchant. Reposition/reuse props before adding any. Orient carts toward accessible lanes; suggest wear between loading space and road. No pile may obstruct a door, bridge, party route, tribute node or Treasury approach. Keep ordinary countryside between activity nodes; no new stalls everywhere, crowd spawning or economy system.

Audit outcome can be 'adequate, retain' where existing composition already communicates use. The owner explicitly allowed that rural trade may already be appropriate; do not force an overhaul to satisfy a checklist.

## 9. Fortification protection: distance from actual walls

The protected set is the actual enclosed wall footprint **plus points within 160 world units of it**, including a closed boundary across the intentional gate for territory classification only. Gate collision remains open. Preserve actual concavities if present; do not blindly take a convex hull that grants distant empty wedges. Sampling buffers or radial scaling must not create materially different leeway on angled edges/corners.

Use one authoritative boundary for damage reduction, ranged/reach/projectile rules and the Canvas/Pixi shield. Compute/cache geometry when wall layout changes, not per enemy per frame. Expanded camp migration must invalidate/rebuild this cache. Preserve approved 40% damage reduction and existing 320/416 basic ranged values and projectile policies; no AI leash, timed buff or new balance margin.

Check both forts: interior, gate, every wall face, angled segments, corner distances and just outside the allowance. At unambiguous wall-face samples, +145 must protect and +180 must not; add near-160 precision/boundary tests rather than treating those two samples as a full proof. Keep all other-region and interior contracts. A missing shield screenshot alone does not prove a damage error; verify both actual effect and indicator on the same eligible defender.

Prefer #826's narrow candidate as engineering input. Compare #827's equivalent coverage and #828/#825 alternatives; keep one implementation and the strongest independently justified tests. Do not merge all four fort algorithms.

## 10. Ordered engineering work and completion gates

This document defines intended results and a practical order. Joel requested design first and reserved implementation for engineering; no runtime edits, new test execution, PR closures, merge or deployment occur in this design stage.

| Phase | Work | Exit evidence |
| --- | --- | --- |
| A - establish one candidate | Refresh main/#828/#825/#826/#827/#814; resolve duplicate algorithms and known failures | Recorded branch/base/head, explicit donor decisions, relevant existing failures triaged |
| B - physical correctness | Reconcile fort boundary, false shadows and road paint; preserve canonical routes | Native boundary/route/save checks; paired scene review; evidence drift repaired only after review |
| C - authored compounds | Implement Goblin layout, Thornfang lodge/yard correction and Treasury massing together with clearance/save handling | Real phone-scale day/night images, hero/party/tribute/entry routes, repeat-restore proof |
| D - habitation and defense | Complete global occupied-light inventory, targeted corrections, public anchors and native trap placement | Site-by-site dispositions; fixture/source parity; real trap warnings/trigger/bypass/lifecycle evidence |
| E - material and commerce | Ground layers and restrained rural trade staging | Meadow/woodland/farm comparison, useful vignettes and relevant cold/warm performance evidence |
| F - integrated ready-for-review | Reconcile source/docs/assets and final candidate | Smallest applicable focused checks, build/offline/PWA consistency, reviewed native output; concise unresolved limits |

Do not hold a completed independent phase for speculative later polish; do not declare the assignment complete while an E01-E17 requirement lacks evidence or a justified adequate/unchanged disposition.

### Bounded visual review

Review actual normal-game output at 150% on phone landscape, in Canvas and Pixi, with an overview where needed. Prioritize: Goblin compound, wildflower/palisade pair, cultivated plots, Millhaven curved junction, thin-to-main junction/southern bridge, Treasury/northern bridge, merchant departure, Skeleton wall boundary and Thornfang lodge/courtyard with a same-camera cottage comparison. Add the three ground contexts and one representative corrected site per regional lighting style; other occupied sites receive the recorded audit. Reuse overlapping frames rather than expanding a full-game screenshot matrix.

Use day/night pairs for changed compounds/lighting/shadows. Spot-check dawn/dusk for shadow transitions and 100%/175% only where scale/density raises a real concern. Label real captures with source/merge SHA, save/seed, site, time, renderer, camera and viewport. Owner screenshots, source assertions, conceptual diagrams and a successful capture workflow cannot substitute for examining the final native frames.

### Engineering responsibility

Run the smallest relevant original suites selected for actual changed owners: fortifications/projectile behavior, Greenwood environment/native layout, town-street/bridge clearance, relevant save/migration and affected renderer/lighting/terrain/scope tests. Do not default to comprehensive game/browser certification. Resolve actual failures before readiness; do not weaken assertions to accept bad geometry or blindly regenerate historical hashes.

Use paired existing draw-cost tooling for material rendering changes. #828's baseline-dispersion HOLD is uncertain measurement, so investigate/repeat only that relevant comparison on the final candidate; don't claim a performance fix or iPhone FPS. Review static cache growth/preparation as well as warm cost.

Update existing feature documents, relevant design-to-sprite handoffs and generated outputs when source changes. No new raster production is needed for this procedural design stage. Preserve immutable original art and all v4 identities. Reference handoffs:
- `tools/sprites/design-handoffs/greenwood-goblin-fort-shelters.json`
- `tools/sprites/design-handoffs/greenwood-thornfang-homestead-proportions.json`
- `tools/sprites/design-handoffs/greenwood-scornfang-counting-house.json`
- `tools/sprites/design-handoffs/greenwood-organic-ground.json`

Final engineering handoff must map each E ID to changed source, real evidence and remaining limits; include tested head/base, donor dispositions, relevant check links, screenshots and rollback. It can be **ready for merge review** after these gates. Actual merge/deployment requires the owner's applicable authorization; physical-device acceptance is distinct and must never be inferred from desktop emulation.

## 11. Design-stage closeout

**Planned/design:** E01-E17 specified, scope reconciled, native source owners and known draft failures identified.
**Implemented this stage:** this documentation and design records only.
**Existing runtime candidates:** remain unmerged drafts, with the mixed evidence above.
**Tested this stage:** source/document reconciliation only; no game tests or visual candidate acceptance performed.
**Merged / deployed / device-verified this stage:** none.

**Next action for engineering:** start Phase A in #828, keeping this record as the one acceptance contract. No further chat reconstruction or owner-managed technical checklist is necessary.

## 12. Owner-request completeness audit - 5 November 2026

**Method:** reread every direct user message in all ten pages of the attached export and compare its individual requests against the controlling design, rather than accepting the previous assistant's summary. Include the current explicit homestead clarification; retain the separately recovered public-lamp request with its different provenance. Pages 4 and 10 primarily record assistant implementation/status claims, not additional owner requirements. The screenshots remain defect references, not proof that the new design works.

**Finding:** every stated concern has a design response and an observable acceptance target. This audit tightened four ambiguities: the homestead-adjacent palisade is an explicit scene; Goblin shelters must be proportionate to other camp assets as well as actors; shared shadow corrections are not restricted to Greenwood; and the departure road must visibly reach the edge, not merely point toward it. The closeout's stale E01-E15 range is corrected to E01-E17.

| Export source / later clarification | Requirement checked individually | Controlling design | What must demonstrate completion during engineering |
| --- | --- | --- | --- |
| pp.1-2 | Goblin palisade shadows match its actual structure | E01; section 3 | Segment/post footing, no unrelated dark ovals or upward fins |
| pp.1-2 | Both tiny shelters resized or remade proportionately | E05; section 4 | Both shelters usable beside goblins and consistent with canopy, table, goods and walls |
| p.2 | Enlarge fortress to make room for credible shelters | E05; section 4 | Joined expanded compound, usable courtyard/gate/tribute route; no forced squeeze or orphan collision |
| p.2 | More outdoor traps where they have a defensive purpose | E06; section 5 | Native functional traps at justified approaches across audited defended sites; warnings and bypasses; no decorative-only substitute |
| p.2 | Enemies need sensible night illumination | E07; section 6 | Physical sources illuminate occupied entry/work/living areas; allegiance does not imply darkness |
| p.2 | Apply lighting review across all enemy locations, including inside | E07; section 6 | Complete five-region outdoor/interior site inventory with correction or justified adequate disposition; no Greenwood-only completion claim |
| p.3 | Reconcile flowers and smaller plants with their shadows generally | E02; section 3 | Category-wide proportionate faint/root contact; not just a one-flower patch |
| p.3 | Same nonsensical upward shadow on fence beside Thornfang's private place | E01; section 3 | Explicit homestead-adjacent fence comparison, not only Goblin/Treasury walls |
| p.5 | Cultivated land should not cast detached shadows | E03; section 3 | Flat soil remains flush; raised crops/edging treated separately |
| p.5 | Reconcile shadows with day/night cycle | E04; section 3 | Coherent day, dusk, full night and dawn grounding/cast strength in both renderers |
| pp.5-6 | Audit/fix sawtooth road curves | E08; section 8 | Smooth outlines/joins/end caps at reported and other affected bends |
| p.6 | Improve flat/artificial/metallic-looking terrain while retaining procedural engine | E10; section 8 | Three deliberate material layers supported by current cached painters; meadow/woodland/farm comparisons; actual execution and bounded cost |
| p.7 | Redesign Scornfang's recycled-cottage Treasury but retain Greenwood architecture | E11; section 7 | Recognizable former agricultural storehouse adapted for counting/receiving/secure storage; original gameplay/interior retained |
| p.8 | Make thinner roads integrate with reddish main-road material | E09; section 8 | Related muted earth palette across maintained width hierarchy; no awkward pale seam at the shown junction |
| p.8 | Connect merchant departure road visually to map edge | E12; section 8 | Continuous edge-reaching road with no visible grassy cutoff, preserving wagon transition |
| p.8 | Audit whether regional trade is communicated; rural quiet remains appropriate | E13; section 8 | Review the existing production/market/freight/departure chain; improve weak scenes, retain adequate scenes; no compulsory busy bazaar or economy redesign |
| p.9 | Is fortified territory actually reconciled to visible fortress? | E14; section 9 | Protected interior follows real wall/gate boundary rather than old generic center/ring |
| p.9 | Is outward leeway measured from actual perimeter? | E14; section 9 | Existing 160-unit allowance measured once from actual walls; edge/corner checks and effect/shield agreement |
| Recovered public-lamp message | More sensible public posts, without making rural Greenwood bright | E15; section 6 | Actual covered public anchors and dark intervals; attempted/failed placements alone do not pass |
| Current takeover clarification | Thornfang's house oversized compared with other houses | E16; section 4a | Same-camera cottage/lodge comparison, reduced main mass with usable wolf opening |
| Current takeover clarification | Develop courtyard/associated areas using space gained | E16; section 4a | Useful circulation, subordinate rest bay, work/service groups and coherent boundaries |
| Current takeover clarification | Homestead looks unfinished and poorly implemented | E16; section 4a | Finished ridge/gables/roof joins, grounded supports, coherent perspective/frontage/rails and mounted lighting |

**Design-coverage verdict: PASS after these clarifications.** This means the owner's concerns are accounted for in the specification; it does not mean their implementation or visual quality has passed. Exact placements, final measured proportions, the per-site lighting/trap inventory and actual native images remain engineering deliverables under the stated designs, not silently waived work. Existing numerical art targets are designer starting points, not owner-approved measurements.

**Later owner addition:** E16 now specifies an appropriated granary/store barn and reused farmyard; E17 adds one existing Dark Crown standard. These are current design requirements, superseding the purpose-built lodge interpretation. The earlier page-by-page audit remains provenance for the attached export.

**Current boundary:** this request authorizes the completeness audit and design corrections only. No engineering phase is started by this audit, and no runtime, test, merge, deployment or device-verification claim is made.

---

## Historical initial handoff - retained provenance

The following earlier record is superseded by sections 1-11 above wherever it conflicts. E16 and section 4a incorporate the owner's explicit current homestead clarification. Earlier draft-status and test statements describe the original checkpoint only.

# Greenwood Vale — owner live-playtest environment reconciliation

**5 November 2026 — SIBDLP / So I Became the Dark Lord's Problem.**
**Authority:** Owner's same-day live iPhone screenshots and direct comments; current main source, approved 50-choice Greenwood art register and original fantasy canon. This supersedes older *visual acceptance* assumptions, not existing gameplay/canon approvals.

**Status:** Independent correction draft. The first **shadow, road-painter and wall-derived fort-protection** changes are committed on branch `fix/greenwood-owner-visual-review-20261105` but are **not merged, published, device-tested or aesthetically accepted**. Remaining architecture, terrain, population, traps and lighting topics below are **design/implementation follow-ups, not completed fixes**. Do not falsely relabel the user's screenshots as branch screenshots or tests.

## 1. Immediate defects / engineering candidate

- **Ground contact vs cast shadows.** The existing renderer gives standing objects, farms and plants a broad two-oval foot treatment regardless of scale; line-built Greenwood walls inherit an unrelated round shadow at their center. On this draft: flat cultivated plots, bridge markers and line-built wall segments suppress that generic shadow; small flowers/low shrubs receive a smaller, weaker foot contact; the same `shadowOpacity` attenuates throughout the existing day/night cycle in Canvas/Pixi. This is a stylized contact convention, not realtime sun/moving dynamic shadow physics. Real wall/roof penumbrae, if developed later, must be tied to actual structure geometry and light.
- **Bridge surface.** The rendered bridge deck itself is authored in `visuals.js::bridges` and must remain clear. There are legitimate narrow deck-board details, but no broad displaced oval cast shadow from a landmark/flat marker. Review both bridges with the live camera against the owner's image.
- **Skeleton Watch / Goblin perimeter combat mismatch.** The current 160-world-unit outdoor leeway exists already. The reconstructed fort wall elements use `greenwoodWall.a/b` line endpoints while `fortAreas()` historically mapped wall *indices* to the older ten-post ring. These are different wall geometries; source confirms they cannot be trusted to coincide. Draft fix derives the *actual wall outer hull* and a sampled 160-unit outward margin once per fort cache; `enemyFort()`, damage, range and Canvas/Pixi shield indication continue to use one predicate. Preserve the exact indoor footprints and all other regional strongholds. Coordinate with stale draft #819's alternative extra 40 units; DO NOT simply stack or merge a second margin.
- **Road geometry/material.** The current Greenwood painter unions many segment rectangles and caps at every interpolated vertex. The draft replaces wide-road paint with a continuous offset ribbon and caps only the two real ends, retaining the road's existing true centerline/navigation. Short Millhaven service connections become narrower members of the *same* muted red-earth road material, while long forest footpaths remain soft/worn. A render-only carriage continuation runs from the current merchant wagon toward the eastern world edge. This does not assert that a caravan actually traverses another region or change transport interaction/save routing.

## 2. Further authorial correction phases (not yet implemented)

### Built places and scale

**Goblin Road Fort:** Expand a *coherent* polygon compound before increasing two undersized sleeping shelters; keep the established gate/entrance, domestic courtyard and defensive use. Two credible goblin-sized shelters should share a visual grammar with other Greenwood structures, include identifiable bed/roof/wall materials, and be surrounded by functional cookfire, food preparation, storage, racks and resting space. Rebuild wall segments, associated collision, enemy homes/patrols and fort footprint together; no orphan fences or sealed routes.

**Thornfang personal homestead:** Current lodge is disproportionately large compared with Millhaven cottages. Preserve the spacious dry plot but divide functional uses: a modestly larger-than-human main lodge sized for Thornfang, a lower open sleeping/rest bay, a small gear/food shelter or lean-to, and enriched connecting yard (water, meals, bedding, trophies that are already canon-justified, scout equipment, storage). A large wolf's body, clearance and line of sight matter, not a giant single roof. Finish roof joins, frontages, natural circulation, and nighttime lamp mounting before aesthetic acceptance.

**Scornfang's Treasury:** The current `visuals.js::craftedResidence('thorn')` literally calls `craftedHouse('vale-cottage')` before adding a widened threshold and decorations. Replace that generic-cottage derivative with a purpose-built, modest **timber-and-stone rural counting house** with secure loading porch, visible locked store and record/weights operation, discreet guard posts and weathered Greenwood materials. Keep Scornfang distinct from Thornfang. The existing interior, two guarded cache identities, fights/rewards, saved entry, and road accessibility remain authoritative.

### Defenses, practical light and inhabited spaces

**Traps:** Inventory actual persistent outdoor trap sources and current placement in every enemy camp; add a deliberately limited number of *real native traps*, not decorative symbols, at tactical approaches, narrow openings and guarded lanes, away from default spawn, road traffic and unavoidable civilian/quest paths. Preserve telegraph legibility, trigger/disable behavior and performance; check fresh and restored saves. Merely claiming that a gate is defended is not evidence a working trap exists.

**Night illumination:** An occupied hostile site still needs practical illumination. Audit all enemy-populated outdoor compounds **and** interiors for actual cookfires, lanterns, work stations and post/door fixtures; don't create a universally bright enemy landscape. Each nighttime glow must correspond to a physical source, carry sensible service hours and match Canvas/Pixi depth and occlusion. Fire can illuminate a lived-in yard; watch gate lanterns and rooms should respond to habitation and material identity. Use regional art variants, not Greenwood fixtures stamped into other biomes.

**Public lamps:** The current generic roadside placement allows **at most three** Vale lamps and silently skips candidates failing distance/blocker checks; authored civic props can supply one more. The owner's observed one-post experience is plausible, though the screenshot does not establish a comprehensive census. Redesign a small **verified placed** group near Millhaven's market and refuge, functional road junctions, Orchard Hamlet, the freight approach and selected crossings. Ensure reasonable nighttime pools, a recognizable physical fixture in daylight, separation from housing-only illumination and no bright uniform grid. Deterministic, idempotent scene additions must survive existing v4 saves. Record failed candidate placements instead of quietly meeting a nominal quota.

### Terrain / commerce

**Ground material direction:** Present Greenwood floor deliberately bypasses the optional ground texture; it uses uniform green plus sparse detail. Keep the successful cached/native procedural approach and add stable, large-scale soil/vegetation variations, fine broken blades/litter/pebbles selectively, subtle transition to worn red-clay tracks and cultivated ground, with *no* sharp edge tile seams or painted metallic swaths. Avoid the prior costly per-tile projected image pass and avoid confusing large blobs/painted shadows with texture. Review 100%/150%/175% daylight/overcast-feeling dusk/night. Compare Canvas/Pixi and inspect CPU/draw/memory and combat/quest readability before selecting final density.

**Roads and trade:** The current scene already has Millhaven market, orchard, working mill, outgoing merchant wagon, freight yard and Scornfang salvage movement. It does not yet visually communicate their relationships strongly. The main carriage road should visibly leave at the merchant departure edge, while stored goods, cart positioning, work aprons, weighing/sorting and human-scaled pedestrian service lanes show a *quiet working rural economy*, not a large urban bazaar. Preserve lore/gameplay economy and do not invent a new simulation or cargo transactions without separate design approval.

## 3. Acceptance / integration rules

1. Protect existing four classes, enemy/hero combat, original map size and routes, owner-built sites, exact saved objects and v4 restoration. Real changed geometry requires an idempotent migration and native reachability checks.
2. Keep coupled source ownership explicit: Greenwood decorative/collision geometry in `greenwood-landscape.js`; shared fort area in `fortifications.js`; Canvas shadow in `renderer.js`; retained Pixi shadow parity in `pixi-scene-bridge.js`; paint/ground art in `visuals.js`. Cross-region effects only where proven shared.
3. Review the owner's target scenes in normal game rendering at day, sunset, full night and sunrise on both Canvas and Pixi, standard and phone landscape camera zoom; check building scale, fort gate, two bridges, market/side road junctions, both riverside banks, merchant exit, goblin shelters, Treasury, field plots and actual wildflowers. Do not mistake source checks for image approval.
4. Focused native tests cover real fort wall endpoints/protection/ranged bonuses, four-class saves, physical path clearance and traps; consider targeted browser snapshots, PWA cache and paired CPU checks for implemented changes. Do not start comprehensive suites, merge or deploy without the owner's separate permission.
5. **Engineering status:** first correction set has code committed and focused tests updated; branch validation, complete built-place redesign, full-region lighting and traps are still pending. **Merged:** no. **Deployed:** no. **Device verified:** no. Revisit and reconcile overlapping defense draft #819, regional environment PRs #736/#739 and open parallel gameplay branches before integration.
