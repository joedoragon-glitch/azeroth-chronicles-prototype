# Approved procedural gallery selections — dev.117

Joel selected the procedural versions in every comparison screenshot attached to this turn. The visible numbered assets are:

| Number | Asset | Exact registration |
| --- | --- | --- |
| 09 | Wildflowers | `prop:wildflowers:vale` |
| 14 | Cattails | `prop:cattails:march` |
| 19 | Alpine scrub | `prop:alpine-scrub:highlands` |
| 21 | Heather | `prop:heather:highlands` |
| 23 | Mint workbench | `prop:mint-workbench:highlands` |
| 24 | Ore sorting bay | `prop:ore-sorting-bay:highlands` |
| 25 | Caravan loading bay | `prop:caravan-loading-bay:highlands` |

The larger Highlands screenshot repeats heather, mint workbench and caravan bay and also shows alpine scrub. Duplicates are counted once. The earlier cottage choice remains applied. No other comparison is treated as an approval.

The existing sprite-definition resolver now selects procedural drawing, height and occlusion silhouette for these exact regional keys. Current procedural art is unchanged. Registered images, masters, clips and catalog identities remain available for rollback. No map placement, collision, simulation, saves or other selections change.

The focused native audit locates each real authored prop in its region and verifies the actual renderer draws it procedurally with zero raster body draws and no state mutation. All 33 registrations were compared against dev.116: exactly seven selection changes, 26 unchanged. Procedural source and sprite manifest are byte-identical to dev.116. Existing sprite/fallback tests, build/generated syntax, sprite scope and material/audio inventories pass. The whole format command reports only the pre-existing unchanged `tools/sprites/approved.json` warning; changed-source formatting passes. No full game suite or broad CI.

Evidence and reproduction: `tools/visual-review/procedural-selections-dev117/audit.json` and `audit.cjs`. The owner-reviewed artwork remains on `review/sprites-vs-procedural-dev116`; its LIVE labels describe that frozen baseline, before these new selections.

Status: approved and audited; package-only publication next. Further gallery choices remain pending owner review.
