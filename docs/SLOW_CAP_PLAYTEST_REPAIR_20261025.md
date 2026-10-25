# Overlapping Slow ceiling and Greenwood Vale playtest follow-up — 25 October 2026

Scope: source-level combat safety correction, preserving existing monster AI, attack geometry, telegraph timing, targeting, protection, emergency recovery, movement factor and save structure.

## Reason for change

The reported goblin-ringleader encounter in Greenwood Vale included repeated Rogue Slow and unexpectedly long hero/party cooldowns. Previously, any successful overlapping Slow added one to `slowStacks` without a ceiling and added a fresh proportional debt to **every eligible still-recovering cooldown**. Even though Rogue's movement multiplier was a fixed 0.4 and mathematical cooldown recovery never reached zero, sustained hits could make cooldown recovery arbitrarily slow and continuously increase outstanding cooldowns.

That is a confirmed rules-level unbounded accumulation mechanism. Whether it directly caused the observed frame stall is **not proven**. The playtest frame profiler identified unusually expensive overall companion updates; these timings do not isolate companion AI steps or show the precise frame stalls.

## New exact rules

- `cooldownBalance.partySlowMaxStacks = 4` for the hero, companions and pets. Hostile targets remain on their existing Slow rules, preserving the Mage’s enemy-control balance. Each successful hit still refreshes the existing maximum-duration window. It does not add a second per-stack timer.
- The first **four** hits against a party member in one uninterrupted Slow window still increase stacks and apply each hit's existing adjusted-duration × hit-time debt fraction to eligible active cooldowns. Hits while already at four stacks add **zero** additional debt and no additional stack strength; damage, movement effects, warning, target eligibility, hit detection and healing remain unchanged.
- Allied cooldown recovery is always at least `0.65/(1+3×0.35) ≈ 0.317` of unimpeded recovery during Slow; enemy cooldown recovery and stacking retain their existing unlimited behavior. The existing Rogue movement factor is still 0.4. Normal Slow duration expires normally unless a subsequent successful hit refreshes it.
- Skills already ready never accrue debt. When Slow expires the stack resets. Cooldown debt already legitimately accrued remains and recovers normally. Existing saved cooldown numbers, even those above the new per-episode ceiling, are **not rewritten**.
- Historical **party** saves containing stack counts above four are interpreted with a four-stack recovery ceiling and their count is normalized on the next successful Slow application. This does not require a save migration.
- Enemy tactical decisions, Rogue action cadence, avoidance, Blinding Dust direct-target exclusion, hostile Slow mechanics, and all companion/pet behavior are unchanged.

## Reporting and verification

The preceding companion/pet playtest reporting update is separately tracked as PR #450 (dev.181). Reports now include a roster with bench status, Slow/cooldown/tactical information, rolling per-unit observations, source-attributed Slow events, emergency transitions and emergency-response attempts.

Relevant focused tests: `tests/slow-cooldown.test.cjs` (bounded hero/companion/pet debt, restored saves, passive/readiness semantics, 100+ impacts, capped recovery), `tests/party-playtest-diagnostics.test.cjs`, `tests/archive-mechanics-audit.test.cjs`. No full-game, browser matrix or benchmark was authorized.

The owner's follow-up device playtest is still needed to establish whether the CPU stalls and emergency entries resolve under sustained goblin pressure.
