# Resource gathering against the flow standard — dev.129

Audit requested after the owner confirmed the balance standard: challenge should reward game knowledge and execution, with clear rules, recoverable setbacks and purposeful preparation. Repeated chores and unexplained waiting need justification. Runtime remains published dev.129 / PR #365; no gathering repair, balance change, version bump, deployment, GitHub CI or review round is included in this audit.

## Current behavior

- Gathering is recovery of **finite Dark Lord Tribute**, directly converted into crowns. It is not a recurring wood/ore crafting supply. Each of the five fresh regions has four authored sources totaling **640 crowns**, two visible and two hidden. Scouting reveals one hidden source per action. These sources do not replenish during ordinary updates.
- Unlock: rescue Mira, then train Expedition from rank 1 to 2. That Expedition advancement is free. The hero does not harvest; active, living, idle Soldiers and Rangers do. Pets and reserves cannot work. A pet-only party must field a troop to use this optional income route.
- A single gather command assigns **every available idle troop**, with no worker-count or escort reservation choice. There is no separate paid harvesting tool or recurring dispatch fee. Completed Basic Barracks expose the operation; a Full upgrade is not required to gather.
- Troops walk to the site, harvest at **12 crowns per troop per simulation second**, then switch to delivery at **35 carried** or exhaustion. A frame can take the load slightly over 35. The actual wallet payout is the integer portion of the cargo; the fractional remainder stays on that troop.
- Delivery chooses a reachable, unthreatened town/hamlet refuge or completed **Full** Barracks. A Basic Barracks is not a drop-off. Every delivery physically retraces the recorded route before harvesting again or choosing another known source in the regional group. Exact cargo/trail intent survives ordinary saves.
- Initial dispatch can cross enemy awareness under escort. Troops use survival judgment and local self-defense; delivery, return and automatic continuation are cautious. New danger can prevent further travel. Recall cancels work and retains cargo. Zone travel also clears active work orders while retaining cargo. There is no offscreen labor continuation across zone travel.
- Other income exists: combat, quests, supply recovery and now regional death-loss recovery. Tribute is optional. Full Barracks placement can shorten delivery distance; the upgrade costs 100 crowns. Barracks recruits cost 60/85, treatment 30 and fallen recovery 40. Finite tribute is useful support, not proof all progression costs are comfortably covered.

## Findings and repair priority

| Priority | Confirmed finding | Effect on the standard | Proposed repair; not implemented |
| --- | --- | --- | --- |
| First | **A recorded Crown return route can loop even after all enemies are removed.** At ~26.05s in the 50ms fixture, the segment from `(1275.1703,2257.7569)` to `(1288.3574,2280.1644)` is clear at the Soldier's actual radius **14**, but return validation uses default clearance **15** and rejects it. Both endpoints are clear. The 100ms timing fixture paid once, then remained on return through 600 simulated seconds with 184 crowns still at the source. | A movement consistency defect produces waiting with no player skill solution. It does not require harder enemies or more resource value. | Validate recorded return movement consistently with the actual carrier's body and preserve safe reverse intent. Recheck real walls and new danger; do not teleport or disable collision. |
| First | **Cargo can be stranded after Recall or travel.** A recalled troop at the refuge retains 35 crowns with no order. With sources exhausted, dispatch is rejected and a further update does not pay. Save/reload preserves the cargo and missing order. Travel likewise retains 12 carried crowns but clears its deposit order. | The player has already earned the resource but must discover a workaround involving another nonempty source. The money is retained in state, not erased; there is no clear direct unload action. | Provide safe manual/automatic unloading at an eligible refuge/Full Barracks even when no harvestable source remains; keep Recall and travel under player control. |
| First | **Unsafe drop-off waiting is silent.** In a controlled twenty-second case where all available drop-offs are threatened, the troop retains 35 crowns and a deposit order, pays nothing and emits no notice. A separate generic cautious-route failure can be described as terrain blockage even when hostile avoidance caused it. | Retaining cargo and avoiding danger are sound; unexplained pauses and inaccurate reasons are avoidable friction. | Show a concise work state/reason: delivering, returning, waiting for danger to clear, or terrain blocked. Identify a useful response, with restrained notices rather than repeated popups. |
| Next | **One command assigns all idle troops.** Native three-troop dispatch assigned all three; the only assignment surface calls the same all-idle function. | Keeping an escort becomes an awkward roster/order workaround. This matters when companions supply much of the early combat engagement. | Offer a worker count or individual selection, with the assignment count explicit before dispatch. Preserve a deliberate “all idle troops” option. |
| Next | **Small loads create repeated travel; an exhausted site is retraced before reassignment/ending.** Sample completed sites required 5–7 payouts per troop. The mechanic works near the orchard but travel dominates some longer cleared routes. | Logistics and defended transport can create choices; repeating an already-safe journey can become passive waiting. Do not assume every source is slow or force the player to watch it. | Repair correctness first, then consider modest carrying progression, useful drop-off placement and skipping an unnecessary return to an exhausted source. Preserve physical delivery and deliberate escort risk. |
| Small | **Fractional cargo leaves a payout tail.** Two troops completed the 170-crown orchard source but paid only 169; ~0.6 and ~0.4 remained separately in their cargo after both orders ended. Reproduced at both 100ms and 50ms. | A small accounting/access friction, especially combined with no direct unload. This is not a claim of large currency loss. | Reconcile fractional harvest/cargo safely so completed finite sources do not leave an inaccessible whole crown split across troops. Avoid rounding each troop upward and creating money. |

## Focused route timing

These are **controlled cleared-route simulations**, not a live player-speed or danger benchmark. Authored terrain, scenery, sources and normal navigation remain; enemies are removed to isolate logistics. One native first-visible source per region is retained so completion and final return can be measured independently. No Full Barracks is added. Deterministic random source 0.73, 100ms simulation steps. Harvest seconds count ticks in which the source decreases; remaining time includes dispatch, walking, unloading and return.

| Region / sample | Troops | Source | Paid | Payout events | First payout | Last payout | Work order ends |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Greenwood / orchard | 1 | 170 | 170 | 5 | 7.4s | 19.4s | 19.5s |
| Flooded Marches / wagon | 1 | 200 | 200 | 6 | 8.8s | 49.2s | 51.9s |
| Highlands / ore | 1 | 220 | 220 | 7 | 9.6s | 61.7s | 64.8s |
| Frontier / convoy | 1 | 220 | 220 | 7 | 5.4s | 31.9s | 32.9s |
| Crown / siege | 1 | 220 | 36 | 1 | 24.7s | 24.7s | Still returning at 600s |
| Greenwood / orchard | 2 | 170 | 169 | 5 | 7.4s | 12.2s | 12.3s |

One troop needs about 14.2s actually harvesting the orchard source and 18.4s harvesting the ore source. This supports targeted pacing improvements rather than a blanket gathering-speed buff. The Crown sample is a correctness defect and must not be treated as intended gathering duration. Two-troop payout events can combine simultaneous individual deposits.

## What already supports flow

Finite sources, automatic harvesting/unloading/continuation, free Expedition unlock training, usable Basic Barracks, saved work intent and retained cargo are useful foundations. No repeated click per harvested unit is required. Threat-aware deposits, actual reverse routes and survival behavior are valuable when their state is readable and movement is consistent. The owner can continue testing all published dev.126–129 changes now.

The preferred repair order is: fix return consistency and accessible unloading, explain waiting, add assignment control, then tune carrying/travel only where measured delay justifies it. No new global fort protection, gathering combat buff, resource respawn, infinite income or mandatory pet labor follows from this audit.

## Evidence and limits

- `tools/visual-review/resource-flow-audit-dev129/audit.cjs` / `result.json`: region/source census, six cleared-route timing cases, all-troop assignment, Recall/exhausted-source cargo, reload, travel cancellation and silent unsafe deposit. `fractionalCompletion50ms` records a separate corroborating 50ms probe of the same native orchard fixture.
- `crown-return.cjs` / `crown-return.json`: shorter 50ms corroboration identifying the first rejected reverse segment, actual radius and unchanged notices.
- Current source: `engine.js` gather/scout/travel, `party.js` labor assignment/delivery/Recall, `navigation.js` route/clearance/reasons, `world.js` finite tribute, `save.js` cargo/trails, `menus.js` labor controls, `rewards.js` payout rounding and `economy.js` current prices.
- Completed dev.123/126 gathering-order/delivery evidence is reused. No full-game tests, native browser matrix, GitHub checks, deployment or gameplay changes were run for this audit. The new probes isolate concrete flow issues; they do not certify live escort survival, all nodes/seeds/modes, accessibility, actual phone FPS or ideal campaign income. Remaining regional income sufficiency is an open tuning question, not established grind necessity.
