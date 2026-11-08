# Screen & Performance settings

## November 7 follow-up — Pixi-first settings audit (#839)

Baseline: published dev.272 (`0a7397bfb39e456f1d88584bca8f71c8fbe0c114`). The October consolidation and dev.271–272 candidate notes below are historical. The follow-up belongs in one PR.

| Gate | Audit findings | Observable result |
| --- | --- | --- |
| Settings hierarchy and renderer state | F01–F02 | Landing identifies active and preferred renderer before any settings. Display, renderer/recovery, active graphics, pacing and diagnostics have separate destinations. Deliberate Canvas and GPU fallback are distinguishable. |
| Effective controls | F03–F04, F09–F10 | Pixi device sharpness is fixed during play; Canvas Auto can adapt. Preset reports applied density/particles and retained choices. Zoom mentions rendering load and the FPS label describes a draw target. |
| Device preferences and recovery | F05–F08 | Returning devices receive the reset once, partial writes remain retryable, fresh installs use defaults, and post-reset edits persist. Trial interruption and safety holds still reach Canvas. Device-only selections produce zero campaign writes. |
| Diagnostics and accessibility | F11–F13 | EN/ES menu and recovery flows have clear focus/back navigation. Local export stays one click from Playtest tools. Sample deletion requires confirmation and describes the evidence cleared. |
| Build and acceptance | F14 | Record candidate SHA and focused shell, renderer, migration, packaging and browser results. Physical installed buildCommit and full-campaign performance are separate acceptance evidence. |

Resume in order: verify main and the open PR, finish the preference/safety contract, complete the player-facing pages, then run targeted shell and browser journeys and reconcile this document and the development ledger. Candidate acceptance requires the exact branch head and concrete pass/fail evidence. Publication requires separate owner authorization.

Checkpoint: initial runtime implementation is in draft [PR #856](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/856). It splits the settings pages, uses the live renderer for graphics controls, separates saved and effective values, and adds a pre-controller settings migration. An interrupted trial preserves the guard’s Canvas decision rather than being retried by the migration. Current checks and remaining acceptance are tracked in the PR.

### Playtest tools

The parent menu is **Settings** (**Ajustes**). **Playtest tools** is a sibling of **Screen and performance**. Its single working page includes report export, the screenshot-friendly Performance details readout, inline profiling, and sample reset. **Help and privacy** is its only informational child page. The readout uses existing frame and profiler snapshots on page open or refresh, labels issued draws separately from display FPS, and distinguishes empty samples from measured zero. The full JSON export remains device-local and unchanged. Effect recording remains developer-gated.

### Candidate controls and recovery

The landing shows active and preferred renderers, fallback status when applicable, effective backing resolution and the current draw target. The Display page shows resolved layout and camera zoom. Renderer and recovery keeps Canvas as a selectable backup and closes the menu for a deliberate Pixi trial. Graphics follows the active backend, including after a context loss while the menu is open. Frame pacing has its own settings page.

The versioned migration runs before settings controllers. It resets display and camera, both renderers’ quality, draw target and routine skip. It defaults to Pixi when safe. An interrupted trial is resolved by the existing startup guard, including retaining Canvas where the trial was unconfirmed. An existing recovery hold remains in force. The migration is allowlisted, its completion marker is written last, and a later successful retry completes a partially written migration. Device-only changes do not serialize a campaign save.

Local shell checks passed for bilingual navigation, save-write isolation, migration and recovery storage, diagnostics/export, frame skip and resolution. Software Chromium 153 passed the focused Pixi trial → Keep → preset → context loss → live Canvas menu journey, FPS preference/ungated simulation on desktop and the phone game document, and EN/ES phone-frame menu geometry, contrast, touch, Back and Escape. The generated offline package and release documentation consistency checks passed. GitHub runs for the exact candidate head are tracked in #856. Local software Chromium does not verify WebKit, assistive-technology speech output, installed builds or hardware FPS.

## Historical Step 2 record

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

## Pixi recovery follow-up, dev.271 release

Pixi preparation uses the explicit rendering density and optimization preference. Canvas backup retains its temporary adaptive density and optimization state while Pixi prepares or runs. A failed retry or return to Canvas restores that state. Playtest reports show the effective Pixi backing ratio while Pixi owns the presentation. Existing settings and controls remain available. PR #854 merged into main as `23f6dcb9fa5057903727bbfd481698d35f147a97`; focused validation and Pages publication [#42409998499](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42409998499) succeeded on 7 November 2026. This is source/release verification, not evidence of owner-device installation or campaign-wide FPS.

## Pixi pacing follow-up candidate

Routine Pixi frame skipping requires drawing to account for at least half of the measured callback work. The existing budget, consecutive-skip and frame-age limits still apply. Canvas and emergency protection retain their existing rules. This is included in unmerged PR #855, based directly on main following #854; not a player release. The selected FPS remains a draw target, separate from confirmed presentation and simulation timing.

## Pixi graphics settings reconciliation, dev.272 candidate

Pixi keeps its own resolution, atmospheric-particle preference, and Optimization Mode state. The preset caps resolution at the tested 80% candidate and hides decorative motes. A previously selected lower custom resolution is respected. Turning the preset off restores custom choices. Changes draw while the settings screen pauses the campaign, so density preparation happens before gameplay resumes. Canvas retains its own automatic and manual preferences. Pixi keeps the normal terrain, audio, warning, and input behavior. New FPS choices are Auto, 20 and 60. An existing legacy 30 or Auto 30–60 choice stays selectable until the player chooses a new target. Existing explicit 60% or 50% resolution choices likewise carry forward until changed. The preset is opt-in. Software-browser evidence and actual owner hardware acceptance are separate.


## Focused CI browser regression ownership (7 November 2026)

The FPS browser fixture exercises the actual `phone-game.html` document hosted by the separate `phone.html` orientation/iframe shell; PWA/phone framing remains independently covered by the release and startup browser workflows. The real title/new-game language entry remains required, rather than an artificial automatic-start shortcut. The focused Pixi browser gate now drives a single real desktop WebGL2 select → Keep → context-loss → effective Canvas-settings journey. The existing longer Mage combat overlay, lighting, resize, reload and phone trials are preserved in the same file for explicitly invoked full manual browser acceptance; they are not asserted passed by this focused subset. This scope split prevents the former two-journey CI process from timing out at six minutes after the Mage case already passed, without raising CI timeouts or waiving the active-fallback check. Chromium software results do not establish physical-device performance.
