# Mage hairstyle quick fix — 20 October 2026

Joel requested a younger, more stylish Mage hairstyle across related appearances, then clarified that it must fit her existing headgear. He requested a very quick change with no tests. The mentioned quality-of-life idea was withdrawn and is excluded.

Dev.92 replaces the short silver bob with a swept fringe, layered side locks and a side ponytail. The ponytail root sits below/behind the witch-hat brim and clears its right edge. The shared `mageHead` carries this hairstyle into both normal and crowned appearances; the blue hat, crown and purple face-covering scarf retain their existing shapes and layering.

The Mage remains procedural under dev.91's explicit preference. Her inactive legacy raster's canonical metadata is reconciled through the existing paired registry transaction, retaining the full prior record, original image and output bytes without claiming new generated-image acceptance. Other characters, gameplay and all dev.90 performance changes are preserved.

No tests, browser review or full CI ran. Build generation/packaging and the existing syntax step completed before the final headgear-coordinate adjustment; no runtime performance or appearance pass is claimed. Publication uses a temporary packaging-only workflow, removed after exact public-file verification.

**Published dev.92:** [PR #326](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/326) merged as `657df95348a21e4f396872dd1b2cbc4c775e3f79`. Packaging-only [run 39375505253](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/39375505253) succeeded. Exact public build/version, visuals, sprite resolver/manifest, engine, runtime, renderer and service worker match the prepared source. No tests/browser review ran. Normal release workflow restored and temporary publisher removed. [Publication receipt](evidence/MAGE_DEV92_PUBLICATION_20261020.json).
