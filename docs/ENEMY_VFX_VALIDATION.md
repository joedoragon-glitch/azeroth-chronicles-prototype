# Attack-effect development checks

The enemy VFX implementation and quality overhaul have shipped. The foundation, work handoff and audit documents retain their original evidence; they are not a new assignment to rebuild the bridge, pilots or catalog. Read the current source and inventory before changing an effect.

For an effect edit, start with `node scripts/enemy-vfx-inventory.cjs` and the relevant `tests/enemy-vfx-*.test.cjs` suite. Non-browser suites already run in `npm test`; do not invoke them again after a successful full run. For visual changes, run `node tests/enemy-vfx-browser.test.cjs` and the pilot capture below. Set `VFX_BROWSER_ENGINE=webkit` for the second engine.

```sh
VFX_CAPTURE_TAG=review VFX_CAPTURE_SMOKE=1 VFX_CAPTURE_VISUAL_ONLY=1 node scripts/enemy-vfx-capture.cjs
```

This retains all five pilots, three viewports, day/night scenes and both windup/active images: 30 scenes and 60 screenshots per browser. The separate catalog retains all 251 identities and 46 additional TRUE variants at both viewports: 594 scenes per browser. Assertions, real attack resolution, render purity, contact and lifecycle checks are unchanged.

The queued CI change selects the existing lightweight timing mode for pilot captures. It reduces repeated timing draws from 48 to 4 per scene: 1,440 to 120 per browser, or 2,880 to 240 across Chromium and WebKit (91.7% fewer timing draws). These counts exclude the unchanged visual-capture and catalog draws. Timing results are diagnostic; neither mode applies a timing pass/fail threshold. Lightweight timing output is marked `visualOnly`; do not use it as a performance benchmark.

For a deliberate performance investigation, omit `VFX_CAPTURE_VISUAL_ONLY` to retain warmed, alternating timing samples. Omit `VFX_CAPTURE_SMOKE` when the change needs the original three-zoom coverage (90 scenes / 180 images per browser). Retain prior captures under a distinct `VFX_CAPTURE_TAG`; do not overwrite the evidence you are comparing. Shared headless timing does not establish physical-device FPS.

Current GitHub Actions remain the release gate. The optimization changes development checks only: no attack art, runtime, AI, combat geometry, damage timing, saves or assets change. Combine with the other queued workflow improvements and validate the final integration before Joel's merge/deployment approval.
