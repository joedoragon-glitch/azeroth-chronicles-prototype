# Greenwood ordinary melee anti-kiting — native Pursuit Burst correction (26 October 2026)

Status: review candidate, replacing the dash-style Vale Interception shipped in PR #496. **Do not interpret this document as a publication receipt.**

## Authorized gameplay contract

The original 1.5× speed multiplier and 1.2-second duration from `R.balance.pursuit` are unchanged. Ordinary melee Goblins and Skeletons in Greenwood Vale, including genuine melee hybrids and dungeon guardians, now react to repeated hero kiting using this same existing `pursuitBurst` timer and `pursuitBurstReadyAt` field. The burst is ready to renew 1.7 seconds after its start: roughly 1.2 seconds fast movement and 0.5 seconds at ordinary pursuit speed. The cooldown was seven seconds before this targeted pilot. There is **no second speed multiplier, new timer, leap, target-predicted landing, ground warning, bonus damage, or Slow**.

Enemies move through the existing `follow()` / `move()` pipeline, respecting solid terrain, normal attack reach, LOS, engagement boundaries, and combat disengagement. This reuse does not change AI target selection, Rogue maneuver selection, other combat cooldowns, ranged attacks, or native melee damage. Its shared speed multiplier and duration are intentionally not increased.

The shorter renewal is scoped to engaged **ordinary** Greenwood Goblin and Skeleton melee variants, including eligible melee guards in Greenwood interiors and true hybrids. Pure ranged creatures, ringleaders, captains, bosses, summons, night invaders, Rogue emergency reinforcements, peaceful/non-engaged creatures, and every other region retain their existing Pursuit Burst behavior. Boss renewal remains 5.5 seconds, and other ordinary enemies remain on seven seconds. The global 90-unit hostile melee basic reach and hybrid AI improvements from PR #496 remain intact.

## Save and integration safety

The original `e.pursuitBurst` and `e.pursuitBurstReadyAt` fields remain the sole owners of the chase boost. An eligible saved active encounter holding the former long readiness is clamped into the new short cadence during pursuit. Old version-4 states containing an in-progress `valeMeleeCounter` telegraph or motion are cleared without resolving the old attack, applying Slow, or interpreting the old dash as a different skill. Old residual `specialCd` can naturally recover; no new save schema is introduced.

## Audit and verification

Focused automated coverage: `tests/vale-melee-anti-kite.test.cjs` and `tests/pursuit-burst.test.cjs`; also evaluate existing Rogue, melee/hybrid, Slow, pursuit, collision, save, and performance regressions. Core assertions include actual native movement distance (26.25 units per 0.1-second frame for a 175-unit/s ordinary enemy at 1.5×), repeated bursts within an engagement, normal-speed recovery, no extra combat effects, old-save cleanup, and exclusions.

**Important balance limit:** 175×1.5 = 262.5 units/s, below untrained hero base movement speeds of 300 (Paladin/Mage) and 320 (Ranger). A long, straight, completely unobstructed retreat can still outrun a lone normal pursuer. This change prevents an excessive cooldown from disabling chase pressure, but it **does not promise guaranteed catches** or replace existing Rogue tactical counters. Balance and fairness still require live Mage/Ranger playtesting. Do not conceal this limitation by silently changing the multiplier.

Review and focused CI are required before merge or deployment. Retain the original PR #496 document as a clearly superseded historical design record. Do not expand the pilot to other enemies during this correction.
