# Rogue behavior and tiered survivability — preparation phase

This phase establishes **inactive** infrastructure. No rogue state machine, regroup movement, crowd-control maneuvers, companion AI adjustments, summon changes, or damage compression are enabled. Existing combat must remain behaviorally unchanged.

## Reconciled contract
- Progression target: two companions in Vale, three in Marches, four in Highlands, five in Frontier, five on Crown arrival, six unlocked within Crown. Balance by actual active participants and encounter progression, not assumed six companions.
- Rogue disabled when monster level exceeds hero by **three or more**, even if outnumbered.
- Monster below hero's level: independent level-disadvantage eligibility. Otherwise two or more **actively targeting** opponents, not merely party size, are required.
- At equal level, summoning bosses and captains require at most one owned living summon **and** summon cooldown active to use numerical-pressure rogue behavior. Explicitly authored cunning bosses/captains may later get a low-summon independent trigger; none is assigned here.
- Summon compositions, maximum counts and cooldowns stay unchanged.
- Regrouping searches other nearby packs, initial awareness proposal 750 world units; do not restrict to own pack. Actual routes, safe zones, encounter boundaries, and aggro propagation require phase-two validation.
- After regrouping, apply species-appropriate disruption / displacement targeting current highest threat where appropriate, not universal hard stuns; return to ordinary combat.
- Defensive hierarchy: ordinary, guardian, ringleader, captain, regular boss, TRUE boss. Use **soft-knee burst compression**, not a hard DPS cap and not individual defense attributes. Tier thresholds, time window, handling of exposed openings and skill scaling remain unassigned.
- Pursuit and enemy range changes in draft PR #129 are **not** included in this branch. Reconcile before integration.

## Foundation shipped
- `R.tacticalFoundation` is disabled and identifies thresholds, awareness, tier names and inactive soft-knee policy.
- `tacticalProtectionTier`, `tacticalRegroupCandidates`, `tacticalRogueEligibility` are queries only; no simulation branch calls them.
- `tacticalRecordHit` collects passive hero/companion damage contribution; `tacticalThreatSnapshot` inspects recorded activity. Damage recording is not proof of active targeting and is not an AI threat selector.
- No changed player/enemy attack numbers, healing, movement, aggro, cooldowns or summoning.
- Foundation regression cases cover three-level immunity, equal-level boss gate and extended awareness without aggro.

## Phase-two preconditions
- Make active targeting counts authoritative (hero target intent + per-companion selected target), not hit count.
- Make damage threat telemetry strictly rolling, bounded and reset on death/disengagement/restore as appropriate.
- Validate path accessibility and group preferences for 600–800-unit cross-pack awareness without chain-pull cascades.
- Specify cunning enemy roster and group-compatible rogue move archetypes.
- Benchmark compression by zone and intended party cap, verify high-damage builds retain meaningful payoff.
- Test normal/TRUE boss phases, warning completion, fixed summon caps, walls, towns, leashes, Night and saves.
