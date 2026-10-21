# Safe companion contributions during critical withdrawal — dev.143

Joel identified that the blanket attack ban made wounded ranged companions unnecessarily passive, then clarified melee companions/pets also have skills that can help without closing in. The existing tactical judgment remains authoritative; this is an action-specific exception inside its critical withdrawal path. Entry is still 20% HP, with no added recovery percentage or saved survival state.

## Practical behavior

A critical companion may use an existing basic attack or skill from its current position if that particular action has sufficient range and the position passes the safety checks. This includes archers/ranged pets, Soldier Holy Cleave and longer-reaching melee-pet skills such as Rolling Cargo, Pursuit Sweep and Pathfinder’s Gambit. Shorter instant abilities can also qualify if their existing reach and current clearance permit. The actor never moves closer or pursues a target to qualify for this exception.

It keeps following when the hero leaves its support band. A retreating actor can settle at an already useful, protected firing/casting position; normal cooldowns continue there rather than forcing it out of attack range between shots. Stationary contribution receives no movement-only retreat defense. Recall retains movement priority and basic-only covering fire, without starting an active preparation.

Safety requires existing range, firing line and a legal already-engaged target under the current TARGET/BOSS/ADDS doctrine. All nearby visible threats matter: ordinary melee clearance, enemy ranged/special reach, nearby warning/motion, and an alive, connected ally closer to an enemy that could pressure the position. Instants require a 25-unit buffer beyond the enemy's basic reach; charged actions require 60. An ally must be at least 15 units closer to qualify as a screen. Visible damaging areas and trap warning/active windows prevent holding a cast there. Area skills cannot use this exception to pull an idle bystander or hit a doctrine-excluded target.

Existing 0.65-second charges, interruption, Silence, training, costs, native damage, skill ranges and cooldowns remain. Safety is rechecked during preparation and after the tick's damage phases before release. Lost protection, closing enemies, hazards, changed targets or hero movement cancel an unsafe hold and allow immediate retreat. Basic fire can still work during Silence, as before. These bounded checks judge current conditions; they do not guarantee survival against every possible attack or change enemy targeting.

Pet healing, slowing and wards remain attached to their original skill contacts. Dreadmaw can heal itself and one ally through its existing legal hit; there is no free separate heal/ward cast or new ability. No longer heal-to-40/25 recovery gate is introduced.

## Validation checkpoint

68 focused new cases pass: all 15 hero/ranged-role combinations fire repeatedly through normal cooldowns; both skills of every troop/pet type obey their actual reach and charge deadline; closing enemies, ranged/boss/captain pressure, warnings/motion, lost screens, terrain, hazards, idle/neutral/returning foes, missing range and hero distance refuse unsafe actions. Real holds cancel on unsafe changes, late resolution is guarded, doctrine/area pulls are preserved, native attack-linked healing works, following does not chase, Silence preserves basics, trap warnings block holding, and actual engine ticks resolve projectile damage.

All 62 existing critical-retreat cases pass with obsolete blanket no-fire expectations revised to physical clearance and Recall's basic-only rule. Final existing judgment/Recall/pet and collision checks, bounded phone feedback/startup and build/format checks follow. No broad CI/full-game or repeated device matrix.

Standing owner package-only publication follows the focused checks, exact public source verification and restoration of normal pages.yml with the temporary publisher removed. Publication pending.
