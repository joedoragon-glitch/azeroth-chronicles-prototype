# Post-menu follow-up: Map routing and waypoint reliability

**Owner direction:** October 23, 2026. **Status:** Deliberately deferred until after the seven-step Menu Usability Overhaul workflow. **This is a separate future chat/task**, not a hidden addition to Step 7 or a request to merge now.

The owner believes these four interdependent systems are currently suboptimal and may contain bugs, and wants a fresh, careful engineering audit after the entire menu workflow is complete:

1. **Actual route solver and walkability:** Pathfinding choice, obstacle/collision/terrain correctness, navigation destinations and service entrance frontages, unreachable or stale paths, and region/dungeon handling.
2. **Clickable map:** Hit testing, scaling from canvas to portrait/landscape/touch coordinates, selecting the intended map marker when symbols overlap, and clarity/accessibility for touch and keyboard.
3. **Navigate action:** State transitions when choosing a destination, route calculation failures, move-order persistence/cancellation, quest guidance interactions, and context-specific behavior.
4. **Clear waypoint:** Correctly clearing tracked manual/quest/gathering destinations without accidentally deleting quest or gathering state; behavior after travel, mode changes, reload, and old saves.

## Safe working plan for that future chat

- Begin with a **read-only** audit of current production `main` plus the then-merged menu changes, and distinguish reproducible bugs from potential UX improvements.
- Include real route/path test cases across all five regions and dungeon interiors, save compatibility, English/Spanish, and touch vs mouse. Preserve existing story clues (including deliberately hidden Thornfang positioning), travel payments, quest tracking and movement/combat guardrails.
- Propose **separate, owner-approved repairs** for each confirmed issue. Do not bundle a route solver rewrite, map interaction rewrite, quest/waypoint model changes, or simulation/performance tuning into a menu usability patch.
- Comply with owner policy: focused tests only by default; full-device/browser/game matrices require prior explicit approval.

## Boundary with menu Step 7

Step 7 may group/filter/present the existing destination *list* for readability, but must leave the underlying route solver, canvas hit testing, navigation execution, and Clear waypoint semantics **unchanged**. Step 7's source audit should note any suspicious behavior as an unverified follow-up, not claim these systems are correct or already fixed.

**Future chat starter:** “Please begin the deferred Map Routing and Waypoint Reliability audit documented in `docs/MAP_WAYFINDING_FOLLOWUP.md`. Audit first; do not change gameplay or deploy without my approval.”
