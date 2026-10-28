# Documentation Phases 0–1 — pinned baseline and discrepancy ledger

**Audit date:** 27 October 2026. **Scope:** read-only Phase 0 against the exact `main` commit below, followed by proposed *documentation-only* Phase 1 edits in a separate draft PR. **Authority:** current source and owner consent prevail over prior dated instructions.

## Pinned source, publication, and acceptance boundaries

- Source: [`main@5c6197e871f8f4393d26d9b7a261b9324ef85d12`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/5c6197e871f8f4393d26d9b7a261b9324ef85d12).
- `package.json`, `package-lock.json`, and `sw.js`: `0.9.1+snapshot.dev.205`.
- [Exact-commit Actions run 40501866452](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40501866452): **Focused validation = success; Publish focused update = success**. This is evidence of successful repository-side GitHub Pages publication, not of a particular installed PWA obtaining the update, human completion of a full campaign, a complete browser matrix, or real-device GPU performance/visual acceptance.
- Game remains the **multi-file GitHub Pages/PWA**. Canvas 2D is the safe/default renderer; PixiJS/WebGL2 remains optional and experimental. Neither renderer nor saves/gameplay/PWA behavior is changed by documentation maintenance.

## Phase 0 inventory (pinned to main)

- `docs/`: **378 direct entries**, including **368 direct `.md` paths**.
- [25 October registry](DOCUMENTATION_COVERAGE_REGISTER_20261025.json): **332 tracked Markdown records** across the repository, **313** under `docs/`; all 313 registered `docs/` paths still exist.
- **55** current `docs/*.md` paths are absent from that *dated* registry. **128** current `docs/*.md` basenames are not directly mentioned in the [index](DOCUMENTATION_INDEX.md); this does not establish orphaned or broken links. This new ledger itself adds a post-baseline Markdown file and is excluded from those figures.
- The registry's `asOf: 2026-10-25` and the index's frozen 19 October inventory retain their original meaning. Deeper classification, link/routing verification and registry expansion belong to Phase 3; do not overwrite this historical receipt.

## Verified status reconciliation matrix

| Workstream | Verified at the pinned checkpoint | Phase 1 documentation action / remaining gate |
| --- | --- | --- |
| All-region strict ordinary-melee Pursuit Burst [#508](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/508) | **Merged and published**, eligible only for nonsummoned native ordinary melee and melee Ringleaders; not a pending draft | Correct README, policy, state, index and [candidate contract](MELEE_PURSUIT_EXPANSION_20261026.md). [Reset/territory mismatch #510](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/510) remains **open** (damage 500 vs summon chase 900 and Overtime chase 1300). [#514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/514) **closed unmerged**. |
| Title/Continue/loading and optional Pixi graphics stages [#518](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/518) | **Merged/published**, not a current draft | Correct [graphics status](REGIONAL_GRAPHICS_PREPARATION_TITLE_SCREEN_20261027.md) and [handoff](PR518_ENGINEERING_HANDOFF_20261027.md); Stage 7 actual device/browser visual and performance acceptance remains open. See [runbook](PR518_TARGET_DEVICE_ACCEPTANCE_20261027.md) and [renderer graduation #478](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/478). |
| Playtest report location [#526](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/526) | **Merged**; `src/prototype/app.js` puts **Export playtest report** in **Game and settings → Screen and performance** | Correct README; save export/import remain in **Save and game management**. |
| Paladin/Ranger/Mage innate level-1 class passives [#509](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/509) | **Merged** | Add current disposition above historical design checkpoint in [audit](HERO_CLASS_FOUNDATIONS_LEVEL1_AUDIT_20261026.md). |
| Critical Executions/Codices [#440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440) | **Merged**, active current feature | Mark [dormant Stage 1](CRITICAL_EXECUTIONS_STAGE1_DORMANT_CORE_20261024.md) historical; codex probability coverage [#515](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/515) remains a draft. |
| First-gesture and pet audio fixes [#470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470), [#472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472) | **Merged** (as are prior audio preparation milestones) | [Stage 5 preflight](AUDIO_STAGE5_RELEASE_PREFLIGHT_20261025.md) must be labeled historical pre-integration evidence; no unverified device listening claims. |
| Canvas procedural optimization [#527](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/527) | **Open draft** | Independent workstream; do not treat candidate caches as live or enable regional lookahead. |
| Playable Rogue Bard [#511](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/511) | **Open draft** | Not currently a fourth playable class. |
| Focused test governance [#522](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/522), [#523](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/523), [#525](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/525) | **Merged** | Reuse existing focused CI, do not invent parallel CI/test registers. |

## Constraints, verification, and next checkpoints

Phase 1 updates active landing-page facts and **brief status supersession labels** on misleading historical feature notes. Original audit/design evidence, frozen hashes, owner approvals, source code, asset paths, and runtime are not rewritten. This ledger describes **the pinned main**, not the draft branch as an independently published release.

Phase 1 review: check file-scoped changes are documentation-only; verify current labels from source and PR state; inspect Markdown links and false present-tense draft claims; retain exact original historical snapshots. Only small focused CI allowed under existing policy. **No full-game tests, manual browser matrix, merge, or deployment** are authorized here.

Phases 2–6 remain separate: sustained release-state stewardship; index/registry classification; source-to-document semantic verification; separately approved docs tooling; then independent owner-reviewed release/merge acceptance. Do not use this ledger to auto-close [#504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504) or [#510](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/510).
