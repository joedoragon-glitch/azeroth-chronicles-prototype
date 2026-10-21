# Defender space — dev.129

Owner requested continuation of the earlier issues with focused local verification and package-only publication. Broad GitHub checks are deferred. No running or queued workflows existed when work resumed.

## Contained repairs

- All five main dungeons arrive at `(120,140)` toward the existing receiving-room corner. Exits follow the same point. Existing six-companion staging remains acceptable; no spreading system is added.
- Abyss intake watch moves to `(360,490)` / `(530,490)`. Citadel entrance watch moves to `(330,470)` / `(530,450)`, with the nearby muster archer at `(300,560)`. Same defenders, roles, packs, fort coverage and range; the group waits farther inside its defended approach instead of acquiring the arriving party immediately.
- Lifebinder stands at `(1180,1210)`, behind the existing retreat threshold. Drowned Keeper stands at `(1175,1230)`, deeper behind the records threshold. These positions give more short movement/summon space and preserve the guarded approaches and ranged defense. They replace the shared early-development coordinate.
- Crag Tyrant stands at `(720,430)`, clear of the solid hoard, with all twelve sampled 100-unit body-clear rays. This also retains the existing 700-unit respawn clearance from the receiving point; the earlier `(670,430)` candidate failed that recovery lifecycle requirement. A mounted archer also overlapped the bedroom chest with its actual 23-unit body; its post moves from `(760,770)` to `(750,720)`.
- Mine, Abyss and Citadel boss homes remain authored where focused skill probes support them. A low count of long radial rays alone does not justify removing architecture or moving a boss toward an edge.

Positions live in rules; world owns the versioned in-place migration. Fresh and TRUE dungeon boss creation share the same home selector. Saved IDs, wounds, deaths, progression, player/companion locations and scenery remain. Active casts/movement/returns defer relocation; occupied destinations defer it as well. No stat, warning, cadence, summon-cap or fort-bonus changes.

## Discussion checklist

| Discussed issue | Status |
| --- | --- |
| Rest one of a full party, then hire a companion/pet | Native flow verified; explanatory blockers shipped dev.127. Basic Barracks expansion limits remain. |
| Regional death-loss crowns; captain announcement and separate recovery | Shipped dev.128; roaming Frontier captain drops the cache at its kill point. |
| Respawning captains for future recovery | Shipped dev.128 with native Treasury guard returns. |
| Entrances, boss homes and remaining fort geometry | Contained repairs in this batch; existing fort defenses preserved. |
| Additional Crypt/Archive/Mine fort bonuses | Undecided by owner; not implemented. |
| Unidentified captain cast behavior | Ordinary hits do not generically interrupt. Mage interrupt cancels; Silence pauses. Specific report remains unreproduced; no invented AI fix. |
| Sunrise / possible sunset flashes | Open and explicitly deferred. |

## Verification

Focused `tests/defender-space.test.cjs` passes: five receiving buffers with six companions, native defense retained, normal/TRUE signatures and summons in the three reviewed rooms, real Colossus charge along the existing haulage lane, saved active/occupied/dead migrations and actual pending TRUE creation. Crag resolves three skills in six simulated seconds. `tests/treasury-recovery.test.cjs` passes the existing regional recovery lifecycle after the final Crag placement, including later returns. This caught and corrected the too-near first candidate without changing the respawn rule.

Phone startup, actual touch exit, Keeper’s two channels and Crag’s clear skill preparation pass without JavaScript errors (`tools/visual-review/defender-space-dev129/`). Build/generated syntax and changed-source formatting pass. Existing dev.127 encounter evidence is reused; no full audit, whole-game suite or broad CI runs. Package-only publication and exact live verification pending.
