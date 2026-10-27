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

## Stage 1–3 implementation and independent post-implementation audit

**Review date:** 27 October 2026. **Implementation branch:** `test/reliability-stages-1-3-20261027`. The stage-1-to-3 implementation was reviewed separately from writing its code, including failure logs, selected original suites, modified-source inventory, CI policy and deployment behavior. No gameplay/runtime production module, balance file, v4 save field, art asset, asset manifest, PWA release file or player-facing interface was authored by this PR.

### Stage 1 — implemented; reporting gates passed

- `.github/scripts/focused-ci-report.cjs` adds a compact report containing exact tested checkout SHA, comparison base, changed paths, selected suites, uncovered changes, deferred browser acceptance, Node/platform, timing, per-check exit/signal, and the first useful failure message. The original full stdout/stderr is still replayed to the Actions log. Unknown root causes remain `unexplained`, never automatically "outdated."
- `.github/scripts/focused-ci.cjs` now reports each failing suite explicitly and fails if any check fails; the existing Node/syntax and focused test paths remain the execution owners.
- `.github/workflows/focused-deploy.yml` archives `azeroth-focused-ci-report.json` as a 30-day Actions artifact even after failing checks; CI job summaries remain readable without a file download. The publisher still runs **only on successful main pushes**, never on this draft PR.
- `tests/focused-ci-report.test.cjs` checks passing/failing records, exact provenance, real failure-text extraction, missing regressions, uncovered source/fixture rejection, and deferred browser status. The deliberately failing coverage probe is caught within the test; no real gameplay test is waived.

**Caveat:** automatic classification is deliberately not attempted. Capturing test output with synchronous child pipes can delay display until that individual test ends and imposes a bounded 32 MiB per-stream buffer. Original traces remain available; this is not a zero-cost stream-telemetry framework.

### Stage 2 — implemented; native fixture gates passed

- New `tests/helpers/native-fixture-contracts.cjs` enforces legal Expedition support maxima, finite/unblocked native LOS geometry and active-actor membership/level before basic projectile testing. Its arrow helper compares enemy HP **after engagement at projectile release**, preventing pre-engagement HP scaling from posing as damage.
- The original `class-passives.test.cjs` uses legal current Expedition maxima rather than inventing rank 5.
- The original `ranger-max-range-goblin-response.test.cjs` exercises native level-4 arrows, legal Vale 350/400/440/449/450-unit lanes, and the real first-kill field admission helper. Its anchored-hit scenario was revised only after checking the newly merged design in [PR #521](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/521): **fresh damage while already anchored** opens tactical thinking with the existing cooldown and does not force an immediate chase. Pre-arrival damage, unhit holds, summons, captains and ringleaders remain protected, including the original and newly authored negative controls.
- `tests/native-fixture-contracts.test.cjs` proves explicit failures on illegal Expedition names, invalid coordinates, fake targets and incorrect Ranger level, plus a real 450-unit arrow hit.

**Limitation:** the selected fixture work is representative and contract-based, not a claim that every historical game-state fixture in this large repository is now native.

### Stage 3 — implemented; selector gates passed

- The existing `focused-ci.cjs` source-to-original-test mapping now protects class-passive and cooldown regressions when `hero-combat`, `combat`, `engine`, `rules`, `save`, `progression` or `boss-combat` change. These paths were reconciled with actual [PR #509](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/509) file inventory.
- Native Ranger range and newly merged Rogue-under-fire integrity cases are selected on their real combat/engine dependencies. Critically, a later source-only change cannot drop the `rogue-anchor-under-fire-integrity.test.cjs` original merely because that suite was added in a different PR.
- Sprite-scope evidence follows its actual SHA-input files (`visuals`, `world`, `rules`, `data`, `sprites`, `renderer`) and its owning audit script. `archive-reference.test.cjs` follows corresponding rule/reference changes.
- Previously uncovered relevant source or shared fixture-helper changes are **hard coverage errors**; an architecture fallback is not behavioral coverage. A changed unapproved `*-browser.test.cjs` is explicitly listed as **manual acceptance deferred**, never claimed as having run.
- `tests/ci-focus-policy.test.cjs` verifies those paths, unavailable mapped files, opt-in full suites and current focused workflow.

**Limitation:** dependency mapping is still manually curated. CSS/visual, all audio/environment integrations and other future code may require additional mappings when their owning changes are authorized. No general-purpose static dependency graph was introduced.

### Actual focused evidence and failure forensics

| Run | Exact evidence | Disposition |
| --- | --- | --- |
| [40463668569](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40463668569) | Branch `634c7bf0`; synthetic tested tree `113ced91`; 6 selected suite files and reproducible build | **Pass** (early narrower candidate) |
| [40463982437](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40463982437) | Branch `e9faff7f`; tested tree `6e2179a5`; selected Ranger suite failed `real long-range hit breaks inert anchor` | **Failed honestly**; obsolete anchor ordering, not waived |
| [40464635599](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40464635599) | Branch `76c721d9`; synthetic tree `21440f0d`; 27 selected suite files and reproducible build | **Pass** after #521 contract reconciliation |
| [40465015714](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40465015714) | Branch `8dde4c63`; synthetic tree `92cc92ba`; 27 selected suite files and reproducible build | **Pass**, includes native first-kill admission and fixture-helper coverage hard gate |

An important concurrent development event: [merged PR #521](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/521), merge commit `7f15b347b9f5b576e006d00264663835c15dbea1`, corrected #516's unconditional Ranger-hit anchor cancellation. The early Ranger test recorded damage *before* inventing the anchor and still expected immediate pursuit. GitHub ran it against the accepted merged behavior and it failed as it should. We examined the specific source diff and reviewed new original `rogue-anchor-under-fire-integrity` regression before changing the older fixture. Its **positive and negative behavioral contracts were strengthened**, not deleted. This is exactly the kind of drift the project aims to prevent.

**Final integration step:** merge the accepted `main` commit `7f15b347` **into this draft feature branch only**, preserving all #521 native source/test files; this is *not* a merge of this PR into production. Reverify the post-integration feature checkout with focused CI. Record the exact resulting final-run ID and pass/fail in the PR Conversation so a later chat can recover it without reproducing all checks.

### Code-review safety findings

- **No author-created production gameplay changes:** PR's own patch comprises CI/test helpers, selector, workflow artifact step, test modifications and this document. Check the GitHub PR changed-file list, not a transient merge tree that also contains upstream accepted gameplay.
- **No suppressed guards:** missing files and unmapped relevant sources fail closed; deliberately incorrect fixture setup fails; original cooldown and sprite contracts retain their independent assertions; new Rogue negative checks remain in `main`.
- **No full-suite violation:** automatic focused workflow only. The comprehensive manual game/Chromium/WebKit workflow was neither changed nor dispatched. Browser/device/Pixi certification has **not** been performed.
- **No production release:** draft PR CI publisher skipped; successful focused build is not a Pages release. The final branch can be reviewed and tested without changing `main`.

### Remaining risks and deferrals

1. Changes to `main` after the tested merge SHA require fresh applicability review. A green synthetic PR check covers its *exact checkout only*.
2. The test selector is not a complete semantic dependency system. New modules or fixtures require reviewed mappings; some historical tests still use artificial state outside the bounded cases repaired here.
3. Visual-browser lifecycle faults (Pixi #460), device acceptance, and earlier source-fingerprint evidence reviews remain independent feature issues; this work improves diagnostics but does not resolve them.
4. No dedicated whole-repository formatter run, full regression run, browser matrix or physical-device test was claimed. Relevant syntax and selected regression checks plus offline-ready reproducible build were checked by the referenced Actions runs.
5. **Stages 4 and 5 have not been implemented.** Reassess their necessity and specific acceptance conditions with the owner **after** the Stage 1–3 audit and final exact-head evidence.

### Independent audit decision

**Implementation scope and preservation: PASS on reviewed changes. Original-incident regression and native fixture gates: PASS on the latest pre-integration Actions run. Exact final integration head: subject to the subsequent focused run linked in PR #522.** Leave the PR draft; do not merge or deploy before an explicit owner decision.

