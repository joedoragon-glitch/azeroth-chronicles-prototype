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

## N1 delivery audit closure — 24 October 2026

The earlier PR #428 delivery audit identified five gaps. All five now have implementation and focused source/native/production-shell evidence:

1. **M01/M02 throne/final Rest:** real gated progress queues the complete approved text as a non-urgent milestone, not only `say()`. `Rewards.storyReadings()` reconstructs each only when `throneClaimed` / `finalRestCompleted` already exists; no new save fields or early identity leak.
2. **L01/L02/L03 landmarks:** native first discovery/interaction queues each exact approved passage once; earned readings reconstruct from the existing `vale:goblin-camp`, `march:mire-nests`, and `highlands:ogre-hearth` discovery facts. Reinteraction and reload do not replay the notice.
3. **D01–D03, D04 entrance excerpt, I01–I05:** first-entry story is now queued as quiet region-scoped narration and can be recovered from existing discovery facts. Combat defers, rather than destroys, the queued text. The private-quarters part of D04 is still intentionally withheld.
4. **Spanish earned-story previews:** the existing 64-character Announcements index now selects the approved Spanish excerpt for dungeon/interior/landmark/endgame text, not only Chronicles; full answer view remains exact EN/ES manuscript text.
5. **Actual delivery tests:** `tests/n1-delivery.test.cjs` drives native first entry, native landmarks, the real throne interaction and Rest, once-only/no-early-leak, v4 save/reload and English/Spanish Announcements clicks. It also exercises phone-mode portrait 170-character and landscape 130-character excerpt/hint behavior while asserting the complete approved text remains accessible in Announcements. Existing Keeper, Chronicle and approved-copy checks still run.

**Latest focused evidence:** [GitHub Actions #40081688607](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40081688607) passed 16 selected impacted test files and `node scripts/build.cjs --check` for the multi-file PWA snapshot `0.9.1+snapshot.dev.169`. The publishing job was intentionally skipped for the draft PR. All 53 EN/ES core entries and three supplementary pairs remain fingerprint-verified; the 17 silent quests remain silent.

**N1 assessment:** the game-wide author-copy integration and the five delivery findings are implemented and focused-tested on the draft branch. This is not hardware/assistive-device certification, a live Pages verification, or authority to proceed automatically to A2. The five separately authorized N1a scene correspondences (especially D04's full private-quarters observation) remain outstanding. The phone excerpt is intentionally short with an explicit full-text journal path; any long-form layout improvements belong to the subsequent Archive/user-interface stage.

**Release gate:** PR #428 must remain a draft until separate owner authorization. No merge, deployment, complete cross-browser matrix, or broad CI suite is implied by these focused results.
