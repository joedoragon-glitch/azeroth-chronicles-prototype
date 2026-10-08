# Current sprite scope reconciliation · 8 October 2026

Joel accepted the first pilot design direction, with a specific Goblin face correction, and requested the complete current scope before further generation or runtime implementation. This audit is based on latest v0.8.90 main `e2529b0f6db9737ecb62af48c0c2a87693e8647a` after preserving the concurrent audio release. Visual/map sources are byte-identical to the original v0.8.89 audit baseline `231d898988752f1594614a360bda8bb3cc87c1f1`; the procedural drawings and current authored map states are authoritative.

## Reconciled inventory

| Decision | Previous checkpoint | Current scope |
| --- | ---: | ---: |
| Numbered decisions | 231 | 296 |
| Generate isolated static art | 221 | 280 |
| Exact visual aliases | 0 | 0 |
| Numbered procedural decisions | 10 | 16 |
| Prepared exact processing contracts | 3 | 70 |

The count is a reviewed checkpoint, not a production ceiling. Original IDs remain stable. Added entries do not renumber earlier work. Art candidates and immutable sources are retained by exact key and hash; unrelated catalog additions do not require generating earlier art again. If its own prompt or reference changes, review and reprocess that candidate against the fresh contract before registration.

| Current finding | Catalog action |
| --- | --- |
| Full Barracks have distinct command-canopy, tent and supply bodies | Add five regional entries 232–236; remove obsolete Full-to-Basic alias guidance |
| Highlands livelihood, mine marking and household bodies | Add ten exact static entries 237–246 |
| Bastion flight project bodies | Add four entries 247–250; preserve the unfinished launch platform |
| Borin, Neri and Dara now occupy secured workstations | Retire generation at old closed-cage IDs 172/174/176; classify current secured/rescued compositions as procedural 251–253 |
| Crown ranged soldier has a distinct uniform and loadout | Add 254; also correct the older melee Crown cue |
| Guards have exact runtime variants and species-specific cues | Add 16 entries 255–270, including treasury Ash-beast variants; preserve Skeleton shields, Crown uniform/pauldrons and small role marks |
| Smaller flora, logs and rocks were excluded by the initial representative-only plan | Promote 24 current nature families 271–294 and add two field-rock materials 295–296; preserve seeded variety and exact regional bindings |
| Terrain can gain richer material detail without changing map geometry | Add 28 separately tracked seamless texture candidates T001–T028 |
| Named treasury captains use current ranged/guard loadouts | Revise 046–049 and prepare exact contracts; retain the current Frontier Cinder Warlord contract at 050 |
| Contextual work scenes add people, equipment and rescue-dependent overlays | Keep all eight `workDetails` roles procedural; generic furniture must not erase them |

## Evidence and repeatable discovery

Read against `REGIONAL_HANDOFF_AUDIT.md`, `IRONROOT_HIGHLANDS_LAYOUT.md`, `ABYSS_AIR_SUPERIORITY_CANON.md`, current `data.js`, `rules.js`, `world.js`, `visuals.js` and exact key resolution in `sprites.js`. The renderer coverage document classifies 153 decoration cases, 15 settlement cases and 26 landmark cases. Terrain, dungeon geometry, construction stages, effects, repeated/seeded furnishings and summoned silhouettes retain their documented procedural decisions.

`npm run sprite:scope` records current source hashes, case lists, eight work roles and actual enemy keys. Normal and Nightmare samples at two deterministic random values cover five regions, five main interiors, five side interiors and four treasuries. This is a bounded current-world census, not proof of every future seed, night encounter or summon. Source-case discovery and each job's exact live state/reference supply the additional check. `npm run check` includes scope discovery; regression tests reject unclassified new prop cases, lost contextual classifications and omitted guard/captain decisions. Checked-in evidence: `docs/evidence/SPRITE_SCOPE_RECONCILIATION.json`.

## Pilot lessons applied

Paladin and cottage direction are acceptable to Joel. Goblin proportions/equipment are acceptable, but the wide pale triangular face mark reads as a smile. All Goblin jobs must use a small angular nose and a separate restrained mouth, checked at actual gameplay size as well as enlarged. The retained first Goblin candidate needs a targeted face correction before activation.

Generation reference rendering now omits presentation-owned shadows, camp ground patches, actor/guard ground chevrons and captain/ringleader ground rings. Ordinary references and gameplay comparisons retain current presentation. Body geometry, equipment and materials remain from the production source. The game itself is unchanged. Image inspection separately reports faint alpha pixels and material bounds while preserving the strict full-alpha transparent-margin check. Keep source originals; document explicit padding rather than silently cropping or erasing alpha. Cottage pilot normalization records its unchanged original and padded derivative.

All 70 prepared contracts have exact resolver bindings and deterministic reference/scene validation. Native-scale face/equipment readability, apparent size, anchor and grounding still need review on final art. Archived pilot metadata retains its original hashes and pending status; it is not an approved registration under this revised catalog.

## Production and integration sequence

1. Correct the pilot Goblin face; refresh the three pilot records and finalize gameplay anchors/scale. Keep the accepted Paladin/cottage direction.
2. Generate each remaining candidate alone from its current isolated reference and reconciled prompt. Start with heroes/companions and ordinary enemies, then named actors, regional architecture/services, entrances and furnishings. Prepare exact contracts for entries that do not yet have one; never infer bindings from names alone.
3. Check transparency, full silhouette, palette/loadout, native readability, anchors and source provenance. Retain accepted source hashes and a resumable per-key production record. New map candidates append reviewed decisions; obsolete ones are revised or skipped without discarding unrelated completed work.
4. Integrate accepted assets in tested batches. Preserve procedural fallback, contextual states, collision, labels, ground cues, day/night lighting and offline packaging. Military Ringleaders currently need their species-specific officer overlays supported before base images can be enabled for those forms; the optional sprite overlay still uses a generic crown. Normal/TRUE reuse requires normal-only art and separately retained TRUE effects.
5. Run device/decode/loading and regression checks, CI browser/showroom/offline gates and exact live-build verification before calling integration complete. Keep Issue 111 open until the pilot and release evidence are complete.

This reconciliation activates no production images. The production sprite manifest and approval registry remain empty. It prepares the larger generation phase with current scope and explicit integration requirements.

## Expanded terrain and environment scope

Joel added terrain and environmental dressing to this reconciliation. The 280 body-sprite candidates now include the large regional nature representatives 106–110, 24 smaller authored flora/wood/stone families 271–294 and two field-rock materials 295–296. Coverage includes trees and saplings, bushes, wildflowers, heather, dry/wet grass, reeds/cattails, scrub, stumps, fallen/burned logs, driftwood, mangroves, small rocks, obsidian and crystals. No new biological species are inferred from generic names. Additional current authored flora append reviewed jobs.

A separate catalog adds 28 terrain material candidates: five outdoor grounds, five road materials, five main-dungeon floors, four treasury floors, five regional side-interior floors and four rock/lava-crust/timber materials. These need an opaque seamless-material processor and clipped world-space rendering, rather than the transparent actor pipeline. Begin terrain with the five regional ground pilots. See GRAPHICS_CANON_TERRAIN_TEXTURE_CANDIDATES.md and tools/sprites/terrain-specifications.json.

Natural scenery needs current seed/variant references and selection across accepted variants, preserving placement, density, footprints and grounding. Do not register one representative under broad wild keys until variant handling prevents flattening tree/rock identity. Shared small bodies in more than one region still require explicit checked regional registrations. The current exact key resolver remains unchanged. tools/sprites/environment-scope.json records the new families and current region identities. Ash patches, ember pits, fumaroles and repeated dock structures retain procedural geometry/effects in this pass; finer ground microdetail also remains beneath the material treatment.
