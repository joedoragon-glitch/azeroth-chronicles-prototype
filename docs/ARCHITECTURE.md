# Runtime architecture

The browser is the current desktop playtest target, especially Chromebook keyboard/trackpad use. The phone target is an installable PWA with dedicated touch presentation. They share campaign logic and content, rather than keeping two copies of the game. A future desktop executable or native phone wrapper can host those same boundaries; no wrapper or engine migration is part of this housekeeping pass.

## Ownership

| Module | Responsibility |
| --- | --- |
| `data.js` / `rules.js` | Approved content and authoritative live balance (`rules.balance`), combat/support and authored geometry tables |
| `world.js` | Region generation, settlements, authored sites, interiors, occupation layouts and world migrations |
| `navigation.js` | Collision, line of sight, routing, movement and following |
| `engine.js` | Authoritative Campaign state, simulation clock, enemy AI, encounter population, death/succession and quest orchestration |
| `hero-combat.js` | Paladin, Mage and Ranger skills and basic combos; hero skill mana costs |
| `boss-combat.js` | Boss attack selection/sequences, geometry/resolution/motion and summons; reused captain/night attack primitives |
| `combat.js` | Shared targets, damage, mana drain, segment geometry, projectiles and hazards |
| `party.js` | Companion roster, recruitment/recovery, labor orders, formations/doctrine/Recall, automatic specials and Ranger support |
| `progression.js` | EXP thresholds/level growth, discipline ranks/resets, instructor curricula, Expedition training, equipment and companion inheritance |
| `economy.js` | Crown transactions, quoted purchase/training/service prices, fares and death penalties |
| `rewards.js` | Regional/boss/ringleader reward profiles, challenge reductions, enemy drops, quest payouts, first-clear amounts and resource deposit rounding |
| `save.js` | v4 snapshots, validation/repair, restoration and legacy v2 migration; no browser storage |
| `persistence.js` | Browser storage, existing v4 keys, profile persistence and original legacy backup retention |
| `input.js` | Validated persistent bindings, pointer preferences and reachable destination requests |
| `platform.js` | Input-capability detection, explicit screen choice and camera anchoring |
| `renderer.js` | World projection, viewport culling, draw order, transient effects and renderer counters |
| `visuals.js` / `combat-visuals.js` | Canonical procedural drawings, terrain, architecture and combat cues |
| `sprites.js` | Optional faithful sprite translation and procedural fallback |
| `audio.js` / `audio-catalog.js` | Public audio facade and current compositions/event catalog |
| `audio-score.js` | Cue selection, contextual observation, score scheduling, fades and ambience |
| `audio-runtime.js` / `audio-effects.js` | Context lifecycle, mixer/source cleanup/bounds, diagnostics and contextual effect recipes |
| `runtime.js` | Bounded active-frame measurements and idle redraw scheduling |
| `menus.js` | Specialist, barracks, party, inventory and training menu definitions/actions; current game and shell callbacks injected |
| `app.js` | Shell lifecycle, global/settings menus, map presentation, keyboard/touch coordination, charge input, frame scheduling and app updates |

World, navigation, progression, save, shared combat, hero combat, boss combat, party, economy and rewards owners install method descriptors before Campaign is exported. Save also installs the existing static validate/restore/migrate APIs. The domain modules receive the Campaign constructor and explicit content/configuration dependencies; none imports engine.js or uses browser storage. They receive explicit content dependencies and have no browser dependency. This keeps the public Campaign API stable for saves, tests and existing callers. They do not introduce a second state store. Navigation's numerical rules are unchanged. `Campaign.classes`, `talentProfiles` and `talentMaxRanks` retain compatible references to rules balance tables. Legacy weapon/import maps are compatibility data, not duplicate live balance. Instructor skill ceilings derive from the authored curriculum. Existing combat/support tables remain in rules.js.

`menus.js` receives `getGame`, Campaign/content, action/open/close services, Recall, map and finale callbacks. It keeps helpers private and exports ten catalog entry points. Delayed actions read `getGame()` at invocation so switching/reloading a campaign cannot leave a copied or stale state store. Shell input clearing, charge cancellation, Back selection and frame scheduling remain in app.js.

Rendering reads the campaign and holds only transient presentation state. Screen coordinates are logical CSS pixels. The browser shell sizes the physical canvas for device pixel ratio, capped at 2 on desktop and 1.5 on phone, with a three-million-pixel budget where the viewport permits it. Combat geometry remains in world coordinates. Existing zone initialization/migration stays in the world layer.

## Device boundary

`styles/prototype.css` defines the shared theme. `desktop.css` and `phone.css` contain separate layouts scoped by the selected experience. A narrow desktop window keeps its desktop identity. Fine pointer plus hover support wins on hybrid laptops; coarse-only input chooses phone. An explicit setting or `?experience=desktop|phone` overrides detection. `phone.html` defaults to the phone presentation; an explicit saved screen choice survives relaunch. The compact phone HUD leaves the hero and skill controls clear. `phone.html` is the installed PWA launch entry.

`templates/game.html` generates all three campaign entries (`index.html`, `prototype.html`, `phone.html`). They load the same script graph and share storage on the same origin. Phone-specific controls are absent from the desktop layout. Menus and HUD accept keyboard, mouse and touch independently of presentation. Input preferences use their own versioned storage key; campaign save schemas remain unchanged.

## Work limits

Floor iteration starts within inverse-projected viewport bounds, then applies the original visibility check. Objects are culled before cloning and depth sorting. Static HUD markup is replaced only when its content changes. Hidden pages skip simulation/presentation work; paused or unfocused worlds redraw at most four times per second. Simulation timing, action costs, cooldowns, routes and damage rules retain their prior behavior.

Performance samples retain at most 180 active frames and stay local. Exported reports distinguish sampled work time from frame cadence. These measurements do not establish a universal Chromebook frame-rate guarantee; testing on the actual target device remains useful.

## Build and release

`scripts/site-assets.cjs` is the source for the campaign script graph and public asset inventory. `scripts/build.cjs` generates entries, build version and the service worker, checks missing assets and syntax, validates registered sprites, and prepares the deployment directory. Package version drives the offline cache version. Changes to runtime assets require a version bump and regeneration.

The campaign core is precached. Independent legacy games are cached only after they are opened online. Registered sprite assets join the current cache. New cache activation removes only obsolete Azeroth caches. Save keys are independent of cache versions.

CI checks generated artifacts before testing. PRs run all non-browser suites and desktop/phone browser paths. Main runs all suites and the full device matrix, publishes only after success, and checks that the live build identifier matches the tested commit before live smoke verification.

## Remaining coupling

`engine.js` still contains enemy AI, encounter population, death/succession and quest orchestration. Hero profession skills, boss attacks/summons, shared damage/projectiles and party behavior now have separate owners; their existing method bodies and public Campaign descriptors are preserved. `app.js` retains global/settings/lifecycle menus and map Canvas drawing alongside input/frame coordination. Domain methods deliberately call the shared Campaign API through `this`; this is an incremental boundary, not a fully isolated functional simulation. Further enemy AI or quest extraction should follow actual dependencies and preservation comparisons. `boss-combat.js` owns boss summon policies/spawning while calling engine enemy factories/engagement; `combat.js` calls shared death/kill services; `party.js` calls navigation, progression and world services through the same Campaign instance. This pass does not claim these domains are independently simulated or that their large individual methods have all been decomposed. No gameplay completion or finished sprite set is required. See `HOUSEKEEPING_AUDIT.md` for this pass and limits.

All hand-authored campaign JavaScript and shared/desktop/phone CSS use pinned Prettier coverage. Only generated build-info.js is excluded; npm run check verifies its exact generator output. The populated-registry tests use isolated 2×2 PNG fixtures, never production art. Packaging rejects missing files and symlinks escaping the sprite directory. Service-worker install policy is unchanged: registered image failures reject installation, whereas malformed optional manifest JSON keeps procedural play.

## Sprite preparation tooling

Development-only `scripts/sprite-pipeline.cjs` owns catalog parsing, image inspection/processing, immutable provenance, approval-controlled registry derivation and deterministic context capture. `tools/sprites/specifications.json` owns the three prepared exact bindings and provisional budgets; `tools/sprites/approved.json` owns approved source/output records. The Markdown prompt catalog remains authoritative and is parsed instead of copied. `tools/sprites/showroom.*` renders local comparisons and never loads in the game. Pinned Sharp and native Canvas are development dependencies only. See `SPRITE_PREPARATION.md`; production art and loading policy are unchanged.

## Regional authored context

`rules.js` owns authored dungeon/residence walkable bounds, real partitions, floor surface treatments, guard/trap placement and contextual furnishing/workstation specifications. `world.js` stages contextual captives and places outdoor support scenes after existing settlements/strongholds, reserving future rescued-service stands. Existing Campaign dungeon/treasury authoring performs versioned geometry migration without replacing saved progression. `visuals.js` draws the same geometry as collision; `renderer.js` uses the authored Highlands residence footprint and keeps captive labels within the Canvas. Working captives retain the internal `cage` rescue kind/family; `presentation: 'workstation'` changes their drawing and pre-rescue context. `sprites.js` keeps workstations and `sceneRole` furnishings on procedural paths instead of substituting generic images. No new runtime module or production asset is introduced.

## Audio foundation

Audio owners install their methods before `PrototypeAudio` is exported in Node or the browser. The public API, four volume defaults, existing compositions and sound recipes remain compatible. No gameplay owner imports audio. The shell supplies menu/background/start/pause metadata separately from the existing audio-pause boolean; future authored scoring can inspect exact region/interior/boss/form without inferring mechanics from prose. Current cue-selection policy is preserved.

`scripts/audio-assets.cjs` validates the empty recorded-audio registry and provides registered local file paths to the common inventory, packaging and precache. Registration checks path/symlink containment, hashes, provenance, duration/loop metadata, container signatures and encoded-size guards. This is asset publishing preparation; recorded playback, codec/decode/decoded-memory policy and the richer scene mix are future work. See `AUDIO_FOUNDATION.md` for findings, preservation checks and the production sequence.

## Recorded audio and audition v0.8.89

`audio-assets.js` owns verified local fetching, codec fallback, serialized decoding and a pinned 32 MiB decoded LRU cache. `audio-recordings.js` owns source handles, synchronized loop groups, transitions, intensity and opt-in exact-context cue rules. `audio-mixer.js` owns listening/foreground mix profiles and source priorities. The new interface bus defaults to the existing effects preference unless explicitly adjusted; reference/world mix preserves the original four settings and recipes. No domain module or game shell behavior is changed.

The separate published `tools/audio/index.html` loads isolated campaign/audio owners, never persistence or app. Its diagnostic WAVs are generated in memory, never registered as production recordings. The explicit four audition files join the offline inventory; sprite tools and all other development tools stay unpublished. Known public HTML navigation now resolves its own cached entry rather than falling back to the game. See `AUDIO_PLAYBACK.md` for the current contracts. The preceding v0.8.88 foundation describes the historical packaging-only state.

## Contextual production score v0.8.90

`audio-production.js` observes exact scene metadata and selects authored local tracks, smooths combat/TRUE stems without transport restarts, holds refuge transitions briefly, and owns interface feedback, distance-based surface footsteps, sparse environment details and a shared stereo reflection tail. The shell enables this production director, keeps menu audio running under the menu mix while simulation remains frozen, and suspends on explicit pause/background loss. No domain module imports audio or changes gameplay state.

The 83 original MP3 cues are immutable registered assets and join precaching; decoding remains lazy and bounded. `tools/audio/score-book.json` and `render-score.py` are development-only composition/rendering sources. The original procedural score remains the recovery path when a registered recording cannot load. See `AUDIO_SOUND_PASS.md`.

## Economy and EXP housekeeping

Prepared v0.8.89 keeps the shared Campaign API and state. Economy owns money mutations; actions in progression/party/engine still own eligibility, training effects, construction, recovery and route transitions. `grant(gold, xp)` remains the compatible reward dispatcher and calls progression's `xp`. Travel charges only after arrival succeeds, inside the existing state rollback boundary. Rewards owns reward amounts and payment policies; kill orchestration retains the summoned-enemy and already-paid guards. EXP is awarded immediately on defeat; crown loot is paid only on pickup. Labor retains gathering/deposit timing and fractional carry.

Menus and shell quote prices through the same Campaign methods used by purchases. Authored skill learning/rank prices, regional fares/base rewards and quest/boss rewards remain in `data.js`; existing specialist/companion/equipment/tribute tables remain in `rules.js`. The remaining former literals live in `rules.balance.economy` and `rules.balance.rewards`. These are authoritative inputs, not copied balance catalogs. `data.economy` is an unused aggregate reference, not a live price source. See `ECONOMY_EXP_HOUSEKEEPING.md` for all sources, invariants and validation.
