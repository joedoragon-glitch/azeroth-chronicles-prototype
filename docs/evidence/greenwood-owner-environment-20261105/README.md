# Greenwood owner environment candidate — 5 November 2026

**Current owner release direction:** Appearance will be reviewed by Joel in the deployed game. Automated visual approval is not a release gate. Rendering slowdown remains documented for a separate owner-led chat and is outside this environment workflow. Merge/publication is authorized after bounded functional/build verification.

**Live-main reconciliation:** Watermill #814 merged as `b6193a9b` during release preparation. This candidate now incorporates that actual main tree, including the corrected live doorway, shallow creek/culvert, millrace bridge, 19 route ordering, 100/80 strategic crossings and its canonical-art registration reconciliation. Combined environment release version is dev.263; earlier dev.262 images/checkpoints below remain correctly labeled historical evidence. No performance tuning or further automated visual acceptance work is included.

Implementation: dev.262, PR #828. Native source checkpoint `85ffe148`, main baseline `e25ad8e8`. This is an engineer-reviewed procedural candidate, not a release or owner appearance approval. Browser/Pixi review and latest-head performance remain open.

## Feedback coverage

| ID | Implemented result | Evidence / remaining gate |
| --- | --- | --- |
| E01 | No generic wall-center/bridge shadow; actual structural contact retained | Shared Canvas/Pixi code, fort/shadow tests; final browser frames |
| E02 | Small flowers/shrubs use proportionate faint grounding | Shared geometry; final ground/plant browser frames |
| E03 | Cultivated soil has no detached body shadow | Native ground frame; raised crops remain distinct |
| E04 | Existing day/night cycle attenuates shared shadows | Native day/night; browser driver adds sunset/sunrise at homestead and ground |
| E05 | Two 1.8-scale shelters; joined stockade expands west/north/south, gate fixed | Native Goblin frame; restore, route and wall tests |
| E06 | Functional native traps at guarded approaches across five regions | Inventory below; warning/damage-cycle/defeat and saved-post test; roads excluded |
| E07 | Occupied outdoor/interior source audit in all five regions | 19-zone inventory, no unresolved sampled sites; sampled regional/interior native night review |
| E08 | Continuous ribbon road edges with real end caps | Original road/bridge checks; final browser frames |
| E09 | Thin maintained lanes share reddish earth material with main road | Native ground junction; wilderness width/shoulder hierarchy retained |
| E10 | Restrained macro patches, stable fine grass/grain, broken cached leaf litter | Native ground frame; 12-entry litter cache; current-head performance still required |
| E11 | Scornfang occupies a converted farm storehouse with loading doors, grain hatch, secure hardware and records/weights | Native Treasury day/night; original interior/cache tests pass |
| E12 | Wagon departure road reaches eastern edge; generated trees cleared only from visible continuation | Native departure frame; transport/save/route identities preserved |
| E13 | Existing quiet production/market/freight/shipment chain retained and clarified | Orchard work rack/plots, market service lights/goods, existing freight crates/cart, Treasury receiving/records and loaded departure wagon; no economy/NPC expansion |
| E14 | Actual wall polygon interior or exact distance <=160 from wall edges | Original fort tests plus 159.99/160.01 edge checks; no second margin |
| E15 | Five public anchors covered by physical existing/new sources with dark intervals | Square existing post, market existing recruiter fixture, village south/hamlet/freight additions; street collision audit passes |
| E16 | Main roof span reduced from ~261 to ~165 logical units; physical radius55->40; broad wolf entrance retained | Native homestead day/night; original candidate four-seed/restore/patrol checks; rest bay moved clear of frontage |
| E17 | One existing general Crown banner by Thornfang approach | Native homestead and stable singleton restore test; no new royal insignia |

## Native images and provenance

Committed images are production Canvas renders at 852x393, zoom150%, day clock120/night500; see `native-scene-receipt.json`. They are actual candidate scenes, not mockups or owner screenshots. `tools/greenwood-layout/environment-review.cjs` reproduces seven day/night scenes and asserts render/save purity. Native review also sampled March, Highlands, Frontier, Crown, Vale Cellars and Scornfang Treasury at night. This samples art execution; the source inventory supplies wider site coverage. Physical-device performance/acceptance is not inferred.

- [Homestead day](homestead-day.png) / [night](homestead-night.png)
- [Scornfang Treasury day](treasury-day.png) / [night](treasury-night.png)
- [Goblin courtyard](goblin-day.png)
- [Merchant departure](departure-day.png)
- [Organic ground and earth junction](ground-day.png)

The existing browser road/bridge capture driver now adds seven environmental phone scenes in both real WebGL2/Pixi+Canvas overlay and full Canvas, plus homestead/ground sunset/sunrise. It preserves road-only desktop coverage and optional #814 mill/culvert targets. Latest generated browser artifacts must be read before closing that gate.

## Occupied sites and defense

`occupied-sites.json` records one deterministic normal-mode native world audit: stronghold/habitat centers outdoors and occupied home-cell groups indoors. Existing physical fires count when within220 units. New source placement uses collision/building/NPC/road rejection, stable IDs and an idempotent v4 marker. Wild wolf hunting ground remains a natural refuge rather than an artificially lit human camp. This is not an assertion that every room has been individually photographed.

| Zone | Audited site groups | New physical lights | Additional defensive posts |
| --- | ---: | ---: | ---: |
| Vale | 5 | 0 | 4 |
| March | 6 | 2 | 4 |
| Highlands | 5 | 2 | 2 |
| Frontier | 6 | 1 | 6 |
| Crown | 7 | 3 | 3 |
| Mine / Abyss / Citadel / Crypt / Archive | 11 / 11 / 14 / 6 / 6 | 6 / 4 / 9 / 1 / 3 | 0 |
| Five regional side interiors | 5 / 6 / 7 / 7 / 7 | 3 / 4 / 4 / 2 / 2 | 0 |
| Four Treasuries (Vale, March, Highlands, Crown) | 5 / 6 / 6 / 10 | 3 / 5 / 4 / 7 | 0 |

All sampled light groups have existing/placed disposition. Defensive posts use existing regional native kinds/timing/damage/telegraphs; they are outside main road centerlines, do not block movement, and leave alternate approach space. Failed placement candidates are skipped rather than forcing traps into roads or civilian space. Posts stop when their native nonsummoned garrison is defeated. Original dungeon traps and unrelated field hazards are retained.

## Focused validation and integration

Passed locally: original fortifications, road/bridge, regional street audit, projectile order, combat trap sources, new environment quality/native trap lifecycle, four-seed composition integration, original Greenwood candidate test including the full eight-leg patrol, cozy-night lighting, Greenwood interiors, source-scope evidence, mill/river native art, offline service worker, reproducible build and documentation-version consistency. Later source edits require their applicable recheck; no comprehensive game suite is claimed.

Watermill compatibility was tested in a disposable integration tree: environment `85ffe148` plus #814 source `3562d4d6`. Mill, road and environment tests passed, then original `snapshot-thorn-patrol.test.cjs` passed all18 seeded class/mode cases including real damage, physical joint return, save/travel, rescue,120s respawn, pending TRUE singleton and peace. Latest #814 `755578d8` changes documentation only. No work is merged to main. Integrate the shallow north creek/culvert, true millrace bridge, appended routes and 80-unit southern gap; retain this branch's scene migration and material work. Resolve the one duplicated water declaration by keeping #814's five-pool source, retain the combined capture driver, and regenerate source digests/SW after source review. Never take one whole landscape file over the other.

Known baseline original patrol failure: main's56-unit southern crossing fails real traversability; #814's80-unit crossing resolves it in the tested combination. #828 retains main's bridge widths rather than preempting the separate mill branch.

Remote `b502360f` passed PWA, contour and road/bridge workflow; focused failed only stale lodge-radius expectation, now corrected and passed locally. Paired performance run42062168808 returned HOLD: one-actor p95 baseline2.5ms vs candidate4.7/5.1ms; 8/24/48-actor comparisons passed. Current refined candidate must be measured; do not dismiss this as unstable baseline or claim phone FPS. This hold does not block independent scene/document/compatibility work.

Next: publish coherent refined checkpoint; inspect current-head focused/browser/performance results; repair relevant failures without repeating broad or unrelated checks; update this record to the actual final result before marking ready. No merge/deploy or device verification has occurred.
