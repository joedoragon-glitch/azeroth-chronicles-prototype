# Founding Explorers — execution record and go/no-go worksheet

**Draft-only working protocol.** Prepared 2026-10-25. Related: `FOUNDING_EXPLORERS_IMPLEMENTATION_HANDOFF.md` and `FOUNDING_EXPLORERS_LAUNCH_PREP_KIT_20261025.md`. Do not interpret unchecked items as passed. Do not merge, deploy, publish an invitation, or run a full test suite based on this document.

## 1. Rebaseline before any test

- Date/time/time zone:
- `main` commit SHA:
- PR #456 head SHA:
- Any relevant merged changes since last review:
- Relevant unmerged PRs and integration choice:
- `package.json` dev version:
- Actual GitHub Pages version/build verified separately:
- Test device(s), OS/browser/version:
- First-run vs existing save:
- EN/es-419 selection:

The prior source baseline was `e3c78266b28f3325d2afdcb76ae849fcff306deb` (dev.185). **Do not reuse as proof of the latest state.**

## 2. Bounded automated checks (only if checkout and runner are available)

From the root of a **verified matching checkout**, inspect `package.json` and any `AGENTS.md` test policy first. Suggested individually scoped commands:

```sh
node tests/companion-onboarding-ui.test.cjs
node tests/game-menu-ui.test.cjs
node tests/field-onboarding.test.cjs
```

| Check | SHA / environment | Exit status | Assertions or observed failures | Evidence |
| --- | --- | --- | --- | --- |
| Companion onboarding EN/es-419 | NOT RUN | NOT RUN | — | — |
| Game menu EN/es-419 | NOT RUN | NOT RUN | — | — |
| First field encounter | NOT RUN | NOT RUN | — | — |

These tests are not a substitute for first-session usability or phone/browser acceptance. Do not infer a green result from the mere existence of test files. If tests are unavailable, record **BLOCKED** and the reason.

## 3. Player-path walkthrough — record actual observations

| Gate | English desktop | Español desktop | English phone | Español phone |
| --- | --- | --- | --- | --- |
| Fresh first launch and language choice | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Choose class and Normal/Standard | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Find Captain and understand next objective | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Meet companions and practice Recall | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Move, interact and try a first field encounter | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Recover or exit without unintended save loss | NOT RUN | NOT RUN | NOT RUN | NOT RUN |
| Find forum reply/optional PM route | NOT RUN | NOT RUN | NOT RUN | NOT RUN |

For each failure, record: exact steps, expected vs actual, device/browser, language, build SHA, severity (**blocker**, **major**, **minor**, **cosmetic**), sanitized evidence, and issue owner. Do not collect a participant's save, personal details, screenshot or diagnostics by default.

## 4. First-player script (not published)

“Please try the game for about 10–20 minutes. Choose whichever class you like and Normal/Standard difficulty. Explore naturally. If you get stuck, you can stop; that itself is useful feedback. You do not need to win, share a screenshot, export a report, or give us personal details. Tell us where you reached, what you liked or found confusing, and what you would change.”

Only explain controls that have been checked against the currently deployed version. Do not direct a returning player to overwrite an existing save.

## 5. Forum preflight (owner-supplied destination required)

- Forum URL and thread title: **PENDING OWNER**
- Posting account/permissions and whether public replies work: **NOT VERIFIED**
- Whether optional private messages exist: **NOT VERIFIED**
- Whether EN/es-419 in one thread is appropriate for forum norms: **PENDING**
- Approved invitation text and language order: **PENDING OWNER**
- Links verified against actual deployed Pages version: **NOT VERIFIED**
- Public acknowledgment is separately opt-in: **DRAFTED, NOT OPERATIONAL**
- Response expectation (~twice weekly) and moderator escalation: **DRAFTED, NOT OPERATIONAL**

**Never publish on behalf of the owner without explicit authorization.**

## 6. Launch decision record

- **GO** only when the owner has approved the forum destination and final copy, the actual public build and device walkthrough have sufficient evidence, and any first-session blocker has been fixed or explicitly accepted by the owner.
- **NO-GO** if the public link fails, core first-session navigation or phone controls are unusable, an existing save is at risk, or the feedback route is not available.
- **CONDITIONAL** for cosmetic/localization polish that does not prevent honest feedback, with explicit owner acceptance and clear player-facing limitations.

Decision: **PENDING**. Approver: **PENDING**. Date: **PENDING**. Evidence links: **PENDING**.

## 7. Safe future-agent instructions

Continue on draft PR #456 for documentation and Explorer-only work. Check current GitHub state every time. Keep other audio, VFX, renderer, critical and boss work independent. Run only narrowly scoped tests permitted by the standing project policy. Avoid broad test matrices, merging, deployment, public posts, competitive tracks, telemetry or player-credit commitments without separate approval. Do not mark an acceptance item PASS unless its evidence exists.
