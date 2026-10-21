# Treasury fort bonuses, Archive seams and Neri’s return — dev.125

Owner approved all existing fortress effects for all four treasuries, explicitly including captains. Crypt, Archive and Mine fort coverage remains a separate proposal. Owner also reported a second invisible Archive collision line running up to the records-threshold rectangle.

## Archive passage

The flooded lower floor ends at x=970 while preservation hall begins at x=960. Ten units of overlap cannot accommodate the existing 15-unit movement clearance on each rectangle. This created a blocked strip around x=955–975 toward the records threshold. The first dev.124 lab/study correction remains.

Add a shared floor connector inside the existing footprint, without changing the outer outline, records-threshold partition, props, attacks or lighting. Existing saves use the static geometry immediately; no regeneration or progress reset. Real input crosses the new join in both the focused suite and phone check.

An independent rectangle-union audit scans Archive floor at five-unit steps with strict 15.01-unit outer clearance, excluding real partition clearance. The prior geometry has 280 falsely blocked samples; the repaired geometry has zero among 52,076 checked samples. Exact arrangement-cell comparison confirms the exterior floor footprint is unchanged. This is bounded static geometry evidence, not an every-frame full-campaign claim. Evidence: `tools/visual-review/archive-treasury-dev125/floor-audit.cjs` and `floor-audit.json`.

## Four treasury garrisons

Reuse the existing fort owner: 40% less ordinary incoming damage, 30% greater ranged basic reach, 30% faster fort projectiles, existing firing arcs/own-partition permissions and shield indicator. Piercing bypass and existing individual captain defenses remain. No extra base HP, damage, enemy count, reward or spawn changes.

Highlands and Crown use authored room footprints and partitions. Greenwood and March retain their existing rectangular floors and receive stable IDs for their real dividers, so enemy-only fort fire can cross those dividers. Movement and friendly sight still respect them; outer walls remain solid. Flight preparation retains its existing footprint, lifetime, dodge and landing owners.

Native coverage: Greenwood 6/6, March 6/6, Highlands 7/7, Crown 11/11 living hostiles protected, with one fortified captain in each. Existing saves receive coverage without room or actor regeneration. Other previously fortified areas retain their prior rules; unapproved main dungeon coverage remains absent.

## Neri’s voluntary return

Owner requested the Archive alchemist (Neri, referred to as Mira in dictation) return freely after rescue and the existing Keeper pact, remain available in town, disappear during the TRUE Keeper encounter, and return after his defeat. A separate alchemist NPC now uses the existing specialist appearance and usual services, with a short English/Spanish explanation that she returns by choice to tend the records. Six work stops cover the laboratory, drying area, dry stacks, lower soaked records and study, with ordinary terrain routes, measured walking and work pauses. She has no combat role or new repair economy. Routes and waits are runtime-only; her ordinary NPC position saves. Existing pact/rescue/encounter states control availability, including old saves; no new progression key.

The former captive workstation is hidden after rescue, clearing its orphan name/shadow rather than leaving an absent person’s indicator. Authored desks, racks and other Archive decor remain. A focused full repair-tour/lifecycle/service/old-save check and the existing Keeper suite pass. A new native phone capture shows her existing free specialist body on the route, with no JavaScript errors; TRUE absence and return also pass. Earlier geometry/treasury phone checks are reused unchanged. Evidence: `neri-native.cjs`, `neri-native.json` and `captures/neri-free-restoration.jpg` in the review folder.

A subsequent charged-skill cooldown request was an idea/understanding check. It is not implemented in this batch; the proposed behavior is to remember one pending activation and begin its normal charge after cooldown.

## Necessary checks

Extended Archive crossing/save/real wall suite; focused all-four treasury resident/captain mitigation, piercing, ranged reach, projectile speed/launch rights, real partition permissions, outer floor and restore checks; existing shared fort suite including real AI aim/contact/dodge, fixed arc landing and projectile footprint; generated source/syntax and changed-source formatting. All pass. One native phone startup crosses the Archive line and checks all four garrisons with no JavaScript errors. Captures and native receipt are in the same review folder. No broad CI, device matrix or full campaign balance run.

Prepared from published main `76ce0aaf7048b2438dcf863ff02684514bf0dbf3`. Owner-authorized package-only publication next; restore normal workflow afterward. Owner phone play will assess the intended treasury difficulty increase.
