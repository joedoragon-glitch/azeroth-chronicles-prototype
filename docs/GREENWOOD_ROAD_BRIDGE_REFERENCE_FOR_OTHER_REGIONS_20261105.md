# Greenwood Vale roads and bridges — precedent for future regional audits

**Project:** *So I Became the Dark Lord's Problem*. **Owner direction:** 5 November 2026. **Geographic scope:** first region, Greenwood Vale, only. **Status:** historical design and engineering reference, not an implemented policy for other regions.

## Process to reuse, NOT geometry to copy

1. **Start as a game designer.** Inspect in-game roads and both riverbanks, describe where residents, merchants, horses, carriages and pedestrians should realistically travel. Establish main/farm/foot hierarchy by each region's geography, not by source-array position.
2. **Map every route and junction.** Record actual authored centerlines, real connections, service entrances, crossroads, bridges, waterways, plot edges and gameplay access. Distinguish abrupt town-street elbows that make sense from impossible carriage turns in open country.
3. **Draw believable joined ground.** Smooth rural bends without cutting through homes, gardens, defensive walls or water. At a T/Y junction, produce one continuous worn road surface, not independently painted strips darkening each other.
4. **Treat bridge as a system.** A stone freight bridge and timber pedestrian bridge have different expected widths. Deck, legal river gap, approach road, bank geometry, party and navigation grid must agree. Never leave walkable invisible water beside a narrowed deck.
5. **Keep saves and rendering safe.** Separate source-aware migrations avoid rebuilding player scenery and Barracks. Precompute/cull stable road geometry, avoid per-frame JSON/cache work, and preserve Canvas/Pixi equivalence.
6. **Do independent design QA after code.** Compare screenshots of full T-junctions, banks, bridge deck and complete approaches at normal mobile camera scale. Require focused native two-way traversal, party clearance, old v4 save idempotence, no sprite regressions and measured performance evidence.
7. **Keep development status honest.** Design, implemented, tested, merged, published and owner-device-verified are distinct states. The owner has final artistic acceptance after seeing the merged playable game.

## Greenwood evidence and nontransferable decisions

- [Initial complete design brief and second-pass design QA](GREENWOOD_ROADS_BRIDGES_GAME_DESIGN_20261105.md).
- [Road infrastructure audit](OUTDOOR_ROAD_INFRASTRUCTURE_AUDIT.md).
- [Scoped Greenwood implementation PR](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/823) and its later reconciled integration.
- Greenwood-specific values (e.g. road widths 88/52/24 and north/south deck widths 100/56 world units) are **examples only**. Other regions require their own traffic analysis and collision/legal widths.
- Keep Greenwood's mill, riverbank and bridge IDs, local quests, Treasury, defenses, role-based roads and saved player constructions unchanged outside this owner-approved road scope.

**Scope prohibition:** Do not copy Greenwood coordinates or migrate another region's routes automatically. Each later region needs its own design-first brief, isolated implementation, focused evidence, independent art audit and owner acceptance.
