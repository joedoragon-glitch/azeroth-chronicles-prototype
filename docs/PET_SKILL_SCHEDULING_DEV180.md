# Pet skill scheduling — dev.180 focused correction

Current-base contract: merged dev.179 at `cead5739eec76b9a8130d4b8f0091151a07f0d79`. This change affects autonomous pet decisions only. It does not touch player Skill 1/FIFO, troop skill priorities, per-pet damage/multipliers, the shared 1.5s special lock, the 0.65s charged preparation, the existing 8s/12s pet special recovery, or v4 persistence.

## Behavior
- A pet still normally prioritizes a legal multi-target charged special over a ready first special.
- A ready first special takes priority only for meaningful healing (at least half of one normal heal's value to the pet or an in-range, line-of-sight ally), a missing/weaker/about-to-expire first-slot ward, or the next eligible turn after an interrupted/fizzled charge.
- Cinder Cub's ward is on its **second**, charged special; when needed it can prioritize that charged action in a single-target fight, with the existing release/contact requirement and interruption safeguards.
- A failed charged release or actual interruption grants a temporary, per-pet first-slot preference (three seconds) **only if the first is already ready**. A first that is illegal at the selected target never blocks an otherwise legal charged action; successful first releases clear the preference.
- The preference resides in a WeakMap, scoped by region and expiring naturally. No new save fields, no added combat iterations, no additional AI search when skills are globally locked.

## Validation boundary
`tests/pet-skill-priority.test.cjs` covers 11-family offensive priority, Lifebinder self/ally healing, minimal/missing-range/occluded healing, Pebble's first ward, Cinder's second ward, first-skill range safety, a genuinely interrupted native charged preparation, missing-target fizzle, restore and region invalidation. Existing first/charged release, healing, pet reach, interruption, damage and focused packaging suites remain relevant.

New runtime/manual performance, actual browser/phone play, and subjective balance acceptance are not certified by this document.