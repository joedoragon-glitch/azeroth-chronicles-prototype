# Community Snapshot performance scope

Status: SOURCE ASSESSMENT ONLY. No current-version performance measurement or combat/AI profiling has run because the owner prohibited execution until final authorization. No FPS, memory reduction or load-time gain is claimed.

Baseline is merged #308 `6bc27be31792b1c38147d61e98ceed6acf3e2560`, not an old optimization branch. Reviewed prior terrain/road display lists, occlusion broad phase, projected material cache, outdoor 64 MiB floor picture, lazy 256 MiB sprite ceiling, audio hot-path and service-worker URL studies. Existing studies include mixed full-painter timings and do not prove a current bottleneck. They are not rerun or reimplemented here.

## Presentation change implemented

`renderer.js::visualPhase` was repeatedly hashing the same identity for body bobbing/aura/detail calls and across frames. It now memoizes the exact pure hash in a renderer-owned WeakMap keyed by the original `spriteIdentity` object (rather than a temporary render copy). The fallback identity string remains part of the memo record; changing it forces recomputation. No transform, curve, amplitude, clock, raster, draw order or saved field changes. The weak key releases departed actors with the renderer lifecycle; there is no unbounded strong-key Map or new pixel backing store.

This removes repeated hash arithmetic on a hit. It is a source-grounded redundant-work reduction, **not a measured bottleneck or useful whole-frame gain**. New art also adds drawing detail, so the full update could cost more to draw even if this helper does less work. Assess same-content memoized versus nonmemoized full painters after authorization; keep unfavorable samples. Existing full-painter reference uses current art on both sides and must retain exact state/pixel equality, baseline controls and bounded resource counters.

## Reviewed and retained

- Terrain/floor/road culling and caches already implement the main known environmental savings. Do not raster-cache moving trees, warnings, lights or animals into the floor.
- Existing sprite/material queues, LRU ceilings, source originals and failure/fallback behavior stay unchanged. Pets add procedural code, no image/download/decode jobs.
- New transient pet effects reuse the existing forty-effect priority queue and short lifetimes. No permanent effect store, arena hazard controller or retained pet Canvas.
- PWA install/error/navigation/cache-retirement policies and persistence durability remain unchanged. The source asset inventory includes `party-pets.js`; generation of all three entries and worker is deferred until authorized build. The independently authored audio audition page explicitly loads the owner too.
- No new loading concurrency, decode budget, eager preload in production, resource-format conversion, frame-rate setting or reduced-quality mobile mode.

## Combat and AI: assessment only

Source candidates for later profiling include repeated `zone().enemies` filtering/sorting in squad/boss contexts, line-of-sight/navigation queries, tactical observations, burst-window aggregation and projectile/hazard iteration. Dynamic summons and many effects may amplify those costs. These are **hypotheses from source**, not measured bottlenecks; no time percentages or ranking are claimed.

No performance optimization changed enemy targeting/AI, navigation, combat resolution, cooldown scheduling, simulation timing or decision frequency. The allied feature delta is separately authorized: pet dispatch and skill geometry/lifecycle, pet armor in the shared hit/held-roll paths, existing Soldier/Ranger skill improvements and ranged-pet screening. That delta must not be misclassified as a performance change. Enemy boss controllers and hero skills/AV remain protected except the one explicit pet-type armor inclusion in held-roll calculation.

Source-audit repair adds a pet-only firing-point search when its preferred anchor cannot provide a legal firing line. This is a bounded functional positioning correction, not an optimization. Its additional collision/line queries, actual projected pet shape outlines and the three further scenic anatomy/construction revisions add work that has not been measured. Retain those costs in the final full-frame assessment; do not attribute a whole-update gain to the phase memo.

## Deferred evidence

Record renderer phase p95/p99, full draw+readback and active cadence separately; counterbalance candidate/control, freeze presentation clocks, drain image queues and use identical current art/world. Cover the five regions and interiors, towns/crowds, mixed sprites/procedural bodies, day/night and supported phones/desktop. Observe floor/road/material reuse, retained sprite/material/floor bytes, scene churn and failed-resource fallback. Run current #308→candidate PWA upgrade/offline reopen with old Normal/Nightmare/Succession saves and historical TRUE victories. Do not report software-worker results as physical iPhone/Chromebook guarantees. Combat/AI profiling may be collected after authorization, but any optimization proposal remains unimplemented and outside this release scope.
