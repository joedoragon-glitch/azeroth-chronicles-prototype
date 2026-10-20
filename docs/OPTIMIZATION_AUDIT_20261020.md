# Optimization and visual-cache audit — 20 October 2026

Baseline: published `0.9.1+snapshot.dev.111`, source tree `aa3843a22741fd14a304a642fba073ad78223b0f`.

Joel requested a complete review of optimization settings and visual caches, then clarified that the outcome should be a robust system for reasonable devices. Candidate `0.9.1+snapshot.dev.112` repairs the confirmed issues below. Publication and the update-notice checks are pending in this preparation checkpoint.

## Inventory

| Control/system | Default and scope | Owner |
| --- | --- | --- |
| Optimization Mode | Off; device-local. Procedural materials, DPR ceiling 1, tighter small-clutter margins, simpler atmosphere/VFX/contours, no environmental audio sources | app, renderer, materials, audio-environment |
| Frame rate | Auto; starts at 30, tries 60 with headroom; manual 30/60. Limits drawing; simulation continues on animation callbacks | runtime, app |
| World sharpness | Auto; adapts backing density, minimum 0.75 or the lower device ceiling; Maximum opts out | runtime, app |
| Camera | Per-screen 100/150/175%; changes visible world area and consequently draw workload | platform, renderer |
| Sound | Master/music/ambience/effects/interface volumes and mute; these are mix controls, not a general CPU-off switch | audio-runtime, audio-mixer |
| Reduced motion | OS preference; simplifies selected animation effects, preserves cues | renderer, hero/enemy presentation |
| Pauses/background | Hidden tab skips frame work; visible paused/menu world draws at most 4 times/second | app, runtime |
| Movement planning | Shared per-tick route budget, cached paths/retry clocks and local actor bins; low-cadence crowd escape | navigation |

## Separate caches

These limits are ceilings, not memory reserved at startup. Image/Canvas estimates exclude browser/GPU overhead.

| Cache | Limit / lifetime | Actual purpose |
| --- | --- | --- |
| Decoded sprite images | 256 MiB ceiling, 2 concurrent decodes, lazy LRU with visible pins | Avoid repeat image decoding. Current manifest: 37 unique resources, 46,384,384 declared decoded bytes (~44.2 MiB), even if every resource is resident |
| Decoded materials | 2 MiB, 2 concurrent decodes, lazy LRU | Seven optional terrain/road textures |
| Projected material patterns | 8 MiB LRU, keyed by material and physical scale | Avoid repeating skewed isometric texture projection |
| Outdoor ground window | One window, 64 MiB ceiling, 256 presentation-unit margin (shrinks to fit) | Reuse static base floor during small camera movement; scene/scale/size/material changes rebuild it |
| Occlusion buffers | Four 256² and/or four 384² surfaces, lazy; at most 3.25 MiB logical RGBA | Reusable drawing surfaces for actor silhouettes under cover. Covered actors/scenery are still repainted into them each frame |
| Roads | One compiled geometry/command set with content validation | Reuse world-space geometry, not final pixels |
| Dungeon edges | Per ID/size, fixed authored campaign set | Reuse wall boundary geometry, not the dungeon floor image |
| Offline service-worker cache | Persistent files on disk; versioned manifests and hash-matched recording reuse | Installation/update/offline access; does not replace decoded images or renderer work |
| Decoded recordings | 32 MiB default, reference-aware LRU | Audio buffers; separate from all visual caches |

Development A/B controls `renderer.setGroundReuse`, `setOutlineCompaction`, and `Sprites.configure` are not player menu settings. The disabled viewport integration in renderer is an experiment whose prior paired controls did not establish a speed gain; enabling it blindly is not a repair.

## Confirmed issues and repairs

1. Adaptive sharpness requires 16 samples inside a four-second retained window. At sustained 1–3 FPS it cannot collect enough evidence and fails to lower density. This is most harmful precisely when the player needs recovery.
2. Sharpness uses the whole target-frame budget for rendering alone. A mixed CPU/render workload can miss the target without triggering density relief, despite meaningful render cost.
3. Entering Optimization Mode drops projected patterns but retains decoded optional material images. This is bounded (~2 MiB), not an unbounded leak, but unnecessarily retains texture memory in procedural mode.
4. The exported FPS calculation discards all intervals of one second or longer. Severe active stalls can be reported as zero samples/zero FPS or an inflated average. Pause handling already has an explicit reset.
5. `authoredPlaces` calls `crownMilitaryRoster` on frequent zone lookups. Each sort repeatedly recomputes distance to the same fixed military posts, even when no troop home moved.

The sharpness controller now retains two active observations at very low cadence and still rejects isolated loading spikes. It reserves observed pre-render headroom, with a floor that avoids needlessly blurring a cheap renderer during CPU-only pressure. Maximum remains an explicit opt-out; pauses reset evidence. Procedural mode releases decoded materials as well as projected patterns; stale decodes remain guarded. Active stalls stay in the FPS window, with fractional reporting below 10 FPS. The renderer reports outline-buffer residency separately.

Military-post distances use an unsaved WeakMap keyed by the enemy, zone and home coordinates. Moving a home invalidates immediately. Eligibility, sort order, troop names/roles and configuration still run normally; the cache does not freeze the roster or skip AI.

## Focused evidence

Controller traces compare the immutable dev.111 runtime with the candidate. At 1 and 3 FPS, the old density remains 1.5 indefinitely; the candidate reaches 0.75. A 28 ms renderer plus 12 ms pre-render work receives relief; a 4 ms renderer plus 40 ms CPU work stays sharp. Tests cover 0.2–60 Hz, isolated spikes, suspension/recovery, Maximum, storage failure and the existing FPS policy.

Sixty interleaved night-town ticks per region use the same realm, current content and deterministic state/RNG; only the original/cached roster function differs. Full state and effects match after every tick. Moving troop homes, changing eligibility and reversing enemy order also match.

| Local Node fixture | Original median tick | Cached-distance median | Reduction |
| --- | ---: | ---: | ---: |
| Frontier, night town, no hired party | 9.44 ms | 5.20 ms | 44.9% |
| Crown, night town, no hired party | 11.72 ms | 6.66 ms | 43.2% |

These are simulation timings, not total frame time or Chromebook FPS. Instrumented startup identified roster geometry as the dominant avoidable work in these fixtures; nested method timings are not additive.

Three frozen headless Chromium scenes exercise Frontier/Crown desktop and Citadel phone, with fully settled sprite queues and preloaded materials. Each graphics/density comparison has three interleaved timed draws after warm-up and forced readback. Outdoor floor painting stays zero while warm, and small movement reuses the window. Campaign state, camera projection and input inversion stay unchanged. The outdoor cache uses 38,925,000 bytes at maximum density and 9,704,448 at 0.75. Procedural mode releases all 1,835,008 decoded material bytes in this preloaded fixture. Citadel correctly uses no outdoor ground window. Outline pools stay bounded.

Local median full-draw costs at maximum → 0.75 density: Frontier normal 155.1→92.2 ms; Crown normal 124.1→63.5 ms; phone Citadel normal 58.0→45.9 ms. These are **software-rendered frozen draw costs**, not active-play FPS or a new before/after release speedup. The diagnostic graphics switch independently changes renderer/material/audio modes; it does not toggle the shell's separate DPR ceiling. They demonstrate density sensitivity and cache behavior, not device certification.

Reproductions: [Node/controller evidence](../tools/performance-audit-20261020/checks.json), [browser evidence](../tools/performance-audit-20261020/browser.json); corresponding `.cjs` files reproduce them. No raw owner save data is included.

## Findings retained for later measured work

- A warm ground cache still blits a large surface. More cache capacity does not eliminate that cost. Prior copy/bitmap/viewport experiments did not establish reliable gains; none were enabled.
- Roads, animated water/terrain, scenery, characters, dungeon floors and cover silhouettes still require drawing. The sprite cache avoids decoding; it does not cache every procedural draw as a final image. Static-scene caching needs animation, clipping and quality validation before adoption.
- 30 FPS caps rendering only. Simulation/audio observation still follow animation callbacks, including high-refresh displays. Changing simulation cadence requires timing/AI equivalence work and is not slipped into a graphics preference.
- Five generated outdoor zones produce approximately 384 KB per save. Snapshot/serialization alone costs roughly 9–12 ms locally, excluding browser storage latency. Timer and event saves can coincide; dirty-state/coalescing work should preserve all explicit/lifecycle saves. This is an occasional-hitch opportunity, not evidence of the sustained-render bottleneck.
- Optimization Mode defaults Off and Maximum is a deliberate user override. The three-million-pixel ceiling is softened by a minimum ratio of 1 at very large CSS viewports. Auto handles sustained pressure; neither setting guarantees a minimum FPS on every device.
- All visual cache ceilings are independent. Actual combined residency is more useful than adding theoretical caps; lowering the 256 MiB sprite ceiling blindly could cause decode churn even though this entire manifest estimates only ~44 MiB.
- Volume/mute reduces gain; it does not remove every audio graph/observer task. Optimization Mode actually stops environmental sources. Audio has its own bounded cache and voice limits.

Actual-device Chromebook/phone play remains the final performance check. No universal hardware/FPS guarantee follows from the local checks, and no whole-game stress suite or broad browser matrix was run.
