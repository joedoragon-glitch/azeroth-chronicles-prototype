# v0.9 performance · infrastructure workstream

Baseline: `c6ce1af236bddd7ca881903499c4cf5de175f9e2`; branch: `perf/v09-infrastructure-20261010`. The root integration owns generated `sw.js`, package version and final release checks. Runtime ownership is limited to `templates/service-worker.js`; `audio-assets.js` and `persistence.js` were inspected and retained byte for byte.

## Change and preservation

The worker now prepares registration scope/public navigation URLs once, reuses its already-parsed request URL for the query-free cache key, and computes navigation fallback only for navigation requests. Every real published static inventory request previously constructed five URLs; it now constructs one. No fetch, installation, activation, cache inventory, decoded budget, local-storage operation or save schema is changed. The existing cache-first policy, query normalization, optional historical games, malformed-manifest fallback, atomic failed sprite install and old-cache retention are preserved.

`tests/perf-ws4-infrastructure.test.cjs` runs the baseline template and candidate against identical request/cache/network fixtures. It compares full response bytes, status and headers plus ordered network/cache traces across every core file, sprite fixtures, online/offline reads, three registration scopes, public/nested/historical navigation, unknown resources, foreign origin/sibling scope/POST bypass, incomplete cache, failed installation, malformed manifest and explicit `SKIP_WAITING`. The archived template is the untouched baseline source, not a second runtime implementation.

The counted static-inventory run constructs **975 → 195 URLs (80% fewer)**. `scripts/perf-ws4-benchmark.cjs` measures only synchronous request routing using the actual worker handlers, nine alternating before/after rounds and 50,000 requests per round, with cache/network work excluded. Raw timing evidence is in `docs/evidence/perf-ws4-routing.json`.

| Workload | Baseline median μs/request | Candidate median μs/request | Reduction |
| --- | ---: | ---: | ---: |
| Registered static requests | 14.51 | 4.68 | 67.7% |
| Public/historical navigation | 10.16 | 4.61 | 54.6% |

This was a shared Linux/Node v24.19.0 worker. Root baseline tests continued filesystem packaging work, other agents held CPU benchmarks, and root held additional CPU-heavy tasks. The counterbalanced pairing reduces order bias; sample variability remains substantial, especially baseline navigation outliers, and this is not a pristine-machine result. Every paired candidate sample was faster in both workloads. These figures describe routing microseconds, not total page-load latency, network download reduction, memory residency or physical-device FPS. Set `PERF_WS4_RUN_NOTE` to record the environment when rerunning the script.

Validation passed: infrastructure differential suite; all 15 existing service-worker checks against the candidate template rendered in memory; platform/runtime/storage regressions; recorded-audio cache/hash/codec/duration/budget/pinning/transition/disposal regressions; six actual v0.8.118 historical save imports; v2 migration/current-save migration tests. The existing service-worker suite must also run against generated `sw.js` after the root builds the integrated candidate; full combined browser/regression/behavioral tests are integration responsibilities.

## Deliberately rejected

- Deduplicating or skipping local-storage save writes could suppress existing quota/storage errors and change observable status, profile mutation and write ordering. Preserve synchronous save/snapshot calls, all storage keys, original legacy backups and `save.js` exactly.
- Eager audio decoding, larger budgets or parallel decodes would change startup work, memory admission and fallback/transition timing. The existing one-decode/eight-pending/32 MiB bounded cache remains untouched.
- Sharing decoded audio by content ID offered no production reuse: all **127 registered recordings have 127 unique source paths** at the baseline. Introducing cross-ID cache ownership would complicate loop/duration metadata and pinning without a measured benefit.
- Skipping registered sprite/audio precaching or relaxing install failures would change offline completeness or old-cache recovery; both are retained.
- Cache-storage handle/response memoization could change visibility of later writes and error handling. Only immutable URL metadata is cached.
- Any AI throttling, simulation/update cadence change, audio event suppression, gameplay-side batching or save scheduling is outside this workstream and protected by the user instruction.

Remaining limits: response-cache and disk/network costs dominate many loads; this narrow optimization may produce a small overall startup improvement despite a substantial routing CPU reduction. Physical iPhone/Chromebook latency and heat remain unmeasured. No gameplay implementation, simulation timing, outcomes, art or assets were changed.
