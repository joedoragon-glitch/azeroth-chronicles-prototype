# Phase 2 — Autonomous rogue AI

## Scope
The previously passive rogue regroup foundation is now opt-in **through the enemy AI** when `R.tacticalFoundation.enabled` is true. This phase does **not** enable tiered burst compression; `burstCompression.enabled` remains false.

## Eligibility and intent
- Every hostile nonsummoned monster class (ordinary, guardian, ringleader, captain, boss and TRUE boss) can be eligible once it is engaged, after a short start-of-fight grace.
- Enemies **three or more levels above the hero** never engage rogue tactics; enemies below the hero can react to their level disadvantage even while solo.
- Otherwise at least two living opponents must **currently focus that exact enemy**. The hero's explicit target or very recent attack counts, and companions count only when their doctrine selects that enemy, not merely because they are nearby or enrolled in the party. Recalled or working companions do not count.
- At equal level, summoning bosses/captains require at most one living owned summon and an active summon cooldown. Thornfang, Ashen Warlord, Dark Lord, and Dreadmaw have a narrowly authored independent cunning exception on the same depleted-summon condition. No summon counts or cooldowns were modified.

## Retreat, reinforce, respond
1. Search nearby ally groups up to 750 world units, favoring reachable nearby support; **one lone ally is sufficient**. Bosses and captains are not accidentally pulled into ordinary packs as regroup allies.
2. Retreat once per engagement using a 1.5× movement burst and the existing route navigation, with the scoped reset/leash exception and **50% incoming damage reduction only during active travel**.
3. Maintain the temporary regroup anchor while the hero follows. When the player gets near, recruit at most two nearby nonsummoned allies without propagating to all their distant pack members.
4. Execute at most **one** named low-damage rogue disruption move. Ordinary species use authored feint/snare/shove/dash profiles; all five captains and eleven boss families have distinct named tactics. Recent damage determines the preferred individual hero/companion target when the target is reachable. Skills are telegraphed, respect cover, and inflict short slow or modest displacement instead of stun-locks. If no suitable ally is accessible, use a direct counterattack rather than an endless retreat.
5. The original spawn home is never rewritten. Player escape, protected towns, dead ally, blocked route, travel timeout, reset or death clean up tactical state. There is no indefinite chain of retreats or map-wide pack recruitment.

## Non-goals
This phase does not implement soft-knee burst compression, change existing normal/TRUE boss summons, rearrange zones, modify companion damage, or add an alternate boss ability rotation. Pursuit and attack geometry from the separately audited boss-range PR #136 remain intact.

## Validation
Regressions exercise targeting intent rather than party size, +3 enemy-level suppression, equal-level summon/cunning restrictions, one-ally retreat, local recruitment without pack chaining, unique low-damage moves, and cleanup. Full browser/mobile, asset/format, and campaign regressions gate integration.
