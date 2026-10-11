# Item, equipment and inheritance integrity — pre-v0.9 fix pass

**Patch baseline:** v0.8.136 (branch `fix/pre-v09-item-equipment-integrity`).

This pass fixes provable inconsistencies in existing gameplay. It does not expand the item catalog, reintroduce retired combat potions, or substitute for the final v0.9 beta-readiness playthrough.

## Gameplay corrections

- **Preparation Tonic is personal.** It grants the consuming hero +10% maximum HP until rest or defeat and cannot stack. Neither Shared Strength nor any other companion inheritance may treat the tonic's temporary HP as permanent hero progression. The same boundary applies to future self-only consumables and temporary skill effects, including future party archetypes and multiplayer characters. Existing permanent discipline-training inheritance remains governed by Shared Training; equipment and permanent miscellaneous stat bonuses remain governed by Shared Strength.
- **Existing party catches up safely.** Active, reserve and fallen Soldiers/Archers must all retain the same maximum HP when the hero drinks, rests, dies with, or restores a tonic, even at Shared Strength rank 4. A fallen companion stays fallen. Previously saved characters with temporarily inflated companion HP are reconciled on load using the existing missing-HP-preserving synchronization.
- **Tonic limit matches save validation.** Up to 10,000 stored Preparation Tonics are permitted. An attempted additional purchase is rejected *before* spending crowns. Neri's action is disabled at that ceiling; the consumed active buff does not count as stored stock.
- **One activation rule.** Barracks use and the retained legacy `buyPotion('tonic', true)` API both call the same tonic effect function. Legacy calls remain supported for old tests and compatibility, but the current player-facing purchase flow is through Neri/Barracks.
- **Weapon selection persists.** Manually equipping a specific owned legacy weapon or the current tier is an explicit choice preserved across a v4 save/reload and Succession. Acquiring or reforging a new weapon tier returns to automatic best-weapon selection, as in prior behavior. Old saves without an explicit weapon choice use the historical best-weapon fallback.
- **Inventory reports real state.** It displays the actually equipped weapon, current weapon/armor reforge status, the number of stored tonics, and the hero-only active tonic state.

## Existing equipment contract retained

The four current tiers have no cumulative stacking. Each smith's weapon and armor upgrades replace the previous equipped tier; a reforge adds +5 power or +3 defense to its **current** tier only. Historical reforge flags remain recorded but don't affect a higher tier. Shared Strength inherits the hero's current effective weapon and armor bonuses according to its 25/50/75/100% rank, but not the personal tonic. The direct regression `tests/item-equipment-integrity.test.cjs` exercises tiers 1–4, previous-tier rejection, reforge limits, and active/reserve/fallen synchronization.

## Historical inventory classification

| Item family | Disposition |
| --- | --- |
| Preparation Tonic | Active modern consumable, hero-only, unstackable while active |
| Four weapon/armor tiers and their reforges | Active modern permanent upgrades |
| Six named older weapons (`legacyWeapons`) | v2 import/equipment compatibility; may be selected from modern Inventory when owned |
| v0.5 HP/MP consumables (`src/game.js`) | Historical only; retired in the current campaign in favor of Ranger Heal and optional Mana Recovery |
| `Tónico de las Cumbres`, `Éter de las Cumbres` | v0.5 instant-restoration shop goods, **not** modern Preparation Tonics |
| Ground drops (`s.loot`) | Crown rewards, not general item-slot drops |
| Expedition tribute/resource supplies | Campaign systems, not portable hero consumables |

The v0.5 gameplay source remains published separately as `legacy.html`, not as a second inventory implementation for the modern `index.html` campaign. Its catalog does not warrant automatic item reintroduction. Old discussion of automatic HP/MP potions in `docs/MECHANICS_AUDIT_V081.md` is historical, not current design authority.

## Regression and release criteria

The automatic suite must cover tonic anti-stacking, inventory persistence, cap enforcement, all equipment tiers/reforges, manual weapon equip/load, temporary-vs-permanent inheritance, reserve/fallen companions and Succession. The main release pipeline still must pass generated build/version consistency, format checks, Node tests, desktop/mobile browser testing and deployed Pages smoke verification. Human exploratory v0.9 playtesting remains a separate release gate.

This document records confirmed implementation decisions and test contracts, **not** a claim that every historic branch, item or manual gameplay path has been exhaustively audited.
