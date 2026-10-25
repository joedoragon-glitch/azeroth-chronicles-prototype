# Mage Skill 1 beam travel and hero projectile follow-up audit

**25 October 2026 · Isolated development candidate · Not a release approval**

## Owner-approved visual and gameplay boundaries

- Both Mage Skill 1 forms retain full player movement. No new root/stun/action lock.
- Normal Arcane Beam: single target; slower (~0.75 seconds across native 400-world-unit range), gentle bounded homing toward its original target; brighter core and glow are **150% thicker (2.5x original width)**. Its damaging head moves on the real projectile path; its luminous trailing column reshapes to attach to the **current position of the Mage**. A moving Mage does not teleport the damage tip.
- Charged Wide Arcane Beam: reach and width are unchanged; spell advances over 0.75 seconds and deals damage only as the visible front arrives. It is not a separate homing projectile. **The aim point in world space is fixed at release** (at the original terrain-clipped endpoint). The column runs from the **current Mage position** toward that original aim point, so moving changes the angle, not the entire beam's position by parallel translation. Naturally angled overlap may catch extra enemies; each foe still takes no more than one hit from a cast. Terrain is rechecked as the angle changes, with no shooting through new walls.
- No new skill damage multipliers, target-count cap, cooldowns, mana costs, movement penalties, rank requirements, saved status, or charge-window changes.
- The existing transient hero-effect lifecycle cancels on death, challenge completion, and area transition. Normal projectile range/lifetime remain bounded.
- The gameplay collider, not a visual particle or canvas geometry guess, decides contact. Both Canvas and the Pixi overlay draw the charged gameplay corridor.

## Similar heroes / skills examined

| Source/skill | Current mechanism | Does a moving-actor tether belong? | Disposition |
| --- | --- | --- | --- |
| Paladin Skill 1 normal Radiant Strike | Independent holy projectile with existing world-space flight and hit resolver | **No**. Launched holy energy should depart and travel by itself; reconnecting the trail to a moving Paladin would misrepresent its mechanics. | Leave unchanged. |
| Paladin Skill 1 charged Radiant Cross | World-anchored four-arm area attack; initial and delayed second damage pulse at fixed cast location | **No**. Delayed pulses are part of the established world-space attack and should not follow a moving Paladin unless an independently approved balance redesign changes the skill. | Leave unchanged. |
| Ranger Skill 1 normal Rapid Arrows | Three independent arrow projectiles with staggered launch timings | **No**. Arrows should not be visually tied to a moving Ranger after launch. | Leave unchanged. |
| Ranger Skill 1 charged Hawk Interception | Real moving homing hawk with a bounded path, actual stepwise terrain collisions, and short local flight trail | **No**. A hawk pursues independently of its summoner; a persistent tether would read falsely. | Leave unchanged. |
| Paladin/Ranger other projectile attacks (including focused shots and charged volleys) | Independent arrows, bolts, or discrete attack-impact visuals | Normally **no**. Current impact paths should remain independent. | No changes in this candidate. |
| Mage Skill 6 charged Focused Beam | Another targeted projectile styled as a beam, with a legacy launch-origin line | **Potential yes**: the visual connection may similarly remain behind a moving Mage. But its Slow, projectile properties and animation are separate from Skill 1. | Separate follow-up, not silently modified here. |

**Implementation ownership:** `src/prototype/hero-combat.js` (wide corridor and single-contact logic); `src/prototype/combat.js` (ordinary homing travel/contact); `src/prototype/hero-presentation.js` (core/glow/curvature and charged art); `src/prototype/renderer.js` (live hero attachment and gameplay-owned charged geometry); `src/prototype/audio-hero.js` (no double launch sound). New and updated focused checks live under `tests/mage-skill1-beam-flight.test.cjs`, `tests/hero-skill1-stage1.test.cjs`, and `tests/hero-skill1-integration.test.cjs`.

## Review gates

1. Native focused gameplay tests: near/far delayed contact, 0.75-second completion, one hit per foe, original world-space aim, movement-induced angle and natural extra hits, no parallel-lane sweep, obstacles, death/zone cancellation, bounded ordinary homing and target loss.
2. Visual testing: moving and stationary Mage, target dodge, 2.5x ordinary thickness, normal/reduced motion, Canvas and Pixi overlay. Compare observed impact and beam front timing at 20/30/60 FPS.
3. Protect baseline damage/rank/cooldowns, save v4 and historical performance behavior.
4. Keep unmerged and undeployed pending owner's own visual playtest and review. A source audit cannot substitute for real-device frame timing or screenshots.
