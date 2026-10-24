# A4–A5 — Archive bilingual copy and focused acceptance

**Current state, 24 October 2026:** A4's final technical-copy audit is complete. A5's focused Chromium/keyboard/layout/save acceptance has passed. Comprehensive cross-browser, real-device and screen-reader certification remains unperformed. **This is still draft PR #433, not approved for merge or publication.**

**Dependency:** #428 → #430 → #432 → #433. The PR base remains `archive/a2-a3-bookshelves-reading-20261024`. No dependency was merged, rebased or retargeted during this continuation. Issue #427 remains open.

## A4 — copy and compatibility

- One Archive-only, longest-source-match translation pass replaces the previous cascading word substitutions. Newly translated Spanish is never fed into an English glossary or partially processed by the global menu translator.
- Every author-final EN/ES passage and supplement is an opaque complete match. Exact punctuation, paragraph breaks and approved wording remain sourced from `narration.js`, whose independent 53-entry/three-supplement fingerprints remain unchanged.
- Technical translations cover all shelves/introductions/controls, class skill headings and summaries, optional figures, pet geometry/care, commander passives, visited creatures, non-manuscript office descriptions and both resource modes. Numeric tokens/formulas stay in their original order; localization does not calculate game values.
- **Deliberately retained source names:** bosses, locations/provinces, observed creature names, pets, their named attacks, and named restorative/recovery abilities. TRUE, XP and unit `s` also remain. `translationNames()` derives the name inventory from existing data/rules and visited actors, protecting names from generic word substitutions. These are names/identifiers, not untranslated explanatory paragraphs.
- Complete English `Archive.sections()` outputs were compared with #432 at `db1b1933dee5fc377f25ec5844cf1e6da62f4f58` for Paladin/Mage/Ranger and both resource modes: unchanged. No mechanics, save serializer, world geometry or manuscript source was edited in this continuation.
- `tests/archive-translation-coverage.test.cjs` checks **4,992 fields**, including all classes, both resource modes, unlearned/rank-five skills, all eleven pet families, active/resting/fallen/recruitable pets, evidence/throne gates and populated visited encounters, including every Treasury and side dungeon. It rejects unaccounted English prose, reordered/changed numbers, modified embedded approved passages, leaked markers and save mutation.
- The exact **newer main Slow reference** is separately captured with provenance in `tests/fixtures/archive-slow-main-20261024.json` and translated/tested now, including lasting cooldown debt. This prepares localization for later integration; it does not import or revert #429's mechanics.

## A5 — focused evidence

`tests/archive-a5-browser.test.cjs` was executed directly for **Chromium 153**, English and Spanish, at **1280×800 desktop, 375×800 phone portrait, 393×852 phone portrait, and 800×375 phone landscape**. Eight isolated cases passed, each limited to Archive flows:

- Native Keeper interaction, eight shelves and evidence-only ninth; exact approved P05 and long K10 readings.
- Full answer starts at the top; optional live armor figures retain `0.35`; Return restores the answer; Escape restores selected shelf and previous scroll.
- Full reading is a keyboard tab stop with `role=document` and bilingual accessible name. Native Page Down scrolls the long text; Enter while reading does not activate a hidden/selected action; Tab and reverse Tab stay inside the dialog.
- A focused document keeps native arrows/Page Up/Down/Home/End/Space; leaving reading clears its role/ARIA name. These additional key/metadata guards also have production-shell assertions.
- Reader font is at least 15 CSS pixels; dialog fits each viewport; long copy needs no horizontal scrolling. Start-of-reading and explicitly scrolled screenshots were captured locally and portrait/landscape reviewed.
- Save/reload and native `Campaign.restore` preserve existing v4 pact/evidence facts without granting throne lore. Both Basic and Full Barracks → Training → Rescued specialists → Keeper use real UI actions and return to their actual entry route.
- No browser JavaScript exceptions. No broader game journeys or WebKit matrix was run.

The standard Playwright browser download failed in this environment; a temporary Chromium binary from the published `@sparticuz/chromium` npm distribution supplied the local focused run. It is **not a repository/runtime dependency**. The game's own locked dependencies and asset inventory remain unchanged apart from the candidate version.

These are headless Chromium and production-shell results, **not physical iPhone/Safari, actual assistive-technology, controller-hardware or full-game certification**. Those checks require their own authorized scope; do not call A5 universally certified.

## Focused CI and packaging

- Historical [#40089769221](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40089769221) passed. [#40089922867](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40089922867) failed the standing consent-policy sentence assertion; the sentence was restored and that guard remains enabled.
- Continuation [#40091927221](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40091927221) passed the nine selected relevant suites and reproducible build on checkpoint `10556a5d7b697e9340bddbebfbf354ec5d1d5270`; publishing was skipped. The dev.171/cache-identity and new-main Slow-copy checkpoint `602ebc7805b6297265eafbe51ad4e93536263d15` also passed [focused run #40092165613](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40092165613). The final pet-healing semantic repair is covered by the final-candidate run recorded below.
- Focused PR checks now also accept `archive/**` and `narrative/**` target branches. This closes the missing-CI problem without temporarily pointing stacked drafts at main. Push/deployment gates remain main-only; comprehensive certification remains manual-only with `approve_full_suite=false` by default.
- Additional local affected suites passed: A4/A5 production shell, A2/A3 reading/navigation, Archive reference, Keeper lifecycle/stale actions, independent approved-copy hashes, N1 bilingual shell, menu foundation and CI consent policy. Coverage and narrow `node scripts/build.cjs --check` passed. No `npm test`, full browser workflow, merge or deployment was invoked.
- Candidate version is **`0.9.1+snapshot.dev.171`**, regenerated consistently in package/lock/build-info/service worker. It is distinct from the already published dev.170. The modular multi-file GitHub Pages/PWA architecture is retained.

## Main integration blocker — release remains held

Audited main: **`6d0ce97465bc2145b68d25c29e7dae2739162ec1`** (#431), already dev.170. The older feature stack predates **#429's Slow duration/stack/debt mechanics** and **#431's performance-preference migration/WebGL trial changes**. Main has overlapping changes in `app.js`, `archive.js`, `rules.js`, `engine.js`, `party.js`, `combat.js`, package/generated assets and AGENTS. The final GitHub recheck reports all four drafts mergeable, but that does not certify the eventual combined behavior. Do not treat the branch-to-main diff as an approved rollback of those updates.

Before any eventual release, reconcile the upstream stack with those main changes, preserve both current gameplay and the exact manuscript, resolve the Archive Slow-reference overlap using the new tested translations, assign the final distinct cache version, and rerun only checks relevant to that integration. **No reconciliation merge/rebase, upstream ref change or release was performed here.** #433 remains correctly stacked and draft. Any broader browser/full-suite certification and merge/deploy need separate explicit owner authorization.

## Final source validation

- Source candidate **`9ffeb6698200c70ff2002e0bd60944ef8264b85b`** passed [focused workflow #40092341947](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40092341947): **nine relevant test files**, syntax and reproducible dev.171 build. Publish and Pages artifact upload were skipped.
- The final direct source comparison confirmed `narration.js`, `engine.js`, `combat.js`, `rules.js`, `party.js` and the v4 `save.js` serializer are byte-for-byte unchanged from the starting #433 head. No current-main gameplay changes were undone.
- The amount-versus-duration translation for live pet healing now has a numerical capture regression (`333` range / `12.75%` amount), and singular pet targets/charged geometry labels were polished. The 4,992-field check passed again with **all Treasury and side-dungeon encounters populated**, exercising every captain passive.
- Browser evidence was obtained before the final catalog-only pet/Slow wording and version changes. The tested `app.js`, reading CSS, navigation and browser fixture are identical to the final source; no broader engine/device acceptance is inferred.
- The last follow-up changes affect only this evidence document and the expanded copy-coverage fixture. Their own final focused CI is reported on PR #433.
