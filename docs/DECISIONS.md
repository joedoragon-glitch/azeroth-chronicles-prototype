# Implementation decisions

Design documents 01–08 define the world, economy, combat, ending and Nightmare rules. Documents 09–10 add execution and audio. Document 11 adds Succession; document 12 records verification. Later specific decisions supersede earlier assumptions.

The expanded shell runs one shared Campaign state. `data.js` carries approved content tables, `engine.js` owns progression/combat/saves, `app.js` owns controls/rendering and `audio.js` owns original local music and sound. The legacy implementation remains available independently.

- Succession is optional for a fresh Normal or Nightmare run. Gold, boss facts, prisoners, services, quests, resources, equipment, supplies and party survive. Class, level, XP, learned skills, ranks, talents and temporary buffs reset. Inherited equipment and supplies are an interpretation of retained progress and a playtest tuning point.
- New successors still meet the original learning level requirements. Freed instructors remain accessible; advanced training is not granted automatically.
- Dungeon TRUE entitlements appear on reentry, leaving time to rescue captives and prepare. Bosses start away from the entrance and are announced.
- Authored water/cliff partitions, bridge gaps, forest clusters and connected roads form five regions. Terrain checks cover every service, captive, entrance, transport stand and boss home.
- Four boss slots combine cones, charges, circles, separated patches, projectiles, expanding rings and capped summons. Shared prototype primitives approximate some advanced animation descriptions while retaining readable warnings and safe routes.
- Music uses original synthesized instruments, harmony and filtered ambience. Every place has a melody and peaceful arrangement. Recorded orchestration is outside this prototype.
- Sprint remains dormant and unavailable. Q is reserved; no menu or saved setting enables it. Source and activation notes remain explicit.
- Offline exports are portable backups. Reloading the current Succession run cannot restore fallen classes, while deliberate imports of older exports can rewind it. There is no online anti-cheat service.

The v0.6 expansion is promoted as the next main-branch release at the existing public game URL; legacy.html retains v0.5. Hosted updates require the player’s menu action and save before reloading. The portable HTML has no service-worker registration or external game assets.
