# Azeroth Chronicles — Audio Stage 4 Music & Sound Mix Audit

**Date:** 2026-10-25  
**Stage:** 4 of 5 — independent read-only mixer/source-policy verification  
**Branch:** audit/audio-stage4-music-mix-20261025  
**Baseline:** main at e3c78266b28f3325d2afdcb76ae849fcff306deb (recheck live on continuation)  
**Owner constraints:** no merge, deploy, production sound/gain changes, release, or modifications to other draft PRs. Multi-file GitHub Pages/PWA; never impose a single-HTML requirement.

## Executive status and evidence limits

Stage 3's real-action audit remains in separate draft PR #472, with Stage 1 #468 and Stage 2 #470 also unmerged. Stage 3's latest head 632d67e had passing focused checks and Stage 3 acceptance. Its recorded/procedural **source attempts** do not establish audible loudness. The legacy standalone tests/enemy-audio.test.cjs encounter-timing regression remains an expressly separate open concern.

Stage 4 adds a **source-level music and mixing policy matrix**, a dedicated non-deploying focused CI workflow, and this handoff. **There are no game/runtime/asset/manifest/gain/settings changes**. Do not call Stage 4 perceptually accepted merely because scripted checks pass; physical phone, laptop and headphone listening and full Stage 5 distribution/PWA/offline certification are still outstanding. Stage 4 is independent of unmerged Stage 2's gesture unlock and bounded recording retry fix, so this branch does not itself demonstrate that those fixes work when integrated.

## 1. Verified source inventory

Source references on main:
- src/prototype/audio.js + audio-catalog.js: default levels: master 0.65, music 0.40, ambience 0.25, effects 0.70, muted false; interface defaults to effects until individually set.
- src/prototype/audio-mixer.js: five gains/buses (master, music, ambience, effects, interface) and three selectable mixer profiles. Reference multipliers all 1; quiet profile (master .65/music .80/ambience .65/effects .85/interface .85); phone (.90/.85/.65/1/1). The game selects phone vs reference based on platform mode, not player preference.
- src/prototype/audio-runtime.js: audio buses feed one master and compressor. In production the compressor is threshold -14 dB, ratio 3.5; without production -10 dB, ratio 8. Transient ducking attenuates **music and ambience** to 40% for the duck interval; effects/interface remain independent. Overall active voices are capped at 64, with priority reserves at 56/60/64.
- src/prototype/audio-production.js: recorded production cues, synchronized musical stems, 2.5s combat-tail intensity and place/settlement/night/peace selection. Normal boss retains the alternate stem at a low idle level, TRUE boosts the alternate stem without discarding its base.
- src/prototype/audio-environment.js: recorded environmental beds switch independently, have bounded fades and reduce to 45% during combat or 25% during boss battles relative to the authored environment gain. Optimization Mode suppresses environmental sources and restores eligible beds on exit.
- src/prototype/audio-score.js: procedural fallback and transition scoring, including peace, night and TRUE variation. The fallback remains important when recordings are loading or unavailable.
- assets/audio/manifest.json: 127 authored recordings: 83 music, 14 environmental loops, 30 effect recordings; 19 place entries, 11 boss families × normal/TRUE stem selections, title/defeat/finale and 18 ordered environment rules. The event catalog covers some events with WAV while most skill/event routes remain procedural by design.

### Scene and bus factors

| Scene | Music | Ambience | Effects | Interface |
|---|---:|---:|---:|---:|
| World | 1.00 | 1.00 | 1.00 | 1.00 |
| Menu | 0.22 | 0.15 | 0.00 | 1.00 |
| Title | 1.00 | 0.40 | 0.00 | 1.00 |

Effective level is user slider × device mix-profile multiplier × scene factor × mute, additionally passed through master and the production compressor. These are *gain coefficients, not perceived loudness measurements*. The menu makes room for interface controls by intentionally silencing gameplay effects; opening a menu in combat can therefore suppress in-game effects while it remains open. Treat that as an interaction/listening review item, not automatically a missing source.

### Music composition and transition selection

- Five outdoor regions: separate exploration, night, settlement, battle-additive and peace music identities. When both night and settlement apply, settlement takes selection precedence. Interior places have their own authored base and peace tracks.
- All 19 place identities resolve to manifest music assets and an eligible environmental loop when the correct indoor/outdoor context is supplied.
- Eleven boss identities have a base and TRUE stem. Normal stem gains: base .78, TRUE layer idle .12; TRUE form: base .78, TRUE layer .55. The score implementation uses paired loop grids and fades (authored boss .7s, places 1.2s).
- Title, defeat and finale have their own cues. Finale is controlled by the peace/finale window; outside that window region peace scoring returns.
- Ambient beds retain place identity while foreground combat is louder. Their authored per-bed gains are about .22–.36 before the combat/boss attenuators and user/device mix.
- The soundtrack contains no separate documented third profile for Optimization Mode auto: app.js chooses a runtime on/off boolean based on player preference and performance/emergency heuristics. Audio receives only the effective state.

**Important interpretation:** These coefficients are deliberate authoring choices. A low environment gain or a silent duplicate gameplay event is not a defect by itself. Do not globally raise bus gains, change compressor ratio, turn off source limits or reinstate suppressed duplicate combat sounds to make a spreadsheet look louder.

## 2. Stage 4 deterministic regression

New test: tests/audio-stage4-mix-matrix.test.cjs

It exercises actual exported audio owner methods against the live catalog and fake AudioContext:
1. 19 places × peaceful/non-peaceful, five-region night/settlement priority, and each resolved ambient identity;
2. 11 bosses × Normal/TRUE, both authored recorded stems, exact loop-length pairing, and distinct TRUE intensity;
3. title, defeat and finale cue priority;
4. 3 mix profiles × 3 scenes × 5 buses, verifying expected coefficients and menu/world transitions;
5. phone mono-like centering of stereo panning and restoration of authored pan on reference profile;
6. mute/unmute preserving all five slider levels;
7. temporary 40% ducking of only music/ambience while effects/interface retain foreground priority;
8. environment base/combat/boss attenuation and combat-tail restoration;
9. Optimization Mode on/off source policy without inadvertently muting music/effects.

Dedicated .github/workflows/audio-stage4-acceptance.yml runs the new test and established audio-production, audio-environment, audio-recordings, optimization-mode and audio-scheduler Node checks. It runs on **this PR only**, never publishes. Results count only when the exact PR head passes. The broader default PR checks, if GitHub schedules them, must be described separately rather than represented as a purpose-built Stage 4 physical audio gate.

Useful existing tests, not replaced by Stage 4:
- tests/audio-audition-browser.test.cjs performs real browser buffer decode, verifies every recorded asset has finite PCM, peak <0.98 and nonzero RMS, and includes an OfflineAudioContext rendered mix check. This is objectively stronger than looking at manifest metadata but still cannot certify real-world phone output, subjective balance or full active-battle effects.
- tests/audio-browser.test.cjs tests browser audio behavior.
- tests/audio-stage2-start-browser.test.cjs on Stage 2's branch tests first-gesture start, not on this Stage 4 baseline.
- tests/audio-stage3-action-audit.test.cjs on Stage 3's branch tests source attempts by actual combat actions, not measured gain/power.

## 3. Remaining Stage 4 listening and measurement acceptance

The following are **UNVERIFIED until exercised**, not implied by a Node green check:

| Scenario | Listen / measure | Expected safety |
|---|---|---|
| Title and initial tap | First gesture triggers soundtrack, no delayed hero-movement dependency | Requires Stage 2 candidate integrated or evaluated independently |
| Vale, March, Highlands, Frontier, Crown | Day→night→settlement→exploration, normal/peace | No abrupt cuts, wrong cue or level jumps |
| All 11 Normal/TRUE boss forms | Warn/release/impact amid paired boss score; switch forms and leave arena | SFX and warnings readable over score; no duplicate stems or stuck ambience |
| Menu open/close during music and combat | UI feedback, music/ambience reduction, restoration | No silent UI, no persistent post-menu attenuation |
| Crowded companion/ranged combat | Competing impacts, defense and voice priority | Essential cues intelligible; no unexpected music dropout |
| Phone speaker / headphones / desktop speakers | Compare music-to-SFX, panning, loudness comfort | Avoid hardware clipping and unexpected stereo loss |
| Optimization Off / Auto / On | Ambient sources stop and return as intended | Music and foreground effects continue; auto changes don't stutter |
| Mute, individual sliders and pause/resume | Music/ambience/effects/interface each independent | No saved slider loss, spike, or stuck recorded loop |

For optional objective offline measurements, collect per-window rendered PCM peak/RMS (ideally LUFS/true peak using a documented method), comparing silent reference, music-only, ambience-only, foreground SFX-only and combined dense combat. Measure both initial warm cache and cold recorded fallback, and verify thresholds in the target playback environment. **Do not substitute codec decode success or source invocation count for audible balance.** A scalar bus coefficient cannot predict acoustic perceptibility across devices. Record actual device type/output, whether headphones were used, Optimization Mode, selected volumes and scene in the acceptance log.

No arbitrary numerical gain adjustments are proposed before these measurements. If one family is perceptually masked, reproduce with the exact event, verify whether recorded WAV vs procedural fallback won, inspect routing/throttle/voice priority, then make the smallest source/scene-specific correction with an A/B check.

## 4. Next phase and integration boundaries

1. Verify exact current main, current heads of #468, #470, #472 and Stage 4 PR, plus Stage 3's exact-head CI status. Do not infer current production from a draft.
2. Run/inspect Stage 4's narrow CI. If red, repair only the test or a proven mixer defect on this Stage 4 branch. Do not alter player-facing mix or gameplay without reason.
3. Perform the scenario-specific listening check above, documenting what was actually heard; do not label it complete until heard.
4. Prepare Stage 5 integration/release planning **only after explicitly authorized**. Stage 5 must reconcile dependencies and test browser/PWA/offline, headsets, phones and device performance across stages; no unconditional merge, deployment or audio-engine refactor.
5. Preserve the separate historical enemy-audio regression as an unresolved observation unless independently resolved in its own scope.

### Exact commands

node tests/audio-stage4-mix-matrix.test.cjs
node tests/audio-production.test.cjs
node tests/audio-environment.test.cjs
node tests/audio-recordings.test.cjs
node tests/optimization-mode.test.cjs
node tests/audio-scheduler.test.cjs

This handoff is self-contained and stored on GitHub. No conversation attachment or single-file release format is needed to continue.


## 5. Cross-project contradiction / integration audit (15 open PRs, current main \`e3c7826\`)

**Audit scope:** all 15 PRs open at the 2026-10-25 review checkpoint, compared by exact files and relevant change hunks. These are *prospective* hazards, not proof that an integrated build fails. Separate draft CI does not test simultaneous application of unmerged code. This inventory must be refreshed immediately before a staged integration; later updates in any PR can invalidate this snapshot.

### Audio predecessors and adjacent runtime work

| PR | Isolation assessment | Integration proof still needed |
|---|---|---|
| #468 — audio observability | Adds three new diagnostic/test/document files; does not modify runtime. No Stage 4 path collision. | Observer must see recorded-source selection distinctly from procedural fallback, without injecting sound or changing timing in combined Stage 2–4 build. |
| #470 — audio recovery and first-gesture start | Edits \`app.js\`, \`audio-production.js\`, \`audio-environment.js\`; the *Stage 4* PR does not modify any of them. | Run Stage 4 cue/mix tests on recovered Stage 2 implementation, including same-scene retry and no cue restart, after integration. |
| #472 — real combat audio action coverage | Narrow \`audio-effects.js\` ranged-pet impact fix, test/fixture and docs. No Stage 4 path collision. | Check that all four Crypt/Archive/Abyss/Citadel ranged pet contact routes still make one proper impact sound, with actual delayed projectile receipts when #464 is present. |
| #473 — this Stage 4 source/mix audit | New files only: workflow, test, documentation. Independent of prior audio runtime changes, no gain changes. | Its own CI is necessary but not sufficient to certify integrated playback on future combined code. |
| #464 — physical projectile visuals/contact | Alters \`combat.js\`, \`hero-combat.js\`, \`party.js\`, \`party-pets.js\`, renderer and effects emissions. Changes real release/contact sequencing used by Stage 3's test. | Rerun Stage 3 real-action trace after #464; avoid counting original \`projectileLaunch.count\` as already departed arrows. New \`releasedCount\` records individual physical releases. Do not replay a new launch sound at both initial planned burst and delayed physical departure. |
| #440 — dormant Critical Executions | Alters much of #464's combat/party owner code; feature OFF. No requested new critical audio. | **Confirmed code-signature overlap:** #440 uses the fifth \`petSkillContact\` argument for critical receipt. #464 now reserves fifth for receipt and sixth for cosmetic \`launchPoint\`. Reconcile all call sites on a combined candidate, preserve delayed impact and exactly one critical decision per released action; do not accidentally activate criticals or introduce exclamation sound. |
| #471 — effects diagnostics and visibility | Edits \`app.js\` and the visual event queue, renderer, hero presentation and VFX; \`app.js\` overlaps #470 by filename but current patches occupy distinct functions (gesture capture near initialization versus developer recorder/report/loop). | After combined integration, confirm \`game.effects.splice(0)\` still forwards **each** actual receipt to \`audio.effect\` once even with recorder enabled; diagnostics must neither consume receipts nor spawn sound; renderer queue/frame skips never become an audio source gate. |
| #469 — Pixi/Crown loot and pause visibility | Shares \`renderer.js\` with #471 and #464; visual-only repairs. | Confirm audio update follows gameplay, not Canvas/Pixi draw frequency. Check pause/resume and restored audio context in both renderer options, without promoting experimental GPU default. |
| #458 — TRUE field boss hunt circuit | Changes \`engine.js\`; #440 also changes engine. Boss aggro and movement may alter actual score-scene detection. | Test live boss engage/disengage/retreat; retain correct TRUE base/overlay stems and ambience attenuation, avoid repeated abrupt score restarts. |

### Remaining open PRs accounted for

- **#465 + #449** (documentation and test-governance updates): no audio engine changes; #465 rewrites \`AGENTS.md\` and documentation index, which also overlaps historical #401 docs; reconcile authoritative project instructions rather than duplicating or restoring stale policies. The audio handoff remains versioned in its own branch until future integration.
- **#447** (Pixi browser acceptance test): no audio source change; use it selectively if combined GPU/pause testing shows overlap.
- **#445** (sprite/material validation pipeline): no audio runtime change; rerun reproducible build/asset validations after any shared packaging integration.
- **#456** (Founding Explorers documentation): no source/mixer overlap; coordinate later release claims, not current audio gains.
- **#401** (Vale landmark preview and old documentation updates): no audio runtime overlap; do not transfer its earlier AGENTS and development-state wording over #465's newer governance entrypoints.

### Findings and dispositions

1. **No direct file conflict detected between Stage 4 and any of the other 14 currently open PRs.** This is a filename/diff-level conclusion, not an integrated mergeability certificate.
2. **High integration risk** is between #440 and #464 combat/pet owners. The positional \`petSkillContact\` argument collision is known; #464 has a source-level six-argument accommodation, but **no combined implementation is certified**. Stage 3's impact regression depends on the final emitted pet-impact receipts, not merely this signature.
3. **Medium integration risk** across #464 / #471 / #469 rendering and effect queue, and #470 / #471 shared \`app.js\`. Do not choose one branch wholesale or delete either implementation. Reconcile hunks by ownership and validate source events once through audio independently of drawn frames.
4. **Medium integration risk** is behavioral drift from new TRUE boss movement #458 and critical action release hooks #440. The authored soundtrack and mix are unchanged, but the events and actor contexts feeding them can change.
5. **Current source-level behavior remains designed, not physically certified:** all 83 music, 14 environmental, 30 recorded FX assets are registered; there is no basis for globally boosting gain levels or switching off intentional source suppressions. Avoid unexpected side effects on the 64-voice scheduler or adaptive skipping.
6. The preexisting standalone \`tests/enemy-audio.test.cjs\` reinforcement/telegraph regression remains **unresolved**. Stage 3's scoped acceptance deliberately excludes it. Combined acceptance must disclose it, investigate independently, and never claim the entire enemy-audio suite is green.

### Compatibility acceptance sequence — no merge/deploy authorization

After separate owner authorization to assemble a **temporary integration candidate**, freeze and cite each precise head before combining. No copy-paste of only favorite files from overlapping PRs; perform a three-way source reconciliation that keeps all intended concerns. Run in increasing scope:

A. **Audio invariants:** \`node tests/audio-stage1-coverage.test.cjs\`, \`node tests/audio-stage2-recovery.test.cjs\`, \`node tests/audio-stage3-action-audit.test.cjs\`, \`node tests/audio-stage4-mix-matrix.test.cjs\`, \`node tests/audio-production.test.cjs\`, \`node tests/audio-environment.test.cjs\`, \`node tests/audio-recordings.test.cjs\`, \`node tests/audio-scheduler.test.cjs\`, \`node tests/pt312-audio-integration.test.cjs\`. These Stage-specific tests exist on distinct unmerged branches today; they are not all runnable together on current main or this isolated PR.

B. **Adjacent action sources:** \`node tests/hero-postcast-visuals.test.cjs\`, \`node tests/pet-postcast-visuals.test.cjs\`, relevant dormant \`critical-*native.test.cjs\`, \`node tests/true-field-boss-hunt.test.cjs\`; verify real cue ownership, charged/cancelled projectile release, receipt counts, and criticals OFF equivalence. Use current latest test names, source fixtures and step cadence.

C. **Draw/pause/performance side:** targeted \`effect-diagnostics-stage4\`, \`art321-pixi-loot\`, \`optimization-mode\`, foreground-sound and source/voice cap regressions; enforce Canvas fallback and Pixi Keep/Revert. Do not confuse visual visibility with heard audio.

D. **Browser/device gate:** only narrowly scoped browser audio checks until the owner authorizes full release certification. Browser decoded samples are not physical speaker listening. Stage 5 separately owns combined PWA/cache/offline, real phone/desktop/headphone volume experience, and deployment readiness.

**Rule:** No integration candidate has been created here. Keep #468/#470/#472/#473 and every other concurrent PR isolated, unmerged, unpublished, and independently recoverable. Work that tests source sound/mix improves earlier stages; it must not replace their recovery, event ownership or acceptance evidence.
