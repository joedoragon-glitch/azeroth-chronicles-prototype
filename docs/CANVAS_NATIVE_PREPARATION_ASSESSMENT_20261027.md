# Canvas 2D native preparation and performance — assessment and implementation contract

Date: 27 October 2026  
Baseline inspected: main at 24afe03a25c520ef2669b2978a5d3b76e4e6a5b5 (after merged PR #518)  
Status: Phases 0–2 source candidates implemented; Phase 3 source A/B evaluated with a **HOLD** decision for runtime lookahead. **No target-device performance certification or approval to merge/deploy.**

**Phase 0–3 consolidation and Phase 4–5 continuation:** [consolidated professional handoff](CANVAS_PHASE0_3_CONSOLIDATION_HANDOFF_20261027.md), [Phase 4 HOLD](CANVAS_PHASE4_PROCEDURAL_ART_REUSE_HOLD_20261027.md), and [Phase 5 integration decision](CANVAS_PHASE5_TRANSITION_COMBAT_PREPARATION_EVIDENCE_20261027.md). This is the current status and acceptance-debt index; use the detailed sections below for source rationale and historical evidence.

## Executive decision

Keep **Canvas 2D as a first-class supported rendering implementation**, with its own bounded CPU-oriented graphics preparation, while PixiJS/WebGL2 remains optional and experimental. The main menu, Continue, save ownership, loading screens, travel authorization, first playable frame and simulation lifecycle remain **shared game infrastructure**, not duplicated or forked by renderer. Canvas's renderer-specific work must reuse the existing sprite decoder and terrain ground cache instead of copying Pixi's GPU upload and texture-cache algorithms.

**Key finding:** PR #518 has already delivered a meaningful part of the Canvas story. Its shared title screen and scene transitions call read-only sprite warmup for relevant assets, then paint the first world scene before resuming simulation. In Canvas mode, sprite decoding and the initial ready-frame draw already work via this flow. The genuine missing optimization is the independent, **measured and safely scheduled preparation of Canvas raster work**, not a second menu, a second sprite manifest, or new gameplay entry logic.

## Source-level assessment and evidence

| Component | Source-level observation | Consequence for this project |
| --- | --- | --- |
| Title and campaign lifecycle | src/prototype/app.js: showTitleScreen() starts sprite warmup for the loaded current zone; enterPreparedScene() guards writer/campaign/visibility state, redraws before activation and only then starts simulation. | Retain these semantics. Do not invent a Canvas-only lifecycle or generate an unentered region. |
| Travel and dungeon entry | app.js: sceneTransitionTo() calls the existing native commit, runs bounded read-only sprite warmup, and reveals after drawReadyScene(); GPU arrival upload is conditional on WebGL mode. | Canvas can share the opaque loading interlude; optional CPU raster preparation can be added separately, without affecting fares, enemy placement or combat time. |
| Sprite decoding | src/prototype/sprites.js: a shared manifest, limited concurrent decodes, decoded-byte memory owner, warm(keys) with optional variants and clips. | Do not create an additional image decoder/cache. Measure cold/warm sprite behavior and extend selection only if evidence justifies it. |
| Canvas floor cache | src/prototype/ground-cache.js: **one** retained static outdoor floor raster, nominal 64 MiB logical RGBA budget, adjustable margin, invalidation on scene/revision/dimensions/transform/camera excursion. | Extend the proven cache rather than retaining an entire region. Instrument construction cost before changing its spatial organization or memory budget. |
| Canvas main painter | src/prototype/renderer.js: floor cache applies to outdoor floor tiles only. Terrain features, roads, footpaths, bridges and numerous depth-sorted entities are still drawn in the normal scene; combat cues are not cached as terrain. | Floor warmup alone cannot eliminate every cold-scene stall. Preserve art and depth correctness; profile other phases separately. |
| Existing render metrics | renderer.js exposes groundCache.status(), tile/entity counts, outline buffers and 1-in-12 sampled floor/terrain/entities/effects phase p95/p99. app.js has renderer timing and adaptive frame-skip metrics. | Add only missing diagnostic fields, and use paired device traces. Rendering phase samples are not equivalent to browser frame presentation. |
| Pixi-specific additions | src/prototype/pixi-experimental.js: GPU PrepareSystem, Pixi procedural texture cache and optional second CPU terrain lookahead. | These are **not** Canvas contracts. Do not copy GPU uploads, Pixi eviction or the Pixi staging raster into the normal Canvas code path. |
| Existing safeguards | tests/ground-cache.test.cjs and tests/ground-cache-browser.test.cjs exercise floor reuse, invalidation, direct fallback, interior behavior, materials and visual parity; title/scene-transition suites test save/time ownership and arrival safety. | Extend focused tests rather than replacing them or claiming a new full-device certification. |

### Existing benefits versus remaining gaps

Already implemented for Canvas: a bilingual main menu, inactive saves, Continue loading, bounded sprite warmup on title/arrival, native Canvas ready-first-frame draw, a static outdoor floor cache, graphics-quality controls, emergency performance protections and fallback when WebGL fails. These must remain intact.

Not established by the source or available evidence: measured cold-to-warm Canvas improvement from PR #518, CPU time spent rebuilding the ground cache (previous counters record counts/bytes only), whether precomputing additional terrain actually reduces p95/p99 hitches, process memory peaks on Chromebook/iPhone, or a general reusable procedural Canvas-entity cache. These are hypotheses, **not delivered features**.

### Risk register

1. **Main-thread contention — high until profiled.** Canvas raster precomputation, even inside requestIdleCallback, still runs on the JavaScript main thread. It can move a visible hitch into a supposedly idle period, or defer input. No unconditional region-wide prerender.
2. **Memory pressure — high for large raster windows.** Estimated width × height × 4 bytes omits backing-store overhead and image/decode copies. The existing 64 MiB cache is a limit, not proof of live process residency. New caches require a **combined** budget and forced retirement before replacement.
3. **Stale/wrong artwork — high correctness impact.** Key cache entries by authoritative scene identity, terrain/material revision, pixel dimensions, zoom/DPR, optimization quality and camera coverage. Revalidate again before promotion, not only when scheduling.
4. **Gameplay contamination — unacceptable.** Preparation must never call authoritative zone generation, movement, combat, game RNG, travel purchase, save writes or progression events. No invisible world ticking on title/loading screens.
5. **Misleading FPS — medium/high.** Adaptive frame skip and dynamic resolution can conceal renderer spikes. Compare drawn/eligible/skipped frames and p95/p99 frame-work tails, plus ground rebuild costs, to a matched baseline.
6. **Combat cue loss — unacceptable.** Attack telegraphs, projectiles, statuses, dynamic terrain and depth-sensitive entities must never be frozen into the static-floor cache. Mandatory live drawing wins over optional preparation.
7. **PWA and cancellation races — high.** Invalidate work on hidden page, campaign change, renderer switch, region change, resize/zoom/material revision, context loss and canceled menu/transition. Background pages must not commit delayed work.
8. **Dual-path regressions — medium/high.** The normal renderer also supplies Pixi's layered fallback/overlay. A Canvas optimization must not silently change WebGL presentation or Keep/Revert recovery.

## Phased implementation path

### Phase 0 — full source audit and acceptance contract (documented here)

Audit the renderer, ground cache, sprite manager, title/travel lifecycle, existing metrics/tests, resource ownership and Pixi crossover. Mark every claimed capability as source-proven, test-proven or device-unverified. Preserve merged PR #518; no second main menu or duplicated transition code.

**Exit:** this assessment and phased plan are committed to a standalone draft PR. No performance claim.

### Phase 1 — Canvas baseline instrumentation and safety tests (first code phase; started)

Add bounded **cache-build synchronous cost** telemetry to the existing Canvas ground cache: cumulative successful raster-build ms, maximum and last build ms, failed raster construction, and transform/budget refusals. Preserve existing builds/hits/bytes/margin status keys. Sample time **only when rebuilding**, not on every cache hit; do not allocate more raster surfaces, alter draw order, persist telemetry or add scheduling. Use injectable clock for deterministic focused Node regression coverage.

Extend tests to cover cache hits without rebuild cost, rebuild and invalidation, transform/budget refusals, failed allocation and explicit clearing. Follow with focused title/transition/source checks and the ordinary build/format CI. No new performance toggles or background tasks.

**Exit:** telemetry is finite, nonnegative and useful in renderer.metrics().groundCache; 64 MiB cap, exact raster behavior and fallback remain unchanged. Node/source checks pass; real-device traces remain a later requirement.

### Phase 2 — Canvas first-scene preparation from the shared main menu

Evaluate the **already existing** bounded sprite warmup in app.js first. Add a Canvas-specific prepare/readiness hook only if it performs additional justified reusable CPU work. Candidate: construct the single existing outdoor ground cache for the already restored arrival view while gameplay remains stopped; do **not** allocate a duplicate large raster, advance combat, alter the live canvas, or create previously unentered zones. Explicitly bound duration and cancel via generation/token checks on Continue, alternate save selection, page hide, resize and renderer change.

Because the current ground-cache painter closes over renderer state and camera origin, any offscreen prepaint must first demonstrate exact coordinate/clip/scene parity. If unsafe, keep the first-frame paint at Continue and rely on sprite warming. Give the player a ready frame, not a fake completion percentage.

**Exit:** exact same saved state, first visible frame, no extra gameplay time or save writes, no unbounded loading, meaningful paired cold/warm first-scene improvement or documented decision not to ship raster prepaint.

### Phase 3 — regional floor lookahead, only if Phase 1–2 traces justify it

Compare (A) present moving single-raster ground cache, (B) opportunistic bounded lookahead using the same budget, and (C) smaller static spatial tiles / resumable construction if appropriate. Cap **combined** retained Canvas backing-store cost, not each window independently. Retain the present 64 MiB ceiling until a device-backed decision; do not assume the second Pixi CPU raster works for Canvas. Precompute only from an already constructed scene, without modifying game state. Schedule only while visible, not in nearby combat or while input has priority; sync fallback remains mandatory on a miss.

**Exit:** demonstrable p95/p99 and memory tradeoff (including worst-case camera reversal, zoom, region return), visual parity, and a reasoned keep/reject decision. Rejecting extra caching is a valid outcome.

### Phase 4 — selective Canvas-specific procedural artwork reuse

Identify which non-sprite procedural scenery is expensive and immutable. Reuse only proven visually equivalent families with a verified key covering pose, variant, palette, shade, scale, DPR and materials. Actors, dynamic props, attack cues, status effects, shadows and depth ordering remain live unless independently proven safe. Leverage existing Pixi decorative identity audits as **ideas**, not automatic Canvas cache guarantees.

**Exit:** focused screenshot and identity tests, bounded memory/eviction, no stale images, measured reduction in expensive repeated art draws; otherwise drop the candidate.

### Phase 5 — transition and combat-aware preparation

Connect accepted Canvas prepaint/cache operations to the shared title, travel and dungeon loading interludes. Prepare high-priority near-spawn safe art, protect first hostile frame, defer optional lookahead and eviction during fighting, resume only when safely idle. Use the same guardrails as PR #518 for writer ownership, canceled transitions, previously constructed zones, bilingual UI and renderer fallback.

**Exit:** no duplicate native transition, no travel charges before authorized commit, no combat grace-time changes, no missing cues, and safe canceled/hidden/app-restored paths.

### Phase 6 — integrated device evidence and merge gate

Run paired cold/warm Canvas traces with the same save/zoom/DPR/optimization/FPS controls on the owner's ASUS Chromebook CX5403CMA-DB588 (8 GiB RAM), a contemporary 4 GiB+ phone and an 8 GiB+ desktop where practical; **these are provisional test configurations, not required minimum system specs**. Scenarios: title Continue; first visible hostile frame; Vale to goblins; sustained crowded fight; cross-region transport; main/side/supply dungeon; camera reversal; PWA restart and offline; return to same region; English/Spanish; save corruption/recovery; Canvas⇄WebGL Keep/Revert.

Capture startup/arrival latency, per-phase and whole-frame p95/p99, actual skipped/drawn frames, cache builds and refusals, process memory where available, screenshot parity and any display stalls. Accept individual changes only for measurable benefit without worse tail latency, memory, game state, or device reliability. Provide exact commit/run references and rollback. Merge/deploy requires explicit owner approval.

## Test philosophy and sequencing

Keep each phase focused. Run cheap deterministic source tests when behavior changes; run browser screenshot parity where raster behavior actually changes; reserve broad integration and physical devices for acceptance. Compare against the **same main baseline** and disclose trace provenance, viewport, device and sample count. Do not fabricate percent improvements. No build artifact, portable HTML restriction or speculative network fetch should drive the architecture: this is a multi-file GitHub Pages/PWA game.


## Phase 1 implementation evidence (27 October 2026)

The branch now records cumulative successful static-ground raster build time, largest and latest build time, allocation/paint failures, and invalid-transform/budget bypass counts in the existing groundCache.status() object already exposed by renderer.metrics(). It does **not** change the drawing algorithm, 64 MiB cap, cache key, saved-game schema, first scene timing or memory allocation policy. Rebuild timing samples occur only for actual new cached rasters, never hits. Explicit clearing releases bytes without erasing diagnostic history.

- Exact Phase 1 code/test commit: da27643e8affa5cd3e2689cee163ad979873647d.
- [Focused Actions run #40499965106](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40499965106) **passed**: relevant ground-cache Node suite plus another impacted test, reproducible offline/PWA build and JavaScript syntax. Pages publishing was **skipped** because this is a pull request.
- The test covers hit/rebuild distinction, deterministic timing, invalid transform and over-budget refusals, error paths, explicit clear, and nonfinite time sanitization.
- **Not run:** full browser visual comparison, real device profiling, memory residency, full game suite or measured first-scene optimization. Do not count CI as a renderer speedup.

## Phase 2 implementation checkpoint — 27 October 2026

**Candidate implemented on draft PR #527; no merge or deploy.**

- `ground-cache.js` now exposes `prepare({ ..., transform })`, refactoring the existing ground-cache construction so it can warm the **same single** static-floor raster without blitting into the visible gameplay canvas. Ordinary `draw()` calls the same preparation path then blits; its cache keys, 64 MiB budget, replacement behavior, and visible layer stay intact.
- `renderer.js` uses a **single shared outdoor-floor painter** for both live frames and the new `prepareCurrentGround()` API. The latter validates the already-restored current zone, rejects interiors/arena/unsupported zones/layer modes, accounts for the current camera/zoom/DPR and material revision, and draws only onto the existing cached raster. No secondary terrain surface, sprite atlas, offscreen live scene, game clock or save mutation is introduced. It does not render combat warnings or actors.
- `app.js` schedules that optional Canvas-only warmup **after shared sprite warmup** and only through `requestIdleCallback` while the title is inactive. It checks the exact title epoch, campaign identity, zone, writer ownership, visibility, renderer mode and idle-time allowance both before scheduling and before executing. Changing saves, selecting Continue, starting gameplay, hiding the app or switching to PixiJS invalidates the job. Browsers without idle callbacks simply use PR #518's ordinary ready-first-frame draw.
- Focused tests: `tests/ground-cache.test.cjs` verifies zero visible blits during preparation and reuse by the first normal paint; `tests/canvas-title-preparation.test.cjs` covers bilingual title inactivity, save integrity, Continue cancellation, hidden-state cancellation, inadequate idle budget and no-save behavior. `tests/helpers/production-shell.cjs` exposes an opt-in idle test hook.
- Provenance review: the source-only sprite-scope guard flagged the refactored renderer text; source comparison found no changed sprite families, palettes, artwork decisions or new asset registrations. The unchanged main-branch renderer hash was verified against `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json` and only the active renderer SHA-256 was refreshed (old `f8662ba5...`, reviewed candidate `15426db9...`). Historical art receipts remain untouched.
- **Safety/performance qualifications:** `requestIdleCallback` merely schedules synchronous work; it cannot interrupt a long ground-raster build. The 8 ms available-idle check is admission criteria, **not** a guarantee that paint completes inside 8 ms. Actual measured Chrome/iOS title responsiveness, memory usage, first-frame speedup, browser screenshot parity and PWA lifecycle acceptance are still required before claiming a performance improvement.
- This phase does **not** pre-render dungeons, prepare unvisited zones, duplicate PixiJS GPU uploads, change the asset manifest, or extend the regional cache memory budget. Its valid fallback is an ordinary uncached first draw, exactly as before.

**Phase 2 acceptance remains open:** collect actual browser/device baseline and screenshot parity for the title-prepared first scene. Phase 3 has independently assessed regional lookahead and explicitly declined additional runtime raster allocations without stronger evidence.

## Phase 3 regional lookahead checkpoint — 27 October 2026

The branch was reconciled with current `main@5c6197e` by merge commit `4b44956f`, preserving the newer `app.js` performance diagnostics and Pixi changes. GitHub's focused integration CI passed.

A dedicated benchmark using the actual Vale floor painter and production `GroundCache` compared 96-frame straight, reversing and zigzag camera routes with a hypothetical single-raster idle recentering approach. The sample ran in GitHub-hosted Node/@napi-rs/canvas (800×500 CSS, DPR 1.5), **not on the owner's Chromebook or a mobile browser**.

[Full measured table, provenance, interpretation and acceptance runbook](CANVAS_PHASE3_LOOKAHEAD_EVIDENCE_20261027.md). [Benchmark CI run #40504488471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40504488471) passed selected focused tests and build checks. Results showed fewer visible-frame raster rebuilds under the simulated recentering strategy, **but additional total builds and greater accumulated painting cost** on straight and reversing paths, with remaining large visible p99 delays. Idle painting also remains synchronous and non-preemptible.

**Disposition: keep the existing production ground-cache behavior unchanged.** The new benchmark is an evidence-gathering test, not a production optimization. Only reopen the lookahead gate after actual device playtest reports demonstrate material ground-cache-miss stalls and a guarded on-device A/B candidate shows a reliable net improvement without input/memory/art regressions. Phase 4, if pursued separately, must not imply Phase 3 passed performance acceptance.

## Phase 0–3 consolidation state

The separate [consolidation handoff](CANVAS_PHASE0_3_CONSOLIDATION_HANDOFF_20261027.md) inventories all code changes, preserves CI provenance and distinguishes source completeness from still-unrun browser/device acceptance. The Phase 3 benchmark's p95/p99 values are **ground-cache call durations** rather than complete game frames. The regional lookahead HOLD decision remains binding. Proceed to Phase 4 only as a measured, isolated procedural-art investigation, not as permission to release or merge unaccepted performance changes.

## Current progress ledger

- [x] Read-only architecture assessment against merged PR #518, Canvas floor cache, renderer, sprite manager and existing checks.
- [x] Dedicated Canvas follow-up branch created.
- [x] Phase 1 ground-cache metrics implementation and focused Node validation (commit da27643e; CI #40499965106).
- [x] Phase 2 source candidate: guarded idle first-scene ground preparation using the existing cache (focused regressions added; browser/device acceptance outstanding).
- [x] Phase 3 source-only lookahead A/B study and HOLD decision — no runtime lookahead enabled ([evidence and device gate](CANVAS_PHASE3_LOOKAHEAD_EVIDENCE_20261027.md)).
- [ ] Phase 3 real-browser / owner-device acceptance before any runtime lookahead implementation.
- [x] Phase 4 one-family evaluation completed with **HOLD** (no production procedural-art cache; 14/15 pixel mismatches in observational CPU raster trial).
- [x] Phase 5 shared transition/hostile-frame source integration reviewed with new production-shell regression and **no extra live synchronous Canvas prepaint** ([evidence](CANVAS_PHASE5_TRANSITION_COMBAT_PREPARATION_EVIDENCE_20261027.md)).
- [ ] Phase 5 physical-browser visual, memory and real-device combat/transition acceptance (not certified).
- [x] Phase 6 scoped Chromium/WebKit browser acceptance harness and measurement ledger added ([Phase 6 browser/device gate](CANVAS_PHASE6_BROWSER_DEVICE_ACCEPTANCE_20261027.md)); independently verify completed CI outcomes.
- [ ] Phase 6 actual physical Chromebook / phone / desktop acceptance and explicit owner merge decision.

**Hard boundary:** no claim of faster Canvas rendering, no automatic PR merge, and no Pixi renderer graduation until there is real device evidence.

## Phase 5 integration checkpoint — 27 October 2026

The shared native travel/dungeon/Continue flow already prepares read-only approved sprites around the committed destination and draws the first scene under an opaque interlude; dynamic hazards, combat cues and shadows remain live. The only accepted optional Canvas raster preparation remains title-only and uses the existing 64 MiB ground backing store. There is no justified additional Cache prepaint during active combat or dungeon admissions while Phase 3 regional lookahead and Phase 4 bitmap reuse are both held. `tests/canvas-phase5-transition-safety.test.cjs` adds focused bilingual actual-native-travel, hidden committed-arrival, retry and stale-title-paint guards, documented in [the Phase 5 evidence ledger](CANVAS_PHASE5_TRANSITION_COMBAT_PREPARATION_EVIDENCE_20261027.md). No renderer/game/save/Pixi/PWA code was modified in Phase 5. Browser screenshot and owner-device acceptance are **still outstanding**, so this checkpoint does not mark the whole Phase 5 performance acceptance as passed.

## Phase 6 browser and hardware acceptance checkpoint — 27 October 2026

[Phase 6 acceptance ledger](CANVAS_PHASE6_BROWSER_DEVICE_ACCEPTANCE_20261027.md) now defines the exact UI-driven cold/warm title-Continue measurement, browser Canvas frame/raster comparisons, artifact retention, focused Chromium/WebKit acceptance workflow and outstanding device matrix. A headless viewport is **not** an actual phone or Chromebook, isolated \`renderer.draw()\` timing is **not** game-wide p95/p99, and no CI success can waive screenshots, actual combat/hardware memory, PWA offline or owner approval. Production source and held Phase 3–4 runtime candidates remain unchanged.
