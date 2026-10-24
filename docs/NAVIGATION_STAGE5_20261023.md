# Azeroth Chronicles — Stage 5 map input and navigation integration

**Date:** 23 October 2026 (owner local). **Scope:** [Issue #420](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/420), cumulative [draft PR #421](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/421). This is a focused stage checkpoint, **not the final approval-to-merge audit**.

## Preserved game contract

1. **Only named, authored destination markers and the corresponding accessible list rows** may be selected. Ordinary landscape taps do nothing. Players must explicitly press **Navigate** before the hero begins walking.
2. Automatic map travel is interrupted **only by deliberate manual movement** (keyboard/joystick/world move command) or an explicit Cancel. Ordinary hero auto-attacks, skill attempts including out-of-range targeted skills, and companion combat do not cancel or redirect a chosen journey.
3. When a player takes control manually, the selected guide remains visible and the contextual **Cancel navigation** remains available until dismissed, arrival or invalidation; quest-only and gathering-only guidance does not create that button. Map → Clear waypoint is a second entry point. Companion gathering orders remain untouched.
4. Map keyboard aliases remain **Z** (default configurable) and **M** (safe alias that yields to custom bindings); **Tab** stays Squad Doctrine. Map stays prominent near the top of the game menu. All visible control text is EN/ES.
5. Region change, death, completed arrival, session replacement and historical-save sanitation cannot leave a stale automatic travel route or phantom Cancel UI. Service frontages and shared solver corrections from Stages 3 and 4 remain in the same draft PR.

## Stage 5 corrections

### Grouped map actions / keyboard focus

The recent menu overhaul inserts non-interactive headings between groups of destinations. The old `menuIndex = orderedPlaces.indexOf(place) + 1` assumed they were all contiguous, highlighting the wrong actual action following a canvas click. The implementation now resolves the selected **actual button** through the menu's actionable-button array, restoring correct visible highlighting and keyboard action identity without making section headings selectable. `aria-pressed` continues to identify the selected destination.

### Mouse, touch, overlap and scaling

The map still has its 480×320 authored pixel surface, but touch target mapping works in **actual displayed CSS pixels** using `getBoundingClientRect()`. This corrects click alignment on different phone widths and portrait/landscape layouts without changing world coordinates. A 12 CSS-pixel mouse threshold remains precise, while 22 CSS pixels gives fingers a reasonable tap area. If **two markers are so close that the tap cannot reliably discriminate between them**, neither is selected; the user can choose the clearly labeled list row. No marker means no destination, and all selection still requires a separate Navigate action.

The portrait phone stylesheet no longer applies a height-only canvas clamp that could produce an aspect mismatch/letterbox. Instead it retains the real 3:2 ratio (at most 270×180 display pixels), while phone landscape uses responsive width with the same ratio. Standard 44px minimum controls, safe-area offsets and menu hiding for the contextual Cancel button remain.

### Regression coverage

- `tests/navigation-map-stage5.test.cjs` — EN/ES live production-shell map, marker vs empty/ambiguous taps, changed canvas display scale, keyboard action index after category headings, separate Navigate, map entry and Cancel visibility, manual control and quest/gathering ownership (earlier Stage 2 tests), combat basics, and lifecycle changes on zone and death.
- `tests/navigation-map-visual.test.cjs` — **one targeted Chromium acceptance smoke** (not a broad browser matrix): rendered desktop 1280×800 and phone 375×800 / landscape 800×375. Tests actual displayed map aspect, physical mouse/finger coordinates, list selection/aria state, explicit navigation, contextual Cancel visibility and overlap with HUD/skill/joystick/target/recall controls, and manual movement takeover. It uses existing production HTML/CSS/JS through a local HTTP server.
- Reuses `tests/navigation-stage2.test.cjs`, `tests/map-navigation.test.cjs`, `tests/navigation-route-stage4.test.cjs`, `tests/targeting.test.cjs` and the automated owner-approved focused PR CI selection for save and combat regressions.

### Evidence and limitations

The source tests are automated, not a physical iPhone, Safari/WebKit, ChromeOS, accessibility assistive-technology session, entire-campaign run or all-mode save-corpus. **Do not claim physical device certification** even if the single focused Chromium acceptance check passes. Actual iOS safe-area notches, text zoom and hardware interaction should be observed with owner hardware before release when available. The targeted Chrome browser smoke **passed** on the integrated Stage 5 code head, but this does not certify actual physical devices or Safari/WebKit. The accepted focused workflow evidence is [GitHub Actions run 40049004577](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40049004577): **11 focused test files passed**, including the EN/ES production-shell map cases, real Chromium desktop (1280×800), phone portrait two-thumb (375×800) and phone landscape left-hand (800×375) rendered UI cases, and the reproducible multi-file Pages/PWA build. The deploy job was explicitly skipped.

No PixiJS rendering change, enemy AI balance, terrain authoring, save-v4 format expansion, performance cache, asset packaging or single-HTML architecture constraint is introduced by Stage 5.

## Stage 5 rendered-browser corrections and final focused evidence

The first desktop browser smoke exposed that the Stage 2 Cancel styling had been appended to `styles/app.css`, which is **not loaded by the actual game HTML entry points**. The button therefore was not being hidden during menus. The base button styling, menu-open hiding and keyboard focus ring now live in the loaded `styles/prototype.css`. Inactive CSS rules were removed from `styles/app.css`.

The next rendered-browser smoke found the newly styled button overlapping the desktop right-side information HUD. A desktop-only offset in `styles/desktop.css` now positions the small Cancel control immediately to the left of the existing HUD; both desktop HUD widths are accounted for. The phone-specific safe-area positions remain in `styles/phone.css`.

**Validated rendered cases:** desktop (1280×800); portrait phone two-thumb (375×800); landscape phone left-hand (800×375). Every case checks the actual DOM canvas aspect, marker click/tap identity, accessibly selected list action, explicit Navigate, contextual Cancel disappearing during menus and after dismissal, absence of intersection with the visible HUD and movement/combat controls, and immediate keyboard manual takeover preserving guidance. Earlier shell tests additionally cover EN/ES, close markers/empty terrain, control shortcuts, quest/gathering ownership, range-aware combat, region/death invalidation, saved orders and authored ferry/solver contracts. This evidence is focused, not an exhaustive all-regions live journey or physical WebKit/device certification.

**Stage 5 implementation status:** complete for owner review. **Final whole-PR audit:** deliberately separate and still outstanding. **Merge/deployment:** not authorized.

## Release discipline

- [x] Stage 1 audit
- [x] Stage 2 control ownership, cancellation and ranged-skill priority
- [x] Stage 3 ferry/service approaches
- [x] Stage 4 fallback for false no-route
- [x] Stage 5 map/interaction implementation and focused test definitions
- [x] **Stage 5 focused CI outcome** — 11 relevant suites and real rendered Chromium smoke passed; publication skipped (see run 40049004577)
- [ ] **Separate final cumulative technical audit** — entire PR diff against current `main`, focused evidence, risks, localization, accessibility, phone CSS, fallback renderer, historical saves and GitHub release safety
- [ ] **Explicit owner authorization** to merge and publish, never presumed by Stage 5 completion

**Stop after Stage 5 for owner review.** Keep PR #421 draft/unmerged/undeployed.
