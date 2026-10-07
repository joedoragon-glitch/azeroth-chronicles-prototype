# Abyss Bastion procedural depth pass

Abyss Bastion is the Ashen Frontier's main dungeon and should read as more than a generic dragon cave. The occupation has stabilized the surrounding province because reliable roads, supplies and control now serve power. The Bastion therefore reads as a maintained facility built around a dangerous dragon that is simultaneously contained, provisioned and exploited.

This pass is presentation-only. Guardian counts, trap timing and damage, reinforcement rules, Abyss Dragon combat, boss/captive coordinates, rewards and progression remain unchanged.

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

## Save migration

Abyss Bastion advances to dungeon layout version 3 while the other main dungeons remain on version 2. Existing saves remove and rebuild only `decor-*` decorative props in the Bastion. Enemy health/death state, ringleaders, boss state, captive/rescue facts, traps, rewards and campaign progression are not reset.

## Regression requirements

Automated coverage verifies that:

- all five Bastion functions are present;
- the new functional prop families exist;
- every added Bastion prop remains decorative with zero collision radius;
- Abyss Dragon and Eren remain reachable;
- hatchery and containment areas contain complementary functional cues;
- the full dungeon-pressure suite remains part of the PR quick gate;
- deterministic roost/hatchery variation and distinct new silhouettes remain renderer-stable.
