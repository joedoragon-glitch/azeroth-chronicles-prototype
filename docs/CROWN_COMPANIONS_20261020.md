# Crown planning, companion safety and arc landings — dev.110

Joel requested a Crown aesthetic/planning pass using the existing regional identity, repairs to all three remaining companion audit findings, and a final audit followed by merge/publication without another confirmation. He subsequently reported fortified arrows continuing after their visual arc landed. The announcement may follow publication.

## Crown audit and repairs

Crownwatch's scattered houses and services now occupy connected street frontages around a paved civic court. Ash Refuge's homes, well, laundry and work props are grouped on dry western plots. Streets use the available north/west/south space rather than stretching every structure along the central line. The existing town rock cluster is reused in the western/southern volcanic landscape; conflicting natural dressing clears doors and routes. Existing military compounds and wild habitats retain their roles and enemy placements.

The main lava channel spans y=0–3800, with both existing bridge locations and full crossing widths retained. Floor clipping removes the map-edge ground cap. Loose domestic/work props have useful bank setbacks. The crystal shipment and southern levy chest move off the crossing into bank-side logistics plots; their identities, quantities, hidden/discovery identities and resource groups remain. Their routes and the shelf marker connect to roads.

The two detached lava formations read as contained industrial heat raceways: masonry end walls, insulated rims and dry work aprons beside established glass/ceramic kilns, flues and thermal equipment. Their collision rectangles and dry gaps remain. Crown lore already establishes this industry; no new ore-minting or invented economic system is added.

The unexplained obsidian circle at (1850,3150) becomes a bronze survey orrery on a Crown masonry plinth, with gilt rings, a purple globe and crown plaque. Its smaller radius-70 body opens more walking space inside the former radius-165 blocked circle; the paved apron is walkable. This is a landmark, with no new menu or mechanic. It stays at the old circle so it does not create a new solid obstacle under existing player camps.

Shared watchposts now have four supported feet, stone pads, diagonal bracing, a guarded perspective platform, continuous ladder and compact roof. The same procedural asset is used across regions. Catalog 096 has no active raster binding; this visible correction is not hidden by an old registered sprite. Existing character bodies, arms, hair, lips and staffs remain untouched. Veyra's unapproved correction stays aside.

The Citadel's muster, command, ritual and inner gate openings widen within their original wall envelopes. Enemy placement and encounter progression remain. The native Citadel, Cindermaw Treasury and Ruined Foundry were reviewed; their existing furnishings have clear working/military roles, and 66 static approaches to exits, services, enemies and objectives pass. The Treasury and Ruined Foundry need no extra filler or shell expansion in this pass. This does not certify a whole live encounter or every random seed.

## Save and access audit

The normalized dev.109 fixture retains all 291 original scenery records and all 66 enemy records, including positions, homes and dead state. Of those scenery records, 103 move in the final candidate. Twenty-four building fronts and 44 footpaths connect to streets. Authored streets, paths, services and bridge decks pass physical-clearance checks. Migration is one-time/idempotent; reload retains plots, roads and paths, and rescued specialists use their reserved plots on later refresh.

The audit caught and repaired a house on the dragon approach, a house on a new street, residual town rock clutter, bridge-top logistics clutter and an overly strict player-distance tether. Player constructions take precedence over new scenery plots. A pre-existing camp in the newly extended lava corridor receives a retained masonry deck rather than being moved or submerged. Scenery newly touched by that extension is repaired before restore's generic invalid-prop filter can discard its identity. Existing v4 save schema/storage keys remain.

Evidence: `tools/visual-review/crown-companions-dev110/`, including normalized old save/census, exact relocation receipt, native before/after day/night views, industrial areas, bridge approaches, map boundaries, interiors and isolated new structures. The capture script can use the retained dev.109 source tree via `CROWN_REVIEW_SOURCE`. Existing room combat normalization completes before testing render-state purity. Exact native boundary pixels verify lava at both mouths and background beyond them.

## Companion audit repairs

The original report remains in `COMPANION_BEHAVIOR_AUDIT_20261020.md`; its historical findings are not overwritten.

- At or below 20% HP, one nearby ordinary foe is enough to trigger withdrawal. Six Soldier/melee-pet cases across all three hero classes enter retreat immediately and move toward support. Existing defensive cover attacks may happen while withdrawing; retreat does not guarantee survival from an already critical state.
- Offensive routes check intermediate turns and the actual final stopping position against the player and real nearby healthy combat allies. An unsafe route is refused before the unit advances, then its next judgment triggers regrouping. Working companions and allies separated by walls do not count as support. The original roughly 570-unit detour no longer takes units outside support; additional intermediate-turn and supported-approach cases pass. Recall, gathering and retreat travel are exempt from the offensive tether. Cached route retries and the existing movement-planning budget remain.
- Gathering/regroup danger envelopes use the authoritative effective enemy acquisition/ranged reach, including fort bonuses, plus the existing 35-unit margin. The reproduced 350-unit path is rejected against a 400.4-range garrison archer; the avoidance radius is 435.4.

New transient pursuit receipts use weak collections, not saved AI fields. Existing judgment, supported hero combat, idle-enemy restraint, hysteresis, one-press Recall, retreat protection, resource priority, self-defense, safe delivery and complete gathering-trip checks pass.

## Fixed arc landing

The arrow's height previously reached zero at its aim point while the simulation continued travelling through its remaining lifetime. Arcing enemy shots now have a fixed landing distance and matching flight lifetime. The last movement step is clipped to the remaining flight time. A dodged arc produces one ground impact and is removed there: no homing, floor sliding, overshoot or bounce. Existing hit and obstacle contact remain terminal. Friendly projectiles and enemy straight shots retain their existing behavior. Normal and long-final-tick reproductions, actual dodge/hit and fort/low-cover checks pass; native flight/landed captures and coordinates are retained.

## Validation and boundaries

Focused companion/judgment/Recall/gathering checks, regional navigation, fort coverage/defense/cover fire and new landing regressions pass. Build/generated syntax, sprite/material/audio integrity, changed-source formatting and packaging are checked for the integrated candidate. Thirty-three registered native generation references are pixel-identical to dev.109. Two pre-existing stale comparison receipts (Mage and Frontier dead tree) are refreshed with exact prior/current comparisons; every raster/source/clip/placement remains unchanged. No new raster appearance acceptance is claimed.

No whole-game/browser matrix or device-FPS claim. Map retheming remains deferred. The design handoffs preserve native references and actual implementation authorization without inventing approval of unseen exact art.

## Publication

Prepared in PR #344. Package-only publication and exact live verification follow the completed local audit.
