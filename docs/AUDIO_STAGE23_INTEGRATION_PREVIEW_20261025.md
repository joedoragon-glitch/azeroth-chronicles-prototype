# Audio Stages 2 + 3 — exact-reference, ephemeral integration test

**2026-10-25. Draft PR, verification-only.** Base main: d64b182b991a02f02aa5f384c12f1960fb559a35. This baseline ALREADY includes merged Stage 1 (#468), Stage 4 (#473), and Stage 5 source/PWA preflight (#474), plus separately merged unrelated docs and Pixi tests. Stage 2 (#470) and Stage 3 (#472) are still open, unmerged drafts at this checkpoint. Revalidate main/heads before treating any result as current.

## Why this test exists

Previous source acceptance ran each stage independently and did not show that first-gesture audio activation, finite MP3 score/environment retry, the four repaired ranged pet impact routes, the Stage 4 mixer, and PWA offline packaging all work together. Stage 3 later fixed a historical enemy-audio reinforcement fixture by recording a lawful first hero engagement; its exact-head PR CI did NOT run the entire historical enemy-audio test. This preview runs that unchanged game engine test with its narrow fixture amendment on the shared source tree, preserving the real encounter protection.

## Exactly what runs

The PR adds ONLY this document and the dedicated verification-only workflow. It does not include production patches from any stage. GitHub Actions checks out the test PR ref with read-only credentials, fetches GitHub PR #470 and PR #472, validates both exact head SHAs, then makes two **local CI-runner-only merge commits**. It never pushes or uploads those merge commits; they disappear at the end of the job.

Frozen input heads (the job intentionally fails rather than silently switching inputs):
- main ancestry d64b182b991a02f02aa5f384c12f1960fb559a35.
- #470: ed6c2b6be6be67e6cc16f2e627aa7116a8d8289c.
- #472: 46a5312d1fb40f5fb8102b1609807770bc744fd0.

The runner tests Stage 1–5 native contract files together; the historical enemy-audio scenario, hero/roster and sound bridges; recorded audio and environment; Pixi-prepared PWA cache/rollback and commit-based release identity; reproducible multi-file offline build; Stage 2 first gesture and Stage 4 decoded WAV/MP3 smoke in **desktop/phone-sized Chromium emulation only**. The CI run additionally executes the existing `tests/audio-audition-browser.test.cjs` in **Chromium only** on desktop and phone-sized emulation, including service-worker-backed offline audio reload. The runner prefers an already-installed local Chrome/Chromium binary for the narrow checks, without changing Stage 2's browser assertions; if unavailable it installs Chromium. No full WebKit matrix, game-wide browser suite, physical hardware listening, stress benchmark, Pages deployment or manual release certification.

Passing this workflow means only that these five audio components interoperate on the specified synthesized tree. It does not authorize merging the underlying PRs, prove sound loudness or characterize untested real devices.

## Unmerged adjacent work and release constraints

Concurrent drafts #440 (Critical Executions, feature OFF), #464 (physical Ranger/Archer/pet projectile flight and impact timing), #471 (visual diagnostics/status prioritization), #469 (Pixi/Canvas parity), and #458 (roaming TRUE bosses) still require separate, current-head reconciliation. In particular, #440 uses petSkillContact argument #5 for its critical receipt and #464 reserves #5 for that receipt and #6 for launchPoint. Stage 3 audio contact events must remain synchronized with physical impact, and no event must be played twice because presentation is drawn again. The source tree tested here does NOT include these workstreams; that is an open release gate, not a passing integration claim.

The Stage 5 release gate remains blocked: full audio-audition offline browser acceptance on final integrated source, 127-asset real-world decode/listening coverage, night/TRUE intensity, headphone/phone perceptual balance, actual hardware, save/restore, crowd + frame-skip pressure, optional Pixi and WebKit, and owner's explicit release decision are outstanding. Maintain the canonical multi-file GitHub Pages/PWA build and no single-HTML requirement.

## What to do with the result

Check the current PR HEAD and exact-head Actions run; distinguish merge conflicts, regression failures and browser fixtures. Record the actual CI status and script outputs in the PR discussion. If it fails, correct only the verification harness or report an upstream regression without overwriting existing feature PR branches. If green, retain Stage 2 and Stage 3 draft isolation pending any separate review/merge decision. No version or game gameplay changes on this PR. Future chats can resume exclusively from GitHub without this conversation.
