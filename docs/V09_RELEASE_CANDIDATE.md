# v0.9 beta release preparation — 10 October 2026

**DRAFT / NOT RELEASED.** Owner: [readiness #213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213). This document prepares the release work; it does not close missing acceptance or authorize publication.

## Verified baseline and scope

Production v0.8.138, commit `6c2381b34ce63fb935936a4e69ec404996f7765a`, tree `d5616558097655755e581d75f4707a1571b03c24`.

- Full identical-tree validation: [38087706102](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38087706102), successful Node/Chromium/WebKit and packaging. This is the existing 98-suite release evidence, not a newly executed full run.
- Main deployment: [38091031125](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38091031125), successful. Reused exact-tree certificate, rebuilt with main SHA, deployed and ran the live gates.
- This audit independently fetched HTTP 200 `build.txt`, build-info, service worker, runtime.js, app.js and data.js. Published SHA matched; the five versioned/runtime files matched checkout bytes. See `evidence/v09-readiness-20261010/live.json`.
- Boss choice is **already resolved**: [#227](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/227) implements author-approved description corrections. Do not ask Joel the same choice again. At this record's creation it is an unmerged v0.8.139 candidate, not production.
- #217 remains paused; #132, #197 and #198 remain deferred. Sprite completion and co-op are outside the v0.9 gate. Preserve all branches and originals.

## Work completed in this follow-up

1. Reconciled the 13-row checklist with current code, tests, production and the newer #227 decision.
2. Inspected progression coverage: the existing six combined campaign fixtures seed 50,000 crowns and force boss deaths. Their rescue/training/equipment/save assertions are useful, but not proof of an unassisted whole campaign.
3. Added an observational fresh-start action pilot, `scripts/beta-natural-progression-audit.cjs`. It uses normal movement/attack commands, real elapsed simulation, actual construction, earned rewards and public player actions. No resource/stat/position injection, forced kills, disabled enemy updates or modified balance. The fixed random source is an explicit simulation control. It clears transient presentation effects between ticks as the shell consumes them. It is not a physical/UI playthrough and not an old player save.
4. Tested earned-state save restoration after the initial route where completed: crowns, XP/level, skills, equipment, quests, living/fallen companion HP and preservation of the original snapshot. Three of six early-route pilots completed the route and earned-state save check (Normal Ranger; Nightmare Mage/Ranger). Normal Paladin/Mage and Nightmare Paladin stopped after a death during the route. These are bounded bot outcomes, not six campaign passes or proof of a balance defect. Individual output files record incomplete attempts honestly. The pilot's first extended Ranger attempt did not beat Thornfang; an inadequate bot is not proof of a gameplay defect. No balance was changed.
5. Replayed all 28 existing boss-contract cases on the exact production mechanics: Pounce 0.375-second recovery/no exposed opening; Wall Rush three-second opening, both modes/forms and relevant hit/miss/immune/obstacle cases.
6. Independently compared #227's data object against production: restoring exactly its two approved description strings makes the complete data object deeply equal. Rules, engine and boss resolver have no changes. Flagged its initial protected-data-hash CI failure on the existing PR; the owning workstream subsequently published a correction. Final green CI remains required.

Reproduction: `node scripts/beta-natural-progression-audit.cjs normal ranger` (replace mode/class); optional `--boss-attempt` retains the explicitly bounded exploratory attempt. Outputs default to `test-results/readiness`; use `BETA_NATURAL_OUTPUT` to choose an output directory. Review `checkpointResult` and event outcomes, not merely process exit: this is an observational audit, not a release-pass test.

## Remaining acceptance and responsibility

| Area | Evidence still needed | Owner |
| --- | --- | --- |
| Complete earned campaign | A real continuous path through specialist rescues, quests, companion management, equipment purchases and onward travel, including Abyss/Eren and final encounters. Existing seeded checkpoints and the early action pilot do not complete this. | Engineering can analyze a genuine progressed save and investigate defects; Joel supplies actual play experience/acceptance. Do not require a replay of already completed and documented play. |
| Boss contract integration | Corrected #227 exact-head CI, merge and verified publication; retain original failed run. | Existing #227 workstream; no further creative choice. |
| Historical saves | A copy of an actual player-created older v4 export, with approximate origin version/date/class/region. Import in isolated storage, compare state, export/reimport, preserve original bytes. | Joel provides export; engineering executes and records comparison. |
| Real phone and desktop | Physical controls, portrait/landscape and menus, full-party/trap/boss/Abyss handling and representative sustained performance. | Joel: short physical checks below. |
| Installed PWA | Install/launch, offline cold reopen and save retention; online update with unchanged player progress. | Joel supplies physical behavior; engineering handles automated/code checks. |
| Final v0.9 | Integrate accepted source and prepared notes, version/build, exact candidate gates, approval, publish and verify live SHA/cache. | Engineering; publication requires Joel's release order. |

## Short physical-device worksheet

Back up the current campaign first with **Game and settings → Save and game management → Export**. Keep that original export; test imports in a separate browser/profile so the live campaign is not overwritten.

On the actual iPhone and target desktop/Chromebook, record device/browser and the version shown in the game/playtest report. Test the final accepted stabilization build:

- Play 10–15 minutes with a full party: movement, target cycle/hold lock, quick/charged skills, one representative trap/boss, regional transport and a dungeon entrance/exit. Include Abyss hatchery/service return routes when accessible. Record stutter, freezing, reloads, heat or uncomfortable controls. Do not claim the whole campaign from this short smoke pass.
- Open inventory, journal, map and settings; scroll and return to play. Rotate the phone both ways. On desktop use keyboard/trackpad and one binding change; restore the preferred binding afterward.
- Try Auto, 30 and 60 FPS under **Screen and performance**, then return to the preferred setting. Check that movement, combat and audio feel consistent. Export a playtest report after an active scene; it includes local performance samples.
- Install/open the PWA, wait for online loading, close it, enable airplane mode and reopen it. Confirm the same campaign loads and is playable. Reconnect, run the in-game update check/relaunch and compare class, level, crowns, gear, companions and quest state. A physical update transition needs an actual newer published version; do not clear storage or downgrade merely to manufacture it.

Reply format: device + build; controls/menus; full-party combat/travel; offline reopening; update/save retention; stutter/heat/reload issues. Attach the original exported save and playtest reports. State which campaign milestones you have already completed naturally, and any unfinished ones.

## Proposed player release notes — publish only after acceptance

**Azeroth Chronicles v0.9 beta**

- Five-region single-player campaign in the installable desktop/phone web app, with distinct keyboard/trackpad and touch presentations.
- Integrated roads and restored transport departure scenes; regional dungeon, quest and specialist progression updates.
- Equipment selection, preparation-tonic inheritance and blocked boss-charge corrections.
- Cooldown-based combat, party progression and compatible v4 saves, including retained v2 backup import.
- Auto / 30 / 60 FPS presentation setting and scoped rendering/audio/offline-cache optimizations. Gameplay simulation remains independent of the render-frequency preference.
- Thornfang Pounce and Stone Colossus Wall Rush descriptions aligned with their existing mechanics **once #227 is integrated**.

Known limits: saves remain local to each browser/device; export before clearing browser data or moving devices. No cloud saves or playable co-op. Artwork production continues; the paused sprite batch is not included. Physical performance varies by device. Replace acceptance-pending statements with actual results before publication; do not publish this draft as a completion claim.

## Final release sequence and rollback reference

1. Confirm #227's accepted integrated head and the completed acceptance evidence in #213. Reconcile this draft with actual results. Refresh main and the open-PR inventory; do not merge unrelated art/co-op.
2. Prepare one v0.9.0 branch/PR from accepted main: update package/lockfile and current status/README/release notes; run the canonical build so build-info and service-worker cache are generated together. Do not bump production early.
3. Run focused checks for any new fixes, then full exact integrated-candidate CI once. Preserve Node, Chromium, WebKit, historical-save/PWA and clean-packaging gates. A runtime/version change requires its own validated tree; v0.8.138 success cannot certify it.
4. Present the tested head, release notes and remaining risks for explicit publication approval. Merge once with an expected-head check; deploy through the existing workflow. Use exact-tree reuse only when its normal certificate checks permit it.
5. Verify successful production jobs, exact published `build.txt`, build-info/cache v0.9.0 and existing live smoke gates. Record the final SHA/run in #213 and release notes. A release tag, if created, must point to that verified commit.

Verified stable source to recover: **v0.8.138 `6c2381b34ce63fb935936a4e69ec404996f7765a`**, release run 38091031125. Earlier preserved fallback: v0.8.137 `c6ce1af236bddd7ca881903499c4cf5de175f9e2`.

If rollback becomes necessary, prepare a forward corrective release from the stable source with a new unique package/cache version, validate save compatibility using copies, run required checks and verify its actual published SHA. Preserve player exports and original legacy backups; do not erase storage or assume an old service-worker cache will safely roll users back. No rollback, merge, tag or v0.9 deployment is performed by this preparation.
