# Ranger normal/charged skill assessment — 3 November 2026

**So I Became the Dark Lord's Problem** · **Owner decision: preserve the current Ranger kit for the v0.9.2 update.** This is a source-informed assessment, **not** a request, approval, specification or implementation plan for redesign.

> **3 November owner supersession of this document's earlier draft:** The charged-form replacements, candidate names, damage values, movement, interruption and coordinated-hunt mechanics previously proposed for Ranger Skills 5–8 are **withdrawn from the active plan**. They remain discoverable only in prior Git history as abandoned brainstorming, **not accepted design**. No Ranger skill changes are authorized by this audit, and no skill changes were made in this documentation PR.

## Purpose and assessment standard

The concern arose because some Strategist designs treated Charged as little more than a more powerful version of Tap, whereas this RPG has no universal rule requiring that relationship. The owner's request was to **reassess** existing class skills and distinguish those worth preserving, refining or potentially redesigning—not to invent replacements before playtesting.

The source-only review inspected `src/prototype/hero-combat.js`, `src/prototype/rules.js`, `src/prototype/skill-reference.js`, and historical class/skill records. **This assessment does not substitute for an end-to-end Ranger playthrough.** Two actions may share a damage/control theme but still serve a real use case; conversely, different-looking mechanics may prove redundant in actual campaign play. Neither a source observation nor a provisional classification establishes that a change is necessary.

## Ranger Skill 1–8 — current behavior and provisional assessment

| Skill | Current Tap | Current Charged | Source-based assessment | Decision for v0.9.2 |
| --- | --- | --- | --- | --- |
| **1** | **Rapid Arrows:** three staggered physical arrows at one foe, dividing an ordinary tap damage budget | **Hawk Interception:** traveling hawk tracks a foe and can interrupt a retreat on actual contact | **Preserve.** Direct focused attack versus autonomous anti-retreat pursuit are distinct tactics. | **Keep both unchanged** |
| **2** | **Pinning Shot:** two slowing physical arrows aimed at one foe | **Pinning Volley:** slowing physical projectiles through an aimed enemy line | **Preserve for now; reassess only if play reveals overlap.** Single-target control versus line/formation control differs, even though both Slow. | **Keep both unchanged** |
| **3** | **Self-Heal:** restores the wounded Ranger, not castable at full hero HP | **Party Heal:** heals every wounded, living, eligible active party member, including Ranger; no revival | **Preserve.** Personal sustain versus broad party rescue. | **Keep both unchanged** |
| **4** | **Movement Haste:** increases Ranger movement | **Companion Rally:** nearby eligible living companions gain movement and ordinary basic-attack speed, not special-skill recovery | **Preserve.** Different beneficiaries and practical combat decisions. | **Keep both unchanged** |
| **5** | **Arrow Volley:** immediate arrows at up to six nearby enemies | **Arrow Rain:** immediate arrows at up to eight within a slightly larger radius, with more damage and Slow | **Reassess after play.** Charged chiefly strengthens the same area-damage approach and adds control. This is a possible design-overlap observation, **not a demonstrated gameplay deficiency**. | **Keep both unchanged** |
| **6** | **Repelling Shot:** single physical arrow with knockback | **Repelling Volley:** three staggered arrows at the same foe, with stronger total damage and final knockback | **Reassess after play.** Similar displacement purpose; numerical upgrades may or may not justify their gameplay cost and timing. | **Keep both unchanged** |
| **7** | **Piercing Arrow:** powerful defense-piercing single-target hit | **Charged Piercing Arrow:** stronger defense-piercing hit plus Slow | **Reassess after play.** Stronger strike plus Slow; its practical usefulness against campaign armor/boss pressures is not yet evaluated. | **Keep both unchanged** |
| **8** | **Hunter's Salvo:** immediate attacks distributed across up to three foes (more arrows when isolated) | **Grand Hunt:** more arrows across up to five foes (more when isolated) | **Reassess after play.** Shared distributed-burst role with enhanced coverage and strike count; whether that is unsatisfying requires actual campaign evidence. | **Keep both unchanged** |

This table describes the reviewed source behavior, not an empirical rating of skill quality or a claim that Skills 5–8 are defective. Damage, rank scaling, critical intensity, cooldowns, charged holds, hit legality, projectiles, target geometry, enemy defenses and existing skill names are **unchanged**. No damage miscalculation or projectile-contact bug was established by this audit.

For reference, the current Level-1 Critical Execution *effect type* by slot, Tap / Charged, remains: **1 damage/damage; 2 Slow-duration/Slow-duration; 3 healing/healing; 4 Haste-duration/Haste-duration; 5 damage/Slow-duration; 6 push-distance/push-distance; 7 damage/Slow-duration; 8 damage/damage.** These are current source registry associations, not new critical designs. Higher-level intensity follows `src/prototype/critical-levels.js` and its existing live rules.

The broader project already contains non-upgrade pairs (e.g., Paladin Shield Stance / Shield Bash, Mage Spell Interrupt / Silence Field, and Ranger Haste / Rally). It is not a universal design requirement that every Charged action must diverge entirely from Tap, or that similarity is automatically bad.

## Owner-approved development direction

1. **For the v0.9.2 update:** keep all Ranger skill mechanics as-is. This review **does not authorize** redesigns, renames, tuning, new critical outcomes, or runtime changes; it is also not a release blocker. Normal bug fixes, if separately discovered and approved, are a different matter.
2. **For later versions:** evaluate each playable class **through actual campaign play**, ideally a full playthrough per class. Observe progression, enemy groups, bosses, surviving companions and the situations where a skill helps, feels redundant or fails to solve a real problem. The owner will decide what to preserve, refine or redesign in light of that experience.
3. **Do not turn a source-only shortlist into a redesign backlog.** Skills 5–8 are candidates for observation, not tickets requiring four replacement abilities. Skills 1–4 are also open to revision if gameplay eventually provides a concrete reason. Class-by-class assessments must not preempt the owner's eventual experience with Paladin, Mage, Rogue, Ranger or Strategist.
4. **When a future change is considered:** capture the encountered gameplay situation and intended tactical role before selecting mechanics. Then review trade-offs, balance, critical effects, existing rank/cooldown rules and implementation/test needs. Obtain fresh owner design/implementation permission rather than resurrecting the withdrawn candidates.

A useful lightweight playthrough note is: *class and progression stage; encounter and actual problem; skill form used and why; observed outcome; what decision or capability felt missing; preserve/refine/redesign judgment after comparison with the rest of the kit*. This is guidance for later analysis, **not** an obligatory checklist or new certification gate for v0.9.2.

## Evidence and status

- **Assessed:** Current Ranger Tap/Charged source behavior for all eight slots and their current critical-effect registry; source-only overlap observations, not complete playtesting.
- **Owner decision:** No skill changes for the present v0.9.2 scope based on this audit; class-by-class gameplay-led reconsideration deferred to later versions.
- **Withdrawn:** This branch's earlier charged-form alternatives and exact candidate tuning. Do **not** use old PR descriptions/commits as implementation authority.
- **Implemented:** **Documentation revision only** in this draft; no gameplay code, player-facing names or balance edits.
- **Not evidenced by this documentation task:** gameplay test runs, full class playthroughs, CI certification, merge, publication or device verification. Those are separate statuses with separate gates.

See the [maintained owner design decisions](DECISIONS.md) for the overarching preserve-now, playthrough-first direction.
