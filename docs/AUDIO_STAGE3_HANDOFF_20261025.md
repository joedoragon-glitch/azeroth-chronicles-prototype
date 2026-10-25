# Azeroth Chronicles — Audio Stages 1–3 Handoff and Stage 3 Review Gate

**Prepared:** 2026-10-25. This is the durable handoff for a NEW, independent conversation.  
**Project:** `joedoragon-glitch/azeroth-chronicles-prototype` — multi-file GitHub Pages/PWA game. **Do not reinstate any single-HTML limitation.**  
**Main baseline observed:** `e3c78266b28f3325d2afdcb76ae849fcff306deb` (recheck live branches before acting).  
**Primary draft:** PR **#472**, branch `audit/audio-stage3-real-action-coverage-20261025`, base `main`.  
**Strict owner constraints:** No automatic merge, Pages deployment, push to main, production gameplay/balance changes, or unrelated PR modifications. No player action required for the current automated review. Stage 4 and Stage 5 remain distinct authorizations.

## Final narrow acceptance status (confirmed)

At Stage 3 code/CI commit `954ce9bd6ec04e895ffb1db03022b667af1d2518`, the **PR-only Stage 3 combat audio acceptance passed**: https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40224103718 . All SIX steps passed: real combat audio action matrix, established hero skill timing, restored Soldier/Archer/11-pet activation, enemy identity/stage catalog integrity, live projectile/captain audio bridge, and recorded-WAV decoding/fallback. The separate focused checks/build also **passed** at the same code SHA: https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40224103649 . The Pages/publish job was skipped. This was the first accepted **narrow Stage 3 technical gate**, **not** the full-game/manual/physical-speaker certification. **Important update:** subsequent Stage 3 commits introduced the targeted ranged-pet impact fix in `src/prototype/audio-effects.js` and an associated regression in `tests/audio-stage3-action-audit.test.cjs`; the earlier successful SHA does NOT certify this additional code. Verify the new exact-head Actions result before describing the final Stage 3 candidate as green.

The standalone historical `tests/enemy-audio.test.cjs` regression remains separately unresolved, even though the more targeted enemy identity, bridge, and WAV regressions passed. Do not describe the complete historical suite as green.

## 1. Why this work exists

The owner noticed some sounds and visual effects appeared to exist in game files without always being experienced in play and also requested that the **game soundtrack begin on the initial game-entry tap/key gesture, not on first hero movement or attack**. The audio work has been separated into five stages:

1. **Development-only observability / registration vs active source**: PR **#468** (draft, independent; head last observed `7087167cba63217b482f2fe5f157222d499ccf82`). Three new files: opt-in `tools/audio/coverage-probe.js`, `tests/audio-stage1-coverage.test.cjs`, `docs/AUDIO_STAGE1_COVERAGE_20261025.md`. Confirmed 83 music IDs, 14 ambience beds and 30 WAV route candidates reachable in generated scenes; NOT real-device audibility.
2. **Same-scene loading failure recovery and first-gesture soundtrack unlock**: PR **#470** (draft, independent; head last observed `ed6c2b6be6be67e6cc16f2e627aa7116a8d8289c`). Finite score/environment retries (initial + 1s + 4s on running audio clock) without altering fallback, plus `app.js` unlock on first qualifying pointer/key gesture, independent of moving/casting. Browser autoplay still requires an actual gesture. `tests/audio-stage2-recovery.test.cjs` and `tests/audio-stage2-start-browser.test.cjs`; desktop/phone-sized Chromium validation and existing `tests/audio-browser.test.cjs` PASSED at Stage 2 head. Acceptance run: https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40218303931 . No physical-device speaker test yet.
3. **Actual combat action receipts → recorded/procedural/silent audio paths**: current PR **#472**. This handoff is for this stage.
4. **Music and sound-mix audibility/experience**: NOT STARTED. Test day/night, settlements, 11 bosses/TRUE, menu/combat/phone and Optimization Mode off/auto/on without indiscriminate gain increases.
5. **Browser/PWA/offline/physical devices and release gate**: NOT STARTED. Eventually includes Chromium/WebKit and real phone/headphones, offline subpaths, assets/voice/stress and save compatibility. No release unless owner approves.

Stages 1/2 drafts are deliberately not merged into Stage 3: Stage 3 uses the unchanged `main` baseline, and its tests verify existing audio routing independent of the experimental probe/retry code.

## 2. Stage 3 files, tests and results

PR #472 introduces:
- `src/prototype/audio-effects.js` — a narrow **actual sound fix**: map `projectileImpact` with `style: 'pet'` to the existing `magicImpact` foley. Affects the recorded-action pipeline for four ranged pet families (crypt, archive, abyss, citadel) and preserves damage, projectile motion, volume, cooldowns and the existing voice/asset budgets. This correction was added after the initial read-only Stage 3 matrix and requires a fresh exact-head test run.
- `tests/audio-stage3-action-audit.test.cjs` — actual `Campaign.cast()` for every hero slot and form, actual delayed projectile updates, actual `Campaign.tick()` for trained companion autonomous skills, actual boss `startAttack/resolveAttack` emissions, and delivery of actual emitted receipts through installed `PrototypeAudio.effect()` with sound-source methods intercepted. Emits `STAGE3_ACTION_MATRIX` to Actions logs and supports `--json`.
- `docs/AUDIO_STAGE3_REAL_ACTION_AUDIT_20261025.md` — source-route audit, scope and limits.
- `tests/roster-skill-update.test.cjs` — a *test-fixture-only* fix: uses `completeFieldOpening()` before expecting autonomous companions to engage. Otherwise the game's hero-first tutorial gate protects the target and older fixture gives a false failure. **No game code or combat mechanics changed.**
- `.github/workflows/audio-stage3-acceptance.yml` — Stage 3 PR-only, **non-deploying** narrow test workflow.

Initial green evidence **before the additional ranged-pet contact fix** from the Stage 3 test at commit `284b3c6c9c99396f623f81945740ee6fda102981` / focused run https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40223116554 :

- **48/48** actual hero forms (Paladin, Mage, Ranger × eight slots × Tap/Charged) had a procedural audio-source attempt after emission/dispatch.
- **13/13** autonomous companion types (Soldier, Archer, 11 boss pet families) activated both trained skills and had combat sound-source attempts. The new test correctly completes the introductory hero-only encounter before testing.
- **22/22** normal and TRUE boss forms audited, totaling **362 emitted boss-stage receipts**; tested active authored attack indexes each had source attempts.
- Existing enemy-catalog cross-check: **264** enemy presentation identities and **1,962** stage/variant routes.
- Existing `tests/hero-skills-consolidation.test.cjs` and adjusted `tests/roster-skill-update.test.cjs` both passed in the dedicated Stage 3 workflow at https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40223480283 before the later legacy enemy regression failed.

**Important methodological limits:** Recorded WAVs are checked for conditional routing candidates, while the integration matrix deliberately forces cold-recording procedural fallback to inspect the immediate source path. `procedural` means the audio synth was invoked, not that a speaker emitted audible PCM. `no_source_observed` per individual receipt does **not** prove missing skill sound: e.g., normal `heroSkillCast` is frequently silent because actual delayed `heroProjectileFlight` and `projectileImpact` own the sound; a `hit` receipt is bookkeeping, and charged/duplicate stages may intentionally not sound twice. Do not fix these by blindly adding synth to each receipt. **Ranged-pet impact resolution:** Actual `projectileImpact` receipts for crypt, archive, abyss and citadel pets previously fell through without a procedural impact recipe. The PR now dispatches their `style: 'pet'` contact through the existing `magicImpact` recipe and asserts all four hit-stage routes in the real-action test. **Revalidate at the latest commit; the earlier passed workflow predates this fix.** The `companionChargeStart` receipts are preparation/bookkeeping stages; they must not be mistaken for missing damage-contact audio without examining subsequent release/impact receipts.

### Why the current narrow workflow changed

An older test, `tests/enemy-audio.test.cjs`, when run independently, repeatedly fails at its *concurrent reinforcements* assertion `reinforcement cannot resolve or replace the active telegraph` (near line 411 on its original `main` file). This is a gameplay/encounter-timing assertion, **not a measured audio-output failure**. Attempted fixture changes did not clear it, so those changes were reverted; the original enemy test is *not modified in PR #472*. **Do not call it passing or assert without verification that it fails on main**: the old test's main-baseline standalone result has not been independently established in this investigation.

The dedicated `audio-stage3-acceptance.yml` was therefore narrowed to the relevant independently passing enemy stage catalog `node scripts/enemy-audio-coverage.cjs` and `node tests/pt312-audio-integration.test.cjs`, along with new Stage 3, existing hero, restored roster, and recorded WAV tests. This makes the Stage 3 acceptance gate focused without pretending the legacy test is fixed. If investigating the legacy enemy test next, open an isolated issue/PR or secure authorization rather than changing boss behavior casually. Leave its failed evidence visible in old Actions runs; for instance https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40223480283 .

## 3. Exact follow-up commands and release checks

On a checkout of PR #472 head:

```sh
node tests/audio-stage3-action-audit.test.cjs
node tests/audio-stage3-action-audit.test.cjs --json
node tests/hero-skills-consolidation.test.cjs
node tests/roster-skill-update.test.cjs
node scripts/enemy-audio-coverage.cjs
node tests/pt312-audio-integration.test.cjs
node tests/audio-recordings.test.cjs
node scripts/build.cjs --check
```

Check latest GitHub Actions for PR #472 at the actual exact head SHA. Full `tests/enemy-audio.test.cjs` is a separate observed red gate; do not omit that fact from any certification report. Do not claim the full game test suite was run, that recorded assets were physically heard, or that all `no_source_observed` individual receipts have been resolved. If PR acceptance is still running or red, capture exact job name, failing assertion and commit SHA.

**Recommendation:** Stop Stage 3 at a **review-only auditable checkpoint**, with the new matrix and its limitations documented, unless a targeted missing-sound correction is supported by a reproducing real action and explicitly authorized. Retain the draft PR so Stage 1 and 2 continue unaffected. Do not begin Stage 4 without renewed permission.

## 4. Future-chat startup instructions

The next assistant should:

1. Read this handoff and `docs/AUDIO_STAGE3_REAL_ACTION_AUDIT_20261025.md` **from PR #472's branch**; separately read the Stage 1 and 2 handoffs on PR #468/#470 as needed. They are **not on main**.
2. Fetch live `main` SHA, live PR #468/#470/#472 head SHAs, changed files, and Actions check conclusions. Do not trust the last-observed SHA here after concurrent writes; use the *actual current* head for any test or release statement.
3. Confirm PR #472's latest narrow Stage 3 workflow passed, or describe the precise blocker. Assess source attempts vs actual speaker output honestly. Keep the legacy enemy test as a separate red/unknown baseline item, not a secretly patched success.
4. Check the per-action `STAGE3_ACTION_MATRIX` in the Stage 3 workflow logs for unmatched individual sound receipts; especially ranged pet impacts. Only propose narrow fixes supported by event-ownership/timing evidence. Leave gameplay, effects rendering, and the 64-voice budget unchanged absent authorization.
5. Stop at a draft-review milestone. Wait for owner instruction before moving to Stage 4 or merging/deploying any audio PR.

A ready-to-paste message in a new chat:

> Continue Azeroth Chronicles' five-stage audio audit from GitHub. Read draft PRs #468, #470 and especially #472; read `docs/AUDIO_STAGE3_HANDOFF_20261025.md` and `docs/AUDIO_STAGE3_REAL_ACTION_AUDIT_20261025.md` on PR #472's branch. Reconcile against latest main and current PR heads and checks. Review Stage 3's real-action matrix, its explicit limitations and the legacy enemy test failure. Keep drafts isolated; do not merge or deploy. Report the exact Stage 3 release gate before proposing Stage 4.

**Final rule:** This document is intentionally versioned *on the Stage 3 branch* until a later explicitly approved merge. There is no dependence on the current conversation's memory or on local files.
