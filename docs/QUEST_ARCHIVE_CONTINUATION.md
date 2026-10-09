# Quest and Archive continuation — 9 October 2026

Source conversation: https://chatgpt.com/share/6ac91036-0034-83ea-95a3-af377063619b

Joel asked to “finish what has been already approved, including the Drowned Keeper, implemented using your best judgment.” He reserved the 30 amber quest observations for the next chat, then asked this chat to take over and continue the work. The recovered conversation identifies joedoragon-glitch/azeroth-chronicles-prototype and its pending Keeper PR #172. GitHub metadata confirms the public repository and main branch. This continuation integrates #172, the rebased short status work #179, and milestone cleanup #181, preserving current main's UI and rogue audit changes. Publication uses a reviewable task branch, the repository's existing tests, and its established Pages workflow.

## Player behavior

Thirty regional quests now deliver one distinct, brief adventure observation automatically after completion. The data owner is `data.js`; `rewards.js` delivers the line under the existing once-only payment guard. Each receives seven seconds in the existing independent two-card queue. Quest name and unchanged XP/crown payout appear in a smaller, readable caption. Old paid saves stay silent. Specialist rescues that immediately complete their quest share that observation; a rescue whose other objectives remain unfinished keeps its original milestone. Regional budgets, IDs, physical objectives and tutorial remain unchanged.

Routine purchases and training no longer enter the amber queue. Their source menus confirm the result. Equipment confirmation distinguishes purchased weapons that actually become active from weaker items. The short status channel retains actionable failures, including crowns, guarded sites and premature rescue, while removing redundant success chatter. Ordinary feedback lasts 2.8 seconds; important save/import failures remain longer. MP feedback reads the shared reversible resource-mode guard.

## Keeper states and knowledge

The normal Archive Keeper's defeat makes a captive interaction available only if no living Keeper or active pending TRUE encounter exists. A later inactive pending TRUE roll does not prevent the bargain; activation hides the captive before combat starts. Early TRUE encounters use the same exclusion. TRUE defeat allows recapture. Evidence and cooperation survive reload; this is not another reward quest and neither yields XP/crowns.

The hero must free Neri and promise to protect the Archive before counsel becomes available. Direct Archive interaction and existing Barracks specialists share the same availability checks. Escaped hostile Keepers cannot offer remote counsel. Optional records in the dry stacks reveal the Keeper's proposal to capture specialists only when read; normal victory, quest narration and unrelated codex pages cannot reveal it. Reading the orders triggers one selective amber observation and saves the evidence.

The optional shelf first presents six short categories, then deliberate topic choices. It reads current campaign queries and rule tables for equipment/costs, XP reductions, eight skills, party/training, attacks and all eleven bosses. Baseline boss numbers are explicitly labeled normal daylight bases; visited foes include actual current stats/form. Reading creates no enemies, rewards, IDs or progression. Detailed formulas belong here; Controls retains movement, targeting, every skill key, charge/release, healing, companion recovery and menu operation.

## Visual ownership

The captive reuses the existing normal Archive boss body, surrounded by a roomy procedural cage. It is an NPC for interaction and has no hostile health bar. The ledger reuses the scroll-stack prop. New handoffs under `tools/sprites/design-handoffs/` retain exact states and isolated/current-game references. No unseen generated appearance or player image approval is claimed. Cage geometry and scene overlays remain procedural; later sprite work can reuse the established boss and prop designs.

## Verification

`quest-narration.test.cjs` reaches all 30 quests through their actual objective triggers in both Normal and Nightmare, checking automatic payment, unchanged budgets, seven-second delivery, once-only behavior, reload silence and combined rescues. `keeper-archive.test.cjs` checks migration, reachability, bargain gates, evidence, reload, remote service, early/later TRUE escape and recapture. `archive-reference.test.cjs` checks every class/mode, read-only behavior, live rule changes, future MP-off guards and actual armor-resolution parity.

`quest-archive-browser.test.cjs` tests four screen sizes in both Chromium and WebKit: 1280×800, 375×800, 393×852 and 800×375. It captures two long observations, separate temporary feedback, practical Controls, the visible captive, topic browsing, reading/save evidence and TRUE escape. It also accepts PLAYTEST_URL for the same live-release checks. The existing full browser, rogue, audio, VFX, materials, offline and Node regressions remain CI gates. Deploy only after exact-head checks; verify the published commit and live PWA.
