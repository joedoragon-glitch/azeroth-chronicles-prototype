# Visible game updates — 20 October 2026

Published in `0.9.1+snapshot.dev.112` through PR #346 after the optimization audit. [Exact-live receipt](evidence/OPTIMIZATION_DEV112_PUBLICATION_20261020.json). Joel requested notice inside the game and an easier route to install, independent of the forum.

When a complete update is waiting, a persistent amber **Update available** button appears beside the HUD, and the menu button gains an amber border. The same Install action appears at the top of the adventure menu and remains in Game and settings. English/Spanish and desktop/phone use the existing language/layout system. The button is absent when there is no waiting update.

The shell checks on startup, return to the game, restored connectivity and every five visible/online minutes, with shared in-flight work and throttled automatic checks. Existing registration is recovered without requiring network access. No per-frame network polling is added. Installation waits for the player's action; it saves the current started campaign before requesting activation. A failed save prevents activation. An already downloaded update can install offline. Downloading or checking does not suspend live play; a slow download reports that it is still downloading. Failed activation restores the prior pause state.

The worker keeps its complete offline packaging and hash-based reuse. First installation activates normally, while subsequent updates wait. Older clients that explicitly send `SKIP_WAITING` remain compatible. Other controlled tabs reload/save on controller change under the existing policy. The previous automatic installation/reload is intentionally replaced for current clients.

The real waiting-worker test passed in Chromium on desktop and 375×800 Spanish phone: first install has no notice; the next version waits, both menus expose Install, failed saving prevents activation, offline acceptance reloads into the new cache with 42,424 test crowns retained, the old cache retires, and offline reopening works. A failed later update check leaves play responsive. Screenshots were reviewed for fit and separation from the HUD; the first desktop overlap was corrected.

The audit also caught and repaired the first-session reload gate: initial service-worker claim now establishes the session's controller without consuming the single-reload guard. A later accepted update in that same first session reloads correctly.

Sixteen focused worker/offline checks and the existing historical routing oracle passed. The latter now compares post-install routing against its unchanged archived source; dev.90's hash-based audio reuse and the new deliberate activation policy are checked in their own current-install tests. One old material stub gained `caches.keys`, and a mine movement fixture now advances simulation time for route retry clocks; these are test corrections, not gameplay changes. No forum message was sent.

[Desktop notice](../tools/performance-audit-20261020/update-desktop.webp) · [Phone notice](../tools/performance-audit-20261020/update-phone.webp) · [Real update test](../tests/update-notice-browser.test.cjs).
