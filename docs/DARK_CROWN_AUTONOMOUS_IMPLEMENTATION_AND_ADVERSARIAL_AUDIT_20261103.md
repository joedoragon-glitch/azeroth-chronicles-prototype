# Dark Crown — autonomous implementation and adversarial audit mandate

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
| 0. Reconcile source | Re-read #707, #769, current `main`, overlapping drafts, Stage 0 screenshot evidence, baseline gameplay/geometry/IDs; log actual differences and risks, not assumptions. Existing 46 native Canvas captures are **baseline only**, not Pixi/device/art acceptance. |
| 1. Physical feasibility | Map real district/foot traffic, production inputs/outputs, freight, thermal intake/exchange/distribution, water sources/treatment/replenishment, baths/drainage/waste and Foundry worker/guard circulation. Separate established canon, plausible engineering hypotheses and owner decisions. A decorative flue is not a working heat network. |
| 2. Visual composition | Establish material/architecture grammar and camera-reviewable scenes, including the 16 #707 required compositions and connective streets. Evaluate actual camera framing, foreground walking room, day/night, city skyline, home comfort, labor, civic dignity and regime gradient. |
| 3. Exterior implementation | Implement site-scoped Crownwatch/Ash Refuge, two original lava crossings, industrial zones, markets, freight, civic institutions, gardens, landmarks and fortress approaches. Preserve roads, collision, NPC services and v4 saves; no blanket street rewriting. |
| 4. Foundry implementation | Rebuild existing `side-crown-foundry` with receiving, storage, active workstations, workers doing legible work, safe cooling/finishing, shipping, rest and guard/encounter separation. Preserve entry/exit, hostile gameplay, enemy IDs, rewards, traps, quests and restore behavior unless explicitly approved otherwise. |
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

Use the current repository's focused CI (continuous integration: automated checks on code changes), not a full suite by default. Record exact tested commit, commands/check URLs, result, native screenshot provenance and what was **not** checked. Performance claims require actual comparable measurements; artistic acceptance requires genuine perceptual review; phone-sized Canvas/Pixi rendering is not device verification.

## Session-resume protocol (mandatory)

At the start of **every** new chat/Work session:
- Read this mandate, PR #707's full contract, PR #769, the implementation baseline and AGENTS.md.
- Fetch live `main`, branch heads, open PR changes, relevant CI runs and any outstanding review comments; never assume a previous chat's SHA is current.
- Identify the last **verified** phase, current blockers/deferrals, pending checks, active unmerged edits and **one next useful implementation step**.
- Continue actual work, not another redundant planning cycle.

Before ending **every** session, update the **existing** PR #769 and baseline with exact head SHA, what was implemented, what was tested and its evidence, what remains, severity of findings, next action and unresolved approvals. Reconcile other feature documentation affected by code changes. Do not create competing handoff documents or claim work will continue invisibly after the session ends.

## Definition of review-ready (not merge permission)

All implementable #707 requirements have traceable outcomes or explicit genuine blockers; the real game displays a credible volcanic civilization and working Foundry; original gameplay and v4 saves survive relevant checks; actual scenes have been inspected; bounded performance and renderer risks are tested or honestly disclosed; adversarial findings are corrected or explicitly owned; documentation and draft PR evidence are current. A green CI alone is insufficient. **Only the owner authorizes merge and deployment.**

**Shortest restart instruction:** “Continue Dark Crown PR #769 under `docs/DARK_CROWN_AUTONOMOUS_IMPLEMENTATION_AND_ADVERSARIAL_AUDIT_20261103.md`. Read PR #707 and live GitHub state; implement and audit the next phase. Do not merge or deploy.”
