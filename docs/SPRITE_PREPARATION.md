# Sprite production preparation

## Implemented lifecycle and pilots · v0.8.92

Three production keys are active: `hero:paladin`, `enemy:goblin` and `prop:vale-cottage:vale`. The Goblin uses Joel's explicitly accepted playful half-smile and organic ears. Paladin has a faithful two-frame idle; its static fallback is retained as a rollback revision. Native placement and desktop/phone day/night comparisons are recorded under `tools/sprites/pilots/2026-10-08-refined`. Engineer review of the idle is distinguished from Joel's actual image acceptance.

The versioned optional format supports clip rectangles/pivots/timing and stable-ID variant banks. The loader is lazy, deduplicates content, limits concurrent decodes to two and active decoded residency to 16 MiB, pins visible resources and retires obsolete revisions. Replacement, removal and rollback use expected revision leases and immutable retained originals. Atlas assembly requires a final visual review. Build/offline enumeration shares the same resource schema. Asset-scoped evidence isolates unrelated catalog/map additions. Playtest exports include sprite diagnostics.

Chat edits follow `DESIGN_TO_SPRITE_WORKFLOW.md`; `npm run sprite:asset -- "name or exact key"` exposes current originals, revision, dependent presentation and history. An authorized edit proceeds through generation, visual checks, implementation and release. Reconcile affected frames/variants together, or temporarily use the new static design. Preserve material-appropriate contours across every candidate, rather than copying accidental procedural blockiness.

The reconciled scope remains 296 decisions (280 GENERATE, 16 PROCEDURAL), 70 prepared body contracts and 28 separate terrain material candidates. This release completes the lifecycle foundation and three pilots. Remaining body production, terrain texture processing/world mapping, authored directions and additional motion clips are subsequent asset jobs. Runtime memory bounds are software checks; they do not claim a measured physical-device performance guarantee.

The following audit/preparation notes describe the earlier checkpoint and remain historical evidence.

Issue [111](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/111) has a preparation stage and a later art pilot. Joel authorized the preparation stage on 8 October 2026 and deferred creative decisions. This release supplies the working infrastructure using the existing procedural drawings and test fixtures. It generates no new artwork and activates no production sprite. Joel has no commands, image processing, anchor checks, Git operations or deployment work to perform.

## Owners and source of truth

`GRAPHICS_OVERHAUL_PHASE1.md` governs canon. `GRAPHICS_CANON_SPRITE_PROMPTS.md` remains the single authored open prompt catalog (currently 296 decisions). `sprite:catalog` parses its IDs, cues, prompts, status and source hashes, verifies its explicitly reviewed 280 GENERATE / 0 ALIAS / 16 PROCEDURAL partition, and does not keep another handwritten catalog. The initial roster is historical.

`tools/sprites/specifications.json` owns prepared runtime bindings, reference canvases, display/anchor parameters and provisional budgets. The original three pilot contracts are prepared: Paladin (001 / hero:paladin), melee Goblin (016 / enemy:goblin), and Vale cottage (061 / prop:vale-cottage:vale). These remain pilot references; Joel accepted their design direction with a Goblin face correction, while final grounding and registration remain pending. The 8 October scope reconciliation adds 67 exact contracts (70 total) for new structures, Full camps, omitted enemy states and environmental bodies. Other catalog entries need their own verified runtime binding before processing; missing/variant keys reject rather than substitute.

The 192×192 transparent reference canvas maps 1:1 to logical display pixels, with the drawn ground origin at (96,144), anchor (0.5,0.75). It is padding around the original procedural silhouette, not a larger character/building. Label clearance is derived from `Visuals.height`. Context scenes use the actual renderer and platform camera selection. Collision, coordinates, animation, shadows, labels, overlays and lighting remain engine-owned.

`tools/sprites/approved.json` is the single authored approval/provenance owner. It is empty. Runtime manifest entries derive from its records and are checked for exact agreement. A record holds retained-source/output hashes, actual dimensions, alpha bounds, catalog and canon hashes, processing choices, and recorded creative approval. The manifest retains its existing top-level production contract and is byte-identical to v0.8.84.

## Engineer workflow

These commands are for the implementing agent, not instructions for Joel:

| Command | Result |
| --- | --- |
| `npm run sprite:catalog` | Machine-readable current prompt catalog |
| `npm run sprite:contracts` | Prepared exact keys, current source references and geometry |
| `npm run sprite:inspect -- image.png` | Decode, source/hash/alpha/padding/size report; rejects invalid input |
| `npm run sprite:prepare -- hero:paladin image.png png` | Immutable source, processed candidate, canonical reference and pending review record under ignored `_sprite-work` |
| `npm run sprite:showroom -- candidate.json` | Local comparison under ignored `_sprite-preview` |
| `npm run sprite:showroom -- enemy:goblin` | Procedural preparation preview without any candidate or decision request |
| `npm run sprite:publish -- candidate.json` | Only a record with actual creative approval recorded by the engineer can enter production |
| `npm run sprite:check` | Verify approved source/output provenance, exact manifest agreement and current memory budget |

The developer server serves `/_sprite-preview/index.html` after showroom preparation. Candidate canvases show actual-size checkerboard comparisons, anchor/name guides and an opacity overlay. Eight reproducible context views cover 1280×800, 375×812, 320×568 and 844×390 in both day and night. Both animation clocks are fixed at 16 seconds; the simulation is not ticked. Game shadows, labels, atmosphere and entity motion use the actual presentation owners. The showroom has no approval button and writes neither player storage nor production registries. Generated preview files, tool dependencies, source masters and fixtures do not enter the deployment inventory.

Preparation preserves original source bytes. Matching-size PNG encoding preserves decoded pixels. WebP is lossless; invisible RGB channels may differ where alpha is zero. Explicit resizing uses the recorded nearest kernel and the contract canvas; aspect mismatch, implicit cropping, trimming, rotation and color conversion are rejected. A future art source needing a different canvas, resampler or explicit color normalization requires a reviewed specification update and fresh comparison, not silent processing.

Before the art pilot, capture the exact current canon and generate one isolated transparent asset at a time with ChatGPT image tools. The engineer prepares it, checks technical quality, and presents concrete comparisons. When Joel approves appearance in chat, the engineer records that decision and the candidate hash in the issue/PR, then supplies the linked record to publish. A GitHub approval reference is a traceable record; CI cannot infer artistic fidelity or independently authenticate a conversation. No technical approval is assigned to Joel.

Publication preflights validation, source immutability, paths and budget. It retains the original approved source under `tools/sprites/sources`, copies the processed image into `assets/sprites`, derives the runtime entry, and restores metadata/binaries if the write/check fails. Existing approved files cannot be overwritten by this command; replacements need their own reviewed migration. Source/catalog changes invalidate stale approvals until comparison is renewed.

## Binary delivery and loading

The GitHub Git-data API supports base64 binary blobs separately from UTF-8 tree entries. `tests/fixtures/sprite-reference-paladin.png` is an actual transparent drawing rendered from current canon, not placeholder text or proposed new art. Its binary round-trip is verified against the local hash when the preparation branch is uploaded. This proves binary transport with the current connection. The later image-tool-to-approved-art chain remains a pilot task; a procedural fixture does not claim that it has occurred.

Tests process this real PNG, load it through the actual sprite module, publish/package it only in an isolated checkout, and keep the production registry untouched. Chromium additionally serves the real PNG through a test-only manifest, observes successful game Canvas drawing, and reopens the phone entry offline under a project subpath with query strings and retained crowns. Existing empty/populated service-worker tests retain duplicate references, missing/fetch-failed installation behavior, version activation and unrelated-cache retention. Actual failing images retain procedural fallback through the existing renderer tests. Registered-image failure still rejects installation; this preparation does not change update policy.

The current production loader eagerly decodes registered images and keeps key-level image instances. Its behavior is unchanged. The three-entry pilot is bounded: each reference decodes to 147,456 bytes. Validation reports unique image paths while budgeting each key-level decoded instance, including duplicate references. It limits outputs to 512 pixels per dimension/1 MiB encoded, sources to 4,194,304 pixels/16 MiB encoded, and current registry pixels to 16 MiB decoded. These are provisional engineering gates, not a measured physical-phone memory or frame-rate guarantee. No atlas, lazy loader, compression redesign or performance claim is introduced before real volume/device benchmarks justify one.

## Deferred work

Issue 111 remains open. The preparation stage is ready only after final CI and live verification. Its art pilot still needs: image-tool generation from current references; three canon-faithful appearances; Joel's creative approval; integration of approved images; real pilot decode/memory measurements and any justified loading change; final sprite/offline Pages verification. Bulk production waits for that evidence. No new account or subscription is currently required.

## Current pilot lessons and scope reconciliation

See SPRITE_PRODUCTION_CURRENT_CONTEXT.md and SPRITE_SCOPE_RECONCILIATION.md. The inventory is open and current references outrank old prompts. The parser reads a reviewed totals declaration rather than imposing 231/221 forever; it still rejects missing IDs, ambiguous decisions and unreviewed count drift. Generation references omit presentation-owned shadows, camp ground patches and actor/guard ground chevrons without modifying production visuals; ordinary canonical references and actual gameplay captures retain them. Image inspection reports low-alpha pixels and separate material bounds so faint generator artifacts cannot masquerade as silhouette size. Retain original image-tool sources and record any explicit padding before preparation; never silently erase alpha or crop.

Joel accepted the pilot designs on 8 October, except that the Goblin face needs correction. The wide pale triangle must not become a grin or a face mask. Paladin and cottage appearance acceptance does not certify technical placement. Reprocess against current prompt hashes and tune native-size grounding before registering images. Whole-catalog generation remains paused during scope reconciliation.

Terrain texture scope is documented separately in GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md (28 candidates). Opaque seamless textures cannot use this transparent body processor unchanged; their dedicated validation/registration and clipped world-space rendering must be proven in the five-ground pilot. Natural scenery must retain deterministic placement and actual variant references; see environment-scope.json and SPRITE_SCOPE_RECONCILIATION.md.

For new content, follow DESIGN_TO_SPRITE_WORKFLOW.md and its repository handoff template. Procedural-design acceptance, sprite-production authorization and generated-image acceptance are separate recorded facts. Preserve accepted references across chats and reconcile only affected designs when content changes. The lifecycle audit records required replacement, bounded loading and animation upgrades before bulk integration.
