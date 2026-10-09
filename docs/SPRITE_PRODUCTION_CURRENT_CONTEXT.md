# Sprite production checkpoint · 8 October 2026

## Structure proportion implementation checkpoint · 9 October 2026

An initial *presentation-only* structure size pass and an original-master export-budget update are being verified in the proportion implementation PR. See [PROPORTION_IMPLEMENTATION_CHECKPOINT.md](PROPORTION_IMPLEMENTATION_CHECKPOINT.md). It keeps all world boundaries, enemy counts, pack homes, entrances and campaign saves unchanged. It is not yet the final detail-rich sprite production or a claim that zone overcrowding is solved; native-size reviews must precede individual replacement approvals.

## Current prerequisite: spatial proportion and encounter-density audit · 9 October 2026

Joel expanded the pre-sprite pass to cover houses, dwellings/interior-linked entrances, all trees including the Abandoned Orchard, all zone transports and Dark Lord oppressive structures. Review their relative size and detail, generally assessing +25–50% world-display size where appropriate. **Before final exports for these items**, follow [WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md](WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md): first declutter and redistribute into suitable unused edge areas of existing maps; only then consider minimal directional boundary expansions. Changing zone size can alter outdoor pack distribution; preserve encounter pacing and existing monster populations, avoid new enemy-production work, verify travel routes, collision, transitions, saves and actual 150% appearances. Do not blindly scale every map. This is an authorization and testing gate, not evidence that any bounds or placements are already changed.


## Current resumed production · 9 October 2026 02:08 EDT

Joel explicitly resumed artwork adaptation, generation, implementation and publication overnight. Complete adaptation of retained sources to the selected 150% camera, then continue the remaining body and texture catalog. The agent owns technical and native appearance checks; no additional approval round is needed. Preserve originals, checkpoints, accepted identity, organic/material-appropriate shape cues, gameplay geometry and rollback history. Production batch: `2026-10-09-150-adaptation`; its journal and per-asset evidence must accompany the verified implementation. Start with Paladin/Goblin and affected Paladin idle frames, then all retained active sources.

Joel clarified the source policy at approximately 02:10 and requested GitHub documentation at 02:22 EDT. Read [SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md): use untouched generator outputs of accepted revisions for fresh 150% exports; never enlarge the smaller 100% runtime exports. Audit old padded/resized masters and rebuild from original pixels where an intermediate discarded detail, retaining only required placement information. Verify each original and its sizing/placement, review the actual in-game result, and simplify or regenerate if detail still reads poorly. This is required work, not evidence that every asset has already passed. Earlier pauses below are historical and do not override this authorization.

## Historical pause and housekeeping · 9 October 2026

Joel selected 150% and requested housekeeping before adapting existing artwork. Generation, adaptation, replacement and additional asset publication remain paused. v0.8.103 prepares density-aware processing, native desktop/phone review and unchanged runtime geometry, without editing the 33 active keys or historical originals/checkpoints. Read SPRITE_RESOLUTION_HOUSEKEEPING.md and CAMERA_SPRITE_TARGETS.md; run sprite:resolution before the later Paladin/Goblin adaptation pilot. Earlier resumes below are historical authorization within their old scope, not the current instruction.

## Historical resume snapshot · 9 October 2026 UTC

Joel's current instruction explicitly resumes full generation, implementation, testing and publication. Both original interruption checkpoints remain untouched: `checkpoint/sprite-production-paused-2026-10-08` and `recovery/nature-paused-2026-10-08` (277-file save at cde13b483614fe83bfb97887e509cee67fd5fa40). The older chronological sections below record past stages, not the latest active counts.

PR #121 was verified merged and deployed before new integration. PR #127's saved 20 nature bodies are live at 3b3fbdfd99771c0a69b4e7e4512a9b8580dc5e0d, exact deployment run 37864875566. The terrain pipeline was completed in #123 before terrain material production. PR #126 reconciled all five saved ground textures with the nature release and merged at d5f37905980767b7fb7b8806a51745182371c49b, but its main deployment was blocked by a frame-level mana assertion. No deployment success is claimed for that run.

PR #128 passed full exact-head CI run 37868208872 and merged at 4c508e6c383973634f723641d4df210275c822e2. It retains the five ground materials and adds native-reviewed Highlands heather and Vale/Highlands field rock: 30 body keys. Its exact-SHA deployment is pending. The browser fixture now captures MP at the real native-input cast boundary before legitimate regeneration; all original mana, damage and cooldown assertions remain. Local full matrix passed 224 checks, and WebKit/full remote checks passed. Gameplay rules are unchanged.

Prepared v0.8.100 adds the mint press, ore sorting bins and loaded caravan cart: 33 body keys, 34 packaged sprite resources, 146251 sprite bytes and 5025920 unique decoded bytes. Five terrain materials remain 507307 packaged bytes with a 2 MiB residency limit. Eight desktop/phone day/night native comparisons passed per object; the six real Highlands bindings are recorded in `tools/sprites/batches/2026-10-09-05/live-binding-audit.json`. Full regressions and release CI/deployment remain the next gate. Immutable generated masters, superseded gold-handle mint image, exact prompts, full-alpha normalization and rollback records are retained.

Held: the mine marker's native instances have `sceneRole`, so the contextual furnishing guard is preserved and its generated source is saved without an unused active registration. Grass/wet-grass/reeds need complete authored height banks; no incomplete bank is active. The latest grass attempt has a bright fringe and is retained as rejected. Batch 07 begins the next eligible household/flight props. Remaining body catalog and 23 terrain materials are still open; this is not catalog completion. Existing Goblin correction, Paladin idle and prior source history remain intact.

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

## Resumed production · 8 October 2026

Joel explicitly resumed generation, implementation and publication in this chat. Both interruption checkpoints are preserved. PR #121 deployment run 37777751587 was rechecked: main, WebKit, deployment, exact published SHA and desktop/phone live checks all passed. PR #127 merged the 20 saved nature bodies at 3b3fbdfd99771c0a69b4e7e4512a9b8580dc5e0d after successful exact-head run 37809052731.

This v0.8.98 continuation reconciles the five retained ground materials from PR #126 with all 27 body registrations from #127. Duplicate Vale bush/wildflower records retain #127 active revisions; the other candidates and sources remain historical. No generated image has been recreated. Both original checkpoint branches remain untouched. Remote checks and exact live deployment remain pending. Next: verify this recovered stage, correct held heather/grass and preserve exact seeded reed/rock variants, then continue the open catalog.

## Held nature corrections · prepared v0.8.99

PR #127 exact merge 3b3fbdfd99771c0a69b4e7e4512a9b8580dc5e0d passed deployment run 37864875566, including all regressions, device matrices, exact published SHA and live smoke. The five saved grounds are reconciled in #126 v0.8.98; its final release checks remain pending.

This stage adds native-reviewed four-stem heather and the retained Vale/Highlands field rock, bringing active body keys to 30. Both correction attempts and the fresh heather master are retained. Alpha is preserved throughout full-canvas normalization; no hidden trim, clipping or color deletion. Heather grounding and all eight day/night device contexts were inspected. Existing Goblin, Paladin clips and rollback sources remain intact.

The field-rock handoff was inaccurate: the live icon-rock branch executes before wildProp and is fixed across seeds/regions. Two hundred exact identity references were pixel-identical. Catalog IDs 295/296 now describe that branch; the saved Vale art is reused without inventing moss. Grass/wet-grass/reeds do have authored height variants. Optional validated procedural-modulo selectors now map the same identity hash to explicit stable IDs, preserving slots across reordering and replacement. Tests cover 1,000 identity samples and malformed selectors. Existing variant banks keep their selection policy. No incomplete grass/reed bank is active.

The development-only sprite-batch-review helper records immutable originals, explicit sizing/padding/root translation and native comparison crops with full-scene hashes. Candidate review and publication remain separate. Further grass corrections and height-bank generation are in progress; this is not completion of the catalog.

End-to-end 150% workflow audit: `SPRITE_WORKFLOW_AUDIT.md`. Developer publication now journals sprite/terrain registry pairs and validates retained sprite history. New planning captures use `sprite:request`; this does not resume image production.
