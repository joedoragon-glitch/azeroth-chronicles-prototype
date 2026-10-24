# Adaptive frame skip — default-on, two-frame revision (23 October 2026)

**Status:** Focused implementation candidate on a draft pull request; not a published release. Supersedes the dev.166 skip-intensity/default constraints upon merge. No change to the normal FPS limiter, combat calculations, campaign saves, or graphics backend selection.

## Owner-approved behavior

- Adaptive Frame Skip now defaults **On** when the device has no explicitly saved preference. A stored **Off** remains Off, and toggling either way persists only locally, not in campaign saves.
- It is available at **every positive finite FPS target**, including fixed 20/30/60 and Auto modes when they switch between targets.
- After six real drawn-frame samples, it may skip when exponentially smoothed total drawn-frame work exceeds **112% of the current FPS target period** and measured rendering takes at least **5 ms**. A CPU-only bottleneck with an inexpensive renderer does not qualify.
- It may skip **two consecutive FPS-eligible drawings**, then must draw on the next eligible opportunity. Draws suppressed by the separate ordinary FPS gate are not counted as adaptive skips.
- The old **110 ms** guard is replaced with a **350 ms stale-image guard**: if the most recent actual drawing is already 350 ms old, do not skip the next eligible drawing. This is a decision-point safeguard, not a guarantee of screen presentation within 350 ms, because the browser may not supply callbacks.
- **No special frame-skip suppression for warning, elite-warning, charge-interrupted, or death events.** Combat warnings, telegraphs, AI, simulation, audio, input and visual effect state still advance on active callbacks before the draw decision. If a draw is skipped, the next image uses current simulation/cue state.
- Pausing or hiding resets the short-term load estimate; cumulative skip count remains session-scoped. Pressure subsiding automatically stops skipping.
- Canvas 2D and PixiJS WebGL2 still share the same outer draw gate. The Pixi world and Canvas combat overlay are skipped together when a drawing is adaptively suppressed.

## Why retain a stale-image guard?

At a target of 20 FPS, two eligible skips can produce approximately 150 ms between actual drawings if callbacks arrive normally. At very low active callback rates, two skipped callbacks could otherwise leave the screen visually stale for much longer. The 350 ms bound allows a skip in a roughly 5 FPS stress scenario, but forces the next eligible drawing when the retained image is already old. It cannot eliminate stalls caused by browser scheduling or simulation overload.

## Focused acceptance and measurement boundaries

Relevant checks: `tests/frame-skip.test.cjs`, `tests/frame-rate.test.cjs`, `tests/frame-profile.test.cjs`, `tests/game-menu-ui.test.cjs`, direct app/runtime regressions selected by focused CI, and reproducible offline package verification. No broad game/phone/browser matrix should be triggered automatically.

The existing profiler records game callbacks and issued draw calls, not physical monitor-presented FPS. A higher callback count or larger skip count is **not proof** of higher visual FPS, smoother controls, or shorter input latency. A matched-scene Chromebook/mobile combat comparison, including persistent boss warnings in Canvas and PixiJS, remains necessary before declaring a player-perceived improvement. No boss telegraph durations or damage rules were changed.
