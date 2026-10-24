# A2–A3 — Keeper Archive bookshelf organization and reading UX

**Parent:** N1a draft PR #430 (`narrative/n1a-world-scene-reconciliation-20261024`), which in turn depends on N1 draft PR #428. This is a separately reviewable, **unmerged** and **unpublished** A2–A3 implementation; A4 translation completeness and A5 wider validation remain subsequent stages.

**Literary authority:** The final 24 October 2026 bilingual editorial master is immutable. All 53 core pairs, the three conditional supplements, the exact P03 invitation and all live game rule/value calculations remain sourced from existing N1 modules.

## A2 — hierarchy and wayfinding

- Keep the exact eight established primary bookshelves in order: Battle and protection; Conditions and recovery; Experience and discipline; Your skills; Companions and field bases; The Crown and its institutions; Adversaries and their attacks; The provinces.
- The ninth **The orders among the shelves** is added only when `game.s.keeperEvidence` is truthy; neither Keeper pact nor Neri rescue unlocks it. The throne-only chapter remains gated separately.
- Bookshelf buttons identify each shelf's topic count, derived from the *current* `Archive.sections` result. Large institutional and adversary lists gain visual/noninteractive subheadings; all existing topics remain selectable and in their original order. No new game data or Archive save keys.
- Add an **All shelves** escape hatch from any reading, alongside **Another question** to return to the same shelf; the generic Back / Escape key keeps original navigation semantics.
- Use stable callback identities per game and entry route, including direct Keeper and Barracks access. The existing `menuPosition` history can now restore selected question and scroll position when returning from answer or figures.
- Recheck `keeperPact`, `keeperAvailable`, game identity, secret-evidence gate and current section on navigation. Save/reload and TRUE defeat/escape gates are unchanged.

## A3 — readable full answers

- A dedicated `data-view='archive-reading'` mode limits line width, increases typographic hierarchy and line spacing on desktop and phones, preserves original \n paragraph breaks, and allows selecting text. Phone landscape/portrait settings receive a bounded scrollable reading area.
- Prevent initial menu render and Back restoration from automatically scrolling the answer to its first button. Explicit keyboard/controller movement still scrolls a selected action into view, and the fixed Back control stays accessible.
- Keep the **Show me the figures** optional action for topics with live dynamic statistics, with a **Return to the answer** action. Current rule-derived figures are re-evaluated when figures are opened; no historical values are invented or hardcoded in the Archive.
- Long boss/history and province answers retain their complete exact source contents rather than shortening prose. Richer bilingual controls and exhaustive dynamic translation are intentionally reserved for A4.

## Focused implementation audit — 24 October 2026

**A2 and A3 source implementation complete on [draft PR #432](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/432)**. Four areas changed: Archive navigation callbacks and noninteractive headings; scoped Archive reading view in the shared menu host; desktop/phone reading typography; and the new regression test. No approved literary text, Archive topic source, gameplay rules, save serialization or PWA packaging was edited.

**[Focused workflow #40086907650](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40086907650) PASSED 20 selected relevant test files**, including the new A2–A3 hierarchy, topic counts, optional figures, stable Back, reader-mode and restored-scroll assertions. `node scripts/build.cjs --check` passed for `0.9.1+snapshot.dev.169`. The publishing job was skipped. The workflow-tested code head is `e55b019b17bb7e729b83b79da20e750c19b3e596`.

The draft temporarily targeted `main` only to trigger the existing focused workflow. It is now retargeted to `narrative/n1a-world-scene-reconciliation-20261024` (N1a PR #430) and verified **clean and mergeable**. The final documentation-only commit made after that successful workflow does not change tested code or tests. Both upstream PRs #428/#430 remain unmerged; no release authorization.

**Limits:** This is focused static/Node production-shell validation, not hands-on phone, real-screen-reader, full browser matrix or full-system certification. A4 covers complete translated Archive controls, dynamic text and bilingual index headings. A5 covers comprehensive end-to-end/browsers, accessibility and save gate acceptance. Neither phase has started.

## Verification / boundaries

- `tests/archive-a2-a3.test.cjs` checks all 8 + gated 9 shelves, topic/group coverage, preserved official prose, optional live figures, stable/back/scroll hierarchy, dedicated reader view and CSS.
- Existing Keeper, Archive, menu foundation, quest and save regressions must remain green; use only the repository's focused checks and `node scripts/build.cjs --check`.
- Do **not** run the full browser/device matrix, merge/deploy either dependent PR, alter combat or save schema, or start A4/A5 as a side effect of A2/A3.
