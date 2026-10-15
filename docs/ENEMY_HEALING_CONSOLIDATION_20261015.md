# Enemy healing in the consolidated PR #308 update

The owner requested [PR #306](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/306) be included alongside #307 and the iPhone playtest fixes in #308. Source head `c8d0ee2e7cb9a9986c60166a454efc0b44b1add8` is retained as a merge parent/ancestor; the previous consolidated head is `8ce2ab193106638a7f3773fe5c7f06ab92e9c267`. #308 is the single acceptance/release target; do not merge the source PR separately. Runtime/cache version: dev.62.

## Imported behavior

Eligible ranged ordinary/hybrid/guard/summoned/Ringleader enemies use a species-specific restorative skill. It restores 5% of the living recipient's maximum HP over five seconds, multiplied once by the applicable regional/night/progression/species/Ringleader/TRUE layers, on the Archer's ten-second cooldown. Allies at or below 50% HP take priority before an eligible leader heals itself. Restoration cannot stack or resurrect; range, allegiance, encounter and line-of-sight gates remain authoritative.

Captains: Scornfang / Salvage Surge, Direjaw / Silt Pulse, Dreadmaw / Grafting. Bosses: Lifebinder / Reconstitution, Mirejaw / Baseflow, Drowned Keeper / Rebinding, Ridge Tyrant / Bailout, Veyrith / Wingman Rally. Existing boss self-recovery remains independent; eligible support does not add a duplicate self-heal to a boss with authored recovery.

Owners: `rules.js:enemySupportHealing`; existing Campaign support selection/scaling/tick methods in `engine.js`; encounter cleanup in `boss-combat.js`; snapshot/import cleanup in `save.js`. The imported non-healer equivalence adjustment and quick-suite registration are retained. Existing economy, rewards, hero skills and persistent v4 schema remain compatible.

## Reconciliation and procedural presentation

`combat-visuals.js` retains species/material-specific recovery particles, a brief healer-to-recipient link and ongoing recipient progress. `renderer.js` retains #308's separate actor captions, floor warning pass, Lantern Wraith lighting and ambient/track rendering. The conflicting old cue-after-actors call is superseded by #308's authorized ground-underlay/actor-caption split; healing does not restore the old obscuring warning layer. The existing optional helper calls remain safe for reduced rendering fixtures.

Procedural design owner and future adaptation record: `tools/sprites/design-handoffs/enemy-support-healing.json`. This integration preserves the authored effect; no raster generation, accepted new aesthetic or physical-device review is claimed. Stable creature IDs, source/recipient anchors, short lifetime, bounded ongoing indicators and no damage geometry must survive a later sprite/animation adaptation.

The PR #300, playtest, #307 passive and standalone #306 source receipts remain unchanged as historical records. A separate exact combined-source overlay identifies the six runtime owners changed by healing. The source-derived sprite-scope evidence is regenerated; no sprite registry or artwork is replaced.

## Actual evidence and remaining gate

Native focused `enemy-support-healing`, `snapshot-passive-completion` and `rogue-cast-continuity` regressions passed on the combined source. They cover the healing roster/scaling/selection/cooldown/ticks/save cleanup, Normal/TRUE passive and companion matrix, and prior cast clocks/Slow/circle/save/warning behavior. The native phone renderer also passed an actual queued healing-event/status draw with the retained warning/caption layers and save-purity assertion. Changed runtime files are locally formatted; version/cache outputs are regenerated together.

Full integrated Node/browser/device validation remains deferred by the owner. The old dev.60 green run certifies only the historical playtest head, not this expanded candidate. The separate existing #306 run is not proof for #308. No GitHub Actions are initiated for this consolidation; the publication commit uses `[skip ci]` and workflow/release gates remain unchanged. Nothing is merged into main or deployed. Continue additional updates and final owner-approved acceptance in #308.
