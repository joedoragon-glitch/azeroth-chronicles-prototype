# Azeroth Chronicles — Stage 5 VFX visual acceptance and performance gate

**25 October 2026** · **Draft PR #471 only** · Standalone candidate (Stages 2–5), not merged or deployed. Stage 5 is **in progress**, not a physical-device certification or release approval. Preserve the multi-file Pages/PWA project; do not modify parallel PRs #440 or #449.

## Proven before Stage 5

Stage 3 validated real producers reaching Canvas paint for 48 hero casts, first attacks for all 11 boss families, all 22 pet first/charged skills, four Soldier/Archer skills, and arrow movement at 20/30/60 simulation steps. It also established intentionally silent cast stages, the limited 40-effect queue, three statuses per enemy, and the 24-status-enemy display ceiling. Those were automated, mostly native-Canvas observations—not physical-screen acceptance.

Stage 4 preserved the same budgets, added bounded first-paint eligibility (maximum +0.12 simulated seconds only for certain essential never-painted hero cues), and sorted important statuses with the +N overflow marker. No extra frames or combat-rule changes were allowed. The candidate before this stage passed 20 focused regression test files and the reproducible build verification.

## What this Stage 5 change actually adds

- `tests/effect-diagnostics-stage5-browser.test.cjs` exercises a **real gameplay `cast()` → events → production renderer** in actual Chromium Canvas, rather than merely a synthetic painter fixture.
- It runs **desktop 1280×800** and **phone-emulated 393×852** viewports, normal and reduced motion, with controlled 20/30/60-step simulation intervals.
- For each interval it first draws an identical *post-cast* game state without the transient, then withholds 0.25 simulated seconds of drawing, releases **one regular draw**, and compares actual Canvas RGB pixels. A successful painter call alone is not counted as visible evidence.
- It requires the cast to be painted, a nonzero RGB pixel difference, no extra draw request, unchanged campaign snapshot, and prompt post-draw expiry.
- It renders three ordinary statuses versus five concurrent statuses including Silence and Slow, requiring the overflow/priority composition to change the actual pixels. It also proves normal-mode diagnostics cannot be enabled and the existing 40-transient budget is unchanged after a deliberately injected 100-hit fixture.
- It reports the median of five crowded-scene Canvas draw calls as **observational CI-host data only**. These are not pass/fail hardware budgets, matched-main benchmarks, real rendered FPS, or phone/Chromebook timings.
- `.github/scripts/focused-ci.cjs` admits **only this explicitly changed, single Stage 5 browser smoke** to focused CI. The owner policy forbidding automatic global/full-game/browser matrices remains intact. No gameplay source files were modified in Stage 5.

## Scope and limitations of the proof

The browser exercises production Canvas drawing in a separately constructed game scene; the synthetic withheld schedule is deliberately severe and is not evidence that live adaptive frame-skip ordinarily starves five to fifteen callbacks. The crowded 100-hit workload is deliberately injected. The browser's phone viewport is **emulation**, not actual mobile Safari, touch/GPU/thermal hardware.

The Stage 5 smoke does **not** certify WebGL/PixiJS overlay fidelity, representative live-game camera scrolling or screen obstruction, perceptual noticeability in battles, natural 24-enemy crowded fights, overnight performance, or benchmark CPU deltas. Existing browser suites cover some separate behaviors but must not be represented as Stage 5 device evidence.

## Remaining visual and performance acceptance gates

The following must be marked **not verified** until independently evidenced on the exact candidate build, without assuming that an automated green result fills the gap:

1. Actual phone browser and representative Chromebook/desktop: essential cues are perceptible without stale flashes during 20/30/60 FPS preference use and adaptive skipping. Use real crowded combat and camera movement, with both normal and reduced motion.
2. Normal gameplay rendering cost and input responsiveness: measure representative combat with the Stage 2 developer recorder **off**, and compare against an equivalent current-main run with the same device/scenario. Check frame-work/render-time distributions, skipped drawing, recovery cycles, memory/thermal behavior—not apparent FPS alone.
3. Status clarity: Silence, Taunt and Slow and +N stay readable on small screens and do not obscure combat/targeting; late selected targets and bosses remain prioritized in crowds.
4. PixiJS optional path: verify the normal Canvas overlay still conveys important cues when enabled; retain the Keep/Revert safeguard.
5. PWA compatibility: same candidate works through installed/offline update flow and does not change saves or audio/gameplay; deployment only after explicit owner approval.

## Automated Stage 5 checkpoint — verified on 25 October 2026

**Exact code/test commit:** `9782970d1af25261b6b5386759ac5d28c780dcc0`.  
**Validation:** [GitHub Actions focused run 40222498065](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40222498065) — **PASS**; **24 relevant focused test files**, reproducible build and syntax checks **PASS**; Pages publish job **SKIPPED**. This is the validated code/test commit, not a physical-device release.

- **Production browser Canvas smoke:** tested desktop Chromium **1280×800** and phone-sized Chromium **393×852 emulation**, each with normal/reduced motion and 20/30/60-step controlled schedules. Every essential first-paint case produced nonzero actual changed RGB pixels; status priority/`+N` generated changed pixels; queue stayed at **40**; no forced additional drawings; game snapshot unchanged.
- **True developer UI and export flow:** `tests/effect-diagnostics-stage5-shell.test.cjs` creates Developer Mode via the actual in-game menu, explicitly starts/stops the recorder, observes an engine-generated hit, exports `Azeroth_Playtest_Report.json` with `performance.effectDiagnostics` **beside** preexisting frame-profile/frame-skip/crowd/party diagnostics, verifies stopping retains records and clearing discards them. In Normal mode, the controls and effect diagnostic export field are absent. The `?developer=1` URL **alone** does not activate the recorder in a Normal campaign.
- **Actual held target:** source review identified that `selectedHeroTarget()` resolves `manualHeroTargetId` / `manualHeroTargetZone`, not just `s.heroTarget`. The Stage 4 24-enemy selector now recognizes a valid-zone held target without invoking the potentially state-mutating `selectedHeroTarget()` method from a renderer. The updated native Canvas regression confirms an important 25th **held** target, boss, or squad-focus enemy can displace an ordinary one while keeping the 24-marker budget.
- **No new normal-player background work:** the recorder is never allocated unless explicitly enabled in the Developer Mode menu. The Stage 5 additions are test-only, an explicit focused CI test selector, docs, and the small selected-target lookup in the existing status painter. No recurring jobs, render requests, network diagnostics, saved-data fields or new screen-wide rendering passes were added.
- **Performance honesty:** Stage 4 status selection may scan later eligible enemies on an already scheduled draw to find priority targets instead of stopping immediately at the 24th status-bearing enemy. This is **bounded to the existing visual pass and 24 selected records**, but a device-specific CPU delta has **not** been measured. CI's five-draw software-browser medians are observational and cannot establish a matched-main performance regression or thermal safety. **Keep this as an open release gate.**

The exact validation includes **no actual iOS/Android/Chromebook thermal, GPU, offscreen/camera, crowded natural-combat or Pixi/WebGL acceptance**, and **does not authorize publication**. If a documentation-only commit changes the PR head, its own focused CI result must be checked before reporting the current head as green.

## Decision

**No release authorization.** Stage 5 adds a bounded browser correctness gate, but the actual-device and matched-hardware performance gates remain open. If the new focused CI run fails, fix the test or candidate on **this same draft PR**; do not weaken pixel/snapshot assertions or claim acceptance. If it passes, document exact run/head and report the *browser-only* acceptance, keeping the PR draft and unpublished. No player testing assignment or live build change is implied.
