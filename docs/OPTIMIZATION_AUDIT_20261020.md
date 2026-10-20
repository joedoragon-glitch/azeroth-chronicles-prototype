# Optimization and visual-cache audit — 20 October 2026

Baseline: published `0.9.1+snapshot.dev.111`, source tree `aa3843a22741fd14a304a642fba073ad78223b0f`.

Joel requested a complete review of optimization settings and visual caches, then clarified that the outcome should be a robust system for reasonable devices. This is an in-progress checkpoint, not a performance certification or release receipt.

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

## Confirmed issues under investigation

1. Adaptive sharpness requires 16 samples inside a four-second retained window. At sustained 1–3 FPS it cannot collect enough evidence and fails to lower density. This is most harmful precisely when the player needs recovery.
2. Sharpness uses the whole target-frame budget for rendering alone. A mixed CPU/render workload can miss the target without triggering density relief, despite meaningful render cost.
3. Entering Optimization Mode drops projected patterns but retains decoded optional material images. This is bounded (~2 MiB), not an unbounded leak, but unnecessarily retains texture memory in procedural mode.
4. The exported FPS calculation discards all intervals of one second or longer. Severe active stalls can be reported as zero samples/zero FPS or an inflated average. Pause handling already has an explicit reset.

Focused reproductions, repairs, current-cache behavior and measured limits will be added before closeout. No broad browser matrix or whole-game stress run is planned.
