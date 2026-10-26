# Greenwood ordinary melee anti-kiting — native Pursuit Burst correction (26 October 2026)

**Implementation:** The Greenwood-only native Pursuit Burst replacement merged in [PR #502](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/502) (commit `4ac1d4a6`), retiring the dash-style Vale Interception from PR #496. On 26 October 2026 the owner selected a **2-second normal-speed recovery** for eligible Greenwood melee, replacing the initial 0.5-second trial. This is an owner-approved focused balance adjustment; do not infer live Pages/PWA publication or physical-device acceptance without an exact deployment receipt. [Issue #504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504) is the cross-chat tracker.

## Authorized gameplay contract

The original 1.5× speed multiplier and 1.2-second duration from `R.balance.pursuit` are unchanged. Ordinary melee Goblins and Skeletons in Greenwood Vale, including genuine melee hybrids and dungeon guardians, now react to repeated hero kiting using this same existing `pursuitBurst` timer and `pursuitBurstReadyAt` field. The burst is ready to renew 3.2 seconds after its start: 1.2 seconds fast movement followed by 2 seconds at ordinary pursuit speed, when the enemy continues to chase. The original seven-second renewal is unchanged outside this Greenwood pilot. There is **no second speed multiplier, new timer, leap, target-predicted landing, ground warning, bonus damage, or Slow**.

Enemies move through the existing `follow()` / `move()` pipeline, respecting solid terrain, normal attack reach, LOS, engagement boundaries, and combat disengagement. This reuse does not change AI target selection, Rogue maneuver selection, other combat cooldowns, ranged attacks, or native melee damage. Its shared speed multiplier and duration are intentionally not increased.

The shorter renewal is scoped to engaged **ordinary** Greenwood Goblin and Skeleton melee variants, including eligible melee guards in Greenwood interiors and true hybrids. Pure ranged creatures, ringleaders, captains, bosses, summons, night invaders, Rogue emergency reinforcements, peaceful/non-engaged creatures, and every other region retain their existing Pursuit Burst behavior. Boss renewal remains 5.5 seconds, and other ordinary enemies remain on seven seconds. The global 90-unit hostile melee basic reach and hybrid AI improvements from PR #496 remain intact.

## Save and integration safety

The original `e.pursuitBurst` and `e.pursuitBurstReadyAt` fields remain the sole owners of the chase boost. An eligible saved active encounter holding the former long readiness is clamped into the new short cadence during pursuit. Old version-4 states containing an in-progress `valeMeleeCounter` telegraph or motion are cleared without resolving the old attack, applying Slow, or interpreting the old dash as a different skill. Old residual `specialCd` can naturally recover; no new save schema is introduced.

## Audit and verification

Focused automated coverage: `tests/vale-melee-anti-kite.test.cjs` and `tests/pursuit-burst.test.cjs`; also evaluate existing Rogue, melee/hybrid, Slow, pursuit, collision, save, and performance regressions. Core assertions include actual native movement distance (26.25 units per 0.1-second frame for a 175-unit/s ordinary enemy at 1.5×), repeated bursts within an engagement, normal-speed recovery, no extra combat effects, old-save cleanup, and exclusions.

**Recovery tuning rationale:** The previously trialed 0.5-second interval would permit a 70.6% maximum boosted-movement duty cycle. The approved 2-second recovery reduces that theoretical maximum to **37.5%** (1.2/3.2) under uninterrupted chase. Collision, visibility, action priorities and frame quantization can delay actual activations. No burst multiplier, burst duration, separate movement system, Slow, or attack effects were added.

**Important balance limit:** 175×1.5 = 262.5 units/s, below untrained hero base movement speeds of 300 (Paladin/Mage) and 320 (Ranger). A long, straight, completely unobstructed retreat can still outrun a lone normal pursuer. This change prevents an excessive cooldown from disabling chase pressure, but it **does not promise guaranteed catches** or replace existing Rogue tactical counters. Balance and fairness still require live Mage/Ranger playtesting. Do not conceal this limitation by silently changing the multiplier.

## Separate under-fire repositioning — source audit, no numerical changes

The existing `enemyUnderFireSidestep` in `src/prototype/combat.js` is a blocked-pursuit escape response, **not** another Pursuit Burst. A real incoming hit provides a four-second temporary attacker-origin alert. After at least 0.6 seconds without movement progress, an otherwise available actor can try a collision-safe local **48-unit** sidestep destination at **125 units/second**, at most once each **1.25 seconds**. The actor must remain aggroed, alive, not returning, and inside its territory; active telegraphs, motion and ranged aiming prevent the sidestep. The step is slower than normal ordinary pursuit at 175 units/s and faster pursuit at 262.5 units/s. **Owner decision (26 October): keep all under-fire reposition values and mechanics unchanged.** Reuse or retuning was *considered only*, not approved or implemented. The separate existing `tests/enemy-distant-damage-response.test.cjs` owns this behavior.

## Explicit rollout boundary

Only eligible Greenwood Goblin/Skeleton ordinary melee, melee guardians and true melee/ranged hybrids receive the shorter recovery. Ringleaders, captains, bosses, pure ranged enemies, other species or regions, summons and night invaders retain their own native behavior. The prospective all-region non-boss/non-captain melee rollout is **not implemented** and requires its own owner approval and test evidence; see [issue #504](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/504). The original PR #496 document is historical and superseded. Validate the owner-approved focused tests and exact build before merging; actual player Mage/Ranger playtesting remains an open acceptance gate.
