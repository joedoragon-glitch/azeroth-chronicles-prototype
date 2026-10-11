# Proportion implementation checkpoint

Status: Initial presentation-scale pass in progress; detailed original-master replacements are a separate production step.

The existing outdoor map dimensions remain 2700, 3000, 3400, 3400, and 3800 world units. Configured ordinary enemy counts remain 32, 40, 48, 56, and 64. No global map expansion is justified by this initial pass. Keep their coordinates, pack memberships, travel links, and saved campaign geometry unchanged.

Runtime classifier `PrototypeVisuals.featureScale` gives cottages and habitable structures 1.40x, major entrances/transports/barracks/occupation buildings 1.35x, and trees including orchard landmarks 1.30x. Small props and combat actors remain at 1.00x. These are world-object presentation multipliers in addition to the selected 150% camera, never new combat or movement scale.

Procedural features without an active registered sprite may use the new proportion scale immediately. **Registered 100% sprite exports are not enlarged**: they retain their previous appearance until a fresh original-master asset meets the required 4.00x or 4.25x raster density. The presentation helper checks actual resource dimensions before enabling the new world size for that sprite. When it qualifies, procedural fallbacks, labels and shadows share the same transient `visualScale`. Gameplay objects, saves and existing art binaries remain untouched. This is not itself a completed detailed-artwork upgrade.

Native original-master export budgets: standard 192 logical unit frames use 576px at 1.00x, 768px at 1.30x, and 816px at 1.35–1.40x. They include transparent padding. Source originals must have enough real pixels; never enlarge old small game exports. Future sprite contracts must not bake in another copy of the runtime visual multiplier.

Run `tests/world-proportions.test.cjs` and the complete standard/regression and browser checks. Before moving scenery or extending a boundary, measure edge use, object clearances, path accessibility, encounter spacing and travel pacing. Prefer reusing underoccupied edges, reducing decorative clutter and shifting furniture to expanding regions. Preserve enemy counts and authored hostile encounters. See `docs/WORLD_PROPORTION_AND_DENSITY_GUARDRAILS.md`.

Keep production checkpoints, art sources, approvals and rollback records. Do not claim this proportional presentation pass completes the visual redesign, map spatial audit, or all sprite replacements. Continue from untouched generator originals and evaluate at native 150% in the actual game.
