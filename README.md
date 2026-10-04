# Azeroth Chronicles — expanded prototype v0.8.7

One hero and companion adventure across five regions, ten settlements and five dungeons. Rescue ten captive specialists to purchase skills, skill ranks and equipment improvements. Ten boss families each have four warned attacks. Secret ringleaders and TRUE forms lead to the Dark Lord, the awakened dungeon finale, peace for every creature and an unlocked Nightmare campaign.

## Play

Play the live game at https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/. Existing installs can use **Menu → Check for game update** to save the run and install the latest version. The portable copy below runs offline.

For an offline portable copy, download `release/Azeroth_Chronicles_Playtest.html` and open it in Chrome or another current browser. The whole game, music and sound are embedded; no installation, server or internet connection is needed. Press a key or tap to start sound. Download the HTML instead of viewing its source in GitHub. The earlier v0.5 adventure remains available at `legacy.html`.

Choose Standard or the optional **Succession challenge**, then Paladin, Mage or Ranger. Succession retires fallen classes for that run. The first death offers the other two classes; the second automatically selects the last unused class; the third ends the run. A successor starts at level 1 in Millhaven, with zero XP, no talents and just their first skill. Gold, world progress, equipment, supplies and companions are inherited. Rescued teachers remain available, while new class training still has its level and gold requirements. Normal and Nightmare have separate saves.

## Controls

| Action | Keyboard / touch |
| --- | --- |
| Move | WASD / left joystick / click destination |
| Interact | E or F / Interact |
| Skills 1–5 | 1–5 / left skill buttons |
| Skills 6–8 | Space, left Shift, B / left skill buttons |
| Health / mana potion | Automatically at 35% HP or MP; H / M or left potion buttons to use earlier; restores over five seconds |
| Hero / squad cursor | Tab / Squad button |
| Select / give orders | E / F / right-side Confirm-order / click / right click |
| Select whole party | Backtick / Companions menu |
| Map / journal / inventory | Z / J / I / Menu |
| Pause / menu | P / Escape / Menu |
| Sprint | Q reserved; sprint deliberately unavailable |

Menus pause play. WASD or the joystick navigates and F/Enter confirms. Use the map to walk to marked captives, services and transport. Regions connect through recognizable NPC transport, rather than walking across their boundaries. Companions, finite gathering, construction and training share this same adventure and save.
On phones, the status sits at the bottom center, the menu sits at the upper right, and powers cluster above and beside the left joystick. Confirm/Order is at the lower right. The joystick moves the menu selection; F/Confirm activates it. Touching menu entries does not activate them. The Back entry is selectable with the joystick.

## Progression and ending

Start with skill 1; the other seven require rescued teachers, level requirements and payment. Enemy populations are larger with smaller individual drops. Enemies six or more levels below the hero give one gold and no XP. Night increases health and damage after distinct first boss victories, with unchanged gold and XP.

Two hero-participating kills of one ordinary species summon one or, with a 50% chance, two ringleaders. Companion-only kills neither advance nor reset the streak. Two kills of a named field boss unlock exactly one TRUE form. A normal dungeon boss receives one saved 1-in-3 early TRUE roll and stays dead. Reenter a cleared dungeon to challenge an available TRUE form after preparing.

Health and mana potions use themselves at or below 35% of the relevant maximum when available. Health takes priority if both are low, and both share the existing ten-second cooldown. Their recovery is delivered over five seconds of active play, survives reload, and stops if the resource reaches its maximum. H, M and the left-side buttons allow earlier use; the inventory menu still works. Automatic consumption saves immediately.

The first TRUE Dark Lord defeat permanently removes his family and guarantees the remaining unbeaten TRUE dungeon encounters and returning guardians at the hero’s victory level +2. All five TRUE dungeon guardians must fall to end the war. The remaining creatures become harmless, neutral and invulnerable; fewer inhabit the countryside, and native species inhabit the reclaimed dungeons. Each place gains a hopeful arrangement of its original melody.

Nightmare starts fresh and stays at night during the hostile campaign. Distinct first normal and TRUE boss defeats count independently without a formula cap; repeats do not count. Completing its finale restores the ordinary day/night cycle in a peaceful world, starting at sunset.

## Saves, sound and feedback

Autosaves occur every five active seconds and after important events. Export a backup before moving the HTML or switching devices, since browser storage for local files varies. Import validates before replacing a run. Current-run reloads preserve fallen classes and game over, but deliberately importing an old backup can rewind an offline run. No server anti-cheat is provided. The old v2 export remains untouched and is backed up on migration.

The sound menu offers independent master, music, ambience and effects volumes. Fourteen original melodic themes and ten peaceful arrangements are synthesized locally. Backgrounding and explicit pause suspend sound and combat. No external tracks or recording licenses are needed.

Choose **Menu → Export playtest report** to collect deaths, kills, boss durations, earnings and supply use. Record class, mode, challenge, session length, stuck routes, unaffordable training, unclear boss warnings, companion behavior and sound comfort. Reports stay local; no telemetry is sent automatically. Difficulty, economy, presentation and music are provisional.

## Development

`npm test` runs legacy regressions, expanded campaign and soundtrack checks, plus all 1,024 ending-state combinations. `npm run test:browser` requires Playwright and Chromium. Set `PLAYTEST_FILE=release/Azeroth_Chronicles_Playtest.html` to verify the portable release or `PLAYTEST_URL` to verify a hosted copy. `npm run release` builds the portable HTML and checksum.

The pure engine/content, browser shell and synthesized audio are separate modules under `src/prototype`. `legacy.html` retains the earlier game. See `docs/DECISIONS.md`, `docs/PLAYTEST_AUDIT.md` and `docs/SPRINT.md` for implementation choices, verification limits and dormant sprint activation.

Visual polish v0.6.1 gives each hero class, companion role, creature species, boss family and settlement service a distinct schematic drawing. TRUE forms and ringleaders retain visible elite details. Gameplay and save formats are unchanged.

Road update v0.6.2 rebuilds clear road corridors with joined stone paving and plank bridges. Pathfinding checks clearance along each movement segment, and existing saves upgrade their roads while retaining campaign progress.

Audit fixes v0.7.0 implement the 23 mechanics/content findings: explicit attacks and staged warnings, restored class effects, exact quest objectives, safe saves and migration, campaign-wide squad reservations, minor refuges, transactional travel, restored controls, authored geography and bounded 32-bar soundtrack transitions. See `docs/AUDIT_FIXES_V070.md` for evidence and remaining human playtesting limits.

Thornfang now has 1,200 health instead of 260, with unchanged damage and readable attacks. This gives the first rescue time to teach warning avoidance without adding phases, armor rules or required advanced skills. Existing saves receive the same adjustment.

Dungeon interiors now have themed decorations, 10–26 guardians and engineered spike/jet/seal layouts with safe alternatives. Guardian ringleaders count toward clearing the dungeon. Field slingers, skeleton archers and selected melee/ranged hybrid creatures pressure distance fighting with visible, aimed projectiles.

Guardian gold and EXP are deliberately low: 35% of the regional midpoint and one quarter of their previous EXP. Guardian elites inherit the reduced bases; boss, rescue and first-clear rewards remain the main dungeon incentives.

After the TRUE Dark Lord falls, the hero’s level at that victory is saved. Unbeaten returning TRUE dungeon bosses are fixed at that level +2, and their guardian waves return once at the same level. Their health and damage also rise with the captured level above 18, retaining the original endgame values as minimums. Later level-ups, reloads and Succession do not change this tier.

Ringleaders have twice the regular variant’s base health, 25% more damage and 10% faster movement. This applies to guardian ringleaders too. Existing elites retain their current health fraction when upgraded.

Specialists have explicit learning and training catalogues: Mira teaches skill 2 and trains only 1–2; Sela teaches 3/4/6 and trains 1/2/3/4/6; Orin teaches 5 and trains 1–6; Lyss teaches 7 and trains 1–7; Tovan teaches 8 and trains 1–8. Rank caps remain 2/3/4/6/8. Future skill names stay hidden until their region is reached, their teacher is rescued, or the skill is already known. Existing learned skills remain available.

Local-site update v0.7.3 moves finite worker resources outside both refuges and spreads quest crates across guarded landmarks. Existing regional patrols defend these destinations; no extra enemies or resource gold are added. Workers repeat gathering and deposit trips until a node is exhausted. Collected crates disappear, the map lists worker deposits, and landmarks explain their actual role. The journal shows remaining objectives and names the reward board. Outdoor patrol quests exclude dungeon kills; the supplier escort now takes projectiles and area damage. Existing saves retain depletion, collected supplies, quest payments and enemy deaths. See `docs/LOCAL_SITE_AUDIT.md` for the quest audit and remaining location-design scope.

Outdoor dungeon update v0.7.4 adds two miniature dungeons per region: a defended field-boss compound and a resource ruin or outpost. Solid palisades, stone defenses and pillars affect movement and shots while preserving open routes. Existing enemies become staged guardian groups with the same reduced gold and EXP as dungeon guardians. Pending guardian ringleaders count toward clearing. Resource-site clears unlock finite worker deposits and associated quest supplies; field-site clears join the local rescue quest objective. Clear state persists and guardians do not respawn. Later sites have warned, bounded traps that stop when cleared. These encounters are in the overworld and do not need a loading screen.

Specialist services now rebuild from individual rescue facts when a save loads. Importing a v2 save preserves learned skills and defeated bosses but no longer grants nine unrelated rescues. Imported completed dungeons provide their own keys, and their captives must still be freed. Previously imported saves remove unsupported automatic unlocks while retaining rescues with victory, key or recorded-rescue evidence. See `docs/FIELD_DUNGEONS_V074.md`.

Progression in v0.7.4 favors one-time quests and challenging foes: ordinary monster XP is halved, while outdoor ringleaders and bosses keep their combat XP. Enemy XP and gold fall to 75%/40%/10% when the hero is 1/2/3 levels higher, and stop at a four-level gap. Quest and objective rewards remain worthwhile. The level 16 Dark Lord is still the normal campaign finale; progression has no new cap for future content.

Refuge fix v0.7.5 gives all refuge restoration a shared 90-second cooldown in active game time. It persists through saves and travel, and rest is blocked while nearby enemies are engaged. Main-town passive healing also pauses during nearby combat. Orchard Hamlet cannot supply repeat full healing while tanking Thornfang.
The Citadel preparation fountain retains its single-use and guardian-clear requirements, and also blocks restoration during nearby combat.

Presentation update v0.7.6 adds restrained armor, cloth, equipment and creature detail to the three heroes and ten boss families. The environment, regular enemies, companions and NPCs retain their artwork. Landed hero, companion and enemy basic melee attacks and boss cleaves now have a short percussive impact sound on the Effects channel, with a short crowd throttle. Enemy projectiles travel 15% faster; their windups, damage and travel distance are unchanged. Saved enemy projectile bases are not multiplied repeatedly.

Terrain visibility fix v0.7.7 renders the Vale river, marsh water, highland/frontier ravines and Crown lava channel at their exact collision boundaries. All nine crossing gaps have full bridge decks, including the southern footbridge without a main road. Terrain rendering and collision share the same geometry; movement, crossing widths and saves are unchanged. Narrow waterways no longer disappear between grid samples, and nearby props no longer hide terrain.

Presentation and awareness v0.7.8 gives all ten rescued specialists distinct costumes and role tools, including their captive appearances. Ordinary and boss enemies now notice visible targets within 260 world units rather than 220. On their first clear pursuit of the hero in each engagement, they gain a visible 0.8-second 40% movement burst. Line of sight, town protection, attack range and chase territory stay the same.

Paladin basic attack v0.7.9 also triggers while a movement key or joystick is held and the hero actually moves. Existing skill 1 input still works for Paladin, Mage and Ranger, including manual stationary Paladin attacks. The new trigger uses the existing basic cooldown and target selection; pushing into a wall or moving the squad cursor does not trigger it. Skill slots and save formats are unchanged.

Movement basic and pursuit trial v0.8.0 extends the actual-movement skill 1 trigger to Mage and Ranger, with independent class switches in `PrototypeRules.movementBasicClasses` so either can be disabled without changing combat code or saves. All three retain manual skill 1. Every hostile, including bosses, now has one visible 1.2-second 50% chase burst per engagement; it resets only after disengagement.

Mechanics audit v0.8.1 tests one- and two-ringleader outcomes across all ordinary species, including night-only and guardian variants. Night-only leaders retain their original night strength when a delayed spawn crosses dawn. All five dungeon bosses have a single saved one-in-three early TRUE roll; success appears on reentry, failure remains recorded, and the later awakening grants missed TRUE encounters. See `docs/MECHANICS_AUDIT_V081.md` for scope and evidence.

Quest and layout update v0.8.2 puts one crate outdoors and two in a nearby guarded interior for each of the four three-crate quests. The Vale entrance is the orchard watchtower cellar; the Marches, Highlands and Crown have themed storehouses. Interior guardians give reduced dungeon rewards, with one tougher captain. Existing collection facts and quest payments persist. Quest boards move clear of nearby buildings and display `!` for available quests or `?` for a reward to claim. The menu and status move right, Confirm/Order moves to the lower right, and touch menu entries require joystick selection plus Confirm. Potions now restore over five seconds. See `docs/QUEST_INTERIORS_V082.md`.

Whole-game visual pass v0.8.3 keeps the schematic prototype art and improves the five regional floors, dungeon and quest interiors, waterways, roads and bridges, town structures, shared character grounding, combat warnings, projectiles, loot, map and interface. Health and mana now have compact HUD bars. All visual changes use local canvas and CSS drawing; collision, saves, combat and rewards are unchanged. Representative desktop and phone screenshots are captured by the browser checks.

Phone usability update v0.8.5–v0.8.6 anchors status messages flush to the bottom center, places larger skill touch targets beside the left joystick, and restores vertical touch scrolling throughout menus such as Help. The phone skill cluster stays within the left half of small screens. GitHub Actions verifies 320 px, 375 px and landscape phone layouts, the portable HTML build and the live Pages deployment.

Update v0.8.7 refreshes the offline cache for these releases and fetches current assets during installation. The in-game update action waits for the new worker to finish installing before activating it.
