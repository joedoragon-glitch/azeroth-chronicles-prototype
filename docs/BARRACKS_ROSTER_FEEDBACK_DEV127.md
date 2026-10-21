# Barracks roster feedback — dev.127

Owner clarification: at a completed 20-crown Basic Barracks, rest one of three active members, then recruit a pet or troop into the open slot. Preserve the ordinary three-person Basic limit and all existing restrictions. An atomic replacement feature is not requested.

## Behavior

Blocked Rest, Add to group, pet recruitment and troop recruitment now show the actual reason in the menu action's visible detail. Shared read-only reason methods also guard the domain actions, so a stale menu cannot silently fail or bypass a restriction. Failed actions report that reason through the existing message channel and preserve party/crowns/orders/queues.

Reasons distinguish nearby engaged enemies, full active groups (including fallen members and the number to rest), fallen reserves, locked TRUE pets, company/queue bounds, Expedition requirements, unfinished/unavailable Barracks, occupied training and insufficient crowns. The town Captain's limit counts all employed companions, including reserves: its message now explicitly directs further hiring to a completed **Basic or Full** Barracks. This is a possible source of confusion, not a confirmed diagnosis of the owner's earlier save.

Full active groups still permit new pet/troop recruitment into reserve. The menu explains that result instead of incorrectly presenting party capacity as a hiring blocker. A freed slot still fills immediately for a pet, or on completion of ordinary troop training. No party caps, safety gates, prices, training duration, unlocks or save schema change.

## Focused verification

- `tests/barracks-roster-feedback.test.cjs`: native menu-catalog rest/recruit flows for pet/Soldier/Ranger, v4 round-trip, visible denial explanations, town-versus-Barracks distinction, idle/engaged threat distinction, stale-action revalidation, no state mutation on denial, fallen/full/larger-group/queue/company/unlock/rank/crown/construction cases.
- Existing menu, community-pet lifecycle and regional death/Barracks suites pass.
- Build, generated/asset checks and changed-source formatting performed for this candidate. No broad CI or full-game suite.
- Local browser unavailable: Chromium download is truncated; installed WebKit lacks host dependencies. Do not claim a local native-browser pass. Live startup remains to verify after publication.

Publication pending at this checkpoint.

## New owner-directed audit

The dungeon entrance/remaining fort work must include **both captains and bosses in their real authored encounter spaces**. Audit spawn location and usable room for actual current skill geometry, movement/charges, summon deployment, walls/props, entrances/player arrival and leash/reset behavior. Inspect normal/TRUE variants where geometry or behavior differs; do not assume a valid spawn point alone proves the whole encounter fits. No generic basic-hit interruption defect is confirmed, and no balance retuning is implied. Sunrise/sunset investigation stays deferred.
