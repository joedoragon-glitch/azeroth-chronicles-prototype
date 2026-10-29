# Rogue Charmed companions — heritage abilities and nighttime species

> **Implementation in draft PR #608, issue #589.** This document describes the proposed playable mechanics on the feature branch. They are not merged, published, or phone-verified until the PR passes review and release gates.

*So I Became the Dark Lord's Problem* — Rogue / Charmed monster progression.

## What changes in play

When the Rogue charms an ordinary eligible monster, that creature remains an individual Soldier- or Ranger-role companion with its own name, capture identity, friendly HP, gear-compatible stats, and basic attacks. Each already has a **native species Rogue maneuver** (12-second cooldown); after learning **Skill 2**, it gains a **Ringleader tactical skill** (22-second cooldown), an improved combat pursuit profile, and native low-health frenzy. Neither existing ability is replaced.

With this feature, the same Skill-2-trained Charmed creature gains **one separate inherited heritage skill**, determined by its actual species. The third skill has its **own saved cooldown** (26–36 seconds), and is attempted in combat when the established native and Ringleader skill priorities are unavailable. A global companion skill interval prevents a single ally firing multiple skills at once. Skill 3 is the *companion's third ability*, not the Rogue hero's third button.

The friendly effect uses the **companion's damage**, not hostile boss damage or maximum HP. A cone is directional; a circle has a real radius; a line has a finite width; a single-target strike does not hit extra enemies. All area heritage effects have a two-target cap, not an unbounded screen-wide aura. Slow applies only on genuine successful hits, and any push excludes protected elite forms and checks world geometry. Movement uses normal collision-checked travel, not teleportation. A critical hit is a **single Companion-domain roll per cast**, strengthening only the skill's authored damage, Slow duration, or shove.

## Owner-selected third skills

| Charmed species | Heritage skill | Adapted effect | Cooldown |
| --- | --- | --- | --- |
| Goblin | Dust Entrainment (Scornfang) | 0.8×, 110-unit cone, up to two, Slow 1.3s | 26s |
| Skeleton | Disarticulation (Lifebinder) | 1.25×, one enemy, shove up to 35 units | 28s |
| Mireling | Hydraulic Jump (Mirejaw) | 1.2×, one enemy, collision-checked 90-unit leap | 32s |
| Reed beast | Mud Pumping (Direjaw) | 0.6×, one small mud burst, up to two, Slow 1.5s; no lasting patch | 34s |
| Wolf | Crowd Dispersal (Thornfang) | 0.7×, 105-unit circle, up to two, shove up to 35 units | 32s |
| Ogre | Lateral Load Transfer (Garun) | 1.2×, 145-unit stone line, up to two | 30s |
| Orc | Flank Command (Ashen Warlord) | 1.2×, one enemy, lateral reposition up to 65 units | 28s |
| Raider archer | Bad Deal (Crag Tyrant) | 0.75×, 115-unit cone, up to two | 30s |
| Ash beast | Broodscreen Roar (Cindermaw) | 0.5×, 110-unit circle, up to two, shove up to 35 units; no summons | 36s |
| Crown soldier | Reversal (Veyra) | 1.2×, one enemy, shove up to 35 units | 28s |
| Lantern Wraith | Pressure Grouting (Lifebinder; thematic adaptation) | 0.65×, 95-unit circle, up to two, Slow 1.7s | 34s |
| Ash Stalker | Flank Command (Ashen Warlord; thematic adaptation) | 1.15×, one enemy, sidestep up to 70 units | 30s |

Some regional or thematic boss links are not established species ancestry. They do not change the game's history; only this optional combat heritage is adapted.

## The two night-only species

- **Lantern Wraith**, Flooded Marches / Lantern Shore: while the actual hostile night encounter is active, an ordinary living Wraith can be Charmed. Its **additional night power** is **Soul Drain**: a short-range bounded spectral pulse, real Slow on contact, and a small self-heal based on enemy HP actually lost (never a free heal on miss). Its ordinary species Rogue maneuver, Skill-2 Ringleader signature and later **Pressure Grouting** heritage skill remain independently available.
- **Ash Stalker**, Ashen Frontier / Stalker Cinder Hold: at night, an ordinary living Stalker can be Charmed. Its **additional night power** is **Shadow Pounce**: a short real collision-checked approach with impact damage and Slow. Its ordinary species Rogue maneuver and Skill-2 Ringleader signature remain separate from its **Flank Command** heritage skill.

**Captured night creatures remain companions after sunrise**, whether active or resting in the reserve. Wild Wraiths and Stalkers still spawn and despawn at the original night cycle. This does *not* grant Charm permission to summons, ringleaders, captains, bosses, corrupted/neutral encounters, or either species in daytime encounter states. The ordinary Charm chance, nickname, active-party cap, individual capture ledger, no-loot capture, recovery, and version-4 save checks are retained.

## Effects and feedback

Every successful heritage or native-night activation produces one ability identity, a short visual contour matching its true cone/circle/line/direct hit geometry, the existing material-appropriate sound, and the normal hit/Slow/shove feedback. Soul Drain also shows an actual recovery cue only when the Wraith recovered HP. Critical effects keep the same targeted outcome; they do not add new hitboxes, targets, attack waves, summons or random rolls. FX is a bounded 0.6-second afterimage, not a separate combat ability.

**Verification gates:** 12-species regression tests, native night admission, anti-forgery/v4 migration, geometric target caps, player-facing FX/audio, complete release checks, and phone/browser performance review. Draft implementation alone is **not** a test pass, merger, publication or device acceptance.


## Owner-approved three-tier individual companion mastery — integrated follow-up (29 October 2026)

**Design authority:** [draft companion mastery / Orin contract PR #609](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/609). This section records code now staged on **this same PR #608 branch**, not features on `main`. It supersedes the former implication that the heritage extension is an isolated Skill-2-only endpoint.

The existing native Charmed skill, separately timed Ringleader signature, third owner-chosen heritage skill and (for lawful night captures) separate Soul Drain or Shadow Pounce all consult **the same individual saved mastery counter**. All eligible Soldiers, Rangers/Archers, and boss pets use the same counter; no species-wide or squad-wide levels. Thresholds are cumulative **0 / 4 / 10 / 18 mastery points = Tier 0 / I / II / III**, capped at 18. Tier improves already unlocked effects and never grants a locked action or an additional target.

**Progress awards:** +1 for each automatically **paid quest**, +1 for each actual **hero level**, +1 for a real **captain defeat even if that captain later respawns**, +1 for each distinct **guardian Ringleader encounter** to that individual (stable saved location/species receipt; no repeated credit for its pre-clear respawns), +2 for each genuinely **first-credited normal/TRUE boss form**. **Ordinary Ringleader defeats never award points.** Only living active authenticated companions share the achievement; reserves and fallen do not. Engine and economy delivery own these awards, not rendering notices or transient UI events. Arena/developer mode does not earn mastery.

**Conservative power caps at Tier III:** native Charmed skill/signature damage +9%; heritage direct-damage skills +12% and control-heavy heritage damage +7.5%; Slow **+0.225 seconds** (bounded to 2.5s before a legitimate separate critical modifier); pushes **+6 units**, up to the original 45-unit cap; night Wraith siphon **8% → 9.5% of actual damage**; Charmed Dust ward mitigation **15% → 18%**. The original native skill range, two-target limits, independent timers, real projectile impact, interruptibility and 1.5s global skill cooldown never change. All three mastery gains are additive by tier, not repeated multiplicative procs.

**Other family skill growth:** standard Soldier/Archer specials and boss-pet skills receive at most **+9% Tier III skill damage**; pets' legitimate self/ally heal outcomes and Ranger/Charmed ranged healing grow by +9%, pet Slows by at most 0.225s and self-wards by at most 1.5 percentage points. All original unlock requirements and skill cooldowns remain. These are **mastery potency adjustments**, **not** the new paid extra training for those families, which the owner explicitly defers until monster/world balance review.

**Permanent future distinction:** a saved individual `masteryPoints` field and `masteryGuardianKeys` receipts preserve level and guarded encounter credit through v4 snapshots and lawful Succession. Older v4 saves migrate to 0 points / no receipts. All mastery fields require strict finite type/limit validation. **Orin the Highland Instructor's optional 100-crown per-Charmed 2.5× HP / 1.5× damage Ringleader promotion remains specified by PR #609, not implemented in this heritage PR.** Do not apply that expensive buff automatically from hero Skill 2, nor duplicate existing Ringleader 1.2× combat movement and 0.6× wounded attack recovery.

**Verification:** Branch code and focused regression tests have been committed; exact-head CI and broader gameplay/phone tests must still pass before this feature is ready. Draft status is not a merge, a publication or device verification.
