# So I Became the Dark Lord's Problem — regional graphics preparation and main-screen lifecycle

## 28 October 2026 — Chromebook-first test candidate, PR #573 (DRAFT — not published)

The owner prioritizes smooth gameplay over quick loading and authorizes a **single active-region cache** experiment, **not all five regions simultaneously**. The target contract is:

- Continue/New Game: one visible title loading state, with saved arrival, sprites, procedural objects, and Pixi GPU uploads prepared before the scene is revealed. Let the hardware determine the loading duration; slow is not a renderer failure.
- Regional travel: prewarm the **destination region only** behind the transition. When entering a main dungeon, secondary dungeon or Treasury, prepare that entire interior using its actual native admission state; do not silently enter an unvisited dungeon or mutate an authoritative save for caching. Return from the interior should reuse the parent outdoor region's already prepared artwork.
- Pixi artwork retention: current-zone arrival traverses all admitted scenery/enemies/NPC/buildings regardless of camera distance; do not evict automatically at an occupancy threshold. The 1 GiB default image estimate is a last-resort guard and **not a claim of actual device RAM, GPU VRAM, or memory compatibility**. The approved sprite set is loaded once. Viewport changes re-register existing procedural textures in the rebuilt scene instead of destroying them.
- Directional idle preparation remains relevant for dynamically spawned or newly revealed assets, but already-admitted scenery should be ready at launch.
- Player may manually choose Canvas while loading. Real WebGL context failure retains its recovery path; no wall-clock timeout automatically declares slow preparation a failure.

**Critical boundary:** procedural *object texture* retention is implemented in this draft, but a **full-region terrain tile cache is not yet implemented**. Pixi currently has a camera-following Canvas terrain raster/background texture; normal motion can repaint it. Do not call this a fully cached map or claim all dungeon interiors are cached before first entry. Missing spawn-dependent art, possible screen/zoom-specific rasters, and additional GPU allocations also require actual-device verification.

**Verification:** draft source edits and focused regression fixtures are written; exact-head CI and Chromium WebGL2 visual, loading-duration, memory, p95/p99 movement/frame-time, dungeon return and Chromebook acceptance are pending. Do not merge, deploy or advertise a measured FPS improvement without these checks. Historical #518 status and its original baseline below remain authoritative for the published version.

**Current disposition — 27 October 2026:** [#518](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/518) **merged/published**, integrating Stages 0–6, the main-screen/Continue/guarded loading lifecycle, and bounded optional Pixi graphics preparation. Prior Stage 6 draft/merge holds below are **historical**. [Stage 7 device/browser visual, first-frame, memory and performance acceptance](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md) remains outstanding; [Pixi graduation #478](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/478) is open. Pixi/WebGL2 stays **experimental/optional**; Canvas 2D default/fallback. No measured GPU residency or performance win is claimed.  
**Historical implementation/handoff record:** [PR #518 engineering handoff](PR518_ENGINEERING_HANDOFF_20261027.md); read its merged-status preamble and do not resume the completed draft.  
**Historical original proposal baseline:** `main@740c4549cabb87455e0d9af8369e52a88cd06ad1`; see [pinned current checkpoint](DOCUMENTATION_PHASE0_BASELINE_20261027.md).  
Related: renderer graduation #478; GPU-resource/cache #417; crowd cold-art #481; alternate open draft #487; merged batch #490.

## Goal and non-goals

Build a proper **Main Menu → Continue → ready first frame → gameplay** lifecycle, and use the inactive title/menu and travel/dungeon interludes to prepare reusable regional graphics before they are required. Avoid the first-use art stalls that are particularly disruptive during exploration and combat.

Keep Canvas 2D the safe fallback. Keep the existing main-world simulation, authored visual canon, game clock, campaign-save schema, English/Spanish paths, renderer Keep/Revert policy, WebGL context-loss recovery, adaptive frame skip and emergency safeguards unchanged unless individually reviewed. There is **no reason to enforce a portable single-file architecture**: the project is a multi-file GitHub Pages/PWA game.

Neither `PIXI.Assets.load()` nor `PIXI.Texture.from()` proves a texture was uploaded to the GPU before first use. Likewise, a retained background window is not a full pre-rendered region. Do not describe either as completed GPU preparation.

## Confirmed source baseline

- `src/prototype/pixi-experimental.js` loads approved outdoor sprite sources up front; a 27 October inspection found **37 unique manifest source URLs**, though this can change with the manifest.
- First visible procedural art is rasterized by `bake()` and converted into a Pixi texture in `ensureProcedural()`. Cache keys include zoom, density, actor key, zone, and appearance-dependent fields. Never share a procedural image based on species/name alone unless a proof confirms identical output and geometry.
- `warmNeighborhood()` currently prepares at most 18 fringe identities within a 600 ms startup window and stops near the cache soft cap. The default procedural image-data hard ceiling is 256 MiB; soft trimming starts at 62.5%, reducing to 50% where safe. These are logical image estimates, **not complete GPU+browser memory measurements**.
- The Pixi background is one camera-following Canvas raster with a 220-unit margin; movement/zoom/zone changes can redraw and update the underlying texture. Separately, the Canvas renderer has a one-window 64 MiB ground cache. Neither implements region-wide tiled GPU terrain.
- `app.js` restores saves immediately and sets `started = true` on a successful load. Startup/menu/lifecycle code must distinguish an available restored campaign from a simulation that may run. The title screen is not a live gameplay surface.
- The existing PWA writer guard, v4 checkpoints, recovery/backup protections, saved WebGL preference, and a Canvas fallback must remain authoritative.
- The open PR #487 includes *additional* opportunistic streaming beyond merged #490. Audit its unique portions against current `main`, rather than merging it blindly.

## Engineering order and acceptance gates

### Stage 0 — evidence and cache-contract housekeeping (instrumentation implemented; device traces outstanding)

- Add Pixi diagnostics separating synchronous procedural baking, synchronous background updates and initial sprite-preload work. These **do not measure GPU completion, allocation or presentation latency**.
- Record cold vs warm runs on the same real device and setting; capture existing `proceduralBakes`, cache hits/evictions, `backgroundRepaints`, warmup counts, memory estimates, renderer-specific synchronous timing, and p95/p99 frame-time behavior. Separate active displayed draws from skipped draws.
- Inventory allocations, invalidation (zoom, DPR, region, PWA update), and context recreation. Use focused tests only; no automatic full browser/game certification.

### Stage 1 — genuine GPU readiness (upload barrier implemented; live WebGL validation outstanding)

- Verify the exact PixiJS 8.22 renderer texture upload/preparation API before coding it; actually schedule uploads into the active WebGL2 context, and validate readiness with a real-browser instrumentation test, not an `Assets.load` promise alone.
- Bound work and cancellation; protect already-visible resources and avoid CPU/GPU bursts. A failed preparation returns safely to Canvas. Capture uploaded counts and elapsed stage timings.
- Distinguish preparing shared sprites from preparing per-region graphics and never prevent Continue indefinitely waiting for optional art.

### Stage 2 — eliminate avoidable procedural bake duplication (five fixed decorative families proven; character deduplication outstanding)

- Establish visual identity equivalence tests (family/variant/form/rescue/unique pose, shade, effects, zoom, DPR, actor appearance).
- Share immutable raster outputs only where visual equivalence has been demonstrated. Actor placement, health bars, contact shadows, depth, and combat cues must remain independent.
- Verify no invalid reuse or lifetime leaks across region changes and device resizes. Preserve hard and soft texture budgets.

### Stage 3 — terrain-background decision (bounded lookahead prototype in branch; device A/B decision outstanding)

- Profile cold and warm `drawBackground`, raster blits, upload/update behavior, memory peaks and traversal hitches before replacing the current moving window.
- If justified, prototype small **static-only** spatial chunks and budgeted nearby precomputation. Keep roads/terrain visual parity; animate water/atmosphere separately; leave projectiles/telegraphs and all mutable gameplay off cached surfaces.
- Compare with the one-window Canvas baseline on the owner’s exact ASUS CX5403CMA-DB588 Chromebook and a contemporary phone. **Chunked terrain is conditional, not an unconditional prerequisite.** A measured decision to retain the current background is a valid stage outcome.

#### Stage 3 implemented prototype — 27 October 2026

A measured-decision candidate is now present on this draft branch, **without switching to region-wide tiles or a second GPU atlas**:

- The existing 220-CSS-unit Pixi background canvas, its GPU texture source, authored terrain/roads/architecture painter and 132-CSS-unit camera rebase threshold remain authoritative.
- With `requestIdleCallback` available and the player safely outdoors away from nearby living enemies/projectiles, camera travel past about 73 CSS pixels requests **one optional look-ahead render**. An independent painter reads the **already-live zone** using a presentation-only camera-anchor offset; it never moves the hero, creates another zone, consumes gameplay RNG or changes persistent state.
- An opt-in second **CPU canvas only** holds that adjacent background. At the original Stage 3 checkpoint, two CPU background windows fit **32 MiB estimated RGBA**; this combined cap was subsequently raised to **64 MiB** for the owner-approved validation cohort. The hard cap remains finite; otherwise the feature does nothing. Its painter explicitly disables a second outdoor ground cache. No additional Pixi/GPU background texture is retained.
- When the existing camera crosses its rebase threshold, a validated matching staged canvas is copied into the **original** backdrop and its existing GPU texture source is marked updated. Stale/missing staged windows use the original `drawBackground()` immediately, protecting continuity, hero motion, quality/zoom changes and scene correctness.
- Cancels pending idle callbacks and releases extra CPU canvas memory on renderer teardown/viewport/density rebuild. Checks campaign identity, zone, renderer density, camera zoom, optimization state and pixel coverage before promotion. Hidden PWA surfaces, arenas, dungeon/supply/side-dungeon interiors and nearby combat skip optional work.
- Added diagnostics `backgroundLookaheadPaints`, `backgroundLookaheadPromotions`, `backgroundLookaheadMisses`, `backgroundLookaheadFailures`, `backgroundLookaheadBytes`, `backgroundLookaheadPaintMs`, `backgroundLookaheadPromoteMs`, `maxBackgroundLookaheadPromoteMs`. These are **CPU synchrony/estimated CPU bitmap counters**, not GPU presentation or VRAM measurements.
- Focused `tests/pixi-fidelity.test.cjs` covers advance scheduling, retaining the active backdrop until crossing, staging budget, disabling the duplicate ground cache, copy/update of the existing GPU source, fallback when no staged window exists, combat deferral and release. The full **focused validation and offline PWA build passed** at [GitHub Actions #40471830540](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40471830540). This was not the broad live-browser matrix.

**Open acceptance question:** idle terrain painting still runs synchronously on the browser main thread, even when scheduled during an idle callback, so it can *move* a hitch rather than remove it. A second CPU window can also increase memory pressure. Collect matched p95/p99 frame costs, stutter locations, peak actual device memory, and exact screenshot parity on iPhone and Chromebook (different zoom/DPR, combat, town→wilderness, region return, dungeon entries, day/night/water) before calling it faster or replacing the moving-window strategy. If the tradeoff is poor, keep the original renderer or investigate smaller/static spatial chunks and a resumable terrain work queue; do not ship unmeasured performance claims.

### Stage 4 — main title screen and save management

- Fresh PWA open/page reload shows a genuine bilingual title screen: Continue, New Game, Saved Games & Backups, Settings, Help & Credits. Reuse existing management and recovery pathways.
- A living page merely hidden/minimized and then brought back resumes the current surface unchanged. If a mobile OS kills the page, a genuine relaunched process shows the title screen.
- A restored campaign must be **loaded but inactive** until Continue. No enemy ticks, combat cooldowns, hazard updates, movement, timers, auto-save writes from title idle, or accidental creation/replacement of a campaign.
- Respect writer ownership, corrupted saves and checkpoints; Continue should be unavailable for missing/invalid saves with a recovery path. New Game keeps existing confirmation/backup safeguards.
- Return to Main Menu saves safely and stops active gameplay; diagnostic/developer/arena paths remain gated as today.

### Stage 5 — ready-first-frame loading and transitions (source candidate; device/browser acceptance open)

- While on title screen, prewarm the current save's arrival view under memory/time budgets. Continue reveals the world only after its first complete playable frame is available. If already ready, do not add an artificial delay.
- Shared art and currently relevant terrain are prepared first; later optional region areas can prepare incrementally. A loading display should show genuine stages, not an invented percentage.
- Prepare destination graphics before regional transport and dungeon/side-dungeon reveals where possible. **Preflight must not create authoritative zones, move actors, spend crowns, change progression, consume gameplay RNG, or leak unrevealed content.** Commit the travel only through existing game methods.
- Cancel stale preparation promptly when menu choice, zone, zoom, renderer, viewport or loaded campaign changes.

### Stage 6 — combat-aware prioritization

- Prefer nearby likely encounter/party resource warming before combat. During active combat, defer optional bulk bakes, expensive terrain preparation and aggressive eviction without ever suppressing required visual cues.
- No changes to the combat AI, hit timing, range, skills, RNG or gameplay frame cadence.

### Stage 7 — acceptance and release decision

Focused baseline/after comparisons: fresh load, Vale → goblins, crowded combat, all three hero classes, dungeons/side-dungeons, returning to previous regions, zoom/DPR changes, iPhone minimize/resume/context loss, corrupted and historical saves, Canvas/Pixi parity, the owner’s ASUS CX5403CMA-DB588 Chromebook, and Spanish/English title navigation.

Measure first playable frame, input responsiveness, preparation time, p95/p99 stalls and memory residency; do not infer a GPU win from lower synchronous JavaScript time alone. No automatic broad browser suite, no automatic merge and no deployment until separately authorized.

## Status log

- **27 Oct 2026:** Development branch opened from `main` at `740c4549`. Added Stage 0 **presentation-only synchronous Pixi preparation timings** to `pixi-experimental.js` (procedural bakes, background paints, initial sprite preload and first scene) and focused finite/nonnegative assertions to `tests/pixi-fidelity.test.cjs`. These counters are not GPU upload or actual frame-completion measurements; measured runtime performance has not yet been established.
- **27 Oct 2026, next commit series:** Installed the optional `PIXI.PrepareSystem` extension explicitly for the pinned non-module PixiJS 8.22 bundle **before** `app.init`, then awaited `renderer.prepare.upload` of loaded approved sprite textures and of nearby/visible procedural textures before revealing WebGL. Uses Pixi's own four-item-per-tick bounded upload queue and epoch-safe cancellation (including when a context/phone session is interrupted). Exports preparation batch, elapsed and completed-input counts as diagnostics; counts are accepted input textures, not driver-measured fresh texture allocations. This path requires actual real-browser WebGL acceptance before being considered production-proven. Focused PR check [40465777929](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40465777929) passed, including `tests/pixi-fidelity.test.cjs`, Pixi source contracts and reproducible PWA build; **no real device speedup is yet claimed**.
- **27 Oct 2026, procedural-art pass:** Added an explicit opt-in cache identity for five authored, fixed decorative shapes: `crate`, `barrel`, `woodpile`, `stacked-lumber`, and `scroll-stack`. These share immutable procedural raster sources when they have a safe field schema, same scene/zone, zoom, backing density and visual scale; separate actor keys retain individual placement, depth and contact shadows. Unrecognized fields, animated/ID-varied art, enemies, pets, companions, hero art, poppy patches, carts and evolving forms keep per-entity identities. Reuse counts now include `sharedProceduralHits` in exported renderer diagnostics. The focused regression additionally compares the **actual authored Canvas draw instruction streams** across different IDs and positions, checks safe sharing, special-form isolation, distinct cart textures and warm-frame non-rebaking. Focused validation [40467933690](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40467933690) **passed** on the code commit, including `tests/pixi-fidelity.test.cjs` and the reproducible offline PWA build. This is not a physical GPU or gameplay-FPS benchmark.
- **27 Oct 2026, terrain-lookahead prototype:** Implemented one optional idle-prepared CPU terrain/road raster for safe outdoor travel, a combined two-window **32 MiB** bitmap cap, guarded promotion into the existing Pixi GPU texture source, immediate original-painter fallback, and preparation/promotion/miss/error counters. Preparation is not run when page is hidden, in arenas/dungeons, with projectiles, or near living enemies. The new `tests/pixi-fidelity.test.cjs` cases cover successful promotion, a fallback redraw, combat suppression and memory lifecycle. [CI #40471830540](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40471830540) passed the affected source tests and reproducible build. The then-current consolidated draft head `ac1bc1af` also passed [CI #40472347209](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40472347209). **This is a candidate for device profiling, not an accepted faster terrain renderer.**
- **27 Oct 2026, handoff reconciliation:** Consolidated exactly what is implemented, source-tested and still unverified in [PR #518 engineering handoff](PR518_ENGINEERING_HANDOFF_20261027.md). No formal FPS win, physical-device acceptance, full browser matrix or released feature is claimed. At audit time `main` had advanced beyond the draft baseline (through merged #520 and #522); reconcile with current main before modifying startup or merging.
- **Historical Stage 3 next step (superseded):** Implement Stage 4 main screen/Continue lifecycle using the handoff acceptance checklist and current startup/save architecture. Independently collect cold/warm live-browser and target-device traces before accepting the performance work, expanding sharing, or deciding on terrain chunks. General procedural **character** deduplication requires separate equivalence proofs for body variants, equipment, facing, form, ranged/charged state and rescue status.
- **Historical Stage 3 checkpoint (superseded):** Stages 4–7 were then planned. See the current status above; device/visual acceptance remains open.

- **27 October 2026, Stage 4 candidate:** Reconciled main with this draft, retaining Pixi stages 0–3. A separate inactive public-brand title surface, safe Continue draw-before-start, title save management and in-game return are implemented for focused review. Broad browser/physical device acceptance remains open; Stages 5–7 are not complete.

- **27 October 2026, original Stage 5 bounded arrival pass (historical, subsequently expanded):** Added bilingual opaque transitions for existing regional, Crown hub, dungeon entrance and interior exit actions; a read-only sprite preflight of at most 12 approved keys and 300 ms waiting, drawing after native travel succeeds and before gameplay resumes, with Canvas retry, cancellation and writer protection. Neither preflight nor the title's optional current-scene warming calls `Campaign.zone` for unentered destinations. The actual domain travel/interaction remains authoritative. Pending focused CI and real browser/device acceptance; this is neither a GPU upload benchmark nor authorization for merge/publication.

## Supported-device design baseline — owner decision, 27 October 2026

Do **not** optimize Azeroth Chronicles for a 500 MB phone, a ~20-year-old PC, or a single exceptionally slow colleague device. That device gave useful earlier feedback but is not an acceptance gate or the standard against which art quality is compromised. This is a 2D RPG and its graphics systems should have enough working set to avoid repeated baking and hitches on ordinary current hardware.

**Provisional validation cohort, not yet published minimum specifications:** recent actively supported browsers on PCs with approximately **8 GiB RAM or more** and phones/tablets with approximately **4 GiB RAM or more**, using ordinary modern CPU/GPU hardware. These numbers are planning assumptions pending measured browser and physical-device testing. WebGL2 remains an optional user-controlled renderer, Canvas 2D remains the reliable fallback; do not reject devices merely because GPU mode is unavailable. The developer retains final authority to revise/publish actual requirements from evidence. No hardware-memory probing or exclusion based on these unverified thresholds is authorized here.

**Resource policy:** amortize expensive work and cache useful nearby art, including an immediately encountered dungeon's enemies and the player's party. Keep deterministic engine/gameplay intact. Preserve finite budgets, lifetime cleanup, and fallback against actual out-of-memory or context loss; these are safeguards, not an excuse to constrain typical devices to toaster-level working sets. Stage 5 expands manifest sprite preflight from 12 to **64 selected nearby keys** (priority: imminent hostiles, hero, party, nearest actors), while retaining the sprite manager's **256 MiB hard decoded-resource budget**. Normal read-only preflight may wait up to **750 ms**. For main/secondary/supply-dungeon entrances, skip pre-commit blocking, invoke the native entrance action, then warm actual nearby encounter art for at most **1400 ms** on main/side/supply dungeon entry (**1200 ms** on other arrivals) while the screen covers the scene and all simulation is paused; reveal only after the real first draw. Late optional decoding must not commit another action. The opt-in two-CPU-window Pixi terrain budget increases from **32 to 64 MiB combined**; the existing single GPU backdrop and GPU texture lifecycle remain unchanged. Procedural Pixi texture LRU soft trim adjusts from 62.5→50% of the 256 MiB budget to **75→62.5%**; the hard ceiling remains 256 MiB. These are cache-capacity guardrails, **not** measured peak process/GPU memory usage.

Verify first-frame correctness and input readiness before spending optional idle work. Acceptance compares actual current-target devices using frame-time tails, warm re-entry, first visible hostility, CPU stalls and process/texture residency. There is no requirement to make obsolete ultra-low-memory hardware pass.

- **Stage 5 first-fight refinement:** Post-commit staging on every destination plus New Game/Continue now ranks actual nearest enemies, warming their variants and combat clips before reveal. Confirmed Pixi additionally warms and GPU-uploads nearby procedural enemy art behind the loading screen; a timeout/driver failure reverts to Canvas. No pre-generation of unentered zones. Test in real first-goblin and dungeon/side-dungeon encounters before accepting smoothness or minimum requirements.


### Current owner Chromebook and Stage 6 reconciliation — 27 October 2026

**Primary hardware acceptance device:** ASUS Chromebook **CX5403CMA-DB588**, exact consumer configuration with **8 GB LPDDR5X RAM** and **128 GB NVMe SSD** (owner-provided specifications). This is the ChromeOS test reference, not proof that every 8 GB machine behaves identically. The secondary planning cohort is contemporary phones/tablets near 4 GiB RAM or higher, with competent browsers and GPU. Do not make the extremely slow ~500 MB phone or twenty-year-old PCs performance acceptance targets. These are *provisional validation targets*, not officially certified minimum requirements; no RAM-based admission block is proposed.

**Stage 6 draft behavior:** Current-zone projectiles or living enemies within 420 world units suppress optional terrain lookahead and defer *soft* Pixi procedural-art eviction. Mandatory visible-art rendering, strict 256 MiB hard image budget and Canvas fallback stay intact. This read-only guard does not alter campaign RNG, combat duration or attack mechanics. Focused source regressions include an active-fight cache retention assertion and non-combat reclamation. Hardware benefit remains unmeasured.

**Canonical timing and memory from current source:** maximum **64** unique approved sprite keys; optional non-critical preflight waits up to **750 ms**, post-admission nearby art up to **1400 ms** for combat-critical interiors and **1200 ms** for other arrivals; Continue can warm the restored scene for up to **1400 ms** after recovery. Confirmed Pixi’s optional procedural GPU arrival warm has an **1800 ms** deadline before Canvas fallback; the inner prewarm also has its own bound. CPU two-window terrain estimate **64 MiB combined**, 256 MiB procedural hard image-data cap, and optional 75% → 62.5% LRU trim. These are not total RAM or GPU memory measurements. Some loading stages occur sequentially and the overall transition can exceed any one limit.

The [target-device acceptance runbook](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md) governs Stage 7. No reviewer should infer a measured FPS improvement, full browser acceptance, or release permission from green Node/source tests.


### Stage 7 ownership and conditional merge approval

The owner will test the integrated game on their own ChromeOS device and follow up with real-browser results. They have authorized **merging PR #518 after clean exact-head technical CI and absence of source blockers**, rather than delaying integration until live-device testing can be run by the assistant. Merge exposes the *optional* Pixi trial while keeping Canvas reliable; it does not graduate WebGL2 from experimental, establish minimum hardware specs or prove performance improvement. Record failing real-world behaviors during Stage 7 and fix them in follow-up changes.
 
## Chromebook-first complete-region terrain cache trial (draft PR #573, 28 October 2026)

The owner selected **one major region at a time**, not all five simultaneously. During Continue, New Game, and interregional travel, the loading surface remains visible while PixiJS finishes the current region's complete static-terrain tile atlas and all admitted procedural artwork. The engine rasterizes the full isometric region into reusable 512-CSS-pixel tiles in bounded cooperative batches; it does **not** render one enormous GPU texture. Subsequent camera movements assemble a viewport-sized GPU background from these retained CPU tiles rather than invoking the full original terrain painter.

Main dungeons, secondary dungeons and treasuries are admitted only through the existing gameplay action. Their own loading screens prepare the full enclosed terrain and live artwork. **The exterior region atlas and prepared actor images stay cached while visiting interiors and when returning outdoors.** Changing major regions starts a new major-region terrain atlas family. This does not advance simulated time, reveal the destination early, alter the RNG or create an unopened dungeon.

Already-registered sprite manifest textures load once, with higher cache residency and no arbitrary successful-preparation timeout. GPU context loss or a real allocation failure can still use the Canvas fallback, and the player can manually choose Canvas if a load hangs. This is a **draft test**, not merged, deployed or Chromebook-verified. The regional terrain raster is only the static floor/terrain/roads; actors, effects, enemies and combat are still live-rendered each frame. Before publication test 100%/150%/175% zoom, exterior→dungeon→exterior, boss approach, first-frame and terrain parity, memory use, loading time and 95th/99th percentile frame duration.
