# Dark Lord combat — approved design, first implementation slice

**Status: isolated WIP, not verified or authorized for merge/deployment.** The owner approved the eight main moves and two tactical reactions. This branch implements the initial attack-kit slice, not the whole design.

## Implemented in existing authoritative boss owners

- **Veteran's Repertoire:** slot 0 now uses three warned sword arcs (1.1s / 0.5s / 0.8s), damage coefficients 0.85 / 0.85 / 1.3. The shield-feint is a directional arc, **not yet a physical sidestep**.
- **Pathfinder's Gambit:** slot 1 uses three marked landing movements and the existing collision-aware movement system with coefficients 0.55 / 0.65 / 1.4. Blocked/short routes and warning-to-impact matching require real encounter testing before this can be accepted.
- **Royal Muster:** original summon slot retained, existing caps of 3 Normal and 6 TRUE remain; formation instructions pending.
- **Freedom Has a Price:** original alternating-sector phase below 50%, with 1.4s signals and 1.1 coefficient. True protected/prohibited terrain states pending.
- **No More Heroes:** a fifth authored attack slot, a narrow line thrust below 30% HP with 1.5s warning, 1.5 coefficient and 8s base recovery. The shared 0.25 recovery multiplier reduces that to 2s.
- **Writ of Restraint:** the tactical Crown Grasp renamed, with existing snare mechanics and 0.26 coefficient unchanged.
- **Crown Decree:** existing tactical command/rally move unchanged.

## Still required before the approved kit is complete

Second Wind (once-only heal and rear interrupt), Royal Taxation (combat-only marks and temporary shield), Royal Prerogative (guard-intercepted projectile), soldier formations, actual shield sidestep, and protected/prohibited sector geometry. These must be implemented in separate authoritative combat slices with deterministic state tests.

This PR preserves boss family `darklord`, other boss attack tables, v4 saves, Awakening flags, treasure/rewards, existing region geometry and the multi-file PWA. The source-protection regression retains all old hashes, with explicit exact Git blob hashes for the three intentionally edited boss-owner files; that exception is not blanket permission for other changes.

Required before integration: exact-head CI full Node/build/format, representative Chromium/WebKit desktop/mobile, telegraph-to-hitbox equivalence, old-saves, TRUE/Nightmare, all classes and party sizes, and an owner-approved combined #232 release. Do not mistake successful static tests for real automated encounter acceptance.
