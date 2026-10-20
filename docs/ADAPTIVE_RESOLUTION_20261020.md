# Rendering FPS follow-up — 20 October 2026

**Published:** dev.94 merged through #328 and published by packaging-only run 39383012533. Exact live files match the prepared runtime. No additional tests or broad CI; normal release workflow restored. [Publication receipt](evidence/ADAPTIVE_RESOLUTION_DEV94_PUBLICATION_20261020.json). Owner testing remains the next step. Candidate-only statements below describe the earlier preparation checkpoint.

Candidate `0.9.1+snapshot.dev.94`, based on main `27119fe947fe234dc43e0e0f7b3878c3a2d8964f` (published dev.93). Joel explicitly resumed FPS improvement after supplying the dev.92 report. No new artwork, staff edits, gameplay/balance changes, broad validation cycle, merge or deployment is part of this candidate.

## Received device evidence

The supplied `Azeroth_Playtest_Report (3).json` records 7 FPS over 180 frames / 25.2 seconds, Optimization Mode off, camera 175%, backing canvas 2403×1248. Render p95 is 77.1 ms versus pre-render p95 7.8 ms; the separately sampled floor phase is 66.5 ms p95. The ground cache is warm (zero tiles painted, 2,069 hits), occupying 38,925,000 bytes. These differently windowed percentiles are diagnostic evidence, not additive exclusive CPU costs. Raw player state is not committed.

## Change

A device-local `Auto` world-sharpness preference now observes actual renderer work on drawn active frames. Sustained rendering above the selected 30/60 FPS budget lowers only the backing-store pixel density, to a minimum of 0.75 backing pixels per CSS pixel. Each decision needs at least 16 frames and a three-second sampling period; a bounded 80th percentile rejects isolated loading/rebuild spikes. Density recovers gradually after at least twelve seconds with enough measured headroom. Pauses/hidden tabs discard observation windows. The existing maximum-DPR/pixel-budget rules remain the upper limit. `Maximum` opts out and persists independently of campaign saves.

Camera framing, world/screen coordinates, input inversion, authored content, timing and simulation code remain intact. Reduced density visibly softens the world, including in-world labels. DOM menus, controls and HUD keep their native sharpness. This is an explicit quality/performance tradeoff, not an assertion of identical raster appearance. Reports now record the preference, current density, ceiling and change count.

## Bounded evidence

Interleaved frozen maximum/0.75-density render + forced readback samples in local headless software Chromium, four timed samples per setting after warm-up:

| Scene | Maximum median | Reduced-density median | Local draw-time reduction |
| --- | ---: | ---: | ---: |
| Desktop Vale | 122.30 ms | 67.10 ms | 45.1% |
| Desktop Frontier | 126.10 ms | 73.05 ms | 42.1% |
| Phone Vale | 45.40 ms | 31.95 ms | 29.6% |

Desktop backing store fell from 2403×1248 to 1200×623; outdoor ground-cache residency fell from 38.9 MB to 9.7 MB. Camera/input projection and serialized campaign state stayed unchanged in each draw comparison; no game exceptions occurred. One separate 8.5-second active RAF startup, without synthetic cost observations, automatically reduced density twice to 0.75; backing size followed the controller, and no exceptions occurred. Its 13 FPS result is local software-browser startup evidence, **not Chromebook FPS** and not a before/after device comparison.

Build and `npm run check` passed. Focused resolution, existing platform/runtime and frame-rate suites passed. Changed-file formatting passed. Repository-wide `format:check` reports an existing style issue in unchanged `tools/sprites/approved.json`; this candidate does not reformat artwork metadata. No whole-game suites or hosted CI ran. The prior cache-blit/bitmap/opaque-copy experiments did not establish reliable full-frame gains and are excluded from the final source.

[Sanitized evidence](evidence/ADAPTIVE_RESOLUTION_20261020.json). Remaining: review/merge/publication decision and actual Chromebook play. Do not claim the reported 7 FPS issue is fixed from local evidence or start a broad validation cycle automatically.

## Publication blocker

The implementation is committed locally on `perf/visible-ground-copy`. Automatic approval review rejected the public GitHub push, citing external publication/disclosure of code and report-derived performance details without explicit user authorization. No alternate write route was attempted. Next action requires Joel's approval to push this prepared candidate and sanitized summary to the public repository; no merge or deployment has occurred.

## Owner approval

At 02:51 EDT Joel approved pushing the code and sanitized summary, merging and putting the prepared change in the live game: “put in the game … I’ll test it myself.” The earlier push blocker is resolved by this explicit authorization. Reuse completed checks; publish the exact committed files through a one-time packaging-only workflow, then restore normal release wiring. Actual Chromebook FPS remains for owner testing.
