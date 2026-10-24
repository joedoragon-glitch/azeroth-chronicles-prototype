# Crowd movement diagnostics — focused instrumentation stage

**Scope:** This is an observational diagnostic candidate based on `main` at `cdc2a94`. It does not modify movement decisions, actor collision, AI, damage, frame skipping, saved data, or combat recovery. Draft PR #422 (emergency slowdown protection) remains a separate, unmerged change.

## Why this measurement comes first

A real crowded encounter may repeatedly run swept terrain checks, scenery collision, candidate actor tests and passive separation. Existing full route planning is already capped at four calls per simulation tick, including a hero-reserved opportunity. The current frame profiler lumps these navigation costs inside party/enemy simulation. The purpose of this instrument is to separate likely movement work from general combat, not to assume the cause of hardware FPS loss in advance.

## Opt-in operation

Open **Game and Settings → Screen and Performance → Show Performance Details → Start crowd profiling**, close menus, play the fight, then return and select **Stop crowd profiling**. The Performance Details section shows a compact summary. **Save and game management → Export playtest report** now includes `performance.crowdDiagnostics` alongside the existing `frameProfile` and renderer timings.

The recorder is Off by default, holds at most the latest **120 active simulation ticks**, stays memory-only on the device and is never written to a v4 campaign save or preferences. It wraps methods only on the sampled Campaign instance while the player has opted in. Stopping removes the wrappers and restores the original methods exactly. Opening a menu freezes the simulation and does not add idle redraws as samples; previously recorded samples remain readable/exportable.

## What is measured

Per active tick, metrics include:
- Actual `move` calls, total method time and resulting `clearSegment` invocations.
- `clearSegment` calls/time and exact **`blocked` calls executed from its sampling loop**, not merely potential sample positions.
- Total `blocked` calls/time across navigation consumers.
- `actorStepAllowed` calls/time, counts of actors returned by `nearbyActors` queries, and maximum actor occupancy of a 96-unit spatial cell.
- `separateActors` calls/time, body count on its broad-phase refresh and swept-segment checks initiated during separation.
- Full `route` calls/time.

Each metric exposes tick-level mean, p95, maximum and sample count. **Times are inclusive and overlap**: a `move` can include `clearSegment`, `blocked` and `actorStepAllowed`. Never add stage times together. Opt-in wrappers and the clock calls themselves have measurement overhead, especially for very frequent collision calls. The counters offer a useful structural comparison; these figures are not certified hardware costs or real presented FPS.

## Focused reproducible characterization

`tests/crowd-diagnostics.test.cjs` runs deterministic open-field and terrain-authentic narrow-corridor scenes with 3, 8 and 16 enemies. It compares exact campaign snapshots from sampled and unsampled runs, checks relative increase in nearby actors for dense groups, validates bounded history and wrapper cleanup, and samples the real app frame-loop without contamination from a menu frame.

Focused checks only: this test, existing `crowd-escape`, and directly relevant menu/runtime tests, plus syntax and reproducible offline build. No broad browser/phone/WebKit, full-game CI, or performance benchmarking is authorized by this stage.

## Initial focused CI evidence

GitHub's focused validation run [40058560181](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40058560181) passed `app`, `architecture`, `crowd-diagnostics` and bilingual `game-menu-ui` tests, plus source syntax and the reproducible/offline-ready package check. Existing crowd-escape and retreat-collision suites were not separately selected by the focused runner, so their full regression matrix is not claimed here.

The scripted deterministic fixture moves the hero and 3, 8 or 16 enemies for 18 simulation steps, in either open ground or a narrow corridor with solid prop walls. Results below are **mean calls/actor sightings per tick**. Different densities and layouts are compared structurally; the absolute synchronous times reflect the GitHub-hosted Node runner and profiling overhead, not browser FPS.

| Scenario | `blocked` calls | Segment sample points | Nearby actor hits | Max cell occupancy | Mean `separateActors` duration (ms) |
|---|---:|---:|---:|---:|---:|
| Open, 3 enemies | 8.22 | 8.22 | 44.89 | 3 | 0.03 |
| Open, 8 enemies | 18.22 | 18.22 | 236.00 | 5 | 0.05 |
| Open, 16 enemies | 34.22 | 34.22 | 826.56 | 6 | 0.08 |
| Corridor, 3 enemies | 19.11 | 19.11 | 88.44 | 4 | 0.07 |
| Corridor, 8 enemies | 114.11 | 114.11 | 862.50 | 8 | 0.42 |
| Corridor, 16 enemies | 230.89 | 230.89 | 3363.17 | 10 | 0.99 |

**Interpretation:** The crowded corridor substantially amplifies local collision checks and repeated actor-neighbor encounters. This confirms a source-level cost amplification in this fixture, not that it is the leading factor in the user's device stalls. Same-snapshot assertions show instrumentation itself preserved game-state outcomes in these six scenarios. The first candidate optimization, once separately authorized, should target redundant swept tests or expensive scenery lookup with mathematically equivalent collision results.

## Follow-up boundary

Do not implement collision-cache shortcuts, alternate pathfinding, actor phasing, combat adjustment or a movement-only emergency mode in the instrumentation PR. First inspect reproducible counts/timings and actual device playtest reports. If blocked/segment work predominates, propose a single collision-equivalent optimization with exact before/after gameplay, retreat, terrain and save tests. If AI targeting or route calls dominate, investigate that separately. Emergency-resume oscillation remains a separate integration risk of draft PR #422 and is not claimed fixed here.
