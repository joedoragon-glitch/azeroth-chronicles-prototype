> **22 October 2026 audit annotation:** The timers below are genuine wall-clock measurements for broad code scopes, but the measurement tools are **not yet a precision comparison dashboard**. `companionAIMs` includes full party movement/combat, `enemyAIMs` includes broad enemy updates, and the 180-active-callback profiler window is not synchronized with the renderer's 64 phase samples or legacy drawn-callback FPS. Menu/paused renderer redraws can affect renderer counters. See [the maintained performance measurement audit](PERFORMANCE_MEASUREMENT_AUDIT_20261022.md) before interpreting reports. The owner has paused further performance tuning; this historical implementation note is not a new optimization task.

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
