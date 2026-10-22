# dev.166 · Optional adaptive frame skip

Owner-approved device-local, opt-in performance experiment. Defaults **Off**.
Game and settings → Screen and performance → Frame rate → Adaptive frame skip.

- The existing Auto/30/60 FPS limiter remains the outside drawing gate.
- Game simulation, AI, input, audio, effects and the campaign save path keep
  updating on every active animation callback whether a world image is drawn.
- After six actual drawings, the smoothed full drawn-frame cost must exceed
  112% of the target frame budget, with at least 5 ms of render work. Skipped
  frames never feed artificially cheap timings back to the detector.
- At most one **eligible** world drawing may be skipped consecutively.
  There is also a 110 ms draw-age guard. Warnings, elite warnings, charge
  interruptions and death events protect drawings for 300 ms, even if they
  occur on a callback already skipped by the ordinary FPS limiter.
- When measured drawn-frame pressure recovers, the skipping stops.
  Suspension due to pause/hidden page resets the pressure estimate.
- The `azeroth-adaptive-frame-skip-v1` localStorage preference is independent
  from v4 campaign saves, exports and desktop/phone presentation settings.
- Performance Details and Playtest Reports expose distinct callback update
  and displayed draw rates as well as the count of adaptive skips. A higher
  callback rate must not be presented as a higher rendered frame rate.

Narrow checks only: tests/frame-skip.test.cjs, existing frame-rate.test.cjs,
frame-profile.test.cjs and the English/Spanish settings-menu test. The Pages
build also runs the required asset/syntax/package consistency check.
Full CI and WebKit/browser gameplay matrices were explicitly not requested.

User Chromebook playtesting will determine if combat timing and warning
visibility feel better; no measured FPS gain is claimed before that test.
