# PR #300 — pre-certification worldbuilding implementation quality audit

**Audit basis:** 14 October 2026 director canon PR #298 plus later explicit Dark Lord, Rogue, city-layout and quest/Archive directives; active single PR #300 branch `implementation/director-snapshot-20261013`. Review of actual game owners (`data/rules/world/engine/boss-combat/renderer/visuals/archive/narration`), the implementation ledger, user-reviewed quest PRs #168/#184/#188 and Keeper reference PR #185/#205. This is a **targeted source and focused engine audit**, not a peer review, final comprehensive regression, historical-save certification, browser/phone aesthetic acceptance or authorization to publish. The branch can advance after this report; recheck its head before final certification.

## Executive disposition

**Do not announce scope complete just because a ledger row says implemented.** Nearly all 45 choices have an identifiable integrated source path and/or earlier focused or batch evidence; the highest current risk is *quality of player-facing delivery and cross-system interaction*, not an entirely absent boss package. No final exact-current-head green certificate has been established. Relevant later director revisions **supersede** incompatible rows in the original #298 ballot, especially Dark Lord Royal Taxation and anonymous windups.

**Newly identified and corrected in this review:**
- Town/hamlet houses had **terrain-only** first placement; later road-clearance relocation compared roads and some other entities without measuring roof-to-roof projected overlap. Added `townVisualClearance` in `world.js`: deterministic outward/sideward plots, pixel-projection roof checks, preserved 13 original houses/region, protected present and future specialist spawn plots, Barracks/nodes/guard homes, roadway setbacks and one-time save-safe migration marker. No decorative/new housing system or removed buildings.
- Interactable **named non-bridge landmarks** could remain on road centerlines despite props being road-safe. Added `clearNamedRoadMarkers`: small nearby shoulder placement, preserved stable IDs/quests/landmark identity and protected intentionally roadway-based bridge/trail-track markers; one-time marker version.
- Renderer drew NPC, enemy and building labels individually, with no shared collision check. Added screen-space `labelSlots` and priority ordering for NPC/actors/buildings/resource labels; unsuccessful lower-priority placements are withheld rather than painted on another name. No entity health, hitbox or name source changes.
- The earlier worldbuilding pass had strong lore tables but uneven **quest accessibility and organic narrative delivery**. Found the controlling 30-quest review in #184/#188: **17 deliberately silent quests, 12 selective Chronicle passages and one final-approach milestone**; #20 and #21 are user-approved wording. Do not restore generic quest-completion narration or rewrite all 30. PR #300 has received compatible new Chronicle lore in #4, #16, #18, #23 and #29 and additional compact Keeper Archive institution/province records. Compare their **actual in-game unlock and delivery** at final play-through, not mere string existence.
- **Throne reveal copy originally asserted an unapproved memory explanation** (“others did not forget you; you forgot them”). The approved canon only establishes the missing sixth companion. The later focused correction removes that claim and leaves a short seven-mark / familiar-road recognition, without saying why the companions were separated or who remembers whom. Final creative acceptance of the scene remains open.
- Existing PR description still quotes an obsolete dev.25 primary checkpoint despite current dev.43+/later commits. The **latest branch ledger and PR comments**, not that static description, must control recovery/certification.

### Focused placement evidence observed, NOT full QA

Loaded the **actual current branch 19 CommonJS campaign modules** into an in-memory evaluator. For fresh Normal Paladin and separately Mage regional observations across Greenwood, Flooded Marches, Ironroot, Ashen Frontier and Dark Crown:
- **5 regions × 13 generated houses = 65 houses retained**; **zero pairwise projected roof overlaps** using `abs(.76*(x−y delta)) < 145` *and* `abs(.27*(x+y delta)) < 104` as the defined collision criterion.
- **Zero house roadside setbacks violated**, zero qualifying ordinary named landmark markers within the 92-unit roadway exclusion after marker-shoulder correction (road-bound bridge/Thornfang track markers are intentionally exempt).
- Explicitly marked each region's two rescued specialists as available and refreshed ordinary service NPCs. **Minimum house-to-rescued-specialist distance across regions 197 world units**, above the 165-unit guard. Existing house IDs and repeated zone reads stay stable.
- New permanent `tests/snapshot-town-visual-clearance.test.cjs` covers houses, named markers, future rescues, repeat reads and renderer label allocator presence. File is authored and syntax-checked; **not executed in real Node or browser** under the director's defer-until-end policy.
- **Limits**: projection boxes are conservative estimates, not actual 150% zoom/sprite pixels; label priority/placement still needs actual render, phone, long-name and crowding inspection; legacy/save migrations, combat visibility and route play-through remain final-milestone work.

## Exact 45-choice desk reconciliation

Status language below means *source integrated or historically witnessed*, **not a new all-45 green test today**. No checkbox completion here substitutes for later per-choice playability evidence.

| Choice | Director objective | Current implementation account | Remaining quality/proof risk |
|---|---|---|---|
| 1A | Full approved worldbuilding | Mostly present in owning source; NOT candidate-certified | Cross-feature QA, narrative quality and integration completeness still open |
| 2B | Correctness before deadline | Operating policy present | No fixed launch deadline |
| 3C | Frozen Pages/PWA snapshot | Existing publishing architecture intact | Snapshot not frozen, approved or deployed |
| 4A | Official title | Player-facing and title music metadata integrated | Check browser/offline branding at final gate |
| 5A | Community Snapshot label | Reserved for release | Current dev build not a finished public snapshot |
| 6A | Twelve approved micro-scenery details | Implemented in earlier batch | Phone/visual and historical route acceptance final |
| 7B | Conditional viewport culling | Code ported from #294 | Performance parity and measurable benefit NOT accepted |
| 8A | Delegated unspecified numerical tuning | Used in several approved boss integrations | Cross-system balance and locked-number drift require final review |
| 9A | Two restrained former-party hints | Quest #4 and Keeper's archive clue exist | Ensure no premature disclosure or repetitive exposition |
| 10C | Hero is former sixth companion | Seven-mark throne reveal and Archive postclaim topic integrated | Exact memory cause/wording remains a narrative review item |
| 11B | Veyrith loyal air marshal | Role, unfinished air project and seven aviation moves represented | Actual flight movement/cues and full AI release QA pending |
| 12A | Scornfang reclamation office | Role/history and captain kept | Review if discovered through natural play, not Archive alone |
| 13B | Thornfang former wilderness scout | Patrol and environmental reports integrated | Quest encounter discovery and wording should be played through |
| 14C | Cindermaw personally promoted | Interior/Welfare ministry lore included | Crown welfare's cost/benefit must be experienced |
| 15D | Barracks and Lantern Wraith relationships | Archive/Barracks records integrated | Long multi-fact exposition; tighten spoken voice where needed |
| 16A | Ironroot silver/copper portrait crowns | Mint, separate ores, goods seals and dropped Crown coins integrated | Mobile coin legibility and no accidental gold currency UI |
| 17A | Only genuine retired Crypt props | Negative provenance finding: zero qualified reused assets | Do NOT fabricate salvage; two original caches retained |
| 18B | Lifebinder TRUE naming/IDs | Suffix and family/save identity integrated | Check browser plate at final visual gate |
| 19B | Crag horned captain + Hostile Liquidation | Species and 1.35 speed/0.75 cooldown phase integrated | Wolf guardians remain; old-save/stats QA final |
| 20A | Thornfang exterior patrol | Physical circuit integrated | User path and progress clue acceptance final |
| 21A | Mira returns with Thornfang to den | Existing same captive ID/return state integrated | Death/reset/TRUE migration final |
| 22C | Tracking via actual clues and reports | Trail/local-site implementation present | Check that hints are discovered without GPS |
| 23C | Four Cradle-to-Grave Tracking sling shots | Scheduled projectile attack integrated | Confirm warning-to-shot parity at final browser QA |
| 24B | Four Hot Zone patches in two pairs | Hazard scheduler integrated | Safe lanes and phone clarity final |
| 25A | Stay Alive Normal/TRUE stagger timing | Three bone projectiles integrated | Overlap readability and LOS final |
| 26C | Algor Mortis slow-only ring | Zero-HP slow-only resolver integrated | Verify no shared minimum-damage leak final |
| 27A | Anastylosis four-second self defense | Actual mitigation hook integrated | Separate from structural passive and VFX final |
| 28C | Variable Cindermaw inspections | Actual route/escort ownership implemented | Old travel/return/rescue state final |
| 29B | Vera mobile forge | Single named mobile workstation and rescue implemented | Presentation/interaction during combat final |
| 30C | Vera battlefield repairs | Finite repairable allied defensive state implemented | Eligibility and rescued/dead stop checks final |
| 31B | Cordon Sanitaire opening switches once | Real staged ring implemented | Warnings/escape geometry final |
| 32C | Administrative Distraint temporary buff removal | Condition-specific hit logic implemented | No permanent stat/equipment effects final |
| 33B | Parens Patriae timed defense/retaliation | Scoped defense/response implemented | No infinite retaliation chain final |
| 34A | Index seven progressive seals | Seven timed floor events implemented | Escapes and generated cues final |
| 35C | Horizontal Fiscal Equalisation heal actual postmitigation loss | Damage-source/lowest ally heal integrated | Zero-hit/heal caps and party ordering final |
| 36C | Devolution existing delegates then finisher | Actual owned-alive delegation integrated | No fresh summons and interruption final |
| 37A | 1,200-radius anonymous Broodscreen/native responders | Separate 6-native and 6/8-owned rules integrated | Cover, audio, two populations final |
| 38A | Dreadmaw two warned L-rush legs | Physical collision-safe legs integrated | Warning/turn geometry final |
| 39A | Creep Feeding only living owned brood | Timed speed/ready buffs integrated | No revive/stack final |
| 40A | Dreadmaw seven contextual attacks | All seven regular moves and original Rogue retained | Selector natural frequencies/softlock final |
| 41B | Royal Taxation (superseded 14 October) | Later director: 4 damaging hits over 10s, 12% max-HP shield | Do NOT test obsolete two-hit/3% draft |
| 42C | Three sword strikes with alternating real sidesteps | Dev.40 physical steps and anonymous cast changes integrated | No old ground warnings; current release geometry final |
| 43A | Three crowned class outfits | Procedural class-specific crown and equipment overlays integrated | Real device/sprite precedence final |
| 44A | Optional five unique dungeon masters | Same-ID nonhostile appointment candidates integrated | Full menus and persistent uniqueness final |
| 45A | Final Rest → concise credits/Nightmare | Ordering and credits UI integrated | Grandfathered old peace and end-to-end acceptance final |

## Additional approved contributions outside the 45 ballot

- **Greenwood/Marches/Ironroot/Frontier**: 22 named Greenwood attacks/three passives, Marches three passives, seven Garun engineering actions and captain systems have prior integrated evidence. Preserve original field/TRUE, independent rescued specialists, Treasury caches and encounter order, rather than cherry-picking older incomplete #285.
- **Veyra five moves** and Dark Lord expanded six/reactions are code-present but carry focused-testing rather than whole-snapshot certification; account for actual natural AI and fight readability at overnight gate.
- **Rogue mobile cast bars and 2s Slow** were approved directly in PR #300 comments and have current source/test owners. Static implementation and a small three-class basic-hit probe exist; **11 bosses × both forms, all captains/guardians/ringleaders, ranged retreat, true geometry, render/audio, save and death** still need integrated QA.
- **Phone joystick #301, charged-target fix #295, hero skill #302, Developer Mode #304** already selectively integrated; do not apply standalone PRs again. Decide public Developer Mode opt-in exposure before release. #294 culling acceptance remains conditional.
- **Quest/Archive narrative**: new lore should be learned from tangible existing tasks: six-signature ledger/forced Borin work (Greenwood); Wraiths and damaged Keeper records (Marches); Crag, payroll and separate mint ore (Ironroot); governor/inspector, civilians and unfinished air program (Frontier); ministry levies, food and forced labor (Dark Crown). The Archive can deepen these facts and offer exact numbers as optional reference; it must not feel like mandatory encyclopedia homework or reveal the hero's sixth identity before coronation. Keep settled reward budgets, quest IDs and selective notice counts.

## Prioritized pre-overnight remediation

**P0 — implementation or narrative defects before declaring candidate ready:** Recheck blocked/escaped target outcomes and possible self/party overlaps during moving elite Rogue casts; verify the corrected seven-mark reveal without an invented memory cause; reconcile currently authored Chronicle text and Keeper records against #184 user-reviewed selection; preserve two Treasury caches and genuine Crypt-negative provenance. Treat any real progression/data-loss/save issue discovered during focused review as an immediate stop.

**P1 — expected final combined proof (deferred by director):** Source/format/protected hashes, complete Node suites, Chromium + phone WebKit, realistic nameplate crowding and 150% house rendering, historical saves, real roads/travel/boss/TRUE, audio cues/procedural VFX, performance A/B, offline PWA, independent playable check, full ending and owner acceptance. Reconcile stale PR top metadata with the final head and add accurate rollout guidance; no early release.

**P2 — intentionally excluded/unapproved:** Retired Crypt props without provenance; extra sprites from paused #217, new town resource systems, fourth hero class, invented sixth-companion memory explanation, full new soundtrack, additional NPC dialogue engine, mandatory lore cards for every quest or new unapproved side quests.

## Authority and release controls

No merge, main push, deploy, tag, public release or forum post. All changes stay on the current draft PR. The director requested delaying combined regression, audiovisual certification, historical saves and peer/playable review until a later overnight final milestone; this memo is **pre-certification coverage and quality triage only**. Avoid reporting all objectives as final PASS.
