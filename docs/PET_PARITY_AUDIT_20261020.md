# Pet parity audit — 20 October 2026

Audit only, based on published dev.112 / tree `268e940a46466b6f20b0a6e8fa72ace9e9a197d8`. Joel requested an assessment and plan, including each pet individually, before deciding balance changes. No live stats, AI or saves are changed.

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

Soldiers additionally have a low-health 2.5-second immunity with a 14-second cooldown; Expedition IV gives Power Strike a 20%/2-second ward. Rangers have veteran covering shots and consumable party healing. Pets instead have family skills; only Little Lifebinder, Pebble Colossus and Cinder Cub have direct self-sustain/ward effects. Skill multipliers, area caps, range, movement and actual activation must be compared case by case.

## Verification pending

- Numerical growth/inheritance/armor and existing-roster refresh for all eleven pets.
- Actual FOCUS/GUARD and BOSS/ADDS targeting, manual hero target, class defaults, Recall and retreat.
- Stationary single/multiple targets and moving-target runs, with honest limits on what each controlled fixture demonstrates.
- Family-by-family assessment and a staged plan separating shared behavior defects from balance choices.
