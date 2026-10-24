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

## Acceptance boundary

Passing focused Node tests and build verifies source behavior and representative UI, but does not alone prove that every long dynamically generated Archive detail is fully translated, that all physical devices display correct scroll/focus, or that Playwright has passed. Keep these limitations explicit. A4 and A5 should be marked **complete** only after their respective coverage and opt-in browser matrix actually pass; otherwise mark the draft as implementation/validation in progress.
