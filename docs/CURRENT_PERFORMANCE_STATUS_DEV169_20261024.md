# Current performance and instrumentation status — dev.169 (24 October 2026)

**Status: merged and published, not merely a draft.** `main` at
[`35bc942a`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/35bc942a541017eb634f0c00789746ccd2aac57d)
includes the consolidated [PR #426](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/426).
The package and PWA cache are version `0.9.1+snapshot.dev.169`.
[Focused validation and GitHub Pages deployment #40072160124](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40072160124)
completed successfully on 24 October. This confirms publication of the integrated build, **not** a measured Chromebook FPS increase or complete hardware certification.

This document **supersedes the 22 October performance audit as a current status guide**, **not as its evidence record**. The original dev.164–166 Chromebook measurements remain preserved, and the newer independent integration reviews, focused regressions and release checks provide a second body of evidence. The [cumulative 22–24 October performance evidence register](PERFORMANCE_EVIDENCE_REGISTER_20261024.md) identifies what each audit and test actually establishes.
The old [dev.166 measurement audit](PERFORMANCE_MEASUREMENT_AUDIT_20261022.md)
remains historical for that build; do not silently apply its one-frame,
default-Off, warning-exemption or release-pause conclusions to dev.169.
The owner later explicitly authorized performance changes and release.
The [dev.165](FRAME_PROFILER_DEV165.md) and
[dev.166](ADAPTIVE_FRAME_SKIP_DEV166.md) notes are historical origin records;
[the dev.169 integration record](PERFORMANCE_RESILIENCE_INTEGRATION_20261024.md)
documents the implementation and focused tests. Draft source PRs
[#422](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/422),
[#423](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/423) and
[#424](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/424)
remain open as superseded source proposals; do not merge them independently.
PR #425 and integration #426 are merged.

## Implemented now (verify in source, not by old screenshots)

| Feature | Current dev.169 behavior | Owner-facing meaning |
| --- | --- | --- |
| Adaptive Frame Skip | **On by default** on new devices, existing stored Off honored | Skips at most **two consecutive FPS-eligible world draws** under sustained pressure, with **350 ms** stale-image decision guard; no special event-based warning exemption. Skipping drawings by itself does not skip simulation. |
| Critical emergency | Triggered by a hard **650 ms** callback gap, two consecutive **180 ms** gaps, or repeated excessive real drawn-frame work | While emergency is active, **simulation and combat are intentionally paused**, including hostile damage; up to **five** eligible draws can be skipped with a **650 ms** guard, while actual draw probes determine recovery (three healthy actual drawings). Do not describe emergency as merely cosmetic frame skipping. |
| Prolonged emergency | First escalation after roughly five seconds of sustained trouble or recurrent entries; further unresolved trouble can escalate after roughly eight seconds | Enemy disengagement/reset, limited physical companion withdrawal and refuge/barracks return are safeguards, not a reward or normal fast travel. Pause/menu/background periods do not accumulate involuntary-rescue time. No HP/crown refill or normal death-policy replacement. |
| Restart recovery | Device-local unclean-session marker validated against the **persisted** Normal/Nightmare campaign checkpoint | Can return a living party to a valid refuge after some abnormal closures. A completely hung browser cannot execute in-process rescue, and crash recognition is not guaranteed for every shutdown/storage condition. |
| Collision optimization | Distant circular props can be rejected with cheap axis bounds before precise distance calculations | Focused equivalence checks confirm outcomes in tested cases; it is **not** a verified device FPS improvement. |
| Crowd profiling | **Optional, Off until started**, 120-active-tick bounded local diagnostic | Accessible from the unified Screen and Performance diagnostics; export includes `performance.crowdDiagnostics`. No gameplay effect intended from enabling measurements. |
| Auto FPS | **Auto 20–30** and **Auto 30–60** both observe adaptive skips; manual 20/30/60 remain fixed targets | Sustained skips can cause cautious Auto downshifts; no Auto upshift simply because skipped callbacks looked cheap. |
| Renderer | Canvas 2D is the safe default; **PixiJS WebGL2 is an experimental selectable world renderer**, with a timed Keep/Revert trial and Canvas combat-cue overlay | Never describe the active WebGL world as merely Canvas 2D; both paths share the outer FPS/skip gate. |
| Settings/UI | Screen and Performance is one consolidated menu; menu/navigation and map routing improvements have merged (#413–#415, #421) | Older nested-menu instructions and navigation audit “unfixed” statements need separate dated qualification. |
| Release workflow | `.github/workflows/focused-deploy.yml` handles normal PR/main checks and main publication; `.github/workflows/pages.yml` is **manual-only** comprehensive certification | **Do not trigger full game, Chromium or WebKit matrices without owner opt-in.** A successful focused release does not certify every browser or physical device. |

## Measurement semantics that remain important

- `runtime.report().fps` is **legacy cadence between actual drawings**, not the same time series as the rolling active callback profiler.
- `frameProfile` records up to **180 active callbacks**. Its `callbackFps` counts callback/game-update **opportunities**. During intentional critical emergency holds, it cannot honestly be called an uninterrupted *simulation-update* rate.
- `frameProfile.displayedFps` is the rate of **issued world draw calls**, *not* compositor-presented monitor FPS.
- `adaptiveSkippedDraws` is a rolling-window count. `frameSkip.skippedDraws` is a longer **session/counter-lifetime** count. A menu/pause resets skip's short-term smoothing samples but preserves its cumulative count.
- `companionAIMs` times total `updateParty()` (including movement, combat and bookkeeping); `enemyAIMs` covers broad enemy stages. Both are **subsets of simulation**, not additional time. Independently computed P95 stage values cannot be summed.
- `audioUpdateMs`, periodic `hudMs`, combined `eventDispatchMs`, `renderMs` are **synchronous code timing boundaries**, not exclusive whole-system utilization.
- `renderMs` is combined synchronous world draw-call time. Current `pixiMs`, `canvasOverlayMs`, `canvasWorldMs` are **per-active-rendering-surface** samples. Neither Pixi call time nor overlay call time measures asynchronous GPU completion or on-screen latency.
- Latest-draw Canvas scene counters can refer to the Canvas combat overlay when WebGL2 is selected; the exported `render.measuredLayer`, `graphicsRenderer` and per-surface sample counts identify that scope. Renderer phase and idle/menu sample windows can still differ from the 180 active callback profiler window.
- No skipped draw's counterfactual CPU cost is directly observed; multiplying skips by average draw time is an **estimate**, not independently measured time saved.

## Evidence and remaining confidence boundaries

The [cumulative audit and test register](PERFORMANCE_EVIDENCE_REGISTER_20261024.md) separates three evidence layers: the original dev.164–166 device reports and timing audit; the later dev.169 independent Auto FPS, boss-reset, restart and collision reviews with specific regression tests; and successful integrated/build/publication workflows. It is inaccurate to describe the original audit as the **only** available performance evidence, or to treat later CI results as a controlled device benchmark.

The [integrated focused runs](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40062622171)
and the final published [focused run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40072160124)
exercise Auto downshift/promotion safeguards, the frame-skip controller, emergency and crash recovery, boss-specific cleanup, crowd collision equivalence, related save/PWA cases and packaging. The synthetic collision benchmark
observed 1,849,219 vs 689 precise hypot calls in a constructed 600-prop/3,200-probe workload with 421 identical classifications. This demonstrates fewer precise computations *in that fixture only*, not actual FPS improvement on the owner's Chromebook.

**Not yet established by these results:** matched-device FPS improvement, true display-presentation FPS, input-to-photon latency, every possible boss/scene interaction, every browser/phone build, or every OS crash/force-close path. The owner explicitly deferred hardware acceptance until **after** publication. Distinguish implementation-and-focused-test success from user experience and performance certification.

## How to compare future samples responsibly

Record the exact `version` and `graphicsRenderer.activeRenderer`, Auto preference and **actual** `frameRateTarget`, adaptive skip setting/emergency status, resolution/zoom, active callback and issued-draw counts, both skip counters with their time windows, per-renderer stage counts and crowd scene. Use matched scenarios and a real device before attributing changes to a feature. When emergency pauses simulation, describe that pause explicitly; don't count those callbacks as completed gameplay ticks.

This is a documentation reconciliation, **not a request or authorization for more tuning or broader tests**. Historical release/evidence notes remain useful when interpreted against their original commit and date.
