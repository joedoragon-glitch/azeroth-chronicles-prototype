# Lantern Shore timber and ferry — dev.135

Owner feedback, 21 October 2026: the dev.134 shore appearance is accepted, with two corrections: earth roads must not cover wooden docks, and the ferry hull must float beside the dock.

Road rendering stops at the authored boardwalk entrance, accounting for the rounded dirt cap. Saved road routes continue over timber for movement. The boardwalk points now live in the harbor rules and drive the procedural planks. The ferry moves from (1770,2860) to (1900,2940), clear of the dock in tidal water. The existing dock, landing, fare, work passage and night challenge remain intact. Existing saves receive the mooring through the existing unconditional harbor transport placement; no schema or layout-version migration is needed.

Focused verification: four seeds with fresh, current-save and dev.134-save layouts retain reachable boarding within the existing 115-unit interaction radius. Native road-paint samples show dirt inland and none at the boardwalk/dock centers; saved route arrays remain unchanged. Four native renderer captures cover day/night and phone portrait/landscape; render state stays pure. Existing coastal checks updated to expect the vessel in water and boarding from the dry dock, rather than a dry vessel anchor. Build/generated/syntax and whitespace checks pass. No broad CI, browser installs or full-game matrix.

Captures: `tools/visual-review/lantern-dock-dev135/`. Existing design handoff retains the accepted dev.134 references and this correction. Release preparation; publication receipt to follow.
