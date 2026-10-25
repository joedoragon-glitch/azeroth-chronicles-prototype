# Captain healing and Treasury ranged support — decision and implementation record

**Date:** 25 October 2026  
**Working branch:** `feature/captain-healing-independent-idle-20261025`  
**Baseline:** `main` after ordinary-enemy healing PR #448 (merge `1312082`)  
**Status:** Draft review candidate. **Not merged, not deployed; GitHub CI and gameplay outcome still to be verified.**  
**Scope:** Captains and their support ecosystem, without altering boss healing or previously improved ordinary-to-ordinary recovery.

## Director decisions from the discussion

1. **Healing captain → ordinary monsters, including eligible summons:** restore **100% of HP missing at cast time over 3 seconds**, using a **7-second ordinary-ally cast cooldown**. An area cast may treat several wounded ordinary recipients. The named restorative captain roles are Scornfang (`Salvage Surge`), Direjaw (`Silt Pulse`), and Dreadmaw (`Grafting`). Crag Tyrant and Cinder Warlord are not granted new healing abilities.
2. **Captain self-healing:** retain the original **5% of the captain's maximum HP, adjusted by the existing source scaling, over 5 seconds**. Give the captain a **separate 10-second self-healing clock**, independent of support spells for other monsters. Its seven-second ally-support cooldown cannot accidentally spend or refresh its self-healing clock, and vice versa.
3. **Engagement independence:** an ordinary ranged guard can detect, approach, and treat a wounded captain while the guard and/or captain are unengaged. Once started, captain healing **continues across idle → engaged → idle transitions**. Combat aggro is not a healing requirement. Do not relax the safeguards against dead/neutral/returning targets, active duplicate effects, obstruction, Silence, or a full encounter reset.
4. **Captain as an intermediate recipient:** the director wants captains substantially better supported than bosses but not identical to ordinary monsters. **Draft tuning for review**, not a final locked numeric approval: a separate source heals **50% of the captain's missing HP over 5 seconds** when the captain is at **90% HP or below**. Each ordinary ranged source retains a **10-second per-healer captain-support eligibility**, independent from its seven-second ordinary-recipient cast. This midpoint value must be validated and may be refined without changing the director-approved design goal.
5. **Treasury defenders:** add **two ranged guardian posts** in *each* of Scornfang's Greenwood Treasury (`supply-vale`) and Direjaw's March Treasury (`supply-march`), increasing both from **1 to 3 ranged guardians**. Keep old posts, existing save identities, dead guards, layouts, and zero-repeatable-reward policy intact. Crag Tyrant retains **3** ranged Treasury guardians. Dreadmaw retains **5**, without adding new guards. The count is not a promise that every unit can cast at every moment; navigation, terrain, sight lines, fighting, and death still matter.
6. **Dreadmaw separately:** `Grafting` is an authored restorative support action distinct from the seven regular captain attacks. As part of the generic captain upgrade, it **fully restores missing HP to each eligible ordinary broodling/monster over 3 seconds**. Dreadmaw's own current self-restoration is preserved pending a separate appraisal of `Grafting`, `Brood Call`, `Broodward` protection, other special moves, and actual gameplay. Four owned broodlings are possible (three melee, one ranged); the lone ranged broodling can itself heal its captain when able. Do **not** automatically nerf or inflate Dreadmaw's personal numbers without that specific review.
7. **Direjaw's `Elastic Rebound`: preserve its existing positive survivability.** Authoritative source currently triggers this one-time `molt` phase when Direjaw first falls to **55% max HP or less**, then adds **50% max HP** (capped at full) and raises movement speed by 20%. The discussion used an approximate larger percentage; **source values above are authoritative**. The director expressly does **not** want a preemptive nerf in response to new guards/support; reconsider only on real gameplay evidence.
8. **Rogue regroup around Dreadmaw:** leave withdrawal behavior and its formation targeting untouched for this candidate. The tactical algorithm currently groups eligible allies by pack and favors **closer allies**; it does **not guarantee choosing the Treasury captain**. Overwhelmed guards may eventually converge on the captain, but this remains a hypothesis for playtest—not established automatic leader-seeking behavior.

## Treasury-by-Treasury design audit

| Treasury | Captain | Original authored ranged guards | Draft ranged guards | Design observation |
| --- | --- | ---: | ---: | --- |
| Greenwood / `supply-vale` | Scornfang | 1 | **3** | Add two near the command side of the wall/divider; existing distant lookout remains |
| Flooded Marches / `supply-march` | Direjaw | 1 | **3** | Add two near Direjaw's side of the flood divider; keep one original distant lookout |
| Ironroot Highlands / `supply-highlands` | Crag Tyrant | 3 | **3** | No new posts; captain does not cast support itself |
| Dark Crown / `supply-crown` | Dreadmaw | 5 | **5** | No increase; only one authored initial post was within the 350-unit radius, before line-of-sight and movement |

The new Greenwood and March posts are authored as zero-XP/zero-crown guardians. A regression asserts **three actual ranged guardians per changed Treasury**, proximity (≤350 units) and initial line-of-sight from each of the two new posts to the captain, original slot preservation, and legacy-save append-without-revival behavior. The actual in-game result still needs verification in native simulation and browser/phone play.

## Healing contract in the draft

| Source → target | Target eligibility | Healing over time | Clock |
| --- | --- | --- | --- |
| Ordinary ranged / eligible ranged summon → ordinary | Any missing HP | Full missing HP / 3s | 7s support cast |
| Restorative captain → ordinary (including brood) | Any missing HP | Full missing HP / 3s | 7s support cast |
| Ordinary ranged / eligible ranged summon → captain | Captain ≤90% HP (draft tuning) | 50% missing HP / 5s (draft tuning) | 10s *per source* captain eligibility |
| Restorative captain → own HP | Captain ≤75% HP | Existing scaled 5% maximum HP / 5s | 10s **independent self** |
| Restorative captain → another captain | Recipient ≤90% HP (draft tuning) | 50% missing HP / 5s (draft tuning) | 10s *per source* leader eligibility |
| Any eligible source → boss | Existing boss requirements | Existing scaled 5% maximum HP / 5s | Existing 10s leader treatment |

Effects never resurrect, never stack on one recipient, and are runtime-only (save schema v4 unchanged). A source still needs valid range (350 units) and unobstructed line of sight at cast time. Mid-heal engagement transitions alone do not abort captain pulses.

## Work written to this draft branch

- `src/prototype/engine.js`: targeting, different recipient budgets, captain-specific independent self timer, idle-safe pulse progression, and idle guard approach.
- `src/prototype/rules.js`: intermediate captain recipient configuration and the four additional ranged Treasury posts.
- `tests/captain-healing-independent.test.cjs`: isolated healing clocks, idle transitions, recipient budgets, Grafting/general captain support, preserved Elastic Rebound and roster counts.
- `tests/enemy-support-healing.test.cjs`, `tests/enemy-ordinary-heal-balance.test.cjs`, `tests/enemy-cross-species-idle-healing.test.cjs`: updated acceptance expectations for captain support while guarding ordinary/boss behavior.
- `tests/snapshot-guardian-density-direwolf-riders.test.cjs`: new native guard totals, proximity/line-of-sight and legacy-save identity requirements.

## Outstanding validation and decisions

- **Do not claim tests passed just because assertions were authored.** Obtain actual GitHub Actions results (or run native tests) and repair any formatting, behavior, regression or build failures before requesting merge.
- Test both Normal/Nightmare modes and fresh/historical v4 saves. Verify that newly appended Treasury posts neither duplicate nor revive old dead defenders, that existing area combat and captain attacks still work, and that source clocks survive interruptions without persisting into saves.
- Independently simulate idle guard → idle captain healing, idle → aggro → idle pulses, ordinary → captain treatment every 10 seconds, captain simultaneous multi-target ordinary treatment every 7 seconds, and captain independent self recovery every 10 seconds.
- Check actual spawn positions, pathfinding, wall visibility, call-for-aid activity, ranged guardians' attack-versus-heal decision time, and combat survival for each Treasury. A static count is not encounter evidence.
- Retest Dreadmaw `Grafting` and brood shield durability as a separate specialist balance pass; assess whether his five ranged guards cluster via natural Rogue regroup instead of presuming they do.
- Reassess Direjaw's `Elastic Rebound` **without weakening it upfront**; assess how it interacts with the three ranged guards and new middle-ground healing.
- A 50%-of-missing-HP captain recipient heal and ≤90%-HP entry are **provisional draft numbers** subject to director review; do not represent them as already authorized exact tuning.
- Do not merge, ship or modify the live `main` without explicit director review and validation.

## GitHub change record and verification checkpoints

- **Draft PR:** [#454 — Captain support healing, idle recovery and Treasury guard reinforcement](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/454), head `feature/captain-healing-independent-idle-20261025`, base `main`; status **open / draft, not merged**.
- **GitHub base:** `1312082b4bd5d216c0c2bc641dbaab6c13daf778`, ordinary healing PR #448. The captain work is isolated to the draft branch.
- **Discussion continuity:** The director specifically reiterated that all gameplay choices, GitHub edits, implementation findings, testing status and remaining balance uncertainties need to be documented in the repository rather than existing only in conversation. Keep this document and the PR description in sync as changes are made. Do not mark a numerical tuning recommendation as final without an explicit director decision.
- **Last verified workflow check (25 Oct 2026):** `Focused checks and deploy` showed **pending** for the then-current PR head. A skipped `Community balance input provenance` run was also present. This is **not evidence of passed tests**. Re-check against the latest head after each commit.
- **Documentation consolidation:** this file is the authoritative dated decision log for PR #454; a duplicate similarly named draft was retired to avoid contradictory inventories or proposed guard totals. All four Treasury formations are described above by both previous and draft guard counts.


---

## Checkpoint: phase-based handoff, 25 October 2026

**Director instruction:** Stop development at this checkpoint. For the rest of PR #454, use **one bounded implementation/validation phase per chat**. At the end of each phase, verify the exact GitHub branch/head, commit the code and authoritative documentation, record passing/failing evidence and unresolved questions in this existing draft PR, and stop for a new chat. Do not describe code being discussed as written until the GitHub commit is confirmed. Do not merge or deploy without explicit authorization.

### Original problem we are solving

PR #448 gave ordinary ranged monsters meaningful area support: each wounded ordinary recipient could receive **100% of missing HP over 3 seconds** on a **7-second caster cooldown**, including cross-species and initially unengaged ordinary allies. Captains were accidentally left in an asymmetrical support regime:

- A healing-skilled captain treated surrounding **ordinary** monsters with the weak **5%-of-max-HP / 5s / 10s** leader budget instead of the ordinary healer's useful full recovery.
- A captain's own self-healing shared a cooldown with its ally-healing cast, creating an unnecessary conflict.
- Ordinary ranged guard → captain support was similarly small, **5% max HP / 5s**, with eligibility still per healer, and a healing effect on an **idle captain** could be dropped by the pulse-advance engagement gate. The guard could also be prohibited from approaching until in combat.
- Scornfang and Direjaw Treasuries had only **one ranged guardian** each, whose authored post was outside the 350-unit casting radius; Crag Tyrant had three, and Dreadmaw had five dispersed across a large Treasury.
- The director wants captains to sit **between ordinary monsters and bosses** in survivability, supported by **both** their own recovery and allied ranged defenders. This is not a request to increase every boss's healing or remove real combat/terrain safeguards.

### Decisions already taken (no need to re-ask)

1. Healing captains **Scornfang, Direjaw, Dreadmaw** fully repair wounded ordinary allies, including eligible summons, over **3s** with **7s** ally cooldown. Area healing reaches all valid recipients. Crag Tyrant and Cinder Warlord do **not** acquire a new innate healing skill.
2. Those captains retain their scaled **5% max HP over 5s personal recovery**, but it is now an **independent 10s self clock**. A captain can provide ordinary support and independently heal itself without one action spending the other's cooldown.
3. Captain healing must not require aggro. Idle ranged guards should approach an idle injured captain; a healing pulse continues if a captain becomes engaged and later idle again. Dead, neutral, returning/resetting, silenced caster, range, walls, and in-progress recipient pulse safeguards remain.
4. The director requested **two additional zero-reward ranged guards** in each of Greenwood/Scornfang and Marches/Direjaw, taking each from **1 to 3**; Crag Tyrant retains 3, Dreadmaw retains 5. Preserve legacy guard identities and no-revival rules.
5. Dreadmaw's **Grafting** needs its own specialist evaluation alongside the four-broodling summon composition and Broodward; ordinary broodlings receive the new full missing-HP restoration. The director accepts Dreadmaw's current guardian count and encounter difficulty and did not authorize nerfs.
6. Direjaw's **Elastic Rebound must not be nerfed preemptively**. Code authoritatively gives a **one-time +50% max HP** upon crossing **≤55% HP**, capped at full, plus **20% speed**. This is distinct from Silt Pulse. A conversational recollection of 60% is **not the coded value**; do not silently change it.
7. Rogue regroup does **not explicitly prefer the strongest captain**; the closest eligible ally/group drives the current selection. Test whether ranged guards naturally converge near Dreadmaw and can subsequently heal him; do not promise this happens consistently.
8. **Provisional, not approved as a final number:** ordinary ranged/summoned ranged guard → captain **50% of recipient's missing HP over 5s**, captain eligible at **≤90% HP**, with **10s eligibility per source**. This is already coded as a review candidate but must be evaluated against actual combat/guardian availability before numerical sign-off. Boss recipients retain their older, narrower rules.

### What is already committed on PR #454

At checkpoint, **head SHA \`66ddc8e8b8d8a55015031c4c3153cf048369c8d7\`**, branch \`feature/captain-healing-independent-idle-20261025\`, target \`main\` at \`1312082b4bd5d216c0c2bc641dbaab6c13daf778\`. PR **open, draft, unmerged**. Do not assume its head remains unchanged in a future chat; query GitHub again before any new work.

Changed files at this head:

- Gameplay: \`src/prototype/engine.js\` (distinct captain self clock; captain-to-ordinary treatment; captain-recipient budget; idle approach/pulse acceptance); \`src/prototype/rules.js\` (provisional intermediate recipient contract; four newly authored ranged guard posts).
- Mechanics validation: new \`tests/captain-healing-independent.test.cjs\` (independent clocks, cross-engagement recovery, two independent healers treating one captain, Grafting healing four broodlings, Direjaw one-time phase). Updated \`tests/enemy-support-healing.test.cjs\`, \`tests/enemy-ordinary-heal-balance.test.cjs\`, \`tests/enemy-cross-species-idle-healing.test.cjs\`.
- Treasury/save and artifact validation: \`tests/snapshot-guardian-density-direwolf-riders.test.cjs\`; \`docs/evidence/SPRITE_SCOPE_RECONCILIATION.json\` refreshed only the \`rules.js\` source receipt after roster modification.
- This authoritative document. The PR conversation includes [CI diagnosis and edits](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/454#issuecomment-6396024143).

**No merge, public deployment, final balance decision, physical-device validation, or full final audit has occurred.**

### Validation evidence as of this checkpoint

- [First failed PR focused run #40180534693](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40180534693) exposed **two unrelated focused checks**: legacy mounted-rider Rogue lunge expected 165 versus the actual 198, and the sprite-scope \`rules.js\` SHA receipt was stale. The healing-focused tests had passed.
- Subsequent source/test-only fixes: \`f913cf1\` changed the mounted-lunge assertion to compare against \`rules.tacticalFoundation.rogueMoves.species.wolf.radius\`; \`e205ba4\` reconciled the sprite-scope source hash. **The mounted-lunge test correction was insufficient** (see below).
- [Latest failed focused run #40181275514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40181275514) on exact head \`66ddc8e\`: **16 of 17 selected test files completed successfully; one failed.** The following relevant files passed: \`captain-healing-independent\`, \`enemy-cross-species-idle-healing\`, \`enemy-ordinary-heal-balance\`, \`enemy-support-healing\`, \`snapshot-encounter-lifecycle\`, \`slow-cooldown\`, \`runtime-workload\`, and \`sprite-scope\`. The suite \`snapshot-guardian-density-direwolf-riders\` failed on its mounted-lunge assertion at line 101: **198 !== undefined**.
- **Exact cause of remaining failure:** the real mounted lance profile in \`engine.js\`, inside \`tacticalRogueMove\`, sets its dash radius explicitly to \`165 * R.balance.enemySpecialReachMultiplier\`, resulting in **198**. The new test mistakenly read \`Campaign.rules.tacticalFoundation.rogueMoves.species.wolf.radius\`, but that property is **undefined**; the Wolf species profile is not the owner of the mounted-specific override. In the next phase, fix the regression to assert the actual authored expression (using the balance multiplier), **not** by altering the combat ability radius. Run the original affected suite and CI afterward. This repair **has not been made in this chat by design**, because the director requested a stop at checkpoint.
- The build step did not run to completion after the failed focused validation, and broad/full test, device and encounter playtest evidence is not claimed.

### Remaining work: one phase at a time

| Phase | Objective and bounded work | Completion / exit evidence | Status |
| --- | --- | --- | --- |
| **0 — Requirements and design** | Capture the original asymmetry, captain hierarchy, 7s/10s independence, idle recovery, Treasury decisions, Dreadmaw exception, Direjaw no-nerf decision and provisional midpoint. | This document + PR description agree with gameplay decisions. | **Recorded / complete** |
| **1 — Draft source and focused unit regression authoring** | Implement healing clocks, recipient classes, idle pulses, four new Treasury ranged posts; add support, summon, save and phase assertions. | Branch code and tests committed; this alone does **not** mean validated. | **Committed / awaiting complete test validation** |
| **2 — Focused CI repair and mechanical acceptance** | Mounted-lunge assertion corrected in \`c02059d\` without touching gameplay. Exact-head focused regression, formatter, and build evidence still required. | **Green exact-head focused CI** with build check; all claimed tests show successful logs and linked run. Record head SHA and any residual limitations. | **IN PROGRESS — assertion committed; CI run not triggered/verified** |
| **3 — Real-world lifecycle and Treasury delivery** | Native Normal/Nightmare rooms and historical v4 restoration; verify 3/3/3/5 actual ranged-guard counts and zero-reward identities, new guard posts' unobstructed line-of-sight/paths; test idle guard detect→approach→cast→complete, aggro transitions, multiple healers, movement interference, phase/cast pauses, Silence, death/return and no saved effect leakage. Avoid mock-only success claims. | Actual game-loop tests, source-linked guard geometry evidence and no lifecycle regressions; record failures/repaired behaviors. | **TESTS AUTHORED — actual execution and further lifecycle evidence pending** |
| **4 — Specialist encounter review** | Separately stress **Dreadmaw** (\`Grafting\`, four ordinary broodlings including one ranged, Brood Call, Broodward, seven attack slots, distant five guards, emergent Rogue withdrawal) and **Direjaw** (unchanged one-time Elastic Rebound plus Silt Pulse, three ranged guards). Review Scornfang and Crag Tyrant's field support separately. Do not nerf Direjaw or add Dreadmaw guards automatically. | Deterministic specialist tests and encounter-level observations, including realistic hero+companions pressure and time-to-heal when guardians are busy or destroyed. | **Pending** |
| **5 — Captain-recipient balance decision** | Based on phase 3–4 results, independently decide whether **provisional 50%-of-missing / ≤90%** is appropriate; if modified, adjust config, tests, and documented decision together. Preserve boss/ordinary distinction and source-local 10s eligibility. | Explicit director choice or documented acceptance of existing midpoint, with reviewed quantitative and playtest support. | **Pending director sign-off** |
| **6 — Integration completeness gate** | Review diff for accidental unrelated changes, confirm test mapping, formatter, reproducible PWA build/version requirements if deployment is proposed, full required native/regression checks, browser/phone and save compatibility. Record latest main-branch drift and overlapping PRs. | One exact candidate SHA, clean required results/known limitations, up-to-date decision log and draft PR description. | **Pending** |
| **7 — Final audit (later, separate)** | Only after phases 2–6 finish: end-to-end check against each director decision, edge cases, saved history, staged/publication policy and readiness for a merge decision. | Final report and explicit user approval request as appropriate; merging/publishing are separate authorized actions. | **Not started** |

### Future-chat resume protocol

1. Read **PR #454**, its actual current GitHub head/base, this decision record and latest Actions results; avoid replacing a newer branch state using this historical SHA.
2. Start only the **next unfinished phase** (currently **Phase 2**); keep its scope bounded and provide concise GitHub write/check confirmations.
3. At the phase checkpoint, update **this** authoritative document **and the same PR's conversation/description** with completed steps, tests and exact commit/run, blockers and next phase, then stop. Do not carry unresolved bugs forward as passing.
4. No new independent PRs for the same change, no unrelated feature expansion, no premature balance nerfs and no merge/deploy without explicit director authorization.

**Checkpoint stop recorded.** Gameplay code and tests are intentionally frozen at head \`66ddc8e\` for this handoff; adding this documentation will advance the branch head without changing those sources. The latest failing CI run therefore remains the last execution evidence until a later chat runs another test on its new candidate.

---

## Phase 2 execution checkpoint — 25 October 2026

**Scope:** one bounded Phase 2 attempt on existing draft PR #454; no later phase started, no gameplay/ability/guard/balance change, no merge or deployment.

**Verified remote precondition:** branch `feature/captain-healing-independent-idle-20261025` was at documentation checkpoint `9fc9b68033e56be3b43b974391e7ab5dadbdec1c`, PR open/draft, base `main`. Previous GitHub Actions [run 40181275514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40181275514) remained **failed**: 16/17 focused test files passed, while `tests/snapshot-guardian-density-direwolf-riders.test.cjs` failed on `198 !== undefined`. The sprite-scope test **passed** on that earlier run.

**Code change committed:** `c02059dffc9e17c4bababb02c85672a8c5432205`, test-only. Replaced the invalid `basic.radius` expected value for the mounted Crown direwolf lance with `165 * Campaign.rules.balance.enemySpecialReachMultiplier`. The code owner is `src/prototype/engine.js` (`tacticalRogueMove`, mounted profile), and `src/prototype/rules.js` sets the current multiplier to `1.2`, so the expected reach is **198**. The existing damage-coefficient assertion remains unchanged. No game mechanics were modified.

**Exact-head validation limitation:** querying GitHub Actions workflow runs for commit `c02059d` returned **zero runs** at checkpoint. The `Focused checks and deploy` workflow is configured for `pull_request` into `main`, but no automatic run had appeared for this remote edit. This interface cannot dispatch a new workflow or clone the repository into its runtime. Therefore **the fixed test, other focused tests, source formatter and reproducible build were *not* rerun on this head**; do not claim they passed. In particular, the earlier 16/17 result is evidence for old head `66ddc8e`, not the repaired candidate. A lack of a run is *not* a green check.

**Phase disposition: STILL OPEN / validation blocked.** Continue Phase 2, not Phase 3, until `Focused checks and deploy` completes with actual green logs for the repaired head (or a later documentation-only successor with identical source/test files), including the build step. Record the exact run ID/commit, investigate any new failures, then mark Phase 2 complete and stop. No captain midpoint decision or encounter/lifecycle validation has been authorized by this checkpoint.
---

## Phase 3 native Treasury validation preparation — 25 October 2026

**Director instruction updated:** Continue work beyond the original one-phase-per-chat restriction, but still require **Phase 2 green CI before declaring Phase 2 complete**, and real native evidence before declaring Phase 3 complete. Both phases remain open at this checkpoint.

**Phase 2 correction:** Test-only commit `c02059dffc9e17c4bababb02c85672a8c5432205` fixes the mounted-Rogue reach expectation to `165 * Campaign.rules.balance.enemySpecialReachMultiplier` (=198 with the currently authored 1.2 multiplier). No production gameplay or balance source changed. The corrected test parses as JavaScript. GitHub Actions queried against the newer Phase 3 branch head still exposed **zero runs**, so no exact-head regressions, formatting pipeline or reproducible build may be claimed passing. Last real CI execution continues to be [failed 40181275514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40181275514) on old head `66ddc8e`, in which 16/17 focused files passed and sprite-scope passed.

**Phase 3 test authoring:** `tests/captain-treasury-native-lifecycle.test.cjs` added in `e4b0885`, refined in `ca41c9e` and `941c69c`. It drives actual `Campaign.updateEnemies` with the production route/collision/line-of-sight and actual native Treasury enemies, rather than overriding `zone()`, `line()`, or support decision methods. The test covers:

- Both **Normal and Nightmare** for all four Treasury rooms. It asserts total guard rosters **8 / 8 / 7 / 11**, with ranged support **3 / 3 / 3 / 5**, one captain each and no ordinary guardian XP/crowns.
- Source-post collision checks; both new Greenwood/Marsh command healers must be within the real 350-unit treatment range and have unblocked line of sight from their native authored positions.
- Simulated **v4 partial Treasury saves** in all eight room/mode combinations, preserving first-four legacy guardian IDs, preserving a dead guard without resurrection, appending missing roles and not appending duplicates on repeated zone reads.
- Wounded captains at **82% HP** (above their 75% independent self-heal threshold but below the provisional 90% guard-support threshold), with distant hero and no forced aggro; real native idle guards must create and finish a healing pulse on all four captains in both modes. It captures the true guard heal source, verifies runtime-only effects do not leak to saves and that a restored captain starts without an orphaned effect.
- Real update-loop cancellation on captain death or returning, a native Silence blocking a guardian cast, recovery after Silence and direct healing pulses across aggro→idle changes.
- A Dreadmaw **geometry observation** per ranged guard: initial distance, range eligibility, real line of sight and route existence. This is intentionally a diagnostic, not a claim that all five guards automatically converge in actual combat; that belongs to the specialist review.

**Validation scope and limits:** Both new and repaired `.test.cjs` files were accepted by a JavaScript parser in a source-level check; their **Node assertions have not executed**, and no `npm ci`, `npm run format:check`, build or device testing happened on the new head. The expected counts/behaviors are authored acceptance criteria, not observed pass results. Existing earlier tests provide narrower historical evidence only. If any new native test fails (for example due to actual sightline or lifecycle behavior), repair the specific proven issue rather than suppress the test; record exact logs.

**Required next execution:** Run GitHub's original `Focused checks and deploy` workflow against the current candidate head, including `node .github/scripts/focused-ci.cjs`, the affected tests and `node scripts/build.cjs --check`. Verify the fresh Phase 3 native test results explicitly in the logs. Confirm formatting requirements separately if not included in the focused workflow. Only with successful, exact-candidate evidence may Phase 2 be checked off and Phase 3 runtime results assessed. **Do not start Phase 4, merge, deploy, or lock provisional captain-recipient balance on the basis of these unexecuted tests.**


**Post-checkpoint fixture correction:** A partial, isolated V8 module-loader exercise (not the official Node runner) caught a test-only defect: placing the hero at `(-2000,-2000)` made native `Campaign.restore` correctly reject a saved negative coordinate as `Invalid save number`. The test fixture now uses the legal distant position `(100,100)` in commit `a8930a0307cee18048bee705fedc8e6cddf1d9c0`. An additional isolated attempt successfully passed the new eight room/mode guard-and-legacy-roster assertions before the partial loader encountered missing gameplay module dependencies; these attempts are **not** evidence of successful full Node execution or in-game idle healing. Only the checked-in focused run can establish complete Phase 2/3 acceptance. This fixture change affects no production game code.

---

## Latest Phase 2–3 source-execution checkpoint — 25 October 2026

**Purpose:** Protect Phase 4 entry: both Phase 2 and Phase 3 must satisfy their evidence gates first. This is a source-level execution checkpoint, **not** a green exact-head Actions/build checkpoint. The user expressly requested no Phase 4 work until both phases have been completed.

### Source/test changes since phase handoff

GitHub compare against `9fc9b680` shows **only** this decision log and two test files changed; `src/prototype/engine.js` and `src/prototype/rules.js` were **not** changed during these Phase 2–3 fixes. The mounted rider test was repaired to use `165 * Campaign.rules.balance.enemySpecialReachMultiplier` (=198). After exercising the test beyond that assertion, the source execution exposed a missing `ctx.rotate()` on its intentionally minimal Canvas mock; `b32cd12ae069cd0f781afa4f7abe276419b30ce8` added that method to the mock, without altering the renderer or rider combat.

The Phase 3 native test (`tests/captain-treasury-native-lifecycle.test.cjs`) was extended in `19f59cc1e7b25bf769c8779d4ad55e012a25e478` with actual idle **out-of-range approach → cast** tests for both original Greenwood and Marsh lookouts, and in `d237f1e2f1a7f803064430ca71a7a799e09598a9` with **two independent native guardians' sequential treatment** of a wounded Scornfang, including the no-stacking guard.

### Executed isolated JavaScript source checks

The exact GitHub files were loaded and their committed test scripts executed in an isolated V8 JavaScript runtime, using the genuine `Campaign` source, rules, map, save, navigation, fortifications, boss/hero combat and Treasury implementation. Selected presentation/unrelated modules were substituted by minimal loaders where full Node repository packaging was unavailable. **These are not official Node/test-runner or GitHub Actions results**, and cannot certify the build, all affected tests, desktop/phone or release readiness.

1. `tests/snapshot-guardian-density-direwolf-riders.test.cjs`: **PASS** after adding the missing Canvas rotation mock. Output: `PASS four proportionate Treasuries, legacy no-revive, main Mine riders, roles, dash, mixed camps and art`. The real mounted radius was 198. Source check excludes the optional Dreadmaw-specialist module and unrelated presentation modules.
2. `tests/captain-healing-independent.test.cjs`: **PASS**. Output: `PASS captain support: area/full ordinary repair, independent 7s/10s readiness, idle pulses, midpoint ally healing, Direjaw phase, Treasury formations`. This tests the provisional middle-ground budget as *existing draft code*, not final numerical approval.
3. `tests/captain-treasury-native-lifecycle.test.cjs`: **PASS**. Eight Normal/Nightmare Treasury roster/save-restoration pairs succeeded, as did eight native idle-captain five-second treatments, idle long-distance guard approach on both Greenwood/Marsh original lookouts, independent sequential treatment by two native guards, death/return cancellation, Silence gating, idle↔engaged healing pulses, and transient-save cleanup. The test uses actual collision, navigation, line of sight and enemy update methods rather than overriding them.

Dreadmaw's **five original ranged guards** at native starting posts yielded this measured source geometry relative to their captain (350-unit treatment range):

| Ranged guardian | Initial gap | In cast range | Initial line of sight | Route to captain |
| --- | ---: | --- | --- | --- |
| Ash beast cinder guardian | 602.1 | No | Yes | Yes |
| Ash beast hoard sentry | 715.9 | No | No | Yes |
| Ash beast distribution sentry | 406.7 | No | Yes | Yes |
| Ash beast granary sentry | 475.2 | No | Yes | Yes |
| Ash beast inner-vault sentry | 241.5 | **Yes** | **Yes** | Yes |

This establishes **only one initially in casting range** and does not promise that others naturally converge during combat. Dreadmaw specialist pressure, regroup and attacks remain reserved for Phase 4 after Phase 2/3 acceptance.

### Unmet acceptance gates — mandatory before Phase 4

**Phase 2 remains formally OPEN**: obtain an actual focused GitHub Actions CI run on the corrected current branch head, including affected selected regressions and a **successful reproducible `node scripts/build.cjs --check`**; separately confirm required formatter check. Previous GitHub Actions [40181275514](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40181275514) is old-head and failed, even though sprite scope and 16/17 earlier focused files were green.

**Phase 3 remains formally OPEN** until the new native Treasury test is executed in the actual Node CI environment on the exact candidate and the additional movement/lifecycle assertions are accepted, with all unexpected regressions repaired and logged. Isolated source success alone is insufficient for this committed plan.

**Current infrastructure blocker:** GitHub API shows no newer workflow runs for the GitHub-App-authored PR updates; the linked tools cannot dispatch an owner-originated fresh Actions run. The repository owner can trigger a PR synchronize event with an owner-originated push (such as a harmless empty commit) to the existing feature branch, then we can inspect the new run and fix any failures. No new PR, game source nerfs, merge or deployment was performed.

**STOP AT THESE GATES. Do not proceed to Phase 4 until both phases' mandatory execution evidence is verified.**
