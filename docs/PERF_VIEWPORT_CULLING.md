# Viewport-culling performance candidate

Base: main `6f8089b2013647184efb04932fe6157f548238b9` (v0.9.1+update.1). Proposed maintenance build: v0.9.1+update.2. **Not released.**

## Finding and change

The terrain painter compared world-projected coordinates with physical Canvas backing pixels, although the camera draws in zoom-adjusted logical coordinates. At 150% camera zoom or elevated device-pixel ratio this retained off-screen work. Roads and bridge decks also issued Canvas commands for entirely invisible geometry.

The existing renderer now passes its logical viewport to terrain, roads, and bridges. The original procedures skip safely off-screen surfaces, segments, full terrain strips, and bridge decks. Conservative margins preserve visible edges. Direct legacy calls without a viewport still draw as before. No caching framework, sprite redesign, gameplay, AI, save, combat, collision, or UI change.

## Verification and limits

`node tests/viewport-culling.test.cjs` compares 45 exact raster views: five regions, three camera locations (open area / settlement / crossing), and three camera scales (100% / 150% / 175%). It verifies that fully off-screen roads/bridges produce no paint commands. Existing renderer phase metrics and ground-cache counters remain intact.

Run the standard build, format, Node, Chromium, WebKit, save/PWA and visual regression gates on the final head before a merge. Compare performance phases in the existing Playtest Report; avoid claiming measured GTACUBA FPS improvements from static tests. No device data are requested from the tester.

If the practical gains are small, measure simulation scheduling and Canvas acceleration separately before making another rendering change.
