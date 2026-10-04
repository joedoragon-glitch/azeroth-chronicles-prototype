# Azeroth Chronicles — prototype

First checkpoint of the original author's HTML game, shared by Joel. The name and graphics remain provisional.

## Current checkpoint: v0.2

Open `index.html` in a desktop browser. The game has no external asset or styling dependencies. Press **H** for instructions.

The current loop is: accept the village mission → defeat ordinary enemies and collect gold → return for the reward → buy equipment and train abilities → challenge the boss.

Repairs cover weapon bonuses, targeting, resource spending, upgrade scaling, quest rewards, level progression, projectile processing, movement, scenery collisions, pauses and respawn timers. The village acts as a refuge. The boss announces an area attack that can be dodged or shielded.

Local saves are stored in the browser. Export/import transfers saves between copies or devices; browser storage is not cloud synchronization.

## Controls

- WASD: move; E: interact or target.
- 1 / Space: sword; 2: fireball; 3: heal; 4: immunity; 5: area attack.
- I/B: inventory; C: talents; K: abilities; T: mission; M: map.
- P: pause; H: help; Escape: close menu.
- Menus pause the simulation and support mouse or keyboard selection.

## Verification

Run `npm test` or `node tests/game.test.cjs`. No dependencies need installation.

The 32 checks exercise the game logic with a lightweight DOM/canvas substitute, including a mission-to-boss scenario and save recovery. They are not a visual browser test or a device playtest.

## Next iteration

Add mobile touch controls, a responsive mobile layout, an app manifest and offline service worker, then publish an HTTPS version that can be installed on Chromebook and supported mobile browsers. This checkpoint is not yet the installable mobile app.
