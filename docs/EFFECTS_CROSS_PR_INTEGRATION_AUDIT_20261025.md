# Azeroth Chronicles — Effects Optimization Compatibility Audit & Continuation

**Date:** 25 October 2026  
**Scope:** [draft PR #471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471) and **all 14 other open repository PRs** observed on GitHub on this date. Baseline main `e3c78266b28f3325d2afdcb76ae849fcff306deb`. This is an audit and gated development handoff, **not** authorization to merge any branches or publish the game. Preserve the multi-file GitHub Pages/PWA architecture.

## Findings: deployed foundations already exist

The optimization system is not being rebuilt:

- Merged [#443](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/443) added device-local **Off/Auto/On** Optimization Mode, Auto as default (one-time upgrade), frame-pressure sensing and independent non-optional critical rescue. Manual 20 FPS is not proof of lag. Normal 20–30 Auto FPS and 20/30/60 budget-aware draw skipping remain authoritative.
- Merged [#437](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/437) fixed automatic rendering density under a 20-FPS target and retained density adaptations on stable resize. Previously merged #431 made the one-time Auto 20–30 baseline upgrade; it does **not** force 60 FPS.
- Merged [#324](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/324) and [#346](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/346) optimized actor outlines, cache and LOS/simulation work, memory release and performance sampling. They include **bounded Node/Chromium comparisons**, not certified post-update device FPS. Never regress their optimized/full-detail switches, cache ceilings, emergency recovery or report fields.
- Existing Canvas and opt-in experimental Pixi/WebGL2 paths share essential native combat overlays. Reduced motion, critical rescue and renderer switching are independent controls. Existing **40 queued transient effects** and **3 statuses × 24 enemies** are deliberately bounded, with selected-target and high-priority cues protected as far as currently documented. No separate Ultra/Balanced/Performance graphics-tier UI is installed.

## PR #471 stages and what they actually establish

| Stage | Implementation/evidence | Remaining limitation |
| --- | --- | --- |
| 2 | Opt-in **Developer Mode** in-memory effect recorder, report export; no player sampling loop | Painter call != visibly present pixels |
| 3 | Real hero, companion/pet, 11 boss producer coverage and bounded overflow/expiry observations | Does not enumerate every enemy/scene |
| 4 | Max **+0.12 simulated seconds** first-paint grace for selected essential cues; true status prioritization and +N overflow | Does not force extra draw frames or raise caps |
| 5 | Focused Chromium desktop/phone-emulated Canvas and report UI smoke | No actual phone/Chromebook FPS or full Pixi parity |
| 5.1 | Warning prominence and expensive-geometry audit with 11 real first boss families | Pixels and CI CPU traces are not human salience or GPU FPS |
| 5.2 | Existing Auto FPS/optimization reconciled; 20/30/60 crowd fixtures; protected cue contract | Graphics Ultra/Balanced/Performance are **proposals**, not implemented |
| 5.3 | Share live attack polygon construction across warning fill and border inside one **render call**. Full Canvas and opt-in Pixi overlay use same draw-local `Map` | Initial [exact-head #40228814628](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40228814628) passed **28/28 focused**, same pixels for three natural boss attack cases. No hardware benefit claim |
| 5.3 expanded | Independent new first-attack family test covering 11 bosses, two viewports, fresh-frame moved warning checks | At audit time this was a parallel update; verify its exact-head CI before claiming complete |
| 5.4 | Targeted Dark Lord's **real fourth sector/PROTECTED SIDE** attack: share one computed attack-patch set for both danger and protected geometry, and cache both per-pass shapes within the same frame; regression compares danger **and safe-side** RGBA pixels after motion | New candidate: require its exact-head test to pass before calling verified. No game logic/hitbox change |

**Invariant:** All cached polygons/patches are short-lived **per actual render call**, not stored between simulation ticks; the existing two warning-paint passes are still drawn, with the same palette, phase, hitboxes, safe openings and ordering. The cache is an optional presentation argument: the original direct `CombatVisuals.ground` invocation without it remains valid.

## All other currently unmerged PRs — full audit (25 October)

The following classification uses the live GitHub PR file patches; a shared filename is a **merge-review risk**, not proof of a textual conflict or regression. Conversely, distinct files are not proof of semantic compatibility. Every PR here remains its own workstream.

| PR | Scope | Overlap/risk with #471 and required preservation |
| --- | --- | --- |
| [#473](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/473) | Stage 4 music/sound mix policy matrix | **No common changed runtime file**. Test/workflow additions; watch audio optimization semantics and later #470/#472 integration; no use of new warnings as sound triggers |
| [#472](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472) | Stage 3 real action-to-sound coverage and ranged pet impact route | **No common runtime file**. Semantic dependency on actual release/impact receipts from #464: no duplicate pre-contact sound |
| [#470](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470) | Stage 2 bounded music/ambience retry and gesture unlock | **Common `src/prototype/app.js`**. Preserve its user-gesture unlocking/audio source lifecycle alongside #471's opt-in Developer report/menu code. Auto Optimization's audio transitions must remain intact |
| [#469](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/469) | Art #321 Canvas/Pixi Crown loot parity and paused overlay | **Common `src/prototype/renderer.js`**. Keep #469's pause drawing in the overlay and GPU loot below shared lighting; preserve #471's effect recorder, protection and per-draw warning-map wiring in both branches. A clean merge with main is not an integration proof |
| [#468](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/468) | Stage 1 audio coverage probe | New diagnostic/test/docs only; not player-loaded. Preserve explicit opt-in, don't duplicate profiler sampling |
| [#465](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/465) | Governance/Docs Track A and read-only test-routing checks | Documentation authority/CI mapping may evolve. #471 adds one focused CI selector; future source-test routing must be reconciled rather than overwritten |
| [#464](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) | Real Ranger/Archer and pet release-contact physical visuals | **Common `renderer.js`, `combat-visuals.js`, `hero-presentation.js`**. Highest source integration risk to #471. Preserve moving shafts tied to actual projectile colliders, ranged pet release/impact and shorter post-contact afterimages, plus #471 first-paint grace, status priority and warning-pass reuse. #464 already separated sixth-argument pet launchPoint from fifth-argument #440 critical receipt; do not collapse them |
| [#458](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/458) | TRUE-form boss landmark hunting | No common file with #471. Actual boss locations/retargeting affect warnings, crowd and effect regression scenes. Do not change pursuit/gameplay to optimize painting |
| [#456](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/456) | Founding Explorers documentation | No common file/runtime impact; retain separate approval and release checkpoint |
| [#449](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/449) | Deep docs/test-governance handoff | No common files; honor focused-CI authority and protect standalone audit records |
| [#447](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/447) | Pixi after-settings-resume browser gate | Only `tests/pixi-renderer-browser.test.cjs`, no common file with #471. Existing browser validation matters, but at audit time GitHub reports this PR not mergeable against main; do **not** bypass or weaken its gated checks. #469's pause overlay and #471's warning overlay should be included in future combined browser acceptance |
| [#445](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/445) | Historical art pipeline/fixture repairs | No common runtime files; affects artwork tooling only. At audit time not mergeable against main; separate gate |
| [#440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440) | Dormant Critical Executions staged gameplay integration | **No common changed file with #471**; major **semantic** risk after integration with #464 and boss warning/resolution timing. Preserve one frozen critical receipt at real action release, with no extra VFX/audio event or RNG from warning *rendering*. Current core is opt-in, not production active. See [#440 cross-PR audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/critical-executions-codices-20261024/docs/PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md) |
| [#401](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/401) | Vale landmark A/B/C art previews | No common runtime files; unapproved visuals and non-mergeable preview draft. Do not use it as a current gameplay baseline |

This is a **point-in-time inventory** of 15 open PRs including #471. Requery live heads, merge ancestry and changed files before integration: other assistants are actively updating drafts. Current source overlap is **three** other PRs (#464, #469, #470); additional indirect interactions above do not require editing those branches today.

## Safe isolation and no-contradiction verification

1. Start by pinning **main SHA**, each relevant PR's exact head, and the target branch. Never describe older success as latest-head proof.
2. Compare exact **changed-file intersections and individual hunks**, not titles; note that independent green CIs on main-based drafts do not certify their **joint merge**. For #469, the existing `tools/visual-review/art321-cross-pr-compat.cjs` is a *read-only* Git merge-tree helper, but its presence alone is not proof it has run on latest heads.
3. Before any authorized combined candidate, perform a *non-destructive integration dry run* using actual latest branches and resolve both textual and semantic overlaps. Run **#471 effect/browser**, **#464 physical release and pet**, **#469 paired Canvas/Pixi/pause**, **#470 audio gesture/retry**, **#447 Pixi setting-resume** and **#440 dormant-OFF/native critical** focused tests as applicable. Keep results reproducible and separate from ordinary per-PR CI.
4. Retain FPS gate 20/30/60 + Auto, emergency guards, backing-resolution adaptation, offline PWA caching, save purity, reduced-motion independence, short-cue expiry, 40 transient cap and protected direct-state warning statuses. **Don't** gate new graphics tiers on 60 FPS or call all enemy/companion effects optional.
5. Do not instantiate recorders for ordinary players, sample screens/CPU unnecessarily, start background timers or force additional frames; no bypass of normal test-selection scope. Continue with focused regression additions and measured non-semantic cleanup only.
6. **Stop before release:** no change to draft status, unrelated PRs, `main`, pages publishing, feature-flag defaults or paid/phone/Chromebook performance claims. Human visual inspection and real-device frame/memory measurements remain open.

## Continuation sequence while owner is away

A. Confirm Stage 5.4's real Dark Lord sector regression and all affected tests/build on the **current PR head**. Fix only a demonstrated issue on #471; do not broad-refactor rendering.  
B. Expand **observational** real-scene overlap/budget tests to account for #464 projectile release paths without copying unmerged gameplay changes, and preserve concise CPU/pixel measurements.  
C. After a green head, update the PR description and this audit checkpoint with the **actual commit and CI URL**.  
D. Keep distinct **Ultra (opt-in) / Balanced (default) / Performance (opt-in)** as future effects-profile design, not a new competing FPS/Optimization Mode implementation. No tier rollout until functional-protection, performance and cross-branch acceptance is demonstrated.

**No owner action required for this read-only/isolated continuation. Owner approval is still required for merge, deployment and major visible quality-policy changes.**
