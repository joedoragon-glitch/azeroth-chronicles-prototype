# Community Snapshot — pre-certification implementation and narrative-quality audit

**Inspection date:** 14 October 2026 (US/Eastern).  
**Audited branch:** `implementation/director-snapshot-20261013`; recovery source at start of the review `f3fa9216001f405a7921d14f1f741604e1c60e1e`; later authored story/audit corrections on the same PR.  
**Authority:** the unchanged 45-choice [director canon lock](DIRECTOR_WORLD_BUILDING_SNAPSHOT_CANON_LOCK_20261012.md), newer explicitly approved combat corrections in PR #300, compatible #230/#231 and #288–#293 records, actual current owning code and [implementation ledger](SNAPSHOT_IMPLEMENTATION_20261013.md).  
**Category:** **pre-certification source/design/task-execution audit**, not overnight regression, peer review, playable acceptance, complete asset proof, or publication authority. Do not mistake a former certified intermediate tree for certification of the current draft.

## Executive finding

The worldbuilding pass has substantial real implementation in the single current draft: the five regions, specialized boss and captain mechanics, the mobile captives, royal offices, single Crown currency, ending state and regional appearance/story hooks are represented in the actual owning code. The main pre-certification weakness was **story-delivery quality and evidence integrity**, rather than an entirely unimplemented world. We found cases where new lore was present only as a long optional reference paragraph, existing quest payoffs did not reflect newly approved roles, and some testing/status records assumed an obsolete reference count.

These problems were addressed within the permitted review scope: five of the **already selected twelve** Chronicle messages revised; **all seventeen intentionally silent quests stay silent**; the same final milestone stays a milestone. The Drowned Keeper's optional reference now has grounded new topics plus missing boss histories, maintains secret-evidence gates, and leaves read-only/save behavior intact. The misleading “sixth mark” versus **seven throne marks** reference was corrected. Crypt retirement was resolved as a documented negative finding, not invented art.

**Remaining serious work is certification**, plus quality questions below, which are deliberately not claimed solved merely by changing code or adding tests. The director requested a **single combined overnight regression/audiovisual/historical-save/independent playable audit at the end**.

## Decision-by-decision ledger: latest owner intent versus source disposition

**Codes:** `I` = implementation exists in the integration branch, often with *older* focused/intermediate evidence; **NOT final-head certified**. `P` = policy/scope rule rather than game code. `C` = conditional inclusion or final acceptance not yet established. `N` = no eligible implementation by authoritative conditional rule; explicitly document rather than fabricate. `A` = authored/spot-checked but needs player-facing acceptance. Several source implementation claims rely on the existing detailed ledger and earlier certified batch heads; this is **not** an independent reenactment of all mechanics.

| Choice | Current disposition | Risk / review task |
| --- | --- | --- |
| 1A complete worldbuilding | P/C | Final claim only after all selected source and user-approved mechanics plus whole-snapshot checks |
| 2B correctness before deadline | P | Do not rush or imply an overnight run has already completed |
| 3C frozen public Pages/PWA | C | Published main and unmerged snapshot remain distinct; owner release order required |
| 4A official title only | I | Name on Pages/menus/audio audition corrected, keep original source/package provenance |
| 5A Community Snapshot label | P | Dev version is not a published community release |
| 6A Greenwood/Marches/Frontier micro-scenery | I | Prior scoped implementation exists; verify travel/old saves at final gate |
| 7B optional viewport culling | C | **Ported**, but paired same-content visual parity and real beneficial performance still govern go/no-go |
| 8A delegated unchosen numerical values | P | Audit later owner revisions versus old proposed numbers before declaring balance accepted |
| 9A two early story clues | I/A | Greenwood quest ledger and Keeper history are short; maintain early mystery and existing knowledge gates |
| 10C player hero is missing sixth | I/A | Throne-triggered **seven-mark** proposal and retrospective implemented; exact dialogue/timing awaits director story acceptance |
| 11B Veyrith loyal Air Marshal | I | Actual seven maneuvers and flight cues, unfinished air project; final AV/natural scheduler proof still owed |
| 12A Scornfang reclamation superintendent | I | Stable Treasury captain/Goblin identity, separate from kingdom ministry |
| 13B Thornfang former wilderness scout | I | Patrol/den/Mira remain, biography now discoverable through optional Keeper reference |
| 14C Cindermaw's promotion | I | Interior/Welfare institution and Ash jurisdiction preserved |
| 15D Barracks companion classes and Wraith relations | I | Established Archive, no new class or unwarranted flooding explanation |
| 16A one portrait Crown economy | I | Separate Ironroot ore streams, portrait mint and real dropped coin drawing; no invented exchange/alloy |
| 17A demonstrably retired Crypt art only | N | **30/30 original furnishings still active**; no eligible salvage. Preserve two Treasury caches |
| 18B Lifebinder TRUE naming | I | Stable family/save IDs; test old-name labels in final visual gate |
| 19B Crag +35% movement / .75 cooldown | I | Horned captain and ordinary Wolf guards distinguished; historical captain migration owed combined certification |
| 20A Thornfang roaming circuit | I | Physical routes, no Millhaven, real fight leash; previous regional batch checkpoint |
| 21A Mira joint den return | I | Same captive identity, rescue/TRUE/respawn, no remote cage copy |
| 22C tracking rather than GPS | I | Clues and reports present; final normal-player discoverability still a playability issue |
| 23C Scornfang four tracking shots | I | Authored four projectiles; collision/phone/readability in final gate |
| 24B four Hot Zone patches in pairs | I | Authored paired resolution; verify geometry/safety in final gate |
| 25A Normal/TRUE Stay Alive timing | I | Three distinct projectiles, both form timings; final device review |
| 26C Algor Mortis zero-HP cold Slow | I | Custom slow-only resolver, no shared damage minimum; final cross-system check |
| 27A Anastylosis self-protection | I | Four-second protection, multiplicative passive; final VFX/time evidence |
| 28C variable Cindermaw inspections | I | Existing facility travel, physical paths and guard escort, no teleport |
| 29B Vera movable guarded forge | I | Same Vera rescue/service; not an additional worker, separate equipment |
| 30C Vera actual defense repairs | I | Finite eligible defenses, no universal durability economy |
| 31B Cordon Sanitaire | I | Contracting ring, one switched safe gap, final route/actual hitbox verification |
| 32C Administrative Distraint | I | Scoped removal of live temporary buffs; equipment/talents kept |
| 33B Parens Patriae | I | Time-limited real Ash protection and bounded response |
| 34A Index of Multiple Deprivation | I | Seven progressing seals, real warnings rather than naming-only |
| 35C Horizontal Fiscal Equalisation | I | Healthiest victim/weakest ally, actual post-mitigation healed loss |
| 36C Devolution of Authority | I | Existing Ash actors, physical delegates and interruptible finisher |
| 37A anonymous Broodscreen Roar | I | 1,200 blast and native response, solid cover, owned armies distinct |
| 38A Transhumance | I | Two physically separate warned rush legs, old Dreadmaw Rogue intact |
| 39A Creep Feeding | I | Existing living brood, temporary movement/attack readiness |
| 40A seven agricultural moves/contextual AI | I | Old 5,000 HP, brood shields and 45% reflection remain protected |
| 41B Royal Taxation original solo rule | I/A | **Superseded by latest explicit dev.40 approval**: 4 damaging hits, 10s, max four marked, 12% shield. Do NOT restore historical two-hit/3% |
| 42C Veteran sword footwork | I/A | Alternating physical footwork retained under later anonymous cast-only presentation |
| 43A three class-specific crowned appearances | I | Procedural Paladin/Mage/Ranger wardrobe; final sprite/camera acceptance needed |
| 44A peaceful appointed masters | I | One per dungeon/unique IDs/eligible defeated captains; real gameplay/browser readability outstanding |
| 45A throne, Rest, credits, Nightmare | I | Actual ordered ending and old earned TRUE flags; final migration/credits browser testing outstanding |

**Additional required compatible scope:** Greenwood 22 attacks/three passives, Marches three newer passives/older Mirejaw/Keeper/Direjaw kits, Ridge fiscal kit/Crag/Garun seven skills, Frontier Ashen/Cinder Warlords and Veyrith seven flight moves, Veyra five attacks plus actual 4×4 grid/guards/traps, Dark Lord six primaries/reactions/Second Wind/Director updates, Crown five-region institutions, old v4 saves and #266 finale. All are accounted for in the [implementation ledger](SNAPSHOT_IMPLEMENTATION_20261013.md). Standalone #295 charged retarget, #301 phone joystick, #302 hero skill repairs, #304 Developer Mode and conditional #294 have already been selectively folded into this draft; do not re-import duplicates.

## Confirmed implementation-quality findings and corrections

### Q1. Missing player-facing worldbuilding despite source biographies — corrected in this review
Before this pass, all five Crown Peace site link descriptions existed, but newer histories were not consistently surfaced in selected quest payoffs or the Keeper's short optional topics. Four boss reference biographies were absent or too thin: Thornfang, Lifebinder, Mirejaw and the Keeper. They now have grounded entries. The Keeper's sealed specialist-capture decision remains separate until the hero actually reads the ledger; neither quest payout nor the basic boss reference grants that knowledge.

### Q2. Previously approved quest voice was at risk of being replaced by lore dumps — protected
[Original authored voice/disposition record](AMBER_NARRATION_IMPLEMENTATION.md) confirms exactly **12 selective Chronicle cards**, **one milestone**, **17 deliberate nulls** from the thirty regional quests. The user rejected robotic contrasts such as “not just X”, sanitized regional summaries, repeated “you notice” formulas, fake gravity and fake omniscient discoveries. Followed the later approved natural, direct, concrete, occasionally dry voice. Reworked only **quests 4, 16, 18, 23 and 29** using real ledger/skeletons, Crag pay offices and captives, portrait crowns, Frontier governor/inspector hierarchy, and Cindermaw rations versus Crown levies. Previous hand-approved KEEP messages **20 and 21 remain byte-for-byte unchanged**; cut quests and final milestone unchanged. Every revised line is under the original **180-character** contract. No quest IDs, requirements, payouts, progression or persistence changed. These are new narrator drafts for director literary acceptance.

The quest ending is not the sole place for lore: a returning player with previously paid quests will not replay a Chronicle card. The Keeper's optional updated shelves provide a non-repeat-announcement way to find the recorded history, gated by the existing Keeper cooperation and archive evidence rules.

### Q3. Keeper Archive implementation/test drift — corrected, focused-probed
Old test `tests/archive-reference.test.cjs` expected **exactly five institutional topics** despite additions already made in earlier snapshot stages (nine prior to this pass). After four grounded dossier topics, current source has **13 pre-coronation topics** and **14 afterward**. Test now expects 13 and checks new entries + reveal gate; existing math/rule/evidence tests remain in place. Six Normal/Nightmare × Paladin/Mage/Ranger in-memory loaded-engine probes confirmed 13 topics, no pre-throne last-mark title, no Keeper-orders section without evidence and no mutation from reading. The actual throne claim exposes the fourteenth topic. This focused proof is not full Node process regression or browser acceptance.

### Q4. Seventh/“sixth” throne-mark mismatch — corrected
The game established **one ruler and six companions**: **seven total marks** at the throne. A prior post-crown Archive topic incorrectly called the answer the **sixth throne mark**. It now says the **last of seven**, distinct from the missing **sixth companion**; pre/post read-only spoiler tests were updated. The earlier **six-signature ledger** is a partial clue, not a claim that only six marks ever existed.

### Q5. Crypt retirement provenance — negative result, not fabricated content
See [bounded report](SNAPSHOT_CRYPT_RETIRED_ART_PROVENANCE_20261014.md). All 30 original Crypt furniture placements, including all 17 original structure types, remain used in the current 40-piece dungeon layout. No documented retired Crypt-specific object is eligible for Scornfang's Treasury. Source-based zero-new-props is the correct treatment of conditional choice 17A; not an omitted promise to be filled with generic scraps.

### Q6. Newly approved Rogue mobile casting and status values — coded, significant test debt
Latest PR comments changed elite Rogue basic/signature preparation to moving actor-anchored bars and raised short default Slow to **2.0s**. The owning simulation and visual modules are edited; two discoverable focused regression files exist. In targeted real current-code in-memory simulations, **guardian, Ringleader, and boss** actors advanced physically with ongoing cast timers when targets were outside normal contact range; a comparable ordinary actor did not move while warning. All three hero classes took real Ringleader hit damage and had 2.0s Slow. **No full cast matrix is certified.** Older `tests/rogue-integration.test.cjs` still uses terminology and escape fixtures tied to former spatial Rogue warning footprints. Audit its assumptions and align the final exact-head regression to actor bars and live release hit geometry; do not pass by deleting escape/LOS/death assertions.

### Q7. Outdated PR-level description and accounting — needs authoritative refresh
At this inspection the [PR #300 description](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/300) still advertised **dev.25**, Veyra isolated/not integrated and Dark Lord/throne not finished even though later commits and the detailed ledger already include them. This is a **handoff quality defect**: readers could repeat integrated work or miss current requests. The PR description should point to the current development build, confirmed newest head, accurate completed WIP packages, known limitations and the single final owner gate; do not erase the older certified runtime facts in the historical evidence.

## Distinguish fixes, remaining creative review and overnight acceptance

**Fixed/covered in source during this audit:** new regional narration, 13/14-topic Keeper reference, four missing character histories, 7-mark language, source-provenance negative result, stale Archive assertions. These are *integrated source changes*, not full QA certificates.

**Director/story review:** exact wording/scene of the missing-sixth reveal remains a concise proposal; it was not specifically selected by the previous 45-item ballot. The new quest notices are likewise subject to artistic acceptance. No new class, villain relationship or alternate chronology was authorized.

**Final overnight quality gates (explicitly deferred):** full exact-head Node and browser suites; stale protected hashes and formatter; naturally scheduled combat and all warning/impact/visibility/audio paths; selected pre/post narrative gates under old v4 saves; title score, phone/desktop readability, peace/appointments/credits; real culling performance benefit and raster parity; PWA/offline/packaging; historical save migrations, and **independent playable review**. Prior intermediate batch certificates belong to their actual historic SHAs, never the current head. Missing physical-device and director art acceptance must remain honestly labeled.

**Release rule:** PR stays draft, main unchanged; no merge, deploy, release, tag or forum publication without explicit owner approval. The author may schedule the final combined regression overnight; this report itself is neither that test nor its result.
