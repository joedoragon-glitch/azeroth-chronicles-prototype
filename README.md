# So I Became the Dark Lord's Problem

**Verified repository checkpoint — 25 October 2026:** `main` at [`e3c78266b28f`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/e3c78266b28f3325d2afdcb76ae849fcff306deb), package `0.9.1+snapshot.dev.185`; [exact-commit focused validation and GitHub Pages deployment](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40208508280) both succeeded. This records the checked release, **not** a claim that every installed client refreshed, that physical-device acceptance occurred, or that all game/browser suites passed. Recheck `main`, its workflow result, and [Recovery Desk #297](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/297) before treating this dated status as the latest.

For active instructions, use [development state](docs/DEVELOPMENT_STATE.md), [documentation index](docs/DOCUMENTATION_INDEX.md), and [PR #449 governance audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/449); older dated status text below is reference evidence.

**Historical dev.169 performance checkpoint — 24 October 2026:** `0.9.1+snapshot.dev.169` is **merged and published** in [PR #426](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/426) with [successful focused validation/Pages deployment #40072160124](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40072160124). It consolidates default-On two-frame adaptive skipping, emergency gameplay protection/recovery, crowd diagnostics, collision fast rejection and Auto FPS safeguards. The [22 October audit](docs/PERFORMANCE_MEASUREMENT_AUDIT_20261022.md) preserves the original dev.164–166 evidence; **newer dev.169 audits and focused tests add further evidence**, catalogued in the [cumulative performance evidence register](docs/PERFORMANCE_EVIDENCE_REGISTER_20261024.md). Neither set alone certifies a hardware FPS gain. Read the [version-specific dev.169 performance and measurement status](docs/CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md) and [development state](docs/DEVELOPMENT_STATE.md). Focused checks and publication do not prove real-Chromebook FPS or complete hardware acceptance.

**Community Snapshot and continuing updates:** The October 2026 Community Snapshot was a milestone in this **same live, playable game**, not a separate or retired edition. The original GitHub Pages/browser and phone PWA entries continue receiving updates under the `0.9.1+snapshot.dev.*` build line. The October dev.119 release notes describe what was published **at that earlier checkpoint**, not the latest build or the complete subsequent update history. Check the [current development state](docs/DEVELOPMENT_STATE.md) for the verified source, Pages publication and acceptance limits; the [documentation index](docs/DOCUMENTATION_INDEX.md) distinguishes active guidance from dated evidence.

An offline-capable RPG across five regions, ten settlements and five main dungeons. Rescue the specialists, build your expedition, and challenge the Dark Lord. The regime's currency is **crowns**.

The canonical game is the multi-file GitHub Pages/PWA application. It uses JavaScript, Web Audio and Canvas 2D by default, with a reversible experimental PixiJS WebGL2 world renderer plus Canvas combat cues; there is no game backend. The campaign engine is shared, while desktop and phone have separate presentation rules. Later updates continue using this same multi-file game and its existing public play/install entrypoints.

Existing GitHub Pages links and installed-app identity remain unchanged. For the latest verified source and published update, start with [current development state](docs/DEVELOPMENT_STATE.md). The [20 October sprite restart handoff](docs/SPRITE_RESTART_20261020.md) preserves that day's accepted art decisions and revision-first workflow, **not a fresh approval to resume old sprite batches or a guarantee that those designs remain unchanged**; verify the [live sprite manifest](assets/sprites/manifest.json), [dated design-decision overlay](tools/sprites/current-design-decisions.json), later owner decisions and current procedural source for any specific design. The [post-snapshot reconciliation](docs/NEXT_UPDATE_RECONCILIATION_20261018.md) and [implementation ledger](docs/SNAPSHOT_IMPLEMENTATION_20261013.md) remain dated evidence, not pending work orders.

## Release status

The **v0.9.1 Community Snapshot remains live and playable**, with subsequent `snapshot.dev.*` updates on the same game rather than a separate replacement. Those updates extend the released experience beyond the original October milestone; the latest successfully published source must still be distinguished from the build actually installed or cached on an individual device. The [October 20 Community Snapshot release notes (dev.119 historical checkpoint)](docs/V09_RELEASE_NOTES.md) document the features, validation and limitations **as of that release**—they are not a complete log of later playable updates. The [current development state](docs/DEVELOPMENT_STATE.md) tracks the more recent verified source and deployment evidence. An exported playtest report identifies the build actually running on your device. A merged PR or successful deployment does not, by itself, prove every installed PWA updated or that human/device playtesting is complete.

## Play

- [Chromebook / browser](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/): keyboard layout, compact skill bar, unobstructed play-space camera, no joystick or touch confirmation buttons.
- [Phone](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/phone.html): compact top HUD, dedicated touch layout, portrait/landscape controls and safe-area spacing. **Game and settings → Install on phone** opens installation instructions or the browser's install prompt. This remains a web app, not a native Android/iOS package.

Automatic selection uses pointer capabilities, including a mouse/trackpad on a touchscreen Chromebook. Resizing a desktop window does not turn it into a phone screen. **Game and settings → Screen and performance** is now a unified settings window with device-local Optimization Mode, camera/screen choices, Automatic/Maximum and 100/80/60/50% rendering resolutions, **Auto 20–30 / Auto 30–60 and manual 20/30/60 FPS**, and **Adaptive frame skip (On by default for new devices; a saved Off persists)**. The optional PixiJS WebGL2 world renderer has a 15-second Keep/Revert trial; Canvas 2D remains the safe default. Diagnostics include broad AI/frame timings and an optional crowd profiler. In critical stalls, emergency recovery deliberately pauses gameplay while probing actual frames; it can escalate to nonlethal encounter withdrawal and safe return. Optimization Mode reduces optional illustrated terrain, ambient audio, decorative scenery and Canvas backing resolution without changing campaign saves or combat telegraphs; actual hardware gains must be measured. Both entries use the same on-device saves. Camera framing defaults to the selected 150%; that menu also offers original 100% and 175%, remembered separately for desktop and phone. Supported phone viewports start at 375 × 800 CSS pixels (or landscape rotation); smaller layouts are no longer release targets.

Choose a Standard run or the optional Succession challenge, then Paladin, Mage or Ranger. Normal and Nightmare have independent saves. Nightmare unlocks after the peaceful ending. Updates preserve local campaigns and adopt the published build automatically; an update-available notice and a direct settings action make updates easier to find. A manual update check is also available in settings.

## Contextual soundtrack

An original warm-fantasy score now follows the hero through all five regions, main dungeons, treasuries and side interiors. Night, settlement and peaceful arrangements change the mood; combat adds a synchronized rhythm layer, and each of the eleven bosses has its own theme and TRUE-form layer. Menus have soft musical backing and distinct selection/confirmation sounds. Footsteps follow actual movement and surface type, with sparse local ambience.

[Open the audio audition room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) to compare the new score with the original sound, hear individual tracks and inspect listening mixes. It never reads or writes game saves. Music, ambience, effects and interface volumes are adjustable; phone and quiet mixes are available. See `docs/AUDIO_SOUND_PASS.md` for coverage and `docs/AUDIO_PLAYBACK.md` for playback contracts.

## Regional authored context

Forest Crypt, Sunken Archive and Colossus Mine now have distinct authored wings, practical work areas and contextual captive presentations. The Highlands Treasury has domestic rooms alongside its protected caches. Existing specialist unlocks, boss progression and v4 saves carry forward. This is the first iteration of Joel's three regional handoffs; see `docs/REGIONAL_HANDOFF_AUDIT.md` for settled canon, open choices and audit coverage.

## Controls

| Action                    | Desktop                                             | Phone                                        |
| ------------------------- | --------------------------------------------------- | -------------------------------------------- |
| Move                      | WASD                                                | Left joystick or tap a reachable destination |
| Interact                  | F                                                   | Interact                                     |
| Skills 1–5                | J / K / L / U / I                                   | Skill buttons                                |
| Skills 6–8                | Space / O / N                                       | Skill buttons                                |
| Charged skills 1–8        | Quick tap for normal; hold 0.65 seconds for charged | Same tap/hold behavior                       |
| Ranger healing            | H / left mouse for Heal                             | Heal button                                  |
| Squad doctrine            | Tab during combat, Expedition 3+                    | Contextual Squad button                      |
| Recall                    | Q or backtick                                       | Recall squad                                 |
| Change target             | E (customizable), or click Target in the HUD        | Target beside Recall, above joystick         |
| Map                      | M or Z                                              | Adventure menu                               |
| Inventory / quest journal | Character / Adventure menus                         | Adventure menu                               |
| Pause / menu / controls   | P or V / Escape / G                                 | Menu                                         |
| Menu navigation           | W/A previous; S/D next; F/Enter/Space confirms      | Direct tap; joystick and Confirm also work   |

The **default desktop layout is now two-handed**: WASD movement with the right hand operating J/K/L/U/I/Space/O/N for skills 1–8. **Game and settings → Controls → Customize keyboard** offers the old Classic number-key layout, a mirrored IJKL movement/left-hand skills layout, and individually customizable bindings. Existing saved keyboard settings remain in place; new devices use the new default. Preset changes require confirmation and are saved on this browser/device independently from campaign saves. Inventory and the quest journal are accessible through the Character/Adventure menus and intentionally have no keyboard shortcuts in any preset. Menu navigation follows the chosen movement keys; Enter and Space remain confirmation fallbacks, and Esc opens/backtracks menus. Other browser shortcuts remain available.

Menus, HUD buttons and skills accept mouse clicks and touch taps on every screen, including touchscreen Chromebooks and tablets. Skills 1–8 support quick taps and 0.65-second charge holds with either input, including Ranger Skill 4 (tap hero Haste, charged companion Rally). All three heroes automatically perform basic three-hit attacks while moving or standing near eligible enemies, with their own cooldown (Paladin Shield Stance still blocks Skill 1 basics). Tapping Skill 1 now fires the former charged focused shot/beam/three-arrow technique immediately, while charging summons Paladin's **Radiant Cross**, Mage's **Wide Arcane Beam**, or Ranger's **Hawk Interception**. The Ranger hawk pursues one enemy within finite range and can interrupt a valid active tactical retreat. Tap Target or E to cycle visible hostiles; hold for 0.55 seconds to lock the current target throughout the encounter, including while dodging bosses or ignoring summons. Tap again to cycle and release that lock. The lock drops when its foe dies, returns home, or the hero changes area. The hero favors your chosen enemy, and otherwise falls back to automatic targeting. Holding an aimed Skill 1, 2, 4, 6, 7 or 8 shows subtle brackets and line-of-sight/range guidance (gold ready, amber out of range, red obstructed). Press Target during the hold to retarget. No persistent targeting circles are added.

**Controls → Touch and mouse options** selects the phone's default two-thumb layout (movement left, skills right) or the alternate left-hand layout. Touch tap-to-move is enabled by default alongside the joystick and can be disabled. Taps use existing collision/pathfinding; manual keyboard or joystick movement immediately takes over. Opening menus, pausing or losing focus cancels travel. Taps move the hero only and do not issue squad orders or automatically interact with services.

Mouse click-to-move is off by default and can be enabled separately. With it off, left-clicking the world commands Ranger Heal. The Heal button and its rebindable keyboard shortcut work in either mode. Sprint remains unavailable. E defaults to Target; Q is an alias for the default Recall binding. Bindings are customizable.

For concise skill information, open **Adventure → Hero skills**, or review skills at any completed Basic/Full Barracks or rescued teacher. Select a revealed skill for its **automatic Skill 1 basics / Tap / Charged effects, current normal and charged cooldowns, and next training source**, without long rule descriptions on the HUD. The Keeper’s shelves offer optional additional figures. This reference matches the redesigned Skills 1–8 in the published snapshot.

Ranger Skill 3 normally heals the hero; its charged form heals the hero and living active companions. Paladin Skill 3 instead raises a defensive shield or delivers charged Shield Bash; Mage Skill 3 interrupts a warned attack or creates charged bilateral Silence Field. Paladin/Mage Skill 4 has a charged attack; Ranger Skill 4 taps for hero movement haste and charges into a short movement and basic-attack-speed buff for nearby active companions; the charged cast stays unavailable without a living companion in range and does not consume a cooldown in that case. Active Rangers provide automatic and manually commanded Heal (hero or wounded living active companion). Fallen companions need separate recovery at a Captain or barracks. Death removes 20% of positive carried crowns, rounded up, without debt.

The former shared Skill 8 (area damage, large self-heal and damage immunity) has been retired in the published snapshot, replaced with class-specific tap/charged ultimates: Paladin's Sanctuary Oath / Last Bastion grants bounded party protection, Mage's Astral Detonation / Arcane Cataclysm emphasizes area damage, and Ranger's Hunter's Salvo / Grand Hunt distributes actual arrows over multiple foes. Neither form grants total immunity. Paladin Skill 8 wards do not multiply with Shield Stance: only the stronger defensive reduction applies to the hero. Mage Cataclysm uses a brief stronger nonstacking Fracture, and instant Paladin/Mage ultimates have target-count caps. Ranger's ultimate adds just one non-piercing arrow when truly facing only one target, preserving Skill 7's superior single-boss role. Mage Skill 2 retains frost Slow; Mage Skill 5 uses existing collision-safe knockback, and Mage Skill 7 chains arcane damage. Ranger Skill 6 uses repelling arrows rather than haste, so Skill 4 owns speed support. The consolidated cooldown-first balance changes shorten the repeatable Paladin Weakening and Mage Frost Slow windows so the same control attack cannot guarantee permanent suppression by itself. Repeatable Skill 5 area damage is limited to 6 normal / 8 charged targets across classes, as is Paladin Skill 7; excess foes remain dangerous. The universal charge hold is 0.65 seconds; current coefficients and cooldowns are owned by `rules.js`. The full calculation and rotation rationale is recorded in [the skill damage and cooldown audit](docs/HERO_SKILLS_COOLDOWN_ROTATION_DAMAGE_AUDIT_20261015.md). The hero consolidation shipped through PR #308. Later snapshot additions and hotfixes have their own bounded evidence; a fresh whole-game audit is deferred until after the break.

**During cooldown:** tap queues the normal form; briefly hold queues charged. The original numbered markers use light blue for normal and gold for charged; button labels name the stored form. Charged preparation begins after cooldown. Ranger companion Heal also accepts one queued hero-healing request during cooldown and shows QUEUED on its button. [Queue input details](docs/SKILL_QUEUE_FORMS_DEV139.md).

## Cooldown-only combat (reversible)

The live game has **no MP costs or MP HUD**. Skills are controlled by their cooldowns; every numbered skill has a **short normal Tap timer and longer charged-only lock**. A charged cast starts both timers, but a normal Tap becomes available again after its own cooldown even if Charged is still recovering; normal taps never extend charged recovery. Skill 1's new Tap uses **3s**, with Charged **8s Paladin / 7s Mage / 8s Ranger**, and automatic basics on an independent **0.85s** base cadence. Charged base cooldowns for Skills 2–8 remain **6s / 20s / 20s / 18s / 12s / 25s / 40s**. The five-rank Cooldown Training talent reduces hero cooldowns by 4% per rank (20% at rank 5). Open **Adventure → Talents** for training. Enemy mana-drain effects are dormant pending explicit replacement design; other enemy attacks remain unchanged. Ranger Heal stays, while Ranger Mana Recovery is inactive and no longer shown.

The previous MP rules, original character MP values, effects, Ranger mana training and legacy save fields are deliberately retained under the code feature switch `PrototypeRules.resourceMode.manaEnabled` (currently `false`). A prior-version Git revision provides a complete rollback, and flipping this flag back to `true` re-enables the preserved MP logic and legacy UI paths. Existing v4 saves keep their MP fields without spending or regenerating them in the cooldown-only game. Talent index 1 maps to Cooldown Training at the same invested rank; all other training ranks are preserved. Do not delete legacy fields or MP logic before the design is final.

## Saves and reports

Campaigns stay on the current browser/device. Export a save before clearing browser data or moving to another device. The v4 save schema and internal currency fields remain compatible; importing v2 backups is still supported. Changing screen layout does not create a different campaign.

**Game and settings → Save and game management** provides save export/import and a playtest report. Reports include the build version, current graphics backend, frame/update opportunities, separate Pixi/Canvas surface timings, crowd diagnostics, and ordinary/adaptive skip counters. Their sampling windows differ; `displayedFps` means **issued world draw calls**, not verified monitor presentation, and callback rate is not completed simulation rate during emergency holds. The game sends no telemetry. Consult the [current dev.169 interpretation guide](docs/CURRENT_PERFORMANCE_STATUS_DEV169_20261024.md); the [dev.166 audit](docs/PERFORMANCE_MEASUREMENT_AUDIT_20261022.md) is historical.

## Development

Use Node.js 22 (the CI version; minimum 20.9). The shipped game has no third-party runtime dependencies.

```sh
npm ci --ignore-scripts # install all locked development tools, including Playwright
npm run dev            # http://127.0.0.1:8080; phone entry is /phone.html
```

| Change                                   | Local checks                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| During implementation                    | Run the affected `node tests/<name>.test.cjs` suites; `npm run test:quick` is an optional broader feedback pass.                                                                     |
| Runtime code, styles or published assets | Use affected focused tests, changed-source checks and reproducible package verification; update package, generated entries and service-worker cache as needed. Full suites require separate owner approval. |
| Tests or development tooling             | Run affected focused checks and packaging where relevant. CI selects impacted tests; full game/browser suites require explicit owner approval. |
| Documentation only                       | Check links, dated status and evidence boundaries. No runtime version bump or regeneration.                                                                                           |

`npm test` automatically discovers every non-browser `tests/*.test.cjs` suite, including road access and town-street audits. Do not list those suites separately in CI or rerun `test:quick` after the full suite. Browser suites are separate: `npm run test:browser` runs the main Chromium device matrix, not every browser suite.

Install browser binaries once locally:

```sh
npx playwright install chromium
npx playwright install --with-deps webkit # Linux may require sudo for system dependencies
npm run test:browser
node tests/phone-webkit-browser.test.cjs
```

`CHROMIUM_EXECUTABLE` can select an existing Chrome executable. Playwright's version is pinned in `package-lock.json`; update it there through npm rather than installing a separate version in CI.

**Current CI policy (merged [PR #412](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/412)):** Normal pull requests and main pushes use [focused-deploy.yml](.github/workflows/focused-deploy.yml), which selects impacted tests, validates a reproducible build and deploys main after focused checks pass. Comprehensive Node, Chromium and WebKit certification in [pages.yml](.github/workflows/pages.yml) is **manual-only**, with explicit `approve_full_suite=true` from the owner. Neither focused CI nor successful Pages publication establishes real-device smoothness or broad browser certification. Do not trigger the full matrix without explicit permission.

Performance regression checks shipped through #226: `tests/perf-v09-protected.test.cjs` retains protected source hashes alongside baseline equivalence and Chromium/WebKit road/renderer checks. That Node suite is already covered by automatic discovery. When integrating concurrent workflow edits, keep these hooks and the existing release gates.

Work on a separate branch. If interrupted, commit and push completed work to that branch and keep a brief resume note in its PR. Preserve other branches, unfinished work and original assets. A PR is not merge or deployment approval; follow the authorization in the task.

For a new gameplay system, use the [mechanic development workflow](docs/MECHANIC_DEVELOPMENT.md): focused checks, recoverable multi-file integration, explicit owner release approval, and optional broader certification only when authorized. An interrupted chat resumes the existing work; it does not restart the feature or its completed audits.

`node scripts/build.cjs --check --site` packages only the declared public assets into `_site`. One inventory drives entry script order, offline cache contents and deployment. Generated files are committed, so GitHub Pages can also serve the repository directly without a bundler. Historical `legacy.html` and `rts.html` are independent references, loaded and cached only when opened.

## Project references

- [Architecture and module boundaries](docs/ARCHITECTURE.md)
- [Current work and sequencing](docs/DEVELOPMENT_STATE.md)
- [Current documentation index and topic routing](docs/DOCUMENTATION_INDEX.md)
- [Historical 19 October documentation audit and frozen incoming census](docs/DOCUMENTATION_AUDIT_20261019.md)
- [Historical 10 October backlog audit](docs/BACKLOG_HOUSEKEEPING_20261010.md)
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

**Artwork status and historical limits:** The earlier audited baseline recorded 33 sprite identities and seven ground/road materials, with procedural fallbacks; those are **dated audit figures**, not an independently refreshed dev.185 census. For actual selected files and current source behavior, consult the [sprite manifest](assets/sprites/manifest.json), relevant procedural code and verified per-design decisions. The [20 October sprite restart handoff](docs/SPRITE_RESTART_20261020.md), [sprite preparation](docs/SPRITE_PREPARATION.md) and [sprite resolution housekeeping](docs/SPRITE_RESOLUTION_HOUSEKEEPING.md) preserve the earlier revision-first sequence, original-master precautions and outstanding proposals without making them an automatic production queue. Historical issue #160 and [PR #319](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/319) relate to earlier milestones; **PR #319 was merged at dev.79**, not a pending future workstream. The old “project break” text is not today's stop-work rule. New artwork/replacement/release still requires the owner's current scoped authorization.

Saves stay on the browser/device; there is no cloud synchronization or playable co-op. Native Android/iOS packages are not current distribution targets. Browser tests do not certify physical-device comfort, every map's artistic completion or a full human campaign playthrough. See the [current limitations and v0.9 acceptance work](docs/DEVELOPMENT_STATE.md).

### Consolidated combat reference (published snapshot)

The hero gameplay and audiovisual changes, enemy healing, boss passives, charged interruption, Slow/cooldown recovery and phone fixes were consolidated, validated and published through merged PR #308. Later Community Snapshot content and narrow post-release fixes have separate evidence and known test waivers; see [the release handoff](docs/COMMUNITY_SNAPSHOT_RELEASE_HANDOFF_20261016.md) and historical [integration ledger](docs/HERO_SKILLS_CONSOLIDATION_20261015.md).
Find concise explanations at **Hero skills → Combat conditions** (Adventure,
Barracks or teacher Review), or **Controls → Combat conditions**. The Drowned
Keeper's **Conditions and recovery** shelf reserves detailed rules and current
figures for optional reading. Slow affects movement and skill recovery; Silence
restricts specials for both sides without stopping ordinary movement/attacks.
