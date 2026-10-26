# Combat Arena — low-spec combat playtest (draft)

A fourth **New game** run choice starts an independent **Combat Arena** save. This is
not a campaign map, difficulty setting or global graphics toggle. It exists to
test the real game on low-end phones with almost no environment rendering.

## Player flow

1. New game → Combat Arena → choose language and Paladin, Mage or Ranger.
2. Arrive in a safe, enemy-free, 2000×2000 flat arena with the ordinary
   class-specific starting Basic Attack (skill 1); skills 2–8 remain locked.
   Every appropriate instructor is present at the hub and teaches their original
   skills and ranks for FREE, using normal training menus and progression rules.
   There is no automatic full skill unlock and no custom skill progression path.
   The hub's Level Trainer NPC grants exactly one level per interaction using
   the native XP threshold, HP growth and talent-point awards. No level
   selection or multi-level boosting menu exists.
3. Speak to the Arena Guide (or use the Combat Arena adventure menu) to select
   any region and enemy group. Ordinary packs lead to guardian/captain stages and native on-demand night encounters
   and a separate arena for each existing boss. The final Dark Lord stage has
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

## Verification and release gate

Run: node tests/combat-arena.test.cjs — mode isolation, one-level-per-interaction
training, instructor skill unlocking, save/restore, native summoned-vs-fixture
identities, ranged enemies and regional stats, optimized Canvas/Pixi exclusions,
teleport, replay, free spending and survival. The normal PR
checks remain focused. Before publishing, inspect the exact draft on a
low-spec phone in both Canvas and PixiJS, with and without an enemy group:
check frame-profile render/draw times, memory and player input responsiveness.
Review stage menus, specialist progression, reset/respawn, physical boss
telegraphs, bilingual copy, storage and reload.

**Status:** candidate under regression. Merge only after focused and relevant
integration checks pass, followed by physical low-end-device FPS measurements.
Measured performance improvements remain unverified until device testing.
