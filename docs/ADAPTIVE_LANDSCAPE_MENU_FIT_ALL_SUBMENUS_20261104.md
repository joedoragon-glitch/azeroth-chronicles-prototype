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
