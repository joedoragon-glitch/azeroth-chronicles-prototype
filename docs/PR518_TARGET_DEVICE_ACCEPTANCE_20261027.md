# PR #518 — targeted WebGL2 acceptance protocol (Stage 7)

> **Current status — 27 October 2026:** [#518](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/518) **merged and published**. The Stage 7 acceptance protocol **remains applicable and uncompleted**: physical Chromebook/phone Pixi-versus-Canvas parity, first frames, context loss, memory and actual frame pacing are **not** certified by the successful integration. Earlier text below about testing an *unmerged draft* and conditionally permitting *this specific PR's merge* is historical context; future fixes require a fresh issue/branch/owner release decision. Consult [current development state](DEVELOPMENT_STATE.md) before beginning a real-device run. This docs-only reconciliation does not approve broad browser or physical-device matrices.


**Original Stage 7 status:** manual plan for testing, **not** evidence of success. Game’s public branding is **So I Became the Dark Lord's Problem**. The published dev.242 code still offers PixiJS/WebGL2 as optional, with Canvas 2D the default. The later draft #574 proposes Pixi software-default and retains Canvas recovery; the proposal has not been published or verified on hardware.

## PR #574 WebGL2-default rollout acceptance addendum — 30 October 2026

This addendum **supersedes** the 27 October entry-gate instruction below to keep Pixi **opt-in** or avoid a default rollout. The owner has requested **PixiJS WebGL2 · Default** / **Canvas 2D · Backup** (Spanish: **Predeterminado / Respaldo**) and **no Experimental suffix** in the new selector. This is the approved **merge-first, owner-device-acceptance-afterward** rollout: player-facing default does not imply guaranteed performance or passing Stage 7. Publication and installed-device acceptance must still be independently verified. Keep older acceptance evidence below as a dated record.

On the **exact proposed commit and same real devices**, verify fresh install and upgrade from an older stored Canvas preference (migrate only once), subsequent manual Canvas selection surviving reload, automatic Pixi preparation **only after New Game/Continue**, and an accessible **Continue with Canvas** escape during slow graphics preparation. Confirm the **active renderer** in an exported report, not merely preferredRenderer. Check unsupported WebGL2, interrupted unconfirmed and confirmed starts, crash quarantine, actual context loss, PWA background→title→Continue, retained campaign saves and manual Canvas→WebGL **15-second Keep/Revert**. Compare cold/warm and long gameplay with Canvas backup for first-frame fidelity, visual effects, GPU pressure, severe stalls and sustained playability on the owner's Chromebook and a phone. Document measured failures instead of treating UI labels or software Chromium as proof.

**Current engineering evidence (30 October):** [PR #574 exact-head focused run #40844836507](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40844836507) **passed** on old dev.224 head (12 relevant suites, including the legacy desktop/phone Pixi browser smoke, plus build), **but did not execute** the now-separate `tests/pixi-default-browser.test.cjs` migration journey. The earlier combined [run #40827986894](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/40827986894) timed out after the migration subchecks printed PASS. [#572](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/572) remains an unmerged viewport-cache/performance draft; main already contains viewport-retained procedural textures and merged developer-only CPU draw-stage profiling in #623. Compare remaining unique work, do not merge stale code wholesale. Run the excluded default-migration browser test directly on the updated candidate, reconcile severe hardware performance findings and current main before any merge/publish. The historical authorization below only permitted **#518** to merge as an optional renderer; it is **not** a standing authorization for #574.

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
