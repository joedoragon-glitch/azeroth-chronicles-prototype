# Rogue Bard — one-page owner review
**PR #511 · Design candidate, not game code · October 26, 2026**

## Decision in one minute

The fourth playable hero is a **female, guitar-playing Rogue Bard** who beats opponents through disruption, short-range musical AoE, traps, and automatic basic-hit Charm. She starts with **zero** companions, can never **newly hire** Soldier/Archer troops, and has **+1 active companion capacity from the beginning**. Eligible ordinary monsters permanently become friendly melee/ranged/healer companions with normal friendly role AI, persistent identity, level benefits, recovery and Barracks rules. Boss pets remain available. Bosses, captains, Ringleaders are not charmable. Hybrids and actual summons can defer. Her Endure keeps her at **1 HP for 2s**. One percentage point of **personal** critical chance is proposed per hero level, including Level 1; no passive stat boosts.

**Owner's settled Succession rule:** old Rogue-charmed monsters survive **all** subsequent class changes, remaining owned and recoverable. Any non-Rogue successor cannot charm new ones. The existing Succession automatically presents all four registered classes; only small saved-class-count/roster-size validations and UI copy need updating.

## Baseline-first correction — latest owner direction

**Source-derived actual original level-1 classes** from `src/prototype/rules.js`: Paladin **HP 120 / Power 18 / Armor 8 / Speed 300**, Mage **90 / 22 / 3 / 300**, Ranger **105 / 20 / 5 / 320**. The Mage's **9** refers to **+9 Power per purchased Discipline rank**, not a 9 starting Power. The Rogue now adopts the **minimum existing base HP (90), Power (18), Armor (3) and Speed (300)** instead of invented intermediate values. 60 dormant MP is a proposal that also equals the minimum existing class MP. **No passive combat stats beyond the proposed hero-only crit progression.**

**Important:** three legacy heroes currently start with **Soldier and Archer**, while the Rogue starts with **zero** companions. Matching the minimum base stats does **not itself prove** level-1 balance; the first Charm's probability/time and survival are top-priority acceptance tests. Do not inflate Rogue stats to fix a bad opening—consider explicit, owner-approved Charm onboarding instead.

## Recommended default configuration — approve or adjust

| Knob | Proposed default, not already approved |
|---|---|
| Starting HP / Power / Armor / Speed / dormant MP | **90 / 18 / 3 / 300 / 60** (MP/Armor implementation detail P) |
| Talent per purchased rank: Power / Mana / HP / Speed | **+7 / +2 / +27 / +38** (P, minimum existing discipline coefficients) |
| Crit (base 10% + Rogue hero level) | **11% L1, 25% L15**; with 5 books **16% / 30%** |
| Ordinary guitar auto basic | **260 range**; 1 targeted primary at **0.8×(Power+12)**; up to **2** splash enemies at **25% primary damage**, once per **0.85s** before training |
| 3rd-basic finisher | One extra wider capped **Full Chorus**, max **5** combined targets, minor secondary Slow, no extra Charm |
| Charm starting chance | **12%** per legitimate *surviving primary auto hit*, independent of critical; never splash/multi-proc |
| Captured company | Current rank's active cap **+1**; species/subtype quota includes active + reserve + fallen; **12** total permanently charmed across roster proposed |
| Endure | Owner's **2s / 1HP**; **90s cooldown and expire-to-death unless healed** are suggestions |
| Normal + crowned art | **Two related static procedural character designs**; guitar always visible; no animation system |
| Summons | Owner idea preserved but **defer creating another AI actor**; current slot-7 candidate uses existing push/Weaken instead |

**Current class ordinary party caps:** Expedition 1–6 = **2,3,3,4,5,6**. Rogue proposed = **3,4,4,5,6,7**; full roster code and first six formation slots need a seventh valid position. Basic Barracks cap would be the ordinary Basic cap **+1** for Rogue.

**Tentative eight-slot palette:** 1 Cutting Chord (direct/wider guitar strike); 2 Off-Key Waltz (Slow); 3 Heckler’s Note (interrupt, cooldown debt and short charged Silence); 4 Rotten Serenade (DoT / healing reduction); 5 Tripwire Tango (two placement types); 6 Sabotage Verse (cooldown debt); 7 Stage Fright (push/Weaken in place of expensive extra summon actor); 8 Grand Finale (capped AoE offense and disruption). Each tap/charged form maps to one **existing critical lever** (damage, Slow duration, cooldown debt, Silence duration, push distance), one crit roll per legal action and **never** a multiplier of Charm chance.

## Three implementation risks worth watching

1. **Converting an enemy into company** is the core work: clear hostile pack/healing/aggro/respawn/target state without rewarding a kill or duplicating the actor, and convert to a safe trusted role. First candidate is a tagged Soldier/Archer with validated monster species provenance and ordinary friendly AI; alternate full type only if needed. Source stats are companion-normalized without leaking hostile elite/night multipliers. The exact profile calibration remains open.
2. **Succession and roster validation:** \`save.js\` still hardcodes a maximum of 3 fallen classes and Game Over exactly at 3, despite dynamic class choice. It also rejects a Rogue's seventh active companion. \`party.js\` troop formations have 6 slots and recovery recreates by type, losing charmed species. Each has a targeted fix; no redesign of Succession or navigation.
3. **Performance and visual honesty:** static heroine and crowned form; 1 bounded AoE action with max 3/5 targets, no added auto projectile actor, max 2 placed traps, no reserve AI, no live enemy-AI code on converted units, no body/pose/dance animation. Bounded audio and effects use existing Canvas/Pixi/PWA architecture.

## Read / approval path

1. [Original brainstorming + later binding owner clarifications](ROGUE_BARD_DISCUSSION_RECORD_20261026.md) — what is decided vs assistant ideas.
2. [Game mechanics, complete skill and critical tuning candidate](ROGUE_BARD_GAMEPLAY_BALANCE_CANDIDATE_20261026.md) — where to approve/adjust numbers.
3. [Two still-visuals: ordinary and crowned Dark Lord Rogue](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md) — precise palette, costume, guitar, art implementation constraints.
4. [Code owner map, housekeeping, risk ranking and test plan](ROGUE_BARD_IMPLEMENTATION_HOUSEKEEPING_20261026.md) — what engineers must actually touch.
5. [Extended source feasibility report](ROGUE_BARD_FOURTH_CLASS_FEASIBILITY_20261026.md) — background evidence.
6. [Inert structured candidate config](../tools/rogue-bard/rogue-bard-candidate.json) — convenience artifact for comparing prospective values, **never loaded by game**.

**Status / truth:** docs and one inert JSON config only. No game mechanics, assets or renderer modified. No source tests, benchmarks, CI, merge or deployment run. **Ready for a short owner design approval review; not ready to merge as a functional fourth class.** Once defaults are selected, implement in an isolated feature iteration and validate actual behavior, balance and performance before a separately approved release.
