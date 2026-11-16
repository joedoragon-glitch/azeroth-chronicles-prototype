# SFX Phase 2 — original eight-cue pilot, source-routing proof and deferred listening

**State:** isolated **actual audio production candidates**, **not integrated into game**. Date 16 November 2026. Main reviewed at `409f0ed671b0ff2563f788bf45ab665e01c05ca6`. Source-grounded design authority is draft PR #887 and its independent post-task audit. Source and game sound effects remain unchanged; no merge, publication, PWA update or player-facing acceptance.

## Pilot outputs and why these are the first controlled auditions

The original audio authoring source `tools/audio/sfx-phase2-pilot.cjs` deterministically synthesizes **eight 48 kHz, mono, 16-bit PCM WAVs** in `tools/audio/sfx-phase2-previews/`. All are short (0.36–0.46 seconds), no speech, dialogue, background music, external recordings or licensed samples. The repo stores source, a structured cue-intent ledger (`sfx-phase2-pilot.json`) and the actual preview WAVs. `node tools/audio/sfx-phase2-pilot.cjs --check` confirms bit-for-bit correspondence, numerical peak/RMS/tail, duration, and sha256; `--render` reproduces them. `tests/audio-sfx-phase2-pilot.test.cjs` tests audio integrity, distinct identities and observation-only routing.

| Priority | Cue (actual preview WAV) | Distinct sonic intention | Original successful gameplay owner / constraints |
|---|---|---|---|
| P1 | `rogue-bell-basic.wav` | Two linked metal-shell and internal rattle gestures | `rogueBellBasic` + normal `rogueBellSkill1`, the single suspended spherical staff jingle-bell |
| P1 | `rogue-bell-emphatic.wav` | Same instrument, stronger three/four gesture punctuation | Legitimate third auto combo and charged Rogue performance only |
| P1 | `mage-orb-release.wav` | Compact rising arcane orb departure, not a long beam | `heroSkillCast({class:'mage',slot:1,automaticBasic:true})` only |
| P1 | `thorn-tripwire.wav` | Tight twig whip and tensioned fibrous tripwire | `petSkill({petFamily:'thorn',slot:2,stage:'release'})`; no fake hit or duplicate generic spell |
| P1 | `charmed-wraith-heritage.wav` | Restrained spectral pressure seal, different from damage | Actual `spell({actor:'companion',kind:'charmHeritage',species:'wraith'})`; replace existing generic spell, do not add another voice |
| P2 | `lifebinder-cold-ring.wav` | Non-damaging cold ring, spectral air, delicate crystalline overtone | Actual enemy stage `enemyVfx({family:'crypt',skillId:'boss/crypt/4',stage:'release'})`; preserves warning; no HP-impact sound |
| P3 | `quest-complete.wav` | Tactile achievement tap plus small clean rising acknowledgment | Real `questComplete` on earned payout; adjacent `quest` must not add another success cue |
| P3 | `barracks-complete.wav` | Wood assembly knock + final iron latch | Real `construction` only after Barracks work completes, not construction tick or purchase |

**This is intentionally not the entire Phase 2 inventory.** Priorities 1–3 remain defined in their complete review ledgers; the pilot tests a variety of event owners and source materials before deciding how many further WAVs are needed. No 87-event-key quota. The other hero skills, pets, Charmed species and bosses remain in the documented phase-design queue, not omitted or declared finished.

## Explicit engineering boundaries and why no game installation occurs yet

- **No unapproved gameplay change:** `tools/audio/sfx-phase2-previews` is not in the deployable `assets/audio/manifest.json` and is not on the explicit `scripts/site-assets.cjs` allowlist. The 30 Phase 1 recordings, 84 music and 34 ambient files are unchanged in main; no player can encounter these pilot previews accidentally.
- **Observation-only route selectors:** `tools/audio/sfx-phase2-pilot-routes.cjs` maps *actual source event facts* to preview candidates for testing and a later A/B room. It is not imported by Campaign, the player audio facade or the renderer.
- **Do not register a WAV without changing its true owner:** Rogue has a procedural early-return; pet `petSkill` is visual-only, Charmed Wraith heritage already triggers a single generic `spell`, and generic quest/questComplete can double-chime. Different installation strategies must be selected **per exact event**, not by global volume or a blind manifest-entry count.
- **Valid manifest constraint:** if future production integration is justified, only flat event keys of the form `effect.<slug>` may be registered without schema revision. Existing `when` allowlist does not include `slot`, `petFamily`, `kind`, `source` or `reforge`. Boss skill-specific `when.skillId` can be used via existing `effect.enemyRelease` binding before the material fallback.
- **Audio asset size:** all previews use deterministic finite short source, no streaming loops, no sustained music and no new PWA cache. PCM samples are not re-sampled or normalized at runtime here. Gain and mix calibration must still occur against the actual game.
- **Failure policy:** no sound or reward from illegal/uncommitted event; no falsely successful hit on miss/blocked attack; no duplicate pet/charm spell voices; no change to saved values, game RNG, skill and boss mechanics; cold/cached fallback must remain audible in any later integration.
- **Quality evidence:** source/reproduction tests and CI demonstrate *structural correctness*, not aesthetic satisfaction. User explicitly deferred **listening acceptance to the end**; do not demand review for this initial batch or mark it approved-by-ear.

## Next autonomous engineering gates

1. Run actual source and WAV tests in GitHub CI on this draft; fix genuine failures without escalating to a full game matrix. Verify no preview path in production build.
2. Keep the pilot isolated until its candidate set, exact legal event routes and duplicate-suppression strategy are objective and regression tested. On the **next code iteration**, wire a chosen *small* subset to existing valid audio owners on this same or a stacked draft branch, preserving fallback and rollback; do not rewrite unrelated classes or save code.
3. Only when the actual audio is integrated in a draft build, perform controlled event/asset browser tests and source/signal-level acoustic comparison with current Phase 1 output. Continue iterating on measurable failures autonomously.
4. At the **end of the full workstream**, request the owner's one listening/acoustic acceptance gate for all approved candidates together. CI must never stand in for that approval. No merge/publication without owner permission.

**Status ledger:** eight distinct original pilot recordings **GENERATED ON DRAFT**; source-to-candidate selectors **TESTED BY UNIT ASSUMPTIONS PENDING CI**; real event routing **NOT IMPLEMENTED**; game/browser/phone mixing **NOT PERFORMED**; human listening **INTENTIONALLY DEFERRED**; release **NOT AUTHORIZED**.
