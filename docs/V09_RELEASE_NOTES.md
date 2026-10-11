# Azeroth Chronicles v0.9.0 beta — published

**Published to GitHub Pages and live-verified on 11 October 2026 UTC.** The released `main` commit is [d7d2c22485b08265b31bf595305ef952b40b72cd](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/d7d2c22485b08265b31bf595305ef952b40b72cd), merged through [release PR #229](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/229) and verified by [production workflow 38100402483](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38100402483). The published `build.txt`, version metadata and service-worker cache match v0.9.0. See the [production verification record](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213#issuecomment-6104016838).

Publication was explicitly authorized with the remaining beta-testing gaps retained as follow-up work. At publication, **7/13 acceptance criteria were verified; six remain unverified** in [beta acceptance #213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213). A successful release does not certify a complete natural campaign playthrough or physical-device acceptance.

## Included in v0.9.0 beta

- Five-region single-player campaign in the multi-file installable web app, with distinct desktop keyboard/trackpad and phone touch presentation.
- Integrated road infrastructure, restored independent transport departure scenes, regional dungeon work and quest/specialist progression updates.
- Combat-condition corrections; persistent equipment selection; hero-only preparation-tonic effects; and boss charges ending correctly when blocked by a wall.
- Cooldown-based combat, companion training and recovery, and Standard/optional Succession progression with compatible v4 save keys and retained v2 backup import.
- Auto / 30 / 60 FPS rendering preference. Auto begins at 30, can promote to 60 with headroom and reduces rendering frequency under sustained slowdown. Simulation, input and audio retain their existing update path.
- Scoped rendering, audio and offline-cache optimizations. Component measurements do not establish a universal whole-game FPS or battery improvement.
- Corrected Thornfang Pounce and Stone Colossus Wall Rush descriptions. Pounce retains 0.375 seconds of normal recovery after a hit or miss; Wall Rush retains three seconds of core exposure after the charge ends. No new pillar requirement, vulnerability state or balance change.

## Saves and known limitations

Campaigns remain local to each browser/device. Export before clearing browser data or moving to another device. There is no cloud save service or playable co-op. Sprite production continues; paused #217 is not included.

Joel reports that his ongoing saves have survived major updates throughout development without corruption or needing to restart. Existing automated migration/PWA checks also provide technical evidence. A copied genuine historical player export/import round trip has not yet been independently validated.

Full natural campaign and late-game acceptance are incomplete. Browser emulation and bounded action pilots do not certify physical input comfort, installed offline behavior, sustained device memory/temperature/performance, or a complete player journey. Those are outstanding acceptance checks, not reported proof of broken gameplay.

## Published release evidence

- The author approved release with explicitly documented beta follow-ups on 10 October 2026 (Eastern time). [release PR #229](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/229) was merged at the tested release tree `0e36da9718e65f466e414a7d94f55905099543b8`, producing production commit [d7d2c22485b08265b31bf595305ef952b40b72cd](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/d7d2c22485b08265b31bf595305ef952b40b72cd).
- [production workflow 38100402483](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38100402483) succeeded in release-plan, main-test, phone-webkit and deploy. Its evidence includes **99 Node regression suites**, desktop/mobile Chromium, phone WebKit, historical-engine save/PWA upgrade coverage, packaging and live smoke paths.
- Independent live HTTP verification reported `build.txt` at the production commit above, `src/prototype/build-info.js` version **0.9.0**, and `sw.js` cache **azeroth-app-v0.9.0**. See the [exact release and deployment evidence](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213#issuecomment-6104016838).
- The post-release [beta acceptance #213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213) remains open with **six unverified criteria**, grouped into natural campaign/late-game play (two criteria), a genuine historical player-created save export/import (one), and actual-device controls, installed-PWA/offline/update and sustained performance/memory (three). These are **not** marked PASS by automated release checks or by the publication decision.

## Historical candidate preparation (superseded)

On 10 October 2026, before authorization and deployment, these notes described an unpublished candidate and listed pre-publication gates. At that point, v0.8.138 (`6c2381b34ce63fb935936a4e69ec404996f7765a`) was the previously verified production baseline. The later verified v0.9.0 publication above supersedes that status; retain the earlier candidate and test records through [release PR #229](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/229) and [beta acceptance #213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213) rather than treating their hold instructions as current.

## Rollback reference

Verified pre-release recovery sources: v0.8.139 `ea7bd4193d18762d343cd93260351cb29fcb6739` and exact-tree recovery `99bd657f844a13594cfbffd87925d3ea0905c4c5` ([successful recovery run 38097888583](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38097888583)). Earlier verified v0.8.138: `6c2381b34ce63fb935936a4e69ec404996f7765a`.

If needed, prepare a forward corrective release from an accepted stable source with a fresh unique package/cache version. Validate save compatibility using copies, preserve all player exports/legacy originals, pass normal release checks and verify the published SHA. Do not clear player storage or rely on an old cache appearing automatically. No rollback is executed by these notes.
