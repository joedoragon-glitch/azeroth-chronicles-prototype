# Game Menu Usability Overhaul — continuing project (Steps 3–7)

**Working branch:** `game-menu-overhaul-steps3-7`  
**Review:** One draft PR for all remaining steps. Do not merge/publish until the owner approves the completed project.  
**Starting point:** `main` after Step 1 PR #413 and Step 2 PR #414, `b6a7a7c3517db02de2fefeb1445d9a78d56d2d58`.  
**Plan:** Project source `AZEROTH_CHRONICLES_MENU_AUDIT_2026-10-23.md` (the seven-step menu audit).

## Completed milestones

- Step 1: Shared Menu Foundation — merged separately as PR #413.
- Step 2: Unified Screen & Performance — merged separately as PR #414.
- **Step 3: Music & Sound — implemented on this project branch, awaiting owner review.**
  - One `Music and sound` dialog now contains a persistent master mute switch and five continuously adjustable sliders: Master, Music, Ambience, Effects, and Interface.
  - Volume sliders show 0–100% and use the existing `audio.setSettings` API with 0–1 levels, retaining live gain updates, channel independence, existing mixing profiles, and existing `persistProfile()` storage semantics.
  - Muting does not reset any channel; reopening the dialog displays saved values. Audio is not changed in the campaign snapshot.
  - No separate Quieter/Louder pages, so no extra Back trips.
  - Uses existing shared menu controls; percentage suffix and descriptive assistive label added to the generic slider primitive.
  - Preserves English/Spanish translations, existing settings defaults, and navigation to Game & Settings.
  - The old sound-menu navigation assertion in the shared foundation test now exercises the unchanged Controls → Touch and mouse options flow.

## Remaining milestone order (do not implement without next owner turn)

4. Controls — organized keyboard, touch and mouse configuration.
5. Barracks — align Basic/Full Barracks top-level service organization.
6. Character & services — shorten redundant informational routes and clarify merchants.
7. Maps, quests and remaining menus — targeted changes only where warranted by evidence.

Each milestone gets its own focused commits, applicable regression tests, explicit source notes, and review. All work continues **on this same branch and PR**, not fresh branches or PRs. The project branch is the source for the next milestone; do not reset to old main between steps.

## Step 3 validation gates

- `tests/game-menu-ui.test.cjs`: actual bilingual production-shell traversal, five independent sliders, 0/100/37% adjustments and readouts, immediate persistence, mute preserving levels, reopening, sound window staying open, and unchanged campaign state.
- `tests/menu-foundation-ui.test.cjs`: selected control and scroll restoration on still-nested Controls screens.
- `tests/app.test.cjs`: direct app input and integration contracts.
- Focused-only PR checks and reproducible build check, **not** full-game suites or broad desktop/mobile Chromium/WebKit matrices without separate owner authorization.

Hardware audio audition, physical touch comfort and screen reader behavior remain unverified until explicitly checked. No unverified loudness improvement is claimed.

## Restrictions

No changes to gameplay, NPCs, economy, input bindings, camera, frame-rate/adaptive-skip behavior, Canvas/PixiJS trial, graphics or sound mix implementation, campaign save format, service-worker files, or version metadata. No independent merge, deployment, or release in Steps 3–6. Run the final focused integrated checks before proposing the single concluding merge for Steps 3–7.
