# PixiJS live-Campaign integration — Step 3 targeted source audit (22 October 2026)

**Status: SOURCE AUDIT / SAFETY REPAIRS CHECKPOINT. NOT CERTIFIED, NOT MERGED, NOT DEPLOYED.**

The user authorized Step 3 review only, not Steps 4 (release process) or 5 (publish). Audit continues the Step 2 branch without starting another benchmark/optimization workstream. Main remains unchanged.

## Exact source

- Main SHA at audit: 869049797d5e29270886871c89068f648c1f2a6c.
- Project README/DEVELOPMENT_STATE still refer to dev.166, but current main package.json, package-lock.json, build-info.js and sw.js contain **0.9.1+snapshot.dev.167**. Treat dev.167 as the package/source version; do not infer public site deployment from those files.
- Step 2 branch before fixes: ae44f39ccb9a1ce7d96512741a5998d64772cd33.
- Keep v4 save schema and live Campaign unchanged; no performance threshold/balance modification.

## Confirmed Step 2 defects and corrections on branch

1. **Loader order wrong (startup blocker).** The source asset inventory appended required GPU helpers after app.js, and generated game HTML did not load any new GPU files. Corrected order: renderer → GPU layout/atlas/scene helpers → renderer-switch-guard → pixi-experimental → ordinary later sources → app.js. Synced templates/game.html, index.html, prototype.html, phone.html and sw.js APP_FILES.
2. **Missing controller (startup blocker).** renderer-switch-guard.js was available only on prep/canvas-default-webgl2-selector-readiness-20261022, not main. Added the existing implementation and its existing focused test (rather than replacing the agreed 15-second controller).
3. **Incomplete sprite readiness (normal roaming blocker).** Step 2 prepared images for the initial visible actors only, so crossing into unvisited populated areas could immediately fail. Pixi now enumerates and preloads approved manifest assets before first reveal. Current manifest has 38 unique raster URLs; their declared decoded RGBA size is approximately 46 MiB (an estimate, not live GPU memory telemetry). Individual procedural actor baking retains the separate capped pool.
4. **Missing animation events.** Original Canvas queue still receives all events; Pixi's atlas adapter now also receives existing presentation events, without changing simulation.
5. **Frozen combat telegraphs (safety bug).** The GPU cached terrain used to include time-dependent ground/underlay cues. Now transient combat warnings are excluded from the baked background and drawn through the live transparent overlay.
6. **Campaign identity guard.** If the game Campaign instance is replaced while Pixi is running, it intentionally falls back to Canvas instead of keeping old baked scene state. Scene cleanup also resets tracked resources before a new opt-in trial.

## Verification performed in this environment

- Retrieved and statically syntax-parsed changed runtime JavaScript and existing pilot helpers.
- Evaluated current source-inventory ordering against all four HTML entry/template script lists and the service-worker declared core asset inventory; static 18/18 checks passed after wiring corrections.
- Evaluated 15-second controller with synthetic clock, including entering trial, auto timeout rollback, explicit Keep and GL failure rollback; ten directed scenarios passed, including hidden-tab and preparation failure. The older guard's additional 17 Node tests were imported but NOT executed here.
- Confirmed via static checks that the Pixi adapter reads getGame rather than constructing a second Campaign and that existing graphics preferences/saves were not edited.
- Confirmed no other open PR was modified.

**NOT PERFORMED:** npm ci/npm run build/npm run format:check/npm run check/npm test/full browser WebGL/WebKit/PWA tests, native Chromebook/iPhone test, screenshot/lighting parity, GPU frame profiling, or actual network asset load. The analysis container cannot resolve GitHub to obtain a working repository checkout; connected GitHub reads/writes are available, but these are not a runnable local repo. Source/syntax tests are not equivalent to browser tests.

## Open release blockers / confidence boundaries

- **WebGL renderer remains unvalidated in the actual playable app.** A real browser must confirm no startup exceptions and verify visible controls, live moving sprites, correct essential warnings/health/projectiles, ongoing combat, zoom and zone transitions, and 15-second Keep/Revert.
- **Offline dependency unresolved.** The optional library still loads PixiJS 8.22.0 from pinned jsDelivr. Before publishing as a PWA graphics option, bundle/self-host that exact library and include it in the normal site/offline inventory with tested fallback. Do not call this offline-ready.
- **Visual fidelity incomplete by design.** Procedural actor body art is initially baked static; labels/occlusion/fixtures, blend grading and transient artwork differ. Normal Canvas remains protected. No faster/accurate FPS claim.
- **Settings persistence is not complete.** The original switch guard records the confirmed WebGL choice in device storage, but the current app deliberately starts Canvas on reload; it does not yet restore a confirmed WebGL session. This discrepancy must be resolved or the choice clearly marked session-only before public release.
- **Build and formatting not yet verified;** generated cache has the same dev.167 version as base and must be advanced as a coherent package before publication. Changing source without a new published version is not a deployable release.
- **Potential device load:** 38 eager raster image uploads and independent procedural textures need first-run readiness/memory checks; no unmeasured optimization or threshold tuning authorized.

## Disposition

**Source staging repaired; NO-GO for merge/deployment yet.** This is not a claim that experimental PixiJS looks or runs acceptably in the game. Next checkpoint should first resolve the small, concrete packaging/selector blockers, then run targeted browser smoke; no broad game audit or general optimization. Step 4 (PR/release gates) and Step 5 (merge/publish) remain separate owner-directed stages.
