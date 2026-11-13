# Sprite Showroom — v0.9.2 interaction/design audit and implementation specification

**Scope decision, November 13, 2026:** improve the **existing Sprite Showroom**, not add a Visual Asset Library as a competing route, new product, or separate resource. The established comparison tool (`tools/sprites/showroom.html`, stylesheet, script, and `sprite-pipeline.cjs showroom`) remains the owner of artwork review. Its public browsing mode is its default, while its generated per-candidate comparison remains accessible in the **same interface** when an exact `comparison.json` exists. The separate audio room remains separate because its medium and interaction differ.

## Findings from existing design audit

- Current sprite showroom: correctly prioritizes canonical/candidate/overlay and 150%-camera 12-size lighting comparisons, but has **no catalog, navigation or stable deep link**, a single generated candidate, narrow visual hierarchy, and a custom local artifact per review. Preserve the exact comparison semantics and existing browser test identifiers.
- Sound room: successful standalone catalog, filters, deep links and independent-of-save contract. However, its controls/scroll length make poor visual-gallery defaults; **do not** copy its giant form or sticky audio player.
- October `assessment-original-template.html`: useful image-dominant grid, search, pagination, zoom and notes; **not** appropriate as the modern library's immutable all-at-once embedded-image HTML, dated 513 'live' snapshot or approval recorder. Show the 513 dated cases, as dated cases, only after their fixture provenance is clear.
- Repository: 75 exact source fixtures, 32 registered raster identities, many current procedural-only families and 513 historical review fixtures. A title and PNG filename alone cannot determine whether the renderer uses a raster. Maintain an explicit selected/retained/archived distinction and never promise a full-world gameplay screenshot from a cropped isolated preview.

## Primary user journey (minimal friction)

1. Open **Sprite Showroom** from one persistent public URL. The title and navigation never force the user to choose between 'gallery' and 'comparison generator'.
2. The opening fold presents **search**, one category filter, one region filter, one representation filter, and a compact visible result count. No production-contract jargon as primary labels.
3. Browse visual cards with recognizable thumbnail, readable title, location and a single truthful status. Selecting a card opens a **single, spacious inspector** without replacing the entire page; advance to next/previous item with real controls. On phone inspector moves above the results and the chosen asset scrolls into view.
4. Inspector starts with **'What the player uses'**; procedural reference, retained/registered sprite, and comparison are clear view tabs if applicable. Show real runtime resolver choice for current exact fixture, not 'approved' just because a raster registration exists. A missing preview says why rather than silently drawing a blank canvas.
5. One copy-link button creates a stable URL with a validated identity and optional dated case state, usable when discussing a specific piece of artwork in ChatGPT. No login, player save access or game boot.
6. Advanced information—exact key, catalog no., source/renderer, revision hashes, dated review provenance—belongs in a collapsible panel. Creative feedback can be copied as a note without claiming the owner has approved an artwork revision.

## Visual identity and composition

Use the game's existing subdued forest/ink/bronze design language, crisp typography and restrained framing. Main canvas is a spacious neutral 'inspection studio' with a subtle transparency checker or unobtrusive matte, not a crowded stat dashboard. Make the art the hero, not the metadata. Thumb cards use readable labels and not several competing badge colors. Desktop: responsive browse rail and generous selected inspector. Phone: single-column browsing, touch-target controls (44px+), no horizontally clipped comparisons. Visible focus and keyboard support; reduced motion respected. Search/filter state survives selection but never writes to the player's storage.

## Engineering and freshness principles

- Source of truth: current sprite/material manifests, exact sprite fixtures, actual `PrototypeSprites.definitionFor`, and `PrototypeVisuals.draw` plus authored helper modules. Dated handoff fixtures may provide **additional historical cases** with clear dating, never treated as modern game-instance evidence.
- Current procedural previews paint **on demand** from real current drawing code with existing entity state. Raster previews use committed image paths and existing metadata; do **not** invoke image-generation or snapshot regeneration on navigation. Placeholders must indicate unsupported world-space-only effects rather than silently invent a representation.
- Rebuilding a tiny JSON catalog when metadata changes is cheap; **no per-image gallery rebuild**. Individual raster revisions already have immutable SHA-addressed filenames; browser loads new path only for changed entry. Procedural previews read current painter loaded with the page; a common renderer change invalidates all affected views automatically after deploy.
- Preserve focused `_sprite-preview` behavior and API for sprite generation and tests. Do not call it the public gallery; the same showroom CSS/JS can host both.
- Optional archive images are lazy, never put in app-shell/PWA eager cache. All current indexed sprites must still work without the archive or network dependency beyond local site.
- Site packaging and tests must enforce exact paths, no uncontrolled access to original private working files, no save state, category/search/deep-link accuracy and public build correctness. Device/browser appearance acceptance remains a distinct stage.

## Anti-patterns rejected

No second independently maintained asset viewer; no 513-image base64 page; no 'every asset is pending' backlog; no monolithic regeneration of screenshots on sprite edits; no misleading 'this is exactly the full game view' for isolated bodies; no owner-approval buttons tied directly to source mutations; no duplicate persistent registry.

## Acceptance checkpoints

- Design: search-to-art in two interactions; compare procedural and raster in place; move next/previous without losing filters; phone works without a side-scrolling three-column compare.
- Catalog: each of 75 current exact fixtures resolves to one known identity; all 32 active rasters can be found and classified; historical cases clearly dated; archive absent cannot break current entries.
- Freshness: changed sprite manifest or image path affects only its own media; procedural source changes require no hand-generated image refresh.
- Validation: focused tests pass; public site contains showroom; existing local single-candidate comparison works; no game files, saves, merges or player PWA updated as a side effect.


## Real-browser design refinement (13 November 2026)

A focused Chromium run produced **full-page desktop (1280 px) and phone (393 px) screenshots**; the initial browse-mode checks succeeded (see [Actions #43399538802](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/43399538802) and its retained screenshot artifact). This was not a mere wireframe or speculative style audit. The screenshots revealed specific usability improvements:

- At authentic **150% camera scale**, characters and some small props occupied too little of the inspection stage. The **default is now an explicitly labeled studio close-up**, with selectable 100%, **150% game**, and 200% game views. The paired procedural/raster comparison shares a common magnification; no studio close-up is mislabeled as native game-camera size.
- Canvas thumbnails are intentionally drawn only when scrolled into the viewport. Full-page automated capture must scroll through the cards before taking its screenshot, rather than recording dozens of apparently empty boxes that would otherwise paint on user scroll.
- Search results rank exact stable identity matches before approximate prefixes. After filtering, the inspector follows the first visible matching identity rather than continuing to show an unrelated previous selection; phone filter typing does **not** cause automatic scroll jumps.
- Each thumbnail paints its **own identity** rather than accidentally inheriting the currently selected card's revision; the selected revision dropdown also exposes registered animation frame files, with atlas crop support.
- Review notes remain in ephemeral per-asset browser memory during the current showroom session, without touching saved campaigns or claiming artistic approval.

The visual design uses restrained ink/forest/gold contrast, image-first cards, a desktop sticky inspector, and a single-column inspector-above-catalog layout on narrow phones. Source and device-fidelity limitations remain as described above. Cosmetic styling does not override asset/source correctness.


## Current-world coverage and bilingual design validation (13 November 2026)

The first browsable implementation exposed a practical audit gap: the 75 prepared sprite contracts and the October 513-case review do **not** include the playable Rogue. A fresh source-derived world census now enters **19** authored areas with two deterministic sample streams, inspects **5,680** entity instances, and records **585** distinct contemporary source fixtures, including all **four** playable heroes. These merge with existing exact contracts and the 513 dated handoffs by stable identity: the **initial, pre-usability-audit** checked fixture baseline contained **1,108 distinct entries**. Subsequent source-backed deduplication now groups shared generic artwork with regional variants; the live index/test receipt, not this old count, is authoritative. A shared current/historical identity has one card with extra dated states, not duplicate cards. This is a **source-instance census**, not an earned campaign walkthrough or exhaustive dynamic animation/VFX certification. Different scene-time, progression and gear variants may still require bounded fixture additions and later owner/device inspection.

The showroom remains independent of the campaign and its save-locales. It now has a small explicit **English / Español** control. Visible chrome, filters, region/category names, status, inspector metadata, notes, and deep-link language selection can switch without reloading media or changing gameplay language. Source-facing names/identifiers, exact artist-authored labels and lore terms remain stable rather than inventing translations; this is deliberate so technical and artistic review refer to the same identity. Extra dated-state titles are retained with provenance. Review acceptance still belongs to the owner, not to the language toggle.

Additional browser-derived refinements: single-state or inapplicable revision selectors are hidden; cards retain native button semantics within accessible list items; selecting a filtered result updates the inspector; next/previous controls reveal the next page and disable at list boundaries. A deterministic Chromium suite covers desktop and 393-pixel phone browsing, Rogue pixels, dated/current overlap, bilingual links and the original six-profile focused comparison mode. See the current PR's exact-head CI before treating these as final validated results.


## Current usability and provenance audit — 13 November 2026 (later owner direction)

The owner requested a separate audit of **poor organization, navigation, explanations, exact asset identification, procedural-versus-sprite clarity, real code/design visibility, and low-effort updates**. This pass reexamined the *actual* 1280px and 393px Chromium screenshots (not merely the DOM and unit tests) and found functional but poorly navigable patterns:

| Finding from visual/source review | Corrective disposition on this same draft PR |
|---|---|
| A huge "World & scenery" collection and historical cases mixed with current art overwhelm browsing | Default to **Current game artwork**, with separate **Historical reviews** and **All**. Use five broad categories with live counts. Reveal a second-level category or authored area **only when relevant**. The search also indexes exact IDs, tags, roles, and source areas |
| Regional candidate keys made identical generic barrels, crates and other shared props appear repeatedly in different areas | Consolidate unregistered shared procedural art into **one stable semantic identity** with selectable area/region states. Preserve each sprite-registered or exact production-contract regional identity. Region filtering **must open that region's actual fixture**, not Greenwood by default |
| "Raster selected", "procedural", "retained" and camera/lighting controls were not self-explanatory | Use direct status wording: **Uses sprite**, **Procedural only**, **Procedural · sprite retained**. Add short “How to browse and compare” guidance and view-specific explanations. Explicitly distinguish studio magnification, 150% isolated game scale and day/night study tint from full scene acceptance |
| Code identity was technical metadata only; a reviewer could not read **what the actual procedural painter uses** or the owner’s recorded decisions | Add **How this artwork is defined — code and design** inside the existing inspector. Show the exact selected state/renderer input, actual current selected raster key, registered/retained image definition, owner design traits when recorded and the dated October review summary where present. Load current game-module code **only on request**, show source lines and a link to that complete built file |
| A source text match may be misconstrued as complete authoritative art logic | Label matched code excerpts as **navigation aids** with exact file and line numbers. If no token matches, show the real module opening and explain the shared-function limitation. Current renderer input is machine-readable, not synthesized from prose |
| A changed sprite/painter could leave an old showroom screenshot or stale browser code | Do **not** regenerate an HTML page full of asset screenshots. The build derives a small metadata index from current source entities, the exact resolver, approved sprite/material manifests, dated handoffs and recorded design decisions. Raster filenames are content-addressed. Painter, data, visual rules and manifest files receive source-derived SHA revision query keys, invalidating affected cached code without manually requesting new images |
| Dense controls or long source code could dominate on a small phone | Keep exact source details/help collapsed by default, use a flex-wrapping compact filter row, touch-sized controls, one-column inspector, responsive thumbnails and 24-item progressive browsing. EN/ES remains in the same showroom. No browser state is written to the player's saves |

**Source of truth and boundaries.** Current fixture statuses come from the checked-in `PrototypeSprites.definitionFor` resolver and canvas fallback; the current painter is loaded from the same game sources in the built site. The deterministic world census samples 19 authored areas; it is not an earned Normal/Nightmare/TRUE campaign walkthrough, and does not individually reproduce full-world lighting, water shaders, inventory UI, every combat animation frame or physical Pixi/Canvas parity. Dated review descriptions remain distinct from current source decisions. Inapplicable controls are hidden, not silently clickable.

**Reproducibility.** `scripts/sprite-showroom-index.cjs` owns the automatic catalog build; `scripts/sprite-showroom-world.cjs` owns the current scene-entity census; `tools/sprites/showroom.html` is still the **single** user-facing review page. `tests/sprite-showroom-index.test.cjs`, `tests/sprite-showroom-library.test.cjs`, `tests/sprite-showroom-world.test.cjs` and `tests/sprite-showroom-library-browser.test.cjs` guard current identity mapping, automatic source hashes, region grouping, exact source input, desktop/phone interactions and archive separation. The preexisting six-profile focused sprite comparison runs in the same workflow. Exact-head GitHub CI should be checked before artistic acceptance or publication.

**No v0.9.2 scope expansion.** These are engineering/design/navigation corrections. No sprite generation, raster activation, original art modification, gameplay save change, new class, duplicate gallery, merge or deployment is authorized by this audit.


## Owner screenshot duplicate-asset diagnosis and targeted repair (13 November 2026)

The owner visually identified two apparently identical **Crate**, **Drying Rack**, **Feed Crate**, and **Game Table** cards, despite the earlier category/regional de-duplication. A live source-derived index diagnostic reproduced **two distinct IDs for each name**, with identical current procedural `structure` and different scene context. Specifically:

| Repeated artwork | Generic showroom identity | Incorrect second identity | Source context that triggered the split |
|---|---|---|---|
| Crate | `shared:prop:crate` | `world:prop:crate` | `sceneRole: sorting` and occupied cellar |
| Drying Rack | `shared:prop:drying-rack` | `world:prop:drying-rack` | `sceneRole: pages` / Crown agriculture processing |
| Feed Crate | `shared:prop:feed-crate` | `world:prop:feed-crate` | `sceneRole: dreadmaw-animal-husbandry` |
| Game Table | `shared:prop:game-table` | `world:prop:game-table` | `sceneRole: kinetic-collection` / occupied crypt or cellar |

**Root cause:** `PrototypeSprites.candidateKeys` intentionally returns no sprite candidate for entities with `sceneRole` (or certain `presentation` states). The showroom used that result to choose an **identity**, incorrectly treating a gameplay placement/role as an entirely new drawing. Both paths ultimately used the same procedural `structure` art; this was not duplicate game artwork or an indication that the owner approved separate sprites.

**Correction:** `scripts/sprite-showroom-world.cjs` now identifies **unregistered, non-region-overridden generic props by structure before sprite candidate lookup**, so scene roles cannot fork the same drawing. Active sprite registrations and exact production-contract keys remain protected from unsafe automatic merging. The source census first collects distinct area, region and role fixtures, then deterministically selects up to 12 representative states, prioritizing coverage of real regions and specialized roles rather than keeping only the first 10 area samples. Every merged card retains its source areas and searchable identities; selected regional inspection is still driven by the actual source fixture.

**Regression evidence:** `tests/sprite-showroom-library.test.cjs` asserts a single semantic ID for all four reports, the expected regional coverage, an ordinary fixture **and** a real role-specific fixture, plus retained registered sprite identities. `tests/sprite-showroom-library-browser.test.cjs` also searches all four names at desktop/phone sizes and requires only one card bearing each exact title. At intermediate code head `45a542a1`, focused inventory, Chromium showroom and browser PWA checks all passed; the resulting catalog had **972** distinct entries, **445** contemporary world identities and still **513** dated reference cases. Check the latest amended head's runs before release acceptance.

**Not all repeated names are interchangeable artwork:** The follow-on diagnostic also found a `Crown Orc Guard` using two different enemy species, `Neri the Alchemist` as captive versus alchemist NPC, and `Scornfang Memoranda` as a physical prop versus interactive scene-detail NPC; these must not be silently merged by visible text alone. There are also unrelated generic `Prop` fallbacks and name collisions for some region/resource/transport entries that warrant separate source and visual validation rather than an automatic global name-based deduplication. The correction deliberately does not modify gameplay classes, scene roles, source art, sprite selections, manifests or saves.
