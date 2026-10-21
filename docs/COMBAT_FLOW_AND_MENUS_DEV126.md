# Combat flow and frequent menu actions — dev.126

Published in PR #362 as `c7ec2999248dca1491db2629795b786880dfa0d2`, package-only run 39556310506. All 19 checked live files match; live phone startup passes without JavaScript errors. Normal workflow restored and temporary publisher removed. [Publication receipt](evidence/COMBAT_FLOW_DEV126_PUBLICATION_20261021.json). Owner requested necessary focused checks only; no broad CI.

> Later update: [dev.139](SKILL_QUEUE_FORMS_DEV139.md) distinguishes normal tap requests from brief-hold charged requests. The all-charged input below is historical.

## Final behavior

- A charged skill requested during cooldown retains one independent request for that skill. Other skills never replace it. When its cooldown/shared recovery ends, it goes through the normal 0.65-second charge and releases once. Ready requests prepare in sequence; they do not wait behind a longer unrelated cooldown. Repeated input does not restart a stored charge.
- Small numbered indicators below the hero show stored skills: outlined during cooldown, filled in their skill color once available, with the existing charge glyph/arc during preparation. Skill buttons also show queued/charge status. Indicators disappear on release/cancel. Existing resource, targeting, hit interruption and lifecycle cancellation still apply; automatic release cannot initiate an out-of-range chase. Recall cancels stored requests. Stored skill requests are transient and are not saved.
- Ordinary boss/monster and Rogue telegraph fills use about 80% of their previous opacity; their warning edges remain crisp. Shape, timing, color, actual attack effects and gameplay are unchanged. The owner's FPS concern superseded selective per-pixel masking: that experiment is removed. No additional rendering surfaces or duplicate effect passes ship. Only four existing fill-color constants change; the canvas global alpha and drawing code are unchanged.
- Completed Basic and Full Barracks put **Recover fallen companion**, **Treat wounded companions**, **Gather resources**, and **Rescued specialists** first. Recovery/healing act directly and refresh availability. Gathering and specialists open their existing choices with Back returning here. Existing costs, safety/Expedition requirements, construction and upgrade behavior are preserved.
- Adventure menu puts **Establish Basic Barracks** and **Screen and performance** first. Building remains visible with its eligibility reason when unavailable; performance opens directly and returns to Adventure. Other actions/settings remain accessible.

## Verification

- Focused charge-interruption and 54 charged-opener cases passed; no engine charge mechanics changed afterward.
- Native phone input: Paladin/Mage/Ranger cooldown request, normal preparation and single release; other-skill preservation; independent cooldown ordering; repeated input; visible queued states; Recall/menu cancellation; retreat without chase; real hit interruption; unchanged ready quick tap.
- Native real Warlord impact and subsequent warning: original warning opacity versus 80%, state purity and landscape/portrait. Capture pair and measurements: `tools/visual-review/warning-charge-dev126/`. No extra warning rendering layers ship. Host drawing measurements are not device FPS certification.
- Basic/Full Barracks menu priorities, actual revival/healing refresh, resource/specialist route and Back; existing menu/death-barracks checks. Native Adventure performance shortcut and Back. No JavaScript errors.
- Final generated/syntax/build and changed-source formatting checks; no broad CI or game/device matrix.

## Quest navigation, Treasury pickups and arrival space

Pending quests are selectable from the town board, global journal and the shared Barracks quest menu. The story guide remains available; completed quests have their own view. Selection tracks the next actual objective, including regional transport and interior entrances/exits, uncollected caches, remaining sites, patrols, rescues and the night shore. Tracking draws a path and small destination marker without forcing movement. Story-guide routes still begin walking and now keep their visual guidance during combat too.

Quest tracking is independent of the hero's move/attack order. Its cached route refreshes at most once per simulation second when needed, survives combat/menu use and follows zone transitions. It advances as objectives change, hides the line at arrival, and clears on quest completion/peace resolution, death/new run, explicit Clear waypoint or another chosen route. Runtime tracking does not survive a reload; gameplay progress does. The Barracks tutorial without an existing construction points to the new direct Build action instead of inventing a map location.

Uncollected Treasury caches gain a faint gold foot ring and a small diamond, with no animated glow or extra canvas surfaces. Collection removes the cue with the NPC. All four Treasury exits move from (125,155) to (60,80), arrivals to (100,100), with six distinct nearby companion staging points. The two shaped Treasury entry floors extend 30 units toward the same corner to fit that pad; guard statistics, acquisition rules and all other floor boundaries remain. Initial party staging is walkable and outside current guard awareness. Existing saves get the doorway change without repositioning their hero or resetting caches/captains. Other dungeons and inhabited interior entrances are deferred for individual geometry review.

Native phone checks cover actual journal input, combat-persistent line, completion cleanup, cross-interior continuation and cache cue/collection. Focused engine checks cover objective selection and all four quiet Treasury arrival pads/save migrations. Existing expansion/fort checks pass. The existing night-quest fixture assumed Nightmare was active while still in its sunset grace; corrected that setup, reran the affected case in both modes, and kept runtime lighting unchanged.

## Enemy interruption audit (no mechanics change)

The real Direjaw Treasury captain retains its current warning through an actual Mage basic projectile hit and ordinary damage. Slow leaves that cast clock running; knockback keeps the warning. Mage Silence pauses it without erasing it, while the explicit interrupt cancels that current action. Basic combo splash applies damage, not an interruption. Defeat, leash/safe-town or mobility resets, encounter cleanup and authored counters can end actions; basic damage is not a generic captain/boss stun lock. Ordinary enemy support healing and rogue deliberation refuse to start over a committed warning, so those do not cancel it either.

Owner's report of an unidentified captain failing to use skills under basic attacks remains a specific observation to trace, rather than evidence that every basic hit cancels casting. No enemy interruption, AI cadence or balance change ships. Mechanism evidence: `tools/visual-review/warning-charge-dev126/enemy-interruption-audit.json`.

## Roster/pet restriction audit (no rule change)

Rest requires an active owned companion and no `refugeThreat()`. That shared threat check is a living, non-neutral, aggro enemy strictly within 700 world units of the **hero**; idle spawns alone do not qualify. It also blocks pet recruitment and activating a reserve companion/pet. Resting itself requires neither full health nor a Full Barracks.

Recruiting a new pet requires its TRUE victory unlock, a completed local Barracks, no existing individual of that family, no shared danger, and fewer than 200 employed plus queued companions. It is free. A full active group does not prevent recruitment: the pet enters reserve. Adding an existing reserve pet requires it alive and an active slot at that specific Barracks. Fallen active companions count toward slots too. Basic Barracks support at most three (Expedition 1 allows two); Full Barracks use the Expedition cap: 2,3,3,4,5,6 by ranks 1–6. A Basic Barracks therefore can still be full after resting one member of a larger traveling group.

Ordinary troop training separately needs Expedition 2, completed unoccupied training queue, enough crowns and roster room; it does not use the same danger gate. Actual safe/aggro/700-distance, full-group reserve recruitment, rest-then-activation checks pass. The owner's specific base/save was not supplied; the shared combat gate is a plausible explanation for both disabled actions, not a confirmed diagnosis. Evidence: `roster-restrictions-audit.json` alongside the interruption audit.

## Still open

Sunrise flashes persist in owner play; sunset might also flash. Issue #357 and `VISUAL_FOLLOWUPS_DEV122.md` explicitly record the inconclusive first investigation and the deferred deeper reproduction/root-cause work. Original lighting remains unchanged; no flash fix is claimed.

## Companion delivery and Reedport follow-ups in this release

The audit confirmed that drop-offs and automatic next-cache selection used shortest physical distance without hostile clearance, while labor bypassed existing regroup judgment. Delivery now rejects threatened refuges/full barracks, checks routes against existing enemy awareness/fort ranged envelopes, and uses the established survival judgment. If no safe destination is available, companions keep the cargo and regroup rather than deliver into hostile control. Explicit initial gathering still sets out under escort.

A delivery records the path actually walked. After unloading, the companion follows those points in reverse before more harvesting or automatic selection of another known cache. A newly obstructed/hostile return segment sends the companion toward support instead of inventing a new forward route. Automatic continuation uses cautious routing; initial manual dispatch remains permissive. An optional bounded, validated trail in the existing gathering order preserves reverse intent over saves/reloads. Existing pre-update deliveries cannot reconstruct an already-walked trail; their remembered route starts when this update resumes them.

Reedport's market, cart and two supply decorations move away from the refuge frontage; the Captain's stand moves to its own clear parcel. All five existing IDs/roles remain; houses, enemies and player-built bases retain their identity. A one-time saved-map migration applies the spacing to existing playthroughs. Native before/after captures and focused identity/save/access checks accompany it.

Focused delivery tests cover safe destination choice, hostile detour, actual reverse trip, new blocked return, saved/malformed trails, retained cargo, critical wounds and Recall. Existing gathering and regroup checks pass.

Publication receipt: `evidence/COMBAT_FLOW_DEV126_PUBLICATION_20261021.json` (added after live verification).

## Next discussion: Basic Barracks replacement

The owner reports having three active companions at a 20-crown Basic Barracks and being unable to rest one/add the newly unlocked pet. Source review confirms capacity does not block rest, and with a three-person cap resting one should permit activation of one replacement. The specific failure therefore remains unconfirmed; do not present capacity alone as the diagnosis.

Proposed contained UX: a “Replace with…” action exchanges one active member with one living reserve companion or recruitable unlocked pet in a single operation. Keep the active party size unchanged and respect the Expedition maximum; Basic Barracks retain their three-person expansion cap and all other restrictions. Full Barracks retain the ability to expand up to the higher Expedition cap. Validate both sides before resting either unit, and preserve pet uniqueness, roster bounds, health, unlocks and the existing combat safety gate. No roster mechanics were changed in dev.126. This proposal awaits the next owner discussion.

### Later owner clarification — dev.127

The owner wants the existing two-step Rest → Recruit/Add flow, with visible reasons when blocked; an atomic replacement feature is unnecessary. Restriction feedback is published in dev.127 (`BARRACKS_ROSTER_FEEDBACK_DEV127.md`). The expanded boss/captain spawn/skills/summons/entrances/fort audit is recorded separately in `ENCOUNTER_SPACE_AUDIT_DEV127.md`; its proposed repairs are not implemented.
