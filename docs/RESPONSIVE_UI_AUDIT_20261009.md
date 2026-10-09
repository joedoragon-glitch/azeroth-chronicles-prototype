# Responsive interface audit · 9 October 2026

## Intent

Azeroth Chronicles remains the same multi-file Campaign game on desktop/Chromebook and phone. This is a presentation and navigation pass, **not** a camera, world-scale, input, save, combat, or sprite revision. Keep the game canvas visually dominant; preserve joystick, skill, target, interact, Recall and contextual squad controls.

## Navigation ownership

- **Adventure menu**: global map, journal, portable inventory/support, character/training and system settings. An **Establish Basic Barracks** action deliberately remains available in the field because its placement requires the hero's current location and cannot be performed at an existing Barracks. Town Captains retain their equivalent starter construction route for discovery.
- **Town Captains**: starter recruitment/recovery and construction/resources.
- **Basic Barracks**: Expedition Skill, Company (group/recruitment/recovery), Rescued specialists, Operations (local objectives/resources), plus a context-specific Full upgrade.
- **Full Barracks**: the same four sections; no duplicate Inventory & support, global map or global Awakening action. Inventory remains usable wherever the character is, rather than requiring a Barracks.
- **NPCs/structures**: their existing service permissions, unlocks, data and Back navigation remain intact. Section names are stable and nested services are scrollable.

## Display contract

- Shared ink-blue/slate, muted teal, brushed-brass accents; fewer thick banners and heavy green borders. Text contrast and active/disabled/selected states stay visually distinct.
- **Desktop** HUD dock is 214 logical CSS px wide (204 below the existing desktop width breakpoint), with compact class/level, HP/MP meters, wallet/XP, a two-line objective preview, and two-up field commands. Training appears as a HUD action only when points are available; Character/keyboard access remains.
- **Phone** HUD uses a maximum 310px compact panel, showing class, level, HP, MP and a single menu icon. It does not stretch across the full phone or display a permanent full objective banner; the complete journal is one tap through the Adventure menu.
- Dialogs are not scaled by making text tiny: **desktop** max width 430px and max height 72dvh; **portrait phone** max width 330px and max height 54dvh; **landscape phone** max width 390px and max height 60dvh. The smaller panel reserves a stable title and Back action while the contents scroll internally.
- The backdrop dims the world when menus open, retaining contextual touch confirmation. Skills and movement retain their existing dimensions and thumb-reach positions. Safe area insets remain respected.
- Critical notices are capped at a narrower width; objective preview preserves the full DOM copy and title for retrieval.

## Audit / test obligations

- The desktop/phone CSS approval fixture lives in `tests/fixtures/presentation-20261009.json`; the older v0.8.83 fixture remains as historical evidence.
- `tests/prototype-browser.test.cjs` checks dialog viewport containment, reduced dimensions, fixed Back and internally scrolling option lists on the existing device matrix, including phone landscape.
- `tests/prototype-ui.test.cjs` checks the four-option Full Barracks and the absence of duplicated inventory. Keyboard/menu/squad/service tests still exercise existing logic.
- Run `npm run build`, `npm run format:check`, `npm run check`, `npm test`, desktop/phone Chromium and WebKit paths before merging. CI evidence is not a substitute for a final on-device aesthetic review.
