# Hero combat: damage, charge cooldowns and fixed-rotation dominance
15 October 2026 — post-approval implementation and source-only balance assessment

**Status:** committed to the isolated PR-#300-based branch `feature/hero-skills-2-4-on-snapshot-20261015`; **not playtested, built, merged, or deployed**. No automated tests were invoked, as requested. This is a mechanical assessment, not a claim of encounter balance certification. Keep the multi-file GitHub Pages/PWA architecture.

## Design decision

The owner wants combat decisions to be driven primarily by skill **cooldowns and encounter circumstances**, not by longer or variable charge times. Preserve the existing universal **0.65-second hold** (quick tap under **0.20 seconds**, intermediate release cancels). Normal and charged share one learned skill rank and one cooldown slot, and cooldown training discounts both by 4% per invested rank to 20%.

**Do not add:** per-rotation penalties, hidden combo debuffs, escalating global recovery time, second charge thresholds, new mana costs, invented statuses, boss blanket immunity, or an opaque anti-spam rule. Repeated correct play should be rewarded, but no one rotation should reliably resolve every boss, mob pack and squad composition.

Instead, control whether choices work through four already visible dimensions: (1) one-target vs multi-target efficiency, (2) long charged recovery vs normal recovery, (3) limited-duration control and defensive windows, and (4) enemy warning, area movement, line of sight, defense and attack scripting.

## Existing cooldown budget (seconds, untrained)

| Skill | Normal | Charged |
|---|---:|---:|
| 1 | 0.85 | 3 |
| 2 | 3 | 6 |
| 3 | 8 | 20 |
| 4 | 14 | 20 |
| 5 | 9 | 18 |
| 6 | 4 | 12 |
| 7 | 15 | 25 |
| 8 | 24 | 40 |

Damage and healing based on Power use `M(rank) = 1 + 0.15 × (rank − 1)`; **M(1)=1** and **M(8)=2.05**. Both charged and tap get the same rank multiplier. Effects and geometry separately improve at ranks **2, 4, 6, 8**. `P` means computed hero Power at the moment of casting, *not base class Power*, and all figures are BEFORE enemy protections, missed shots, combat burst compression and any other source-specific modifiers. Skill 1 has an additional third-hit combo splash not captured in one-target rows. Skill 2 normal Ranger fires two shots, each 1.2P. Damage below always implies multiplication by M(rank), unless it is zero.

## Current damage catalog: rank-1 coefficients by class

| Slot | Paladin normal / charged | Mage normal / charged | Ranger normal / charged |
|---|---|---|---|
| 1 | (P+12) per combo hit / 3(P+12) focused projectile | same with arcane projectiles/beam | same; charged distributes its 3(P+12) among 3 arrows |
| 2 | 2.2P single / 2.2P per foe in cone, weaken | 2.2P single / 2.2P per foe in frost circle, Slow | 2.4P total from 2 arrows / 2.4P per foe in line, brief Slow |
| 3 | 0 Shield Stance / 1.6P cone Shield Bash (**0.8P** vs bosses/captains) | 0 Interrupt / 0 Silence Field | heal (45+0.5P) hero / same heal to each wounded living active unit |
| 4 | 2P single Judgment / 3.2P primary + 2P splash Grand Judgment | 2P Fracture / 3.2P primary + 1.8P splash Rupture | 0 self Haste / 0 companion Rally |
| 5 | 2.3P per foe / 3.2P per foe, charged weakens | 2.3P per foe / 3P per foe, knockback | 2.3P per foe / 2.9P projectile per foe, charged Slow |
| 6 | (1.8P+20) rush strike / 3.4P per foe in small impact radius | (1.8P+20) magic projectile / 3P beam | (1.8P+20) repelling shot / 4.2P across three repelling arrows |
| 7 | 6P per foe / 7.2P per foe + charged weaken | 6.5P primary + 4.5P + 3P up to 3 / 9P primary + 6P + 4P to three more, max 5 | 10P piercing single / 12P piercing single + brief Slow |
| 8 | 3P per foe + heal/ward / 5.5P per foe + heal/ward/weaken | 6P primary + 3.5P splash / 9P primary + 5P splash and short Fracture | 5P arrow to each of up to 3 / two 4P arrows to each of up to 5; when **only one eligible foe**: 10P tap or 12P charged unpierced total |

**Target-count safeguards:** normal/charged Skill 5 = **6/8** enemies for every class; Paladin normal/charged Skill 7 = **6/8**; Paladin Skill 8 **8/10**; Mage Skill 7 **3/5**; Mage Skill 8 **5/7**; Ranger Skill 8 **3/5** distinct foes (lone-target fallback counts above). Boss/captain attack geometry and sight checks remain mandatory. Selected Paladin Skill 7 target is retained ahead of proximity ordering, and Mage Skill 8 primary is prioritized.

### Example: damage-per-cooldown budget with hypothetical constant P=20 at rank 1

**Illustration only, not a simulation.** Ignore movement, damage losses, target availability, proc timing, enemy HP and reloads; divide **one foe's raw damage** by base cooldown to understand the design incentives. Real class Power/weapon/levels vary. Divide damage by cooldown does not account for simultaneous cooldown use or combos.

| Comparison against one foe | Normal | Charged | Meaning |
|---|---:|---:|---|
| Skill 1 single base hit | 32 damage / 0.85s = **37.6/s** | 96 / 3s = **32/s** | Basic combo remains sustained foundation; charge buys immediate burst and then recovery |
| Mage/Paladin Skill 2 | 44 / 3s = **14.7/s** | 44 / 6s = **7.3/s** | Charged is worthwhile mainly for crowd coverage; not universally optimal |
| Paladin Skill 5 | 46 / 9s = **5.1/s** | 64 / 18s = **3.6/s** | Charged wins when it affects more enemies or weakening is valuable |
| Mage Skill 7 primary | 130 / 15s = **8.7/s** | 180 / 25s = **7.2/s** | Charged increases targets and immediate burst, not raw primary-target throughput |
| Mage Skill 8 primary | 120 / 24s = **5/s** | 180 / 40s = **4.5/s** | Charged gains larger coverage and a brief Fracture window |
| Ranger Skill 7 primary | 200 / 15s = **13.3/s** | 240 / 25s = **9.6/s** | Charged offers increased burst + Slow but normal retains anti-boss uptime |
| Ranger Skill 8 lone foe | 200 / 24s = **8.3/s** | 240 / 40s = **6/s** | Multi-target ultimate, not a better single-target boss finisher than piercing Skill 7 |

With equal hypothetical P, Rank 8's damage multiplier `2.05` and max training's cooldown multiplier `0.8` change absolute outputs together, not the fundamental **normal versus charged** relative ratios. The multipliers and caps do not establish that encounter HP progression is balanced; that requires the combined gameplay pass.

## Source changes in this anti-autopilot pass

1. **Paladin enemy weakening now lasts 1.8→2.2 seconds** from rank 1→8 (up from 3→4). At maximum cooldown training, Skill 2's normal recovery is 2.4 seconds, leaving a small gap even on consecutive ideal hits. Strong weakening (12→20%) is still a timed combat tactic; Skill 5/7/8 charged weakening can extend it situationally, with longer independent cooldowns.
2. **Mage Skill 2 normal Frost Bolt Slow now lasts 2.0→2.2 seconds** from rank 1→8 (previously 4→5). Charged Frost Burst Slow now lasts **3.2→4.2 seconds**, down from 4→5, on its 6-second base cooldown. With max training: 2.4s normal and 4.8s charged cooldown, leaving cast-recovery gaps in solo same-skill repetition. The Mage keeps the frost/Slow identity, and Slow still only changes movement, not enemy special-attack timings.
3. **Target-count caps** now apply to previously uncapped repeatable Skill 5 (all classes, 6 tap / 8 charged) and Paladin Skill 7 (6 tap / 8 charged). Nearest enemies are selected, with the explicit Paladin Skill 7 target prioritized. Excess enemies remain threats instead of being wiped by a single repeatable area attack.
4. No damage coefficients or cooldown seconds changed in this pass. No extra cast time was introduced. Single-target normal/charged payoff and class identity remain intact.

## Existing encounter counterplay — do not undo

- Elite defense/guard, line-of-sight, retreat leashes, phase-specific protection, and a target-shared `tacticalCompressDamage` curve reduce the effectiveness of oversized opening bursts. Piercing Skill 7 is intentionally valuable against defensive bosses but still honors terrain, eligibility, and its own longer cooldown.
- Manual enemy target locks, summons, encounter positions, bosses' independent special-target choices, and telegraphed hazards mean a single pure damage sequence is not guaranteed to succeed if the player ignores positioning or allies.
- Charged casts require the player to hold 0.65s and release; engagement receipts reject invalid preloaded charged hits against protected bosses/captains. Normal and charged skills use a **mutually exclusive cooldown slot**.
- Paladin Shield Stance forbids Skill 1, lasts at most 8s, reduces outgoing offense to 60%, and starts an 8s base cooldown when ended. Skill 8 ward takes the stronger defensive reduction rather than stacking multiplicatively with Shield Stance. Boss Judgment does not rewrite special targeting.
- Mage charged Silence also suppresses allied specials; Interrupt cancels one current warning. Ranger companion Rally never buffs special cooldowns; Skill 6's push competes against keeping DPS up. Skill 8 no longer grants universal immunity to any class.

## Deferred combined balance acceptance criteria

When the owner orders the **one consolidated test pass**, evaluate representative skill rotations against ordinary groups (1, 3, 5, 8, 12 enemies), elite packs, captains, normal/TRUE bosses, with and without recruited companions and at skill ranks 1/4/8. Account for class Power/equipment, health progression, cooldown talent investment, missed shots, interrupted charge releases, boss phase transitions and real terrain.

Compare **single-skill spam**, **fixed preplanned full rotations** (all 8 skills on cooldown), and **responsive rotations** that preserve escape/control buttons for warnings or add phases. A fixed rotation should be powerful only when it correctly matches the encounter—not universally best. Do not punish rotation by arbitrary hidden penalty, and avoid globally strengthening bosses to compensate for one particular combo. Study survival, time-to-kill, party losses, control uptime, and frequency of forced player repositioning. Confirm no boss fight is cleared solely by starting a canned rotation with little reactive movement.

**No tests performed.** No merge, CI readiness or deploy authorization. Independent class passives remain undecided; do not tune damage around hypothetical passives.
