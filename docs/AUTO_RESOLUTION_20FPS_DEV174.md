# Auto resolution at 20 FPS — dev.174

Owner-authorized correction following the independent audit's F3 finding.

Auto resolution now accepts all shipped drawing targets: 20, 30 and 60 FPS.
The default Auto 20–30 controller's lower target and manual 20 FPS can reduce
backing-store density under rendering pressure and gradually recover sharpness.

The actual frame/resize integration also needed correction: reapplying an
unchanged device ceiling reset an adapted ratio to maximum. `configure()` now
preserves adaptation and its recovery history when the ceiling is unchanged.
An actual ceiling change retains the existing reconfiguration behavior.
The controller initializes density from a saved fixed choice, including on a
1x-DPI device; fixed density and Maximum sharpness remain opt-outs.

No combat, AI, simulation frequency, charge clock, save schema, camera scale,
renderer choice or preference-migration policy changes are included.

## Focused evidence

- The new regression failed against the original target guard; after accepting
  20 it independently failed against the resize reset, demonstrating both causes.
- `render-resolution.test.cjs` covers 20/30/60 pressure and recovery, unsupported
  targets, fixed choices, unchanged-ceiling resizing and existing budget guards.
- Production-shell frame-loop cases use a common injected test clock, actual
  FPS gating, resolution observation, resize and canvas dimensions. Manual 20
  and Auto 20–30 are checked with adaptive skipping both On and Off. At 15
  elapsed seconds each advances all 150 simulated 100ms ticks while retaining
  the reduced density; recovery to full sharpness works at manual 20 FPS.
- Existing Auto FPS/adaptive-skip coupling and emergency frame-skip checks pass.
- Later `runtime.js` edits now select this dedicated resolution regression in
  focused CI; the selector's policy test protects that mapping.
- Version, lockfile, generated build identifier and offline base cache advance
  together to `0.9.1+snapshot.dev.174`. Existing commit-specific PWA stamping and
  save-before-install behavior remain in place.

Final focused CI and publication results are retained on the release PR.
Synthetic draw costs verify behavior, not physical-device FPS gains. No full-game
suite or broad browser/device matrix is authorized or claimed for this repair.
