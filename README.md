# Azeroth Chronicles — prototype v0.5

One hero-led adventure combining RPG progression and RTS squad commands. The original author’s emoji style and three provisional classes remain. Hero and companions share the world, encounters, dungeons and one save.

## Play

Open https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/ . The old `rts.html` link redirects here.

Install from Chrome on Chromebook/Android, or Safari → Share → Add to Home Screen on iPhone/iPad. Open once online to prepare the offline cache. Existing installs can use **Actualizar aplicación** in the menu. This is a PWA, without an APK or store package.

## Left-hand controls

WASD moves the hero. **Tab** switches between direct movement and the squad cursor; it changes controls within the same adventure. In cursor control, **E** selects, **F** gives contextual move/attack/gather/interact orders, and **backtick (`)** selects the hero and all living companions. **C** builds a barracks with a selected worker (120 gold); **R** trains a soldier at the barracks under the cursor (60 gold).

**1–5** cast regular powers; **Space** casts the frequent sixth power (10 mana / 4 seconds); **left Shift** casts the seventh (60 mana / 90 seconds); **B** casts the eighth (60 mana / 120 seconds). Powers remain available while commanding the squad. Mouse clicks are optional shortcuts: powers 7/8 in direct control, select/order in cursor control. No mouse is required.

**Escape** opens the menu or goes back; **Q is unused**. In direct control: R inventory, C talents, X spellbook, T quest, Z map, V pause, G help. Menus use WASD and E/F to buy, equip, train or accept quests. I/K/M/P/H remain legacy menu shortcuts. Controls are fixed; browser Ctrl/Alt/Meta shortcuts still work.

On mobile, the joystick, all eight powers, selection, group commands and interaction are on the **left**. Switch to Órdenes to steer the cursor; double-tap Seleccionar, then use Ordenar. In menus, use the same joystick and the left Confirmar/Volver buttons. Hold the basic attack for repeated attacks. Touch controls can be shown/hidden on hybrid Chromebooks.

## Shared adventure and strategy

Start with a soldier and worker. Companions follow and defend the hero; explicit orders direct them independently. Recruit at refuges through Escuadrón y órdenes or the starting captain. The limit is **six living companions**, including queued recruits. Recover fallen companions at a refuge for 40 gold. Workers gather finite wood, ore and crystals, returning them to a settlement as gold. Build up to four barracks in the outdoor world. Everyone travels with the hero into dungeons.

Accept the commander’s mission, defeat five ordinary enemies and claim the reward. Explore the 4200×4200 world, its forests, paved settlements and distant Dark Lord’s fortress. The starting town, frontier and summit are refuges. Z labels entrances, settlements and teachers.

Training progresses through three teachers: starting village caps ranks at **2**, frontier at **5**, summit at **8**. Each explains their limit and where to continue. Later settlements offer stronger equipment and expedition quests; frontier quests lead to the crypt/mine, summit quests to the bastion/citadel. No extra classes or lengthy story have been added.

| Dungeon | Recommended level | Encounters | Completion reward |
| --- | --- | --- | --- |
| Cripta del Bosque | 3 | Three skeletons and a guardian | 100 gold + 150 XP |
| Mina de los Colosos | 6 | Three ogres and a stone colossus | 220 gold + 400 XP |
| Bastión del Abismo | 10 | Three spectres and an abyss dragon | 450 gold + 1000 XP |
| Ciudadela de las Cenizas | 15 | Three custodians and an armored sentinel | 900 gold + 2400 XP |

Enter/exit with E/F near the portal/door. Levels are recommendations. Traps warn in amber before a brief red damage pulse; a pulse removes a fraction of maximum health, never a full health bar. Pillars constrain movement, and boss attacks show their area before landing. The citadel sentinel opens its armor briefly after each slam; a one-use fountain becomes available after defeating its custodians and restores 60% health/mana, including living companions’ health. Prepare with advanced training, equipment and consumables.

Defeated dungeon enemies stay defeated across reloads. Completion rewards pay once after all four enemies die. Living enemies recover when leaving/re-entering. Falling returns the party to the starting town; fallen companions require recovery. Outdoor enemies and the Dark Lord respawn in game time. Menus and backgrounding pause combat, queues, cooldowns and trap clocks.

## Saves and development

Sprint code is present but deliberately disabled. Q remains unused and there is no player-facing sprint or stamina control. Developers can activate it using the single source flag and the instructions in [docs/SPRINT.md](docs/SPRINT.md).

Validated local saves run every five seconds and when leaving/backgrounding. Prior RPG v2 saves migrate without losing class, level, inventory or quests; companions are added. Old sixth-power cooldowns reset because that slot changed. The former standalone RTS save is not imported into this adventure. Export/import the shared save to move devices. There is no cloud synchronization.

No build step or runtime dependencies. Node 20+ runs `npm test`; serve the repository with an HTTP server. `src/world.js` contains dungeon data, `src/game.js` hero/world rules, `src/squad.js` shared strategy, `src/controls.js` fixed controls, and `src/app.js` touch/PWA integration. The earlier standalone RTS implementation remains archived in `src/rts-engine.js`/`src/rts.js` and is not loaded by the game.

GitHub Actions checks logic and Chromium behavior on desktop, touch Chromebook, two phone sizes and landscape, deploys Pages, then repeats browser checks on the public app. Screenshots are CI artifacts. Endgame tuning and the left-hand control experiment still need the author’s playtesting feedback.
