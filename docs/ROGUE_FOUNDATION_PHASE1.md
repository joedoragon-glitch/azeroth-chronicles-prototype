# Rogue behavior and tiered survivability — preparation phase

This phase establishes passive rogue infrastructure and an **explicitly callable regroup-retreat lifecycle**. No AI decision automatically calls it yet; ordinary enemy behavior, summoning, crowd control, and damage compression remain unchanged until phase two.

## Reconciled contract
- Progression target: two companions in Vale, three in Marches, four in Highlands, five in Frontier, five on Crown arrival, six unlocked within Crown. Balance by actual active participants and encounter progression, not assumed six companions.
- Rogue disabled when monster level exceeds hero by **three or more**, even if outnumbered.
- Monster below hero's level: independent level-disadvantage eligibility. Otherwise two or more **actively targeting** opponents, not merely party size, are required.
- At equal level, summoning bosses and captains require at most one owned living summon **and** summon cooldown active to use numerical-pressure rogue behavior. Explicitly authored cunning bosses/captains may later get a low-summon independent trigger; none is assigned here.
- Summon compositions, maximum counts and cooldowns stay unchanged.
- Regrouping searches other nearby packs, initial awareness proposal 750 world units; do not restrict to own pack. Actual routes, safe zones, encounter boundaries, and aggro propagation require phase-two validation.
- **Rogue-initiated distance is not disengagement.** While an enemy is deliberately traveling to a valid regroup destination, normal origin-based leash checks and no-progress reset must not cancel the maneuver merely because the monster has moved away from its hero target or spawn. This is a scoped rogue-state exception, not a permanent global leash increase.
- After reaching allied group(s), keep combat anchored temporarily at the regrouped encounter so a return to standard AI does not instantly reset the monster; retain its original `home` for eventual respawn/reset. If the hero actually escapes, enters protected settlement space, or combat genuinely ends, normal disengagement must still work. On unreachable destination, invalid route or expired rogue intent, safely fall back rather than remain indefinitely engaged. Never allow chained unbounded retreats.
- After regrouping, apply species-appropriate disruption / displacement targeting current highest threat where appropriate, not universal hard stuns; return to ordinary combat.
- Defensive hierarchy: ordinary, guardian, ringleader, captain, regular boss, TRUE boss. Use **soft-knee burst compression**, not a hard DPS cap and not individual defense attributes. Tier thresholds, time window, handling of exposed openings and skill scaling remain unassigned.
- Pursuit and enemy range changes in draft PR #129 are **not** included in this branch. Reconcile before integration.

## Foundation shipped
- `R.tacticalFoundation` is disabled and identifies thresholds, awareness, tier names and inactive soft-knee policy.
- `tacticalProtectionTier`, `tacticalRegroupCandidates`, `tacticalRegroupGroups` and `tacticalRogueEligibility` are queries only; no simulation branch calls them. Cross-pack group scores reflect numbers and distances, **not pathfinding, pack recruitment or safe routes**.
- `tacticalRecordHit` collects a bounded six-second rolling series of actual hero/companion damage contributions (same-tick hits are combined, with at most 128 time records per attacker and enemy). `tacticalThreatSnapshot` sums live contributions and prunes expired records. This is **not** an active-target count, an AI threat selector, or a persistent save field.
- Threat observations are cleared on enemy death, encounter disengagement and zone transitions. New Campaign instances and save restores have no carryover ledger.
- The boss/captain cunning roster is empty and inactive; no enemies are secretly granted cunning status. Detection remains a query rather than an AI activation.
- `tacticalBeginRogueRegroup(e, ally, activeTargetCount)` explicitly validates eligibility, an eligible cross-pack ally, navigability, route length, and avoidance of protected towns. Future rogue AI may call it, but phase one does not automatically do so.
- Only **during a real, explicitly begun** regroup may the normal original-home leash be replaced by the original-home-to-destination retreat corridor, and then by a temporary encounter anchor at the regrouped location. The monster moves with a short burst using the existing navigation. The original `home` never changes.
- A rogue retreat ends on player escape, safe-town approach, ally loss, blocked/stalled navigation, or timeout. On arrival it holds with allies until the player approaches, or eventually disengages if the player refuses the fight. A per-engagement latch prevents repeated chained retreats.
- Retreat state is transient and discarded on death, disengagement, zone change, and restoration. It is not serialized; regrouping itself does not pull any additional packs.
- No changed player/enemy attack numbers, healing, movement, aggro, cooldowns or summoning.
- Foundation regression cases cover three-level immunity, equal-level boss gate and extended awareness without aggro.

## Phase-two preconditions
- Make active targeting counts authoritative (hero target intent + per-companion selected target), not hit count.
- Validate rolling threat telemetry under sustained high-frequency damage and confirm clear-on-death, disengagement, travel, and new save restoration as the runtime suite evolves.
- Validate path accessibility, territory, safe areas, and group preferences for 600–800-unit cross-pack awareness without chain-pull cascades; the phase-one group summary deliberately never starts aggro.
- Specify cunning boss/captain roster and group-compatible rogue move archetypes; keep the list empty until those specific decisions.
- Benchmark compression by zone and intended party cap, verify high-damage builds retain meaningful payoff.
- Regression cases now cover valid retreat corridors, temporary anchors, player-created escape, protected towns, blocked/stalled routes, no extra aggro, save isolation, and avoidance of unbounded reactivation. Phase-two end-to-end autonomous rogue scenarios remain outstanding.
- Test normal/TRUE boss phases, warning completion, fixed summon caps, walls, towns, leashes, Night and saves.
