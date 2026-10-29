> **29 October implementation reconciliation:** #570 implements the selected 3200-unit layout, source migration 1 and scene revision 2. The authorial decisions remain unchanged. This document preserves its original design/audit context; [current handoff](GREENWOOD_FLAGSHIP_WORK_HANDOFF_20261028.md) and [Development state](DEVELOPMENT_STATE.md) own current engineering, owner authorization, release and pending playtest status. Earlier directions to start measurement or await implementation are historical.

# Greenwood Vale — approved owner art-direction decisions

**28 October 2026 · Authorial decision register · 50/50 selections resolved, including C06**

**Game:** *So I Became the Dark Lord's Problem* (historical repository name: Azeroth Chronicles). **Scope:** flagship completion of the unfinished Greenwood Vale opening region, [epic #545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/545) / [draft PR #544](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/544). **Status:** authorially **approved creative/art direction** and the exact Scornfang name—not new player-visible lore beyond expressly identified ownership, not a tested/merged/published feature, and not approval for every optional example in the earlier brief. Implementation awaits branch-based engineering.

## Authority and how to use this register

1. **Existing game source and established canon remain authoritative** for quests, actors, world identities, existing accepted designs, settlement purpose, the political order, dungeons, currency/reward balance, encounter rules and saved-game state. Relevant current code should be reread from latest `main` at implementation time. Audit reference was `2bab5c73…`; latest reviewed main while preparing this register: `5addd94a0401738e385d834db965694128b76e4b`.
2. **Owner-selected artistic direction (this register)** authorizes Work to make coherent visual and spatial compositions *within those constraints*. A selected example such as oak–hickory-like trees is visual reference, not a requirement to add real-world botany, new sprite masters or game ecology lore. Selection does not signify implemented or device verified.
3. [Original Piedmont design brief](GREENWOOD_VALE_PIEDMONT_REGIONAL_IDENTITY_DESIGN_BRIEF_20261028.md) is **unchanged historical proposal/source inspiration**. This register supersedes its open creative options where the owner has chosen among them; examples not selected or independently authorized **remain optional**.
4. [Technical source audit](GREENWOOD_VALE_GEOGRAPHY_SETTLEMENT_LIVELIHOOD_AUDIT_20261028.md) governs identified current systems/risks, and [Work implementation handoff](GREENWOOD_FLAGSHIP_WORK_HANDOFF_20261028.md) governs staged delivery. On a conflict, inspect fresh code and the latest explicit owner direction; record an uncertainty instead of inventing a retcon.
5. **C06 specific correction:** the Treasury belongs to Scornfang. The final **approved player-facing proper name is “Scornfang's Treasury”**; there is no naming decision left open. The current `supply-vale` source instead displays “Thornfang's Treasury”, while `roomCaptains['supply-vale']` identifies captain **Scornfang** and `boss:'thorn'` / `mentor:'thorn'` retain their existing meanings. Rename *visible title, objective, map, inspection, descriptive, and applicable EN/ES references* consistently in the actual future implementation without changing internal IDs, encounter logic, mentor relationships, save keys, existing quest payouts, or inventing a second Treasury. Do not prematurely rewrite unrelated lore solely because of the naming correction. Owner's explanation is ownership, not a newly mandated kingdom-wide ministry.
6. **No implicit delivery approval:** keep implementation on isolated branches/draft PRs; focused tests and normal build only unless broader certification approved; never merge, publish, change release scope or claim real-device acceptance without separate permission.

## All 50 owner selections

The original A/B/C/D labels and selected option wording are retained to avoid ambiguous reinterpretation. C06 also includes the owner's subsequent **final** direct naming confirmation, which supersedes the earlier “propose for separate approval” hold.

### 1. Regional identity and landscape

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| G01 | A | Primary geographical reference, translated into independent medieval fantasy. |
| G02 | B | Beautiful and peaceful at first, with unease beneath the surface. |
| G03 | A | Subtle slopes and gentle terrain changes, mostly open countryside. |
| G04 | B | A broad cultivated valley transitioning gradually into deeper forests. |
| G05 | B | Frequently inhabited or maintained, with visible smallhold activity. |
| G06 | A | Green hardwood valleys, small fields, red-earth paths and working water. |

### 2. Forests, vegetation and regional ecology

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| E01 | A | Oak–hickory-like hardwood forests with broad, rounded crowns. |
| E02 | B | Layered forest patches, groves and wooded corridors throughout the valley. |
| E03 | A | Very occasional accents on dry, higher ground. |
| E04 | D | Managed banks near farms and bridges, increasingly wild downstream. |
| E05 | B | Dense in woodland interiors, sparse near roads and settlements. |
| E06 | B | A few recognizable woodland variants if the current artwork supports them. |

### 3. Seasons, ground colors and road identity

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| M01 | B | Mature summer countryside with deeper forest shade. |
| M02 | A | Fresh greens, honey timber and soft earth. |
| M03 | A | A defining but localized feature on busy roads and exposed banks. |
| M04 | A | Clear main cart roads, narrower local farm lanes and faint forest footpaths. |
| M05 | A | Stone foundations and bridges, with timber structures dominant. |
| M06 | A | Selective bank sediment, damp hollows and compacted road wear. |

### 4. River, working mill, pond and crossings

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| W01 | C | A working valley river with maintained crossings and occasional rough stretches. |
| W02 | C | An obviously engineered working pond with a small dam and controlled outlet. |
| W03 | D | A larger signature valley building, clearly more important than a cottage. |
| W04 | D | Keep hydraulic construction understated while ensuring it makes physical sense. |
| W05 | B | Frame it as a rural farm water source, without adding mechanics. |
| W06 | B | Both practical rural crossings, differing mainly in road width and use. |

### 5. Millhaven, Orchard Hamlet and architecture

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| S01 | A | Welcoming rural crossroads with a visible central working street. |
| S02 | B | An attractive village composition with several grounded houses and workshops. |
| S03 | A | Natural, slightly irregular lanes adapted to terrain and buildings. |
| S04 | C | Strong visible distinction between homes, workshops, storage and public services. |
| S05 | A | Smaller and quieter, with orchards and farmland visibly dominating. |
| S06 | A | Quiet and lived-in, with modest tools, laundry, gardens and carts. |

### 6. Orchard expansion, farms and storage

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| F01 | B | Several distinct stages of planting, growth and active maintenance. |
| F02 | D | Organic village orchards with less obvious geometric planting patterns. |
| F03 | C | Consider a few historically plausible fruit variants after source/canon review. |
| F04 | A | Simple earth-banked storage entrance beside the orchard. |
| F05 | A | A balanced mixture of small fields, pastures and kitchen gardens. |
| F06 | B | Clear production chain from orchard through cellar and roads toward town. |

### 7. Woodland societies, reclamation and winter estate

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| C01 | A | Practical domestic shelters, meals and belongings alongside defensive areas. |
| C02 | B | Older funerary surroundings repurposed as a practical community position. |
| C03 | C | A dangerous but inhabited space with clear training, feeding and shelter areas. |
| C04 | C | Several small connected staging scenes that tell the supply story visually. |
| C05 | D | A dramatic contrast between ancient sacred/funerary architecture and new estate works. |
| C06 | C → final approval | Scornfang's Treasury. The Treasury belongs to Scornfang, not Thornfang. This exact player-facing name is approved. |
| C07 | D | Balanced: visible infrastructure and coercion coexist without overt visual melodrama. |

### 8. First-hour experience and artistic composition

| Decision | Selection | Approved authorial direction |
| --- | --- | --- |
| P01 | C | Minimal direction: let interesting shapes and nearby activity invite curiosity. |
| P02 | B | Longer contrasting circuits through farms, woods and estate edges. |
| P03 | B | Several memorable visual scenes, with quieter transitions between them. |
| P04 | A | Restrained countryside ambience, foliage and water where existing audio allows. |
| P05 | A | Welcoming day; more mysterious woods and estate by night. |
| P06 | C | Fairly consistent moderate detail across settled and wild districts. |
| P07 | D | Ordinary life and the Dark Lord's influence coexist in an interesting way. |

## Owner's overarching quality expectation (binding acceptance requirement)

The owner expects geographically and aesthetically sensible placement of **every visible functional feature**, with **roads remaining usable**. A house that blocks a road, a fence that seals a service door, an impossible bridge approach, an inaccessible mill, a tree concealing interactions or combat, or a relocated enemy compound that breaks its patrol is a *development defect*, not work to be sent to the owner for repeated audit. The goal is a first region that the owner can **actually playtest and reasonably approve** after the implementing engineer has already performed a credible independent spatial/functional/visual review. Reasonable final-stage cosmetic polish can wait; incomplete working geography, inaccessible destinations, broken quests or unsound scene composition cannot.

The author expressly said: *“Just make sure the location of different props and features make sense aesthetically, you respect roads ... a region that I don't need to audit and audit the audit giving me extra homework ... players will judge us for this region so you need to give it your best.”* This is an acceptance standard, not authorization to invent new gameplay systems.

## Integrated artistic interpretation — no outstanding broad questionnaire

- **Terrain, character and pacing:** Eastern American Piedmont is the **approved primary environmental reference**, interpreted as original medieval fantasy, not American colonial history. Gentle implied relief, green mature-summer hardwood farmland, honey timber, a selective red-clay road/soil accent, broad cultivated valley, and layered woodland edges serve a beautiful opening that gradually becomes uneasy. Avoid Ironroot's autumn mountain identity and the Marches' coastal wetlands.
- **Settlement grammar:** Millhaven has a coherent main working street, irregular useful connecting lanes, identifiable differently functioning services, believable house/hero scale, open frontages, and calm daily-life props; Orchard Hamlet is smaller, quieter and clearly agrarian. S02's attractive composition coexists with P01's low-text curiosity by keeping real road exits/needed services obvious without creating new tutorials.
- **Agriculture:** The existing orchard becomes a visibly **active expansion with stages of growth**, in organic village groves rather than rigid rows; balanced small fields, pasture and kitchen gardens, plus carts, fruit cellar and freight routes form a readable *visual* livelihood chain. **F03 is conditional:** inspect current orchard fruit canon/art first; additional plausible variants are candidates only, not an order to add new fruit, crops, interactions or paid resources.
- **Mill and waterways:** One credible engineered Mill pond with small dam/outlet and **signature-size actual mill**; understated but sensible water-power connection. Keep separate eastern water feature and frame it visually as a rural farm-water source without adding interaction, utility economy or changing established water/tribute identity. Main and southern bridges are practical rural crossings distinguished principally by width/use. **E04 downstream** follows actual authored water flow; do not invent upstream/downstream orientation. Scene water and collision must coincide.
- **Forest/inhabitants:** Broad-canopy oak–hickory-*like* tree composition, occasional dry-rise pine, layered groves and deeper understory away from roads, with managed banks near people and wilder banks downstream. **E06 conditional** on approved art compatibility; no mandatory botanical catalog. Goblin households have domestic life alongside defensive areas; Thornfang's den is dangerous but lived in. Skeleton watch may be staged among **older-looking funerary/ruin materials only where existing canon supports this**; do not invent a burial practice, religion, historical event or displacement. Preserve Goblin-occupied Old Orchard Cellars and their Codex; separately add a **decorative-only** current working earth-banked cellar.
- **Scornfang and the estate:** Distinct Scornfang-owned Treasury and separate Thornfang scout/mentor identity; several small readable Crypt → woodland cache → Treasury reclamation/staging scenes. The Crypt/unfinished winter estate juxtaposes **established old funerary architecture** and working adaptive reuse/construction, without inventing sacred practice, separate treasury, or an implied real-world seasonal explanation. Coercion and useful administration coexist without melodrama.
- **Exploration/audio:** Longer connected farm–woods–estate loops, a few memorable visual sequences with quieter connective country, minimally instructive but actually legible services and destination cues, gentle day and mysterious woods/estate at night, and restrained existing audio where supported. Consistent **moderate 150%-camera detail** and visible actors, attack telegraphs, interactables, entrances and roads take priority over densely planted decorative props. No mandatory new music recordings or systems.

## Execution/acceptance assignment — six stages

| Issue | Owner-approved intent Work must implement or demonstrate | Proof expected before owner acceptance |
| --- | --- | --- |
| [GV-A #546](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/546) | Measure current 2,700 and viable 3,200/3,400 scenarios; allocate enough **usable** land for articulated Piedmont-like rural districts; do not shrink houses to fake space. | Repeatable fresh-seed and old-save geometry/prop census, crossings, actor/building clearances, travel/encounter gaps, path/cost and native comparison; choose defensible size. |
| [GV-B #547](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/547) | Coherent actual river and mill water/collision, two working bridge approaches, a cart-road/farm-lane/footpath hierarchy, distributed but connected settlements, viable quiet/wild transitions. | Automated/observed route coverage, **no blocked road/door/service** and intact compound/quest/transport destinations; deterministic essentials and migration idempotence. |
| [GV-C #548](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/548) | Millhaven working crossroads, quieter Orchard Hamlet, organic multi-stage growing orchard, farm/cellar/road logistics, actual functional-looking signature mill, timber-and-stone visual hierarchy. | Real full-scene camera shots of cohesive settlements and working structures, unobstructed lanes, legible village services and noninteractable decorative cellar. |
| [GV-D #549](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/549) | Fix named sites and visual lore; implement **Scornfang's Treasury** visible name and ownership without mechanical ID/mentor/boss/save changes; preserve all six quests and old Goblin cellar. | Source-wide EN/ES and UI title/objective inspection, quest/tribute/companion/captive/side-dungeon compatibility, existing travel, encounter and named site ID checks. |
| [GV-E #550](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/550) | Beautiful, believable and slightly uneasy first region; 10-minute readable newcomer view and longer contrast-rich free-roam loops with minimal text direction. | Whole-composition 150% native screenshots, desktop/phone-layout/day-night review and guided first-hour observation; fix obvious self-found problems before owner sees it. |
| [GV-F #551](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/551) | Preserve saved v4 positions, quests, 640-crown finite outdoor tribute, 32 configured ordinary enemies, terrain routes, actual scene continuity, default Canvas and optional Pixi fallback. | Focused exact-head tests/build, targeted migrated v4 save runs, collision/routes, measured render/path performance and separate genuine device-acceptance label. |

## Decisions still assigned to engineering, not the owner

Exact map side selected from 3,200/3,400 (or another measured justified solution), coordinates, scene/compound placement, visual use of existing sprite/procedural families, pond/hydraulic topology within collision constraints, relative number of nonessential props, source architecture refactoring, deterministic placement/migration, focused test selection and native layout acceptance. Work may choose those within this register and relevant canon, documenting tradeoffs. **Do not send the owner another 50-question creative audit**; only genuinely new material story/feature changes require further authorial input.

**Status ledger:** creative direction **approved/recorded**; implementation **not started by this document**; game-specific tests **not run by this document**; **not merged, published or device-verified**. Draft PR #538 remains a separate interaction project. The historical proposal brief remains intact.
