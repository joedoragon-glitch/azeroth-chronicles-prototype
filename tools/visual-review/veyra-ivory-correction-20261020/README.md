**Approved and implementing — 20 October, 11:03 EDT:** Joel approved the corrected right-hand design. The historical preview instructions below do not describe current release status. Implementation/evidence: `docs/VEYRA_IVORY_20261020.md`; `tools/visual-review/veyra-approved-dev111/`.

# Veyra ivory parade: armored arm and skirt correction — 20 October 2026

Joel selected option B / ivory parade armor, but requested a preview correction before implementation. He rejected the thin reaching arm: the weapon should come to a natural arm, and the arm should look fully armored. He also requested a visible skirt with plates on top, instead of awkward paired leg-like panels, with a properly static pose.

The new preview brings the spear axis inward from x=29 to x=23 and keeps the upper arm close to the torso. Upper-arm plate, elbow cop, vambrace, cuff and articulated gauntlet replace the thin extended forearm. The shield stays in its existing position. The chosen breastplate, shoulders, ivory/gold/violet palette, open eyes, face, blonde crop and approved lips remain. A bounded pixel comparison confirms the selected face region is byte-identical.

One continuous violet cloth skirt now extends under the waist belt. Three short ivory tassets visibly hang over it. The long paired lower panels are removed; boot tips remain small beneath the hem. This is a fixed normal/TRUE standing design, with the existing TRUE crown, halo and glints retained.

`ivory-correction.png` shows the earlier selected B on the left and the correction on the right, enlarged and at the actual 150% camera scale. Exact original/revised helper strings and source hash are retained in `candidate.json`; `preview.cjs` loads the immutable dev.103 visual source into isolated VMs.

**Preview only.** The selected direction is B; this corrected arm/skirt appearance is pending Joel’s review. No runtime files, version, build, CI, collision, animations or live game have changed. Frontier/Abyss proposals remain unchanged and unapplied.
