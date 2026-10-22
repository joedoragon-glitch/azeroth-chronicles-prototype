# WebGL sprite drawing trial

This is a **diagnostic**, not a game feature. It keeps the live Canvas game exactly as it was.

## How to run (from a checkout of this experiment branch)

1. Start the existing local server: `npm run dev` (Node.js required).
2. Open `http://127.0.0.1:8080/tools/webgl-pilot/index.html` in Chrome.
3. Choose Greenwood Vale, Ashen Frontier, or Dark Crown and click **Run isolated comparison**.
4. Compare the two pictures and note `medianMs`, `p95Ms`, `gpuBackend`, `gpuAtlasPreparationMs`, and the visual difference.
5. Repeat on the Chromebook, using the same settings and few other tabs. If WebGL2 is unavailable, the test explicitly fails rather than inventing measurements.

**What it does:** Reads authentic current campaign scenery positions and the approved sprite manifest, draws exactly the same visible registered sprite bodies with either Canvas `drawImage` or WebGL2 triangles from an uploaded atlas. Uses the same dimensions and back-to-front ordering. Includes texture-preparation cost separately. Does not alter the campaign, save, audio, or production renderer.

**What it does not do:** This first pilot intentionally excludes procedural fallback drawings, roads, ground, lanterns, atmosphere, occlusion masks, combat overlays and HUD **from both paths**. Its speed result is for sprite composition only, not an FPS forecast for the entire game. The candidate must still prove a useful **complete-scene** advantage before any migration.

**Protected:** All lamp/lighting systems remain untouched. Do not change them to get a higher benchmark number.

**Environment status (preparation session):** Local Chromium could render Canvas2D, but blocked normal local-page navigation and returned no WebGL2 context even when software GPU flags were tried. Accordingly, no trustworthy WebGL speed measurement was obtained here. The page is ready for a browser/device environment that permits WebGL2.

No `main` changes, no merge, no deployment, no release/version bump, and no CI workflow needed for this trial.
