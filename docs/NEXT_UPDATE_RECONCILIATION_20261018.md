# Post-snapshot next-update reconciliation — 18 October 2026

**FUTURE-WORK RECONCILIATION LEDGER.** [Current project status](DEVELOPMENT_STATE.md) owns the break boundary; [the completed documentation audit](DOCUMENTATION_AUDIT_20261019.md) owns closeout evidence. Baseline `main` = [`57453c4651366a6debbcae454c70af3115e8ac2e`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/57453c4651366a6debbcae454c70af3115e8ac2e), with published gameplay source `88ee2304afcad5abde1b851686502bfbdd066779`, runtime `0.9.1+snapshot.dev.78`. Snapshot PRs [#300](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/300), [#308](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/308), [#313](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/313), plus post-snapshot fixes [#315–#318](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/318), are merged; see [release handoff](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md) for the exact publication evidence and unexecuted recent gameplay tests.

## Scope and strict freeze

This is **one future combined-update staging PR**, NOT an instruction to import all old branches. **Documentation and static source reconciliation only during the break.** No co-op implementation, sprite generation, registry change, gameplay code, save changes, CI marathon, release, merged PR, deployment, feature launch, or unapproved creative expansion. The original [sprite #217](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/217), [co-op #198](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/198), [recovery policy #296](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/296), their commits, sources, and recoverable assets remain preserved. The director will initiate future implementation and independently approve any combined release.

On return: recheck the latest `main` and deployed build; update the per-item comparison against that exact baseline, then stage only specifically accepted changes in this same PR. Require focused checks per subsystem, record actual results without re-running finished identical checks, and reserve **one** appropriately scoped consolidated validation/CI cycle for the finished candidate. No guarantee that some targeted checks can be skipped when a change materially affects saves, shared simulation, offline packaging, or input. Later additions to this next update should be recorded here without repeatedly creating competing PRs.

## 1. Sprite reconciliation — #217 is NOT an importable batch

Old source: #217 at `813ecab1f539316257aa400f4f0ab6368ea17d11` based on `0.8.138`, `tools/sprites/batches/2026-10-10-08/asset-audit.json`. The **committed** ledger records 20 prepared, zero integrated/reviewed/deployed at that checkpoint; later local 360-case native review and local installations were reportedly completed but were **not committed** after workspace pruning. Do not promote those missing edits or historical screenshots into current accepted main results.

Current `main` has **33 active approved sprite identities** in `assets/sprites/manifest.json` (manifest version 8), 74 body contracts in `tools/sprites/specifications.json`, original-master registry `tools/sprites/approved.json`, and newer game rendering/content, including 11 pets and revised hero/boss/named actor and decoration treatments. The October 8 estimate of 296 production decisions / 280 generated jobs / 16 procedural decisions was a **historical planning census, not an authoritative current asset requirement**. The October 16 source audit lists 426 renderer contracts, **not 426 required unique sprites**. Do not produce assets by either number. Re-run current `sprite:scope` against the next implementation head and reconcile actual active paths, materials, animations, variants, retired and unused art, accepted identities, regions, scenes, labels and overlays before planning quantity or generation.

### The 20 recovered records checked against CURRENT main

| Old prepared key | Current registered state | Pre-integration disposition |
| --- | --- | --- |
| `prop:vale-cottage:vale` | Registered; **same output hash** `21e8b38b7497f56b6c01f853f1100b16c78580703f546716db4e739432d68573` | **Duplicate; do not reinstall.** Current procedural proportions still govern. |
| `hero:mage` | Registered; main output **differs** from #217 | Keep current accepted registration; old export only reference; recheck character look/animations before any replacement. |
| `hero:ranger` | Registered; output differs | Same: no regression to older design/output. |
| `ally:soldier` | Registered; output differs | Preserve current troop identity and equipment, party/pet distinctions. |
| `ally:archer` | Registered; output differs | Preserve current troop identity/skills and equipment. |
| `prop:mint-workbench:highlands` | Registered; output differs | Preserve current mint/Crown imagery, actual active location and accepted source. |
| `prop:ore-sorting-bay:highlands` | Registered; output differs | Preserve current copper/silver and mining context. |
| `prop:caravan-loading-bay:highlands` | Registered; output differs | Preserve current loading route and scene context. |
| `building:barracks:vale:full` | NOT registered; exact catalog contract still exists | **Candidate only**; revalidate current regional full-barracks build appearance, stage, footprint and usage. |
| `building:barracks:march:full` | NOT registered; contract exists | Candidate only; recheck Marches building design/stage. |
| `building:barracks:highlands:full` | NOT registered; contract exists | Candidate only; recheck Highlands building design/stage. |
| `building:barracks:frontier:full` | NOT registered; contract exists | Candidate only; recheck Frontier building design/stage. |
| `building:barracks:crown:full` | NOT registered; contract exists | Candidate only; recheck Crown building design/stage. |
| `prop:highland-pay-station:highlands` | NOT registered; contract exists | Candidate only; verify current active pay-office and contextual overlays. |
| `prop:ridge-supper:highlands` | NOT registered; contract exists | Candidate only; verify authored Treasury/room and current design. |
| `prop:ridge-game-corner:highlands` | NOT registered; contract exists | Candidate only; verify current room/decor, including unique gameplay overlays. |
| `prop:ridge-study:highlands` | NOT registered; contract exists | Candidate only; current `rules.js` still mentions this decor; check live scene and 16-Oct artistic changes. |
| `prop:ridge-bed:highlands` | NOT registered; contract exists | Candidate only; verify active/retired furnishing and label geometry. |
| `prop:crag-rest:highlands` | NOT registered; contract exists | Candidate only; confirm Crag's now-current character identity, actual room and design. |
| `enemy:crownguard:ranged` | NOT registered; contract exists | Candidate only; verify exact modern Crown ranged-soldier variant, uniform, anatomy, weapon and all related mounted/guard/role variants before activation. |

**Summary: 1 historical output is already exactly live; 7 keys are live with DIFFERENT current art; 12 old candidates are absent from the current manifest but still have contracts.** Absence does **not** establish that a candidate should ship: its current spawn/binding, exact visual canon, usage, retirement or procedural preference must be independently proven. Do not replace current assets or create a second copy merely because the old PR contains image files.

For every retained candidate, trace stable ID → current renderer/source scene → active/retired status → accepted procedural reference and newer lore/design corrections → original-master provenance and all corrections → currently selected raster revision → frame/variant/clip dependencies → 150% native body footprint/anchor, label clearance and overlays → actual usage and scene-specific integration. The current October 16 [sprite canon reconciliation](PR313_SPRITE_CANON_RECONCILIATION_20261016.json), [art audit](COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md), [original-master policy](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md), [design handoff policy](DESIGN_TO_SPRITE_WORKFLOW.md), and [retired-art negative finding](SNAPSHOT_CRYPT_RETIRED_ART_PROVENANCE_20261014.md) take precedence over stale October 8 prompt/descriptive rosters. Never mistake 426 render contracts for 426 distinct bodies; retire unneeded requests without deleting original art. All final art integrations require genuine revised visual review and offline/sprite-manifest checks **after implementation resumes**.

## 2. Co-op reconciliation — #198 only, NO subsequent mode development

Original draft #198 `433cbf11d36a7f8687545a0a6e5b5d3b8e07254e` is version **`0.8.128`** and depends on #197's preserved session-policy source `43ad214459f977b27ac59608b8c7b83880619249`. There has been **no additional cooperative-mode development** since this PR; none is playable or wired to current `main`. Do not describe it as nearly finished, modernized, merged, or test-certified for `0.9.1+snapshot.dev.78`.

Its opt-in, detached one-guest roster/individual-XP prototype has no network transport, actor-aware combat, modern multi-hero persistence or normal-game Host/Join. Its original design deliberately rejects `tick()` and `snapshot()` in a two-hero session; those limitations are real, not test failures to hide. On resume, before any code cherry-pick, audit full current `main` for: all-eight hero skills and charged/targeted combat, current solo/Nightmare/Succession/finale lifecycle, companions and **new pet subsystem**, role/party capacity and Recall, roster identities, Crown economy/instructors, encounter AI/healing/VFX, modern mobile/desktop controls, v4 saves, offline PWA/service-worker scripts and actual state ownership. Then retain, redesign or discard each historical co-op assumption. Preserve single-player 100%. Do not begin co-op feature implementation during this break.

## 3. Recovery/process documentation — #296 must be REWRITTEN for current status

Old #296 at `2a6cd7ce9b378700ecfe9b94791c404c35baf645` proposed `docs/OWNER_GATED_DEVELOPMENT.md`, edits to `AGENTS.md`, and `.github/PULL_REQUEST_TEMPLATE.md`. The first and third files are **absent** on current main; `AGENTS.md` already covers durable checkpoints, exact-source evidence, appropriate validation and release approval, and [recovery desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) exists. Thus: do not drop in the old 12-Oct policy blindly, duplicate existing rules or revive its pre-snapshot approval/feature phase. Instead review remaining useful clauses for genuinely absent protections, compress into existing primary docs where possible, and choose one concise template only if still beneficial. No runtime, workflow or publication changes authorized.

**One source of current status, historical files remain historical.** The 19-Oct documentation pass replaces stale current-facing status in development state, README, release notes, controls and architecture. Dated audits are indexed as historical; source-hashed evidence stays byte-identical. No dated test result is promoted to a fresh certificate and no runtime version is manufactured. Source and release notes always distinguish current main, live deployed build, unmerged candidate, and future direction.

Documentation hierarchy:
- **Current truth:** `README.md`, `docs/DEVELOPMENT_STATE.md` top status, `AGENTS.md`, this reconciliation record and the snapshot publication handoff. Actual code/config/manifest determines version and behavior.
- **Subsystem guidance:** `docs/ARCHITECTURE.md`, sprite original-master and design workflow, `docs/DECISIONS.md`, maintained latest gameplay/reference contracts, backed by real present source.
- **Historical records:** dated audits, prior candidate/version comparisons, sprite production journals, superseded design suggestions and pre-release checklists. Preserve as evidence with clear supersession, not current instructions.

The repository-wide documentation pass is **complete on draft #319**, with [per-file classifications](DOCUMENTATION_INDEX.md) and [scope/findings/verification](DOCUMENTATION_AUDIT_20261019.md). The documentation is saved for review, not merged into main. No repeated documentation project or new gameplay certification is implied.

## Resume checklist (not an automatic job)
1. Reconfirm live package/build SHA and present `main`; compare newer content, roster, and sprites.
2. Complete per-key/feature source and usage audits; mark `retain` / `adapt` / `obsolete` / `already live` with concrete evidence.
3. Stage only compatible approved asset/feature candidates on this ONE PR; retain original source histories and rollback. Reconcile documentation once as features evolve.
4. Run focused local checks during implementation, then **one coordinated final CI, browser, save/offline and visual acceptance cycle** for exact final candidate (with additional revalidation only for actual changes/failures).
5. Obtain separate owner authorization before merging or deploying. No fixed timetable; development remains paused until the owner resumes.

**18-Oct status:** This document records a static GitHub source/manifest/document audit. It does NOT prove exhaustive active-spawn/retired-scene coverage, native visual acceptance, artwork asset reuse, two-hero behavior, or current branch CI certification.

## Post-break phases and retained visual notes — 19 October 2026

1. Full independent whole-game audit / regression pass, deliberately scoped as one quality phase when the owner returns.
2. Calm visual loving pass. Frontier captain should clearly resemble/follow its boss species; that species needs a less faceless, more alive anatomical identity. Frontier archers need terrain-appropriate clothing, potentially a Crown ranged uniform adapted to the region. Extra poppies/red flowers are optional and lower priority. These are future notes, not implemented fixes or break blockers; verify exact live species/variant IDs at that time.
3. Co-op modernization and selective old sprite adoption stay deferred under this same future PR; recheck actual need and current source before implementation. Later outreach may use a better audience, including an AI game-development Reddit space, only if the owner requests it. No messages/posts or outreach are authorized now.

The forum release remains a public milestone and playable calling card. Quiet feedback is neither QA infrastructure nor validation, and waiting on it is not a condition of taking the break. No automatic restart, scheduled follow-up or deadline exists.

## Owner direction — 0.9.1 refinement and narrow immediate fix

Remain on the 0.9.1 release line for successive post-break repairs/refinements of existing content; do not advance to 0.9.2 without a separate owner decision. The owner intends a complete from-the-beginning run with screenshots/notes, probably using Developer Mode for inspection. Co-op/new-content implementation remains deferred.

Immediate exception requested 19 October: enable manual normal/charged Skill 1 in Developer Mode on keyboard/mouse/touch while retaining the movement-auto-attack block. Candidate dev.79 stays in this same PR; no merge or publication is inferred.

## Dev.79 publication closeout — 19 October 2026

The owner explicitly approved #319 merge/publication with no further testing. Merge `23d951092ea5dff806c460c62ca71eeced574f5c` and packaging-only run [39312326936](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39312326936) published manual Developer Mode Skill 1 and the documentation closeout. Movement auto-attack remains disabled. Earlier draft/no-merge/candidate-only statements in this dated reconciliation are historical. Preserve the existing branch, old source branches and deferred notes; no new feature work or automatic restart follows from this publication.
