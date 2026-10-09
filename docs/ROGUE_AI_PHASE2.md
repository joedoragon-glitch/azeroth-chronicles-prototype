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
4. Execute **one** named low-damage rogue disruption per tactical opportunity. Ordinary species retain their own feint/snare/shove/dash. Ringleaders now have two contextual choices: their ordinary species technique when the pressure is limited, and **Ringleader Ambush** when wounded, outnumbered, or defending a regroup anchor. Captains and bosses likewise retain their individual basic rogue maneuver and can use an **additional case-specific signature tactic** when locally outnumbered or at a regroup anchor. The two options are a repertoire, **not a forced two-skill combo**: new rogue casts still respect the existing encounter latches and do not modify normal boss rotations. Recent damage determines preferred individual targets when reachable. If no support is reachable, attempt a named response; isolated ordinary enemies without a usable response may escape briefly before disengaging.
5. The original spawn home is never rewritten. Player escape, protected towns, dead ally, blocked route, travel timeout, reset or death clean up tactical state. Chained retreats are permitted while the player keeps pressing the monsters. Each hop independently respects the same awareness radius, local presence, route checks, cooldown and disengagement logic; the system must not create automatic map-wide recruitment without sustained player pressure.


## Dedicated named-move and telegraph audit (phase 2b)

A tactical skill always follows the existing eligibility, threat, retreat, support and immunity rules; it **never** grants an additional independent trigger. The second move is a situational alternative, not something that fires on every engagement. Ordinary species remain unchanged. The five captains and eleven boss families have these signature choices in addition to their prior named basic maneuvers:

| Family | New tactical signature | Response under pressure |
| --- | --- | --- |
| Scornfang | Bait-and-Switch | Mark a pursuer and withdraw diagonally, slowing anyone who stays in the warning |
| Direjaw | Silt Curtain | Foul the marked pursuit area with a temporary slow |
| Crag Tyrant | Paid Screen | Rally already fighting guards and slow a pursuer to buy space |
| Dreadmaw | Idol Defiance | Scatter close attackers around the captain's position |
| Cinder Warlord | Rearguard Order | Accelerate already engaged defenders and delay pursuers |
| Thornfang | Packbreaker Howl | Scatter a surrounding party, opening a path back toward the pack |
| Crypt Guardian | Grave Threshold | Snare the pursuit lane with a bone-themed marked circle |
| Mirejaw | Sinking Bank | Slow a crowded pursuing group in mud |
| Drowned Keeper | Floodgate Turn | Delay pursuers at a mark and retreat diagonally |
| Ridge Tyrant | Payroll Screen | Signal already engaged retainers to screen a withdrawal |
| Stone Colossus | Faultline Brace | Telegraph a broad **frontal cone** of knockback |
| Ashen Warlord | Shielded Withdrawal | Order already fighting troops to screen a retreat |
| Abyss Dragon | Wingward Break | Push back surrounding attackers and wing-step away |
| Ash Sentinel | Guard Pivot | Delay pursuit with an announced defensive pivot |
| Cindermaw | Broodscreen Roar | Push back close attackers and spur only already engaged brood |
| Dark Lord | Crown Decree | Mark and delay a pursuing group while commanding active guards |

The signature attack shapes are world-coordinate hit shapes. Close-range scatter/cone signatures require a reachable opponent actually within the marked reach; otherwise the monster chooses its basic interruption instead of wasting a theatrical empty swing. **Circle and cone warnings correspond to the actual hit area**; stepping clear or using solid cover avoids the effect. Basic disruptions have longer warnings than their old 0.65-second cue, and signatures warn for **1.15–1.8 seconds**. Rogue cues use blue/cyan outlines distinct from ordinary attacks, show the complete move name in phone-friendly wrapped text, and include a countdown and basic-versus-signature label. Disruption applies modest damage and short slows or navigable shoves; there is no stun-lock. Rally affects **only already engaged nearby allies**; it neither recruits idle packs nor changes summon caps. The existing one-response guard and three-level immunity remain in force.

## Non-goals
This phase does not implement soft-knee burst compression, change existing normal/TRUE boss summons, rearrange zones, modify companion damage, or add an alternate boss ability rotation. Pursuit and attack geometry from the separately audited boss-range PR #136 remain intact.

## Validation
Regressions exercise targeting intent rather than party size, +3 enemy-level suppression, equal-level summon/cunning restrictions, single-ally and boss reinforcement, intentional multi-hop chain recruitment, wounded-HP threshold, 50% temporary protection, companion-only pressure, independent eligibility, and cleanup. Dedicated rogue-disruption regressions additionally cover two-choice elite repertoires, the complete captain/boss signature registry, warning geometry, line-of-sight escape, commander restraint and crowd-control limits. Full browser/mobile, asset/format, and campaign regressions gate integration.
