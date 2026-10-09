# PR #146 integrated rogue audit · v0.8.111

## Integration contract

Reconcile `rogue-signature-disruptions-audit` at `274a43e` with main at `9e62703`. Main then advanced to `527df5d` (PR #161, visual-only enemy VFX event bridge). That additive bridge, generated script graph, projectile-impact hooks and its equivalence tests are also preserved; release advances to v0.8.111 to avoid reusing its cache version. Keep the authored repertoire and decisions in `ROGUE_AI_PHASE2.md`: twelve melee/ranged ringleader pairs, five captain basics/signatures and eleven normal/TRUE boss basics/signatures. No new normal boss summons, alternate rotations, level gates, woundedness thresholds, forts, world placements or sprite revisions.

Main's stronger burst tier redistribution, manual target lock, dynamic BOSS/ADDS companion doctrine, occlusion rendering and pure VFX identity/inventory foundation remain present. A structural comparison of every exported rules table with main found changes only in the authored rogue repertoire; summon plans, compression curves and all other tables remain equal. Sprite scope and source lineage remain unchanged; the checked-in scope report only updates the rules-source fingerprint. Generated build info and service-worker cache advance to v0.8.111.

## Behavioral findings and corrections

- **Dust and owned adds:** the newer ADDS doctrine included owned summons through a second target list, bypassing dust exclusion. Both lists now honor direct targetability. While dust lasts, the squad targets another valid threat or its existing boss fallback; the add regains priority when cover expires. Class defaults, manual doctrine persistence and new-wave handling remain intact.
- **Local respawns:** Ashen/Cindermaw/Dark Lord field replenishment previously engaged every revived native troop, including posts outside the existing support radius. Distant records now return to their posts without automatic aggro. Original IDs, native spawns, local thresholds/cap, quest completion and owned-summon exclusion are retained. Captain revival also avoids occupied living-companion posts; Cinder Warlord's ordinary order cannot revive guardians.
- **Authored rally:** Broodscreen/Crown Decree explicitly rally nearby living, already engaged owned troops. Idle/distant summons are not pulled; none enters field counts, changes owner/health, or creates a new summon. Existing normal/TRUE caps remain untouched.
- **Encounter lifecycle:** dust is cleared on reset/death and stripped from snapshots/restoration. Hero death clears reposition allowances. Basic and signature resolution stops if a hit ends the encounter, so no stale slow, scatter or replenishment runs after death. Basic boss/captain dashes use the same bounded reposition record as signatures.
- **Test timing:** the browser charge-readiness fixture is isolated from hostile AI, matching the existing input/geometry fixtures. It records exact MP and cooldown at the real native-input cast boundary rather than confusing later frame regeneration with cost. Separate rogue browser tests exercise actual dust and scatter, rather than suppressing them in gameplay.

## Effectiveness evidence

`tests/rogue-integration.test.cjs` resolves **99 basic cases** and **51 signature cases** through live `updateEnemies` warning/resolve/recovery, covering ordinary/guardian/ringleader species × roles, five captains and both forms of all eleven bosses. Assertions verify actual damage and intended slow, shove, scatter, withdrawal or sidestep, multiple marked pursuers, recovery, and unchanged normal attack cadence. All 51 signatures also have dodge and real solid-cover checks. The original 78 focused audit scenarios remain intact.

Additional integration scenarios exercise automatic thinking/one-action decisions, dust-covered owned adds for all hero classes, exact cover expiry, commander post safety, active brood/Crown rally, save/reset/death cleanup and lethal-hit cancellation. Existing regression suites separately cover chain retreats, real escape, damage protection, targeting, boss opening/rotations/summons, captain phases, burst compression, saves and all authored maps.

`tests/rogue-browser.test.cjs` checks real Canvas warning text at device pixel ratio 3, full wrapped names/countdowns, day/night scenes, dust manual-lock interruption, forced scatter and control recovery at 1280×800, 375×800, 393×852 and 844×390. Chromium and WebKit execute this gate in both PR and main CI. Screenshots are retained with the workflow's existing browser artifacts.

## Release gates and limits

Build, formatting, asset/scope checks, all non-browser regressions, the full Chromium presentation/input matrix, phone WebKit, audio/terrain/showroom browser checks, and dedicated rogue browser checks must pass on the integrated candidate. Main deployment remains conditional on main-test and phone-webkit success, then compares published `build.txt` with the exact merge commit and smoke-tests live desktop/phone entries. PWA cache version is independent of v4 campaign save keys.

These deterministic and browser audits establish functional execution and authored tactical outcomes. They do not measure long-term player difficulty, physical iPhone system gestures or actual Chromebook performance. Monster forts and the separate map/structure and full VFX-production work remain independent tasks; this integration does not claim them complete.
