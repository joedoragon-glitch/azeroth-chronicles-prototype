# Hero skill audiovisual implementation — 15 October 2026

**Implemented in source only; no automated tests, gameplay runs, builds, CI,
release-readiness PR, merge or deployment.** The owner requests one later combined
verification pass. A code or documentation commit is not certification.

Development branch: `feature/hero-skill-av-20261015`. Parent skill implementation:
`feature/hero-skills-2-4-on-snapshot-20261015` at
`1d142ea7936e4004e697fb9ebbb7205eb6d33cf5`, based on the PR #300 snapshot. The
parent includes all eight active skills, both forms, for all three classes, despite
its older Skills 2–4 branch name. PR #305 is excluded.

[Development ledger](HERO_SKILL_AV_DEVELOPMENT_LEDGER_20261015.md) ·
[Combined verification plan](HERO_SKILL_AV_COMBINED_VERIFICATION_20261015.md) ·
[Authoritative skill specification](HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md)

## Presentation ownership

`hero-presentation.js` is a stateless catalog and Canvas drawing extension to
`combat-visuals.js` and `renderer.js`, using their existing transient queue,
projection and update clock. `audio-hero.js` installs an owner in the current
`PrototypeAudio` facade and reuses its mixer, voice reservation, source cleanup,
recording fallback, tones, sweeps and noise recipes. There is no parallel animation
clock, particle simulation, audio context or gameplay store.

All new drawings and synthesized sounds are original repository source. No new
image, recording, font, third-party library or external asset is required. The
existing hero bodies and sprite clips remain intact; this work animates weapon
arcs, glyphs, projectile silhouettes and particles around those bodies. It does
not claim to provide newly illustrated full-body attack frames. This is the
procedural presentation implementation, not an accepted raster sprite release.

## Complete skill mapping

Every form uses its existing rank, damage, cooldown, target eligibility, collision
and status resolver. Names describe the current source, including unchanged
legacy forms. Colors are supplementary: distinct shapes identify effects without
requiring color recognition.

### Paladin — steel, controlled gold, protective shields

| Slot | Normal presentation | Charged presentation |
| --- | --- | --- |
| 1 | Directional steel sword arc, separate whoosh and metal contact; existing third-hit finisher preserved | Narrow radiant lance projectile, low release accent, holy launch/contact and heavier spark silhouette |
| 2 | Sundering Strike: gold crack at contact over steel impact; actual Weaken badge | Holy Cleave: directional cone and moving inner blade edge, steel contact plus holy resonance; actual Weaken badges |
| 3 | Shield Stance: existing raised shield, compact shield glyph and metal seating sound; lowering collapses glyph with soft clank | Shield Bash: short shield-shaped cone, weighted metal impact and streaks only for foes actually displaced |
| 4 | Judgment: vertical target sword/cross and holy strike sound; timed provocation badge | Grand Judgment: target-centered open ring, brighter sword pillar, surrounding sword marks; actual taunt lifetimes |
| 5 | Holy Area: open consecration ring, restrained four-direction sparks and holy chord | Consecrated Wave: wider double wave with stronger cross marks and release accent; actual Weaken badges |
| 6 | Vanguard Rush: brief path from the existing approach origin, sword arc and contact | Vanguard Impact: compact shock ring at the actual arrival point, shield marks, low holy/metal body and actual push streaks |
| 7 | Holy Assault: broad open ring and sword-shaped oath marks | Oath Strike: stronger sword marks and longer ring footprint from existing radius; Weaken badges only while active |
| 8 | Sanctuary Oath: bounded holy ring, central shield, actual self-heal particles and party ward rings/badges; lower protective chord | Last Bastion: heavier shield outline and wider perimeter shields, actual healing, ward and enemy Weaken; no screen flash or invulnerability cue |

### Mage — frost, force, arcane control as separate materials

| Slot | Normal presentation | Charged presentation |
| --- | --- | --- |
| 1 | Purple arcane orb, travel tail and diamond contact; existing combo finisher retained | Thin luminous arcane beam with subdued outer line, rising launch/falling impact sweep |
| 2 | Frost Bolt: pale ice shard, forked trail, crystalline high-frequency launch/crack and actual Slow badge | Frost Burst: target-centered ice ring and triangular shards, layered ice chime; true radius and Slow preserved |
| 3 | Spell Interrupt: broken circular cancellation glyph and crisp descending cutoff at the actual interrupted enemy | Silence Field: quiet violet boundary, crossed circle glyph and falling damped tone; existing persistent field and markers on affected allies/enemies |
| 4 | Arcane Fracture: jagged purple split and close dissonant pair at target | Arcane Rupture: target-centered ring with fracture marks and heavier split sound; actual nonstacking vulnerability shown until expiry |
| 5 | Force Pulse: teal outward chevrons/open ring and low pressure thump; actual displacement streaks | Force Wave: wider double pressure front, stronger release accent and push traces; no frost or invented Slow |
| 6 | Magic Shot: distinct angular arcane bolt, short sweep and contact; actual Slow shown by status badge | Focused Arcane Beam: thin arcane beam with heavier release/contact; same existing projectile Slow, not a new frost explosion |
| 7 | Arcane Chain: observed successful contacts linked in order, sequential angular arcs and ascending ticks | Arcane Chainstorm: up to the existing five actual contacts, thicker nodes and stronger release; no invented interruption, Fracture or Slow |
| 8 | Astral Detonation: target-centered open ring, four-point star and contained low explosion/chime | Arcane Cataclysm: double expansion, split star and larger arcane accents, controlled descending explosion; actual short Fracture badge |

**Chain timing:** damage remains synchronous exactly as authored. Only link reveal
and sound tick spacing are staggered by 45ms, with the full sequence visible in
under 0.2 seconds for five recipients. Reduced motion shows static links together.
No later hit, proc, cooldown or new targeting logic is scheduled.

### Ranger — physical shafts, audible strings, restrained green support

| Slot | Normal presentation | Charged presentation |
| --- | --- | --- |
| 1 | Individually drawn shaft, arrowhead and fletching, string snap and dry impact; existing combo finisher retained | Three real staggered arrows, heavier release accent, green nock accent; each departure sound follows its actual delay |
| 2 | Pinning Shot: existing two real arrows and barbed contact glyph, actual Slow | Pinning Volley: actual line footprint with three brief parallel arrow streaks, clustered string release and crossed pin mark; instant damage geometry retained |
| 3 | Self-Heal: restoration cross and actual healing particles, soft rising pair | Party Heal: bounded support wave and restoration marks, healing particles at actual recipients; one skill sound, not one loud chord per recipient |
| 4 | Movement Haste: green double-chevron cast glyph and existing speed streaks, light rising tone | Companion Rally: open support ring/chevrons, existing recipient rings plus movement/attack chevrons; shared rally chime; no dash animation |
| 5 | Arrow Volley: brief physical shaft streaks to actual successful instant-area contacts, clustered bow foley | Arrow Rain: existing individually visible real arrows to bounded enemies, stagger-aware bow/impact foley and actual Slow badges |
| 6 | Repelling Shot: physical arrow, low blunt impact, double-chevron contact and real displacement trace | Repelling Volley: existing three real delayed arrows, heavier release; final actual displacement observed, no Haste cue |
| 7 | Piercing Arrow: longer thin shaft trail, needle contact, sharper long string whistle | Charged Piercing Arrow: stronger needle/nock accent and impact, existing brief Slow badge; no invented multi-target penetration |
| 8 | Hunter's Salvo: individually drawn real arrows along their existing target paths; actual isolated-target extra arrow retained | Grand Hunt: visible separate staggered shafts to the existing capped targets, heavier release and dry impacts; no false immunity, dash or piercing |

**Arrow Volley distinction:** normal Ranger Skill 5 already resolves instant area
damage in the authoritative source. This branch preserves it and draws cosmetic
shaft streaks at the captured successful contacts. It does not turn that form into
new collision-driven damage projectiles. Charged Ranger Skill 5 and both forms of
Skill 8 continue to use the actual existing projectile objects. No sky-fall delay
or ballistic collision system was added.

## Charge lifecycle

- The existing `holdSeconds = 0.65`, tap cutoff, queued cooldown behavior, manual
  release and all admission checks remain authoritative and unchanged.
- A small skill-specific glyph and filling arc follow the current input progress.
  Quiet taps make no buildup sound. At the existing tap cutoff, a quiet ascending
  cue begins; at 70% progress another cue increases intensity. These are
  observations, never extra input timing windows.
- The existing ready state gains a steady outlined glyph and one two-note ready
  cue. Holding longer adds no reward or looping sound.
- Partial releases, explicit cancellation, loss of pointer capture/focus/menu input
  clearing and rejected full releases show a collapsing glyph and quiet falling
  cue when a charge actually began. Queued waiting releases stay quiet.
- Charged casts have a short low release accent; the actual spell/contact or real
  projectile departure supplies the main sound. No long-lived charge audio source
  needs cancellation and no callback can later fire a skill.

## Event contract and minimal integration

| Event / data | Producer | Presentation consumption |
| --- | --- | --- |
| `heroSkillCast` with class, slot, charged, rank, hero/target coordinates and approach origin | `hero-combat.js`, after existing admission/cost/movement | Weapon/release animation and short charged release accent; never computes damage |
| `heroProjectileFlight` with slot/material/charged/piercing | `combat.js`, after stagger delay and valid target check, just before existing flight movement | Local muzzle cue and string/arcane launch sound at actual departure |
| Projectile `slot` on charged Skill 1 objects | `hero-combat.js` | Identifies Skill 1 alongside the slots already present on other projectiles |
| `projectileImpact.landed`, `.piercing`, direction and pre-knockback contact coordinates | `combat.js`, around the existing resolver | True impact versus rejected/blocked contact, correct contact position and pierce trace |
| Blocked hero `projectileImpact` with `landed: false, blocked: true` | Existing terrain-collision removal branch | Quiet dull contact; never damage or control |
| `heroDisplace` old/new coordinates | `shieldPush`, only after the existing successful movement | Brief displacement trace; no movement command |
| `chain[]` successful actual contact snapshots | Existing Mage chain loop | Ordered link art and sound ticks, preserving synchronous damage |
| Normal-area `contacts[]` successful snapshots | Existing normal Skill 5/Paladin Skill 7 loop | Ranger cosmetic arrows to real contacts; no retargeting |
| `heal.skillPresentation` | Existing hero healing events | Existing recipient healing art, suppress generic duplicate audio |
| Shell-local `heroCharge` build/rise/ready/cancel | `app.js` observes the current charge object | Existing queue/audio facade; no campaign statistics or save writes |
| `spell`, `melee`, `chargedArea`, `projectileLaunch`, `charged`, `chargedImpact` | Existing producers retained | Hero owners replace generic duplicates; companions/enemies retain their paths |
| Live shield, silence, ward, haste, Rally, Weaken, Fracture, taunt and Slow fields | Existing gameplay owners unchanged | Current-state overlays disappear with actual expiry, death, zone change and restore |

`heroFlightPresented` is a transient presentation marker on already transient
projectiles; it does not affect movement, eligibility, damage or saves. Existing
launch receipts remain for sprites/other consumers. Recorded hero-event replacement
keys have the optional form
`hero.<class>.<slot>.<normal|charged>.<release|launch|impact|area|build|rise|ready|cancel>`.
No recordings are registered for them in this change; original synthesis is the
immediate offline path. Approved existing `effect.swordSwing` and
`effect.heroSteelImpact` recordings are reused when warm; after warnings the
quieter synthesized version preserves headroom. Existing generic warning, enemy and companion audio is
preserved. `audio-effects.js` delegates hero objects to the new audio owner before
its generic dispatch.

## Performance, accessibility and offline assets

- Reuses the current **40-effect** shared cap; hero transient priority 4 is below
  boss/captain VFX priority 5. Glyphs/rings use ordinary strokes, no full-screen
  compositing, postprocessing, screen shake or broad additive glow.
- At most six decorative shards per effect, three in existing optimization mode;
  zero moving shards with OS reduced motion. Status glyphs are viewport culled and
  limited to 24 enemies, at most three badges per enemy. Actual gameplay geometry
  and warnings remain visible regardless of decoration budgets.
- Effects use the current dt clock and freeze with the world. Queue scene changes
  clear old effects on campaign replacement, zone change or death count change.
  Projectile shafts render from actual simulation positions and remain visible in
  reduced motion; delayed arrows are hidden until they depart.
- `prefers-reduced-motion: reduce` is read live. It removes decorative travel,
  orbit, particle expansion and link jitter, while retaining static glyphs,
  footprints, actual projectile movement and the functional charge progress arc.
  Existing healing expansion/orbits are also held still in this mode.
- Boss/trap critical cue pass remains **after** hero VFX/status/charge art. Open
  rings avoid opaque arena fill. No hero effect modifies a boss warning or timer.
- Audio obeys existing mute/master/effects/menu/background settings. Per-skill
  gaps: impacts 65ms, launches 35ms, other stages 80ms. Global limit: nine hero
  recipes per 250ms; refuse new recipes above 38 occupied voices, ahead of the
  existing 60 ordinary/64 critical limits. Hero priority stays 1; warnings retain
  priority 3. Hero gain drops to 40% for 400ms after a warning. Crowded impacts may
  intentionally coalesce; every actual projectile remains drawn.
- No new decoder work, asset downloads, audio buffers retained beyond the existing
  voice lifecycle, dependencies, save keys, or save-version changes.
- `scripts/site-assets.cjs` and `templates/game.html` include both new owners.
  All three generated entries, `sw.js`, package/lock version and build-info are
  mechanically updated together to `0.9.1+snapshot.dev.57.av.1`. This is a unique
  development cache identifier, not a release version or build certificate.
  **The build script was not invoked** because it executes validation. Combined
  QA must regenerate through the canonical build and establish consistency.

## Changed assets / modules

New source assets: `src/prototype/hero-presentation.js` and
`src/prototype/audio-hero.js`. Modified owners: `hero-combat.js`, `combat.js`,
`combat-visuals.js`, `renderer.js`, `app.js`, `audio-effects.js`, `audio.js`.
Packaging: `scripts/site-assets.cjs`, `templates/game.html`, `index.html`,
`prototype.html`, `phone.html`, `sw.js`, `build-info.js`, package and lockfile.
Documentation: this specification, ledger, verification plan and procedural design
handoff. No sprite, material, VFX or recorded-audio manifest replacement is needed
for source-drawn art and synthesized sounds.

## Limitations and integration

This is implemented source awaiting the requested combined pass. Syntax,
module loading, audio audibility/comfort, Canvas appearance, reduced-motion
behavior, device cadence, PWA install/offline and historical saves have **not**
been verified by execution. Existing sprite bodies do not gain new raster attack
clips. Normal Ranger Skill 5 and charged Ranger Skill 2 remain their existing
instant damage geometry with cosmetic arrows. Mage chain timing is audiovisual
only. Physical device sound balance and simultaneous warning legibility remain
acceptance items. No unresolved artistic decision is being assigned to the owner.

To consolidate later, first bring the latest authoritative active-skill branch
into the chosen combined development branch, then merge this AV branch using
normal three-way ancestry. If the combined branch already contains the exact
parent, only the audiovisual commits are additional. Reconcile overlapping changes
to shell/combat/renderer event fields rather than replacing entire files. Exclude
PR #305. Keep newer approved gameplay numbers and all additional workstreams.
Resolve the final combined package/cache version once, regenerate the entries and
service worker with the canonical build **when testing is authorized**, then run
the linked combined verification plan. Do not merge this branch directly into
main or PR #300, open a release-ready PR, or deploy without later authorization.
