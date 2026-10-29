# Runtime architecture — current system map

**So I Became the Dark Lord's Problem** · Current source and publication checked at `main@7d4d8fa2` on **28 October 2026** · Playable `0.9.1+snapshot.dev.210`.

**Purpose:** Help an owner, contributor or AI agent find the *actual owning code*, understand how systems interact, and make an approved change without creating a second game state, bypassing save compatibility or modifying gameplay from a rendering module. This document describes current source boundaries; it is **not** an authorization to implement or merge anything.

**Evidence limits:** The file locations and major boundaries were cross-checked against the published source, including the main gameplay, combat, persistence, graphics, audio and build owners. Selected numbers come from source/manifests; the older full Phase 4 integration inspection is historical evidence, **not** a claim that every internal function, historical balance number, full campaign, browser or physical-device behavior was re-tested today. For exact published build and pending acceptance, use [Development state](DEVELOPMENT_STATE.md); for permission and testing gates use [AGENTS.md](../AGENTS.md).

## The architecture in one minute

The game is a **single, multi-file web application**: the browser shell collects player input and manages menus; one shared **`Campaign`** instance owns gameplay state; separate domain modules extend its behavior; rendering and audio observe the resulting state/events. The service worker caches the installable game for offline play. Desktop/Chromebook and phone use the **same simulation** with different control layouts.

```text
Player input (keyboard, mouse, touch)
             |
 app.js + input.js + platform.js     <- menus, screen and lifecycle
             |
        ONE Campaign
 engine.js + domain modules         <- authoritative world / combat / companions
             |
        /-----------+-------------\
  snapshots / saves  |             |
 save.js / persistence.js   renderers / audio.js
                      (observe state, paint or play)
             |
 scripts/site-assets.cjs + scripts/build.cjs
        ordered files and offline/PWA package
```

**Critical invariants:** No second campaign store; no browser storage inside game-domain owners; no rendering or audio mutation of combat damage, collision or saved state; keep stable IDs and v4 saves. The public `Campaign` API is intentionally shared even where internally coupled. A module comment saying a formerly dormant stage is unregistered can be obsolete; check the real script graph and activation code.

## Find the owning system first

| You want to change… | Start with these source owners | Why it matters |
| --- | --- | --- |
| World layout, roads, doors, enemy homes | [world.js](../src/prototype/world.js), [data.js](../src/prototype/data.js), [fortifications.js](../src/prototype/fortifications.js) | Authored locations and enemy placement should not be redrawn as fake gameplay geometry. |
| Player travel, collision, line of sight | [navigation.js](../src/prototype/navigation.js), [input.js](../src/prototype/input.js) | Navigation decides reachable world positions, while the shell interprets an input. |
| Enemy AI, encounters, progression facts | [engine.js](../src/prototype/engine.js), [rules.js](../src/prototype/rules.js), [progression.js](../src/prototype/progression.js) | The campaign and rules own outcomes; visuals only reflect them. |
| Hero and boss combat | [hero-combat.js](../src/prototype/hero-combat.js), [combat.js](../src/prototype/combat.js), [boss-combat.js](../src/prototype/boss-combat.js) | One real resolver owns damage, timings, targeting and geometry. |
| Companions, Charmed roster, TRUE pets | [party.js](../src/prototype/party.js), [party-pets.js](../src/prototype/party-pets.js), [progression.js](../src/prototype/progression.js) | All companion types share the existing roster/save lifecycle. |
| Crowns, Treasuries, resource expeditions | [economy.js](../src/prototype/economy.js), [treasury.js](../src/prototype/treasury.js), [expeditions.js](../src/prototype/expeditions.js) | Money and regional recovery are not competing wallets. |
| Save/import and local browser storage | [save.js](../src/prototype/save.js), [persistence.js](../src/prototype/persistence.js) | Schema validation and storage/writer ownership are separate. |
| Menus, controls, localization, devices | [menus.js](../src/prototype/menus.js), [app.js](../src/prototype/app.js), [platform.js](../src/prototype/platform.js), [input.js](../src/prototype/input.js) | Avoid duplicate menu services or a second mobile game. |
| Canvas art and optional Pixi | [renderer.js](../src/prototype/renderer.js), [visuals.js](../src/prototype/visuals.js), [pixi-experimental.js](../src/prototype/pixi-experimental.js) | Keep simulation unchanged and Canvas as the safe fallback. |
| Music, ambience and effects | [audio.js](../src/prototype/audio.js), [audio-score.js](../src/prototype/audio-score.js), [audio-recordings.js](../src/prototype/audio-recordings.js) | Choose sounds from game context; playback must not own gameplay. |
| Frame pacing and performance diagnostics | [runtime.js](../src/prototype/runtime.js), [app.js](../src/prototype/app.js) | Draw cadence, simulation time and real display FPS are not equivalent. |
| Packaged assets, offline cache, deploy | [site-assets.cjs](../scripts/site-assets.cjs), [build.cjs](../scripts/build.cjs), [focused CI](../.github/workflows/focused-deploy.yml) | Use one reproducible source-of-truth graph, not hand-edited generated output. |

## Source modules — detailed responsibilities

The table below is intentionally **current ownership reference**, rather than an old PR-by-PR history. It retains the technical responsibilities that were useful in the previous architecture guide. When changing a module, confirm its actual exports and dependencies at the current branch head.

| Module | Responsibility |
| --- | --- |
| `data.js` / `rules.js` | Approved content and authoritative live balance (`rules.balance`), combat/support and authored geometry tables |
| `field-onboarding.js` | Saved opening-field hero-first admission, silent level-2 Thornfang/Mira arrival and physical companion-triggered Thornfang withdrawal; native combat/path/reset owners resolve admitted behavior |
| `world.js` / `greenwood.js` | Region generation and world migrations; the Greenwood owner installs authored parcels plus independent one-time geometry and scenery revisions on the same Campaign |
| `fortifications.js` | Authored defended footprints, position-derived enemy bonuses and enemy-only wall/low-cover shot permissions; transient geometry cache |
| `navigation.js` | Collision, line of sight, route solving, movement/following, fast-reject obstacle checks and bounded opt-in crowd diagnostics |
| `engine.js` | Authoritative Campaign state, simulation clock, enemy AI, encounter population, death/succession and quest orchestration |
| `hero-combat.js` | Paladin, Mage, Ranger **and Rogue** skill/charge/combat dispatch on the shared Campaign; some pre-Rogue comments still name only the older three-class generic branch. Legacy mana policy remains dormant. |
| `boss-combat.js` | Boss attack selection/sequences, geometry/resolution/motion and summons; reused captain/night attack primitives |
| `combat.js` | Shared targeting, actual HP damage, status, segment geometry, projectiles and hazards (historical mana drain logic is dormant) |
| `party-pets.js` | Pet specialization on the same recruited roster and shared lifecycle |
| `hero-presentation.js` / `audio-hero.js` | Observation-only hero skill drawings and original foley |
| `critical-executions.js` / `critical-levels.js` | Separate party/world probability resolvers and authored **effect intensity**; neither alone activates a playable campaign |
| `critical-party-native.js` / `critical-world-native.js` | Native actor-release critical receipts and separate seeded streams; **app.js explicitly attaches both** on playable/restored campaigns. Earlier `critical-party-integration.js` prototype is not shipped |
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
| `renderer.js` / `ground-cache.js` | Canvas 2D world projection/draw order, viewport culling, transient effects, fallback artwork, Canvas combat-cue overlay and **one bounded static outdoor ground window**; neither owns simulation |
| `visuals.js` / `combat-visuals.js` | Canonical procedural drawings, terrain, architecture and combat cues |
| `sprite-format.js` / `sprites.js` | Shared static/variant/clip schema, bounded content-aware lazy loading, paused presentation clock, faithful sprite translation and procedural fallback |
| `audio.js` / `audio-catalog.js` | Public audio facade and current compositions/event catalog |
| `pixi-experimental.js` / `tools/webgl-pilot/*` | **Optional experimental** PixiJS WebGL2 world layer, preparation and graphics-switch safety; Canvas 2D remains default/fallback. Selected presentation parity improvements shipped in dev.209, not full device certification. |
| `material-contract.js` / `materials.js` | Manifest-driven optional world textures, deterministic compatibility/fallback and bounded decoded/presentation residency |
| `audio-score.js` | Source-derived score cue selection, contextual observation, scheduling and transitions; the environment/recordings owners handle their independent playback. |
| `audio-runtime.js` / `audio-effects.js` | Context lifecycle, mixer/source cleanup/bounds, diagnostics and contextual effect recipes |
| `runtime.js` | Bounded stage/frame samples, two Auto/manual FPS policies, adaptive draw skips, critical emergency holds, resolution control and idle redraw scheduling |
| `skill-reference.js` | Read-only class skill descriptions, current effect figures and next-rank comparisons; native hero combat and rules remain authoritative |
| `menus.js` | Specialist, barracks, party, inventory and training menu definitions/actions; current game and shell callbacks injected |
| `app.js` | Shell lifecycle, global/settings menus, map presentation, keyboard/touch coordination, charge input, frame scheduling and app updates |

**How domain modules work:** World, navigation, progression, save, hero/boss/shared combat, party, economy and rewards **install method descriptors on the shared `Campaign`** before the constructor is exported. Modules receive the constructor and explicit dependencies rather than importing `engine.js` or browser storage. `Campaign.classes`, discipline profiles, live rules and migration maps remain compatible interfaces, **not** license to make parallel balance tables. The existing game and tests depend on those descriptors.

## Simulation, combat and cross-system ownership

`engine.js` remains the authoritative model for world time, enemies, encounters, quest progress, death/Succession and overall campaign state. `rules.js` holds live balance and combat-geometry figures; `progression.js` owns learned skill/discipline/instructor/equipment growth; `hero-combat.js` dispatches native moves for **Paladin, Mage, Ranger and Rogue**. Some old `hero-combat.js` header wording refers to the three-class generic branch; it is **not** proof the playable Rogue is missing.

`combat.js` resolves real HP damage, status, projectiles and collision of attacks. `boss-combat.js` owns common boss attack resolution/summons; specialized files such as `cindermaw-combat.js` and `dreadmaw-combat.js` extend that existing domain rather than building rival enemies. Cindermaw retains the approved ministerial encounter rules and the same physical Vera/guard actors; Dreadmaw retains the agricultural attack and Treasury navigation ownership. Timers, warnings, cleanup and tuning must remain in their real owners and v4-compatible state. Their detailed dated design decisions belong in [Decisions](DECISIONS.md) and their feature contracts, not a new architecture rule hidden in a history note.

**Critical Executions/Codices are live:** `critical-executions.js`, `critical-levels.js`, `critical-party-native.js` and `critical-world-native.js` are registered in the game graph; `app.js` explicitly activates the native sessions when playing/restoring a campaign. An older `critical-party-integration.js` prototype and stale 'dormant' header comments do not override actual registration. The five Codices and their v4 fields use the existing progression/save owners; extra draft tests do not imply absent gameplay.

**Companions and economy:** `party.js` owns normal and Charmed companion roster, roles, targeting doctrine, Recall, labor and Ranger support; `party-pets.js` adds the eleven TRUE-boss pet specializations **inside that same roster**. `economy.js` owns crowns and purchase/cost policy, `treasury.js` regional death-loss balances/collection, `expeditions.js` Full Barracks resource missions, and `rewards.js` payouts. New features should join those owners rather than invent separate stores or UI-only calculations. Actual tuning and supersessions belong in the subject-grouped [Gameplay Decisions](DECISIONS.md).

## World, navigation and authored geography

`world.js` and the authored content tables own zones, settlements, dungeon layouts, transport sites and safe migration of saved positions. `fortifications.js` resolves defenses using their actual footprints. `navigation.js` provides shared collision, line of sight, route planning, movement/following and optional bounded crowd measurements. `app.js` can draw a map or accept a destination, but does not create a second saved regional model.

**Guardrail:** When changing arrival locations, structures or monsters, verify walkable space, safe roads, encounter density and save migration. Drawing a route or moving a sprite does not make a blocked world path traversable. Source-specific lore, transport positions and Monster Fort decisions are in [Gameplay Decisions](DECISIONS.md).

## Saves, browser lifecycle and device presentation

`save.js` owns **version-4 (v4) campaign snapshot validation, repair, restore and legacy version-2 migration**. `persistence.js` owns browser storage, writer arbitration, backups and bounded recovery checkpoints (one per mode, while historical three-entry bundles remain readable and primary writes take precedence under quota pressure). The browser shell in `app.js` handles title, New Game/Continue, save/return lifecycle, restart and player-triggered imports. Never introduce a second save owner, silently rename existing keys or equate an offline-cache update with a new save schema. Portable exports are **local backups**, not cloud synchronization.

The `index.html`, `prototype.html` and `phone.html` entries are generated from `templates/game.html` and share script graph and compatible local state. `styles/prototype.css` provides shared styling; `desktop.css` and `phone.css` scope their screen-specific layouts. Screen mode follows device capabilities plus an explicit player choice/`?experience=desktop|phone` override, **not window width alone**. A narrow desktop can remain desktop; a phone presentation has touch controls. `input.js` owns persistent bindings and move requests, `platform.js` screen choice and device detection, `menus.js` the injected specialist/barracks/inventory catalog. Delayed menu actions obtain the current game from the injected accessor instead of holding an obsolete campaign reference.

**Player-visible diagnostics:** `Game and settings → Screen and performance → Export playtest report` creates a **local diagnostic JSON**, different from `Save and game management → Save backups → Export save`. Spanish labels are documented in [Guía en español](../GUIA_EN_ESPANOL.md). No assumption of remote telemetry or device certification follows from exporting a report.

## Rendering and performance: presentation is not the simulation

**Canvas 2D is the default and reliable fallback.** `renderer.js` projects the world and handles layering/culling; `visuals.js` and `combat-visuals.js` own procedural identities and truthful warnings; `ground-cache.js` handles a static outdoor ground window with a **64 MiB** bound, not mutable actors or boss telegraphs. The sprite loader/format owners keep optional art within a **256 MiB decoded sprite ceiling**. These are resource *limits*, not promises of FPS or memory use. The current published manifest contains **33 sprite identities**; sprite approvals and original-master rules are governed by the [sprite workflow](DESIGN_TO_SPRITE_WORKFLOW.md).

The optional `pixi-experimental.js` WebGL2 world path leaves the native Canvas cue overlay and game rules intact, provides a **15-second Keep/Revert** trial, and returns to Canvas if needed. Published [#553](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/553) avoids wiping unchanged-size Canvas backing pixels, and [#554](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/554) repairs selected Pixi crown loot, facing and paused overlays in `dev.209`. **Pixi remains experimental:** no hardware graduation, sustained FPS win, full visual equivalence or all-device adoption is certified by those focused checks.

`runtime.js` bounds frame-stage measurements, adaptive draw skipping and screen-resolution policies; `app.js` coordinates actual simulation vs redraw. The emergency frame-skip mode can **suspend simulation** during sustained failure: never describe it as merely cosmetic. Profiling names describe different quantities: callback opportunities, issued world draws, CPU renderer call time and actual displayed frames are not interchangeable. Pixi GPU completion/compositor latency is **not** measured by synchronous `pixiMs`. Frame/crowd reports are bounded local observations, not verified device FPS improvements. For the older detailed thresholds, methodology and historical runs, see [Performance evidence](PERFORMANCE_EVIDENCE_REGISTER_20261024.md) rather than treating a dev.169 numeric baseline as timeless.

## Audio, composition and recording ownership

`audio.js` is the public facade. `audio-runtime.js` manages Web Audio context/startup, recoverability, buses and bounded mixing; `audio-score.js` chooses contextual music from Campaign state; `audio-recordings.js` handles recorded-file decoding/transport; `audio-environment.js` runs separate environmental beds; and `audio-effects.js` / `audio-catalog.js` provide contextual event sound. Procedural Web Audio remains a fallback when appropriate, not a second gameplay authority.

At the published main source checkpoint, [the audio manifest](../assets/audio/manifest.json) registers **127 sounds: 83 music tracks, 14 environmental beds, and 30 recorded effects**. Music composition source lives in [score-book.json](../tools/audio/score-book.json), and sound recipes in their corresponding environment/effect books. For artistic decisions use [Soundtrack identity](AUDIO_SOUND_PASS.md); for implementation use [Audio production](AUDIO_PLAYBACK.md) and [authoring](AUDIO_AUTHORING.md).

The standalone listening room is **separate from campaign saves**. The redesigned controls and catalog in [merged PR #563](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/563) are published as `dev.210` by [Pages run #40769070733](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40769070733); Chromium desktop/phone and offline acceptance passed in [run #40761403220](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40761403220). Real phone/Chromebook hardware listening remains unverified. No documentation revision changes a recording.

## Build, offline installation, checks and release authority

`scripts/site-assets.cjs` is the authoritative ordered game-script and public-asset inventory. `scripts/build.cjs` generates the HTML entries, build information, versioned service worker and offline package; `package.json`, lockfile, generated `build-info.js` and the service-worker cache version must stay coherent **when a future runtime release is authorized**. Hand-editing a generated file without its source is not a complete build change. The cache is separate from local campaign saves; registered critical assets have validation/failure behavior during installation.

**Normal PR/main:** [focused-deploy.yml](../.github/workflows/focused-deploy.yml) uses the [focused test selector](../.github/scripts/focused-ci.cjs) and reproducible build check. **Successful main pushes can publish Pages.** [pages.yml](../.github/workflows/pages.yml) is owner-opt-in for comprehensive campaign/Chromium/WebKit tests. A green PR does not mean merged or published; Pages success does not certify installed phone/Chromebook refresh or gameplay quality. Follow [current owner policy](../AGENTS.md) and [engineering change workflow](MECHANIC_DEVELOPMENT.md).

**Integration resolution, 28 October:** Published `dev.209` from #553/#554 is preserved as the previous verified Pages receipt. [PR #563](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/563) is merged and published as a distinct `dev.210` source/cache version, and integrates the merged [#564](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/564) documentation gate. The final merge/publishing run and device installation are separate evidence, recorded in [Development state](DEVELOPMENT_STATE.md).

## Known coupling and change checklist

The engine is **modular but not fully isolated**. `engine.js` still owns portions of enemy AI, quests, death and encounter orchestration; `app.js` still coordinates settings, presentation and frame/input lifecycle. Domain methods intentionally call the common `Campaign` API via `this`, and rendering observes that same instance. This is the existing architectural boundary, not proof every large method is independently unit-testable. Further extraction should follow real dependencies and regression evidence; don't create abstract subsystems merely to make this diagram look cleaner.

For a new change, confirm **(1)** owner approval and accepted design, **(2)** the real source/asset owner and published-vs-draft state, **(3)** the intended normal action and important failures, **(4)** applicable lifecycle/save/device boundaries, **(5)** the original focused regressions and reproducible build, **(6)** documentation and a recoverable PR handoff. Do not automatically launch a broad test matrix, create a second feature PR, change unrelated gameplay, or infer release authorization.

## Historical audits and deeper source evidence

The [former architecture guide at commit f1d23ac](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/f1d23acbf8ff0d11670050cc8c9b11171301ab27/docs/ARCHITECTURE.md) retains its complete **27 October Phase 4 dev.205 integration audit**, source/PR receipts, dated performance discussion and old detailed coupling notes. Earlier [housekeeping audit](HOUSEKEEPING_AUDIT.md), [performance history](PERFORMANCE_EVIDENCE_REGISTER_20261024.md) and [development history](PRE_BREAK_DOCUMENTATION_HISTORY_20261019.md) remain available. Those historical figures and one-time permissions are **not** extra current instructions or release gates. For the live release checkpoint use [Development state](DEVELOPMENT_STATE.md).


## Bounded route planning (dev.218 integration of PR #584)

Normal actor collision and line of sight remain authoritative in `navigation.js`. Three live planning paths now use a separate, resumable workload controller: companion following (eight-neighbor A*), worker delivery-site comparisons (the same A*), and tactical Rogue-enemy support regroup (four-neighbor BFS). Existing synchronous `companionRoute()` and `route()` APIs are kept for direct callers and world-generation geometry.

The shared controller in `navigation.js::advanceBudgetedRoute` counts nested `blocked()` terrain probes and expanded grid nodes while advancing generator search state across simulation updates. Its allowance is per campaign and tick: 768 probes/240 nodes across all planning consumers, at most 512 probes/120 nodes per call (provisional and subject to audit). This configuration lives in navigation.js, not shared balance rules. Delivery sites are considered by straight-line lower bound and eliminated only when no possible route could outperform a fully validated result. The state is transient and keyed by the real actor/zone/target through existing navigation trips and the party/AI transient maps. A pending plan is not a failed route. Movement keeps native `move()` collision; no change is made to target acquisition, projectile collision, authoritative route search contracts, road generation or v4 save fields.

**Integration status:** the source and matched native audit came from PR #584, whose final-head focused checks passed. This dev.218 port additionally preserves current dev.217 healing, HUD and combat changes and requires its own focused CI and publication evidence. Do not infer device FPS gains.

**Lifecycle:** Explicit gathering cancellation or reassignment clears pending delivery ranking; Recall preserves the existing worker order. Critical worker withdrawal records the interrupted delivery site even when survival handling runs before ordinary labor, and per-enemy tactical route plans are dropped on encounter stop/reset. Intermediate search generators and shared counters are transient, not v4 snapshot fields. Full-path validation and actual movement collision remain required.


## Ordinary enemy pursuit — dev.224 engineering candidate

The combat hotpath audit [#600](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/600) found an additional route-search hotspot outside dev.218: ordinary enemy `navigation.js::follow()` started full synchronous `route()` BFS when native movement was blocked. In 24 live combat simulation updates with 24 enemies and a real wall, this cost **59,496 `blocked()` probes in 24 direct route calls** and contributed to a **4,447 terrain-probe peak per update**. These counts are exact native test-fixture measurements, not physical-device FPS.

The isolated dev.224 candidate retains synchronous `route()` for direct/road and non-enemy users, and preserves the already published companion/critical/tactical boundaries. Ordinary engaged current-zone enemies (excluding bosses, captains, scripted patrols, and return-home states) instead advance a resumable four-neighbor pursuit BFS through a separately accounted 1,024 native terrain-probe/320-node per-tick pursuit budget (512 probes/120 nodes per advance). Companion, delivery and tactical support retain their original separate shared 768-probe/240-node pool. A pending frontier never grants movement or declares a route blocked. The two planning pools are separate because the first all-crowd acceptance test failed: all 24 enemies moved in the original six-second obstructed battle, but only 16 did with one shared pool; see draft PR #610 history. The second 24-enemy gate passed with the isolated pool: all 24 moved, and average travel was 203.19 units versus the original 193.38. Average closure was 132.65 rather than 145.56 units, and first contact occurred at update 31 rather than 29 (0.10 simulated seconds later). The target and origin are frozen until a full path exists, while the actor's current position and first leg are revalidated using the original native collision checks. Saved enemy pursuit, leash, aggression, disengage, projectile contact, authored road generation, and v4 saves are not given new authority. Pending frontiers are transient weak-keyed runtime state.

**Matched CI audit (24 native combat updates):** in the 24-enemy obstructed scenario, original dev.219 source reached 82,280 native `blocked()` probes with a 4,447 single-tick peak; the release-gated dev.224 candidate recorded **47,644 total and 2,338 peak** (approximately 42% fewer total and 47% fewer peak probes). In the 24-shot-plus-obstacle scene, peak was **4,475 → 2,429**. Open-field 24-enemy peak was 1,696 → 1,717, a small overhead, not a uniform speedup. The earlier single-pool prototype achieved lower peaks but failed 24-enemy responsiveness; never use its 1,749 figure as the passing release candidate.

**Matched six-second responsiveness:** eight ordinary enemies following the real hero around a wall all moved, with average **178.2 units** traveled and **170.3 units** closing distance on **both** audited baseline and candidate. Peak native terrain probes for the eight-enemy wall were **2,958 → 1,526**, while accumulated probes were **46,008 → 47,234** (about 3% more over this longer window). In the passing 24-enemy six-second wall test, total probes were **136,610 → 155,478** (about 14% more) while peak fell **4,447 → 2,338**. Thus the win is reduced work *per simulation update*, not fewer total searches in every scene. CI timing and probe counts are not phone FPS. The original no-route retry cadence remains unchanged; only stale first legs can prompt a shorter retry. Current test code also verifies unchanged native path waypoints and excludes bosses, captains, scripted returns and idle actors from the new planner.

**Status:** source candidate on PR #610, not merged, published or device-verified at the time of this documentation update. The full-crowd test and corresponding focused build passed on a preceding head, and the final encounter-reset test needs its own exact-head passing run before merge. No device FPS, all-boss or comprehensive browser certification is claimed.


## Dev.225 candidate — allocation-free tactical support assessments

After the native [four-domain combat audit #612](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/612), `tacticalPresentOpponents()` and `tacticalLocalSupport()` count directly instead of creating temporary filtered rosters, and `tacticalRogueOutnumbered()` reuses its first opponent-count value. Predicates and their order stay unchanged, without caching across actor health, companion orders, Recall or regroup updates. Worst-case all-pairs support assessment complexity remains quadratic: this is a low-risk allocation and duplicate-work correction, **not a promised game FPS uplift**. Exact live 8/24/48-enemy tick-and-saved-state parity, existing companion-mastery regressions and final-head CI are merge gates; physical-device measurements follow deployment.


## Thorn's introductory retreat — dev.226 optimization candidate

The opening hero-first fight's companion interruption computes distances from the hero and live allies to each established Thorn patrol leg. Previously it tested `this.route(thorn, p)` synchronously for **every** eligible leg, then sorted by distance. The audit [#612](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/612) observed a 19,340-terrain-probe route inside a 19,824-probe combat update. The optimized ordering sorts all admissible legs by the **same** farthest-distance, then original leg-index tie-breaker **before** `route()`, and exits at the first native reachable choice. In a static snapshot, this preserves the exact winner while avoiding any lower-priority search once it has found one; native terrain collision and original synchronous route implementation remain authoritative. If every high-priority destination is unreachable, the remaining synchronous searches are still potentially expensive: this change does **not** impose a hard per-update budget. Do not silently move the script to the ordinary enemy-pursuit planner because that would introduce delayed intro decisions and change companion-hit/hero-first encounter behavior. Separate #615 retains any residual worst-case boss/captain work.

The focused regression must compare the original algorithm with the candidate on the same native obstruction layouts, including saved campaign state, retreat choice, no-route outcome, route counts and actual blocked-terrain probes. Device FPS and Pages publication remain separate from CI.


## PixiJS JavaScript stage timings — dev.227 developer diagnostic candidate

The PixiJS world renderer runs `syncViewport`, `syncResolution`, `syncBackground`, `actorFrame`, `syncAtmosphere` and `scene.draw` in order on each permitted draw. Its source-level performance audit was previously unable to separate these synchronous costs. An isolated developer-only observer now times each stage on every **12th** developer-mode draw and retains at most **120** sampled frames in instance-private, unsaved memory. Existing `status().drawCpuProfile` exposes p50/p95 JS wall-clock durations for the six stages and identifies the sample count; ordinary gameplay does not create timestamps or recording closures. The Pixi canvas and Canvas combat overlay must still perform their original drawing and warning routines. Changing the debug report does not prove any FPS improvement or GPU latency, because `scene.draw()` returning is only JavaScript command submission. Browser main-thread traces and physical-device FPS/context-loss tests in [issue #481](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/481) remain the authority for renderer changes. The existing `tests/pixi-fidelity.test.cjs` mock verifies debug gating, per-stage labels, fixed history retention and normal-mode isolation, but cannot measure real GPU time.
