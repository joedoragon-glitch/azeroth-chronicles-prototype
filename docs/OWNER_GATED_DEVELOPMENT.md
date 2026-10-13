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

## Zero-transcript recovery: new-chat default

**Entry point:** [Recovery desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297). When the owner returns in a fresh conversation with a request such as *"I had you working on something and never saw the result"* or mentions a stream interruption, connection timeout, lost response, or conversation-length limit, **do not request a pasted chat, previous answer, ticket number or troubleshooting steps as the default**. Start investigating GitHub immediately.

**Recover in this order:**

1. Read #297 and the owner-gated policy, plus relevant central trackers (#232 and #251 for worldbuilding) and current `AGENTS.md`. Scan current open/draft PRs, linked issues and checkpoint notes, commits, branches, Actions runs and generated artifacts. The most recently updated PR is **not automatically the missing task**.
2. Correlate the latest owner-approved objective, PR/issue activity, status, dependencies and unfinished tests. Identify the **best-supported interrupted task** rather than blindly choosing an unrelated PR. If several candidates exist, first take useful, safe investigative steps. Seek clarification only when a genuinely consequential ambiguity remains after searching the durable evidence.
3. Determine whether a prior remote write succeeded, which SHA is actually committed, what CI checked at that SHA, and what is not saved. An interrupted stream is **not evidence of a failed write**, and chat output never substitutes for GitHub verification.
4. **Continue the already authorized task in this conversation** as far as safely possible: resume the next pending implementation, audit, test or documentation step, fix bounded engineering failures, create a durable checkpoint, and put a concise result/link in the answer. Do not stop merely at a handoff summary if the work can be advanced now. Do not restart completed stages by default.
5. Respect paused work and owner authority: checking status, preserving notes and continuing separately authorized documentation is permitted under the existing pause; a generic recovery request is **not blanket permission** to start previously paused gameplay work, invent new design decisions, merge, deploy or release. A release task can be prepared through the evidence gate but cannot be published without separate explicit approval.
6. If the work was never committed and there is no durable copy, reconstruct it from the stored approved specification and current repository state when feasible. **Do not pretend unsaved data survived**. If both the task identity and needed design are genuinely unavailable from accessible records, explain the specific gap and ask only for the smallest indispensable fact—not an entire chat or a wholesale restart.

**No session requires manual recovery by the owner.** The assistant owns the investigation, GitHub state reconciliation, bounded troubleshooting, and refreshed resume note. This is **on-demand** recovery when asked in a new chat, not uninterrupted background execution while offline.

## Preventing missing results before they happen

For any substantial authorized assignment, **record the task before lengthy work**, not only after it succeeds. Use its existing issue/PR or create a short owning issue if needed, with the owner's objective, approved specifications/constraints, branch or intended branch, progress state and next safe action. Include a pointer in [#297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) when a task lacks an obvious discovery trail. This initial issue note can safely exist **before** there is any code commit.

As soon as meaningful edits exist, push a coherent branch commit **before** long tests, browser/asset runs or operations with high interruption risk. Periodically refresh the owning PR/issue after a meaningful milestone, failure, branch-head change or handoff; never leave completion, next action, or the tested SHA solely in a streaming chat response. For images, audio and generated content, commit usable assets (or retain exact recoverable links and preparation steps) rather than relying on expired session-only files. A failed or timed-out tool call must be checked against remote reality **before** retrying.

The owning issue/PR checkpoint is the authoritative *specific task record*; #297 is the durable *discovery entrypoint*, not a second competing task database. When an interrupted task is recovered, record its current status at the owner, avoid stale duplicate tickets, and link to its next checkpoint. A task is marked **DONE** only after the deliverable exists in a retrievable place and the relevant checks are accurately recorded; posting prose that merely says "done" is insufficient.

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
