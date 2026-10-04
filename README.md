# Azeroth Chronicles — prototype v0.3

A small RPG made by the original author with Gemini, then repaired and adapted for Chromebook and mobile with Joel. The title, emoji art and story remain provisional.

## Play and install

Once GitHub Pages is enabled and deployment succeeds, open:

**https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/**

On Chromebook or Android, use Chrome's install option, or **Menu → Instalar aplicación** when that button is available. On iPhone/iPad, use Safari **Share → Add to Home Screen**. This is an installable web app (PWA); it opens in its own app window. An APK or app-store package is not included.

Open the app with internet once and wait for the menu to report that offline mode is ready. After that, the game assets work offline. Updates wait for **Menu → Actualizar aplicación** so they do not interrupt combat.

**Repository owner: one-time hosting setup.** Open **Settings → Pages → Build and deployment → Source → GitHub Actions**. The deployment workflow is already included. If the first deployment ran before enabling Pages, re-run the failed job under **Actions → Test and deploy app**.

## The playable loop

Talk to the village commander → accept the mission → defeat five ordinary enemies and collect gold → return to claim the reward → buy and equip a better weapon, train abilities and spend talent points → challenge the boss.

The village is a safe refuge that restores health and mana. Ordinary enemies respawn after eight seconds of game time, so the five-kill mission is possible with four ordinary spawn points. Menus, pause and backgrounding freeze combat and respawn timers. The boss's red circle announces an attack: leave the circle or use the shield.

## Controls

**Guía breve en español para el autor y los jugadores: [CONTROLES.md](CONTROLES.md).** The prototype's keyboard design prioritizes the left hand. The mobile touch layout remains unchanged in v0.3.2.

- **Touch:** drag the left joystick; tap the five abilities on the right. Hold **Espada** to repeat attacks at the normal cooldown. **Interactuar** talks, collects gold or selects a nearby enemy. **☰** opens all menus. Movement and combat support simultaneous fingers.
- **Keyboard defaults:** WASD moves; 1–5 cast the five abilities; E/F interacts. In menus, WASD selects and F/E confirms. Q opens the menu or returns to it; R inventory, C talents, X ability book, T quest, Z map, V pause, G help. Older shortcuts (I/B, K, M, P, H, Enter/Space, Escape) remain available.
- Menus support touch, mouse and keyboard. **Menu → Mostrar/Ocultar controles táctiles** overrides automatic touch detection on hybrid Chromebooks.

## Saves

Automatic local saves run every five seconds and when leaving the app. v0.2 save exports remain compatible. **Exportar partida / Importar partida** moves progress between browsers or devices. Browser storage is local, not cloud synchronization. A downloaded HTML copy and the hosted app have different storage locations; export from the old copy and import in the app.

## Development

No framework, build step or runtime dependencies. Node 20+ runs the logic tests:

```sh
npm test
python3 -m http.server 8000
```

Open `http://localhost:8000` for development. Serve the folder over HTTP; opening `index.html` as a local file is not the installation/offline workflow.

| File | Purpose |
| --- | --- |
| `index.html` | Spanish UI and menus |
| `src/game.js` | Game data, rules, input, simulation, drawing and saves |
| `src/controls.js` | Left-hand keyboard defaults and saved key bindings |
| `src/app.js` | Touch input, app installation and update UI |
| `styles/game.css`, `styles/app.css` | Base theme and responsive app layout |
| `manifest.webmanifest`, `icons/` | App identity and installation icons |
| `sw.js` | Offline asset cache; bump `CACHE_VERSION` when changing app assets |
| `tests/` | Gameplay, touch, offline and browser regression checks |
| `.github/workflows/pages.yml` | Tests, then GitHub Pages deployment |

## Verification and scope

55 automated logic checks cover gameplay/keyboard (41), app behavior (8) and offline caching (6). These use controlled DOM/canvas and service-worker substitutes. The full mission-to-boss simulation also runs with actual cooldowns, mana, incoming damage and respawns. Keyboard checks cover simultaneous movement/casting, menu actions, remapping, conflict rejection, reload persistence and reset. These checks verify rules; device feel still needs playtesting.

CI also runs Chromium checks at desktop, Chromebook-touch, phone portrait, small-phone and landscape sizes before deployment. To run those locally, install Playwright 1.62.1 and its Chromium browser, then run `node tests/browser.test.cjs`. Browser screenshots are saved as CI artifacts.

Repairs include non-stacking equipment bonuses, target/range validation before spending mana, consistent potion values, upgrade scaling, one-time quest rewards, multiple level-ups, stable movement/friction, scenery collisions, safe projectile processing, pauses, respawns and validated save imports. v0.3 adds two-thumb controls, compact portrait/landscape layouts, install metadata and offline support. The repaired v0.2 checkpoint is preserved in Git history.

## RTS control laboratory (v0.4)

Open [the RTS prototype](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/rts.html), or choose **Probar RTS · mano izquierda** in the RPG menu. The RPG remains available with its own save.

The RTS has a paladin, workers and recruitable soldiers, two towns, resource gathering, barracks, weapon upgrades, stronger frontier enemies, a skeleton captain and the distant dark lord fortress. Forest scenery, rock barriers and a river with two bridges give the army a route across the map. A minimap shows the whole field. Trees are decorative; rocks and water block movement and units plan paths through the bridges.

Move the cursor with the **left joystick**. **Double-tap the left selection pad** to select under the cursor (one tap does not select). Toggle additive selection or select the whole group with the left buttons. The sole right button gives contextual orders: move, gather, resume building, or attack. Hold the joystick with one thumb while using the right order button. Moving the cursor to the field edge scrolls the camera. Cursor speed is adjustable in the left menu.

Keyboard: WASD cursor, E select, F order, 1 all units, 2 construct / recruit / NPC service, 3 stop, Q menu. Custom bindings use the corresponding RPG actions. Mouse left-click selects and right-click orders. The simulation pauses in menus and when the app loses focus. Progress saves locally every five seconds; reopening safely stops previous orders. Restart affects only the RTS save.

This is a small playable control experiment, without multiplayer, extensive art, or a finished campaign. Its purpose is to test comfort and gameplay, not establish a causal claim about which hand makes games commercially successful.

## RPG feedback in v0.4

Choose Paladin, Frost Mage or Ranger in the opening help before starting a new RPG save. Each has its own starter weapon and different skills: melee healing/invulnerability, ranged frost/mana recovery, or bow double shots/bandages/haste. The sixth power uses right-click or its touch button, costs 50 mana and has a 90-second cooldown. It is never required to hold the mouse. Older saves retain Paladin and are migrated safely. Changing classes requires a new RPG game; the RTS save is independent.

The RPG now has a persistent upper-right minimap and desktop session tools in the lower-right. The latest author feedback supersedes v0.3.2: player key rebinding has been removed, and previously saved key preferences are ignored. WASD, 1–5, E/F and left-side menu keys remain fixed, with legacy shortcuts retained.
