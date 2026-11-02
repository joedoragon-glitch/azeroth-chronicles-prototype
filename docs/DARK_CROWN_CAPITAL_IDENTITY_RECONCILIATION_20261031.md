# Dark Crown — capital identity, lore and environmental-design reconciliation

**Game:** *So I Became the Dark Lord's Problem*  
**Original foundation:** 31 October 2026; **owner-authorized art-direction reconciliation:** 2 November 2026  
**Scope:** pre-overhaul lore, photographic/gameplay composition, metropolitan livelihood, fully productive Foundry, and engineering/industrial design.  
**Initial review baseline:** main at 4dd55ad352c8; **rechecked main on 2 November:** 90d92b1eabb1. Re-evaluate latest source and rendered scenes before any future implementation.  
**Status:** **implementation-ready AUTHORIAL DESIGN CONTRACT in a documentation-only draft PR. Not a runtime implementation or authorization to start one.** The owner selected 50 of 52 four-option answers and added binding verbal instructions for the two unselected questions, PC03 and LA01. The binding selection register and interpretation/acceptance contract in sections 10–14 supersede any earlier exploratory design possibilities in this document where they differ.  
**Existing authoritative context:** [Development state](DEVELOPMENT_STATE.md), [Decisions](DECISIONS.md), [Dark Crown regime layout](DARK_CROWN_REGIME_LAYOUT.md), [Crown dev.110 composition and thermal works](CROWN_COMPANIONS_20261020.md), [regional road rollback](REGIONAL_STREET_CLEARANCE_ROLLBACK_AUDIT_20261029.md), [main data](../src/prototype/data.js), [world and decorative rules](../src/prototype/rules.js), [Keeper's Archive](../src/prototype/archive.js), [renderer](../src/prototype/visuals.js), and [the terrain material contract](GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md).

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

**Key supersession:** The current source's `Ruined Foundry` is a **historical baseline, not the approved end state**. The owner now directly requires a *fully operational foundry* with **active productive inhabitants and a spatially credible working interior and exterior**. The exact goods, worker NPC plan, additional interactions and new public-facing proper name are unresolved. Preserve `side-crown-foundry` and progression/save identity until a specifically reviewed implementation. Former 21 October "keep side dungeons unchanged" direction is superseded **for this Foundry's future environmental purpose and design**, not wholesale for other side dungeons or quests. The bronze survey orrery (LA01) must **balance all four** civic/survey/scientific/heritage identities, without inventing mechanics. Both **PC03 and LA01 remain literally unselected** in the questionnaire.

**Engineering/creative boundaries:** The approved 50 visual decisions are not authorization to fabricate lore or freely modify functionality. Maintain current lava and two real crossing gaps, v4 saves and site IDs, existing quests, player/companion/enemy navigation, Citadel/Treasury combat, approved original art, native Canvas/PixiJS parity and phone-scale visual readability. Water storage and the bathhouse are selected **feasibility/design directions**; no cistern water source, bathhouse plumbing, raw material recipe, added craft system, new resource economy, worker population or new monument location is established as current canon. The Ironroot portrait-Crown mint stays in Ironroot; Abyss Bastion's dragon project stays in Ashen Frontier. Do not restart blanket road joining/displacements that the October 29 rollback reversed.

**Explicit user authorization boundary:** As of this handoff, the owner requested **documentation only, not an implementation, merge, deployment or device certification**. When the owner opens a *new* session and explicitly authorizes implementation, that later instruction defines the new scope. Do not interpret the existence of this contract/PR as standing permission to modify code or publish it. Use a **new implementation issue/branch/PR**, as appropriate, rather than silently turning the documentation-only PR into a gameplay overhaul or merging it without permission. Reuse #707 as the source reference; keep one authoritative design contract, not duplicated competing plans.

**New-session engineering starting point, after explicit authorization:** (1) Fetch PR #707 and this exact document from its **branch**; (2) read repo instructions, live `main`, merged/outstanding landscape/rendering/side-dungeon changes; (3) inspect/capture actual current Dark Crown world and Foundry interior at 150% camera and a phone-scale viewport, day and night, in the active renderer; (4) inventory gameplay geometry, site IDs, enemies/NPCs, materials, saved placement, transport/industrial input-output and water feasibility; (5) produce a precise source-grounded layout/engineering plan with scene-by-scene artistic compositions and identify the few truly consequential unresolved decisions, including the Foundry's new public name and credible water source; (6) implement only within the owner's later approved scope, with small focused regressions and realistic artwork review; (7) distinguish implemented, tested, mergeable, merged, published, device-verified and creative-accepted.

**Acceptance:** A competent developer unfamiliar with this chat must be able to explain the capital's livelihood and resource flows, draw a coherent city-to-wildland circulation plan, produce representative native camera crops, design a genuinely *working* foundry interior with active inhabitants, explain where heat and water come from, preserve game/saving identities, and enumerate meaningful focused tests. "More banners/black roofs/lava props" is **not** a solution. The detailed implementation acceptance checks are in section **14**.

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
| EN03 | Water study | **A** | Protected cisterns. Selected first feasibility direction, not proof of existing cisterns or a water source. |
| EN04 | Environmental controls | **D** | Integrated civic engineering |

### Production and crafts

| ID | Question | Selection | Binding interpretation |
| --- | --- | --- | --- |
| PC01 | Glassmaking identity | **C** | Multiple production sites |
| PC02 | Ceramic specialization | **D** | Broad craft industry |
| PC03 | Foundry character | **—** | UNDECIDED. Binding written override: the Foundry must no longer be ruined in its finished state. Rebuild it as a fully functional productive institution, with working inhabitants and interiors designed around actual production; see detailed Foundry contract below. |
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

**Civic infrastructure and water:** treat geothermal as an **engineered resource** and as a shared public/industrial benefit. Prominent intake/plant buildings establish how the capital wins its heat from the landscape; flues and distribution serve kilns, drying and heated civic rooms rather than ending in arbitrary props. Investigate **protected cisterns first** (EN03 A), subject to documented collection/replenishment, potable water, bathing draw, wastewater disposal, thermal separation and safe building support. Steam and heat delivery are not magical water supply. Exhaust, drainage, maintenance access and industrial servicing should use an integrated civil engineering strategy; do not add large unsupported aqueducts, inaccessible vents or arbitrary water features.

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
10. **Foundry exterior and a fully functioning interior** showing production and active inhabitants.
11. Citadel training/armory and best-quality functional military stonework.
12. Cindermaw-facing administrative facilities versus private den and geothermal communal Ash-beast nesting.
13. Crystal Deposit sorting/storage/secure dispatch without unapproved refinement claims.
14. Orrery as an attractive technical, survey and civic landmark.
15. Industrial fortress supply route and final political/defensive approach.
16. Matching evening/night crops, especially civic comfort versus working heat and official security.

Each view needs a named intended emotional/informational focal point; builders must inspect adjacent connecting streets too. All paths, player interaction spots and real entrances must remain visibly obvious and physically traversable.

## 13. Explicit Foundry supersession and the two open selections

### PC03 — unselected letter, unequivocal environmental requirement

The creator's direct correction was: "I actually need it not to be ruined anymore, it needs to be remade so it is fully functional. Its inhabitants make it productive, interiors will need to account for that."

**Binding:** the future site must be a genuinely functioning, meticulously maintained foundry with a credible production-focused **interior and inhabited working life**. The existing source calls it Ruined Foundry and the October 21 side-dungeon document deferred redesign. **This later, specific owner direction supersedes that deferral for the Foundry's environmental role, artwork, spatial design and productive habitation.** It does not authorize a new quest, crafting menu, item economy, named NPC cast or changes to combat without separate scoped approval. Merely deleting rubble, placing a furnace in a guard barracks, or leaving the interior an abandoned mini-dungeon fails the new owner requirement.

**Future exterior:** design an industrially meaningful entrance, structural masonry and roof masses, protected service apron, receiving/shipping area, sound venting/chimney language and a real accessible route. Preserve the existing site coordinate and save identity unless a later audited move is necessary and approved.

**Future interior:** plan a believable production chain: arriving material and inventory → preparation → hot work (forging/casting/repair according to eventual product decision) → cooling and finishing/inspection → secured completed stock → outbound transfer, with relevant tools, power/heat delivery, water/ventilation, safe staff movement, maintenance, meals/rest and guard stations that are **not** mistaken for the production space itself.

**Productive inhabitants:** production must be visibly accomplished by the site's inhabitants, not inferred from a pile of static tools. The implementing developer must audit current interior residents and their actual state-machine roles. If current actors only fight/guard, a later scoped plan must specify how production workers/inhabitants are represented with compatible visual poses, ambient actions or appropriate additional actor roles. Such behavior and actor additions are **future implementation choices**; this document authorizes their design need but does not silently add new characters to canon or implement mechanics.

**Continuity:** retain internal side-crown-foundry, related Codex identity, quest/progression/hostility rules, preexisting saved values and entrance unless specific later approval says otherwise. Design the room so production zones and combat/nav areas coexist logically. Source audio, titles, map labels, in-world text, art specifications and EN/ES descriptions must be reconsidered at implementation.

**Naming remains undecided:** the historical public title "Ruined Foundry" would misdescribe the finished institution. A new, not-ruined player-facing proper name needs owner approval. No exact new title was chosen. Preserve old references as historical records, not future player-facing art canon.

### LA01 — unselected letter, integrated direction

The orrery remains a **balanced synthesis** of public scientific pride, royal survey authority, ceremonial civic beauty and restrained technical heritage. Do not assign one of those meanings sole primacy, and do not invent magical functions, a quest, or a new menu. The selected setting can combine the four visually while leaving the form's A–D choice unfilled.

These are the **only two unselected questionnaire answers**. Their substantive feedback is recorded and does not prevent a complete design contract. Specific unanswered production, staffing, water and proper-name details should be handled through narrowly scoped technical or creative decisions **when** an implementation is separately commissioned, without reopening the already approved 50 choices.

## 14. Work phases, evidence and acceptance (future implementation only)

**Stage 0 — reconcile latest source and scene evidence:** site/spawn/object/road/collision/saved-ID inventory, current day/night/native PixiJS and Canvas screenshots, 150%-camera and narrow-phone captures, relevant exact SHA. Check current construction against approved art and October 29 road rollback. No assumptions that old screenshots certify new release composition.

**Stage 1 — engineering feasibility and detailed design:** safe protected-cistern plan, water source/drainage/bathing function; heat intakes/exchange, pipe/flue continuity and kiln operations; actual input/work/output/transport chains for glass, ceramics and Foundry; support for civic greenery; labor/inhabitant functions and Foundry interior flow; safe road/bridge/room geometry. Record where source permits a detail and where owner must decide actual new lore or assets.

**Stage 2 — visual composition and site layout:** district-scale art bible and the 16 key view boards above, with clear compositional hierarchy, believable scale, controlled density, exact material palette, negative space, input/output flows and camera journey. Do not replace authored street plans with automatically joined generic routes.

**Stage 3 — implementation (NOT AUTHORIZED BY THIS DOCUMENT):** only after an owner-initiated implementation commission, execute focused exterior/interior site passes on a separate branch. Preserve world collision, travel routes, bosses, existing parties, assets, save/quest/resource IDs and story; reconcile the Foundry's eventual new visible name only after approval. Do not silently relocate Ironroot's portrait-crown mint or Ashen Frontier's Abyss Bastion dragon project.

**Stage 4 — implementer-owned validation (not run):** deterministic scene/geometry checks; old/new v4 save restoration and identity; in-game bridge and entrance traversal; services/quest objectives/actors not blocked; combat and trap visibility including Foundry/Citadel; intended worker presentation; Canvas/Pixi rendering parity, GPU/regression considerations; day/night screenshots and legible small-device views. Fix actual acceptance defects before asking the owner to judge art.

**Stage 5 — creative acceptance, merge and publication (not authorized):** owner reviews a technically audited, genuinely playable candidate. Separate design-approved, implemented, tested, reviewable, merged, published, device-verified and artistically accepted statuses. This documentary update does not trigger full testing, merging or deployment.

**Artistic nonnegotiables:**

1. The player understands why this capital is **desirable to inhabit** and why its landscape is a shared cultural achievement.
2. The region reads as a civilized city with **unified stone/ceramic/glass craft**, appropriate ridge/topography, authentic homes and civic/industrial wealth.
3. Industrial heat, baths, cleaning, food, glass/ceramic manufacture and freight have believable access, input/output and safety; exact engineering claims remain feasible.
4. The **Foundry is fully functioning and inhabited by productive workers**, inside as well as outside, with no generic ruined-dungeon fallback.
5. Rich scenes remain readable and traversable. Working plazas, courtyard passages and lava crossings do not become decorative obstacles.
6. Government pressure escalates toward military institutions; the Citadel reflects beautiful discipline, while Cindermaw and wild Ash-beast habitats retain distinct social logic.
7. Preserve approved original artwork, protected IDs/saves and combat, visual telegraphs and the established two actual lava crossings.
8. The chosen options, including all owner blends, remain traceable; **PC03 and LA01 are not falsely marked selected**.

**Status evidence:** this change is documentation only, recorded in draft PR #707. No runtime source/visual assets changed; no tests, player captures, merge, publication, device verification or owner rendered-art acceptance are claimed.

## Review outcome

The previous regime pass is a useful technical foundation, not an adequate final capital art direction. **This authorial design reconciliation is now complete at the high-level level of 50 choices and two binding freeform directions.** The next stage, if separately commissioned, is source/visual feasibility and an authored reconstruction, not another broad questionnaire. The region should inspire the question: **How did people make somewhere so dangerous into somewhere worth living?** Then, in the course of play, **who now controls what they built?**
