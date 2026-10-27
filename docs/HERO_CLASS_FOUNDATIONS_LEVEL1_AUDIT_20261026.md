# Hero class foundations: historical audit and level-1 design gate
**Date:** 26 October 2026  
**Status:** DRAFT / documentation-only baseline; no approved balance numbers and no gameplay implementation  
**Owner decision:** Rebuild class differentiation from its earliest foundations, **one bounded step at a time**. Begin with innate level-1 statistics. Protect the existing hero skills, their values, training and progression.

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

### IN SCOPE — Stage 1 only

1. Inventory and assess current level-1 *innate* HP, Armor, Power and movement-speed values and their mechanical impact.
2. Agree on the desired relative class feel at level 1 **before any numerical changes**.
3. Develop a **small candidate level-1 stat table** for owner review; do not invent final numbers or edit gameplay until it is approved.
4. Once approved, make the smallest corresponding class-stat data change, with focused verification that original class-role ordering survives and saves remain valid.

### STRICTLY OUT OF SCOPE

- **No changes to skills:** names, effects, damage coefficients, target counts, areas/ranges, projectile mechanics, combo logic, tap/charge, cooldowns, costs, statuses, talents within the skill system, class ultimates, or any skill-specific balance.
- **No changes to skill progression:** trainers, instructor gates, rank ceilings, unlocks, prices or skill rank effects.
- No change to natural per-level HP growth, XP curve, Discipline Training values/caps, base basic cadence, attack reach, enemy/boss stats, item prices, equipment bonuses/reforge values, pet/companion stats, or support inheritance **during Stage 1**.
- No new dodge/evasion/crit mechanic; do not add stats just to make Ranger more distinct without a separate owner decision.
- No unrelated performance, rendering, asset, UI, combat, or economy refactor.
- No modification of save schema/version without an independently demonstrated need and explicit approval.
- No merge, deployment, or broad balance change without explicit owner sign-off.

**Conflict rule:** if a proposed level-1 stat adjustment requires changing any protected skill or mechanic, stop and redesign the proposal within this scope. Do not broaden scope by default.

## 6. Design questions — Stage 1 decision gate (open, not implemented)

A. **Paladin toughness:** Is 120 HP / 8 Armor already sufficiently distinctive in representative level-1 fights, accounting for melee exposure, or should the *starting* HP and/or Armor shift modestly? Avoid changing offensive skills.

B. **Mage power:** Is 22 starting Power sufficiently noticeable compared with Ranger's 20? If not, evaluate a small starting-Power adjustment; preserve every skill's formula, coefficient, and unlock. Check the derived change in basic/skill damage as a consequence rather than tuning skills directly.

C. **Ranger agility:** Is 320 vs 300 movement speed enough for practical repositioning? If not, assess a **bounded base movement-speed** change first. Faster attack intervals or an evasion subsystem would violate current Stage-1 scope; neither is presumed necessary.

D. **Tradeoffs:** Preserve coherent ordering (Paladin top survivability, Mage top Power, Ranger top speed) without requiring all three to have equal damage/survivability/kill times. Test both with and without their initial companions so assistance does not conceal differences.

E. **Compatibility:** Decide whether base-stat revisions apply **only to new level-1/successor starts** or need a deliberate, separately approved existing-save migration. Never silently overwrite existing saved HP/Power/Armor/speed fields.

**No candidate values are approved as of this document. Current numbers are the baseline, not a proposed patch.**

## 7. Sequencing and acceptance gates for tomorrow

- [x] **Stage 0 — Trace origin and audit the current baseline.** Classless Paladin source, 2026-10-04 class addition, v0.6 gear progression and current class table identified.
- [x] **Stage 0 — Record the protected boundaries.** Scope, historical/source links, existing class differences and deferred dependencies documented in this PR.
- [ ] **Stage 1A — Agree on level-1 identities and success criteria.** Decide what should be noticeably different in combat and movement, with bounded tradeoffs.
- [ ] **Stage 1B — Produce a small proposed stats-only table.** Record each proposed starting change and rationale, with unchanged values visible. Explicit approval required.
- [ ] **Stage 1C — Implement *only* approved level-1 class stats.** No other gameplay system edits.
- [ ] **Stage 1D — Run focused deterministic checks.** Fresh Paladin/Mage/Ranger creation; base-stat expectations; before/after unmodified hit survival, movement displacement, normal-basic damage; Succession; save roundtrip; baseline companion integrity; no skill-value changes. Compare values using identical seeds, enemies, terrain and inputs. Avoid presenting calculations as measured gameplay results.
- [ ] **Stage 1E — Owner acceptance.** Choose keep/adjust/revert; do not merge without explicit approval.
- [ ] **Stage 2 (deferred):** Only after Stage 1 approval, discuss whether shared *natural growth* and *equipment* erase role identity later. Scope must be separately agreed; preserve same gear acquisition economy and all skills. **Not part of this initial change.**

### Documentation-only verification at creation

This file is the entire initial branch change. No gameplay file was edited; no benchmarks or focused simulation regressions were executed. The history was checked against GitHub commit snapshots and the current production source. A later implementation must include its own tests and review evidence.

## 8. Tomorrow's pickup

**Begin at Stage 1A with this concrete question:** given level-1 HP/Armor/Power/Speed of Paladin **120/8/18/300**, Mage **90/3/22/300**, Ranger **105/5/20/320**, what is *actually insufficient* for the intended identity, and what is the smallest acceptable change to these starting numbers alone?

Do not start by redesigning equipment, classes' existing skills, skill training, or critical systems. Those would turn the requested constrained foundational correction into an unnecessary combat overhaul.

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
