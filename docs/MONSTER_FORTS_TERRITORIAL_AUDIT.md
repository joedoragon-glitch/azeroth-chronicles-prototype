# Territorial Monster Forts — integrated placement audit

## Decision and boundary · 9 October 2026

Monster Forts are **territorial homes**, not conquest or capture encounters. Preserve the `creatureStrongholds` system and existing species identities. Forts signal where ordinary monsters live, feed, train, store possessions, and defend their territory. Clearing residents follows **normal ordinary-enemy death/respawn and XP/crown rules**; no fort ownership, loot multiplier, capture flag, resource/tribute cache, quest gate, guardian, extra captain, or scripted boss is introduced.

This work remains separate from field-boss compounds and their normal/TRUE encounters; Dark Lord Tribute and Barracks resource recovery; player-owned Basic/Full expedition Barracks; mini-dungeon guardians; rogue AI; burst compression; and the ongoing structure scale/150% sprite production audit.

## Authored inventory preserved

| Region | Existing territorial holds |
| --- | --- |
| Greenwood Vale | Goblin roadside fort; unmarked Skeleton watch |
| Flooded Marches | Mire nesting bank; unmarked Reedbeast wallow; night-only Lantern Wraith hold |
| Ironroot Highlands | Wolf packhold at the Wolf hunting ground; Ogre hearth fort |
| Ashen Frontier | Orc road fort; unmarked Raider drill redoubt; night-only Stalker cinder hold |
| Dark Crown | Unmarked Ash-beast roost; Crown field barracks; unmarked Crown toll redoubt |

There are **13** holdings, including **two night-only** sites. The 11 daytime holds continue to reassign the same local ordinary monsters into their existing three- or four-member resident groups. The two night sites use their existing four-creature night spawn/cleanup rules. No enemy species, population, damage, reward, night schedule or rogue eligibility was changed. Sites continue to expose their established world-life furnishings and partial, navigable defensive walls, keeping roads open and avoiding a sealed-off combat arena.

## Actual engine replay: placement problems and corrections

Audit ran the live `Campaign` engine on all five outdoor maps, measuring placement after all world/transport layers had executed.

1. **Ironroot Wolf hunting ground**: before this pass the authored marker and packhold were at `(520, 1250)`, just **184** units from the caravan departure stand `(590, 1420)`. The established landing safety migration quite correctly relocates nearby enemies, but it consequently displaced all four of the fort's wolves roughly **251–303** units from their home center. Moving the named hunting ground to `(340, 1020)` keeps it in the wolf wilderness while retaining the approachable landscape and gives the four wolves their intended approximately **97–106** unit garrison radius. Defensive wall segments increase from **7 to 9** without blocking the road; all seven species furnishings remain. The new landmark is approximately **472** units from the caravan stand, leaving the transport safety buffer intact.
2. **Dark Crown Ash-beast roost**: the old center `(1800, 3300)` fell inside the authored obsidian exclusion centered at `(1850, 3150)` with radius `165`. The site center itself was impassable and paths from the center to its residents failed. The corrected center `(1580, 3260)` keeps the roost in the southern volcanic wilderness, outside that obstruction. All four native residents now remain within a roughly **97–106** unit guard radius around a walkable center, and the fort keeps at least five furnishing elements, five defensive wall pieces and accessible routes.

Other holds already had working garrisons, furnishing/defenses and routes. They are unchanged; extending their populations or placing a second layer of new forts would duplicate completed work.

## Migration and compatibility

`world.js` regenerates creature-stronghold furnishing and guard-home placement only when the regional stronghold version changes. This pass bumps **Highlands v6 → v7** and **Crown v7 → v8**; the other regions retain v6. A named-site reanchor flag moves the already-visited `wolf-den` landmark to the new canonical `R.sites` coordinate before generating the hold. All enemy IDs and existing living/dead states are preserved; an already defeated wolf or Ash-beast remains dead. Existing battle rules, reward fields, quest completions, companions, skill targeting, sound/VFX and v4 save format are untouched. The migration is idempotent.

## Checks

`tests/monster-forts.test.cjs` covers all 13 live holds and routes, exact resident quotas and local guard positions, road-clear wall placements, minimum defensive and habitation features, day/night spawn cleanup, stable enemy IDs/counts, and restore/re-restore of old Highlands/Crown versions, including killed residents. The full Node/browser/WebKit/Pages suite must pass for this change to publish. Visual structure proportions and any later asset scaling remain a separate workstream.

## Frontier redoubt and original dragon departure separation · v0.8.125

Returning the civilian outbound dragon to its original (3100, 500) stand exposed an overlap with the newer Raider drill redoubt at (3060, 640), previously authored while the transport was near town. The Raider redoubt remains in eastern Frontier but moves south to (3050, 950). Its four original residents, normal rewards and territorial fort mechanics are preserved, without new monsters or fort capture rules. Frontier stronghold migration v7 relocates old-save residents without reviving fallen enemies. This keeps the real dragon departure and its safe landing from overlapping ordinary-monster homes.
