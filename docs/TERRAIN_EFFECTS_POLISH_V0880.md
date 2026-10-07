# Terrain and effects polish — v0.8.80

This pass extends the procedural canon housekeeping to terrain and effects. It preserves routes, collision, entity placement, save schema, progression, damage, mana costs, cooldowns and rewards. No raster assets or sprite keys are added.

## Geometry and readability corrections

The isometric projection is `screenX = .76 × (x − y)` and `screenY = .27 × (x + y)`. A world circle therefore has projected ellipse radii of `.76 × √2 × radius` and `.27 × √2 × radius`. The previous `.76 × radius`/`.27 × radius` markers understated the damage radius by about 29%. Circles now project sampled world points, rather than treating one world axis as the full circle width.

`rules.combatGeometry` names the existing charge half-width (55), ordinary/dual line half-widths (45/35), ring speed (180), life (1.6) and dangerous half-band (25). Engine values are unchanged. The new `combat-visuals.js` module draws charge and jet capsules including their rounded endpoints. Expanding rings draw their real dangerous band; the warning outlines the eventual maximum sweep. Charged friendly circles and line effects also use accurate projected geometry.

Ground fills and trap bodies remain below actors. Warning outlines, countdowns and transient combat effects draw after atmosphere so night grading cannot obscure them. Idle trap fixtures stay subdued. The sparse regional atmosphere, actor shadows and shared warning language are retained.

Every main dungeon now clips its floor to its rules-defined walkable footprint and draws its real partitions. This includes the Citadel's previously omitted partitions and the legacy dividers in the Crypt, Archive and Mine. Exposed footprint edges are derived from the union of rooms, avoiding false lines across overlapping wings. Low wall faces and masonry seams give depth while keeping actors visible. Treasury and side-interior layouts retain their existing presentation.

## Terrain materials

Outdoor tiles share a continuous base with edge coverage to remove antialias grid seams. Broad seeded radial patches, feathered in world space, suggest woodland soil, marsh mud, quarry dust, char/ash and obsidian ground. Small regional nature details remain lightweight. Interiors retain deliberate slab joints.

The exact water, ravine, cliff, lava and pond boundaries remain legible continuous rims. Broken banks, rock faces, cracks, crust and localized animated flow lie inside those boundaries; decoration does not invent new walkable ledges or alter bridge gaps. Water gets short current/ripple cues, ravines get exposed rock and fracture lines, and lava gets branching hot seams and dark crust. Ferry decks retain exact traversal rectangles, with seams, pins and lower supports.

Road junctions use rounded joins. Vale and March tracks use soil/mud detail, Highland stone uses broken paving joints, Frontier roads show wagon ruts, and Crown paving retains ordered slab seams. Crossing materials follow the actual gap and wood/stone bridge family. Bridge decks gain restrained lower faces and attachment details.

## Effects and identity

Normal area abilities now emit radius-bearing presentation events instead of producing only generic hit flashes. Paladin uses holy marks/columns, Mage uses frost shards or arcane discharges, and Ranger uses outward arrow fans or falling arrows. Slot-specific scale and rhythm accompany the existing attack geometry. Mage's normal second shot carries frost identity; Ranger's advanced shot carries a stronger trail. The established projectile bodies, combo finishers and charged attacks are retained.

Projectile contacts use their material: wood/metal fragments, stone chips, organic droplets, cinders, spectral/arcane rings, holy light or frost shards. Duplicate generic hit flashes at the same contact are suppressed; ordinary hurt feedback remains common. Persistent hazards preserve the shared dangerous perimeter while showing spectral, mire, ember or stone/ritual interior detail. Older transient hazards without identity metadata keep a generic fallback.

Ranger health/mana recovery events now use recipient coordinates and preserve caster coordinates separately. Companion treatment emits one recovery event per restored recipient. The visual queue also resolves target IDs. Persistent recipient auras remain intact.

The transient queue remains capped at 40. Ability, finisher and recovery cues take priority over small contact flashes when crowded. No particles accumulate in campaign state.

## Verification

`tests/terrain-effects.test.cjs` reproduces a previously hidden damage point, checks charge width/endcaps and expanding-ring reach, exercises actual class casts/contact events/recovery recipients, checks crowded queue retention, and runs desktop/mobile Canvas-command renders for all regions/main dungeons. Those renders must have finite coordinates, balanced context state, complete wall dispatch and no campaign mutation. Footprint edges must separate floor from void rather than split overlapping rooms.

The existing crossing, trap-route, combat, save, progression, PWA, UI and browser suites remain release checks. Native Canvas review covers crossings, ferry shores, dungeon boundaries, day/night mobile clarity and transient effect phases. Visual-only tests do not replace author playtesting of atmosphere or combat feel.
