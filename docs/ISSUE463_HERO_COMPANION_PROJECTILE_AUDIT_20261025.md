# Issue #463 — Ranger, Paladin, Archer and Soldier release/impact consistency

25 October 2026 · continuing **single draft PR #464** · founded on published dev.185, reconciled against main Rogue #462. This document captures source-observable mechanics, accepted visual-fantasy rules, and verification limits; it is not a claim of real-phone human playtesting.

## Authoritative fantasy rule

A physical arrow or thrown weapon is visually attached to its living shooter *until the actual release*, then flies on its own real collider path. A hit/slow may only begin once the visible front meets its legal target. The bow's previously occupied position must not fire phantom delayed arrows. Planted attacks remain planted when their damage remains planted, and cast history may briefly remain at that point. Genuine ongoing actor-bound effects (aura, shield, ward, held beam) follow the current actor/recipient, but unrelated arrows must never inherit the Mage Skill 1 beam tether.

**Do not** manufacture instant full-corridor arrows or decorative darts when damage was calculated instantly. This mistaken first attempt in PR #464 was explicitly reverted after owner review. If a physical move requires causality, move its simulation contact to physical flight; do not merely speed up its drawing.

## Ranger — slots 1–8

| Slot | Tap | Charged | Ownership and reviewed behavior |
| --- | --- | --- | --- |
| 1 | Rapid Arrows | Hawk Interception | Staggered delayed members now physically start at live moving bow on sub-release, then travel independently. Hawk is a genuinely autonomous moving entity, not tethered. |
| 2 | Pinning Shot | Pinning Volley | Normal delayed second arrow launches from live bow. Charged corridor preserves originally selected foes but now launches real arrows; damage and the one authored Ranger Volley Slow application wait for physical contact rather than false instant arrow front. |
| 3 | Self-Heal | Party Heal | Instant restorative magic / release glint is permitted; health effects belong to actual recipients. Do not render as literal thrown arrows. |
| 4 | Movement Haste | Companion Rally | The active status belongs to each relevant moving recipient; existing live statuses already track actors. |
| 5 | Arrow Volley | Arrow Rain | Normal selects existing radius/target count but now releases real contact-resolved arrows instead of instant damage plus disconnected cast-origin shafts. Charged already creates independent arrows and remains untouched. |
| 6 | Repelling Shot | Repelling Volley | Normal independently launched physical arrow unchanged; charged delayed members now release from live bow and retain existing push semantics. |
| 7 | Piercing Arrow | Charged Piercing Arrow | Independently launched real shots and existing defense rules retained. |
| 8 | Hunter's Salvo | Grand Hunt | Delayed arrows physically begin at live bow, commit their heading once, and fly independently. Original multi-target/isolated behavior remains. |

### Explicit tradeoff: physical arrow contact

A foe can now sidestep an incoming Arrow Volley / Pinning Volley arrow or be protected by a real terrain obstruction. Previously these two instant-damage skills could hit at cast time despite their visual arrow shafts still traveling. This is a deliberate physical-consistency correction, not a cosmetic-only claim. Cast costs, ranks, chosen target populations, raw damage multipliers, and cooldowns are retained. Do not silently reinstate instant hits or invent homing for those shafts. Consequences to balance require actual playtesting before production release.

## Paladin — slots 1–8

| Slot | Tap | Charged | Correct motion meaning |
| --- | --- | --- | --- |
| 1 | Radiant Strike | Radiant Cross | Launched holy projectile flies independently. Cross is deliberately world-planted for two real pulses; **do not** drag its second hit around after the Paladin moves. |
| 2 | Sundering Strike | Holy Cleave | Immediate sword contact/cone is resolved at the cast location, not a caster-tethered continuing projectile. |
| 3 | Shield Stance | Shield Bash | Persistent stance follows the living Paladin. Charged shield hit/cone documents completed release. |
| 4 | Judgment | Grand Judgment | Holy bolt is an independent launch. Grand Judgment explodes where the enemy was at casting; no imagined tether. |
| 5 | Holy Area | Consecrated Wave | Instant pulses are planted world-space footprints; their few-frame residual ring is release history, not ongoing actor-centered damage. |
| 6 | Vanguard Rush | Vanguard Impact | Real dash changes position. After-dash contact/ring belongs to its resolved location, not a continuous moving ring. |
| 7 | Holy Assault | Oath Strike | Instant close/area hits have short release rings. Their hit regions must not silently move with later player movement. |
| 8 | Sanctuary Oath | Last Bastion | Instant area release is planted; actual ward/shield status uses live recipients and continues following them. |

No Paladin geometry/timer/cooldown changes are made in this PR: moving planted geometry would actively misrepresent simulation. A future *specific* phone-visible residual ring complaint may justify shorter cosmetics only, after direct evidence; never rewrite all rings wholesale.

## Companion Archer ("Ranger" in player-facing roster)

| Move / context | Finding | Disposition |
| --- | --- | --- |
| Basic arrows from active combat, gathering self-defense or Recall defense | Native arrows already originate from the Archer's **current** coordinates at cast, then fly on real colliders. | Preserve, no tether. |
| Skill 1 Triple Shot (including veteran covering shot during withdrawal) | Delayed shots previously stayed at Archer's earlier position while Archer moved. | Subsequent members now inherit live Archer coordinates + target direction when individually released; no arrow is rendered at the delay-crossing frame before the actual simulation release. Already flying shafts remain independent. |
| Skill 2 Piercing Volley | 0.65s charge/aim is distinct from release; after release, prior instant line damage was visually at odds with physical arrows. | Keep charge/target selection/costs. Spawn real arrows from actual charge-release Archer location; resolve on physical contact while retaining area-type damage mitigation. No fake filled corridor or laser-like shaft. |
| Support heal, Mana Recovery | Support is magical, not a thrown arrow. Existing recipient-centered healing does not need literal bow flight. | Preserve short release/recipient effects and 5-second restoration. |

## Companion Soldier

Soldier's basic sword, counterattacks, Power Strike, and Holy Cleave are immediate *melee* blows, not ranged shots; their actual hit/arc is a cast-release location, correctly independent of subsequent movement. Veteran ward and defensive Guard apply to the moving recipient and should read as live actor status, not a planted damaging circle. No unexplained delayed throw or bolt was found among Soldier's native actions; adding one would fabricate a new skill. No Soldier gameplay modifications in this PR. The charged Holy Cleave cast-origin afterimage is shortened to 0.24s (from 0.70s), so a moving Soldier does not leave a long-lived sword-impact fan behind. That is presentation-only; hit timing, radius, damage and charge interruption remain unchanged.

## Regression gates, integration and known limits

- Native updateProjectiles at 20/30/60-step timing: delayed hero arrows and Archer Triple Shot release from the current source, retain independent direction afterward, and cancel prelaunch when the target or archer disappears.
- Real arrows: no damage before flight; contacts use existing hit radius/blocked segment/target eligibility; original multi-target cast selection and area/dust semantics are preserved except for deliberate physical obstruction/miss changes; Ranger Pinning Volley must retain its **one effective** Ranger Volley Slow application at physical contact (the generic charged-second `def.slow` is absent for Ranger in current and pre-PR rules; never invent a second stack).
- Paladin and Soldier: planted cross/cones remain at actual damage origin, ongoing stances/wards remain actor-based, sword strikes do not generate fictitious projectiles.
- Existing v4 restore discards transient projectiles, as before; no persistent format change or PWA metadata edits.
- Focused CI and deterministic package verification only. **Human sight/feel on actual desktop and phone remains unverified**; automated Canvas/X simulation cannot certify beautiful arc spacing, readability at smaller scales, or optional experimental WebGL2 trial/recovery.
- PR #440 simultaneously changes combat.js/hero-combat.js/party.js; reconcile the **entire** diff against its new head and newer main before any authorized merge. Do not merge #440 into this task.
- **Later status (25 October): the pets one-by-one phase is complete at source and focused-test level**, not device acceptance. See [ISSUE463_PET_FAMILY_RELEASE_IMPACT_AUDIT_20261025.md](ISSUE463_PET_FAMILY_RELEASE_IMPACT_AUDIT_20261025.md), [postcast integration readiness](ISSUE463_POSTCAST_INTEGRATION_READINESS_20261025.md), and the live PR #464 handoff. The earlier hero-only scope and future-pet wording were a historical checkpoint, not a remaining instruction.

**Release state:** open draft PR #464; unmerged, undeployed. No full suite, hardware certification or production claim.
