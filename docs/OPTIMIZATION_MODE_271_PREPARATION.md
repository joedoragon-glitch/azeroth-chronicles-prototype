# Optimization Mode #271 — implementation preparation and baseline audit

**Status:** Preparation checkpoint only; no runtime changes, optimization toggle, performance gain, regression claim, merge, or deployment in this PR.  
**Source baseline:** released `main` v0.9.0, commit `d7d2c22485b08265b31bf595305ef952b40b72cd`, inspected on 2026-10-11.  
**Owner-approved contract:** [issue #271](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/271).  
**Separate outstanding work:** [charged opener PR #268](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/268), [keyboard PR #269](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/269). Do not cherry-pick, merge, edit, or depend on either.

## Scope and release safety

This is an **opt-in, device-local, reversible presentation preset**, initially Off. It must not modify campaign v4 (or historical import), source art, gameplay entities, encounter outcomes, combat/timing, collision, AI, spawn density, pathfinding, quest progression, or the existing multi-file PWA architecture. It is not a replacement for Auto/30/60 render cadence. Preserve the released normal-mode appearance and existing pixel guards. No production merge or deployment without separate explicit authorization.

The tester report in #271 (~8 FPS during an outdoor battle on AMD A12-9720P / Radeon R7 / 8 GB) motivates this work but is *not* a paired benchmark. The screenshot's `workP95Ms=40.4` is **not** an FPS measurement; the 180-frame sampling window and test duration may differ. 150% and 175% observations and an exported diagnostic report are still pending. Do not extrapolate the earlier v0.9 performance work to this hardware.

## Source inventory and implementation seams

| Responsibility | Released code / current behavior | Preparation decision and risk |
| --- | --- | --- |
| Screen UI and device preference | `src/prototype/app.js`: `platformMenu()` displays **Game and settings → Screen and performance** and frame/camera choices (approx. lines 740–796); `PrototypeRuntime.createFrameRate(localStorage)` stores Auto/30/60 separately. | Add an explicit **Optimization Mode: Off / On** choice and explanation. Use a new independent local preference (proposed `azeroth-optimization-mode-v1`), robust to missing/invalid storage, not `profile`/campaign snapshots. Read it before materials/audio boot. Switching must work live, reset relevant caches and refresh the menu without resetting the campaign. |
| Floor reuse and texture requests | `src/prototype/renderer.js` `render()` (approx. lines 1272–1342) uses one `GroundCache` for outdoor floors. The material `surfaceRevision(key)` call also pins/**queues image loads**, so just passing a null material painter later is insufficient. `GroundCache.status()` already exposes hits/builds/bytes; renderer metrics expose `floorTilesPainted`. | Preserve the floor cache. In optimized mode use procedural floor/road/terrain geometry and a **stable mode-specific revision** that does not call texture `surfaceRevision`. Invalidate on Off↔On transitions, DPR change, scene and material readiness as appropriate. Do not infer repaint count from visible tiles. |
| Material lifecycle | `src/prototype/materials.js`: `surfaceRevision()` queues missing resources; `paint()` queues on cache miss; projection cache costs additional memory. `src/prototype/app.js` ends with unconditional `PrototypeMaterials.load()`. | Suppress optional **request/decode/paint** work at the true entry points while optimized. A policy must distinguish already-loaded materials from queued/decoding loads, invalidate stale completions and resume in normal mode. Avoid deleting originals/manifests or globally disabling materials for the PWA. Test a reload with mode already On. |
| Entity and scenery selection | `renderer.js` `add()` (approx. 1347–1381) scans props, NPCs, nodes, buildings, enemies and party; existing screen rejection is ±180 presentation units. Sorted entities are then drawn with shadows, art, labels and combat cues. | First inventory `z.props` and their visual/collision/interaction semantics; **classify by proven safe decorative categories**, not arbitrary `renderKind === 'prop'`. Tighter culling or delayed preload may affect *only* noninteractive/no-collision clutter. All actors, important NPCs, buildings, resource nodes, entrances, blockers, quest objects, targeting and warnings retain eligibility. Do not mutate or filter world objects themselves. |
| Combat, lighting and VFX | `renderer.js` invokes `PrototypeCombatVisuals.ground` (fill/cue), `PrototypeEnemyVfxArt.ground/actors`, entity auras, `drawVisualFx()`, projectile drawing, outlines, target/navigation guidance and `PrototypeVisuals.atmosphere`. | Audit *individual* effect categories before skipping anything. Preserve geometry, visibility and timing of traps, hostiles/boss/captain telegraphs, skill windups, damaging hazards, friend/hostile projectiles, hit feedback and player controls. Cosmetic atmosphere, glows and decorative particles are candidates only if evidence shows no misleading disappearance. Night navigation cannot be sacrificed indiscriminately. |
| Recorded environmental audio | `src/prototype/audio-environment.js`: `updateEnvironment()` selects rules and async recording assets, checks `environmentRequest`/recording epoch, and uses `stopEnvironment()`. `src/prototype/audio-production.js` updates environment independently from the selected score. | Suppress before choosing/loading recorded environmental sources. On entering mode: invalidate pending requests, stop active/outgoing voices; check async completion cannot restart ambience. On exit: normal environment resumes in the current scene, respecting pause/reload transitions. Keep background *music*, combat/UI sounds and normal volume settings. |
| Generated environmental audio | `src/prototype/audio-score.js`: `ambient()` synthesizes and loops a fallback noise bed; score scheduling also synthesizes tones on the `ambience` bus (approx. lines 206–267). | Muting ambience bus alone is **insufficient**. Skip fallback buffer creation/voices and ambience-bus tone generation in optimized mode. Confirm no newly scheduled ambience slips through after toggles and that score/music remains unchanged. |
| Internal pixel density | `app.js` `resize()` uses devicePixelRatio clamped to 1–2 desktop / 1–1.5 phone and a ~3-million-pixel cap; canvas backing dimensions and `ctx.setTransform(ratio,...)` change together (approx. lines 240–265). `renderer.js` renders in CSS-space and applies camera zoom separately. | Prototype a mode-only DPR cap; keep CSS viewport, camera, mouse/touch mapping, text overlays and normal DPR unchanged. Compare actual backing pixel dimensions and screenshot readability. Require resize/invalidation immediately on mode switch and full restoration on exit. |
| Playtest reporting and frame cadence | `src/prototype/runtime.js` retains at most 180 active drawn-frame samples and reports inferred interval FPS + frame-work P95. `app.js` exports `runtime.report(renderer.metrics(),platform.mode)`, audio/material/sprite status; `renderer.metrics()` already returns floor cache status and `floorTilesPainted`. | Extend the opt-in report with mode, effective DPR/backing pixel count, warm/cold ground builds, per-frame floor repaints and P95/P99 on clearly labeled measurements. Distinguish main-loop work from draw-only phase measurements. Keep bounded, sampled diagnostics off the hot path when not exporting; do not add telemetry/network or edit save state. |

## First implementation sequence (future PR commits, not included here)

1. **Baseline and diagnostic contract.** Confirm one authoritative v0.9.0 source/CI/published reference, record supported canvas layouts and report schema, add low-overhead sampled timers around major render phases without altering the frame loop or AI tick; test that report counters distinguish considered/drawn/repainted objects. Baseline A/B before optimization switches; document the measurement environment and any profiler overhead.
2. **Preference and lifecycle.** Implement default-Off local flag, invalid-storage fallback, live toggling and cache invalidation, including no side effects on v4 campaign save. Separate normal-mode rendering branch must remain visually identical with preference absent or Off.
3. **Procedural terrain.** Disable optional painted materials *and their loading pathways* without disabling roads, cliffs, water, collision or world palettes. Preserve the existing bounded outdoor ground cache and normal material revisions; test cold and warm scrolling.
4. **Scenery and effect audit/filter.** Produce an explicit allowlist of presentation-only clutter; keep interactive/colliding props and all actors. Audit combat VFX separately, avoiding wholesale VFX-module shutdown. Verify critical warnings at day/night and all relevant zooms.
5. **Source-level ambient suppression.** Recorded environment, async races, synthesized noise/tones and mode-exit recovery all covered; preserve music/combat/skill/UI cues and audio preferences.
6. **DPR A/B and validation.** Compare capped backing ratio with normal on desktop and phone before choosing a limit. Run full regression, PWA update/offline, historical import, and report measured gains *and* failures with rollback instructions.

Do not increment runtime version or generated service-worker cache during this documentation-only checkpoint. A future runtime PR owns those release metadata changes serially after code verification.

## Benchmark matrix and evidence requirements

Use the **same exact build, browser/device, game save/scene, enemy layout, settings, viewport CSS pixels, camera zoom, power mode, acceleration state, warm-up, and measurement duration** for paired Off/On trials. Capture cold-load separately from warm/moving periods; include a baseline-vs-baseline control. Test:

- Camera 100%, 150%, 175% (independent dimensions, no cross-zoom equivalence claims), Auto starting at 30; manual 30/60 where useful.
- Crowded outdoor combat, ordinary traversal, settlement, boss/TRUE/captain telegraph, night, dungeon/interior, zone switch and return outdoors.
- Desktop Chromium, phone Chromium/WebKit, offline/reload/PWA, historical v4 imports; request real tester hardware repeat before claiming an AMD A12 result.
- Report interval-derived FPS, sample frame count/duration, work P95/P99, measured phase costs, entities considered/drawn, floor candidates/visible/**painted** tiles, ground cache hits/builds/bytes, backing dimensions/DPR, queued/decoded visual assets, ambient generation/requests, pop-in count/visibility concerns. Mark phase timings as sampling estimates, not causal attribution.
- Save baseline/candidate screenshots and state equivalence evidence. Keep normal-mode exact-pixel and combat guard tests unchanged. No flaky timing threshold should replace functional tests.

## Regression gates and rollback

Gate A: normal-mode exact rendering, gameplay/clock equivalence and stable campaign save/export/import. Gate B: live repeated Off→On→Off transitions (active battle, scrolling terrain, paused menu, night, audio load in flight, resize/zoom, PWA reload) with restored material/ground caches and no ambient leaks. Gate C: preservation of **every** hostile warning, active damaging hazard boundary, targeting ring, important interaction affordance, hero/companion projectile and combat cue. Gate D: measured performance with disclosed pop-in/readability costs; optimization can be rejected if trade-offs fail.

Run at least `npm run format:check`, `npm run check`, `npm test`, and appropriate Chromium desktop/phone + WebKit phone suites; include material, ground-cache, audio-environment, platform-runtime, sprite lifecycle and combat telegraph regressions. Use the repository's shared CI jobs and check the exact PR head. Protect exact-pixel and historical-save checks; never relax them to pass.

Rollback consists of switching the flag **Off**, immediately restoring normal DPR/assets/environment and rebuilding presentation caches; a defective candidate remains an unmerged branch until fixed. If runtime work ultimately ships, document safe rollback to the exact previous published build with saved data retained. Keep all original graphics/audio assets and Git history.

## Checkpoint bookkeeping

- [x] Issue #271 inspected and cross-checked against released sources.
- [x] Released `main` baseline pinned; PR #268 and #269 confirmed separate/open.
- [x] Primary entry points, existing optimization mechanisms and lifecycle hazards inventoried.
- [x] This dedicated preparatory branch and draft documentation PR created.
- [ ] Any code-level Optimization Mode implementation.
- [ ] Hardware FPS measurements, 150%/175% follow-up and playtest JSON.
- [ ] CI/head validation for eventual code changes; no tests claimed here.
- [ ] Explicit authorization to merge/deploy a runtime candidate.

This document is a **living engineering checklist**; the approved behavioral contract remains [#271](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/271), not an override of it.
