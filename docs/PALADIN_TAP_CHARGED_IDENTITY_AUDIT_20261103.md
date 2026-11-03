# Paladin Tap / Charged skill reassessment — 3 November 2026

> **Owner decision (3 November 2026): retain the existing Paladin skill kit for the v0.9.2 development effort.** This is an evidence-based **classification**, not approval for a redesign, balance pass or implementation. The owner explicitly withdrew all rapid-fire proposed replacements for Tap, Charged and critical effects. Future skill authoring is to follow **actual class-by-class, preferably full-campaign playthroughs** and the specific problems and unmet tactical needs those playthroughs reveal. Do not automatically turn audit observations into a work queue.

**Scope and status:** Documentation-only source review of Paladin Skills 1–8, both forms, and comparisons with other implemented classes. Existing gameplay is provisionally acceptable for the present release goal. **No skill mechanics, critical effects, progression, cooldowns, controls, UI, VFX, audio, saves or player-facing descriptions are changed by this review.** No new executable tests or hands-on Paladin campaign playthrough were performed as part of this audit.

## Why this review happened

The owner raised a concern during Strategist design: **a charged skill does not have to be a strictly stronger version of Tap**. The game's existing design permits creative divergence, not a mandatory power ladder. Equally, it does **not** require every Tap/Charged pair to be mechanically unrelated. Different footprint, timing or battlefield purpose can create meaningful choice even when they share a status effect.

The source-verified judgment is more nuanced than “Skills 4–8 are just the same move upgraded.” Distinct target geometry, displacement and control scopes already exist. Several pairs nevertheless share most of their tactical purpose, and the area-attack overlap between **Skills 5 and 7** warrants later attention. These are **design observations**, not confirmed defects or permission to change shipped mechanics.

## Classification: preserve, possibly refine, or reassess for redesign **later**

The descriptions below record **what is currently implemented**. “Future review” marks a question for the owner to evaluate after play, not a selected replacement.

| Slot | Current Tap | Current Charged | Decision for v0.9.2 | Future observation to validate through play |
| --- | --- | --- | --- | --- |
| **1 — Radiant Strike** | Aimed holy projectile; automatic sword combo operates separately | **Radiant Cross:** two location-anchored, cross-shaped pulses | **Preserve** | Geometry and timing already create separate tactical choices. |
| **2 — Sundering Strike** | Single-target hit + Weaken | **Holy Cleave:** frontal cone hit + multi-target Weaken | **Preserve now; possible refinement later** | Does the single-target/cone distinction remain useful, or is Charged only a better Weaken delivery? |
| **3 — Shield Stance** | Defensive stance with offensive tradeoffs; tap again to lower | **Shield Bash:** immediate frontal strike + collision-safe knockback | **Preserve** | Strong guard-versus-displacement distinction already exists. |
| **4 — Judgment** | Holy projectile + single-target Taunt | **Grand Judgment:** area damage + group Taunt | **Preserve now; possible refinement later** | Does solo-threat versus group-threat control create meaningful choices in actual encounters? Boss scripted attacks remain protected. |
| **5 — Holy Area** | Immediate nearby holy area attack; six-target cap | **Consecrated Wave:** wider, stronger area damage, up to eight targets, plus Weaken | **Preserve now; future redesign *candidate* only** | The pair is primarily area burst versus enhanced area burst. Observe crowd-fighting needs and overlap with Skill 7. |
| **6 — Vanguard Rush** | Enemy-directed rush + strike | **Vanguard Impact:** approach + landing push wave | **Preserve** | The Charged push may enable genuine defensive crowd peeling, distinct from closing distance; verify by playing. |
| **7 — Holy Assault** | Strong nearby area attack; six-target cap | **Oath Strike:** larger area attack, eight-target cap, plus Weaken | **Preserve now; future redesign *candidate* only** | Strong Tap/Charged overlap; especially assess why a player would choose Skill 7 over Skill 5 in different situations. |
| **8 — Sanctuary Oath** | Holy blast + Paladin self-heal + nearby party ward | **Last Bastion:** larger blast, more healing/protection/targets and Weaken | **Preserve now; future redesign *candidate* only** | The Charged form extends the same offense/recovery/ward package; assess whether late-game party crises reveal a genuinely missing role. |

**Classification is not a priority mandate.** Skills 1/3/6 have credible identities worth preserving; 2/4 may justify refinement after experience; 5/7/8 present the strongest structural questions. The owner might ultimately keep any of them unchanged. In particular, target-count or radius differences are not automatically bad design.

**Cross-slot observation:** Normal Skills 5 and 7 both deliver self-centered area damage, and both Charged versions add Weaken. Charged 8 also applies Weaken. This may feel repetitive, but only encounter experience can establish whether it causes actual player-facing redundancy.

**Comparison baseline:** Paladin Skill 3 already shows different forms can do different jobs; Ranger Skill 4 and Mage Skill 3 also demonstrate creative form divergence. Other classes do use expanded charged variants, so neither a universal “Charged = stronger Tap” rule nor a universal “each form must be a new genre” rule is supported.

## Owner-approved decision and release boundary

1. **For the v0.9.2 effort: no redesign, retuning, replacement, critical-effect rewrite or other Paladin skill change is authorized by this audit.** Existing mechanics remain the source of truth. This does not bar independently evidenced bug fixes separately approved through normal development.
2. **Withdraw the earlier suggested replacements.** Examples such as a parry/counter for Skill 2, punishment mark for 4, stationary healing sanctuary for 5, ally intercept for 6, focused finisher for 7 or damage-sharing stand for 8 are **not a design backlog or agreed future direction**. The previous brainstorm is superseded, not pending implementation. Do not quietly reintroduce these ideas as if accepted.
3. **Leave critical executions unchanged.** The existing per-action critical identities, chances, enhancement levers, three intensity levels, single-roll rules and protections remain governed by current source. No new critical behavior for hypothetical redesigned skills is approved.
4. **Future, post-v0.9.2 evaluation is experiential.** The owner intends to play each class through a complete campaign where practical, observe how its kit behaves at each progression stage and against different encounters, then identify *specific problems a skill change should solve*. Only after those observations should a future version decide whether to preserve, refine or redesign a particular form.
5. **No prescriptive development task now.** Do not open gameplay implementation work or alter class skills merely because this assessment flags overlap. Reopen skill design only with owner-led playthrough evidence and explicit later decisions. Keep other classes' reassessments independent; do not apply Paladin suggestions wholesale to Rogue, Ranger, Mage or Strategist.

## When future skill design is reopened

Capture reproducible in-game examples, not abstract symmetry preferences: character level/rank and region, encounter composition or boss, party layout, Tap-versus-Charged opportunities, what problem the existing kit failed to address, what alternative use was expected, and whether cooldown/targeting/geometry made one form meaningfully preferable.

Then review identities **within a skill and across all eight slots**, including skill-journal clarity, ordinary/TRUE boss rules, critical effects, progression, solo/party use, challenge and survival, performance, legacy saves, bilingual guidance, audio/visual signaling, and actual device feel. A proposed redesign would require a separate design review, explicit selection, implementation, regression testing, and release acceptance; none is pre-authorized here.

## References and verification

- [Live combat owner](../src/prototype/hero-combat.js): cast routing, targeting, movement, area effects and mitigation.
- [Game rules](../src/prototype/rules.js): skill forms, scaling, target caps and cooldown contracts.
- [Player-facing skill reference](../src/prototype/skill-reference.js): current Tap/Charged summaries.
- [Existing critical intensity/action registry](../src/prototype/critical-levels.js): current critical effects; not changed.
- [Historical class-skill decisions](HERO_CLASS_SKILLS_2_8_CONSOLIDATED_REVIEW_20261015.md): prior authoring and balance evidence; not authorization for a new rewrite.
- [Strategist working design PR #697](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/697): context for the owner's original concern, not an imposed universal standard.

**Audited:** Source behavior for all eight Paladin Tap/Charged pairs and relevant peer-class patterns.  
**Owner decision recorded:** Keep current skills for v0.9.2; defer design reconsideration until playthrough-led findings.  
**Skill redesign implemented / skill redesign tested / skill redesign merged / skill redesign deployed / device-verified:** **None.** This document makes no claim that game balance or future design directions have been playtested or approved.
