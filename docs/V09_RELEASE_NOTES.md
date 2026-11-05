# So I Became the Dark Lord's Problem — v0.9 release notes

## v0.9.2 — functional-completion release candidate (DRAFT; NOT PUBLISHED)

**Current status — 4 November 2026.** The latest *verified published* game is **`0.9.1+snapshot.dev.256`**, including [merged Stage 4 menus PR #800](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/800) and [successful merged-main Pages run #41967773134](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41967773134). The [draft v0.9.2 PR #781](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/781) is being reconciled onto that current source; its proposed version is **`0.9.2+snapshot.dev.257`**. The version is **not released**, and the earlier candidate dev.254's green CI applies only to that superseded source head. New exact-head validation and the owner's separate merge/deployment permission are still required.

### Already implemented in the published baseline

- **Four existing playable classes:** Paladin, Mage, Ranger and Rogue/Pícara, with their current eight Tap/Normal and Charged forms, Critical Executions, real rank progression and existing v4 saves. The owner decided **no class/skill redesign for v0.9.2** ([#776](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/776), [#777](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/777), [#778](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/778), [#779](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/779)).
- **Existing five-region campaign:** Greenwood Vale, Flooded Marches, Ironroot Highlands, Ashen Frontier and Dark Crown, including settlements, dungeons, Treasuries, companions/pets, Barracks, quests, Normal/Nightmare progression and endgame. These are available game systems, **not five individually owner-accepted playthroughs**.
- **Save durability and offline play:** validated device-local v4 exports, import confirmation and checkpoint recovery, with coherent Progressive Web App (PWA) offline bundles. Cloud sync or an IndexedDB rewrite is not claimed.
- **Rendering and soundtrack:** PixiJS/WebGL2 default, separately selectable Canvas 2D backup, merged bounded boss/Treasury/Cindermaw navigation [#717](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/717) and all-five-region outdoor soundtrack crossfades [#785](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/785). Native blocked-probe reductions and software-browser tests **are not measured real iPhone/Chromebook FPS** or final listening acceptance.
- **Menus, submenus and phone presentation:** [#791](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/791), [#793](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/793) and [#798](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/798) have **merged/published** the permanently horizontal phone game (even when held upright), full-bleed safe-area-aware frame and navigation foundation. **[Stage 4 #800](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/800) is implemented, tested, merged and published**: gold/violet icon-led bilingual menus, legible text, New Adventure → Choose Hero, optional Succession, grouped saves/backups, Help and settings. The real iPhone Air Safari/installed-PWA menu and submenu experience **still requires the owner's review** under [#790](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/790); do not describe Stage 4 as missing from code or fully device-verified.

### Planned owner playtests and release decision

**Before release:** The owner plans to play **Greenwood Vale**, the important opening region, and examine any genuinely serious issue observed in normal play. **This playthrough has not been completed or signed off.** Unmerged overlapping Greenwood interaction feedback drafts [#533](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/533) and [#538](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/538) remain relevant but **are not automatic blockers**; do not merge outdated dev.209 source wholesale.

**Across the campaign:** The owner intends to **test each of the five regions individually**, on a schedule of their choosing. Flooded Marches, Ironroot Highlands, Ashen Frontier and Dark Crown are **not automatically mandatory pre-v0.9.2 playtests**, nor should synthetic tests be misrepresented as owner's in-game acceptance.

**Outstanding reliability evidence:** Physical iPhone rendering-stall report [#783](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/783) (684 ms/435 ms Pixi render-heavy frames) remains a real unresolved observation; [test-only #789](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/789) has not shipped a source fix and further speculative optimization is paused pending new device evidence. The deliberately accelerated dead-Ringleader save-cap case [#634](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/634) was **explicitly deferred by the owner as implausible in ordinary play**, without falsely calling the boundary fixed. The same principle applies to future menu/graphics/device observations: fix material reproducible defects, not every optional polish suggestion.

**Publication gate:** Revalidate the *updated* exact PR head with focused build/PWA checks; confirm the four-class game, saves, menus and cache markers; obtain explicit owner authorization; merge, then verify the **v0.9.2 exact-main Pages publishing job**. A successful draft CI is not publication, and hosted publication is not installation/device acceptance. No broad test matrix is inferred.

### Explicitly outside v0.9.2

- **Dark Crown regional capital overhaul** (different from dark display mode): [lead implementation draft #769](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/769), [design contract #707](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/707) and [volcanic landscape draft #794](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/794). Actual Foundry equipment replacement, waterworks, civic/industrial geography and independent artistic/device acceptance remain unfinished. The owner wants any completed overhaul **released separately after v0.9.2**, subject to later authorization rather than automatically after this release.
- **Fifth playable Ogre Strategist** and its developer-only/dormant skill, Field Lab and alchemical-economy branches ([#792](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/792), [#782](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/782), [#796](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/796)). No fifth-class admission or new playable release.
- **Wider environmental/aesthetic finishing** [#736](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/736)/[#739](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/739), broader individual regional acceptance, old Greenwood interaction drafts, optional skill redesigns, historic test reconciliation, generic optimization and cloud-save migration are **not required to merge v0.9.2**.

**After v0.9.2:** The owner intends an **indefinite development hiatus** to focus on other interests. Preserve all deferred branches and documentation for an optional future restart. Keep forum support and accurate release announcements, but do not treat the current forum's participation level as a design mandate or schedule new development automatically.

---

## October 2026 Community Snapshot — historical published release

**Historical published build: `0.9.1+snapshot.dev.119`.** These original notes describe the October snapshot, not the current public build or an approved v0.9.2 release. Current publication evidence is in [Development state](DEVELOPMENT_STATE.md).

### 20 October published updates

Improved adaptive performance/caches and crowd recovery; safer companion support, resource routes and one-press Recall; enemy healing/regrouping and nighttime balance; fortified ranged defense and clean arc landings; Frontier/Crown town, roads, river/lava and dungeon improvements; first-person Keeper Archive and NPC visibility; passage-fare recovery and visible update notices. All eleven pets have current roster/skill behavior, distinct roles and readable skill effects. Character appearance and selected procedural scenery/cottage replacements are live.

Latest publication: PR [#353](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/353), merge `2c302d6c4d0a08993111027e0f64bb692658a800`, package-only run `39524586782`; [eight exact relevant live files verified](evidence/RANGER_FEEDBACK_DEV119_PUBLICATION_20261020.json). Ranger Heal now explains Silence instead of a zero cooldown. Treasurer and pet now carry the requested silver-Crown money bag at unchanged grips. Per-change focused checks, receipts and limits are indexed in [current state](DEVELOPMENT_STATE.md). Existing saves remain compatible. This is publication evidence, not a new universal hardware-FPS or whole-game playtest certificate.

Current art decisions and the revision-first sprite queue: [restart handoff](SPRITE_RESTART_20261020.md). The later owner-requested Treasurer money bag correction is tracked separately in [its release record](TREASURER_MONEYBAG_20261020.md). No automatic new production follows this closeout.

## Earlier snapshot scope

- Five-region offline-capable single-player RPG with desktop/Chromebook keyboard and mouse controls and a dedicated phone touch layout.
- Standard and optional Succession campaigns, Normal/Nightmare saves, specialist rescues, revised boss/captain encounters and authored worldbuilding.
- Eight class-specific hero skills with tap/charged forms, cooldown-only combat, companion support, eleven pet families and concise skill/condition references.
- Auto/30/60 rendering, camera selection, optional Optimization Mode and contextual soundtrack/effects. These do not establish universal device FPS or listening comfort.
- Minimal English/Spanish presentation selection; this is partial localization, not a complete campaign translation.
- Dev.79 enables manual tap/charged Skill 1 in Developer Mode while keeping movement auto-attack disabled.
- Earlier narrow fixes: movement auto-attacks respect fleeing/Recall (dev.77), and Character and identity uses spoiler-free descriptive copy (dev.78).

Existing Pages URLs and installed-app identity remain stable. [Play in a browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) or [open the phone entry](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html). Export saves before clearing browser data or changing devices. The existing v4 schema and legacy v2 import remain; no cloud save service or playable co-op exists.

## Historical dev.79 publication and validation

The dev.79 published gameplay source was `23d951092ea5dff806c460c62ca71eeced574f5c` (#319). Successful [packaging-only publisher 39312326936](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39312326936) deployed this exact dev.79 merge after the owner explicitly approved publication with no further testing on 19 October 2026. No new CI/gameplay certificate was issued. Earlier dev.78 evidence remains in [the release handoff](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md).

PR #308 has consolidated full validation evidence. #313 was merged under the owner's release instruction with focused/WebKit evidence and incomplete broader work. Dev.76–78 and the later dev.79 publication used explicit no-CI/no-further-test instructions. Fresh full gameplay/balance certification and complete native-device/human aesthetic acceptance are not claimed. Those historical limits are retained; they are not current break-blocking homework.

## Historical 19 October break boundary and recovery

Documentation audit and PR consolidation are recorded in [current state](DEVELOPMENT_STATE.md) and [the audit](DOCUMENTATION_AUDIT_20261019.md). [#319](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/319) merged the closeout and the manual Developer Mode Skill 1 repair. Its preserved reconciliation ledger records future work; no future implementation runs automatically. Whole-game independent regression, visual polish, co-op modernization, old sprite adoption and outreach wait for the owner to return. Forum silence is not validation.

No rollback is performed or recommended solely because certification was limited. If an actual defect later needs a corrective release, preserve saves and original backups, choose a source supported by evidence for that defect, use a fresh cache/version, pass applicable checks, obtain release authorization and verify publication. Old v0.8.x rollback references remain historical and must not automatically replace the much newer snapshot.
