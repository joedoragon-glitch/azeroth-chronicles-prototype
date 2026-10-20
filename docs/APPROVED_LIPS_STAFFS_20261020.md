# Approved shaped lips and staff-only update — 20 October 2026

Dev.103 implements Joel’s selections: revised shaped upper/lower lips; Moon setting (A) for the Mage in regular/crowned outfits; Amber ring (C, called “ember ring” in dictation) for Mira. The exact current arms, hands and grips stay at their original positions. The shaft stays at x=18. Other NPC staffs are unchanged.

The original mouth stroke is skipped for the eight affected female identities and replaced by tapered upper and lower lip contours around the original expression, with one fine seam. Lyss retains her raised right corner/half-smile. The broad pink-line candidate and the extended-arm staff candidates were explicitly rejected and remain historical, unselected previews. No new face shading is added; the crowned Mage’s scarf remains over her mouth.

The accepted staff heads and grip bands use exactly the preview geometry. Shared Mage and specialist painting carries the choices into regular/crowned and captive/rescued/appointed states. Silver braids and violet bows stay intact. Build/version generation and focused syntax/format pass. Sixteen native canvas draws match the exact accepted preview pixels (both Mage outfits, six specialists in two contexts, and normal/TRUE Marshal Veyra). No broad tests, browser matrix or hosted test CI.

The Frontier/Abyss work in this branch is an audit and isolated geometric proposal only. No map, geometry, AI, balance, save or road runtime is changed in this release. Detailed findings and proposed placements: `tools/visual-review/frontier-bastion-audit-20261020/README.md`.

Character source: `src/prototype/visuals.js`; accepted reference sheets and exact in-memory candidate patches: `tools/visual-review/mouth-staff-preview-20261020/`. Owner approval dated 20 October 2026: “For the main staff, I like the moon setting … [for] Mira the ember ring … revised [mouth] preview, now they are fine.” Conversation URL unavailable.

Publish via the established owner-authorized package-only workflow; verify exact live files, then restore normal workflow and remove the temporary publisher. Owner live play follows.
