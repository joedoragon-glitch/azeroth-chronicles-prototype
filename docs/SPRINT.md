# Dormant sprint

Sprint is developed but **disabled and unavailable to players**. This supersedes the expansion design's earlier assumption that sprint would launch enabled. `src/sprint.js` contains the sole switch, `const SPRINT_ENABLED = false;`. Keep it false unless activation is explicitly requested. The game has no runtime toggle, URL override, unlock, or save setting for it.

With the switch false, Q remains unused, the keyboard action list excludes sprint, the stamina display and touch button stay hidden, no touch sprint handlers are registered, movement is unchanged, and save snapshots contain no sprint field. This code does not activate any other part of the proposed world expansion.

## Activate

1. Change `SPRINT_ENABLED` to `true` in `src/sprint.js`. The script must load before `controls.js`; it is already included in `index.html` and the offline cache.
2. Run `npm test`. Tests exercise the shipped disabled state and enable the feature only inside isolated test contexts. Never change the shipping flag to make tests pass.
3. Verify desktop Q, left touch hold/release/cancel, small phones and landscape. Check that the extra button and stamina text fit alongside the existing controls. Check Tab, ordered hero movement, cursor movement, menus, focus loss, exhaustion, ranger haste, reload, import, death, and dungeon transitions.
4. If releasing, update the control documentation: Q becomes sprint. Bump `CACHE_VERSION` in `sw.js` to a new unique value and run the existing browser checks before deployment. Keep the ordinary PWA update consent flow.

No other wiring is needed. To deactivate again, restore the same flag to false and bump the cache version for that release. Saves made while enabled remain loadable while disabled; their sprint state is ignored and is omitted on subsequent saves.

## Rules and tuning

Hold Q, or hold the left Esprintar button, while moving. Stamina capacity is 100, drain is 20 per active second, regeneration is 15 per second after a 1.5 second recovery delay, and sprint speed is 35 percent above ordinary movement. Walking never spends stamina. Holding sprint while stationary does not spend stamina. At exhaustion, release all held sprint inputs before sprinting again; stamina may recover while a button remains held without restarting sprint automatically.

Direct movement, touch movement and squad-ordered hero movement share the hero's sprint speed. In squad cursor control the hero must be selected and have movement orders. Sprint never speeds up the cursor or companions. Haste and sprint use the larger speed multiplier, not their product. Holding sprint still spends stamina while haste supplies the larger bonus.

Menus, pause and backgrounding freeze stamina clocks and clear sprint inputs through the existing movement reset. Death and region transitions clear inputs but preserve stamina and the recovery delay; they do not refill it. A new game fills stamina. Save/import validates stamina before changing the current game; older saves without sprint start at full stamina. Loading clears held input, so a saved exhaustion latch does not require a nonexistent physical key release. Offline time grants no recovery.

Constants live in `Sprint.tuning` in `src/sprint.js`. Changing capacity or delay also requires reviewing saved-value validation and the HUD denominator. The current balance values are provisional and require playtesting before activation.
