# Real Azeroth artwork — full-scene Canvas vs layered WebGL

Open `tools/webgl-pilot/real-world-gpu.html` on the public site. This experiment is **independent of the actual game app**, uses an unsaved campaign and identical live sprite/material catalogs, and preserves all prior graphics benchmarks.

## What the three images mean

**Full original Canvas**: The unmodified production `PrototypeRenderer` draws the complete world each moving frame.

**GPU-composited game world**: A separate in-memory renderer variant bakes the original floor, terrain, roads and bridges once into a margin-padded texture, which stays resident on the GPU as the camera moves. The real game's procedural drawings, sprites, buildings, actors, occlusion, night lamps, shadows and other dynamic effects are produced into a transparent Canvas layer each frame. WebGL uploads **that dynamic layer**, composes it over the retained world background with GPU triangles and alpha blending, and displays the **complete scene from a WebGL canvas**. This does *not* upload the finished original Canvas frame; it is a distinct layered rendering path and can avoid repeating certain original Canvas world work.

**Full-frame Canvas → WebGL**: The unmodified Canvas path first paints the whole world, then uploads that full completed picture to a second WebGL canvas. This isolates frame upload overhead. It must not be confused with accelerated drawing.

Each path uses the current game renderer and **real** original game artwork, including day/night, authored materials, shadows and lights, and a scripted moving camera through five outdoor zones. No rectangles, placeholder art, omitted procedural entities, reductions in resolution, PWA settings, gameplay or saves.

The built-in visual comparison reads pixels from both GPU canvases and compares to the reference Canvas at the first and last measured camera positions. The report includes pixel match and differences, median/p95 complete frame cost per method, CPU repaint time for the dynamic layer, per-frame GPU uploads, GPU compositing time, one-time ground/terrain painting time, upload/preparation and resident texture memory. If visual parity is below threshold (99.5% for layered GPU, 99.9% for full-frame transfer), timing must **not** be used to justify shipping.

## What is NOT complete

This is a **WebGL world compositor using original Canvas-created art textures**, *not* a native procedural GPU renderer. Canvas still generates complex dynamic characters and lighting. There is no evidence yet for the speed of a fully native GPU implementation of all game drawing operations. Converting the 500KB+ of bespoke procedural Canvas art commands to native WebGL meshes/shaders, preserving animation, tinting, lighting blend modes, depth occlusion, materials, fonts and gameplay cues, is a separate substantial task. We must not mislabel the fast GPU final draw as replacing all those expensive CPU operations.

This real-world test is complementary to four preserved diagnostics:

- `index.html`: three-way comparison of authentic procedural actor/prop artworks and manifest sprites, excluding full world.
- `full-world.html`: whole-world original Canvas versus uploading the **finished** frame to WebGL.
- `hybrid.html`: GPU cached floor overlaid with Canvas-rendered world and lighting.
- `strategy-lab.html`: genuine GPU-native simple geometry versus Canvas/texture/hybrid methods, but uses synthetic shapes and does **not** cover approved real art.

There is **no renderer selection in the shipping game's Settings**. All experimental pages are separate from the PWA's normal gameplay, and the production source and all sacred lamps are untouched.

The work shown here is a bounded, static-region, scripted-motion diagnostic. Real combat, roaming across cache boundaries, night animations that require static-world invalidation, WebGL context loss/recovery, memory pressure and true end-to-end FPS must be handled before enabling it for players.

## 22 October parity investigation (diagnostic v2)

The 150% zoom Greenwood Vale reports showed GPU-layer match of **98.777% at night** and **97.704% in daylight**, while the complete already-Canvas-painted frame transferred to WebGL matched **100%**. The daytime result falsifies the initial assumption that night-lamp screen blending alone caused the mismatch. Neither speed result is accepted for production, and existing art and lighting remain unchanged.

Version 2 retains full original scene drawing and its GPU variants but adds a focused difference-location analysis, not a graphics shortcut: frame 0 uses precisely the static background cache's camera position; later frames move. For both first and final frames, a CPU Canvas-only composition of that exact cached background and real dynamic artwork is compared with the production reference and with the GPU composition. Pixel differences are also classified by whether the dynamic Canvas layer is transparent, translucent, or opaque. This distinguishes resampled static scenery/background offsets, Canvas layering semantics and GPU texture/blending paths without guessing or relaxing thresholds. These two Canvas readbacks and comparisons are outside the timed frame measurements.

The diagnostic still **does not** provide a native WebGL-only recreation of all game procedural art, active gameplay FPS, or a player graphics setting. Use the new parity analysis before making any further lighting or shader changes; preserve all previous test methods.
