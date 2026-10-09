# Phase 2 — Autonomous rogue AI

## Scope
The previously passive rogue regroup foundation is now opt-in **through the enemy AI** when `R.tacticalFoundation.enabled` is true. This phase does **not** enable tiered burst compression; `burstCompression.enabled` remains false.

## Eligibility and intent
- Every engaged monster category, including summoned hostiles, can assess tactical disadvantage. Wounded ordinary, guardian and ringleader monsters skip the normal opening grace and seek support when their HP is strictly below **30%**.
- Enemies **three or more levels above the hero** never engage rogue tactics; enemies below the hero can react to their level disadvantage even while solo.
- Otherwise at least two living opponents must **currently focus that exact enemy**. The hero's current attack order, recent basic combo or recent damage counts, and companions count when their doctrine selects the enemy, not merely because they are nearby. **Living, present companions count as individuals at the hero's level**; recalled or occupied companions are excluded. Recalled or working companions do not count.
- At equal level, summoning bosses/captains require at most one living owned summon and an active summon cooldown. Thornfang, Ashen Warlord, Dark Lord, and Dreadmaw have a narrowly authored independent cunning exception on the same depleted-summon condition. No summon counts or cooldowns were modified.

## Retreat, reinforce, respond
1. Search nearby ally groups up to 750 world units, favoring reachable nearby support; **one lone ally is sufficient**. All non-neutral monsters share the Dark Lord's faction. Ordinary monsters, guardians, ringleaders, bosses, captains and summons can be considered as support without a level-compatibility filter. Allies already traveling/escaping tactically are not selected as stationary destinations.
2. Reassess when the original group remains outnumbered, potentially making **successive bounded retreats**, each with its own 750-unit local awareness and a short cooldown. Movement uses the existing 1.5× burst/navigation and scoped leash exception. **Incoming damage is reduced by 50% during thinking, active withdrawal and tactical escape**, not as a permanent combat-defense stat.
3. Maintain the temporary regroup anchor while the hero follows. When the player follows, nearby compatible allies can join without a fixed reinforcement cap. These monsters may independently seek still more allies if they remain disadvantaged. That chain is a deliberate consequence of the player's continued pursuit, not an error; withdrawal by the player ends the chase.
4. Execute at most **one** named low-damage rogue disruption move. Ordinary species use authored feint/snare/shove/dash profiles; all five captains and eleven boss families have distinct named tactics. Recent damage determines the preferred individual hero/companion target when the target is reachable. Skills are telegraphed, respect cover, and inflict short slow or modest displacement instead of stun-locks. If no support is reachable, attempt a named response. If that cannot begin, use a brief faster tactical escape and periodically recheck for support before normal disengagement. Exact named move design and effects remain reserved for their separate audit.
5. The original spawn home is never rewritten. Player escape, protected towns, dead ally, blocked route, travel timeout, reset or death clean up tactical state. Chained retreats are permitted while the player keeps pressing the monsters. Each hop independently respects the same awareness radius, local presence, route checks, cooldown and disengagement logic; the system must not create automatic map-wide recruitment without sustained player pressure.

## Non-goals
This phase does not implement soft-knee burst compression, change existing normal/TRUE boss summons, rearrange zones, modify companion damage, or add an alternate boss ability rotation. Pursuit and attack geometry from the separately audited boss-range PR #136 remain intact.

## Validation
Regressions exercise targeting intent rather than party size, +3 enemy-level suppression, equal-level summon/cunning restrictions, single-ally and boss reinforcement, intentional multi-hop chain recruitment, wounded-HP threshold, 50% temporary protection, companion-only pressure, independent eligibility, and cleanup. The named rogue disruption moves remain subject to their own dedicated design audit. Full browser/mobile, asset/format, and campaign regressions gate integration.
