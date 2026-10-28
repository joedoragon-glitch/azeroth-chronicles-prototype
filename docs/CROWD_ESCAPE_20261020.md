# Crowd escape and bounded movement planning — dev.107

> **Superseded runtime behavior — owner-directed rollback candidate, 28 October 2026.** This historical dev.107 actor jam/passage algorithm is superseded in candidate draft PR #567: no actor bodies or congestion timers remain. Independent terrain-route planning limits/retry clocks are retained to prevent CPU search amplification. This is **unmerged/unpublished** until the owner accepts it. Preserve the historical design and evidence below. See [rollback contract](ACTOR_BODY_COLLISION_ROLLBACK_20261028.md).

Joel reported severe FPS drops when player, companions and enemies become trapped together, and authorized temporary stacking to let the group escape. Preserve ordinary combat body blocking outside actual congestion, terrain/river/wall collision, accepted artwork, gathering safety, Recall and encounter rules.

## Finding and implementation

The existing move fallback relaxed only friendly bodies for 0.35 seconds. The non-party follower discarded its terrain-route retry clock on a blocked step, and retried empty routes every frame. A queued hero skill also ran a full terrain search every tick solely to check reachability. These are source-confirmed amplification paths; the reported device slowdown was not profiled here.

Navigation now permits 1.2 seconds of symmetric passage through all actor bodies, including opposing troops, the hero and bosses, after one second of actual body-blocked movement without progress. The original earlier friendly-only fallback remains. Terrain-only blockage, standing still and low FPS alone cannot grant passage. Movement is physical, without teleportation, invulnerability, healing or changed attack damage. Passive separation temporarily skips escaping pairs so it cannot push them straight back into the jam; normal collision/separation returns when the interval expires. Forced holds, fixed attack-warning origins and scripted movement retain their existing owners. Town NPCs were not body blockers; mobile NPC followers receive the bounded route behavior too.

The shell supplies active frame cadence to navigation. Sustained intervals of 40 ms or longer (about 25 FPS or less), observed over at least 0.5 seconds of bounded samples, shorten the actual-jam threshold to 0.2 seconds. Pauses, hidden pages and resume gaps clear the pressure signal. This signal never globally disables collision. Pressure and escape clocks are runtime WeakMaps, expire normally, clear with zone changes/removal/death, and are absent from saves.

Automatic movement shares at most four full route-planning calls per simulation tick, with one reserved for the hero. Others follow existing valid paths or wait for a later tick. The budget covers ordinary followers and companion travel; explicit map queries/road authoring/resource-delivery comparisons remain separate. Body-blocked steps retain cached terrain paths, empty routes retain the 1.3-second retry interval (companions retain their two-second safe-route interval), and materially changed targets invalidate old paths. Queued hero skill approaches retain their existing two-second stall cancellation without the redundant every-frame route search. Gathering avoidance remains authoritative even during escape.

## Focused checks

- `node tests/crowd-escape.test.cjs`: actual prop-wall corridor escape for hero, Soldier, pet, ordinary enemy, boss and mounted enemy; initial blocking, opposing/symmetric passage, expiry, terrain integrity, low-FPS urgency without global phasing, gathering safety, fixed warning origin, real hero tick/input, save/restore, death/revival and travel cleanup. Route-call counters verify bounded per-tick planning, player reservation across separation refresh, empty-route retry and retained body-blocked paths. Twelve unreachable followers make twelve planner calls across ten ticks, rather than retrying each follower on every tick; a blocked cached follower plans once across ten ticks.
- Existing travel-collision, targeting, dev.106 companion judgment and one-press Recall, and dev.105 gathering/boss-reset checks retain their outcomes.
- Changed-source formatting, build and generated-artifact consistency before package-only publication.

These are focused headless behavior/call-count checks. They establish bounded work and actual escape outcomes, not a measured Chromebook FPS guarantee or a full campaign/browser regression. Joel will test live crowded fights. Veyra ivory armor remains preview-only and is outside this change.

Published in PR #341 / `d54466352828c587164fe576d8cccf44fdba98da`; package-only run 39421254758 succeeded, with all 19 exact public files verified. Normal workflow restored. Receipt: `docs/evidence/CROWD_ESCAPE_DEV107_PUBLICATION_20261020.json`.
