# v0.8.84 engineering handoff audit

## Scope and identity

Implement the five-workstream handoff dated 8 October 2026. Preserve the accepted v0.8.83 game, controls, presentation, procedural canon and save compatibility. No production art, new gameplay, renderer replacement, accounts, telemetry or licensing changes are included.

- Baseline: `fd66875f5cbb68a291398652797aa0a31b68ed6f`, v0.8.83, clean current main at task start. An untouched worktree was retained for comparisons. Baseline format/check and all 34 non-browser suites passed. Baseline release CI: [37721012862](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/37721012862).
- Final gameplay/runtime source: `cea08fbe3fee10df245716ccbe70f07de0ae67fe`, v0.8.84. Subsequent changes synchronize a browser-test HUD, improve verification evidence, and correct current documentation; they do not change gameplay/runtime algorithms.
- Delivery branch and final release identity: [PR 110](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/110), `housekeeping-v0884`. Its head/merge metadata identifies the exact final revision. The delivery addendum in that PR records final CI, deployment SHA, build.txt and live smoke results. This document is the pre-merge technical audit; a merge is not evidence of a successful deployment.
- Focused commits separate formatting, balance ownership, progression extraction, save extraction, menus, fixture/packaging checks and audit corrections. Connector-created commit hashes differ from local checkpoint hashes; repository trees, rather than local author metadata, are the preservation boundary.

## Five-workstream acceptance

| Workstream | Implemented result | Evidence |
| --- | --- | --- |
| Current documentation | Recovery guidance, inheritance prices, input guidance and module owners match executing code. Historical release documents remain historical. | DECISIONS, README, in-game Controls, ARCHITECTURE and DEVELOPMENT_STATE; recovery/training regression suites. |
| Readable source | All hand-authored src/prototype JavaScript and shared/desktop/phone CSS use pinned Prettier 3.5.3 and npm format/format:check. | Semantic JS AST checks before/after formatting; parsed CSS order/values; native scene comparisons; browser CSS baseline fixture. |
| Balance configuration | rules.js owns grouped live values; existing combat/support tables stay there. Instructor skill ceilings derive from curriculum. Engine and menu prices use the same owner. | Ten original engine tables/constants compared directly with parsed baseline initializers, including order and indices; class/mode/action comparisons. |
| Coherent extraction | Progression, save handling and specialist/expedition menus have explicit dependencies and one authoritative Campaign state. | Stable instance/static APIs, focused suites after each move, current-run callback test, final full regression and browser gates. |
| Populated assets | Empty/populated registries validate, package, precache and serve offline. Failed/absent images retain procedural fallback. | Isolated valid PNG/JSON fixtures, deduplication, query URLs, activation, missing/fetch-failed installs, unsafe/missing packaging rejection and production-byte retention. |

Generated build-info.js is the only excluded campaign JS file. Its compact output is generator-owned and checked byte-for-byte by npm run check. All three entries and the service worker are regenerated. The public inventory has 30 campaign assets (including progression.js, save.js and menus.js) and 14 optional historical assets. No test fixture/image, audit file or temporary output is in deployment inventory. Production manifest remains byte-identical to baseline and empty; art approval rules are unchanged.

## Boundary review

Progression is the cohesive owner of hero growth, instructor curricula, discipline ranks/resets, Expedition support training, equipment, rewards and companion inheritance: 62 methods, about 641 lines. Save owns snapshot cleanup, validation/repair, restore, legacy rescue audit and v2 migration: five instance/static methods, about 856 lines. These domains were safer than moving tightly interleaved combat timing in the same pass. Their complete methods moved; the engine contains no wrappers duplicating those responsibilities.

Both domains install descriptors on the existing Campaign constructor/prototype, as world/navigation already do. They receive content/rules/classes and compatibility dependencies explicitly. Neither imports engine.js or browser APIs. Static validate/restore/migrate retain Campaign references, constructor behavior and descriptors. There is no second simulation state, circular dependency or storage owner. Browser persistence keys, Normal/Nightmare separation and original v2 backups remain in persistence.js.

The menu catalog owns 28 definitions/actions (about 1,266 lines), exposing ten shell entry points and keeping helpers private. It receives getGame, Campaign/content, open/close/action, Recall, map and finale services. Delayed actions read the current run at invocation, preserving the original dynamic game variable behavior. Back callbacks, action ordering, disabled states and service reachability remain covered by UI/browser tests. Settings/start/update lifecycle, input clearing, charge cancellation, map Canvas and frame scheduling stay in app.js.

Engine is about 5,601 lines versus 6,998 at baseline; app is about 2,027 versus 3,233. Those counts are consequences of responsibility movement, not acceptance targets. Combat, party AI, encounters and quest orchestration remain coupled in engine. Global/settings/lifecycle menus and map drawing remain in the shell. Further extraction needs similarly bounded comparisons; this pass does not claim complete decoupling.

## Balance comparison

[evidence/HOUSEKEEPING_EQUIVALENCE.json](evidence/HOUSEKEEPING_EQUIVALENCE.json) records before/after values and hashes. Existing rule/content serialization and ordering match baseline after excluding the added balance group.

| Group | Preserved contract |
| --- | --- |
| Class statistics | Paladin 120 HP/60 MP/18 Power/8 armor/300 speed; Mage 90/100/22/3/300; Ranger 105/70/20/5/320. Icons and class order preserved. Public Campaign.classes is the compatible balance reference. |
| Disciplines | Caps [5,5,5,3]; profiles Paladin 7/2/33/38, Mage 9/3/27/41, Ranger 8/2/29/41; public aliases remain shared. |
| Ordinary skills | Costs indexed 0..8: [0,0,15,10,25,40,20,45,60]; cooldowns [0,0.85,3,8,14,9,4,15,24]. Ceil(rank cost growth) and charged max-MP fractions remain unchanged. |
| Instructors | Skill ceilings 2/3/4/6/8 derive from the identical curriculum; Expedition ceilings 2/3/4/5/6 retain instructor order and missing-family zero/null fallbacks. |
| Pursuit | Burst 1.2 seconds ×1.5, opening mercy radius 300; engagement/timing logic unchanged. |
| Growth | XP threshold 120×current level; +25 hero HP per level; mana uses the existing manaBalance table. Rounding and ordering unchanged. |
| Equipment | Weapon prices [0,100,450,1000,2000], bonuses [0,15,35,55,70], reforge +5; armor prices [0,80,300,700,1200], bonuses [0,5,12,20,28], reforge +3. Reforge price remains ceil(price/2); validated slot/class fallbacks are unchanged. |
| Companions | Existing HP/armor bases, +12 HP/level and +10% vitality/rank. Town recruitment 70/100 differs deliberately from barracks 60/85. Active caps [0,2,3,3,4,5,6]. Treatment 30; fallen recovery 40; vitality 200; reset 250. |
| Barracks | First tutorial Basic camp free, later Basic 20, optional Full 100. Existing labor/Expedition gates remain unchanged. |

Historical weapon names/import mappings and migration numbers stay compatibility data. Procedural coordinates remain drawing data. Values were not frozen or cloned into per-Campaign state; existing public class/profile references retain their shared behavior. The moved lookup tables are read-only in executing methods. All algorithms, ordering, ceil/round/floor calls, defaults and formulas remain at their original owning actions. Death still removes ceil(20% of positive crowns), floors at zero and never creates debt. Auto/manual Ranger support remains enabled.

## Skeptical review findings and fixes

| ID / severity | Finding | Fix and validation |
| --- | --- | --- |
| F01 / medium | Current decisions incorrectly forbade companion recovery healing and listed superseded inheritance prices. | Verified executing Skill 3/Ranger logic and costs; corrected current prose/Controls only. Normal heals hero; charged heals hero and living active party; Ranger Heal supports living active recipients, Mana Recovery hero only; fallen recovery remains separate. |
| F02 / low | Sprite source-text coverage endpoint depended on compressed whitespace and overran the landmark owner after formatting. | Adjusted the exact endpoint to the formatted source; retained all decoration/landmark/settlement classification assertions and 231-entry canon partition. |
| F03 / medium | Engine-only event inventory would miss events moved into progression. | Audio contract test scans engine/world/navigation/progression/save and still requires every literal event's audible/silent decision. |
| F04 / medium | Packaging accepted a registered symlink pointing outside assets/sprites. | Reproduced acceptance in an isolated checkout; build now requires a regular file whose real path remains inside the sprite tree. Missing/unsafe paths and external symlink all reject. No service-worker update-policy change. |
| F05 / low | Expanded isolated registry test omitted the canon documents read by sprites.test. | Included docs in the temporary checkout. Both empty/populated sprite contracts and packaging pass. Finally cleanup and production manifest byte check run even on failure. |
| F06 / review constraint | Extracted callbacks could accidentally capture an obsolete run. | Kept invocation-time getGame access; an actual captured training action operates on a replacement Nightmare Ranger run without mutating the old run, and Back retains its injected identity. |
| F07 / low | Duplicate instructor ceilings and menu price constants risked future drift. | Derived skill ceilings from curriculum and used shared price tables without changing lookup values, indices or fallbacks. Focused training/UI and full comparisons pass. |
| F08 / low | Initial CSS screenshot test compared a stale HUD left by a prior restored test scene against refreshed labels. | Downloaded failure artifacts: changes were confined to bottom skill/recovery labels. Explicit updateHUD synchronizes state before frozen screenshot comparison; pixel equality remains strict. Final browser rerun is required. |

No identified gameplay/save regression is waived. Browser-test failures must be repaired and all final gates green before merge.

## Validation and evidence

Local environment: Node 24.19.0 (meets >=20), locked Prettier 3.5.3 via npm ci. CI uses Node 22, Playwright 1.62.1, runner Chrome and provisioned WebKit. Browser binaries could not be downloaded locally (invalid archive responses), so no local browser pass or physical iPhone/Chromebook test is claimed.

| Command/check | Observed result |
| --- | --- |
| Baseline npm run format:check, npm run check, npm test | Passed; 34 suites. |
| npm run build, npm run format:check, npm run check | Passed; generated graph, syntax/freshness and campaign inventory agree. |
| Focused tests after each engine/menu move | Passed: prototype, teacher curriculum, migration, rescue repair, platform/persistence, UI; 18-suite quick integration also passed. |
| Final npm test | Passed, all 36 non-browser suites, including new menus and asset-packaging suites. |
| node scripts/compare-housekeeping.cjs ../baseline | Passed: 243 live/transient/snapshot checkpoints plus cast timelines, content/rule ordering, ten baseline config tables, three parsed CSS trees and 20 pixel-identical native Canvas scenes. |
| Sprite, packaging and service-worker fixtures | Passed: two different valid PNGs, three exact registry entries including a duplicate image reference, empty/populated contracts, offline subpath/query reads, current-cache activation/unrelated retention, missing/fetch-failed installs, malformed optional JSON policy, anchored rendering and actual procedural fallback. |
| Chromium/WebKit browser matrix | Required on the final PR head. Initial extraction revision b08b81e passed both jobs ([37726970929](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/37726970929)); later WebKit passed while the new screenshot setup exposed F08. Final exact-revision outcomes belong in the delivery addendum. |
| Post-merge main-test, phone-webkit, deploy and live smoke | Required before successful release delivery. Verify live build.txt against the exact merge/deployment SHA and build-info.js version 0.8.84. |

The deterministic comparison uses independently seeded random streams and compares full live state including combo fields, projectiles, enemy telegraphs/motion, support effects, party actions, meaningful events/messages and normalized snapshots. It exercises Paladin/Mage/Ranger × Normal/Nightmare × Standard/Succession: movement/autoattack, ordinary Skills 1–8, charged 1–3, manual/automatic recovery, recall/reserve/fallen units, rescue/curriculum/Expedition gates, XP/disciplines/equipment/inheritance, enemy attacks, restore, death/successor and three class-specific legacy migrations. It does not rely only on cleaned snapshots that remove transient combat.

Native Canvas scenes cover all five regions and five main dungeons at 1280×800 and 375×812, identical camera/state/seed and fixed animation time. Scene hashes and checkpoint hashes are durable in the evidence JSON. Browser artifacts include `accepted-css-current-*`/`accepted-css-baseline-*`, standard campaign screenshots and WebKit phone screenshots in Actions. Browser CSS comparisons retain a baseline fixture of the accepted v0.8.83 styles, freeze simulation/render updates and refresh HUD before comparing exact screenshots. No screenshots redefine visual canon.

The full Chromium matrix covers desktop and six touch viewports, capability selection/hybrid overrides, narrow-desktop identity, menus and Back, charges/rebinding, manual movement takeover, compact HUD, Recall/Interact, forms/scrolling, fresh/v4 reload, offline/cache upgrades and save retention. WebKit covers five portrait/landscape phone sizes and native pointer delivery. Isolated storage is used; no real player's saves are cleared.

## Limits and recovery

Passing tests support this bounded maintenance claim, not every possible campaign state or device. Thumb comfort, iOS system gestures, physical Chromebook performance and every artistic map detail remain unmeasured by emulation. Production manifest stays empty; synthetic fixture success does not approve future art. Registered-image failures reject service-worker installation and leave the previous worker/cache usable; malformed optional JSON keeps existing procedural installation behavior.

The recovery reference is the baseline release until final Pages/live verification establishes the PR 110 merge as known good. Inspect the PR and Actions, then compare live build.txt; never infer completion from the last streamed message. If a released regression is found, make a focused corrective PR or revert only this change through normal checks, preserving newer commits and all storage keys/backups. Do not force-push main or clear player data.
