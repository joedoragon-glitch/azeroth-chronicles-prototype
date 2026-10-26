# Melee basic range regression audit — 2026-10-26

## Decision and scope

PR #496 introduced a **90-world-unit minimum** for enemy ordinary, guardian,
elite/Ringleader, captain and boss melee basics. A post-merge correction kept
Soldier swords at 65 and melee pets at 70. Draft PR #499 explicitly proposes
independent **90-unit** basic reach for those two friendly roles.

This audit covers actual **basic attack** admission and damage, not authored
special abilities, ranged shots, or the separate Greenwood interception.

## Production-path review

- `engine.js::enemyMeleeBasicRange(e)` returns the 90-unit floor for all native
  melee tiers while retaining `e.meleeBasicRange` when longer.
- `engine.js::updateEnemies` chooses melee/ranged stance, calculates range, tests
  distance, cooldown and line, then calls `enemyStartBasic`; out-of-range
  melee enemies pursue with the same reach.
- `boss-combat.js::enemyWithdrawalAction` has a **separate** covering-basic path
  and applies the same enemy melee range helper.
- `boss-combat.js::enemyStartBasic` is a release owner and does not recheck
  melee distance itself; both production call sites currently guard it.
- Ordinary hybrid stance moves into melee at 90; Ringleader hybrid switching
  happens at 120 but its regular melee basic still has 90 reach.
- The proposed friendly values use
  `R.balance.companions.meleeBasicRange = 90` in Soldier normal/counter/Recall
  and melee pet normal/counter/Recall/approach checks. The Archer basic remains
  185, ranged pets 280, and Paladin basic 120.

## Direct 90-unit enemy regression

`tests/enemy-melee-basic-reach-matrix.test.cjs` passed **38 cases** in the
2026-10-26 [focused CI run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40406140564).

The matrix creates native actors in collision-verified outdoor corridors and
checks actual hero HP after a 0.01-second enemy update and after separate
withdrawal basics, at 85 and 95 units. It includes ordinary, guardian,
Ringleader, captain, room captain, field captain, boss, ordinary hybrid and
Ringleader hybrid. It also checks an authored 120-unit boss minimum at 115
versus 125 units. The hit/no-hit observations passed in all roles; no separate
forgotten 65-unit enemy basic attack path was found.

## Broader regression comparison with unchanged main

The **same 18 unchanged native integration suites** were executed on both:

1. Proposed-change [CI run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40406140564).
2. Unchanged-`main` [control CI run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40407090862) via temporary, now-closed draft [PR #501](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/501).

**10 passed on both branches:**

`enemy-reach-regroup`, `hybrid-dual-role-ai`,
`captain-mechanics-audit`, `critical-world-basic-native`,
`critical-world-boss-batched-native`,
`critical-world-captain-areas-native`,
`pet-formation-cadence`, `critical-troop-native`,
`critical-pet-native`, `companion-regroup-resume`.

**The same 8 failed on both branches:**

`enemy-withdrawal-actions`, `dungeon-pressure`,
`boss-retreat-recovery`, `ringleader-coverage`,
`enemy-sight`, `melee-pet-roles`, `pet-combat-reach`,
`squad-boss-priority`.

They are real existing regression debts, **not newly introduced by this PR**.
Some assert obsolete encounter locations/arrangements or pre-opening skill
permissions; none should be silently marked passing or automatically fixed as
part of the narrowly scoped melee-range work.

The one-off 18-suite comparison runner was removed from PR #499 after
recording evidence, so unrelated failing baseline tests do not become new
mandatory CI gates. The direct enemy matrix and focused companion reach
regressions remain checked in.

## Follow-up guardrails

- Keep the friendly and hostile balance levers distinct even though both
  currently equal 90.
- When adding a new enemy basic caller, gate it through
  `enemyMeleeBasicRange`, cooldown, line and target validity. Consider an
  inner safety check in `enemyStartBasic` if a third caller is added.
- Fix the eight existing legacy test failures in separately scoped maintenance,
  comparing against pre-change behavior before altering production combat.
- Check final PR #499 focused CI, build and deploy eligibility before merging.
  This audit does not authorize merging or publishing.
