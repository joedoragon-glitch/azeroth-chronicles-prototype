# Night victories, ringleaders and Rogue cadence — 20 October 2026

**Published:** dev.96 through #330, merge `a8d179ec2b8daac95bafebd0997ebe52ec912926`, package-only run `39387681053`. Exact live source verified; normal release workflow restored. [Receipt](evidence/NIGHT_ROGUE_HEALING_DEV96_PUBLICATION_20261020.json). Candidate publication instructions below are completed. Owner play remains next.

Owner-directed dev.96 update, based on live dev.95 (`b03f1ed6f2ac0925d5c8eedd72c2186b9d6c2632`).

- Normal/Developer night escalation now derives from the existing normal + TRUE victory facts, excluding the Dark Lord as before. TRUE field victories and pre-Awakening dungeon TRUE victories count immediately, including those in existing saves. Repeat defeats and late-Awakening facts cannot double-count. The twenty eligible form victories reach 1.70× night HP / 1.55× night damage using the existing formula. Nightmare and peace behavior are preserved. Pet rewards remain intact.
- All ringleaders, including guardian/night variants and TRUE-bound ringleader summons, use exactly the captain burst-compression curve (0.145 knee / 0.240 tail). Existing HP, damage, frenzy, rewards and two-second shared damage windows remain intact. Ordinary/guardian/captain/boss curves are unchanged.
- Rogue reuse is three seconds instead of six. Source review found that isolated enemies also had a once-per-fight veto; merely reducing the cooldown would not permit another use. That obsolete veto is removed, with the existing readiness/eligibility gate controlling repeated responses. Thinking, warnings, normal attacks, movement, retreat durations, targeting/pressure triggers, the fresh-wound exception and Slow's cooldown effect are unchanged. Actual cast rate still depends on completing actions, finding a legal target, and continued Rogue eligibility.

- Enemy support healing now treats every eligible injured hostile within the existing 350-unit caster-centered range, including eligible leader self-healing. Each recipient retains the same 5%-of-maximum-HP base healing over five seconds with existing scaling; the caster pays one unchanged ten-second cooldown. The 75% health threshold, line of sight, faction/role restrictions, prevention of overlapping effects and existing boss self-recovery exclusions remain. Existing recipient cues are emitted for each real heal; no new sprites or rendering subsystem.

## Bounded checks

Passed: new focused night/pet/reload/peace/repeated-Rogue test; existing burst-compression suite; 16 existing Rogue integration cases; existing Rogue cast-continuity and Slow/cooldown suites; existing enemy-support healing suite, new multi-recipient healing coverage and Archive reference suite; build, generated-source/asset checks and changed-runtime formatting. The new live-AI check verifies repeated responses with a moving pursuer for ordinary enemies, ringleaders, captains and normal/TRUE bosses, plus idle/death refusal and cooldown cleanup. Existing prototype night assertions are updated for twenty points; the complete broad prototype suite is not rerun. No broad game suites, browser matrix or hosted game CI.

Runtime changes are confined to `engine.js`, `rules.js` and the read-only `archive.js` reference, with version/build/worker generated together. Dev.94 rendering, dev.95 travel collision and all artwork are unchanged. v4 save shape and keys stay compatible; no enemy resurrection, HP migration or roster changes are introduced.

Continue the current quick package-only publication/manual owner-play workflow. Remove the temporary dev.96 publisher and restore normal release wiring after publication. Actual difficulty and pacing remain for Joel's live play.
