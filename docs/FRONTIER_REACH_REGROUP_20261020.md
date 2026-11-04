# Frontier scenery, enemy reach and regroup support — 20 October 2026

Published through [PR #335](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/335), merge `3fccc550e4bca3e356a8b152915bb842682508ef`. Package-only [run 39400269827](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39400269827) succeeded; all 13 live file checks match. Normal workflow restored; temporary publisher removed. [Receipt](evidence/FRONTIER_REACH_REGROUP_DEV101_PUBLICATION_20261020.json). Owner live play and bow-preview feedback next; no automatic further work.

Dev.101 follows published dev.100. Joel supplied three Frontier screenshots and requested map-edge channel continuity, replacement of the detached dark strip with a polished civic fountain, and new leaves on burned trees. He then requested longer enemy specials with matching warnings/effects, slightly greater targeting distance to balance all ranged party members, earlier recognition of losing fights, and healing for wounded enemies arriving to regroup. A fourth screenshot requests a preview of paired violet bows on the Mage's braids; that preview is unselected and is not applied to the runtime.

## Frontier

The main Frontier ravine/channel now spans y=0 through y=3400, reaching both map boundaries. Both crossing locations and their full gap widths stay intact. Collision reads the same bank geometry as the drawing. The detached 70 by 200 strip at (1775,1120) becomes a round 46-radius solid fountain basin. Its former ends become dry ground. A fixed depth-sorted presentation body reads the terrain anchor, avoiding new save fields or duplicate saved props: carved stepped stone basin, bronze lily, smaller upper bowl, clear water arcs and ripples. This is scenery, not an extra healing service.

Burned Frontier wild trees and existing dead-tree raster bodies gain small green shoots and leaves. Broken trunks and bark remain visible. The procedural body and retained raster receive appropriately anchored versions; other regions and dead scrub stay unchanged. Original raster bytes/registrations remain intact. Native canvas captures cover both channel boundaries, the fountain in the actual settlement, woodland and both tree bodies. Rendering leaves campaign state unchanged.

## Enemy range and party comparison

Mage basics reach 400 world units; Ranger basics reach 450. Many hero targeted skills and companion Piercing Volley reach 480. Paladin has ranged Judgment (260 normal / 310 charged); the generic targeting limit for several other skills is 480, even where the actual effect is self-centered. Friendly skill definitions are byte-equivalent to dev.100's rules after serialization; no friendly range or damage was changed.

Enemy offensive special reach increases by 20%: boss targeting 600 to 720, existing boss area multiplier 1.15 to 1.38, captain targeting, fixed-radius captain attacks, multi-pad impacts, night skills and Rogue footprints/target limits. Specialized Cindermaw and Dreadmaw spatial plans expand through their own tables. The minister's ally-protection/delegation selection range stays unchanged; its offensive delegation finisher expands. Arena-bound checkerboard/formation layouts remain authored to their rooms. Ordinary idle acquisition increases 260 to 286, and ranged basic targeting increases 10% using live actor data, including restored actors.

Warnings and effects use the same expanded engine patches/fields. Volley flight and warning reach both increase from 650 to 780. Tracking-shot warning length reads its actual speed times lifetime. Sentinel fragment lifetime now follows the expanded canister radius, keeping the final fragment inside its warning. Ring warnings read actual speed/lifetime. Charge widths, cone angles, projectile speed, damage, warning duration and cooldowns do not increase. Existing wall/line-of-sight and legal arena-placement rules still apply; tight rooms can reduce or reject an attack footprint rather than drawing through walls.

## Retreat and treatment

Initial outmatched-fight assessment starts after 0.4 seconds instead of 1.1; thinking lasts 0.3 instead of 0.8. The ordinary/guardian/ringleader wounded threshold rises from below 30% to below 50% HP. Existing high-level protection and leader/arena behavior remain. A regrouped wounded unit with an active healing pulse can hold sheltered ground instead of immediately returning to attack.

Idle healers can treat nearby wounded hostile allies without first becoming aggroed. They can approach an arriving regrouping ally within the existing support search distance. Regrouping recipients qualify at 90% HP or below; other recipients keep the 75% threshold. Area healing still restores its existing amount over five seconds on the same ten-second cooldown; no stacking, no revived/dead/returning recipients, no healing through walls or Silence, and no new self-healing roles. An idle full-health battlefield skips the new triage search via one cheap wounded-presence check. Archive healing guidance reflects the current threshold and idle response.

## Focused evidence and limits

Passed: real expanded fringe damage and warning containment; safe outside fringe; volley/fragment endpoints; night/Rogue ranges; automatic acquisition and ranged aim; earlier wounded/outnumbered decisions; idle healer response/approach, and cooldown/Silence/cover/returning gates. All seven Dreadmaw plans remain legal in the actual Treasury. Cindermaw's offensive finisher and unchanged ally support radius are checked. Existing enemy-area and enemy-support healing tests pass. Sixteen integrated Rogue effectiveness/lifecycle checks pass. Frontier boundary/basin routing and old-save repair/progression checks pass, as do all nine existing crossings in both directions and restored saves. Native canvas scene renders are read-only. Hero, troop and pet skill definitions match dev.100 exactly. Build/generated syntax, changed-file formatting and diff checks passed.

No whole-game suite, browser matrix or broad hosted CI. These are focused simulations and native canvas inspections, not a claim about owner-device FPS or final subjective balance. Owner live play remains the next gameplay/device check. The Mage bows are a reviewable preview only, with exact candidate code retained separately.

## PixiJS burned-tree foliage parity — 31 October 2026

[Follow-up PR #746](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/746) addresses the later-discovered renderer difference from [environment audit #710](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/710). Original Canvas already draws deterministic epicormic shoots over registered Frontier dead-tree rasters. Native PixiJS previously drew the approved raster without that foliage.

The targeted correction attaches a small native Pixi `Graphics` foliage layer immediately above the raster in the same isometric actor order, using the original Canvas stem/leaf sizes, positions, colors, stable identity selection and visual scale. GPU geometry is reused during ordinary frames, camera zoom and movement; no additional raster uploads or altered tree images are required. The layer is restricted to registered Frontier dead-tree visuals, so existing procedural tree art, all other regions, game state and collision remain unaffected. Focused source and bridge tests are part of PR #746.

This is a source implementation record, **not independent evidence of a published build, hardware-performance measurement or owner-approved visual inspection**. Final merge/CI/Pages status is authoritative in PR #746 and its exact-commit workflow receipts. The historical #710 audit branch is not a patch to merge.
