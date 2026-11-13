# So I Became the Dark Lord's Problem

An original, offline-capable fantasy RPG about becoming a serious inconvenience to the Dark Lord. Explore five regions, rescue specialists, build a companion expedition, and make your way through ten settlements and five main dungeons.

**[Play in your browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/)** · **[Play on your phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)** · **[Guía completa del juego en español](GUIA_EN_ESPANOL.md)**

The playable Community Snapshot still receives updates, with **Paladin, Mage, Ranger and Rogue/Pícara** as its four playable classes. **v0.9.2 is the next planned functional-completion milestone, not a released version.** For the verified published build, current work and remaining acceptance limits, see [Development state](docs/DEVELOPMENT_STATE.md). A published update does not necessarily mean an installed browser/PWA has loaded it.

**Icon-led menu update — [PR #800](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/800), merged and published:** Menus use the crown icon’s violet/gold palette and larger landscape text. Start with **New Game → New Adventure** (Normal/Standard defaults, optional Succession), then **Choose Hero**. Saved Games, Help and advanced diagnostics are grouped by purpose. Physical iPhone Air acceptance remains open. See the [design contract](docs/MENU_STAGE4_ICON_LED_GAME_DESIGN_20261104.md) and [verified release status](docs/DEVELOPMENT_STATE.md).

**Jump to:** [Play](#play) · [The game](#the-game) · [Controls](#controls) · [Saves and updates](#saves-updates-and-diagnostics) · [Graphics and audio](#graphics-and-audio) · [Development](#development) · [Documentation](#project-documentation)

## Play

Use the **[browser / Chromebook game](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/)** for keyboard and mouse, or the **[phone/PWA version](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)** for touch controls. Both run the same campaign with different screen layouts. The phone version can be installed through its browser when supported; it is not a native Android or iOS app.

On the title screen:

1. Choose **New Game**, review **New Adventure**, then **Choose Hero** and select **Paladin, Mage, Ranger, or Rogue**. Normal and Nightmare have separate saves; Nightmare unlocks after the peaceful ending.
2. Use **Continue Adventure** to resume an eligible saved game. **Saved Games & Backups** provides recovery and file import/export.
3. During play, open **Adventure → Quest journal** for the story, **Map and travel routes** for destinations, and **Hero skills** for your class's actions and training information.

After the automatic startup update check, first-time visitors choose **English** or **Español** on a dedicated welcome screen. The choice is a browser preference separate from campaign saves and can later be changed in **Settings**; returning players skip the welcome screen. The title screen has **Settings**, **Saved Games & Backups**, and **Help & Credits**. Help now includes how to play, performance diagnostics, update and backup guidance, current installed-version information, development goals, and creator contact. English and **partial** Spanish localization are available; some names and text remain in English.

## The game

Recruit and recover companions, rescue instructors and craftspeople, establish a Barracks, and travel through occupied regions toward the Dark Lord. Town Captains and completed Barracks offer **Treat wounds** for 30 crowns to restore the hero and living companions when safe; refuges offer free healing on a 90-second cooldown. Fallen companions require separate 40-crown recovery. A completed Basic Barracks can queue up to three individually selected fallen companions, while a completed Full Barracks has no Barracks-specific recovery queue limit. Queued recoveries preserve their targets and order across saves and resolve automatically when affordable and safe; town Captains retain one recovery request. Rogues can also choose in a completed Barracks whether future fallen Charmed allies free active group slots (default) or keep those slots until recovery/rest; both choices retain ownership and the same 40-crown recovery. Crowns are the in-world currency. The quest journal tracks major story objectives; local work comes from settlement boards.

At a **completed Barracks → Company**, select **Manage active group** or **Charmed monsters** and **Inspect** an individual to review their HP, personal Mastery, status and **Abilities & mastery**, without accidentally resting or activating them. The **Boss pet collection** also shows owned pets' abilities. Cumulative Mastery tiers unlock at **4 / 10 / 18** points earned from genuine achievements. After rescuing **Orin** in Ironroot Highlands, his service—also available through **Barracks → Rescued specialists**—lets you choose a *particular* Charmed creature for a one-time **100-crown** Ringleader upgrade; review the before/after stats before confirming payment. See [Development state](docs/DEVELOPMENT_STATE.md) for verified publication and device-test status.

Combat is **cooldown-based**, not mana-based. Skills have a normal tap action and, where applicable, a stronger charged action. Automatic basic attacks continue separately. **Rogue** uses her own musical combat actions and can Charm eligible foes into companions; she is playable, but her extended phone, audio, boss and performance acceptance remains unfinished. For exact effects and cooldowns, use **Adventure → Hero skills** in the running game rather than an old balance table.

The game includes an original contextual soundtrack, authored regional spaces, boss encounters, procedural character art and optional illustrated assets. It is a single-player experience; **there is no playable co-op or cloud save synchronization**.

Greenwood has a working mill and pond, cultivated orchards, a separate decorative fruit cellar and woodland routes. **Scornfang's Treasury** is distinct from the occupied **Old Orchard Cellars**.

## Controls

These are **default** desktop bindings. Movement, interaction, menu/back, combat, and utility keys can all be changed under **Settings → Controls → Customize keyboard → Movement and menu keys** (or the other key groups). Escape remains a safety fallback for opening and leaving menus; Enter remains available for confirmation. On phone, use the on-screen buttons and joystick or tap a reachable destination.

On desktop, a prompt shows the current **Interact** key and the nearby NPC, object, or resource it will act on. It follows your binding if you change it.

| Action | Desktop / Chromebook | Phone |
| --- | --- | --- |
| Move | W / A / S / D | Left joystick or tap-to-move |
| Interact / confirm | F | Interact / tap |
| Skills 1–5 | J / K / L / U / I | Skill buttons |
| Skills 6–8 | Space / O / N | Skill buttons |
| Charged skill | Hold the skill for about 0.65 seconds | Hold its button |
| Change target | E | Target button |
| Recall companions | Backtick key (or Q with default bindings) | Recall button |
| Squad doctrine | Tab (when available) | Contextual Squad button |
| Companion Heal (Ranger, Charmed ranged healer, eligible pet) | H | Heal button |
| Map / talents / skill reference | Z / C / X | Adventure menu |
| Pause / help / back | P (or V) / G / Esc | Menu |

Tap **Target** to cycle eligible enemies; hold it for roughly **0.55 seconds** to lock the current target for the encounter. **Recall** is a five-second defensive regroup: the button shows ON and remaining seconds; press it again to cancel. Both automatic and manually activated hero attacks leave Recall alone. The five seconds count active game time, so pausing does not consume them. Companion labor cannot be newly assigned during the brief Recall hold. Menu selection follows the movement keys; F, Enter or Space confirms. Skills can be queued while cooling down. The Classic number-key preset and a mirrored left-hand preset are available in Controls.

On a phone, tap-to-move is enabled by default; mouse click-to-move is optional and disabled by default. Manual input, opening a menu or pausing interrupts automatic travel. Controls can be customized under **Settings → Controls**; basic play instructions and report/profiling explanations live in **Help & Credits**. The **[Guía del juego (Español)](GUIA_EN_ESPANOL.md)** gives additional guidance.

## Saves, updates and diagnostics

**Your campaigns are stored locally in the browser/device.** Before clearing browser data, reinstalling or moving devices, export a backup. Normal and Nightmare saves are independent, and the game maintains compatibility with its v4 save format.

- **Save or restore:** From the main title screen, open **Saved Games & Backups** to select Normal/Nightmare, recover a checkpoint, export a save, import a save or request supported storage protection. Each entry explains its action. The [save-protection improvements from issue #773](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/773) provide validated manual exports that include mode/class/level/date, imports require a review and separate confirmation, the backup menus can gently suggest another external copy, and supported browsers offer an explicit persistent-storage request. See [development state](docs/DEVELOPMENT_STATE.md) and [PR #775](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/775) for the verified merge/publication status and check which version is installed. A started download is not proof of a retained file. Store the exported `.json` outside browser site data; neither the one local checkpoint nor persistence permission protects against clearing site data or losing the device.
- **Updates:** The game automatically checks for updates at startup and offers an installation action when an update becomes available during play. There is no separate manual Check button in Settings. An existing installed PWA can still temporarily show its earlier cached build.
- **See the version actually running:** **Help & Credits → Version and development**, or **Settings → Screen and performance → Export playtest report** for a JSON with the same build version and diagnostics. **It is not a save backup**, and the game does not automatically send telemetry.

**Distribution boundary:** This automatic/incremental update mechanism is for the current link-based browser game and optional PWA. A future packaged mobile or desktop app will require a fresh platform-specific update and save-compatibility review; it must not simply inherit the browser service-worker design. See the [recorded owner decision](docs/DECISIONS.md#31-october-2026--web-updater-is-transitional-native-application-delivery-requires-a-new-decision). No native updater or breaking-version policy enforcement is implemented by that decision.

For the distinction between implemented, tested, merged, published and *device-verified*, consult [Development state](docs/DEVELOPMENT_STATE.md).

## Graphics and audio

**World renderer:** [PixiJS/WebGL2 is the published preferred default](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/574); **Canvas 2D** remains a selectable and automatic safety fallback for unsupported, failed or recovery-held WebGL sessions. The active renderer can differ from the preferred setting. Manual Canvas-to-Pixi switching retains the **15-second Keep/Revert** trial; recovery reasons and a guarded retry path were released through [#842](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/842). A later [Highlands procedural-art Pixi exception #841](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/841) remains a real maintenance issue, so published fallback diagnostics are not proof that every region renders in Pixi without failure.

**Screen and performance:** The published controls use **one scrollable page**, following the [owner-approved #857 revision](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/857) and [#858 decluttering](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/858), rather than the earlier experimental/multi-submenu drafts. Renderer, resolution/Optimization Mode, draw-target, and fallback states are reported according to the active runtime. Playtest exports can document build and runtime state, but issued-draw counters do **not** certify monitor-presented FPS or full-campaign performance. Check [Development state](docs/DEVELOPMENT_STATE.md) and **Help & Credits → Version and development** for the real published versus loaded version; installed PWAs may remain cached until their update is applied.

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

Normal pull requests use [focused checks](.github/workflows/focused-deploy.yml); the [comprehensive browser/game workflow](.github/workflows/pages.yml) is **manual and requires explicit owner approval**. A successful push to `main` can trigger GitHub Pages publication. Work on a feature branch, preserve existing saves and assets, and do not merge or deploy without current authorization. Use the [engineering change workflow](docs/MECHANIC_DEVELOPMENT.md) for approved gameplay, audio, UI and other changes: source ownership, focused tests, lifecycle checks, documentation, recoverable handoffs and explicit release authorization.

## Project documentation

| Need | Start here |
| --- | --- |
| Current release, workstreams and acceptance evidence | [Development state](docs/DEVELOPMENT_STATE.md) |
| Source modules and system ownership | [Architecture](docs/ARCHITECTURE.md) |
| Design decisions and approved behavior | [Gameplay decisions](docs/DECISIONS.md) |
| Development rules and release authorization | [Agent operating policy](AGENTS.md) |
| Divide work across ChatGPT Project chats and Work sessions | [Engineering workflow — cross-chat workstreams](docs/MECHANIC_DEVELOPMENT.md#cross-chat-workstreams-in-a-chatgpt-project) |
| Find the right guide or historical record, with a one-line explanation of each | [Annotated documentation directory](docs/DOCUMENTATION_INDEX.md) |
| Official game identity and legacy-name rules | [Brand identity](docs/BRAND_IDENTITY.md) |
| Spanish player guide | [Guía del juego (Español)](GUIA_EN_ESPANOL.md) |

**About the repository name:** `azeroth-chronicles-prototype` is a historical technical identifier, **not** the game's current name or setting. The official title is **So I Became the Dark Lord's Problem**, an independent fantasy RPG. The [annotated documentation directory](docs/DOCUMENTATION_INDEX.md) describes every tracked Markdown document by subject, points to dated audits and superseded plans without reviving them, and links to the original historical inventory for exact source receipts.

**Known limits:** Some art and localized text are unfinished; Pixi/device performance and complete human playthrough acceptance are not certified. For the current, evidence-backed limits, use [Development state](docs/DEVELOPMENT_STATE.md), not an old release snapshot.
