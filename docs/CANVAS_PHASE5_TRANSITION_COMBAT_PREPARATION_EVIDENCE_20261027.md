# Canvas Phase 5 — transition and combat-aware preparation integration gate

**Date:** 27 October 2026  
**Draft PR:** [#527](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/527)  
**Prerequisites:** [Phase 0–3 contract](CANVAS_PHASE0_3_CONSOLIDATION_HANDOFF_20261027.md), [Phase 3 no-lookahead decision](CANVAS_PHASE3_LOOKAHEAD_EVIDENCE_20261027.md), [Phase 4 immutable-art HOLD](CANVAS_PHASE4_PROCEDURAL_ART_REUSE_HOLD_20261027.md).

## Disposition: keep existing transition architecture; strengthen regression coverage

**Source/integration decision: no new Canvas raster preparation on the live transition or combat path.** This is not abandonment of Phase 5: the shared gameplay integration delivered by merged #518 already guards title/Continue and destination loading, prioritizes authoritative nearby encounter sprites after the native travel or dungeon admission, paints the first scene while the loading layer is opaque, and resumes the simulation only after successful reveal. Phase 2's sole eligible optional Canvas painter is the existing *inactive-title* `prepareCurrentGround()`. Phase 3 regional lookahead and Phase 4 procedural-art caching did not pass acceptance, and must not be activated indirectly.

Adding `prepareCurrentGround()` during a live travel or dungeon loading interlude would perform synchronous main-thread work that `drawReadyScene()` already needs, using the **same raster**, without an established real-device tail-latency, responsiveness or total-transition benefit. In particular, the first hostile dungeon frame should not wait for optional speculative ground work: dungeon floors and combat overlays have their existing live renderer owners. The new benchmark in Phase 4 also demonstrated visible pixel drift from proposed small-art reuse. Therefore there is no evidence-based Phase 5 cache to install or prewarm in combat.

## Already implemented versus explicitly deferred

| Component | Existing owner / route | Phase 5 disposition |
| --- | --- | --- |
| Title restored save | `showTitleScreen()` invokes `warmScene()`, then Phase 2 guards a single idle `renderer.prepareCurrentGround()` for constructed exterior scenes only | Keep current source candidate; asynchronous callback epoch, writer, visibility, title, zone and renderer-mode guards remain |
| Continue | `enterPreparedScene()` validates ownership, recovers only at authorized Continue, warms actual entered scene, invokes `drawReadyScene()` and reveals | Preserve authoritative campaign clock, save recovery and first scene |
| Outdoor travel | `sceneTransitionTo()` has bounded preflight reading only constructed data; native `commit()` alone moves the game and pays fare; post-commit `warmScene(destination, ..., true)` prioritizes visible threats | Keep shared sprite preparation; no extra Canvas raster call |
| Main/side/supply dungeon | `combatCriticalArrival()` bypasses speculative preflight; native commit constructs the dungeon; post-commit sprite warming favors encounter art; opaque loading covers first draw | Preserve first hostile frame, telegraphs and spawn state; no floor lookahead or background painting |
| Active combat | Renderer paints threats, sprites, shadows and live cue layers in established scene/depth order; optional Canvas raster work is scheduled **only** on inactive title | Continue direct painting; no new CPU job, idle recenter, additional eviction or scheduler during fighting |
| Hidden/resumed PWA | Uncommitted preflight is canceled; committed travel is not replayed, and reveal remains blocked while hidden; on return same destination can be drawn | Keep native authoritative travel, avoid double fare/save mutation |
| Canvas failure/renderer fallback | `drawReadyScene()` retains Canvas fallback and retry of an already-committed arrival | No new cache failures or Pixi/Keep-Revert change |

## New focused integration regression

`tests/canvas-phase5-transition-safety.test.cjs` checks the **production application source executed in the project's Node VM fixture**, using real Campaign travel commands and a stubbed presentation painter. It covers:

1. English and Spanish: travel preflight leaves the authoritative campaign and unknown destination untouched; only native commit enters it; loading remains covering the arrival until the renderer succeeds; game time does not advance before the first painted frame.
2. Legacy title idle callbacks cannot trigger optional Canvas preparation after entering gameplay; an actively aggroed enemy does not schedule new optional Canvas prepaint.
3. The page becomes hidden **after** native travel commit and before encounter warmup resolves: the existing committed zone/fare/clock survives; no hidden reveal or accidental second commit; resume paints the same destination.
4. A first Canvas draw failure leaves loading/retry visible; retry paints the existing committed zone, without replaying native travel or editing campaign state.
5. Static source contracts protect the separate floor cache, dynamic ground combat cues, isometric entity sorting and procedural-art fallback. They reject silently installing the held Phase 4 cache on the Canvas renderer.

These are **source and fixture-level regression guards**, not a real Canvas rendering or pixel-difference screenshot comparison: the test's world painting is replaced by a controlled counter/failure probe. Existing `tests/scene-transition-lifecycle.test.cjs`, `tests/canvas-title-preparation.test.cjs`, `tests/ground-cache.test.cjs` and `tests/ground-cache-browser.test.cjs` remain independent coverage. The browser test is manual/owner-gated and is **not** automatically implied by Node CI.

## Decision / evidence ledger

| Gate | Status |
| --- | --- |
| Source audit against PR #527 and latest available main | Reviewed; check exact head before any merge |
| Title, Continue, region and dungeon lifecycle ownership | Existing shared implementation retained |
| Canvas cache and procedural artwork active runtime changes | **None**; Phase 3 and Phase 4 HOLD respected |
| New Phase 5 cancellation / first hostile frame / fallback integration tests | Added; final exact-head CI receipt to be linked |
| Browser screenshots, actual first-hostile-frame and transparent cue parity | **Open — not certified** |
| Paired Chromebook/iOS device traces including whole-frame p95/p99, input delay, transition latency, resident memory | **Open — not measured** |
| Full PWA offline, Save/Import/Recovery, Pixi Keep/Revert, fresh/restored campaigns and physical-device lifecycle | **Open — not certified here** |
| Merge / release / Pages deployment | **Not authorized**; PR remains draft |

## Phase 6 handoff — acceptance runbook

For an accepted end-to-end check, capture exact game commit/build, OS/device, browser, real Canvas/Pixi mode, viewport CSS pixels + DPR, camera zoom, optimization/auto-FPS, campaign scenario, cold/warm state, and at least several repeat trials. Exercise a restored outdoor Continue, title idle prepaint on/off, outbound regional transport, main/side dungeon entry with nearby hostiles, in-combat roaming, interrupted preflight, hidden committed arrival, failed first draw/Canvas retry, reverse route, and renderer switch.

Compare full-frame and render-phase p95/p99, actual drawn/skipped frames, one-ground-cache build/hit/rebuild counters, first-visible-hostile latency, world/input responsiveness, absolute transition latency, memory growth and screenshot parity. A cosmetic no-op/no new raster is preferable to extra unbounded synchronous work. Preserve PWA offline, save ownership and combat fairness. Only actual device/browser evidence can graduate Phase 2 or justify Phase 5 additional painting.

**Current Phase 5 source result:** guarded transition integration without new renderer behavior; final CI verification remains separate from physical acceptance and does not authorize merge/deploy.
