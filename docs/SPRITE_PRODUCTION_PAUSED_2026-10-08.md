# Historical interruption checkpoints

Joel resumed full production on 8 October 2026. The pauses below are retained historical records; the current context owns the next action. Both original remote branches remain unchanged.

# Sprite production — paused 8 October 2026

Joel explicitly stopped production because repeated ChatGPT streaming/loading/transport failures made unattended work unreliable, then requested this GitHub checkpoint. **Do not resume generation, implementation or publication until Joel asks.** This branch is a preservation checkpoint, not a release PR; do not merge it merely to save the work.

## Verified live

- PR #121 v0.8.92 merged and deployed before further registrations: merge `5bdfa149905290a1f14d8f06b966cf619ffec213`, successful deployment run `37777751587`.
- PR #122 environmental sound retained through subsequent changes.
- PR #123 v0.8.94: Mage, Ranger, Soldier and Archer body sprites plus completed terrain texture pipeline. Merge `369cc42889228fb1dbfc1a54c7048deda1f051b0`; deployment run `37784625938` succeeded, including exact live build and desktop/phone checks.
- PR #124 v0.8.95: user-requested Goblin face readability correction. Head `faaaf7006b4b412bfe3717e1b7108ba7e6816b46`, merge `0d02d355ce4f59ab83df24fe6fc0f88ea72478b5`. PR run `37788231608` and deployment run `37789504897` passed full regressions, Chromium/WebKit checks and live deployment verification. Last verified main was that merge SHA at 10:21 America/New_York.
- Goblin active revision `06d5419a812e8c477e77be6f81c4b79e297b7592bc32b0282d0d39ff63590377`; prior accepted source and revision `6e7434dfc416f121e748172b2e5ac18571d6837e85a1de13227c90a5466c8186` retained for rollback. New correction is engineer-reviewed under Joel’s request, not a claim of his accepting an unseen replacement.

## Saved unfinished work

This checkpoint contains the local **v0.8.96 draft**, not the live game:

- Five regional ground textures T001–T005, locally registered but NOT published. Files and exact generation requests: `tools/sprites/batches/2026-10-08-terrain/T001` through `T005`; content-addressed originals: `tools/sprites/materials/sources`; runtime outputs: `assets/materials`.
- Retained original opaque masters, 256×256 outputs, wrap reviews, edge diagnostics, four device/day-night scene comparisons and hashes, and five design handoffs. Player texture payload 507,307 bytes; runtime decoded residency cap 2 MiB. Default span 320 world units, opacity 0.28. No seam repair, cropping or alpha deletion.
- Reproducible material showroom: `node scripts/material-pipeline.cjs showroom tools/sprites/batches/2026-10-08-terrain/T001/candidate/candidate.json`. Its left column is procedural canon, right adds candidate grain.
- Local checks passed: build, format, generated files, sprite/material registries and scope; material preparation, seam/clipping/phase/cache/rollback tests; packaging; real WebKit material browser checks on desktop and phone entry points. Full v0.8.96 remote regression/browser CI and live verification have NOT run. No terrain release PR was opened.
- Bush and wildflower candidates received native desktop/phone day/night review; NOT registered. Field-rock candidate prepared but needs seeded moss variant preservation before registration. Their immutable prepared records and images are now self-contained under `tools/sprites/batches/2026-10-08-01/<asset>/prepared`.
- Grass original remains pending correction: blades were too thick/succulent-like. Grass/reeds and rocks require authored seed-dependent variants; do not flatten procedural height/moss variety into one universal sprite. Existing runtime stable-ID variant selection does not yet implement exact modulo-slot mapping to preserve moss positions. No proposed selector change was implemented.

## Generation ledger

This chat made **16 image-generation calls**: eight initial actor/nature candidates, two actor corrections, five regional ground textures, and one Goblin face correction. No image generation occurred after call 16. Actual tokens, charges and account/Rage-mark balance were unavailable. This is this chat’s count; it does not include any other chat.

## Interruption and recovery

The terrain upload reached 55 of 56 unique file blobs before one original master failed with GitHub connector transport HTTP 400: `Conflicting MCP request metadata`. No terrain commit, PR, merge or deployment occurred during that attempt. The source remained intact locally. This preservation checkpoint is a separate authorized save operation.

When Joel resumes:

1. Read this checkpoint, `docs/SPRITE_PRODUCTION_CURRENT_CONTEXT.md`, `docs/DESIGN_TO_SPRITE_WORKFLOW.md`, and relevant handoffs. Fetch current main and check other-chat branches/PRs before editing; Joel had two chats running. Preserve any newer work and choose an unused next version.
2. Reuse retained images and approved reviews; do not regenerate T001–T005 or completed bodies. Rebase the v0.8.96 draft as needed, run required checks and open a normal terrain release PR. Merge only after CI passes and verify exact live deployment.
3. Continue prepared nature assets in staged batches, preserving seeded variety, organic/material-appropriate shapes, native face readability, animation consistency and rollback history. Generate individual assets, not sheets of unrelated assets. Keep engineer authorization distinct from Joel’s actual image acceptance.
4. Continue the remaining open catalog. Current body catalog is 296 decisions (280 generate, 16 procedural), with 74 exact prepared contracts and seven active body keys. The separate terrain catalog has 28 candidates; only five ground pilots are prepared here. Mass production is far from complete.

No subagents, new schedules, or ongoing generation jobs were started for this checkpoint. The user’s pause remains in force after saving.


## Separate nature checkpoint

Paused at Joel's request on 2026-10-08 after repeated ChatGPT streaming/chat-length errors. DO NOT resume generation, merge or deployment until Joel asks.

## Nature continuation checkpoint
20 new nature sprites are integrated locally (27 active body keys total): Vale bush/wildflowers; sapling, stump, fallen log, cattails, driftwood, mangrove, pine sapling, alpine scrub; marsh bush, Highlands rock cluster; Frontier dead tree, charred stump, dry scrub, burned log; Crown black rock, crystal cluster, dead shrub, obsidian.

Local checkpoint commit c996858 on sprite-recovery-environment-v0895, prepared version 0.8.97, based on main 0d02d355ce4f59ab83df24fe6fc0f88ea72478b5 (PR #124 Goblin correction preserved). Original sources, prompts, normalization, native desktop/phone day/night comparisons and rollback data retained. No separate user image acceptance claimed.

Final local logs: 51 regression suites PASS; 224 desktop/mobile Chromium checks PASS; all five WebKit phone viewports PASS. Build, registry checks and corrected formatting pass. Earlier Chromium Recall failure did not recur on the final build. Remote CI, PR publication and exact live deployment are NOT complete. No nature release has been deployed from this continuation.

Heather is held for fringe cleanup (initial and one correction retained). Grass/reeds and field rocks need exact seeded variation preservation. 20 image calls in this continuation: 8 batch-02 + 11 batch-03 + 1 heather correction. Catalog remains open (296 decisions, 280 GENERATE, 16 procedural; 28 separate terrain materials).

PR #121 and #123 were verified merged/deployed before new work. Concurrent other chat handled PR #124 and five ground textures, preparing v0.8.96. This checkpoint excludes those duplicate terrain registrations. Reconcile latest main and the other chat's terrain checkpoint before resuming; preserve its work and choose an unused release version.

## Save status
Full nature checkpoint saved on recovery/nature-paused-2026-10-08. This branch is a paused snapshot, not a release. See GitHub issue #125. Local workspace: /workspace/scratch/3a2d0af21c36/azeroth-chronicles-prototype. Read docs/SPRITE_PRODUCTION_CURRENT_CONTEXT.md, docs/DESIGN_TO_SPRITE_WORKFLOW.md and tools/sprites/batches/2026-10-08-03/production-journal.json. Resume existing originals; do not regenerate completed assets. Future image requests must complete one at a time.
