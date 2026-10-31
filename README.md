# So I Became the Dark Lord's Problem

An original, offline-capable fantasy RPG about becoming a serious inconvenience to the Dark Lord. Explore five regions, rescue specialists, build a companion expedition, and make your way through ten settlements and five main dungeons.

**[Play in your browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/)** · **[Play on your phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)** · **[Guía completa del juego en español](GUIA_EN_ESPANOL.md)**

The playable Community Snapshot is still receiving updates. **For the current code/build version and verified Pages publication, see [Development state](docs/DEVELOPMENT_STATE.md).** Rogue/Pícara is the fourth playable class. For the latest *verified* publication, open issues, and device-testing limits, see [Development state](docs/DEVELOPMENT_STATE.md). A published update does not automatically mean an installed browser/PWA has loaded it.

**Jump to:** [Play](#play) · [The game](#the-game) · [Controls](#controls) · [Saves and updates](#saves-updates-and-diagnostics) · [Graphics and audio](#graphics-and-audio) · [Development](#development) · [Documentation](#project-documentation)

## Play

Use the **[browser / Chromebook game](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/)** for keyboard and mouse, or the **[phone/PWA version](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html)** for touch controls. Both run the same campaign with different screen layouts. The phone version can be installed through its browser when supported; it is not a native Android or iOS app.

On the title screen:

1. Choose **New Game** and select **Paladin, Mage, Ranger, or Rogue**. Normal and Nightmare have separate saves; Nightmare unlocks after the peaceful ending.
2. Use **Continue Adventure** to resume an eligible saved game. **Saved Games & Backups** provides recovery and file import/export.
3. During play, open **Adventure → Quest journal** for the story, **Map and travel routes** for destinations, and **Hero skills** for your class's actions and training information.

The title screen also contains **Settings** and **Help & Credits**. English and **partial** Spanish localization are available; some names and text remain in English.

## The game

Recruit and recover companions, rescue instructors and craftspeople, establish a Barracks, and travel through occupied regions toward the Dark Lord. Town Captains and completed Barracks offer **Treat wounds** for 30 crowns to restore the hero and living companions when safe; refuges offer free healing on a 90-second cooldown. Fallen companions require separate 40-crown recovery. A completed Basic Barracks can queue up to three individually selected fallen companions, while a completed Full Barracks has no Barracks-specific recovery queue limit. Queued recoveries preserve their targets and order across saves and resolve automatically when affordable and safe; town Captains retain one recovery request. Rogues can also choose in a completed Barracks whether future fallen Charmed allies free active group slots (default) or keep those slots until recovery/rest; both choices retain ownership and the same 40-crown recovery. Crowns are the in-world currency. The quest journal tracks major story objectives; local work comes from settlement boards.

At a **completed Barracks → Company**, select **Manage active group** or **Charmed monsters** and **Inspect** an individual to review their HP, personal Mastery, status and **Abilities & mastery**, without accidentally resting or activating them. The **Boss pet collection** also shows owned pets' abilities. Cumulative Mastery tiers unlock at **4 / 10 / 18** points earned from genuine achievements. After rescuing **Orin** in Ironroot Highlands, his service—also available through **Barracks → Rescued specialists**—lets you choose a *particular* Charmed creature for a one-time **100-crown** Ringleader upgrade; review the before/after stats before confirming payment. See [Development state](docs/DEVELOPMENT_STATE.md) for verified publication and device-test status.

Combat is **cooldown-based**, not mana-based. Skills have a normal tap action and, where applicable, a stronger charged action. Automatic basic attacks continue separately. **Rogue** uses her own musical combat actions and can Charm eligible foes into companions; she is playable, but her extended phone, audio, boss and performance acceptance remains unfinished. For exact effects and cooldowns, use **Adventure → Hero skills** in the running game rather than an old balance table.

The game includes an original contextual soundtrack, authored regional spaces, boss encounters, procedural character art and optional illustrated assets. It is a single-player experience; **there is no playable co-op or cloud save synchronization**.

Greenwood has a working mill and pond, cultivated orchards, a separate decorative fruit cellar and woodland routes. **Scornfang's Treasury** is distinct from the occupied **Old Orchard Cellars**.

## Controls

These are **default** desktop bindings. Keyboard presets and individual keys can be changed under **Game and settings → Controls → Customize keyboard**; existing saved preferences are preserved. On phone, use the on-screen buttons and joystick or tap a reachable destination.

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

Tap **Target** to cycle eligible enemies; hold it for roughly **0.55 seconds** to lock the current target for the encounter. Menu selection follows the movement keys; F, Enter or Space confirms. Skills can be queued while cooling down. The Classic number-key preset and a mirrored left-hand preset are available in Controls.

On a phone, tap-to-move is enabled by default; mouse click-to-move is optional and disabled by default. Manual input, opening a menu or pausing interrupts automatic travel. The controls and settings are described in more detail in **[Guía del juego (Español)](GUIA_EN_ESPANOL.md)** and the in-game Help / Controls menus.

## Saves, updates and diagnostics

**Your campaigns are stored locally in the browser/device.** Before clearing browser data, reinstalling or moving devices, export a backup. Normal and Nightmare saves are independent, and the game maintains compatibility with its v4 save format.

- **Save or restore:** **Game and settings → Save and game management → Save backups → Export save / Import save**. The title screen also has **Saved Games & Backups**.
- **Check for updates:** **Game and settings → Check for game update**, then **Install available game update** when offered. A new deployment can still leave an existing browser or installed PWA using an older cached build.
- **See the version actually running:** **Game and settings → Screen and performance → Export playtest report**. This downloads local JSON diagnostics, including the `version` field. **It is not a save backup**, and the game does not automatically send telemetry.

**Distribution boundary:** This automatic/incremental update mechanism is for the current link-based browser game and optional PWA. A future packaged mobile or desktop app will require a fresh platform-specific update and save-compatibility review; it must not simply inherit the browser service-worker design. See the [recorded owner decision](docs/DECISIONS.md#31-october-2026--web-updater-is-transitional-native-application-delivery-requires-a-new-decision). No native updater or breaking-version policy enforcement is implemented by that decision.

For the distinction between implemented, tested, merged, published and *device-verified*, consult [Development state](docs/DEVELOPMENT_STATE.md).

## Graphics and audio

**Graphics policy for the PixiJS-primary release (PR #574):** **PixiJS WebGL2 · Default** is the preferred world renderer; **Canvas 2D · Backup** is a full selectable alternative and the automatic fallback after an unsupported, failed or quarantined GPU start. The upgrade changes older Canvas preferences **once**; choosing Canvas afterward remains persistent across reloads. Pixi preparation occurs when entering **New Game / Continue Adventure**, with **Continue with Canvas** if preparation is slow. The **15-second Keep/Revert trial** still applies when a player manually switches from Canvas to WebGL2, not to automatic default startup. The candidate settings no longer describe PixiJS as “Experimental”—this is a **product role**, not proof of hardware certification or superior FPS.

**Availability:** This is the PixiJS-default source for PR #574. Publication requires a successful merged-`main` GitHub Pages workflow; an installed PWA may retain its previous renderer/version until it updates. Check [Development state](docs/DEVELOPMENT_STATE.md) and the version exported under **Screen and performance** before assuming your device has the rollout. Performance-report counters are diagnostic measurements, **not proof of visible frames per second on a Chromebook or phone**. Rendering resolution, optimization and frame-skip controls remain available.

The **published soundtrack now includes 65 newly authored songs** (regional/area, interior, combat/boss/TRUE, title, defeat and Finale arrangements), retaining all 18 original Dark Crown music recordings. The title theme starts after the browser's first permitted interaction; returning to the Main Menu plays it again. Opening Adventure or Settings during gameplay pauses the simulation **without stopping the current location music**. Continue/New Game prepares the right location score without waiting for a movement or skill action when audio is available; browsers cannot play unmuted audio before an initial gesture. The soundtrack changes with travel, settlements, night and combat. The separate [soundtrack listening room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) lets you preview game scenes and explore the complete registered catalog (83 music cues, 18 environmental beds and 30 sound effects) without starting or changing a campaign. The library includes the 65 new recordings and protected Crown references, with the whole 131-recording catalog browser/offline-tested in [dev.248](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242212837). It also offers production briefs; optional mixing and diagnostics are under Advanced listening tools. The [current sound design and audio production guide](docs/AUDIO_PLAYBACK.md) covers the live catalog, mix and creative workflow; the [soundtrack and sound-identity guide](docs/AUDIO_SOUND_PASS.md) preserves the creative intentions behind all current cue families, with the original v0.8.90 version retained in Git history.

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
| Find the right guide or historical record, with a one-line explanation of each | [Annotated documentation directory](docs/DOCUMENTATION_INDEX.md) |
| Official game identity and legacy-name rules | [Brand identity](docs/BRAND_IDENTITY.md) |
| Spanish player guide | [Guía del juego (Español)](GUIA_EN_ESPANOL.md) |

**About the repository name:** `azeroth-chronicles-prototype` is a historical technical identifier, **not** the game's current name or setting. The official title is **So I Became the Dark Lord's Problem**, an independent fantasy RPG. The [annotated documentation directory](docs/DOCUMENTATION_INDEX.md) describes every tracked Markdown document by subject, points to dated audits and superseded plans without reviving them, and links to the original historical inventory for exact source receipts.

**Known limits:** Some art and localized text are unfinished; Pixi/device performance and complete human playthrough acceptance are not certified. For the current, evidence-backed limits, use [Development state](docs/DEVELOPMENT_STATE.md), not an old release snapshot.
