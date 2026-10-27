# Rogue Bard — static character and crowned Dark Lord visual specification

> **Current phase/status (27 October 2026):** [Eight-phase handoff](ROGUE_BARD_EIGHT_PHASE_DEVELOPMENT_HANDOFF_20261027.md) supersedes dated implementation claims on this page. **Phase 1 and staged Phase 2 passed focused CI at `b915bc06`; Phase 3 Charm is pending. Rogue remains unselectable, PR #511 draft/unmerged/undeployed; `main` through `990fc79d` (new branding and lightweight pre-CI policy) is incorporated on the Phase 3 preparation branch; focused validation of this new integration head is separate from the passing Phase 2 run.** Historic “docs only”, “no skills”, “implementation not authorized”, guitar, and permanently fixed sixteen-name statements below are **archived source context**, not current instructions. New owner canon: **suspended oversized jingle-bell staff**; **all sixteen names may be revised**; Charm-first tutorial and every real Charmed monster's ordinary labor rights. See the handoff for exact phase gates and source precedence.

**Original specification: 26 October 2026 | Owner-directed first-play implementation baseline: 27 October 2026**

**Current mandatory art interpretation:** The originally proposed guitar specification in later sections of this page has been **superseded**. The Rogue carries a **staff with one oversized spherical jingle bell hanging from it**—in BOTH ordinary and crowned versions. No guitar face/strings/playing-pose or old guitar color mapping should be reproduced in new art. The four newer reference pictures establish **weapon inspiration only**, not clothing, hair, character proportions or unrelated props. Preserve the separately recorded warm dark-brown skin, visible long wavy black hair, mischievous expression, South Asian/Middle Eastern/Persian-inspired asymmetric sari-like violet/plum/copper traveling clothes, gold jewelry and related royal mantle/circlet for first-play art. The actual new static drawings and phone/Canvas/Pixi comparison remain **Phase 7 work**; no new animation rig. The old guitar notes below are retained strictly as *historical rejected options*.

**Implementation precedence:** The owner has adopted the documented Rogue Bard discussion and this existing original static-appearance proposal as the **working canonical look for the first playable build**, to be revised through their own playtests rather than replaced by new invention. Preserve the intended dark warm-brown complexion, uncovered long wavy black hair, confident mischievous expression, sari-like asymmetric plum/violet/copper travel attire, sash, practical skirt/trousers, and gold/brass accessories as the **first-pass appearance**. The exact palette/details can be tuned after testing; no already-finished sprite or image is implied. The revised weapon overrides **every guitar/string specification further down this historical candidate**: she wields a staff bearing an **oversized spherical suspended jingle bell**, producing brief jingle-bell basic-attack cues. Apply this substitution to both ordinary and crowned designs and to art review criteria. The four newer weapon reference images are **weapon-only references**, not approval of their characters' fur costumes, proportions, hairstyle, or colors. Do not create dancing animation or additional dynamic renderer systems.

**Mandatory:** Azeroth Chronicles presently paints **static, canon-sized procedural character depictions and optional static sprites** at moving actor positions. A "dancer" here is a character concept, **not a request for animation**. NO dance frames, poses, attack stances, sprite sheets, skeleton rigs, particle emitter systems, directional sprite sets, fabric simulations or dedicated animation clock. Design must remain recognizable in the same native field size as Paladin/Mage/Ranger and retain Canvas/Pixi fallback behavior. Consult [visuals.js hero() and crownedHero()](../src/prototype/visuals.js#L6529-L6630), [actor dispatcher](../src/prototype/visuals.js#L17195-L17202), [sprites.js static entries and crowned fallback](../src/prototype/sprites.js#L107-L112), and [renderer.js](../src/prototype/renderer.js).

## 1. Core character silhouette — regular Rogue (P design)

**Concept:** attractive, mischievous South Asian–inspired traveling guitarist, a self-assured woman with a roguish stage presence. Dark warm-brown complexion; long wavy black hair partly gathered back with an engraved gold band; visible expressive eyes, mischievous half-smile; no hat that hides her face and no veil. **This is an original fantasy musician**, not a realistic portrait or a direct copy of any real-world religious ceremonial outfit. Cultural influences may be refined in owner review.

**Wardrobe:** asymmetrical short embroidered violet/copper tunic with a sari-like plum drape anchored over **one shoulder**, side-slit layered indigo skirt/trousers suitable for travel, broad burgundy sash around waist, small hammered-brass anklets and several gold wrist bangles. Light arm/shoulder protection exists but does **not** read as Paladin plate. Feet in dark travel sandals/boots. Visible midriff can be used as an attractive fantasy styling choice, but avoid overfilling the actual game-sized body with skin tones and jewelry detail. Silhouette should remain **clean and 100% readable at base in-world dimensions**.

**Weapon identity:** a compact, exaggerated **six-string traveling guitar/lute hybrid** held diagonally across her front. Distinct **long dark neck**, **warm amber asymmetrical pear-shaped body**, **three bright strings** readable at actual size and a clearly visible strumming hand. This is *one weapon*, not a sword plus a guitar. Keep its body above/clear of her grounding feet; avoid widening the actual gameplay collision radius. Its tone is brash plucked/percussive strings, not EDM or orchestral vocals. Instrument may be called a guitar in player-facing text even if its medieval craftsmanship is lute-like.

**Readability:** compared with Paladin (armor + sword), Mage (staff + cooler robe), Ranger (bow + quiver), she is unmistakable from the **guitar silhouette, diagonal instrument neck, purple/copper asymmetry, hair, jewelry and bright drape**. Avoid giving her bow, big metal shoulder plates, mage staff or large helmet. Her range advantage is midrange sound pressure, not a visually drawn second weapon. Use restrained critical punctuation, sparing note motif (one or two small short-lived notes at contact), and existing “sound wave” line/fan cue geometry on legal cast only; no body movement or attack frame.

**Suggested limited palette (P):**
- skin: warm deep brown #986548; darker contour #694634
- hair: #1b1723 with subtle warm brown highlights
- cloth primary: deep plum #614163 and darker violet #382b4e
- secondary: rust/copper #ba6e42; tiny turquoise detail #5f9a9c
- jewelry/strings: soft brass #d6b16b
- guitar: amber wood #a96537 with dark neck #38261f

Palette codes are visual reference proposals only. Confirm contrast against all five regions and both light/night conditions; do not pretend these have been tested on devices.

### Exact still-frame construction recommendations

In \`visuals.js\` add one **Rogue branch** in the existing \`hero(role)\` / \`human(role)\` pipeline, or a **single authored static asset** with procedural fallback. Preserve the existing hero foot anchor, proportions and camera scaling. At minimum represent hair, face, purple drape, right-hand guitar body, high diagonal neck, strings and two feet. Avoid adding run frames or emitting any per-frame vectors with dynamic costume state. Procedural drawing is naturally replayed by renderer's existing static art pipeline; do not create new dynamic body state or invalidate sprite cache each attack.

Existing art review/asset contract applies if a raster is later made: one approved, tested static hero image and its asset manifest/offline inclusion, not a sprite sheet. If no raster is approved, the original procedural depiction alone is a valid minimal implementation.

## 2. Crowned Rogue: her Dark Lord appearance (P design)

**Concept:** she does not become a generic dark-armored knight; she becomes an **imperial, audacious Bard-Queen / Dark Lady of Discord**, the same identifiable woman and guitar with a more authoritarian, sinister stage-royalty silhouette.

- **Crown:** narrow, asymmetric obsidian-and-gold **five-point circlet** (not a broad helmet), with a small purple gem at the forehead. Face and long hair remain visible so she is recognizable as the Rogue. A thin rim/diadem can convey Dark Lord sovereignty at sprite scale.
- **Robes:** her everyday asymmetrical drape graduates to **black-violet royal mantle edged with muted gold**; short crimson interior lining visible at the front and raised shoulder cloth. A more elaborate gold waist sash, angular gold cuffs and a few sharp crown motifs create an evil ruler without replacing her body type or costume silhouette.
- **Instrument:** still the same distinctive guitar shape, now **black-lacquered mahogany with gold strings and a violet gem sound-hole**; recognizable amber accent on edge/back. No second sword, staff or summoning wand. She rules with the instrument she played as a Rogue.
- **Face/attitude:** slight knowing, smug grin and firm chin; cosmetic darker eye shadow / small gold earrings. No glowing full-body aura necessary; if the current crowned renderer supports one small static halo/cloth trim, keep it subtle. **No crown animation**.
- **Footprint:** identical actor bounds and collision geometry. Crop, anchor, darkness and scaling consistent with existing \`crownedHero(role)\` and \`e.crowned\` dispatch. The current sprite module already routes crowned heroes to procedural art because static crown details have not been represented in generic source sprites; extend that small branch for Rogue.
- **Display copy (P):** English “Rogue” or “Bard-Queen”; Spanish “Pícara” or “Barda de la Discordia” until owner chooses exact translated title. The existing Dark Lord / throne narrative retains its meaning, victory and postgame mechanics; this is **art and name copy**, not a second boss class or transformation combat mode.

Regular vs Crowned should be visibly related: **same hair, complexion, facial features, guitar orientation and instrument proportions**. Only royal styling, darker palette, crown and ornamentation change. It must be clear that the *same hero* took the throne, not a newly summoned villain.

## 3. Captured monsters and allied art

Charmed companions retain their species **visual identity and source subtype** (melee goblin not a human Soldier, ranged goblin not an ordinary human Archer), but use ally selection/foot anchors/label coloration. Reuse existing **static enemy visuals** or species-specific procedural draw contracts, NOT hostile behavior/ownership. If the actor is stored internally as Soldier/Archer for reuse, presentation must use its trusted charmed provenance before generic \`allyBodyKind\` would otherwise choose human or generic goblin archer.

Ringleaders/captains/bosses do not gain companion art via Charm; owner already forbade conversion. Boss pets keep their exact existing appearance and source-specific pet renderer. All new allied monster art is the existing corresponding static monster depiction, not a new unique pet art collection.

## 4. Lightweight combat appearance (no animation)

| Gameplay event | Existing-style proposed portrayal | Explicit prohibition |
|---|---|---|
| Normal basic guitar riff | **one** brief partial arc / 2–3 short amber music ticks drawn at legal release/contacts | No dynamic strumming body, wavefront entity, scrolling notes |
| Third auto combo | slightly wider static pulse/contact flash, fades with existing visual event lifespan | No persistent singer or multi-phase dance routine |
| Charm success | brief heart + tiny note above **one** converted enemy, plus ally color/name change | No repeated confetti or per-frame affection halo |
| Interrupt | short broken-note glyph at actually interrupted enemy | Do not fake contact, no permanent screen overlay |
| Slow/debt/DoT | reuse legible existing status marks and one small musical variant | No new looping particle or unbounded status billboard |
| Placed trap | compact fixed floor glyph + normal timed warning/contact; max 2 | No complex interactive trap sculpture or dozens of invisible actors |
| Endure | 1 HP marker, momentary purple-gold pulse and existing 2-second status indicator | No hero pose, invincibility full-body shader or drawn animation |
| Crowned appearance | one static royal outfit variant in existing procedural pipeline | No animated transformation or new boss assets |

**Audio:** consider a limited synthesis palette of three short percussive string notes + one dissonant accent, wired through existing audio volume/mute/reduced-effects infrastructure; never play a looping song or dynamically synthesize many tracks for her ordinary 0.85s basic. If existing source takes no additional audio safely, default sound fallback is acceptable.

## 5. Required visual proof before merge of any later implementation

One comparative still image set (normal and crowned Rogue) at **native desktop AND 375px phone scale**, by day and low-light, against regional terrain and next to all three current heroes; guitar face/strings and skin contrast must survive actual display. One sample melee goblin and one ranged goblin converted to friendly art, with pet beside them and nameplate/culling. Verify ordinary/projectile/critical cues and authored boss warning readability, reduced motion, main Canvas and opt-in Pixi, no Javascript errors, offline static asset load and unchanged gameplay hitbox. No approval should be inferred from a conceptual palette/spec alone.

**Art handoff status:** proposed text contract, **no canonical drawn Rogue sprite has been created or approved**. If graphics are desired during later review, generate one *static normal character sheet* and one *static crowned comparison* for approval, then adapt to existing procedural/raster pipeline as a separate scope. This PR is not pretending those assets exist.
