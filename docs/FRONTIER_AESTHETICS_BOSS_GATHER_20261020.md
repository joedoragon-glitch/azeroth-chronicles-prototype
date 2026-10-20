# Frontier aesthetic audit, field bosses and gathering — dev.105

Joel requested a post-relocation audit of visual appeal and asset purpose, quick recovery/reset when a field boss lacks fighting room, and resource orders that prioritize safe gathering/delivery and self-defense until completion or Recall.

## Frontier audit

Reviewed all ten relocated work groups and three houses through the native renderer, not just the distribution schematic. Retained source: `tools/visual-review/field-boss-gather-dev105/aesthetic-audit.cjs`; contact sheet beside it. All 65 assets retain their identities and roles. Findings and final placement rationale:

| Plot | Asset purpose and visual relationship |
| --- | --- |
| North repair yard | Cart, wheel, tools, lumber, supplies, barricade and watchpost form a roadside repair/staging yard. Ruts stay with the work equipment; the river crossing stays open. |
| West market | Market, kitchen, cart, wood and supplies sit along the western town frontage. Patched fence and watchpost belong to that occupied civilian edge. |
| West recovery yard | Charred foundation, broken cart, rebuilding lumber, braces/stakes and tools tell a recovery story among retained regrowth. Kitchen and supplies support those works. |
| East inspection | Watchpost, inspection marker, table, weapons, dummy, barricade and stores form a controlled work/training yard south of the retained redoubt. The existing fort remains deliberately dense; its wall arrangement was not redesigned. |
| South garrison | Command tent, bunk, kitchen, weapons and supply stores make a reserve/logistics camp. Standards and table identify military administration, connected back to the road network. |
| South Bastion | Flight harness equipment, roost, brazier, bone pile, stores and perimeter defenses support the nearby dragon complex. Their southern location leaves the entrance approach visible. |
| Southwest convoy spur | Cart, ruts, stores and a watchpost support the recovery homesteads and southwestern supply route. |
| East inspection spur | Forward observation, paperwork/inspection and stores belong before the main yard. Audit found overlapping watchpost silhouettes and a table crowding the weapons area; moved the forward post to (2870,1250) and table to (3030,1230), with a new connecting approach. |
| South logistics spur | Weapons, stores and standards identify the supply approach to the reserve camp, rather than another unrelated village. |
| Bastion spur | Chain, anchor, brazier and barricade read as the outer security/flight-handling approach to the Bastion. |
| Three recovery homes | Existing houses form a loose southwestern settlement beside the supply spur, with open ground between them. They keep the established Frontier architecture. |

The two inspection refinements are a new one-time finishing pass for both dev.104 and older saves. Player constructions are preserved and occupied preferred spots use clear local alternatives. No nature is moved. The final plan still relocates 65 props, preserves all 204 natural props and has 14 new road spurs total (13 approved base spurs plus the audit correction). The southern structure count remains 30. Every added road segment passes at radius 25. Trees, gardens, river, fountain, services, enemies/homes and resource positions are preserved. This is an aesthetic assessment of the changed plots, not a claim that every pre-existing Frontier prop has been polished.

## Field-boss recovery

Cindermaw is a field boss; Dreadmaw is the Crown Treasury captain. The new rule applies to all five actual field bosses, normal and TRUE. Every half-second, an engaged boss checks 12 physical movement directions over 140 world units. Less than four usable directions for 2.5 seconds, or three seconds of failed ordinary pursuit, requests an encounter reset to a collision-safe open point near its home. Normal melee holding position, warned attacks and committed movement do not count as failed pursuit; ordinary attack opportunities no longer hide physical confinement.

The reset uses the existing encounter cleanup/heal/reward contract, a one-second protected withdrawal and a landing with at least six open directions. Roaming captives and existing living escorts return with the boss; no revival, additional units or rescue-state change. Local attack/motion/path state clears. The checks and return state are runtime-only and clear on cancellation, saving and travel. Combat damage, HP, rewards and attacks remain unchanged.

## Resource orders and companion paths

Gather/deposit orders take precedence over squad combat. A troop counters only an enemy recorded actually damaging that troop in the last eight seconds; counterattacks are local basics, with no pursuit or offensive skill diversion. Work continues during that defense. A pending combat charge is cleared when the player assigns a gathering job.

Companions use collision-checked eight-direction A* routes instead of four-direction breadth-first routes around obstacles. Roads, hero movement and enemy route planning retain their existing planner. Gather and deposit routes additionally avoid living hostile awareness areas, including field-boss special reach. If no safe path exists, troops retain the order and wait, with a bounded notice; they do not silently fall back through an enemy camp. Routes replan for changed destinations, obstruction and enemy movement, with retry pacing for unavailable routes. A troop already caught inside awareness may escape without being sent farther into it.

Delivery selects the shortest safe reachable walking route among rest/full-barracks/town sites, instead of the nearest point by straight-line distance. Further nodes in the same resource group are selected by safe route length and skip uncleared sites. Completion clears labor intent. Recall from a resource job clears that intent and defense receipts, regroups defensively, then restores normal squad behavior when the recalled gatherers reach the hero; ordinary standing Recall behavior for other orders is retained. Carried resources are preserved. Valid gathering/deposit intent and carry now survive normal save/update reloads; transient navigation and attacker receipts do not.

## Focused evidence

`boss-check.cjs`: all ten field-boss/form cases reset from a physically confined position to usable terrain; open-arena warned/stationary attacks remain active; cancellation/save/travel clear return state.

`gather-check.cjs`: actual Frontier obstacle route, hostile detour and guarded-destination waiting, job priority during nearby combat, verified self-defense without pursuit, reachable delivery choice, Recall/resume, full harvest/deposit loop and save/update intent. The sample Frontier route shortens from 2614.9 to 2476.9 units. This is one measured example, not a claim of globally perfect paths.

Also rerun the focused existing travel-collision and map-navigation checks, plus the map/save/doorway evidence because save/navigation ownership changed. Build, generated source and changed-source formatting before package-only publication. No whole-game suite or browser matrix; live crowded encounters and route performance on Joel's machine remain owner play checks.
