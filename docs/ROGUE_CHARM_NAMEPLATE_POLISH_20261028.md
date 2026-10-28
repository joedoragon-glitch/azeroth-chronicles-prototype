# Rogue Charm companions — compact stable nameplates

28 October 2026 · Owner iPhone playtest · Isolated presentation-only candidate

## Observed problem and design decision

The live Rogue playtest screenshot shows Charmed goblins displaying large dark
rectangles with bold yellow nicknames and a music note, visually dominating the
same scene in which regular hostile goblins use much lighter, unobtrusive labels.
The owner reports that the rectangles shift sharply while fighting and walking
through crowds. This is a clear usability defect, not a request to rename or
rebalance companions.

The renderer's source establishes the immediate cause: every Charmed monster
has a `customName`, so it receives the exceptional
`drawNamedCompanionLabel()` rectangular panel. Both Canvas and the Pixi
Canvas-overlay nameplate passes try a list of displaced screen coordinates when
a label collides with higher-priority labels. The winner can change from frame
to frame as actors move, producing sudden nonphysical jumps.

## Implemented scope

- Preserve the real nickname and subtle `♫ ` cue from
  `game.companionDisplayName()`. No generated aliases or save changes.
- Charmed monsters no longer qualify for the large custom-name panel. Their
  label uses compact bold 10px text with mint color `#99efcf`, avoiding the
  hostile red/salmon and boss/captain gold name colors.
- Both nameplate allocators anchor Charmed text directly above the creature's
  own sprite-height/health-bar position, with ordinary viewport-edge clamping.
  They do not search offsets around other labels; if the anchor is outside
  the visible vertical range, the label is omitted, not shifted elsewhere.
- Charmed labels reserve their anchored footprint so later-priority labels can
  still yield. Two closely overlapping Charmed creatures may have overlapping
  labels; this is an intentional, predictable limitation rather than a
  frame-to-frame bouncing avoidance algorithm.
- Ordinary enemies, bosses, NPCs, buildings, standard companions, existing
  named conventional companions and health bars keep their original logic.
- No charm probability, companion ownership, AI, collision, song, controls,
  PWA, resource, save or renderer-switch logic changes.

## Focused validation and acceptance boundary

`tests/charmed-nameplates.test.cjs` executes the actual production identity
and fixed-position source branches for Canvas and Pixi with and without
competing claimed rectangles. It also guards compact widths, palette, absence
of the dark custom-name panel for Charmed creatures, viewport behavior and
non-Charm custom-name preservation. It is included in the quick test suite.

Test results and exact-head CI must be attached to the PR separately; this
document alone is not a CI result. The source review confirms why the old
labels repositioned; it does **not** prove that nameplates caused a sustained
game slowdown. Compare iPhone performance diagnostics before/after in the same
crowded encounter rather than attributing all performance issues to this fix.

Before merging/deploying, check a phone portrait/landscape crowd, normal
Canvas and optional Pixi overlay, 100–175% zoom, near-screen-edge labels,
multiple captured monsters beside enemies and bosses, Spanish nicknames,
health bars, moving camera/occlusion, and save/reload. Verify actual screenshot
readability and that nicknames do not teleport when actors move. This branch
must remain separate from concurrent performance and Rogue audio work.
