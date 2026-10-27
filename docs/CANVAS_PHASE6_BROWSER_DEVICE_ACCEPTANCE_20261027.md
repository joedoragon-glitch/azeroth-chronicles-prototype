# Canvas Phase 6 — integrated browser, device and release acceptance

**Initiated:** 27 October 2026  
**Tracked PR:** [draft #527](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/527)  
**Production candidate:** Canvas Phase 1 diagnostics + guarded Phase 2 **single** title outdoor-floor raster. Phase 3 regional lookahead and Phase 4 bitmap procedural-art reuse remain **HOLD**. Phase 5 retained existing native transition behavior and added regression coverage, without a new runtime painter.

## Independent outcomes — do not conflate these gates

| Evidence layer | What Phase 6 does | What it cannot establish |
| --- | --- | --- |
| Production source + Node focused checks | Ground-cache cap, title epoch/visibility/writer rules, native travel invariants and no active-combat prepaint | Real browser raster parity or human-observed responsiveness |
| **Chromium + WebKit emulated browser** | Dedicated scoped Playwright CI runs the **actual browser Canvas renderer** on desktop and phone-sized viewports; measures two controlled title/Continue journeys; checks direct-versus-reused raster pixels; records screenshot, cache counters, draw-only p50/p95/p99, first-draw and Continue timings, current frame profile, browser exceptions | **Not a real physical phone, native iOS Safari, GPU/OS memory, battery, device FPS or statistically significant optimization win** |
| Existing broader real-browser checks | `tests/ground-cache-browser.test.cjs` asserts unchanged appearance, camera margin behavior, real region/zoom/invalidation and 64 MiB cap; `tests/pixi-renderer-browser.test.cjs` independently owns optional GPU lifecycle; other browser suites own FPS, WebKit input and PWA | No assumption these suites passed merely because the new Phase 6 job did |
| Owner's target **ASUS Chromebook CX5403CMA-DB588 (8 GiB)** | Paired cold/warm title, travel, dungeon, battle and Canvas/Pixi recovery traces plus subjective touch/keyboard responsiveness | **Unrun until device owner provides capture** |
| Actual **4 GiB+ phone**, especially iOS if available | True PWA visibility, app-switch, touch/resize, cue legibility and peak memory | **Unrun until device owner provides capture** |
| **8 GiB+ desktop** | Same game build/save and controlled browser/performance comparisons | **Unrun until device owner provides capture** |
| Release gate | Review all actual-device captures, screenshot deviations, PWA/saves, regressions, tail latency and memory; obtain **explicit owner approval** | No merge, deploy or Canvas/Pixi graduation before approval |

### Browser execution and artifacts

The focused, branch-gated browser workflow is `.github/workflows/canvas-phase6-browser-acceptance.yml`: **separate from the owner-restricted full-game/browser matrices**, no deployment or write permissions. It executes `tests/canvas-phase6-browser.test.cjs` under Chromium and WebKit and runs the already-existing `tests/ground-cache-browser.test.cjs` in Chromium. Use the two `test-results/canvas-phase6-<engine>-evidence.json` files and per-profile outdoor PNGs; standard workflow artifacts are retained for 30 days. It uses pinned Playwright 1.62.1 and Node 22 and runs `scripts/build.cjs --check` (never publishes).

Local narrow reproductions, after `npm ci` and `npx playwright install chromium webkit`:

```bash
BROWSER_ENGINE=chromium node tests/canvas-phase6-browser.test.cjs
BROWSER_ENGINE=webkit node tests/canvas-phase6-browser.test.cjs
MATERIAL_BROWSER_ENGINE=chromium node tests/ground-cache-browser.test.cjs
```

The script starts a local localhost server, creates a **new campaign through the real UI**, then freezes `Campaign.tick` for a controlled draw-only parity exercise. It returns to the real title screen twice and measures an unprepared single raster and a title-prepared single raster for the **same already-constructed outdoor scene**. It suppresses automatic idle callbacks *in the measurement harness only* to isolate the two trials. It records the elapsed UI Continue journey and first `renderer.draw()` duration without treating either as a controlled hardware speedup; shader/audio/sprite warm state and the order of the two trials still differ. Browser memory may be `null` outside Chromium. Direct/cache parity is constrained to mean RGBA-channel delta below 0.6 on the controlled outdoor view, matching the existing broad ground-cache browser test, and both trials must keep ground raster bytes no greater than 64 MiB. The visual sample is **not** strict full-scene pixel equivalence.

The tests use **emulated mobile geometry, not a real phone**. In addition to screenshot and timing, they check Canvas remains selected, an actual first scene was drawn on Continue, restored region identity remains stable, title prepainting does not change the authoritative snapshot, and script exceptions are absent. They do *not* silently substitute synthetic `Campaign.enter()` teleportation for the normal Continue path.

### Physical-device acceptance matrix (all BLOCKED until recorded)

Keep the exact **same save content**, game commit/build, language, time-of-day, viewport CSS size/DPR, camera zoom, optimization preference, FPS setting and warmed asset state for each paired comparison. Note whether the browser is desktop Chromium, native ChromeOS, Android Chrome, real iOS Safari, or installed PWA. Export the built-in **renderer profiling + playtest report** using Game and settings → Screen and performance (or Save and game management where available). Include the raw JSON report and actual photo/screenshots; do not copy rounded numbers from a UI as original evidence.

| Scenario | Conditions and comparison | Required observation |
| --- | --- | --- |
| Cold title / Continue | Restored Vale save, cache empty vs one idle title-prepared floor, at DPR 1/1.5/2 and common zoom, repeat ≥5 after identical resets | Time from Continue gesture to first complete scene, input blocking, cache builds and allocation, saved zone and clock |
| Hostile restored Continue | Existing save with enemy aggro/projectile/telegraph near hero, no synthetic grace time | First visible enemy/telegraph and combat clock relative to cover removal; no missing warning/cue |
| Vale ↔ Marches transport | Real fare/interaction, reversals and return to previous region | No early/double fare, camera stutter, old-frame flash, stale cache materials |
| Main, side, supply dungeon | Entry with near-spawn hostiles; repeat re-entry if save allows | Underlay attack cues and actor order remain live; no new lookahead, no missing first frame |
| Crowded fight / sustained movement | Same crowd, spawn and input route, ≥60 s stabilized per run | Full-frame render p95/p99, drawn/skipped frames, input delay/long tasks, memory and device temperature |
| Camera motion / zoom / DPR | Stop, advance, reverse, resize and scroll in each actual region | Cache misses and rebuilds only when appropriate, no stale or blurry floor, 64 MiB floor raster cap |
| Hidden, app switch, BFCache/PWA restore | Interrupt uncommitted preflight and separately committed-but-unrevealed arrival | Commit cancellation vs preserved commit, no repeated fare, resumed first scene, writer lock and saves |
| Offline install/relaunch; corrupt save/recovery | Actual installed PWA and browser, export/import/Continue | Load from cache offline, no silent state loss or accidental game reset |
| Canvas ⇄ WebGL2 | Opt in, Keep/Revert, context loss, resize/reload (where supported) | Original Campaign retained, transparent Canvas combat overlay, immediate safe fallback |
| English and Spanish | At least outdoor Continue, transport, first-failed-draw retry and touch menus | Correct controls, bilingual interludes, usable focus on small screens |

Per trial capture `frameProfile` stages and `rendererDiagnostics` histogram percentiles with **count and sample window**, drawn/skipped count, callback interval, cumulative ground rebuild time, current raster bytes and renderer mode. Record total scene transition latency **separately** from `GroundCache.draw()` and from isolated `renderer.draw()` benchmarks. Do not label draw-call timing as whole-frame FPS.

For physical memory, use trustworthy browser/OS process measurements where available; the tracked RGBA `groundCache.bytes` is a **logical raster accounting bound**, not total graphics RAM or the PWA's resident memory. If a platform cannot expose memory or long-task timing, mark that metric *unavailable*, not zero.

### Acceptance rules and reversal

1. **Visual/progression veto:** any lost combat cue, depth-order regression, scene flash, duplicate travel/payment, save/writer corruption, offline failure, or unavoidable renderer failure rejects a candidate regardless of isolated draw speed. The current 64 MiB CPU floor limit remains unchanged; a Pixi GPU cache cannot be counted as spare Canvas RAM.
2. **Speed claims require paired actual-device trials** with comparable saves/options, cold/warm order counterbalanced, repeat distributions for transition latency, full-frame p95/p99, input latency and residency. No single headless CI timing justifies approval. If results are indistinguishable or worsen tails, keep the original native painter.
3. **Coverage separation:** the narrow CI evidence must be completed and artifacts reviewed; still require independent real device, PWA/corrupt save, browser WebKit/native Safari and Keep/Revert/hostile combat acceptance. Any skipped evidence remains an explicit open gate.
4. **Release authorization:** PR #527 remains **draft**, no main merge, Pages deployment, graphics-default switch or Pixi graduation without explicit owner direction. Rollback of this candidate is removing the Phase 2 opt-in title preparer and associated metrics while leaving the existing Canvas ground draw path intact; retain or revert Phase 1 telemetry according to owner review.

### Results / receipt register

- **Known source-only baseline through Phase 5:** [CI #40513954357](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40513954357) passed 18 focused Node files and reproducible build at `9856d7e89b8000c290170d3f4140bfe8a38163e4`; this is not a browser or physical-device result.
- **Phase 6 actual-browser run:** [CI #40516601405](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40516601405), code at `d09c716ea0cde4730bbf6b1990c7d78a259594c7` — **pending final run/results review at authoring**. Update the PR acceptance state from the actual job conclusions and artifacts, not from this ledger's existence.
- **Physical Chromebook / phone / desktop trials:** **NOT RUN**.
- **Owner release approval:** **NOT GIVEN**.

**Decision:** Phase 6 has a reproducible real-browser acceptance mechanism, but final release/physical-device acceptance remains **OPEN**. No incremental feature or new runtime cache is proposed without device-backed benefit and visual equivalence.
