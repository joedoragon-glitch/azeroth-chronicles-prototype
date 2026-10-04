# Azeroth Chronicles — expanded prototype v0.7.0

One hero and companion adventure across five regions, ten settlements and five dungeons. Rescue ten captive specialists to purchase skills, skill ranks and equipment improvements. Ten boss families each have four warned attacks. Secret ringleaders and TRUE forms lead to the Dark Lord, the awakened dungeon finale, peace for every creature and an unlocked Nightmare campaign.

## Play

Play online at https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/ . This is the expanded v0.7.0 adventure. Existing installs can use the game update action in the menu; future updates save before reloading.

For an offline portable copy, download `release/Azeroth_Chronicles_Playtest.html` and open it in Chrome or another current browser. The whole game, music and sound are embedded; no installation, server or internet connection is needed. Press a key or tap to start sound. Download the HTML instead of viewing its source in GitHub. The earlier v0.5 adventure remains available at `legacy.html`.

Choose Standard or the optional **Succession challenge**, then Paladin, Mage or Ranger. Succession retires fallen classes for that run. The first death offers the other two classes; the second automatically selects the last unused class; the third ends the run. A successor starts at level 1 in Millhaven, with zero XP, no talents and just their first skill. Gold, world progress, equipment, supplies and companions are inherited. Rescued teachers remain available, while new class training still has its level and gold requirements. Normal and Nightmare have separate saves.

## Controls

| Action | Keyboard / touch |
| --- | --- |
| Move | WASD / left joystick / click destination |
| Interact | E or F / Interact |
| Skills 1–5 | 1–5 / left skill buttons |
| Skills 6–8 | Space, left Shift, B / left skill buttons |
| Hero / squad cursor | Tab / Squad button |
| Select / give orders | E / F / Confirm-order / click / right click |
| Select whole party | Backtick / Companions menu |
| Map / journal / inventory | Z / J / I / Menu |
| Pause / menu | P / Escape / Menu |
| Sprint | Q reserved; sprint deliberately unavailable |

Menus pause play. WASD navigates and F/Enter confirms; touch buttons scroll. Use the map to walk to marked captives, services and transport. Regions connect through recognizable NPC transport, rather than walking across their boundaries. Companions, finite gathering, construction and training share this same adventure and save.

## Progression and ending

Start with skill 1; the other seven require rescued teachers, level requirements and payment. Enemy populations are larger with smaller individual drops. Enemies six or more levels below the hero give one gold and no XP. Night increases health and damage after distinct first boss victories, with unchanged gold and XP.

Two hero-participating kills of one ordinary species summon one or, with a 50% chance, two ringleaders. Companion-only kills neither advance nor reset the streak. Two kills of a named field boss unlock exactly one TRUE form. A normal dungeon boss receives one saved 1-in-3 early TRUE roll and stays dead. Reenter a cleared dungeon to challenge an available TRUE form after preparing.

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
