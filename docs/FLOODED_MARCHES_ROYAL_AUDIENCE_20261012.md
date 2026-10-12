# Flooded Marches — royal audience and combat-name design lock (12 October 2026)

**Status: OWNER-APPROVED CREATIVE/CANON RECORD ONLY. Not implemented by this document; not merged or deployed.**
**Scope: Mirejaw, Direjaw, and the Drowned Keeper; Flooded Marches, level 4–7.**

This records the Dark Lord's decisions in the October 12 Flooded Marches royal audience, including the subsequent full-name readability audit and *latest* corrections. This documentation-only record follows the Greenwood meeting's draft PR #289 pattern. It does not revise Greenwood decisions, authorize implementation, create a ministerial appointment, certify gameplay, or replace unrelated draft branches.

**Authority and references:** worldbuilding integration #232; canon/scope audit #251; unified Crown Peace #235; Marches ecology and regional source #238; boss/captain mechanic reconciliation #247; audiovisual #257; finale compatibility #266; code drafts #230 (bosses and Keeper), #231 (captains); independent rural-dressing draft #286; prior Greenwood royal register #289. Sources for the released region and encounter state include `src/prototype/data.js`, `src/prototype/rules.js`, `src/prototype/engine.js`, `docs/REGIONAL_HANDOFF_AUDIT.md`, `docs/QUEST_ARCHIVE_CONTINUATION.md` and `docs/FIELD_DUNGEONS_V074.md`.

## 1. State boundaries and canon safeguards

1. **Shipped baseline:** published v0.9.0 `main`, reviewed for this document at `6f8089b2013647184efb04932fe6157f548238b9`. Mirejaw's field fight, Direjaw's Treasury captain profile and Keeper's Archive encounter already exist. Do not present this meeting's renames or new passives as live gameplay.
2. **Approved/unmerged implementation candidates:** #230 contains the independently developed Mirejaw scales/Death Roll/Bog Spit progression and Drowned Keeper targeting/capture/sabotage designs, with substantial code and an audit register; #231 contains the approved 680-HP Direjaw survivability/phase/geometry and anonymous cast preparation. Their source changes, overlap and validation status must be reconciled, not blindly cherry-picked or replaced. PR body checklists may predate code in the branch: audit actual source and exact head.
3. **New owner-approved royal designs:** the professional knowledge grants/acknowledged skills, final displayed name changes, and the three *new* passives below. They do not become gameplay until a later separately authorized code change in the single integrated worldbuilding candidate.
4. **Separate region dressing:** draft #286 adds small, nonblocking fishery-work props to Reedport/Fisher Camp. Neither replace nor merge that PR as part of this record. This meeting did not authorize extra settlements, buildings, roads, ecology systems, equipment purchases or economy minigames.
5. **Crown/finale:** all five regions are already the Dark Lord's realm and use crowns; Flooded Marches remains rural fishing/wetland country. The Drowned Keeper is one of the *five dungeon-former-companion* successor candidates. Mirejaw is a field boss and Direjaw is a Treasury captain, **not** additional throne-successor dungeon bosses. #266's approved throne-claim/credited TRUE victory design is compatibility context, not shipped in v0.9.0.
6. **Existing encounters/progression:** preserve free exploration and player-selected encounter order. Keep Reedport, Fisher Camp, the Ferry, lake, raised crossings and bridge, Mirejaw island redoubt, his three-cache Treasury, stranded wagon resource site, Drowned Watchhouse, night-only Lantern Wraith territories, and Sunken Archive; no inventing the cause of the Archive's flooding or the parties in the Keeper's earlier captive exchange. Protect Sela/Neri rescue, Keeper's existing optional lore/reading/counsel, normal/early TRUE/pending TRUE behavior, historic saves and awards, difficulty scalers and eventual Crown Peace.

**Worldbuilding premise (approved):** Mirejaw has loyally defended his home marsh for years; the Dark Lord respects the marshland and does not intend to interfere. The magical professional disciplines do **not** erase the characters' existing species, make them interchangeable, assign new ministries, or impose construction projects. Further duties, institutions, organizational titles and settlements remain unappointed unless the Dark Lord later decides.

## 2. Royal naming principle — final owner-approved names

All alternatives must be authentic terminology connected to the **actual performed action**, pronounceable and alarming like fantasy attack names, while giving a newcomer some reasonable mental picture of the result. "Obscure at random" is a failure. The owner ordered a readability audit after the first ballots; **the last approved correction is `Inundation`**, replacing the overly long intermediate `Saturation-Excess Runoff` (which had itself replaced `Exfiltration`). Similarly, `Groundwater Recharge` supersedes `Hyporheic Exchange`, and `Elastic Rebound` supersedes `Dilatancy`. These are **not** invitations to retune the associated effects.

### 2A. Mirejaw — Wetland Hydrology (field boss)

The Dark Lord personally bestowed professional expertise in **Wetland Hydrology**. Mirejaw remains an enormous territorial crocodilian field boss, not a royal minister or generic tame pet. Base Normal **1,100 HP**, level **5**, base damage **24** on published data; special form and game-wide multipliers remain intact. His established marsh/territorial instincts and in-combat movement remain; no autonomous change to patrolling, settlement control or wetland geography was ordered.

| Slot and kind | Published / #230 design label | **Final approved display name** | Contract |
| --- | --- | --- | --- |
| Regular 1 — frontal bite | Jaw Snap | **Fluvial Incision** | Warned frontal bite; single-target roll follow-up on a valid catch |
| Regular 2 — charge | Mire Rush | **Hydraulic Jump** | Warned straight-line charge; ends on actual collision |
| Regular 3 — three mud hazards | Bog Spit (intermediate unapproved name: Exfiltration; then Saturation-Excess Runoff) | **Inundation** | Three damaging/slowing patches; #230 progressive slowing and existing lifetime |
| Regular 4 — summon | Brood Call | **Flood-Pulse Recruitment** | Mireling call; normal existing living cap of three |
| Rogue tactical maneuver | Mirejaw's Bog Snare | **Matric Suction** | Existing snare/damage |
| Rogue signature | Mirejaw's Sinking Bank | **Rotational Slump** | Existing warned binding area, geometry and movement effects |
| Triggered follow-up, **not a fifth regular move** | Death Roll | **Vortex Shedding** | Existing #230 one-victim held roll, no extra doubled damage |
| Existing defensive trait (renamed) | Scaly Hide | **Hydraulic Resistance** | #230 health-dependent scale reduction; no reset on healed HP |
| **New passive** (not in released game or #230) | Initial proposal: Hyporheic Exchange | **Groundwater Recharge** | Environmental regeneration defined immediately below |

**Existing #230 protected mechanics:** Hydraulic Resistance starts at **40% incoming damage reduction at full health**, falls linearly to **0% at 50% HP**, and does not regenerate within the encounter. Fluvial Incision's successful one-victim catch triggers Vortex Shedding for **1.5 seconds**, with **three damage ticks totalling a single original Jaw Snap's damage** (no redundant upfront bite), restraining movement/attack/casting, followed by a **35% slow for two seconds**. Mirejaw cannot initiate another attack while rolling. Inundation uses **three existing warned mud patches**, each with an active **4-second** ground lifetime, unchanged ground damage/ticks. Movement inside progressively falls to **75% during first second, 60% second, 45% third, 35% thereafter**; leaving stops accumulation and movement recovers over **two seconds**. No new immobilization/damage. Preserve original base HP, base damage, attack warning/cooldown/summons/rewards, TRUE warbands and rogue properties.

**NEW approved passive — Groundwater Recharge (renamed from the initial Hyporheic Exchange proposal):**
- **Normal:** Regenerate **2% of actual maximum encounter HP per second** while physically occupying at least one **active, owner-created Inundation mud patch**. At the unmodified 1,100 HP base, this is **22 HP/s**; uninterrupted contact throughout one four-second patch permits **up to 88 HP** (8% maximum HP), subject to missing health.
- **TRUE:** Regenerate **5% of actual maximum encounter HP per second** under identical spatial conditions. Ordinary unmodified TRUE field-boss base is **1,980 HP** (1,100 × 1.8), thus **99 HP/s**, up to **396 HP** (20% max HP) during four uninterrupted active seconds; other mode/stage modifiers still apply.
- Healing accrues proportionally to *actual elapsed time inside live patches* and begins with contact, with **no one-second startup delay**. Entering late or leaving early gives proportionally less; contact with two/three patches never multiplies the rate. Healing stops on exit/expiration and may resume on re-entry or later casts. **No arbitrary encounter-total healing cap**; natural cast cadence, patch lifetime, positioning and maximum HP constrain it.
- **No extra puddle-seeking AI, invisible healing radius, forced route, cast cadence increase, patch-duration extension or geometry change.** Owner specifically wants ordinary pursuit, dodging and charges to create accidental opportunities to stand in mud.
- Healing cannot exceed max HP or revive the dead. It **must not restore Hydraulic Resistance's depleted 40%-to-0% defensive reserve**; track that reserve's encounter minimum independently of regenerated HP. Preserve existing attack damage and slowdown to the player.

### 2B. Direjaw — Geotechnical Engineering (Treasury captain)

The Dark Lord magically granted professional expertise in **Geotechnical Engineering**. Direjaw retains the **existing** role of Mirejaw's Treasury captain, protecting **three existing collectible caches** and accompanying guards; this is **not** a promotion to field/dungeon boss or a new kingdom-wide office. The idea that he could apply engineering to foundations/roads is character flavor, **not an order to build/rebuild the map**. Under approved unmerged #231 he has **680 Normal base HP** before existing difficulty modifiers.

| Slot and kind | Original | **Final approved name** | Contract |
| --- | --- | --- | --- |
| Regular 1 — charge | Bog Skitter | **Flow Sliding** | #231 warningless-footprint line charge with anonymous readable prep |
| Regular 2 — cone | Spatter Fan | **Sand Boil** | #231 196° slowing cone, original warning/damage |
| Regular 3 — hazard | Silt Slick | **Mud Pumping** | #231 four separate, non-overlapping persistent mud hazards |
| Rogue tactical maneuver | Direjaw's Silt Hook | **Pullout Resistance** | Existing snare |
| Rogue signature | Direjaw's Silt Curtain | **Grout Curtain** | Existing warned bind and sidestep |
| 55%-HP one-time special phase | Sloughskin (briefly proposed Dilatancy) | **Elastic Rebound** | #231 50%-max-HP heal + 20% movement speed |
| **New passive** | Proposed Cyclic Densification | **Strain Hardening** | Hit-triggered defensive stacking below |

**Existing #231 protected mechanics:** Flow Sliding keeps original line/charge/damage and recovery; its ordinary **ground-footprint warning is absent** but players get a generic, **anonymous 0.9-second preparation cast bar** without attack name or target/geometry disclosure, retaining ordinary warningless readability. Sand Boil retains a **196°** cone, **1-second warning**, radius **150**, original damage coefficient and slow. Mud Pumping creates **four** spatially separated **radius-88** persistent damaging/slowing circles, **1.2-second warning**, existing lifetime, no overlapping damage footprints and escape gaps. Pullout Resistance retains its `0.20` rogue snare coefficient. Grout Curtain retains **1.35-second warning, 125 radius, two-second slow, 105-unit sidestep and 0.09 damage coefficient**, with the existing rogue signature rules. Elastic Rebound triggers **once at 55% HP**, heals **50% of max HP** and grants **20% movement-speed increase** using the approved phase behavior, without extra invulnerability/HP-budget retuning. Keep #231 migration and cap/room behavior. A skill rename must not accidentally unmask Flow Sliding during anonymous preparation.

**NEW approved passive — Strain Hardening:**
- On each **damaging hit actually received**, after that hit resolves, gain **one stack of 4% incoming damage reduction** for subsequent hits.
- **Maximum three stacks, 12% total reduction**. Each subsequent damaging hit can refresh the **five-second** stack timer; all stacks expire if not refreshed for five seconds. It does not retroactively reduce the hit that granted a stack, heal, increase HP, grant invulnerability, or give Direjaw a TRUE boss form.
- Retain exactly the previously approved 680 base HP and Elastic Rebound behavior. Interaction of this defensive reduction with existing defense layers must be tested for correct damage calculation, not used to silently change other captains.

### 2C. Drowned Keeper — existing disciplines and original names retained

The Keeper is the existing Sunken Archive dungeon boss, **1,600 Normal base HP**, **level 6**, base damage **28**, internal family `archive`, and one of the Dark Lord's **five former adventuring companions**. He is an educated fishing enthusiast and Crown councillor. His existing scholarship is described as **Archival Science and Records Management; Conservation Science and Documentary Restoration; Information Science and Knowledge Organization**. **Political Strategy and Statecraft** reflects established *applied experience* as a councillor rather than a magically conferred new degree or separate ministry. Angling/fishing remains a personal passion, not a credential newly conferred at this audience.

Existing history to preserve: he recommended capturing specialists; Neri is compelled to restore damaged Archive records and was acquired by exchange involving another captive (identities/terms are **not established**); the Keeper once drowned, but the Archive flood was a **separate, unresolved cause**. He may exert influence by maintaining the Archive's knowledge and is a dungeon successor compatible with #266. Keep the optional orders/evidence, bargain, Neri independence, post-defeat counsel and TRUE departure/reentry behavior.

**The owner explicitly declined to rename any of the Keeper's already-appropriate seven existing moves.**

| Slot and kind | **Retained name** | Protected functionality |
| --- | --- | --- |
| Regular 1 | **Anchor Swing** | Warned frontal attack and #230 pull/capture on one chosen victim |
| Regular 2 | **Water Jets** | Two parallel warned water lanes with safe channel |
| Regular 3 | **Undertow** | One warned slowing patch (not immobilization), existing four-second duration |
| Regular 4 — summon | **Echo Call** | Three drowned echoes in Normal, existing cap; preserve TRUE warband |
| Regular 5 — proposed and implemented *only on #230* | **Cooldown Sabotage** | Distinct dodgeable non-damaging cooldown-delay attack |
| Rogue tactical maneuver | **Drowned Keeper's Undertow** | Existing tactical shove; distinct from regular Undertow |
| Rogue signature | **Drowned Keeper's Floodgate Turn** | Existing warned slowing area and sidestep |

**Existing #230 protected mechanics:** Anchor Swing prioritizes a living reachable Archer healer support companion, otherwise eligible target; successful hit hooks **one victim**, draws and suppresses movement, skills and healing. The captive remains held **until the Keeper needs the anchor again**, not until generic damage. The held Archer's healing cooldown is frozen and resumes on release. No orphan captives after death, leash/reset, dungeon change, load or save restore. Healer-first target selection respects line of sight, fight leash and safety. Water Jets retain their two warned parallel lanes and navigable middle; Undertow remains slowing rather than immobilizing; Echo Call retains original normal summons and TRUE behavior. Cooldown Sabotage has **1.5-second targeted warning**, **12 seconds between attempts**, adds **three seconds** to the longest remaining eligible Archer healing cooldown first (or chosen hero skill otherwise), **does no damage**, and does not corrupt frozen/disallowed cooldowns.

**NEW approved passive — Emergency Stabilization:**
- Once per encounter, **after** an incoming hit causes HP to fall to or below **50% of maximum HP**, trigger a clearly **visible preservation/conservation seal**.
- **Normal:** **30% incoming damage reduction for six seconds**. At the base 1,600 HP, normal trigger threshold is **800 HP**.
- **TRUE:** **40% incoming damage reduction for eight seconds**. Ordinary base TRUE health is **2,880 HP** (1,600 × 1.8), threshold **1,440 HP**, subject to existing additional stage/mode scaling.
- **The triggering damage is unmitigated** by this passive; reduction applies only to later hits while its timer is active. No healing, new summon, cooldown sabotage effect, invulnerability, or repeat trigger during the encounter. Do not re-trigger if HP later crosses 50% again after another state transition.
- Retain the pre-existing 1,600 Normal HP and 28 base damage. The seal is truthful, concise, readable on touch devices, and must not obscure actual attack warning/hit geometry.

## 3. Acceptance, reconciliation and protected implementation boundaries

**This PR is *documentation only*.** The three characters' approved choices above are not implemented by naming them in Markdown. Implementation requires the owner's subsequent explicit instruction, its own scoped PR/code review and comprehensive validation; #232 still requires one combined candidate and owner-approved publication. No merge/deploy, gameplay code edits, assets, audio, CSS, tests, save migration, changes to other branches, CI retry, or automatic changes to other regions are authorized by this document.

**Required future implementation ledger:**

| Feature | Live `main` | Existing unmerged parent | Owner approval here | Later integration responsibility |
| --- | --- | --- | --- | --- |
| Mirejaw 4 moves + rogues + scale/roll | Original names/encounter | #230 mechanics; existing rogue tables | Rename all eight existing slots and approve *new* Groundwater Recharge | Combine labels + source behavior, add contact-only regen state, preserve HP/drift-free visuals |
| Direjaw captain | Existing 3 regular + two rogues + Sloughskin | #231: 680 HP, geometry, 55% phase, anonymous cast | Rename six slots/phase, approve *new* Strain Hardening | Reconcile #231 without disturbing captain HP migration, warnings or Treasury caches |
| Drowned Keeper | Four regular + two rogue; `archive` identity | #230 adds distinct Cooldown Sabotage/healer anchor control | Keep all existing names, approve *new* Emergency Stabilization | Add separate one-time 50% DR and clear seal, preserve all 5 proposed regular moves |
| Other rural Marches content | Existing fishery, ferry, habitats, Archive | #286 unrelated decorative props | No new design authorized by this meeting | Do not absorb/overwrite #286; reconcile only during owner-approved wider integration |

**Future testing/QA checklist (not claimed performed):**
- Verify exact stable internal `mire`, `archive`, `supply-march` and applicable rogue/VFX/audio family keys and save fields. **Rename player-facing labels only**, update UI/help/event strings consistently, and ensure no internal ID/ref/save migration is invented solely for display names.
- Unit and actual-encounter tests for Mirejaw's monotonically depleted Hydraulic Resistance after healing, one-victim Vortex Shedding damage accounting/captive cleanup, four-second Inundation patch/slow geometry, and Groundwater Recharge time-inside/multiple overlap/late arrival/exit/expiration/recast, Normal and TRUE.
- Unit and actual-encounter tests for Direjaw's 680 HP (legacy migration), one-time 55% Elastic Rebound health/speed, Flow Sliding's anonymous preparation **without telegraph or name leak**, 196° Sand Boil and four non-stacking Mud Pumping patches, plus post-hit Strain Hardening stacking, expiry and phase interaction. Maintain Treasury's **three cache identities** and defeated captain persistence.
- Keeper healing-companion priority, Anchor Swing's release/frozen cooldown, dodgeable Sabotage scheduling, TRUE/summon behavior, and one-time Emergency Stabilization activation after the threshold-crossing hit with correct Normal/TRUE values, visible truthful VFX and reset/save/death behavior. Neri and post-defeat Archive counseling must remain independently available.
- Protect regional road/ferry/bridge/collision/passability, entrances/exits, independent Sela/Neri rescue, quests/rewards/crowns, night Lantern Wraith spawns, historical v4 saves, Normal/Nightmare/TRUE/early TRUE/Awakening compatibility, optional #266 finale appointments and credited victories, Crown Peace/neutral world and unchanged five-region structure.
- Build and exact-head CI: Node regressions, source/renderer ownership, production build/syntax/format, browser desktop and phone Chromium/WebKit, sound/VFX warning fidelity, PWA/offline and historical-save import/export. Human encounter/readability/play-balance QA remains required where deferred in #230/#231; do not label prior focused green checks as a combined certified release.
- Preserve the live procedural-visual canon, asset provenance, original score/SFX and fallback; #257 assesses audiovisual changes *only after* the precise owner-approved mechanical delta is selected. Project is a **multi-file GitHub Pages/PWA**, without any single-HTML design constraint.

## 4. Decisions intentionally *not* made here

No new royal ministry, named provincial office, formal Captain rank above his existing one, route/patrol mandate, Treasury redesign, extra hydrological or geotechnical constructions, fishing simulation, archive-flood causation, undead/Wraith origin, exchange-party biography, career credential for the Keeper's hobby, new weapon/item, third class/boss category, new summons beyond established ones, or changes to rewards and other regions. Remaining environment/political lore decisions are open to future owner-led sessions.

**Final owner instruction for this record:** The Flooded Marches audience was concluded. The owner then audited name readability, accepted the three short, evocative technical corrections, and explicitly asked to **update/annotate GitHub**. That authorizes this isolated documentation-only draft PR **and nothing more**.
