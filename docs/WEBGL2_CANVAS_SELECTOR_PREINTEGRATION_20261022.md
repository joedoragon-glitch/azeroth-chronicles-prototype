# Canvas 2D (default) / WebGL2 — PRE-INTEGRATION SPECIFICATION

**STATUS: PREPARATION ONLY · NOT APPROVED FOR GAME INTEGRATION (2026-10-22)**

The owner explicitly requests exactly two final graphics renderer options: **Canvas 2D (default)** and **WebGL2 (optional)**, never a hybrid choice in the game Settings. They also explicitly prohibit enabling this unfinished experimental work in the live PWA until it is fully functional and proven using real, moving Azeroth artwork. All code in this preparation is under `tools/webgl-pilot/`, not loaded by `templates/game.html`, `scripts/site-assets.cjs`, the service worker or the shipping `src/prototype/app.js`. The preparation branch must **not** be merged/deployed as a game feature yet.

## Existing facts and blockers

The shipping `src/prototype/app.js` creates a 2D context from `#world` immediately and passes it to `PrototypeRenderer.create({ canvas: viewport, ctx, getGame, platform, ... })`. The app's input maps through `renderer.world`, and its frame loop calls `renderer.queue`, `renderer.update`, `renderer.draw`, `renderer.metrics`, `renderer.labelVisible`, `renderer.setOptimizationMode`, `renderer.screen` and `renderer.tileBounds`. A replacement must support the entire active renderer API (see executable contract).

There is extensive bespoke procedural art in `src/prototype/visuals.js`, composited atmospheric/night lighting with screen blends, terrain and road materials, animated sprite clips and silhouettes, occlusion outlines, effects, UI, dynamic labels and cave/room floor logic. These cannot be dismissed as aesthetic details. Night lamps and lighting MUST retain their approved art and behavior; gameplay, simulation and saves cannot change.

**Why existing demos are not candidates to install:** `canvas-vs-webgl.js` measures moving a GPU snapshot of a scene initially painted using Canvas; its last measured visible-image agreement fell to 91.064% during camera motion and it did not animate independent WebGL characters. `real-world-gpu.js` performs layered Canvas-source artwork uploads with 97–99% image agreement; it is not native WebGL scene generation. Neither satisfies complete dynamic scene parity. A GPU display call of ~0 ms does not establish game FPS.

## Future backend API contract

Implement a distinct **native WebGL2** renderer module in a new development branch. It must implement all functions enumerated by `tools/webgl-pilot/renderer-release-contract.cjs`, without invoking the Canvas production renderer to paint full frames or the dynamic game world each frame. It may reuse the game's **original, approved asset images as GPU textures** and precompute immutable artwork from Canvas at bounded, explicitly accounted setup times. Dynamic sprite frames, body orientation, animation, terrain, shadow/occlusion ordering, combat cues and all screen-space lighting must be executed correctly in the native GPU frame path.

The backend receives the same read-only `getGame`, platform/camera/projection and presentation events as Canvas. It must not mutate `Campaign`, profile, inputs, save schema, combat rules or entity state. Common simulation remains singular and authoritative; do not instantiate a different game to switch renderers.

**Graphics selector after certification (NOT coded into game now):** `Screen and performance → Graphics renderer → Canvas 2D (Default) / WebGL2`. Only two values: `canvas2d`, `webgl2`. Unknown, invalid, unverified, unavailable or failed WebGL always resolves to Canvas. Device-only preference should be kept outside campaign saves and exports. An absent preference resolves to Canvas. Display labels should be translated consistently with existing `tr()` localizations. Selection must preserve frame-rate targets, optimization preferences and render-resolution settings.

**Canvas contexts cannot be switched in place.** When adding the player option later, prepare the WebGL canvas as a second independently owned canvas in the existing world display region (same viewport/CSS stacking), keep original Canvas alive, and perform a handoff only after WebGL successfully produces a correct frame. Never call `getContext('webgl2')` on a canvas already holding `2d` (or vice versa). DOM HUD/modal/touch overlays must remain in place, accessible and visually unchanged.

**Atomic switch:** stop presentation briefly but never stop or recreate simulation; load/prepare resources; validate context and render output; switch visible surface; resume presentation; rollback to working Canvas automatically if resource load, draw or context fails. Keep selection stable through resize, visibility changes, resolution and camera zoom, while preserving all input mapping. On `webglcontextlost` suppress default destruction, disable WebGL display and immediately return to Canvas; on restore only offer opt-in retry after rebuilding textures/shaders. Do not copy a broken GPU image into Canvas as fallback.

## First GPU-native foundation — staged, not integrated

The isolated branch now also contains `tools/webgl-pilot/native-webgl2-core.js` and `native-webgl2-core.test.cjs`. This is **new WebGL2-only drawing code**, not the previous "Canvas screenshot moved by GPU" workaround:

- Its renderer takes ordered draw commands, uses WebGL2 shaders and triangles, and never paints frames through a Canvas 2D context.
- It uploads approved original image/atlas pixels **once when a texture is registered**, tracks a fixed 64 MiB default GPU residency budget and can reject over-budget resources; frame commands reuse already resident textures. Its sprite layout follows the actual original display dimensions, clipped animation-frame pivots, nearest sampling and horizontal facing.
- It implements GPU-generated radial **lamp glow** primitives, including the real game's lamp/source positions and warmth palette, plus a GPU night-grade shader. These primitives run in WebGL2; lamps are **not required to stay Canvas-based**. Their *appearance and behavior* are the protected reference. Shader/blend parity and all fixture art still require validation.
- It accepts commands in exact caller-provided order, so future stage integration can preserve depth and compositing. Unsupported command kinds are errors, never silently omitted artwork.
- It detects WebGL context loss, calls the recovery hook and refuses further drawing until resources/programs have been recreated in a new renderer instance; the playable Canvas fallback is **not yet wired**.
- `native-webgl2-core.test.cjs` verifies source projections, animation image clipping, facing, lamp radii/colors, GPU-only draw dispatch, GPU memory limits, context-loss behavior and unsupported-art errors using a fake GL interface. Seven tiny checks passed in the isolated development evaluation. **No real WebGL hardware, visual parity or FPS validation of this module has been run.**

The GPU core **does not yet** cover dynamic command extraction from all production entities, procedural high-fidelity bodies, terrain painting, road/material shading, original fixture shapes, full lighting compositing, outlined occlusion, transient combat VFX, labels, UI or every dungeon. It is intentionally **not imported into the game's app**, not published by GitHub Pages and not marked ready in `renderer-readiness.json`. The next preparatory work is to feed the GPU-only command list from the original campaign state with proper frame/sprite selection and all source assets, then add full-scene rendering features and real-device pixel tests, one domain at a time, without swapping the default.

For this foundation's focused checks only: `node --test tools/webgl-pilot/native-webgl2-core.test.cjs`. The old readiness gate remains mandatory and **NOT_READY**.

## Second GPU-native foundation: live sprite selection and bounded asset residency

The staging branch now includes three additional isolated files:

- `tools/webgl-pilot/native-sprite-adapter.js` — reads the **existing `PrototypeSprites` catalog** through `definitionFor`, `variant`, `frameFor`, `entityScale` and `timeMs`, and translates its original images and clip-frame rectangles into native GPU sprite commands. It tracks the same kinds of actor motion/clip directions, hurt/death, explicit clips and presentation events without mutating the game simulation. Its focused checks use the **real manifest** (including actual goblin animation atlases and ranger art). Reduced-motion support uses the game's original static resource. Assets excluded by current production art policy (including the paladin's procedurally authored body) are explicit `original-game-procedural-art` blockers, not invisible omissions. This adapter is not installed into `PrototypeSprites` or the playable game.
- `tools/webgl-pilot/native-asset-residency.js` — accepts only canonical relative PNG/WebP sprite asset paths, verifies decoded dimensions against the approved manifest, deduplicates concurrent requests, limits decoding concurrency and queue length, and implements a bounded **64 MiB default GPU texture residency with LRU eviction** and frame pinning. A missing or incorrect original image rejects; it is never silently replaced. Resource generation cancellation rejects stale jobs before they upload new art into an invalidated GPU context.
- `tools/webgl-pilot/native-webgl2-core.js` now validates a **complete ordered frame display list before clearing or drawing any pixels**. Unsupported effects, invalid lamp/grade values and unavailable textures fail atomically rather than producing a partly painted frame. Existing sprite, lamp-glow, night-grade and context-loss GPU primitives remain staging-only.

Corresponding narrow tests: `native-sprite-adapter.test.cjs` (8 cases), `native-asset-residency.test.cjs` (9), `native-webgl2-core.test.cjs` (9), and `renderer-release-contract.test.cjs` (5). **All 31 checks passed in an isolated JavaScript test harness using mocked GPU interfaces and source files from this branch.** There were *no actual WebGL shader/hardware visual comparisons, game/browser suites, CI runs, or deployments for this work*. These checks validate logic and guards, not frame fidelity, usable FPS or game readiness.

**Known necessary engineering work:** The production Canvas renderer owns complex original actor overlays, newer procedural paladin/mage/armor bodies, terrain and road clipping, scene fixture geometry, animated glows, combat effects, occlusion, camera labels, dungeons, and the exact original night screen-blending order. They are not yet emitted as native WebGL commands. Some animations and presentation behavior are private to the Canvas implementation, so independent per-frame command extraction and side-by-side hardware parity need further work. The 64 MiB sprite budget is a starting bound, not an approved Chromebook memory allocation; sustained resource pressure must be measured on hardware. Shader source compilation and actual lighting/alpha parity remain unverified on real hardware.

**Readiness stays `NOT_READY`**, and no graphics Settings selector is installed. When integration is explicitly approved after full parity, the only two options will remain **Canvas 2D (default)** and **WebGL2**. Light fixture artwork, lamp glow, original grading and visual effects may all be GPU-generated in WebGL2; they must faithfully match their existing approved designs, not remain Canvas-only.

## Required genuine WebGL implementation work

1. Native GPU batching for sprites and procedural bodies with original per-actor frame selection, artwork pivots, zoom, facing and depth order. Do not replace quality artwork with generic polygons.
2. Correct floor/terrain/roads/bridges/materials across outdoor regions, room interiors and dungeons. Manage texture/camera-region cache invalidation and bounded GPU memory.
3. Shader/composite equivalents for **unchanged** lights, lamp glow, night/day grades, shadows, screen blends, aura, occlusion masks, combat glyphs/projectiles, world labels and transient VFX.
4. Dynamic actors, inventory/quest/zone transitions, hero movement, teleports, combat, dying/revival, and changing daytime under both modes.
5. Correct DPR/resolution/frame-skip/optimization and viewport changes, plus context-loss fallback.
6. Real full-frame **end-to-end** benchmarks with equivalent simulation/event streams and scenes; no cached screenshot pretending to be a live renderer.

## Acceptance / release gate

`renderer-readiness.json` is intentionally **NOT_READY**. Every gate must be passed using independent implementation code and a stored reproducible test receipt. `renderer-release-contract.cjs` and its tiny `.test.cjs` are staging-only guardrails; they cannot certify GPU painting by themselves. The read-only audit `renderer-readiness-audit.cjs` explains blockers; `--require-ready` must fail while anything is incomplete.

Before a separate explicit approval to integrate into the game, require all gates to be true, corroborated by file-backed parity receipts and hardware runs: all five regions plus dungeons/rooms; night/day original lighting; 100/150/175% camera zoom; all configured render resolutions; desktop/phone/Chromebook; scripted combat/animation/moving camera; near-identical per-frame pixel comparisons with explicit conservative thresholds, close manual artwork review, no missing actors/effects; low CPU/GPU memory bounded without leaks; WebGL failure recovery. Compare full-frame median and p95 with **the same live state and work** under both modes, including preparation amortization. A candidate that does not outperform Canvas can still be selectable, but must not misrepresent its performance or visually compromise the game.

**Never lower the parity threshold to force a pass.** Pixel-by-pixel tolerances must be grounded in original anti-aliasing/composition semantics, and visual review can veto any quantitative pass. Renderer API and stage-specific source tests do not replace actual browser validation on the target Chromebook.

## Minimal checks before actual implementation

Run ONLY the focused staging contract test: `node --test tools/webgl-pilot/renderer-release-contract.test.cjs`. Optionally inspect missing readiness gates: `node tools/webgl-pilot/renderer-readiness-audit.cjs`. These checks are not a full game suite and do not change CI. The normal player build remains exclusively Canvas 2D. Do not publish or activate the WebGL setting on the basis of this plan alone.

## Integration touchpoints — after explicit permission

- `src/prototype/app.js`: one place for mode preference, display surface ownership, atomic graphics switch; retain existing saved-game logic.
- `src/prototype/renderer.js`: existing Canvas backend remains unchanged and callable.
- New multi-file `src/prototype/webgl-renderer.js` and supporting shader/texture modules, **only when fully independently validated**.
- `templates/game.html` / `styles/prototype.css`: secondary WebGL canvas and correct HUD stacking/accessibility without changing current 2D default.
- `scripts/site-assets.cjs`, `scripts/build.cjs`, service worker/offline inventory and packaging: include new multi-file resources only at integration time.
- Existing `PrototypeRuntime` FPS/frame-profile and game Settings localization: report selected/active backend, safe rollback; preserve mode, optimization, camera, resolution and frame skip.

No self-contained single-HTML constraint applies. Azeroth Chronicles is canonically a multi-file GitHub Pages/PWA game.
