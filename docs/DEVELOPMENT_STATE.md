# Current development state

## Foundation complete in v0.8.81

Desktop/browser and phone presentation are distinct. World authoring, navigation, rendering, persistence, platform selection and runtime measurements have explicit module boundaries. Entry generation, offline assets, versioning and deployment use a shared build inventory. Existing maps, campaign behavior and procedural sprite canon are preserved.

## Continue existing work

| Workstream | Current evidence and next step |
| --- | --- |
| Regional playtesting | v0.8.87 implements the first Greenwood/Marches/Highlands handoff pass. Continue Joel's region-by-region review and corrections using REGIONAL_HANDOFF_AUDIT.md. Recent Frontier/Crown work remains in place. Housekeeping does not certify every map as artistically finished. |
| Procedural canon | Static polish v0.8.79 and terrain/effects polish v0.8.80 are retained. New feedback should improve current canon in the owning modules. |
| Sprite production | v0.8.92 activates Paladin (two-frame idle), playful Goblin and Vale cottage pilots. Bounded lazy loading, chat asset discovery, revision leases/rollback and optional clips/variants are implemented. Continue staged production from 296 decisions, 70 body contracts and 28 separate terrain candidates; see SPRITE_PRODUCTION_CURRENT_CONTEXT.md. |
| Chromebook tuning | Play the desktop entry on the actual laptop. Reports now include active frame cadence, work time and renderer counters for reproducible tuning. |
| Phone playtesting | Use the dedicated phone entry or installed PWA. Check real-device thumb reach, portrait/landscape behavior and offline reopening. |
| Engineering | v0.8.84 extracts progression, save handling and the specialist/expedition menu catalog; balance and formatter coverage are consolidated. The prepared v0.8.88 pass separates hero skills, boss attacks/summons, shared combat resolution and party behavior. Enemy AI, encounters, quests and global shell menus remain substantial. Benchmark before introducing caches, workers or a different renderer. |
| Distribution | Browser desktop and installed phone web app are current targets. Native packaging is a later distribution decision, independent of finishing maps or sprites. |

Map and sprite completion are not prerequisites for sound engineering. Conversely, changing frameworks does not complete map design, resolve performance by itself, or turn a PWA into a native package. Keep gameplay decisions in `DECISIONS.md`, engineering ownership in `ARCHITECTURE.md`, and historical releases in `PROJECT_HISTORY.md`.

## Input update v0.8.82

Direct menu/HUD clicks and taps, persistent keyboard rebinding, two-thumb phone controls and optional pointer movement replace the inherited input prohibitions. See `README.md` for player settings. Autoattack and death/economy rules are preserved. Real-device comfort remains part of Joel's playtesting.

## Input audit v0.8.83

Manual keys and joystick contact cancel pointer travel before simulation advances. HUD readouts shield world input, and visible training prompts follow rebinding. Browser coverage includes native mouse/touch charging and menu cancellation alongside the existing input/device checks.

Joel’s iPhone feedback drives a compact phone HUD, bottom-right learned skills/recovery, contextual in-range Interact and removal of routine map/time/save labels. Game text blocks selection/callouts while form inputs retain normal behavior and menus retain vertical scrolling. WebKit phone regressions supplement the Chromium device matrix; real iOS system gesture and comfort checks remain device playtests.

## Engineering handoff v0.8.84

The v0.8.83 accepted phone layout and input behavior are preserved. Progression (62 methods), save handling (five instance/static methods) and 28 menu definitions/actions now have explicit owners; the catalog exports ten shell entry points. The public Campaign API, v4 keys/schema, mode separation, legacy backup retention and live balance remain compatible.

Current recovery guidance distinguishes ordinary hero-only Skill 3 from charged party healing. Automatic/manual Ranger Heal supports living active allies, Mana Recovery is hero-only, and fallen-unit recovery stays separate. Current inheritance costs are 140 crowns per Shared Training rank and 125/200/300/425 for Shared Strength; historical higher prices are not current rules. Rescue/curriculum gates remain unchanged.

All hand-authored campaign JS and the three campaign CSS files have repeatable formatter coverage. Registry contract, packaging, realistic precache/offline reads and failed-image procedural fallback accept both empty and populated test registries. Production manifest/art are unchanged. Review `HOUSEKEEPING_AUDIT.md` and `HOUSEKEEPING_PROGRESS.md` for preservation evidence, review findings and release recovery.

## Sprite preparation v0.8.85

Issue 111 preparation provides a pinned processing toolchain, parsed catalog, three exact reference contracts, immutable sources, approval/provenance checks and a development-only day/night comparison showroom at four device sizes. Tests use current procedural drawings and isolated fixtures. The production manifest stays empty and byte-identical; no art is generated or activated. The later three-asset creative pilot and image-tool generation are deferred at Joel’s request. See `SPRITE_PREPARATION.md` and `SPRITE_PREPARATION_AUDIT.md`; the implementing agent owns technical checks and release.

## Ironroot Highlands v0.8.87

Ironroot's existing mountain settlements, Wolf territories, Ogre homes and Old Signal Keep remain. Small pay, sorting, mint and hauling scenes connect the province to crown production. The Ridge Tyrant's Treasury now prioritizes off-duty comforts; Crag Tyrant remains a Wolf household protector. Colossus Mine has seven connected functional/historical areas with a repair forge for Dara. See `IRONROOT_HIGHLANDS_LAYOUT.md` for the deliberately selected lore and preservation checks. The production sprite manifest is unchanged.

## Regional canon correction v0.8.86

Abyss Bastion now visibly prepares the Dark Lord’s air-superiority project. His purple dragon is his own personal flying mount; hatchery, rider equipment, aerial planning, royal standards and an unfinished launch platform support a future air force. See `ABYSS_AIR_SUPERIORITY_CANON.md`. Existing mechanics and geometry are preserved; presentation migrates on old saves. Cindermaw/Dreadmaw preview alternatives remain unimplemented.

## Regional handoff foundations v0.8.87

The three supplied audited handoffs are reconciled against the reorganized v0.8.85 modules. Forest Crypt becomes an unfinished private retreat with older crypt fabric, craft work, guest space and a caretaker study. Sunken Archive has dry stacks, forced restoration, shallow flooded sections and the Keeper's working study. Colossus Mine has active and older workings, haulage, repair/metallurgy, collapsed shafts and a Colossus chamber. Borin, Neri and Dara retain independent boss/key rescue gates while appearing at workstations. The Highlands Treasury has a domestic floor plan; its Wolf captain and three caches remain. Small outdoor support scenes avoid roads and present/future services.

Dungeon layout migration retains guard death state, rescued services, clear state, progression and currency. Treasury migration retains the exact collected-cache indices and captain death. New contextual furnishings remain procedural so a generic cage or generic prop sprite cannot overwrite their scene meaning. The approved sprite catalog and production registry remain unchanged.

This is an implementation foundation for further regional iteration, not a declaration that the regions are finished. Greenwood biography, flood cause and captive-trade identities stay open; the separate Ironroot pass records provisional repair-work, ancient-Colossus and convoy-escort interpretations for later revision. See REGIONAL_HANDOFF_AUDIT.md.

## Audio foundation v0.8.88

Joel requests professional place/situation/boss-specific audio, with housekeeping before sound creation. Warm fantasy is the broad direction. The existing catalog and cue policy are preserved while catalog, score/ambience, runtime/mixer/lifecycle and effects gain separate owners. Noise sources now obey the voice bound and clean up connections; disposal/resume races, interrupted-context retries, initial warnings and mute/volume edits during ducking have focused checks. Playtest exports gain local audio diagnostics and exact scene/boss metadata is observable without changing gameplay.

The recorded-audio production manifest is empty. Validated registration now feeds packaging/offline inventory; no new music/effect is created or played. Recorded playback/decode, richer mixing, menu audio and the contextual soundtrack belong to the subsequent production work. See `AUDIO_FOUNDATION.md` for the concrete gap audit and sequence, including unhandled side-zone musical identity and the need to audition music rather than equate tests with musical quality.

## Recorded playback and mixing v0.8.89

The next technical audio phase is implemented: local hash verification and codec variants, cancellable lazy fetching, serialized decoding, pinned 32 MiB decoded LRU memory, synchronized 1–4 loop stems, bar-aligned transitions, exact-context opt-in cue rules, procedural fallback, independent UI/foreground mixing, reference/quiet/phone audition profiles and reserved/stealable warning capacity. The normal campaign keeps its original score policy and menu silence because no replacement sound or cue rule is activated.

A separate offline-capable listening room at `tools/audio/index.html` auditions actual campaign regions/interiors and all eleven normal/TRUE boss identities, existing procedural sound, diagnostic WAVs, synchronized stems and scene mixes. It includes waveform/loop-edge measurements and a local downloadable report. It never loads persistence or reads/writes saves. Production music and sprite manifests remain empty. See `AUDIO_PLAYBACK.md`; contextual composition/sound design and actual-device listening remain the next creative pilot.

## Contextual sound pass v0.8.90

Joel authorized proceeding through soundtrack implementation and publication. The game now activates 83 original rendered music cues across 19 locations, five outdoor night/refuge variants, peaceful arrangements and eleven distinct boss/TRUE pairs, plus title/defeat/finale music. Layered combat intensity, shared reflections, interface sounds, movement-driven footsteps and sparse environmental detail extend the existing contextual combat effects. All music is original virtual-instrument composition, not licensed third-party recordings or live orchestra. The audition room compares new/original scoring and individual production tracks without touching saves. See `AUDIO_SOUND_PASS.md` for coverage, limits and verification. Real-device musical feedback remains creative iteration, not an implementation approval gate.

## Audio authoring housekeeping v0.8.91

Joel authorized completing the review findings so adding/replacing sound is maintainable. One recorded catalog now supplies music routing/tempo/gains and contextual effect/menu/step/ambience bindings. Catalog replacement resets same-scene selection; explicit overrides and production no longer compete; pause/resume retains transport. Renderer-owned assets are distinguished from imports and overrides, which survive regeneration. Registration checks hashes/duration/provenance before atomic updates, including multi-stem batches. All 83 music recipes and 90 synthesized event identities have reusable creative briefs, clearly identified as guides written after original procedural creation rather than historical model prompts. The listening room exposes them for copying. See `AUDIO_AUTHORING.md`.

## Prepared economy and EXP housekeeping v0.8.89

Local branch `codex/combat-party-housekeeping` combines the combat/party split with main's v0.8.88 audio foundation. `economy.js` owns crown transactions and all quoted prices; `rewards.js` owns regional/boss profiles, drop/quest payouts and reward reductions; EXP leveling remains in `progression.js`. Existing authored amounts, rank/rescue gates, v4 saves, reward timing, first-free barracks and transportation rollback remain compatible. No balance tuning or new art/audio content is included. See `ECONOMY_EXP_HOUSEKEEPING.md`. Joel lifted the initial publication pause and authorized release through the existing CI gates; the historical combat report describes its earlier regional-baseline verification. Local WebKit execution remains unavailable; release CI must run that check.

## Sprite scope reconciliation · 8 October 2026

Joel requested a full current-map scope reconciliation before further sprite implementation. Full Barracks, fourteen new static regional/flight/household props, Crown ranged troops and sixteen guard bodies gain exact decisions/bindings. Old Borin/Neri/Dara closed-cage prompts are superseded by procedural secured workstations. Named captains now bind their current treasury ranged/guard loadouts. There are 70 prepared exact contracts. Pilot appearances are acceptable; Goblin face correction and technical grounding remain pending. Production manifest stays empty. Refer to SPRITE_SCOPE_RECONCILIATION.md for current source evidence and next steps; generation may later extend this inventory through reviewed additions.

The reconciled scope also includes current smaller flora/rocks and 28 separate terrain material candidates. The lifecycle/animation review identifies eager loading, same-key stale decoded images, no replacement command and no clip support as required follow-ups before bulk integration. See SPRITE_ASSET_LIFECYCLE_ANIMATION_AUDIT.md; no animation runtime is activated by the current scope pass.

Future content/lore work uses DESIGN_TO_SPRITE_WORKFLOW.md: accepted procedural designs retain repository handoffs and exact references, so sprite requests from their originating chats can resume directly. New locations identify body/material/NPC requirements and reuse accepted assets; stable identities, replacement revisions and animation requirements persist with the design. This is an agent-owned workflow, with no technical tasks assigned to Joel.

## Implemented lifecycle and pilots · v0.8.92

Three production keys are active: `hero:paladin`, `enemy:goblin` and `prop:vale-cottage:vale`. The Goblin uses Joel's explicitly accepted playful half-smile and organic ears. Paladin has a faithful two-frame idle; its static fallback is retained as a rollback revision. Native placement and desktop/phone day/night comparisons are recorded under `tools/sprites/pilots/2026-10-08-refined`. Engineer review of the idle is distinguished from Joel's actual image acceptance.

The versioned optional format supports clip rectangles/pivots/timing and stable-ID variant banks. The loader is lazy, deduplicates content, limits concurrent decodes to two and active decoded residency to 16 MiB, pins visible resources and retires obsolete revisions. Replacement, removal and rollback use expected revision leases and immutable retained originals. Atlas assembly requires a final visual review. Build/offline enumeration shares the same resource schema. Asset-scoped evidence isolates unrelated catalog/map additions. Playtest exports include sprite diagnostics.

Chat edits follow `DESIGN_TO_SPRITE_WORKFLOW.md`; `npm run sprite:asset -- "name or exact key"` exposes current originals, revision, dependent presentation and history. An authorized edit proceeds through generation, visual checks, implementation and release. Reconcile affected frames/variants together, or temporarily use the new static design. Preserve material-appropriate contours across every candidate, rather than copying accidental procedural blockiness.

The reconciled scope remains 296 decisions (280 GENERATE, 16 PROCEDURAL), 70 prepared body contracts and 28 separate terrain material candidates. This release completes the lifecycle foundation and three pilots. Remaining body production, terrain texture processing/world mapping, authored directions and additional motion clips are subsequent asset jobs. Runtime memory bounds are software checks; they do not claim a measured physical-device performance guarantee.

## Environmental sound v0.8.93

Joel requests place-specific atmosphere without dense jungle noise, with preparation before creation. An independent environmental owner now provides bounded smooth transitions, pause/resume transport, validated replacement and combat/menu attenuation. Fourteen quiet original textures cover all nineteen current places; daytime/night woodland and marsh differ, and interiors stay restrained. Sparse details occur 18–36 seconds apart outside combat. Recipes, reusable briefs, import-safe regeneration and audition references are included. The sound catalog totals 83 music cues plus 14 environmental beds, 23.9 MiB encoded. See `AUDIO_ENVIRONMENT.md`; source-positioned/occluded environmental objects remain a future creative scope.
