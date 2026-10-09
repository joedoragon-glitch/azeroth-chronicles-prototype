# Sprite production checkpoint · 8 October 2026

## Implemented lifecycle and pilots · v0.8.92

Three production keys are active: `hero:paladin`, `enemy:goblin` and `prop:vale-cottage:vale`. The Goblin uses Joel's explicitly accepted playful half-smile and organic ears. Paladin has a faithful two-frame idle; its static fallback is retained as a rollback revision. Native placement and desktop/phone day/night comparisons are recorded under `tools/sprites/pilots/2026-10-08-refined`. Engineer review of the idle is distinguished from Joel's actual image acceptance.

The versioned optional format supports clip rectangles/pivots/timing and stable-ID variant banks. The loader is lazy, deduplicates content, limits concurrent decodes to two and active decoded residency to 16 MiB, pins visible resources and retires obsolete revisions. Replacement, removal and rollback use expected revision leases and immutable retained originals. Atlas assembly requires a final visual review. Build/offline enumeration shares the same resource schema. Asset-scoped evidence isolates unrelated catalog/map additions. Playtest exports include sprite diagnostics.

Chat edits follow `DESIGN_TO_SPRITE_WORKFLOW.md`; `npm run sprite:asset -- "name or exact key"` exposes current originals, revision, dependent presentation and history. An authorized edit proceeds through generation, visual checks, implementation and release. Reconcile affected frames/variants together, or temporarily use the new static design. Preserve material-appropriate contours across every candidate, rather than copying accidental procedural blockiness.

The reconciled scope remains 296 decisions (280 GENERATE, 16 PROCEDURAL), 70 prepared body contracts and 28 separate terrain material candidates. This release completes the lifecycle foundation and three pilots. Remaining body production, terrain texture processing/world mapping, authored directions and additional motion clips are subsequent asset jobs. Runtime memory bounds are software checks; they do not claim a measured physical-device performance guarantee.

Read `SPRITE_SCOPE_RECONCILIATION.md`, `DESIGN_TO_SPRITE_WORKFLOW.md` and the refined pilot inventory before continuing. Original drafts under `tools/sprites/pilots/2026-10-08` remain historical references; the old awkward Goblin is superseded. Keep catalog IDs stable and add reviewed exact contracts for future content.

## Staged continuation · prepared v0.8.94

PR #121 is merged at `5bdfa149905290a1f14d8f06b966cf619ffec213`. Workflow run [37777751587](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/37777751587) passed main regressions, WebKit, deployment, the exact published SHA check and live desktop/phone smoke paths before any new registrations.

The first continuation batch adds exact contracts and engineer-reviewed static registrations for Mage, Ranger, Soldier and allied Goblin Archer: seven active keys total, 74 prepared contracts. Soldier shield/crest colors and Mage chest clasp were corrected against current references. The Archer retains the approved Goblin facial direction and organic ears. These new candidate reviews are authorized engineering decisions, not claims that Joel separately accepted unseen images. The three approved pilot designs and Paladin idle/rollback remain intact.

Original image-tool files, superseded candidates, explicit padding/placement records, exact references, native context crops and full-scene hashes are under `tools/sprites/batches/2026-10-08-01`. Padding preserves faint generator alpha rather than erasing it. The review harness now places allies in the party, uses the exact region and keeps non-hero bodies inside phone viewports. Static candidates have no stale dependent animation clips.

The dedicated terrain texture pipeline is implemented and verified before terrain generation; see `TERRAIN_TEXTURE_PIPELINE.md`. Its active registry is empty in this stage. Ten image calls have produced eight initial candidates and two targeted corrections. Four Vale nature candidates are retained but await native-size/seed-variant review; they are not active. No terrain image generation has occurred. The catalog remains open at 296 decisions, with 280 GENERATE and 16 PROCEDURAL entries.

The batch journal records release-pending status, exact revisions and procedural rollback targets. Finish this batch's release gates and verify its exact deployment, then process the retained nature candidates and five ground pilots. Continue the remaining catalog in small published stages, preserving seeded scenery variety and each required contextual/loadout identity. Joel asked to continue in this chat after requesting a visible burn-rate update; report generation counts at batch checkpoints. Do not claim the whole mass-production task is complete after this stage.

## Goblin native face correction, v0.8.95

Joel reported the live goblin face looked deformed after an interrupted stream. One targeted source edit simplifies the eyes, brows, nose and playful half-smile for the actual 38 × 49-pixel body. Original organic ears, equipment and palette remain recognizable. Four viewport day/night scenes and hashes are retained in `tools/sprites/batches/2026-10-08-goblin-face`. This is engineer-reviewed authorized correction, not a claim of Joel accepting the unseen new image. The prior revision remains in rollback history. Image calls: 16 total. Five ground pilots and nature candidates remain pending; no new mass-generation calls while this correction releases.

PR #123 deployment run 37784625938 succeeded at exact merge SHA `369cc42889228fb1dbfc1a54c7048deda1f051b0`, including exact live build and desktop/phone smoke checks.

## Historical interruption recovery · local preparation before concurrency reconciliation

PR #123 is merged at `369cc42889228fb1dbfc1a54c7048deda1f051b0`. Workflow run [37784625938](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/37784625938) passed main regressions, WebKit, deployment, exact published SHA and live desktop/phone smoke. Its actor batch and dedicated terrain pipeline are released.

The interrupted checkout also held five generated regional ground candidates (T001–T005) and padded bush/wildflower/rock candidates. These were recovered unchanged before further generation. Ground references, prompts, immutable originals, lossless processed tiles, seam measurements, 3 × 3 wraps and desktop/phone day/night scene hashes are retained under `tools/sprites/batches/2026-10-08-terrain`. All five ground pilots are now engineer-reviewed and registered locally. The actual five-image scene probe decoded 1,310,720 bytes, peaked at two concurrent decodes and drew 266 clipped material passes with zero failures; this is software evidence, not a physical-device performance claim.

The next body stage registers Vale bush and wildflowers plus eight new exact decoration bodies: sapling, stump, fallen log, cattails, driftwood, mangrove, pine sapling and alpine scrub. There are 17 active body keys and five material keys locally. These decoration branches have fixed bodies across seeds; existing seeded placement and density are unchanged. Full-canvas sizing, transparent padding and explicit root translation preserve native footprints. Originals, prompts, native comparisons and four viewport day/night hashes are under `tools/sprites/batches/2026-10-08-02` and the recovered first batch. The seeded field rock and grass candidates remain pending until their variation is reconciled. No broad `wild` family is flattened into one generic image.

Eight new calls in this recovered chat produced the second nature batch; eleven additional individual environment jobs were started and are being retained/reviewed under `2026-10-08-03`. They are not active in v0.8.95. No candidate inherits user appearance acceptance; every review distinguishes authorized engineer implementation from Joel's image feedback. Follow the catalog's one-completed-request-at-a-time instruction for further image generation. Preserve original accepted Goblin/Paladin/cottage revisions and animation.

This is another staged release, not completion of the 280-body/28-material open inventory. That local preparation was superseded by the concurrency reconciliation below. Re-read main before each later release to preserve concurrent work and chat corrections.



## Concurrent nature batches · prepared v0.8.97

Joel confirmed he is running two chats to speed production. This checkout owns nature body batches 02 and 03. The other checkout owns the Goblin correction (#124, merged at `0d02d355ce4f59ab83df24fe6fc0f88ea72478b5`) and the five ground-material pilots in its v0.8.96 stage. The nature change carries the corrected Goblin registration and complete rollback history. Ground registrations and terrain evidence from this checkout's earlier local commit were removed from the publication diff to avoid duplicating the other continuation.

Twenty new body registrations are prepared: recovered Vale bush/wildflowers, eight batch-02 bodies, and ten batch-03 bodies covering marsh bush, Highlands rock cluster, Frontier dead tree/charred stump/dry scrub/burned log, and Crown black rock/crystal cluster/dead shrub/obsidian. Total active body keys: 27, with 28 resources including the retained Paladin animation atlas. Packaged sprites: 112,310 bytes; decoded resource census: 4,288,640 bytes. The runtime's 16 MiB residency and two-decode limits remain unchanged. All new bodies correspond to fixed decoration branches; seeded positions/density and procedural shadows/scene effects remain authoritative. Static entries introduce no obsolete animation clips.

Generation counts for this checkout: eight batch-02 requests, eleven batch-03 requests, and one targeted heather correction. Heather is held because the corrected source still has a colored fringe; both originals are retained. Grass, reeds and the recovered field rock remain pending their exact seeded variants. Earlier batch requests overlapped before the sequential workflow instruction was caught; all subsequent generation is one completed request at a time.

No separate user image acceptance is claimed. Authorized engineer review retains isolated references, originals, normalization details and four viewport day/night evidence for each active entry. The batch journal is `tools/sprites/batches/2026-10-08-03/production-journal.json`. Local v0.8.95 checks passed 51 regression suites and WebKit phone/material paths; Chromium's first full run reached a Recall assertion at 980 × 1740, so v0.8.97 must complete fresh build/check/regression/device gates before publication. This stage is not completion of the open catalog. Next: publish the tested nature stage after reconciling main, verify exact deployment, then continue held and remaining entries.


## Completed-assets publication authorized · 8 October 2026

Joel authorized implementing only the already-completed work after the pause. Publish these 20 reviewed nature registrations as v0.8.97, preserving the Goblin correction and rollback history. New generation and unfinished candidates remain paused. Final local build/format/registry checks passed, along with 51 regression suites, 224 desktop/mobile Chromium checks and five WebKit phone viewport paths. No remote release is claimed until PR CI and exact live deployment pass. Terrain materials remain owned by the separate continuation and are not activated by this nature release. After publication, update issue #125 with the release evidence; leave the remaining catalog and held variants paused.
