# Regional transport arrivals and tiered burst defense (v0.8.105)

## Scope and preservation
This feature deliberately excludes forts, mini-forts, town structure scaling, sprite replacements, aggro radius and difficulty tuning. Structure-proportion work continues independently in PR #145. The five regions, stable NPC IDs, quests, save keys, transport fares, ticket restrictions and named harbors remain intact.

## Regional arrivals
Adjacent-region travel now resolves a transport-specific destination rather than always passing the town center into `Campaign.enter()`. Each destination transport is looked up from the freshly initialized world, so save/layout migrations and safe-position adjustment cannot leave arrivals targeting stale coordinates.

- Vale: merchant wagon on Millhaven's rear/western approach.
- Marches: incoming wagon on Reedport's western approach; the established Reedport ferry stays at its water/dock site.
- Highlands: preserved Stonecross ferry landing for entry from the Marches, and the relocated pack caravan behind Stonecross for entry from the Frontier or Crown.
- Frontier: inbound caravan behind Emberwatch, with the civilian dragon landing moved to its northern rear approach, separate from the military dragon project at Abyss Bastion.
- Crown: dragon platform northwest of Crownwatch.
- Crown hub trips land beside the corresponding vehicle at the destination rather than in the settlement center.

Overland port coordinates, authored road endpoints and migrated roads are synchronized. Arrival stands are reachable through ordinary navigation, not teleport-only isolated markers. The arrival-safety migration displaces only living hostile non-boss spawn homes near the actual landing, keeping enemy type, number, HP scaling, rewards and original encounter systems unchanged. It does not grant a global arrival invulnerability state.

## Combat burst compression
All valid incoming hero/companion skill, projectile, autoattack and area damage already passes through `combat.damage()`. That shared resolver now invokes `tacticalCompressDamage` **after** the authored boss/captain multipliers and separate rogue movement protection, and **before** applying damage, logging threat or showing a hit number.

Per enemy, a transient rolling two-second window adds the **raw post-multiplier** damage of all sources. Let `x` be the raw total in the window; `H` target maximum HP, `k` tier knee fraction and `t` tier tail fraction:

`F(x) = x` for `x <= kH`, otherwise `F(x) = kH + tH * ln(1 + (x - kH)/(tH))`.

Each new hit receives `F(previousRaw + incomingRaw) - F(previousRaw)`. Marginal damage stays positive at every finite input: **there is no hard damage cap**, and stronger hits always do more damage. Hits below the knee remain fully effective.

| Tier | Knee / max HP | Tail / max HP |
|---|---:|---:|
| Ordinary | 1.35 | 1.75 |
| Guardian | 0.95 | 1.25 |
| Ringleader | 0.70 | 0.95 |
| Captain | 0.50 | 0.75 |
| Boss | 0.36 | 0.55 |
| TRUE boss | 0.29 | 0.48 |

Authored exposed openings (`e.open > 0`) multiply knee and tail by 1.6, rewarding timing without adding a new exposure mechanic. Rolling windows are discarded on death, disengagement and regional travel and are not serialized to saves. Rogue regroup's temporary 50% incoming-damage multiplier remains a separate rule; enemy attacks against the player and companions are not compressed.

## Regression coverage
`tests/transport-arrivals.test.cjs` checks all eight adjacent travel directions, four Crown hub arrivals, walkability, town routes, fare preservation, nearby enemy spawn homes and legacy save migration. `tests/burst-compression.test.cjs` checks all six tier curves, lack of a hard cap, repeated hits, expiration, exposed openings, the production shared damage resolver, disengagement/travel cleanup and save isolation. The prior rogue tests now expect burst compression to be enabled independently of rogue eligibility.

## Release gate
Before a merge/deploy: source formatting, generated-entry checks, full Node regression suite, browser tests on desktop/phone, and WebKit smoke tests must pass. Review combat and landing balance in later playtests; this is the implementation baseline, not a claim of final numerical perfection.
