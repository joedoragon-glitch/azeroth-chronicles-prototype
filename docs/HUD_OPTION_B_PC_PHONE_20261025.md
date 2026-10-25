# Option B HUD refinement — PC and landscape phone

Date: 25 October 2026. Draft source-only candidate; not merged or deployed.

## Owner-selected design

The owner selected **Option B** on both desktop and landscape phone after reviewing comparisons against Azeroth Chronicles' existing game art. The direction is reduced persistent visual weight, **not** a HUD replacement.

## Implementation in this candidate

- **PC:** compress the existing right-side dock from 214 to 188 CSS px, reduce opaque framing and hide its permanent location/objective preview and wallet/XP row. They remain available in existing game menus. Keep hero class/level, HP, contextual status, unlocked training, native Menu, Recall and Target. Preserve the complete eight-slot hero hotbar and conditional Ranger Heal button.
- **Phone:** keep a compact top-left class/level/HP dock. Reposition the **same** localized Menu button as a labeled 94 × 46 CSS px top-right target, eliminating the redundant icon-only treatment. Preserve all native skills, their tap/hold charge behavior, both handedness layouts, joystick, contextual Interact, Recall, Target, Squad, queued feedback and navigation cancellation. The transient update button is offset from Menu, beside it in landscape and beneath it in portrait.
- No minimap, quest tracker, extra quick-action or invented skill. Map and quest journal remain in the existing menu.

Only `styles/desktop.css` and `styles/phone.css` affect runtime. No DOM reparenting, input mapping, gameplay, audio, Canvas/Pixi draw logic or save schema changes.

## Focused verification

- `node --test tests/hud-option-b.test.cjs`
- `node scripts/build.cjs --check` via normal focused PR workflow.
- Source checks also cover the original eight-skill renderer and both touch control layouts.

## Acceptance still required

This is **not** physical-device or browser-visual certification. Before any merge, inspect actual running desktop and landscape phone captures and verify: all eight unlocked skills and charged feedback, contextual Ranger Heal, full quest access through Menu, menu EN/ES text, update-ready plus Menu, safe areas, 800 × 375 and 844 × 390 landscape, 375 × 800 portrait, alternate handedness, 44px+ touch targets, and no overlap with active navigation cancellation, warning notices or critical combat. If a previously important onboard objective is insufficiently discoverable via Menu, refine within this draft rather than silently removing its information. No merge or deploy without owner approval.
