# Azeroth Chronicles v0.9.0 beta — release candidate

**Not published. Acceptance and release approval are pending.** This is a prepared release candidate, not a declaration that the checklist is complete. [Issue #213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213) owns current evidence and the go/no-go decision.

## Included in the candidate

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

## Publication gate

Before merging/publishing this candidate:

1. Confirm the final source includes the accepted #227 correction and no unrelated work. Reconcile with current main and record exact head/tree.
2. Resolve remaining acceptance in #213 through evidence or an explicit author-approved beta scope/risk decision. Neither positive automation nor this document silently waives open criteria.
3. Pass the final candidate's formatting, generated/asset, full Node, Chromium, WebKit, historical-save/PWA and packaging gates. Prior v0.8.138 success alone cannot certify this version/cache change.
4. Obtain the release order for this tested candidate. Merge once, use the existing deployment workflow and only its normal identical-tree certificate reuse.
5. Verify exact live `build.txt`, build-info/cache version and all production smoke gates. Record actual release commit and workflow links. Create a release tag only at the verified commit if requested as part of publication.

At preparation, last independently verified production was **v0.8.138**, commit `6c2381b34ce63fb935936a4e69ec404996f7765a`, [main run 38091031125](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38091031125), backed by full identical-tree [run 38087706102](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38087706102). Candidate validation is recorded in its PR; v0.9 publication evidence does not exist yet.

## Rollback reference

Known verified recovery source: v0.8.138 `6c2381b34ce63fb935936a4e69ec404996f7765a`. Earlier recovery: v0.8.137 `c6ce1af236bddd7ca881903499c4cf5de175f9e2`.

If needed, prepare a forward corrective release from an accepted stable source with a fresh unique package/cache version. Validate save compatibility using copies, preserve all player exports/legacy originals, pass normal release checks and verify the published SHA. Do not clear player storage or rely on an old cache appearing automatically. No rollback is executed by these notes.
