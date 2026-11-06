> **6 November 2026 live integration and Phase 1 experiment checkpoint.** The owner approved a controlled Pixi-first quality experiment after private Vale exploration/combat/boss reports (28)–(30). The previous renderer-diagnostics PR #842 merged as dev.265 at `b099b490caf7fa17ddf1507bcfa245dfc948b231`; build-provenance PR #840 subsequently merged into `main` at `077e0942102c048053ca7ad7e17f7eb4f4ae37ac`. This is **GitHub merge evidence**, not verification of which SHA the owner's installed browser/PWA loaded. Historical material below remains dated, not current deployment status.


## Approved controlled experiment — Pixi fixed quality (draft, NOT published)

**Observation:** Owner's Chromebook handled exploration of the same Vale terrain acceptably, then suffered severe deterioration during combat. Report (29) recorded an Auto optimization backing-ratio change (1.502→1.0) followed by 123 procedural re-bakes and ~1.8 s stall; a second adaptive ratio change (1.0→0.75) preceded another 125 re-bakes and ~1.6 s raster stall. A separate actor render exception later triggered Canvas fallback. The reports do not identify the first combat bottleneck or prove that quality adaptation caused the exception.

**Phase 1 candidate:** In the active, successfully initialized PixiJS/WebGL2 game, temporarily suppress *automatic* Optimization Mode escalation (including its emergency graphics override) and adaptive-resolution ratio changes. Initial/manually selected rendering resolution, manually chosen settings, existing FPS limiter, adaptive frame skips and emergency simulation protection remain unchanged. In actual Canvas mode, legacy adaptation continues, so fallback after a real Pixi failure is not compromised. Player-chosen Canvas, retained renderer recovery guards, AI, combat, effects, saving and graphics assets are untouched. A tiny pure policy helper makes the active-renderer condition testable.

**Test hypothesis:** Removing Pixi's dynamic quality switches eliminates the recorded resolution-change re-bake bursts and makes it possible to isolate the earlier combat workload. This is not a proven gameplay-performance fix, and longer combat, boss and campaign acceptance are still required. On test candidate, inspect active renderer, buildCommit, backing ratio and exceptional slow callbacks; do not count issued 20 draws as monitor-confirmed FPS.

**Phase 2 pending:** Focused regression and explicit owner-authorized Chromebook candidate testing; trace independent combat simulation/texture exceptions if stalls remain.

**Phase 3 pending:** If experiment confirms the benefit, separately simplify the menu to Auto/20/60 FPS and retire or replace the legacy optimization controls with Pixi-specific safe policy. Do not merge/deploy the experiment, remove Canvas failure backup, or claim campaign acceptance without further owner approval.

# P0 — PC performance-first playtest program (6 November 2026)

## Owner's developer-learning objective — 6 November 2026

**Teaching is a deliverable alongside engineering.** The owner wants to learn the vocabulary and reasoning of software development by working on this game. **Do not remove real developer terminology in the name of accessibility.** Use accurate terms such as *commit*, *branch*, *pull request (PR)*, *CI*, *deployment*, *renderer*, *fallback*, *regression test*, *build SHA*, *bottleneck* and *p95*; introduce an unfamiliar term with a short, concrete explanation as it becomes relevant to the work. Explain what the code or test does, why it matters, what the evidence does and does not prove, and the trade-offs behind a decision. Reuse established terms rather than repeating a beginner glossary every turn. Offer more technical depth, source paths or brief code examples when the owner asks or when they materially illuminate a decision. Avoid dense jargon dumps and permanent oversimplification, as well as unsolicited courses or quizzes.

**Keep execution ownership with the assistant:** technical learning must not become unnecessary homework. Investigate source, maintain GitHub, run authorized focused validation and explain the engineering as part of the results. Treat the owner as a capable collaborator building fluency in developer conversations, not as a passive recipient of simplified status labels.

## Latest owner-confirmed device, acceptance target and safe-documentation policy — 6 November 2026

**Authoritative device correction:** The owner's actual, personally accessible primary test device is an **ASUS Chromebook Plus CX5403CM notebook, model CX5403CMA-DB588, Intel Core Ultra 5, 8 GB RAM, Chrome desktop on ChromeOS**. The older Issue #841 hardware line claiming “Intel Core m5” was a **transcription/misspeaking error**, corrected by the owner. Do not treat it as another Chromebook or request the model again.

**Current primary success goal:** Achieve **stable approximately 20 FPS throughout the existing game on this owner's Chromebook**, **regardless of region or ordinary gameplay activity**—including full regions, movement, towns, interiors, dense enemies, companion activity, combat, bosses, day/night and sustained play—with acceptable occasional short dips, responsive input and no lasting freezes. This target is an explicit owner requirement, not merely a hypothetical example or a confirmed attained FPS result. Test the full range of demanding scenes; the three idle starting-town reports alone cannot establish this outcome. Preserve game mechanics, enemy and companion AI, combat fairness, graphics, saves and progression. The colleague's lower-end PC is **later**; its hardware is currently unknown and must not drive the immediate work or be solicited before the owner's next decision.

**Documentation authorization now clarified:** The owner allows GitHub documentation/status updates as normal independent project work **provided those changes do not publish, refresh or require download of a player game/PWA build**. Permitted safe surfaces include existing GitHub issues/comments and edits on an **unmerged draft branch**, with clear status. **Do not merge a docs-only PR or push directly to `main` under this authorization**, because this repository's successful main branch builds can publish Pages and a new release-SHA-stamped PWA even for a documentation-only commit. Runtime edits, merges, player deployment, broad suites and external tester outreach remain separately gated.

**Priority order:** Resolve/document #841 Pixi/WebGL2 versus Canvas2D startup/fallback on the owner's Chromebook first, verify build-identifiable exports when separately released, then assess representative **whole-campaign** performance on that same machine. Only later consider the colleague's machine. This updated owner directive supersedes older portions of the five-phase plan that assume the colleague's PC is the immediate test target; preserve the original phase methods as historical planning.


**Status:** owner-approved **priority and plan**, NOT a runtime implementation, measured improvement, acceptance certificate, or authorization to publish.  
**Primary tracking:** [Issue #839](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/839).  
**Game:** *So I Became the Dark Lord's Problem* (historical repository name `azeroth-chronicles-prototype`). This is a browser/JavaScript/PixiJS + Canvas game, **not** a Unity project.  
**Source-inspection checkpoint:** `main@272330b8c472446ad4d0b5bcf5027589f200c8d6`, package `0.9.1+snapshot.dev.263`. **Do not confuse repository head/version with the installed test-device build**; recheck both at execution time.  
**Latest next action:** Phase 1 candidate tested; await separate owner authorization to merge/publish the diagnostics-only build provenance patch, verify the installed release SHA, then begin the prepared paired Phase 2 baseline. The original preparation and historical Phase 1 HOLD below remain as audit evidence.

## Latest Phase 1 follow-up — 6 November 2026 (supersedes original HOLD, NOT released)

The owner confirms the existing playtest JSON **already downloads repeatedly in their actual browser**, so the earlier lack of a fresh native download smoke is an **owner-confirmed working path**, not a remaining reason to block this narrowly requested change. Historical Phase 1 testing did not make a real-browser download claim; the owner supplies that independent observation.

Draft PR #840 now adds top-level `buildCommit`: the **exact full SHA of the loaded packaged game**, alongside the existing `version`, so that two reports with the same human-readable dev.263 version can still be distinguished by true release. `scripts/pwa-release-id.cjs` stamps the same immutable SHA as `build.txt` into the deployed `src/prototype/build-info.js` and updates its offline-cache content fingerprint. A source checkout without packaging intentionally says `buildCommit: null`, never a false known release. This has no effect on gameplay, AI, frames, performance, save data, controls or report downloading itself.

**Evidence / Phase 1 candidate PASS:**
- **Source baseline:** unchanged `main@272330b8c472446ad4d0b5bcf5027589f200c8d6` / package dev.263. **Draft code candidate:** `114b154a8f4afc4cca6b2ea12e303d79045e4bd9`, unmerged and unshipped.
- [Exact focused PR run #42220906472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42220906472), GitHub Actions virtual merge tested `3b584d43a488bbb0f47741f634c666f00bac7907`: **SUCCESS**, nine narrowed diagnostics tests PASS (bilingual report field and real packaged/offline release matching included), eleven impacted focused files PASS, reproducible offline-ready build PASS, Pages publication **SKIPPED**.
- [Focused browser PWA update acceptance #42220907035](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42220907035): **SUCCESS**, no deployment. [Focused menu acceptance #42220906647](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42220906647): **SUCCESS**. Neither establishes the tester's FPS.
- No tester contact, raw JSON publication, full test matrix, optimization, balance changes, campaign/AI/save changes, merge or deployment.

**Status split:** Phase 1 diagnostics *candidate engineering* **PASS**; installed/released version not yet changed, so **release and Phase 2 tester solicitation remain HOLD** until a separate owner-approved publication and verification of the game loaded on the tester's device. The existing Spanish two-area protocol is prepared but unsent.

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


---

## Phase 1 execution audit — 6 November 2026 (new; source/test-backed)

**Verdict: HOLD for soliciting Phase 2 PC reports; instrumentation smoke tests PASS.** This is a provenance-and-native-browser verification gate, **not** a gameplay defect, FPS benchmark, optimization authorization or reason to change the existing AI. The automatic JSON pipeline works under the production-shell EN/ES harness; no actual Chromebook/desktop browser download was witnessed in this phase. Source/main stays `272330b8c472446ad4d0b5bcf5027589f200c8d6`, package `0.9.1+snapshot.dev.263`; only the unmerged draft #840 received a *test-only* scoped runner and this documentation.

### Focused execution receipt

- **Test-only branch commit:** `23b2d1ee406b1b34d4f6df8febab6a0bde5b2a3a` (adds `tests/performance-phase1-readiness.test.cjs`). **Exact Actions checkout/tested merge commit:** `ab044afe82d869e515535e606e0660d549200144` against unmodified `main@272330b8...`.
- **CI:** [PR focused run 42218333265](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42218333265), Ubuntu runner, Node 22, **SUCCESS**. Log shows `Focused: tests/performance-phase1-readiness.test.cjs`; the helper launched **all eight** existing unchanged tests as separate Node subprocesses and asserts no failures. The focused CI selector correctly identifies **one new runner file**; do not misreport that as only one underlying functional test.
- **All eight PASS:** `performance-report-diagnostics.test.cjs` (EN/ES export, stopped/active/cleared renderer capture and tab/title/restart continuity); `frame-profile.test.cjs` (180 callback window, 16 incidents, splits/gaps and reset semantics); `party-playtest-diagnostics.test.cjs`; `crowd-diagnostics.test.cjs`; `frame-rate.test.cjs`; `frame-skip.test.cjs`; `auto-fps-adaptive-coupling.test.cjs`; `performance-default-upgrade.test.cjs`.
- Exact PR run also passed game/documentation consistency and offline-ready build. **Publish step SKIPPED on pull request. No full suite, mobile matrix, merge or deployment.** Existing exact-main [run 42105321988](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42105321988) passed focused check and Pages deploy, but neither a direct hosted `build.txt` fetch nor installed-device uptake was verified here.

### Source-backed report/collection matrix

| Required evidence | Actual source and export path | Phase 1 observation / interpretation |
| --- | --- | --- |
| EN/ES menu and local JSON | `app.js` `platformMenu` > `exportPlaytestReport` > `exportJSON` / `exportSaveText`; `Blob(application/json)`, object URL and `a.download='Azeroth_Playtest_Report.json'` | **Production-shell PASS** for both languages and parsed JSON. The code requests a browser download; actual save completion/file-system persistence is not acknowledged or native-browser-tested. |
| Version and report identity | `report.version = PrototypeBuild.version`; generated `build-info.js` contains **version only**, whereas `scripts/build.cjs` separately writes SHA to packaged `build.txt` | **GAP / Phase 2 HOLD:** no exact loaded commit/release fingerprint in exported JSON. Identical dev.263 strings do not guarantee identical installed/cached releases. |
| Environment, graphics and effective settings | `performance.environment` (UA, logical CPUs, optional memory, viewport), `graphicsRenderer.activeRenderer` / mode / Pixi fallback, `frameRatePreference/Target`, `frameSkip`, `renderResolution`, `optimizationMode/Preference`, DPR and canvas backing | Source present, JSON export path traced, tested for renderer object; memory may be null, browser/GPU metadata incomplete. Verify installed renderer status and settings in Phase 2 before comparing. |
| Automatic rolling callback/stage measurements | `runtime.js:createFrameProfile`; `performance.frameProfile` (180 callbacks max, per-stage samples/mean/p95, `callbackFps`, `displayedFps`, drawn count, adaptive skips) plus `runtime.report` | **PASS** artificial timing tests. Callback opportunities are not simulation-tick count; issued draws are not monitor-presented FPS. `simulationMs` includes party/enemy AI; separate p95s do **not** add. `pixiMs`, `canvasOverlayMs` and `canvasWorldMs` are synchronous CPU call times only, and their sample populations differ. |
| Slowdown evidence automatically present without recording | `performance.frameProfile.slowdownIncidents`: >=50 ms synchronous work, >=120 ms callback interval, or emergency entry; 16 retained records + dropped count; current/preceding stage summaries and zone/grid/nearby enemy context | **PASS**: automatic on normal export, retained across automatic sampling resets. Callback gaps can be OS/browser scheduling. Manual **Reset performance sample** explicitly removes incidents. No fully frozen terminal frame is guaranteed. |
| Optional renderer profiling | `performance.rendererDiagnostics`: `not-recorded` / `recording` / `stopped`; worst 32, 48 transitions, histograms, approximate quantiles, renderer/cache/backing changes and counter reset markers | **PASS** for EN/ES starts/stops/clears, interruption and resize/emergency chronology. Extra overhead; use only after a standard baseline identifies need. Tests use the production-shell fake graphics, **not actual Pixi GPU completion**. |
| Continuity and freeze survival | `performance.diagnosticContinuity`, local `sibdlp-playtest-diagnostics-v1` journal; max 48 events, three prior frame windows/renderer segments, 12-second active-play checkpoints, 130k-character best-effort storage cap | **PASS** simulated hidden/continue/title/reload and no save modification. **LIMITATION:** last uncheckpointed frames, failed localStorage, browser discard, GPU or OS process kill may lose the terminal evidence. Recovered clocks must not be joined as one uninterrupted sample. |
| Optional navigation and party context | `performance.crowdDiagnostics` opt-in 120 simulation ticks; top-level `partyDiagnostics`, `hero`, `statistics`; incidents include location/nearby kind | **PASS** focused navigation and party tests; no independent per-actor CPU attribution. Standard report includes potentially sensitive game and UA metadata; keep raw JSON private. |

### Why Phase 2 remains on HOLD despite passing tests

1. **Comparable build fingerprint is not self-contained.** Exported JSON records only `PrototypeBuild.version`; the separately generated `build.txt` uses the SHA but the report does not include that identifier. With dev.263 reused across published commits and caches, Phase 2 cannot defensibly claim two sessions used the same loaded game solely from their JSON. Minimal **diagnostics-only** candidate: inject packaged immutable build SHA/build ID into the runtime build metadata and `performance` JSON (no gameplay/save changes), and assert it in the bilingual export test.
2. **Native desktop download proof absent.** Automated EN/ES harness intercepts the Blob and parses JSON but does not exercise Chromium's real download/file persistence from the published/installed build. Minimal focused **single desktop Chromium** download smoke, including filename, valid JSON, and standard export without opt-in profiling. No broad/browser/mobile matrix.
3. **Hard hangs remain fundamentally partially unobservable.** Best-effort local checkpoints every 12s and the prior-frame bounded history mitigate but cannot prove final CPU/GPU/browser scheduling during full process freeze. This is a known Phase 3 limitation, **not** a justification to weaken game behavior or add unapproved telemetry.

No direct hardware FPS/compositor evidence, GPU completion time, usable-input certification, or hard-freeze recovery claim was produced. Neither the success of these unit tests nor existing Pages CI authorizes tester contact or publication.

### Spanish Phase 2 tester script — prepared, NOT SENT

> Necesitamos comparar dos zonas en la **misma computadora y navegador**, con la **misma versión instalada, personaje y ajustes**, sin cerrar ni actualizar el juego entre ambas. Primero juega unos minutos en la zona A (la que funciona) y luego en la zona B (donde se pone lento). Mientras el juego aún responda, entra en **Juego y ajustes → Pantalla y rendimiento → Exportar informe de prueba**. Guarda los archivos como `Area_A_playable.json` y `Area_B_slow.json`, **sin modificar su contenido**, y acompáñalos con una o dos frases indicando la clase, qué estabas haciendo y cuándo comenzó el problema. Si la zona B se congela por completo y no permite exportar, no borres las muestras ni arriesgues tu partida; anota lo ocurrido. **Estas instrucciones quedan en borrador hasta cerrar el HOLD de Fase 1 y recibir autorización del propietario.**

**Next authorized work (still Phase 1, not Phase 2):** close the two narrow diagnostics/provenance gates on a draft-only branch, rerun exactly focused tests including a real desktop Chromium download, document exact source/CI/loaded-build evidence, then reassess PASS/HOLD. Do not merge, deploy, solicit tester reports, optimize or modify AI.
