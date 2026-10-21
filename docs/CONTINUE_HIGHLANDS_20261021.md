# Clean continuation — 21 October 2026

Current release: dev.137 ferry size correction, PR #373. The chosen original option 3 ferry and ferryman render exactly 50% larger per dimension. Fresh 918×459 export from unchanged original, 216×108 display frame, matching procedural fallback, separate Highlands hull presentation at (260,2020), unchanged reachable boarding at (300,1995). Publication receipt: docs/evidence/FERRY_SIZE_DEV137_PUBLICATION_20261021.json.

## Active next work: Highlands tribute

Repository: joedoragon-glitch/azeroth-chronicles-prototype. Remotely preserved WIP branch: fix/highlands-tribute-dev137, head eaad91354edacb8974d04607aaf4b1e2ef71f80a. Local recovery worktree: /tmp/highlands-tribute-dev137-work. Read its docs/HIGHLANDS_TRIBUTE_DEV137.md and docs/HIGHLANDS_COAST_FOLLOWUP_20261021.md. No tribute PR or publication yet. The branch name's dev137 predates the newer ferry correction; use dev.138 for the next runtime release, integrate current main first and preserve the ferry rules/visuals/renderer changes. Do not overwrite this WIP with a new unrelated implementation.

Confirmed: four outdoor sources total 640 crowns (220/160/130/130), two only 315 units apart; instant scoutTribute reveals an exact hidden cache from anywhere and revealed caches look like ordinary exposed chests. Joel reported over 900 crowns in roughly a minute; that figure has not been reproduced solely from the outdoor pool. Check other income and once-only fractional payout/save accounting; never claw back earned crowns.

Prepared code (not fully validated): four stable tribute IDs dispersed to north (1740,480), east (2920,1260), southwest (740,2710), south (1860,2900), with coherent nearby dressing and existing enemy pressure. Reuse an overlapping Wolf patrol; no added enemies/stat buffs. Hidden scouting dispatches companions physically and reveals on arrival, preserving combat interruption/Recall/save. Revealed concealed sources use a partly buried closed strongbox drawing. Existing amounts, deaths, IDs and discovery remain authoritative.

Actual validation so far: one smoke check confirms two caches remain hidden on dispatch; Soldier gets scouting=true; snapshot/restore retains the search order and gathering target. Still required: audit code/migration idempotence, navigation and local challenge across four seeds; old-save amounts/fractions/collected IDs/cargo/dead enemies; physical search arrival/combat/Recall/reload/once-only collection; native views of all four sites. Only necessary focused checks; no heavy GitHub CI or full game matrix. Complete this scoped fix and publish for owner play.

## Later Highlands geography

Joel wants a convincing Scottish Highlands identity and arrival shore, using underused western/southwestern edges, organic coastline, coherent asset placement and correct timber/road transition. He is learning about Scotland and plans a Scottish festival next month; he expects careful, high-quality work. The earlier coast instruction is explicitly annotation only until tribute is addressed and scope is resumed with his feedback. Do not turn the ferry-size request into an unreviewed whole-region redesign.

## Workflow and known check state

Joel is sole developer/playtester. Requested fixes use focused checks, merge and package-only publication; defer heavy GitHub tests until his end-of-batch request. Restore normal pages.yml and remove temporary publishers after each successful release. Preserve untouched originals, rollback revisions and checkpoints. No subagents.

Dev.137 focused export, registry/provenance, real loader/fallback, 24 fresh/current/dev.136-save boarding routes, offline-resource enumeration, generated build/syntax and formatting passed; six state-pure native day/night/location/phone captures retained. Aggregate npm run check stops at pre-existing Marches terrain palette evidence mismatch; separate material check reports a stale material contract. Both reproduce on dev.136 and are documented, not silently fixed or claimed passing. Enemy audio coverage passes. Do not rerun completed unchanged checks merely because this chat ended.
