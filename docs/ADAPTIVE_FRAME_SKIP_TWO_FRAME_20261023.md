# Adaptive frame skip — default-on, two-frame revision (23 October 2026)

**Status:** Focused implementation candidate on a draft pull request, including critical-load protection; not a published release. Supersedes the dev.166 skip-intensity/default constraints upon merge. No change to the normal FPS limiter, combat damage formulas, campaign saves, or graphics backend selection. The added critical protection temporarily pauses gameplay updates when responsiveness is lost.

## Owner-approved behavior

- Adaptive Frame Skip now defaults **On** when the device has no explicitly saved preference. A stored **Off** remains Off, and toggling either way persists only locally, not in campaign saves.
- It is available at **every positive finite FPS target**, including fixed 20/30/60 and Auto modes when they switch between targets.
- After six real drawn-frame samples, it may skip when exponentially smoothed total drawn-frame work exceeds **112% of the current FPS target period** and measured rendering takes at least **5 ms**. A CPU-only bottleneck with an inexpensive renderer does not qualify.
- It may skip **two consecutive FPS-eligible drawings**, then must draw on the next eligible opportunity. Draws suppressed by the separate ordinary FPS gate are not counted as adaptive skips.
- The old **110 ms** guard is replaced with a **350 ms stale-image guard**: if the most recent actual drawing is already 350 ms old, do not skip the next eligible drawing. This is a decision-point safeguard, not a guarantee of screen presentation within 350 ms, because the browser may not supply callbacks.
- **No special frame-skip suppression for warning, elite-warning, charge-interrupted, or death events.** Combat warnings, telegraphs, AI, simulation, audio, input and visual effect state still advance on active callbacks before the draw decision. If a draw is skipped, the next image uses current simulation/cue state.
- Pausing or hiding resets the short-term load estimate; cumulative skip count remains session-scoped. Pressure subsiding automatically stops skipping.
- Canvas 2D and PixiJS WebGL2 still share the same outer draw gate. The Pixi world and Canvas combat overlay are skipped together when a drawing is adaptively suppressed.

## Critical slowdowns: emergency recovery and party protection

A critically slow active animation callback can mean the player has no practical opportunity to react to enemy attacks. **The emergency mode freezes gameplay rather than granting permanent immunity or rewriting hit/death rules.** The same hero and companions retain their exact current HP, positions and campaign state while the frame-loop continues testing whether rendering has recovered.

- Activation: one active callback interval of **650 ms or more**, two consecutive active intervals of **180 ms or more**, or two actual drawn-frame samples of **140 ms or more rendering** / **190 ms or more total synchronous work**. Detection runs **before** `game.tick` for callback-gap triggers; draw-work triggers protect the *next* active callback. Paused/hidden/menu frames do not count.
- Emergency skip: up to **five consecutive FPS-eligible drawings**. Draw-age guard is relaxed to **650 ms** to spend more opportunities catching up, then the next available eligible frame must render. Both Canvas and Pixi world + Canvas combat overlay are treated equally.
- Party protection: while recovery is active, the main `game.tick` loop—including enemy attacks, boss damage, player and companion HP changes, cooldowns and simulation clocks—is not run. Combat effect lifetimes and the separate charged-ability wall clock also stop. No extra regeneration, death interception, reward grants, save schema mutation or global invulnerability flag is introduced.
- Recovery: at least **three genuinely issued rendering probes** must each show an active callback interval under **110 ms**, total work under **90 ms**, and render work under **70 ms**. Skipped drawings do not count. Once satisfied, gameplay resumes on the following callback, with the existing `dt <= 0.1` cap preventing fast-forward catch-up damage.
- A player-facing English/Spanish message explains that combat is paused due to critical slowdown, and a recovery notice appears when it ends. The Settings menu is still accessible so the player can lower graphics quality.
- An explicit local Adaptive Frame Skip **Off** disables both normal adaptive skipping and this associated emergency protection. Closing a menu or hiding/pausing resets recent load evidence. The new diagnostic status includes emergency activation count and protected-callback count.
- The thresholds are provisional and require physical-device observation. A browser that stops issuing callbacks entirely cannot be made to render by Javascript, and these guards do not diagnose GPU hangs. A persistently slow device may remain in recovery until resources improve or the player changes settings. Critical protection frames also contaminate general frame-profile averages if compared as ordinary combat data.

## Abnormal browser termination and next-launch recovery

When the browser entirely stops executing JavaScript, no in-session timer can rescue an already-frozen page. The application now arms a **small device-local marker** on active saved-game launch and after focus returns. A normal successful save on blur, hidden-page transition or `pagehide` removes that marker. If the next startup finds an unmatched clean-exit signal (an active marker from the previous session), it validates the existing latest campaign save and **relocates a copy** to the established recovery destination:

- Selected completed local Barracks, when available under existing recovery rules; otherwise the saved refuge site for the current region (or its ordinary regional refuge).
- Uses existing `enter()` and `arriveRefuge()` to clear active combat, summoned pressure, projectiles, hazards, transient movement and telegraphs. It never calls `die()`, awards resources, resets quests or alters deaths/gold/companion HP.
- Saves the successfully recovered candidate immediately, then marks the new session active. A failed or invalid recovery retains the original valid game rather than overwriting it. Storage permission failures are tolerated.
- **Normal clean exit and relaunch stays at the exact saved location.** The marker stores mode/class/basic save identity only; it never duplicates a campaign or enters the v4 save schema.
- A browser/OS that kills the process without a lifecycle event can leave a marker even if the user was not experiencing lag. In that unusual case the next launch favors player safety by returning to the recovery point while preserving progression. If both JavaScript and persistent browser storage fail entirely, no local program can guarantee automated recovery. A genuinely invalid main save still needs an existing valid backup/export.
- Successor selection/game-over and an already-dead hero are not overridden. No attempt is made to undo a legitimate defeat or death penalty.

Focused acceptance uses the actual production app boot path against shared persisted storage: unclean close at a hazardous location, barracks priority, exact HP/crowns/kill statistics, current zone encounter cleanup, normal clean-pagehide reload at exact coordinates, invalid markers and unavailable storage.

## Why retain a stale-image guard?

At a target of 20 FPS, two eligible skips can produce approximately 150 ms between actual drawings if callbacks arrive normally. At very low active callback rates, two skipped callbacks could otherwise leave the screen visually stale for much longer. The 350 ms bound allows a skip in a roughly 5 FPS stress scenario, but forces the next eligible drawing when the retained image is already old. It cannot eliminate stalls caused by browser scheduling or simulation overload.

## Focused acceptance and measurement boundaries

Relevant checks: `tests/frame-skip.test.cjs`, `tests/frame-rate.test.cjs`, `tests/frame-profile.test.cjs`, `tests/game-menu-ui.test.cjs`, direct app/runtime regressions selected by focused CI, and reproducible offline package verification. No broad game/phone/browser matrix should be triggered automatically.

The existing profiler records game callbacks and issued draw calls, not physical monitor-presented FPS. A higher callback count or larger skip count is **not proof** of higher visual FPS, smoother controls, or shorter input latency. A matched-scene Chromebook/mobile combat comparison, including persistent boss warnings in Canvas and PixiJS, remains necessary before declaring a player-perceived improvement. No boss telegraph durations or damage rules were changed.
