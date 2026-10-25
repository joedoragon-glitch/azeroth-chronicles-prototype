# Founding Explorers — ready-to-review launch kit (NOT published)

**Prepared 2026-10-25; main observed:** `e3c78266b28f3325d2afdcb76ae849fcff306deb` (package dev.185). **Status:** preparatory draft, no player testing or forum posting. Read `FOUNDING_EXPLORERS_IMPLEMENTATION_HANDOFF.md` first. Revalidate after any merge; PR #472 (audio combat coverage) appeared after the prior audit.

## A. Checkpoint 1: executable acceptance worksheet

Record for each scenario: tested main SHA / candidate PR SHA, browser + version, device or emulation, viewport, clean/new vs existing save, EN/es-419, steps, expected, actual, screenshots only if consented, PASS/FAIL/NOT RUN, issue link. Never count source assertions as browser/real-device acceptance.

| ID | Scenario | Pass condition | Current evidence |
| --- | --- | --- | --- |
| EX-01 | New player opens desktop link | Correct language/start UI; can select Normal/Standard and any of three classes | Source audit only; NOT RUN |
| EX-02 | New player opens phone link (>=375x800 CSS px) | Controls readable, usable without external keyboard | Source audit only; NOT RUN |
| EX-03 | Language selection EN/es-419 | Intro, class selection, initial objective, interaction instructions understandable | Historical bilingual test assertions; NOT RUN on dev.185 |
| EX-04 | Opening town/Captain/Recall/Barracks | Player can follow initial objectives in <=20 minutes without boss clear | Historical onboarding assertions; NOT RUN on dev.185 |
| EX-05 | Desktop WASD/F/J and Recall | Instructions match current default mapping and on-screen guidance; no save loss | CONTROLES.md is dev.79-labeled; NOT RUN |
| EX-06 | Phone joystick/tap/interact/skill/Recall | No obstructed critical buttons; portrait/landscape checked where feasible | NOT RUN |
| EX-07 | Returning player with existing save | Explorer instructions don't imply overwriting an existing campaign; start-new warning works | NOT RUN |
| EX-08 | Feedback path | Forum thread accepts replies, optional PM route actually exists and works | Forum not supplied/verified; NOT RUN |
| EX-09 | Optional report | Can play and send feedback without downloading or uploading JSON; export is opt-in and privacy warning accurate | Source only; NOT RUN |
| EX-10 | Public release parity | Actual GitHub Pages build/version and phone entry point verified, not inferred from package | NOT RUN |
| EX-11 | Visual/audio legibility | No essential first-session cues lost due to current frame skip, effects, audio unlock, Pixi/Canvas choices | Dependent draft PRs #464/#470/#471/#472; NOT RUN |
| EX-12 | Consent and acknowledgment | No player identity/credit collected without opt-in; refusal does not affect participation | Copy drafted; NOT RUN |

**Focused tests to consider, after re-baselining and with owner's standing limited-test policy:** `node tests/companion-onboarding-ui.test.cjs`, `node tests/game-menu-ui.test.cjs`, `node tests/field-onboarding.test.cjs`. Verify current paths and runner assumptions before executing. No broad test suite or full browser matrix without explicit authorization.

## B. Draft forum invitation — owner review required

### Español (es-419)

**¿Te animas a probar el juego durante 10–20 minutos?**

Estoy buscando personas que quieran probar por primera vez *So I Became the Dark Lord's Problem*. No es una competencia ni hace falta llegar al final, vencer a un jefe o saber mucho de juegos.

Abre el juego en el navegador, elige **Español**, inicia una partida **Normal / Estándar** con cualquiera de las tres clases y explora a tu ritmo. En el pueblo inicial, sigue las indicaciones para hablar con el Capitán, conocer a tus compañeros y probar cómo reunirlos. Si algo no se entiende o no puedes avanzar, ¡eso también es información útil!

En computadora, el movimiento predeterminado usa **WASD** y la interacción **F**; en teléfono puedes usar los controles en pantalla. [Confirmar instrucciones exactas de Recall y habilidades contra la versión publicada antes de publicar.]

Me ayudaría mucho saber: **¿Hasta dónde llegaste? ¿Qué te gustó o te confundió? ¿Qué cambiarías o mejorarías?**

Puedes responder en este hilo o escribirme por mensaje privado **si el foro lo permite**. No hace falta enviar partidas guardadas, capturas, informes técnicos ni información personal. Si quieres que te agradezca públicamente con tu seudónimo, puedes decirlo por separado; es completamente opcional. Por ahora **no** estoy prometiendo créditos permanentes dentro del juego. Revisaré los comentarios sustantivos aproximadamente dos veces por semana.

**Juego (confirmar versión pública antes de publicar):** [navegador](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) · [teléfono](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)

### English

**Would you like to try the game for 10–20 minutes?**

I'm looking for first-time players to try *So I Became the Dark Lord's Problem*. This is not a competition; you don't need to finish the game, defeat a boss, or be an experienced player.

Open the browser game, select **English**, start a **Normal / Standard** game with any of the three classes, and explore at your own pace. In the starting town, follow the directions to meet the Captain, learn about your companions, and practice gathering them. If something is confusing or you get stuck, that feedback is useful too.

On desktop the default movement keys are **WASD** and interaction is **F**; on phone use the on-screen controls. [Verify exact Recall and skill instructions against the public build before publishing.]

I'd love to hear: **How far did you get? What did you enjoy or find confusing? What would you change or improve?**

Reply in the thread or send a private message **if the forum supports it**. No save files, screenshots, technical reports, or personal information are required. If you'd like a public thank-you under your pseudonym, you can opt in separately; it's entirely optional. I'm **not** promising permanent in-game credits at this stage. I'll review substantive feedback about twice weekly.

**Game (verify published version before posting):** [desktop/browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) · [phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)

## C. Manual feedback and acknowledgment procedure

Keep a private minimal register, not a public list of player data. Suggested columns: date, forum pseudonym (only if volunteered), public thread/permalink or private-reply indicator (no private message text pasted into GitHub), claimed firsthand play status (confirmed / unclear / could not start), platform if volunteered, language if volunteered, summary, reproduction needed, GitHub issue reference (sanitized), response status, **separate public acknowledgment opt-in** (yes/no/not asked), acknowledgment posted date.

**Twice-weekly triage:** read new feedback; acknowledge substantive reports without promising a fix; distinguish confirmed bug, likely usability issue, suggestion, and unsupported claim; reproduce privately; open sanitized issues only for actionable findings; do not publish private messages, saves, identifiers, or diagnostics in GitHub. If opt-in is missing, do not list the player in a public thank-you. An opt-out or removal request should be honored promptly.

**Suggested private consent request:** “Would you like me to thank you publicly using your forum nickname? It's completely optional and won't affect how I consider your feedback. I won't add you to in-game credits unless I ask separately when that feature actually exists.”

## D. Release / stop rules

Before any forum post: owner approves final invitation and forum destination; latest `main` and draft PR status reconciled; EX-01–EX-10 acceptance evidence recorded or explicit owner risk acceptance; live game links checked; privacy and recognition wording reviewed. Do not merge, deploy, post, trigger full tests, or enable diagnostics automatically. If first-session blockers appear, return to conditional Checkpoint 2 with exact reproductions and proposed minimal fixes.

**Deferred:** Founding Legends, races, rankings, special rewards, automatic evidence collection, and in-game credits. Those require separate owner decisions.


## E. Additional independent source cross-check — 2026-10-25 (dev.185)

**Exact source checkpoint:** main `e3c78266b28f3325d2afdcb76ae849fcff306deb`. This is a read-only inspection of current GitHub source and tests; no tests were executed.

1. **Language behavior:** `src/prototype/app.js` reads `azeroth-display-language-v1` from local storage, defaults to English when absent/unavailable, and sets `document.documentElement.lang` to `es-419` or `en`. The Explorer invitation should say **select Spanish if desired**, not imply Spanish is the default on first visit. Existing language preferences persist. The source dictionary includes `Choose your language` / `Elige tu idioma`, `Game and settings` / `Juego y ajustes`, and `Export playtest report` / `Exportar informe`.
2. **Opening tutorial:** `tests/companion-onboarding-ui.test.cjs` has English/Spanish assertions for the initial objective (`Meet the town Captain` / `Habla con el capitán`), companion introduction (`Meet your company` / `Conoce a tu compañía`), and Recall tutorial (`Practice Recall squad` / `Probar Reagrupar`). The test expects Recall practice to be performed, rather than silently marked complete, and checks its highlight through active frames. This establishes a current regression **test specification**, not a fresh passing result.
3. **Menus:** `tests/game-menu-ui.test.cjs` iterates both languages and exercises `Character`/`Personaje`, `Quest journal`/`Diario de misiones`, `Game and settings`/`Juego y ajustes`, language selection, phone layout and settings. The current menu should be tested against these exact labels instead of copying historical dev.79 labels.
4. **New/returning players:** `src/prototype/app.js` includes bilingual messages for protected original saves, recovery checkpoints and cross-window progress. An Explorer who already plays should **not** be told to overwrite a campaign to participate. A new run is only for volunteers without progress to protect, or after following in-game backup instructions.
5. **First field combat:** `tests/field-onboarding.test.cjs` covers all three classes and the first field kill's persistence in v4 saves, but is primarily a simulation regression; it cannot establish that real first-time players understand navigation or combat.
6. **Device entry points:** `index.html` and `phone.html` exist on main. Existence alone does not verify Pages publication, phone usability or service-worker update state.
7. **Fresh concurrent work:** PR #472, `audit(audio): Stage 3 real combat action-to-sound coverage`, appeared after the earlier inventory. Treat it as draft/open work pending status recheck, not live gameplay.

**Invitation wording adjustments recommended:** avoid unverified exact Recall keyboard shortcuts, do not promise that the browser opens in Spanish by default, distinguish choosing a new run from overwriting existing progress, and make it clear that failure to start or navigate is valid feedback. No participant should be asked to change experimental renderer settings, enable developer diagnostics or export a save.

**Next bounded technical step:** execute only the three existing focused onboarding/menu tests against a clearly identified checkout (main or selected integration candidate) and record commands and exit statuses. Then complete EX-01/02/06/08/10 in actual browser/phone and forum contexts. Those latter gates remain unverified and cannot be replaced by test assertions.
