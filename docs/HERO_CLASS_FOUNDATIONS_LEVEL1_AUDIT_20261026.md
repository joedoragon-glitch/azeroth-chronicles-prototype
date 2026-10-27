# Hero class foundations: historical audit and level-1 design gate
**Date:** 26 October 2026  
**Status:** DRAFT / documentation-only baseline; no approved passive effects or numeric values; no gameplay implementation  
**Owner decision (updated):** Preserve the original starting stat table and legacy mechanics. Explore **one automatic, innate, level-scaling passive per hero class** as a separate, minimal differentiation layer. Protect the existing hero skills, their values, training and progression.

## Direction update — October 26, 2026: one innate passive for each class (proposed, not yet specified)

The owner proposed a **simpler alternative** after the initial historical audit: instead of rewriting starting attributes, item progression or natural growth, retain those existing systems and add **one identity-defining passive to each hero class**. Each passive should be present because of the hero's class and should **grow automatically with hero level**. This is the **current preferred investigation path**, superseding the earlier plan to begin by editing the base-stat table.

**Design invariants**
- Exactly **one class-identity passive per hero class**; no new player-facing skill slot, action, rank, trainer, unlock, resource, keybinding, or progression currency.
- A class passive is a **separate innate modifier**, *not* a new active/charged skill or a change to the existing skill system.
- Keep the current `R.balance.classes` starting numbers **unchanged as the historical foundation**, at least for the first candidate. The class passive contributes a distinct derived bonus on top.
- The passive **applies automatically at/with leveling**; final starting magnitude, growth rate, cap (if any), and rounding are **not decided**. We should explicitly decide whether it is already meaningful at level 1. No approved numerical values.
- Leave the shared natural +25 HP per level, all tier prices/bonuses, reforges, Discipline Training, MP resource mode, class skill definitions and combat rules unchanged. **Do not alter skill files to deliver the passives** if a safe isolated integration exists.
- No new dodge, evasion, crit, extra-projectile, independent attack-speed or attack-range system as the default. These are potential complexity traps and **not currently authorized**. Ranger passive cooldown reduction is now explicitly eligible for design, but its magnitude, scope (which cooldowns) and stacking/cap policy remain unapproved.
- Prefer a **single, deterministic, centralized, class-and-level-based calculation** over serialized passive state, ticking buffs, ad-hoc level-up mutations, or scattered conditionals. This is a proposed architecture to validate against the actual code, *not* an implementation commitment.
- A passive may indirectly change downstream damage or survivability when it modifies a stat. In particular, **Mage bonus Power changes effective damage for existing Power-based skills even if no skill value or formula changes**. That indirect effect must be measured and presented for approval; do not pretend it is fully isolated from gameplay.

**Illustrative passive roles (names/effects are exploratory, not approved)**
| Class | Concept | Lowest-disruption effect family to assess | Avoid by default |
| --- | --- | --- | --- |
| Paladin | Fortitude / Endurance | Derived max HP **or** Armor bonus scaling with level; choose after save/damage audit | New shield skill, stacking damage immunities, combat-triggered heal |
| Mage | Arcane Power / Attunement | Derived Power bonus scaling with level, checked against existing skill output | Editing skill damage multipliers, skill ranks, mana reactivation |
| Ranger | Agility / Fleetfoot | Derived **movement speed plus cooldown reduction** that grows with level, independently of spending talent points | Dodge engine, projectile rewrites, range/skill coefficient changes; unbounded cooldown stacking |

The examples intentionally use already-existing character properties first. **Nothing in this table is an approved new ability or stat number.** If Ranger movement alone proves insufficient for a noticeable agility identity, discuss *why* before considering a broader mechanic.

**Important technical questions, to verify before implementing:**
1. Which derived-stat accessors and HUD/save paths should expose each bonus? HP is a special case: max HP / current HP / saves / level-up / Succession / new starts must remain consistent.
2. Should level-1 passives already grant a bonus, or should the bonus begin only after gaining a level? Owner intent is differentiation *from the beginning*; do not accidentally defer all benefits to level 2.
3. How can a level-based passive avoid double application on load, stat reset, inheritance or leveling? Favor derivation over stored accumulation where feasible.
4. How does Mage's Power passive affect existing Skill 1/basic and Skills 2–8 **without changing any skill definition**? Test these consequences explicitly.
5. Does Ranger movement speed cause navigation, kiting, collision or enemy pursuit issues? Focused comparisons are necessary before tuning.
6. Can the addition be made without touching existing progression, skill-system or save-schema behavior? If not, stop for a separate approval.

**Change control:** This direction replaces the *proposed means* (retuning base attributes) but retains the *goal* and all skill-system exclusions. The historical findings and baseline tables below remain true. Sections describing a stat-table-first roadmap are retained only as history and are explicitly superseded by the revised pickup steps below.

### Ranger Agility passive — owner candidate: +3 movement speed and +1 percentage-point cooldown reduction per level-up

**Status:** tentative owner-selected effects for design/review. **No gameplay values have been changed.** The Paladin's proposed two-part Fortitude is considered sufficient in principle for now; focus moves to the Ranger, then Mage. Do not reopen old equipment or skill progression as a result.

**User reasoning:**
- Ranger's current movement Discipline Training gives **+41 movement speed per rank**, capped at **three ranks**. One hypothetical additional rank would be +41; the owner rounded that reference to 42, then `42 / 15 = 2.8`, rounded to **+3 movement speed for each level-up** as an *innate*, rank-independent passive. This does **not** increase movement training's three-rank cap.
- The cooldown training gives **4% reduction per rank**, capped at **five ranks** (20% maximum training reduction). Instead of assigning extra talent ranks, the Ranger gets **+1 percentage point of innate cooldown reduction per hero level-up**. This does **not** increase the cooldown talent's five-rank cap.
- Arithmetic correction: current starting speed 320 plus 3 training ranks × 41 = **443**, not 483. At level 15, +3 speed × 14 level-ups = +42, making 320 + 123 + 42 = **485** with full movement training. Note the numerical similarity to the owner's 483 target is coincidental; do not retroactively alter +41 ranks.

**Proposed central derived values (descriptive pseudocode, not approved implementation):**

```js
const levelUps = Math.max(0, hero.level - 1);
const rangerPassiveSpeedBonus =
  hero.class === 'ranger' ? 3 * levelUps : 0;
const rangerPassiveCooldownReduction =
  hero.class === 'ranger' ? 0.01 * levelUps : 0; // +1 percentage point/level-up
// Speed uses existing base speed + Discipline Training speed + passive speed
// Effective CDR: existing talent reduction and passive need one shared stacking rule
```

**Illustrative unmodified checkpoints** (speed excludes haste/slows/terrain/input modifiers; maximum-trained column assumes all 3 movement training ranks; cooldown columns use percentage points and assume currently disabled mana mode):

| Level | Level-ups | Ranger passive speed | Base + passive speed | Speed with 3 movement ranks | Innate passive CDR | Hypothetical combined CDR with 5 cooldown ranks (20%), if additive |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | +0 | 320 | 443 | 0% | 20% |
| 5 | 4 | +12 | 332 | 455 | 4% | 24% |
| 10 | 9 | +27 | 347 | 470 | 9% | 29% |
| 15 | 14 | +42 | 362 | 485 | 14% | 34% |
| 18 | 17 | +51 | 371 | 494 | 17% | 37% |
| 20 | 19 | +57 | 377 | 500 | 19% | 39% |

**Important precision:** The owner said "per level" for cooldown reduction after saying "per level-up" for speed. This candidate uses *level-ups after level 1*, consistently with the Paladin design, to retain a zero bonus at level 1. If the owner instead wants **+1% CDR already at level 1**, use `0.01 * level`, producing **15% at level 15** rather than 14%. This distinction must be settled before implementation.

**Mandatory integration and guardrails:**
1. **No two skill systems or talent changes.** Do not modify existing Skill 1–8 base coefficients, damage/ranges, costs, trainer limits, rank effects or the four talent rank ceilings. Ranger passive is a class-specific modifier feeding the **existing effective cooldown calculation**.
2. `hero-combat.js::skillCooldown()` currently handles both normal/charged skill durations, and `basicSkillCooldown()` handles the automatic basic interval. The current talent factor is `1 - min(5, trainingRank) * 0.04`. If the owner chooses additive CDR, proposed general expression is `1 - effectiveTotalReduction`, where the total can include training and a Ranger-only passive; **same shared calculation logic** for participating cooldown types, not a duplicate Ranger-specific cooldown system.
3. At level 15 with all five cooldown-training ranks and additive stacking, total reduction would be **34%**. The baseline 0.85-second automatic basic interval would compute `0.85*(1-0.34)=0.561s` if the passive covers basics, versus 0.68s with five training ranks and no passive. These are **calculated durations**, not observed combat throughput.
4. **Scope open:** confirm whether passive reduction should affect ordinary skill cooldowns, charged skill cooldowns and automatic basic attacks, or only some. The existing training reaches all three; no hidden coverage change is approved.
5. **Safety/cap open:** permanent 1 percentage point per level-up grows beyond the owner's convenient level-15 window and, if simply summed with 20% talent CDR without a cap, reaches dangerous/zero cooldowns at sufficiently high levels. Define a **combined minimum cooldown and/or maximum CDR** after examining the maximum reachable hero level and combat rotation. **Do not silently invent a 40%/50% cap.**
6. **Movement integration:** `src/prototype/engine.js` uses `h.speed + heroTalentSpeedBonus()` in **at least three** movement paths (around lines 4192, 4227 and 4256). The passive must be included in all relevant hero movement modes, preferably via one effective hero speed accessor. Movement-specific temporary factors remain intact.
7. **No unintended companion inheritance:** `heroTalentSpeedBonus()` contributes to companion Shared Training inheritance. The new innate Ranger speed should remain a **hero class passive**, not a talent bonus. If any portion is to inherit, obtain separate explicit approval.
8. **Saved heroes and Succession:** deriving the passive from class/level avoids accumulating a serialized stack and must produce the same numbers after save/load, leveling, resets or class succession; existing talents remain untouched.
9. **Test plan:** Ranger L1/L5/L10/L15/L18 with 0/3 movement ranks and 0/5 cooldown ranks, normal/charged/basic duration comparisons, all movement pathways, same-level Mage/Paladin invariance, slow/haste interactions, saved cooldowns, and high-level cap edge cases.
10. **Paladin status:** its +5 HP and +0.01 Armor effectiveness per level-up remain separately recorded and are not modified by the Ranger design work.

**Next decisions:** approve whether the Ranger CDR starts at level 1 or after the first level-up; choose additive vs another documented stacking rule; choose affected cooldown categories; choose combined safety bounds. Until then this is a design candidate, not implemented gameplay.

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
  const paladinLevelUps =
    target === hero && target.class === 'paladin'
      ? Math.max(0, target.level - 1)
      : 0;
  return DEFAULT_ARMOR_EFFECTIVENESS + 0.01 * paladinLevelUps;
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

### Paladin passive candidate — owner proposal: +5 HP/level-up and +0.01 per-level Armor effectiveness (October 26, 2026)

**Candidate status:** proposed/tentative values for owner review, not authorized for gameplay implementation yet. This design builds on the verified Paladin talent/equipment audit below; it **does not** replace or retune that established progression.

**Owner rationale:** Paladin's maximum HP talent gives +33 HP per talent rank, so the notional equivalent of two extra talent ranks is +66 HP. Dividing by a convenient 15-level window gives 66/15 = **4.4**, rounded to **+5 maximum HP each level-up**. The extra HP is innate and automatic, independent of talent spending. In the actual level-1-based model, reaching level 15 includes **14** level-ups, so the proposed extra HP totals **+70**, not +75.

**Formula A — natural HP excluding talents, tonic and other bonuses:**

```js
const levelUps = Math.max(0, hero.level - 1);
const bonusHp = hero.class === 'paladin' ? 5 * levelUps : 0;
const naturalMaxHp = classBaseHp + 25 * levelUps + bonusHp;
// At level 15 for Paladin: 120 + 25*14 + 5*14 = 540 HP.
// Current baseline at level 15: 120 + 25*14 = 470 HP.
```

**Formula B — ordinary incoming-hit Armor effectiveness:** retain existing actual Armor points from starting attributes, equipment and reforge. Make the **one existing damage formula** read the named `armorEffectivenessFor(target)` value shown above. Its default is 0.35 for all targets; the Paladin passive alone adds the tentative level-based modifier. There must be **no special Paladin mitigation formula** or independent multiplier.
This does **not** add Armor points, nor create a separate percentage-damage-resistance status. The coefficient is **flat hit points prevented per 1 Armor**; it is not a percentage. For Mage, Ranger and all companions/enemies the existing 0.35 coefficient remains unchanged.

**Level checkpoints, with no talents/tonic/etc.:**

| Hero level | Level-ups since 1 | Current Paladin natural max HP | Extra passive HP | Candidate Paladin max HP | Armor coefficient (per Armor point) |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | 120 | +0 | 120 | 0.35 |
| 5 | 4 | 220 | +20 | 240 | 0.39 |
| 10 | 9 | 345 | +45 | 390 | 0.44 |
| 15 | 14 | 470 | +70 | 540 | 0.49 |
| 16 | 15 | 495 | +75 | 570 | 0.50 |
| 18 | 17 | 545 | +85 | 630 | 0.52 |
| 20 | 19 | 595 | +95 | 690 | 0.54 |

**Level-15 precision question:** the user's stated intended target is 0.50 at level 15. With precisely +0.01 **per level-up**, 0.50 is reached at level **16**. Options to approve, **not** mix accidentally:

1. **Prefer preserving level-1 baseline:** `0.35 + 0.01*(level-1)` → L1 **0.35**, L15 **0.49**, L16 **0.50**.
2. **If 0.50 at L15 is essential:** `0.35 + 0.01*level` → L1 **0.36**, L15 **0.50** (one initial passive increment at start).
3. **If exact 0.35 at L1 and 0.50 at L15 are both essential:** `0.35 + 0.15*(level-1)/14` → L15 **0.50**, but increment is ~0.010714 per level-up, rather than exactly 0.01.

**Magnitude and integration risks identified in current source (must test):**

- Armor scales the coefficient multiplicatively. At tier-4 + reforge, Paladin has **39 Armor**; on a hypothetical ordinary **30 raw damage** hit, current reduction `39*0.35=13.65` yields **16.35 HP lost**. Proposed L15 coefficient `0.49` reduces `39*0.49=19.11`, leaving **10.89 HP lost** (~33.4% less HP lost than the same tier/current coefficient). There is also a **minimum of 3 damage** per ordinary hit. This is substantial despite only +0.01 per level-up; validate difficulty at top-tier armor.
- `src/prototype/combat.js::hitParty()` centrally uses `armor*0.35` for normal hits, with a special `alreadyMitigated` bypass. **Preserve** that bypass; do not apply Armor twice.
- `src/prototype/boss-combat.js` precomputes a single Armor-mitigated amount for Vortex Shedding/Death Roll using `0.35` before later split hits. The Paladin-specific modifier must be applied **once at the precomputation point**, not again to three follow-up impacts. **Reuse the same target-specific Armor-effectiveness value** for this premitigation, without calculating Armor twice. Do not create two formula variants.
- `src/prototype/progression.js::heroNaturalMaxHp()` and `heroOtherHpBonus()` feed the existing **Shared Strength companion inheritance**. If adding passive HP to `hero.maxHp`, make the new Paladin innate HP count as **natural HP**, not an unrelated transferable bonus, unless owner explicitly approves companion inheritance. Avoid altering skill ranks or the existing support-skill behavior.
- `xp()` updates saved `hero.maxHp` directly, refills HP, and synchronizes companion stats; old campaign saves, Succession, hero HP talent resets, tonics and import/migration must be checked for double application or missing past-level passive HP.
- Existing temporary Shield Stance and wards use the **stronger**, nonmultiplicatively stacking defensive factor *after* Armor. This passive is an **Armor coefficient** before that factor, not a third ward/status or an independent additive shield. No skill value is modified.
- The user estimated play around levels 15–18; the proposed formula currently **continues increasing beyond level 15**. Whether to impose a level cap is undecided. Do not silently cap or extrapolate as an approved balance decision.
- New game creation, save load, existing level-15 Paladin saves, talent reset, Succession, companions, regular hits, boss premitigation, already-mitigated hits and tooltip display all need focused tests. Avoid schema changes if possible, but **do not claim save compatibility without validating an explicit migration/derivation strategy**.

**Approval gates still open:** (a) whether defense should start at 0.35 at level 1 or 0.36; (b) whether 0.50 at level 15 is mandatory; (c) whether coefficient/HP continue after level 15 or cap; (d) whether existing Paladin saves receive retroactive bonuses; (e) passive HP non-inheritance to companions; (f) exact boss/pre-mitigation and UI behavior. No production file was edited.

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
3. Choose one simple, testable effect family for each passive and explicitly document when it starts, how it grows, and whether any cap is justified. **No effect or number is approved yet.**
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
- [ ] **Stage 1A — Specify what each passive actually does.** Paladin durability; Mage power; Ranger agility **including movement speed and additional cooldown reduction**; select the remaining effects and names with the owner.
- [ ] **Stage 1B — Design and compare candidate scaling.** Explicit starting strength, bonus per level or growth function, representative L1/L5/L10 checkpoints, edge cases, and effective impact (not merely stat-sheet numbers).
- [ ] **Stage 1C — Owner approves the *exact* passive effects and values.** This is the first gameplay-change authorization gate.
- [ ] **Stage 1D — Implement in a small, isolated passive-calculation layer.** Existing base class stats, natural growth, gear/reforge prices and bonuses, all active/charged skill mechanics and skill progression remain unchanged. Prefer no save-schema change.
- [ ] **Stage 1E — Focused deterministic regressions.** New Paladin/Mage/Ranger and returning saves; level scaling without duplication; Succession; derived hero stats and current HP integrity; companion invariance; basic/skill damage consequences (verify skill definitions unchanged); Ranger kiting/pathing; Normal/Nightmare parity.
- [ ] **Stage 1F — Owner playtest/approval.** Keep, revise, or revert passives; no merger/deployment without explicit sign-off.
- [ ] **Stage 2 — Only if independently requested.** Revisit natural growth/equipment/other systems after testing the passive strategy. This PR is not permission to expand.

### Documentation-only verification at creation

This file is the entire initial branch change. No gameplay file was edited; no benchmarks or focused simulation regressions were executed. The history was checked against GitHub commit snapshots and the current production source. A later implementation must include its own tests and review evidence.

## 8. Next-session pickup (updated)

**First question:** For each class, what is the **smallest class-bound innate passive** that delivers its intended identity without rewriting existing skills, skill ranks, base class stats, item tiers or natural leveling? Ranger's desired passive now has **two related bonuses, movement speed and cooldown reduction**. Decide their scaling and interactions with the existing cooldown talent before approving implementation.

Use today's unchanged baseline: Paladin **120 HP / 8 Armor / 18 Power / 300 speed**; Mage **90 / 3 / 22 / 300**; Ranger **105 / 5 / 20 / 320**. Discuss the passive's identity, proposed effect, when it first applies, progression curve and measurable limits before choosing numbers.

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
