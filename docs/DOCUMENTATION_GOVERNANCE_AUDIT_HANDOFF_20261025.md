# Documentation and Test Governance Audit — Future-Chat Handoff

**Status:** Review-only proposal. **No documentation remediation, test/fixture changes, gameplay changes, merge, deployment or full-suite authorization is granted by this handoff.**

## Read first

- [Complete revised deep audit and implementation plan](DOCUMENTATION_GOVERNANCE_DEEP_AUDIT_20261025.md). Read the *whole report*, including its methodology, confirmed risks, counterevidence, limitations, priority ordering, and **Track A (Documentation Authority & Discoverability)** and **Track B (Test Governance & Regression Drift)**.
- This report's **immutable audit baseline** is `e4e8234b5f784ddc9492fe79d956fd0a696b12af` (dev.175, 24 October 2026). Its 25 October plan amendment includes later contextual evidence, **not a fresh end-to-end audit**. Statements in the report about no GitHub changes describe preparation of the original audit, before this documentation-only draft.
- This handoff and report live **on a draft PR branch**, not on `main` until independently approved and merged. Access the PR or its branch explicitly in a new chat.

## Required first stage when work actually begins: read-only re-baseline

1. Fetch latest `main` commit, package/build identity and actual GitHub Pages workflow outcome; distinguish merged source, successful deployment, installed-client updates and owner/device acceptance.
2. Inspect open, merged and superseded relevant PRs. In particular reconcile older draft documentation [PR #435](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/435), any subsequent documentation changes and newer test-governance fixes. Do **not** copy stale current-version or outstanding-work claims.
3. Recheck the report's findings against `README.md`, `AGENTS.md`, `docs/DEVELOPMENT_STATE.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/ARCHITECTURE.md`, actual workflows, current source code and tests. Mark each finding **still valid / resolved / partially resolved / changed / unverified**, with current SHA evidence. Preserve historical and frozen records.
4. For Track B, first inspect the **existing** `.github/scripts/focused-ci.cjs`, `tests/ci-focus-policy.test.cjs`, current regression tests and prior drift repairs, including `docs/AUDIT_INTEGRATION_REPAIRS_DEV175.md`. **Do not create a second CI test map.** Reproduce and classify real failures by exact PR number, head/base SHA, job/run and tested assertion; no blind expectation changes or waiver of genuine bugs.
5. Present a reconciled, **small-step implementation proposal** and obtain the owner's explicit authorization before edits. Documentation work and tests/fixtures/CI changes remain independent review gates.

## Non-negotiable boundaries

- The game is a **multi-file GitHub Pages/PWA application**. Do not reintroduce a single-HTML packaging constraint.
- Preserve gameplay, v4 save compatibility, Canvas fallback, PixiJS trial safety, registered art/audio and historical technical evidence.
- A draft PR is **not** permission to merge. A merge into `main` can automatically deploy GitHub Pages after focused checks. Do not dispatch broad browser/full-game tests or deploy without the owner's explicit separate approval.
- This audit is **not** proof that every historic sentence was semantically verified, nor proof that ordinary initial CI failures are negligent. Distinguish inherited failures, invalid fixture assumptions, stale expectations and actual regressions.

## Suggested continuation request

“Read the full revised documentation/test-governance audit and handoff in the GitHub draft PR. Re-baseline its findings against latest `main` and outstanding PRs. Report which risks still exist and propose the smallest safe first stage; do not implement, merge, deploy or run broad tests without authorization.”
