# Graphics strategy laboratory: four possible rendering methods

This is an **isolated, opt-in technical comparison**, not a new production graphics setting or a claim about the live game's FPS.

## Choices available to an owner or future playtester

1. **Original Canvas 2D** — programmatically draw each shape directly each frame.
2. **Native WebGL** — construct and shade the same geometry directly using GPU triangles; no Canvas painting.
3. **Canvas-made artwork → WebGL** — make the reference artwork using Canvas once, upload it to a GPU texture atlas, and reuse it without repainting each frame.
4. **Purposeful hybrid** — WebGL constructs/backgrounds static world geometry; Canvas handles separately changing foreground actors and scenery via a transparent overlay.

The synthetic strategy laboratory `tools/webgl-pilot/strategy-lab.html` compares all four simultaneously from one deterministic, moving sample (100–3,600 objects, 960×540 or 1600×900). It records the timing for the **complete method**, p95 and median, preparation and GPU upload, and image agreement. It does not misrepresent native GPU shapes or the synthetic rectangles as existing game art. A preferred-method control and optional comments create a **copyable feedback report**. No network reporting, automatic surveys, accounts or save changes are introduced.

## Existing real-game workflows must remain

- `tools/webgl-pilot/index.html`: real procedural scenery/character art and authored sprites across original Canvas, cached Canvas and WebGL textures; includes preparation cost and pixel checks.
- `tools/webgl-pilot/full-world.html`: complete original Azeroth world scene including lighting, roads, effects, actors and terrain. The GPU displays a fully painted Canvas frame. Its GPU display speed is *not* a renderer performance win.
- `tools/webgl-pilot/hybrid.html`: isolated GPU-painted reusable ground plus Canvas foreground scenery, actor effects and lighting, with parity checks. This is **one hybrid split**, not a claim that ground is always the best place to divide work.
- `tools/webgl-pilot/strategy-lab.html`: technology matrix and copyable tester feedback for the four broad methods.

Do not remove or conflate these diagnostics: each answers a distinct question.

## Future selectable game settings (NOT implemented or approved by this test)

It may eventually be useful to offer all four methods as `Graphics Renderer` choices, with Original as a safe default. If so, first establish for **each** option how it handles all production layers: procedural terrain/scenery, true animated actors, occlusion, lighting, combat cues, road geometry, static/dynamic invalidation, screen size/camera changes, WebGL context loss and automatic fallback.

The eventual **purposeful hybrid** should be configurable by measured layer capabilities rather than a hard-coded GPU-floor split. Suggested measurements for every method: actual device frame cadence, complete frame CPU+GPU time and p95, preparation/invalidation cost, GPU/CPU memory, exact output parity, moving scenes, full daylight/nighttime, combat and lost-context recovery. No renderer choice should silently remove art, skip original lamps, change camera/sharpness to claim gain, or alter save state.

Current deliverable is one new separate diagnostic page and links/docs, with no changes to the real game renderer, graphics settings, lamps, simulation, build version, sprites, service worker or save keys. A targeted single-use release process publishes only the diagnostic files without launching broad test suites.
