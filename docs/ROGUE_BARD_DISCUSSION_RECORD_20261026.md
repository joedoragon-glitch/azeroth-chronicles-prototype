# Fourth playable class — Rogue Bard: discussion record (26 October 2026)

**Status: tentative concept record only. Not canon, not an approved skill specification, and not implementation authorization.**
**Source:** the owner's exploratory spoken brainstorming on 26 October 2026 and the assistant's immediate response in the same conversation. This file explicitly separates the two. The companion feasibility report in this PR is the technical assessment.

## Why preserve this discussion

The intended fourth class does **not** compete by being the strongest, toughest, or most agile. She succeeds by being the most shamelessly disruptive character in the game: misdirection, casting interruption, Slow, traps, status manipulation, survival tricks, and recruiting former enemies. The owner called the character a Rogue, presented *as a bard*, with a guitar, music and dancing themes, irreverent humor and a charismatic, mischievous personality. The comparison was to a showy, playful “Ricardo” kind of dancer, not a request to copy another person's likeness. She is **female**, joining the female Mage; the Ranger and Paladin remain male as specified in the conversation. The role is a distinctive gameplay archetype rather than a generic high-damage or high-dexterity Rogue.

This was explicitly late-night brainstorming: preserve the direction, do not silently finalize numerical balance, content, or art. The owner subsequently instructed us to ground the proposal in the current game, which uses **static sprites/procedural drawings moved by the engine**, and to **avoid adding walking/dancing/attack animation systems, poses, sprite sheets, or costly new renderer machinery** simply to ship this class. New visual framing should use a single readable static appearance and existing lightweight presentation conventions. The class must not destabilize game performance or established gameplay.

## A. Owner-originated design intentions

The following are the owner's concepts, recorded as requirements-to-investigate, not evidence that current systems already support them.

1. **Class identity:** female Rogue Bard; guitar, music-themed attacks, dance/music personality, glamorous/showy, deliberately “scumbag” battlefield trickster. She is neither especially powerful, tough, nor agile. Her special strength is inflicting misery through manipulation and control.
2. **Basic-attack charm:** ordinary basic attacks automatically carry a **chance** to charm an eligible opponent; successfully charmed monsters **join her company persistently**. This is her replacement for buying ordinary troops. Initial roster **empty**. Recruitment comes from enemy captures and the existing collectable boss pets.
3. **Ordinary troops forbidden:** Rogue cannot hire conventional Soldier or Archer/Ranger companions at either Captain or Barracks, including recruitment queues. This is a gameplay constraint, not just hiding a menu.
4. **Charisma advantage:** from the **beginning of the campaign**, Rogue has **one additional active companion slot relative to the equivalent Expedition stage**, despite beginning with zero companions. The owner called it access to a third companion from the start as an illustration of that advantage.
5. **Enemy eligibility:** ordinary, eligible monster species may be charmed. **Bosses, captains and Ringleaders are excluded**. Genuine hybrid combatants are *not committed*: possibly reuse pet-style behavior, but explicitly defer if complicated. Summoned or temporary enemies were not separately decided.
6. **Converted AI:** melee converts should follow the established **Soldier companion behavior**; ranged converts should follow the established **Archer companion behavior**, not continue running hostile AI. For an eligible ranged healer, player-side healing must follow **friendly companion healing and Alchemist training**, not its original enemy healing rules. Avoid duplicating companion engines.
7. **Converted statistics:** retain the identity and distinguishing native characteristics of the captured monster **and** adapt its growth to existing companion progression/inheritance. Exact treatment of initial HP, damage, armor, level, ranged/melee identity, and level normalization remains unresolved; the two instincts must be reconciled, not discarded.
8. **Death and recovery:** initial thought of permanent loss was **revised**: dead charmed companions should **be recoverable**, using ordinary company lifecycle. The objective is to avoid repeated travel and recapture chores.
9. **Barracks restraint:** owner specifically does not want unlimited monster storage. For **each enemy species**, combined active + reserve + fallen owned copies should be at most the Rogue's **current maximum active-companion capacity at her current Expedition progression**, including her class advantage. Example: if she can field four companions, she may own no more than four Goblin Slingers, across all roster states. Increasing Expedition raises the species bound. The larger aggregate Barracks limit needs a further decision; a species-only limit is not necessarily enough.
10. **Boss pets:** Rogue can still obtain collectible companions from defeating boss monsters through the existing pet system; does **not** charm bosses into party actors. The class-specific rules for Succession and previously collected pets are unresolved.
11. **Trap expertise:** detect/interact with and disable eligible existing traps. She may **place at least two varieties of trap**. Her traps should work against hostile monsters. Class should be the most irritating trap user without altering the world layout.
12. **Disruption:** frequently interrupt enemy spells or cast preparation, more conveniently/frequently than Mage Interrupt (without presuming permanent lockout or replacing the Mage's area Silence); Slow approaching or fleeing enemies; apply damage over time, reduced incoming healing, cooldown delays/debt and other annoying statuses; punish summons and attempts to escape.
13. **Summoning:** owner suggested she can summon as part of her trickster theme, but **did not decide what is summoned**, its lifetime, slot treatment, AI, or whether it is a combatant, decoy, or effect. Must not turn into a hidden second army.
14. **Endure passive:** upon lethal damage she can endure for **two seconds at one HP**, as a distinct class survival trick. Exact invulnerability/damage gating, follow-on death check, cooldown and interaction with recovery, boss hits, Succession, save/reload and current death flow remain **open**.
15. **Visual direction tentative:** attractive/darker-skinned woman with South Asian or Middle Eastern / Persian-inspired fantasy influences; owner floated sari-like draping, exposed hair and no hijab as one direction. These are exploratory character-design ideas, **not** a finalized cultural costume, portrait, sprite, palette, or animation brief. Keep expressive stylization compatible with current original-art canon and game scale.

## B. Assistant suggestions during brainstorming — NOT owner approvals

The initial response offered ideas that can be considered later but **must not** be implemented or treated as accepted class canon solely because the assistant wrote them:

- “Bard of Discord” subtitle; flavor quote, sample table of comparative class power and speculative class ratings.
- Named eight-skill kit: Cutting Chord, Off-Key Waltz, Heckler's Note, Rotten Serenade, Tripwire Tango, Sabotage Verse, Backup Dancers, Grand Finale. All names, slot numbers and **normal/charged effects are provisional examples**; the owner has not approved them.
- Target becoming easier to charm as it loses health and/or escalating “pity” chance after failed attempts. **Neither mechanic came from the owner.**
- Proposed cooldown length (e.g. around 90 seconds) for Endure and a possible auto-death-on-expiration rule. **No numerical cooldown or post-Endure outcome has been approved.**
- A temporary decoy or “backup dancer” unit, larger showpiece music fields, or a specific widening/charged charm attack. Owner suggested summoning but not these implementations.
- A proposed global monster roster limit, and stat normalization/anti-exploit formulas, are engineering recommendations to assess rather than owner-decided numerical policies.
- Any description of **dance animations, attack animations, animated poses, procedural character movement cycles, sprite frames or costume motion** is out of scope. These ideas were a mismatch with the existing static visual technology and the owner has expressly rejected that expansion.
- The earlier statement that Rogue summons/dances would introduce no cost or be easy is **not** a performance claim or accepted design.
- Male/female description should follow the owner's corrected decision: **female Rogue, female Mage, male Ranger, male Paladin**. Older ancillary descriptions or prototype legacy labels are not approval to change this intent.

## C. Questions explicitly reserved for later design review

These should be individually decided before coding, not answered by developer assumption:

- Basic hit charm probability and cooldown/suppression; what qualifies as a hit; auto targeting; eligibility if the roster is full; how early she recruits her first companion; whether damage threshold, escalating chance, or immunity applies.
- Which species/variants are eligible (night creatures, field guardians, dungeon guardians, ranged healers, hybrid species, special scripted enemies); summoned enemies default to **no eligibility pending review**.
- Is charmed species strength a fixed companion-normalized baseline with visual/species profile, a level-preserving base, or another method? How are progression HP/damage/armor, Companion Vitality, Shared Training, healing and Alchemist upgrades applied? Avoid hostile rank/TRUE/region multipliers leaking to allies.
- Are charm-converted monsters permanent across regions, transitions, death, game reloads and game phases? Owner's persistent-companion intent suggests yes; verify consequences.
- Does the per-species cap count a captured subtype by species alone or species+role variant (e.g. Goblin melee vs Goblin Slinger)? Owner example explicitly uses “Goblin Slinger”; precise roster key needed.
- What is the **total** monster reserve budget beyond the species quota? Keep the ordinary 200-saved-actors defensive maximum as an emergency bound, not a desired gameplay inventory.
- Can charmed monsters perform labor, carry tribute, use equipment, inherit skills and count toward quests? No blanket assumption. Recommended first release: ordinary **combat-only** companions pending explicit policy, to keep scope manageable.
- How is the bonus slot handled under Basic vs Full Barracks, Expedition, existing saves, and Succession changes to or from Rogue?
- Is trap disarm permanent, temporary, by trap instance, by cycle or until dungeon reset? What materials/cooldowns cost placing a trap? Can monsters trigger player traps while remaining immune to environmental traps?
- Which existing statuses adequately express damage-over-time, anti-healing and cooldown sabotage, and which need new bounded fields? What immune/exclusion mechanics do bosses and captains need?
- How does the two-second Endure interact with repeated lethal hits, death penalties, potions, healing, regeneration, interrupts, pauses, time skips and Succession?
- Where, if anywhere, should an additional summon exist in the eight-skill kit, and is it a visual/taunt decoy rather than an actual new AI actor?
- Equipment, talents, training, skill journal, combat diagnostics, tutorial/quest wording, bilingual localization, sound effects and class naming.
- Art direction, final silhouette, guitar model and outfit should be reviewed as one **static** hero design; do not commission animation production.

## D. Guardrails for all further work

- The fourth class is **opt-in new content**, not a retrofit or rebalance of Paladin/Mage/Ranger.
- **No runtime code, assets, save format, animations, AI or renderer has been changed by this documentation PR.**
- Preserve the active static sprite + procedural fallback pipeline; no new movement/attack/dance cycles, bones, skeleton rigs, frame atlases or 8-direction sheets.
- Reuse existing companion AI/formation/recovery/skill/safe-position systems where semantically safe; add a **small explicit conversion adapter** to protect allegiance and species identity.
- Honor existing mainline progression, quest logic, boss mechanics, traps, recovery, support healing, offline PWA, two renderers, English/Spanish and compatibility of version-4 historical saves.
- Performance is an **acceptance criterion**, not an assertion. Avoid per-frame charm rolls, unbounded actor creation, all-monster status scans, uncapped audio/visual effects and duplicate AI loops.
- Treat these documents as a recovery checkpoint for a later design session. **Do not start implementation, CI, merge or deployment on their authority.**
