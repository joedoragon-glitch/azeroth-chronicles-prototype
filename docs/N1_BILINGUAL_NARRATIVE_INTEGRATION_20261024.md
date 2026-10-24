# N1 — Approved bilingual narrative integration (review-only)

**Authority:** Author-supplied `AZEROTH_CHRONICLES_BILINGUAL_NARRATIVE_V4_2_EDITORIAL_MASTER.docx`, 24 October 2026. It is final as literary text only. The prior `*_UNAPPROVED.docx` is not implementation copy.

**Scope:** Issue #427, N1. This is not A2 Archive bookshelf modernization, N1a scenery work, or release authorization. NEVER rewrite, condense, paraphrase, or fill gaps in accepted EN/ES copy. If an entry cannot be safely delivered under its approved game-state condition, stop and seek owner clarification.

## Progress — source owners

| IDs | Runtime source owner | Draft status |
| --- | --- | --- |
| C04 C05 C06 C09 C11 C16 C18 C20 C21 C23 C24 C29 C30 | `src/prototype/narration.js`, notices and announcements in `app.js` | **Integrated** exact EN/ES and tested; 17 silent slots unchanged. |
| P01 P02 P03 P04 P05 P06 P07 | `src/prototype/menus.js`, `archive.js`, state gates | **Integrated** exact EN/ES and tests. P07 has both resource-mode variants; P04 scene animation remains N1a. |
| D01 D02 D03 | `src/prototype/rules.js` dungeon lore | **Integrated** exact EN text; approved ES routes through game translation. |
| D04 | `src/prototype/rules.js` Citadel entrance | **Limited integration:** exact approved first two sentences only, in both languages. Private-quarters sentence is withheld until an actual verified inspection route exists. No new prose supplied. |
| I01 I02 I03 I04 I05 | `src/prototype/rules.js` occupied interiors | **Integrated** exact EN/ES copy; I01/I03/I04 props/scene checks remain N1a. |
| L01 L02 L03 | `src/prototype/engine.js` landmark descriptions | **Integrated** exact EN/ES via existing `siteDescription` and language routes. |
| K01–K13 | `src/prototype/archive.js` Keeper histories and council records | **Integrated** exact EN/ES; live figures and progression remain separate. |
| R01–R05 | `src/prototype/archive.js` province records | **Integrated** exact EN/ES; evidence-only R05 append still gated. |
| M01 M02 M03 | `src/prototype/engine.js`, `src/prototype/app.js` | **Integrated** exact EN/ES throne, final rest and credits at existing transitions. |

**Copy integrity:** All 53 bilingual core pairs and three separate supplements are stored on the existing `PrototypeNarration.approved` catalog. `tests/n1-approved-copy.test.cjs` compares the 53-entry and three-supplement SHA-256 fingerprints against independently extracted text from the author-supplied DOCX. `D04_entrance` is a separately mapped, exact excerpt of the approved D04 first two sentences—not new language. The full D04 remains preserved in the catalog for a later state-verified quarters interaction.

**Scope kept narrow:** Code changes do not add new save keys, modify boss/TRUE logic, change quest reward timing or world geometry, or alter the multi-file PWA packaging. The approved `Crystal Deposit` / `Yacimiento de Cristales` labels replace the old display name while retaining runtime ID `shelf`.

## Conditional approved passages that are not new core IDs

- R05 confession append: **only** after `keeperEvidence === true`. Ordinary R05 and Neri rescue/pact alone do not unlock it.
- P07 has **two** final English/Spanish greetings. Choose using `resourceMode.manaEnabled`, not guessed Ranger capability; pricing/eligibility stay dynamic.
- Additional post-throne Keeper paragraph: only after `game.s.throneClaimed === true`, separate from M01.
- No early missing-companion revelation or old six-signature C04 ledger clue; C04 now carries the Lifebinder skeleton-identity fact.
- Preserve quest reward timing, one-time payments, 13 approved announcement slots and 17 intentionally silent slots, current saves/evidence gates and all existing dynamic figures.

## N1a — separate world/scene holds, not a reason to rewrite accepted prose

D04 (Veyra quarters/viewpoint), P04 (Neri turns to books), I01 (paid Goblin workers and purchased preserves), I03 (operational Signal Keep / Crown equipment), I04 (protected Shrine furniture / memoranda). Crystal Deposit / Yacimiento de Cristales is the approved display name for R04; preserve existing internal ID `shelf` and saved progress.

## Focused verification and remaining release gate

- **Candidate SHA and evidence:** [Focused validation #40076587725](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40076587725) passed 12 selected Node/source/production-shell test files, including Archive, Keeper lifecycle, bilingual modal text, exact-copy fingerprint, existing quest save/payoffs and syntax. `node scripts/build.cjs --check` passed for `0.9.1+snapshot.dev.169`. This is not the full cross-device test matrix.
- Actual English/Spanish production-shell modal rendering was asserted for approved copy, a composite live boss history and the evidence append. It is not certification of native device typography, every input method, or long-form browser scroll behavior.
- **Still to verify before final N1 acceptance:** D04's private-quarters detail may appear only after inspecting those quarters; the five N1a scenery/animation holds remain outside this narrative branch. Device-dependent Chronicle display truncation (130/170 characters) still needs a separate legibility/interaction decision; 180-character editorial compliance is not a guarantee.
- Review full PR diff against refreshed `main` and record approval separately. **No merge, deploy, A2 bookshelf project or broad CI authorization is implied by passing focused tests.**
