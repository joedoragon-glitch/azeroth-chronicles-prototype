# Attack-effect development checks

> **Current-use boundary — 19 October 2026:** Apply this contract with [current development state](DEVELOPMENT_STATE.md). Dated verification/rollout sections retain their historical scope; they do not authorize work during the break.

The enemy VFX implementation and quality overhaul have shipped. The foundation, work handoff and audit documents retain their original evidence; they are not a new assignment to rebuild the bridge, pilots or catalog. Read the current source and inventory before changing an effect.

For an effect edit, start with `node scripts/enemy-vfx-inventory.cjs` and the relevant `tests/enemy-vfx-*.test.cjs` suite. Non-browser suites already run in `npm test`; do not invoke them again after a successful full run. For visual changes, run `node tests/enemy-vfx-browser.test.cjs` and the pilot capture below. Set `VFX_BROWSER_ENGINE=webkit` for the second engine.

```sh
VFX_CAPTURE_TAG=review VFX_CAPTURE_SMOKE=1 VFX_CAPTURE_VISUAL_ONLY=1 node scripts/enemy-vfx-capture.cjs
```

## Historical validation-volume comparison

The original five-pilot comparison used three viewports, day/night scenes and both windup/active images: 30 scenes and 60 screenshots per browser. The historical catalog comparison covered 251 identities and 46 additional TRUE variants at both viewports: 594 scenes per browser. Those counts describe that recorded benchmark, not a new census of modern attacks. Preserve actual-resolution, render-purity, contact and lifecycle assertions for future changes.

The current CI configuration selects the existing lightweight timing mode for pilot captures. It reduces repeated timing draws from 48 to 4 per scene: 1,440 to 120 per browser, or 2,880 to 240 across Chromium and WebKit (91.7% fewer timing draws). These counts exclude the unchanged visual-capture and catalog draws. Timing results are diagnostic; neither mode applies a timing pass/fail threshold. Lightweight timing output is marked `visualOnly`; do not use it as a performance benchmark.

For a deliberate performance investigation, omit `VFX_CAPTURE_VISUAL_ONLY` to retain warmed, alternating timing samples. Omit `VFX_CAPTURE_SMOKE` when the change needs the original three-zoom coverage (90 scenes / 180 images per browser). Retain prior captures under a distinct `VFX_CAPTURE_TAG`; do not overwrite the evidence you are comparing. Shared headless timing does not establish physical-device FPS.

## Future release boundary

Current GitHub Actions remain the release gate. The optimization changes development checks only: no attack art, runtime, AI, combat geometry, damage timing, saves or assets change. These are future change-scoped instructions; the current break does not start captures or CI. Validate the final integrated candidate when development resumes, with Joel's merge/deployment authorization.

## Current warning-to-effect handoff candidate (PR #578, 28 October 2026)

The combat warning lifecycle now has a separate [feature and player behavior specification](WARNING_EFFECT_HANDOFF_20261028.md). This is a **draft candidate**, not a shipped feature. Validate that the actual cast/aim timer owns the warning (circles, cones, lines, Rogue cast bars, and ranged targeting) and that release removes only the *completed* warning. A separately queued next attack must retain its new warning; damaging rings, lingering pools, trap activations, closure and cordon effects must retain their live effect artwork. The Citadel board changes from a dangerous highlighted square to a small impact spark at the exact warn-to-damage/rest transition.

The focused native regression is `node tests/warning-effect-handoff.test.cjs`, included in the quick suite. CI and phone/browser acceptance evidence must be recorded after execution; no wording here claims a passed test, merge, or deployment.
