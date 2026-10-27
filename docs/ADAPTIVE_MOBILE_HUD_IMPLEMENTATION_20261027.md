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
- [x] Existing mapped Phase 1 checks passed in focused CI; the separate Chromium floating-gesture browser smoke remains unexecuted.
- [ ] Real iPhone/Android thumb testing (not certifiable by desktop-browser emulation).

## Phase 2 — Adaptive control visibility (implemented; device acceptance pending)

- [x] Independent `Classic` (default) / `Adaptive` preference under Touch and mouse options, bilingual and preserved in `azeroth-input-v1`.
- [x] Pure context classifier for concurrent low HP, combat pressure, selected target, charging/queue, tutorial recall, nearby interaction, route guidance and menus; a 2-second combat cooldown and 30%/35% HP hysteresis prevent flicker.
- [x] Apply only changed DOM context attributes during the existing 150ms HUD update on opted-in phones, with bounded proximity checks; no game engine, renderer or pathfinding changes.
- [x] Quiet safe-state backgrounds for idle learned actions, Recall, Target and eligible Squad doctrine without hiding buttons or changing touch geometry; charging, queued skills, active target locks, tutorial and healing remain prominent.
- [x] Display explicit bilingual low-HP label and accented HP bar even near friendly NPCs.
- [x] Preserve classic styling on older devices; independently combine HUD style with Fixed/Floating and both handedness modes.
- [x] Focused input, bilingual menu and dedicated adaptive context/production-shell tests authored.
- [x] Focused GitHub Actions on the combined Phase 1–2 branch: 30 relevant test files passed, including dedicated Adaptive HUD, bilingual menu and input checks; reproducible site build passed ([run #40466501357](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40466501357)).
- [ ] Physical iPhone/Android inspection of Adaptive/Classic in portrait and landscape, and standalone browser touch smoke; final acceptance is Phase 4.
- [ ] Verify both handedness layouts and portrait/landscape.

## Phase 3 — Notification refinement (implemented; device acceptance pending)

- [x] Classify brief status receipts into routine, important and critical; critical performance pauses and storage/write failures get urgent contrast and screen-reader alert semantics, while the normal recovery receipt becomes 1.75 seconds.
- [x] Do not create a second notification system. Preserve the existing ordered warning/milestone/narration/feedback queue, live combat interruption rules, full announcement text and EN/ES translations.
- [x] On phones, routine status yields visually to an active amber announcement instead of stacking farther into the world. Urgent status stays visible beneath important active cards.
- [x] Place routine status in the top rail between HP and Menu on normal landscape widths, with a compact below-dock fallback in portrait; bound banner widths to 320px landscape / 310px portrait.
- [x] Opaque, distinct notice palettes for routine, urgent, milestone, warning, story and feedback—including secondary text. All ten declared foreground/background combinations exceed 7:1 luminance contrast on their solid backgrounds.
- [x] Preserve reduced-motion behavior, important alert roles, Menu access and no-touch-overlap for clickable milestone cards.
- [x] New dedicated `tests/notification-refinement.test.cjs` checks contrast ratios, precedence, EN/ES production shell, and source safeguards.
- [x] Focused CI passed 31 relevant tests, including notification contrast, bilingual shell and priority behavior; reproducible site build and syntax passed ([run #40467597851](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40467597851)).
- [ ] Visual layout inspection on actual iPhone/Android and Phase 4 integrated browser acceptance.

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

## Phase 2 files

- `src/prototype/input.js` — independent Classic/Adaptive preference and pure context/hysteresis helpers.
- `src/prototype/app.js` — bounded presentation snapshot, low-HP readout, bilingual settings.
- `styles/phone.css` — opt-in contrast changes without hitbox movement.
- `tests/adaptive-hud.test.cjs`, `tests/input.test.cjs`, `tests/game-menu-ui.test.cjs` — context and compatibility regressions.

## Phase 3 files

- `src/prototype/app.js` — status severity, display lifetime, banner width and priority/coexistence.
- `styles/phone.css` — accessible solid notice palettes and top-rail layout across Classic/Adaptive.
- `tests/notification-refinement.test.cjs` — color contrast and notification-priority regression.

Run targeted checks when CI or a repository checkout is available:

```sh
node tests/input.test.cjs
node tests/game-menu-ui.test.cjs
node tests/floating-joystick-browser.test.cjs
node tests/adaptive-hud.test.cjs
node tests/notification-refinement.test.cjs
```

All three completed phases are on the same draft branch, in separate commits. Phase 4 integration and physical-device acceptance have not started; no merge or publication is authorized.
