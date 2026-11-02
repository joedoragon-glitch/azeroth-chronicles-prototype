# Pixi/WebGL performance acceptance — issue #755

**Game:** So I Became the Dark Lord's Problem  
**Baseline source examined:** `main@789f9d80bb11d99016bed8d816d2bf5d8e27f5f6` (1 November 2026).  
**Review state:** Implemented on a dedicated PR branch; evidence must be reviewed at its exact tested head. **Not merged, not deployed, not verified on iPhone or Chromebook.**

This is a narrow acceptance contract for the already-shipping Canvas + Pixi composited renderer. It is **not** a diagnosis or fix for the owner-observed first-visit stutter in [#481](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/481), the separate context-loss/fallback work [#460](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/460), or the supported-renderer work [#478](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/478).

## Why the older green acceptance was insufficient

The [#748 composited parity harness](../tests/pixi-parity-browser.test.cjs) already guards exact gameplay state, visual layers, no new procedural body bakes and stable texture-source counts. Its earlier 1/8/24/48 actor test took only 24 consecutive synchronous JavaScript draw-call timings for each size, with no time limit or baseline comparison. It did **not** measure monitor-presented FPS.

The real [runtime frame profiler](../src/prototype/runtime.js) already has frame work, callback intervals, adaptive skipped draws and individual Pixi/Canvas synchronous stages. Those counters are distinct from the parity harness, and its `displayedFps` means *issued world draws*, not confirmed screen presentation. The existing [Auto/adaptive controller test](../tests/auto-fps-adaptive-coupling.test.cjs) uses controlled time, not a running phone. This issue reuses those pieces rather than building a second telemetry system.

The Pixi procedural image cache counts cropped CPU image source bytes with a ceiling; that is neither installed iOS GPU memory nor total process RSS. Changing any cache or rendering policy is explicitly outside #755.

## Reproducible measurement

[The focused workflow](../.github/workflows/pixi-755-acceptance.yml) runs on relevant Pixi renderer or acceptance-tool changes, or explicit manual dispatch; it is one issue-specific software-WebGL experiment, not a full game matrix:

1. Pin the PR base commit and exact PR head. On the same Ubuntu GitHub Actions runner, create a separate unchanged-base worktree and use the **same PR-head measurement harness** for both source trees. A different measurement algorithm must never be compared with the old 24-sample algorithm.
2. Install the same locked Node dependencies and Chromium, and prepare the SHA-verified local PixiJS v8.22.0 bundle separately in **both** worktrees (`node scripts/vendor-pixi.cjs --ensure`). Exercise the native one-Campaign 150%-zoom, DPR=1, Optimization-On *synthetic cover/crowd* fixture. Sample four actor populations: 1, 8, 24 and 48.
3. For every population, record a **first fixture draw** (not a cold app start), perform 16 unmeasured warmup draws, then collect 96 consecutive `performance.now()` measurements around the actual `gpu.draw(); painter.draw();` composition. Keep native scene indicators, cache counters, fallback status and occlusion/mask counters. Assert no new body bakes *during the measured steady sample*.
4. Interleave independent process runs **baseline → head → head → baseline** to reduce drift bias. Save each run's exact Git SHA, Chromium version, Node/runner metadata, viewport, DPR, zoom, measurement version, p50/p95, first-fixture draw time, and scene/resource counters in artifact JSON. No `PARITY_PERF_DELAY_MS` artificial injection is permitted in acceptance runs.
5. Compare p50 and p95 separately for each of the four populations via [the comparator](../scripts/pixi-755-compare.cjs). Each side must consist of independent runs from one exact source revision, with matched Chromium/runner environment, dependency lock, viewport, zoom and fixture version. Reject absent/duplicated populations, test-injected delays, fallback, missing or unstable texture counts, rerasterization and insufficient samples before scoring.

**Acceptance decision (reviewed v2):** An actor-count/percentile result is a replicated material regression only when **both independent candidate runs** exceed the baseline median plus the greater of **25% of that baseline or three times its median absolute deviation (MAD)**. A single candidate spike is explicitly reported as **WATCH**, not silently hidden or mislabeled as a proven regression. Excessively dispersed baseline values (greater than 60% of their median) remain **HOLD / inconclusive**; malformed or unmatched evidence fails closed. These are relative change/noise criteria, **not arbitrary 16.7/33.3 ms or FPS targets**. With only two independent runs, the guard is deliberately a coarse *reproducible-change detector*, not a statistical proof of equivalence. A WATCH finding still matters, especially if it recurs or matches device evidence. The conservative 25% allowance is an explicit engineering sensitivity trade-off, not evidence that a smaller regression is acceptable.

[The native positive-control test](../tests/pixi-755-acceptance.test.cjs) supplies identical fixtures with deliberately increased drawing time and requires **HOLD** at all four actor counts, while similar baseline values must produce GO. The browser harness additionally supports a test-only deliberate CPU delay, disabled for real acceptance evidence.

**Focused browser smoke:** The same workflow also runs existing visual fixtures at DPR=3 in 390×844 portrait and 844×390 landscape, 175% zoom. This tests layout/GPU preparation and fallback/visual invariants in *simulated* browser viewports; it does **not** model iPhone DPR scaling, memory pressure, thermal constraints or touch ergonomics accurately.

**Controller smoke:** `node tests/auto-fps-adaptive-coupling.test.cjs` covers Auto pressure-demotion, clean recovery and frame-skip accounting in an independent synthetic runtime test. The parity fixture's `optimized` flag is **not** the real application Auto mode. Do not claim end-to-end Auto adaptation from these green checks.

## How to reproduce

The complete command and worktree setup are in [the focused workflow](../.github/workflows/pixi-755-acceptance.yml); it is triggered by edits to these specific acceptance files, or manually with an explicitly supplied immutable baseline SHA. To reproduce a *single* steady sample in an environment with locked dependencies and software-WebGL Chromium:

```sh
PARITY_FIXTURES=cover PARITY_PERF=1 PARITY_PERF_SAMPLES=96 \
PARITY_PERF_WARMUP=16 PARITY_ZOOM=1.5 PARITY_OPTIMIZED=1 \
PARITY_DPR=1 PARITY_OUT=test-artifacts/pixi-755 \
node tests/pixi-parity-browser.test.cjs
```

One run produces diagnostic `evidence.json` and screenshots; **one run is not a passing paired performance acceptance**. The workflow's comparator uses four runs, matched in one runner, and writes `decision.json`. A native local check is `node tests/pixi-755-acceptance.test.cjs`. Do not compare local developer hardware timings with hosted CI evidence.

## Measured acceptance receipt — 1 November 2026

**Historical v1 result: GO for *relative synthetic draw-time regression* only, subsequently superseded by the stricter review interpretation below.** The dedicated [paired acceptance run #41362229300](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41362229300) completed successfully and retained the [`pixi-755-paired-composite` artifact (screenshots, four run receipts and `decision.json`)](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41362229300/artifacts/13105973926). The same-branch [focused native verification #41362229273](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41362229273) passed. The acceptance artifact's **tested source baseline** is `789f9d80bb11d99016bed8d816d2bf5d8e27f5f6`; **tested candidate** is GitHub's PR check-merge tree `3ea913c2997db49d013e2b873bbe141420b48271` (not a deployed build). The browser is Chromium `151.0.7922.34`, with ANGLE SwiftShader, at 912×600 DPR=1 and 150% zoom.

| Number of actors | Steady p50 baseline → candidate (ms) | Steady p95 baseline → candidate (ms) | Comparator |
| ---: | ---: | ---: | --- |
| 1 | 1.9 → 1.9 | 3.9 → 2.9 | GO |
| 8 | 3.3 → 3.5 | 8.7 → 7.6 | GO |
| 24 | 8.4 → 10.2 | 456.3 → 446.2 | GO |
| 48 | 13.3 → 12.1 | 573.4 → 568.0 | GO |

Each score is the median of two independent run percentiles; each run uses 16 warmup draws and 96 timed combined Pixi+Canvas draw calls. No comparator material-regression or excessive baseline-noise condition fired (`problems: []`). The native comparator's deliberately slowed positive control and the synthetic Auto/adaptive controller regression passed. Additional DPR=3 synthetic-browser smoke passed in **390×844 portrait** and **844×390 landscape**, each with real composited cover and registered actor fixtures.

**Important acceptance boundary:** Software-rendered p95 in the hundreds of milliseconds is not evidence of smooth gameplay, device-ready frame pacing or a threshold the game should meet. It shows substantial *software* fixture tail cost in both unchanged and candidate trees. The relative GO answers only “Did this candidate add a detectable material synchronous draw-time regression under these fixed conditions?” It does **not** answer “Is the engine fast enough on iPhone/Chromebook?” or “Has #481 been fixed?” No optimization fix, physical-device test, merge or deployment is claimed. Do not close the device-acceptance portion of #755 merely because the regression detector passed. The full receipts are a retained GitHub Actions artifact with limited retention; the key quantified results and tested SHAs are preserved here.

## Engineering review correction — 1 November 2026

An additional unchanged-engine/browser run [#41363386370](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41363386370) returned HOLD only for **one-actor p95** (1.6 ms baseline vs 2.2 ms candidate). The two independent candidate runs were 1.6 and 2.8 ms: one sample was ordinary, one spiked. All 8/24/48-actor cases passed. A documentation-only commit separated this run from the earlier GO. Therefore the source evidence **does not establish a replicated render regression**, but it did expose a false-positive failure in v1's median-of-two criterion.

The reviewed v2 comparator now requires repeated material slowdown, records a single-run spike as **WATCH**, rejects injected timing delays, verifies same-runner and exact-source provenance and steady texture-source stability, and selects this focused browser workflow for future changes to affected Pixi/Canvas renderer source. Native tests include positive controls for repeatable slowdown, unreplicated noise and invalid evidence. This is a test reliability correction, not a waiver of measured cost, nor a game-rendering fix. **The v1 numerical table above is retained as a dated historical measurement, not an asserted v2 exact-head acceptance result.**

## Interpretation and unresolved device boundary

The steady probe measures **synchronous JavaScript calls to the composited renderer**; it cannot measure GPU command completion, real presentation pacing, thermal throttling, battery, input latency or resident GPU memory. It runs frozen authored visuals, not active 48-monster AI combat. Its first-fixture draw is useful for tracking one-time work/caching but does not isolate cold browser startup, downloaded assets or first real combat entry. The run records texture-source and bake deltas, not comprehensive GPU residency. Unexpected source pressure and first-visit spikes are **investigation signals**, not proof of #481's cause.

A green CI result means: **no material synchronous CPU regression was detected under this matched, qualified synthetic fixture**. It does not mean Pixi is universally faster than Canvas, that 60 FPS is achieved, or that the installed PWA has updated. Before any hardware performance claim, the owner must observe the released build on actual iPhone and Chromebook, with practical movement/combat, a fresh first visit versus a warm return, orientation/resume, context loss/fallback and longer sessions. Preserve any discrepancy as real-device evidence in #481/#460, not as a reason to falsify this synthetic acceptance.

**Release policy:** Reviewing or even approving this PR does not merge or deploy it. Owner authorization is required for either action. No game logic, art, asset policy, cache ceiling, renderer default or PWA files change in #755.
