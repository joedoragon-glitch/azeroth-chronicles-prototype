# PR #518 — targeted WebGL2 acceptance protocol (Stage 7)

> **Current status — 27 October 2026:** [#518](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/518) **merged and published**. The Stage 7 acceptance protocol **remains applicable and uncompleted**: physical Chromebook/phone Pixi-versus-Canvas parity, first frames, context loss, memory and actual frame pacing are **not** certified by the successful integration. Earlier text below about testing an *unmerged draft* and conditionally permitting *this specific PR's merge* is historical context; future fixes require a fresh issue/branch/owner release decision. Consult [current development state](DEVELOPMENT_STATE.md) before beginning a real-device run. This docs-only reconciliation does not approve broad browser or physical-device matrices.


**State:** manual plan for testing, **not** evidence of success. Game’s public branding is **So I Became the Dark Lord's Problem**. The codebase is a multi-file GitHub Pages/PWA, with an optional experimental PixiJS/WebGL2 renderer and retained Canvas 2D fallback.

## Devices and permission boundary

**Primary reference:** ASUS Chromebook **CX5403CMA-DB588**, exact owner consumer SKU, **8 GB LPDDR5X RAM**, **128 GB NVMe SSD**. Record the exact CPU/GPU as detected by Chrome, ChromeOS version, Chrome version, `chrome://gpu` hardware-acceleration status, resolution/DPR and zoom instead of assuming from the model family. It is a real acceptance target, not a certified minimum requirement or proof about other 8 GB PCs.

**Secondary cohort:** modern Chromium desktop with ~8 GiB RAM, a modern Android phone/tablet near 4 GiB RAM or more, and iOS Safari/Home Screen PWA for compatibility/context loss where available. The exceptionally slow ~500 MB phone and twenty-year-old PCs are **not** required gates. Do not add RAM admission checks.

Use a **local checkout or specifically authorized preview of the exact draft branch SHA** and disposable/backed-up saves. The owner has authorized merging PR #518 into the playable game **after the exact-head technical validation is green and no blocker remains**, in order to conduct Stage 7 hands-on testing. This is permission to make the *optional* WebGL2 implementation accessible for testing; it is **not** certification that it is production-default or faster. Do not run a broad physical-device matrix or force Pixi as default. Collect explicit permission separately for publication.

## Entry gate before hardware trials

1. Confirm focused CI, syntax/build and PWA/offline packaging passed on the **exact** PR head. Previous green commits do not cover later changes.
2. Validate Canvas baseline New Game, Continue, historical/recovery saves, conflicting writer, title idle, Return to Main Menu, bilingual navigation and critical visual cues.
3. Confirm Pixi remains opt-in, Keep/Revert works, hardware WebGL2 is actually available (not software fallback), and a failed attempt produces Canvas without losing the save or replaying a paid native action.
4. Use the same save, quality/profile, version, zoom/DPR, viewport, language and cold/warm state for an **A/B comparison** against original Canvas 2D; keep separate results for software-GPU browsers.

## Essential Pixi presentation candidate — 28 October 2026

[PR #554](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/554) implements three previously missing Pixi features: live Crown drops via one reusable GPU texture made by the existing Canvas coin painter, the exact Canvas attack/movement/idle facing for registered and procedural actors mirrored at the foot anchor, and the existing pause dimming/text in the Pixi cue overlay. The Crown texture is invalidated on resolution and viewport changes and on fallback; the artwork, loot economy, save keys, world mechanics and Canvas default remain unchanged. The exact implementation and repository publication status must be checked in [current development state](DEVELOPMENT_STATE.md) and PR #554. Neither merged source nor successful GitHub Pages publication establishes visual or physical-device acceptance.

Focused regression assertions cover coin sharing, current-zone drops, pickup disappearance, density and viewport recreation, actor flip and foot-anchor alignment, and presence of the shared pause cue in the Pixi overlay. Real-WebGL screenshots and physical iPhone/Chromebook checks remain separate. On devices compare actual earned Crown loot in daylight and nighttime; directional combat and idle motion for hero, companion and enemy; paused appearance; rotation, quality changes, Keep/Revert and fallback with a visible drop. Do not infer hardware success from source tests alone.

## Real-device scenarios

| Trial | What must be observed and recorded |
| --- | --- |
| Cold launch → title → Continue | First *correct* responsive frame, paused title/game time, source preload + upload stages, stuck-loading/fallback behavior |
| New Game → near-spawn foes | Actual enemy artwork and essential attack cues visible on the first hostile frame; no unintended grace time or gameplay RNG use |
| Vale / Millhaven → goblins | Near-threat prioritization, first attack timing, long frame stalls, recurrent attack bakes, resource uploads |
| Main dungeon + side dungeon + supply room | Construct zone only through original action, close-range enemies ready behind interlude, first frame painted before input/combat resumes |
| Normal regional travel + hub + return | Native action exactly once, correct spawn/HP/quest state, cache reuse and terrain lookahead hit/miss |
| Heavy combat across all three classes | Mandatory combat cues and controls correct; optional terrain prep and aggressive soft eviction suppressed near enemies |
| Long roam and revisited area | GPU/process memory growth, texture-bake/eviction trends, return to same zone, repeat-fight stability |
| Browser context loss, GPU opt-out, missed asset | Canvas fallback, accessible retry, no stale async reveal, no unsaved-progress loss |
| Resize/DPR/zoom, water, day/night | Side-by-side Canvas parity, alignment, animation, effects and no half-drawn background |
| Phone rotate, hide/foreground and PWA resume | First frame correctness, writer ownership, title-vs-running distinction, input/touch recovery |

## Evidence table to fill per run

`Date / commit / device exact SKU / OS+browser version / hardware or software GPU / graphics mode / quality preset / width×height / DPR / scene + save / cold or warm / run number / first-playable ms / p50,p95,p99 and worst frame ms / input responsiveness / CPU bake count+ms / GPU prepared inputs+batches+ms / procedural estimated bytes, hits and evictions / terrain lookahead promotions and misses / observed process+GPU memory if available / screenshot or trace link / pass, fail or unmeasured / notes.`

Repeat trials on the same scenario to estimate percentiles. Do **not** interpret a mock upload count as a GPU allocation receipt, Pixi cache bytes as total process RAM, or a single trace as a stable performance improvement. Do not invent numeric results or a hard FPS acceptance threshold before measuring.

**Gate:** gameplay/save safety, bilingual UI, essential cues, correct first frame and Canvas recovery are non-negotiable. A Pixi performance win requires measured, repeatable improvements or at least acceptable tails and memory on the owner Chromebook and supported phones. If Stage 3 terrain lookahead or Stage 6 cache policy causes real hitches or visual divergence, disable/revert the optional optimization in the draft and retest; never weaken authoritative game safety. Stage 7 concludes with the owner's hands-on report and an explicit later decision on **graduating Pixi from experimental to a supported/default renderer**. The owner separately authorized this specific post-CI PR merge to make the implementation playable for testing; merge does not itself establish GPU acceptance or authorize removing Canvas.


## Issue #708 V-04 — Pixi cached liquid motion correction (31 October 2026; draft)

[Audit PR #710](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/710) reproduced a **current functional parity defect** at main `f6f1412`: original Canvas displays time-dependent white water highlights in the Flooded Marches and moving orange lava streaks in Dark Crown, while optional Pixi's cached terrain keeps the identical water/lava channels static. The real Chromium pixel/screenshots and effective Optimization status are preserved in [run #41195122048](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41195122048), artifact `environment-708-real-render`. The saved Off preference triggered effective Optimization On in this software-GPU comparison; **nothing about actual effective Off, Auto, Apple hardware, or performance is certified by this baseline**.

[Draft PR #718](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/718) **implements**, independently of Wraith #715, a minimal correction: preserve original Canvas terrain's live painting; omit only the already-authored moving liquid highlights from Pixi's fixed terrain tiles/backgrounds and emit the same original world-space positions, sinusoidal timing, stroke colors and widths through a viewport-culled graphics layer between retained scenery and actors. The correction must not invalidate the region cache per animation tick or introduce new world simulation, weather, effects, soundtrack, or art direction. The remaining static water/lava bodies, roads, collision and bridges are unchanged. This is an **unmerged implementation candidate**, not deployed or device-verified.

**Verification boundary, updated by the owner on 31 October:** Before merge, require deterministic native water/lava time and static-cache checks, screen-space/actor layering, Wraith real-browser light input, saved-state purity, focused regressions, unchanged renderer fallback, and reproducible PWA/offline fingerprints. The already observed real software-WebGL2 liquid evidence is retained, not reclassified as device testing. Broader effective Off/Auto, 100%/150% zoom and re-entry, twilight/room transitions, hardware performance and final locale judgment are reserved for **after owner-authorized merge**, with physical iPhone/Chromebook checks performed by the owner. No merge or publish is implied.


## Issue #708 joint Wraith + liquid pre-merge verification (31 October 2026; draft)

An independent integration branch combines both corrective changes: living nonboss Flooded Marches Wraith glass lighting from [draft #715](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/715), and Pixi cached-terrain water/lava motion from [draft #718](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/718). The native Canvas painting path and campaign simulation/saves are unchanged. The combined draft must pass its real Chromium Wraith light smoke, native source/liquid-motion and GPU stage/layer tests, reproducible build, source/sprite fingerprints, and PWA lifecycle. The first combined [focused CI #41206973438](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41206973438) passed **22 focused files**, including real-game stationary Canvas/Pixi water and lava. That head predates the newly merged #719 test-only cold-crowd fixture, which was integrated into this candidate without changing the visual runtime. Repeated later attempts to stress the same full-game software-GPU browser session triggered existing *critical slowdown → refuge return* in the original Canvas renderer, so the extended `tests/environment-liquid-motion-browser.test.cjs` stays **present but manually deferred**, not passed or deleted. Keep mandatory native liquid animation, deterministic positions and cached-ground checks; do not disable gameplay recovery or fabricate a green stress receipt. The owner explicitly assigned hardware and broader locale acceptance to post-merge. Independent individually green [#715](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41188234809) and [#718](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41197904263) remain supplementary evidence, not combined-source CI.

The [#710 audit](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/710) contains 35 original-game Canvas location images and historic defect reproduction. Clean native source/region acceptance is reused, but its standalone historical Greenwood poultry assertion is **baseline RED and independently deferred**, not a test exception installed in the combined branch. The pre-merge review does not authorize inventing environmental effects, changing lore, altering the score/audio, adopting Pixi as the default, merging or publishing. Owner physical iPhone/Chromebook performance and final creative assessment explicitly follow an authorized merge; CI must not be presented as device or artistic certification.
