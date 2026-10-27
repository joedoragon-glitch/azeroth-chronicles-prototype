# Fourth class — Rogue Bard feasibility and implementation boundaries
**Date:** 26 October 2026  
**Source audited:** main at e44ea0ec4b9ed164a85431e972664efda2190da6  
**Outcome:** Feasible as an isolated future expansion, but **not** a trivial fourth class and **not** cleared for implementation. Source-only read audit. No game code, tests, benchmarks, CI, art assets, or deployments changed/run by this design PR.  
**Design source:** [discussion record](ROGUE_BARD_DISCUSSION_RECORD_20261026.md). Decisions attributed to the owner versus assistant examples are separate there.

**Supplemental review-ready proposal (26 October 2026):** [full gameplay and critical/balance candidate](ROGUE_BARD_GAMEPLAY_BALANCE_CANDIDATE_20261026.md), [static regular + crowned art design](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md), and [source-by-source housekeeping / implementation matrix](ROGUE_BARD_IMPLEMENTATION_HOUSEKEEPING_20261026.md). The earlier open Succession-ownership question is now resolved by the owner: all charmed allies persist through class changes; only Rogue can recruit new charmed monsters. These later source-based findings supersede tentative statements below where inconsistent.

## 0a. Corrected source-first starting balance baseline (latest owner direction)

Current real `src/prototype/rules.js` class bases: Paladin **120 HP / 18 Power / 8 Armor / 300 Speed**; Mage **90 / 22 / 3 / 300**; Ranger **105 / 20 / 5 / 320**. **Mage's +9 Power is a *Discipline training increment*, not base power.** Rogue's initial proposed bases are now **90 HP / 18 Power / 3 Armor / 300 Speed**, i.e. established minima only; dormant MP candidate **60** follows Paladin minimum. Standard XP/HP gain and purchases remain normal; **proposed innate hero passive growth is +2 percentage points personal crit chance per level** (new candidate, replacing 1pp; not final approval) and the owner's 2-second 1HP Endure. No innate HP/Power/Armor/speed increases. Treat static-derived minima as a policy choice, **not a simulation balance certification**.

**Important opposing risk:** Rogue has no starting Soldier or Archer while all other current classes begin with both. A 12% Charm roll per legitimate surviving primary hit with a short low-damage AoE **might fail to supply her first ally** before early enemy HP and incoming damage exhaust her. Require L1 solo opening tests and approved Charm safeguards as needed; do not compensate by secretly boosting conventional stats.


## Critical-led ally support expansion and independent control — 27 October 2026

The owner expanded the Rogue's skill design: all sixteen normal/charged forms (names already approved) are **combat-only, bounded dual-sided AoE performances** with enemy penalties and timed **nearby companion boons**. Different song buffs should be able to overlap; same-family and Ranger Rally interactions need clear stacking rules. The owner is considering **+2 percentage points personal critical chance per hero level** instead of the earlier 1pp, yielding L15 **40%** or **45% with five Codices**, and L18 **46%** or **51% with five Codices**. These odds are independent of critical **intensity**.

A fourth separate **Rogue critical intensity slider** (Level 1/2/3, default Level 1), independent of the existing ordinary Hero, Companions and World sliders, is an owner requirement. Actual source `critical-levels.js` has only three groups; add group `rogue`, register the seventeen Rogue action keys there, route the native Party group to Rogue without a new RNG stream, and provide genuine persistent settings/UI if player-adjustable behavior is required. Protect v4 save defaults and existing three modes. The older optional Party integration adapter hardcodes "all hero/... keys → hero group"; audit/update it. Level3 boosts **one original authored consequence**, never adds a new status/hit/charm or changes targets. 16-form proposed enemy/ally AoE, live PR #440 lever matrix and implementation requirements: [27 October dual-sided critical design](ROGUE_BARD_DUAL_SIDED_PERFORMANCES_CRITICAL_TIERS_20261027.md). The rest of this audit is historical/source integration groundwork; where previous rows assume a hostile-only or single-target skill, this new direction supersedes them.

## 1. Executive feasibility verdict

A music-themed female Rogue who manipulates combat, auto-charms eligible ordinary enemies into **permanent company members**, fields one extra active companion, relies on boss pets, and never hires Soldiers/Archers is **architecturally possible** in Azeroth Chronicles. Most of the desired behavior is expressible using the existing combat clocks, statuses, persistent party roster, companion navigation, formations, Barracks care, and procedural/spatial VFX.

However, the existing engine does **not** already have a generic system for turning a hostile into an ally. The monster and companion ownership paths are different; companion unit types are strongly whitelisted; save validation has a class-neutral Expedition cap; and several skill/critical/art/menu paths branch explicitly on three classes. New conversion and identity preservation layers are required. A faithful implementation is **moderate-to-high integration complexity** with a **high regression surface**, chiefly for recruitment/conversion, roster validity, recovery, and enemy lifecycle.

Recommended route: (1) finish design and species eligibility rules; (2) implement a minimal data-driven fourth-class and charmed companion type in a separate feature branch; (3) implement basic-attack Charm and persistent recovery; (4) add modest, bounded status/trap skills; (5) verify all integrations and performance. **Do not merge, deploy, activate or alter the current classes yet.**

**Non-negotiable presentation constraint:** the current game uses **static character art** (procedural drawings and canon-faithful still sprites with fallback), moved/positioned by existing simulation. Create **one static Rogue hero depiction** plus simple bounded music/guitar combat cues; no walk/idle/attack/dance animations, no animated poses, skeleton rigs, keyframe system, skeletal sprites, multipose assets or new animation production workflow. Do not infer that “dancer” means new animation technology.

## 2. Current-system evidence (from main)

Repository evidence links point to exact implementation areas at the audited main commit. Source observations, not tests or runtime certifications:

| Existing subsystem | Source evidence | Relevant implication |
|---|---|---|
| Hero class contract, base stats, training | [rules.js lines 6910–6932](../src/prototype/rules.js#L6910-L6932); [progression.js lines 23–39](../src/prototype/progression.js#L23-L39) | Three entries in class/discipline tables. Rogue needs a valid fourth entry and matching talent growth/curriculum; adding a menu choice alone will not suffice. |
| Starting campaign | [engine.js lines 47–49, 119–180](../src/prototype/engine.js#L47-L180) | Each new game starts at Expedition 1 and creates one Soldier and one Archer, regardless of class. Rogue must specifically start with an empty party in Normal/Nightmare/Developer/Arena as appropriate; Arena setup also needs review. |
| Current active slot numbers | [rules.js lines 6951–6979](../src/prototype/rules.js#L6951-L6979); [progression.js lines 134–135](../src/prototype/progression.js#L134-L135) | Ordinary ranks 1–6 allow **2 / 3 / 3 / 4 / 5 / 6** active companions. Rogue's requested +1 implies provisional class cap **3 / 4 / 4 / 5 / 6 / 7**; these are mechanically derived examples, not approved balance. |
| Basic Barracks cap | [party.js lines 1903–1913](../src/prototype/party.js#L1903-L1913) | Basic Barracks caps active group at min(3, Expedition cap); Rogue's bonus must be reconciled here and in activation/recruitment. |
| Companion identity/creation | [party.js lines 1860–1893](../src/prototype/party.js#L1860-L1893) | Party unit factory currently supports only soldier, archer, pet. A new vetted charmed type or tagged typed adapter is required; pretending a goblin is merely a Soldier loses species identity. |
| Ordinary recruitment | [party.js lines 2295–2331, 2416–2427](../src/prototype/party.js#L2295-L2427) | Training/recruitment is Soldier/Archer-only and intentionally costs crowns. Rogue must be denied **at domain level** in Captain, Barracks, payment queues and stale actions. Her charm is a distinct admission route. |
| Boss pets | [party-pets.js](../src/prototype/party-pets.js); [rules.js petCompanions](../src/prototype/rules.js#L6567) | Existing independent pet collection/party identity can stay. Bosses are never charmable; the existing pet system remains available to Rogue subject to owner decisions. |
| Recovery, bench, dismiss | [party.js lines 2536–2559, 2599–2675](../src/prototype/party.js#L2536-L2675) | Recovery recreates a unit from (type, petFamily). It would lose charmed species/variant unless a dedicated preservation path is designed. Active, reserve, fallen and same-ID recovery already exist. |
| Companion progression | [progression.js lines 77–135](../src/prototype/progression.js#L77-L135) | HP/armor/inheritance logic only covers three type keys and sync only visits soldier/archer/pet. Charmed species need an explicit, finite, friendly scaling profile, not copies of hostile difficulty stats. |
| Companion tactical combat | [party.js lines 2809–2869, 3062–3140, 3400–3459](../src/prototype/party.js#L2809-L3459) | Party handles focus, adds, follow/formation and survival. Soldier/Archer formations have only six indexed positions: a **seventh Rogue actor could repeat an earlier position**. Recommended initial path: tagged Soldier/Archer friendly AI with protected monster provenance, not a second AI engine. Troop skills/labor entitlement is a decision to make explicitly. |
| Ranged healing & training | [party.js lines 2030–2280](../src/prototype/party.js#L2030-L2280); [progression.js lines 393–433](../src/prototype/progression.js#L393-L433) | Friendly Archer/Ranger support uses its own training ranks and recovery effects. Charmed healer eligibility and Alchemist-trained support should reuse **this** flow or an equivalent audited shared helper. Do **not** run enemy healing into player party. |
| Hostile monsters | [engine.js lines 2040–2070](../src/prototype/engine.js#L2040-L2070); [enemy healing paths lines 350–700](../src/prototype/engine.js#L350-L700) | Enemies have hostile type, home, aggro, death reward, respawn and healing ownership. A successful Charm is a **controlled allegiance transfer** and must cleanly detach hostility; never leave one monster alive in both arrays. |
| Existing traps | [engine.js lines 7828–7931](../src/prototype/engine.js#L7828-L7931) | Authored traps are computed from dungeon/mini layouts. Activation loop explicitly affects **hero + active living party** only; hostile monsters do not trigger those traps. Disarming needs persisted per-trap state; player traps need distinct owner/filter and bounded lifecycle. |
| Mage Interrupt / Silence | [rules.js lines 6417–6438](../src/prototype/rules.js#L6417-L6438); [hero-combat.js](../src/prototype/hero-combat.js) | A bounded interruption/special-readiness owner exists; Rogue can specialize in frequent, narrow counterplay without unlimited cast-lock or overriding authored boss windups. |
| Skill slots and class assumptions | [rules.js lines 6556–6566](../src/prototype/rules.js#L6556-L6566); [hero-combat.js](../src/prototype/hero-combat.js) | Basic combos, class ultimates, tap/charged Skill 1 and advanced slots branch explicitly by class. Rogue requires an intentional full eight-slot contract, never a fallback to Mage/Ranger actions. |
| Save validation | [save.js lines 173–182, 499–504, 739–795, 1023–1050](../src/prototype/save.js#L173-L1050) | Version-4 saves whitelist hero class, companion types and pet identity, cap active party at the **old class-neutral values**, and bound company at 200 plus queues. Rogue +1 and species records require class-aware validation and backward compatibility. |
| Succession | [engine.js lines 3579–3595, 3634–3672](../src/prototype/engine.js#L3579-L3672); [save.js lines 688–709](../src/prototype/save.js#L688-L709); [app.js lines 3960–3980](../src/prototype/app.js#L3960-L3980) | **Owner clarified:** existing class-list-driven Succession remains unchanged in principle, now with four classes. Inherited charmed companions remain owned, but a non-Rogue successor cannot Charm new enemies. **Small required changes:** save validator's hardcoded max 3 fallen/game over length 3, “three classes” UI copy, normal-class capacity if Rogue's seventh actor remains active. |
| Graphics | [visuals.js around line 17195](../src/prototype/visuals.js#L17195-L17202); [renderer.js around line 2094](../src/prototype/renderer.js#L2094) | Existing hero and party visual dispatch is static. Add a static Bard/Rogue identity and ally species representation with no new animation loop. Preserve Canvas and opt-in Pixi rendering, static sprite fallback, foot anchors and current effect budgets. |
| Support and status | [rules.js lines 6195–6249](../src/prototype/rules.js#L6195-L6249); [COMBAT_CONDITIONS_V09.md](COMBAT_CONDITIONS_V09.md) | Slow, cooldown debt, ally support and interrupt-related behaviors already exist. Anti-healing and damage-over-time must be checked for reuse; neither should be declared implemented without a source/target/status lifecycle design. |

**Documentation caveat:** an older separate src/classes.js exists, but the **active Prototype campaign** uses R.balance.classes through src/prototype/engine.js. Future implementation must not mistake the older standalone class catalog for the authoritative modern gameplay class registration.

## 3. Feature-by-feature feasibility matrix

Ratings reflect **qualitative source-design assessment only**, not runtime proof.

| Proposed feature | Feasibility | Risk / recommended boundary |
|---|---|---|
| Fourth female class, guitar/bard role, low direct damage | **High** | Add data-driven Rogue class and talents, eight skills and UI; visually one still sprite/procedural fallback. Art direction remains tentative. |
| Static visual music/dance identity | **High** | One static silhouette, original guitar design, existing position/projectile/status cues; optional original sounds via current audio path. **No animation system**. |
| Starts without Soldier/Archer | **High** | Conditional constructor and Arena/tutorial behavior; test empty-party progression and combat. |
| No ordinary troop hiring | **High** | Domain-level rejection in recruitment, queued payment, training, menus and old/stale actions; existing classes unchanged. |
| +1 active companion at every stage from start | **Medium–high** | Shared function for effective cap and explicit class checks in Basic/Full Barracks, save, UX, recovery, Succession. Cannot just increment UI display. |
| Chance to charm via **basic hit** | **Medium–high** | One roll per valid attack/action/contact under an explicit hit ownership rule, never per simulation tick; gating before state mutation and no reward duplication. Owner has not picked chance or scaling. |
| Enemy converted to permanent companion | **Medium–high** | Highest integration hotspot: convert vetted hostile identity into vetted party schema; clear hostile telegraphs/targets/support/rewards/home/respawn/pack associations; save safely and never keep both hostile and allied copies. |
| Soldier/Archer AI reuse per captured role | **Medium** | Reuse friendly role behavior. Do not run original hostile AI or automatically grant all troop-only special skills, labor, equipment or healing. Test pathing, formation, reach, LOS, stops, death. |
| Enemy healer uses friendly healing and Alchemist upgrades | **Medium** | Positive source support exists, but target selection/recipient validation, support rank and suppression must be explicitly shared; prohibit cross-faction healing. |
| Species identity + stat growth | **Medium** | Need spec: preserve visual/species distinctions while applying companion-compatible HP/damage/armor/growth; never inherit hostile elite/TRUE/night buffs into party. Explicit unresolved owner tradeoff. |
| Exclude boss, captain, Ringleader, scripted summons | **High** | Source-validated eligibility whitelist required. For temporary/scripted summons default ineligible until reviewed, **not** an asserted owner decision. |
| True hybrids | **Deferred** | Pet-style AI is not a drop-in replacement; role switching, melee/ranged, healing and transforms can increase complexity. Exclude from initial release unless specifically validated. |
| Charmed recovery / bench / reserve | **Medium–high** | Recovery must recreate same species/role with same ID and cap membership, no duplication or HP loophole. |
| Per-species owned copy quota | **High** | Count active+reserve+fallen on class-specific Expedition cap, validate in saves and on all charm attempts. Exactly define species-vs-variant key. |
| Total roster size | **Open, important** | Existing 200 actor cap is a **defensive ceiling**, not a desirable Barracks design. Species quotas alone allow large cumulative reserves; choose a smaller total monster/company budget before implementing. |
| Trap detection and disarm | **Medium** | Existing authored traps are derived each frame from positions/cycles. Need small saved suppression/disabled-state keyed to dungeon/layout/mini identity and rules for permanence/reset. No alteration of map geometry. |
| Two or more player-set traps that hit enemies | **Medium** | New bounded player-trap owner/target filter and expiry; reuse existing trap shapes/collision where possible. Environmental hostile immunity should remain untouched unless explicitly changed. |
| Better/frequent interruption than Mage | **Medium** | Reuse interruption owner, target scope and timing. Favor low-cost, precise counters; do not add endless boss-special suppression. |
| Slow, anti-heal, damage-over-time, cooldown sabotage | **Mixed: medium to medium–high** | Slow/cooldown debt have precedent; anti-heal/DoT must be authored as bounded statuses with save/load, nonstacking, immunity, cleanse, boss caps and cue ownership. Do not silently copy enemy Rogue maneuvers as hero skills. |
| Summon “something” | **Open / high-risk if actor-based** | Owner did not specify entity/AI/duration. Prefer defer; a simple non-AI decoy or presentation effect is a later option, not an approved feature. An extra persistent actor system is disallowed by cost goal. |
| 1 HP for 2 seconds Endure | **Medium** | A guarded lethal-damage intercept can work, but must not cause uncontrolled immunity, endless retrigger, duplicate deaths or break Succession/save/respawn. Candidate cooldown 90s and death at expiration if not healed are **proposals**. Passive is proposed to gain **+2pp personal critical chance per level (including L1)** (subject to owner balance review), no other innate stat. |
| Balance relative to three current classes | **Possible, unverified** | Low hero DPS + one extra companion + interrupts + healing/DoT may be very powerful. Requires matched campaign combat tests, not intuition. |

## 4. Smallest sensible architecture

### A. Class contract, no generalized character rewrite

Add one id ('rogue') to the **live prototype** class and talent tables, presentation class selection and class-specific skill/critical dispatch. Keep existing Paladin, Mage and Ranger constants untouched. A documented default fallback to another class would be a defect. Keep existing eight normal + charged hero skills and current Skill 1 basic attack contract; proposed eight names in the discussion record are not yet canon.

### B. Charmed monster as an explicit party actor

Recommended initial structure after closer source review: a **tagged existing 'soldier'/'archer' friendly companion** with persistent ID, vetted `charmOrigin` (source species/variant/role), source-faithful static art, companion-scaled stats and ordinary lifecycle. This minimizes extra AI/critical/healing dispatch. Keep the tag explicit and validated, **never masquerade visually or in menus as a generic human soldier**. A fourth explicit `type:'charmed'` plus role adapter remains an alternative only if tag-specific work and combat entitlements cannot be safely constrained; do **not** implement both models.

On eligible primary automatic basic-hit Charm success, commit **once** and in order: (1) verify living/nonleader/permitted source, (2) check class, class+species+global cap and target still belongs to current hostile zone, (3) clear or cancel targeted pending hostile actions, (4) remove/detach from hostile collection and encounter ownership without ordinary defeat/XP/gold/quest drops, (5) construct valid friendly instance with stable new companion ID and traceable species/variant, (6) insert in active group or an explicitly chosen reserve policy, (7) present a single bounded success cue, (8) persist correctly. Avoid reusing hostile AI scheduler or leaving source enemy visible/in combat.

This transfer plan is a **proposal requiring code audit of kill, pack, respawn and encounter semantics**; source read alone does not certify these steps as sufficient.

**Priority policy to resolve:** at full active group with free total roster space, does the new charm enter reserve immediately, or does Charm fail until an active slot is open? The owner's “captured companion joins party” intent favors predictable behavior, but no implementation decision has been approved.

### C. Shared friendly behavior adapters, not copied AI

Friendly melee = existing Soldier stance/path/fight/formation behaviors, with separate species stats and no implicit Soldier-only guard/power strike entitlement. Friendly ranged = existing Archer movement/kiting/shooting; friendly healer = same plus vetted friendly heal and training. Preserve existing basic attack ranges according to the **friendly role geometry**, not the more powerful enemy side; explicitly audit reach, targets, collision and line of sight. Initial hybrids deferred. Boss pets retain the separate existing 'pet' type and trained collection behavior.

### D. Capacity model

The engine's current activeCaps array is [0,2,3,3,4,5,6], ranks 1–6. As an explicit **derived design hypothesis**, Rogue effective cap is ordinary Expedition cap + 1. The owner's species quota is **total owned copies of species/variant <= Rogue effective active cap**, with fallen and reserved copies included. Do not set a separate independent expedition level for Rogue. Apply the same function to admission, live activation, Basic/Full Barracks, saves, references and Succession. Decide a **strict overall monster reserve cap** before allowing indefinite capture. Exclude boss pets from species quota (but they still count as existing companion slots and company roster where normal rules demand).

### E. Traps and debuffs

Add two bounded player-placement presets only after confirming their effects. New traps must have owner='rogue' (or equivalent), location, activation/expiry/cooldown/occupancy, target mask (hostile only) and strict active cap. Use the existing spatial geometry for contact; do not change authored environmental traps to affect enemies globally. Disarm of authored traps should record only identifiers/timers rather than cloning the entire trap layout. Slow, cast interrupt and cooldown debt should call their existing audited resolvers; anti-heal and DoT require an explicit target-state/status lifecycle design if no safe shared primitive exists.

### F. Endure and summoning

Endure needs a single lethal-hit interception hook, with a two-second one-HP state, suppressing repeated triggers, and defined duration-clock and death/rescue semantics. This must be **tested across normal defeat and optional Succession** rather than inserted as immunity. Summoning is a deliberately **unresolved separate feature**; choose a small non-AI implementation or defer without blocking the core class. Do not permit companion cap circumvention via a hidden summon roster.

### G. Art, audio, and both renderers — strictly static

One approved static Rogue identity asset or procedural drawing, with unmodified world anchoring/shadow/collision conventions and static monster silhouettes when allied. Existing projectiles, short notes/chords, impact flashes, cues, targeting rings, and lightweight event-based audio can evoke guitar/music without animating the body or introducing media-frame loops. Preserve original art direction and current accepted renderers, including Canvas fallback and optional Pixi path. The costume/silhouette concepts in the discussion record are **exploratory**. No new animated gameplay system, silhouette transformation loop, directional sprites, or “dance movement” implementation is allowed.

## 5. Performance and correctness contract

The reason this can be safe is that the **active party is already bounded**. The reason it can still be expensive is that naive charm scans, roster growth, target recomputation, new traps and effect/audio queues could multiply work each simulation tick. No FPS/performance claim is yet proved.

- Charm eligibility should be O(1) relative to current target plus a small indexed/once-per-attempt owned count; never rescan every enemy and every collected monster **each frame**. One deterministic roll per specified basic-hit receipt. Guard against multiple arrows, area hits, criticals and repeated physics contacts causing accidental extra charm rolls.
- New statuses advance in the existing bounded unit/status ticking mechanisms. Bound simultaneous traps and ephemeral music effects; avoid retained canvases, per-frame image creation or new persistent sound streams. Do not create an AI loop for reserve/fallen members.
- Use native active companions and existing spatial navigation; compare matched crowded scenes with ordinary roster vs same-sized Rogue roster and with Rogue's +1 slot. Additional actor cost is real; detect regressions in collision, targeting and party decision time.
- Compare **simulation time**, rendering time, frame skips/emergency recovery, memory, effect counts and PWA/mobile behavior, not apparent FPS alone. Measure Canvas and optional Pixi without gating the feature on finishing the renderer migration.
- Keep deterministic save/restores and RNG behavior. New Charm randomness must not silently perturb unrelated random enemy behavior; choice of independent RNG stream is a design decision to audit.
- No changing hostile spawn populations or boss layout simply to make Charm work. No generalized pathfinder, enemy AI, pet, renderer or artwork overhaul.

## 6. Save, compatibility, and edge-case checklist

A future build is NOT acceptable merely because a new Rogue game starts and charms a goblin.

- **Existing saves:** every valid historical v4 save for Paladin/Mage/Ranger restores with unchanged party caps, classes, enemy allegiance, hero skill slots and reward history; no required new Rogue field for old saves. New Rogue records have strict type/species/variant/id, stats, allegiance and cap validation against forged saves.
- **New game:** Rogue starts with no Soldier/Archer, has usable first attack and +1 effective slot at Expedition 1; the first eligible encounters permit progression without an exploit or luck-based softlock.
- **Charm:** eligible melee/ranged/healer plus excluded boss/captain/Ringleader/hybrid/scripted summon/neutral/quest-bound actors; full/partial company; zero HP/dead target; multiple hit receipts; interrupt or death simultaneous with Charm; zone leave; boss fights, spawn respawn, pack AI, rewards and quest kills not falsely granted.
- **Party:** active/reserve/fallen/returning, squad doctrine, formation, reach and LOS, retreat, Slow/Silence, healer rank, support targeting, special skills, rally/support boundaries, level-ups, temporary HP stats, pet coexistence and no friendly fire.
- **Barracks:** admission quota counts active+reserve+fallen, class bonus applied in Basic and Full, dismissal/recapture/recovery ID integrity, queued recruitment refusal for Rogue, service threat guards and one-transaction-one-member care. Do not allow roster inflation or negative company slots.
- **Traps:** existing enemy immunity to *environmental* traps preserved, explicit Rogue trap hit works on monster only, no friendly fire (unless owner later decides), trap collision respects solid world, bounded expiry/disarm persists/restores correctly, dungeon layout IDs and independent cooldowns safe.
- **Endure:** simultaneous/projectile/DoT damage, status clocks, ordinary potion/healing, 1 HP protection boundaries, pause/reload, post-Endure fate, deaths and penalization, Succession; no repeated death notices.
- **Succession:** owner-settled: fourth class joins the existing dynamic class cycle and **every charmed monster survives class succession as an owned persistent companion**; non-Rogue classes simply lose permission to charm new monsters. **P safe overflow:** rest only necessary excess active allies in reserve when new class has a lower cap; retain all charmed identities/recovery and inherited provenance. Update current three-class save bounds and game-over copy; do **not** redesign class cycling.
- **Player-facing:** New Campaign + Succession and mode/arena selection; relevant tutorials including “Your First Company” (current Captain teaches Soldier/Archer hiring); Captain/Barracks text, hero journal, teacher menus, talent/equipment, Keeper Archive, notifications, status icons, map/campaign, English and Spanish, desktop/touch/controller inputs, reduced motion, fonts and accessibility.
- **Deployment:** offline GitHub Pages/PWA multi-file asset/cache loading and historical campaign migration; new static art can live in normal assets. No portable single-file mandate and no implicit CI or mainline release from this PR.

## 7. Proposed later phases and gates — no work authorized now

1. **Design gate:** owner revisits record, chooses charm eligibility and odds; stats/growth policy; per-variant and global reserve caps; +1 slot in Basic Barracks; on-full-group behavior; Endure cooldown/outcome; **Succession ownership already settled** (overflow/capacity policy only remains a technical detail); 8 skill concepts; trap lifetime and species art contract. Preserve unchosen ideas as deferred.
2. **Foundation proof-of-concept:** new Rogue class data, empty starting roster, simple static art fallback and capped validated charmed melee companion type. Focused unit/load tests; no status/summon/trap expansion.
3. **Core conversion and party integration:** melee/ranged/healer role adapters, one action-level Charm attempt, no hostile double ownership, companion progression, Barracks roster quotas and same-ID recovery, v4 save validation, all-mode and Succession checks.
4. **Trickster combat:** a conservative eight-slot repertoire built mainly from existing status/interrupt APIs and two kinds of bounded traps; add Endure only after lifecycle rules are explicit. Defer true hybrids and optional summons unless they prove easy and important.
5. **Static audiovisual completion:** one canonical still hero, species-aware allied visuals, bounded existing-event music cues, bilingual descriptions and Keeper/tutorial entries; Canvas/Pixi/offline parity.
6. **Concentrated acceptance:** focused automated edge cases throughout, then an owner-authorized end-to-end campaign/save/balance/performance/device acceptance before any **separate** merge/deploy decision.

## 8. Final classification and non-goals

**Verdict:** feasible and potentially distinctive, but core Charm + persistence is the main engineering commitment. A fourth hero row is simple; a player-owned menagerie with recovered species is not. Present it as a future game expansion, not an emergency patch, new renderer initiative, or barrier to current stabilization.

**Out of scope for this draft:** implementation; changes to existing classes; actual visual asset production; UI experiments; skill numerical tuning; real device certification; new animations; enemy/summon AI for party; full hybrid support; background jobs; PR merge; deployment.

This design checkpoint is intentionally **documentation only** and should remain **draft** for the owner's return.
