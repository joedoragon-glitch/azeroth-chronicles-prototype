> **6 November 2026 — independent P0 duplicate planner-probe reuse (DRAFT, UNMERGED, UNPUBLISHED).** Baseline `6ac2f4f3dd4e6f8e34075971f653ee5d8b069692`, candidate dev.269. `navigation.js::advanceBudgetedRoute` memoizes exact duplicate `blocked()` requests **only inside one synchronous invocation**, then discards the map. All original yielded requests still consume their original probe budget, so this does not advance routes earlier, reduce pursuit/companion AI frequency, share stale geometry between actors/ticks, or alter pools, paths, phases, collision, controls or saves. The maximum map size is bounded by the existing per-search probe allowance.
>
> Native authored March/Highlands/Frontier geometry: nine scenarios (ordinary/elite/companion modes), seven simultaneous searches each, **identical completion ticks and waypoint arrays**. Probes fell approximately 16%; e.g. March pursuit **15,541 → 13,065** across the same 17 ticks. Alternating ten measured complete-workload samples: March pursuit median **268.29 → 244.37 ms** (8.9% lower); a separate unchanged-code matched run measured **262.23 → 231.09 ms** (11.9% lower). These totals span the whole 17-tick workload, not one frame. A 120-tick native reconstructed seven-enemy encounter preserves byte-identical campaign state each tick; v4 round-trip and same-tick in-place collision-change controls accompany the test. Source-native CPU, not owner-device FPS or roster-wide boss certification. The initial cross-VM baseline exaggerated gains and was rejected; both final implementations are installed identically in the same JS realm. Reproduction: `node tests/route-probe-reuse.test.cjs`.
>
> Companion routes benefit from the same duplicate-probe reduction, but Report #37's independent 63.4ms companion spike has no proven source attribution; no claim to fix it and no speculative `party.js` change. #534 remains open. Remaining full synchronous paths and individual boss/captain lifecycle questions stay with #615/#725. Separate merge/release and full-campaign owner acceptance gates remain.

# Navigation Stage 4 — Conservative multi-anchor solver fallback

**Date:** 23 October 2026 (US Eastern). **Tracking:** [issue #420](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/420), one cumulative [draft PR #421](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/421). No separate stage PR, merge, published build or broad CI run.

## Reproduced pathfinding defect

The production `src/prototype/navigation.js::route(a,b)` builds a radius-15 collision-validated list of nearby 50-unit grid **start** and **end** candidates but formerly searched **only** `starts[0]` and `ends[0]`. A different candidate can provide a fully traversable route even when those first nodes are disconnected.

A deterministic synthetic 500×500 obstacle fixture with the *actual* installed navigation engine reproduces the problem. Origin **(255.8739062724635, 432.98672090284526)** and destination **(220.7593571068719, 268.0368645489216)** have a collision-clear path via grid node **(225,375)**, yet the former `route()` returned `[]`, in walking and `road:true` modes. These are source-level synthetic obstacles, not claims of a particular unreachable outdoor map site.

## Minimal correction

Retain the original pathfinder as the **first attempt**, unchanged in behavior: route geometry, four-neighbor breadth-first order, 50-unit grid, radius-15 swept segment sampling, existing smoothing for movement and deterministic `road:true` compaction stay intact. **Only when the original first-start/first-end search reports no path**, rerun the same bounded BFS with every previously identified valid start as a seed and every previously identified valid end as an acceptable goal.

All seeds are proven clear from the caller and all goals clear to the intended target by the preexisting `nearby()` checks. The fallback uses the same grid obstacle checks and swept edge validation; it does not tunnel through blockers, invent a route between disconnected land masses, modify collision radius, reposition the destination, or alter any save data. A successful old route is *always returned as-is*, avoiding changes to already authored/generated roads and NPC movement paths.

**Performance/cadence boundary:** Additional BFS work occurs **only** when the original solver would already have reported no route, never for a successful route or a direct unobstructed walk. The grid and movement-plan rate limiting are unchanged. Exact frame-time/performance audit was not requested and remains out of scope.

## Focused tests

New **`tests/navigation-route-stage4.test.cjs`** validates:
- The previously failing obstacle fixture now produces a nonempty path through collision-clear geometry, with every returned segment re-checked by production `clearSegment`.
- `road:true` also connects the same fixture, including the authored start and requested end and validating each reconstructed edge.
- A previously successful route produces its **exact historical road vertices**, plus unchanged direct-line movement.
- An actual full-height impermeable blocker returns no route in walking **and** `road:true` mode; no disconnected-pocket teleport.
- A **real Campaign actor** uses the production `follow()` method to reach a destination around a circular physical obstacle; every path segment passes the shared swept-collision check. This checks one direct simulation consumer, not every enemy or companion behavior.
  
Existing Stage 3 **`tests/map-navigation.test.cjs`** still checks all five outdoor regions, authored service/harbor frontages, collision, historic migrations and state purity. Existing movement, skill targeting, save and map-control code is untouched. Existing `tests/roads.test.cjs` contains a broader road-journey/migration integration contract but is deliberately **not** launched as a lengthy, unrelated matrix by this stage without owner authorization.

## Checkpoint and limits

- [x] Stage 1 source audit
- [x] Stage 2 control, cancel, combat-priority changes
- [x] Stage 3 existing dock frontage resolution
- [x] Stage 4 source implementation and deterministic regression (focused CI result recorded on PR after run)
- [ ] Stage 5 marker-only click/touch/keyboard, on-screen layout, cross-feature integration
- [ ] Final consolidated audit and owner sign-off before any merge/release

**Not verified:** broad dungeon/multi-save migration corpus, actual browser/phone physical playthroughs, all AI/companion pathfinding scenarios, precise performance impact. These are not silently inferred from the focused checks. Remain in draft PR #421 and stop for owner review before Stage 5.
