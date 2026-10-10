# WS1: terrain and road rendering performance

Shared baseline: `c6ce1af236bddd7ca881903499c4cf5de175f9e2` (v0.8.137). Workstream branch: `perf/v09-terrain-20261010`. The only runtime modification is `src/prototype/visuals.js`.

## Preserved contract

Road drawing previously rebuilt its deduplicated edges/nodes, all 16-point junction disks, three surface polygons per edge, and regional/bridge detail strokes on every frame. A single bounded presentation display list now reuses those world-coordinate commands. Projection, Canvas operation order, fill/stroke style, material calls, world phase and procedural geometry are unchanged. Every draw still submits every original operation through the supplied screen projection.

Before reuse, the numeric coordinates and topology of every road, region index, barrier bounds and every bridge gap are checked against copied input values. Editing a saved path in place, replacing a path, reversing an edge, changing bridge geometry, switching region or changing the region index rebuilds the list. Camera and DPR changes require no rebuild because projected points are never cached. Manifest changes still flow through the material owner on every draw.

Only one list is retained, capped at 4,096 commands, 8,192 scalar input values and 32,768 scalar geometry coordinates. Larger input remains drawable but is not retained. These are JavaScript cardinality bounds; object bookkeeping and temporary allocations are not claimed as a precise byte budget. Existing ground/material raster budgets are unchanged.

No gameplay/simulation owner, AI, timing, collision, geometry source, asset, authored scenery, persistence schema, shell scheduler or audio code changes. This is a renderer-side memo, not a new world-state store.

## Validation

- `node tests/perf-ws1-roads.test.cjs`: exact baseline Canvas and material operation traces in all five authored region roads, 20 byte-identical native Canvas raster comparisons at scales 1/1.5/2.25/3.5, fractional translations, duplicate/zero-length edges, in-place coordinate/topology changes, bridge/gap changes, region transitions and unchanged five campaign snapshots.
- `tests/helpers/perf-ws1-roads-baseline.cjs` preserves the baseline road function as an independent historical oracle; its source was extracted from the shared baseline and formatted. Do not revise it to accommodate the candidate.
- `tests/perf-ws1-roads-browser.test.cjs`: real WebKit passed all 40 byte-identical road raster comparisons. Run using `PLAYWRIGHT_MODULE`, optional `MATERIAL_BROWSER_ENGINE=webkit|chromium`, and optional `CHROMIUM_EXECUTABLE`.
- Existing `ground-cache`, `materials`, `terrain-effects`, and `world-aesthetic` suites passed, including renderer purity, cue geometry and 22 regional/scenery scenarios. Candidate syntax and focused pinned formatting passed.
- Integration owns the required generated build/version, full combined regressions, historical saves, behavioral-equivalence checks and desktop/phone browser matrix.

## Measurement

`node scripts/perf-ws1-roads-performance.cjs` runs alternating paired baseline/candidate batches for each region after warmup. Its preparation mode uses no-op Canvas methods to isolate JavaScript work; its native software-raster mode includes a forced full-canvas readback. `PERFORMANCE_OUT` can select the raw JSON destination. Neither measure is target-device FPS or full-frame cadence, and timing is deliberately outside pass/fail CI thresholds.

Measured paired hot-cache medians, milliseconds per full road layer:

| Region | JS preparation before → after | Forced software raster/readback before → after | Raster reduction |
| --- | --- | --- | --- |
| Greenwood Vale | 1.093 → 0.033 | 26.232 → 21.455 | 18.2% |
| Flooded Marches | 1.662 → 0.400 | 21.934 → 17.804 | 18.8% |
| Ironroot Highlands | 1.598 → 0.381 | 53.689 → 43.654 | 18.7% |
| Ashen Frontier | 0.828 → 0.190 | 17.980 → 14.137 | 21.4% |
| Dark Crown | 1.274 → 0.321 | 15.952 → 13.748 | 13.8% |

The JS-only preparation reduction was 74.8–97.0%; that excludes real Canvas submission/raster work. Raw samples, medians/p95, source hashes and runtime versions are in `docs/evidence/perf-ws1-roads-performance.json`. Each mode uses 18 alternating paired batches after warmup. A coordinated timing slot kept sibling benchmarks and root tests idle during this run, but unrelated host/background load is uncontrolled. Earlier project baseline suites also ran under background test load. These data measure the road layer in native software Canvas, not overall game FPS, GPU rendering or the physical target devices.

The retained list is reused in these measurements. First drawing a region or changed road/bridge input still constructs a list, so these figures do not establish a faster cold scene load. The combined project benchmark and regression pass must assess the full painter and all workstreams together.

## Rejected optimizations and remaining limits

- No AI thinning, reduced simulation tick frequency, actor throttling, encounter changes, route changes or gameplay outcome changes were considered within authorized ownership.
- Road raster caching was deliberately avoided: camera subpixel shifts, DPR/zoom changes, transparent material compositing and antialiasing need different sampling tolerances. Vector command reuse preserves exact raster output and consumes no additional Canvas backing store.
- No terrain/scenery removal, art simplification or road truncation/culling is included. Existing raster work still dominates some regions, and vector preparation savings do not imply proportional total-frame improvements.
- Physical Chromebook/iPhone performance remains to be measured by the user; shared-worker native/browser measurements establish only the tested environment.
