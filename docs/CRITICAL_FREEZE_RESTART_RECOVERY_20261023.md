# Critical freeze and unclean browser restart recovery — 23 October 2026

**Status:** Draft integration candidate based on the optional frame-skip/emergency logic from PR #422. PR #423 crowd diagnostics and PR #424 collision fast rejection remain separate. Nothing in this draft is deployed or merged.

## Player-visible escalation

1. **Ordinary play:** No reset; original combat, collision and save rules continue. The existing default-On adaptive skipper can omit two eligible drawings when over budget.
2. **Critical load:** A hard frame stall or sustained extreme pressure enables the previously implemented bounded five-skip emergency and pauses `game.tick` before another enemy attack. The browser can still draw occasional probes. The hero and companions retain exactly their current HP.
3. **Encounter recovery:** If a single emergency lasts roughly five seconds, or at least three emergency episodes occur inside 20 seconds, the game cancels active enemy encounters using the existing battle-cancellation helpers. Living engaged enemies go to their recorded homes and reset combat state; living companions get a transient, terrain-safe withdrawal target behind the hero and physically move toward it, at most two per protected callback. There is no teleport or new combat AI and no reward/kill/death registration.
4. **Last resort:** If extreme trouble persists another eight seconds after the encounter reset, or restarts after the reset, the game calls the existing `enter()` and refuge/barracks placement methods without calling `die()`. The party returns alive with unchanged health/crowns and recorded campaign progress. The safe state is saved using the ordinary v4 writer.

## Browser freeze and restart

The parent emergency PR #422 **already includes a device-local unclean-session marker** in `PrototypePersistence.createRestartGuard`. This change deliberately reuses that guard instead of creating a second competing marker. The guard is armed when a valid saved session is loaded and during live play/resume, before any critical stall. It stores only version, game mode, hero class and small progress identifiers; never the campaign save itself.

A normal successful pause/exit saves and removes the marker, but a browser that becomes nonresponsive may be force-closed without running those cleanup handlers. A pending critical-recovery event keeps it armed even if a delayed close event fires. On next launch, the app validates the **latest existing v4 save first** and attempts a rescue on a cloned campaign state. It returns the party via its configured barracks or default regional refuge/town entry, saves that safe position, and resumes there. The system does not call `die()`, charge a penalty, restore free HP, or bypass a legitimately completed death/Succession transition.

This is best-effort: if the browser never gets another JavaScript callback, only the next launch can attempt recovery. LocalStorage might be unavailable, no save may exist, or cleanup may execute normally before a crash is recognized. On a fully unclean crash outside combat, the marker can still conservatively move the player to safety, which prioritizes avoiding a dangerous replay over exact-position continuation.

## Important limits

- A force-closed tab may still fire `pagehide`; when no emergency state was detected, the marker is cleared, so some abnormal terminations may not be distinguishable from clean exits. Pre-arming increases recovery odds but cannot guarantee detection of every platform/browser failure.
- A catastrophic freeze before the first encounter marker can be written remains undetectable. LocalStorage can be unavailable or evicted. The system cannot itself restart a frozen browser, repair a corrupt campaign save or guarantee that `requestAnimationFrame` ever resumes.
- An abrupt closure during an ordinary ongoing encounter with no clean shutdown could conservatively relocate the player as a false positive. The preferred tradeoff is player safety over resuming inside a dangerous jam.
- Actual hardware responsiveness and all boss-specific cinematic/AI reset rules require broader device/encounter verification. The current test gate is focused only, per owner policy.

## Focused regression

`tests/critical-restart-recovery.test.cjs` covers hero/companion HP, no deaths/penalties, enemy home reset, physical withdrawal behind the hero, selected barracks and refuge, valid-v4 marker restart, preservation of genuine Succession/hero-death states, clean `pagehide`, and staged escalation. Existing frame-skip/menu tests and reproducible offline build must also pass. No full game, physical-device or browser matrix unless separately authorized.
