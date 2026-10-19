> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# WORK-MODE HANDOFF — one consolidated Community Snapshot / PR #311 / Issue #312 update
**16 October 2026 · SOURCE DEVELOPMENT ONLY · NOT PLAYABLE/CERTIFIED**

This document is the independent entry point for a new Work chat. The developer does **not** need any past conversation, pasted prompt, or memory to resume. Read this document and the linked canonical GitHub sources before changing code.

## Source of truth and recovery (read live GitHub heads before editing)

1. **Single active integration branch:** `integration/community-snapshot-311-20261016` in `joedoragon-glitch/azeroth-chronicles-prototype`. This branch owns the entire future update. Continue it and its one draft integration PR; do not overwrite `main`, start an unrelated competing implementation branch, or merge constituent drafts.
2. **Production predecessor:** merged PR #308, main baseline `6bc27be31792b1c38147d61e98ceed6acf3e2560`. PR #300 was merged earlier. If main changes, compare and reconcile instead of resetting feature work. A main push can publish GitHub Pages/PWA.
3. **Community Snapshot:** independently recoverable source-readiness checkpoint `ca33acb14d92cbce12633eaab702318343dce509`, branch `feature/community-snapshot-post308-20261016`. First seven-finding audit failed; its second audit passed **source readiness only**, no tests. Includes eleven TRUE-boss pets, veteran troop skills, procedural art, menu/Archive, save and performance changes. Read [Community implementation](COMMUNITY_SNAPSHOT_IMPLEMENTATION_20261016.md), [second audit](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md), [art census](COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md) and [balance study](COMMUNITY_SNAPSHOT_BALANCE_20261016.md).
4. **Ten gameplay/visual fixes:** [draft PR #311](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/311), exact latest head `b6217312beefb451b9521d3303565f4778973b30`. Its latest commit changed **audit documentation only**. Original ten-issue runtime version `b91347f863d68d6b7beca76e23f625ddd7ff1293` was integrated, including all 40 incoming hunks with one intentional extended Recall/pet hunk. Read the [ten-issue execution audit](PRE_SNAPSHOT_TEN_ISSUES_IMPLEMENTATION_AUDIT_20261015.md), [integration reconciliation audit](COMMUNITY_SNAPSHOT_PR311_INTEGRATION_AUDIT_20261016.md) and prepared tests. **Do not merge PR #311 separately**; its code is already in this branch.
5. **Eighteen additional findings:** [Issue #312](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/312) is the **authoritative complete 18/18 specification**, including the owner's actual observations, binding refinements, suggested solutions, audit findings, and acceptance gates. Read the **complete issue**, not only the compact list. The issue is a specification and source audit, **not eighteen implemented fixes**.
6. **Local development record:** [Issue #312 integration ledger](ISSUE_312_CONSOLIDATED_IMPLEMENTATION_LEDGER_20261016.md). Early source-only commit `67e68758b5c27dc2fc441ddffce7927c4084b9d4` brought the final PR #311 audit plus proposed PT-018 and partial PT-003/PT-012 changes. The exact protected-source receipt has been extended; check the current integration PR head before starting.
7. **Release and validation:** [one consolidated validation plan](COMMUNITY_SNAPSHOT_VALIDATION_20261016.md); read the final source handoff audit in the same folder. All historical release proof is scoped to **earlier trees** and does not certify this update.

## Absolute workflow policy

The owner requests **one substantial feature integration, one later comprehensive validation cycle, one separate eventual release decision**. **Do not run Node tests, builds, format checks, syntax checks, automated simulations, browser/device sessions, manual game play, benchmarks, GitHub Actions, CI or deployments during this source-implementation phase.** Static source reading, exact diff/provenance comparison, new unexecuted test authoring, Git commits and source audits are allowed. Use `[skip ci]` on development commits and retain a **draft PR**. Opening a PR can otherwise trigger Actions through `.github/workflows/pages.yml`; check GitHub run metadata read-only before/after and report any unexpected run rather than pretending no CI launched. Do not approve automatic merge. Do not publish/tag/release/merge. The owner must **explicitly authorize validation** after a passing final combined source audit; a separate owner decision is required before merge/publication.

Apply reasonable solutions based on existing code/source maps. The owner explicitly does not want homework or reconstructions of the earlier conversation. If an exact screenshot/prop ID/seed was never recorded, independently identify and reproduce it in authorized validation rather than fabricating it.

## In-scope items and exact present status

**Community Snapshot:** Source-integrated, originally re-audited for source readiness, still completely unvalidated with #311/#312. Preserve all eleven pets, historical TRUE entitlements, charge semantics, companion movement/labor rules, original illustrated identities, all procedural review handoffs and documented balance hypotheses.

**PR #311 ten issues:** All ten implemented in source and preserved: targeted out-of-range skills; durable defensive Recall and pet self-defense; Dark Lord coins/mint; cross-species enemy healing; Treasury life/work props; major actor occlusion; guard alerting their captain; Scornfang +50% HP and captain range with old-save migration; species Rogue maneuvers; captain cooldown/anti-kiting. These are **not tested**. Cross-feature source fix IN-01 keeps ranged and melee boss pets from being treated as Soldiers during Recall.

**Issue #312 PT statuses:** Treat the issue's detailed text as binding; the table below is a routing index, not a replacement.
| ID | Current status | Implementation owner and focus |
| --- | --- | --- |
| PT-001 | UNCONFIRMED OBSERVATION; unimplemented | Thornfang owned Den pup refill selection, cooldown/leash/Developer parity; do not invent new core skills |
| PT-002 | UNIMPLEMENTED | Real actor separation/steering; bounded friendly de-gridlock, no wall-phasing or permanent body walls |
| PT-003 | PARTIAL PROVISIONAL SOURCE | Enemy equipped weapon/material audio, actual event equipment, windup/hit differentiation; current generic Goblin steel fallback is **not** equipment fidelity |
| PT-004 | UNIMPLEMENTED | Greenwood Orchard Den road obstruction, occupied cellars approach, west Millhaven footpaths and livelihoods |
| PT-005 | UNIMPLEMENTED | Both Southern Footbridge bank connections, Treasury and Forest Crypt supply route |
| PT-006 | UNIMPLEMENTED | Marches cattail clustering with wet hydrology plus limited saturated inland growth |
| PT-007 | UNIMPLEMENTED | Connected reachable arena footprints for every patterned boss/captain AoE; honest counts and telegraph/impact parity |
| PT-008 | OPTIONAL POLISH UNIMPLEMENTED | Restrained captain/boss nameplate hierarchy, never wallhack/constant reveal |
| PT-009 | UNIMPLEMENTED | Lake Causeway connected irregular wetlands, banks, road crossing |
| PT-010 | UNIMPLEMENTED | Integrated geography, roads, props, hydrography and settlement audit across ALL five outdoor regions |
| PT-011 | UNIMPLEMENTED | Canon-aware procedural silhouette craftsmanship across creature/transport/prop families, not universal cuteness |
| PT-012 | PARTIAL PROVISIONAL SOURCE | Ridge LEDGER CAST vs Rolling Cargo differentiated; cargo launch/wall/target audio drafted, not audible-certified; investigate cast commitment/leash |
| PT-013 | UNIMPLEMENTED | Ironroot rivers to coherent sources/borders, bridges, Timber and Stone road junctions |
| PT-014 | UNIMPLEMENTED | Ridge Treasury off carriageway and integrated mining freight routes |
| PT-015 | UNIMPLEMENTED | Per-boss/captain/TRUE and Rogue sound-event matrix, priority/mix; cargo subset only |
| PT-016 | UNIMPLEMENTED | Case-by-case arrival/chamber pacing in all major dungeons, Treasuries, side sites, preserving threat and counts |
| PT-017 | UNIMPLEMENTED | Species-specific lived-in Old Signal Keep and other occupied interiors, safe topology |
| PT-018 | SOURCE DRAFT ONLY | Developer Mode FREE transportation/no tickets/no progression payment; normal/nightmare unchanged; no gameplay proof |

Do not close Issue #312 until all eighteen receive implementation AND owner-accepted validation evidence. Do not conflate a source-verified mechanism with reproduction of a player-observed problem.

## Mandatory preservation of the original seven-finding Community repair — A01–A07

**This was the first active assignment and is NOT superseded by the 10 + 18 newer issues.** The exact Community source-readiness checkpoint is `ca33acb14d92cbce12633eaab702318343dce509`, following frozen repaired runtime `754e72e9cb5819bb815fde97488d44275e870453`. Its follow-up [A01–A07 source audit](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md) passed for the **original candidate only**. Preserve that audit, the [failed original audit](COMMUNITY_SNAPSHOT_EXECUTION_AUDIT_20261016.md), the [repair ledger](COMMUNITY_SNAPSHOT_AUDIT_REPAIRS_20261016.md), [source contract](COMMUNITY_SNAPSHOT_SOURCE_CONTRACT_20261016.md) and [art audit](COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md). Re-verify all seven on the *final combined tree*, not by trusting old certificates.

| Original finding | Binding source preservation | Future unexecuted proof |
| --- | --- | --- |
| **A01 — ranged pet positioning deadlock** | `party-pets.js` covered-anchor, coincident-position, wall and stopping margin; never disable available basic attacks | Real range boundaries, room walls, stationary hero and all eleven pet combat routes |
| **A02 — unsupported comprehensive art claim** | 426 identified renderer contracts, branch-specific observations, aliases, all affected enemies/structures/props; don't conflate contracts with individual sprites | Native-size per-design visual acceptance including retained and changed art |
| **A03 — absent pet regression and balance coverage** | Authored all-11 production-tick tests, charge/interrupt/Slow/support cases and matched #308 baseline 6,912 candidate + 3,072 baseline scenario design | Actually run and interpret adverse balance/regression observations only after owner approval |
| **A04 — native capture fixture defects** | Accurate entity and resource factories, actual world-painter presence, pet facings, menu states, DPR and five native viewports | Chromium/WebKit screenshots, movement, day/night, 100/150/175% and human appearance review |
| **A05 — wrong pet area targeting** | Direct aim remains targetable; circle/cone/line collateral honors shape, cover, caps and far strip corners | Actual attack/hit and visible warning footprint consistency |
| **A06 — absent pet skill teaching/presentation** | Brief menu shape/reach, detailed Keeper geometry, real charge/release projections, unique visual cues | Native text legibility, collision of labels/effects, accurate guidance |
| **A07 — design references/provenance drift** | 32 changed existing contract handoffs plus 11 pet records tie to immutable corrected runtime and dependencies | Updated isolated/gameplay art captures and provenance attached to current actual tree |

Retain the pet ownership, `s.true` historical unlock, valid unique families, v4 saves, 200-roster and active limits, recovery identity, Soldier/Archer invariants, and the separate audio audition graph. **Do not erase or weaken the authored tests or historical source/hash guards to make later certification green.** No new source audit can be marked passing unless these obligations are individually checked again.

## Work stages and cross-feature dependencies

**A — Audit and fix source-readiness before broad edits.** Refresh branch/PR/Issue #312/main, inspect source/fixture graph, compare version/generated asset carriers. Inspect the proposed early PT-018/PT-003/PT-012 diffs and unexecuted `tests/pt312-early-integration.test.cjs`. Identify whether any partial audio assumptions (notably species-only weapon fallback) contradict visible equipment. Maintain a dated findings table with severity, exact owner, proposed remedy and disposition. Preserve original Community, #311, #312 code and tests.

**B — Core gameplay invariants.** PT-018 source contract, Thornfang PT-001 source logic (do not change without confirmed gap), PT-002 actor separation versus collision-free pathfinding, PT-007 connected-room AoE, PT-012 committed cast/leash; integrate with #311 enemy healing, captain reach/anti-kiting, pet Recall, all class charged skills, boss/TRUE/rogue and old save v4. Temporarily relax friendly crowd collision only if objectively stuck; keep no permanent stacks or invulnerable combat geometry.

**C — One joined world/spatial pass.** PT-004/005/006/009/010/013/014 together, using the current `world.js`, `rules.js`, `navigation.js`, composed water, authored roadNetwork/site/bridge connections, road footprint **as painted at 100/150/175% camera** and fresh + old saved zones. Preserve encounter IDs, all entrances, barriers, quest/NPC spawn clearances, return transport and intended tactical choke points. No mass reconstruction or unrelated map expansion.

**D — Audio, presentation and interior identity.** PT-003/PT-012/PT-015 using existing `audio-enemy.js`, `audio-effects.js`, projectile/VFX event owners, real weapon/style/impact materials; no bogus warning sounds, accidental amplification or double delivery. PT-008/011/016/017 preserve boss discovery challenge, coherent ogre-standard rounded craft without uniform cuteness, guard densities, traps, lore/professions and valid room movement. Do not create new sprite catalog without need.

**E — Final static cross-feature source audit.** Prove explicit 11-pet, 10-issue and 18-issue coverage. For each item: source owner, exact diff, interaction/conflicts, old-save compatibility, visual/audio teaching where appropriate, authored *unexecuted* regression or native/manual acceptance, unresolved factual caveats. Review all prior seven Community-audit corrections and 40 PR #311 hunks; preserve old source exact hash receipts and **append** a new SHA-256 authorization overlay for each subsequent edited source, never blanket-ignore hashes. Check module load order in site asset inventory and audio audition graph. A source PASS means only ready for the owner's decision on validation; it never means a successful game.

**F — Owner decision then one consolidated validation:** Only after the owner says to proceed, choose final version; regenerate package/lock, `build-info.js`, all site HTML and PWA worker, then execute full Node/Chromium/WebKit/CI, old-save migration, art/native phone/desktop, hero/pet/boss balance, sound, offline upgrade and natural play. Fix failures in this same PR. Do not merge/deploy until another explicit owner decision.

## Acceptance and honest known limits

- Runtime correctness, current gameplay balance, native appearance, all regression suites, hardware comfort, WebKit, PWA, old exports and continuous campaign are **NOT VERIFIED** for this branch.
- Version `0.9.1+snapshot.dev.66` in PR #311's manually authored package/worker carriers is a **provisional draft**, not final build certification. Existing `0.9.2+community.dev.1` references in old plans are also proposals only.
- If the third/new issue work is larger than originally expected, take recoverable `[skip ci]` commits in the same branch; preserve partial source and report precise open items without suggesting they were done.
- Cross-check that a PR opening does not silently dispatch the forbidden CI cycle. Keep the PR DRAFT with tests pending/absent until authorized. A GitHub status such as 'pending' is not a failed validation run.
- The source-audit verdict to earn before validation is **PASS for handoff/source readiness, not runtime certification**. If a real source blocker remains, report it and keep working rather than suppressing it.

**Release authority:** Only the owner decides validation commencement, merge, publication and announcement.
