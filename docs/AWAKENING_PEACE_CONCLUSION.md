# Awakening and the Crown Peace — beta conclusion (issue #248)

## Story decision: there was peace; it was not freedom

The Dark Lord was once a player-controlled hero. When that controlling player left, he and the five adventurers who followed him became their own people. Their campaign had also left casualties, rival species and devastated communities behind. He brought the five regions under one rule, stopped generations of violence, protected trade and bridges, and made a common currency circulate. Those achievements were genuine. So were the tribute, forced work, detention and restrictions used to keep that order.

The five dungeon bosses are **the old party**, not five arbitrary strong enemies. Each holds a different means of imposing the same peace after the Dark Lord is defeated:

| Dungeon / persistent family | Successor's remaining foundation | Meaning of a TRUE victory |
| --- | --- | --- |
| Forest Crypt / `crypt`: **Lifebinder** (name currently staged in unmerged draft #230) | Binding the dying/dead to continued undead existence; a population and potential army with no normal mortal limit | No single binder can conscript the dead into a replacement empire |
| Sunken Archive / `archive`: **Drowned Keeper** | Recorded knowledge, counsel and the capacity to shape what later rulers believe and administer | No keeper can monopolize the realm's memory as grounds for a new Crown |
| Colossus Mine / `mine`: **Stone Colossus** | Control of stone, extraction and the labor/structures on which crossings and fortified roads depend; **not** the mint or the Master of Coin | No single figure can turn essential stoneworks into enforced obedience |
| Abyss Bastion / `abyss`: **Abyss Dragon** | The ruler's formerly flown purple companion-mount, riders, hatchery and a **still unfinished** aerial project | No successor can convert that emerging aerial reach into unchecked dominion |
| Citadel of Ashes / `citadel`: **Ash Sentinel** | Muster, command discipline and the continuity of Crown military orders | No commander can simply inherit the soldiers and turn the Citadel into a second throne |

This is a **bounded synthesis for #248**, not an override of character-ticket authorship. The Lifebinder's life-binding, the Keeper's Archive, the Dragon's personal-mount/unfinished-air-program canon and the five family IDs are established directions. The Colossus's former-adventure biography and exact authority are pending #242; its rejected ancient-accidental-guardian backstory is **not** defended here. The Dragon's motives and independent ambitions are pending #243. The Sentinel's origin and precise legal/military identity are pending #244. The Dark Lord's historical class, former government, proposed sixth former companion and current hero's ancestry remain open #233/#234 questions. None is declared canon by this ending.

## What defeating the five changes

The TRUE victories break *personal succession*: each surviving companion could rally some combination of armies, dependents, monopoly rights, records or air power around the old coercive bargain. Defeating each one removes that claimant's power to enforce a new universal order; **it does not magically demolish a road, erase the Archive, unmint the crowns or end every local dispute**.

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
