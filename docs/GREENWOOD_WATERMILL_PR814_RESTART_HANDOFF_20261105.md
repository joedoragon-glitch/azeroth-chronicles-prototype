# PR #814 — Watermill engineering restart and Greenwood integration

**Checkpoint:** 5 November 2026, 16:13 UTC. This is an exact inspected source checkpoint; refresh GitHub on continuation.  
**Game:** *So I Became the Dark Lord's Problem* (SIBDLP), independent fantasy RPG; the repository's old name is historical.  
**Existing PR:** [#814](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/814), branch `design/greenwood-watermill-district-20261105`. **OPEN DRAFT; NOT MERGED, NOT DEPLOYED, NOT DEVICE VERIFIED, NOT ARTISTICALLY ACCEPTED.**  
**Current source head:** `a10fc91204852201ce41ce2c6a36f0b6342b957e` (documentation-only commit on top of the focused-tested source head `3562d4d6911dde91a0bbeb3ad7b892359d271616`).  
**Current main:** `e25ad8e800f385a8c5591a8373edb04c2f85a1b8`; GitHub compare **ahead 88, behind 0**; no baseline merge needed.  
**Separate overlapping work:** [#828](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/828) head `b502360f2f994a503ddf62af4919a1387e225927`, open draft. Do not interfere with separate #804 work or automation.

## RESTART HERE

Read [controlling watermill design](GREENWOOD_WATERMILL_DISTRICT_GAME_DESIGN_20261105.md), **RM-01–RM-11** and its later design-first supersessions; [AGENTS](../AGENTS.md), [development ledger](DEVELOPMENT_STATE.md), [architecture](ARCHITECTURE.md), and [owner art direction](GREENWOOD_VALE_OWNER_ART_DIRECTION_DECISIONS_20261028.md). Then inspect live PR #814/main/#828 and exact-head Actions. This document captures verified state and unresolved gates; it does not supersede the actual owner-approved RM design.

**Owner scope:** engineer only inside #814; preserve merged #824's canonical roads and two main-river crossings, merged #813's working western millpond/wheel/weir/headrace/tailrace, merged #820's *dry* eastern Thornfang homestead, and the four playable classes, quests, 640 tribute, 32 Vale enemies, worker identities, player-built property and historical v4 saves. Do not create another PR, run comprehensive suites, merge, deploy, or require owner homework. Mark ready for review only when all objective engineering and aesthetic gates are actually met.

## Implemented unique source and save contract

- `src/prototype/greenwood-landscape.js`: shallow upstream `upperCreek` from northern map edge `[1220,0]` to existing stream `[900,880]`; five wet polygons, **four deep blocking** polygons. Shallow source remains traversable; deep water only passable on the actual local timber deck.
- `creekCulvert`: `[1070,725]` to `[1145,805]`, width 76; roadbed is compacted earth/clay with masonry support, not an unnecessary strategic river bridge. `millBridge`: `[1210,1575]` to `[1250,1495]`, width 62, an independent pedestrian service crossing over deep millrace.
- Appended `millServiceLane` route `[650,1550],[785,1595],[990,1655],[1200,1660]`; appended narrow `millDoorFootpath` route `[1200,1660],[1210,1575],[1250,1495],[1400,1490],[1290,1490],[1210,1485]`; dry doorstep `millEntrance=[1210,1485]`. The broad road stops on dry ground; the narrow pedestrian route crosses the timber bridge and reaches the door.
- `greenwoodWatermillVersion=2` one-time migration retains 17 canonical #824 indexed routes and appends two, **19 total**; one farm road appended to four originals; preview v1 disconnected-lane migration is corrected. Repeated restored v4 load must not duplicate roads or displace saved properties.
- Two original main-river bridges retain identities: north deck/gap **100**, south deck/gap **80** (widened from 56 after native Thornfang radius-15 stride clipping). Original eight Thornfang/Mira patrol legs unchanged; no new route engine, enemy AI or per-frame path search.
- `src/prototype/visuals.js`: actual recessed, partially open timber **visible** mill door and sill; original mill wheel/roof and mounted lantern preserved. **No explorable interior** or new zone transition. Culvert road paint matched muted Greenwood earth palette `#ac8d66`; no standalone dark bridge appearance. Pixi uses compatible alpha for glass, not unsupported CSS rgba.
- `tests/greenwood-watermill.test.cjs` screenshot helper now runs ordinary `g.zone()` migration before baseline snapshot, then strictly checks render purity. This fixes a false positive from `greenwoodTrailTextVersion` first-access initialization; no production render assertion weakened.
- Keep source/asset fingerprints in `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json` and `sw.js` derived from final actual files. Do not replace source-scope evidence or approved art history to silence CI.

## Exact test evidence and blockers

[Latest completed source-focused CI #42058985995](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985995), source `3562d4d6911dde91a0bbeb3ad7b892359d271616`, main `e25ad8e...`, synthetic checkout `924b2a3aff77123ca2307af691d1b3fa3d650979`: **27 of 28 selected focused test files passed, ONE failed.** Failed `tests/artwork-pipeline-checks.test.cjs` from strict `scripts/sprite-pipeline.cjs check` on `prop:vale-cottage:vale`. This is an overall **FAILED** focused run, not merge-ready.

Exact diagnostic:
```text
approvedCanon=b11ff36581fa31204e70d868378391577f80e067d68e06232fd3c7bc263d9031
currentCanon=76722da7dcd6b1466da334f8395561aa7a2dc590f564c08bfde8ebfee59c832c
approvedRasterHash=21e8b38b7497f56b6c01f853f1100b16c78580703f546716db4e739432d68573
catalogUnchanged=true
selectedRepresentation=procedural
originalApproval=PR #300
```
`tools/sprites/approved.json` retains the exact accepted raster, approval history and older source revisions. `scripts/sprite-pipeline.cjs` explicitly fails on stale canonical reference when current contract hash differs; it is **not** a raster-corruption finding. The procedural `vale-cottage` art shares `src/prototype/visuals.js` with the mill, and that source differs from main. Need isolate the reference-hash cause and compare current/approved art; **do not** rewrite `approved.json`, falsify approvals, disable checks or replace a retained accepted raster.

At this run's inspection, GitHub branch workflow listing returned **no newer CI runs** for documentation-only head `a10fc912...`; the newest actual completed run still belongs to `3562d4d...`. Do not infer a green new-head run. [Browser PWA update acceptance #42058985691](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985691) **succeeded** and [targeted native Canvas/Pixi road and bridge #42058985813](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985813) **succeeded** at source head `3562d4d...`. The [native mill/river day/night artifact](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985995/artifacts/13431712020) was uploaded, but its actual frames **have not been independently inspected** in this checkpoint; a generated screenshot or passing automated pixel assertion is not artistic approval. No device verification.

## Parallel Greenwood ownership, integration order

#828's [controlling E01–E17 design](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/fix/greenwood-owner-visual-review-20261105/docs/GREENWOOD_OWNER_PLAYTEST_ENVIRONMENT_RECONCILIATION_20261105.md) covers false environmental shadows, fort shelter sizes and traps, actual-wall 160-unit protection, inhabited lighting across five regions and public lamp placement, road-edge smoothing, terrain and trade, Scornfang's adapted agricultural Treasury, Thornfang's proportionate *appropriated farm building* and yard plus a single existing Dark Crown standard. This is **not** a #814 mandate to implement a second copy.

Both #814 and #828 touch `src/prototype/greenwood-landscape.js`, `sw.js` and `tests/greenwood-road-bridge.test.cjs`. Historical donor #825 also touches `src/prototype/visuals.js`, `world.js` and art evidence. Preserve the unique mill geometry, append-only routes, bridge clearances, door and save migration while integrating environmental fixes. Reconcile conflicts source-by-source only when one PR actually lands. Never blanket-merge donor #825 or duplicate #826/#827 fort algorithms. Current #814 is 0 commits behind main; do not perform a ceremonial merge. #804 automation remains separate.

## Next bounded actions, in priority order

1. Reproduce the single strict Vale-cottage canonical mismatch in isolation; compare procedural contract/reference against approved historical reference and `main`, identify exact source/contract drift, and repair via legitimate provenance-preserving engineering only. Keep old approval and raster immutable unless separately justified and approved.
2. Independently inspect exact-head **150% day/night** native mill/culvert/door/landing/wheel/timber bridge/confluence screenshots and real Pixi parity artifact, not merely workflow success. If artifact retrieval unavailable, record that explicit limit and do not claim visual pass.
3. Run only the narrow tests affected by a real source fix (artwork pipeline, watermill, road/bridge, v4 restore, navigation budget/Thornfang, PWA/manifest, Canvas/Pixi parity as appropriate). Source-only documentation changes do not retroactively make earlier tests pass.
4. Confirm 17+2 saved route order, 100/80 bridge widths, shallow/deep collision distinction, visible dry landing, repeated v4 restore and player-build/quest/worker preservation; keep CPU and navigation work bounded.
5. Refresh current main and #828 at merge boundary, update this exact-SHA ledger and PR conversation with test/artifact links and unresolved gaps. **Only then**, if all objective gates and art inspection pass, mark the *existing* PR ready for review (not merged). No deploy or full suite.

**Short new-chat instruction:** “Continue only SIBDLP PR #814. Read this restart file, RM-01–RM-11 design and AGENTS, refresh current main/#828 and exact CI. Resolve the sole remaining strict cottage-canonical provenance failure, independently inspect real 150% Canvas/Pixi day/night art, preserve v4 routes/bridges and all other Greenwood ownership, then prepare review-ready evidence without merging or deploying.”

## 3. Authored #814 source and geometry inventory

| Code owner | Implemented source behavior |
| --- | --- |
| `src/prototype/greenwood-landscape.js`: water | `upperCreek` starts at `[1220,0]` and connects to pre-existing `[900,880]`; shallow ribbon half-width 17. Five water polygons, **four blocking deep-water** polygons. Preserve *western* millpond, headrace, weir, wheel, tailrace and actual main river. |
| Culvert | `creekCulvert`: `[1070,725] → [1145,805]`, width 76. Earthen road over shallow water with masonry cheek openings. Latest `visuals.js` treatment uses road clay surface color `#ac8d66`, not a dark detached bridge slab. |
| Local timber deck | `millBridge`: `[1210,1575] → [1250,1495]`, width 62. Upstream of crowded confluence; real deep-water blockage everywhere except deck. |
| Farm and foot approach | `millServiceLane`: `[650,1550],[785,1595],[990,1655],[1200,1660]` stopping **on dry ground**. Separate `millDoorFootpath`: `[1200,1660],[1210,1575],[1250,1495],[1400,1490],[1290,1490],[1210,1485]`; actual doorstep `millEntrance=[1210,1485]`. The cart track does not cover the 24-unit pedestrian path or the small timber bridge. |
| V4 scenes and road IDs | `greenwoodWatermillScene(z)`: `greenwoodWatermillVersion=2`. **17 canonical #824 route records remain indexed**, append farm+pedestrian path to total **19**; old four road arrays become five. Exact known `version=1` disconnected preview lane replaced, not duplicated; no scene regeneration/owned property reset. |
| Existing main bridges/patrol | North bridge and river gap **100**, south **80** widened from 56 after reproduced radius-15 Thornfang blocked stride. Previously saved south display bridge width synchronized to physical 80. All eight original boss patrol legs retained; no novel patroller AI. |
| `navigation.js`, `world.js` | Native shallow/deep collision, genuine deck clearance, old-save scene fast-path integrations. Preserve four classes and other-region routes. |
| `visuals.js` | Dry-facing recessed partly open mill loading door, frame/sill, existing roof/wheel/one shared lamp; low-key shallow feeder and two locally sourced crossings. Pixi glass color uses canonical hex+global alpha, not unsupported CSS rgba. **No explorable mill interior.** |
| Tests/captures | `greenwood-watermill.test.cjs`, `greenwood-road-bridge.test.cjs`, `greenwood-composition-integration.test.cjs`, `greenwood-mill-river-visual.test.cjs`, `snapshot-thorn-patrol.test.cjs`, `vale-periodic-route-regression.test.cjs`, `runtime-workload.test.cjs`, `tools/greenwood-layout/watermill-review.cjs`, `pixi-road-bridge-review.cjs`. Source receipts in `sw.js` and `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json` must match final JS. |

**Resolved historical false save mutation:** Initial screenshot test took its before snapshot before an existing lazy `g.zone()` migration; the first draw applied `greenwoodTrailLabels` and set `greenwoodTrailTextVersion=1`. Test helper now triggers the normal migration **before** capturing its before/after immutable-save baseline. The strict renderer-purity assertion remains, and the corrected focused test later passed. Do not reintroduce this false precondition or weaken the assertion.

## 4. Test evidence and true remaining blocker

**Latest completed focused CI**: [run 42058985995](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985995). Tested #814 source head `3562d4d6911dde91a0bbeb3ad7b892359d271616`, GitHub synthetic merge checkout `924b2a3aff77123ca2307af691d1b3fa3d650979`, main `e25ad8e...`. **28 selected focused test files, 27 passed, ONE failed. Overall focused run = FAILURE**, not green. The sole failed file was `tests/artwork-pipeline-checks.test.cjs`. Native Greenwood water/mill/bridge, v4 reloading, Thornfang/Mira, source scope, PWA-related tests and screenshot purity ran without a reported failure. This is not an exhaustive campaign suite.

- [Real Canvas/Pixi Greenwood roads/bridges preview 42058985813](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985813): **SUCCESS**.
- [Browser PWA update acceptance 42058985691](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985691): **SUCCESS**, not iPhone/device verification or a published game.
- [Native 150% day/night mill, timber crossing and culvert images](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985995/artifacts/13431712020): generated and native runner passed. Owner/director's live aesthetic acceptance still open. The *latest* culvert color improvement at this tested head needs direct human comparison with the previous 150%-camera appearance. No automatic visual acceptance from nonblank screenshots.
- [Exact focused report](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42058985995/artifacts/13430787048). Older red runs for patrol, road setback, sprite hashes and lazy render migration are **historical and superseded**, not fresh blockers.

**ONE remaining known gate: protected sprite artwork provenance.** Strict art CLI failed `Stale canonical reference; compare again before publication: prop:vale-cottage:vale`. The instrumented `ARTWORK_CANON_DRIFT` report reads:

```text
approvedCanon     b11ff36581fa31204e70d868378391577f80e067d68e06232fd3c7bc263d9031
currentCanon      76722da7dcd6b1466da334f8395561aa7a2dc590f564c08bfde8ebfee59c832c
retainedRaster    21e8b38b7497f56b6c01f853f1100b16c78580703f546716db4e739432d68573
catalogUnchanged  true
selected          procedural
priorReview       https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/300
```

A source comparison found the `craftedHouse` cottage subroutine byte-identical in #814 and current `main`; **that does not prove why the generated canonical reference hash differs**. This is an unresolved source/artwork approval-contract mismatch. Do not silently overwrite `tools/sprites/approved.json` approval hashes, modify retained raster files, remove checks or claim a fresh owner art approval. Inspect actual current and prior procedural reference pixels/contract provenance and use established process only after source review. `tests/artwork-pipeline-checks.test.cjs` continues to call all strict sprite, source-scope and material checks, unchanged by the new read-only diagnostic.

**Source changes after a tested SHA require a fresh applicable check.** At this documentation checkpoint only source/doc status files are being changed; code and artwork checks are not certified at the new documentation commit automatically.

## 5. Coordination matrix: #814 watermill versus #828 broader environment

The other active first-region feedback session is **PR #828**, open draft and **not yet merged**. Its controlling owner-playtest document is [here on #828's branch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/fix/greenwood-owner-visual-review-20261105/docs/GREENWOOD_OWNER_PLAYTEST_ENVIRONMENT_RECONCILIATION_20261105.md). It inventories E01–E17 across all actual screenshots, full Goblin shelter/fort repairs, physical/object shadows, native defense traps, public and inhabited-enemy lights in **all five regions**, corrected rural road/ground surface, trade, appropriate old-farm architecture and Thornfang proportions. Its latest owner supersession specifically requires an **appropriated former farm/granary** for Thornfang (with ONE Dark Crown standard) and an **appropriated farm storehouse** for Scornfang's Treasury, *not* new purpose-built lodges or cloning the same house. The work is not automatically done merely because the design is recorded. See #828's phase A–F acceptance gates.

**Exact GitHub file overlaps between #814 and #828 at this checkpoint:**
- `src/prototype/greenwood-landscape.js`: #814 owns creek, pond/race, small bridge/culvert, dry farm spur and footpath, native 100/80 main bridge clearance and versioned mill migration; #828 owns surrounding environment/roads/Thornfang/Goblin compound and their own migration. **Preserve both**, never replace with whole file from one branch.
- `tests/greenwood-road-bridge.test.cjs`: #814 requires canonical 17 + appended 2 routes (19), 100/80 real crossings, old-save bridge adjustment and the reproduced boss stride. #828 adds surrounding road/compound acceptance. **Combine assertions**, not discard either contract.
- `sw.js`: both branches fingerprint runtime sources. After any integration, regenerate **final actual blob** hashes; copying either manifest wholesale is wrong.

**#825 donor-only additional overlaps:** `src/prototype/visuals.js`, `world.js`, `greenwood-landscape.js`, `sw.js`, and `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json`. #825's Goblin shelter source has conflicting consecutive guards making one migration block unreachable, plus real earlier CI failures (including undefined `R` and road collision). #828 is responsible for selectively adopting corrected donor ideas; #814 must not import #825's broken material wholesale.

**#826/#827 overlap with #828, NOT #814:** `fortifications.js`, fort docs/tests and SW asset map. Choose exactly one actual-wall and 160-unit outside buffer implementation, not both or obsolete #819's +40 rule.

**Merge sequencing:** As of this checkpoint, `main` already equals #814's base. Don't create a ceremonial merge commit. If #828 later merges **first**, re-read its exact main-shipped code, then merge the **narrow overlapping hunks** into #814, protect #814's unique water and 100/80+mill route invariants, fix caches/evidence and rerun focused validation. If #814 later merges **first under separate authorization**, #828's engineering integrator must preserve the shipped watercourse/bridge/footpath and 19 routes. Do not claim independent open draft #828 is incorporated into `main` simply because #814 is reported mergeable.

## 6. Ordered continuation and merge-readiness gates

1. **Refresh GitHub, not memory:** get current `main`, #814 and #828 head, exact-hash compare, open PR ownership. Read this handoff, RM-01–RM-11 and E01–E17 as needed. Do not repeat work already tested green just because an ancient handoff says pending.
2. **Resolve the single remaining substantive red test**: investigate `prop:vale-cottage:vale` procedural canonical drift while preserving the PR #300 approval history and retained raster bytes. Compare actual reference images and strict contract source. Document why it changed. Never waive or self-approve the protected art solely to make CI green.
3. **Finish bounded actual-scene appearance review** at 150% gameplay landscape: water source/pond/weir and real confluence, roof/wheel and obvious day/night door, dry loading apron, tiny timber deck with both banks and native footpath, earthen culvert now using the real road palette, and dark but usable single inherited lamp. Compare Canvas and Pixi; if user-owned scenery conflicts, preserve the saved identities. Existing real view artifact links in section 4; capture again only when changed pixels warrant it.
4. **Preserve tested navigation/saves/performance**: 17 original indexed routes + 2 mill routes, no duplicate preview lane, 100/80 major bridge gap+deck agreement, actual body-radius traversal across both named bridges and local deck, old v4 restored landscapes, 32 Vale enemies and 640 tribute units, workers/companions/quests, no CPU pathfinding explosion. Run smallest appropriate focused suites after actual code changes, not comprehensive suites.
5. **If #828 or any newer source has merged**, integrate only overlapping source hunks with their original owner. Keep #828’s former agricultural Thornfang/Scornfang buildings, public lights, wall protection and regional atmosphere; keep #814’s unique watermill topology, decorative door, 19 roads/paths and 100/80 crossings. Regenerate exact source SHA-256 audit and service-worker **Git blob** hashes from merged files; update docs to the actual new baseline.
6. **Closing evidence:** annotate the current exact source head, focused test and synthetic checkout, PWA, native Canvas/Pixi artifacts, outstanding art acceptance and any deferred unrelated work in this same handoff and PR body. Only when objectively clean, change draft status to ready for **owner review**; no automatic merge, Pages release or installed-device verification.
7. **Keep working while CI runs.** Instead of refreshing job status repeatedly, handle independent source/visual/docs tasks and revisit the results once useful work is done. Leave truthful blockers and the next action in this repository document for any new chat.

## 7. Status language and supersessions

**Planned:** any not-yet-supported future polish or #828 E01–E17 completion. **Implemented:** committed source candidate on this branch. **Tested:** individual exact-SHA CI cases in section 4. **Merged:** #813/#824/#820 and earlier upstream changes, NOT #814 or #828. **Deployed / device verified:** neither #814 nor #828; prior published screenshots show the *earlier* mill, not this branch.

Historic paragraphs in the longer [RM/WD design](GREENWOOD_WATERMILL_DISTRICT_GAME_DESIGN_20261105.md) still describe the old isolated mill lane, provisional version 1, older #824 “still open”, earlier 56 south bridge, or a proposed eastern pond. They are **dated provenance, explicitly superseded** by this checkpoint and latest controlling RM-10/RM-11 decisions. Do not treat them as instructions to roll back the integrated candidate.

**Copyable new-chat instruction:** “Take over senior engineering on the existing SIBDLP watermill PR #814. First read `docs/GREENWOOD_WATERMILL_PR814_RESTART_HANDOFF_20261105.md` and the controlling RM-01–RM-11 design on the PR branch. Check live main and #828 E01–E17 environment work, resolve the one strict Vale cottage artwork-provenance failure, finish 150% Canvas/Pixi scenes and source/save/route validation, and make #814 objectively merge-ready without duplicate PRs, comprehensive suites, owner homework, automatic merge or deployment.”
