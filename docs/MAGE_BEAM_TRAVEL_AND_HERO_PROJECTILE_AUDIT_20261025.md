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

## Extended independent-skill audit (25 October 2026)

The desired attachment applies to a spell **whose beam is meant to remain connected to its caster**. It must not be generalized to every projectile that happens to use a luminous trail. This check covered `hero-combat.js` launch paths, `combat.js` stepwise target contact, and `hero-presentation.js` silhouettes:

- **Paladin:** Skill 1 Radiant Strike is a launched holy bolt. Charged Radiant Cross is a fixed-location two-pulse attack. Other Paladin attacks are melee, area effects, or independent launched effects, not a continuous caster-fed beam. No Paladin tether change belongs in #452.
- **Ranger:** Skill 1 Rapid Arrows launches three staggered arrows. Hawk Interception owns a moving, finite path; it is not attached to the Ranger once released. Pinning, volleys, repelling and piercing attacks, as well as Hunter's Salvo/Grand Hunt shots, remain independent projectiles or world-space effects. A visual tether would wrongly imply caster-following damage.
- **Mage Skill 2–5:** Frost Bolt and other launched bolts use independent projectile contact. Frost Burst, Silence Field, Arcane Rupture, Force Pulse/Wave and other shaped attacks use their respective fixed or instantaneous area geometry. These are not continuous Skill 1 beams.
- **Mage Skill 6:** Normal Magic Shot remains its normal independently launched projectile. **Charged Focused Arcane Beam** is a launched `style: 'beam'` projectile with a fixed `originX/Y`, speed 1000 and its own Slow effect. The current fixed-origin drawn trail can visually lag behind a moving Mage, but the projectile **itself must not inherit** Skill 1 homing, speed, width, contact, or charged-corridor behavior. Any future visual-only moving-tail improvement requires a separate assessment and approval.
- **Mage Skill 7–8:** Arcane Chain/Chainstorm handle discrete target-to-target chain effects; Astral Detonation/Cataclysm are area effects. Neither represents a launched, caster-connected column.

**Regression ownership:** `tests/mage-skill1-beam-flight.test.cjs` now tests the unchanged Paladin/Ranger Skill 1 projectile, Paladin charged cross, Ranger Hawk and Mage charged Skill 6 distinctions. The Chromium Pixi smoke exercises the Mage's displayed Skill 1 geometry on the real Canvas overlay in both Canvas 2D and WebGL2 operation, on desktop and phone. The browser smoke is a rendered-surface check, **not** physical-device feel, a human visual sign-off, or a replacement for normal simulation regressions.

## Review gates

1. Native focused gameplay tests: near/far delayed contact, 0.75-second completion, one hit per foe, original world-space aim, movement-induced angle and natural extra hits, no parallel-lane sweep, obstacles, death/zone cancellation, bounded ordinary homing and target loss.
2. Visual testing: moving and stationary Mage, target dodge, 2.5x ordinary thickness, normal/reduced motion, Canvas and Pixi overlay. Compare observed impact and beam front timing at 20/30/60 FPS.
3. Protect baseline damage/rank/cooldowns, save v4 and historical performance behavior.
4. Keep unmerged and undeployed pending owner's own visual playtest and review. A source audit cannot substitute for real-device frame timing or screenshots.
