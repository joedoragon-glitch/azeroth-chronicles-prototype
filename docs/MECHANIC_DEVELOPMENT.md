# How to develop, test, and finish a game change

**So I Became the Dark Lord's Problem** · Maintained engineering workflow · Reviewed 28 October 2026

**Purpose:** Give the owner, a contributor, or an AI coding agent one practical way to make a safe, complete change without creating duplicate work, corrupting saves, mistaking old plans for instructions, or claiming a draft has shipped. This guide covers new mechanics, corrections, menus, graphics, audio, navigation, balance and other game systems. It is **not** a list of tasks to begin automatically.

**In short:** Understand the approved outcome → locate the real code and existing work → make the smallest coherent change → test behavior and regressions → update its documentation → record exactly what passed → integrate and publish **only when authorized**.

The authoritative development rules are [AGENTS.md](../AGENTS.md). The [development state](DEVELOPMENT_STATE.md) identifies the last verified release and outstanding acceptance; the [architecture guide](ARCHITECTURE.md) locates source owners; [decisions](DECISIONS.md) and feature-specific approved contracts define intended gameplay. **If these sources disagree, investigate and ask about a genuine design conflict; do not choose the newest date, the longest document or an old test expectation by default.** Current owner instructions and approved design determine scope. Source establishes what is implemented; tests and run logs establish what has been verified.

## 1. Before changing anything: determine the actual assignment

**No implicit permission.** An old PR, unchecked task, development stage, test failure or historical document is not an instruction to revive unfinished work. Work only within what the owner has currently asked for. In particular, an authorization to *review documentation* does not authorize changing combat, saves or audio files; an authorization to *implement* does not automatically authorize merging or deploying.

- **Check the current branch and base.** Identify what is on `main`, what is already on the working branch, and whether another open PR or issue owns the same behavior. Use the existing PR/issue when continuing the same work; don't open a new one for every small change.
- **Find the actual owner.** Use [architecture](ARCHITECTURE.md) and inspect the current modules, data/manifest, and feature-specific design. A historical handoff, source comment or generated file can be stale. Do not modify a generated output as the source of truth; find the authoring source and build pipeline.
- **Write a small acceptance statement:** what the player will be able to do, what should happen in a failure/refusal case, and what **must not** change (e.g., saves, existing classes, controls, performance budgets). Keep it in the owning PR/issue or existing feature document, not a new ceremonial report.
- **Check the baseline.** If a related test already fails on the base, record that honestly before attributing it to a new change. Compare the same behavior on the candidate and baseline where possible.

For example, if the task is to repair a Rogue Charm interaction, first find the actual combat resolution path, companion ownership and v4 save boundary. Do **not** implement an older Phase 3 plan merely because its document is detailed; Rogue is already playable in the verified public `dev.208` baseline. The example explains the workflow, not a new Rogue work order.

## 2. Make the smallest complete change

Implement through the **real game execution path**, rather than adding an isolated demonstration that never runs during ordinary play. Keep one owner per rule or state transition; reuse existing events, asset IDs, campaign state and test infrastructure where appropriate.

Before expanding the feature into variants, check its lifecycle:

| Question | What to verify when relevant |
| --- | --- |
| Does the normal action work? | A real player action reaches the real resolver and produces the intended visible/gameplay result. |
| Can it legally fail or cancel? | Missing target, out-of-range action, invalid prerequisites, interrupted charge or declined interaction causes no unauthorized cost, side effect or hidden state. |
| Does it survive changing circumstances? | Target dies, hero or companion falls/recovers, encounter ends, zone changes, pause/resume or restart occurs. |
| What happens on save/reload? | Persistent changes survive v4 restore; temporary state resets; old backups still load when compatibility is required. |
| Does it harm another system? | Other classes, AI/companions, movement, audio, interface, graphics and performance continue to obey their existing contracts. |

Use the rows that actually apply; not every sound-guide edit needs combat or save testing. For an audio-listening page, for instance, important boundaries include playback/stop, browser audio unlock, offline reopen, and **no access to campaign saves**.

**Native setup matters.** A test that forces an enemy into combat by changing `aggro`, rank or level may skip the real rule being tested. Recreate necessary prerequisites through the game's own entry/actions when the contract depends on them (e.g., a Nightmare field opening), and assert the setup before testing the outcome. Do not weaken gameplay rules just to make an unrealistic fixture pass.

## 3. Test the changed behavior, not everything by default

**CI** means *continuous integration*: automated checks for new commits. A **PR** means *pull request*: a proposed change that has **not** necessarily been merged. Tests should cover the player's outcome and protect existing behavior, not merely confirm a table or helper function returns its own expected value.

1. **Choose relevant original regressions.** Look at what files and contracts changed and consult [the existing focused-test selector](../.github/scripts/focused-ci.cjs). Run the smallest meaningful existing suites during development; extend them for new positive and negative outcomes. Examples: changed combat timing may need targeting/charge tests; changed roster rules may need companion and v4 save tests; changed audio playback may need source, looping and browser-gesture tests.
2. **Check real prerequisites and independent expectations.** Derive expected damage/timing from an approved decision, not by copying the implementation's calculation. Do not regenerate immutable historical fixtures from the system under test. Preserve original regression coverage and review any expected-value changes explicitly.
3. **Check high-risk transitions.** Include targeted death/cancellation, recovery, zone exit/reentry, pause, save/reload and relevant device behavior. Keep fast unit/regression checks separate from actual browser/device listening or visual acceptance.
4. **Run focused checks on the final integrated candidate.** Use affected tests, the locked formatter for changed files, and the reproducible build/check as appropriate. `npm run test:quick` is optional convenience, **not** proof that this specific mechanic was tested. The [normal focused workflow](../.github/workflows/focused-deploy.yml) runs selected checks on PRs and publishes to Pages only on eligible successful `main` pushes. The [comprehensive game/Chromium/WebKit workflow](../.github/workflows/pages.yml) is **manual and explicitly owner-gated**; do not launch it as a routine cleanup step.

**On failure:** Record the exact test, base and candidate commit (SHA, the Git commit identifier), message and run link. Distinguish a real product regression from an outdated expectation, invalid setup, infrastructure failure or an *unexplained* result. Correct the cause; never silently waive a failing original suite or relabel it as passed. See [test reliability dispositions](TEST_RELIABILITY_STAGES_1_TO_3_20261027.md) for the fuller classification practice.

**Reuse evidence honestly:** a completed check on unchanged relevant inputs need not be rerun just because a chat disconnected. A code, test, build-input or dependency change can invalidate its evidence, however; verify the final candidate's relevant checks and keep the exact tested head. Focused passing checks do **not** certify a full campaign, every browser, physical phone, or artistic quality.

## 4. Keep source, documentation, and the PR together

Documentation is **part of the implementer's job**, not a cleanup task the owner must remember. This follows the standing [AGENTS.md documentation rule](../AGENTS.md#standing-documentation-ownership--part-of-every-change-28-october-2026).

- **Update before creating.** Reuse the established feature document and existing PR/issue. New files should contain genuinely distinct designs, evidence or a necessary archive/handoff, not a duplicate "current status" page.
- **Check everything the feature touched.** At each recoverable checkpoint and final handoff, reconcile documents created or modified during the feature, plus affected maintained player guidance, architecture, decisions and status links. If UI paths change, update the appropriate English **and** Spanish instructions.
- **Preserve provenance.** If an approach changes, clearly label the old plan as superseded or leave its exact historical record accessible; do not erase dates, fabricatedly rewrite old test receipts, or promote an old checklist into today's work queue.
- **Use the official game identity:** **So I Became the Dark Lord's Problem**. The repository slug and some internal/save keys retain the historical development name for compatibility; see [brand identity](BRAND_IDENTITY.md).
- **Record status precisely.** The terms below are *different*, not interchangeable:

| Status | Meaning |
| --- | --- |
| **Planned** | Intended or approved design; no implementation proven. |
| **Implemented** | Code/asset/document change exists on an identified branch or commit. |
| **Tested** | Named checks actually passed on an identified head; report what was **not** tested. |
| **Merged** | GitHub confirms the change entered its destination branch. |
| **Published / deployed** | The website/release workflow confirms the new build was delivered. |
| **Device-verified** | A person actually confirmed the correct build and relevant behavior on the target device. |

**A green PR is not a release. A successful Pages job is not evidence that every installed PWA accepted its new cache.** When the owner later authorizes merge/publication, verify the actual GitHub outcomes before changing [Development state](DEVELOPMENT_STATE.md). If some related documentation remains contradictory, disclose that as incomplete rather than announcing the feature fully done.

## 5. Commit safely, survive interruptions, and avoid duplicate work

- **Keep changes coherent.** Format only the affected files with the repository's locked tools; avoid unrelated mechanical rewrites. When game runtime assets or versioned inputs change, update `package.json`, lockfile, generated build info, service worker and other generated artifacts **together through their actual build process**. Run the necessary consistency check. Pure documentation normally does not require a new game version.
- **Use checkpoints intelligently.** One logical commit or atomic file-tree update is preferable for a coherent final change; it is not a prohibition on useful, labeled checkpoints. With an API-based multi-file write, a single Git tree + commit + leased ref update minimizes partial publication. Avoid ad hoc workflows just to obtain formatter output.
- **Do not repeat uncertain writes.** If GitHub times out or a tool reports a transport error, first inspect the branch head and any resulting Actions run. The operation may have succeeded remotely. Continue from what exists; don't duplicate commits, tests, or PRs.
- **Protect parallel work.** Recheck newer `main` and overlapping PRs before integrating, resolve actual conflicts, and retest dependencies invalidated by the integration. Never overwrite another contributor's work blindly or force a ref without verifying its expected head.
- **Leave a short, recoverable handoff** in the existing PR/issue: branch and candidate SHA, implemented behavior, tests/run links with failures, documentation changed, outstanding checks, and the next concrete action. Do not create a separate report for every minor step.

An unfinished checkpoint can be useful, but **label it unfinished**. Do not publish a knowingly inconsistent game build to obtain feedback.

## 6. Who authorizes the last steps?

| Action | Rule |
| --- | --- |
| Investigate and propose a plan | Allowed within the current request. |
| Edit source, documentation or tests | Only within the owner's current authorized scope; keep the affected files and PR aligned. |
| Run affected local/focused tests | Normal engineering verification within that scope; avoid unneeded reruns. |
| Run the comprehensive game/browser/device matrix | Requires **explicit owner authorization**. |
| Merge a PR or publish a release | Requires **explicit owner authorization**. Main-branch pushes can trigger automatic Pages publication; don't push/merge in a way that bypasses that distinction. |
| Declare a result working on the owner's device | Only after an actual device test confirms it, including the loaded version. |

The **definition of done** is the approved player-visible behavior implemented, its applicable original regressions passed or explicitly unresolved, the related documents reconciled, and the PR/issue clear about what remains. **Merged**, **published** and **device-verified** are later milestones when authorized and evidenced; they must never be guessed from a draft.

## A concrete mini-example

**Request:** "Make a companion recover correctly after a zone change."

- **Scope:** Confirm whether this is already implemented, what reset/recall should do, and which companion/save systems own it. Avoid restarting an old companion feature proposal.
- **Code:** Fix the real zone-transition and roster path, preserving unit IDs and v4 save compatibility.
- **Tests:** Verify active and reserve companions, fallen units, zone exit/reentry and save/reload; run original related regressions as well as any new targeted case. A mock returning the right array is not enough.
- **Handoff:** Note the exact branch/SHA, tests actually passed, any browser/device gap and updated docs in the existing PR. Ask for merge only when the change is ready and the owner wants to integrate it.

## Historical evidence and further reading

The [original 25–27 October workflow and Stage 5 pre-CI notes](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/3765ed3bbbf67385561ba47b46887eda6ccf3e7c/docs/MECHANIC_DEVELOPMENT.md) are retained intact in Git history. They document the Rogue PR #146 commit-batching example, dated `dev.108` packaging and temporary formatter workflow, specific Nightmare/Cindermaw/Dreadmaw regression mappings, and an **optional manual** sample of up to ten PRs for diagnosing test-selection confusion. Those are historical rationale and examples, **not ongoing Stage 5 mandates, new CI jobs, or permission to revive old mechanics**.

For current rule/test ownership, prefer the live [focused selector](../.github/scripts/focused-ci.cjs), [agent policy](../AGENTS.md), [test reliability analysis](TEST_RELIABILITY_STAGES_1_TO_3_20261027.md) and [development state](DEVELOPMENT_STATE.md). The [documentation index](DOCUMENTATION_INDEX.md) helps locate feature-specific contracts and historical receipts.
