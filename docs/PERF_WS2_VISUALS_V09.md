# v0.9 workstream 2: visual-only occlusion broad phase

Shared baseline: `c6ce1af236bddd7ca881903499c4cf5de175f9e2`.
Workstream branch: `perf/v09-visuals-20261010`. Project: [#218](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/218).

## Scope and ownership

The sole runtime edit is `renderer.js::occlusionPairs`. Enemy AI, companion AI, combat logic, gameplay simulation, frame scheduling, animation clocks, save schema, art, geometry, lighting, occlusion visibility and mask painting are unchanged. There is no cross-frame cache.

The baseline helper repeatedly classifies, projects and resolves the sprite label height of the same foreground scenery for each visible actor. The candidate indexes eligible actors and major scenery in existing painter order once during one call and reuses each queried scenery projection/height during that call. Draw-order and world-depth tests, vertical/horizontal boundaries, eight cover objects per actor, stable party-first priority, twelve selected masks and all actual-alpha painting operations retain their exact rules.

The bounded temporary arrays are O(visible entities), replaced at the next call. Coordinates and label heights are pure for the duration of one draw. Camera movement, mutable scenery, sprite replacement and scene changes are therefore reflected on the next call without invalidation bookkeeping. No sprite load, residency policy or resource queue is changed.

WS1 owns `visuals.js`, terrain/roads and material/ground caches; this helper consumes their existing height results. Shared `renderer.js` ground/material calls remain untouched. WS3 owns interface/audio, and WS4 owns loading/persistence. Package, build, CI and generated files remain with the integration owner.

## Preservation evidence

`node tests/perf-ws2-occlusion.test.cjs` passes:

- 1,200 differential randomly generated sorted/unsorted scenes against the exact preserved baseline helper, including neutral/dead actors, interaction-only entities and excluded clutter.
- Exact ±155 horizontal and vertical/depth boundary cases; 21 authored desktop/phone, crowded/no-cover and zero-eligible-actor stress pair comparisons.
- 18 byte-identical complete bounded renderer mask scenes across hero/ally/enemy, foreground/background and one/four/ten cover objects; input state remains unchanged.
- 360 independent deterministic campaign frames across all three hero classes, with enemy engagement and companion behavior: the old and new painter produce identical complete campaign state and event traces after every simulation step.

Existing `occlusion`, `terrain-effects`, `sprites`, `sprite-lifecycle`, `enemy-vfx-foundation`, `enemy-vfx-events`, `enemy-vfx-art` and `enemy-vfx-quality` suites pass. This includes 92 boss/TRUE and 142 captain/rogue/night behavioral-equivalence cases in the unchanged VFX bridge and historical sprite density/lifecycle checks.

The additional standalone `tests/perf-ws2-occlusion-browser.test.cjs` compares full real-art browser Canvas pixels between the candidate painter and the exact old helper in 54 region/dungeon × desktop/phone × 100/150/175% camera scenes. The integration owner runs it against the combined candidate. It releases scene canvases rather than retaining large native surfaces.

An initial full-campaign native Canvas experiment was stopped by process exit 137 under resource pressure, without an assertion result. It is not a passing proof. The retained bounded native mask suite passes; full real-art browser comparison is a separate explicit gate.

Historical-save compatibility is the combined integration gate. This workstream changes no domain or persistence source and serializes no new field.

## Measurements

Paired helper measurements are made only during the coordinator's isolated CPU slot with:

```sh
node scripts/perf-ws2-occlusion.cjs docs/perf-ws2-occlusion-measurements.json
```

The script checks pair equality first, warms both helpers, alternates timing order over 16 rounds of 500 calls and records 19 normal-actor and two nonstandard zero-eligible-actor profiles. It measures only the occlusion broad phase, not frame rate. Authored scene lists use actual visible campaign entities and sprite/procedural heights at 150%; synthetic stress rows are explicitly identified.

Measured on 2026-10-10 with Node v24.19.0, Linux/x64. The coordinator serialized workstream timing runs; a pre-existing baseline regression process remained active on the shared host. Treat timings as variable host evidence. All 19 normal-actor profiles retained identical selected pairs; all improved in this run. Two additional nonstandard zero-eligible-actor profiles are measured separately below. Full numeric distributions and work counts are retained in [the measurement JSON](perf-ws2-occlusion-measurements.json).

| Helper profile | Median before (ms) | Median after (ms) | Reduction | Projection calls before → after | Height calls before → after |
| --- | ---: | ---: | ---: | ---: | ---: |
| Vale desktop, 74 entities | 0.2140 | 0.0555 | 74.1% | 112 → 34 | 99 → 21 |
| Marches desktop, 74 entities | 0.7930 | 0.0639 | 91.9% | 118 → 26 | 106 → 14 |
| Highlands desktop, 134 entities | 2.1871 | 0.1817 | 91.7% | 548 → 58 | 532 → 42 |
| Frontier desktop, 112 entities | 0.6226 | 0.1096 | 82.4% | 250 → 42 | 236 → 28 |
| Crown desktop, 70 entities | 0.1175 | 0.0491 | 58.2% | 60 → 26 | 52 → 18 |
| Highlands phone, 70 entities | 0.3596 | 0.0616 | 82.9% | 113 → 24 | 102 → 13 |
| Synthetic actor/cover crowd, 225 entities | 0.6355 | 0.1497 | 76.4% | 558 → 104 | 497 → 43 |

These are **helper-only improvements**. No combined end-to-end frame improvement is claimed from them. The actual observed full-renderer effect must come from the independent combined benchmark below.


The independent full-source benchmark compares an unchanged baseline checkout with the actual complete combined candidate, including WS1 changes:

```sh
PERF_WS2_BASELINE_ROOT=/tmp/perf-v09-baseline \
PERF_WS2_CANDIDATE_ROOT=/path/to/combined-candidate \
PERF_WS2_BROWSER_ENGINE=webkit \
node scripts/perf-ws2-renderer-performance.cjs /path/to/full-renderer-report.json
```

It loads each checkout's complete domain/presentation graph into separate frozen browser pages without the shell, simulation, audio or rAF; warms ground and road materials, drains pending sprite and material loads; alternates baseline/candidate order; forces full `getImageData` after every draw; and requires exact baseline/candidate and independent baseline/baseline pixel equality before timing, after every measured round and at completion; complete campaign-state SHA-256 remains unchanged. The report records the exact browser version, both trees' source hashes, raw timing samples and every exact paired checkpoint. Presentation performance.now is frozen at 16000 ms because terrain and atmosphere read it directly; measurement uses a bound original monotonic clock captured before that override. Production clocks remain unchanged. Eight Vale/Highlands/crypt/crowd × desktop/phone scenes use the selected 150% camera. These are full-painter cost measurements with readback, not active-play or physical-device cadence.

The exported helper's synthetic zero-eligible-actor calls were also measured, with zero projects/heights and identical empty results. With 160 scenery entities and no actors, baseline median 0.00313 ms became 0.03525 ms; with 191 dead/neutral-only entities, 0.00457 ms became 0.04339 ms. These are about 0.032/0.039 ms of extra classification in a nonstandard call; the regular renderer always includes its camera-centered hero. The optimization is consequently scoped to actual rendered campaigns and does **not** claim universal improvement for all exported-helper inputs. These results are retained in [zero-actor evidence](perf-ws2-zero-actor-measurements.json). No additional early-return pass was added to normal rendering just to optimize this artificial case.

## Deliberately rejected optimizations and remaining limits

Reducing enemy/companion update frequency, simulation tick rate or combat work is prohibited. Reducing VFX frame frequency/lifetime/particles, changing silhouette or visibility thresholds, lowering the eight-cover/twelve-actor mask bounds, omitting night lighting, or caching moving/animated actor silhouettes across frames would change visible timing or readability. None was attempted. Persisting projection/height caches across frames would add stale-camera/sprite-replacement risks; reuse remains inside one call.

Broad-phase savings do not remove the cost of four alpha canvases per selected actor, terrain/roads, sprite rasterization, lighting, text, effects or GPU readback. The benchmark does not certify real Chromebook/iOS performance, thermal behavior or subjective readability. All successful changes must be combined and validated through the coordinator's integration branch and one final PR; this branch is never merged directly into `main`.


## Frozen browser harness correction and independent control

The first attempted full-source browser comparison supplied a fixed renderer `now` callback but overlooked the existing direct `performance.now()` reads in `visuals.js` terrain and atmosphere. Different page ages therefore produced different animated terrain/mote phases. The corrected development harness freezes that global presentation clock and retains the original bound monotonic clock separately for actual elapsed-time measurement. No production module changes for this correction.

Frozen initial Vale desktop, Vale phone and Highlands desktop comparisons then matched the complete combined candidate and two independent unchanged-baseline pages exactly. Highlands' unchanged baseline, combined candidate and independent baseline control also showed the **same five-pixel** change on later draws, with the same exact initial hash and the same exact later hash, unchanged campaign-state hash and identical stable sprite/material counts. Maximum channel difference across that baseline temporal change was 16. A bounded twelve-frame/readback warmup did not eliminate it. It is recorded as a baseline/browser capture effect; its precise backend cause is unresolved.

Initial-to-final raster identity was therefore replaced with the actual preservation requirement: **zero differing pixels between baseline and candidate, and between two independent baseline sources, at every measured checkpoint**, while each source's campaign state remains unchanged. There is no tolerance or threshold relaxation. Each timed round advances the independent baseline control by the same draw count, checks all three exact SHA-256 pixel hashes and retains the result. Initial-to-final raster stability remains reported as information rather than mistaken for a source regression. Diagnostic PNGs and pixel coordinates are retained separately under `test-results/perf-ws2-diagnostic` by the integration owner.
