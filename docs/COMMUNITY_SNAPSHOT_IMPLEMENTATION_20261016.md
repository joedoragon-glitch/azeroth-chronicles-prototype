# Community Snapshot implementation — 16 October 2026

**Status: SOURCE-READY FOR OWNER-AUTHORIZED VALIDATION. UNBUILT, UNTESTED, NOT RELEASE-READY.** No runtime correctness, balance, native-size visual quality, performance or offline result is claimed.

Branch: `feature/community-snapshot-post308-20261016`.
Predecessor: PR #308 merged as `6bc27be31792b1c38147d61e98ceed6acf3e2560` (source `8aeb0fb3df63b21817e6e6be4c4e8f2f4376b7b1`). Preparation `13035bc0d804ac49f576ac4a2b6edd7d07c44e5f` added only the three handoff/audit/catalog files; they were brought onto merged main without importing older runtime code. First recoverable implementation checkpoint: `69f40cc45bab5132dea02ebfa3696fcf8099928b`. The current branch's next source-checkpoint commit contains the complete source candidate described here; obtain its exact SHA from the branch head/final handoff.

## Implementation delivered in source

- **Eleven collectible pets:** exact `pet` plus vetted `petFamily`; one shared pet owner extending the existing party. Distinct names, chibi procedural bodies, two capped boss-inspired moves each, ordinary attacks and brief control/self-defense. No summoning, new sprites, enemy-AI reuse or additional party capacity.
- **Permanent historical entitlement:** existing `s.true` owns unlocks, including old wins. First real TRUE defeat announces once. Any completed Barracks → Company → Boss pet collection exposes all eleven locked/recruitable/active/resting/fallen states and concise move details. Recruitment is a separate free atomic action; troops retain their queue.
- **Existing lifecycle:** active/reserve caps, 200-unit reservations, unique recruited family, exact names, role-aware separate formation positions, common navigation/doctrine/charge interruption/cooldowns/Slow/Silence, shared level/Vitality/Expedition HP/damage/armor and Ranger care. Pets perform no labor or Archer-only support. Resting/fallen pets remain in the roster; recovery keeps family/individual ID and dismissal cannot generate free health. Pet armor is explicit in normal hits and Mirejaw held-roll calculation.
- **Troop improvements:** at Expedition 4 a successful Soldier Power Strike grants a brief nonstacking self-ward; Rangers can cover their existing retreat with a ready Triple Shot whose first arrow applies brief Slow on contact. Existing base HP/damage, 8/12s cooldowns, immunity, Ranger care, charge/interruption and hero systems remain.
- **Procedural audit/art:** 367 source cases, all 33 current illustrated identities preserved, targeted anatomy revisions across six creature families and shared wolf/crocodile/dragon boss bodies, nine regional structure families and ten repeated props. Eleven separate pet art candidates and design handoffs. Maps/collision/layout/encounters remain untouched. Native desktop/phone appearance is pending, not inferred from source.
- **Safe performance:** identity-invalidated WeakMap reuses the exact presentation phase hash. No extra Canvas, retained pixel cache or saved store. Existing environment/loading/audio/PWA optimization work is retained. Current combat/AI cost hypotheses are documented, with no combat/AI performance optimization implemented.
- **Information/compatibility:** existing collection/group/recovery menus, Keeper shelf/live figures and veteran teaching updated. v4 recognizes only entitled unique pets and explicit troop queues; missing historical detailed victory history is reconstructed from existing validated facts. Module graph and independent audio audition graph include pets.
- **Deferred checks authored:** all-eleven lifecycle/skill/save/menu/charge cases, veteran protection/retreat cases and native pet/scene browser fixture. Existing domain ownership coverage extended. Both required Chromium/WebKit gates include the new browser fixture. No existing release check was removed; exact source receipts retain older provenance and add a closed Community overlay plus 26 frozen #308 files. These tests have NOT RUN.

## Deliverable index

- [Art census and justified changes](COMMUNITY_SNAPSHOT_ART_AUDIT_20261016.md) and `tools/community-snapshot/procedural-art-inventory.json`.
- [Companion/pet tuning and required observations](COMMUNITY_SNAPSHOT_BALANCE_20261016.md).
- [Safe rendering work and separate combat/AI assessment](COMMUNITY_SNAPSHOT_PERFORMANCE_20261016.md).
- [Exact authorized source contract](COMMUNITY_SNAPSHOT_SOURCE_CONTRACT_20261016.md).
- [Single overnight integration/validation checklist](COMMUNITY_SNAPSHOT_VALIDATION_20261016.md).
- Original [handoff](COMMUNITY_SNAPSHOT_POST308_HANDOFF_20261015.md), [twelve-finding independent audit](COMMUNITY_SNAPSHOT_PREPARATION_AUDIT_20261015.md), and inert `tools/community-snapshot/pet-roster-draft.json` retained as preparation evidence. Runtime tuning lives in rules, not the draft.

## Audit disposition

| Finding | Source action | Evidence still required |
| --- | --- | --- |
| F01 combat fallback | Explicit pet dispatch and shared skill adapter; unknown types do not fall into Soldier attacks | Actual ticks, doctrine, death/cancellation |
| F02 art fallback | Exact procedural pet path; pet sprite lookup empty | Eleven native silhouettes/facing/grounding |
| F03 save/growth/recovery | Discriminator/family validation, same growth/armor, family-preserving recovery | Historical and new v4 round trips |
| F04 queue/names | Atomic collection admission, troop-only queue, exact pet labels | Menu/refusal/cap/queue interactions |
| F05 entitlement/duplicates | `s.true`, one roster instance, retained resting/fallen pet, no free dismissal heal | First/repeated/developer wins, old history and recovery |
| F06 formation/support | Six distinct pet positions, ranged pet screening, no labor/support impersonation | Mixed party movement and recovery |
| F07 troop tuning | Existing immunity/healing/growth/charge accounted for; narrow veteran changes | Matched actual survival and balance observations |
| F08 draft concepts | Ally-sized capped abilities, no boss AI/hazards/summons | Per-move behavior and final tuning |
| F09 learning | Permanent collection states, unlock notice, Keeper/live figures | Discovery on phone/desktop and final TRUE/postgame |
| F10 performance | Prior work reviewed; pure hash memo, no duplicate environmental cache | Current full-frame/resource evidence |
| F11 comprehensive graphics | 367-case source census and per-design preservation/deferred review | Native-size case-by-case aesthetic acceptance |
| F12 honest integration | No prohibited execution; checks added and final checklist prepared | Owner authorization, full exact-tree validation, separate release approval |

No finding is marked runtime-verified by this source record.

## Incoming issues register

| ID | Origin | Disposition |
| --- | --- | --- |
| CS-001 | Engineer source inspection during historical-pet work: validator accepted absent `s.victories`, later victories wrote into it | Rebuild the existing map from validated Normal/TRUE facts when absent; new history tests authored, not run |
| CS-002 | Preparation F04: unknown queue type could silently create Soldier | Explicit train/save whitelist; absent historical queue retains Soldier compatibility; pet recruitment separate |
| CS-003 | Pet adapter source review: a ranged pet could hold troop range beyond its shorter special reach | Pet approach range considers its two skill ranges while using existing ranged navigation helper; native/live result pending |
| CS-004 | New module dependency review: independent audio audition page has an explicit script graph | Add pet owner there and to shared inventory; domain graph test extended, not run |
| Owner-supplied new issues | No additional bugs supplied in this session | Keep incoming corrections within this branch and consolidated update |

## Exact non-execution and next action

No game code was executed; no test, build, syntax-check command, simulation, browser validation, benchmark, CI workflow, PR, merge or deployment was initiated. Source reads, file edits, formatter **write-only** processing, Git metadata/commits and source-hash receipt authoring were used. Formatter output is not correctness evidence. Existing workflows trigger only main pushes or PR/manual events; this branch was preserved without a PR or workflow dispatch.

Package/lock version, generated entries/build-info and worker still represent #308. This is deliberate under the owner's no-build instruction. Source inventory and the audition graph are updated; version/regeneration must happen first inside the authorized cycle, before any playable/release-ready claim. No complete validation evidence transfers from #308.

**Next action: obtain owner authorization for the one combined overnight validation cycle, including version/build regeneration, full existing gates, new pets/companion/visual checks, matched balance/performance, historical saves and PWA/offline. Fix demonstrated issues in this update and preserve exact final evidence. Then request separate merge/release authorization.**
