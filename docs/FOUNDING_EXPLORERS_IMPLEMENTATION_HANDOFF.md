# Founding Explorers — living implementation handoff

**Status:** Draft documentation only; no implementation, merge, deployment, or forum publication authorized.  
**Created:** 2026-10-25. **Initial reconciliation baseline:** main `968f3493a48e1bcaf17ce6f70f9790ff9b8ed8be`.  
**Game:** So I Became the Dark Lord's Problem. **Repository:** joedoragon-glitch/azeroth-chronicles-prototype.

## Purpose and source authority

Make it easy for the first independently confirmed player to try the game for 10–20 minutes, provide useful firsthand feedback, and receive appropriate voluntary acknowledgment. Views and likes do not count as confirmed gameplay. The owner enjoys development as a hobby; this is not a popularity, revenue, or competition program.

Original reference: **Founding Adventurers Program — Audited Project Proposal and Implementation Charter, rev. 3.0, 2026-10-22**. The original DOCX was subsequently located and inspected in the project workspace (see “Original charter recovered for review” below), but its complete content has **not been archived in GitHub**. This handoff is not a verbatim substitute; future GitHub-only agents must retrieve the original before expanding deferred features.

**Approved and fixed:**
- Launch only noncompetitive Founding Explorers, not Founding Legends.
- Any currently available hero class, normal campaign, approximately 10–20 minutes. No boss clear, finished campaign, complex proof, or technical report requirement.
- Welcome criticism, confusion, bug reports, accessibility issues, and positive impressions equally.
- English retained; prioritize natural Latin American Spanish (es-419) in first-session onboarding and reporting. Full campaign translation parity is deferred.
- Feedback through **public forum replies with optional private messages**.
- Recognition through **voluntary forum acknowledgment initially**; in-game Founding Credits **later**, only after separate approval and implementation. No permanent-credit promise before delivery.
- Developer reviews substantive feedback **about twice weekly**; do not guarantee a fix or instant response.
- No automatic telemetry, accounts, uploads, mandatory personal information, or mandatory diagnostic attachments.
- Protect existing gameplay, version-4 saves, published links, and multi-file offline-capable GitHub Pages/PWA. Never reinstate single-HTML constraints.
- No changes to independent renderer, performance, menu, navigation, combat, art, or other projects under this initiative. In particular, do not modify or assume completion of experimental PixiJS PR #407.

## Critical freshness rule for every new chat or agent

**Never rely on the recorded baseline as current.** At the start of *each* checkpoint and before *each* implementation, fetch current `main` SHA, package/build information, AGENTS.md, architecture/current-state documentation, affected source files and tests, and all relevant open/merged PRs. Compare against the checkpoint's last verified SHA. Record new findings and whether they supersede prior assumptions. Recheck again before opening/updating a PR, testing, merging, or publishing. Do not assume PR numbers or old code paths are still current.

This file is the durable scope/decision/checkpoint ledger. Source-specific claims below are **historical audit findings**, not automatic certification of the latest code or public release.

## Four independent checkpoints

### 1. First-session accessibility, localization, and feedback readiness
**State: source audit and bilingual draft prepared in chat; acceptance NOT COMPLETE.**

Historical source inspection at `869049797d5e29270886871c89068f648c1f2a6c` found: language selection and es-419 document language; Standard/Normal plus Paladin/Mage/Ranger; opening Captain, Recall and Barracks guidance; desktop and phone control paths; optional JSON report export under Save and game management. Existing tests include `tests/companion-onboarding-ui.test.cjs`, `tests/game-menu-ui.test.cjs`, `tests/field-onboarding.test.cjs`. These tests were **inspected, not freshly executed**. The existing `CONTROLES.md` described older dev.79 and mixed some English menu labels; verify whether since updated. Report export contains hero, statistics, performance/device diagnostics and must not be demanded publicly.

**Next action:** Reconcile these claims with the *latest* main and PRs. Audit actual first-session menu and control labels in both languages, desktop/phone at supported viewport (at least 375 × 800 CSS px), clarity of starting campaign and leaving town, access to optional reporting, privacy messaging, and current public build. Prepare/revise a short bilingual guide and forum submission wording. Identify only confirmed gaps.

**Acceptance:** Accurate es-419/English instructions for any class; understandable first 10–20 minutes without boss requirements; realistic desktop and phone walkthroughs; readable labels and navigation; no forced file export or account; approved forum reply/optional PM route; documented tested build and limitations. Distinguish code inspection, automated tests, browser test, and real-human comprehension. If a test cannot run in chat, mark pending, never pass.

### 2. Minimal verified corrections (conditional)
**State: NOT STARTED.** Only fix issues demonstrated in checkpoint 1. A new feedback system is not presumed necessary. Prefer a focused documentation correction if sufficient. If code changes are necessary, propose exact file/test scope for owner approval, make one small reviewable PR, and run targeted bilingual desktop/phone/menu/PWA/save regressions. Preserve mechanics and unrelated PRs.

**Acceptance:** Confirmed issues addressed; focused tests documented with commands/results and environment; existing saves, links and offline assets unaffected; PR unmerged until explicit owner authorization. Skip this checkpoint if no correction is required.

### 3. Explorer-only forum invitation and operation
**State: NOT STARTED.** Owner approves Spanish-first invitation plus English equivalent, official verified game URLs, 10–20-minute noncompetitive task, three questions, and reply/optional PM instructions. Three questions: Where did you reach? What did you enjoy or find confusing? What would you change or improve? A player unable to start may still report useful feedback.

**Acceptance:** Forum rules and available PM channel checked; privacy wording approved; public text reply accepted without files; private diagnostics requested only if necessary and voluntarily shared; manual minimal register records handle, date, reported firsthand experience, response status, and separately obtained acknowledgment consent; substantive replies reviewed about twice weekly. Forum views/likes are not gameplay proof. Do not post without owner authorization.

### 4. Optional accessible in-game Founding Credits
**State: DEFERRED / NOT STARTED.** Only after separately approved scope, consent mechanism and working delivery. Prefer a small accessible bilingual credits section/data list of opted-in pseudonyms, not a bespoke NPC or asset per participant.

**Acceptance:** Explicit opt-in; correct names and accents; accessibility without finishing campaign; mobile/desktop/offline tests; clear correction/removal procedure; no save migration or gameplay impact; owner approves merge and publication before announcing in-game recognition.

## Explicitly deferred charter features

Founding Legends/Pathfinders competition, first-to-clear races, milestone/achievement ledger, validator, exclusive titles, UTC competition rules, substantial creative rewards, complex diagnostic evidence, and full competitive localization parity. No implementation without separate authorization.

## Step 1 draft: short forum/player guide (not published or certified)

**ES-419:** ¿Te animas a explorar durante 10–20 minutos? Abre el juego desde el enlace oficial, elige Español, una partida Normal con la opción Estándar y cualquier clase (Paladín, Mago o Explorador). Recorre el pueblo inicial, habla con el Capitán, prueba Reagrupar y explora si quieres. No necesitas derrotar a ningún jefe. En computadora, usa WASD para moverte, F para interactuar, J para la primera habilidad y Q para Reagrupar; en teléfono usa la palanca o toca un destino y utiliza los botones en pantalla. Cuéntanos: ¿Hasta dónde llegaste? ¿Qué te gustó o te confundió? ¿Qué cambiarías o mejorarías? Responde en el hilo o por mensaje privado si lo prefieres. No hacen falta archivos ni datos personales. No publiques informes técnicos o partidas con información que quieras mantener privada. Si deseas que te agradezcamos públicamente con tu seudónimo, indícalo; no se promete reconocimiento permanente dentro del juego. Revisaremos comentarios sustantivos aproximadamente dos veces por semana.

**EN (historical draft, superseded by the bilingual launch kit for publication):** Would you like to explore for 10–20 minutes? Open the official game link, choose English, a Normal/Standard game and any class (Paladin, Mage, Ranger). Explore the starting town, meet the Captain, try Recall, and optionally explore outside. No boss defeat is required. On desktop use the currently displayed movement and interaction instructions; on phone use the on-screen controls. Exact skill/Recall bindings and tap navigation must be verified against the intended public build before posting. Tell us: How far did you get? What did you enjoy or find confusing? What would you change or improve? Reply in the thread or by private message. No attachments or personal information are required. Avoid publicly sharing technical reports or saves with information you'd prefer private. You may opt into a forum thank-you under your pseudonym; permanent in-game recognition is not promised. Substantive feedback will be reviewed approximately twice weekly.

**Official links to verify before publication:** desktop https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/ ; phone https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html .

## Operating log

- 2026-10-22: Reference charter rev. 3.0 established (not stored verbatim here).
- 2026-10-24: Initial chat source audit used main `869049797d5e`. No fresh runtime test or GitHub record created then.
- 2026-10-25: Owner confirmed public forum replies + optional PMs, voluntary forum acknowledgment first, and approximately twice-weekly review.
- 2026-10-25: Current main fetched as `968f3493a48e1bcaf17ce6f70f9790ff9b8ed8be` before this documentation branch. This **is not a fresh source-level reconciliation** of all intervening changes. All Step 1 behavioral findings require revalidation against this or newer main.


## Freshness audit — 2026-10-25, afternoon (documentation-only)

**Observed main:** `e3c78266b28f3325d2afdcb76ae849fcff306deb`; **package:** `0.9.1+snapshot.dev.185`. This supersedes the 10:15 UTC baseline `968f3493a48e`. A separate active documentation PR (#465) reports successful focused Pages deployment #40208508280 for this baseline; this audit has **not independently inspected that run or the public build**. Treat `main` source version, claimed Pages deployment, and physical-device acceptance as different evidence levels.

**Important governance/documentation drift:** `README.md`, `AGENTS.md`, `docs/DEVELOPMENT_STATE.md` and `CONTROLES.md` still contain prominent dev.169 or dev.79 historical wording; do not assume their lead sections describe dev.185. Documentation governance drafts #449 and #465 are active and may correct these. Coordinate rather than duplicating their edits.

**Current main changes relevant to Explorer onboarding:**
- The default Canvas 2D game now has an optional PixiJS WebGL2 renderer with Keep/Revert; no longer describe PR #407 as an *open independent draft*. It was merged earlier according to current development state; always verify actual current implementation.
- Main contains the unified Screen and Performance menu, revised menu navigation, a one-time dev.170 performance preference migration, performance emergency pause/recovery and diagnostics, navigation improvements, and changed PWA update behavior. Historical first-session walkthrough and menu labels need a new reality check.
- `tests/companion-onboarding-ui.test.cjs` still explicitly tests English and Spanish Captain/Recall/Barracks onboarding; `tests/game-menu-ui.test.cjs` still tests bilingual menu routes. Files inspected, **not executed** in this audit.
- `CONTROLES.md` still opens with dev.79 and a development-pause statement and mixes old English menu names. Confirmed documentation freshness defect, **not proof that current in-game Spanish fails**.
- Current `src/prototype/app.js` contains dev.170 preference migration; its interaction with a fresh install/first-session should be tested without changing game settings on behalf of Explorers.

**Open PR inventory observed (metadata, not all diffs validated):**
- #471 **draft** effects visibility/recorder/browser gate: optional developer-only diagnostic feature, not a required Explorer report.
- #470 **draft** audio recovery and gesture unlock; #468 **draft** audio audit/probe. Potential newcomer audio behavior differs if these merge.
- #469 **draft** artwork/Canvas/Pixi parity audit.
- #465 **draft** documentation authority/Markdown governance; #449 **draft** broader documentation and test governance. Coordinate source-of-truth updates.
- #464 **draft** Ranger/Paladin/companion projectile and VFX corrections. Its PR body reports a failing overall focused CI due to Pixi browser behavior despite passing pet-focused regressions; do not claim release readiness.
- #458 **open non-draft** TRUE-form outdoor boss hunt; potentially changes later encounters, not required for 10–20-minute trial.
- #447 **draft** Pixi regression/release-gate correction; #445 **draft** art tooling validation fixes.
- #440 **draft** disabled Critical Executions work (Stage 3 active); never imply criticals are live or add them to Explorer onboarding.
- #401 **draft** Vale landmark previews; not implemented in current main.
- #456 **draft** this Founding Explorers record; no gameplay changes.

**Risk triage for Founding Explorers:** HIGH: accurate English/es-419 start/menus, existing save versus clean profile, keyboard and phone controls, current public link/build, forum/PM route. MEDIUM: whether audio starts after a gesture, combat visual readability, renderer Keep/Revert and emergency recovery if a novice encounters them. LOW/defer: later TRUE boss circuits, full artwork parity, critical system, competitive milestones. Do not wait for unrelated draft PRs to finish if a safe minimal Explorer session can be validated; equally, do not assume their draft behavior is present on main.

**Updated next Step 1 acceptance work:** (1) fetch a *new* main SHA and open PR list at the start of next session; (2) verify the actual first-start sequence and short bilingual guide against current UI and any newly merged changes; (3) perform focused tests only with explicit record of execution/results, plus targeted desktop/phone walkthrough if tools permit; (4) confirm current public build and the chosen forum's PM capability; (5) document any confirmed first-session defects and owner decisions. Step 1 remains **NOT ACCEPTED**. Step 2 remains conditional; Steps 3–4 remain unstarted/deferred. No new gameplay features, publication, merges or full test suite authorized.

**Evidence limits:** GitHub main/package, PR statuses/bodies, and listed files were read live. PR body statements are contributor claims, not independent acceptance. No new native tests, browser tests, phone tests, real-player study, Pages URL inspection, forum access, or public post were performed. The original charter rev.3.0 remains referenced but not committed in full. Any agent continuing must re-evaluate this audit against the then-current repository.


## Original charter recovered for review — 2026-10-25

The original uploaded `Founding_Adventurers_Program_Audited_Proposal_2026-10-22.docx` was located in the current project workspace and inspected directly. It identifies itself as **“Founding Adventurers Program — Audited Project Proposal and Implementation Charter,” revision 3.0, prepared 22 October 2026**, source checkpoint `869049797d5e29270886871c89068f648c1f2a6c`. It has 204 document paragraphs and 10 tables. **The DOCX itself has NOT been committed to GitHub, and this note is not a full transcription.** Future chats that cannot access the project attachment must still obtain the original before claiming verbatim archival.

**Source-derived scope distinctions:** The original proposed *three* separate tracks: **E — Founding Explorers**, **P — Founding Pathfinders**, and **L — Founding Legends**. The Explorer track accepts genuine first-session feedback (including inability to start), asks where the player reached, what was enjoyable/confusing, and what should change; no boss clear, technical file, discovered bug, praise or public identity is required. Its original suggested recognition included optional credits/forum thanks, but **the owner's later decision narrows the launch to optional forum acknowledgment only**; in-game credits are separately deferred. The original recommended broader milestone ledger, claim validator, es-419 parity and competition fairness rules as future gated work, **not current Explorer prerequisites**.

**Unapproved owner decisions in the original:** seven challenge categories, prize caps, legacy-save competition fairness, evidence/privacy fields, bilingual glossary review, UTC contest start, appeals/ties and response cadence. The current Explorer-only owner decisions supersede the charter's suggested implementation sequencing where they differ; do not accidentally reopen the competitive track or infer consent.

**Source history warning:** The charter describes dev.166 and an unmerged PixiJS #407 as of 22 October; both are historical. This project's latest verified source baseline is dev.185 `e3c78266b28f` as of the afternoon audit, and must be checked anew before use.

**Outstanding archival task:** if the owner wants the complete source charter accessible to future GitHub-only agents, commit a faithful archival copy (ideally the original binary DOCX via an approved binary-capable workflow, or a reviewed full text extraction preserving its ten tables) in a separate clearly labeled historical-source location. Do not substitute an abbreviated summary or silently represent the extracted text as the original document.


## Cross-document consistency audit — 2026-10-25

**Authority order for future work:** (1) the owner's explicit Explorer-only decisions in this handoff; (2) latest verified `main` and relevant open/merged PR states for game behavior; (3) `FOUNDING_EXPLORERS_LAUNCH_PREP_KIT_20261025.md` for the current unpublished bilingual invitation and scenario definitions; (4) `FOUNDING_EXPLORERS_EXECUTION_RECORD.md` for evidence and go/no-go decisions; (5) the original 2026-10-22 charter as historical proposal, not automatic authorization. Earlier draft wording and dev.166/dev.169 controls must not override verified behavior or later owner decisions.

**Audit result:** No conflicting gameplay code was introduced: PR #456 is documentation-only. The newer kit improves rather than replaces the four-checkpoint plan. The handoff's initial EN/ES player guide is **historical and superseded for publication** by the newer kit, which intentionally avoids unverified Q/J shortcuts and uncertain phone tap behavior. The charter was recovered in the workspace but **not** fully archived in GitHub; the introductory sentence was corrected to reflect that distinction. The charter's competitive categories and suggested rewards are **proposals only**, not owner-approved Explorer launch requirements. The execution record remains all **NOT RUN** and the launch decision **PENDING**; no source inspection or PR description is test evidence.

**Open work snapshot (2026-10-25; recheck every session):** PR #473 audio mix policy audit; #472 combat sound coverage; #471 VFX diagnostics/visibility; #470 audio start-on-gesture recovery; #469 artwork/renderer parity and fixes; #468 audio probe; #465 docs authority repair; #464 combat projectile visuals; #458 TRUE regional bosses; #449 docs/test governance; #447 Pixi release gate; #445 artwork test repairs; #440 disabled critical executions; #401 landmark preview; and this #456. All appeared in the open-PR inventory; **open is not merged or deployed**. Source main remains `e3c78266b28f3325d2afdcb76ae849fcff306deb` at this audit. Titles and contributor claims do not certify integration. For Explorer launch, prioritize first-session usability and public build; audio/VFX/renderer WIP only become blockers if the intended build actually demonstrates an onboarding problem. Later bosses, disabled criticals and landmark previews are not launch dependencies.

**Document responsibilities:** Keep scope and decisions here; invitation copy and test scenarios in the launch kit; actual test/device/forum observations in the execution record. Do not duplicate evolving instructions across all three files. Next step: run narrowly scoped checks on an identified checkout if available; otherwise mark blocked, then perform actual public-build/device/forum acceptance when access and owner destination permit. No merge, deployment or public posting without authorization.

## Mandatory handoff instruction

In a new chat, read this file and the linked PR, fetch latest main and relevant PRs, update the reconciliation log, then continue **only the next unaccepted checkpoint**. Never silently promote source audit to passed testing or draft copy to a published invitation. Owner must approve feature scope, public commitments, merging and deployment separately.
