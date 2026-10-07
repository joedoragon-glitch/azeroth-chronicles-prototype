# Azeroth Chronicles canonical static sprites

This directory holds approved static raster sprites for the GitHub Pages/PWA game.

The current procedural renderer is the **canonical visual source**. A sprite is accepted only when it is a higher-fidelity translation of that existing design. It must not redesign the character, monster, building or prop, and it must not introduce a new outside art style.

The procedural renderer remains the correct production rendering whenever no approved sprite exists or whenever a procedural element is better suited to runtime geometry/animation.

Register each approved asset in `manifest.json`. Canonical examples include `hero:paladin`, `ally:soldier`, `enemy:goblin`, `enemy:goblin:ranged`, `boss:thorn`, `specialist:thorn`, `dungeon:crypt`, `prop:house:vale`, and `building:barracks:vale:basic`.

Required:
- `src`: repository-relative transparent PNG or lossless WebP, normally `./assets/sprites/<name>.webp`.

Recommended:
- `displayWidth`, `displayHeight`: logical Canvas display size chosen to match the procedural visual at gameplay scale.
- `anchorX`: horizontal ground anchor fraction; default 0.50.
- `anchorY`: vertical ground anchor fraction; default 0.88, tuned when needed to reproduce the canonical feet/shadow relationship.
- `labelHeight`: base clearance for health plates and labels.
- `overlayScale`: optional tuning for existing TRUE/ringleader/aim overlays.
- `scale`: optional authored scale multiplier; entity `visualScale` still applies.

Before registering an asset, compare it side-by-side with the production procedural drawing. It must preserve silhouette, proportions, pose, equipment/feature placement, palette relationships and identity. Added detail must be surface finish naturally implied by the existing drawing, not new lore or design.

Safety rule: special enemy variants do not fall back to an ordinary species sprite. Ranged, hybrid, guard and captain entities keep the procedural renderer until their exact sprite key exists.

Do not bake in ground shadows, health bars, target rings, attack warnings, TRUE/ringleader effects, text, UI, floor patches or other transient effects. The game renders those separately.

See `docs/GRAPHICS_OVERHAUL_PHASE1.md` for the authoritative production contract and `docs/GRAPHICS_CANON_SPRITE_AUDIT.md` for the conversion-priority audit.
