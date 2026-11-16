# SIBDLP SFX Phase 2 — original eight-cue pilot and draft integration

**Date:** 16 November 2026. **Working draft:** [PR #898](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/898), reconciled with dev.290 `main@37ef6b0f86d91e2cc9af92c3660c757855200d33`. **Scope:** source-grounded sound design execution across P1 heroes/companions/pets/Charmed, P2 bosses, P3 progression. The three full priority ledgers and independent audit remain in documentation-only [draft PR #887](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/887). The eight sounds are *production candidates*, not the complete Phase 2 library or a numerical target.

## Real physical source and provenance

`tools/audio/sfx-phase2-pilot.cjs` deterministically renders eight original short **48 kHz / mono / 16-bit PCM WAV** files under `tools/audio/sfx-phase2-previews/`. The complete cue list, deterministic seeds, physical gestural intentions and material identity are in `tools/audio/sfx-phase2-pilot.json`. Source uses in-project noise, filtered transients, decaying resonators and timed gestures; no external samples, voices, speech or music beds. Four audition masters have *bit-identical copied recordings* under `assets/audio/effects/` for a deliberately restricted draft integration. Their `sha256` hashes, duration, source and credits are recorded in `assets/audio/manifest.json`; the other four remain previews.

| Priority | Source preview | Current draft status | Route/identity and nonnegotiable semantics |
| --- | --- | --- | --- |
| P1 | `rogue-bell-basic.wav` | **Draft integrated** | Actual Rogue basic and ordinary committed releases; single suspended spherical jingle-bell; one sound per legal release; procedural on cold fetch |
| P1 | `rogue-bell-emphatic.wav` | **Draft integrated** | Same *one* bell, stronger third-combo/charged gesture, not several bell instruments or a handbell chord |
| P1 | `mage-orb-release.wav` | Preview-only | Mage automatic orb departure, *not* all generic Arcane Beam starts; precise source-owner integration still required |
| P1 | `thorn-tripwire.wav` | Preview-only | TRUE Thornpup second skill release; `petSkill` is visual metadata; do not double the already audible generic `spell` |
| P1 | `charmed-wraith-heritage.wav` | Preview-only | Specific `spell(kind=charmHeritage,species=wraith)` owns current generic cast; **replace** the one voice, do not add sound to paired visual-only `charmHeritage` event |
| P2 | `lifebinder-cold-ring.wav` | **Draft integrated** | Lifebinder `enemyVfx.skillId=boss/crypt/4` release only, `Algor Mortis` causes Slow not HP damage; warning, contact/miss and other boss materials remain unchanged |
| P3 | `quest-complete.wav` | **Draft integrated** | Earned `questComplete` once, followed by a paired `quest(automatic=true)` bookkeeping event. Suppress only the paired second note within 0.18s |
| P3 | `barracks-complete.wav` | Preview-only | Real finalized Barracks `construction` success only, never an uncommitted UI click or construction progress |

## Four in-game owner routes — draft only

1. **Rogue physical bell:** `audio-hero.js:heroSkillEffect` keeps its existing event gate, 75ms rapid-repeat guard, warning-sensitive presentation and 38-voice ceiling. It attempts one flat valid `effect.rogueBellBasic` or `effect.rogueBellEmphatic` recording and *returns without synthesis when warm*. When cold, failed or unready, the original short procedural shell/rattle runs; no delayed catch-up sound or duplicate enemy-by-enemy impact.
2. **Lifebinder cold wave:** `audio-enemy.js:enemyExpression` attempts `effect.lifebinderAlgorRelease` only when `family=crypt`, `skillId=boss/crypt/4`, `stage=release`. A warm recording replaces the matching material *release*, not the warning, a damaging impact or phase. On cold/failure, original `effect.enemyRelease` and generic material/noise fallback remain. The 30 Phase 1 assets and original material binding indices are preserved.
3. **Earned quest payout:** Existing `effect.questComplete` gets the short new sound; when warm it replaces its synthetic note. For paired `quest(automatic=true)` within 0.18 seconds, `audio-effects.js` suppresses the second routine note even on cold playback. Unrelated quest UI and earned state remain unchanged.
4. **Audio registration:** Exactly **34 effect recordings**, 84 music, 34 ambience; **98 director event keys** (95 existing + three valid flat names). Every registered audio file is hash-addressed, offline-package eligible, and the generated runtime catalog + service worker are refreshed using the existing build contract. The four unregistered preview files stay outside the playable PWA package. No save-version change, new skill, target logic, boss damage, Charm probability, pet behavior or gameplay RNG change.

## Source and verification checks

- `tests/audio-sfx-phase2-pilot.test.cjs`: regenerate/compare all eight preview PCM WAVs, unique source IDs, physical RIFF/WAV headers, gain/peak/RMS/short tails, and verify that only the four accepted *technical integration candidates* are registered with identical physical bytes.
- `tests/audio-sfx-phase2-integration.test.cjs`: run the actual `PrototypeAudio` owner with declared source receipts. Assert valid manifest/runtime catalog, exact protected Phase 1 asset routing, warm Rogue output without synthesis, cold Rogue fallback, correct Lifebinder release with non-contact exclusion, and one actual quest-complete voice without duplicate `quest` sound.
- `tests/audio-catalog.test.cjs`, `tests/audio-sfx-phase1-quality.test.py`, `tests/audio-stage5-release-preflight.test.cjs`: explicitly protect the old Phase 1 source/hash/rollback while permitting only these four verified Phase 2 IDs; do not weaken the 30-master baseline.
- **CI acceptance is commit-specific.** A green focused job is not an audible A/B, physical iPhone/Chromebook observation, or complete game/multimode playthrough. All failed checks require their actual log/step review and a narrow correction. No broad unrelated optimization or game logic changes to force green tests.
- **Acoustic acceptance remains unearned.** Author-level sound quality, contextual mix, repeated long-session fatigue, phone speaker translation and player subjective preference cannot be proved by deterministic signal checks. Owner explicitly deferred final listening until *all* sound-design and engineering work is ready; do not request preliminary votes.

## Next autonomous sequence

First finish CI source/asset/build verification and narrowly scoped browser actual-playback evidence of these four draft cues, investigating new failures only. Then proceed to the other four pilot cues *only after verifying exact event ownership and no duplicate sound*; real-game Sound Library browsing and EN/ES cue labels must stay coherent. After the eight-cue study is technically stable, select the next sound family from the full priority ledgers by genuine gameplay need, not arbitrary file counts.

**Governance:** This is an **unmerged draft**, not a release, not installed on devices, not owner-auditioned. No branch-to-main merge, Pages/PWA publication, external contact or final listening-acceptance claim is authorized by this milestone alone.
