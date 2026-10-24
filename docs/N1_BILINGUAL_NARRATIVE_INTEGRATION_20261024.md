# N1 — Approved bilingual narrative integration (review-only)

**Authority:** Author-supplied `AZEROTH_CHRONICLES_BILINGUAL_NARRATIVE_V4_2_EDITORIAL_MASTER.docx`, 24 October 2026. It is final as literary text only. The prior `*_UNAPPROVED.docx` is not implementation copy.

**Scope:** Issue #427, N1. This is not A2 Archive bookshelf modernization, N1a scenery work, or release authorization. NEVER rewrite, condense, paraphrase, or fill gaps in accepted EN/ES copy. If an entry cannot be safely delivered under its approved game-state condition, stop and seek owner clarification.

## Progress — source owners

| IDs | Runtime source owner | Status |
| --- | --- | --- |
| C04 C05 C06 C09 C11 C16 C18 C20 C21 C23 C24 C29 C30 | `src/prototype/narration.js`, `src/prototype/rewards.js`, `src/prototype/app.js` | **Integrated on draft branch, pending focused CI/browser confirmation.** Exact EN/ES manuscript pair fingerprint protected by `tests/quest-narration.test.cjs`. |
| P01 P02 P03 P04 P05 P06 P07 | `src/prototype/menus.js` and gated evidence/service routes | Pending |
| D01 D02 D03 D04 | `src/prototype/rules.js` dungeon first-entrance material and visibility gates | Pending |
| I01 I02 I03 I04 I05 | `src/prototype/rules.js` occupied interior narration | Pending |
| L01 L02 L03 | `src/prototype/engine.js` landmark texts | Pending |
| K01–K13 | `src/prototype/archive.js` personal/historical records | Pending |
| R01–R05 | `src/prototype/archive.js` province records | Pending |
| M01 M02 M03 | `src/prototype/engine.js`, `src/prototype/app.js` throne/finale/credits | Pending |

## Conditional approved passages that are not new core IDs

- R05 confession append: **only** after `keeperEvidence === true`. Ordinary R05 and Neri rescue/pact alone do not unlock it.
- P07 has **two** final English/Spanish greetings. Choose using `resourceMode.manaEnabled`, not guessed Ranger capability; pricing/eligibility stay dynamic.
- Additional post-throne Keeper paragraph: only after `game.s.throneClaimed === true`, separate from M01.
- No early missing-companion revelation or old six-signature C04 ledger clue; C04 now carries the Lifebinder skeleton-identity fact.
- Preserve quest reward timing, one-time payments, 13 approved announcement slots and 17 intentionally silent slots, current saves/evidence gates and all existing dynamic figures.

## N1a — separate world/scene holds, not a reason to rewrite accepted prose

D04 (Veyra quarters/viewpoint), P04 (Neri turns to books), I01 (paid Goblin workers and purchased preserves), I03 (operational Signal Keep / Crown equipment), I04 (protected Shrine furniture / memoranda). Crystal Deposit / Yacimiento de Cristales is the approved display name for R04; preserve existing internal ID `shelf` and saved progress.

## Verification boundary and release gate

- **Current code batch only covers Chronicle C entries.** Do not mark N1 complete or reopen A2 yet.
- Document counts for the Chronicle catalog: 13 EN + 13 ES, at most 180 characters each (editorial limit); **existing phone UI still truncates at 130/170 characters**, so full device readability remains separate and unverified. The story journal retains the whole approved phrase.
- The test locks the 13 pairs with the SHA-256 of `JSON.stringify(authored.map(entry => [entry.id, entry.text, entry.es]))`, compared against the exact DOCX. Keep independent earned-story/save checks.
- Use only focused affected tests and narrow build/syntax check. Broad CI/device matrix requires fresh authorization.
- No merge, PWA deployment, gameplay release or `main` changes without express approval. PR remains **draft** throughout implementation and focused owner review.
