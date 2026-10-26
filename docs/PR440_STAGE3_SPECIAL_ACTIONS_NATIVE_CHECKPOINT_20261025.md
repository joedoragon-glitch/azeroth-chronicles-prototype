# PR #440 — Stage 3 native World special-action checkpoint

> **LATEST VERIFIED Stage 3 checkpoint — 25 Oct 2026, source `3a7304ad`:** Scornfang's paired **Hot Zone** (`world/captain/supply-vale/4`) now rolls once across both original warnings/four area patches, sharing an immutable release receipt while leaving the original persistent floor hazards, warning durations, coverage, immunity, and cancellation behavior intact. [Exact-head CI #40230844108](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40230844108) **PASS: 41 relevant focused test files + reproducible offline-ready build.** [Conventional line charges CI #40230018273](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40230018273) previously **PASS: 40 files + build**. Current source: **93 Party keys; 18 World keys; 11 of 21 captain entries integrated**. Remaining captain entries: Direjaw Mud Pumping (#2), Crag Tyrant Margin Call (#1), Cinder Warlord Violation Marker (#1), and all seven Dreadmaw specialist actions (**10 total**). All eleven boss families' authored specials also remain. Earlier 11/13/17-key counts below are dated historical evidence. [Cross-PR overlap audit](PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md) still applies; source integration with #464/#458 **not yet performed**. **Critical feature OFF; PR #440 draft, unmerged, unpublished; no hardware/full-suite/save/balance certification.**



> **VERIFIED Stage 3 continuation — 25 Oct 2026, source `1f155215`:** The four conventional captain line-charge owners (Scornfang Selective Deconstruction, Direjaw Flow Sliding, Crag Tyrant Hostile Takeover, and Cinder Warlord Compliance Charge) are now implemented in the SAME dormant draft. [Exact-head focused CI #40230018273](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40230018273) **PASS: 40 relevant test files + reproducible offline-ready build**, including real path/contact with two victims, all three levels, immunities, cancelled casts and no-critical parity. This raises the verified explicit World registry from 13 to **17 keys**, and conventional captain coverage from 6/21 to **10/21 entries**. **11 captain entries remain:** Scornfang Hot Zone (#4), Direjaw Mud Pumping (#2), Crag Tyrant Margin Call (#1), Cinder Warlord Violation Marker (#1), and all seven Dreadmaw specialist attacks. All 11 boss families' authored specials also remain. **Crits OFF, PR draft, unmerged, not deployed.** The dated tables below are historical snapshots and must not replace this newer checkpoint.


> **LATEST CROSS-PR AUDIT / STAGE 3 CHECKPOINT (25 Oct 2026):** [PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md](PR440_STAGE3_CROSS_PR_COMPATIBILITY_AUDIT_20261025.md). Stage 3 now has **13** explicit World native owners; Scornfang tracking 4-shot one-receipt and one-patch Encapsulation/hazard separation passed [CI #40228319164](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40228319164) (38 tests+build) and [CI #40229006095](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40229006095) (39 tests+build). Only two other open PRs share source filenames: **#464 (four combat/party files; semantic merge REQUIRED)** and **#458 (engine.js; context-clean source patch but not jointly tested)**. No drafts combined, merged or published, no features enabled. Earlier 11-key counts below are historical.


**25 October 2026.** This is the current authoritative handoff for the resumed Stage 3 work, superseding the earlier [Stage 2 → Stage 3 baseline](PR440_STAGE2_GATE_STAGE3_NATIVE_HANDOFF_20261025.md) only as to additional source progress. All work is consolidated in **[draft PR #440](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/440)** on `design/critical-executions-codices-20261024`. **No release, merge, publication, broad matrix or feature activation is authorized.** The old single-HTML portability constraint does not apply to this multi-file PWA.

## Exact source status

Stage 2: **93 registered native Party actions** remain on this PR after merging then-current `main` `e3c78266b28f3325d2afdcb76ae849fcff306deb` into the draft at `2946ba00`. Party action tests and exact-reconciliation focused CI are green. This is an engineering source gate, **not** RNG seed/save, balance, device or performance certification.

Stage 3: **11 explicit World-domain action keys** in `src/prototype/critical-levels.js`; independent opt-in World chance baseline 10%, three World intensity levels, and absolutely no catch-all special damage key. `src/prototype/critical-world-native.js` is test-only attached. Production session/manifest has **not** been activated.

| Authored World action key | Native owner and committed release | Native original consequence changed on a critical |
| --- | --- | --- |
| `world/basic/melee` | `boss-combat.js::enemyStartBasic` real swing | Existing strike damage only |
| `world/basic/ranged` | `engine.js::updateEnemies`, after legal aimed shot line | Existing projectile damage; immutable receipt carried to impact |
| `world/support/heal` | `engine.js::enemySupportHeal`, first eligible treatment | Same healing budget and recipients, faster completion (`healTempo`); original cooldown |
| `world/night/wraith-drain` | `boss-combat.js::resolveAttack` after Soul Drain warning | Existing area-drain damage, one receipt for all native victims |
| `world/night/stalker-pounce` | `boss-combat.js::resolveAttack` at committed Pounce flight | Existing lawful landing damage; one receipt inherited by movement |
| `world/rogue/basic` | `engine.js::tacticalResolveRogueMove` non-boss/non-captain basic, **after** any invalid mobile cast abort | Existing damage, no change to Slow, dust, push, retreat or target coverage |
| `world/rogue/signature` | Same native non-boss/non-captain ringleader signature resolver | Existing signature damage; original cover, area geometry and all supplemental behavior |
| `world/captain/supply-vale/2` | `boss-combat.js::resolveAttack`, Scornfang **Dust Entrainment** cone | Original warned cone damage only |
| `world/captain/supply-march/1` | Same, Direjaw **Sand Boil** cone | Original warned cone damage only |
| `world/captain/supply-highlands/2` | Same, Crag Tyrant **Bad Deal** cone | Original warned cone damage only |
| `world/captain/frontier-overseer/0` | Same, Cinder Warlord **Inspection Cleave** cone | Original warned cone damage only |

Shared source release hooks remain **OFF** unless a dedicated World session is manually attached to that Campaign by tests. No production source installs the session; there is no live critical indicator, reward, saved stream, audible cue, extra shot/tick or per-frame roll.

The ordinary/guardian/ranged/ringleader Rogue branch excludes all **captain** and **boss** moves, and cancels invalid mobile target reach/LOS before sampling. It does not replace the noncritical reaction/AI logic. The four captain cones use an explicit profile/index/kind admission list; no general captain or boss fallback and no world roll at warning creation. No new attack geometry, target count, cooldown, susceptibility or recovery is granted.

## GitHub evidence (all focused only)

- [`2946ba00` reconciliation — CI #40220734461](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40220734461): focused tests + reproducible build passed; source was zero behind then-current main.
- [`8360bf42` World basics — CI #40221182545](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40221182545): **33 relevant test files** and reproducible build passed.
- [`979efc05` World healing — CI #40221740964](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40221740964): **34 relevant test files** and reproducible build passed.
- [`ee4d1f55` Wraith/Stalker — CI #40225109111](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40225109111): **35 relevant test files** and reproducible build passed; native warned AoE/physical landing, cancel, three tiers, immunity, one roll checked.
- [`67a82807` Rogue basics/signatures — CI #40225494067](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40225494067): **36 relevant test files** and reproducible build passed; native ordinary/guardian/ranged/ringleader, original footprint, cancelled/escaped, 3 levels, one release and captain exclusion.
- [`ecad2d18` four captain cones — CI #40226016079](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40226016079): **37 relevant test files** and reproducible build passed; actual captain selector, 4 named cones × 3 levels, original warnings, immunity, cancelled moves, unaffected noncritical and explicit unknown-key exclusion.

**Evidence caveat:** The documentation and hot-path micro-cleanup commit after `ecad2d18` requires its own exact-head CI result. None of the runs above is a full game/browser/hardware/FPS/balance/save-certification result, and a previously intermittent Pixi browser context-loss diagnostic remains an independent concern.

## Source-derived remaining Stage 3 plan and unresolved design

`src/prototype/rules.js::roomCaptains` presently authors **21** captain attack entries: Scornfang 5, Direjaw 3, Crag Tyrant 3, Dreadmaw 7 and Cinder Warlord 3. **Four** straightforward single-release cones above are tested, leaving **17 distinct captain attack entries**. The remaining conventional captains include Scornfang's four-shot tracking salvo and two-pair Hot Zone, charging lines, persistent effects and sequential markers. `dreadmaw-combat.js` intercepts Transhumance, Creep Feeding, Purse-Seine Closure and other special effects: its 7 actions cannot be treated as generic captain `resolveArea` outputs.

Each future candidate needs its own explicit action key and effect lever; a multi-shot or queued activation must carry the same release receipt through descendants rather than sample each shot/tick. Separately resolve what is a genuine new action versus a phase, passive, heal-over-time continuation, hazard tick or scripted reaction. Keep summon caps, tracking cancellation, telegraph release semantics and environment protection.

**Eleven boss families in Normal and TRUE** remain unintegrated for authored specials: Thorn, Crypt, Mire, Archive, Ridge, Mine, Warlord, Abyss, Citadel, Cindermaw and Dark Lord. Special attention to `cindermaw-combat.js` delegated ally casts, `dreadmaw-combat.js` multiple legs, Abyss aerial follow-up, Citadel checkerboard/formation, Royal Second Wind and TRUE encounter invariants. Also outstanding: captain/boss Rogue signature source owners, boss healing/self-defense, specialist summons, night Frenzy trigger versus actual action, native world action coverage inventory.

**Stage 5/6 blockers remain:** persisted independent World stream seed/restore, save v4 book flags/claims, Party stream determinism, balance acceptance, actual device performance FPS/p95 and final consent. Keep all live gameplay unchanged while Stage 3 develops. Do not trigger comprehensive browser suites or deploy.

**Next safe engineering package:** source-map the 17 remaining captain entries to their true committed release and descendants, then implement the first non-cone candidate (for example tracking volley) with one cast receipt, unchanged projectiles and all legal cancellation paths. Prefer the four conventional captain owners before the Dreadmaw specialist and bespoke boss dispatches. Re-fetch live main/PR head and AGENTS.md before editing.
