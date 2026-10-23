# Menu usability overhaul — Step 2: one Screen & Performance window

**Status:** Review candidate; not deployed.  
**Dependent base:** Step 1 draft PR #413, branch `menu-foundation-step1-20261023` at `0087f63edb67e1e7851a396ad776edb84d6d286d`.  
**Scope:** Step 2 from the October 23 menu system audit — consolidate Screen & Performance only.  
**Prerequisite:** Step 1 must be reviewed/accepted independently. This branch is not intended for direct merge into `main` while the prerequisite remains a draft.

## Changes

- Replace the six-choice Screen & Performance directory and all of its child panels with **one scrollable window**, using Step 1's shared section, toggle and select controls.
- Display screen layout (Auto/Desktop/Phone), per-mode camera zoom (100/150/175%), Optimization Mode, resolution (Auto/Native/100/80/60/50%), FPS target (Auto 20–30/Auto 30–60/20/30/60), adaptive frame skip, and Canvas/PixiJS graphics renderer in the same window.
- Every ordinary change updates the original device-local preference and leaves the window open; underlying setters, reset/suspension logic, and defaults remain unchanged.
- Pixel dimensions previously shown beside each fixed-resolution choice are omitted from the option labels. The full six-choice quality policy, including Native/Auto, remains unchanged.
- The PixiJS renderer selection is the one exception: opening its existing 15-second trial **closes** the settings window so the independent Keep/Revert controls remain visible; unavailable/failed GPU attempts continue to fall back to Canvas.
- Embed expandable *read-only* performance diagnostics and Reset performance sample on this same page. The diagnostics are estimates; they must not be described as verified monitor-presented FPS.
- New English/Spanish strings cover headings, disclosure, and the existing defensive renderer warning. Shared layout CSS preserves line breaks for diagnostics.

## Preservation contract

No changes to game rules, AI, camera camera-scales, Canvas/GPU implementations, frame rate controller, adaptive skip policy, sampling algorithms, sound, controls, persistence schemas, service-worker assets, or version metadata. No change to the experimental renderer trial's confirmation timer, crash recovery, or automatic fallback. Adaptive frame skip stays Off by default.

## Verification

Focused relevant checks on this branch:
- `tests/game-menu-ui.test.cjs`: bilingual actual-shell traversal, all original setting values persisted, diagnostics disclosure/reset and unchanged campaign snapshot.
- `tests/menu-foundation-ui.test.cjs`: navigation-state foundation exercised through still-branching sound menus.
- `tests/app.test.cjs`: app integration contract and native input semantics.
- Syntax and publishable build check through the existing focused-only PR workflow.

Untested until a deliberately scoped later device check: real phone touch scrolling/readability, GPU trial graphics on actual hardware, browser screen-reader behavior, and end-to-end performance effects. Nothing in this UI change demonstrates faster FPS.

## Release boundary

**No merge and no GitHub Pages deployment on this task.** After review of prerequisite Step 1 and this PR, proceed to Step 3 (Music & Sound) as its own scoped branch/change.
