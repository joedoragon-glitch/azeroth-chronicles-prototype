# Critical freeze and unclean browser restart recovery — 23 October 2026

**Status:** Draft integration candidate based on the optional frame-skip/emergency logic from PR #422. PR #423 crowd diagnostics and PR #424 collision fast rejection remain separate. Nothing in this draft is deployed or merged.

## Player-visible escalation

1. **Ordinary play:** No reset; original combat, collision and save rules continue. The existing default-On adaptive skipper can omit two eligible drawings when over budget.
2. **Critical load:** A hard frame stall or sustained extreme pressure enables the previously implemented bounded five-skip emergency and pauses `game.tick` before another enemy attack. The browser can still draw occasional probes. The hero and companions retain exactly their current HP.
3. **Encounter recovery:** If a single emergency lasts roughly five seconds, or at least three emergency episodes occur inside 20 seconds, the game cancels active enemy encounters using the existing battle-cancellation helpers. Living engaged enemies go to their recorded homes and reset combat state; living companions get a transient, terrain-safe withdrawal target behind the hero and physically move toward it, at most two per protected callback. There is no teleport or new combat AI and no reward/kill/death registration.
4. **Last resort:** If extreme trouble persists another eight seconds after the encounter reset, or restarts after the reset, the game calls the existing `enter()` and refuge/barracks placement methods without calling `die()`. The party returns alive with unchanged health/crowns and recorded campaign progress. The safe state is saved using the ordinary v4 writer.

## Browser freeze and restart

A truly blocked JavaScript thread cannot run an emergency handler. To cover force-closing the app and reopening it, the client **pre-arms a minimal device-local marker** during active combat (at most once every two seconds). It contains only an indicator, game mode, hero class, zone and timestamp. It is separate from the v4 campaign save, does not carry any game state, and expires after 30 days. The marker is cleared on a normal, clean exit (except during active emergency protection), or after the encounter has ended safely.

If the player force-quits a severely stuck browser, a recent marker can survive when `pagehide` and other normal cleanup handlers cannot execute. On the **next load**, the game first reads and validates the latest available campaign save using its normal restore logic, then checks that the marker matches the save's mode/class/zone and that the hero is alive, with no pending Succession/death/game-over. If matched, it moves the saved party using the normal barracks preference or last valid refuge. It saves that new safe location and then consumes the marker. It does **not** delete or overwrite a source save before restore succeeds, award HP, grant invulnerability, penalize crowns, or override actual deaths. A failed save leaves the marker for another attempt.

## Important limits

- A force-closed tab may still fire `pagehide`; when no emergency state was detected, the marker is cleared, so some abnormal terminations may not be distinguishable from clean exits. Pre-arming increases recovery odds but cannot guarantee detection of every platform/browser failure.
- A catastrophic freeze before the first encounter marker can be written remains undetectable. LocalStorage can be unavailable or evicted. The system cannot itself restart a frozen browser, repair a corrupt campaign save or guarantee that `requestAnimationFrame` ever resumes.
- An abrupt closure during an ordinary ongoing encounter with no clean shutdown could conservatively relocate the player as a false positive. The preferred tradeoff is player safety over resuming inside a dangerous jam.
- Actual hardware responsiveness and all boss-specific cinematic/AI reset rules require broader device/encounter verification. The current test gate is focused only, per owner policy.

## Focused regression

`tests/critical-restart-recovery.test.cjs` covers hero/companion HP, no deaths/penalties, enemy home reset, physical withdrawal behind the hero, selected barracks and refuge, valid-v4 marker restart, preservation of genuine Succession/hero-death states, clean `pagehide`, and staged escalation. Existing frame-skip/menu tests and reproducible offline build must also pass. No full game, physical-device or browser matrix unless separately authorized.
