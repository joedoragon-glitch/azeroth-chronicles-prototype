# Step 7 engineering audit — Map and quest menu presentation

**Status:** Implemented and read-only audited October 23, 2026. **Scope:** Step 7 of the seven-step Menu Usability Overhaul. This audit is NOT a certification of route solving or waypoint correctness. **Working review:** draft PR #415, `game-menu-overhaul-steps3-7`. Do not merge/publish on the strength of this audit alone.

## 1. Change inventory and intentional exclusions

### Changed (Step 7 only)
- `src/prototype/app.js`: split *existing* `mapDestinations()` list into **Towns and camps / Travel routes / Dungeon entrances / Places and threats**, preserving the returned destinations and original nearest-first order **within each category**.
- Map menu action indexing now explicitly skips noninteractive section headings. Updating selection changes only the picked visual state and `aria-pressed` of the *same* destination buttons. The Navigate command exposes live text changes through `aria-live`.
- Added translated English/Spanish section labels.
- `tests/menu-map-quest-ui.test.cjs`: bilingual production-shell traversal through map selection, original clickable canvas and Navigate action, side quests, completed quests, announcements, Back routes, and read-only quest state. Original `tests/game-menu-ui.test.cjs` still tests tutorial quest selection and Clear waypoint.

### Explicitly unchanged
- `src/prototype/navigation.js` native `mapDestinations`, `navigationTarget`, `route`, blocked terrain and approach-point algorithms.
- Map canvas shape, drawing routines, pointer-to-canvas coordinate calculations and marker click radius.
- `PrototypeInput.requestMove`, menu close/cancel input policy, `storyNavigate`, `questGuide`, `gatheringTarget`, `Clear waypoint`, and quest route following.
- `src/prototype/menus.js` story/quest board logic, side vs completed quest filters, objectives, announcements, NPC transports, fare/work-for-passage, dungeon camp confirmations, locks, payouts and progression state.
- PWA caching, save format, rendering/optimization, input defaults, gameplay logic and authored plot clues.

## 2. Verification and code-review evidence

| Check | Result | Qualification |
|---|---|---|
| Step 7 patch reviewed against preceding Step 6 head `4f7f50eacb03e2ec86d9bb43330bbb6d4fa68821` | Pass | Only app map list/index/ARIA, the new focused test and deferred-work documentation changed before this audit |
| Existing map destinations | Pass, source inspection | The original `destinations = game.mapDestinations()` remains the only source; every item is rendered once in exactly one category |
| Map selection/indexing | Pass, focused UI regression | Buttons are indexed separately from headings; one selection highlighted, correct Navigate enabled state and label, canvas click still works in the mock shell |
| English/Spanish map headings | Pass, focused UI regression | New labels are explicitly translated |
| Native navigation from map | Pass, narrow UI regression | Selecting a walkable town and pressing Navigate still produces a move order/path in the production shell; this does **not** prove all real-world paths are valid |
| Quest journal → side/completed/announcements and Back | Pass, focused UI regression | Read-only traversal and saved quest/reward invariants retained |
| Existing tutorial quest and Clear waypoint route | Pass, existing `game-menu-ui` focused regression | Source behavior intentionally unchanged |
| Build + other impacted menu suites | Pass, focused PR GitHub Actions | See latest Step 7 green run recorded in PR. No broad/full-game CI or desktop/phone browser matrix requested or run |
| All five regional native map paths | Not rerun as a dedicated matrix in Step 7 | Existing `tests/map-navigation.test.cjs` source review covers regional routes; no inference about new UX on a phone |
| Physical touch, overlapping markers, keyboard/screen reader behavior, phone landscape, route reliability | **Unverified** | Requires the separate owner-requested follow-up |

## 3. Step 7 engineering assessment

**S7-A — Menu grouping, low risk, verified in source and focused shell.** Previously the map destination list was long and sorted only by proximity. Grouping reduces searching among unrelated locations. This intentionally changes the visual order across categories; it does *not* sort locations by journey time. Group headings are not themselves clickable and do not take a keyboard action index.

**S7-B — Selection integrity, medium risk, focused verification passed.** Because the map action list is also used by keyboard/joystick confirmation and the sticky Navigate button, inserting headings required compensating for indexing. The new `mapButtons` array maps only real action buttons and updates selection and `aria-pressed` together. Verify on actual desktop/phone hardware before accepting it as fully accessible.

**S7-C — Game/quest safeguards, source-preserved and narrowly exercised.** Quest board, active tutorial, side quests, completed disabled choices, announcement reading, paid regional travel, and dungeon entrance/camp decisions were not changed. Game-state and gates therefore preserve their original code paths, but a full state-space regression was **not** run. No broad certification claim.

**S7-D — Long-list/readability risk, still open.** Map canvas is responsive, but on a portrait phone it may be limited to 150px height and the dialog list uses small type. Grouping improves organization but does not prove usable hit areas, symbol collision handling, or readability on actual devices. No global CSS or input algorithm adjustments are justified without evidence.

**S7-E — Underlying map/wayfinding concerns, intentionally deferred (potentially high impact).** Owner suspects shortcomings or bugs in **(1) route solver, (2) clickable map, (3) Navigate, (4) Clear waypoint**. Source review identifies possible audit targets, **not confirmed defects**: coordinate projection on scaled map surfaces, 16px hit radius and overlapping points; tracking/state side effects in `storyNavigate` and `Clear waypoint`; repeated route generation and stale/unreachable destinations. The current step has **not** repaired or validated these behaviors. See [MAP_WAYFINDING_FOLLOWUP.md](MAP_WAYFINDING_FOLLOWUP.md) for the explicit separate-chat audit contract.

**S7-F — Main-branch drift, release gate.** Current `main` has a separate PWA update-detection commit (`5cc9ff7e70a0469f373e80e192312b4fa9fa03b3`) touching packaging scripts/tests. PR #415 diverged from main. Before any final merge, check/reconcile current main and run the owner-approved focused review and publishable build. Do not silently merge or enable the full suite.

## 4. Acceptance recommendation and next action

**Step 7 implementation is complete for its approved UI scope.** It may be marked review-ready only after the focused run is green on the final documentation commit. The seven-step *project* remains a draft PR until a separate **integrated review/merge authorization**. At that review, examine all Step 3–7 diffs, source and focused regression status, exact current main integration, English/Spanish coverage and outstanding device checks. No deployment is authorized by this audit.

After finishing the menu project in the current conversation, initiate the owner-requested **Map Routing and Waypoint Reliability** audit in a *new chat*. Audit first, repair in separately approved increments, without expanding this menu PR.
