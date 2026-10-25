# Art Catalog #321 — unmerged work compatibility audit

**25 October 2026 · PR #469 remains draft · no merge or deployment.** This record complements the [deep art/parity assessment](ART_CATALOG_321_DEEP_RENDERER_ASSESSMENT_20261025.md) and [successful first Crown-loot repair evidence](evidence/ART_CATALOG_321_CROWN_LOOT_FIX_VERIFICATION_20261025.json). The purpose is to preserve **prior development decisions**, not overwrite prior branches or treat a passing check as a complete release certification.

## Scope and independent evidence

The [PR-only, isolated cross-draft test](../tools/visual-review/art321-cross-draft-regression.cjs) uses real Git three-way `merge-tree --write-tree` against the **exact live GitHub pull-request heads**, builds a **temporary local, unpushed commit/worktree** for clean results, syntax-checks the combined Canvas and Pixi renderers, and runs narrowly selected native Node regressions **inside the combined source tree**. Each temporary worktree is deleted after use. No GitHub PR, remote branch, active game, save, artwork, deployment or normal CI workflow is altered.

[Completed 10-branch GitHub Actions run #40230777001](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40230777001) and [sha-pinned JSON artifact #12613130613](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40230777001/artifacts/12613130613) provide the complete input commits, shared ancestors, conflicted file paths and per-test pass/fail records. Tested PR #469 head `d0c21d80d031d103e9d71be979cc3c71c13c32b4`; main pinned inside that JSON. Git checks are **pairwise** (`#469 + one other draft`), not a simultaneous multi-PR release merge, and cannot establish mobile GPU performance.

## Results — preserve these existing workstreams

| Draft PR | Pre-existing work | Actual 3-way composition | Focused test result |
| --- | --- | --- | --- |
| [#471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471) | Opt-in effect recording, protected essential cues, warnings/status presentation | **Clean** | **7/7** syntax/native checks passed; Pixi/Crown loot, original occlusion, effect diagnostics, protected cues |
| [#464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) | Ranger/Archer/Paladin travel, hit and pet impact work | **Clean** | **6/6**; original projectile/pet regressions and Pixi/Crown loot |
| [#440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440) | Dormant critical-execution design and native integrations | **Clean** | **6/6**; critical execution and native party checks plus Pixi/Crown loot |
| [#458](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/458) | TRUE regional bosses pursue the hero along landmarks | **Clean** | **5/5**; boss-hunt, Pixi/Crown loot |
| [#470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470) | Audio start-on-gesture and ambience recovery | **Clean** | **5/5**; recovery and Pixi/Crown loot |
| [#472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472) | Combat action-to-sound audit and restored pet sound routing | **Clean** | **6/6**; audio action, roster and Pixi/Crown loot |
| [#465](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/465) | Documentation/authority and CI governance entrypoints | **Clean** | **5/5**; architecture, CI scope and Crown loot |
| [#468](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/468) | Audio Stage 1 diagnostics and source coverage | **Clean** | **4/4**; audio coverage and Crown loot |
| [#445](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/445) | Earlier artwork pipeline validation repair | **Inherited conflict** | Its `scripts/material-pipeline.cjs` also conflicts with current **main**, before any PR #469 changes. **No combined test was run** |
| [#447](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/447) | Old Pixi optimization/resume browser acceptance | **Inherited conflict** | Its `tests/pixi-renderer-browser.test.cjs` also conflicts with current **main**, before any PR #469 changes. **No combined test was run** |

**Execution totals:** 8/10 clean pairwise combinations, **44/44** executable syntax/test checks passed across those eight (16 syntax checks and 28 selected Node test invocations). Two older drafts could not be combined because their conflicts already exist versus current `main`; **neither conflicted file was changed in PR #469**. These results are **not** 44 different art images, 44 full suites, or full integration certification.

## Cross-workstream dependency rules

- **Artwork authority remains unchanged.** The approved 513-case procedural pass is implemented and accepted historically. The new Crown coin is **not a replacement illustration**; it calls the existing `PrototypeRenderer.drawCrownLoot` painter and reuses its stamp as one bounded Pixi GPU texture. Ten post-catalog decorations remain separate, without invented legacy IDs or new owner approvals.
- **#471 effects correctness is preserved.** Keep its first-paint opportunity, effect recorder, warning-frame cache, status priority and fixed rendering budgets. Our added paint-only pause helper runs after the existing overlay cues; it must not reissue frames, modify the warning geometry or change effect queues. The test verifies important composed-source behavior; true scene-by-scene device fidelity remains unverified.
- **#464 physical projectile travel is independent.** Do not replace projectiles with instant beam art while restoring Pixi decoration or loot. Its Ranger/Archer delayed-release and impact conditions were validated in pairwise synthetic integration; its own device visual acceptance remains a separate release gate.
- **#440 critical system remains disabled.** The art work does not activate or reconfigure critical executions. Passing its native tests on a temporary merge does not authorize enabling critical actions or visually certifying those indicators.
- **#458 TRUE bosses and stage visuals are not certified by one Crown coin.** Their movement/pursuit logic remains unchanged; aura/crown/facing and combat visibility are future art-specific paired cases.
- **#470/#472/#468 audio remain untouched.** The new drawing routes do not change sound timing, event emission, ambience, gesture policy, or action-to-sound identity.
- **#445 and #447 need their own forward-port/rebase decisions.** Do not resolve their already-existing main conflicts by deleting current art tools, reverting the accepted artifact manifests or backing out #469 rendering. No action on those PRs was taken here.
- **#465 remains the documentation and release-governance authority candidate** until its own independent review. The game is still a **multi-file GitHub Pages/PWA**. The old single-HTML constraint must never govern code or releases. Canvas 2D stays the reliable default; PixiJS remains optional WebGL2 experiment.

## What this does *not* prove

Pairwise clean Git merges, node syntax and focused tests do not establish that **all** PRs can be merged simultaneously or that UI, mobile performance, WebGL context recovery, visual effects, enemy kill→reward pickup and 513 art identities work on real devices. #447 and #445 cannot yet enter a combined worktree, and new commits in other PRs invalidate the corresponding checked head. This is a merge-compatibility **checkpoint**, not a release candidate or an instruction to merge.

### Safe continuation

1. Re-pin and rerun the small cross-draft audit when #471, #464, #440 or the other overlapping workstreams change substantially. Preserve explicit SHA inputs; do not infer current compatibility from old runs.
2. Separately compare paired Canvas/Pixi coin brightness, depth sorting and atmosphere at **night** and in front of/behind major cover; test native kill→drop→pickup, device context recovery and save invariance. These remain open; one daytime paused Vale screenshot does not pass them.
3. Continue per-ID live Canvas/Pixi visual acceptance, with original approved creative art as the reference and real GPU backend proofs. Keep the already-approved projectiles, status effects and audio changes in their respective draft PRs.
4. Leave **all** affected PRs unmerged/undeployed until their independent gates are complete and the owner approves release.
