# Enemy skill VFX — quality gate, defect register and Work-mode handoff

**9 October 2026 · housekeeping only.** This is an implementation contract, not a request to make every ability larger, brighter or more elaborate. Changes to boss damage, warning duration, dodge geometry, movement, AI, rogue decisions, attack cadence, audio, saves, world or sprite canon are out of scope. The multi-file GitHub Pages/PWA is canonical; no portable-HTML requirement may dictate architecture.

## The two separate visual responsibilities

1. **Safety/readability layer: what must the player avoid?** The authoritative combat plan and collision geometry determine the warning footprint, progression/timer, active hazard perimeter and safe lanes. Present that footprint clearly and consistently, even at night, on phone, through effects and behind foreground scenery. Never derive damage from pixels or adjust a hitbox to suit the drawing. A summon is **not** a ground-damage marker. A warning must not visually promise an effect that resolves elsewhere.
2. **Expression/identity layer: what is the monster doing?** A small, material-specific windup, release and aftermath should explain *why* an effect happens: roots advancing, a hammer hitting stone, water spraying, claws cutting, a commander rallying, a wraith draining energy. This layer may be procedural today and replaced per stage with reviewed sprite/animation clips later. It does not own hit timing, targeting or game state.

**Visual taste rule:** impressive by specificity and timing, not by screen coverage or glow. Recognizable silhouettes, sparse well-placed particles, quick settle, local material identity. Avoid giant colored discs, generic fireworks, unnecessary camera shake, excessive bloom, screen-wide flashes, opaque overlays, repeated HUD popups and permanent trails. Boss grandeur comes from characterful action and deliberate buildup, not hiding the map or companions.

## Confirmed gaps in the 9 October renderer (debt, not yet fixed)

| Finding | Current behavior | Housekeeping boundary / intended resolution |
| --- | --- | --- |
| Generic warning language | `combat-visuals.js:ground()` draws common yellow outline/red fill for boss/captain telegraphs; rogue #146 proposes cyan signature markings | Keep one truthful warning grammar; add *restrained* context in the expression layer, never invent new danger geometry |
| Missing release visual | `boss-combat.js:resolveArea()` applies damage and occasionally emits `melee` only when a target is actually hit; a missed attack may leave no satisfying on-screen release | Future visual-only `release` event at attack resolution, with source identity and actual geometry, even if nobody is hit |
| Misleading summon marker | Summons enter the generic `warningShapes()` fallback, making circular target-like warning shapes; summoned units appear at generated spawn positions | Replace with a non-dangerous casting cue at the summoner and *actual* materialization at each created unit; do not draw a fake AoE |
| Phase cues not visualized | `engine.js:triggerCaptainPhase()` emits `captainPhase`, and `summonCaptainAdds()` emits `captainSummon`; `combat-visuals.js:queue()` has no corresponding transient recipe | Bridge these into brief, authored actor-centered treatments, not permanent generic aura spam |
| Elemental overlap | `hazardKind()` has broad spectral/mire/ember/stone/ritual buckets; `ring` currently paints a common orange band | Keep accurate perimeter; add different interior action for stone rupture, dragon wing pressure, water current, ash heat, spectral drain |
| TRUE specificity | TRUE uses a recognizable world aura but generally shares the same attack rendering | Stronger only at semantically appropriate stages; share underlying ID and override individual stages if art requires it |
| Attack audio and event gaps | `warning` events often carry family/index but not actor ID/position; many resolutions carry no unique skill event | Add a typed visual-only event envelope *after* deciding authoritative emitter, resolved location and cancellation semantics; no name parsing |
| Rogue work concurrent | PR #146 is draft; its role-specific basic/signature repertoire, warning geometry, cyan cue language and targeting rules are not merged | Integrate from the **merged** rogue source of truth; do not cherry-pick, duplicate, rebalance or rewrite rogue AI in the VFX branch |
| Draw order | Atmosphere is drawn after actors; warning cues after atmosphere; projectiles/effect bursts draw later | Future spectacular effects must not cover exact warning perimeters, selection/LOCK marks, critical hero/companion silhouettes or phone controls |
| Asset coexistence | New `enemy-vfx.js` identity contract is inert; existing `sprites.js` owns approved frames, clips, lazy decode and rollback | Reference approved `vfx:` keys and named clips; do not create a rival loader or freehand frame timing |

These are source-level findings, not claims that new visual effects have been playtested. The hard work begins **after** this preparatory PR.

## Production rules (visual acceptance)

- **Preserve the procedural visual canon.** The existing character/boss/terrain appearance is the design blueprint. No new symbols, costume redesigns, external franchise art, UI reinterpretations or vague generic magic.
- **Use authentic materials.** Water reads as moving water, roots as roots, stone as stone, ash as ash, steel as steel. Color alone does not distinguish two attacks. Align the detail scale with illustrated sprites as they replace geometric bodies.
- **One clear payoff per cast.** Favor a readable release cue and local impact/aftermath. Any new particle/animation must have a defined start/end and be cut off on zone transition, death or canceled move. Persistent hazards may loop only while gameplay hazard exists.
- **Visual hierarchy:** player and six companions stay identifiable; boss movement and warning boundaries remain readable; ornamental effects stay subordinate. Do not increase volume automatically for TRUE mode merely to look more dangerous.
- **No particle accumulation.** Keep the existing bounded transient queue and measured device budgets; new work must demonstrate stable memory and work time on phone/Chromebook. Use conservative density scaling in crowd scenes, not bigger allocations per enemy.
- **Clips are optional substitutions.** The system must work entirely procedurally. A reviewed sprite clip replaces *one stage* at a time; if asset loading, the exact clip, cache or decoding fails, return to that stage's procedural drawing without erasing its telegraph.
- **Minimal VFX rendering layers:** ambient prewarning detail / active material action / precise hazard and targeting overlay. If effect artwork intersects a warning line, the warning line wins. Effects must be visible without requiring exaggerated glow or darkened surroundings.
- **Accessibility:** do not rely solely on color, microflashes or audio. Prefer readable motion, outline language and material shape. Avoid rapid strobing and introduce a future reduced-effects option only if it is fully functional.
- **Quality judgement is visual.** Unit tests prove geometry, identity and safety; human visual review approves aesthetics. CI green alone does not certify attractive or legible combat.

## Small vertical-slice acceptance before the mass pass

Test **five different behaviors first** against current screenshots and real play: Thornfang's Pounce (physical travel/landing), Crypt Guardian's Bone Volley (projectile), Mirejaw's Brood Call (non-damage summon), Stone Colossus's Shockwave Rings (moving footprint), and Dreadmaw's Ash Carapace (captain phase). If necessary use an equivalent phase pilot where content is not yet available. Include a missed hit, interrupted cast, target leaving the area, TRUE variant, and overlapping enemy warnings.

For each pilot, review an ordinary daytime scene, nighttime combat, a crowded six-companion fight, 375-pixel phone portrait and landscape, desktop, and all three supported zooms. Check telegraph shape vs actual collision, unobstructed HUD, pause/resume, entry/exit, phone framerate and no runaway sprites/decoded memory. Preserve accepted before/after screenshots and note **what improved and what remains too loud**.

## Safe staged implementation backlog

**Preparation / contract (this PR):** independent inventory and design/quality gate; no runtime effect modifications. Run `node scripts/enemy-vfx-inventory.cjs --markdown` for the live 46-boss-move, 16-captain-move, 5-phase, 2-night, 7-ranged and 84 rogue-basic identity catalog. The script inventories existing ordinary, guardian, ringleader, captain and boss rogue **basic** maneuvers now (including eligible ranged roles), and discovers expanded rogue **signatures** automatically after they merge. These IDs are candidates for shared visual recipes; they are not 84 required unique artworks.

**Next runtime PR (Work mode):** event-envelope delivery/cancellation and test fixture harness. Each event must carry immutable skill ID, actor ID, form/role, phase, authoritative world coordinates/geometry, duration tied to simulation, and source context for z-order. Capture zone-entry/death cancellation, duplicate prevention and lost/missed targets. No effect art or balance changes in this PR.

**Then the five visual pilots:** address false summon warnings and missing releases before adding glitter. Stage one skill at a time, use visual comparisons and an owner-approved aesthetic gate.

**Then full catalog:** boss/captain individual authored actions and phases, TRUE selective variants, night skills, ranged variants, and later the reconciled rogue basics/signatures/guardian/ringleader moves. A single generic recipe repeated under different colors does not count as a finished skill.

**Then art upgrades:** source-canon sprites and clips can replace individual procedural stages through the existing vetted asset lifecycle, without changing effect IDs or moving simulation coordinates. Art revisions need provenance, accepted originals, comparison screenshots and safe rollback.

## Verification gate for Work mode

All PRs must pass formatter, `npm run check`, quick/full Node regressions, Chromium desktop/phone, WebKit phone and sprite/material/offline packaging as applicable. Tests also inspect *actual* active visual timing, warning-vs-hit geometry, queue ceilings, no-effect fallback and the 150% camera. Gameplay/save/balance snapshots should remain equivalent. Keep unapproved changes in isolated draft PRs, and never call a procedural-looking placeholder a completed graphical improvement.

## Handoff for a new Work-mode conversation

> Fetch the latest GitHub `main` for `joedoragon-glitch/azeroth-chronicles-prototype`. Read `docs/ENEMY_SKILL_VFX_FOUNDATION.md`, `docs/ENEMY_SKILL_VFX_WORK_HANDOFF.md`, and the current authored inventory from `node scripts/enemy-vfx-inventory.cjs --markdown`. Start by reconciling open rogue PR #146 and any new source changes. Implement only the small event/visual contract bridge in a draft PR, audit it against real warning/damage geometry, then build the five deliberately restrained pilot effects one by one in subsequent reviewable PRs. Treat combat readability, material specificity, old procedural canon and future sprite/clip replacement as non-negotiable. Do not edit gameplay, change damage timing, merge without passing CI or mass-generate special effects. The user prefers characterful, attractive but **understated** VFX; no flashy screen-cluttering shortcuts.

This file is the handoff. The foundation PR introduced VFX asset identities; this housekeeping pass adds production direction and dynamic coverage, not implementation claims.
