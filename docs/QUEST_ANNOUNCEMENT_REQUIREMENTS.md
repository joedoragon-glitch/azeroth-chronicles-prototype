# Azeroth Chronicles — quest and notification acceptance contract

Current product: multi-file GitHub Pages/PWA. Do not constrain architecture to one portable HTML file.

## Quest system (PR #168 merged)
- Preserve all 30 regional quests plus one Barracks tutorial, stable IDs, old saves, automatic activation/progression, immediate once-only XP/crown payouts, and no quest-board/turn-in requirement.
- Titles are **motivations or subtle established-lore hints**, not an instruction repeated by the description. Descriptions give **only concise functional completion requirements**.
- A normally curious player can finish objectives by reaching, exploring, interacting, entering, fighting, and collecting organically; no memorized order or mandatory reading.
- Five regional survey quests credit any three among authored sites. Survey destinations should reward meaningful spread across real playable terrain; don't add empty map checklists.
- Quest XP/crown redistribution must be budget-neutral per region unless progression evidence justifies reductions. Budgets: XP 600/1200/1800/2400/3000, crowns 160/380/700/1200/1900.
- Keep bosses as optional late-region challenges rather than universally maximally rewarded XP sources.
- Use *only established* regional, specialist, habitat and boss lore. No new mythology, lore retcons, forced dialogue, journal scavenger hunt or Baldur's-Gate-style reading load.

## Prominent amber banner
- The PWA uses the existing top-center amber critical notice banner, **not** a restored persistent black scrolling event feed.
- Allow **two simultaneous independent notifications** stacked vertically; each gets its full display duration, and further arrivals wait in order, never overwrite visible notices.
- Maintain good mobile readability and prevent overlap with the separate temporary status.
- Keep level-ups, specialist rescue (coordinated with quest narration), TRUE boss warnings, Awakening and other genuinely important milestones.
- Add **one unique authored narrative payoff per regional quest** on completion: a compact, natural, adventure-like observation of established lore; a touch of wit where appropriate. It must work for players who never read the quest board. Don't merely restate quest objectives or rewards. Never narrate omnisciently.
- Consider a one-time notice for normal boss victories and first dungeon clears. Avoid announcing every ordinary enemy kill, loot pickup or landmark visit; assess landmark discoveries individually.
- Remove amber notices for routine skill learning/upgrades, expedition ranks/support, equipment/reforges, generic training and preparation tonic **only after the source menu/action UI clearly confirms the completed change**.

## Preparation tonic
- Existing mechanic is gated behind Neri's rescue, costs 70 crowns and grants +10% max HP; it is cleared by rest or death. The current PWA menus have no player-facing action wired to `buyPotion('tonic', true)`.
- Make the feature discoverable and actionable without searching obscure NPC/menu paths. Show cost, benefit, ACTIVE state and cancellation conditions at its activation surface. Do not use the amber banner to confirm it.
- Preserve economy, combat and saved-progress invariants; cover it with tests.

## Separate temporary status — review pending
- Keep the PWA's `#status` channel for short actionable errors (target, skill readiness, invalid actions, failed storage/import/update) and never use it for storytelling.
- Existing `say()` internal message history is not a UI feed and must not be reintroduced as one.
- **Do not revise/trim temporary status messages until the user finishes the per-message review.** Audit findings and recommendations are not authorization to delete or rewrite them.
- On phones, keep this status visibly separate from the amber two-slot stack.

## Technical delivery
- Prefer incremental isolated PRs, full node/browser/phone regressions, reliable save/restore and no accidental changes to renderer art canon, combat, XP economy or quest IDs.
- The 30-quest narrative payoff is a separate content pass after the two-slot amber mechanism; do not mass-author canon changes implicitly.
