# Azeroth Chronicles

An offline-capable RPG across five regions, ten settlements and five main dungeons. Rescue the specialists, build your expedition, and challenge the Dark Lord. The regime's currency is **crowns**.

The canonical Azeroth Chronicles product is the multi-file GitHub Pages/PWA application. It uses JavaScript, Canvas 2D and Web Audio; there is no game backend. The campaign engine is shared, while desktop and phone have separate presentation rules. Map reviews and sprite production can continue on this foundation.

## Release status

The project is stabilizing toward v0.9. The source baseline, independently verified published release, active candidates and known limitations are maintained in [Current development state](docs/DEVELOPMENT_STATE.md). The version in an exported playtest report identifies the build actually running on your device. A merged PR is not proof of publication or completed human playtesting.

## Play

- [Chromebook / browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/): keyboard layout, compact skill bar, unobstructed play-space camera, no joystick or touch confirmation buttons.
- [Phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html): compact top HUD, dedicated touch layout, portrait/landscape controls and safe-area spacing. **Game and settings → Install on phone** opens installation instructions or the browser's install prompt. This remains a web app, not a native Android/iOS package.

Automatic selection uses pointer capabilities, including a mouse/trackpad on a touchscreen Chromebook. Resizing a desktop window does not turn it into a phone screen. **Game and settings → Screen and performance** changes the screen preference and shows local performance measurements. Both entries use the same on-device saves. Camera framing defaults to the selected 150%; that menu also offers original 100% and 175%, remembered separately for desktop and phone. Supported phone viewports start at 375 × 800 CSS pixels (or landscape rotation); smaller layouts are no longer release targets.

Choose a Standard run or the optional Succession challenge, then Paladin, Mage or Ranger. Normal and Nightmare have independent saves. Nightmare unlocks after the peaceful ending. Updates preserve local campaigns and adopt the tested published build automatically; a manual update check is also available in settings.

## Contextual soundtrack

An original warm-fantasy score now follows the hero through all five regions, main dungeons, treasuries and side interiors. Night, settlement and peaceful arrangements change the mood; combat adds a synchronized rhythm layer, and each of the eleven bosses has its own theme and TRUE-form layer. Menus have soft musical backing and distinct selection/confirmation sounds. Footsteps follow actual movement and surface type, with sparse local ambience.

[Open the audio audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) to compare the new score with the original sound, hear individual tracks and inspect listening mixes. It never reads or writes game saves. Music, ambience, effects and interface volumes are adjustable; phone and quiet mixes are available. See `docs/AUDIO_SOUND_PASS.md` for coverage and `docs/AUDIO_PLAYBACK.md` for playback contracts.

## Regional authored context

Forest Crypt, Sunken Archive and Colossus Mine now have distinct authored wings, practical work areas and contextual captive presentations. The Highlands Treasury has domestic rooms alongside its protected caches. Existing specialist unlocks, boss progression and v4 saves carry forward. This is the first iteration of Joel's three regional handoffs; see `docs/REGIONAL_HANDOFF_AUDIT.md` for settled canon, open choices and audit coverage.

## Controls

| Action | Desktop | Phone |
| --- | --- | --- |
| Move | WASD | Left joystick or tap a reachable destination |
| Interact | E / F | Interact |
| Skills 1–5 | 1–5 | Skill buttons |
| Skills 6–8 | Space / left Shift / B | Skill buttons |
| Charged skills 1–3 | Quick tap for normal; hold 0.65 seconds for charged | Same tap/hold behavior |
| Ranger healing | H / left mouse for Heal | Heal button |
| Squad doctrine | Tab during combat, Expedition 3+ | Contextual Squad button |
| Recall | Backtick | Recall squad |
| Change target | Q (customizable), or click Target in the HUD | Target beside Recall, above joystick |
| Map / inventory / journal | Z / I / J | Adventure menu |
| Pause / menu / controls | P or V / Escape / G | Menu |
| Menu navigation | W/A previous; S/D next; F/Enter/Space confirms | Direct tap; joystick and Confirm also work |

These are keyboard defaults. **Game and settings → Controls → Customize keyboard** changes and saves bindings on this browser/device. Menu navigation follows the chosen movement keys; Enter and Space remain confirmation fallbacks, and Esc opens/backtracks menus. Browser shortcuts remain available.

Menus, HUD buttons and skills accept mouse clicks and touch taps on every screen, including touchscreen Chromebooks and tablets. Skills 1–3 support quick taps and charge holds with either input. Movement autoattack remains active. Tap Target or Q to cycle visible hostiles; hold for 0.55 seconds to lock the current target throughout the encounter, including while dodging bosses or ignoring summons. Tap again to cycle and release that lock. The lock drops when its foe dies, returns home, or the hero changes area. The hero favors your chosen enemy, and otherwise falls back to automatic targeting. Holding Skill 1 or 2 shows subtle brackets and line-of-sight/range guidance (gold ready, amber out of range, red obstructed). Press Target during the hold to retarget. No persistent targeting circles are added.

**Controls → Touch and mouse options** selects the phone's default two-thumb layout (movement left, skills right) or the alternate left-hand layout. Touch tap-to-move is enabled by default alongside the joystick and can be disabled. Taps use existing collision/pathfinding; manual keyboard or joystick movement immediately takes over. Opening menus, pausing or losing focus cancels travel. Taps move the hero only and do not issue squad orders or automatically interact with services.

Mouse click-to-move is off by default and can be enabled separately. With it off, left-clicking the world commands Ranger Heal. The Heal button and its rebindable keyboard shortcut work in either mode. Sprint remains unavailable; Q now defaults to Target, and all keys remain rebindable.

Normal Skill 3 heals the hero; charged Skill 3 also heals living active companions. Active Rangers provide automatic and manually commanded Heal (hero or wounded living active companion). Fallen companions need separate recovery at a Captain or barracks. Death removes 20% of positive carried crowns, rounded up, without debt.

## Cooldown-only combat (reversible)

The live game has **no MP costs or MP HUD**. Skills are controlled by their cooldowns; Skills 1–3 have longer cooldowns when charged (base 3s / 6s / 20s), and the five-rank Cooldown Training talent reduces all hero skill cooldowns by 4% per rank (20% at rank 5). Open **Adventure → Talents** for training. Enemy mana-drain effects are dormant pending explicit replacement design; other enemy attacks remain unchanged. Ranger Heal stays, while Ranger Mana Recovery is inactive and no longer shown.

The previous MP rules, original character MP values, effects, Ranger mana training and legacy save fields are deliberately retained under the code feature switch `PrototypeRules.resourceMode.manaEnabled` (currently `false`). A prior-version Git revision provides a complete rollback, and flipping this flag back to `true` re-enables the preserved MP logic and legacy UI paths. Existing v4 saves keep their MP fields without spending or regenerating them in the cooldown-only game. Talent index 1 maps to Cooldown Training at the same invested rank; all other training ranks are preserved. Do not delete legacy fields or MP logic before the design is final.

## Saves and reports

Campaigns stay on the current browser/device. Export a save before clearing browser data or moving to another device. The v4 save schema and internal currency fields remain compatible; importing v2 backups is still supported. Changing screen layout does not create a different campaign.

**Game and settings → Save and game management** provides save export/import and a playtest report. Reports include the version, current campaign information and the most recent active-frame performance sample. Measurements are local; the game sends no telemetry. Frame rate varies with device, scene and browser load.

## Development

Use Node.js 22 (the CI version; minimum 20.9). The shipped game has no third-party runtime dependencies.

```sh
npm ci --ignore-scripts # install all locked development tools, including Playwright
npm run dev            # http://127.0.0.1:8080; phone entry is /phone.html
```

| Change | Local checks |
| --- | --- |
| During implementation | Run the affected `node tests/<name>.test.cjs` suites; `npm run test:quick` is an optional broader feedback pass. |
| Runtime code, styles or published assets | Bump the package version, run `npm run build`, then `npm run format:check`, `npm run check`, `npm test` and relevant browser tests. Commit the generated entries and service worker. |
| Tests or development tooling | Run formatting/generated checks and affected tests. CI runs the full gate. No runtime version bump or regeneration is needed unless generated inputs change. |
| Documentation only | Check links and instructions. No runtime version bump or regeneration. |

`npm test` automatically discovers every non-browser `tests/*.test.cjs` suite, including road access and town-street audits. Do not list those suites separately in CI or rerun `test:quick` after the full suite. Browser suites are separate: `npm run test:browser` runs the main Chromium device matrix, not every browser suite.

Install browser binaries once locally:

```sh
npx playwright install chromium
npx playwright install --with-deps webkit # Linux may require sudo for system dependencies
npm run test:browser
node tests/phone-webkit-browser.test.cjs
```

`CHROMIUM_EXECUTABLE` can select an existing Chrome executable. Playwright's version is pinned in `package-lock.json`; update it there through npm rather than installing a separate version in CI.

CI keeps the existing `pr-check`, `main-test` and `phone-webkit` checks. PR and main share the full Node/Chromium steps in [check-game](.github/actions/check-game/action.yml); WebKit and deployment remain in [pages.yml](.github/workflows/pages.yml). Add shared checks once in the action. Node suites need no workflow entry. Both browser engines, historical-save/PWA upgrade checks and exact published-build/live verification remain release gates. PRs changing only the small reviewed prose allowlist in [check-scope.cjs](.github/scripts/check-scope.cjs) run lightweight documentation/scope checks without installing dependencies or browsers. Existing job names remain visible and successful. Unknown files, mixed changes, missing comparison data, sprite catalogs, decisions, evidence, runtime, tests and tooling use full checks. Main pushes can reuse successful full PR validation only when the entire Git tree is identical, including workflows, dependencies and tests. Both the PR source tree and its tested merge tree must match main (update the PR branch before its final validation if main has moved). The certificate must come from this repository's completed successful Node/Chromium, WebKit and clean-packaging jobs; prose-only checks never produce it. Missing, expired, ambiguous or unavailable evidence falls back to full checks. Main always rebuilds and checks the package with its own commit in `build.txt`, then deploys and verifies the live site. Manual runs always perform full validation. No main push skips packaging/deployment merely because it changes prose, so it cannot cancel a pending game release without replacing it.

Performance regression hooks are ready for #223: they activate when `tests/perf-v09-protected.test.cjs` is present and retain its baseline equivalence and Chromium/WebKit road/renderer checks. That Node suite is already covered by automatic discovery. When integrating concurrent workflow edits, keep these hooks and the existing release gates.

Work on a separate branch. If interrupted, commit and push completed work to that branch and keep a brief resume note in its PR. Preserve other branches, unfinished work and original assets. A PR is not merge or deployment approval; follow the authorization in the task.

`node scripts/build.cjs --check --site` packages only the declared public assets into `_site`. One inventory drives entry script order, offline cache contents and deployment. Generated files are committed, so GitHub Pages can also serve the repository directly without a bundler. Historical `legacy.html` and `rts.html` are independent references, loaded and cached only when opened.

## Project references

- [Architecture and module boundaries](docs/ARCHITECTURE.md)
- [Current work and sequencing](docs/DEVELOPMENT_STATE.md)
- [Current backlog audit and recovery evidence](docs/BACKLOG_HOUSEKEEPING_20261010.md)
- [Archived development notes](docs/DEVELOPMENT_HISTORY_THROUGH_V08133.md)
- [Historical v0.8.84 engineering audit](docs/HOUSEKEEPING_AUDIT.md)
- [Historical v0.8.81 housekeeping](docs/HOUSEKEEPING_V0881.md)
- [Gameplay decisions](docs/DECISIONS.md)
- [Sprite production contract](docs/GRAPHICS_OVERHAUL_PHASE1.md)
- [Sprite coverage and canon](docs/GRAPHICS_CANON_SPRITE_COVERAGE.md)
- [Audio foundation and production sequence](docs/AUDIO_FOUNDATION.md)
- [Historical project narrative through v0.8.80](docs/PROJECT_HISTORY.md)

Phone gameplay uses a compact health/level HUD. Learned skills and available Ranger recovery controls sit at the bottom right; Interact appears separately only within reach of a usable target. Recall and Target remain grouped near the movement controls; **Adventure → Talents** opens training directly. Map/time labels and routine save reminders no longer occupy the gameplay HUD.

## Story guidance and services

**Adventure → Quest journal** opens the Story journal: specialist rescues, the next regional transport, the Dark Lord, five TRUE guardians during Awakening, and completion. Ordinary local jobs stay on settlement quest boards. **Adventure → Map and travel routes** shows the current region; choose a destination and use **Navigate** to start its reachable route. Manual movement takes over from automatic travel.

Adventure also provides **Inventory and support**, **Talents**, and eligible field **Establish Basic Barracks** construction. Captains provide recruitment and recovery directly. Menus pause single-player play; the former Settings Pause play option is no longer needed. Ordinary dialogs close on an outside tap/click without passing that gesture through to movement; mandatory character/succession choices remain protected.

## Artwork and known limits

Registered artwork is active: the audited baseline has 33 sprite identities and seven ground/road materials, with procedural fallback for missing/unavailable artwork. Original-master adaptation and the broader missing catalog continue under issue #160; developer tooling is documented in [SPRITE_PREPARATION.md](docs/SPRITE_PREPARATION.md) and [SPRITE_RESOLUTION_HOUSEKEEPING.md](docs/SPRITE_RESOLUTION_HOUSEKEEPING.md). The old production pause is historical.

Saves stay on the browser/device; there is no cloud synchronization or playable co-op. Native Android/iOS packages are not current distribution targets. Browser tests do not certify physical-device comfort, every map's artistic completion or a full human campaign playthrough. See the [current limitations and v0.9 acceptance work](docs/DEVELOPMENT_STATE.md).
