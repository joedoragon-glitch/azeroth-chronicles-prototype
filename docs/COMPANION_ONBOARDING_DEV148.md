# Companion onboarding, funded recruitment and quest-board navigation — dev.148

Joel's live new-run playtest requested a useful first Captain visit, an opening quest about companions, and a cancellable automatic recruitment request when funds alone are missing. He also requested story objectives directly on the quest board, with the existing optional board tasks under Side Quests.

## Player behavior

The existing `quest-barracks` becomes **Your First Company** without changing its ID, rewards or completion rule. It points first to the Captain, then Recall, then the free first Basic Barracks. The first Captain interaction gives the Soldier/Ranger roles, Recall practice, field-base/recovery/reserve basics and the Expedition 2 recruitment unlock. Finishing a Barracks directly still completes the tutorial; existing completed tutorials do not reopen. Starting money, prices, roster limits and Expedition progression are unchanged.

An eligible Recruit Soldier/Ranger choice remains enabled when crowns alone are missing. It creates one unpaid request. The selected row explicitly becomes Cancel queued Soldier/Ranger; selecting another type/source replaces the request, and the same choice cancels it without a charge. All recruitment screens show its funds/progress and permit cancellation. Other progression, construction/training and capacity blockers still refuse recruitment.

The request survives saves and travel. After active-play earnings/loot collection meet the selected source's normal price, the shared campaign tick charges once and creates the ordinary companion near the hero, wherever the hero is. It fills a supported active slot or rests in reserve if the active group filled after acceptance. This accepted request reserves one company slot, including against the 200-member limit. A town request accepted before the town limit filled is honored into reserve rather than discarded. Already-funded town recruits and Barracks training retain their existing paths, including the latter's four-second training. An unpaid request delivers immediately when funded as requested. A missing source Barracks or progression/capacity blocker holds the request without spending; it remains cancellable. A recruitment event saves completion immediately through the existing shell event path.

The quest board and global quest journal now show the existing live story guidance directly, plus the pending companion tutorial. **Side Quests** contains the former optional board catalog; local/all-region navigation, completed history, rewards, IDs and tracking remain. No Story guide submenu remains.

## Focused impact and validation

Runtime owners: `party.js` request/roster operations and Recall tutorial flag; `engine.js` end-of-tick resolver and existing quest stage/definition; `save.js` optional v4 fields, validation and slot reservation; `menus.js` first-visit/tutorial, offer/cancel UI and quest-board branching; `app.js` English/Spanish presentation and completion autosave event.

Passed: request suite (eight real mode/type/source funding paths plus cancellation/replacement, unchanged eligibility, full-group reserve delivery, capacity reservations, save/travel/legacy validation); production English/Spanish shell interactions and actual action saves; original menus, Barracks roster feedback, quest narration, economy and quest-waypoint suites. Build and changed-source format/diff checks pass. Phone/desktop browser expectation strings updated for Quest board; broad browser matrices were not run.

Inherited original `prototype-ui` suite: after bringing its minimal DOM mock and Quest journal shortcut expectation up to date, it reaches the existing Treasury entrance assertion and fails `vale` versus `supply-vale` because it omits the current entrance-choice menu. This exact failure is reproduced on unchanged dev.147 runtime with the same mock corrections. The new production-shell suite verifies all changed companion, objective and quest-board behavior directly; no claim that the entire old UI suite passes.

Owner authorizes immediate publication with focused local checks and no broad CI. The one-time workflow only packages committed assets; restore normal Pages triggers and remove it after exact-public verification.

## Publication

PR #387 merged as `0fe7ba154532b1ae1e7ac9598739428e45f7eb78`; package-only run 39698847962. Exact-live receipt: `docs/evidence/COMPANION_ONBOARDING_DEV148_PUBLICATION_20261021.json`. The closeout restores the original Pages workflow byte-for-byte and removes the temporary publisher.
