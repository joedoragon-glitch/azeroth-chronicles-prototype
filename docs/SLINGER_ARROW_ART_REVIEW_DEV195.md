# Dev.195 — Slinger silhouette and Ranger arrow visual follow-up

Owner playtest (26 October 2026) rejected the dev.194 Goblin Slinger silhouette as awkward: the cords resembled several long sticks, and the stone bag appeared face-like. On the same screenshot, Ranger auto-attack and all or some of the three normal Skill 1 arrows still appeared bent. Owner authorized autonomous corrections, an aesthetic/technical audit and merge when safe.

## Root causes and changes

- The previous Slinger equipment correctly removed bows and quivers but placed a wide Y-shaped contraption and bulky bag around the Goblin, which distracted from the approved sly Goblin silhouette. This release shortens and narrows the twin sling cords, uses a smaller dark leather cradle with a single muted gray stone, and reduces the waist pouch to a modest soft-sided bag with partly concealed spare stones. Facial expression, crown, stance and existing outfits remain unchanged. The friendly Goblin Archer keeps bow and quiver; melee Goblins keep swords. The drawn sling is entirely procedural on both Canvas and Pixi bakes.
- Dev.194's arrow repair modified `renderer.js::drawProjectileBody`, but live Ranger hero projectiles first use `heroArt.projectile()` and return early. The earlier fallback repair therefore did not apply to the reported auto-attack or Skill 1 arrows. The actual Ranger renderer now draws one rigid shaft, compact metal tip, and fletching at the projectile's independent world-space head and heading. No extra long trailing ribbon, no alternate combo shafts, no line connecting it to the live caster. All delayed Skill 1 arrows become visible only on actual collider release; basic shots use the same art. Existing Mage-only caster-tethered effects are intentionally preserved.
- Gameplay, projectile collision/timing, enemy damage, save schema, sprite registrations, lighting and FPS policy remain unchanged.

## Technical / aesthetics audit

Tests record procedural brush commands and distinguish ordinary, crowned/ringleader, friendly-archer and melee Goblins. Projectile regression samples six paths (three combo auto shots + all three normal Skill 1 sub-shots), moving caster positions, reduced-motion, unreleased delay, charged arrows and Mage's intentional beam tether. Existing targeted visual fidelity and offline PWA build gates apply.

A fixed screenshot cannot establish how every phone scales these details. Owner's actual-device visual approval is still required after deployment. Do not treat a source-level brush assertion as equivalent to subjective artwork approval.
