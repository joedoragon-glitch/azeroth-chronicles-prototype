# Companion and pet playtest instrumentation — dev.181 (25 October 2026)

## Purpose
An owner playtest in Greenwood Vale produced repeated Goblin Rogue warnings, accumulating Slow and cooldown recovery debt, low issued-draw cadence, and five emergency-performance entries. The original JSON exported full hero status and aggregate `frameProfile.companionAIMs` but lacked per-companion and pet state/history. **This change adds diagnostics only.** It does not tune Rogue cadence, Slow, skills, movement, AI, or emergency thresholds.

## New JSON field
`partyDiagnostics` is exported alongside `hero` and `statistics` from **Save and game management → Export playtest report**.

- `current`: all rostered companions, including benched units, and boss pets with `petFamily`. For each: identity, active flag, health, coordinates, Slow duration/stacks, Rogue Slow duration, effective slow movement factor, current cooldown recovery factor, relevant cooldown timers, order/target/charge/critical/regroup/recall states.
- `samples`: every 0.5 seconds of *completed simulation time*, containing active units only; 120 most recent snapshots (up to about 60 seconds of continuous simulation). Skipped draws do not reduce observation frequency. Paused/menu/background/emergency-held callbacks do not add fake simulation samples.
- `slowApplications`: up to 128 successful party Slow applications with target, resulting cooldowns and stacks, duration and hit-time cooldown debt. For Rogue actions the source enemy ID and maneuver name come from the actual resolved attack, rather than inferred overlapping warnings. Other Slow origins remain labelled `other` with no fabricated source.
- `emergencyTransitions`: up to 16 transitions, each recording the entering/recovered status, callback interval, emergency entry counter, and the entire party state even if the simulation cannot advance.
- `recoveryActions`: up to 12 pre-action snapshots for attempted encounter disengagement and refuge returns.
- `dropped` counts evicted old samples/events to avoid hiding truncation. These buffers exist in a per-Campaign WeakMap and are never persisted in the save format.

## Interpretation
`performance.frameProfile.companionAIMs` still measures **all** of `updateParty()`, including targeting, movement, combat and bookkeeping. It is **not** CPU time per companion/pet and does not establish that being Slowed caused high CPU use. This instrumentation captures correlations between hits, conditions, cooldown behavior, emergency activations and overall party cost; it does not claim per-unit CPU causality or substage profiling. Emergency records capture the last observable state, not the browser's internal reason for a stall.

## Owner reproduction
After receiving the dev.181 game update, open an existing run, approach the Greenwood Vale Goblin area with a Soldier, Archer and/or boss pet, allow the enemy warnings to land, observe recovery/emergency events, then use **Export playtest report**. A single report includes the latest bounded session observations, active and benched roster statuses and the original performance measurements. Keep the game running until export; closing/reloading starts a fresh transient diagnostic session. No new menu setting or opt-in recording is required.

## Validation scope
Focused regression test: `node tests/party-playtest-diagnostics.test.cjs`. It verifies Soldier/pet attribution, cumulative Slow, unchanged campaign snapshot, bounded history, emergency transitions, browser frame integration and paused/menu suppression. Existing Slow/cooldown and emergency tests remain relevant; full-game and browser matrices are explicitly outside this narrow change unless authorized.
