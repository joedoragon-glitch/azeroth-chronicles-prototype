# Gathering escort and Supplies — dev.130

Owner implementation instructions supersede the audit's worker-count selector and hostile-awareness route veto proposals. Preserve one-command dispatch of all idle Soldiers/Rangers. The player escorts the group along navigation that survives combat, ordinary orders and Recall until the selected source is exhausted. Known sources remain directly usable in the world. Both completed Barracks and town Supplies offer collection and locating hidden tribute.

Prepared implementation, focused validation pending:

- Saved gathering target uses the existing waypoint renderer without forcing hero movement. Combat/Recall preserve the target; exhaustion clears it. Travel/death/new campaign end the local route. Explicit Clear waypoint remains supported.
- Gathering pauses for the shared companion combat executor: ordinary attacks and unlocked skills, existing wounds/overwhelm assessments and retreat. Assigned co-workers count as nearby support. A work order/cargo stays intact through combat. Encounter response uses actual enemy acquisition/line rules, including fortified ranged reach.
- Delivery attempts physical routes. Enemy perception is not treated as an impassable wall. Reachable refuges, Full Barracks and town Supplies remain destinations, preferring safer drop-offs. After withdrawing from a delivery encounter, a recent destination is deprioritized so an alternate can be attempted. No wait-until-safe veto is retained.
- Town Supplies immediately unloads every company member's cargo when visited, including distant, resting and fallen members, without moving/reviving them. The NPC now also exposes the shared gathering menu. No extra deposit confirmation is needed; the all-company fallback is owner-requested.
- Capacity: 120 / 150 / 180 / 210 / 240 crowns by region. Harvest rate stays 12 per troop/second. A command handles one selected source; no unsolicited next-source assignment. Completed source deliveries do not return to that exhausted source.
- Actual reverse-route movement checks the carrier's body radius and moves with that same radius, fixing the Crown 14-versus-15 clearance mismatch. New terrain still requires a physical path.
- All deposits pool fractional remnants in a saved company remainder, pay whole crowns and clear the deposited cargo. Fractions from separate troops combine rather than staying inaccessible. No rounding every troop upward; no duplicate payout.

Normal v4 save keys remain. Optional target/remainder defaults are compatible with older saves; malformed/hidden-unlocated targets are discarded and malformed remainders rejected. No fort bonuses, warning changes, companion damage buffs or resource respawn changes.

Workflow: focused local checks and one short native phone interaction check, package-only publication. No broad CI, full game/device suite, or review loop. Checkpoint is incomplete until evidence and live verification are recorded here.
