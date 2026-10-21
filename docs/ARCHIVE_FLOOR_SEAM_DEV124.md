# Sunken Archive floor seam — dev.124

Owner reported a thin invisible collision while trying to walk down beside the Keeper’s study desk, net and drying rack.

Reproduced at x=1130: the lab ends at y=800 and the study previously started at y=800. Collision requires a radius-15 actor to fit inside a single floor rectangle, so movement stops before y=785 and cannot cross to y>815. A zero-radius sight query also fails exactly on y=800. The renderer draws the combined footprint, making this join look like continuous floor.

The study now overlaps the lab to y=740. This added overlap is entirely covered by the existing restoration wing/lab, so the outer floor outline is unchanged. No global collision relaxation, partition change, decoration move, fort bonus or lighting adjustment. Static rules apply immediately to old saves; room regeneration and progress migration are unnecessary.

Focused checks pass: four lab/study crossing positions, both directions, sight, real hero/Soldier/Ranger/enemy movement, existing save plus real tick/input, retained outer wall/partition and doorway. Build/generated-source/syntax and changed-source formatting pass. One native phone startup/crossing at 1130,780 → 1130,850 has no JavaScript errors and retains the real walls. Capture and receipt: `tools/visual-review/archive-floor-seam-dev124/`. No broad suite or CI.

Prepared from published main `e7da791d3bbcc13dbbf9edc525bfe8ffdc6ad093`. Published in PR #360 / `9dfbef583a47c93c9f93c2b1b73096a2e5d4de71`; package-only run 39544261325 succeeded. All 12 checked live files match; actual live phone startup and crossing pass without JavaScript errors. Normal workflow restored and temporary publisher removed. Receipt: `evidence/ARCHIVE_FLOOR_SEAM_DEV124_PUBLICATION_20261021.json`. Owner phone play next. Fort extension remains a separate proposal.
