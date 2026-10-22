# GPU trial: real procedural objects and original sprites

**Diagnostic only.** The live game keeps its Canvas renderer; no setting, graphics, gameplay, save, lamp or audio code is changed.

The page compares three ways of drawing a deterministic selection of visible game entities: **Original Canvas** repaints their original procedural artwork each frame, **Cached Canvas** draws those same illustrations baked into image tiles, and **WebGL2** draws those same baked illustrations via GPU textures. Authored sprites are included alongside procedural objects. Both cached paths use the same source pixels and original isometric locations and depth ordering.

## Open the published diagnostic

\`/tools/webgl-pilot/index.html\` on the existing GitHub Pages site, choose Vale, Frontier or Crown and click **Run procedural graphics comparison**.

A first pass bakes up to 72 nearby procedural objects; actual counts, kinds and exclusions are reported. Baking, sprite decoding, GPU uploading, atlas page memory, visible-art agreement, median and p95 timings are reported separately. If direct-to-cached or cached-to-GPU visual agreement fails, the demo suppresses the timing claim.

The approach is explicitly **static artwork for this experiment**. It does not yet solve animated visual invalidation, dynamic camera/world floor tiles, occlusion, lighting, combat effects or HUD. The art is painted into textures by the existing Canvas procedural artist, not magically rewritten as GPU drawing commands. A claimed production speedup must account for when those textures have to be rebuilt and whether both CPU and GPU memory are affordable.

**Do not treat this as a whole-game FPS result, a completed renderer replacement, or permission to remove any lamp.** A player setting for GPU rendering is not safe until it can paint the full game, preserve layer order, recover from WebGL context loss, and reliably revert to the original implementation.

The build explicitly serves the diagnostic page and script; the PWA service worker leaves the diagnostic route alone. No extra game tests or new external JavaScript dependencies are required for the standalone trial.
