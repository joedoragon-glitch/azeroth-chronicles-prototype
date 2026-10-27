# Adaptive Mobile HUD — Four-Phase Implementation Tracker

Started: 27 October 2026. One continuing draft PR for all four phases.
Baseline: merged Option B mobile HUD; current main at branch creation: `740c4549cabb87455e0d9af8369e52a88cd06ad1`.
The 26 October read-only design specification is the working UX contract.

## Immutable rules

- Preserve the existing fixed joystick as default, with no engine movement/collision/AI/combat changes.
- Keep phone preferences separate from v4 campaign saves. Keep desktop unchanged.
- Never suppress usable learned skills, proactive targeting, Ranger support, recall, Interact, route cancellation or critical warnings.
- Preserve the approved HP dock, top-right Menu, skill coordinates, handedness layouts, and Canvas/Pixi renderer independence.
- This is a draft implementation branch. No merge or Pages deployment without separate owner approval.

## Phase 1 — Optional floating joystick (implemented; acceptance pending)

- [x] Separate `Fixed` (default) / `Floating` preference under Touch and mouse options.
- [x] English/Spanish control text and tolerant old-preference loading.
- [x] Restrict activation to a bottom-left touch zone, excluding actual visible button hitboxes.
- [x] Anchor the ring to the initial touch, add dead zone, reuse the existing `joy` vector.
- [x] Reuse pointer capture, document terminal-pointer cleanup and WebKit touch-identifier fallback.
- [x] No route cancellation until directional input crosses the dead zone in floating mode.
- [x] Fixed menu joystick and confirmation controls; hidden, noninteractive ring during ordinary floating play.
- [x] Focused unit and production-shell menu tests added; Chromium touch smoke added.
- [ ] Execute focused tests on the exact branch and inspect their results.
- [ ] Real iPhone/Android thumb testing (not certifiable by desktop-browser emulation).

## Phase 2 — Adaptive control visibility (not started)

- [ ] Introduce separate Classic (default)/Adaptive presentation preference and bounded UI context.
- [ ] Use subtle visual emphasis without relocating or disabling valid commands.
- [ ] Preserve low-health prominence, charge/queue, interact, tutorial, party, target and navigation states.
- [ ] Verify both handedness layouts and portrait/landscape.

## Phase 3 — Notification refinement (not started)

- [ ] Classify routine feedback separately from critical performance interruptions and narrative notices.
- [ ] Keep dangerous warnings, progression and announcements protected.
- [ ] Avoid NPC/nameplate occlusion, support EN/ES and reduced-motion preferences.

## Phase 4 — Integrated acceptance (not started)

- [ ] Focused regression suites and browser touch tests, both renderers and PWA lifecycle.
- [ ] Validate old v4 campaigns and existing input preferences.
- [ ] Compare real-device portrait/landscape thumb ergonomics.
- [ ] Obtain explicit owner approval before merge/deployment.

## Files in Phase 1

- `src/prototype/input.js` — preference and pure touch geometry.
- `src/prototype/app.js` — menu wiring, touch ownership, visual activation, release.
- `styles/phone.css` — opacity and anchor treatment without moving other controls.
- `tests/input.test.cjs`, `tests/game-menu-ui.test.cjs`, `tests/floating-joystick-browser.test.cjs` — focused regressions.

Run targeted checks when CI or a repository checkout is available:

```sh
node tests/input.test.cjs
node tests/game-menu-ui.test.cjs
node tests/floating-joystick-browser.test.cjs
```

No Phase 2–4 gameplay or presentation changes are included in the Phase 1 commits.
