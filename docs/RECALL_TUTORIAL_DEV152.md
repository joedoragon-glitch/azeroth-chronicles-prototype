# Hands-on Recall and concise Captain menu — dev.152

Owner requests the actual Recall control after choosing Practice. Practice now closes the modal, highlights and focuses Recall, and waits for real use. Recall through the existing button or keyboard handler completes the practice and reopens Meet your company with concise acknowledgement and mechanics. It does not issue Recall from the menu choice. No recruitment action appears in either tutorial stage; Captain recruitment remains in its own interface.

Captain intro is two short sentences. Locked recruitment shows one requirement card instead of repeating the same paragraph under two unavailable hires. Pending hires still expose cancellation even when the roster fills. Care uses “No fallen companions” / “No wounded companions”; ready and queued service hints are short. Full queue target/funds/blocker summaries remain visible once in the menu introduction. English/Spanish covered.

The shell owns a transient practice callback bound to the current campaign. Switching campaigns clears the highlight and cannot acknowledge an old run. Existing saved recallPracticed progress remains compatible; no new save fields. No living companion cannot complete practice. Existing Recall order, charge cancellation, regroup and defensive behavior unchanged. English and Spanish copy updated. Highlight uses a steady gold outline and glow, without motion.

Impact/checks: existing production-shell English/Spanish test now checks the real Practice → highlighted Recall → acknowledgement/Continue sequence and absence of recruitment; existing menus, recruitment-request and companion-care tests, build, changed-source formatting and diff checks. No broad CI or browser matrix. Owner ongoing playtest authorizes package-only publication.

PR #391 merged as `fac8e62d74b7418ab3f25a143742a5a2fb62797f`; package-only run 39701993125. Public build verified against merged SHA; normal workflow restored and temporary publisher removed. Receipt: `docs/evidence/RECALL_TUTORIAL_DEV152_PUBLICATION_20261021.json`.
