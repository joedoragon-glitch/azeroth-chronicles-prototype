# Developing and verifying a game change

**So I Became the Dark Lord's Problem** · Maintained engineering workflow · Reviewed 28 October 2026

**What this page is for:** A practical workflow for changing mechanics, AI, companions, menus, navigation, saves, graphics, audio and other game systems **without repeating old work or creating unverified releases**. It guides implementation and evidence, but **is not permission to start a historical task**.

**The whole process:** Confirm the owner's request → find the active code and decisions → define a small acceptance target → implement through the real game → run relevant original regressions → reconcile documentation → record the tested commit → merge/publish **only when authorized**.

## 1. Know which source to trust

| Question | Consult |
| --- | --- |
| **May we do this, run broad tests, or release it?** | Current owner instructions and [AGENTS.md](../AGENTS.md). A past permission or waiver is not a standing approval. |
| **What is the game supposed to do?** | Owner-approved design, [decisions](DECISIONS.md) and the current feature contract or owning PR/issue. |
| **What does the code actually do?** | Current branch and `main`, plus the real modules in [architecture](ARCHITECTURE.md). An old handoff or source comment can be outdated. |
| **What passed, merged, or shipped?** | Exact commit/test runs, GitHub PR and Pages results, then [development state](DEVELOPMENT_STATE.md). |
| **Where is historic rationale?** | Dated audits and archived contracts, interpreted as evidence **at their stated date**, not new assignments. |

When records disagree, **investigate the exact conflict**. Do not automatically trust the newest date, a proposed feature, a convenient test expectation or an unmerged branch over approved design and live behavior. Preserve the official game name; historic repository paths and save keys retain compatibility names under [brand identity](BRAND_IDENTITY.md).

**Region-specific work:** Apply [the one-region consent rule](../AGENTS.md#single-region-authority-and-paid-work-scope-29-october-2026). Test results from unrelated regions are evidence to defer, not new assignments; make no out-of-region edits without explicit owner permission. If shared source changes, verify all other regions remain unchanged. Preserve the owner's paid work allowance by avoiding unrelated CI/repair loops. See [incident #655](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/655).

## 2. Start with one well-defined outcome

Before editing:

1. **Check the current authorization and existing work.** Read the relevant issue/PR and recent changes to `main`. Reuse the existing feature branch/PR when continuing it; don't open a new PR or document for each substep. Confirm whether the feature is already implemented, only planned, or awaiting acceptance.
2. **Identify the owning source.** Find the real resolver, state owner, manifest/authoring source and relevant original tests. Do not edit generated assets as though they were authoring files.
3. **Write a brief acceptance contract** in the existing PR/issue: intended player result, at least one important refusal/failure case, affected systems and behavior that must remain intact. Keep changes within the owner's approved scope.

Example: a proposed Rogue Charm correction must inspect the **currently playable** Rogue combat, companion and v4 save paths. It must not restart an old Rogue Phase 3 work order. This example is guidance, not authorization to change Rogue.

## 3. Implement through the real game, including its boundaries

Make the **smallest coherent working change**, not an isolated demonstration that bypasses the player's normal path. Prefer an existing source owner over duplicate state, rules, trackers or scripts. Check the applicable lifecycle cases early:

| Boundary | Typical question |
| --- | --- |
| **Happy path** | Does the actual player input reach the resolver and produce the expected outcome? |
| **Refusal/cancellation** | What if the target disappears, action is ineligible, attack is interrupted or the player cancels? Are costs/state still correct? |
| **Deaths and transitions** | Does it survive hero/companion death, target defeat, encounter reset, zone exit/reentry and pause/resume? |
| **Persistence** | Does v4 save/reload preserve intended state and clear temporary state, including older backups when relevant? |
| **Related systems** | Do other classes, AI, controls, UI, sound, renderer fallback and resource budgets still behave correctly? |

Apply only relevant rows; an audio listening-room change, for instance, needs browser audio unlock, stop/replay, offline behavior and **no campaign-save access**, not a full combat matrix.

**Never fake prerequisites silently.** If a game mechanic requires a real Nightmare opening, legal rank, aggro, line of sight, distance or other actor state, exercise the native setup and assert it before the behavior. Manually forcing fields in a fixture can make a broken rule look correct. Do not change gameplay to fit an invalid test.

## 4. Test what changed and protect existing behavior

**CI (continuous integration)** runs automated checks on commits. A **PR (pull request)** is proposed work, not proof of merge or publication.

- **Find the original regression suites.** Map changed modules and behavior through [the maintained focused selector](../.github/scripts/focused-ci.cjs). Extend the affected *existing* tests with positive and negative cases, rather than replacing them with a new test that only proves its own helper. Cross-system changes may require save, targeting, companion or browser checks as well.
- **Use independently justified expectations.** Derive damage/timing/requirements from the approved decision, not the implementation being tested. Preserve historical fixtures; review an explicit source-linked delta rather than regenerating expectations from runtime.
- **Verify the lifecycle.** Test refusal, interrupted/invalid states, death, reset and persistence where applicable. Distinguish quick source tests from browser, visual, listening, long-session and real-device results.
- **Test the final relevant candidate.** Use focused checks, the locked formatter and a reproducible build. Don't default to `npm run test:quick` (which is not mechanic-specific), a full-game matrix, or repeated runs of unchanged successful checks.

Typical local commands (replace the placeholder with the actual affected test and file):

```sh
npm ci --ignore-scripts
node tests/<relevant-test>.test.cjs
npx prettier --check path/to/changed-file
node scripts/build.cjs --check
```

The [normal workflow](../.github/workflows/focused-deploy.yml) selects focused checks and validates the build. The [full game/Chromium/WebKit workflow](../.github/workflows/pages.yml) is **manual and requires explicit owner authorization**; a documentation or small mechanic edit does not launch it automatically.

**If a test fails:** retain the exact failed *original* case, message, comparison base, tested commit SHA and Actions run. Diagnose a real regression, wrong assertion, invalid setup or infrastructure problem; leave unclear causes **unexplained** until established. A passing newly added test does not cancel a failed existing suite. [Test reliability dispositions](TEST_RELIABILITY_STAGES_1_TO_3_20261027.md) provides deeper guidance. Never waive failures just to show green CI.

**Reuse valid evidence:** disconnection or a new chat does not invalidate tests on unchanged relevant inputs. Changes to code, tests, dependencies or build inputs can invalidate those results. A focused green run still cannot certify the full game or a physical device.

## 5. Keep the documentation and change together

Per [AGENTS.md](../AGENTS.md#standing-documentation-ownership--part-of-every-change-28-october-2026), the implementer owns documentation **throughout development**, not during an unrelated future audit.

- **Reuse the existing guide** instead of creating competing "current" pages. Keep the owning PR/issue and every document created or edited for this feature consistent with approved decisions and actual source.
- Update affected player instructions, including **English and Spanish** when controls or UI paths change. Keep links, code owners, behavior, implementation state and test limits accurate at each recoverable checkpoint and final handoff.
- Preserve dated records and original evidence. Mark superseded plans as historical; don't erase provenance or treat them as pending work. If documentation conflicts remain, describe that gap rather than declaring the feature complete.
- **After an authorized release**, verify the actual merge and publication before updating the maintained release status. A new branch version is not a new public version.

## 6. Commit, resume and integrate without multiplying work

- **Package a logical change coherently.** Format touched files with the locked tool. If runtime/versioned assets change, update `package.json`, lockfile, generated build info, service-worker cache and other build outputs **through the actual build process**; validate together. Documentation-only edits normally need no game-version bump.
- **Save recoverable checkpoints.** A single coherent tree/commit is preferred for a complete update; labeled interim commits are fine when useful. With GitHub API multi-file edits, a tree + one commit + leased-ref update avoids partially published file sets. Avoid temporary CI workflows just for routine formatting.
- **After an uncertain GitHub write or timeout, inspect the remote branch and its Actions run first.** The write may have completed. Don't blindly retry and create duplicate commits, PRs or tests.
- **Reconcile overlapping work** before final validation, and rerun affected checks if source/base/dependencies changed. Don't force-overwrite another contributor's head or publish a knowingly inconsistent build.
- **Leave a brief resume note** in the *existing* PR/issue: branch and SHA; implemented changes; exact passing/failing tests and run links; updated documentation; remaining acceptance and next action. No new mandatory report or approval ceremony for every minor step.

## 7. Be exact about status and permission

| Word | What you may claim |
| --- | --- |
| **Planned** | Approved/intended behavior, not proven to exist. |
| **Implemented** | Written on a named branch/commit. |
| **Tested** | Specific checks passed on an identifiable head; mention tests not run. |
| **Merged** | GitHub confirms it entered the destination branch. |
| **Published / deployed** | The release/Pages job confirms it reached the live site. |
| **Device-verified** | The actual target phone/Chromebook loaded the right version and its relevant behavior was observed. |

The owner authorizes scope. Normal **relevant focused checks** are part of approved engineering work. **Comprehensive browser/game validation, merging and publication require separate explicit approval**. A main-branch update can automatically publish through Pages, so pushing to `main` can be a release action. Don't infer permission from previous merges, historical one-time waivers, an old "next phase" checklist or a passing PR check.

**Definition of done for an implementation candidate:** the approved change works through its real game path, its relevant original regressions are tested or unresolved failures are disclosed, affected documentation agrees, and the PR/issue identifies exact evidence and remaining work. Merged, published and device-verified are **separate later milestones**, not implied by a finished draft.

## Historical context (not active work orders)

The [original October 25–27 mechanic workflow and Stage 5 notes](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/MECHANIC_DEVELOPMENT.md) remain intact in Git history. They explain why this policy was created: Rogue PR #146's extensive integration history; a `dev.108` update spread across four one-file commits; temporary formatter-workflow churn; native Nightmare/Cindermaw/Dreadmaw regression mapping; and an **optional manual** sample of up to ten PRs for investigating test-selection confusion. None of those old stages or examples authorizes new implementation, a new CI system, or broad testing.

Use the [documentation index](DOCUMENTATION_INDEX.md) to locate specific feature contracts and dated evidence. Consult the *live* focused selector and [current development state](DEVELOPMENT_STATE.md) before acting.
