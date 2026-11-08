# Rogue/Pícara — normal-versus-charged identity audit and playthrough deferral

**Game:** So I Became the Dark Lord's Problem. **Assessment and owner disposition:** 3 November 2026.  
**Authority:** Owner's decision after review of the source-based audit. **Outcome: preserve all current Rogue skills for the v0.9.2 development goal; no redesign authorized.**

> **Do not treat this audit as an implementation ticket, a list of defects, a release blocker or approval of replacement abilities.** Eight proposed replacement pairs and alternative critical effects discussed during the audit were exploratory assistant sketches, **not owner-approved designs**. They have been withdrawn from this active document at the owner's explicit request. Do not implement, schedule, or infer acceptance of them.

## Decision and scope

- **For v0.9.2:** retain the currently implemented Tap/Normal and Charged forms of **all eight Rogue skills**, including effects, numbers, critical effects, skill-rank progression and existing stacking. This review requires **no combat edits, balance pass, journal rewrites, critical remapping, migrations or gameplay changes**. A separately demonstrated functional defect can still be handled under the normal release-quality process; this audit is **not** permission to redesign a skill while doing so.
- **For later versions:** defer any elective Rogue ability rework until the owner has actually played the class through a complete playthrough and identified concrete problems or unmet needs in progression/combat. The owner intends to play **each class** through an entire playthrough and use lived gameplay experience to decide what abilities should solve. Do not preselect replacement mechanics or treat a numerical-similarity finding as sufficient reason to change a skill.
- **Across classes:** assess Preserve vs Refine vs Redesign individually based on observed behavior. Distinct Tap/Charged tactical uses are welcome, **but not a universal requirement**. More powerful charged releases are not automatically flawed. The same process can inform the Paladin, Mage, Ranger, Rogue and future-class reviews without retroactively changing their current design.
- **Release boundary:** no Rogue skill redesign is an acceptance criterion or dependency for v0.9.2. The version's functional-completion work should not be distracted by speculative ability changes. No promised date or version number is attached to a future skills overhaul.

## What was verified in the existing code

The following is a **source-based structural audit**, *not* a playtest report or a finding that a skill is unfun, unusable, imbalanced or obstructing progression.

- `src/prototype/rules.js::roguePerformances` authors slots 2–8; `src/prototype/hero-combat.js::rogueSkill1Config` authors slot 1. `castRogueSkill1/castRoguePerformance` execute the effects, with descriptions in `skill-reference.js`.
- Normal and Charged currently differ chiefly by potency, reach, target caps and timing, with additional mechanics in selected charged forms.
- Rogue's manual performances are combat-only, self-centered, line-of-sight-gated areas requiring a lawful hostile; enemies receive negative effects and Rogue/eligible active companions get matching positive effects. Skill 5 places at most two finite music stations with continuous friendly benefits only while inside.
- Rogue uses one rank 1–8 per skill slot and an independently authored Rogue critical intensity group (developer-only default Level 2). Each legal release uses one frozen Party-stream critical receipt. Independent finite instances, including normal and charged overlap, may stack. Manual releases do **not** add Charm rolls; legitimate automatic basic-primary Charm remains separate.
- Existing Ranger and Mage skills show that different Tap/Charged roles are already legitimate. Other classes also use stronger/longer/wider charged versions. **Neither pattern is prohibited.**

## Skill-by-skill assessment — preserve now; reevaluate after gameplay

The names below are **current working labels**, not owner-approved final naming.

| Slot | Existing Tap → Charged relationship | Structural assessment | v0.9.2 disposition |
| --- | --- | --- | --- |
| **1** — Ding and Sting / Raise a Racket | Immediate damaging pulse and basic-damage Refrain → stronger/larger pulse and Refrain | **Redesign candidate for later review:** mostly magnitude rather than a separate role | **Preserve unchanged** |
| **2** — Lead Feet / Can't Dance | Enemy Slow and allied movement/recovery → stronger/longer Slow and allied boon | **Redesign candidate for later review:** largely the same combat decision at greater intensity | **Preserve unchanged** |
| **3** — Beat Breaker / Shut the Band Up | Interrupt warned/aimed actions and protect allies → adds non-boss Hush to prevent new eligible specials | **Preserve or refine after play:** charged has a real preventive-control ingredient, though it contains much of Tap's function | **Preserve unchanged** |
| **4** — Sour Note / Rotten Chorus | Enemy Wither/anti-heal and allied Mending/heal boost → stronger/longer versions | **Redesign candidate for later review:** currently a similar attrition/healing decision with greater intensity | **Preserve unchanged** |
| **5** — Sticky Shuffle / Briar Boogie | Station pulses Slow and provides Slow resistance → larger station additionally damages enemies and wards allies | **Preserve or refine after play:** the charged station already has extra damage/defense functionality | **Preserve unchanged** |
| **6** — Stolen Beat / Time Out | Adds debt to genuine enemy cooldowns and accelerates allied special recovery → larger debt/recovery boon | **Redesign candidate for later review:** mainly a stronger version of the same time-control function | **Preserve unchanged** |
| **7** — Wrong Foot / Panic Party | Enemy knockback/Weaken plus allied damage boost → stronger/longer knockback, Weaken and damage boost | **Redesign candidate for later review:** predominantly an intensified disengage/song | **Preserve unchanged** |
| **8** — Bad Bell Day / Last Laugh | Damage and critical/special inspiration → stronger damage/inspiration with a brief non-boss Hush | **Preserve or refine after play:** charged already introduces preventive Hush, although other effects scale upward | **Preserve unchanged** |

**Result:** 1, 2, 4, 6 and 7 show a **same-action upgrade pattern** deserving *potential later scrutiny*, not confirmed gameplay problems. 3, 5 and 8 contain distinctive mechanics and may need **no adjustment at all**. **All eight are acceptable to preserve for the present development milestone** under the owner's latest decision. The audit does not prioritize implementation order.

## How to revisit skills when actual play provides evidence

The owner will form judgments during whole-class playthroughs rather than approve replacement mechanics from an abstract audit. For a proposed change, first record:

1. **Where:** class, approximate progression stage, area, encounter or boss, skill rank, party composition, difficulty and relevant cooldown/charge constraints.
2. **What happened:** concrete combat challenge, ability used, whether Tap and Charged each offered a useful choice, and whether the reported problem is reproducible or merely unfamiliar behavior.
3. **What was missing:** an actual tactical need the existing kit fails to address, rather than a preference for mechanically different skill descriptions.
4. **Possible disposition:** **preserve** if useful as-is; **refine** if a targeted quality/balance/clarity change solves the observation; **redesign** only when the ability's tactical role genuinely fails a demonstrated need. An owner-reviewed concept and scope must precede implementation.
5. **Separate engineering gates:** only after an approved future change, specify gameplay/critical/EN-ES journal behavior, stacking, rank progression, legitimate recipients, boss and collision restrictions, save compatibility, focused tests, merge, deployment and **actual device playtest**. No design conversation alone constitutes these milestones.

The owner can evaluate other classes the same way, but this document **records Rogue only**; it does not claim other classes have been assessed.

## Status and sources

- **Reviewed:** existing Rogue source structure and comparable hero skill patterns; **not** a full Rogue playthrough or balance acceptance.
- **Documented:** owner decision to **preserve all eight** for the v0.9.2 functional-completion goal; later redesign deferred until playthrough-informed decisions.
- **Not implemented:** no new mechanics or critical effects; the assistant's speculative before/after redesigns are withdrawn.
- **Not run here:** no gameplay or device tests for this documentation-only decision.
- **Not inferred:** no build, merge, deployment or device-validation claim from the audit itself.

Evidence: `src/prototype/rules.js` (`roguePerformances`); `src/prototype/hero-combat.js` (`rogueSkill1Config`, `roguePerformanceAtRank`, `castRogueSkill1`, `castRoguePerformance`); `src/prototype/skill-reference.js`; `src/prototype/critical-levels.js`; [Rogue skill-rank and stacking reconciliation](ROGUE_SKILL_RANK_PROGRESS_AND_STACKING_RECONCILIATION_20261029.md); [development state](DEVELOPMENT_STATE.md). The [Strategist Stage 2 design branch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/697) is separate and does not authorize Rogue skill edits.
