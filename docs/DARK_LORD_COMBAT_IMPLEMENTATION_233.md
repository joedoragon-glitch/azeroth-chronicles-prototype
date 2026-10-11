# Dark Lord combat — approved design, first implementation slice

**Status: isolated WIP, not verified or authorized for merge/deployment.** The owner approved the eight main moves and two tactical reactions. This branch contains implementations for the approved attack kit; release-readiness remains subject to exact-head verification.

## Implemented in existing authoritative boss owners

- **Veteran's Repertoire:** slot 0 now uses three warned sword arcs (1.1s / 0.5s / 0.8s), damage coefficients 0.85 / 0.85 / 1.3. The shield-feint also attempts a collision-aware lateral sidestep.
- **Pathfinder's Gambit:** slot 1 uses three marked landing movements and the existing collision-aware movement system with coefficients 0.55 / 0.65 / 1.4. Blocked/short routes and warning-to-impact matching require real encounter testing before this can be accepted.
- **Royal Muster:** original summon slot retained, existing caps of 3 Normal and 6 TRUE remain; a temporary protective formation is applied to newly summoned defenders.
- **Freedom Has a Price:** original alternating-sector phase below 50%, with 1.4s signals and 1.1 coefficient. The prohibited damaging sector and opposite protected sector are shown distinctly.
- **No More Heroes:** a fifth authored attack slot, a narrow line thrust below 30% HP with 1.5s warning, 1.5 coefficient and 8s base recovery. The shared 0.25 recovery multiplier reduces that to 2s.
- **Writ of Restraint:** the tactical Crown Grasp renamed, with existing snare mechanics and 0.26 coefficient unchanged.
- **Crown Decree:** existing tactical command/rally move unchanged.

## Second Wind implementation

Once below 35% HP, the Dark Lord can perform one 1.8-second recovery stance: 35% incoming damage reduction and a 5% maximum-HP heal. His facing is locked on initiation; an actual rear hit cancels the healing without preventing damage. Its once-only encounter flag prevents healing loops. This requires exact-head QA, including old saves and device visibility.

## Expanded mechanics added on this isolated branch

- **Royal Taxation** (sixth primary attack slot) marks up to two living party members for five seconds. Once two *distinct* marked attackers each land a damaging action, one temporary shield worth 3% of his maximum HP appears. The shield absorbs subsequent damage; no actual crowns, XP, inventory or quest flags are removed. Marks and the shield are drawn on the battlefield.
- **Royal Prerogative** redirects an incoming hero/companion projectile to a real nearby living Crown summon only when that defender intersects the projectile's approach; the guard takes the damage and the reaction goes on an 18-second cooldown. Area attacks are not intercepted.
- **Royal Muster** gives living summoned Crown guards a temporary protective formation (three seconds of 20% incoming damage reduction for those guards). Normal/TRUE caps and ranged equipment remain unchanged.
- **Veteran's Repertoire**'s second beat attempts an actual collision-validated sideways movement before resolving its arc.
- **Freedom Has a Price** now displays the currently prohibited sector and its opposite protected sector with separate warning colors. The actual damage is confined to the prohibited geometry; ordinary soldier attacks can still reach a protected sector.

These represent the remaining approved mechanical directions, **not a claim that the exact build has passed CI or device validation**. Real attack-state, save, pathing, warning/hitbox, audio/VFX, and browser tests must still pass before the combined release can be accepted.

This PR preserves boss family `darklord`, other boss attack tables, v4 saves, Awakening flags, treasure/rewards, existing region geometry and the multi-file PWA. The source-protection regression retains all old hashes, with explicit exact Git blob hashes for the four intentionally edited boss/combat-owner files; that exception is not blanket permission for other changes.

Required before integration: exact-head CI full Node/build/format, representative Chromium/WebKit desktop/mobile, telegraph-to-hitbox equivalence, old-saves, TRUE/Nightmare, all classes and party sizes, and an owner-approved combined #232 release. Do not mistake successful static tests for real automated encounter acceptance.
