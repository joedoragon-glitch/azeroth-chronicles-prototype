# Awakening and the Crown Peace — beta conclusion (issue #248)

## Story decision: there was peace; it was not freedom

The Dark Lord was once a player-controlled hero. When that controlling player left, he and the five adventurers who followed him became their own people. Their campaign had also left casualties, rival species and devastated communities behind. He brought the five regions under one rule, stopped generations of violence, protected trade and bridges, and made a common currency circulate. Those achievements were genuine. So were the tribute, forced work, detention and restrictions used to keep that order.

The five dungeon bosses are **the old party**, not five arbitrary strong enemies. Each holds a different means of imposing the same peace after the Dark Lord is defeated:

| Dungeon / persistent family | Successor's remaining foundation | Meaning of a TRUE victory |
| --- | --- | --- |
| Forest Crypt / `crypt`: **Lifebinder** (oathwright identity proposed in draft #258) | Preserving incomplete undead continuity and tending memorial anchors; an autonomous community of bound people whose gratitude could become a successor's following | The oathwright cannot turn stewardship, memory of the dead or willing loyalty into unquestioned sovereignty; **binding itself never grants obedience** |
| Sunken Archive / `archive`: **Drowned Keeper** | Recorded knowledge, counsel and the capacity to shape what later rulers believe and administer | No keeper can monopolize the realm's memory as grounds for a new Crown |
| Colossus Mine / `mine`: **Stone Colossus** (**Kharun**, proposed #253) | An Ogre defender who chose a heartstone body; his wardens and command of mine galleries, guarded passes and fortifications could impose *compulsory shelter*. The Ridge Tyrant, **not Kharun**, runs wages and crowns. | No one defender can seal essential passageways and call confinement protection for everyone |
| Abyss Bastion / `abyss`: **Abyss Dragon** (**Veyrith**, proposed #254) | Voluntary aerial pathfinder and old friend, still the purple personal flown mount; his instructors, nest routes, landing permissions and **unfinished** air-force could become coercive flight clearance | No dragon can make safe return routes and access to the skies conditional on obedience to a new sovereign |
| Citadel of Ashes / `citadel`: **Ash Sentinel** (**Marshal Veyra**, proposed #255) | A cinder-sealed living Vanguard; officer loyalty and Citadel command descended from a voluntary multispecies muster now operating by forced levies | No commander can convert the shared army's protective origin into permanent compulsory service |

This is a **bounded synthesis for #248**, not an override of character-ticket authorship. The Lifebinder's life-binding, the Keeper's Archive, the Dragon's purple personal-mount/unfinished-air-program canon and all five family IDs are established *directions*. The newly opened, still **unmerged/unapproved** character PRs provide sharper *candidates*: [#258](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/258) proposes the oathwright Lifebinder with **autonomous** bound dead; [#253](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/253) proposes Kharun's deliberately adopted stone body, replacing the expressly rejected ancient-accidental-guardian story; [#254](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/254) proposes Veyrith's air-navigation convictions; [#255](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/255) proposes Marshal Veyra's living cinder-sealed identity and the Citadel's shift from voluntary muster to coerced army. [#252](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/252) proposes the Dark Lord's six-signature Victory ledger and Archive clue. These sketches support five **different** succession claims, but none is treated as already shipped or owner-accepted by this draft. The Dark Lord's historical class, previous government, speculative sixth companion and current hero's ancestry remain open.

## What defeating the five changes

The TRUE victories break *personal succession*: each surviving companion could rally a distinctive coalition around the old coercive bargain, whether through grateful bound people, records, protected passages, landing clearances or a standing army. Defeat breaks **that claimant's personal ability to enforce universal obedience**; it does not erase their people's agency, demolish roads, destroy the Archive, unmint the crowns, ban all flight or settle every local dispute. An undead person need not vanish with their binder or lose the right to choose their own work and loyalties.

The old peace is not an illusion: generations of neighbors have already learned to use the same ferries, markets, repair roads, refugee sites and common currency. When no warlord can claim the whole infrastructure, local inhabitants have an immediate practical reason to keep those shared services working. They now continue them by ordinary cooperation, not because the fortress ordered it. The postgame neutral residents in the Citadel, the Archive, Mine, Bastion, Crypt, side interiors and recovered Treasuries make this visible without a new diplomacy or government mechanic. Such peace remains **chosen and fallible**, not a permanent magical pacification of their wills.

The abandoned-player conceit receives one last quiet echo: the present hero may someday be tempted by the empty throne, but no option, compulsory coronation or sixth boss is added. The player is trusted to notice the resemblance.

## Player-facing conclusion

> The Dark Lord ended the old wars. He also left five former companions able to enforce his peace after his death. Their claims are broken now.
>
> The bridges stand; ferries still run. Crowns pass between people and creatures who once fought one another. They keep the roads open without a command from the Citadel.
>
> In its audience hall, someone has placed a plain chair beside the empty throne, for any traveler who wishes to speak.
>
> You could sit in either. No voice tells you which.

The existing `Peace for everyone` dialog and its continue/Nightmare/export actions remain. The Awakening checklist states that **only missing TRUE victories** remain. No branch, quest or level system was added.

## Engine contract and narrowly targeted fix

- Source: `src/prototype/engine.js`, `src/prototype/world.js`, `src/prototype/save.js`, and `src/prototype/app.js`.
- `s.true.darklord && dungeonIds.every(id => s.true[id])` remains the **only** peace gate. `dungeonIds` is derived from the five `kind: 'dungeon'` records, not the field bosses. The five prior TRUE results survive across saves; `s.late` only records TRUE wins earned during Awakening. No five-new-fights requirement.
- `awaken()` still fixes the remaining guardian/boss level to the captured victorious tier and grants pending TRUE access for defeated normal dungeons. It now reports the **actual remaining** companion count instead of falsely announcing that all five rose again. All five pre-earned TRUE flags transition immediately to peace.
- `checkEnding()` still clears pending fights, traps/projectiles, harmful quest objectives and instantiated enemies. `makeHabitat()` still retains the neutral outdoor field bosses. Outdoor areas preserve their established populations; major dungeons receive six nonhostile occupants, side rooms five and Treasuries four. Interior visitors deliberately include species from neighboring regions. Traps remain inactive in peace. These are low-stat, non-rewarding neutral scene actors, not new AI or trade systems.
- **Confirmed gap repaired:** new Treasury and side-dungeon `zone()` creation returned early before calling `makeHabitat()`. Both now populate as peaceful on their first post-ending visit. Historical peaceful Treasury saves with `habitat: true` but empty occupants gain residents on reentry. No rescue, cache, trap-coordinate, travel, player-class, combat, save-schema or boss-family migration was rewritten.
- The `checkEnding()` and `makeHabitat()` path is in the existing campaign; the conclusion changes only player-facing prose. Field enemies in peace remain neutral and cannot attack or be attacked under the existing targeting rules. Post-ending scavenging and already-freed specialists remain intact.

## Verification scope and ownership

New `tests/peace-shared-world.test.cjs` covers all defined region, great-dungeon, Treasury and side-dungeon IDs, three hero classes, Normal and Nightmare, old TRUE credits, reloads, quest closure, no traps, residents not harming the hero and both historical interior gaps. Existing `tests/ending-matrix.test.cjs` covers 1,024 early/late combination states; `tests/awakening-anchor.test.cjs` covers fixed-tier combats, legacy Awakening restores and Succession. Existing beta historical/PWA/browser checks remain the release gate.

**PR disposition:** isolated draft, no merge/deployment. If CI fails or representative phone/desktop visual observation disputes the room composition, keep the PR unmerged and revise only the affected slice. This ticket does not pre-approve #233/#237/#242/#243/#244's biography patches or draft #230's unfinished combat work.
