# Responsive interface audit · 9 October 2026

## Intent

Azeroth Chronicles remains the same multi-file Campaign game on desktop/Chromebook and phone. This is a presentation and navigation pass, **not** a camera, world-scale, input, save, combat, or sprite revision. Keep the game canvas visually dominant; preserve joystick, skill, target, interact, Recall and contextual squad controls.

## Navigation ownership

- **Adventure menu**: global map, journal, portable inventory/support, direct Talents and system settings. An **Establish Basic Barracks** action deliberately remains available in the field because its placement requires the hero's current location and cannot be performed at an existing Barracks. Town Captains have no construction action; Barracks placement is solely available from the field Adventure menu.
- **Town Captains**: direct starter recruitment and recovery, without another branch or a town-construction option.
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

## Approved ergonomic refinement · 9 October 2026

Joel approved the phone and desktop interface refinements and smaller content-responsive dialogs. Preserve the **375×800 CSS pixel portrait and 800×375 landscape support minimum**; do not make 360×780 an optimized design target. Smaller viewports may use a generic proportional control-scale fallback (same composition, no special content or mechanics); the world Canvas keeps rendering at its actual viewport. This is best-effort compatibility, not an expanded support matrix.

- Interact appears in a lower-left thumb-adjacent position only when a nearby action exists. Recall and Target occupy a consistent nearby control row; contextual Squad sits immediately above without competing with the skill cluster. The two-thumb and alternate left-hand controls retain their original mappings.
- Keep unlocked skill buttons at the right-bottom; on desktop use a centered compact hotbar containing learned abilities and Ranger field commands only while Rangers are present.
- Desktop camera anchoring follows the revised 214/204px HUD dimensions rather than the old sidebar width.
- Dialog size is chosen by density (compact, regular, wide) while height remains content-driven up to a strict scroll bound. Short conversations no longer inherit the maximum panel width. Preserve 44px mobile action targets and a fixed Back.
- Ranger support numbers move into compact Inventory explanatory text instead of two disabled action rows; duplicate Recall disappears from Inventory. Full Barracks Operations now accurately says local objectives/resources, not map.
- Phone notices appear below the HP/MP bar; stacked amber cards and independent transient status remain visible without overlapping. Menu text is enlarged rather than globally shrinking.
- Browser regression checks include dialog-size classification, ergonomic contextual Interact placement and a 360x780 visual-fit smoke (not a supported reference viewport). All canonical supported viewports remain tested.

## Final release integration · v0.8.115

PR #165 merged at `4a2e6b3` after its complete Chromium/WebKit checks passed on `4cb46aed`. Main also includes PR #176 (`647c2df`) and all stacked-notice, tonic and quest updates. Both concurrent candidates used v0.8.114, producing byte-identical service workers despite different runtime content. The final UI release advances package/build/cache metadata to v0.8.115 so installed PWAs install the combined assets and retire the earlier cache. This changes no gameplay or save keys. Publication is accepted only after main CI, exact published-build verification and live desktop/phone/PWA smoke checks.

## Consolidated player-reported cleanup · 9 October 2026

All menus follow a compact phone typography and spacing standard on portrait and landscape screens. Show only useful functional text; remove redundant Adventure and Game and settings headings, explanatory paragraphs and the Pause play button. Adventure opens Talents directly, without a Character submenu. The Town Captain offers recruitment/recovery directly but must never build a Barracks in town. Story journal replaces the global quest log with specialist rescue, transport, Dark Lord, Awakening, and game completion guidance. Map and story navigation must preserve real routes when menus close, and path/transport choices must respect existing geometry and progression. Preserve existing saves, artwork, combat, inventory, PWA and standalone functionality.
