# v0.8.81 · project housekeeping

## Result

Chromebook/browser play now uses a dedicated desktop layout without the phone joystick, touch interaction or touch confirmation controls. The skill bar and keyboard hints leave the right HUD clear, and the camera centers the remaining play space. Phone statistics and menu shortcuts use a compact top panel that leaves the hero clear, with doctrine above Interact during combat. A separate phone entry launches the installed PWA in the touch layout. Both presentations retain one campaign engine and the existing save keys.

World authoring, navigation, rendering, persistence, platform selection and bounded runtime measurements have separate modules. The affected code is formatted for review, with a pinned formatter and lockfile. One generated entry template and one public asset inventory prevent script, offline-cache and deployment drift. CI checks formatting, generated artifacts and syntax before gameplay/browser testing.

Rendering inverse-projects viewport bounds before visiting floor tiles and culls objects before copying/depth sorting. Unchanged HUD markup is retained. Hidden pages skip work, and paused/unfocused presentation redraws at most four times per second. Logical camera coordinates stay independent of the bounded high-DPI backing canvas. Historical games remain available but download only when opened.

## Preserved work

- Crowns naming and numerical economy.
- v4 campaign state, independent Normal/Nightmare saves and original legacy backups.
- Regional layouts, occupation sites, services, boss homes, Treasury and dungeon depth.
- Combat, progression, routes, collision, charged-skill behavior and keyboard-first menu rules.
- Procedural static/terrain/effects canon and the 231-entry sprite catalog. The production sprite manifest remains empty.

## Validation

The extracted world/navigation code was compared directly with v0.8.80 across 19 outdoor/interior zones. Exact serialized snapshots match before and after short simulation runs; 3,496 collision/route queries match. This comparison covers the moved code, rather than assuming source extraction is behavior-neutral.

Twenty native Canvas scenes across five regions and five main dungeons, at phone and desktop dimensions, are pixel-identical to v0.8.80 when given the same camera and animation time. The intended new desktop camera and separate desktop/phone layouts are presentation changes.

Sampled work counts at the same town camera:

| Scene | Full floor grid | New floor candidates | Objects considered | Objects entering draw sort |
| --- | ---: | ---: | ---: | ---: |
| Greenwood, 375 px | 1,156 | 306 | 227 | 38 |
| Greenwood, 1,280 px | 1,156 | 504 | 227 | 88 |
| Frontier, 375 px | 1,849 | 380 | 376 | 55 |
| Frontier, 1,280 px | 1,849 | 598 | 376 | 114 |

These are scene-specific work counts, not a claimed FPS increase on Joel's Chromebook. Device reports now provide active frame cadence, 95th-percentile sampled work time and renderer counters. Samples are bounded to 180 active frames, stay local and exclude paused/hidden intervals.

The regression suite includes platform selection, hybrid Chromebook capability detection, persisted preferences, storage failure/corrupt-save handling, v4 compatibility, viewport-coverage equivalence, bounded measurements and lazy historical caching. Browser checks cover distinct layouts, resize stability, the dedicated phone entry, screen switching without changing the run, and offline reopening, alongside the existing full gameplay/device matrix. Release publication requires successful CI and exact-build live verification.

## Follow-on work

Continue regional playtesting and the established sprite pipeline. They do not need to finish before architecture can improve. Combat/progression and menu catalogs remain substantial and should be extracted incrementally when their domains change. A wholesale framework migration or native package is a later decision based on actual requirements and performance evidence.
