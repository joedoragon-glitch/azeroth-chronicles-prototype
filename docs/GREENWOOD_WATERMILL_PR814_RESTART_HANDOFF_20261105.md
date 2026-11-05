# PR #814 — Watermill engineering restart and Greenwood integration

**Checkpoint:** 5 November 2026, ~16:05 UTC. Live GitHub state overrides this dated record.

**Game:** So I Became the Dark Lord's Problem (SIBDLP), independent RPG. GitHub repository's old name is historical.

**Read first:** This file; `docs/GREENWOOD_WATERMILL_DISTRICT_GAME_DESIGN_20261105.md` sections RM-01–RM-11; `AGENTS.md`; `docs/DEVELOPMENT_STATE.md`; and the separate [PR #828 environmental handoff](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/fix/greenwood-owner-visual-review-20261105/docs/GREENWOOD_OWNER_PLAYTEST_ENVIRONMENT_RECONCILIATION_20261105.md).

**PR:** [#814](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/814), branch `design/greenwood-watermill-district-20261105`. Open DRAFT, unmerged, undeployed, no phone verification. Keep engineering in this PR; no full suites/merge/deploy without separate approval. Don't wait idle for slow CI; make independent progress and return to the logs.

## 1. Exact main reconciliation and neighboring PRs

| Record | Verified SHA and state, 5 November | Integration meaning |
| --- | --- | --- |
| `main` | `e25ad8e800f385a8c5591a8373edb04c2f85a1b8` | Contains merged #824 canonical roads/bridges, #813 watermill, #820 **dry** eastern Thornfang homestead, #808 botany and #809 night work. |
| PR #814 before this documentation | `3562d4d6911dde91a0bbeb3ad7b892359d271616`; open draft | **Verified `main...#814`: 87 commits ahead, 0 behind, common base exactly current `main`. Already synchronized; no gratuitous merge/rebase needed.** The documentation commits after this checkpoint naturally advance the head. |
| #814 merger of #824 | `7301b04046392ce40990391fd81c32552b1e4f57` | Two-parent integration retained the current main source baseline while reintroducing bounded #814 features. Do not reapply obsolete early draft water/road geometry. |
| #828 | `74b1e41315fe84083f11f240faef53a8ec362410`; open draft | **Other Greenwood feedback session**. Design E01–E17, parallel engineering; **not yet on main**. Preserve branch independence and reconcile when integrating, not through blind wholesale file copies. |
| #825 | `9271bfbbda3b97e0c1e698199fe8ea9e8593296b`; open draft | Defective/unfinished environmental **donor** for #828, not a PR to stack or merge wholesale. |
| #826 / #827 | `5911577b8860bb31a9a56324fa556eb3292000e4` / `5f2eecdf996be721ed1c1f500b0acbad326670f2`; open draft | Alternative native fort-wall protection implementations. #828 chooses **one**; no change required in #814. |
| #819 | open historical draft | Obsolete extra 40-unit fort margin; do not import over the already merged/approved 160-unit policy. |

Current `docs/DEVELOPMENT_STATE.md` on main starts with a dated assertion that #824 is still a release candidate. Live GitHub metadata **supersedes** this stale sentence. #828 independently edits that development ledger, so avoid introducing a competing ledger edit in #814; update it once at the final integrated release checkpoint.

## 2. Owner's controlling decisions from this chat

- **Design first, senior engineering next:** RM-01–RM-11 is a creative GO to bounded implementation, NOT approval of unfinished art, a merge or publication. Owner wants a complete reviewable result with little homework.
- **Hydrological continuity:** a real-looking northern shallow headwater must enter the preexisting western millpond and headrace, pass the dam/weir and wheel, then flow by tailrace to the **actual main river**. No blue-ended stub, floating bridge, absurdly abrupt river mouth or restored eastern water disc. Merged #820's eastern location is a **dry** homestead.
- **Road and bridge plausibility:** an earthen northern culvert and a short timber **pedestrian** service crossing over the millrace, both with true banks/landings, one connected farm road and dry footpath toward the mill. Owner authorizes changing replaceable geography/ordinary scenery or local deck width as genuinely needed, not deleting saved personal property or inventing an unnecessary third main-river crossing.
- **Mill doorway:** owner supplied real playable-game screenshots; the existing two-storey mill broadly looked decent but didn't clearly have a usable loading door. An exterior recessed partly open door, jambs, sill and dry landing were added. This is **not** an explorable interior; no inside room or enter/exit transition has been implemented.
- **Thornfang pathfinding:** owner wants existing bridges used, not a clever new patrol subsystem. The original eight-leg patrol already includes both banks of the north/south main bridges. A real radius-15 stride was clipped by the old southern 56-unit opening; #814 widened the **existing** south walkable gap AND visible deck to 80; north remains 100. Keep patrol legs, behavior and the authentic bridge crossings intact.
- **Safety/performance:** preserve all four existing playable classes, v4 save schema, 32 ordinary Vale enemies, 640 tribute units, owned buildings, quests, companions, worker assignments, other-region behavior, practical lighting and bounded CPU. Use focused tests and real 150%-camera Canvas/Pixi views. No comprehensive suite or false device-verified/deployed claim.
- **Cross-session Greenwood ownership:** #828 handles E01–E17: proportional shadows/ground, Goblin compound + two usable shelters/traps, native 160-unit wall protection, occupied enemy and civic lights, forest/road material, merchant trade connection, a **proportionate appropriated agricultural building** for Thornfang with a better yard and **one existing Dark Crown standard**, and Scornfang's distinct **appropriated agricultural storehouse/Treasury**. Do not double-implement them in #814 or confuse their lore.
