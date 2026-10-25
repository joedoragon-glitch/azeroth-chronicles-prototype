# Premerge audit — runtime workload repairs, dev.177

Scope: review of PR #442's actual source, preservation tests and integration with main `40516fdfef592594de91e3410a7788de0e1b2f25` (the shipped dev.176 save-recovery update). The owner authorized merge after this audit. No full-game suite or browser matrix is part of this review.

## Findings corrected before merge

1. **Incomplete reference retention:** friendly projectiles use `target`, whereas the cleanup tracked `targetId` and source IDs. The audited candidate retains either field. A new target-projectile assertion exercises the missing case. Current native death handling often cancels such shots first; this was a defensive lifetime gap, not a reproduced player-visible damage bug.
2. **Test prerequisites:** the original night-tempo fixture artificially set aggro without completing first-kill field admission. The native opening owner reset it, making the measured cooldown ratio 0/0. The test now calls the existing `completeFieldOpening` helper, then exercises the original unchanged melee/ranged cadence, aiming and pursuit assertions. No production timing/balance adjustment was made.
3. **Future regression protection:** focused CI now maps engine/opening edits to the original night-tempo suite and engine/world/navigation edits to the new preservation suite. Policy tests enforce those mappings, so source-only follow-ups cannot silently omit them.
4. **Small-query overhead:** sparse scenes, terrain-only sweeps and tiny segments bypass shortlist allocation entirely. This retains the original path where a shortlist cannot repay its cost.
5. **Integration/version collision:** main already shipped dev.176 save recovery while this draft was being prepared. The candidate incorporates that main and advances to dev.177 with regenerated version/offline metadata, preserving recovery code and tests.

## Architectural and correctness review

- World changes do not bypass `zone()` wholesale. Dynamic population/eligibility/role inputs remain observable immediately. Only fixed post data, already-correct forced-role outputs and already-complete upgrades avoid repeated work. Existing post-distance invalidation still follows home-coordinate changes.
- The collision shortlist overestimates each prop's possible radius, retains unusual/non-numeric entries for the original predicate, preserves list order, and never caches blocked/free results. It lives only within one synchronous read-only LOS/segment operation. Garun equipment creation/movement and restored layouts occur outside that lifetime, so the next query observes them. Exact contact sampling, zero-radius LOS, terrain checks and fort permissions are unchanged.
- Cleanup applies only to dead, paid ordinary dungeon reinforcement guards. All original records, living units, summons, elites, owners, respawns, ongoing heal sources, pending elite receipts and active attack references are protected. Wolf/Ogre/Archer corpses remain when commander support could reuse them, independent of present range. Tests invoke the native commander-support method and verify actual revival, not only a stored flag.
- Reinforcement population limits depend on living guards and authored formations. Removing eligible dead records neither changes those counts nor consumes/reuses IDs or random draws. Wave comparisons assert identical surviving state, all living identities, all original bodies, rewards and event order. Hero-participation cases exercise actual elite arrivals across every native dungeon roster.
- Latest checkpoint recovery is integrated unchanged. Its focused rotation/migration/stale-write/acceptance suite passes against the integrated candidate. No save schema or key change is introduced by these optimizations.

## Evidence and limits

The preservation suite passes same-step comparisons for world setup, mutable roles, travel and engaged combat; geometry mutation/route/exception boundaries; thirty seeded waves; every native dungeon roster with paid kills and elite arrivals; active references; real commander revival; and v4 validation/restore. Night-tempo and focused CI-policy checks pass after the fixes. Existing collision/crowd/travel/retreat, fortification/low-cover/arc/speed, projectile-order, onboarding, ranged-pet and enemy-healing checks cover the affected owners. Build/generated checks are the required release gate, alongside the focused CI run on the final commit.

The frozen dev.175 method fixture remains valid for simulation comparisons: the intervening main update changed browser persistence/recovery rather than these world/navigation mechanics. Timings in `RUNTIME_WORKLOAD_DEV176.json` are preliminary local synchronous CPU evidence, not a benchmark of final device FPS, GPU time or input latency. This audit does not claim all `zone()` reconciliation has been optimized.

Three inherited broad art/tool validators remain separately documented in `RUNTIME_WORKLOAD_DEV177.md`: stale ore-sorting-bay canon, missing March palette evidence and the material-reference sandbox's missing `require`. Each was reproduced with untouched pre-change source. No art/assets are changed or reapproved here. The project's standing owner policy uses focused validation and reproducible packaging for release; it does not require an unrelated art/tool overhaul or the manual comprehensive matrix for this update.

Disposition: the identified correctness and assurance gaps are repaired. Merge remains gated on the final integrated focused CI result; deployment must then be verified separately. No device-wide performance or whole-game certification is implied.
