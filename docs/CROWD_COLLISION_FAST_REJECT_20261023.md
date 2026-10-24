# Crowded movement collision: safe broad rejection candidate — 23 October 2026

**Status:** Focused optimization draft, not merged/deployed. Baseline main `cdc2a94`. The optional crowd profiler #423 and emergency frame skipper #422 are separate draft workstreams, not pulled into this branch.

## Mechanism

Crowded actors can generate many repeated swept movement and separation checks. The existing `navigation.js::blocked()` evaluates authored terrain and world props, including many circular obstacles remote from the movement probe. Before this candidate, each prop could require one precise `Math.hypot` calculation to reject it, or two when an object is close enough to receive the authored scenery-radius treatment.

This candidate adds a **strictly necessary bounding-square check** for circular terrain and props: if a single X or Y axis already lies outside the maximum candidate collision radius, that circular obstacle cannot overlap the sample point, so no square-root distance is needed. Props still use their **current** coordinates, radius, decoration/structure state and authored clearance; no spatial cache or stale-coordinate risk. For close props, one precise distance is calculated and reused for both existing clearance decisions. The same exact boundary inclusion/exclusion rules remain, including fort destructible-prop exclusions, LOS/zero-radius queries and the existing scenic movement-radius policy.

This is **not** an algorithmic change to pathfinding, grid cell dimensions, AI targeting, congestion escape, actor collision, damage, warning, frame timing, movement or saves.

## Verification

Focused test `tests/crowd-collision-fast-reject.test.cjs` reconstructs the original collision implementation directly from the source by replacing only the two newly optimized expressions and installing that implementation on a distinct Campaign subclass. It compares the actual old and new implementations across thousands of position/radius queries, boundary points, decorative scenery, special radii, scenery changes and fort exclusions; and compares complete campaign snapshots every step during narrow-corridor crowded movement. It also checks a synthetic remote-scene fixture using counted `Math.hypot` calls and prints comparative Node durations, without asserting time thresholds. Direct existing `crowd-escape` and `retreat-party-collision` focused contracts are executed by the same test.

CI will run only mapped relevant scripts, syntax and reproducible offline-ready build. Broad/full device/browser matrices are not authorized. Optimized collision geometry does not guarantee more FPS or eliminate CPU-heavy enemy reasoning. Any real-device gain needs a matched crowded-fight test.

## Verified focused result

[Focused GitHub Actions run 40059040250](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40059040250) completed successfully. The impacted tests included `architecture` and `crowd-collision-fast-reject`, which also executes existing `crowd-escape` and `retreat-party-collision` tests. The multi-file Pages/PWA contract and reproducible offline-ready build passed.

The test's deterministic 600-remote-prop fixture issued **3,200 collision queries** against actual current and reconstructed historical navigation code. Results:

| Metric | Baseline | Candidate |
|---|---:|---:|
| Precise `Math.hypot` invocations | 1,849,219 | 689 |
| Queries classified blocked | 421 | 421 |
| Elapsed Node time in shared runner | 183.44 ms | 113.61 ms |

**Interpretation:** The candidate avoided **1,848,530** precise-distance calls (~99.96%) in this specific synthetic scene, with about **38% less synchronous elapsed time** on that one hosted run. The counts demonstrate effectiveness of fast rejection, and the identical 421 results confirm equivalence for this fixture. The timer includes Node and test instrumentation variability; neither ratio is a measured player FPS increase or a reliable forecast for all game regions/encounters.

The test also compared thousands of current/legacy collision queries, actual narrow-lane movement snapshots over 25 simulation steps, mutable/scenery props, fort exclusions, and retreat/crowd-escape regression rules. These outcomes matched. No full browser, cross-device, all-environment or extreme-load live playtest was run.

## Release boundary

No release bump, merge, automatic publication or unrelated setting changes. Review this PR independently, then reconcile against any changes merged from diagnostic #423 or emergency #422 before owner-authorized release.
