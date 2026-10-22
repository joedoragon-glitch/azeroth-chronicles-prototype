# WebGL renderer pilot — isolated preparation (22 October 2026)

**Status:** ISOLATED PILOT FILES READY. A separately served original-art sprite-only Canvas/WebGL2 comparison page is implemented in `tools/webgl-pilot/`. It has passed static script/path checks, but GPU execution, visual acceptance, and measured results remain **unverified**. No production renderer, game, merge or deployment changes.

**Frozen base:** `main` at `a97a40495c44065e6d33c4462c426a3fe15f7482`; package version `0.9.1+snapshot.dev.163`. The multi-file GitHub Pages/PWA remains the product. No portable/single-HTML constraint.

## Player-facing question

Would a GPU-oriented way of displaying **the same Azeroth Chronicles graphics** produce meaningfully smoother gameplay on the owner's 8 GB Chromebook, especially in inhabited/nighttime regions, without sacrificing visual identity, combat clarity, or saves?

This pilot is not permission to redesign, downgrade, remove, or simplify anything. In particular **lighting, lanterns, glows, existing night presentation, atmosphere, their animation and layering are protected and must not be edited or optimized**. It is acceptable to leave their existing Canvas implementation untouched. No NPCs, enemies, scenery, particles, telegraphs, shadows, roads, trees, sounds, or region details may be culled or suppressed merely to manufacture a speedup.

## What already exists (do not redo)

- `src/prototype/renderer.js` uses a 2D Canvas, camera projection/depth ordering and conservative entity selection; `visuals.js` contains procedural world/character drawings.
- `ground-cache.js` reuses the base outdoor floor; `materials.js` has bounded projected texture reuse; `sprites.js` resolves authored images or faithful procedural fallbacks.
- The frame-rate and world-sharpness controls are independent in `runtime.js` and `app.js`; 30 FPS limits drawing but **not** the simulation callback.
- Earlier `docs/MATERIAL_RENDERING_PERFORMANCE.md` and `docs/CHROMEBOOK_PERFORMANCE_20261019.md` contain useful historical evidence. A warm outdoor cache and ready sprite queues can coexist with poor FPS. Earlier full-frame software-browser timings were noisy.
- Current `main` must be checked again immediately before implementing a pilot: source can advance independently of this preparation branch.

## Pilot: real scene, one variable

1. Reuse the current game renderer as **control A**. Select a deterministic, unchanged current-source scenario from existing tests/fixtures. Start with a daylight Vale settlement and a crowded Frontier night scene; include actors, trees/props and actual illustrated sprites. The player's personal campaign export is not required and should not be committed.
2. Make a **separate test page / diagnostic harness**, never the shipping game entry. Use the existing camera coordinates, region geometry, object identities, authored sprite files, order and sizes. Record exactly which layers candidate B reproduces. Candidate B may use WebGL2 or a well-scoped 2D GPU library; do not add a dependency until its use is justified.
3. Compare the *same real game visual workload*. Don't cheat by comparing a pre-flattened screenshot against live Canvas drawing. If a procedural drawing is rasterized into a GPU texture, count the preparation time, changes/invalidations and memory; do not silently rebuild the texture every frame or omit the artwork. Test moving camera and changing visible entities as well as stationary scenes.
4. **Keep the lighting system entirely outside the experiment.** The isolated comparison may exclude night lighting from *both* measured paths to test scene/object rendering, but must not claim a full-night-game speedup from that measurement. Any final full-frame comparison must include the unchanged current lighting, effects, occlusion and HUD in both paths.
5. Compare identical viewport, camera 100/150/175%, actual physical backing resolution, world sharpness and Optimization Mode setting. Measure cold preparation, steady camera movement, stationary draw, actors in combat and zoom change. Run short interleaved control/candidate/control repeats with warm-up; report median and worst-frame/p95 timing, actual drawn FPS and memory/texture residency. Include renderer backend and whether Chrome is hardware- or software-accelerated.
6. Review screenshots for actual silhouettes, scale, anchors, alpha/transparency, depth occlusion, shadow placement, animated details, in-world labels and combat cues. No gameplay or save system changes are allowed; compare full simulation/snapshot equality and generated render results before considering integration.
7. On software-only Chromium, report **software-browser diagnostic** results only. Final decision needs a brief paired on-device Chromebook check; headless software performance may favor a different path.

## Success / rejection gate

- First test **whether the GPU candidate meaningfully improves whole-scene rendering**, not just a fast texture-blit microbenchmark. A modest one-layer helper speedup is not enough.
- Tentative decision threshold: repeatable improvement of roughly **20% or more in whole-frame drawing cost**, with p95 not worse, tolerable initial setup/memory and no unacceptable visual differences. This is a planning threshold, **not** a guaranteed gain or an automated CI requirement.
- If it is negligible, unstable, blurry, breaks layering, has costly CPU-to-GPU copies or performs worse on the Chromebook, **reject the renderer migration** and keep the current system.
- A prototype must not be enabled in player settings or merged into production until an explicit separate decision after measurements. Any later implementation needs Canvas fallback for unsupported/lost WebGL contexts and a narrow reversible rollout.

## Safe module boundaries

**Read / reuse:** `src/prototype/renderer.js`, `visuals.js`, `ground-cache.js`, `materials.js`, `sprites.js`, `sprite-format.js`; read-only campaign scene values and current art assets.

**Do not edit for the pilot:** `engine.js`, `world.js`, `navigation.js`, `combat.js`, `party.js`, `rules.js`, `save.js`, `audio*.js`, `input.js`, `app.js`, existing lighting/atmosphere/occlusion drawing, production manifests, production HTML, `sw.js`, or gameplay tests.

For actual eventual integration, blending a WebGL canvas with 2D Canvas overlays is a specific layering/performance risk and requires independent proof. Maintaining the original depth order may be harder than it first appears. Do not commit to a wholesale render-system swap on faith.

## Preparation environment / proof status

This preparation session inspected the current repository and existing benchmark evidence. Local Chromium executable and Python Playwright are present, but attempts to navigate `data:`, `file:`, and loopback `http://127.0.0.1` diagnostic pages all failed with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. **No fresh GPU FPS comparison was run and no WebGL hardware availability was established in this environment.** Use a suitable browser runner or an authorized local Chromebook session for actual measurements; do not report a fabricated result. A test of WebGL support alone is not an Azeroth performance benchmark.

## Completion criteria for this preparation checkpoint

- [x] Current Canvas architecture and relevant historical evidence identified
- [x] Preservation/lighting and gameplay boundaries locked
- [x] Fair A/B benchmark and stop/go conditions defined
- [ ] Obtain a browser environment that can actually run the diagnostic scene
- [x] Build an isolated same-art GPU sprite-composition candidate; static syntax and referenced-path checks pass
- [ ] Execute and measure candidate in a WebGL2-capable browser
- [ ] Compare screenshots, p95 and full-frame latency on appropriate hardware
- [ ] Present the measured outcome for the owner's decision

**Release state:** Only this preparation document and `tools/webgl-pilot/{index.html,pilot.js,README.md}` exist on the experimental branch. No existing gameplay/runtime/art files were changed, no build/version changed, no release created. No PR, CI, or deployment was initiated. This sprite-only pilot is **not a full-game renderer comparison** and must not be interpreted as one.
