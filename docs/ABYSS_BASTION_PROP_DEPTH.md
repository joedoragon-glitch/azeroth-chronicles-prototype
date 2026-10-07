# Abyss Bastion procedural depth pass

Abyss Bastion is the Ashen Frontier's main dungeon and should read as more than a generic dragon cave. The occupation has stabilized the surrounding province because reliable roads, supplies and control now serve power. The Bastion therefore reads as a maintained facility built around a dangerous dragon that is simultaneously contained, provisioned and exploited.

This pass now redesigns both presentation and dungeon topology. Abyss Dragon combat, guardian stats/rewards, reinforcement rules, boss/captive coordinates, clear rewards and progression remain unchanged, but the Bastion has its own collision geometry, a larger 26-guardian garrison and a revised 22-trap encounter plan.

## Internal functions

### Handler intake
The entrance side now communicates routine service work with handler tables, feed crates, supplies, chains and lighting. This establishes that material enters the Bastion and somebody is expected to manage it.

### Containment gallery
Chains are paired with anchors and reinforced containment posts instead of appearing as disconnected symbols. Scorched floor wear shows where the dragon's presence has physically marked the structure.

### Hatchery
The existing hatchery identity is expanded with egg cradles, heat sources, chains and supporting roost material. It should read as a maintained nesting/breeding area rather than one hatchery icon.

### Feeding and service
Feeding troughs, preparation racks, remains, sleeping space and service lighting make the daily upkeep of the dragon visible. The function is logistical, not a new reward source.

### Roost and hoard approach
The final approach combines the existing hoard/roost identity with claw wear, a dragon perch, heat and occupation supplies. It remains visually distinct from the hatchery and service areas while leading toward the Abyss Dragon and Eren.

## Deterministic procedural variation

Abyss chains, roosts, hatcheries and bone piles use the renderer's existing stable ID hash to gain small deterministic differences. The same saved prop always renders the same way; repeated props no longer need to look perfectly cloned.

## Dungeon shape and encounter flow

Abyss Bastion no longer uses the legacy single vertical partition shared by the other early main-dungeon layouts. Several authored rectangular masses plus a central circular containment core carve an irregular playable footprint. The entrance/intake side feeds into the containment gallery; the layout then offers broad alternatives around the core through hatchery and feeding/service wings before reconverging near the roost.

The direct entrance-to-dragon line is intentionally obstructed, but the dungeon is not a narrow maze. Rooms and connectors remain broad enough for companion formations, ranged positioning, retreat and selective pulls.

The normal and Awakening garrisons use 26 guardians staged as 13 two-unit posts. This uses the zero-gold/zero-XP guardian economy to make the facility feel defended without creating a farming incentive. Reinforcements still recover only toward the configured half-population pressure floor.

The trap plan expands to 22 placements. Jets and seals pressure edges, approaches and combat lanes, but traps are never used as mandatory hallway tolls. Regression treats every trap footprint as permanently impassable and still requires a route to both Abyss Dragon and Eren.

## Save migration

Abyss Bastion advances to dungeon layout version 4 while the other main dungeons remain on version 2. Existing saves rebuild the `decor-*` Bastion layer and add only missing guardian slots up to the new authored count. Already-dead guardians remain dead; boss state, captive/rescue facts, rewards and campaign progression are not reset.

## Regression requirements

Automated coverage verifies that:

- all five Bastion functions are present;
- the new functional prop families exist;
- every added Bastion dressing prop remains decorative with zero collision radius;
- the authored multi-mass topology replaces the generic one-partition shape;
- the direct entrance-to-dragon line is obstructed while routed access remains;
- the 26 guardians remain staged in pairs;
- Abyss Dragon and Eren remain reachable even when all trap footprints are treated as blocked;
- hatchery and containment areas contain complementary functional cues;
- the full dungeon-pressure suite remains part of the PR quick gate;
- deterministic roost/hatchery variation and distinct new silhouettes remain renderer-stable.
