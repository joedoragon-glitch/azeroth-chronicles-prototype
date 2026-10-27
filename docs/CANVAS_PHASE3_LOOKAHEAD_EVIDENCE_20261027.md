# Canvas 2D Phase 3 — regional ground-cache lookahead measurement gate

Date: 27 October 2026  
Parent: [Canvas-native preparation assessment](CANVAS_NATIVE_PREPARATION_ASSESSMENT_20261027.md)  
Draft PR: #527  
Source/evidence commit: [64d9c684](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/64d9c684aab6e050d856e146c53458b73d33878f)  
[CI run #40504488471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40504488471) — successful, 20 selected focused suites, reproducible PWA build (not a manual browser suite)

## Decision: HOLD runtime lookahead; retain the current Canvas single-window ground cache

The Phase 3 requirement was conditional: **do not introduce additional memory or CPU work merely because a prepared scene might sound faster.**

A controlled, source-grounded benchmark now exists in `tests/canvas-ground-lookahead-benchmark.test.cjs`. It exercises the game’s actual `PrototypeVisuals.floor()` painter with the production `GroundCache` on a Node `@napi-rs/canvas` CPU raster, using matched 96-frame virtual camera routes and an 800×500 CSS viewport at DPR 1.5. It compares:

- **Baseline**: the unchanged production one-window Canvas ground-cache behavior; foreground rebuild on coverage miss.
- **Hypothetical idle recenter**: on camera travel near the cache margin, call the already-existing `GroundCache.prepare()` to shift the ONE existing backing raster ahead. This occurs in a **simulated idle slot** between presented draws, not actual `requestIdleCallback` or real browser time. It does not allocate a second cache or change gameplay/production code.

The benchmark calculates cache rebuild totals, visible-frame p95/p99/max timing, optional CPU raster time, and estimated retained image bytes. It asserts the same memory budget and basic accounting; it **deliberately does not assert a performance win**.

## First CI sample — exact measured results

GitHub-hosted Node runner, one observational paired sample per scenario. Timings are **not** measured Chromebook/iPhone web-app FPS, input latency, GPU usage, real idle scheduling, or validated process memory.

| 96-frame path | Baseline visible builds → candidate visible builds | Baseline total builds → candidate total builds | Baseline visible-frame p99 → candidate p99 | Total raster rebuild cost |
| --- | ---: | ---: | ---: | ---: |
| Straight traversal | 4 → 1 | 4 → 5 | 73.761 → 73.524 ms | 91.709 → 105.374 ms |
| Reverse direction | 6 → 1 | 6 → 7 | 153.433 → 136.899 ms | 129.728 → 150.689 ms |
| Zigzag traversal | 5 → 1 | 5 → 5 | 177.830 → 149.242 ms | 102.658 → 102.508 ms |

**Optional synchronous idle-slot CPU painting:** 83.420 ms (straight), 130.518 ms (reversal), 79.221 ms (zigzag), aggregated across each 96-frame run. All scenarios retained a peak logical raster allocation of **11,949,696 bytes** for this viewport. That is **not a complete browser heap/process memory measurement** and does not validate high-DPR phone behavior.

### Interpretation

1. The candidate did move most raster rebuilds out of visible frame draws on these controlled paths. This verifies the mechanical premise, **not** user-visible smoothness.
2. The candidate increased total raster builds in straight and reversing motion (4→5 and 6→7). Accumulated rebuild time rose approximately 15% and 16%, respectively, within this one noisy CI sample.
3. Worst-tail visible frame time was largely unchanged in straight travel and remained high in all paths. Copying the cached raster, independent renderer work, initial conditions and noisy runner scheduling can still dominate.
4. A `requestIdleCallback` budget check is only an admission decision: once begun, synchronous painting is non-preemptible. Even if scheduled outside foreground draws, those additional raster operations can delay touch, keyboard and other JS tasks.
5. This was **Vale floor region 0 without external material overlays**. It does not measure road/terrain/actors, actual movement simulation, combat, saved campaign GPU presentation, browser render compositing, iOS recovery, or long-session memory.

Given this evidence, **do not ship a second-region raster, cache recentering scheduler, extra memory budget, or default-on Canvas lookahead in Phase 3**. The existing Phase 2 title-screen preparation and original cache remain authoritative.

## Evidence needed to reopen the gate

The game’s preexisting **Game and Settings → Screen and Performance → Start renderer profiling / Export playtest report** already includes renderer/frame diagnostics and the Canvas `renderer.metrics().groundCache` counters introduced in Phase 1. No competing profiling UI or save format is needed.

1. Use the same saved outdoor run, actual **Canvas 2D** renderer, display resolution/DPR, zoom, frame limit and optimization setting for repeatable cold and warmed trials. Record the configuration and how many samples were taken.
2. On the primary **ASUS Chromebook CX5403CMA-DB588**, collect several continuous Vale → goblin-westward and reverse-route traversals, normal roaming, and fighting near the cache edge. Repeat on a contemporary phone if possible. Include controls for title Continue, regional return, and zoom/quality changes.
3. From playtest reports, examine **whole-frame work p95/p99**, skipped vs drawn frames, `groundCache.builds/hits/maxRebuildMs/rebuildMs/failedBuilds`, render-phase floor time, and time spent outside the renderer. Investigate whether ground-cache misses actually coincide with the user-noticed stalls, rather than blaming them for AI/combat/sprite work.
4. Record task responsiveness and real memory pressure; the 64 MiB logical cache cap alone does not establish safe full-process residency.
5. **Only if miss-induced stalls are material**: implement an explicitly disabled, device-test-only single-window recentering prototype (without doubling caches) and conduct matched on-device OFF/ON tests. Require a meaningful reduction in visible p95/p99 stutter with no unacceptable total CPU, input latency, memory, cache thrashing, visual drift or cancellation regression. If no reliable win, reject and retain baseline.
6. Verify Canvas/Pixi screenshot and combat-cue parity, no gameplay RNG/time/state mutation, and every cancel/hidden/save/renderer-switch edge case before accepting an experimental path.

There is **no owner-device evidence yet**, so Phase 3 is **source evaluation complete, performance acceptance open, default unchanged**. Do not treat the successful benchmark suite as renderer graduation or proof of smoothness.

## Source scope and safeguards

- The production `ground-cache.js` and `renderer.js` draw/prepare paths are unchanged by this Phase 3 benchmark.
- No PixiJS cache modification, no second offscreen raster, no speculative zone generation, no altered 64 MiB budget and no new gameplay feature toggle.
- Prior main reconciliation commit [4b44956](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/4b44956fa84294eece56717fa1049c15404da6ed) preserves concurrent `main` changes, including renderer diagnostics; focused CI passed before the observational benchmark was added.
- Phase 4 procedural-scenery reuse is a **separate workstream** and is not evidence for enabling Canvas regional lookahead.
