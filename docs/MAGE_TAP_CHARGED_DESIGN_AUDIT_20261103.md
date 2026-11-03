# So I Became the Dark Lord's Problem — Mage normal/charged skill audit

**3 November 2026 · read-only source/design assessment · current decision: retain all existing skills for the v0.9.2 development cycle.**

> **Owner decision, 3 November:** Do **not** redesign, refine, rebalance or replace Mage skills as a consequence of this audit. The earlier speculative replacement spells and critical-effect suggestions were **rejected as a development direction for this update**. They are **not approved designs, not an implementation specification, and not a future backlog**. The original draft remains traceable through Git history only; do not treat its alternatives as canon or silently resurrect them. Future changes, if any, must come from the owner's own full-class playthrough observations and a separate design decision for later versions.

## Scope and evidence

This is a **source-based qualitative comparison**, **not a gameplay playtest** or a finding that the current Mage is underpowered, unfun, defective or unsuitable for v0.9.2.

- Player-facing skill descriptions: [`skill-reference.js`](../src/prototype/skill-reference.js).
- Actual targeting/casting and contact behavior: [`hero-combat.js`](../src/prototype/hero-combat.js).
- Present target caps, timings, rank scaling and skill data: [`rules.js`](../src/prototype/rules.js).
- Present **opt-in** Mage critical authoring: [`critical-levels.js`](../src/prototype/critical-levels.js); the existing effects are not changed by this audit.
- Source checkpoint for this audit: `main@bbc482b70d472d79fb3e66fad92390d3b47a0184`. Check live code again before making future claims about skill behavior.

**Design standard:** Charged does not have to be a more powerful edition of Tap. Different effects, target shapes, timing, risk and tactical use are valid. However, a stronger charged form is **not automatically bad**: the player's actual problems and choices during progression determine whether any change is worthwhile. Other existing classes demonstrate distinct Tap/Charged pairs (e.g., Ranger 4 and Paladin 3); this is a design precedent, **not** a requirement to rewrite every Mage pair.

## Audit findings — not change requests

The categories below indicate **where to pay attention during future playtesting**, not what must be redesigned.

| Mage skill | Present Tap / normal form | Present Charged form | Source-based comparison | Review category only |
| --- | --- | --- | --- | --- |
| **1. Arcane Beam** | Focused single-target aimed/homing beam; separate automatic three-hit combo. | Wider, committed line beam hits enemies in its corridor with increased damage. | Distinct targeting/positioning already exists; stronger corridor payoff may feel like an upgrade. | **Possible refinement** — observe reliability versus line setup. |
| **2. Frost Bolt** | Single traveling hit damages and Slows. | Target-centered Frost Burst damages and Slows multiple foes. | Single-target versus area targeting is useful, but both deliver the same core damage/Slow payload. | **Possible refinement** — observe whether both uses remain worthwhile. |
| **3. Spell Interrupt** | Physical projectile interrupts one current warned/aimed attack on contact. | Bilateral Silence area around Mage blocks eligible special casts, including Mage/allies. | Precise reactive interruption versus risky area suppression are already distinct tactical commitments. | **Preserve / no issue indicated**. |
| **4. Arcane Fracture** | Single-target damage plus vulnerability (Fracture). | Larger splash applying stronger/longer vulnerability. | Same vulnerability application, mainly enlarged. | **Possible redesign review**, but only if play exposes a problem. |
| **5. Force Pulse** | Nearby damage and outward knockback, capped targets. | Larger damaging area and stronger outward knockback. | Same push-away combat role, larger effects. | **Possible redesign review**, conditional on play. |
| **6. Magic Shot** | Projectile damages and Slows one foe. | Stronger/faster focused projectile Slows longer. | Same damage-plus-Slow combat role, mainly stronger figures. | **Possible redesign review**, conditional on play. |
| **7. Arcane Chain** | Bounces instant damage among up to three eligible foes. | More damage and broader chain reaching up to five foes. | Same chained damage role, increased magnitude/coverage. | **Possible redesign review**, conditional on play. |
| **8. Astral Detonation** | Instant targeted blast with a stronger primary hit. | Larger stronger blast plus temporary vulnerability. | Additional Fracture adds a setup role, but a larger blast is still central and partially overlaps Skill 4. | **Possible refinement** — evaluate setup identity in a real playthrough. |

**Interpretation:** The source review found a potential enhancement pattern in seven Mage pairs, strongest in 4–7, but **did not establish that any one needs alteration**. It is acceptable for a skill pair to be fairly simple at the game's present stage. This document is a reference for observation, not an order to turn seven spells into new mechanics.

## Accepted development decision and future evaluation

1. **For v0.9.2:** keep the Mage's currently implemented Tap and Charged actions, existing names/behavior, rank scaling, critical-effect registrations, costs/cooldowns, controls, menus, art/audio, and save behavior unchanged by this audit. Do not let an aesthetic preference for novelty expand this update's scope.
2. **Across playable classes:** the owner intends to complete genuine playthroughs **class by class**, finding friction, missing tactical tools, redundant actions, progression gaps, and situations where an existing skill already succeeds. Specific observations—not a quick speculative spell list—will inform any later revisions.
3. **Future classification:** preserve a functioning pair when no need emerges; refine a good skill when a limited practical adjustment solves a witnessed problem; redesign only when an actual gap or persistent redundancy warrants a different action. No number of future redesigns, exact spell concepts or schedule has been approved.
4. **Separate authority:** any later change requires the owner's explicit design direction, dedicated implementation and focused tests, documentation/localization reconciliation and separately authorized merge/publication. Do not treat this dated audit or the old draft's suggestions as permission.

## Status

**Audited:** current source behavior for all eight Mage pairs at the stated checkpoint. **Owner direction recorded:** defer any skill changes until class-by-class experiential evaluation in later versions. **Implemented:** no gameplay, UI, critical or balance change. **Gameplay tested:** not by this audit. **Merged / deployed / device-verified:** not by this document; the documentation PR remains an independent draft until separately approved.
