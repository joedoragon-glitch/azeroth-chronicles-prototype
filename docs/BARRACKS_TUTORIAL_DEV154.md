# Guided first Barracks — dev.154

Owner requests a further tutorial step after Recall acknowledgement. Continue now keeps Meet your company open with three short directions: leave town for open ground off the road, open Menu → Establish Basic Barracks (FREE), and let an idle Soldier or Ranger build it. Let's go returns to play. Recruitment remains outside the tutorial.

The original quest ID and reward are unchanged. Optional boolean barracksBriefed records this stage in the existing v4 quest state and is validated on restore. Before Continue, progress points back to the Captain briefing; after Continue, HUD and quest text show the field/build-menu route. Existing construction and completion still advance the quest and self-directed builds remain allowed. The original build placement, first-free cost and labor conditions are unchanged.

The shell highlights the real Adventure menu build action independently of keyboard selection. Highlight derives from saved tutorial state and absence of any Barracks, so it survives closing/reopening the menu, waiting, save/restore and failed placement. It ends after a successful placement starts construction. Shared steady highlight style serves Recall and this build action.

Focused validation: existing English/Spanish production-shell flow now covers Continue directions, immediate save/restore flag, HUD/quest update, actual menu highlight across navigation/reopen/rejected placement, successful native free build and highlight removal. Original recruitment-request test follows the updated stage and rejects malformed flags. Existing quest-waypoints and menus suites pass. Build, changed-source format and diff checks pass. No broad CI/browser matrix; owner-authorized package-only publication.

PR #393 merged as `4735bdb33d63055d0455ad1faa4775cdb494d27d`; package-only run 39703009158. Public build verified against merged SHA; normal workflow restored and temporary publisher removed. Receipt: `docs/evidence/BARRACKS_TUTORIAL_DEV154_PUBLICATION_20261021.json`.
