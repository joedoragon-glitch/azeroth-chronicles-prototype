# SIBDLP Phase 2 sound-design assessment — P3: interaction and progression feedback

**State:** source-reviewed decisions about **new recorded effects, procedural improvements and intentional silence**, not implemented changes. **Date:** 16 November 2026. **Audited base:** `main@409f0ed671b0ff2563f788bf45ab665e01c05ca6`. **Third priority** after [P1 heroes/party/pets/Charmed](AUDIO_SFX_PHASE2_P1_HERO_COMPANION_PETS_CHARMS_20261116.md) and [P2 bosses/unique monsters](AUDIO_SFX_PHASE2_P2_BOSSES_ENEMIES_20261116.md).

## Existing presentation is not silence

`audio-catalog.js:eventNotes` holds **synthetic note patterns** for **40** named gameplay signals (do not equate key count with actual distinct WAVs). `audio-production.js` generates menu selection/confirmation/back/open/close/denied **synthesized interface tones**, material-dependent footsteps on grass/wet/gravel/stone/wood, and short natural scene details; **34** separate long recorded environmental beds are already in the manifest. All six `interface.*`, five `step.*` and six `ambience.*` recording event entries are currently empty by design. A large number of gameplay event keys likewise lack direct WAVs but may already sound procedurally. Empty binding is **not an audio defect**. Some real emitted events are intentionally only visual/telemetry and need no audio.

A targeted cross-source literal `event(...)` review found separate real emitters in `progression.js`, `rewards.js`, `engine.js`, `party.js` and `expeditions.js`. An event being emitted does **not** prove the current audio adapter forwards it, that its receipt is eligible to play, or that the full situation is player-accessible. Validate this at production before integrating a recording.

**Decision key:** **ADD** distinct short WAV warranted in principle; **LAYER** add physical transient over existing synthesis where gain/meaning require; **REFINE** prefer current procedural source redesigned before adding asset; **KEEP** current source/intentional silence; **INVESTIGATE** trigger or semantics require verification before a commitment. **A/B/C** denotes design importance, not issue severity. Proposed names below are *conceptual cues* and not guaranteed new event IDs.

## Actual player-relevant feedback matrix

| Player event or system | Source/route today | New acoustic identity assessment |
|---|---|---|
| Menu/select/confirm/back/open/close | `audio-production.js` short synthesizer, `interface.*` no direct WAV | **REFINE/A** consistent subtle wood/metal/soft bell UI family; selection must be ultra-light and throttle safely; do not turn browsing into percussion |
| Invalid menu choice / denied service | `interface.denied` synthesized; other `actionFailed` intentionally visual-only | **REFINE/A** quiet neutral nonverbal double-click, only when *action actually rejected*; no beep for every unavailable hover or pathfinding skip |
| Acquire/purchase an actual item | `progression.js:purchase`; current `eventNotes.purchase` synth | **ADD/A** modest transaction/gear placement cue, ideally sound based on item or service *only if the receipt carries correct type*, not one new event per vendor |
| Pick up crowns/loot | `engine.js:gold` synthetic; loot subsystem may aggregate | **ADD/A** compact coin-pouch chink for actual pickup, dynamically lower emphasis for repetitive combat drops; don't repeat per crown |
| Learn a skill | `progression.js:learning` synthesized | **ADD/A** unique restrained realization/notation cue, different from purchase and level-up, once after successful acquisition |
| Upgrade a skill/equipment | `progression.js:upgrade` synthesized; equipment crafting/reforge need specific producer confirmation | **LAYER/A** mechanical ratchet or smith hammer accent *only on verified corresponding action*, not an invented global forge event |
| Level advancement | `progression.js:level` synthesized | **ADD/A** concise rising achievement sting without overlapping combat danger or score's harmonic identity |
| Quest completion/reward | `rewards.js:questComplete` and `quest` both emitted | **ADD/A** one short semantic completion/fanfare-like punctuation, **deduplicate** the back-to-back two receipts; avoid level-up sound clone |
| Barracks construction completed | `party.js:construction` synthetic | **ADD/A** satisfying timber/stone assembly/fastened-door finish, once per *completed* stage; no audible construction loop on each work tick |
| Barracks upgrade completed | `party.js:barracksUpgrade` synthetic | **LAYER/A** stronger reinforcing join/metal latch, different from construction; do not sound a finished full Barracks while still in progress |
| Recruit Soldier/Archer | `party.js:companionRecruitment` emitted, not among `eventNotes` | **ADD/A** friendly kit/strap acknowledgement with subtle role differentiation, **requires explicit binding or supported audio adapter**; verify actual recruitment success |
| Recruit TRUE pet / move to active roster | `party-pets.js` recruitment changes roster, but this assessment did not find a dedicated `petRecruitment` audio event | **INVESTIGATE/A** one subtle new pet-joining acknowledgment using a real successful state receipt; **do not invent an event automatically** |
| Successful Rogue Charm | Hero `rogueCharm` cast/companion capture; Rogue jingle has real owned cues | **LAYER/A** one brief resolution affirmation only after successful authentication/capture; not per attempted Charm, and separate from normal spell contact |
| Charmed elite/Ringleader training | `progression.js:charmRingleaderTraining` emitted, not in main note catalog | **ADD/B** discreet training/crest click if actual route reaches audio; not a combat ability sound |
| Companion queue/assignment/recovery | `party.js:companionQueueChanged`, `companionRecovery` emitted, not note catalog | **ADD/B** lightweight roster-order clasp + real successful recovery acknowledgment; no repeating status updates |
| Companion/squad doctrine and recall | `party.js:squadDoctrine` and `squadRecall` already have synthesized notes | **LAYER/B** short distinct command and regroup signatures, suppress crowd-wise duplicates; no military alarm for common recall |
| Companion vitality and Ranger support training | `progression.js:companionVitality`, `rangerSupportTraining` with synthesis | **LAYER/B** small restoring/kitted-up flourish and crisp training cue; reuse semantic upgrade family |
| Expedition rank/support upgrades | `progression.js:expeditionRank`, `expeditionSupport` synthetic | **LAYER/B** concise authority/party-organization chime, reuse rank family, not unique full fanfares |
| Resource expedition start/return | `expeditions.js:resourceExpeditionStarted/Returned` emitted, not note catalog | **ADD/B** outgoing pack/clasp and returning cargo-set-down/ledger acknowledgement **only on successful outcomes**; no idle-repeat travel audio |
| Trade/supplies and resupply | `engine.js:supplies` synthesized, distinct commerce cases require source checks | **LAYER/B** small cloth/bag rustle on actual supply handoff, reuse item-acquire family |
| Rest/heal resource restoration | `engine.js:rest`, `finalRest`, `heal` already synthesized | **REFINE/B** soft relieved breath/cloth movement, distinguish combat heal from refuge rest; don't layer repeated healing tones for every healed ally |
| Location/world transition | `engine.js:travel` synth; score/environment director separately transitions | **REFINE/B** restrained wagon/ferry/platform confirmation if actual transport type known; NEVER replace 84 song cues or record background travel music |
| Discover tributary/resource | `engine.js:tributeDiscovery` synthesized | **LAYER/B** brief rustle/ore/coin find; one discovery cue, not an ambient resource loop |
| Discover interior/cellar | `engine.js:sideInteriorDiscovery` synthesized | **ADD/B** quiet unique threshold/reveal, separate from routine door menu open |
| Clear mini-dungeon | `engine.js:miniClear` synthesized | **LAYER/B** compact completion cue vs full boss/quest milestone |
| Rescue specialist | `engine.js:rescue` synthesized | **ADD/B** delicate physical key/lock release + warm success affirmation; should not imply chains/locks if a particular rescue lacks them |
| Choose Dungeon Master/special assignment | `engine.js:dungeonMaster` synthesized | **LAYER/B** formal small ledger/seal sound only on confirmed assignment |
| Build specialist orders and advanced progression | `engine.js:throneClaimed`, `criticalCodex`, `finalRest` and other late events | **INVESTIGATE/B** rare meaningful resolution only where exact implementation forwards event; don't introduce new endings, dialogue or unlocks |
| Boss defeat, Awakening, TRUE victories | `engine.js:bossDefeat`, `awakening`, other encounter cues synth; score changes independently | **REFINE/B** one very short victory/stage confirmation if audible under score, not extra boss-themed song; coordinate with P2 and true pet unlock |
| Peace/finale and Succession death | `peace`, `death`, `gameOver`, `successor` exist; recorded **Finale/Defeat music** has separate stateful ownership | **KEEP/A:** preserve musical transitions and intended mode outcomes; don't stack success/game-over SFX as if every death terminates the campaign |
| Equipment inventory/selection/compare | Menu and action paths vary; no verified universal committed equipment-change audio producer here | **INVESTIGATE/B** light cloth/metal lift/fasten *only* if selecting actual item, not per-hover or text redraw; no new event based on assumptions |
| Door opening, usable objects, field gather | Multiple location/menu state paths, no single confirmed global action receipt in inspected sources | **INVESTIGATE/B** tactile wood/iron/gather accents conditional on *real* interaction completion; do not emit sounds merely because art displays a door/resource |
| Talent reset | `progression.js:talentRespec` synthesized | **LAYER/B** reversible reconfiguration cue, distinct from character death/reset |
| Protection/ward shield, status notifications | Real combat sources already synthesize and surface badges | **KEEP/C** do not make every status change audible; only strong defensive actions under P1/P2 where causally useful |
| Failure / attack placement / archive knowledge | `actionFailed`, `attackPlacementFailed`, `archiveKnowledge` intentionally non-audible in `audio-catalog.js` | **KEEP/C:** stay silent unless a separately approved accessibility requirement justifies meaningful one-shot feedback |

### Interface six keys

The known interface event keys are `select`, `confirm`, `back`, `denied`, `open`, `close`. They already synthesize differentiated patterns on the interface bus; a **single coherent, subtle physical UI palette** is the design recommendation, **not six mandatory WAVs**. The active menu/page must be foreground and unlocked for playback; action/result correctness and throttles are higher priority than sonic ornament. Settings sound volume, mute, the language menu and pause safety continue to operate.

### Footsteps and scene details — do not mistake environment for missing effects

Five surface-based footstep keys already originate from movement **distance** in `audio-production.js`: `step.grass`, `step.wet`, `step.gravel`, `step.stone`, `step.wood`. They are synthesized, stage-gated, and must not play while blocked against a wall. **REFINE/C:** compare current believable weight, wetland vs stone articulation, and repetitive fatigue before adding layered foley. Need not create 5 new WAVs as a quota; physical footstep recordings are useful only if smooth cross-surface gameplay justifies bandwidth and voice load.

Six occasional environment-detail event keys (`ambience.water`, `birds`, `insects`, `settlement`, `drips`, `metal`) have procedural detail fallback and the separate already-recorded **34 environments**. **KEEP/C:** retain as scene details or improve synthesis only after checking for duplicated natural beds. They do not belong to Phase 2's interaction-feedback asset quota. Environmental ambience and soundtrack modernization are different completed programs; do not reopen them by default.

## Proposed compact family architecture

1. **UI/touch** (A): one light selection/confirm/denial palette; refine synth first, optional short switch/latch recordings.
2. **Reward/acquisition** (A): coin acquisition, item purchase/forging, level/skill learning, quest completion (one receipt each).
3. **Company management** (A/B): Barracks building/upgrade, recruitment, recovery, role training and expedition/recall management; controlled reuse of one cohesive wood/metal/leather/ledger toolkit.
4. **Discovery/exploration** (B): rescue, interior first entry, tribute discovery, travel arrival and rare dungeon clear. Avoid semantic confusion between discovery, purchase and quest completion.
5. **Rare ending/milestone** (B/C): support major act completion *beneath* the existing score and event owner, not as parallel music; match actual death/TRUE/Succession logic.
6. **Optional realism** (C): footsteps and real-world service/doors/objects only after actual event source and A/B demonstrate improved clarity.

This is a **family-oriented production architecture**, not a binding count or signed-off list of recordings.

## Practical production/QA requirements

- Confirm that each player action commits successfully and inspect its **real emitted `Campaign.event` type and metadata**. If an event is emitted without a supported audio key, design a narrow explicit mapping only with event ownership and tests; do not register an orphan `eventGuide` or trigger based on visual state polling.
- Check **`questComplete` + `quest`**, **`companionRecruitment` + purchase**, **`barracksUpgrade` + construction**, and **pet unlock + bossDefeat** to avoid two simultaneous celebratory confirmations of one outcome.
- Apply normal audio priorities: critical enemy warning owns the foreground; menu acknowledgement stays interface-bus, gameplay progression effects stay effects-bus; rare milestone levels can be brighter but no clipping or masking. Repeated gold, heals, footsteps and UI selection need stricter cooldowns than rare discovery.
- **Cold first occurrence:** no delayed/ghost confirmation after the item is already used; recorded assets fail back immediately to existing synth. All new recordings need exact hashes, provenance, no-voice/license compliance, EN/ES friendly descriptive Sound Library labels, metadata, rollback and optional original/candidate comparison under the existing library, not a second showroom.
- Reconcile saved preferences, browser autoplay, iPhone/Chromebook physical speakers and mute/accessibility; avoid touching persistence or adding per-effect save schema. Audio is *feedback only*: never grant rewards, fail transactions or trigger progression.
- **Evidence ledger:** event emitted and sound existing = **source-verified**; audio adapter delivery/player-ear quality = **unverified** without tests; Phase 2 candidate = **proposed**; intentional silence = **keep**; new sound files, browser/device test and player acceptance = **not yet performed**.

## Primary evidence anchors

[Procedural progression sounds](../src/prototype/audio-catalog.js) · [Effect routing and deliberate-silence rules](../src/prototype/audio-effects.js) · [Interface footsteps and scene details](../src/prototype/audio-production.js) · [Actual progression](../src/prototype/progression.js) · [Quest rewards](../src/prototype/rewards.js) · [Campaign world/transport/recovery](../src/prototype/engine.js) · [Companion/Barracks/events](../src/prototype/party.js) · [Pets](../src/prototype/party-pets.js) · [Expeditions](../src/prototype/expeditions.js) · [Recorded director and 34 environmental beds](../assets/audio/manifest.json) · [SFX modernization issue #877](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/877).

**Release boundary:** no audio file, gameplay logic, UI text or existing song/ambience was modified by this assessment.
