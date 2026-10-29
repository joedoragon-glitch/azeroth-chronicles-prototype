# Four-domain combat performance audit — dev.224 source baseline (29 October 2026)

**Scope:** This is an engineering-only audit of *So I Became the Dark Lord's Problem*. No combat, movement, graphical or save behavior changes are made by this branch. It follows merged [ordinary enemy-pursuit PR #610](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/610).

**Reproduction:** `tests/combat-four-domain-workload-audit.test.cjs`, run on [PR #612](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/612), uses real `Campaign.tick(0.05)` collision/projectiles, fixed enemy fixtures and opt-in test-only method wrappers. Existing `blocked()`, `follow()`, `route()`, `tacticalRogueOutnumbered()`, projectile-hit authority and renderer are not mocked or rewritten. `blocked()` counts are native probes, **not hardware frames per second (FPS)**. Method timings are inclusive and overlap, so cannot be summed as independent CPU time.

## A. Boss and captain navigation

With a genuine native obstruction and 120 manual `follow()` advances, one ordinary engaged enemy used the bounded planning route (peak **518** `blocked()` probes per update; 127.1 units progressed). With an identically positioned captain or boss, legacy synchronous `route()` was invoked twice, reached **1,587 probes in one update** and progressed the *same 127.1 units* over the same 120 advances. Captains and bosses retain authored patrol/attack/telegraph decisions not simulated by this isolated movement fixture.

**Judgment:** a measurable unbounded route cost remains, but a real boss/captain encounter simulation and phase-specific recovery acceptance must precede moving these actors into incremental planning. It would be unsafe to infer that a generic 120-call follow comparison certifies the special-attack state machine. Keep this a separate engineering workstream.

## B. Repeated tactical roster assessments

Actual 24-update crowds of 8 / 24 / 48 engaged actors called `tacticalPresentOpponents()` **576 / 1,728 / 3,456 times** and `tacticalLocalSupport()` **192 / 576 / 1,152 times**, respectively. The 48-enemy scene ran `activeLivingParty()` **5,871** times. `tacticalPresentOpponents()` and `tacticalLocalSupport()` allocate filtered arrays, and `tacticalRogueOutnumbered()` repeats the same presence computation twice. These are frequent CPU-side allocations/scans, even though they do not themselves trigger terrain collision probes.

**Isolated follow-up:** [draft PR #614](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/614) is a proposed dev.225 micro-optimization: direct count instead of allocating arrays and one presence check per outnumbered decision. No stale per-update cache or behavioral shortcut. Test exact predicate parity under immediate HP/order/Recall/regroup changes and real 8/24/48-actor `snapshot()` parity before merge. Worst-case algorithmic complexity remains quadratic with crowd size; do not claim an FPS improvement without hardware evidence.

## C. Projectile-heavy combat

Same 24-update obstructed, 24-enemy/5-ally encounter, fixed hostile initial shots:

| Shots seeded | Total native terrain probes, entire encounter | Total probes from `updateProjectiles()` | Peak projectile-update probes | Peak entire simulation update |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 26,412 | 0 | 0 | 1,454 |
| 24 | 27,915 | 1,503 | 283 | 1,737 |
| 96 | 31,901 | 5,489 | 1,042 | 2,496 |

The `updateProjectiles()` cost grows with projectile count and includes `fortShotClear()` sampling, authoritative terrain interception, collision refinement on actual obstacles and per-shot actor target checks. `fortShotClear()` executed **292** and **1,033** times with 24 and 96 initial shots, respectively. Do not remove swept collision, impact fraction/refinement, deflection, Royal Prerogative or projectile launch/impact receipts merely to reduce counts. A candidate must first prove precise wall impact, projectile ordering, hit and dodge parity at high density.

## D. Renderer: Canvas 2D and PixiJS WebGL

Source inspection confirms `src/prototype/renderer.js::draw()` samples phase timings **once per 12 permitted draws** and exposes `metrics().phases`, alongside developer-only effect diagnostics. Canvas `renderLayer='overlay'` still draws critical warnings, nameplates, live projectiles and combat effects even when the world uses PixiJS. `src/prototype/pixi-experimental.js::draw()` synchronizes viewport, resolution, background, actors and atmosphere, then invokes `scene.draw()`. Existing browser/renderer infrastructure includes `scripts/perf-ws2-renderer-performance.cjs`, but this frozen Canvas benchmark **is not live-play FPS** and requires a separate baseline root and browser runner. `tests/pixi-fidelity.test.cjs`, `tests/effect-diagnostics.test.cjs` and `tests/pixi-step2-contract.test.cjs` protect presentation behavior, not GPU time.

**Judgment:** no reliable CPU/GPU bottleneck ranking can be made from Node simulation alone. A matched browser capture should collect simulation time, Canvas overlay time, Pixi scene time, draw calls/texture cache use, frame drops and context recovery across the same 24/48-actor and projectile scenes; real phone/Chromebook validation remains a separate acceptance gate. Do not regress warnings or turn off important combat readability to raise FPS.

## Priorities and release boundaries

1. Test isolated tactical roster allocation removal (#614), because exact-predicate and save-snapshot parity can be proven without gameplay redesign.
2. Build real boss/captain encounter scenarios before proposing an incremental route replacement; verify phase warning, pursuit reach, leashes and reset.
3. Profile collision-heavy projectile traces/impact receipts at 24/96 shots; optimize only independently verifiable redundant work.
4. Use the existing browser/diagnostic profiler for Canvas and Pixi comparison; Node CI is only source/logic evidence.

**Publication status:** This audit changes no playable code. #614 is a draft candidate, **not merged or device-verified**. Do not describe any of the four workstreams as universally optimized or live without separate exact-head checks, merge, Pages deployment and physical-device evidence.
