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
