# PixiJS viewport reconstruction: retained artwork and dev.212 slowdown investigation

**Date:** 28 October 2026  
**Status:** Draft implementation pending focused CI, code review, merge and real-device validation.  
**Scope:** Optional PixiJS/WebGL2 path only. Canvas remains the default and fallback. No changes to saves, combat mechanics, telegraphs, hit geometry or approved artwork.  
**Tracking:** PR #572; renderer graduation #478; device resource audit #417.

## Player-observed regression and what the report establishes

The owner reported that the Chromebook game slowed severely during a Flooded Marches/Reed Beast encounter, shortly after a blue warning overlaid scenery. The owner exported `Azeroth_Playtest_Report (13).json` for `0.9.1+snapshot.dev.212`; **the playtest report is not copied to the repository**.

- `graphicsRenderer.activeRenderer = pixijs-webgl2`, active and confirmed, no recorded fallback failure.
- Reported `fps = 0.2`, frame-work p95 1,052.2 ms, render p95 1,051 ms.
- On sampled active callbacks, mean `pixiMs = 948.58 ms`, compared with mean Canvas cue-overlay work of 3.61 ms; simulation and enemy AI were negligible. These are **synchronous CPU stage** timings, not GPU completion measurements.
- Cumulative `proceduralBakes = 6885`, `proceduralEvictions = 6776`, `proceduralCacheEvictions = 0`, retained textures = 109, and `syncProceduralBakeMs = 59640.9`. The counters are lifetime totals: they cannot independently prove how many bakes occurred in a particular slow frame.
- In retained slowdown snapshots, the hero was stationary in the Marches and there were zero nearby enemies, hazards or projectiles; ~0.9-second rendering persisted outside combat.

The synchronized counts strongly warrant investigation of bulk cache invalidation, but do **not** yet prove it caused all slow frames. The blue telegraph/layering observation is a separate PT-007 concern. Do not attribute the measured Pixi call time to warning geometry or assert an exact GPU cause.

## Source-confirmed unnecessary invalidation

Before this patch, `src/prototype/pixi-experimental.js::syncViewport()` called `clearBakes(true)` before destroying a **viewport-specific Pixi scene** and creating a new scene within the *same* Application and GPU context. This discarded all procedural textures irrespective of whether their baked source dimensions, zoom or zone were still usable. Re-entering the view synchronously rebuilt visible sprites, scanned their alpha pixels, cropped artwork and registered fresh Pixi textures.

A viewport resize should invalidate scene containers/background dimensions, **not** unchanged sprite sources. This is distinct from full renderer/context teardown, which must continue releasing textures. The separate bounded least-recently-used (LRU) memory budget and stable revision keys remain unchanged.

## Focused correction in PR #572

- Keep procedural source textures in the bounded cache while the old viewport scene is destroyed; register those sources in the replacement scene before any actors are synchronized.
- Preserve the separate cleanup for a Crown coin stamp, which is presentation/viewport-density dependent.
- Continue creating new texture revisions when actual density, camera zoom, or region differs. Never reuse destroyed context sources after full renderer teardown.
- Export `viewportRebuilds` and `viewportRetainedProcedural` so the next local report can distinguish viewport reconstructions from memory-budget evictions.
- Export `lastDrawTiming` and `slowestDrawTiming`, with per-draw synchronous stage breakdown and bake count. These measurements are bounded scalars, not a recording of player state and not GPU timing.
- Extend focused Pixi fidelity assertions: two viewport changes retain textures without extra bakes/evictions, and an old procedural sprite can be rendered in the newly created scene with a **fresh texture registry**, proving re-registration rather than stale reference reuse.

## Verification and remaining risk

1. **Automated (pending):** focused Pixi fidelity checks; ordinary syntax and renderer/browser checks when CI makes them available. Do not call the change tested before the checks actually pass.
2. **Device (pending):** on the same Chromebook scene, compare a stable Pixi run before/after a viewport resize and after an ordinary Reed Beast Rogue cast. Export a report during slowdown if it recurs; inspect the new `lastDrawTiming` / `slowestDrawTiming` to determine whether the heavy stage was viewport, actor preparation or `sceneDrawMs`. `sceneDrawMs` is still a synchronous CPU call, not an independent GPU-timing query.
3. **Alternative causes remain open:** graphics-driver stalls, scene synchronization, excessive visible actor shadows, true GPU texture pressure and other renderer costs. If viewport rebuild counters remain low while stage timings stay extreme, investigate the measured non-bake stage instead of broadening this patch.
4. **Preservation:** no automatic renderer switch, gameplay rebalance, memory-budget increase, loss of original art, or forced graphics defaults. Preserve the existing 15-second trial and Canvas fallback.

This is a source-identified, targeted invalidation repair and improved diagnostic coverage, **not a claim that Chromebook FPS has been fixed or that hardware has been validated**.
