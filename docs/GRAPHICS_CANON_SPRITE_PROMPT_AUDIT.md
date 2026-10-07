# Phase 2A — Sprite prompt catalog audit

## Result

The prompt catalog in `GRAPHICS_CANON_SPRITE_PROMPTS.md` is the authoritative input for the next image-generation phase.

The audited catalog contains:

- **131 documented entries**
- **122 entries approved for one-at-a-time sprite generation**
- **9 entries explicitly retained as procedural and not generated**

No sprite is activated in the game during this phase.

## Audit method

The initial 110-entry roster was checked back against:

1. the current production branches in `src/prototype/visuals.js`;
2. authored species, bosses, sites, strongholds and region data;
3. ranged/hybrid/captain rules where they clarify what the visible procedural body represents;
4. the sprite key/fallback architecture in `src/prototype/sprites.js`.

The audit used a strict rule: **mechanical distinction alone does not justify a new sprite.** A distinct raster candidate requires a distinct canonical visual body or a clearly authored static visual identity.

## Corrections made

### Hero / companion accuracy

The Ranger prompt was corrected to retain all visual details already present in the canonical ranger body, including the small teal left-side flask/pouch and restrained pale-green/gold utility accent.

The companion Archer/Ranger support prompt was also corrected. The production renderer uses `human('ranger')` for that companion, not the simpler `human('archer')` enemy body. The companion therefore retains the ranger-body flask/pouch and utility accent while omitting only the separate hero-layer additions.

### Mechanical variants that do not have separate canonical bodies

The following initial candidates are now marked **KEEP PROCEDURAL — DO NOT GENERATE**:

- Mireling spitter hybrid
- Ogre stone-thrower hybrid
- Orc axe-thrower hybrid
- Ash-beast cinder-spitter hybrid

In each case, the production renderer uses the same static body as the ordinary form. Their ranged identity comes from runtime aiming/projectile behavior. Creating a different body sprite would invent visual canon.

The Reed-beast spitter remains a sprite candidate because the renderer does add a small hybrid-specific mouth/projection cue.

Goblin slinger and Skeleton bow remain candidates because the renderer visibly changes their static weapon/equipment presentation.

### Dreadmaw

Dreadmaw is mechanically named and distinct, but the current renderer has no `cindermaw` branch in `captainFinish`. Its visible body is therefore only the ordinary Ash-beast body at captain scale plus procedural captain treatment.

Dreadmaw is marked **KEEP PROCEDURAL — DO NOT GENERATE** until the canonical renderer itself gives Dreadmaw a distinct static visual identity. Image generation must not solve that gap by invention.

### Repeated regional props

The following were removed from sprite production and retained procedurally:

- Market stand
- Command tent
- Training dummy
- Weapon rack

Their renderer depends on region-sensitive materials and/or they are repeated functional clutter. A single sprite would flatten canonical regional variation; producing a large variant family would provide too little payoff.

### Missing town-service visuals added

The first roster omitted four important purpose-specific structures that are explicitly authored by the procedural renderer:

- Refuge / rest house
- Supplier stall
- Town Captain / recruiter post
- Quest board

Each has a regional treatment in all five regions. The audit therefore added **20 prompts**, one exact region/role combination for each.

These are high-value sprite candidates because they are persistent named services, use distinct silhouettes, and materially affect how settlements read.

### Citadel preparation fountain added

The Citadel preparation fountain is a unique persistent interactable with its own authored visual body. It was missing from the first roster and is now included as prompt 131.

### Named places versus literal names

Some place names describe more than their current outdoor marker depicts. The prompt catalog follows the renderer, not the semantic temptation of the name.

Examples:

- **Drowned Watchhouse** is generated from the actual simple timber watch structure, not invented as a full house.
- **Old Signal Keep** is generated from the actual rock-and-banner lookout marker, not invented as a castle/keep.

This rule applies everywhere: **the name may clarify identity, but it cannot expand the sprite beyond the visible procedural canon.**

## Intentionally procedural systems

The following remain procedural by design and have no sprite prompts:

- terrain planes and biome ground;
- roads, rivers, ponds, lava and crossings;
- repeated collision walls, fences, stockades, palisades and pillars;
- ground shadows;
- atmosphere and night lighting;
- attack telegraphs and hazard warnings;
- projectiles and thrown/moving weapons;
- hit, heal, mana, swing, Guard and other timed combat VFX;
- TRUE, Ringleader and Frenzy treatments;
- labels, health/mana bars, targeting and UI;
- cage open/closed framing;
- Treasury quest-cache crates and other generic bundle boxes;
- Dark Lord Tribute nodes;
- generic mini-site gateway markers;
- construction-state barracks;
- repeated small clutter not specifically promoted by the prompt catalog.

## Guard variants

Guard enemies have small procedural guard identifiers, and Skeleton guards additionally gain a shield treatment.

They are **not** being mass-generated as separate body sprites in Phase 2A. During implementation, either:

1. guard identifiers should remain procedural overlays on approved species sprites, or
2. guard entities should continue using the full procedural renderer until an exact guard-sprite strategy is deliberately approved.

The image-generation phase must not invent guard armor to solve this.

## Barracks states

The sprite registry distinguishes construction/basic/full keys, but the current completed procedural Barracks drawing does not establish a separate full-barracks body design.

Phase 2A therefore generates the completed regional Barracks body only. Construction remains procedural. A separate full sprite is not created unless a future canonical renderer change first makes Full Barracks visually distinct.

## Generation procedure locked for the next phase

For every approved prompt:

1. select exactly one catalog entry;
2. use its complete image-generation prompt;
3. generate exactly one isolated sprite and nothing else;
4. do not make a sprite sheet, comparison board, turnaround, alternate costume, alternate pose or multiple-option image;
5. do not infer missing design details;
6. store the candidate outside the live manifest;
7. move to the next entry only after the current sprite exists.

The production phase is allowed to create the whole candidate library before visual approval. **Approval and implementation remain separate later phases.**

## Final audit conclusion

The prompt catalog is now suitable to drive sprite production without requiring art-direction improvisation during generation.

If a future generation request cannot be answered directly from an audited prompt, that asset returns to documentation/audit. The generator does not fill the gap creatively.
