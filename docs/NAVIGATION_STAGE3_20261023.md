# Navigation Stage 3 — Authored service frontages and ferry docking

**Date:** 23 October 2026 (America/New_York). **Independent navigation workstream:** [issue #420](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/420), cumulative [draft PR #421](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/421). No individual Stage 3 PR, main-branch changes, manual full CI dispatch or deployment.

## Problem and evidence

The authored Marches ferry has a physical boat at `(1900,2940)` in water, a separate existing walkable dock rectangle `[1705,1840] × [2730,2920]`, and an unchanged transport interaction radius of 115 units. `navigationTarget()` previously tried the vessel and eight 65-unit offsets; every attempt missed the safe dock and reported no route. This was reproduced using the real Campaign/world/navigation sources, not inferred from a screenshot. A sampled set of 32 nearby dock positions passed actual collision tests and routing.

The **highlands return ferry** is also defined by authored `R.harbors.highlands` dock and vessel data and should use the same navigation-only frontend without altering the real service.

This is a **navigation approach discovery error**, distinct from the confirmed shared grid-path solver's single-start/single-end false negative. The latter is intentionally reserved for Stage 4.

## Implementation

Only `src/prototype/navigation.js::navigationTarget()` and its focused `tests/map-navigation.test.cjs` regression have changed for Stage 3.

When a displayed destination is explicitly the current region's authored ferry (`kind:'transport'`, `harbor:true`, position matching `R.harbors[zone].boat`), navigation computes a point by clamping the existing boat position to the **inside** of the already-authored dock rectangle with 16-unit clearance, thereby respecting the 15-unit movement collision radius. A candidate is only accepted when:

1. It lies inside region bounds and is unblocked by real movement collision;
2. `distance(candidate, boat)+20 < 115`, leaving boarding range after the hero's normal 20-unit stopping tolerance;
3. The unchanged shared `route(hero,candidate)` returns a nonempty route.

Otherwise the existing service-point/default-offset logic remains available. This changes **only the destination chosen by the map guidance**; it does not move any NPC, widen `interact()`, carve water, alter roads, spawn actors, teleport the hero, modify fares or boarding rules, or save a new field.

Illustrative confirmed real-geometry approach points (Normal Ranger, seeded):
- **Marches outbound:** dock point `(1824,2904)`, ≈84.1 world units from the ferry, formerly no map route.
- **Highlands return:** dock point `(341,1939)`, ≈69.4 world units from its ferry.

Both land inside their authored dock collision boundaries and are routed from the hero.

## Verification

The expanded `tests/map-navigation.test.cjs` still checks **all five outdoor regions**, real towns, rest/transport/dungeon/side entrances/bridges, no duplicate entries or hidden Thornfang revelations, route and saved-state purity, and historical environment migrations. It additionally proves each harbor's existing boat, walkable dock interior, segment-safe path and waypoint, unchanged 115-unit interaction distance *with room for normal movement stopping*, absence of teleporting, and reachability after an old harbor-layout migration.

Real Campaign/world/nav source probe (non-spatial pet/VFX modules stubbed, so not a full game run): **44/44 representative regional services reachable**; counts by region were Vale 8/8, Marches 8/8, Highlands 9/9, Frontier 8/8, Crown 11/11.

GitHub [focused run 40046603032](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40046603032) **passed** at source/test head `fa3b3bee64034773aeeb83c607b1ce35d95f7a12`: eight focused Node suites including map-navigation and existing Stage 2 navigation/control/combat tests, source syntax and reproducible offline-ready site build. Publish job skipped. The generic CI mapping warns that `navigation.js` has no dedicated automatic mapping, but the **explicitly changed map-navigation test** directly exercises it and was run; likewise, Stage 2's saved movement contract is exercised by its own targeted test.

**Not claimed:** complete all-NPC/all-position pathfinding, actual desktop/iPhone interaction, phone landscape placement, live-game combat integration, all game-mode/save-corpus certification, broad CI or release. Those belong to later stages and require owner approval where relevant.

## Next owner checkpoint

- [x] Stage 1: route/navigation audit
- [x] Stage 2: navigation control, cancellation, skill-priority contract and targeted audit
- [x] **Stage 3: authored ferry approach and representative five-region service verification**
- [ ] Stage 4: bounded shared route-solver correction, start/end graph candidate tests and road/AI safety
- [ ] Stage 5: marker-only map/phone interaction and integrated regression
- [ ] Final cumulative PR audit and **explicit approval before merging/deploying**

This Stage 3 result is for owner review; do not advance to Stage 4 automatically.
