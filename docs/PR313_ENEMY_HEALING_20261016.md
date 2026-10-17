# PR #313 enemy-healing correction — 16 October 2026

Joel reported enemy recovery appearing on the hero and requested explicit ally/enemy recognition while final validation was running. This continuation stays on the existing integration branch. Merge and deployment remain deferred.

## Assessment and correction

Normal enemy support selected only the current monster array, and new actual-HP checks found no hero/companion healing under a valid roster. However, `enemyHealTeammate` itself accepted any living non-neutral actor; it did not independently identify sides. The new `enemyHealingActor` boundary requires a living non-neutral current monster/boss, rejects the hero and every party member explicitly, and protects caster admission, recipient selection, approach and ongoing regeneration. Tests deliberately contaminate the enemy array with the hero, Soldier, Archer and all eleven pets: all twelve healer species must still heal only a monster. Forged enemy regeneration on the hero is discarded. Cross-species monster support and existing self-healing exceptions stay intact.

A concrete visual defect was reproduced before repair: after a recipient moved from x995 to x1075, its burst still rendered at x995, potentially under the hero standing there. Enemy recovery now follows the actual living recipient and caster; dead, neutral or departed recipients cannot leave a burst behind, and unresolved enemy events cannot fall back to player coordinates. Native production-painter checks are integrated into the existing Chromium/WebKit Community matrix for the five principal profiles. The original failure and focused execution logs are retained locally and in the PR record; they are not relabeled passes.

Runtime/build/cache are `0.9.1+snapshot.dev.74`. No healing amount, threshold, cooldown, duration, damage, save schema or authored balance policy was retuned.

## Validation and balance accounting

The existing study cannot certify changed engine code. A fresh eight-part 6,912-candidate observation is therefore required. All 3,072 completed #308 baseline observations, including the one original exception, are preserved in the new complete cache with original partition SHA-256 receipts; the original 2,336-row cache and historical evidence stay untouched. The observer changes only the seed path; authored `cases`/`trial` remain byte-identical.

The balance workflow now starts for this branch's engine/observer/complete-seed updates. Its provenance gate selects a real hosted run whose runtime, policy, observer and seed match, waits for success, then verifies every current runtime byte against the actual observed commit, all eight partitions, 6,912 unique candidates, 3,072 exact retained baselines and no candidate exceptions. Test/docs-only follow-ups can reuse that exact-input run; changed runtime cannot. Legacy fixed-run verification remains available as historical code, not a certificate for dev.74. Fresh selection/admission tests reject stale engine/render/observer/seed receipts, missing owners, incomplete baseline reuse, HTTP failure and malformed commits. Synthetic source-gate tests claim no gameplay outcomes.

Build, formatting and generated/assets checks pass locally. Focused enemy-healing and terrain-rendering tests pass. Final current-source Node/Chromium/WebKit/PWA/performance checks, completed fresh observations and their outcome review remain pending; previous f30e3e6 runs are superseded for runtime certification. No merge/deployment.
