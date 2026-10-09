# Drowned Keeper interaction audit — 9 October 2026

Baseline: main `05e069f2`, v0.8.126. The released implementation comes from PR #185; closed draft #172 must not be merged again.

Integration: main advanced to `a996688e` (v0.8.127 actor idles and roads) while candidate CI ran. Preserve that complete release, including its added animation gate, manifests and immutable artwork; regenerate the v0.8.128 worker from the combined asset inventory. Only package/build/cache version lines conflict; no Archive or gameplay code conflicts.

## Confirmed flow

Normal defeat makes the captive visible only while no living Keeper or active TRUE encounter exists. Neri must be rescued before the promise is offered; the promise unlocks optional counsel. The ledger is a separate, optional discovery: defeat, rescue and cooperation do not award its knowledge. Reading it reveals the capture proposal once, with no XP or crown payment. Reading and cooperation persist independently.

Inactive early TRUE rolls leave time to bargain. Reentry activates the encounter and hides the captive. Awakening uses the same exclusion. An escaped Keeper cannot be consulted through Barracks. TRUE defeat recaptures him and retains the earlier promise; no second bargain or payment is required. Completed Basic and Full Barracks use the same genuine availability check. Legacy saves acquire the two interaction objects without duplicating them or resetting combat/progression.

## Corrections

- Delayed promise, shelf and answer actions now recheck campaign identity and Keeper availability. A button retained from an old run cannot make a promise for that run; escaped Keeper dialogue cannot open from a stale button. Requested answers refresh live rule values rather than retaining the first menu's figures.
- Boss records now describe the actual cooldown-mode HP siphons using `vitalitySiphon`, and the Dragon/Sentinel recovery abilities using `bossRecovery`. Re-enabling MP restores the authored mana-drain descriptions and suppresses cooldown-only healing descriptions. The prior reference looked for a nonexistent attack property and omitted these mechanics.
- Cooldown Training describes its current percentage and cap from live rules, without migration commentary in the character's explanation.

Combat, encounter activation, rewards, stable IDs, v4 saves, the captive drawing and selective quest narration are unchanged.

## Verification

Node regressions exercise Normal/Nightmare, early/no-early rolls, blocked pre-defeat rescue, Neri/promise gates, evidence-independent cooperation, actual Awakening activation, escaped/recaptured reloads, both Barracks, delayed actions and MP restoration. The read-only reference retains its three-class/two-difficulty checks.

The existing Archive browser test now also reloads the actual saved page before escape, during escape and after recapture; it opens the current Keeper attack record and consults him through a completed Basic Barracks. Chromium and WebKit exercise desktop, two portrait phones and landscape phone. Captive and counsel screenshots are reviewed at native viewport size. Build, formatting, generated/PWA checks and the full Node suite remain release gates, followed by exact-commit hosted CI and Pages live verification.

This is automated and visual engineering verification; it does not claim a physical iPhone playtest.
