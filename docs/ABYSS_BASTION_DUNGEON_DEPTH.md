# Abyss Bastion dungeon-depth pass

Abyss Bastion is Ashen Frontier's main dungeon. It is the preparation center for the Dark Lord’s air-superiority project, housing his own purple dragon and personal flying mount. Joel’s 8 October decision supersedes the earlier generic containment interpretation; see `ABYSS_AIR_SUPERIORITY_CANON.md`.

This pass is fully procedural and uses the same data-driven irregular-dungeon architecture/guardian framework already used by the Citadel. It does not introduce sprites.

## Dungeon purpose

The Bastion remains a challenge space. Its pressure comes from staged guardian groups, sight lines, alternate movement lanes, traps that contest space, and the Abyss Dragon encounter. Geometry must never turn the dungeon into a narrow maze or force the player to deliberately walk through a trap.

## Functional footprint

Six overlapping walkable spaces replace the legacy shared rectangle/divider:

- rider preparation;
- flight-training spine;
- hatchery wing;
- feeding/service wing;
- service/maneuver loop;
- dragon aerie.

Four internal partition systems create readable gates and chokepoints while retaining alternate movement room for the hero and companions.

The direct route is no longer visually or tactically equivalent to the other early dungeons, but required destinations remain connected.

## Guardians

Abyss Bastion uses 26 guardians in 13 authored pairs.

Guardians remain zero gold and zero EXP. The increased/authored population exists only to shape encounter rhythm and fortress defense.

Pairs combine Orc melee pressure with Raider Archer ranged pressure across rider preparation, flight training, hatchery, service and royal aerie positions. Reinforcement waves and Awakening guardians reuse the same authored formation through the shared dungeon framework.

The guardian count is not a sacred quota. Future playtesting may change it if the new geometry proves too light or too exhausting.

## Traps

The Bastion uses 18 warned traps.

This is deliberately lower than an earlier 22-trap draft. Regression proved that the denser draft could turn a required bend into a mandatory hazard toll. The corrected plan removes that failure rather than weakening the safety test.

The regression contract treats traps as more dangerous than they really are:

- seal radius is enlarged;
- jet length is enlarged;
- jet half-width is enlarged;
- every resulting hazard footprint is treated as permanently impassable.

Even under that model, both Abyss Dragon and Eren must remain reachable. No required doorway or bend may demand intentional trap contact.

## Lived-in fortress

The old flat mixture of chains, embers, banners and roost icons is organized into five readable dressing districts:

- rider preparation;
- flight training;
- hatchery;
- feeding/service;
- royal aerie/hoard.

Current project dressing includes a flight-planning table, saddle/harness stations, purple royal flight standards and a launch platform still under construction, alongside feed crates, scorched-floor traces, egg cradles, feeding troughs, carcass racks and claw scrapes.

Chains are equipment and logistics, not evidence of an imprisoned dragon. Roosts, hatcheries and bone piles retain their canonical base identity but gain stable deterministic local variation in Frontier/Abyss contexts.

## Save migration

Abyss Bastion advances to dungeon layout version 4.

Existing saves preserve campaign progression and defeated guardian state. Surviving legacy guardians are restaged into the authored formation; only missing guardian slots are added. The hero, active companions, NPCs and surviving enemies are moved only if the new architecture would otherwise place them in solid geometry.

Trap hit keys include the current dungeon layout version so moved traps do not inherit stale per-cycle hit state from the prior layout.

## Protected concurrent work

This pass is based directly on the current main branch that contains the authored Dreadmaw full-party focus-fire/brood-protection changes. Those Dreadmaw mechanics, his Cindermaw combat-mentor relationship, Dark Lord visual-idol identity, Crown Treasury layout, and their regression tests are outside this pass and must remain unchanged.

## Verification

Before merge:

- quick CI includes dungeon-pressure and Awakening-anchor suites;
- 26 Abyss guardians must remain zero reward;
- guardian groups must remain small/staged;
- the 18 enlarged hazard footprints must still leave routes to Abyss Dragon and Eren;
- save migration must not revive a defeated guardian;
- new Bastion props remain zero-collision dressing;
- authored Abyss partitions are visible in the live renderer;
- existing Dreadmaw regression coverage must continue to pass;
- after merge, the full main regression suite, desktop/mobile browser matrix, Pages deployment and published-build smoke check remain authoritative.

## v0.9 stabilization handoff

The irregular Bastion implementation was merged through #102 and the current royal
flight-project interpretation through #114. Older overlapping PRs #92, #97 and
#101 are closed as superseded. There is no outstanding alternate dungeon layout
waiting to be merged for v0.9.

The `handler-intake`, `containment-spine`, `containment-gate` and guardian
formation group IDs are historical **internal geometry identifiers**. They do
not describe captivity in the current story. Leave these internal IDs alone
during stabilization rather than creating unrelated migration risk.

Automated release coverage includes `tests/dungeon-pressure.test.cjs`
(fortress geometry, paired zero-reward defenders, inflated-hazard routes to
the dragon and Eren, legacy v4 migration),
`tests/abyss-flight-project.test.cjs` (royal-flight dressing, preserved
progress, once-only lore) and `tests/abyss-v09-routes.test.cjs`
(round-trip inflated-hazard access to hatchery and feeding/service wings).
The latter two also run in the quick suite.

**Outstanding human acceptance, not a redesign requirement:** play a complete
Bastion rescue/boss progression path with companions; assess guardians, warning
clarity and practical trap avoidance in Normal and Nightmare; inspect
TRUE/Awakening encounters where unlocked; revisit with a historical save and
exercise phone movement/interaction on a real device. Record concrete defects
for narrow fixes without changing the established air-superiority canon.
