# Developer effects diagnostics — Stage 2 (isolated draft)

**Source baseline:** `e3c78266b28f3325d2afdcb76ae849fcff306deb`, 25 October 2026.
**Scope:** presentation-only diagnostic recording. No fixes to animation durations, effect queues, gameplay mechanics, timing or AI.

## How it works (developer-only)

Start a Developer Mode campaign using the existing `?developer=1` URL opt-in. Navigate to **Game and settings → Screen and performance → Show performance details → Developer effect diagnostics** and select **Start effect recording**. Play normally. Select **Stop effect recording** to retain results; use **Clear effect recording** to discard the in-memory capture.

Choose **Save and game management → Export playtest report** to download the same `Azeroth_Playtest_Report.json`. In Developer Mode the report contains `performance.effectDiagnostics` beside its existing `frameProfile`, `frameSkip`, `crowdDiagnostics`, rendering and party statistics. No separate file, manual logs or additional task is required.

## Player CPU / storage isolation

- Normal and Nightmare: opt-in controls absent; no sampling/tracking instance is allocated, no timers/background tasks added, no stored history or network connection, and no new diagnostic read of actors or projectiles per frame. The source has only inert optional-observer conditionals.
- Even in Developer Mode, recording is **off by default** and activates only on explicit Start.
- While recording, telemetry stays in RAM. Per-identity counters and up to 120 recent draw-frame state summaries are capped. There is no localStorage or campaign snapshot change.
- Stopping cuts off the active observer; the last dataset remains exportable. Clearing destroys it.
- The event queue’s existing 40-transient limit and the existing adaptive-frame-skip logic remain unchanged.

## Export schema and caveats

The effect section includes `recording`, `eventsSeen`, selected `receipts` (including `enemyVfx:audioOnly`), `drawDecisions` (FPS gate/adaptive/draw), `identities` (queued, overflowDropped, filtered, expiredWithoutDraw, painted, drawnFrames), `directStateAtDraw`, the bounded `recentDrawFrames` history and scene transitions. Identity keys preserve hero class/slot/charged/stage, pet family/slot/stage and enemy skillId/stage where available.

**Critical:** `painted` means a corresponding painter function was invoked; it does *not* certify alpha pixels, visual prominence or that a player noticed the effect. Live enemy telegraphs/projectiles/motion/hazards/charges are drawn from current game state and must be interpreted separately from short-lived queued effects. Audio-only receipts are not missing visuals.

This is a deliberately observational Stage 2. Stage 3 should read real exported traces and relevant screenshots to investigate any actual losses or performance implications; it must not modify simulation behavior or require broad testing without approval.

## Source and validation

Implementation: `src/prototype/renderer.js`, `src/prototype/combat-visuals.js`, `src/prototype/enemy-vfx-art.js`, `src/prototype/app.js`.

Focused test: `node tests/effect-diagnostics.test.cjs`. Use existing `tests/frame-skip.test.cjs`, `tests/enemy-vfx-events.test.cjs`, `tests/enemy-vfx-art.test.cjs`, and the appropriate renderer/menu tests as impact tests if available. Do not interpret passing focused CI as a substitute for natural gameplay evidence.

**Integration boundary:** Standalone draft PR only. Do not merge or deploy without the owner's approval; do not touch ongoing Critical Executions work (#440) or documentation/test governance (#449). Preserve the multi-file PWA.
