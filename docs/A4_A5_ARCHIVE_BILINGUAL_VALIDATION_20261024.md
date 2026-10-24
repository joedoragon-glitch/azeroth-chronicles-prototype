# A4–A5 — Archive bilingual interface and validation

**Branch parent:** A2–A3 draft PR #432 (`archive/a2-a3-bookshelves-reading-20261024`), stacked on N1a #430 and N1 #428. None of these changes may merge or deploy independently until the owner explicitly approves an integration plan. Reference: issue #427.

## A4 implementation

- The existing signed author master remains the sole source of the **53 EN/ES narrative pairs** and the three conditional supplements. Neither the manuscript nor its checksums have been changed.
- New `PrototypeArchive.translateArchive` is a separate **non-literary technical/controls catalog**, not an editor for author-approved story. It contains the complete eight-shelf labels, evidence-gated ninth shelf, listed question headings, navigation controls, introductions and a growing set of Spanish technical explanations. Stable game-facing topic IDs and English source data remain unchanged.
- The game shell only applies Archive-specific translations inside `archive-index`, `archive-shelf` and `archive-reading`; other menus retain their existing global `tr` routing.
- The translator shields author-final Spanish passages before applying technical phrase translations and restores them verbatim afterwards. Live numerical values are retained and not recalculated by localization.
- All buttons remain accessible via existing keyboard, controller and touch menu handling. D04/evidence/throne prerequisites are never modified by presentation.

## A5 verification scope

- `tests/archive-a4-a5.test.cjs`: bilingual production-shell rendering, controls/reading, exact author narrative and immutable live numerical statistics, read-only access and ninth-shelf evidence gate.
- `tests/archive-a5-browser.test.cjs`: opt-in Playwright route through actual Keeper in the Archive, with English/Spanish menu use, signed-evidence unlocking, keyboard Escape, full answer/optional figures and 1280×800 desktop, 375×800 phone portrait, 844×390 phone landscape. The test intentionally does **not** belong to the automatic focused CI/browser matrix.
- Broader related tests: `archive-a2-a3`, `archive-reference`, `keeper-archive`, `n1-approved-copy`, `n1-bilingual-shell`, `quest-narration`, `menu-foundation-ui`, save and PWA build.
- Repository policy: `.github/workflows/focused-deploy.yml` does **not run browser matrices automatically**. Playwright/browser and hardware/screen-reader certification require a separate manual, owner-opted test environment. Do not call unrun browser checks a pass.
- Preserve save v4 schema, TRUE Keeper availability, signed ledger `keeperEvidence`, `throneClaimed`, P07 resource mode, combat and skill figures.

## Implementation and available verification — 24 October 2026

- **A4 implemented for scoped controls and substantial technical text:** Spanish shelf names and count labels, topic headings, evidence-only ninth shelf, three navigation controls, complete fixed three-class skill summaries, selected condition/combat/progression paragraphs, dynamic technical labels, and a keyboard-focusable `role=document` answer region with bilingual ARIA label. Author-approved EN/ES narrative is restored verbatim around technical substitutions. Localized numerical explanations read the same current game formulas and values.
- **A4 limit:** Long procedural boss/companion live-reference answers include complex variable English clauses beyond the curated translations. The full human editorial coverage of every technical phrase is not certified, and this draft must not be called 100% Spanish-complete until an exhaustive visible-copy audit verifies those entries.
- **Focused CI:** [run #40089769221](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40089769221) passed **21 relevant Node/production-shell suites** and the reproducible build, including the A4 bilingual/approved-copy/numeric integrity test. The later workflow-registration run [#40089922867](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40089922867) failed solely in `tests/ci-focus-policy.test.cjs` because a standing consent sentence was missing in AGENTS.md (also absent on current main). A one-paragraph owner-consent statement has now been restored on this draft without weakening the test. This policy change requires fresh CI confirmation.
- **A5 browser code prepared, not executed:** `tests/archive-a5-browser.test.cjs` covers direct Keeper entry, evidence gating, Spanish/English answers and live figures, keyboard Back, desktop and phone portrait/landscape. It is wired to the existing **manual-only** Chromium and WebKit certification steps; automatic PR checks still cannot run a browser matrix. Because this environment has no workflow-dispatch capability, neither browser engine nor physical assistive-technology tests can yet be reported as passed.
- **Release safety:** The workflow's opt-in `approve_full_suite` remains false by default; no deployment, full-suite run or merge was triggered. The proper stacked PR base must be restored to A2–A3 PR #432 after source checks.

## Timeout-resume technical checkpoint — 24 October 2026

- The partial "Return to the answer" Spanish button was fixed by resolving exact Archive interface labels **before** the game's general `tr` helper. The bilingual production-shell test passed on the earlier tested code.
- Follow-up A4 work added exact Spanish summaries for the Paladin, Mage, and Ranger Archive skills, explanatory phrases for current rule-derived figures, and Spanish overviews for tactical retreat, TRUE adversaries, Barracks disciplines, and the visited-creature listing. These changes translate the reference interface, **not** the author-final manuscript.
- Additional focused regressions now lock several exact approved Spanish passages, the four main Archive navigation buttons, the new technical summaries, number preservation, and the keyboard-focusable bilingual document landmark.
- Tested green implementation checkpoint: [focused run #40089769221](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40089769221). Newer [run #40089922867](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40089922867) failed on the standing AGENTS.md consent-policy assertion; the missing wording was restored in a later branch commit, and the policy test itself was **not disabled**. No new Actions run has been queued for the latest branch head, so a final green focused CI result for these later commits **remains outstanding**.
- The A5 Playwright fixture additionally asserts the full reading's `role=document`, bilingual accessible name, and keyboard tab-stop. The fixture is registered in the **manual opt-in** full Chromium/WebKit workflows but has **not** been run. No physical hardware or screen-reader check has been performed.
- The branch is stacked on A2–A3 as draft [PR #433](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/433); neither its source work nor the test harness changes release mechanics, combat, quest timing, saves or approved bilingual story prose. A4 still needs exhaustive human-visible review of long dynamic technical answers. A5 still needs owner-approved browser certification and review of its results.

## Acceptance boundary

Passing focused Node tests and build verifies source behavior and representative UI, but does not alone prove that every long dynamically generated Archive detail is fully translated, that all physical devices display correct scroll/focus, or that Playwright has passed. Keep these limitations explicit. A4 and A5 should be marked **complete** only after their respective coverage and opt-in browser matrix actually pass; otherwise mark the draft as implementation/validation in progress.
