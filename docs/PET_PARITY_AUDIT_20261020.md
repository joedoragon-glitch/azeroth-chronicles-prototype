# Pet parity audit — 20 October 2026

Review branch `audit/pet-parity-dev112`, based on published dev.112 / tree `268e940a46466b6f20b0a6e8fa72ace9e9a197d8`. Joel allows straightforward repairs but requires final approval before merging/publication and before **any pet nerf**. Prepared dev.113 is not live. No balance values or pet identities have changed.

## At a glance

- **Growth/inheritance/commands work.** All eleven families receive the same level growth, inheritance, vitality and rally benefits; FOCUS, BOSS/ADDS, Recall and critical retreat pass across all three heroes. Resting or re-hiring is unnecessary for skill updates.
- **Three behavior repairs prepared:** melee pets start skills at their existing listed reach; ranged pets choose supported firing positions; companions clear obsolete rejected-route state after reaching regroup formation.
- **Pets are generally weaker damage dealers than troops in the controlled comparison.** Level-20 stationary single-target output is 14–24% below Soldier for melee pets, 26–32% below Ranger for ranged pets. Utility, acquisition cost and encounter survival still matter. No nerf is recommended from this evidence.
- **Approval choices:** class-aware pet formations; basic cadence parity (0.95 → 0.85 seconds); subsequent individual skill/survival tuning. None of these are implemented.

## Shared growth and source findings

| Attribute without inheritance/training | Soldier | Ranger companion (`archer`) | Every pet |
| --- | ---: | ---: | ---: |
| Level-1 HP | 120 | 105 | 112 |
| HP per further hero level | 12 | 12 | 12 |
| Base armor | 8 | 5 | 6 |
| Basic hit at hero level L | 12 + 2L | 15 + 2L | 13 + 2L |
| Basic interval | 0.85 s | 0.85 s | 0.95 s |
| Basic reach | 65 | 280 in normal combat | 70 melee / 280 ranged |

`companionMaxHp`, `companionAttackDamage`, `companionArmor` and actual incoming damage include pets. Shared Training, Shared Strength, Companion Vitality and Ranger rally use the common companion path. Existing pet saves normalize base damage from current rules and read skill definitions live; re-hiring is not required.

Pets enter the same doctrine, danger/support judgment, critical-wound retreat, path support constraints and Recall code before their separate combat routine. Their ordinary formation offsets return before the hero-class-aware troop formations, so pet slots do not change between Paladin/Mage/Ranger. Ranged pets are explicitly among the units Soldiers screen.

Soldiers additionally have a low-health 2.5-second immunity with a 14-second cooldown; Expedition IV gives Power Strike a 20%/2-second ward. Rangers have veteran covering shots and cooldown-based party healing. Pets instead have family skills; only Little Lifebinder, Pebble Colossus and Cinder Cub have direct self-sustain/ward effects. The first pet skill needs no training; the second uses shared Combat Training II or learning hero Skill 2 from rescued Mira. Skills read current definitions, without resting or re-hiring.

## Individual assessment and plan — unchanged balance

30-second, level-20 actual ally ticks with both skills unlocked, no inherited bonuses, a supported stationary hero and zero-damage high-HP enemies. Values are delivered damage per second rounded to whole numbers; six-target cluster uses the actual targeting, area geometry and caps. A moving target follows a scripted lateral sine wave (maximum 240 units/second), overriding Slow: this is a dodge stress test, not natural enemy behavior or a survival/win-rate test. Different initial melee/ranged distances reflect each role. These runs deliberately use a comfortable firing lane; cramped-map behavior is verified separately.

| Unit | Single / cluster / moving DPS | Assessment and proposed next step |
| --- | ---: | --- |
| Soldier | 89 / 147 / 88 | Melee reference; extra immunity and veteran ward. |
| Ranger | 94 / 160 / 28 | Ranged reference; veteran covering Slow and party healing. |
| Thornpup | 72 / 85 / 72 | Low cleave output; retain Tripwire Slow, review damage after cadence parity. |
| Little Lifebinder | 64 / 76 / 18 | Lowest ranged output; 4% self-heal requires projectile contact. Review healing reliability/output together. |
| Mireling | 71 / 86 / 71 | Slow plus splash, no self-defense. Review modest melee durability. |
| Pocket Keeper | 68 / 81 / 19 | Narrow line/Slow adds utility, modest damage. Review line payoff against Ranger volley. |
| Little Treasurer | 77 / 95 / 77 | Stronger melee offense but no survival tool. Keep its damage role; review durability. |
| Pebble Colossus | 70 / 86 / 67 | Intended durable role is poorly supported by a 15%/2-second ward. Review ward strength/duration rather than copying Soldier immunity. |
| Ash Cadet | 70 / 102 / 70 | Best melee cluster result here, still below Soldier. Preserve cleave identity; assess after common cadence fix. |
| Veyrith Whelp | 70 / 84 / 20 | Best pet stationary ranged damage here; no defense. Keep burst identity, assess after common changes. |
| Little Marshal | 66 / 95 / 29 | Line/cone retains more damage against this dodging target. Do not nerf from this narrow advantage; preserve precision/control. |
| Cinder Cub | 68 / 88 / 65 | 25%/3-second ward is on the interruptible second. Review defensive reliability and uptime. |
| Pocket Sovereign | 77 / 87 / 77 | Comparable to Treasurer despite final-boss unlock; two-target second cap limits group payoff. Decide whether late unlock should mean power or an alternative playstyle. |

Recommended sequence: approve the mechanical repairs; approve class-aware positioning and a modest common cadence increase; then evaluate individual ward/heal/cleave adjustments. Do not apply a blanket skill multiplier or demand that every utility pet match raw Ranger damage. Cadence parity adds 11.8% to basic-only attack rate, not 11.8% to total skill-inclusive damage. New family-specific changes need a separate checked candidate and owner review.

## Behavior findings and prepared repairs

1. **Confirmed 14/14 melee skill-range failures.** All seven melee families have a first and second skill beyond 70 reach, but `updatePetCombat` previously gated skill selection behind basic range. The repair tries legal melee skills before closing, like Soldier behavior. Each skill's original reach, line, training, cooldown, charge and contact checks still apply; basic reach remains 70.
2. **Unsupported ranged firing destination.** With a target occupying its anchor, a ranged pet could select a legal firing position farther than the shared 280-unit support limit. Navigation rejects it, then caution replaces active skills. Candidate positions now obey the same existing support limit. The original automatic range fixture reproduced the problem at zero target distance; the fix restores its real second-skill activation.
3. **Stale rejected pursuit after regroup arrival.** `followCompanion` ordinarily clears rejected pursuit state during non-pursuit travel, but no travel call happens for an ally already at its regroup point. The stale flag then permanently fails reassessment. Arrival now clears that completed travel state. Fresh wounds, enemy pressure and future unsafe routes still veto combat. This repair applies to Soldier/Ranger too.

Pet formations remain class-blind: their early-return slots do not adapt to Paladin versus Mage/Ranger. That is a design gap, held for approval. Shared target control works: manual selection directs the party in FOCUS; GUARD deliberately screens threats instead. BOSS/ADDS follows the same explicit doctrine for pets and troops. Melee pets are not Soldier-style dedicated screeners; ranged pets are among the allies Soldiers protect.

## Audit evidence and limitations

`tools/pet-parity-audit-20261020/check.cjs` records 189 growth, inheritance, command/save/safety/healing, combat, reach and close-target positioning cases in `before.json`/`findings.json`. Both party owners load from dev.112 for the baseline. The two reports have exactly equal stats, inheritance, formations, ordinary combat damage/cast totals and command contracts. Melee moving-target travel differs slightly because skills can start earlier; the reach/close-target positioning reproductions improve. To reproduce the baseline from a clone containing that commit:

```sh
PET_AUDIT_BASELINE=1 PET_AUDIT_OUTPUT=tools/pet-parity-audit-20261020/before.json node tools/pet-parity-audit-20261020/check.cjs
node tools/pet-parity-audit-20261020/check.cjs
```

`PET_AUDIT_BASELINE_REF` can select an equivalent local checkpoint; recorded local baseline used `487d6f7`, with the same dev.112 pet source. Core numerical/command results do not depend on this override. These fixtures do not certify all maps, family win rates or optimal balance. Low incoming damage is intentional so survival effects are assessed from actual activation/mitigation tests and source contracts, not invented survival statistics.

Final verification passed: existing pet lifecycle, activation/contact healing, 132 visual effect frames, automatic ranges/charges/real Mine wall routing, squad doctrine, judgment, one-press Recall and veteran troop checks; new 161-case melee reach/gate regression and 13-role stale-regroup regression. The latter two regressions also fail against the original source as expected. The numerical/behavior matrix passes all 189 prepared cases; 14/14 melee reach failures and 12/12 unsupported close-target positions/second-skill failures are repaired. Reviewed the actual source diff: no rule, stat, timing, damage, progression, appearance or formation changes.

Build, generated syntax/asset integrity and sprite/material/audio scope checks pass. Changed-source formatting passes. Whole-repository formatting retains only its pre-existing unrelated `tools/sprites/approved.json` warning; that approved-art metadata was not changed. The final audit corrected an early description of Ranger healing (cooldown-based, not a consumable), and repaired a test fixture's relocated enemy home before using its close-target damage evidence. No broad campaign/device matrix or merge/publication was run. Main remains `e0ce4a90451f88699dfbb2e93af08411cf808235` / live dev.112.
