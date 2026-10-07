# Abyss Bastion dungeon-depth pass

## Purpose

Abyss Bastion is no longer constrained to the shared rectangular main-dungeon skeleton. It is an occupied containment fortress built around a dangerous dragon asset. The dungeon must challenge a level-appropriate party through encounter sequencing, movement pressure and readable hazards rather than through forced damage or arbitrary maze friction.

This pass remains procedural. No sprites are introduced.

## Shape and progression

The 1500 × 1500 simulation space remains for compatibility, but the **walkable footprint is asymmetrical**.

Two large abyss cuts remove the upper-right and lower-left corners from usable space. Three internal wall systems then divide the remaining fortress into functional combat spaces:

1. **Entry garrison** — broad starting chamber with room to establish formation.
2. **Containment gate/gallery** — first defended transition into the controlled dragon infrastructure.
3. **Hatchery threshold and hatchery** — creature-life area with a second broad gate and room to fight around hazards.
4. **Lower service bay** — optional maneuver/service space connected to the hatchery, not a mandatory dead end.
5. **Dragon aerie** — wide final chamber sized for Abyss Dragon ring/circle attacks, summons and retreat movement.

Required gates are intentionally wide enough for companions to pass without single-file collision behavior. The dungeon is not designed as a corridor maze.

## Guardians

Abyss guardians still give **0 gold and 0 EXP**. Their job is encounter pressure, not farming.

The pass uses 22 guardians because the stronger geometry and trap decisions already add meaningful difficulty. The number is no longer treated as a sacred regional quota: guardians are placed in nine authored defensive groups tied to fortress functions rather than the old generic repeated pair grid.

The groups cover:

- entry watch;
- entry garrison;
- containment gate;
- containment gallery;
- hatchery threshold;
- hatchery;
- service bay;
- aerie gate;
- aerie defense.

Reinforcements and awakened guardians reuse the same authored post network. If future playtesting shows that the new geometry makes the dungeon too light or too exhausting, guardian count can be changed independently without affecting rewards.

## Traps

Abyss Bastion now uses 18 engineered trap positions rather than preserving the old count for its own sake.

Traps are placed to:

- contest obvious shooting/movement lines;
- pressure the edges of larger chambers;
- complicate fights near defensive posts;
- punish careless retreat through already-contested space.

They are **not** placed to cover an entire required doorway or force the player to deliberately step on a trap.

Regression tests inflate every trap footprint with extra safety margin, treat all traps as permanently unsafe, and then verify each required progression segment remains routable. The optional service bay must also remain reachable in both directions under the same assumption.

## Visual functions

The old flat decor mixture is reorganized into five readable districts:

- entry garrison;
- containment gallery;
- hatchery/roost;
- lower service bay;
- dragon aerie.

New procedural families include:

- chain winch;
- heat shield;
- feeding trough;
- scorch gouge;
- nest scrape;
- handler station.

Chains, roosts and hatchery elements also gain stable deterministic variants. Props remain zero-collision decoration; the actual dungeon shape comes from explicit collision geometry rendered visibly in world space.

## Save safety

Abyss Bastion advances to dungeon layout version 3.

Existing saves:

- keep defeated guardians defeated;
- keep boss/captive/quest/reward state;
- keep guardian HP state;
- move surviving guardians to the new authored defensive posts;
- move the boss, exit and captive cage to the new authored points;
- move the hero or active companions to the nearest valid point only if the new geometry would otherwise contain them inside a wall/abyss cut;
- rebuild only the decorative Bastion layer.

The trap hit-key also advances for Abyss so moved traps do not inherit stale hit-cycle state from the old layout.

## Balance guardrails

The pass is considered valid only if:

- the entry can reach the boss and cage without crossing a permanently blocked trap footprint;
- every mandatory waypoint-to-waypoint progression segment remains passable with inflated trap avoidance;
- the service bay is not a one-way trap;
- the aerie retains enough open floor for the Dragon's ring, sequential circle and summon mechanics;
- guardians and reinforcements remain zero-reward;
- the new geometry is visible, not an invisible collision trick;
- the dungeon remains challenging through staged pressure rather than unavoidable damage.
