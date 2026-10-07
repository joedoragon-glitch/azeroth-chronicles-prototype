# Abyss Bastion irregular dungeon pass

## Identity

Abyss Bastion is an occupied containment fortress built around a dangerous dragon asset. It is not a generic rectangular dungeon and not merely a natural dragon cave. The Dark Lord's occupation has built daily military, handler and logistics functions around a creature that remains dangerous enough to shape the architecture.

The pass remains fully procedural. No sprite asset is introduced.

## Architecture

Abyss uses the shared data-driven main-dungeon architecture system.

Its walkable footprint is formed from overlapping functional wings rather than one full rectangular floor:

- handler intake;
- containment spine;
- hatchery wing;
- feeding/service wing;
- dragon aerie;
- reconnecting service loop.

Four internal partitions create containment gates and readable chokepoints. Each partition has broad authored openings. The layout is intended to bend progression and create encounter staging without becoming a single-file corridor maze.

The same architecture data drives collision and visible procedural partition rendering.

## Guardians

Abyss uses 26 guardians in 13 authored two-unit groups.

Each group contains regional defenders rather than invented species:

- Orc melee guardian;
- Raider ranged guardian.

Groups are placed by function: intake, containment gates, hatchery, feeding/service spaces, service loop, aerie gate and inner/rear aerie defense.

Guardians remain zero gold and zero EXP. Their count and placement exist only to create dungeon pressure. Reinforcements and Awakening guardian waves use the same authored formation network.

## Traps

The final plan uses 18 traps.

An earlier denser plan failed the permanent-hazard route regression: a required bend could become a trap toll. That design was rejected rather than weakening the test.

The accepted rule is stricter:

- traps may contest obvious movement or firing lines;
- traps may pressure room edges and defensive groups;
- traps may make shortcuts unattractive;
- traps may not cover every usable route through a required transition.

Regression inflates seal radius and also inflates jet length and jet half-width, treats every enlarged trap as permanently unsafe, and still requires maneuver-width routes from the entrance to:

- Abyss Dragon;
- Eren;
- feeding/service space;
- hatchery/containment space.

## Functional dressing

Five procedural districts make the interior readable as a lived-in system:

- handler intake;
- containment gallery;
- hatchery;
- feeding/service;
- roost/hoard.

New procedural families include handler stations, feed crates, containment posts, scorched floor traces, egg cradles, feeding troughs, carcass racks, claw scrapes and dragon perches. Chains, roosts, hatcheries and bone piles gain deterministic local variation.

All dressing remains decorative and non-colliding.

## Save migration

Abyss advances to dungeon layout version 4.

Existing saves keep campaign, boss, captive, reward and defeated-guardian state. Surviving legacy guardians are restaged into the authored formation; only missing new slots are added. The hero, active companions, NPCs and surviving enemies are moved only when their saved position becomes invalid under the irregular architecture.

Trap hit-cycle keys follow the dungeon layout version so the moved trap plan does not inherit stale hit state.

## Balance guardrails

The Abyss Dragon's stats and mechanics are unchanged. Its aerie remains open enough for the cone, ring, sequential landing circles and summoned Ash-beast pressure.

The challenge is created by:

- staged guardian pairs;
- ranged/melee cross-pressure;
- containment chokepoints;
- avoidable trap pressure;
- branching movement and service spaces;
- final aerie positioning.

It must not be created by unavoidable trap damage or invisible collision.
