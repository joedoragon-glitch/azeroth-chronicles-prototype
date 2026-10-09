# Regional transport landings and burst-compression implementation (v0.8.105)

## Scope and ownership

This feature is deliberately separate from ordinary-monster fort placement and the concurrent world-proportion and rogue-signature PRs. No fort coordinates, structure scales, authored boss summons, encounter populations, rewards, or player upgrade rules are changed.

## Regional arrival behavior

Travel destinations are resolved to the physical transport object used for that connection, not the major-town center. The legacy Marches–Highlands ferry still uses its authored Reedport and Stonecross dock arrivals. The Vale merchant wagon, Highlands pack caravan and Frontier inbound caravan/dragon landing are stationed on their settlements' rear approaches. Crown's Frontier return platform is still a distinct regional hub vehicle.

The adjacent-region travel and Crown quick-travel systems share the same destination landing mapping. Arrival uses `safe()` before placing the hero and companions; failed paid travel still rolls back its fare and state. Transport NPC IDs and existing travel ticket semantics stay compatible.

A one-time per-zone migration establishes a clearance buffer for ordinary hostile spawn homes around arrival vehicles without changing the number, species, health, rewards, or difficulty of enemies. Entrances, Crown hubs and ferry staging remain intact. The original first-game town start is deliberately unchanged. Continue evaluating placement visually during the separate map/fort audit; these landings are not a mandate to move forts.

## Burst damage compression

The shared `damage()` resolver applies this system to combined hero and companion offense after established target-specific defenses and any temporary rogue retreat modifier. There is **one rolling two-second raw-damage budget per enemy**; skills or individual attackers do not receive independent budgets. Windows reset at death, disengagement, zone travel and player death and are intentionally absent from save files.

Compression is a soft knee, **not a hard cap**. Let `H` be the enemy's maximum HP, `k` the tier knee fraction, `t` the tier tail fraction, and `r` the accumulated raw eligible incoming damage in the window. Define `K=H*k`, `T=H*t`, and:

- `F(r)=r` when `r<=K`
- `F(r)=K+T*ln(1+(r-K)/T)` above `K`

Each hit receives `F(r_before+hit)-F(r_before)`. Thus small/opening strikes remain full strength; additional damage is always positive with progressively smaller marginal gain above the knee. The authored boss exposed-opening state multiplies both knee and tail by 1.6; no boss rotation or opening timer is changed.

| Tier | Knee / max HP | Tail / max HP |
| --- | ---: | ---: |
| Ordinary | 1.35 | 1.75 |
| Guardian | 0.95 | 1.25 |
| Ringleader | 0.70 | 0.95 |
| Captain | 0.50 | 0.75 |
| Normal boss | 0.36 | 0.55 |
| TRUE boss | 0.29 | 0.48 |

The existing rogue thinking/travel/escape damage reduction remains an independent, temporary 50% modifier. Burst compression does not modify enemy attacks, AI eligibility, summon counts, boss ranges, telegraphs, aggro rules, or spell costs.

## Regression audit targets

`tests/transport-arrivals.test.cjs`: every adjacent crossing in both directions, discovered Crown hub returns, transport adjacency, walkable access, path into town, hostile clearance, fares and migrated saves.

`tests/burst-compression.test.cjs`: tier ordering, positive uncapped marginal damage, threshold behavior, window expiry, boss openings, shared production damage resolver, per-enemy cleanup, zone transitions and absence from saves. Existing rogue regressions check independence of tactical decisions from burst activation.

The full CI/device matrix remains the release gate. Tests and runtime behavior should be reviewed again after future map relocation or full animation/sprite passes.

## v0.8.108 — Current stronger compression by inherited enemy roles

After the initial v0.8.105 values shown above, the user requested stronger compression throughout the roster, followed by a **specific redistribution** of the already-strengthened curves. This is the authoritative current balance table, overriding the initial calibration above.

| Enemy tier | Knee fraction of max HP | Logarithmic tail fraction | Source of stronger tuning |
| --- | ---: | ---: | --- |
| Ordinary | 0.675 | 0.875 | Original ordinary curve, both parameters halved |
| Guardian | 0.475 | 0.625 | Original guardian curve, both parameters halved |
| Ringleader | 0.250 | 0.375 | Previously strengthened captain curve |
| Captain | 0.145 | 0.240 | Previously strengthened TRUE-boss curve |
| Normal boss | 0.180 | 0.275 | Previously strengthened normal-boss curve |
| TRUE boss | 0.180 | 0.275 | Exactly the normal-boss curve |

*Captains deliberately have the strongest compression*, even stronger than TRUE bosses. TRUE bosses still differ through HP, summons, phases and attacks; only the burst defense is identical to normal bosses. The two-second rolling window, exposed-opening multiplier (1.6), shared hero/companion damage path, and no-hard-cap rule are unchanged. No companion targeting, boss abilities, encounter counts or world layouts are modified.
