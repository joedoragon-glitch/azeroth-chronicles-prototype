# PixiJS twilight light-gradient failure — 26 October 2026

## Recorded evidence
The owner observed another sudden white flash, coinciding with the brief `PixiJS issue` message while outdoors in Greenwood Vale during Ranger/Goblin play. The supplied post-failure `Azeroth_Playtest_Report.json` identifies `graphicsRenderer.lastFailure` as `render-exception`, `stage=atmosphere`, `Unable to convert color rgba(235,221,184,2.1597119819343913e-8)`. An earlier report captured the same class of failure with alpha `7.778520935683986e-7`. The RGB channels are the actual hero glow from `AzerothNativeWebGLCore.lampGlowCommands`. The runtime correctly switched to Canvas and retained a bounded recovery preference.

## Root cause and repair
`pixi-scene-bridge.js` formatted grade/vignette RGB and alpha into safe decimal CSS strings, but `glowGradient` used raw JS number concatenation, emitting exponent-form alpha near dawn. Pixi `FillGradient` rejects those strings, causing fallback. Moreover, the original `gradients` Map used exact per-frame floating alpha as keys and never evicted them until scene destruction, risking unbounded retained GPU fill resources during slowly varying twilight.

The fix routes all lamp stops through the existing decimal-only CSS formatter, quantizes lamp intensity to 1/1024 (well below the normal visible light step), omits subvisible rounded-zero glows, and reclaims unused GPU gradients above a cap of 96 while preserving live fill references. No gameplay, lighting palette, Canvas atmosphere, save schema, combat mechanic, zone geometry, or user renderer preference is changed. PWA version and worker cache are incremented so updated source reaches installed clients.

## Validation and historical boundary
Focused scene tests validate both real error alpha values and three thousand sunrise/sunset frames with strict Pixi RGBA color parsing, active light transitions, bounded fill resource count and destruction of unused fills. Existing Pixi fidelity and renderer-fallback suites, changed-file formatting and reproducible PWA build are included in CI.

The earlier localized/full-screen Canvas-era sunrise flashes tracked in [issue #357](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/357) **predate** this Pixi path. The present evidence strongly associates the *new concurrent Pixi flash and failure* but does **not** prove the historical Canvas flash cause. Preserve approved day/night color and timing; keep #357 open until physical-device observation verifies all flashes are gone.
