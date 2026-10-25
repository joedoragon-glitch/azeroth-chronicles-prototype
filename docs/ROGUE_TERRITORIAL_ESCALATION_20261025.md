# Rogue tactical escalation: territorial refuge and emergency calls

Status: unmerged merge candidate, 2026-10-25.

## Motivation

Two level-three Goblin Ringleaders in Greenwood Vale faced a level-four hero and two companions after local Goblins had been cleared. Repeated Gang Boss Smoke Trick casts by actor IDs #1655 and #1656 exposed the cast-frequency gap and compounded earlier unlimited party Slow debt. The Slow cap was separately fixed in PR #451.

## Contract

- Level 1: original 750-unit local support awareness, route checks, anchored group reasoning.
- Reassess the combined group's numbers and level disadvantage independently from Rogue eligibility.
- Level 2, field only: remember occupied native enemy homes out to 1,800 world units; maximum path length 3,000; the player must remain within 950 units of the retreating actor. Follow valid collision-aware paths and protected-town rules. Allies may coordinate on the same distant refuge. A 65% active extended-retreat damage reduction replaces (does not stack with) normal 50%; keep piercing rules.
- Covering Rogue moves remain independent from locomotion, do not steer the actor back to the player, and must respect a minimum three-second interval between actual Rogue casts regardless of entry path.
- Level 3: Ringleaders with insufficient support and no available retreat can call 2 or 3 ordinary same-species guardian reinforcements (50/50 roll), at most 3 living per owner and with a 16-second replenishment cooldown. In main and side dungeons, exhaust local regroup then call directly instead of leaving the interior. Field encounters call only when both search levels fail.
- Summoned guardians have ordinary stats and guardian role; they earn no XP/crowns, never contribute to kill streaks or spawn another Ringleader, cannot recursively call reinforcements, and are retired when their Ringleader dies/disengages.
- **Clearing a main dungeon:** preserve the original normal-boss-victory condition **and the no-living-guardians condition**. A living emergency guardian counts as a defender and blocks clearance. Defeating its summoning Ringleader dismisses those owned guards, but any surviving unrelated Ringleader or guardian still blocks clearance.
- **Secondary/side dungeons:** these do not have a boss victory condition or an implemented standalone first-clear reward system. Do **not** introduce a new premature clear flag or award; summoned guards remain actual defenders. When secondary-dungeon clear/rewards are developed, all living defenders (native and called) must be accounted for.
- Preserve authored boss/captain mechanics and their separate summons.

## Merge gate

Review automated focused CI and a reproducible build, with tests covering paired Ringleaders, distant occupied posts, defensive movement, cooldown enforcement, both summon outcomes, owner cap and cleanup, boss-victory preservation, live summoned-defender clearance blocking, Ringleader-owner death, side-interior rewards remaining unimplemented, save compatibility, and no progression leakage. Do not launch whole-game/phone/browser CI without owner permission. No merge/deploy as part of PR preparation.
