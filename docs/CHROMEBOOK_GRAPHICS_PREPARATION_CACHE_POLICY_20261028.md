# Chromebook-first graphics preparation and cache retention — draft #573 (28 October 2026)

**Status:** Historical 28 October graphics-preparation contract. The manual Canvas loading escape described in the original PR #573 is superseded by the owner's **16 November 2026** player-facing simplification, merged source-only via [PR #897](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/897). The older cache findings remain historical; do not read this file as proof of a published/device-verified change. Official game name: *So I Became the Dark Lord's Problem*.

## Player-facing behavior

On Continue, New Game, and transport/dungeon transitions, loading prioritizes a prepared first playable scene over a fixed loading duration. The player might see a longer loading stage on a Chromebook; a faster device may finish quickly. Gameplay time, combat and movement do not advance behind the covered arrival screen.

**Superseding loading UX (merged source-only; not published or device-accepted):** The title and travel loading screens do not offer a manual **Continue with Canvas / Continuar con Canvas** action. An actual WebGL error, context loss or failed GPU scene preparation invokes the renderer guard's automatic Canvas safety path, preserving an already confirmed WebGL preference and its controlled recovery. Slow-but-active preparation is not automatically classed as a graphics failure. If both rendering paths fail at a committed destination, keep the scene covered, preserve its save and offer only a renderer-neutral **Retry loading / Reintentar carga** action; never replay travel or spend fare twice. An individual image request or decode that fails to settle within 60 seconds is marked unavailable and its reserved decode slot is freed; existing procedural artwork is the fallback. This bounded per-resource guard is separate from WebGL failure recovery and does not impose a 1.8-second GPU or whole-scene deadline. GPU preparation and arrival use a separate progress-aware 120-second inactivity guard: observed texture, terrain, procedural, and upload progress resets the timer; a genuinely unresponsive GPU attempt falls back through the existing renderer controller, not a player choice. Native focused and targeted browser CI passed for PR #897; real-device acceptance must still distinguish a synthetic stuck image from a hardware GPU hang.

Approved sprite resources and all selected nearby/encounter animation variants/clips are decoded before reveal where available. PixiJS procedural artwork preparation covers a wider nearby neighborhood and no longer stops after an arbitrary object count or 0.8/1.1-second work window. The first correct frame remains the reveal gate.

## Cache policy and scope

- Prioritize **cache reuse and smoother post-load exploration**, rather than eagerness to return to gameplay or preemptively disposing of useful graphics.
- The standard decoded sprite cache and Pixi procedural-art emergency ceilings rise to 1 GiB of **estimated decoded/CPU image bytes each**. They are not goals, app-memory usage reports, GPU memory readings, or promised minimum hardware requirements. Browser/device limits still apply.
- Normal Pixi actor frames no longer sweep the procedural cache at 75% usage and reduce it to 62.5%. Truly necessary hard-cap allocation can evict older, offscreen material; live visible material remains protected.
- The optional second CPU terrain lookahead window has a 256 MiB combined raster ceiling. **This does not create a complete cached map**, alter terrain algorithms or preload unvisited campaign zones.
- Valid cache identities still include relevant zone, scale, appearance, form and environmental differences. Do not merge distinct characters or change artwork merely to improve cache hits.

## Technical preservation contract

Preparing graphics must not advance game RNG, create an unvisited zone, change saves, simulate combat, spend fares, bypass renderer Keep/Revert, or lose historical save compatibility. The actual domain travel/admission action remains authoritative. The recovery and concurrency epoch still invalidate stale work after scene/renderer changes.

## Target acceptance

Test real cold/warm Continue, New Game, Greenwood goblin approach, dungeon and zone transfers on the ASUS CX5403CMA-DB588 Chromebook with optional Pixi/WebGL2. Record preparation duration, automatic Canvas fallback on genuine failures, neutral retry after both renderers fail, p95/p99 gameplay frame-time spikes after loading, texture cache hits/misses/evictions, whether the original stutter recurs on revisits, and real device process/GPU memory pressure where available. Compare with Canvas and a second fast device to check for regression. Maintain bilingual UI.

Do not interpret GitHub Actions green checks as device verification, or a longer loading screen as proof of better gameplay. If actual GPU resource exhaustion, hanging preparation, save/transition bugs or worsened stutters occur, fix/scale back this proposal before merging. No automatic full-region pre-rendering is claimed.
