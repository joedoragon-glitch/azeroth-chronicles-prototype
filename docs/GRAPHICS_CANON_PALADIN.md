# Canon sprite brief — Paladin

This is the first asset-specific brief under the canonical sprite contract.

The production procedural Paladin in `src/prototype/visuals.js` is the authority. This document records what is already there so the sprite can increase fidelity without changing identity.

## Canon silhouette and pose

- Compact humanoid proportions matching the current hero drawing.
- Frontal / mildly game-facing presentation; do not turn the character into a dramatic side pose.
- Shield is carried on the character's left side (screen-left).
- Sword is carried on the character's right side (screen-right).
- Cape projects behind the figure and remains visible around the lower sides.
- Feet remain directly beneath the body with the same narrow stance.
- The sprite should occupy the same apparent gameplay height as the procedural hero before detail is judged.

## Canon colors and materials

The current renderer establishes these relationships:

- base armor/clothing body: muted blue-gray (`#708c9c`);
- steel helmet/chest/shoulder treatment: the shared renderer's steel family;
- shield face: blue (`#497694`);
- cape: brown (`#785848`);
- major holy/accent marks: gold;
- leg/boot areas: dark charcoal/green-black family;
- skin remains the shared humanoid skin family where visible.

Exact raster values may use neighboring shades for material modeling, but the dominant relationships must remain visibly the same. Do not shift the Paladin toward white/gold armor, bright royal blue, black armor, or any new faction palette.

## Canon equipment and markings

Preserve all of these and add no new equipment:

- steel helmet;
- steel chest plate;
- two steel shoulder plates;
- left shield;
- right sword;
- brown cape;
- vertical gold chest mark with short horizontal crossbar;
- gold diamond/cross-like shield accent;
- small gold center accent already drawn on the body;
- existing helmet/chest seam highlights and asymmetric armor-light treatment.

Do not add:

- wings;
- halo;
- tabard;
- oversized religious iconography;
- extra belts/pouches;
- shield spikes;
- new pauldrons;
- glowing sword;
- crown;
- extra cape layers;
- heraldry not already present.

## Allowed fidelity improvements

The sprite may clarify what those existing shapes are:

- separate plate edges from under-armor;
- give the existing steel pieces restrained metallic value shifts;
- give the cape cloth folds while preserving its exact placement and mass;
- make the existing shield read as a finished shield rather than a primitive polygon;
- make the sword read cleanly at phone scale;
- make the current gold markings more legible without enlarging or multiplying them;
- provide a readable face only to the degree naturally exposed by the current helmet.

The goal is additional material information inside the established design.

## Grounding

The current game draws the shadow procedurally. The sprite must contain no baked shadow.

Ground/anchor tuning is accepted only when the character looks grounded in the same way as the procedural hero and surrounding companions. Do not lengthen the legs, enlarge the feet, or change body proportions merely to reach a preferred anchor number.

## Rejection conditions

Reject the candidate if any of these are true:

- it looks like a different Paladin design;
- the shield/sword sides change;
- armor becomes substantially bulkier or slimmer;
- the cape changes color or becomes a new dominant silhouette;
- new holy/fantasy ornaments appear;
- the palette becomes brighter or more saturated than the current hero;
- it needs gameplay scale changes to remain readable;
- it is attractive in isolation but no longer matches the procedural Paladin at a glance.

## Production status

No Paladin sprite is active in `manifest.json` yet.

The older experimental Paladin canary predates this brief. It may be inspected as historical material, but it receives no special approval and must satisfy this document exactly before any part of it is reused.
