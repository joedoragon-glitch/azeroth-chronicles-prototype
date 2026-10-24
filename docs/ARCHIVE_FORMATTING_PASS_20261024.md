# Archive formatting-only pass — 24 October 2026

**Scope approved by the owner:** improve how the existing audited figures/formulas are presented. Do not add explanatory Keeper prose, alter the bilingual manuscript or reopen the voice pass. Candidate **dev.173**, draft #433; #428 → #430 → #432 → #433 remains unmerged and unpublished.

## Final presentation

- Pure `archive-reading.js` lays out the **already-localized complete string**. It neither calculates values nor supplies new descriptions. The audited `Archive.sections()` data and the source manuscript remain unchanged.
- Existing headings/field names become headings and definition-list labels. Values align on desktop; phone layouts stack labels and values. Existing plain sentences remain paragraphs, rather than being cut into invented label/value fragments.
- Formula text is preserved inside native, initially closed `details` disclosures. **Exact calculation / Cálculo exacto** is the sole added interface label; it is not new Keeper dialogue or an explanation.
- Approved literary passages never enter the sentence/field parser. Embedded boss histories remain whole, exact summary passages. Distinct creature records and all values remain in their original order.
- Translation runs on the original complete source once, before layout; its fragments are not translated again. The global menu/history system and Back callbacks retain their identity. Keyboard Tab includes the native formula control; Enter/Space toggle it without activating a menu action behind it.
- Archive-only CSS restores the established desktop reading width over generic menu sizing and keeps phone figures within the viewport. The new presentation module is registered in the multi-file entry graph, all generated entries and the offline asset inventory.

## Focused evidence

- `tests/archive-reading.test.cjs`: **726 EN/ES views PASS**, comparing the source with the formatted output. Only whitespace and visual separator characters may move; wording, ordered numeric tokens and math operators are identical. Independently asserts contiguous exact approved passages, all unchanged literary readings, no save mutation, production-shell one-pass localization and native formula keys.
- `tests/archive-reading-browser.test.cjs`: **Chromium PASS**, English/Spanish at **1280×800 desktop, 393×852 phone portrait and 800×375 phone landscape**. Actual Keeper → armor/burst/boss/creature pages, rendered-DOM copy equivalence, definition lists, closed/keyboard-toggled formulas, Back, at-least-15px text, no horizontal overflow and no JavaScript exceptions. Desktop/phone screenshots reviewed. No full-game/browser matrix.
- Catalog/menu ownership and canonical multi-file architecture tests passed; build generated **dev.173 / 217 campaign assets**. Applicable focused CI is tracked on #433.
- The preceding [numerical audit](KEEPER_ARCHIVE_MECHANICS_AUDIT_20261024.md) remains the authority for the values. This pass changes no engine, combat, rules, party, progression, rewards, save or narrative module and introduces no new numerical claims.

## Integration review

A separate detached preview started at latest main `6d0ce97465bc2145b68d25c29e7dae2739162ec1` and applied the cumulative stack without changing main or the four draft refs. Its textual overlaps are the owner-policy preface, candidate versions/generated PWA files and Archive Slow reference. The preview retains main's policy/history and #429/#431 behavior, uses the audited rule-dependent Archive and regenerates the coherent dev.173 package. The combined-candidate focused results are recorded in the integration handoff; no production merge or deployment is performed by preparation.
