> **Prepared-work release authorized by Joel, 8 October 2026 at 11:22 America/New_York.** Release the five completed ground materials and two reviewed flora sprites. New generation and remaining mass production stay paused. The [saved checkpoint](SPRITE_PRODUCTION_PAUSED_2026-10-08.md) remains historical recovery evidence.

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

## Regional ground stage, v0.8.96

T001–T005 are reviewed and locally registered after terrain pipeline completion. Original tool images remain opaque and unmodified, with explicit Lanczos resizing to 256² and no seam repair. Eight actual scene comparisons per material passed engineer review; source/output hashes and rollback targets are in the material registry. Stage release pending. No terrain production is claimed complete: roads, floors, rock/lava surfaces and bridge grain remain queued. Total image calls remain 16.

## Prepared-work release authorization

Joel asked to implement what is already done to reduce pending work. v0.8.96 includes T001–T005 ground materials plus Vale bush and wildflowers, using retained candidates and reviews with no new image calls. Grass and seeded rock variants remain pending. Nine body keys and five materials are registered in this release draft. Goblin v0.8.95 is verified live at merge `0d02d355ce4f59ab83df24fe6fc0f88ea72478b5`, successful deployment run `37789504897`. This release awaits remote CI and exact live deployment. Total image calls remain 16.
