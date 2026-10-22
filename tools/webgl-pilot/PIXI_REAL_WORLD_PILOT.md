# PixiJS real-Azeroth WebGL2 pilot (pre-integration)

**Isolated experiment. Not the live game and not yet approved for the player renderer selector.**

## The simplified approach

PixiJS v8 supplies the WebGL2 renderer, sprite scene graph, atlas textures and GPU gradients. We do **not** need to hand-write every WebGL shader or recreate approved designs as abstract rectangles.

A dedicated two-column development page is at `tools/webgl-pilot/pixi-real-world.html` **on the preparation branch only**. It has not been deployed to GitHub Pages.

- Left: the actual shipping Canvas renderer, repainting full live Azeroth each frame.
- Right: actual PixiJS WebGL2 with a once-prepared original terrain/roads background, **independent original sprite nodes** (position/animation updated per frame), and GPU gradients for native lamp glows. Procedural entities each become their own cropped image texture prepared once by the approved Canvas artist, not one giant full-scene screenshot moved on the GPU. Actor positions and frames still change in the GPU scene graph.
- The same unsaved game state and camera path feed both. The right-side measured frame uses PixiJS actor transforms and GPU rendering; no Canvas-generated completed frames are copied per frame.
- Report includes median/p95 frame costs, setup costs, body texture budget, actor/light counts, and original-vs-Pixi screenshot pixel differences at first and last measured frames when extractable.

### IMPORTANT limitations

This is **not yet parity-certified**. Procedural bodies are initially frozen images although their GPU sprite positions move; native outline contours, in-world labels, many transient combat cues, fixture details, and exact Canvas night screen blending are still incomplete. It would be misleading to declare a graphics winner based on these frame timings.

The diagnostic deliberately uses the shipping `PrototypeSprites.definitionFor` selections: **Paladin and Mage are procedural**, not old generic sprite substitutions. It can render approved raster animation frames (including the actual goblin idle clips) and one-time baked procedural bodies, but it must preserve their existing visual details when animation is fully ported. Missing artwork fails rather than silently disappearing.

Use of Canvas for one-time original static asset preparation is *not* a per-frame hybrid renderer; that artwork then lives in GPU textures. However, the preparation cost and static procedural-body limitation must be counted honestly. For release, time-dependent procedural bodies and effects need original state/animation-driven texture updates or native GPU commands, with bound memory and zero visual degradation.

### Dependency and offline packaging

This **development page only** pins `pixi.js@8.22.0` via the official published jsDelivr npm distribution. It therefore requires network for PixiJS on an uncached browser. **Before any playable PWA integration**, install/pin the package in the project and self-host/bundle its library assets under the normal multi-file site inventory and offline cache; no gameplay feature may depend on an external CDN.

Official references:
- PixiJS v8 Application: https://pixijs.com/8.x/guides/components/application
- v8 Textures: https://pixijs.com/8.x/guides/components/textures
- v8 GPU Graphics gradients: https://pixijs.com/8.x/guides/components/scene-objects/graphics/graphics-fill
- v8.22.0 published release: https://github.com/pixijs/pixijs/releases/tag/v8.22.0

### Acceptance before the in-game selector

1. The standalone page must first load under actual WebGL2 hardware, show all real actors, move sprites and camera, advance live animations and show actual lamps. This has **NOT** been tested yet, because a browser session with the published PixiJS dependency and full multi-file game tree was not available during branch-only work.
2. Compare exact dynamic scene output with Canvas through daylight/night, every region, dungeons, 100/150/175% zoom, effects, combat and all building/prop types. Missing entities/lamp or low pixel parity is a blocker; don't lower thresholds.
3. Measure equivalent full-game drawing/simulation, texture prep and p95, GPU memory, actual Chromebook/browser, offline startup and WebGL context-loss fallback.
4. **Only with further explicit approval** integrate a device-only `Canvas 2D (default)` / `WebGL2` selector into the playable game. Keep the separate original Canvas alive as safe fallback. No hybrid option.

### What was validated so far

The isolated Pixi scene bridge's five focused JavaScript/mock-Pixi tests passed: moving/reusing actor sprites, caching atlas frames, rejecting missing imagery atomically, dynamically moving screen-blended lamp gradients, and correct isometric actor depth order. Original renderer patch anchors and diagnostic HTML script/ID references matched the shipping source in a static check. **No actual PixiJS GPU hardware, runtime asset loading, or visual parity result has yet been established.**

The staged readiness receipt remains `NOT_READY`, and no live game, Settings, service worker, site inventory or main branch file has been modified by this work.
