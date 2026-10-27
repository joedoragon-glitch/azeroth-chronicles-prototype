# Rogue Bard — Phase 2 staged hero foundation (27 October 2026)

## Scope and explicit owner decisions

**Design authority update:** [The original owner discussion record](ROGUE_BARD_DISCUSSION_RECORD_20261026.md) is the working canon for **initial implementation until playable release and the owner's first-hand testing**; later owner corrections (bell-staff, Charm-first tutorial, labor/Succession rules) prevail. The documented [regular and crowned appearance direction](ROGUE_BARD_STATIC_VISUAL_DESIGN_20261026.md) should be implemented as the first-play look, rather than reopening concept invention. Do not treat any single outfit or balance candidate as irrevocable after the owner starts playtesting.

Phase 1 reconciled PR #511 with main at bd1cbe83 and passed focused CI. Phase 2 implements a dormant Rogue class profile, automatic basic-attack mechanics and 2-second Endure. The existing playable registry still contains only Paladin, Mage and Ranger; Rogue selection, manual/charged skill performances, Charm conversion, labor, new tutorial, sounds, sprites, and deployment remain blocked for later phases.

**Weapon change superseding all earlier guitar prose:** a staff with a single oversized spherical **jingle bell hanging from it**, not the reference character's ordinary bell. Reference character clothing, other accessories and body design are *not* approved. A per-hit **bell-jingle** event is the authored sound intent; this phase does not ship audio assets or live playback. Do not accidentally bind Mage/Ranger audio. Original character presentation is pending.

## Source integration

- Rules exports `rogueHeroFoundation` independent of the public `balance.classes` registry: initial HP 90 / dormant MP 60 / Power 18 / Armor 3 / Speed 300; talent coefficients Power +7, MP +2, HP +27, Speed +38. No normal-stat passive. All are candidate numerical details from earlier design review, not newly owner-finalized balance.
- The rogue-only automatic basic is 260 reach, every 0.85 simulated seconds (before talent CDR), one primary contact at 0.8 × (Power + 12) × existing rank/combo scaling, at most two 25%-strength nearby splash contacts, or four secondaries on third-hit finisher (at most five total). This is bounded, renderer-independent damage; no projectile actor or Charm roll. **Only a real primary hit may later attempt Charm.** Geometry and multipliers stay balance candidates until testing.
- Manual tap/charged slots 1–8 remain unavailable; unknown classes still fail closed. Rogue's automatic basic does not consume MP or modified tap cooldown. A jingle-bell event is emitted for future media integration.
- Endure changes a first legal lethal hit per life to 1 HP and protects the hero from subsequent HP hits for **2 seconds**. There is no auto-death on expiry, no speculative 90-second retrigger rule; after the window the next hit may kill. Per-life use persists across saves; transient active protection does not. Standard death/refuge begins a new life. These unapproved recovery details remain adjustable in later owner balance review.
- No new playable class entry or ordinary-game Succession count change is made in this phase. Phase 3/4 admission requires authentic Charm, the class-specific introductory Charm tutorial before Barracks tutorial, and Charmed-creature ordinary labor rights. The Rogue never builds Barracks herself.

## Acceptance checks

Require native suite for staged Rogue basics and Endure, normal class combat/passives, fourth-class guard, original hero cooldown behavior, snapshot and restart validation. Focused CI is the immediate gate; full browser/mobile/Pixi acceptance is deferred. Do not merge to main or deploy as a playable feature.
