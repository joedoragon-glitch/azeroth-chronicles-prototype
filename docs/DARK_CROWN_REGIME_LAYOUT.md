# Dark Crown regime-layout pass

This pass gives Dark Crown a dedicated procedural layout layer. It does not introduce sprites, change combat balance, alter boss progression, or add rewards.

## Canon preserved

- Dark Crown remains the final region.
- Cindermaw remains the field boss and Vera remains his captive.
- Cindermaw's Treasury remains his occupied Treasury, with Dreadmaw as its captain.
- The Ash Sentinel remains the Citadel boss and Tovan remains its captive.
- The Dark Lord remains behind the final fortress gate and still requires both Crown specialists to be rescued.
- Existing terrain, lava barriers, Citadel interior, Treasury interior, boss mechanics, quest rewards and ending logic remain intact.

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
