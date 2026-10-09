# Enemy attack audio / VFX synchronization · v0.8.112

The shared bridge is `enemy-vfx-events.js`. Gameplay emits no audio and audio drives no gameplay. `enemy-vfx.js` alone owns stable skill IDs; `enemy-presentation.js` derives a material, action, creature/faction personality and optional important-cast accent from actual attack fields and actors. There is no parallel audio skill-name catalog and no display-name parsing.

## Presentation contract

The immutable transient envelope contains `skillId` (equal to `identity.id`), stage, actor ID/source, tier/role/species/family/captain profile, normal/TRUE variant, material/projectile style, actual world/source coordinates, contact/danger flags and existing visual geometry. Profiles live in `identity.presentation`. It contains no damage or AI authority. Identity, routing and source handles remain outside v4 saves. Legacy event statistics are unchanged: suppression is annotated only after recording the original statistics, on the transient effect object.

| Stage | Sound decision |
| --- | --- |
| windup | Dangerous casts share the critical two-pulse warning, duck and priority 3. Non-damage summon casts use quiet material preparation, without a damage warning. |
| release | Actual resolution always sounds, even on a miss. Material/action release with an important actor's short motif. |
| travel / linger | Deliberately silent: reuse release and first contact; never emit per-frame sounds. |
| impact | Material contact only for a real victim or projectile obstruction. Footprint-only visual payoff and summons are deliberately silent. |
| spawn | Quiet material materialization at each actual new unit's position/ID. Closely simultaneous births may share the bounded crowd throttle. |
| phase | Captain-profile/creature motif and local material action at the actual phase transition. |

Boss/captain authored indices and normal/TRUE IDs are unchanged. TRUE uses the same material and motif with only restrained synthesis texture. Legacy warning/launch/contact/phase cues are suppressed when their shared presentation stage owns audio. Ordinary enemy melee, hero/companion steel/bows/magic, charged attacks, combos and interface cues keep their existing classification. Queues, source ceilings, decoded budgets, music, environmental recordings, gesture unlock and pause/background paths retain existing owners.

The opening captain summon now correctly uses `captain/<profile>/phase`, rather than a fabricated `enemy/<species>/carapace` identity. A captain's authored summon attack retains its own attack-slot ID. Neither path implies AoE damage. Hazard contacts are observed only after the original `hitParty` succeeds. The bridge does not change collision, warning geometry, cooldowns, targets, movement, normal/TRUE summons or combat tuning.

## Sound production

Thirty short original mono WAVs (24 shared material release/impact pairs, one critical warning, two hero steel cues and three companion specials) are registered in the existing manifest. These are deterministic authored synthesis recordings, not third-party field recordings or model-generated sounds. `tools/audio/sfx-book.json` and `render-sfx.py` retain their recipe lineage and reusable guides; `sfx-measurements.json` records peak/RMS/edge measurements. Materials cover steel, claw, bone, stone, wet, arrow, spectral, ash, holy, arcane, root and dust.

Recorded shared textures retain live creature/faction and signature accents. Boss grandeur comes from recognizable local motifs and action timing, rather than duration or added loudness. The earliest cold/missing/corrupt recording uses immediate procedural recovery and warms a later occurrence, without replaying stale attacks. New recorded SFX use the existing hashes, provenance, bounded fetching/decoding, source priorities and offline cache inventory.

`director.events.effect.enemyWindup`, `.enemyRelease`, `.enemyImpact`, `.enemySpawn` and `.enemyPhase` are the binding keys. Existing first-match event bindings now accept exact `skillId`, `stage`, `tier`, `variant`, `family`, `profile`, `material`, `personality`, `action`, `accent`, `dangerous` and `signature`, alongside existing scene/actor fields. Put exact exceptions before shared family bindings. Do not add a sound file merely because an ID exists. Spawn/phase and lower-value effects may remain procedural.

## Acceptance gate

Run `npm run audio:coverage` or `node scripts/enemy-audio-coverage.cjs --markdown`. Coverage reads the existing live VFX inventory and actual profiles, not a second list. `npm run check`, quick/full regressions and release CI include the gate. Unknown materials, important motifs, rogue signature actions or stage decisions fail. A VFX identity/stage addition must supply a shared profile and an explicit sound or silent decision in the same change.

`docs/ENEMY_AUDIO_COVERAGE.md` is a generated view; regenerate it after source additions. At the v0.8.110 starting main, 172 identities cover 46 boss moves, 16 captain moves, five captain phases, two night skills, seven ranged profiles, 84 rogue basics and twelve frenzy personalities. Rogue #146 merged as v0.8.111 during this work. Its 40 signature IDs now pass the same gate, bringing coverage to 212 identities. Commander rally attacks retain their real low-damage danger warning; troop returns sound only when a native defender actually revives. Automatic TRUE reinforcement births reuse the boss’s existing authored summon-slot ID, without inventing a warning/cast that never occurred.

`tests/enemy-audio.test.cjs` checks real boss/TRUE resolutions, misses versus contacts, exact spawn points, captain phase/slot identity, ordinary projectile ownership, duplicate warning delivery, immediate recovery, mute/menu/pause and snapshot isolation. `tests/audio-browser.test.cjs` additionally decodes every production effect in Chromium/WebKit, measures finite unclipped output, renders all twelve procedural material families across stages, verifies silent missed contacts and exercises voice bounds alongside the existing lifecycle/score/ambience checks. Packaging tests retain atomic offline installation and subpath behavior.

Automated render/level checks establish functioning, finite audio and bounded mix behavior. They cannot establish physical iPhone speaker/headphone comfort or replace later subjective listening. No physical-device certification is claimed.
