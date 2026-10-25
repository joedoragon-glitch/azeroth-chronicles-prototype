# Azeroth Chronicles — Stage 5.2 Phase B: protected presentation contract

**25 October 2026.** Continuing **draft PR #471 only**, branch `feature/dev-effect-tracing-stage2-20261025`. **Design/acceptance contract and test evidence, not an installed graphics-quality feature.** Unmerged, undeployed. The game remains a **multi-file GitHub Pages/PWA**.

## Why the quality choice must be information-safe

A future **Ultra / Balanced (default) / Performance** graphics selector should change *optional presentation cost*, not combat knowledge or outcomes. Current gameplay uses several different visual channels. Some visuals are derived directly from combat state, and others are short-lived entries in the fixed **40-item transient queue**. An effect's species, event type or owner is **not** enough to decide it is decorative.

This contract is for eventual quality-tier implementation and regression review. It does **not** claim that the present game already protects every essential cue under all overload conditions.

## Visual information contract

| Classification | Examples and current source owner | Required at every tier | Candidate for reduced ornament |
| --- | --- | --- | --- |
| **Danger geometry — essential** | Boss/ordinary attack warnings, active hazards, traps, charge paths, rings, canister corridors and safe gaps, chiefly `CombatVisuals.ground`, `EnemyVfxArt.ground` and live attack state | Exact warning extent, direction, safe openings, readiness/timing, contrast against terrain and night lighting. Never change combat hitboxes or turn a warning into a misleading impact | Redundant interior hatch marks, duplicate glows or fill ornament only after paired visibility tests prove boundaries remain comprehensible |
| **Physical flight/contact — essential** | Live `game.s.projectiles`, `renderer.drawProjectile`, `EnemyVfxArt.projectile` and actual contact events | Real bow/caster release, moving projectile, direction, flight and contact timing. Do not substitute a pre-contact flash | Decorative trails or secondary sparks that are **not** the projectile itself |
| **Hero ability identity — essential** | `HeroPresentation.queue/draw`, hero impact, heal, guard and interrupt feedback, bounded first-paint grace | Actual released skill/result must remain identifiable; preserve current 0.12s maximum conditional grace without requesting additional draws | Duplicate particles/secondary ornament, never the primary cast/result silhouette |
| **Ally/enemy combat state — essential** | Silence, Taunt, Slow, important debuffs, ward, rally and support indicators, `HeroPresentation.statuses`, `CombatVisuals.enemySupportStatus` | Selected target and late boss prioritization, existing +N overflow, meaningful status/guard/heal information | Only redundant decorative halos, not status meanings |
| **Cast/attack timing — essential** | `CombatVisuals.actorCues`, windups and special enemy mechanics | Countdown/progress and special mechanic information remain legible without obscuring action VFX | Duplicate title plates or nonessential annotations after overlap/accessibility review |
| **Result-confirming transient feedback — conditionally essential** | Queued recovery, interruption, impact, contact, pet/companion skill completion | The player can infer the meaningful outcome; preserve healing/guard, incoming danger and hit result, even when pet/enemy flourish is reduced | Extra decorative bursts; requires a per-identity audit to separate effect from meaning |
| **Purely optional flourish** | Verified duplicate sparks, cosmetic ground particles, ornamental pulsation/secondary streaks | None, if its removal does not hide identity, trajectory, source/recipient, status or mechanical timing | Eligible for tier-scaled omission/reduction |

**Classification rule:** default to **protect/unknown** until a cue is individually proven cosmetic. There is no permission to classify all `enemyVfx`, `petSkill`, `contact`, `projectile`, or all graphics with a low queue priority as expendable. Keep enemy and companion clarity even in the Performance tier.

## Current source constraints to preserve

- `CombatVisuals.queue` still admits a maximum of **40 transients**. Since **Stage 5.5** (see [bounded hero/recovery admission](EFFECT_QUEUE_HERO_RECOVERY_STAGE55_20261025.md)), overflow alone reserves **at most one latest meaningful hero cue and one latest player/ally healing receipt** before evicting the lowest-priority *other* entries. Ordinary hero and heal priorities remain **4**, and many hits use **1**. Intentionally silent normal hero-cast stages are not reserved; enemy recovery is not a player-healing reservation. At or below 40, admission is unchanged. This is a bounded **admission safeguard**, not permanent slots, guaranteed on-screen pixels, unlimited retention or a new graphics-quality tier.
- Active statuses use at most **3 screen positions per enemy** and **24 status-bearing enemies** per draw. Silence/Taunt/Slow and the current manually held target, selected target, boss/captain priorities must continue to work. Overflow reuses the third position as **+N**, not an extra position.
- **15 hero NORMAL cast stages can be intentionally blank**, with flight/area/chain elsewhere responsible for visible effects. Never generate a fake cast flash to satisfy a naive per-event pixel test.
- The first-paint extension is **at most +0.12 simulated seconds** for selected essential, never-painted cues; it forces **zero additional render frames**, excludes intentionally silent cast stages and expires on overlong withholding.
- Default FPS choice remains **Auto 20–30**, distinct from manual 20 FPS (which is not an overload signal), manual 30/60 and explicit Auto 30–60. Quality must not redefine FPS/resolution/skipping thresholds or emergency safeguards.
- The current Optimization Mode and `optimized` drawing flag are **not** an implementation of Ultra/Balanced/Performance. In an earlier four-variant natural Paladin sample, optimized On/Off gave the same cue coverage; reduced motion gave smaller but nonzero coverage. Do not rename current modes as if the new tier's visual behavior exists.
- No changes to cooldowns, hit registration, projectile velocity, enemy AI, saves, input, PWA offline behavior, player background work, or developer diagnostic opt-in.

## Phase B regression evidence added on the PR

**Test:** `tests/effect-quality-protected-cues.test.cjs`; new source/test commit [`a7d7d68`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/a7d7d68af600a8c5cef81bdab6b6c5331d1652c2).

It creates an isolated **Normal-mode** campaign and invokes a **real Thorn boss attack** to generate a telegraph, a real Paladin skill cast, and live five-status target information, then deliberately injects a healing receipt plus **100 synthetic low-priority hit events**. Native Canvas snapshots of warning and status layers are compared **byte for byte** before and after the bounded queue processes the events. The test asserts that the real cast and heal remain in the 40-entry queue, verifies the 40 cap, and checks the serialized gameplay snapshot remains unchanged.

**Exact-commit CI:** [run #40228190008](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40228190008) **SUCCESS** on `a7d7d68af600a8c5cef81bdab6b6c5331d1652c2`: **27 focused test files**, reproducible offline-ready build passed; publish job **skipped**. The specific test observed **15,317 alpha-positive warning pixels** and **373 status pixels** for its fixture. These counts indicate actual native Canvas ink; they do **not** measure human readability or device performance.

The independent Stage 5.2 mixed-crowd baseline `tests/effect-warning-crowd-fps.test.cjs` covers additional warning/hero/caption/status composition and 20/30/60/Auto draw gating. It remains a controlled synthetic crowd with real attack producers, **not** a naturally reachable battle nor a full renderer/device benchmark.

## Next actionable gates (order)

1. **Finish Phase A evidence without game edits:** compare same scenes with day/night and optional Pixi overlay where narrow tests permit; validate projectiles/contact and warnings from real producers. Avoid an unrestricted browser matrix or duplicate work on concurrent PRs.
2. **Phase B implementation:** define a presentation-only immutable policy mapping each audited identity/stage to `protected`, `optional`, or `unclassified`. Test every identity; unclassified defaults to protected. Never filter projectiles, danger or statuses through the transient queue's generic type.
3. **Only then consider Phase C:** one clear quality setting with device-local preference migration compatible with existing Optimization Mode; prove Ultra produces actual richer optional art, Balanced is sensible, Performance removes only verified flourish. No user-visible selector should ship before its policy and regression tests.
4. **Matched benchmarks + release gate:** desktop/phone-emulated Chromium, Canvas and experimental Pixi overlay, real phone/Chromebook visual/performance approval later. Real-device thermal/GPU frame pacing, human visual hierarchy, release integration with PR #464, and final owner authorization all remain **UNKNOWN / NOT GRANTED**.

**No release action authorized:** PR #471 must remain draft, unmerged and undeployed. This document and referenced GitHub files are a standalone continuation handoff.
