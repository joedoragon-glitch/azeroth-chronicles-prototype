# v0.9 performance optimization project

Performance optimization project authorized 2026-10-10. Shared baseline: main v0.8.137 `c6ce1af236bddd7ca881903499c4cf5de175f9e2`, tree `0857ea83ad3acd1d2e8f2f33eb4fce4ff590e99d`. Separate from art #160/#217 and beta release #213; no v0.9 publication.

**Protected:** enemy/companion AI, combat, simulation implementations, scheduling, timing and outcomes. Freeze engine.js, world.js, navigation.js, party.js, combat.js, hero-combat.js, boss-combat.js, progression.js, economy.js, rewards.js, rules.js, data.js, save.js, input.js, platform.js, runtime.js; app.js simulation/input/frame scheduler stays frozen. No actor tick culling, AI frequency reductions, gameplay clock changes, draw-driven state mutation or balance edits.

| Workstream                       | Exclusive runtime ownership                                                                                                          | Branch                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 1 terrain/roads/static scenery   | visuals.js, ground-cache.js, materials.js, material-contract.js                                                                      | perf/v09-terrain-20261010         |
| 2 sprites/VFX/light/occlusion    | renderer.js, sprites.js, sprite-format.js, combat-visuals.js, enemy-presentation.js, enemy-vfx\*.js                                  | perf/v09-visuals-20261010         |
| 3 HUD/menus/audio processing     | menus.js, audio\*.js except audio-assets.js; narration.js; existing CSS only if pixel-equivalent                                     | perf/v09-interface-audio-20261010 |
| 4 loading/memory/PWA/persistence | audio-assets.js, persistence.js, templates/service-worker.js                                                                         | perf/v09-infrastructure-20261010  |
| integration owner                | package/lock versions, build/generated HTML/sw/build-info, site-assets, CI, app HUD only if proven safe, shared evidence/guard tests | perf/v09-integration-20261010     |

Dependencies declared before edits: renderer consumes terrain caches (1→2), sprites/material loading and readiness revisions (1/2↔4), audio cache/public lifecycle (3↔4), HUD shell/menus uses injected Campaign (3↔integration). No overlapping runtime file writes. Agent tests/scripts use unique perf-ws1..4 prefixes. Shared build/version/CI changes serialized by integration owner only; asset registries/art unchanged. Any ownership transfer must be recorded first.

Four isolated local worktrees and independent agents; hardware-sensitive timing benchmarks serialize on this shared worker. Each workstream PR targets dedicated integration branch, never main. Integrate only reviewed successful commits. Final combined PR alone targets main, stays unmerged pending Joel's approval.

Required evidence: baseline and candidate hashes, controlled before/after timings with environment/sample/tails and bounded-memory counters; complete Node and relevant Chromium/WebKit CI suites; same-state visual comparisons; historical v4/v2/save/PWA upgrade coverage; fixed-step deterministic simulation/state/event equivalence and exact protected-source hash checks. Performance thresholds are reports, not flaky CI assertions. A workstream may deliberately reject optimization if equivalent gameplay or rendering cannot be proven. Real device and actual user-save gaps remain explicit.

Serialized follow-up ownership: integration owner owns tests/beta-campaign-browser.test.cjs for public audio-queue quiescence and phase/request diagnostics. Dependencies are the unchanged audio status().paused and recordingStatus().assets.pending APIs; source audio, worker, save and simulation implementations stay frozen. Ownership was recorded in issue #218 before edits; all original assertions remain.
