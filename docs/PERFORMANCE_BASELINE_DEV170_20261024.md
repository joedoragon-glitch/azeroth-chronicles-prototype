# dev.170 candidate — one-time performance baseline for returning players

**24 October 2026 · implementation branch; not published or merged**

## Owner-approved upgrade behavior

For this release only, override previously saved *device-local* choices on the first launch of dev.170 or later code from this branch. Existing player selections may predate the current performance safeguards and can cause a returning player's game to feel slower than the currently recommended configuration.

A durable local marker `azeroth-performance-defaults-dev170-v1=applied` is recorded after completing the writes. On later launches, the migration does **nothing**, including when the player manually changes performance choices after the update. This deliberately replaces even a previously saved Adaptive Frame Skip Off **once**, rather than changing its usual steady-state persistence contract.

| Migrated key | First-launch value |
| --- | --- |
| `azeroth-fps-v1` | `auto` (Auto 20–30 FPS) |
| `azeroth-adaptive-frame-skip-v1` | `on` |
| `azeroth-render-resolution-v1` | `auto` |
| `azeroth-optimization-mode-v1` | `off` (current standard) |
| `azeroth-camera-v2` | `{"desktop":1.5,"phone":1.5}` |

**Not migrated:** saved v4 Normal/Nightmare campaign or gameplay data; profile/audio; language; input bindings; screen layout; previously confirmed experimental renderer and its Keep/Revert safety control. The migration runs before presentation controllers read old preferences and does not change gameplay balancing, combat or saves.

Existing-save players receive a short localized notice after normal launch. A crash-recovery notice takes precedence if there was an unexpected previous shutdown. Storage-denied browsers retain the existing safe in-memory defaults rather than breaking startup.

## WebGL2 presentation

Settings now explain the potential benefit plainly: PixiJS WebGL2 **may run faster** on some devices, but it is experimental and not guaranteed to improve FPS. The 15-second Keep/Revert safety trial and reliable Canvas fallback remain unchanged.

The confirmation panel uses a restrained high-contrast card, readable supporting text, and separate full-width **52px-minimum** buttons in a vertical layout with **14px spacing**. Both touch and keyboard actions retain their original handlers.

## Review and release

- Keep in a separate PR until owner publication approval; merging into `main` triggers Pages publication.
- The dev.170 candidate updates package/lockfile, generated build info and service-worker cache version together.
- Focused tests: first migration from old explicitly saved values; v4 save preservation; English/Spanish; retained screen preference; trial button layout; post-migration manual-choice persistence, plus existing menu/platform/FPS/PWA regressions.
- This change provides a **recommended starting setup**, not a measured new hardware FPS gain or a guarantee that WebGL2 will run faster.
- No comprehensive browser, phone or WebKit test matrix is authorized by this request.
