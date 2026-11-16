# Post-menu follow-up: Map routing and waypoint reliability

## 16 November 2026 — owner-directed Thornfang waypoint and restrained guide refresh (draft)

Owner observation (no need for a redundant reproduction): the Millhaven **Western road observer** provided a dynamic patrol-leg lead; the player encountered and fought Thornfang before physically arriving at the earlier snapshot destination, but the informant waypoint persisted. This is an unnecessary navigation-guide lifetime and may contribute to unrelated gameplay work. It is **not proof** of the root cause of Report (40)'s unaccounted 200–260-ms stalls.

This candidate marks **only** that informant's manually chosen route with a runtime-only `thorn-witness` purpose. Finding the living Thornfang within 220 world units, entering his actual engagement, or defeating him clears the stale guide immediately during the ordinary frame update; if the hero is *still autonomously following that precise order*, cancel that order and route. Preserve all other map/quest guides, companion assignments, Thorn patrol/Mira logic, lore and v4 saves. Do not clear all waypoints merely because Thorn exists in the zone, nor wait for the old frozen patrol-leg coordinate.

The former **manual** navigation visual guide refresh was permitted at 100 units of hero displacement even inside a one-second interval, thus ~3 full routes/s at a base Mage walk speed of 300 units/s. The candidate uses **450 units** as the significant-distance trigger, plus a refresh after **2 seconds if displaced at least 75 units**; stationary manual play no longer repeatedly recomputes a static route. Quest/gathering guides retain target-change checks and existing route-validity behavior but reduce their one-second refresh gate to two seconds and their displacement flag to 250 units. Route computation and collision validation are otherwise unchanged. This is a bounded frequency reduction, not a proof of a measured Chromebook FPS gain.

**Separate owner-raised question: companion, pet, charmed-monster and enemy path refreshes.** Read-only source review found genuinely small *moving-target* thresholds too: `followCompanion()` may mark a blocked trip for new planning after the target moves **over 30 world units**, and generic/hostile `follow()` can react after **over 80 units**. These thresholds can be crossed often when following a moving hero, but **they do not imply a complete full-map route search at each crossing**: both use a direct-clearance fast path; blocked companion and active enemy modes have shared/per-type limited plans, incremental resumable frontiers, first-leg validation, and path reuse. For ordinary nonincremental actor follow, check the `reserveMovementPlan` limit and retry cooldown separately. This is an **unverified potential source of repeated work**, not a clean bill of health or a confirmed Report (40) cause. The retained Report (40) had relatively small named companion/enemy AI timings in its worst sampled frames, while its large unexplained 200–260-ms residual work happened outside the named simulation slices. **Do not apply the hero guide's 450-unit threshold to companions, charmed creatures, summoned pets, escorts or enemies** without a focused route-call and collision-validity evaluation; increasing pursuit cooldowns blindly could break combat pressure, formations, rescues or patrols.

Current Report (40) lacked active-guide measurement, so source/CI testing and the owner's direct observation establish the informant waypoint lifetime defect, not the original stall's cause. To distinguish the latter on a later build, the app now includes small session-only `performance.waypointPathDiagnostics` route-refresh counts and cumulative/maximum durations for **map and quest guides only**, with the game-time of the slowest call. Existing opt-in crowd/AI diagnostics already distinguish companion planning from main frame residual work; no new full profiler, campaign field or immediate owner test is needed.

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

## 16 November 2026 — draft PR #890: bounded optional waypoint route searches

The owner authorized a source-level repair candidate and relevant focused tests, **not** a merge or public update. [Draft PR #890](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/890) replaces synchronous *passive visual-guide* route refreshes with isolated incremental native BFS work (128 terrain probes / 24 graph nodes and a checked 3ms wall-time target per callback), preserving existing direct Navigate commands, combat movement, route geometry, authorized dock candidates and v4 saves. Optional work pauses during squad combat and incoming hostile projectiles. Before displaying a completed route, the browser must reattach and validate its walking segments against the hero's current position; invalid or stale routes are retried without publishing an unsafe new path. A failed attachment cannot be treated as success or a reason to skip obstacle checks.

[The detailed 16 November engineering handoff](REPORT40_BOUNDED_GUIDE_REPAIR_20261116.md) identifies the independent new tests, remaining latency/terrain/real-Chromebook acceptance uncertainties and exact release boundary. Native CI and browser tests must be checked on the latest head. The earlier deployed #879/#882 cadence mitigation remains in effect. Issue #886 remains OPEN, and separate draft autosave #873 / predictive #876 remain unmerged; their acceptance gates are not subsumed by #890.
