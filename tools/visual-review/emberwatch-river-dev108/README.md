# Emberwatch and river correction — 20 October 2026

Scope/decisions: `docs/FRONTIER_TOWN_RIVER_20261020.md`. The user reported incoherent town frontages, scattered fences/work items, crowded banks/crossings and a capped river; requested natural poppy formations and more flowers; chose a grain silo for the flat circle. The isolated secondary cuts become rain-fed pools with their dry crossing retained.

- `dev107-save.json.gz` is the frozen pre-change headless campaign fixture.
- `before-*.webp` are frozen native views made before runtime edits; do not regenerate them with current code.
- `after-*.webp` are current native contexts, including rescued specialists and a night town view. `review.cjs` generates them and the isolated references; renderer drawing is state-pure in the reviewed cases.
- `silo-reference.png` and `poppy-reference.png` preserve exact procedural art, not generated raster replacements. The relevant design handoffs retain their hashes.
- `layout-audit.json` lists all 115 moved records, preserves all 391 original prop IDs and records eighteen added decorative patches. All 58 enemy identities/locations/homes/dead states are retained in the fixture.
- `check.cjs` covers migration/save/access/shore geometry/occupied plots and the channel edge. Failed intermediate test-fixture setup and overly strict background-color sampling were corrected; final checks are the current reported evidence.

Veyra's ivory correction remains a separate unapproved preview. No character art changes belong to this update.
