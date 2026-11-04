# Brand identity — official title and safe legacy identifiers

**Original author decision: 11 October 2026; current-use review: 31 October 2026.** Apply this living naming rule with [Development state](DEVELOPMENT_STATE.md) and current [agent/owner authorization](../AGENTS.md). Old development-break instructions and historic release permissions are not current work orders.

## Official title

**So I Became the Dark Lord's Problem**

This is the author-selected English game name, replacing **Azeroth Chronicles** in current player-facing branding. It is an independent original fantasy RPG, not a Warcraft/Azeroth product.

Spanish-language promotional rendering: **Así que me convertí en el problema del Señor Oscuro**. The English title remains the canonical name in the game, listings and install metadata. This title is promotional copy, not a second product. The later snapshot also includes a minimal English/Spanish presentation option; it is partial localization rather than a fully translated campaign.

Tagline for draft promotion: **He conquered the world. He wasn't expecting you.**

## Naming rule for current documentation

**So I Became the Dark Lord's Problem** is the name of the present game, including when writing new or updating maintained player guides, design contracts, feature descriptions, issue/PR summaries, handoffs and development discussions. Refer to it as an **independent original fantasy RPG**, not as a Warcraft project, spin-off or renamed Warcraft game. A document should not use **Azeroth Chronicles** as the current game's title simply because it appears in the repository URL.

**Azeroth Chronicles** is the **former development name**. Keep it when describing the historical project, quoting or identifying an old document, or writing an exact technical identifier such as the existing GitHub repository slug, GitHub Pages URL, historical branch, archived asset, package identifier, persistent save key or cache key. Those identifiers are not branding instructions. Do not mechanically rename them or break working links; the repository itself is deliberately **not being renamed**.

In historical records, preserve the original titles, dates, release receipts and author decisions. If an older document could be mistaken for present-day guidance, add a clearly labeled contemporary note pointing to this policy and [current development state](DEVELOPMENT_STATE.md) instead of silently rewriting history. There is no verified date in these records that establishes the precise moment the concept became independent; do not invent one. The creator has raised the companion-system design as a possible turning point, not a dated historical finding.

## Image-generation prompt safety

Every new game-related image request—character sprites, development jokes, memes, posters, logos, menus, splash art and promotional images—must use **So I Became the Dark Lord's Problem** when a game name is necessary. Transparent sprites should have no title, label or watermark. Do not infer the public brand from legacy source filenames, the repository slug or earlier image-generation requests. The maintained [sprite prompt catalog](GRAPHICS_CANON_SPRITE_PROMPTS.md) now uses the official title while preserving unused artwork, original masters, revisions and prior approval hashes. This is a naming correction, not authorization to generate or publish artwork.

## Definitive installed-app icon — owner selection, 31 October 2026

**Final artistic approval:** The creator selected the exact full-resolution, standalone **Classic Rising / The Rising Trouble** icon generated in the final design round. This selection supersedes the earlier provisional crown-and-violet PWA icon; it is not permission to redesign, restyle, recolor, simplify, or regenerate the final image. The five-option concept sheet and A–E variant board are historical explorations, **not** source artwork for export. The exact approved standalone 1254×1254 RGB PNG is retained byte-for-byte in `assets/branding/rising-trouble-approved-master.png` (SHA-256 `bf55aa52eb40d992af4f848c2e8c273b6d5890a00a2393d3c99aa5ce32dc18c1`).

The approved image depicts a tilted gold crown with purple gemstone details, two glowing violet eyes in shadow, a bright gold-white star-spark and curved golden light trail rising through swirling violet energy, within a rounded golden frame on a midnight-dark field. The star-spark represents the player's unexpected threat to the Dark Lord: **the trouble, not simply the ruler**. The image deliberately blends heroic and mischievous fantasy without naming any player class.

The game retains its existing `icons/icon-192.png` and `icons/icon-512.png` paths, generated from this master by proportional, full-canvas Lanczos resizing only; **no crop, new illustration or compositional adjustment**. Source export SHA-256: 192×192 `6e55411da2918d02bff5ce153b13613222a39462b2d91b26e66a87a248276cc7`, 512×512 `cb5e1adb3c7bac13dc322c381a878e5967b4efacbef423ef78e8a6935fa575fe`. The two PNGs remain standard-purpose (`any`), not asserted mask-safe; some launchers may crop the gold border. Existing PWA `id`, `scope`, entrypoints, service-worker registration, saves and legacy technical identifiers remain intact.

**Development status:** The design itself has final creator approval. Code implementation, focused verification, GitHub merge, Pages publication, and observation of the installed icon on a real device are distinct gates, documented in [Development state](DEVELOPMENT_STATE.md) and the implementation PR. Do not mistake the final art approval for automatic publication or physical-device verification.

## Story connection

The Dark Lord already controls the five regions. The hero begins in Greenwood Vale, rescues captive instructors and craftspeople, grows a companion expedition, traverses the occupied regions and challenges the ruling regime. The follow-on Awakening and eventual peaceful ending remain unchanged. The name is playful, but neither the world nor its characters are retconned into parody.

## Safe change boundary

- Keep current game-page titles and metadata, PWA name/short label, install copy, README and release-facing title consistent with the official title; keep canonical procedural character and world art.
- Preserve the GitHub repository slug, Pages URL, PWA `id`, `scope`, `start_url`, service-worker registration location and cache-prefix migration behavior.
- Preserve v4 campaign saves, local storage identifiers, exported/importable save formats and existing filename conventions for old backups. Do not rename internal package, sprite keys, score IDs, or archived provenance.
- Historic release records, artwork-generation provenance, archived documentation, independent legacy entrypoints and source identifiers may still carry the former title. They are history/compatibility, not the current public brand.
- Use the creator-selected **definitive Classic Rising icon** exactly as archived in `assets/branding/rising-trouble-approved-master.png` for the installed app. Do not substitute prior provisional imagery, the concept-sheet thumbnails, rejected variants, or an AI reinterpretation. Other marketing key art remains a separate deliverable.
- Branding alone establishes no release evidence. For the latest verified release and acceptance consult [Development state](DEVELOPMENT_STATE.md); [October Community Snapshot release notes](V09_RELEASE_NOTES.md) describe an earlier milestone, not a live status feed.

## Remaining work

After the definitive icon candidate is merged and published, verify the installed icon, title readability, offline update, save retention and real-device behavior in the normal release gate. Verify trademark, storefront and social-handle availability before commercial promotion. Do not infer legal clearance from a preliminary search.
