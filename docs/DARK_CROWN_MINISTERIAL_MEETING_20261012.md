# Royal office meeting: Cindermaw and Dreadmaw — authoritative design record

**Recorded:** 12 October 2026 · **Owner-approved fiction/design decisions** for the next consolidated worldbuilding update · **NOT shipped or implemented by this document.**

**Tracks:** #232 (one combined-release gate), #241 (Cindermaw / Dark Crown), #251 (scope truth and independent audit), #235 (Crown Peace); dependent gameplay draft #231 (captain survivability), related draft #230 (boss identities). The document is intentionally **documentation-only**. Do not merge, deploy, activate mechanics, or declare gameplay QA complete on its strength.

## Source/state boundaries

- **Released game:** v0.9.0 main at `6f8089b2013647184efb04932fe6157f548238b9`, at the time of this meeting. Cindermaw is a fixed Dark Crown field boss (7,000 base HP; Vera's ordinary cage/rescue), currently with four attacks, normal Ash-beast summon cap 3 and TRUE cap 6 (four minions plus two elite captains). His existing Broodscreen Roar has 180-unit immediate-effect radius; native-Ash-beast selection extends 750 units, native reinforcement cap 3, shared direct engagement range 195, and 1.5-second spatial warning.
- **Existing world:** Cindermaw's volcanic field roost, civilian Crownwatch, Ash Refuge, Ruined Foundry military repair/barracks, Crown roads/barracks/transports, and Cindermaw's seven-room irregular Treasury are already implemented. The Treasury has three collectible caches, a roost chamber, hoard chamber, ash den, ember junction, service loop, entrance cleft and Dreadmaw's inner vault. Ordinary Ash-beast residences and Crown soldiers are separate populations.
- **Unmerged #231:** Dreadmaw's 5,000 base HP, four broodlings, 25% received-damage protection per living broodling up to 100%, and 45%-HP Ash Carapace with four-brood replenishment, eight-second 30% *actual incoming damage* reflection and faster attacks have been coded on #231 but are **not on main**. #231 remains open/unmerged; prior automated success is not live/manual gameplay sign-off.
- **Unmerged #230:** five-boss identity/estate work exists and must be reconciled, not overwritten. No intentional Cindermaw summon-cap increase was found in #230/#231. Their boss/captain combat deltas must be independently preserved and checked.
- **Approved meeting decisions below:** owner-selected design for future implementation, not a claim that code, assets, abilities, AI, ministry facilities or save migrations already exist. In-roleplay magical education does not assert a new player spell or a shipped character animation.

## A. Cindermaw — Minister of the Interior and Welfare

### Appointment and governing doctrine (approved)

- The Dark Lord appoints **Cindermaw Minister of the Interior and Welfare**, imparting complete relevant education by the fictional `SHAZAAAAAM` scene.
- He is to deliver real, functional basic services while cultivating **institutional dependence upon Crown welfare**. Crown Peace permits food, housing, safe travel and interspecies cooperation while retaining coercive rule; the tone is deliberately oppressive/rational, **not** altruistic welfare. Portray this critically through in-game consequences, not new political systems unless separately specified.
- **Active field minister:** Cindermaw must travel/inspect assigned Dark Crown structures rather than simply sit in his old field compound. Preserve the existing field-boss identity, his combat availability, existing enemies/territorial roost and Vera's rescue. An encounter-compatible patrol/itinerary needs engineering; do not silently move the boss or turn interior maps into overworld walk destinations.
- This does not appoint Cindermaw a successor dungeon boss. His established roost/Treasury and approved creature appearances remain.

### Facilities transferred to his ministerial jurisdiction (approved)

All are **already-existing sites**, not permission to spawn duplicate buildings or seize unrelated specialist mechanics:

1. Crownwatch: residential housing, forge, food-preparation/supply facilities and taxation/service administration.
2. Ash Refuge: existing refuge and domestic facilities.
3. Ruined Foundry: existing military-occupied repair hall, forge and barracks; retain its occupants and encounters.
4. Dark Crown road/supply network, Crown field barracks, guarded roads and transport hubs, for the ministry's inspections and facilities responsibility.
5. Cindermaw's original roost/compound and Treasury retained. **The entire existing Treasury is now co-managed with Dreadmaw's Agriculture ministry**; the two ministers' responsibilities are complementary. Inner-vault security and established caches do not disappear.

Meaning of “belong to you now”: administrative control/assigned inspections in the fictional government; do not delete original roads, transport, NPCs, military infrastructure or ownership/gameplay interactions.

### Vera the Master Smith (approved role; precise support mechanic deferred)

- Owner explicitly rejects having Vera **idle in a cage**. She is an exceptional Master Smith, not a generic stationary worker.
- **Chief Field Engineer and Master Smith:** Vera stays close to and **travels with Cindermaw**, under guards, providing uniquely advantageous smithing/engineering expertise during facility inspection and combat-support operations.
- **Compulsory but paid:** work is institutionally mandatory; she receives **real wages in crowns** and necessary tools, materials, food and rest, but is not free to leave before liberation. This is coerced employment, not voluntary service, and must not be framed as freedom.
- A **mobile ministry forge / Emergency Refitting** supporting repaired infrastructure and protective equipment for Ash-beast personnel was floated and welcomed as the plausible application. **Detailed implementation is explicitly deferred by the owner** (“we will deal with the details separately”): do not lock an exact buff, attack slot, armor value, portable building, path, NPC service or currency amount here.
- **Critical rescue rule:** defeating Cindermaw must still allow Vera's existing rescue; once rescued she must be freed from escort/custody and her established post-rescue Master Smith services/progression must work. No duplication, softlock or requirement to chase a moving cage. Preserve historical rescues and old saves.

### Seven **approved conceptual** interior/welfare attack techniques

The owner explicitly accepted the seven actual government/public-law/welfare terms below. **All non-summon moves get new mechanics; the existing Ash-beast summoning move stays functional but is renamed and staffed.** Exact damage numbers, ranges, cooldowns, visual recipes and balance not specified except where stated.

| # | Move | Government-term identity | Desired combat behavior |
| --- | --- | --- | --- |
| 1 | **Cordon Sanitaire** | Protective/quarantine perimeter | Large burning cordon/ring controls the arena, with visible escape openings before contraction and circular explosion. Preserve genuine path to safety. |
| 2 | **Administrative Distraint** | Legal seizure to recover an obligation | Mark a target, Cindermaw lunges with claws, damages and temporarily strips an active defensive buff. Specify dispel eligibility later. |
| 3 | **Parens Patriae** | Government's protective guardianship power | Protects nearby Ash-beast subordinates and triggers a fiery retaliatory counterstrike. Avoid infinite protection. |
| 4 | **Index of Multiple Deprivation** | Composite statistical deprivation measure | Seven separate administrative seals/ground locations erupt in sequence, leaving navigable escape paths. |
| 5 | **Horizontal Fiscal Equalisation** | Redistribution between jurisdictions with differing means | Hits the healthiest party member and uses damage actually dealt to restore health to the weakest surviving Ash-beast ally. Avoid healing beyond legal max HP. |
| 6 | **Devolution of Authority** | Transfer of government responsibility | Existing Ash beasts are assigned coordinated attacks from different directions, then Cindermaw finishes with a heavy strike; stopping delegates disrupts the sequence. |
| 7 | **Mutual Aid Agreement** | Mutual emergency-service support | **Retains the actual Ash-beast summon function**; summons are now framed as ministry responders. See staffing below. |

The dialogue framed the first six techniques as fundamentally reworked, not simple renames of old cone/charge/circle moves. Reuse working engine primitives where possible but prove that each stated effect truly occurs. No unrequested new species or new combat subsystem.

### Approved summon staffing and Broodscreen Roar override

These are the **final owner corrections**, superseding intermediate five/seven and original three/six numbers:

| Item | Approved final design | Existing main (for comparison) |
| --- | --- | --- |
| Normal owned magical Ash-beast summons | **6 simultaneously** | 3 |
| TRUE owned magical warband | **8 simultaneously** | 6 |
| Proposed TRUE composition | **6 regular Ash-beast minions + 2 elite Ash-beast captains**, preserving two elite roles | 4 minions + 2 elite |
| Ordinary territorial Ash beasts eligible for Broodscreen | **Up to 6 existing ordinary defenders** | Up to 3 |
| Broodscreen's **immediate effect radius** | **1,200 world units** | 180 |
| Broodscreen's **territorial recruitment radius** | **1,200 world units** | 750 |
| Broodscreen windup presentation | **Anonymous 1.5-second cast bar**, e.g. “Preparing…”, without a move name or ground/spatial attack telegraph | 1.5-second spatial warning |
| Existing Broodscreen effect not independently amended | 85-unit push, 0.08 coefficient, 1.9-second rally burst (subject to QA) | Same |
| Nearby native support reach | Must let recruited defenders **actually move to/aid** Cindermaw from the larger jurisdiction | Shared support range 195; often too restrictive |

- The **six territorial responders are NOT the same as six/eight owned summons**. Use existing ordinary Ash-beast spawn IDs and population; no permanent extra creatures, no duplicate payoffs or respawn exploits. Summon cap and ordinary support count are independent.
- Ordinary native defenders must be able to travel along safe, navigable routes to combat, rather than merely being selected at 1,200 units and never arriving. Preserve spawn/home identity and combat leash behavior. Do **not** globally increase the shared rogue-system support radius of 195; any path to improved support should be **Cindermaw-local** and separately audited.
- TRUE wave replenishment at half health still refills to **eight concurrent personnel**, not eight extra on top. The two elite roles remain.
- An anonymous cast bar must **preserve a visible anticipation interval**, hide attack name/footprint until resolve, and keep damage/forced displacement understandable at 1,200 units. No immediate untelegraphed unavoidable hit. Specific player response tactics, UI/VFX/audio and fairness require validation.
- Keep Cindermaw's existing conditional rogue **Broodscreen** trigger distinct from one of his seven main attack slots. The owner expressly prohibited changes to **Dreadmaw's** rogue system; do not use this as an excuse for a global rogue rewrite either.

## B. Dreadmaw — Minister of Agriculture

### Appointment, jurisdiction, shared base (approved)

- The Dark Lord appoints **Dreadmaw Minister of Agriculture**, bestows agricultural education by fictional `ALAAAKAZAAAM`, and tells him agriculture includes **livestock, meat, dairy, poultry, fisheries, husbandry, crops and their distribution**, not solely vegan/plant products.
- Food responsibilities are kingdom-wide across all five regions, respecting different species' diets. Existing Greenwood crops/orchards, Marches fisheries, mountain/frontier supplies and Dark Crown settlements are logical jurisdictions; **no wholesale farm system, extra region, NPC population, economic balance or new facility was approved**.
- Cindermaw and Dreadmaw **co-manage the whole seven-room Cindermaw's Treasury**; Dreadmaw remains the existing captain protecting the inner vault, with its three treasure caches and guard quota untouched.
- The Dark Lord already has a **Master of Coin (Ridge Tyrant)** and **archivist (Drowned Keeper)**. Dreadmaw's agriculture appointment must not overwrite their distinct financial and scholarly jurisdictions. His original devotion to the Dark Lord and apprenticeship under Cindermaw remain.
- No directive was made to move Dreadmaw out of his Treasury or give him a new outdoor patrol. Do not infer one from Cindermaw's assigned field itinerary.

### Preserve **all** approved/unmerged #231 captain survivability (hard contract)

- **Dreadmaw: 5,000 base HP**, via the approved historical-save-safe captain endurance upgrade; retain dead/alive state, phases and idempotence.
- **Four** owned Ash-beast broodlings, **three melee + one ranged**, capped at four alive. These are his broodlings, **not** Cindermaw's six/eight or six territorial responders.
- Each living broodling gives **25% multiplicative-via-single-guard-factor damage protection**, total capped at **100% incoming damage immunity when all four are alive**. Make broodlings defeat-able, targetable and reachable, otherwise an encounter can softlock.
- **Ash Carapace triggers at 45% HP**: refill missing brood slots to four, replace the prior six-second 30% reduction with **eight seconds reflecting 30% of actual incoming damage to its attacker**, and maintain the approved faster attack phase. Do not create five or more broodlings or infinite re-triggers.
- Keep the #231 cleanup/reset logic (death, leash, save, phase, summon cooldown, no stale reflection). Do not regress its old-save migration or owner-deferred manual encounter QA.
- **The existing rogue system is OFF LIMITS**, as explicitly ordered by the owner: no changes to Dreadmaw's rogue AI, tactical disruption (including Ash Snare and Idol Defiance), target selection, telegraph contracts, regrouping, utility maneuvers or shared rogue framework. Seven *regular* agriculture techniques are separate. If new moves would otherwise require shared rogue changes, resolve locally or flag the conflict for owner review rather than silently modify the rogue system.

### Seven **approved conceptual** agricultural attack techniques

Owner directive: **rework the four pre-existing regular captain moves and add three**, resulting in **seven active regular moves**, with Ash Carapace a separate automatic phase. Names are genuine specialist agricultural/fishing concepts. These are **designs**, not live attack implementations.

| # | Name (final) | Replaces/adds | Desired combat behavior |
| --- | --- | --- | --- |
| 1 | **Subsoiling** | Replaces Cinder Mark | Two sequential marked deep-soil fractures explode upward through ash and rock. |
| 2 | **Transhumance** | Replaces Blackline Rush | A readable livestock-migration-themed charge with a **second directional rush**; both paths remain dodgeable. |
| 3 | **Ensiling** | Replaces Ember Veil | Cone of superheated ash and fermentation vapors damages/slows and leaves a brief dissipating hazard. **FINAL NAME IS ENSILING ONLY.** Explicitly reject old working title “Anaerobic Ensiling”. |
| 4 | **Nucleus Herd** | Replaces Brood Call | A themed **summon of the same four broodlings**, preserving #231's exact three-melee/one-ranged composition, cap and 25%-per-alive protection. |
| 5 | **Purse-Seine Closure** | New fifth regular attack | Ring/encirclement closes inward with visible escape openings and a delayed explosive resolution. |
| 6 | **Creep Feeding** | New sixth regular attack | Short buff to **existing** broodlings' readiness/movement/attacks; adds no new summons and revives none. |
| 7 | **Evapotranspiration** | New seventh regular attack | Marked patches heat sequentially then vent steam and glowing ash; clear escape paths and readable timings. |

No new permanent guardian quota, no changes to the existing Treasury geometry/traps/rewards, and no optional boss escalation without approval.

### Distinction: active attacks versus retained other abilities

- **Seven active named moves** means the seven above, not five plus special attacks.
- **Ash Carapace** is the eighth *distinct mechanic*, an automatic 45%-HP defensive phase, not a seventh attack slot.
- **Dreadmaw's Ash Snare** and **Dreadmaw's Idol Defiance** remain separate rogue tactical abilities, unchanged and not rebranded as agriculture.
- In the last scene, owner specifically shortened “Anaerobic Ensiling” to **“Ensiling”**, then affirmed the set as perfect. Treat that edit as final, not provisional.

## C. Meetings, chronology, and source-preservation ledger

1. Both Ash beasts were summoned to the Dark Lord's private office; Cindermaw first appointed Minister of the Interior and Welfare and magically educated.
2. Owner reviewed Cindermaw's four released boss moves (Cinder Rend, Ash Rush, Furnace Spit, Brood Command) and 7,000 base HP; ordered seven total ministerial moves, preserving a functional Ash-beast summon.
3. Owner accepted the seven government-term techniques listed above.
4. Owner noticed previous assistant's incorrect **970 HP** statement for Dreadmaw. That was pre-guardian-scaling: main's unscaled generated base of 970 becomes **2,765 HP** under main's 2.85x Dark Crown guardian health scaling at standard conditions. The **5,000 HP** survivability rework exists **only in unmerged #231**. Do not mix shipped and draft states in UI, dialogue or release notes.
5. Owner corrected Cindermaw's summon limits **3/6 → 5/7 → final 6/8**. Interim numbers are historical only.
6. Owner requested stronger ordinary-Ash-beast rally: 3 at 750 units → six within 1,200; then explicitly expanded the **actual roar effect** to 1,200 as well and replaced its spatial warning with an anonymous cast bar.
7. Cindermaw gained the listed existing Dark Crown facilities, a roaming inspection role and a fictional oppressive, dependency-producing welfare mandate. Vera was moved conceptually from idle cage to a **paid, compulsory, guarded, traveling chief engineer** close to him, not merely assigned to a workshop. Exact mobile engineering bonuses deferred.
8. Owner stated Cindermaw's design session is complete **for now** and demanded skills should **actually work** and not break systems; implementation details to be settled separately.
9. Dreadmaw was promoted Agriculture minister (not Master of Coin or archivist), educated magically, assigned agriculture for both animal and plant food across five regions, and appointed whole-Treasury co-manager with Cindermaw.
10. Owner requested seven agriculture moves (**four replacements + three new**), **preserving #231 and not touching rogue systems**. Approved the proposed seven and finalized move name **Ensiling**, dropping “Anaerobic”.
11. The owner specifically requests this entire meeting be **annotated on GitHub**, not silently implemented as gameplay in the documentation step.

## D. Implementation ledger: do not silently conflate work states

| Feature | Main baseline | Owner-approved target | Existing draft implementation | Unresolved before coding / merge |
| --- | --- | --- | --- | --- |
| Cindermaw minister | Regional field boss at fixed roost | Field minister, patrol of assigned facilities | **Not implemented** | Patrol and encounter/rescue trigger preservation |
| Facilities | Existing separate Dark Crown sites | Administrative reassignment + co-managed Treasury | **Not implemented** | Avoid overwriting service/transport/barracks mechanics |
| Vera | Captive Master Smith behind Cindermaw rescue | Paid mandatory guarded traveling engineer | **Not implemented** | Escort follow, own rescue, service return, saved states |
| Cindermaw attacks | Four normal moves + rogue Broodscreen | Seven ministerial active moves | **Not implemented** | Actual effects, balance, VFX/audio and terrain |
| Cindermaw summons | 3 Normal / 6 TRUE | **6 Normal / 8 TRUE**, 6 regular+2 elite TRUE | **Not implemented** | Boss-local override without changing other families |
| Broodscreen | 180 effect / 750 recruit / three regular | 1,200 effect + recruit / six regular / anonymous 1.5s cast bar | **Not implemented** | Real responder navigation, fairness, rogue isolation |
| Dreadmaw minister | Inner-vault captain | Agriculture + whole-Treasury co-manager | **Not implemented** | Preserve separate field/treasury bosses and food economy |
| Dreadmaw survivability | Normal base generated 970, then 2.85x → 2,765 daytime HP; three broodlings | Preserve **unmerged #231**: 5,000 base, four broodlings, 25% each, eight-second reflection at 45% | **Implemented ONLY in #231** | Integrate the actual PR deltas, old saves, accessible broodlings, no softlocks |
| Dreadmaw agriculture attacks | Four normal captain moves and separate rogue actions | Seven listed moves including **Ensiling** | **Not implemented** | 7-move scheduler, readable attacks, no rogue edits |
| Shared QA and publication | v0.9.0 released | One owner-approved combined worldbuilding update | Other regional/boss branches independent | Full Node/desktop/mobile/WebKit, save migration, boss Normal/TRUE, capture, second-pass audit, owner authorization |

## E. Specific non-regression / gameplay verification requirements

1. **Patrol and escort:** Cindermaw reaches assigned *exterior* anchors via traversable roads; does not walk through world barriers, get trapped inside the Ruined Foundry side dungeon, teleport, endlessly chase, or disappear from normal/TRUE boss/rescue availability. Vera remains guarded and near him while captive, and cleanly transitions into independent rescued specialist service without copying actors. Interaction/cage location stays discoverable by player and quest tracker. Verify old saves with both dead/alive Cindermaw, Vera rescued/unrescued.
2. **Ministerial moves:** every named skill actually selects, winds up, resolves, hits the right party targets, has readable escape geometry and cooldown, and cleans up on reset/kill/save. Defensive/dispel/healing/command and seven-stage patterns must have real effects, not text-only names.
3. **Roar:** confirm 1,200 *immediate* area and 1,200 existing-resident selection separately; anonymous cast bar, no move-name or spatial leakage, no instantaneous unavoidable damage; six real ordinary responders who can move/reach; no new permanent enemy or reward duplication. Do not increase all other bosses' global support radius.
4. **Summon cap and TRUE wave:** six/eight max active Cindermaw-owned, TRUE six+two composition; replenish, rather than stack; stable IDs as intended, death/reset/retreat save cleanup, no infinite farms, good pathing and pressure when hero has companions. Remain separate from six native responders.
5. **Dreadmaw:** apply #231 four-broodling/endurance/reflection implementation without truncating it; all four broodlings reachable/attackable; phase 45% correctly replenishes without stacking; damage reduction to 100% *only when four living broodlings*; actual damage reflection eight seconds only; no outdated six-second phase. Preserve default rogue skill catalog/behavior exactly. Add seven separately functioning regular moves.
6. **Treasury:** no damage to existing irregular floor architecture, entrance/exit, three cache spots/quest completions, Dreadmaw's guarded inner vault, guardian quota, mini-layout, side spaces and save migrations. Co-managing ministries are story design until mechanics approved.
7. **Progression and other systems:** Vera still unlocks original advanced smith services and Shared Strength role; Cindermaw defeat, rewards, gate unlock, Dark Lord access, and Dawn/TRUE/peace future finale compatibility remain. Other bosses/captains/territories and single currency crowns unaffected; historical save compatibility intact.
8. **Presentation:** class/hero visuals remain unchanged. Existing Ash-beast sprite designs retained (no unapproved replacements), phone + desktop cast bars/HUD are legible, effects match geometry, audio doesn't leak hidden move names.
9. **Publication boundary:** keep #230/#231 and all other draft regional/ending work intact; reconcile on one controlled integration branch only when authorized. This document and its draft PR are **not a content release**. Do not merge/deploy without explicit final owner approval.

## F. Deferred choices (not approvals by silence)

- Exact 7+7 move stats (base damage, multipliers, timings, cooldowns, actor/target rules, hazards, number of particles), display strings apart from locked names.
- Whether any new ministerial visual dressing or one small office is needed; owner instead directed reuse of existing facilities.
- Exact Cindermaw inspection route, frequency, patrol/home/leash integration, and how player reaches normal/TRUE/rescue during patrol.
- Vera's technical buff magnitudes, mobile forge placement/asset, guard count, post-rescue state and salary/wage amount; do not create a new economy system or optional constraint.
- How new Cindermaw abilities map to the baseline four boss attack slots without changing unrelated boss systems; exact implementation of no-spatial-warning high-radius Roar consistent with fair play.
- How seven regular captain attacks fit Dreadmaw's AI schedule without changing his rogue system; any animation/VFX/audio additions require an authored QA-compatible design.
- Specialized agricultural administrative NPCs and food-production mechanics **not** explicitly approved; avoid invention.

**Instruction for future developers:** This document is an *owner-approved design ledger*, not proof that systems exist in main or in #231. Bring the completed branch deltas, exact test evidence, unmerged dependency map, screenshots and known open issues before suggesting one final owner-approved batch release.
