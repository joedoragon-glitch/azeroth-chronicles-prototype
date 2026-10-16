# Procedural art: source census and design decisions

Baseline: merged #308 `6bc27be31792b1c38147d61e98ceed6acf3e2560`. Status: implementation source review; no browser, screenshot, native-size or subjective visual acceptance has run.

**Audit correction:** the [execution audit](COMMUNITY_SNAPSHOT_EXECUTION_AUDIT_20261016.md), A02/A04/A07, finds that the census and handoffs do not yet substantiate comprehensive individual review. Treat the 367 records and preservation conclusions below as a draft requiring reachability, specific rationale and provenance corrections. The selected improvements listed here are source changes, not aesthetic acceptance.

`tools/community-snapshot/procedural-art-inventory.json` contains **367 cases**: exact enemy and boss families, every named settlement-building/decoration/landmark switch branch, regional wild foliage/rock paths, regional service and four construction stages, Basic/Full camps, ten main/side entrances, five residence entrance families, shared character/transport/terrain/cue layers, and eleven new pets. Each record identifies its actual source owner, disposition, preservation contract and deferred native review. This is a census of drawing cases, not a claim of 367 different assets or 367 improvements. Shared helpers affect several cases. All 33 registered sprite identities remain unchanged; illustrated content and its fallback both remain in scope.

The source review examined anatomy/proportions, equipment, material cues, contour complexity, repeated primitive shapes and regional function. Source-level retain decisions are provisional until actual-size review; primitive counts alone do not establish aesthetic quality. In particular, low-density floor vegetation, tracks, warning geometry and the intentionally fitted stone anatomy of Garun are not defects simply because they are simple or angular.

| Drawing | Source weakness and implemented change | Preserved |
| --- | --- | --- |
| Wolf / Thornfang / direwolf mount body | Box trunk and straight legs replaced by curved spine/belly, shoulder/haunch, hocks/paws, tapered tail, ear interiors and muzzle | Original wolf silhouette, woodland mantle, rider/tack, foot anchor |
| Crocodile / Mireling / Mirejaw | Curved tapered tail and snout, articulated limbs/toes, eye ridge and low-frequency scales | Original predator identity, ranged harness, Mirejaw back ridge |
| Veyrith / shared dragon | Scalloped membranes around original wing joints, finger ribs, belly and cheek planes | Purple identity, horn/wing/tail layout, original ground position |
| Reedbeast | Folded hind limbs, webbed toes, broad damp muzzle and eye highlights replace stacked-oval-only anatomy | Amphibian shape, original family, weapon/attack behavior |
| Skeleton | Joint heads, pelvis, paired shin and foot bones supplement thin stick frame | Thin readable bones, bow/sword and existing rank finish |
| Wraith/Stalker/spectral fallback | Curved cloak hem, hood rim, folds and lantern bail replace flat triangle | Spectral palette, lantern position and existing night light |
| Nine regional workshops/houses | Timber joinery/slats in Vale/Frontier; braced pilings/threshold/reed courses in Marches; staggered masonry/slate/lintel in Highlands; basalt joints/metal roof/entry in Crown | Original sizes, entrances, regional palette, patched Frontier variants |
| Ten repeated prop families | Crate side/lid/boards/fasteners; barrel staves/hoops/lid; coffin thickness; bone ends; well masonry/winding rope/bucket; cart hubs/spokes; ore-cart rim; grave-marker bevel/moss; dock-post ropes/grain; fishing-net floats/hem | Working purpose, native material, anchor and map placement |
| Eleven miniatures | Individually drawn friendly proportions and equipment. Wolf pup, crocodilian, purple dragon and scorpion-like Cindermaw remain anatomically distinct; stone Colossus has heartstone/golden eyes; six small figures keep their specific clothing and weapons | Original boss family, ordinary companion collision/slot, procedural-only rendering |

No map, collision, encounter geometry, population, ordinary boss controller, sprite image or manifest was altered for art. No additional trees/objects were placed. New pet design handoffs under `tools/sprites/design-handoffs/companion-pet-*.json` explicitly record candidate status and no sprite authorization. Existing illustration originals and rollback sources remain untouched.

## Deferred native acceptance

Review the named changed cases individually at 100/150/175% zoom on 1280×800 desktop and supported portrait/landscape phone sizes. Review front/side facing, sprites mixed with procedural bodies, day/night, TRUE/rank finishes, pet charge/status cues, depth/grounding/occlusion and label clearance. Check wolves mounted by human riders after the shared anatomy change. Check ceilings/entrances and crowded towns without moving gameplay geometry to hide a drawing problem. Verify the Wraith lamp remains a local light rather than a halo replacement. Inspect all eleven pet galleries and full-party scenes; screenshots of a gallery alone do not establish play readability.

The new browser fixture and existing snapshot visual capture suite are authored for this review, **not executed**. If a source retain decision proves visually weak, fix that case inside this consolidated update before release. Do not count source review as native-size evaluation.
