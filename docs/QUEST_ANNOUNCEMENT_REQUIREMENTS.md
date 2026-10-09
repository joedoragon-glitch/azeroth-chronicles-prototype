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

## Preparation tonic (approved flow; PR #171 underway)
- Existing effect is +10% maximum HP until rest or defeat and costs 70 crowns. Neri the Alchemist sells *stored* consumable tonics, not instant activation; she is reachable directly and from Rescued Specialists at barracks.
- A completed Basic or Full Barracks must display a prominent Preparation Tonic action without creating another permanent HUD button. If stock exists, use one; if out of stock, offer a simple **Buy and use** confirmation on the spot. Do not charge twice or silently use stock when purchased from Neri.
- The sale/activation surfaces clearly state stock, cost, benefit and ACTIVE state and where to find/use the tonic. No amber notice for using or buying it.
- Preserve the economy, one-use mechanics, old saves, stock persistence, Succession and rest/death expiration. Regression-test both Barracks types.

## Separate temporary status — user-approved cleanup (not the amber banner)
- `#status` remains a *short actionable feedback* channel for errors and confirmations, not storytelling. Never recreate the old persistent `say()` feed.
- User approved **removing** redundant notices such as already-installed-app confirmations, routine charge cancellation and duplicate level-up status text (level-ups use amber).
- User approved **shortening** verbose update, targeting and charged-action messages. Use compact actionable text; make ordinary feedback shorter-lived than important save/import/storage failures.
- **Insufficient MP:** remove this status in cooldown-only combat but **preserve a reversible implementation** behind the same `PrototypeRules.resourceMode.manaEnabled` switch established in draft MP PR #169. Update `docs/COOLDOWN_ONLY_COMBAT_MIGRATION.md` with restoration steps so re-enabling mana automatically restores the warning and related tests.
- Keep visible failures for insufficient crowns, cannot rest during combat, guarded Treasury, unavailable labor, and **trying to free a specialist before defeating the boss**. Avoid sending routine success chatter.
- Verify automatic weapon/armor equip behavior; show a brief confirmation when a new item is **equipped**, not just purchased. Armor tier becomes active on purchase; weapons automatically select the higher-powered owned option (including legacy items), so only claim "equipped" for the item actually active.
- On phones, align temporary feedback with the amber banner region cleanly without overlap or text scattered across the screen. If two amber cards are already visible, position short status beneath the stack (or another reviewed nearby location).

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
