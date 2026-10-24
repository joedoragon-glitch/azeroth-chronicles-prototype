> **24 October 2026 — HISTORICAL IMPLEMENTATION NOTE (dev.165):** This file describes the original stage profiler, **not** the current instrumentation or renderer. Released dev.169 adds per-active-surface PixiJS and Canvas overlay timings, optional crowd diagnostics, Auto 20–30 / 30–60, and critical emergency holds. Its `callbackFps` is callback *opportunity* rate, not completed simulation ticks during an emergency hold; `displayedFps` is issued world drawing, not verified monitor presentation. Existing concerns about differing windows, broad companion/enemy labels and independent P95 values remain interpretive cautions—not a conclusion that the new tools were never improved. Use [the current dev.169 performance guide](CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md) and [integration evidence](PERFORMANCE_RESILIENCE_INTEGRATION_20261024.md). The dated dev.165 tests and behavior below are preserved as history.

# Dev.165 · Chromebook frame-stage diagnostics

This is an observational performance-only addition. No AI, combat, movement,
asset, camera, save schema, or drawing semantics change.

## How to measure on the actual Chromebook

Start the published desktop game. In a representative outdoor scene, play normally
for at least 20 seconds before opening the menu. Use
**Game and settings → Screen and performance → Performance details** to see the
frame-stage mean/p95 values. Export a Playtest Report under Save and game management
to preserve `performance.frameProfile` together with the existing FPS and renderer
phase counters. The report includes a bounded rolling sample of 180 **active**
frame callbacks. Paused/menu frames are excluded; rendering is sampled only on
callbacks where the game actually draws.

The measured categories are:
- `simulationMs`: entire `game.tick` call, including AI
- `companionAIMs`: `updateParty` inside the simulation
- `enemyAIMs`: `updateEnemies` plus `updateElites`, `updatePacks`, and guardian reinforcements
- `otherSimulationMs`: simulation minus those measured AI stages
- `hudMs`: frame-loop HUD refreshes (zero on frames without refresh)
- `audioUpdateMs`: frame-loop `audio.update`
- `eventDispatchMs`: queued events, transient renderer update, and `audio.effect` dispatch
- `renderMs`: Canvas world renderer (includes any adaptive-resolution immediate redraw)
- `otherJsMs`: remaining measured frame work (including input, quest guide, event
  processing outside the explicit stage, and lightweight profiler overhead)
- `intervalMs`: spacing of the animation callbacks. Frame time not accounted for by
  measured synchronous work can involve browser scheduling/compositing and should
  not automatically be attributed to a particular game subsystem.

AI stages are nested inside simulation, not additional work. Each mean/p95 is a
separate distribution and the p95 values must not be summed. Values are from the
local device only, not network telemetry. The previous dev.164 report's 14 FPS,
27.9 ms pre-render p95 and 14.2 ms render p95 are the baseline, not a new
per-stage measurement.

## Validation scope

Narrow `tests/frame-profile.test.cjs` and `tests/game-menu-ui.test.cjs`,
plus generated assets/build syntax during Pages packaging. No full CI matrix.
Owner real-hardware comparison remains authoritative for performance conclusions.
