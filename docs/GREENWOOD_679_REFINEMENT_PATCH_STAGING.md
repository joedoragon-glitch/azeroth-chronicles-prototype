# Greenwood Vale — post-release refinement staging

> **DRAFT WORKSPACE ONLY. NO PATCH IMPLEMENTED. NO FIXES AUTHORIZED.**
>
> This file exists solely to give the owner a single editable draft pull request before their complete playtest feedback has been collected. The living issue **[#679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679)** is the authoritative place to revise observations, evidence, preferences, and candidate work. This file is *not* a settled specification. Nothing in this branch changes the game's runtime, visual assets, spawning, navigation, balance, save state, or deployed release.

## Scope and relationship

- Game: *So I Became the Dark Lord's Problem*; Greenwood Vale **only**.
- Baseline: owner-accepted-for-initial-playtest flagship reconstruction merged as [PR #654](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/654).
- Follow-up: **one issue (#679)** and **one draft PR** for a single future patch. No other regions and no premature unrelated fixes.
- Creative authority: user feedback is **incomplete and editable**. The owner may change any direction at any time before approving the final patch plan.

## Candidate topics — observations, not implementation requirements

1. **Encounter pacing:** 32 ordinary Goblin/Skeleton field entities were preserved numerically, but the broader area and uneven route distribution leave quieter regions. Audit actual occupied/active/historical-save states and level-1 field onboarding before proposing redistribution or counts. No approved new count.
2. **Distinctive visual vocabulary:** do not confuse placed prop count (198→331) with number of unique meaningful visual/asset types. Compare unique old and new rendered types, find genuine losses (e.g., animal pen, poultry yard, wildflowers, camp identity), distinguish true absence from visual replacements, then compose any restorations intentionally. No approved restoration list.
3. **Thornfang/Mira patrol:** eight updated waypoints can be traversed, but waypoint labels, Orchard witness placement, territory coverage, long countryside/crossing legs, and proximity to the relocated farm/mill/Crypt/Goblin compounds may not reflect established wilderness scout/security lore. Preserve the moving captive, southern-first quiet opening, route clues, combat, reset, rescue and saves. No approved new route.
4. **Further live feedback:** owner has noted the region “looks decent, needs adjustments”; await specific visual and gameplay decisions, including any feedback that supersedes these observations.

See [#679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679) for measurements, nuance, source links and ongoing amendments. Avoid duplicating an evolving decision register here.

## November 3 source audit — provisional design, not a patch

The **full editable assessment** is recorded in [issue #679, “Design audit added 2026-11-03”](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679). Source has been read on current main. This staging file records the intended work boundaries without freezing the owner's choices.

### Scenery: prioritize distinct things and the stories they tell

The original outdoor census exposes 51 unique prop identifiers; the replacement has different procedural nature families, so 198→331 placed instances is **not** a valid diversity comparison. The eight discussed legacy visual types are not explicitly authored in the current replacement, but drawing support still exists.

| Current suggested disposition | Old unique prop types | Purpose in reconstructed Greenwood |
| --- | --- | --- |
| First restoration candidates | `animal-pen`, `poultry-yard` | Smallholds and Orchard Hamlet should look inhabited and fed, with penned/pastured animals and work yards |
| First restoration candidates | `wildflowers`, `reeds` | Flowering verges versus genuinely damp banks/millpond/headrace/tailrace; support distinct land use |
| First restoration candidates, tightly localized | `thorn-bed`, `bone-pile` | Signature Thornfang den/woods identity; only lore-compatible prey/funerary details, never arbitrary Crypt grave-origin claims |
| Conditional after visual inspection | `tax-post`, `bush` | One defensible estate/freight inspection cue and woodland silhouettes only where new procedural undergrowth is insufficient |
| No default restoration | old generic grass, emoji trees/rocks, `vale-fence`, `pillar` | Already replaced by richer terrain, designed perimeters or other more specific built context; review exceptions per scene |

Inspect actual unique *rendered* silhouettes, variants, density and use, not just token lists. Place any restored asset inside a deliberate farm, bank, camp, patrol, monster household or estate scene; preserve access to roads, water, services, enemies, authored compounds and player-owned structures. **No item quantity, precise placement or approved restore list exists yet.**

### Thornfang: same character and mechanics, better route geography

**User's preservation conditions:** original wilderness-scout personality, den/territorial story, southern-first patrol direction, Mira physically accompanying inspections as a captive, combat/aggro, first-level protection, surrender/reset/escort, rescue, saves, quest and rewards. Do not modify these while planning.

The existing eight *semantic* patrol waypoints are mapped, in the actual preserved direction, as:

1. Den (0) → southern woodland west-bank trail (7): scout outer woods
2. West → east bank at southern footbridge (7→6): secure genuine crossing
3. East bank → Crypt/estate perimeter (6→5): inspect construction compliance, outside paid work parcels
4. Crypt → Skeleton watch (5→4): inspect occupied watch/approaches without changing lore
5. Watch → north east freight bridge (4→3): scout eastern woodland/reclamation corridor
6. North freight bridge east → west (3→2): inspect shipping; update old “Mill crossing” reports
7. North west → Goblin frontier (2→1): intentionally use woodland outskirts, not the shortest path through orchard or working mill; inspect actual walked path
8. Goblin territory → den (1→0): return along plausible territorial woodlands

The static Orchard witness is currently near (850,750), about 1,350 units from the relocated orchard; choose either a renamed accessible western-road witness or relocating that same NPC to a safely discoverable orchard/hamlet edge. Do not silently clone a witness. Keep physical track clues and local reports useful rather than providing precise live tracking. The original eight-index travel logic should remain stable for old saves if feasible; optional patrol-only guidepaths can add route meaning without new quest objectives or public roads. Any indexed waypoint changes need explicit migration. Existing native evidence reaching all eight waypoints does not prove the entire circuit's final homecoming, land-use quality or real device experience.

**Open for owner review:** placement shortlist, witness placement/name, forest corridor, corridor mechanics, encounter contact frequency, pathfinding burden, and any other observations. Do not implement or trigger CI until the owner approves the final patch plan.

## Working procedure

- [ ] Continue gathering owner's firsthand notes. Edit the **existing** issue and draft PR rather than creating extra trackers.
- [ ] Distinguish measured behavior, inferred risk, owner judgment and actual bug.
- [ ] Reconcile conflicting goals (quiet settlement, active wilds, longer map, performance, lore).
- [ ] Receive owner's explicit approval of a final patch scope/design **before altering runtime or artwork**.
- [ ] Implement only approved Greenwood changes in this same PR and perform whatever focused verification/release process the owner then authorizes.
- [ ] Keep PR in **Draft** throughout preparation; do not merge or deploy without a separate go-ahead.

## Owner feedback additions / decisions

**Pending.** Write amendments in [issue #679](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/679), and reflect approved changes here only when needed for implementation. Every item can be revised or withdrawn.

**Current technical status:** Planning document only. No code/art modifications, no tests manually initiated, not merged, not deployed, not device verified.
