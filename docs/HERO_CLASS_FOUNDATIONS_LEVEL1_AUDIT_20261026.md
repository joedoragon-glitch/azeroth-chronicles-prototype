# Hero class foundations: historical audit and level-1 design gate
**Date:** 26 October 2026  
**Status:** DRAFT / owner-specified initial passive concepts and level-up rates for all three classes; design documented, gameplay not implemented, still subject to integration and balance tests  
**Owner decision (latest):** Preserve existing base stats, gear, and skill/training systems. Add one class-bound passive per hero, **active immediately from level 1**, with another equal increment for each subsequent level. Paladin gains HP and Armor effectiveness; Ranger gains movement speed and cooldown reduction; Mage gains Power alone. Earlier level-2-start guidance is superseded.

## Owner-approved starting convention for passive DESIGN — active at level 1

**LATEST CLARIFICATION: All three class passives apply an initial bonus from the very start, at level 1.** Every subsequent level adds another increment. Hero level itself counts the number of passive increments; natural +25 HP growth still counts actual level-ups using `level - 1`. This supersedes an earlier discussion proposing zero passive bonus until level 2.

| Class | Bonus per level, **including level 1** | Level 1 total passive | Level 15 total passive |
| --- | --- | --- | --- |
| Paladin — Fortitude | +5 maximum HP; +0.01 Armor effectiveness per Armor point | **+5 HP**, 0.36 coefficient (0.35 default + 0.01) | **+75 HP**, 0.50 coefficient |
| Ranger — Agility | +3 movement speed; +1 percentage point cooldown reduction | **+3 speed**, **1% passive CDR** | **+45 speed**, **15% passive CDR** |
| Mage — Arcane Power | +2 Power; **no** cooldown/HP/speed bonus | **+2 Power**, resulting base+passive Power 24 | **+30 Power**, resulting base+passive Power 52 |

**One consistent derived-value model, not yet implemented:**

```js
const ticks = hero.level; // valid hero levels start at 1
const hpPassive = hero.class === 'paladin' ? 5 * ticks : 0;
const armorEffectiveness =
  0.35 + (hero.class === 'paladin' ? 0.01 * ticks : 0);
const speedPassive = hero.class === 'ranger' ? 3 * ticks : 0;
const cooldownPassive = hero.class === 'ranger' ? 0.01 * ticks : 0;
const powerPassive = hero.class === 'mage' ? 2 * ticks : 0;
```

| Hero level | Paladin bonus HP / coefficient | Ranger speed bonus / CDR | Mage Power bonus |
| --- | --- | --- | --- |
| 1 | +5 / 0.36 | +3 / 1% | +2 |
| 2 | +10 / 0.37 | +6 / 2% | +4 |
| 5 | +25 / 0.40 | +15 / 5% | +10 |
| 10 | +50 / 0.45 | +30 / 10% | +20 |
| 15 | +75 / 0.50 | +45 / 15% | +30 |
| 18 | +90 / 0.53 | +54 / 18% | +36 |

The user's original **Mage +30 Power at level 15** and **Paladin Armor coefficient 0.50 at level 15** now align with this clarified convention. Neither Mage/Ranger nor companions receive Paladin's Armor coefficient. Existing class bases, equipment, talent and skill values stay unchanged. **This PR is documentation-only** and is not gameplay approval or deployment; Ranger cooldown stacking/coverage/cap and save/companion integration remain to be resolved.

## Direction update — October 26, 2026: innate-passive architecture (historical pivot)

The owner proposed a **simpler alternative** after the initial historical audit: instead of rewriting starting attributes, item progression or natural growth, retain those existing systems and add **one identity-defining passive to each hero class**. Each passive should be present because of the hero's class and should **grow automatically with hero level**. This is the **current preferred investigation path**, superseding the earlier plan to begin by editing the base-stat table.

**Design invariants**
- Exactly **one class-identity passive per hero class**; no new player-facing skill slot, action, rank, trainer, unlock, resource, keybinding, or progression currency.
- A class passive is a **separate innate modifier**, *not* a new active/charged skill or a change to the existing skill system.
- Keep the current `R.balance.classes` starting numbers **unchanged as the historical foundation**, at least for the first candidate. The class passive contributes a distinct derived bonus on top.
- **All passives start at level 1**, granting one increment at creation and another each level thereafter. Owner design values: Paladin +5 maximum HP / +0.01 Armor effectiveness per hero level; Ranger +3 speed / +1 percentage point cooldown reduction per hero level; Mage +2 Power per hero level. Use hero `level` as the passive-increment count, not `level-1`.
- Leave the shared natural +25 HP per level, all tier prices/bonuses, reforges, Discipline Training, MP resource mode, class skill definitions and combat rules unchanged. **Do not alter skill files to deliver the passives** if a safe isolated integration exists.
- No new dodge, evasion, crit, extra-projectile, independent attack-speed or attack-range system as the default. These are potential complexity traps and **not currently authorized**. Ranger passive cooldown reduction is now explicitly eligible for design, but its magnitude, scope (which cooldowns) and stacking/cap policy remain unapproved.
- Prefer a **single, deterministic, centralized, class-and-level-based calculation** over serialized passive state, ticking buffs, ad-hoc level-up mutations, or scattered conditionals. This is a proposed architecture to validate against the actual code, *not* an implementation commitment.
- A passive may indirectly change downstream damage or survivability when it modifies a stat. In particular, **Mage bonus Power changes effective damage for existing Power-based skills even if no skill value or formula changes**. That indirect effect must be measured and presented for approval; do not pretend it is fully isolated from gameplay.

**Illustrative passive roles (names/effects are exploratory, not approved)**
| Class | Concept | Lowest-disruption effect family to assess | Avoid by default |
| --- | --- | --- | --- |
| Paladin | Fortitude / Endurance | Derived max HP **or** Armor bonus scaling with level; choose after save/damage audit | New shield skill, stacking damage immunities, combat-triggered heal |
| Mage | Arcane Power / Attunement | **+2 Power per level, including level 1** (L1 +2; L15 +30) | Any cooldown, movement, HP, or skill coefficient changes |
| Ranger | Agility / Fleetfoot | **+3 movement speed and +1 percentage point CDR per level**, including level 1; independent of talents | Dodge engine, projectile rewrites, range/skill coefficient changes; unbounded cooldown stacking |

The examples intentionally use already-existing character properties first. **Nothing in this table is an approved new ability or stat number.** If Ranger movement alone proves insufficient for a noticeable agility identity, discuss *why* before considering a broader mechanic.

**Important technical questions, to verify before implementing:**
1. Which derived-stat accessors and HUD/save paths should expose each bonus? HP is a special case: max HP / current HP / saves / level-up / Succession / new starts must remain consistent.
2. Should level-1 passives already grant a bonus, or should the bonus begin only after gaining a level? Owner intent is differentiation *from the beginning*; do not accidentally defer all benefits to level 2.
3. How can a level-based passive avoid double application on load, stat reset, inheritance or leveling? Favor derivation over stored accumulation where feasible.
4. How does Mage's Power passive affect existing Skill 1/basic and Skills 2–8 **without changing any skill definition**? Test these consequences explicitly.
5. Does Ranger movement speed cause navigation, kiting, collision or enemy pursuit issues? Focused comparisons are necessary before tuning.
6. Can the addition be made without touching existing progression, skill-system or save-schema behavior? If not, stop for a separate approval.

**Change control:** This direction replaces the *proposed means* (retuning base attributes) but retains the *goal* and all skill-system exclusions. The historical findings and baseline tables below remain true. Sections describing a stat-table-first roadmap are retained only as history and are explicitly superseded by the revised pickup steps below.

### Ranger Agility passive — active at level 1; +3 movement speed and +1 percentage point CDR per hero level

**Latest rule:** at level 1 gain +3 movement speed and 1% innate cooldown reduction; each subsequent hero level adds +3 speed and +1 percentage point CDR. No extra talent rank, skill, or resource. Existing Ranger movement Discipline Training still gives **+41 speed per rank**, maximum **3 ranks** (+123). Existing cooldown training still gives **4% per rank**, maximum **5 ranks** (+20%). Base movement speed remains **320**.

The owner arrived at +3 from the rounded notional fourth movement talent rank (~42 / 15 ≈ 2.8). Ranger's original maximum speed from starting speed plus three talent ranks is **443**, not 483. Its level-15 passive plus three talents gives **488**.

```js
const rangerSpeedBonus = hero.class === 'ranger' ? 3 * hero.level : 0;
const rangerCdrBonus = hero.class === 'ranger' ? 0.01 * hero.level : 0;
```

| Level | Passive speed | Base + passive speed | With 3 speed talent ranks | Innate CDR | With 5 CDR ranks (20%) if additive |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | +3 | 323 | 446 | 1% | 21% |
| 2 | +6 | 326 | 449 | 2% | 22% |
| 5 | +15 | 335 | 458 | 5% | 25% |
| 10 | +30 | 350 | 473 | 10% | 30% |
| 15 | +45 | 365 | 488 | 15% | 35% |
| 18 | +54 | 374 | 497 | 18% | 38% |
| 20 | +60 | 380 | 503 | 20% | 40% |

**CDR stacking remains an explicit design decision:** additive is only the table's example. At level 15, 35% combined would reduce a 0.85-second automatic basic interval to **0.5525 seconds** *if* basics are in scope, versus **0.68 seconds** at five talent ranks alone. Determine whether the passive includes normal skills, charged cooldowns and automatic basics, and what cap/floor is safe at higher levels; do not invent one. Keep Skill 1–8 rules, damage, ranks, costs, trainer gates and base cooldown constants untouched.

Use the same existing effective hero cooldown calculations in `hero-combat.js::skillCooldown()` and `::basicSkillCooldown()`; do not build a parallel skill system. Hero speed is currently calculated from `h.speed + heroTalentSpeedBonus()` in multiple movement branches in `engine.js`; route innate speed consistently through a derived effective-speed accessor. Do **not** accidentally grant Ranger passive speed to companions via existing Shared Training talent inheritance. Test starting stats, L2/L5/L15 scaling, other-class invariance, kiting, pathing, save/load, Succession and high-level CDR extremes.

### Ranger Discipline Training audit — verified baseline before designing the new passive

The user clarified that **Ranger agility should mean not only movement speed, but also more frequent actions through class-intrinsic cooldown reduction beyond the existing talent investment**. This updates the earlier movement-only suggestion and should be treated as a focused exception to the earlier total cooldown-freeze wording.

Current `main` values:
- `R.balance.classes.ranger.speed = 320`, compared with Paladin/Mage `300`.
- `R.balance.disciplines.profiles.ranger.speed = 41` speed points **per rank** in the existing movement training slot (index 3).
- `R.balance.disciplines.maxRanks = [5,5,5,3]`: movement training **max rank 3**, so Ranger movement from base plus this training, without other effects, is rank 0 = **320**, rank 1 = **361**, rank 2 = **402**, rank 3 = **443** (+123; +38.4375% from Ranger base).
- Paladin's equivalent movement training is **+38 per rank**, Mage's **+41 per rank**, each max rank **3**. Thus Ranger currently does **not** receive a uniquely higher movement *per talent rank* than Mage.
- Talent slot index 1 (currently mana/cooldown training) has **max rank 5** for *all classes*. With mana disabled, `R.cooldownBalance.reductionPerTalentRank = 0.04`, giving **4% per rank, 20% at five ranks**; calculated by `hero-combat.js::skillCooldown` and `::basicSkillCooldown`. Ranger has no separate class-based cooldown-reduction growth in those calculations.
- Normal automatic basic interval is `0.85s` before training; five cooldown ranks yield `0.85 * (1 - 5*0.04) = 0.68s`. These are the baseline formula durations, not guaranteed attack throughput or observed combat cadence.

**Explicit new design requirement:** allow the Ranger's proposed level-scaling innate passive to provide cooldown reduction **without spending additional talent points and without increasing the existing talent's max rank**. The passive should also support stronger mobility. We must decide whether the passive cooldown discount covers **ordinary cooldowns, automatic basic attacks, charged cooldowns, or some subset**: the current shared talent reduces all three, but that does not automatically establish the intended Ranger passive scope.

**Stacking/cap is undecided and material.** Compare additive vs multiplicative combination with the existing talent and identify an explicit maximum and minimum cooldown floor, if needed; quantify combined effect at zero/full training and L1/L5/L10. Avoid introducing faster cooldown recovery timers, double reductions on load, action-loop problems, or cooldown bypasses. Do not change any existing cooldown constants, skill rank values, training cap, or instructor progression. A narrow integration point in the existing effective-cooldown calculation **may** be necessary; if so, it is permitted only after explicit owner approval and with focused tests, **not** a license to refactor the skill system.

**Source:** `src/prototype/rules.js` class/discipline/cooldown configuration, `src/prototype/progression.js` `heroTalentSpeedBonus()` and `talent()`, `src/prototype/engine.js` movement computation, `src/prototype/hero-combat.js` `skillCooldown()` and `basicSkillCooldown()`.

### Architectural decision — one Armor formula, configurable effectiveness (owner clarification, October 26)

**Explicit direction:** Do **not** implement a special Paladin damage-received formula alongside the ordinary formula. Replace the hard-coded literal `0.35` with a **named, configurable, default Armor-effectiveness value**, and have **every relevant Armor-mitigation calculation read the current value for its target**. The Paladin's innate passive contributes to **that value**, not to a second mitigation branch.

**Conceptual API (not executable production code and not a final choice of constant ownership):**

```js
const DEFAULT_ARMOR_EFFECTIVENESS = 0.35;

function armorEffectivenessFor(target) {
  const paladinPassiveIncrements =
    target === hero && target.class === 'paladin'
      ? target.level
      : 0;
  return DEFAULT_ARMOR_EFFECTIVENESS + 0.01 * paladinPassiveIncrements;
}

// ONE existing normal-hit mitigation formula, all classes and party units:
const damageAfterArmor = Math.max(
  3,
  incomingDamage - armorPoints * armorEffectivenessFor(target),
);
```

This is **one parameterized mitigation rule**, not separate Paladin and non-Paladin damage formulas. The `0.01` level modifier is the current *tentative* design; `0.35` remains the shared default until an authorized implementation introduces the configured parameter. The passive can be expressed as a read-only, per-character *effective value* derived from class/level, without incrementing a shared global or persisting a mutable total every level-up. Treating the value as one process-wide mutable setting would erroneously buff Mage, Ranger or companions after a Paladin levels.

**One source of truth:** Current ordinary hits in `src/prototype/combat.js::hitParty()` subtract `armor*0.35`. A boss `src/prototype/boss-combat.js` special premitigates a **single** source hit with `0.35` before splitting it into three already-mitigated ticks. Both paths must read the **same target-specific effectiveness value**, respecting when Armor applies, and avoiding double application on already-mitigated hits. This is not authorization to rewrite boss skills or alter any raw damage coefficients.

**Other guarantees:** Do not alter Armor point values or equipment progress; keep the `Math.max(3,...)` ordinary-hit floor, existing ward/Shield Stance ordering, and non-Paladin values intact. Favor tests that assert `0.35` for Mage/Ranger/companions at all levels; Paladin's proposed level-derived value; both ordinary and one-time boss premitigation; no double application; no shared mutable leakage; and accurate results after save load/Succession. This architectural clarification is approved as the design direction; **the numeric passive candidate still awaits explicit gameplay-change approval**.

### Paladin Fortitude passive — +5 HP / +0.01 per-point Armor effectiveness from level 1

**Latest rule:** immediately at level 1, gain **+5 max HP** and **+0.01 Armor effectiveness**. Each further hero level adds the same amounts. The owner derived +5 HP from two hypothetical +33-HP talent ranks (66 / 15 ≈ 4.4, rounded to 5). This is separate from the unchanged +25 natural HP per **actual level-up**, and the unchanged +33 HP per trained talent rank.

The one common Armor-mitigation formula reads the target's effective Armor coefficient, default **0.35**. Paladin's class-specific value is **0.35 + 0.01 × hero level** (0.36 at level 1, 0.50 at level 15). It is not extra Armor, a percentage ward, or an alternate Paladin damage formula.

```js
const levelUps = Math.max(0, hero.level - 1); // natural shared HP growth
const hpPassive = hero.class === 'paladin' ? 5 * hero.level : 0;
const naturalMaxHp = classBaseHp + 25 * levelUps + hpPassive;
const effectiveArmorCoefficient =
  0.35 + (hero.class === 'paladin' ? 0.01 * hero.level : 0);
// One damage formula: Math.max(3, rawDamage - armor * effectivenessFor(target))
```

| Level | Original natural Paladin HP | Passive HP | Natural HP including passive | Effective Armor coefficient |
| --- | ---: | ---: | ---: | ---: |
| 1 | 120 | +5 | 125 | 0.36 |
| 2 | 145 | +10 | 155 | 0.37 |
| 5 | 220 | +25 | 245 | 0.40 |
| 10 | 345 | +50 | 395 | 0.45 |
| 15 | 470 | +75 | 545 | 0.50 |
| 16 | 495 | +80 | 575 | 0.51 |
| 18 | 545 | +90 | 635 | 0.53 |
| 20 | 595 | +100 | 695 | 0.55 |

At tier-4 armor with its reforge Paladin has 39 Armor; on an illustrative 30-damage normal hit, current 0.35 coefficient yields **16.35** damage received, while proposed level-15 0.50 yields **10.50**. Minimum normal-hit damage remains 3. This illustrates why we need a focused difficulty check and not unlimited stacking by accident.

**Integration and compatibility:** `combat.js::hitParty()` and the `boss-combat.js` premultiplied Vortex/Death Roll calculation must use the **same** target-specific Armor effectiveness parameter. Boss ticks already mitigated must never be reduced again. `heroNaturalMaxHp()` must recognize innate Paladin HP, preventing accidental classification as Shared Strength companion-inheritable `heroOtherHpBonus()`. Verify L1 creation, saved max/current HP, rest, tonic, training resets, Succession, old-save handling, and companions. No skill/value changes or unrelated combat rewrites are authorized.

### Paladin Discipline Training and non-skill defensive audit — verified current baseline

**Paladin HP via Discipline Training:** `R.balance.disciplines.profiles.paladin.hp = 33`, `maxRanks[2] = 5`. One invested HP rank gives **+33 maximum HP and +33 current HP**. At maximum five ranks this totals **+165 max HP**. Against a purely hypothetical level-1 baseline (not an attainable five-rank level-1 training claim), 120 starting HP becomes 153 / 186 / 219 / 252 / 285 at ranks 1–5. Leveling also gives a *separate*, class-neutral **+25 maximum HP per hero level**.

**Paladin Armor does not increase through Discipline Training:** the four talents are Power, dormant MP/cooldown, HP, and movement. The base Paladin armor value is **8**. Native armor equipment tiers add **0 / 5 / 12 / 20 / 28** Armor at tiers 0–4; reforging the *currently owned* armor tier adds **+3 Armor**. Assuming no other modifiers:

| Armor tier | Total armor without reforge | Total armor with reforge | Flat mitigation before minimum-hit floor |
| --- | ---: | ---: | --- |
| 0 (starter) | 8 | n/a | 8 × 0.35 = **2.80** |
| 1 | 13 | 16 | **4.55** / **5.60** |
| 2 | 20 | 23 | **7.00** / **8.05** |
| 3 | 28 | 31 | **9.80** / **10.85** |
| 4 | 36 | 39 | **12.60** / **13.65** |

**Actual incoming-hit rule:** for ordinary unmitigated hits, `Math.max(3, incomingDamage - this.armor() * 0.35)`, followed by applicable *temporary* defensive factors. Therefore each additional 1 Armor prevents **0.35 hit points of ordinary raw damage**, until the minimum 3 damage is reached. Armor is **not itself a fixed percentage reduction**. Example for a 20-damage hit with no statuses: starting Armor 8 → **17.20 HP lost**; tier-4 Armor 36 → **7.40 HP lost**; tier-4+reforge Armor 39 → **6.35 HP lost**. Actual encounters can have other source damage adjustments, already-mitigated damage, wards, immunity and other effects.

**Other defensive modifiers — distinguish carefully:** No **innate, permanent Paladin-specific percentage defense modifier** was identified in the hero's base class stats, HP talent, `armor()`, or normal `hitParty()` damage path. Temporary shielding/warding is handled in the existing combat status path, but the Paladin's own Shield Stance and Skill-8 party ward are **his skills and are explicitly excluded from this passive design baseline**. The companion Soldier's veteran self-ward is applied to that Soldier, **not automatically to the hero**; companion Recall protection applies to retreating companions. The purchasable **Preparation Tonic** grants **+10% of the then-current maximum HP (rounded up) until rest/defeat**, but is temporary bonus HP, **not Armor or percentage damage mitigation**, and must not be confused with a passive.

**Design implication, not an approved change:** A Paladin passive can be investigated as **small automatically scaling max HP plus a separate modest percentage incoming-damage mitigation**, independent of skills and armor. However, the current damage path picks the *stronger* of active ward and Shield Stance factors rather than multiplying them. Any added permanent mitigation must have a clearly approved interaction with that rule; avoid accidental stacking into overwhelming tank durability. Decide its level-1 value, level growth, cap, inclusion/exclusion of already-mitigated hits, and save compatibility before implementation.

**Sources:** `src/prototype/rules.js` class/Discipline/equipment numbers and growth; `src/prototype/progression.js` `heroTalentHpBonus()`, `talent()`, `armor()`; `src/prototype/combat.js` `hitParty()`; `src/prototype/engine.js` `activatePreparationTonic()`; `src/prototype/party.js` `companionUseFirstSkill()`.

## 1. Design intent and problem statement

The target identities are deliberately simple:

- **Paladin — tough**: should feel reliably sturdier and capable of enduring direct combat from the very beginning.
- **Mage — powerful**: should have a clearly recognizable advantage in magical/offensive power, balanced by vulnerability.
- **Ranger — agile/dexterous**: should feel meaningfully quicker and better at positioning, **and gain an additional source of cooldown reduction through its level-scaling innate passive**, without automatically becoming stronger than the Mage or tougher than the Paladin.

This is not an invitation to replace the existing combat system. The user identified a likely original-design inheritance issue: the game began with a Paladin; Mage and Ranger were subsequently added to largely shared stats, equipment and progression mechanics. The repository history below confirms substantial portions of that explanation.

**Working diagnosis, not a measured balance verdict:** initial class identities exist, but flat shared improvements dilute their relative differences during progression. Ranger's starting agility is less distinct than Paladin's durability and Mage's Power. No specific new numbers have yet been approved.

## 2. Historical evidence: original Paladin → three classes → shared equipment progression

### A. Paladin-only prototype, before Mage and Ranger

On the [pre-class commit `16934bd`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/16934bd317b67a2b1479abde58b9a83e0e7ae25f), `src/game.js` contains one RPG player profile: **120 max HP, 60 max MP, 18 spellPower, 8 armor, 300 maxSpeed**. Its inventory contains **Crusader Sword +10 Power**; the shop also sells **Judgment Hammer +18 Power**. Talents then offered flat Power, HP, MP regeneration and movement bonuses. This supports an original Paladin-centered RPG design; the original game did not yet define three independent character templates.

### B. Classes added on October 4

[Commit `12cb5df`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/12cb5df8ebabc0a07dc30dce28c5ccaa7fa910e8) introduced `src/classes.js`, class selection, and distinctive class spells. It established the **same five core numeric baselines still in use today**:

| Class | HP | MP | Power | Armor | Speed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Paladin | 120 | 60 | 18 | 8 | 300 |
| Mage | 90 | 100 | 22 | 3 | 300 |
| Ranger | 105 | 70 | 20 | 5 | 320 |

The old class-selection code created three different named starting weapons — Crusader Sword, Frost Staff and Explorer Bow — yet used the identical equipment object bonus **`sp:10`** for all three. This is direct evidence of shared equipment benefit at the time the classes appeared. **Important historical distinction:** that original inventory-based starting weapon is not the same as the current native Campaign's weapon-tier-0 starting state.

The original Paladin numbers themselves were not changed when the other classes were added; they were kept as one entry in the new class table.

### C. Expanded v0.6 progression, later on October 4

[Merged PR #2](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/2), merged October 4, introduced the broader five-region campaign. The `src/prototype/engine.js` at merge commit [`4c2013a`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/4c2013a8672228893c59ba037a8b843591888080) already uses one shared equipment progression across all classes:

| Mechanic | v0.6 | Current `main` |
| --- | --- | --- |
| Weapon-tier Power additions, tiers 1–4 | +15 / +35 / +55 / +70 | unchanged numerically |
| Armor-tier Armor additions, tiers 1–4 | +5 / +12 / +20 / +28 | unchanged numerically |
| Weapon reforge | +5 Power | unchanged numerically |
| Armor reforge | +3 Armor | unchanged numerically |
| Weapon prices, tiers 1–4 | 100 / 450 / 1000 / 2000 | unchanged numerically |
| Armor prices, tiers 1–4 | 80 / 300 / 700 / 1200 | unchanged numerically |
| Natural HP gain per level | +25 | unchanged numerically |

Current implementation was reorganized into `src/prototype/rules.js` and `src/prototype/progression.js`, but these numerical tier bonuses and prices match the v0.6 source. This is evidence of numerical continuity, **not** a claim that every equipment-related code path has remained unchanged.

### D. Modern class skills are a separate, mature subsystem

Many intervening PRs substantially redesigned Skills 1–8, charged actions, projectile timing, roles, crowd controls, and cooldown-only combat. The current skill system is **not** a remnant to redo as part of this fix. It is expressly excluded.

[PR #12](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/12) introduced Paladin movement-triggered basics; [PR #13](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/13) added Mage/Ranger movement-triggered basics. These are background history, not scope expansion.

## 3. Current authoritative level-1 baseline (source audit)

The authoritative source is `R.balance.classes` in [`src/prototype/rules.js`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/src/prototype/rules.js), copied to the hero state at new-campaign construction in `engine.js`. The numbers are the same as in the October 4 original class table.

| Property | Paladin | Mage | Ranger | Meaning |
| --- | ---: | ---: | ---: | --- |
| Max HP | 120 | 90 | 105 | Paladin starts with most durability |
| Armor | 8 | 3 | 5 | Paladin has largest passive flat-hit reduction |
| Power | 18 | 22 | 20 | Mage leads by only 2 Power over Ranger |
| Movement speed | 300 | 300 | 320 | Ranger is +6.67% faster, absent modifiers |
| Dormant MP | 60 | 100 | 70 | MP is saved but does not currently finance skills |
| Automatic normal Skill-1 basic interval | 0.85 s | 0.85 s | 0.85 s | One shared natural cadence; training may change it |
| Normal Skill-1 basic reach | 120 | 400 | 450 | Already class-distinct; **do not modify** |
| Unmodified normal Skill-1 automatic attack base | 30 | 34 | 32 | Formula `Power + 12`; before combos/defenses |

**Qualification:** The automatic basic is a native Skill-1 action, but the **skill system itself remains protected**. This table records current behavior only. It does not propose modifying its range, interval, damage formula, combo, tap/charged behavior, projectiles, or cooldown rules.

### What the baseline implies (calculated, not playtested)

- Paladin starts with **33.3% more HP** than Mage and **5 more armor points**.
- Mage has **22.2% more base Power** than Paladin but **10% more Power** than Ranger; the shared `Power + 12` normal-basic formula compresses that to approximately **13.3%** and **6.25%**, respectively, before combat modifiers.
- Ranger is **6.67% faster** at level 1, but has **no innate quicker basic-cadence stat or class-specific evasion calculation** in this initial stat table.
- Incoming hit mitigation normally uses `max(3, rawDamage - armor*0.35)` before additional effects. For an illustrative unmodified 20-point hit: Paladin loses 17.20 HP, Mage 18.95, Ranger 18.25. With only starting HP, this gives approximately 7 / 5 / 6 such hits to defeat respectively. It is **not an encounter simulation**.
- Initial HP and Armor differentiation is real. Ranger's movement identity is relatively slight. Mage's Power advantage exists but is modest against Ranger.

### Boundaries and other systems to keep intact

- `R.resourceMode.manaEnabled = false`: MP remains dormant for compatibility. Do **not** reactivate, delete, rebalance or reinterpret MP during this work.
- The native three-hit basic combo, physical projectile rules, attack range and movement-triggered attack decisions are separate. The Ranger's normal Skill-1 tap visibly sends **three arrows but divides one attack's damage across them**; it is not triple damage.
- A Ranger's Skill-4 personal haste and ally Rally become relevant **after** training; they are not level-1 innate agility.
- New heroes start with only Skill 1 trained: `skills:[1,0,0,0,0,0,0,0]`.
- Starter weapon/armor tiers in today's Campaign are `weapon:0`, `armorTier:0`. Do not mistakenly apply the legacy `+10` weapon to native level-1 calculations.

## 4. Why the shared growth/gear architecture matters — later stages only

These are **deferred diagnostics**, not permission to adjust progression in the first patch.

- Natural growth still adds **+25 max HP per level** to each class. Without other bonuses, at level 10 their HP is Paladin 345 / Mage 315 / Ranger 330. Paladin's HP advantage relative to Mage shrinks from 33.3% to ~9.5%.
- Tier-4 weapon additions are uniformly +70; without training/reforges, resulting total Power is 88 / 92 / 90. The base gap remains 4 / 2 despite much larger totals.
- Tier-4 armor additions are uniformly +28; resulting total Armor is 36 / 31 / 33. Existing flat mitigation has a 3-damage floor and separate status modifiers.
- Discipline Training **already has class-specific rank profiles**, unlike the common natural HP growth and common gear tier values: Paladin 7 Power / 2 dormant Mana / 33 HP / 38 movement; Mage 9 / 3 / 27 / 41; Ranger 8 / 2 / 29 / 41. Do not mistake it for completely generic progression. Its **mechanics and effects are frozen for this project** unless separately and expressly reauthorized.
- Soldier and Archer companion baseline HP/armor were intentionally matched to hero archetypes (Soldier 120/8; Archer 105/5). Any change to hero starting attributes must explicitly examine whether to preserve or revise those **separate companion** definitions; **do not silently change them**.
- A base-stat update must preserve existing v4 saves, inherited equipment, Succession replacement, class selection, HP accounting on restore, companion inheritance, and Normal/Nightmare play.

## 5. Explicit scope contract: what is and is not authorized

### IN SCOPE — Stage 1 only (revised to innate-passive approach)

1. Use the existing starting-attribute table as the **unchanged baseline**, documenting the role each attribute already plays.
2. Design **one class-bound automatic passive for Paladin, Mage and Ranger**, each scaling with hero level without participating in skill ranks or skill training.
3. Preserve the owner-specified class effects and their **level-1 starting increments**; document growth, remaining implementation details and any needed caps. The values are set for design review, not yet implemented.
4. Show a candidate comparison at level 1 and representative higher levels, including indirect effects through the already-existing formulas.
5. After explicit owner approval, implement the smallest isolated derived-modifier layer and focused regressions; do not alter legacy class bases or rewrite the existing skill system.

### STRICTLY OUT OF SCOPE

- **No redesign of existing skills:** names, effects, damage coefficients, target counts, areas/ranges, projectile mechanics, combo logic, tap/charge, base cooldown constants, costs, statuses, class ultimates, trainer gates, or skill-specific rank balance. **Expressly permitted to investigate:** a separate Ranger passive modifier that changes *effective cooldown durations*; that outcome must be disclosed, bounded, and approved before implementation. Do not present this as 'cooldowns unchanged' in practical play.
- **No changes to skill progression:** trainers, instructor gates, rank ceilings, unlocks, prices or skill rank effects.
- No change to natural per-level HP growth, XP curve, Discipline Training values/caps, base basic cadence, attack reach, enemy/boss stats, item prices, equipment bonuses/reforge values, pet/companion stats, or support inheritance **during Stage 1**.
- No new dodge/evasion/crit mechanic. Ranger passive movement speed **and** class-bound cooldown reduction are both proposed; no extra attack-cadence, skill-rank, critical, or dodge system is authorized. Its scope and stacking must be explicitly agreed before code changes.
- No unrelated performance, rendering, asset, UI, combat, or economy refactor.
- No modification of save schema/version without an independently demonstrated need and explicit approval.
- No merge, deployment, or broad balance change without explicit owner sign-off.

**Conflict rule:** if a proposed passive requires changing any protected skill, skill progression, or unrelated mechanic, stop and redesign the passive within this scope. Do not broaden scope by default.

## 6. Design questions — Stage 1 decision gate (open, not implemented)

A. **Paladin toughness:** Is 120 HP / 8 Armor already sufficiently distinctive in representative level-1 fights, accounting for melee exposure, or should the *starting* HP and/or Armor shift modestly? Avoid changing offensive skills.

B. **Mage power:** Is 22 starting Power sufficiently noticeable compared with Ranger's 20? If not, evaluate a small starting-Power adjustment; preserve every skill's formula, coefficient, and unlock. Check the derived change in basic/skill damage as a consequence rather than tuning skills directly.

C. **Ranger agility:** Is 320 vs 300 movement speed enough for practical repositioning? If not, assess a **bounded base movement-speed** change first. Faster attack intervals or an evasion subsystem would violate current Stage-1 scope; neither is presumed necessary.

D. **Tradeoffs:** Preserve coherent ordering (Paladin top survivability, Mage top Power, Ranger top speed) without requiring all three to have equal damage/survivability/kill times. Test both with and without their initial companions so assistance does not conceal differences.

E. **Compatibility:** Decide whether base-stat revisions apply **only to new level-1/successor starts** or need a deliberate, separately approved existing-save migration. Never silently overwrite existing saved HP/Power/Armor/speed fields.

**No candidate values are approved as of this document. Current numbers are the baseline, not a proposed patch.**

## 7. Revised sequencing and acceptance gates for the next session

- [x] **Stage 0 — Historical audit and baseline.** Paladin-first design, three-class introduction, shared gear and level growth documented.
- [x] **Stage 0 — New owner direction captured.** Favor a one-per-class, level-scaling passive layer rather than rewriting preexisting base stats or tier systems.
- [x] **Stage 1A — Three innate class passives with level-1 bonuses specified.** Paladin +5 HP/+0.01 Armor effectiveness per level; Mage +2 Power per level (no other benefit); Ranger +3 speed/+1 percentage point CDR per level. All begin at level 1; the previously discussed L2-only start was withdrawn.
- [ ] **Stage 1B — Design and compare candidate scaling.** Explicit starting strength, bonus per level or growth function, representative L1/L5/L10 checkpoints, edge cases, and effective impact (not merely stat-sheet numbers).
- [ ] **Stage 1C — Owner approves the *exact* passive effects and values.** This is the first gameplay-change authorization gate.
- [ ] **Stage 1D — Implement in a small, isolated passive-calculation layer.** Existing base class stats, natural growth, gear/reforge prices and bonuses, all active/charged skill mechanics and skill progression remain unchanged. Prefer no save-schema change.
- [ ] **Stage 1E — Focused deterministic regressions.** New Paladin/Mage/Ranger and returning saves; level scaling without duplication; Succession; derived hero stats and current HP integrity; companion invariance; basic/skill damage consequences (verify skill definitions unchanged); Ranger kiting/pathing; Normal/Nightmare parity.
- [ ] **Stage 1F — Owner playtest/approval.** Keep, revise, or revert passives; no merger/deployment without explicit sign-off.
- [ ] **Stage 2 — Only if independently requested.** Revisit natural growth/equipment/other systems after testing the passive strategy. This PR is not permission to expand.

### Documentation-only verification at creation

This file is the entire initial branch change. No gameplay file was edited; no benchmarks or focused simulation regressions were executed. The history was checked against GitHub commit snapshots and the current production source. A later implementation must include its own tests and review evidence.

## 8. Next-session pickup (updated)

**Next task:** all three passives are specified and **start at level 1**. Audit bounded integration, confirm Ranger CDR coverage/stacking/cap, evaluate Mage damage and Paladin survival without editing skills, and validate save/load and companion inheritance before implementation. No base-stat/equipment/skill-system changes.

Raw level-1 class baselines stay Paladin **120 HP / 8 Armor / 18 Power / 300 speed**, Mage **90 HP / 3 Armor / 22 Power / 300 speed**, Ranger **105 HP / 5 Armor / 20 Power / 320 speed**. **Effective figures with passive from the outset:** Paladin **125 HP and 0.36 Armor coefficient**, Mage **24 Power**, Ranger **323 speed and 1% innate CDR**, before other modifications.

**Do not start implementation yet.** In particular, do not silently edit skill coefficients or adjust attack speed/ranges under the guise of an agility passive. An automatic passive can be an independent modifier without integrating with existing skills/training.

### Audited source references

- [Pre-class RPG player, talent, starting inventory](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/16934bd317b67a2b1479abde58b9a83e0e7ae25f/src/game.js)
- [Class introduction and three starting weapons](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/12cb5df8ebabc0a07dc30dce28c5ccaa7fa910e8/src/classes.js)
- [Original class-selection weapon assignment](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/12cb5df8ebabc0a07dc30dce28c5ccaa7fa910e8/src/game.js)
- [v0.6 original Campaign with shared equipment](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/4c2013a8672228893c59ba037a8b843591888080/src/prototype/engine.js)
- [Current rules and constants](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/src/prototype/rules.js)
- [Current hero initialization and movement](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/src/prototype/engine.js)
- [Current level growth, equipment, and inheritance](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/src/prototype/progression.js)
- [Current hero basic attack and range](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/src/prototype/hero-combat.js)
- [Current incoming damage mitigation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/src/prototype/combat.js)
- [Class-design and companion-baseline decisions](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/docs/DECISIONS.md)
