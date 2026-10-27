# Rogue Bard — review-ready gameplay and balance candidate
**26 October 2026 | design candidate v1 | documentation only | source: main e44ea0ec4b9ed164a85431e972664efda2190da6**

**Read this first when resuming PR #511.** This is a **concrete recommended default**, not a claim that every number/name is owner-approved. The **owner-established** facts and later Succession clarification are recorded separately in the [discussion record](ROGUE_BARD_DISCUSSION_RECORD_20261026.md). [Integration audit](ROGUE_BARD_IMPLEMENTATION_HOUSEKEEPING_20261026.md) maps this candidate to actual code and acceptance. [Visual contract](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md) covers both ordinary and crowned/Dark Lord Rogue.

## 0. What is decided, and what is proposed?

**Owner directions (binding for future design):** female Rogue presented as a guitar-playing bard; disruption/charm/traps over conventional offense, armor or agility; start with zero companions and cannot *hire* Soldiers or Archers; automatic **basic-hit chance** to permanently turn eligible ordinary enemies into recoverable company members; one extra **active** companion slot at campaign start and at corresponding Expedition progression; converted melee use friendly Soldier AI, ranged/healers use friendly Archer AI/support and Alchemist training, with original monster identity and companion growth; boss/captain/Ringleader uncharmable; per-species/variant owned quota counts active/reserve/fallen; true hybrids can defer; two-second one-HP Endure; music/dance personality conveyed using current **static** rendering; no new animation system, extra heavy actors or performance regression. The Rogue gains **+1 percentage point personal crit chance per hero level** as proposed on the follow-up, **without** extra base stats in the passive. A fourth class simply participates in existing dynamic Succession selection. A non-Rogue successor **inherits all already charmed companions** with full identity/recovery rights, but **cannot charm new ones**; no class transition purges or turns them back into enemies.

**Proposals needing owner selection** are explicitly marked **P** below: dormant MP/armor confirmation, purchased talent numbers and guitar range, AoE primary/splash/budget, combo finisher, Charm odds/eligibility details, eight skill names/semantics/tuning, Endure cooldown and end outcome, trap behavior, roster-total cap, cross-class admission, and concrete static visual appearance. Work can be approved in principle after these few policy choices; nothing should silently become a hidden requirement.

## 1. Source-derived baseline stats and level progression (owner correction)

**Owner correction — source-first, October 26:** use the **minimum established base values** from the three current classes, not improvised 'middle' values. Live `src/prototype/rules.js` `R.balance.classes` reads **Paladin HP120/Power18/Armor8/Speed300/MP60; Mage 90/22/3/300/100; Ranger 105/20/5/320/70**. The Mage's **9** is the **Power Discipline bonus per *purchased rank*** in `R.balance.disciplines.profiles.mage.power`, *not* her base Power (22). These two quantities must not be confused. The owner explicitly wants Rogue to be neither tougher, stronger nor faster than the established heroes: choose existing **minimum HP90, Power18 and Speed300** as the Rogue's foundation, with minimal Armor3 as the consistent weak-defense recommendation. Dormant MP60 is the existing minimum and **P**, because active combat currently does not spend MP. These are **before** equipment, purchased Discipline Training and any future PR #509 passives. Natural HP remains +25 per level after L1.

| Stat | Rogue proposed at L1 (before gear/talents) | Why |
|---|---:|---|
| HP | **90** | Exactly current Mage's base HP, lowest of the three; owner-directed minimum |
| MP | **60** (P) | Existing Paladin minimum; dormant resource compatibility only |
| Power | **18** | Exactly current Paladin's base Power, lowest of the three; owner-directed minimum |
| Armor | **3** (P) | Exactly current Mage's base Armor, lowest of the three; favors fragile trickster identity |
| Speed | **300** | Matches current Paladin/Mage base Speed, lowest of the three; owner-directed minimum |
| Hero natural HP at L15 | **440** | 90 + 14 × 25, excluding equipment/Discipline; **no passive HP gain** |
| Level-up system | **unchanged** | XP/discipline point/natural HP are the existing common mechanics |

**P: purchased Discipline Training, NOT base stats or innate passive.** To minimize novel balancing, borrow the **smallest existing per-rank Discipline value** in each category: Power **+7** (Paladin), Mana **+2** (Paladin/Ranger), HP **+27** (Mage), Speed **+38** (Paladin), at the **existing rank limits**. Never treat the Mage's +9/Power rank as Mage's level-1 starting Power. This is a training proposal only and should be reviewed alongside the separate draft #509 class passives and standard +25 natural HP growth. It grants Rogue no bonus rank, unique training type, additional movement or hidden attack damage.

**Cross-PR dependency:** [Draft #509](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/509) establishes that class passives count **once at level 1 and once per later hero level**, derived from class + level rather than permanently incremented saved stats. Rogue should use the same framework when #509 is implemented/merged. Paladin +5 HP and +0.01 armor effectiveness/level, Mage +2 Power/level, Ranger +3 speed and +1pp CDR/level are **other-PR plans, not changes authorized by PR #511**.

### Rogue innate passive: “Sharp Tongue” + “Too Shameless to Die” (P name/implementation split)

**Owner-concept part 1 — sharp critic:** +**1 percentage point** of **personal hero critical probability for each hero level**, **including level 1**, no Power/HP/Armor/Speed/CDR increase. A single class passive can present two effects: innate critic growth and the original 2-second Endure. Do **not** invent two separate level tracks, buttons, trainer unlocks, perk counters, or additional stat pools. Endure's time remains exactly **2.0s** at every level; it does not scale with level. The only per-level component is critical chance.

At the current 10% critical base and up to 5 Codices × 1pp, **proposed Rogue critical probability** is

\`critChance(hero)=clamp(0.10 + 0.01*hero.level + 0.01*codicesOwned, 0, 1)\`;

the Codex term remains capped to **0.05**. **Only source 'hero' uses the Rogue level bonus.** Charmed companions, Soldiers, Archers, pets, other-class successors and hostile world actions retain existing own sources, Codex inheritance, and separate RNG.

| Hero level | Rogue personal crit, 0 Codices | Rogue crit, all 5 Codices | Other-class hero with all 5 Codices (without #509's noncrit passives) |
|---:|---:|---:|---:|
| 1 | 11% | 16% | 15% |
| 2 | 12% | 17% | 15% |
| 5 | 15% | 20% | 15% |
| 10 | 20% | 25% | 15% |
| 15 | **25%** | **30%** | 15% |
| 18 | 28% | 33% | 15% |
| 20 | 30% | 35% | 15% |

No cap is chosen beyond current global [0,1] probability safety. Actual hero-level ceiling and later balance may warrant an explicit finite maximum. Do not assume level 15 is a hard game cap.

**Owner-concept part 2 — Endure:** a lethal hit leaves her at 1 HP for **2.0 seconds**, preventing HP from dropping below 1 during that bounded window. **P:** 90-second internal cooldown (same source as hero combat time, no additional full buff system). **P:** when the window expires, survive only if HP has actually been restored above 1 by ordinary legal healing; otherwise complete normal death **once**. No permanent immunity or damage avoidance outside that 1 HP floor; all interrupt/status consequences still apply. Whether the effect should keep her alive unconditionally at 1 HP after two seconds is **an owner choice**, not a settled fact. Crit chance continues functioning while Endure is active. L1 onset grants both passive features automatically, consistent with #509 convention. No Endure cooldown shortening per level; avoids an ever-safer late Rogue.

**Implementation gate:** hook lethal damage exactly once through shared hero HP-loss routes (ordinary hits, projectiles, hazards, poison/periodic and premitigated boss impacts), reset/serialize a minimal timer or reconcile pause/load, and prove automatic potion/Succession/death penalty do not double-fire. No substitute generic invulnerability flag.

## 2. Weapon and ordinary automatic attack (P)

The guitar **is** her weapon. She does not need a second dagger or an animated melee stance to justify it: an aggressive, short-range acoustic attack is thematically clear, and the same static guitar silhouette can be held for every frame. She can visually *thump* with it at point-blank proximity without a separate melee mode; mechanically **one midrange attack type**, not a hybrid stance-switching engine.

**P: “Barbed Riff” — unique AoE automatic basic (musical movement name, not a new mechanic).**
- A **single instant short cone/pulse** based at Rogue's current position and aimed toward one legitimate target, **260 world-unit maximum range** (vs current Paladin near-melee, Mage ~400, Ranger ~450 default). No persistent projectile actor per basic, no raymarch/trail or moving sound ring.
- One direct primary target takes **0.80 × (Power + 12)** multiplied by the current basic combo step; at most **2 additional** valid hostile targets in the cone each take **0.25 × that primary damage**. Maximum **3 total contacts** per basic. Reuse real LOS, walls, proximity, encounter safeguards, selected target and deterministic target ordering. Sample budget initial half-angle **0.5 radians** (~57-degree whole cone), subject to native camera/geometry check.
- Use the **existing automatic basic 0.85s base interval** (reduced only by already-authorized training/passives, if applicable) and existing Skill-1-ranked damage scaling. No attack-rate bonus, channel, new targeting mode or mana resource.
- One original **hero/rogue/auto** critical release decision on a legal attack, and one shared receipt for primary and all splash. Current critical intensity remains **1.08× damage at intensity 1**, 1.20× at intensity 2, 1.40× at intensity 3. Never roll crit once per AoE target or apply a critical bonus to Charm probability. AoE damage and spell feedback may differ from one target to another because of mitigation/LOS, but critical choice is shared.
- **Charm attempts only on the designated primary** **after a real successful nonlethal landed hit**, never on splash victims, DOT ticks, combo finisher's extra targets, trap ticks, delayed echoes or critical VFX. No charm on miss, target killed by that hit, leader, neutral or forbidden spawn. Avoid “crit kills it and charm recruits the corpse.”
- One attack per eligible auto tick; not several mini-projectiles. The Rogue's AoE normal basic identity persists from level 1 onward, while other heroes' *every-third-hit* finishers stay untouched.
- Tap Skill 1 uses the existing explicit 3-second family and normal separate tap cooldown but is a focused louder Riff, not a second independent automatic Charm roll disguised as an auto hit; charged Skill 1 shares established 0.65s hold. **P:** permit Charm on the normal Skill-1 direct primary only **if owner considers it a basic hit**; default conservative admission: Charm is exclusively on auto basics to avoid disproportionate charming from charged area effects.

### Rogue's 3-hit combo finisher (P)

Use current \`nextBasicCombo()\` tracking by legal primary target (same 4s combo reset and steps 1/2/3). On every third successful primary contact, perform **“Rattling Crescendo”**:
- Keep ordinary 3-target direct AoE.
- Extend the **single third-hit cone** to reach up to **two additional** enemies (5 total including primary), within **300 units**, short wider arc (**half-angle 0.75 rad**). These extra finisher-only victims take at most **0.20 × pre-combo primary**; apply a **0.75 second brief Slow** to at most **4 secondary** victims, respecting control immunities. Avoid secondary charm and do not insert new hostile actions.
- The initial primary crit receipt governs all **damage**. The control applies normally, independently of critical outcome. **P:** not a hard interrupt, as frequent third-hit interrupts combined with Skill 3 could permanently suppress bosses; preserve Rogue's better specialist interruption through Skill 3 instead.
- Crit lever for auto is \`damage\`, not \`slowDuration\`; *do not give both critical buffs from one action*. Cap fan-out; unlike the current uncapped sibling finisher \`basicComboFinisher\` secondary scan, choose a deterministic bounded maximum.

This lets the Rogue feel distinctive at the keyboard without high DPS by default: her AoE exists on **every** automatic hit but the low multiplier, short distance, contact cap and lack of multi-target Charm limit its strength.

### Simple paper damage sanity check (not balance proof)

At **real-source-minimum L1 Power 18**, `Power+12=30` (current basic formula). Candidate Rogue auto: **24 primary** (0.80 × 30), **6 per splash** (0.25 × 24), **36** across three fully legal targets before combo, armor and context; against **one** target it deals only **24**. For reference, the existing plain L1 no-gear attack's pre-combo raw `Power+12` values at base are **Paladin 30 / Mage 34 / Ranger 32** (their hit geometry and projectile timing differ). Rogue's one-target **24** is clearly inferior even to lowest-Power Paladin's **30**; crowd-total **36** can exceed a single hit but is capped by nearby targets/LOS and is **not** 36 damage to one enemy. At 11% L1 crit and native intensity-1 **+8% damage on a critical action**, expected Rogue primary damage is **24 × (1+0.11×0.08)=24.2112** before mitigation/other effects—not a 2× critical. These values are arithmetic, **not** observed DPS/encounter balance. With **zero companions at creation** while all three existing classes currently start with Soldier+Archer, low stats create a genuine early-game survival/charm-acquisition risk, even though Rogue later fields +1. Never declare L1 balance solved by simply copying stat minima.

## 3. Charm acquisition and company economy (P tuning, owner direction intact)

**P opening point estimate:** **12% chance per legitimate surviving primary auto-basic hit** if there is at least one legal company slot; **one** attempt per attack. This is deliberately not tied to critical chance, books, level, enemy rank, or other skill effects initially. Independent draw from ordinary attack randomness is needed to avoid perturbing world RNG; select a compatible isolated stream after the native RNG architecture review.

| Successful eligible basic hits | Chance of at least one conversion at 12% (independent trials) | Elapsed basic cadence at 0.85s/hit, excluding approach/miss |
|---:|---:|---:|
| 1 | 12% | ~0.85 s |
| 5 | ~47% | ~4.25 s |
| 8 | ~64% | ~6.8 s |
| 12 | ~78% | ~10.2 s |
| 18 | ~90% | ~15.3 s |

**Critical L1 caveat:** Rogue starts with **no** Soldier or Archer whereas Paladin/Mage/Ranger currently start with **both**; a weaker-stat Rogue can be severely **underpowered** rather than overpowered at creation. The 12% per-hit table **conditions on successful surviving eligible hits**, not attempted attacks, missed hits, dead enemies or how many hits an ordinary early opponent can survive; a target taking 24 before mitigation may die in only a few hits and never convert. The ~47% probability after five hits requires five valid opportunities (possibly across several enemies), not a 47% chance to recruit a given fragile opponent. The first iteration must test opening viability and pacing across actual starter enemies with legal hit counts, enemy pressure and potion survival. If untenable, present owner-approved early Charm probability/pity/first-capture solutions or carefully scoped tutorial mechanics **without raising Rogue HP, Power or Speed and without granting starting mercenaries**. The 12% global rate is **not approved** as final. Elite/rare species should primarily be controlled by eligibility rather than huge chance modifiers.

**Owner eligibility:** exclude bosses, captains, Ringleaders; true hybrids deferred; ordinary melee/ranged/healer allowed. **P tighter safety defaults:** exclude temporary summons, scripted quest gate enemies, neutral actors, NPCs, special reset-bound entities and any model that cannot be assigned a safe companion melee/ranged role. Preserve their ordinary kill rewards/quests only on actual death; Charm alone does **not** pay gold, XP, quest kill credit, Codices or victory. Converted monsters remain visibly their own species.

**One Rogue extra active slot:** current non-Rogue Expedition caps by rank 1–6 are **2,3,3,4,5,6**; Rogue proposed **3,4,4,5,6,7**. Basic Barracks ordinary cap remains min(3, Expedition); Rogue's proposed Basic cap = **min(3, ordinary Expedition cap)+1** (3 / 4 / 4 / 4 / 4 / 4). Full Barracks = ordinary Expedition cap+1. This is class-specific; no other cap changes. **P first version:** successful Charm when active is full may add a legal reserve if the species and total roster limits permit; clearly tell the player where they went, otherwise fail without rolling. This avoids overfilling active on a successful conversion.

**Species ownership:** owner cap includes active+reserve+fallen copies, for each canonical **species+combat subtype** (Goblin Slinger ≠ plain Goblin melee). It equals Rogue's effective current Expedition active cap. The exact canonical key must derive from authenticated source data (species, ranged/healer flag / def ID), not player labels. **P aggregate guard:** hard total **12 permanently charmed monsters across active+reserve+fallen**, regardless of number of species. Boss pets remain under the normal unique pet collection. This is a proposed low-cost reserve policy rather than the current defensive save bound of 200. Compare 8/12/16 in roster usability before approval. A surviving charmed monster never duplicates by changing regions, dismiss/recruit, recovery or save/reload. Dismissing a resting charmed monster frees the species/aggregate quota.

**Companion species stats:** initial recommendation: keep **source species and subtype identity**, visual shape, original baseline HP/damage profile, and friendly role; do **not** copy live wounded HP as permanently reduced max HP or preserve hostile region/night/TRUE difficulty factors. At conversion map its base species values into a **bounded, companion-compatible progression profile** (candidate multipliers 0.85–1.15 vs melee/ranged friendly baseline), preserve current health fraction after normalized conversion (no free heal), and apply shared level/Vitality/Training/Alchemist rules thereafter. **Explicit owner unresolved choice:** she originally asked to “retain their original stats” yet also “adapt to companion formulas.” Do not finalize the normalization coefficients without showing actual enemy species baseline distributions. Ranged/healer unit uses Archer's normal healing/cooldown on friendly team, not a second hostile healing loop.

### Succession — owner clarification, settled

Succession remains mechanically the **same existing four-choice-after-registration class cycle**: the list of remaining heroes already comes from all registered classes. **No new succession subsystem, no alternate lives logic.** Only inaccurate copy (“three classes”) and class dispatch need adjustment.

On a Rogue → Paladin/Mage/Ranger transition, **every existing charmed monster remains owned**, preserving species, status, individuality, death/recovery and eligibility to return to the field. The successor has **no new Charm** ability. This is a recruitment-right difference, **not an ownership restriction**. Don't delete/disband creatures or turn them hostile. **P safe active capacity normalization:** if the old Rogue party exceeds successor's ordinary capacity, move only the necessary number of living/active actors **to reserve** in a deterministic order without injuring/dismissing anyone; no additional cost. Keep *all* charmed creatures in the Barracks roster even if their count is now above the lower non-Rogue per-species active cap. The species quota gates only **new Rogue captures**; inherited ownership is grandfathered. A later new Rogue successor can charm again subject to the current cap; do not discard inherited friends. **P symmetric policy:** a Rogue inheriting conventional Soldiers/Archers from prior-class Succession may command/recover them but cannot newly hire more. The owner has approved **charmed ownership inheritance** explicitly; conventional-troop inheritance is a natural consistency proposal for review.

### Owner-directed naming style — musical composition and dance titles (27 October 2026)

**Approved direction, not approved final words:** ability titles should sound like a **dance step, dance form, musical passage, movement, or original composition**, and intuitively foreshadow the enemy consequence. This is more specific than inserting the words *bard*, *dance*, *song* or *attack* into a generic action name. Pair each tap with a **larger, more forceful charged musical movement**; name severity should correspond to actual scope/duration. Examples: *Dragging Waltz* drags enemy movement; *Broken Cadence* breaks a cast; *Stolen Tempo* delays skill recovery; *The Silencing Coda* briefly silences victims. Names can be theatrical and slightly impudent without losing readability at small button sizes.

**Candidate automatic basic**: *Barbed Riff* (short aimed guitar-wave fan, normal primary Charm check). **Candidate every-third-hit finisher**: *Rattling Crescendo* (wider bounded fan and secondary Slow). These are distinct from manually cast Skill 1, and names do not authorize additional hits or Charm rolls.

**Naming invariants:** all eight normal and eight charged names are proposals only. They do **not** modify the already drafted effects, critical levers, target caps, range, cooldowns or passive. The character's performance is conveyed by short existing-style effect cues and a **static guitar-carrying character**, not animated dance moves. UI, audio cue names and bilingual names are later implementation details, not new mechanical systems.

## 4. Eight skills + charged forms: conservative candidate (P, NOT canon)

Existing eight slots and current hold/training/cooldown framework remain. Shared base tap cooldowns slots 1–8: **3, 3, 8, 14, 9, 4, 15, 24 seconds** in current cooldown-only Skill-1 form; charged slot 1 has a class-specific value (P Rogue **8s**); charged slots 2–8 remain **6,20,20,18,12,25,40 seconds**. Existing training reductions apply as they already do. All powers derive from Rogue's lower Power, Skill Rank 1–8 scale and existing capped mechanics, not a new stat growth system.

| Slot | Normal / tap (P) | Charged / hold (P) | Critical lever (tap / charged) | Complexity / boundary |
|---|---|---|---|---|
| **1 Staccato Sting** | Focused short **single target** Riff, slight direct-damage emphasis; same auto-basic family | **Fortissimo Crescendo**: widened immediate cone, max **4 contacts**, no Charm fan-out | **damage / damage** | Reuse Skill 1 casting and one action receipt; no projectiles or multi-proc |
| **2 Dragging Waltz** | Short Slow, ~1.5s, on valid target | **Largo in Chains**: short Slow affecting up to **3** within a compact area, ~2.2s | **slowDuration / slowDuration** | Reuse existing Slow; avoid freezing boss telegraphs |
| **3 Broken Cadence** | Focused spell/cast interruption plus small bounded cooldown debt; meant to be **more reliable for target spell denial** than Mage normal interrupt | **Fugue of Discord**: interrupt up to **3 eligible active casters** in narrow area, with shorter Silence than Mage's dedicated broad field | **cooldownDebt / silenceDuration** | Specific action ownership; keep boss/captain interlock and immunities; do not interrupt a completed/released attack |
| **4 Withering Lament** | One target: modest damage-over-time + brief incoming-healing reduction | **Requiem of Rot**: up to **3** enemies suffer milder spread of same effects | **damage / damage** (*initial actual hit only*) | **Complex:** new anti-heal/DoT statuses require all real healing paths and bounded ticks; no crit reroll per DOT tick |
| **5 Snaring Tango** | Place a short-duration **slow** trap | **Thornstep Tarantella**: place a short-duration **damage** trap with small Slow | **slowDuration / damage** | Max **2 active placed traps**, expire around 10s, enemy only, no projectile actors; one crit roll on placement and receipt travels to lawful trigger |
| **6 Stolen Tempo** | Adds ~1.0–1.5s to a target's **not-ready skill** cooldown | **Rondo of Lost Time**: up to **3** legal foes gain smaller capped cooldown debt | **cooldownDebt / cooldownDebt** | Do not start ready cooldowns; boss caps; share existing Slow/debt rules |
| **7 Reeling Rondo** | Modest single-target pushback and brief Weaken | **Panic Polka**: short forward cone pushback and Weaken, max **4** | **pushDistance / pushDistance** | Reuse existing collision-safe push; NO AI decoy or summon implied |
| **8 Rhapsody of Ruin** | Up to **4** targets in a wide but finite fan: controlled damage + disruption | **The Silencing Coda**: up to **6** targets suffer louder capped damage and very brief Silence/debt, not a boss-room lockdown | **damage / silenceDuration** | Existing spatial effects, cap, ordered targeting and one crit receipt |

**Critical variance contract:** There are exactly **17 new hero critical keys**: \`hero/rogue/auto\`, and \`hero/rogue/{1..8}-{tap,charged}\`. Every form registers **one** supported existing lever from \`critical-levels.js\` (damage 1.08/1.20/1.40 at levels 1/2/3; slow +0.20/+0.50/+1.00s; cooldown debt +0.20/+0.50/+0.90s; silence +0.15/+0.35/+0.65s; push ×1.08/×1.18/×1.30). Critical percentages raise **probability**, not critical effect multiplier. A multi-target or delayed skill uses one immutable cast/placement receipt and only strengthens the listed original consequence. A crit must never increase Charm probability, add a trap, create a summon, alter projectile count, target eligibility or bypass control immunity. Register equivalent \`troop/soldier\` / \`troop/archer\` keys for charmed role behaviors only if the friendly-role adapter uses those same legal troop attacks; do not silently invent a new class of independent companion critical chances.

**Why these 8?** They cover your specific annoying battlefield mechanics with **existing** abilities where possible. A separate AI summon is **not** in this low-performance-risk first candidate: owner's “I can summon too” idea remains genuine but unresolved, and could replace Skill 7 if a cheap, deterministic non-AI approach is agreed. This is a deferred design decision, not silent omission.

**Ability budget:** at least Skills 4 and 5 need genuine new bounded target-state/scene state, while 2/3/6/7 mostly reuse existing methods. Skill 8 should reuse a single short-lived effect dispatch; don't generate multiple ambient emitters. Trap disarm is a built-in class interaction separate from slots; exact duration/permanence remains P.

## 5. Quantitative balance questions and acceptance

1. **Solo opening, mandatory L1 balance gate:** simulate at least 20 seeded early Greenwood encounters across actual ordinary HP/attack values, report number of lawful surviving primary hits **per enemy before death**, probability and elapsed time of obtaining first Charm, deaths/potions, quest progress and first three recruits. Compare Rogue's zero starting companions/90 HP/18 Power against existing three classes' 2 starting companions and their real base stats (also PR #509 passives if later merged). If RNG means the first ally is often unobtainable before death, recommend a targeted *owner-approved* Charm-onboarding rule, never hidden inflated base attributes or free starting Soldiers/Archers.
2. **Single-target boss:** Rogue's lower single-target auto-DPS must be helped by her companions and utility; compare boss warning survival, effective interrupt fractions and duration to Paladin/Mage/Ranger with matched gear, ranks, Codices and same **active** companion counts, then with Rogue's legitimate +1. No permastun, summon bypass or boss-heal nullification.
3. **AoE crowd:** up to 3 contacts per auto and at most 5 on finisher; verify total damage amplification, target hits, control uptime and FPS on 1/2/3/6/12 enemies. A short-range AoE is an interesting class distinction but must not become infinite area DPS.
4. **Critical frequency:** 10% base vs Rogue levels, five Codices, levels 1/5/10/15/18 and critical intensity 1/2/3. Actual native action receipts must be one per automatic attack, not per splash victim or Charm.
5. **Company scaling:** field 0/1/3/5/7 active as caps permit, mixed melee/ranged/healers/pets; compare existing Soldier/Archer AI costs and new charmed role stats/healing. Verify reserve of 12, per-species quota and Fallen states do not schedule AI.
6. **Succession:** four classes in dynamic choice, ordered deaths, classes exhausted, transfer of owned charmed company, class capacity normalization, same-ID recovery, no Charm under a non-Rogue, lawful Charm after returning to a Rogue when possible.
7. **PvE counterplay:** benchmark healer enemies and captains, authored boss cast windows, existing Rogue enemy counters, anti-heal paths, native arena warning shapes. Effective debuff uptime should be bounded with explicit boss resistance rather than blindly stacking slots 2–8.
8. **Performance:** compare ordinary and Rogue 3-/6-/7-member combat cases in Canvas and opt-in Pixi; no animation loops, sprite allocations per hit, duplicate companion AI, uncontrolled temporary entities, or O(N-monsters × N-reserves) per-frame charm scans.

**This is a strong design default for owner review, not acceptance evidence.** Approval later should fix the limited open knobs (stats, range/AoE, charm chance and roster-total cap, Endure outcome/CD, skill kit, summon disposition and appearance). Implement only after that checkpoint.
