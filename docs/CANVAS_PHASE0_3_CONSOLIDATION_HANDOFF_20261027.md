# Canvas 2D — Phase 0–3 consolidation and Phase 4 handoff

**Date:** 27 October 2026  
**Review scope:** draft [PR #527](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/527), Canvas-native performance work, Phases 0–3.  
**Authoritative roadmap:** [Canvas Native Preparation Assessment](CANVAS_NATIVE_PREPARATION_ASSESSMENT_20261027.md).  
**Phase 3 raw evidence and decision:** [Regional Lookahead Evidence](CANVAS_PHASE3_LOOKAHEAD_EVIDENCE_20261027.md).  
**Base synchronization:** reconciled with `main@5c6197e871f8f4393d26d9b7a261b9324ef85d12` in merge commit `4b44956fa84294eece56717fa1049c15404da6ed`. Recheck the live branch before later merges.  
**Disposition:** **source-development checkpoint only.** PR remains draft; no merge, deployment, Pixi graduation or real-device performance approval.

## Executive outcome

Canvas 2D remains a fully supported, separate renderer. The shared title, inactive-save handling, Continue/first-painted-frame, and region/dungeon transition contracts from merged #518 remain common game infrastructure. Canvas-specific graphics preparation uses the existing decoded-sprite manager and **one** nominally 64 MiB-limited static outdoor ground-cache backing raster, not extra GPU uploads, a second raster cache or generated game state.

Phases 0–3 now have **documented source decisions**. This does not imply that all their performance acceptance gates have passed. Phase 2's idle title preparation is an implemented candidate, subject to real-browser quality/latency acceptance. Phase 3's regional camera lookahead has an explicit **HOLD / do not ship** decision.

## Phase-by-phase acceptance ledger

| Phase | Deliverables | Verified evidence | Disposition and remaining gate |
| --- | --- | --- | --- |
| 0 — assessment | architecture, shared-vs-renderer ownership, memory/cancellation risks, acceptance protocol | this roadmap and source audit | Source audit complete; no empirical claims |
| 1 — observability | successful raster rebuild cost, failures, invalid-transform/budget skips in `groundCache.status()` | [CI #40499965106](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40499965106), deterministic cache unit coverage | Source implementation complete; counters are synchronous timings, not actual presented frames |
| 2 — first-scene preparation | `GroundCache.prepare()`, shared outdoor-floor painter, Canvas-only title idle scheduling, safety guards and regression fixtures | [CI #40502360054](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40502360054); updated actual-renderer title test on this branch | Implementation committed; browser screenshot parity, title responsiveness and real-device speedup **not certified** |
| 3 — regional lookahead evaluation | repeatable baseline vs hypothetical one-cache idle-recenter benchmark, exact result table, documented no-go | [CI #40504488471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40504488471) and [Phase 3 evidence](CANVAS_PHASE3_LOOKAHEAD_EVIDENCE_20261027.md) | Benchmark source study complete; **do not enable** lookahead or spend extra memory. Reopen only with proven device-level miss-driven stutter and a net-win A/B |

### Proof and interpretation boundaries

- The Phase 3 table records **`GroundCache.draw()` call durations**, not complete simulation+renderer+browser-present frames or actual FPS. Its hypothetical `prepare()` calls run in **simulated** idle slots; there was only **one** noisy GitHub-hosted Node/@napi-rs/canvas sample per scenario. P95/p99 changes are **hypotheses to validate**, not player-device results.
- On straight and reverse paths, the candidate performed more total raster work in the sample. Therefore there is no basis for default-on regional lookahead. **No lookahead scheduling or additional offscreen raster was added to production code.**
- Phase 2 uses `requestIdleCallback` with an idle-budget admission check, but once started its synchronous Canvas paint **cannot be preempted**; a budget threshold does **not** guarantee a fixed completion time. It is not a certified smoothness optimization yet.
- The 64 MiB estimate is an **individual retained raster logical RGBA byte ceiling**, not a measurement or guarantee of total application/OS memory. The sprite decoder and browser surfaces have separate memory costs.
- The Phase 2 cache test and source guards are distinct from the still-unrun physical browser screenshot/pixel and device benchmarks. Do not report them as equivalent.

## Code ownership and regression protection

| File or area | Why it changed | Invariant |
| --- | --- | --- |
| `src/prototype/ground-cache.js` | Phase 1 timing counters and Phase 2 no-blit `prepare()` reuse | one canvas, release before rebuild, bounded budget; original `draw()` path preserved |
| `src/prototype/renderer.js` | one common outdoor floor painter and guarded `prepareCurrentGround()` | only already-constructed outdoors; unchanged terrain art, clipping, materials and live combat layers |
| `src/prototype/app.js` | title-only `requestIdleCallback` orchestration, integrated with updated `main` app | writer ownership, title token, active mode, page visibility, game/zone identity, Continue and Pixi opt-in respected |
| `tests/ground-cache.test.cjs` | deterministic timing and visible-vs-offscreen cache reuse | dimensions, transform, invalidation, cleanup and cache opt-out |
| `tests/canvas-title-preparation.test.cjs`, `tests/helpers/production-shell.cjs` | browser-idle cancellation scenarios plus actual renderer/cache test fixture | state/save integrity, no visible blit, DPR change and overlay/cache-disabled guards |
| `tests/canvas-ground-lookahead-benchmark.test.cjs` | **observational** CPU raster A/B using existing approved floor painter | no production renderer toggle, no claimed frame-rate boost or added buffer |
| `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json` | reviewed renderer-only SHA-256 source fingerprint | existing sprite families, palette/canon classifications and historical provenance remain unchanged |

### Regression checks available on the branch

The automated focused checks select affected Node suites, the source-only sprite-scope provenance guard, reproducible offline-ready PWA packaging and JavaScript syntax. This does not replace browser-driven floor parity (`tests/ground-cache-browser.test.cjs`), full-game integration, or physical devices. The current PR-head CI result must be linked and checked again whenever source/tests change; a green historical commit alone is insufficient.

Historical successful receipts: [Phase 1](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40499965106), [Phase 2](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40502360054), [post-main integration](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40503951116), [Phase 3 benchmark](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40504488471), [Phase 3 final doc head](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40505271215).

## Known acceptance debt — tracked, not silently carried as completed

1. **Phase 2 visual equivalence:** paired normal Canvas direct-vs-cached and title-prepared first-frame raster comparisons on desktop/phone and critical zoom/DPR settings. Existing browser cache parity suite predates the Phase 2 refactor; rerun it for the present PR head. Check transparent canvas overlays in experimental Pixi mode separately.
2. **Phase 2 actual input/long-task cost:** Chrome/Chromebook and mobile browser traces for title idle painting and subsequent Continue, with and without idle preparation. Stop or gate the optimization if input delay, memory or first-frame latency worsens. The source implementation is not proof of a speedup.
3. **Entire-journey acceptance:** save ownership/conflict/recovery, travel first hostile scene, return from dungeon, title in English/Spanish, hidden/resumed PWA, fallback/Keep/Revert and offline run still need explicit user/device gates.
4. **Playtest report provenance:** store hardware, app commit, active renderer, viewport CSS+DPR, camera zoom, quality settings, scenario, sample size, cold/warm status, p95/p99 whole-frame work and `groundCache` counter deltas with each accepted optimization. Do not include private save contents in exported evidence.
5. **Merge/release review:** recompare live PR head to `main`, check current exact-head focused CI, run separately gated browser tests, and obtain explicit approval before marking ready/merging/deploying. GitHub Pages publishing from PR workflows remains skipped.

**These are not permission to treat an untested behavior as safe.** They are acceptance requirements for the eventual renderer-quality gate, and should be escalated if Phase 4 depends on them.

## Phase 4 entry criteria and scope

The next phase may begin as **a narrowly isolated research/benchmark effort**; it does not depend on enabling rejected Phase 3 lookahead. Before merging any new procedural scenery cache:

1. Inventory expensive **unchanging** procedural Canvas draw families and quantify render cost using real frames or a clearly labeled microbenchmark. Propose at most a small candidate family.
2. Specify a complete cache identity: family/art variant, material revision, palette/lighting, geometry, zoom/scale and DPR. If any input changes with simulation time, combat phase, animator clock or authoritative state, keep its live draw path.
3. Define **one combined budget** for any new CPU artwork surfaces; include existing ground raster and sprite-decoder ownership in memory accounting. Never infer available memory from the nominal ground-cache budget alone.
4. Compare native draw vs new cached output at multiple zoom/DPR and camera/scene states; validate source-art canon, layered depth ordering, overlay warnings and deterministic snapshots.
5. Test failure/eviction, scene/material/renderer switch, title/Continue cancellation, PWA hide/resume, and adaptive quality reductions; retain explicit opt-out or fall back to native drawing.
6. Accept the feature only after browser/device frame-tail and memory evidence shows benefit. A rejected or no-op candidate is a valid professional outcome.

## Changelog and supersession

This consolidation is the single **state-of-work entrypoint** for Phases 0–3, not a replacement for the detailed architecture/evidence documents linked above. It corrects potentially ambiguous historic phrasing that called cache-only p99 timings “visible-frame p99.” Historical CI output and dated measurements are retained verbatim in their run logs; interpretations now precisely identify the measured scope.

**Bottom line:** Current source work can move into Phase 4 discovery without enabling rejected Phase 3 lookahead, provided the above unverified browser/device gates remain explicit. Do not merge PR #527 or declare Canvas performance proven until those gates are satisfied.
