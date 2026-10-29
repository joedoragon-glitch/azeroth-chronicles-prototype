# Option B HUD refinement — PC and landscape phone

Date: 25 October 2026. **Owner-selected, review-ready candidate; unmerged and undeployed.**

## Owner-selected design

The owner selected **Option B** for both PC and landscape phone after comparing the real game's appearance. The goal is less persistent UI covering the world, not a new HUD or changes to controls, combat, camera, rendering, or gameplay.

## Scope (only two runtime CSS files)

- **PC:** narrow the existing 214px right-side HUD to 188px and reduce its opaque background. Keep native Menu, class/level, HP, contextual status, training when available, Recall and Target. Remove persistent location/objective preview and wallet/XP line from the HUD *only*; the source data and existing menu access are unchanged. Keep all eight skill slots, charge information, and contextual Ranger Heal.
- **Phone:** retain the top-left HP/class/level dock. Place the **same existing localized Menu action** in a separate clearly labeled top-right 94 × 46px control; this is not an additional Menu button. Keep the joystick, all eight native skill forms, Ranger support, Recall, Target, Squad, contextual Interact, and normal/alternate handedness. Prevent the app-update control from occupying the Menu touch target: beside it in landscape, below in portrait.
- No permanent minimap, quest card, extra resource bar, invented action, skill pagination, or separate navigation widget.

Changed runtime sources are `styles/desktop.css` and `styles/phone.css` only. No changes to hero engine, renderer (Canvas or Pixi), navigation, input routing, audio, persistence, save compatibility, offline assets, or local settings.

## Completed focused verification

The scoped source assertions in `tests/hud-option-b.test.cjs` include native Menu and eight-skill routing, permanent vs contextual dock elements, touch target size and placement, update separation, and alternate handedness.

The Chromium real-shell smoke in `tests/hud-option-b-visual.cjs` uses the game runtime and draws **actual world art and production HUD**, not a reconstructed mockup. It initializes eight unlocked Ranger skills plus one Ranger Heal support action, checks visibility/collisions, then opens the existing Menu and English Quest journal. Screenshots are written to local `test-results/hud-option-b-*.png` when explicitly rerun. Browser images are **not** embedded as base64 into CI logs.

Validated viewports:
- PC: 1280 × 800, keyboard/mouse.
- Landscape phone: 800 × 375, two-thumb.
- Landscape phone: 844 × 390, alternate left-hand.
- Portrait fallback: 375 × 800, **Spanish Menú** label.

At all four sizes the localized Menu control was visible and inside the viewport; on phone its target stayed at least 94 × 46px, the update prompt did not cover Menu, the skill cluster did not overlap the joystick, Recall or Target, and no page exceptions were observed. Each of the eight skills and Ranger Heal was displayed. English Quest journal access through Menu was verified.

Latest synchronized branch: `main` incorporated as a second parent of the dedicated UI merge commit, leaving **five changed files** and zero unrelated changes. Focused GitHub Actions completed successfully with six HUD tests (including the browser smoke), the architecture contract and reproducible build.

- [Focused CI validation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40240847113)
- [Review PR #476](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/476)

## Merge and release boundaries

This is **ready for owner code review**, not a claim of physical-device certification. In particular, no real Android/iOS thumb-play or full browser matrix was authorized; charged hold feedback, interact and navigation warning coexistence, small-screen on-device readability, rare app-update notifications, and first-run tutorial discoverability should still be checked in a real play session. Screenshot/geometry validation does not guarantee subjective aesthetics or performance on actual hardware.

**Do not auto-merge or deploy.** A merge into `main` starts the automatic focused Pages pipeline, so obtain the owner's separate merge/release approval. The existing published game is unchanged until then.

## 29 October follow-up — live Crowns in the same HP row (PR #593)

The original 25 October Option B specification above remains the historical design record. The subsequent owner request keeps its minimal dock dimensions **but restores the carried Crown count** as a continuously visible item. The current implementation puts a small image rasterized directly from the existing silver Dark Lord portrait Crown loot painter plus the exact live, locale-formatted `hero.gold` amount **beside the HP values on the existing health-label row**, not in another wallet row. The XP/wallet detail line remains hidden; full finances and progression remain accessible through their existing menus. Desktop dock width remains 188px; phone HP dock remains capped at 186px. No extra controls, gameplay logic, or saved fields are added.

No emoji, generic royal crown, new denomination, or separate artistic imitation is used. The shared coin image is prepared once at 2× resolution rather than repainted on every HUD tick. The adaptive phone low-health label is repositioned over the HP bar so it does not obscure the currency value. The focused test now checks that the amount fits without overlapping HP or growing the HUD for six-digit values across desktop, Spanish portrait phone, and two landscape phone layouts. See [the detailed implementation and test contract](COMPACT_HUD_CROWN_READOUT_20261029.md).

**Status:** Draft PR #593, not merged or deployed. Automated validation and real-device visual acceptance must be reported separately.
