# Pet visual identity correction — prepared dev.115

Joel requested Little Marshal resemble the current Marshal Veyra, and Little Treasurer/Ash Cadet carry their bosses' actual weapons without stretched arms.

- Little Marshal now wears ivory/gold parade armor, the blonde crop and jeweled helmet, visible blue almond eyes and shaped lips, a violet skirt with short ivory tassets, shield and compact armored spear arm. Pet proportions and ground anchor remain.
- Little Treasurer reuses the exact Treasury boss hammer; Ash Cadet reuses the exact Warlord governor axe. Only the weapon is scaled and placed at each existing grip. Their bodies, faces, arms, hands and poses are unchanged.
- No stats, skills, AI, collision, saves, sprite registrations or generated images change. Adult weapon helpers were extracted unchanged; both boss forms remain pixel identical.

Evidence: [comparison](../tools/visual-review/pet-identity-dev115/comparacion.png), [native game scene](../tools/visual-review/pet-identity-dev115/native-valley.png), [reproducible check](../tools/visual-review/pet-identity-dev115/check.cjs), [results](../tools/visual-review/pet-identity-dev115/checks.json).

The focused audit passes 90 unchanged pixel comparisons (eight other pets and all eleven normal/TRUE bosses at three scales), nine changed-pet cases, exact shared arm/body source preservation, and render state purity. Native scene inspected with current sprite/material registries. Build/generated syntax and sprite, material, scope and audio inventories pass. Changed source formatting passes; the full format command reports only the pre-existing, unchanged `tools/sprites/approved.json` warning; no whole-game suite or CI is needed for these appearance-only edits.

Status: local implemented candidate for owner appearance review. Not merged or deployed. Previous art and baseline commit remain recoverable; each affected design handoff records this correction separately from historical approvals.
