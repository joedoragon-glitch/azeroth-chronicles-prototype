# Phase 2A — Canon Sprite Prompt Catalog Audit

## Result

**PASS after corrections.**

The authoritative generation document is `docs/GRAPHICS_CANON_SPRITE_PROMPTS.md`.

It contains **160 numbered entries**:

- **144 GENERATE** — unique canonical sprite images to produce one at a time.
- **6 ALIAS** — no new image; reuse an already generated canonical body.
- **10 KEEP PROCEDURAL** — no sprite; the procedural renderer remains the intended final treatment.

Automated structure checks confirm:

- IDs 001–160 are complete with no gaps.
- No duplicate IDs remain.
- Every GENERATE entry contains the mandatory one-image instruction.
- Every GENERATE entry requires a transparent background.
- No GENERATE prompt contains the retired external-style references.
- No entry requires a sprite sheet, comparison sheet, scene, or multiple options.

## Canon source reviewed

The audit compared the prompt catalog against:

1. `src/prototype/visuals.js` — authoritative static shape, palette, equipment, anatomy, architecture and prop geometry.
2. `src/prototype/rules.js` — regional identity, ranged/hybrid profiles, strongholds, Treasuries, side interiors, authored sites and service roles.
3. `src/prototype/data.js` — boss/specialist names, regional biome identity and gameplay role.
4. `docs/GRAPHICS_OVERHAUL_PHASE1.md` — canon-preservation and selective-conversion rules.

Older generated images and concept sheets were not used as canon.

## Corrections made during audit

### Duplicate gameplay identities that do not justify new art

These entries are aliases, not separate generations:

- **023 Raider Archer → 005 Companion Archer.** The production renderer uses the same `human('archer')` body.
- **030 Mireling spitter → 018 Mireling.** Ranged behavior changes projectiles/AI only.
- **032 Ogre stone thrower → 021 Ogre.** The static body does not change.
- **033 Orc axe thrower → 022 Orc.** The thrown axe is a runtime projectile; the body still carries its canonical sword.
- **034 Ash-beast cinder spitter → 024 Ash beast.** The cinder attack is runtime-only.
- **049 Dreadmaw → 024 Ash beast.** Current `captainFinish()` has no `cindermaw` body-ornament branch; Dreadmaw's current visual distinction is captain scale/runtime treatment rather than a separate static design.

An exact gameplay sprite key can still reference the aliased image during implementation where variant safety requires it.

### Missing major static structures added

The first roster undercounted regional service structures. The audited catalog adds separate prompts for all five regional visual families of:

- quest board;
- supplier;
- recruiter/Captain post;
- refuge/rest building.

That adds entries **111–130**.

These are sprite-worthy because they are persistent, identity-heavy settlement structures and their regional construction is already authored visually.

### Shared occupied-interior entrance added

Entry **131** captures the single canonical compact side-interior entrance visual. It is one generated body, not five invented regional redesigns.

### Repeated regional clutter kept procedural

The following were explicitly rejected as sprite families after checking their renderer behavior:

- market stands;
- command tents;
- training dummies;
- weapon racks.

They are repeated dressing and/or use region-dependent procedural material colors. Entries **094, 097, 102, 103, 132–137** are therefore marked **KEEP PROCEDURAL** rather than multiplying static variants.

### Identity-bearing props promoted

The first roster was too conservative about places whose domestic/work details are part of their identity. The audit adds sprite prompts for selected fixed-shape props that materially define Treasuries, strongholds and dungeons:

- Thorn bed;
- Vale fang trophy;
- root table;
- treasure hoard;
- boss chest;
- Mire pool;
- reed nest;
- shell hoard;
- drift seat;
- Ridge hearth;
- stone seat;
- Highland trophy rack;
- Ash-beast roost;
- Abyss hatchery;
- Archive scribe desk;
- Crypt ossuary;
- Vale grave lamp;
- Vale caretaker table;
- Highland ore cart;
- Highland stone marker;
- Greenwood pup nest;
- March mud nest;
- March wallow.

These are entries **138–160**.

They are still generated one at a time and may not acquire extra lore/detail.

## Visual systems intentionally excluded from image generation

These were reviewed and remain procedural by design:

- terrain planes and large biome fills;
- roads and road edges;
- rivers, ponds, water shimmer, lava and channels;
- bridges/crossing geometry;
- collision walls, fences, palisades and repeated structural segments;
- actor ground shadows;
- night darkness and local light pools;
- pollen, mist, dust, ash, sparks and atmosphere;
- telegraphs and hazard-warning geometry;
- projectile travel and moving attack objects;
- hit/heal/mana/swing/Guard and other timed VFX;
- TRUE, ringleader and frenzy overlays;
- health/mana bars, labels, quest punctuation and UI;
- active construction progress for barracks;
- small repetitive clutter such as generic crates, barrels, rations, ordinary bone piles, sleep rolls, grass tufts and similar dressing;
- animated/fire-like dressing where the procedural treatment is more useful than a frozen asset.

## Variant decisions

- TRUE bosses reuse the approved normal boss body with procedural TRUE treatment.
- Ringleaders reuse the exact approved underlying species/role body with procedural elite/frenzy treatment.
- Guardian variants remain procedural until a later implementation decision proves that their small guard cue needs a dedicated static sprite rather than procedural overlay/fallback.
- Cage framing remains procedural so specialists can be composed inside closed cages and the same framing can open after rescue.
- Completed Full Barracks do not receive separate art in this phase because the current renderer does not draw a distinct full-versus-basic completed body. One regional completed-barracks body remains canon until the renderer itself establishes a visual difference.

## Generation-phase rule

The next phase is deliberately mechanical:

1. Read one numbered entry from `GRAPHICS_CANON_SPRITE_PROMPTS.md`.
2. If status is GENERATE, send **only that entry's prompt** to image generation.
3. Produce **one image and one sprite only**.
4. Do not generate a board, comparison, sheet, variations, turnarounds, scene or extra objects.
5. Do not use earlier generated images as design authority.
6. Move to the next numbered GENERATE entry only after the current generation completes.
7. ALIAS and KEEP PROCEDURAL entries are skipped.
8. No generated image enters `assets/sprites/manifest.json` during production.
9. Phase 2B audits the completed candidate library against procedural canon before implementation.

If image generation cannot satisfy an entry without inventing information, stop that entry and return it to documentation instead of improvising.
