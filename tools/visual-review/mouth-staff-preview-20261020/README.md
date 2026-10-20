# Mouth and staff previews — 20 October 2026

**Approved and implemented in candidate dev.103:** Joel accepted the revised shaped lips, Mage A / Moon setting, and Mira C / Amber ring. Original arms/hands/grips remain. Other staff options are unselected. Sixteen actual painter outputs match the accepted candidate pixels. [Release scope](../../../docs/APPROVED_LIPS_STAFFS_20261020.md).

Joel reported doubled mouth contours after dev.102 and asked for review before any further character changes or shading. He specifically requested lipstick follow Lyss’s original half-smile and reopened the Mage/Mira staff design.

**Current revision after Joel’s review:** The broad colored-line mouth preview was rejected: it erased the shape of real lips. The replacement preview has a tapered cupid’s bow, rounded lower lip and a fine mouth seam that follow the original expression, including Lyss’s raised corner. It skips painting the original mouth entirely. No new facial shading. This revised appearance is still unselected.

Joel also rejected the extended arms. All revised staff options use the original staff axis (x=18) and the exact existing arm/hand/grip code; the body and live dev.102 face stay unchanged. No NPC arms are lengthened. The prior outward-axis staff previews are rejected history in commit f0a51d80da67622c3083f21930ec58bc49332454.

No runtime, version, assets, deployment or accepted design is changed. The preview script loads the actual procedural painter in isolated VMs and applies candidate replacements only in memory. The live source SHA is recorded in candidate-patches.json. The latest mouths use a filled upper/lower lip silhouette, tapered corners and one fine seam along the original expression; no old mouth underneath or extra face shading. Veyra’s original straight mouth is similarly recolored. Crowned Mage scarf stays in place. Male faces retain their existing path/color.

Sheets:
- mouths-preview.png: original expression / released dev.102 / revised shaped lips, including Lyss’s raised right corner. Enlarged face and small whole body beside it.
- mage-staff-preview.png: current plus A Moon setting, B Crystal setting, C Open silver ring; normal/crowned.
- mira-staff-preview.png: current plus A Leaf crest, B Carved crook, C Amber ring. The instructor’s existing book stays in hand.

These are unselected proposals. Await Joel’s mouth feedback and separate staff selections. Do not change or publish game art before his review. Retain originals and selected violet bows. Staff proposal bodies keep the live dev.102 mouths, independently of the mouth correction preview.

Additional owner request while preparing these previews: audit Frontier’s diagonal central clutter and underused four edges, propose structure redistribution and extended roads while leaving natural scenery in place; audit modestly expanding Abyss Bastion and clearing enemy/party movement lanes. This work continues independently; no preview acceptance is inferred.
