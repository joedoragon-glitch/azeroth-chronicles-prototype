# Gameplay and world decisions — consolidated by subject

**So I Became the Dark Lord's Problem** · Subject consolidation reviewed 28 October 2026 · **Design record, not a work queue or release ledger.**

This page collects the owner's recorded design rules and their later amendments **by topic**, rather than forcing developers to search a long chronological change log. It preserves all **29 baseline design-rule paragraphs**, **32 dated decision sections**, and the other substantive introductory decisions from the previous document. Specific dates, numeric values, caveats and historical authorizations stay visible. Reorganization changes **documentation navigation**, not game behavior.

**How to use it:** Start with the relevant subject below, examine later decisions and explicit overrides, then check the actual [architecture and source owners](ARCHITECTURE.md) and [development state](DEVELOPMENT_STATE.md). The owner's current instructions and [AGENTS.md](../AGENTS.md) govern scope and permissions. A dated decision is evidence of design intent, **not** proof the code implements it, that tests passed or that an old permission continues today. Use the [engineering workflow](MECHANIC_DEVELOPMENT.md) before implementing a change. Preserve v4 saves and established IDs unless separately approved.

## Find a design decision

- [Economy, crowns, death penalties and Treasury recovery](#economy)
- [Companions, Expedition, Barracks, recruitment, pets and labor](#companions)
- [Hero classes, progression, input and abilities](#heroes)
- [Combat balance, bosses, enemy AI and Nightmare](#combat)
- [World geography, regions, structures, transport and dungeons](#world)
- [Narrative, named characters, lore and Archive writing](#narrative)
- [Visuals, sprite authorship, camera, terrain and presentation](#visuals)
- [Music, sound effects, event coverage and diagnostics](#audio)
- [Save modes, software boundaries and historical release governance](#saves)

## Known supersessions and cross-system dependencies

| Subject | What takes precedence | Earlier material to read with caution |
| --- | --- | --- |
| Ringleader burst-defense curve | **20 October**: knee/tail **0.145 / 0.240** | **9 October** reassigned curve **0.250 / 0.375** for ringleaders is superseded; other tiers remain subject to the later accepted rule and source check. |
| TRUE nighttime progress | **20 October** normal/TRUE non-final boss victory counting and bonuses | Older fifteen-point ceiling and normal-only assumptions are superseded. |
| Companion eligibility and pets | Later Community Snapshot TRUE-boss pet extension of shared inheritance | Earlier baseline's Soldier/Archer-only phrases describe their original scope; later owner-approved pet support takes priority where implemented. |
| Sound implementation | Keep contextual identity and event-type coverage, check current recording manifest/audio source | Old 'layered Web Audio only' wording and early soundtrack asset counts are historical implementation snapshots. |
| Release, tests, art production | **Current explicit owner consent** and [AGENTS.md](../AGENTS.md) | One-time Snapshot test/PR waivers, dated breaks or bulk sprite authorization are **not current permissions**. |
| Historical sprite inventory | Current [sprite manifest](../assets/sprites/manifest.json) and accepted art contracts | The v0.8.79 231-entry/no-active-sprite statement describes that release only. |

**Cross-references:** Boss/ADDS is grouped under companions but affects boss combat; the arrival/burst-defense decision is grouped under combat but includes travel; the ranged/Neri decision includes a character placement note; and regional lore lives mainly under world with authorial voice under narrative. These are **not missing decisions**—the complete original passages are kept under their principal topic.

<a id="economy"></a>
## Economy, crowns, death penalties and Treasury recovery

Currency, loss and retrieval of crowns, Treasury ownership, regional recovery and resource-cost flow. The Treasury recovery decision records a *design rule*; its historical publication wording does not independently prove the current build.

**Decision intent at a glance:** Crowns are the only player-facing currency; ordinary death removes the documented percentage after eligible Barracks protection, and the 21 October recovery design tracks the *actual removed crowns* by region and captain/cache collection. Succession deaths instead use their own class-loss consequence. Verify the owning economy/Treasury source for actual implementation.

### Current recorded recovery decision — 21 October 2026

**21 October — approved Treasury recovery:** Death penalties now transfer the actual removed crowns into a regional recoverable balance. Defeating the designated captain announces the amount; collecting the separate marked cache returns the whole balance once and resets it. Native defenders can return for later attempts. Frontier uses its existing roaming Cinder Warlord, who drops the marked cache at the actual kill location (owner-selected and clarified); other regions use their existing Treasuries. Earlier unregionalized losses cannot be reconstructed. This changes the recoverability of the old loss, not penalty rates or hiring prices. See `TREASURY_DEATH_RECOVERY_DEV128.md`. Crypt/Archive/Mine fort protection remains undecided and is not automatically authorized by its absence in an audit.

### Foundation rules (original baseline wording retained)

#### Death penalty and Barracks protection

- Death in Standard runs (Normal or Nightmare, no Succession) removes ceil(20% of positive carried crowns), reduced to ceil(15%) when at least one completed Basic Barracks exists in the death region, or ceil(5%) when at least one completed Full Barracks exists there. Use the containing overworld region for dungeon, side-dungeon and supply-room deaths; construction sites do not count. Succession deaths remove no crowns because class loss/replacement is the entire penalty. The balance floors at zero with no debt. A Standard player may choose any completed Barracks as a persistent death respawn point through its menu, or return to the last refuge; the choice does not affect which region grants crown protection. Fallback to the last refuge if the chosen Barracks ceases to be valid. No change to save version 4.

#### Crowns as the only public currency

- Crowns are the official currency of the Dark Lord's regime and the single currency used throughout the game, including resistance trade and recovered tribute. Player-facing amounts use the full word `crowns`, never `gold` or the `g` suffix. Existing numerical balances and economy rules stay unchanged. Internal `gold` save fields and event keys remain compatible with existing saves and backups.

### Dated decisions and later revisions

#### 21 October 2026 — flow standard and resource audit

The owner confirms difficulty should reward game knowledge/execution while respecting time: readable threats with useful responses, recoverable setbacks, clear rules and purposeful progression. Extra Crypt/Archive/Mine fort bonuses remain off/undecided; late Ranger-only piercing is not justification for early blanket mitigation. Resource gathering is now audited against this standard. Review-only findings and proposed repairs are recorded in `RESOURCE_GATHERING_FLOW_AUDIT_DEV129.md`; no runtime change or new balance authority is implied.

<a id="companions"></a>
## Companions, Expedition, Barracks, recruitment, pets and labor

Roster size, rank gates, training, health, formations, normal and TRUE boss pets, doctrine and resource labor. Later pet decisions can extend earlier Soldier/Archer-only scopes; do not silently discard either stage.

**Decision intent at a glance:** Expedition rank gates group size and services; Basic/Full Barracks, training, reserve/fallen recovery, labor and doctrine use the shared companion system. Later TRUE-boss pets are extensions of that system, not separate rosters. The detailed costs, ranks and inheritance formulas are preserved below.

### Foundation rules (original baseline wording retained)

#### Expedition rank progression

- Expedition is a six-rank specialist-trained skill. Rank 1 is learned by default. Mira trains through Rank 2, Sela through 3, Orin through 4, Lyss through 5 and Tovan through 6; later rescued instructors may train skipped lower Expedition ranks one step at a time. Expedition training costs 0 crowns but must still be deliberately trained either from the instructor directly or through rescued-specialist access at a barracks. Rank 1 provides the starting Soldier + Archer, Recall, Basic Barracks and an active-group cap of 2. Rank 2 unlocks recruitment, resource labor and cap 3. Rank 3 unlocks manual TARGET/THREATS and BOSS/ADDS switching. Rank 4 unlocks the optional Full Barracks upgrade and cap 4. Ranks 5 and 6 raise the active group to 5 and 6.

#### Full Barracks menu responsibilities

- A completed Full Barracks is a compact five-choice hub: Expedition Skill, Company, Rescued specialists, Operations, and Inventory & supplies. Recruitment, recovery and active-group composition are grouped under Company; map/objectives/resource labor are grouped under Operations. Specialist-taught inheritance skills stay inside the relevant specialist service instead of becoming additional top-level barracks entries.

#### Basic and Full Barracks costs and footprint

- Player-built barracks are the field home of the Expedition system. After the first free tutorial Barracks, every newly built Barracks costs 20 crowns and always starts Basic, regardless of Expedition rank. Basic Barracks provide 30-crown full-party wound treatment (hero plus living companions), fallen recovery, rescued-specialist access, group management and, from Expedition 2, recruitment and resource labor. Expedition 4 unlocks an optional Full upgrade for exactly 100 crowns with one companion providing labor. Players may leave any camp Basic permanently if its Basic functions are all they need; building Basic + upgrading later still totals 120 crowns. Basic Barracks are cozy field-adventure camps centered on a low expedition tent, visible bedrolls, communal cookfire and practical gear/supplies. Full Barracks transform that same reserved campsite footprint into a richer expedition base with a second sleeping tent, open command canopy/map table, additional bedding/seating, supplies, banners and warm camp lighting while retaining regional materials. Basic and Full deliberately reserve the same world/visual footprint so upgrading an already valid camp never requires more space or relocates it. Full Barracks support active groups above 3, act as resource deposit points and expose the complete operations/inventory package. No further building tiers exist.

#### Recruitment versus active roster slots

- Hiring and fielding are separate. Town recruitment unlocks at Expedition 2 but stops once the player employs three total companions, counting active, resting and fallen followers; the menu then explicitly directs the player to a barracks. Barracks may continue hiring companions into reserve, with a practical save-safety ceiling far above normal play. Expedition rank limits only the active group traveling with the hero. Barracks group management freely moves employed companions between the active group and resting reserve; Basic Barracks can support at most three active companions, while Full Barracks support the full Expedition cap.

#### Squad targeting doctrine and Recall

- Squad control is an extension of hero combat, not a separate RTS mode. WASD/joystick always controls the hero; there is no free squad cursor, field unit selection, individual attack/move command, or Hold Fire state. Combat troops use one encounter-scoped binary doctrine: TARGET/THREATS in field fights and BOSS/ADDS in boss fights. Paladin defaults to focus (TARGET/BOSS), while Mage and Ranger default to guard (THREATS/ADDS). Manual doctrine switching appears only from Expedition 3; disengagement restores the class default. Recall is available from Rank 1 as the emergency regroup command. Nearby aggro defines the active encounter even when the hero has not yet landed a hit, so the party defends the hero automatically.

#### Companion automatic specials and learning

- Companion combat progression intentionally stops at two automatic specials per role for now. Soldiers always know Power Strike (8s personal cooldown) and Archers always know Triple Shot (8s). The first time hero Skill 2 reaches Rank 1, a persistent companion-combat-training flag advances: Soldiers learn Holy Cleave and Archers learn Piercing Volley (12s personal cooldowns). The learned state survives reload and Succession; older saves infer it from an already learned hero Skill 2. These companion abilities mirror the appropriate Paladin/Ranger charged techniques but are ordinary AI skills, not charged inputs. If both specials are ready, the AI favors the second skill when it can hit multiple enemies, otherwise the first, and every special starts a 1.5-second shared special lockout so a second ready technique is held for a later combat beat rather than dumped immediately.

#### Soldier and Archer health and defense

- Companion durability uses the matching hero archetype as its level-1 baseline: Soldier = Paladin baseline (120 HP, 8 defense), Archer = Ranger baseline (105 HP, 5 defense). Each companion then gains +12 max HP per hero level after level 1; defense does not grow automatically with level. Shared Training/Shared Strength inherited HP is added after that base formula. Companion defense has no free level growth: Soldier stays at base 8 and Archer at base 5 unless Shared Strength is learned, which adds 25/50/75/100% of the hero's armor-tier and armor-reforge bonus. Existing companions resynchronize live and on restore, preserving absolute missing HP and keeping fallen units at 0 HP.

#### Neri training, healing and respec services

- Neri the Alchemist owns the separate companion-survivability crowns sink. After she is rescued, **Companion Vitality** may be trained repeatedly for 200 crowns per rank; each rank adds +10% companion max HP additively after the normal role/level/inheritance HP calculation. It has no gameplay rank cap and may exceed +100%. It affects Soldiers, Archers and authenticated Charmed monsters of either combat role, never the hero, applies immediately to active and reserve companions, and raises fallen companions' max HP without reviving them. Neri exposes the same training service when spoken to directly in town and through a barracks' Rescued specialists menu. She also sells a flat 250 crowns discipline-training reset through those same two access paths. Respec refunds every spent training point, removes the corresponding hero training bonuses, preserves level/skills/equipment, and immediately recalculates companion inheritance.

#### Rogue-only choice for fallen Charmed active slots (29 October 2026)

- At a **completed Barracks → Recovery**, the Rogue may select whether future fallen authenticated Charmed monsters immediately **move to reserve and free the active slot** (published default) or **stay fallen in the active slot**, matching the original classes' recovery model. Both choices preserve the exact individual, subtype quota, name and training, and require the ordinary 40-crown recovery; they never automatically revive a fallen member. New lawful Charms can only occupy newly available active slots; full active rosters can still receive additional Charmed monsters into reserve when eligible. The Rogue-only setting persists in the existing v4 campaign, defaults to automatic reserve when absent, requires safe Barracks service, and does not retroactively rearrange already fallen members. All other hero classes and non-Charmed companion types keep their existing death behavior. This is a **candidate change in PR #636**, not a claim of publication.

#### Charmed ranged monster healing (Rogue Bard, 29 October 2026)

- A Charmed monster that retains a native ranged role (such as a Goblin Slinger or Skeleton Bow Guard) also retains automatic friendly healing. It heals the Rogue, another living active Charmed monster of any species, or any other active living companion; it does **not** require current combat, another enemy nearby, or matching species. Wounded recipients can be treated during idle travel and after a battle. Hero-first triage and the existing ordinary Ranger automatic thresholds apply: any missing HP outside combat, 50% max HP or lower during combat. Active, authenticated Charmed healers use the normal Ranger's **60 HP over five seconds** at base rank and **150 HP over five seconds** after Neri's Ranger Heal upgrade, on a **ten-second cooldown**. They share the existing non-stacking support effect and are prevented by Silence, death, reserve status, and active work orders.
- This is friendly Ranger-style healing, **not** the hostile ordinary-enemy full-heal-in-three-seconds model or the former small 5%-of-max instant heal. All authenticated Charmed melee and ranged companions also receive Neri's repeatable +10% Companion Vitality max-HP training through existing shared companion progression. Charmed ranged monsters do not acquire Ranger mana recovery or Ranger offensive skills; conventional Ranger manual healing and training stay unchanged.

#### Shared Heal command (29 October 2026)

- **H / the Heal button is a command for any active companion with a legitimate ally-healing capability**, not a Ranger-hero or conventional-Archer-only restriction. It accepts conventional Rangers, authenticated ranged Charmed creatures, and the Little Lifebinder boss pet whose authored Stay Alive skill heals an ally. Other pets, melee Charmed monsters, forged captures, fallen/reserve companions, silenced casters and Charmed workers are not newly enabled. Boss-pet ownership must be backed by the TRUE unlock.
- Manual Heal and automatic ally triage share the existing five-second Ranger support effect, Neri-trained amount, ten-second per-caster support cooldown, hero-first targeting and non-stacking rules. Charmed healers consume their existing `charmSupportCd` instead of acquiring a separate cooldown; pet commands consume `healCd` and do not replace or reset the Lifebinder's authored on-impact combat skill. H can queue one transient, hero-directed request during eligible healers' cooldown, without writing queued requests into saves. Ranger Mana Recovery and class-specific combat skills remain separate.


#### Charmed companions and native critical effects (29 October 2026)

- **Owner correction:** Charmed friendly monsters belong to the **Companion** critical-intensity category just like hired Soldiers/Rangers and boss pets. Their authenticated melee and ranged **basic attacks** are legitimate native critical releases; allied **Heal** may critically increase its existing five-second restoration budget. Critical probability inherits lawful Companion bonuses (Shared Training/Codices and applicable Rogue Finale), not the Rogue hero's separate personal level bonus. A critical does not grant an extra projectile, hit, target, HoT tick or cooldown reset.
- Recruitment method must not turn critical eligibility off. Native basic attacks reuse their existing Soldier/Archer role action keys, while an authentic Charmed ranged healer reuses the `troop/archer/heal` critical key and existing `charmSupportCd`. This permits future **actually authored** Charmed skills to use the matching critical release only when their own action owners exist; it does **not** give Charmed monsters ordinary Soldier Power Strike, Ranger Triple Shot or charged Second Skill.
- **Live activation:** the playable browser shell (`app.js::activateLiveCritical`) already attaches enabled native Party and World critical sessions to created and restored games. Standalone `new Campaign` test fixtures remain unattached until explicitly enabled. This fix removes the unintended Charmed exclusion from the live critical system; it does not change global chance, probability streams, effect intensity or player-facing tuning.

#### Shared Training and Shared Strength inheritance

- Companion inheritance is handled by two paid support skills with separate rank counts. Shared Training has five cumulative instructor ceilings: Mira trains through Rank 1, Sela through Rank 2, Orin through Rank 3, Lyss through Rank 4 and Tovan through Rank 5; later instructors can cover skipped lower ranks one step at a time. It grants 20/40/60/80/100% of every applicable hero discipline-training stat to companions: training-derived HP, attack damage and movement speed. Mana regeneration remains hero-only because companions do not use mana. Shared Strength uses cumulative equipment-specialist ceilings: Borin trains through Rank 1, Dara through Rank 2, Eren through Rank 3 and Vera through Rank 4; each later smith can cover skipped lower ranks one step at a time, and any future smith after Vera should retain the Rank-4 ceiling. It grants 25/50/75/100% inheritance of non-talent bonus HP and damage above the hero's natural class/level baseline plus armor-tier/reforge defense bonuses. Both are live formulas rather than snapshots: learning catches the roster up immediately and later eligible hero-stat changes propagate automatically. Shared Training currently costs 140 crowns per rank across Ranks 1–5 (700 crowns total) because the training-derived bonus pool is smaller. Shared Strength currently costs 125 crowns, 200 crowns, 300 crowns and 425 crowns (1,050 crowns total) because the non-talent equipment/reforge bonus pool is larger. Shared Training ends at Rank 5; Shared Strength ends at Rank 4.

#### Party formation and protection

- Party formation is automatic, role-aware and class-aware, and rotates from the hero’s recent movement direction. Mage/Ranger formations keep Archers close to the ranged hero and Soldiers on a wider protective ring. Paladin formations keep Soldiers close to the melee hero and Archers farther behind. Under THREATS/ADDS Soldiers prefer enemies pressing the hero or unassigned Archers; under TARGET/BOSS they attack the doctrine target directly. Archers maintain class-aware formation positioning, step forward only enough to acquire firing range and fall back toward the formation side when rushed.

#### Labor and the retired Worker class

- Worker is no longer a party class. New runs start with one Soldier and one Archer. Any idle active Soldier or Archer can perform expedition labor; resource assignment sends all currently idle active troops, while barracks construction/upgrading uses one. Laboring troops are temporarily unavailable for combat, and Recall cancels labor without erasing building progress. Existing saved Workers migrate to Soldiers with health proportion and carried resources preserved.

#### Companion healing versus fallen recovery

- Living companion healing and fallen-unit recovery are distinct systems. Refuge rest fully heals every living companion for free together with the hero; fallen companions remain fallen. A completed Basic or Full Barracks, or a town Captain, can use **Treat wounds** for 30 crowns to restore the wounded hero and living wounded companions to full health when no nearby enemies are engaged; fallen companions still need individual 40-crown recovery. This paid service is available between free refuge rests (90-second cooldown). Queued treatment retains the hero/companion targets wounded at request time, without adding later wounds or reviving fallen companions. Recovering one fallen companion costs 40 crowns at a town Captain or barracks. Normal hero Skill 3 heals only the hero. Charged Skill 3 heals the hero and living active companions. Ranger Heal, commanded manually or triggered automatically, can heal the hero or a wounded living active companion; Ranger Mana Recovery restores hero MP only. Neither revives fallen companions. Combat potions are retired; Preparation tonic increases hero maximum HP and remains a separate service.

### Dated decisions and later revisions

#### Boss/ADDS priorities, not idle companions · 9 October 2026

Existing squad-mode switching remains a player choice. Paladin defaults to BOSS, Mage and Ranger default to ADDS. While ADDS mode is selected, every companion ignores the boss as long as an engaged non-boss enemy is pressuring the party or a live summon belonging to that boss remains; when none remain, companions automatically return to the boss, and re-prioritize new adds instantly. An explicit BOSS order is absolute until the user changes it or combat fully ends. Manual ADDS is equally authoritative as the mode choice, though its target alternates automatically. A short change between boss-present and adds-only phases is not full disengagement and must not silently reset a manual choice. Do not retune class stats or boss compression to compensate for previously idle companions; audit those topics independently.

#### 29 October 2026 — individually queued fallen-companion recovery

The owner approved selecting fallen companions individually and stacking recovery requests through completed Barracks. A Basic Barracks can queue **up to three** companions; a Full Barracks has **no Barracks-specific queue limit** beyond already owned companions. Town Captains preserve their existing single-request service. Each recovery costs 40 crowns, charges only on successful completion, and retains the chosen companion's ID, name, permanent advancement and active/reserve status. Requests remain in selected order, can be individually cancelled, and survive v4 saves, cross-region travel and Basic-to-Full upgrades. The existing hero availability, engaged-combat safety, completed-source and companion-expedition conditions apply both when queuing and when executing; ineligible requests wait without charging and obsolete requests clear without replacement. Queued wound treatment (30 crowns) remains independent and never revives the fallen; recovery takes payment priority over treatment and recruitment.

#### 21 October 2026 — resource escort and remote recovery

Owner chooses all available idle gatherers per ordinary source order, combat-persistent guidance and normal companion fight/withdraw/resume, with no worker-count selector or static danger veto. Supplies shares orders and immediately unloads whole-company cargo, including resting/fallen. Resource expeditions are Full Barracks only, one chosen living idle Soldier/Ranger/Little Treasurer, earlier region with every specialist rescued, recovering actual remaining tribute automatically once. Initial duration is 300 active seconds following owner concern about a full cycle. Little Treasurer is the only pet eligible for both resource jobs; construction remains Soldier/Ranger work. No new early dungeon fort bonuses.

<a id="heroes"></a>
## Hero classes, progression, input and abilities

Class advancement, specialist prerequisites, input forms, ability targeting, charged skills and dormant systems. Keep player-facing keyboard/touch choices distinct from combat authority.

**Decision intent at a glance:** Hero growth and Discipline Training are different from combat input; normal and charged skill forms share their real cooldowns, with explicit hold/cancel/target rules. Later queue-form decisions modify how inputs behave while cooling down. Sprint remains deliberately unavailable.

### Foundation rules (original baseline wording retained)

#### Specialist rescue and training gates

- Freed specialists never impose hero-level requirements, including for successors. Rescue access, crowns, the instructor curriculum/rank ceiling, equipment tier offered and reforge ownership are the progression gates; advanced services are still not granted automatically.

#### Charged skill holds, targeting and costs

- Charged Skills 1–3 use the same ordinary skill cooldowns rather than hidden secondary cooldowns. A quick tap under 0.20s performs the normal skill; an input held beyond that tap window is treated as a charge attempt, and releasing before the 0.65-second threshold cancels safely without MP or cooldown. Charge input may be held during the remaining ordinary cooldown; WAIT shows until readiness, then charging begins. CHARGED is reserved for a truly releasable action: completed holds instead show NEED MP, NO TARGET or NO HEAL when blocked. Skills 1–2 lock their intended target when charging begins and do not silently retarget to a nearer enemy; invalidated targets cancel without cost. Skill 1 movement auto-attacks remain suppressed while Skill 1 is held. Charged casts still require 20%/30%/35% max MP at release, and cooldown text rounds upward to tenths so a positive cooldown never displays as 0.0s.

#### Skill 1 same-target three-hit combo

- Normal hero Skill 1 uses a same-target three-hit combat combo. Primary damage is 100% / 110% / 120%; hit 3 additionally applies a small frontal finisher for 55% of normal Skill 1 damage to secondary enemies. The chain belongs to the target id, survives up to four seconds between basics, and resets on a target change, timeout, class change or charged Skill 1. While the current combo target remains valid, normal and movement-triggered Skill 1 prefer it rather than silently switching to a nearer add. Paladin, Mage and Ranger keep distinct three-beat visuals; Mage charged Skill 1 is rendered as a short beam and Ranger charged Skill 1 as three rapid focused arrows that split the existing charged damage total.

#### Discipline Training

- The former talent UI is treated as **Discipline Training**, not raw attribute assignment. Four shared disciplines remain—Power Training, Mana Training, Health Training and Movement Training—with caps 5/5/5/3. Their hidden growth budget is redistributed from each class's natural level-1 profile while preserving the original 80-point total: Paladin 7 Power / 2 Mana / 33 HP / 38 movement, Mage 9 / 3 / 27 / 41, Ranger 8 / 2 / 29 / 41. The player sees available training points, each discipline's Rank current/max, and the exact per-rank gameplay effect for the current class. A fresh or migrated hero receives two free complete training resets that cannot be wasted with zero spent points; Neri's 250 crowns reset remains the repeatable paid option afterward. Existing v4 saves preserve allocated ranks and missing HP while adopting class-weighted effects.

#### Sprint remains dormant

- Sprint remains dormant and unavailable; no menu or saved setting enables it. Q may be rebound to another action. Source and activation notes remain explicit.

### Dated decisions and later revisions

#### Player-directed input reset v0.8.82

Joel's current direction supersedes historical contributor requests that forced left-hand exclusivity. Keyboard-only play remains possible; menus, HUD and skills also accept mouse and touch. Bindings are customizable and persist outside the campaign save. The phone defaults to two-thumb controls with an alternate left-hand layout. Optional touch tap-to-move defaults on; optional mouse click-to-move defaults off. Manual directional input takes over immediately, and menus/pause/focus loss cancel travel. Existing navigation and class Skill 1 rules govern pointer movement and autoattack. Squad doctrine, specialist rescue, autoattack, economy and death penalties remain in place. This is a design-attribution correction, not a legal ownership finding.

#### Cooldown queue forms — 21 October 2026

Owner prefers the original small colored numbers and prioritizes reliable form selection over alternative gestures. Use normal tap versus a forgiving hold of at least 0.25s while cooling down; double tap is removed. Repeated quick taps remain normal and incur no double-tap waiting window. Light-blue numbered markers mean normal, gold means charged; button labels also name the form. Retain independent one-shot requests and the actual 0.65s charged preparation after cooldown. Ready-skill tap/hold stays unchanged. No automatic chase or saved queue. See [dev.139](SKILL_QUEUE_FORMS_DEV139.md).

Ranger companion Heal follows the same one-request principle: its button/H command can queue one hero-directed cast during the Ranger's cooldown. Resolve before automatic ally triage, preserve amount/duration/caster cooldown, never redirect the queued request to another ally, and do not spend it on a full/already-covered hero. Transient lifecycle and visible queued feedback follow the hero queue.

<a id="combat"></a>
## Combat balance, bosses, enemy AI and Nightmare

Scaling, targeting permission, damage windows, boss mechanics, warning geometry, retreat, night bonuses and enemy behavior. Read the precedence notes below before changing numeric values.

**Decision intent at a glance:** Actual attack geometry, targeting permission, boss warnings, night scaling and recovery follow approved rules, not visual approximations. The latest recorded ringleader compression decision here is 0.145/0.240; consult the later 20 October section before using the 9 October table.

### Foundation rules (original baseline wording retained)

#### Outdoor ranged enemy stat scaling

- Ordinary outdoor ranged monsters use a separate regional scaling curve rather than the melee curve. Their HP/damage multipliers are 1.05/1.00, 1.10/1.05, 1.20/1.10, 1.35/1.20 and 1.55/1.35 from Vale through Crown. This deliberately keeps ranged enemies weaker than equivalent melee enemies because range, projectile pressure and retreat are part of their power budget, while preventing the late-game ranged roster from falling to roughly half the melee stat line.

#### Protected boss/captain openings

- Protected enemy opening rule: a charged damaging skill whose hold began before that boss (normal/TRUE) or captain (field/room) entered aggro is deflected on contact. Only that illegal charged hit is negated, and delayed Ranger burst hits from the same attack are cancelled; existing aggro, HP damage from companions or ordinary attacks, position, buffs/debuffs and other encounter state remain intact. The same charge is legal when started during that enemy's active encounter, even at 100% HP. Aggro acquired later during a hold never validates a precharge. Ordinary opponents, normal attacks and charged healing keep their behavior. Movement while charging remains unrestricted. Hold receipts are transient and do not change v4 saves.

#### Dungeon TRUE progression and entrance timing

- Dungeon TRUE entitlements appear on reentry, leaving time to rescue captives and prepare. Bosses start away from the entrance and are announced.

#### Boss attack and warning vocabulary

- Four boss slots combine cones, charges, circles, separated patches, projectiles, expanding rings and capped summons. Shared prototype primitives approximate some advanced animation descriptions while retaining readable warnings and safe routes.

### Dated decisions and later revisions

#### Arrival breathing room and tiered soft-knee burst defense · 9 October 2026

For interregional travel, arrive beside the vehicle/dock that actually brought the party, on a navigable rear/outskirts approach rather than in a central settlement square. Ordinary monsters whose spawn homes crowd the immediate landing should be shifted, not deleted or weakened; keep normal aggro, pathfinding, fees, encounter counts, rewards and save compatibility. Maintain the separate fort-placement and structure-proportion review.

Burst protection is a smooth, windowed reduction to **combined** hero-and-companion damage against an individual monster, tiered from ordinary enemies to TRUE bosses. Never impose a hard DPS cap, per-attacker budgets or stealth changes to boss summons/attack geometry. The shared combat resolver owns the transient window and the live `rules.js` table owns tuning; rogue retreat damage protection remains independent. See [TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md](TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md) for the implementation and audit contract.

#### Reassigned burst defense · 9 October 2026

**Superseded in part (ringleaders only):** The later 20 October decision below specifies 0.145/0.240 for ringleaders. The 9 October passage is preserved as an authentic earlier design record, **not** an instruction to reinstate its 0.250/0.375 ringleader values.

Following the stronger compression baseline, **ringleaders inherit the previous captains' 0.25/0.375 curve**, **captains inherit the previous TRUE bosses' 0.145/0.24 curve**, and **TRUE bosses inherit normal bosses' unchanged 0.18/0.275 curve**. Ordinary monsters keep 0.675/0.875 and guardians 0.475/0.625. Knee/tail are both maximum-HP fractions; both parameters move together. Captain burst defense is intentionally stricter than boss defense. Keep the 2-second window, exposed openings, no hard damage cap, enemy summons and all companion targeting mechanics unchanged. Do not merge or release stale branches carrying the now-superseded tier ordering.

#### Crypt Guardian must teach readable boss mechanics without overtaking Thornfang · 9 October 2026

The Crypt Guardian's low relative difficulty is intentional. Before encountering or defeating Thornfang, a Greenwood Vale player with just two companions and basic Skill 1 may discover the Forest Crypt and win an encouraging first boss encounter. This should introduce dodgeable telegraphs and the Guardian's bone sweep, volley, grave call, and draining-ground behavior. **Do not inflate its damage or punish early exploration simply to lengthen the fight**; the desirable review target is sufficient *mechanic readability*, not parity with Thornfang, who remains the true zone boss unlocking Mira's teaching.

The first 7.3-second benchmark was an invalid pre-Thornfang example because it included a third companion and Skill 2. A corrected 12-trial v0.8.109 audit (level 3, only Skill 1, two companions) yielded 10.9–11.7s Paladin, 16.7–39.1s Mage and 16.7–39.5s Ranger, each victorious and exposed to at least three different resolved boss special types. Paladin's short 11s fight remains worth observing for clarity. Preserve this evidence and deferred evaluation in [DEFERRED_ENCOUNTER_TIME_AUDIT.md](DEFERRED_ENCOUNTER_TIME_AUDIT.md). **Mirejaw remains separately flagged for future objective review.** No combat parameters change from this decision.

#### Final v0.9 boss-opening disposition · 10 October 2026

The author explicitly approves **the current combat mechanics** for the two historically disputed boss attacks, superseding old v0.6 prose.

- **Thornfang Pounce:** keep the current **0.375-second** effective post-leap recovery (authored 1.5 s × boss cadence 0.25), whether the leap hits or misses. Do not introduce a 1.5-second miss-only stun, exposed-core state or bonus-damage vulnerability. The written Pounce description is updated; geometry, cooldown rules and balance are unchanged.
- **Stone Colossus Wall Rush:** keep the existing **three-second** exposed-core state whenever the warned charge ends, regardless of contact with walls or historical pillars. The original marked-pillar condition was never wired into the attack; unused old pillar coordinates do not justify recreating arena obstacles. Preserve the v0.8.137 blocked-charge motion fix and all existing damage/geometry behavior.

The discrepancy and historical test evidence remain in [issue #214](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/214). These are **description corrections**, not fresh combat design or rebalance. Future changes to effective recovery should update corresponding numerical text and regression tests.

#### 16 October 2026 — interception and recovery feedback

The director requires roaming bosses to react to valid attacks even when the hit is deflected: stop patrol movement, face combatants through existing facing presentation, and fight. Thornfang and Cindermaw retain the interrupted route/destination in a runtime-only receipt. An ordinary same-zone leash reset returns physically to that interruption point and resumes the itinerary; a valid attack may interrupt that return. Permanent homes, safe town boundaries, damage rules, hostile counts and stationary-boss reset protection remain. Death, zone travel and restored historical encounters retain the established safe physical home-return fallback because the live route receipt is deliberately not a save field. The report of living return-to-town remains unreproduced; the director accepts a clear defeat warning and lethal source/damage/pre-hit-HP event receipt while continuing playtesting.

#### 16 October 2026 · movement basic attacks respect retreat and Recall

Skill 1 fired automatically while moving is covering fire only: it may hit an eligible in-range target, but cannot create a skill-approach order, replace the player's retreat destination or cancel the companions' Recall posture. Keeping a selected target does not authorize pursuit. Deliberate skill presses retain the existing approach-and-release behavior and deliberate offensive attacks may resume companion engagement. No damage, range, cooldown or targeting-selection tuning changes.

#### TRUE night victories, ringleader protection and repeatable Rogue responses · 20 October 2026

**Later ruling for the shared combat chapter:** Use this later decision for TRUE night victories, ringleader protection and Rogue response/reuse behavior, subject to current source verification.

Joel explicitly directs Normal mode to count every first non-final normal and TRUE boss victory, including TRUE field bosses and dungeon TRUE bosses defeated before Awakening. This offsets the pet-unlock incentive to hunt TRUE bosses. Use existing normal/TRUE victory facts; never count repeat kills or duplicate late-Awakening records. Remove Normal's fifteen-point ceiling: ten non-final bosses × two forms yield twenty points and the unchanged formula reaches +70% HP / +55% damage at night. Nightmare counting and the Dark Lord exclusion are preserved; peace still removes the bonus. Existing saves contribute their previously recorded TRUE victories automatically.

Ringleaders now receive the current captain burst curve exactly: knee 0.145 and tail 0.240, superseding their historical 0.250/0.375 curve. Their HP, damage, frenzy, rewards and identities are unchanged. Captains, bosses, ordinary monsters and guardians retain their current curves. The two-second shared window, openings and no-hard-cap rule remain.

Rogue reuse delay is three seconds instead of six when existing eligibility conditions apply. Replace the isolated-enemy once-per-encounter veto with the existing reuse gate, allowing repeat responses to persistent disadvantage. Preserve thinking time, cast warnings, movement/projectile speeds, recovery, threat/pressure requirements, fresh-wound exception, retreat/support logic, Slow's cooldown penalty and encounter cleanup. No general ordinary-monster HP or damage increase is authorized in this batch.

Joel adds area-of-effect enemy support healing to this same update, preserving the current cooldown. Apply the existing per-recipient heal amount/duration/scaling to all eligible recipients inside the existing 350-unit caster-centered range, with one ten-second cooldown. Preserve line of sight, 75% health eligibility, faction restrictions, non-stacking effects and leader self-heal eligibility; authored boss recovery remains separate.

#### Night movement and basic attack tempo · 20 October 2026

Joel revises the proposed small buff to +10% at night, rising with the same non-final normal/TRUE boss counter to +25%. The live rule is `1 + min(0.25, 0.10 + 0.0075 × nightPoints)`: zero / ten / twenty victories yield 1.10× / 1.175× / 1.25×. Apply to enemy combat walking (pursuit, retreat, mobile Rogue casting, support approach and regroup/escape travel) and melee/ranged basic attack cycles. Day and peace use 1×; Nightmare uses its existing nighttime condition.

Keep aim/cast warnings and scripted charge/projectile speeds unchanged. Ranged recovery compensates for its unchanged aiming time so the complete basic shooting cycle receives the intended rate bonus. Healing's 10-second cooldown, Rogue reuse's 3-second cooldown, special/summon clocks, ordinary hero/companion speed, HP/damage multipliers, artwork and rendering remain unchanged. The numerical settings belong in `rules.balance.nightTempo`. No new save fields or new timer loop.

#### Friendly ranged evasion and rescued Neri · 20 October 2026

Owner requires movement-based evasion for friendly ranged auto-attacks and single-target ranged skills, matching hostile arrows. Lock friendly shot direction at launch, resolve contact over each frame segment and expire misses; retain existing damage/effects only on contact. Normal Mage Interrupt/Fracture, Paladin Judgment and ranged single-target pet skills follow this rule too. Preserve authored area/melee geometry and existing cooldown costs. Neri's rescued town service stands openly clear of the Reedport supplier stall; her original artwork remains unchanged.

Pet first skills require no learning. Companion charged second skills already unlock through hero Skill 2 learned from rescued Mira; clarify that existing prerequisite and current unlock state in pet menus. No pet balance/training-cost change. See [scope](NERI_PROJECTILE_PET_20261020.md).

Owner rejects the long blue snowmelt centerline in the reported ravine, then asks to retain the snowmelt idea if drawn properly. Replace the uniform line with a shallow variable-width stream, wet bed, small pools, exposed stones and subtle ripples inside the unchanged channel; retain rocks, banks, crossings and collision geometry.

All pets must visibly announce skill use. Reuse the related bosses' action/material vocabulary at pet scale for both first and charged second skills; visible launch/name cues, charge cues, family-colored ranged trails and truthful contact effects. Keep on-hit effects tied to real hits, existing geometry, reduced-motion/optimization modes and the bounded effect queue.

#### Dreadmaw withdrawal ring — owner decision, 21 October 2026

Dreadmaw deliberately recenters his closing ring on his current position while withdrawing. Terrain can obstruct an opening after the shift; this situational complication is an accepted part of his sneaky retreat tactic. Do not preserve the initial offset anchor or add continuous exit revalidation or a guaranteed reachable escape route for this withdrawal cast. The initial native planner and normal stationary attack remain as implemented. This concerns the enemy withdrawing, independently of the hero’s or companions’ HP.

The current warning follows the same center and gaps used by the resolved closure; keep that readable relationship and existing warning duration, damage, cooldown and terrain rules. This decision accepts the behavior identified as F5 in the dev.142–144 audit; it does not claim that the original code was written with this intention or that every placement is survivable. F5 is closed as accepted behavior, not an outstanding repair. No executable change or new release is required.

<a id="world"></a>
## World geography, regions, structures, transport and dungeons

Authored places, occupied societies, routes, arrival/departure points, dungeon entrances, defended sites and geography. Some subsections also touch combat, art or lore; their original full decision text remains here.

**Decision intent at a glance:** The five inhabited regions retain distinct economies, sites and routes. Restore explicitly approved outward departures; preserve safe arrivals, authored travel access, enemy density, dungeons and save compatibility. Some older regional interpretations remain provisional rather than owner-fixed canon.

### Foundation rules (original baseline wording retained)

#### World regions and authored collision

- Authored water/cliff partitions, bridge gaps, forest clusters and connected roads form five regions. Terrain checks cover every service, captive, entrance, transport stand and boss home.

### Dated decisions and later revisions

#### Ironroot Highlands implementation v0.8.87

The audited handoff establishes Ironroot as the regime's consolidated crown-production province and the Ridge Tyrant as its competent Master of Coin. His argument for the regime rests on circulation, paid work and maintained infrastructure; people need not agree with it. Existing homes, habitats, settlements and Treasury raid rewards remain.

The implementing agent deliberately resolves the handoff's open details as follows: the Stone Colossus is an ancient guardian revealed by older workings, whose territory the regime works around rather than controls; Dara repairs mine equipment under coercion; the Ridge Tyrant's private comfort is supper and a tabletop game by the hearth. Small-scale striking belongs at a Stonecross workbench, with guarded shipping and sealed documents carrying the wider regime connection. The Ridge archers are contracted convoy/payroll escorts using the established archer species and combat behavior. These are implementation choices for Joel to refine during regional playtesting, not claims that the earlier discussion fixed them.

#### Abyss Dragon and air superiority — 8 October 2026

The Abyss Dragon is the Dark Lord’s own purple dragon and personal flying mount. He enjoys flying and chose a dragon matching his preferred clothing colors. Abyss Bastion prepares his air-superiority project: dragon breeding, rider/flight preparation, feeding and supply, and facilities under construction. Air superiority will consolidate his land rule before possible later expansion. Earlier containment/prisoner and autonomous-ally interpretations are superseded. The project is in progress; there is no completed fleet. See `ABYSS_AIR_SUPERIORITY_CANON.md`. Existing fights, anatomy, rescue gates and geometry remain intact. Cindermaw and Dreadmaw keep their existing procedural drawings.

#### Greenwood, Marches and Highlands handoffs v0.8.87

The three audited handoffs supplied by Joel govern these regions. Greenwood stays rural farming woodland: the Forest Crypt is being converted into the Dark Lord's seasonal private estate for himself and trusted friends, with the outsider Guardian acting as trusted caretaker/project overseer. It is unfinished; Dark Crown remains the permanent seat. Borin is valuable for construction craftsmanship, without fixing an exact forced task or a new Guardian biography. Thornfang, Mira, the introductory rescue and creature homes remain independent.

The Marches stay inhabited fishing wetlands. The Keeper is a capable scholar/councillor who proposed specialist capture to hinder heroes, loves fishing and acquired Neri by trading another captive. That trade's participants are unspecified. His old drowning explains the nickname; the Archive's current flooding is an active preservation emergency with an unresolved cause. Neri performs forced restoration in a work area. Mirejaw/Sela and night Wraith phenomena are independent; do not identify them as the trade or the Keeper's servants.

Ironroot stays mountains first. Its established mineral/coin economy supports the regime's crowns; the Ridge Tyrant is a capable Master of Coin. Roads, wages, trade and ordinary homes make the system function while coercion remains. The Treasury is a private residence with retained protected raid caches and an unchanged Wolf protector. Dara belongs in the mine's repair/metallurgy area. The separate Ironroot implementation above records provisional interpretations for her work, Colossus origins and Ridge escorts; they do not change combat or establish those details as earlier user decisions.

These handoffs authorize regional authoring while preserving existing campaign rescue gates, services, boss attacks, normal/TRUE progression and saves. The remaining Greenwood/Marches questions stay open, and Ironroot interpretations remain available for revision. This does not declare all three regions complete.

#### Greenwood flagship selection — 29 October 2026

**New implementation decision — #654, 30 October 2026:** The replacement uses 3200 after comparison of two complete regional concepts and the selected topology at 3200/3400, with fixed art/encounter/economy scale, native land-use/edge and journey measurements, routes and save lifecycle evidence. The new river, districts and perimeter use replace the rejected blueprint. 3200 is a result, not a ceiling inherited from the rollback. The owner additionally approved a focused procedural interior pass: Scornfang's reclamation workplace/private household, the prepared Lifebinder Crypt and occupied Goblin Cellars. His aware skeleton crews came with him, are paid and have reservations/little freedom to refuse the crypt conversion; they were not raised from its graves. No future undead class/neutrality system is implemented. [Implementation, audit and handoff](GREENWOOD_REDESIGN_MASTERPLAN_20261029.md) own the exact evidence; owner first-hour and release approval remain separate.

**Historical selection, superseded:** the owner rejected dev.233's environment and authorized the interim original-layout rollback. [The #644/#654 replacement study](GREENWOOD_REDESIGN_MASTERPLAN_20261029.md) replaces the spatial blueprint, preserves gameplay/progress and compares 3200/3400 without a final dimension choice. The selection below describes the rejected first reconstruction, not a constraint on the new design.

The measured 3200-unit layout is selected over the preserved 2700 baseline and rejected 3400 alternative. The approved 50-decision Piedmont-inspired register governs the working mill and single western pond, staged orchards, separate decorative fruit cellar, both crossings and Scornfang's Treasury. Existing Old Orchard Cellars, Thornfang/Mira, the unfinished estate, six quests, 32 ordinary outdoor enemies and 640 finite outdoor crowns remain. [Authorial register](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md).

#### Structure scale, edge-space and encounter density · 9 October 2026

Joel extends the 150% sprite pre-pass to houses and interior-linked entrances, all trees including the Abandoned Orchard, player-used zone transports, Dark Lord oppressive architecture, and related major world features. Audit proportion and detail; generally consider 25–50% more **object world-space display size** where justified by hero-relative scale. Do not merely enlarge older 100% raster exports. Add readable structural detail through original-master exports/regeneration.

Spatial arrangement must be audited before major asset finalization. Prefer moving buildings and scenery into suitable underused outer-zone space, with decluttering of redundant props, while respecting geography, path access and settlements. Joel authorizes **cautious map-edge expansion only when required** to fit appropriately spaced objects. Prefer the smallest necessary directional extension over globally enlarging a zone. World size affects enemy positions and pathfinding, so **do not dilute monster encounters, create empty traversal or impose new monster production work**. Preserve normal mob counts, authored encounter groups, road access, travel pace, boss/quest anchors and saves unless a measured, separately justified gameplay fix is essential. Test before/after representative routes and encounter gaps, environmental composition, collision, transitions and mobile/desktop readability. See [WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md](WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md).

This records permission and the evaluation procedure, not a claim that map bounds have changed or that the audit has passed.

#### Territorial Monster Forts · 9 October 2026

Joel confirms Monster Forts are defended **ordinary-monster territorial homes**, not capturable forts, additional bosses, tribute strongholds, or player Barracks. Preserve native garrison populations, ordinary rewards and respawns, road/transport access and v4 saves; audit existing strongholds instead of introducing conquest systems. The Wolf hunting ground and Ash-beast roost require local placement correction to keep their established residents and navigable defenses together. See [MONSTER_FORTS_TERRITORIAL_AUDIT.md](MONSTER_FORTS_TERRITORIAL_AUDIT.md).

#### Original outward region transport positions are canon · 9 October 2026

Player correction supersedes the **unintended outbound NPC relocation** in PR #147 (v0.8.105). Restore the merchant wagon departure at the far Greenwood road terminus (2450, 650), the Ironroot Highlands outgoing pack caravan at (3100, 500), and Ashen Frontier's civilian outgoing dragon roost at (3100, 500). They are independent overworld destinations, **not town-service NPCs**. The surrounding established roads and regional dressing matter as part of their locations. Do not move these departures to Millhaven, Stonecross or Emberwatch when changing where the player arrives from another region.

Incoming caravan/wagon landings behind Reedport and Emberwatch, the Stonecross and Reedport ferry piers, Crown route travel hubs and safety clearance all stay in place. Existing saves migrate transport positions, roads and authored environment without undoing defeated monsters, rescues, money, quest state or the v4 schema. This overrides only the mistaken departure move, not the safe-arrival or burst-compression features.

#### 21 October 2026 — defender space and direct workflow (dev.129)

The owner resumed spatial repairs after Treasury recovery, explicitly rejecting broad GitHub checks/reviews and asking for focused quality. Main entrances move toward the corner, the fortified receiving watch waits deeper, and older ranged boss homes sit behind their existing thresholds with summon/body room. Crag and his mounted household archer receive body-clear posts; Crag’s home also retains the existing recovery respawn clearance from arrival. Walls, guard counts, roles, ranges and existing fort bonuses remain. No companion-spreading feature is needed. Crypt/Archive/Mine fort bonuses are still undecided. Specific captain interruption and sunrise/possible sunset flashes remain open, with lighting deferred. Full checklist and evidence: `DEFENDER_SPACE_DEV129.md`.

#### 21 October 2026 — dungeon preparation and leader return rules

Owner requests two entrance choices: enter or build an outside Barracks with recovery selected after construction. Skip repeated prompts for camps requested from this entrance or completed camps genuinely nearby. Apply only to five main dungeons and four Treasuries; side dungeons stay direct/unchanged. Main exits return to their entrance. Unfinished encounters reset on exit/entry. After captain victory, Treasury stays empty for the existing 120-second timer; captain and garrison return together when due/safe. Doors preserve the deadline and collection permission. Main victories/TRUE progression retain their existing rules. Preserve rescued specialists, claimed treasure and death-loss balances. No new fort bonuses or free recovery services.

<a id="narrative"></a>
## Narrative, named characters, lore and Archive writing

Character identity, professional clothing, Archive voice and distinctions between established canon and provisional implementation interpretations. Regional lore is also preserved intact in the world chapter.

**Decision intent at a glance:** Preserve the established identities of specialists and authority figures. Keeper-authored Archive records use his own first-person voice; development directives and implementation disclaimers are not in-world lore. Separate accepted decisions from provisional author interpretations.

### Dated decisions and later revisions

#### Named specialist women · director clarification, 16 October 2026

Mira, Sela, Neri, Dara, Lyss and Vera are women. Their existing regional and professional identities remain. Use recognizably medieval fantasy women's clothing in both captive and rescued appearances: Mira's village kirtle, Sela's hooded travelling gown, Neri's gown and linen work apron, Dara's wool dress with smith's leather apron, Lyss's armored overdress, and Vera's work gown with a substantial smith's apron. Preserve tools, service states, family IDs, colors and collision. This is a consistency correction for these named characters, not a roster expansion or general representation pass. The spoken “Liz” refers to existing Lyss; no character is renamed.

Marshal Veyra, the Ash Sentinel (`citadel`), is also a woman, as explicitly reaffirmed by Joel on 16 October. Her design must visibly reflect this while preserving imposing practical armor, military authority, precise grooming and craftsmanship, the gold helmet ridge, shield, polearm and chest diamond. The Air Marshal Veyrith remains a separate character.

#### Keeper-authored Archive voice · 20 October 2026

The Keeper collected and authored the Archive. Self-history, old-company memories, the Lantern Wraiths' relationship, council records and discoveries he recorded use his first-person voice. Separate Archive prose from shared encounter briefs so development clarification cannot appear as lore. Remove authoring directives, implementation/version-change language, raw internal labels and reward/progression disclaimers from narrative. Preserve legitimate player skill instructions, live numerical figures, established lore and the existing evidence/throne revelation gates. Ledger entries are first-person signed records. No gameplay changes. [Audit](KEEPER_ARCHIVE_COPY_AUDIT_20261020.md).

<a id="visuals"></a>
## Visuals, sprite authorship, camera, terrain and presentation

Rendering-only boundaries, original sprite masters, camera framing, supported layout sizes and visual cues. Old sprite inventory numbers refer to their dated releases.

**Decision intent at a glance:** The accepted 150% framing and original-master sprite workflow guide visual work; world collision, encounter rules and saves must not shift merely to match an image. Historical sprite counts do not describe today's installed manifest.

### Dated decisions and later revisions

#### Procedural canon polish v0.8.79

**Historical inventory:** This era's sprite counts and 'no sprite is active' status do not describe later manifests or current art availability.

Static identity polishing changes drawings only: ten destination entrances, selected meaningful furnishings, individual specialist clothing, regional services and unfinished camp stages. Gameplay/saves/collision remain governed by the existing engine and rules. `GRAPHICS_PROCEDURAL_POLISH_V0879.md` records the scope. The sprite catalog is reconciled to 231 entries (221 GENERATE, 0 ALIAS, 10 KEEP PROCEDURAL), preserving existing IDs and exact runtime keys. No sprite is active.

#### Terrain and effects polish v0.8.80

World-space combat geometry is shared through `rules.combatGeometry` and the separate `combat-visuals.js` presentation module. Its constants preserve the previous hit rules. Circular warnings project world circles; charges and jets use capsules; expanding rings show the actual dangerous band and warn their eventual reach. Ground fills remain below actors, with critical outlines and transient effects above atmosphere. Every main dungeon clips its floor to the exact walkable footprint and draws actual partitions, including legacy dividers and the previously omitted Citadel walls. Terrain materials use stable feathered world patches, continuous collision rims, broken faces and regional route treatment. Recovery events identify their recipients, and normal area abilities/projectile contacts retain class/material identity. No route, position, save schema, damage, cost, cooldown or reward is changed. See `TERRAIN_EFFECTS_POLISH_V0880.md`.

#### Camera framing and supported phones · 8 October 2026

Joel requests camera comparisons at 150% and 175%, retaining 100% as the original baseline. On 9 October, Joel selected 150% as the final standard for desktop and phone. The finalized preference key starts both at 150% while preserving the old comparison preference unchanged for rollback. Players can still choose original 100% or 175% independently for each screen. Camera scale belongs to presentation: world units, simulation timing, collision, target acquisition and attack distances stay authoritative. World drawing, artwork and cues use one camera transform; pointer input uses its inverse. The HTML HUD retains its layout. Desktop and phone remember separate optional camera settings outside campaign saves.

Stop maintaining small-phone layouts: supported phone viewports begin at a short side of 375 CSS pixels and a long side of 800 CSS pixels, including rotation. Release browser coverage exercises that exact minimum, a 393×852 modern phone, 800×375 and 844×390 landscapes, and larger screens. CSS viewport space is distinct from physical panel resolution; a high-density panel does not make a cramped viewport larger. Smaller screens may still open the app but are outside the supported layout matrix; no access block is introduced. Narrow desktop windows keep their desktop identity.

The camera-selection stage initially paused sprite generation, replacement, bulk implementation and additional asset publication pending resumption. Joel resumed that work on 9 October 2026; see the subsequent original-master export decision below. Camera framing is now selected; the native-size artwork targets are recorded in CAMERA_SPRITE_TARGETS.md. This decision does not authorize new artwork or replacements. Preserve all immutable sources, accepted designs, rollback revisions and checkpoints. Test existing artwork first; camera zoom cannot recover detail already discarded in a processed sprite. Judge future art by its actual visible body footprint at the selected zoom and device pixel ratio, not by the transparent canvas dimensions.

#### Original-master exports at 150% · 9 October 2026

Joel authorizes autonomous adaptation and publication of existing sprites, followed by remaining sprites and textures. Fresh 150% exports must start from untouched generator outputs of the accepted revisions. Never enlarge the smaller 100% runtime exports. Verify each original's lineage, dimensions, sizing and placement, including older padded/resized masters. Where an intermediate discarded detail, rebuild directly from the untouched output, preserving only the placement information needed for the new export. Review each replacement in actual game scenes at 150%; simplify or regenerate if its detail still reads poorly. Preserve originals, intermediates, checkpoints and rollback. The agent owns implementation and verification; no further technical approval round is needed.

[SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md) is the detailed policy. This decision records the required approach, not a claim that all assets have been reviewed or released.

<a id="audio"></a>
## Music, sound effects, event coverage and diagnostics

### 31 October 2026 — narrative Defeat cue is a Succession loss cue, not a Normal/Nightmare Game Over

**Owner decision, ready for Phase 7 implementation:** The new `defeat` narrative theme is appropriate at **each actual Succession hero death**, including before the player chooses the next available character, when the only remaining successor is chosen automatically, and when the last available class dies and the run ends. It is **not restricted to a terminal 'game over' flag**. The theme should be bounded and transition back to gameplay/selection context without trapping the player in a full-length song. The precise fade and interruption timing belong to Phase 7 focused routing tests.

**Confirmed current source behavior (implementation NOT YET changed):** `Campaign.die()` emits `death` for normal campaign defeats but sets `challenge.gameOver` and emits `gameOver` only after Succession exhausts all classes. `audio-score.js#describe` and `audio-production.js#productionCue` currently choose the special `defeat` only in that terminal state, not on intermediate Succession deaths. Normal and Nightmare death restores the hero at a refuge/Barracks; Arena returns to its hub. **Do not convert these recoveries into Game Over or infer an ordinary-mode Defeat-music obligation.** Preserve save semantics.

**Related score decisions and consent:** `title` remains the main-title music; `finale` remains a bounded full TRUE Dark Lord / throne / five TRUE dungeon victory global-peace moment with a transformed title motif, not a local boss clear. Its current 12-second audio effect selector and newly authored ~48-second score must be reconciled deliberately in Phase 7, not treated as already working. The owner considered the three Phase 6 compositions **good enough to advance** and requested no more speculative note/palette over-optimization. This is **not** final listening approval. Phase 7 [integration handoff](AUDIO_PHASE7_HANDOFF.md) and soundtrack master [#673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673) are authoritative for technical work; [#699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/699) is the cache-specific sub-risk. Phase 8 listening-room QA and Phase 9 first owner audition/creative acceptance remain unperformed; no merge/deployment is approved.

Musical identity, typed gameplay events, effect routing, report interpretation and message history. See the current audio production and soundtrack-design guides for catalog and implementation.

**Decision intent at a glance:** Original contextual music and event-aware effects preserve each region, encounter and material identity; typed game events remain distinct from transient messages and notices. Use the [current audio production guide](AUDIO_PLAYBACK.md) and manifest to determine the *implemented* recording/fallback system.

### Foundation rules (original baseline wording retained)

#### Original contextual soundtrack

- Current music is an original warm-fantasy virtual-instrument score rendered to local MP3 loops, with dedicated place/peace/night/refuge identities and eleven boss/TRUE pairs. Combat intensity adds synchronized stems. The original Web Audio compositions remain a recovery path. See `AUDIO_SOUND_PASS.md` and `AUDIO_PLAYBACK.md`; the multi-file PWA owns all assets and caches them for offline play.

#### Context-sensitive combat audio

**Implementation evolution note:** The active recorded-effect manifest and source may extend this older Web Audio description; preserve the desired contextual identity and inspect the current code.
- Combat audio is contextual rather than event-name-only. The browser shell passes complete gameplay events into `audio.js`, allowing hero class, companion role, enemy identity and projectile/weapon style to select distinct sound families. The current implementation uses layered Web Audio for compact original SFX, but dedicated files under the multi-file PWA asset pipeline are explicitly allowed whenever they improve quality.

#### Audio event-type coverage contract

- Audio coverage is an engine contract. Every literal `Campaign.event()` type must be recognized by the audio layer as either audible or deliberately silent; regression coverage fails when a new event is added without that decision. Combo finishers, companion specials, beam attacks and material projectile families retain their own identities rather than silently inheriting a generic spell/impact.

### Dated decisions and later revisions

#### 28 October 2026 — internal messages and AI-read playtest reports

**Decision: preserve the existing message and diagnostic systems without changing gameplay, exports, saves or UI.** The owner's priority is completing game features, not polishing a retired status feed. The former persistent black bottom message bar must not return.

The sources serve different purposes:
- `Campaign.say()` in `src/prototype/engine.js` keeps at most **7 session-only, plain-text messages**. Selected menus and interaction failures still consume the last message for short actionable status; the buffer is not disposable dead code. It is not the old visible scrolling log.
- `Campaign.notice()` maintains the separate on-screen notices and up to **60 recent session notices** for Announcements. Quest and discovery narration can also be reconstructed from existing saved facts. This is not the same history as `say()`.
- `Campaign.event()` retains up to **400 typed, game-time-stamped gameplay events** in `s.statistics.events`. The existing `Export playtest report` in `src/prototype/app.js` includes those events, hero/state context, bounded performance/frame/slowdown diagnostics, companion diagnostics, and optional crowd/renderer recordings. It does **not** directly export `game.messages` or `noticeHistory`.

**Rationale:** reports are primarily interpreted by an AI alongside repository source. Structured event types, timing, context and bounded cost measurements support stronger cross-system analysis than seven untimestamped strings. Coincident activity is evidence to investigate, not proof of causality. There is no demonstrated missing diagnostic evidence that would justify exporting the old messages, duplicating them, expanding logging or reintroducing the removed UI. The seven-entry buffer itself is not a credible explanation for the observed performance stalls.

**Revisit only when a real playtest report cannot answer a specific debugging question:** identify the missing observation and instrument its owning subsystem narrowly. Prefer bounded, typed and time-correlated records with clear lifetime and overhead, rather than a free-text feed. Only consider an optional excerpt of internal messages if a concrete bug shows uniquely valuable text absent from structured events; preserve existing menu feedback and the modern Announcements channel. Any such follow-up requires a separately authorized change and appropriate focused tests. This record makes no runtime, export-format, save-schema, PWA, CI or release change.

<a id="saves"></a>
## Save modes, software boundaries and historical release governance

Succession, backups, save compatibility, PWA/application boundaries and cross-system release decisions. The dated Snapshot authorization does not override current owner consent.

**Decision intent at a glance:** Standard and Succession modes retain their distinct persistence semantics; exports remain portable local backups. Current owner authorization, not a dated Community Snapshot approval or waiver, governs implementation, testing and release.

### Shared application and release foundations (historical recorded wording)

Design documents 01–08 define the world, economy, combat, ending and Nightmare rules. Documents 09–10 add execution and audio. Document 11 adds Succession; document 12 records verification. Later specific decisions supersede earlier assumptions.

The expanded shell runs one shared Campaign state. `data.js` carries approved content tables, `engine.js` owns campaign state and combat, `progression.js` owns growth/training/equipment, `save.js` owns serialization/validation/migration, `world.js` owns authored world generation, `navigation.js` owns collision/pathfinding, `renderer.js` owns presentation, `persistence.js` owns browser storage, `platform.js` owns device presentation and `menus.js` owns specialist/expedition menu definitions and actions, `app.js` coordinates controls and shell lifecycle and `audio.js` owns original local music and sound. The legacy implementation remains available independently.

The expanded game is published at the existing GitHub Pages URL; legacy.html retains v0.5. GitHub Pages/PWA is the supported and canonical game target, with assets cached by the service worker after the first connected load. The game is explicitly a multi-file application: JavaScript, CSS, images, audio and future asset types may remain separate files. No feature, test, asset pipeline or release decision may require preserving a self-contained single-HTML build. Historical portable HTML output is optional legacy convenience only and may be incomplete or retired rather than constrain the live game.


### Foundation rules (original baseline wording retained)

#### Succession persistence and reset

- Succession is optional for a fresh Normal or Nightmare run. Crowns, boss facts, prisoners, services, quests, resources, equipment, supplies and party survive. Class, level, XP, learned skills, ranks, discipline-training ranks and temporary buffs reset. Inherited equipment and supplies are an interpretation of retained progress and a playtest tuning point.

#### Portable backups and Succession rewind

- Offline exports are portable backups. Reloading the current Succession run cannot restore fallen classes, while deliberate imports of older exports can rewind it. There is no online anti-cheat service.

### Dated decisions and later revisions

#### v0.7.0 audit fixes

Attack and quest prose no longer drives mechanics. Explicit rule tables define stages, motion, damage, recovery and authored sites. Existing version-4 saves remain compatible, with repaired road/site geometry and safe positions when changed terrain overlaps a saved actor. Legacy v2 exports remain backed up unchanged; their supply values, regional buildings and selectable weapons carry forward. See `AUDIT_FIXES_V070.md` for all 23 findings and the limits of automated acceptance.

#### Community Snapshot after #308 · 15–16 October 2026

**Historical, one-task authorization:** The old no-test/no-PR/publishing restrictions were specific to that dated Snapshot task. Active authorization and testing policy live in [AGENTS.md](../AGENTS.md). Historical scope is reproduced verbatim below.

Owner authorizes a consolidated procedural-art pass, late-game troop improvements, eleven TRUE-boss pets, incoming bug fixes and safe presentation work. No tests/build/browser/CI/PR/deployment until separate final validation authorization. Combat/AI performance is assessment-only. This supersedes earlier workflow requirements to run focused tests during implementation, but preserves every release gate.

Pet ownership derives permanently from existing `s.true`. One individual per canonical boss, free admission through any completed Barracks, standard active slots/reserve and recovery; resting/fallen pets stay in the roster and cannot be dismissed for fresh health. Historical winners need no replay. No summoning, labor, extra party slots or enemy-AI reuse. The existing level, Companion Vitality and Expedition inheritance formulas now also apply to this explicit pet type, superseding the older troop-only scope above without changing prior troop bonuses.

Implementation choices are provisional until final validation: Expedition-4 Power Strike self-protection and retreating Triple Shot Slow; ally-sized, capped pet kits; individually authored procedural miniatures; selective aesthetics within an exhaustive source census. Current enemy AI, hero kits/AV, reward/progression, maps and PWA contracts remain. See the Community implementation, art, balance, performance and validation records; source inspection is not runtime evidence.

The owner requested a source audit before execution, then authorized corrections to all seven findings and a second source audit. The first failed readiness claim is withdrawn in the execution-audit record. Corrections remain within this same branch and the no-execution restriction remains active. Per-design candidates preserve prior evidence as history; the reconciled art review counts drawing contracts/aliases rather than unique assets or visual approvals. Native aesthetic acceptance and actual balance require the later authorized validation cycle.

## Preservation and evidence boundary

**Completeness check:** All 29 baseline rule passages and all 32 prior dated decision bodies appear above once, reorganized under their principal topic. Dated language is kept as evidence, **including** old one-task instructions; the table marks the known supersessions rather than deleting contradictory history.

**Source of historic ordering:** [Previous chronological version at commit f1d23ac](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/f1d23acbf8ff0d11670050cc8c9b11171301ab27/docs/DECISIONS.md). For current implementation use [source owners](ARCHITECTURE.md), [development-state releases](DEVELOPMENT_STATE.md) and feature-specific approved contracts. This rewrite does not claim a gameplay execution test or owner approval for new implementation.
