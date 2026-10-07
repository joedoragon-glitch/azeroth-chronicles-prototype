# Project working rules

- The multi-file Campaign application is canonical. Never require a self-contained HTML release or impose obsolete single-file limits.
- Read `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_STATE.md` and relevant gameplay decisions before changing a subsystem. Preserve unfinished authored maps and the procedural sprite canon.
- Desktop/Chromebook and phone share the campaign engine but have distinct presentation. Do not infer phone mode from window width alone or restore touch controls on the desktop screen.
- Keep the v4 save schema and existing keys compatible. Preserve original legacy backups. Crowns are the player-facing currency; internal `gold` fields remain compatible.
- Keep combat geometry and timing authoritative in the engine/rules. Presentation changes must not alter balance or collision to match drawings.
- Use the owning module instead of expanding `app.js` or `engine.js` indiscriminately. New runtime files belong in the asset inventory and generated entry graph.
- After runtime changes, bump the package version, run `npm run build`, then `npm run format:check`, `npm run check` and appropriate tests. `npm test` discovers non-browser suites; the browser matrix must exercise relevant device paths.
- Commit generated entries and the service worker. Publish only tested artifacts. Deployment authorization comes from the user's task, not this file.
- Do not interrupt authorized implementation with an extra design-approval round. Implement, verify and make results playable; request clarification only when genuinely necessary.
