# Menu usability overhaul — Step 1: shared foundation

**Status:** Review candidate on `menu-foundation-step1-20261023`. Not published.  
**Source:** `main` at `d37aa8f14d0045553c394e8b67d810fd88224f7c`.  
**Plan:** User's October 23 menu system audit, Step 1 (M-01 and M-04, with bounded M-07 groundwork).

## Scope

- Keep legacy `action(label, fn, detail, disabled, tutorialHighlight)` and `openMenu(title, description, actions, back)` contracts unchanged.
- Add reusable **section**, **toggle**, **slider**, and **select** descriptors via `Prototype.menuControls`. They render as actual headings, switches, range inputs and native selects. Nothing in Screen & Performance, Sound, Controls or gameplay menus uses them yet; adoption belongs to Steps 2–7.
- Preserve the selected action and vertical scroll when a menu refreshes; when a child returns to an ancestor, restore that ancestor's last position and selected row. New screens begin at their first action, and closing a menu clears its temporary history.
- Keep existing Escape/Back semantics, add dialog focus restoration on close and include native form fields in the dialog Tab cycle. Use standard controls so native range/selection keyboard handling remains available.
- Add responsive styles for the new controls without enlarging or restructuring existing gameplay action lists.

## Guardrails

No changes to campaign mechanics, game saves, player choices, menus' action sequencing, input bindings, audio, optimization mode, FPS targets, adaptive frame skip, renderer switching or PixiJS's 15-second Keep/Revert trial. No new menu presets or settings defaults. No version bump, release, deployment or `main` merge.

## Focused checks

- `tests/menu-foundation-ui.test.cjs`: bilingual English/Spanish traversal, selection and scroll restoration, native control input events, unchanged campaign state, focus return, and Tab interception from native settings inputs.
- Existing direct integration: `tests/game-menu-ui.test.cjs` and `tests/app.test.cjs`.
- Build and syntax: `node scripts/build.cjs --check` and changed-file syntax checks, as provided by the repository's narrowly scoped `focused-deploy.yml` PR workflow.
- Real desktop/phone landscape/portrait and screen-reader usability **remain unverified** until a dedicated device review; do not infer them from the mock-shell tests.

## Step 2 boundary

The integrated Screen & Performance window should reuse these controls, with underlying preference storage and PixiJS trial behavior unchanged. This Step 1 PR must be reviewed independently before taking up Step 2. Do not merge or deploy this PR without owner authorization.
