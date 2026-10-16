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
| Regular 3 — three mud hazards | Bog Spit (earlier ratified **Exfiltration**; later superseded **Saturation-Excess Runoff**) | **Inundation** | Three damaging/slowing patches; #230 progressive slowing and existing lifetime |
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

## 5. Independent implementation-feasibility audit — 12 October 2026

**Disposition: design record retained; technical integration is NOT yet certified.** This appendix audits the owner-led conversation against the exact repo source at `main` `6f8089b2013647184efb04932fe6157f548238b9`, PR #230 `49be85ec89ac7201f72d3c2fd9308f215235ccad` and PR #231 `1e298f14299518186a9166cc658fb4b9a9979fce`. Auditing is source inspection, **not proof from a compiled integration build or live encounter testing**. Changed branches require fresh exact-head review later.

### 5.1 Truth table: what is already supported, and what is new?

| Idea | Present engine foundation | Not yet built/proved | Integration requirement |
| --- | --- | --- | --- |
| Mirejaw's renamed attacks, Vortex Shedding, Hydraulic Resistance | Four existing attack slots and two rogue slots on main; #230 implements Death Roll, progressive bog effect and health-dependent scales | Final visible labels are not deployed; Groundwater Recharge does not exist on #230 | Rename **display strings** in their real owners and add contact-based regeneration without altering attack scheduling/geometry |
| Direjaw's renamed moves, Elastic Rebound | Main captain profile and two rogue tables; #231: 680 HP, 55% phase, 196° cone, four separated circles, anonymous cast cue | Final names not deployed; Strain Hardening has not been added; phase persistence on modern saves needs dedicated coverage | Update source-owned captain/rogue names, implement post-hit stack logic and phase/save handling |
| Keeper's original names and Emergency Stabilization | Four released regular moves and two released rogues; #230 adds the fifth separate Cooldown Sabotage, held Anchor and healer priority | Emergency Stabilization does not yet exist, nor its seal VFX | Add one-shot, post-threshold protection without disrupting existing four/five-slot indexing or held-target cleanup |

### 5.2 Confirmed engine integration findings — must be solved in code when separately authorized

**A. Mirejaw health-floor protection can become stale after new healing.** In PR #230, `src/prototype/combat.js` `damage(e,...)` updates `e.mireLowestHpRatio` from **HP before applying the hit**, then applies the hit later. Today, without the meeting's new regeneration, the next hit normally updates the minimum. After Groundwater Recharge exists, Mirejaw could take a hit down to a new lower percentage, heal between attacks and never record that true low-water mark. That would wrongly restore some Hydraulic Resistance. Keep the hit's existing damage reduction based on the *pre-hit* defensiveness, but **record the new post-hit minimum as well**, in a monotone encounter-local floor. E.g., descend to 45% then recharge to 65%: protection must stay at zero; do not treat 65% as a new effective floor. **Confirmed source-level integration bug if the passive is added without that fix; not an assertion that the unmodified #230 currently has a live regeneration bug.**

**B. Groundwater Recharge needs a *new read-only enemy-side hazard occupancy check*, not new hazard placement or pathfinding.** PR #230 `boss-combat.js` creates persistent circle hazards with `sourceId: e.id`, `family: e.family`, `index`, `radius`, `life: 4`, and `tick`; `combat.js` currently iterates those hazards to damage/slow **the hero and party**, not heal the emitting boss. Implementation should inspect only live `mire` /`index === 2` **Inundation** circles attributed to that specific boss `sourceId`, verify alive/active engaged boss and **actual position inside the patch**, and apply the 2%/s or 5%/s once across the **union** of simultaneous patch footprints. It must never heal from a different boss's mud or from ordinary regional scenery, never heal after death/peace/leash reset, never heal past max HP, and never multiply by patch count. Integrate per-frame `dt` (the simulation already caps timestep); **clip contact to actual remaining active patch lifetime** so a final frame cannot grant >4.0 seconds of healing from one cast. Test partial-second contact, overlapping/re-entries, patch expiry, subsequent casts, Normal/TRUE and other difficulty multipliers. No puddle-seeking AI or new proximity aura: **the owner expressly rejected those complications**.

**C. Direjaw's Strain Hardening is compatible with one shared damage entrypoint, but needs precisely ordered state.** PR #231's `src/prototype/combat.js` `damage(e,...)` checks the target, line-of-sight and damage validity, applies any existing protections/burst compression, computes `actualDamage`, reduces HP, records the hit and resolves death. Add the incoming reduction only to eligible actual hits against the one `supply-march` captain; increment a 4%-per-stack counter **after a successful nonzero-HP-loss hit**, so it cannot reduce its own triggering hit. Three stacks cap at 12%; further real damaging hits refresh a **single five-second duration**. No stack on missing/blocked/non-damaging interactions. Define placement relative to existing shared damage-compression and other mitigations once, document it, and test mixed hero/companion hits, hits during the 55% phase, frame-step expiry and no cross-captain spillover. The approved reduction values are not open for retuning.

**D. Save/load can silently invalidate phase/passive expectations unless temporary state is scrubbed.** On PR #231, `Save.snapshot()` clears aggro/telegraphs and restores living enemy HP to maximum, **but does not explicitly clear `captainPhase` or new passive counters**. In the same branch `upgradeCaptainEndurance()` skips migration when `captainEnduranceVersion === 2`; its phase cleanup therefore cannot be assumed to run on every modern save load. Existing combat disengagement/pack-respawn paths *do* clear captain-phase state, but those paths are not the same as a save snapshot. Add a modern-save test: trigger Direjaw's phase, save/load, enter a fresh fight and confirm **Elastic Rebound can activate again once** at 55%; prevent a stale speed boost or absent phase. For the three new passives, never serialize active contact timers, protection stacks, one-time shield flags or a held attacker in a way that misrepresents an encounter after HP/aggro reset. Explicitly reset them on death, leash, fresh engagement, zone change, save restore, replay/TRUE transition and relevant peace transitions. Preserve existing historical-save semantics; don't use new skill labels as save keys.

**E. The Keeper's new shield belongs in post-hit combat handling, not a cosmetic-only phase.** In PR #230 the shared `damage(e,...)` code is the place where hero and companions actually reduce boss HP. Trigger Emergency Stabilization only after a *survived* hit crosses/lands at ≤50% max HP; the triggering hit takes no new reduction; following eligible incoming hits get **30% for 6s Normal / 40% for 8s TRUE**, once per active encounter. If a hit kills him outright, do not revive, apply a retroactive shield or block the win. Count duration in actual simulation time; do not reset/retrigger due to existing boss recovery, healing, save/load, changing difficulty, or combat re-entry without a genuine reset. Use a visible, clear seal tied to **real** reduction state, not a misleading VFX-only overlay; do not occlude other telegraphs, held-player cues or TRUE warbands. Confirm this new protection does not inadvertently change the existing Cooldown Sabotage, healer focus or captivity behaviors.

**F. Display names must be changed at their actual owners, never merely in documentation or one generic list.** In #230's `boss-combat.js`, normal boss attack names are derived from `D.bosses[...].attacks[index]` text before the colon; in #231, the captain's three attacks and phase name are authored under `R.roomCaptains['supply-march']`, and the two rogue names live separately in the `R.rogueMoves` / `R.rogueSignatures` captain entries. Mirejaw's own two rogues have distinct boss entries. Update these owner tables plus genuinely player-visible descriptions/events/VFX/SFX references. Triggered Vortex Shedding, passive Hydraulic Resistance and the **three newly added passives** may need explicit readable combat/status feedback because they are **not** ordinary `D.bosses.attacks[]` slots. Use stable combat family/slot IDs; never add ordinary rotation moves to represent passive, rogue, or triggered effects. Watch for unrelated logic comparing `a.name` to hardcoded strings (PR #230 has a name-specific `Groundwork` test for another family): do **not** break another boss's behavior in a global rename pass. Keep Direjaw's anonymous cast anonymous: neither name, target footprint, cue art nor audio should reveal Flow Sliding while it is preparing.

**G. Keeper's fifth skill is still unmerged, and may affect the feel of the new passive.** PR #230 supports the separate 1.5-second-warned, 12-second-attempt Cooldown Sabotage; its targeted resolution extends the chosen Archer's healing timer first (or a selected unlocked hero cooldown). Anchor Swing still releases an existing captive **when the next Anchor Swing starts**, as designed. The new 6–8-second Emergency Stabilization window can overlap healer captivity and sabotage; **no encounter-level playtest of that combined triple interaction was performed here**. Preserve existing mechanics unless the owner approves changes, but require actual Normal/early TRUE/TRUE fight checks for survivability, counterplay and non-softlock.

### 5.3 Acceptance scenarios: concrete checks rather than paper plausibility

These are implementation acceptance examples, **not tests claimed to have passed**:

1. **Mirejaw — exact contact:** At 1,100 max HP and 100 HP missing, one second of unstacked active mud contact heals **22 HP**, two seconds **44 HP**. At 1,980 TRUE base, one second heals **99 HP**, four complete seconds **396 HP** if enough HP is missing. For partial 0.5s Normal/TRUE, grant **11 / 49.5 HP** before any game-specific display rounding. Overlapping all three patches still yields those same rates. No contact yields **zero** recovery.
2. **Mirejaw — protection non-regeneration:** After an attack lowers him **below 50%** max HP, immediately record that low point; recovery to **above 50%** must not restore any Hydraulic Resistance. Attack damage to the hero/party from Inundation and its existing slow progression must remain unchanged.
3. **Direjaw — stack sequence:** Against an otherwise qualifying uninterrupted four-hit sequence, protection on hits 1–4 is respectively **0%, 4%, 8%, 12%** before other pre-existing reductions; after five seconds without a qualifying hit it is **0%** again. A missed/blocked attack adds no stack. Phase activation at **≤55%** remains once per encounter with **50%-max-HP recovery and +20% movement**, subject to max-HP clamp.
4. **Keeper — threshold:** A hit from **51% to 49%** max HP is entirely unaffected by Emergency Stabilization; if he survives, the **next** eligible hit receives 30% Normal or 40% TRUE reduction. A lethal crossing does not save him. At six/eight elapsed seconds the shield ends and must not recur in the same encounter.
5. **Fresh encounter/save:** Start combat, activate each new passive/phase, save/reload or disengage, then return. Verify the established full-health encounter-reset contract, exactly once per fresh fight for one-time effects, no lingering stale flags, no phantom healing, no orphaned Anchor victim, and unchanged rescued/defeated status.
6. **Movement/readability:** Exercise Mirejaw's accidental patch-entry while chasing real moving players, with actual collision, terrain and 4s expiry; Direjaw's 0.9s anonymous cue remains visibly readable but unnamed; Keeper's seal does not resemble a hit-area telegraph. Capture normal and TRUE, desktop and touch views. Existing recorded attack texts, achievements and family IDs must still refer to correct slots.

### 5.4 Disposition / approval boundaries

- **KEEP:** All owner-approved final names; Mirejaw's 2%/5% contact regeneration; Direjaw's 4%-per-hit/12%-maximum/5-second Strain Hardening; Keeper's 30%-for-6s / 40%-for-8s one-time Emergency Stabilization. Keep all original #230/#231 mechanics, statistics and encounter order.
- **REQUIRES ENGINEERING BEFORE MERGE:** post-hit Mirejaw HP floor; actual owner-indexed mud contact/timing; correctly ordered successful-hit stack calculation; clean save/restore/phase state; post-hit once-per-encounter Keeper protection; player-visible combat-name coverage and truthful warnings.
- **REQUIRES ACTUAL TEST EVIDENCE:** New deterministic tests for the above and integrated encounter QA, exact-head regression/CI including phone/desktop, visual/audio correctness, old saves, free explore/rescue/TRUE/peace. Existing #230/#231 unit/CI results **do not** certify these three unimplemented passives or the combined candidate.
- **NOT AUTHORIZED:** Gameplay implementation, making players chase/guide mud as a new rule, adding cooldown caps, arbitrary extra attacks, changing owner-approved passives, new administrations, modifying the independent #286 or #289 drafts, merging or deploying.

**Audit conclusion:** The design is implementable using the current engine's existing hazard, shared damage, phase, timer, attack-slot and VFX systems. This is a source-level feasibility assessment, **not** a performance claim or permission to ship. Resolve the concrete issues above on a later owner-authorized implementation branch; preserve this PR as **documentation only**.

## 6. Implementation preparation — straightforward work first (NO GAME CHANGES)

**Purpose:** prewrite the *small, low-risk implementation slices* and their acceptance contracts **without implementing any of them now**. The owner instructed us to prepare the straightforward work first but **explicitly postponed changes to the playable game until a later implementation authorization**. This section is source-mapped instructions only, not a patch, production switch, tested branch or a new set of balance decisions.

**Verified source boundaries at preparation:** `main` `6f8089b2013647184efb04932fe6157f548238b9`; boss mechanics PR #230 `49be85ec89ac7201f72d3c2fd9308f215235ccad`; captain mechanics PR #231 `1e298f14299518186a9166cc658fb4b9a9979fce`. Re-fetch these paths and branch heads before implementing; independent branches and visual fixes may have moved. This preparation remains part of **documentation-only draft PR #290**.

### 6.1 Staging order, from easier to more interdependent

| Preparation package | Relative effort | Source dependencies | Definition of a complete *future* implementation |
| --- | --- | --- | --- |
| **A. Exact name-display map** | Lowest: string/source ownership, with indexing guards | Existing main names plus #230/#231 mechanics where names are applied | All selected names show in their correct encounter slots; no internal IDs or behavior change; names are not leaked through warningless cues |
| **B. Emergency Stabilization** — Keeper | Small, local defensive state plus VFX | #230's Keeper AI, capture and fifth attack; existing shared damage routine | One-time post-hit protection with exact Normal/TRUE values, clear effect timer and truthful readable seal; no shield on the triggering or lethal hit |
| **C. Strain Hardening** — Direjaw | Small-to-moderate shared hit hook plus reset | #231's 680-HP captain migration, 55%-HP phase, current shared damage handling | Post-hit 4% stacks to 12% cap, five-second refresh/expiry, correct interplay with phase, cleanup on reset/save |
| **D. Groundwater Recharge** — Mirejaw | Moderate: multi-object hazard occupancy + lowest-HP correction | #230's `mire` hazard ownership/expiry and Hydraulic Resistance | 2%/5% HP/s actual live mud contact and post-hit monotone scale floor; no added pursuit or patch changes |

**Release boundary:** These are preparation *packages*, not permission to ship A–D as separate published game releases. When implementation is authorized, stage and test them on isolated branches as appropriate, then reconcile into #232's single owner-approved worldbuilding integration. Do not begin package B/C/D in code solely because their written contract is ready.

### 6.2 Package A — final authoritative display-label map

A clean implementation will change *text in the actual owner tables*, not replace arrays, move attack slots, modify `family` values or create alternate attacks.

| Character / category | Actual owner in the candidate source | Existing string / target | Final string |
| --- | --- | --- | --- |
| Mirejaw regular 1–4 | PR #230 `src/prototype/data.js` — `D.bosses`, id `mire`, `attacks[0..3]` prefix before colon | Jaw snap / Mire rush / Bog spit / Brood call | **Fluvial Incision / Hydraulic Jump / Inundation / Flood-Pulse Recruitment** |
| Mirejaw basic rogue | `src/prototype/rules.js` — `rogueMoves.bosses.mire.name` | Mirejaw's Bog Snare | **Matric Suction** |
| Mirejaw rogue signature | `src/prototype/rules.js` — `rogueSignatures.bosses.mire.name` | Mirejaw's Sinking Bank | **Rotational Slump** |
| Mirejaw triggered follow-up | PR #230 `boss-combat.js` and presentation/event coverage, **not** a `D.bosses.attacks` slot | Death Roll | **Vortex Shedding** |
| Mirejaw existing scale trait | PR #230 `combat.js` and status/presentation coverage, **not** another attack | Scaly Hide | **Hydraulic Resistance** |
| Mirejaw **new** passive | Future contact-healing integration and status cue; **not yet a slot** | Initial approved Hyporheic Exchange, later renamed | **Groundwater Recharge** |
| Direjaw regular 1–3 | PR #231 `src/prototype/rules.js` — `roomCaptains['supply-march'].attacks[0..2].name` | Bog Skitter / Spatter Fan / Silt Slick | **Flow Sliding / Sand Boil / Mud Pumping** |
| Direjaw basic rogue | `src/prototype/rules.js` — `rogueMoves.captains['supply-march'].name` | Direjaw's Silt Hook | **Pullout Resistance** |
| Direjaw rogue signature | `src/prototype/rules.js` — `rogueSignatures.captains['supply-march'].name` | Direjaw's Silt Curtain | **Grout Curtain** |
| Direjaw phase | PR #231 `src/prototype/rules.js` — `roomCaptains['supply-march'].phase.name` | Sloughskin (superseded proposal: Dilatancy) | **Elastic Rebound** |
| Direjaw **new** passive | Future defensive hit integration and status cue; **not yet a slot** | First proposed as Cyclic Densification | **Strain Hardening** |
| Drowned Keeper **all seven established skills** | PR #230 `data.js` regular attack descriptions / current `rogueMoves.bosses.archive` / `rogueSignatures.bosses.archive` | Current keeper repertoire | **RETAIN** Anchor Swing; Water Jets; Undertow; Echo Call; Cooldown Sabotage; Drowned Keeper's Undertow (rogue); Drowned Keeper's Floodgate Turn (rogue signature) |
| Drowned Keeper **new** passive | Future defense + status cue, **not yet a slot** | Approved from the outset | **Emergency Stabilization** |

**Important no-mechanics-change rules for A:**
- Preserve order and length of existing regular arrays: Mirejaw **4**; Direjaw **3**; Keeper **5 on #230** (only **4** on released main). Their current `index` values are used by combat/animation/summon/hazard logic.
- Do **not** replace display `name` changes with new `family`, captain profile, rogue configuration, save flag, `species`, boss type or room keys. In particular, `mire`, `archive` and `supply-march` must be stable.
- The engine on #230 constructs boss attack telegraph names from the **text before the colon** in `D.bosses[id].attacks[index]`. Keep the colon and the truthful, originally approved timing/damage description after it. Validate displayed warning/status/help names against their real source.
- **A name rename does not change an attack's stage visibility.** Direjaw's Flow Sliding must retain the #231 anonymous 0.9-second preparation (no actual attack name/footprint disclosed); skill labels may appear **only when the existing attack feedback rules allow**.
- Check for name-sensitive logic before changing it: #230 has an unrelated `Groundwork` name-based check for the `crypt` family; do not generalize changes and accidentally break it. Mirejaw's bog occupancy must continue being identified by stable `family='mire'`, `index=2`, and `sourceId` rather than by the mutable text `Inundation`.
- The Vortex Shedding follow-up, Hydraulic Resistance, and all three passives require **separate optional triggered/status visual labels** if the UI supports them; never fabricate extra castable regular techniques. Keep existing SFX/VFX ownership and source guardrails, including #257's eventual presentation audit.

**A's ready-to-run future tests:** compare roster string arrays against this table, confirm slot counts/IDs, use the real boss/captain attack builders and rogue resolver to inspect labels, verify warning anonymity, assert identical hit/geometry/timing/summon/phase values before and after name substitution, and check source/doc/help/TRUE spellings. This document provides *expected strings*; it does not claim tests exist or pass.

### 6.3 Package B — Keeper's Emergency Stabilization (smallest new stateful feature)

**Single authoritative mechanic:** For `e.type === 'boss' && e.family === 'archive'`, after a **survived positive-damage hit** first lowers the Keeper to `hp <= 0.5 * maxHp`, activate exactly once per live encounter. Reduction applies to **later** valid hits, **0.30 for six seconds Normal** and **0.40 for eight seconds TRUE**. Do not reduce the threshold-crossing hit, rewind damage, restore HP or block a fatal blow. If already dead, nothing activates. Preserve mode/TRUE multipliers from `bossEnemy()` and original `archive` save/finale family.

**Pre-implementation pseudocode, NOT new code:**
```text
incoming hit -> apply previously active defenses -> subtract actual damage
if target survives and was not shield-triggered this encounter
  and health <= 50%:
    mark one-time trigger, set six/eight second timer, show conservation seal
future incoming hit while timer positive -> apply 30%/40% reduction once
timer reaches zero -> remove visible seal; no retrigger until true fresh encounter
```

The existing engine already has `combat.js:damage()`, timer updates in `engine.js` and condition-driven procedural VFX; choose exact future source hooks after integration review. Do not create a gameplay-facing boss-heal cast or consume an existing attack slot. Regression fixtures: **51% -> 49%** initial hit unmitigated, next hit reduced, instantaneous one-hit lethal crossing unprotected, exact six/eight second expiration, multiple companions' hits, no extra protection after expiration, correct no-op during peace, and full reset on real encounter restart. Actual Keeper healer focus/Anchor hold/Sabotage interaction must be checked together.

### 6.4 Package C — Direjaw's Strain Hardening (small stateful feature)

**Single authoritative mechanic:** For the unique `supply-march` **captain profile**, each attack that actually reduces Direjaw's HP contributes **one +4-percentage-point reduction stack AFTER the hit**. Maximum **three stacks = 12%**, duration **five seconds after the last qualifying hit**; stack count remains capped but a subsequent valid hit may refresh expiry. Only reduction of **subsequent** attacks is allowed. No new HP, separate boss form, extra summon, change to phase damage or retaliation.

**Pre-implementation pseudocode, NOT new code:**
```text
on candidate incoming hit:
  verify eligible live captain + real positive HP damage, after existing hit gating
  calculate damage using existing stacks (0/1/2/3 => 0/4/8/12% reduction)
  subtract that hit
  if real hit landed and target survives: increment stack to min(3), refresh timer to 5s
each simulation update: expire all stacks only after 5 seconds without new damage
```

Use shared `damage(e,...)` rather than creating a second damage pipeline; preserve existing burst-compression/defense ordering and annotate its exact future position in the implementation PR. **A missed, blocked, immune, zero-damage or stale hit must never add stacks**. A stack timer is an encounter transient, not a new player save reward.

**High-yield save/phase fixture:** On #231 `Save.snapshot()` living enemies are restored at full HP but `captainPhase` is **not explicitly cleared for modern saves**, while `upgradeCaptainEndurance()` skips its migration cleanup when its version is current. This is a **concrete reset hazard** for the already-approved 55% Elastic Rebound, independent of the newly added passive. Test an existing-current-version Direjaw after his 55%-HP heal, save/reload, then damage him through 55% again: Elastic Rebound must fire **once** in the fresh fight, never zero or twice. New Strain Hardening stacks/timers must also clear. Disengagement, defeat, replay and Treasury re-entry should preserve existing quest/caches/dead captain facts, not leave stale bonuses.

### 6.5 Package D — Mirejaw's Groundwater Recharge: retain as later integration work

This is **not** part of the simplest preparation package because adding new healing to `mire` hazards creates interactions with damage computation and the already approved scale protection. The owner has rejected any approach that adds puddle-seeking, a special healing radius or separate cast controls. Keep exactly **2%/s Normal and 5%/s TRUE**, only for actual on-patch contact, and the existing **four-second** hazard lifetime; do not use the earlier unapproved lifetime heal caps. Resolve the HP floor bug described in Section 5.2(A) **before** enabling healing. The design is approved; sequencing is for engineering safety, **not a deferral or cancellation of the feature**.

### 6.6 Handoff status — preparation complete, implementation untouched

- [x] Existing final owner-approved names and mechanics consolidated in Section 2.
- [x] Name-to-source-owner map prepared without changing code or asset IDs.
- [x] Implementation order selected to prioritize display-only changes and the two simpler defensive passives.
- [x] Minimal deterministic regression fixtures and save/reset precautions written for the future coder.
- [x] Complex Mirejaw hazard/scales interaction explicitly reserved for its own verified integration step.
- [ ] **Not started:** any gameplay code, real new tests, UI/VFX/SFX changes, passives in production, PR merge, CI certification of this plan, integration candidate or deployment.

**No further owner action is required merely to keep these instructions on record. New code changes still require explicit implementation permission.**

## 7. Complex remaining mechanics — source-level integration specification (no gameplay changes)

**Status: DOCUMENTATION/PLANNING ONLY.** This section completes the other half of Section 6's safe-first preparation: the difficult parts of the owner-approved Flooded Marches update, **not** game implementation or a separate optional feature list. The final intended canon includes all owner-approved designs from PRs #230/#231 and this meeting. Any code integration still requires a new explicit authorization and #232's single combined publication gate.

**Inspected unchanged branch heads (12 October 2026):** `main` `6f8089b2013647184efb04932fe6157f548238b9`, #230 `49be85ec89ac7201f72d3c2fd9308f215235ccad`, #231 `1e298f14299518186a9166cc658fb4b9a9979fce`. Re-read fresh heads when implementation begins. **No integrated build or gameplay simulation was run for this audit.**

### 7.1 Mirejaw — Groundwater Recharge implementation contract

**Do not change:** Normal 2% / TRUE 5% of *actual current encounter maximum HP* healed per second; only physical contact with Mirejaw's own active `Inundation` mud; patch lifetime four seconds; no patch stacking, special movement AI, proximity aura, arbitrary encounter healing cap, increase in cast frequency, changed mud damage/slow, or extension of attack lifetime. Inundation is his regular attack 3 (zero-based index **2**), not his rogue snare or a generic water tile. Preserve normal and TRUE damage, encounter multipliers, attacks and summons.

**Verified existing engine support:**
- `src/prototype/boss-combat.js` #230: `resolveArea(e,a)` creates persistent four-second circle hazards with `family: e.family`, `sourceId: e.id`, `index` inherited from `a`, `radius`, `x`, `y`, `life:4`, `tick:1`; three patches are produced by `count:3`.
- `src/prototype/engine.js` #230: `tick(dt)` caps `dt` at **0.1s**, calls `updateParty(dt)`, `updateEnemies(dt)`, then `updateProjectiles(dt)`; therefore it can evaluate the *actual current boss position after normal combat movement* during hazard processing. Boss engagement already has distinct `mire` state; death-roll `continue` in enemy AI does not stop later global hazard updates.
- `src/prototype/combat.js` #230: `updateProjectiles(dt)` iterates `this.s.hazards`, currently affecting **party/hero**, and decrements/removes hazard lifetime. It does not heal Mirejaw; the new effect must explicitly inspect Mirejaw's occupancy using existing live hazard metadata, not alter shared party hazard behavior.
- `src/prototype/save.js` #230: snapshots clear `s.hazards` and restore living enemies at full HP, so hazard-contact healing must be encounter-transient and never resurrect removed mud on load.

**Recommended engineering sequence (not code yet):**
1. Fix the defensive *minimum HP* interaction **first** (Section 7.2). Otherwise healing can restore the wrong protection.
2. In the existing projectile/hazard update stage, identify a currently alive, engaged `e.type === 'boss'`, `e.family === 'mire'` owner with `e.id === a.sourceId`, `!e.returning`, a valid current zone and form. Ignore defeated/neutral/peace/freed/disengaged owners and unrelated mud. Do not have the owner search for mud or reposition.
3. For each owner, collect the *union* of all live circle hazards having `family === 'mire'`, `index === 2`, `sourceId === owner.id`; check the boss's actual position against `dist(e,a) < a.radius`. The boss is **not** part of `combatTargets()`, so checking only the existing hero/companion loop cannot implement the approved passive.
4. Accrue healing once per **owner per update tick**, not once per hazard. The same boss occupying three overlapping mud patches still heals at **2% or 5% per second, never 6% or 15%**. No heal when not currently inside any active patch; multiple casts can offer later new opportunities, consistent with the owner's no-lifetime-cap decision.
5. Resolve the boundary of the final hazard frame correctly: a hazard with only `0.03s` remaining and an update `dt=0.1s` may authorize **at most 0.03s** of healing (unless another active eligible hazard continues contact). Implement overlap across simultaneous patches with different remaining lifetimes by taking their **maximum eligible active overlap duration** within the tick, not summing them. Never heal from a patch already expired before that step. Prevent a just-created patch from granting more active time than it truly exists.
6. Heal amount `min(e.maxHp-e.hp, e.maxHp * (e.form === 'true' ? 0.05 : 0.02) * eligibleDt)`; preserve fractional simulation values and let normal UI format them. Do not derive percentages from `baseHp` when Nightmare/night/TRUE modifiers alter `maxHp`; cap missing HP and never heal a dead boss.
7. Emit restrained, truthful regeneration feedback only **when positive HP was actually recovered**, using current boss status/VFX/audio mechanisms where possible. Avoid a new large sprite/animation dependency, owner-redirection arrows or an area cue suggesting that an unrelated tile heals him. Test visibility but do not create redundant healing events for overlapping patches.

**Semantics of player movement:** The owner explicitly accepts that the mud may rarely touch Mirejaw and does not want a forced healing opportunity. **No code needs to steer him into mud**; the existing chase, collision, charges and dodging make any contact emergent. A test should show that it is genuinely possible, not guaranteed. Do not alter the three existing player-targeted mark positions to favor Mirejaw.

### 7.2 Mirejaw — health-dependent Hydraulic Resistance with healing

**Confirmed candidate issue in #230:** `combat.js:damage(e,...)` records `e.mireLowestHpRatio` using `e.hp/e.maxHp` **before** applying the incoming hit. Once Groundwater Recharge is integrated, an in-between heal may erase a newly reached post-hit minimum from observation, incorrectly restoring past scale reduction.

**Required correction, without changing the approved formula:**
- Initialize the encounter's minimum ratio to 1 at real engagement and reset it **only on genuine encounter reset**. Preserve 40% reduction at full HP declining linearly to zero at 50% HP; calculate the current hit's mitigation based on the *previous/current* low-water mark as appropriate, not a post-hit retroactive adjustment.
- **Immediately after subtracting damage**, update `mireLowestHpRatio = min(previousMinimum, max(0,e.hp/e.maxHp))`, before any regeneration can run. Don't revive a lethal hit. From then on, any healing leaves this minimum untouched. Keep this logic scoped to `type === 'boss' && family === 'mire'` and do not affect other damage types or unrelated anti-burst mechanics.
- Reset/normalize the encounter floor on disengage, new spawn/respawn, reload/full-HP encounter reset and genuine TRUE transition. Do not persist a half-fight minimum in a state whose HP was reset by `Save.snapshot()`. Maintain compatibility with already-saved old objects where the field is absent.

**Concrete regression:** At `1100 HP` take enough damage to reach `400 HP` (below 50%). Record 0%-remaining scales. Stand in an active mud patch to recover to `600 HP` (above 50%): the scales must still remain **0%**, not return to any positive reduction. After a real encounter reset, the fresh boss begins with the original 40% full-health reduction.

### 7.3 Cross-branch reconciliation — identified method-level collisions

#230 and #231 are **complementary**, but both edit several of the **same runtime methods**. Neither branch may be adopted wholesale at the expense of the other. Preserve at least the following *specific* parts when the eventual integration is authorized:

| Shared source/method | #230 must survive | #231 must survive | Exact combined audit |
| --- | --- | --- | --- |
| `boss-combat.js:attackPatches(a)` | Crypt's specific four Groundwork pads; Warlord's six simultaneously marked bombardment circles; baseline fallback patch layout | `captainSpread` dedicated **four/five separated** hazard geometry, with **no stacking**, and captain radius adjustment in fallback | Single method branches by **feature/owner**, retaining all specialty layouts. Assert Mirejaw three patches, Keeper one patch, Crypt four pads, Warlord six circles, Direjaw four separated Silt Slick/Mud Pumping patches, Highlands captain five. Beware overlapping numerical `count/index` checks across families; don't accidentally route captain moves into a boss special-case. |
| `combat.js:damage(e,...)` | Mirejaw's health-dependent scales, Warlord's source-side ash miss handling, relevant boss vulnerability and source-audited targeting | Captain guard/brood protection, damage compression and Dreadmaw's actual-damage reflection | Preserve **all** checks in one definitive damage resolver. Add new Direjaw Strain Hardening, Keeper Emergency Stabilization and Mirejaw post-hit floor **without** a second damage pipeline, shared base-damage change or side effect on other opponents. |
| `engine.js:tick/updateEnemies` | Keeper healer target/capture/held cooldown state, Mirejaw Death Roll, Ridge ledger, Warlord ash, accurate cooldown-sabotage attempts | Captain HP migration, 55% phases/attack selection, `anonymousCast`/warninglessness, circular hazards and existing movement-rate behavior | Verify neither a new boss state nor an unrelated captain phase skips the other's cooldown/update logic. Keep the established update order and battle/interruption exits. |
| `boss-combat.js` attack creation and resolution | Keeper's fifth sabotage attack/cooldown and Anchor replacement hold, four-owner-crypt wardens, Mirejaw roll and bog creation | `captainSpread` and captain attack/charge flags, cast bar anonymity and charge collision behavior | Test actual source-owned `index` and `sourceId`, not attack-name text. Preserve event timings, press/release, frame-state transitions and cues. |
| `save.js` snapshot/restore | Lifebinder `crypt` normalization and #230 boss/estate save migrations; held-victim cleanup | Captain endurance marker/HP scaling; phase reset, Treasury cache identities | One normal/TRUE historical save path must retain **all** edits; never revert Crypt normalization in order to add captain migrations. |
| `combat-visuals.js` / audio/VFX ownership | Keeper sabotage/captivity and Mirejaw's stage cues | Anonymous captain preparation bar; four-circle telegraphs; phase visuals | Correct warning footprint, cooldown labels and impact only when visible; no skill/target/audio leak before anonymous Flow Sliding. |

**This is a dependency map**, not a request to change Greenwood/Crypt/Warlord/captain designs now. Those examples demonstrate why conflict reconciliation must be cross-region when source modules are shared.

### 7.4 Remaining complex encounter-state and presentation scenarios

- **Keeper restraint while shielded:** #230's Anchor Swing releases an earlier held target when the next Anchor Swing begins. His #230 healer-targeting and Cooldown Sabotage share the same attack scheduler; new Emergency Stabilization is a defensive timer **not** another fifth/sixth cast action. Check that a held Archer's heal cooldown freezes appropriately, then resumes on release, and that the shield doesn't delay attacks by adding a fabricated cast. Keeper death, disengagement, exit, load and normal/TRUE transitions must remove orphan holds.
- **Direjaw at 55% health:** #231 heals 50% maximum HP and applies 20% movement on its `molt` phase; the new five-second Strain Hardening counter must be independent of that health recovery. Test correct one-time phase eligibility after real hit damage, cross-shield ordering and modern save reload (Section 6.4). Do not give a captain a new TRUE form or independent boss reward chain.
- **Combat readability:** A new passive should produce a truthful short cue/status without disguising an incoming hit area or overriding existing entity art. Mirejaw's momentary heal should not look like a new harmful mud patch; Keeper's seal should not obscure Anchor captives or the arena lanes; Direjaw's resistance should not imply the next hit is wholly blocked. Keep existing artwork, score, SFX, generated coverage IDs, night/TRUE effects and production sprite fallbacks unless #257 identifies a concrete contradiction.
- **Progression/identity:** `mire`, `archive`, and `supply-march` IDs remain stable. Preserve Sela/Neri rescues, key gates, 3 Treasury caches, existing Crown Peace, #266's *approved-not-shipped* ending, personal/role distinctions, and encounter order. No new regional positions or targets from roleplay color.

### 7.5 Quantitative bounds and targeted test matrix

| Scenario | Expected behavior |
| --- | --- |
| Normal Mirejaw with `maxHp=1100` inside one active mud patch for 2.0s | **44 HP** restored at 2%/s, clipped to missing HP |
| TRUE Mirejaw with `maxHp=1980` inside for 2.0s | **198 HP** at 5%/s, clipped to missing HP |
| Three overlapping active owner-created mud patches | **One** healing stream (2%/s Normal or 5%/s TRUE), not three |
| Enter in final `0.03s` of a patch; simulation `dt=0.1s` | At most `0.03 × healRate × maxHp` HP from that patch, not the full 0.1s |
| Mud belongs to a different boss, wrong attack slot, expired/peace, or Mirejaw is disengaged/dead | **0** Groundwater Recharge |
| Drain Mirejaw below 50%, then heal above 50% | Hydraulic Resistance stays at **0%** (monotone defensive decay) |
| Defeat/reset and fresh Mirejaw fight | Full expected base HP/scale protection, no stale regeneration or ownership |
| Direjaw recurring damage through 55%-HP phase | Strain Hardening and Elastic Rebound remain separately correct; full-HP save round-trip doesn't strand prior `captainPhase` |
| Keeper shields during Anchor/Heal cooldown sabotage pressure | Single after-hit 30%/6s or 40%/8s shield; player remains able to escape, get released and complete fight |
| Combined special attack geometry | All specialty patch families preserved; warning/impact areas agree, no accidental overlapping captain damage |
| 3 hero classes, Normal/Nightmare, field TRUE, Keeper early TRUE/TRUE, old v4 campaign import, phone/Desktop, offline | Full encounter/progression/asset compatibility must be demonstrated; none certified yet |

**Balance validation without silent retuning:** The unrestricted number of potential recasts means Groundwater Recharge has **no theoretical encounter-total healing cap**. Its *real* effectiveness depends on cast frequency and accidental contact, which has not been measured in actual fights. Confirm that solo/squad characters at region-appropriate levels can complete Normal and TRUE fights, that the boss can actually overlap mud sometimes, and that sustained contact does not cause unreasonably prolonged or unwinnable fights. Record observed cast/contact counts, heal totals, time-to-kill, encounter resets, and a few representative mobile dodge paths. If evidence uncovers unfairness, **report it for owner choice instead of imposing a new cap, reducing 5%, changing positioning or reworking the agreed passive**.

### 7.6 Completion and authority

**Preparation DONE:** source-specific design for Mirejaw's contact, expiry, healing and scale floor; method-level PR #230/#231 conflict matrix; Keeper/Direjaw combination and reset risks; numeric deterministic expectations; required full-game and manual QA.

**Implementation NOT STARTED:** no method edits, new automated tests, real scenario execution, build/release certification, gameplay balancing, merge, deployment or PR-branch integration were performed. This update is a continuation of documentation-only PR #290. **All approved canon is mandatory for the eventual integrated update**; these engineering steps do not postpone or cancel it.
