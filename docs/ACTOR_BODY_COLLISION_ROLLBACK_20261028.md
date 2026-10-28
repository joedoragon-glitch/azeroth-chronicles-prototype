# Actor-body collision rollback — 28 October 2026

**Decision:** The owner has deliberately withdrawn PT-002's actor-to-actor collision/de-stacking realism feature. Preserve the pre-feature movement semantics while retaining physical terrain, authored scenery, doors, water, dungeon partitions, and movement/route safety. This is an experimental rollback for comparative Chromebook and Windows performance playtests; it is not proof that PT-002 caused every frame stall.

## Current replacement contract

- Hero, companions, pets, mobile enemies and bosses can pass through one another during **both combat and travel**, including exact overlap. They no longer obstruct, shove or separate one another because of a body collision.
- All actor spatial bins, actor radii, collision predicates, passive separation, timed friendly passage, mixed-side crowd escape, frame-pressure collision feedback and their call sites are removed. No retired actor state is saved or migrated.
- Terrain/scenery collision and relevant line-of-sight and world geometry are unchanged. Scripted charges/teleports continue to follow their existing independent rules.
- Companion retreat, Recall, targeting, healing, gathering safety and attacks are **not deleted**; only their redundant actor-passability plumbing is retired.
- The four-route-per-simulation-tick CPU cap and retry clocks introduced during later performance work are kept as an **independent terrain-route guard** (`navigationPlanning`), no longer backed by the actor spatial bins. This is intentional to avoid resurrecting redundant searches while testing movement collision costs.
- The existing exported playtest `crowdDiagnostics` key and `startCrowdDiagnostics` API remain for report compatibility, but now record **navigation and terrain** only; the screen labels them Navigation profiling. No actor-bin/separation counters are reported. Historical exports remain unchanged.

## Historical provenance (immutable Git links)

1. [Issue #312 PT-002](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/312): original overlap observation, Mirejaw congestion refinement, and player body-blocking request.
2. [Commit 88fad6f](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/88fad6fe543459c2d6e4b21558d85d1101eb51bc): introduced local steering, actor radii, bins, separation, 0.35s friendly relaxation; integrated through [PR #313](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/313).
3. [PR #329](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/329): travel hero/companion passage. Obsolete now because every actor pair passes during both travel and combat.
4. [PR #341](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/341): mixed-crowd jam escape. Its body-passage/pressure mechanic is retired; unrelated bounded terrain route planning is retained.
5. [PR #376](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/376): retreating companions' friendly passage. Redundant passability rule retired; retreat behavior remains.
6. [PR #423](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/423) and [PR #424](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/424), integrated via [PR #426](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/426): collision diagnostics and fast-reject optimization. Terrain/scenery fast rejection is retained; actor-specific diagnostics removed.

Historical documents and commits are **preserved, not rewritten as though the mechanic never existed**. The owner may reconsider introducing a simpler physical frontline mechanic only after reviewing controlled performance and combat-readability evidence.

## Validation and release acceptance

Focused automated checks must verify that actor pairs pass and may overlap in both combat/travel, that old entry points are gone, that full simulation and save restore do not call deleted methods, that walls/props still block, that route CPU protection and diagnostic recording work, and that targeting, charged attacks and companion survival do not regress.

The owner will perform the **actual Chromebook and Windows playtest** after reviewing this PR. **No merge or Pages deployment is authorized by this rollback request alone.** Compare Canvas and PixiJS on matching settings and scene conditions. Previous WebGL texture-cache stalls and 71,311 blocked-terrain checks remain separate open investigations regardless of the result.
