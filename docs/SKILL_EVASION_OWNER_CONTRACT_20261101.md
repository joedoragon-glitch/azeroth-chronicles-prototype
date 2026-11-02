# Skill evasion — owner design and implementation contract (1 November 2026)

**Status:** Draft, unmerged, not deployed or device verified. This design follows the new owner direction and supersedes the Strategist project's earlier statement that ordinary enemies cannot Dodge. The Strategist's personal Dodge and Reversal remain **separate, unimplemented fifth-class mechanics**. Do not edit PR #697/#696 to implement this global system.

## Intent
Attacks may connect physically yet the defender may evade the **skill effect** without requiring additional AI movement or changing the truthful warned ground footprint. This is a skill-based damage/status resolution check, not an alteration to projectile collisions, line of sight or opponent telegraph timing.

## Configurable initial probabilities (percentage points, not multipliers)
- Hostile enemies against standard hero/companion single-target skills: **20%**.
- Hostile enemies against standard hero/companion area skills: **30% per eligible enemy**.
- Hostile enemies against the **hero Ranger's** single-target skills: **15%**; area skills: **25%** per enemy.
- Hostile enemies against **Rogue Bard's performance skills**: **0%** (the performance cannot be dodged). The Rogue's automatic bell basic is ordinary basic combat and exempt anyway.
- Owned active **Soldier, Archer, pet and legitimately Charmed companion** recipients of monster skills, including enemy Rogue maneuvers: **20%** single-target; **30%** area, independently per recipient.
- The same **+5 percentage points at night applies to hostile ENEMIES' evasion only**, not allied companions. The existing Campaign.night() governs the condition (including its Nightmare behavior). Daytime standard 20/30 becomes 25/35; Ranger 15/25 becomes 20/30; Rogue performances remain immune to evasion.
- All rates remain in one editable rules table, not scattered literals. Evasion chance clamps to [0, 1] after addition.

## Critical priority and gameplay exclusions
1. Check attack legality, target, real collision/reach, existing immunity/protection before evasion. A spell outside its real footprint is simply a normal miss, **not Dodge feedback**.
2. **Any actual critical execution receipt marked critical bypasses the evasion roll.** If an AoE cast's single critical receipt is critical, all its otherwise eligible impacts bypass Dodge. Do not recompute a critical at impact.
3. **Basic autoattacks, automatic melee/ranged basics and basic-combo finishers are exempt** on both sides. An attack with a special appearance does not become an evadable skill merely because its projectile has a visual trail.
4. After evasion, only a landed hit may apply causally attached Slow, taunt, fracture, knockback, interrupts, siphon, Charm, etc. Do not turn evasion into invulnerability to environmental traps, reflected damage, damage-over-time already applied, or ordinary healing/support.
5. No hero, whether currently selectable or still in development, inherits this general evasion mechanic. A future Strategist passive Dodge may handle its own personal melee/ranged skills and attacks under separate rules and with its own passive melee retaliation; manual Reversal remains distinct.

## AoE rolls and receipt ownership
**One independent evasion decision per eligible defender when that defender's native effect resolves.** If three foes are inside the same Mage blast, make three separate rolls, not one all-or-nothing cast roll. A multiple-pulse attack may resolve per-pulse damage using the same native contact semantics; it must not roll each render frame. Collision remains authoritative for physical arrows.

Use a dedicated persisted evasion RNG stream, independent of the world's procedural RNG and the two critical streams. An invalid or malicious save value must be rejected, not silently trusted. Save format stays v4.

## Feedback: bounded, readable, local
A real successful evasion produces a brief muted **Miss** floating immediately above the defender, with a restrained rise/fade (or equivalent fixed badge). No notification banner, combat log spam, extra warning, screen obstruction or camera shake. Reuse existing overlay drawing in both Canvas and PixiJS, with a small independent cap, duplicate refresh per actor, finite wall-clock expiry and no new render frame scheduled. A critical displays its existing **!** cue and can never produce the corresponding Miss.

## Coverage and release acceptance
- Audit source owners: `combat.js` (damage, hitParty, friendly/enemy projectiles, hazards), `hero-combat.js` (all hero tap/charged/DoT channels), `party.js` (Soldier/Archer/pet/Charmed skill owners), `boss-combat.js` and `engine.js` (monster/captain/boss/Rogue source warnings, release and motion), `renderer.js` (both presentation paths), `rules.js`, and `save.js`.
- Exercises: zero/100% forced odds, single/area, three independent area targets, exact day/night adjustments, Rogue music immunity, Ranger exception, critical priority, automatic-basic/finisher exclusion, companion inheritance, hit-bound statuses, projectiles, charges and persistent fields, crowd caps, arena/Nightmare and old save import.
- Preserve existing critical RNG, effects, visuals, VFX timing, performance guardrails, warning footprints, floor telegraphs and authored fourth/fifth class contracts.
- Focused tests first. Full gameplay/device acceptance, merge and publication are separate owner decisions.

**Implementation warning:** Existing code uses `options.area` in some places to mean “bypass direct-target concealment,” and other places to mean true multi-target skill geometry. Do not infer a universal evasion classification just from that flag. Pass explicit skill ownership and shape wherever damage can be dealt; an intentional area classification may coexist with `area: true` when appropriate.
