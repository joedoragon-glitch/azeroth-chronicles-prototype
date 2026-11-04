# So I Became the Dark Lord's Problem — v0.9 release notes

## v0.9.2 — functional-completion release candidate (DRAFT; NOT PUBLISHED)

**Status:** This is an unpublished release-note draft, not an announcement that v0.9.2 is playable. It is based on the four-class game and completed, integrated development. The navigation optimization in [PR #717](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/717) has merged; confirm its exact main-branch publishing receipt before removing this caveat. Formal v0.9.2 publication still requires the owner's separate approval.

This update brings together the essentials that already exist rather than adding another class or starting a last-minute redesign. There is quite a lot to do in the game; the point of 0.9.2 is to make the systems work together reliably.

**What players get:**

- Four playable classes — **Paladin, Mage, Ranger and Rogue/Pícara** — with their current Tap/Charged forms and Critical Executions kept intact. Rogue's musical attacks, Charm companions, training and actual Rank 1–8 effects are part of the existing game.
- The established five-region campaign, settlements, dungeons, quests, Normal/Nightmare progression, rescues and endgame. Companions, pets, Barracks services, recovery and upgrades remain part of the same experience.
- Better companion control and visibility: timed defensive Recall, company profiles and abilities, Orin's individual Ringleader training, and clearer skill/condition information.
- More robust **local saves**: validated backup exports, import review/confirmation, a primary plus one checkpoint per mode, existing v4 save compatibility, and offline/PWA safeguards. Save data is still device-local, not cloud-synchronized.
- PixiJS/WebGL2 as the default graphics renderer with an independently selectable Canvas 2D fallback, integrated presentation/performance corrections, and the existing regional/contextual soundtrack and environmental sounds.
- More predictable boss, captain, support-guard and Crown escort movement after [#717](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/717) removes specific expensive synchronous path searches. Recorded worst-tick navigation workload reductions come from native simulations, **not** measured iPhone or Chromebook FPS.

**What this update does not claim:** There is no playable Ogre Strategist, no completed Dark Crown capital overhaul, no redesign of the four existing classes, no cloud saves, and no complete Spanish translation. Physical-device Pixi performance/recovery and wider owner playthrough acceptance are deferred until after the live version is published. Serious reproduced save, stability or gameplay failures remain valid reasons for a targeted correction.

The release build, date, version markers, final merged-main GitHub Pages receipt, and final owner approval remain **pending**. The canonical status source is [Development state](DEVELOPMENT_STATE.md).

---

## October 2026 Community Snapshot — historical published release

**Published runtime: `0.9.1+snapshot.dev.119`. Today’s requested work is complete.** The former unpublished v0.9.0 candidate notice is preserved in [documentation history](PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md). It no longer describes release status.

### 20 October published updates

Improved adaptive performance/caches and crowd recovery; safer companion support, resource routes and one-press Recall; enemy healing/regrouping and nighttime balance; fortified ranged defense and clean arc landings; Frontier/Crown town, roads, river/lava and dungeon improvements; first-person Keeper Archive and NPC visibility; passage-fare recovery and visible update notices. All eleven pets have current roster/skill behavior, distinct roles and readable skill effects. Character appearance and selected procedural scenery/cottage replacements are live.

Latest publication: PR [#353](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/353), merge `2c302d6c4d0a08993111027e0f64bb692658a800`, package-only run `39524586782`; [eight exact relevant live files verified](evidence/RANGER_FEEDBACK_DEV119_PUBLICATION_20261020.json). Ranger Heal now explains Silence instead of a zero cooldown. Treasurer and pet now carry the requested silver-Crown money bag at unchanged grips. Per-change focused checks, receipts and limits are indexed in [current state](DEVELOPMENT_STATE.md). Existing saves remain compatible. This is publication evidence, not a new universal hardware-FPS or whole-game playtest certificate.

Current art decisions and the revision-first sprite queue: [restart handoff](SPRITE_RESTART_20261020.md). The later owner-requested Treasurer money bag correction is tracked separately in [its release record](TREASURER_MONEYBAG_20261020.md). No automatic new production follows this closeout.

### Earlier snapshot scope

- Five-region offline-capable single-player RPG with desktop/Chromebook keyboard and mouse controls and a dedicated phone touch layout.
- Standard and optional Succession campaigns, Normal/Nightmare saves, specialist rescues, revised boss/captain encounters and authored worldbuilding.
- Eight class-specific hero skills with tap/charged forms, cooldown-only combat, companion support, eleven pet families and concise skill/condition references.
- Auto/30/60 rendering, camera selection, optional Optimization Mode and contextual soundtrack/effects. These do not establish universal device FPS or listening comfort.
- Minimal English/Spanish presentation selection; this is partial localization, not a complete campaign translation.
- Dev.79 enables manual tap/charged Skill 1 in Developer Mode while keeping movement auto-attack disabled.
- Earlier narrow fixes: movement auto-attacks respect fleeing/Recall (dev.77), and Character and identity uses spoiler-free descriptive copy (dev.78).

Existing Pages URLs and installed-app identity remain stable. [Play in a browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/) or [open the phone entry](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html). Export saves before clearing browser data or changing devices. The existing v4 schema and legacy v2 import remain; no cloud save service or playable co-op exists.

### Historical dev.79 publication and validation

The dev.79 published gameplay source was `23d951092ea5dff806c460c62ca71eeced574f5c` (#319). Successful [packaging-only publisher 39312326936](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39312326936) deployed this exact dev.79 merge after the owner explicitly approved publication with no further testing on 19 October 2026. No new CI/gameplay certificate was issued. Earlier dev.78 evidence remains in [the release handoff](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md).

PR #308 has consolidated full validation evidence. #313 was merged under the owner's release instruction with focused/WebKit evidence and incomplete broader work. Dev.76–78 and the later dev.79 publication used explicit no-CI/no-further-test instructions. Fresh full gameplay/balance certification and complete native-device/human aesthetic acceptance are not claimed. Those historical limits are retained; they are not current break-blocking homework.

### Historical 19 October break boundary and recovery

Documentation audit and PR consolidation are recorded in [current state](DEVELOPMENT_STATE.md) and [the audit](DOCUMENTATION_AUDIT_20261019.md). [#319](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/319) merged the closeout and the manual Developer Mode Skill 1 repair. Its preserved reconciliation ledger records future work; no future implementation runs automatically. Whole-game independent regression, visual polish, co-op modernization, old sprite adoption and outreach wait for the owner to return. Forum silence is not validation.

No rollback is performed or recommended solely because certification was limited. If an actual defect later needs a corrective release, preserve saves and original backups, choose a source supported by evidence for that defect, use a fresh cache/version, pass applicable checks, obtain release authorization and verify publication. Old v0.8.x rollback references remain historical and must not automatically replace the much newer snapshot.
