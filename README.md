# Azeroth Chronicles · v0.8.81

An offline-capable RPG across five regions, ten settlements and five main dungeons. Rescue the specialists, build your expedition, and challenge the Dark Lord. The regime's currency is **crowns**.

The canonical Azeroth Chronicles product is the multi-file GitHub Pages/PWA application. It uses JavaScript, Canvas 2D and Web Audio; there is no game backend. The campaign engine is shared, while desktop and phone have separate presentation rules. Map reviews and sprite production can continue on this foundation.

## Play

- [Chromebook / browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/): keyboard layout, compact skill bar, unobstructed play-space camera, no joystick or touch confirmation buttons.
- [Phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html): dedicated touch layout, portrait/landscape controls and safe-area spacing. **Game and settings → Install on phone** opens installation instructions or the browser's install prompt. This remains a web app, not a native Android/iOS package.

Automatic selection uses pointer capabilities, including a mouse/trackpad on a touchscreen Chromebook. Resizing a desktop window does not turn it into a phone screen. **Game and settings → Screen and performance** changes the screen preference and shows local performance measurements. Both entries use the same on-device saves.

Choose a Standard run or the optional Succession challenge, then Paladin, Mage or Ranger. Normal and Nightmare have independent saves. Nightmare unlocks after the peaceful ending. Updates preserve local campaigns and adopt the tested published build automatically; a manual update check is also available in settings.

## Controls

| Action | Desktop | Phone |
| --- | --- | --- |
| Move | WASD | Left joystick |
| Interact | E / F | Interact |
| Skills 1–5 | 1–5 | Skill buttons |
| Skills 6–8 | Space / left Shift / B | Skill buttons |
| Charged skills 1–3 | Quick tap for normal; hold 0.65 seconds for charged | Same tap/hold behavior |
| Ranger recovery | H / left mouse for Heal; M / right mouse for Mana Recovery | Recovery buttons |
| Squad doctrine | Tab during combat, Expedition 3+ | Contextual Squad button |
| Recall | Backtick | Recall squad |
| Map / inventory / journal | Z / I / J | Adventure menu |
| Pause / menu / controls | P or V / Escape / G | Menu |
| Menu navigation | W/A previous; S/D next; F/Enter/Space confirms | Joystick and Confirm |

Desktop remains keyboard-first. Mouse clicks do not move the hero or activate menus. Q remains reserved; sprint is unavailable. Incomplete charge holds cancel safely, and charged actions still require valid targets, mana and cooldown readiness.

## Saves and reports

Campaigns stay on the current browser/device. Export a save before clearing browser data or moving to another device. The v4 save schema and internal currency fields remain compatible; importing v2 backups is still supported. Changing screen layout does not create a different campaign.

**Game and settings → Save and game management** provides save export/import and a playtest report. Reports include the version, current campaign information and the most recent active-frame performance sample. Measurements are local; the game sends no telemetry. Frame rate varies with device, scene and browser load.

## Development

Use Node.js 20 or newer. The shipped game has no third-party runtime dependencies.

```sh
npm ci               # install the locked development tools
npm run build        # regenerate the three entries, build information and service worker
npm run dev          # http://127.0.0.1:8080; phone entry is /phone.html
npm run format:check # verify readable formatting in the refactored modules
npm run check        # generated-file freshness, published assets and JavaScript syntax
npm test             # all non-browser regression suites
npm run test:quick   # focused gameplay, saves, platform and renderer regressions
```

Browser testing uses Playwright 1.62.1 and Chromium/Chrome. CI supplies them and checks desktop, small phone, portrait, landscape and tablet views, then verifies the exact deployed commit. With those tools installed locally, use `npm run test:browser`; `CHROMIUM_EXECUTABLE` can select an existing Chrome executable.

`node scripts/build.cjs --check --site` packages only the declared public assets into `_site`. One inventory drives entry script order, offline cache contents and deployment. Generated files are committed, so GitHub Pages can also serve the repository directly without a bundler. Historical `legacy.html` and `rts.html` are independent references, loaded and cached only when opened.

## Project references

- [Architecture and module boundaries](docs/ARCHITECTURE.md)
- [Current work and sequencing](docs/DEVELOPMENT_STATE.md)
- [Housekeeping release and validation](docs/HOUSEKEEPING_V0881.md)
- [Gameplay decisions](docs/DECISIONS.md)
- [Sprite production contract](docs/GRAPHICS_OVERHAUL_PHASE1.md)
- [Sprite coverage and canon](docs/GRAPHICS_CANON_SPRITE_COVERAGE.md)
- [Historical project narrative through v0.8.80](docs/PROJECT_HISTORY.md)
