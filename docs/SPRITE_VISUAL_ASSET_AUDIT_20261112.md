# SIBDLP visual assets — exact source audit, 12 November 2026

**Evidence baseline:** `main@e97dd771190ee83f37fc61d091671e4d110c3a36`, package `0.9.1+snapshot.dev.288`. This document is a **dated audit receipt**, not a replacement for the live image registries, current design decisions, runtime renderer, or asset-specific creative approval.

**Audit scope:** all 75 prepared exact sprite contracts, all 32 registered sprite identities, all 67 committed sprite outputs, all 60 original sprite source files, seven material outputs, two live material registrations, the 513-case October handoff index and existing procedural source census. This is exhaustive **for those indexed/registered units**, not a certification that every ephemeral combat VFX frame, every current world instance, every saved-state variant and device render has been individually photographed. It does not change any artwork or game behavior.

## Reconciled quantitative result

| Evidence unit | Current result | Meaning |
|---|---:|---|
| Exact production contracts | **75** | Current fixtures, not 75 required generated sprites |
| Registered identities | **32** | Body registrations under `assets/sprites/manifest.json` |
| Registered, raster-selectable for exact fixture | **23** | Actual resolver chooses raster for that fixture; current scene instantiation separately unverified |
| Registered but procedural-selected | **9** | Historical registered raster deliberately bypassed for owner/current presentation |
| Contract-only, procedural selected | **43** | No active raster registered, no automatic generation obligation |
| Active manifest-referenced image resources | **36** | 32 bodies + 4 idle-frame resources |
| Retained historical image resources | **31** | All mapped to revision records; none orphaned |
| Original source PNG files | **60** | All mapped to active and/or historical records; 33 sources referenced by current active records including clips |
| Current road material registrations | **2** | Vale and Highlands roads |
| Retired ground texture files | **5** | Retained historical ground materials, not selected runtime surfaces |
| Historical procedural art cases | **513** | Unique documented identities and linked handoffs (not current sprite targets) |
| Handoff JSON files | **798** | Complete history, 513 referenced by the October case index |
| Historical sprite catalog | **297** | 281 old generate decisions and 16 procedural decisions; NOT a current work queue |
| Source-census coverage (previous reviewed evidence) | **19 zones** | 45 enemy keys; 14 guard keys; 224 decoration renderer cases; 15 settlement renderer cases; 26 landmark renderer cases; 8 work overlays; 28 planned terrain concepts |

## Findings

- **Established selection, not aesthetic acceptance.** Every one of the 75 exact production fixtures was resolved by executing the checked-in `sprite-format.js` + `sprites.js` in isolation with the live manifest. All 75 candidate-key contracts matched; all 22 recorded asset decisions were cross-referenced; there were zero contradictions among entries with an explicit `selectedRepresentation`. These fixture results do not prove that the modern campaign actually instantiates every asset, that every source image is artistically faithful, or that native Canvas/Pixi scene output matches.

- **Source inventory and original preservation.** All 32 active registry records have their original generator source paths; every current/historical source in the 60-file `tools/sprites/sources/` directory is linked from approved or rollback records. The game manifest directly references 36 sprite resources (32 static bodies and 4 idle frames). The remaining 31 committed sprite image files all resolve to approved historical output records; no unexplained sprite PNG/WebP remains in `assets/sprites/`.

- **Current visual selection is not the same as manifest membership.** `renderer.js::sprite` invokes `PrototypeSprites.draw` first and then the canonical procedural painter. For modern Greenwood nature/facilities/walls/interiors, Highlands nature/mining, crowned role/equipment variations, captains and exact owner selections, `definitionFor` deliberately forces procedural paint. These guards must be reevaluated using real regional entity state before calling a raster player-visible.

- **Old catalogs cannot be treated as the current to-do list.** 297 numbered historical catalog decisions (281 generate, 16 procedural) and the 513-case reviewed art pass are historical snapshots. The 513 distinct case IDs have 513 resolvable handoff paths among 798 retained JSON handoffs, but after subsequent Greenwood/Dark Crown updates the old baseline captures are not a current asset-by-asset screenshot certification.

### Exact registered sprite table (32/32)

**“Raster selectable” means the current selector returns that registered sprite for its defined processing fixture, not that a modern player scene necessarily spawns the asset.** Images for all 32 base registrations were inspected independently; matching their current procedural counterparts in native full scenes is a later, separate acceptance gate.

| Stable identity | Region | Resolver outcome | Catalog | Revision | Animation |
|---|---|---|---|---|---|
| `hero:paladin` | Greenwood Vale | **Procedural selected; raster retained** | `001` | `03fc86af3057` | idle frames |
| `enemy:goblin` | Greenwood Vale | **Raster selectable** | `016` | `1bd0a473f19e` | idle frames |
| `prop:mint-workbench:highlands` | Ironroot Highlands | **Procedural selected; raster retained** | `239` | `12622ddd80a5` | — |
| `prop:caravan-loading-bay:highlands` | Ironroot Highlands | **Procedural selected; raster retained** | `240` | `22537099babd` | — |
| `prop:bush:vale` | Greenwood Vale | **Raster selectable** | `273` | `596c1a99d327` | — |
| `prop:marsh-bush:march` | Flooded Marches | **Raster selectable** | `274` | `103abdf77ef0` | — |
| `prop:wildflowers:vale` | Greenwood Vale | **Procedural selected; raster retained** | `275` | `c0af461f2f8e` | — |
| `prop:sapling:vale` | Greenwood Vale | **Raster selectable** | `276` | `bd136414543e` | — |
| `prop:stump:vale` | Greenwood Vale | **Raster selectable** | `277` | `d7d12a6dde54` | — |
| `prop:fallen-log:vale` | Greenwood Vale | **Raster selectable** | `278` | `94075ddc182c` | — |
| `prop:cattails:march` | Flooded Marches | **Procedural selected; raster retained** | `280` | `e5386cbc94c6` | — |
| `prop:driftwood:march` | Flooded Marches | **Raster selectable** | `281` | `ba48ece9997d` | — |
| `prop:mangrove:march` | Flooded Marches | **Raster selectable** | `282` | `de4701ab1f1c` | — |
| `prop:pine-sapling:highlands` | Ironroot Highlands | **Raster selectable** | `283` | `8ae5af1b1661` | — |
| `prop:alpine-scrub:highlands` | Ironroot Highlands | **Procedural selected; raster retained** | `284` | `2498adbd5181` | — |
| `prop:heather:highlands` | Ironroot Highlands | **Procedural selected; raster retained** | `285` | `e19ac6e91cc5` | — |
| `prop:rock-cluster:highlands` | Ironroot Highlands | **Raster selectable** | `286` | `14e4a6006ae9` | — |
| `prop:dead-tree:frontier` | Ashen Frontier | **Raster selectable** | `287` | `7af803a82121` | — |
| `prop:charred-stump:frontier` | Ashen Frontier | **Raster selectable** | `288` | `47517f7c44da` | — |
| `prop:dry-scrub:frontier` | Ashen Frontier | **Raster selectable** | `289` | `041ba4eba4e7` | — |
| `prop:burned-log:frontier` | Ashen Frontier | **Raster selectable** | `290` | `4d5210072ca4` | — |
| `prop:black-rock:crown` | Dark Crown | **Raster selectable** | `291` | `dffd582c3cb1` | — |
| `prop:crystal-cluster:crown` | Dark Crown | **Raster selectable** | `292` | `ea18dd041809` | — |
| `prop:dead-shrub:crown` | Dark Crown | **Raster selectable** | `293` | `153447d302f6` | — |
| `prop:obsidian:crown` | Dark Crown | **Raster selectable** | `294` | `463a34de7acd` | — |
| `prop:rock:vale` | Greenwood Vale | **Raster selectable** | `295` | `360b44ff0b68` | — |
| `prop:rock:highlands` | Ironroot Highlands | **Raster selectable** | `296` | `439ab6b44a55` | — |
| `hero:mage` | Greenwood Vale | **Procedural selected; raster retained** | `002` | `874a2a8f982f` | — |
| `hero:ranger` | Greenwood Vale | **Raster selectable** | `003` | `8617b618d360` | — |
| `ally:soldier` | Greenwood Vale | **Procedural selected; raster retained** | `004` | `7a16cd9557d5` | — |
| `ally:archer` | Greenwood Vale | **Raster selectable** | `005` | `adb076e275b5` | — |
| `transport:ferry` | Flooded Marches | **Raster selectable** | `091` | `e426c0349b4e` | — |

### Prepared exact contracts without active raster (43/43)

Every record below has an exact processing specification and **no live registered sprite**. The existing procedural renderer remains the selected path. This is **not** a list of 43 graphical defects or pending production approvals.

| Stable identity | Region | Family/context | Catalog | Status |
|---|---|---|---|---|
| `prop:vale-cottage:vale` | Greenwood Vale | Replaced cottage | `061` | Procedural / no live registration |
| `building:barracks:vale:full` | Greenwood Vale | Full Barracks | `232` | Procedural / no live registration |
| `building:barracks:march:full` | Flooded Marches | Full Barracks | `233` | Procedural / no live registration |
| `building:barracks:highlands:full` | Ironroot Highlands | Full Barracks | `234` | Procedural / no live registration |
| `building:barracks:frontier:full` | Ashen Frontier | Full Barracks | `235` | Procedural / no live registration |
| `building:barracks:crown:full` | Dark Crown | Full Barracks | `236` | Procedural / no live registration |
| `prop:highland-pay-station:highlands` | Ironroot Highlands | Highlands prop | `237` | Procedural / no live registration |
| `prop:ore-sorting-bay:highlands` | Ironroot Highlands | Removed raster, procedural | `238` | Procedural / no live registration |
| `prop:mine-old-markings:highlands` | Ironroot Highlands | Highlands prop | `241` | Procedural / no live registration |
| `prop:ridge-supper:highlands` | Ironroot Highlands | Highlands prop | `242` | Procedural / no live registration |
| `prop:ridge-game-corner:highlands` | Ironroot Highlands | Highlands prop | `243` | Procedural / no live registration |
| `prop:ridge-study:highlands` | Ironroot Highlands | Highlands prop | `244` | Procedural / no live registration |
| `prop:ridge-bed:highlands` | Ironroot Highlands | Highlands prop | `245` | Procedural / no live registration |
| `prop:crag-rest:highlands` | Ironroot Highlands | Highlands prop | `246` | Procedural / no live registration |
| `prop:flight-planning-table:frontier` | Ashen Frontier | Frontier flight fixture | `247` | Procedural / no live registration |
| `prop:flight-harness-station:frontier` | Ashen Frontier | Frontier flight fixture | `248` | Procedural / no live registration |
| `prop:royal-flight-standard:frontier` | Ashen Frontier | Frontier flight fixture | `249` | Procedural / no live registration |
| `prop:royal-launch-platform:frontier` | Ashen Frontier | Frontier flight fixture | `250` | Procedural / no live registration |
| `enemy:crownguard:ranged` | Dark Crown | Combat role/guard | `254` | Procedural / no live registration |
| `enemy:skeleton:guard` | Greenwood Vale | Combat role/guard | `255` | Procedural / no live registration |
| `enemy:skeleton:ranged-guard` | Greenwood Vale | Combat role/guard | `256` | Procedural / no live registration |
| `enemy:reedbeast:hybrid-ranged-guard` | Greenwood Vale | Combat role/guard | `257` | Procedural / no live registration |
| `enemy:ogre:guard` | Greenwood Vale | Combat role/guard | `258` | Procedural / no live registration |
| `enemy:ogre:hybrid-ranged-guard` | Greenwood Vale | Combat role/guard | `259` | Procedural / no live registration |
| `enemy:archer:ranged-guard` | Greenwood Vale | Combat role/guard | `260` | Procedural / no live registration |
| `enemy:crownguard:ranged-guard` | Dark Crown | Combat role/guard | `261` | Procedural / no live registration |
| `enemy:wolf:guard` | Greenwood Vale | Combat role/guard | `262` | Procedural / no live registration |
| `enemy:orc:guard` | Greenwood Vale | Combat role/guard | `263` | Procedural / no live registration |
| `enemy:crownguard:guard` | Dark Crown | Combat role/guard | `264` | Procedural / no live registration |
| `enemy:goblin:guard` | Greenwood Vale | Combat role/guard | `265` | Procedural / no live registration |
| `enemy:goblin:ranged-guard` | Greenwood Vale | Combat role/guard | `266` | Procedural / no live registration |
| `enemy:mireling:guard` | Greenwood Vale | Combat role/guard | `267` | Procedural / no live registration |
| `enemy:mireling:hybrid-ranged-guard` | Greenwood Vale | Combat role/guard | `268` | Procedural / no live registration |
| `enemy:ashbeast:guard` | Ashen Frontier | Combat role/guard | `269` | Procedural / no live registration |
| `enemy:ashbeast:ranged-guard` | Ashen Frontier | Combat role/guard | `270` | Procedural / no live registration |
| `enemy:goblin:captain-ranged-guard` | Greenwood Vale | Captain/officer | `046` | Procedural / no live registration |
| `enemy:mireling:captain-hybrid-ranged-guard` | Flooded Marches | Captain/officer | `047` | Procedural / no live registration |
| `enemy:ridge:captain-guard` | Ironroot Highlands | Captain/officer | `048` | Procedural / no live registration |
| `enemy:ashbeast:captain-hybrid-ranged-guard` | Dark Crown | Captain/officer | `049` | Procedural / no live registration |
| `enemy:orc:captain` | Ashen Frontier | Captain/officer | `050` | Procedural / no live registration |
| `prop:grass:vale` | Greenwood Vale | Procedural foliage | `271` | Procedural / no live registration |
| `prop:wet-grass:march` | Flooded Marches | Procedural foliage | `272` | Procedural / no live registration |
| `prop:reeds:march` | Flooded Marches | Procedural foliage | `279` | Procedural / no live registration |

### Two additional historical-only sprite identities

- `prop:vale-cottage:vale` — its previously accepted raster and provenance remain in `tools/sprites/approved.json::history` and `assets/sprites/`. The active registered body was removed; the current owner choice is procedural.
- `prop:ore-sorting-bay:highlands` — its previously accepted raster and provenance remain in `tools/sprites/approved.json::history` and `assets/sprites/`. The active registered body was removed; the current owner choice is procedural.

### Additional explicit identity decisions outside the 75 contracts

- `boss:citadel`: existing procedural identity/asset decision; do not infer a missing sprite contract or resurrect old art.
- `pet:citadel`: existing procedural identity/asset decision; do not infer a missing sprite contract or resurrect old art.
- `pet:ridge`: existing procedural identity/asset decision; do not infer a missing sprite contract or resurrect old art.
- `pet:warlord`: existing procedural identity/asset decision; do not infer a missing sprite contract or resurrect old art.
- `specialist:thorn`: existing procedural identity/asset decision; do not infer a missing sprite contract or resurrect old art.
- `boss:ridge`: existing procedural identity/asset decision; do not infer a missing sprite contract or resurrect old art.

The playable **Rogue** is procedural; the current 297-entry catalog includes the Rogue prompt decision, but the 75 prepared contracts do not contain a Rogue raster. That is **not** a missing player character or a v0.9.2 sprite-production mandate.


### Every non-active sprite output (31/31)

These are immutable rollback outputs, **not missing image jobs or candidates to publish**. Their current revision ownership is derived from `approved.json::history`. Each filename is relative to `assets/sprites/`.

| Historical filename | Linked history record(s) | Bytes |
|---|---|---:|
| `atlas-2d981fb37361e0e4d4bab38b7a291fbaec3d2b8d5ec66cf5b69a29b08d76df36.png` | hero:paladin/b162917a1 | 15,412 |
| `enemy-goblin-a766feaa2f0b00ddc8a4da98745e66c2e8b76e9605c32e2d17e30d365da05ade.png` | enemy:goblin/06d5419a8 | 5,330 |
| `enemy-goblin-c20da0cb214bf63b414416a83dfe198b646c27dbb87d986173d03803aacc8e50.png` | enemy:goblin/6e7434dfc | 5,341 |
| `hero-paladin-d784954f7459c31582209b631b5c8384335cbfe0ee8c221b0c5f1db0df002b56.png` | hero:paladin/422da014a, hero:paladin/b162917a1 | 7,742 |
| `prop-alpine-scrub-highlands-9dfa887f68a9e97a066944a146c2341a80e0a75c4a1f5c2767c3616a4933be8d.png` | prop:alpine-scrub:highlands/2cac44b1e | 1,378 |
| `prop-black-rock-crown-b881134a10f69136b554dd02c1f656c23323e35cbdab134ccc8348e8ddcc48c8.png` | prop:black-rock:crown/c9bcd0f0f | 2,149 |
| `prop-burned-log-frontier-6c3eed8713b4ceda5b0240a459b446078eca84ebb0fb38abee61434f74943967.png` | prop:burned-log:frontier/68ae55453 | 2,193 |
| `prop-bush-vale-abd74f53e50989b5a50c1d7bf5aacea2a68596ba92beabf7cd5d192e682f212b.png` | prop:bush:vale/aa0612364 | 2,599 |
| `prop-cattails-march-80fb7024b43b477e547eeb1edd051ce32b34ae948da732bc9e2a9782164e2144.png` | prop:cattails:march/52d5ca818 | 2,247 |
| `prop-charred-stump-frontier-9049fce203b0fc5f2c8c0df937e198738fef24f98a5eb562bbbd6ddfd12b9ccf.png` | prop:charred-stump:frontier/8a224f784 | 1,718 |
| `prop-crystal-cluster-crown-c95d6d5c0721bc28eb8153bff5d54dfc15083d146a7b96f83c4a0a89b3323184.png` | prop:crystal-cluster:crown/2c4d5f17e | 3,188 |
| `prop-dead-shrub-crown-015a76d4765399ea510cc9567e073944ca8694ec6b6ead0a49e0301d4af4ff46.png` | prop:dead-shrub:crown/ae4419ab4 | 1,003 |
| `prop-dead-tree-frontier-fad8966de4636cac03f2571a12677040164409fb79a2dce1053fdb4494da8547.png` | prop:dead-tree:frontier/9d388809c | 2,035 |
| `prop-driftwood-march-7168c324281a4c17c42f22c21bf883a7d00eeb96e2c4550711eb41a8723c3284.png` | prop:driftwood:march/68a63c60c | 1,698 |
| `prop-dry-scrub-frontier-ae44f0f90ff60cda9d565c33e3c3defa0224cc0d891155188095a74be96d8d22.png` | prop:dry-scrub:frontier/209732842 | 1,109 |
| `prop-fallen-log-vale-d2edbc197f3aa178c48124ba50d933c0cc4e544b5b0d2b8e000c8fdb138103f8.png` | prop:fallen-log:vale/fa2e3569e | 2,830 |
| `prop-heather-highlands-874f1e4263a3c9332ff59aa4ffb9e977ed5647019a162a09cbf2fcfae1760b3c.png` | prop:heather:highlands/1fc62a7ad | 995 |
| `prop-mangrove-march-6c91cf25f57c4349871c9332c3196a3fa3f3915e345e4705e83d2dcb7643a83a.png` | prop:mangrove:march/d18220a76 | 4,975 |
| `prop-marsh-bush-march-13cf6cbe224090d4a6a13938f0d346acc49947c58d46c3b659fb49f347d017ee.png` | prop:marsh-bush:march/6e163a732 | 2,172 |
| `prop-obsidian-crown-eee77b0694096f672e4259ec9147327a6b7f05814383a489ed404d19256d2d68.png` | prop:obsidian:crown/c9ca949a0 | 2,406 |
| `prop-ore-sorting-bay-highlands-68526686bb7fc6528740e51dfe60c72a86d6200f4b71eadfb36a0eab6dc61b9f.png` | prop:ore-sorting-bay:highlands/37e546590, prop:ore-sorting-bay:highlands/b276ac831 | 7,350 |
| `prop-pine-sapling-highlands-b9d810ff34805ac7304f11e81c42526ff7ea1858b1bfd2598285fcadc07600a2.png` | prop:pine-sapling:highlands/1c5284836 | 2,450 |
| `prop-rock-cluster-highlands-e00743923c9bac60506638d6b34fb285743d849ee95678d8ce49a4f3148b41b5.png` | prop:rock-cluster:highlands/a6b4af21c | 2,019 |
| `prop-rock-highlands-6c91a24ae9be14a3e01308e7a3b8833f7ce7998ed4e0aa53d99965884f1b7611.png` | prop:rock:highlands/25c391d96 | 3,903 |
| `prop-rock-vale-6c91a24ae9be14a3e01308e7a3b8833f7ce7998ed4e0aa53d99965884f1b7611.png` | prop:rock:vale/ea5807ae8 | 3,903 |
| `prop-sapling-vale-b781bf563ba0b25b370413fdb565d0e676c160930350722cfa5d01e95cf8cae0.png` | prop:sapling:vale/8e6a450d7 | 3,187 |
| `prop-stump-vale-6fda624b035cab979207c23975e25f464c0b7a1e9a7cf7327d9a7fe0786344c0.png` | prop:stump:vale/aa17dad25 | 1,517 |
| `prop-vale-cottage-vale-21e8b38b7497f56b6c01f853f1100b16c78580703f546716db4e739432d68573.png` | prop:vale-cottage:vale/948805020, prop:vale-cottage:vale/bd2bddda8 | 151,368 |
| `prop-vale-cottage-vale-d94098c0186d31ce1b16815a3092957b5e428e35117729a9f2ffd9d8ec79ff3a.png` | prop:vale-cottage:vale/3c35ef58f | 10,582 |
| `prop-wildflowers-vale-31ce71511df0b3d280d9a7c0f3de51bb4fa9f66efe2f878fc9b02f07d7f4cf00.png` | prop:wildflowers:vale/1f5e60a8e | 1,437 |
| `transport-ferry-76ebb2349a8e0ece74cc2f578e9eeed72a6d1d6e2f3cf61736dd100d0324395a.webp` | transport:ferry/e96ca108d | 106,984 |

### Material output reconciliation (7/7)

| Filename under `assets/materials/` | Runtime state | Historical identity |
|---|---|---|
| `15ad70f49d7ba8593468ebd9cd1dca34b9df8fc70975f8b757d0686bc0881f22.png` | Active: `terrain:road:highlands` | terrain:road:highlands |
| `7985f36f485ad35a0b55907cbb099bd4656695f5b4377373bdeba23f727eb3b2.png` | Retired / historical | terrain:ground:crown |
| `a1fa0f5fb4fb2f203147fa8ebce4c4a1703dd7161890e69df4592e0e1d6f4334.png` | Retired / historical | terrain:ground:vale |
| `b1782a435760ed6bce0e5b1b5ad87ae8709ac22ae21c880e0b6a70bf13712276.png` | Retired / historical | terrain:ground:march |
| `bf8577c52fb47274c71ce2e8c73c98c66a2515d5b62a89120156e5749c3a4ba7.png` | Retired / historical | terrain:ground:frontier |
| `e108c18f0c95bcd577a0cf6a802a33847162af9276d3336be5d9f3b9abbae09d.png` | Retired / historical | terrain:ground:highlands |
| `e655205174d24f1f359916071fd764584953e3acaba4451f9d158e304fc87134.png` | Active: `terrain:road:vale` | terrain:road:vale |

The terrain material registry is separate from general procedural ground/road/water/bridge rendering. `assets/vfx/manifest.json` currently has no registered raster effects; this **does not** imply missing combat VFX, which are generated procedurally by dedicated renderers. Player-facing icons/branding and generated interface geometry are **additional visual-library categories**, not sprite-manifest missing files.

## Issue and PR reconciliation

- [#111](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/111): active ownership for production/showroom; retain and extend. New owner requirement (12 Nov) is a permanent, incrementally refreshed **Visual Asset Library**, not a single fixed `_sprite-preview` export.
- [#160](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/160): older art-production/original-master history remains open only for specific justified corrections, not blanket 281-image production.
- [#321](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/321) and merged [#323](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/323): October 513-case procedural review and approved updates, not a current full-world certification.
- Merged [#325](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/325): owner procedural decisions for Paladin, Mage and Soldier; Ranger/Archer raster choices protected.
- Closed/unmerged [#217](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/217): 20 prepared old images, 12 once absent; current game content/decisions must be checked per key before resurrection.
- Open draft [#445](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/445): failed ferry-reference alpha/margin comparison; do not merge or bypass image assertions. Ferry remains raster-selectable in main.
- Merged [#698](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/698): procedural outdoor floor retirement; two road materials now active, not seven outdoor grounds.
- Merged [#769](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/769): recent Dark Crown visual source; October screenshots must be refreshed before any current fidelity decision.
- Open [#484](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/484) / [#708](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/708): shadows, effects and current visual parity/owner acceptance separately from the 32 sprite filenames.

## Dispositions and action boundary

| Classification | Finding | Engineering disposition |
|---|---|---|
| **Completed — source reconciliation** | Exact registry-vs-contract resolver, archive/original-file ownership, historical art/handoff linkage, selected-procedural overrides | Preserve current owner choices, no code/art switch |
| **No confirmed functional defect** | No missing active sprite file, no missing current source original, no resolver mismatch among 75 prepared fixtures, no undocumented sprite PNG/WebP | Do not create a new defect ticket solely from planned sprite absence |
| **Unverified — modern scene coverage** | Some previously registered nature bodies may be bypassed by new `greenwoodNature` / `highlandsNature` entities; old fixture selection cannot tell whether actual scene instances still use a raster | Derive fixture-backed live entity coverage before marking live/dormant; include all four heroes, five outdoor regions and interior contexts |
| **Unverified — aesthetic parity** | I examined each of the 32 base raster images, but not all current paired procedural native scenes; the ferry raster visibly contains a conspicuous red area beneath its canopy that merits *targeted scene verification*, not an asserted bug/fix | Expose side-by-side/scene preview; request owner creative feedback only for an evidenced visual alternative |
| **Known intentional duplication** | Vale and Highlands rock registrations use exactly the same content hash (`70b3689cb118...`) under different regional keys | Preserve two keys; treat shared artwork as an alias candidate for the browser, not as a duplicated asset defect |
| **Awaiting owner acceptance** | Registered sprite records marked engineer-approved do **not** universally establish independent owner approval of the present image. Existing retained/selected differences are intentional. | Never upgrade engineer reviews into owner appearance approval |
| **Intentionally deferred for v0.9.2** | 281 historic catalog generation candidates, bulk artwork conversion, speculative texture restoration, cosmetics | No automatic production queue; correct only proven material presentation blockers or explicitly selected art |

## Visual Asset Library requirement after audit

The existing `scripts/sprite-pipeline.cjs showroom` writes a single asset's 12 camera/lighting comparisons to `_sprite-preview` and copies one fixed HTML viewer. It is **not** in the public `scripts/site-assets.cjs` inventory; it is not the requested searchable room. Reuse it for exact A/B and grounded 150% gameplay comparison. The existing `tools/audio/index.html` is a better precedent for a standalone searchable room. Historical `tools/visual-review/approved-art-pass` contains 513 indexed cases and familiar search/notes/zoom UX but its before/after review embeds image bytes and is frozen, so **do not** rebuild 513 embedded cards on every edit.

Implement a single versioned read-only visual index derived from runtime identity/selected representation, current visual/terrain owners, sprite/material registries and small deterministic scene fixtures. Facet by region, identity, family and status. Show canonical procedural drawing, active or retained raster, and the **actual in-game selection** as distinct roles; support variants, equipment, crowned/TRUE context, 150% scale, day/night, and deep links. Lazily request image resources; cache by content/revision/dependency hashes so one sprite's revision refreshes only its record, while a shared painter change invalidates its dependents. Historic originals stay retained in GitHub and do not inflate offline pre-cache. Keep independent of saves, avoid changing game state and honor EN/ES, Canvas/Pixi and phone resources. This requirement is a future engineering deliverable, **not implemented by this audit**.


## Validation performed and limitations

- **Executed this session:** all 75 exact fixture candidate keys and representation choices through the checked-in sprite resolver against the version-8 manifest; 75/75 exact-key agreement and no selected-representation contradiction. Verified 32 active records, 36 directly referenced image outputs, 31 history-only binaries, 60 referenced source masters and 513/513 indexed handoff path existence using live GitHub directory/registry responses. Inspected each of the 32 current base raster images. Compared all seven material file roles with current material manifest/history. Cross-read current graphics code, production docs, issue/PR dispositions and the existing 19-area renderer scope evidence.
- **Not executed:** local `npm test` / `npm run check`, actual browser scene comparison, physical iPhone/Chromebook playtest, complete Normal/Nightmare/TRUE/Awakening walkthrough, or deployment. This documentation-only branch does not establish those results. Existing historical test receipts must not be misrepresented as a fresh run on `e97dd771190e`.
- **Why the boundary matters:** Current procedural drawing equivalence requires actual region/state-dependent scene capture and artistic inspection; the archived October 513-case screenshots predate later graphics work. To certify the requested *entire current game visual experience*, the forthcoming library needs read-only scene fixtures for procedurally drawn actors, scenery, terrain, UI and VFX, and device-specific comparison/owner review where required.
