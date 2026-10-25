# Azeroth Chronicles — Stage 5.1 warning/telegraph prominence and resource audit

**25 October 2026** · Source-verified design/CPU investigation on **draft PR #471 only**. Main at inspection: `e3c78266b28f3325d2afdcb76ae849fcff306deb`. No merge, deployment, new graphics setting, gameplay retuning, or warning-style alteration is authorized by this document. This supplements [Stage 5 acceptance](EFFECT_DIAGNOSTICS_STAGE5_ACCEPTANCE_20261025.md); it does not waive the physical-device release gate.

## Owner concern and testable distinctions

The concern is not only missing VFX. Large, bright, persistent warning footprints and cast annotations may visually dominate shorter hero, companion, and enemy action effects. Telegraphs might be mistaken for the action rather than anticipating it. That is a **visual hierarchy/perceptibility** problem even if all painter callbacks execute and no effect queue entry expires early. A separate hypothesis is that telegraph drawing uses too many resources compared with its informational purpose.

Distinguish:
1. **Danger geometry (warning/telegraph)** — pre-impact footprint, timing and safe openings; crucial gameplay information, not the magical/physical attack itself.
2. **Execution VFX** — projectile travel, strike, area/impact, heal, guard, enemy-material response. Should retain identity and perceptual prominence at contact.
3. **Secondary annotations** — boss skill caption/countdown, extra labels, cosmetic interior marks, charge halos. Candidate for reduction *if* it doesn't hide unique mechanics.
4. **Real cost** — time to build/project/rasterize composited warning shapes and their interaction with the effect painter, as separate from overall simulation FPS.

## Source findings (verified, not inferred device behavior)

- `src/prototype/renderer.js` calls `PrototypeCombatVisuals.ground(..., 'fill')` **and** `ground(..., 'underlay-cue')` each normal, non-background draw. These are separate filled-footprint and outlined/label passes. `combat-visuals.js` builds the current warning geometry from game-owned telegraph state during those passes (including `game.attackPatches()` and `warningShapes()` for ordinary visible attacks). This is intentional presentation architecture but can repeat geometry/projection work.
- Example geometry constructors: `circlePoints` uses **48** points, `capsulePoints` uses **34** points, `sectorPoints` uses **34** points; cordon outlines can use **130** points; a canister can create **nine separate capsules**. Those are **source operation counts**, not measured GPU/CPU burden. No polygon points or collision volumes were changed in this review.
- Basic boss/ordinary attack footprints use yellow/orange outlines (commonly 2.5px) and translucent reddish fills. Signature Rogue warnings use a more vivid cyan and wider (3.3px) outline. Specialized mechanics additionally render prominent board cells, safe-gap lines, tracking counts and patterned zones. In crowds, their *aggregate screen coverage* may become more salient than an individual attack effect.
- `PrototypeCombatVisuals.actorCues` draws bold skill names and countdown panels **after** `renderer.drawVisualFx()`; these boxes can visually overlap the upper region of actor effects, unlike the ground footprints which are usually drawn earlier in the normal Canvas pass. A label obscuring an effect is a specific browser-visual hypothesis, **not yet a reproduced pixel collision**.
- `PrototypeEnemyVfxArt.actors` adds bespoke local wind-up art. Some wind-ups are part of the warning language and can be mistaken for release VFX when extremely bright; don't remove them indiscriminately because they carry species/boss identity.
- In the experimental PixiJS presentation, normal Canvas warnings are drawn in a **transparent Canvas overlay above the GPU world**; because of that different layer arrangement, Canvas scene conclusions cannot automatically establish that telegraphs are properly subordinate to illustrated actors in Pixi.
- The source uses `ground` passes every permitted draw, not an extra timer or diagnostic loop. Rendering cost is not proven excessive merely because geometry is reconstructed; the real baseline/delta has to be measured.

## Narrow evidence instrument

`tests/effect-warning-budget-audit.test.cjs` samples **11 real first boss telegraphs** through the production `CombatVisuals.ground` fill/outline passes on a native Canvas; counts projected geometry, game `attackPatches()` calls, actual alpha-occupied pixels and opaque-ish pixels separately for fill and outline, and records five-sample median draw times as CI-native *observations*. It also samples a naturally cast Paladin skill through `HeroPresentation.draw` for area comparison. The test verifies rendering does not mutate the campaign snapshot.

This is not a fair A/B CPU performance benchmark (different scenarios, limited warmup/replicates, software CI rendering); boss shapes and a Paladin spell are *not* semantically equivalent. Do not interpret their pixel-area ratios as perceptual dominance or compare isolated draw timings as production FPS. The point is to find expensive/high-area candidates to inspect next, without changing the published game or establishing arbitrary performance limits.

## Recommended treatment — proposed, **not yet applied**

1. **First priority: visual contrast, not deletion.** Make the *informational* language calmer and more uniform: low-saturation translucent footprint, one crisp boundary and an identifiable last-moment timing cue. Reserve bright saturated highlights and material-specific trails/flash for **execution VFX**. Maintain shape clarity under grass, roads, darkness and texture; do not use color as the only meaning signal.
2. **Inspect overlapping annotation panels.** Avoid text boxes obscuring important hero/projectile/impact focal points, particularly on phone viewports and with multiple bosses/captains. Prefer minimal countdown or enemy-attached cast information when the full skill caption duplicates an already-clear threat.
3. **Complex mechanics are exceptions.** Preserving exact safe lanes/openings and count/tracking indicators outranks minimalist styling. Cordon gaps, directional charges, ring escape boundaries, Royal Territory safe side, Ledger warnings and arena-board attacks require specific checks. Do not simplify shapes in a way that makes warnings contradict actual collision/damage geometry.
4. **Performance investigation order:** profile the two passes and their projection work; identify natural overlap-heavy scenes; then evaluate nonsemantic simplification of *decorative* components or reusing purely presentational geometry between fill/outline in the same draw if reproducible cost justifies it. Do not cache mutable telegraph geometry across gameplay ticks without lifecycle tests. Lower-opacity fills do **not** guarantee lower CPU cost and can be equally expensive to rasterize.
5. **Keep gameplay and accessibility invariant.** No changes to attack trigger windows, damage, cooldown, targeting, hitboxes, projectile movement, 40 transients, 3 statuses/enemy or 24 status-bearing enemies. Respect normal and reduced motion and protect mobile readability.

## Acceptance before any visual code adjustment

- Controlled side-by-side screenshots for *the same live-produced attack*: baseline warning+effect, warning only, execution effect only, and hypothetical toned-down warning candidate at fixed 100/150/175% camera scales, day/night, terrain variations and desktop/phone viewport; compare Canvas and optional Pixi overlay separately.
- Verify warning edge and safe space match damage/collision in charge, arc, ring, canister, board and multi-projectile patterns; final ~0.15 seconds of telegraph are still distinguishable from the subsequent impact.
- Measure paired baseline/main-versus-candidate render timing distributions (median, p95) and frame skipping in comparable crowded natural battles with identical simulated state and fixed FPS settings. Record scene complexity, renderer, device, optimized/reduced motion. Isolated CI draw timings support hypothesis generation only.
- Confirm hero/companion/spell animations are more identifiable, rather than merely brighter or hidden behind labels. At a minimum use pixel-layer comparators in headless browsers; **human perceived salience needs actual device visual acceptance** before release.
- If an adjustment only improves aesthetics without measurable CPU delta, report it as a visual improvement rather than a performance optimization.

## Status and boundary

**Source layering and likely duplication points audited; candidate visual style unchanged.** Native observational geometry/pixel test introduced on the same draft PR for focused CI. Record its exact head and green run separately after completion. Real-life visual crowding, actual phone/Chromebook CPU cost, GPU/WebGL parity and owner's final stylistic/release acceptance remain **unverified**. The owner need not provide anything to continue pre-release research; do **not** merge/deploy from this note.
