# Combined full-painter timing and independent controls

The final review includes these diagnostics and records the independent baseline control timing that the harness already executes. This addition changes no production implementation, workload, or exact pixel/state assertion. Both valid runs used identical production source hashes.

WebKit 26.5, 150% camera, twelve warmed draw/readback frames, eight alternating rounds of four draws each. Presentation `performance.now()` is frozen at 16000ms; elapsed draw plus full-canvas readback uses the captured real monotonic clock. Scenes exclude the app, simulation and audio. All times below are **upper medians** (sorted samples[4] for eight samples), in milliseconds.

| Scene     | Width | Baseline | Candidate | Reduction |
| --------- | ----: | -------: | --------: | --------: |
| Vale      |  1280 |   220.00 |    198.00 |    10.00% |
| Vale      |   375 |    96.00 |    116.50 |   -21.35% |
| Highlands |  1280 |   271.00 |    266.25 |     1.75% |
| Highlands |   375 |   168.25 |    182.25 |    -8.32% |
| Crypt     |  1280 |   178.25 |    143.00 |    19.78% |
| Crypt     |   375 |   141.50 |    135.75 |     4.06% |
| Crowd     |  1280 |   444.00 |    447.75 |    -0.84% |
| Crowd     |   375 |   450.75 |    425.50 |     5.60% |

The focused Vale phone repeat against the same source hashes measured baseline 193.00ms, candidate 191.50ms (0.78% reduction), and independently served identical-baseline control 231.00ms (19.69% slower than baseline). Original unfavorable results remain above and in raw evidence. The focused repeat did not reproduce the initial Vale slowdown, while the independent control differed substantially despite identical code and outputs. These observations support **inconclusive whole-painter timing** on this shared host; they do not establish the precise source of variability or exclude a real scene/device regression. Helper-only and layer-only improvements must stay scoped to those measurements.

All 64 measured checkpoints across the original eight scenes and all eight focused-repeat checkpoints pass exact baseline/candidate/independent-control pixels and unchanged full game-state hashes; initial/final comparisons also pass. No pixel tolerance is used. Every source remained initial-to-final raster stable in these valid runs. Loading/decoding queues are zero, and source hashes match between runs. Full raw timing samples, hashes, checkpoint controls, and initial/final render/sprite/material counters are retained in `perf-ws2-full-render-diagnostics.json`.

Original complete reports are `/workspace/scratch/454a87484018/perf-repo/test-results/perf/combined-webkit-benchmark.json` and `/workspace/scratch/454a87484018/perf-repo/test-results/perf/vale-phone-control-repeat.json`. The committed compact report preserves all timing samples and equality/counter evidence, omitting repeated full status counters only at intermediate checkpoints.
