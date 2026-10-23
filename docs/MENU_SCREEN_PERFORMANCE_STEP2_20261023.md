# Menu usability overhaul — Step 2: one Screen & Performance window

**Status:** Review candidate; not deployed.  
**Base reconciled:** Step 1 PR #413 merged into `main` as `3ad37c961d06c0b9b9339361df796deb8cd06041`. The merged commit's file tree matches the Step 1 head exactly (`e230841c04ee97b80a024fce2997813b267e97ca`).  
**Scope:** Step 2 from the October 23 menu system audit — consolidate Screen & Performance only.  
**Prerequisite:** Step 1 is merged and verified. This PR now targets `main` and contains Step 2 changes only.

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

**Merge to `main` is separately authorized after focused validation; do not merge while checks are failing. GitHub's normal focused publisher may deploy after merge. No manual broad matrix.** After validation and merge of this PR, proceed to Step 3 (Music & Sound) as its own scoped branch/change.

Validation note: the initial focused run validated the Step 1 + Step 2 stack against the original main. After Step 1 merged, the diff against the updated main contains only five Step 2 files. The focused validation must still pass on the current proposed changes before Step 2 merges.
