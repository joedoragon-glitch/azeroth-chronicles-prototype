# Issue #463 / Draft PR #464 — Eleven pet families, individual release/impact review

25 October 2026 · addendum to the hero/companion audit · independent draft candidate only. Evidence: source inspection of party-pets.js, rules.js, combat.js, renderer.js and enemy-vfx-art.js at the PR #464 branch. **This is a technical classification, not real-device visual approval.**

## Visual consistency standard

An actual ranged shot has one launch point and one gameplay collision trajectory; its visible head must agree. A projectile's impact flash belongs at physical contact, not on an imaginary line from the pet's later position. A melee slash, instantaneous ground pulse, magical line or support ward is *not* automatically a flying object. Second pet skills have a 0.65-second interruptible hold: preparation is neither damage nor projectile travel. Existing caps, mitigation, buffs, heals, status effects and 8/12-second pet cooldowns stay authoritative.

**Confirmed visual mismatch and targeted repair:** Ranged pet first-skill bolts (Crypt/Archive/Abyss) already fly and damage on contact, but the generic impact event took fromX/fromY from the pet's position *at contact*, after the pet may have moved. The shared renderer then drew a full line from that later position to the target for the 0.65-second impact effect. This creates a misleading beam/tether after the real projectile has already arrived. PR #464 now records launchX/launchY on those actual projectiles, uses the original release coordinates for impact orientation, marks the contact as physicalProjectile and omits only that after-impact full-length geometry. The local family-specific contact material, traveling shot, release cue, cooldown and contact-only support retain their behavior. No other pet ability inherits this marker.

## Family-by-family skill audit

| Family (boss key) | First skill — timing & ownership | Second skill — 0.65s charge, then contact | Disposition / visual watch |
| --- | --- | --- | --- |
| **Thornpup** (thorn), melee | Dynamic Entry: immediate close target blow; no simulated leap or arrow | Tripwire: centered target splash, max 4, Slow on hit | Keep a quick close strike and planted trap/splash. Verify “Entry” does not look like an unimplemented long dash. |
| **Little Lifebinder** (crypt), ranged | Stay Alive: real dodgeable bolt; 10% self and eligible ally HP recovery **only after successful contact** | Algor Mortis: immediate cold circle, max 3, Slow | Fix physical impact tether. Keep heal tied to successful bolt impact; cold circle is not a flying arrow. |
| **Mireling** (mire), melee | Hydraulic Hop: immediate close hit with Slow, no moving physical leap | Little Inundation: immediate wide circle, max 4 | Keep hit-then-ripple semantics. Watch whether “Hop” promises actual travel absent from gameplay. |
| **Pocket Keeper** (archive), ranged | Water Jet: real dodgeable bolt | Undertow: instant line-shaped water control, max 5, Slow | Fix physical impact tether for Water Jet. Undertow's stylized water-wave progression is an *afterimage* of an instant effect; check phone readability before reworking causality. |
| **Little Treasurer** (ridge), melee | Coinage Bonk: instant close physical blow | Rolling Cargo: **currently immediate** line hit, max 4 | Explicit watch: moving-cargo imagery could misleadingly imply a traveling collider. Do not convert its already-timed hits into physical travel without separate balance/performance acceptance. |
| **Pebble Colossus** (mine), melee | Punching Shear: close hit, then self-ward 25% / 4s | Tiny Compaction: instant target-area ground pulse, max 4, Slow | Preserve real ward on the pet; ground pulse stays world-planted. |
| **Ash Cadet** (warlord), melee | Cleaving Combo: instant forward cone, max 3 | Pursuit Sweep: instant wider cone, max 4 | Sword-fan aftermath is planted combat history, not a thrown weapon. |
| **Veyrith Whelp** (abyss), ranged | Compressor Puff: real dodgeable physical magical shot | Wake Vortex: instant target-area magic, max 4, Slow | Fix physical impact tether on Puff. Vortex remains target-centered. |
| **Little Marshal** (citadel), ranged | Precise Contouring: **instant line**, max 2, deliberately no projectile | Fractional Resurfacing: instant cone, max 3, Slow | Despite ranged role, do not fabricate a projectile for either technique; their authored identity is direct line/fan magic. |
| **Cinder Cub** (cindermaw), melee | Little Cordon: instant area around aimed enemy, max 4 | Parens Patriae: immediate close hit; pet self-ward 35% / 4s | Ward remains recipient-bound. The release footprint must not follow a moving cub. |
| **Pocket Sovereign** (darklord), melee | Veteran's Repertoire: close melee blow, +25% damage to already-wounded targets (<=35% HP) | Pathfinder's Gambit: instant line, max 3 | Preserve bounded conditional hit and planted line; no invented traveling blade. |

The four pet families with ranged combat roles are crypt, archive, abyss and citadel. Only crypt/archive/abyss first skills have a **physical target projectile**; Little Marshal's first is explicitly a non-projectile line. All eleven second skills are charged melee/area/line/pulse effects, not real launched bolts. Ordinary ranged pet basics and defensive shots already launch at the current pet location with independent flight and remain unchanged. Immediate pet skill hit effects are world snapshots, while self-wards follow the pet through existing live status rendering.

## Focused regression evidence and release boundary

New focused test: tests/pet-postcast-visuals.test.cjs covers all eleven family definitions, the three physical first-skill families at 20/30/60 steps, pet strafing after release, contact-only impact, original launch coordinates, preserved event flag through the common visual queue, the eight other first-skill nonflight families and all eleven 0.65-second second-skill holds. Existing pet-skill-effects, pet-skill-activation, ranged-pet-support, melee-pet-roles and charge-interruption regressions remain part of review. **CI result must be taken from an exact-head GitHub run, not inferred from this document.**

Not modified: skill names, learned gates, number of targets, damage, Slow, wards, HP/Mana restoration, combat pursuit, collision, timelines, save version 4, renderer selection, reduced-motion options, cache/release metadata or any component of draft Critical Executions PR #440.

**Unresolved visual gate:** real desktop/phone judgment of Water Jet/Compressor Puff clarity, charged Undertow/Rolling Cargo/Pursuit Sweep afterimages, small screen crowded-pet effect density and 20–60-step apparent spacing. Source-level correctness and ordinary CI cannot certify game feel. PR #464 stays draft, unmerged and undeployed, with no full/browser/manual suite launched.
