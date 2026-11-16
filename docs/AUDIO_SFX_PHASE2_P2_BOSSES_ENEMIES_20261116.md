# SIBDLP Phase 2 sound-design assessment — P2: bosses, captains and distinctive enemies

**State:** source-grounded sound-design *candidates*, not installed sounds or a new skill list. **Date:** 16 November 2026. **Base:** `main@409f0ed671b0ff2563f788bf45ab665e01c05ca6` (Phase 1's 30 new master WAVs already integrated in main). **Priority:** second of the owner's three approved groups; first priority's pet/Charmed recommendations live in [P1](AUDIO_SFX_PHASE2_P1_HERO_COMPANION_PETS_CHARMS_20261116.md).

## What the existing game already does

- Eleven boss families live in `data.js:bosses`; five separate captain profiles live in `enemy-presentation.js:captains`. The broad enemy species map contains wolf, goblin, skeleton, reedbeast, mireling, wraith, stalker, ogre, orc, archer, crownguard and ashbeast.
- `enemy-presentation.js` derives physical **material + personality + action + faction/signature** from actual enemies/attacks; `audio-enemy.js` resolves **windup, release, travel, impact, miss, linger, spawn, phase** using recorded material releases/impacts when warm and procedural material + motif accents otherwise. The **existing critical warning WAV** is a global danger aid; it is not eleven bespoke boss warnings. `audio-effects.js` has specialized rolling-cargo procedures. Retain these.
- Merely replaying one of the 24 Phase 1 enemy material WAVs at a different gain is NOT enough to make a boss's *signature* recognizable; conversely, making 46 boss attack names into 46 WAVs is NOT inherently necessary.
- The named descriptions in `data.js` establish design intent; before implementation, reconcile each with actual `boss-combat.js`, `cindermaw-combat.js`, `dreadmaw-combat.js`, `enemy-vfx-events.js` and current timed resolution receipts. Historic `ENEMY_AUDIO_COVERAGE.md` is a stage topology register, not artistic certification. No change to existing boss warnings, contacts, contact geometry, cooldowns, rematches or boss AI is authorized.

**Recommendation notation:** **ADD** new short signature/physical identity; **LAYER** reuse the 30 stage/material masters with one bounded texture; **REFINE** improve existing procedural action where a new WAV adds little; **KEEP** established critical/physical cue. **A** high perceptual/gameplay importance, **B** character importance, **C** optional after A/B. These are independent sound-design proposals pending acoustic judgment; no file quota.

## Eleven boss families — signature identity design ledger

Each entry names a small vocabulary of *reusable cues*, not one file per attack, per target or per TRUE/Normal form.

| Boss/family | Authored real attack themes (from source) | Recommended distinctive acoustic identity | Decision |
|---|---|---|---|
| **Thornfang** (`thorn`, Greenwood field) | Use-of-Force Escalation arc, Dynamic Entry landing, Tripwire, Quick Reaction Force pups | Athletic paw scrape + compressed short bark/breath for launch; **actual** landing claw/grit and tensile tripwire snap; restrained pack-arrival patter, never damage on a missed leap | **ADD/A** leap landing + tripwire; **LAYER/B** command |
| **Lifebinder** (`crypt`, Forest Crypt) | Excarnation, three Stay Alive projectiles, Clerk of Works attendants, paired Differential Settlement eruptions, Algor Mortis cold ring, Anastylosis stone assembly/defense | Distinct brittle articulated-bone phrase; three separate projectile release ticks; cold breath ring for **non-damaging Slow**; dry arranged-stone lock for defense without hit noise; controlled work-crew foot arrivals | **ADD/A** cold wave + assembly; **LAYER/B** volley/summon |
| **Mirejaw** (`mire`, Marsh island) | Fluvial Incision/Vortex Shedding, Hydraulic Jump, Inundation mud beds, Flood-Pulse Recruitment | Thick aquatic suction and pressure release, wet heavy lunge, audible onset of lasting mud hazards *once per patch onset*; low flooded recruitment ripple | **ADD/A** bite→roll/pressure event, inundation; **LAYER/B** recruits |
| **Drowned Keeper** (`archive`, Sunken Archive) | Anchor swing, parallel water jets, slowing Undertow, drowned echoes, non-damaging Cooldown Sabotage | Small anchor-chain weighted swing; coherent thin pressurized twin water lanes; distinctly descending undertow suck; delicate paper/ink *metaphor only if lore-appropriate*, avoid fake archive destruction; sabotage as short interrupted clock chime, **not a hit** | **ADD/A** jets/undertow/sabotage; **LAYER/B** anchor |
| **Ridge Tyrant** (`ridge`, Highlands) | Coinage Blow, **moving** Rolling Cargo, Toll Collection charge, Payroll Order archers | Hard coin-hammer ring distinct from Colossus stone; actual creaking axle/strapped cargo onset + rolling/flying friction + real collision or harmless miss; brief controlled payroll/coin signal | **KEEP/A** legacy cargo timing; **ADD/B** personal coin hammer/order layer |
| **Stone Colossus** (`mine`, Colossus Mine) | Punching Shear, Progressive Collapse/supports, Dynamic Compaction expanding rings, Pile Driving exposed core, Mass Underpinning wardens | Architectural mass: low mineral fracture, falling grit, two staggered compression edges; temporary supports settle once on real creation; crystal/stone core exposure releases a distinct *non-damage* click | **ADD/A** ring/compression, support landing, core exposure |
| **Ashen Warlord** (`warlord`, Frontier) | Cleaving combo, Choking Ash, six separated Banner Bombardment circles, guard command, pursuit charge | Disciplined double metal cut, muffled coughing-dust texture **without player voices**, six *bounded* incoming/impact cues tied to six zones, concise military flag/buckle rattle for command, charged footwork | **ADD/A** bombardment cue hierarchy; **LAYER/B** ash/command |
| **Abyss Dragon** (`abyss`, Bastion) | Compressor Surge, Wake Vortex, sequential Lazy Eight landings, Scramble Order ash beasts | Vast airy pressure movement, wing/shear change, rotating vortex edge, two distinct **timed** descending landing thuds, tightly synchronized defenders' airborne arrival. No per-frame wing noise | **ADD/A** surge/vortex + real landings; **LAYER/B** scramble |
| **Veyra, Ash Sentinel** (`citadel`, Citadel) | Microdermabrasion 9 canisters, Dress Ranks defensive orders, linked Deep-Tissue Contouring charges, Fractional Resurfacing tiled court, Volumize troops | Precisely measured discipline: fine abrasive spray, sharp ordered formation click, controlled repeating tile-work tick; multiple *actual* fragments resolve with bounded scatter and priority; neither cosmetic joke music nor generic fire | **ADD/A** abrasion/tile signature; **LAYER/B** ranks/charge |
| **Cindermaw** (`cindermaw`, Crown) | Contracting Cordon Sanitaire, Administrative Distraint claw-removal of temporary immunity/tonic, Parens Patriae guard/retaliation, ordered seven seals, health-transfer strike, delegated attack, Mutual Aid troops | Authoritative hot ash/ceramic rasp with **distinct contracting ring**; dry physical claw tear for removal (never item loss chime); quiet protective ignition on ward; numbered pulses for **actual** seven seal resolves; short response for linked guard/delegates | **ADD/A** contract/claw/ordered seals; **LAYER/B** protection/assistance |
| **Dark Lord** (`darklord`, final confrontation) | Veteran's Repertoire 3 differently timed sword strikes without ground warnings, Pathfinder's Gambit 3 landings, Royal Muster, Freedom Has a Price sector control, No More Heroes narrow thrust **without ground warning**, Royal Taxation marked-party condition | Restrained regal veteran steel articulation and deliberate pauses; audible *actual* three-hit blade phrasing, distinct sharp finishing thrust and three landing contacts; summons as military response, not magical warp; restrained shield award when real Royal Taxation condition met | **ADD/A** sword sequence/finisher/landings; **LAYER/B** muster/conditional shield |

**Important boss-specific exclusions:** Lifebinder's Algor Mortis is Slow without HP damage; defensive wards/Anastylosis, Royal Taxation shield and Veyra's Dress Ranks must not sound like damage. Dynamic Entry/charge collisions sound at actual landing, including safely resolved misses; stationary ground hazards do not replay a full hit on every damage tick. Final Dark Lord attacks without ground warnings **must not acquire fake warning shapes or audible attack outcomes before a committed cast**; existing globally supported danger readability takes precedence.

### Regional identity and Normal/TRUE treatment

- **Greenwood**: paw/twig vs bone/stone-assembly; **Marches**: suction/water/chain; **Highlands**: coin-forge vs massive mine mineral; **Frontier**: disciplined metal and smoky ash vs aerodynamic dragon; **Dark Crown**: precise military abrasion, Cindermaw's ministry/ember protection, Dark Lord's experienced sword.
- **Normal vs TRUE:** same family/pattern remains recognizable. A restrained TRUE *accent or articulation change* can imply raised stakes where actual game cues distinguish the form. No duplicated WAV per 11 bosses merely for TRUE, and no global roar on every phase.
- **Windup priorities:** universal danger warning remains plainly audible, with boss identity below it; no extra authored pulse that masks or duplicates its two-note warning. Contact, missed attacks, summon spawns, linger and phased shield actions must remain distinguishable.
- A boss can have a personal **short shared family motif**, reusable across two or more specials when attacks are otherwise identifiable by physical stage/body. Signature-specific WAVs justified only by readable unique move geometry or strong narrative identity.

## Five captain profiles — not identical to boss families

Current presentation profiles are `supply-vale`, `supply-march`, `supply-highlands`, `supply-crown` and `frontier-overseer`. Their local roles derive from live encounter metadata and should not be blindly renamed after the nearby regional boss.

| Captain profile | Proposed identity | Action |
|---|---|---|
| Greenwood supply / Scornfang Treasury | Dry sacks/roots and light goblin scavenger metal; real supplies/worksite noise rather than boss howls | **LAYER/B** |
| Marches supply | Wet reed-work/suction and vessel hardware, lighter than Mirejaw | **LAYER/B** |
| Highlands supply | Compact stone/coin shipping chink, distinct from Colossus collapse | **LAYER/B** |
| Crown supply | Ash-dusted logistical restraint with short guarded metal click, not automatically Cindermaw's voice | **LAYER/B** |
| Frontier Overseer | Inspection/formation metal and short command signal, smaller than Ashen Warlord | **ADD/B** if signature phase currently indistinct |

**Phases and forms:** use each captain's real `scramble/molt/howl/carapace/command` or other source-defined transition only where it exists. A physical molt/carapace may merit a short crack; no second warning on a real enemy attack that already has the existing critical cue.

## Twelve creature species — reuse first, differentiate the truly distinctive

The original 24 release/contact masters remain the **baseline**; the Phase 2 work is about species-specific actions or creature character, not an animal voice sample library quota.

| Species | Already mapped material/personality | Design judgment |
|---|---|---|
| Wolf | claw/wolf | **LAYER/B:** breath/paw launch and brief group call for real howls, reuse claw contact |
| Goblin | dust/goblin | **LAYER/B:** grit/sack rustle and stone slinger texture; no universal shriek |
| Skeleton | bone/skeleton | **LAYER/B:** articulated clatter with real bone/arrow departure |
| Reed Beast | wet/mire | **LAYER/B:** reed scrape + thicker ejected spit (distinct from Mireling) |
| Mireling | wet/mire | **REFINE/B:** small water pop/organic spit; avoid duplicate Reed Beast voice |
| Wraith | spectral/spectral | **ADD/A:** spectral pressure/drain identity where *night skill* genuinely fires |
| Stalker | claw/shadow | **ADD/A:** short shadow pounce/displacement sound on actual move, not long stealth drone |
| Ogre | stone/ogre | **LAYER/B:** deep mass/stone/worksite strain for specific shove; ordinary hit uses stone |
| Orc | steel/orc | **LAYER/B:** disciplined axe/footwork cut, distinct from ally sword when audible |
| Archer | arrow/military | **REFINE/B:** preserve arrow release/contact, use limited retreat/formation motif |
| Crown Guard | steel/military | **LAYER/B:** tighter shield/formation clink and distinct real guard advance |
| Ash Beast | ash/dragon | **LAYER/B:** compact embers/short respiratory ash pulse; avoid dragon-scale roar |

**Ringleaders, guardians, night enemies, and elite signatures:** roles should be readable by rhythm/voice scale, action and provenance. The authored ordinary/guardian/ringleader (melee and ranged) attack matrix already exists; don't create one new recording for each of the older 251 VFX identity entries. The prospective Greenwood Skeleton proactive moves and owner-selected monster skill naming work (#870/#871) remain **separate, pending gameplay implementation**; names alone create no callable audio event. Do not falsely associate every wild creature with its nearby boss or faction; the game's world distinguishes wild, hired, Crown and specialist groups.

## Audio-direction requirements across the three subgroups

1. **Mechanical truth before grandeur:** record/generate **release** independently from actual **impact**. No fake hit on miss/blocked projectile, no enemy-summon cast mistakenly attributed to automatic waves, and no post-hit replay at an event's later 'linger' stage. For moving cargo and multi-leg charges, use stage-aware short transients and procedural motion, not long recordings that continue after interruption.
2. **Readable combat mix:** dry transients, small frequency-domain variation, soft detailed texture under the warning band; boss motifs weighted by real importance and current mix ducking. Avoid harsh repeated hiss (canisters/volley), sub-bass pile-ups (Colossus/Cindermaw), and confusingly melodic effects that clash with 84 recorded songs.
3. **Source-led design order:** (A) choose one highly identifiable attack per each of the 11 bosses, plus Wraith/Stalker night signatures; (B) second unique signature only where attacks otherwise blur; (C) captain and species overlays after ordinary Phase 1 material family comparisons. **No predetermined number of sound files** and no new gameplay content.
4. **Verification each candidate:** source event ID/actual commit phase, actor identity, action, original existing WAV vs procedural fallback, new WAV/texture, target/collision semantics, critical priority/headroom, normal/TRUE, many enemies/voice cap, audible A/B at game mix (phone + headphones), physical device/owner acceptance, hash/manifest/rollback and cold playback. A procedural alternative counts as a valid positive design outcome.
5. **Classification:** material WAVs and enemy event/actor stage system = **IMPLEMENTED in source**; true perceptual similarity and currently convincing boss identity = **UNVERIFIED**; new unique boss/captain/species candidates = **PROPOSED / intentionally deferred to Phase 2 execution**; old VFX/name proposals = **not proof of live move**; any actually demonstrated misrouted/double-hit audio defect belongs to separate functional bug triage rather than being invented by this ledger.

## Primary evidence anchors

[Boss identities, descriptions and region lore](../src/prototype/data.js) · [Boss combat staging](../src/prototype/boss-combat.js) · [Special Cindermaw combat](../src/prototype/cindermaw-combat.js) · [Enemy material/personality/action profile](../src/prototype/enemy-presentation.js) · [Enemy audio](../src/prototype/audio-enemy.js) · [Enemy VFX event bridge](../src/prototype/enemy-vfx-events.js) · [Actual sound catalog](../assets/audio/manifest.json) · [Original enemy audio stage register](ENEMY_AUDIO_COVERAGE.md) · [Sound work issue #877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877).

**Scope restriction:** none of the suggested sounds are packaged, registered, playable in the shipped game or accepted by ear through this document.
