# Session menu timing and interaction validity

## Approved behavior

Single-player keeps its existing behavior: opening a menu, explicitly pausing, or losing focus freezes the local world. Cooperative sessions keep the world running while a player's menu, local control pause, or focus loss blocks that player's gameplay input. Keyboard/touch menu navigation continues at normal speed and cannot move the hero. The same runtime policy applies to both desktop and phone.

This release is the menu/session foundation, not online multiplayer. There is no Join/Host UI, second player, network transport, server authority or shared-session serializer yet. Do not advertise a working cooperative mode or add a menu button that merely changes the policy. The future successful cooperative-session selection/connection calls `Prototype.setSessionMode('cooperative')`; leaving calls `Prototype.setSessionMode('single-player')`. Selection immediately clears local pause/input and closes the current menu. Session mode is transient and never changes a v4 save or profile. Unknown modes reject without changing the current mode.

`session.js` owns the distinction between `worldPaused` and `inputBlocked`. `app.js` uses world timing for simulation, sprite/effect advancement and redraw scheduling, and uses input blocking for movement. The existing single-player charge, combat, AI, progression, economy and geometry rules remain intact. World callbacks still run locally: a browser hosting a future session requires an independent authoritative scheduling/transport solution. Removing the shell's explicit hidden-page freeze in cooperative policy does not defeat browser background throttling or mobile suspension.

A future host-controlled combat slowdown is a separate feature. The agreed direction is normal-speed menus and a shared slowed simulation when a menu is opened during combat, without retroactively slowing a menu opened before combat. No arbitrary slowdown factor, automatic slowdown or audio-pitch change is introduced here.

## Location-specific dialogs

Opening an NPC or Barracks interaction captures the current Campaign instance, controlled actor, zone, transient entry epoch, death count, and service ID/kind. Every nested service dialog inherits that location, including synthetic rescued specialists accessed through a Barracks. Opening the global Adventure/Character path drops that location dependency.

Each frame checks the lease before simulation, and again after a running simulation step. Each action and Back navigation also checks it synchronously; actions from a replaced or closed dialog cannot run even before the next frame. Successful zone entry increments `Campaign.interactionEpoch` outside saved state, so leaving and returning to the same zone cannot revive an old dialog. The source must still be available and within the existing 115-world-unit interaction distance. Death, actor replacement, campaign replacement, travel, disappearance of an NPC/Barracks or leaving service range closes the local dialog.

Global inventory, talents and quest-journal menus have no location dependency and may stay open through travel. Existing domain methods remain responsible for rechecking prices, funds, ranks, unlocks and availability at execution; the menu's old affordability label is not authority. A future multiplayer command handler must enforce these validations on the host as well; client-side leases are not an anti-cheat system.

Cooperative policy does not write autosaves into single-player's `azeroth-v4-*` keys. Local Save/Export save, Import, New game and Load other mode are unavailable under this policy; reports remain available. Async import rechecks the session after reading the file. Actual shared persistence belongs to the future host/session adapter, not the existing cleaned-up v4 backup serializer.

## Verification

- `tests/session-policy.test.cjs`: timing policies, save equivalence, mode rejection, service distance/availability, refresh, travel away/back, same-zone entry, death, Campaign/actor replacement and Barracks location.
- `tests/prototype-ui.test.cjs`: existing single-player menu/input behavior and cooperative joystick/navigation isolation using the actual shell frame callback.
- `tests/session-menus-browser.test.cjs`: actual desktop, minimum portrait phone and landscape phone controls; single-player freeze, cooperative world progression and combat, local control pause, money revalidation, stale shop/Barracks/transport actions, death and local-save protection. Chromium/WebKit gates run this suite in PR/main CI; deployed Chromium checks run it against the published build.

The browser tests exercise cooperative **policy** on the current one-hero Campaign. They do not establish two-player networking, synchronization, independent progression or shared team implementation.
