# Dark Crown regime-layout pass

This pass gives Dark Crown a dedicated procedural layout layer. It does not introduce sprites, change combat balance, alter boss progression, or add rewards.

## Canon preserved

- Dark Crown remains the final region.
- Cindermaw remains the field boss and Vera remains his captive.
- Cindermaw's Treasury remains his occupied Treasury, with Dreadmaw as its captain.
- The Ash Sentinel remains the Citadel boss and Tovan remains its captive.
- The Dark Lord remains behind the final fortress gate and still requires both Crown specialists to be rescued.
- Existing terrain, lava barriers, boss mechanics, Treasury cache count/rewards, specialist progression and ending logic remain intact; the Citadel and Cindermaw Treasury now have their authored irregular interior layouts.

## Dedicated districts

The procedural generator now reinforces five separate Crown spheres:

1. **Crownwatch labor quarter** — ash-stone housing, work/forge space, food, bunks, supply stacks and taxation.
2. **Citadel command sphere** — controlled military staging, walls, watch posts, banners, weapons, training and command furniture.
3. **Cindermaw domain** — roosting, heat, bone, obsidian and sleeping traces around the ash-beast sphere.
4. **Fortress logistics** — forge, supplies, kitchen, bunks, weapons and command infrastructure supporting the siege/final approach.
5. **Fortress approach** — harsher controlled space with Crown walls, braziers, banners, barricades, weapons and watch control.

The old generic fortress work-camp dressing is retired where this authored layer replaces it.

## Distributed roads and exits

Dark Crown's road network now has its own version and deliberately reaches several separate functional edges instead of treating the town as the only transport focus:

- northwest administrative/dragon return platform;
- western levy and supply road;
- eastern military gate;
- southern ash-beast/wilderness track;
- eastern fortress service/logistics route.

The existing roads to Ash Refuge, the Citadel, Cindermaw's field compound and the Dark Fortress gate remain. Additional roads connect the Crown field barracks and siege infrastructure.

### Borrowed Crown travel network

Dark Crown's existing dragon platform, levy caravan route, military transit route and fortress convoy route are all usable as equivalent travel hubs. No new roads or travel buildings are added for this feature. Interacting with any of these structures offers the same list of previously visited regions, and selecting a region places the hero directly in that region's main town.

The wilderness ash track remains environmental/world-space infrastructure rather than a travel hub.

## Ordinary inhabitants

Dark Crown keeps the existing ash-beast roost and Crown field barracks strongholds and adds an unmarked Crown toll redoubt. These are ordinary-monster/soldier living and territorial spaces rather than resource wrappers.

## Save migration

Only Crown-specific layout versions are advanced where possible:

- Crown road network: v10 (other regions remain v9).
- Crown destination layout: v3 (other regions remain v2).
- Crown creature strongholds: v7 (other regions remain v6).
- New Crown district layer: v1.

Existing campaign facts, resources, rescues, bosses and progression are not reset.

## Procedural composition and hierarchy pass

The Crown visual pass improves composition rather than density. Districts keep their established footprints, roads, encounters and populations, but several loose prop clusters are consolidated into larger procedural scene units: a levy yard, command post, Ash-beast roost scene, fortress logistics bay and final-approach checkpoint.

Monster identity remains stable. Ordinary monsters are not randomized into individually unique designs. Visual differences communicate gameplay role and hierarchy:

- Ash beasts keep stable species anatomy, with their existing melee/ranged role cues.
- Crown soldiers share one uniform family; ranged/guard roles use equipment and uniform cues rather than new bodies.
- Military Ringleaders (Crown soldiers, Frontier orcs and Raider archers) use same-size officer/commander treatments instead of the universal gold-crown Ringleader overlay.
- Non-military species retain the universal Ringleader treatment.

The Citadel of Ashes receives the same composition rule. Its former scatter of individual armor stands, banners, runes and service props is consolidated into six readable functional stations: muster, command, ritual control, barracks/training, forge/supply and the final boss approach.

### Citadel fortress-layout pass

The Citadel is no longer constrained by the legacy single-divider rectangular main-dungeon template. It uses a data-driven irregular fortress footprint built from overlapping functional wings: outer muster court, command spine, barracks/armory wing, ritual-control wing, forge/logistics quarter, service loop and inner command court. Internal partitions use multiple gates so the complex has chokepoints and hierarchy without becoming a one-path maze.

The Citadel now fields 32 rewardless Crown guardians in authored military formations. Shield/melee guardians and ranged marksmen occupy positions appropriate to muster, command, ritual security, barracks, logistics and the inner court. The same formation system is reused when Awakening guardians return. Guardian gold and EXP remain zero.

Citadel traps are redesigned as 28 defensive installations distributed through those functional areas rather than generic floor scatter. The mandatory navigation invariant is stronger than before: the entrance, Ash Sentinel chamber and Tovan's captive position must remain connected by at least one route that does not cross any trap footprint at all. The barracks and ritual-control wings likewise retain trap-free access. Traps may make shortcuts or direct lanes dangerous, but they cannot be unavoidable progression damage.

Existing Citadel saves migrate to fortress-layout version 3. If the hero, an active companion, an NPC or a surviving enemy occupies space that became solid under the new architecture, it is moved to the nearest valid Citadel floor without resetting campaign progress, rewards or boss state. The other four main dungeons retain their existing geometry.

### Cindermaw Treasury den pass

Cindermaw's Treasury now follows the same Dark Crown spatial philosophy without copying the Citadel's scale. The old 900×900 crossed-wall storehouse is replaced by a compact irregular volcanic den composed from overlapping spaces: entrance cleft, roost chamber, hoard chamber, ash den, ember junction, service loop and Dreadmaw's inner vault.

The three quest caches remain exactly three and keep their collected-state migration, but they are distributed across separate den spaces rather than sharing generic storehouse coordinates. Dreadmaw remains the captain and combat disciple of Cindermaw and keeps the inner vault. The permanent Treasury population remains Dreadmaw plus three Ash-beast guardians.

Dreadmaw gains a fourth captain skill, **Brood Call**. It has a readable summon warning and maintains a maximum three-member Ash-beast brood: two melee Ash broodlings and one ranged Cinder broodling. These are temporary zero-reward summons, not additional permanent guardians. Brood Call replenishes missing members up to three rather than stacking unlimited waves, and Dreadmaw's brood is removed when he is defeated or the encounter resets.

At 45% HP, **Ash Carapace** becomes the fight's explicit second-phase transition: Dreadmaw keeps the six-second damage reduction, faster late-phase attack cadence and immediate special opportunity, and also forcibly refills any missing brood slots back to the three-member cap even if Brood Call was still cooling down. Surviving broodlings remain in place, so the transition never exceeds three summons or duplicates living members. The forced refill then starts the ordinary Brood Call cooldown. No new species, boss or reward layer is introduced.

Treasury dressing is reduced into stronger procedural compositions: an Ash-beast roost scene, a dense Cindermaw hoard scene, an ash den and a Dreadmaw vault post, with only a few supporting props. The floor gains restrained ash/obsidian/ember detail specific to Cindermaw's den.

Treasury layout version 4 migrates existing Cindermaw Treasury saves. Cache progress, Dreadmaw state and campaign facts are retained; occupants stranded by the new irregular footprint are moved to valid floor. Other regional Treasuries keep their existing layouts.
