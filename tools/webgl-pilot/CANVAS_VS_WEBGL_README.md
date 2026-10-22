# Direct head-to-head: Original Canvas Only vs WebGL2 Only

URL: `tools/webgl-pilot/canvas-vs-webgl.html`

**This is a TWO-METHOD diagnostic only.** No hybrid renderer is shown or timed. It does not touch the production app, campaign saves, gameplay, lighting code or approved graphics. It works on an independent unsaved real campaign and uses the original sprite and material catalogs and original game renderer.

**Left — Canvas Only:** the shipping `PrototypeRenderer` renders the entire visible world at its normal 2D resolution on every scripted camera frame, including the real artwork, terrain/roads, actors, occlusion, lighting and effects.

**Right — WebGL2 Only during measured frames:** the entire **same authentic world** is prepared with the game renderer into an enlarged original-art texture **once before measurement**. WebGL2 then draws that GPU-resident texture with its own GLSL shader and geometry while following the scripted moving camera. The right-side timed frame loop does not call any Canvas drawing functions, upload a new frame or hybrid-composite a Canvas output. GPU texture allocation and upload and the initial full world art painting are reported separately. It is a GPU-only frame *presentation* path, **not** a full native procedural WebGL game renderer.

**Crucial limitation:** this is *not* a like-for-like final performance comparison. The GPU version reuses static artwork and cannot yet update the original actors' animations, dynamic effects, changing combat state or screen-space lighting changes as the live Canvas scene does. Its faster frame time, if any, is not evidence that a full WebGL2-only game would have that FPS. The report explicitly returns `renderingWorkEquivalent: false` and withholds a fair winner. Both first-position and later moving-camera pictures are compared against the live reference; their pixel match and worst differences are reported.

**Why this intermediate experiment exists:** The owner wants a genuine two-column Canvas/WebGL test using *actual* Azeroth assets, not synthetic shapes, hidden empty procedural scenery or a misleading Canvas-plus-WebGL hybrid benchmark. This page provides that test with honest attribution. A proper fully WebGL2-native implementation of all the original procedural vector artwork, actor movement and lighting remains major engineering work; no such complete renderer exists and one must not be claimed from the diagnostic alone.

These remain available as separate investigations, without replacing or constraining this direct two-option page:

- `index.html` — real sprite and procedural-art composition.
- `full-world.html` — complete game frame Canvas to GPU transfer.
- `hybrid.html` — retained GPU ground and Canvas foreground.
- `real-world-gpu.html` — two-layer GPU compositor and full-frame transfer, with per-layer pixel accuracy investigation.
- `strategy-lab.html` — technology choices with synthetic geometry.

User-requested CI constraint: publication should run the existing one-time diagnostic packaging path and avoid broad game/phone regression suites, while still running the site's required packaging validation.
