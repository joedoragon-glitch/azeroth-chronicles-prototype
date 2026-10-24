> **SUPERSEDED AS CURRENT ASSESSMENT — 24 OCTOBER 2026:** This is a **historical audit of dev.165/dev.166**, not a present-day audit or a defect certificate for released dev.169. Current [main `35bc942a`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/35bc942a541017eb634f0c00789746ccd2aac57d) merged and published [PR #426](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/426), including **default-On two-frame adaptive skipping**, critical emergency hold/recovery, Auto FPS pressure safeguards, optional crowd diagnostics and collision fast rejection. The renderer also has PixiJS WebGL2/Canvas overlay timing. Therefore old **one-skip/default-Off**, warning-event exemptions, `dev.166 is current`, `no aggressive skip authorized`, and `performance work paused` statements below are **dated observations superseded by later owner authorization and release**. The earlier counter-window cautions require re-evaluation against current reports; no newer measured hardware FPS gain is certified by this document. **Use [current dev.169 performance status](CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md) for guidance.** Retain the original audit findings below strictly for provenance of the earlier build and sample.

# Performance measurements and adaptive frame skip — audit, 22 October 2026

**Historical status, 22 October only:** This was the assessment for dev.166,
not the maintained entrypoint after dev.169. The measurements are
useful for identifying broad costly stages, **not certified for precise before/after FPS
or time-saved claims**. No gameplay, renderer, AI, input, save or frame-skip behavior was
changed by the audit or this documentation update.

## Source and scope

- Audited feature baseline: `0.9.1+snapshot.dev.166`, [commit bc90036](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/bc90036ecfefd81530c04bb562ccdc964e7e128b), installed through [focused publication 39791684101](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39791684101).
- At the audit, the relevant `runtime.js`, `app.js`, `engine.js` and `renderer.js` content still matched that feature baseline at main `63a51aff382987fb2ecead6de1203a11ebacba20`; later graphics experiment files on main are separate from this instrumentation assessment. The [graphics experiment commit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/63a51aff382987fb2ecead6de1203a11ebacba20) has a successful Pages workflow, but this audit does not establish a hardware FPS gain for those experiments.
- Evidence: static execution-path audit, three user Chromebook playtest reports (dev.164, .165, .166), existing focused JS tests and synthetic counter reproductions. The original user-specific JSON reports are **not** added to the public repository.
- Focused checks: frame-rate, frame-skip and frame-profile tests passed (230 assertions in the audit's standalone harness); 11/11 static integration-path checks passed. No new browser/WebKit matrix, compositor trace, matched-scene comparison or fresh hardware benchmark was run.

## What each number actually measures

| Report item | Correct meaning and limitations |
| --- | --- |
| `simulationMs` | Synchronous duration of `game.tick()` on active callbacks, not total browser utilization |
| `companionAIMs` | Entire `updateParty()`: targeting, movement, combat and bookkeeping, **not** AI reasoning alone |
| `enemyAIMs` | `updateEnemies()` and selected elite/pack/reinforcement calls; not independently every boss or hazard |
| `otherSimulationMs` | Derived difference: total simulation less those measured party/enemy portions |
| `hudMs` | HUD refreshes in the frame loop; many callbacks have zero because HUD refresh is periodic; excludes event-triggered UI work |
| `audioUpdateMs` | Only `audio.update()`; sound effects, footsteps and other dispatch occur elsewhere |
| `eventDispatchMs` | Combined renderer effect advancement/queueing and audio effect dispatch, **not** a pure audio figure |
| `renderMs` | Synchronous `renderer.draw()` call time; excludes asynchronous browser paint, compositor and verified monitor presentation |
| `frameProfile.callbackFps` | Rate of active requestAnimationFrame callbacks (game-update opportunities), **not** a fixed-step simulation rate |
| `frameProfile.displayedFps` | **Misleading name:** rate of issued Canvas draw calls in that sample, **not** proven screen presentation FPS |
| Top-level `fps` | Legacy rate between *drawn* callbacks, tracked over a different rolling population/window from frameProfile |
| `frameProfile.adaptiveSkippedDraws` | Adaptive skips in the last 180 active callback samples |
| `frameSkip.skippedDraws` | Cumulative adaptive skips since enabling/resetting this mode within the current page session |
| `render.phases` | Each phase sampled every 12 renderer draws; up to 64 samples; not synchronized with the 180 active callback window |
| `render.tileCandidates`, `entitiesDrawn`, etc. | Scene counters from the **most recent draw**, possibly an idle/menu redraw |

Do not add different stage P95 values to infer one frame's P95; the percentiles are
computed independently. The profiler's 180 active callback samples and the
renderer phase window do not necessarily describe the same time/scene.

## Frame skipping: confirmed and unverified

The optional `Game and settings → Screen and performance → Frame rate →
Adaptive frame skip` setting defaults **Off** and is device-local. It is
*one-frame-only*: after evidence of load, it may suppress an eligible world draw
but not two consecutive eligible draws; a draw-age limit also prevents long
gaps. Simulation, input, AI, audio and renderer effect *advancement* occur before
the adaptive drawing decision. The existing 30/60 FPS drawing limiter is a
separate earlier gate. Event types `warning`, `eliteWarning`,
`chargeInterrupted`, `death` protect drawing for 300 ms.

These are verified code paths and focused controller checks, **not** proof that
every persistent boss telegraph remains visible across all frames or that game
input-to-screen latency improves on hardware. The protection does not override
the separate FPS limiter. Keep the setting **Off for normal baseline
comparisons**, and On only as a voluntary experimental choice. Do not add a
two-frame/aggressive mode under this stabilization decision.

## Captured Chromebook evidence (not a controlled A/B)

| Measurement | dev.164 | dev.165 | dev.166 (skip enabled) |
| --- | ---: | ---: | ---: |
| Legacy top-level `fps` | 14 | 17 | 13 |
| Active callback samples | — | 180 | 180 |
| Issued world drawings in those callbacks | — | 175 | 130 |
| Optional adaptive skips in those callbacks | — | — | **18** |
| Profile active callback rate | — | — | 20.7/s |
| Profile world draw-call rate | — | — | 14.9/s |
| Average simulation | — | 22.94 ms | 15.90 ms |
| Average `updateParty` | — | 12.67 ms | 5.56 ms |
| Average enemy stage | — | 8.47 ms | 8.63 ms |
| Average per actual Canvas draw | — | 17.50 ms | 16.46 ms |

In dev.166's last **180 active callbacks**, there were 130 issued draws,
18 adaptive skips, and 32 callbacks with no eligible drawing under the
existing FPS limiter. Of the 148 would-be eligible draws, **18/148 = 12.2%**
were suppressed adaptively (18/180 = 10% of callbacks). The separate
`frameSkip.skippedDraws = 81` was cumulative, **not** the same window.

There was **no demonstrated FPS or latency gain**: these reports captured
different combat scenes and the three FPS counters are not directly
interchangeable.

## Confirmed reporting gaps

1. **Mixed time windows and confusing FPS labels.** Legacy `fps` samples
   actual drawings; profiler counters sample active callbacks. The
   `displayedFps` label overclaims actual monitor presentation.
2. **Idle/menu contamination.** Entering the menu suspends active profiling,
   while idle world redraws can reset renderer scene counters and add phase
   samples. An exported report can therefore mix active gameplay with the
   latest menu world drawing.
3. **Counter lifetime mismatch.** On menu/pause, frame-skip suspension resets
   `drawnSamples`, smoothing and state, but retains cumulative `skippedDraws`.
   Reproduced with the actual controller: `9` drawn samples and `3` skips
   before suspension became `0` drawn samples and `3` skips afterward.
4. **Broad labels.** AI, HUD and audio categories measure the code scopes
   above, not independently every user-visible operation.
5. **Warning coverage is only partially verified.** The 300 ms event guard is
   not a complete long-lived telegraph visibility test, and the ordinary FPS
   limiter may still decline an image.
6. **No counterfactual saved-time measurement.** A skipped draw was *not*
   executed; multiplying skip counts by average draw time is only a
   hypothetical estimate, not proven milliseconds recovered.

## Future sequence — only when performance work is reauthorized

1. Standardize one timestamped rolling sample with explicit active callbacks,
   eligible drawing opportunities, ordinary FPS-gate skips, adaptive skips,
   issued Canvas draws, and elapsed milliseconds. Preserve existing report
   schema compatibility during migration.
2. Tag active versus idle renderer samples or freeze a last-active snapshot
   before opening menus; include each sample's age and window.
3. Split session-cumulative counters from sample-window counters, with clear
   reset semantics and tests for export, pause, hide, resume and reload.
4. Add focused browser integration tests for simulation/input/audio continuity
   and sustained combat warning visibility while skipping.
5. Only afterward compare matched scene/device settings if the owner wishes
   to resume performance work. Do **not** change skip intensity, AI, graphics
   settings, combat or balance as part of these documentation notes.

Related implementation notes: [dev.165 stage profiler](FRAME_PROFILER_DEV165.md),
[dev.166 frame skip](ADAPTIVE_FRAME_SKIP_DEV166.md), [current project state](DEVELOPMENT_STATE.md).
