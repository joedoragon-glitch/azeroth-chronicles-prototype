# Hero-guided critical companion movement — dev.145

Joel directs two separate decisions within the established tactical judgment: critically wounded companions promptly follow the moving hero; after he stops, check their own actual warning/hazard footprint and make a bounded local escape if still exposed. Following overrides attack holds. A protected position may remain within an enemy's possible attack range. No new healing percentage, learned skill, teleport, damage modifier or persistent survival state.

Current implementation: per-campaign transient hero-motion observations; immediate follow/charge cancellation; stop-transition replanning; protected contributions from the current position; bounded stationary destination/route scoring using actual environmental states instead of possible attack-range discs. Physical hostile/terrain collision and existing friendly passage remain. Cooldowns, healing, 20% entry, above-20% situational rejoining, paid work/cargo and save schema retained.

Actual footprint inventory: native area patches/dual lines/cones, warned motion and aim lanes, incoming projectiles, generic persistent circles/expanding rings, all returned trap sites, Dreadmaw vapor/closure, Cinder cordon, Citadel board cells and Ashen cloud. Gaps and wave interiors remain distinct from filled damage circles; lookahead covers preparation and imminent moving hazards. Checks are current mechanical observations, not a guarantee against every future action. The moving hero retains guidance priority; physical collision remains authoritative.

## Checkpoint

53 focused new hero-guidance cases and 72 contribution cases pass. Critical-survival compatibility, native collision/judgment/Recall, phone startup and generated checks are being completed. Old tests requiring escape beyond possible enemy range are revised to the owner-approved nearby guidance policy; actual-danger, no-chase, timing and work/save checks remain.

After verification, rerun the original 16 audit probes and document which defects are resolved and which remain. Enemy withdrawal/placement is outside this patch; F5 must be checked and retained if unchanged. Publication pending; package-only workflow held temporarily until the normal workflow is restored after verification. No broad CI.
