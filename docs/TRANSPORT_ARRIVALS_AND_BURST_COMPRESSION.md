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

## v0.8.107 — Doubled burst-compression intensity

At Joel's request, strengthen **all six** tiers relative to the initial v0.8.105 calibration. This doubles the curve's sensitivity by halving **both** the soft-knee threshold and its logarithmic tail parameter; it does **not** simply multiply a flat percentage damage reduction by two. No other combat mechanics are retuned in this change.

| Tier | New knee / max HP | New tail / max HP | Before: effective damage from raw 5,000 vs 5,000 HP | After |
| --- | ---: | ---: | ---: | ---: |
| Ordinary | 0.675 | 0.875 | 5,000 | 4,757 |
| Guardian | 0.475 | 0.625 | 4,995 | 4,281 |
| Ringleader | 0.350 | 0.475 | 4,804 | 3,798 |
| Captain | 0.250 | 0.375 | 4,416 | 3,310 |
| Normal boss | 0.180 | 0.275 | 3,922 | 2,800 |
| TRUE boss | 0.145 | 0.240 | 3,629 | 2,546 |

These are curve comparisons, not assertions that a monster can survive damage beyond its remaining HP. Unlike the initial 135%-HP knee, the ordinary-monster knee now lies below maximum HP, so compression can matter before a nominally lethal burst. The rolling window remains **two seconds**; there is still no fixed cap, attacker-specific budget, cooldown, additional rogue resistance or change to exposed boss opening behavior. Retain the original v0.8.105 table above as historical context.

## v0.8.108 — Current tier reassignment (supersedes the six-tier v0.8.107 table above)

The previous stronger calibration remains the historical source for these inherited settings; the latest decision **moves** its values between roles rather than applying another global compression increase. Only the following are reassigned: ringleaders inherit the former captain values, captains inherit the former TRUE-boss values, and TRUE bosses use exactly the normal-boss values. Normal bosses, guardians, and ordinary monsters are unchanged relative to the prior stronger baseline.

| Current tier | Knee as max-HP fraction | Tail as max-HP fraction | Previous stronger baseline source |
| --- | ---: | ---: | --- |
| Ordinary | 0.675 | 0.875 | Unchanged |
| Guardian | 0.475 | 0.625 | Unchanged |
| Ringleader | 0.250 | 0.375 | Former captain |
| Captain | 0.145 | 0.240 | Former TRUE boss |
| Normal boss | 0.180 | 0.275 | Unchanged |
| TRUE boss | 0.180 | 0.275 | Normal boss |

Intentional consequence: captains now have stronger burst compression than either normal or TRUE bosses. That is **not** an accidental reversal in the ranking. Boss and TRUE-boss compression are exactly equal, but other fight mechanics (HP, attacks, summons and phase behavior) remain distinct. The two-second window, no-hard-cap property and opening bonus remain unchanged. Do not interpret the historical tables above as current tuning.
