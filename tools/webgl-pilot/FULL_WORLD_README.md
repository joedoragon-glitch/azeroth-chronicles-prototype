# Complete-world Canvas / GPU presentation diagnostic

Open \`tools/webgl-pilot/full-world.html\` on GitHub Pages. This standalone page loads the current production module graph from the generated game entry **excluding the live app**, instantiates an independent fresh unsaved campaign and its unmodified production renderer, and draws a full region viewport. It supports all five outdoor regions, day/night, 100/150/175% zoom, three backing sizes including the owner's 2403×1248 Chromebook setting, and 18 scripted moving frames.

**What it actually proves:** Both visible canvases can display the same **fully painted** scene, including floor tiles, materials, terrain, roads, authored/procedural entities, buildings, original lamps/lighting, visual effects and occlusion. It checks RGB equality after GPU readback and reports Canvas paint, GPU transfer and GPU final presentation times separately.

**What it does not prove:** GPU acceleration of the game's expensive original drawing, or a 60 FPS forecast. The GPU side consumes the complete Canvas bitmap using \`texSubImage2D\` each frame, so the painting work has already happened. Faster WebGL composition alone is not a real renderer replacement. A moving full-scene compositor bridge is deliberately an integration/transfer baseline, not an optimized shipping backend. The HUD is DOM outside the game canvas, and no combat is automatically provoked in this reproducible sample.

**No game change:** There is no player setting, dependency, art replacement, shader in the game, engine modification, save change, active lighting edit, or new service-worker route. A fallback is trivial in the diagnostic because Canvas always remains visible; a production fallback cannot be claimed until there is an independent GPU renderer.

**Performance evidence:** The original 3-way procedural-object pilot remains at \`tools/webgl-pilot/index.html\`. Compare those results with the new *full scene* measurements, especially the full Canvas paint time; don't compare WebGL upload time to Canvas paint as if they were alternatives.

**Follow-up migration gate:** To earn a player-selectable GPU setting, independently draw/reuse complete world layers on the GPU with correct per-actor animation/dirty regions, preserved lighting and depth order, identical input/save behavior and hardware context-loss recovery. Measure total CPU+GPU frame cost at the same settings against original Canvas. No approval or implementation of such migration is implied by this diagnostic.

Full game and phone test suites were explicitly not requested for this isolated diagnostics-only change; no special PWA caching of the diagnostic assets is needed.
