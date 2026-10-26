# Combat Diagnostics — unlisted low-spec combat playtest

Combat Diagnostics uses the existing internal `arena` mode and independent v4
save, but it is **not shown to ordinary players**. It is available through an
unlisted link to the *same* live game: `?combatDiagnostics=1` (append to the
regular game URL; keep the existing path, including any `/repo/` prefix).
This query flag is a convenience gate, **not authentication**: anyone given
or finding the link may use it. There is no server-side identity check.

The URL must be bookmarked or reopened to access the mode. The existing PWA
manifest still launches the ordinary game without the query, rather than
activating diagnostics for every installed user. The diagnostic run stays
in `azeroth-v4-arena`; ordinary save/profile modes remain unchanged.

The link always uses the current deployed code, assets, engine, combat changes
and service worker of the normal GitHub Pages/PWA application; it is not a
separate standalone build. When a new version is published, the normal update
notification/install-reload behavior applies on the playtest URL too.
The tested hero level, learned skills, party and stage persist across updates
subject to normal v4 save compatibility and explicit future migrations. Never
promise updates will preserve incompatible future save-format changes.

## Player flow

1. Open the unlisted `?combatDiagnostics=1` link → choose language and
   Paladin, Mage or Ranger; subsequent visits resume the separate diagnostic
   save. The usual New Game and Save menus do not reveal this option on the
   ordinary URL.
2. Arrive in a safe, enemy-free, 2400×2400 flat arena with the ordinary
   class-specific starting Basic Attack (skill 1); skills 2–8 remain locked.
   A dashed, corner-marked border identifies the actual walkable limit in Canvas and Pixi.\n   The entry, Arena Guide, one-level Trainer, and recovery form an open approach;\n   specialists occupy clearly spaced service rows. Every appropriate instructor is present at the hub and teaches their original
   skills and ranks for FREE, using normal training menus and progression rules.
   There is no automatic full skill unlock and no custom skill progression path.
   The hub's Level Trainer NPC grants exactly one level per interaction using
   the native XP threshold, HP growth and talent-point awards. No level
   selection or multi-level boosting menu exists.
3. Speak to the Arena Guide (or use the Combat Arena adventure menu) to select
   any region and enemy group. Ordinary packs lead to guardian/captain stages and native on-demand night encounters
   and a separate arena for each existing boss. Monster starts and scripted\n   displacements remain within the marked arena perimeter. The final Dark Lord stage has
   only its boss. Teleport to the hub without stage unlocking.
4. Free recovery and the one-level Trainer NPC are near the spawn.
   The menu can create up to four completed,
   visually invisible Barracks with existing services. Death automatically
   returns the player to the safe hub.
5. Saves use the existing v4 structure under the new arena slot. Enemy
   populations are ephemeral and reconstructed for the selected stage on
   restore. Campaign stage clears, rescued progression and achievements are
   intentionally independent.

## Performance boundary

- The arena does not execute campaign zone scenery generation.
- Canvas/Pixi rendering skips terrain, roads, bridges, scenery and virtual
  buildings. Pixi uses the engine's one-pixel WHITE GPU texture tinted black,
  rather than allocating/uploading a terrain-sized background bitmap.
- Canvas play starts in Optimization Mode with a temporary 50% world-pixel cap
  (HUD/controls and stored graphics preferences are not modified). The player
  can opt into experimental WebGL manually if desired.
- Buildings are interactive but visually hidden. NPCs, hero/party sprites,
  hostile actors, projectiles, combat telegraphs and combat effects remain
  visible and continue using the established combat simulation.
- The arena reuses original enemy factories, boss definitions, native ordinary
  and captain stats, ranged-role configuration, AI, cooldowns, hit geometry and
  calculations. Actors are marked as arena fixtures, NOT summons, so tactical
  and ranged behavior stays native. Fixtures do not grant campaign rewards,
  story victories or unlocks. Save snapshots omit temporary fixture bodies. Stage groups are deliberately small.
- The mode does not disable AI, collision between combatants, simulation
  bookkeeping, audio, skills or attack warnings. Lower total work is expected;
  **actual phone FPS gains require measurement**, not inference.


## Future game releases / PWA compatibility

The arena uses the same GitHub Pages/PWA package as the main game, not a
standalone bundle. Every future release runs current shared Campaign AI, combat
rules, skills, sprite/audio assets, species and boss definitions. New encounters
are discovered from the current data tables at launch; there is no version-locked
second combat engine.

The normal service worker prepares a release-specific cache and offers
**Update available**. The player must accept the update/reload while connected;
offline sessions cannot obtain unpublished or undownloaded code. A retired
encounter identifier safely resets the diagnostic location to the hub while
preserving the character, instructor-learned skills, talents and party; current
save migrations still apply. Future v4 schema changes must retain arena support
and receive regression coverage.

## Verification and release gate

Run: node tests/combat-arena.test.cjs — mode isolation, one-level-per-interaction
training, instructor skill unlocking, save/restore, native summoned-vs-fixture
identities, ranged enemies and regional stats, optimized Canvas/Pixi exclusions,
teleport, replay, free spending and survival. The normal PR
checks remain focused. After publishing to allow tester access, inspect the live version on the
low-spec phone in Canvas first, with and without an enemy group (PixiJS is
experimental and optional):
check frame-profile render/draw times, memory and player input responsiveness.
Review stage menus, specialist progression, reset/respawn, physical boss
telegraphs, bilingual copy, storage and reload.

**Status:** requires focused integration validation before approved merge;
physical low-end-device FPS measurements take place after the owner-authorized
publication. Source, PWA and diagnostic mode are versioned together.
Measured performance improvements remain unverified until device testing.
