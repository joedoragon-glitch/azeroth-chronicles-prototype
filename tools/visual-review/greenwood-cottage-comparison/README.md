# Greenwood cottage comparison

Joel requested a side-by-side view of the current procedural cottage and the registered sprite because the procedural art may now look better. This is a read-only comparison, not authorization to replace assets or audit every sprite.

`comparacion-casas.png` renders the exact current `vale-cottage` procedural drawing on the left and active `prop:vale-cottage:vale` registration on the right. Both use the same real Greenwood prop, authored 1.4 feature scale, ground anchor, backdrop and camera magnification. Top: 4× detail view. Bottom: 150% camera. No AI generation, repainting, gameplay changes or registry edits.

The procedural cottage has a visible chimney, layered door recess, doorstep, timber details and side depth; the registered sprite has textured plaster and roof tiles, but a flatter silhouette and no chimney. The procedural drawing reads more consistently with the current outlined characters in this comparison. This single pair does not establish which version is better for all registered assets.

Source: dev.115, published PR #349; source digest, real entity and registration preserved in `evidence.json`. Reproduce with `node tools/visual-review/greenwood-cottage-comparison/render.cjs`. Render state purity and both runtime paths verified. No tests, build, CI or game publication required for this review artifact.
