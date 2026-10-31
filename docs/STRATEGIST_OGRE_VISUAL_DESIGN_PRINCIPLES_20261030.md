# Fifth-class Strategist — Ogre hero visual design principles

**Status:** Owner-approved **high-level character direction** (30 October 2026); **visual design brief only**. Final character art, animation, specific costume details, sprite production, implementation and release are **not approved or completed by this note**. Active class gameplay planning remains in [Strategist #674](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/674).

## Core decision: an existing Ogre, trained as a hero

The fifth playable class, provisionally called **Strategist**, is to be represented by an **Ogre hero**. **Ogres already exist in the game.** This is an adaptation of the established species design to a playable, resourceful, alchemy-informed combat specialist—not a new species, a replacement Ogre race design, a new Ogre captain or boss, or an excuse to rebuild the creature roster.

**Primary principle:** *An unmistakable in-world Ogre who has developed a distinctive, intelligent, unconventional method of fighting.* The originality comes from personality, training, movement, equipment and how the Ogre applies knowledge—not from making him look biologically unrelated to the Ogres already encountered in Ironroot and other game contexts.

## Start with existing visual canon, not the new illustration

- **Reuse the Ogre anatomical vocabulary.** Current art direction describes a broad, heavy, rounded humanoid with muted tan/olive skin, paired tusks, expressive brows/eyes/nose, substantial hands, and believable organic joints and folds. Preserve recognizable facial proportions and family resemblance before adding a hero loadout. Avoid newly invented horns, tattoos or ancestry features.
- **Respect established Ogre variants.** Existing Ogre melee, stone-thrower, guard, Ringleader and Crown ancestry variants prove that a shared Ogre body can carry distinct roles without ceasing to be an Ogre. The new hero is another deliberate role-specific adaptation, not a wholesale replacement of those bodies.
- **A hero is not a scaled enemy sprite.** Translate the body to the game's actual playable character framing, animations and equipment presentation so the hero reads as playable and nimble **relative to an Ogre**, while still visibly heavy and powerful. Do not casually carry enemy dimensions, hitboxes or combat targeting into the hero.
- **Honor the current game's art language.** The elaborate chat concept illustration is **directional inspiration only**, not approved final art, a production sprite, a literal equipment list, or a promise that the game can display that level of surface detail. Simplify shapes for clear readability at native play size and zoom; retain texture only where it materially improves the silhouette or action.

### What makes this Ogre the Strategist

1. **Intelligence in posture and expression.** Observant, deliberate, analytical and poised; his body language should communicate anticipation and precision rather than the default charging brute. His intelligence should not be represented by making his face less Ogre-like.
2. **Alchemy through believable field equipment.** A compact, practical working kit—select visible reagent containers, tools, protected storage and materials suited to handling water, earth and fire. Alchemy is knowledge of actual materials and reactions, **not unrestricted spellcasting or floating elemental ornaments**. Design only the equipment that serves the finally selected skills.
3. **Assassin influence without copying the Rogue.** Small, accessible weapons, opportunistic footwork, preparation and precise close-quarters execution suggest a dangerous saboteur. The current gameplay discussion favors **dual daggers** and quick individual strikes; do not silently replace them with the concept image's oversized alchemical cleaver. He does **not** inherit Rogue Bard Charm, music, or a generic stealth fantasy.
4. **Aikido-inspired redirection.** The signature physical story is entering danger, reading an incoming attack, and turning its force back on its source. His motion, stance, timing and action feedback should be recognizable even when a dramatic effect is simplified. Exact reversal rules and eligibility belong to the gameplay spec in #674, not to an illustration.
5. **Functional loadout rather than prop overload.** A few legible alchemical identifiers, restrained asymmetry, reliable sheaths and a coherent working silhouette are preferable to dozens of tiny bottles, impractical hanging weapons or straps that obscure anatomy. Maintain believable freedom of arm and torso motion.
6. **An Ogre's strength applied differently.** Preserve mass, reach and weight as visual characteristics; communicate that he survives by foresight and movement rather than defaulting to a tank, giant weapon bruiser or another form of Garun's Stone Colossus.

## Production translation and acceptance checks (future work)

- Begin from the **actual current Ogre renderer/body and accepted design references**, then create a distinct **hero-class visual variant**, not new world-species anatomy. Avoid modifying enemy Ogre art while producing the hero.
- Establish a readable small-scale silhouette: **Ogre face/tusks + compact tactical kit + paired daggers/quick-hand identity**. Fine glassware, minute buckles and photoreal materials may be reduced or omitted if illegible.
- Check idle, walking, attacks, combat reaction/reversal, alchemy casts and equipment overlap in both actual Canvas and Pixi render paths where relevant. Review desktop and phone at native camera zoom, including **150%** visual review; preserve visibility in crowded combat and under reduced-effect settings. These are **future validation gates**, not claims of tested behavior.
- Do not invent gameplay through art: visible fire/water/earth props do not prove an interactive surface or implement a skill. Rely on the real context and combat owners defined in #674.
- If an actual sprite/art production request follows, create the appropriate persistent design-handoff record using [the design-to-sprite workflow](DESIGN_TO_SPRITE_WORKFLOW.md), with accepted source references and explicit concept/art/release statuses. **This brief is not an asset-registration or sprite-generation authorization.**

## Authority and references

**Confirmed from the owner here:** fifth class is an Ogre; adapt the already existing species into a distinct Strategist hero with the class's alchemy/assassin/analytical identity; do not reinvent the species or pursue artwork far beyond what the current game can faithfully use.

**Gameplay direction, still being developed:** [Strategist tracking issue #674](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/674). In particular, the evolving Water/Earth/Fire starter ideas, dual-dagger combat, contextual counter, training and dodge/speed proposals have their own approval and testing boundaries.

**Visual source-of-truth pointers:** `src/prototype/visuals.js` Ogre body; `tools/sprites/design-handoffs/ogre-body-aesthetic.json`; `tools/sprites/design-handoffs/approved-art-enemy-ogre.json`; `tools/sprites/design-handoffs/approved-art-crown-troop-ogre-guard.json`; [design-to-sprite workflow](DESIGN_TO_SPRITE_WORKFLOW.md). Historical design-handoff entries describe the status of their *own* art passes; this new document does not upgrade their production/release states.
