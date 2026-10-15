# 15 October playtest corrections — candidate dev.58

Owner reports after release of #300: oversized humans on small Highland direwolves, including the archer variant; blocky Ogres needing an aesthetic pass; long Chronicle cards obscuring iPhone combat.

- Mounted bodies: seated human/equipment scale 0.72; mount/tack scale 1.22 about the existing paw anchor, with saddle and stirrup alignment. Lance/archer, Highlands/Mine/Treasury share the corrected helper. Wild wolves and bosses retain their existing drawings.
- Ogre body: rounded torso, connected arms/hands, face/brow/nose and curved paired tusks; retain palette, heavy silhouette, club and distinct thrower wrap/strap/stone satchel/tool. Guard, Crown and elite overlays remain. Catalog entries 021/032/258/259 and both design handoffs preserve the corrected source and original references.
- Phone announcements: long cards use available safe horizontal width, reduced padding and an inline Chronicle label. Content wraps without clipping or reducing the readable font. Normal short notices retain their compact width. Existing top placement below vitals and input pass-through remain.
- Nonurgent Chronicle/milestone notices queue during nearby hero/party combat, enemy aim/telegraphs, incoming enemy shots and residual hazards. Require 2.5 seconds of quiet. Returning to combat immediately hides a visible card and preserves its full reading time for later. Urgent warnings remain immediate. This is transient shell state; no save schema or quest-payout edits.

Local completed evidence: build, formatting and generated/asset/material/audio checks; existing rider/guard/facing/Crown composition and Ironroot scenarios; narration tests; real shell-updater tests covering quiet time, interruption/resume, urgent warnings, residual projectiles/hazards and campaign isolation. Sixteen actual Campaign/renderer captures cover both mounted and Ogre loadouts, desktop/phone at 100/150%, with save-pure draws. Isolated before/after PNGs and compressed gameplay review captures remain in the design reference folders; the review JPEGs are not pixel parity fixtures.

Browser limitation: standard Playwright Chromium download produced an empty/truncated archive; the alternate local binary was also empty. No local browser pass is claimed. The focused notice layout/interruption helper is integrated in the existing Chromium/WebKit quest/Archive path for hosted CI, including portrait and landscape phone geometry. Existing automatic required validation is unchanged; no manual full certification was started.

Candidate only. Owner merge approval remains required. No merge/deployment, gameplay balance change, original artwork replacement or generated-image acceptance is implied.
