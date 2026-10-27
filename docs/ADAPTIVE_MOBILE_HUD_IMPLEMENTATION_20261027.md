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
- [x] Existing mapped Phase 1 checks passed in focused CI; the standalone Chromium floating-gesture smoke passed in three viewports ([focused Phase 4 browser run](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40469096032)).
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
- [ ] Physical iPhone/Android inspection of Adaptive/Classic in portrait and landscape; the standalone browser touch smoke has passed.
- [x] Focused automated coverage includes two-thumb landscape and left-hand portrait with WebKit, plus Chromium joystick portrait/landscape and landscape left-hand. Physical geometry still requires owner review.

## Phase 3 — Notification refinement (implemented; device acceptance pending)

- [x] Classify brief status receipts into routine, important and critical; critical performance pauses and storage/write failures get urgent contrast and screen-reader alert semantics, while the normal recovery receipt becomes 1.75 seconds.
- [x] Do not create a second notification system. Preserve the existing ordered warning/milestone/narration/feedback queue, live combat interruption rules, full announcement text and EN/ES translations.
- [x] On phones, routine status yields visually to an active amber announcement instead of stacking farther into the world. Urgent status stays visible beneath important active cards.
- [x] Place routine status in the top rail between HP and Menu on normal landscape widths, with a compact below-dock fallback in portrait; bound banner widths to 320px landscape / 310px portrait.
- [x] Opaque, distinct notice palettes for routine, urgent, milestone, warning, story and feedback—including secondary text. All ten declared foreground/background combinations exceed 7:1 luminance contrast on their solid backgrounds.
- [x] Preserve reduced-motion behavior, important alert roles, Menu access and no-touch-overlap for clickable milestone cards.
- [x] New dedicated `tests/notification-refinement.test.cjs` checks contrast ratios, precedence, EN/ES production shell, and source safeguards.
- [x] Focused CI passed 31 relevant tests, including notification contrast, bilingual shell and priority behavior; reproducible site build and syntax passed ([run #40467597851](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40467597851)).
- [x] Phase 4 integrated Chromium and WebKit browser smoke passed ([run #40469096032](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40469096032)).
- [ ] Visual layout/contrast inspection on actual iPhone/Android still needed.

## Phase 4 — Integrated acceptance (focused automation passed; owner device gate remains)

- [x] Phase 3 exact candidate: 31 focused CI files and reproducible site build passed ([run #40467597851](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40467597851)); also included input persistence, bilingual menus, low-HP contexts, and notification accessibility checks.
- [x] Real Chromium floating touch, movement, release and fixed-menu fallback passed at 800×375, 375×800, 844×390.
- [x] Focused integration passed Chromium 800×375 two-thumb and WebKit 393×852 left-hand: control rectangle invariants, proactive ATK/Target/Recall/Menu, low-HP cue, computed live warning palette, floating pointer cancellation, multi-touch ownership, menu override, and preference/save continuity across browser reload ([run #40469096032](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40469096032)).
- [x] English/Spanish menu and high-contrast source/production-shell fixtures, old preference sanitization, and v4 save persistence covered by focused tests.
- [x] Site remains a multi-file PWA; optional HUD styling/controls are DOM/CSS and independent of Canvas versus PixiJS engine simulation. The production renderer default is unchanged.
- [ ] Active PixiJS WebGL2 trial parity, context loss/recovery and a historical v4 campaign fixture were **not** exercised by this narrow Phase 4 browser smoke. Do not claim GPU-specific or old-build migration certification; reserve for an explicitly approved renderer/PWA regression.
- [ ] Physical Android Chrome and iPhone Safari/PWA acceptance: both orientations and handedness choices; verify safe insets, device scale, Interact/Recall/Target/skills during simultaneous joystick touch, dialog Confirm, app background/return, and readability over actors/labels with reduced motion on/off.
- [ ] Owner approval before merge or GitHub Pages deployment. Keep draft state until these gates are resolved.

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

## Phase 4 acceptance assets

- `tests/adaptive-mobile-hud-integration-browser.test.cjs` — scoped Chromium/WebKit real DOM acceptance and reload coverage.
- `tests/floating-joystick-browser.test.cjs` — Chromium real-pointer movement checks.
- `.github/workflows/adaptive-hud-phase4.yml` — PR #519-only targeted browser checks; no Pages write permissions or deployment. Screenshot artifacts accompany the run for visual review.

Run focused commands (browser tests require Playwright Chromium/WebKit binaries):

```sh
node tests/input.test.cjs
node tests/game-menu-ui.test.cjs
node tests/floating-joystick-browser.test.cjs
node tests/adaptive-hud.test.cjs
node tests/notification-refinement.test.cjs
node tests/adaptive-mobile-hud-integration-browser.test.cjs
```

All three implementation phases and their scoped Phase 4 browser validation live on the same draft PR. Automated acceptance has passed; physical-device, active PixiJS and historical migration certification are explicitly **not complete**. No merge or publication is authorized.
