# Community Snapshot implementation — 16 October 2026

**Status: FOLLOW-UP SOURCE AUDIT PASSES — AWAITING OWNER VALIDATION AUTHORIZATION. UNBUILT, UNTESTED, NOT RELEASE-READY.** The [second source audit](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md) addresses all seven findings from the [failed audit](COMMUNITY_SNAPSHOT_EXECUTION_AUDIT_20261016.md). Corrected runtime is frozen at `754e72e9cb5819bb815fde97488d44275e870453`; the final audit checkpoint adds reconciled references, this verdict and documented acceptance-fixture corrections without changing runtime. Validate the final branch head identified in the handoff, not the rejected original. No runtime correctness, final balance, native appearance, performance or offline result is claimed.

Branch: `feature/community-snapshot-post308-20261016`.
Predecessor: PR #308 merged as `6bc27be31792b1c38147d61e98ceed6acf3e2560` (source `8aeb0fb3df63b21817e6e6be4c4e8f2f4376b7b1`). Preparation `13035bc0d804ac49f576ac4a2b6edd7d07c44e5f` added only the three handoff/audit/catalog files; they were brought onto merged main without importing older runtime code. First recoverable implementation checkpoint: `69f40cc45bab5132dea02ebfa3696fcf8099928b`. The failed-audit documentation is preserved at `006e5056470a335df2cad29619fce0e50eee0627`. First repair checkpoint `06edf70470c507b5da5246fa27e3b779e64382f1` preserves intermediate work; `754e72e9cb5819bb815fde97488d44275e870453` freezes the corrected runtime and supplies the current immutable art reference. Use the final source-audit record for the exact integration candidate.

## Implementation delivered in source

- **Eleven collectible pets:** exact `pet` plus vetted `petFamily`; one shared pet owner extending the existing party. Distinct names, chibi procedural bodies, two capped boss-inspired moves each, ordinary attacks and brief control/self-defense. No summoning, new sprites, enemy-AI reuse or additional party capacity.
- **Permanent historical entitlement:** existing `s.true` owns unlocks, including old wins. First real TRUE defeat announces once. Any completed Barracks → Company → Boss pet collection exposes all eleven locked/recruitable/active/resting/fallen states and concise move details. Recruitment is a separate free atomic action; troops retain their queue.
- **Existing lifecycle:** active/reserve caps, 200-unit reservations, unique recruited family, exact names, role-aware separate formation positions, common navigation/doctrine/charge interruption/cooldowns/Slow/Silence, shared level/Vitality/Expedition HP/damage/armor and Ranger care. Pets perform no labor or Archer-only support. Resting/fallen pets remain in the roster; recovery keeps family/individual ID and dismissal cannot generate free health. Pet armor is explicit in normal hits and Mirejaw held-roll calculation.
- **Troop improvements:** at Expedition 4 a successful Soldier Power Strike grants a brief nonstacking self-ward; Rangers can cover their existing retreat with a ready Triple Shot whose first arrow applies brief Slow on contact. Existing base HP/damage, 8/12s cooldowns, immunity, Ranger care, charge/interruption and hero systems remain.
- **Procedural audit/art:** 426 specifically reviewed renderer contracts/aliases, all 33 current illustrated identities preserved, targeted anatomy revisions across six creature families and shared wolf/crocodile/dragon boss bodies, nine regional structure families and thirteen repeated/scenic prop contracts. Eleven separate pet art candidates and per-design handoffs for all 32 upgraded existing contracts. A02/A04/A07 corrections distinguish reachable branches, aliases, explicit retention reasons, actual capture fixtures and immutable references. Maps/collision/layout/encounters remain untouched. Native desktop/phone appearance is pending, not inferred from source.
- **Safe performance:** identity-invalidated WeakMap reuses the exact presentation phase hash. No extra Canvas, retained pixel cache or saved store. Existing environment/loading/audio/PWA optimization work is retained. Current combat/AI cost hypotheses are documented, with no combat/AI performance optimization implemented.
- **Information/compatibility:** existing collection/group/recovery menus, Keeper shelf/live figures and veteran teaching updated. v4 recognizes only entitled unique pets and explicit troop queues; missing historical detailed victory history is reconstructed from existing validated facts. Module graph and independent audio audition graph include pets.
- **Deferred checks authored:** all-eleven automatic attack, lifecycle/skill/save/menu/charge cases, range/retreat/wall routing, Slow and covered collateral, veteran protection/retreat cases, a matched #308/candidate balance runner and separately saved native art/pet/charge/UI contexts. Existing domain ownership coverage extended. Both required Chromium/WebKit gates include the new browser fixture. No existing release check was removed; exact source receipts retain older provenance and add a closed Community overlay, appended five-file source-repair receipt and 26 frozen #308 files. These tests have NOT RUN.

## Deliverable index

- [Follow-up source audit and exact evidence](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md).
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
| F06 formation/support | Six distinct pet positions, stopping-margin/clear-line pet firing destinations, ranged screening, no labor/support impersonation | Mixed party movement and recovery |
| F07 troop tuning | Existing immunity/healing/growth/charge accounted for; narrow veteran changes; matched late-game runner authored | Matched actual survival and balance observations |
| F08 draft concepts | Ally-sized capped abilities, no boss AI/hazards/summons | Per-move behavior and final tuning |
| F09 learning | Permanent collection states, unlock notice, concise shape/range and detailed Keeper geometry/live figures | Discovery on phone/desktop and final TRUE/postgame |
| F10 performance | Prior work reviewed; pure hash memo, no duplicate environmental cache | Current full-frame/resource evidence |
| F11 comprehensive graphics | 426 drawing-contract source observations with branch evidence, explicit aliases and reconciled per-design references | Native-size case-by-case aesthetic acceptance |
| F12 honest integration | No prohibited execution; checks added and final checklist prepared | Owner authorization, full exact-tree validation, separate release approval |

No finding is marked runtime-verified by this source record. The first failed audit is historical; the follow-up audit passes source readiness, and every runtime obligation remains open until authorized evidence exists.

## Incoming issues register

| ID | Origin | Disposition |
| --- | --- | --- |
| CS-001 | Engineer source inspection during historical-pet work: validator accepted absent `s.victories`, later victories wrote into it | Rebuild the existing map from validated Normal/TRUE facts when absent; new history tests authored, not run |
| CS-002 | Preparation F04: unknown queue type could silently create Soldier | Explicit train/save whitelist; absent historical queue retains Soldier compatibility; pet recruitment separate |
| CS-003 | Pet adapter source review: a ranged pet could hold troop range beyond its shorter special reach | A01 source repair: pet-only legal firing destinations include stopping margin and cover/corner handling; usable attacks continue during repositioning. Automatic boundary and real-wall cases authored, NOT RUN |
| CS-004 | New module dependency review: independent audio audition page has an explicit script graph | Add pet owner there and to shared inventory; domain graph test extended, not run |
| A01–A07 | Owner-requested execution audit of checkpoint `7581ed12d57e70e42bbaed6b8223bc8d4c709b22` | Addressed in source; [follow-up source audit passes](COMMUNITY_SNAPSHOT_SOURCE_REAUDIT_20261016.md). [Original evidence](COMMUNITY_SNAPSHOT_EXECUTION_AUDIT_20261016.md) preserved; [repair scope](COMMUNITY_SNAPSHOT_AUDIT_REPAIRS_20261016.md) and acceptance source remain untested |
| Owner-supplied new issues | No additional bugs supplied in this session | Keep incoming corrections within this branch and consolidated update |

## Exact non-execution and next action

No game code was executed; no test, build, syntax-check command, simulation, browser validation, benchmark, CI workflow, PR, merge or deployment was initiated. Source reads, file edits, formatter **write-only** processing, Git metadata/commits and source-hash receipt authoring were used. Formatter output is not correctness evidence. Existing workflows trigger only main pushes or PR/manual events; this branch was preserved without a PR or workflow dispatch.

Package/lock version, generated entries/build-info and worker still represent #308. This is deliberate under the owner's no-build instruction. Source inventory and the audition graph are updated; version/regeneration must happen first inside the authorized cycle, before any playable/release-ready claim. No complete validation evidence transfers from #308.

**Next action: request explicit owner authorization for the one consolidated overnight validation cycle, including version/build regeneration, existing gates, authored pet/companion/visual checks, matched balance, historical saves, performance and PWA. No execution or PR is authorized now. Merge/deployment need separate approval after required evidence passes.**
