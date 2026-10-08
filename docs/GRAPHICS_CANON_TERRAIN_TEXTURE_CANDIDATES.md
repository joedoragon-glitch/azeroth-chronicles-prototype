# Terrain texture candidate catalog · 8 October 2026

Joel asked to include terrain in the sprite reconciliation. These 28 material candidates extend the art scope separately from the 280 isolated body-sprite jobs. They are generation candidates after their current reference and terrain processing contract are prepared. Their resource keys are planned asset identities, not supported entries in the existing actor sprite resolver. Nothing is activated by this catalog.

The first terrain pilot covers the five outdoor ground materials (T001–T005). Expand to roads, floors and rock/timber surfaces after checking seamless repetition, camera stability, day/night actor and danger-cue readability, decoded memory and phone/Chromebook frame time. Additional rotated/alternate tile variants are evidence-driven follow-ups, not automatically multiplied jobs.

## Generation contract

Generate exactly one opaque, seamless square material texture per call, flat top-down with neutral unlit shading. The renderer projects and clips it into the world. Preserve current palette and material identity, adding restrained fine surface detail. No transparent sprite padding, isometric diamond silhouette, scenery, objects, symbols, perspective, baked shadows, hard borders or map layout. Avoid strong repeated motifs and high-contrast noise. Export/inspect a 3×3 wrap preview assembled from the single output; verify opposite-edge continuity and repetition at gameplay scale. A prompt saying seamless does not prove seamless pixels. Target 256×256 lossless texture output initially; world span and decoded budget remain provisional until the pilot is measured. Keep generated masters and source/reference hashes.

## Candidates

| ID | Planned resource key | Current material |
| --- | --- | --- |
| T001 | `terrain:ground:vale` | Greenwood Vale ground |
| T002 | `terrain:ground:march` | Flooded Marches ground |
| T003 | `terrain:ground:highlands` | Ironroot Highlands ground |
| T004 | `terrain:ground:frontier` | Ashen Frontier ground |
| T005 | `terrain:ground:crown` | Dark Crown ground |
| T006 | `terrain:road:vale` | Greenwood Vale road material |
| T007 | `terrain:road:march` | Flooded Marches road material |
| T008 | `terrain:road:highlands` | Ironroot Highlands road material |
| T009 | `terrain:road:frontier` | Ashen Frontier road material |
| T010 | `terrain:road:crown` | Dark Crown road material |
| T011 | `terrain:floor:crypt` | Crypt floor material |
| T012 | `terrain:floor:archive` | Archive floor material |
| T013 | `terrain:floor:mine` | Mine floor material |
| T014 | `terrain:floor:abyss` | Abyss floor material |
| T015 | `terrain:floor:citadel` | Citadel floor material |
| T016 | `terrain:floor:supply-vale` | supply-vale floor material |
| T017 | `terrain:floor:supply-march` | supply-march floor material |
| T018 | `terrain:floor:supply-highlands` | supply-highlands floor material |
| T019 | `terrain:floor:supply-crown` | supply-crown floor material |
| T020 | `terrain:floor:side-vale-cellars` | Greenwood Vale side-interior floor material |
| T021 | `terrain:floor:side-march-watchhouse` | Flooded Marches side-interior floor material |
| T022 | `terrain:floor:side-highlands-signal` | Ironroot Highlands side-interior floor material |
| T023 | `terrain:floor:side-frontier-shrine` | Ashen Frontier side-interior floor material |
| T024 | `terrain:floor:side-crown-foundry` | Dark Crown side-interior floor material |
| T025 | `terrain:rock:cliff-ravine` | Cliff/ravine stone face material |
| T026 | `terrain:rock:obsidian` | Obsidian surface material |
| T027 | `terrain:lava:crust` | Lava crust material |
| T028 | `terrain:bridge:wood-grain` | Wooden bridge timber grain |

### T001 — Greenwood Vale ground

**Resource key:** `terrain:ground:vale`

**Current renderer owner:** `floor/groundDetail/terrain`

**Palette reference:** #294b36, #31583e, #203e30, #95ad80

**Canonical cues:** Muted woodland-green ground with subtle brown soil, sparse fine grass and leaf-grain detail.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #294b36, #31583e, #203e30, #95ad80. Muted woodland-green ground with subtle brown soil, sparse fine grass and leaf-grain detail. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T002 — Flooded Marches ground

**Resource key:** `terrain:ground:march`

**Current renderer owner:** `floor/groundDetail/terrain`

**Palette reference:** #26444b, #31535a, #203b42, #85ada6

**Canonical cues:** Muted teal-green marsh earth with darker damp mud and restrained reed/grass grain. No puddles.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #26444b, #31535a, #203b42, #85ada6. Muted teal-green marsh earth with darker damp mud and restrained reed/grass grain. No puddles. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T003 — Ironroot Highlands ground

**Resource key:** `terrain:ground:highlands`

**Current renderer owner:** `floor/groundDetail/terrain`

**Palette reference:** #485447, #56614d, #3b493f, #b1b59a

**Canonical cues:** Muted gray-green quarry earth with subdued dust and fine mineral grit.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #485447, #56614d, #3b493f, #b1b59a. Muted gray-green quarry earth with subdued dust and fine mineral grit. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T004 — Ashen Frontier ground

**Resource key:** `terrain:ground:frontier`

**Current renderer owner:** `floor/groundDetail/terrain`

**Palette reference:** #50413b, #5d4b42, #423732, #b9987b

**Canonical cues:** Muted warm gray-brown ash/char earth with subdued grit and dry weathering. No embers.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #50413b, #5d4b42, #423732, #b9987b. Muted warm gray-brown ash/char earth with subdued grit and dry weathering. No embers. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T005 — Dark Crown ground

**Resource key:** `terrain:ground:crown`

**Current renderer owner:** `floor/groundDetail/terrain`

**Palette reference:** #343644, #414351, #2c2f3c, #a09b9e

**Canonical cues:** Muted slate-violet earth with restrained fine mineral/obsidian grain. No purple glow.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #343644, #414351, #2c2f3c, #a09b9e. Muted slate-violet earth with restrained fine mineral/obsidian grain. No purple glow. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T006 — Greenwood Vale road material

**Resource key:** `terrain:road:vale`

**Current renderer owner:** `roads`

**Palette reference:** #564834, #8e7758, #9c8664, #6f604c

**Canonical cues:** Packed woodland-soil road, warm muted brown grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #564834, #8e7758, #9c8664, #6f604c. Packed woodland-soil road, warm muted brown grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T007 — Flooded Marches road material

**Resource key:** `terrain:road:march`

**Current renderer owner:** `roads`

**Palette reference:** #4b5043, #756e57, #8e8367, #5a6354

**Canonical cues:** Packed marsh/mud track, muted olive-brown fine grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #4b5043, #756e57, #8e8367, #5a6354. Packed marsh/mud track, muted olive-brown fine grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T008 — Ironroot Highlands road material

**Resource key:** `terrain:road:highlands`

**Current renderer owner:** `roads`

**Palette reference:** #4e4d46, #87857a, #a29f8e, #6e6d66

**Canonical cues:** Weathered gray quarry-stone paving material, fine mineral grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #4e4d46, #87857a, #a29f8e, #6e6d66. Weathered gray quarry-stone paving material, fine mineral grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T009 — Ashen Frontier road material

**Resource key:** `terrain:road:frontier`

**Current renderer owner:** `roads`

**Palette reference:** #51443e, #7c6c61, #8c7c6d, #625750

**Canonical cues:** Muted ash-brown wagon-road material, fine dry grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #51443e, #7c6c61, #8c7c6d, #625750. Muted ash-brown wagon-road material, fine dry grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T010 — Dark Crown road material

**Resource key:** `terrain:road:crown`

**Current renderer owner:** `roads`

**Palette reference:** #3f3d45, #66636e, #827d89, #55525d

**Canonical cues:** Ordered dark slate-violet paving material, fine stone grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #3f3d45, #66636e, #827d89, #55525d. Ordered dark slate-violet paving material, fine stone grain. Road margins, joints, wagon ruts and junctions stay in the renderer; do not bake them into the tile. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T011 — Crypt floor material

**Resource key:** `terrain:floor:crypt`

**Current renderer owner:** `floor/dungeonFloors`

**Palette reference:** #343c39, #414945, #2b3331, #a9b1a0

**Canonical cues:** Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #343c39, #414945, #2b3331, #a9b1a0. Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T012 — Archive floor material

**Resource key:** `terrain:floor:archive`

**Current renderer owner:** `floor/dungeonFloors`

**Palette reference:** #30464a, #3b5558, #283d42, #8fb6b4

**Canonical cues:** Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #30464a, #3b5558, #283d42, #8fb6b4. Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T013 — Mine floor material

**Resource key:** `terrain:floor:mine`

**Current renderer owner:** `floor/dungeonFloors`

**Palette reference:** #44433b, #524f43, #39382f, #ada88c

**Canonical cues:** Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #44433b, #524f43, #39382f, #ada88c. Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T014 — Abyss floor material

**Resource key:** `terrain:floor:abyss`

**Current renderer owner:** `floor/dungeonFloors`

**Palette reference:** #44373b, #544349, #382f34, #c09a89

**Canonical cues:** Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #44373b, #544349, #382f34, #c09a89. Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T015 — Citadel floor material

**Resource key:** `terrain:floor:citadel`

**Current renderer owner:** `floor/dungeonFloors`

**Palette reference:** #3b414b, #494f59, #303640, #abb3b5

**Canonical cues:** Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #3b414b, #494f59, #303640, #abb3b5. Restrained current interior stone/mineral material with fine worn grain and low-contrast chips. Preserve the current floor palette. Slab outlines and wall/room boundaries stay procedural; no drawn joints, symbols, props or water. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T016 — supply-vale floor material

**Resource key:** `terrain:floor:supply-vale`

**Current renderer owner:** `floor/treasuryFloors`

**Palette reference:** #514735, #5e523c, #433b2e, #bca978

**Canonical cues:** Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #514735, #5e523c, #433b2e, #bca978. Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T017 — supply-march floor material

**Resource key:** `terrain:floor:supply-march`

**Current renderer owner:** `floor/treasuryFloors`

**Palette reference:** #3f5149, #4b6258, #33443f, #9fb69c

**Canonical cues:** Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #3f5149, #4b6258, #33443f, #9fb69c. Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T018 — supply-highlands floor material

**Resource key:** `terrain:floor:supply-highlands`

**Current renderer owner:** `floor/treasuryFloors`

**Palette reference:** #55534b, #636056, #46443e, #b9ae91

**Canonical cues:** Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #55534b, #636056, #46443e, #b9ae91. Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T019 — supply-crown floor material

**Resource key:** `terrain:floor:supply-crown`

**Current renderer owner:** `floor/treasuryFloors`

**Palette reference:** #44404b, #514b59, #37343e, #aa96b0

**Canonical cues:** Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #44404b, #514b59, #37343e, #aa96b0. Restrained current treasury floor material with fine worn grain and low-contrast chips. Preserve current regional color/material relationships; furniture, slab seams, room partitions and contextual household details stay procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T020 — Greenwood Vale side-interior floor material

**Resource key:** `terrain:floor:side-vale-cellars`

**Current renderer owner:** `floor/regional-interior-fallback`

**Palette reference:** #294b36, #31583e, #203e30, #95ad80

**Canonical cues:** Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #294b36, #31583e, #203e30, #95ad80. Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T021 — Flooded Marches side-interior floor material

**Resource key:** `terrain:floor:side-march-watchhouse`

**Current renderer owner:** `floor/regional-interior-fallback`

**Palette reference:** #26444b, #31535a, #203b42, #85ada6

**Canonical cues:** Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #26444b, #31535a, #203b42, #85ada6. Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T022 — Ironroot Highlands side-interior floor material

**Resource key:** `terrain:floor:side-highlands-signal`

**Current renderer owner:** `floor/regional-interior-fallback`

**Palette reference:** #485447, #56614d, #3b493f, #b1b59a

**Canonical cues:** Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #485447, #56614d, #3b493f, #b1b59a. Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T023 — Ashen Frontier side-interior floor material

**Resource key:** `terrain:floor:side-frontier-shrine`

**Current renderer owner:** `floor/regional-interior-fallback`

**Palette reference:** #50413b, #5d4b42, #423732, #b9987b

**Canonical cues:** Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #50413b, #5d4b42, #423732, #b9987b. Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T024 — Dark Crown side-interior floor material

**Resource key:** `terrain:floor:side-crown-foundry`

**Current renderer owner:** `floor/regional-interior-fallback`

**Palette reference:** #343644, #414351, #2c2f3c, #a09b9e

**Canonical cues:** Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #343644, #414351, #2c2f3c, #a09b9e. Current regional interior floor palette with subdued worn mineral grain and fine chips. Use the existing interior treatment, not outdoor grass, foliage, mud puddles or a newly invented architectural style. Keep drawn slab joints and room edges procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T025 — Cliff/ravine stone face material

**Resource key:** `terrain:rock:cliff-ravine`

**Current renderer owner:** `terrain`

**Palette reference:** #494b43, #616357, #222729, #30363a, #726c5d

**Canonical cues:** Subdued gray-green stone-face grain and fine fracture texture. No drawn cliffs, ledges, silhouettes, perspective or cast shadows; existing exact barrier rims and fractures remain procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #494b43, #616357, #222729, #30363a, #726c5d. Subdued gray-green stone-face grain and fine fracture texture. No drawn cliffs, ledges, silhouettes, perspective or cast shadows; existing exact barrier rims and fractures remain procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T026 — Obsidian surface material

**Resource key:** `terrain:rock:obsidian`

**Current renderer owner:** `terrain`

**Palette reference:** #302f39, #403b4d, #625568

**Canonical cues:** Subdued dark violet-gray obsidian mineral grain; low contrast, no glowing veins or symbols. Existing rock/pool outlines stay procedural.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #302f39, #403b4d, #625568. Subdued dark violet-gray obsidian mineral grain; low contrast, no glowing veins or symbols. Existing rock/pool outlines stay procedural. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T027 — Lava crust material

**Resource key:** `terrain:lava:crust`

**Current renderer owner:** `terrain`

**Palette reference:** #672f28, #54413e, #b44e2c

**Canonical cues:** Subdued dark reddish-brown cooled crust grain. No glowing branching seams, cracks opening into new holes or light emission. Current hot seams and animated lava remain procedural overlays.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #672f28, #54413e, #b44e2c. Subdued dark reddish-brown cooled crust grain. No glowing branching seams, cracks opening into new holes or light emission. Current hot seams and animated lava remain procedural overlays. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

### T028 — Wooden bridge timber grain

**Resource key:** `terrain:bridge:wood-grain`

**Current renderer owner:** `bridges`

**Palette reference:** #b49468, #705338, #665039, #4b3929, #e0c394

**Canonical cues:** Restrained weathered brown timber grain. No drawn plank boundaries, pins, rails, supports, bridge silhouette or baked perspective; grain aligns with the actual timber direction during integration.

**Image-generation prompt:**

> Create exactly one opaque seamless square 2D game material texture for Azeroth Chronicles, flat top-down, neutral unlit material, no baked perspective or shadows. Preserve the current procedural reference and these palette relationships: #b49468, #705338, #665039, #4b3929, #e0c394. Restrained weathered brown timber grain. No drawn plank boundaries, pins, rails, supports, bridge silhouette or baked perspective; grain aligns with the actual timber direction during integration. Add only restrained fine material detail with small-gameplay-scale readability. Tile continuously on both axes. No labels, UI, scene, objects, hard borders, repeated emblem or map geometry.

## Procedural owners and implementation gates

Exact terrain outlines, river banks, ravines, cliffs, lava boundaries, roads/junctions, bridge/ferry rectangles, room/partition geometry and walkability stay source-owned. Water flow, hot lava seams, warnings, atmospheric effects and lighting remain procedural. Texture grain is clipped to those surfaces, anchored in world space and drawn beneath actors/cues. Keep the seeded broad material patches and useful small nature accents instead of flattening the landscape into obvious repeated tiles. Water is not a static-wave sprite job in this initial scope.

The body-sprite processor enforces transparent margins and exact actor keys; it is unsuitable for opaque textures. Prepare a dedicated material validation/registration path and offline inventory before integrating these resources. Seamless-wrap QA, world mapping, mip/scale filtering and LRU/decoded budget measurement belong to the terrain pilot. Keep the current procedural terrain as fallback. Do not generate full-map backgrounds or redraw collision to fit art.

Source evidence: current `floorPalettes`, `dungeonFloors`, `treasuryFloors`, `groundDetail`, `floor`, `terrain`, `roads` and `bridges` in `visuals.js`; floor clipping/order in `renderer.js`; authored boundaries in `rules.js`. Historical `TERRAIN_EFFECTS_POLISH_V0880.md` remains the geometry/readability contract. `tools/sprites/terrain-specifications.json` records planned identities and provisional material policy; the main isolated-sprite catalog keeps stable IDs and totals.
