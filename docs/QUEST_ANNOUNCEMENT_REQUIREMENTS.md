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

## Drowned Keeper — optional scholar and mechanical codex (future separate feature)

Player-approved direction:
- The Keeper is the game's **optional authority on both established lore and advanced mechanics**. The player may consult him for enemy species, boss abilities, cooldowns, damage/armor, character progression, XP/reward scaling, companion AI, economy and precise formulas. Use actual live rules/values, including active MP-disabled or MP-restored modes, not manually copied numbers that go stale.
- Keep the Controls/Help menu short and practical: how to move, attack, interact, navigate and survive. Advanced mathematics and detailed reference material belong to the Keeper's opt-in codex; never hide basic controls or critical survival warnings behind a midgame boss.
- The Drowned Keeper is canonically the scholar/councillor who proposed capturing specialists. The player must **find evidence by naturally exploring Archive records or rooms** before a prominent banner can reveal that fact. Merely defeating him must not magically grant knowledge from an unread record.
- Proposed encounter: defeat his **normal form** and capture him in a **large, appropriately sized cage in the Archive**, rather than allowing him to simply vanish. The actual hostile boss must cease to be active when the captive character appears. The Keeper bargains to cooperate in return for the hero's promise to protect/restore the Archive and for Neri's expertise to help save the flooded records. This is character motivation, not a new mandatory reading quest.
- If the Keeper's **TRUE form** becomes active, treat it as an escape: remove/disable the cage and captive interaction **before** the hostile TRUE Keeper can be present. There must never be a captive and a living combat Keeper simultaneously. The existing optional early TRUE roll, later Awakening activation, persistence and saved-defeat history must all be respected. Define a recapture/availability policy after TRUE defeat before implementation.
- Once the cooperation state is truly established, allow direct interaction at the Archive and access to the Keeper's optional specialist/codex service from an existing barracks. When he is escaped and hostile, no impossible remote conversation; previously collected notes may remain readable without pretending he is currently present.
- Codex interaction should start with compact browseable topics and only reveal longer paragraphs/calculations on deliberate request. No mandatory pause, cutscene, encyclopedia spam, or new lore outside established world facts.
- The main lore reveal uses **selective** amber messages anchored to discoverable Archive evidence, with quest completion narration kept short. Normal patrol/transport quests do not all deserve a similarly deep story payoff.
- This is a **separate proposal requiring encounter/state audit and implementation review**, not part of the current amber-stack or tonic PR. Preserve existing boss fights/rewards/saves until that design is approved and regression-tested.
