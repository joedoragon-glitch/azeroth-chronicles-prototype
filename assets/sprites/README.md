# Azeroth Chronicles sprite assets

This directory is the source of truth for the illustrated static-sprite overhaul.

Phase 1 intentionally starts with an empty manifest so the legacy procedural renderer remains the visual fallback until approved art is added. Add an asset file here, then add its metadata to `manifest.json`.

Each manifest entry uses a canonical render key such as `hero:paladin`, `ally:soldier`, `enemy:goblin`, `boss:thorn`, `specialist:thorn`, `dungeon:crypt`, or `building:barracks:vale:basic`.

Required field:
- `src`: repository-relative asset path, normally `./assets/sprites/<name>.webp` or PNG.

Recommended fields:
- `displayWidth`, `displayHeight`: logical Canvas draw size in CSS pixels.
- `anchorX`: horizontal anchor fraction. Default 0.5.
- `anchorY`: ground/feet anchor fraction. Default 0.88.
- `labelHeight`: vertical clearance used for health plates and labels.
- `overlayScale`: optional scale for existing TRUE/ringleader/ranged-aim overlays.

The hosted game loads these files normally. The service worker caches the sprite manifest and its referenced images so the installed/PWA game remains available offline after its first connected load.

Do not bake health bars, attack telegraphs, TRUE/ringleader state effects, target rings, or other gameplay overlays into the base sprite art. Those remain procedural.
