# Highlands tribute exploration and concealment — dev.137

Active owner request, 21 October 2026: audit and fix the four outdoor Dark Lord Tribute caches being clustered/easy, and the companion hidden-cache option revealing ordinary exposed chests. Owner reported earning more than 900 crowns in roughly a minute. Preserve paid crowns and collected-cache progress.

## Confirmed baseline findings

- Fresh dev.136 outdoor Highlands tribute totals 640 crowns: ore-shipment 220 at (1205,730), stone-toll 160 at (1195,1045), timber-toll 130 at (1405,1965), ogre-cache 130 at (2100,1740). First pair is only 315 units apart; all four occupy a central strip of a much larger region.
- Two sources are flagged hidden and correctly absent from visibleResourceNodes until discovery. scoutTribute nevertheless reveals the exact next source synchronously from anywhere, without physical companion scouting. The menu combines reveal and gathering.
- After reveal all tribute uses the same ordinary open chest drawing, so hidden placement has no distinct physical concealment.
- Several site-tagged Ogre guardians have moved to the Ridge Tyrant watch yard, away from the old ore source. Existing northern Crown patrol, eastern convoy patrol, southern Ogre pack and overlapping western Wolf patrols offer meaningful challenge without creating/stat-buffing enemies.
- The reported 900-plus payout has not yet been reproduced solely from the 640-crown outdoor pool. Audit other income and once-only payout/save accounting separately; do not discard this owner observation or claw back earned crowns.

## Bounded intended repair

Spread four stable-ID sources among a northern convoy lay-by, eastern collector post, western wooded hollow and southern stolen levy cache, with coherent local dressing and existing patrol pressure. Hidden sources stay invisible until dispatched companions physically reach them; preserve combat interruption, Recall, cargo, saving and Expedition requirements. Give located concealed sources a partly buried/covered strongbox appearance. Keep existing total and remaining fractions; no refill or revival during migration.

Implementation and focused validation pending. Highlands shore/coast overhaul is annotation-only and excluded: docs/HIGHLANDS_COAST_FOLLOWUP_20261021.md.
