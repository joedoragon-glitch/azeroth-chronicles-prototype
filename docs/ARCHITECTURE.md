# Runtime architecture

The browser is the current desktop playtest target, especially Chromebook keyboard/trackpad use. The phone target is an installable PWA with dedicated touch presentation. They share campaign logic and content, rather than keeping two copies of the game. A future desktop executable or native phone wrapper can host those same boundaries; no wrapper or engine migration is part of v0.8.81.

## Ownership

| Module | Responsibility |
| --- | --- |
| `data.js` / `rules.js` | Approved content, economy, combat and authored geometry tables |
| `world.js` | Region generation, settlements, authored sites, interiors, occupation layouts and world migrations |
| `navigation.js` | Collision, line of sight, routing, movement and following |
| `engine.js` | Campaign state, progression, combat, party behavior, save validation and migration |
| `persistence.js` | Browser storage, existing v4 keys, profile persistence and original legacy backup retention |
| `platform.js` | Input-capability detection, explicit screen choice and camera anchoring |
| `renderer.js` | World projection, viewport culling, draw order, transient effects and renderer counters |
| `visuals.js` / `combat-visuals.js` | Canonical procedural drawings, terrain, architecture and combat cues |
| `sprites.js` | Optional faithful sprite translation and procedural fallback |
| `audio.js` | Original music, contextual sound and audio lifecycle |
| `runtime.js` | Bounded active-frame measurements and idle redraw scheduling |
| `app.js` | Menus, keyboard/touch bindings, charge input, frame coordination and app-update lifecycle |

World and navigation install methods on Campaign's prototype before it is exported. They receive explicit content dependencies and have no browser dependency. This keeps the public Campaign API stable for saves, tests and existing callers. They do not introduce a second state store. Navigation's numerical rules are unchanged.

Rendering reads the campaign and holds only transient presentation state. Screen coordinates are logical CSS pixels. The browser shell sizes the physical canvas for device pixel ratio, capped at 2 on desktop and 1.5 on phone, with a three-million-pixel budget where the viewport permits it. Combat geometry remains in world coordinates. Existing zone initialization/migration stays in the world layer.

## Device boundary

`styles/prototype.css` defines the shared theme. `desktop.css` and `phone.css` contain separate layouts scoped by the selected experience. A narrow desktop window keeps its desktop identity. Fine pointer plus hover support wins on hybrid laptops; coarse-only input chooses phone. An explicit setting or `?experience=desktop|phone` overrides detection. `phone.html` defaults to the phone presentation; an explicit saved screen choice survives relaunch. The compact phone HUD leaves the hero and skill controls clear. `phone.html` is the installed PWA launch entry.

`templates/game.html` generates all three campaign entries (`index.html`, `prototype.html`, `phone.html`). They load the same script graph and share storage on the same origin. Phone-specific controls are absent from the desktop layout. The keyboard-first menu and mouse recovery-command rules remain deliberate game-design decisions.

## Work limits

Floor iteration starts within inverse-projected viewport bounds, then applies the original visibility check. Objects are culled before cloning and depth sorting. Static HUD markup is replaced only when its content changes. Hidden pages skip simulation/presentation work; paused or unfocused worlds redraw at most four times per second. Simulation timing, action costs, cooldowns, routes and damage rules retain their prior behavior.

Performance samples retain at most 180 active frames and stay local. Exported reports distinguish sampled work time from frame cadence. These measurements do not establish a universal Chromebook frame-rate guarantee; testing on the actual target device remains useful.

## Build and release

`scripts/site-assets.cjs` is the source for the campaign script graph and public asset inventory. `scripts/build.cjs` generates entries, build version and the service worker, checks missing assets and syntax, validates registered sprites, and prepares the deployment directory. Package version drives the offline cache version. Changes to runtime assets require a version bump and regeneration.

The campaign core is precached. Independent legacy games are cached only after they are opened online. Registered sprite assets join the current cache. New cache activation removes only obsolete Azeroth caches. Save keys are independent of cache versions.

CI checks generated artifacts before testing. PRs run focused suites and desktop/phone browser paths. Main runs all suites and the full device matrix, publishes only after success, and checks that the live build identifier matches the tested commit before live smoke verification.

## Further extraction

`engine.js` still contains substantial combat and progression logic, and `app.js` still contains the menu catalog. These are the next candidates for measured, test-backed extraction when work touches those domains. No gameplay completion or finished sprite set is required to improve architecture. Asset additions should use the manifest and existing renderer adapter, rather than growing a portable HTML file.
