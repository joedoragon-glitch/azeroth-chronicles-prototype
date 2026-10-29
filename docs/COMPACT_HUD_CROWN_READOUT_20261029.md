# Compact HUD — live Crown balance

Date: 29 October 2026. PR #593 merged and published. Follow-up: correct clipped top edge of the coin icon.

## Player-facing behavior

The current desktop and phone HUD keeps the existing minimal dimensions, including the 188px desktop dock and the 186px maximum phone HP dock. The carried Crown balance is now displayed in the existing HP text row as the actual silver Crown coin stamped with the Dark Lord's portrait and an exact localized number, to the right of the HP values. The value comes from the live `hero.gold` state and updates when the HUD refreshes, including on loot, spending, death penalties, and save restore.

The old full wallet/XP row remains hidden in the compact dock; progression details and finances remain available through their existing menus. No new bar, panel, button, navigation action, or input shortcut has been introduced. Both English and Spanish present the number with localized thousands separators and an accessible full Crown label. The adaptive phone low-HP warning stays present but moves over the health bar to avoid covering money.

## Implementation and acceptance

- `src/prototype/app.js` renders the existing `PrototypeRenderer.drawCrownLoot` coin painting once into a 56×56 offscreen canvas at 2× scale. The resulting inline background image is reused at 19×19 CSS pixels in an independent absolutely positioned icon box beside the live amount. This is the *same artwork* as the in-world loot (including PixiJS), not an emoji, duplicate coin design or new sprite asset. No economy or save behavior changes.
- `styles/prototype.css` aligns HP and Crowns on one line without adding a row. `styles/phone.css` adjusts the adaptive warning position.
- `tests/hud-option-b.test.cjs` verifies the shared HUD structure, continued wallet/XP hiding, and adaptive warning placement.
- `tests/hud-option-b-visual.cjs` exercises real game HTML at desktop 1280×800, landscape 800×375, Spanish portrait 375×800, and left-hand landscape 844×390. It compares the browser coin image pixels directly against the original loot painter and asserts that Crowns are visible, don't overlap HP or leave the dock, and do not increase dock height when the amount becomes six digits.

PR #593 passed its focused browser checks and was published. The subsequent real screenshot showed the coin's crown clipped at the top: the old 48×48 stamp placed the painter at (12,12), cutting its upper extent, and the 17px CSS background was vertically clipped inside a text line. The follow-up uses a 56×56 stamp at (14,14), leaving transparent pixels above and below the entire coin, and renders it in its own absolutely positioned 19×19 pseudo-element. The source is still the original Dark Lord coin painter, and the text line/HUD dimensions remain unchanged. Regression checks verify transparent stamp margins and that the complete coin stays within the HUD. Physical-device checks remain separate. A successful browser test does not certify phone hardware readability, including very large balances and unusual high-level HP values.
