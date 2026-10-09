# Amber narration: authored content and visual priority (review implementation)

## Design authority and boundaries

The earlier acceptance contract in `QUEST_ANNOUNCEMENT_REQUIREMENTS.md` governs this work. Joel additionally approved keeping narration visually and behaviorally subordinate to important game news: **quiet bronze/parchment for storytelling; bright amber for progression; emphasized warm/red-amber for danger**. This is a content/presentation pass, not new game mechanics or a persistent scrolling log.

This branch is deliberately separate from the responsive HUD in PR #165, the Drowned Keeper optional feature in PR #172, and the separate milestone cleanup in PR #181. Do not merge/deploy as a substitute for their individual reviews.

## Authored content

`src/prototype/narration.js` exports **30 distinct once-only lines** indexed to `PrototypeData.quests` (stable `quest-0`…`quest-29` IDs). It is a separately loaded multi-file/PWA asset so that changes to prose do not modify canonical `data.js` or invalidate the sprite-scope source fingerprint. Each line is written as an observable consequence, grounded in existing regional/quest canon; the text neither retells the XP/crown transaction nor invents new places, powers, or state changes.

`payQuest` emits narration **only when the existing automatic reward is actually paid**. The original paid state already prevents repeats across saves, reloading, retroactive quest completion, or redundant objective checks. Barracks tutorial does not narrate. Rewards, progression, unlocks, combat, map geometry, save shape and quest IDs are unchanged.

Some examples:
- `A Teacher Taken`: Mira's release, not merely Thornfang's death.
- `An Unfinished Retreat`: the Guardian's established retreat and Borin's rescue.
- `Records at Risk`: Neri's freedom without revealing the Keeper's still-optional ledger evidence.
- `Follow the Crowns`: Ironroot's existing ore-caravan economy.
- `An Army Needs Supplies`: the Frontier's authenticated convoy/checkpoint network.
- `Ready for the Dark Lord`: requires both rescued specialists and the fortress approach.

The 30 lines are working copy for Joel's later prose audit, not a new canon authority. The asset inventory, generated desktop/phone entries, and service-worker precache include the narration module; the canonical world data file remains byte-identical.

## Delivery contract

- `milestone` is the default notice kind and preserves previous call semantics, card look, two-slot stack, independent display duration, and queue.
- `warning` is explicit for the two time-sensitive outdoor TRUE notifications. Warning notices are selected first from the waiting queue, but **do not truncate already-visible important notices**.
- `narration` is a separate subdued `CHRONICLE` card with gentler text styling and 6.8 seconds of reading time. It runs only when both important-notice slots are clear.
- When a nearby hostile is engaged, the player is viewing a menu, the window is unfocused, or play is paused, narration waits. Any newly pending milestone/warning gently defers visible narration and later gives the passage a full fresh reading duration.
- There is at most one narration card on screen. Two simultaneous important notices retain their original display policy, and the third waits. Routine `#status` feedback stays separate and remains positioned below the stack on phones.
- Queuing is transient presentation state; no serialized notification queue, new achievement flags, objective gating, timers in campaign simulation, or extra DOM overlay were added.

## Visual intent

- Narration: muted bronze/ink, pale parchment prose, small `CHRONICLE` label, normal font weight.
- Milestone: existing brighter golden background, heavy headline weight.
- Warning: emphatic amber with warm reddish border; accessible `role=alert`.
- Compact phone prose: 12px and tighter padding, bounded by existing `#message` width and safe-area rules. Validate at **375×800 portrait** and **800×375 landscape**; 360×780 remains best-effort scaling, not a design baseline.
- No restyling of critical warning telegraphs, combat VFX, primary buttons, journal, or PR #165 HUD.

## Audits and acceptance

Automated coverage in `tests/quest-narration.test.cjs` validates the entire 30-message catalog, unique compact prose, once-only automatic payout, reset-safe behavior, the tutorial exclusion and CSS tiers. `tests/prototype-ui.test.cjs` verifies two-slot compatibility, narration deferral during nearby combat, warning precedence, milestone preemption, distinct classes and restoration after interruption.

Run `npm run build`, `npm run format:check`, `npm run check`, `npm test`, and desktop/mobile browser tests before merging. Inspect actual phone layout at 375×800 and 800×375 (plus desktop), particularly stacked gold alerts, menu/status position, story interruption, TRUE encounters and long messages. Merge this content pass only after rebasing around PR #165 and PR #181 as needed; avoid conflating their pending functionality with a narration result.

## Known limitations / refinement candidates

The first content pass deliberately contains **no ambient timer-based chatter** and does not announce every landmark, common enemy, or loot action. Occasional important first discoveries can be authored later after verifying evidence state and visit conditions. The existing internal `say()` history is intentionally not restored as a visual event log. Follow-up prose review may change wording without altering the delivery mechanism.

The current implementation selects waiting warnings ahead of waiting milestones, but honors the prior promise not to overwrite an already displayed important notice; in a rare saturated two-milestone stack, danger news must wait for a slot. Boss telegraphs remain independently visible. This tradeoff is a design audit point, not a silent policy change.
