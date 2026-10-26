# Melee reach balancing — integration and merge-readiness record
Date: 26 October 2026

## Consolidation decision

**PR #503 is the complete proposed change.** It includes the Soldier/melee-pet
basic attack reach implementation originally reviewed in **PR #499**, its native
attack-boundary tests, and the new central balancing workbench. PR #499 is
superseded for implementation purposes; it is **not a second independent
change to merge**. Both PRs began as drafts and were not deployed.

Current default resolved **basic melee reach** in PR #503:

| Role | Effective reach (world units) | Ownership |
| --- | ---: | --- |
| Ordinary hostile melee and guardians | 90 | `meleeReachTuning.enemy` or `shared` |
| Elite hostile melee: Ringleader, captain, boss | 90 minimum | `elite` or `shared`; preserves longer actor-authored reach |
| Soldier companion sword basics | 90 | `soldier` or `shared` |
| Melee pets, seven families | 90 | `pet` or `shared` |
| Ringleader hybrid melee **stance** switch | 120 | elite basic reach + 30, **not** a 120 hit radius |
| Paladin basic | 120 | unchanged class tuning |
| Archer companion basic | 185 | unchanged companion basic |
| Ranged pet basic | 280 | unchanged ranged pet basic |

Hero Mage/Ranger basics, ranged enemies' native shooting reach, defensive
spacing unrelated to melee stance, damage, cooldowns, special abilities, and
collision sizes are not altered by the workbench.

## Live main reconciliation

The workbench branch was explicitly reconstructed on **main commit
`4ac1d4a6eeaff8958458a0253306021df9e1b085`**.
That commit merged **PR #502, native Greenwood Pursuit Burst**, retiring
the Vale Interception warning, rush, extra damage and Slow. No retired Vale
Interception code was reintroduced in PR #503. Its built-in Pursuit Burst
speed/cadence are kept unchanged by melee-range tuning.

An independent concurrent **draft PR #500 (Combat Arena)** modifies
`src/prototype/engine.js`, alongside app/navigation/rendering/persistence
files. The engine hunks inspected in #500 add an arena mode, lifecycle and
zone handling; they are separate from PR #503's enemy reach helper comment
and friendly-melee rules, so no *current* main conflict is established.
**#500 has not been merged as part of this work.** If it or another PR
lands on `main` first, compare/rebase #503 on the new head and rerun
focused CI and the reproducible build before merge. Do not merge a stale
branch merely because an earlier workflow run was green.

## Tested safeguards

- The actual enemy basic/withdrawal attack matrix tests nine role profiles
  with damage at `reach - 5`, no melee damage at `reach + 5`, plus preserved
  longer authored boss reach. This is a native simulation, not only a
  configuration assertion.
- Soldier normal and counter basics and seven melee pet families' normal and
  defensive basics use the corresponding dynamic in/out boundary. Ranged pet
  projectile and Archer basic ranges are checked separately.
- The central workbench test validates serialized overrides, an inheriting
  default, alternate shared 70/110 values, mixed elite/companion overrides,
  input validation, unchanged ranged/special settings and source hash.
- The CLI updates the canonical source SHA-256 evidence whenever values are
  applied; the existing sprite-scope test rejects stale or mismatched sources.
- Native Greenwood Pursuit Burst and hybrid AI tests remain in the focused
  verification command.
- The original 38-case 90-unit enemy experiment and the 18-suite matched
  `main` comparison (10 pass, identical 8 older failures on both branches)
  are preserved in
  [the historical melee regression audit](MELEE_BASIC_RANGE_REGRESSION_AUDIT_20261026.md).
  These eight older suites should not be represented as newly fixed by this PR.

## Merge checklist

- [x] Incorporate original PR #499 Soldier, pet and hostile test coverage
- [x] Put repeatable role-level tuning behind one shared/override table
- [x] Preserve the updated Greenwood native Pursuit Burst from PR #502
- [x] Document balance command, examples and regression provenance
- [x] Keep older game and special-attack tuning isolated
- [ ] Confirm the latest PR #503 focused CI AND reproducible-build result
- [ ] Confirm the latest `main` SHA and review any new concurrent merges
- [ ] Approve/satisfy repository review and branch protection requirements
- [ ] Merge **only PR #503**, then confirm published Pages revision and
      behavior by deliberate gameplay testing

**Scope of authorization:** Preparation and review, **not merging or
deploying**. No live player save changes are required for the tuning source.
