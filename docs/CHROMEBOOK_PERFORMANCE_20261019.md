# Chromebook performance and inhabited Frontier — 19 October 2026

Candidate `0.9.1+snapshot.dev.89` on `perf/chromebook-dev88` is prepared, not released. Published gameplay remains dev.88. Joel reported about **7 FPS while idle with full graphics**, and **below 15 FPS with Optimization Mode enabled**. Announcing the visual update waits on acceptable actual-device play. This report does not claim that the Chromebook problem is fixed.

The focused CPU sample identifies hidden-character contour compositing (`drawOcclusionOutlines` → `drawImage`) as a substantial local rendering cost. Small character masks now use bounded 256×256 surfaces in place of 384×384; bosses, captains, mounted riders, unknown bodies and registered resources exceeding conservative bounds retain the original buffers. Source dimensions, pivots and all declared animation-frame pivots gate compact registered masks. The two lazy four-surface pools are bounded at approximately 3.25 MiB combined (versus 2.25 MiB for the previous single full pool); the small-only case uses 1 MiB. Normal-mode drawing is unchanged in eight frozen desktop/phone comparisons. Optimization Mode uses integer offsets for the faint occlusion contour to avoid subpixel resampling; artwork, silhouettes, facing, body animation and combat cues stay intact.

## Bounded measurements

These are three interleaved full/candidate draws per frozen scene with forced Canvas readback in headless Chromium, not Chromebook FPS or a campaign benchmark. The original-buffer A/B switch runs the same current artwork, camera, simulation state, materials and scene. Median times:

| Mode / scene | Original buffers | Candidate | Reduction |
| --- | ---: | ---: | ---: |
| Normal / Vale | 80.3 ms | 62.5 ms | 22.2% |
| Normal / Frontier | 138.0 ms | 92.1 ms | 33.3% |
| Optimization / Vale | 71.0 ms | 39.1 ms | 44.9% |
| Optimization / Frontier | 125.3 ms | 74.5 ms | 40.5% |

The first compact-buffer guard was too conservative to cover most registered characters and showed no reliable active-play gain. The final guard checks actual display rectangles and pivots instead; only the final frozen paired samples above support the stated improvements. Initial active samples with artificial 4× CPU slowdown remain diagnostic records, not device FPS evidence. The full-game frame-rate target remains unverified on Joel’s Chromebook.

## GitHub Pages and local assets

The complete offline inventory already includes images, recordings and code: 29,922,671 bytes in this candidate, including 25,840,909 bytes of audio. GitHub serves these files; the campaign/simulation/rendering run locally. Storage/package size is not the same as per-frame rendering cost. Existing installed clients use their local cache. The previous worker nevertheless forced all recordings back through the network on every cache-version update.

The candidate keeps complete offline installation and reuses a recording from an earlier game cache only when its source URL and SHA256 match the new manifest and a successful cached response exists. Missing/changed recordings fetch normally; code and metadata always refresh, and activation retires the previous cache only after successful installation. With a complete unchanged audio cache, approximately 25.8 MB of redundant transfer can be avoided. The first install still downloads assets. This addresses loading/update traffic, not the reported idle FPS problem.

## Frontier design correction

The diagonal front brace, window-covering patch and roof plank patches read as boarded abandonment. Houses, workshops and the rest building now keep clear openings and repaired masonry. The shared Frontier roof uses aligned replacement tiles, including related service variants. Frontier remains inhabited and recovering from warfare. [Before](evidence/chromebook-frontier-20261019/frontier-before.png) and [after](evidence/chromebook-frontier-20261019/frontier-after.png) show the actual renderer in the same controlled scene. Per-design handoffs record the owner’s later direction; prior dev.88 references remain historical.

## Checks and next input

Generated build/syntax, 16 offline/cache checks, occlusion classification/painted masks, eight normal pixel comparisons and targeted formatting passed. Two representative paired renderer comparisons per graphics mode and one Frontier before/after review were completed. No full-game suite, stress loop, CI, merge or deployment ran for this candidate. Completed unchanged checks are not a reason to start another regression cycle.

The optimized contour differs only in its faint edge treatment in the representative comparison (2,548 changed channels, maximum delta 22); zero normal-mode channels changed. These samples do not certify every asset/clip, physical phone, GPU backend or actual Chromebook FPS.

**Next:** inspect an exported playtest report from Joel’s Chromebook in the actual slow idle spot (Adventure/Menu → Game and settings → Save and game management → Export playtest report). It contains frame-work/phase timings, visible-object counts, backing resolution and graphics preferences needed to identify the remaining device bottleneck. Do not claim that the reported 7 FPS is fixed or announce the update before actual-device verification.

Detailed bounded evidence: [summary](evidence/chromebook-frontier-20261019/summary.json).
