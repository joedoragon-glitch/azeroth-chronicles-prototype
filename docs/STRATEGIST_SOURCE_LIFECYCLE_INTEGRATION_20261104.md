# Strategist stable sources / Field Lab integration — 4 November 2026

**Integration-only, draft and dormant.** This stacked branch is based on Stage 3 Field Lab draft #782, not `main`. Its purpose is to reconcile the material resolver from #770 with Stage 3's genuine worker approach and deposit verification, and attach narrowly scoped regional movement signals. It does not admit the fifth hero class, run background tracking, change the save schema, merge, deploy or verify an iPhone.

## Owner boundaries

- **#770 owns the semantic source resolver**: `rules.environmentalSources[zoneId][stableKey]` declarations and `materialForProp(prop,time,zoneId,rules)`. Declarations are optional for existing native types; source keys are attached to a *real physical gameplay anchor*, not to art-only dressing, nor inferred from visual name. Missing/foreign keys fail closed; true water cargo, ore contents and active heat must still be proved.
- **#782 owns Field Labs**: preserve native budgeted `routeToSource` to a collision-safe stand-off position for water, lava and solid ore; preserve the real `source.point` as the sampled material location, the original `source.id` as the physical native identity, the exact route and worker reach/region proof, and recheck at sampling/deposit. The bridge now uses `materialForProp` rather than the legacy classifier, with no duplicate private classification.
- **World/region owner owns mutation events**: `Campaign.noteEnvironmentalSourcesChanged(zone)` increments a non-enumerable per-zone `environmentSourceRevision` only when a real prop/source/opaque-obstacle migration, move, replacement, deletion, eligibility or terrain change happens. No hot-loop or tick scans. In this integration branch, the native versioned Greenwood redesign/refinement, Crown and Frontier scene/edge updates, recovery/thermal staging and dungeon-space relocations call it. This list is an *initial set of existing migration events*, not a claim that all future writers are automatically instrumented. Future direct runtime source mutations must call the event at the mutation site. Replacing the zone object / props array already refreshes the lazy index.
- **v4 save owner**: the revision field is non-enumerable and is not serialized. The saved physical zone and code-owned declarations remain the authority; a restore reconstructs its transient material index. Do not add a saved parallel source coordinate ledger.
- **Original four classes**: `forCombat` fast-fails before zone work for Paladin, Mage, Ranger and Rogue. The Lab modules remain dormant and not installed into the player-facing module graph.

## Runtime contract

A real resource can keep `materialSourceKey: 'region-stable-resource-key'` when its visual `structure`, renderer asset, native prop ID or coordinate changes, provided the region owner retains the code-owned definition and actual live state. The next material query rebuilds its grid after `noteEnvironmentalSourcesChanged(z)` or explicit `Materials.invalidate(game,zoneId)`. Without that notification, the resolver rejects a removed/changed native prop in the old index, but does not promise to discover a newly nearby anchor or moved opaque wall. Per-frame scene fingerprinting is deliberately forbidden as a CPU regression.

The native Lab bridge always rechecks the *same physical source ID* and exact sample anchor with the current zone and source classification. A stable semantic key is **not** license to continue an in-flight job to a replaced prop; it must cancel/replan. Fire cannot be manufactured from painted equipment, Water from a dry cistern, Mineral from an empty cart, or Wood from protected residential props. Optical combat visibility does not grant workers pathing through walls, channels or lava. The worker's collision-legal stand-off and the elemental sample point are separate.

## Focused acceptance checklist

1. Semantic props are found only with current code-owned region declarations and authentic contents/heat; legacy natural sources still work.
2. Real water, rocks, lumber, fires and outdoor channels remain usable at appropriate current positions; protected/decorative props remain denied.
3. Replacement at the same array index immediately invalidates the old receipt, even before a revision notification; new anchor becomes discoverable only after notification.
4. In-place relocation and opaque wall movement refresh upon a one-time native event; no `zone()` query or render-frame scan.
5. Lab route-to-solid-edge and walkable source approach remain bounded and physically checked. An in-flight worker whose source disappears/replaces cannot create warehouse samples.
6. Actual native Greenwood, Frontier and Crown authored/migrated zones plus historical v4 restores remain unchanged in content; source revision is omitted from JSON serialization. Tests must use real Campaign data and real navigation where possible.
7. Existing four playable classes remain untouched. The resolver stays dormant until authorized integration.
8. Focused CI and exact commit results are recorded only if actually executed. No full-suite, merge, publish or device claim.

**Branch collisions / later gate:** #769 separately owns the unmerged Dark Crown overhaul and edits `world.js`. At the actual regional integration point, replay its final scene-mutation events through the single `noteEnvironmentalSourcesChanged` contract without copying pre-overhaul art IDs or overwriting Crown's source. #770 and #782 currently both edit `strategist-materials.js`; this branch supplies the combined implementation for review, not an independently accepted merge. Source changes must be reconciled with E0 #780 and save integration only when those owners are ready.
