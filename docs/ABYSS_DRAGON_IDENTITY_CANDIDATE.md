# Abyss Dragon — Veyrith, the Navigator (#243)

**Status:** proposed canon on an isolated draft branch, awaiting owner review. This does not override the already-approved [Abyss air-superiority canon](ABYSS_AIR_SUPERIORITY_CANON.md) or authorize a separate content release.

## Eight-sentence character candidate

Veyrith is an intelligent purple dragon who once mapped safe aerial passages between vulnerable nesting places, rather than hoarding a throne. When conflict made those passages dangerous, he joined the previous hero **by choice**: the ground-based adventuring party could negotiate safe landing places, while he served as its **aerial pathfinder and extraction specialist**, scouting ahead and bringing wounded companions home. Dragons can burn armies but cannot easily rule these five settled regions alone: adults are few, young take time and protection to mature, feeding them is costly, and roads, grain, forges, coin and ordinary consent are controlled on the ground. The future Dark Lord became a genuine friend on their flights; he liked Veyrith's purple color partly because purple was his favorite, but the dragon chose the routes and freely carried him as a companion, not a captive. Veyrith now lives in his royal Bastion aerie and keeps watch over the hatchery, riders and handlers, uneasy that the friend who once helped people return home wants to turn their flight paths into military corridors. If released from **Crown service**, he would protect the nesting grounds, insist on willing, trained crews and safe return plans, and preserve fond memories of the Dark Lord without obeying him forever. If the throne fell, he could claim the aerie, trusted flight instructors, hatchery personnel, supply contacts and their maps as an **independent power base**, then make protection of vital crossings a bargain for ground political authority while the unfinished air force slowly matures. He would govern with meticulous rescue ledgers, strict flight clearance and genuine emergency relief, but his conviction that *nobody should travel without a safe plan* could harden into permits, controlled commerce and withheld assistance: a successor Dark Lord of compulsory safety, not a second fire-breathing conqueror.

## Personality and governing signature

Veyrith remembers the name of the last passenger before he remembers the weight of the treasure. He is gentle with exhausted apprentices, dryly impatient with officers who omit a return route, and frighteningly capable of grounding a whole province “for its own protection.” He does not despise his former rider: they once trusted each other in the air, and the purple harness is an old shared joke rather than a slave's restraint. His affection does not grant the Dark Lord unlimited obedience.

This is a **credible future claimant, not a forced ending**. The Bastion has eggs, equipment, grooms, training facilities, the unfinished launch platform and a supply network; it does **not** have an operational invasion fleet. Veyrith needs cooperation from land-based settlements and crews to govern. His claim can fail, change, or coexist with the post-Awakening peace. No new dragon kingdom, new region, class or playable flight system is implied.

## Player-observable evidence

1. **Existing Bastion flight-planning table, `Wings of War` rescue payoff:** Eren's once-only quest narration names Veyrith and reports a marked route home for every attack. The map and its existing purple routes remain; this is readable story text, not microscopic lettering drawn onto the table. Existing paid-quest flags keep the cue from replaying after reload. The original once-only Bastion entrance description remains unchanged.
2. **Already-existing encounter, no balance retune:** Shadow Flight forces the hero to follow two sequential landing warnings; Wing Shockwave clears a ring; Hatchling Call brings a capped brood; and the existing **Wingward Break** scatter makes him feel like a defensive airspace commander. These are suggestive behaviors, not proof that individual summoned hatchlings receive new protective AI.

## Aviation move-name direction

The owner agreed in principle to a technical-aviation naming theme and authorized the implementation phase. The [seven-term combat handoff](ABYSS_DRAGON_AVIATION_MOVE_HANDOFF.md) maps the proposed names to exact existing attack behavior, with no claim that they have already been wired into the game. **Air Force One** remains an affectionate comparison for the Dark Lord's personal mount, not evidence of a deployed air force.

## Combat and safety audit

Current normal repertoire from `rules.attacks.abyss`: Flame Cone (1.5 s warning, safe flank), Wing Shockwave (1.7 s expanding-ring warning), Shadow Flight (two sequential landing circles, 1.8 s warning), Hatchling Call (2 s warning, cap through existing summoning logic). Existing `bossBehavior.abyss` favors cone/ring up close, targeted landings at range, and phase combinations, including a flight-to-call possibility. `Ashwing Feint`, `Wingward Break` and `Ember Renewal` already supply additional identity in their existing systems.

**Decision:** do not change attack frequency, damage, summon counts, recovery, speed, AoE geometry, offscreen targeting or TRUE mechanics for a biography ticket. The current kit is already distinctive and readable; speculative new mechanics would threaten the 18-trap rescue routes and require a separate observed-combat acceptance pass. A later targeted change is justified only by playtest evidence, not by the dragon's newly written name.

## Preservation / next handoff

Keep internal boss family `abyss`, displayed boss label `Abyss Dragon`, existing purple body/sprite/procedural art, all structural and prop IDs, air project, Eren's rescue, rewards, stable save v4 keys, normal/TRUE/Awakening and separate civilian Frontier dragon transport unchanged. The distinct name is dialogue/lore only. No new art required; [design handoff](../tools/sprites/design-handoffs/abyss-dragon.json) records this idea without asserting an accepted new visual.

**Approval needed:** owner accepts or revises Veyrith's biography and the in-game clue before the single combined #232 worldbuilding publication. The draft PR itself neither approves nor deploys this canon.
