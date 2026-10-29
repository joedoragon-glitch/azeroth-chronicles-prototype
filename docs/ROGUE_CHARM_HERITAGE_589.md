# Rogue Charmed companions — heritage abilities and nighttime species

> **Implementation in draft PR #608, issue #589.** This document describes the proposed playable mechanics on the feature branch. They are not merged, published, or phone-verified until the PR passes review and release gates.

*So I Became the Dark Lord's Problem* — Rogue / Charmed monster progression.

## What changes in play

When the Rogue charms an ordinary eligible monster, that creature remains an individual Soldier- or Ranger-role companion with its own name, capture identity, friendly HP, gear-compatible stats, and basic attacks. Each already has a **native species maneuver** (12-second cooldown); after learning **Skill 2**, it gains a **Ringleader tactical skill** (22-second cooldown), an improved combat pursuit profile, and native low-health frenzy. Neither existing ability is replaced.

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

- **Lantern Wraith**, Flooded Marches / Lantern Shore: while the actual hostile night encounter is active, an ordinary living Wraith can be Charmed. Its ally native Skill 1 is **Soul Drain**: a short-range bounded spectral pulse, real Slow on contact, and a small self-heal based on enemy HP actually lost (never a free heal on miss). Its Ringleader signature remains distinct from the later **Pressure Grouting** heritage skill.
- **Ash Stalker**, Ashen Frontier / Stalker Cinder Hold: at night, an ordinary living Stalker can be Charmed. Its ally native Skill 1 is **Shadow Pounce**: a short real collision-checked approach with impact damage and Slow. Its Ringleader signature remains separate from its **Flank Command** heritage skill.

**Captured night creatures remain companions after sunrise**, whether active or resting in the reserve. Wild Wraiths and Stalkers still spawn and despawn at the original night cycle. This does *not* grant Charm permission to summons, ringleaders, captains, bosses, corrupted/neutral encounters, or either species in daytime encounter states. The ordinary Charm chance, nickname, active-party cap, individual capture ledger, no-loot capture, recovery, and version-4 save checks are retained.

## Effects and feedback

Every successful heritage or native-night activation produces one ability identity, a short visual contour matching its true cone/circle/line/direct hit geometry, the existing material-appropriate sound, and the normal hit/Slow/shove feedback. Soul Drain also shows an actual recovery cue only when the Wraith recovered HP. Critical effects keep the same targeted outcome; they do not add new hitboxes, targets, attack waves, summons or random rolls. FX is a bounded 0.6-second afterimage, not a separate combat ability.

**Verification gates:** 12-species regression tests, native night admission, anti-forgery/v4 migration, geometric target caps, player-facing FX/audio, complete release checks, and phone/browser performance review. Draft implementation alone is **not** a test pass, merger, publication or device acceptance.
