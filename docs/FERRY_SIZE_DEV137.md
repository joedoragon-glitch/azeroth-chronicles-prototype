# Ferry proportion correction — dev.137

Joel reported that the selected ferry and ferryman were too small, and requested at least a 50% larger implementation from the original image. Retain the selected option 3 design; no new design or generated image is necessary.

The display frame changes from 144×72 to 216×108, exactly 1.5 times each dimension with the same existing 1.35 presentation multiplier. A fresh lossless 918×459 WebP is sampled once from the untouched 1774×887 selected original; the previous reduced runtime image is not used as a source. The source hash remains 19d990901d6538a796fdd132842da1d04c219afa2f47f5eb8b991e24617ae336. The ferry-specific raster dimension allowance is 1024; all other assets retain the existing policy.

The matching procedural fallback scales by the same factor. In Highlands the larger hull has a separate presentation center (260,2020), floating off the dock, while the reachable boarding NPC remains at (300,1995). No fare, landing, dock geometry, Wraith gate, saved progress or interaction range changes.

WIP checkpoint: candidate, source and six native renderer captures are prepared; final registry replacement, focused checks, build and package-only publication remain. Highlands tribute work remains saved separately on fix/highlands-tribute-dev137; future Highlands coast work remains annotation only.
