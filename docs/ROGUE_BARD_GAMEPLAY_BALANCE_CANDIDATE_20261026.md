# Rogue Bard — review-ready gameplay and balance candidate
**26 October 2026 | design candidate v1 | documentation only | source: main e44ea0ec4b9ed164a85431e972664efda2190da6**

**Read this first when resuming PR #511.** This is a **concrete recommended default**, not a claim that every number/name is owner-approved. The **owner-established** facts and later Succession clarification are recorded separately in the [discussion record](ROGUE_BARD_DISCUSSION_RECORD_20261026.md). [Integration audit](ROGUE_BARD_IMPLEMENTATION_HOUSEKEEPING_20261026.md) maps this candidate to actual code and acceptance. [Visual contract](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md) covers both ordinary and crowned/Dark Lord Rogue.

## 0. What is decided, and what is proposed?

**Owner directions (binding for future design):** female Rogue presented as a guitar-playing bard; disruption/charm/traps over conventional offense, armor or agility; start with zero companions and cannot *hire* Soldiers or Archers; automatic **basic-hit chance** to permanently turn eligible ordinary enemies into recoverable company members; one extra **active** companion slot at campaign start and at corresponding Expedition progression; converted melee use friendly Soldier AI, ranged/healers use friendly Archer AI/support and Alchemist training, with original monster identity and companion growth; boss/captain/Ringleader uncharmable; per-species/variant owned quota counts active/reserve/fallen; true hybrids can defer; two-second one-HP Endure; music/dance personality conveyed using current **static** rendering; no new animation system, extra heavy actors or performance regression. The Rogue gains **+1 percentage point personal crit chance per hero level** as proposed on the follow-up, **without** extra base stats in the passive. A fourth class simply participates in existing dynamic Succession selection. A non-Rogue successor **inherits all already charmed companions** with full identity/recovery rights, but **cannot charm new ones**; no class transition purges or turns them back into enemies.

**Proposals needing owner selection** are explicitly marked **P** below: exact base stats and guitar range, AoE primary/splash/budget, combo finisher, Charm odds/eligibility details, eight skill names/semantics/tuning, Endure cooldown and end outcome, trap behavior, roster-total cap, cross-class admission, and concrete static visual appearance. Work can be approved in principle after these few policy choices; nothing should silently become a hidden requirement.

## 1. Baseline stats and level progression (P)

Current live base classes in src/prototype/rules.js: Paladin (HP120, MP60, Power18, Armor8, Speed300), Mage (90,100,22,3,300), Ranger (105,70,20,5,320). Current natural HP gain +25 per level after level 1. Mana combat is currently dormant; keep a valid mana baseline for compatibility.

| Stat | Rogue proposed at L1 (before gear/talents) | Why |
|---|---:|---|
| HP | **100** | Mage-like squishiness, not the Paladin tank |
| MP | **70** | Data compatibility only; not a new mana spend system |
| Power | **19** | Below Mage/Ranger, not a burst specialist |
| Armor | **4** | Below Ranger and far below Paladin |
| Speed | **300** | Equal Mage/Paladin, below Ranger; no evasion/dodge engine |
| Hero natural HP at L15 | **450** | 100 + 14 x 25; **no passive HP gain** |
| Level-up system | **unchanged** | XP/discipline point/natural HP are the existing common mechanics |

**P:** new Rogue discipline increment profile **power +7, mana +2, HP +28, speed +38** at the same existing talent rank ceilings. These are the existing-like *purchasable talent training* values, not a second passive; slightly weaker damage growth than Mage and no Ranger-speed niche. The owner can choose other figures after the matched simulation; no alternative talent tree.

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

**P: “Rude Riff” — unique AoE automatic basic.**
- A **single instant short cone/pulse** based at Rogue's current position and aimed toward one legitimate target, **260 world-unit maximum range** (vs current Paladin near-melee, Mage ~400, Ranger ~450 default). No persistent projectile actor per basic, no raymarch/trail or moving sound ring.
- One direct primary target takes **0.80 × (Power + 12)** multiplied by the current basic combo step; at most **2 additional** valid hostile targets in the cone each take **0.25 × that primary damage**. Maximum **3 total contacts** per basic. Reuse real LOS, walls, proximity, encounter safeguards, selected target and deterministic target ordering. Sample budget initial half-angle **0.5 radians** (~57-degree whole cone), subject to native camera/geometry check.
- Use the **existing automatic basic 0.85s base interval** (reduced only by already-authorized training/passives, if applicable) and existing Skill-1-ranked damage scaling. No attack-rate bonus, channel, new targeting mode or mana resource.
- One original **hero/rogue/auto** critical release decision on a legal attack, and one shared receipt for primary and all splash. Current critical intensity remains **1.08× damage at intensity 1**, 1.20× at intensity 2, 1.40× at intensity 3. Never roll crit once per AoE target or apply a critical bonus to Charm probability. AoE damage and spell feedback may differ from one target to another because of mitigation/LOS, but critical choice is shared.
- **Charm attempts only on the designated primary** **after a real successful nonlethal landed hit**, never on splash victims, DOT ticks, combo finisher's extra targets, trap ticks, delayed echoes or critical VFX. No charm on miss, target killed by that hit, leader, neutral or forbidden spawn. Avoid “crit kills it and charm recruits the corpse.”
- One attack per eligible auto tick; not several mini-projectiles. The Rogue's AoE normal basic identity persists from level 1 onward, while other heroes' *every-third-hit* finishers stay untouched.
- Tap Skill 1 uses the existing explicit 3-second family and normal separate tap cooldown but is a focused louder Riff, not a second independent automatic Charm roll disguised as an auto hit; charged Skill 1 shares established 0.65s hold. **P:** permit Charm on the normal Skill-1 direct primary only **if owner considers it a basic hit**; default conservative admission: Charm is exclusively on auto basics to avoid disproportionate charming from charged area effects.

### Rogue's 3-hit combo finisher (P)

Use current \`nextBasicCombo()\` tracking by legal primary target (same 4s combo reset and steps 1/2/3). On every third successful primary contact, perform **“Full Chorus”**:
- Keep ordinary 3-target direct AoE.
- Extend the **single third-hit cone** to reach up to **two additional** enemies (5 total including primary), within **300 units**, short wider arc (**half-angle 0.75 rad**). These extra finisher-only victims take at most **0.20 × pre-combo primary**; apply a **0.75 second brief Slow** to at most **4 secondary** victims, respecting control immunities. Avoid secondary charm and do not insert new hostile actions.
- The initial primary crit receipt governs all **damage**. The control applies normally, independently of critical outcome. **P:** not a hard interrupt, as frequent third-hit interrupts combined with Skill 3 could permanently suppress bosses; preserve Rogue's better specialist interruption through Skill 3 instead.
- Crit lever for auto is \`damage\`, not \`slowDuration\`; *do not give both critical buffs from one action*. Cap fan-out; unlike the current uncapped sibling finisher \`basicComboFinisher\` secondary scan, choose a deterministic bounded maximum.

This lets the Rogue feel distinctive at the keyboard without high DPS by default: her AoE exists on **every** automatic hit but the low multiplier, short distance, contact cap and lack of multi-target Charm limit its strength.

### Simple paper damage sanity check (not balance proof)

With L1 Power 19 and no gear/skills/talents, reference \`Power+12=31\`. Proposed Rogue basic: **24.8 primary**, **6.2 per splash**, **37.2** total across three fully legal targets before combo/armor; a single enemy takes just **24.8**, deliberately less than the baseline 31 of a same-Power unmodified attack. Level-1 Rogue crit at 11% and Level-1 intensity +8% imply mean primary **24.8 × (1+0.11×0.08)=25.02** before enemy defenses, not 24.8×2. Critical chance growth boosts expectations modestly without substituting for the Mage's damage scaling. With two companions to recruit, survival and company benefits matter far more than raw Rogue output. This is arithmetic only; actual projectile/contact geometry, DPS, party dynamics and boss fights require matched executable benchmarks later.

## 3. Charm acquisition and company economy (P tuning, owner direction intact)

**P opening point estimate:** **12% chance per legitimate surviving primary auto-basic hit** if there is at least one legal company slot; **one** attempt per attack. This is deliberately not tied to critical chance, books, level, enemy rank, or other skill effects initially. Independent draw from ordinary attack randomness is needed to avoid perturbing world RNG; select a compatible isolated stream after the native RNG architecture review.

| Successful eligible basic hits | Chance of at least one conversion at 12% (independent trials) | Elapsed basic cadence at 0.85s/hit, excluding approach/miss |
|---:|---:|---:|
| 1 | 12% | ~0.85 s |
| 5 | ~47% | ~4.25 s |
| 8 | ~64% | ~6.8 s |
| 12 | ~78% | ~10.2 s |
| 18 | ~90% | ~15.3 s |

These are **not** evidence of playable opening balance. If the Rogue consistently dies before getting one companion, prefer a bounded first-recruit safeguard/encounter tuning rather than uncapped Charm chance or adding free starting mercenaries. Such a safeguard was **not** requested by the owner and needs specific approval. Elite/rare species should be controlled primarily by eligibility (not huge chance multipliers) initially.

**Owner eligibility:** exclude bosses, captains, Ringleaders; true hybrids deferred; ordinary melee/ranged/healer allowed. **P tighter safety defaults:** exclude temporary summons, scripted quest gate enemies, neutral actors, NPCs, special reset-bound entities and any model that cannot be assigned a safe companion melee/ranged role. Preserve their ordinary kill rewards/quests only on actual death; Charm alone does **not** pay gold, XP, quest kill credit, Codices or victory. Converted monsters remain visibly their own species.

**One Rogue extra active slot:** current non-Rogue Expedition caps by rank 1–6 are **2,3,3,4,5,6**; Rogue proposed **3,4,4,5,6,7**. Basic Barracks ordinary cap remains min(3, Expedition); Rogue's proposed Basic cap = **min(3, ordinary Expedition cap)+1** (3 / 4 / 4 / 4 / 4 / 4). Full Barracks = ordinary Expedition cap+1. This is class-specific; no other cap changes. **P first version:** successful Charm when active is full may add a legal reserve if the species and total roster limits permit; clearly tell the player where they went, otherwise fail without rolling. This avoids overfilling active on a successful conversion.

**Species ownership:** owner cap includes active+reserve+fallen copies, for each canonical **species+combat subtype** (Goblin Slinger ≠ plain Goblin melee). It equals Rogue's effective current Expedition active cap. The exact canonical key must derive from authenticated source data (species, ranged/healer flag / def ID), not player labels. **P aggregate guard:** hard total **12 permanently charmed monsters across active+reserve+fallen**, regardless of number of species. Boss pets remain under the normal unique pet collection. This is a proposed low-cost reserve policy rather than the current defensive save bound of 200. Compare 8/12/16 in roster usability before approval. A surviving charmed monster never duplicates by changing regions, dismiss/recruit, recovery or save/reload. Dismissing a resting charmed monster frees the species/aggregate quota.

**Companion species stats:** initial recommendation: keep **source species and subtype identity**, visual shape, original baseline HP/damage profile, and friendly role; do **not** copy live wounded HP as permanently reduced max HP or preserve hostile region/night/TRUE difficulty factors. At conversion map its base species values into a **bounded, companion-compatible progression profile** (candidate multipliers 0.85–1.15 vs melee/ranged friendly baseline), preserve current health fraction after normalized conversion (no free heal), and apply shared level/Vitality/Training/Alchemist rules thereafter. **Explicit owner unresolved choice:** she originally asked to “retain their original stats” yet also “adapt to companion formulas.” Do not finalize the normalization coefficients without showing actual enemy species baseline distributions. Ranged/healer unit uses Archer's normal healing/cooldown on friendly team, not a second hostile healing loop.

### Succession — owner clarification, settled

Succession remains mechanically the **same existing four-choice-after-registration class cycle**: the list of remaining heroes already comes from all registered classes. **No new succession subsystem, no alternate lives logic.** Only inaccurate copy (“three classes”) and class dispatch need adjustment.

On a Rogue → Paladin/Mage/Ranger transition, **every existing charmed monster remains owned**, preserving species, status, individuality, death/recovery and eligibility to return to the field. The successor has **no new Charm** ability. This is a recruitment-right difference, **not an ownership restriction**. Don't delete/disband creatures or turn them hostile. **P safe active capacity normalization:** if the old Rogue party exceeds successor's ordinary capacity, move only the necessary number of living/active actors **to reserve** in a deterministic order without injuring/dismissing anyone; no additional cost. Keep *all* charmed creatures in the Barracks roster even if their count is now above the lower non-Rogue per-species active cap. The species quota gates only **new Rogue captures**; inherited ownership is grandfathered. A later new Rogue successor can charm again subject to the current cap; do not discard inherited friends. **P symmetric policy:** a Rogue inheriting conventional Soldiers/Archers from prior-class Succession may command/recover them but cannot newly hire more. The owner has approved **charmed ownership inheritance** explicitly; conventional-troop inheritance is a natural consistency proposal for review.

## 4. Eight skills + charged forms: conservative candidate (P, NOT canon)

Existing eight slots and current hold/training/cooldown framework remain. Shared base tap cooldowns slots 1–8: **3, 3, 8, 14, 9, 4, 15, 24 seconds** in current cooldown-only Skill-1 form; charged slot 1 has a class-specific value (P Rogue **8s**); charged slots 2–8 remain **6,20,20,18,12,25,40 seconds**. Existing training reductions apply as they already do. All powers derive from Rogue's lower Power, Skill Rank 1–8 scale and existing capped mechanics, not a new stat growth system.

| Slot | Normal / tap (P) | Charged / hold (P) | Critical lever (tap / charged) | Complexity / boundary |
|---|---|---|---|---|
| **1 Cutting Chord** | Focused short **single target** Riff, slight direct-damage emphasis; same auto-basic family | **Clashing Chorus**: widened immediate cone, max **4 contacts**, no Charm fan-out | **damage / damage** | Reuse Skill 1 casting and one action receipt; no projectiles or multi-proc |
| **2 Off-Key Waltz** | Short Slow, ~1.5s, on valid target | Short Slow affecting up to **3** within a compact area, ~2.2s | **slowDuration / slowDuration** | Reuse existing Slow; avoid freezing boss telegraphs |
| **3 Heckler's Note** | Focused spell/cast interruption plus small bounded cooldown debt; meant to be **more reliable for target spell denial** than Mage normal interrupt | **Dissonant Heckle**: interrupt up to **3 eligible active casters** in narrow area, with shorter Silence than Mage's dedicated broad field | **cooldownDebt / silenceDuration** | Specific action ownership; keep boss/captain interlock and immunities; do not interrupt a completed/released attack |
| **4 Rotten Serenade** | One target: modest damage-over-time + brief incoming-healing reduction | Up to **3** enemies: milder spread of same effects | **damage / damage** (*initial actual hit only*) | **Complex:** new anti-heal/DoT statuses require all real healing paths and bounded ticks; no crit reroll per DOT tick |
| **5 Tripwire Tango** | Place a short-duration **slow** trap | Place a short-duration **damage** trap with small Slow | **slowDuration / damage** | Max **2 active placed traps**, expire around 10s, enemy only, no projectile actors; one crit roll on placement and receipt travels to lawful trigger |
| **6 Sabotage Verse** | Adds ~1.0–1.5s to a target's **not-ready skill** cooldown | Up to **3** legal foes gain smaller capped cooldown debt | **cooldownDebt / cooldownDebt** | Do not start ready cooldowns; boss caps; share existing Slow/debt rules |
| **7 Stage Fright** | Modest single-target pushback and brief Weaken | Short forward cone pushback and Weaken, max **4** | **pushDistance / pushDistance** | Reuse existing collision-safe push; NO AI decoy or summon implied |
| **8 Grand Finale** | Up to **4** targets in a wide but finite fan: controlled damage + disruption | Up to **6** targets: louder capped damage and very brief Silence/debt, not a boss-room lockdown | **damage / silenceDuration** | Existing spatial effects, cap, ordered targeting and one crit receipt |

**Critical variance contract:** There are exactly **17 new hero critical keys**: \`hero/rogue/auto\`, and \`hero/rogue/{1..8}-{tap,charged}\`. Every form registers **one** supported existing lever from \`critical-levels.js\` (damage 1.08/1.20/1.40 at levels 1/2/3; slow +0.20/+0.50/+1.00s; cooldown debt +0.20/+0.50/+0.90s; silence +0.15/+0.35/+0.65s; push ×1.08/×1.18/×1.30). Critical percentages raise **probability**, not critical effect multiplier. A multi-target or delayed skill uses one immutable cast/placement receipt and only strengthens the listed original consequence. A crit must never increase Charm probability, add a trap, create a summon, alter projectile count, target eligibility or bypass control immunity. Register equivalent \`troop/soldier\` / \`troop/archer\` keys for charmed role behaviors only if the friendly-role adapter uses those same legal troop attacks; do not silently invent a new class of independent companion critical chances.

**Why these 8?** They cover your specific annoying battlefield mechanics with **existing** abilities where possible. A separate AI summon is **not** in this low-performance-risk first candidate: owner's “I can summon too” idea remains genuine but unresolved, and could replace Skill 7 if a cheap, deterministic non-AI approach is agreed. This is a deferred design decision, not silent omission.

**Ability budget:** at least Skills 4 and 5 need genuine new bounded target-state/scene state, while 2/3/6/7 mostly reuse existing methods. Skill 8 should reuse a single short-lived effect dispatch; don't generate multiple ambient emitters. Trap disarm is a built-in class interaction separate from slots; exact duration/permanence remains P.

## 5. Quantitative balance questions and acceptance

1. **Solo opening:** sample at least 20 seeded early Greenwood encounters (several legal enemy species), compare death rate, elapsed time to first Charm, first 3 companions, cost/XP, potion availability and ability to finish an early quest. If opening routinely depends on lucky Charm, design a narrow fix, not more free stats.
2. **Single-target boss:** Rogue's lower single-target auto-DPS must be helped by her companions and utility; compare boss warning survival, effective interrupt fractions and duration to Paladin/Mage/Ranger with matched gear, ranks, Codices and same **active** companion counts, then with Rogue's legitimate +1. No permastun, summon bypass or boss-heal nullification.
3. **AoE crowd:** up to 3 contacts per auto and at most 5 on finisher; verify total damage amplification, target hits, control uptime and FPS on 1/2/3/6/12 enemies. A short-range AoE is an interesting class distinction but must not become infinite area DPS.
4. **Critical frequency:** 10% base vs Rogue levels, five Codices, levels 1/5/10/15/18 and critical intensity 1/2/3. Actual native action receipts must be one per automatic attack, not per splash victim or Charm.
5. **Company scaling:** field 0/1/3/5/7 active as caps permit, mixed melee/ranged/healers/pets; compare existing Soldier/Archer AI costs and new charmed role stats/healing. Verify reserve of 12, per-species quota and Fallen states do not schedule AI.
6. **Succession:** four classes in dynamic choice, ordered deaths, classes exhausted, transfer of owned charmed company, class capacity normalization, same-ID recovery, no Charm under a non-Rogue, lawful Charm after returning to a Rogue when possible.
7. **PvE counterplay:** benchmark healer enemies and captains, authored boss cast windows, existing Rogue enemy counters, anti-heal paths, native arena warning shapes. Effective debuff uptime should be bounded with explicit boss resistance rather than blindly stacking slots 2–8.
8. **Performance:** compare ordinary and Rogue 3-/6-/7-member combat cases in Canvas and opt-in Pixi; no animation loops, sprite allocations per hit, duplicate companion AI, uncontrolled temporary entities, or O(N-monsters × N-reserves) per-frame charm scans.

**This is a strong design default for owner review, not acceptance evidence.** Approval later should fix the limited open knobs (stats, range/AoE, charm chance and roster-total cap, Endure outcome/CD, skill kit, summon disposition and appearance). Implement only after that checkpoint.
