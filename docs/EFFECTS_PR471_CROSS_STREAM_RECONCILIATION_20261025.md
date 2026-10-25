# Azeroth Chronicles — PR #471 cross-stream reconciliation audit

Date: 25 October 2026. Scope: read-only source review plus focused test additions on the existing draft PR #471. This is NOT release authority, a joint branch merge, or physical-device certification. Azeroth Chronicles remains a multi-file GitHub Pages/PWA.

## 1. Exact checkpoint and audit disposition

GitHub main: e3c78266b28f3325d2afdcb76ae849fcff306deb.
PR #471 last tested source head: f7f3eeaf8782af5e05d031752705eeb4513a65b3 (this documentation commit follows it). Independently evolving head snapshots: #464 cf6074e581911f90b94b81aff19b6b01a41ecbcf; #469 6512552e47584d0da8b7a72d5ad3aefa95ac5f5e; #470 ed6c2b6be6be67e6cc16f2e627aa7116a8d8289c; #440 2b89e360b05d0cbda7a5bc2244fff9db38a1b8d9. Re-fetch after ANY concurrent push.

**Disposition:** PR #471's changes and tests are coherent with its main baseline. No regression against published main was demonstrated in focused tests. This does NOT prove that independently green unmerged drafts can be combined without source conflicts or behavior drift.

Work already done and protected:

- Stage 2 developer-only, explicit opt-in bounded in-memory effect recorder in the existing report export. No default normal-player collector, loop, network diagnostics or campaign-save instrumentation.
- Stage 3 real producer/Canvas event mapping. Fifteen intentionally blank NORMAL hero cast stages are not false missing-art alerts. Artificial queue/draw-starvation cases must not be reported as natural incidence.
- Stage 4 hero first-draw opportunity adds at most 0.12 simulated seconds, never requests frames or extends already-presented cues. Silence/Taunt/Slow, late selected targets, bosses/captains and +N status overflow improve visibility without exceeding three marker positions per enemy and 24 status-bearing enemies.
- Stage 5 real desktop/phone-emulated Chromium Canvas pixel and developer menu/export tests. Native Canvas and emulated phone acceptance do not establish physical device, thermal or WebGL completion.
- Stages 5.1–5.2 warnings/caption prominence and relative software drawing cost audited; default Auto 20–30 FPS and independent Optimization/skip/resolution controls explicitly preserved. Ultra/Balanced/Performance graphics quality is **proposed, NOT implemented**.
- Stage 5.2 Phase B protected presentation contract: [contract](EFFECT_QUALITY_PROTECTED_PRESENTATION_CONTRACT_20261025.md). Real danger footprint, safe gaps, projectiles/contacts, hero and ally recovery, status and cast readiness must not be removed by cosmetic detail tuning. Unclassified visuals default to protected.
- Stage 5.3 same-draw warning geometry cache: [Stage 5.3 record](EFFECT_WARNING_FRAME_REUSE_STAGE53_20261025.md). One short-lived geometry Map per renderer drawing used for fill and underlay-cue on both Canvas and Pixi overlay paths. BOTH passes remain drawn, no shape saved across physics ticks. Does not modify collision, warning timing/opacity, game logic or the 40-item effects queue.

## 2. New baseline verification

The original [three-family Stage 5.3 test](../tests/effect-warning-frame-reuse.test.cjs) covers cone, canister and ring geometry, modified telegraphs, identical Canvas pixels and no save mutation. New [11-family follow-up](../tests/effect-warning-reuse-family-matrix.test.cjs) covers eleven REAL first boss attacks, desktop 900x600 and phone-size 393x852 Canvas, and new fresh-warning frames after moving the warning location, for 44 paired comparisons. Cached and uncached output pixels remain byte-identical. The fixture counts 40 eliminated duplicate attack-patch reconstructions. These are controlled native software-Canvas observations, not measured device FPS.

**Exact-head success:** [run #40230017364](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40230017364), commit f7f3eeaf8782af5e05d031752705eeb4513a65b3: 29 relevant focused test files PASS, reproducible offline-ready build PASS, Publish focused update SKIPPED. No full-game matrix or real-device tests. After this doc commit verify NEW exact-head CI separately.

## 3. All unmerged work reviewed for interference

The GitHub changed-file inventories for the fifteen then-open PRs were compared. Equal filenames identify merge hazards, NOT already reproduced gameplay bugs. Distinct filenames can still share event/visual semantics.

| Workstream | Exact shared filenames with #471 | Compatibility ruling |
| --- | --- | --- |
| [#464 hero/companion projectiles](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/464) | renderer.js, hero-presentation.js, combat-visuals.js | **HIGH:** Must manually combine render paths: delayed Ranger/Archer release only when live collider starts; no pre-contact fake arrows; no pet-to-target tethers after actual hits; instant pet line afterimage 0.32s release and 0.30s impact. Preserve #471 status/recorder/grace/cache and #464 shorter pet/charged visual queue lifetimes together. Replacing an entire function with either branch would lose real work. |
| [#469 Pixi/Canvas art parity](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/469) | renderer.js | **HIGH:** Preserve #471 same-draw warning cache and both overlay warning passes AND #469 shared paint-only Pause cue in Canvas AND Pixi overlay. Avoid Pixi early return skipping Pause. Retain GPU-world Crown coin rendering/depth/occlusion, not a coin pasted over combat. Source + actual composed Canvas/WebGL screenshots needed. |
| [#470 bounded music/environment recovery](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/470) | app.js, different patch regions | **MEDIUM:** Retain first-user-gesture unlock and finite audio retries without starting the developer recorder; verify settings, frame loop and normal mode after composition. No direct patch collision found in compared hunks. |
| [#440 dormant Critical Executions](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440) | None | **Behavioral:** Critical rolls are test-only and not live; do not invent critical ! visuals. When #440 and #464 join, preserve single release receipt, frozen to moving projectile children and no reroll on contact. Pet contact arguments: position 5 critical receipt; position 6 physical launch origin. See [#440's cross-PR audit on its own branch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/design/critical-executions-codices-20261024/docs/PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md). |
| [#458 TRUE field boss pursuit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/458) | None; changes engine.js | Boss motion, warning and chase states need future combined regression; warning geometry cache must be rebuilt after each simulation step. #440 has a separate engine.js overlap. |
| [#472 combat audio](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/472) | None | Sound release and impact timing must remain aligned with #464's real physical projectile contacts. VFX painter calls do not certify audio output. |
| [#473 music/mix audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/473) | None | Preserve audio mix settings separate from future graphics-quality controls. |
| [#447 Pixi optimization acceptance](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/447) | None; older Pixi browser test only | At audit time GitHub reports mergeable=false. Retain Keep/Revert and fallback safeguards; older green CI is NOT Pixi whole-game release acceptance. |
| [#465/#449 documentation governance](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/465) | None | Reconcile later documentation indexing and AGENTS rules instead of wholesale overwriting owner instructions. |
| [#468 Stage 1 audio], [#456 Founding Explorers], [#445 art tooling], [#401 landmark previews] | None | No direct filepath conflict identified; these remain independent, unmerged, not certified by the PR #471 run. |

**Base divergence:** #471 and #469/#470/#440 were zero commits behind then-main e3c78266. #464 was 34 ahead and **three behind** main despite GitHub showing mergeable. Never overwrite the newer Mage #466/#467 source updates when integrating old #464.

## 4. Specific future semantic collision to test

- **Charged Ranger projectileVolley vs first-paint grace:** #464 converts certain genuine physical volleys into real projectile flight and gives their cast only a 0.16s release glint. #471 firstPaintEssential currently treats any charged hero cast as eligible for up to 0.12s extra first drawing opportunity. After BOTH PRs are intentionally reconciled, test 20/30/60 draw cadence and adaptive skips to ensure a delayed release glint is not mistaken for a late traveling arrow or impact. This is a predicted interaction, **not a currently demonstrated combined defect**.
- **CombatVisuals.queue:** #464 alters pet/charged event duration while #471 inserts optional developer event/overflow observation in the same function; manually preserve both semantics, the 40 transient ceiling and no recorder work in normal mode.
- **Renderer overlap:** #469 restores Pixi Pause presentation after the same overlay segment where #471 introduces cached warning passes. Joint renderer must retain Pause, loot/parity, warning edges, real projectiles and overlay effect rendering. Pixel tests should use full composed output, not only an alpha overlay.
- **Critical receipts:** #440 must apply one roll at real committed release, carry immutable receipt along moving projectiles, never change collision/timing, and stay disabled in production. Not a reason to add FPS work or VFX event type today.
- **Performance contract:** manual 20 FPS is a legitimate player preference, not automatic stress. The new quality tier must preserve the existing Auto 20–30 default, adaptive frame-skip and emergency rescue, zoom/input/saves and one-time preference migration rules.

## 5. Next safe stages, and release blockers

1. Continue focused **test-only** real-producer geometry / projectile / status checks while independent branches move. Do not repeatedly push competing updates to a file another chat is actively editing.
2. Create a conservative per-identity presentation classification: protected, optional or unknown-as-protected, covering hero, troop, pet, projectile and enemy signatures. Only proven nonsemantic ornament can be scaled in a future Performance tier. No general exclusion by effect type.
3. Before any authorized integration, establish a *separate* controlled combined candidate preserving both sides of #471/#464/#469/#470, and independently #440 where appropriate; run changed-file tests, native flight/contact, status + 40-cap, audio unlock, Pixi composed-frame Pause/loot/warnings and critical-OFF guards together. **No combined code has been built or accepted here.**
4. Real phone/Chromebook screen legibility, frame/thermal costs, natural crowded fights, Pixi/WebGL GPU parity and explicit owner approval remain **NOT VERIFIED**. The new caches are a correctness-preserving optimization with fewer duplicate native shape constructions, **NOT a proven FPS gain**.

**STOP:** PR #471 remains DRAFT, unmerged, undeployed. No broad browser/full-game matrix, no publishing, no critical activation, no automatic graphics tiers, no unrelated PR changes. The owner can remain AFK; repository/source/CI work is independently reproducible from these GitHub-native links.
