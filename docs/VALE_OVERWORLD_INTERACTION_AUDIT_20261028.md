# Greenwood Vale overworld interaction audit — 28 October 2026

**Base:** Published dev.208 / `main@e5798a9e`. **Scope:** walkable Greenwood Vale field, Millhaven outward, without entering interiors, side dungeons or bosses. Candidate dev.209 on a **draft, unmerged** PR. No owner playtest of this candidate yet.

## Root cause confirmed in production

The live `nearestNPC()` chooses the closest eligible visible NPC, resource node or Barracks within **115 world units** of the hero (for a Refuge, `interactionDistance()` also accepts the authored door). This selection is mechanically correct, but on phones the button printed only **“Interact”**; its target `title` was a hover tooltip not exposed by ordinary touch. Crowded service areas therefore hide the chosen target. The engine's `say()` only appends text to the last-seven-message buffer. The interaction shell previously did **not** turn most successful `say()` results into the on-screen status or an inspection menu. Thus a successful outdoor landmark or mini-site inspection could look like a no-op, despite authored lore and quest discovery working.

This is a **missing presentation receipt**, not evidence that all such sites were never implemented. The handoff gap was between world/engine content and the visible interaction owner. The existing interaction distance is intentionally unchanged.

## Greenwood first-region interactable contract (source audit)

| Visible interaction | Existing gameplay owner | State before candidate | Disposition |
| --- | --- | --- | --- |
| Millhaven Captain / recruiter | Companion, tutorial, Barracks services in `partyMenu()` | Opens service/tutorial menu | Retain; tiny selected NPC cue and target caption |
| Supplies / supplier, quest board | `supplier()`, `quests(true)` | Opens service/quest menus | Retain; target caption + selected cue |
| Town and minor refuge | `refugeIntro()`, `rest()` | First use opens healing/refuge guide; future success calls `say()` without immediate receipt | Show short post-use result; exclude entire refuge building from outline |
| Outbound transport | `transport()` | Opens travel service | Target caption; no vessel/building outline |
| Main dungeon entrance | `dungeonEntranceMenu()` | Opens camp/entry choice; player need not enter | No wide architecture highlight or auto-entry |
| Outdoor field captive cage | `rescue()` when appropriate boss key exists | Locked case has existing guidance; success lacks reliable visible `say()` receipt | Short visible success; tiny cage cue |
| Quest supply bundles | `interact('bundle')` | Actual one-time collection/discovery; `say()` not surfaced | Visible receipt and small ground marker |
| Authored outdoor landmarks, named patrol sites | `discover()`, `siteDescription()` | Actual survey/lore/quest progress, but only `say()` | Open readable **Inspect site** text; no invented dungeon, chest or unlock |
| Mini-encounter status marker | `checkMinis()`, `miniStatus()` | Returns status as invisible `say()` | Open status inspection, not a new encounter mechanic |
| Dark Lord Tribute / resource node | `gather()` gated by Expedition rank/idle worker | Failure feedback exists; accepted delegation often only changes state/messages | Visible receipt and selected small node cue; no instant loot |
| Player Barracks | `barracksMenu()` | Opens service/work menu | Target caption only; do **not** outline building |
| Rescued specialists and later conditional NPCs | Existing teacher/smith/other service menus | Conditional on progression, not generally in a fresh Millhaven start | Small selected NPC cue; retain gates |
| Scenic props, trees, ordinary houses and chests not represented as interactive NPCs | No `nearestNPC()` ownership by default | Decoration does **not** enable Interact; no new chest mechanic promised | No new activation or fabricated loot |

**Known possible follow-up:** A displayed target with an unsupported `kind` should no longer silently do nothing; it gets a neutral unavailable message. Other regions and interiors still need a separate audit; the first-region source inspection does not prove every later interaction complete. Some field landmark descriptions explicitly say they are patrol sites with **no dungeon interior**, which is authored information and should be shown rather than mistaken for a missing dungeon.

## Narrow implementation

In the existing shell, share one 115-unit nearest-first query for actual action, touch target caption/accessible label and the draw cue. The optional Canvas cue appears **only in Greenwood Vale, only on an eligible drawn world frame**, projects the current selected object through `renderer.screen()` and uses a restrained muted-gold, thin ground ellipse and tiny diamond. It excludes broad buildings/refuges, monuments, transport, fountain and dungeon entrances. This is a single selected small object, not a blinking ring for every nearby item. The same paint-only cue is overlaid after full Canvas drawing or Pixi's existing transparent Canvas layer; **no changes to protected renderer source, sprite canon or Pixi state**.

Show the authored `siteDescription()`/`miniStatus()` as a readable menu upon successful inspection. For normal one-time object interactions, expose an immediate status receipt; keep existing quest/capture/rest/combat gates, distance, save v4, damage, loot and NPC positions untouched. No separate tutorial system is introduced; the inspection text itself explains the purpose.

## Verification and acceptance

Focused engine/browser-shell interaction checks, original-class/quest/save protections and reproducible PWA build required. Visual equivalence and clarity on the owner's actual phone remain **unverified** before publication, as the owner's ordinary acceptance workflow is to play the public game after a separately authorized merge. Do not merge this draft under PR #532's authorization; full browser/device matrices remain opt-in.
