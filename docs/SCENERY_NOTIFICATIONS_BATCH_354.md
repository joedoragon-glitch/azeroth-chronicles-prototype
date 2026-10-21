# Scenery and announcements — next-update candidate dev.120

Owner issue: #354. Joel narrowed collision work to straightforward corrections, leaving ambiguous cases annotated, and explicitly requested a concluding implementation audit. All announcement categories remain in scope, including previous-region lore arriving after travel.

Prepared on `update/scenery-notifications-batch-354`, based on main `9a44fd5`. Not merged or published. No broad CI or whole-game suites. The concluding focused audit is complete. Source upload was rejected by automatic approval review; this candidate remains in local Git until explicit push authorization.

## Implemented first pass

- Two March boardwalk props permit walking. Existing solid structures and interiors retain their contracts.
- Explicit outdoor fruit/sapling/pine/dead/birch/willow types receive narrow ground trunks, not canopy-sized blockers. In the deterministic fresh five-region census, 97 trunks and two boardwalks; three path-adjacent trees remain deferred are affected. Exact stable-ID inventory: `evidence/SCENERY_TRAVERSAL_354.json`.
- Road/service/resource/camp/enemy-home conflicts keep their prior treatment for a later individual review. Existing solid footprints are retained. No slowdowns, new navigation engine, boss recovery changes, artwork edits or global furniture classification.
- Positive-radius movement and routing use these corrections. Zero-radius LOS/projectile calls retain existing cover behavior. This is a deliberate small first-pass distinction, not a complete movement/cover design.
- Regional quest lore carries its source region even when a reward is processed elsewhere. It waits for the correct region. Visit-scoped warnings and command feedback expire at travel; global achievements remain queued.
- All notices use smaller/lighter cards. Phones show one card, with routine feedback separate from milestones and urgent warnings leading. Layout follows selected experience and viewport orientation/height; long cards provide compact previews linked by text to Menu → Announcements.
- Announcements exposes full recent messages. Earned quest/dungeon/side-interior lore is reconstructed from existing v4 facts after reload, without a new save schema. Recent miscellaneous announcements are session-only (60 entries).

## Deferred collision cases

Houses/services with compound art; camps; large rocks and rock clusters; crates/barrels/stacks; furniture/workshops; mangrove roots; fences/gates/barricades; water/shallow ground; dense brush and movement penalties; projectile-cover policy for new trunks/boardwalk railings. Existing dungeon walls, pillars and authored physical barriers remain untouched. Do not mark this as a completed whole-game asset audit.

## Verification ledger

Initial focused passes: actual notice queue safety, regional/visit isolation and priorities; six tree types across hero/Soldier/Archer/pet/enemy/boss movement and detours; low vegetation; boardwalk movement; access exclusions; interior isolation; existing crowd escape; nine bridges both ways; quest narration/rewards/save isolation; menus. Build and changed-source formatting pass. Native Chromium checks pass for all four categories at six sizes (24 cases), English/Spanish menu paths, portrait/landscape rotation, source-region travel and short-status expiry. Saved-position repair, ten field-boss/form reset cases, fortification projectile/cover behavior, Optimization Mode and painted occlusion checks also pass. Fresh generation has zero placement/identity differences when traversal is toggled. `npm run check` and changed-source formatting pass; full `format:check` reports only the unchanged pre-existing `tools/sprites/approved.json` warning. No broad CI, whole-game tests, merge or deployment ran.


## All announcement producers reviewed

| Source / event | Treatment |
| --- | --- |
| `progression.js` level | Global milestone; survives travel |
| `engine.js` rescue, pet unlock, boss victory, throne claim, ending credits | Global milestone; survives travel |
| `engine.js` throne objective | Global campaign milestone |
| `engine.js` halls secured | Source-region milestone |
| `rewards.js` selected quest payoffs | Lore uses quest source region (not payment location); final approach remains a global milestone |
| `engine.js` Keeper evidence / live trail witness | Local narration; full evidence remains accessible; obsolete live reports do not replay after travel |
| `engine.js` TRUE imminent / appeared, defeat recovery | Visit-scoped priority warnings |
| `party.js` Recall; `navigation.js` route waiting; `boss-combat.js` withdrawal; `save.js` restored encounter | Compact visit-scoped feedback with bounded freshness |
| `app.js` short status receipts | Clear after travel/new campaign; important save/import/storage failures retain their reading time |
| `app.js` update/install notice | Existing separate update button and important status path retained; not misclassified as a combat milestone |

Internal `say()` messages are not an additional on-screen toast renderer. Dungeon/side lore is also recoverable through saved discovery facts in Announcements. Older quiet-interval, hazard/projectile safety and interrupted-reading rules remain.

## Concluding audit findings and corrections

1. Applying changed collision during generation incidentally shifted scenery. Traversal now enables only after each scene's original generation/migration passes finish. The paired five-region census now finds no changed coordinates, IDs or enemy homes.
2. Three selected trees near footpaths remain deferred: Frontier `aesthetic-nature-40`, `recovery-heat-frontier-13`, `recovery-heat-frontier-42`.
3. Trees must retain full renderer bounds in Optimization Mode. Sapling types are no longer treated as optional clutter, and the four explicitly authored sapling/birch/willow types support the existing bounded actor contour.
4. Failed fare/transport transactions now restore transient notice context and history together with campaign state.
5. Phones must prioritize warnings and timely command confirmation while keeping global milestones queued; stale local warnings/receipts must not appear on another map. Real queue, travel and menu checks cover these outcomes.
6. An older occlusion raster fixture lacked the renderer's current terrain dependency; the fixture now receives it. Its real painted-mask assertions pass, including the added canopy and preserved grass negative control.

Native captures and replay tools: `tools/visual-review/scenery-notifications-354/`. The screenshots freeze notice transitions for inspection. Device hardware FPS, a full asset-by-asset collision census, broad regression, Safari/WebKit and publication remain outside this completed focused audit.


## Owner publication workflow and prepared release

Joel explicitly requested the sole-developer/manual-phone-play workflow: implement each requested change, use only necessary focused tests and startup checks, and publish for his own playthrough. This batch is authorized for publication. Existing 24 native startup/layout cases and focused checks are reused; no additional broad test run is needed.

The local release wiring follows the prior dev.119 package-only publisher: `owner-scene-notices-dev120.yml` packages committed assets and deploys Pages only for a main commit carrying `owner-scene-notices-dev120`, with an exact dev.120 version check. The normal `pages.yml` triggers are temporarily held; restore them and delete the one-time publisher immediately after verified deployment. Original normal workflow bytes are preserved in Git parent `1ee5098`.

Source push was rejected again by automatic approval review after the owner requested publication. Read-only checks verified authenticated user `joedoragon-glitch` owns the public repository, has push permission, and the local origin matches exactly. No alternative remote write was attempted after the repeated rejection. Local preparation is complete; remote publication remains blocked pending the tool-required explicit destination authorization.
