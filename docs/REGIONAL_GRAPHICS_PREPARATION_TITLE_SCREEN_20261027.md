# Azeroth Chronicles — regional graphics preparation and main-screen lifecycle

Status: **draft development workstream, not approved for merging or publication**  
Baseline: `main` at `740c4549cabb87455e0d9af8369e52a88cd06ad1` (27 October 2026).  
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

### Stage 0 — evidence and cache-contract housekeeping (this first commit series)

- Add Pixi diagnostics separating synchronous procedural baking, synchronous background updates and initial sprite-preload work. These **do not measure GPU completion, allocation or presentation latency**.
- Record cold vs warm runs on the same real device and setting; capture existing `proceduralBakes`, cache hits/evictions, `backgroundRepaints`, warmup counts, memory estimates, renderer-specific synchronous timing, and p95/p99 frame-time behavior. Separate active displayed draws from skipped draws.
- Inventory allocations, invalidation (zoom, DPR, region, PWA update), and context recreation. Use focused tests only; no automatic full browser/game certification.

### Stage 1 — genuine GPU readiness

- Verify the exact PixiJS 8.22 renderer texture upload/preparation API before coding it; actually schedule uploads into the active WebGL2 context, and validate readiness with a real-browser instrumentation test, not an `Assets.load` promise alone.
- Bound work and cancellation; protect already-visible resources and avoid CPU/GPU bursts. A failed preparation returns safely to Canvas. Capture uploaded counts and elapsed stage timings.
- Distinguish preparing shared sprites from preparing per-region graphics and never prevent Continue indefinitely waiting for optional art.

### Stage 2 — eliminate avoidable procedural bake duplication

- Establish visual identity equivalence tests (family/variant/form/rescue/unique pose, shade, effects, zoom, DPR, actor appearance).
- Share immutable raster outputs only where visual equivalence has been demonstrated. Actor placement, health bars, contact shadows, depth, and combat cues must remain independent.
- Verify no invalid reuse or lifetime leaks across region changes and device resizes. Preserve hard and soft texture budgets.

### Stage 3 — terrain-background decision, based on measurements

- Profile cold and warm `drawBackground`, raster blits, upload/update behavior, memory peaks and traversal hitches before replacing the current moving window.
- If justified, prototype small **static-only** spatial chunks and budgeted nearby precomputation. Keep roads/terrain visual parity; animate water/atmosphere separately; leave projectiles/telegraphs and all mutable gameplay off cached surfaces.
- Compare with the existing one-window approach on phone and low-end Chromebook. **Chunked terrain is conditional, not an unconditional prerequisite.** A measured decision to retain the current background is a valid stage outcome.

### Stage 4 — main title screen and save management

- Fresh PWA open/page reload shows a genuine bilingual title screen: Continue, New Game, Saved Games & Backups, Settings, Help & Credits. Reuse existing management and recovery pathways.
- A living page merely hidden/minimized and then brought back resumes the current surface unchanged. If a mobile OS kills the page, a genuine relaunched process shows the title screen.
- A restored campaign must be **loaded but inactive** until Continue. No enemy ticks, combat cooldowns, hazard updates, movement, timers, auto-save writes from title idle, or accidental creation/replacement of a campaign.
- Respect writer ownership, corrupted saves and checkpoints; Continue should be unavailable for missing/invalid saves with a recovery path. New Game keeps existing confirmation/backup safeguards.
- Return to Main Menu saves safely and stops active gameplay; diagnostic/developer/arena paths remain gated as today.

### Stage 5 — ready-first-frame loading and transitions

- While on title screen, prewarm the current save's arrival view under memory/time budgets. Continue reveals the world only after its first complete playable frame is available. If already ready, do not add an artificial delay.
- Shared art and currently relevant terrain are prepared first; later optional region areas can prepare incrementally. A loading display should show genuine stages, not an invented percentage.
- Prepare destination graphics before regional transport and dungeon/side-dungeon reveals where possible. **Preflight must not create authoritative zones, move actors, spend crowns, change progression, consume gameplay RNG, or leak unrevealed content.** Commit the travel only through existing game methods.
- Cancel stale preparation promptly when menu choice, zone, zoom, renderer, viewport or loaded campaign changes.

### Stage 6 — combat-aware prioritization

- Prefer nearby likely encounter/party resource warming before combat. During active combat, defer optional bulk bakes, expensive terrain preparation and aggressive eviction without ever suppressing required visual cues.
- No changes to the combat AI, hit timing, range, skills, RNG or gameplay frame cadence.

### Stage 7 — acceptance and release decision

Focused baseline/after comparisons: fresh load, Vale → goblins, crowded combat, all three hero classes, dungeons/side-dungeons, returning to previous regions, zoom/DPR changes, iPhone minimize/resume/context loss, corrupted and historical saves, Canvas/Pixi parity, low-end Chromebook, and Spanish/English title navigation.

Measure first playable frame, input responsiveness, preparation time, p95/p99 stalls and memory residency; do not infer a GPU win from lower synchronous JavaScript time alone. No automatic broad browser suite, no automatic merge and no deployment until separately authorized.

## Status log

- **27 Oct 2026:** Development branch opened from `main` at `740c4549`. Added Stage 0 **presentation-only synchronous Pixi preparation timings** to `pixi-experimental.js` (procedural bakes, background paints, initial sprite preload and first scene) and focused finite/nonnegative assertions to `tests/pixi-fidelity.test.cjs`. These counters are not GPU upload or actual frame-completion measurements; measured runtime performance has not yet been established.
- **Next:** validate the focused test and compare cold/warm traces; then implement genuine GPU upload warmup and carefully proven procedural reuse. Terrain replacement depends on its profile. **No title screen, GPU preupload guarantee or terrain chunking is implemented in this initial commit series.**
- All later stages remain **planned, not implemented** and require their own acceptance checks.
