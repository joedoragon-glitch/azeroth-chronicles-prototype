# Report #40 — optional map guide bounded rerouting candidate (16 November 2026)

**Status:** draft implementation in PR #889; linked defect #886 remains OPEN. No official or GTA Cuba deployment. Original Report #40 remains private.

## Owner's clarified action-RPG acceptance standard

This is a single-player action RPG, not competitive RTS navigation. A passive *visual* route may use a slightly different or longer route than the legacy synchronous BFS. Exact waypoint-sequence parity, mathematically shortest routes, and frame-perfect pursuit precision are **not required** for this optional helper.

The non-negotiable behavior is: no major synchronous freeze from optional guide rerouting, no instruction to cross blocked terrain, no loss of player control or waypoints during computation, no broken quest/progression/travel, and no changes to existing enemy/companion/pet/charmed movement or persisted v4 saves. Repeated inability to show useful routes for ordinary reachable destinations would remain a defect. Test on authored navigation cases, not solely equal-output comparisons.

## Verified source and runner evidence

The archived test-only comparison in draft PR #885 confirms the old real-Greenwood passive route could run ~339–396 ms with ~26k–31k terrain calls. Seven rounded test positions toward Thornfang's Skeleton-territory destination reproduced this high CPU cost. The original private Chromebook Report #40 aligns 7 retained stalls with old 100-unit refresh positions but did **not** time the route calls directly.

The subsequent 7-position test of the *already implemented* native incremental A* helper (PR #885, test `tests/report40-incremental-astar-guide.test.cjs`) passed reachable endpoint and walkable path segments without identical BFS geometry. On its GitHub runner: 30–53 slices per path at 256 collision probes + 40 nodes per slice; 7.2–11.6 ms observed worst slice per route **without** a wall-clock cap. This is not a Chromebook measurement. This evidence supersedes a policy of rejecting A* merely because its exact route differs.

## PR #889 staged source candidate

- Only optional visual map-guide refresh after the player takes manual control uses an incremental route. Initial explicit Map Navigate/movement orders, quest/gathering guides and other engine planners are unchanged.
- Reuse `Campaign.budgetedCompanionRoute(origin, selectedPoint, false)` as an isolated, fresh incremental A* generator **without borrowing AI budgets**. If no path is found, use the existing native incremental `budgetedTacticalRoute()` fallback. Native collision and terrain remain authoritative for both.
- Each active guide advances only up to 256 terrain probes, 40 graph nodes and 4 milliseconds of elapsed time per update; the elapsed budget is best effort because an individual call cannot be preempted.
- If squad/hero combat or hostile projectiles are present, defer optional route advance. Do not change enemy, pet, charm or companion pathfinding or their combat cadence.
- Retain current guidance while computing; cancel pending work if the waypoint is dismissed, combat encounter clears the specific informant lead, zone/session changes, or the hero reaches the destination.
- Before showing a completed candidate, incrementally reconnect from the hero's **current** position (with two limited reattachments for continuing movement). If no safe fresh connection is established, do not replace the existing guide. Never steer the hero automatically through an unfinished search.
- Keep existing waypoint timing totals for completed requests; separately record completed search slices and maximum single-slice timing. No save schema, additional long-term logging, or PWA changes.

## Remaining focused acceptance

1. Focused CI including new runtime behavior and existing Thornfang, map and quest/gathering regressions. The isolated A* geometry test is *not* a runtime-game acceptance by itself.
2. Confirm route updating completes in real Greenwood without repeated generator restarts, bounded work in combat, safe path reattachment during manual movement, and graceful no-route behavior. Validate the effect of the 4 ms cap on actual gameplay cadence.
3. Verify that the unchanged synchronous **initial explicit navigation** and **quest/gathering** calls do not remain a material Report #40-class blocker. They are outside PR #889 and require separate evidence before expanding scope.
4. Reconcile any CI browser/Pages fingerprint failures; do not alter loading guarantees or unrelated systems to make checks green.
5. Report #40 affected-device acceptance after an owner-authorized deployment is still outstanding. Issue #886 cannot close on CI evidence alone.

No merge to main, publication of either edition, or claim that the Chromebook stalls are repaired is authorized by this candidate.
