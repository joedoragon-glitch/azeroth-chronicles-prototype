# Azeroth Chronicles pixel-art sprites

This directory holds the approved static pixel-art sprites used by the hosted GitHub Pages/PWA game. The procedural Canvas renderer remains the fallback for every asset that has not yet been approved.

Register each approved asset in `manifest.json`. Canonical examples include `hero:paladin`, `ally:soldier`, `enemy:goblin`, `enemy:goblin:ranged`, `boss:thorn`, `specialist:thorn`, `dungeon:crypt`, `prop:house:vale`, and `building:barracks:vale:basic`.

Required:
- `src`: repository-relative transparent lossless WebP or PNG, normally `./assets/sprites/<name>.webp`.

Recommended:
- `displayWidth`, `displayHeight`: logical Canvas display size.
- `anchorX`: horizontal ground anchor fraction; default 0.50.
- `anchorY`: vertical ground anchor fraction; default 0.88.
- `labelHeight`: base clearance for health plates and labels.
- `overlayScale`: optional tuning for existing TRUE/ringleader/aim overlays.
- `scale`: optional authored scale multiplier; entity `visualScale` still applies.

Safety rule: special enemy variants do not fall back to an ordinary species sprite. Ranged, hybrid, guard and captain entities keep the procedural renderer until their exact sprite key exists. This protects readable weapons, roles and miniboss identity.

Pixel sprites are drawn with Canvas smoothing disabled. Keep artwork close to its intended gameplay dimensions so the pixel clusters stay deliberate.\n\nDo not bake in ground shadows, health bars, target rings, attack warnings, TRUE/ringleader effects, text, UI, or floor patches. The game renders those separately.
