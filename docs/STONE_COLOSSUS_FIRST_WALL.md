# Stone Colossus — Kharun, the First Wall

> **Issue #242 | Isolated draft for owner review, not shipped or canon-approved.**
> Working alongside [#232](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/232) and [#251](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/251). This is a narrow character-and-cue pass, not a Mine or combat overhaul.

## Proposed beta biography (eight sentences)

Before he was the Stone Colossus, Kharun was an Ogre bastion-mason—the party's shield, siege-breaker and road-builder—who traveled with the hero now known as the Dark Lord. When a mountain gate collapsed on his companions, he bound a glowing heartstone to his chest and pulled the shattered cliff around his body, holding the roof until they escaped. His armored stone limbs, gold-lit eyes and diamond-shaped core were made by choice, not unearthed from an ancient creature. Patient, precise and dryly funny, he trusted his friend's promise that no companion would ever be abandoned. He helped fortify the Crown Peace but now doubts the friend who uses safety to excuse forced work and closed passages. Free to choose his own orders, Kharun now commands Ogre wardens and Wolf sentries from Colossus Mine, whose braced galleries and mineral exits he can close at will; Dara repairs its hauling machinery under guard. The Ridge Tyrant sets wages and mints crowns, but Kharun controls access and fortifications, not accounts. If the Dark Lord falls, the First Wall intends to build a realm of protected corridors and compulsory shelter: no one left outside, and no one permitted to walk unguarded.

## Character and political logic

- **Former class/party function:** Bastion (Ogre master mason, route-maker, shield and siege-breaker). Unlike a generic stone monster, Kharun understood tactical positioning and terrain before his transformation. He was the one who opened a pass when the party needed passage and held a gate when they needed safety.
- **Appearance and motive:** His own runic heartstone animates a deliberate shell of angular gray-green masonry. The already-drawn golden eyes and diamond-shaped luminous chest core are its face and heart; the repeated diamond marks in old and new Mine stone can be read as the same oath, carried into infrastructure. The old tunnels predate him. He does **not**.
- **Temperament:** Slow to anger, dry in conversation, exacting about load, distance and safe exits. He would rather force an opponent into a narrow approach than charge recklessly. His compassion is genuine and his error is chilling: he now believes everyone needs walls, whether they consent or not.
- **The former hero:** Kharun respected and cared for the companion who became the Dark Lord; his self-sacrifice helped bind the party together. He sees why the Crown Peace reduced violence and protected roads, but he now distrusts that ruler's use of forced labor. They coexist through tense necessity, not through a claim that the Dark Lord has magically enslaved his mind.
- **Why this Mine:** The Mine is a real operating source of ore, not a hidden tomb and not a second Treasury. The active receiving bay, quarry cuts, haulage loop, repair forge and guard routes remain. Kharun can deny the route into the galleries, brace a collapse or stop the mineral output at its source; his own Ogre builders and Wolf sentries give those choices teeth. The existing 18 guardians, traps, and forced repairs by Dara already make this tangible.
- **Division of authority:** Ridge Tyrant is the competent Master of Coin; he organizes production, wages, stamping and transport of crowns. Kharun is a defensive infrastructure power. The two need each other and could readily become rivals if central power collapses. No new currency or coin metal is selected here.
- **Credible successor:** If the Dark Lord dies, the Colossus need not inherit a royal seal. He can fortify every crossing, protect loyal caravans, deny rival armies ore and dictate which settlements may travel. That can keep civilians safe from raids—and turn the whole realm into an inescapable guarded refuge. This is a **threat and possible successor program**, not a forced alternate ending or a change to Awakening flags.

## Player-visible beta cues

1. **First Mine entry:** Existing one-time dungeon-lore messaging identifies the diamond oath on old stone and fresh supports; an Ogre guard order is signed by Kharun. The line contrasts Ridge's payroll with the Colossus's control of passage. This also works for existing saves that have never received a Mine lore message.
2. **Dara's existing cage/workbench interaction:** Her spoken context states that she repairs axles, tools and mine supports under guard and sees the Colossus's seal on route orders. Her rescue requires the original Mine key and continues to unlock the same equipment service independently.
3. **Already existing art:** The stone humanoid's gold-lit eyes and faceted breast core, diamond-shaped old-workings carvings, repairing/hauling scenes and Ogre/Wolf guardians are sufficient. This patch intentionally adds **no sprite**, no collision-bearing props and no migration flag.

## Combat vocabulary — retain five slots and proven timing

| Existing move | Character-readable behavior | Mechanical scope |
| --- | --- | --- |
| Stone Slam | Commits his whole defensive body; heartstone becomes exposed | Same circle, 1.6s warning, 2.5s core opening |
| Rockfall | Controls which approach lanes are unsafe, but leaves a navigable gap | Same three warnings/actual geometry; description only |
| Shockwave Rings | Pushes an expanding perimeter rather than chasing one target | Same ring timing, radius and visuals |
| Wall Rush | Commits like a moving gate; that commitment leaves his core vulnerable | Same warned lane, collision handling and unconditional 3s core opening |
| Stonebound Call | Signals Ogre wardens with an established battle plan | Same Ogre species, normal cap and six-unit TRUE warband |

Existing tactical AI already gives him **Quarry Shift** (shove) and **Faultline Brace** (telegraphed frontal sweep/knockback); they convey a route-controlling defender without new status effects or a bespoke combat phase. There is no justified need to risk telegraph, spacing, duration, damage or enemy AI changes for this beta-sized character pass. His exposed core is a deliberate tactical vulnerability, not a revised mechanical condition.

## Superseded lore and hard compatibility boundaries

**Rejected as active canon:** an ancient guardian accidentally exposed by mining, whose territory the regime avoids because it cannot control him. The term *older workings* and existing internal partition ID `ancient-threshold` refer only to real old masonry and stable zone geometry. They do not describe Kharun's origin. Earlier notes in `DECISIONS.md` and `IRONROOT_HIGHLANDS_LAYOUT.md` are explicitly marked superseded.

**Unchanged:** boss family and save key `mine`; Stone Colossus's visible boss name; 18 existing guardian positions/species/ranged behavior/reward rules; 18 original traps and routing; dungeon architecture and decor IDs; boss HP, levels, damage, drops and five mechanics; Normal, early-TRUE and Awakening scheduling; Dara's key/rescue/service; Ridge's field boss and Treasury; region routes, crowns and currency fields; historical save schema and PWA/sprite assets. Already-earned TRUE flags still count toward Awakening victory.

## Review gate / evidence policy

Owner review is for the **selected single biography**, not a request to reconsider multiple sketches. The focused `tests/colossus-biography.test.cjs` is designed to assert the lore appears in a real Campaign run, existing combat/stat contracts remain, the Mine rescue stays key-locked and saved state still restores, while existing Ironroot and Awakening suites cover route, hazard, warband and migration contracts. Report actual CI conclusions only after they run; do not infer browser screenshots or device success from static source checks. **No merge and no deployment from this PR.**
