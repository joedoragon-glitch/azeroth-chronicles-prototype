# Compact HUD — live Crown balance

Date: 29 October 2026. Draft PR #593; not merged or published.

## Player-facing behavior

The current desktop and phone HUD keeps the existing minimal dimensions, including the 188px desktop dock and the 186px maximum phone HP dock. The carried Crown balance is now displayed in the existing HP text row as a small crown symbol and exact localized number, to the right of the HP values. The value comes from the live `hero.gold` state and updates when the HUD refreshes, including on loot, spending, death penalties, and save restore.

The old full wallet/XP row remains hidden in the compact dock; progression details and finances remain available through their existing menus. No new bar, panel, button, navigation action, or input shortcut has been introduced. Both English and Spanish present the number with localized thousands separators and an accessible full Crown label. The adaptive phone low-HP warning stays present but moves over the health bar to avoid covering money.

## Implementation and acceptance

- `src/prototype/app.js` supplies the live amount inside the health readout; no economy or save behavior changes.
- `styles/prototype.css` aligns HP and Crowns on one line without adding a row. `styles/phone.css` adjusts the adaptive warning position.
- `tests/hud-option-b.test.cjs` verifies the shared HUD structure, continued wallet/XP hiding, and adaptive warning placement.
- `tests/hud-option-b-visual.cjs` exercises real game HTML at desktop 1280×800, landscape 800×375, Spanish portrait 375×800, and left-hand landscape 844×390. It asserts that Crowns are visible, don't overlap HP or leave the dock, and do not increase dock height when the amount becomes six digits.

As of this draft, the source assertions have been reviewed but the revised Chromium workflow and device checks are pending. This PR is not a release authorization. A successful browser test does not certify phone hardware readability, including very large balances and unusual high-level HP values.
