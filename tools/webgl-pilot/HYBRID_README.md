# Hybrid graphics diagnostic — GPU ground, Canvas world

This is the **fourth isolated experiment** and does not supersede the earlier comparisons.

- `index.html`: procedural sprite/character art: original Canvas, cached Canvas and WebGL texture composition.
- `full-world.html`: full production renderer drawing all world layers, then copying that entire painted frame into WebGL. Separates paint/transfer/display times.
- `hybrid.html`: **new true split of drawing work**: the original renderer paints a larger margin-padded static base floor just once; WebGL displays the relevant portion as the camera moves, while the normal Canvas pipeline paints all other layers on top (terrain/roads/structures/actors/effects/lighting/occlusion). Compares full original Canvas versus this hybrid pixel-by-pixel and times complete hybrid frames, not just GPU display.

The hybrid test fetches the current `src/prototype/renderer.js` and temporarily derives a `floor` / `overlay` variant **in browser memory**. Production code and the shared PWA source, saved campaigns, lamp appearances, lighting algorithms, enemy AI and build information remain untouched. The diagnostic source patch is fail-closed: if the original renderer's expected code boundaries change, it stops rather than silently producing a misleading result.

The GPU window includes a 160-physical-pixel margin around a camera snapshot. Moving between nearby viewpoints reuses this floor texture instead of rebuilding every frame. Costs to paint, upload and store the full ground texture are reported separately; these are not free and cannot be extrapolated to unlimited maps/camera travel. The crop is valid only within this bounded margin.

The two full scenes are rendered separately using the identical current campaign and same presentation assets, with original night lamps included, but frame times and GPU compositing differences can introduce small pixel mismatches. The report includes the true full-original time, combined hybrid time, separate GPU-floor/2D compositing/Canvas-foreground costs, and pixel parity. Any visual mismatch invalidates the performance claim; no graphical quality downgrade is accepted.

## No premature migration

Do **not** add a player renderer setting or remove the previous diagnostic pages based on this experiment. A complete shipping GPU path would need independent GPU work for more layers, efficient invalidation for animation, fallback/recovery, save and gameplay integrity and full moving-scene accuracy across zooms and regions.

This optional diagnostic is not registered in the game, PWA offline inventory or player settings. No dependency was installed. Broad CI/gameplay/browser suites are not necessary for publishing the standalone comparison; the experiment's **actual GPU performance still needs a browser run**.
