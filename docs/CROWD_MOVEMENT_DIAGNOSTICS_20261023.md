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

## Follow-up boundary

Do not implement collision-cache shortcuts, alternate pathfinding, actor phasing, combat adjustment or a movement-only emergency mode in the instrumentation PR. First inspect reproducible counts/timings and actual device playtest reports. If blocked/segment work predominates, propose a single collision-equivalent optimization with exact before/after gameplay, retreat, terrain and save tests. If AI targeting or route calls dominate, investigate that separately. Emergency-resume oscillation remains a separate integration risk of draft PR #422 and is not claimed fixed here.
