# Abyss Bastion final verification

This verification commit exists to force CI against the exact hardened Abyss Bastion head after the earlier pre-hardening run exposed a real route failure.

The final regression contract is stricter than the failed build:

- Abyss Bastion uses its irregular authored collision geometry rather than the legacy single divider.
- The normal and Awakening garrison uses 26 zero-gold/zero-XP guardians staged as 13 small pairs.
- Reinforcements use the same authored post network.
- The 22 trap plan remains warned and avoidable.
- Route tests enlarge seal radius and also enlarge both jet length and jet half-width before treating every trap as permanently unsafe.
- Both Abyss Dragon and Eren must remain reachable under that enlarged permanent-hazard model.
- Existing saves restage surviving legacy guardians, preserve defeated guardians, add only missing new guardian slots, and move the hero/active companions only if the new geometry would otherwise contain them.
- The procedural renderer draws the same authored fortress masses that collision uses.

A CI pass on this branch is required before merge. The main-branch workflow remains authoritative for full regression, browser matrix, Pages deployment and published-build smoke verification.
