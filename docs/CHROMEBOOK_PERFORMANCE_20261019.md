# Chromebook performance and inhabited Frontier — 19 October 2026

**Dev.90 is live.** Joel authorized merge/publication at 00:12 EDT on 20 October for Chromebook testing. PR #324 merged as `9a6815fdaf76a6c00818921625f485b51c2d01a6`; packaging-only [run 39368492291](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39368492291) succeeded. Exact public build/version, engine, runtime, renderer, visuals and service worker match the prepared source. Completed focused evidence was reused; no broad CI or repeated checks ran. Normal release wiring is restored and the temporary publisher removed. [Publication receipt](evidence/CHROMEBOOK_DEV90_PUBLICATION_20261020.json). Joel reported about **7 FPS while idle with full graphics**, and **below 15 FPS with Optimization Mode enabled**. Announcing the visual update waits on acceptable actual-device play. This report does not claim that the Chromebook problem is fixed.

The focused CPU sample identifies hidden-character contour compositing (`drawOcclusionOutlines` → `drawImage`) as a substantial local rendering cost. Small character masks now use bounded 256×256 surfaces in place of 384×384; bosses, captains, mounted riders, unknown bodies and registered resources exceeding conservative bounds retain the original buffers. Source dimensions, pivots and all declared animation-frame pivots gate compact registered masks. The two lazy four-surface pools are bounded at approximately 3.25 MiB combined (versus 2.25 MiB for the previous single full pool); the small-only case uses 1 MiB. Normal-mode drawing is unchanged in eight frozen desktop/phone comparisons. Optimization Mode uses integer offsets for the faint occlusion contour to avoid subpixel resampling; artwork, silhouettes, facing, body animation and combat cues stay intact.

## Owner Chromebook reports and remaining frame work — 20 October UTC

The two provided exports are from published dev.88. They capture **22 FPS in Crown** (39.5 ms p95 frame work) and **15 FPS in Frontier** (54.7 ms p95), both at night with Optimization Mode explicitly off. These are different sampling windows from the earlier ~7 FPS report, and do not measure the candidate or the earlier optimized-mode comparison. Both use a 2403×1248 backing canvas at 175% camera zoom. Ground cache is warm, floor tiles painted is zero, sprite/material queues are empty, and the audio reports contain no pending recording work. These samples point to ongoing local frame work rather than a cold download. They do not isolate CPU/GPU cost or prove audio can never contribute. Renderer phase and whole-frame percentiles use different rolling windows and cannot simply be added/subtracted to attribute a bottleneck.

Source inspection and the earlier CPU stack revealed an avoidable simulation cost: every unengaged enemy traced line of sight to its target before testing the 260-unit engagement range. Dev.90 evaluates the same distance condition first. It does not reduce AI frequency, change range, skip in-range visibility, change collision geometry or alter simulation time.

A bounded comparison ran 90 paired normal-mode night ticks in each of two deterministic fixtures near the reported Crown/Frontier positions, interleaving original and candidate ticks and excluding the first five timings. Full state, effects and messages remained exactly equal. Frontier retained eight engaged enemies. These are local Node simulation timings, not the owner's full save or Chromebook FPS:

| Scene | Original median tick | Candidate median tick | Line-of-sight calls, original → candidate | Collision probes, original → candidate |
| --- | ---: | ---: | ---: | ---: |
| Crown | 25.78 ms | 10.83 ms | 5,850 → 0 | 364,011 → 123,022 |
| Frontier | 31.09 ms | 13.57 ms | 5,527 → 282 | 1,035,135 → 845,805 |

Dev.90 also adds bounded `preRenderP95Ms` and `renderP95Ms` to the existing exported report using the same 180 drawn-frame window. Pre-render includes shell, audio, simulation and HUD work; it is not a simulation-only measurement. A fake-clock check verified cost separation, bounded samples, pause and reset. One local Chromium startup rendered both night scenes at the reported viewport/DPR/zoom without game exceptions, with running audio and populated new metrics. Headless software rendering remained slow and is retained as crash/instrumentation evidence, not a performance pass. No quality/resolution reduction was introduced in this follow-up.

Sanitized [report analysis](evidence/chromebook-frontier-20261019/owner-report-analysis.json), [paired simulation comparison](evidence/chromebook-frontier-20261019/visibility-range-comparison.json) and [local startup](evidence/chromebook-frontier-20261019/dev90-startup.json) preserve these limits. Raw campaign/progression exports are not published. The prior dev.89 rendering/cache/Frontier evidence below remains unchanged and applies to those unchanged paths.

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

## Checks and remaining device verification

Generated build/syntax, 16 offline/cache checks, occlusion classification/painted masks, eight normal pixel comparisons and targeted formatting passed. Two representative paired renderer comparisons per graphics mode and one Frontier before/after review were completed. No full-game suite, stress loop, CI, merge or deployment ran for this candidate. Completed unchanged checks are not a reason to start another regression cycle.

The optimized contour differs only in its faint edge treatment in the representative comparison (2,548 changed channels, maximum delta 22); zero normal-mode channels changed. These samples do not certify every asset/clip, physical phone, GPU backend or actual Chromebook FPS.

**Next:** owner live play on dev.90 in the same slow Crown/Frontier spots, comparing Optimization Mode off/on. The requested dev.88 reports have already been received and inspected. Actual-device dev.90 FPS remains unmeasured; do not announce the reported ~7 FPS problem as fixed. No automatic further tests or publication follow.

Detailed bounded evidence: [summary](evidence/chromebook-frontier-20261019/summary.json).
