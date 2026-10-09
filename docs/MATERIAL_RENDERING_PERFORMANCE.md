# Ground rendering performance · v0.8.123

Joel reports that earlier releases ran smoothly and the updated game became choppy. His Chromebook capture shows 6 FPS at 150% framing; sampled frame work alone does not account for all elapsed time. The task is to recover performance while preserving the current art and gameplay.

## Findings

The expensive path repeatedly filters/skews a 256×256 repeating ground image inside hundreds of floor clips each frame. A JavaScript CPU profile underreports the browser's deferred Canvas raster work. Controlled draw-plus-readback comparisons isolate that work; they are not gameplay FPS measurements.

A frozen scene with the same saved world/actors, fixed 1280×800 Canvas, 100% camera and fixed camera anchor drew 555 floor tiles and 151 entities in all three historical checkouts. Software raster medians were 44.3 ms in pre-texture v0.8.95 (`0d02d35`), 79.1 ms in the first ground release v0.8.96 (`dd56e80`), and 75.4 ms in v0.8.121 (`a4c4fc6`) using the original projection path. Historical releases also differ in flora and other presentation; this comparison locates a substantial increase without assigning every millisecond to one feature. Current-version texture ablations and matched original/cached comparisons establish the ground projection as a contributor. This is not evidence that every later update worsened performance.

## Change and memory contract

`materials.js` pre-rasterizes the isometric repeat at the actual Canvas scale and reuses its screen-aligned pattern. Two diagonal world repeats form one rectangular screen repeat. The original image, world span, opacity, floor clipping and world origin remain authoritative. Terrain detail, water, actors, buildings, light/atmosphere and combat effects continue to draw normally.

The optional projected cache has a separate **8 MiB RGBA pixel budget**, LRU eviction and explicit zero-size backing-store release. It supplements the unchanged **2 MiB decoded source-image budget**. At default 150% it uses about 0.72 MiB on desktop DPR 1 and 1.62 MiB on capped phone DPR 1.5 for the visible region. Browser bookkeeping and temporary raster buffers are outside these pixel budgets. No whole-world/background snapshot is retained.

Content identity, world span and physical repeat dimensions key the cache; zoom/DPR changes select the correct raster. Every valid manifest installation clears the projected cache, including opacity/revision-only changes. Context patterns are weakly held. Unavailable Canvas/pattern capabilities, oversized repeats, rotated/sheared target contexts and non-ground or rotated materials retain the original drawing path. Missing/failed materials still use procedural ground. No source artwork, manifest, gameplay owner, save schema, HUD layout or collision changes.

## Verification

`tests/materials-browser.test.cjs` compares all five actual production materials against the original path at physical scales 1, 1.5, 2.25, 3 and 3.5. It checks clipping, translated world phase, bounded region/scale churn, eviction and manifest retirement on desktop/phone Chromium and release WebKit. The cached projection adds a raster sampling step: visual comparisons use a mean channel difference below 0.85/255 and maximum difference at most 24/255; camera translation permits one channel of sampling quantization. This is faithful appearance, not bit-identical raster output. Existing 28-material loader/concurrency/failure tests remain.

The development-only `scripts/material-performance.cjs` runs alternating original/cached raster comparisons and separate actual RAF crowd samples on desktop and phone at default framing. Run with installed Playwright and `CHROMIUM_EXECUTABLE` if needed; `PERFORMANCE_OUT` selects the JSON output. It does not run in the game or impose a timing threshold on CI. Raw evidence records browser version and material source hash.

Preliminary controlled software results: desktop crowd 15.1/16.0 FPS original versus 19.4/19.9 cached; phone crowd 22.4/22.9 versus 27.4/27.7. Frozen draw-plus-readback medians fell from 61.5 to 48.5 ms on desktop and 42 to 35 ms on phone. After preserving v0.8.122 world proportions, final paired averages improved from 15.18 to 18.52 FPS on desktop (+22.0%) and 22.22 to 26.49 FPS on phone (+19.2%). Final raster medians were 64→51 ms and 42.8→34.9 ms respectively. Raw results are retained under `docs/evidence/MATERIAL_CACHE_20261009.json`.

The shared worker uses software Canvas rasterization and has varying concurrent load. These measurements establish a relative improvement in that environment; they do not promise a particular frame rate on Joel's Chromebook/phone or establish native GPU memory use. The remaining floor geometry, atmosphere and actor drawing still cost time. Release follows required generation, formatting, asset checks, full regressions, device browser matrix, WebKit CI and exact deployed-build verification.
