# SIBDLP sound-effect identity pilot — independent studies (15 November 2026)

**Status:** source-authored proof of concept; **not** approved, not added to the gameplay manifest, not published. Tracked in [SFX modernization #877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877).

## Execution / provenance
- Experimental generator: `tools/audio/sfx-pilot-studio.py` on this isolated branch, based on source-reviewed `main@66cbf47d251ba3213a61f21e5a3eb1abf57f26df`.
- Run `python3 tools/audio/sfx-pilot-studio.py /tmp/sibdlp-sfx-study` in an environment with NumPy and SciPy. The script writes ten original-synthesis WAV previews and a `pilot-manifest.json`. Output is deliberately **outside** `assets/audio` by default and is **not** registered in `assets/audio/manifest.json`.
- Source candidate assets were generated in the initiating ChatGPT conversation and packaged with their generator, a standalone temporary review page and signal metadata in `SIBDLP_SFX_Concept_Pilot_2026-11-15.zip`. That package is a chat artifact, **not** a GitHub release, published Pages asset or current game asset. All 10 WAVs were checked as 48 kHz, 16-bit, mono, short one-shots, with finite signal and conservative peak `< 0.5`; ZIP integrity and the review page's JavaScript syntax were checked. Runtime, in-browser audition playback, perceptual mixing and device audio remain unverified.
- The **event IDs in this pilot are conceptual study names**, *not* existing canonical manifest bindings. They must never be used to infer new combat receipt identities. Before possible integration, map to the existing game's actual hero/basic/charged/enemy event keys and stage contracts.

## Pilot sound families (10)
| Candidate ID | Creative contract |
| --- | --- |
| `paladin-sword-swing` | Air movement with a restrained steel edge, not an impact |
| `paladin-sword-impact` | Crisp metal contact and inharmonic ring; physical body and no trailer boom |
| `ranger-arrow-release` | Bowstring pluck and clean arrow departure |
| `ranger-arrow-impact` | Separate arrow contact and shaft resonance |
| `mage-arcane-release` | Controlled ascending magic energy, not a generic explosion |
| `mage-arcane-impact` | Short crystalline contact distinct from a cast |
| `rogue-bell-basic` | **One** spherical hanging staff bell with brief natural collision/rattle |
| `rogue-bell-performance` | Same bell articulated in three deliberate strikes, not a guitar |
| `enemy-claw-contact` | Organic tear/scratch with brief body |
| `critical-warning-study` | Experimental two-pulse cue; the game's warning is **protected** pending functional and owner listening acceptance |

## What is and is not proven
The candidate renderer uses independent combinations of filtered transients, material-inspired partials, plucked string, oscillatory magic, inharmonic metal, and rhythmic single-bell articulation instead of mass-applying the original `render-sfx.py` pitch/noise recipe. This is a source-level conceptual distinction; it **does not** prove the final sounds are natural, artistically satisfying, properly mixed or acceptable over a long session.

No runtime files, scores, ambience, saves, enemy VFX identities, warning timing, game menus, browser cache or manifest hashes are modified by this branch.

## Autonomous continuation
1. Perform the **real-event-path inventory** and A/B audit against the current default branch and active hero/enemy branches. Distinguish procedurally generated sounds from recorded assets and intentionally silent stages.
2. Critically compare the audible pilot to current sounds and improve/reject studies by measured/actually auditioned evidence. Adapt physical/recorded or licensed-for-use sources only with clear provenance; do not equate synth complexity with quality.
3. Integrate accepted candidates only into the **existing Game Sound Library's** review experience, with explicit original/candidate routing and contextual sample cues. Do not create a second permanent showroom.
4. Run focused source, browser, signal, offline/package and real-event checks before any proposed game-integration patch. Protect danger warning semantics, enemy miss/contact stage behavior, cold fallback, mix hierarchy, old saves and performance budget.
5. Reserve owner attention for a compact, high-value by-ear verdict and **fresh consent before merging/publishing or changing the public PWA**. No requirement for owner to troubleshoot audio tools, run scripts, collect logs or fill repetitive questionnaires.

SFX quality improvement is an owner-requested **separate creative-production activity**, not automatically a release-blocking defect for future v0.9.2 functional completion.
