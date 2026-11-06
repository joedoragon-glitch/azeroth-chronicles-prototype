# P0 — PC performance-first playtest program (6 November 2026)

**Status:** owner-approved **priority and plan**, NOT a runtime implementation, measured improvement, acceptance certificate, or authorization to publish.  
**Primary tracking:** [Issue #839](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/839).  
**Game:** *So I Became the Dark Lord's Problem* (historical repository name `azeroth-chronicles-prototype`). This is a browser/JavaScript/PixiJS + Canvas game, **not** a Unity project.  
**Source-inspection checkpoint:** `main@272330b8c472446ad4d0b5bcf5027589f200c8d6`, package `0.9.1+snapshot.dev.263`. **Do not confuse repository head/version with the installed test-device build**; recheck both at execution time.  
**Immediate next action:** conduct **Phase 1 in a separate owner-authorized chat**. No testing has been run for this new phase by the act of preparing this document.

## Authority and priority change

The owner directs that **PC playability and performance evidence are P0, ahead of all earlier discretionary development priorities**. Existing art/world expansion, feature additions, new content, controls/input experiments, mobile-specific work, unrelated fixes, separate game ideas and general polish are **paused/deferred**, not cancelled, deleted or reclassified as defects. Preserve historical decisions, open issues, branches and verified results; do not silently reopen them. Existing critical stability, save integrity, security, regression and release constraints remain applicable.

The program's purpose is to obtain a credible measurable route to making the **existing full campaign playable on a low-spec tester's desktop/laptop**, without weakening combat/companion/enemy AI, game mechanics, fairness, save compatibility or progression. The tester reports being able to play an early area but encountering severe stutter/full freeze in a subsequent area. Their exact CPU, RAM, GPU, browser, OS and game-build versions are **not independently established** (any old i3/8-GiB description is speculative).

**Provisional user-experience target:** about **20 FPS reasonably stable**, tolerable intermittent dips, responsive inputs and no persistent freeze, subject to evidence about the actual hardware. This is **not** a promise of 20 FPS or a claim that the existing FPS telemetry measures compositor-presented FPS.

**Program exclusions:** no new content, changed controls, mobile work/phone hardware optimization, new games, gameplay redesign, visual downgrades, arbitrary AI simplification, broad bug sweep or speculative FPS tweaks. Later **only** genuine campaign-progression blockers and severe combat-balance defects making progress unfair may be considered alongside performance work, with evidence and appropriate authorization. New game collaborations require separate future assessment and mutual commitment; none are approved here.

**Authorization boundary:** this record authorizes documentation of priorities and handoff. It **does not** authorize altering runtime, requesting immediate tester chores, running a broad/full test matrix, merging, publishing or deploying. Normal focused tests may be run **when the owner opens Phase 1**. Main-branch commits automatically trigger Pages workflows/PWA cache fingerprints; staging a documentation PR is not permission to merge it.

## Existing measurement inventory (verified by source inspection, not newly executed)

**Player path:** Desktop game → **Game and settings → Screen and performance → Export playtest report** (Spanish: **Juego y ajustes → Pantalla y rendimiento → Exportar informe de prueba**, wording may vary by menu context). Choose **Show performance details / Mostrar detalles de rendimiento** for optional **Start / Stop renderer profiling** and **Start / Stop navigation profiling**; the normal JSON export does not require enabling those optional recorders. The export is local file `Azeroth_Playtest_Report.json`; **it is not a save backup and nothing is auto-uploaded**.

| Capability | Current source location / known limits |
| --- | --- |
| JSON construction and downloaded filename | `src/prototype/app.js`, `exportPlaytestReport()` / `exportJSON()` |
| Device/environment & effective settings | `performance.environment`, `graphicsRenderer`, `frameRatePreference`, `frameRateTarget`, `frameSkip`, `renderResolution`, `optimizationMode`, `devicePixelRatio`, backing canvas info; optional memory API data may be null |
| Rolling stages | `src/prototype/runtime.js` `createFrameProfile()`: up to **180 active callbacks**, stage mean/p95 with distinct sample counts; e.g. total simulation, nested party/enemy AI, renderer, Pixi, Canvas overlay/full world, callback interval |
| Automatic slowdown evidence | `performance.frameProfile.slowdownIncidents`: up to **16 exceptional callbacks**, currently triggered by >=50 ms synchronous work, >=120 ms callback interval or emergency entry; bounded current/prior timing and in-game region/nearby context, not GPS |
| Opt-in renderer profiling | `performance.rendererDiagnostics`: bounded costly-render/scene/cache evidence and relevant transitions; should be **off during ordinary play** and enabled only for an identified reproduction |
| Continuity | `performance.diagnosticContinuity`: bounded prior-document/frame records across some menu, background and restart transitions, **not guaranteed survival of a hard OS/browser freeze** |
| Optional navigation/crowd profiling | `performance.crowdDiagnostics`, only when started, up to 120 active simulation ticks; do not require it for first baseline unless evidence points to movement/navigation |
| Party/combat observation | `partyDiagnostics`, hero/statistics and limited combat context; does not provide independent per-actor CPU attribution |

**Interpretation safeguards:** `frameProfile.callbackFps` counts callback opportunities (during emergency holds, not necessarily completed game ticks); `displayedFps` counts **issued draws**, not verified monitor presentation. `simulationMs` includes nested `companionAIMs` and `enemyAIMs`; **never sum their p95s** as if exclusive. Rendering calls are synchronous CPU timing, not GPU completion. A 120-ms callback gap can be browser scheduling, not a proven slow game function. Automatic graphics changes can modify sample windows; exceptional incidents have separate retention. Settings → **Reset performance sample** clears incident evidence; do not press it before export. A total freeze may prevent the final report from being saved.

**Already-existing relevant checks (inspect/execute only as appropriate):**
- `tests/performance-report-diagnostics.test.cjs` — report download, bilingual UI, active/stop/clear recording, prior-session continuity and exceptional callbacks.
- `tests/frame-profile.test.cjs` — bounded sample semantics, overlapping timing stages, exceptional records and Pixi/Canvas splits.
- `tests/party-playtest-diagnostics.test.cjs` — party-related report fields.
- `tests/frame-rate.test.cjs`, `tests/frame-skip.test.cjs`, `tests/auto-fps-adaptive-coupling.test.cjs` — cadence/skip behavior and consistency.
- `tests/performance-default-upgrade.test.cjs` — inherited device preferences; initial settings may differ from what the tester assumes.
- If evidence demands it, inspect focused browser tests and existing release receipts; do **not** run comprehensive CI, full-browser matrices or unrelated workflows by default.

## Phase plan and gates

### Phase 1 — Instrumentation readiness (NEXT CHAT; no optimization)
1. Reconfirm exact current `main` HEAD, package and published `build.txt`, and distinguish deployed/installed tester version. Review `AGENTS.md`, `docs/DEVELOPMENT_STATE.md` and existing performance issue routing before invoking any tests.
2. Trace from the **real** UI export action to `exportPlaytestReport` and downstream `runtime.report` / `frameProfile.report`. Check desktop/Spanish navigation, file download semantics, report shape, renderer active/fallback status, sample reset behavior, start/stop profiling and continuity. Verify the game can produce the data needed from both early/playable and late/frozen areas.
3. Run the **smallest sufficient targeted Node tests** (starting with the two core tests above); expand to frame-rate/skip/party/continuity tests only for uncovered critical risk. Record commands, outputs, failures and **exact tested SHA**. Use an isolated work branch if repair is necessary. Automated CI/pass in another commit is not proof the current code was just tested.
4. Assess real-world limits: a fully hung page cannot export; optional profiling itself has overhead; no compositor FPS; no remote telemetry; recorded data may be lost after hard shutdown. Check whether *existing* pre-transition export and continuity support suffice before proposing instrumentation.
5. End with a short evidence-backed **PASS / HOLD** readiness decision, validated report schema and path, exact English/Spanish player directions, known blind spots, and a compact **Spanish two-area test protocol**. If HOLD, recommend the minimum **diagnostics-only** repair—do not silently modify gameplay, merge or publish.
6. **Do not yet send a testing assignment to the tester.** Only after Phase 1 readiness and a separate owner decision should real-device tests be requested.

### Phase 2 — Paired baseline on target PC (later authorization)
After Phase 1, tester runs **A (playable first world/area)** and **B (problematic second world/area)** on the **same PC**, ideally same browser/build/settings/class/save, with comparable test durations and explicit scene changes. Gather build/version and effective graphics settings (prefer automatically captured JSON), and where essential minimal hardware/browser facts. Warm up representative gameplay before taking a sample; explicitly note cold loading vs warm active play. On each area, gather at least one standard report while game responds. For B, activate optional renderer profiling before reproduction if appropriate, stop/export if the UI remains functional. **Don't require the tester to understand profiler internals.**

Ask for two clearly named reports (`Area_A_playable.json` and `Area_B_slow.json`, renamed without editing JSON) and **one or two sentences** describing class, action/movement/encounter, duration and when freezing started. Repeats only when necessary and feasible. In any public GitHub issue, share **sanitized aggregates** only; reports include hero state, stats, user agent and device/context data.

### Phase 3 — Freeze and recovery evidence (later authorization)
If B becomes unresponsive, use a pre-transition/pre-freeze report when possible; after restart, inspect available continuity records and verify installed version. Distinguish failure to export from lack of a performance problem. A short video or observation is fallback evidence; don't promise exact cause from a vanished final frame. Avoid save-loss risk; preserve current v4 campaigns and request a separate backup only if truly needed and with consent. Test whether changes to settings/caches/graphics produce reliable improvement **without compromising the matched baseline**.

### Phase 4 — Diagnosis and controlled reproduction (later authorization)
Compare A/B within the same release, frame profile/stages, incident geography/workloads, Pixi vs Canvas, resolution, Auto FPS/skip/optimization, combat counts, companion/pathfinding and browser scheduling. Reuse owning issues and classify **measured result / plausible hypothesis / unknown**. Prioritize reproducible work with highest expected benefit while keeping the full game intact. Compare identical workloads in matched conditions; a synthetic benchmark cannot replace the tester's device outcome.

### Phase 5 — Measured optimization and campaign acceptance (later authorization)
Make only small, reversible changes with before/after evidence and focused regressions for enemy/companion AI, targeting, movement, combat, saves, visuals, major events and progression. Reject changes that sacrifice core behavior or merely mask stutters by skipping simulation. Retest same A/B on target PC, evaluate actual responsiveness and the provisional ~20-FPS target, then have tester attempt to complete the available campaign with their preferred class. Fix later *proven* hard progression blockers/critical unfairness under the agreed exception; no broad new scope.

## Next-chat Phase 1 start prompt

> Continue *So I Became the Dark Lord's Problem* P0 performance-first work from GitHub issue #839 and `docs/PERFORMANCE_FIRST_PLAYTEST_PROGRAM_20261106.md` (staged documentation PR if not merged). Execute **Phase 1 only**: inspect current main/installed-release boundaries, trace and validate the existing playtest-report pipeline, run narrowly focused tests at exact SHA, check automatic slowdown evidence and optional renderer/continuity collection, report PASS/HOLD and blind spots, and prepare concise Spanish A/B tester instructions **without sending them yet**. Do not change game mechanics, optimize, request real-device tests, run full CI, merge or deploy. Handle routine scoped diagnostics verification independently and document findings back in GitHub.

## Resume discipline

Write Phase 1 results back to [issue #839](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/839) or this handoff in a separately authorized edit, including SHA, commands, evidence, unknowns, and next owner action. Reconcile current project governance before updating files. Previous priorities remain historically valid but **not currently active**. A new chat must not use old unmerged PR status or stale 'current' documents as if they were a live release.
