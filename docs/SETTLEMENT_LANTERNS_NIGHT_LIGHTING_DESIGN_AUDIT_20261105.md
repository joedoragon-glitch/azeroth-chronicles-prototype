# SIBDLP — Settlement lanterns and night lighting: independent game-design audit

**Date:** 5 November 2026  
**Discipline:** environment art direction / nighttime visual composition; **design only**.  
**Status:** **Design audit completed; corrected art-direction brief ready for visual-concept review and then engineering. Not an owner-approved final rendered appearance.**  
**Related engineering prototype:** [draft PR #803](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/803) (head `14a14134556d094e42434aa6ae5c3638aeb067f0` when inspected). **HOLD**: this prototype predates the present review; its green source/renderer checks do not establish artistic approval.  
**Source evidence:** owner's three nighttime in-game screenshots in the 5 November 2026 conversation; current `main` and draft #803 `visuals.js`, `renderer.js`, `pixi-experimental.js`, native WebGL core and Pixi scene bridge; [previously approved roadside-lantern handoff](../tools/sprites/design-handoffs/approved-art-decoration-roadside-lantern.json); [Greenwood identity proposal](GREENWOOD_VALE_PIEDMONT_REGIONAL_IDENTITY_DESIGN_BRIEF_20261028.md). Conversation attachment URL and immutable image hash are unavailable; do not invent them.

## 1. Designer's verdict

The game's lantern problem is **not merely incorrect placement**. Earlier nighttime rendering drew bright roof-level window rectangles regardless of whether windows existed at those positions, and painted a separate yellow rectangle over a roadside post; this broke the fiction of a physically built, believable place. PR #803 improves the coordinate association but still treats most lamps as interchangeable small polygon badges. The scene needs **authored light fixtures and authored light behavior**: silhouette, physical supports, material, glass depth, warm core, restrained local spill, and meaningful differences among homes, workshops, refuge, and public streets.

**Desired visual promise:** *A sleeping Greenwood settlement where the public road remains safe to travel, the refuge beckons from its entrance, and individual houses/workplaces settle into darkness without losing their lived-in character.*

**Scope:** prioritize Millhaven and the first region including Orchard Hamlet. Review relevant existing streets and service types; design *protection*, not a blind re-skin, for other regions. The previously accepted Roadside Lantern identity remains binding: **keep its silhouette; improve glass panes, rim, hook and weathered post grain without simply increasing number or glow**. This is not permission to redo entire cottages, streets, mill structures, night rules, sprites, or new gameplay.

## 2. Evidence-based findings and design dispositions

| Finding | Visible/source evidence | Design correction | Gate |
| --- | --- | --- | --- |
| **D1 — Rooftop stickers, not lamps** | Owner screenshots show two warm rectangles in roof areas. Earlier `drawLightFixtures` drew two hardcoded panes above each `window` source. | **Remove invented night windows.** Attach any actual exterior fixture to a front wall, doorway jamb, beam or support post **below** the eave. Keep roof shingles and attic planes physically intact. | **BLOCK** |
| **D2 — Post glass overwritten** | Earlier roadside case used `fillRect(p.x - 5, p.y - 50, 10, 9)`; #803 replaces it with a flame but still needs material/art review. | Preserve recognizable existing lantern/post; design a recessed translucent lens inside the iron cage with a visible rim, cap, hook and subtle weathering. Light *comes through* that glass. No detached glowing plate. | **BLOCK** |
| **D3 — Refuge has an unconvincing light state** | A lit frame or nighttime halo can be disconnected from the visual fixture. #803 swaps a previous rest-lantern accessory for the generic house sconce. | Preserve a **distinct refuge entrance lantern**: plainly mounted at or immediately beside the door, consistently on during normal nighttime refuge service, with light catching the doorframe and threshold. Do not reduce it to an identical cottage badge. | **BLOCK** |
| **D4 — Closed workshops too lively or too uniformly lit** | Owner notes workers have gone home. #803 puts **two lit** identical sconces on every `workshop|smithy|forgehouse`. | Keep tool bays/work windows dark off-duty. One sheltered **security/wayfinding** exterior lantern where justified; a second installed task fixture may remain **unlit** until a genuine active work scene. Avoid symmetric matched bright lamps on each post by default. | **BLOCK** |
| **D5 — All regions copied from one stencil** | #803 calls one `wallSconce` for all five regional house and workshop variants. | Share hardware logic but not indiscriminate art direction. First-region designs use warm timber, aged iron and muted honey glass. Other regions retain their established silhouettes and materials pending their own regional treatment; avoid blanket aesthetic migration. | **BLOCK for current PR breadth** |
| **D6 — Services silently lose visible illumination** | Previous renderer generated `lantern` for rest, supplier, recruiter, quests, fountain, transport, smith, teacher and alchemist. #803 generates actual fixtures only for rest/supplier/recruiter/quests and drops others without a site-by-site assessment. | Make a **fixture inventory** from actual visible artwork and service hours. Essential after-dark wayfinding/usable services need a plausible mounted source, not generic light or unexplained darkness. Unstaffed/nonessential features can remain dark. Do **not** blindly keep every old phantom light. | **BLOCK** |
| **D7 — Effect uniformity, excessive glow and light through bodies** | Existing lighting treats most `lantern` sources as identical radius/alpha; effects render late in the frame; nearby lights are subject to a fixed cap. | Separate glass highlight, near-wall reflection, threshold/ground pool. Follow depth and occlusion rules; forbid a flame showing through a solid foreground object. Preserve street-post approved footprint and existing performance limits, and prioritize visible important lights. | **BLOCK for visual proof** |
| **D8 — A test can certify a bad-looking result** | #803 focused native tests check count, coordinates, save purity and GPU parity, not actual illustrated quality on the owner's screen. | Require **side-by-side actual composited captures** and a small design review before engineering passes. Numerical/syntactic success is necessary but not aesthetic acceptance. | **BLOCK** |

**Resolved at the design-document level:** the intended roles and corrections above are specified without requiring further owner troubleshooting or a new creative questionnaire. **Not yet resolved in executable artwork:** any #803 changes needed to meet this contract, nor actual visual acceptance.

## 3. Art direction: physically designed fixtures, not rectangles

Every accepted fixture must read in daylight **without an emission effect**. At the game's playable phone scale, its silhouette should distinguish a fixed post lamp from a hanging entry sconce. Use these elements, simplifying micro-detail before sacrificing the recognizable object:

1. **Attachment:** actual wall plate/bolts, curved iron arm or timber hook attached to a real structural support. It must sit on the correct **front-facing facade plane**; no lantern floating forward, sitting on a roof plane, or colliding with a door/window/chimney.
2. **Protective enclosure:** a small peaked/hooded cap with slight overhang, tapered lantern cage, visible top/bottom metal rims and at least one iron mullion. Avoid an isolated square pane, unbroken bright block or miniature duplicate of a street-post body.
3. **Glass and material:** dim, desaturated amber/smoky transparent glass in daylight; brighter flame-centered warm light at night, not a solid flat yellow fill. Show a faint second plane/edge reflection and simple grime/soot, respecting the art style and regional material.
4. **Hierarchy of light:** a tiny warm core **inside** glass; subtle reflected warmth against the nearby wall/post; a broader weak pool at the threshold or ground. These are not three separately visible yellow discs. Avoid sharp rectangular edges, concentric bright rings, constant overexposure or a daytime halo.
5. **Depth:** wall bracket behind its cage, glass inside its metal rim, spill behind foreground people/solid bodies as appropriate; source should not shine through opaque doors or roofs. The player may pass in front of the lamp without an orange rectangle painted on armor.
6. **Style and economy:** crafted and slightly irregular rather than geometrically naive or hyperrealistic. Clear contour at 100%, natural balance at 150%, still legible in landscape-phone 175%; do not pay for tiny unreadable rivets or animated GPU light textures.

### Fixture families and priorities

| Place | Fixture and placement | Night behavior | Scene role |
| --- | --- | --- | --- |
| **Street / crossroads** | Existing protected tall timber post, forged hook, tapering caged glazed lantern; no new poles or moved road blockers | Reliable town wayfinding. Strongest civic outdoor cue, **without increasing the approved post-glow footprint or fixture count**; gentle ground wash beneath | Connect route junctions and entrances without a glowing carpet |
| **Millhaven Refuge / Orchard refuge** | More recognizable sheltered metal-and-timber hanging lamp fixed to the **entrance-side** post or door lintel; clear space for player approach and labels | **On at night**, a warm readable entrance cue; small glow across doorway/threshold, not through wall or roof | Welcoming sanctuary, visually distinguishes refuge from private home |
| **Ordinary cottage** | One compact crooked wrought-iron sconce by the **actual door**, not a roof-window replica; make bracket visible in daylight | Dimmer than refuge and street lamps; town context should not demand every cottage burning all night. Keep panes dark and sleeping interior believable | Quiet human-scale domestic detail |
| **Workshop / smithy** | One outdoor security lantern on *useful access-side* timber support; optional second **unlit** task fixture where architecture justifies it | Off-duty work bay, tools and windows dark. No two continuously glowing equal lamps by default; forge/work fire only if its **real active** work state calls for it | Practical closed workplace, not an apparently running factory |
| **Market/service stalls** | Lamp hanging from their **existing** awning, beam or service post, not a post randomly offset from NPC center | Light only on a genuine fixture; if service remains player-usable after dark, its entrance/interaction cue must remain intelligible | Avoid invisible services and phantom lamps |
| **Guard or emergency service** | Site-specific sheltered public safety fixture if existing design supports one | Maintain essential wayfinding at night without blanket atmospheric saturation | Functional safety and readability |
| **Grave lamps, carried Wraith lanterns, forge flames** | Keep accepted distinctive objects and state ownership | Preserve existing grave/site/wraith behavior unless a separate visual defect is demonstrated | Not interchangeable cottage or post lights |

**Regional identity:** implement Millhaven/Greenwood first. The future equivalents should use locally credible materials (e.g. salt-worn fittings in wet Marches, more wind-sheltered iron in Highlands, repaired hardware in Frontier, severe dark forged frames in Crown), **not** automatically apply one Greenwood silhouette to all buildings. These are visual guardrails, not permission to author regional lore or replace assets now.

## 4. Nighttime composition and states

- **Day:** architecture and opaque daylight glass remain visible; no universal yellow pane or radial glow. The same physical lantern remains in place rather than spawning at night.
- **Dusk:** local amber core gradually emerges with existing daylight transition; wall/threshold begin reflecting it while the surrounding evening color survives.
- **Night:** road lighting supplies continuity, refuge provides the welcoming focal point, cottages supply occasional modest secondary accents, workshops are mostly asleep. **Leave actual dark gaps**; no endless rows of equally bright orange circles.
- **Dawn:** reverse fade without visible snapping, ghost remnants or instant wall replacement. No universal flicker, pulsing, particle storm or new saved time flags.
- **After-hours distinction:** use already established world/visual states where available; if no worker schedule exists, choose **static conservative exterior security lighting** rather than inventing labor AI or implying work. Cottages need no new occupancy system.
- **Color:** honey/amber inside lanterns against Greenwood's cool green-blue nocturnal palette; warm reflections are weaker and less saturated than the flame itself. Avoid fluorescent lemon-yellow blocks. Preserve special spectral colors for Wraiths and other distinct existing lights.
- **Legibility:** players must read doorways, paths, interactable refuge and the Paladin/companions at intended 150% camera without needing an unrealistic floodlight.

## 5. Explicit design corrections to engineering draft #803

**Keep** the correct idea of one observation-only fixture contract for Canvas and Pixi, consistent source/glass anchors, saved-world invariance, daylight unlit state and removal of pasted rectangles. **Do not merge #803 as-is** for the following reasons:

1. **Replace one-size-fits-all `wallSconce`** with four deliberately distinguishable fixtures/material choices (road, refuge, domestic, workshop/service). Use existing accepted post master instead of redesigning it from scratch.
2. **Reconcile fixture count and active state per site.** A closed workshop may physically have two fittings but should normally light only the useful outdoor one. Do not automatically light every building in every region.
3. **Audit actual service identities.** #803 drops previous artificial glow for several named NPC categories. Restore plausible visible and illuminated *real* fixtures where navigation/service design requires them; no invented extra stand, and no indiscriminate return of fake overlays.
4. **Connect real art and emitted light exactly.** Validate the reference point after actual world scale, direction, camera zoom, facade orientation and depth. **Do not use a coordinate-only unit test as evidence of fixture placement on the displayed body.**
5. **Compose warm light in layers** (glass core, restrained contact reflection, weak practical falloff) while retaining street-lamp count/intensity constraints and bounded GPU/CPU work. Do not change combat sight, enemy detection, collision or saves.
6. **Protect all non-Greenwood regions, special lanterns, and the Canvas fallback.** Any already introduced multi-region candidate must be reviewed as an isolated design effect before acceptance; otherwise narrow the first art pass to the opening region.
7. **Retain the Wraith-carried fixture exception.** Never create a duplicate hand lantern or incorrectly darken the real carried light.

## 6. Design-review storyboard and acceptance

A designer must review the actual composed scene, **not only an isolated lamp swatch**:

| View | What must be evident |
| --- | --- |
| **A — Millhaven at daylight** | All fixtures mounted on credible supports, no roof/window ornaments accidentally resembling lamps; facade, window and door readable. |
| **B — Same Millhaven view at deep night** | Refuge is lit and inviting; cottages quiet; street posts integrated with glass, subtle local pools and readable path; no rectangular overlays. |
| **C — Workshop, daylight vs night** | Workshop's support brackets and roof plane coherent; outside safety lamp only as justified; work area dark without turning the shop into a floodlit stage. |
| **D — Roadside post close-up** | Approved silhouette, hardware/glass layers and timber grain survive; center source **inside** body, no sticker in either renderer. |
| **E — Orchard Hamlet / nearby homes at night** | Village variation and dark negative space; no identical clusters of lit windows or synchronized orange lamps. |
| **F — Service site coverage** | Refuge, supplier, recruiter, quest service and any genuinely active after-dark transportation/specialists audited individually; no missing essential light and no phantom post. |
| **G — Dusk and dawn** | Lighting follows the existing day-night progression without flicker or leftover bright windows. |
| **H — Other-region safety comparison** | Existing Marches/Highlands/Frontier/Crown identities and distinct special lanterns are not made into Greenwood clones or darkened by accident. |

For A–H review **Canvas and Pixi** at normal and Optimization Mode as applicable, at least standard/150% and phone 175%, and compare the **same game world view** before/after. Check actor occlusion, service interaction/readability, no z-order weirdness, dark glass, no unbounded GPU texture creation or large CPU regression. Captures on hosted Chromium/SwiftShader are not device verification; the owner's actual iPhone remains a later explicit acceptance check.

**Pass condition:** visually believable physical fixture even in daylight; after dark, every bright source is in its own glass and is justified by site use; scene balances warm, cool and dark; one look tells a player where the refuge and safe road are. **Fail:** a warm rectangle added over finished art, a post duplicated, exterior lamp sitting on roof, off-duty workshop washed out, all regions homogenized, invisible essential service, or green tests with noticeably poor artwork.

## 7. Scope and ownership handoff

- **Completed here:** source/screenshot-based designer audit, issues D1–D8 classified, corrected artistic direction, fixture families, light hierarchy, scene storyboard and engineering constraints. No new owner decision is required to settle these design recommendations.
- **Not completed:** approved visual prototypes actually displayed at native scale, owner art acceptance, #803 corrections to artwork/lighting code, tests against that future art, merge, publication, physical-device verification.
- **Current gate:** **DESIGN-READY / ENGINEERING HOLD**. The design handoff is suitable for developing visual candidates. The existing code draft is *not* artistically approved and must not merge because a focused test passed.
- **Next engineering handoff when design visuals are accepted:** revise #803 (rather than create duplicate runtime PRs), compare approved pre/post images in both renderers, maintain the reviewed streetlamp sprite source, document exact tests and rollback. No broad test suites, merge or deployment without separate authorization.
- **Dependencies:** current `AGENTS.md`, [Design-to-sprite workflow](DESIGN_TO_SPRITE_WORKFLOW.md), existing [roadside-lantern handoff](../tools/sprites/design-handoffs/approved-art-decoration-roadside-lantern.json), relevant regional artwork references and actual `main` when implementation resumes.

This document is a design audit with self-contained corrections, **not** a claim that every proposed new lamp appearance has been visually accepted by the owner.

## 8. 5 November engineering continuation — in-game owner acceptance

**Later owner authorization supersedes the preliminary artwork-before-engineering hold above:** the owner explicitly wants the design transferred to professional engineering, with a high-quality implementation made merge-ready so that the **only creative appearance acceptance is the owner's own live playtest after merging and publication**. Do not require standalone image approvals, mock-up ballots or further owner screenshots before proceeding. The professional engineering gate remains strict: physically coherent fixture art, appropriate night activity, native Canvas/Pixi behavior, focused tests and offline build, and no unsolved material source/performance regression.

The new implementation belongs to [PR #821](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/821), branched from current `main` rather than merging the stale draft #803. As implemented in the candidate source, Greenwood has a stronger dedicated refuge sconce, one exterior workshop security lamp, a modest cottage sconce (with deterministic partly unlit homes), genuine attached market lamps, and a sculpted roadway fixture with an inner flame. Actual other-region refuge/stall fixtures and the wagon lantern remain observable, without stamping the Greenwood domestic fixture everywhere. The night halo now uses per-role brightness and radius through both renderers; no new saved state, combat effect, collision or runtime texture registration was introduced.

**Status distinction:** this is an engineering candidate, not proof of owner artistic acceptance or iPhone physical appearance. A passed technical gate authorizes release review; any further artistic corrections after the owner sees the published game are ordinary iterative fixes, not a previous stage being silently relabeled accepted. Do not declare the owner approved the final appearance merely because source tests pass.

## 9. Release receipt — 5 November 2026

**Later authoritative status:** Engineering [PR #821](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/821) was merged in current `main` at `58a34e441208f3d83992adda9daf19ff81a3d111`, and [main focused validation and GitHub Pages deployment #41997921617](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41997921617) **succeeded**. This supersedes the earlier *draft/HOLD* statuses above, which remain preserved as dated audit history. The owner explicitly chose to judge final visual appearance in the actual published game rather than approve isolated previews. Physical iPhone installation/visual quality are **not** established by the CI run. The separate paired CPU comparison was still in progress when this receipt was written. Technical implementation and tests passed; owner creative acceptance is still pending live play.

## 10. Cross-region precedent — owner direction, 5 November 2026

**Owner direction:** The Greenwood/Millhaven lantern treatment is the **first regional iteration**, not a global retrofit or permission to copy a single lantern appearance into every biome. The owner will personally review the opening region in the **live game** and supply iterative feedback. Only after completing that region's review will the owner move to the next region, then the next, one at a time. This phased progression is a deliberate, historically useful precedent for SIBDLP's regional art-quality work.

**What future regional passes may reuse:** The professional workflow—owner screenshots and live observation → game-design audit of physical fixture design, facade attachment and local nighttime composition → recorded region-specific visual brief → isolated engineering with shared Canvas/Pixi source anchors, bounded lighting cost, save safety and focused tests → merge and hosted publication → owner live visual acceptance and follow-up iteration. Keep actual source/PR/test/deployment receipts and record what the owner did or did not accept. Handle each region's corrective work autonomously without burdening the owner with GitHub or repeated technical approvals.

**What must not propagate automatically:** Greenwood's exact materials, sconces, count or proportion of lit houses, refuge/streetlight balance, workshop states, glow color, glow radii, or acceptance judgment. Protect existing approved regional silhouettes, lore, navigation and special lights until that region is visited and individually evaluated. Only promote a truly shared engineering improvement after verifying it does not flatten regional identity or regress other scenes.

**Sequence:** (1) Gather the owner's actual live Greenwood feedback and correct deficiencies; (2) maintain Greenwood acceptance and release record; (3) await the owner's transition to the next region; (4) repeat a new **region-scoped** audit and implementation with that region's own artifacts and verification. A technically shipped release does not count as an owner-accepted visual design.

**Current checkpoint:** PR #821 is merged and hosted; first-region owner appearance review is beginning and is **not yet complete**. No next-region visual changes are authorized by this note. This policy should guide later regional reviews without treating SIBDLP as the separate SIBDL project.
