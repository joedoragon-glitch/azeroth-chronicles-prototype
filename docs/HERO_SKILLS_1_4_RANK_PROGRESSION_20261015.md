# Hero Skills 1–4: approved design and rank-progression contract (15 October 2026)

> **Status:** Owner-approved ability identities for Paladin/Mage Skill 3 and Skill 4; owner-approved fair rank progression for Skills 1–4 of all classes. **Design specification only**; the gameplay code has NOT been changed by this document. Numerical tuning below is an initial implementation proposal pending automated and human balance review. This document must not be confused with implemented behavior or release approval.

## Guardrails

- Keep the current multi-file GitHub Pages/PWA architecture. Never add a portable-single-HTML requirement.
- Preserve existing version-4 saves, learning, training cost and instructor rank ceilings: Thorn 2; Mire 3; Ridge 4; Warlord 6; Citadel 8. Skill 3 and Skill 4 are learned at Mire. Upgrade **one skill rank** once, and both normal and charged versions benefit immediately.
- Skills 1 and 2 **already** multiply normal and charged damage by `1 + 0.15 * (rank - 1)`. Preserve this existing every-rank growth (rank 8 = 2.05× rank-1 damage before target mitigation).
- Add restrained **secondary** progression at ranks 2, 4, 6 and 8; do not use multiplicative exponential gains, silently change targeting/collision, or duplicate the 15% scalar.
- Keep Ranger Skill 3 (normal self-heal; charged heal of hero and living active party) and Skill 4 movement haste unchanged. Ranger Skill 4 is not newly chargeable without a separate owner decision.
- Preserve shared tap (<0.20s) / full charge (0.65s) input semantics for Skills 1–3; introduce the same for Paladin/Mage Skill 4 only. Aborted half-charges must not cast or consume cooldown. Pauses/menu/save/restore must not leak indefinite effects.
- Charge forms use the same skill slot and rank as the normal form; charged and normal cooldowns are mutually exclusive. Cooldown Training remains effective.
- Respect actual encounter geometry, obstruction, aggro rules, scripted boss phases, threat tracking, UI, audio and procedural/sprite visual canon. A buff/debuff must expire or be cleared on death, reset, class change and incompatible save recovery.

## Approved class-specific ability identities

| Class | Skill 3 normal (tap) | Skill 3 charged (hold) | Skill 4 normal (tap) | Skill 4 charged (hold) |
| --- | --- | --- | --- | --- |
| Paladin | **Shield Stance**: 8s max, serious damage reduction; disable Skill 1 auto-attacks; remaining offensive skill damage = 60%; tap again ends stance early and **starts cooldown** | **Shield Bash**: very short frontal cone, damage and collision-safe outward push; bosses and captains also pushed but take **50% of ordinary bash damage** (never 50% of max HP) | **Judgment**: single-target holy strike that provokes the enemy to attack the Paladin | **Grand Judgment**: stronger primary strike plus smaller splash hits; taunts all struck enemies |
| Mage | **Spell Interrupt**: cancel one enemy attack while casting or still in its telegraph/warning phase; **8-second normal cooldown** | **Silence Field**: suppress skill use by enemies, Mage and living active companions in its area; ordinary movement/attacks remain available | **Arcane Fracture**: single-target damage and temporary incoming-damage vulnerability shared with companions | **Arcane Rupture**: stronger primary damage with AoE splash and stronger shared vulnerability; normal and charged vulnerabilities do not stack |
| Ranger | Existing hero-only heal | Existing party heal | Existing movement haste | **No new charged form** |

The normal Paladin Shield Stance is a toggle: while active, Skill 3 tap cancels it **even if nominally on cooldown**; the cooldown begins on deactivation/expiry, not at activation. Charged Skill 3 is a separate offensive choice and should not silently activate a stance. No Skill 1 automatic/movement-triggered strike while shield is held, and no accidental charged Skill 1 while in stance unless owner expressly specifies; other attack abilities retain their mechanics with the 60% outgoing modifier.

Silence is bilateral, not a monster-only debuff. Do not quietly suppress only the allied skills or only enemy specials. Existing issued projectiles and hazards are not erased. Spell Interrupt is one target and one current warning, not an entire multi-phase boss fight. Both require dedicated boss/captain/night-special tests.

## Preliminary progression values (proposed, not separately approved)

The invariant rank milestone is `milestone = floor(rank / 2)` for learned ranks 1–8 (0 at 1, 1 at 2–3, 2 at 4–5, 3 at 6–7, 4 at 8). Numerical examples may be adjusted after survival/DPS playtests **without** changing the approved identities.

| Ability | Rank 1 | Each rank or milestone | Rank 8 |
| --- | --- | --- | --- |
| Skill 1 normal + charged, all classes | existing damage | +15% of base damage **every rank** | 205% of rank-1 base |
| Skill 2 normal + charged, all classes | existing damage | +15% of base damage **every rank** | 205% of rank-1 base |
| Charged Skill 2 Paladin cone | 185 reach | +5 reach per even rank (geometry only) | 205 |
| Charged Skill 2 Mage frost burst | 160 radius, 4s Slow | +5 radius, +0.25s Slow per even rank | 180 radius, 5s Slow |
| Charged Skill 2 Ranger volley | 480 reach, 55 half-width | +5 reach, +2 half-width per even rank | 500 reach, 63 half-width |
| Paladin Skill 3 Shield Stance | 65% incoming damage reduction, 8s | +2 percentage points damage reduction per even rank; **duration stays 8s** | 73% reduction, 8s |
| Paladin charged Skill 3 Shield Bash | 115 reach, 55 push; modest damage | +4 reach, +5 push per even rank; ordinary damage also gets standard +15% per rank | 131 reach, 75 push |
| Mage Skill 3 normal Interrupt | 8s base cooldown; one warned/casting move | +20 target acquisition range and modest enemy-special recovery on every even rank; **never multi-interrupt** | still one move |
| Mage charged Skill 3 Silence Field | 165 radius, 2s silence | +10 radius, +0.25s duration per even rank | 205 radius, 3s |
| Paladin normal Skill 4 Judgment | 3s taunt, moderate holy damage | +0.25s taunt per even rank; damage +15% base per rank | 4s taunt |
| Paladin charged Skill 4 Grand Judgment | 5s taunt; primary + splash damage | +0.25s taunt and small area-growth per even rank; damage +15% base per rank | 6s taunt |
| Mage normal Skill 4 Fracture | 15% incoming damage vulnerability for 4s | +1 percentage point vulnerability and +0.25s duration per even rank; damage +15% base per rank | 19% for 5s |
| Mage charged Skill 4 Rupture | 20% incoming damage vulnerability for 5s | +1 percentage point vulnerability and +0.25s duration per even rank; damage +15% base per rank | 24% for 6s |

Proposed normal/charged cooldowns: Paladin Skill 3 8s after stance ends / 20s after bash; Mage Skill 3 8s / 20s; Paladin/Mage Skill 4 14s / 20s. All subject to Cooldown Training. Charged push **must** respect safe positions, collision, boss leashes, telegraph anchoring and anti-exploit displacement. Bosses and captains retain scripted attack phases, cannot be pushed through walls and should not be juggled indefinitely.

## Regression acceptance matrix before any merge

1. Three classes × ranks **1, 2, 3, 4, 5, 6, 7, 8** × normal/charged Skills 1–3; Paladin/Mage normal/charged Skill 4. Confirm every-rank damage and milestone secondary progression.
2. Combo step 1/2/3, charged projectile damage parity across classes, existing area geometry and Mage Slow stacking; trained ranks survive v4 export/import and Succession.
3. Shield Stance blocks all Skill 1 input and movement auto-attack; outgoing Skill 2/4/5/6/7/8 damage modifier; incoming mitigation after armor; re-tap/expiry sets appropriate cooldown, including during paused UI.
4. Shield Bash ordinary/captain/normal boss/TRUE boss, wall and arena boundaries, enemies adjacent to companions, no clipping, no boss-leash bypass, 50% captain/boss multiplier.
5. Spell Interrupt timed just before/after warnings; normal attacks unaffected; boss and captain specials, multi-part/TRUE phases, no incorrect cancellation of already released hazards.
6. Silence Field hits enemies, Mage, Soldiers, Archers equally; no special casts inside area, but movement/basic attacks remain, no indefinite muted state after zone exit, death, reload, or expiration; phase defenses unaffected.
7. Judgment aggro and Grand Judgment crowd aggro; not overwritten by ordinary auto-target instantly; Arcane Fracture/Rupture applied to all hero/companion damage sources, no stacking, cleansed on expiry, kill/respawn/zone transition.
8. Keyboard plus touch input hold/release/interrupt, 0.20/0.65 thresholds, charged slot 4 only Paladin/Mage, HUD labels/cooldowns/status FX, sound coverage, desktop/phone/Chromium/WebKit/PWA.
9. Compare cooldown-only mode against reversible dormant mana-mode, and exercise historical imported saves. No unrelated balance or worldbuilding modifications.
10. Review all affected files and exact-head CI of release build, automated tests, desktop/phone and offline PWA. Do not merge or deploy until verified.

## Current source starting point

Authoritative sources: `src/prototype/hero-combat.js` for attacks and rank scaling; `src/prototype/rules.js` for teacher ceilings and timings; `src/prototype/app.js` for charge input and HUD; `src/prototype/combat.js` for shared damage/threat; `src/prototype/boss-combat.js` and `src/prototype/engine.js` for warning/special state machines; `src/prototype/party.js` for companions; `src/prototype/progression.js` for rank training.

**This design PR must remain isolated from the unmerged worldbuilding integration and not be represented as a working, tested feature release.**
