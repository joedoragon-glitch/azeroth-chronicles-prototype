# PR #471 — read-only current-main / cross-draft native integration gate

**25 October 2026.** Added on the **same existing draft PR #471**, without editing other PRs or `main`. This is a bounded compatibility *test*, not a GitHub merge, a release approval or a portable single-HTML conversion. The project remains a multi-file GitHub Pages/PWA.

## What changed since the earlier cross-PR audit

At the start of this stage, `main` was **`d64b182b991a02f02aa5f384c12f1960fb559a35`**, six commits beyond the original effects baseline `e3c78266`. The following former draft work has **already merged**, and must no longer be called open: #447 (Pixi after-settings resume check), #449 (documentation governance handoff), #456 (Founding Explorers handoff), #468 (audio Stage 1), #473 (audio Stage 4), and #474 (audio Stage 5 *preflight with blocked release status*). A successful preflight does **not** mean the Stage 2/3 audio runtime is published.

At the start of this stage the remaining relevant draft heads were:

| PR | Pinned head at setup | Integration concern |
| --- | --- | --- |
| #471 | `6b6aed04` | Main-relative warning caching, protected hero/recovery overflow, FPS + status/diagnostics |
| #464 | `9f34f0ab` | Physical projectile release/contact, pet and short cast-afterimage presentation |
| #469 | `688fba97` | Canvas/Pixi Crown loot, shared pause and render-mode parity |
| #470 | `ed6c2b6b` | First-gesture audio permission + bounded soundtrack restart; shared `app.js` |
| #440 | `d3dc826b` | Dormant Critical Executions and freeze-at-release action receipts |
| #472 | `46a5312d` | Real action sound/contact repair, including ranged pet impacts |
| #458 | `622965e4` | Mobile TRUE boss combat producer and moving warnings |

These are **observations**, not frozen future tips. The workflow reacquires actual remote PR heads each time it runs and persists their complete SHAs. Other drafts such as #445, #465, #475, #476 and #401 remain independent and are not claimed to have received this native integration test; their status requires fresh review.

## Non-destructive method

A dedicated [script](../tools/effects/pr471-cross-pr-gate.cjs) and [workflow](../.github/workflows/pr471-cross-pr-gate.yml) provide a **separate, narrow CI gate** to complement ordinary #471 focused CI. The script:

1. Pins the checked-out #471 SHA and latest `main`, then calls Git's actual read-only `merge-tree --write-tree --messages`, establishing whether the two are textually compatible. Git objects created in the ephemeral runner are never pushed.
2. Constructs an **unpublished local combined tree** with `main + #471` and checks it separately against #464, #469, #470, #440, #472 and #458, fetching the *exact* remote refs.
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


## Executed results — pinned CI snapshots, not permission to merge

The first effective exact-commit source/native gate succeeded in [run #40237632254](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237632254) with checkout `570c1757085c45d7077eed6ffda548c2a8af38a3`, main `d64b182b991a02f02aa5f384c12f1960fb559a35`. All **six pairwise three-way combinations were CLEAN** and all **17 selected native test executions PASSED**. An earlier initial run was inconclusive due to shallow checkout ancestry and is superseded; the checker now fetches the exact source SHA's history and fails closed for an unprovable baseline.

The [read-only detailed merge check #40237824040](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40237824040) established why *all seven sources together* cannot be declared clean. Sequentially merging latest main + #471 + #464 + #469 + #470 into a temporary Git tree remained **CLEAN**. Adding **#440 Critical Executions** produced genuine **content conflicts in three files**:

- `src/prototype/combat.js`
- `src/prototype/hero-combat.js`
- `src/prototype/party-pets.js`

The conflict is an interaction between unmerged combat/projectile sources **#464 and #440**, not evidence that #471 by itself breaks either PR. Git reported no conflict in the tested individual combinations of #471 with #440, #464, #469, #470, #472, or #458. Subsequent #472 and #458 pairwise tests still passed, but the complete cumulative tree remained **BLOCKED** rather than pretending to include them.

The stronger [maximal-clean-prefix gate #40238018663](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40238018663), checkout `a5124d9b66ae7a7c944080cf80d4ee336f2530da`, tested that same clean prefix as **one actual unpublished temporary Git tree**: main `d64b182b` + #471 `a5124d9b` + #464 `656912d3` + #469 `80f9f521` + #470 `ed6c2b6b`. **All five additional selected native tests passed on the composed tree**: the 40-slot hero/recovery reservation, real hero projectile/postcast visuals, Pixi/Crown source smoke, bounded audio recovery, and exact warning geometry reuse. Its six separate pairwise combinations also had **17/17 selected native test passes**; cumulative stage #440 was still **CONFLICT** at `92d5bdb3`.

**Important latest-main update:** after that run, `main` advanced by merged [#477](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/477) to `ce199647f63d3a4fe0ae98fb85b952b0fa5a9e3a`, changing the Pixi context-loss browser regression and WebGL pilot guard, not the #471 visual runtime paths. All prior exact SHA results remain historical and valid for *their pinned trees*; they do **not** certify #477. The next CI invocation of this tool must reacquire that new main head and persist the new comparison. No full Chromium/WebGL or real-device certification has been requested.

### Integration instructions carried forward

1. **Preserve both #464 and #440.** Explicitly reconcile physical Ranger/Archer and pet release/contact semantics against Critical Executions' frozen once-per-action receipts in the three conflicted gameplay files. Keep the critical feature OFF in the default production game, and keep genuine projectile flight and impact timing. Do not select `ours`/`theirs` wholesale.
2. After a reviewed, authorized resolution in a separate integration candidate, execute a **small combined native regression** for critical OFF/ON test-mode, projectile at 20/30/60 pacing, pet cast/contact, audio real impacts, 40 effect queue, Pixi/Pause/loot, and updated main context-loss guard. The current gate does not fix conflicts.
3. Retain all actual runtime/adaptive safety protections: 40 transient effects, 24 enemies with up to 3 status markers, hero first-paint max +0.12s, user-selected Auto 20–30 FPS default/other choices, emergency frame skip and multi-file offline PWA.
4. **Do not merge, deploy, enable graphics tiers, or approve physical-device performance** on this evidence. Main and other PR heads may advance; re-run on exact pinned heads at actual integration time.

**Disposition:** native pairwise and maximal clean-prefix confidence improved; the full Critical Executions composition remains **BLOCKED** until explicit reconciliation. The CI workflow returns success when it correctly *documents a conflict*, but the artifact's `cumulative.status = BLOCKED` is **not an integration pass**. A bad ancestry or an executed test failure returns red.
