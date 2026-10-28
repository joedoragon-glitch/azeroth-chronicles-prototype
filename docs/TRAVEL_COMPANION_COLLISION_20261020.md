# Companion collision during travel — 20 October 2026

> **Superseded runtime behavior — owner-directed rollback candidate, 28 October 2026.** This historical dev.95 travel-specific exception is superseded in candidate draft PR #567. The owner withdrew all actor-to-actor collision: hero, companions and enemies can now overlap in combat and travel. Terrain remains solid. This is **unmerged/unpublished** until the owner accepts it. Preserve the historical design and evidence below. See [rollback contract](ACTOR_BODY_COLLISION_ROLLBACK_20261028.md).

**Published:** dev.95 via #329, merge `43b033334cb3a4b151c82709e05bb988e6da67e0`, packaging-only run `39384765061`. Exact live files verified; normal workflow restored. [Receipt](evidence/TRAVEL_COMPANION_DEV95_PUBLICATION_20261020.json). Owner live play remains next.

Joel reports improved FPS on live dev.94 and requests free movement through companions outside combat while preserving companion collision as combat friction. Dev.95 implements this narrow follow-up on published dev.94 (`33eda049623463fe436bad6c12c04f85be66b1af`). The existing quick publication/manual-play workflow continues; no broad CI or full-game testing is requested.

`navigation.js` records the existing `manaCombatActive()` encounter state once per crowd frame. Outside that state, swept body tests permit hero/active-companion passage in either direction, including active pets through the shared party roster. Passive separation also stops pushing a travel companion away from the hero. Companion/companion spacing, hostile body blocking, terrain collision, scripted motion and all combat collision/congestion rules retain their existing paths. No new combat timer, save field, rendering work or frame-loop subsystem is introduced. Normal crowd-frame refreshes restore collision as combat starts and release it when the existing encounter state ends.

Focused verification covers actual hero movement through a companion, symmetric travel passage, passive overlap handling, collision/separation during combat, release after combat, idle hostile blocking, retreating-enemy handling and terrain bounds. Build, changed-file formatting and asset/generated-source checks are recorded with this candidate. No broad suites or hosted game CI. Dev.94 adaptive-resolution/app/runtime source and all artwork remain byte-identical.

Publish the committed dev.95 package through the one-time owner-travel-dev95 publisher, then restore the normal workflow and remove the temporary publisher. Actual-device play remains Joel's verification step.
