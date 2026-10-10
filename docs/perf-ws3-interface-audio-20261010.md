# Workstream 3: interface and audio observation

Shared baseline: `c6ce1af236bddd7ca881903499c4cf5de175f9e2`.
Work branch: `perf/v09-interface-audio-20261010`.
Runtime ownership changed: `src/prototype/audio-score.js` and `src/prototype/audio-recordings.js` only.

## Accepted implementation

`describe()` reads the same enemies once in array order, counts every living engaged non-neutral enemy, and retains the first qualifying boss. It skips sparse slots as the preceding `filter()` did. It removes the intermediate engaged-enemy array and subsequent boss search. It never invokes AI, changes enemies, or shares/stores a campaign-derived cache.

Recorded cue matching returns immediately for an absent/empty rule array. Recorded event lookup returns immediately for an absent/empty binding array. Both avoid constructing scene copies that cannot yield a recording. Nonempty first-match selection, detail overrides, rate limits, procedural fallback, warming and lifecycle paths remain the same.

No HUD, menu, CSS, asset, audio recipe, gain, source limit, transport, clock, shell, frame scheduling, persistence or gameplay file changes are included. Package version and generated release files belong to integration.

## Paired benchmark evidence

Run `node scripts/perf-ws3-audio.cjs`. This compares the preserved baseline methods against candidate methods in the same Node process with identical deterministic fixtures, 5,000 warm-up calls and 11 alternating before/after rounds of 20,000 calls per case. Results are median microseconds per call. Baseline methods were extracted before editing and are retained with the baseline SHA in `tests/fixtures/perf-ws3-audio-baseline.json`.

The CPU slot was serialized across workstreams. Baseline packaging tests remained active doing filesystem I/O on the shared host. Node was v24.19.0 on Linux x64. This is an isolated CPU microbenchmark with a simulated running audio context and pre-existing recorded transports, not a Chromebook/iPhone FPS, Web Audio DSP, decode-memory, battery or end-to-end gameplay benchmark.

| Case | Run 1 baseline → candidate µs | Run 1 improvement | Run 2 baseline → candidate µs | Run 2 improvement |
| --- | --- | --- | --- | --- |
| Describe, no enemies | 0.248 → 0.107 | 56.8% | 0.188 → 0.122 | 35.2% |
| Describe, 64 enemies | 0.941 → 0.512 | 45.6% | 0.793 → 0.517 | 34.8% |
| Describe, 1,024 enemies | 7.795 → 4.848 | 37.8% | 10.826 → 7.300 | 32.6% |
| Unbound effect fallback | 0.150 → 0.046 | 69.3% | 0.249 → 0.049 | 80.2% |
| Steady production observation | 5.952 → 6.001 | -0.8% | 8.061 → 7.378 | 8.5% |
| Full audio update, 64 enemies | 9.279 → 9.987 | -7.6% | 19.477 → 18.114 | 7.0% |
| Full audio update, 1,024 enemies | 18.539 → 14.720 | 20.6% | 41.180 → 28.983 | 29.6% |

Full update at 64 enemies and steady-production gain are **inconclusive**, because the direction changes between runs and absolute timings vary substantially. They are not claimed improvements. The helper improvements and 1,024-enemy synthetic stress improvement repeat, but the stress result does not establish gains at normal encounter sizes. Preserve both runs rather than choosing the favorable run:

- `docs/perf-ws3-audio-benchmark-20261010.json`
- `docs/perf-ws3-audio-benchmark-repeat-20261010.json`

## Validation

Eleven focused suites passed: all eight non-browser `audio*.test.cjs` suites, `enemy-audio.test.cjs`, `menus.test.cjs` and `perf-ws3-audio.test.cjs`.

The new differential suite checks 400 baseline-equivalent observations across 0–1,024 enemies, sparse slots, dead/neutral/unengaged enemies, ordered boss selection, exploration/refuges/interiors, peace/game-over and shell activity states. It snapshots campaign, hero and zone state around observation. It compares absent/empty/custom rule behavior, nonempty rule ordering, warm/cold event dispatch, detail precedence, throttles, warming completion, immediate catalog replacement, mute/pause/suspended behavior, and production cue/stem traces against the preserved baseline methods.

Existing suites verify original scheduled compositions/effect hashes, all authored place/boss identities, environmental transitions, immediate fallback without delayed replay, score transport, bounded sources, catalog validation/replacement, offline packaging, menu actions using the current campaign, and enemy sound/VFX synchronization/save isolation. These are real existing contracts; no gameplay tests were loosened or audio fixture baselines revised.

Commands:

```sh
node tests/perf-ws3-audio.test.cjs
node tests/audio-assets.test.cjs
node tests/audio-catalog.test.cjs
node tests/audio-environment.test.cjs
node tests/audio-housekeeping.test.cjs
node tests/audio-production.test.cjs
node tests/audio-recordings.test.cjs
node tests/audio-scheduler.test.cjs
node tests/audio.test.cjs
node tests/enemy-audio.test.cjs
node tests/menus.test.cjs
```

Full combined regressions, real-renderer comparisons, historical-save differential tests, browser/device paths, release build and generated-file checks are integration gates owned by the coordinator. This stream alone makes no release-readiness claim.

## Deliberately rejected optimizations and remaining limits

- Throttling audio observation or sharing cached campaign-derived descriptions could delay boss/engagement/refuge changes. Every original observation call still executes.
- Changing audio scheduler periods, source limits/priorities, event rate limits or asynchronous playback could change sound timing, dropped cues and feedback. Those policies are untouched.
- Reusing procedural random-noise buffers or shortening the convolution tail could change the audible output. Recipes and buffers remain authored.
- Caching menu callbacks or campaign-dependent markup could retain an old run or eligibility/action state. Specialist/menu implementations remain intact.
- No changes to enemy/companion AI, combat/simulation, protected timing or outcomes were considered acceptable. The only enemy iteration changed is a read-only audio observer.

Physical-device cadence and actual Web Audio DSP CPU remain unmeasured. The normal-count full-update result is unresolved benchmark variability, explicitly retained for final review.
