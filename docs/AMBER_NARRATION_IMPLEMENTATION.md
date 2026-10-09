# Quest narration — selective player-value pass (PR #184)

## Authority and change boundary

The product is the multi-file GitHub Pages/PWA. The original `QUEST_ANNOUNCEMENT_REQUIREMENTS.md` proposed one narrative payoff for every regional quest. Joel's subsequent explicit 30-quest review **supersedes that blanket requirement**: only selected useful or high-yield lines should be shown. All 30 regional quests and the Barracks tutorial continue to complete, persist and award crowns/XP exactly as before. This is a separate draft feature from responsive UI PR #165, milestone cleanup PR #181 and Keeper PR #172. No release or merge is authorized by this content pass.

## Exact reviewed dispositions (1-based quest numbers)

- **KEEP**, verbatim: **20 An Army Needs Supplies; 21 Wings of War**.
- **REWRITE**: **4 An Unfinished Retreat; 5 Keeping Trade Open; 6 Who Owns the Woods?; 9 Records at Risk; 11 Shadows After Sundown; 16 The Master's Reserve; 18 Follow the Crowns; 23 Rebuilding Under Guard; 24 A Different Kind of Flight; 29 The Machinery of Rule**.
- **MILESTONE**: **30 Ready for the Dark Lord**.
- **CUT from narration**: **1, 2, 3, 7, 8, 10, 12, 13, 14, 15, 17, 19, 22, 25, 26, 27, 28**.

`src/prototype/narration.js` holds 30 entries aligned with `PrototypeData.quests` in stable order. An entry is `null` when no narrative card should appear, otherwise `{ kind: 'narration' | 'milestone', text }`. No new quest ID, engine objective, hidden story flag or serialized announcement state is created.

## Player value and lore audit

The ten rewritten entries are limited to established context and purposeful information:

| Quest | Grounded reason for the selected line |
| --- | --- |
| 4 Forest Crypt | Borin was compelled to finish the Dark Lord's private woodland retreat; the Crypt is not merely a tomb |
| 5 Millhaven wagon stand | Shows that the merchant wagon continues toward Flooded Marches |
| 6 Greenwood survey | Distinguishes the Dark Lord's private woods from his actual seat in Dark Crown |
| 9 Sunken Archive / Neri | Names the available Companion Vitality / training-reset services at a completed barracks while respecting the damaged records |
| 11 Lantern shore | Communicates that the nighttime wraith danger returns on later nights |
| 16 Ridge Tyrant's Treasury | Identifies the Ridge Tyrant as Master of Coin and custodian of ore/payroll trade |
| 18 Stonecross ore / caravan | Explains that ore is processed into crowns and carried away under guard |
| 23 Frontier survey | Shows real civilian repairs and occupation logistics without asserting the player saw a specific optional site |
| 24 Emberwatch landing | Distinguishes civilian dragon travel toward Dark Crown from Abyss Bastion's military air project |
| 29 Dark Crown survey | Explains that levies, labor and guarded roads sustain the regime; no invented objective is implied |

**Quest 30** is now a real `milestone` with the existing prominent amber styling; it reflects both Tovan and Vera being free and arrival at the fortress gate. The two KEEP entries retain their original approved wording byte for byte.

The Archive narration does **not** claim the player found the Drowned Keeper's hidden capture proposal. That revelation remains conditional on evidence discovered through the separate optional Keeper feature. No narration claims that an ordinary patrol permanently clears a road or unlocks new permanent gameplay states.

## Delivery and display

- `payQuest` sets the existing persistent paid flag, grants the same rewards, records the same events and, only for 13 approved entries, emits one typed notice. **17 cut quests emit no quest-specific banner.**
- **12 narrative cards** use muted bronze/ink, parchment typography and the `CHRONICLE` label. They wait for nearby combat to subside and for menus/pauses and more important notices to clear.
- **1 quest milestone** uses the current amber prominence and ~5.5-second display. Existing level-ups, rescues, TRUE warnings, Awakening, first boss defeats and first dungeon clears are not removed or downgraded.
- TRUE warnings retain an explicit urgent styling and priority within the waiting queue; the two-slot stack continues to preserve the lifetimes of already visible important notices. Narration can be deferred and re-shown after interruption without altering the campaign simulation.
- Routine action confirmations remain in the independent `#status` channel; no persistent scrolling event feed or new permanent HUD appears. On phone, the existing bounded card layout and notice/status coordination are retained. The official minimum phone portrait layout is **375×800 CSS pixels**.

## Compatibility and verification

Changes are scoped to the independent `narration.js` data, a small event dispatch adaptation in `rewards.js`, tests and documentation. The canonical `src/prototype/data.js` remains **byte-identical** to `main`, preserving sprite-source hashes. Existing `quest-0`…`quest-29`, v4 save keys, one-time paid flags, automatic quest progression, event emission, XP/crowns and combat all remain unchanged.

`tests/quest-narration.test.cjs` asserts the reviewed 30-way split, two verbatim keeps, proper types, compact text, no narration on cut quests, every quest's automatic payout and event, and no replay after save restoration. `tests/prototype-ui.test.cjs` covers two independent important notices, combat deferral, warning priority, milestone preemption and distinct card styling. Full CI and desktop/phone Chromium + WebKit browser checks remain mandatory before merge. Review especially 375×800 portrait, 800×375 landscape, and interactions with PRs #165/#181 before deployment.

## Later refinement, not bundled here

No ambient narration timer, repeated patrol commentary, new event types, Archive mechanic changes, combat changes or ad hoc lore additions. Joel can refine the 12 narrative lines later without changing the trigger design. In a rare fully occupied two-milestone stack, a new TRUE warning may still wait until a slot becomes free; combat telegraphs remain independent and this queue tradeoff remains an explicit future audit consideration.
