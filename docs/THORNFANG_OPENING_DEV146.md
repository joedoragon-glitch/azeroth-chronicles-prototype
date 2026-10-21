# Thornfang opening pacing — dev.146

Joel's new-run playtest found Thornfang reaching the early learning area too quickly. Reverse the existing circuit, beginning toward the southern crossing, then the Crypt and Skeleton territory, before the Mill crossing and Goblin territory. Preserve waypoint indices and existing saved destination/position; apply the reversed progression at the next waypoint. Fresh/reset patrols use the southern leg. Witness descriptions follow the route.

Focused impact: navigation patrol/defaults, encounter reset default, witness clues and existing Thornfang/Mira lifecycle suite. No stat, acquisition, combat or save-schema changes. A native movement comparison with fixed seed 0.5 reaches Goblin territory in 9.4 seconds before versus 60.7 seconds after. This measures patrol travel, not a guaranteed grace period if the player approaches him.

Owner authorized minimum targeted local checks and immediate merge/publication without broad CI while playtesting. Publication uses the established temporary package-only workflow, with normal workflow restored afterward.

## Validation and publication

Existing Thornfang/Mira suite: all 18 seeded class/mode circuits passed, including collision, real shared damage, physical joint return, save/travel, rescue, respawn, singleton TRUE and peace. Witness suite passed every leg and report/state/interaction check. Build, changed-source formatting and diff checks passed. No whole-game test suite or broad CI ran.

Merged PR #384 as `e01f3a0d81bb228cf6ec538d93e7d68c4c9562b5`; package-only publisher run 39694788549. Exact-public receipt: `docs/evidence/THORNFANG_OPENING_DEV146_PUBLICATION_20261021.json`. Normal Pages workflow restored byte-for-byte and temporary publisher removed in closeout. Existing saves retain current position and destination; reversed traversal begins at the next waypoint, with no forced teleport/restart.
