# Report #40 — optional map guide bounded rerouting candidate (16 November 2026)

**Status after the combined release:** original PR #889 was integrated through [combined PR #908](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/908), not independently merged; #889 was closed as superseded. The official game now serves `main@985c3e802abec3e6cef01cebb6ee788f4d772b15` as `0.9.1+snapshot.dev.291` following successful post-merge validation and Pages publication. This does **not** prove GTA Cuba edition parity or affected-Chromebook performance. [Issue #886](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/886) remains **OPEN**. Original Report #40 remains private.

## Owner's clarified action-RPG acceptance standard

This is a single-player action RPG, not competitive RTS navigation. A passive *visual* route may use a slightly different or longer route than the legacy synchronous BFS. Exact waypoint-sequence parity, mathematically shortest routes, and frame-perfect pursuit precision are **not required** for this optional helper.

The non-negotiable behavior is: no major synchronous freeze from optional guide rerouting, no instruction to cross blocked terrain, no loss of player control or waypoints during computation, no broken quest/progression/travel, and no changes to existing enemy/companion/pet/charmed movement or persisted v4 saves. Repeated inability to show useful routes for ordinary reachable destinations would remain a defect. Test on authored navigation cases, not solely equal-output comparisons.

## Verified source and runner evidence

The archived test-only comparison in draft PR #885 confirms the old real-Greenwood passive route could run ~339–396 ms with ~26k–31k terrain calls. Seven rounded test positions toward Thornfang's Skeleton-territory destination reproduced this high CPU cost. The original private Chromebook Report #40 aligns 7 retained stalls with old 100-unit refresh positions but did **not** time the route calls directly.

The subsequent 7-position test of the *already implemented* native incremental A* helper (PR #885, test `tests/report40-incremental-astar-guide.test.cjs`) passed reachable endpoint and walkable path segments without identical BFS geometry. On its GitHub runner: 30–53 slices per path at 256 collision probes + 40 nodes per slice; 7.2–11.6 ms observed worst slice per route **without** a wall-clock cap. This is not a Chromebook measurement. This evidence supersedes a policy of rejecting A* merely because its exact route differs.

## Published official runtime scope (original PR #889, included via #908)

- Only optional visual map-guide refresh after the player takes manual control uses an incremental route. Initial explicit Map Navigate/movement orders, quest/gathering guides and other engine planners are unchanged.
- Reuse `Campaign.budgetedCompanionRoute(origin, selectedPoint, false)` as an isolated, fresh incremental A* generator **without borrowing AI budgets**. If no path is found, use the existing native incremental `budgetedTacticalRoute()` fallback. Native collision and terrain remain authoritative for both.
- Each active guide advances only up to 256 terrain probes, 40 graph nodes and 4 milliseconds of elapsed time per update; the elapsed budget is best effort because an individual call cannot be preempted.
- If squad/hero combat or hostile projectiles are present, defer optional route advance. Do not change enemy, pet, charm or companion pathfinding or their combat cadence.
- Retain current guidance while computing; cancel pending work if the waypoint is dismissed, combat encounter clears the specific informant lead, zone/session changes, or the hero reaches the destination.
- Before showing a completed candidate, incrementally reconnect from the hero's **current** position (with two limited reattachments for continuing movement). If no safe fresh connection is established, do not replace the existing guide. Never steer the hero automatically through an unfinished search.
- Keep existing waypoint timing totals for completed requests; separately record completed search slices and maximum single-slice timing. No save schema, additional long-term logging, or PWA changes.

## Validated integration and remaining acceptance

1. The focused #889 checks passed 13 relevant suites, including production-shell guide completion/cancellation, seven native Greenwood A* detours, moving-hero fallback, Thornfang guide lifecycle, save purity and reproducible build. The combined #908 validation preserved the same three Report #40 test files **byte-for-byte**, and the scheduler code differs from original #889 only in formatting of the Thornfang encounter/status check.
2. The official combined release was merged and published at `985c3e80`; the owner reported successful post-merge validation and GitHub Pages deployment. This is a **development update toward v0.9.2**, not v0.9.2 completion or affected-device certification.
3. The original 4 ms limit is best effort; **actual Chromebook frame-time and user-visible stutter mitigation remain unverified**. Source and automated tests are not physical-device acceptance. Do not close #886 on source equivalence alone.
4. Initial explicit **Navigate** and passive **quest/gathering** calls still use the older synchronous route search. They were outside the narrow repair; investigate separately only if new evidence establishes a material freeze or progression issue, rather than expanding optimization by assumption.
5. GTA Cuba edition parity, full long-session v4 save continuity and earned campaign progression have distinct release/acceptance gates and were not established by this navigation candidate.

Historical PR #889 is closed *without an independent merge* because #908 delivered its code. Avoid reapplying the conflicting old branch or the broader alternative #890. Keep these limitations visible in [issue #886](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/886).
