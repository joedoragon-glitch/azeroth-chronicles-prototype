# Azeroth Chronicles — GitHub-only continuation and Stage 5 entrypoint

**Date:** 25 October 2026  
**Repository:** [joedoragon-glitch/azeroth-chronicles-prototype](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype)  
**Workstream:** effect visibility, performance-safe instrumentation and presentation correction  
**Single candidate PR:** [#471 — opt-in developer diagnostics, verified visibility and bounded corrections](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471)  
**Branch:** `feature/dev-effect-tracing-stage2-20261025`  
**Verified Stage 4 source head, before this handoff:** `d4f2ae2f4b203e1161eb4c83eed18bd5274872cb`  
**Pinned main/base as of handoff:** `e3c78266b28f3325d2afdcb76ae849fcff306deb`  
**State:** PR #471 open, **draft, unmerged, undeployed**. Stage 4 implemented; Stage 5 **automated browser and menu/export acceptance passed** on code/test commit `9782970d1af25261b6b5386759ac5d28c780dcc0` ([run 40222498065](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40222498065), 24 focused suites). **Actual-device/thermal performance acceptance and owner release approval are still NOT granted.** This handoff was originally committed before Stage 5 began and was refreshed afterward with the completed automated evidence.

> **New-chat instruction:** This file and linked repository documents are the durable source of truth. Do not rely on previous conversation context, local attachments or a remembered model summary. Fetch **current GitHub state first**, including the latest main SHA, PR #471 head/diff, checks, any ongoing related PRs, then reconcile this handoff with the live repository before acting.

## 1. Operating requirements — nonnegotiable

1. Azeroth Chronicles is a **multi-file GitHub Pages/PWA**. Separate JS/CSS/images/audio/data/assets are fully supported. Do **not** resurrect the old portable-single-HTML constraint; CI actively protects the multi-file architecture.
2. No changes to normal/Nightmare player gameplay through background collectors, timers, logging loops, pixel readbacks, polling, network diagnostics or saved-game telemetry. Developer effect recording must require **explicit manual Start**, be **off by default**, be in-memory and bounded, and reuse the existing playtest-report export.
3. Keep gameplay combat outcomes, projectile contacts/travel, cooldowns, damage, target eligibility, save semantics and FPS/adaptive-frame-skip policies unchanged. Preserve **40 transient effects, 3 status markers/enemy, 24 status-bearing enemies** until real evidence justifies an independently authorized policy change.
4. All work for this effects candidate stays **inside the existing draft PR #471**. Do not create a parallel PR, merge, publish, deploy or switch it out of draft without explicit owner authorization. Do not modify unrelated draft streams, especially PR #440 (Critical Executions), PR #449 (documentation/test governance), or other active combat/rendering PRs.
5. Do not assign owner/player homework merely to complete an automated test or repo audit. Run achievable headless/CI/source checks independently. Real-device acceptance and any release/merge decision are **gates**, not permission to infer hardware performance.
6. Preserve accurate proof labels: `painted` = a painter call, not verified nontransparent pixels; synthetic delay/pressure = controlled failure mechanism, not field frequency; native Canvas pixel evidence does not certify Pixi/WebGL/GPU completion or real devices.

## 2. Source-of-truth documents (read in this order)

- **This handoff** — standalone scope, chronology, exact version boundary, next actions and required gates.
- [Stage 2 recorder specification](EFFECT_DIAGNOSTICS_STAGE2_20261025.md) — opt-in Developer Mode recording, bounded report schema, export controls and no-player-background-work safeguards.
- [Stage 3 investigation/evidence](EFFECT_DIAGNOSTICS_STAGE3_FINDINGS_20261025.md) — real gameplay event→queue→Canvas-painter evidence, deliberately silent cast stages, observed limits, and clear synthetic-vs-natural caveats.
- [Stage 4 code changes and constraints](EFFECT_DIAGNOSTICS_STAGE4_FIXES_20261025.md) — first-paint grace, status ordering and overflow indicators, invariants, regression tests and release boundaries.
- [Stage 5 automated browser/UI acceptance and outstanding release gates](EFFECT_DIAGNOSTICS_STAGE5_ACCEPTANCE_20261025.md) — exact validated commit, passing CI, desktop/phone-emulated Chromium evidence, actual Developer Mode menu/export checks, held-target regression, and physical-device limitations.
- Source-level inventory generator [`scripts/enemy-vfx-inventory.cjs`](../scripts/enemy-vfx-inventory.cjs), its [regression test](../tests/enemy-vfx-inventory.test.cjs), and visual owner sources `src/prototype/hero-presentation.js`, `src/prototype/enemy-vfx-events.js`, `src/prototype/enemy-vfx-art.js`, `src/prototype/combat-visuals.js`, `src/prototype/renderer.js`, `src/prototype/party-pets.js`, `src/prototype/party.js`, `src/prototype/app.js`.
- [Focused PR CI workflow](../.github/workflows/focused-deploy.yml) and [focused test selection](../.github/scripts/focused-ci.cjs). Full/browser/production release checks are **not** implied by passing these focused checks.

### Stage 1 — read-only effect map (source-derived, not live visual certification)

The initial inventory traced **48 normal/charged hero skill forms (3 × 8 × 2)**, three automatic combo profiles, **22 pet skills across 11 families**, four named Soldier/Archer skills, **54 boss visual IDs, 21 captain attacks and five captain phases**, plus ordinary/night/Rogue projectile/contact/signature identities. The repository inventory script is the canonical programmatic source for enemy IDs (prior source audit counted 264 distinct IDs); recompute against the latest branch rather than trust stale counts. Persistent charge/warning/projectile/hazard/status visuals are direct game-state drawings, not necessarily entries in the short-lived effect queue. Mana Recovery can be intentionally disabled by rules; silent cast handoffs are not automatically defects.

### Stage 2 — opt-in developer-only effect recorder: implemented

- Developer-enabled Developer Mode campaign: **Game and settings → Screen and performance → Show performance details → Developer effect diagnostics**. Start/Stop/Clear explicitly; recording OFF initially.
- Existing **Save and game management → Export playtest report** downloads `Azeroth_Playtest_Report.json`; Developer Mode export includes `performance.effectDiagnostics` (receipts, attempted queue, overflow, filtered, expiredWithoutDraw, painter calls, FPS/adaptive gating, direct-state draws, last 120 callback timings).
- No separate export, background observer, network recorder, ordinary-player sampling or saved-campaign persistence. Report is bounded in RAM. Do not mistake painter attempts for alpha/pixel proof.
- Implementation `src/prototype/app.js`, `renderer.js`, `combat-visuals.js`, `enemy-vfx-art.js`; regression `tests/effect-diagnostics.test.cjs`.

### Stage 3 — source-backed automated natural evidence: completed

- 48/48 real successful hero casts produced receipts; **33** cast-stage painters produced nontransparent pixels while **15 deliberately silent NORMAL cast stages** rely on projectile/area/chain/displace/etc. See Stage 3 table before reporting a missing effect.
- 11/11 representative first boss attacks produced alpha-positive VFX; **28** real queued stages. All **22 pet skills** had genuine first/charged skill execution and alpha-positive pet artwork; all **four companion skills** resolved and Triple Shot spawned three moving arrows at 20/30/60 simulation steps/s.
- Synthetic withheld draws reproduced expiry before first paint on 0.22s cast cue; synthetic 100 hits+heal triggered queue budget 40 and 61 low-priority visual drops while retaining heal; stacked statuses / a 25th status-bearing enemy hid valid mechanics in the old painter. These are **controlled scenarios**, not hardware frequency/latency measurements.
- Source tests `tests/effect-diagnostics-stage3.test.cjs` and `tests/effect-diagnostics-stage3-party.test.cjs`; Stage 3 passing CI run [40219018261](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40219018261). These tests were **updated** by Stage 4 to assert corrected expectations.

### Stage 4 — constrained corrections: implemented and CI passing

- `src/prototype/renderer.js`: only selected essential visible hero cues gain up to **0.12s** simulated first-paint eligibility beyond their normal lifetime if never handed to a painter; no extra forced frames or indefinite late animation; intentionally blank cast stages excluded.
- `src/prototype/hero-presentation.js`: Silence/Taunt/Slow outrank older lower-priority status glyphs; **+N** occupies the third marker position when >3 statuses; late hero selected target/boss/captain can replace a lower-priority status-bearing enemy within **24** slots.
- No changed damage/cooldown/AI/projectile/hitbox/simulation; queue cap **40**; statuses max **3/24**; player diagnostics remain off.
- Focused validation [run 40221147441](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40221147441) for head `d4f2ae2...`: **20 relevant test files passed**, reproducible build/syntax passed; **Publish focused update skipped**. New `tests/effect-diagnostics-stage4.test.cjs`: 6 rescued first paints, 3 expected bounded expiries, no extra draws, deliberately silent cast unextended, normal mode recorder disabled. These tests are simulated/native Canvas, not physical-device performance claims.
- **Not fixed intentionally**: transient queue limit/priority policy beyond status selection, natural crowd-related transient drops without critical evidence, and unmeasured performance/visibility on physical devices.

### Stage 5 automated acceptance — completed, release blocked

- The same draft PR added `tests/effect-diagnostics-stage5-browser.test.cjs`, a **single explicitly scoped Chromium browser smoke**, and `tests/effect-diagnostics-stage5-shell.test.cjs`, a production-shell journey through the real Developer Mode Start/Stop/Clear menu and existing JSON export. A narrow focused-CI selector was added only for this one browser smoke; the expensive full/browser matrices remain owner-approved only.
- **Verified on code/test SHA `9782970d1af25261b6b5386759ac5d28c780dcc0`: 24/24 focused test files passed** ([run 40222498065](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40222498065)); reproducible/offline build passed; deployment skipped. Desktop and phone-sized *Chromium emulation* passed first-paint native-pixel checks in normal/reduced motion at 20/30/60 simulation-step schedules. These are not physical phone measurements.
- Stage 5 source review also corrected selected-target priority to honor a valid-zone manually held target (`manualHeroTargetId` / `manualHeroTargetZone`) without changing any combat rule; a 25th held target still displaces an ordinary status-bearing enemy within **24**, not 25, markers.
- **Release remains blocked:** actual hardware CPU/frame pacing, optional Pixi overlay/crowded gameplay, real touch/zoom/reduced-motion legibility, PWA compatibility and owner approval have not been certified. A full or manually approved test suite is not silently authorized by this automated run.

## 3. Stage 5 — next permitted independent work

**The owner authorized continuation if no manual help is necessary, but explicitly did not authorize a merge or deployment.** Do all safe read-only/repo/CI work before requesting a decision.

1. **Re-verify latest GitHub state**: main, PR #471 head/base/diff, checks, open related drafts and scope conflicts. Do not trust this date's SHA after new pushes.
2. **Pre-release code review** for normal-player CPU overhead and instrumentation isolation (a regular renderer should not instantiate the recorder or sample frames), visibility of developer menu/export, observer lifecycle, first-paint bounds and status prioritization (including late boss/selected target), branch/release packaging, deterministic save purity, and Canvas/Pixi overlay parity. Flag or fix **actual demonstrated** issues on PR #471 only; don't invent runtime performance measurements.
3. **Run focused regressions and reproducible builds**. If safely available, run a narrow **CI-only headless browser smoke** for Developer Mode UI/export and Canvas/Pixi overlays without deploying a game or modifying runtime player workloads. Existing browser suites include `tests/hero-skills-browser.test.cjs`, `tests/enemy-vfx-browser.test.cjs`, `tests/pixi-renderer-browser.test.cjs`; see repo and assess execution cost/availability first. Do not start a heavyweight unrestricted full-game/browser matrix automatically; repo owner policy reserves comprehensive certification for manual opt-in.
4. **Create a Stage 5 release-readiness record in GitHub**, including exact tested SHA and workflow URLs, pass/fail/unknown matrix, regressions or outstanding blockers, and a clean handoff for a separate future chat. A passing headless test proves neither natural play frequency nor physical hardware performance.
5. **STOP BEFORE RELEASE.** Physical-device visual acceptance (especially phone/Chromebook under crowded battle, Pixi/Canvas parity, zoom, reduced motion and device CPU overhead) and final owner approval are still required before merge/deploy. If no accessible device/test report exists, mark **not verified** and explicitly leave the gate open; do not assign the owner immediate homework or pretend this was performed.

## 4. Practical GitHub verification entrypoints

- PR state and files: `GET /repos/joedoragon-glitch/azeroth-chronicles-prototype/pulls/471` and `/pulls/471/files`.
- Current main: `GET /repos/joedoragon-glitch/azeroth-chronicles-prototype/branches/main`.
- PR current checks: `GET /repos/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs?branch=feature/dev-effect-tracing-stage2-20261025`, match **current head SHA**.
- Review `src/prototype/app.js` for menu and export; `src/prototype/renderer.js` for observer, queue/update/draw gate and grace; `src/prototype/hero-presentation.js` for status cap/priority; `tests/effect-diagnostics-*.test.cjs` for proof boundaries.
- Existing visual packaging uses an **offline multi-file** build; never use a single-HTML portability check to block development.

## 5. Risk register and release decision

| Gate | Last known | Action before release |
|---|---|---|
| PR scoped and draft | Verified on 25 October 2026 | Re-verify against GitHub |
| Focused CI / offline build | **Stage 5 passed: 24 files**, run 40222498065 on code SHA 9782970d… | Check CI for the latest documentation-only head; rerun if source changes |
| Automatic deployment prevented | Passed: deploy job skipped | Keep draft; don't push main |
| First-paint bounded, no extra draw | **Native + Chromium desktop/phone-emulated Canvas checks passed** | Actual-device visibility still open |
| Status priority / 3+24 limit | Passed native Canvas tests | Check overlap/legibility in real screen |
| 40 transient cap | Preserved | No increase without new evidence |
| Developer-only recorder | **Actual Developer Mode production-shell UI/export smoke passed**, Stage 5 | Retain Normal/Nightmare isolation; real-device overhead still unknown |
| Player CPU and physical-device FPS delta | **UNKNOWN / not measured** | Release gate; no assumed performance claim |
| Actual Pixi/Canvas parity under crowd | **UNKNOWN for this PR's real-device acceptance** | Release gate |
| Owner approval to merge/deploy | **NOT GIVEN** | Explicit approval required |

### Suggested first message for a new chat

> In `joedoragon-glitch/azeroth-chronicles-prototype`, read the GitHub file `docs/EFFECTS_STAGE5_GITHUB_HANDOFF_20261025.md` on draft PR #471's branch. Read the linked Stage 2–4 GitHub docs, independently fetch the latest main/PR head/checks, then continue only the Stage 5 independent acceptance/readiness work. Do not rely on past chat context, change unrelated PRs, ask me to run tests, merge, or deploy. Preserve the multi-file PWA and player CPU protections. Record any findings and next-chat handoff in GitHub.

**All links and source references in this file are intentionally GitHub-native; a future assistant needs no access to this conversation to proceed.**
