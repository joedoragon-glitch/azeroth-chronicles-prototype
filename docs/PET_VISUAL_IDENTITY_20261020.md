# Approved pet visual identity correction — dev.115

Joel requested Little Marshal resemble the current Marshal Veyra, and Little Treasurer/Ash Cadet carry their bosses' actual weapons without stretched arms.

- Little Marshal now wears ivory/gold parade armor, the blonde crop and jeweled helmet, visible blue almond eyes and shaped lips, a violet skirt with short ivory tassets, shield and compact armored spear arm. Pet proportions and ground anchor remain.
- Little Treasurer reuses the exact Treasury boss hammer; Ash Cadet reuses the exact Warlord governor axe. Only the weapon is scaled and placed at each existing grip. Their bodies, faces, arms, hands and poses are unchanged.
- No stats, skills, AI, collision, saves, sprite registrations or generated images change. Adult weapon helpers were extracted unchanged; both boss forms remain pixel identical.

Evidence: [comparison](../tools/visual-review/pet-identity-dev115/comparacion.png), [native game scene](../tools/visual-review/pet-identity-dev115/native-valley.png), [reproducible check](../tools/visual-review/pet-identity-dev115/check.cjs), [results](../tools/visual-review/pet-identity-dev115/checks.json).

The focused audit passes 90 unchanged pixel comparisons (eight other pets and all eleven normal/TRUE bosses at three scales), nine changed-pet cases, exact shared arm/body source preservation, and render state purity. Native scene inspected with current sprite/material registries. Build/generated syntax and sprite, material, scope and audio inventories pass. Changed source formatting passes; the full format command reports only the pre-existing, unchanged `tools/sprites/approved.json` warning; no whole-game suite or CI is needed for these appearance-only edits.

Joel approved the shown corrections: “I like the pet corrections. You can proceed with them.” He noticed the Treasurer’s coin hand in both miniature and boss and explicitly left it unchanged for this pass.

Published in PR [#349](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/349), merge `ba15208bd109386152e8d41753e436d74ddbbe5b`. Package-only run 39506834456 succeeded; all 31 exact live files match at 2026-10-20 22:17:50 UTC. Normal workflow restored and temporary publisher removed. Receipt: `docs/evidence/PET_VISUAL_DEV115_PUBLICATION_20261020.json`. Updated [forum pet lineup](../tools/visual-review/pet-identity-dev115/mascotas-del-juego.png) uses the current exact drawings. Previous art and baseline commit remain recoverable; each affected design handoff records this correction separately from historical approvals.
