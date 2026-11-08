# Dark Crown natural landscape — parallel workstream, source ownership and integration gate

## Current implementation and acceptance — 8 November 2026

The approved reference pair is **Craters of the Moon, Idaho (primary)** and **Newberry, Oregon (complementary)**. All sixteen owner selections and their written blends below remain binding. #794 supplied the field model now integrated into #769. The exact audited head is `47b00c1` (runtime dev.286). The design questionnaire is complete. The natural landscape is playable in the draft and still requires visual acceptance and performance correction.

| Decision | Evidence on the draft | What remains before acceptance |
| --- | --- | --- |
| NL01 Dark basalt, green islands, secondary ashy high desert | World-coordinate age, cinder and soil fields, with clustered older-ground vegetation | Confirm all three reads in a single walked regional sequence. |
| NL02 Broad rounded lobes | Seven authored overlapping flow lobes in `dark-crown-landscape.js` | Verify rounded edges frame islands and remain visible under game zoom. |
| NL03 Layered ridges and walkable open ground | Crownwatch basalt shoulder, native walking checks | Review depth and skyline composition; strengthen weak silhouettes without adding collision. |
| NL04 Charcoal, slate and subdued violet | Low-saturation pigment formula | Inspect exposure and color in both renderers, day and night. |
| NL05 Gradual weathering and drifting ash | Age blending and shared corner gradients | Verify legible young-to-old flow transitions; localized drifting ash remains unverified. |
| NL06 Three or four memorable islands | Exactly three named, authored habitat footprints | Walk through each and check that it reads at landscape-phone scale. |
| NL07 Western and southern emphasis | Southwest and southern-fold sites plus the Ash Refuge perimeter | Verify route order and separation in play. |
| NL08 Golden bunchgrasses and sparse flowers | Site-filtered bunchgrass and occasional wildflower placements | Check density and visibility against rock without a uniform grass carpet. |
| NL09 Small sheltered conifer clusters | Pine candidates restricted to older cores of the two distant islands | Verify final placed silhouettes and shelter, including representative seeds. |
| NL10 Ropes, clinker/fractures and granular cinders | Fracture strokes and cinder grain in the painter | Ropy lava and distinct jagged clinker silhouettes are not separately established. Add or strengthen these only where the source and walk show a gap. |
| NL11 Crownwatch integrated into old shelves | Painted north shoulder, existing streets and city footprints | Walk the city reveal and check that basalt reads as a foundation rather than a detached patch. |
| NL12 Ash Refuge wild island | A dedicated older-ground island and a separate cultivated courtyard | Verify wild-to-domestic contrast on foot. |
| NL13 Industrial scoria, rust and ash margins | Regional mineral and oxidation fields, protected hot works and freight corridors | Check the margin at glassworks, ceramic works and Foundry; add local treatment where generic ground persists. |
| NL14 Heat-scarred roost to cooler pioneer margins | Protected roosts, heatwork exclusions and separate communal roost art | Verify the visible ecological gradient and absence of greenery in active hot cores. |
| NL15 Cool dry night, occasional local ash and geothermal shimmer/warmth | Night captures and existing localized practical lighting | Verify cool open views, subtle effects and warning readability. Localized ash and shimmer remain unverified. |
| NL16 Civilization → lava → refuge rhythm | All three scene types exist and native routes are available | Capture continuous transitions; isolated screenshots cannot establish pacing or composition. |

The active outdoor T005 surface is retired in the draft. Its approved source PNG and rollback record remain. The 2,304-tile field check, native route and restore checks, and terrain-only pixel comparison establish technical behavior. They do not certify the above visual decisions. Keep the original molten divide, exactly two main bridges, the game's fantasy architecture, combat warnings, and v4 saves. Read the [current completion plan](DARK_CROWN_AUTONOMOUS_IMPLEMENTATION_AND_ADVERSARIAL_AUDIT_20261103.md#current-completion-register) for sequencing and the release hold.

The following November 4 priority, review and isolated-model statuses are historical. Current execution and integration status is above.

## Historical owner priority and design-review gate — 4 November 2026

**LATEST OWNER PRIORITY OVERRIDE.** The owner is now prioritizing **the version 0.9.2 release**, the **portrait-versus-landscape / new-default orientation work** and improvements to the **first game regions, including UI and menus**. These are collectively higher priority than the broader Dark Crown regional overhaul. Do not pull attention or source/build/deployment resources away from those release-critical efforts, infer a new release schedule, or suggest Dark Crown is a prerequisite for 0.9.2. Existing PR #769 remains a separate ongoing but subordinate regional overhaul; do not impose a new stop order on unrelated chats beyond respecting this explicit priority.

**This natural-landscape chat's design questionnaire is now COMPLETE (16/16 owner choices submitted); further engineering integration remains ON HOLD.** Keep its existing draft [PR #794](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/794) and isolated code foundation intact, but **do not start additional renderer, material-manifest, terrain placement, city/road, shared-source, generated-bundle or deployment edits** just because a prior work plan lists them. The owner's immediate purpose is to make a comprehensive batch of **authorial visual/environmental decisions** efficiently, then leave them ready for later implementation when priorities permit. The owner has **not** approved integrating #794 into #769, merging to `main`, releasing, full test matrices or changing any already accepted #707 architecture.

**Authorial decision workflow approved by the owner:** one question at a time, **exactly four thoughtfully distinct choices** (A–D), optional freeform feedback and Previous/Next navigation; at the end show all answers for review and **one explicit Submit** action. Unanswered/partial answers must remain visibly unresolved rather than be assigned a hidden default. On submission, treat the chosen options **plus freeform comments** as the owner's decisions; if a note modifies or contradicts the selected letter, preserve the note and flag that conflict for reconciliation instead of silently discarding it. Then record the exact answer set, timestamp/decision authority and any genuinely unresolved choices in the current #794 workstream and notify #707/#769 as appropriate. **Historical workflow note: before the 4-November submission, choices and recommendations in the questionnaire were proposals; they became accepted art canon only with the submitted 16/16 answer set recorded below.** A submitted survey is design input, not permission to resume engineering, merge or deploy.

**Survey boundaries:** Do not revisit the already accepted Craters of the Moon (primary) + Newberry (secondary) North American geological inspiration, the existing civilization's independent fantasy architectural identity, the fictionally molten original lava barrier and two bridges, the planned retirement of only the active outdoor Crown T005 ground texture with asset rollback retained, the broad vegetated-island ecology requirement, or existing world/quest/hero/save constraints. The questionnaire is about *how* to execute the natural design, not whether to reverse these settled decisions or assert a literal US biome/species canon.

**Sixteen design decision axes for the completed review** (all sixteen have owner-approved selections in the binding register below): NL01 first overall natural impression; NL02 major flow orientation/composition; NL03 nonblocking volcanic ridges/relief presentation; NL04 mineral color balance; NL05 visible rock/ash/flow-border transitions; NL06 major vegetated-island number/scale; NL07 islands' dominant spatial placement; NL08 vegetation character; NL09 rare tree silhouettes; NL10 fine geological signature; NL11 Crownwatch natural-to-crafted edge; NL12 Ash Refuge perimeter ecology; NL13 industrial/Foundry wildland margin; NL14 Cindermaw and Ash-beast habitat edge; NL15 atmosphere/day-night natural setting; NL16 open-space versus detail-density and route readability. Four-option cards and optional remarks are presented in the active chat with a final review/submit step.

**Truthful current phase status:** Stage 0 isolated deterministic field model/test already implemented in #794; the test body passed an isolated V8 Node-compatibility shim, but **not original Node, CI, playable Canvas/Pixi, real timing, device or artistic acceptance**. **All substantive island geography, natural painter, main-map integration and T005 deactivation remain NOT IMPLEMENTED.** #794 remains draft/unmerged/unpublished. Design questionnaire completion will not by itself satisfy gameplay/renderer verification.

---

## Binding landscape authorial choices — owner-submitted 4 November 2026 (NL01–NL16)

**Status: DESIGN APPROVED, 16/16 RESPONDED; no unanswered selections.** This register records the owner's *submitted* options and notes, not speculative proposals. It is jointly authoritative with the earlier 4-November natural-geology approval in [PR #707](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/707). When an option's description is broad, the owner's note is controlling; implementation-level geographic coordinates, exact 3-vs-4 island count and precise scene compositions remain engineering/art-placement decisions based on actual source-native survey, **not unanswered owner questions**. Keep already approved roads, lava, city, 15 thermal works, waterwork reservations, Foundry, NPCs, loot, four classes and v4 saves intact.

| Decision | Choice | Approved visual direction | Required reconciliation |
| --- | --- | --- | --- |
| NL01 | **D** | Dramatic dark rock interrupted by striking islands of vegetation | Add a reasonable secondary C: weathered ash-and-basalt high-desert ground, appropriate to an Ash-beast region. |
| NL02 | **A** | Broad rounded flow lobes spreading around older ground | Do not substitute uniformly tiled noise or new collision features. |
| NL03 | **D** | Layered ridges alternating with broad, walkable open ground | Represent relief visually; preserve real walkability. |
| NL04 | **A** | Charcoal and cool slate with subtle violet undertones | Restrained violet, not all-over luminous purple. |
| NL05 | **B** | Gradual, softened transitions covered by drifting ash | Young/old flow differences remain geological and readable. |
| NL06 | **A** | Three or four large, memorable green islands | Three or four is the accepted range, not a decision to add every small island. |
| NL07 | **C** | Primarily in the distant western and southern wilderness | The Ash Refuge-adjacent island in NL12 is counted within NL06's three or four, not a fifth. |
| NL08 | **B** | Golden bunchgrasses with occasional small wildflowers | Hardy sparse natural cover, not uniform grassland. |
| NL09 | **C** | Tiny sheltered groups of hardy conifers on a few older islands | No woodland carpet or new imported species canon. |
| NL10 | **D** | Ropy lava, jagged clinker/fractures, and granular cinders/ash/stones, each varied by geological area | These are three geological detail families, not equal noise everywhere. |
| NL11 | **C** | The city visibly rests upon and incorporates old basalt shelves | Do not alter existing physical collision or building footprints casually. |
| NL12 | **D** | A recognizable vegetation island just outside the inhabited area | Count the nearby island among the three or four major ones; retain cultivated domestic gardens as a separate category. |
| NL13 | **B** | Rough dark scoria, rusty minerals and ash-darkened margins | Keep existing industrial workyards, heatworks, freight and route readability. |
| NL14 | **D** | An intense, heat-scarred core gradually giving way to hardy plants | No greenery in active hot roosts; plant pioneers only in cooler protected margins. |
| NL15 | **A** | Clear, dry vistas with cool, subdued mineral colors at night | Add reasonable B occasional localized windblown ash and reasonable C subtle heat shimmer/warm light near geothermal sites; never obscure gameplay telegraphs. |
| NL16 | **D** | A deliberate rhythm of civilization, open lava country and vegetated refuges | Natural geography must form scenic journeys rather than repeated static texture. |

**Verbatim owner feedback on blended options:**
- **NL01, selected D plus C:** “With a reasonable amount of  C, after all, we don’t have ash beasts for  nothing, lol”. This adds an appreciable weathered ash/old-basalt high-desert *secondary* presence to the predominantly dramatic-dark-rock/green-island first impression. It is **not** authorization to replace the island design with uniformly barren ash, make the whole region an ash storm or invent new Ash-beast ecology/gameplay.
- **NL15, selected A plus B and C:** “With some reasonable b and c”. This makes clear, cool-toned nighttime visibility the **default**, with **occasional localized ash drift** and **subtle site-specific geothermal warmth/shimmer**, subject to combat/route/UI legibility. It is not consent to constant particles, fog, overbright lava effects or a dynamic weather simulation.

**Authorial reconciliation across apparently competing items:** NL06's **three or four** major vegetated islands and NL07's **primarily west/south** position remain fully effective; reserve **one of those same three or four** immediately outside Ash Refuge under NL12. The other islands favor outer western/southern wilderness, with small pioneer pockets elsewhere permitted by the already approved ecology. NL08's golden grasses and occasional wildflowers dominate the sheltered grassy portions; NL09's rare grouped conifers are limited to the coolest old islands. NL13's rusty industrial rock and NL14's heat-scarred creature core intentionally stay more barren. NL11's old basalt shelves are a *visual and architectural* relation, not permission to move collision geography.

**Surviving constraints:** The earlier Craters of the Moon (Idaho) primary / Newberry (Oregon) secondary *natural* references, unusual permanently molten fantasy central channel, exact two original bridges, region's thriving independent fantasy civic identity, original main and Foundry identities, T005 active-outdoor-ground **planned retirement with source PNG retained**, world-anchored deterministic procedural rendering, Canvas/Pixi/short-wide phone legibility, CPU/GPU budget and v4 save compatibility still bind. No cultural transplant, no new loot/ecology simulation, no broad runtime rewriting. These answers settle **appearance and placement principles**, not executable art.

**Current owner priority gate:** 0.9.2 release, portrait/landscape orientation and first-region UI/menus take precedence. Further #794 natural-landscape implementation and integration remain **ON HOLD** until renewed authorization. The standalone deterministic model and its shim-tested focused logic already exist on this draft; the authored island locations, procedural painter, T005 active deactivation, actual native Canvas/Pixi visual QA, performance benchmarks, merges, publication and physical iPhone acceptance remain **NOT DONE**. The design submission does **not** authorize any of them.

---

**Game:** So I Became the Dark Lord's Problem (SIBDLP)  
**Established:** 4 November 2026  
**Dedicated branch:** `feat/dark-crown-natural-landscape-20261104`  
**Source baseline:** active Dark Crown [PR #769](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/769) head `8995548d0b372e28ff68dfd4a507eff451d36cf8` at branch creation. Target the **lead feature branch**, not `main`.  
**Owner decisions:** [PR #707](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/707), authorial design amendment commit `070b784c84525a19e6d1a7d819f325cccefce306`.  
**Status:** bounded engineering **foundation implemented in isolation**; **not integrated into runtime**, no source-native render, visual acceptance, main merge, deployment or physical-device verification.

## Objective and nonnegotiable design

Reconstruct **all outdoor natural terrain and wild vegetation** of Dark Crown at serious regional scale. The primary natural-setting analogue is **Craters of the Moon, Idaho**, complemented by **Newberry volcanic terrain, Oregon**. Make legible cooled basalt flow histories, overlain lobes, fractured clinker, cinder/ash flats, oxidized rock, subdued obsidian, rocky rims, and true kīpuka-like older vegetated islands. Differentiate bare new flows, intermittent pioneers, older shrub-dominated ash, sheltered vegetal remnants and limited wind-shaped conifer-like silhouettes. Natural geology sets the environment **beneath** the fantasy civilization and does not transplant American buildings, settlement history or species canon. The continuously molten original lava channel remains an intentional fantasy extrapolation, not geologically representative of those North American sites.

Keep the existing Dark Crown's distinct civic/artisan/military/industrial identity, Crownwatch, Ash Refuge, Foundry, Cindermaw, all two original main lava crossings, local dry gaps, buildings, roads, sprites, original 15 source-grounded thermal works, seven candidate municipal utility footprints, monster/quest/loot identities, four classes and v4 saves. No new natural collider or hidden simulation economy without separate native route/save review; preserve original scene asset IDs.

**Approved material scope:** stop *actively painting* the T005 `terrain:ground:crown` PNG material over the outdoor region after integrated code/manifest/cache/offline adjustments. Preserve source PNG and historical approved/rollback record. This retirement does **not** remove road/paving, rock, magma crust, interior/Foundry textures or any other regional materials.

## Current source findings — 4 November 2026

- `src/prototype/visuals.js:floor()` fills outdoor region 4 with a flat `#343644` base and presently calls `PrototypeMaterials.paint(..., 'terrain:ground:crown', ...)` for every applicable world-anchored 80-unit diamond. `groundDetail()` uses small generic Crown rock/crystal marks when material fallback is absent.
- `assets/materials/manifest.json` still registers the original 256px T005 PNG (`worldSpan:320`, opacity `0.28`). `tests/frontier-ground-lore.test.cjs` explicitly expects the Crown PNG to stay active; that test must be correctly revised **when** runtime retirement occurs, not preemptively.
- `src/prototype/visuals.js:terrain()` already paints the actual lava strips, banks, canyon detail, authored water/lava motion and region structures. The new natural landform underlay must not redefine their collision or bridge geometry.
- `src/prototype/rules.js:natureThemes[4]` weights black rock, crystal, ash, dead shrubs, fumaroles and obsidian. `src/prototype/world.js` places legacy nature props with saved IDs and clearance logic. Retain/migrate these deliberately instead of duplicating all scenery or breaking old saves.
- `src/prototype/renderer.js` owns the Canvas floor cache, `src/prototype/pixi-experimental.js` caches a rendered background atlas. Static procedural geology must be anchored in **world coordinates**, not the camera or a random frame seed. Source-native Canvas and Pixi are both mandatory acceptance paths.
- The already active #769 modifies `rules.js`, `world.js`, `visuals.js`, `renderer.js` and Pixi code. They are **shared integration surfaces**, not files for competing independent edits. Existing city/road design is live work in another chat; source geometry can move. Treat its scene board and installed site positions as authority rather than freezing guessed island coordinates now.

## Exact parallel-work ownership

**This workstream owns:** the new `src/prototype/dark-crown-landscape.js` pure geological and habitat-field module; its focused `tests/dark-crown-landscape-field.test.cjs`; authored natural flow/island plans once native scene survey is complete; necessary future natural art and focused visual measurements; this document and its feature PR.

**PR #769 lead owns integration:** authoring the final shared-module load order, calling the model from `visuals.js` or a wrapper, cross-render paint/cache logic, material manifest and offline-bundle retirement, existing nature-prop migration, final site/road/utility/collision reconciliation, and combined Phase-2/3/5 signoff. These may be proposed here as reviewed patches but must **not overwrite concurrent edits**. Any separate landscape PR must target the #769 **feature branch**, never `main`; review the new lead SHA immediately before integration.

**PR #707 owns design canon.** New landscape art alternatives may be discussed here; any meaningful owner art decision is recorded there. Existing city architecture, Foundry equipment-only correction (Phase 4), unrelated music, controls and phone orientation work are not appropriated by this stream. The separate landscape-phone PR #793 may affect final capture dimensions but is not a dependency for pure geology.

**All participating chats should read this workstream file and #707's 4-November amendment before changing Crown natural terrain.** GitHub comments and branch links establish common instructions; they do not magically guarantee every independent conversation has read or accepted them. The active integration lead should acknowledge the source contract in its next session and reconcile any competing edits on the live PR, not rely on old transcript summaries.

## Implemented first checkpoint (no runtime effect)

`src/prototype/dark-crown-landscape.js` is a new independent, non-exported-to-game-browser / not-yet-script-loaded deterministic field model. It provides stable world-space gradient noise, authorable elliptical/coarse basalt-flow footprints, irregular vegetation-island masks and a `sample(x,y,options)` interface returning estimated ground age, flow presence, cinder, fracture, oxidization, island cover and potential pioneer/shrub/tree density. Optional author-supplied hazard/exclusion callbacks deliberately suppress plants on heat or constructed surfaces. All data are *rendering cues only*: the module does not load the world, draw pixels, generate collidable props, change the lava barrier, modify saved state or choose final authored island locations.

This isolated model is a starting engine, **not a finished landscape system**. The actual shape, number and placement of flows/islands, site-specific heat/road exclusion inputs, aesthetic visual quality, painter, lighting, material retirement, runtime import, old-save nature reconciliation, CPU profiling and Pixi/Canvas parity remain unimplemented.

**Focused checks at checkpoint:** model and new test files were fetched from the committed branch and the complete focused test body executed in an isolated JavaScript V8 runner with Node `assert` and timing shims: basic geology, island hierarchy, heat/built exclusions, repeat-world stability, sub-tile continuity, input immutability and 2,304 tile-coordinate samples **PASS in that harness**. A separate model smoke check also passed. **This is NOT original Node test execution, repo CI, full build, renderer verification or actual performance benchmarking.** A real `node tests/dark-crown-landscape-field.test.cjs` run on a repository checkout and relevant focused CI are the next verification steps. No reliable timing figure has been established.

## Work breakdown for this chat (independent until final integration)

1. **Natural-scene source survey:** inspect 150% actual game cameras across all sixteen owner-approved PR #707 composition categories (without duplicating the lead's full civic review), original western arrival, Ash Refuge, both lava bridges, thermal/Foundry complexes, Cindermaw and distant wilderness; map existing terrain, props, roads, collision, utility reservations and vegetation opportunities. Record which landscape is truly walkable, not just a teleported camera.
2. **Geological macro-composition:** author meaningful cooling/age chronology and major basalt-flow/ash-scour shapes. Produce representative world-space footprints and human-reviewable native-camera visual comparisons; avoid grid/noise-only output and aesthetically monotonous near-black ground.
3. **Habitat island composition:** author a few irregular old-land islands plus subordinate sheltered patches. Ensure vegetation type/density relates to cool soil and protection, not arbitrary sprite counts. Avoid monster roosts, molten boundaries, freight yards, civic avenues and unbuilt municipal tower sites. Respect existing natural props without dupes.
4. **Shared integration proposal (joint with #769 lead):** plug in world-anchored procedural ground/dressing; retire active Crown ground PNG without deleting provenance; update material/hotload/cache/Pixi/offline manifests and revised affected original tests; retain untouched civilization/roads/actors/game-state behavior.
5. **Focused native QA:** test original walkable crossings, heat works, services and visual telegraphs; Canvas/Pixi at desktop and 800×375/844×390 landscape camera, day/night; old-v4-save restore, deterministic reload and camera seams, CPU/GPU budgets and PWA completeness. Save actual screenshots, counts, source SHA and failures. No broad suites, merge or publication without new approval.
6. **Lead handoff:** present final bounded changes, exact source/testing receipts, image comparisons, conflict report, remaining limitations and recommended safe integration order; PR #769 lead is final integrator. Do not independently mark the complete 0–6 overhaul finished.

## Later engineering restart action (on hold while 0.9.2 and early-region work take precedence)

**After design submission and a later explicit engineering restart, begin the actual native-camera/geographical survey** and candidate flow/island map, then implement the macro terrain **drawing** inside the new isolated module against representative camera views. Do not jump to removing the production material manifest just to get a misleading green test; first prove a compelling landscape in actual game scenes, then coordinate the single shared runtime integration with the PR #769 lead.

## Status gate (do not overclaim)

- **Planned and owner approved:** complete outdoor geology/ecology visual reconstruction, site-aware wild vegetation, T005 active outdoor retirement.
- **Implemented on this branch:** deterministic unconnected landscape-model foundation + isolated focused test + integration handoff.
- **Tested:** focused test logic in V8 shim **only**, **not original Node/Actions**, no native rendered scenes.
- **Merged to PR #769/main:** NO / NO.
- **Deployed:** NO.
- **Device-verified:** NO.

This document is the single development handoff for this separate natural-landscape workstream. As of the 4 November priority override, design choices are the active work, while code integration remains intentionally on hold. The authoritative regional phase board remains in PR #769; the owner art canon remains in PR #707.
