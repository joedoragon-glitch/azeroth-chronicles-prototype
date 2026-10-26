# Melee basic reach balancing workbench

Melee **basic attacks** now have one source of truth:
[`src/prototype/rules.js`](../src/prototype/rules.js), at the very top,
in `meleeReachTuning`. For repeatable experiments use
[`scripts/tune-melee-reach.cjs`](../scripts/tune-melee-reach.cjs).
It is a development command, **not an in-game settings menu**, and it never
changes a player's save file.

## Quick changes

From the repository root:

```sh
node scripts/tune-melee-reach.cjs --show
node scripts/tune-melee-reach.cjs --all 80
node scripts/tune-melee-reach.cjs --all 80 --apply --verify
```

The second command **previews** the change without writing. The third writes
the values, repairs the mandatory `rules.js` sprite-scope fingerprint, and
runs five melee-specific native test suites. Commit the resulting source and
evidence changes together on a development branch.

## Independent values

| Knob | Default | Affects |
| --- | --- | --- |
| `shared` | 90 | All inheriting basic melee roles |
| `enemy` | inherit | Ordinary hostile melee, guardians and ordinary hybrid stance |
| `elite` | inherit | Ringleaders, captains, bosses and their basic melee |
| `soldier` | inherit | Soldier companion sword basics, regular and counter/Recall paths |
| `pet` | inherit | All melee-pet families, regular and counter/Recall paths |
| `ringleaderStanceBonus` | 30 | Extra stance switch distance above elite basic reach; **not** a hit-range increase |

A role with `null` in the source table **inherits `shared`**.
Examples:

```sh
# Everyone goes to 75, regardless of previous overrides:
node scripts/tune-melee-reach.cjs --all 75 --apply --verify

# Hostile ordinary monsters have 85 basics; the other roles stay as authored:
node scripts/tune-melee-reach.cjs --enemy 85 --apply --verify

# Stronger boss/captain reach without extending ordinary enemies:
node scripts/tune-melee-reach.cjs --elite 105 --apply --verify

# Allow Soldiers to reach 95 and melee pets to reach 80:
node scripts/tune-melee-reach.cjs --soldier 95 --pet 80 --apply --verify

# Return one role to inherited shared reach:
node scripts/tune-melee-reach.cjs --pet inherit --apply --verify

# Change only inherited roles while retaining explicit overrides:
node scripts/tune-melee-reach.cjs --shared 80 --apply --verify
```

Accepted basic attack values are integer **30–200** world units. The stance
bonus is **0–100**. These are input safeguards, not a gameplay recommendation.
Changing multiple values at once is supported.

## What updates automatically

- Ordinary enemy basic attack selection, close/pursue movement and tactical
  withdrawal checks share one resolved hostile value.
- Elite enemy basics keep their distinct override and preserve
  `enemy.meleeBasicRange` if an individual actor was authored with longer
  reach.
- Greenwood's reusable native Pursuit Burst reads the same tuned melee reach
  for out-of-range chase decisions. Its existing movement speed, recovery,
  no-warning/no-bonus-hit rules and eligibility remain unchanged.
- Ringleader hybrids switch at **elite hit reach + 30** by default, but their
  actual basic hit stops at the elite hit reach.
- The Soldier and melee pet attack/approach, defensive counter and Recall
  paths all use their separately resolved values.
- The source fingerprint used by `tests/sprite-scope.test.cjs` is updated
  with each applied CLI edit.

**Not affected:** Paladin autoattack (120), Archer basic (185), ranged pet
basic (280), Mage/Ranger basics, enemy ranged shot distances, charged skills,
boss/captain authored specials, attack cooldowns, damage, or collision size.

## Interpreting reach and tests

If `shared=80` and there are no overrides, a Soldier and a normal Goblin can
both hit at **75 units**, but neither can hit at **85 units** before pursuing.
If you set `elite=105`, the boss basic can hit at 100 but not at 110, and a
Ringleader hybrid enters melee stance at **135** while closing the last 30
units to land a melee basic.

The tests derive in-range and out-of-range distances from the resolved tuning
values, not a hardcoded 90. The hostile regression also tests guardian,
captain, boss, ordinary hybrid and Ringleader hybrid, including the separate
withdrawal basic. The companion test exercises normal and defensive basics
for Soldier and all melee-pet families.

Use this workflow for future experiments: **preview → apply → verify →
playtest spacing → commit the values**. Do not merge or deploy until both
focused CI and a deliberate gameplay review are satisfactory. Tests cover
mechanical validity; they cannot determine whether a particular value *feels*
fair, or certify unrelated legacy systems.

The previous frozen 90-unit audit is kept as historical evidence at
[`MELEE_BASIC_RANGE_REGRESSION_AUDIT_20261026.md`](MELEE_BASIC_RANGE_REGRESSION_AUDIT_20261026.md).
