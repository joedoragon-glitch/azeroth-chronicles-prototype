# Character presentation quick fix — 20 October 2026

Joel requested immediate implementation and direct merge with no tests after announcing the visual release. Published `0.9.1+snapshot.dev.91` preserves the complete dev.90 performance update and Frontier repairs.

- Hero Paladin and Mage: use their current authored procedural bodies, including associated face/hair/armor, height and occlusion silhouette. Crowned versions already use procedural designs.
- Companion Soldier: use its procedural body across tiers.
- Hero Ranger and companion Archer: keep their existing raster sprites, as explicitly clarified by Joel.
- Goblin slinger: hostile ranged Goblin variants use half-lidded side-looking eyes, unequal brows and a small one-sided smirk. The cheerful round-eyed smile/blush is removed from this expression. Shared procedural variants inherit it. The protected melee raster and companion Archer are unchanged.

The selection is made in the existing sprite-definition resolver so body, label height and silhouette use the same policy. Stable catalog keys, registered images, attached clips and original sources remain available for rollback. The resolver change does not modify simulation, saves, combat geometry, animation timing or the recent performance fixes.

Per-design handoffs record this later owner decision without inventing appearance approval of an unseen revision. No raster images were generated or edited. One build generated dev.91 version/cache files and completed its existing packaging/syntax step; source formatting parsed the final edits. No tests, browser review, full-game checks or CI were run. A one-time packaging-only publisher deploys the owner-authorized update; normal release wiring is restored afterward.

**Published:** [PR #325](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/325) merged as `58714cf407de9397ebb8ba0343a4ded508865d75`. Packaging-only [run 39373388652](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39373388652) succeeded. Exact public version, engine, runtime, renderer, sprite resolver, visuals and service worker match the prepared source. Normal release wiring is restored and the temporary publisher removed in closeout. [Publication receipt](evidence/CHARACTER_DEV91_PUBLICATION_20261020.json). No tests or browser checks ran.
