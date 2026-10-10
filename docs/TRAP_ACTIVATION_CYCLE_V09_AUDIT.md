# Trap activation-cycle design audit — v0.9 transition

**Audit outcome: RETAIN the once-per-trap, per-unit, per-activation contact limit for v0.9.** It is an explicit historical combat contract, not an accidental obsolete guard. This is a risk assessment, not approval of new trap damage or timing. Revisit only through playtest evidence and a separate, class/party/difficulty balance decision.

## Primary evidence and effective clock

- `docs/AUDIT_FIXES_V070.md` explicitly records the original author-facing rule: warned spikes, jets and slowing seals hit a unit **once per pulse**, with alternatives to avoid every trap. Hostile enemies remain trap-immune. This precedes the current v0.8 tuning.
- `docs/PROJECT_HISTORY.md` documents v0.8.12 changes to **shorter cycles, longer active windows, higher regional percent-max-health damage and longer seal slows**. v0.8.13 extends corresponding regional pressure to outdoor mini encounters; neither change supersedes the once-per-pulse contract.
- `engine.js#traps()` derives each trap's phase and activation serial from its zone clock and phase offset: `elapsed = zone.clock + index * offset`, `phase = elapsed % cycleLength`, `cycle = Math.floor(elapsed / cycleLength)`. The world advances `zone.clock` only for the active zone in `Campaign.tick` (bounded to 0.1 seconds per call).
- `engine.js#updateTraps()` checks overlap **throughout the active window**, then writes a per-unit `trapHits[zone:layout:index] = cycle` stamp **before** resolving damage. Thus it is *one contact attempt per unit per trap activation*, not damage once globally across all units and not a single instantaneous hit at the exact opening moment.
- Each target entering late in the same activation can be hit; an already hit target can leave and re-enter the still-active area without another hit. The next cycle re-arms that trap for that unit. If immunity blocks the attempted contact, that activation is still consumed. This is a deterministic mitigation of multi-frame collision rather than a duration-based damage-over-time status.
- The proposed combat-conditions PR additionally ensures a seal's Slow requires a **successful damaging hit**; the existing one-attempt rule is not changed.

## Authored current timing and nominal per-hit pressure

| Trap setting | Full cycle | Warning | Active window | Inactive interval after active | Damage per hit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Side dungeons | 7.20 s | 1.45 s | 0.70 s | 5.05 s | 9% max HP |
| Crypt / Vale outdoor | 6.80 s | 1.40 s | 0.80 s | 4.60 s | 11% max HP |
| Archive / Marches outdoor | 6.40 s | 1.35 s | 0.85 s | 4.20 s | 12% max HP |
| Mine / Highlands outdoor | 6.00 s | 1.30 s | 0.90 s | 3.80 s | 13.5% max HP |
| Abyss / Frontier outdoor | 5.70 s | 1.25 s | 0.95 s | 3.50 s | 15% max HP |
| Citadel / Crown outdoor | 5.40 s | 1.20 s | 1.00 s | 3.20 s | 17% max HP |

The **last column is raw `maxHp * damageFraction`**, not guaranteed final HP loss. `hitParty` applies armor, a minimum damage floor, immunity, current HP and death. All three types share the same regional percentage; **only seals apply Slow**. Active traps affect the hero and living active companions; enemies, guardians and their summons are excluded.

The percentage of nominal maximum HP lost when continuously standing on *one* trap, averaged over full cycles, increases from ~1.25%/s in side dungeons to ~3.15%/s in the Citadel, before mitigation. Multiple different traps can each hit the same hero in one interval, subject to independent cycle stamps.

## Why increasing per-activation hit count is NOT a housekeeping fix

At the existing per-contact values, allowing four hits in a single active window would impose **36% max HP** in a side dungeon or **68% max HP** in the Citadel from just one trap, before mitigation and without counting other enemies or traps. Changing to every simulation frame could be even more destructive and would make damage depend on frame cadence unless an explicit periodic scheduler were introduced. This would also alter the viability of dodging, companion survivability, dungeon safe-route pressure and Normal/Nightmare/TRUE encounters. Those are balance and design changes, not a correctness refactor.

A sustained jet or magical seal *could* someday use authored repeated ticks, but it would need a new per-kind contract: tick interval, lower damage per tick, independent unit registration, immunity during subsequent ticks, overlapping-trap budget, telegraph wording and visual consistency. Spike traps may appropriately remain discrete mechanical strikes. Do **not** globally delete the hit stamp.

## Remaining consistency and usability risks to verify

1. **Terminology:** Old notes call this a `pulse`, but the resolver is a *time-window contact latch*. Testers should not be promised that damage only occurs once at the instant the active phase begins. A late arrival still takes the hit.
2. **Visual implication:** Jets display an animated plume for the whole active window; a player who already took one hit will no longer lose HP while standing in it until the next activation. That is mechanically intentional but can look like broken sustained fire. Review warning/active/recovery feedback before considering damage changes.
3. **Trap key identity:** The hit key uses `zone:layout:index`, not a coordinate, kind, or outdoor mini-site ID. Valid current authored placements are indexed by list position, but imported outdoor trap posts currently validate their numeric index without explicitly asserting uniqueness within a zone. If an old/malformed import contained two different traps with the same index and synchronized cycles, they could share a victim's hit latch. Audit imported saves before deciding on an ID migration; never silently invalidate v4 saves to fix a hypothetical overlap.
4. **Immunity consumed on contact:** An immune unit that overlaps the active trap consumes its per-cycle attempt. If immunity expires *during the same active window*, that same trap does not immediately retry. This is consistent with a blocked discrete attack and should remain specified unless combat design changes.
5. **Temporality:** Zone clocks and hit stamps are persisted, and off-zone simulation does not advance the inactive zone clock. Audit save/reload, travel, layout migrations, pause/resume, and large-frame interruption for phase continuity and no accidental double hit. The 0.1s tick clamp is below the shortest 0.7s active window.
6. **Real-path difficulty:** Authored safe routes treating trap footprints as continuously blocked already exist, but automation does not demonstrate that people on phones can recognize and avoid them with companions during an actual fight.

## v0.9 acceptance

The dedicated `tests/combat-trap-sources.test.cjs` regression covers each of the five dungeon trap timings in Normal and Nightmare with real authored trap geometry and clocks: warnings, late entrant independently hit, no same-cycle repeated hit while stationary or after reentry, next-cycle re-arming, inactive safety and immunity consuming an activation. Existing tests cover all kinds, side/outdoor source catalogs, hero/companion damage, lethal seal cleanup and room routing.

For beta, manually cross an active spike, jet and seal in early and late regions; deliberately enter late; cross an overlapping area, step out/reenter, and try immunity expiring mid-activation. Assess whether the player understands that **one contact per active cycle** is the rule. If frustration or apparent invulnerability is reproducible, file a **trap readability or balance finding** with device, region, mode, class, party, screenshot and current source build. Do not convert the trap system to continuous HP drain without a separately tested and explicitly authorized balance design.
