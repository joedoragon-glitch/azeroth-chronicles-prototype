> **Historical record — 19 October 2026:** Candidate status, approvals, failures and next actions below apply to their dated checkpoints. They do not direct a new chat to resume or re-merge old work. The published snapshot is `0.9.1+snapshot.dev.78`; development is paused, with [current state](DEVELOPMENT_STATE.md) and draft #319 governing recovery. Original evidence remains below.

# PR #300 — regional transport artwork and compact HUD pre-audit (15 October 2026)

**Branch:** `implementation/director-snapshot-20261013`  
**Version:** `0.9.1+snapshot.dev.48`  
**Status:** implemented in the one draft PR; source-level checks only; not final visual or release certification.

## Director's additional requests

1. The top-left health/level/class HUD remains unnecessarily wide after the MP bar was disabled. Narrow it without losing important readouts or touchability.
2. Improve the appearance of **all visible transportation vehicles**, especially the Greenwood ↔ Flooded Marches merchant wagon and Flooded Marches ↔ Ironroot Highlands ferry. Previous wagon/ferry models looked like children's placeholder shapes. Preserve original movement/travel, pricing, ports, arrivals, saves and quest interactions.

## Source implementation

- **Phone HUD:** `styles/phone.css` reduces the portrait/landscape corner dock's capped width from 310 to **252 CSS px**. Single HP resource occupies the full remaining text column instead of sharing an obsolete two-column MP layout. Class, level and 42px menu button remain. Dormant MP restoration logic is not deleted. Desktop information dock is unchanged.
- **Merchant wagon / return wagon:** `src/prototype/visuals.js` replaces the flat box/roof/wheel primitives with a ribbed covered trading cart, planked body, cargo, axle, eight-spoke wheels, lantern, four-legged draft horse, reins and hitch.
- **Reedport / Stonecross ferry:** shallow working ferry, multilayer hull and planked deck, rail, fenders, mooring details, tied loads, lantern, ferryman, river steering pole and localized marsh versus highland materials. **Not a triangular toy sail**. Existing authored harbors and landing coordinates are unchanged.
- **Ironroot / Frontier pack-beast caravan:** four-leg silhouette, layered pack animal, humps, saddle, hanging bundles, bridles/straps and banner.
- **Frontier civilian dragon rider:** existing dragon retained, visually differentiated as a courier with leather saddle, tack, panniers and pennant; military aviation bosses untouched.
- The existing single transport marker IDs and `🐎` / `⛵` / `🐫` / `🐉` route identities still select visual families. Hidden interaction-only Crown travel hubs remain intentionally vehicle-free, not given fictional static vehicles.
- Transport `unscaledHeight` now reserves **70–82 base units** (based on route vehicle) for the taller art and its nameplate. No enemy, quest, hitbox, passage, fare, NPC coordinate, travel identifier or save schema altered.
- Version carriers: `package.json`, `package-lock.json`, `src/prototype/build-info.js`, `sw.js` agree on dev.48.

## Evidence performed (not inferred)

- Parsed exact edited `visuals.js` in a JavaScript function compiler: **PASS**.
- Evaluated the source's actual `PrototypeVisuals.draw()` with instrumented Canvas methods, for wagon, Marches ferry, Highlands ferry, camel caravan and dragon courier: **five of five execute without errors**. Observed fill/stroke paths and updated label heights; this proves running draw code, **not appearance quality or legibility**.
- `styles/phone.css` source has the 252px caps (portrait and landscape) and one-column HP meter: **PASS** source audit.
- Added `tests/snapshot-transport-hud-preaudit.test.cjs` for route-preserving procedural transport signatures and HUD source contracts. **Authored only; new Node test not yet run in hosted CI.**
- The full exact-head format/Node/Chromium/WebKit/PWA/saves/AV audit is **still deferred** to the final coherent overnight milestone by director policy. No appearance approval is implied by path counts or syntactic checks.

## Final player-facing visual acceptance work (OPEN)

Review native render at **150% camera** on desktop and phone portrait/landscape, both day and night. Verify that the cart looks recognizably horse-drawn and proportionate to neighboring Greenwood houses, the wagon's rear Marches stand and characters; check no cart/horse encroachment on the functioning road or another named location. At both ferry docks verify boat actually reads as a ferry (not a tiny sailboat), passengers/cargo/pole are legible, and the drawing fits water/shore/dock. Inspect pack beast and dragon courier identities too. Verify the enlarged silhouettes have readable high-priority names without overlapping nearby NPC/building labels. Inspect HP/level/class fit at 320/375/393 phone width, 800/844 landscape, and mobile safe areas; menu and health touches must remain usable. If procedural artwork still looks flat at actual native pixels, replace it with approved original-quality assets rather than accepting more geometric detail as automatically artistic quality.

## Known unrelated exact-head CI debt

At dev.47 GitHub run `38665099827`, the main `pr-check` failed **before gameplay tests** at `format:check` (15 files), while the WebKit `rogue-browser.test.cjs` reached a stale `signature countdown rendered` assertion after the approved elite Rogue switch to anonymous actor-anchored cast bars. Resolve these at the combined certification gate without weakening actual Rogue mechanics. Earlier phone WebKit regional gameplay checks passed only their executed prefix. Later CI must be assessed at the actual candidate SHA.

**No PR merge, main change, deployment, release, tag or community publication authorized.**
