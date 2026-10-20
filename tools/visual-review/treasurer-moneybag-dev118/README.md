# Treasurer money bag visual evidence — dev.118

Run `node tools/visual-review/treasurer-moneybag-dev118/check.cjs` from the repository root. The immutable baseline is the pre-correction main commit `3c0a2b13ce6fa48981d99158623012bea35252c1` (local equivalent fallback `e906e98`). The comparison uses actual procedural game drawings, not generated or repainted artwork.

Nine Treasurer render cases change only in the existing left-hand region (pet, normal boss and TRUE boss at three scales); ninety other pet/boss cases remain pixel identical. Source checks preserve the boss body/arms and exact hammer, plus shared pet body and arms. Rendering is state-pure. `comparison.png` is the before/after contact sheet; `audit.json` records source hash and difference bounds.
