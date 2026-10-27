# Strict ordinary-melee Pursuit Burst expansion — PR #508 (26 October 2026)

**CURRENT STATUS: UNMERGED REVIEW CANDIDATE — NOT LIVE.** The owner clarified that this enhancement is **ONLY for normal nonsummoned melee enemies and melee Ringleaders**. Earlier drafts discussing Ringleader-called melee reinforcements, other summons, and captain Overtime as eligible are superseded. Track this in [issue #504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504). Encounter territory/reset audit and optional separate fix are in [issue #510](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/510) and [draft PR #514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/514). **Neither PR is merged or authorized for deployment.**

## Exact permitted enemies

**Include** living, engaged, non-neutral, non-returning **ordinary native melee monsters** and **native melee Ringleaders** in every region/dungeon. An ordinary melee guardian remains ordinary if it is neither a summon nor a captain. No species or region restrictions apply.

**Exclude without exceptions**:
- Every `e.summon`, irrespective of summoner: ordinary/Ringleader, captain, boss, missing or unknown owner.
- `rogueEmergencyReinforcement` and synthetic `developerSummon`, even with missing `summon` flags.
- All bosses and captains (field, room or other). No special captain combat changes.
- All enemies under active captain `quotaOvertime > 0` (native 1,300-unit chase, 1.15× move, captain-triggered **four-second active Pursuit Burst**). Normal melee eligibility can resume only after Overtime ends.
- Pure ranged and ranged-capable hybrid combat roles. This strict scope prioritizes the owner's explicitly selected melee-only population; note that earlier Greenwood pilots enabled true hybrids, so this staged PR intentionally does **not** preserve hybrid enhanced recovery. Their actual melee/ranged attacks remain unchanged.
- Idle, dead, neutral, returning, or peaceful actors.

The code intentionally uses a **simple constant-time eligibility check**. No summon owner graph traversal, separate cooldowns, new reset behavior or special-case movement is needed.

## Balance remains exactly the approved native formula

One existing `pursuitBurst` and `pursuitBurstReadyAt`: **1.2 seconds** at **1.5×** native move speed, then **2.0 seconds** of ordinary-speed recovery (nominal **3.2s between starts**, maximum 37.5% theoretical uptime during uninterrupted pursuit). Native ordinary 175 → 262.5 world units/s; melee Ringleader retains native 1.2× movement advantage, 210 → 315 world units/s. No extra dash, Slow, hit, status, warning or guaranteed catch.

Hero target, LOS, melee reach, original `follow` collision/leash, Rogue tactic priority and 12-second blocked-pursuit reset are unchanged. Enemy ranged attacks and enemy basic reach are unchanged. **Under-fire sidestep stays 125 units/s toward a 48-unit local destination, at least 1.25s between attempts.** `R.balance.pursuit.meleeRecoverySeconds = 2` is a renamed balance constant, not a new save key.

## Why summons and captain Overtime are left out

The separate native [reset/territory audit #510](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/510) reproduced that summoned mobs may lawfully chase within **900 units** of home while incoming nonboss damage can be rejected beyond **500**. An active captain Overtime worker can chase within **1,300** while the original incoming damage boundary remains 500. This is an existing reset/damage issue, not caused by changing pursuit recovery. Further increasing chase recurrence for these actors before the owner approves a reset review would compound risk. **Excluding them from PR #508 does not repair that separate defect.** [Draft PR #514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/514) contains an independently tested proposed fairness correction for later review; it is not a prerequisite silently included in this feature PR.

## Release safety and validation

Focused tests: `tests/melee-pursuit-expansion.test.cjs`, `tests/vale-melee-anti-kite.test.cjs`, `tests/hybrid-dual-role-ai.test.cjs`, `tests/pursuit-burst.test.cjs`, save/reset/under-fire and reproducible PWA build. Verify native Ringleader movement, 2s recovery, ordinary melee across regions and exclusions for **ALL** summons, captain Overtime, ranged/hybrid and bosses/captains. Validate no changes to Rogue AI or native reset contract.

**Approval required before merge/deploy.** [PR #508](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/508) is for the agreed limited anti-kiting population. [PR #514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/514) is a separate encounter-damage/reset fairness proposal. Owner may later choose a coordinated batch release; never assume either PR is ready to publish merely because isolated CI passes. The existing shipped Greenwood #502/#506 pilot remains live on main until then.
