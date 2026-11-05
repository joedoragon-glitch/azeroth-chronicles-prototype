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
