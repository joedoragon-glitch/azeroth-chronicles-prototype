# Issue #463 / Draft PR #464 — Postcast presentation and merge-readiness gate

25 October 2026 · source-level and ordinary focused test evidence only; **unmerged, undeployed**.

## Stage A: render-timing correction

A pet action may be one of four different visual identities:

- **Real traveling contact projectile:** only crypt, archive and abyss *first* active skills use this path. Flight collider and projectile art own physical travel; no post-hit pet-to-target tether (fixed in preceding commit).
- **Instant magic line or stylized straight melee attack:** archive second (Undertow), ridge second (Rolling Cargo), citadel first (Precise Contouring), darklord second (Pathfinder's Gambit). The strike is already calculated on release. The line is a momentary **footprint of completed contact**, not an advancing object still in flight. PR #464 now bounds its release afterimage to **0.32 seconds** and impact trace to **0.30 seconds**; the former 0.65/0.85-second full-line receipt was visually misleading during strafing.
- **Planted circle/cone/close strike:** keep previously authored short-lived materials and shapes. Following the caster afterward would misreport where hit geometry actually occurred.
- **Persistent actor-bound ward/heal:** retain existing living-recipient state; the immediate release effect itself may remain world-planted.

This is a rendering-only refinement: no altered DPS, cap, distance, cast timing, cooldown, interrupt, stat roll, projectile speed, hit location, save schema, PWA release metadata or animation system. Charged second skills still hold for **0.65s** before their actual impact. Reduced-motion and optimized modes use the same bounded stage, with their existing density settings preserved.

## Stage B: verification

Native source/game regressions in \`tests/pet-postcast-visuals.test.cjs\` classify **all eleven families** and their first/second skills, including the four instant line receipts at 20/30/60 simulation-step equivalents. \`tests/pet-skill-effects.test.cjs\` verifies all 22 authored skills still paint family-specific Canvas materials in release, impact and windup modes, plus reduced-motion/optimized modes, restores context state and obeys the existing 40-effect queue budget. Earlier \`tests/hero-postcast-visuals.test.cjs\` covers Ranger/Archer actual contact timing and fixed Paladin geometry. **Check exact-head CI after source changes.** This does *not* substitute for in-person real-device motion acceptance; repeated algorithmic renders cannot decide whether a fantasy attack feels natural.

## Stage C: independent stream collision matrix (NOT a merge plan)

Comparison checked 25 October 2026. PR #464 base \`72ef6a55\`, main \`e3c78266\` after #466/#467; #440 Critical Executions head \`41a2807f\` at this observation.

| File | Main change since #464 base | Critical draft #440 | Required eventual resolution |
| --- | --- | --- | --- |
| \`hero-combat.js\` | Mage Skill 1 speed/width | Critical hero casts/receipts | Keep newer Mage geometry, Ranger physical release and OFF-gated critical action receipt simultaneously; do not overwrite either branch wholesale |
| \`hero-presentation.js\` | Mage Arcane Lance Helix VFX | No listed overlap | Preserve Mage's Canvas helix overlay and Ranger true-arrow visual path |
| \`combat.js\` | No difference from original PR base observed | Critical interrupt/impact and pet contact receipt | Actual projectile flight/contact + critical forwarding together; no early hit |
| \`party.js\` | No difference from original PR base observed | Soldier/Archer critical rolls and skill impact | Archer Triple Shot delayed bow origin and Piercing Volley *physical contact* retained, with future critical receipt decided once on release; Soldier Guard and melee kept distinct |
| \`party-pets.js\` | No difference from original PR base observed | 33 opt-in pet-action hooks/critical contact | **Hard semantic collision:** both branches use fifth \`petSkillContact\` argument differently. Must explicitly carry independent critical receipt and launchPoint, preserve opt-in OFF default and record ranged first-skill release origin |

Read independently evolving heads again before any authorized integration; this table is a dated watchlist, not approval. PR #440 currently has a distinct source state and unresolved CI history. It must not be silently rebased, copied, activated or merged under Issue #463.

## Outstanding boundary

1. Human side-by-side desktop/phone judgment: release readability, arrow strafing and small-scale / reduced-motion appearance. Also evaluate whether Rolling Cargo's artwork deserves a real moving simulation object **only after** explicit owner approval for its gameplay consequences.
2. Crowded battles: profile simulation, drawing, skip/recovery and effects queue under realistic loads. Ordinary unit tests and static Canvas pixels are not FPS benchmark evidence.
3. Update source from newest main safely and resolve #440 only if explicitly scheduled; run focused joint tests on an isolated candidate, *not* by merging concurrent drafts.
4. PR #464 stays a single draft; no full tests, device matrices, merges or deployments without separate owner authorization.
