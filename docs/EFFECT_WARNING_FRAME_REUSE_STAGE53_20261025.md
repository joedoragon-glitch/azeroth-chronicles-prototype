# Azeroth Chronicles — Stage 5.3: Same-frame telegraph geometry reuse

**Date:** 25 October 2026  
**Candidate:** Existing [draft PR #471](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/471), still unmerged/undeployed.  
**Purpose:** A bounded optimization that reuses existing rendering architecture. No new graphics tier, changed warning style, modified collision/warnings, gameplay/AI/saves, FPS policy or effect-count cap.

## Problem already demonstrated

The currently shipped Canvas world renderer and the transparent Canvas combat layer used with experimental Pixi render warnings in two immediate passes for each permitted drawing: `PrototypeCombatVisuals.ground(..., 'fill')` and `ground(..., 'underlay-cue')`. The latter draws required boundary/safe-side lines above ground details; it is not redundant. Both passes previously independently called `game.attackPatches(a)` and `warningShapes(a, patches)` for every ordinary active enemy telegraph. Canister shapes generate nine 34-point capsule polygons and are a concrete example of duplicated CPU-side world-geometry construction (screen projection in each drawing pass remains separate). Earlier [Stage 5.1 source/alpha audit](EFFECT_WARNING_PROMINENCE_PERFORMANCE_AUDIT_20261025.md) and [Stage 5.2 FPS/graphics-policy audit](EFFECT_GRAPHICS_TIERS_FPS_RECONCILIATION_20261025.md) explain the larger visual hierarchy and effect-budget issues separately.

## Narrow implementation

- `src/prototype/combat-visuals.js`: optional sixth argument `frameWarningShapes` to `ground`. The existing visible-warning loop uses `frameWarningShapes?.get(a) ?? warningShapes(a, game.attackPatches(a))` and saves the result in the supplied map. Calling `ground` without the optional map remains the original behavior.
- `src/prototype/renderer.js`: create **one new short-lived Map per renderer `render()` call** and pass the same map to the fill and underlay-cue calls. Both normal Canvas and experimental Pixi Canvas-overlay branches reuse it. Neither map nor warning geometry survives the draw; mutating game telegraph state in the next simulation step generates new shapes. Background-only Pixi draws instantiate an empty map but do not draw those warning passes.
- This does **not** remove either pass, dim colors, change border widths, suppress danger zones, cache geometry across physics ticks, alter shape data, add player sampling or change the 40-transient budget.

## Automated evidence

`tests/effect-warning-frame-reuse.test.cjs` uses actual campaign boss attack producers for **Thorn (cone), Citadel (canister) and Cindermaw (ring)**, paints through native Canvas and:
1. Asserts the original independent fill+cue passes each reconstruct attack patches, then asserts a same-frame cache limits these to one reconstruction.
2. Asserts **byte-identical RGBA Canvas images** for cached vs uncached paths.
3. Changes the real telegraph position and retests with a **fresh frame cache**, confirming a moving warning has no stale geometry and remains pixel-identical to uncached rendering.
4. Checks campaign snapshot purity (no presentation-induced gameplay/save mutation).
5. Checks source integration at both Canvas and Pixi-overlay warning entrypoints.

The test uses software rasterization and a synthetic reposition between rendered frames, NOT a naturally reached fight, a physical phone/GPU benchmark, or proof of perceived threat clarity. It establishes eliminated duplicate geometric work in those cases; no percentage CPU, real-world FPS increase, or whole-game performance claim is made.

## Remaining work / guardrails

- The **default Auto 20–30 FPS** and existing emergency/Optimization Mode transitions already use adaptive pressure, and this update deliberately leaves those systems untouched.
- **40 transient effect slots are still fixed**. More comprehensive hero-effects protection, optional flourishes, graphic quality tiers and crowd-sensitive degradation require independent protected-category testing and matched rendering evidence. Existing draft Phase A/B tests may already cover parts of this; do not duplicate or overwrite parallel work.
- Label/caption occlusion, warning salience versus hero VFX, 20/30/60 FPS visual readability, 100/150/175% zoom, and crowd stress remain design/acceptance concerns. This is a CPU-work-focused correctness-preserving optimization, not a brightness or graphic-style retune.
- Physical-device Chromebook and phone frame-time/thermal acceptance; Canvas/Pixi GPU output parity; wider regression/full-game certification and explicit owner release approval remain open.

**Release decision:** Remain draft. No merge, Pages deployment or user-facing settings change. Verify the final PR head's focused GitHub Actions result before describing the candidate as passing.
