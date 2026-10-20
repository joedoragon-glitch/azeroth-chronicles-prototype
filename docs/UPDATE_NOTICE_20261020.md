# Visible game updates — 20 October 2026

Included with candidate `0.9.1+snapshot.dev.112`, after the optimization audit. Joel requested notice inside the game and an easier route to install, independent of the forum.

When a complete update is waiting, a persistent amber **Update available** button appears beside the HUD, and the menu button gains an amber border. The same Install action appears at the top of the adventure menu and remains in Game and settings. English/Spanish and desktop/phone use the existing language/layout system. The button is absent when there is no waiting update.

The shell checks on startup, return to the game and every five visible/online minutes, with shared in-flight work and throttled automatic checks. No per-frame network polling is added. Installation waits for the player's action; it saves the current started campaign before requesting activation. A failed save prevents activation. An already downloaded update can install offline. Downloading or checking does not suspend live play; a slow download reports that it is still downloading.

The worker keeps its complete offline packaging and hash-based reuse. First installation activates normally, while subsequent updates wait. Older clients that explicitly send `SKIP_WAITING` remain compatible. Other controlled tabs reload/save on controller change under the existing policy. The previous automatic installation/reload is intentionally replaced for current clients.

Verification pending: focused worker/cache checks, real waiting-worker flow, direct/menu access, localized phone fit, save retention and offline install/reopen. No forum message is sent.
