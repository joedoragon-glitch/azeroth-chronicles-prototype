# Pre-break documentation history — 19 October 2026

Historical snapshots from PR #319 checkpoint `ff67135d0de07e7da76f882a3287294edfef7a73`. Their candidate statuses, authorizations, counts and next actions apply only to the recorded dates. Use [current development state](DEVELOPMENT_STATE.md) for present instructions. The three original bodies below are preserved verbatim; Git retains their original file identities and bytes.

---

## Preserved file: `docs/DEVELOPMENT_STATE.md`

> **CURRENT STATUS — 18 October 2026 (supersedes dated sections below):** Community Snapshot PRs #300/#308/#313 and subsequent #315–#318 are MERGED and the latest published gameplay build is `0.9.1+snapshot.dev.78`; `main` head was `57453c4651366a6debbcae454c70af3115e8ac2e`. Development is PAUSED; no new release authorized. Historical references below to active PR #313, unfinished merge or 16-Oct frozen candidates are not present-tense instructions. For the next one-PR staging boundary, pending sprite/co-op/process reconciliation and exact limits, use [NEXT_UPDATE_RECONCILIATION_20261018.md](NEXT_UPDATE_RECONCILIATION_20261018.md); published evidence is in [COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md](COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md).

> **16 October 2026 · authoritative current continuation:** [Draft PR #313](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/313) is the single implementation workstream for Community Snapshot A01–A07, all ten PR #311 fixes and Issue #312. Frozen runtime: `9dcb09167849865c6c838d16305ff76e872c7d58`. Read [PR313_INTEGRATED_SOURCE_AUDIT_20261016.md](PR313_INTEGRATED_SOURCE_AUDIT_20261016.md), the current PR resume comment and `tools/community-snapshot/pt312-presentation-overlay.json` before resuming. Source implementation/review is complete; tests, builds, browsers, CI, merge and deploy remain paused pending explicit owner authorization. Earlier branch/status entries below are historical and do not authorize a competing workstream or execution.

# Current development state and v0.9 readiness


## PR #313 authorized integrated audit · 16 October 2026

The owner has explicitly authorized all tests, workflow repairs and merge after proper audit. Earlier source-only/approval restrictions below are historical. Work continues in the existing PR #313; no separate PR #311 merge. The current validation ledger is [PR313_VALIDATION_20261016.md](PR313_VALIDATION_20261016.md). The source includes the owner's personalization, specialist/boss identity, learned-only journal, aura, map/lore/readability and roaming-interception corrections. Full regression, browser, balance and native art/audio evidence is being completed; this paragraph does not certify release or claim merge.

## Active combined source integration — 16 October 2026

**Community Snapshot + PR #311 source-integrated, still entirely untested.** Branch `integration/community-snapshot-311-20261016`; first combined checkpoint `e513ea7fb9bfa21d5e102177bb3eedd3954e6cc4`. The independent Community checkpoint and draft #311 head remain recoverable. Source-level compatibility and the pet defensive Recall issue are documented in [the combined integration audit](COMMUNITY_SNAPSHOT_PR311_INTEGRATION_AUDIT_20261016.md). No tests, builds, browser sessions, simulations, CI, merge or deployment. Issue #312's full 18-item handoff is now available. Work must implement its still-open PT items in this **same** branch and draft PR, earn a new complete source audit, and obtain the owner's explicit permission before the single validation cycle. See [Work handoff](WORK_MODE_SINGLE_PR_HANDOFF_20261016.md).

## Previous Community-only source audit · 16 October 2026

**Follow-up source audit passes; validation awaits explicit owner authorization.** All seven [failed-audit](COMMUNITY_SNAPSHOT_EXECUTION_AUDIT_20261016.md) findings are addressed in source. [The second audit](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md) identifies frozen runtime `754e72e9cb5819bb815fde97488d44275e870453`, final acceptance-fixture corrections, immutable design references and remaining uncertainty. The final audit checkpoint changes no runtime from that commit. No tests, build, browser, simulation, benchmark, CI, PR, merge or deployment has run in this phase. Use the feature branch's final handoff/head for authorization.

PR #308 merged as `6bc27be31792b1c38147d61e98ceed6acf3e2560`. The next consolidated feature is on `feature/community-snapshot-post308-20261016`, with its recoverable checkpoints and honest untested status in [the implementation record](COMMUNITY_SNAPSHOT_IMPLEMENTATION_20261016.md). No new release, build, browser validation, test run, CI workflow or deployment has been initiated during this source phase. The owner must authorize [the combined final validation](COMMUNITY_SNAPSHOT_VALIDATION_20261016.md); older readiness/release notes below are retained history.

## v0.9.0 candidate preparation · 10 October 2026

**Candidate only; not published or accepted.** This addendum supersedes the old active-work labels below. The earlier snapshot is retained as dated history.

- Last independently verified production at preparation: **v0.8.138**, commit `6c2381b34ce63fb935936a4e69ec404996f7765a`, tree `d5616558097655755e581d75f4707a1571b03c24`. Combined #226 integrates performance, Auto/30/60 render scheduling and development/CI workflow changes. Full identical-tree [run 38087706102](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38087706102) and merged-main [publication 38091031125](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38091031125) passed. Subsequent source versions require their own evidence.
- Combat conditions #210 and item/equipment/collision QA #216 are integrated. #211/#212 are superseded. #223/#224/#225 were combined in #226 rather than separately merged. Old active-candidate references below are historical.
- The #214 boss decision is settled: preserve current Pounce recovery and Wall Rush opening; change only the inaccurate descriptions. This candidate includes #227 source through `3e2b3136de8f8b9ce5da7caff4afa365f60d6935`. Its parent release workstream owns any separate v0.8.139 publication. Current acceptance remains tracked in [#213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213); do not infer live deployment from this branch.
- This candidate changes release version/cache metadata and documentation. It adds no mechanics, art or save schema changes beyond the already scoped #227 descriptions. Core save keys, authored geometry, combat numbers and approved presentation are retained.
- Joel reports ordinary play working so far and uninterrupted save retention across major updates throughout development, with no forced restart from corruption. This is positive user-reported longitudinal evidence. It is not an independently tested historical export/import round trip, a full campaign completion, or physical offline/performance measurement.
- Complete natural campaign/late-game acceptance, a genuine historical export/import cycle and the remaining physical device/PWA checks are open. Joel has not completed the game and is not being assigned code-level verification. These criteria need evidence or explicit release-scope disposition before the beta is declared accepted; this preparation does not waive them.
- #217 sprites remain paused and excluded. #132 art recovery and #197/#198 co-op remain deferred. Original branches, artwork and rollback references remain protected.

See [v0.9 release notes, gate and rollback](V09_RELEASE_NOTES.md). The [10 October evidence branch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/audit/v09-readiness-20261010) preserves independent live reads, 28 named boss scenarios, description-only semantic comparisons and six bounded early-progression action pilots. The pilots are not full campaign certification; three completed the early-route save check and three stopped after a death.

## Preserved earlier status snapshot

This is a dated repository status snapshot for the v0.9 stabilization work. [Roadmap #192](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/192) is the cross-workstream navigation record; [#160](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/160) owns asset-by-asset production. Earlier chronological notes are [archived intact](DEVELOPMENT_HISTORY_THROUGH_V08133.md).

Snapshot refreshed **2026-10-10T04:15:13+00:00**. The baseline and work dispositions below describe that audit, not live branch state. Before resuming work, use current `origin/main`, `package.json`, open PRs and their latest runs; #192 and #160 retain the workstream handoffs. Historical candidate labels below are not instructions to replay or merge them.

## Baseline and release evidence

Source baseline at this audit: **v0.8.135**, released runtime at `170adbf708ac1ea3b26e57621d0089f182932270`, from merged nature adaptation [#208](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/208). Main subsequently advanced to the deployment-evidence-only commit `1e232c71a9e63f87efe152868432bbfcc4a39ffd`. It includes the released road and Abyss work. Exact-head PR run 38020278879 passed; main release [run 38021457158](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38021457158) completed successfully in main-test, phone-webkit and deploy, including the exact published build and live desktop/phone, actor/road and quest/Keeper gates. The #160 handoff and retained journal record the independent 23-output nature hash/dimension/alpha audit and 276 browser scenes. All 23 existing nature identities are deployed; no new artwork was generated. The other eight active adaptations and broader missing catalog remain open under #160.

Independently verified published baseline: **v0.8.135**, `170adbf708ac1ea3b26e57621d0089f182932270`, from #208 and run 38021457158. The preserved road checkpoint is **v0.8.134**, `54e578d820e6c18234c70f57516d22a739438e4e`, from merged road overhaul [#204](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/204). Its main release [run 38019846959](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38019846959) also completed successfully in all three jobs and exact published-build/live gates. Both technical releases are complete without certifying every human regional/device acceptance criterion.

Preserved prior production checkpoint: **v0.8.133**, `5aa50dda1785397d2d1dd819da126b762e775ecc`, Abyss integration [#207](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/207), [run 38018534859](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38018534859). Main-test, phone-webkit and deploy all succeeded, including exact published build, live desktop/phone, actor/road and Keeper checks. Abyss technical integration is complete; human acceptance remains open. #204 preserves this work and the earlier v0.8.132 gameplay fixes.

This maintenance pass is documentation/backlog reconciliation. It does not certify a completed v0.9 release. Later commits and runs supersede the snapshot only when independently verified.

## Current playable contracts

- Multi-file GitHub Pages/PWA application, shared Campaign engine, distinct desktop and phone presentation; local saves and no game backend. Existing v4 keys and v2 backup import remain compatible.
- Camera defaults to the selected 150%; 100% and 175% remain optional per screen. Supported phone space begins at 375x800 CSS pixels or its rotation. Browser emulation does not certify real-device comfort or performance.
- Cooldown-only combat is authoritative: no live MP spending/HUD, five Cooldown Training ranks reduce cooldowns by 4% each, and approved actual-damage healing remains. MP fields and switchable historical logic are recovery data, not permission to restore an old MP economy. The quantitative audit recommends no retune.
- The main Story journal guides specialist rescues, onward transport, the Dark Lord, five TRUE guardians and completion. Local jobs remain on quest boards. Map navigation starts through explicit Navigate; Talents is directly available in Adventure. Single-player menus pause the simulation.
- Authored regional handoffs and the Abyss royal-flight canon remain authoritative. The purple dragon is the Dark Lord's personal mount, and the air force is unfinished. #207 restores one feeding/service safe lane and adds round-trip route regressions; it is not a new dungeon or flight system.
- Original-master Paladin/Goblin idles and Vale/Highlands roads shipped in #193. Baseline manifests contain **33 sprite identities and 7 materials**. The decoded sprite ceiling is **256 MiB**, separate from the 64 MiB outdoor-floor picture; both are bounded lazy caches, not guaranteed device allocations. Earlier 16 MiB or empty-manifest notes are historical.

## Work disposition and preservation

| Work | Disposition at audit | Next step |
| --- | --- | --- |
| #208 nature original density | Completed and independently verified published: 23 existing identities as v0.8.135, incorporating #204 | Preserve originals, journal and exact release evidence. The other eight active adaptations and missing catalog stay with #160. |
| #210 combat conditions and secondary effects | Active v0.8.136 candidate, opened after the initial backlog inventory; based on v0.8.135 | Its own implementation workstream must verify the current head and release. Preserve `audit/v09-combat-conditions-20261009`; housekeeping does not merge its gameplay changes. |
| #204 outdoor road infrastructure | Completed and independently verified published as v0.8.134 | Exact deployment/live checks passed. Automated coverage and screenshot review do not close all regional human acceptance. |
| #203 earlier town-planning draft | Superseded by #204; closed without merging obsolete runtime | Original branch/head retained as recovery. |
| #132 household/mine/flight art | Intentionally deferred integration, not obsolete | Preserve its five additional identities, untouched sources, revisions, reviews and branch. Recover a bounded asset batch against current main under #160. |
| #197 session timing; #198 cooperative roster | Intentionally deferred from this stabilization pass; #198 depends on #197 | Preserve both branches. No playable networking/Host/Join feature exists in current main. Their earlier authorizations are not revoked. |
| #145 old proportion/art branch | Superseded by #191 (proportions) and #193 (pilot art); closed | Original branch and all original artwork/history retained as a protected checkpoint. |
| #152 encounter experiment | Completed analysis handoff; closed, experimental harness intentionally unmerged | Branch/harness retained. #159 preserves encounter findings and #190 owns the current quantitative cooldown audit. |

#204 and #208 initially both used v0.8.134; they integrated serially. #204 merged first, and #208 adopted that main state and v0.8.135. Both workflow additions remain in the combined source. A previous head's green run is not evidence for a newer head; publication is a separate gate.

## v0.9 acceptance still to establish

1. Verify the exact combined stabilization commit through generated/asset checks, the full Node suite, relevant Chromium/WebKit device paths, Pages publication, published SHA and live smoke. Keep merged, published and human-tested states distinct.
2. Validate the Abyss campaign end to end: full-party handling, trap readability, Eren rescue, boss/TRUE/Awakening transitions, outward and return wing routes, and actual phone movement/interaction. Automated route and save regressions support but do not replace this human acceptance.
3. Continue observed regional playtesting in Greenwood, Marches, Highlands, Frontier and Crown: travel/departure identity, collision/road/entrance access, rescue/escort/quest progression, settlement life and encounter pacing. Record reproducible defects before changes; open lore choices remain open.
4. Complete the measured crowding/play-distance review required by WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md. The released size classifier alone is not a completed density audit; #204's street tests alone do not certify every visual footprint or encounter gap. Do not add enemies or expand maps to compensate for decoration without the required measurements.
5. Keep backlog classifications, recovery references and player instructions aligned with actual releases. Finish only verified redundant branch deletion; no branch-count target is a release criterion.

The remaining complete artwork catalog is explicitly **not a v0.9 release blocker** in #192. Co-op groundwork, new wrappers and unresolved optional lore are preserved separate workstreams; this cleanup makes no claim that they are complete or cancelled.

## Limits and recovery

Campaigns remain browser/device-local; there is no cloud sync or multiplayer backend. Real iOS gesture behavior, thumb reach, target Chromebook cadence, full human campaign progression and subjective visual/audio quality are not certified by CI. Export a save before clearing browser data. Keep historical MP fields, accepted sprite originals, animation dependencies and rollback history.

See [backlog audit and recovery inventory](BACKLOG_HOUSEKEEPING_20261010.md), [gameplay decisions](DECISIONS.md), [architecture](ARCHITECTURE.md), [regional handoffs](REGIONAL_HANDOFF_AUDIT.md) and [Abyss canon](ABYSS_AIR_SUPERIORITY_CANON.md). Historical handoffs are evidence of past work, not a current instruction to replay it.

---

## Preserved file: `docs/ARCHITECTURE.md`

> **Current architecture note — 18 October 2026:** The playable `0.9.1+snapshot.dev.78` Community Snapshot includes cooldown-only hero combat, eight per-class skills and charged forms, pet specialization alongside companions, and current five-region/throne systems. Some dated module descriptions below (including references to active hero mana costs and untested Community Snapshot pets) describe earlier development states; verify current code before making changes. Co-op #198 is an isolated `0.8.128` historical prototype, NOT active gameplay. See [NEXT_UPDATE_RECONCILIATION_20261018.md](NEXT_UPDATE_RECONCILIATION_20261018.md) for the reconciled post-snapshot state and remaining work. Historical technical evidence is retained as written.

# Runtime architecture

The browser is the current desktop playtest target, especially Chromebook keyboard/trackpad use. The phone target is an installable PWA with dedicated touch presentation. They share campaign logic and content, rather than keeping two copies of the game. A future desktop executable or native phone wrapper can host those same boundaries; no wrapper or engine migration is part of this housekeeping pass.

## Ownership

| Module | Responsibility |
| --- | --- |
| `data.js` / `rules.js` | Approved content and authoritative live balance (`rules.balance`), combat/support and authored geometry tables |
| `world.js` | Region generation, settlements, authored sites, interiors, occupation layouts and world migrations |
| `navigation.js` | Collision, line of sight, routing, movement and following |
| `engine.js` | Authoritative Campaign state, simulation clock, enemy AI, encounter population, death/succession and quest orchestration |
| `hero-combat.js` | Paladin, Mage and Ranger cooldown-based skills, charged forms and basic combos (legacy mana logic remains dormant) |
| `boss-combat.js` | Boss attack selection/sequences, geometry/resolution/motion and summons; reused captain/night attack primitives |
| `combat.js` | Shared targeting, actual HP damage, status, segment geometry, projectiles and hazards (historical mana drain logic is dormant) |
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
| `sprite-format.js` / `sprites.js` | Shared static/variant/clip schema, bounded content-aware lazy loading, paused presentation clock, faithful sprite translation and procedural fallback |
| `audio.js` / `audio-catalog.js` | Public audio facade and current compositions/event catalog |
| `audio-score.js` | Cue selection, contextual observation, score scheduling, fades and ambience |
| `audio-runtime.js` / `audio-effects.js` | Context lifecycle, mixer/source cleanup/bounds, diagnostics and contextual effect recipes |
| `runtime.js` | Bounded active-frame measurements and idle redraw scheduling |
| `menus.js` | Specialist, barracks, party, inventory and training menu definitions/actions; current game and shell callbacks injected |
| `app.js` | Shell lifecycle, global/settings menus, map presentation, keyboard/touch coordination, charge input, frame scheduling and app updates |

World, navigation, progression, save, shared combat, hero combat, boss combat, party, economy and rewards owners install method descriptors before Campaign is exported. Save also installs the existing static validate/restore/migrate APIs. The domain modules receive the Campaign constructor and explicit content/configuration dependencies; none imports engine.js or uses browser storage. They receive explicit content dependencies and have no browser dependency. This keeps the public Campaign API stable for saves, tests and existing callers. They do not introduce a second state store. Navigation's numerical rules are unchanged. `Campaign.classes`, `talentProfiles` and `talentMaxRanks` retain compatible references to rules balance tables. Legacy weapon/import maps are compatibility data, not duplicate live balance. Instructor skill ceilings derive from the authored curriculum. Existing combat/support tables remain in rules.js.

`menus.js` receives `getGame`, Campaign/content, action/open/close services, Recall, map and finale callbacks. It keeps helpers private and exposes catalog entry points, including the concise Hero skills and Combat conditions references. Delayed actions read `getGame()` at invocation so switching/reloading a campaign cannot leave a copied or stale state store. Shell input clearing, charge cancellation, Back selection and frame scheduling remain in app.js.

Rendering reads the campaign and holds only transient presentation state. Screen coordinates are logical CSS pixels. The browser shell sizes the physical canvas for device pixel ratio, capped at 2 on desktop and 1.5 on phone, with a three-million-pixel budget where the viewport permits it. Combat geometry remains in world coordinates. Existing zone initialization/migration stays in the world layer.

## Device boundary

`cindermaw-combat.js` extends existing boss/combat owners for Cindermaw's approved seven ministerial attacks and guarded ministry inspections. Existing navigation physically moves same-ID Vera/mobile forge and two designated native Ash-beast guards; v4 snapshots preserve positions while sanitizing encounter/equipment state. Finite local defensive equipment consumes accepted shared damage and receives bounded Vera repairs, with all tuning in rules.js and no universal durability economy. Shared summon factories, targeting, geometry, death and save cleanup remain in their existing owners. Directed native orders, contracting cordons and three-second protection are transient actor fields cleared through `clearEncounterState`; snapshots clean copies and raw historical restores drop those fields. No new campaign store or browser dependency is introduced. Timing and tuning remain in `rules.js`; actual cues remain in `combat-visuals.js` and the existing observation-only VFX bridge.

`dreadmaw-combat.js` extends existing captain owners for seven approved agricultural regular attacks. It reuses the four-member brood factory, actual phase/reflection, Rogue methods and physical Treasury navigation. Director14October authorizes reasonable location expansion for worldbuilding; the shared Treasury now includes agricultural stores, a distribution gallery and a larger Inner Vault, using an optional per-room size and version5 idempotent migration. Local collision-safe L rushes and transient net/vapor/feed states share existing update, damage and save cleanup. Numerical tuning stays in the supply-crown rules profile; no new state store or browser dependency.

`styles/prototype.css` defines the shared theme. `desktop.css` and `phone.css` contain separate layouts scoped by the selected experience. A narrow desktop window keeps its desktop identity. Fine pointer plus hover support wins on hybrid laptops; coarse-only input chooses phone. An explicit setting or `?experience=desktop|phone` overrides detection. `phone.html` defaults to the phone presentation; an explicit saved screen choice survives relaunch. The compact phone HUD leaves the hero and skill controls clear. `phone.html` is the installed PWA launch entry.

`templates/game.html` generates all three campaign entries (`index.html`, `prototype.html`, `phone.html`). They load the same script graph and share storage on the same origin. Phone-specific controls are absent from the desktop layout. Menus and HUD accept keyboard, mouse and touch independently of presentation. Input preferences use their own versioned storage key; campaign save schemas remain unchanged.

## Work limits

Floor iteration starts within inverse-projected viewport bounds, then applies the original visibility check. Objects are culled before cloning and depth sorting. Static HUD markup is replaced only when its content changes. Hidden pages skip simulation/presentation work; paused or unfocused worlds redraw at most four times per second. Simulation timing, action costs, cooldowns, routes and damage rules retain their prior behavior.

Performance samples retain at most 180 active frames and stay local. Exported reports distinguish sampled work time from frame cadence. These measurements do not establish a universal Chromebook frame-rate guarantee; testing on the actual target device remains useful.

## Build and release

`scripts/site-assets.cjs` is the source for the campaign script graph and public asset inventory. `scripts/build.cjs` generates entries, build version and the service worker, checks missing assets and syntax, validates registered sprites, and prepares the deployment directory. Package version drives the offline cache version. Changes to runtime assets require a version bump and regeneration.

The campaign core is precached. Independent legacy games are cached only after they are opened online. Registered sprite assets join the current cache. New cache activation removes only obsolete Azeroth caches. Save keys are independent of cache versions.

CI checks generated artifacts before testing. Code PRs run all non-browser suites and desktop/phone browser paths; allowlisted prose-only PRs use lightweight checks. Main requires successful full validation of the identical Git tree: it can reuse the same repository's full PR certificate or run all suites and the full device matrix itself. It always checks and rebuilds the package, publishes only after success, and checks that the live build identifier matches the merged commit before live smoke verification. Manual runs retain full validation. See README for the conservative reuse and fallback rules.

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

## Audio authoring housekeeping v0.8.91

The recorded manifest now owns location/boss/special routing, contextual music overrides, per-cue gains, event recording bindings and reusable creative guides. Build derives the immediate selection snapshot in `audio-library.js`; `audio-contract.js` shares validation across registration, packaging and playback. `audio-production.js` has one selection policy for catalog and explicit overrides. `audio-recordings.js` replaces catalogs safely and dispatches warm recorded events synchronously, with immediate procedural fallback on a cold/missing asset. Warning/victory behavior remains in the effect owner.

The score renderer updates its own marked assets while preserving imports, custom overrides, routing and edited guides. Registration computes duration/hash/provenance, supports atomic layer batches and validates before writing. The listening room exposes guides and exact recipe references. See `AUDIO_AUTHORING.md` for the complete editing/release workflow, provenance distinction and retained short-loop resource limits.

## Economy and EXP housekeeping

Prepared v0.8.89 keeps the shared Campaign API and state. Economy owns money mutations; actions in progression/party/engine still own eligibility, training effects, construction, recovery and route transitions. `grant(gold, xp)` remains the compatible reward dispatcher and calls progression's `xp`. Travel charges only after arrival succeeds, inside the existing state rollback boundary. Rewards owns reward amounts and payment policies; kill orchestration retains the summoned-enemy and already-paid guards. EXP is awarded immediately on defeat; crown loot is paid only on pickup. Labor retains gathering/deposit timing and fractional carry.

Menus and shell quote prices through the same Campaign methods used by purchases. Authored skill learning/rank prices, regional fares/base rewards and quest/boss rewards remain in `data.js`; existing specialist/companion/equipment/tribute tables remain in `rules.js`. The remaining former literals live in `rules.balance.economy` and `rules.balance.rewards`. These are authoritative inputs, not copied balance catalogs. `data.economy` is an unused aggregate reference, not a live price source. See `ECONOMY_EXP_HOUSEKEEPING.md` for all sources, invariants and validation.

## Implemented lifecycle and pilots · v0.8.92

Three production keys are active: `hero:paladin`, `enemy:goblin` and `prop:vale-cottage:vale`. The Goblin uses Joel's explicitly accepted playful half-smile and organic ears. Paladin has a faithful two-frame idle; its static fallback is retained as a rollback revision. Native placement and desktop/phone day/night comparisons are recorded under `tools/sprites/pilots/2026-10-08-refined`. Engineer review of the idle is distinguished from Joel's actual image acceptance.

The versioned optional format supports clip rectangles/pivots/timing and stable-ID variant banks. The loader is lazy, deduplicates content, limits concurrent decodes to two and active decoded residency to 16 MiB, pins visible resources and retires obsolete revisions. Replacement, removal and rollback use expected revision leases and immutable retained originals. Atlas assembly requires a final visual review. Build/offline enumeration shares the same resource schema. Asset-scoped evidence isolates unrelated catalog/map additions. Playtest exports include sprite diagnostics.

Chat edits follow `DESIGN_TO_SPRITE_WORKFLOW.md`; `npm run sprite:asset -- "name or exact key"` exposes current originals, revision, dependent presentation and history. An authorized edit proceeds through generation, visual checks, implementation and release. Reconcile affected frames/variants together, or temporarily use the new static design. Preserve material-appropriate contours across every candidate, rather than copying accidental procedural blockiness.

The reconciled scope remains 296 decisions (280 GENERATE, 16 PROCEDURAL), 70 prepared body contracts and 28 separate terrain material candidates. This release completes the lifecycle foundation and three pilots. Remaining body production, terrain texture processing/world mapping, authored directions and additional motion clips are subsequent asset jobs. Runtime memory bounds are software checks; they do not claim a measured physical-device performance guarantee.

## Environmental playback v0.8.93

`audio-environment.js` independently owns contextual loop beds, bounded crossfades, stale-load cancellation and combat/boss attenuation. `director.environment` routes registered looped ambience through the existing bus/cache/source contracts. Fourteen original deterministic textures cover the nineteen current places; the old background noise remains the asset-failure recovery path, without playing under successful recorded beds. Details are sparse and suppressed in combat. Book/renderer ownership preserves external replacements and guides. See `AUDIO_ENVIRONMENT.md`.


## 150% sprite preparation

Developer sprite processing now records explicit raster scale separately from the established reference display canvas. Existing manifest displayWidth/displayHeight already keep runtime static/clip/variant geometry independent of resource pixel dimensions. Density-aware preparation, atlas assembly, source provenance and capped-device-ratio review live in sprite-pipeline.cjs and sprite-batch-review.cjs. Existing runtime resource validation, actual-pixel memory accounting, content-aware retirement and offline inventory retain their ownership and limits. No production asset migration is performed by this housekeeping release. See SPRITE_RESOLUTION_HOUSEKEEPING.md.

## Enemy presentation/audio identity synchronization

`enemy-vfx.js` owns stable attack identities; `enemy-presentation.js` derives their shared material/action/personality profiles. `enemy-vfx-events.js` delivers one immutable observation-only stage envelope. `audio-enemy.js` routes stage decisions and bounded family recipes through the existing effect/recorded binding facade. No gameplay owner imports audio, and transient deduplication/suppression never enters statistics or saves. See `ENEMY_AUDIO_SYNCHRONIZATION.md`; `npm run check` includes live audio/VFX coverage.


## Bounded ground projection · v0.8.124

Ground materials reuse a screen-aligned isometric repeat at the current physical Canvas scale. Original world phase, opacity and surface clips remain authoritative. A separate 8 MiB projected RGBA LRU cache supplements the existing 2 MiB source-image budget; eviction and manifest retirement release backing stores. Unsupported/oversized/non-ground transforms keep the original projection. Artwork, scene animation, gameplay and saves remain unchanged. See [MATERIAL_RENDERING_PERFORMANCE.md](MATERIAL_RENDERING_PERFORMANCE.md) for regression evidence, sampling tolerances and device-test limits.

## Outdoor floor reuse · v0.8.126

`ground-cache.js` owns one current outdoor floor picture, bounded to 64 MiB RGBA with a preferred 256-unit movement margin. `renderer.js` reuses it while retaining visible-tile counters and the existing dynamic layers. Zone, material readiness/revision, viewport, physical scale and exhausted camera margin rebuild it. Interiors release it and use their original floor path. Source art, campaign state and save keys are unchanged. See [GROUND_WINDOW_PERFORMANCE.md](GROUND_WINDOW_PERFORMANCE.md).

Joel additionally authorizes a 256 MiB decoded sprite-cache ceiling for continued artwork production (previously 16 MiB). The shared format and tooling active-memory policy agree; lazy loading, two concurrent decodes, LRU/pinning and per-resource/package limits remain unchanged. This is separate from the 64 MiB floor-picture ceiling and is not an upfront allocation.

## Consolidated hero skills and presentation · released in PR #308

`hero-presentation.js` owns the stateless 48-form catalog, actual-projectile Canvas
drawings, charge/status glyphs and bounded hero FX; `audio-hero.js` installs original
hero foley on the existing audio facade/mixer/voice lifecycle. These modules do not
authorize casts or modify gameplay. Shell charge feedback observes the same
pause-aware active clock as pending companion preparation. `combat.js` counts
actual final HP loss for transient charged interruption; `engine.js` resolves
companion casts after all damage phases. Shared Slow recovery covers cooldowns
without stretching preparations, warnings or ongoing healing.

`archive.js:conditionTopics` owns shared short condition definitions and optional
detailed live-rule explanations. `menus.js` exposes only each selected short
explanation through Combat conditions; the Keeper's existing shelves/figures
flow exposes the details. Controls and the Adventure/Barracks/teacher Hero skills
paths link to that short reference. This is a read-only presentation query, not a
new condition store or tutorial system. See
`docs/HERO_SKILLS_CONSOLIDATION_20261015.md` for historical sources and conflict resolution; the consolidated dev.65 PR #308 passed its full validation and published. Subsequent Community Snapshot and no-CI hotfix evidence is separately bounded in `docs/COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md`.

## Community Snapshot pet specialization (merged through PR #313)

`party-pets.js` installs the narrow `pet` companion specialization alongside `party.js`; it does not own another roster or import engine/browser state. `rules.petCompanions` keys are vetted against `data.bosses`; live coefficients stay in rules. `s.true` remains permanent entitlement, `s.party` remains the sole recruited roster, and `petFamily` preserves individual identity through the existing v4 lifecycle. Common progression/armor, active/reserve caps, Ranger healing, targeting doctrine, navigation and delayed interrupted charge completion remain the shared owners. Menus and the existing Keeper shelf expose collection and skill details. Pet-only art is explicit in visuals; sprite lookup intentionally returns no sprite key. The script is registered in the deployed PWA graph. PR #313 completed focused/WebKit evidence and merged under the owner's release instruction; later limited updates did not undergo full fresh gameplay certification.

Source-audit repairs keep the pet's preferred firing destination inside its usable band, account for follow stopping tolerance and require a clear firing line. This destination policy belongs to the new allied specialization; navigation still owns routes/collision. Pet area collateral follows the existing shared damage/direct-target distinction. Release events carry the authored shape dimensions; renderer charge previews and impacts project those dimensions without writing to simulation state. Concise menu shape/range text and fuller Keeper explanations read the same definitions. No enemy AI, scheduling or targeting optimization is introduced.

---

## Preserved file: `docs/V09_RELEASE_NOTES.md`

# Azeroth Chronicles v0.9.0 beta — release candidate

**Not published. Acceptance and release approval are pending.** This is a prepared release candidate, not a declaration that the checklist is complete. [Issue #213](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/213) owns current evidence and the go/no-go decision.

## Included in the candidate

- Five-region single-player campaign in the multi-file installable web app, with distinct desktop keyboard/trackpad and phone touch presentation.
- Integrated road infrastructure, restored independent transport departure scenes, regional dungeon work and quest/specialist progression updates.
- Combat-condition corrections; persistent equipment selection; hero-only preparation-tonic effects; and boss charges ending correctly when blocked by a wall.
- Cooldown-based combat, companion training and recovery, and Standard/optional Succession progression with compatible v4 save keys and retained v2 backup import.
- Auto / 30 / 60 FPS rendering preference. Auto begins at 30, can promote to 60 with headroom and reduces rendering frequency under sustained slowdown. Simulation, input and audio retain their existing update path.
- Scoped rendering, audio and offline-cache optimizations. Component measurements do not establish a universal whole-game FPS or battery improvement.
- Corrected Thornfang Pounce and Stone Colossus Wall Rush descriptions. Pounce retains 0.375 seconds of normal recovery after a hit or miss; Wall Rush retains three seconds of core exposure after the charge ends. No new pillar requirement, vulnerability state or balance change.

## Saves and known limitations

Campaigns remain local to each browser/device. Export before clearing browser data or moving to another device. There is no cloud save service or playable co-op. Sprite production continues; paused #217 is not included.

Joel reports that his ongoing saves have survived major updates throughout development without corruption or needing to restart. Existing automated migration/PWA checks also provide technical evidence. A copied genuine historical player export/import round trip has not yet been independently validated.

Full natural campaign and late-game acceptance are incomplete. Browser emulation and bounded action pilots do not certify physical input comfort, installed offline behavior, sustained device memory/temperature/performance, or a complete player journey. Those are outstanding acceptance checks, not reported proof of broken gameplay.

## Publication gate

Before merging/publishing this candidate:

1. Confirm the final source includes the accepted #227 correction and no unrelated work. Reconcile with current main and record exact head/tree.
2. Resolve remaining acceptance in #213 through evidence or an explicit author-approved beta scope/risk decision. Neither positive automation nor this document silently waives open criteria.
3. Pass the final candidate's formatting, generated/asset, full Node, Chromium, WebKit, historical-save/PWA and packaging gates. Prior v0.8.138 success alone cannot certify this version/cache change.
4. Obtain the release order for this tested candidate. Merge once, use the existing deployment workflow and only its normal identical-tree certificate reuse.
5. Verify exact live `build.txt`, build-info/cache version and all production smoke gates. Record actual release commit and workflow links. Create a release tag only at the verified commit if requested as part of publication.

At preparation, last independently verified production was **v0.8.138**, commit `6c2381b34ce63fb935936a4e69ec404996f7765a`, [main run 38091031125](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38091031125), backed by full identical-tree [run 38087706102](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/38087706102). Candidate validation is recorded in its PR; v0.9 publication evidence does not exist yet.

## Rollback reference

Known verified recovery source: v0.8.138 `6c2381b34ce63fb935936a4e69ec404996f7765a`. Earlier recovery: v0.8.137 `c6ce1af236bddd7ca881903499c4cf5de175f9e2`.

If needed, prepare a forward corrective release from an accepted stable source with a fresh unique package/cache version. Validate save compatibility using copies, preserve all player exports/legacy originals, pass normal release checks and verify the published SHA. Do not clear player storage or rely on an old cache appearing automatically. No rollback is executed by these notes.

