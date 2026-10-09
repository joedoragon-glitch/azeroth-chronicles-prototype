# Current development state

## Integrated rogue repertoire · v0.8.111 released

PR #146 merged at `b583afe` and passed main/phone WebKit/deployment CI, exact published-build verification, and PWA upgrade/offline-save checks. It reconciles main's targeting/compression and VFX event bridge. `ROGUE_PR146_INTEGRATION_AUDIT.md` records actual-effect coverage, dust/ADDS targeting, local respawn restraint, active brood/Crown rally and lifecycle cleanup. Normal boss summons, base rotations and world geometry remain unchanged. Dedicated Chromium/WebKit rogue checks remain in PR/main gates. The follow-up quality audit adds lethal-companion/recovery and zone-reset cases; see that audit document and its follow-up PR for final validation.

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

## Player-selected targeting v0.8.106

Q (rebindable) or a clickable HUD Target button cycles hostiles visible in the current viewport. Manual selection takes precedence for the hero's targeted skills and movement autoattack; out-of-range selected enemies are not silently replaced. A 0.55 s Target/Q hold locks the selected foe through dodging and summons; a short press cycles and releases an existing lock. Encounter lock state is transient and clears on target death, return, or area change. Unlocked selections expire on distance. A held lock is retained during dodging until enemy defeat, disengagement, or area change; automatic targeting then resumes. The transient lock is not saved, and the existing v4 save contract remains unchanged. The phone Target button sits beside Recall above the joystick, and the alternate left-hand layout keeps the pair together. Held Skills 1–2 show clean corner ticks and range/LOS guidance; Q while held deliberately changes the charge target. The self-heal hold uses a small plus cue. Regression tests cover key migration and combat selection; real-device UI verification remains necessary.

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

## Sprite continuation and terrain foundation · prepared v0.8.94

PR #121 is merged and verified live at commit `5bdfa149`. The first continuation stage registers Mage, Ranger, Soldier and allied Goblin Archer, retaining all three approved pilots. Native desktop/phone day/night checks and exact immutable sources are recorded with honest engineer-review provenance. The dedicated opaque terrain processor, seam checks, revision rollback, clipped world mapping, bounded loading and offline inventory are implemented before terrain image production. Terrain remains procedural in this stage. See SPRITE_PRODUCTION_CURRENT_CONTEXT.md and TERRAIN_TEXTURE_PIPELINE.md; the remaining catalog is still in production.

### v0.8.95 — Goblin native face readability

User-requested correction simplifies face features to survive nearest downsampling at native game size. Same runtime dimensions and anchors; no gameplay changes. Prior approved source/output retained in history. Native desktop/phone day/night comparison evidence accompanies the asset. Release pending CI and exact live deployment verification.

### v0.8.96 — Regional ground texture pilots

Five region-specific ground textures add quiet grass/soil, wet earth, grit, ash and slate grain within existing world-coordinate floor clips. Lazy decoding and procedural fallback remain authoritative; total player texture payload is 507,307 bytes, 256² each. Original masters, exact prompts, seamless-wrap and native device day/night reviews retained. Each registration can roll back to procedural. Reproducible material showroom added. Release pending CI and exact deployment.

The prepared-work release also activates the reviewed fixed-shape Vale bush and wildflowers. Existing flora placement and gameplay geometry remain authoritative. User authorization on 8 October permits release of completed work; new image generation and unfinished assets stay paused.

## Camera comparison · prepared v0.8.101

Game and settings → Screen and performance offers original 100%, 150% and 175% camera framing. Default stays 100% pending Joel's selection; his likely preference is 150%. The renderer scales world presentation around the existing unobstructed hero anchor and applies inverse zoom to pointer mapping. The HUD, gameplay rules and campaign save schema remain unchanged. Camera settings persist independently for desktop and phone. Small-phone support is retired as recorded in DECISIONS.md.

Generation and asset replacement/publication stay paused. No source artwork, registration, processed image, terrain texture or rollback record changes in this pass. Existing Paladin art has an approximate opaque body footprint of 50×65 logical pixels at 100% (75×98 at 150%; 88×114 at 175%); the Goblin is approximately 38×49 (57×74; 67×86). These exclude transparent padding and use alpha >20; animation frames and device pixel ratio can change physical raster dimensions. Target generation budgets remain provisional until viewing-scale review.


## Selected camera framing · v0.8.102

Joel selected 150% on 9 October. Both desktop and phone now default to it; the original 100% and 175% remain optional. A new presentation-only preference key preserves old comparison choices for rollback and lets the finalized default take effect without changing campaign saves. World projection, inverse pointer mapping, hero anchor and gameplay distances keep the v0.8.101 implementation.

CAMERA_SPRITE_TARGETS.md records the selected visible body dimensions and physical raster budgets. Future images must be judged at 150%, with simple readable detail and enough raster pixels for the actual capped device ratio. Current accepted contracts and processing outputs remain immutable; implementing future higher-resolution replacements requires revising processing limits before production. All generation, replacement and further asset publication stay paused until Joel requests resumption.


## Sprite resolution housekeeping · v0.8.103

Joel requests housekeeping first, with artwork adaptation deferred. Explicit processing raster scale separates up to 576×576 output pixels from unchanged 192×192 logical display geometry; source enlargement, fractional pixel translation, inconsistent clips/variants and checkpoint overwrites reject. Existing records without density remain valid at 1×. Review tools exercise 150% with actual capped canvas ratios, physical PNG metadata and supported explicit desktop/phone profiles. Current production images/registrations/sources and gameplay remain unchanged.

Read SPRITE_RESOLUTION_HOUSEKEEPING.md and the source-readiness evidence. The inventory reports 33 active keys and 44 retained candidate records; current active originals and dependent Paladin frame sources have sufficient raster pixels. Active decoding remains 16 MiB/two concurrent decodes. Fixture verification covers high-density static/clip grounding, source/placement guards, immutable replacement and old-density rollback. Next production step is a Paladin/Goblin adaptation pilot after resumption is requested.

End-to-end 150% workflow audit: `SPRITE_WORKFLOW_AUDIT.md`. Developer publication now journals sprite/terrain registry pairs and validates retained sprite history. New planning captures use `sprite:request`; this does not resume image production.

## Resumed sprite production · 9 October 2026 02:08 EDT

Joel authorizes autonomous adaptation of retained sprites to 150%, followed by remaining body/texture generation, implementation, verification and publication. No further technical/appearance approval round required. Preserve all originals, checkpoints and rollback. Read the current production context; the `2026-10-09-150-adaptation` journal and evidence must accompany verified implementation. Earlier pauses are historical.

## Original-master export policy · 9 October 2026

Joel explicitly requests documenting the approach in GitHub. Read SPRITE_ORIGINAL_MASTER_EXPORT_POLICY.md before adaptation: use untouched generator outputs of accepted revisions for fresh 150% exports, never enlarge the smaller runtime exports. Audit older padded/resized masters; bypass detail-losing intermediates and carry only necessary placement metadata into the final export. Verify each original, sizing and grounding; review actual 150% game scenes and simplify/regenerate if detail still reads poorly. All originals, checkpoints and rollback remain preserved. This records the required approach; new export processing and candidates remain separate implementation work until verified and published.

## Regional arrival and burst defense integration · 9 October 2026

v0.8.105 implements region-entry points beside the arriving transport instead of inside the town, keeps the ferry landings and the authored road network reachable, and clears ordinary monster spawn homes around those entries without changing enemy counts. Crown hub travel uses the same entry contract. A shared rolling two-second enemy burst-compression curve now covers all hero and companion outgoing damage through `combat.damage()`; configuration remains in `rules.js`, while the transient per-enemy damage ledger is separate from saved state, rogue tactical threat telemetry, and rogue retreat protection. See [TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md](TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md) for exact tier constants, ownership, and regression contracts. This does not complete fort placement or the separate structure proportion pass.

## Inherited burst-defense tuning · 9 October 2026

The current v0.8.108 balance follows the doubled-curve request and the later exact tier redistribution. Knee/tail (fractions of target maximum HP): ordinary 0.675/0.875, guardian 0.475/0.625, ringleader 0.25/0.375 (previous captain), captain 0.145/0.24 (previous TRUE boss), normal boss 0.18/0.275, TRUE boss 0.18/0.275 (now matches normal boss). Unlike the original monotonic tier ordering, captains now have greater burst protection than bosses by explicit decision. This change is limited to tuning and tests, not companion AI; the existing rolling 2-second damage window remains intact. See [TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md](TRANSPORT_ARRIVALS_AND_BURST_COMPRESSION.md).

## Dynamic boss/ADDS squad doctrine · 9 October 2026

v0.8.109 preserves the player's existing BOSS/ADDS toggle, Paladin boss-focus default, and Mage/Ranger adds-first default. In ADDS mode, companions **ignore the boss whenever active non-boss threats or its live summons need clearing**; they fight the boss immediately once no such target remains and automatically resume add clearing on a new wave or active attacker. An owned new summon qualifies even before its aggro flag activates or it enters the usual companion local range. Explicit BOSS orders stay in force throughout the encounter, even if a boss temporarily drops out of the squad's threat list. A player-selected ADDS order likewise stays until disengagement or the user toggles; a full encounter end resets to each class default. No changes to boss summons, compression, classes, damage or formation geometry. Includes three-class target-selection regressions and corrected HUD tooltips.

## Enemy skill VFX overhaul v0.8.113

The observation-only bridge and restrained procedural art cover 251 live identities, with all normal/TRUE boss moves, captain skills/phases, ordinary/guardian/ringleader basics, ranged and night-exclusive attacks, and live rogue basics. The merged PR #146 repertoire is preserved, including all 40 signatures and role-specific basic maneuvers. See [ENEMY_SKILL_VFX_AUDIT.md](ENEMY_SKILL_VFX_AUDIT.md) for actual desktop/phone comparisons, lifecycle safeguards, snapshot equivalence and the shared sprite/clip replacement path. PRs #161 and #162 keep the event contract and completed art reviewable.

## Prepared v0.8.112 — shared enemy audio/VFX identities

Audio now consumes the existing stable stage envelope, with material/action, creature/faction and restrained important-cast motif routing. Thirty original short synthesized SFX recordings join the existing validated manifest and offline inventory; cold/missing playback remains procedural. Live VFX coverage is a build and regression acceptance gate, including future rogue signatures. See `ENEMY_AUDIO_SYNCHRONIZATION.md` and generated `ENEMY_AUDIO_COVERAGE.md`. This observation-only integration preserves combat rules and v4 save/statistics equivalence. Release requires exact-head full CI and Pages verification.

## Responsive HUD and contextual menu pass · v0.8.112

The desktop/phone presentation now keeps a compact HUD instead of the old broad permanent status window and centers smaller scrollable dialogs with a stable Back action. The palette changes to slate/teal and brass, while skill and movement controls keep their established sizes. Basic and Full Barracks share clear Company/Specialists/Operations groupings; the portable Inventory option is no longer duplicated in Full Barracks. Field Barracks placement remains a unique Adventure-menu action because building at the current field position cannot be delegated to an existing Barracks. The production CSS approval fixture is versioned separately from the historical v0.8.83 fixture. See `RESPONSIVE_UI_AUDIT_20261009.md`.

## Approved ergonomic UI refinement · v0.8.114

Phone: thumb-adjacent contextual Interact, stable Recall/Target/Squad grouping, clearer labels and notifications. Desktop: compact unlocked-skill hotbar, contextual Ranger commands and corrected camera anchor. Short interaction dialogs now use natural compact/regular widths and natural height under the same scroll limits. Inventory removes duplicate Recall and disabled support actions; Barracks Operations copy matches its real functions. The canonical supported minimum stays 375x800 CSS portrait/800x375 landscape; 360x780 is only a scaled best-effort fallback and does not govern the design or add device support commitments. See RESPONSIVE_UI_AUDIT_20261009.md. Draft branch only until review and CI.

## Enemy VFX quality audit v0.8.116

The follow-up audit corrects captain/species basic-hit semantics and Ridge Tyrant hammer feedback, observes actual motion/projectile lifetimes for replacement clips, suppresses stale persistent-area art after revival/reentry, preserves effects on failed travel, handles manifest reload races/failures and culls offscreen actor-local stages. The browser catalog now requires real contact for all 28 basic identities. Combat rules, merged rogue mechanics, audio recordings and v4 saves remain unchanged. See [ENEMY_SKILL_VFX_QUALITY_AUDIT.md](ENEMY_SKILL_VFX_QUALITY_AUDIT.md) for matched desktop/phone evidence and verification.

## Final audio/VFX audit · v0.8.117

Automatic TRUE/captain births retain their own authored summon/phase identities while another attack is winding up. Strict routing rejects unknown stages/personality layers; the expanded gate covers all 84 rogue basic identities and 40 signatures. Recorded foreground levels and the warning pair are corrected without changing gameplay. See [ENEMY_AUDIO_FINAL_AUDIT.md](ENEMY_AUDIO_FINAL_AUDIT.md) and its PR for exact candidate CI, published SHA and live desktop/phone verification.

## Keeper and feedback continuation · v0.8.118

The interrupted PR #185 is reconciled with the current audio/VFX release. Captive Keeper, optional live-rule Archive reference, evidence-gated reveal, TRUE escape/recapture, practical Controls, short status, truthful equipment confirmations and milestone notices are completed. Superseded 30-quest prose is excluded; selective narration remains held in draft #184. See QUEST_ARCHIVE_CONTINUATION.md for states and verification.

## Monster Forts territorial placement · v0.8.121

The agreed scope is a placement/garrison/accessibility pass over **13 existing territorial ordinary-monster holds**, not a new capture/reward/respawn feature. The Ironroot Wolf hunting ground moves outside caravan arrival clearance; Dark Crown's Ash-beast roost moves off impassable obsidian. New-only old-zone stronghold version migrations reposition already-visited markers and extant enemy homes without reviving dead garrisons. Highlands holds advance to v7, Crown holds to v8; the other regions keep v6. All combat, rogue, bosses, companions, tribute, player Barracks, authored regions, save v4, sprite/audio/VFX and populations remain the same. See [MONSTER_FORTS_TERRITORIAL_AUDIT.md](MONSTER_FORTS_TERRITORIAL_AUDIT.md) and tests/monster-forts.test.cjs.

## Cooldown-only functional release and balance audit · v0.8.119

PR #183 is merged and deployed at `48e2c0e2550c2735fcd45864f5d7aa75b85f9156`; release run 37978681773 passed all regression, browser, WebKit, deployment and exact published-build gates. Dormant MP, five-rank Cooldown Training and approved HP siphons/independent recovery preserve v0.8.118 main work and saves. See [COOLDOWN_ONLY_COMBAT_MIGRATION.md](COOLDOWN_ONLY_COMBAT_MIGRATION.md) for contracts and [COOLDOWN_BALANCE_AUDIT_20261009.md](COOLDOWN_BALANCE_AUDIT_20261009.md) for 810 benchmarks, 11,007 encounter trials, recommendations and limitations. The audit retains current cooldown/healing values; Ranger mobility and Dragon/Sentinel recovery tails require targeted human playtesting. Superseded #169 and older drafts #174/#182 must not be merged.

## Selective quest narration · integrated v0.8.120

The user-reviewed 30-quest selection remains authoritative: 12 quiet CHRONICLE passages and one high-priority finale milestone; 17 quests have no narrative card. Existing automatic rewards, quest states, v4 saves, combat notices, Keeper Archive and cooldown-only mechanics remain intact. The prose lives in narration.js, routed through the existing payQuest dispatcher and deferred by combat/menus. See AMBER_NARRATION_IMPLEMENTATION.md and source PR #184 for the approved text and validation.

## Spatial proportions and original-master tooling · prepared v0.8.122

Recovered the strictly presentation-only feature-scale and original-export preparation from PR #145 onto the latest v0.8.121 release. Runtime art targets are +40% for houses/workshops, +35% for entrances/transports/oppressive structures, and +30% for trees; ordinary actors and small props stay at prior world-scale. Existing low-density registered sprites are **not** enlarged. The sprite preparation pipeline supports 768/816 raster budgets and one-pass original-master normalization; no production artwork, material texture, image source, approval or rollback revision is changed. All five zone sizes and configured enemy populations remain unchanged, including the v0.8.121 fort migrations.

This is the **initial proportional presentation pass**, not a verified completed spatial-crowding audit, a whole-world art makeover, or completion of issue #160. See PROPORTION_IMPLEMENTATION_CHECKPOINT.md, WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md, and original art-production checkpoint in PR #145. Publish only after full CI and exact live Pages verification.


## Bounded ground projection · v0.8.124

Ground materials reuse a screen-aligned isometric repeat at the current physical Canvas scale. Original world phase, opacity and surface clips remain authoritative. A separate 8 MiB projected RGBA LRU cache supplements the existing 2 MiB source-image budget; eviction and manifest retirement release backing stores. Unsupported/oversized/non-ground transforms keep the original projection. Artwork, scene animation, gameplay and saves remain unchanged. See [MATERIAL_RENDERING_PERFORMANCE.md](MATERIAL_RENDERING_PERFORMANCE.md) for regression evidence, sampling tolerances and device-test limits.

## FPS-first outdoor floor reuse · v0.8.126

Joel explicitly favors FPS over moderate extra memory. The current outdoor floor is prepared once with a camera movement margin, within a separate 64 MiB RGBA cap. It supplements v0.8.124 material projection reuse. Only static base tiles/details are cached; roads, water, atmosphere, actors and effects remain live. Interiors release the picture and keep authored floor/clipping behavior. See [GROUND_WINDOW_PERFORMANCE.md](GROUND_WINDOW_PERFORMANCE.md) for measurements, memory and verification; publish only after required CI and live checks.

Joel additionally authorizes a 256 MiB decoded sprite-cache ceiling for continued artwork production (previously 16 MiB). The shared format and tooling active-memory policy agree; lazy loading, two concurrent decodes, LRU/pinning and per-resource/package limits remain unchanged. This is separate from the 64 MiB floor-picture ceiling and is not an upfront allocation.

## Session menu housekeeping · v0.8.127 candidate

Single-player menu pause remains. Explicit cooperative session selection separates running world simulation from blocked local gameplay controls. Nested NPC/Barracks dialogs validate current Campaign/actor, travel epoch, death, source availability and interaction range before actions and during frames; global journal/inventory remain independent. Cooperative policy cannot replace local runs or overwrite single-player saves. The integration hook is implemented and tested; actual Join/Host networking, second hero, shared persistence and combat slowdown remain future work. See [SESSION_MENU_POLICY.md](SESSION_MENU_POLICY.md). Release status is pending exact-head CI and deployment verification.
