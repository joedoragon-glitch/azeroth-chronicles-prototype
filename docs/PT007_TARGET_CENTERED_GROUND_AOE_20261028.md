# PT-007 — Target-centered boss ground AoE (28 October 2026)

**Status:** PR candidate for *So I Became the Dark Lord's Problem*. Keep separate from the deployed PT-002 actor-body collision rollback (PR #567). No merge or deployment is implied by the creation of this branch.

## Owner decision

When a boss chooses an area-of-effect (AoE) attack, its target is the hero or a companion. The warning is the actual committed damage area. The blast can partly overlap inaccessible ground, scenery or a wall: that is not grounds to shrink, relocate, defer or cancel it. Damage to characters inside its area should not vanish solely because the boss cannot trace line of sight through unrelated geometry.

## Implementation boundaries

- Ordinary circular ground blasts retain their **authored target, radius, patch offsets and timing**. The same frozen footprint is used for both visual warning and damage.
- Paired non-projectile ground lanes retain their intended parallel offsets and full lengths, without probing terrain for somewhere they will fit.
- Generic boss/captain ground AoE preparation no longer triggers the 800-unit `connectedArenaPoints` flood search or its expensive `blocked`/`clearSegment` operations.
- **Exception:** the Citadel's Veyra persistent checkerboard is a real physical floor pattern with sixteen valid tiles; `sentinelBoardPlan` still uses `connectedArenaPoints` to validate that special court. The method/configuration are retained for that purpose only. This is not ordinary AoE placement.
- Circle blasts and paired ground lanes ignore caster-to-target line-of-sight in their final area-hit checks. Physically directed line attacks, charges, missiles, abilities with explicit special blocking, the archive anchor and mire jaw targeting retain their separate restrictions.
- No changes to hero or companion collision, saves, asset pipelines, PixiJS, or unrelated attacks. This PR does not assert that the navigation spike or WebGL texture stall is resolved.

## Validation

The dedicated `tests/pt007-ground-aoe.test.cjs` verifies zero terrain fitting during ground-AoE preparation, frozen warning geometry, real damage despite obstructed caster sight, and physical directed-attack obstruction checks. The PT-007 portion of `pt312-combat-integration.test.cjs` now asserts unchanged full-radius target-centered geometry rather than the revoked requirement to fit onto reachable floor. The Citadel checkerboard and other conventional boss test contracts remain authoritative.

**Publication:** Wait for focused CI and review. Device verification and measured performance improvements require a separate playtest.
