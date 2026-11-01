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

[The focused workflow](../.github/workflows/pixi-755-acceptance.yml) does one opt-in/issue-specific software-WebGL experiment:

1. Pin the PR base commit and exact PR head. On the same Ubuntu GitHub Actions runner, create a separate unchanged-base worktree and use the **same PR-head measurement harness** for both source trees. A different measurement algorithm must never be compared with the old 24-sample algorithm.
2. Install the same locked Node dependencies and Chromium, and prepare the SHA-verified local PixiJS v8.22.0 bundle separately in **both** worktrees (`node scripts/vendor-pixi.cjs --ensure`). Exercise the native one-Campaign 150%-zoom, DPR=1, Optimization-On *synthetic cover/crowd* fixture. Sample four actor populations: 1, 8, 24 and 48.
3. For every population, record a **first fixture draw** (not a cold app start), perform 16 unmeasured warmup draws, then collect 96 consecutive `performance.now()` measurements around the actual `gpu.draw(); painter.draw();` composition. Keep native scene indicators, cache counters, fallback status and occlusion/mask counters. Assert no new body bakes *during the measured steady sample*.
4. Interleave independent process runs **baseline → head → head → baseline** to reduce drift bias. Save each run's exact Git SHA, Chromium version, Node/runner metadata, viewport, DPR, zoom, measurement version, p50/p95, first-fixture draw time, and scene/resource counters in artifact JSON. No `PARITY_PERF_DELAY_MS` artificial injection is permitted in acceptance runs.
5. Compare the median of each side's independent-run p50 and p95, separately for all four populations, via [the comparator](../scripts/pixi-755-compare.cjs). Reject invalid, unmatched, incomplete, fallback, rerasterizing, or insufficiently warmed measurements before scoring.

**Acceptance decision:** GO requires no material slowdown in **any** p50 or p95 actor-population result and comparable repeated-run baseline evidence. A draw-time regression is material when the candidate's median exceeds the baseline median by more than **the greater of 25% of that baseline or three times baseline median absolute deviation (MAD)**. These are relative change and measured noise allowances, **not arbitrary 16.7/33.3 ms or FPS targets**. An excessive spread between baseline repeats (greater than 60% of their median) yields **HOLD / inconclusive**, never green. The conservative 25% tolerance is meant to catch a meaningful workload shift while avoiding noisy, tiny software-GPU differences; it is an explicit engineering change-detection criterion, not a claim that a 24% regression is good or unnoticeable. Smaller trends still appear in the JSON and warrant review, especially with a matching owner observation.

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

**Result: GO for *relative synthetic draw-time regression* only.** The dedicated [paired acceptance run #41362229300](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41362229300) completed successfully and retained the [`pixi-755-paired-composite` artifact (screenshots, four run receipts and `decision.json`)](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41362229300/artifacts/13105973926). The same-branch [focused native verification #41362229273](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41362229273) passed. The acceptance artifact's **tested source baseline** is `789f9d80bb11d99016bed8d816d2bf5d8e27f5f6`; **tested candidate** is GitHub's PR check-merge tree `3ea913c2997db49d013e2b873bbe141420b48271` (not a deployed build). The browser is Chromium `151.0.7922.34`, with ANGLE SwiftShader, at 912×600 DPR=1 and 150% zoom.

| Number of actors | Steady p50 baseline → candidate (ms) | Steady p95 baseline → candidate (ms) | Comparator |
| ---: | ---: | ---: | --- |
| 1 | 1.9 → 1.9 | 3.9 → 2.9 | GO |
| 8 | 3.3 → 3.5 | 8.7 → 7.6 | GO |
| 24 | 8.4 → 10.2 | 456.3 → 446.2 | GO |
| 48 | 13.3 → 12.1 | 573.4 → 568.0 | GO |

Each score is the median of two independent run percentiles; each run uses 16 warmup draws and 96 timed combined Pixi+Canvas draw calls. No comparator material-regression or excessive baseline-noise condition fired (`problems: []`). The native comparator's deliberately slowed positive control and the synthetic Auto/adaptive controller regression passed. Additional DPR=3 synthetic-browser smoke passed in **390×844 portrait** and **844×390 landscape**, each with real composited cover and registered actor fixtures.

**Important acceptance boundary:** Software-rendered p95 in the hundreds of milliseconds is not evidence of smooth gameplay, device-ready frame pacing or a threshold the game should meet. It shows substantial *software* fixture tail cost in both unchanged and candidate trees. The relative GO answers only “Did this candidate add a detectable material synchronous draw-time regression under these fixed conditions?” It does **not** answer “Is the engine fast enough on iPhone/Chromebook?” or “Has #481 been fixed?” No optimization fix, physical-device test, merge or deployment is claimed. Do not close the device-acceptance portion of #755 merely because the regression detector passed. The full receipts are a retained GitHub Actions artifact with limited retention; the key quantified results and tested SHAs are preserved here.

## Interpretation and unresolved device boundary

The steady probe measures **synchronous JavaScript calls to the composited renderer**; it cannot measure GPU command completion, real presentation pacing, thermal throttling, battery, input latency or resident GPU memory. It runs frozen authored visuals, not active 48-monster AI combat. Its first-fixture draw is useful for tracking one-time work/caching but does not isolate cold browser startup, downloaded assets or first real combat entry. The run records texture-source and bake deltas, not comprehensive GPU residency. Unexpected source pressure and first-visit spikes are **investigation signals**, not proof of #481's cause.

A green CI result means: **no material synchronous CPU regression was detected under this matched, qualified synthetic fixture**. It does not mean Pixi is universally faster than Canvas, that 60 FPS is achieved, or that the installed PWA has updated. Before any hardware performance claim, the owner must observe the released build on actual iPhone and Chromebook, with practical movement/combat, a fresh first visit versus a warm return, orientation/resume, context loss/fallback and longer sessions. Preserve any discrepancy as real-device evidence in #481/#460, not as a reason to falsify this synthetic acceptance.

**Release policy:** Reviewing or even approving this PR does not merge or deploy it. Owner authorization is required for either action. No game logic, art, asset policy, cache ceiling, renderer default or PWA files change in #755.
