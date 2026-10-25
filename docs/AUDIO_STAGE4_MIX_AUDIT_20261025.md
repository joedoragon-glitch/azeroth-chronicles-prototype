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
