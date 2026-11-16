# So I Became the Dark Lord's Problem

> **Repository variant notice:** This `mod/gta-cuba-edition` code is an **experimental player-feedback control edition**, not the standard public game. The original game's design, default controls and official links belong to `main`. This variant has its own [developer handoff and one-way update policy](docs/GTA_CUBA_EDITION_HANDOFF.md). The edition has not undergone gameplay, regression or real-device tests. The general sections below describe the shared campaign baseline unless a variant-specific section explicitly overrides them.

An original, offline-capable fantasy RPG about becoming a serious inconvenience to the Dark Lord. Explore five regions, rescue specialists, build a companion expedition, and make your way through ten settlements and five main dungeons.

**[Play in your browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/)** · **[Play on your phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)** · **[Guía completa del juego en español](GUIA_EN_ESPANOL.md)**

The playable Community Snapshot is still receiving updates. **For the current code/build version and verified Pages publication, see [Development state](docs/DEVELOPMENT_STATE.md).** Rogue/Pícara is the fourth playable class. For the latest *verified* publication, open issues, and device-testing limits, see [Development state](docs/DEVELOPMENT_STATE.md). A published update does not automatically mean an installed browser/PWA has loaded it.

**Icon-led menu update — [PR #800](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/800), merged and published:** Menus use the crown icon’s violet/gold palette and larger landscape text. Start with **New Game → New Adventure** (Normal/Standard defaults, optional Succession), then **Choose Hero**. Saved Games, Help and advanced diagnostics are grouped by purpose. Physical iPhone Air acceptance remains open. See the [design contract](docs/MENU_STAGE4_ICON_LED_GAME_DESIGN_20261104.md) and [verified release status](docs/DEVELOPMENT_STATE.md).

**Jump to:** [Play](#play) · [The game](#the-game) · [Controls](#controls) · [Saves and updates](#saves-updates-and-diagnostics) · [Graphics and audio](#graphics-and-audio) · [Development](#development) · [Documentation](#project-documentation)

## Play

The two links above open the **standard public game**, not this experimental edition. The GTA Cuba Edition currently has a separate [desktop link](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/webgl-pilot/play/?experience=desktop) and [phone link](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/webgl-pilot/play/phone.html?experience=phone). Both edition pages share the same underlying campaign and special-control rules, with different input layouts. This is still a browser/PWA game, not a native app. Its controller and save isolation are explained in the [handoff](docs/GTA_CUBA_EDITION_HANDOFF.md).

On the title screen:

1. Choose **New Game**, review **New Adventure**, then **Choose Hero** and select **Paladin, Mage, Ranger, or Rogue**. Normal and Nightmare have separate saves; Nightmare unlocks after the peaceful ending.
2. Use **Continue Adventure** to resume an eligible saved game. **Saved Games & Backups** provides recovery and file import/export.
3. During play, open **Adventure → Quest journal** for the story, **Map and travel routes** for destinations, and **Hero skills** for your class's actions and training information.

After the automatic startup update check, first-time visitors choose **English** or **Español** on a dedicated welcome screen. The choice is a browser preference separate from campaign saves and can later be changed in **Settings**; returning players skip the welcome screen. The title screen has **Settings**, **Saved Games & Backups**, and **Help & Credits**. Help now includes how to play, performance diagnostics, update and backup guidance, current installed-version information, development goals, and creator contact. English and **partial** Spanish localization are available; some names and text remain in English.

## The game

Recruit and recover companions, rescue instructors and craftspeople, establish a Barracks, and travel through occupied regions toward the Dark Lord. Town Captains and completed Barracks offer **Treat wounds** for 30 crowns to restore the hero and living companions when safe; refuges offer free healing on a 90-second cooldown. Fallen companions require separate 40-crown recovery. A completed Basic Barracks can queue up to three individually selected fallen companions, while a completed Full Barracks has no Barracks-specific recovery queue limit. Queued recoveries preserve their targets and order across saves and resolve automatically when affordable and safe; town Captains retain one recovery request. Rogues can also choose in a completed Barracks whether future fallen Charmed allies free active group slots (default) or keep those slots until recovery/rest; both choices retain ownership and the same 40-crown recovery. Crowns are the in-world currency. The quest journal tracks major story objectives; local work comes from settlement boards.

At a **completed Barracks → Company**, select **Manage active group** or **Charmed monsters** and **Inspect** an individual to review their HP, personal Mastery, status and **Abilities & mastery**, without accidentally resting or activating them. The **Boss pet collection** also shows owned pets' abilities. Cumulative Mastery tiers unlock at **4 / 10 / 18** points earned from genuine achievements. After rescuing **Orin** in Ironroot Highlands, his service—also available through **Barracks → Rescued specialists**—lets you choose a *particular* Charmed creature for a one-time **100-crown** Ringleader upgrade; review the before/after stats before confirming payment. See [Development state](docs/DEVELOPMENT_STATE.md) for verified publication and device-test status.

Combat is **cooldown-based**, not mana-based. Skills 1–4 have normal and charged actions. Learned Skills 5–8 follow their corresponding skill (1→5, 2→6, 3→7, 4→8) in the same form, using their own ranks when the primary action succeeds and their conditions allow it. They are not four extra buttons or separate cooldown activations. Automatic basic attacks are distinct and require actual hero movement in this edition. **Rogue** uses her own musical combat actions and can Charm eligible foes into companions; she is playable, but her extended phone, audio, boss and performance acceptance remains unfinished. For exact effects and cooldowns, use **Adventure → Hero skills** in the running game rather than an old balance table.

The game includes an original contextual soundtrack, authored regional spaces, boss encounters, procedural character art and optional illustrated assets. It is a single-player experience; **there is no playable co-op or cloud save synchronization**.

Greenwood has a working mill and pond, cultivated orchards, a separate decorative fruit cellar and woodland routes. **Scornfang's Treasury** is distinct from the occupied **Old Orchard Cellars**.

## Controls — experimental GTA Cuba Edition

**These edition-only controls are deliberate player-feedback accommodations, not proposals for the public game.** The original game on `main` retains its independent default controls, configurable presets, regular skill actions and normal mouse/touch interaction. For the source-of-truth customization and future update/approval rules, read [GTA Cuba Edition handoff](docs/GTA_CUBA_EDITION_HANDOFF.md).

| Action | Edition desktop | Edition phone |
| --- | --- | --- |
| Move / choose menu item | WASD | Fixed left joystick |
| Confirm / interact | F **or Enter** (same field interaction) | Dedicated Confirm beside joystick |
| Menu / back | Esc | On-screen Back row |
| Skills 1–4 | Number keys 1–4 | Four buttons arranged in an arc around the left joystick |
| Learned skills 5–8 | Triggered alongside their learned 1–4 partners under edition rules | Same paired behavior |
| Target / recall / squad | E / Q / Tab | Buttons on right |
| Companion Heal | R; desktop left-click on the game world | Heal farther right of the joystick arc |
| Map / talents / skill reference | Z / C / X | Menus navigated by joystick |
| Pause / help | V / G | Menu |

Mouse and direct touchscreen **menu selection** are blocked in this edition; on the phone, use the joystick to highlight an option and Confirm to choose it, including on the title and New Game screens. Native name entry and file pickers remain available, and real field controls (skill buttons, Heal, targeting and joystick) still respond to touch. Click-to-move and tap-to-move are disabled. On desktop, left-clicking the world instead requests Heal from an **eligible** companion; it is not a general click-to-interact command.

Skills **5–8 are still learned and trained individually** through the original instructors: Orin teaches 5–6, Lyss 7 and Tovan 8. They do not appear as four extra action buttons. Once learned, Skill 5 follows 1, 6 follows 2, 7 follows 3, and 8 follows 4 in the matching normal or charged form, **only after the primary succeeds and when the secondary's own conditions allow it**. Each follow-up uses its own rank but starts no extra cooldown or resource cost. Automatic basics never trigger these follow-ups; they require actual hero movement. The skill journal, trainer preview and first-time Rank 1 learning message in the draft update explain these mechanics in English and Spanish. See the handoff for detailed edge cases and source ownership.

**Distribution:** The official links at the top of this README are for the standard game, **not this variant**. The experimental edition is served separately at [desktop](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/webgl-pilot/play/?experience=desktop) and [phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/webgl-pilot/play/phone.html?experience=phone). Do not replace the standard links or silently merge the variant branch into `main`.

## Saves, updates and diagnostics

**Your campaigns are stored locally in the browser/device.** Before clearing browser data, reinstalling or moving devices, export a backup. Normal and Nightmare saves are independent, and the game maintains compatibility with its v4 save format.

- **Save or restore:** From the main title screen, open **Saved Games & Backups** to select Normal/Nightmare, recover a checkpoint, export a save, import a save or request supported storage protection. Each entry explains its action. The [save-protection improvements from issue #773](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/773) provide validated manual exports that include mode/class/level/date, imports require a review and separate confirmation, the backup menus can gently suggest another external copy, and supported browsers offer an explicit persistent-storage request. See [development state](docs/DEVELOPMENT_STATE.md) and [PR #775](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/775) for the verified merge/publication status and check which version is installed. A started download is not proof of a retained file. Store the exported `.json` outside browser site data; neither the one local checkpoint nor persistence permission protects against clearing site data or losing the device.
- **Updates:** The game automatically checks for updates at startup and offers an installation action when an update becomes available during play. There is no separate manual Check button in Settings. An existing installed PWA can still temporarily show its earlier cached build.
- **See the version actually running:** **Help & Credits → Version and development**, or **Settings → Screen and performance → Export playtest report** for a JSON with the same build version and diagnostics. **It is not a save backup**, and the game does not automatically send telemetry.

**Distribution boundary:** This automatic/incremental update mechanism is for the current link-based browser game and optional PWA. A future packaged mobile or desktop app will require a fresh platform-specific update and save-compatibility review; it must not simply inherit the browser service-worker design. See the [recorded owner decision](docs/DECISIONS.md#31-october-2026--web-updater-is-transitional-native-application-delivery-requires-a-new-decision). No native updater or breaking-version policy enforcement is implemented by that decision.

For the distinction between implemented, tested, merged, published and *device-verified*, consult [Development state](docs/DEVELOPMENT_STATE.md).

## Graphics and audio

**Graphics policy for the PixiJS-primary release (PR #574):** **PixiJS WebGL2 · Default** is the preferred world renderer; **Canvas 2D · Backup** is a full selectable alternative and the automatic fallback after an unsupported, failed or quarantined GPU start. The upgrade changes older Canvas preferences **once**; choosing Canvas afterward remains persistent across reloads. Pixi preparation occurs when entering **New Game / Continue Adventure**, with **Continue with Canvas** if preparation is slow. The **15-second Keep/Revert trial** still applies when a player manually switches from Canvas to WebGL2, not to automatic default startup. The candidate settings no longer describe PixiJS as “Experimental”—this is a **product role**, not proof of hardware certification or superior FPS.

**Automatic startup history (#842 candidate; not released):** The same playtest report automatically includes the latest three starts/returns to the game, including preparation, renderer choice, scene reveal and any interruption. No diagnostic button, movement, or second export is required. This small history is separate from campaign saves.

**Startup safety feedback (Issue #841 candidate; not yet released):** If a previous WebGL2 startup was interrupted or repeated failures paused recovery, Canvas stays playable and the game explains the hold in English/Spanish. **Retry PixiJS WebGL2** deliberately starts the existing 15-second Keep/Revert trial; **Use Canvas 2D** saves the backup choice. Reloading never silently clears a hold. Reports retain the startup decision, hold code and bounded first/latest recorded renderer errors. Older holds without error evidence remain explicitly unknown.

**Availability:** The underlying PixiJS-default source derives from the official release, but this edition is published by the branch-specific `fixed-controls-pages.yml` workflow, not a merge to `main`. That workflow stages the edition under `tools/webgl-pilot/play/` alongside a rebuilt package of the verified official release. A player may still load an older installed PWA until its cached update is applied. Check [Development state](docs/DEVELOPMENT_STATE.md) and the version exported under **Screen and performance** before assuming your device has the rollout. Performance-report counters are diagnostic measurements, **not proof of visible frames per second on a Chromebook or phone**. Rendering resolution, optimization and frame-skip controls remain available.

The **published soundtrack now includes 65 newly authored songs** (regional/area, interior, combat/boss/TRUE, title, defeat and Finale arrangements), retaining all 18 original Dark Crown music recordings. The title music is designed to start after the browser's first permitted interaction and return when the Main Menu reappears. The owner reported silence in both situations; the [focused sound patch #751](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/751) addresses the audio lifecycle, pending device verification. Opening Adventure or Settings during gameplay pauses the simulation **without stopping the current location music**. Continue/New Game prepares the right location score without waiting for a movement or skill action when audio is available; browsers cannot play unmuted audio before an initial gesture. The soundtrack changes with travel, settlements, night and combat. The separate [soundtrack listening room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) lets you preview game scenes and explore the current registered catalog (83 music cues, 34 environmental beds and 30 sound effects) without starting or changing a campaign. The library includes the 65 new recordings and protected Crown references. The 131-recording soundtrack rollout was browser/offline-tested in [dev.248](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242212837); the subsequent [environmental expansion #744](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/744) added 16 recordings, bringing the dev.250 catalog to **147**. It also offers production briefs; optional mixing and diagnostics are under Advanced listening tools. The [current sound design and audio production guide](docs/AUDIO_PLAYBACK.md) covers the live catalog, mix and creative workflow; the [soundtrack and sound-identity guide](docs/AUDIO_SOUND_PASS.md) preserves the creative intentions behind all current cue families, with the original v0.8.90 version retained in Git history.

## Development

This is the **multi-file JavaScript / Canvas / Web Audio / PWA** game, not a single-file prototype or a backend service. Use **Node.js 22** to match CI (minimum supported version: 20.9).

```sh
npm ci --ignore-scripts
npm run dev
```

Open **http://127.0.0.1:8080/** for desktop or **http://127.0.0.1:8080/phone.html** for phone presentation. No third-party packages are required at runtime; npm installs development tools.

For a scoped change, run the **affected focused tests** and relevant build check rather than defaulting to a full browser matrix. For example:

```sh
node scripts/build.cjs --check --site
```

Official-game pull requests use [focused checks](.github/workflows/focused-deploy.yml), and its comprehensive workflow requires explicit owner approval. **For the experimental edition, the owner waived testing and manual/device playthroughs at its initial release.** Do not treat that waiver as applying to `main`. A push to `mod/gta-cuba-edition` triggers the edition's **own GitHub Pages publishing workflow** and must not occur without its applicable release authorization. The current update is being prepared on a separate PR branch; neither edition is published by editing this README. Work on a feature branch, preserve existing saves and assets, and do not merge or deploy without current authorization. Use the [engineering change workflow](docs/MECHANIC_DEVELOPMENT.md) for approved gameplay, audio, UI and other changes: source ownership, focused tests, lifecycle checks, documentation, recoverable handoffs and explicit release authorization.

## Project documentation

| Need | Start here |
| --- | --- |
| Current release, workstreams and acceptance evidence | [Development state](docs/DEVELOPMENT_STATE.md) |
| Source modules and system ownership | [Architecture](docs/ARCHITECTURE.md) |
| Design decisions and approved behavior | [Gameplay decisions](docs/DECISIONS.md) |
| Development rules and release authorization | [Agent operating policy](AGENTS.md) |
| Find the right guide or historical record, with a one-line explanation of each | [Annotated documentation directory](docs/DOCUMENTATION_INDEX.md) |
| Official game identity and legacy-name rules | [Brand identity](docs/BRAND_IDENTITY.md) |
| Spanish player guide | [Guía del juego (Español)](GUIA_EN_ESPANOL.md) |

**About the repository name:** `azeroth-chronicles-prototype` is a historical technical identifier, **not** the game's current name or setting. The official title is **So I Became the Dark Lord's Problem**, an independent fantasy RPG. The [annotated documentation directory](docs/DOCUMENTATION_INDEX.md) describes every tracked Markdown document by subject, points to dated audits and superseded plans without reviving them, and links to the original historical inventory for exact source receipts.

**Known limits:** Some art and localized text are unfinished; Pixi/device performance and complete human playthrough acceptance are not certified. For the current, evidence-backed limits, use [Development state](docs/DEVELOPMENT_STATE.md), not an old release snapshot.
