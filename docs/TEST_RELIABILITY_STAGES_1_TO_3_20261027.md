# Azeroth Chronicles — Test Reliability and Regression-Drift Repair

**Approved scope:** 27 October 2026. **Owner authorized documentation, a draft PR, implementation of Stages 1–3, targeted/focused verification, then an independent audit.** Stages 4–5 are deferred pending reassessment. **No merge, deployment, comprehensive game matrix, or full browser matrix is authorized.**

## Mission and decisions

Tests must detect real gameplay regressions without regularly blocking development because they assume obsolete contracts, construct impossible campaigns, or misclassify environmental failures. A first failing test is not necessarily a poor test: identify the cause before changing gameplay or expectations. The success criterion is *accurate evidence and fewer avoidable repeat failures*, not artificially green CI.

The game remains a **multi-file GitHub Pages/PWA**, with the current runtime as source of implementation facts, owner-approved behavior as design authority, immutable historical artifacts as preserved evidence, v4 save compatibility, and Canvas/PixiJS safeguards intact. Do not merge to `main`: a main push automatically initiates the focused publishing workflow. Work here must not alter the combat simulation, balance, saves, art, release packaging, or user-visible behavior.

### Canonical routing (avoid duplicate test frameworks)

- Current operating policy: [AGENTS.md](../AGENTS.md); focused suite ownership: [`.github/scripts/focused-ci.cjs`](../.github/scripts/focused-ci.cjs) and [`tests/ci-focus-policy.test.cjs`](../tests/ci-focus-policy.test.cjs).
- Existing change workflow: [`docs/MECHANIC_DEVELOPMENT.md`](MECHANIC_DEVELOPMENT.md). Earlier diagnosis: [`AUDIT_INTEGRATION_REPAIRS_DEV175.md`](AUDIT_INTEGRATION_REPAIRS_DEV175.md).
- Predecessor documentation plan, *not independent current authorization*: [`DOCUMENTATION_GOVERNANCE_DEEP_AUDIT_20261025.md`](DOCUMENTATION_GOVERNANCE_DEEP_AUDIT_20261025.md), Track B T0–T5. This PR implements a bounded portion instead of recreating its registry.
- Ordinary PRs execute relevant focused checks and the non-deploying reproducible build gate. Full suite and broad browser matrices remain explicitly opt-in.

## Evidence ledger (historical, keep exact refs)

1. [PR #516](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/516), [failed run 40454613366](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40454613366): `ranger-max-range-goblin-response.test.cjs` failed an expected hit at 350 units. The earlier fixture assigned Ranger level from its enemy and measured HP before engagement; engagement scaling can invalidate the damage comparison. Later repair compares HP after launch and uses intended level-4 Ranger. An incorrect fixture observation and genuine goblin Rogue-state issue were separate.
2. [PR #509](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/509), [failed run 40452383916](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40452383916): four suites: `class-passives` manually used illegal Expedition ranks; `cooldown-only` and `hero-skill1-stage1` expected pre-passive Ranger cooldowns; `sprite-scope` had stale source evidence. The corrected PR later passed 33 focused suites.
3. [Pixi run 40183421748](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40183421748) timed out awaiting a renderer-state property; [run 40183804547](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40183804547) expected `context-loss` but saw `render-exception`. Neither failure can safely be declared a false positive without browser diagnostics. See [#460](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/460).
4. [Issue #461](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/461): a whole-file renderer SHA difference invalidated the sprite evidence snapshot despite not necessarily changing the sprite canon. Do not weaken the canon guard or blindly regenerate receipts.
5. [Dev.175 integration repairs](AUDIT_INTEGRATION_REPAIRS_DEV175.md): historical invalid field-opening fixtures and missing source-to-regression mappings were **partly repaired**; do not treat them as absent or assume all later tests are sound.

**Baseline at branch creation:** `main` `740c4549cabb87455e0d9af8369e52a88cd06ad1`, package `0.9.1+snapshot.dev.197`. This is a pinned development checkpoint, not a perpetual statement of current `main`. Recheck the base and candidate before acceptance.

## Failure classification contract

A failure report identifies **test path/case, changed paths, candidate HEAD, comparison base, environment, explicit failure text/exit reason, and next investigation**. Prefer structured machine-readable output (from an optional file or CI job summary) *in addition* to console diagnostics, without hiding or truncating the original trace. Never claim automatic root-cause classification from a stack trace.

Disposition after investigation must be one of: `introduced-runtime-regression`, `inherited-runtime-defect`, `obsolete-reviewed-assertion`, `invalid-or-nonnative-fixture`, `snapshot-or-evidence-maintenance`, `environment-or-lifecycle`, `selector-coverage-gap`, `unexplained`, or `not-applicable`. A machine may label `unexplained` before manual review; only evidence can move it to a stronger category. A failure that also occurs at base remains visible, not silently waived.

Retain **both** positive and negative behavioral controls when reconciling a fixture. Existing native suite failures cannot be closed by a new passing diagnostic copy.

## Implementation scope: Stages 1–3

### Stage 1 — Actionable CI failure diagnostics (P0)

**Owners:** `.github/scripts/focused-ci.cjs`; dedicated policy tests. Keep the existing selector and workflow, do not add another test registry.

- Preserve runner output per suite, exit status, signal and timing; annotate exactly which *selected* test failed. Add candidate/base/changed-source provenance.
- Emit a concise failure summary, and when GitHub Actions supports it, a readable job summary; where practical output a machine-readable report for independent inspection.
- Preserve nonzero exit for actual failures and for mapping integrity failures; never auto-mark stale, flaky, or inherited as passed. Distinguish a test assertion from an execution/timeout/launch error without claiming root cause.
- Confirm that a deliberately failed test reports the correct source, fails CI, and does not conceal the original error. Don't rerun large suites to test reporting.

**Gate:** focused unit/policy tests validate failure and success output, exact head/base provenance, environment and no automatic gameplay change.

### Stage 2 — Native and self-validating fixtures (P0)

**Owners:** existing `tests/helpers/` modules and a small number of representative original tests; no gameplay code.

- Audit native prerequisites (field admission, legal rank, launch/engagement scaling, distance/line of sight and actor role) in recurrent failure cases.
- Add lightweight shared helpers or explicit precondition assertions where they remove real duplication; avoid creating a universal game-state factory or inventing special test-only rules.
- The helper must reject invalid setup loudly *before* behavioral assertions, and the original suite must still exercise the actual native attack/save boundary.
- Protect a reviewed positive case and a negative countercase. Never rewrite historical save fixtures or alter rules to satisfy tests.

**Gate:** deliberate invalid setup fails with a diagnostic prerequisite message; valid realistic setup exercises its original behavior; current Ranger/class-passive fixes remain intact.

### Stage 3 — Source/test dependency coverage (P0)

**Owners:** `.github/scripts/focused-ci.cjs` and `tests/ci-focus-policy.test.cjs`; preserve scope-aware focused tests.

- Audit mappings for cooldown/passives, field-opening and healers, projectile/hostile AI, renderer/graphics evidence, Archive reference, saves and browser-only acceptance.
- Source-only changes to covered mechanics select the relevant **original** suites; a missing mapped file remains a hard error.
- Explicitly classify uncovered relevant changed sources; do **not** report architecture-only fallback as adequate behavioral coverage. Existing policy for documentation/assets may remain warning-only with clear semantics.
- Changed `*-browser.test.cjs` files that are outside approved narrow automatically runnable files must appear as **deferred manual browser acceptance**, not silently disappear. No automatic expansion to a browser matrix.
- Add tests for selector behavior on change scenarios rather than expanding the test count indiscriminately.

**Gate:** source-only changes protect mapped regressions; previously-uncovered source path is actionable; a changed browser suite is reported as deferred/manual; no new broad browser or whole-game execution.

## Stage 1–3 independent audit (mandatory before completion claim)

Audit the *final committed candidate*, not an earlier passing branch. Inspect the complete PR diff, preserved gameplay files, selective CI policy, diagnostic contract, failure-path tests, native fixture outcomes, and source-to-test coverage. Cross-check at least the four historical categories above. Confirm that assertions were not broadly loosened, snapshots were not regenerated blindly, no gameplay/asset/save/runtime behavior changed, and no deployment occurred.

Record results as **passed / failed / not run / needs further verification** with exact SHA, run IDs, selected suite counts, exceptions and links. Reproduce a deliberately failing probe in an isolated lightweight test (never in game production), and verify that the runner fails. Review GitHub Actions status on the exact PR head and whether it used a synthetic merge tree; distinguish a green run from unperformed device/browser acceptance.

**Stage 1–3 exit criteria:** independently evidenced diagnostics, guarded fixtures, selector gap detection, passing applicable focused checks and a written residual-risk audit. If any gate fails, leave PR draft with a precise handoff; do not claim finished.

## Stages 4–5 (explicitly deferred for reassessment)

**Stage 4 — Expected-value / evidence governance (proposed, not approved for implementation).** Inventory source-hash and numeric-contract drift, decide whether assertions are design-derived, independently calculated, current snapshots or immutable historical proof. Develop minimal provenance reviews; protect visual canon and old saves. Reassess *after* Stage 1–3 outcomes.

**Stage 5 — Lean pre-CI development procedure (proposed, not approved for implementation).** Before candidate publication: verify changed contracts, native preconditions, original affected suites, expected-value review and exact build on current base; avoid duplicate checking of unchanged results. Measure repeat failures and diagnostic overhead. Reassess scope and necessity after Stage 1–3.

## Handoff for another session

Open this PR and read this document; recheck `main`, PR branch head and CI. Then inspect changed `focused-ci.cjs`, policy tests, selected fixture helpers and original tests. Continue on **this PR**, not a parallel test map. Read audit notes at document end or PR comments for exact remaining work. Do not interpret this document as approval to merge, deploy, alter gameplay or run the manual full suite. Never use a previous task approval for a future stage.

## Audit results / status

- Stage 1: pending implementation.
- Stage 2: pending implementation.
- Stage 3: pending implementation.
- Final review: pending; exact results and residual risks to be written here after implementation.
- Stage 4 / 5: deferred until owner reassessment.
