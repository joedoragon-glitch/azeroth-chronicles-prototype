# Runtime architecture

The browser is the current desktop playtest target, especially Chromebook keyboard/trackpad use. The phone target is an installable PWA with dedicated touch presentation. They share campaign logic and content, rather than keeping two copies of the game. A future desktop executable or native phone wrapper can host those same boundaries; no wrapper or engine migration is part of this housekeeping pass.

## Ownership

| Module | Responsibility |
| --- | --- |
| `data.js` / `rules.js` | Approved content and authoritative live balance (`rules.balance`), combat/support and authored geometry tables |
| `field-onboarding.js` | Saved opening-field hero-first admission, silent level-2 Thornfang/Mira arrival and physical companion-triggered Thornfang withdrawal; native combat/path/reset owners resolve admitted behavior |
| `world.js` | Region generation, settlements, authored sites, interiors, occupation layouts and world migrations |
| `fortifications.js` | Authored defended footprints, position-derived enemy bonuses and enemy-only wall/low-cover shot permissions; transient geometry cache |
| `navigation.js` | Collision, line of sight, route solving, movement/following, fast-reject obstacle checks and bounded opt-in crowd diagnostics |
| `engine.js` | Authoritative Campaign state, simulation clock, enemy AI, encounter population, death/succession and quest orchestration |
| `hero-combat.js` | Paladin, Mage and Ranger cooldown-based skills, charged forms and basic combos (legacy mana logic remains dormant) |
| `boss-combat.js` | Boss attack selection/sequences, geometry/resolution/motion and summons; reused captain/night attack primitives |
| `combat.js` | Shared targeting, actual HP damage, status, segment geometry, projectiles and hazards (historical mana drain logic is dormant) |
| `party-pets.js` | Pet specialization on the same recruited roster and shared lifecycle |
| `hero-presentation.js` / `audio-hero.js` | Observation-only hero skill drawings and original foley |
| `archive.js` | Keeper references and shared condition explanations |
| `party.js` | Companion roster, recruitment/recovery, labor orders, formations/doctrine/Recall, automatic specials and Ranger support |
| `progression.js` | EXP thresholds/level growth, discipline ranks/resets, instructor curricula, Expedition training, equipment and companion inheritance |
| `economy.js` | Crown transactions, quoted purchase/training/service prices, fares and death penalties |
| `treasury.js` | Regional death-loss accounts, captain-gated collection and returning native Treasury defenders; wallets remain in economy |
| `expeditions.js` | Full Barracks resource missions to cleared earlier regions, worker absence and simulation-clock return; wallets remain in economy |
| `rewards.js` | Regional/boss/ringleader reward profiles, challenge reductions, enemy drops, quest payouts, first-clear amounts and resource deposit rounding |
| `save.js` | v4 snapshots, validation/repair, restoration and legacy v2 migration; no browser storage |
| `persistence.js` | Browser storage, existing v4 keys, profile persistence and original legacy backup retention |
| `input.js` | Validated persistent bindings, pointer preferences and reachable destination requests |
| `platform.js` | Input-capability detection, explicit screen choice and camera anchoring |
| `renderer.js` | Canvas 2D world projection/draw order, viewport culling, transient effects, fallback artwork, Canvas combat-cue overlay and renderer counters |
| `visuals.js` / `combat-visuals.js` | Canonical procedural drawings, terrain, architecture and combat cues |
| `sprite-format.js` / `sprites.js` | Shared static/variant/clip schema, bounded content-aware lazy loading, paused presentation clock, faithful sprite translation and procedural fallback |
| `audio.js` / `audio-catalog.js` | Public audio facade and current compositions/event catalog |
| `audio-score.js` | Cue selection, contextual observation, score scheduling, fades and ambience |
| `audio-runtime.js` / `audio-effects.js` | Context lifecycle, mixer/source cleanup/bounds, diagnostics and contextual effect recipes |
| `runtime.js` | Bounded stage/frame samples, two Auto/manual FPS policies, adaptive draw skips, critical emergency holds, resolution control and idle redraw scheduling |
| `skill-reference.js` | Read-only class skill descriptions, current effect figures and next-rank comparisons; native hero combat and rules remain authoritative |
| `menus.js` | Specialist, barracks, party, inventory and training menu definitions/actions; current game and shell callbacks injected |
| `app.js` | Shell lifecycle, global/settings menus, map presentation, keyboard/touch coordination, charge input, frame scheduling and app updates |

World, navigation, progression, save, shared combat, hero combat, boss combat, party, economy and rewards owners install method descriptors before Campaign is exported. Save also installs the existing static validate/restore/migrate APIs. The domain modules receive the Campaign constructor and explicit content/configuration dependencies; none imports engine.js or uses browser storage. This keeps the public Campaign API stable for saves, tests and existing callers. They do not introduce a second state store. Navigation has received later route-solver, marker/control and collision fast-rejection changes through merged #421 and #426; consult current source and the focused regression evidence for those contracts. `Campaign.classes`, `talentProfiles` and `talentMaxRanks` retain compatible references to rules balance tables. Legacy weapon/import maps are compatibility data, not duplicate live balance. Instructor skill ceilings derive from the authored curriculum. Existing combat/support tables remain in rules.js.

`menus.js` receives `getGame`, Campaign/content, action/open/close services, Recall, map and finale callbacks. It keeps helpers private and exposes catalog entry points, including the concise Hero skills and Combat conditions references. Delayed actions read `getGame()` at invocation so switching/reloading a campaign cannot leave a copied or stale state store. Shell input clearing, charge cancellation, Back selection and frame scheduling remain in app.js.

Rendering reads the campaign and holds only transient presentation state. Screen coordinates are logical CSS pixels. The browser shell sizes the physical canvas for device pixel ratio, capped at 2 on desktop and 1.5 on phone, with a three-million-pixel budget where the viewport permits it. Combat geometry remains in world coordinates. Existing zone initialization/migration stays in the world layer.

## Authored combat extensions

`cindermaw-combat.js` extends existing boss/combat owners for Cindermaw's approved seven ministerial attacks and guarded ministry inspections. Existing navigation physically moves same-ID Vera/mobile forge and two designated native Ash-beast guards; v4 snapshots preserve positions while sanitizing encounter/equipment state. Finite local defensive equipment consumes accepted shared damage and receives bounded Vera repairs, with all tuning in rules.js and no universal durability economy. Shared summon factories, targeting, geometry, death and save cleanup remain in their existing owners. Directed native orders, contracting cordons and three-second protection are transient actor fields cleared through `clearEncounterState`; snapshots clean copies and raw historical restores drop those fields. No new campaign store or browser dependency is introduced. Timing and tuning remain in `rules.js`; actual cues remain in `combat-visuals.js` and the existing observation-only VFX bridge.

`dreadmaw-combat.js` extends existing captain owners for seven approved agricultural regular attacks. It reuses the four-member brood factory, actual phase/reflection, Rogue methods and physical Treasury navigation. Director14October authorizes reasonable location expansion for worldbuilding; the shared Treasury now includes agricultural stores, a distribution gallery and a larger Inner Vault, using an optional per-room size and version5 idempotent migration. Local collision-safe L rushes and transient net/vapor/feed states share existing update, damage and save cleanup. Numerical tuning stays in the supply-crown rules profile; no new state store or browser dependency.

## Device boundary

`styles/prototype.css` defines the shared theme. `desktop.css` and `phone.css` contain separate layouts scoped by the selected experience. A narrow desktop window keeps its desktop identity. Fine pointer plus hover support wins on hybrid laptops; coarse-only input chooses phone. An explicit setting or `?experience=desktop|phone` overrides detection. `phone.html` defaults to the phone presentation; an explicit saved screen choice survives relaunch. The compact phone HUD leaves the hero and skill controls clear. `phone.html` is the installed PWA launch entry.

`templates/game.html` generates all three campaign entries (`index.html`, `prototype.html`, `phone.html`). They load the same script graph and share storage on the same origin. Phone-specific controls are absent from the desktop layout. Menus and HUD accept keyboard, mouse and touch independently of presentation. Input preferences use their own versioned storage key; campaign save schemas remain unchanged.

## Work limits

Floor iteration starts within inverse-projected viewport bounds, then applies the original visibility check. Objects are culled before cloning and depth sorting. Static HUD markup is replaced only when its content changes. Hidden pages skip simulation/presentation work; paused or unfocused worlds redraw at most four times per second. Simulation timing, action costs, cooldowns, routes and damage rules retain their prior behavior.

**Current performance architecture (dev.169, 24 October 2026).** `runtime.js` owns the original drawn-callback sampling, a 180-active-callback frame-stage profiler, Auto 20–30/30–60 and manual 20/30/60 drawing targets, adaptive render resolution, and the device-local frame-skip controller. Adaptive Frame Skip defaults **On unless the device stored Off**, skips at most **two consecutive FPS-eligible drawings** under sustained load (350 ms stale-image decision guard); **critical emergency** can skip five eligible drawings (650 ms guard) and intentionally **suspends game simulation/combat** until three healthy actual draw probes. `app.js` decides the simulation/skip boundaries, samples audio, event handling, HUD and rendering, and performs staged critical protection: encounter disengagement/reset, limited companion withdrawal and refuge relocation after persistent failure. Abnormal restart recovery validates the last persisted checkpoint. Do not describe the emergency as a simple presentation-only frame skip. The optional profiler in `navigation.js` captures up to 120 active crowd ticks locally, while collision rejects distant circular obstacles before precise distance math.

**Graphics and timing:** Canvas 2D remains default. The selectable experimental PixiJS WebGL2 world with native Canvas combat-cue overlay has a 15-second Keep/Revert safety path; both renderers share the frame gate. Performance reports carry `graphicsRenderer`, `render.measuredLayer`, `crowdDiagnostics`, the `frameSkip` controller status and `frameProfile` including renderer-specific `pixiMs`, `canvasOverlayMs` and `canvasWorldMs`. These are **synchronous CPU call times**, not completed GPU work, compositor presentation or input-to-photon latency. Legacy `fps` (draw cadence), `frameProfile.callbackFps` (active callback opportunities), and `frameProfile.displayedFps` (issued world draws) use different concepts. A callback during an emergency pause is **not** a completed game tick. Renderer phase/latest-draw counters can include menu/idle draws, and rolling sample windows differ; companion/enemy timings are broad simulation subsets and independent P95 figures must not be added. The old 22 October audit records the dev.164–166 baseline; it is **not the only available evidence**. The [cumulative 22–24 October performance evidence register](PERFORMANCE_EVIDENCE_REGISTER_20261024.md) adds later Auto FPS safety, emergency/restart, collision and integration audit results. [The dev.169 measurement/status guide](CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md) and [integration history](PERFORMANCE_RESILIENCE_INTEGRATION_20261024.md) govern current interpretation. Synthetic collision and focused tests do not prove actual Chromebook FPS gain.

## Build and release

`scripts/site-assets.cjs` is the source for the campaign script graph and public asset inventory. `scripts/build.cjs` generates entries, build version and the service worker, checks missing assets and syntax, validates registered sprites, and prepares the deployment directory. Package version drives the offline cache version. Changes to runtime assets require a version bump and regeneration.

The campaign core is precached. Independent legacy games are cached only after they are opened online. Registered sprite assets join the current cache. New cache activation removes only obsolete Azeroth caches. Save keys are independent of cache versions.

**Current CI:** [PR #412](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/412) made `.github/workflows/focused-deploy.yml` the normal PR/main path, selecting impacted tests and verifying a reproducible package; successful main pushes deploy GitHub Pages. `.github/workflows/pages.yml` is manual-only for owner-authorized comprehensive game, Chromium and WebKit testing (`approve_full_suite=true`). Focused publication verifies packaging and deployment but does not imply the full matrix ran. See README and the current workflow files for live release policy.

## Remaining coupling

`engine.js` still contains enemy AI, encounter population, death/succession and quest orchestration. Hero profession skills, boss attacks/summons, shared damage/projectiles and party behavior now have separate owners; their existing method bodies and public Campaign descriptors are preserved. `app.js` retains global/settings/lifecycle menus and map Canvas drawing alongside input/frame coordination. Domain methods deliberately call the shared Campaign API through `this`; this is an incremental boundary, not a fully isolated functional simulation. Further enemy AI or quest extraction should follow actual dependencies and preservation comparisons. `boss-combat.js` owns boss summon policies/spawning while calling engine enemy factories/engagement; `combat.js` calls shared death/kill services; `party.js` calls navigation, progression and world services through the same Campaign instance. This pass does not claim these domains are independently simulated or that their large individual methods have all been decomposed. No gameplay completion or finished sprite set is required. See `HOUSEKEEPING_AUDIT.md` for this pass and limits.

All hand-authored campaign JavaScript and shared/desktop/phone CSS use pinned Prettier coverage. Only generated build-info.js is excluded; npm run check verifies its exact generator output. The populated-registry tests use isolated 2×2 PNG fixtures, never production art. Packaging rejects missing files and symlinks escaping the sprite directory. Service-worker install policy is unchanged: registered image failures reject installation, whereas malformed optional manifest JSON keeps procedural play.

## Assets, combat and release evidence

Current registries contain 33 sprites, seven ground/road materials and 127 audio assets. Sprite decoding is lazy, shared and bounded to a 256 MiB ceiling; the outdoor floor picture has a separate 64 MiB bound. These are ceilings, not upfront allocations or device-performance guarantees. Original-master provenance, exact variants and animation dependencies follow [the sprite workflow](DESIGN_TO_SPRITE_WORKFLOW.md) and [export policy](SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md). The old 16 MiB/empty-manifest/pilot-only descriptions are historical.

Hero combat uses cooldowns and eight class-specific tap/charged forms. Legacy MP logic remains dormant under `PrototypeRules.resourceMode.manaEnabled = false`. `party-pets.js` adds eleven specializations to the existing party, never a parallel roster. `hero-presentation.js`, `enemy-vfx-events.js`, audio and renderer modules observe events without authorizing casts or changing simulation. Enemy healing selects hostile recipients; movement auto-attacks do not issue approach orders or cancel Recall. Pet snapshots and shared encounter cleanup use existing v4 owners.

The audio manifest owns recorded assets, routing and authoring metadata; build derives `audio-library.js`. `audio-recordings.js` owns bounded decoding/transport, `audio-environment.js` independent ambience beds, and the production director selects place/boss/scene cues. Failed assets retain procedural fallback. See [authoring](AUDIO_AUTHORING.md), [playback](AUDIO_PLAYBACK.md) and [environment](AUDIO_ENVIRONMENT.md).

Co-op #198 is an isolated historical v0.8.128 roster prototype with no network transport or current main integration. Its assumptions must be reconciled with modern combat, pets, controls, lifecycle, saves and offline packaging after the break; there is no automatic cherry-pick.

Normal future release gates above remain intact. The published snapshot's explicit limited-test exceptions are recorded in [the release handoff](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md); those exceptions do not certify a complete current build or authorize another release. Development remains paused under [current state](DEVELOPMENT_STATE.md). Dated module rollouts and engineering evidence are preserved in [documentation history](PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md).
