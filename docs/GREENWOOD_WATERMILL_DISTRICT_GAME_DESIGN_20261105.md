# Greenwood Vale — Working Watermill District: game-design project and engineering handoff

**Game:** So I Became the Dark Lord's Problem (SIBDLP)  
**Date:** 5 November 2026  
**Discipline:** environment design, architecture, landscape composition, visual affordances  
**Status (5 November 2026 design-first update):** **Revised game-design specification approved for bounded engineering; existing draft PR #814 implemented only partially against the refined creative criteria. The scene has not passed independent visual acceptance, merged, published or been device-verified.** See the top RESTART HERE section for exact observed PR/CI checkpoint, changed upstream decisions and next engineering actions.  
**Historical initial design-source read:** main@2cbdd804982624d7c303f319e953d1ff901458b2. The dated, newer engineering checkpoint appears under RESTART HERE below. Always verify live main before changes.  
**Owning defect:** [#641 — millpond/dam/wheel hydraulic coherence](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/641).  
**Evidence:** owner's 5 November nighttime game screenshot of the western Greenwood watermill; current mill art and Greenwood water/road layout source; approved Greenwood 50-decision register; neighboring open game-design PRs.

## RESTART HERE — PR #814 standalone engineering continuation (5 November 2026)

> **5 November 2026 — NEW OWNER DIRECTIVE: DESIGN FIRST.** Before any additional watermill engineering or merge decision, the remaining creek, culvert, local bridge, service-yard and district-composition work returned to professional game design. **Section 2A below is the controlling design update**; the older RESTART HERE engineering sequence is preserved as historical context and must be read through this update. Design gives a **GO to the bounded engineering specification**, not a GO to the existing visuals, PR merge, release or device acceptance. Preserve all work in PR #814 and independently verify actual scenes before declaring implementation complete.

**Read this section FIRST in a new chat.** It is intended to support a fresh engineer or assistant without access to the conversation that created this PR. It describes a dated, verifiable checkpoint—not a standing claim that CI, `main`, or overlapping PRs have stopped changing. For authoritative updates, always inspect the live PR and exact commit before changing code.

### 1. Owner directive, repository and authorization

- **Official game:** *So I Became the Dark Lord's Problem* (SIBDLP), an independent fantasy RPG. Do **not** confuse it with the separate SIBDL project. "Azeroth Chronicles" is **only** the historical GitHub repository name.
- **Repository:** [joedoragon-glitch/azeroth-chronicles-prototype](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype). **One existing PR:** [#814](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/814), branch `design/greenwood-watermill-district-20261105`, targeting `main`; originating design/defect [issue #641](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/641).
- **Owner direction:** Finish and validate the unique watermill district work **inside #814**. Do not open unnecessary PRs, do not merge merely to hurry, and do not give the owner routine troubleshooting or approvals as homework. Engineer independently, then permit **owner artistic acceptance in the published, playable game** and iterate on the actual experience. The owner authorized proceeding through the merge process *when ready*, not skipping engineering/visual/save acceptance. Confirm publication implications before merging: a successful `main` push can automatically trigger GitHub Pages deployment. No blanket authorization to launch broad/full-game/browser matrices.
- **Required reading (current, in order):** `AGENTS.md`, `docs/DEVELOPMENT_STATE.md`, this design contract (including DA-01–DA-15), `docs/GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md` (particularly W01–W06), `docs/ARCHITECTURE.md`, `docs/MECHANIC_DEVELOPMENT.md`, current `main`, PR #814's changed files and exact Actions runs. The historical 2026-10-28/29/early-5-Nov coordinates and statuses elsewhere in this file are references, **not** fresh source authority.

### 2. Last verified GitHub checkpoint, and why it must be rechecked

At this handoff's source inspection on **5 November 2026, approximately 12:10 UTC**, PR #814 was **OPEN, DRAFT, NOT MERGED**, technically marked mergeable, with observed head `7f5c3cefd4a7eda6ceebd71c71f7640cb048f0b7` and base/main `18777814424b6a84d9240b11035b7860eef68dd5`. New commits to PR #814 or `main` supersede these SHAs. **No PR #814 code was merged or deployed as part of this handoff.** Local render checks and historical upstream merges are not device verification.

At this exact inspected head:
- [Focused CI run #42024928599](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42024928599) was **in progress**; **do not infer a pass or failure**. Inspect final job/step logs and artifacts first.
- [Browser PWA acceptance run #42024928353](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42024928353) was **successful** at this head; this is an automated browser check, **not** phone/device or overall artistic acceptance.
- Prior [focused run #42024666091](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42024666091), head `493a2f184608f0c1b178919d90f88055b427f6cf`, **failed** at the *release/documentation consistency* step: "Runtime changes have no accompanying feature/player documentation update in this PR." This was a specific documentation gating failure, **not evidence the new watermill graphics failed**. The subsequent PR commit changed `docs/GREENWOOD_REDESIGN_MASTERPLAN_20261029.md` to supply an existing feature-doc update. Current handoff revision also updates this existing watermill design contract; only the new exact-head run can establish that the gate is fixed.
- Much older run `479dab50` had a watermill-specific check pass but unrelated/further failures. **Never substitute that for latest-head evidence**.

### 3. Existing upstream merges and parallel ownership

**Already merged to `main` at the checkpoint:** [#813](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/813) rebuilt the genuine mill, sluice, connected pond/headrace/tailrace, river mouth and common Canvas/Pixi glass lighting; [#809](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/809) nighttime palette; [#808](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/808) botany/farms; [#820](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/820) **removed the old eastern water disc**, replacing it with Thornfang's **dry wolf-scout homestead**; [#804](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/804) four finite tribute sites and Crypt freight depot. **Keep them.** Early parts of this design document that still refer to a separate *eastern farm pond* are **historical and superseded by merged #820**. The WESTERN millpond remains.

**Still a separate OPEN DRAFT at the checkpoint:** [#824](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/824), the two canonical main-river crossings/roads. **Do not import all of #824 or disturb the existing north/south bridge identities and indexed saved road routes.** Check its live status before integrating any overlapping changes.

An important merge lesson: `main` advanced multiple times while #814 was being developed. Early reconstructions incorrectly risked restoring an eastern pond, overriding revised mill art or shifting saved road indices. The current branch has been reconciled toward the newer landscape and the dry homestead. **Reconcile incrementally against CURRENT main rather than blindly copying old branch files.**

### 4. Implemented in the draft branch (not the same as tested or published)

- `src/prototype/greenwood-landscape.js`: `configure()` now authors `upperCreek` from northern boundary `[1220,0]` toward existing `[900,880]`, as a shallow wet `ribbon`; the retained western millpond, natural stream, headrace, and tailrace are separate polygons. `blockingPools` excludes **only** the new shallow source: 5 total water polygons, 4 deep. Authored `millBridge` from `[1290,1600]` to `[1350,1530]` (62-unit design width) and `creekCulvert` from `[1070,725]` to `[1145,805]` (76-unit design width) share normalized source geometry. `millServiceLane` connects `[1200,1660]` to `[1400,1490]` across the short deck.
- Same source `greenwoodWatermillScene(z)`: one-time marker `greenwoodWatermillVersion=1` and additive, non-destructive lane/yard upgrade for existing v4 scene-5 Greenwood saves. The farm lane must be **appended**, never inserted between the historical route indices. `greenwoodHomesteadScene`, current orchards/farms and the other region's quest sites must be preserved. Decorative work cart, supply stack and barrel have revised target positions; owned/custom objects must not be moved.
- `src/prototype/navigation.js`: deep-water blocking uses `blockingPools`, and the mill deck permits real actor traversal only inside its authored deck boundaries. The main-river gap/barrier logic remains independent; the upstream shallows must not create an invisible navigation wall.
- `src/prototype/visuals.js`: shallow-source water palette and a rendered **local** timber service deck plus upstream stone-culvert surface. The *upstream merged #813 mill and fixture artwork* stays authoritative. The two original strategic bridge identities are untouched.
- `src/prototype/world.js`: a mill-specific road setback (185 world units) to protect the roof/frontage from road overlap.
- `sw.js` and `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json`: exact source/graphics hashes. Recompute from *current final source* on every subsequent merge that changes associated JS; do not guess fingerprints or preserve stale SHA references.
- `tests/greenwood-watermill.test.cjs`: planned checks for the 5/4 water polygons, **dry eastern homestead (not pond)**, original two bridges, actual deep-water crossing vs surrounding blocking, resource/creature counts, site/road clearance and idempotent v4 save reload. `tests/greenwood-mill-river-visual.test.cjs`: prior native artwork/lighting contract adjusted for the extra shallow source. `tests/runtime-workload.test.cjs`: provisional **Crypt frozen-dev.175 baseline** correction allows today's navigation rule during initial region generation, then restores the frozen version before comparing gameplay; must be confirmed by focused CI, not waived.
- `tools/greenwood-layout/watermill-review.cjs`: 5 native software-Canvas scenes at **150%**: mill day/night, service bridge day/night, upper culvert daylight, plus labeled contact sheet and checks on dark/day contrast, nonblank frame and unchanged save. The normal focused workflow was configured to execute/capture this for #814; verify the current runner actually calls it and uploads `test-artifacts/greenwood-mill-river/`. **A script existing is not proof that the images were generated or inspected.**

This implementation deliberately **does not add** new production economy, quests, shops, monster spawns, additional official main-river bridges or a new class. The distinct Stage 3 **windmill-powered Acid Bottle** resource economy is a different feature.

### 5. Genuine test / scene evidence versus open gates

Earlier development produced actual local 150% day/night Canvas renders reconstructed against contemporary source, and inspected merged #813's real native day/night capture artifact at [Actions run #42014768952, artifact 13408299050](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42014768952). Those are **historical visual baselines**, not exact-head #814 CI visuals, physical-device results, Pixi parity or owner approval. The first local mill frame clipped part of the roof; the capture camera was subsequently adjusted. Review the **new current-run contact sheet**, not merely the old screenshot.

A go/no-go merge decision requires, at minimum: (a) **exact commit SHA** and completed focused run with real failure logs, (b) no relevant new regression in water geography, route/bridge traversal, creature/tribute totals, owned structures, existing v4 saves and Crypt workload comparison, (c) real readable day/night **current** native scenes (roof/door/wheel and bridges within camera, no wrong water cap, dark but practical lantern), (d) appropriate Canvas/Pixi source/scene parity check and bounded CPU/rendering risk, (e) up-to-date docs and PWA/cache artwork receipts. Do not trigger comprehensive game/full-browser matrices without separate authorization. An expected later owner **live-device artistic iteration** is not a reason to skip objective engineering or perceptual checks now.

**Final status at authorship:** **IMPLEMENTED IN DRAFT; newest focused CI PENDING; NOT YET MERGED, PUBLISHED, OWNER-ACCEPTED OR DEVICE-VERIFIED.** Browser PWA check success is a separate narrower status.

### 6. Next chat's execution path — do not create a second PR

1. **Start by reading this handoff plus live #814**, its current changed-file list, last commits, `main`, `AGENTS.md` and development state. Pin both SHAs. Review #824 if the overlapping route code changed.
2. **Inspect run #42024928599 (or any newer head run)** and its job logs/artifacts before touching implementation. If the docs gate still fails, review current `docs/DEVELOPMENT_STATE.md`, the feature-doc change selector, and this edited existing file. A documentation-only commit **cannot certify runtime tests**; require a new actual check.
3. **Run/interpret only relevant focused tests**: `tests/greenwood-watermill.test.cjs`, `tests/greenwood-mill-river-visual.test.cjs`, `tests/runtime-workload.test.cjs` plus other impacted Greenwood/navigation/save/renderer checks selected by the normal CI policy. Correct genuine failures, do not weaken tests to pretend the scene is correct. Preserve four classes, 640 tribute resource units and 32 ordinary Vale enemies unless current authoritative owner-approved source has legitimately changed those numbers.
4. **Collect and personally inspect new real day/night render artifact(s)**. Check the 150% roof, wheel feed/discharge, service crossing, actual culvert, land/road logic, lantern and visual readability. Prefer real Canvas/Pixi comparisons where the focused workflow supports them. Correct clear scene defects in #814; do not ask the owner to review mockups.
5. **Reconcile current main once**, narrowly and safely, retaining all newer accepted Greenwood content and avoiding unrelated branch scopes. Repair PWA SHA and artwork evidence after the final source edits. Check PR mergeability and current release docs. Do not repeatedly rebase solely because unrelated work continues landing.
6. **Only when objectively merge-ready** under owner authorization, follow the standard PR merge workflow and verify both actual merge result and publication separately. A main push can start the focused Pages publish automatically, so understand that gate before merging. Owner will make the final creative call in their playable game; further changes should follow actual observed feedback, not imaginary acceptance.
7. Update this **same** handoff/status section and the PR body with exact final commit, tests, scene artifact links, blockers/deferrals, and next action. Keep the new chat self-sufficient; never require this old ChatGPT conversation as a source.

**Suggested first message in the new chat:** “Continue SIBDLP watermill engineering on existing GitHub PR #814 only. First read the RESTART HERE section of `docs/GREENWOOD_WATERMILL_DISTRICT_GAME_DESIGN_20261105.md` from that PR and `AGENTS.md`, then independently inspect current main, the PR head, new focused CI results and image artifacts. Finish remaining bounded implementation, validate, and keep the PR draft until genuinely merge-ready. Do not create another PR or run comprehensive suites; preserve newer Greenwood merges and existing v4 saves.”

---

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

Follow [Greenwood owner-approved 50 decisions](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md), especially W01–W06, M01–M06, E04, S02–S04 and P03–P06: green mature-summer farmland and hardwood groves; honey timber and muted stone; locally worn red-earth lanes; one western engineered millpond, a historically planned eastern farm pond **superseded by the merged dry wolf-scout homestead (#820)**; an understated but visibly functional mill; **two existing main-river crossings**; scenery that respects player movement. **Supersession:** merged #820 removed the old eastern pond in favor of Thornfang's dry scout homestead; preserve that newer approved scene. No second eastern water feature may be restored.

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

### WD-11 — One dominant practical night light, optional unlit inspection hardware

Preserve the **already merged #813 wall/beam-mounted entrance lantern** beside the real loading door, under the eaves, with its actual bracket, cage and glass shared by Canvas/Pixi. This is the **one dominant after-dark practical light**, not a request to duplicate the fixture. A physically believable inspection fitting by the sluice is optional and normally **unlit**; add it only if a reviewed scene needs a plausible maintenance detail. Do not imply a fully staffed night shift or light every workshop window.

The door pool and weak local reflection should be warmer than the surrounding moonlit **slate/blue-gray** Greenwood palette from #809, but never a flat yellow rectangle pasted on the roof or in the river. Most windows can remain dark; any dim interior hint needs believable placement and must not contradict the closed-workplace hierarchy from #812. Fixtures exist and look like real metal/glass hardware by day; there is no ghost lamp that spawns only at night.

Use existing bounded lighting systems rather than demand dynamic shadow maps or high-cost glow filters. Respect character silhouettes, target rings, combat warnings, water/bridge navigation and both Canvas/Pixi presentation.

### WD-12 — Strong environmental composition at game camera scale

Compose three principal masses in normal play framing:
1. **Upper/left:** the asymmetrical millpond and its legible controlled bank.
2. **Center:** a unified, signature-size mill plus waterwheel, with the dry front/road visible.
3. **Lower/right:** a narrower riverward tailrace, local timber service bridge and riverbank transition.

Secondary small props should support the story; the player eye should follow **water source → stored water → used water → discharged water**, then find the loading entrance and onward route. One visually dominant mill, not four unconnected focal points.

The river continues into/out of the wider regional world; do not frame it as an ornamental moat around the mill. Keep negative space around heroes/companions and existing region identity. Prefer physical clarity over extra particle effects.

## 2A. Professional game-design continuation — remaining watermill district (controlling 5 November 2026 update)

**Creative decision: DESIGN-SPECIFICATION GO; EXISTING SCENE ACCEPTANCE HOLD.** The original WD-01–WD-12 architecture/hydraulic direction remains valid, but the merged #813 mill, pond, weir, wheel, river-mouth materials and shared mounted lamp now constitute the **fixed visual master**. Game design does **not** request another mill redraw, second lighting subsystem, new terrain family or expanded economy. This addendum resolves how the *remaining unique features* must fit that master. Its GO allows engineering to continue *only within these resolved boundaries*; the final appearance remains unapproved until the actual composed scenes are inspected and corrected.

**Design intent in one view:** A narrow northern wooded drainage becomes the already established mill stream, feeds the western engineered pond, drives the recognizable mill, then leaves under a modest timber crossing toward the existing valley river. A practical farm access route connects a dry loading yard. In daylight, it should be attractive, ordinary and inhabited; at night, the doorway lamp offers one small warm point in the cool Greenwood landscape. The player should read the *water's cause and destination* without following a geometric line on a map.

### Design resolutions for the remaining work

| ID / priority | Required design treatment | Rejection trigger |
| --- | --- | --- |
| **RM-01 / Essential — Northern water source** | The source at the **northern map boundary** reads as a narrow, naturally meandering, shallow upland creek, bordered by broken silt/gravel shelves, soil and occasional restrained bank planting. The existing deep stream begins downstream where the shallow extension meets the established water. A narrow water highlight can show direction; visual width and bank shape may vary modestly without changing authored traversability. | A blunt visible endpoint, an evenly colored turquoise road stripe, a second pond, or a new deep impassable barrier. |
| **RM-02 / Essential — Creek continuity** | Reconcile the extension's last two bends into the original creek so that color, bank rims and water levels transition gradually. In the central crossing area, the creek must look like it passes **under** the road rather than being painted over its surface; the remaining mill/pond/river water should stay faithful to #813. | Water ribbons visibly stacked on each other, a raised road submerged under a blue strip, or an unexplained dry gap. |
| **RM-03 / Essential — Northern road culvert** | Interpret the approved source-aligned crossing as a **low stone-faced culvert beneath an existing dirt/cart road**: retained earth roadbed above, small masonry headwalls/cheeks where the stream enters and exits, darker opening beneath the bank, and continuous creek upstream/downstream. Keep the road's visible grade/width/identity from the canonical road owner #824, rather than a large ceremonial stone bridge. A channel shallow enough to wade elsewhere can still pass beneath this culvert. | A floating quadrilateral stone slab laid over water, a third named bridge, road narrowing or a water collision trap. |
| **RM-04 / Essential — Local millrace crossing** | The **single small service bridge** is clearly timber: legible longitudinal beams, a restrained plank deck, two dry abutments, short end-posts or edge guards where physically useful, and a darker opening below for flowing millrace water. Its usable lane lines up with the authored access route at both ends. It must be visually subordinate to #824's northern and southern main-river bridges, and must not conceal the wheel, discharge or gate. | Decorative planks with impassable collision; a deck ending in wet ground, a full-scale third strategic crossing, or rails/props hiding the player and companions. |
| **RM-05 / Essential — Road-to-yard arrival** | The farm route should naturally narrow into a **short worn mill service spur**, with a coherent turn onto/off the timber deck and a dry compacted-earth landing at the loading face. Keep enough clear ground at the door and millpond marker for the hero plus companions to arrive, turn, interact and leave. Existing generic cart, supplies and barrel belong against a *dry service edge* in a visually composed cluster, not arbitrarily at the three nearest available coordinates. | Any prop blocking a threshold, a road that leads into the water or roof, or a visually open courtyard that fails real navigation. |
| **RM-06 / Essential — Banks and regional ecology** | Resolve a readable maintenance gradient: clean working stone/compacted ground at wheel and crossing, gentle mud and silt/reed patches at calm pond edges, progressively rougher planted tailrace banks toward the main river. Reuse current #808 planting identities and preserve established forest, farms, saved structures and sightlines. | A uniform reed ring, random rocks over the road, duplicated vegetation systems, loss of current Greenwood scenery or visual blockage of combat cues. |
| **RM-07 / Essential — Night appearance** | **Keep #813's single shared glass-and-flame doorway lamp.** Place the warm pool on the door, ground/apron and nearby timber; let #809's cool night palette dominate woodland and creek. The shallow creek, timber bridge edges and headgate remain discernible at actual phone scale without glowing neon or fully illuminated industrial premises. | Second competing lamp implementation, bright yellow roof stickers, source-water neon, unreadable crossing at night or mismatch between Canvas and Pixi lamp position. |
| **RM-08 / Essential — Technical world agreement** | Painted creek, culvert, bridge, source, roads and true deep-water collision use the same owned geometry. The **shallow** upper section remains walkable; the deep tailrace is blocked except across the actual service deck. Preserve #824's route index order, the two real named river crossings, additive saved-scene upgrades and existing player structures/quests/worker routes. | Visual-only bridge, moved legacy road indices, destructive v4 rebuild, invisible deep-water wall or accidental quest/economy change. |
| **RM-09 / Supporting — Detail budget** | Concentrate detail at the two junctions, local deck, mill doorstep and waterline; use large readable masses and sparse secondary accents. Static forms and cached/deterministic details are preferred over new per-frame animation or fluid/particle simulation. | More decorations without improving functional readability, large new draw overhead or unbounded lights/particle emitters. |

### RM-10 — Owner-requested visible, reachable mill doorway (5 November 2026)

The original working-mill façade inherited the standard Greenwood workshop's **exposed work bay**, which offers no convincing exterior door. The owner identified this at the **real published playable watermill**. Preserve the existing waterwheel, masonry, materials, roof and shared mounted lantern, but give the **dry yard-facing front** a recognizable ground-level loading entrance: recessed dark opening, solid lintel and jambs, plausible timber leaf visibly ajar, protective threshold and the start of a worn apron. The doorway must be readable at the actual 150% phone camera scale in both day and night. It must not look like a sealed window, painted black rectangle, or door that opens directly into the race.

**Functional acceptance:** The doorway has a nearby player-sized **dry standing/interaction landing** outside the mill's existing solid footprint, with a valid native walking route from the mill service lane. The player, companions, or workers must not visually walk through the mill's walls or get trapped by the wheel/sluice. A visible door and reachable landing are the scope of this district scene correction; **they do not by themselves authorize or imply an implemented explorable mill interior**. A separate interior would require its own authentic room design, zone-transition, save and exit behavior acceptance rather than an invented empty room. The distinction must be clear in release notes.

**Review evidence:** A close day view of the mill entrance and night view at the same phone zoom, plus authoritative walking/collision assertions. Any renderer that loses the door under the roof or lantern fails this criterion. The previous game-design GO remains conditional on this additional owner visual requirement.

### RM-11 — Owner-authorized coherent water and road access (5 November 2026)

The owner expressly prioritizes a believable connected watermill district over frozen placement coordinates. It is authorized to resize/reshape the shallow feeder, the local millrace, the culvert and small service bridge, and to adjust replaceable scenery where necessary to make their physical relationships obvious. **Do not blindly widen the two established main-river bridge gaps or move player-owned/saved service or quest identities**: #824 owns those and actual obstructions must first be demonstrated. There is no reason to invent another major river bridge.

The mill receives one **connected**, restrained rural approach: a new **farm spur branches from the existing west-bank farm road at (650, 1550)** and ends on dry ground at (1200, 1660). From this exact junction, a **narrow pedestrian footpath** approaches and crosses the real timber bridge centered farther upstream on the actual tailrace near (1230, 1535), away from the busy main-river confluence, continues to a small dry yard at (1400, 1490), and bends to the visible loading door at (1210, 1485). The dry farm track never runs across a pedestrian bridge. The road and footpath remain separate painted widths—do not coat the narrow timber bridge in an unrelated broad cart-road slab. Both endpoints of the deck require supported banks; the water's impassable channel must continue past the bridge, connect the pond, wheel and main river, and not end in a visibly arbitrary blue tip. The shallow upstream creek now starts at the north map boundary, converges naturally with the existing pond feeder, and carries a modestly wider readable streambed under the existing north freight road's earthen culvert. Neither bridge is an isolated decorative object.

**Acceptance:** independently verify graph/topological connection to the existing road, dry footpath to the actual entrance, deck-over-water geometry with nonwater abutments, route and actual player-radius traversal in both directions, creek reaching the pond and tailrace reaching the actual main river, close daylight/nighttime 150% real native frames and renderer parity. Watch the mill facade and its old clearance radius, do not silently remove protected property to pass a test. Preserve existing route indices and v4 save migration: append the mill farm spur and mill doorway footpath after the 17 canonical #824 corridors, use versioned one-time reconciliation, and explicitly upgrade any exact earlier #814 preview path without duplicating it. All four classes, quest IDs, ordinary enemy and tribute totals, worker order data, save hashes and CPU budgets remain protected.

### Camera composition, scale and adjacency decisions

- **Near-mill view (150% landscape phone):** the merged roof/wheel/door remains the first focal point. The wet headrace visibly approaches the wheel; the dry loading apron, smallest bridge and a short reach of tailrace form the second read. Avoid framing the roof off-screen just to center the bridge.
- **Service-crossing view (same zoom):** the timber deck, both dry landings, adjoining route and actual below-deck water must fit in one frame. The lane remains legible under the hero, companions and ordinary ground shadow; show no more decorative railing than this camera can use.
- **Culvert view (same zoom):** the existing northern road remains the dominant continuous surface, with visible creek entry/exit and masonry only where support makes sense. The culvert must not look like an independent wide bridge or a new road junction.
- **Region overview:** source reaches the north edge, joins the existing stream and pond, and the tailrace meets the one main river. Both canonical regional bridges remain separately identifiable. Check the farm road and northern road against current #824, not against an older screenshot-specific trace.
- **Night framing:** review the **same real camera target** as day; do not accept brightness or lamp positioning assessed from a different viewpoint. Dawn/dusk are a transition-sanity check, not grounds for inventing another permanent light.
- **Scale logic:** the local timber bridge's provisional source geometry is ~62 world units wide, deliberately closer to a farm spur than a strategic freight crossing. Width is not an artistic license to resize the collision aperture; if party traversal needs a change, adjust the real road/deck/collision together.

### Focused creative-direction gate before engineering and final art gate

**Designer specification gate — GO (this addendum):** The player journey, geography, material language, functional relationships, bounded decoration, nighttime hierarchy and neighboring-PR ownership are all resolved. No additional broad questionnaire or speculative alternative scenery is necessary; engineering may implement/correct the existing candidate against RM-01–RM-09. This is approval of the *design*, not a claim that current pixels already satisfy it.

**Independent implementation/art gate — HOLD until evidence:** The engineer must inspect **genuine current-head output** for at least daytime and night mill frames, daytime/night timber bridge, daytime culvert, and a sourced regional water/road overview. Inspect full scene and 150% cropped phone landscape; include a real Pixi scene/parity check or explicitly record that as a blocking gap. A test script, static mockup, older #813 image or automated nonblank check is not perceptual verification. Grade every RM-01–RM-08 criterion **PASS, FIX or UNVERIFIED** and repair actual deficiencies on this same PR before calling it creatively finished.

**Functional gate:** Independently verify full deck traversal (including both landings), wading/crossing behavior at the new shallows, legitimate road passage over the culvert, lane-to-door access with companions, repeated v4 restores, preserved owned structures, original main-bridge IDs/route indices and unchanged quest/monster/tribute totals. Focused checks and controlled measurements are appropriate; an unsolved relevant failure blocks merge. Both renderers must preserve useful combat visibility and the bounded CPU/rendering budget.

**Merge/publication disposition:** A designer GO is **not permission to bypass these gates**. After all relevant source, visual and cross-PR checks pass at an exact commit, assess whether merging automatically publishes to Pages and honor the repository's release-control requirements. Actual installed-phone aesthetics remain a separate owner/device-verification stage. No second PR, full-game feature expansion or comprehensive suites are authorized by this addendum.

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

**Current proposed implementation coordinates** are an engineering candidate, **not yet validated on all seeds/saved games**; independent checks still have to verify visual and collision clearance of today's farm lane, 16 route lines, actual saved world objects, protected enemy homes, or player buildings. The implementation must create the *shortest valid connection* while preserving existing crossings, plot access and selected local bridge.

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
| **F. Night** | same scene, deep night, Canvas and Pixi | Cool moonlit ground, the inherited mounted entrance fixture and one convincing warm light pool; any optional sluice inspection fitting is ordinarily dark, local water reflection, readable actors/road/wheel |
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

## 6. Engineering implementation: staged, bounded and still requiring acceptance

| Package | Owner's actual problem solved | Necessary proof and handback |
| --- | --- | --- |
| **E0: Survey** | Current positions are references, not a real planned crossing | Exact-head current region/150% camera frames and map with bank polygons, road intersections, existing bridge and owned-structure zones; choose upstream edge versus spring **based on protected routes** |
| **E1: Geographic master** | Blue ribbons/pond overlap, dry weir, cutoff creek, fake crossing | Single source-owned 2D water boundary/union for rendering and collision; connected headrace/tailrace/main-river mouth, one true local service crossing and any required upstream culvert; same legal traversal both sides |
| **E2: Architectural master** | Generic workshop + roof/wood/material contradictions | Rebuilt watermill from one coherent facade/roof construction contract; proper wheel placement and support; consistent collision/visual footprint; compare hero scale and main frontage |
| **E3: Landscape and light** | Scattered work props, missing lantern, flat night composition | Organize existing mill props; bank materials, modest plants and two authored fixture bodies/states; coordinate #808/#809/#812 and held #803, don't globally alter nighttime systems |
| **E4: Focused correctness** | Attractive painting can still break a route/save | Matched Canvas/Pixi and phone-landscape previews, local route/bridge collision and actor/companion passage, protected stored sites, repeated v4 save/reload, forest/road/home clearance, focused renderer/CPU checks |
| **E5: Owner presentation** | Prevent another “audit the audit” cycle | Compact day/night before/after contact sheet, mapped flow/crossings, clear test/failure status, retained identities, exact commit and pending device verification; owner accepts/rejects actual playable scene after independent quality review |

The current implementation keeps E1–E3 together on **this same PR #814** as requested; future corrections should remain here, not fragment into new PRs. Use **original world geometry and source-defined data**; do not create a screenshot-specific painted patch. E4 validation and E5 owner-facing evidence remain in progress. Comprehensive suites, merging, deployment and physical device acceptance are separate gates.

### Preservation / regression contract

- Keep 'mill-pond', 'bridge-north', 'bridge-south', existing pond/treasure/tribute and quest identities stable. Do not restore the historical eastern farm pond: merged #820 has replaced that former water disc with Thornfang's dry wolf-scout homestead. Do not add additional river objectives.
- Preserve v4 save handling, historical scene migration, player-authored structures, paid Barracks, current work orders and their actual destinations. New water must not silently delete, teleport or trap retained objects.
- No change to four hero classes, combat, monster counts, homes, encounter density, Thornfang/Mira patrol, Scornfang's Treasury, reward/tribute budgets, training or Field Lab mechanics.
- Maintain a single water/bridge collision authority for painting, route planning, hit testing and NPC/party movement. A decorative bridge that remains impassable is not a fix.
- Avoid more permanent animated/water/particle work per frame than necessary. Prefer compact static shapes, reused art/material families and bounded existing lighting. Measure any meaningful graphics-cost increase rather than assuming CPU performance.
- Preserve alternative renderer recovery and Canvas fallback, as well as existing Optimization Mode meaning.
- No bulk terrain or global art family changes in another region; coordinate changes to shared renderer functions with their active owning branches.

## 7. Responsibility, dependencies and status ledger

**Current deliverable:** the design-first RM-01–RM-09 specification is approved for bounded engineering; it supplements the original WD-01–WD-12 design. The existing candidate remains **implemented but not yet creatively accepted** in this same draft PR. The source changes now author a shallow connected northern tributary, a local service deck/culvert, a redrawn mill, practical entrance lighting, revised water-paint order and one-time additive old-save reconciliation. Focused source and rendered scene checks are required before declaring this ready for merge. The original screenshot establishes perceptual defects, not numerical bridge widths or world coordinates. The 52–64 bridge width and 60–70% wheel proportion are design-starting ranges, not tested or locked runtime metrics.

**Engineering responsibility in this authorized PR:** refine the present water/road/bridge coordinates where checks expose collisions, compare actual rendered scenes, keep historical state safe, run focused checks/build and provide usable day/night evidence. Do not call it merge-ready until concrete blockers are resolved. The owner will evaluate the personally played result after merge/publication.

**Implemented in draft PR #814 (source changes, not yet validated):** Greenwood's new shallow headwater reaches the northern map edge; the mill service lane crosses a physically passable local timber deck; the **current dry eastern Thornfang homestead** and two canonical river bridges remain (the earlier eastern-pond statement is superseded by merged #820). The watermill is rebuilt using one consistent roof, walls, material grammar, wheel hardware and mounted doorway fixture; water paint is reconciled with the main river; a one-time marker upgrades older saved scenes. Scoped source checks and a native 150% scene-capture script have been added. **Testing and perceptual acceptance:** pending exact-head evidence and inspection. **Merged / published / device-verified:** no. Independent visual review must not be represented by merely adding a screenshot-generating script. Draft design review may proceed without requiring the owner to answer a broad set of creative questions.

### Direct references

- [Source: Greenwood regional geometry](../src/prototype/greenwood-landscape.js)
- [Source: visual mill and sluice composition](../src/prototype/visuals.js)
- [Approved art direction, including W01–W06](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md)
- [Greenwood masterplan](GREENWOOD_REDESIGN_MASTERPLAN_20261029.md)
- [Original hydraulic bug report #641](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/641)
- [Road design #807](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/807), [botany design #808](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/808), [night design #809](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/809), [lantern design #812](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/812)

**Handoff disposition:** Engineering implementation has begun with the owner's explicit go-ahead on 5 November. **HOLD merge/publication** until the engineer has reviewed actual rendered evidence, repaired relevant failed checks, and demonstrated focused route, save and Canvas/Pixi safeguards. The owner will judge final appearance personally in the *live game* after a separately controlled merge/publication, and iteration can continue from that feedback.
