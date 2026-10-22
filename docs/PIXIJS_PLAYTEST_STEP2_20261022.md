# PixiJS optional renderer — Step 2 implementation checkpoint (22 October 2026)

**STATUS: BRANCH-ONLY. NOT TESTED, MERGED OR DEPLOYED.**

The owner requested five separate chat checkpoints. This branch contains Step 2 implementation only. Review, tests, CI, merge and publication belong to subsequent steps.

## Baseline and scope

- Starting main: 869049797d5e29270886871c89068f648c1f2a6c; package.json/build-info/sw identify 0.9.1+snapshot.dev.167 (maintained docs still cite earlier dev.166).
- Read AGENTS.md, DEVELOPMENT_STATE.md, DOCUMENTATION_INDEX.md, ARCHITECTURE.md and WEBGL_RENDERER_PILOT_PREPARATION_20261022.md.
- One authoritative Campaign, original input, audio and v4 saves. No gameplay/rule/balance changes.
- Only two graphics choices: Canvas 2D (default) or PixiJS WebGL2 (experimental).

## Implementation

- src/prototype/pixi-experimental.js: live-Campaign adapter reusing the original PixiJS scene bridge, atlas selection and game art. Terrain/roads are prepared in a separate bounded offscreen background rather than copied from completed frames. Actors update independently as GPU textures, with per-entity prepared procedural art, GPU lights and atmosphere.
- src/prototype/renderer.js: background-only painting and transparent combat-cue overlay are selectable internal passes. The ordinary full Canvas path remains unchanged. In GPU mode Canvas still draws warnings/projectiles/health and other combat overlays on top; this is NOT a full native GPU renderer.
- src/prototype/app.js: in-game opt-in graphics menu, separate GPU canvas behind transparent Canvas cues, shared live game/input and 15-second Keep/Revert trial. Context loss, missing new sprite assets and resize should trigger Canvas fallback.
- scripts/site-assets.cjs: registers the new module and four existing pilot helpers. Generated HTML and PWA inventory have NOT been rebuilt; source tree is not deployable as-is.

## Known limits

- PixiJS v8.22.0 currently loads from a pinned CDN only when experimental mode is selected. Offline Pixi startup requires self-hosted packaging before any release.
- Original procedural bodies can animate spatially but their individual body paintings are static between scene changes. Some labels, outlines, fixture details, room/day-night blending and other visual elements are missing or approximate.
- Newly encountered unprepared art intentionally reverts to Canvas instead of hiding assets.
- A saved Keep preference does not auto-enable experimental GPU after restart; reliable Canvas boot remains in place pending offline/recovery validation.
- FPS and frame-timing claims are NOT validated; the GPU mode contains an original Canvas combat overlay.
- Nothing in this implementation is evidence of production readiness or approval to publish.

## Step 3 review checklist

Confirm generated entries, build, syntax/format/check and appropriate focused tests. Then check in a real WebGL2 browser: actual save, movement, camera pan, region/room transitions, art, day/night, visible essential combat cues, dialogue/touch, 15s Keep/Revert, context loss, resize, offline failure and Canvas restoration. Verify the original Campaign/save remains unchanged; report incomplete art honestly. No massive optimization study.

## Step 4 and 5

Use established GitHub PR, CI, version and deployment rules only after Step 3 findings are resolved. Ship a self-hosted Pixi dependency or explicitly reject release. Do not merge or deploy from this Step 2 checkpoint.

## Resume

Branch: implementation/pixijs-playtest-step2-20261022. Continue from its commit and recorded limitations. Do not revive the older diverged preparation branch.
