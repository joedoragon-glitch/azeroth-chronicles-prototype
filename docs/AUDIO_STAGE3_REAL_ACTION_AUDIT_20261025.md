# Audio Stage 3 — real combat action coverage

**Review checkpoint:** 2026-10-25  
**Base:** `main` `e3c78266b28f3325d2afdcb76ae849fcff306deb`  
**Stage:** 3 of 5. Independent of unmerged Stage 1 #468 and Stage 2 #470.

## Goal and evidence boundary

Answer the player's question **“Does each actual attack, skill, companion action and boss stage really reach an audio source?”** without confusing an asset registration with audible playback. This stage adds a **gameplay-event-to-audio-facade integration test** based on real `Campaign.cast`, `Campaign.tick` autonomous companions, actual projectile updates, and actual boss attack resolvers. No soundtrack, balance, animation, projectile, cooldown, asset, cache, save or game-runtime behavior is changed.

The regression test at `tests/audio-stage3-action-audit.test.cjs` creates 48 independent hero casts (3 classes × 8 slots × Tap/Charged), 13 companion combat encounters (Soldier, Archer and 11 pets) and every normal/TRUE boss's authored attack indexes. It then sends the **actual emitted event receipts** into the real installed `PrototypeAudio.effect` dispatcher. Sound source methods are intercepted before they contact an audio device; direct procedural output is counted. The live authored sound manifest is also consulted for matched optional WAV-binding candidates. The test cross-checks the existing enemy audio-catalog coverage, which verifies all known identity/stage permutations.

**No-source observations are not automatically bugs.** The pipeline deliberately suppresses presentation-handled legacy receipts, bookkeeping and duplicated stages. `companionSkill`, `petSkill`, and `hit` are intentionally bookkeeping-level because melee, projectile and special cast/impact events own foley; charge completions and Ranger hawk flight/expiry similarly suppress duplicate launch sound. Enemy presentation may explicitly mark stages `silent`.

The test forces the cold-recording path to use immediate procedural sound. Thus **“source attempted” is not “sound perceptibly played on a phone”**. It does not decode music/PCM, measure volumes, test all combinations of crowd throttling or certify exact real-device acoustics. Those remain Stage 4 mix analysis and Stage 5 browser/physical-device acceptance.

## Source analysis

- `src/prototype/app.js`: drains `Campaign.effects` and calls `audio.effect` for each receipt while also updating render effects. No dependency on moving before combat sound dispatch.
- `src/prototype/audio-hero.js`: owns hero skill audio, honors actual flight and impact, and gates duplicate/charged Skill 1 bookkeeping.
- `src/prototype/audio-effects.js`: resolves companion Steel/Guard, Archer Triple Shot/Piercing Volley, projectile launches/impacts, creature/hit, general spells and combat event notes. `soundKind` explicitly suppresses actions delegated elsewhere.
- `src/prototype/audio-enemy.js` and `enemy-presentation.js`: staged warnings, releases, travel, impacts, misses, spawn and phase; material/personality synthesis when WAV is not bound.
- `assets/audio/manifest.json`: 30 recorded SFX files bound through a small subset of 95 event keys. Most hero/companion/boss sound receipts resolve procedurally, which is not a missing asset by itself.

## Acceptance and handoff

Run the new test:

```sh
node tests/audio-stage3-action-audit.test.cjs
node tests/audio-stage3-action-audit.test.cjs --json
```

Run focused CI plus existing `tests/hero-skills-consolidation.test.cjs`, `tests/roster-skill-update.test.cjs`, `tests/enemy-audio.test.cjs`, `tests/audio-production.test.cjs`, and `tests/audio-recordings.test.cjs` as appropriately selected.

Review any `no_source_observed` entries against neighboring real receipts and source timing, rather than filling silence by adding redundant cast sounds. Treat failing hero/companion/boss action assertions as an unresolved gap until corrected and rerun. Preserve the original 64-voice budget and load throttles.

Do not merge/deploy this draft PR or other drafts without the owner's approval. Stage 4 (music and sound-mix perceptibility) and Stage 5 (browser/offline/device acceptance) are **not** authorized by this stage.
