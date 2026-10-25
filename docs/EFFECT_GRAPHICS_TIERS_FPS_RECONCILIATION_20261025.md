# Azeroth Chronicles — Stage 5.2 graphics-tier / FPS / effect-budget reconciliation

**25 October 2026** — draft PR #471 **only**. This is a current-code audit and proposed policy, **not yet a graphics-tier rollout**. Do not merge/deploy or alter other draft PRs. Multi-file GitHub Pages/PWA stays canonical.

## User direction

- Effects may have fallen behind recent performance upgrades.
- Current default FPS preference is **Auto 20–30**, not Auto 30–60 or fixed 60.
- Telegraphs/warnings must remain mechanically clear but subordinate to the more expressive execution VFX.
- Provide an **Ultra** quality level for players preferring visual richness, a **Balanced default**, and a genuine **Performance-first** option that keeps hero skills and gameplay-essential warnings/telegraphs, while minimizing optional effects.
- Device slowdown and crowds should trigger appropriate *presentation* relief, but never modify combat/damage, warning boundaries, skill/projectile timing, input, saves or emergency protection.

## Current source verdict (PR head after Stage 5)

1. `src/prototype/app.js` initializes the FPS preference `'auto'` (default **30 → 20** under sustained load), Optimization Mode preference `auto`, adaptive skip On, automatic render resolution and 150% camera. `'auto60'` remains a separate explicit option. Existing device-local one-time preference migration must not be silently repeated/reset during later tier work.
2. `runtime.createFrameRate`: target interval `1000 / target`; default Auto demotes 30→20 at sustained drawn rate below 25, p95 above 33ms, or adaptive-skip pressure; recovers 20→30 conservatively. Legacy Auto 30–60 uses separate 30→60 criteria. Manual fixed 20/30/60 overrides exist.
3. `runtime.createFrameSkip`: ordinary pressure threshold uses current `1000/target`, NOT assumed 60 FPS. At most **two successive ordinary skips** and **350ms** max age for skip decisions. Emergency permits up to **five** and **650ms** while protecting simulation from critical stalls. Emergency mechanism cannot be disabled by a visual quality preference.
4. `runtime.createResolution`: automatic backing ratio takes the current 20/30/60 render time budget, with headroom reserved for non-render work. Optimization Mode On also caps backing DPR at 1 and suppresses some terrain/material/atmosphere detail.
5. `app.frame`: game simulation and transient FX aging execute *before* draw eligibility; FPS limit, adaptive skipping, resolution adaptation and auto Optimization are separate. Reduced motion is a media preference, not a full graphics quality tier.
6. `renderer.firstPaintEssential`: conditional max **+0.12 simulated seconds** first-draw grace and 75ms minimum drawable remaining lifetime for a narrow set of essential hero cues. This is time-based, not 60-frame-based; emergency or draw starvation can still exceed the grace and correctly expire a cue.
7. `CombatVisuals.queue`: transient effects remain capped at **40**. Since **Stage 5.5**, actual overflow reserves **at most one most recent meaningful hero-skill visual and one player/ally healing receipt**, skipping intentionally blank normal-cast stages, then sheds the lowest-priority *other* entries until 40 remain (see [Stage 5.5 evidence](EFFECT_QUEUE_HERO_RECOVERY_STAGE55_20261025.md)). At or below 40, admission/priority behavior is unchanged. This is **not** an FPS-aware/crowd-aware optional-detail policy or a tier-specific cap, nor proof that a retained cue is eventually seen. Actual projectiles, state-based warnings, hazards, statuses and enemy casts remain outside the 40-queue.
8. `HeroPresentation.draw` and some pet/hero artwork already respond to `optimized`, generally lowering decorative particles; `EnemyVfxArt.ground/actors`, `CombatVisuals.ground` and many other visual owners do **not** accept optimized tiers. Effect admission and warning geometry are unchanged by Optimization On. Thus the present Optimization Mode is **not** yet the requested performance-first effect tier.
9. The normal renderer draws `CombatVisuals.ground` as fill plus underlay-cue, and `actorCues` follows transient effects. Optional Pixi graphics use a transparent Canvas overlay, so source-level Canvas stacking does not establish full GPU visual parity.
10. Stage 5 warning audit `tests/effect-warning-budget-audit.test.cjs` passed on CI [run #40223491453](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40223491453) for source/doc stage head `d3822685e59fcea405cd1dbfc00aedfd4ad1fbb6`. It measured **11 genuine boss telegraphs**, 5-sample software Canvas drawing and alpha-pixel coverage. Example **Citadel canister** at 900×600: outline occupies **11,829 pixels (2.191%)** and projected **3,550** points over the 10 sampled fill+cue invocations; common basic cone has **1,350 outline pixels (0.25%)** and **830** projections; separate Paladin cast painted **89 pixels (0.016%)**. This is *not* a like-for-like perceptual test or phone performance benchmark. Do not cite it as an FPS gain.

## Proposed user-facing model — do not ship until validated

One understandable **Graphics quality** selector, independent of FPS and render-resolution preferences:

| Choice | Priority | Proposed behavior |
|---|---|---|
| **Balanced (default)** | Clear, attractive, prudent | Full core attack identity; moderated ornamental glow/particles and informational warnings with concise boundaries. Respond to *sustained* pressure conservatively; maintain gameplay cues |
| **Ultra (opt-in)** | Visual richness first | Retain richer attack palettes, trails and flourish where existing art allows it; no expanded hitbox/longer warning or extra simulated particles. Existing emergency stability protection and manual FPS choices still apply |
| **Performance (opt-in)** | Responsive combat first | Keep **all real warning/telegraph hit-area boundaries, timing, safe gaps and targeting information**, real moving projectiles, and the **hero's essential cast/impact/defense/healing cues**. Minimize or suppress *nonessential decorative* enemy/companion/pet flourishes and background ornament; strip interior warning decoration before changing required edge legibility. Maintain information-critical status and incoming-hit feedback; do not blindly remove essential ally heal/guard or boss-attack-confirmation cues |

**Clarification to implement cautiously:** “Only hero effects” should govern *optional VFX flourish*, not prohibit necessary player/ally/enemy state feedback. A soldier's guard status, a healing outcome, a moving enemy projectile or a damaging zone must remain comprehensible. Formalize per-identity protections using the existing catalog, not informal `f.type`-only filtering that could drop combat warnings or actual flight cues.

### Device-level response versus manual FPS selection

- **Manual 20 FPS is not a device-stress signal.** A player can select it for battery life while choosing Ultra. Do not reduce effect richness simply because `fps.target === 20`.
- **Auto 20–30 demoting 30→20, repeated frame skips, measured render-time p95, and crowded-scene presentation demand** are candidate inputs for reducing *decoration*. Reuse existing sampled metrics; no per-frame image-readback, network instrumentation, user save mutation or telemetry.
- Preserve current game and frame-skip safety logic; a visual tier only affects optional presentation.
- Make graceful degradation monotonic and hysteretic: when over budget, remove duplicate interior particles/secondary highlights/labels first; retain edges and hero cues. Restore only after sustained headroom to prevent quality flicker.
- Do not impose arbitrary new lower effect caps simply because 40 is the present limit. Measure queue occupancy, priority drops, and explicit protected-slot needs; identify current owner/identity before admission/culling policy changes.
- Account for first-paint timing at actual 20, 30, 60 permitted draws and two adaptive skips, including the bounded grace/overdue-expiry. Explicitly test emergency 5-skip scenarios without pretending every short cue must appear; never force a new frame.

## Implementation sequence — pending measurements/tests

1. **Phase A: instrument / establish baseline, no gameplay changes.** Extend CI-native and browser test scenes with 20/30/60 FPS preferences, actual renderer `optimized` toggle, normal/large crowds, stacked telegraphs and effects; collect alpha coverage, `ground fill`/cue/actor-caption/real VFX cost, and weighted queue drops. Keep hardware claims separate.
2. **Phase B: establish protected presentation contract.** Classify hero/protected status, enemy danger geometry, real projectiles and high-priority result feedback; tests prove performance mode never hides required cues or distorts damage/warning footprints. Centralize *presentation-only* rules and test all modes.
3. **Phase C: add quality selector and migration without disrupting saved choices.** Decide interaction with current `Optimization Mode: Off/Auto/On` explicitly before exposing another confusing toggle. Migrate only once if justified, preserve device-local choices and existing 20–30 default. An “Ultra” label must map to a demonstrably richer presentation—not merely rename the current Off mode and promise extra detail.
4. **Phase D: optimize double drawing and decoration where evidence merits it.** Compare baseline same-scene warnings/effects with first-paint and actor-label overlap tests, day/night/zoom and reduced motion. Keep shape geometry collision-authoritative. No bright-outline removal without visibility evidence.
5. **Phase E: verify in Chromium phone-emulated and desktop, Canvas and Pixi overlay, plus true device checks later.** Report median/p95 costs and responsiveness on matched scenes; do not infer performance improvement from lower alpha alone.

## Safeguards and acceptance matrix

- **Default Auto 20–30 / manual 20/30/60 / explicit Auto 30–60:** all remain available unchanged. Never silently return default to 60.
- **Transient effects:** 40 current cap; 3 markers per enemy; 24 status-bearing enemies. Any budget/priority policy change needs specific regression and baseline cost evidence, not an assumption.
- **Warn-before-impact:** maintain true warning timing, safe spaces, charge/canister/ring geometry, status clarity and player target; hero/projectile execution must remain visually distinct.
- **Visual contrast:** warning must be readable but not a large brighter “fake attack”; don't let bulky cast-label panels eclipse actual spell animation, especially on phone.
- **Stability:** never disable adaptive skip emergency, freeze rescue, PWA offline/save protections, reduced-motion choices or Canvas fallback.
- **No performance claim before matched device measurement.** Native Canvas alpha, simulation skip tests and automated renderer p95 are bounded evidence, not physical thermal/GPU FPS.

## Phase A initial CI-native baseline (25 October 2026)

**Test-only follow-up:** [commit `93ca6688`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/93ca6688bfe2a21e44979f32b4efc5f699a79e6e) updated `tests/effect-warning-budget-audit.test.cjs` to paint the *same real Paladin normal Skill 1 cast* in four existing rendering combinations: optimized false/true × reduced motion false/true. The test requires nontransparent cue pixels in every case and a byte-identical gameplay snapshot before/after drawing; it does not add a setting, quality filter, telemetry or new player workload.

**Exact source test CI:** [focused run 40226243579](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40226243579) — **SUCCESS** on source commit `93ca6688bfe2a21e44979f32b4efc5f699a79e6e`; **25 impacted test files passed**, reproducible offline-ready build passed; Publish focused update **SKIPPED**.

CI-native 900×600 isolated positive-alpha sample of the same cue:

| Presentational flags | Positive-alpha pixels | Scope of inference |
|---|---:|---|
| Full detail; normal motion | 89 | Baseline for this single Paladin cast stage |
| Full detail; reduced motion | 78 | Cue remains painted |
| Optimized; normal motion | 89 | Existing optimized flag did not change this specific cue's pixel coverage |
| Optimized; reduced motion | 78 | Cue remains painted |

The five-call timing medians are deliberately **not** treated as matched hardware costs, quality rankings or FPS gains; sample sizes/CI software rasterization are too small for that. The unchanged 11-real-boss footprint sample stays in this same test. No representative mixed crowd, camera/zoom, actor-caption occlusion, actual 20/30/60 FPS *preference* comparisons, Pixi overlay parity, or physical-device cost was certified by this new matrix. They remain subsequent Phase A / Stage 5 release gates.

**Interpretation:** The result supports keeping this Paladin cue protected across existing detail/motion switches. It also confirms that the existing optimized boolean is not sufficient evidence for an `Ultra`/ `Balanced`/ `Performance` distinction: a credible future quality level must visibly change genuinely optional visual detail without sacrificing the cue.

## Status

**Stage 5.2 audit and recommended policy documented.** No Ultra/Balanced/Performance implementation, effect cap change, or warning restyle has been shipped. Hardware release gate remains open. Continue independent correctness/performance research within PR #471. Do not require owner playtesting merely to proceed with automated source and browser work.
