# Outdoor floor reuse · v0.8.126

Joel authorizes the next performance level and explicitly favors FPS over a moderate memory increase. This extends the v0.8.124 projected-material reuse and raises the requested sprite residency ceiling without changing production artwork, campaign rules, maps, collision, saves, UI or animation.

## Scope and lifecycle

`ground-cache.js` owns one presentation-only picture of the current outdoor floor: its base color, registered material and deterministic small floor details. It covers the viewport plus 256 unzoomed presentation units per side. At 150% framing this is a 384 CSS-pixel movement margin. The margin can shrink in 64-unit steps when required by the 64 MiB RGBA budget. The picture follows the camera in world phase and is rebuilt only when the camera exhausts its margin, the zone object, material readiness/revision, viewport or physical scale changes.

The renderer still computes visible-tile counters but does not repaint those tiles on a hit. Rivers, roads, bridges, atmosphere, buildings, actors, lights, warnings and combat effects remain on their existing frame paths. In particular, animated environmental surfaces are not frozen into the floor picture. No whole-region or dungeon atlas is allocated.

Entering any interior releases the outdoor backing store before using the original floor/clipping/architecture path. Returning outdoors builds one new picture. Replacements zero the previous canvas dimensions before allocation, so old/new floor pictures are not simultaneously retained by this cache. Unavailable Canvas contexts, unsupported transforms and over-budget surfaces use the original per-tile path.

`materials.surfaceRevision(key)` pins and requests the required ground resource and exposes a presentation token that changes when a manifest is installed or a pending texture becomes ready. This prevents a procedural picture from permanently hiding a subsequently decoded texture. The optional material cache retains its existing 2 MiB source-image and 8 MiB projected-repeat budgets.

## Memory and visual contract

The new floor picture has a separate **64 MiB RGBA pixel ceiling**; the normal allocation depends on viewport, camera zoom and capped DPR. The limit describes retained pixel storage, not browser bookkeeping, temporary raster buffers or total application memory. Joel subsequently requests headroom for continued sprite production. The shared sprite contract and production active-decoded policy now allow **256 MiB** (formerly 16 MiB). Loading remains lazy, content-deduplicated, LRU-bounded and limited to two concurrent decodes. This is a ceiling, not an upfront allocation or an FPS guarantee. Per-resource dimensions, packaged/download budgets and all audio limits remain unchanged. The floor and sprite caches are separate; neither is the whole-game memory limit.

A moved picture introduces one additional raster sampling step. The source art and authoritative floor world coordinates remain unchanged; pixel output need not be bit-identical. Browser comparisons cover all five regions, all supported camera zooms (100%, 150%, 175%), desktop and capped-DPR phone, including fractional camera movement. They require low mean channel error, actual cache reuse, region/revision invalidation and direct interior fallback. Rendering must not mutate campaign state.

## Measurement and verification

`scripts/ground-performance.cjs` compares the v0.8.124 per-tile path with the new floor-picture path in the same candidate. It uses separate warm frozen draw-plus-readback measurements and actual RAF samples, counterbalanced old/cached/cached/old on desktop and phone. Moving samples include camera travel beyond the reuse margin and the resulting rebuild frames. The synthetic crowd and movement path are test-only; they are not game behavior. Raw evidence includes source hashes, browser version, memory and floor-build counters.

The worker uses software Chromium rasterization with variable shared load. Relative improvements here cannot establish Joel's Chromebook FPS or predict an iPhone Air result. Rebuilds remain real work; p95/p99 and moving samples matter alongside steady FPS. Timing thresholds are not CI gates.

Required release validation includes formatting/build/asset checks, all regression suites, the full desktop/phone matrix, Chromium and WebKit floor comparisons, installed-save/offline compatibility and exact published-build checks. The existing GitHub workflow now runs the new floor browser suite beside material tests on both engines.

## Controlled result · 9 October 2026

Compared with the already-improved v0.8.124 floor path, two seven-second RAF samples per treatment and scene produced these paired mean FPS values in software Chromium:

| Test | Per-tile floor | Reused floor | Relative increase |
| --- | ---: | ---: | ---: |
| Desktop · stationary | 18.85 | 30.29 | 60.6% |
| Desktop · moving | 17.36 | 27.25 | 57.0% |
| Phone · stationary | 25.96 | 38.67 | 49.0% |
| Phone · moving | 24.74 | 31.79 | 28.5% |

Warm frozen raster medians were desktop 49.8→27.8 ms, phone 36.7→24.2 ms. Current floor pictures used 12,853,248 bytes (desktop) and 16,932,240 bytes (phone), below the separate 64 MiB ceiling. Movement samples include rebuilds; their occasional slow frames remain visible in the raw p99/max evidence. These are relative worker results, not measurements on Joel's actual Chromebook or iPhone Air. See [GROUND_CACHE_20261009.json](evidence/GROUND_CACHE_20261009.json). Increasing the sprite ceiling itself is headroom for future assets, not the cause of this measured floor FPS gain.
