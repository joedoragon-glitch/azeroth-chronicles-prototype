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

- **Step 4: Controls — implemented on this continuing project branch; awaiting owner review.**
  - Put editable sections first in the Controls hub while leaving Movement and menus, Skills and targeting, and Companion commands references accessible.
  - Replace the long flat keyboard list with three manageable binding groups (Movement/menu, Skills/combat, Companion/utility); all native action IDs remain included exactly once, with optional legacy Mana Recovery retained only when active.
  - Keep all original right-handed, classic and left-handed presets, their explicit confirmation, default restoration and key-conflict rejection.
  - Keep the selected binding when returning from key capture, even though its displayed key changes; parent category, scroll position and Back navigation are preserved.
  - Change the existing single Touch & mouse page to a labelled phone-layout dropdown plus inline touch-to-move and mouse-to-move switches; the original `input.select` persistence and device layout updates remain authoritative.
  - English/Spanish headings and descriptions are translated; no default bindings or game mechanics change.

- **Step 5: Barracks — implemented on this continuing project branch; review candidate.**
  - Basic and Full Barracks now offer the same four primary service choices and order: Company, Recovery, Training, Operations. Existing optional tonic and peaceful-world final Rest remain on the root; only Basic retains its native gated Full upgrade.
  - Full's former flat recovery/treatment/death point, Expedition training, specialist and skill-journal actions are available through the same respective Recovery and Training branches Basic already used. No pricing, combat, rank, saved data, or repair/recruitment policy changed.
  - Full-only Resource expeditions moves into Operations, alongside local quests and gathering; expedition eligibility, worker selection and mission state remain native.
  - Full's duplicate Recovery option inside Company is removed because Full now offers the same first-level Recovery category as Basic. All companion/roster/pet/recruitment services remain in Company.
  - Completed versus under-construction Barracks remains a separate UI path; unchanged construction/assignment rules and native upgrade gating.
  - Focused tests: `tests/menu-priorities.test.cjs` reconciles the formerly stale Full-flat/Basic-flat expectation to the actual native grouped design; `tests/companion-onboarding-ui.test.cjs` covers actual bilingual Basic-to-Full interaction and remote expeditions.

- **Step 6: Character & services — implemented on this continuing project branch; focused review candidate.**
  - Character still owns permanent naming, Inventory & support, Skill journal and Talents; the Inventory destination now explicitly describes its contents.
  - Inventory displays **Ranger support and Preparation Tonics** as structured, read-only sections immediately. The former two separate informational-only pages are removed. Real Equipment actions retain their own screen for safe weapon selection, reforges, and stored legacy gear.
  - The existing Equipment overview and action callbacks are unchanged; no equipment or tonic is purchased simply by inspecting Inventory.
  - Smith service rows are organized **Equipment upgrades → Reforging → Appearance**, with **Expedition support** displayed only where the original smith exposes it. Weapon/armor prices, owned/surpassed states, reforge gates, cosmetics and training handlers are unchanged.
  - Alchemist offerings are grouped **Preparation Tonics → Ranger support → Training and resets**, preserving native paid actions, existing disabled states, companion vitality costs and discipline reset rules. Non-alchemist suppliers still perform their ordinary cargo and support duties, without new screens.
  - English/Spanish section labels and the Inventory path are maintained. The existing `game-menu-ui.test.cjs` now tests inline Ranger/tonic information; a new `character-services-ui.test.cjs` exercises bilingual merchant groups and availability without purchases.
  - No new settings, game engine/economy logic, v4 save data, renderer choices, or sound behavior.

## Remaining milestone order (do not implement without next owner turn)

7. Maps, quests and remaining menus — targeted changes only where warranted by evidence.

Each milestone gets its own focused commits, applicable regression tests, explicit source notes, and review. All work continues **on this same branch and PR**, not fresh branches or PRs. The project branch is the source for the next milestone; do not reset to old main between steps.

## Step 6 validation gates

- Character and Inventory menu routing, read-only Ranger support and tonic summaries, all Equipment actions still present and safe.
- Smith's existing prices, owned/locked reforge states, naming and optional expedition inheritance services remain visible on one labelled service screen.
- Alchemist's tonic purchase, Ranger field support, vitality training and paid talent reset actions retain original native availability checks and refresh handlers.
- Bilingual production-shell navigation in `tests/game-menu-ui.test.cjs` and merchant/price guard tests in `tests/character-services-ui.test.cjs`.
- Focused-only PR validation and reproducible build verification; no full-game, browser/device matrix or unapproved performance work. Device-specific layout and interactive merchant audio remain unverified.
- This is an incremental draft-project milestone. Do not merge or publish until Step 7 is complete and final owner review is given.

## Step 5 validation gates

- Same native category order, both Barracks types, no service disappearance or duplicate Company recovery.
- Recovery care/treatment and death-point/5% Full vs 15% Basic presentation retained; Succession removes ordinary death-point option.
- Full Operations retains resource expeditions; Basic Operations retains quests/gathering only, including Expedition 2 gathering prerequisite.
- Basic upgrade still requires Expedition 4, appropriate labor and crowns; optional tonic and final Rest still follow native state.
- Bilingual production-shell path checked in updated `companion-onboarding-ui`; domain call/navigation regression checked in updated `menu-priorities`. Use the repository's scoped PR validation and publishable-build check only.
- No broad/full CI, hardware-device or browser matrix without explicit owner approval; no merge, deployment, or version change.

## Step 4 validation gates

- `tests/game-menu-ui.test.cjs`: all keyboard bindings appear in exactly one section, existing preset confirmations/gates and bindings remain intact, safe rebind and restore round-trip, phone-layout selection, both touch/mouse toggles, bilingual navigation and saved preferences.
- `tests/menu-foundation-ui.test.cjs`: keyboard category Back, restored selected item, and scroll preservation.
- `tests/app.test.cjs`: unchanged app integrations and touch input primitives.
- Focused-only PR checks and reproducible build verification, not broad gameplay or browser/phone matrices.

No claim of physical-device, real-keyboard/browser-focus or screen-reader certification is made by the production-shell mock tests.

## Step 3 validation gates

- `tests/game-menu-ui.test.cjs`: actual bilingual production-shell traversal, five independent sliders, 0/100/37% adjustments and readouts, immediate persistence, mute preserving levels, reopening, sound window staying open, and unchanged campaign state.
- `tests/menu-foundation-ui.test.cjs`: selected control and scroll restoration on still-nested Controls screens.
- `tests/app.test.cjs`: direct app input and integration contracts.
- Focused-only PR checks and reproducible build check, **not** full-game suites or broad desktop/mobile Chromium/WebKit matrices without separate owner authorization.

Hardware audio audition, physical touch comfort and screen reader behavior remain unverified until explicitly checked. No unverified loudness improvement is claimed.

## Restrictions

No changes to gameplay, NPCs, economy, input bindings, camera, frame-rate/adaptive-skip behavior, Canvas/PixiJS trial, graphics or sound mix implementation, campaign save format, service-worker files, or version metadata. No independent merge, deployment, or release in Steps 3–6. Run the final focused integrated checks before proposing the single concluding merge for Steps 3–7.
