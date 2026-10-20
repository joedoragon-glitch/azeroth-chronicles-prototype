# All registered sprites versus current procedural art — dev.116

Joel requested every sprite side by side with the current procedural drawing for owner review. Only the Greenwood cottage was approved for replacement; it is already live in PR #350. This gallery changes no game assets or selections.

Open `review.html` for the self-contained numbered gallery, or use the seven `comparison-*.png` sheets. Every pair has current procedural art on the left and its retained registered sprite on the right. The LIVE label records the actual dev.116 selection. Paladin, Mage, Soldier and cottage already use procedural art. Ranger, companion Archer and the other registered assets retain their current selections.

Coverage: all 33 base registrations, zero registered variants, plus all four frames from the two retained idle clips. Most bosses, pets, NPCs and other structures have no registered raster override and already use procedural drawings; they do not have a separate sprite to compare.

The current game renderer and sprite painter draw both sides from the same entity/state, region, ground anchor and authored world scale. A private in-memory resolver copy allows the review to display retired registrations; production source is unchanged. Individual pairs share magnification; different pairs may use different magnification to keep detail readable. Native resource anchoring and animation-frame rectangles remain intact. Visible crop bounds ignore alpha below 24 to prevent faint source-edge noise from shrinking the useful comparison; this does not alter the original art or independently resize the two sides. Frontier regrowth is included on both representations.

Audit: 33/33 exact base keys and 4/4 idle frames; no blank or clipped source renders and no entity-state mutations. Twenty-eight active static pairs match the production sprite API pixel for pixel; the Goblin's static fallback and four idle-frame examples use the original registered frame data/painter. All seven assembled sheets were visually inspected after awaiting image decoding, and the gallery's 74 all/category navigation selections pass the scripted DOM check. No browser or broad game suite was run for this review artifact. Exact entities, registration references, crop transforms, source hashes and coverage are in `audit.json`.

Reproduce: `node tools/visual-review/sprite-procedural-review-dev116/render.cjs`, then `node tools/visual-review/sprite-procedural-review-dev116/check-gallery.cjs`. The `cards/` images are intermediate outputs embedded in the self-contained HTML and assembled sheets.

Owner decisions pending for every remaining sprite; no blanket procedural replacement is authorized.
