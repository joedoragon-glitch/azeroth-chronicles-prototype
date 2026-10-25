# PR #471 — read-only current-main / cross-draft native integration gate

**25 October 2026.** Added on the **same existing draft PR #471**, without editing other PRs or \`main\`. This is a bounded compatibility *test*, not a GitHub merge, a release approval or a portable single-HTML conversion. The project remains a multi-file GitHub Pages/PWA.

## What changed since the earlier cross-PR audit

At the start of this stage, \`main\` was **\`d64b182b991a02f02aa5f384c12f1960fb559a35\`**, six commits beyond the original effects baseline \`e3c78266\`. The following former draft work has **already merged**, and must no longer be called open: #447 (Pixi after-settings resume check), #449 (documentation governance handoff), #456 (Founding Explorers handoff), #468 (audio Stage 1), #473 (audio Stage 4), and #474 (audio Stage 5 *preflight with blocked release status*). A successful preflight does **not** mean the Stage 2/3 audio runtime is published.

At the start of this stage the remaining relevant draft heads were:

| PR | Pinned head at setup | Integration concern |
| --- | --- | --- |
| #471 | \`6b6aed04\` | Main-relative warning caching, protected hero/recovery overflow, FPS + status/diagnostics |
| #464 | \`9f34f0ab\` | Physical projectile release/contact, pet and short cast-afterimage presentation |
| #469 | \`688fba97\` | Canvas/Pixi Crown loot, shared pause and render-mode parity |
| #470 | \`ed6c2b6b\` | First-gesture audio permission + bounded soundtrack restart; shared \`app.js\` |
| #440 | \`d3dc826b\` | Dormant Critical Executions and freeze-at-release action receipts |
| #472 | \`46a5312d\` | Real action sound/contact repair, including ranged pet impacts |
| #458 | \`622965e4\` | Mobile TRUE boss combat producer and moving warnings |

These are **observations**, not frozen future tips. The workflow reacquires actual remote PR heads each time it runs and persists their complete SHAs. Other drafts such as #445, #465, #475, #476 and #401 remain independent and are not claimed to have received this native integration test; their status requires fresh review.

## Non-destructive method

A dedicated [script](../tools/effects/pr471-cross-pr-gate.cjs) and [workflow](../.github/workflows/pr471-cross-pr-gate.yml) provide a **separate, narrow CI gate** to complement ordinary #471 focused CI. The script:

1. Pins the checked-out #471 SHA and latest \`main\`, then calls Git's actual read-only \`merge-tree --write-tree --messages\`, establishing whether the two are textually compatible. Git objects created in the ephemeral runner are never pushed.
2. Constructs an **unpublished local combined tree** with \`main + #471\` and checks it separately against #464, #469, #470, #440, #472 and #458, fetching the *exact* remote refs.
3. For a **CLEAN** pair, creates a disposable CI-only worktree and runs only **two to four named native Node test files** relevant to that coupling (hero/companion real release, visual cue budget, renderer/Crown Pixi source sanity, audio recovery/routing, dormant critical and moving-boss warning).
4. Separately reports whether all named drafts can be staged in one consecutive tree; executes an additional five-file smoke only when that staged tree is CLEAN.
5. Uploads a SHA-pinned JSON artifact, including source conflicts, selected test pass/fail and test limits. A conflict is **BLOCKED**, never silently resolved. No branch, PR, save, game logic, settings, default FPS, source material, real renderer or public Pages file is changed by this checker.

**Safety:** Only PR #471 triggers this workflow, and only when the dedicated checker/workflow files change; it cannot run a full suite, browser matrix, deployment, external live game or default-Pixi activation. Existing one-time preferences, Auto 20–30 FPS, emergency skips, 40 visual transients, 24 status-bearing enemies and 3 markers, and Stage 4 +0.12s first-paint grace remain unchanged.

## How to interpret results

- **CLEAN + native PASS:** Git could combine the exact checked commits, and only the listed Node checks passed on that temporary tree. This does **not** establish real device FPS, merged project release safety, complete 48-form/per-companion art, Pixi WebGL parity, cross-workstream sound physics, or human warning legibility.
- **CONFLICT:** Git cannot combine the exact trees without an explicit source reconciliation. Report the conflicted files and preserve both PRs; never auto-select one side. If there are multiple blockers, isolate each pair before a future owner-authorized integration.
- **INDETERMINATE/FAIL:** Tooling/ancestry or one of the selected checks could not prove the contract. Treat it as an unresolved gate, not a successful build. Do not merge/deploy.
- **Cumulative CLEAN:** A series of unpublished Git trees and five extra focused checks passed. Still requires owner permission for any real integration, focused browser/Pixi parity, hardware acceptance and deployment.

**Release disposition:** HOLD until the owner authorizes integration and the existing physical-device/browser release gates are fulfilled. Never confuse this isolated integration smoke with user approval or full-game certification.
