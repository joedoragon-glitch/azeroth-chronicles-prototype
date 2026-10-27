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
- No new dodge, evasion, crit, extra-projectile, attack-speed or attack-range system as the default. These are potential complexity traps and **not currently authorized**.
- Prefer a **single, deterministic, centralized, class-and-level-based calculation** over serialized passive state, ticking buffs, ad-hoc level-up mutations, or scattered conditionals. This is a proposed architecture to validate against the actual code, *not* an implementation commitment.
- A passive may indirectly change downstream damage or survivability when it modifies a stat. In particular, **Mage bonus Power changes effective damage for existing Power-based skills even if no skill value or formula changes**. That indirect effect must be measured and presented for approval; do not pretend it is fully isolated from gameplay.

**Illustrative passive roles (names/effects are exploratory, not approved)**
| Class | Concept | Lowest-disruption effect family to assess | Avoid by default |
| --- | --- | --- | --- |
| Paladin | Fortitude / Endurance | Derived max HP **or** Armor bonus scaling with level; choose after save/damage audit | New shield skill, stacking damage immunities, combat-triggered heal |
| Mage | Arcane Power / Attunement | Derived Power bonus scaling with level, checked against existing skill output | Editing skill damage multipliers, skill ranks, mana reactivation |
| Ranger | Agility / Fleetfoot | Derived **movement speed** bonus scaling with level | New dodge engine, altered basic cooldown/range, projectile rewrites |

The examples intentionally use already-existing character properties first. **Nothing in this table is an approved new ability or stat number.** If Ranger movement alone proves insufficient for a noticeable agility identity, discuss *why* before considering a broader mechanic.

**Important technical questions, to verify before implementing:**
1. Which derived-stat accessors and HUD/save paths should expose each bonus? HP is a special case: max HP / current HP / saves / level-up / Succession / new starts must remain consistent.
2. Should level-1 passives already grant a bonus, or should the bonus begin only after gaining a level? Owner intent is differentiation *from the beginning*; do not accidentally defer all benefits to level 2.
3. How can a level-based passive avoid double application on load, stat reset, inheritance or leveling? Favor derivation over stored accumulation where feasible.
4. How does Mage's Power passive affect existing Skill 1/basic and Skills 2–8 **without changing any skill definition**? Test these consequences explicitly.
5. Does Ranger movement speed cause navigation, kiting, collision or enemy pursuit issues? Focused comparisons are necessary before tuning.
6. Can the addition be made without touching existing progression, skill-system or save-schema behavior? If not, stop for a separate approval.

**Change control:** This direction replaces the *proposed means* (retuning base attributes) but retains the *goal* and all skill-system exclusions. The historical findings and baseline tables below remain true. Sections describing a stat-table-first roadmap are retained only as history and are explicitly superseded by the revised pickup steps below.

## 1. Design intent and problem statement

The target identities are deliberately simple:

- **Paladin — tough**: should feel reliably sturdier and capable of enduring direct combat from the very beginning.
- **Mage — powerful**: should have a clearly recognizable advantage in magical/offensive power, balanced by vulnerability.
- **Ranger — agile/dexterous**: should feel meaningfully quicker and better at positioning, without automatically becoming stronger than the Mage or tougher than the Paladin.

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

- **No changes to skills:** names, effects, damage coefficients, target counts, areas/ranges, projectile mechanics, combo logic, tap/charge, cooldowns, costs, statuses, talents within the skill system, class ultimates, or any skill-specific balance.
- **No changes to skill progression:** trainers, instructor gates, rank ceilings, unlocks, prices or skill rank effects.
- No change to natural per-level HP growth, XP curve, Discipline Training values/caps, base basic cadence, attack reach, enemy/boss stats, item prices, equipment bonuses/reforge values, pet/companion stats, or support inheritance **during Stage 1**.
- No new dodge/evasion/crit mechanic; use the existing movement-speed property as the first Ranger passive candidate and seek a separate owner decision before expanding mechanics.
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
- [ ] **Stage 1A — Specify what each passive actually does.** Paladin durability; Mage power; Ranger agility. Prefer HP/Armor, Power, movement-speed respectively, but select effects and names with the owner.
- [ ] **Stage 1B — Design and compare candidate scaling.** Explicit starting strength, bonus per level or growth function, representative L1/L5/L10 checkpoints, edge cases, and effective impact (not merely stat-sheet numbers).
- [ ] **Stage 1C — Owner approves the *exact* passive effects and values.** This is the first gameplay-change authorization gate.
- [ ] **Stage 1D — Implement in a small, isolated passive-calculation layer.** Existing base class stats, natural growth, gear/reforge prices and bonuses, all active/charged skill mechanics and skill progression remain unchanged. Prefer no save-schema change.
- [ ] **Stage 1E — Focused deterministic regressions.** New Paladin/Mage/Ranger and returning saves; level scaling without duplication; Succession; derived hero stats and current HP integrity; companion invariance; basic/skill damage consequences (verify skill definitions unchanged); Ranger kiting/pathing; Normal/Nightmare parity.
- [ ] **Stage 1F — Owner playtest/approval.** Keep, revise, or revert passives; no merger/deployment without explicit sign-off.
- [ ] **Stage 2 — Only if independently requested.** Revisit natural growth/equipment/other systems after testing the passive strategy. This PR is not permission to expand.

### Documentation-only verification at creation

This file is the entire initial branch change. No gameplay file was edited; no benchmarks or focused simulation regressions were executed. The history was checked against GitHub commit snapshots and the current production source. A later implementation must include its own tests and review evidence.

## 8. Next-session pickup (updated)

**First question:** For each class, what is the **single simplest innate, level-scaling effect** that delivers its intended identity without changing any existing skill, skill progression, base class stat, item tier or natural leveling formula?

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
