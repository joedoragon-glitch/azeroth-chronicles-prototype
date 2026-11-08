# So I Became the Dark Lord's Problem — Greenwood Vale day/night visual design handoff

> **Published engineering and design checkpoint — 5 November 2026:** Greenwood night grading and dusk improvement merged as [PR #809](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/809) in [main `a174291`](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/a17429102390c1b08dc2a4eb14e318a9df58210c) and [published in dev.260](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/42019754434); focused/build and hosted Pages checks passed. This supersedes the earlier “draft/integration candidate” status language preserved below for historical context. The owner's actual night appearance review remains pending in the playable game. The completed paired Pixi #41996085675 returned GO on a preceding revision; later final-head #42019135431 was canceled on PR closure, not a confirmed measured PASS. Future regional work should reuse the comparison and engineering method, **not** Greenwood's exact moonlight palette.

> **Engineering integration note (5 November 2026):** The original design-only and draft statuses below are historical snapshots. The owner authorized technical merge once ready; newer main already contains published PR #821's accurate Millhaven lamp hardware, preserved by this PR. Earlier focused/PWA checks and the [Pixi paired benchmark](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41996085675) passed on the pre-integration head. The new integrated head must have its own checks before merge. Owner will perform artistic acceptance by playing the published game, not by pre-approving screenshots. Unrelated future region reviews require their own palettes and source-grounded evidence.

**Date:** 5 November 2026  
**Scope:** Game-design authority and engineering acceptance contract. This document began as design-only; **the same PR #809 now also contains a bounded Greenwood presentation-code candidate and focused tests**. No gameplay rules, terrain geometry, audio, save format, merge, or deployment changes are authorized.  
**Status:** Design analysis complete; **engineering candidate implemented on draft PR #809**. Code changes are not yet visually accepted from native before/after scene captures, merged, published, or device-verified.  
**Trigger:** Owner's three landscape-phone screenshots of Millhaven in daylight, a warm intermediate phase, and nighttime; the nighttime reads as a green night-vision-like filter instead of a believable fantasy night.

## Current engineering candidate and acceptance boundary (5 November 2026)

The owner requested that engineering continue **inside this existing PR #809**, not open a new PR for each subtask. The implementation now changes **Greenwood only** in `src/prototype/visuals.js` and `tools/webgl-pilot/pixi-scene-bridge.js`:

- A cool, neutral slate-blue nighttime gradient replaces the former green-dominant composite: upper stop `rgba(39,47,67,.64)`, lower ordinary-night stop `rgba(31,40,60,.64)`. **These are trial implementation values, not owner-approved final colors**. The tone was chosen to offset the remaining green terrain while retaining roughly similar scene brightness rather than darkening by opacity alone.
- The Greenwood sunset warmth factor is reduced to **0.76** of the existing wash; sunrise, victory sunrise, all night/day clock boundaries and other regions' wash remain unaltered.
- Existing Greenwood nighttime motes shift from warm yellow-green `#dcefa8` to cool pale `#c5cbda`. Their count, positions, motion and optimization behavior are unchanged.
- The four other region night palettes are untouched. Existing hero and practical light geometry are unchanged; the physically mounted lamp work remains held separately in #803, subject to its design acceptance.
- The existing `tools/webgl-pilot/pixi-scene-bridge.test.cjs` night palette expectation is updated; the new `tests/greenwood-day-night-design.test.cjs` checks real Canvas grade versus Pixi commands, five-region containment, sunset parity, moonlit grass/path compositing sanity, particles and darkness boundaries.

**Verification gates:** The new tests and automatic PR-focused CI must pass on the exact engineering commit. This does **not** certify the *appearance*. Native current-game source screenshots at day/sunset/night/sunrise, with matching Canvas/Pixi scenes and landscape-phone readability, remain required to call the grade artistically acceptable. No full suite, merge, publication or physical-phone certification is implied.

## 1. Intent and non-negotiable identity

Greenwood Vale is an inhabited, cultivated, forested valley. Millhaven is a place of supplies, homes, paths, refuge, orchards and travelers. Its night should feel **recognizably the same place beneath moonlight**, not like a horror green filter, a uniformly blue recolor, or a daytime screenshot with a black sheet over it.

**Art-direction sentence:** *Warm, lived-in Greenwood by day; cool, quiet, silver-blue Greenwood by night; amber hearths and lamps belong to particular places.*

Keep the established original, gently stylized painterly/procedural forms and material identities; no asset redesign or region topology work. Preserve daylight's inviting character, the existing 30-second sunset and sunrise, night gameplay, dark wilderness, relative settlement safety, all four classes, and combat clarity. Do not impose a new weather, moon-position, shadow-projection, light-source, navigation or stealth mechanic. Do not convert the village into an all-night lantern grid.

This review addresses **Greenwood only**. Other regions have individually authored palettes and are not authorized for global recoloring by association.

## 2. Evidence register — what was actually established

### A. From the owner's screenshots (visual observations)

1. **Night-vision effect — major design defect.** Night retains conspicuous green-brown grass and a muted olive field, despite darker trees and buildings. Roads and natural ground lose their daytime material separation. The night does not clearly read as moonlight.
2. **Dusk/twilight muddiness — related design defect.** The intermediate frame shifts much of the ground toward an undifferentiated yellow-brown/olive field; terrain and road distinction compresses. This can read as a sepia wash instead of changing sun angle and light.
3. **Limited spatial hierarchy — design defect.** A large part of the view is uniformly darkened. Built structures, living spaces, paths and wilderness do not always have distinct light relationships; localized lights become bright boxes in a broadly uniform dark scene.
4. **Illuminated details are promising, but some fixtures appear pasted on — separate owning work.** Warm windows and lanterns help the night read, yet the uploaded night image also shows square light panels on buildings and street-light glass. These exact physical fixture/location problems are already being addressed by independent **draft PR #803**; do not duplicate/revert that work.
5. **Hero readability is functional but compositionally staged.** The Paladin and health bar remain readable, which is important. However, a constant bright hero-centered halo should not make the nearby earth feel like a spotlight or flatten the difference between naturally lit and unlit spaces.
6. **Night airborne dots can reinforce the wrong palette.** Several faint greenish points are visible; they are minor alone but accentuate the green-filter impression if night pollen is also yellow-green.

Screenshots represent different moments/positions, not pixel-registered captures. Do **not** infer exact renderer identity, exact light intensities, or a proven timing defect from them.

### B. From current source (verified structure, not a rendered acceptance test)

- `src/prototype/engine.js::daylightPhase()` produces a presentation-only darkness/warmth progression; ordinary daytime 0–330s, sunset 330–360s, night 360–570s and sunrise 570–600s. Nightmare and ending sunrise have special cases. These time rules are **not** the design problem.
- `src/prototype/visuals.js::atmosphere()` uses Greenwood's partially transparent upper night tint `rgba(11,25,42,.48)`, grading toward approximately `rgba(9,17,30,.58)` lower in the frame. Its underlying procedural grassy terrain remains partly visible through the grade. This **plausibly explains** the retained olive-green appearance; it is an implementation contributor, not a complete pixel-verified causal proof.
- The same intended regional grades appear in `tools/webgl-pilot/pixi-scene-bridge.js`, so this design work must have **Canvas/Pixi parity** rather than a one-renderer color tweak.
- Day tint, dawn/dusk warmth, bounded hero and fixture glows, ambient motes and vignette exist. Greenwood's current night mote color `#dcefa8` is conspicuously yellow-green as a palette value; that is a secondary design review target, not evidence the motes alone cause the complaint.
- Current `src/prototype/renderer.js` passes the authoritative daylight data to Canvas; Pixi uses `src/prototype/pixi-experimental.js` and the scene bridge. The current source remains unmodified by this handoff.

### C. Current independent work that must not be conflated

- [#708](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/708) = existing environmental *functionality/parity* completion, with its earlier intentionally conservative art-scope boundary. The owner's **new** request authorizes design of a Greenwood color correction, **not** reopening its general five-region atmosphere program.
- [Draft PR #803](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/803) = mounted wall fixtures, rooftop lighting artifacts, post glass and exact Canvas/Pixi fixture locations. This handoff specifies how their light should *feel*, not how to rebuild their geometry.
- [Issue #357](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/357) = historical intermittent white sunrise flash, unproven cause on iPhone. A color-grade redesign is **not** a claimed fix for that defect; preserve investigation ownership.

## 3. Resolved design decisions

### D1 — Palette: neutral moonlit coolness, **not** green night vision

The night should shift toward **subdued blue-gray/slate and charcoal**. Grass remains recognizably grassy but its yellow-green saturation is reduced; it must not glow. Deep greens may remain in very small lit patches, not as the dominant color family of the entire screen.

Do **not** solve the issue by simply raising one nearly-black overlay's opacity: that may bury roads, actors, outlines and environmental details. And do not compensate with a saturated cyan/royal-blue blanket, purple fog, or a monochrome filter.

**Suggested color-direction samples — art references, NOT literal shader values:**

| Visual family | Day identity | Sunset identity | Night identity |
| --- | --- | --- | --- |
| Grass / meadow | Muted leafy and olive greens | Lower-chroma olive, warmed only on sun-facing portions | Low-chroma slate-olive, blue-gray shadows; no fluorescent green |
| Roads / paths | Distinct earthy tan | Warm tan in remaining light, cooler edges | Readable neutral gray-brown with cool dark margins |
| Tree canopies | Natural dark leafy green | Cool shadow sides / limited warm edges | Deep blue-green charcoal, with separable silhouette from ground |
| Wood / stone | Existing brown wood, gray stone identities | Warm sunward edges, dark cool joins | Warm materials only at actual lights; otherwise cooled brown and gray |
| Roofs / terracotta | Existing reddish earth | Muted warm rust | Dark desaturated terracotta, **not** green or cyan |
| Water where present | Existing regional surface treatment | Subtle low warm reflection, preserve material | Cooler muted blue-gray and restrained highlights, without creating new light sources |
| Lamps / occupied windows | Normally unlit or subtle where authored | Begin to read as dusk sets in | Local amber/gold source within physically present glass/openings |

Reference colors for initial exploration: moonlit shadow **#1c293b**; softer exposed ambient **#39475a**; near-dark foliage **#233139**; low-chroma night grass **#394843**; warm window/lantern center **#f3bc76**. These are **mood swatches**, not final computed screenshot targets. Actual grades must be tuned against the existing source terrain and game-scale figures.

### D2 — Value hierarchy: see the world without making it daytime

1. **Player, interaction edges, and combat cues** remain unambiguously legible. Preserve telegraphs, projectiles, target rings, sprite material separation, actor shadows and status feedback. The UI stays neutral/untinted.
2. **Walkable roads and the immediate town** remain navigable. A player must be able to distinguish road from meadow and recognize entrance, well, market and refuge at night without a personal flashlight.
3. **Inhabited windows and real lamps** are the warm focal points; shadows around them remain cool and restrained.
4. **Forest fringes and open wilderness** are quieter and deeper in value than the settlement, but trees never vanish into a single flat black shape.

Lighting should convey scene depth and composition, **not** change game visibility, enemy detection, encounter ranges or collision.

### D3 — Light must have a credible source and readable falloff

Keep existing localized light ownership: inhabited windows, physically mounted lanterns, fireplaces/forges, carried lamps. No floating rectangular highlights or fake lit windows; coordinate with PR #803. Warm light may touch nearby door frames, service-counter edges and a modest portion of adjoining ground, but it should not wash entire buildings or the crossing. Let the source itself be a little brighter than its diffuse ground pool.

**Hero safety lighting:** preserve the established modest readability benefit, but it should be broad and weak enough not to read as a yellow spotlight. If contrast is still inadequate, prioritize subtle actor/value separation, not an enormous globe around the hero. No new gameplay light radius.

**Town versus forest:** do not copy streetlights out into the wilderness simply to improve darkness. Solve baseline visibility with the ambient grade and material contrast first.

### D4 — Transitions are changing light, not changing Instagram filters

- **Daylight:** retain the current pleasant earthy/green identity. Do not regrade it globally just to prove the night changed.
- **Sunset:** a short, directional golden/copper warmth should appear while shadowed grass and roads shift cooler; avoid an equal-strength brown tint over every material. Keep landmark contrast and distinguishable paths.
- **Night:** gradually settle into cool, slightly desaturated slate/blue-gray with selective warm practical lights; no high-saturation green cast.
- **Sunrise:** move from cool night into a restrained rose/gold dawn, then the unchanged daylight identity. Existing approved sunrise timing and the special victory sunrise remain intact.

Color, atmosphere motes, light pools and vignette must **not visibly pop** at phase endpoints. The warm/cool relationships should interpolate coherently, not flicker from one treatment to another. The intermittent iPhone white-flash report #357 remains an independent engineering diagnosis.

### D5 — Atmospheric motes support the time of day

Keep the already authorized low-density Greenwood ambient particles; do not add new particle families or more emitters. Pale daytime pollen is appropriate. After dark, existing pollen should not read like conspicuous green fireflies unless such creatures are deliberately authored. Prefer very faint desaturated silver, cool cream or subdued neutral floating particles. Their apparent brightness should sit **below lamps, interaction cues and combat VFX**. Atmospheric depth must not become fog that conceals a path.

### D6 — No selective cosmetic trick that violates renderer or gameplay parity

The desired scene must be substantially the same through Canvas 2D and PixiJS/WebGL2 at normal viewing size; optimization modes may omit decorative motes/vignette as already specified, but must preserve readable grading and practical lighting. Avoid requirements for expensive full-screen blur, real-time normal maps, dynamic shadow casting or per-object night textures. This is a **bounded color/composition redesign**, not a lighting-engine rewrite.

## 4. Scene-specific composition notes from the supplied evidence

- **Millhaven Refuge:** maintain readable doorway and roof/wood/stone separation. After the physically valid sconce fix in #803, a warm source should make its entrance welcoming without outlining every board or lighting a fictitious upper window.
- **Millhaven Supplies and nearby stalls:** contrast goods/stall silhouette against grass and path; a service lantern should illuminate the *actual* stand, not sit like a pasted yellow label.
- **Road crossing and foreground path:** they are important navigation lines. The original tan road must cool and darken by night but remain distinct from meadow; do not add a luminous stripe or change road geometry.
- **Well, roadside lamp and market edge:** light should tell where the source actually sits. The post glass needs convincing metal/glass and a modest localized halo (separately authored in #803).
- **Hero at crossing:** use armor blue-gray steel, shield blue and gold detail as contrast checks. The hero must not become an unlit black silhouette nor look artificially spotlighted.
- **Treelines outside Millhaven:** darker than occupied settlement, but layered silhouettes must remain perceptible. Do not make travel-dependent exploration and combat unreadable.

## 5. Engineering-ready work package — subsequent authorization only

**The owner has now authorized a focused engineering candidate in this same draft PR. E2/E4 color-grade and mote work has been implemented provisionally; E1/E3/E5 rendered comparison and acceptance remain open. This paragraph does not authorize merge or deployment.**

**E1. Produce controlled reference frames.** Capture matching current-game scenes and presentation clock states for Greenwood's Millhaven crossing, one nearby settled lane, a meadow/orchard edge, and a forest/crypt approach. Use identical viewport, camera zoom, player/class placement and clock values between candidate/reference; capture all four phases, Canvas and Pixi. Include Optimization On/Off where materially different. Record exact code head and renderer.

**E2. Tune Greenwood's shared visual palette.** Implement a restrained, coherent night grade and any needed low-chroma terrain contribution at the presentation layer. Preserve material identities and CPU/GPU budgets. Implement one consistent effect in Canvas and Pixi, not unrelated hand-tuned values. Keep the original palette available for side-by-side comparison and rollback.

**E3. Reconcile light composition, not fixture geometry.** Coordinate with the already open #803; update only global light balance / the authorial relationship of ambient versus warm practical lighting. Do not independently rewrite its sconces/windows/lantern anchoring.

**E4. Refine twilight and low-density motes.** Ensure sunset avoids the muddy sepia wash and Greenwood night motes no longer emphasize yellow-green. Keep existing transition clocks and outcome sunrise semantics.

**E5. Focused creative and technical acceptance.** Compare saved before/after image sheets at actual landscape phone scale, not only desktop magnification; inspect Canvas/Pixi parity, phase seams, combat and interaction visibility, optimization, day baseline and performance counters. Use the smallest relevant focused checks; broad suites, merge and deployment require separate authorization.

### Design acceptance gates

- **DA-01, mood:** a blind side-by-side viewer reads nighttime as moonlit fantasy, not night-vision green, underwater teal or a bright daytime scene with a dark veil.
- **DA-02, identity:** Greenwood is still Greenwood, and materials/land use remain recognizable with no geometry/art/asset changes.
- **DA-03, transition:** the sunset is warm without muddying every surface; sunrise is continuous and does not disturb accepted timing.
- **DA-04, hierarchy:** paths, nearby interactables, steel/shield/weapon silhouettes and combat warnings are readable; wilderness feels darker without losing scene layers.
- **DA-05, practical lights:** every strong warm source belongs to a fixture or inhabited space; no unsupported roof/window rectangles; coordinate #803.
- **DA-06, parity:** Canvas/Pixi and effective optimization settings preserve the same lighting logic and contrast without relying on expensive new rendering passes.
- **DA-07, containment:** no new mobs, light-based gameplay, sound changes, road edits, scenery relocations, new weather, save changes or other-region recoloring.
- **DA-08, evidence:** post-implementation screens and focused tests document exact revision and actual limitations; no claim of published/device-verified appearance without separate evidence.

## 6. Scope ownership and disposition

**Design resolution:** Work through a *balanced low-chroma moonlit grade*, retained surface/material contrast, credible warm sources and restrained dusk values. This answers the owner's immediate complaint and the related design weaknesses seen in the same screenshots.

**Not yet established:** Whether the final palette swatches feel right on the actual game, whether Pixi and Canvas match perceptually on the owner's iPhone, and the causal explanation of historical sunrise flashes. These need separate rendered/device evidence, not speculative design claims.

**Keep separate:**
- #803 owns physical lantern/window/sconce positioning and sprite/fixture details.
- #708 owns existing environmental functionality and broader five-region technical parity.
- #357 owns intermittent transient white frames.
- This document owns **the Greenwood night/dusk visual-design brief** and its acceptance criteria only.

**Handoff decision:** **Design complete; engineering color-grade candidate present on PR #809; final merge readiness HOLD pending focused checks and real in-game visual comparison**, with creative sign-off dependent on rendered evidence. No reason to block design handoff on separate #357 diagnosis or unrelated unfinished atmosphere systems, but implementation must avoid merge conflicts with #803 and cannot be called visually accepted until tested screenshots are reviewed.
## Historical reference for the remaining regions

This Greenwood change is the method, not the template palette: for each other region, capture matched day/sunset/night/sunrise in settlement, trail and wilderness, inspect real materials and installed light fixtures, define its own color atmosphere, validate Canvas/Pixi parity and relevant performance/offline behavior, then iterate against the owner's live playtest. The four other regions must not automatically inherit Greenwood's 39/47/67 moonlight, 0.76 sunset multiplier or lantern locations. Status words mean different things: implemented, tested, merged, published and device-verified.
