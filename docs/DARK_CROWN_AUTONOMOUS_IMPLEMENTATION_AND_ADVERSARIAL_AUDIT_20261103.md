# Dark Crown — autonomous implementation and adversarial audit mandate

> **8 November execution checkpoint.** Current draft progress is tracked below. Historical workers, portrait-phone previews and Phase 1 feasibility evidence cannot certify current runtime or final art.

## Current completion register

The terrain painter now reuses immutable samples at world tile centers and shared corners. A focused native Canvas terrain-only benchmark at four sites took 154–176 ms per 48 frames, versus 196–197 ms without sample reuse, with identical PNGs. Dev.283 ran active Pixi and Canvas at 800×375 for five Crown scene captures. A separate 64-draw software Chromium comparison against published dev.276 found Canvas p50 of 2.3 vs 2.4 ms at Crownwatch and 2.2 vs 2.3 ms at the Crystal Deposit. Pixi p95 was 1.2 vs 0.8 ms at Crownwatch and 0.9 vs 1.0 ms at the Deposit. This is a limited comparison, with broader performance acceptance open.

**Release gate: HOLD.** This is implementation in draft #769. The earlier focused run [42505370490](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42505370490) failed on test ownership and stale sprite-scope evidence. The new draft maps Crown tests and refreshes the audited scope, which adds only Crown renderer families and source fingerprints. The companion [PWA run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42505370498) passed for that earlier checkpoint. Four mini-dungeon assertions reproduced on unchanged main and the draft. They concern Greenwood cover/progression and an outdoor trap contract. Preserve their outcomes and keep the relevant Crown original behavior under the dedicated route and save checks.

| #707 scene | Draft evidence | Release disposition |
| --- | --- | --- |
| 1. Crownwatch approach | Existing route and city composition, procedural ground, current camera samples | Walked reveal and exits open |
| 2. Ridge and three towers | Three function-specific utility towers and an exposed Crownwatch basalt shoulder | Walked skyline framing and cross-renderer review open |
| 3. Civic square and hall | Existing rest service, forecourt and ministry frontage | Full services and matched day/night scene open |
| 4. Courtyard housing | Current-main Ash Refuge household art retained | Connected walkable housing and camera review open |
| 5. Ash Refuge | Local tower, existing households, one tested habitat | District composition and lived-in details open |
| 6. Geothermal and public works | Seven fixtures and the existing south bridge service chase. Native placement and v4 restore checks | Heat, wastewater and clean-water route legibility open |
| 7. Glass and ceramics | Fifteen existing thermal works and two realized industrial footpaths | Detailed working precincts and freight sequence open |
| 8. Both lava bridges | Native round-trip routes in both modes, no changed roads | Matched bank and deck views open |
| 9. Market and freight | Existing market and adjacent cart, with Crown masonry counters and stocked stalls | Wider provisioning route and cross-renderer review open |
| 10. Foundry | Five static work stages, static gantry, original 14 guards, 7 columns, 4 traps and exit. Native routes and save round trip | Full exterior and walked interior combat/readability open |
| 11. Citadel | Existing academy with a nonblocking exterior muster and arms station | Walked day/night framing and separate armory composition open |
| 12. Cindermaw | Existing ministry facade, sheltered communal nesting shelf and distinct private bed | Walked public/private/communal separation and night review open |
| 13. Crystals | Existing shipment with graded raw-crystal trays, protected stock and loading canopy | Walked day/night composition and security review open |
| 14. Orrery | Existing landmark retained with bronze service fasteners and a walkable engraved survey court | Walked approaches and matched lighting review open |
| 15. Fortress logistics | Existing logistics and checkpoints, Crown flag painter uses coin portrait | Full standard census and graduated approach open |
| 16. Day/night continuity | Shared painter, bath entrance fixture and reconnaissance frames | Paired walked view set and matched browser performance open |

The [52 authored art decisions and 16 natural-landscape decisions](DARK_CROWN_CAPITAL_IDENTITY_RECONCILIATION_20261031.md) remain the acceptance contract. PC03 is the equipment-only implementation and LA01 retains its written four-part blend. The three older-ground islands are Ash Refuge, southwest and the southern fold. The shared painter uses world coordinates and versioned Canvas/Pixi caches. Bridge decks, original roads, hot works and boss roosts remain protected from vegetation placement. The municipal works use fixed reviewed parcels and mark the buried clean-main crossing at the original southern bridge. No simulated production, water economy or third bridge was added.

| Existing record | Current disposition |
| --- | --- |
| #769 | Sole integration lead. Draft, no release approval requested |
| #707 | Binding contract copied into the lead. Remains open pending release |
| #794 | Isolated model brought into the lead and connected to runtime. Remains open pending release |
| #862 | Seven documentation changes reconciled in the lead. Separate release unnecessary |
| #668, #669, #670 | Relevant Crown field reviews. Original crossings and round trips checked. Service placement, rolled-back connectors, historical fixtures and owner field review require individual closure evidence |
| #658 | Parent tracks other regions and owner field visits. Keep open |
| #232, #233, #235, #247, #257, #266 | Worldbuilding and canon owners. Keep open beyond the Crown scope |
| #736 | Current main already runs Ash Refuge domestic-life composition. Do not import unrelated regions wholesale |
| #739 | Candidate historical interior material reference. Foundry-specific material comparison remains open |
| #732 | Review-only, superseded as implementation evidence |
| #770, #781 | Independent Strategist lookup and old release metadata. Exclude from the Crown source |
| #841, #755 | Highlands renderer exception and campaign-wide physical performance acceptance. Independent of scoped Crown validation |
| #839, #297 | Performance closeout and recovery references. #862 carries their bounded historical status into the lead |



**CURRENT RESUMPTION STATUS — 4 November 2026 late evening:** The [lead handoff current reconciliation](DARK_CROWN_LEAD_CHAT_HANDOFF_20261103.md) now controls: **Phase 2 IN PROGRESS/NOT ACCEPTED** after 56 historical Canvas frames, **Phase 1 engineering design already complete**, 16/16 owner-approved natural-scene decisions on #707, isolated #794 terrain engineering integration **ON HOLD**, main phone landscape #793/#798 **merged/published** separately from the old dev.258 owner preview. Phases 3/4 partial, Phase 5 final corrective QA pending, Phase 6 no-go. Read those current records before action; dated “Phase 2 NEXT / six-commit main drift” below is historical, not a live instruction.

**LIVE PHASE 0–6 STATUS, reconciled 4 November 2026 (read FIRST):** [The authoritative cross-chat master board and Phase-2 next-chat prompt](DARK_CROWN_LEAD_CHAT_HANDOFF_20261103.md#authoritative-06-phase-state-and-exit-ownership-reconciled-4-november-2026) supersede older phase snapshots in this engineering mandate. **0** baseline COMPLETE with six-commit newer-`main` integration check; **1** physical feasibility **DESIGN COMPLETE**; **2** 16-scene route-based photographic composition **NEXT / NOT ACCEPTED** (owner continues in another chat); **3** exterior **PARTIAL draft**; **4** equipped Foundry **PARTIAL draft with rejected human animation**; **5** final adversarial QA **PENDING** despite old targeted CI; **6** final review-ready handoff **NOT STARTED / NO-GO** despite cross-chat documents being ready. Last game/art source remains `9cfe284` (dev.258); the current Phase-1 follow-on source-module test has **not** run as a complete new-head Node/CI test. `main@37ef03f` adds merged #717 navigation/Cindermaw and #785 audio executable changes. All permission boundaries remain unchanged; **no Phase-2 work was begun by this status reconciliation**.


**CURRENT OWNER SCOPE AND PHASE-1 FINAL EXIT — 4 November 2026:** The creator required complete Phase-1 reconciliation before new Phase-2 work. **PHASE 1 PHYSICAL FEASIBILITY DESIGN IS COMPLETE** per [the actual-coordinate/utility closeout](DARK_CROWN_REGIONAL_IMPLEMENTATION_BASELINE_20261103.md#phase-1-final-engineering-reconciliation--4-november-2026-design-exit-complete-phase-2-not-started). This supersedes the early provisional GO: source-world generation resolves all **15 thermal nodes**, both true main bridges, two established local industrial dry gaps, and only **two** of eight optional industrial footpaths. **Sixteen** physically proposed corridors and **seven** unoccupied candidate footprints for the imported inlet, three stone/ceramic pressure towers, bathhouse, west-bank exchanger and wastewater service passed 174 focused source-module checks in Normal and 174 in Nightmare at `5c7f24a`. This harness did **not** execute the complete Node test file or GitHub CI; original full-Node source `9cfe284` previously passed [native route/v4/Campaign validation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41741468330). The approved imported underground water/tower/clean-vs-foul sewer system is a plausible **design**, not new executable plumbing or certified pressure/potability. No new Phase-2 art was started, and no new game version, merged code, deployed build or device signoff is claimed. Foundry remains the original hostile 14-guard room with provisional animated figures that the owner rejected; later Phase 4 must replace them with maintained **stationary equipment** and no worker AI. Preserve the quality and owner-consent gates below.

**Issued by the project owner, 3 November 2026. Applies across ChatGPT chats, Work sessions, agents and human implementers.** This is an **execution/quality mandate**, not a new creative contract or permission to release. Official game: *So I Became the Dark Lord's Problem* (SIBDLP), not the repository's historic development name and not SIBDL.

## Read first: authority and source of truth

1. **Owner's art direction:** [draft PR #707](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/707) and its [complete contract](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/dark-crown-capital-identity-20261031/docs/DARK_CROWN_CAPITAL_IDENTITY_RECONCILIATION_20261031.md), **all** decision IDs, qualifications and sections 10–14. The contract lives on a separate unmerged branch. Its 50 explicit selections and written instructions governing unselected PC03 and LA01 are binding. Do not fill gaps with invented lore.
2. **Implementation and progress:** [draft PR #769](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/769), its live branch `feat/dark-crown-regional-overhaul-20261103`, and [engineering baseline](DARK_CROWN_REGIONAL_IMPLEMENTATION_BASELINE_20261103.md). The baseline records Stage 0 and the latest audited evidence; read current PR commits/checks and `main` before proceeding.
3. **Standing repository policies:** [AGENTS.md](../AGENTS.md), [Development state](DEVELOPMENT_STATE.md), [Architecture](ARCHITECTURE.md), [Decisions](DECISIONS.md), [Engineering workflow](MECHANIC_DEVELOPMENT.md). Respect source ownership, test-scope consent, save and gameplay invariants, and the existing documentation-maintenance rule.

**Authority hierarchy:** latest explicit owner instruction > standing repository consent/engineering policy > owner's #707 creative contract for this feature > current verified implementation evidence. A stale handoff or assistant interpretation does not override the contract. If instructions conflict, surface the specific conflict and preserve the owner-approved design; do not silently choose.

## Mission and autonomy

Take engineering ownership of implementing the **actual Dark Crown regional overhaul**, from source verification and design feasibility through working game changes, scene evidence, corrective audit and review-ready draft PR. Do not stop at a plan, markdown, tests, renamed props or mockups. Build a believable inhabited volcanic civilization with distinguishable civic, domestic, industrial, administrative and military life. Make the Foundry a **maintained, inhabited, visibly productive** institution while protecting its existing side-dungeon mechanics and saved identities.

Within the approved scope, independently inspect source, design engineering approaches, modify code/art, create focused tests, review actual output, fix defects and keep existing documentation current. Avoid unnecessary owner homework, new tracking bureaucracy and repeated questions. Request owner input only for genuinely unresolved creative choices, consequential risk/scope changes or explicit consent gates. Do not treat silence as authorization.

**Prohibited without fresh explicit authorization:** merge PRs, push to `main`, deploy/publish Pages or any playable build, run comprehensive/full-game/browser/performance matrices that the repository reserves for manual consent, certify physical-device behavior without actual device evidence, or change the #707 creative decisions. Ordinary focused PR checks are allowed under existing policy. No continuous/background work may be claimed after a session stops.

## Engineering phases and exit gates

| Phase | Deliverable and acceptance evidence |
| --- | --- |
| 0. Reconcile source | Re-read #707, #769, current `main`, overlapping drafts, Stage 0 screenshot evidence, baseline gameplay/geometry/IDs; log actual differences and risks, not assumptions. Existing 46 real Canvas2D images are **candidate before-state camera references only**, not proof of contract-category coverage, correct focal landmarks, player-reachable routes, Pixi/device fidelity or artistic acceptance. Their labels indicate intended surveys, not verified depicted subjects. |
| 1. Physical feasibility | Map real district/foot traffic, production inputs/outputs, freight, thermal intake/exchange/distribution, conditional water sources/treatment/replenishment, baths/drainage/waste, original Foundry combat routes and spatial equipment zones. Distinguish source-proven geology and protected dry-gap *proposals* from functioning utilities; no extra worker/guard AI. Water insufficiency is a documented implementation dependency, not a claim to a working bath. A decorative flue is not a heat network. |
| 2. Visual composition | Establish material/architecture grammar and camera-reviewable scenes, covering all 16 numbered #707 design-board **scene categories** and their distinct required subviews (including both bridges, Foundry exterior/interior, ministry/den and night), plus connective streets. Evaluate actual camera framing, foreground walking room, day/night, city skyline, home comfort, labor, civic dignity and regime gradient. |
| 3. Exterior implementation | Implement site-scoped Crownwatch/Ash Refuge, two original lava crossings, industrial zones, markets, freight, civic institutions, gardens, landmarks and fortress approaches. Preserve roads, collision, NPC services and v4 saves; no blanket street rewriting. |
| 4. Foundry implementation | Rebuild existing `side-crown-foundry` with professional **stationary equipment** for receiving, storage, hot furnace/press/forming, air cooling/finishing, shipping, rest and original ready-to-fight hostiles. **No visible laborers, moving attendant or civilian work AI.** Preserve entry/exit, all 14 hostiles, seven pillars, four traps, enemy IDs, rewards, critical Codex, quests and restore behavior unless expressly approved otherwise. |
| 5. Independent corrective audit | Validate current-game implementation against #707, inspect native actual renders and Pixi where available, exercise traversal/encounters/old saves, measure bounded rendering costs, fix material defects, rerun relevant original checks and document unsupported device claims. |
| 6. Review-ready handoff | Provide exact SHA, files changed, contract coverage, test evidence, images, risks, unresolved owner choices and next steps. Leave draft PR unmerged and unshipped. |

These phases can be implemented incrementally and revisited; do not fabricate completed phases. A test that checks existence of a prop does not establish the owner's aesthetic or engineering objective.

## Adversarial audit: indicators of poor AI task execution

Audit deliberately **against** the implementation, not as a ceremonial checklist. At minimum inspect:

1. **Surface compliance:** extra props, recolors, renames, markdown-only changes, placeholder workers, decorative pipes without causal connections, claimed production without material flow, and visuals that merely resemble a generic dark fortress.
2. **Proxy gaming:** object counts, green checks, snapshots or screenshot byte sizes used as substitutes for actual quality; assertions that prove only code paths, not behavior; tests adjusted to match a defective result.
3. **Scope/canon drift:** invented Foundry name or products, unsupported water source, altered civic identity, displaced established infrastructure, a third lava crossing, changed region IDs or accidental imports from unmerged drafts.
4. **Incomplete integration:** uncalled code, dead branches, unused assets, fake animations, missing renderer parity, orphaned data, inaccessible entrances, blocked routes/services, broken actor interaction, unconnected heat/water/logistics and unreviewed mobile crops.
5. **Regressions:** combat telegraphs, guard/monster budgets, rewards, quests, NPC schedules, collision, navigation, travel, saved objects, old v4 restore, enemy respawn/duplication and deterministic scene migration.
6. **Engineering quality:** brittle hacks, accidental complexity, duplicate systems, excessive abstraction, poor modularity, hidden coupling, unbounded work per frame, allocation churn, GPU texture/memory growth, asset licensing and code that cannot be maintained.
7. **Visual/experience defects:** incorrect scale, monotonous silhouette, blocked foreground, cramped civic space, implausible materials, inconsistent lighting, insufficient nighttime readability, hostile/civilian confusion and lack of credible inhabited behavior.
8. **Evidence integrity:** stale base/commit, unexecuted or selectively reported checks, generated concept art passed off as gameplay, Canvas evidence mislabeled Pixi, phone-sized crop mislabeled real device, screenshots from a different SHA, or omitted known failures.
9. **Premature completion:** saying implemented when merely planned, tested when only committed, merged when draft, deployed when not published, or device-verified without a real device; reporting all requirements complete when blocked or unexamined.

For each material finding, record **evidence and affected requirement → severity/impact → root cause → correction → retest result**. Prefer independent original regression tests, actual Campaign scenes, fresh and older saves, and a reviewer pass that tries to falsify the implementer's own claims. If available, separate implementation and adversarial review contexts. A second pass by the same agent is useful but **not truly independent**; disclose that limitation. Never weaken tests or narrow the test scope to conceal a relevant failure.

## Failure handling and evidence policy

Follow AGENTS.md's **BLOCK NOW / INVESTIGATE BRIEFLY / DEFER WITH OWNERSHIP** classification. Correct material defects within authorized scope, rerun the relevant tests and inspect the real result; do not merely report them. Unexplained relevant regression, corrupted save, broken access, contradicted owner contract or misleading visual evidence is a block, not a cosmetic deferral. Minor unrelated proven debt may be tracked proportionately without stopping independent work.

Use the current repository's focused CI (continuous integration: automated checks on code changes), not a full suite by default. GitHub Actions screenshot uploads have limited retention; if expired, regenerate from the committed test rather than treating missing images as reviewed. The current screenshot smoke test checks painting and save nonmutation, **not composition, actor productivity, route reachability, industrial function, Pixi parity, or cross-run pixel identity**. PNG SHA-256 fields prove each index entry corresponds to that run's PNG; they are **not approved golden-image expectations**. A post-hoc comparison across two CI archives found small pixel differences in all 46 frames despite otherwise matching scene metadata; do not claim pixel determinism or silently normalize these differences. Record exact tested CI checkout/merge SHA **and** PR head where different, commands/check URLs, result, actual screenshot provenance and what was **not** checked. Performance claims require actual comparable measurements; artistic acceptance requires genuine perceptual review; phone-sized Canvas/Pixi rendering is not device verification.

## Budget-conscious division of labor and GitHub-native delegation (owner direction, 3 November 2026)

**3 November 2026 active-chat override:** The owner has no available Work allowance and explicitly directs the same workflow through **one ordinary Chat acting as lead engineer** and separately launched ordinary Chat helpers. Wherever the text below says “Work,” read it as the **active lead implementation Chat** until the owner explicitly changes the arrangement. The lead retains sole integration-write/architecture/adversarial responsibility, and each supporting Chat remains bound by the existing `DC-CHAT-###` GitHub task/receipt and read-only default. This is a staffing change only: no new permission for full suites, merges, deployment, background execution, invented creative choices or device-verified claims. The owner manually launches helpers, and leads resume only in active sessions.



**Primary objective:** conserve the owner's ChatGPT Work allowance **without lowering the design or engineering acceptance standards**. Work performs integration-heavy implementation and substantive adversarial review. Regular Chat sessions perform small, verifiable support tasks; the owner only opens a Chat using a short prompt supplied by Work. Work **cannot open new Chat sessions itself** and must not imply it can. Cross-session coordination happens in GitHub, **not through the owner copying Chat responses back to Work**.

### Responsibility and escalation

| Work owns (heavy lifting) | Ordinary Chat handles when useful (lightweight) |
| --- | --- |
| Cross-system architecture, source-grounded physical feasibility, art direction implementation, world/Foundry scene construction, Pixi/Canvas integration, source changes with coupled gameplay impact | Read-only GitHub PR/branch/status inspection, targeted CI run and log follow-up, minimal existing focused-test execution when tools permit, branch/base drift checks, docs/link consistency checks, evidence summaries |
| Revisions to the integrated implementation, visual experience judgment, major performance diagnosis, game/save/navigation regressions requiring substantial edits, final corrective adversarial assessment against PR #707 | Narrow evidence review, screenshot provenance/comparison, single failing-check triage, contract-to-implementation gap identification, isolated regression test analysis and scoped investigative tasks |
| Review and integration of any helper's proposed changes; phase exit decision; consistency of PR #769's main baseline/handoff | Report factual findings and actionable recommendations to GitHub; optionally make a tightly scoped change on a **separate branch/PR** only when explicitly delegated, without modifying Work's branch |

Use normal Chat for bounded tasks **when it genuinely reduces Work effort**; do not force every tiny check into a new Chat (which requires the owner to launch it), duplicate investigations across sessions, or create needless test/CI reruns. Don't use Work simply to poll an already-running CI. If a Chat task reveals complex/high-risk changes or insufficient authority, record **BLOCKED / NEEDS WORK REVIEW** on GitHub rather than guessing or making a broad patch. Work retains accountability for implementation, integrated correctness and ultimate audit quality.

### GitHub as the task mailbox and return channel

**Default location:** the Conversation comments of [draft implementation PR #769](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/769). Use one clearly labeled **`DC-CHAT-###`** top-level GitHub PR comment for each meaningful delegated task. This is a *task record*, not a new feature document/issue or a change to creative authority. Do not write task instructions only into a Work-chat message.

**Work prepares the task record first**, including:
- **ID and status:** e.g. `DC-CHAT-001 | OPEN`, with goal, owner ("ordinary Chat"), phase and priority.
- **Exact source pointers:** PR #769, authoritative PR #707 when relevant, branch and observed source head; relevant CI run URL/log, file paths, existing test command, artifact URL or review comment. A recorded SHA is a snapshot: the receiving Chat must check the live head before trusting it.
- **Bounded scope and done definition:** specific question or test/failure to investigate, expected evidence, checks to run, what constitutes PASS/BLOCKED, maximum reasonable scope, and any files it may modify. **Default is read-only**.
- **Permission limits:** no unapproved full suite/browser matrix, new deployment, main push, merge, creative decisions or unsanctioned feature-branch writes. If the task is code-writing, isolate it on a separate branch/PR and let Work own integration.
- **Return destination:** the same PR #769 Conversation thread. Include the task ID in every result comment; do not rely on copying a response back into Work.

**Work then gives the owner a short copy/paste prompt, preferably containing the specific PR-comment URL**, such as:

> In `joedoragon-glitch/azeroth-chronicles-prototype`, open Dark Crown PR #769 and its delegation comment **DC-CHAT-001**. Read that GitHub task record and the current branch/CI state, then execute the scoped routine task. Post your evidence, outcome and next-action recommendation as a new comment on PR #769 referencing DC-CHAT-001. Do not merge, deploy or edit the implementation branch unless the task expressly authorizes it.

The owner simply opens a **new ordinary Chat** and pastes the prompt. The receiving Chat reads the **actual task body from GitHub**, not a paraphrase from the original Work session. It reads only what the task needs. Do not automatically consume context by re-reading the entire 52-choice art contract or all repository documentation for a basic CI-status check; read those when artistic or gameplay facts are material.

**Ordinary Chat completes the round trip inside GitHub:** post a concise new PR #769 comment:
`DC-CHAT-001 | DONE / BLOCKED / NEEDS WORK REVIEW`; the observed PR head and exact CI/tested SHA (different when GitHub checks a synthetic merge); links to checks and evidence; concrete findings, changes if any, remaining concerns, and **one** recommended next action. Do not mark PASS for an unrun check. If direct GitHub-comment permission is absent, clearly tell the owner that the result was **not recorded**; offer the shortest possible fallback text, rather than claiming Work can see it.

**Work's next active session** fetches PR #769 comments, reconciles each `DC-CHAT-###` request with its latest matching `DONE/BLOCKED` receipt, verifies anything material against current source and CI, and incorporates accepted findings in the existing engineering baseline and implementation plan. Work may close or supersede a delegated task **in a new PR comment** with the same ID. A completion comment is **evidence**, not automatic acceptance of a patch or artistic result. Avoid unnecessary recopying of long findings into multiple documents.

### Concurrency, cost and continuity safeguards

- **One integration writer.** Work owns the active implementation branch by default; Chat helpers investigate **read-only** unless Work explicitly hands off exclusive file scope or a separate PR. Avoid same-file concurrent writes, automatic rebases, force pushes and blindly applying stale patches. Re-fetch current head and use lease-protected ref updates when committing. `main` can advance while a helper is checking CI; a changed base must be noted rather than silently overwritten.
- **No invisible sessions.** Work does not launch chats, monitor GitHub continuously, or resume itself after the user leaves. The owner triggers each chat/Work session. The workflow supports back-and-forth **across separate active sessions**, not a background coordinator.
- **Right-sized evidence.** Routine CI checks should inspect existing runs before causing fresh ones; existing relevant focused validation beats repeating successful unchanged tests. Follow `AGENTS.md` for real blockers versus bounded deferrals. Preserve the owner-required independent adversarial audit and no-merge/no-deploy gates.
- **Minimal owner involvement.** Work provides the launch prompt. Chat writes the return receipt to GitHub. The owner need not relay Chat output manually. If posting to GitHub fails or a creative/consent decision is required, say precisely what single intervention is needed.

**Task states** are simple labels in PR comments (`OPEN`, `DONE`, `BLOCKED`, `NEEDS WORK REVIEW`, `SUPERSEDED`), not a new ticketing system. PR #769 and the baseline remain the persistent implementation record; #707 remains the immutable creative reference until owner-authorized change.

## Current cross-chat continuity — active lead Chat, 3 November 2026

The owner's latest execution model uses an **ordinary Chat as the integration lead**, not Work by default. The fully reconciled implementation/source/evidence checkpoint and **phase 0–6 status with one immediate workstream** are in [the self-contained lead handoff](DARK_CROWN_LEAD_CHAT_HANDOFF_20261103.md). Any new ordinary Chat can own the lead after reading the live records; **it should not require the user to provide this chat transcript**. The following Work-named steps apply equally to the lead Chat. Do not restart historical Phase 0 as if no real work had occurred; preserve exact-head CI and existing art decisions, but repeat narrowly relevant drift/audit checks when required. No two chats should write the same branch concurrently.

**Owner interpretation of optimization:** balance meaningful creative ambition and engineering complexity; avoid both premature restraint and gratuitous systems/micro-optimizations. Aim for a credible, appealing capital and genuinely productive Foundry. Explicit authorial constraints, performance risks, and tangible test outcomes determine the scope of implementation.

## Session-resume protocol (mandatory)

At the start of **every new Work implementation session**:
- Read this mandate, PR #707's full contract, PR #769, the implementation baseline, AGENTS.md, and unresolved delegated task comments. **For a supporting ordinary Chat, the bounded GitHub task record governs its necessary reads; do not make it re-ingest unrelated creative contracts and engineering documents.**
- Fetch live `main`, branch heads, open PR changes, relevant CI runs and any outstanding review comments; never assume a previous chat's SHA is current.
- Identify the last **verified** phase, current blockers/deferrals, pending checks, active unmerged edits and **one next useful implementation step**.
- Compare candidate screenshot filenames with *visible* source landmarks; maintain contract-scene coverage by actual focal object, route, desktop/narrow evidence and explicit accepted/unverified status. A screenshot existing does not mean the corresponding scene requirement is met.
- Continue actual work, not another redundant planning cycle.

Before ending **each substantive Work implementation session**, update the **existing** PR #769 and baseline with what was implemented, the **last actually tested SHA** and its evidence, what remains, findings, next action and unresolved approvals. After committing documentation, use the live PR head/commit URL as the authoritative **latest source SHA**. A document cannot embed its own eventual commit hash; never mislabel a preceding SHA as the document's head or claim docs-only CI proved runtime implementation. Reconcile other feature documentation affected by code changes. Do not create competing handoff documents or claim work will continue invisibly after the session ends.

## Definition of review-ready (not merge permission)

All implementable #707 requirements have traceable outcomes or explicit genuine blockers; the real game displays a credible volcanic civilization and working Foundry; original gameplay and v4 saves survive relevant checks; actual scenes have been inspected; bounded performance and renderer risks are tested or honestly disclosed; adversarial findings are corrected or explicitly owned; documentation and draft PR evidence are current. A green CI alone is insufficient. Before any authorized merge, reconcile branch-specific links and ensure #707's design contract remains reliably retrievable; an unmerged source branch might later be deleted. **Only the owner authorizes merge and deployment.**

**Work/Chat allocation:** Use the GitHub-native `DC-CHAT-###` delegation protocol above to outsource bounded routine checks to ordinary Chat, with each Chat posting results directly to PR #769. The owner should only need to copy Work's short launch prompt, not the helper's findings.

**Shortest restart instruction:** “Continue Dark Crown PR #769 under `docs/DARK_CROWN_AUTONOMOUS_IMPLEMENTATION_AND_ADVERSARIAL_AUDIT_20261103.md`. Read PR #707 and live GitHub state; implement and audit the next phase. Do not merge or deploy.”
