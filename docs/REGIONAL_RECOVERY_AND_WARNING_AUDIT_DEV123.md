# Regional recovery fix and combat presentation audit — dev.123

Published in PR #359 / `58f50a2c2472eadedd0848c040b62e272c9e82bd`; package-only run 39543158502 succeeded. All 17 checked public files match, live phone startup passes without JavaScript errors, and original dev.121 atmosphere is unchanged. Normal workflow restored and temporary publisher removed. Receipt: `evidence/REGIONAL_RECOVERY_DEV123_PUBLICATION_20261021.json`. Owner phone play next; fort extension remains a separate proposal.

Owner requested regional death recovery, a review of the boss warning-to-impact handoff with no visual adjustment yet, and a tentative assessment of fort rules for dungeons/treasuries. Owner explicitly rejected the provisional glow adjustment; keep existing lighting untouched. Sunrise flashes remain open in #357.

## Implemented recovery

A selected barracks applies only within its parent region, including that region's main dungeon, treasury and side interior. Crossing regions clears the previous camp choice and sets the destination region's main refuge on outdoor arrival. A local refuge/hamlet remains active through same-region interior visits; a completed local barracks can be explicitly selected again. Existing saves with a foreign camp or refuge fall back to the current parent region on death. No save schema/key changes; death penalties use the death region and Succession behavior remains. The barracks menu explains the regional limit in English/Spanish.

Extended death/barracks checks and existing refuge suite pass in Normal/Nightmare, including save restoration, cross-region travel, main dungeon/treasury deaths, local minor refuge, stale choices, menu and Succession cases. Build/generated/inventory checks pass. No broad CI.

## Warning handoff — audit only

Fifteen representative real enemy-update/release/contact paths cover all eleven boss families plus TRUE and volley/ring examples. Isolated clear terrain/high hero HP; this is not a complete every-attack campaign or physical-device attention study. Resolved warning geometry does not linger into a rendered impact frame in these cases. A following attack can acquire its warning immediately while the previous effect/projectile remains; observed with Warlord's successive arcs and Crypt's volley. Native phone captures confirm the Warlord's second warning can dominate the prior impact visually. A normal Mire cone shows a clean handoff.

Current ground warning: roughly 19% red fill (`#dc644c30`) and bright 2.5px dashed gold outline; impact ground is intentionally subtle and excludes actor silhouettes. Warnings are below actors, while impact artwork is painted after night grading. Release/impact events use 0.38/0.42s lifetimes. The cue timing is not a lingering-warning bug. If a later adjustment is wanted, assess overlap-specific outline weight/contrast while retaining danger information, hit geometry and attack timings. No boss effects, warnings, colors, opacity or timing changed here.

Evidence: `tools/visual-review/warning-handoff-dev123/audit.json`, `native-review.json` and captures. Existing fortifications suite also passes real hits/dodges, armor/piercing, range, cover and lifecycle cases.

## Fort extension — tentative, not applied

Actual current coverage: Abyss 27/27 and Citadel 33/33 hostiles protected, plus Signal Tower side dungeon 10/10. Crypt, Archive, Mine, all four treasuries and four other side interiors have no fort areas. Full census of fourteen interiors is retained in the audit JSON. Enemy low-cover firing already has shared interior support.

The existing fort rules are 40% less incoming ordinary damage (piercing bypass retained), 30% more ranged basic reach and 30% faster garrison projectiles. Special projectile footprint/lifetime owners remain authoritative. Extending the reduction produces approximately 67% more effective HP against ordinary damage before existing armor/night mechanics, so it changes encounter balance appreciably.

Technically feasible in the existing fortifications owner; no parallel defense system needed. A careful extension must use authored walkable room/partition geometry, including treasury architecture, rather than treating each entire map square as a fort and granting unrelated wall permissions. Decide the intended boss/guard scope before a later implementation. No fort rules, map geometry, enemy stats or combat permissions changed in this release.

Prepared on main `34ee609a8b9436e4ee25d49528fc9959cf4047a2`; publication and verification are now complete. Completed focused evidence was reused.

## Additional owner reports in this batch

Talent reminder implemented: emitted training notices now carry an action requirement and originating hero class. Actual shell queue/display checks remove them after the last point is spent or all talent ranks are capped; partial points remain actionable. Old discarded reminders do not return after a refund, and later levels create fresh reminders. Extended notice suite passes queued/visible, multi-level, partial, cap and refund cases. Native phone check confirms a visible reminder disappears immediately after a real talent purchase; phone startup and cross-region death recovery pass without JavaScript errors.

Gathering correction implemented: gather/deposit orders use physical routes through hostile awareness instead of treating danger as an impassable wall. Deposit and next-node route eligibility follow the same rule. Actual terrain, actor collisions, verified local self-defense, troop support and Recall remain. Explicit cautious combat/regroup routes continue avoiding hostiles. A genuinely unreachable terrain route now reports terrain blockage with English/Spanish guidance, rather than asking the owner to clear enemies.

Focused `gathering-orders` check covers actual departure through awareness, complete harvesting/delivery with a living hostile covering both endpoints, local verified self-defense without pursuit, terrain-aware deposit selection, Recall and snapshot intent. Crowd escape and existing companion judgment/Recall checks pass. One crowd fixture initially asserted that a short step must reach a wall 50 units away; corrected to assert the actual blocked segment. No runtime change was needed for that fixture. Final generated-source/syntax and changed-source format checks pass. No broad test run or CI suite.

Evidence for the integrated phone check: `tools/visual-review/warning-handoff-dev123/fixes-native.cjs` and `fixes-native.json`. Boss warning evidence is reused; no lighting or boss visual changes were introduced. Fort extension is the next owner discussion now that these fixes are published.
