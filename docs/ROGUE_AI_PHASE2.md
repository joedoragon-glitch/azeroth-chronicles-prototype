# Phase 2 — Autonomous rogue AI

## Scope
The previously passive rogue regroup foundation is now opt-in **through the enemy AI** when `R.tacticalFoundation.enabled` is true. Tiered burst compression was independently enabled on `main` by PR #147; this rogue-move change preserves those live settings and does not introduce a new compression model.

## Eligibility and intent
- Every engaged monster category, including summoned hostiles, can assess tactical disadvantage. Wounded ordinary, guardian and ringleader monsters skip the normal opening grace and seek support when their HP is strictly below **30%**.
- Enemies **three or more levels above the hero** never engage rogue tactics; enemies below the hero can react to their level disadvantage even while solo.
- Otherwise at least two living opponents must **currently focus that exact enemy**. The hero's current attack order, recent basic combo or recent damage counts, and companions count when their doctrine selects the enemy, not merely because they are nearby. **Living, present companions count as individuals at the hero's level**; recalled or occupied companions are excluded. Recalled or working companions do not count.
- At equal level, summoning bosses/captains require at most one living owned summon and an active summon cooldown. Thornfang, Ashen Warlord, Dark Lord, and Dreadmaw have a narrowly authored independent cunning exception on the same depleted-summon condition. No summon counts or cooldowns were modified.

## Retreat, reinforce, respond
1. Search nearby ally groups up to 750 world units, favoring reachable nearby support; **one lone ally is sufficient**. All non-neutral monsters share the Dark Lord's faction. Ordinary monsters, guardians, ringleaders, bosses, captains and summons can be considered as support without a level-compatibility filter. Allies already traveling/escaping tactically are not selected as stationary destinations.
2. Reassess when the original group remains outnumbered, potentially making **successive bounded retreats**, each with its own 750-unit local awareness and a short cooldown. Movement uses the existing 1.5× burst/navigation and scoped leash exception. **Incoming damage is reduced by 50% during thinking, active withdrawal and tactical escape**, not as a permanent combat-defense stat.
3. Maintain the temporary regroup anchor while the hero follows. When the player follows, nearby compatible allies can join without a fixed reinforcement cap. These monsters may independently seek still more allies if they remain disadvantaged. That chain is a deliberate consequence of the player's continued pursuit, not an error; withdrawal by the player ends the chase.
4. Execute **one** named low-damage rogue disruption per tactical opportunity. Ordinary species retain their own feint/snare/shove/dash. Ringleaders now have two contextual choices: their species-and-role basic maneuver when pressure is limited, and a **species-and-role signature** when wounded, outnumbered, or defending a regroup anchor. No generic Ringleader Ambush remains. Captains and bosses likewise retain their individual basic rogue maneuver and can use an **additional case-specific signature tactic** when locally outnumbered or at a regroup anchor. The two options are a repertoire, **not a forced two-skill combo**: new rogue casts still respect the existing encounter latches and do not modify normal boss rotations. Recent damage determines preferred individual targets when reachable. If no support is reachable, attempt a named response; isolated ordinary enemies without a usable response may escape briefly before disengaging.
5. The original spawn home is never rewritten. Player escape, protected towns, dead ally, blocked route, travel timeout, reset or death clean up tactical state. Chained retreats are permitted while the player keeps pressing the monsters. Each hop independently respects the same awareness radius, local presence, route checks, cooldown and disengagement logic; the system must not create automatic map-wide recruitment without sustained player pressure.


## Dedicated named-move and telegraph audit (phase 2b)

Ordinary species retain their melee rogue maneuver. Ranged variants (including hybrid spitters and throwers) instead use ranged-role tactics such as covering withdrawals and suppression. Ranged guardians use **Guardian Covering Withdrawal**. The role is determined by the real enemy's `ranged` setting, not merely by species name.

All twelve species have distinct **melee and ranged ringleader signatures**, each separate from their appropriate basic maneuver. For instance Wolf uses **Alpha Crossbite** (melee area scatter) or **Alpha Covering Howl** (ranged slow/reposition); Orc uses **Warband Shoulder Drive** (melee frontal sweep) or **Axe Thrower Crossfire** (ranged area bind). The complete registry lives in `R.tacticalFoundation.rogueRingleaderSignatures`.

Captains and bosses also retain their individual **single-target** basic rogue maneuver and gain a situational signature. Their differences are mechanical: a single shove vs frontal sweep, a single snare vs marked **area** bind, or a personal dash vs squad rally, enemy scattering, and repositioning. They never execute both as an automatic combo. The prior normal/TRUE attack rotations and summon caps are unchanged.

| Family | New tactical signature | Rogue response |
| --- | --- | --- |
| Scornfang | Bait-and-Switch | Slow a pursuer and sidestep |
| Direjaw | Silt Curtain | Slow all attackers remaining inside the marked area |
| Crag Tyrant | Paid Screen | Rally guards; if at most one remains, refill up to three local existing guard spawns |
| Dreadmaw | Idol Defiance | Scatter nearby attackers |
| Cinder Warlord | Rearguard Order | Rally ordinary soldiers; if at most one remains, respawn up to three local native soldiers |
| Thornfang | Packbreaker Howl | Force nearby hero/companions to scatter outward for 0.6 s |
| Crypt Guardian | Grave Threshold | Mark and slow multiple pursuers |
| Mirejaw | Sinking Bank | Mark and slow multiple pursuers |
| Drowned Keeper | Floodgate Turn | Slow marked pursuers and reposition |
| Ridge Tyrant | Payroll Screen | Rally guards, refilling established guard posts when two or fewer remain |
| Stone Colossus | Faultline Brace | Wide telegraphed frontal cone knockback |
| Ashen Warlord | Shielded Withdrawal | Rally local ordinary soldiers; if two or fewer remain, refill existing field spawns |
| Abyss Dragon | Wingward Break | Scatter surrounding attackers and reposition |
| Ash Sentinel | Guard Pivot | Slow a marked area and reposition |
| Cindermaw | Broodscreen Roar | Scatter attackers and rally active brood/nearby existing ash-beasts |
| Dark Lord | Crown Decree | Mark and slow pursuers while rallying active Crown defenders |

Guard and ordinary-soldier replenishment uses **existing defeated enemy records at existing spawn points** with a local cap of three. It does not create new monster IDs, alter any boss-owned summons, grant global aggro, or revive completed quest guardians. Field units must be within a 750-unit local search radius; enemy-owned summons never count toward guard or ordinary troop thresholds. The Crag/Cinder *captains* use a one-or-fewer threshold; Ridge/Ashen *bosses* use two-or-fewer.

**Blinding Dust** slows the affected target for 1.65 seconds and makes the casting goblin unavailable for direct targeting for 1.65 seconds. Existing hero attack orders, auto-target locks, companion attack orders, and homing projectiles targeting that goblin are broken immediately. Other enemies may be selected. Area attacks can still damage the goblin; this is not physical invulnerability or a new generic blindness system.

Rogue warnings show the named attack, countdown and marked collision region; blue/cyan cues distinguish basic from signatures, and wrapped labels fit zoomed phone screens. The special warning lasts 1.1–1.8 seconds depending on family and role. Terrain and line of sight apply to hits; leaving the marked hit region avoids a special.

**Skill-caused displacement must never reset a wounded boss/captain encounter.** Thornfang's scatter briefly overrides hero/companion movement and attack input, navigates around solids, then restores control. Short and bounded leash exceptions protect encounters from this forced movement and from a monster's self-repositioning, without permanently extending aggro or preventing genuine player escape. Rogue tactics still respect the original level-eligibility and one-response conditions.

## Non-goals
This phase does not retune the independently enabled soft-knee burst compression, change existing normal/TRUE boss summons, rearrange zones, modify companion damage, or add an alternate boss ability rotation. Pursuit and attack geometry from the separately audited boss-range PR #136 remain intact.

## Validation
Regressions exercise targeting intent rather than party size, +3 enemy-level suppression, equal-level summon/cunning restrictions, single-ally and boss reinforcement, intentional multi-hop chain recruitment, wounded-HP threshold, 50% temporary protection, companion-only pressure, independent eligibility, and cleanup. Dedicated rogue-disruption regressions additionally cover two-choice elite repertoires, the complete captain/boss signature registry, warning geometry, line-of-sight escape, commander restraint and crowd-control limits. Full browser/mobile, asset/format, and campaign regressions gate integration.

The v0.8.110 reconciliation and functional effectiveness findings are recorded in [ROGUE_PR146_INTEGRATION_AUDIT.md](ROGUE_PR146_INTEGRATION_AUDIT.md). The integrated checks preserve the newer burst defense, target locks, ADDS-first doctrine and VFX foundation while verifying the actual warning/resolution bridge and effect outcomes for the complete repertoire.
