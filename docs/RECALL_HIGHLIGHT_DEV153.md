# Persistent Recall practice highlight — dev.153

Owner observed the practice highlight disappearing before pressing Recall. The dev.152 edit accidentally also cleared recallPractice in updateQuestGuide whenever no gathering guide existed. That normal per-frame path silently disarmed the tutorial.

Remove that unrelated reset. Highlight and acknowledgement callback remain armed while the player waits or moves; the real Recall input clears them after successful use with living companions. Campaign ownership reset remains. No gameplay or save changes.

Validation: extended existing production-shell English/Spanish test to run 120 real active frames with movement and waiting between Practice and Recall. The unchanged dev.152 runtime fails the persistent-highlight assertion; the one-line fix passes. Existing actual Recall button, keyboard replay, no-living guard, acknowledgements, Captain statuses, queue/save and story-menu flow remains covered. Build, changed-source format and diff checks passed. No broad CI/browser matrix; owner-authorized package-only publication.

PR #392 merged as `66f981956915af6ccae27a33958c22d09f344be2`; package-only run 39702604317. Public build verified against merged SHA; normal workflow restored and temporary publisher removed. Receipt: `docs/evidence/RECALL_HIGHLIGHT_DEV153_PUBLICATION_20261021.json`.
