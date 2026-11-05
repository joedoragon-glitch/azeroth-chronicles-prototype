# SIBDLP — Stage 4 icon-led menu experience: game-design and engineering handoff

**Date:** 4 November 2026  
**Status:** DESIGN CONTRACT WITH ENGINEERING IN PROGRESS in draft PR #800. Palette/typography, New Adventure, Save/Help hierarchy and targeted tests have been committed as an **unmerged and unpublished candidate**. Focused native CI, reproducible build, bilingual Chromium/WebKit menu acceptance and Chromium PWA updates passed on `d6f6eb49`; the original desktop/phone renderer journey also passed; iPhone device acceptance remains separate. See the final evidence checkpoint below and the PR for current outcomes. Nothing here is yet available in published dev.255.  
**Authoritative product:** *So I Became the Dark Lord's Problem* (SIBDLP). Repository's legacy name is historical.  
**Player-tested baseline:** Published `0.9.1+snapshot.dev.255`, merged [PR #798](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/798). Source inspection in [UX issue #270](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/270); ongoing [iPhone acceptance #790](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/790).  
**Prior foundations to preserve:** [PR #791](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/791) bilingual title and settings/help, [PR #793](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/793) landscape phone layout and persistent sideways presentation, [PR #798](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/798) full-bleed/safe-touch. Reconcile with current `main` again before any engineering edit.

## 1. Intended player experience and non-goals

A new player should open the game and recognize its world immediately. The five main-menu actions are obvious; Normal play requires no study of Succession rules, file formats, graphics renderers or development diagnostics. Any explanation needed to make a consequential choice is close to that choice. The interface feels like the game's actual golden-crown/magical-violet identity from opening screen to deepest submenu. Players can read labels without squinting, navigate directly by touch, and back out predictably. Experienced players retain access to every feature and advanced control.

This is a **visual identity, information architecture, editorial clarity and interaction** design; **not** a new title illustration, gameplay tutorial system, save subsystem, graphic-resolution policy, combat change, major engine rewrite or an instruction to redesign Keeper narrative/Archive authorship. Preserve all four existing classes and legally reachable modes, save v4 and backup protections, bilingual English/Spanish, keyboard/mouse/Chromebook inputs, PWA offline/update lifecycle and display orientation.

**Design priority order:** player comprehension and correct/safe action > legibility and focus > visible information hierarchy > consistent visual identity > animation/polish. Less text is not automatically better when it removes a condition, consequence or critical instruction.

## 2. Visual identity — game icon owns the palette

**Source:** existing original `icons/icon-192.png` (golden crown and warm starburst over near-black with purple/violet/magenta magical trails). Inspect the actual asset and other shipped icon resolutions; **do not recolor the icon** to fit green title or blue-slate menu CSS.

The following is a deliberately restrained **candidate solid-color UI palette visually guided by the icon**, not an assertion that the hexadecimal values are exact sampled pixels. Engineering may tune measured accessible derivatives within the same color-family contract; no new green/teal/blue-slate menu identity.

| Design token | Candidate color | Semantic role |
| --- | --- | --- |
| `menu.canvas` | `#0C0715` | Obsidian background, nearly black with purple undertone |
| `menu.surface` | `#1B1129` | Main panel/dialog |
| `menu.surfaceRaised` | `#271634` | Buttons/rows/disclosures |
| `menu.surfaceSelected` | `#352047` | Chosen/active row; never the only selection indicator |
| `menu.ink` | `#F7F0E8` | Paragraphs, controls, important labels |
| `menu.inkSecondary` | `#CFC4D4` | Secondary descriptions |
| `menu.inkQuiet` | `#B4A7BC` | Deemphasized but still readable information |
| `menu.crownGold` | `#F6C75D` | Primary CTA, focus ring, rare headline accent |
| `menu.arcaneViolet` | `#A66AEB` | Selection accent and limited decoration |
| `menu.edge` | `#86669A` | Separators and control outlines |
| `menu.amber` | `#F0A54E` | Important caution/milestone; with explicit text |
| `menu.danger` | `#FF9680` | Destructive action/warning; with text and confirmation |

Preliminary computed WCAG contrast ratios for these solid pairs: primary text on `surface` **16.04:1**; secondary on `surface` **10.79:1**; quiet on `surfaceRaised` **7.35:1**; gold on `surface` **11.43:1**; primary on `surfaceSelected` **12.83:1**. These verify candidate **solid** colors, not transparency/gradients, composites over the live game, actual WebKit appearance or the sampled icon. Engineering must measure final computed surfaces and states after implementation. Target normal text ≥4.5:1 and large text/essential nontext indicators ≥3:1, preferably higher for small phone type. Disabled options must remain intelligible even when unavailable.

Use **one family** for main title, startup/update, language welcome, title-owned dialog, New Game, save/recovery, Settings, Help/Credits and in-game menu/modal. Gold communicates primary action; violet communicates current selection, hover/focus and small decorative magic, without making every button neon. Normal controls use quiet dark panel fills and high-contrast ivory labels. Warm amber serves actual alerts; red/danger must not be reused merely as decorative accent. Primary CTA can use solid gold with near-black text if final contrast passes. Separate keyboard **focus** and **selected** states with an outline/shape/checkmark, not color alone.

Keep the icon and menu graphics faithful, but no giant blurred icon, heavy glow, constant particle animation, large raster background, unnecessary backdrop filter or color effect that increases phone rendering pressure. Serif type is appropriate for **display/title** only; use a readable system sans for buttons, explanatory paragraphs and settings values. Do **not** blindly replace global `:root --ui-*` values used by gameplay HUD, HP/mana, warning telegraphs or combat; scope new menu tokens to menu shells or intentionally map existing modal-specific selectors. HUD/world performance/color-semantic changes require their own separate acceptance.

## 3. Typography and responsive layout contract

The permanent design coordinate system is the **landscape game view**, even if the physical iPhone is upright and the persistent wrapper rotates that view sideways. Reference **800×375 CSS px**, with additional iPhone Air-sized short/wide viewports and nonzero safe-area insets. Preserve natural aspect ratio, full-bleed world/title surface, the existing outer `phone.html` → inner `phone-game.html` same-origin persistent frame and mapped touch/insets. Do not bring back portrait gameplay or a rotate-to-play screen.

**Reading hierarchy:** title display 24–30px (space permitting); dialog/page headings approximately 20–22px; actionable labels approximately 15–16px; normal body/Help text at least 15px; short supporting labels at least 13–14px; 12px only for genuinely nonessential metadata (e.g. build string), never a required warning or explanation. **Eliminate the current general phone 9px detail / 11px paragraph and action-label treatment.** Target body line height 1.45–1.6, support labels ≥1.35, comfortable spacing and clear paragraph breaks. Allow natural English/Spanish wrapping. Don't solve overflow by downscaling essential text.

Touch controls and Back must measure **≥44×44 CSS px** after computed styles; preserve keyboard focus and actual touch target geometry. Maintain stable, obvious Back / Cancel / Return semantics, padded clear of physical cutouts and home indicators. The Back action stays reachable while the **content** scrolls; long text should never require dragging a tiny scrollbar or reaching a hidden bottom action.

Use a wide panel for the title and setting/library hubs; 2 columns **only for comparable independent choices** (two-column class cards, mode tiles or a small settings index), never for continuous body reading. Reading pages are single-column with a sensible max text measure (~55–70 characters on large viewports, adapted to phone). Optional details can expand inline when they aid a choice. Each dialog has a visible concise heading identifying its location (e.g. **Settings / Sound**, **Help / Combat**, **Saved Games / Recovery**). Avoid verbose repeated headings, but don't remove all wayfinding as the current `[data-view='adventure']` and `[data-view='settings']` selectors do. A small header and a single persistent Back beat a large decorative heading.

Use **content-first layout:** if a page needs scrolling, let it scroll within a stable viewport and reveal an unobtrusive overflow cue only if actually scrollable. No essential item should be clipped or overlap another control. Title primary actions must be visible at first landscape view without scrolling. Archive reading, maps, large specialist catalogs and restoration confirmations keep purpose-built scroll/layout behavior rather than force-fitting a universal grid.

## 4. Information architecture — explicit flows

### A. Main Menu: exactly five established destinations

1. **Continue Adventure** — promoted primary CTA **only when an eligible save exists**. A concise existing-save preview beneath/near it shows class/name, level, location; separate backup warnings are contextual, not a permanent wall of text. Without an eligible save, **New Game** receives visual prominence, and Continue is clearly disabled or visually secondary with an understandable reason.
2. **New Game** — new-adventure setup as below.
3. **Saved Games & Backups** — local slots and safe storage tools.
4. **Settings** — player controls and preferences.
5. **Help & Credits** — beginner guidance, troubleshooting and author details.

Retain exact functions, valid/disabled rules, resume/update gates and first-language choice unless targeted verification supports a distinct correction. Do not add an overlaid logo or giant title which steals the space needed for buttons. Keep all five buttons as genuinely distinct targets on first view.

### B. New Game: choose difficulty/challenge together, then class

**Current 4-tap path:** New Game → mode → long Challenge condition/story gate → class. **Design target for a typical first-time Normal run:** New Game → **Choose Hero** (with Normal and Standard defaults visible on setup screen) → tap hero class to begin. That's **three deliberate taps from the title**, plus an overwrite confirmation only if a save would be replaced; no hidden auto-start or changed saved game.

Step 1 **New Adventure:** choose difficulty **Normal (recommended)** or **Nightmare (locked with exact unlock reason until genuinely available)**, plus separately controlled optional **Succession Challenge (Off by default)**. Leave Developer and Combat Diagnostics behind their existing authorized feature flags. Allow the valid Normal/Nightmare × Standard/Succession combinations that source already supports. Succession's consequence appears in one succinct line and a **Details** disclosure: a fallen class cannot return in this run; if all four fall, the run ends. Standard indicates death/recovery without implying no penalty. Remove the lengthy Dark Lord story synopsis from a mandatory pre-class dialog; preserve accurate story premise in optional How to Play/intro copy. Main action: **Choose Hero**; Back restores title without starting or deleting anything.

Step 2 **Choose Hero:** one screen with four comparably designed Paladin, Mage, Ranger and Rogue cards in a 2×2 landscape grid, each showing **name + short playstyle + one concise growth/passive cue** at equal typographic weight. Make Rogue's Charm mechanic truthful without a six-line exception: e.g. **Rogue — Charm survivors, disrupt with music, outlast danger**; place its precise survival/automatic-basic-hit conditions in optional Help/details, not the compact card. Do not make class mechanics up or change class ids. Retain existing optional character name below the cards; it must not auto-open the keyboard. Tapping a class starts the current supported new-game path, with the **existing overwrite safeguard at the moment it matters**. No unnecessary extra final confirmation for a free slot. More detailed class learning belongs in Help/class details if needed.

### C. Saved Games & Backups: group by intent, protect consequences

The first view uses a clear **Your adventures** group: valid Normal/Nightmare slots (and flagged dev/arena slots) with character, level and zone; explain disabled slots in place. **Backups** contains Export for specific slots and an actual native Import file input (must not be replaced with a script-clicked invisible picker). **Recovery and storage** groups Try recovery, conditional original export, checkpoints and request persistent storage. On a short phone, groups may be collapsible, but recovery for a failed save must rise near the affected slot rather than be hidden behind unexplained advanced jargon. The first view should make **continue a game** obvious without mixing it visually with destructive or diagnostic operations.

Use short actions: **Export backup**, **Import backup**, **Recover saved game**. Explain JSON only when necessary, as the file format for an export/import. Keep essential warnings **at the consequential transition**: replacing an existing run, restoring over a save, or clearing local storage; never remove checks/confirmations, protected original recovery or the user's chance to export first. Only claim persistent-storage protection if the browser actually grants it. Export/import/recovery semantics, original-save preservation and storage guards must remain identical.

### D. Help & Credits: help the player before helping the developer

First level:
- **Quick Start** — purpose, first steps, travel and quests (a short three-step narrative).
- **Combat & Companions** — tap/hold skills, targeting and Recall; deeper technical Skill Block/cooldown explanations stay where needed.
- **Saved Games & Updates** — how local saves and exported backups work; clear offline/update behavior.
- **Troubleshooting & Reports** — simple problem-reporting recipe and device-specific suggestions.
- **About, Version & Credits** — verified installed version and existing creator contact.

A **Developer / Advanced diagnostics** disclosure inside Troubleshooting, not a peer to Quick Start, holds renderer profiling, navigation profiling, bounded timing explanations and exporting a playtest report. Preserve the explicit notice that JSON reports are **not sent automatically**, should be reviewed before sharing, and may include game/device details. The actual export action remains discoverable from Settings → Screen & Performance. Keep contact links and known public email/forum information intact.

No mandatory reading page beyond approximately **three short paragraphs** for ordinary Quick Start. Long/how-it-works technical references can remain deeper and clearly labeled. Avoid cross-referencing Settings in every paragraph; one well-placed **Open Controls** route or accurate instruction is enough. Preserve exact English/Spanish meaning, warning severity and game facts.

### E. Settings: friendly surface, intact advanced control

First level: **Controls**, **Screen & Performance**, **Sound**, **Language** with a simple title and unambiguous Back. If running as a PWA-eligible phone web tab, preserve contextual **Install on phone**; show **Install available game update** only when an update is actually ready. Do not duplicate manual update checking.

Within Screen & Performance, group current live values into **Display**, **Graphics**, **Frame rate**, **Renderer**, and **Advanced diagnostics**. The default view is understandable without requiring knowledge of WebGL2, backing resolution or profiling. Put clear one-line explanations near ambiguous options, e.g. **Rendering resolution — sharpness vs device load**; keep technical details in a disclosure. **Do not remove, change values/defaults or silently auto-adjust** optimization mode, FPS settings, pixel resolution, 150% camera, renderer fallback/Keep-Revert or phone/desktop presentation preference. Preserve the native `select`/`range`/`switch` input behavior and immediate indication of the chosen value; any renderer transition still follows its existing safety flow.

Sound should use concise named volume sliders, a clear mute switch, and plain explanation of preserved sliders. Language must provide English and Español, update the current view correctly and retain separate preference persistence.

### F. In-game Adventure and specialist menus

The regular **Adventure menu** keeps its actual gameplay entries (Barracks construction when eligible, map/routes, Quest journal, Character, final objective when eligible, Game Settings and Return to Main Menu). Unavailable construction retains its reason. Preserve dynamic entries/permissions and the save-before-return pathway. Make everyday tasks visible before uncommon/global actions; dangerous **Return to Main Menu** should not resemble an ordinary combat action. Use concise location header **Adventure** and navigable Back.

Ordinary merchant, Barracks, inventory, training, journal, map and companion menus inherit the common colors, heading scale, Back and readable action descriptions, but their domain-specific authorial content, permissions and information structure are **not** to be rewritten wholesale in this project. Preserve full Archive/Keeper prose, scroll and semantic headings. Class-specific/shop-specific long lists are evaluated against actual length and reason, not arbitrarily collapsed. No new global service shortcuts that circumvent NPC/location permissions.

## 5. Content / microcopy standard

- **One action = one recognizable verb/object.** “Import backup” better than “JSON file management”; “Choose Hero” better than a vague “Continue”.
- **One short reason beside a disabled action.** E.g. “Nightmare — unlock by completing the peaceful ending,” rather than merely faded text.
- **Explain consequences before irreversible choices.** Overwrite/recovery, Succession, renderer temporary trial and save failures are not trimmed to ambiguous slogans.
- **Progressive disclosure:** show enough to decide now; put detailed mechanics, file formats, diagnostics and exceptions one deliberate tap deeper.
- **Remove redundancy, not information.** Don't repeat a heading's subject as an introductory sentence or restate “Go to Settings” in every Help topic. Prefer short structured explanation to a paragraph block.
- **Preserve the official English/Spanish player vocabulary** (crowns, Normal/Nightmare, Skill journal, Recall, Barracks, etc.) and accurate actual rules. Audit Spanish for length and naturalness, not literal English word-count matching. Never display truncated button labels or untranslated fallback text in a primary path.
- **No promotional or false progress claims.** “Version 0.9.2 planned” is not “already included”; installed build comes from the runtime source. No invented guarantees of device smoothness.
- **Do not turn authored lore into UI documentation.** Keep story and narrative richness where it belongs; reduce forced pregame exposition instead.

### Illustrative label-level copy (proposed; engineering to verify exact gameplay semantics)

| Context | English | Español |
| --- | --- | --- |
| Start action | Choose Hero | Elegir héroe |
| Default journey | Normal · Recommended for your first adventure | Normal · Recomendado para tu primera aventura |
| Optional challenge | Succession Challenge · Off | Desafío de sucesión · Desactivado |
| Challenge summary | When a class falls, you cannot play it again in this run. Lose all four classes and the run ends. | Si una clase cae, no podrás volver a usarla en esta partida. Si caen las cuatro, la partida termina. |
| Saves section | Your adventures | Tus partidas |
| Backup action | Export backup | Exportar copia de seguridad |
| Report help | Reports stay on your device until you choose to share them. | Los informes permanecen en tu dispositivo hasta que decidas compartirlos. |
| Advanced grouping | Advanced diagnostics | Diagnósticos avanzados |

These are **design copy candidates**, not a license to change actual underlying names or the game rules. Where abbreviated text might hide a meaningful constraint, the full original condition remains in a deeper explanation and at the relevant decision point.

## 6. Interaction model, accessibility and acceptance

**Touch-first on phones:** direct tap selects exactly the tapped action; horizontal orientation of the **game view** never changes between physical upright/sideways; transformed hit testing stays accurate; touch can scroll long content while pinned Back is available; no virtual joystick needed to use a menu. No accidental world movement or casting when interacting with a menu.

**Keyboard, mouse and hybrid:** preserve WASD/arrow navigation where currently valid, custom bindings, Enter/Confirm and Esc safety fallback, native form Tab/Shift+Tab, pointer click→keyboard continuity, focus restoration, selection/scroll restoration and disabled-option behavior. A selected row needs a visually perceivable indicator that survives color-vision differences; screen reader labels/native control semantics must remain meaningful.

**State and failure cases:** fresh launch, return from campaign, no save, valid save, corrupt/missing save, save import with/without conflict, confirmation cancel, unlocked/locked Nightmare, standard/Succession, optional name and OS keyboard, language switch while in submenu, update available/offline, iPhone cutouts, Safari vs installed PWA. No visual revision changes the result of any of these transitions.

**Objective checks for engineering and owner acceptance:**
1. With an eligible save, **Continue Adventure** is clearly primary; without one, **New Game** is primary, all five main actions visible in reference landscape and English/Spanish.
2. New Normal/Standard adventure can go title → setup → class → playable campaign, **three taps** after a fresh title is visible (excluding an optional name entry or genuine overwrite confirmation), and optionally chosen Nightmare/Succession still accurately work.
3. The smallest displayed essential body copy is **≥15 CSS px**, menu action labels **≥15**, supporting descriptions **≥13**, min touch action/Back **44×44**, final displayed contrast meets the targets above. No active player-facing 9px auxiliary text.
4. No content or Back/action target intersects mapped safe zones. Long EN/ES, 800×375 and iPhone Air-sized short-landscape viewports remain readable without changing graphics backing resolution.
5. Every title menu and title-owned submenu visibly belongs to the icon palette. No green-title → blue-modal switch; critical semantic warnings remain distinguishable.
6. Back from nested settings/help/saves returns to the expected parent with scroll/focus retained; returning to gameplay and pausing/closing menus remain safe. Testing a slider or file input never activates a different action.
7. All original import/export/recovery, update, renderer Keep/Revert, offline operation, language, controls and gameplay settings retain their existing semantics/defaults and save compatibility.
8. Real iPhone Air Safari/installed-PWA perceptual approval is **separate** from Chromium/WebKit emulation; confirm legibility, thumb reach, landscape/full-bleed and sideways touch before declaring device verified.

Objective tap-count and declared-size targets are **design acceptance targets**, not measurements of the current phone. Avoid inferring user comfort solely from CSS and emulated browser checks.

## 7. Engineering implementation sequence and dependencies

**Design Stage D0 — THIS DOCUMENT:** record interface direction and source evidence. This step changes no runtime code and does not establish iPhone approval.

**E1 — Style contract and readable text (first executable phase):** define scoped CSS tokens and remove conflicting title/modal/general phone overrides; apply consistent palette/typography to title/welcome/all modal surfaces while protecting gameplay HUD, world, health/mana/warnings. Measure contrast, final composite backgrounds, type, 44px hitboxes and safe inset behavior. Run focused CSS and real-browser shell tests; no version bump until a distinct release candidate exists.

**E2 — First-run choice and Title flows:** implement five-action visual hierarchy and two-step New Adventure → Hero with preserved difficulty/Succession conditions, class details, optional name and overwrite safeguard. Focus tests on English/Spanish, four hero classes, no/valid save, Nightmare locked/unlocked and existing startup/campaign lifecycle.

**E3 — Help/Saves/Settings IA and microcopy:** group menus, refine texts and support/advanced disclosures, protect native file picker, storage/recovery confirmations, settings setters, version and update text, and unchanged graphics choices. Add focused bilingual text/flow tests, backups and renderer trial protection.

**E4 — Shared navigation / representative specialty parity:** ensure common heading/Back/selection/scroll states on Adventure and representative merchant/Barracks/inventory/map/Archive views, preserving authored long narrative and any domain-specific placement. Test touch–keyboard hybrid, short landscape geometry and Spanish wrapping.

**E5 — Focused review and physical acceptance:** exact-head scoped Node tests, Chromium + relevant WebKit layout/action tests and reproducible build, attached to draft engineering PR with actual measured text/contrast geometry and screenshot comparisons. Only after independently authorized merge/publication should owner perform iPhone Air Safari and installed-PWA acceptance of the new release. Stage 4 remains open until then.

**Code ownership:** `styles/prototype.css`, `styles/phone.css` (and desktop only as needed), `src/prototype/app.js` title/New Game/Settings/Help and shared `openMenu`/`renderActions`, `src/prototype/menus.js` only for bounded service consistency, `templates/game.html` if markup really requires it, plus actual bilingual resources and existing menu/input/phone browser tests. Preserve `phone.html`, `templates/phone-frame.html`, `styles/phone-frame.css` transformation unless a demonstrated layout defect specifically requires a compatible correction. Validate generated artifacts via the project build; do not hand-edit them as source.

**Concurrency/governance:** Recheck active parallel PRs and source before editing `app.js` or CSS. Use an isolated **draft implementation PR** based on then-current `main`, with small reviewable commits and updated affected docs. Do not merge, deploy or initiate comprehensive suites without separate owner authorization. Source-level design acceptance does not prove implementation/test/merge/deploy/device success.

## 8. Evidence / decision boundary

**Confirmed in current source:** mismatched green title vs blue-slate modal and the icon's violet/gold visual identity; very small `phone.css` general menu text rules; existing main menu, mode → Succession → class flow, Help topic catalog, save import/export/recovery and settings hierarchy; existing menu history/selection and pinned Back foundation; dev.255 code integration and release receipts from #798.  
**Game-design decisions proposed here:** icon-led token family, larger reading text, two-screen New Adventure setup, grouping/wording/wayfinding/hierarchy.  
**Not yet proven:** exact final visual contrast after CSS composites, real iPhone subjective readability and ease, whether every flow reaches the target tap count, any performance impact of changed decorative effects or actual full-browser regression outcomes.  
**Historical D0 boundary:** The original design-only checkpoint performed no implementation or testing. The engineering checkpoints below supersede that implementation status; merge, publication and real-device acceptance remain separate.

**Engineering checkpoint, 4 November:** PR #800 is now the **implementation PR** (not a separate future PR). Stages E1–E4 have received candidate source changes in `styles/prototype.css`, `styles/phone.css`, `src/prototype/app.js` and focused menu tests. Reviewer must inspect the real diff, final CSS cascade, bilingual copy and current gameplay setting/saving safeguards. This statement is **implemented in draft** only, not tested, merged, published or device accepted. Subsequent CI evidence and status should be recorded at exact commit IDs before merging.

**Next handoff:** Engineering can use this document as the product-facing implementation contract, tracking its work under existing [#270](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/270) and the resulting draft PR; continue to attach owner real-device observations to [#790](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/790). The owner retains approval for consequential design changes and all merge/deploy decisions.


**Engineering continuation, 4 November (E5 HOLD):** Reconciled concurrent branch corrections through `46df8e5`. Fixed stale Normal-selected setup prose, made the class page heading Choose Hero / Elegir héroe, enforced 15px phone title actions and shared dialog body/actions, 13px shared details and readable disabled choices. Expanded the production-shell test to all four classes in EN/ES, Normal/Standard defaults, unlocked Nightmare × Standard/Succession, and selection persistence on Back. The original app and persistence-safety suites passed locally after their obsolete orientation/flow expectations were corrected; expanded menu tests passed. The existing focused Pixi migration browser test now preserves public phone-frame navigation and adds actual computed title/card/Back geometry assertions at 800×375. Local Chromium installation failed (truncated download); no local browser pass, final composite-contrast measurements, WebKit acceptance or perceptual review is claimed. Generated offline fingerprints are rebuilt, with the draft still carrying dev.255 until a separately approved release candidate is prepared. Next: verify exact pushed-head focused CI, renderer/browser geometry and affected original regressions, then complete remaining E1–E5 design reconciliation. No merge or deployment performed.


**E5 follow-through:** First computed Chromium run on `b7629e8` confirmed phone class labels 15px, details 13px, heading 20px, Back 44px and panel x=50–750 at 800×375; phone default renderer migration also passed. Desktop measurement correctly blocked on an older, more-specific class rule (14px/12px); that rule is corrected in the next candidate. Focused CI passed 15 of 16 suites and exposed a stale `phone.html` script-inventory assertion, now directed to the actual `phone-game.html` engine entry. The original shared-navigation test now dispatches all keyboard listeners instead of only the earlier soundtrack unlock callback. The map test is reconciled with the already-existing preservation of owned navigation orders while menus pause the world; no navigation implementation was changed. Original instructor and title-lifecycle tests passed locally. A persistent, bounded menu-only Chromium/WebKit workflow now exercises EN/ES at 800×375 through the real public phone frame, nonzero safe areas, actual touch, Back/Escape, visible native import, measured text/targets and opaque-button contrast, retaining screenshots and JSON evidence. It does not run combat or the comprehensive browser suites and cannot establish physical iPhone approval. Its results remain pending until CI reports them.


**Candidate reconciliation:** Concurrent commits through `d01ad1b` reserve **dev.256**, update the package/lock/build marker and maintained development ledger; this is a draft cache identity, not publication. Regenerate the worker against the final combined CSS/app source. Keep the stronger 15/13px class checks with their actual CSS correction rather than lowering the desktop test threshold. The menu-only acceptance workflow above is the remaining bounded browser evidence owner.


**Verified engineering checkpoint — `d6f6eb49e3f7c2c131a583567b67977641b42bfe`:** [Focused validation #41966381358](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41966381358) passed all **21 selected original/native suites**, docs consistency and the reproducible offline-ready dev.256 build (243 campaign assets). [Menu-only Chromium and WebKit #41966381571](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41966381571) both passed English/Spanish real public-frame touch, safe-area bounds, ≥15px body/actions, ≥13px details, ≥20px heading, ≥44px targets, opaque-button text contrast ≥4.5:1, native import, scroll/Back and Escape. The run retains screenshots and JSON measurements as `menu-ux-chromium` / `menu-ux-webkit` artifacts. [PWA update #41966381337](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41966381337) passed. [Original renderer migration #41966381414](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41966381414): **desktop and phone both passed**, including current title/New Game, preference migration, Canvas opt-out and manual renderer trial. Original specialist menus, eight instructor flows, title lifecycle, shared controls/focus and map/quest preservation also passed locally on the same relevant source. Earlier failures remain recorded above and were repaired, not waived. **E1–E5 focused engineering checks PASS; Stage 4 stays open for physical acceptance after separately authorized publication.** This is browser/source verification, not iPhone Safari/installed-PWA approval or a full-game certification. No merge/publication performed; published baseline remains dev.255.


**Final engineering disposition:** Candidate dev.256 is ready for owner-authorized integration/publication with no confirmed blocker in the focused checks listed above. This does not certify every specialist page, campaign completion, hardware performance, translucent/composited text contrast at every pixel, Safari OS behavior or the installed iPhone experience. Those limits do not change saved-game, graphics or input requirements. The exact unchanged runtime tested above is the acceptance reference; this final reconciliation changes documentation only. The full game/browser matrix was not run.
