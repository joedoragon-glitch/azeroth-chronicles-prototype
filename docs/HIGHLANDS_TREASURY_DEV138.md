# Ridge Tyrant’s Treasury — Crag’s defended household

Joel requested a complete procedural interior rework on 21 October 2026, in the same Highlands update/PR #374. He identified arbitrary scattering and assets extending beyond usable space, and required obstacles that shape combat while supporting the defenders. He suggested this might become a standard for the other Treasuries. This change implements only the Highlands Treasury; future regional adaptations should be judged against the pilot after owner play.

The Treasury belongs to Ridge Tyrant’s coinage administration. Crag Tyrant, his horned humanoid disciple/captain, runs its accounts, reserve and security household. Paid Crown riders and their larger armored direwolves share lodging, tack and bedding. The wider-region tribute concealment is Crag’s precaution, while Ridge remains Master of Coin.

## Spatial and aesthetic design

Receiving and household life occupy the western wing: check-in/trophy display, a hearth and supper/game furniture, followed by Crag’s private bed and resting couch. The northeastern account room has a ledger desk and a new weighing/audit counter. The inner hall contains sealed portrait-crown storage in a new reinforced silver-coin cabinet. The southern reserve is backed by armory, rider lodging, tack and mount bedding. Three existing quest cache IDs remain distinct. Seized-crown recovery keeps its own balance and collection rule.

A double-opening counting screen divides receiving from the guarded account hall; two masonry piers and a reserve screen create corners and alternate approaches. These are real collision/line-of-fire architecture. Warm slate, rust-toned bordered woven rugs, limestone courses, staggered mortar joints and metal cap details give the rooms a deliberate material hierarchy at the default 150% camera. Furniture is placed by use and footprint rather than scattered around a central fight.

All 16 earlier `treasury-N` prop identities remain, with the former loose hoard becoming sealed coin inventory. Two new props supply actual accounting/storage detail. All prop bases pass a 45-world-unit surrounding-footprint sample within usable architecture, and all cache/exit/defender routes are connected. The doorway remains a boundary threshold. Solid hearth, counter and vault furniture supplement the structural cover; decorations do not silently expand collision.

The room floor, props and Crag remain procedural, with explicit selection over retained registered images. Original raster sources/registrations remain intact. No new generated bitmap art is introduced.

## Combat and persistence

Seven original defenders remain: Crag and six mounted Crown guards, with their IDs, species, stats, roles, rewards and ordinary fort benefits. Captain and archer placement was revised after native review to avoid overlapping their silhouettes. Two ranged posts still cover the receiving approach within their unchanged range, matching the original two-post coverage; their existing fort shooting rules preserve defender use of structural cover. The room offers multiple connected routes rather than a single weak enemy bottleneck. This preserves concrete defensive properties, not a claim that encounter difficulty can be proven identical without owner play.

Version 6 relocates surviving/dead guards and clears obsolete combat paths without healing them, preserves exact collected cache indices, paid guard deaths, recovered/lost crowns and return deadlines, and moves pending bases with their corresponding original guards. The recovery cache itself survives migration. The tested partial save preserves 735.5 seized crowns and deadline 900.25. A separate return case restores all seven original defender IDs together and keeps 91.5 recoverable crowns; an existing two-ringleader pending wave retains its 9.5-second timer and spawns successfully.

Focused checks compare fresh and dev.137 defenders against the normal old-engine restore, preserving existing normalization separately from this rework. Repeated access/reload preserves spatial composition. The six Ironroot scenarios pass with the expected Treasury version updated to 6. Five actual native 150% views include whole-room, receiving/hearth, accounts/defense, private/rider quarters and phone; repeated drawing changes no campaign state. Original dev.137 imagery and save/control fixtures provide the before state.

## Pilot standard for future work

Before adapting another Treasury, identify its inhabitant and regional economic purpose; author receiving, guarded reserves and domestic/work space around those needs. Place furniture by footprint, give structural obstacles visible material treatment, and review actual combat at 150%. Preserve its existing roster, paid progress, cache identity and return rules; check body clearance, connected routes, defender fort/crossfire, real boundaries, phone presentation and saved-state migration. Produce current procedural references and a per-design handoff. This is a possible shared quality standard, not a universal layout or an instruction to copy Crag’s household into other cultures.

Evidence: `tools/visual-review/highlands-dev138/treasury/checks.json`, `native-review.json`, exact entity states, original fixture and lossless native captures. Per-design handoff: `tools/sprites/design-handoffs/ironroot-treasury-household.json`. Publication status belongs to the dev.138 receipt.
