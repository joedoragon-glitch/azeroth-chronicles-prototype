# Fortification and cover-fire review — dev.109

See `docs/FORTS_RANGER_PASSAGE_20261020.md` for owner scope, concrete mechanics, audit and limits. `review.cjs` renders native sprites, scenery and actual prepared projectile metadata. The five `wall-fire-*.webp` stages show one arrow at different progress values; `wall-fire-sequence.webp` combines those positions for inspection, rather than introducing a new volley. `flight.json` records actual displayed height. `crypt-screen-sequence.webp` shows enemy-only fire over an interior screen. Renderer state purity is checked.

No wall or character redesign is included. The new shield is a fort-status cue. Concepts are requested; exact new appearance has not received a separate owner acceptance. No raster production is authorized or generated. Existing bodies, Veyra preview state and Frontier layout are preserved.
