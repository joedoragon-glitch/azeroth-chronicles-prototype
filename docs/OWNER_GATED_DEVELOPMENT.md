# Owner-gated development and recovery policy

**Approved operating principles:** 12 October 2026. **Scope:** all future Azeroth Chronicles development, including the planned five-region worldbuilding/community snapshot. This is a working-process rule, **not** approval to resume paused gameplay work, change canon, merge, or publish.

## Purpose and authority

The owner is the creative director and sole release authority. AI assistance handles routine technical design, implementation, testing, failure diagnosis, and checkpoint upkeep **while an authorized working session is active**. It escalates genuine creative conflicts, material changes to approved scope, irreversible/data-loss risks, and release decisions. It must not turn an engine limitation into an unannounced dilution of an approved design.

The present development pause and the **single combined worldbuilding release gate** in [#232](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/232), with audit [#251](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/251), remain in force until expressly changed by the owner. Preserve the distinction between **current `main`**, **unmerged implementation**, and **approved future canon**. The director's ballot records creative approvals; implementation and release need their own evidence.

## Non-negotiable working rules

1. **GitHub is the durable source of truth.** Every meaningful implementation stage ends in a recoverable committed branch, PR, or documented checkpoint. Never treat uncommitted local edits, an uploaded Git blob without a commit, chat text alone, or an unverified test claim as a recovery point. Preserve rollback references and relevant original assets.
2. **Interruptions are safe.** If a session disconnects, a tool fails, or CI fails, leave the last verified checkpoint in place. On resumption, inspect GitHub's actual branch head, PR/issue checkpoint, and associated CI before modifying anything. Do not replay already successful writes, rerun unchanged passing tests, force a branch, or delete a recovery path simply because the chat ended.
3. **Routine engineering stays with the implementer.** Once a scoped design is approved and development resumed, choose appropriate modules, bounded tests, safe retries, and reversible implementation tactics without asking the owner to supervise each step. Escalate changes that alter story/canon, mechanics in a way the specification did not authorize, saved progression, player-facing identity, release scope, or accepted risks. Never conceal a missing feature behind a plausible-looking substitute.
4. **Readiness is evidence, not confidence.** For the exact proposed head and artifact, separate what is committed, what passed automated tests, what passed independent/manual/device verification, what remains untested or failing, and the release recommendation. A green check for one head does not certify another; a merged PR is not the same as a live deploy or human acceptance.
5. **Only the owner authorizes integration and publication.** Do not merge or push to `main`, enable auto-merge, trigger a publishing workflow, create a public release, publish assets, or otherwise deploy without explicit approval for the specific release candidate. Prior authorization to design or implement is **not** blanket release authorization. A draft PR and branch may hold unfinished work without making it live. Preserve the project's one-combined-release plan unless the owner changes it.
6. **No continuous unattended coding promise.** Chat sessions do not keep implementing or self-recover after disconnection. Already-started GitHub Actions may continue independently. If a check has not completed, record it as pending. Resume from GitHub when the owner next requests project work; scheduled checks require separate setup and are not assumed.
7. **No artificial urgency.** Pauses of hours, days, or months are acceptable. Technical interruptions do not require the owner to intervene. No arbitrary deadline, forced questionnaire pace, or routine troubleshooting assignment to the owner.

## Four-stage milestone

### Stage 1 — Director's ballot and approved creative specification
Finish the questionnaire at the owner's pace. Record each approved decision, unresolved choice, and non-goal in the existing authorial issue structure. Audit bosses, captains, regions, and the ending against implemented engine capabilities **before** promising corresponding mechanics. An unresolved design conflict remains open rather than being guessed.

### Stage 2 — Authorized implementation and verification
Only after the pause is lifted, work from the approved specification on isolated branches/draft PRs. Preserve stable IDs, gameplay, saves, procedural visual canon, and current assets unless an approved change calls for otherwise. Commit coherent checkpoints before long tests and before handoffs. Compare source to `main`, inspect dependencies, and fix or clearly record failed checks. Do not silently merge overlapping worldbuilding branches or publish partial region updates.

### Stage 3 — Snapshot readiness review
Assemble the **exact** integrated candidate. Run the relevant full regression matrix and an independent second-pass audit. Present (a) implemented items with PR/commit evidence, (b) passed tests with links and exact SHA, (c) failures, omissions and unverified device/human checks, (d) save/rollback state, and (e) a clear release / hold recommendation. Do not label the snapshot ready if blocking criteria are unresolved.

### Stage 4 — Owner's explicit release decision
Present the candidate SHA, artifact/version, release notes, caveats, testing evidence and rollback reference. Wait for explicit owner authorization to merge/deploy. Only then execute and verify the normal GitHub Pages/PWA release workflow, exact published build and live smoke checks. The owner may defer without explanation or urgency.

## Minimal checkpoint / resume note (keep in the owning PR or issue)

- **Objective and approved specification:** issue links, scope, unresolved creative decisions.
- **Baseline and current work:** `main` SHA; feature branch, PR, latest committed head SHA; key dependencies.
- **Completed:** actual changes/behaviors committed, not merely proposed or partially drafted.
- **Evidence:** tests and workflow URLs tied to the head; clearly mark PASS, FAIL, PENDING, NOT RUN, and human/device review.
- **Open risks and blockers:** reproduction details, uncertainties, rollback/save compatibility.
- **Next safe action:** smallest continuation step; whether it needs owner input. Record **NO MERGE / NO DEPLOY** until specifically authorized.

## Current enforcement limitation

As inspected 12 October 2026, the existing GitHub Pages workflow is triggered by a push to `main`, and the `main` branch is not protected. Therefore **the present technical safeguard is to keep unauthorized changes off `main`**. This policy file alone does not technically prevent a human or other integration from publishing. A separately approved future hardening task can add branch/release approval controls and verify them; **do not** silently change deployment plumbing during this documentation-only policy adoption.
