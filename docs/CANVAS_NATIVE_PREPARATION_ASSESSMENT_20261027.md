# Canvas 2D native preparation and performance — assessment and implementation contract

Date: 27 October 2026  
Baseline inspected: main at 24afe03a25c520ef2669b2978a5d3b76e4e6a5b5 (after merged PR #518)  
Status: Phase 0 source assessment; Phase 1 instrumentation candidate. **No measured Canvas speedup, physical-device certification, or approval to merge/deploy.**

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

## Current progress ledger

- [x] Read-only architecture assessment against merged PR #518, Canvas floor cache, renderer, sprite manager and existing checks.
- [x] Dedicated Canvas follow-up branch created.
- [ ] Phase 1 implementation and focused test validation.
- [ ] Phase 2 first-scene Canvas readiness prototype / measured no-op decision.
- [ ] Phase 3 floor lookahead A/B decision.
- [ ] Phase 4 proven Canvas procedural reuse.
- [ ] Phase 5 combat/transition integration.
- [ ] Phase 6 owner device evidence and merge decision.

**Hard boundary:** no claim of faster Canvas rendering, no automatic PR merge, and no Pixi renderer graduation until there is real device evidence.
