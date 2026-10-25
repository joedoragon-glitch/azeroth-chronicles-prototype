# Rogue tactical escalation: territorial refuge and emergency calls

Status: PR #453 merged and published on 2026-10-25 (merge `968f3493a48e1bcaf17ce6f70f9790ff9b8ed8be`); two-second cadence adjustment proposed separately.

## Motivation

Two level-three Goblin Ringleaders in Greenwood Vale faced a level-four hero and two companions after local Goblins had been cleared. Repeated Gang Boss Smoke Trick casts by actor IDs #1655 and #1656 exposed the cast-frequency gap and compounded earlier unlimited party Slow debt. The Slow cap was separately fixed in PR #451.

## Contract

- Level 1: original 750-unit local support awareness, route checks, anchored group reasoning.
- Reassess the combined group's numbers and level disadvantage independently from Rogue eligibility.
- Level 2, field only: remember occupied native enemy homes out to 1,800 world units; maximum path length 3,000; the player must remain within 950 units of the retreating actor. Follow valid collision-aware paths and protected-town rules. Allies may coordinate on the same distant refuge. A 65% active extended-retreat damage reduction replaces (does not stack with) normal 50%; keep piercing rules.
- Covering Rogue moves remain independent from locomotion, do not steer the actor back to the player, and in the original PR #453 implementation respected a minimum three-second interval between actual Rogue casts regardless of entry path.
- Level 3: Ringleaders with insufficient support and no available retreat can call 2 or 3 ordinary same-species guardian reinforcements (50/50 roll), at most 3 living per owner and with a 16-second replenishment cooldown. In main and side dungeons, exhaust local regroup then call directly instead of leaving the interior. Field encounters call only when both search levels fail.
- Summoned guardians have ordinary stats and guardian role; they earn no XP/crowns, never contribute to kill streaks or spawn another Ringleader, cannot recursively call reinforcements, and are retired when their Ringleader dies/disengages.
- **Clearing a main dungeon:** preserve the original normal-boss-victory condition **and the no-living-guardians condition**. A living emergency guardian counts as a defender and blocks clearance. Defeating its summoning Ringleader dismisses those owned guards, but any surviving unrelated Ringleader or guardian still blocks clearance.
- **Secondary/side dungeons:** these do not have a boss victory condition or an implemented standalone first-clear reward system. Do **not** introduce a new premature clear flag or award; summoned guards remain actual defenders. When secondary-dungeon clear/rewards are developed, all living defenders (native and called) must be accounted for.
- Preserve authored boss/captain mechanics and their separate summons.

## Merge gate

Review automated focused CI and a reproducible build, with tests covering paired Ringleaders, distant occupied posts, defensive movement, cooldown enforcement, both summon outcomes, owner cap and cleanup, boss-victory preservation, live summoned-defender clearance blocking, Ringleader-owner death, side-interior rewards remaining unimplemented, save compatibility, and no progression leakage. Do not launch whole-game/phone/browser CI without owner permission. No merge/deploy as part of PR preparation.

## Follow-up balance decision — 25 October 2026

The director clarified that the October 20 PR #330 reduction from 6 to 3 seconds, including removal of the isolated-monster once-per-encounter veto, was intentional: isolated monsters should get repeated useful chances at Rogue moves. The uniform three-second cast-floor introduced by #453 stopped the unintended sub-three-second path-bypass, but the director requested a **two-second** safeguard as a more conservative restriction.

**Implementation for the follow-up PR:** use `tacticalFoundation.moveCooldownSeconds = 2` for **both** the Rogue decision/reuse clock and the actual cast-to-cast minimum; reducing only the latter would not improve real frequency because the existing decision timer would remain three seconds. Preserve the same eligibility, no unfinished telegraph/motion/aim, legal range/line of sight, warnings, role-specific move identities, Slow strength/duration and party four-stack Slow cap, defensive retreat and reinforcement budgets. The minimum is measured from successful cast initiation, not between hit events; actual casts can be slower when waiting for warnings, decisions, travel or legal targets.

**Tradeoff:** Goblin Ringleader Gang Boss Smoke Trick retains the authored 1.1-second warning and 2.7-second Slow base (+0.25 shared bonus = 2.95 seconds). Two-second reuse makes overlapping Slow possible on repeated successful hits; that is part of Rogue defensive pressure, not permission for unlimited stacking. PR #451's independent party Slow stack/debt cap remains unchanged. Focused regression coverage must establish two-second positive and pre-two-second negative boundaries, genuinely isolated actor repeatability, night/boss roles, Slow/save compatibility and reproducible PWA build. The historical PR #330 choice remains documented, not silently overwritten.

### Director clarification: withdrawal is the objective, casting is cover

An isolated ordinary monster is **not** supposed to stand still repeating its Rogue trick. Tactical choices first check reachable local allies, then occupied regional posts, then (for Ringleaders) emergency reinforcements. A defender with no viable support must enter a finite **escape** state even if it can cast a Rogue maneuver. Legal two-second Rogue casts can cover the moving retreat, but their cast warning must not steer the monster back toward its pursuer or replace its withdrawal. While escaping, the monster periodically rechecks local support and distant posts; the existing distance, timeout, stuck and disengagement limits remain active. Field bosses and captains may also move to occupied ordinary monster posts when overwhelmed, but may not abandon their territorial defense. A static captive guardian whose reinforcement options are exhausted moves toward its actual captive specialist for a final stand, not a stationary Smoke Trick loop. Roaming bosses remain tied to the scene where their patrol was intercepted and their existing mobile captive follows them. Dungeon bosses remain restricted to their rooms. This is the explicit owner-directed behavior being certified, not permission to have solo monsters farm Slow effects in place.


### Existing captive systems verified before extending elite tactics

This PR **reuses**, rather than rebuilds, the following already-shipped contracts:
- `src/prototype/navigation.js`: the same Mira NPC follows the real Thornfang during patrol, combat and return; the captive is not a party member or attack target.
- `src/prototype/cindermaw-combat.js`: Vera follows Cindermaw's real movement during combat/inspection using the existing collision-aware follow path. Existing repair/escort responsibilities, player non-targetability and release gates are unchanged.
- `src/prototype/boss-combat.js`: native field boss recovery transports the same captive/escorts with the original encounter without spawning a duplicate or completing the rescue.
- `src/prototype/engine.js`: boss defeat and specialist rescue remain separate, including the captive's real waiting position after a roaming boss is defeated.
- Existing `tests/snapshot-thorn-patrol.test.cjs`, `tests/snapshot-vera-inspection.test.cjs`, `tests/roaming-boss-interception.test.cjs` and `tests/field-onboarding.test.cjs` already lock these contracts.

The narrow addition is decision authority under pressure: elite field defenders may rally ordinary native monsters inside a bounded area centered on their actual defensive post (a patrol interception point for a roaming boss), and captive guardians with no help may physically return to the extant static cage position. Existing NPC movement, damage immunity, save/respawn semantics, boss mechanics and quest release scripts must not be replaced. The 2-second Rogue ability opportunity is a covering option, not a standing combat loop or a substitute for the captive-defense goal.


### TRUE field boss circuit — director clarification

A living TRUE-form **field** boss that is not fighting visits the existing regional landmarks in a repeating outdoor circuit: **secondary dungeon entrance → Treasury entrance (if this region has one) → main dungeon entrance → original field boss spawn/compound**. The Frontier has no authored boss Treasury entrance, so that stage is skipped. It is an actual collision-aware walking route; no dungeon-instance transfers, invented entrances, instant travel or new captive instances. Normal-form field boss routes and all original captive-follow and rescue systems stay in place.

TRUE bosses are **eager hunters, not tour guides**. Hero detection uses a somewhat longer (380-unit minimum) legal acquisition radius, always subject to real line-of-sight and protected-settlement safety. Nearby hero awareness immediately suspends travel, active aggro overrides the circuit entirely, and each encounter gets an interception anchor so a fight away from the original compound does not instantly reset. After legitimate disengagement, the boss resumes the same waypoint stage; it is not teleported to the original compound. Route choice is independent of defensive Rogue and reinforcement decisions during live combat.
