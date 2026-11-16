# Post-menu follow-up: Map routing and waypoint reliability

## 16 November 2026 — owner-directed Thornfang waypoint and restrained guide refresh (draft)

Owner observation (no need for a redundant reproduction): the Millhaven **Western road observer** provided a dynamic patrol-leg lead; the player encountered and fought Thornfang before physically arriving at the earlier snapshot destination, but the informant waypoint persisted. This is an unnecessary navigation-guide lifetime and may contribute to unrelated gameplay work. It is **not proof** of the root cause of Report (40)'s unaccounted 200–260-ms stalls.

This candidate marks **only** that informant's manually chosen route with a runtime-only `thorn-witness` purpose. Finding the living Thornfang within 220 world units, entering his actual engagement, or defeating him clears the stale guide immediately during the ordinary frame update; if the hero is *still autonomously following that precise order*, cancel that order and route. Preserve all other map/quest guides, companion assignments, Thorn patrol/Mira logic, lore and v4 saves. Do not clear all waypoints merely because Thorn exists in the zone, nor wait for the old frozen patrol-leg coordinate.

The former **manual** navigation visual guide refresh was permitted at 100 units of hero displacement even inside a one-second interval, thus ~3 full routes/s at a base Mage walk speed of 300 units/s. The candidate uses **450 units** as the significant-distance trigger, plus a refresh after **2 seconds if displaced at least 75 units**; stationary manual play no longer repeatedly recomputes a static route. Quest/gathering guides retain target-change checks and existing route-validity behavior but reduce their one-second refresh gate to two seconds and their displacement flag to 250 units. Route computation and collision validation are otherwise unchanged. This is a bounded frequency reduction, not a proof of a measured Chromebook FPS gain.

The runtime already budgets companion and hostile asynchronous searches independently: incremental generators, per-frame probe/node ceilings and reusable paths; a tiny `routeAge`/target-change check may remain at high frequency because threats and target positions move. **Do not apply the hero guide's 450-unit rule to companions, charmed creatures, summoned pets, escorts or enemies** without demonstrating undesirable planner activity; that might break combat pressure, formations and patrol behavior. Current Report (40) lacked active-guide evidence, so source/CI testing and the owner's direct observation establish the lifetime defect, not the original stall's cause. To distinguish the latter on a later build, the app now includes small session-only `performance.waypointPathDiagnostics` route-refresh counts and cumulative/maximum durations for map and quest guides, with the game-time of the slowest call. No per-frame profiler, new campaign fields or extra player action is needed.

**Status:** change drafted for owner review; no merge, Pages/PWA update, release claim or GTA Cuba edition deployment. The cache-combat interruption in [PR #876](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/876) and combat save policy in [PR #873](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/873) remain separate and unmerged.

**Owner direction:** October 23, 2026. **Status:** Deliberately deferred until after the seven-step Menu Usability Overhaul workflow. **This is a separate future chat/task**, not a hidden addition to Step 7 or a request to merge now.

The owner believes these four interdependent systems are currently suboptimal and may contain bugs, and wants a fresh, careful engineering audit after the entire menu workflow is complete:

1. **Actual route solver and walkability:** Pathfinding choice, obstacle/collision/terrain correctness, navigation destinations and service entrance frontages, unreachable or stale paths, and region/dungeon handling.
2. **Clickable map:** Hit testing, scaling from canvas to portrait/landscape/touch coordinates, selecting the intended map marker when symbols overlap, and clarity/accessibility for touch and keyboard.
3. **Navigate action:** State transitions when choosing a destination, route calculation failures, move-order persistence/cancellation, quest guidance interactions, and context-specific behavior.
4. **Clear waypoint:** Correctly clearing tracked manual/quest/gathering destinations without accidentally deleting quest or gathering state; behavior after travel, mode changes, reload, and old saves.

## Safe working plan for that future chat

- Begin with a **read-only** audit of current production `main` plus the then-merged menu changes, and distinguish reproducible bugs from potential UX improvements.
- Include real route/path test cases across all five regions and dungeon interiors, save compatibility, English/Spanish, and touch vs mouse. Preserve existing story clues (including deliberately hidden Thornfang positioning), travel payments, quest tracking and movement/combat guardrails.
- Propose **separate, owner-approved repairs** for each confirmed issue. Do not bundle a route solver rewrite, map interaction rewrite, quest/waypoint model changes, or simulation/performance tuning into a menu usability patch.
- Comply with owner policy: focused tests only by default; full-device/browser/game matrices require prior explicit approval.

## Boundary with menu Step 7

Step 7 may group/filter/present the existing destination *list* for readability, but must leave the underlying route solver, canvas hit testing, navigation execution, and Clear waypoint semantics **unchanged**. Step 7's source audit should note any suspicious behavior as an unverified follow-up, not claim these systems are correct or already fixed.

**Future chat starter:** “Please begin the deferred Map Routing and Waypoint Reliability audit documented in `docs/MAP_WAYFINDING_FOLLOWUP.md`. Audit first; do not change gameplay or deploy without my approval.”
