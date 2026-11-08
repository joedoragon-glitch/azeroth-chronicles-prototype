# Dark Crown — capital identity, lore and environmental-design reconciliation

> **8 November execution checkpoint.** The owner has authorized execution through draft #769. The earlier pre-commissioning scope and approval notes below record their original checkpoint. The selected design and both written solutions remain binding.


**Game:** *So I Became the Dark Lord's Problem*  
**Original foundation:** 31 October 2026; **owner-authorized art-direction reconciliation:** 2 November 2026  
**Scope:** pre-overhaul lore, photographic/gameplay composition, metropolitan livelihood, fully productive Foundry, and engineering/industrial design.  
**Initial review baseline:** main at 4dd55ad352c8; **rechecked main on 2 November:** 90d92b1eabb1. Re-evaluate latest source and rendered scenes before any future implementation.  
**Status:** **implementation-ready AUTHORIAL DESIGN CONTRACT in a documentation-only draft PR. Not a runtime implementation or authorization to start one.** The owner selected 50 of 52 four-option answers and added binding verbal instructions for the two unselected questions, PC03 and LA01. The binding selection register and interpretation/acceptance contract in sections 10–14 supersede any earlier exploratory design possibilities in this document where they differ.  
**Existing authoritative context:** [Development state](DEVELOPMENT_STATE.md), [Decisions](DECISIONS.md), [Dark Crown regime layout](DARK_CROWN_REGIME_LAYOUT.md), [Crown dev.110 composition and thermal works](CROWN_COMPANIONS_20261020.md), [regional road rollback](REGIONAL_STREET_CLEARANCE_ROLLBACK_AUDIT_20261029.md), [main data](../src/prototype/data.js), [world and decorative rules](../src/prototype/rules.js), [Keeper's Archive](../src/prototype/archive.js), [renderer](../src/prototype/visuals.js), and [the terrain material contract](GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md).

## Binding owner decision — 4 November 2026: substantial procedural volcanic landscape and vegetation reconstruction

**Owner-approved new scope; coordinate with active Dark Crown overhaul, not a separate competing redesign.** Craters of the Moon (Idaho, Snake River Plain) is now the primary North American geographical inspiration for **Dark Crown's natural ground and wild vegetation**, with Newberry's volcanic landscapes (Oregon) as a complementary reference. These references do NOT replace the approved fantasy civilization, its architecture, administrative and military institutions, trade, industry or Crownwatch/Ash Refuge domestic life. The game's continuously exposed molten-lava divide and original crossings remain a deliberate fantasy extrapolation, not a claim about Idaho or Oregon. This is an approval to **deeply reconstruct the natural landscape**, not to replace one tile texture with a nearly identical tint or to add a handful of random shrubs.

**Concrete ground-material change.** Retire the currently active **T005 Dark Crown outdoor ground sprite overlay** (material key terrain:ground:crown) from the playable ground. Return outdoor Crown ground to **genuine deterministic procedural rendering**, integrated with the existing game-camera projection and PixiJS/Canvas background paths. Retain the approved original PNG, historical material registration, provenance and rollback data; remove *active use* only after the implementation updates runtime material manifests, tests, graphics cache revisions, offline assets and reproducible build output. This does NOT authorize removing Crown roads, paving, lava, rock/obsidian materials, interior floors, building/character/prop sprites, or any other regional materials. Existing terrain-color canon remains a guiding palette, not an obligation to imitate the superseded flat texture.

**Geological composition across the entire 3,800-unit region.** Create an organized family of broad cooled basalt flow lobes, overlapping flow edges, cinder/ash deposits, weathered ropy patterns, angular scoria and fractured clinker, minor oxidized seams, selective glassy/obsidian inclusions, stony ridges and ash-scoured flats. Distinguish old weathered flows from younger bare flows, and cooled rock from the real active lava barrier. Use restrained charcoal/blue-black/stone-grey/rust/slate variations with purposeful contrast and readable geology; never a uniformly purple-glowing carpet or tiled generic noise. True elevation/terrain collision changes and new lava rifts are NOT part of this art scope; visual relief must not imply an impassable obstacle where the native game allows walking.

**Vegetation islands, not uniform scatter.** Create **kīpuka-like older-land islands enclosed by younger lava** with irregular, large-scale geographic boundaries and readable vegetation gradients. Distribute distinct islands and smaller sheltered pockets along physically plausible cool terrain, rather than evenly spacing plants. Young barren flows: essentially no rooted plants; lichens and small pioneers in crevices only. Older ash/cinder and fractures: clustered tufts of grass, sagebrush-like low shrubs, hardy groundcover and occasional wildflower accents. Sheltered older islands: modest grass/shrub cover and **rare, wind-shaped limber-pine/juniper-like conifer silhouettes**, never blanket woodland. Surrounding wilderness and the region edges may have more such patches than hot industrial and lava banks. Cultural planting in maintained courtyards and public gardens remains deliberately different from unmanaged wild patches. These species and habitat stages are *visual analogues*, not newly declared in-game species, a literal American botanical inventory or a new foraging/ecology economy.

**Site-aware natural landscape hierarchy:**
- **Crownwatch:** carefully worked cooled basalt and paved civic edges; shaped volcanic ridges beyond; protected and maintained gardens are cultural amenities, with sparse natural crevice vegetation away from important streets.
- **Ash Refuge:** visibly older cool rock, isolated vegetation around natural terraces and the neighborhood perimeter, distinct from its cultivated domestic/artisan courtyards.
- **Main molten channel and original two bridges:** barren/hot basalt, cracks and credible bridge abutments with safe clear sightlines; no green grass on the liquid lava, no new crossing or altered collision.
- **East and south heatworks, glass/ceramics, Foundry exterior:** separate graded industrial surfaces from wild scoria and cooled lava. Keep heat/exhaust/loading zones clear and prevent natural scenery from erasing documented freight paths, the seven planned utility sites or original saved assets.
- **Cindermaw and Ash-beast habitat:** geothermal nesting and creature settlement remain distinct. Only protected cooler perimeters have pioneering vegetation; do not blanket the roosts with conifers.
- **Peripheral volcanic wilderness, ridges and southern margins:** the most visible variety of flows, isolated plant islands, cracks and landform silhouettes, connected through walkable scenic journeys.

**Engineering implementation strategy.** Model broad world-space flow/soil-age/temperature-exposure **masks**, then controlled fine-scale mineral details and clustered vegetation; make the resulting landform geography legible at normal 150% zoom. The same deterministic source coordinates and seeded variation must remain stable across rendering frames, tile cache boundaries, movement, zoom, reload and historical v4 saves. Compose the natural landscape *under* original roads, structures, combat effects and navigation affordances; prevent false collision, actor/telegraph occlusion, artificial seams or high-frequency procedural shimmer. Budget generation and reuse for both Canvas2D and PixiJS rather than adding unbounded per-frame noise, massive new GPU textures or excessive independent vegetation props. Reconcile existing nature IDs and saved props; prefer nonblocking, source-stable decorative layers where appropriate; any genuinely collidable landform would demand separately approved route/save work.

**Synchronize with existing PRs and phases.** Draft **PR #769 remains the active lead** for Dark Crown implementation; draft **PR #707 remains the authorial design authority**. This decision adds natural-geology/vegetation composition requirements to the **existing sixteen Phase-2 scene categories** and connecting routes, not a competing scene checklist; adds outdoor terrain/sprite retirement and habitat artwork to **Phase 3**; and adds integrated art/gameplay/renderer/performance/offline/save checks to **Phase 5**. The previously completed **Phase 1 engineering-feasibility design** stays complete, including the approved buried imported-water/tower/bath concept; the separate **Phase 4 equipment-only Foundry interior** requirement remains unchanged. Do not independently rewrite shared Crown world, rules, visuals, renderer or PixiJS code while another chat edits those files. If implementation proceeds on a separate candidate branch, derive it from an identified #769 SHA, submit it against that branch for lead integration, document drift and do not merge into main ahead of the lead. Never overwrite ongoing architecture, existing IDs, new water-site reservations, original 15 heatworks, roads, bridges, assets, quests or lore.

**Evidence and acceptance.** Review actual walk-throughs rather than only camera teleports: bare recent flow→older vegetal island→bare lava, western arrival→Crownwatch plaza, Ash Refuge domestic perimeter, both crossings, east and south industries, Cindermaw roost and fortress approaches. Capture true desktop and supported short-wide phone landscape at the game's 150% zoom with night variants. Verify natural/urban transitions, unoccluded interactions and combat cues, old-v4-save migration, seed determinism, Original vs Canvas/Pixi parity, bounded CPU/GPU work, texture/asset retirement and offline PWA correctness. Use focused checks before the independent Phase-5 review; broad suites, merge, deployment, device verification and owner art acceptance remain separately gated.

**Status at the initial 4-November documentation amendment (historical):** AUTHORIAL DESIGN APPROVED. That amendment itself changed no natural terrain code, vegetation art or material registration; it performed no tests, merge, publication or device verification. **Later same-day update:** the owner subsequently submitted and approved all sixteen NL01–NL16 art selections below; separate draft PR #794 contains an unconnected natural-ground field model, not a working in-game landscape.

**Factual landscape references:** US National Park Service https://www.nps.gov/articles/000/crmo-ecosystems.htm (varied ropy/block/jagged lava), https://www.nps.gov/crmo/learn/nature/plants.htm (vegetation depends on substrate, soil and exposure) and https://www.nps.gov/articles/000/kipukas.htm (older vegetation islands surrounded by younger lava). These guide creative plausibility, not gameplay/geology simulation.

---

### Binding landscape authorial choices — owner-submitted 4 November 2026 (NL01–NL16)

**Status: DESIGN APPROVED, 16/16 RESPONDED; no unanswered selections.** This register records the owner's *submitted* options and notes, not speculative proposals. It is jointly authoritative with the preceding 4-November natural-geology approval in this PR #707 contract. When an option's description is broad, the owner's note is controlling; implementation-level geographic coordinates, exact 3-vs-4 island count and precise scene compositions remain engineering/art-placement decisions based on actual source-native survey, **not unanswered owner questions**. Keep already approved roads, lava, city, 15 thermal works, waterwork reservations, Foundry, NPCs, loot, four classes and v4 saves intact.

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

**Current owner priority gate:** 0.9.2 release, portrait/landscape orientation and first-region UI/menus take precedence. Further #794 natural-landscape implementation and integration remain **ON HOLD** until renewed authorization. The standalone deterministic model and its shim-tested focused logic already exist on draft PR #794; the authored island locations, procedural painter, T005 active deactivation, actual native Canvas/Pixi visual QA, performance benchmarks, merges, publication and physical iPhone acceptance remain **NOT DONE**. The design submission does **not** authorize any of them.

---

## Owner infrastructure decision — 3 November 2026: underground waterworks and architecturally integrated elevated tanks

**Latest binding owner direction; supersedes earlier water-source HOLD language in this contract and the independent Phase-1 draft.** The capital **may receive water by an existing-implied off-region supply system** through a buried incoming main rather than inventing a new local aquifer, surface lake or potable geothermal steam. Build a believable municipal utility: a protected entry/intake and filtering/settling service, pumps or pressure/lift appropriate to the setting, several architecturally integrated **elevated water-storage/pressure towers**, mostly **underground distribution pipes** to homes, civic halls, protected cisterns, washhouses and the approved public **geothermal bathhouse**, plus a **separate buried wastewater collector** leading to an appropriate service/treatment/disposal terminus. The specific upstream catchment/province, engineering flow numbers and off-region final discharge are **unspecified**; do not invent a named watershed, new quest, municipal economy, electricity or a gameplay resource simulation. This is **author-approved infrastructure as a worldbuilding premise**, not evidence that existing runtime pipes or potable hydrology have been implemented.

**Visible engineering, not surface plumbing sprawl:** the towers are the readable elevated *storage and pressure* nodes, **not the originating water source**. Show discreet pipe entry at tower plinths, sealed inspection/valve access, pumping and treatment/maintenance buildings where needed, stone-lined drains and occasional service covers. **Do not blanket streets with surface pipes** or confuse drinking-water mains with sanitary sewers, ash runoff or geothermal heat flues. Supplies crossing the existing large lava division use **protected utilities aligned with an original bridge/abutment and its existing crossing**—no third bridge, open pipe in flowing lava or new terrain gap. Buried mains within each bank follow safe established road/utility easements, with final exact clearance validated in actual generated Crown terrain and existing saves. Wastewater uses a **separate** concealed collector and bounded treatment/disposal route; its final receiving destination cannot be silently equated with an existing well, public street or lava pool. The game need not simulate the hydraulic network in real time.

**Architectural grammar:** build a *small, purposefully distributed set* of water towers with structural basalt/volcanic-stone plinths, protected elevated cistern drums, glazed ceramic bands, slate/tile roof or cupola, narrow maintenance openings, restrained metal bracing and visible service doors. Vary tower height/diameter to distinguish a civic tower, an Ash Refuge neighborhood tank and an eastern industrial/service tower; use the same regional stone/ceramic/glass vocabulary as homes, ministry and kilns, not modern steel lattice silos. Position them near genuine civic/service/industrial edges, not in the central plaza, hostile spawn lanes, bridges or original road/entrance clearances. Water structures contribute to the capital skyline without turning every view into a row of generic tanks.

**Civic bathing:** the owner's selected **public geothermal bathhouse is an affirmative design goal**, no longer indefinitely deferred for lack of an invented natural water source. Deliver ordinary water through the approved underground potable/utility supply, warm it through a **physically separated indirect geothermal exchanger** (not the water tower itself), and carry greywater into the distinct buried sewer line. The architectural bathhouse needs accessible dry entrances, screened/maintained hot-water service, separate clean and waste spaces and plausible maintenance flow. Protected cisterns (**EN03 A**) can form the covered buffer within this larger tower-and-buried-main design. Phase 2 authors coherent **visual** placements/sections; Phase 3/4 must still validate safe positions, old saves, crossing/easement geometry, bathing/combat readability and any real source/rendering code before saying the utility is implemented. A visually convincing buried network does **not** require rendering every underground section, nor a hydraulic simulation. This clarification makes the *conceptual supply and waste route* author-approved; it does not automatically certify final terrain/collision plumbing placement, pressure performance, treatment capacity, source yield or device rendering.

## Owner correction — 3 November 2026: defended Foundry, no visible working civilians during intrusion

**This is the latest binding clarification of PC03 and supersedes the 2 November requirements for on-screen active workers, worker state machines and production animation.** A viable, maintained, productive Foundry is established by its appropriate furnaces, casting/forging equipment, machinery, intake/exhaust, work surfaces, tools, storage and inward/outward material handling. The player **enters a hostile occupied site**; the original Crown-guard inhabitants have already abandoned their work and stand ready to fight. There is **no requirement to show anyone operating a workstation while the player is inside**, simulate civilian staff, add labor NPCs or transition enemy actors from work to combat. Do not introduce harmless targets for the player to kill or undercut the existing hostile encounter. Stationary or subtle machine-only animation is optional later; human labor gestures from the earlier draft are not the selected final presentation.

This does **not** revert the owner's requirement for a functional, sophisticated production-focused Foundry, restore ruined dressing or authorize an unnamed new industry or goods. Preserve the existing `side-crown-foundry` site, fourteen hostile occupants, seven historical columns, four traps, original single entrance/exit, critical Codex, quests/rewards, v4 saves and coherent safe player combat/traversal. The older questionnaire remains **50 selected / PC03 and LA01 unselected** with this written override for PC03. **Implementation status:** direction only in draft design PR #707; on the independent implementation draft #769 the earlier five decorative `crownFoundryWorker` work scenes still draw embedded labor figures until the approved Phase-4 artwork adjustment is made and tested. Do not mistake an updated design contract for a shipped visual change.

## START HERE — self-contained future implementation handoff (2 November 2026)

**This GitHub document is the permanent source for this design discussion.** A new ChatGPT session, engineer or implementation agent **does not need the conversation transcript** to recover the author's decisions, logic, historical source boundaries, artistic intent or engineering acceptance criteria.

**Project/repository:** *So I Became the Dark Lord's Problem (SIBDLP)*. The repository `joedoragon-glitch/azeroth-chronicles-prototype` bears a **historical development name only**. **Do not** call the public game Azeroth Chronicles and **do not** confuse it with *So I Befriended a Dark Lord* (SIBDL), a separate project.

**Persistent GitHub handoff:**
- Design-only draft **PR #707**: https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/707
- Source branch: `design/dark-crown-capital-identity-20261031`
- This document on that branch: https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/dark-crown-capital-identity-20261031/docs/DARK_CROWN_CAPITAL_IDENTITY_RECONCILIATION_20261031.md
- Latest reviewed `main` for this documentation: `90d92b1eabb1a223db6a6129402c0a232e407d12` (2 November 2026). **Recheck new main** in the implementation session and review all relevant overlapping PRs; do not treat this SHA as the permanently latest release.
- **PR #707 is a draft, unmerged, and contains only this documentation**. A new session must explicitly read this *draft branch* or PR; merely reading `main` **will miss the decisions**. Never assume that a draft document has shipped.

**Read in this order in a fresh session:**
1. This START HERE section for authorization and current design handoff.
2. Section **10**, the original 52-question authorial register (**50 chosen, 2 unchosen, 7 specific written feedback qualifiers**). Do not reconstruct letters or overwrite blended selections.
3. Section **11**, consolidated binding design interpretation: civic architecture, volcanic terrain, industrial and civic engineering, government and society, Ash beasts, trade and geography.
4. Section **12**, exact photographic scene and playable-camera acceptance criteria, followed by section **13** on the productive Foundry and orrery and section **14** on independent implementation stages/quality gates.
5. Sections **1–9** for historical lore/source grounding, discrepancies and site-by-site background. If an exploratory suggestion there conflicts with sections **10–14**, the later explicit authorial register controls **artistic direction**; the actual current game source governs gameplay facts, saved IDs and encounters.
6. The current repo's `AGENTS.md`, `docs/DECISIONS.md`, `docs/DEVELOPMENT_STATE.md`, `docs/DARK_CROWN_REGIME_LAYOUT.md`, `docs/CROWN_COMPANIONS_20261020.md`, `docs/SIDE_DUNGEON_DESIGN_DISCUSSION_20261021.md`, `docs/REGIONAL_STREET_CLEARANCE_ROLLBACK_AUDIT_20261029.md`, `docs/GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md` and current code/asset manifests. **Historical documents have status/date caveats.** Reconcile conflicts with the owner's latest direction and present `main`, not by silently retconning gameplay.
7. The main source areas to inspect include `src/prototype/data.js`, `src/prototype/rules.js`, `src/prototype/world.js`, `src/prototype/visuals.js`, `src/prototype/renderer.js`, `src/prototype/save.js`, the actual PixiJS rendering modules and active tests. Confirm precise ownership at implementation time rather than guessing.

**Non-negotiable authorial intent:** Dark Crown is **a grand, desirable, functioning volcanic capital made prosperous by its people, technology, crafts, civic institutions and trade**, not just a "dark" settlement created by the Dark Lord. Its believable civilization matters most (PH04 B). The high-level visual design is selected: unified stone/ceramic/glass, rocky ridges, tower/chimney skyline, lavish but navigable plazas, courtyard homes, professionally maintained infrastructure, multiple glassworks, broad ceramic industry, protected public warmth, an investigated geothermal bathhouse, water/cistern feasibility, distributed industry freight, multiracial public life, progressive governmental control, Veyra's craftsmanship, creature-specific Ash-beast habitation and dramatic but physically credible lava bridges.

**Key supersession:** The current source's `Ruined Foundry` is a **historical baseline, not the approved end state**. The owner requires a *fully operational foundry* with **credible machinery, stocked working areas and a spatially coherent production chain**. The 3 November correction explicitly rejects having people at workstations while a hostile intruder is present: the original guards are combat-ready. Exact goods, extra interactions and the new public-facing proper name remain unresolved. Preserve `side-crown-foundry` and progression/save identity until a specifically reviewed implementation. Former 21 October "keep side dungeons unchanged" direction is superseded **for this Foundry's future environmental purpose and design**, not wholesale for other side dungeons or quests. The bronze survey orrery (LA01) must **balance all four** civic/survey/scientific/heritage identities, without inventing mechanics. Both **PC03 and LA01 remain literally unselected** in the questionnaire.

**Engineering/creative boundaries:** The approved 50 visual decisions are not authorization to fabricate lore or freely modify functionality. Maintain current lava and two real crossing gaps, v4 saves and site IDs, existing quests, player/companion/enemy navigation, Citadel/Treasury combat, approved original art, native Canvas/PixiJS parity and phone-scale visual readability. Water storage and the bathhouse are selected **feasibility/design directions**; no cistern water source, bathhouse plumbing, raw material recipe, added craft system, new resource economy, worker population or new monument location is established as current canon. The Ironroot portrait-Crown mint stays in Ironroot; Abyss Bastion's dragon project stays in Ashen Frontier. Do not restart blanket road joining/displacements that the October 29 rollback reversed.

**Explicit user authorization boundary:** As of this handoff, the owner requested **documentation only, not an implementation, merge, deployment or device certification**. When the owner opens a *new* session and explicitly authorizes implementation, that later instruction defines the new scope. Do not interpret the existence of this contract/PR as standing permission to modify code or publish it. Use a **new implementation issue/branch/PR**, as appropriate, rather than silently turning the documentation-only PR into a gameplay overhaul or merging it without permission. Reuse #707 as the source reference; keep one authoritative design contract, not duplicated competing plans.

**New-session engineering starting point, after explicit authorization:** (1) Fetch PR #707 and this exact document from its **branch**; (2) read repo instructions, live `main`, merged/outstanding landscape/rendering/side-dungeon changes; (3) inspect/capture actual current Dark Crown world and Foundry interior at 150% camera and a phone-scale viewport, day and night, in the active renderer; (4) inventory gameplay geometry, site IDs, enemies/NPCs, materials, saved placement, transport/industrial input-output and water feasibility; (5) produce a precise source-grounded layout/engineering plan with scene-by-scene artistic compositions and identify the few truly consequential unresolved decisions, including the Foundry's new public name and credible water source; (6) implement only within the owner's later approved scope, with small focused regressions and realistic artwork review; (7) distinguish implemented, tested, mergeable, merged, published, device-verified and creative-accepted.

**Acceptance:** A competent developer unfamiliar with this chat must be able to explain the capital's livelihood and resource flows, draw a coherent city-to-wildland circulation plan, produce representative native camera crops, design a genuinely *equipped and productive* foundry interior whose original inhabitants are prepared for combat, explain where heat and water come from, preserve game/saving identities, and enumerate meaningful focused tests. "More banners/black roofs/lava props" is **not** a solution. The detailed implementation acceptance checks are in section **14**.

---

## 1. Owner's authoritative creative correction

**Dark Crown is a grand, desirable, inhabited volcanic capital, not a generic Dark Lord settlement.** Its inhabitants do not live there merely because the Dark Lord rules there. The region's distinct identity comes from a civilization that has made difficult volcanic terrain prosperous, beautiful and functional through architecture, skilled labor, engineered infrastructure and exchange. The Dark Lord rules and shapes institutions, but neither his symbolism nor oppression is an adequate explanation for the landscape, settlement pattern, civic amenities or livelihoods.

The capital must be an achievement that makes sense to live in. Its visual treatment can celebrate construction, engineering, public places and comfort while acknowledging military coercion and captive labor. Do not falsely imply that the regime invented the city, or invent an unapproved founder, founding date, pre-regime dynasty, geology, ethnicity or urban history.

**Visual promise:** In one gameplay scene the player should see an extraordinary volcanic landscape and the sophistication with which its inhabitants have learned to inhabit it; later scenes reveal how administrative and military power controls that prosperity.

**Playable promise:** Roads, plazas, workplaces, civic amenities, industry, settlements, civilian territories and military compounds each have a reason to exist and a legible approach. The final region is not merely a series of boss arenas connected by dark paving.

## 2. Established source facts to preserve

- Dark Crown is the fifth/final region (3800 × 3800 source-world units), with Crownwatch as the principal settlement and Ash Refuge as the smaller refuge. The north–south live-lava barrier is a real impassable geographic division with two established crossing openings; its banks, bridge/collision gaps and connected access remain authoritative.
- Canonical regional terrain: volcanic highland, dark fortifications, obsidian and a muted slate-violet mineral ground. Accepted ground-material palette #343644, #414351, #2c2f3c, #a09b9e, with **no universal purple glow**. Roads use ordered slate-violet paving. Lava, ember lighting and heat are contrast accents, not everywhere-at-once wallpaper.
- Crownwatch already has an authored paved civic court, street-front housing/services, ash-stone houses, forgehouses, market, forge, gardens, field kitchen, laundry, tax post, levy yard and guarded transport. Ash Refuge already has homes, well, washing and working areas on dry western plots. Preserve recognizable site IDs, actual services and refuge function.
- Cindermaw, the Minister of the Interior and Welfare, oversees Crownwatch, Ash Refuge, the Ruined Foundry and infrastructure; Vera remains a paid but captive smith until rescued. Dreadmaw, Minister of Agriculture, oversees provisioning and the whole Treasury jointly with Cindermaw, while guarding its Inner Vault. These obligations span all five provinces, not just fields in the volcanic capital.
- The Citadel of Ashes is Marshal Veyra's academy and professional army headquarters, not a generic haunted dungeon. She values sound workmanship, martial discipline, grooming, equipment and beauty. Its established irregular wings serve muster, command, barracks/armory, ritual control, forge/logistics and the inner court.
- Cindermaw's field roost and irregular volcanic Treasury express an Ash-beast habitat/ministerial estate. Dreadmaw guards a meaningful inner vault. The Ash beasts have territorial life outside their assigned hostile encounters.
- **Historical/source baseline and owner supersession:** the currently named Ruined Foundry was depicted as damaged but operating, with forge, repair benches, bunks and Crown guards. The **2 November 2026 authorial direction supersedes that future visual target:** its finished exterior and interior must be **fully functional, maintained and genuinely productive through its inhabitants**. The old ruin concept may be described historically but is **not** an acceptable finished presentation. Preserve the internal side-crown-foundry identity until a separately authorized implementation; no new crafting system, quest or exact display name is selected merely by this decision.
- The Crystal Deposit is an extraction and shipment site; its exact crystal uses and downstream buyers are not established. Ironroot mines and Stonecross mint separately provide circulating silver/copper portrait Crowns; **do not relocate minting to Dark Crown**. Frontier road/repair convoys, interregional provisioning and state transport already support the capital.
- The final fortress approach, siege logistics, Crown military transit and Dark Lord's courtyard remain authoritative for story and combat. The west/northwest dragon return, levy route and fortress convoy are existing travel infrastructure, not evidence of a completed Crown dragon fleet. The royal air-superiority project at Abyss Bastion belongs to Ashen Frontier and remains unfinished.
- Existing geothermal details include indirect heat intakes, insulated flues, glass and ceramic kilns, drying sheds, washhouse, distribution posts and two contained industrial heat raceways. The source explicitly excludes electricity and new walkable lava crossings. The bronze survey orrery on a stone plinth is an established static landmark, not an unimplemented astronomy subsystem.
- The October 29 rollback, merged as PR #651, restored pre-automatic-connector regional compositions after unapproved road/prop shifts. It documented unresolved original-layout setbacks and access concerns; future design must solve them **locally**, not rerun automatic wholesale road joining or claim old scenes are already perfect.

## 3. Visual diagnosis: what is established vs. what remains weak

The source has genuine regional content, and the dev.110 pass made important corrections. It would be inaccurate to say Dark Crown is literally unchanged. But the current world is still built largely from named procedural prop scenes and generalized housing/roads. For example, the labor quarter mixes one ash house, a forgehouse, a levy yard, bunk and tax post; industrial works are positioned as individual intake/flue/kiln/washhouse props. These establish **presence**, not necessarily a convincing city-scale spatial composition.

The key unresolved artistic question is not whether there are enough props, but whether every arrangement visually explains **site, purpose, transport, labor and civic value** at the player's actual 150% gameplay camera. The same information must be readable at phone dimensions. No new screenshots or current-device playthrough were generated for this note; any claim of specific contemporary visual defects beyond documented original-layout findings remains a review target, not a newly reproduced failure.

**Risk to avoid:** making the city larger, denser and darker without improving the physical logic, skyline, sightlines or player journey. A cluttered capital can look less grand than a simple one.

## 4. Proposed urban and architectural grammar

Treat Dark Crown as a city adapted to different types of volcanic land:

1. **Stable inhabited terraces and dry plots:** civilian housing, civic square, markets, sheltered courtyards, public services and workspaces belong on credible foundations with a workable pedestrian/street network. Use consistent structural massing and repeated stone vocabulary without identical cloned buildings.
2. **Industrial hot-side precincts:** geothermal intakes, insulation, flues, kilns, ceramic/glasswork and drying facilities cluster where the underlying mapped lava, natural barriers and existing roads permit. Dangerous intakes and workshop heating sit apart from crowded domestic frontages; shipping and maintenance approaches make the work possible.
3. **Civic cool-side frontages:** washhouse, heated public halls and the proposed public geothermal bathhouse (owner-selected LA03) make engineered heat **desirable**, not only productive. Bathing and public halls are owner-selected visual directions, while the bathhouse structure and water system require feasibility before implementation. Water provision, drainage and sanitation are engineering questions to resolve before inventing a new water supply or freely adding fountains.
4. **Freight, stores and city gates:** loading aprons, wagons, goods segregation, road capacity, checkpoints and storerooms connect named industry to Crownwatch and external provinces. Differentiate street life from heavy-haul and military routes.
5. **Veyra's command precinct:** ordered courtyards, beautiful functional stonework, repeated uniform/barracks patterns, clear defensive lines and restrained standards. It should be recognizably a professional institution, not a random wall-and-banner composition.
6. **Ash-beast territory and wild south:** rugged forms, roosts, obsidian, heat, bones and deliberately organic habitation contrast with human/army geometry. This is a habitat, not simply the trash edge of the city.
7. **Final authority and fortress approaches:** a controlled escalation of scale and defensibility, with stages of security and logistics leading to the Dark Lord. No automatic Gothic/cathedral palace or enormous new throne building is implied.

Do not imply that all civic beauty derives from royal sponsorship. A well-crafted wall, tiled civic forecourt, bathing space or market may be part of the city's local culture and practical accumulated knowledge.

## 5. Industrial engineering and the economic chain

The visual industrial story must be technically intelligible:

**Volcanic heat → safe intake/exchange → insulated distribution → kilns/drying/washing/heated public buildings → maintenance, waste heat and service access.**

- Heat capture must use the **actual lava geography**, with no heat-intake drawn arbitrarily far from its source. Indirect exchangers and protected stone aprons remain the accepted fictional technology; display retaining walls, supports and access only where they make sense.
- Flues need visually traceable continuity and plausible routing, instead of disconnected pipes ending in decorative objects. Consider structural expansion, venting and maintenance access in the **design**; this is not authorization for a simulated fluid/heat network.
- Glass and ceramic sites must have recognizable production footprints: space for raw material delivery, hot work, cooling, storage and shipping. Specific new raw materials, guilds or exports are *not* canon until approved. Do not assume crystal is automatically the glass feedstock.
- Metal forging/repair requires inputs and movement. Imported Ironroot metals and existing Frontier shipments are grounded network cues; capital coin minting is not.
- The capital's food and daily provisions need a believable route from provincial agriculture/fisheries, Dreadmaw's distribution and local markets. **Do not force a self-sufficient farm belt onto the lava region.** Local garden/livestock details are limited to established scenes unless reviewed.
- Crystal mining must have extraction, protected handling, sorting/storage and a shipment route, but magical crystal refining or a major new commodity system would be speculative.
- Plausible water supply, safe drinking water, washing water, runoff/drainage, ash dust and smoke management, materials for construction, workers' access and seismic/thermal risks belong in the *next engineering-feasibility audit*. Source does not establish a specific aqueduct, cistern, reservoir, waste system or geological hazard frequency. Do not depict such large infrastructure as fact until geography and lore permit it.
- Economics here means **spatial evidence of an existing exchange network**, not modifying gameplay crown budgets, enemy drops, fees, gathering nodes or crafting recipes.

One practical compositional test for each productive site: point to **input, process, output, people and access**. Not all five require separate props, but the scene should not contradict them.

## 6. Photographic composition as a game-design contract

At normal 150% gameplay zoom, compose **views along the player's likely routes**, not decorative object maps.

- **Establishing focal point:** each major district has one defining large form: civic court / kiln cluster / Citadel gate / roost / final gateway. A frame must not contain five equal-sized attention magnets.
- **Foreground–middle ground–background:** frame a view with meaningful low-detail volcanic rock or street edge in front, active streets/work in the middle, and recognizable architecture/geography behind. Avoid props blocking heroes, enemies, entry points or cues.
- **Leading lines:** actual navigable streets, retaining walls, building-front rhythm, safe bridges and thermal infrastructure can guide the eye to the next landmark; the camera composition must not invent roads or promise false passage.
- **Negative space and rhythm:** city squares and courtyards require breathing room. Use alternating dense production clusters, quiet stone streets, civic openings, neighborhood-scale details and wild transitions. Repetition of buildings establishes unity; controlled variation establishes real habitation.
- **Scale cues:** big monumental buildings are credible only beside smaller workshops, doors, carts, figures and plausible construction mass. Respect the existing isometric camera, footprints and occlusion.
- **Lighting and contrast:** restrained slate-violet base, readable mineral facets, warm industrial/civic illumination, occasional purple royal fabric and disciplined metallic details. Reserve highly saturated lava/ritual/magic for focal or hazardous places; preserve telegraph visibility both day and night.
- **Material logic:** dry intact paving on protected civil routes, heavier engineering at hot edges, wear near actual carts and loading yards, soot at exhaust, repair patches at actual facilities. Weathering must follow use, not random procedural grit.
- **Deliberate storytelling:** a market alongside shipment carts conveys plenty; a clean public washhouse adjacent to a guarded levy station conveys both civic achievement and political control without placing torture props or propaganda at every corner.

**Gameplay first:** check collision, visual-footprint clearance, line-of-sight, real route() reachability, room entrances, boss movement, specialist rescues, on-screen telegraphs, night visibility and historical saves. Thematic success does not excuse blocked controls or poor phone readability.

## 7. Scene-by-scene future visual review

| Scene/route | Established role | Recommended photographic/engineering question |
| --- | --- | --- |
| Dragon return and Crownwatch arrival | Administrative return, main capital, paved court | Does the first view communicate an attractive city with a clear monumental civic heart, and reveal where a person would naturally walk? |
| Crownwatch residences/market | Workers, services, garden, trade, public life | Do homes, workshops and public services form credible blocks and human-scale space rather than an army camp with a few houses? |
| Ash Refuge | Dry-plot refuge, well, wash, domestic life | Does it look like a warm, workable neighborhood, distinctive from both Crownwatch and a military outpost? |
| Two lava bridges | Essential legitimate crossings | Do engineering/abutments, safe approach and actual collision agree? Is the volcanic spectacle visible without dominating player controls? |
| Eastern/western thermal areas | Heat intakes, kilns, flues, washhouse | Can one see energy flow and industrial access? Are domestic users and industrial heat safely distinguished? |
| Crystal Deposit / levy logistics | Extraction, collection, shipment, taxation | Is there a recognizable material journey and sufficient loading space? No invented crystal magic or coin mint. |
| Citadel and field barracks | Professional multiracial army | Do drill, arms, supply, gate and command functions show Veyra's orderly pride rather than uniform generic menace? |
| Cindermaw field territory / Treasury | Ash-beast life and ministerial storage | Do creature-specific habitat, provisioning and hierarchy read separately from conventional military architecture? |
| Ruined Foundry | Damaged but working forge, repair benches | Does repair/production look active, yet preserve the approved undecided future expanded role? |
| Survey orrery and southern wild track | Civic technical ornament; remote wilderness | Does each landmark have compositional space and a legible function without fabricated mechanics? |
| Siege road, final gate and courtyard | Last logistics and ruler confrontation | Does the approach escalate from functioning state to restricted political center, with coherent defensive sequence and playable room? |

## 8. Critical visual contrasts

- **Versus Ashen Frontier:** Frontier visibly recovers from destruction, with scarred ground, military occupation and rebuilding. Crown should look *long inhabited and professionally maintained*, although its volcanic terrain remains dangerous. Do not copy Frontier's recovery/ruin narrative over the capital.
- **Versus Ironroot Highlands:** Ironroot is the mineral extraction, salary and portrait-coin mint region. Crown is a political/civic center and a heat-driven industrial/administrative destination. It receives ore/coin shipments; it is not another silver mine and mint.
- **Versus a generic dark-lord zone:** Black stone and purple flags are material accents, not a complete economy or origin story. A capital can be beautiful and its government coercive at the same time.

## 9. What is approved, what is proposed, and future acceptance

**Owner direction / current creative constraint:** the capital is desirable because people have made a hostile volcanic region grand and functional; Dark Lord allegiance is not its founding explanation. Photographic/game-design composition, visual livelihood logic and credible industrial engineering must inform future design.

**Established existing canon and source:** the named sites, geography, heat technologies, industries, characters, rights restrictions, relationships, road/travel roles, encounters and current visual-material references described above.

**Approved owner directions, not yet implemented:** unified stone/ceramic/glass architecture, courtyard homes, rocky ridges, well-maintained broad plazas, prominent geothermal nodes, a protected-cistern feasibility direction, heated public halls, and a public geothermal bathhouse as the first candidate civic monument; all 50 letter choices and written blends are recorded in section 10. **Still not technically/canonically resolved:** specific water source and drainage, roof shapes and building dimensions, industrial plant construction, added trades and product details, named civic monuments, personnel and plot footprints, exact prop relocations and narrative claims. Neither a selected art direction nor an illustrative scene creates an approved game mechanic or completed structure.

**Not performed:** no runtime, art, economy, map, save, quest, character or asset changes; no new screenshots, player-path traversal runs, performance benchmarks, CI, merge, deployment or device verification.

**Before any full overhaul:** compare native **current-main** day/night gameplay screenshots and spatial/site census (not only older dev.110 renders); audit water/transport/production dependencies; prepare a district-by-district composition sheet and scene proposals; protect all retained IDs/geometry and the dev.236 rollback; then commission an implementation on an isolated branch with focused layout/navigation/rendering tests and explicit owner visual acceptance. Later full reconstruction must not be quietly treated as authorized merely because this foundation was written.

## 10. Owner decision register and precedence — 2 November 2026

The creator's **50 selected four-way choices out of 52** are recorded below, with **both formally unselected items and their substantive written direction** retained. The option letter is the selected primary treatment. Any owner-specified combination is a binding secondary treatment, not automatically an equal-weight split. No choice is being assigned by the assistant to the two unselected entries.

**Authority:** all selections below are authorially approved directions **for a future overhaul**, not statements about the already shipped region. Existing source lore and stable game/save identities remain authoritative for current gameplay. Specific new structures and infrastructure require the later spatial and engineering feasibility review. These latest selections take precedence over inconsistent exploratory wording in sections 4–9 and the older Foundry deferral.

### Capital identity

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| ID01 | First impression | **A** | Awe and admiration |
| ID02 | Dominant personality | **D** | Balanced great city |
| ID03 | Accumulated age | **B** | Unified architectural tradition |
| ID04 | Relationship to volcano | **A** | Mastery |

### Volcanic geography

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| VG01 | Landform silhouette | **B** | Rocky ridges |
| VG02 | Lava's visual role | **A** | Engineered resource |
| VG03 | Two bridges | **C** | Elegant industrial infrastructure |
| VG04 | City-to-wilderness transition | **C** | Interwoven landscape |

### Architecture and material

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| AR01 | Architectural language | **D** | Stone, ceramic and glass |
| AR02 | Capital skyline | **A** | Towers and chimney clusters |
| AR03 | Residential typology | **A** | Courtyard clusters |
| AR04 | Material accents | **C** | Glazed ceramics and pale minerals |

### Urban planning

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| UP01 | Street hierarchy | **B** | Adapted organic streets |
| UP02 | District organization | **D** | Distinct anchors with mixed edges |
| UP03 | Public realm | **A** | Broad plazas |
| UP04 | Wear and maintenance | **A** | Meticulous upkeep |

### Crownwatch and Ash Refuge

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| CV01 | Civic heart | **C** | Public amenity centerpiece |
| CV02 | Ash Refuge | **A** | Quiet residential terraces. Owner blend: A plus B, a genuine secondary artisan neighborhood character. |
| CV03 | Public amenities | **C** | Heated public halls. Owner blend: C plus A, with geothermal bathhouses/bathing culture as another public amenity. |
| CV04 | Civic beauty | **A** | Stone gardens and sheltered greenery |

### Heat, water and sanitation

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| EN01 | Geothermal visibility | **C** | Prominent technical nodes |
| EN02 | Heat use | **D** | Balanced shared network |
| EN03 | Water study | **A** | Protected cisterns remain selected; latest owner direction adds architecturally matched elevated storage/pressure towers and mostly **buried imported-water distribution and separate underground wastewater**, with an unspecified off-region supply. See the 3 November infrastructure decision above. No runtime water infrastructure is claimed. |
| EN04 | Environmental controls | **D** | Integrated civic engineering |

### Production and crafts

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| PC01 | Glassmaking identity | **C** | Multiple production sites |
| PC02 | Ceramic specialization | **D** | Broad craft industry |
| PC03 | Foundry character | **—** | UNDECIDED. Binding written override: the Foundry must no longer be ruined in its finished state. Rebuild it as a fully equipped, maintained, productive institution with a credible work layout; the already-hostile inhabitants are ready to fight on arrival, so visible working figures and worker AI are **not** required (3 November clarification); see section 13. |
| PC04 | Crystal Deposit | **C** | Sorting and shipping |

### Economy and provisioning

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| EC01 | Economic reputation | **A** | Heat-based manufacturing |
| EC02 | Trade visibility | **C** | Distributed delivery yards. Owner blend: C with a reasonable amount of A, meaning a modest identifiable main freight quarter in addition to distributed loading facilities. |
| EC03 | Food and provisions | **D** | Balanced network |
| EC04 | Economic agency and labor | **B** | Mixed enterprise under oversight |

### Society and political atmosphere

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| SO01 | Social texture | **C** | Artisan communities. Owner blend: C with a reasonable amount of A, so substantial working-class family life accompanies artisan businesses. |
| SO02 | Multispecies society | **A** | Integrated public spaces |
| SO03 | Governmental control | **D** | Progressive escalation |
| SO04 | Residential appeal | **D** | A complete urban life |

### Military institutions

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| MI01 | Citadel aesthetic | **B** | Artisanal military excellence |
| MI02 | Soldier presence | **A** | Perimeter and gates |
| MI03 | Cindermaw territory | **C** | Public ministry and private den |
| MI04 | Fortress approach | **C** | Industrial power behind the throne |

### Wildlands and environmental life

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| WL01 | Cultivation | **D** | Mixed ecological gradient |
| WL02 | Ash-beast habitat | **C** | Geothermal nesting grounds. Owner blend: C with a reasonable amount of A, including communal roosts and real social habitat. |
| WL03 | Safety | **D** | Context-sensitive mixture |
| WL04 | Southern volcanic country | **B** | Ash-beast territory |

### Landmarks and atmosphere

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| LA01 | Bronze survey orrery | **—** | UNDECIDED. Owner feedback: balance all four approaches: public scientific pride, royal surveying, ceremonial civic place, and maintained working heritage. Keep the dominant option formally open. |
| LA02 | Volcanic viewpoints | **D** | Multiple carefully spaced vistas |
| LA03 | Civic signature monument | **A** | Public geothermal bathhouse. Owner-selected design target, subject to water, heat, maintenance and spatial feasibility. |
| LA04 | Night character | **D** | Balanced luminous layers |

### Photographic composition

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| PH01 | Composition method | **D** | Integrated scene hierarchy |
| PH02 | Prop density and rhythm | **B** | Consistently rich environment |
| PH03 | Exploration routes | **C** | Connected discovery circuits |
| PH04 | First-visit promise | **B** | Its believable civilization |

## 11. Unified artistic and spatial contract

**First sight:** a prosperous, desirable **balanced great city**, astonishing for its mastery of the volcanic landscape and memorable ultimately for the believable life of its civilization. It has a **unified architectural tradition**, not a different Gothic trope in every block: high-quality volcanic stone, crafted ceramic façades, selective glass, pale mineral and glazed details. Ridges and rock formations frame towers and chimney clusters. Actual building silhouettes, doors, rooflines and streetfronts must share a material/construction grammar, with variations justified by function. The muted slate-violet ground and safe lava contrast from the existing visual canon remain; there is **no all-over purple ground glow**.

**Urban plan:** organically adapted useful streets and **courtyard housing** cluster around **broad civic plazas**. The city is rich in detail but meticulously maintained. Each street should appear designed by inhabitants responding to terrain, public amenities, work and commerce, not by automatic decoration scatter. Large industrial, civic and military precincts have **distinct anchors with mixed-use edges**. Rooftops, vents and chimneys show credible functional diversity while a common craft vocabulary unifies the capital. Dense civic/industrial views alternate with necessary open pedestrian space; the user's selection of consistently rich detail cannot be translated into obstruction or visual noise.

**Crownwatch:** its principal square is organized around a meaningful **public amenity**, not a giant war monument or taxation prop. It includes useful maintained frontage, well-designed plazas, market activities, workrooms and visible shelter; carefully maintained stone gardens, protected greenery and social space make residence desirable. **Heated public halls** are the principal amenity, complemented by an investigated **bathhouse/bathing culture** (CV03 C+A). The *new* public geothermal bathhouse is the selected first signature civic monument (LA03 A), not proof of an existing structure or a solved water source.

**Ash Refuge:** quieter **residential terraces with a real artisan community** (CV02 A+B). The homes, shared washing, wells, protected greenery and peaceful courtyards visually predominate; small workshops add livelihood without displacing the refuge function. Some craft and employment is voluntary or independently operated, even within regime supervision.

**Industries:** the city's strongest economic reputation is heat-based manufacturing. **Multiple glassmaking sites** and a **broad ceramic practice** operate through prominent geothermal technical nodes, with carefully organized heat delivery and protective engineering. The scene must communicate inbound materials, distinct hot work, cooling/finishing, output storage, waste/exhaust, crew safety and outgoing cargo. **Distributed delivery yards with a restrained main freight/depot concentration** (EC02 C + a reasonable amount of A) connect industry, markets and provincial roads. Allow different production sites to have purpose-specific materials and clothing, without inventing particular new exported products or a coin mint.

**Civic infrastructure and water:** treat geothermal as an **engineered resource** and as a shared public/industrial benefit. Prominent intake/plant buildings establish how the capital wins its heat from the landscape; flues and distribution serve kilns, drying and heated civic rooms rather than ending in arbitrary props. Include **protected cisterns** (EN03 A) fed from the **owner-approved buried off-region incoming water main**, pressure-balanced through architecturally integrated elevated stone/ceramic water towers; buried distribution supplies residential and civic use, including the geothermal bathhouse. Provide a **separate buried sewer/greywater return** to an identified-in-layout safe service/treatment terminus (without inventing a named off-region water source/discharge), with safe heat separation and access covers. Steam and heat delivery are not magical water supply. Preserve actual roads, two bridges, clean/dirty separation and easy maintenance rather than adding exposed pipes or aqueducts along every street.

**Homes, workplaces and food:** artisan communities (SO01 C) coexist with a meaningful **working-class domestic presence** (a reasonable amount of SO01 A). Society includes integrated public spaces for already-established peoples, rather than a newly fabricated species census. A believable food economy uses provincial goods, bounded local gardening, appropriate stores, shared kitchens and market distribution: it need not be agriculturally self-sufficient on lava. Independent craftsmen and supervised facilities coexist (EC04 B), and the increasingly restrictive regime becomes more apparent toward **military gates, perimeter institutions and the seat of power** (MI02 A and SO03 D). Architectural beauty and civic comfort must not be portrayed merely as propaganda gifted by the Dark Lord.

**Military and Ash-beast territory:** the Citadel is an academy of **artisanal military excellence**: exceptionally well-crafted armories, masonry, fittings and maintained barracks with legible security, musters and command. Cindermaw's **public ministry-facing buildings** contrast with a truly creature-specific **private volcanic den**. Geothermal nesting grounds (WL02 C) integrate a reasonable amount of **communal roost structure** (A), especially as the southern volcanic wilderness becomes recognizably inhabited by Ash beasts. The final fortress approach is defined by **industrial supply and logistical power behind the throne** (MI04 C), not just ever-increasing battlements.

**Environment:** interwoven city and wilderness, varied rocky ridges, protected cultivation where possible, tougher wild growth and naturally exposed mineral geology. Two bridges should read as **elegant industrial infrastructure** with physically credible load-bearing abutments and safe passage through the existing solid lava barrier. A context-sensitive set of hazard protections is preferable to repeated identical fences and warning props. The bronze orrery should integrate all four of the owner's suggested social roles, without changing its technical/interaction identity.

**Day and night:** memorable viewpoints are *multiple and well spaced* (LA02 D). At night, distinguish comfortable occupied interiors, industrial furnaces, volcanic glow and selective controlled official lighting (LA04 D), preserving silhouettes, actors, paths and attack telegraphs.

## 12. Photographic/game-design scene specification

Every district needs an authored, route-based **integrated scene hierarchy** (PH01 D), **consistent richness** (PH02 B) and **connected discovery circuits** (PH03 C). Stage for the game's real 2D/isometric camera, including the established 150% review zoom and a narrow phone viewport. A scene is not successful merely because an overhead blueprint looks orderly. Use current live Canvas/PixiJS captures; old dev.110 screenshots are reference material only. Preserve original approved sprite masters.

Require each key composition to show: (1) a single clear focal structure or activity, (2) a truthful walkable leading line into or through the scene, (3) layered foreground, middle distance and background, (4) relatable human/object scale, (5) activity, wear and material detail appropriate to function, and (6) sufficient **negative space** for navigation and readable actors despite consistently rich overall dressing. Major foreground props may frame, but never conceal, quest targets or player movement.

**Required design-board scenes (not yet captured):**

1. Return/arrival toward Crownwatch; architecture and a real route communicate awe before coercion.
2. A rocky ridge with the shared ceramic-and-stone city skyline and useful chimneys/towers.
3. Civic square and heated public hall, populated by recognizable ordinary activity.
4. Elegant cluster of courtyard homes with shared domestic amenities and protected gardens.
5. Ash Refuge's quiet residential terraces, with smaller artisan workyards.
6. One visually traceable geothermal intake/distribution scene feeding useful facilities.
7. A second, distinct glass/ceramic production precinct with cooling, output and loading.
8. Each of the two actual lava bridges, with structure, approach and collision matching.
9. Balanced freight distribution and food/provisions on market and industry streets.
10. **Foundry exterior and a fully equipped, working-capable interior** showing meaningful machinery, receiving/finishing/dispatch areas and existing hostile guards ready for the player.
11. Citadel training/armory and best-quality functional military stonework.
12. Cindermaw-facing administrative facilities versus private den and geothermal communal Ash-beast nesting.
13. Crystal Deposit sorting/storage/secure dispatch without unapproved refinement claims.
14. Orrery as an attractive technical, survey and civic landmark.
15. Industrial fortress supply route and final political/defensive approach.
16. Matching evening/night crops, especially civic comfort versus working heat and official security.

Each view needs a named intended emotional/informational focal point; builders must inspect adjacent connecting streets too. All paths, player interaction spots and real entrances must remain visibly obvious and physically traversable.

## 13. Explicit Foundry supersession and the two open selections

### PC03 — unselected letter; latest owner clarification controls presentation

The creator's original 2 November direction was: "I actually need it not to be ruined anymore, it needs to be remade so it is fully functional. Its inhabitants make it productive, interiors will need to account for that." **The subsequent 3 November clarification narrows how this is shown during gameplay:** the player enters killing everyone; occupants would reasonably be ready to fight, not standing at equipment. The Foundry may be shown entirely through authentic industrial machines/equipment and prepared hostile guards, with **no visible people working and no simulated production-worker AI**.

**Binding:** the site must be genuinely maintained, believable as productive before the invasion, and laid out as a professional industrial institution rather than a derelict mini-dungeon or an armed barracks with one furnace. It needs credible hot-work capacity, protected tools/machines, room-sized work zones, stock movement and ventilation. However, no actor performing labor, ambient human animation, harmless civilian staff, individual work orders, special combat transition or running resource economy is required. The original guards' existing hostile behavior is appropriate for the moment of entry.

**Exterior:** meaningful original entrance, structurally sound stone/glazed/ceramic massing as appropriate, guarded receiving/dispatch apron, service access and exhaust. Keep the existing entrance and saved identity.

**Interior production logic (environmental, not simulated transactions):** incoming materials and storage → preparation → real furnaces/forges and forming/casting machinery → air-cooling/finishing/inspection tools → secured finished stock → dispatch via the **same original entrance**. Distinguish equipment and actual work surfaces from military bunks/command stations. Show plausible heat input, waste heat, ventilation, maintenance and clear player/combat movement, but do not invent a water-fed quench, automatic power plant, goods list, craft system or material recipes. Machines can be stationary; any eventual subtle machine motion must not depict people using them or imply a mechanized resource economy.

**Combat and continuity:** preserve `side-crown-foundry`, original 14 hostile Crownguards, seven pillars, four traps, the critical Codex, quest/loot/reward IDs, v4 saves and the sole exit. Existing guard home positions/AI, sightlines, attack telegraphs, combat retreat paths and working machinery must be compatible. The production floor is empty of working civilians because the inhabitants are defending it, not because the Foundry is abandoned. Previous five decorative workstations with built-in animated laborers in implementation draft #769 are **historical provisional implementation**, to be replaced/retreated as *equipment-only* in that branch's authorized Phase-4 art work without rewriting the enemy AI.

**Naming remains undecided:** the historical public title "Ruined Foundry" would misdescribe the finished institution. A new player-facing proper name needs owner approval. No name was selected here; do not change save/internal identity merely to rename a label.

### LA01 — unselected letter, integrated direction

The orrery remains a **balanced synthesis** of public scientific pride, royal survey authority, ceremonial civic beauty and restrained technical heritage. Do not assign one of those meanings sole primacy, and do not invent magical functions, a quest, or a new menu. The selected setting can combine the four visually while leaving the form's A–D choice unfilled.

These are the **only two unselected questionnaire answers**. Their substantive feedback is recorded and does not prevent a complete design contract. Specific unanswered production, staffing, water and proper-name details should be handled through narrowly scoped technical or creative decisions **when** an implementation is separately commissioned, without reopening the already approved 50 choices.

## 14. Work phases, evidence and acceptance (future implementation only)

**Stage 0 — reconcile latest source and scene evidence:** site/spawn/object/road/collision/saved-ID inventory, current day/night/native PixiJS and Canvas screenshots, 150%-camera and narrow-phone captures, relevant exact SHA. Check current construction against approved art and October 29 road rollback. No assumptions that old screenshots certify new release composition.

**Stage 1 — engineering feasibility and detailed design:** safe protected-cistern plan, water source/drainage/bathing function; heat intakes/exchange, pipe/flue continuity and kiln operations; actual input/work/output/transport chains for glass, ceramics and Foundry; support for civic greenery; guard-ready occupancy and equipment-only Foundry floor flow; safe road/bridge/room geometry. Record where source permits a detail and where owner must decide actual new lore or assets.

**Stage 2 — visual composition and site layout:** district-scale art bible and the 16 key view boards above, with clear compositional hierarchy, believable scale, controlled density, exact material palette, negative space, input/output flows and camera journey. Do not replace authored street plans with automatically joined generic routes.

**Stage 3 — implementation (NOT AUTHORIZED BY THIS DOCUMENT):** only after an owner-initiated implementation commission, execute focused exterior/interior site passes on a separate branch. Preserve world collision, travel routes, bosses, existing parties, assets, save/quest/resource IDs and story; reconcile the Foundry's eventual new visible name only after approval. Do not silently relocate Ironroot's portrait-crown mint or Ashen Frontier's Abyss Bastion dragon project.

**Stage 4 — implementer-owned validation (not run):** deterministic scene/geometry checks; old/new v4 save restoration and identity; in-game bridge and entrance traversal; services/quest objectives/actors not blocked; combat and trap visibility including Foundry/Citadel; machine/equipment presence and no active working figures during hostile entry; Canvas/Pixi rendering parity, GPU/regression considerations; day/night screenshots and legible small-device views. Fix actual acceptance defects before asking the owner to judge art.

**Stage 5 — creative acceptance, merge and publication (not authorized):** owner reviews a technically audited, genuinely playable candidate. Separate design-approved, implemented, tested, reviewable, merged, published, device-verified and artistically accepted statuses. This documentary update does not trigger full testing, merging or deployment.

**Artistic nonnegotiables:**

1. The player understands why this capital is **desirable to inhabit** and why its landscape is a shared cultural achievement.
2. The region reads as a civilized city with **unified stone/ceramic/glass craft**, appropriate ridge/topography, authentic homes and civic/industrial wealth.
3. Industrial heat, baths, cleaning, food, glass/ceramic manufacture and freight have believable access, input/output and safety; exact engineering claims remain feasible.
4. The **Foundry is maintained, properly equipped and credible as a productive institution**, inside and outside; its original inhabitants are combat-ready during the player's intrusion. No active workers or worker AI are necessary, and a generic ruined-dungeon fallback is unacceptable.
5. Rich scenes remain readable and traversable. Working plazas, courtyard passages and lava crossings do not become decorative obstacles.
6. Government pressure escalates toward military institutions; the Citadel reflects beautiful discipline, while Cindermaw and wild Ash-beast habitats retain distinct social logic.
7. Preserve approved original artwork, protected IDs/saves and combat, visual telegraphs and the established two actual lava crossings.
8. The chosen options, including all owner blends, remain traceable; **PC03 and LA01 are not falsely marked selected**.

**Status evidence:** this change is documentation only, recorded in draft PR #707. No runtime source/visual assets changed; no tests, player captures, merge, publication, device verification or owner rendered-art acceptance are claimed.

## Review outcome

The previous regime pass is a useful technical foundation, not an adequate final capital art direction. **This authorial design reconciliation is now complete at the high-level level of 50 choices and two binding freeform directions.** The next stage, if separately commissioned, is source/visual feasibility and an authored reconstruction, not another broad questionnaire. The region should inspire the question: **How did people make somewhere so dangerous into somewhere worth living?** Then, in the course of play, **who now controls what they built?**
