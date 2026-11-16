# SIBDLP SFX Phase 1 — current 30 recorded effects, production and adversarial quality review

**Owner direction (15–16 November 2026):** Complete and critically review the **30 currently registered effects** first. Only **after Phase 1** consider a separate Phase 2 program to add more recordings where the real four-class skills, enemies, companions, bosses and gameplay events justify them. The current 30 is a small amount of physically recorded audio relative to the game's full procedural sound coverage; count alone does not prove a functional error. **No target number or blanket one-WAV-per-skill demand has been approved.**

**Source baseline:** `main@66cbf47d251ba3213a61f21e5a3eb1abf57f26df` plus verified existing manifest/audio/hero/enemy runtime. Current player's installed build and actual owner listening are separate acceptance gates.

## What exists and where
- The **production catalog remains exactly 148 recordings: 84 music, 34 environmental, 30 SFX**, with 95 known event keys and 8 keys conditionally selecting recorded effects. 87 keys remain procedural or intentionally silent, NOT 87 broken recordings. `tools/audio/sfx-event-inventory.cjs` reproduces the counts and 64 current Tap/Charged profile forms plus 4 basic-attack class profiles. The authoritative printed results depend on checking the exact source branch, not what a player's device has installed.
- `tools/audio/sfx-30-studio.py` is the **source-authored nonshipping 30-candidate renderer**. It reads the current manifest and old `sfx-measurements.json`, generates one WAV study per stable existing effect ID and preserves source-to-candidate hashes in `tools/audio/sfx-30-previews/candidate-manifest.json`.
- `tools/audio/sfx-pilot-studio.py` separately contains the **10 early representative studies** for hero skills/automatics, Rogue jingle and warning; these are experiments, **not ten additional manifest effects** and not the beginning of Phase 2.
- The **existing** `tools/audio/index.html` and `audition.js` gain a nonshipping A/B area: all 30 registered effects versus the actual registered original WAV; ten additional examples versus the current procedural/recorded reference. Nothing autoplays, opens a campaign save, changes the live manifest or alters combat routes. Originals and candidates use the same effects bus, but this is an **isolated sound comparison**, not automatically a controlled perceived-loudness or gameplay-mix test.
- The currently approved Millhaven Chamber recording is correctly separated from 18 frozen Dark Crown originals in this branch's Sound Library. This is a **library classification correction**, not permission to recompose or publish that recording. The preview's synthetic nearby combat counter now matches its intended combat mode so it does not incorrectly retain Millhaven's peaceful cue.

## Design review: 12 paired material families (24 current registered slots)

| Material | Release identity | Impact/contact identity | Unresolved acoustic risk |
| --- | --- | --- | --- |
| Steel | Air and restrained thin metal movement | Inharmonic contact partials, edge scrape | Sounds like synthetic bell rather than steel; contact masking |
| Claw | Surface drag and organic whoosh | Brief tear/scratch and body | Noise alone may not read as living claw |
| Bone | A pair of dry clattering small pieces | More brittle clicks and short contact | Can become unconvincing identical dry taps |
| Stone | Grinding/granular displacement | Body pressure, upper rock crack | Low-frequency energy may vanish on phones |
| Wet | Liquid movement with droplets | Splash contact and tiny splatter | Filtered noise can sound like generic static |
| Arrow | Bowstring snap and departing shaft | Shaft/wood bite with midrange crack | A synthetic pluck may not sound like a real bow |
| Spectral | Thin shifting whisper/bloom | Brief incorporeal shimmer | Tonal peaks could sound like generic space UI |
| Ash | Small ember/air gestures | Short scattered crackles | Crisp static can obscure material identity |
| Holy | Modest ascending luminous accent | Short consonant overtone + contact | Must stay different from arcane and soundtrack |
| Arcane | Unstable rising electrical accent | More angular inharmonic discharge | Too similar to Mage's procedural orb |
| Root | Woody compression and leaf/twig drag | More brittle wood shear/contact | Needs a distinct source from stone/wood |
| Dust | Light grain/air sweep | Short grit/scatter contact | Similar noise spectrum across unrelated materials |

This matrix describes **authored source intentions** and attack/envelope differences; it does not assert that listeners can actually identify these materials blind. The earlier single noise-and-pitch material factory was a legitimate sameness risk. Replacing it with twelve family recipes is **not itself proof** that the new files are good.

## Six established special recordings, preserved event roles

| Existing ID | Necessary message |
| --- | --- |
| `sfx-critical-warning` | Two unmistakable pulses only for genuinely dangerous enemy windups; MUST remain audible with music/enemy layers; no replacement without mixed combat and owner review |
| `sfx-hero-steel-swing` | Paladin blade movement **before** contact; not a second hit |
| `sfx-hero-steel-impact` | Real Paladin steel contact with combo nuance owned by current event routing |
| `sfx-power-strike` | Soldier's deliberate heavier special, not all soldier attacks |
| `sfx-holy-cleave` | Companion steel impact and restrained luminous accent, no choir |
| `sfx-piercing-volley` | Three spaced bow/string attacks; avoid machine-gun motif |

**Do not conflate event keys and physical files:** the actual enemy presentation stages dictate warning/release/miss/contact; no-hit events must not make contact noises. Existing `audio-hero.js` covers all currently supported abilities and class basics with fallback and bounded voices. The 10 standalone class studies are *only* pilot exploration of those existing procedural events. They are not substituted for the game's own 64 form profiles.

## Producer's adversarial review — shortcomings caught and corrected

1. **First ten-study generator was overclaimed as mature design.** The first Ranger arrow impact had too much sub-350 Hz energy, and early Rogue single-bell studies sounded *source-designed* like long resonant bells instead of short slotted-jingle collisions. This was detected by source/spectral review, not by someone actually listening. Revised source shortens and retimes those studies. A real physical jingle-bell recording may still outperform the oscillator study; not certified.
2. **First full 30-piece render had a major loudness-parity gap.** Original recordings measured roughly 0.03 RMS; multiple initial new cues were about 0.006–0.015, risking substantially softer effects through unchanged manifest gains. This was a source-render fault even though the waveforms were valid and the spectra differed. Recalibration now references each original ID's actual recorded `sfx-measurements.json` RMS, caps new absolute peaks, and requires a conservative per-cue RMS disparity guard. **This is technical parity, not perceptual loudness matching or a blanket volume boost.**
3. **A pre-existing Sound Library test was stale**, still expecting 147 registered recordings and 83 music IDs and treating the approved Millhaven Chamber source-derived theme as one of 18 preserved originals. Counts and classification were corrected **on this review branch only**.
4. **The scene-mixer combat preview had contradictory counts** (simulated `engaged=4` but inherited `nearbyEngaged=0`), which could falsely route to peaceful Millhaven. Corrected in the **review UI scene fixture**, not the campaign or live game audio director.
5. **Ear-based quality remains entirely unverified.** No human/AI claim of actually hearing whether a clip resembles sword, rain, jingle, rock, magic, or claw; no phone speaker or headphone review; no fatigue after repeated rapid actions; no gameplay audio stress acceptance. The project sound bible prohibits approving aesthetic quality from waveform plots alone.

## Evidence hierarchy and current gate

- **A · Source-based sound identity:** individually authored 12 material pairs and six specials exist; early defects were found and revised. **Status: candidates for controlled critical listening, NOT final artistic GO.**
- **B · Actual generated signal/technical:** Python tests verify 30/30 exact IDs, stable deterministic re-render, source hashes, RMS parity, bounded peaks/edges, midrange warning/arrow checks, no near-clone spectral pairs. The focused branch-only CI tests browser execution (desktop/phone), all comparison options, real baseline routing, missing-file handling and the existing complete Sound Library with registered assets. **Status: PASS only at a recorded successful exact-source CI run**. A previously failing run never proves success; report the final URL/SHA in issue #877.
- **C · Really heard sound/perceived class/material individuality:** **UNVERIFIED/HOLD.** Perceptual A/B, phone/headphones, actual game mix, warnings and fatigue require actual hearing; no approval inferred. Not every study necessarily deserves adoption. A more convincing recording/foley-driven rebuild may be required.

### Absolute safety boundary

No merge, GitHub Pages build, production manifest edits, in-game binding changes, live asset replacement, release version/PWA updates, save changes, class mechanics, enemy event/VFX behavior or player-facing publication. All candidate data is on the isolated `audio/sfx-modernization-pilot-20261115` branch, not `main`. Full v0.9.2 functional completion stays independent.

## Phase 2 — explicitly deferred, not silently initiated

After the 30 currently registered cue reviews are truly finished to the appropriate standard, **inventory unserved *audible gameplay needs*** using existing class-by-class skill receipt events, monster factions/boss phases, Barracks specialists, pet/charmed/companions, world/UI/quest feedback and legitimate normal/charged/TRUE contexts. Test whether a real sample would materially improve character identity, timing or clarity over current procedural output. Preserve intentional silence and continuous/procedural textures rather than allocating one recording to every syntactic event key. Present a **justified prioritized asset plan** with realistic formats, voice/cold-cache/packaging constraints, clear art direction and proof of game relevance, **not an arbitrary target number of WAVs**. Do not implement new bindings or start a second release lane without a separate owner choice.

Reference: [ongoing modernization #877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877), `docs/AUDIO_SOUND_PASS.md`, `docs/AUDIO_AUTHORING.md`, `docs/DECISIONS.md`, `docs/AUDIO_PLAYBACK.md` and actual source in `src/prototype/audio-*.js`.
