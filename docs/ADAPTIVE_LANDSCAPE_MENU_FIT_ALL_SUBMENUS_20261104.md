# SIBDLP — adaptive landscape menu fit across all submenu families

**Date:** 4 November 2026 (owner iPhone screenshots)  
**Source baseline:** PR #800, merged and published as development build 256.  
**Status:** Working implementation branch, **not** merged, published, or confirmed on the owner's device.

## Owner acceptance requirement

The six iPhone screenshots are **examples**, not an exhaustive list of affected menus. The main title's landscape presentation is acceptable; the new submenus waste available width and height, display oversized rows, and sometimes hide useful content beneath a large Back footer.

**Design rule:** size the menu to the **usable landscape viewport**, not the backing resolution or a fixed tablet-style panel. Ordinary short menus should ideally fit without scrolling. Do not meet that target by shrinking essential text or touch targets below the Stage 4 acceptance contract. Long reading, catalogs, maps, recovery and consequential warnings may scroll naturally; keep Back outside the scroll region and preserve all content and safeguards.

The phone uses the existing sideways/landscape frame and inherited safe insets. Do not rotate the modal independently, alter the world camera, change gameplay resolution/zoom, touch mapping or modify saved data.

## System-wide inventory and fit expectations

This is a whole-system contract, not a screenshot-only fix. All menus built through the common `openMenu()` and `#modal` surface receive the shared sizing and content-overflow rules. Individual families still need representative regression and real-device review.

| Family | First-view goal | When scrolling is justified |
|---|---|---|
| Main title | Five actions fit, accepted two-column composition unchanged | No |
| New Adventure / optional challenge | Choose Hero, two difficulty choices, Succession state and Back | Only unusually short viewport/translated content |
| Four-class hero selection | Four class cards, name input and Back without enormous cards | Very short viewports / long localized copy |
| Save slots & backups | Normal/Nightmare selection easily visible; recovery/exports grouped clearly | Backup, recovery and storage tools may exceed one screen |
| Settings index | Screen/performance, Controls, Sound and Language in one compact panel | No at representative landscape sizes |
| Display, controls, sound and advanced diagnostics | Compact labeled native controls with clear safe touch areas | Long forms, detailed diagnostics and binding lists |
| Help index / credits | Main help destinations visible with brief summaries | Long article/credits content |
| Adventure and in-game settings | Short indexes use the wide view rather than narrow vertical stacks | Unusual long localized copy |
| Character, inventory, equipment, skills and talents | Compact everyday actions and relevant context visible | Detailed stats, training choices and equipment catalogs |
| Companions, Barracks, specialists, merchants and crafting | Use available width; do not enlarge every service into a giant tile | Large service catalogs and genuinely consequential details |
| Quests, journals, world map and travel | Preserve authored maps, markers, route controls and context | Large destination/quest lists; do not clip a map |
| Drowned Keeper Archive, references and codices | Comfortable sustained reading; clear shelf navigation | Long answers, tables, historical material and formulas |
| Imports, save recovery, overwrite and failure confirmations | Essential warning/action reachable, no obstructed Back | Detailed recovery records and guarded confirmations |
| NPC, story, dungeon/transport and contextual dialogs | Small choices contract to their content | Authored narrative, numerous choices or long translations |

### Shared behavior

1. **Content-sized dialog:** short panels use only their required height. Every menu gets a bounded viewport and shared safe-inset awareness.
2. **Use width before scroll:** ordinary gameplay dialogs widen according to compact/regular/wide content needs, instead of staying at legacy 290–390px landscape widths. Purpose-built map/Archive and existing Adventure/Settings grids are protected.
3. **Stable navigation:** Back is always distinct from the scrollable content. Native import remains a real user-operated file input. Focus, keyboard and touch behavior remain unchanged.
4. **Typography remains legible:** preserve Stage 4's 20px headings, 15px body/action text, 13px supporting text and minimum 44px actual touch targets. Remove redundant vertical padding before reducing text size.
5. **Layout exceptions are intentional:** peer choices may form two columns (Help, save slots, difficulty); continuous reading, long warnings, controls and specialist-specific layouts must not be blindly forced into two columns.
6. **Device adaptation:** use landscape height, usable width and safe insets from the existing PWA phone frame; no hard-coded assumption that every phone has 800×375 CSS pixels.

## Implementation and test gates

The initial candidate changes shared `styles/phone.css` rules affecting **all** menus, with targeted title submenu grids and shorter redundant New Adventure/class introduction copy in `src/prototype/app.js`. It does not replace individual menu handlers or mechanics.

Focused checks should cover: English and Spanish; 800×375 and shorter/wider landscape frames; dynamic height and safe bounds; all five title destinations; New Adventure, four classes, save/backups, Settings, graphics controls, Help and a reading screen; then a sample of **in-game** Adventure, Character, Inventory, Skills, Barracks/services, maps and Archive. Protect actual 44px targets, consistent selected/focus/Back handling, visible import, safe recovery, and preservation of text when scrolling.

A structural fix in shared CSS *covers* every menu family, but a passing title-menu test alone **does not certify every gameplay submenu**, and browser emulation is **not** physical-iPhone acceptance. Further integration/device findings must be recorded before a merge/release decision. Full-game suites are not part of this bounded change.

## 5 November 2026 — game-design audit of all shared-menu consumers

**Scope confirmed in source:** `src/prototype/menus.js` injects the same `openMenu()` used by the title and game shell. A change to `#modal`, `#modal-actions` or `#modal-content` therefore also changes the player's Barracks, rescued specialists, other NPC interactions, companions, quests and Keeper Archive. The six owner screenshots are samples, **not** the complete boundary.

**Design assessment:**
- **D1 — Choice before commitment (corrected).** The New Adventure primary button used to appear before Normal/Nightmare and Succession. It now follows those settings. The current choice gets a persistent visual state and `aria-pressed` independent of temporary focus. Optional Succession Off explains that Standard retains penalties; On explains permanent class loss and an all-classes-fallen ending. No game rule or new confirmation introduced.
- **D2 — Save actions by intent (corrected).** Valid and missing slots remain visible first; a failed save surfaces its repair route near the slots. Export/Import form the **Backups** section, while **Recovery & storage** holds local recovery and storage request. File import remains the native visible input; export and overwrite protections are unchanged. The status of an unavailable save must not be mistaken for an empty safe slot.
- **D3 — Barracks hub (corrected).** Basic and Full share the existing Company, Recovery, Training and Operations in the first four positions, now presented as comparable two-column choices when landscape space allows. Tonic, terminal-rest and native upgrade remain separate full-width rows. Barracks construction and nested personnel/recovery/recruitment/resource menus retain single-column or paged list behavior, including any actual time, price or queue information. No eligibility/recruitment/gathering shortcut introduced.
- **D4 — Rescued NPC services (corrected).** The top-level instructor categories may use two columns because they are parallel destinations. Detailed skill training, Alchemist services and Smith equipment/reforging are **transaction catalogs**: one column, preserved section headings and unobstructed vertical scrolling. Individual confirmation and quoted costs are not compressed into icon tiles or silently bought.
- **D5 — Keeper Archive (protected).** The authored Archive index, topical shelves, narrative answer/figures and ledger are not interchangeable with selection menus. Eight shelves and their topic ordering, exact approved English/Spanish answer text, formula controls, one-column reading, scroll and Back history are deliberately preserved. Layout caps shelf and reader width independently of generic compact/regular/wide menu sizing. No changes to archive story copy, figures or unlocks.
- **D6 — Consistent wayfinding (corrected).** Concise Adventure and Game/Settings headings are visible again in short landscape gameplay menus; duplicated explanatory paragraphs remain hidden. Back is a distinct reachable control outside the scroll region. Title-only small confirmations stay narrower than choice grids; landscape panels center within asymmetric phone safe insets.
- **D7 — Contextual/story dialogs (retained).** Refuge, transport, dungeon entrances, quest boards, companion inspections and story prompts keep their authored instructions and conditional actions. Text-bearing single-column dialogs may scroll. Do not turn required warnings into invisible or optional copy just to meet a no-scroll aspiration.

**Design gate:** A short menu should show its core first-step actions without scrolling at reference landscape dimensions; this does **not** require long rosters, shops, narrative or recovery detail to fit. Every view keeps legible type (body/actions 15px+, support 13px+, headings approximately 20px) and 44px+ real touch controls. When the layout cannot fit safely, scrolling takes priority over truncating decisions, cost information, Archive prose, or controls.

**Design handoff to the independent engineering audit:** Inspect the exact PR head, new `data-view` identifiers (`barracks-hub`, `npc-training-hub`, `npc-service-catalog`), CSS specificity across all pre-existing landscape rules, real DOM menu focus/scroll restoration and default/feature-flag states. Verify representative Basic/Full Barracks, construction, group pager, recovery and upgrade; trainer, Smith, Alchemist/supplier, transport and refuge; Keeper index/shelf/answer/figures; both languages, 800×375 and shorter/wider landscape phones with asymmetric safe insets, keyboard/touch Back, native file import and game pause. Use focused checks; do not infer all-world certification or physical iPhone approval from any synthetic pass. The engineering auditor should record verified, deferred and blocking items by evidence, without automatically merging or deploying.

## 5 November 2026 — independent engineering preflight and release gate

**E1 — release blocker found and corrected in proposed candidate:** The design-reviewed PR retained dev.256 for `package.json`, lock, generated `build-info.js` and `sw.js`, despite changing live menu assets. A changed fingerprint map alone is not a distinct PWA release. The coherent release candidate uses **dev.257** and an updated build-info content fingerprint. Its maintained Development state entry explicitly says candidate **not published**. GitHub's reproducible build check must verify every generated byte.

**E2 — focused game-menu verification extended:** Both Basic and Full Barracks retain the exact Company, Recovery, Training, Operations hierarchy, with gated native upgrades. English/Spanish Chromium and WebKit checks now also inspect a shorter 740×340 landscape viewport and a long, scrollable specialist catalog with Back pinned outside content. Archive reading remains one-column, preserving source prose, paragraphs, figures and scroll. The 800×375 landscape baseline and real-phone cutouts remain central.

**Engineering merge gate:** Review exact PR head and current main, green focused source/recovery/build checks, bilingual menu browser checks, targeted renderer compatibility, generated offline cache and currently applicable doc/brand rules. No broad test suite or physical-device certification is implied. An authorized merge may trigger normal focused main/Pages publication; report actual merge and Pages receipt, and track physical iPhone acceptance separately.

## 5 November 2026 — verified integration and publication receipt

**Merged:** [PR #801](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/801), exact production main commit [`b62fbc43`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/b62fbc43bd1a55f2066ced779d66ef7b80822227). **Published:** [main focused validation and GitHub Pages #41979764741](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41979764741) **SUCCESS**, build `0.9.1+snapshot.dev.257`. The new PWA cache/version advances from dev.256 so installed clients can recognize a distinct update. **Final PR head tested:** `535d5d21`, [focused/build #41979236253](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41979236253), [Chromium/WebKit EN/ES #41979236251](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41979236251), [desktop/phone renderer #41979236305](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41979236305), all **SUCCESS**. The preceding engineering-preflight and candidate-status paragraphs are historical checkpoints, not current release status. The owner's iPhone Air physical/installed-PWA appearance and touch acceptance remain **not verified**; track under existing #790. No comprehensive suite or physical certification was performed.

## 5 November 2026 — compact adaptive density: follow-up to owner iPhone Air feedback (dev.258 candidate)

**New owner observation:** The dev.257 menus remain oversized for the iPhone Air. The previous Stage 4 typography guaranteed large 20px headings, 15px action labels and 13px details across a landscape phone, while some noninteractive category headings and setting labels inadvertently inherited a 44px button minimum. Large logical-space use and excessive one-column stacks cause avoidable scrolling even though real tap targets should remain 44px.

**Device principle:** iPhone Air image pixels (e.g. a 2736×1260 screenshot) are *not* available CSS layout pixels. The actual CSS logical landscape viewport, physical safe insets and available height drive responsive choices. Do not render the game at lower resolution, change the world canvas, shrink controls below 44px, or globally scale an iframe (which can break native touches and safe areas). This is a menu DOM and CSS-density adjustment only.

**Per-menu fit policy (conditional on usable viewport):**

| Family | Preferred compact layout | Legitimate overflow / guard |
| --- | --- | --- |
| Title home, New Adventure, four-class choice | Preserve two-column peer decisions, legible role/growth, full-width Succession and primary actions; 16–18px headings, 13–14px choices, 11.5–12.5px details | Do not conceal Nightmare locks, Succession permanent loss, all four classes or name input; keep native text input 16px |
| Saved Games, backups, import, recovery/storage | Two columns for peer slots/downloads; headings consume natural text height, but recovery, file import and storage actions remain discernible | Retain native file picker and conflict/recovery guards. A save-heavy/corrupt-state list may scroll |
| Help & Credits, Game/Settings, Adventure hub | Pair comparable navigation cards, compact labels, preserve context and Back | Full help/credits prose remains one readable scroll column |
| Screen/performance, sound, controls and input forms | Paired labeled settings cards on wider landscape; compact headings and details; native fields minimum 44px/16px | Narrower phone uses one column; scrolling is legitimate for lengthy settings and explanations |
| Basic/Full Barracks, teacher hub | Two-column top-level destinations; upgrades and full-width warnings keep independent rows | Paginated companion, training, equipment and recovery lists keep native eligibility and selection order |
| Smith, Alchemist, supplier, other NPC service catalogs | Paired transaction cards grouped under full-width original section labels when logical width allows | Very narrow devices use one column; long conditions and costs remain visible, purchases never occur by browsing |
| Keeper Archive shelf index / topic catalogs | Two columns of shelf/topics at roomy widths; original group labels span both | Longest shelf can still scroll; full approved Archive answers, formulas and notes remain one reading column |
| Map, character, quests, inventory and other gameplay menus | Existing map geometry, wider character panel; moderate choice sets can use two-column index cards using a shared semantic layout flag | Reading/stat-heavy content and very long roster/list menus still scroll; no truncation, paging or action mutation |
| Small confirmations, save conflicts, single-service dialogs | Remain compact rather than becoming enormous empty two-column sheets | Always retain refusal/warning text and explicit Back or safety controls |

**Implementation boundary:** Shared `openMenu()` classifies visible DOM presentation as `choices`, `form`, `reading`, or `stack` based on current content and explicit view, without persisting that classification or changing any handlers. The phone stylesheet applies a responsive scale to *text and whitespace only*. Safe-area centering and the 44px touch contract remain. Bilingual WebKit/Chromium tests verify standard ~800×375, smaller ~740×340 and larger ~912×420 logical landscapes, including live title/game menus, sampled NPC/Archive families, native form controls and independent Back.

**Verification status at creation:** planned/implemented on an isolated draft branch, **not yet focused-CI tested, merged, deployed or device verified**. Current published source remains dev.257 until an independently authorized integration and successful Pages receipt.

### Additional measured defect: stale Archive viewport anchor (5 November 2026)

The first PR #810 Chromium geometry artifacts disclosed a genuine legacy positioning conflict: `styles/phone.css`'s short-landscape `#modal[data-view='archive-*'] { bottom: 8px }` had higher specificity than the later generic `bottom: auto` reset. Combined with centered `top: 50%` and `height:auto`, the Archive index, shelf and full reading dialogs were forcibly about **180px tall in an 800×375 logical viewport** and **203px in a 912×420 viewport** regardless of available content height. The sampled 912px Archive index needed 215px of content but received only 114px, creating avoidable internal scrolling. This is a layout bug, not an authored lore-length issue.

The correction explicitly clears the legacy bottom anchor for the three Archive views in landscape while retaining the shared bounded max-height and pinned Back. The new real-browser acceptance requires short Archive indexes and shelves to fit without scrolling on the 912×420 simulated logical viewport; intentionally long original Keeper answers must still scroll with the full text accessible. Measured values above are **pre-fix headless Chromium evidence**, not physical iPhone observations. A successful updated browser run is still required to establish the correction.

### Short-catalog exception (same draft)

A generic two-column NPC catalog based only on `data-view` overexpands sparse panels: the town supplier often exposes only two services, unlike the Smith's many transactional rows. The live menu shell therefore exposes `data-menu-count` as an ephemeral view-size hint, and phone CSS caps **one- or two-service catalogs** at a 510px pane with one clear column. **One- or two-control forms** similarly cap at 540px and remain one column; larger forms continue using paired controls at roomy logical widths. Neither rule changes source action order, eligibility, input handlers or the 44px touch contract. Added 912×420 Chromium/WebKit probes for both sparse cases. Await final exact-head verification.

### CSS specificity regression caught by sparse form browser test

The first 912×420 small-form checks **failed in both Chromium and WebKit** despite correctly authored compact selector: legacy `#modal[data-dialog-size='wide']` rules include many `:not([data-view='…'])` exclusions, making their selector more specific than the newer `data-menu-layout='form'` and `data-menu-count='1'` rules. The form still rendered at the legacy 680px width. The corrective change excludes semantically sized `form` and `choices` layouts from all three legacy generic compact/regular/wide width selectors; the dedicated content-aware size rules then take precedence. This also ensures a four-choice default gameplay menu can use its proper space rather than inheriting an artificially narrow generic width. **Do not relax the browser assertion**: sparse forms must stay within 560 CSS px, one column; busy forms retain 760px and paired columns. Await final exact-head bilingual verification.
