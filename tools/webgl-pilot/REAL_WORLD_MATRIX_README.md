# Real game graphics: complete output-pipeline A/B matrix

New isolated diagnostic: `tools/webgl-pilot/real-world-matrix.html`. It operates on the current **actual Azeroth world renderer**, not a synthetic rectangle scene or handful of sprites.

## What a browser actually runs

An independent temporary campaign created with `new Campaign(...)`; no current saves are read. Original sprites/materials are warmed. At the selected region, zoom, backing size and natural day/night setting, the renderer produces exactly the game's current full world artwork (terrain, roads, building and actor visuals, lighting and occlusion) with a moving camera/hero. The optional simulation mode also calls the actual game `tick` once per frame, separately times that simulation, and compares all graphic paths at the same world state.

The four complete visible outputs are:
1. **Original Canvas:** the full unmodified game world renderer; direct Canvas drawing each frame.
2. **Original Canvas → full WebGL:** the exact same completed frame is uploaded via `texSubImage2D` and displayed by the GPU. This adds upload/present time; it does NOT speed up the original painting.
3. **Hybrid GPU ground + Canvas world:** the temporary in-memory diagnostic renderer excludes the static floor from subsequent Canvas redraws, presents it as a cropped WebGL texture, then paints all remaining game layers (terrain, roads, buildings, actors, night lighting, occlusion, effects) using current Canvas presentation. The source patch is bounded and fails closed if anchors are missing.
4. **Hybrid → full WebGL output:** the entire hybrid image is uploaded and displayed as one GPU frame, reporting the total hybrid+transfer+GPU cost.

For performance, distinguish the time of the whole pipeline from CPU painting and GPU commands. The original ground is pre-painted once, its GPU upload and GPU texture memory are explicitly reported. A pixel check compares full outputs on **three distinct moving frames**, with a 99.9% match threshold for direct WebGL copy and 99.5% for the hybrid, and the full results are tagged if these visual gates fail. The 14 sampled frames are not a reliable sample of end-to-end gameplay FPS, and no actual device results are claimed before an owner browser run.

## What is *not* implemented

There is **no independently authored native-WebGL renderer for the whole game**. The current production painter still provides all original textures/lighting and most procedural pixels. A synthetic WebGL GPU geometry lab and a separate real-art GPU-sprite-composition experiment exist, but neither can faithfully render full combat VFX and nighttime light blending without substantial additional work. Therefore the matrix **does not list a native GPU-only performance measurement**. Don't mislabel a GPU copy/compositor as a GPU-generated game.

Creating a true full GPU world means implementing GPU paths for floors, roads, tiles, authored and procedural props, individual character animation frames, depth occlusion/occlusion masks, lighting and screen/special blend operations, combat effects and equipment/cues, plus resource invalidation/context recovery. Both Canvas and GPU still need to match artwork precisely at all supported resolutions/zooms before a game setting can select the renderer.

## Preserve all graphics-testing workflows

- `tools/webgl-pilot/index.html`: real individual procedural/source sprite art via original Canvas, cached Canvas and WebGL texture quads.
- `tools/webgl-pilot/full-world.html`: full production Canvas world versus direct full-frame GPU display.
- `tools/webgl-pilot/hybrid.html`: real-world GPU ground and Canvas world experiment.
- `tools/webgl-pilot/strategy-lab.html`: 4 synthetic technology techniques including native GPU geometry; technical sample only.
- `tools/webgl-pilot/real-world-matrix.html`: 4 **complete real-game-art output pipelines** in one scene with an optional simulation step; true native full GPU still unavailable.

All these diagnostic pages remain independent from the GitHub Pages/PWA game, its saves/settings, its canonical multi-file architecture and any graphics changes to lamps. The same URLs are preserved. No broad CI tests were requested or necessary for this isolated benchmark publication.
