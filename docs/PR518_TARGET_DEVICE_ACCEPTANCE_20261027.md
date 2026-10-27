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
